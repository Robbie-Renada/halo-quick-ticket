import { useState, useEffect } from "react";
import HaloPSAAuth from "../services/auth";

interface HaloSettings {
  apiUrl: string;
  clientId: string;
  userId: string;
  ticketTypeId: string;
}

function OptionsPage() {
  const [settings, setSettings] = useState<HaloSettings>({
    apiUrl: "",
    clientId: "",
    userId: "",
    ticketTypeId: "",
  });
  const [status, setStatus] = useState<string>("");

  const extensionId = chrome.runtime.id;
  const redirectUri = `https://${extensionId}.chromiumapp.org/`;

  useEffect(() => {
    // Load saved settings when component mounts
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.sync.get([
        "apiUrl",
        "clientId",
        "userId",
        "ticketTypeId",
      ]);

      setSettings({
        apiUrl: result.apiUrl || "",
        clientId: result.clientId || "",
        userId: result.userId || "",
        ticketTypeId: result.ticketTypeId || "",
      });
    } catch (error) {
      setStatus("Error loading settings");
      console.error("Failed to load settings:", error);
    }
  };

  const handleSave = async () => {
    try {
      await chrome.storage.sync.set(settings);
      setStatus("Settings saved successfully!");

      // Clear status message after 2 seconds
      setTimeout(() => setStatus(""), 2000);
    } catch (error) {
      setStatus("Error saving settings");
      console.error("Failed to save settings:", error);
    }
  };
  const handleLogin = async () => {
    await HaloPSAAuth.authenticate();
    setStatus("Login successful!");
  };
  /// const handleLogout = async () => {
  /// await HaloPSAAuth.logout();
  /// };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="p-8 mx-auto max-w-screen-md space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">Quick Task Settings</h1>

      {/* Redirect URI Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <label
          htmlFor="redirect-uri"
          className="block text-gray-700 text-sm font-medium pb-2"
        >
          Redirect URI (required for HaloPSA setup):
        </label>
        <div className="flex items-center">
          <span id="redirect-uri" className="text-gray-600">
            {redirectUri}
          </span>
          <button
            onClick={() => navigator.clipboard.writeText(redirectUri)}
            className="bg-gray-600 hover:bg-gray-700 text-white ml-4 px-2 py-1 rounded-md shadow-sm text-sm font-medium transition-colors"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <div>
          <label
            htmlFor="apiUrl"
            className="block text-gray-700 text-sm font-medium pb-2"
          >
            HaloPSA Base URL:
          </label>
          <input
            type="url"
            id="apiUrl"
            name="apiUrl"
            value={settings.apiUrl}
            onChange={handleInputChange}
            className="w-full border-gray-300 rounded-md shadow-sm"
            placeholder="https://your-instance.halopsa.com"
          />
        </div>

        <div>
          <label
            htmlFor="clientId"
            className="block text-gray-700 text-sm font-medium pb-2"
          >
            Client ID:
          </label>
          <input
            type="text"
            id="clientId"
            name="clientId"
            value={settings.clientId}
            onChange={handleInputChange}
            className="w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>

        <div>
          <label
            htmlFor="userId"
            className="block text-gray-700 text-sm font-medium pb-2"
          >
            User ID:
          </label>
          <input
            type="text"
            id="userId"
            name="userId"
            value={settings.userId}
            onChange={handleInputChange}
            className="w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>

        <div>
          <label
            htmlFor="ticketTypeId"
            className="block text-gray-700 text-sm font-medium pb-2"
          >
            Ticket Type ID:
          </label>
          <input
            type="text"
            id="ticketTypeId"
            name="ticketTypeId"
            value={settings.ticketTypeId}
            onChange={handleInputChange}
            className="w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>
        {/* Buttons Section */}
        <div className="flex justify-between space-x-4 mt-6">
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium transition-colors w-full"
          >
            Save Settings
          </button>

          <button
            onClick={handleLogin}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium transition-colors w-full"
          >
            Test Login
          </button>

          <button
            ///onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md shadow-sm text-sm font-medium transition-colors w-full"
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
