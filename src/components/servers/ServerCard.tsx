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
    <Card className="w-full matrix-form hover:shadow-lg hover:shadow-matrix-green/10 transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg matrix-title">
              {server.name || `SERWER-${server.serverId.slice(-6).toUpperCase()}`}
            </CardTitle>
            <CardDescription className="matrix-text">
              NODE: {server.serverId.slice(0, 8).toUpperCase()}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {isExpired ? (
              <Badge variant="destructive" className="matrix-error">OFFLINE</Badge>
            ) : (
              <Badge variant="secondary" className="bg-matrix-green/20 text-matrix-green border-matrix-green/30">
                {hoursLeft > 0 ? `${hoursLeft}H ${minutesLeft}M` : `${minutesLeft}M`}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground matrix-text">
          <p className="flex items-center space-x-2">
            <span>LINK:</span>
            <code className="text-xs bg-matrix-green/10 border border-matrix-green/30 px-2 py-1 rounded font-mono text-matrix-green">
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
            className="flex-1 min-w-0 matrix-button"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            CONNECT
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyInviteLink} 
            disabled={isExpired}
            className="matrix-button"
          >
            <Copy className="h-4 w-4 mr-2" />
            COPY
          </Button>

          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onDelete(server.serverId)}
            className="hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/20"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            DELETE
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
