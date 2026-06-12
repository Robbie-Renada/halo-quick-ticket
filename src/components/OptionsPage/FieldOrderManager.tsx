import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HaloSettings } from "../../types";

export const FIELD_LABELS: Record<string, string> = {
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

export const FIELD_SETTING_KEY: Record<string, keyof HaloSettings> = {
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

interface FieldOrderManagerProps {
  fieldOrder: string[];
  settings: HaloSettings;
  onFieldOrderChange: (newOrder: string[]) => void;
  onToggleField: (fieldKey: string, enabled: boolean) => void;
  onReset: () => void;
}

interface SortableFieldItemProps {
  fieldKey: string;
  index: number;
  enabled: boolean;
  isDragOverlay?: boolean;
  onToggle: (fieldKey: string, enabled: boolean) => void;
}

function SortableFieldItem({
  fieldKey,
  index,
  enabled,
  isDragOverlay = false,
  onToggle,
}: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: fieldKey, disabled: !enabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={isDragOverlay ? undefined : style}
      className={`flex items-center justify-between p-2 rounded-md border transition-colors ${
        isDragOverlay
          ? "border-teal-700/40 bg-white shadow-lg rotate-1 scale-105"
          : enabled
            ? "border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-stone-100"
            : "border-stone-100 bg-white opacity-50"
      }`}
    >
      <div className="flex items-center flex-1 min-w-0">
        <input
          type="checkbox"
          id={isDragOverlay ? undefined : `field-${fieldKey}`}
          checked={enabled}
          onChange={(e) => onToggle(fieldKey, e.target.checked)}
          className="hqt-check mr-3 shrink-0"
        />
        <label
          htmlFor={isDragOverlay ? undefined : `field-${fieldKey}`}
          className={`text-sm font-medium cursor-pointer truncate ${
            enabled ? "text-stone-700" : "text-stone-400"
          }`}
        >
          {FIELD_LABELS[fieldKey] ?? fieldKey}
        </label>
      </div>
      <div className="flex items-center space-x-2 ml-2 shrink-0">
        <span className="text-[11px] text-stone-400">#{index + 1}</span>
        <div
          {...(enabled ? { ...attributes, ...listeners } : {})}
          className={`p-1 rounded ${
            enabled
              ? "cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600 hover:bg-stone-200"
              : "text-stone-200 cursor-not-allowed"
          }`}
          title={enabled ? "Drag to reorder" : "Enable field to reorder"}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function FieldOrderManager({
  fieldOrder,
  settings,
  onFieldOrderChange,
  onToggleField,
  onReset,
}: FieldOrderManagerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = fieldOrder.indexOf(active.id as string);
      const newIndex = fieldOrder.indexOf(over.id as string);
      onFieldOrderChange(arrayMove(fieldOrder, oldIndex, newIndex));
    }
    setActiveId(null);
  };

  return (
    <div className="hqt-panel h-fit">
      <h2 className="hqt-panel-title mb-1.5">Form Fields & Order</h2>
      <p className="text-xs text-stone-500 mb-4">
        Check to enable fields and drag to reorder. Only enabled fields will
        appear in the form.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={fieldOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 mb-4">
            {fieldOrder.map((fieldKey, index) => {
              const enabled = settings[FIELD_SETTING_KEY[fieldKey]] as boolean;
              return (
                <SortableFieldItem
                  key={fieldKey}
                  fieldKey={fieldKey}
                  index={index}
                  enabled={enabled}
                  onToggle={onToggleField}
                />
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId ? (
            <SortableFieldItem
              fieldKey={activeId}
              index={fieldOrder.indexOf(activeId)}
              enabled={settings[FIELD_SETTING_KEY[activeId]] as boolean}
              isDragOverlay
              onToggle={onToggleField}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <button
        type="button"
        onClick={onReset}
        className="hqt-btn-secondary w-full text-sm"
      >
        Reset to Default Order
      </button>
    </div>
  );
}

export default FieldOrderManager;
