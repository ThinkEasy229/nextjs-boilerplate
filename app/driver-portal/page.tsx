'use client';

import { useState, useEffect, useCallback } from 'react';

type Shift = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMin: number;
  earnings: number;
  route: string;
};

type Status = 'idle' | 'active' | 'break';

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDurationSec(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  return formatDuration(Math.floor(seconds / 60));
}

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function now() {
  return new Date();
}

function todayLabel() {
  return now().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function timeLabel(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const RATE_PER_MIN = 0.25; // $15/hr

const SAMPLE_SHIFTS: Shift[] = [
  {
    id: '1',
    date: 'Aug 9, 2026',
    startTime: '8:00 AM',
    endTime: '2:30 PM',
    durationMin: 390,
    earnings: 97.5,
    route: 'Downtown Loop',
  },
  {
    id: '2',
    date: 'Aug 8, 2026',
    startTime: '10:00 AM',
    endTime: '4:00 PM',
    durationMin: 360,
    earnings: 90.0,
    route: 'Suburban North',
  },
  {
    id: '3',
    date: 'Aug 7, 2026',
    startTime: '9:00 AM',
    endTime: '3:00 PM',
    durationMin: 360,
    earnings: 90.0,
    route: 'Highway 45',
  },
];

const WAYPOINTS = ['Depot', 'Zone A', 'Zone B', 'Zone C', 'Zone D'];

export default function DriverPortalPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [shiftStart, setShiftStart] = useState<Date | null>(null);
  const [breakStart, setBreakStart] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0); // seconds active (excluding breaks)
  const [breakElapsed, setBreakElapsed] = useState(0); // seconds on break
  const [currentRoute] = useState('Downtown Loop');
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<Shift[]>([]);

  useEffect(() => {
    fetch('/api/driver-shifts')
      .then((r) => r.json() as Promise<{ success: boolean; data?: Shift[] }>)
      .then((json) => { if (json.success && json.data) setHistory(json.data); })
      .catch(() => setHistory(SAMPLE_SHIFTS));
  }, []);
  const [currentTime, setCurrentTime] = useState(now());

  // Clock tick
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Shift timer
  useEffect(() => {
    if (status !== 'active') return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  // Break timer
  useEffect(() => {
    if (status !== 'break') return;
    const id = setInterval(() => setBreakElapsed((b) => b + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  // Simulate route progress
  useEffect(() => {
    if (status !== 'active') return;
    const id = setInterval(() => setProgress((p) => Math.min(100, p + 0.1)), 3000);
    return () => clearInterval(id);
  }, [status]);

  const startShift = useCallback(() => {
    setShiftStart(now());
    setElapsed(0);
    setBreakElapsed(0);
    setProgress(0);
    setStatus('active');
  }, []);

  const endShift = useCallback(() => {
    setStatus('idle');
    setShiftStart(null);
    setBreakStart(null);
    setElapsed(0);
    setBreakElapsed(0);
    setProgress(0);
  }, []);

  const takeBreak = useCallback(() => {
    setBreakStart(now());
    setStatus('break');
  }, []);

  const resumeShift = useCallback(() => {
    setBreakStart(null);
    setStatus('active');
  }, []);

  const elapsedMin = Math.floor(elapsed / 60);
  const earnings = parseFloat((elapsedMin * RATE_PER_MIN).toFixed(2));
  const weeklyTotal = history.reduce((s, sh) => s + sh.earnings, 0);
  const estimatedPayout = parseFloat(((weeklyTotal + earnings) * 0.92).toFixed(2)); // 8% platform fee

  const waypointIndex = Math.min(Math.floor((progress / 100) * WAYPOINTS.length), WAYPOINTS.length - 1);

  const statusColors: Record<Status, string> = {
    idle: 'bg-slate-700 text-slate-300',
    active: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
    break: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  };
  const statusLabel: Record<Status, string> = {
    idle: 'Off Duty',
    active: 'On Shift',
    break: 'On Break',
  };

  return (
    <main className="min-h-screen pt-20 pb-16 px-4 bg-slate-950">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="bg-slate-900 border border-cyan-900/40 rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{todayLabel()}</p>
              <h1 className="text-2xl font-extrabold text-white">Driver Portal</h1>
              <p className="text-slate-400 text-sm mt-0.5">{timeLabel(currentTime)}</p>
            </div>
            <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${statusColors[status]}`}>
              {statusLabel[status]}
            </span>
          </div>
        </div>

        {/* Active Shift */}
        {status !== 'idle' && (
          <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-5">
            <p className="text-xs text-cyan-400 uppercase tracking-widest font-bold mb-3">Active Shift</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-800 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Started</p>
                <p className="text-white font-semibold text-sm">{shiftStart ? timeLabel(shiftStart) : '—'}</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Active Time</p>
                <p className="text-cyan-400 font-bold text-sm">{formatDuration(elapsedMin)}</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">Earned</p>
                <p className="text-green-400 font-bold text-sm">{formatCurrency(earnings)}</p>
              </div>
            </div>

            {/* Route Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400 font-semibold">{currentRoute}</p>
                <p className="text-xs text-cyan-400">{Math.round(progress)}%</p>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between">
                {WAYPOINTS.map((wp, i) => (
                  <div key={wp} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        i <= waypointIndex ? 'bg-cyan-400' : 'bg-slate-700'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500">{wp}</span>
                  </div>
                ))}
              </div>
            </div>

            {status === 'break' && breakStart && (
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg px-3 py-2 mb-4 text-amber-300 text-xs">
                On break since {timeLabel(breakStart)} — {formatDurationSec(breakElapsed)} elapsed
              </div>
            )}
          </div>
        )}

        {/* Shift Controls */}
        <div className="bg-slate-900 border border-cyan-900/40 rounded-2xl p-5">
          <p className="text-xs text-cyan-400 uppercase tracking-widest font-bold mb-3">Shift Controls</p>
          <div className="flex flex-wrap gap-3">
            {status === 'idle' && (
              <button
                onClick={startShift}
                className="flex-1 min-w-[140px] py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm uppercase tracking-widest shadow hover:from-cyan-400 hover:to-blue-500 transition min-h-[44px]"
              >
                Start Shift
              </button>
            )}
            {status === 'active' && (
              <>
                <button
                  onClick={takeBreak}
                  className="flex-1 min-w-[120px] py-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-sm uppercase tracking-widest hover:bg-amber-500/30 transition min-h-[44px]"
                >
                  Take Break
                </button>
                <button
                  onClick={endShift}
                  className="flex-1 min-w-[120px] py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-sm uppercase tracking-widest hover:bg-red-500/30 transition min-h-[44px]"
                >
                  End Shift
                </button>
              </>
            )}
            {status === 'break' && (
              <>
                <button
                  onClick={resumeShift}
                  className="flex-1 min-w-[120px] py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm uppercase tracking-widest hover:from-cyan-400 hover:to-blue-500 transition min-h-[44px]"
                >
                  Resume Shift
                </button>
                <button
                  onClick={endShift}
                  className="flex-1 min-w-[120px] py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-sm uppercase tracking-widest hover:bg-red-500/30 transition min-h-[44px]"
                >
                  End Shift
                </button>
              </>
            )}
          </div>
        </div>

        {/* Earnings Summary */}
        <div className="bg-slate-900 border border-cyan-900/40 rounded-2xl p-5">
          <p className="text-xs text-cyan-400 uppercase tracking-widest font-bold mb-3">Earnings Summary</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Today</p>
              <p className="text-green-400 font-bold">{formatCurrency(earnings)}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">This Week</p>
              <p className="text-white font-bold">{formatCurrency(weeklyTotal)}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-500 mb-1">Est. Payout</p>
              <p className="text-cyan-400 font-bold">{formatCurrency(estimatedPayout)}</p>
            </div>
          </div>
        </div>

        {/* Shift History */}
        <div className="bg-slate-900 border border-cyan-900/40 rounded-2xl p-5">
          <p className="text-xs text-cyan-400 uppercase tracking-widest font-bold mb-3">Shift History</p>
          <div className="space-y-2">
            {history.map((shift) => (
              <div
                key={shift.id}
                className="bg-slate-800 rounded-xl p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{shift.date}</p>
                  <p className="text-slate-500 text-xs">{shift.startTime} — {shift.endTime} · {shift.route}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-green-400 font-bold text-sm">{formatCurrency(shift.earnings)}</p>
                  <p className="text-slate-500 text-xs">{formatDuration(shift.durationMin)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
