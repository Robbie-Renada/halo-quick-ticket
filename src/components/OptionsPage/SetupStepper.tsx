import { SetupStep } from "../../types";

interface SetupStepperProps {
  currentStep: SetupStep;
  isAuthenticated: boolean;
  hasApiConfig: boolean;
}

type StepState = "done" | "active" | "pending";

function Step({
  index,
  label,
  state,
}: {
  index: number;
  label: string;
  state: StepState;
}) {
  return (
    <div className="flex items-center">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium transition-colors ${
          state === "done"
            ? "border-teal-700 bg-teal-700 text-white"
            : state === "active"
              ? "border-teal-700 bg-white text-teal-800"
              : "border-stone-300 bg-white text-stone-400"
        }`}
      >
        {state === "done" ? (
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          index
        )}
      </div>
      <span
        className={`ml-2 text-xs font-medium ${
          state === "pending" ? "text-stone-400" : "text-stone-700"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function SetupStepper({ currentStep, isAuthenticated, hasApiConfig }: SetupStepperProps) {
  const apiState: StepState = hasApiConfig
    ? "done"
    : currentStep === "basic"
      ? "active"
      : "pending";
  const authState: StepState = isAuthenticated
    ? "done"
    : currentStep === "auth"
      ? "active"
      : "pending";
  const configState: StepState = isAuthenticated ? "active" : "pending";

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-5">
        <Step index={1} label="API Configuration" state={apiState} />
        <div
          className={`h-px w-12 ${hasApiConfig ? "bg-teal-700" : "bg-stone-300"}`}
        />
        <Step index={2} label="Authentication" state={authState} />
        <div
          className={`h-px w-12 ${isAuthenticated ? "bg-teal-700" : "bg-stone-300"}`}
        />
        <Step index={3} label="Configuration" state={configState} />
      </div>
    </div>
  );
}

export default SetupStepper;
