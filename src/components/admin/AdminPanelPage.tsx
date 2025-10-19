import React, { useState } from 'react';
import { AdminLogTable } from './AdminLogTable';
import { LogFilter } from './LogFilter';
import { PaginationControls } from './PaginationControls';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ArrowLeft, Shield, Server } from 'lucide-react';
import { useAdminLogs } from '../../lib/hooks/useAdminLogs';

export function AdminPanelPage() {
  const [serverId, setServerId] = useState('');
  const [selectedServerId, setSelectedServerId] = useState<string | undefined>();
  
  const { 
    state, 
    filters, 
    currentPage, 
    updateFilters, 
    clearFilters, 
    loadMoreLogs, 
    refreshLogs, 
    goToPage 
  } = useAdminLogs(selectedServerId);

  const goBack = () => {
    window.location.href = '/servers';
  };

  const selectServer = () => {
    if (serverId.trim()) {
      setSelectedServerId(serverId.trim());
    }
  };

  const resetServer = () => {
    setSelectedServerId(undefined);
    setServerId('');
  };

  if (!selectedServerId) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Serwery
                </Button>
                <div>
                  <h1 className="text-2xl font-bold flex items-center">
                    <Shield className="h-6 w-6 mr-2" />
                    Panel Administratora
                  </h1>
                  <p className="text-muted-foreground">
                    Zarządzanie i monitorowanie aktywności serwerów
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Server Selection */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Server className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">Wybierz serwer</h2>
              <p className="text-muted-foreground">
                Wprowadź ID serwera, aby wyświetlić logi audytu
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="server-id">ID Serwera</Label>
                <Input
                  id="server-id"
                  placeholder="np. 123e4567-e89b-12d3-a456-426614174000"
                  value={serverId}
                  onChange={(e) => setServerId(e.target.value)}
                />
              </div>

              <Button 
                onClick={selectServer} 
                className="w-full"
                disabled={!serverId.trim()}
              >
                <Shield className="h-4 w-4 mr-2" />
                Wyświetl logi serwera
              </Button>
            </div>

            <div className="mt-8 p-4 bg-muted/50 rounded-lg text-sm">
              <h3 className="font-medium mb-2">Funkcje panelu administratora:</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Przeglądanie logów audytu</li>
                <li>• Filtrowanie po akcjach i użytkownikach</li>
                <li>• Monitorowanie aktywności serwera</li>
                <li>• Śledzenie zmian w pokojach</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={resetServer}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zmień serwer
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center">
                  <Shield className="h-6 w-6 mr-2" />
                  Panel Administratora
                  <Badge variant="outline" className="ml-2">
                    <Server className="h-3 w-3 mr-1" />
                    {selectedServerId.slice(-8)}
                  </Badge>
                </h1>
                <p className="text-muted-foreground">
                  Logi audytu dla serwera {selectedServerId}
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Filters */}
        <LogFilter
          filters={filters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
          loading={state.loading}
        />

        {/* Logs Table */}
        <AdminLogTable
          logs={state.logs}
          loading={state.loading}
          error={state.error}
        />

        {/* Pagination */}
        <PaginationControls
          currentPage={currentPage}
          hasNextPage={!!state.nextPage}
          onPageChange={goToPage}
          onRefresh={refreshLogs}
          loading={state.loading}
        />
      </main>
    </div>
  );
}
