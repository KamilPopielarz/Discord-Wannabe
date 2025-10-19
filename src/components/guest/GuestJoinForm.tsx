import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ErrorBanner } from '../ui/ErrorBanner';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface GuestJoinFormProps {
  onSubmit: (inviteLink: string) => void;
  loading: boolean;
  error?: string;
  inviteLink: string;
  onInviteLinkChange: (link: string) => void;
  guestNick?: string;
}

export function GuestJoinForm({ 
  onSubmit, 
  loading, 
  error, 
  inviteLink, 
  onInviteLinkChange,
  guestNick
}: GuestJoinFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(inviteLink);
  };

  const isFormValid = inviteLink.trim() !== '';

  // Show success message if guest nick is available
  if (guestNick) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-green-600">
            Pomyślnie dołączono!
          </CardTitle>
          <CardDescription className="text-center">
            Twój nick gościa: <strong>{guestNick}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <LoadingSpinner className="mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Przekierowywanie...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Dołącz jako gość</CardTitle>
        <CardDescription className="text-center">
          Wprowadź link zaproszeniowy, aby dołączyć do serwera lub pokoju
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorBanner error={error} className="mb-4" />
          
          <div className="space-y-2">
            <label htmlFor="invite-link" className="text-sm font-medium">
              Link zaproszeniowy
            </label>
            <Input
              id="invite-link"
              type="text"
              placeholder="/servers/abc123 lub /rooms/def456"
              value={inviteLink}
              onChange={(e) => onInviteLinkChange(e.target.value)}
              disabled={loading}
              required
              aria-invalid={!!error}
              aria-describedby={error ? "error-message" : "invite-link-help"}
            />
            <p id="invite-link-help" className="text-xs text-muted-foreground">
              Link powinien zaczynać się od /servers/ lub /rooms/
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Dołączanie...
              </>
            ) : (
              'Dołącz jako gość'
            )}
          </Button>

          <div className="text-center text-sm space-y-2">
            <div>
              <span className="text-muted-foreground">Masz konto? </span>
              <a href="/login" className="text-primary hover:underline">
                Zaloguj się
              </a>
            </div>
            <div>
              <span className="text-muted-foreground">Nie masz konta? </span>
              <a href="/register" className="text-primary hover:underline">
                Zarejestruj się
              </a>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">Sesja gościa:</p>
            <ul className="space-y-1">
              <li>• Trwa 24 godziny</li>
              <li>• Automatycznie generowany nick</li>
              <li>• Ograniczone uprawnienia</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
