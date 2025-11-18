import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ErrorBanner } from '../ui/ErrorBanner';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useFormValidation } from '../../lib/hooks/useFormValidation';
import type { PasswordResetConfirmCommand } from '../../types';

interface ResetPasswordFormProps {
  onSubmit: (payload: PasswordResetConfirmCommand) => void;
  loading: boolean;
  error?: string;
  success?: boolean;
  token: string;
}

export function ResetPasswordForm({
  onSubmit,
  loading,
  error,
  success = false,
  token,
}: ResetPasswordFormProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordHints, setShowPasswordHints] = useState(false);
  
  const { 
    validatePassword, 
    validatePasswordConfirmation, 
    getPasswordStrength,
    errors, 
    setFieldError 
  } = useFormValidation();

  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword, getPasswordStrength]);

  const handlePasswordChange = useCallback((value: string) => {
    setNewPassword(value);
    if (value) {
      const passwordError = validatePassword(value);
      setFieldError('password', passwordError);
    }
  }, [validatePassword, setFieldError]);

  const handleConfirmPasswordChange = useCallback((value: string) => {
    setConfirmPassword(value);
    if (value) {
      const confirmError = validatePasswordConfirmation(newPassword, value);
      setFieldError('confirmPassword', confirmError);
    }
  }, [newPassword, validatePasswordConfirmation, setFieldError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordError = validatePassword(newPassword);
    const confirmError = validatePasswordConfirmation(newPassword, confirmPassword);
    
    if (passwordError) {
      setFieldError('password', passwordError);
      return;
    }
    
    if (confirmError) {
      setFieldError('confirmPassword', confirmError);
      return;
    }

    onSubmit({ token, newPassword });
  };

  const isFormValid = newPassword.trim() !== '' && 
                     confirmPassword.trim() !== '' && 
                     !errors.password && 
                     !errors.confirmPassword &&
                     passwordStrength.isValid;

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto retro-card">
        <CardHeader className="space-y-1 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold retro-heading">
            Hasło zmienione
          </CardTitle>
          <CardDescription className="retro-text">
            Twoje hasło zostało pomyślnie zaktualizowane
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm retro-text">
              Możesz teraz zalogować się używając nowego hasła.
            </p>
          </div>

          <Button 
            type="button" 
            className="w-full retro-button"
            onClick={() => window.location.href = '/login'}
          >
            Przejdź do logowania
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto retro-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center retro-heading">
          Nowe hasło
        </CardTitle>
        <CardDescription className="text-center retro-text">
          Wprowadź nowe, bezpieczne hasło dla swojego konta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorBanner error={error} className="mb-4" />

          <div className="space-y-2">
            <label htmlFor="new-password" className="text-sm font-medium retro-text">
              Nowe hasło
            </label>
            <Input
              id="new-password"
              type="password"
              placeholder="Wprowadź nowe hasło"
              value={newPassword}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onFocus={() => setShowPasswordHints(true)}
              disabled={loading}
              required
              className="retro-input"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : showPasswordHints ? "password-hints" : undefined}
            />
            
            {/* Password strength indicator */}
            {newPassword && (
              <div className="space-y-2">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded ${
                        i < passwordStrength.score
                          ? passwordStrength.score <= 2
                            ? 'bg-red-500'
                            : passwordStrength.score <= 3
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs retro-text">
                  Siła hasła: {
                    passwordStrength.score <= 2 ? 'Słabe' :
                    passwordStrength.score <= 3 ? 'Średnie' :
                    passwordStrength.score <= 4 ? 'Dobre' : 'Bardzo dobre'
                  }
                </p>
              </div>
            )}

            {showPasswordHints && passwordStrength.feedback.length > 0 && (
              <div id="password-hints" className="text-xs text-muted-foreground space-y-1">
                <p>Hasło musi zawierać:</p>
                <ul className="list-disc list-inside space-y-1">
                  {passwordStrength.feedback.map((feedback, index) => (
                    <li key={index}>{feedback}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {errors.password && (
              <p id="password-error" className="text-xs retro-error">
                {errors.password}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-new-password" className="text-sm font-medium retro-text">
              Potwierdź nowe hasło
            </label>
            <Input
              id="confirm-new-password"
              type="password"
              placeholder="Potwierdź nowe hasło"
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              disabled={loading}
              required
              className="retro-input"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
            />
            {errors.confirmPassword && (
              <p id="confirm-password-error" className="text-xs retro-error">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full retro-button" 
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2 retro-spinner" />
                Zmienianie hasła...
              </>
            ) : (
              'Zmień hasło'
            )}
          </Button>

          <div className="text-center">
            <a href="/login" className="text-sm retro-link">
              Powrót do logowania
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
