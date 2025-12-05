import { useState, useEffect, useCallback, useRef } from 'react';

export interface TabChangeEvent {
  timestamp: string;
  wasHidden: boolean;
  durationHiddenMs?: number;
}

export const useTabVisibility = () => {
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden);
  const [tabChangeEvents, setTabChangeEvents] = useState<TabChangeEvent[]>([]);
  const hiddenTimestampRef = useRef<number | null>(null);

  const handleVisibilityChange = useCallback(() => {
    const isHidden = document.hidden;
    const now = Date.now();
    
    if (isHidden) {
      // Tab is now hidden
      hiddenTimestampRef.current = now;
      setTabChangeEvents((prev) => [
        ...prev,
        {
          timestamp: new Date(now).toISOString(),
          wasHidden: true,
        },
      ]);
    } else {
      // Tab is now visible
      const durationHiddenMs = hiddenTimestampRef.current 
        ? now - hiddenTimestampRef.current 
        : undefined;
      hiddenTimestampRef.current = null;
      setTabChangeEvents((prev) => [
        ...prev,
        {
          timestamp: new Date(now).toISOString(),
          wasHidden: false,
          durationHiddenMs,
        },
      ]);
    }
    
    setIsTabVisible(!isHidden);
  }, []);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  const clearEvents = useCallback(() => {
    setTabChangeEvents([]);
  }, []);

  const getTabChangeCount = useCallback(() => {
    return tabChangeEvents.filter((e) => e.wasHidden).length;
  }, [tabChangeEvents]);

  return {
    isTabVisible,
    tabChangeEvents,
    tabChangeCount: getTabChangeCount(),
    clearEvents,
  };
};
