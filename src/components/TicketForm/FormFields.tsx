import { FormData, ChargeType, TicketType } from "../../types";
import CategorySelect from "./CategorySelect";

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

interface FormFieldsProps {
  fieldOrder: string[];
  formData: FormData;
  formSettings: FormSettings;
  categories: Record<number, { value: string; label: string }[]>;
  chargeTypes: ChargeType[];
  ticketTypes: TicketType[];
  selectedTicketTypeId: string;
  autoAssignToMe: boolean;
  onFormDataChange: (updates: Partial<FormData>) => void;
  onTicketTypeChange: (id: string) => void;
  onAutoAssignChange: (checked: boolean) => void;
}

const PRIORITY_OPTIONS = [
  { value: "1", label: "Critical" },
  { value: "2", label: "High" },
  { value: "3", label: "Medium" },
  { value: "4", label: "Low" },
];

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function HandleDateButton(field: "start" | "target", offset: number, onFormDataChange: (updates: Partial<FormData>) => void) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  if (field === "start") {
    onFormDataChange({ startDate: formatDate(date) });
  } else {
    onFormDataChange({ targetDate: formatDate(date) });
  }
}

function HandleTimeButton(hours: number, onFormDataChange: (updates: Partial<FormData>) => void) {
  const time = new Date();
  time.setHours(hours);
  time.setMinutes(0);
  onFormDataChange({ projecttimebudget: formatTime(time) });
}

function HandleAddTimeButton(hours: number, currentValue: string, onFormDataChange: (updates: Partial<FormData>) => void) {
  const time = new Date();
  const [currentHours, currentMinutes] = currentValue.split(":");
  time.setHours(parseInt(currentHours), parseInt(currentMinutes));
  const minutesToAdd = hours * 60;
  time.setMinutes(time.getMinutes() + minutesToAdd);
  onFormDataChange({ projecttimebudget: formatTime(time) });
}

