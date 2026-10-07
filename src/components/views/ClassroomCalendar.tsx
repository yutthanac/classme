'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  EventCalendar,
  type EventCalendarApi,
} from '@/components/ui/reui-event-calendar';
import { EventCalendarContent } from '@/components/ui/reui-event-calendar-utils/event-calendar-content';
import {
  EventCalendarNav,
  EventCalendarToolbar,
} from '@/components/ui/reui-event-calendar-utils/event-calendar-nav';
import type {
  CalendarEvent,
  CalendarView,
  EventCalendarOccurrence,
} from '@/components/ui/reui-event-calendar-utils/event-calendar-types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/reui-event-calendar-utils/card';
import {
  Calendar as CalendarIcon,
  Clock,
  BookOpen,
  MapPin,
  CheckCircle2,
  Users,
  ExternalLink,
  ChevronRight,
  Layers,
  Timer,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  addDays,
  setHours,
  setMinutes,
  parseISO,
} from 'date-fns';
import { th } from 'date-fns/locale';

import HorizontalWeekMatrix from './HorizontalWeekMatrix';
import HorizontalDayTimeline from './HorizontalDayTimeline';

interface ClassroomCalendarProps {
  classroomName: string;
  schedules?: any[];
  attendanceSessions?: any[];
  studentsCount?: number;
  onGoToAttendance?: (subjectId?: string | number, date?: string, period?: string) => void;
  onGoToStudents?: () => void;
}

