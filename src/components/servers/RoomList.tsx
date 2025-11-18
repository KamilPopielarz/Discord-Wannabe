import React from "react";
import { RoomCard } from "./RoomCard";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { ErrorBanner } from "../ui/ErrorBanner";
import { RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

interface RoomListProps {
  rooms: {
    roomId: string;
    name: string;
    inviteLink: string;
    requiresPassword: boolean;
    isPermanent?: boolean;
    createdAt?: string;
    lastActivity?: string;
  }[];
  loading: boolean;
  error?: string;
  onRefresh: () => void;
  onDeleteRoom: (roomId: string) => void;
}

export function RoomList({ rooms, loading, error, onRefresh, onDeleteRoom }: RoomListProps) {
  if (loading && rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" className="mb-4 retro-spinner" />
        <p className="text-muted-foreground retro-text">SKANOWANIE POKOI...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold retro-heading" data-testid="rooms-list-title">AKTYWNE POKOJE ({rooms.length})</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh} 
          disabled={loading}
          className="retro-button"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          ODŚWIEŻ
        </Button>
      </div>

      <ErrorBanner error={error} />

      {rooms.length === 0 ? (
        <div className="text-center py-12" data-testid="rooms-empty-state">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-[var(--retro-orange)] bg-[var(--retro-orange-soft)]">
            <svg className="h-12 w-12 text-[var(--retro-orange-bright)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2 retro-heading">BRAK AKTYWNYCH POKOI</h3>
          <p className="text-muted-foreground mb-4 retro-text">
            Serwer nie posiada żadnych pokoi komunikacyjnych. Zainicjuj pierwszy pokój.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="rooms-list">
          {rooms.map((room) => (
            <RoomCard key={room.roomId} room={room} onDelete={onDeleteRoom} />
          ))}
        </div>
      )}
    </div>
  );
}
