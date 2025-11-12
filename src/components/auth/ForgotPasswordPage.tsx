import React, { useState } from 'react';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { ThemeToggle } from '../ui/ThemeToggle';
import type { PasswordResetRequestCommand } from '../../types';

export function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (payload: PasswordResetRequestCommand) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Wystąpił błąd podczas wysyłania e-maila');
      }
    } catch (err) {
      setError('Wystąpił błąd połączenia. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="flex items-center justify-center p-4 min-h-screen relative z-10">
        <ForgotPasswordForm
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
          success={success}
        />
      </div>
    </div>
  );
}
