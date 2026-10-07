// @ts-nocheck
'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  X,
  BookOpen,
  MapPin,
  User,
  Users,
  GraduationCap,
  Edit2,
  ShieldCheck,
  CheckCircle2,
  Move,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Save,
  Coffee,
  Undo2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Select } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ScheduleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  isAdmin: boolean;
  classrooms: any[];
  subjects: any[];
  teachers: any[];
  activeClassroom?: string;
  onSaved: () => void;
}

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const DAYS_CONFIG = [
  { dayIndex: 0, dayOfWeek: 1, label: 'วันจันทร์', shortLabel: 'จันทร์', color: 'border-amber-300 bg-amber-50/50 text-amber-900' },
  { dayIndex: 1, dayOfWeek: 2, label: 'วันอังคาร', shortLabel: 'อังคาร', color: 'border-pink-300 bg-pink-50/50 text-pink-900' },
  { dayIndex: 2, dayOfWeek: 3, label: 'วันพุธ', shortLabel: 'พุธ', color: 'border-emerald-300 bg-emerald-50/50 text-emerald-900' },
  { dayIndex: 3, dayOfWeek: 4, label: 'วันพฤหัสบดี', shortLabel: 'พฤหัส', color: 'border-orange-300 bg-orange-50/50 text-orange-900' },
  { dayIndex: 4, dayOfWeek: 5, label: 'วันศุกร์', shortLabel: 'ศุกร์', color: 'border-sky-300 bg-sky-50/50 text-sky-900' },
];

const START_MIN = 8 * 60; // 480 (08:00)
const END_MIN = 17 * 60; // 1020 (17:00)
const TOTAL_MIN = END_MIN - START_MIN; // 540

// Lunch Break config (12:00 - 13:00)
const LUNCH_START_MIN = 12 * 60; // 720
const LUNCH_END_MIN = 13 * 60; // 780
const LUNCH_LEFT_PCT = ((LUNCH_START_MIN - START_MIN) / TOTAL_MIN) * 100;
const LUNCH_WIDTH_PCT = ((LUNCH_END_MIN - LUNCH_START_MIN) / TOTAL_MIN) * 100;

function normalizeName(name?: string | null): string {
  if (!name) return '';
  return name
    .replace(/^(อาจารย์|อ\.|ครู|นาย|นางสาว|นาง|ดร\.|ผศ\.|รศ\.)\s*/i, '')
    .trim()
    .toLowerCase();
}

function isSamePerson(name1?: string | null, name2?: string | null): boolean {
  if (!name1 || !name2) return false;
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  if (!n1 || !n2) return false;
  return n1 === n2 || n1.includes(n2) || n2.includes(n1);
}

