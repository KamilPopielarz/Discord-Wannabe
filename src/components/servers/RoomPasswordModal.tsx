import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { ErrorBanner } from "../ui/ErrorBanner";
import { Eye, EyeOff, Lock } from "lucide-react";

interface RoomPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (password: string) => Promise<boolean>;
  roomName: string;
}

export function RoomPasswordModal({ open, onOpenChange, onVerify, roomName }: RoomPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [rememberPassword, setRememberPassword] = useState(true);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!password.trim()) return;

    setVerifying(true);
    setError(undefined);

    try {
      const success = await onVerify(password);
      if (success) {
        // Success handling is done by parent (navigation)
        // But we can close modal
        onOpenChange(false);
      } else {
        setError("Nieprawidłowe hasło");
      }
    } catch (err) {
      setError("Wystąpił błąd podczas weryfikacji");
    } finally {
      setVerifying(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!verifying) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setPassword("");
        setError(undefined);
        setShowPassword(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-[var(--retro-bg)] border-[var(--retro-border)] shadow-lg bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[var(--retro-orange-bright)]" />
            Pokój chroniony hasłem
          </DialogTitle>
          <DialogDescription>
            Pokój <strong>{roomName}</strong> wymaga podania hasła, aby dołączyć.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleVerify} className="space-y-4">
          <ErrorBanner error={error} />

          <div className="space-y-2">
            <Label htmlFor="password">Hasło pokoju</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Wprowadź hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={verifying}
                className="pr-10"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={verifying}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember-password"
              checked={rememberPassword}
              onCheckedChange={(checked) => setRememberPassword(checked as boolean)}
              disabled={verifying}
            />
            <Label htmlFor="remember-password" className="text-sm font-normal cursor-pointer text-muted-foreground">
              Zapamiętaj hasło (zaloguj mnie)
            </Label>
          </div>

          <DialogFooter>
             <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={verifying}>
              Anuluj
            </Button>
            <Button type="submit" disabled={verifying || !password.trim()} className="retro-button">
              {verifying ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Weryfikacja...
                </>
              ) : (
                "Wejdź do pokoju"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

