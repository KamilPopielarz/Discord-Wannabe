import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Filter, X } from 'lucide-react';

interface LogFilterProps {
  filters: {
    action?: string;
    actorId?: string;
    targetType?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  onFiltersChange: (filters: Partial<LogFilterProps['filters']>) => void;
  onClearFilters: () => void;
  loading?: boolean;
}

const ACTION_OPTIONS = [
  { value: 'server.create', label: 'Utworzenie serwera' },
  { value: 'server.delete', label: 'Usunięcie serwera' },
  { value: 'room.create', label: 'Utworzenie pokoju' },
  { value: 'room.delete', label: 'Usunięcie pokoju' },
  { value: 'room.join', label: 'Dołączenie do pokoju' },
  { value: 'room.leave', label: 'Opuszczenie pokoju' },
  { value: 'user.join', label: 'Dołączenie użytkownika' },
  { value: 'user.leave', label: 'Opuszczenie użytkownika' },
  { value: 'user.ban', label: 'Zbanowanie użytkownika' },
  { value: 'user.unban', label: 'Odbanowanie użytkownika' },
  { value: 'message.delete', label: 'Usunięcie wiadomości' },
  { value: 'invite.create', label: 'Utworzenie zaproszenia' },
  { value: 'invite.revoke', label: 'Unieważnienie zaproszenia' },
];

const TARGET_TYPE_OPTIONS = [
  { value: 'server', label: 'Serwer' },
  { value: 'room', label: 'Pokój' },
  { value: 'user', label: 'Użytkownik' },
  { value: 'message', label: 'Wiadomość' },
  { value: 'invite', label: 'Zaproszenie' },
];

export function LogFilter({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  loading 
}: LogFilterProps) {
  const hasActiveFilters = Object.values(filters).some(value => value && value.trim() !== '');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filtry logów
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Action Filter */}
          <div className="space-y-2">
            <Label htmlFor="action-filter">Akcja</Label>
            <Select
              value={filters.action || ''}
              onValueChange={(value) => onFiltersChange({ action: value || undefined })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz akcję" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Wszystkie akcje</SelectItem>
                {ACTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="target-type-filter">Typ obiektu</Label>
            <Select
              value={filters.targetType || ''}
              onValueChange={(value) => onFiltersChange({ targetType: value || undefined })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wybierz typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Wszystkie typy</SelectItem>
                {TARGET_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actor ID Filter */}
          <div className="space-y-2">
            <Label htmlFor="actor-filter">ID aktora</Label>
            <Input
              id="actor-filter"
              placeholder="np. user123"
              value={filters.actorId || ''}
              onChange={(e) => onFiltersChange({ actorId: e.target.value || undefined })}
              disabled={loading}
            />
          </div>

          {/* Date From Filter */}
          <div className="space-y-2">
            <Label htmlFor="date-from-filter">Data od</Label>
            <Input
              id="date-from-filter"
              type="datetime-local"
              value={filters.dateFrom || ''}
              onChange={(e) => onFiltersChange({ dateFrom: e.target.value || undefined })}
              disabled={loading}
            />
          </div>

          {/* Date To Filter */}
          <div className="space-y-2">
            <Label htmlFor="date-to-filter">Data do</Label>
            <Input
              id="date-to-filter"
              type="datetime-local"
              value={filters.dateTo || ''}
              onChange={(e) => onFiltersChange({ dateTo: e.target.value || undefined })}
              disabled={loading}
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Wyczyść filtry
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
