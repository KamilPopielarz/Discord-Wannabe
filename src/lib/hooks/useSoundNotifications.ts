import { useState, useEffect, useRef, useCallback } from "react";

interface SoundNotificationSettings {
  enabled: boolean;
  volume: number;
  messageSound: boolean;
  typingSound: boolean;
  userJoinSound: boolean;
}

export function useSoundNotifications() {
  const [settings, setSettings] = useState<SoundNotificationSettings>({
    enabled: true,
    volume: 0.5,
    messageSound: true,
    typingSound: false, // Usually annoying, so disabled by default
    userJoinSound: true,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const lastSoundTimeRef = useRef<number>(0);

  // Initialize audio context
  useEffect(() => {
    // Only initialize on client side
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const initAudioContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };

    // Initialize on first user interaction
    const handleFirstInteraction = () => {
      initAudioContext();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Generate notification sound using Web Audio API
  const playSound = useCallback((frequency: number, duration: number, type: 'sine' | 'square' | 'triangle' = 'sine') => {
    if (!settings.enabled || !audioContextRef.current) return;

    // Throttle sounds to prevent spam
    const now = Date.now();
    if (now - lastSoundTimeRef.current < 500) return;
    lastSoundTimeRef.current = now;

    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(settings.volume * 0.3, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }, [settings.enabled, settings.volume]);

  // Different sound types
  const playMessageSound = useCallback(() => {
    if (settings.messageSound) {
      // Pleasant notification sound (C major chord)
      playSound(523.25, 0.15); // C5
      setTimeout(() => playSound(659.25, 0.15), 50); // E5
      setTimeout(() => playSound(783.99, 0.2), 100); // G5
    }
  }, [settings.messageSound, playSound]);

  const playTypingSound = useCallback(() => {
    if (settings.typingSound) {
      // Subtle typing sound
      playSound(800, 0.05, 'square');
    }
  }, [settings.typingSound, playSound]);

  const playUserJoinSound = useCallback(() => {
    if (settings.userJoinSound) {
      // Ascending notification
      playSound(440, 0.1); // A4
      setTimeout(() => playSound(554.37, 0.15), 80); // C#5
    }
  }, [settings.userJoinSound, playSound]);

  const playUserLeaveSound = useCallback(() => {
    if (settings.userJoinSound) {
      // Descending notification
      playSound(554.37, 0.1); // C#5
      setTimeout(() => playSound(440, 0.15), 80); // A4
    }
  }, [settings.userJoinSound, playSound]);

  const updateSettings = useCallback((newSettings: Partial<SoundNotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Test sound function
  const testSound = useCallback(() => {
    playMessageSound();
  }, [playMessageSound]);

  return {
    settings,
    updateSettings,
    playMessageSound,
    playTypingSound,
    playUserJoinSound,
    playUserLeaveSound,
    testSound,
  };
}
