import React from "react";
import { RegisterForm } from "./RegisterForm";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useRegister } from "../../lib/hooks/useRegister";

export function RegisterPage() {
  const { state, updateField, register, validatePassword } = useRegister();

  return (
    <div className="relative w-full min-h-screen">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="flex items-center justify-center p-4 min-h-screen">
        <RegisterForm
          onSubmit={register}
          loading={state.loading}
          error={state.error}
          email={state.email}
          password={state.password}
          username={state.username}
          confirmPassword={state.confirmPassword}
          onEmailChange={(email) => updateField("email", email)}
          onPasswordChange={(password) => updateField("password", password)}
          onUsernameChange={(username) => updateField("username", username)}
          onConfirmPasswordChange={(password) => updateField("confirmPassword", password)}
          validatePassword={validatePassword}
        />
      </div>
    </div>
  );
}
