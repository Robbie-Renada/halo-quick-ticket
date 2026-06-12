interface AuthStepProps {
  isCheckingAuth: boolean;
  onLogin: () => void;
}

function AuthStep({ isCheckingAuth, onLogin }: AuthStepProps) {
  return (
    <div className="max-w-md mx-auto mb-8">
      <div className="hqt-panel text-center">
        <h2 className="hqt-panel-title mb-2">Authenticate with Halo</h2>
        <p className="text-stone-500 text-[13px] mb-5">
          Your API settings are saved. Sign in to Halo to continue
          configuring the extension.
        </p>
        {isCheckingAuth ? (
          <div className="flex items-center justify-center space-x-2 text-stone-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-200 border-t-teal-700"></div>
            <span className="text-xs">Checking authentication…</span>
          </div>
        ) : (
          <button type="button" onClick={onLogin} className="hqt-btn-primary px-6">
            Login to Halo
          </button>
        )}
      </div>
    </div>
  );
}

export default AuthStep;
