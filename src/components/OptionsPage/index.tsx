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
import FieldOrderManager, { FIELD_SETTING_KEY } from "./FieldOrderManager";
import AdvancedOptionsPanel from "./AdvancedOptionsPanel";
import TicketTypeRestrictionPanel from "./TicketTypeRestrictionPanel";
import SaveBar from "./SaveBar";

const DEFAULT_SETTINGS: HaloSettings = {
  apiUrl: "",
  clientId: "",
  selectedUser: null,
  ticketTypeId: "",
  restrictTicketTypes: false,
  allowedTicketTypeIds: [],
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
        "restrictTicketTypes",
        "allowedTicketTypeIds",
        "showTicketType",
        "showAutoAssign",
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
        restrictTicketTypes: result.restrictTicketTypes ?? false,
        allowedTicketTypeIds: result.allowedTicketTypeIds ?? [],
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

  const handleToggleField = (fieldKey: string, enabled: boolean) => {
    const settingKey = FIELD_SETTING_KEY[fieldKey];
    if (settingKey) setSettings((prev) => ({ ...prev, [settingKey]: enabled }));
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
    <div className="min-h-screen px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <span className="hqt-mark h-6 w-6 shrink-0" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-stone-900">
              Quick Ticket
            </h1>
            <p className="text-[13px] text-stone-500">
              Settings for your Halo connection and ticket form
            </p>
          </div>
        </div>

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* Left Column - Connection and defaults */}
            <div className="space-y-5">
            {/* Authentication Status */}
            <div className="hqt-panel flex items-center justify-between !py-4">
                <div className="flex items-center">
                  <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-full bg-teal-700">
                    <svg
                      className="h-3.5 w-3.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      Connected to Halo
                    </p>
                    <p className="text-xs text-stone-500">
                      Authentication is active
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md px-2.5 py-1 text-xs font-medium text-stone-500 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  Log out
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

              <TicketTypeRestrictionPanel
                ticketTypes={ticketTypes}
                isLoadingTicketTypes={isLoadingTicketTypes}
                restrictTicketTypes={settings.restrictTicketTypes}
                allowedTicketTypeIds={settings.allowedTicketTypeIds}
                defaultTicketTypeId={settings.ticketTypeId}
                onRestrictChange={(restrictTicketTypes) =>
                  setSettings((prev) => ({ ...prev, restrictTicketTypes }))
                }
                onAllowedChange={(allowedTicketTypeIds) =>
                  setSettings((prev) => ({ ...prev, allowedTicketTypeIds }))
                }
              />
            </div>

            {/* Middle Column - Form Fields & Order */}
            <FieldOrderManager
              fieldOrder={settings.fieldOrder}
              settings={settings}
              onFieldOrderChange={handleFieldOrderChange}
              onToggleField={handleToggleField}
              onReset={resetFieldOrder}
            />

            {/* Right Column - Advanced Options */}
            <AdvancedOptionsPanel
              allowUserSelection={settings.allowUserSelection}
              allowCompleteTickets={settings.allowCompleteTickets}
              autoAssignToMe={settings.autoAssignToMe}
              onChange={handleCheckboxChange}
            />
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
              className={`animate-scale-in rounded-md border px-4 py-2 text-sm font-medium shadow-lg ${
                status.includes("Error") || status.includes("failed")
                  ? "border-red-200 bg-white text-red-700"
                  : "border-stone-200 bg-white text-stone-800"
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
