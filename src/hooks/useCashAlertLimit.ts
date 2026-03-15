
import { useState, useCallback } from 'react';

const STORAGE_KEY = 'cash_alert_limit_minutes';
const DEFAULT_MINUTES = 480; // 8 horas

export function getCashAlertLimitMinutes(): number {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_MINUTES;
}

export function setCashAlertLimitMinutes(minutes: number): void {
  localStorage.setItem(STORAGE_KEY, String(minutes));
}

export function useCashAlertLimit() {
  const [limitMinutes, setLimitMinutesState] = useState<number>(() => getCashAlertLimitMinutes());

  const updateLimit = useCallback((hours: number, minutes: number) => {
    const total = hours * 60 + minutes;
    setCashAlertLimitMinutes(total);
    setLimitMinutesState(total);
  }, []);

  const limitHours = Math.floor(limitMinutes / 60);
  const limitMins = limitMinutes % 60;

  return { limitMinutes, limitHours, limitMins, updateLimit };
}
