import { useState, useEffect } from "react";
import HaloPSAAuth from "../services/auth";

interface HaloSettings {
  apiUrl: string;
  clientId: string;
  userId: string;
  ticketTypeId: string;
  showStartDate: boolean;
  showTargetDate: boolean;
  showTimeBudget: boolean;
  showCategory1: boolean;
  showCategory2: boolean;
  showCategory3: boolean;
  showCategory4: boolean;
  showPriority: boolean;
}

function OptionsPage() {
  const [settings, setSettings] = useState<HaloSettings>({
    apiUrl: "",
    clientId: "",
    userId: "",
    ticketTypeId: "",
    showStartDate: true,
    showTargetDate: true,
    showTimeBudget: true,
    showCategory1: true,
    showCategory2: true,
    showCategory3: true,
    showCategory4: true,
    showPriority: true,
  });
  const [status, setStatus] = useState<string>("");

  const extensionId = chrome.runtime.id;
  const redirectUri = `https://${extensionId}.chromiumapp.org/`;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.sync.get([
        "apiUrl",
        "clientId",
        "userId",
        "ticketTypeId",
        "showStartDate",
        "showTargetDate",
        "showTimeBudget",
        "showCategory1",
        "showCategory2",
        "showCategory3",
        "showCategory4",
        "showPriority",
      ]);

      setSettings({
        apiUrl: result.apiUrl || "",
        clientId: result.clientId || "",
        userId: result.userId || "",
        ticketTypeId: result.ticketTypeId || "",
        showStartDate: result.showStartDate ?? true,
        showTargetDate: result.showTargetDate ?? true,
        showTimeBudget: result.showTimeBudget ?? true,
        showCategory1: result.showCategory1 ?? true,
        showCategory2: result.showCategory2 ?? true,
        showCategory3: result.showCategory3 ?? true,
        showCategory4: result.showCategory4 ?? true,
        showPriority: result.showPriority ?? true,
      });
    } catch (error) {
      setStatus("Error loading settings");
      console.error("Failed to load settings:", error);
    }
  };

  const handleSave = async () => {
    try {
      // When saving the API URL
      if (settings.apiUrl) {
        const url = new URL(settings.apiUrl);
        const hostPermission = `https://${url.hostname}/*`;
        
        // Request permission for this specific domain
        const granted = await chrome.permissions.request({
          origins: [hostPermission]
        });

        if (!granted) {
          setStatus("Error: Host permission is required to connect to HaloPSA");
          return;
        }
      }

      const settingsToSave = {
        ...settings,
        apiUrl:
          settings.apiUrl && settings.apiUrl.trim()
            ? (() => {
                const urlMatch = settings.apiUrl.match(/^(https?:\/\/[^\/]+)/);
                const normalizedUrl = urlMatch ? urlMatch[1] : settings.apiUrl;
                return normalizedUrl.endsWith("/")
                  ? normalizedUrl
                  : `${normalizedUrl}/`;
              })()
            : "",
      };

      await chrome.storage.sync.set(settingsToSave);
      setSettings(settingsToSave);
      setStatus("Settings saved successfully!");
      setTimeout(() => setStatus(""), 2000);
    } catch (error) {
      setStatus("Error saving settings");
      console.error("Failed to save settings:", error);
    }
  };
  const handleLogin = async () => {
    try {
      const token = await HaloPSAAuth.authenticate();
      if (token) {
        setStatus("Login successful!");
        setTimeout(() => setStatus(""), 2000);
      } else {
        setStatus("Login failed: No token received");
      }
    } catch (error) {
      setStatus(
        `Login failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      console.error("Login error:", error);
    }
  };
  const handleLogout = async () => {
    try {
      await HaloPSAAuth.signOut();
      setStatus("Logout successful!");
      setTimeout(() => setStatus(""), 2000);
    } catch (error) {
      setStatus("Logout failed");
      console.error("Logout error:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  return (
    <div className="max-w-screen-md mx-auto bg-gray-50 p-3">
      <h1 className="text-lg font-bold text-gray-800 mb-2">
        Quick Ticket Settings
      </h1>

      {/* Setup Instructions - more compact */}
      <div className="bg-white rounded-md shadow-sm border border-gray-200 p-3 mb-3">
        <h2 className="text-sm font-semibold text-gray-800 mb-1">Setup Instructions</h2>
        <ol className="compact-list text-gray-600 list-decimal list-inside text-sm">
          <li>Navigate to HaloPSA: <code className="text-xs bg-gray-100 px-1">Config / Integrations / HaloAPI / View Applications / New</code></li>
          <li>On the Details tab:
            <ul className="ml-4 list-disc list-inside text-xs text-gray-500">
              <li>Name your application</li>
              <li>Select "Implicit Flow"</li>
              <li>Add Redirect URI:</li>
            </ul>
          </li>
        </ol>
        
        <div className="bg-gray-50 p-1.5 my-2 rounded flex items-center justify-between text-xs">
          <code className="text-gray-600">{redirectUri}</code>
          <button
            onClick={() => navigator.clipboard.writeText(redirectUri)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-0.5 rounded"
          >
            Copy
          </button>
        </div>

        <ol className="compact-list text-gray-600 list-decimal list-inside text-sm" start={3}>
          <li>Check "Agent Logins" under Preferences</li>
          <li>Copy Client ID to paste below</li>
          <li>Add Permissions: <span className="text-xs text-gray-500">read:tickets, edit:tickets</span></li>
          <li>Save the application</li>
          <li>Complete settings below</li>
        </ol>
      </div>

      {/* Settings Form - more compact */}
      <div className="bg-white rounded-md shadow-sm border border-gray-200 p-3 space-y-2">
        <div>
          <label
            htmlFor="apiUrl"
            className="block text-gray-700 text-xs font-medium pb-1"
          >
            HaloPSA Base URL:
          </label>
          <input
            type="url"
            id="apiUrl"
            name="apiUrl"
            value={settings.apiUrl}
            onChange={handleInputChange}
            className="w-full border-gray-300 rounded-md shadow-sm text-sm"
            placeholder="https://your-instance.halopsa.com"
          />
        </div>

        <div>
          <label
            htmlFor="clientId"
            className="block text-gray-700 text-xs font-medium pb-1"
          >
            Client ID:
          </label>
          <input
            type="text"
            id="clientId"
            name="clientId"
            value={settings.clientId}
            onChange={handleInputChange}
            className="w-full border-gray-300 rounded-md shadow-sm text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="userId"
            className="block text-gray-700 text-xs font-medium pb-1"
          >
            User ID:
          </label>
          <input
            type="text"
            id="userId"
            name="userId"
            value={settings.userId}
            onChange={handleInputChange}
            className="w-full border-gray-300 rounded-md shadow-sm text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="ticketTypeId"
            className="block text-gray-700 text-xs font-medium pb-1"
          >
            Ticket Type ID:
          </label>
          <input
            type="text"
            id="ticketTypeId"
            name="ticketTypeId"
            value={settings.ticketTypeId}
            onChange={handleInputChange}
            className="w-full border-gray-300 rounded-md shadow-sm text-sm"
          />
        </div>

        {/* Form Fields */}
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-2">Form Fields</h2>
          <div className="space-y-3">
            {/* Core Fields - using grid with 4 columns */}
            <div className="grid grid-cols-4 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showStartDate"
                  name="showStartDate"
                  checked={settings.showStartDate}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <label htmlFor="showStartDate" className="ml-2 text-sm text-gray-700">
                  Start Date
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showTargetDate"
                  name="showTargetDate"
                  checked={settings.showTargetDate}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <label htmlFor="showTargetDate" className="ml-2 text-sm text-gray-700">
                  Target Date
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showTimeBudget"
                  name="showTimeBudget"
                  checked={settings.showTimeBudget}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <label htmlFor="showTimeBudget" className="ml-2 text-sm text-gray-700">
                  Time Budget
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showPriority"
                  name="showPriority"
                  checked={settings.showPriority}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <label htmlFor="showPriority" className="ml-2 text-sm text-gray-700">
                  Priority
                </label>
              </div>
            </div>

            {/* Category Fields - using grid with 4 columns */}
            <div className="grid grid-cols-4 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showCategory1"
                  name="showCategory1"
                  checked={settings.showCategory1}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <label htmlFor="showCategory1" className="ml-2 text-sm text-gray-700">
                  Category 1
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showCategory2"
                  name="showCategory2"
                  checked={settings.showCategory2}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <label htmlFor="showCategory2" className="ml-2 text-sm text-gray-700">
                  Category 2
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showCategory3"
                  name="showCategory3"
                  checked={settings.showCategory3}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <label htmlFor="showCategory3" className="ml-2 text-sm text-gray-700">
                  Category 3
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showCategory4"
                  name="showCategory4"
                  checked={settings.showCategory4}
                  onChange={handleCheckboxChange}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <label htmlFor="showCategory4" className="ml-2 text-sm text-gray-700">
                  Category 4
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons Section */}
        <div className="flex justify-between space-x-3 mt-4">
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded-md shadow-sm text-sm font-medium transition-colors w-full"
          >
            Save
          </button>

          <button
            onClick={handleLogin}
            className="bg-green-600 hover:bg-green-700 text-white py-1.5 px-3 rounded-md shadow-sm text-sm font-medium transition-colors w-full"
          >
            Login
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white py-1.5 px-3 rounded-md shadow-sm text-sm font-medium transition-colors w-full"
          >
            Logout
          </button>
        </div>

        {status && (
          <div
            className={`text-sm mt-4 ${status.includes("Error") ? "text-red-600" : "text-green-600"}`}
          >
            {status}
          </div>
        )}
      </div>
    </div>
  );
}

export default OptionsPage;
