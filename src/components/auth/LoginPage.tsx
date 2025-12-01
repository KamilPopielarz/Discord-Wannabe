import React, { useEffect, useState } from "react";
import { LoginForm } from "./LoginForm";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useLogin } from "../../lib/hooks/useLogin";
import { createSupabaseBrowserClient } from "../../db/supabase.browser";

export function LoginPage() {
  const { state, updateField, login } = useLogin();
  const [successMessage, setSuccessMessage] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handleAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      // Handle hash params too if they exist (Supabase implicit flow sometimes uses hash)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      const code = urlParams.get("code") || hashParams.get("code");
      const confirmed = urlParams.get("confirmed");
      const error = urlParams.get("error") || hashParams.get("error");
      const errorCode = urlParams.get("error_code") || hashParams.get("error_code");
      const errorDescription = urlParams.get("error_description") || hashParams.get("error_description");

      if (error) {
        // console.error("Auth error:", error, errorCode, errorDescription);

        let msg = "Wystąpił błąd autoryzacji.";
        if (errorCode === "otp_expired") {
          msg = "Link potwierdzający wygasł. Zaloguj się, aby wysłać nowy.";
        } else if (errorDescription) {
          if (errorDescription.includes("expired")) {
            msg = "Link potwierdzający wygasł.";
          } else {
            msg = `Błąd: ${errorDescription}`;
          }
        }
        setErrorMessage(msg);
        // Do NOT set successMessage if there is an error, even if confirmed=true is present
      } else if (confirmed === "true") {
        setSuccessMessage("Email został potwierdzony. Możesz się teraz zalogować.");
      }

      if (code) {
        // Exchange code for session
        const supabase = createSupabaseBrowserClient();
        if (supabase) {
          try {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error) {
              // Successful login via code exchange
              window.location.href = "/servers";
            } else {
              // console.error("Code exchange error:", error);
            }
          } catch (e) {
            // console.error("Code exchange exception:", e);
          }
        }
      }
    };

    handleAuth();
  }, []);

  return (
    <div className="relative w-full min-h-screen">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center justify-center p-4 min-h-screen">
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/50 text-green-600 dark:text-green-400 max-w-md w-full text-center backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
            {successMessage}
          </div>
        )}
        <LoginForm
          onSubmit={login}
          loading={state.loading}
          error={errorMessage || state.error}
          email={state.email}
          password={state.password}
          onEmailChange={(email) => updateField("email", email)}
          onPasswordChange={(password) => updateField("password", password)}
        />
      </div>
    </div>
  );
}
