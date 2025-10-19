import React, { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, MessageCircle, Mic, MicOff, Volume2, VolumeX, Users } from 'lucide-react';
import { useChat } from '../../lib/hooks/useChat';
import type { GetRoomResponseDto } from '../../types';

interface ChatVoicePageProps {
  inviteLink?: string;
  view?: string;
}

export function ChatVoicePage({ inviteLink, view }: ChatVoicePageProps) {
  // Debug: Check if we can see Supabase config
  console.log('ChatVoicePage: Environment check:', {
    hasSupabaseUrl: !!import.meta.env.SUPABASE_URL,
    hasSupabaseKey: !!import.meta.env.SUPABASE_KEY,
    hasPublicSupabaseUrl: !!import.meta.env.PUBLIC_SUPABASE_URL,
    hasPublicSupabaseKey: !!import.meta.env.PUBLIC_SUPABASE_ANON_KEY
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
    const hasUserSession = document.cookie.includes('session_id=');
    const hasGuestSession = document.cookie.includes('guest_session_id=');
    
    console.log('User session:', hasUserSession, 'Guest session:', hasGuestSession);
    
    if (hasUserSession) {
      // Logged in user - direct access to room
      console.log('Logged user accessing room directly');
      loadRoomInfo();
    } else if (hasGuestSession) {
      // Already has guest session - direct access to room
      console.log('Guest user accessing room directly');
      loadRoomInfo();
    } else {
      // No session - create guest session automatically
      console.log('No session found, creating guest session');
      await createGuestSession();
    }
  };

  const createGuestSession = async () => {
    try {
      console.log('Creating guest session for room invite:', inviteLink);
      
      // First, get room info to find the server
      const roomResponse = await fetch(`/api/rooms/${inviteLink}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!roomResponse.ok) {
        console.error('Failed to get room info');
        setRoomError('Nie można znaleźć pokoju. Sprawdź link.');
        return;
      }

      const roomData = await roomResponse.json();
      console.log('Room data for guest session:', roomData);

      // Get server invite link from room data
      const serverInviteLink = roomData.serverInviteLink;
      if (!serverInviteLink) {
        console.error('No server invite link in room data');
        setRoomError('Nie można dołączyć jako gość. Spróbuj się zalogować.');
        return;
      }

      // Now create guest session with server invite link
      const guestResponse = await fetch('/api/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serverInviteLink }),
      });

      if (guestResponse.ok) {
        console.log('Guest session created successfully');
        // Instead of reloading, just load room info directly
        loadRoomInfo();
      } else {
        console.error('Failed to create guest session');
        const errorData = await guestResponse.text();
        console.error('Guest session error:', errorData);
        setRoomError('Nie można dołączyć jako gość. Spróbuj się zalogować.');
      }
    } catch (error) {
      console.error('Error creating guest session:', error);
      setRoomError('Błąd połączenia. Sprawdź połączenie internetowe.');
    }
  };


  const loadRoomInfo = async () => {
    if (!inviteLink) return;

    console.log('Loading room info for inviteLink:', inviteLink);
    setLoadingRoomInfo(true);
    setRoomError(undefined);

    try {
      const response = await fetch(`/api/rooms/${inviteLink}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Room info response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Room info error:', errorData);
        setRoomError('Nie można załadować informacji o pokoju');
        return;
      }

      const data: GetRoomResponseDto = await response.json();
      console.log('Room info data:', data);
      setRoomId(data.roomId);
      setRoomName(data.name);
      
      // In simplified flow, if user has session and room exists, they have access
      // hasAccess is already true by default
      
    } catch (error) {
      setRoomError('Błąd połączenia. Sprawdź połączenie internetowe');
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
    updateMessageText 
  } = useChat(roomId);

  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  const goBack = () => {
    window.history.back();
  };

  const toggleView = () => {
    const newView = view === 'chat' ? 'voice' : 'chat';
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

  // Show loading screen while fetching room info
  if (loadingRoomInfo) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ładowanie pokoju...</p>
        </div>
      </div>
    );
  }

  // Show error screen if room loading failed
  if (roomError) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <div className="mx-auto w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Nie można załadować pokoju</h1>
          <p className="text-muted-foreground mb-4">{roomError}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => {
              const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
              window.location.href = `/login?returnTo=${returnTo}`;
            }} variant="default">
              Zaloguj się
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Spróbuj ponownie
            </Button>
            <Button onClick={goBack} variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Wstecz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={goBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Wstecz
            </Button>
            
            <div>
              <h1 className="text-lg font-semibold flex items-center">
                {roomName || `Pokój ${roomId?.slice(-6)}`}
                <Badge variant="outline" className="ml-2">
                  {view === 'voice' ? (
                    <>
                      <Mic className="h-3 w-3 mr-1" />
                      Głos
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Czat
                    </>
                  )}
                </Badge>
              </h1>
              <p className="text-sm text-muted-foreground">
                {inviteLink}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleView}
            >
              {view === 'chat' ? (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  Przełącz na głos
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Przełącz na czat
                </>
              )}
            </Button>
            
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Section */}
        <div className="flex-1 flex flex-col">
          {view === 'voice' ? (
            // Voice View
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Mic className="w-12 h-12 text-primary" />
                </div>
                
                <h2 className="text-2xl font-bold mb-2">Kanał głosowy</h2>
                <p className="text-muted-foreground mb-6">
                  {isVoiceConnected 
                    ? 'Połączono z kanałem głosowym' 
                    : 'Kliknij przycisk poniżej, aby dołączyć do rozmowy głosowej'
                  }
                </p>

                <div className="flex flex-col space-y-4">
                  <Button
                    onClick={toggleVoice}
                    variant={isVoiceConnected ? "destructive" : "default"}
                    size="lg"
                  >
                    {isVoiceConnected ? 'Rozłącz się' : 'Dołącz do rozmowy'}
                  </Button>

                  {isVoiceConnected && (
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant={isMuted ? "destructive" : "outline"}
                        size="sm"
                        onClick={toggleMute}
                      >
                        {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                      
                      <Button
                        variant={isDeafened ? "destructive" : "outline"}
                        size="sm"
                        onClick={toggleDeafen}
                      >
                        {isDeafened ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="mt-8 p-4 bg-muted/50 rounded-lg text-sm">
                  <p className="font-medium mb-2">Funkcje głosowe:</p>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Rozmowy głosowe w czasie rzeczywistym</li>
                    <li>• Wyciszanie mikrofonu</li>
                    <li>• Wyciszanie słuchawek</li>
                    <li>• Wskaźniki aktywności głosowej</li>
                  </ul>
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

        {/* Sidebar - Members (placeholder) */}
        <div className="w-64 border-l bg-muted/30 p-4 hidden lg:block">
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-4 w-4" />
            <span className="font-medium">Członkowie</span>
            <Badge variant="secondary">1</Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2 p-2 rounded-md bg-background/50">
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary">Ty</span>
              </div>
              <span className="text-sm">Ty</span>
              {isVoiceConnected && (
                <div className="ml-auto flex space-x-1">
                  {isMuted && <MicOff className="h-3 w-3 text-destructive" />}
                  {isDeafened && <VolumeX className="h-3 w-3 text-destructive" />}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <p>Lista członków będzie rozszerzona w przyszłych wersjach</p>
          </div>
        </div>
      </div>
    </div>
  );
}
