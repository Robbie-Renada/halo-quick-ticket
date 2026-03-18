import { useState, useEffect } from "react";
import HaloAuth from "../../services/auth";
import UserService from "../../services/userService";
import { HaloSettings, SetupStep } from "../../types";
import { useUserSearch } from "../../hooks/useUserSearch";
import { useTicketTypes } from "../../hooks/useTicketTypes";
import SetupStepper from "./SetupStepper";
import ApiConfigStep from "./ApiConfigStep";
import AuthStep from "./AuthStep";
import UserConfigPanel from "./UserConfigPanel";
import FieldOrderManager from "./FieldOrderManager";
import AdvancedOptionsPanel from "./AdvancedOptionsPanel";
import SaveBar from "./SaveBar";

const DEFAULT_SETTINGS: HaloSettings = {
  apiUrl: "",
  clientId: "",
  selectedUser: null,
  ticketTypeId: "",
  showTicketType: true,
  showAutoAssign: true,
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
  autoAssignToMe: false,
  fieldOrder: [
    "ticketType",
    "autoAssign",
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

function OptionsPage() {
  const [settings, setSettings] = useState<HaloSettings>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<HaloSettings>(DEFAULT_SETTINGS);

  const [status, setStatus] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<SetupStep>("basic");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const extensionId = chrome.runtime.id;
  const redirectUri = `https://${extensionId}.chromiumapp.org/`;

  const { ticketTypes, isLoadingTicketTypes, fetchTicketTypes } = useTicketTypes();

  const {
    userSearch,
    availableUsers,
    isLoadingUsers,
    showUserDropdown,
    setUserSearch,
    setShowUserDropdown,
    handleUserSearch,
  } = useUserSearch({
    enabled: isAuthenticated,
  });

  // Check if there are unsaved changes (excludes apiUrl/clientId, saved separately)
  const hasUnsavedChanges = () => {
    if (!isAuthenticated) return false;
    const { apiUrl: _a1, clientId: _c1, ...rest } = settings;
    const { apiUrl: _a2, clientId: _c2, ...savedRest } = savedSettings;
    return JSON.stringify(rest) !== JSON.stringify(savedRest);
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
      searchUsersInit();
    }
  }, [isAuthenticated]);

  const searchUsersInit = async () => {
    if (!isAuthenticated) return;
    // Trigger initial user search through the hook's internal search
    handleUserSearch("");
  };

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
        "autoAssignToMe",
        "fieldOrder",
      ]);

      const loadedSettings: HaloSettings = {
        apiUrl: result.apiUrl || "",
        clientId: result.clientId || "",
        selectedUser: result.selectedUser || null,
        ticketTypeId: result.ticketTypeId || "",
        showTicketType: result.showTicketType ?? true,
        showAutoAssign: result.showAutoAssign ?? true,
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
        autoAssignToMe: result.autoAssignToMe ?? false,
        fieldOrder: (() => {
          const saved = result.fieldOrder || [];
          const defaults = [
            "ticketType",
            "autoAssign",
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
          return [...saved, ...defaults.filter((f) => !saved.includes(f))];
        })(),
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

      const token = await HaloAuth.getAuthToken();
      if (!token) {
        setIsAuthenticated(false);
        setCurrentStep("auth");
        return;
      }

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
      if (!settings.apiUrl || !settings.clientId) {
        setStatus("Please fill in all required fields");
        return;
      }

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

      const url = new URL(settings.apiUrl);
      const hostPermission = `https://${url.hostname}/*`;
      const granted = await chrome.permissions.request({
        origins: [hostPermission],
      });

      if (!granted) {
        setStatus("Error: Host permission is required to connect to Halo");
        return;
      }

      await chrome.storage.sync.set({
        apiUrl: settings.apiUrl.replace(/\/+$/, ""),
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

  const handleToggleField = (fieldKey: string, enabled: boolean) => {
    const mapping: Record<string, keyof HaloSettings> = {
      ticketType: "showTicketType",
      autoAssign: "showAutoAssign",
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
    const settingKey = mapping[fieldKey] || "showStartDate";
    setSettings((prev) => ({ ...prev, [settingKey]: enabled }));
  };

  const handleTicketTypeSelect = (ticketTypeId: string) => {
    setSettings((prev) => ({
      ...prev,
      ticketTypeId: ticketTypeId,
    }));
  };

  const resetFieldOrder = () => {
    const defaultOrder = [
      "ticketType",
      "autoAssign",
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

  const handleUserSelect = (user: import("../../services/userService").HaloUser) => {
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

  const handleUserClear = () => {
    setSettings((prev) => ({
      ...prev,
      selectedUser: null,
    }));
    setUserSearch("");
  };

  const canSaveHaloSettings = () => {
    return !!(settings.selectedUser && settings.ticketTypeId && !isSaving);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Quick Ticket Settings
        </h1>

        {/* Setup Status */}
        <SetupStepper
          currentStep={currentStep}
          isAuthenticated={isAuthenticated}
          hasApiConfig={!!(settings.apiUrl && settings.clientId)}
        />

        {/* API Configuration */}
        {(currentStep === "basic" || !isAuthenticated) && (
          <ApiConfigStep
            apiUrl={settings.apiUrl}
            clientId={settings.clientId}
            redirectUri={redirectUri}
            onChange={handleInputChange}
            onSave={handleApiConfigSave}
          />
        )}

        {/* Authentication Required */}
        {currentStep === "auth" && (
          <AuthStep
            isCheckingAuth={isCheckingAuth}
            onLogin={handleLogin}
          />
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
                  type="button"
                  onClick={handleLogout}
                  className="mt-3 text-xs bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded transition-colors"
                >
                  Logout
                </button>
              </div>

              <UserConfigPanel
                selectedUser={settings.selectedUser}
                ticketTypeId={settings.ticketTypeId}
                onTicketTypeSelect={handleTicketTypeSelect}
                ticketTypes={ticketTypes}
                isLoadingTicketTypes={isLoadingTicketTypes}
                userSearch={userSearch}
                availableUsers={availableUsers}
                isLoadingUsers={isLoadingUsers}
                showUserDropdown={showUserDropdown}
                setShowUserDropdown={setShowUserDropdown}
                handleUserSearch={handleUserSearch}
                handleUserSelect={handleUserSelect}
                onUserClear={handleUserClear}
              />
            </div>

            {/* Middle Column - Form Fields & Order */}
            <div className="lg:col-span-1">
              <FieldOrderManager
                fieldOrder={settings.fieldOrder}
                settings={settings}
                onMoveField={moveField}
                onToggleField={handleToggleField}
                onReset={resetFieldOrder}
              />
            </div>

            {/* Right Column - Advanced Options */}
            <div className="lg:col-span-1 space-y-6">
              <AdvancedOptionsPanel
                allowUserSelection={settings.allowUserSelection}
                allowCompleteTickets={settings.allowCompleteTickets}
                autoAssignToMe={settings.autoAssignToMe}
                onChange={handleCheckboxChange}
              />
            </div>
          </div>
        )}

        {/* Sticky Save Bar for Halo Settings */}
        {currentStep === "advanced" && isAuthenticated && (
          <SaveBar
            hasUnsaved={hasUnsavedChanges()}
            isSaving={isSaving}
            canSave={canSaveHaloSettings()}
            onSave={handleHaloSettingsSave}
            onDiscard={() => {
              if (
                window.confirm(
                  "Are you sure you want to discard your changes?",
                )
              ) {
                setSettings({ ...savedSettings });
              }
            }}
          />
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
