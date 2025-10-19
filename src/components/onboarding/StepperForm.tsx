import React, { useState } from "react";
import type {
  RegisterUserCommand,
  ConfirmEmailCommand,
  LoginCommand,
  PasswordResetRequestCommand,
  PasswordResetConfirmCommand,
} from "../../types";
import RegisterForm from "./RegisterForm";
import ConfirmEmailForm from "./ConfirmEmailForm";
import LoginForm from "./LoginForm";
import PasswordResetForm from "./PasswordResetForm";
import { useAuth } from "../../lib/hooks";

type Step = "register" | "confirm" | "login" | "password-reset";

interface StepperFormProps {
  initialStep: Step;
  onComplete: () => void;
}

const StepperForm: React.FC<StepperFormProps> = ({ initialStep, onComplete }) => {
  const auth = useAuth();
  const [step, setStep] = useState<Step>(initialStep);

  const handleNext = (data: any) => {
    switch (step) {
      case "register":
        auth.register.mutate(data, { onSuccess: () => setStep("confirm") });
        return;
      case "confirm":
        auth.confirmEmail.mutate(data, { onSuccess: () => setStep("login") });
        return;
      case "login":
        auth.login.mutate(data, { onSuccess: () => setStep("password-reset") });
        return;
      case "password-reset":
        auth.requestPasswordReset.mutate(data, { onSuccess: onComplete });
        return;
      default:
        return;
    }
  };

  const handleBack = () => {
    const order: Step[] = ["register", "confirm", "login", "password-reset"];
    const prevIndex = order.indexOf(step) - 1;
    if (prevIndex >= 0) {
      setStep(order[prevIndex]);
    }
  };

  return (
    <div>
      {/* Step indicator */}
      <div className="mb-4 font-semibold">Step: {step}</div>
      {/* Render current form */}
      {step === "register" && <RegisterForm onSubmit={handleNext} />}
      {step === "confirm" && <ConfirmEmailForm onSubmit={handleNext} />}
      {step === "login" && <LoginForm onSubmit={handleNext} />}
      {step === "password-reset" && <PasswordResetForm onSubmit={handleNext} />}
      <div className="mt-4 flex justify-between">
        <button onClick={handleBack} disabled={step === initialStep} className="btn">
          Back
        </button>
      </div>
    </div>
  );
};

export default StepperForm;
