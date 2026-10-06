'use client';

import React, { useEffect, useState } from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  PhoneCall,
  RefreshCw,
  User,
  ShieldAlert,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, PageContainer } from '@/components/ui';

export default function AlertsView() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.getAlerts();
      if (res.data) setAlerts(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.markAlertRead(id);
      loadAlerts();
    } catch (e) {
      console.error(e);
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

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <PageContainer>
      {/* Header bar - White 60% with Pink 30% badge & Sky Blue 10% action */}
      <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shadow-xs">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">การแจ้งเตือนการขาดเรียนและมาสาย</h3>
            <p className="text-xs text-slate-500">
              พบการแจ้งเตือนที่ต้องติดตาม <span className="font-bold text-pink-600">{unreadCount}</span> รายการ
            </p>
          </div>
        </div>

        <Button
          onClick={handleScan}
          disabled={scanning}
          variant="soft"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-sky-600 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'กำลังสแกน...' : 'สแกนตรวจสอบใหม่'}</span>
        </Button>
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-pink-100">
            กำลังโหลดรายการแจ้งเตือน...
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-pink-100">
            ไม่มีรายการแจ้งเตือนในขณะนี้
          </div>
        ) : (
          alerts.map((al) => {
            const isRisk = al.alert_type === 'risk_drop';
            return (
              <div
                key={al.id}
                className={`p-5 rounded-2xl border transition-all ${
                  al.is_read
                    ? 'bg-white border-slate-200 opacity-60'
                    : isRisk
                    ? 'bg-pink-50/50 border-pink-200 shadow-xs'
                    : 'bg-amber-50/40 border-amber-200 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                        isRisk ? 'bg-pink-100 text-pink-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isRisk ? (
                        <ShieldAlert className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{al.title}</span>
                        {!al.is_read && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500 text-white shadow-xs">
                            ด่วน
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{al.message}</p>

                      <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                        <span>
                          นักเรียน: <span className="font-bold text-slate-800">{al.student?.full_name}</span>
                        </span>
                        <span>•</span>
                        <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100 font-medium">
                          ชั้น {al.student?.classroom} (เลขที่ {al.student?.student_number})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {al.student?.guardian_phone && (
                      <a
                        href={`tel:${al.student.guardian_phone}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-colors shadow-xs shadow-sky-200"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>โทรหาผู้ปกครอง</span>
                      </a>
                    )}

                    {!al.is_read && (
                      <Button
                        onClick={() => handleMarkRead(al.id)}
                        variant="outline"
                      >
                        รับทราบแล้ว
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </PageContainer>
  );
}
