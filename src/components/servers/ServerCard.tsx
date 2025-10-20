import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Trash2, ExternalLink, Copy } from "lucide-react";

interface ServerCardProps {
  server: {
    serverId: string;
    inviteLink: string;
    name?: string;
    ttlExpiresAt: string;
  };
  onDelete: (serverId: string) => void;
}

export function ServerCard({ server, onDelete }: ServerCardProps) {
  const expiresAt = new Date(server.ttlExpiresAt);
  const now = new Date();
  const isExpired = expiresAt < now;
  const timeLeft = Math.max(0, expiresAt.getTime() - now.getTime());
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  const copyInviteLink = async () => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(server.inviteLink);
        alert("Link zaproszeniowy skopiowany do schowka!");
      } catch {
        alert(`Link zaproszeniowy: ${server.inviteLink}`);
      }
    } else {
      alert(`Link zaproszeniowy: ${server.inviteLink}`);
    }
  };

  const openServer = () => {
    window.location.href = `/servers/${server.inviteLink}`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{server.name || `Serwer ${server.serverId.slice(-6)}`}</CardTitle>
            <CardDescription>ID: {server.serverId}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {isExpired ? (
              <Badge variant="destructive">Wygasł</Badge>
            ) : (
              <Badge variant="secondary">{hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          <p>
            Link: <code className="text-xs bg-muted px-1 py-0.5 rounded">{server.inviteLink}</code>
          </p>
          <p>Wygasa: {expiresAt.toLocaleString("pl-PL")}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="default" size="sm" onClick={openServer} disabled={isExpired} className="flex-1 min-w-0">
            <ExternalLink className="h-4 w-4 mr-2" />
            Otwórz
          </Button>

          <Button variant="outline" size="sm" onClick={copyInviteLink} disabled={isExpired}>
            <Copy className="h-4 w-4 mr-2" />
            Kopiuj link
          </Button>

          <Button variant="destructive" size="sm" onClick={() => onDelete(server.serverId)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Usuń
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
