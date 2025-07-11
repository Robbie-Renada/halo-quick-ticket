import { useState, useEffect, useCallback } from "react";
import HaloAuth from "../services/auth";
import UserService, { HaloUser } from "../services/userService";

interface FormData {
  summary: string;
  details: string;
  projecttimebudget: string;
  timetaken: string;
  startDate: string;
  targetDate: string;
  category_1: string;
  category_2: string;
  category_3: string;
  category_4: string;
  priority_id: string;
  chargeType: string;
}

interface TicketPayload {
  summary: string;
  details: string;
  user_Id: string;
  site_id?: string;
  client_id?: string;
  ticketType_Id: string;
  projecttimebudget?: string;
  timetaken?: string;
  startDate?: string;
  targetDate?: string;
  _novalidate: boolean;
  category_1: string;
  category_2: string;
  category_3: string;
  category_4: string;
  priority_id: string;
  new_actioncode?: string;
  status_id?: number;
  _newticket_quickclose?: boolean;
}

interface TicketResponse {
  id: number;
}

interface LastTicket {
  id: number;
  url: string;
}

interface Category {
  guid: string;
  id: number;
  value: string;
  category_name: string;
  type_id: number;
  category_group_id: number;
}

interface ChargeType {
  id: number;
  name: string;
}

