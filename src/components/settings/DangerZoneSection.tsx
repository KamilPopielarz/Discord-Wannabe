import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface DangerZoneSectionProps {
  exporting: boolean;
  deleting: boolean;
  onExport: () => Promise<unknown>;
  onDelete: (confirmText: string) => Promise<void>;
}

export function DangerZoneSection({ exporting, deleting, onExport, onDelete }: DangerZoneSectionProps) {
  const [confirmText, setConfirmText] = useState("");
  const [exportedData, setExportedData] = useState<string | null>(null);

  const handleExport = async () => {
    const data = await onExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `discord-wannabe-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setExportedData("Dane zostały wyeksportowane.");
  };

  const handleDelete = async () => {
    await onDelete(confirmText);
  };

  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardHeader>
        <CardTitle className="text-destructive">Strefa zagrożenia</CardTitle>
        <CardDescription>Operacje nieodwracalne. Zachowaj ostrożność.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-background/70 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold">Eksport danych</p>
            <p className="text-xs text-muted-foreground">
              Pobierz kopię danych w formacie JSON na własne archiwum.
            </p>
            {exportedData && <p className="text-xs text-[var(--retro-orange-bright)]">{exportedData}</p>}
          </div>
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            {exporting ? "Generowanie..." : "Eksportuj"}
          </Button>
        </div>

        <div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <p className="font-semibold text-destructive">Usuń konto</p>
          <p className="text-xs text-muted-foreground">
            Tej operacji nie można cofnąć. Wpisz <span className="font-semibold">USUŃ</span> aby potwierdzić.
          </p>
          <Input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder="USUŃ"
            className="retro-input border-destructive/60 focus:border-destructive focus:ring-destructive/40"
          />
          <Button
            type="button"
            variant="destructive"
            className="retro-button bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={confirmText !== "USUŃ" || deleting}
            onClick={handleDelete}
          >
            {deleting ? "Usuwanie..." : "Usuń konto"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

