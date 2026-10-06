'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Clock,
  ShieldAlert,
  PhoneCall,
  Check,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';

interface AlertsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAlertsCountChange?: (count: number) => void;
}

export default function AlertsPopup({
  isOpen,
  onClose,
  onAlertsCountChange,
}: AlertsPopupProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.getAlerts();
      if (res.data) {
        setAlerts(res.data);
        const unread = res.data.filter((a: any) => !a.is_read).length;
        if (onAlertsCountChange) onAlertsCountChange(unread);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    try {
      setScanning(true);
      await api.scanAlerts();
      await loadAlerts();
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.markAlertRead(id);
      // Optimistic update
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
      );
      const remainingUnread = alerts.filter((a) => a.id !== id && !a.is_read).length;
      if (onAlertsCountChange) onAlertsCountChange(remainingUnread);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const unreadAlerts = alerts.filter((a) => !a.is_read);

  return (
    <div
      ref={popupRef}
      className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl border border-pink-100 shadow-2xl shadow-pink-200/50 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header (White 60% with Pink 30% and Sky 10%) */}
      <div className="p-4 border-b border-pink-50 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-800 text-xs">การแจ้งเตือนขาด/สาย</h4>
              {unreadAlerts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500 text-white shadow-2xs">
                  {unreadAlerts.length} ใหม่
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">แจ้งเตือนนักเรียนกลุ่มเสี่ยงขาดเรียนเกินเกณฑ์</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Refresh / Scan Button */}
          <button
            onClick={handleScan}
            disabled={scanning}
            className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
            title="สแกนตรวจสอบใหม่"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alert list body */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-pink-50/70 p-2">
        {loading ? (
          <div className="py-10 text-center text-xs text-slate-400">
            <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            กำลังโหลดรายการแจ้งเตือน...
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-10 text-center px-4">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-2.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-800">ไม่มีการแจ้งเตือนใหม่</div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              นักเรียนทุกคนมีสถิติการเข้าเรียนอยู่ในเกณฑ์ปกติ
            </p>
          </div>
        ) : (
          alerts.map((al) => {
            const isRisk = al.alert_type === 'risk_drop';
            return (
              <div
                key={al.id}
                className={`p-3 rounded-xl transition-all ${
                  al.is_read
                    ? 'opacity-50 hover:opacity-80'
                    : isRisk
                    ? 'bg-pink-50/40 hover:bg-pink-50/70'
                    : 'bg-amber-50/30 hover:bg-amber-50/60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${
                      isRisk ? 'bg-pink-100 text-pink-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isRisk ? (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {al.title}
                      </span>
                      {!al.is_read && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-pink-500 text-white shrink-0">
                          ด่วน
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                      {al.message}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {al.student?.full_name}
                      </span>
                      <span>•</span>
                      <span className="text-sky-700 font-medium">
                        {al.student?.classroom}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 mt-2.5 pt-1.5 border-t border-slate-100">
                      {al.student?.guardian_phone && (
                        <a
                          href={`tel:${al.student.guardian_phone}`}
                          className="flex items-center gap-1 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-[10px] font-semibold transition-colors"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>โทรหาผู้ปกครอง ({al.student.guardian_phone})</span>
                        </a>
                      )}

                      {!al.is_read && (
                        <button
                          onClick={() => handleMarkRead(al.id)}
                          className="ml-auto flex items-center gap-1 px-2 py-1 bg-white hover:bg-pink-50 border border-pink-200 text-pink-700 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer"
                          title="ทำเครื่องหมายว่ารับทราบแล้ว"
                        >
                          <Check className="w-3 h-3" />
                          <span>รับทราบ</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-slate-50/80 border-t border-pink-50 text-center">
        <p className="text-[10px] text-slate-400">
          ระบบตรวจจับอัตโนมัติเมื่อนักเรียนขาดเรียนสะสม <span className="font-semibold text-pink-600">≥ 3 ครั้ง</span>
        </p>
      </div>
    </div>
  );
}