const THAI_DAY_NAME = ['', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

export default function ClassroomCalendar({
  classroomName,
  schedules = [],
  attendanceSessions = [],
  studentsCount = 0,
  onGoToAttendance,
  onGoToStudents,
}: ClassroomCalendarProps) {
  const apiRef = useRef<EventCalendarApi | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [view, setView] = useState<CalendarView>('week');

  // Trigger attendance check for a clicked schedule/event
  const handleDirectAttendanceCheck = (ev: any) => {
    setSelectedEvent(ev);
    const subjId = ev?.data?.subject?.id || ev?.data?.session?.subject?.id || ev?.data?.session?.subject_id;
    const dateStr = ev?.start ? format(ev.start, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
    const periodStr = ev?.data?.startTime && ev?.data?.endTime
      ? `คาบ (${ev.data.startTime} - ${ev.data.endTime})`
      : undefined;
    if (onGoToAttendance) {
      onGoToAttendance(subjId, dateStr, periodStr);
    }
  };

  // Custom Week View: Hours on top, Days on left
  const CustomWeekView = () => (
    <HorizontalWeekMatrix
      classroomName={classroomName}
      onEventClick={handleDirectAttendanceCheck}
      dayStartHour={8}
      dayEndHour={17}
    />
  );

  // Custom Day View: Horizontal 08:00 - 17:00 timeline
  const CustomDayView = () => (
    <HorizontalDayTimeline
      classroomName={classroomName}
      onEventClick={handleDirectAttendanceCheck}
      dayStartHour={8}
      dayEndHour={17}
    />
  );

  // Build Calendar Events
  const events = useMemo(() => {
    const list: CalendarEvent[] = [];
    const now = new Date();
    const monday = startOfWeek(now, { weekStartsOn: 1 });

    const weekOffsets = [-2, -1, 0, 1, 2, 3];

    schedules.forEach((sc) => {
      const dayOffset = sc.day_of_week >= 1 && sc.day_of_week <= 7 ? sc.day_of_week - 1 : 0;
      const startParts = (sc.start_time || '08:30').split(':').map(Number);
      const endParts = (sc.end_time || '10:10').split(':').map(Number);

      weekOffsets.forEach((wOffset) => {
        const targetDay = addDays(monday, wOffset * 7 + dayOffset);
        const start = setMinutes(setHours(targetDay, startParts[0] || 8), startParts[1] || 30);
        const end = setMinutes(setHours(targetDay, endParts[0] || 10), endParts[1] || 10);

        const startStr = sc.start_time || '08:30';
        const endStr = sc.end_time || '10:10';
        const roomName = sc.room_number || (classroomName ? `ห้อง ${classroomName}` : 'ห้องเรียน');

        list.push({
          id: `schedule-${sc.id}-w${wOffset}`,
          title: `${sc.subject?.code || ''} ${sc.subject?.name || 'คาบเรียน'} [${roomName}]`,
          start,
          end,
          color: sc.subject?.color || '#ec4899',
          data: {
            type: 'schedule',
            subject: sc.subject,
            room: roomName,
            classroom: sc.classroom || classroomName,
            startTime: startStr,
            endTime: endStr,
            dayOfWeek: sc.day_of_week,
          },
        });
      });
    });

    // Attendance records
    attendanceSessions.forEach((sess) => {
      if (!sess.date) return;
      try {
        const sessDate = parseISO(sess.date);
        const start = setHours(sessDate, 9);
        const end = setHours(sessDate, 10);

        list.push({
          id: `session-${sess.id}`,
          title: `✓ เช็คชื่อ ${sess.subject?.code || ''} (${sess.present_count}/${sess.total_students || studentsCount})`,
          start,
          end,
          color: '#10b981',
          data: {
            type: 'attendance_session',
            session: sess,
          },
        });
      } catch {
        // ignore date error
      }
    });

    return list;
  }, [schedules, attendanceSessions, studentsCount]);

  // Calculate Today's Stats (จำนวนคาบ & จำนวนชั่วโมงทั้งหมด)
  const todayStats = useMemo(() => {
    // Current weekday: 1 = Mon ... 7 = Sun
    const jsDay = new Date().getDay();
    const todayDayOfWeek = jsDay === 0 ? 7 : jsDay;

    const todaySchedules = schedules.filter((sc) => sc.day_of_week === todayDayOfWeek);
    const periodsCount = todaySchedules.length;

    let totalMinutes = 0;
    todaySchedules.forEach((sc) => {
      const s = (sc.start_time || '08:30').split(':').map(Number);
      const e = (sc.end_time || '10:10').split(':').map(Number);
      const startMin = (s[0] || 0) * 60 + (s[1] || 0);
      const endMin = (e[0] || 0) * 60 + (e[1] || 0);
      if (endMin > startMin) {
        totalMinutes += endMin - startMin;
      } else {
        totalMinutes += 100; // default 1h 40m
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const hoursFormatted = mins > 0 ? `${hours} ชม. ${mins} นาที` : `${hours} ชั่วโมง`;

    return {
      todayDayOfWeek,
      periodsCount,
      totalMinutes,
      hoursFormatted,
      todaySchedules,
    };
  }, [schedules]);

  const handleEventClick = (occ: EventCalendarOccurrence) => {
    handleDirectAttendanceCheck(occ.event);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-5 w-full items-start">
      {/* ฝั่งซ้าย: ตารางปฏิทินรายสัปดาห์ (Default: Week View, แนวนอน) */}
      <div className="flex-1 min-w-0 w-full bg-white rounded-3xl border border-pink-100 shadow-xs overflow-hidden p-4 sm:p-5">
        <EventCalendar
          events={events}
          defaultView="week"
          views={['week', 'day', 'month', 'agenda']}
          onViewChange={setView}
          apiRef={apiRef}
          onEventClick={handleEventClick}
          weekStartsOn={1}
          dayStartHour={8}
          dayEndHour={17}
          interval={60}
          interactions={{
            drag: false,
            resize: false,
            selectSlot: false,
          }}
          className="min-h-[580px] h-[640px] w-full"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <EventCalendarNav className="min-w-0 flex-1" />
            <EventCalendarToolbar className="shrink-0 flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200 hidden sm:inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                ห้อง {classroomName}
              </span>
            </EventCalendarToolbar>
          </div>

          <div className="pt-2 flex-1 min-h-0 overflow-y-auto">
            <EventCalendarContent
              components={{
                week: CustomWeekView,
                day: CustomDayView,
              }}
            />
          </div>
        </EventCalendar>
      </div>

      {/* ฝั่งขวา: สรุปคาบสอนและชั่วโมงวันนี้ (Today Summary Card) */}
      <div className="w-full xl:w-80 shrink-0 flex flex-col gap-4">
        {/* กล่องสรุปวันนี้: มีสอนกี่คาบ รวมกี่ชั่วโมง */}
        <Card className="border-pink-200 bg-linear-to-b from-pink-50/70 via-rose-50/30 to-white shadow-xs">
          <CardHeader className="pb-3 border-b border-pink-100/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-700 bg-pink-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Timer className="w-3 h-3" />
                สรุปการสอนวันนี้
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                วัน{THAI_DAY_NAME[todayStats.todayDayOfWeek] || 'นี้'}
              </span>
            </div>
            <CardTitle className="text-sm font-black text-slate-900 mt-2">
              {format(new Date(), 'd MMMM yyyy', { locale: th })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs pt-4">
            {/* สถิติ 2 ช่อง: คาบเรียน & ชั่วโมงสอน */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-2xl border border-pink-100 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold block">
                  จำนวนคาบสอน
                </span>
                <div className="text-2xl font-black text-pink-600 mt-0.5">
                  {todayStats.periodsCount}
                  <span className="text-xs font-bold text-slate-500 ml-1">คาบ</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-pink-100 shadow-2xs">
                <span className="text-[10px] text-slate-400 font-semibold block">
                  เวลารวมทั้งหมด
                </span>
                <div className="text-sm font-black text-slate-800 mt-1.5 truncate">
                  {todayStats.hoursFormatted}
                </div>
              </div>
            </div>

            {/* รายการคาบสอนวันนี้ */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-pink-500" />
                <span>คาบสอนประจำวันนี้ ({todayStats.periodsCount})</span>
              </div>

              {todayStats.todaySchedules.length === 0 ? (
                <div className="p-3 bg-slate-50 rounded-xl text-center text-slate-400 text-[11px]">
                  วันนี้ไม่มีคาบเรียน
                </div>
              ) : (
                <div className="space-y-2">
                  {todayStats.todaySchedules.map((sc) => (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => handleDirectAttendanceCheck({
                        start: new Date(),
                        data: {
                          subject: sc.subject,
                          room: sc.room_number,
                          startTime: sc.start_time,
                          endTime: sc.end_time,
                        },
                      })}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-pink-300 bg-white hover:bg-pink-50/20 transition-all shadow-2xs space-y-1 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-extrabold text-slate-900 group-hover:text-pink-600 transition-colors">
                          {sc.subject?.code} {sc.subject?.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {sc.start_time}-{sc.end_time}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{sc.room_number || 'ห้องเรียน'}</span>
                        <span className="text-pink-600 font-bold group-hover:underline flex items-center gap-0.5">
                          เช็คชื่อ <ChevronRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Button */}
            {onGoToAttendance && (
              <button
                type="button"
                onClick={() => onGoToAttendance()}
                className="w-full py-2.5 px-3 bg-linear-to-r from-pink-600 to-rose-500 text-white rounded-xl text-xs font-bold hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shadow-pink-200 mt-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>เปิดหน้าเช็คชื่อห้องนี้</span>
              </button>
            )}
          </CardContent>
        </Card>

        {/* ข้อมูลคาบสอนทั้งหมดในสัปดาห์ */}
        <Card className="border-slate-100 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-pink-600" />
                <CardTitle className="text-xs font-bold text-slate-900">
                  ตารางสอนทั้งสัปดาห์ ({schedules.length} คาบ)
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {schedules.length === 0 ? (
              <p className="text-slate-400 text-[11px] py-3 text-center">
                ยังไม่มีตารางสอนสำหรับห้องนี้
              </p>
            ) : (
              schedules.map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => handleDirectAttendanceCheck({
                    start: new Date(),
                    data: {
                      subject: sc.subject,
                      room: sc.room_number,
                      startTime: sc.start_time,
                      endTime: sc.end_time,
                    },
                  })}
                  className="p-2.5 rounded-xl border border-slate-100 hover:border-pink-200 bg-slate-50/50 hover:bg-pink-50/20 transition-all space-y-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-pink-100 text-pink-700">
                      วัน{THAI_DAY_NAME[sc.day_of_week] || 'เรียน'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {sc.start_time} - {sc.end_time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span className="font-bold text-slate-800 truncate">
                      {sc.subject?.code} {sc.subject?.name}
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-500 font-medium">
                      {sc.room_number || `ห้อง ${classroomName}`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
