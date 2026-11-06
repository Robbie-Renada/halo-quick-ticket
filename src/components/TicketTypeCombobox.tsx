import { useId, useMemo, useRef, useState } from "react";
import { TicketType } from "../types";

interface TicketTypeComboboxProps {
  ticketTypes: TicketType[];
  value: string;
  onChange: (id: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  itemClassName?: string;
}

/** Case-insensitive substring match, with names starting with the query listed first */
function filterTicketTypes(ticketTypes: TicketType[], query: string): TicketType[] {
  const q = query.trim().toLowerCase();
  if (!q) return ticketTypes;
  const starts: TicketType[] = [];
  const contains: TicketType[] = [];
  for (const tt of ticketTypes) {
    const name = tt.name.toLowerCase();
    if (name.startsWith(q)) starts.push(tt);
    else if (name.includes(q)) contains.push(tt);
  }
  return [...starts, ...contains];
}

function TicketTypeCombobox({
  ticketTypes,
  value,
  onChange,
  id,
  placeholder = "Select Ticket Type",
  disabled = false,
  className = "hqt-input",
  itemClassName = "text-xs",
}: TicketTypeComboboxProps) {
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const selectedName = ticketTypes.find((tt) => tt.id.toString() === value)?.name ?? "";
  const filtered = useMemo(() => filterTicketTypes(ticketTypes, query), [ticketTypes, query]);

  const open = () => {
    setQuery("");
    setActiveIndex(Math.max(0, ticketTypes.findIndex((tt) => tt.id.toString() === value)));
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setQuery("");
  };

  const select = (tt: TicketType) => {
    onChange(tt.id.toString());
    close();
    // Highlight the chosen name so typing again starts a fresh search
    requestAnimationFrame(() => {
      if (document.activeElement === inputRef.current) inputRef.current?.select();
    });
  };

  const moveActive = (index: number) => {
    setActiveIndex(index);
    listRef.current?.children[index]?.scrollIntoView({ block: "nearest" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        open();
        return;
      }
      if (filtered.length === 0) return;
      const delta = e.key === "ArrowDown" ? 1 : -1;
      moveActive((activeIndex + delta + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      // Keep Enter from submitting the surrounding form while choosing
      if (isOpen) {
        e.preventDefault();
        const tt = filtered[activeIndex];
        if (tt) select(tt);
      }
    } else if (e.key === "Escape") {
      if (isOpen) {
        e.preventDefault();
        close();
      }
    } else if (e.key === "Tab" && isOpen && query) {
      // Tabbing away after typing takes the highlighted match
      const tt = filtered[activeIndex];
      if (tt) onChange(tt.id.toString());
      close();
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        id={id}
        ref={inputRef}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        disabled={disabled}
        placeholder={isOpen && selectedName ? selectedName : placeholder}
        value={isOpen ? query : selectedName}
        onChange={(e) => {
          // While closed the box shows the selected name; search only the newly typed text
          const text = e.target.value;
          setQuery(!isOpen && text.startsWith(selectedName) ? text.slice(selectedName.length) : text);
          setActiveIndex(0);
          setIsOpen(true);
        }}
        onFocus={open}
        onClick={() => !isOpen && open()}
        onBlur={close}
        onKeyDown={handleKeyDown}
        className={`${className} pr-7`}
      />
      <svg
        className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>

      {isOpen && (
        <div id={listId} ref={listRef} role="listbox" className="hqt-dropdown max-h-40">
          {filtered.length > 0 ? (
            filtered.map((tt, i) => (
              <div
                key={tt.id}
                role="option"
                aria-selected={tt.id.toString() === value}
                // mousedown + preventDefault keeps focus in the input so blur doesn't close first
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(tt);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`hqt-dropdown-item !py-1.5 ${itemClassName} ${
                  i === activeIndex ? "bg-stone-100" : ""
                } ${tt.id.toString() === value ? "font-medium text-teal-800" : "text-stone-900"}`}
              >
                {tt.name}
              </div>
            ))
          ) : (
            <div className={`p-2 text-stone-500 ${itemClassName}`}>No matching ticket types</div>
          )}
        </div>
      )}
    </div>
  );
}

export default TicketTypeCombobox;
