import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Plus } from "lucide-react";

interface CreateServerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: () => void;
  creating: boolean;
}

export function CreateServerModal({ open, onOpenChange, onCreate, creating }: CreateServerModalProps) {
  const handleCreate = () => {
    onCreate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Utwórz nowy serwer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Utwórz nowy serwer</DialogTitle>
          <DialogDescription>
            Zostanie utworzony nowy serwer z automatycznie wygenerowanym linkiem zaproszeniowym. Serwer będzie aktywny
            przez 24 godziny.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
              Anuluj
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
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
