import React from "react";
import { RoomList } from "./RoomList";
import { CreateRoomModal } from "./CreateRoomModal";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import { useServerRooms } from "../../lib/hooks/useServerRooms";

interface ServerDetailPageProps {
  inviteLink?: string;
}

export function ServerDetailPage({ inviteLink }: ServerDetailPageProps) {
  const { state, createModalOpen, setCreateModalOpen, creating, loadRooms, createRoom, deleteRoom } =
    useServerRooms(inviteLink);

  const goBack = () => {
    window.location.href = "/servers";
  };

  const serverExpiresAt = state.serverInfo?.ttlExpiresAt ? new Date(state.serverInfo.ttlExpiresAt) : null;
  const now = new Date();
  const isServerExpired = serverExpiresAt ? serverExpiresAt < now : false;
  const timeLeft = serverExpiresAt ? Math.max(0, serverExpiresAt.getTime() - now.getTime()) : 0;
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  if (state.loadingServer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ładowanie serwera...</p>
        </div>
      </div>
    );
  }

  if (state.error && !state.serverInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="mx-auto w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Błąd ładowania serwera</h1>
          <p className="text-muted-foreground mb-4">{state.error}</p>
          <Button onClick={goBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Powrót do serwerów
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={goBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Serwery
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center">
                  {state.serverInfo?.name || `Serwer ${state.serverInfo?.serverId?.slice(-6)}`}
                  {isServerExpired ? (
                    <Badge variant="destructive" className="ml-2">
                      Wygasł
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="ml-2">
                      <Clock className="h-3 w-3 mr-1" />
                      {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`}
                    </Badge>
                  )}
                </h1>
                <p className="text-muted-foreground">
                  {inviteLink} • ID: {state.serverInfo?.serverId}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {!isServerExpired && (
                <CreateRoomModal
                  open={createModalOpen}
                  onOpenChange={setCreateModalOpen}
                  onCreate={createRoom}
                  creating={creating}
                  error={state.error}
                />
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isServerExpired ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-12 h-12 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Serwer wygasł</h2>
            <p className="text-muted-foreground mb-4">Ten serwer wygasł {serverExpiresAt?.toLocaleString("pl-PL")}</p>
            <Button onClick={goBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Powrót do serwerów
            </Button>
          </div>
        ) : (
          <RoomList
            rooms={state.rooms}
            loading={state.loading}
            error={state.error}
            onRefresh={loadRooms}
            onDeleteRoom={deleteRoom}
          />
        )}
      </main>
    </div>
  );
}
