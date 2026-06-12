import { useState, useEffect, useCallback, useRef } from "react";
import HaloAuth from "../../services/auth";
import { HaloUser } from "../../services/userService";
import { FormData, TicketPayload, TicketResponse, LastTicket, Category, ChargeType, AppState } from "../../types";
import { useUserSearch } from "../../hooks/useUserSearch";
import { useTicketTypes } from "../../hooks/useTicketTypes";
import LoadingScreen from "./LoadingScreen";
import UnconfiguredScreen from "./UnconfiguredScreen";
import UnauthenticatedScreen from "./UnauthenticatedScreen";
import UserSearchField from "./UserSearchField";
import FormFields from "./FormFields";

interface FormSettings {
  showTicketType: boolean;
  showAutoAssign: boolean;
  showStartDate: boolean;
  showTargetDate: boolean;
  showprojecttimebudget: boolean;
  showTimeTaken: boolean;
  showChargeType: boolean;
  showCategory1: boolean;
  showCategory2: boolean;
  showCategory3: boolean;
  showCategory4: boolean;
  showPriority: boolean;
  allowCompleteTickets: boolean;
}

function TicketForm() {
  const formatDate = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const budgettime = new Date();
  budgettime.setHours(0, 0, 0, 0);

  // Add app state management
  const [appState, setAppState] = useState<AppState>("loading");
  const [authError, setAuthError] = useState<string>("");

  const [formData, setFormData] = useState<FormData>({
    summary: "",
    details: "",
    projecttimebudget: formatTime(budgettime),
    timetaken: "00:00",
    startDate: formatDate(new Date()),
    targetDate: formatDate(tomorrow),
    category_1: "",
    category_2: "",
    category_3: "",
    category_4: "",
    priority_id: "",
    chargeType: "",
  });
  const [status, setStatus] = useState<{
    message: string;
    type: "error" | "success" | "";
  }>({
    message: "",
    type: "",
  });

  const [submitButtonText, setSubmitButtonText] = useState("Submit");
  const [completeButtonText, setCompleteButtonText] = useState("Complete");

  const [lastTicket, setLastTicket] = useState<LastTicket | null>(null);

  // Blocks the draft auto-save until the stored draft has been restored,
  // so the mount-time defaults never overwrite it
  const draftLoaded = useRef(false);

  const [formSettings, setFormSettings] = useState<FormSettings>({
    showTicketType: true,
    showAutoAssign: true,
    showStartDate: true,
    showTargetDate: true,
    showprojecttimebudget: true,
    showTimeTaken: true,
    showChargeType: true,
    showCategory1: true,
    showCategory2: true,
    showCategory3: true,
    showCategory4: true,
    showPriority: true,
    allowCompleteTickets: false,
  });

  const [fieldOrder, setFieldOrder] = useState<string[]>([
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
  ]);

  const [categories, setCategories] = useState<
    Record<number, { value: string; label: string }[]>
  >({});

  const [chargeTypes, setChargeTypes] = useState<ChargeType[]>([]);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string>("");

  // Auto-assign state
  const [autoAssignToMe, setAutoAssignToMe] = useState(false);
  const [myAgentId, setMyAgentId] = useState<number | null>(null);

  // User selection state
  const [allowUserSelection, setAllowUserSelection] = useState(false);
  const [selectedUser, setSelectedUser] = useState<HaloUser | null>(null);

  const { ticketTypes, fetchTicketTypes } = useTicketTypes();

  const {
    userSearch,
    availableUsers,
    isLoadingUsers,
    showUserDropdown,
    setShowUserDropdown,
    handleUserSearch,
  } = useUserSearch({
    enabled: allowUserSelection,
    onSelect: (user: HaloUser) => {
      setSelectedUser(user);
    },
  });

  // Add function to check configuration and authentication
  const checkAppState = useCallback(async () => {
    try {
      setAppState("loading");
      setAuthError("");

      // Check if extension is configured
      const settings = await chrome.storage.sync.get([
        "apiUrl",
        "selectedUser",
        "ticketTypeId",
        "clientId",
      ]);

      if (
        !settings.apiUrl ||
        !settings.selectedUser ||
        !settings.ticketTypeId
      ) {
        setAppState("unconfigured");
        return;
      }

      if (!settings.clientId) {
        setAppState("unconfigured");
        return;
      }

      // Validate API URL is HTTPS
      try {
        const url = new URL(settings.apiUrl);
        if (url.protocol !== "https:") {
          setAppState("unconfigured");
          setAuthError("API URL must use HTTPS for security");
          return;
        }
      } catch (error) {
        setAppState("unconfigured");
        setAuthError("Invalid API URL format");
        return;
      }

      // Check if user is authenticated
      try {
        const token = await HaloAuth.getAuthToken();
        if (!token) {
          setAppState("unauthenticated");
          return;
        }

        // Test the token by making a simple API call
        const response = await fetch(`${settings.apiUrl}/api/agent/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            setAppState("unauthenticated");
            setAuthError(
              "Authentication failed. Please check your credentials in the options page.",
            );
          } else {
            setAppState("unauthenticated");
            setAuthError(
              "Unable to connect to Halo. Please check your configuration.",
            );
          }
          return;
        }

        setAppState("ready");
      } catch (error) {
        setAppState("unauthenticated");
        setAuthError(
          "Authentication failed. Please check your credentials in the options page.",
        );
      }
    } catch (error) {
      setAppState("unconfigured");
      console.error("Error checking app state:", error);
    }
  }, []);

  // Add function to handle login
  const handleLogin = async () => {
    try {
      await HaloAuth.authenticate();
      await checkAppState(); // Recheck state after login
    } catch (error) {
      setAuthError(
        "Login failed. Please check your credentials in the options page.",
      );
    }
  };

  // Add function to open options page
  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
  };

  // Load saved form data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      const [formDataResult, lastTicketResult, settings] = await Promise.all([
        chrome.storage.local.get("ticketFormData"),
        chrome.storage.local.get("lastTicket"),
        chrome.storage.sync.get([
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
          "selectedUser",
          "ticketTypeId",
        ]),
      ]);

      // Only restore drafts with actual content - this also discards stale
      // empty drafts saved by older versions, whose default dates have aged
      const draft = formDataResult.ticketFormData;
      if (draft && (draft.summary?.trim() || draft.details?.trim())) {
        setFormData((prevData) => ({
          ...prevData,
          ...draft,
        }));
      }
      draftLoaded.current = true;

      if (lastTicketResult.lastTicket) {
        setLastTicket(lastTicketResult.lastTicket);
      }

      setFormSettings({
        showTicketType: settings.showTicketType ?? true,
        showAutoAssign: settings.showAutoAssign ?? true,
        showStartDate: settings.showStartDate ?? true,
        showTargetDate: settings.showTargetDate ?? true,
        showprojecttimebudget: settings.showTimeBudget ?? true,
        showTimeTaken: settings.showTimeTaken ?? true,
        showChargeType: settings.showChargeType ?? true,
        showCategory1: settings.showCategory1 ?? true,
        showCategory2: settings.showCategory2 ?? true,
        showCategory3: settings.showCategory3 ?? true,
        showCategory4: settings.showCategory4 ?? true,
        showPriority: settings.showPriority ?? true,
        allowCompleteTickets: settings.allowCompleteTickets ?? false,
      });

      // Set default ticket type from settings
      setSelectedTicketTypeId(settings.ticketTypeId || "");

      // Set field order, migrating any new fields not yet in saved order
      const defaultFieldOrder = [
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
      const savedOrder: string[] = settings.fieldOrder ?? [];
      setFieldOrder(
        savedOrder.length > 0
          ? [...savedOrder, ...defaultFieldOrder.filter((f) => !savedOrder.includes(f))]
          : defaultFieldOrder,
      );

      // Set user selection setting
      setAllowUserSelection(settings.allowUserSelection ?? false);

      // Set auto-assign setting
      setAutoAssignToMe(settings.autoAssignToMe ?? false);

      // Set selected user from settings if available
      if (settings.selectedUser) {
        setSelectedUser(settings.selectedUser);
        // Note: userSearch display name is managed by useUserSearch hook via onSelect
        // but on initial load we need to set it - this is handled by the hook's setUserSearch
      }

      // Note: Initial user search will be triggered when app state becomes "ready"
    };

    loadSavedData().then(() => {
      checkAppState();
    });
  }, []);

  // Add listener for storage changes to recheck state
  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      // Only recheck app state if sync storage changes (configuration changes)
      // Ignore local storage changes (form data saves)
      if (areaName === "sync") {
        const configKeys = [
          "apiUrl",
          "selectedUser",
          "ticketTypeId",
          "clientId",
          "clientSecret",
        ];
        const hasConfigChange = configKeys.some((key) => changes[key]);

        if (hasConfigChange) {
          checkAppState();
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [checkAppState]);

  // Debounce the save operation to avoid too many writes
  useEffect(() => {
    if (!draftLoaded.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      // Only persist once the user has written a summary or details -
      // otherwise the default dates get stored and go stale between opens
      if (!formData.summary.trim() && !formData.details.trim()) {
        chrome.storage.local.remove("ticketFormData");
        return;
      }

      chrome.storage.local.set({
        ticketFormData: {
          summary: formData.summary,
          details: formData.details,
          projecttimebudget: formData.projecttimebudget,
          timetaken: formData.timetaken,
          startDate: formData.startDate,
          targetDate: formData.targetDate,
          chargeType: formData.chargeType,
        },
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [formData]);

  const convertTimeToDecimalHours = (timeString: string): string => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const decimalHours = hours + minutes / 60;
    return decimalHours.toString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ message: "", type: "" });
    setSubmitButtonText("Submitting...");

    try {
      // At this point, we know the app is ready (configuration and auth are valid)
      const token = await HaloAuth.getAuthToken();
      const settings = await chrome.storage.sync.get([
        "apiUrl",
        "selectedUser",
        "ticketTypeId",
      ]);

      const fieldMap = {
        startDate: formSettings.showStartDate,
        targetDate: formSettings.showTargetDate,
        projecttimebudget: formSettings.showprojecttimebudget,
        timetaken: formSettings.showTimeTaken,
      } as const;

      // Determine which user to use - if user selection is allowed and user selected, use that, otherwise use default from settings
      const userToUse =
        allowUserSelection && selectedUser
          ? selectedUser
          : settings.selectedUser;

      const payload: TicketPayload = {
        summary: formData.summary,
        details: formData.details,
        user_Id: userToUse.id,
        site_id: userToUse.site_id_int.toString(),
        client_id: userToUse.client_id,
        ticketType_Id: selectedTicketTypeId || settings.ticketTypeId,
        _novalidate: true,
        ...Object.entries(fieldMap)
          .filter(([_, isEnabled]) => isEnabled)
          .reduce(
            (acc, [field]) => ({
              ...acc,
              [field]:
                field === "projecttimebudget" || field === "timetaken"
                  ? convertTimeToDecimalHours(formData[field])
                  : formData[field as keyof typeof formData],
            }),
            {},
          ),
        category_1: formData.category_1,
        category_2: formData.category_2,
        category_3: formData.category_3,
        category_4: formData.category_4,
        priority_id: formData.priority_id,
        new_actioncode: formData.chargeType || "0",
        ...(autoAssignToMe && myAgentId ? { agent_id: myAgentId } : {}),
      };

      const response = await fetch(`${settings.apiUrl}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify([payload]),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = (await response.json()) as TicketResponse;
      const baseUrl = settings.apiUrl.replace(/\/+$/, "");
      const ticketUrl = `${baseUrl}/tickets?id=${responseData.id}`;

      // Save last ticket info
      const newTicket = { id: responseData.id, url: ticketUrl };
      await Promise.all([
        chrome.storage.local.remove("ticketFormData"),
        chrome.storage.local.set({ lastTicket: newTicket }),
      ]);

      setLastTicket(newTicket);
      setSubmitButtonText("Success!");

      // Reset form after a delay
      setTimeout(() => {
        setFormData({
          summary: "",
          details: "",
          projecttimebudget: formatTime(budgettime),
          timetaken: "00:00",
          startDate: formatDate(new Date()),
          targetDate: formatDate(tomorrow),
          category_1: "",
          category_2: "",
          category_3: "",
          category_4: "",
          priority_id: "",
          chargeType: "",
        });
        setSubmitButtonText("Submit");
      }, 2000);
    } catch (error) {
      setStatus({
        message: error instanceof Error ? error.message : "An error occurred",
        type: "error",
      });
      setSubmitButtonText("Submit");
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ message: "", type: "" });
    setCompleteButtonText("Completing...");

    try {
      // At this point, we know the app is ready (configuration and auth are valid)
      const token = await HaloAuth.getAuthToken();
      const settings = await chrome.storage.sync.get([
        "apiUrl",
        "selectedUser",
        "ticketTypeId",
      ]);

      const fieldMap = {
        startDate: formSettings.showStartDate,
        targetDate: formSettings.showTargetDate,
        projecttimebudget: formSettings.showprojecttimebudget,
        timetaken: formSettings.showTimeTaken,
      } as const;

      // Determine which user to use - if user selection is allowed and user selected, use that, otherwise use default from settings
      const userToUse =
        allowUserSelection && selectedUser
          ? selectedUser
          : settings.selectedUser;

      const payload: TicketPayload = {
        summary: formData.summary,
        details: formData.details,
        user_Id: userToUse.id,
        site_id: userToUse.site_id_int.toString(),
        client_id: userToUse.client_id,
        ticketType_Id: selectedTicketTypeId || settings.ticketTypeId,
        _novalidate: true,
        status_id: 9,
        _newticket_quickclose: true,
        ...Object.entries(fieldMap)
          .filter(([_, isEnabled]) => isEnabled)
          .reduce(
            (acc, [field]) => ({
              ...acc,
              [field]:
                field === "projecttimebudget" || field === "timetaken"
                  ? convertTimeToDecimalHours(formData[field])
                  : formData[field as keyof typeof formData],
            }),
            {},
          ),
        category_1: formData.category_1,
        category_2: formData.category_2,
        category_3: formData.category_3,
        category_4: formData.category_4,
        priority_id: formData.priority_id,
        new_actioncode: formData.chargeType || "0",
        ...(autoAssignToMe && myAgentId ? { agent_id: myAgentId } : {}),
      };

      const response = await fetch(`${settings.apiUrl}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify([payload]),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = (await response.json()) as TicketResponse;
      const baseUrl = settings.apiUrl.replace(/\/+$/, "");
      const ticketUrl = `${baseUrl}/tickets?id=${responseData.id}`;

      // Save last ticket info
      const newTicket = { id: responseData.id, url: ticketUrl };
      await Promise.all([
        chrome.storage.local.remove("ticketFormData"),
        chrome.storage.local.set({ lastTicket: newTicket }),
      ]);

      setLastTicket(newTicket);
      setCompleteButtonText("Success!");

      // Reset form after a delay
      setTimeout(() => {
        setFormData({
          summary: "",
          details: "",
          projecttimebudget: formatTime(budgettime),
          timetaken: "00:00",
          startDate: formatDate(new Date()),
          targetDate: formatDate(tomorrow),
          category_1: "",
          category_2: "",
          category_3: "",
          category_4: "",
          priority_id: "",
          chargeType: "",
        });
        setCompleteButtonText("Complete");
      }, 2000);
    } catch (error) {
      setStatus({
        message: error instanceof Error ? error.message : "An error occurred",
        type: "error",
      });
      setCompleteButtonText("Complete");
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      const token = await HaloAuth.getAuthToken();
      const settings = await chrome.storage.sync.get(["apiUrl"]);

      if (!token || !settings.apiUrl) {
        console.error("Missing token or API URL");
        return;
      }

      const response = await fetch(`${settings.apiUrl}/api/Category`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token may have expired, set app state to unauthenticated
          setAppState("unauthenticated");
          setAuthError("Authentication expired. Please log in again.");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Category[] = await response.json();

      // Organize categories by type_id
      const organizedCategories: Record<
        number,
        { value: string; label: string }[]
      > = {};

      data.forEach((category) => {
        if (!organizedCategories[category.type_id]) {
          organizedCategories[category.type_id] = [];
        }

        const parts = category.category_name
          .split(">")
          .map((part) => part.trim());

        // Add each level of the hierarchy as a separate option
        let currentPath = "";
        parts.forEach((part, index) => {
          currentPath = index === 0 ? part : `${currentPath}>${part}`;

          // Only add if this exact path isn't already in the options
          if (
            !organizedCategories[category.type_id].some(
              (opt) => opt.value === currentPath,
            )
          ) {
            organizedCategories[category.type_id].push({
              value: currentPath,
              label: currentPath,
            });
          }
        });
      });

      // Sort options alphabetically within each type
      Object.values(organizedCategories).forEach((options) => {
        options.sort((a, b) => a.label.localeCompare(b.label));
      });

      setCategories(organizedCategories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      // If there's an error, assume authentication issue and set to unauthenticated
      setAppState("unauthenticated");
      setAuthError("Failed to load categories. Please log in again.");
    }
  }, [checkAppState]);

  const fetchChargeTypes = useCallback(async () => {
    try {
      const token = await HaloAuth.getAuthToken();
      const settings = await chrome.storage.sync.get(["apiUrl"]);

      if (!token || !settings.apiUrl) {
        console.error("Missing token or API URL");
        return;
      }

      const response = await fetch(
        `${settings.apiUrl}/api/Lookup?lookupid=17&showallcodes=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Token may have expired, set app state to unauthenticated
          setAppState("unauthenticated");
          setAuthError("Authentication expired. Please log in again.");
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ChargeType[] = await response.json();
      setChargeTypes(data);
    } catch (error) {
      console.error("Failed to fetch charge types:", error);
      // If there's an error, assume authentication issue and set to unauthenticated
      setAppState("unauthenticated");
      setAuthError("Failed to load charge types. Please log in again.");
    }
  }, [checkAppState]);

  // Fetch the current agent's ID for auto-assign
  const fetchMyAgentId = useCallback(async () => {
    try {
      const token = await HaloAuth.getAuthToken();
      const settings = await chrome.storage.sync.get(["apiUrl"]);

      if (!token || !settings.apiUrl) return;

      const response = await fetch(`${settings.apiUrl}/api/Agent/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data.id) {
        setMyAgentId(data.id);
      }
    } catch (error) {
      console.error("Failed to fetch agent ID:", error);
    }
  }, []);

  useEffect(() => {
    if (appState === "ready") {
      fetchCategories();
      fetchChargeTypes();
      fetchTicketTypes();
      fetchMyAgentId();
      // Load initial users if user selection is allowed
      if (allowUserSelection) {
        handleUserSearch("");
      }
    }
  }, [appState, fetchCategories, fetchChargeTypes, fetchTicketTypes, fetchMyAgentId, allowUserSelection]);

  // Render different screens based on app state
  if (appState === "loading") {
    return <LoadingScreen />;
  }

  if (appState === "unconfigured") {
    return (
      <UnconfiguredScreen
        onOpenSettings={openOptionsPage}
        onRefresh={checkAppState}
      />
    );
  }

  if (appState === "unauthenticated") {
    return (
      <UnauthenticatedScreen
        authError={authError}
        onLogin={handleLogin}
        onOpenSettings={openOptionsPage}
        onRefresh={checkAppState}
      />
    );
  }

  // App is ready - show the ticket form
  return (
    <div className="w-full max-w-lg text-sm">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3 p-3">
        <div className="flex justify-between items-center pb-2 mb-1 border-b border-gray-100">
          <h1 className="text-sm font-semibold text-gray-800">Create a ticket</h1>
          {lastTicket && (
            <a
              href={lastTicket.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full transition-colors"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Last ticket
            </a>
          )}
        </div>

        {/* User Selection */}
        {allowUserSelection && (
          <UserSearchField
            selectedUser={selectedUser}
            userSearch={userSearch}
            availableUsers={availableUsers}
            isLoadingUsers={isLoadingUsers}
            showUserDropdown={showUserDropdown}
            setShowUserDropdown={setShowUserDropdown}
            onSearch={handleUserSearch}
            onSelect={(user) => {
              setSelectedUser(user);
            }}
            onClear={() => {
              setSelectedUser(null);
            }}
          />
        )}

        <div>
          <label
            htmlFor="summary"
            className="block text-gray-500 text-xs font-medium pb-1"
          >
            Summary
          </label>
          <input
            type="text"
            tabIndex={1}
            id="summary"
            className="w-full bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-xs transition-colors py-1"
            placeholder="Brief Task Description"
            value={formData.summary}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, summary: e.target.value }))
            }
          />
        </div>
        <div className="flex-grow">
          <label
            htmlFor="details"
            className="block text-gray-500 text-xs font-medium pb-1"
          >
            Details
          </label>
          <textarea
            tabIndex={2}
            id="details"
            className="h-full min-h-[70px] w-full bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-xs transition-colors py-1"
            placeholder="Additional Task Information"
            value={formData.details}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, details: e.target.value }))
            }
          />
        </div>

        {/* All fields in 2-column grid respecting fieldOrder */}
        <div className="border-t border-gray-100 pt-2"></div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <FormFields
            fieldOrder={fieldOrder}
            formData={formData}
            formSettings={formSettings}
            categories={categories}
            chargeTypes={chargeTypes}
            ticketTypes={ticketTypes}
            selectedTicketTypeId={selectedTicketTypeId}
            autoAssignToMe={autoAssignToMe}
            onFormDataChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
            onTicketTypeChange={setSelectedTicketTypeId}
            onAutoAssignChange={setAutoAssignToMe}
          />
        </div>

        <div
          className={`flex gap-2 mt-2 ${!formSettings.allowCompleteTickets ? "justify-center" : ""}`}
        >
          <button
            type="submit"
            tabIndex={6}
            disabled={submitButtonText !== "Submit"}
            className={`${
              submitButtonText === "Success!"
                ? "bg-green-500 hover:bg-green-600 shadow-green-200"
                : submitButtonText === "Submitting..."
                  ? "bg-gray-400"
                  : "bg-blue-500 hover:bg-blue-600 shadow-blue-200"
            } text-white font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
              formSettings.allowCompleteTickets ? "flex-1" : "w-full"
            }`}
          >
            {submitButtonText}
          </button>
          {formSettings.allowCompleteTickets && (
            <button
              type="button"
              tabIndex={7}
              disabled={completeButtonText !== "Complete"}
              onClick={handleComplete}
              className={`${
                completeButtonText === "Success!"
                  ? "bg-green-500 hover:bg-green-600 shadow-green-200"
                  : completeButtonText === "Completing..."
                    ? "bg-gray-400"
                    : "bg-purple-500 hover:bg-purple-600 shadow-purple-200"
              } text-white font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex-1`}
            >
              {completeButtonText}
            </button>
          )}
        </div>
        {status.message && (
          <div
            className={`text-xs px-3 py-2 rounded-lg ${status.type === "error" ? "text-red-700 bg-red-50 border border-red-100" : "text-green-700 bg-green-50 border border-green-100"}`}
            dangerouslySetInnerHTML={{ __html: status.message }}
          />
        )}
      </form>
    </div>
  );
}

export default TicketForm;
