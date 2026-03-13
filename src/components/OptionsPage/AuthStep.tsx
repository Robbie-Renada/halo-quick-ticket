interface AuthStepProps {
  isCheckingAuth: boolean;
  onLogin: () => void;
}

function AuthStep({ isCheckingAuth, onLogin }: AuthStepProps) {
  return (
    <div className="max-w-md mx-auto mb-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Authenticate with Halo
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Now that your basic settings are saved, you need to authenticate
          with Halo to configure your Halo-specific settings.
        </p>
        {isCheckingAuth ? (
          <div className="flex items-center justify-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Checking authentication...</span>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-md shadow-sm text-sm font-medium transition-colors"
          >
            Login to Halo
          </button>
        )}
      </div>
    </div>
  );
}

export default AuthStep;
