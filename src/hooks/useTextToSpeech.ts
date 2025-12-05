import { useState, useEffect, useRef, useCallback } from 'react';

export interface SpeakResult {
  durationMs: number;
}

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastSpeechDurationMs, setLastSpeechDurationMs] = useState<number | null>(null);
  const speechStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    setIsSupported('speechSynthesis' in window);
  }, []);

  const speak = useCallback((text: string): Promise<SpeakResult> => {
    return new Promise((resolve, reject) => {
      if (!isSupported) {
        console.error('Speech synthesis not supported');
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        speechStartTimeRef.current = Date.now();
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        const durationMs = speechStartTimeRef.current 
          ? Date.now() - speechStartTimeRef.current 
          : 0;
        setLastSpeechDurationMs(durationMs);
        setIsSpeaking(false);
        speechStartTimeRef.current = null;
        resolve({ durationMs });
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        speechStartTimeRef.current = null;
        reject(new Error(event.error || 'Speech synthesis error'));
      };

      window.speechSynthesis.speak(utterance);
    });
  }, [isSupported]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    speechStartTimeRef.current = null;
  }, []);

  return { speak, stop, isSpeaking, isSupported, lastSpeechDurationMs };
};
