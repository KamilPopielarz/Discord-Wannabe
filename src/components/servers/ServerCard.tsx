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
    isMember?: boolean;
    role?: string | null;
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
    <Card className="w-full retro-card transition-all duration-300 hover:shadow-[0_20px_45px_rgba(255,122,24,0.25)]" data-testid="server-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg retro-heading">
              {server.name || `SERWER-${server.serverId.slice(-6).toUpperCase()}`}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {isExpired ? (
              <Badge variant="destructive" className="retro-error">
                OFFLINE
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="rounded-full border border-[var(--retro-orange)]/50 bg-[var(--retro-orange-soft)] px-3 py-1 text-[var(--retro-orange-bright)]"
              >
                {hoursLeft > 0 ? `${hoursLeft}H ${minutesLeft}M` : `${minutesLeft}M`}
              </Badge>
            )}
            {server.isMember && server.role && (
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {server.role}
              </Badge>
            )}
            {!server.isMember && (
              <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                JOIN
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground retro-text">
          <p>EXPIRES: {expiresAt.toLocaleString("pl-PL")}</p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={openServer} 
            disabled={isExpired} 
            className="w-full sm:w-auto flex-1 min-w-0 retro-button"
            data-testid="server-connect-button"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            CONNECT
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyInviteLink} 
            disabled={isExpired}
            className="w-full sm:w-auto retro-button"
          >
            <Copy className="h-4 w-4 mr-2" />
            COPY
          </Button>

          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onDelete(server.serverId)}
            className="w-full sm:w-auto hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/20"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            DELETE
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
