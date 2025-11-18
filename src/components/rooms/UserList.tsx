import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel
} from '../ui/dropdown-menu';
import { 
  Users, 
  Crown, 
  Shield, 
  UserX, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MoreVertical,
  Eye,
  EyeOff
} from 'lucide-react';

export interface RoomUser {
  id: string;
  username: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  isOnline: boolean;
  isInVoice: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  joinedAt: string;
}

interface UserListProps {
  users: RoomUser[];
  currentUserId: string;
  currentUserRole: 'owner' | 'admin' | 'moderator' | 'member';
  isVoiceMode: boolean;
  onKickUser: (userId: string) => void;
  onChangeRole: (userId: string, role: RoomUser['role']) => void;
  onMuteUser: (userId: string) => void;
  onDeafenUser: (userId: string) => void;
}

const roleConfig = {
  owner: {
    label: 'WŁAŚCICIEL',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    icon: Crown,
    priority: 4
  },
  admin: {
    label: 'ADMINISTRATOR',
    color: 'bg-red-500/20 text-red-400 border-red-500/40',
    icon: Shield,
    priority: 3
  },
  moderator: {
    label: 'MODERATOR',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    icon: Shield,
    priority: 2
  },
  member: {
    label: 'CZŁONEK',
    color: 'bg-[var(--retro-orange-soft)] text-[var(--retro-orange-bright)] border-[var(--retro-orange)]/50',
    icon: Users,
    priority: 1
  }
};

