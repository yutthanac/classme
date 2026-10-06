'use client';

import React, { useEffect, useState, useMemo } from 'react';

// 4x7 dot matrix font for digits 0-9 and colon
const DIGIT_PATTERNS: Record<string, number[][]> = {
  '0': [
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
  ],
  '1': [
    [0, 0, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 1, 0],
    [0, 0, 1, 0],
    [0, 0, 1, 0],
    [0, 0, 1, 0],
    [0, 1, 1, 1],
  ],
  '2': [
    [1, 1, 1, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [1, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 1, 1, 1],
  ],
  '3': [
    [1, 1, 1, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [1, 1, 1, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [1, 1, 1, 1],
  ],
  '4': [
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
  ],
  '5': [
    [1, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [1, 1, 1, 1],
  ],
  '6': [
    [1, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
  ],
  '7': [
    [1, 1, 1, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 0, 1, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
  ],
  '8': [
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
  ],
  '9': [
    [1, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [1, 1, 1, 1],
  ],
  ':': [
    [0],
    [1],
    [0],
    [0],
    [1],
    [0],
    [0],
  ],
};

interface FlipDiskClockProps {
  className?: string;
}

export default function FlipDiskClock({ className = '' }: FlipDiskClockProps) {
  const [time, setTime] = useState<{ hh: string; mm: string; ss: string }>({
    hh: '00',
    mm: '00',
    ss: '00',
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime({
        hh: String(now.getHours()).padStart(2, '0'),
        mm: String(now.getMinutes()).padStart(2, '0'),
        ss: String(now.getSeconds()).padStart(2, '0'),
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Characters to render: HH : MM : SS
  const chars = useMemo(() => {
    return [
      time.hh[0] || '0',
      time.hh[1] || '0',
      ':',
      time.mm[0] || '0',
      time.mm[1] || '0',
      ':',
      time.ss[0] || '0',
      time.ss[1] || '0',
    ];
  }, [time.hh, time.mm, time.ss]);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Electromechanical Chassis */}
      <div className="relative p-2 rounded-2xl bg-zinc-950/90 border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-md ring-1 ring-black/40">
        {/* Top subtle bar */}
        <div className="flex items-center justify-between text-[7px] font-black tracking-widest text-zinc-500 uppercase px-1 mb-1">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
            ELECTROMECHANICAL
          </span>
          <span className="text-zinc-400 font-mono text-[8px] font-semibold tracking-wider">LIVE</span>
        </div>

        {/* Matrix Grid Container */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-black/90 px-2 py-1.5 rounded-xl border border-zinc-900 shadow-inner">
          {chars.map((char, charIdx) => {
            const pattern = DIGIT_PATTERNS[char] || DIGIT_PATTERNS['0'];
            const cols = pattern[0].length;
            const rows = pattern.length;
            const isColon = char === ':';
            const isSeconds = charIdx >= 6;

            return (
              <div
                key={charIdx}
                className={`grid gap-[1.5px] sm:gap-[2px] ${isColon ? 'opacity-80 px-0.5' : ''} ${isSeconds ? 'opacity-90' : ''}`}
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                }}
              >
                {Array.from({ length: rows }).map((_, r) =>
                  Array.from({ length: cols }).map((_, c) => {
                    const isActive = pattern[r]?.[c] === 1;
                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`w-1.5 h-1.5 sm:w-[7px] sm:h-[7px] rounded-full transition-all duration-300 ${
                          isActive
                            ? 'bg-white shadow-[0_0_5px_rgba(255,255,255,0.9)] scale-100 ring-1 ring-zinc-200'
                            : 'bg-zinc-900/90 opacity-20 scale-90 border border-zinc-800/40'
                        }`}
                      />
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
