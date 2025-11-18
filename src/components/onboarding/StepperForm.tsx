import React, { useState } from "react";
import type {
  RegisterUserCommand,
  ConfirmEmailCommand,
  LoginCommand,
  PasswordResetRequestCommand,
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

  const handleRegisterSubmit = (payload: RegisterUserCommand) => {
    auth.register.mutate(payload, { onSuccess: () => setStep("confirm") });
  };

  const handleConfirmSubmit = (payload: ConfirmEmailCommand) => {
    auth.confirmEmail.mutate(payload, { onSuccess: () => setStep("login") });
  };

  const handleLoginSubmit = (payload: LoginCommand) => {
    auth.login.mutate(payload, { onSuccess: () => setStep("password-reset") });
  };

  const handlePasswordResetSubmit = (payload: PasswordResetRequestCommand) => {
    auth.requestPasswordReset.mutate(payload, { onSuccess: onComplete });
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
      {step === "register" && <RegisterForm onSubmit={handleRegisterSubmit} />}
      {step === "confirm" && <ConfirmEmailForm onSubmit={handleConfirmSubmit} />}
      {step === "login" && <LoginForm onSubmit={handleLoginSubmit} />}
      {step === "password-reset" && <PasswordResetForm onSubmit={handlePasswordResetSubmit} />}
      <div className="mt-4 flex justify-between">
        <button onClick={handleBack} disabled={step === initialStep} className="btn">
          Back
        </button>
      </div>
    </div>
  );
};

export default StepperForm;
