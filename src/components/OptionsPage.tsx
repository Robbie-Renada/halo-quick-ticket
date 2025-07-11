import { useState, useEffect } from "react";
import HaloAuth from "../services/auth";
import UserService, { HaloUser } from "../services/userService";

interface HaloSettings {
  apiUrl: string;
  clientId: string;
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

type SetupStep = "basic" | "auth" | "advanced";

function OptionsPage() {
  const [settings, setSettings] = useState<HaloSettings>({
    apiUrl: "",
    clientId: "",
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

  // Add saved settings state to track changes
  const [savedSettings, setSavedSettings] = useState<HaloSettings>({
    apiUrl: "",
    clientId: "",
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
  const [currentStep, setCurrentStep] = useState<SetupStep>("basic");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

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

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    if (!isAuthenticated) return false;

    // Compare current settings with saved settings
    const settingsToCompare = {
      selectedUser: settings.selectedUser,
      ticketTypeId: settings.ticketTypeId,
      showStartDate: settings.showStartDate,
      showTargetDate: settings.showTargetDate,
      showTimeBudget: settings.showTimeBudget,
      showTimeTaken: settings.showTimeTaken,
      showChargeType: settings.showChargeType,
      showCategory1: settings.showCategory1,
      showCategory2: settings.showCategory2,
      showCategory3: settings.showCategory3,
      showCategory4: settings.showCategory4,
      showPriority: settings.showPriority,
      allowUserSelection: settings.allowUserSelection,
      allowCompleteTickets: settings.allowCompleteTickets,
      fieldOrder: settings.fieldOrder,
    };

    const savedToCompare = {
      selectedUser: savedSettings.selectedUser,
      ticketTypeId: savedSettings.ticketTypeId,
      showStartDate: savedSettings.showStartDate,
      showTargetDate: savedSettings.showTargetDate,
      showTimeBudget: savedSettings.showTimeBudget,
      showTimeTaken: savedSettings.showTimeTaken,
      showChargeType: savedSettings.showChargeType,
      showCategory1: savedSettings.showCategory1,
      showCategory2: savedSettings.showCategory2,
      showCategory3: savedSettings.showCategory3,
      showCategory4: savedSettings.showCategory4,
      showPriority: savedSettings.showPriority,
      allowUserSelection: savedSettings.allowUserSelection,
      allowCompleteTickets: savedSettings.allowCompleteTickets,
      fieldOrder: savedSettings.fieldOrder,
    };

    return JSON.stringify(settingsToCompare) !== JSON.stringify(savedToCompare);
  };

  // Warning when leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [settings, savedSettings, isAuthenticated]);

  useEffect(() => {
    loadSettings();
  }, []);

  // Check authentication status when settings change
  useEffect(() => {
    if (settings.apiUrl && settings.clientId) {
      checkAuthenticationStatus();
    } else {
      setIsAuthenticated(false);
      setCurrentStep("basic");
      setIsCheckingAuth(false);
    }
  }, [settings.apiUrl, settings.clientId]);

  // Initialize user search when authenticated
  useEffect(() => {
    if (isAuthenticated && settings.selectedUser) {
      setUserSearch(
        UserService.formatUserDisplayNameCompact(
          settings.selectedUser.name,
          settings.selectedUser.site_name,
          settings.selectedUser.client_name,
        ),
      );
    }
  }, [isAuthenticated, settings.selectedUser]);

  // Fetch advanced data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchTicketTypes();
      searchUsers("");
    }
  }, [isAuthenticated]);

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

      const loadedSettings = {
        apiUrl: result.apiUrl || "",
        clientId: result.clientId || "",
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
      };

      setSettings(loadedSettings);
      setSavedSettings(loadedSettings);
    } catch (error) {
      setStatus("Error loading settings");
      console.error("Failed to load settings:", error);
    }
  };

  const checkAuthenticationStatus = async () => {
    setIsCheckingAuth(true);
    try {
      if (!settings.apiUrl || !settings.clientId) {
        setIsAuthenticated(false);
        setCurrentStep("basic");
        return;
      }

      // Check if we have a valid token
      const token = await HaloAuth.getAuthToken();
      if (!token) {
        setIsAuthenticated(false);
        setCurrentStep("auth");
        return;
      }

      // Test the token with a simple API call
      const response = await fetch(`${settings.apiUrl}/api/agent/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setCurrentStep("advanced");
      } else {
        setIsAuthenticated(false);
        setCurrentStep("auth");
      }
    } catch (error) {
      setIsAuthenticated(false);
      setCurrentStep("auth");
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleApiConfigSave = async () => {
    try {
      // Validate basic settings
      if (!settings.apiUrl || !settings.clientId) {
        setStatus("Please fill in all required fields");
        return;
      }

      // Validate API URL format and HTTPS
      try {
        const url = new URL(settings.apiUrl);
        if (url.protocol !== "https:") {
          setStatus("Error: API URL must use HTTPS for security");
          return;
        }
      } catch (error) {
        setStatus("Error: Invalid API URL format");
        return;
      }

      // Request permission for this specific domain
      const url = new URL(settings.apiUrl);
      const hostPermission = `https://${url.hostname}/*`;
      const granted = await chrome.permissions.request({
        origins: [hostPermission],
      });

      if (!granted) {
        setStatus("Error: Host permission is required to connect to Halo");
        return;
      }

      // Save basic settings
      await chrome.storage.sync.set({
        apiUrl: settings.apiUrl.replace(/\/+$/, "") + "/",
        clientId: settings.clientId,
      });

      setStatus("API configuration saved! Please authenticate with Halo.");
      setCurrentStep("auth");
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      setStatus("Error saving API configuration");
      console.error("Failed to save API configuration:", error);
    }
  };

  const handleHaloSettingsSave = async () => {
    setIsSaving(true);
    try {
      await chrome.storage.sync.set(settings);
      setSavedSettings({ ...settings });
      setStatus("Halo settings saved successfully!");
      setTimeout(() => setStatus(""), 2000);
    } catch (error) {
      setStatus("Error saving Halo settings");
      console.error("Failed to save Halo settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogin = async () => {
    try {
      const token = await HaloAuth.authenticate();
      if (token) {
        setStatus("Login successful!");
        setIsAuthenticated(true);
        setCurrentStep("advanced");
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
      setStatus("Logged out successfully");
      setIsAuthenticated(false);
      setCurrentStep("auth");
      setTimeout(() => setStatus(""), 2000);
    } catch (error) {
      setStatus("Error during logout");
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
    const newOrder = [...settings.fieldOrder];
    const [draggedItem] = newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, draggedItem);
    handleFieldOrderChange(newOrder);
  };

  const getFieldLabel = (fieldKey: string) => {
    const labels = {
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
    return labels[fieldKey as keyof typeof labels] || fieldKey;
  };

  const getFieldSettingKey = (fieldKey: string): keyof HaloSettings => {
    const mapping: Record<string, keyof HaloSettings> = {
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
    return mapping[fieldKey] || "showStartDate";
  };

  const isFieldEnabled = (fieldKey: string): boolean => {
    const settingKey = getFieldSettingKey(fieldKey);
    return settings[settingKey] as boolean;
  };

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

  const searchUsers = async (searchTerm: string) => {
    if (!isAuthenticated) return;

    setIsLoadingUsers(true);
    try {
      const users = await UserService.fetchUsers(searchTerm);
      setAvailableUsers(users);
    } catch (error) {
      console.error("Failed to search users:", error);
      setAvailableUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleUserSearch = (searchTerm: string) => {
    setUserSearch(searchTerm);

    if (userSearchTimeout) {
      clearTimeout(userSearchTimeout);
    }

    const timeout = window.setTimeout(() => {
      searchUsers(searchTerm);
    }, 300);

    setUserSearchTimeout(timeout);
  };

  const handleUserSelect = (user: HaloUser) => {
    setSettings((prev) => ({
      ...prev,
      selectedUser: user,
    }));
    setShowUserDropdown(false);
    setUserSearch(
      UserService.formatUserDisplayNameCompact(
        user.name,
        user.site_name,
        user.client_name,
      ),
    );
  };

  const fetchTicketTypes = async () => {
    if (!isAuthenticated) return;

    setIsLoadingTicketTypes(true);
    try {
      const storedToken = await chrome.storage.local.get(["auth_token"]);
      if (!storedToken.auth_token || !settings.apiUrl) {
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

  const canSaveHaloSettings = () => {
    return settings.selectedUser && settings.ticketTypeId && !isSaving;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Quick Ticket Settings
        </h1>

        {/* Setup Status */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            <div
              className={`flex items-center ${settings.apiUrl && settings.clientId ? "text-green-600" : currentStep === "basic" ? "text-blue-600" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${settings.apiUrl && settings.clientId ? "border-green-600 bg-green-50" : currentStep === "basic" ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}
              >
                {settings.apiUrl && settings.clientId ? "✓" : "⚙️"}
              </div>
              <span className="ml-2 text-sm font-medium">
                API Configuration
              </span>
            </div>
            <div
              className={`w-12 h-0.5 ${isAuthenticated ? "bg-green-600" : settings.apiUrl && settings.clientId ? "bg-blue-600" : "bg-gray-300"}`}
            ></div>
            <div
              className={`flex items-center ${isAuthenticated ? "text-green-600" : currentStep === "auth" ? "text-blue-600" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isAuthenticated ? "border-green-600 bg-green-50" : currentStep === "auth" ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}
              >
                {isAuthenticated ? "✓" : "🔑"}
              </div>
              <span className="ml-2 text-sm font-medium">Authentication</span>
            </div>
            <div
              className={`w-12 h-0.5 ${isAuthenticated ? "bg-green-600" : "bg-gray-300"}`}
            ></div>
            <div
              className={`flex items-center ${isAuthenticated ? "text-blue-600" : "text-gray-400"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isAuthenticated ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}
              >
                📋
              </div>
              <span className="ml-2 text-sm font-medium">Configuration</span>
            </div>
          </div>
        </div>

        {/* API Configuration */}
        {(currentStep === "basic" || !isAuthenticated) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                    <li>Enable "Use PKCE" (Proof Key for Code Exchange)</li>
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

            {/* API Settings */}
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
                    Halo Base URL: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    id="apiUrl"
                    name="apiUrl"
                    value={settings.apiUrl}
                    onChange={handleInputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                    placeholder="https://your-instance.halo.com"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="clientId"
                    className="block text-gray-700 text-sm font-medium mb-1"
                  >
                    Client ID: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="clientId"
                    name="clientId"
                    value={settings.clientId}
                    onChange={handleInputChange}
                    className="w-full border-gray-300 rounded-md shadow-sm text-sm"
                    placeholder="Your OAuth Client ID"
                    required
                  />
                </div>

                <button
                  onClick={handleApiConfigSave}
                  disabled={!settings.apiUrl || !settings.clientId}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium transition-colors"
                >
                  Save API Configuration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Authentication Required */}
        {currentStep === "auth" && (
          <div className="max-w-md mx-auto mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Authenticate with Halo
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                Now that your basic settings are saved, you need to authenticate
                with Halo to configure your Halo-specific settings.
              </p>
              {isCheckingAuth ? (
                <div className="flex items-center justify-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Checking authentication...</span>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-md shadow-sm text-sm font-medium transition-colors"
                >
                  Login to Halo
                </button>
              )}
            </div>
          </div>
        )}

        {/* Halo Configuration */}
        {currentStep === "advanced" && isAuthenticated && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - User and Ticket Type */}
            <div className="lg:col-span-1 space-y-6">
              {/* Authentication Status */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <p className="text-green-800 font-medium text-sm">
                      Authenticated
                    </p>
                    <p className="text-green-600 text-xs">
                      Connected to Halo successfully
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="mt-3 text-xs bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded transition-colors"
                >
                  Logout
                </button>
              </div>

              {/* User Configuration */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  User Configuration
                </h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="selectedUser"
                      className="block text-gray-700 text-sm font-medium mb-1"
                    >
                      Default User: <span className="text-red-500">*</span>
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
                      Ticket Type: <span className="text-red-500">*</span>
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

                  {/* Remove the save button from here */}
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
                  Check to enable fields and drag to reorder. Only enabled
                  fields will appear in the form.
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
                          e.dataTransfer.setData(
                            "text/plain",
                            index.toString(),
                          );
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  Advanced Options
                </h2>
                <div className="space-y-4">
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
                      When enabled, a "Complete" button will appear alongside
                      the "Submit" button.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sticky Save Bar for Halo Settings */}
        {currentStep === "advanced" && isAuthenticated && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {hasUnsavedChanges() && (
                    <div className="flex items-center text-amber-600">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                      <span className="text-sm font-medium">
                        You have unsaved changes
                      </span>
                    </div>
                  )}
                  {!hasUnsavedChanges() && (
                    <div className="flex items-center text-green-600">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm font-medium">
                        All changes saved
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  {hasUnsavedChanges() && (
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to discard your changes?",
                          )
                        ) {
                          setSettings({ ...savedSettings });
                        }
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium transition-colors"
                    >
                      Discard Changes
                    </button>
                  )}
                  <button
                    onClick={handleHaloSettingsSave}
                    disabled={!canSaveHaloSettings()}
                    className={`py-2 px-6 rounded-md shadow-sm text-sm font-medium transition-colors ${
                      canSaveHaloSettings()
                        ? hasUnsavedChanges()
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isSaving ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </div>
                    ) : hasUnsavedChanges() ? (
                      "Save Changes"
                    ) : (
                      "✓ Saved"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add padding to bottom when sticky bar is visible */}
        {currentStep === "advanced" && isAuthenticated && (
          <div className="h-20"></div>
        )}

        {/* Status Message */}
        {status && (
          <div className="fixed bottom-20 right-4 z-50">
            <div
              className={`px-4 py-2 rounded-md shadow-lg text-sm font-medium ${
                status.includes("Error") || status.includes("failed")
                  ? "bg-red-100 border border-red-200 text-red-800"
                  : "bg-green-100 border border-green-200 text-green-800"
              }`}
            >
              {status}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OptionsPage;
