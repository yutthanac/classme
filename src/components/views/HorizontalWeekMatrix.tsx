// @ts-nocheck
'use client';

import React, { useMemo } from 'react';
import {
  useEventCalendarNavigation,
  useEventCalendarOccurrences,
} from '@/components/ui/reui-event-calendar';
import { startOfWeek, addDays, isSameDay, format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Clock, MapPin, CheckCircle2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HorizontalWeekMatrixProps {
  onEventClick?: (event: any) => void;
  dayStartHour?: number;
  dayEndHour?: number;
}

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const DAYS_CONFIG = [
  { dayIndex: 0, label: 'จันทร์', shortLabel: 'จ.' },
  { dayIndex: 1, label: 'อังคาร', shortLabel: 'อ.' },
  { dayIndex: 2, label: 'พุธ', shortLabel: 'พ.' },
  { dayIndex: 3, label: 'พฤหัสบดี', shortLabel: 'พฤ.' },
  { dayIndex: 4, label: 'ศุกร์', shortLabel: 'ศ.' },
];

export default function HorizontalWeekMatrix({
  onEventClick,
  dayStartHour = 8,
  dayEndHour = 17,
}: HorizontalWeekMatrixProps) {
  const { date } = useEventCalendarNavigation();
  const occurrences = useEventCalendarOccurrences();

  // Monday to Friday of current week
  const weekDays = useMemo(() => {
    const monday = startOfWeek(date, { weekStartsOn: 1 });
    return DAYS_CONFIG.map((cfg) => {
      const d = addDays(monday, cfg.dayIndex);
      return {
        ...cfg,
        date: d,
        formatted: format(d, 'd MMM', { locale: th }),
        isToday: isSameDay(d, new Date()),
      };
    });
  }, [date]);

  const totalMinutes = (dayEndHour - dayStartHour) * 60; // 540 mins

  const getPositionPercent = (d: Date) => {
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const currentMins = (hours - dayStartHour) * 60 + minutes;
    const clamped = Math.max(0, Math.min(totalMinutes, currentMins));
    return (clamped / totalMinutes) * 100;
  };

  return (
    <div className="flex flex-col h-full w-full select-none p-2 space-y-3">
      {/* Matrix Header info */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">
            ตารางเรียนรายสัปดาห์ (จันทร์ - ศุกร์)
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
            แกนชั่วโมงแนวนอน
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          คลิกที่วิชาเพื่อเปิดหน้าเช็คชื่อทันที
        </span>
      </div>

      {/* Week Matrix Container */}
      <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-3 sm:p-4 overflow-x-auto">
        <div className="min-w-[780px]">
          {/* Top Hour Headers Row (ชั่วโมงอยู่ข้างบน) */}
          <div className="flex items-center border-b-2 border-slate-200 pb-2.5 mb-2.5">
            {/* Corner Cell for Days Column */}
            <div className="w-28 shrink-0 text-left pl-3 text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>วัน \ คาบเวลา</span>
            </div>

            {/* Hours Axis (8:00 - 17:00) */}
            <div className="flex-1 grid grid-cols-9 text-center text-xs font-bold text-slate-700">
              {HOURS.slice(0, 9).map((h) => {
                const isLunch = h === 12;
                return (
                  <div
                    key={h}
                    className={cn(
                      'border-l border-slate-200 px-1 py-0.5 first:border-none relative transition-colors',
                      isLunch && 'bg-amber-50/70 rounded-t-lg border-amber-200'
                    )}
                  >
                    <div
                      className={cn(
                        'font-mono font-extrabold text-xs',
                        isLunch ? 'text-amber-800' : 'text-slate-800'
                      )}
                    >
                      {String(h).padStart(2, '0')}:00
                    </div>
                    <div
                      className={cn(
                        'text-[10px] font-medium leading-tight',
                        isLunch ? 'text-amber-700 font-bold' : 'text-slate-400'
                      )}
                    >
                      {isLunch ? '☕ พักเที่ยง' : `ถึง ${String(h + 1).padStart(2, '0')}:00`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Days Rows (วันอยู่ฝั่งซ้าย) */}
          <div className="space-y-2.5">
            {weekDays.map((wDay) => {
              // Filter occurrences on this day
              const dayOccurrences = occurrences.filter((occ) => isSameDay(occ.start, wDay.date));
              const hasClasses = dayOccurrences.length > 0;

              return (
                <div
                  key={wDay.dayIndex}
                  className={cn(
                    'flex items-stretch rounded-xl border transition-all relative overflow-hidden',
                    wDay.isToday
                      ? 'border-pink-400 ring-2 ring-pink-400/30 shadow-sm bg-white'
                      : !hasClasses
                      ? 'bg-slate-100/60 border-slate-200 opacity-75 hover:opacity-95'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  )}
                >
                  {/* Left Column: Day Label with distinct Today badge */}
                  <div
                    className={cn(
                      'w-28 shrink-0 p-3 flex flex-col justify-center border-r select-none relative',
                      wDay.isToday
                        ? 'border-r-pink-200 bg-pink-50/60'
                        : !hasClasses
                        ? 'border-r-slate-200 bg-slate-100/80'
                        : 'border-r-slate-200 bg-slate-50/40'
                    )}
                  >
                    {/* Visual Today Left Accent Bar */}
                    {wDay.isToday && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-pink-500 rounded-r" />
                    )}

                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'text-xs font-black tracking-tight',
                          wDay.isToday
                            ? 'text-pink-700'
                            : !hasClasses
                            ? 'text-slate-500'
                            : 'text-slate-800'
                        )}
                      >
                        วัน{wDay.label}
                      </span>
                      {wDay.isToday && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-pink-500 text-white shadow-2xs">
                          วันนี้
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={cn(
                          'text-[10px] font-mono font-medium',
                          wDay.isToday ? 'text-pink-600/80 font-bold' : 'text-slate-400'
                        )}
                      >
                        {wDay.formatted}
                      </span>
                      {hasClasses && (
                        <span className="text-[9px] font-bold text-slate-500">
                          • {dayOccurrences.length} คาบ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Track: Hour grid + period guidelines + event pills */}
                  <div
                    className={cn(
                      'flex-1 relative h-16 overflow-hidden',
                      wDay.isToday
                        ? 'bg-pink-50/10'
                        : !hasClasses
                        ? 'bg-slate-100/30'
                        : 'bg-white'
                    )}
                  >
                    {/* Vertical Hour Guidelines / Period dividers */}
                    <div className="absolute inset-0 grid grid-cols-9 pointer-events-none">
                      {HOURS.slice(0, 9).map((h, i) => {
                        const isLunch = h === 12;
                        return (
                          <div
                            key={h}
                            className={cn(
                              'h-full border-r relative transition-colors',
                              // ชัดเจนทุกเส้นแบ่งคาบ
                              isLunch
                                ? 'bg-amber-100/25 border-r-amber-200/80'
                                : wDay.isToday
                                ? 'border-r-pink-100/90'
                                : 'border-r-slate-200/80',
                              // สลับสีอ่อนเพื่อให้อ่านง่าย
                              i % 2 === 1 && !isLunch && (
                                wDay.isToday ? 'bg-pink-50/20' : hasClasses ? 'bg-slate-50/50' : 'bg-slate-100/30'
                              )
                            )}
                          >
                            {/* Watermark label for lunch slot */}
                            {isLunch && (
                              <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-bold text-amber-900 select-none">
                                พักเที่ยง
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Events inside this day row */}
                    {!hasClasses ? (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-slate-400 tracking-wide select-none pointer-events-none z-10">
                        <span className="px-3 py-1 rounded-full bg-slate-200/70 border border-slate-300 text-slate-600 font-bold shadow-2xs">
                          ไม่มีคาบสอนในวันนี้
                        </span>
                      </div>
                    ) : (
                      dayOccurrences.map((occ) => {
                        const left = getPositionPercent(occ.start);
                        const right = getPositionPercent(occ.end);
                        const width = Math.max(9, right - left);
                        const isAttendance = occ.event.data?.type === 'attendance_session';

                        return (
                          <button
                            key={occ.key || occ.event.id}
                            type="button"
                            onClick={() => onEventClick?.(occ.event)}
                            className={cn(
                              'absolute top-1.5 bottom-1.5 rounded-xl px-2.5 text-left shadow-2xs transition-all hover:scale-[1.015] hover:shadow-md cursor-pointer flex flex-col justify-center border z-20 group',
                              isAttendance
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:border-emerald-500'
                                : 'bg-pink-50/95 text-pink-950 border-pink-300 hover:border-pink-500 ring-1 ring-pink-200/50'
                            )}
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                            }}
                            title={`${occ.event.title} (คลิกเพื่อเช็คชื่อ)`}
                          >
                            <div className="flex items-center gap-1.5 font-extrabold text-[11px] truncate">
                              {isAttendance ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <span
                                  className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white"
                                  style={{ backgroundColor: occ.event.color || '#ec4899' }}
                                />
                              )}
                              <span className="truncate group-hover:text-pink-600 transition-colors">
                                {occ.event.title}
                              </span>
                            </div>
                            <div className="text-[9.5px] text-slate-600 font-mono font-medium truncate flex items-center gap-1 mt-0.5">
                              <span className="font-semibold text-slate-700">
                                {format(occ.start, 'HH:mm')}-{format(occ.end, 'HH:mm')} น.
                              </span>
                              {occ.event.data?.room && (
                                <span className="text-slate-400 font-sans">• {occ.event.data.room}</span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