function FormFields({
  fieldOrder,
  formData,
  formSettings,
  categories,
  chargeTypes,
  ticketTypes,
  selectedTicketTypeId,
  autoAssignToMe,
  onFormDataChange,
  onTicketTypeChange,
  onAutoAssignChange,
}: FormFieldsProps) {
  const renderFormField = (fieldKey: string) => {
    switch (fieldKey) {
      case "projecttimebudget":
        return (
          formSettings.showprojecttimebudget && (
            <div key={fieldKey}>
              <label
                htmlFor="projecttimebudget"
                className="block text-gray-500 text-xs font-medium pb-1"
              >
                Time Budget
              </label>
              <input
                type="time"
                tabIndex={3}
                id="projecttimebudget"
                className="w-full bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-xs transition-colors"
                value={formData.projecttimebudget}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(":");
                  const newTime = new Date();
                  newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                  onFormDataChange({ projecttimebudget: formatTime(newTime) });
                }}
              />
              <div className="w-full flex pt-0.5 gap-1">
                <button
                  type="button"
                  className="bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-xs py-0.5 w-1/3 hover:bg-gray-100 transition-colors"
                  onClick={() => HandleAddTimeButton(0.25, formData.projecttimebudget, onFormDataChange)}
                >
                  + 15 Minutes
                </button>
                <button
                  type="button"
                  className="bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-xs py-0.5 w-1/3 hover:bg-gray-100 transition-colors"
                  onClick={() => HandleTimeButton(1, onFormDataChange)}
                >
                  1 Hour
                </button>
                <button
                  type="button"
                  className="bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-xs py-0.5 w-1/3 hover:bg-gray-100 transition-colors"
                  onClick={() => HandleTimeButton(2, onFormDataChange)}
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
                className="block text-gray-500 text-xs font-medium pb-1"
              >
                Start Date
              </label>
              <input
                type="date"
                tabIndex={4}
                id="startdate"
                value={formData.startDate}
                onChange={(e) =>
                  onFormDataChange({ startDate: e.target.value })
                }
                className="w-full bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-xs transition-colors"
              />
              <div className="w-full flex pt-0.5 gap-1">
                <button
                  type="button"
                  className="bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-xs py-0.5 w-1/2 hover:bg-gray-100 transition-colors"
                  onClick={() => HandleDateButton("start", 0, onFormDataChange)}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-xs py-0.5 w-1/2 hover:bg-gray-100 transition-colors"
                  onClick={() => HandleDateButton("start", 1, onFormDataChange)}
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
                className="block text-gray-500 text-xs font-medium pb-1"
              >
                Target Date
              </label>
              <input
                type="date"
                tabIndex={5}
                id="targetdate"
                value={formData.targetDate}
                onChange={(e) =>
                  onFormDataChange({ targetDate: e.target.value })
                }
                className="w-full bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-xs transition-colors"
              />
              <div className="w-full flex pt-0.5 gap-1">
                <button
                  type="button"
                  className="bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-xs py-0.5 w-1/2 hover:bg-gray-100 transition-colors"
                  onClick={() => HandleDateButton("target", 0, onFormDataChange)}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-xs py-0.5 w-1/2 hover:bg-gray-100 transition-colors"
                  onClick={() => HandleDateButton("target", 1, onFormDataChange)}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  className="bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-xs py-0.5 w-1/2 hover:bg-gray-100 transition-colors"
                  onClick={() => HandleDateButton("target", 7, onFormDataChange)}
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
              <label className="block text-gray-500 text-xs font-medium pb-1">
                Priority
              </label>
              <select
                title="Priority"
                value={formData.priority_id}
                onChange={(e) =>
                  onFormDataChange({ priority_id: e.target.value })
                }
                className="w-full bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-xs transition-colors"
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
                onFormDataChange({ category_1: value })
              }
              label="Category 1"
              categories={categories}
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
                onFormDataChange({ category_2: value })
              }
              label="Category 2"
              categories={categories}
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
                onFormDataChange({ category_3: value })
              }
              label="Category 3"
              categories={categories}
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
                onFormDataChange({ category_4: value })
              }
              label="Category 4"
              categories={categories}
            />
          )
        );

      case "timetaken":
        return (
          formSettings.showTimeTaken && (
            <div key={fieldKey}>
              <label
                htmlFor="timetaken"
                className="block text-gray-500 text-xs font-medium pb-1"
              >
                Time Taken
              </label>
              <input
                type="time"
                tabIndex={3}
                id="timetaken"
                className="w-full bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-xs transition-colors"
                value={formData.timetaken}
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(":");
                  const newTime = new Date();
                  newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                  onFormDataChange({ timetaken: formatTime(newTime) });
                }}
              />
              <div className="w-full flex pt-0.5 gap-1">
                <button
                  type="button"
                  className="bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-xs py-0.5 w-1/3 hover:bg-gray-100 transition-colors"
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
                    onFormDataChange({ timetaken: formatTime(currentTime) });
                  }}
                >
                  + 15 Minutes
                </button>
                <button
                  type="button"
                  className="bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-xs py-0.5 w-1/3 hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    const newTime = new Date();
                    newTime.setHours(1, 0, 0, 0);
                    onFormDataChange({ timetaken: formatTime(newTime) });
                  }}
                >
                  1 Hour
                </button>
                <button
                  type="button"
                  className="bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-xs py-0.5 w-1/3 hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    const newTime = new Date();
                    newTime.setHours(2, 0, 0, 0);
                    onFormDataChange({ timetaken: formatTime(newTime) });
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
              <label className="block text-gray-500 text-xs font-medium pb-1">
                Charge Type
              </label>
              <select
                title="Charge Type"
                value={formData.chargeType}
                onChange={(e) =>
                  onFormDataChange({ chargeType: e.target.value })
                }
                className="w-full bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-xs transition-colors"
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

      case "ticketType":
        return (
          formSettings.showTicketType && (
            <div key={fieldKey}>
              <label className="block text-gray-500 text-xs font-medium pb-1">
                Ticket Type
              </label>
              <select
                title="Ticket Type"
                value={selectedTicketTypeId}
                onChange={(e) => onTicketTypeChange(e.target.value)}
                className="w-full bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-xs transition-colors"
              >
                <option value="">Select Ticket Type</option>
                {ticketTypes.map((tt) => (
                  <option key={tt.id} value={tt.id.toString()}>
                    {tt.name}
                  </option>
                ))}
              </select>
            </div>
          )
        );

      case "autoAssign":
        return (
          formSettings.showAutoAssign && (
            <div key={fieldKey} className="flex items-center col-span-2">
              <input
                type="checkbox"
                id="autoAssignToMe"
                checked={autoAssignToMe}
                onChange={(e) => onAutoAssignChange(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <label
                htmlFor="autoAssignToMe"
                className="ml-2 text-xs text-gray-600 cursor-pointer"
              >
                Assign to me
              </label>
            </div>
          )
        );

      default:
        return null;
    }
  };

  return <>{fieldOrder.map(renderFormField)}</>;
}

export default FormFields;
