interface UnconfiguredScreenProps {
  onOpenSettings: () => void;
  onRefresh: () => void;
}

function UnconfiguredScreen({ onOpenSettings, onRefresh }: UnconfiguredScreenProps) {
  return (
    <div className="w-full min-h-[470px] text-sm flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <span className="hqt-mark mb-4 h-8 w-8" />
        <h2 className="text-base font-semibold tracking-tight text-stone-900 mb-1.5">
          Welcome to Quick Ticket
        </h2>
        <p className="text-stone-500 text-[13px] mb-5 max-w-[260px]">
          Before you can create tickets, you need to configure your Halo
          settings.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onOpenSettings}
            className="hqt-btn-primary"
          >
            Open Settings
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="hqt-btn-secondary"
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

export default UnconfiguredScreen;
