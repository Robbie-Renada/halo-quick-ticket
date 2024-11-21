import { useState, useEffect } from "react";
import HaloPSAAuth from "../services/auth";

interface FormData {
  summary: string;
  details: string;
  projecttimebudget: string;
  startDate: string;
  targetDate: string;
  category_1: string;
  category_2: string;
  category_3: string;
  category_4: string;
  priority_id: string;
}

interface TicketPayload {
  summary: string;
  details: string;
  user_Id: string;
  ticketType_Id: string;
  projecttimebudget?: string;
  startDate?: string;
  targetDate?: string;
  _novalidate: boolean;
  category_1: string;
  category_2: string;
  category_3: string;
  category_4: string;
  priority_id: string;
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

  const [formData, setFormData] = useState<FormData>({
    summary: "",
    details: "",
    projecttimebudget: formatTime(budgettime),
    startDate: formatDate(new Date()),
    targetDate: formatDate(tomorrow),
    category_1: "",
    category_2: "",
    category_3: "",
    category_4: "",
    priority_id: "",
  });
  const [status, setStatus] = useState<{
    message: string;
    type: "error" | "success" | "";
  }>({
    message: "",
    type: "",
  });

  const [buttonText, setButtonText] = useState("Submit");

  const [lastTicket, setLastTicket] = useState<LastTicket | null>(null);

  const [formSettings, setFormSettings] = useState({
    showStartDate: true,
    showTargetDate: true,
    showprojecttimebudget: true,
    showCategory1: true,
    showCategory2: true,
    showCategory3: true,
    showCategory4: true,
    showPriority: true,
  });

  const [categories, setCategories] = useState<Record<number, { value: string; label: string }[]>>({});

  // Add this constant for priority options
  const PRIORITY_OPTIONS = [
    { value: "1", label: "Critical" },
    { value: "2", label: "High" },
    { value: "3", label: "Medium" },
    { value: "4", label: "Low" },
  ];

