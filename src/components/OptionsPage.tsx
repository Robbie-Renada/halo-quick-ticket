import { useState, useEffect } from "react";
import HaloAuth from "../services/auth";
import UserService, { HaloUser } from "../services/userService";

interface HaloSettings {
  apiUrl: string;
  clientId: string;
  clientSecret: string;
  selectedUser: HaloUser | null;
  ticketTypeId: string;
  showStartDate: boolean;
  showTargetDate: boolean;
  showTimeBudget: boolean;
  showTimeTaken: boolean;
  showChargeType: boolean;
  showCategory1: boolean;
  showCategory2: boolean;
  showCategory3: boolean;
  showCategory4: boolean;
  showPriority: boolean;
  allowUserSelection: boolean;
  allowCompleteTickets: boolean;
  fieldOrder: string[];
}

interface TicketType {
  id: number;
  name: string;
}

function OptionsPage() {
  const [settings, setSettings] = useState<HaloSettings>({
    apiUrl: "",
    clientId: "",
    clientSecret: "",
    selectedUser: null,
    ticketTypeId: "",
    showStartDate: true,
    showTargetDate: true,
    showTimeBudget: true,
    showTimeTaken: true,
    showChargeType: true,
    showCategory1: true,
    showCategory2: true,
    showCategory3: true,
    showCategory4: true,
    showPriority: true,
    allowUserSelection: false,
    allowCompleteTickets: false,
    fieldOrder: [
      "projecttimebudget",
      "startDate",
      "targetDate",
      "priority",
      "category1",
      "category2",
      "category3",
      "category4",
      "timetaken",
      "chargeType",
    ],
  });
  const [status, setStatus] = useState<string>("");

  // User selection state
  const [availableUsers, setAvailableUsers] = useState<HaloUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userSearchTimeout, setUserSearchTimeout] = useState<number | null>(
    null,
  );

  // Ticket type selection state
  const [availableTicketTypes, setAvailableTicketTypes] = useState<
    TicketType[]
  >([]);
  const [isLoadingTicketTypes, setIsLoadingTicketTypes] = useState(false);

  const extensionId = chrome.runtime.id;
  const redirectUri = `https://${extensionId}.chromiumapp.org/`;

  useEffect(() => {
    loadSettings();
  }, []);

  // Initialize user search and ticket types after settings are loaded
  useEffect(() => {
    if (settings.apiUrl && settings.selectedUser) {
      setUserSearch(
        UserService.formatUserDisplayNameCompact(
          settings.selectedUser.name,
          settings.selectedUser.site_name,
          settings.selectedUser.client_name,
        ),
      );
    }
  }, [settings.selectedUser]);

  // Fetch ticket types when API URL is available
  useEffect(() => {
    if (settings.apiUrl) {
      fetchTicketTypes();
      // Also load initial users when API URL is available
      searchUsers("");
    }
  }, [settings.apiUrl]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserDropdown && event.target instanceof Element) {
        const dropdown = document.querySelector(".user-dropdown");
        if (dropdown && !dropdown.contains(event.target)) {
          setShowUserDropdown(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserDropdown]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (userSearchTimeout) {
        clearTimeout(userSearchTimeout);
      }
    };
  }, [userSearchTimeout]);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.sync.get([
        "apiUrl",
        "clientId",
        "clientSecret",
        "selectedUser",
        "ticketTypeId",
        "showStartDate",
        "showTargetDate",
        "showTimeBudget",
        "showTimeTaken",
        "showChargeType",
        "showCategory1",
        "showCategory2",
        "showCategory3",
        "showCategory4",
        "showPriority",
        "allowUserSelection",
        "allowCompleteTickets",
        "fieldOrder",
      ]);

      setSettings({
        apiUrl: result.apiUrl || "",
        clientId: result.clientId || "",
        clientSecret: result.clientSecret || "",
        selectedUser: result.selectedUser || null,
        ticketTypeId: result.ticketTypeId || "",
        showStartDate: result.showStartDate ?? true,
        showTargetDate: result.showTargetDate ?? true,
        showTimeBudget: result.showTimeBudget ?? true,
        showTimeTaken: result.showTimeTaken ?? true,
        showChargeType: result.showChargeType ?? true,
        showCategory1: result.showCategory1 ?? true,
        showCategory2: result.showCategory2 ?? true,
        showCategory3: result.showCategory3 ?? true,
        showCategory4: result.showCategory4 ?? true,
        showPriority: result.showPriority ?? true,
        allowUserSelection: result.allowUserSelection ?? false,
        allowCompleteTickets: result.allowCompleteTickets ?? false,
        fieldOrder: result.fieldOrder || [
          "projecttimebudget",
          "startDate",
          "targetDate",
          "priority",
          "category1",
          "category2",
          "category3",
          "category4",
          "timetaken",
          "chargeType",
        ],
      });
    } catch (error) {
      setStatus("Error loading settings");
      console.error("Failed to load settings:", error);
    }
  };

  const handleSave = async () => {
    try {
      // When saving the API URL
      if (settings.apiUrl) {
        const url = new URL(settings.apiUrl);
        const hostPermission = `https://${url.hostname}/*`;

        // Request permission for this specific domain
        const granted = await chrome.permissions.request({
          origins: [hostPermission],
        });

        if (!granted) {
          setStatus("Error: Host permission is required to connect to Halo");
          return;
        }
      }

      const settingsToSave = {
        ...settings,
        apiUrl:
          settings.apiUrl && settings.apiUrl.trim()
            ? (() => {
                const urlMatch = settings.apiUrl.match(/^(https?:\/\/[^\/]+)/);
                const normalizedUrl = urlMatch ? urlMatch[1] : settings.apiUrl;
                return normalizedUrl.endsWith("/")
                  ? normalizedUrl
                  : `${normalizedUrl}/`;
              })()
            : "",
      };

      await chrome.storage.sync.set(settingsToSave);
      setSettings(settingsToSave);
      setStatus("Settings saved successfully!");
      setTimeout(() => setStatus(""), 2000);
    } catch (error) {
      setStatus("Error saving settings");
      console.error("Failed to save settings:", error);
    }
  };
  const handleLogin = async () => {
    try {
      const token = await HaloAuth.authenticate();
      if (token) {
        setStatus("Login successful!");
        setTimeout(() => setStatus(""), 2000);
      } else {
        setStatus("Login failed: No token received");
      }
    } catch (error) {
      setStatus(
        `Login failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      console.error("Login error:", error);
    }
  };
  const handleLogout = async () => {
    try {
      await HaloAuth.signOut();
      setStatus("Logout successful!");
      setTimeout(() => setStatus(""), 2000);
    } catch (error) {
      setStatus("Logout failed");
      console.error("Logout error:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleFieldOrderChange = (newOrder: string[]) => {
    setSettings((prev) => ({
      ...prev,
      fieldOrder: newOrder,
    }));
  };

  const moveField = (dragIndex: number, hoverIndex: number) => {
    const newFieldOrder = [...settings.fieldOrder];
    const draggedField = newFieldOrder[dragIndex];
    newFieldOrder.splice(dragIndex, 1);
    newFieldOrder.splice(hoverIndex, 0, draggedField);
    handleFieldOrderChange(newFieldOrder);
  };

  const getFieldLabel = (fieldKey: string) => {
    const fieldLabels: Record<string, string> = {
      projecttimebudget: "Time Budget",
      startDate: "Start Date",
      targetDate: "Target Date",
      priority: "Priority",
      category1: "Category 1",
      category2: "Category 2",
      category3: "Category 3",
      category4: "Category 4",
      timetaken: "Time Taken",
      chargeType: "Charge Type",
    };
    return fieldLabels[fieldKey] || fieldKey;
  };

  // Helper function to get the setting key for a field
  const getFieldSettingKey = (fieldKey: string): keyof HaloSettings => {
    const fieldSettingMap: Record<string, keyof HaloSettings> = {
      projecttimebudget: "showTimeBudget",
      startDate: "showStartDate",
      targetDate: "showTargetDate",
      priority: "showPriority",
      category1: "showCategory1",
      category2: "showCategory2",
      category3: "showCategory3",
      category4: "showCategory4",
      timetaken: "showTimeTaken",
      chargeType: "showChargeType",
    };
    return fieldSettingMap[fieldKey] || "showStartDate";
  };

  // Helper function to check if a field is enabled
  const isFieldEnabled = (fieldKey: string): boolean => {
    const settingKey = getFieldSettingKey(fieldKey);
    return settings[settingKey] as boolean;
  };

  // Helper function to toggle a field's enabled state
  const toggleField = (fieldKey: string) => {
    const settingKey = getFieldSettingKey(fieldKey);
    setSettings((prev) => ({
      ...prev,
      [settingKey]: !prev[settingKey],
    }));
  };

  const resetFieldOrder = () => {
    const defaultOrder = [
      "projecttimebudget",
      "startDate",
      "targetDate",
      "priority",
      "category1",
      "category2",
      "category3",
      "category4",
      "timetaken",
      "chargeType",
    ];
    handleFieldOrderChange(defaultOrder);
  };

  // User search and selection functions
  const searchUsers = async (searchTerm: string) => {
    setIsLoadingUsers(true);
    try {
      const users = await UserService.fetchUsers(searchTerm);
      setAvailableUsers(users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setAvailableUsers([]);
      // Don't trigger authentication from the options page
      // Let the main ticket form handle authentication
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleUserSearch = (searchTerm: string) => {
    setUserSearch(searchTerm);

    // Clear existing timeout
    if (userSearchTimeout) {
      clearTimeout(userSearchTimeout);
    }

    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      searchUsers(searchTerm);
    }, 300); // 300ms debounce

    setUserSearchTimeout(timeout);
  };

  const handleUserSelect = (user: HaloUser) => {
    setSettings((prev) => ({
      ...prev,
      selectedUser: user,
    }));
    setUserSearch(
      UserService.formatUserDisplayNameCompact(
        user.name,
        user.site_name,
        user.client_name,
      ),
    );
    setShowUserDropdown(false);
  };

  // Ticket type functions
  const fetchTicketTypes = async () => {
    setIsLoadingTicketTypes(true);
    try {
      // Try to get stored token without triggering authentication
      const storedToken = await chrome.storage.local.get(["auth_token"]);
      if (!storedToken.auth_token || !settings.apiUrl) {
        // No stored token or API URL, just fail silently
        setAvailableTicketTypes([]);
        return;
      }

      const response = await fetch(
        `${settings.apiUrl}api/TicketType?showall=true&showinactive=true`,
        {
          headers: {
            Authorization: `Bearer ${storedToken.auth_token.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        // If authentication fails, just clear the list without triggering auth
        if (response.status === 401) {
          setAvailableTicketTypes([]);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TicketType[] = await response.json();
      setAvailableTicketTypes(data);
    } catch (error) {
      console.error("Failed to fetch ticket types:", error);
      setAvailableTicketTypes([]);
    } finally {
      setIsLoadingTicketTypes(false);
    }
  };

  const handleTicketTypeSelect = (ticketTypeId: string) => {
    setSettings((prev) => ({
      ...prev,
      ticketTypeId: ticketTypeId,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Quick Ticket Settings
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - API Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* Setup Instructions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Setup Instructions
              </h2>
              <ol className="text-gray-600 list-decimal list-inside text-sm space-y-1">
                <li>
                  Navigate to Halo:{" "}
                  <code className="text-xs bg-gray-100 px-1 rounded">
                    Config / Integrations / HaloAPI / View Applications / New
                  </code>
                </li>
                <li>
                  On the Details tab:
                  <ul className="ml-4 list-disc list-inside text-xs text-gray-500 mt-1">
                    <li>Name your application</li>
                    <li>Select "Authorization Code Flow"</li>
                    <li>Add Redirect URI:</li>
                  </ul>
                </li>
              </ol>

              <div className="bg-gray-50 p-2 my-3 rounded flex items-center justify-between text-xs">
                <code className="text-gray-600 break-all">{redirectUri}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(redirectUri)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs ml-2 flex-shrink-0"
                >
                  Copy
                </button>
              </div>

              <ol
                className="text-gray-600 list-decimal list-inside text-sm space-y-1"
                start={3}
              >
                <li>Copy Client ID to paste below</li>
                <li>Select 'use a client secret for the token request'</li>
                <li>Copy Client Secret to paste below</li>
                <li>Check "Agent Logins" under Preferences</li>
                <li>
                  Add Permissions:{" "}
                  <span className="text-xs text-gray-500">
                    read:tickets, edit:tickets
                  </span>
                </li>
                <li>Save the application</li>
                <li>Complete settings below</li>
              </ol>
            </div>

            {/* API Configuration */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                API Configuration
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="apiUrl"
                    className="block text-gray-700 text-sm font-medium mb-1"
                  >
                    Halo Base URL:
                  </label>
                  <input
                    type="url"
                    id="apiUrl"
                    name="apiUrl"
                    value={settings.apiUrl}
                    onChange={handleInputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                    placeholder="https://your-instance.Halo.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="clientId"
                    className="block text-gray-700 text-sm font-medium mb-1"
                  >
                    Client ID:
                  </label>
                  <input
                    type="text"
                    id="clientId"
                    name="clientId"
                    value={settings.clientId}
                    onChange={handleInputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="clientSecret"
                    className="block text-gray-700 text-sm font-medium mb-1"
                  >
                    Client Secret:
                  </label>
                  <input
                    type="password"
                    id="clientSecret"
                    name="clientSecret"
                    value={settings.clientSecret}
                    onChange={handleInputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="selectedUser"
                    className="block text-gray-700 text-sm font-medium mb-1"
                  >
                    Default User:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="selectedUser"
                      placeholder="Search for user..."
                      value={
                        settings.selectedUser
                          ? UserService.formatUserDisplayNameCompact(
                              settings.selectedUser.name,
                              settings.selectedUser.site_name,
                              settings.selectedUser.client_name,
                            )
                          : userSearch
                      }
                      onChange={(e) => {
                        if (settings.selectedUser) {
                          // Clear selection and start fresh search
                          setSettings((prev) => ({
                            ...prev,
                            selectedUser: null,
                          }));
                          setUserSearch(e.target.value);
                          handleUserSearch(e.target.value);
                        } else {
                          handleUserSearch(e.target.value);
                        }
                        setShowUserDropdown(true);
                      }}
                      onFocus={() => {
                        if (settings.selectedUser) {
                          // Clear selection when clicking on selected user
                          setSettings((prev) => ({
                            ...prev,
                            selectedUser: null,
                          }));
                          setUserSearch("");
                        }
                        setShowUserDropdown(true);
                      }}
                      className={`w-full border-gray-300 rounded-md shadow-sm text-sm ${
                        settings.selectedUser ? "cursor-pointer" : ""
                      }`}
                    />

                    {showUserDropdown && !settings.selectedUser && (
                      <div className="user-dropdown absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                        {isLoadingUsers ? (
                          <div className="p-2 text-sm text-gray-500">
                            Loading users...
                          </div>
                        ) : availableUsers.length > 0 ? (
                          availableUsers.map((user) => {
                            const compactDisplay =
                              UserService.formatUserDisplayNameCompact(
                                user.name,
                                user.site_name,
                                user.client_name,
                              );
                            return (
                              <div
                                key={user.id}
                                onClick={() => handleUserSelect(user)}
                                className="p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="text-sm font-medium text-gray-900">
                                  {compactDisplay}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-2 text-sm text-gray-500">
                            No users found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="ticketTypeId"
                    className="block text-gray-700 text-sm font-medium mb-1"
                  >
                    Ticket Type:
                  </label>
                  <select
                    id="ticketTypeId"
                    name="ticketTypeId"
                    value={settings.ticketTypeId}
                    onChange={(e) => handleTicketTypeSelect(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                    disabled={isLoadingTicketTypes}
                  >
                    <option value="">
                      {isLoadingTicketTypes
                        ? "Loading..."
                        : "Select Ticket Type"}
                    </option>
                    {availableTicketTypes.map((ticketType) => (
                      <option
                        key={ticketType.id}
                        value={ticketType.id.toString()}
                      >
                        {ticketType.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Save</h2>
              <div className="space-y-3">
                <button
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium transition-colors w-full"
                >
                  Save Settings
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleLogin}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium transition-colors"
                  >
                    Login
                  </button>

                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium transition-colors"
                  >
                    Logout
                  </button>
                </div>

                {status && (
                  <div
                    className={`text-sm text-center p-2 rounded ${status.includes("Error") ? "text-red-600 bg-red-50" : "text-green-600 bg-green-50"}`}
                  >
                    {status}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Middle Column - Form Fields & Order */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-fit">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Form Fields & Order
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Check to enable fields and drag to reorder. Only enabled fields
                will appear in the form.
              </p>

              <div className="space-y-2 mb-4 overflow-y-auto">
                {settings.fieldOrder.map((fieldKey, index) => (
                  <div
                    key={fieldKey}
                    className={`flex items-center justify-between p-2 rounded-md border transition-colors ${
                      isFieldEnabled(fieldKey)
                        ? "bg-gray-50 border-gray-200 cursor-move hover:bg-gray-100"
                        : "bg-gray-25 border-gray-100 opacity-60"
                    }`}
                    draggable={isFieldEnabled(fieldKey)}
                    onDragStart={(e) => {
                      if (isFieldEnabled(fieldKey)) {
                        e.dataTransfer.setData("text/plain", index.toString());
                      } else {
                        e.preventDefault();
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const dragIndex = parseInt(
                        e.dataTransfer.getData("text/plain"),
                      );
                      const hoverIndex = index;
                      if (dragIndex !== hoverIndex) {
                        moveField(dragIndex, hoverIndex);
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`field-${fieldKey}`}
                        checked={isFieldEnabled(fieldKey)}
                        onChange={() => toggleField(fieldKey)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-3"
                      />
                      <svg
                        className={`w-4 h-4 mr-2 ${
                          isFieldEnabled(fieldKey)
                            ? "text-gray-400"
                            : "text-gray-300"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <label
                        htmlFor={`field-${fieldKey}`}
                        className={`text-sm font-medium cursor-pointer ${
                          isFieldEnabled(fieldKey)
                            ? "text-gray-700"
                            : "text-gray-400"
                        }`}
                      >
                        {getFieldLabel(fieldKey)}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newOrder = settings.fieldOrder.filter(
                            (_, i) => i !== index,
                          );
                          if (index > 0) {
                            newOrder.splice(index - 1, 0, fieldKey);
                          } else {
                            newOrder.push(fieldKey);
                          }
                          handleFieldOrderChange(newOrder);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newOrder = settings.fieldOrder.filter(
                            (_, i) => i !== index,
                          );
                          if (index < settings.fieldOrder.length - 1) {
                            newOrder.splice(index + 1, 0, fieldKey);
                          } else {
                            newOrder.unshift(fieldKey);
                          }
                          handleFieldOrderChange(newOrder);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={resetFieldOrder}
                className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded-md shadow-sm text-sm font-medium transition-colors w-full"
              >
                Reset to Default Order
              </button>
            </div>
          </div>

          {/* Right Column - Advanced Options */}
          <div className="lg:col-span-1 space-y-6">
            {/* Advanced Options */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Advanced Options
              </h2>
              <div className="space-y-4">
                {/* User Selection */}
                <div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allowUserSelection"
                      name="allowUserSelection"
                      checked={settings.allowUserSelection}
                      onChange={handleCheckboxChange}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <label
                      htmlFor="allowUserSelection"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Allow other users to be selected
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    When enabled, users can choose a different user from your
                    Halo tenant when creating tickets.
                  </p>
                </div>

                {/* Ticket Options */}
                <div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allowCompleteTickets"
                      name="allowCompleteTickets"
                      checked={settings.allowCompleteTickets}
                      onChange={handleCheckboxChange}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <label
                      htmlFor="allowCompleteTickets"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Allow completing tickets during creation
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    When enabled, a "Complete" button will appear alongside the
                    "Submit" button.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OptionsPage;
