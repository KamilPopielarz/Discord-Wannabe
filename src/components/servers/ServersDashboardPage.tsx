import React from "react";
import { ServerList } from "./ServerList";
import { CreateServerModal } from "./CreateServerModal";
import { ThemeToggle } from "../ui/ThemeToggle";
import { UserMenu } from "../ui/UserMenu";
import { MatrixBackground } from "../ui/MatrixBackground";
import { TypingAnimation } from "../ui/TypingAnimation";
import { useServers } from "../../lib/hooks/useServers";

export function ServersDashboardPage() {
  const { state, createModalOpen, setCreateModalOpen, creating, loadServers, createServer, deleteServer } =
    useServers();

  const handleLogout = () => {
    // This will be handled by the UserMenu component
    console.log('Logging out...');
  };

  return (
    <>
      <MatrixBackground />
      <div className="min-h-screen bg-background relative z-10">
        {/* Header */}
        <header className="border-b border-matrix-green/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold matrix-title">
                  <TypingAnimation text="CENTRUM KONTROLI SERWERÓW" speed={80} />
                </h1>
                <p className="text-muted-foreground matrix-text">System zarządzania komunikacją</p>
              </div>
              <div className="flex items-center space-x-4">
                <CreateServerModal
                  open={createModalOpen}
                  onOpenChange={setCreateModalOpen}
                  onCreate={createServer}
                  creating={creating}
                />
                <UserMenu 
                  username="Neo" 
                  isAdmin={true} 
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
