import React from "react";
import { ServerList } from "./ServerList";
import { CreateServerModal } from "./CreateServerModal";
import { ThemeToggle } from "../ui/ThemeToggle";
import { useServers } from "../../lib/hooks/useServers";

export function ServersDashboardPage() {
  const { state, createModalOpen, setCreateModalOpen, creating, loadServers, createServer, deleteServer } =
    useServers();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Discord Wannabe</h1>
              <p className="text-muted-foreground">Zarządzaj swoimi serwerami</p>
            </div>
            <div className="flex items-center space-x-4">
              <CreateServerModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                onCreate={createServer}
                creating={creating}
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
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <p className="text-sm text-muted-foreground">© 2024 Discord Wannabe. Wszystkie prawa zastrzeżone.</p>
            <div className="flex space-x-4 text-sm">
              <a href="/login" className="text-muted-foreground hover:text-foreground">
                Logowanie
              </a>
              <a href="/register" className="text-muted-foreground hover:text-foreground">
                Rejestracja
              </a>
              <a href="/guest" className="text-muted-foreground hover:text-foreground">
                Tryb gościa
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
