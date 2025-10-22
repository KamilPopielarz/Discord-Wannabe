import React, { useState, useEffect } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { UserList, type RoomUser } from "./UserList";
import { ThemeToggle } from "../ui/ThemeToggle";
import { UserMenu } from "../ui/UserMenu";
import { MatrixBackground } from "../ui/MatrixBackground";
import { TypingAnimation } from "../ui/TypingAnimation";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ArrowLeft, MessageCircle, Mic, MicOff, Volume2, VolumeX, Users, Settings, UserX, Shield } from "lucide-react";
import { useChat } from "../../lib/hooks/useChat";
import type { GetRoomResponseDto } from "../../types";

interface ChatVoicePageProps {
  inviteLink?: string;
  view?: string;
}

export function ChatVoicePage({ inviteLink, view }: ChatVoicePageProps) {
  // Debug: Check if we can see Supabase config
  console.log("ChatVoicePage: Environment check:", {
    hasSupabaseUrl: !!import.meta.env.SUPABASE_URL,
    hasSupabaseKey: !!import.meta.env.SUPABASE_KEY,
    hasPublicSupabaseUrl: !!import.meta.env.PUBLIC_SUPABASE_URL,
    hasPublicSupabaseKey: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  });

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
    // Check what type of session user has
    const hasUserSession = document.cookie.includes("session_id=");
    const hasGuestSession = document.cookie.includes("guest_session_id=");

    console.log("User session:", hasUserSession, "Guest session:", hasGuestSession);

    if (hasUserSession) {
      // Logged in user - direct access to room
      console.log("Logged user accessing room directly");
      loadRoomInfo();
    } else if (hasGuestSession) {
      // Already has guest session - direct access to room
      console.log("Guest user accessing room directly");
      loadRoomInfo();
    } else {
      // No session - create guest session automatically
      console.log("No session found, creating guest session");
      await createGuestSession();
    }
  };

  const createGuestSession = async () => {
    try {
      console.log("Creating guest session for room invite:", inviteLink);

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
      console.log("Room data for guest session:", roomData);

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
        console.log("Guest session created successfully");
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

    console.log("Loading room info for inviteLink:", inviteLink);
    setLoadingRoomInfo(true);
    setRoomError(undefined);

    try {
      const response = await fetch(`/api/rooms/${inviteLink}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Room info response status:", response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Room info error:", errorData);
        setRoomError("Nie można załadować informacji o pokoju");
        return;
      }

      const data: GetRoomResponseDto = await response.json();
      console.log("Room info data:", data);
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

  const {
    state,
    loading,
    messageText,
    messagesEndRef,
    loadMoreMessages,
    sendMessage,
    deleteMessage,
    updateMessageText,
  } = useChat(roomId);

  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  // Current user data - only show the actual logged-in user
  const [currentUserData, setCurrentUserData] = useState<{username: string; isAdmin: boolean} | null>(null);
  
  // Get current user data from server
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/debug/user-metadata');
        if (response.ok) {
          const userData = await response.json();
          setCurrentUserData({
            username: userData.user_metadata?.username || userData.email?.split('@')[0] || 'Użytkownik',
            isAdmin: false // Will be determined by actual permissions later
          });
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Fallback to default
        setCurrentUserData({
          username: 'Użytkownik',
          isAdmin: false
        });
      }
    };
    
    fetchUserData();
  }, []);

  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
  
  // Update room users when current user data is available
  useEffect(() => {
    if (currentUserData) {
      setRoomUsers([
        {
          id: 'current-user',
          username: currentUserData.username,
          role: 'member', // Default role, will be updated based on actual permissions
          isOnline: true,
          isInVoice: isVoiceConnected,
          isMuted: isMuted,
          isDeafened: isDeafened,
          joinedAt: new Date().toISOString()
        }
      ]);
    }
  }, [currentUserData, isVoiceConnected, isMuted, isDeafened]);

  const currentUser = roomUsers.find(user => user.id === 'current-user');
  const currentUserRole = currentUser?.role || 'member';

  const goBack = () => {
    window.history.back();
  };

  const handleLogout = () => {
    console.log('Logging out...');
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

  // Update current user's voice state when voice settings change
  useEffect(() => {
    setRoomUsers(prev => prev.map(user => 
      user.id === 'current-user' 
        ? { ...user, isInVoice: isVoiceConnected, isMuted, isDeafened }
        : user
    ));
  }, [isVoiceConnected, isMuted, isDeafened]);

  // Admin functions
  const handleKickUser = async (userId: string) => {
    try {
      // TODO: Implement API call to kick user
      console.log('Kicking user:', userId);
      
      // Remove user from room (mock implementation)
      setRoomUsers(prev => prev.filter(user => user.id !== userId));
      
      // Show success message
      alert('Użytkownik został wyrzucony z pokoju');
    } catch (error) {
      console.error('Error kicking user:', error);
      alert('Błąd podczas wyrzucania użytkownika');
    }
  };

  const handleChangeRole = async (userId: string, newRole: RoomUser['role']) => {
    try {
      // TODO: Implement API call to change user role
      console.log('Changing role for user:', userId, 'to:', newRole);
      
      // Update user role (mock implementation)
      setRoomUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      // Show success message
      alert(`Rola użytkownika została zmieniona`);
    } catch (error) {
      console.error('Error changing user role:', error);
      alert('Błąd podczas zmiany roli użytkownika');
    }
  };

  const handleMuteUser = async (userId: string) => {
    try {
      // TODO: Implement API call to mute/unmute user
      console.log('Toggling mute for user:', userId);
      
      // Toggle user mute state (mock implementation)
      setRoomUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isMuted: !user.isMuted } : user
      ));
      
      const user = roomUsers.find(u => u.id === userId);
      alert(`Użytkownik został ${user?.isMuted ? 'odciszony' : 'wyciszony'}`);
    } catch (error) {
      console.error('Error muting user:', error);
      alert('Błąd podczas zmiany stanu mikrofonu');
    }
  };

  const handleDeafenUser = async (userId: string) => {
    try {
      // TODO: Implement API call to deafen/undeafen user
      console.log('Toggling deafen for user:', userId);
      
      // Toggle user deafen state (mock implementation)
      setRoomUsers(prev => prev.map(user => 
        user.id === userId ? { 
          ...user, 
          isDeafened: !user.isDeafened,
          isMuted: !user.isDeafened ? true : user.isMuted // Deafening also mutes
        } : user
      ));
      
      const user = roomUsers.find(u => u.id === userId);
      alert(`Słuchawki użytkownika zostały ${user?.isDeafened ? 'włączone' : 'wyłączone'}`);
    } catch (error) {
      console.error('Error deafening user:', error);
      alert('Błąd podczas zmiany stanu słuchawek');
    }
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
                      </>
                    )}
                  </Badge>
                </h1>
                <p className="text-sm text-muted-foreground matrix-text">LINK: {inviteLink}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
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
                username={currentUser?.username || currentUserData?.username || "Użytkownik"} 
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

              <MessageInput
                onSend={sendMessage}
                disabled={state.sending}
                value={messageText}
                onChange={updateMessageText}
                placeholder={`Napisz wiadomość w ${roomName || `pokoju ${roomId?.slice(-6)}`}...`}
              />
            </>
          )}
        </div>

        {/* Enhanced User List */}
        <UserList
          users={roomUsers}
          currentUserId="current-user"
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
