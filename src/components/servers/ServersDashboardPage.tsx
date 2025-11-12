import React, { useState, useEffect } from "react";
import { ServerList } from "./ServerList";
import { CreateServerModal } from "./CreateServerModal";
import { ThemeToggle } from "../ui/ThemeToggle";
import { UserMenu } from "../ui/UserMenu";
import { TypingAnimation } from "../ui/TypingAnimation";
import { useServers } from "../../lib/hooks/useServers";

interface ServersDashboardPageProps {
  initialUsername?: string | null;
}

export function ServersDashboardPage({ initialUsername = null }: ServersDashboardPageProps) {
  const { state, createModalOpen, setCreateModalOpen, creating, loadServers, createServer, deleteServer } =
    useServers();

  const [currentUserData, setCurrentUserData] = useState<{username: string; isAdmin: boolean} | null>(
    initialUsername ? { username: initialUsername, isAdmin: false } : null
  );
  
  // Get current user data from server (only if initialUsername is not provided)
  useEffect(() => {
    // If we already have initialUsername, skip fetch or use it as fallback
    if (initialUsername) {
      // Still fetch to get latest data, but don't override if it's the same
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
            console.log('[ServersDashboardPage] User data from /api/me:', userData);
            // Only update if we got a different/better username
            if (userData.username && userData.username !== initialUsername) {
              setCurrentUserData({
                username: userData.username || userData.email?.split('@')[0] || initialUsername,
                isAdmin: false
              });
            }
          }
        } catch (error) {
          console.error('[ServersDashboardPage] Failed to fetch user data:', error);
          // Keep initialUsername if fetch fails
        }
      };
      fetchUserData();
    } else {
      // No initialUsername, so we must fetch
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
            console.log('[ServersDashboardPage] User data from /api/me:', userData);
            setCurrentUserData({
              username: userData.username || userData.email?.split('@')[0] || 'Użytkownik',
              isAdmin: false
            });
          } else {
            console.error('[ServersDashboardPage] /api/me failed:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('[ServersDashboardPage] Failed to fetch user data:', error);
          setCurrentUserData({
            username: 'Użytkownik',
            isAdmin: false
          });
        }
      };
      fetchUserData();
    }
  }, [initialUsername]);

  const handleLogout = () => {
    // This will be handled by the UserMenu component
    console.log('Logging out...');
  };

  return (
    <>
      <div className="min-h-screen bg-background relative z-10">
        {/* Header */}
        <header className="border-b border-matrix-green/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold matrix-title">
                  <TypingAnimation text="DISCORD WANNABE - SERWERY" speed={80} />
                </h1>
                <p className="text-muted-foreground matrix-text">Twoje serwery komunikacyjne</p>
              </div>
              <div className="flex items-center space-x-4">
                <CreateServerModal
                  open={createModalOpen}
                  onOpenChange={setCreateModalOpen}
                  onCreate={createServer}
                  creating={creating}
                />
                <UserMenu 
                  username={currentUserData?.username || initialUsername || "Użytkownik"} 
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
        <ServerList
          servers={state.servers}
          loading={state.loading}
          error={state.error}
          onRefresh={loadServers}
          onDeleteServer={deleteServer}
        />
      </main>

        {/* Footer */}
        <footer className="border-t border-matrix-green/20 mt-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
              <p className="text-sm text-muted-foreground matrix-text">
                © 2024 MATRIX COMMUNICATION SYSTEM. WSZYSTKIE PRAWA ZASTRZEŻONE.
              </p>
              <div className="flex space-x-4 text-sm">
                <a href="/login" className="matrix-link text-xs">
                  DOSTĘP DO SYSTEMU
                </a>
                <a href="/register" className="matrix-link text-xs">
                  REJESTRACJA
                </a>
                <a href="/guest" className="matrix-link text-xs">
                  TRYB GOŚCINNY
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
