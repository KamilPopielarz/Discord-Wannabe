import React from 'react';
import { LoginForm } from './LoginForm';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useLogin } from '../../lib/hooks/useLogin';

export function LoginPage() {
  const { state, updateField, login } = useLogin();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <LoginForm
          onSubmit={login}
          loading={state.loading}
          error={state.error}
          email={state.email}
          password={state.password}
          onEmailChange={(email) => updateField('email', email)}
          onPasswordChange={(password) => updateField('password', password)}
        />
      </div>
    </div>
  );
}
