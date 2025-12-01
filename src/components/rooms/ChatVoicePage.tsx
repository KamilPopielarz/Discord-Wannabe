import React, { useState, useEffect, useRef } from "react";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { UserList, type RoomUser } from "./UserList";
import { ThemeToggle } from "../ui/ThemeToggle";
import { UserMenu } from "../ui/UserMenu";
import { RetroGridBackground } from "../ui/RetroGridBackground";
import { TypingAnimation } from "../ui/TypingAnimation";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ArrowLeft, MessageCircle, Mic, MicOff, Volume2, VolumeX, Users, Settings, UserX, Shield, VolumeOff, X, Menu } from "lucide-react";
import { useChat } from "../../lib/hooks/useChat";
import { useRoomUsers } from "../../lib/hooks/useRoomUsers";
import { useTypingIndicator } from "../../lib/hooks/useTypingIndicator";
import type { GetRoomResponseDto, RoomUserDto } from "../../types";
import { RoomSettingsDialog } from "./RoomSettingsDialog";
import { RoomPasswordModal } from "../servers/RoomPasswordModal";
import { createSupabaseBrowserClient } from "../../db/supabase.client";

interface ChatVoicePageProps {
  inviteLink?: string;
  view?: string;
  initialUsername?: string | null;
  initialProfile?: {
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export function ChatVoicePage({ inviteLink, view, initialUsername = null, initialProfile = null }: ChatVoicePageProps) {

  const [roomId, setRoomId] = useState<string | undefined>(undefined);
  const [roomName, setRoomName] = useState<string | undefined>(undefined);
  const [serverInviteLink, setServerInviteLink] = useState<string | undefined>(undefined);
  const [loadingRoomInfo, setLoadingRoomInfo] = useState(false);
  const [roomError, setRoomError] = useState<string | undefined>(undefined);
  const [showMobileUsers, setShowMobileUsers] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  // Track verification success to prevent redirect on successful password entry
  const isVerifyingSuccessRef = useRef(false);

  // Load room info from invite link
  useEffect(() => {
    if (inviteLink) {
      loadRoomInfo();
    }
  }, [inviteLink]);

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

      // Redirect to login on 401/403
      if (response.status === 401 || response.status === 403) {
        const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?returnTo=${returnTo}`;
        return;
      }

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Room info error:", errorData);
        setRoomError("Nie można załadować informacji o pokoju");
        return;
      }

      const data: GetRoomResponseDto = await response.json();
      setRoomId(data.roomId);
      setRoomName(data.name);
      setRequiresPassword(data.requiresPassword);
      if (data.serverInviteLink) {
        setServerInviteLink(data.serverInviteLink);
      }

      // In simplified flow, if user has session and room exists, they have access
      // hasAccess is already true by default
      
      // Wait a bit for room join to complete, then refresh users list
      setTimeout(() => {
        if (data.roomId) {
          // This will trigger useRoomUsers to reload
          console.log("Room loaded, users will be refreshed automatically");
        }
      }, 500);
    } catch (error) {
      setRoomError("Błąd połączenia. Sprawdź połączenie internetowe");
    } finally {
      setLoadingRoomInfo(false);
    }
  };

  // Current user data - must be declared before using in hooks
  const [currentUserData, setCurrentUserData] = useState<{
    userId: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    isAdmin: boolean;
  } | null>(
    initialProfile
      ? {
          userId: 'loading',
          username: initialProfile.username,
          displayName: initialProfile.displayName ?? initialProfile.username,
          avatarUrl: initialProfile.avatarUrl ?? null,
          isAdmin: false,
        }
      : initialUsername
      ? {
          userId: 'loading',
          username: initialUsername,
          displayName: initialUsername,
          avatarUrl: null,
          isAdmin: false,
        }
      : null,
  );
  
  // Ref to store heartbeat interval
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    state,
    loading,
    messageText,
    messagesEndRef,
    loadMoreMessages,
    sendMessage,
    deleteMessage,
    clearChat,
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
  } = useTypingIndicator(roomId, currentUserData?.userId, currentUserData?.username);

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
            displayName: userData.displayName || userData.username,
            avatarUrl: userData.avatarUrl || null,
            isAdmin: false // Will be determined by actual permissions later
          });
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Fallback to initialUsername or default
        setCurrentUserData({
          userId: 'unknown',
          username: initialUsername || 'Użytkownik',
          displayName: initialUsername || 'Użytkownik',
          avatarUrl: null,
          isAdmin: false
        });
      }
    };
    
    fetchUserData();
  }, []); // Empty dependency array - run once

  // Find current user in room users list
  const currentUser = roomUsers.find(user => user.id === currentUserData?.userId);
  const currentUserRole = currentUser?.role.toLowerCase() as 'owner' | 'admin' | 'moderator' | 'member' || 'member';
  
  // Listen for password changes
  useEffect(() => {
    if (!roomId) return;
    
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    
    const channel = supabase.channel(`room:${roomId}`);
    channel.on('broadcast', { event: 'PASSWORD_CHANGED' }, () => {
        console.log("[ChatVoicePage] Password changed event received");
        // Only show if not owner
        if (currentUserRole !== 'owner') {
             setShowPasswordModal(true);
        }
    }).subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    };
  }, [roomId, currentUserRole]);

  const handleVerifyPassword = async (password: string) => {
    if (!inviteLink) return false;
    try {
        const res = await fetch(`/api/rooms/${inviteLink}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        if (res.ok) {
            isVerifyingSuccessRef.current = true;
            // Reload to refresh state
            window.location.reload();
            return true;
        }
        return false;
    } catch (e) {
        console.error("Password verification failed", e);
        return false;
    }
  };

  // Debug: log users list
  useEffect(() => {
    if (roomId && roomUsers.length > 0) {
      console.log(`[ChatVoicePage] Room users:`, roomUsers.map(u => ({ id: u.id, username: u.username, isOnline: u.isOnline })));
      console.log(`[ChatVoicePage] Current user:`, currentUserData?.userId, currentUserData?.username);
      console.log(`[ChatVoicePage] Found in list:`, currentUser ? 'YES' : 'NO');
    } else if (roomId && roomUsers.length === 0) {
      console.log(`[ChatVoicePage] No users found for room ${roomId}`);
    }
  }, [roomId, roomUsers, currentUserData, currentUser]);

  // Set current user ID for notifications
  useEffect(() => {
    if (currentUserData?.userId) {
      setCurrentUserId(currentUserData.userId);
    }
  }, [currentUserData?.userId, setCurrentUserId]);

  // Presence heartbeat - update user presence every 15 seconds
  useEffect(() => {
    if (!roomId || !currentUserData?.userId || currentUserData.userId === 'unknown' || currentUserData.userId === 'loading') {
      return;
    }

    // Wait a bit to ensure user is added to room first
    const timeoutId = setTimeout(() => {
      // Update presence immediately when entering room
      const updatePresence = async (retryCount = 0) => {
        const maxRetries = 3;
        const retryDelay = 2000 * (retryCount + 1); // Exponential backoff: 2s, 4s, 6s
        
        try {
          const response = await fetch(`/api/rooms/${roomId}/presence`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for authentication
          });
          
          if (!response.ok) {
            // Retry on server errors (5xx) or rate limiting (429)
            if ((response.status >= 500 || response.status === 429) && retryCount < maxRetries) {
              const errorData = await response.text();
              console.warn(`[Presence] Failed to update presence (${response.status}), retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries}):`, errorData);
              setTimeout(() => {
                updatePresence(retryCount + 1);
              }, retryDelay);
              return;
            }
            
            const errorData = await response.text();
            console.error(`[Presence] Failed to update presence after retries:`, response.status, errorData);
          } else {
            if (retryCount > 0) {
              console.log(`[Presence] Successfully updated presence after ${retryCount} retries`);
            } else {
              console.log(`[Presence] Presence updated successfully`);
            }
          }
        } catch (error) {
          // Retry on network errors
          if (retryCount < maxRetries) {
            console.warn(`[Presence] Error updating presence, retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries}):`, error);
            setTimeout(() => {
              updatePresence(retryCount + 1);
            }, retryDelay);
            return;
          }
          console.error('[Presence] Failed to update presence after retries:', error);
        }
      };

      // Initial presence update
      updatePresence();

      // Set up heartbeat interval (every 15 seconds)
      // Continue heartbeat even if user is not active (presence should be maintained)
      heartbeatIntervalRef.current = setInterval(() => {
        updatePresence();
      }, 15000);
    }, 1000); // Wait 1 second for room join to complete

    // Cleanup: remove presence when leaving
    return () => {
      clearTimeout(timeoutId);
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      // Remove presence when component unmounts
      if (roomId && currentUserData?.userId && currentUserData.userId !== 'unknown' && currentUserData.userId !== 'loading') {
        fetch(`/api/rooms/${roomId}/presence`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }).catch(error => {
          console.error('Failed to remove presence:', error);
        });
      }
    };
  }, [roomId, currentUserData?.userId]);

  const goBack = () => {
    window.history.back();
  };

  const handleLeaveRoom = async () => {
    if (!roomId) return;

    // Delete presence to mark user as offline immediately
    try {
      await fetch(`/api/rooms/${roomId}/presence`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error("Failed to leave room presence", error);
    }

    // Navigate back to server page (room selection)
    if (serverInviteLink) {
      window.location.href = `/servers/${serverInviteLink}`;
    } else {
      // Fallback if no server link available
      window.location.href = "/servers";
    }
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
        <RetroGridBackground />
        <div className="relative z-10 flex h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--retro-orange)]"></div>
            <p className="retro-text text-muted-foreground">Łączenie z pokojem...</p>
          </div>
        </div>
      </>
    );
  }

  // Show error screen if room loading failed
  if (roomError) {
    return (
      <>
        <RetroGridBackground />
        <div className="h-screen flex items-center justify-center bg-background relative z-10">
          <div className="text-center max-w-md p-6 retro-card">
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
            <h1 className="text-2xl font-bold mb-2 retro-heading">Błąd dostępu</h1>
            <p className="text-muted-foreground mb-4 retro-error">{roomError}</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={() => {
                  const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
                  window.location.href = `/login?returnTo=${returnTo}`;
                }}
                variant="default"
                className="retro-button"
              >
                Zaloguj się
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" className="retro-button">
                Spróbuj ponownie
              </Button>
              <Button onClick={goBack} variant="ghost" className="retro-button">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Wstecz
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <RetroGridBackground />
      <div className="relative z-10 flex h-screen flex-col bg-background/80 md:bg-background">
        {/* Header */}
        <header className="border-b border-[var(--border)] bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={goBack} className="retro-button">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Wstecz
              </Button>

              <div>
                <h1 className="text-lg font-semibold flex items-center retro-heading">
                  <span className="md:hidden">
                    {roomName || `Pokój ${roomId?.slice(-6).toUpperCase()}`}
                  </span>
                  <TypingAnimation 
                    text={roomName || `Pokój ${roomId?.slice(-6).toUpperCase()}`}
                    speed={50}
                    className="hidden md:inline"
                  />
                  <Badge
                    variant="outline"
                    className="ml-2 rounded-full border border-[var(--retro-orange)]/40 bg-[var(--retro-orange-soft)] px-2 py-0.5 text-[var(--retro-orange-bright)]"
                  >
                    {view === "voice" ? (
                      <>
                        <Mic className="h-3 w-3 mr-1" />
                        Głos
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Czat
                        {unreadCount > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </>
                    )}
                  </Badge>
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Mobile User Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileUsers(!showMobileUsers)}
                className="md:hidden retro-button text-[var(--retro-orange-bright)]"
              >
                <Users className="h-5 w-5" />
              </Button>

              {!notificationsEnabled && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={requestNotificationPermission}
                  className="retro-button text-xs px-2 sm:px-3"
                  title="Włącz powiadomienia o nowych wiadomościach"
                >
                  <span className="sm:hidden">🔔</span>
                  <span className="hidden sm:inline">🔔 Powiadomienia</span>
                </Button>
              )}

              {/* Sound settings */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateSoundSettings({ enabled: !soundSettings.enabled })}
                className={`retro-button text-xs px-2 sm:px-3 ${soundSettings.enabled ? 'text-[var(--primary-foreground)]' : 'text-muted-foreground'}`}
                title={soundSettings.enabled ? "Wyłącz dźwięki" : "Włącz dźwięki"}
              >
                {soundSettings.enabled ? <Volume2 className="h-3 w-3 sm:mr-1" /> : <VolumeOff className="h-3 w-3 sm:mr-1" />}
                <span className="hidden sm:inline">Dźwięki</span>
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={testSound}
                className="retro-button text-xs hidden sm:flex"
                title="Testuj dźwięk powiadomienia"
              >
                🔊 <span className="hidden lg:inline ml-1">Test</span>
              </Button>
              
              <Button variant="outline" size="sm" onClick={toggleView} className="retro-button px-2 sm:px-3">
                {view === "chat" ? (
                  <>
                    <Mic className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Głos</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Czat</span>
                  </>
                )}
              </Button>

              {/* Room Settings (for owner only) */}
              {currentUserRole === 'owner' && roomId && (
                <RoomSettingsDialog 
                  roomId={roomId}
                  onClearChat={clearChat}
                  requiresPassword={requiresPassword}
                />
              )}

              <UserMenu 
                username={currentUser?.username || currentUserData?.username || initialUsername || "Użytkownik"} 
                displayName={currentUserData?.displayName || currentUser?.username}
                avatarUrl={currentUserData?.avatarUrl || null}
                isAdmin={currentUserRole === 'admin' || currentUserRole === 'owner'} 
                onLogout={handleLogout}
                roomId={roomId}
                onLeaveRoom={handleLeaveRoom}
              />
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <RoomPasswordModal 
            open={showPasswordModal} 
            onOpenChange={(open) => {
                if (!open) {
                    // If closing without success (handled in verify), redirect away
                    if (!isVerifyingSuccessRef.current) {
                        window.location.href = serverInviteLink ? `/servers/${serverInviteLink}` : "/servers";
                    }
                }
                setShowPasswordModal(open);
            }} 
            onVerify={handleVerifyPassword} 
            roomName={roomName || ""} 
        />
        {/* Chat Section */}
        <div className="flex-1 flex flex-col min-h-0">
          {view === "voice" ? (
            // Voice View
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="text-center max-w-lg">
                {/* Voice Status Indicator */}
                <div
                  className={`mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full transition-all duration-300 ${
                    isVoiceConnected
                      ? 'border-2 border-[var(--retro-teal)] bg-[var(--retro-teal)]/15 animate-pulse'
                      : 'border border-[var(--border)] bg-[var(--retro-orange-soft)]/40'
                  }`}
                >
                  {isVoiceConnected ? (
                    <div className="relative">
                      <Mic className={`w-16 h-16 ${isMuted ? 'text-destructive' : 'text-[var(--retro-orange-bright)]'}`} />
                      {isMuted && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-1 bg-destructive rotate-45 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Mic className="w-16 h-16 text-[var(--retro-orange)]/60" />
                  )}
                </div>

                <h2 className="text-3xl font-bold mb-2 retro-heading">
                    <TypingAnimation text="Kanał głosowy Discord-Wannabe (LiveKit w budowie)" speed={60} />
                </h2>
                
                <div className="mb-6">
                  {isVoiceConnected ? (
                    <div className="space-y-2">
                      <p className="retro-text font-medium text-[var(--retro-orange-bright)]">
                        ● Połączenie aktywne — transmisja głosowa
                      </p>
                      <div className="flex items-center justify-center space-x-4 text-sm">
                        <span className={`flex items-center space-x-1 ${isMuted ? 'text-destructive' : 'text-[var(--retro-orange-bright)]'}`}>
                          {isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                          <span>{isMuted ? 'Wyciszony' : 'Mikrofon aktywny'}</span>
                        </span>
                        <span className={`flex items-center space-x-1 ${isDeafened ? 'text-destructive' : 'text-[var(--retro-teal)]'}`}>
                          {isDeafened ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                          <span>{isDeafened ? 'Słuchawki wyłączone' : 'Słuchawki aktywne'}</span>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground retro-text">
                      Kliknij, aby rozpocząć połączenie głosowe.
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
                        : "retro-button text-[var(--primary-foreground)]"
                    }`}
                  >
                    {isVoiceConnected ? (
                      <>
                        <UserX className="h-5 w-5 mr-2" />
                        Rozłącz połączenie
                      </>
                    ) : (
                      <>
                        <Mic className="h-5 w-5 mr-2" />
                        Połącz z kanałem
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
                            : "retro-button border border-[var(--retro-orange)]/60 bg-[var(--retro-orange-soft)]/30 text-[var(--retro-orange-bright)] hover:bg-[var(--retro-orange-soft)]/60"
                        }`}
                        title={isMuted ? "Włącz mikrofon" : "Wyłącz mikrofon"}
                      >
                        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        <span className="ml-2 hidden sm:inline">
                          {isMuted ? 'Odcisz' : 'Wycisz'}
                        </span>
                      </Button>

                      <Button 
                        variant={isDeafened ? "destructive" : "outline"} 
                        size="lg" 
                        onClick={toggleDeafen}
                        className={`px-6 ${
                          isDeafened
                            ? "bg-destructive hover:bg-destructive/90"
                            : "retro-button border border-[var(--retro-teal)]/60 bg-[var(--retro-teal)]/15 text-[var(--retro-teal)] hover:bg-[var(--retro-teal)]/30"
                        }`}
                        title={isDeafened ? "Włącz słuchawki" : "Wyłącz słuchawki"}
                      >
                        {isDeafened ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                        <span className="ml-2 hidden sm:inline">
                          {isDeafened ? 'Włącz' : 'Wyłącz'}
                        </span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* System Info */}
                <div className="mt-8 p-6 retro-card rounded-lg text-sm">
                  <p className="font-medium mb-3 retro-heading flex items-center justify-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Ochrona połączenia
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground retro-text">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--retro-orange-bright)]"></div>
                      <span>Szyfrowanie end-to-end</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--retro-orange-bright)]"></div>
                      <span>Kontrola mikrofonu</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--retro-orange-bright)]"></div>
                      <span>Kontrola słuchawek</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--retro-orange-bright)]"></div>
                      <span>Wskaźniki aktywności</span>
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

        {/* Desktop User List */}
        <div className="hidden md:flex h-full">
          <UserList
            users={roomUsers.map(user => ({
              id: user.id,
              username: user.username,
              role: user.role.toLowerCase() as 'owner' | 'admin' | 'moderator' | 'member',
              isOnline: user.isOnline,
              isInVoice: user.id === currentUserData?.userId ? isVoiceConnected : false,
              isMuted: user.id === currentUserData?.userId ? isMuted : false,
              isDeafened: user.id === currentUserData?.userId ? isDeafened : false,
              joinedAt: user.joinedAt,
              avatarUrl: user.avatarUrl,
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

        {/* Mobile User List Overlay */}
        {showMobileUsers && (
          <div className="fixed inset-0 z-50 flex justify-end md:hidden">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowMobileUsers(false)}
            />
            
            {/* Drawer */}
            <div className="relative w-4/5 max-w-xs h-full bg-background border-l border-[var(--border)] shadow-2xl animate-in slide-in-from-right duration-200">
              <div className="absolute top-2 right-2 z-50">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowMobileUsers(false)}
                  className="h-8 w-8 rounded-full hover:bg-[var(--retro-orange-soft)]/40"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="h-full overflow-hidden">
                <UserList
                  users={roomUsers.map(user => ({
                    id: user.id,
                    username: user.username,
                    role: user.role.toLowerCase() as 'owner' | 'admin' | 'moderator' | 'member',
                    isOnline: user.isOnline,
                    isInVoice: user.id === currentUserData?.userId ? isVoiceConnected : false,
                    isMuted: user.id === currentUserData?.userId ? isMuted : false,
                    isDeafened: user.id === currentUserData?.userId ? isDeafened : false,
                    joinedAt: user.joinedAt,
                    avatarUrl: user.avatarUrl,
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
          </div>
        )}
      </div>
      </div>
    </>
  );
}
