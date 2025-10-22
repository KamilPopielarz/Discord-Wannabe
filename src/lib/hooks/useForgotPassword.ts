import { useState } from "react";
import type { PasswordResetRequestCommand } from "../../types";

interface ForgotPasswordState {
  loading: boolean;
  error?: string;
  success: boolean;
}

export function useForgotPassword() {
  const [state, setState] = useState<ForgotPasswordState>({
    loading: false,
    error: undefined,
    success: false,
  });

  const requestPasswordReset = async (payload: PasswordResetRequestCommand) => {
    // Early returns for validation
    if (!payload.email) {
      setState((prev) => ({
        ...prev,
        error: "E-mail jest wymagany",
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

    // CAPTCHA validation
    if (!payload.captchaToken) {
      setState((prev) => ({
        ...prev,
        error: "Proszę rozwiązać CAPTCHA",
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      loading: true,
      error: undefined,
    }));

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = "Wystąpił błąd podczas wysyłania linku";

        switch (response.status) {
          case 400:
            errorMessage = "Nieprawidłowe dane";
            break;
          case 429:
            errorMessage = "Za dużo prób. Spróbuj ponownie później";
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

      // Success
      setState((prev) => ({
        ...prev,
        loading: false,
        error: undefined,
        success: true,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Błąd połączenia. Sprawdź połączenie internetowe",
      }));
    }
  };

  const resetState = () => {
    setState({
      loading: false,
      error: undefined,
      success: false,
    });
  };

  return {
    state,
    requestPasswordReset,
    resetState,
  };
}
