import React from "react";
import { Alert, AlertDescription } from "./alert";
import { AlertCircle } from "lucide-react";

interface ErrorBannerProps {
  error?: string;
  className?: string;
}

export function ErrorBanner({ error, className }: ErrorBannerProps) {
  if (!error) return null;

  return (
    <Alert variant="destructive" className={className} role="alert">
      <AlertCircle className="h-4 w-4 text-[var(--destructive)]" />
      <AlertDescription className="retro-error font-semibold tracking-wide">{error}</AlertDescription>
    </Alert>
  );
}
