import React from 'react';
import { JoinRoomForm } from './JoinRoomForm';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRoomJoin } from '../../lib/hooks/useRoomJoin';

interface RoomJoinPageProps {
  inviteLink?: string;
}

export function RoomJoinPage({ inviteLink }: RoomJoinPageProps) {
  const { state, updatePassword, joinRoom, retryLoadRoom } = useRoomJoin(inviteLink);

  const goBack = () => {
    window.history.back();
  };

  if (state.loadingRoom) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ładowanie pokoju...</p>
        </div>
      </div>
    );
  }

  if (state.error && !state.roomInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="mx-auto w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Błąd ładowania pokoju</h1>
          <p className="text-muted-foreground mb-4">{state.error}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={retryLoadRoom} variant="outline">
              Spróbuj ponownie
            </Button>
            <Button onClick={goBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Wstecz
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute top-4 left-4">
        <Button variant="ghost" size="sm" onClick={goBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Wstecz
        </Button>
      </div>
      
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <JoinRoomForm
          roomInfo={state.roomInfo}
          onSubmit={joinRoom}
          loading={state.joining}
          error={state.error}
          password={state.password}
          onPasswordChange={updatePassword}
          inviteLink={inviteLink}
          joined={state.joined}
        />
      </div>
    </div>
  );
}
