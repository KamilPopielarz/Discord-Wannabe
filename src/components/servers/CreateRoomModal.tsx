import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { ErrorBanner } from "../ui/ErrorBanner";
import { Plus, Eye, EyeOff } from "lucide-react";
import type { CreateRoomCommand } from "../../types";

interface CreateRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (roomData: CreateRoomCommand) => void;
  creating: boolean;
  error?: string;
}

export function CreateRoomModal({ open, onOpenChange, onCreate, creating, error }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleCreate = () => {
    if (!roomName.trim()) {
      return;
    }

    const roomData: CreateRoomCommand = {
      name: roomName.trim(),
      ...(hasPassword && password.trim() ? { password: password.trim() } : {}),
    };

    onCreate(roomData);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!creating) {
      onOpenChange(newOpen);
      if (!newOpen) {
        // Reset form when closing
        setRoomName("");
        setHasPassword(false);
        setPassword("");
        setShowPassword(false);
      }
    }
  };

  const isFormValid = roomName.trim() !== "" && (!hasPassword || password.trim() !== "");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto" data-testid="create-room-trigger-button">
          <Plus className="h-4 w-4 mr-2" />
          Utwórz pokój
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Utwórz nowy pokój</DialogTitle>
          <DialogDescription>Utwórz pokój do czatu tekstowego i rozmów głosowych.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ErrorBanner error={error} />

          <div className="space-y-2">
            <Label htmlFor="room-name">Nazwa pokoju *</Label>
            <Input
              id="room-name"
              placeholder="np. Ogólny, Gaming, Muzyka"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              disabled={creating}
              required
              data-testid="create-room-name-input"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="has-password"
              checked={hasPassword}
              onCheckedChange={(checked) => {
                setHasPassword(checked as boolean);
                if (!checked) {
                  setPassword("");
                  setShowPassword(false);
                }
              }}
              disabled={creating}
              data-testid="create-room-password-checkbox"
            />
            <Label htmlFor="has-password" className="text-sm font-normal">
              Chroń pokój hasłem
            </Label>
          </div>

          {hasPassword && (
            <div className="space-y-2">
              <Label htmlFor="room-password">Hasło pokoju</Label>
              <div className="relative">
                <Input
                  id="room-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Wprowadź hasło"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={creating}
                  className="pr-10"
                  data-testid="create-room-password-input"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={creating}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Hasło będzie wymagane do dołączenia do pokoju</p>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <h4 className="font-medium mb-2">Funkcje pokoju:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Czat tekstowy w czasie rzeczywistym</li>
              <li>• Rozmowy głosowe (WebRTC)</li>
              <li>• Zarządzanie członkami</li>
              <li>• Historia wiadomości</li>
            </ul>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={creating} data-testid="create-room-cancel-button">
              Anuluj
            </Button>
            <Button onClick={handleCreate} disabled={creating || !isFormValid} data-testid="create-room-submit-button">
              {creating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Tworzenie...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Utwórz pokój
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
