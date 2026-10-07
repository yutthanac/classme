'use client';
import { SlidingNumber } from '@/components/ui/sliding-number';
import { useEffect, useState } from 'react';
import { Clock as ClockIcon } from 'lucide-react';

export function Clock() {
  const [mounted, setMounted] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setHours(now.getHours());
      setMinutes(now.getMinutes());
      setSeconds(now.getSeconds());
    };
    updateTime();
    setMounted(true);
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-700 font-mono text-sm font-bold shadow-2xs">
        <ClockIcon className="w-3.5 h-3.5 text-pink-500 shrink-0" />
        <span>--:--:--</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-700 font-mono text-sm font-bold shadow-2xs">
      <ClockIcon className="w-3.5 h-3.5 text-pink-500 shrink-0" />
      <div className="flex items-center gap-0.5">
        <SlidingNumber value={hours} padStart={true} />
        <span className="text-slate-400">:</span>
        <SlidingNumber value={minutes} padStart={true} />
        <span className="text-slate-400">:</span>
        <SlidingNumber value={seconds} padStart={true} />
      </div>
    </div>
  );
}
