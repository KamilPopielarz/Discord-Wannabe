import React, { useState } from 'react';
import { Button } from './button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './dropdown-menu';
import { User, LogOut, Settings, Shield } from 'lucide-react';
import { GlitchText } from './GlitchText';

interface UserMenuProps {
  username?: string;
  isAdmin?: boolean;
  onLogout: () => void;
}

export function UserMenu({ username = 'User', isAdmin = false, onLogout }: UserMenuProps) {
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
        window.location.href = '/login';
      } else {
        console.error('Logout failed');
        // Still redirect on failure to be safe
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect on error to be safe
      window.location.href = '/login';
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="matrix-button h-auto p-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-matrix-green/20 border border-matrix-green flex items-center justify-center">
              <User className="h-4 w-4 text-matrix-green" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium matrix-text">
                <GlitchText text={username} />
              </p>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'Administrator' : 'Użytkownik'}
              </p>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 matrix-form">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium matrix-text">{username}</p>
          <p className="text-xs text-muted-foreground">
            {isAdmin ? 'Administrator systemu' : 'Aktywny użytkownik'}
          </p>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="matrix-text hover:bg-matrix-green/10">
          <Settings className="mr-2 h-4 w-4" />
          Ustawienia
        </DropdownMenuItem>
        
        {isAdmin && (
          <DropdownMenuItem 
            className="matrix-text hover:bg-matrix-green/10"
            onClick={() => window.location.href = '/admin'}
          >
            <Shield className="mr-2 h-4 w-4" />
            Panel administratora
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="matrix-error hover:bg-destructive/10 focus:bg-destructive/10"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? 'Wylogowywanie...' : 'Wyloguj się'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
