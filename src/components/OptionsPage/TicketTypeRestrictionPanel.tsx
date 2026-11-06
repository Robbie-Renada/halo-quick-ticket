import { useMemo, useState } from "react";
import { TicketType } from "../../types";

interface TicketTypeRestrictionPanelProps {
  ticketTypes: TicketType[];
  isLoadingTicketTypes: boolean;
  restrictTicketTypes: boolean;
  allowedTicketTypeIds: string[];
  defaultTicketTypeId: string;
  onRestrictChange: (restrict: boolean) => void;
  onAllowedChange: (ids: string[]) => void;
}

function TicketTypeRestrictionPanel({
  ticketTypes,
  isLoadingTicketTypes,
  restrictTicketTypes,
  allowedTicketTypeIds,
  defaultTicketTypeId,
  onRestrictChange,
  onAllowedChange,
}: TicketTypeRestrictionPanelProps) {
  const [filter, setFilter] = useState("");

  const allowed = useMemo(() => new Set(allowedTicketTypeIds), [allowedTicketTypeIds]);
  const selectedCount =
    allowed.size + (defaultTicketTypeId && !allowed.has(defaultTicketTypeId) ? 1 : 0);
  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? ticketTypes.filter((tt) => tt.name.toLowerCase().includes(q)) : ticketTypes;
  }, [ticketTypes, filter]);

  const toggle = (id: string, checked: boolean) => {
    const next = new Set(allowed);
    if (checked) next.add(id);
    else next.delete(id);
    onAllowedChange([...next]);
  };

  // Bulk actions apply to the currently filtered rows only
  const setVisible = (checked: boolean) => {
    const next = new Set(allowed);
    for (const tt of visible) {
      if (checked) next.add(tt.id.toString());
      else next.delete(tt.id.toString());
    }
    onAllowedChange([...next]);
  };

  return (
    <div className="hqt-panel">
      <h2 className="hqt-panel-title mb-3">Ticket Type List</h2>
      <div className="flex items-center">
        <input
          type="checkbox"
          id="restrictTicketTypes"
          checked={restrictTicketTypes}
          onChange={(e) => onRestrictChange(e.target.checked)}
          className="hqt-check"
        />
        <label htmlFor="restrictTicketTypes" className="ml-2 text-sm text-stone-800">
          Only show selected ticket types
        </label>
      </div>
      <p className="text-xs text-stone-500 mt-1 ml-6">
        Limits the ticket types offered in the form. Your default ticket type
        is always included.
      </p>

      {restrictTicketTypes && (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter ticket types..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="hqt-input text-sm"
            />
          </div>
          <div className="mb-2 flex items-center justify-between text-xs text-stone-500">
            <span>
              {selectedCount} of {ticketTypes.length} selected
            </span>
            <span className="flex gap-2">
              <button
                type="button"
                onClick={() => setVisible(true)}
                className="font-medium text-teal-800 hover:underline"
              >
                Select {filter ? "shown" : "all"}
              </button>
              <button
                type="button"
                onClick={() => setVisible(false)}
                className="font-medium text-stone-600 hover:underline"
              >
                Clear {filter ? "shown" : "all"}
              </button>
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-md border border-stone-200">
            {isLoadingTicketTypes ? (
              <div className="p-2 text-sm text-stone-500">Loading...</div>
            ) : visible.length === 0 ? (
              <div className="p-2 text-sm text-stone-500">No matching ticket types</div>
            ) : (
              visible.map((tt) => {
                const id = tt.id.toString();
                const isDefault = id === defaultTicketTypeId;
                return (
                  <label
                    key={tt.id}
                    className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm text-stone-800 hover:bg-stone-50"
                  >
                    <input
                      type="checkbox"
                      checked={isDefault || allowed.has(id)}
                      disabled={isDefault}
                      onChange={(e) => toggle(id, e.target.checked)}
                      className="hqt-check"
                    />
                    <span className="truncate">{tt.name}</span>
                    {isDefault && (
                      <span className="ml-auto shrink-0 text-[11px] text-stone-400">Default</span>
                    )}
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketTypeRestrictionPanel;
