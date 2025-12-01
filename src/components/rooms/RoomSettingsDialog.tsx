import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Trash2, Settings, Lock, Check } from "lucide-react";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { ErrorBanner } from "../ui/ErrorBanner";
import { createSupabaseBrowserClient } from "../../db/supabase.client";

interface RoomSettingsDialogProps {
  roomId: string;
  requiresPassword?: boolean;
  onClearChat: () => Promise<void>;
}

export function RoomSettingsDialog({ roomId, requiresPassword, onClearChat }: RoomSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleClearChat = async () => {
    if (!confirm("Czy na pewno chcesz wyczyścić cały czat? Tej operacji nie można cofnąć.")) {
      return;
    }

    setIsLoading(true);
    try {
      await onClearChat();
      setOpen(false);
      // Optional: Show success feedback
    } catch (error: any) {
      console.error("Failed to clear chat", error);
      alert(error.message || "Nie udało się wyczyścić czatu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    setIsChangingPassword(true);
    setPasswordError(undefined);

    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Nie udało się zmienić hasła");
      }

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");

      // Broadcast PASSWORD_CHANGED event
      const supabase = createSupabaseBrowserClient();
      if (supabase) {
        supabase.channel(`room:${roomId}`).send({
            type: 'broadcast',
            event: 'PASSWORD_CHANGED',
            payload: {},
        }).catch(err => console.error("Failed to broadcast PASSWORD_CHANGED:", err));
      }
      
      setTimeout(() => {
          setPasswordSuccess(false);
      }, 3000);
      
    } catch (error: any) {
      console.error("Failed to change password", error);
      setPasswordError(error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
        // Reset state on close
        setCurrentPassword("");
        setNewPassword("");
        setPasswordError(undefined);
        setPasswordSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="retro-button"
          title="Ustawienia pokoju"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[var(--retro-bg)] border-[var(--retro-border)] retro-shadow bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="retro-heading text-xl">Ustawienia pokoju</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
          {/* Password Change Section - Only if room is password protected */}
          {requiresPassword && (
            <div className="space-y-4 border border-[var(--border)] rounded-lg p-4 bg-[var(--card)]/50">
              <div className="flex items-center gap-2 mb-2">
                 <Lock className="h-4 w-4 text-[var(--retro-orange-bright)]" />
                 <h4 className="text-sm font-medium retro-text">Zmiana hasła</h4>
              </div>
              
              <form onSubmit={handleChangePassword} className="space-y-3">
                <ErrorBanner error={passwordError} />
                {passwordSuccess && (
                    <div className="bg-green-500/10 border border-green-500/30 text-green-500 px-3 py-2 rounded text-sm flex items-center gap-2">
                        <Check className="h-4 w-4" /> Hasło zostało zmienione
                    </div>
                )}
                
                <div className="space-y-1">
                  <Label htmlFor="current-password">Obecne hasło</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Wpisz obecne hasło"
                    className="bg-[var(--background)]"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="new-password">Nowe hasło</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Wpisz nowe hasło"
                    className="bg-[var(--background)]"
                  />
                </div>

                <Button 
                    type="submit" 
                    disabled={isChangingPassword || !currentPassword || !newPassword}
                    className="w-full retro-button"
                    size="sm"
                >
                    {isChangingPassword ? (
                        <>
                           <LoadingSpinner size="sm" className="mr-2" /> Zmienianie...
                        </>
                    ) : "Zmień hasło"}
                </Button>
                
                <p className="text-xs text-muted-foreground mt-2">
                    Zmiana hasła wyloguje wszystkich użytkowników z pokoju.
                </p>
              </form>
            </div>
          )}

          {/* Clear Chat Section */}
          <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-destructive retro-text">Wyczyść czat</h4>
              <p className="text-xs text-muted-foreground font-mono">Usuń wszystkie wiadomości w tym pokoju.</p>
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleClearChat}
              disabled={isLoading}
              className="retro-button-destructive"
            >
              {isLoading ? "Usuwanie..." : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Wyczyść
                </>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary" className="retro-button">
              Zamknij
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
