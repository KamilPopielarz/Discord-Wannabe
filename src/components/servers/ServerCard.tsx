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
    <Card className="w-full hover:shadow-lg transition-all duration-300" data-testid="server-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {server.name || `SERWER-${server.serverId.slice(-6).toUpperCase()}`}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              NODE: {server.serverId.slice(0, 8).toUpperCase()}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {isExpired ? (
              <Badge variant="destructive">OFFLINE</Badge>
            ) : (
              <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
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
        <div className="text-sm text-muted-foreground">
          <p className="flex items-center space-x-2">
            <span>LINK:</span>
            <code className="text-xs bg-muted border border-border px-2 py-1 rounded font-mono text-foreground">
              {server.inviteLink}
            </code>
          </p>
          <p>EXPIRES: {expiresAt.toLocaleString("pl-PL")}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={openServer} 
            disabled={isExpired} 
            className="flex-1 min-w-0"
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
          >
            <Copy className="h-4 w-4 mr-2" />
            COPY
          </Button>

          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onDelete(server.serverId)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            DELETE
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
