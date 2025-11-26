import React, { useState, useEffect } from "react";
import { ServerList } from "./ServerList";
import { CreateServerModal } from "./CreateServerModal";
import { ThemeToggle } from "../ui/ThemeToggle";
import { UserMenu } from "../ui/UserMenu";
import { RetroGridBackground } from "../ui/RetroGridBackground";
import { TypingAnimation } from "../ui/TypingAnimation";
import { useServers } from "../../lib/hooks/useServers";

interface CurrentUserProfile {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  isAdmin: boolean;
}

interface ServersDashboardPageProps {
  initialUsername?: string | null;
  initialProfile?: {
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export function ServersDashboardPage({ initialUsername = null, initialProfile = null }: ServersDashboardPageProps) {
  const { state, createModalOpen, setCreateModalOpen, creating, loadServers, createServer, deleteServer } =
    useServers();

  const [currentUserData, setCurrentUserData] = useState<CurrentUserProfile | null>(
    initialProfile
      ? { ...initialProfile, isAdmin: false }
      : initialUsername
        ? { username: initialUsername, displayName: initialUsername, avatarUrl: null, isAdmin: false }
        : null,
  );
  
  // Get current user data from server (only once on mount)
  useEffect(() => {
    // If we have initial data from props, we start with it (useState logic above handles this).
    // We fetch only to ensure we have the absolute latest data, but we do it only ONCE.
    
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
          
          // Update state with fresh data
          setCurrentUserData({
            username: userData.username || userData.email?.split('@')[0] || initialUsername || 'Użytkownik',
            displayName: userData.displayName || userData.username,
            avatarUrl: userData.avatarUrl || null,
            isAdmin: false
          });
        }
      } catch (error) {
        console.error('[ServersDashboardPage] Failed to fetch user data:', error);
        // On error, we keep whatever initial state we had
      }
    };

    fetchUserData();
  }, []); // Empty dependency array = run once on mount

  const handleLogout = () => {
    // This will be handled by the UserMenu component
    console.log('Logging out...');
  };

  return (
    <>
      <RetroGridBackground />
      <div className="min-h-screen bg-background relative z-10">
        {/* Header */}
        <header className="border-b border-[var(--border)] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-bold retro-heading">
                  <span className="md:hidden">DISCORD WANNABE - SERWERY</span>
                  <TypingAnimation text="DISCORD WANNABE - SERWERY" speed={80} className="hidden md:inline" />
                </h1>
                <p className="text-sm md:text-base text-muted-foreground retro-text">Twoje serwery komunikacyjne</p>
              </div>
              <div className="flex items-center space-x-2 md:space-x-4">
                <CreateServerModal
                  open={createModalOpen}
                  onOpenChange={setCreateModalOpen}
                  onCreate={createServer}
                  creating={creating}
                />
                <UserMenu 
                  username={currentUserData?.username || initialUsername || "Użytkownik"} 
                  displayName={currentUserData?.displayName}
                  avatarUrl={currentUserData?.avatarUrl || null}
                  isAdmin={currentUserData?.isAdmin || false} 
                  onLogout={handleLogout}
                />
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 md:py-8">
        <ServerList
          servers={state.servers}
          loading={state.loading}
          error={state.error}
          onRefresh={loadServers}
          onDeleteServer={deleteServer}
        />
      </main>

        {/* Footer */}
        <footer className="border-t border-[var(--border)] mt-auto">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
              <p className="text-sm text-muted-foreground retro-text">
                © 2024 Discord-Wannabe. Wszystkie fale zastrzeżone.
              </p>
              <div className="flex space-x-4 text-sm">
                <a href="/login" className="retro-link text-xs">
                  DOSTĘP DO SYSTEMU
                </a>
                <a href="/register" className="retro-link text-xs">
                  REJESTRACJA
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
