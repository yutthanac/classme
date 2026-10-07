// @ts-nocheck
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  useEventCalendarNavigation,
  useEventCalendarOccurrences,
  useEventCalendarSettings,
} from '@/components/ui/reui-event-calendar';
import { format, isSameDay } from 'date-fns';
import { th } from 'date-fns/locale';
import { Clock, MapPin, CheckCircle2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HorizontalDayTimelineProps {
  classroomName?: string;
  onEventClick?: (event: any) => void;
  dayStartHour?: number;
  dayEndHour?: number;
}

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

export default function HorizontalDayTimeline({
  classroomName,
  onEventClick,
  dayStartHour = 8,
  dayEndHour = 17,
}: HorizontalDayTimelineProps) {
  const { date } = useEventCalendarNavigation();
  const settings = useEventCalendarSettings();
  const occurrences = useEventCalendarOccurrences();

  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Filter events belonging to currently selected day
  const dayEvents = useMemo(() => {
    return occurrences.filter((occ) => isSameDay(occ.start, date));
  }, [occurrences, date]);

  const totalMinutes = (dayEndHour - dayStartHour) * 60; // 9 hours = 540 mins

  const getPositionPercent = (d: Date) => {
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const currentMins = (hours - dayStartHour) * 60 + minutes;
    const clamped = Math.max(0, Math.min(totalMinutes, currentMins));
    return (clamped / totalMinutes) * 100;
  };

  return (
    <div className="flex flex-col h-full w-full select-none p-2 space-y-4">
      {/* Date banner */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">
            {format(date, 'EEEEที่ d MMMM yyyy', { locale: th })}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
            {dayEvents.length} รายการวันนี้
          </span>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          แถบเวลาแนวนอน (08:00 - 17:00 น.)
        </span>
      </div>

      {/* Horizontal Timeline Container */}
      <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-4 overflow-x-auto">
        <div className="min-w-[760px] relative">
          {/* Hour Headers (Horizontal Axis) */}
          <div className="grid grid-cols-9 border-b-2 border-slate-200 pb-2 text-center text-xs font-bold text-slate-700">
            {HOURS.slice(0, 9).map((h) => {
              const isLunch = h === 12;
              return (
                <div
                  key={h}
                  className={cn(
                    'flex flex-col items-center py-0.5 relative',
                    isLunch && 'bg-amber-50/70 rounded-t-lg'
                  )}
                >
                  <span className={cn('font-mono font-extrabold', isLunch ? 'text-amber-800' : 'text-slate-800')}>
                    {String(h).padStart(2, '0')}:00
                  </span>
                  <span className={cn('text-[10px] font-medium', isLunch ? 'text-amber-700 font-bold' : 'text-slate-400')}>
                    {isLunch ? '☕ พักเที่ยง' : `- ${String(h + 1).padStart(2, '0')}:00`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Time Track Grid Background */}
          <div className="relative h-44 mt-3 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Vertical grid lines for each hour */}
            <div className="absolute inset-0 grid grid-cols-9 pointer-events-none">
              {HOURS.slice(0, 9).map((h, i) => {
                const isLunch = h === 12;
                return (
                  <div
                    key={h}
                    className={cn(
                      'h-full border-r relative',
                      isLunch
                        ? 'bg-amber-100/25 border-r-amber-200/80'
                        : 'border-r-slate-200/80',
                      i % 2 === 1 && !isLunch && 'bg-slate-50/40'
                    )}
                  >
                    {isLunch && (
                      <div className="h-full flex items-center justify-center opacity-25 text-xs font-bold text-amber-900 select-none">
                        พักเที่ยง
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Events Laid Out Horizontally Along Time Track */}
            {dayEvents.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xs">
                <BookOpen className="w-5 h-5 mb-1 text-slate-300" />
                <span>ไม่มีคาบเรียนหรือกิจกรรมในวันนี้</span>
              </div>
            ) : (
              <>
                {/* Real-time Indicator Line (If date is today) */}
                {isSameDay(date, new Date()) && (() => {
                  const currentHours = now.getHours();
                  const currentMinutes = now.getMinutes();
                  const currentTotalMins = (currentHours - dayStartHour) * 60 + currentMinutes;
                  
                  const isPastSchedule = currentHours >= dayEndHour || currentHours < dayStartHour;
                  const currentPercent = isPastSchedule
                    ? 100
                    : Math.max(0, Math.min(100, (currentTotalMins / totalMinutes) * 100));

                  return (
                    <div
                      className="absolute top-0 bottom-0 z-30 pointer-events-none flex flex-col items-center transition-all duration-300"
                      style={{ left: `${currentPercent}%` }}
                    >
                      <div className={cn(
                        "absolute -top-0.5 transform -translate-x-1/2 text-white text-[9px] font-mono font-black px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap",
                        isPastSchedule ? "bg-slate-700" : "bg-rose-600 animate-pulse"
                      )}>
                        {format(now, 'HH:mm')} น.{isPastSchedule ? ' (หมดคาบ)' : ''}
                      </div>
                      <div className={cn(
                        "w-[2px] h-full shadow-sm",
                        isPastSchedule ? "bg-slate-400 border-l border-dashed border-slate-600" : "bg-rose-500"
                      )} />
                    </div>
                  );
                })()}

                <div className="absolute inset-0 p-3">
                {dayEvents.map((occ, idx) => {
                  const left = getPositionPercent(occ.start);
                  const right = getPositionPercent(occ.end);
                  const width = Math.max(8, right - left);
                  const isAttendance = occ.event.data?.type === 'attendance_session';

                  // Stagger top position if multiple overlapping events
                  const topOffset = (idx % 2) * 56 + 8;

                  return (
                    <button
                      key={occ.key || occ.event.id}
                      type="button"
                      onClick={() => onEventClick?.(occ.event)}
                      className={cn(
                        'absolute h-12 rounded-xl px-2.5 py-1 text-left shadow-xs transition-all hover:scale-[1.01] hover:shadow-md cursor-pointer flex flex-col justify-center border z-10',
                        isAttendance
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : 'bg-pink-50/90 text-pink-900 border-pink-200 hover:border-pink-400'
                      )}
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        top: `${topOffset}px`,
                      }}
                      title={occ.event.title}
                    >
                      <div className="flex items-center gap-1 font-bold text-xs truncate">
                        {isAttendance ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        ) : (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor: occ.event.color || '#ec4899',
                            }}
                          />
                        )}
                        <span className="truncate">{occ.event.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                        <Clock className="w-2.5 h-2.5" />
                        <span>
                          {format(occ.start, 'HH:mm')} - {format(occ.end, 'HH:mm')}
                        </span>
                        {(() => {
                          const roomLabel = occ.event.data?.room || (classroomName ? `ห้อง ${classroomName}` : null);
                          return roomLabel ? (
                            <span className="ml-1 text-slate-500 font-sans font-medium">
                              • {roomLabel}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
          </div>
        </div>
      </div>

      {/* Cards list of today's schedule items */}
      <div className="space-y-2 pt-1">
        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 px-1">
          <Clock className="w-3.5 h-3.5 text-pink-600" />
          <span>รายละเอียดตารางสอนประจำวันนี้ ({dayEvents.length} คาบ)</span>
        </h4>

        {dayEvents.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-400">
            ไม่มีตารางสอนในวันที่เลือก
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dayEvents.map((occ) => {
              const isAttendance = occ.event.data?.type === 'attendance_session';
              return (
                <div
                  key={occ.key || occ.event.id}
                  onClick={() => onEventClick?.(occ.event)}
                  className="p-3.5 rounded-2xl border border-slate-100 hover:border-pink-300 bg-white hover:bg-pink-50/20 transition-all shadow-2xs space-y-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[10px] font-bold',
                        isAttendance
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-pink-100 text-pink-700'
                      )}
                    >
                      {isAttendance ? 'เช็คชื่อแล้ว' : 'คาบเรียน'}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-600">
                      {format(occ.start, 'HH:mm')} - {format(occ.end, 'HH:mm')} น.
                    </span>
                  </div>

                  <div className="font-bold text-slate-900 text-xs truncate">
                    {occ.event.title}
                  </div>

                  {occ.event.data?.room && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{occ.event.data.room}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
