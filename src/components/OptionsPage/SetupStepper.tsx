import { SetupStep } from "../../types";

interface SetupStepperProps {
  currentStep: SetupStep;
  isAuthenticated: boolean;
  hasApiConfig: boolean;
}

function SetupStepper({ currentStep, isAuthenticated, hasApiConfig }: SetupStepperProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-8">
        <div
          className={`flex items-center ${hasApiConfig ? "text-green-600" : currentStep === "basic" ? "text-blue-600" : "text-gray-400"}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${hasApiConfig ? "border-green-600 bg-green-50" : currentStep === "basic" ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}
          >
            {hasApiConfig ? "✓" : "⚙️"}
          </div>
          <span className="ml-2 text-sm font-medium">
            API Configuration
          </span>
        </div>
        <div
          className={`w-12 h-0.5 ${isAuthenticated ? "bg-green-600" : hasApiConfig ? "bg-blue-600" : "bg-gray-300"}`}
        ></div>
        <div
          className={`flex items-center ${isAuthenticated ? "text-green-600" : currentStep === "auth" ? "text-blue-600" : "text-gray-400"}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isAuthenticated ? "border-green-600 bg-green-50" : currentStep === "auth" ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}
          >
            {isAuthenticated ? "✓" : "🔑"}
          </div>
          <span className="ml-2 text-sm font-medium">Authentication</span>
        </div>
        <div
          className={`w-12 h-0.5 ${isAuthenticated ? "bg-green-600" : "bg-gray-300"}`}
        ></div>
        <div
          className={`flex items-center ${isAuthenticated ? "text-blue-600" : "text-gray-400"}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isAuthenticated ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}
          >
            📋
          </div>
          <span className="ml-2 text-sm font-medium">Configuration</span>
        </div>
      </div>
    </div>
  );
}

export default SetupStepper;
