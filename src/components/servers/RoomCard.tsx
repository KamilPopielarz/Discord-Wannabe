import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Trash2, MessageCircle, Mic, Copy, Lock } from 'lucide-react';

interface RoomCardProps {
  room: {
    roomId: string;
    inviteLink: string;
    requiresPassword: boolean;
  };
  onDelete: (roomId: string) => void;
}

export function RoomCard({ room, onDelete }: RoomCardProps) {
  const copyInviteLink = async () => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(room.inviteLink);
        alert('Link zaproszeniowy do pokoju skopiowany do schowka!');
      } catch {
        alert(`Link zaproszeniowy do pokoju: ${room.inviteLink}`);
      }
    } else {
      alert(`Link zaproszeniowy do pokoju: ${room.inviteLink}`);
    }
  };

  const joinRoom = (view: 'chat' | 'voice') => {
    window.location.href = `/rooms${room.inviteLink}?view=${view}`;
  };

  const openRoomJoin = () => {
    window.location.href = `/rooms${room.inviteLink}`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center">
              Pokój {room.roomId.slice(-6)}
              {room.requiresPassword && (
                <Lock className="h-4 w-4 ml-2 text-muted-foreground" />
              )}
            </CardTitle>
            <CardDescription>
              ID: {room.roomId}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {room.requiresPassword ? (
              <Badge variant="secondary">Chroniony hasłem</Badge>
            ) : (
              <Badge variant="outline">Publiczny</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          <p>Link: <code className="text-xs bg-muted px-1 py-0.5 rounded">{room.inviteLink}</code></p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => joinRoom('chat')}
            className="flex items-center"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Czat
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => joinRoom('voice')}
            className="flex items-center"
          >
            <Mic className="h-4 w-4 mr-2" />
            Głos
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openRoomJoin}
            className="flex-1 min-w-0"
          >
            Dołącz przez link
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={copyInviteLink}
          >
            <Copy className="h-4 w-4 mr-2" />
            Kopiuj
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(room.roomId)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Usuń
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
