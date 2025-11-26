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
    <Card className="w-full retro-card transition-all duration-300 hover:shadow-[0_20px_45px_rgba(255,122,24,0.25)]" data-testid="room-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center retro-heading" data-testid="room-card-name">
              {room.name.toUpperCase()}
              {room.requiresPassword && <Lock className="ml-2 h-4 w-4 text-[var(--retro-orange-bright)]" />}
              {room.isPermanent && (
                <Badge
                  variant="outline"
                  className="ml-2 rounded-full border border-[var(--retro-orange)]/40 bg-[var(--retro-orange-soft)] px-2 py-0.5 text-xs text-[var(--retro-orange-bright)]"
                >
                  24H
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="retro-text">
              ROOM: {room.roomId.slice(-8).toUpperCase()}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {room.requiresPassword ? (
              <Badge variant="secondary" className="rounded-full border border-yellow-500/40 bg-yellow-500/15 px-3 py-1 text-yellow-300">
                SECURED
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="rounded-full border border-[var(--retro-orange)]/40 bg-[var(--retro-orange-soft)] px-3 py-1 text-[var(--retro-orange-bright)]"
              >
                PUBLIC
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => joinRoom("chat")} 
            className="flex items-center retro-button justify-center"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            CHAT
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => joinRoom("voice")} 
            className="flex items-center retro-button justify-center"
          >
            <Mic className="h-4 w-4 mr-2" />
            VOICE
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={openRoomJoin} 
            className="w-full sm:w-auto flex-1 min-w-0 retro-button"
          >
            JOIN VIA LINK
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={copyInviteLink}
            className="w-full sm:w-auto retro-button"
          >
            <Copy className="h-4 w-4 mr-2" />
            COPY
          </Button>

          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onDelete(room.roomId)}
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
