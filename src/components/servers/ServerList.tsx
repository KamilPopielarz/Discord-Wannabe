import React from "react";
import { ServerCard } from "./ServerCard";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { ErrorBanner } from "../ui/ErrorBanner";
import { RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

interface ServerListProps {
  servers: {
    serverId: string;
    inviteLink: string;
    name?: string;
    ttlExpiresAt: string;
  }[];
  loading: boolean;
  error?: string;
  onRefresh: () => void;
  onDeleteServer: (serverId: string) => void;
}

export function ServerList({ servers, loading, error, onRefresh, onDeleteServer }: ServerListProps) {
  if (loading && servers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" className="mb-4 matrix-spinner" />
        <p className="text-muted-foreground matrix-text">SKANOWANIE SERWERÓW...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold matrix-title">
          AKTYWNE SERWERY ({servers.length})
        </h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh} 
          disabled={loading}
          className="matrix-button"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          ODŚWIEŻ
        </Button>
      </div>

      <ErrorBanner error={error} />

      {servers.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-matrix-green/10 border border-matrix-green/30 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-matrix-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0v-4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2 matrix-title">BRAK AKTYWNYCH SERWERÓW</h3>
          <p className="text-muted-foreground mb-4 matrix-text">
            System nie wykrył żadnych serwerów. Zainicjuj pierwszy serwer komunikacyjny.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servers.map((server) => (
            <ServerCard key={server.serverId} server={server} onDelete={onDeleteServer} />
          ))}
        </div>
      )}
    </div>
  );
}
