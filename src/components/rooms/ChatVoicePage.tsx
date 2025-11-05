import React, { useState, useEffect } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { UserList, type RoomUser } from "./UserList";
import { ThemeToggle } from "../ui/ThemeToggle";
import { UserMenu } from "../ui/UserMenu";
import { MatrixBackground } from "../ui/MatrixBackground";
import { TypingAnimation } from "../ui/TypingAnimation";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ArrowLeft, MessageCircle, Mic, MicOff, Volume2, VolumeX, Users, Settings, UserX, Shield, VolumeOff } from "lucide-react";
import { useChat } from "../../lib/hooks/useChat";
import { useRoomUsers } from "../../lib/hooks/useRoomUsers";
import { useTypingIndicator } from "../../lib/hooks/useTypingIndicator";
import type { GetRoomResponseDto, RoomUserDto } from "../../types";

interface ChatVoicePageProps {
  inviteLink?: string;
  view?: string;
  initialUsername?: string | null;
}

export function ChatVoicePage({ inviteLink, view, initialUsername = null }: ChatVoicePageProps) {

  const [roomId, setRoomId] = useState<string | undefined>(undefined);
  const [roomName, setRoomName] = useState<string | undefined>(undefined);
  const [loadingRoomInfo, setLoadingRoomInfo] = useState(false);
  const [roomError, setRoomError] = useState<string | undefined>(undefined);
  const [hasAccess, setHasAccess] = useState<boolean>(true);

  // Load room info from invite link
  useEffect(() => {
    if (inviteLink) {
      handleRoomAccess();
    }
  }, [inviteLink]);

  const handleRoomAccess = async () => {
    // Check what type of session user has (only on client side)
    const hasUserSession = typeof document !== "undefined" && document.cookie.includes("session_id=");
    const hasGuestSession = typeof document !== "undefined" && document.cookie.includes("guest_session_id=");


    if (hasUserSession) {
      // Logged in user - direct access to room
      loadRoomInfo();
    } else if (hasGuestSession) {
      // Already has guest session - direct access to room
      loadRoomInfo();
    } else {
      // No session - create guest session automatically
      await createGuestSession();
    }
  };

  const createGuestSession = async () => {
    try {

      // First, get room info to find the server
      const roomResponse = await fetch(`/api/rooms/${inviteLink}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!roomResponse.ok) {
        console.error("Failed to get room info");
        setRoomError("Nie można znaleźć pokoju. Sprawdź link.");
        return;
      }

      const roomData = await roomResponse.json();

      // Get server invite link from room data
      const serverInviteLink = roomData.serverInviteLink;
      if (!serverInviteLink) {
        console.error("No server invite link in room data");
        setRoomError("Nie można dołączyć jako gość. Spróbuj się zalogować.");
        return;
      }

      // Now create guest session with server invite link
      const guestResponse = await fetch("/api/guest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ serverInviteLink }),
      });

      if (guestResponse.ok) {
        // Instead of reloading, just load room info directly
        loadRoomInfo();
      } else {
        console.error("Failed to create guest session");
        const errorData = await guestResponse.text();
        console.error("Guest session error:", errorData);
        setRoomError("Nie można dołączyć jako gość. Spróbuj się zalogować.");
      }
    } catch (error) {
      console.error("Error creating guest session:", error);
      setRoomError("Błąd połączenia. Sprawdź połączenie internetowe.");
    }
  };

  const loadRoomInfo = async () => {
    if (!inviteLink) return;

    setLoadingRoomInfo(true);
    setRoomError(undefined);

    try {
      const response = await fetch(`/api/rooms/${inviteLink}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });


      if (!response.ok) {
        const errorData = await response.text();
        console.error("Room info error:", errorData);
        setRoomError("Nie można załadować informacji o pokoju");
        return;
      }

      const data: GetRoomResponseDto = await response.json();
      setRoomId(data.roomId);
      setRoomName(data.name);

      // In simplified flow, if user has session and room exists, they have access
      // hasAccess is already true by default
    } catch (error) {
      setRoomError("Błąd połączenia. Sprawdź połączenie internetowe");
    } finally {
      setLoadingRoomInfo(false);
    }
  };

  // Current user data - must be declared before using in hooks
  const [currentUserData, setCurrentUserData] = useState<{userId: string; username: string; isAdmin: boolean} | null>(
    initialUsername ? { userId: 'loading', username: initialUsername, isAdmin: false } : null
  );

  const {
    state,
    loading,
    messageText,
    messagesEndRef,
    loadMoreMessages,
    sendMessage,
    deleteMessage,
    updateMessageText,
    setCurrentUserId,
    hasNewMessages,
    unreadCount,
    notificationsEnabled,
    requestNotificationPermission,
    soundSettings,
    updateSoundSettings,
    testSound,
  } = useChat(roomId, roomName);

  const {
    users: roomUsers,
    loading: loadingUsers,
    error: usersError,
    refreshUsers,
  } = useRoomUsers(roomId);

  const {
    typingUsers,
    handleTyping,
    stopTyping,
    addTypingUser,
  } = useTypingIndicator(roomId, currentUserData?.userId);

  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  
  // Get current user data from server
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/me');
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserData({
            userId: userData.userId,
            username: userData.username || userData.email?.split('@')[0] || initialUsername || 'Użytkownik',
            isAdmin: false // Will be determined by actual permissions later
          });
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Fallback to initialUsername or default
        setCurrentUserData({
          userId: 'unknown',
          username: initialUsername || 'Użytkownik',
          isAdmin: false
        });
      }
    };
    
    fetchUserData();
  }, [initialUsername]);

  // Find current user in room users list
  const currentUser = roomUsers.find(user => user.id === currentUserData?.userId);
  const currentUserRole = currentUser?.role.toLowerCase() as 'owner' | 'admin' | 'moderator' | 'member' || 'member';

  // Set current user ID for notifications
  useEffect(() => {
    if (currentUserData?.userId) {
      setCurrentUserId(currentUserData.userId);
    }
  }, [currentUserData?.userId, setCurrentUserId]);

  const goBack = () => {
    window.history.back();
  };

  const handleLogout = () => {
  };

  const toggleView = () => {
    const newView = view === "chat" ? "voice" : "chat";
    window.location.href = `/rooms/${inviteLink}?view=${newView}`;
  };

  const toggleVoice = () => {
    setIsVoiceConnected(!isVoiceConnected);
    // TODO: Implement actual voice connection logic
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // TODO: Implement actual mute logic
  };

  const toggleDeafen = () => {
    setIsDeafened(!isDeafened);
    if (!isDeafened) {
      setIsMuted(true); // Deafening also mutes
    }
    // TODO: Implement actual deafen logic
  };

  // Voice state is now managed locally for the current user
  // Real voice state synchronization would be implemented with WebRTC

  // Admin functions
  const handleKickUser = async (userId: string) => {
    if (!roomId) return;
    
    try {
      const response = await fetch(`/api/rooms/${roomId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Użytkownik został wyrzucony z pokoju');
        refreshUsers(); // Refresh user list
      } else {
        alert('Błąd podczas wyrzucania użytkownika');
      }
    } catch (error) {
      console.error('Error kicking user:', error);
      alert('Błąd podczas wyrzucania użytkownika');
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'owner' | 'admin' | 'moderator' | 'member') => {
    if (!roomId) return;
    
    try {
      const response = await fetch(`/api/rooms/${roomId}/members/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole.charAt(0).toUpperCase() + newRole.slice(1) }),
      });

      if (response.ok) {
        alert(`Rola użytkownika została zmieniona`);
        refreshUsers(); // Refresh user list
      } else {
        alert('Błąd podczas zmiany roli użytkownika');
      }
    } catch (error) {
      console.error('Error changing user role:', error);
      alert('Błąd podczas zmiany roli użytkownika');
    }
  };

  const handleMuteUser = async (userId: string) => {
    // Voice controls would be implemented with WebRTC
    alert('Funkcja kontroli głosu będzie dostępna po implementacji WebRTC');
  };

  const handleDeafenUser = async (userId: string) => {
    // Voice controls would be implemented with WebRTC
    alert('Funkcja kontroli głosu będzie dostępna po implementacji WebRTC');
  };

  // Show loading screen while fetching room info
  if (loadingRoomInfo) {
    return (
      <>
        <MatrixBackground />
        <div className="h-screen flex items-center justify-center bg-background relative z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-matrix-green mx-auto mb-4"></div>
            <p className="text-muted-foreground matrix-text">ŁĄCZENIE Z POKOJEM...</p>
          </div>
        </div>
      </>
    );
  }

  // Show error screen if room loading failed
  if (roomError) {
    return (
      <>
        <MatrixBackground />
        <div className="h-screen flex items-center justify-center bg-background relative z-10">
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
            <h1 className="text-2xl font-bold mb-2 matrix-title">BŁĄD DOSTĘPU</h1>
            <p className="text-muted-foreground mb-4 matrix-error">{roomError}</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={() => {
                  const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
                  window.location.href = `/login?returnTo=${returnTo}`;
                }}
                variant="default"
                className="matrix-button"
              >
                ZALOGUJ SIĘ
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" className="matrix-button">
                SPRÓBUJ PONOWNIE
              </Button>
              <Button onClick={goBack} variant="ghost" className="matrix-button">
                <ArrowLeft className="h-4 w-4 mr-2" />
                WSTECZ
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MatrixBackground />
      <div className="h-screen flex flex-col bg-background relative z-10">
        {/* Header */}
        <header className="border-b border-matrix-green/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={goBack} className="matrix-button">
                <ArrowLeft className="h-4 w-4 mr-2" />
                WSTECZ
              </Button>

              <div>
                <h1 className="text-lg font-semibold flex items-center matrix-title">
                  <TypingAnimation 
                    text={roomName || `POKÓJ-${roomId?.slice(-6).toUpperCase()}`}
                    speed={50}
                  />
                  <Badge variant="outline" className="ml-2 bg-matrix-green/20 text-matrix-green border-matrix-green/30">
                    {view === "voice" ? (
                      <>
                        <Mic className="h-3 w-3 mr-1" />
                        VOICE
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-3 w-3 mr-1" />
                        CHAT
                        {unreadCount > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </>
                    )}
                  </Badge>
                </h1>
                <p className="text-sm text-muted-foreground matrix-text">LINK: {inviteLink}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {!notificationsEnabled && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={requestNotificationPermission}
                  className="matrix-button text-xs"
                  title="Włącz powiadomienia o nowych wiadomościach"
                >
                  🔔 POWIADOMIENIA
                </Button>
              )}

              {/* Sound settings */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => updateSoundSettings({ enabled: !soundSettings.enabled })}
                className={`matrix-button text-xs ${soundSettings.enabled ? 'text-matrix-green' : 'text-muted-foreground'}`}
                title={soundSettings.enabled ? "Wyłącz dźwięki" : "Włącz dźwięki"}
              >
                {soundSettings.enabled ? <Volume2 className="h-3 w-3 mr-1" /> : <VolumeOff className="h-3 w-3 mr-1" />}
                DŹWIĘKI
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={testSound}
                className="matrix-button text-xs"
                title="Testuj dźwięk powiadomienia"
              >
                🔊 TEST
              </Button>
              
              <Button variant="outline" size="sm" onClick={toggleView} className="matrix-button">
                {view === "chat" ? (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    VOICE MODE
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    CHAT MODE
                  </>
                )}
              </Button>

              {/* Room Settings (for admins) */}
              {(currentUserRole === 'admin' || currentUserRole === 'owner') && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="matrix-button"
                  title="Ustawienia pokoju"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}

              <UserMenu 
                username={currentUser?.username || currentUserData?.username || initialUsername || "Użytkownik"} 
                isAdmin={currentUserRole === 'admin' || currentUserRole === 'owner'} 
                onLogout={handleLogout}
              />
              <ThemeToggle />
            </div>
          </div>
        </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Section */}
        <div className="flex-1 flex flex-col">
          {view === "voice" ? (
            // Voice View
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="text-center max-w-lg">
                {/* Voice Status Indicator */}
                <div className={`mx-auto w-32 h-32 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
                  isVoiceConnected 
                    ? 'bg-matrix-green/20 border-2 border-matrix-green animate-pulse' 
                    : 'bg-matrix-green/10 border border-matrix-green/30'
                }`}>
                  {isVoiceConnected ? (
                    <div className="relative">
                      <Mic className={`w-16 h-16 ${isMuted ? 'text-destructive' : 'text-matrix-green'}`} />
                      {isMuted && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-1 bg-destructive rotate-45 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Mic className="w-16 h-16 text-matrix-green/50" />
                  )}
                </div>

                <h2 className="text-3xl font-bold mb-2 matrix-title">
                  <TypingAnimation 
                    text="KANAŁ GŁOSOWY MATRIX" 
                    speed={60}
                  />
                </h2>
                
                <div className="mb-6">
                  {isVoiceConnected ? (
                    <div className="space-y-2">
                      <p className="text-matrix-green matrix-text font-medium">
                        ● POŁĄCZENIE AKTYWNE - TRANSMISJA GŁOSOWA
                      </p>
                      <div className="flex items-center justify-center space-x-4 text-sm">
                        <span className={`flex items-center space-x-1 ${isMuted ? 'text-destructive' : 'text-matrix-green'}`}>
                          {isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                          <span>{isMuted ? 'WYCISZONY' : 'MIKROFON AKTYWNY'}</span>
                        </span>
                        <span className={`flex items-center space-x-1 ${isDeafened ? 'text-destructive' : 'text-matrix-green'}`}>
                          {isDeafened ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                          <span>{isDeafened ? 'SŁUCHAWKI WYŁĄCZONE' : 'SŁUCHAWKI AKTYWNE'}</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground matrix-text">
                      KLIKNIJ ABY ZAINICJOWAĆ BEZPIECZNE POŁĄCZENIE GŁOSOWE
                    </p>
                  )}
                </div>

                {/* Voice Controls */}
                <div className="flex flex-col space-y-4">
                  <Button 
                    onClick={toggleVoice} 
                    variant={isVoiceConnected ? "destructive" : "default"} 
                    size="lg"
                    className={`text-lg px-8 py-4 ${
                      isVoiceConnected 
                        ? "bg-destructive hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/20" 
                        : "matrix-button text-matrix-black"
                    }`}
                  >
                    {isVoiceConnected ? (
                      <>
                        <UserX className="h-5 w-5 mr-2" />
                        ROZŁĄCZ TRANSMISJĘ
                      </>
                    ) : (
                      <>
                        <Mic className="h-5 w-5 mr-2" />
                        POŁĄCZ Z KANAŁEM
                      </>
                    )}
                  </Button>

                  {isVoiceConnected && (
                    <div className="flex justify-center space-x-3">
                      <Button 
                        variant={isMuted ? "destructive" : "outline"} 
                        size="lg" 
                        onClick={toggleMute}
                        className={`px-6 ${
                          isMuted 
                            ? "bg-destructive hover:bg-destructive/90" 
                            : "matrix-button border-matrix-green text-matrix-green hover:bg-matrix-green/10"
                        }`}
                        title={isMuted ? "Włącz mikrofon" : "Wyłącz mikrofon"}
                      >
                        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        <span className="ml-2 hidden sm:inline">
                          {isMuted ? 'ODCISZ' : 'WYCISZ'}
                        </span>
                      </Button>

                      <Button 
                        variant={isDeafened ? "destructive" : "outline"} 
                        size="lg" 
                        onClick={toggleDeafen}
                        className={`px-6 ${
                          isDeafened 
                            ? "bg-destructive hover:bg-destructive/90" 
                            : "matrix-button border-matrix-green text-matrix-green hover:bg-matrix-green/10"
                        }`}
                        title={isDeafened ? "Włącz słuchawki" : "Wyłącz słuchawki"}
                      >
                        {isDeafened ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        <span className="ml-2 hidden sm:inline">
                          {isDeafened ? 'WŁĄCZ' : 'WYŁĄCZ'}
                        </span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* System Info */}
                <div className="mt-8 p-6 matrix-form rounded-lg text-sm">
                  <p className="font-medium mb-3 matrix-title flex items-center justify-center">
                    <Shield className="h-4 w-4 mr-2" />
                    ZABEZPIECZENIA SYSTEMU MATRIX:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground matrix-text">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-matrix-green rounded-full"></div>
                      <span>SZYFROWANIE END-TO-END</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-matrix-green rounded-full"></div>
                      <span>KONTROLA MIKROFONU</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-matrix-green rounded-full"></div>
                      <span>KONTROLA SŁUCHAWEK</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-matrix-green rounded-full"></div>
                      <span>WSKAŹNIKI AKTYWNOŚCI</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Chat View
            <>
              <MessageList
                messages={state.messages}
                loading={loading}
                error={state.error}
                hasMore={!!state.nextPage}
                onLoadMore={loadMoreMessages}
                onDeleteMessage={deleteMessage}
                messagesEndRef={messagesEndRef}
              />

              <TypingIndicator typingUsers={typingUsers} />
              
              <MessageInput
                onSend={sendMessage}
                disabled={state.sending}
                value={messageText}
                onChange={updateMessageText}
                onTyping={handleTyping}
                onStopTyping={stopTyping}
                placeholder={`Napisz wiadomość w ${roomName || `pokoju ${roomId?.slice(-6)}`}...`}
              />
            </>
          )}
        </div>

        {/* Enhanced User List */}
        <UserList
          users={roomUsers.map(user => ({
            id: user.id,
            username: user.username,
            role: user.role.toLowerCase() as 'owner' | 'admin' | 'moderator' | 'member',
            isOnline: user.isOnline,
            isInVoice: user.id === currentUserData?.userId ? isVoiceConnected : false, // Only current user's voice state is tracked locally
            isMuted: user.id === currentUserData?.userId ? isMuted : false,
            isDeafened: user.id === currentUserData?.userId ? isDeafened : false,
            joinedAt: user.joinedAt,
          }))}
          currentUserId={currentUserData?.userId || ""}
          currentUserRole={currentUserRole}
          isVoiceMode={view === "voice"}
          onKickUser={handleKickUser}
          onChangeRole={handleChangeRole}
          onMuteUser={handleMuteUser}
          onDeafenUser={handleDeafenUser}
        />
      </div>
      </div>
    </>
  );
}
