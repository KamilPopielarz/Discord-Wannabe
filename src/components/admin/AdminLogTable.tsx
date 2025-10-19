import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ScrollArea } from '../ui/scroll-area';
import { Clock, User, Target, Activity } from 'lucide-react';
import type { AuditLogDto } from '../../types';

interface AdminLogTableProps {
  logs: AuditLogDto[];
  loading: boolean;
  error?: string;
}

function getActionBadgeVariant(action: string) {
  if (action.includes('create')) return 'default';
  if (action.includes('delete') || action.includes('ban')) return 'destructive';
  if (action.includes('join') || action.includes('unban')) return 'secondary';
  return 'outline';
}

function getActionLabel(action: string) {
  const actionMap: Record<string, string> = {
    'server.create': 'Utworzenie serwera',
    'server.delete': 'Usunięcie serwera',
    'room.create': 'Utworzenie pokoju',
    'room.delete': 'Usunięcie pokoju',
    'room.join': 'Dołączenie do pokoju',
    'room.leave': 'Opuszczenie pokoju',
    'user.join': 'Dołączenie użytkownika',
    'user.leave': 'Opuszczenie użytkownika',
    'user.ban': 'Zbanowanie użytkownika',
    'user.unban': 'Odbanowanie użytkownika',
    'message.delete': 'Usunięcie wiadomości',
    'invite.create': 'Utworzenie zaproszenia',
    'invite.revoke': 'Unieważnienie zaproszenia',
  };
  return actionMap[action] || action;
}

function getTargetTypeLabel(targetType: string) {
  const typeMap: Record<string, string> = {
    'server': 'Serwer',
    'room': 'Pokój',
    'user': 'Użytkownik',
    'message': 'Wiadomość',
    'invite': 'Zaproszenie',
  };
  return typeMap[targetType] || targetType;
}

function formatMetadata(metadata: any) {
  if (!metadata) return null;
  
  const entries = Object.entries(metadata);
  if (entries.length === 0) return null;

  return (
    <div className="text-xs text-muted-foreground">
      {entries.map(([key, value]) => (
        <div key={key}>
          <span className="font-medium">{key}:</span> {String(value)}
        </div>
      ))}
    </div>
  );
}

export function AdminLogTable({ logs, loading, error }: AdminLogTableProps) {
  if (loading && logs.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-muted-foreground">Ładowanie logów...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-medium mb-2">Błąd ładowania logów</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Brak logów</h3>
            <p className="text-muted-foreground">
              Nie znaleziono logów spełniających kryteria wyszukiwania
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Logi audytu ({logs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Data i czas
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    Akcja
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Aktor
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Cel
                  </div>
                </TableHead>
                <TableHead>Metadane</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {new Date(log.createdAt).toLocaleString('pl-PL')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {getActionLabel(log.action)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">
                      {log.actorId ? (
                        <span title={log.actorId}>
                          {log.actorId.slice(-8)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline">
                        {getTargetTypeLabel(log.targetType)}
                      </Badge>
                      {log.targetId && (
                        <div className="font-mono text-xs text-muted-foreground">
                          {log.targetId.slice(-8)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatMetadata(log.metadata)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
