import React from 'react';
import { ThemeToggle } from '../ui/ThemeToggle';

export function AdminPanelPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
          <p className="text-muted-foreground">Będzie zaimplementowane w kolejnych krokach</p>
        </div>
      </div>
    </div>
  );
}
