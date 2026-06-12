interface SaveBarProps {
  hasUnsaved: boolean;
  isSaving: boolean;
  canSave: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

function SaveBar({ hasUnsaved, isSaving, canSave, onSave, onDiscard }: SaveBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white/90 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {hasUnsaved && (
              <div className="flex items-center text-amber-700">
                <span className="mr-2 h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="text-xs font-medium">Unsaved changes</span>
              </div>
            )}
            {!hasUnsaved && (
              <div className="flex items-center text-stone-500">
                <svg
                  className="w-4 h-4 mr-1.5"
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
                <span className="text-xs font-medium">All changes saved</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {hasUnsaved && (
              <button
                type="button"
                onClick={onDiscard}
                className="hqt-btn-secondary !py-1.5 text-xs"
              >
                Discard
              </button>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={!canSave}
              className="hqt-btn-primary !py-1.5 px-5 text-xs"
            >
              {isSaving ? (
                <div className="flex items-center">
                  <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  Saving…
                </div>
              ) : hasUnsaved ? (
                "Save changes"
              ) : (
                "Saved"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SaveBar;
