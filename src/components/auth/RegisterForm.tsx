import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ErrorBanner } from '../ui/ErrorBanner';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { RegisterUserCommand } from '../../types';

interface RegisterFormProps {
  onSubmit: (payload: RegisterUserCommand & { confirmPassword: string; captchaToken: string }) => void;
  loading: boolean;
  error?: string;
  email: string;
  password: string;
  username: string;
  confirmPassword: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onUsernameChange: (username: string) => void;
  onConfirmPasswordChange: (password: string) => void;
  validatePassword: (password: string) => string | null;
}

export function RegisterForm({ 
  onSubmit, 
  loading, 
  error, 
  email, 
  password,
  username,
  confirmPassword,
  onEmailChange, 
  onPasswordChange,
  onUsernameChange,
  onConfirmPasswordChange,
  validatePassword
}: RegisterFormProps) {
  const [captchaToken, setCaptchaToken] = useState('');
  const [showPasswordHints, setShowPasswordHints] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For now, we'll use a dummy captcha token
    // In real implementation, this would come from reCAPTCHA
    onSubmit({ 
      email, 
      password,
      username,
      confirmPassword, 
      captchaToken: captchaToken || 'dummy-captcha-token' 
    });
  };

  const passwordError = password ? validatePassword(password) : null;
  const confirmPasswordError = confirmPassword && password !== confirmPassword ? 'Hasła nie są identyczne' : null;
  
  const isFormValid = 
    email.trim() !== '' && 
    password.trim() !== '' && 
    username.trim() !== '' &&
    confirmPassword.trim() !== '' &&
    !passwordError &&
    !confirmPasswordError;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Rejestracja</CardTitle>
        <CardDescription className="text-center">
          Utwórz nowe konto, aby rozpocząć
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorBanner error={error} className="mb-4" />
          
          <div className="space-y-2">
            <label htmlFor="register-email" className="text-sm font-medium">
              E-mail
            </label>
            <Input
              id="register-email"
              type="email"
              placeholder="twoj@email.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              disabled={loading}
              required
              aria-invalid={!!error}
              aria-describedby={error ? "error-message" : undefined}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="register-username" className="text-sm font-medium">
              Nazwa użytkownika
            </label>
            <Input
              id="register-username"
              type="text"
              placeholder="Twoja nazwa użytkownika"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              disabled={loading}
              required
              aria-invalid={!!error}
              aria-describedby={error ? "error-message" : undefined}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="register-password" className="text-sm font-medium">
              Hasło
            </label>
            <Input
              id="register-password"
              type="password"
              placeholder="Wprowadź hasło"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              onFocus={() => setShowPasswordHints(true)}
              disabled={loading}
              required
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? "password-error" : showPasswordHints ? "password-hints" : undefined}
            />
            {showPasswordHints && (
              <div id="password-hints" className="text-xs text-muted-foreground space-y-1">
                <p>Hasło musi zawierać:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Co najmniej 8 znaków</li>
                  <li>Wielką literę (A-Z)</li>
                  <li>Małą literę (a-z)</li>
                  <li>Cyfrę (0-9)</li>
                  <li>Znak specjalny (!@#$%^&*)</li>
                </ul>
              </div>
            )}
            {passwordError && (
              <p id="password-error" className="text-xs text-destructive">
                {passwordError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-sm font-medium">
              Potwierdź hasło
            </label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Potwierdź hasło"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              disabled={loading}
              required
              aria-invalid={!!confirmPasswordError}
              aria-describedby={confirmPasswordError ? "confirm-password-error" : undefined}
            />
            {confirmPasswordError && (
              <p id="confirm-password-error" className="text-xs text-destructive">
                {confirmPasswordError}
              </p>
            )}
          </div>

          {/* Placeholder for CAPTCHA - in real implementation this would be reCAPTCHA */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Weryfikacja (CAPTCHA)
            </label>
            <div className="border rounded-md p-4 bg-muted/50 text-center text-sm text-muted-foreground">
              <p>CAPTCHA będzie tutaj zaimplementowana</p>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setCaptchaToken('verified-captcha-token')}
                disabled={loading}
                className="mt-2"
              >
                {captchaToken ? '✓ Zweryfikowano' : 'Kliknij aby zweryfikować'}
              </Button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !isFormValid || !captchaToken}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Rejestrowanie...
              </>
            ) : (
              'Zarejestruj się'
            )}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Masz już konto? </span>
            <a href="/login" className="text-primary hover:underline">
              Zaloguj się
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
