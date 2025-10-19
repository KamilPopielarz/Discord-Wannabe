import React, { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowLeft, MessageCircle, Mic, MicOff, Volume2, VolumeX, Users } from 'lucide-react';
import { useChat } from '../../lib/hooks/useChat';

interface ChatVoicePageProps {
  inviteLink?: string;
  view?: string;
}

export function ChatVoicePage({ inviteLink, view }: ChatVoicePageProps) {
  // Extract roomId from inviteLink (assuming format like /rooms/abc123)
  const roomId = inviteLink?.split('/').pop();
  
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
    window.location.href = `/rooms${inviteLink}?view=${newView}`;
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
                Pokój {roomId?.slice(-6)}
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
                placeholder={`Napisz wiadomość w pokoju ${roomId?.slice(-6)}...`}
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
