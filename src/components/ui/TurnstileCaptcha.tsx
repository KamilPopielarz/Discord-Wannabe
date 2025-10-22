import React, { useState, useEffect, useRef } from 'react';

interface TurnstileCaptchaProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  disabled?: boolean;
  className?: string;
}

export function TurnstileCaptcha({
  onVerify,
  onError,
  onExpire,
  disabled = false,
  className = '',
}: TurnstileCaptchaProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Simulate CAPTCHA verification for development
  const handleVerify = async () => {
    if (disabled || isVerified) return;

    setIsLoading(true);
    setError(null);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate random success/failure for testing
      const success = Math.random() > 0.1; // 90% success rate

      if (success) {
        const mockToken = `mock-turnstile-token-${Date.now()}`;
        setIsVerified(true);
        onVerify(mockToken);
      } else {
        const errorMsg = 'Weryfikacja nie powiodła się. Spróbuj ponownie.';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Błąd podczas weryfikacji CAPTCHA';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsVerified(false);
    setError(null);
    onExpire?.();
  };

  // Auto-expire after 5 minutes
  useEffect(() => {
    if (!isVerified) return;

    const timer = setTimeout(() => {
      handleReset();
    }, 5 * 60 * 1000);

    return () => clearTimeout(timer);
  }, [isVerified]);

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium matrix-text">
        Weryfikacja bezpieczeństwa
      </label>
      
      <div 
        ref={widgetRef}
        className="matrix-form border rounded-lg p-4 min-h-[80px] flex items-center justify-center"
      >
        {isLoading ? (
          <div className="flex items-center space-x-3">
            <div className="matrix-spinner w-5 h-5"></div>
            <span className="text-sm matrix-text">Weryfikowanie...</span>
          </div>
        ) : isVerified ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm matrix-text">Zweryfikowano pomyślnie</span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs matrix-link"
              disabled={disabled}
            >
              Resetuj
            </button>
          </div>
        ) : error ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm matrix-error">{error}</span>
            </div>
            <button
              type="button"
              onClick={handleVerify}
              className="text-xs matrix-link"
              disabled={disabled}
            >
              Spróbuj ponownie
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3 w-full">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 border-2 border-matrix-green-dark rounded"></div>
              <span className="text-sm matrix-text">Nie jestem robotem</span>
            </div>
            <button
              type="button"
              onClick={handleVerify}
              disabled={disabled}
              className="matrix-button px-4 py-2 text-xs rounded"
            >
              Kliknij aby zweryfikować
            </button>
          </div>
        )}
      </div>

      {/* Development notice */}
      <p className="text-xs text-muted-foreground">
        ⚠️ To jest symulacja CAPTCHA dla celów rozwoju. W produkcji zostanie zastąpiona prawdziwą weryfikacją Turnstile.
      </p>
    </div>
  );
}