  // Load saved form data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      const [formData, lastTicket, settings] = await Promise.all([
        chrome.storage.local.get("ticketFormData"),
        chrome.storage.local.get("lastTicket"),
        chrome.storage.sync.get([
          "showStartDate",
          "showTargetDate",
          "showprojecttimebudget",
          "showCategory1",
          "showCategory2",
          "showCategory3",
          "showCategory4",
          "showPriority",
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
        showprojecttimebudget: settings.showprojecttimebudget ?? true,
        showCategory1: settings.showCategory1 ?? true,
        showCategory2: settings.showCategory2 ?? true,
        showCategory3: settings.showCategory3 ?? true,
        showCategory4: settings.showCategory4 ?? true,
        showPriority: settings.showPriority ?? true,
      });
    };
    loadSavedData();
  }, []);

  // Debounce the save operation to avoid too many writes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      chrome.storage.local.set({
        ticketFormData: {
          summary: formData.summary,
          details: formData.details,
          projecttimebudget: formData.projecttimebudget,
          startDate: formData.startDate,
          targetDate: formData.targetDate,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ message: "", type: "" });
    setButtonText("Submitting...");

    try {
      const token = await HaloPSAAuth.getAuthToken();
      if (!token) {
        setStatus({
          message: "Please log in before creating a ticket",
          type: "error",
        });
        setButtonText("Submit");
        return;
      }

      const settings = await chrome.storage.sync.get([
        "apiUrl",
        "userId",
        "ticketTypeId",
      ]);

      if (!settings.apiUrl || !settings.userId || !settings.ticketTypeId) {
        setStatus({
          message: "Please configure extension settings first",
          type: "error",
        });
        setButtonText("Submit");
        return;
      }

      const fieldMap = {
        startDate: formSettings.showStartDate,
        targetDate: formSettings.showTargetDate,
        projecttimebudget: formSettings.showprojecttimebudget,
      } as const;

      const payload: TicketPayload = {
        summary: formData.summary,
        details: formData.details,
        user_Id: settings.userId,
        ticketType_Id: settings.ticketTypeId,
        _novalidate: true,
        ...Object.entries(fieldMap)
          .filter(([_, isEnabled]) => isEnabled)
          .reduce(
            (acc, [field]) => ({
              ...acc,
              [field]:
                field === "projecttimebudget"
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
      setButtonText("Success!");

      // Reset form after a delay
      setTimeout(() => {
        setFormData({
          summary: "",
          details: "",
          projecttimebudget: formatTime(budgettime),
          startDate: formatDate(new Date()),
          targetDate: formatDate(tomorrow),
          category_1: "",
          category_2: "", 
          category_3: "",
          category_4: "",
          priority_id: "",
        });
        setButtonText("Submit");
      }, 2000);
    } catch (error) {
      setStatus({
        message: error instanceof Error ? error.message : "An error occurred",
        type: "error",
      });
      setButtonText("Submit");
    }
  };

  const fetchCategories = async () => {
    try {
      const token = await HaloPSAAuth.getAuthToken();
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Category[] = await response.json();
      
      // Organize categories by type_id
      const organizedCategories: Record<number, { value: string; label: string }[]> = {};
      
      data.forEach((category) => {
        if (!organizedCategories[category.type_id]) {
          organizedCategories[category.type_id] = [];
        }
        
        const parts = category.category_name.split('>').map(part => part.trim());
        
        // Add each level of the hierarchy as a separate option
        let currentPath = '';
        parts.forEach((part, index) => {
          currentPath = index === 0 ? part : `${currentPath} > ${part}`;
          
          // Only add if this exact path isn't already in the options
          if (!organizedCategories[category.type_id].some(opt => opt.value === currentPath)) {
            organizedCategories[category.type_id].push({
              value: currentPath,
              label: currentPath
            });
          }
        });
      });

      // Sort options alphabetically within each type
      Object.values(organizedCategories).forEach(options => {
        options.sort((a, b) => a.label.localeCompare(b.label));
      });

      setCategories(organizedCategories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const CategorySelect = ({ 
    typeId, 
    value, 
    onChange, 
    label 
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

  return (
    <div className="w-full bg-white rounded-md shadow-md text-sm">
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

        {formSettings.showprojecttimebudget && (
          <div>
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
        )}

        {formSettings.showStartDate && (
          <div>
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
                setFormData((prev) => ({ ...prev, startDate: e.target.value }))
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
        )}

        {formSettings.showTargetDate && (
          <div>
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
                setFormData((prev) => ({ ...prev, targetDate: e.target.value }))
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
        )}

        {formSettings.showPriority && (
          <div>
            <label className="block text-gray-700 text-xs font-bold pb-1">
              Priority
            </label>
            <select
              value={formData.priority_id}
              onChange={(e) => setFormData(prev => ({ ...prev, priority_id: e.target.value }))}
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
        )}

        <div className="space-y-2">
          {formSettings.showCategory1 && (
            <CategorySelect
              typeId={1}
              value={formData.category_1}
              onChange={(value) => setFormData(prev => ({ ...prev, category_1: value }))}
              label="Category 1"
            />
          )}
          {formSettings.showCategory2 && (
            <CategorySelect
              typeId={2}
              value={formData.category_2}
              onChange={(value) => setFormData(prev => ({ ...prev, category_2: value }))}
              label="Category 2"
            />
          )}
          {formSettings.showCategory3 && (
            <CategorySelect
              typeId={3}
              value={formData.category_3}
              onChange={(value) => setFormData(prev => ({ ...prev, category_3: value }))}
              label="Category 3"
            />
          )}
          {formSettings.showCategory4 && (
            <CategorySelect
              typeId={4}
              value={formData.category_4}
              onChange={(value) => setFormData(prev => ({ ...prev, category_4: value }))}
              label="Category 4"
            />
          )}
        </div>

        <button
          type="submit"
          tabIndex={6}
          disabled={buttonText !== "Submit"}
          className={`${
            buttonText === "Success!"
              ? "bg-green-500 hover:bg-green-600"
              : buttonText === "Submitting..."
                ? "bg-gray-500"
                : "bg-blue-500 hover:bg-blue-600"
          } text-white px-4 py-1.5 rounded-md shadow-sm mt-1 transition-colors duration-200`}
        >
          {buttonText}
        </button>
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