function UserItem({ 
  user, 
  currentUserId, 
  currentUserRole, 
  isVoiceMode, 
  onKickUser, 
  onChangeRole, 
  onMuteUser, 
  onDeafenUser 
}: {
  user: RoomUser;
  currentUserId: string;
  currentUserRole: RoomUser['role'];
  isVoiceMode: boolean;
  onKickUser: (userId: string) => void;
  onChangeRole: (userId: string, role: RoomUser['role']) => void;
  onMuteUser: (userId: string) => void;
  onDeafenUser: (userId: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const isCurrentUser = user.id === currentUserId;
  const canManageUser = !isCurrentUser && roleConfig[currentUserRole].priority > roleConfig[user.role].priority;
  
  const roleInfo = roleConfig[user.role];
  const RoleIcon = roleInfo.icon;

  const handleKick = () => {
    if (confirm(`Czy na pewno chcesz wyrzucić użytkownika ${user.username}?`)) {
      onKickUser(user.id);
    }
  };

  const handleRoleChange = (newRole: RoomUser['role']) => {
    if (confirm(`Czy na pewno chcesz zmienić rolę użytkownika ${user.username} na ${roleConfig[newRole].label}?`)) {
      onChangeRole(user.id, newRole);
    }
  };

  return (
    <div
      className={`flex items-center space-x-2 rounded-xl border border-transparent p-2 transition-all duration-200 ${
        user.isOnline
          ? 'bg-background/70 hover:border-[var(--retro-orange)]/40 hover:bg-[var(--retro-orange-soft)]/40'
          : 'bg-muted/40 opacity-60'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div
        className={`relative flex h-8 w-8 items-center justify-center rounded-full border ${
          user.isOnline ? 'border-[var(--retro-orange)] bg-[var(--retro-orange-soft)]' : 'border-muted bg-muted'
        }`}
      >
        <span className={`text-xs font-semibold ${user.isOnline ? 'text-[var(--retro-orange-bright)]' : 'text-muted-foreground'}`}>
          {user.username.charAt(0).toUpperCase()}
        </span>
        
        {/* Online indicator */}
        {user.isOnline && <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-[var(--retro-teal)]"></div>}
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-1">
          <span className={`text-sm font-medium truncate ${user.isOnline ? 'retro-text' : 'text-muted-foreground'}`}>
            {user.username}
            {isCurrentUser && ' (TY)'}
          </span>
          
          {/* Role badge */}
          <Badge variant="secondary" className={`text-xs ${roleInfo.color}`}>
            <RoleIcon className="h-2.5 w-2.5 mr-1" />
            {roleInfo.label}
          </Badge>
        </div>

        {/* Voice indicators */}
        {isVoiceMode && user.isInVoice && (
          <div className="mt-1 flex items-center space-x-1 text-[var(--retro-orange-bright)]">
            {user.isMuted && <MicOff className="h-3 w-3 text-destructive" />}
            {user.isDeafened && <VolumeX className="h-3 w-3 text-destructive" />}
            {!user.isMuted && !user.isDeafened && (
              <div className="flex items-center space-x-1 text-[var(--retro-teal)]">
                <Mic className="h-3 w-3" />
                <Volume2 className="h-3 w-3" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Admin actions */}
      {canManageUser && (showActions || user.isInVoice) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-[var(--retro-orange-soft)]/60"
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          
        <DropdownMenuContent align="end" className="w-48 retro-card">
            <DropdownMenuLabel className="retro-heading text-xs">
              AKCJE ADMINISTRATORA
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            {/* Role management */}
            {currentUserRole === 'owner' && (
              <>
                <DropdownMenuItem 
                  onClick={() => handleRoleChange('admin')}
                  className="retro-text hover:bg-[var(--retro-orange-soft)]/40"
                  disabled={user.role === 'admin'}
                >
                  <Shield className="mr-2 h-3 w-3" />
                  Awansuj na Administratora
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => handleRoleChange('moderator')}
                  className="retro-text hover:bg-[var(--retro-orange-soft)]/40"
                  disabled={user.role === 'moderator'}
                >
                  <Shield className="mr-2 h-3 w-3" />
                  Awansuj na Moderatora
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => handleRoleChange('member')}
                  className="retro-text hover:bg-[var(--retro-orange-soft)]/40"
                  disabled={user.role === 'member'}
                >
                  <Users className="mr-2 h-3 w-3" />
                  Degraduj do Członka
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
              </>
            )}
            
            {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
              <>
                {/* Voice controls */}
                {user.isInVoice && (
                  <>
                    <DropdownMenuItem 
                      onClick={() => onMuteUser(user.id)}
                      className="retro-text hover:bg-[var(--retro-orange-soft)]/40"
                    >
                      {user.isMuted ? (
                        <>
                          <Mic className="mr-2 h-3 w-3" />
                          Odcisz mikrofon
                        </>
                      ) : (
                        <>
                          <MicOff className="mr-2 h-3 w-3" />
                          Wycisz mikrofon
                        </>
                      )}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={() => onDeafenUser(user.id)}
                      className="retro-text hover:bg-[var(--retro-orange-soft)]/40"
                    >
                      {user.isDeafened ? (
                        <>
                          <Volume2 className="mr-2 h-3 w-3" />
                          Włącz słuchawki
                        </>
                      ) : (
                        <>
                          <VolumeX className="mr-2 h-3 w-3" />
                          Wyłącz słuchawki
                        </>
                      )}
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                  </>
                )}
                
                {/* Kick user */}
                <DropdownMenuItem 
                  onClick={handleKick}
                  className="retro-error hover:bg-destructive/10 focus:bg-destructive/10"
                >
                  <UserX className="mr-2 h-3 w-3" />
                  Wyrzuć z pokoju
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function UserList({ 
  users, 
  currentUserId, 
  currentUserRole, 
  isVoiceMode, 
  onKickUser, 
  onChangeRole, 
  onMuteUser, 
  onDeafenUser 
}: UserListProps) {
  const [showOfflineUsers, setShowOfflineUsers] = useState(false);
  
  // Sort users by role priority, then by online status, then by name
  const sortedUsers = [...users].sort((a, b) => {
    // First by role priority
    const roleDiff = roleConfig[b.role].priority - roleConfig[a.role].priority;
    if (roleDiff !== 0) return roleDiff;
    
    // Then by online status
    const onlineDiff = Number(b.isOnline) - Number(a.isOnline);
    if (onlineDiff !== 0) return onlineDiff;
    
    // Finally by username
    return a.username.localeCompare(b.username);
  });

  const onlineUsers = sortedUsers.filter(user => user.isOnline);
  const offlineUsers = sortedUsers.filter(user => !user.isOnline);
  const voiceUsers = onlineUsers.filter(user => user.isInVoice);

  return (
    <div className="flex w-full flex-col border-l border-[var(--border)] bg-muted/20 p-4 sm:w-64">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-[var(--retro-orange-bright)]" />
          <span className="font-medium retro-heading">UŻYTKOWNICY</span>
          <Badge variant="secondary" className="retro-chip px-2 py-0.5">
            {sortedUsers.length}
          </Badge>
        </div>
      </div>

      {/* Voice channel users (if in voice mode) */}
      {isVoiceMode && voiceUsers.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Mic className="h-3 w-3 text-[var(--retro-orange-bright)]" />
            <span className="text-xs font-medium retro-heading">W KANALE GŁOSOWYM</span>
            <Badge variant="secondary" className="retro-chip text-xs px-2 py-0.5">
              {voiceUsers.length}
            </Badge>
          </div>
          
          <div className="space-y-1">
            {voiceUsers.map(user => (
              <UserItem
                key={user.id}
                user={user}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                isVoiceMode={isVoiceMode}
                onKickUser={onKickUser}
                onChangeRole={onChangeRole}
                onMuteUser={onMuteUser}
                onDeafenUser={onDeafenUser}
              />
            ))}
          </div>
        </div>
      )}

      {/* Online users */}
      <div className="mb-4 flex-1 min-h-0 flex flex-col">
        <div className="mb-2 flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-[var(--retro-teal)]"></div>
          <span className="text-xs font-medium retro-heading">ONLINE</span>
          <Badge variant="secondary" className="retro-chip text-xs px-2 py-0.5">
            {onlineUsers.length}
          </Badge>
        </div>
        
        <div className="space-y-1 max-h-64 overflow-y-auto flex-1">
          {onlineUsers
            .filter(user => !isVoiceMode || !user.isInVoice) // Don't duplicate voice users
            .length > 0 ? (
            onlineUsers
              .filter(user => !isVoiceMode || !user.isInVoice)
              .map(user => (
                <UserItem
                  key={user.id}
                  user={user}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  isVoiceMode={isVoiceMode}
                  onKickUser={onKickUser}
                  onChangeRole={onChangeRole}
                  onMuteUser={onMuteUser}
                  onDeafenUser={onDeafenUser}
                />
              ))
          ) : (
            <div className="text-xs text-muted-foreground retro-text p-2 text-center">
              Brak użytkowników online
            </div>
          )}
        </div>
      </div>

      {/* Offline users (collapsible) */}
      {offlineUsers.length > 0 && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOfflineUsers(!showOfflineUsers)}
            className="mb-2 flex h-6 items-center space-x-2 p-0 retro-text hover:bg-[var(--retro-orange-soft)]/40"
          >
            {showOfflineUsers ? (
              <EyeOff className="h-3 w-3" />
            ) : (
              <Eye className="h-3 w-3" />
            )}
            <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
            <span className="text-xs font-medium">OFFLINE</span>
            <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-muted text-xs">
              {offlineUsers.length}
            </Badge>
          </Button>
          
          {showOfflineUsers && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {offlineUsers.map(user => (
                <UserItem
                  key={user.id}
                  user={user}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  isVoiceMode={isVoiceMode}
                  onKickUser={onKickUser}
                  onChangeRole={onChangeRole}
                  onMuteUser={onMuteUser}
                  onDeafenUser={onDeafenUser}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state - no users at all */}
      {sortedUsers.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-xs text-muted-foreground retro-text">
              Brak użytkowników w pokoju
            </p>
          </div>
        </div>
      )}

      {/* Admin info */}
      {(currentUserRole === 'owner' || currentUserRole === 'admin') && (
        <div className="mt-6 p-3 retro-card rounded-lg text-xs">
          <p className="font-medium mb-2 retro-heading">UPRAWNIENIA ADMINISTRATORA:</p>
          <ul className="text-muted-foreground retro-text space-y-1">
            <li>• ZARZĄDZANIE ROLAMI UŻYTKOWNIKÓW</li>
            <li>• KONTROLA KANAŁU GŁOSOWEGO</li>
            <li>• WYRZUCANIE UŻYTKOWNIKÓW</li>
            <li>• MODERACJA WIADOMOŚCI</li>
          </ul>
        </div>
      )}
    </div>
  );
}
