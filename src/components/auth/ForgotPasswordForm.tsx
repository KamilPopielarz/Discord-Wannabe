import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ErrorBanner } from '../ui/ErrorBanner';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { TurnstileCaptcha } from '../ui/TurnstileCaptcha';
import { useFormValidation } from '../../lib/hooks/useFormValidation';
import type { PasswordResetRequestCommand } from '../../types';

interface ForgotPasswordFormProps {
  onSubmit: (payload: PasswordResetRequestCommand) => void;
  loading: boolean;
  error?: string;
  success?: boolean;
}

export function ForgotPasswordForm({
  onSubmit,
  loading,
  error,
  success = false,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const { validateEmail, errors, setFieldError } = useFormValidation();

  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    if (value) {
      const emailError = validateEmail(value);
      setFieldError('email', emailError);
    }
  }, [validateEmail, setFieldError]);

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  const handleCaptchaError = useCallback(() => {
    setCaptchaToken('');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailError = validateEmail(email);
    if (emailError) {
      setFieldError('email', emailError);
      return;
    }

    if (!captchaToken) {
      return;
    }

    onSubmit({ email, captchaToken });
  };

  const isFormValid = email.trim() !== '' && !errors.email && captchaToken;

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto matrix-form">
        <CardHeader className="space-y-1 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold matrix-title">
            E-mail wysłany
          </CardTitle>
          <CardDescription className="matrix-text">
            Sprawdź swoją skrzynkę odbiorczą
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm matrix-text">
              Wysłaliśmy link do resetowania hasła na adres:
            </p>
            <p className="font-medium matrix-text text-matrix-green-bright">
              {email}
            </p>
            <p className="text-xs text-muted-foreground">
              Link będzie ważny przez 24 godziny.
            </p>
          </div>

          <div className="pt-4 space-y-2">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full matrix-button"
              onClick={() => window.location.reload()}
            >
              Wyślij ponownie
            </Button>
            <div className="text-center">
              <a href="/login" className="text-sm matrix-link">
                Powrót do logowania
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto matrix-form">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center matrix-title">
          Resetuj hasło
        </CardTitle>
        <CardDescription className="text-center matrix-text">
          Wprowadź swój e-mail, aby otrzymać link do resetowania hasła
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorBanner error={error} className="mb-4" />

          <div className="space-y-2">
            <label htmlFor="reset-email" className="text-sm font-medium matrix-text">
              Adres e-mail
            </label>
            <Input
              id="reset-email"
              type="email"
              placeholder="twoj@email.com"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              disabled={loading}
              required
              className="matrix-input"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-xs matrix-error">
                {errors.email}
              </p>
            )}
          </div>

          <TurnstileCaptcha
            onVerify={handleCaptchaVerify}
            onError={handleCaptchaError}
            onExpire={handleCaptchaError}
            disabled={loading}
          />

          <Button 
            type="submit" 
            className="w-full matrix-button" 
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2 matrix-spinner" />
                Wysyłanie...
              </>
            ) : (
              'Wyślij link resetujący'
            )}
          </Button>

          <div className="text-center space-y-2">
            <a href="/login" className="text-sm matrix-link">
              Powrót do logowania
            </a>
            <div className="text-sm">
              <span className="text-muted-foreground">Nie masz konta? </span>
              <a href="/register" className="matrix-link">
                Zarejestruj się
              </a>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
