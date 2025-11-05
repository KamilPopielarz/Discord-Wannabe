import { useState, useEffect, useRef } from "react";

export function useUserActivity(inactivityThreshold = 30000) { // 30 seconds
  const [isActive, setIsActive] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsActive(true);
    lastActivityRef.current = Date.now();

    timeoutRef.current = setTimeout(() => {
      setIsActive(false);
    }, inactivityThreshold);
  };

  useEffect(() => {
    // Only set up event listeners on client side
    if (typeof document === "undefined") return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetTimeout();
    };

    // Set up event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initialize timeout
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inactivityThreshold]);

  return {
    isActive,
    lastActivity: lastActivityRef.current,
  };
}