function timeToMinutes(t: string): number {
  if (!t) return START_MIN;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default function ScheduleManagementModal({
  isOpen,
  onClose,
  currentUser,
  isAdmin,
  classrooms,
  subjects,
  teachers,
  activeClassroom = '',
  onSaved,
}: ScheduleManagementModalProps) {
  const [localSchedules, setLocalSchedules] = useState<any[]>([]);
  const [initialSchedules, setInitialSchedules] = useState<any[]>([]);
  const [deletedScheduleIds, setDeletedScheduleIds] = useState<(number | string)[]>([]);

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Active interaction indicator
  const [activeInteractingId, setActiveInteractingId] = useState<string | number | null>(null);

  // Quick edit room/location modal state
  const [editingRoomSchedule, setEditingRoomSchedule] = useState<any | null>(null);
  const [roomInputVal, setRoomInputVal] = useState<string>('');


  // Selected Teacher for Admin
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    isAdmin && teachers.length > 0 ? String(teachers[0].id) : ''
  );

  // Active / Editable Context Classroom
  const [currentClassroom, setCurrentClassroom] = useState<string>(
    activeClassroom || classrooms[0]?.name || ''
  );

  useEffect(() => {
    if (activeClassroom) {
      setCurrentClassroom(activeClassroom);
    } else if (classrooms.length > 0 && !currentClassroom) {
      setCurrentClassroom(classrooms[0].name);
    }
  }, [activeClassroom, classrooms]);

  // Effective teacher
  const effectiveTeacher = useMemo(() => {
    if (isAdmin && selectedTeacherId) {
      return teachers.find((t) => String(t.id) === String(selectedTeacherId)) || currentUser;
    }
    return currentUser;
  }, [isAdmin, selectedTeacherId, teachers, currentUser]);

  const effectiveTeacherFullName = useMemo(() => {
    if (!effectiveTeacher) return 'ครูผู้สอน';
    return `${effectiveTeacher.prefix ? `${effectiveTeacher.prefix} ` : ''}${effectiveTeacher.name || ''}`.trim();
  }, [effectiveTeacher]);

  // Available subjects for drag-drop
  const teacherSubjects = useMemo(() => {
    const list = subjects.filter((s) => {
      if (isAdmin && !selectedTeacherId) return true;
      if (effectiveTeacher?.id && s.user_id === effectiveTeacher.id) return true;
      if (s.teachers && s.teachers.some((t: any) => t.id === effectiveTeacher?.id)) return true;
      return isSamePerson(s.teacher_name, effectiveTeacher?.name);
    });
    return list.length > 0 ? list : subjects;
  }, [subjects, effectiveTeacher, isAdmin, selectedTeacherId]);

  // Ref to store calendar tracks container for absolute coordinate math
  const calendarContainerRef = useRef<HTMLDivElement | null>(null);
  const draggedSidebarSubjectRef = useRef<any | null>(null);

  const loadSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getSchedules();
      if (res.data) {
        setLocalSchedules(res.data);
        setInitialSchedules(res.data);
        setDeletedScheduleIds([]);
        setHasChanges(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadSchedules();
    }
  }, [isOpen, selectedTeacherId, loadSchedules]);

  // Filter schedules strictly for this teacher
  const teacherSchedules = useMemo(() => {
    return localSchedules.filter((sc) => {
      if (effectiveTeacher?.id && sc.subject?.user_id === effectiveTeacher.id) return true;
      return isSamePerson(sc.subject?.teacher_name, effectiveTeacher?.name);
    });
  }, [localSchedules, effectiveTeacher]);

  // Calculate position coordinates
  const getPositionPercent = useCallback((startTime: string, endTime: string) => {
    const s = Math.max(START_MIN, Math.min(END_MIN, timeToMinutes(startTime)));
    const e = Math.max(START_MIN, Math.min(END_MIN, timeToMinutes(endTime)));
    const left = ((s - START_MIN) / TOTAL_MIN) * 100;
    const width = Math.max(4, ((e - s) / TOTAL_MIN) * 100);
    return { left, width };
  }, []);

  // Helper: Find which day row is under a client Y coordinate
  const getDayFromClientY = useCallback((clientY: number, fallbackDay: number) => {
    if (!calendarContainerRef.current) return fallbackDay;
    const dayRows = calendarContainerRef.current.querySelectorAll('.day-row-element');
    for (const row of Array.from(dayRows)) {
      const rect = row.getBoundingClientRect();
      // Allow a buffer on Y before escaping to another day
      if (clientY >= rect.top && clientY <= rect.bottom) {
        const dayVal = Number(row.getAttribute('data-day'));
        if (dayVal) return dayVal;
      }
    }
    return fallbackDay;
  }, []);

  // -------------------------------------------------------------
  // 1. FAST REAL-TIME MOVE DRAG (Mouse pointer based, snaps to 5 mins, stays in day unless Y escapes)
  // -------------------------------------------------------------
  const handleBlockMouseDown = (sc: any, initialDayOfWeek: number, e: React.MouseEvent) => {
    // Only left click
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const trackElement = (e.currentTarget as HTMLElement).closest('.day-track-container');
    if (!trackElement) return;

    const trackRect = trackElement.getBoundingClientRect();
    const trackWidth = trackRect.width;

    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;
    const initialStartMin = timeToMinutes(sc.start_time);
    const initialEndMin = timeToMinutes(sc.end_time);
    const duration = initialEndMin - initialStartMin;

    setActiveInteractingId(sc.id);

    let hasMoved = false;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - initialMouseX;
      const deltaY = moveEvent.clientY - initialMouseY;

      if (!hasMoved && Math.hypot(deltaX, deltaY) > 3) {
        hasMoved = true;
      }
      if (!hasMoved) return;

      // Calculate time delta snapped to 5 minutes
      const deltaMinsRaw = (deltaX / trackWidth) * TOTAL_MIN;
      const deltaMins = Math.round(deltaMinsRaw / 5) * 5;

      const newStartMin = Math.max(START_MIN, Math.min(END_MIN - duration, initialStartMin + deltaMins));
      const newEndMin = newStartMin + duration;

      const newStartTime = minutesToTime(newStartMin);
      const newEndTime = minutesToTime(newEndMin);

      // Vertical Day Detection:
      // Stay on initial day unless Y escapes vertical bounds of the row by > 18px
      const currentTrackRect = trackElement.getBoundingClientRect();
      const isEscapedY = moveEvent.clientY < currentTrackRect.top - 18 || moveEvent.clientY > currentTrackRect.bottom + 18;
      
      const targetDay = isEscapedY
        ? getDayFromClientY(moveEvent.clientY, initialDayOfWeek)
        : initialDayOfWeek;

      setLocalSchedules((prev) =>
        prev.map((item) =>
          String(item.id) === String(sc.id)
            ? {
                ...item,
                day_of_week: targetDay,
                start_time: newStartTime,
                end_time: newEndTime,
                isModified: true,
              }
            : item
        )
      );
      setHasChanges(true);
    };

    const onMouseUp = () => {
      setActiveInteractingId(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // -------------------------------------------------------------
  // 2. RESIZE HANDLER (Left/Right edge drag, snaps to 5 mins)
  // -------------------------------------------------------------
  const handleResizeStart = (
    sc: any,
    edge: 'start' | 'end',
    dayOfWeek: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const trackElement = (e.currentTarget as HTMLElement).closest('.day-track-container');
    if (!trackElement) return;

    const trackWidth = trackElement.getBoundingClientRect().width;
    const initialMouseX = e.clientX;
    const initialStartMin = timeToMinutes(sc.start_time);
    const initialEndMin = timeToMinutes(sc.end_time);

    setActiveInteractingId(sc.id);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - initialMouseX;
      const deltaMinsRaw = (deltaX / trackWidth) * TOTAL_MIN;
      const deltaMins = Math.round(deltaMinsRaw / 5) * 5;

      if (edge === 'end') {
        const newEndMin = Math.max(initialStartMin + 15, Math.min(END_MIN, initialEndMin + deltaMins));
        const newEndTime = minutesToTime(newEndMin);

        setLocalSchedules((prev) =>
          prev.map((item) =>
            String(item.id) === String(sc.id)
              ? { ...item, end_time: newEndTime, isModified: true }
              : item
          )
        );
      } else if (edge === 'start') {
        const newStartMin = Math.max(START_MIN, Math.min(initialEndMin - 15, initialStartMin + deltaMins));
        const newStartTime = minutesToTime(newStartMin);

        setLocalSchedules((prev) =>
          prev.map((item) =>
            String(item.id) === String(sc.id)
              ? { ...item, start_time: newStartTime, isModified: true }
              : item
          )
        );
      }
      setHasChanges(true);
    };

    const onMouseUp = () => {
      setActiveInteractingId(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // -------------------------------------------------------------
  // 3. PLACE SUBJECT FROM SIDEBAR (HTML5 Drag and drop)
  // -------------------------------------------------------------
  const handleDropOnDay = (dayOfWeek: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const subjData = e.dataTransfer.getData('application/json');
    let subject = draggedSidebarSubjectRef.current;
    if (!subject && subjData) {
      try {
        subject = JSON.parse(subjData);
      } catch {}
    }
    if (!subject) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, mouseX / rect.width));
    const rawMins = START_MIN + pct * TOTAL_MIN;

    const snappedStart = Math.floor(rawMins / 5) * 5;
    const snappedEnd = Math.min(END_MIN, snappedStart + 100);

    const startTime = minutesToTime(snappedStart);
    const endTime = minutesToTime(snappedEnd);

    const newSchedule = {
      id: `new_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isNew: true,
      subject_id: Number(subject.id),
      subject,
      classroom: currentClassroom || classrooms[0]?.name || '',
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      room_number: `ห้อง ${currentClassroom || classrooms[0]?.name || ''}`,
    };

    setLocalSchedules((prev) => [...prev, newSchedule]);
    setHasChanges(true);
    draggedSidebarSubjectRef.current = null;
  };

  // -------------------------------------------------------------
  // 4. DELETE / REVERT / BATCH SAVE
  // -------------------------------------------------------------
  const handleDeleteSchedule = (id: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('ต้องการลบคาบสอนนี้ออกจากตารางใช่หรือไม่?')) return;

    setLocalSchedules((prev) => prev.filter((item) => String(item.id) !== String(id)));
    if (!String(id).startsWith('new_')) {
      setDeletedScheduleIds((prev) => [...prev, id]);
    }
    setHasChanges(true);
  };

  const handleUpdateScheduleClassroom = (scheduleId: number | string, newRoom: string) => {
    setLocalSchedules((prev) =>
      prev.map((item) => {
        if (String(item.id) === String(scheduleId)) {
          return {
            ...item,
            classroom: newRoom,
            room_number: item.room_number || `ห้อง ${newRoom}`,
            isModified: true,
          };
        }
        return item;
      })
    );
    setHasChanges(true);
  };

  const handleUpdateScheduleRoomNumber = (scheduleId: number | string, newLocation: string) => {
    setLocalSchedules((prev) =>
      prev.map((item) => {
        if (String(item.id) === String(scheduleId)) {
          return {
            ...item,
            room_number: newLocation,
            isModified: true,
          };
        }
        return item;
      })
    );
    setHasChanges(true);
  };

  const handleRevertChanges = () => {
    if (!confirm('ต้องการยกเลิกการแก้ไขทั้งหมดและคืนค่าเดิมใช่หรือไม่?')) return;
    setLocalSchedules(initialSchedules);
    setDeletedScheduleIds([]);
    setHasChanges(false);
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);

      for (const delId of deletedScheduleIds) {
        await api.deleteSchedule(delId).catch(() => {});
      }

      for (const sc of localSchedules) {
        if (sc.isNew) {
          await api.createSchedule({
            subject_id: Number(sc.subject_id),
            classroom: sc.classroom,
            day_of_week: sc.day_of_week,
            start_time: sc.start_time,
            end_time: sc.end_time,
            room_number: sc.room_number || `ห้อง ${sc.classroom}`,
          });
        } else if (sc.isModified) {
          await api.updateSchedule(sc.id, {
            day_of_week: sc.day_of_week,
            start_time: sc.start_time,
            end_time: sc.end_time,
            classroom: sc.classroom,
            room_number: sc.room_number || `ห้อง ${sc.classroom}`,
          });
        }
      }

      await loadSchedules();
      onSaved();
      alert('บันทึกตารางสอนเรียบร้อยแล้ว!');
    } catch (err: any) {
      alert('บันทึกตารางสอนไม่สำเร็จ: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col z-50 animate-in fade-in duration-150">
      <div className="w-full h-full flex flex-col bg-slate-50 overflow-hidden select-none">
        
        {/* Top Header Navigation */}
        <header className="h-16 bg-white border-b border-pink-100 px-6 flex items-center justify-between shrink-0 shadow-xs z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center font-bold shadow-sm shadow-pink-200">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  ระบบจัดตารางสอนปฏิทิน
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">
                  {isAdmin ? 'สิทธิ์ผู้ดูแลระบบ' : 'ตารางสอนส่วนตัว'}
                </span>
                
                {/* Editable Active Classroom Selector in Header */}
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/90 px-2 py-0.5 rounded-full shadow-2xs">
                  <span className="text-[11px] font-black">ห้อง:</span>
                  <select
                    value={currentClassroom}
                    onChange={(e) => setCurrentClassroom(e.target.value)}
                    className="bg-transparent text-[11px] font-black text-emerald-900 border-none outline-none cursor-pointer pr-1 py-0"
                    title="เปลี่ยนห้องที่กำลังจัดตารางสอน (วิชาที่ลากลงใหม่จะเป็นห้องนี้)"
                  >
                    {classrooms.map((c) => (
                      <option key={c.id || c.name} value={c.name} className="text-slate-800 bg-white font-medium">
                        {c.name} {c.level ? `(${c.level})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {hasChanges && (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md animate-pulse">
                    มีการแก้ไขที่ยังไม่บันทึก
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200/80 px-3 py-1 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-bold text-amber-900">จัดให้ครู:</span>
                <Select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="bg-white font-medium text-xs border-amber-200 py-1"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.prefix ? `${t.prefix} ` : ''}{t.name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <User className="w-3.5 h-3.5 text-pink-600" />
                <span>ครูผู้สอน: {effectiveTeacherFullName}</span>
              </div>
            )}

            <div className="h-6 w-px bg-slate-200 mx-1" />

            {hasChanges && (
              <Button
                onClick={handleRevertChanges}
                variant="ghost"
                size="sm"
                icon={<Undo2 className="w-3.5 h-3.5" />}
                className="text-slate-600 hover:text-rose-600"
              >
                คืนค่าเดิม
              </Button>
            )}

            <Button
              onClick={handleSaveAll}
              variant="primary"
              size="sm"
              loading={isSaving}
              icon={<Save className="w-4 h-4" />}
              className={cn(
                'shadow-sm transition-all',
                hasChanges ? 'ring-2 ring-pink-500 ring-offset-2' : 'opacity-85'
              )}
            >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกตารางสอน'}
            </Button>

            <Button
              onClick={() => {
                if (hasChanges && !confirm('มีการเปลี่ยนแปลงที่ยังไม่บันทึก ต้องการปิดใช่หรือไม่?')) return;
                onClose();
              }}
              variant="secondary"
              size="sm"
              icon={<X className="w-4 h-4" />}
            >
              ปิด
            </Button>
          </div>
        </header>

        {/* Fullscreen Body */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT SIDEBAR: Available Subjects */}
          <aside className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                  <BookOpen className="w-4 h-4 text-pink-600" />
                  รายวิชาที่สอน ({teacherSubjects.length})
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">ลากกล่องวิชาไปปล่อยลงตาราง</p>
              </div>
              <span className="text-[10px] font-bold text-pink-600 bg-pink-50 border border-pink-100 px-2 py-0.5 rounded-full">
                Drag & Drop
              </span>
            </div>

            {/* Subject List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {teacherSubjects.length === 0 ? (
                <div className="text-center py-12 px-4 text-slate-400 space-y-2">
                  <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">ยังไม่มีวิชาสำหรับครูท่านนี้</p>
                  <p className="text-[10px] text-slate-400">กำหนดวิชาได้ที่หน้า จัดการผู้ใช้</p>
                </div>
              ) : (
                teacherSubjects.map((s) => (
                  <div
                    key={s.id}
                    draggable
                    onDragStart={(e) => {
                      draggedSidebarSubjectRef.current = s;
                      e.dataTransfer.setData('application/json', JSON.stringify(s));
                    }}
                    className="p-3.5 bg-white hover:bg-pink-50/40 rounded-2xl border border-slate-200 hover:border-pink-300 shadow-2xs hover:shadow-md cursor-grab active:cursor-grabbing transition-all space-y-1.5 group select-none relative"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white shadow-xs"
                        style={{ backgroundColor: s.color || '#db2777' }}
                      />
                      <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100">
                        {s.credit} หน่วยกิต
                      </span>
                    </div>

                    <div className="font-black text-slate-900 text-sm group-hover:text-pink-600 transition-colors">
                      {s.code}
                    </div>

                    <div className="text-xs text-slate-600 line-clamp-1 font-medium">
                      {s.name}
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{s.teacher_name || effectiveTeacherFullName}</span>
                      <span className="text-pink-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        ลากวาง <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Tips */}
            <div className="p-4 bg-gradient-to-br from-pink-50/70 to-rose-50/50 border-t border-pink-100 text-xs text-slate-700 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-pink-700">
                <Sparkles className="w-4 h-4" />
                <span>การเลื่อนบล็อกแบบรวดเร็ว</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                <li><b>เลื่อนเวลาในวันเดิม:</b> คลิกค้างตรงกลางบล็อกแล้วเลื่อนซ้าย/ขวาได้ทันที ไม่กระตุก</li>
                <li><b>ย้ายไปวันอื่น:</b> ลากบล็อกขึ้น/ลงหลุดแถวเดิมข้ามไปยังวันใหม่</li>
                <li><b>ยืดหดเวลา:</b> ลากที่ <b>ขอบซ้าย/ขวา</b> เพื่อปรับเวลาเริ่มหรือหมดคาบทีละ 5 นาที</li>
                <li><b>พักเที่ยง:</b> ช่องสีเทาแถบ 12:00 - 13:00 น.</li>
              </ul>
            </div>
          </aside>

          {/* RIGHT CALENDAR MATRIX */}
          <main className="flex-1 bg-slate-100/70 p-4 sm:p-6 overflow-y-auto overflow-x-auto flex flex-col justify-between">
            <div
              ref={calendarContainerRef}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 flex flex-col flex-1 min-w-[1280px]"
            >
              {/* Hours Axis Header */}
              <div className="flex items-center border-b border-slate-200 pb-3 mb-3">
                <div className="w-36 shrink-0 text-left pl-3 text-xs font-black text-slate-400 uppercase tracking-wider">
                  วันทำการ \ เวลา
                </div>
                <div className="flex-1 grid grid-cols-9 text-center text-xs font-bold text-slate-700 relative">
                  {HOURS.slice(0, 9).map((h) => {
                    const isLunch = h === 12;
                    return (
                      <div
                        key={h}
                        className={cn(
                          'border-l border-slate-200/80 first:border-none px-2 relative',
                          isLunch && 'bg-slate-200/60 rounded-t-lg'
                        )}
                      >
                        <div className={cn('font-mono text-xs font-extrabold', isLunch ? 'text-slate-700' : 'text-slate-900')}>
                          {String(h).padStart(2, '0')}:00
                        </div>
                        <div className={cn('text-[10px] font-medium', isLunch ? 'text-slate-600 font-bold flex items-center justify-center gap-1' : 'text-slate-400')}>
                          {isLunch ? (
                            <>
                              <Coffee className="w-3 h-3 text-amber-700 inline" />
                              <span>พักเที่ยง</span>
                            </>
                          ) : (
                            `ถึง ${String(h + 1).padStart(2, '0')}:00`
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day Tracks: Monday to Friday */}
              <div className="flex-1 space-y-3.5 flex flex-col justify-around min-h-[500px]">
                {DAYS_CONFIG.map((d) => {
                  const daySchedules = teacherSchedules.filter((sc) => sc.day_of_week === d.dayOfWeek);

                  return (
                    <div
                      key={d.dayOfWeek}
                      data-day={d.dayOfWeek}
                      className="day-row-element flex items-stretch rounded-2xl border border-slate-200 bg-white hover:border-pink-300 transition-colors shadow-2xs overflow-hidden flex-1 min-h-[100px]"
                    >
                      {/* Day Label Column */}
                      <div
                        className={cn(
                          'w-36 shrink-0 p-3 flex flex-col justify-center items-center border-r select-none',
                          d.color
                        )}
                      >
                        <span className="text-sm font-black">{d.label}</span>
                        <span className="text-[11px] font-bold opacity-80 mt-0.5">
                          {daySchedules.length} คาบสอน
                        </span>
                      </div>

                      {/* Dropzone Time Track */}
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropOnDay(d.dayOfWeek, e)}
                        className="day-track-container flex-1 relative bg-slate-50/40 hover:bg-pink-50/15 transition-colors overflow-hidden"
                      >
                        {/* Background Hour Grid Guidelines */}
                        <div className="absolute inset-0 grid grid-cols-9 pointer-events-none">
                          {HOURS.slice(0, 9).map((h, i) => (
                            <div
                              key={h}
                              className={cn(
                                'h-full border-r border-slate-100',
                                i % 2 === 1 && 'bg-slate-50/40'
                              )}
                            />
                          ))}
                        </div>

                        {/* Lunch Break Highlight Area (12:00 - 13:00) */}
                        <div
                          className="absolute top-0 bottom-0 bg-slate-200/50 border-x border-slate-300/60 pointer-events-none flex flex-col items-center justify-center z-0"
                          style={{
                            left: `${LUNCH_LEFT_PCT}%`,
                            width: `${LUNCH_WIDTH_PCT}%`,
                          }}
                        >
                          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 opacity-70">
                            <Coffee className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">พักเที่ยง</span>
                          </div>
                        </div>

                        {/* Placed Schedule Blocks */}
                        {daySchedules.length === 0 ? (
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-300 font-medium pointer-events-none">
                            {d.label}
                          </div>
                        ) : (
                          daySchedules.map((sc) => {
                            const { left, width } = getPositionPercent(sc.start_time, sc.end_time);
                            const isInteracting = activeInteractingId === sc.id;

                            return (
                              <div
                                key={sc.id}
                                onMouseDown={(e) => handleBlockMouseDown(sc, d.dayOfWeek, e)}
                                className={cn(
                                  'absolute top-2 bottom-2 rounded-xl px-2.5 py-1 text-left border-2 z-10 flex flex-col justify-between group select-none transition-shadow overflow-hidden',
                                  isInteracting
                                    ? 'shadow-2xl ring-2 ring-pink-500/70 z-30 cursor-grabbing opacity-95'
                                    : 'shadow-xs hover:shadow-lg cursor-grab'
                                )}
                                style={{
                                  left: `${left}%`,
                                  width: `${width}%`,
                                  minWidth: '100px',
                                  backgroundColor: sc.subject?.color ? `${sc.subject.color}20` : '#fdf2f8',
                                  borderColor: sc.subject?.color || '#ec4899',
                                }}
                              >
                                {/* Left Edge Resize Handle */}
                                <div
                                  onMouseDown={(e) => handleResizeStart(sc, 'start', d.dayOfWeek, e)}
                                  className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-black/20 rounded-l-lg transition-colors z-20 flex items-center justify-center"
                                  title="ลากขอบซ้ายเพื่อปรับเวลาเริ่ม (ทีละ 5 นาที)"
                                >
                                  <div className="w-0.5 h-4 bg-slate-400/80 rounded opacity-0 group-hover:opacity-100" />
                                </div>

                                {/* Right Edge Resize Handle */}
                                <div
                                  onMouseDown={(e) => handleResizeStart(sc, 'end', d.dayOfWeek, e)}
                                  className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-black/20 rounded-r-lg transition-colors z-20 flex items-center justify-center"
                                  title="ลากขอบขวาเพื่อปรับเวลาสิ้นสุด (ทีละ 5 นาที)"
                                >
                                  <div className="w-0.5 h-4 bg-slate-400/80 rounded opacity-0 group-hover:opacity-100" />
                                </div>

                                {/* Top: Subject Title & Delete */}
                                <div className="flex items-center justify-between gap-1 pointer-events-auto shrink-0">
                                  <div className="font-black text-xs text-slate-900 truncate flex items-center gap-1 min-w-0">
                                    <Move className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                    <span className="truncate">{sc.subject?.code} {sc.subject?.name}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => handleDeleteSchedule(sc.id, e)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-0.5 hover:bg-rose-50 rounded shrink-0"
                                    title="ลบคาบสอน"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Bottom: Level (ชั้นเรียน) & Room (ห้องสอน) with Quick Edit Button */}
                                <div
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="flex items-center justify-between gap-1 pt-1 mt-auto overflow-visible"
                                >
                                  {/* Info Badges: Level & Room */}
                                  <div className="flex items-center gap-1 min-w-0 flex-1 overflow-hidden">
                                    {/* Level badge (ชั้น) */}
                                    {(() => {
                                      const matchedCr = classrooms.find((c) => c.name === (sc.classroom || currentClassroom));
                                      const levelLabel = matchedCr?.level || matchedCr?.name || sc.classroom || currentClassroom;
                                      return (
                                        <div
                                          className="flex items-center gap-0.5 px-1.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200/80 rounded text-[9px] font-black truncate shadow-2xs"
                                          title={`ชั้นเรียน: ${levelLabel} (${sc.classroom || currentClassroom})`}
                                        >
                                          <GraduationCap className="w-2.5 h-2.5 shrink-0 text-sky-600" />
                                          <span className="truncate">{levelLabel}</span>
                                        </div>
                                      );
                                    })()}

                                    {/* Room badge (ห้องสอน เช่น 243) */}
                                    <div
                                      onClick={() => {
                                        setEditingRoomSchedule(sc);
                                        setRoomInputVal(sc.room_number || `ห้อง ${sc.classroom || currentClassroom}`);
                                      }}
                                      className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white/90 hover:bg-pink-50 text-slate-800 hover:text-pink-700 border border-slate-200/90 rounded text-[9px] font-extrabold truncate cursor-pointer transition-colors shadow-2xs"
                                      title="คลิกเพื่อแก้ไขเลขห้องสอน"
                                    >
                                      <MapPin className="w-2.5 h-2.5 shrink-0 text-pink-600" />
                                      <span className="truncate">{sc.room_number || `ห้อง ${sc.classroom || currentClassroom}`}</span>
                                      <Edit2 className="w-2 h-2 shrink-0 text-slate-400 group-hover:text-pink-500 ml-0.5" />
                                    </div>
                                  </div>

                                  {/* Hover Tooltip Action Icons: Time & Classroom */}
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    {/* Time icon with tooltip */}
                                    <div className="relative group/tooltip">
                                      <div className="w-5 h-5 rounded flex items-center justify-center bg-white/90 hover:bg-pink-50 text-slate-600 hover:text-pink-600 border border-slate-200/80 shadow-2xs cursor-pointer transition-colors">
                                        <Clock className="w-3 h-3 text-pink-500" />
                                      </div>
                                      <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover/tooltip:flex flex-col items-center z-50 pointer-events-none">
                                        <div className="bg-slate-900 text-white text-[10px] font-mono font-bold px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                                          เวลา {sc.start_time} - {sc.end_time} น.
                                        </div>
                                        <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-1" />
                                      </div>
                                    </div>

                                    {/* Quick Edit Room Button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingRoomSchedule(sc);
                                        setRoomInputVal(sc.room_number || `ห้อง ${sc.classroom || currentClassroom}`);
                                      }}
                                      className="w-5 h-5 rounded flex items-center justify-center bg-white/90 hover:bg-pink-50 text-pink-600 border border-pink-200 shadow-2xs cursor-pointer transition-colors"
                                      title="แก้ไขเลขห้องเรียน/สถานที่"
                                    >
                                      <Edit2 className="w-2.5 h-2.5" />
                                    </button>

                                    {/* Classroom selector icon with tooltip & popup dropdown */}
                                    <div className="relative group/tooltip">
                                      <label className="w-5 h-5 rounded flex items-center justify-center bg-white/90 hover:bg-sky-50 text-sky-600 border border-slate-200/80 shadow-2xs cursor-pointer transition-colors m-0">
                                        <Users className="w-3 h-3 text-sky-600" />
                                        <select
                                          value={sc.classroom || currentClassroom}
                                          onChange={(e) => handleUpdateScheduleClassroom(sc.id, e.target.value)}
                                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                          title={`ชั้นเรียน: ${sc.classroom || currentClassroom}`}
                                        >
                                          {classrooms.map((c) => (
                                            <option key={c.id || c.name} value={c.name} className="text-slate-800 bg-white font-medium">
                                              {c.name} {c.level ? `(${c.level})` : ''}
                                            </option>
                                          ))}
                                        </select>
                                      </label>
                                      <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover/tooltip:flex flex-col items-center z-50 pointer-events-none">
                                        <div className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                                          ชั้นเรียน: {sc.classroom || currentClassroom} (คลิกเพื่อเปลี่ยน)
                                        </div>
                                        <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-1" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Matrix Footer Note */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {hasChanges
                      ? 'มีการเปลี่ยนแปลงตำแหน่ง/เวลา กดปุ่ม "บันทึกตารางสอน" ด้านบนขวาเพื่อบันทึก'
                      : 'ตารางสอนเป็นปัจจุบัน พร้อมใช้งาน'}
                  </span>
                </span>
                <span className="font-extrabold text-slate-800 bg-slate-100 px-3 py-1 rounded-xl">
                  รวมทั้งหมด {teacherSchedules.length} คาบสอน
                </span>
              </div>
            </div>
          </main>
        </div>

        {/* Quick Edit Room / Location Popup Dialog */}
        {editingRoomSchedule && (
          <div
            className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setEditingRoomSchedule(null)}
          >
            <div
              className="bg-white rounded-2xl border border-pink-100 p-5 max-w-sm w-full shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      แก้ไขห้องสอน / สถานที่
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {editingRoomSchedule.subject?.code} {editingRoomSchedule.subject?.name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingRoomSchedule(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Class Level Info */}
              <div className="bg-sky-50/80 border border-sky-100 rounded-xl p-2.5 flex items-center justify-between text-xs">
                <span className="text-sky-800 font-semibold flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-sky-600" />
                  ชั้นเรียน (Classroom):
                </span>
                <span className="font-black text-sky-900">
                  {(() => {
                    const matchedCr = classrooms.find((c) => c.name === editingRoomSchedule.classroom);
                    return matchedCr?.level ? `${matchedCr.level} (${matchedCr.name})` : (editingRoomSchedule.classroom || '-');
                  })()}
                </span>
              </div>

              {/* Room / Location Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ห้องสอน / เลขที่ห้อง (เช่น 243, Lab คอม, ห้อง 412)
                </label>
                <input
                  type="text"
                  autoFocus
                  value={roomInputVal}
                  onChange={(e) => setRoomInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateScheduleRoomNumber(editingRoomSchedule.id, roomInputVal.trim());
                      setEditingRoomSchedule(null);
                    }
                  }}
                  placeholder="เช่น 243, 412, Lab วิทย์"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingRoomSchedule(null)}
                >
                  ยกเลิก
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleUpdateScheduleRoomNumber(editingRoomSchedule.id, roomInputVal.trim());
                    setEditingRoomSchedule(null);
                  }}
                >
                  ตกลง
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
