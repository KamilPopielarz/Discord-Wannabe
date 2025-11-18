import React from "react";
import { cn } from "../../lib/utils";

export interface SettingsSidebarProps {
  sections: { id: string; label: string }[];
  activeSection: string;
  onSelect: (id: string) => void;
}

export function SettingsSidebar({ sections, activeSection, onSelect }: SettingsSidebarProps) {
  return (
    <aside className="retro-card border border-[var(--border)] bg-[var(--sidebar)]/60 p-4">
      <div className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--retro-orange-bright)]">
        Panel ustawień
      </div>
      <div className="space-y-2">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            className={cn(
              "w-full rounded-md px-3 py-2 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--retro-orange)]",
              activeSection === section.id
                ? "bg-[var(--retro-orange-soft)]/60 text-[var(--retro-orange-bright)]"
                : "text-muted-foreground hover:bg-[var(--retro-orange-soft)]/30",
            )}
          >
            {section.label}
          </button>
        ))}
      </div>
    </aside>
  );
}

