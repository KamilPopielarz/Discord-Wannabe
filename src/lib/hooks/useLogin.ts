import { useState } from "react";
import type { LoginCommand } from "../../types";
import type { AuthViewModel } from "../../types/viewModels";

export function useLogin() {
  const [state, setState] = useState<AuthViewModel>({
    email: "",
    password: "",
    loading: false,
    error: undefined,
  });

  const updateField = (field: keyof Pick<AuthViewModel, "email" | "password">, value: string) => {
    setState((prev) => ({
      ...prev,
      [field]: value,
      error: undefined, // Clear error when user types
    }));
  };

  const login = async (payload: LoginCommand) => {
    // Early return for validation
    if (!payload.email || !payload.password) {
      setState((prev) => ({
        ...prev,
        error: "E-mail i hasło są wymagane",
      }));
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      setState((prev) => ({
        ...prev,
        error: "Nieprawidłowy format e-mail",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: undefined,
    }));

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = "Wystąpił błąd podczas logowania";

        switch (response.status) {
          case 401:
            errorMessage = "Nieprawidłowy e-mail lub hasło";
            break;
          case 429:
            errorMessage = "Za dużo prób logowania. Spróbuj ponownie później";
            break;
          case 400:
            errorMessage = "Nieprawidłowe dane logowania";
            break;
          default:
            errorMessage = "Błąd serwera. Spróbuj ponownie później";
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        return;
      }

      // Success - check if we should redirect back to a room
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const returnTo = urlParams.get("returnTo");

        if (returnTo) {
          window.location.href = returnTo;
        } else {
          window.location.href = "/servers";
        }
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Błąd połączenia. Sprawdź połączenie internetowe",
      }));
    }
  };

  return {
    state,
    updateField,
    login,
  };
}
