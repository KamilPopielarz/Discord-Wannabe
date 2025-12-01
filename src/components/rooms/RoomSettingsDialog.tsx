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
import { Trash2, Settings } from "lucide-react";

interface RoomSettingsDialogProps {
  roomId: string;
  onClearChat: () => Promise<void>;
}

export function RoomSettingsDialog({ roomId, onClearChat }: RoomSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        
        <div className="py-6">
          <div className="space-y-4">
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

