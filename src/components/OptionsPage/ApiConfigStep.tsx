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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Setup Instructions
        </h2>
        <ol className="text-gray-600 list-decimal list-inside text-sm space-y-1">
          <li>
            Navigate to Halo:{" "}
            <code className="text-xs bg-gray-100 px-1 rounded">
              Config / Integrations / HaloAPI / View Applications / New
            </code>
          </li>
          <li>
            On the Details tab:
            <ul className="ml-4 list-disc list-inside text-xs text-gray-500 mt-1">
              <li>Name your application</li>
              <li>Select "Authorization Code Flow"</li>
              <li>Enable "Use PKCE" (Proof Key for Code Exchange)</li>
              <li>Add Redirect URI:</li>
            </ul>
          </li>
        </ol>

        <div className="bg-gray-50 p-2 my-3 rounded flex items-center justify-between text-xs">
          <code className="text-gray-600 break-all">{redirectUri}</code>
          <button
            onClick={() => navigator.clipboard.writeText(redirectUri)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs ml-2 flex-shrink-0"
          >
            Copy
          </button>
        </div>

        <ol
          className="text-gray-600 list-decimal list-inside text-sm space-y-1"
          start={3}
        >
          <li>Copy Client ID to paste below</li>
          <li>Check "Agent Logins" under Preferences</li>
          <li>
            Add Permissions:{" "}
            <span className="text-xs text-gray-500">
              read:tickets, edit:tickets, read:customers
            </span>
          </li>
          <li>Save the application</li>
          <li>Complete settings below</li>
        </ol>
      </div>

      {/* API Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          API Configuration
        </h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="apiUrl"
              className="block text-gray-700 text-sm font-medium mb-1"
            >
              Halo Base URL: <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              id="apiUrl"
              name="apiUrl"
              value={apiUrl}
              onChange={onChange}
              className="w-full border-gray-300 rounded-md shadow-sm text-sm"
              placeholder="https://your-instance.halo.com"
              required
            />
          </div>

          <div>
            <label
              htmlFor="clientId"
              className="block text-gray-700 text-sm font-medium mb-1"
            >
              Client ID: <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="clientId"
              name="clientId"
              value={clientId}
              onChange={onChange}
              className="w-full border-gray-300 rounded-md shadow-sm text-sm"
              placeholder="Your OAuth Client ID"
              required
            />
          </div>

          <button
            onClick={onSave}
            disabled={!apiUrl || !clientId}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium transition-colors"
          >
            Save API Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApiConfigStep;
