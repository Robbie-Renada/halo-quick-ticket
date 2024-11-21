import { useState, useEffect } from "react";
import HaloPSAAuth from "../services/auth";

interface FormData {
  summary: string;
  details: string;
  projecttimebudget: string;
  startDate: string;
  targetDate: string;
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
}

interface TicketResponse {
  id: number;
}

interface LastTicket {
  id: number;
  url: string;
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
  });

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

  return (
    <div className="w-full bg-white rounded-md shadow-md text-sm">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold mb-0">Create a ticket</h1>
          {lastTicket && (
            <a
              href={lastTicket.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
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
            className="w-full bg-gray-50 rounded-md shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-xs"
            placeholder="Brief Task Description"
            value={formData.summary}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, summary: e.target.value }))
            }
          />
        </div>
        <div>
          <label
            htmlFor="details"
            className="block text-gray-700 text-xs font-bold pb-1"
          >
            Details
          </label>
          <textarea
            tabIndex={2}
            id="details"
            className="max-h-40 w-full bg-gray-50 rounded-md shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-xs"
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
            <div className="w-full flex pt-1 gap-2">
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
            <div className="w-full flex pt-1 gap-2">
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
            <div className="w-full flex pt-1 gap-2">
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
          } text-white px-4 py-2 rounded-md shadow-sm mt-2 transition-colors duration-200`}
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
