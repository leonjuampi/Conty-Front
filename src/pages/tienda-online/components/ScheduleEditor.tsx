import { Clock } from 'lucide-react';

export type ScheduleMode = '24H' | '1T' | '2T';
export type ScheduleDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface ScheduleJson {
  mode: ScheduleMode;
  days: ScheduleDay[];
  shift1?: { from: string; to: string };
  shift2?: { from: string; to: string };
}

const DAYS: { id: ScheduleDay; label: string }[] = [
  { id: 'mon', label: 'Lun' },
  { id: 'tue', label: 'Mar' },
  { id: 'wed', label: 'Mié' },
  { id: 'thu', label: 'Jue' },
  { id: 'fri', label: 'Vie' },
  { id: 'sat', label: 'Sáb' },
  { id: 'sun', label: 'Dom' },
];

function parseSchedule(raw: any): ScheduleJson {
  if (!raw) return { mode: '24H', days: ['mon','tue','wed','thu','fri','sat','sun'] };
  if (typeof raw === 'string') {
    try { return parseSchedule(JSON.parse(raw)); } catch { return { mode: '24H', days: [] }; }
  }
  return {
    mode: raw.mode || '24H',
    days: Array.isArray(raw.days) ? raw.days : [],
    shift1: raw.shift1,
    shift2: raw.shift2,
  };
}

interface Props {
  value: any;
  onChange: (s: ScheduleJson) => void;
}

export default function ScheduleEditor({ value, onChange }: Props) {
  const s = parseSchedule(value);

  const setMode = (mode: ScheduleMode) => {
    const next: ScheduleJson = { ...s, mode };
    if (mode !== '24H' && !next.shift1) next.shift1 = { from: '09:00', to: '13:00' };
    if (mode === '2T' && !next.shift2) next.shift2 = { from: '17:00', to: '21:00' };
    onChange(next);
  };
  const toggleDay = (d: ScheduleDay) => {
    const has = s.days.includes(d);
    onChange({ ...s, days: has ? s.days.filter((x) => x !== d) : [...s.days, d] });
  };
  const setShift = (which: 'shift1' | 'shift2', key: 'from' | 'to', val: string) => {
    const current = s[which] || { from: '', to: '' };
    onChange({ ...s, [which]: { ...current, [key]: val } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-emerald-600" />
        <div className="font-bold text-gray-900">Disponibilidad de la tienda</div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(['24H','1T','2T'] as ScheduleMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`py-3 rounded-full text-sm font-semibold border transition-colors ${
              s.mode === m ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200'
            }`}
          >
            {m === '24H' ? '24 horas' : m === '1T' ? '1 turno' : '2 turnos'}
          </button>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <div className="text-center text-xs uppercase tracking-wide text-gray-400 mb-3">Días de atención</div>
        <div className="flex justify-center flex-wrap gap-2">
          {DAYS.map((d) => {
            const active = s.days.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDay(d.id)}
                className={`h-10 w-12 rounded-full text-sm font-semibold border transition-colors ${
                  active ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {s.mode !== '24H' && (
        <div className={`grid gap-3 ${s.mode === '2T' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
          <ShiftInput label="Turno 1" value={s.shift1} onChange={(k, v) => setShift('shift1', k, v)} />
          {s.mode === '2T' && (
            <ShiftInput label="Turno 2" value={s.shift2} onChange={(k, v) => setShift('shift2', k, v)} />
          )}
        </div>
      )}
    </div>
  );
}

function ShiftInput({ label, value, onChange }: {
  label: string;
  value?: { from: string; to: string };
  onChange: (key: 'from' | 'to', val: string) => void;
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">{label}</div>
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={value?.from || ''}
          onChange={(e) => onChange('from', e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-center"
        />
        <span className="text-gray-400">a</span>
        <input
          type="time"
          value={value?.to || ''}
          onChange={(e) => onChange('to', e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-center"
        />
      </div>
    </div>
  );
}
