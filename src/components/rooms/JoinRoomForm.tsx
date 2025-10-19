import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ErrorBanner } from '../ui/ErrorBanner';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Badge } from '../ui/badge';
import { Lock, Unlock, Eye, EyeOff, MessageCircle, Mic } from 'lucide-react';

interface JoinRoomFormProps {
  roomInfo?: {
    roomId: string;
    requiresPassword: boolean;
  };
  onSubmit: () => void;
  loading: boolean;
  error?: string;
  password: string;
  onPasswordChange: (password: string) => void;
  inviteLink?: string;
  joined?: boolean;
}

export function JoinRoomForm({ 
  roomInfo,
  onSubmit, 
  loading, 
  error, 
  password, 
  onPasswordChange,
  inviteLink,
  joined
}: JoinRoomFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const isFormValid = !roomInfo?.requiresPassword || password.trim() !== '';

  // Show success message if joined
  if (joined) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-green-600">
            Pomyślnie dołączono!
          </CardTitle>
          <CardDescription className="text-center">
            Dołączyłeś do pokoju. Przekierowywanie do czatu...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <LoadingSpinner className="mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Ładowanie pokoju...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!roomInfo) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <LoadingSpinner className="mx-auto mb-4" />
            <p className="text-muted-foreground">Ładowanie informacji o pokoju...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
          Dołącz do pokoju
          {roomInfo.requiresPassword ? (
            <Lock className="h-5 w-5 ml-2 text-amber-500" />
          ) : (
            <Unlock className="h-5 w-5 ml-2 text-green-500" />
          )}
        </CardTitle>
        <CardDescription className="text-center">
          {inviteLink && (
            <code className="text-xs bg-muted px-2 py-1 rounded">{inviteLink}</code>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorBanner error={error} className="mb-4" />
          
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <Badge variant={roomInfo.requiresPassword ? "secondary" : "outline"}>
                {roomInfo.requiresPassword ? (
                  <>
                    <Lock className="h-3 w-3 mr-1" />
                    Chroniony hasłem
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3 mr-1" />
                    Publiczny
                  </>
                )}
              </Badge>
            </div>

            {roomInfo.requiresPassword && (
              <div className="space-y-2">
                <label htmlFor="room-password" className="text-sm font-medium">
                  Hasło pokoju
                </label>
                <div className="relative">
                  <Input
                    id="room-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Wprowadź hasło pokoju"
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    disabled={loading}
                    required
                    className="pr-10"
                    aria-invalid={!!error}
                    aria-describedby={error ? "error-message" : "password-help"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p id="password-help" className="text-xs text-muted-foreground">
                  Hasło zostało ustawione przez właściciela pokoju
                </p>
              </div>
            )}
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
              'Dołącz do pokoju'
            )}
          </Button>

          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <h4 className="font-medium mb-2">Po dołączeniu będziesz mieć dostęp do:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex items-center">
                <MessageCircle className="h-3 w-3 mr-2" />
                Czat tekstowy w czasie rzeczywistym
              </li>
              <li className="flex items-center">
                <Mic className="h-3 w-3 mr-2" />
                Rozmowy głosowe (WebRTC)
              </li>
            </ul>
          </div>

          <div className="text-center text-sm space-y-2">
            <div>
              <span className="text-muted-foreground">Nie masz konta? </span>
              <a href="/register" className="text-primary hover:underline">
                Zarejestruj się
              </a>
            </div>
            <div>
              <span className="text-muted-foreground">Chcesz dołączyć jako gość? </span>
              <a href="/guest" className="text-primary hover:underline">
                Tryb gościa
              </a>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
