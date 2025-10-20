import React from "react";
import { RegisterForm } from "./RegisterForm";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useRegister } from "../../lib/hooks/useRegister";

export function RegisterPage() {
  const { state, updateField, register, validatePassword } = useRegister();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
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
