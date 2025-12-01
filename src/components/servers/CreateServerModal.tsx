import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Plus } from "lucide-react";
import type { CreateServerCommand } from "../../types";

interface CreateServerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (serverData: CreateServerCommand) => void;
  creating: boolean;
}

export function CreateServerModal({ open, onOpenChange, onCreate, creating }: CreateServerModalProps) {
  const [serverName, setServerName] = useState("");

  const handleCreate = () => {
    if (!serverName.trim()) {
      return;
    }

    const serverData: CreateServerCommand = {
      name: serverName.trim(),
    };

    onCreate(serverData);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!creating) {
      onOpenChange(newOpen);
      if (!newOpen) {
        // Reset form when closing
        setServerName("");
      }
    }
  };

  const isFormValid = serverName.trim() !== "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto" data-testid="create-server-trigger-button">
          <Plus className="h-4 w-4 mr-2" />
          Utwórz nowy serwer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle>Utwórz nowy serwer</DialogTitle>
          <DialogDescription>
            Zostanie utworzony nowy serwer z automatycznie wygenerowanym linkiem zaproszeniowym. Serwer będzie aktywny
            przez 24 godziny.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server-name">Nazwa serwera *</Label>
            <Input
              id="server-name"
              placeholder="np. Mój Serwer, Gaming Hub, Serwer Przyjaciół"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              disabled={creating}
              required
              maxLength={32}
              data-testid="create-server-name-input"
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <h4 className="font-medium mb-2">Co otrzymasz:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Unikalny link zaproszeniowy</li>
              <li>• Uprawnienia właściciela serwera</li>
              <li>• Możliwość tworzenia pokoi</li>
              <li>• Zarządzanie członkami</li>
            </ul>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={creating} data-testid="create-server-cancel-button">
              Anuluj
            </Button>
            <Button onClick={handleCreate} disabled={creating || !isFormValid} className="border border-input" data-testid="create-server-submit-button">
              {creating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Tworzenie...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Utwórz serwer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
