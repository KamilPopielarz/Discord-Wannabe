import React, { useState, useCallback, useMemo } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ErrorBanner } from "../ui/ErrorBanner";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { RetroGridBackground } from "../ui/RetroGridBackground";
import { TurnstileCaptcha } from "../ui/TurnstileCaptcha";
import { useFormValidation } from "../../lib/hooks/useFormValidation";
import type { RegisterUserCommand } from "../../types";

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
  validatePassword: _validatePassword, // Rename to avoid conflict
}: RegisterFormProps) {
  const [captchaToken, setCaptchaToken] = useState("");
  const [showPasswordHints, setShowPasswordHints] = useState(false);
  
  const { 
    validateEmail, 
    validatePassword, 
    validatePasswordConfirmation, 
    validateUsername,
    getPasswordStrength,
    errors, 
    setFieldError 
  } = useFormValidation();

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password, getPasswordStrength]);

  const handleEmailChange = useCallback((value: string) => {
    onEmailChange(value);
    if (value) {
      const emailError = validateEmail(value);
      setFieldError('email', emailError);
    }
  }, [onEmailChange, validateEmail, setFieldError]);

  const handleUsernameChange = useCallback((value: string) => {
    onUsernameChange(value);
    if (value) {
      const usernameError = validateUsername(value);
      setFieldError('username', usernameError);
    }
  }, [onUsernameChange, validateUsername, setFieldError]);

  const handlePasswordChange = useCallback((value: string) => {
    onPasswordChange(value);
    if (value) {
      const passwordError = validatePassword(value);
      setFieldError('password', passwordError);
    }
  }, [onPasswordChange, validatePassword, setFieldError]);

  const handleConfirmPasswordChange = useCallback((value: string) => {
    onConfirmPasswordChange(value);
    if (value) {
      const confirmError = validatePasswordConfirmation(password, value);
      setFieldError('confirmPassword', confirmError);
    }
  }, [onConfirmPasswordChange, password, validatePasswordConfirmation, setFieldError]);

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  const handleCaptchaError = useCallback(() => {
    setCaptchaToken('');
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const emailError = validateEmail(email);
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);
    const confirmError = validatePasswordConfirmation(password, confirmPassword);
    
    if (emailError) setFieldError('email', emailError);
    if (usernameError) setFieldError('username', usernameError);
    if (passwordError) setFieldError('password', passwordError);
    if (confirmError) setFieldError('confirmPassword', confirmError);
    
    if (emailError || usernameError || passwordError || confirmError) {
      return;
    }

    onSubmit({
      email,
      password,
      username,
      confirmPassword,
      captchaToken: "test-token", // Temporary placeholder for disabled CAPTCHA
    });
  };

  const isFormValid = useMemo(() => {
    return email.trim() !== "" &&
      password.trim() !== "" &&
      username.trim() !== "" &&
      confirmPassword.trim() !== "" &&
      !errors.email &&
      !errors.username &&
      !errors.password &&
      !errors.confirmPassword &&
      passwordStrength.isValid;
      // Temporarily disabled CAPTCHA requirement: && captchaToken.trim() !== "";
  }, [email, password, username, confirmPassword, errors, passwordStrength.isValid]);

  return (
    <>
      <RetroGridBackground />
      <Card className="w-full max-w-md mx-auto retro-card relative z-10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center retro-heading">
            REJESTRACJA UŻYTKOWNIKA
          </CardTitle>
          <CardDescription className="text-center retro-text">
            Utwórz nowe konto w systemie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <ErrorBanner error={error} className="mb-4" />

            <div className="space-y-2">
              <label htmlFor="register-email" className="text-sm font-medium retro-text">
                ADRES E-MAIL
              </label>
              <Input
                id="register-email"
                type="email"
                placeholder="user@discord-wannabe.net"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                disabled={loading}
                required
                className="retro-input"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-xs retro-error">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="register-username" className="text-sm font-medium retro-text">
                NAZWA UŻYTKOWNIKA
              </label>
              <Input
                id="register-username"
                type="text"
                placeholder="retro_user"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                disabled={loading}
                required
                className="retro-input"
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? "username-error" : undefined}
              />
              {errors.username && (
                <p id="username-error" className="text-xs retro-error">
                  {errors.username}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="register-password" className="text-sm font-medium retro-text">
                HASŁO DOSTĘPU
              </label>
              <Input
                id="register-password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onFocus={() => setShowPasswordHints(true)}
                disabled={loading}
                required
                className="retro-input"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : showPasswordHints ? "password-hints" : undefined}
              />
              
              {/* Password strength indicator */}
              {password && (
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
                            : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs retro-text">
                    Siła hasła: {
                      passwordStrength.score <= 2 ? 'SŁABE' :
                      passwordStrength.score <= 3 ? 'ŚREDNIE' :
                      passwordStrength.score <= 4 ? 'DOBRE' : 'BARDZO DOBRE'
                    }
                  </p>
                </div>
              )}

              {showPasswordHints && passwordStrength.feedback.length > 0 && (
                <div id="password-hints" className="text-xs text-muted-foreground space-y-1">
                  <p>Wymagania hasła:</p>
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
              <label htmlFor="confirm-password" className="text-sm font-medium retro-text">
                POTWIERDŹ HASŁO
              </label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••••••"
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

            {/* Temporarily disabled CAPTCHA */}
            {false && (
              <TurnstileCaptcha
                onVerify={handleCaptchaVerify}
                onError={handleCaptchaError}
                onExpire={handleCaptchaError}
                disabled={loading}
              />
            )}

            <Button 
              type="submit" 
              className="w-full retro-button" 
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2 retro-spinner" />
                  REJESTROWANIE...
                </>
              ) : (
                "UTWÓRZ KONTO"
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Masz już konto? </span>
              <a href="/login" className="retro-link">
                Zaloguj się
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
