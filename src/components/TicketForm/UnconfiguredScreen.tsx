interface UnconfiguredScreenProps {
  onOpenSettings: () => void;
  onRefresh: () => void;
}

function UnconfiguredScreen({ onOpenSettings, onRefresh }: UnconfiguredScreenProps) {
  return (
    <div className="w-full min-h-[470px] bg-white text-sm flex flex-col items-center justify-center">
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
            type="button"
            onClick={onOpenSettings}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm transition-colors duration-200"
          >
            Open Settings
          </button>
          <button
            type="button"
            onClick={onRefresh}
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

export default UnconfiguredScreen;
