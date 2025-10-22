import React from "react";
import { LoginForm } from "./LoginForm";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useLogin } from "../../lib/hooks/useLogin";

export function LoginPage() {
  const { state, updateField, login } = useLogin();

  return (
    <div className="relative w-full min-h-screen">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="flex items-center justify-center p-4 min-h-screen">
        <LoginForm
          onSubmit={login}
          loading={state.loading}
          error={state.error}
          email={state.email}
          password={state.password}
          onEmailChange={(email) => updateField("email", email)}
          onPasswordChange={(password) => updateField("password", password)}
        />
      </div>
    </div>
  );
}
