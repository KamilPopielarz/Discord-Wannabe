import React, { useState } from "react";
import { Button } from "./button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./dropdown-menu";
import { User, LogOut, Settings, Shield } from "lucide-react";
import { GlitchText } from "./GlitchText";

interface UserMenuProps {
  username?: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  isAdmin?: boolean;
  onLogout: () => void;
}

export function UserMenu({
  username = "User",
  displayName,
  avatarUrl,
  isAdmin = false,
  onLogout,
}: UserMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Clear any local storage
        localStorage.removeItem('user');
        
        // Call the onLogout callback
        onLogout();
        
        // Redirect to login
        window.location.href = "/login";
      } else {
        console.error("Logout failed");
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/login";
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto rounded-full border border-[var(--border)] bg-transparent px-3 py-2 transition hover:bg-[var(--retro-orange-soft)]/60"
        >
          <div className="flex items-center space-x-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--retro-orange)] bg-[var(--retro-orange-soft)] text-[var(--retro-orange-bright)] shadow-inner overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName ?? username} className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-[0.55rem] uppercase tracking-[0.3em] text-[var(--retro-orange-bright)]">Discord-Wannabe</span>
              <p className="text-sm font-semibold text-[var(--foreground)] leading-tight">
                <GlitchText text={displayName || username} />
              </p>
              <p className="text-xs text-muted-foreground">@{username}</p>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 retro-card border border-[var(--border)] bg-[var(--sidebar)]">
        <div className="px-2 py-1.5 space-y-0.5">
          <p className="text-sm font-semibold text-[var(--retro-orange-bright)]">{displayName || username}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--retro-cream)]/70 flex items-center gap-1">
            <span>@{username}</span>
            <span>•</span>
            <span>{isAdmin ? "Administrator" : "Użytkownik"}</span>
          </p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="retro-text hover:bg-[var(--retro-orange-soft)]/40"
          onSelect={() => {
            window.location.href = "/settings";
          }}
        >
          <Settings className="mr-2 h-4 w-4" />
          Ustawienia
        </DropdownMenuItem>

        {isAdmin && (
          <DropdownMenuItem
            className="retro-text hover:bg-[var(--retro-orange-soft)]/40"
            onClick={() => (window.location.href = "/admin")}
          >
            <Shield className="mr-2 h-4 w-4" />
            Panel administratora
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="retro-error hover:bg-destructive/10 focus:bg-destructive/10 font-semibold tracking-wide"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? "Wylogowywanie..." : "Wyloguj się"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
