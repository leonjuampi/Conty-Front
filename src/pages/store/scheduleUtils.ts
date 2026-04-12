export type ScheduleMode = '24H' | '1T' | '2T';
export type ScheduleDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface ScheduleJson {
  mode: ScheduleMode;
  days: ScheduleDay[];
  shift1?: { from: string; to: string };
  shift2?: { from: string; to: string };
}

const DAY_ORDER: ScheduleDay[] = ['sun','mon','tue','wed','thu','fri','sat'];
const DAY_LABELS: Record<ScheduleDay, string> = {
  mon: 'Lunes', tue: 'Martes', wed: 'Miércoles', thu: 'Jueves',
  fri: 'Viernes', sat: 'Sábados', sun: 'Domingos',
};

export function parseSchedule(raw: any): ScheduleJson | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try { return parseSchedule(JSON.parse(raw)); } catch { return null; }
  }
  if (!raw.mode) return null;
  return {
    mode: raw.mode,
    days: Array.isArray(raw.days) ? raw.days : [],
    shift1: raw.shift1,
    shift2: raw.shift2,
  };
}

function timeToMin(t?: string) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

export function isStoreOpenNow(schedule: ScheduleJson | null, now = new Date()): { open: boolean; reason?: string } {
  if (!schedule) return { open: true };
  const today = DAY_ORDER[now.getDay()];
  if (!schedule.days.includes(today)) {
    const closedLabel = DAY_LABELS[today];
    return { open: false, reason: `Tienda online cerrada los ${closedLabel}` };
  }
  if (schedule.mode === '24H') return { open: true };

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const inShift = (s?: { from: string; to: string }) => {
    if (!s) return false;
    const f = timeToMin(s.from); const t = timeToMin(s.to);
    if (f == null || t == null) return false;
    return nowMin >= f && nowMin <= t;
  };
  if (inShift(schedule.shift1) || (schedule.mode === '2T' && inShift(schedule.shift2))) {
    return { open: true };
  }
  return { open: false, reason: 'Tienda cerrada en este momento' };
}

export function formatScheduleSummary(schedule: ScheduleJson | null): string {
  if (!schedule) return '';
  const daysShort: Record<ScheduleDay, string> = {
    mon: 'Lun', tue: 'Mar', wed: 'Mié', thu: 'Jue', fri: 'Vie', sat: 'Sáb', sun: 'Dom',
  };
  const days = schedule.days.map((d) => daysShort[d]).join(', ') || 'Sin días';
  if (schedule.mode === '24H') return `${days} · 24 hs`;
  const s1 = schedule.shift1 ? `${schedule.shift1.from}-${schedule.shift1.to}` : '';
  const s2 = schedule.mode === '2T' && schedule.shift2 ? ` y ${schedule.shift2.from}-${schedule.shift2.to}` : '';
  return `${days} · ${s1}${s2}`;
}
