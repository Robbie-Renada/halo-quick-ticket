interface AdvancedOptionsPanelProps {
  allowUserSelection: boolean;
  allowCompleteTickets: boolean;
  autoAssignToMe: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function AdvancedOptionsPanel({
  allowUserSelection,
  allowCompleteTickets,
  autoAssignToMe,
  onChange,
}: AdvancedOptionsPanelProps) {
  return (
    <div className="hqt-panel">
      <h2 className="hqt-panel-title mb-3">Advanced Options</h2>
      <div className="space-y-4">
        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowUserSelection"
              name="allowUserSelection"
              checked={allowUserSelection}
              onChange={onChange}
              className="hqt-check"
            />
            <label
              htmlFor="allowUserSelection"
              className="ml-2 text-sm text-stone-800"
            >
              Allow other users to be selected
            </label>
          </div>
          <p className="text-xs text-stone-500 mt-1 ml-6">
            When enabled, users can choose a different user from your
            Halo tenant when creating tickets.
          </p>
        </div>

        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowCompleteTickets"
              name="allowCompleteTickets"
              checked={allowCompleteTickets}
              onChange={onChange}
              className="hqt-check"
            />
            <label
              htmlFor="allowCompleteTickets"
              className="ml-2 text-sm text-stone-800"
            >
              Allow completing tickets during creation
            </label>
          </div>
          <p className="text-xs text-stone-500 mt-1 ml-6">
            When enabled, a "Complete" button will appear alongside
            the "Submit" button.
          </p>
        </div>

        <div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoAssignToMe"
              name="autoAssignToMe"
              checked={autoAssignToMe}
              onChange={onChange}
              className="hqt-check"
            />
            <label
              htmlFor="autoAssignToMe"
              className="ml-2 text-sm text-stone-800"
            >
              Auto-assign tickets to me
            </label>
          </div>
          <p className="text-xs text-stone-500 mt-1 ml-6">
            When enabled, newly created tickets will be automatically
            assigned to your agent account.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdvancedOptionsPanel;
