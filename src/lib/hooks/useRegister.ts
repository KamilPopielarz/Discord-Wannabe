import { useState } from "react";
import type { RegisterUserCommand } from "../../types";
import type { RegisterViewModel } from "../../types/viewModels";

export function useRegister() {
  const [state, setState] = useState<RegisterViewModel>({
    email: "",
    password: "",
    username: "",
    confirmPassword: "",
    captchaToken: "",
    loading: false,
    error: undefined,
  });

  const updateField = (field: keyof Omit<RegisterViewModel, "loading" | "error">, value: string) => {
    setState((prev) => ({
      ...prev,
      [field]: value,
      error: undefined, // Clear error when user types
    }));
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Hasło musi mieć co najmniej 8 znaków";
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return "Hasło musi zawierać wielką literę, małą literę, cyfrę i znak specjalny";
    }

    return null;
  };

  const register = async (payload: RegisterUserCommand & { confirmPassword: string; captchaToken: string }) => {
    // Early returns for validation
    if (!payload.email || !payload.password || !payload.username || !payload.confirmPassword) {
      setState((prev) => ({
        ...prev,
        error: "Wszystkie pola są wymagane",
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

    // Password strength validation
    const passwordError = validatePassword(payload.password);
    if (passwordError) {
      setState((prev) => ({
        ...prev,
        error: passwordError,
      }));
      return;
    }

    // Password confirmation validation
    if (payload.password !== payload.confirmPassword) {
      setState((prev) => ({
        ...prev,
        error: "Hasła nie są identyczne",
      }));
      return;
    }

    // Temporarily disabled CAPTCHA validation
    // TODO: Re-enable CAPTCHA validation in production
    /*
    if (!payload.captchaToken) {
      setState((prev) => ({
        ...prev,
        error: "Proszę rozwiązać CAPTCHA",
      }));
      return;
    }
    */

    setState((prev) => ({
      ...prev,
      loading: true,
      error: undefined,
    }));

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
          username: payload.username,
          captchaToken: payload.captchaToken,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Wystąpił błąd podczas rejestracji";

        switch (response.status) {
          case 409:
            errorMessage = "Użytkownik z tym e-mailem już istnieje";
            break;
          case 400:
            errorMessage = "Nieprawidłowe dane rejestracji";
            break;
          case 429:
            errorMessage = "Za dużo prób rejestracji. Spróbuj ponownie później";
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

      // Success - show confirmation message
      setState((prev) => ({
        ...prev,
        loading: false,
        error: undefined,
      }));

      // Account requires email confirmation
      alert("Rejestracja zakończona pomyślnie! Sprawdź swoją skrzynkę odbiorczą i kliknij link potwierdzający, aby aktywować konto.");
      if (typeof window !== "undefined") {
        window.location.href = "/login?message=confirm-email";
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
    register,
    validatePassword,
  };
}
