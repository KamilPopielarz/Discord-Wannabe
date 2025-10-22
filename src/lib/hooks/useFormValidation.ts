import { useState, useCallback, useMemo } from 'react';

export interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

export interface PasswordStrength {
  score: number; // 0-5
  feedback: string[];
  isValid: boolean;
}

export function useFormValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = useCallback((email: string): string | null => {
    if (!email.trim()) return 'E-mail jest wymagany';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Nieprawidłowy format e-mail';
    
    return null;
  }, []);

  const validatePassword = useCallback((password: string): string | null => {
    if (!password) return 'Hasło jest wymagane';
    if (password.length < 8) return 'Hasło musi mieć co najmniej 8 znaków';
    if (!/[A-Z]/.test(password)) return 'Hasło musi zawierać wielką literę';
    if (!/[a-z]/.test(password)) return 'Hasło musi zawierać małą literę';
    if (!/\d/.test(password)) return 'Hasło musi zawierać cyfrę';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return 'Hasło musi zawierać znak specjalny';
    }
    
    return null;
  }, []);

  const getPasswordStrength = useCallback((password: string): PasswordStrength => {
    if (!password) {
      return { score: 0, feedback: ['Wprowadź hasło'], isValid: false };
    }

    let score = 0;
    const feedback: string[] = [];

    // Length check
    if (password.length >= 8) {
      score++;
    } else {
      feedback.push('Co najmniej 8 znaków');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score++;
    } else {
      feedback.push('Wielka litera (A-Z)');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score++;
    } else {
      feedback.push('Mała litera (a-z)');
    }

    // Number check
    if (/\d/.test(password)) {
      score++;
    } else {
      feedback.push('Cyfra (0-9)');
    }

    // Special character check
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score++;
    } else {
      feedback.push('Znak specjalny (!@#$%^&*)');
    }

    // Bonus for length
    if (password.length >= 12) {
      score++;
    }

    return {
      score,
      feedback,
      isValid: score >= 5,
    };
  }, []);

  const validatePasswordConfirmation = useCallback((password: string, confirmation: string): string | null => {
    if (!confirmation) return 'Potwierdzenie hasła jest wymagane';
    if (password !== confirmation) return 'Hasła nie są identyczne';
    return null;
  }, []);

  const validateUsername = useCallback((username: string): string | null => {
    if (!username.trim()) return 'Nazwa użytkownika jest wymagana';
    if (username.length < 3) return 'Nazwa użytkownika musi mieć co najmniej 3 znaki';
    if (username.length > 20) return 'Nazwa użytkownika może mieć maksymalnie 20 znaków';
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return 'Nazwa użytkownika może zawierać tylko litery, cyfry, _ i -';
    }
    return null;
  }, []);

  const setFieldError = useCallback((field: string, error: string | null) => {
    setErrors(prev => {
      if (error === null) {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [field]: error };
    });
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  return {
    errors,
    validateEmail,
    validatePassword,
    getPasswordStrength,
    validatePasswordConfirmation,
    validateUsername,
    setFieldError,
    clearErrors,
    hasErrors,
  };
}
