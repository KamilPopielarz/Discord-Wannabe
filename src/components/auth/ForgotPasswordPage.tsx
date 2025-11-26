import React, { useState, useEffect } from 'react';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { ThemeToggle } from '../ui/ThemeToggle';
import { RetroGridBackground } from '../ui/RetroGridBackground';
import { createSupabaseBrowserClient } from '../../db/supabase.browser';
import type { PasswordResetRequestCommand } from '../../types';

export function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        window.location.href = '/reset-password/recovery';
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
      <RetroGridBackground />
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
