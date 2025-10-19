import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ErrorBanner } from '../ui/ErrorBanner';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { LoginCommand } from '../../types';

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
  onPasswordChange 
}: LoginFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  const isFormValid = email.trim() !== '' && password.trim() !== '';

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Logowanie</CardTitle>
        <CardDescription className="text-center">
          Wprowadź swoje dane, aby się zalogować
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorBanner error={error} className="mb-4" />
          
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              E-mail
            </label>
            <Input
              id="email"
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
            <label htmlFor="password" className="text-sm font-medium">
              Hasło
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Wprowadź hasło"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              disabled={loading}
              required
              aria-invalid={!!error}
              aria-describedby={error ? "error-message" : undefined}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Logowanie...
              </>
            ) : (
              'Zaloguj się'
            )}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Nie masz konta? </span>
            <a href="/register" className="text-primary hover:underline">
              Zarejestruj się
            </a>
          </div>

          <div className="text-center text-sm">
            <a href="/guest" className="text-muted-foreground hover:underline">
              Dołącz jako gość
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
