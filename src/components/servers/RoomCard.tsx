import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Trash2, MessageCircle, Mic, Copy, Lock } from "lucide-react";

interface RoomCardProps {
  room: {
    roomId: string;
    name: string;
    inviteLink: string;
    requiresPassword: boolean;
    isPermanent?: boolean;
    createdAt?: string;
    lastActivity?: string;
  };
  onDelete: (roomId: string) => void;
}

export function RoomCard({ room, onDelete }: RoomCardProps) {
  const copyInviteLink = async () => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(room.inviteLink);
        alert("Link zaproszeniowy do pokoju skopiowany do schowka!");
      } catch {
        alert(`Link zaproszeniowy do pokoju: ${room.inviteLink}`);
      }
    } else {
      alert(`Link zaproszeniowy do pokoju: ${room.inviteLink}`);
    }
  };

  const joinRoom = (view: "chat" | "voice") => {
    window.location.href = `/rooms/${room.inviteLink}?view=${view}`;
  };

  const openRoomJoin = () => {
    window.location.href = `/rooms/${room.inviteLink}`;
  };

  return (
    <Card className="w-full hover:shadow-lg transition-all duration-300" data-testid="room-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center font-semibold" data-testid="room-card-name">
              {room.name.toUpperCase()}
              {room.requiresPassword && <Lock className="h-4 w-4 ml-2 text-primary" />}
              {room.isPermanent && (
                <Badge variant="outline" className="ml-2 text-xs bg-primary/20 text-primary border-primary/30">
                  24H
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              ROOM: {room.roomId.slice(-8).toUpperCase()}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {room.requiresPassword ? (
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                SECURED
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                PUBLIC
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
              {room.inviteLink}
            </code>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => joinRoom("chat")} 
            className="flex items-center"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            CHAT
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => joinRoom("voice")} 
            className="flex items-center"
          >
            <Mic className="h-4 w-4 mr-2" />
            VOICE
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={openRoomJoin} 
            className="flex-1 min-w-0"
          >
            JOIN VIA LINK
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyInviteLink}
          >
            <Copy className="h-4 w-4 mr-2" />
            COPY
          </Button>

          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onDelete(room.roomId)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            DELETE
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
