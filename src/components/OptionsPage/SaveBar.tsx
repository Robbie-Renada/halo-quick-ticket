interface SaveBarProps {
  hasUnsaved: boolean;
  isSaving: boolean;
  canSave: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

function SaveBar({ hasUnsaved, isSaving, canSave, onSave, onDiscard }: SaveBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {hasUnsaved && (
              <div className="flex items-center text-amber-600">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <span className="text-sm font-medium">
                  You have unsaved changes
                </span>
              </div>
            )}
            {!hasUnsaved && (
              <div className="flex items-center text-green-600">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm font-medium">
                  All changes saved
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {hasUnsaved && (
              <button
                onClick={onDiscard}
                className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium transition-colors"
              >
                Discard Changes
              </button>
            )}
            <button
              onClick={onSave}
              disabled={!canSave}
              className={`py-2 px-6 rounded-md shadow-sm text-sm font-medium transition-colors ${
                canSave
                  ? hasUnsaved
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isSaving ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : hasUnsaved ? (
                "Save Changes"
              ) : (
                "✓ Saved"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SaveBar;
