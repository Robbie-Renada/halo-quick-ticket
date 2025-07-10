import HaloAuth from "./auth";

export interface HaloUser {
  id: string;
  name: string;
  site_name: string;
  client_name: string;
  site_id_int: number;
  client_id: string;
  displayName: string; // This will be the formatted display name
}

export interface HaloUserResponse {
  users: HaloUser[];
}

class UserService {
  private async getApiConfig(): Promise<{ apiUrl: string; token: string }> {
    const token = await HaloAuth.getAuthToken();
    if (!token) {
      throw new Error("No authentication token available");
    }

    const settings = await chrome.storage.sync.get(["apiUrl"]);
    if (!settings.apiUrl) {
      throw new Error("API URL not configured");
    }

    return {
      apiUrl: settings.apiUrl,
      token,
    };
  }

  async fetchUsers(search: string = ""): Promise<HaloUser[]> {
    try {
      const { apiUrl, token } = await this.getApiConfig();

      const params = new URLSearchParams({
        count: "10",
        listagentuserfirst: "true",
        includeserviceaccount: "false",
        onlyprospects: "false",
        onlyusers: "false",
        search: search,
      });

      const response = await fetch(`${apiUrl}api/Users?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: HaloUserResponse = await response.json();

      // Format the users with display names
      return data.users.map((user) => ({
        ...user,
        displayName: this.formatUserDisplayName(
          user.name,
          user.site_name,
          user.client_name,
        ),
      }));
    } catch (error) {
      console.error("Failed to fetch users:", error);
      throw error;
    }
  }

  private formatUserDisplayName(
    name: string,
    siteName: string,
    clientName: string,
  ): string {
    const parts = [name];
    if (siteName && clientName) {
      parts.push(`${siteName} - ${clientName}`);
    } else if (siteName) {
      parts.push(siteName);
    } else if (clientName) {
      parts.push(clientName);
    }
    return parts.join("\n");
  }

  formatUserDisplayNameForUI(
    name: string,
    siteName: string,
    clientName: string,
  ): { primary: string; secondary: string } {
    const secondary =
      siteName && clientName
        ? `${siteName} - ${clientName}`
        : siteName || clientName || "";
    return {
      primary: name,
      secondary: secondary,
    };
  }

  // Format user display name for compact single-line display
  formatUserDisplayNameCompact(
    name: string,
    siteName: string,
    clientName: string,
  ): string {
    const parts = [];
    if (clientName) parts.push(clientName);
    if (siteName) parts.push(siteName);
    parts.push(name);
    return parts.join(" / ");
  }
}

export default new UserService();
