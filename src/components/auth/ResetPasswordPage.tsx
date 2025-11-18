import React, { useState } from 'react';
import { ResetPasswordForm } from './ResetPasswordForm';
import { ThemeToggle } from '../ui/ThemeToggle';
import { RetroGridBackground } from '../ui/RetroGridBackground';
import type { PasswordResetConfirmCommand } from '../../types';

interface ResetPasswordPageProps {
  token: string;
}

export function ResetPasswordPage({ token }: ResetPasswordPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (payload: PasswordResetConfirmCommand) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          newPassword: payload.newPassword
        }),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const errorData = await response.json();
        if (response.status === 400) {
          setError('Link resetujący jest nieprawidłowy lub wygasł');
        } else if (response.status === 429) {
          setError('Zbyt wiele prób. Spróbuj ponownie później');
        } else {
          setError(errorData.error || errorData.message || 'Wystąpił błąd podczas zmiany hasła');
        }
      }
    } catch (err) {
      setError('Wystąpił błąd połączenia. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen">
      <RetroGridBackground />
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="flex items-center justify-center p-4 min-h-screen relative z-10">
        <ResetPasswordForm
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          success={success}
          token={token}
        />
      </div>
    </div>
  );
}
