import { useState, useEffect, useRef } from 'react';

export interface HistoryItem {
  id: string;
  timestamp: number;
  maskedPassword: string;
  score: number;
  label: string;
}

/**
 * Zero-persistence history hook.
 * - Never writes to localStorage, sessionStorage, or any persistent store
 * - Stores only masked passwords (first 2 + last 2 chars visible)
 * - Auto-wipes after 60 seconds of inactivity
 */
export function useLocalHistory(maxItems = 8) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (history.length === 0) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setHistory([]), 60_000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [history]);

  const addToHistory = (password: string, score: number, label: string) => {
    if (!password) return;
    const masked = password.length > 4
      ? `${password.slice(0, 2)}${'*'.repeat(password.length - 4)}${password.slice(-2)}`
      : '*'.repeat(password.length);

    // SECURITY: Only masked string, score, and label stored. Never the real password.
    const item: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      maskedPassword: masked,
      score,
      label,
    };

    setHistory(prev => {
      if (prev.length > 0 && prev[0].maskedPassword === masked) return prev;
      return [item, ...prev].slice(0, maxItems);
    });
  };

  const clearHistory = () => {
    setHistory([]);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return { history, addToHistory, clearHistory };
}
