import { HaloSettings } from "../../types";

interface FieldOrderManagerProps {
  fieldOrder: string[];
  settings: HaloSettings;
  onMoveField: (fromIndex: number, toIndex: number) => void;
  onToggleField: (fieldKey: string, enabled: boolean) => void;
  onReset: () => void;
}

function getFieldLabel(fieldKey: string): string {
  const labels: Record<string, string> = {
    ticketType: "Ticket Type",
    autoAssign: "Assign to Me",
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
  return labels[fieldKey] || fieldKey;
}

function getFieldSettingKey(fieldKey: string): keyof HaloSettings {
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
  return mapping[fieldKey] || "showStartDate";
}

function isFieldEnabled(fieldKey: string, settings: HaloSettings): boolean {
  const settingKey = getFieldSettingKey(fieldKey);
  return settings[settingKey] as boolean;
}

function FieldOrderManager({
  fieldOrder,
  settings,
  onMoveField,
  onToggleField,
  onReset,
}: FieldOrderManagerProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-fit">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Form Fields & Order
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Check to enable fields and drag to reorder. Only enabled
        fields will appear in the form.
      </p>

      <div className="space-y-2 mb-4 overflow-y-auto">
        {fieldOrder.map((fieldKey, index) => (
          <div
            key={fieldKey}
            className={`flex items-center justify-between p-2 rounded-md border transition-colors ${
              isFieldEnabled(fieldKey, settings)
                ? "bg-gray-50 border-gray-200 cursor-move hover:bg-gray-100"
                : "bg-gray-25 border-gray-100 opacity-60"
            }`}
            draggable={isFieldEnabled(fieldKey, settings)}
            onDragStart={(e) => {
              if (isFieldEnabled(fieldKey, settings)) {
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
                onMoveField(dragIndex, hoverIndex);
              }
            }}
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`field-${fieldKey}`}
                checked={isFieldEnabled(fieldKey, settings)}
                onChange={(e) => onToggleField(fieldKey, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-3"
              />
              <svg
                className={`w-4 h-4 mr-2 ${
                  isFieldEnabled(fieldKey, settings)
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
                  isFieldEnabled(fieldKey, settings)
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
                  if (index > 0) {
                    onMoveField(index, index - 1);
                  } else {
                    onMoveField(0, fieldOrder.length - 1);
                  }
                }}
                className="text-blue-600 hover:text-blue-800 text-xs"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => {
                  if (index < fieldOrder.length - 1) {
                    onMoveField(index, index + 1);
                  } else {
                    onMoveField(fieldOrder.length - 1, 0);
                  }
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
        onClick={onReset}
        className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded-md shadow-sm text-sm font-medium transition-colors w-full"
      >
        Reset to Default Order
      </button>
    </div>
  );
}

export default FieldOrderManager;
