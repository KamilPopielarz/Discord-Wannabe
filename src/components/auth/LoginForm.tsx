import React, { useState, useCallback } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ErrorBanner } from "../ui/ErrorBanner";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { RetroGridBackground } from "../ui/RetroGridBackground";
import { TypingAnimation } from "../ui/TypingAnimation";
import { GlitchText } from "../ui/GlitchText";
import { useFormValidation } from "../../lib/hooks/useFormValidation";
import type { LoginCommand } from "../../types";

interface LoginFormProps {
  onSubmit: (payload: LoginCommand) => void;
  loading: boolean;
  error?: string;
  email: string;
  password: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
}

export function LoginForm({
  onSubmit,
  loading,
  error,
  email,
  password,
  onEmailChange,
  onPasswordChange,
}: LoginFormProps) {
  const { validateEmail, errors, setFieldError } = useFormValidation();
  const [attemptCount, setAttemptCount] = useState(0);

  const handleEmailChange = useCallback((value: string) => {
    onEmailChange(value);
    if (value) {
      const emailError = validateEmail(value);
      setFieldError('email', emailError);
    }
  }, [onEmailChange, validateEmail, setFieldError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailError = validateEmail(email);
    if (emailError) {
      setFieldError('email', emailError);
      return;
    }

    setAttemptCount(prev => prev + 1);
    onSubmit({ email, password });
  };

  const isFormValid = email.trim() !== "" && password.trim() !== "" && !errors.email;
  const showRateLimit = attemptCount >= 5;

  return (
    <>
      <RetroGridBackground className="opacity-60" />
      <Card className="relative z-10 mx-auto w-full max-w-md rounded-3xl retro-card">
        <CardHeader className="space-y-1">
          <CardTitle className="retro-heading text-center text-3xl">
            <TypingAnimation text="Panel Discord-Wannabe" speed={80} />
          </CardTitle>
          <CardDescription className="text-center text-sm text-[var(--retro-cream)]/75">
            <GlitchText text="Wpisz kod dostępu i wskocz do retro-huba" trigger={!!error} />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorBanner error={error} className="mb-4" />

            {showRateLimit && (
              <div className="p-3 rounded border border-destructive bg-destructive/10">
                <p className="text-sm retro-error">
                  ⚠️ Zbyt wiele nieudanych prób logowania. Spróbuj ponownie za kilka minut.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="retro-text text-xs font-semibold uppercase tracking-[0.3em]">
                KOD E-MAIL
              </label>
              <Input
                id="email"
                type="email"
                placeholder="twoj@email.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                disabled={loading || showRateLimit}
                required
                className="retro-input"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                data-testid="login-email-input"
              />
              {errors.email && (
                <p id="email-error" className="text-xs retro-error">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="retro-text text-xs font-semibold uppercase tracking-[0.3em]">
                  HASŁO SESSION KEY
                </label>
                <a href="/reset-password" className="text-xs retro-link">
                  Zapomniałeś hasła?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                disabled={loading || showRateLimit}
                required
                className="retro-input"
                aria-invalid={!!error}
                aria-describedby={error ? "error-message" : undefined}
                data-testid="login-password-input"
              />
            </div>

            <Button 
              type="submit" 
              className="retro-button w-full rounded-xl" 
              disabled={loading || !isFormValid || showRateLimit}
              data-testid="login-submit-button"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  ŁĄCZENIE...
                </>
              ) : (
                "Uruchom seans"
              )}
            </Button>

            <div className="space-y-3 pt-2">
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Nowy użytkownik? </span>
                <a href="/register" className="retro-link">
                  Utwórz konto
                </a>
              </div>

              <div className="text-center text-sm">
                <a href="/guest" className="retro-link text-xs">
                  Tryb gościa Discord-Wannabe
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