// Add app state type
type AppState = "loading" | "unconfigured" | "unauthenticated" | "ready";

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

  const [formSettings, setFormSettings] = useState({
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

  // User selection state
  const [allowUserSelection, setAllowUserSelection] = useState(false);
  const [selectedUser, setSelectedUser] = useState<HaloUser | null>(null);
  const [availableUsers, setAvailableUsers] = useState<HaloUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userSearchTimeout, setUserSearchTimeout] = useState<number | null>(
    null,
  );

  // Add this constant for priority options
  const PRIORITY_OPTIONS = [
    { value: "1", label: "Critical" },
    { value: "2", label: "High" },
    { value: "3", label: "Medium" },
    { value: "4", label: "Low" },
  ];

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
        const response = await fetch(`${settings.apiUrl}api/agent/me`, {
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
      const [formData, lastTicket, settings] = await Promise.all([
        chrome.storage.local.get("ticketFormData"),
        chrome.storage.local.get("lastTicket"),
        chrome.storage.sync.get([
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
          "selectedUser",
        ]),
      ]);

      if (formData.ticketFormData) {
        setFormData((prevData) => ({
          ...prevData,
          ...formData.ticketFormData,
        }));
      }

      if (lastTicket.lastTicket) {
        setLastTicket(lastTicket.lastTicket);
      }

      setFormSettings({
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

      // Set field order
      setFieldOrder(
        settings.fieldOrder ?? [
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
      );

      // Set user selection setting
      setAllowUserSelection(settings.allowUserSelection ?? false);

      // Set selected user from settings if available
      if (settings.selectedUser) {
        setSelectedUser(settings.selectedUser);
        setUserSearch(
          UserService.formatUserDisplayNameCompact(
            settings.selectedUser.name,
            settings.selectedUser.site_name,
            settings.selectedUser.client_name,
          ),
        );
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
    const timeoutId = setTimeout(() => {
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

  const HandleDateButton = (field: "start" | "target", offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    if (field === "start") {
      setFormData({ ...formData, startDate: formatDate(date) });
    } else {
      setFormData({ ...formData, targetDate: formatDate(date) });
    }
  };

  const HandleTimeButton = (hours: number) => {
    const time = new Date();
    time.setHours(hours);
    time.setMinutes(0);
    setFormData({ ...formData, projecttimebudget: formatTime(time) });
  };

  const HandleAddTimeButton = (hours: number) => {
    const time = new Date();
    const [currentHours, currentMinutes] =
      formData.projecttimebudget.split(":");
    time.setHours(parseInt(currentHours), parseInt(currentMinutes));
    const minutesToAdd = hours * 60;
    time.setMinutes(time.getMinutes() + minutesToAdd);
    setFormData({ ...formData, projecttimebudget: formatTime(time) });
  };

  const convertTimeToDecimalHours = (timeString: string): string => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const decimalHours = hours + minutes / 60;
    return decimalHours.toString();
  };

  // User search and selection functions
  const searchUsers = async (searchTerm: string) => {
    if (!allowUserSelection) return;

    setIsLoadingUsers(true);
    try {
      const users = await UserService.fetchUsers(searchTerm);
      setAvailableUsers(users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setAvailableUsers([]);
      // If authentication fails, set app state to unauthenticated
      if (error instanceof Error && error.message.includes("authentication")) {
        setAppState("unauthenticated");
        setAuthError("Authentication expired. Please log in again.");
      }
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
    setSelectedUser(user);
    setUserSearch(
      UserService.formatUserDisplayNameCompact(
        user.name,
        user.site_name,
        user.client_name,
      ),
    );
    setShowUserDropdown(false);
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
        ticketType_Id: settings.ticketTypeId,
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
      };

      const response = await fetch(`${settings.apiUrl}api/tickets`, {
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
      const ticketUrl = `${settings.apiUrl}tickets?id=${responseData.id}`;

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
        ticketType_Id: settings.ticketTypeId,
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
      };

      const response = await fetch(`${settings.apiUrl}api/tickets`, {
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
      const ticketUrl = `${settings.apiUrl}tickets?id=${responseData.id}`;

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

  useEffect(() => {
    if (appState === "ready") {
      fetchCategories();
      fetchChargeTypes();
      // Load initial users if user selection is allowed
      if (allowUserSelection) {
        searchUsers("");
      }
    }
  }, [appState, fetchCategories, fetchChargeTypes, allowUserSelection]);

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

  const CategorySelect = ({
    typeId,
    value,
    onChange,
    label,
  }: {
    typeId: number;
    value: string;
    onChange: (value: string) => void;
    label: string;
  }) => {
    const options = categories[typeId] || [];

    return (
      <div>
        <label className="block text-gray-700 text-xs font-medium mb-1">
          {label}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-gray-50 rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-xs"
          title={label}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  // Dynamic field rendering system
  const renderFormField = (fieldKey: string) => {
    switch (fieldKey) {
      case "projecttimebudget":
        return (
          formSettings.showprojecttimebudget && (
            <div key={fieldKey}>
              <label
                htmlFor="projecttimebudget"
                className="block text-gray-700 text-xs font-bold pb-1"
              >
                Time Budget
              </label>
              <input
                type="time"
                tabIndex={3}
                id="projecttimebudget"
                className="w-full bg-gray-50 rounded-md shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-xs"
                value={formData.projecttimebudget}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(":");
                  const newTime = new Date();
                  newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                  setFormData((prev) => ({
                    ...prev,
                    projecttimebudget: formatTime(newTime),
                  }));
                }}
              />
              <div className="w-full flex pt-0.5 gap-1">
                <button
                  type="button"
                  className="bg-gray-200 text-gray-500 rounded-md shadow-sm text-[10px] w-1/3 hover:bg-gray-300"
                  onClick={() => HandleAddTimeButton(0.25)}
                >
                  + 15 Minutes
                </button>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-500 rounded-md shadow-sm text-[10px] w-1/3 hover:bg-gray-300"
                  onClick={() => HandleTimeButton(1)}
                >
                  1 Hour
                </button>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-500 rounded-md shadow-sm text-[10px] w-1/3 hover:bg-gray-300"
                  onClick={() => HandleTimeButton(2)}
                >
                  2 Hours
                </button>
              </div>
            </div>
          )
        );

      case "startDate":
        return (
          formSettings.showStartDate && (
            <div key={fieldKey}>
              <label
                htmlFor="startdate"
                className="block text-gray-700 text-xs font-bold pb-1"
              >
                Start Date
              </label>
              <input
                type="date"
                tabIndex={4}
                id="startdate"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="w-full bg-gray-50 rounded-md shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-xs"
              />
              <div className="w-full flex pt-0.5 gap-1">
                <button
                  type="button"
                  className="bg-gray-200 text-gray-500 rounded-md shadow-sm text-[10px] w-1/2 hover:bg-gray-300"
                  onClick={() => HandleDateButton("start", 0)}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-500 rounded-md shadow-sm text-[10px] w-1/2 hover:bg-gray-300"
                  onClick={() => HandleDateButton("start", 1)}
                >
                  Tomorrow
                </button>
              </div>
            </div>
          )
        );

      case "targetDate":
        return (
          formSettings.showTargetDate && (
            <div key={fieldKey}>
              <label
                htmlFor="targetdate"
                className="block text-gray-700 text-xs font-bold pb-1"
              >
                Target Date
              </label>
              <input
                type="date"
                tabIndex={5}
                id="targetdate"
                value={formData.targetDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    targetDate: e.target.value,
                  }))
                }
                className="w-full bg-gray-50 rounded-md shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-xs"
              />
              <div className="w-full flex pt-0.5 gap-1">
                <button
                  type="button"
                  className="bg-gray-200 text-gray-500 rounded-md shadow-sm text-[10px] w-1/2 hover:bg-gray-300"
                  onClick={() => HandleDateButton("target", 0)}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-500 rounded-md shadow-sm text-[10px] w-1/2 hover:bg-gray-300"
                  onClick={() => HandleDateButton("target", 1)}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-500 rounded-md shadow-sm text-[10px] w-1/2 hover:bg-gray-300"
                  onClick={() => HandleDateButton("target", 7)}
                >
                  Next Week
                </button>
              </div>
            </div>
          )
        );

      case "priority":
        return (
          formSettings.showPriority && (
            <div key={fieldKey}>
              <label className="block text-gray-700 text-xs font-bold pb-1">
                Priority
              </label>
              <select
                title="Priority"
                value={formData.priority_id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority_id: e.target.value,
                  }))
                }
                className="w-full bg-gray-50 rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option value="">Select Priority</option>
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )
        );

      case "category1":
        return (
          formSettings.showCategory1 && (
            <CategorySelect
              key={fieldKey}
              typeId={1}
              value={formData.category_1}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, category_1: value }))
              }
              label="Category 1"
            />
          )
        );

      case "category2":
        return (
          formSettings.showCategory2 && (
            <CategorySelect
              key={fieldKey}
              typeId={2}
              value={formData.category_2}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, category_2: value }))
              }
              label="Category 2"
            />
          )
        );

      case "category3":
        return (
          formSettings.showCategory3 && (
            <CategorySelect
              key={fieldKey}
              typeId={3}
              value={formData.category_3}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, category_3: value }))
              }
              label="Category 3"
            />
          )
        );

      case "category4":
        return (
          formSettings.showCategory4 && (
            <CategorySelect
              key={fieldKey}
              typeId={4}
              value={formData.category_4}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, category_4: value }))
              }
              label="Category 4"
            />
          )
        );

      case "timetaken":
        return (
          formSettings.showTimeTaken && (
            <div key={fieldKey}>
              <label
                htmlFor="timetaken"
                className="block text-gray-700 text-xs font-bold pb-1"
              >
                Time Taken
              </label>
              <input
                type="time"
                tabIndex={3}
                id="timetaken"
                className="w-full bg-gray-50 rounded-md shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-xs"
                value={formData.timetaken}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(":");
                  const newTime = new Date();
                  newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                  setFormData((prev) => ({
                    ...prev,
                    timetaken: formatTime(newTime),
                  }));
                }}
              />
              <div className="w-full flex pt-0.5 gap-1">
                <button
                  type="button"
                  className="bg-gray-200 text-gray-500 rounded-md shadow-sm text-[10px] w-1/3 hover:bg-gray-300"
                  onClick={() => {
                    const [hours, minutes] = formData.timetaken.split(":");
                    const currentTime = new Date();
                    currentTime.setHours(
                      parseInt(hours),
                      parseInt(minutes),
                      0,
                      0,
                    );
                    currentTime.setMinutes(currentTime.getMinutes() + 15);
                    setFormData((prev) => ({
                      ...prev,
                      timetaken: formatTime(currentTime),
                    }));
                  }}
                >
                  + 15 Minutes
                </button>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-500 rounded-md shadow-sm text-[10px] w-1/3 hover:bg-gray-300"
                  onClick={() => {
                    const newTime = new Date();
                    newTime.setHours(1, 0, 0, 0);
                    setFormData((prev) => ({
                      ...prev,
                      timetaken: formatTime(newTime),
                    }));
                  }}
                >
                  1 Hour
                </button>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-500 rounded-md shadow-sm text-[10px] w-1/3 hover:bg-gray-300"
                  onClick={() => {
                    const newTime = new Date();
                    newTime.setHours(2, 0, 0, 0);
                    setFormData((prev) => ({
                      ...prev,
                      timetaken: formatTime(newTime),
                    }));
                  }}
                >
                  2 Hours
                </button>
              </div>
            </div>
          )
        );

      case "chargeType":
        return (
          formSettings.showChargeType && (
            <div key={fieldKey}>
              <label className="block text-gray-700 text-xs font-bold pb-1">
                Charge Type
              </label>
              <select
                title="Charge Type"
                value={formData.chargeType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    chargeType: e.target.value,
                  }))
                }
                className="w-full bg-gray-50 rounded-md shadow-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-xs"
              >
                <option value="">Select Charge Type</option>
                {chargeTypes.map((chargeType) => (
                  <option key={chargeType.id} value={chargeType.id.toString()}>
                    {chargeType.name}
                  </option>
                ))}
              </select>
            </div>
          )
        );

      default:
        return null;
    }
  };

  // Render different screens based on app state
  if (appState === "loading") {
    return (
      <div className="w-full min-h-[470px] bg-white rounded-md shadow-md text-sm flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (appState === "unconfigured") {
    return (
      <div className="w-full min-h-[470px] bg-white rounded-md shadow-md text-sm flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Extension Setup Required
          </h2>
          <p className="text-gray-600 mb-4">
            Before you can create tickets, you need to configure your Halo
            settings.
          </p>
          <div className="flex gap-2">
            <button
              onClick={openOptionsPage}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm transition-colors duration-200"
            >
              Open Settings
            </button>
            <button
              onClick={checkAppState}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md shadow-sm transition-colors duration-200"
              title="Refresh status"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appState === "unauthenticated") {
    return (
      <div className="w-full min-h-[470px] bg-white rounded-md shadow-md text-sm flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-4">
            Please log in to your Halo account to create tickets.
          </p>
          {authError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-red-700 text-sm">{authError}</p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleLogin}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm transition-colors duration-200"
            >
              Login to Halo
            </button>
            <button
              onClick={openOptionsPage}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md shadow-sm transition-colors duration-200"
            >
              Check Settings
            </button>
            <button
              onClick={checkAppState}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md shadow-sm transition-colors duration-200"
              title="Refresh status"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // App is ready - show the ticket form
  return (
    <div className="w-full max-w-lg bg-white rounded-md shadow-md text-sm">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-2 p-2">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-base font-semibold">Create a ticket</h1>
          {lastTicket && (
            <a
              href={lastTicket.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
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
              Open in Halo
            </a>
          )}
        </div>

        {/* User Selection */}
        {allowUserSelection && (
          <div>
            <label className="block text-gray-700 text-xs font-bold pb-1">
              User
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for user..."
                value={
                  selectedUser
                    ? UserService.formatUserDisplayNameCompact(
                        selectedUser.name,
                        selectedUser.site_name,
                        selectedUser.client_name,
                      )
                    : userSearch
                }
                onChange={(e) => {
                  if (selectedUser) {
                    // Clear selection and start fresh search
                    setSelectedUser(null);
                    setUserSearch(e.target.value);
                    handleUserSearch(e.target.value);
                  } else {
                    handleUserSearch(e.target.value);
                  }
                  setShowUserDropdown(true);
                }}
                onFocus={() => {
                  if (selectedUser) {
                    // Clear selection when clicking on selected user
                    setSelectedUser(null);
                    setUserSearch("");
                  }
                  setShowUserDropdown(true);
                }}
                className={`w-full bg-gray-50 rounded-md shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-xs py-1 ${
                  selectedUser ? "cursor-pointer" : ""
                }`}
              />

              {showUserDropdown && !selectedUser && (
                <div className="user-dropdown absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                  {isLoadingUsers ? (
                    <div className="p-2 text-xs text-gray-500">
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
                          <div className="text-xs font-medium text-gray-900">
                            {compactDisplay}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-2 text-xs text-gray-500">
                      No users found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="summary"
            className="block text-gray-700 text-xs font-bold pb-1"
          >
            Summary
          </label>
          <input
            type="text"
            tabIndex={1}
            id="summary"
            className="w-full bg-gray-50 rounded-md shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-xs py-1"
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
            className="block text-gray-700 text-xs font-bold pb-1"
          >
            Details
          </label>
          <textarea
            tabIndex={2}
            id="details"
            className="h-full min-h-[90px] w-full bg-gray-50 rounded-md shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-xs py-1"
            placeholder="Additional Task Information"
            value={formData.details}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, details: e.target.value }))
            }
          />
        </div>

        {/* All fields in 2-column grid respecting fieldOrder */}
        <div className="grid grid-cols-2 gap-2">
          {fieldOrder.map(renderFormField)}
        </div>

        <div
          className={`flex gap-2 mt-1 ${!formSettings.allowCompleteTickets ? "justify-center" : ""}`}
        >
          <button
            type="submit"
            tabIndex={6}
            disabled={submitButtonText !== "Submit"}
            className={`${
              submitButtonText === "Success!"
                ? "bg-green-500 hover:bg-green-600"
                : submitButtonText === "Submitting..."
                  ? "bg-gray-500"
                  : "bg-blue-500 hover:bg-blue-600"
            } text-white px-4 py-1.5 rounded-md shadow-sm transition-colors duration-200 ${
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
                  ? "bg-green-500 hover:bg-green-600"
                  : completeButtonText === "Completing..."
                    ? "bg-gray-500"
                    : "bg-purple-500 hover:bg-purple-600"
              } text-white px-4 py-1.5 rounded-md shadow-sm transition-colors duration-200 flex-1`}
            >
              {completeButtonText}
            </button>
          )}
        </div>
        {status.message && (
          <div
            className={`text-sm ${status.type === "error" ? "text-red-600" : ""}`}
            dangerouslySetInnerHTML={{ __html: status.message }}
          />
        )}
      </form>
    </div>
  );
}
export default TicketForm;
