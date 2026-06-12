interface ApiConfigStepProps {
  apiUrl: string;
  clientId: string;
  redirectUri: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
}

function ApiConfigStep({ apiUrl, clientId, redirectUri, onChange, onSave }: ApiConfigStepProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Setup Instructions */}
      <div className="hqt-panel">
        <h2 className="hqt-panel-title mb-3">Setup Instructions</h2>
        <ol className="text-stone-600 list-decimal list-inside text-sm space-y-1">
          <li>
            Navigate to Halo:{" "}
            <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-stone-700">
              Config / Integrations / HaloAPI / View Applications / New
            </code>
          </li>
          <li>
            On the Details tab:
            <ul className="ml-4 list-disc list-inside text-xs text-stone-500 mt-1">
              <li>Name your application</li>
              <li>Select "Authorization Code Flow"</li>
              <li>Enable "Use PKCE" (Proof Key for Code Exchange)</li>
              <li>Add Redirect URI:</li>
            </ul>
          </li>
        </ol>

        <div className="my-3 flex items-center justify-between rounded-md border border-stone-200 bg-stone-50 p-2 text-xs">
          <code className="break-all font-mono text-stone-700">{redirectUri}</code>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(redirectUri)}
            className="ml-2 flex-shrink-0 rounded-md border border-stone-300 bg-white px-2 py-1 text-[11px] font-medium text-stone-600 shadow-sm transition-colors hover:bg-stone-50 hover:text-stone-900"
          >
            Copy
          </button>
        </div>

        <ol
          className="text-stone-600 list-decimal list-inside text-sm space-y-1"
          start={3}
        >
          <li>Copy Client ID to paste below</li>
          <li>Check "Agent Logins" under Preferences</li>
          <li>
            Add Permissions:{" "}
            <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-stone-700">
              read:tickets, edit:tickets, read:customers
            </code>
          </li>
          <li>Save the application</li>
          <li>Complete settings below</li>
        </ol>
      </div>

      {/* API Settings */}
      <div className="hqt-panel">
        <h2 className="hqt-panel-title mb-3">API Configuration</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="apiUrl" className="hqt-label">
              Halo Base URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              id="apiUrl"
              name="apiUrl"
              value={apiUrl}
              onChange={onChange}
              className="hqt-input text-sm"
              placeholder="https://your-instance.halo.com"
              required
            />
          </div>

          <div>
            <label htmlFor="clientId" className="hqt-label">
              Client ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="clientId"
              name="clientId"
              value={clientId}
              onChange={onChange}
              className="hqt-input text-sm"
              placeholder="Your OAuth Client ID"
              required
            />
          </div>

          <button
            type="button"
            onClick={onSave}
            disabled={!apiUrl || !clientId}
            className="hqt-btn-primary w-full"
          >
            Save API Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApiConfigStep;
