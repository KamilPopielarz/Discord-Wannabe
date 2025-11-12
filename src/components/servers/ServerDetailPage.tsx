import React, { useState, useEffect } from "react";
import { RoomList } from "./RoomList";
import { CreateRoomModal } from "./CreateRoomModal";
import { ThemeToggle } from "../ui/ThemeToggle";
import { UserMenu } from "../ui/UserMenu";
import { TypingAnimation } from "../ui/TypingAnimation";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import { useServerRooms } from "../../lib/hooks/useServerRooms";

interface ServerDetailPageProps {
  inviteLink?: string;
  initialUsername?: string | null;
}

export function ServerDetailPage({ inviteLink, initialUsername = null }: ServerDetailPageProps) {
  const { state, createModalOpen, setCreateModalOpen, creating, loadRooms, createRoom, deleteRoom } =
    useServerRooms(inviteLink);

  const [currentUserData, setCurrentUserData] = useState<{username: string; isAdmin: boolean} | null>(
    initialUsername ? { username: initialUsername, isAdmin: false } : null
  );
  
  // Get current user data from server
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/me', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        if (response.ok) {
          const userData = await response.json();
          console.log('[ServerDetailPage] User data from /api/me:', userData);
          setCurrentUserData({
            username: userData.username || userData.email?.split('@')[0] || 'Użytkownik',
            isAdmin: false // Will be determined by actual permissions later
          });
        } else {
          console.error('[ServerDetailPage] /api/me failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('[ServerDetailPage] Failed to fetch user data:', error);
        // Fallback to default
        setCurrentUserData({
          username: 'Użytkownik',
          isAdmin: false
        });
      }
    };
    
    fetchUserData();
  }, []);

  const goBack = () => {
    window.location.href = "/servers";
  };

  const handleLogout = () => {
    console.log('Logging out...');
  };

  const serverExpiresAt = state.serverInfo?.ttlExpiresAt ? new Date(state.serverInfo.ttlExpiresAt) : null;
  const now = new Date();
  const isServerExpired = serverExpiresAt ? serverExpiresAt < now : false;
  const timeLeft = serverExpiresAt ? Math.max(0, serverExpiresAt.getTime() - now.getTime()) : 0;
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  if (state.loadingServer) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center relative z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green mx-auto mb-4"></div>
            <p className="text-muted-foreground matrix-text">ŁĄCZENIE Z SERWEREM...</p>
          </div>
        </div>
      </>
    );
  }

  if (state.error && !state.serverInfo) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center relative z-10">
          <div className="text-center max-w-md p-6 matrix-form">
            <div className="mx-auto w-24 h-24 bg-destructive/10 border border-destructive/30 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2 matrix-title">BŁĄD POŁĄCZENIA</h1>
            <p className="text-muted-foreground mb-4 matrix-error">{state.error}</p>
            <Button onClick={goBack} className="matrix-button">
              <ArrowLeft className="h-4 w-4 mr-2" />
              POWRÓT DO SERWERÓW
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background relative z-10">
        {/* Header */}
        <header className="border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={goBack} className="matrix-button">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  SERWERY
                </Button>
                <div>
                  <h1 className="text-2xl font-bold flex items-center matrix-title" data-testid="server-detail-title">
                    <TypingAnimation 
                      text={state.serverInfo?.name || `SERWER-${state.serverInfo?.serverId?.slice(-6).toUpperCase()}`}
                      speed={60}
                    />
                    {isServerExpired ? (
                      <Badge variant="destructive" className="ml-2 matrix-error">
                        OFFLINE
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-2 bg-accent-green/20 text-accent-green border-accent-green/30">
                        <Clock className="h-3 w-3 mr-1" />
                        {hoursLeft > 0 ? `${hoursLeft}H ${minutesLeft}M` : `${minutesLeft}M`}
                      </Badge>
                    )}
                  </h1>
                  <p className="text-muted-foreground matrix-text">
                    LINK: {inviteLink} • NODE: {state.serverInfo?.serverId?.slice(0, 8).toUpperCase()}
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
                <UserMenu 
                  username={currentUserData?.username || "Użytkownik"} 
                  isAdmin={currentUserData?.isAdmin || false} 
                  onLogout={handleLogout}
                />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {isServerExpired ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-destructive/10 border border-destructive/30 rounded-full flex items-center justify-center mb-4">
              <Clock className="w-12 h-12 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2 matrix-title">SERWER OFFLINE</h2>
            <p className="text-muted-foreground mb-4 matrix-error">
              Połączenie wygasło: {serverExpiresAt?.toLocaleString("pl-PL")}
            </p>
            <Button onClick={goBack} className="matrix-button">
              <ArrowLeft className="h-4 w-4 mr-2" />
              POWRÓT DO SERWERÓW
            </Button>
          </div>
        ) : (
          <div data-testid="server-rooms-section">
            <RoomList
              rooms={state.rooms}
              loading={state.loading}
              error={state.error}
              onRefresh={loadRooms}
              onDeleteRoom={deleteRoom}
            />
          </div>
        )}
      </main>
      </div>
    </>
  );
}
