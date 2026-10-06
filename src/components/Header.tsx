'use client';

import React from 'react';
import { Bell, Calendar, User, ShieldCheck, LogOut } from 'lucide-react';
import { TabType } from './Sidebar';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  alertCount: number;
  currentUser?: any;
  onLogout?: () => void;
}

const titles: Record<TabType, { title: string; subtitle: string }> = {
  dashboard: { title: 'ภาพรวมระบบ', subtitle: 'สรุปข้อมูลสถิติการเข้าเรียนและสถานะล่าสุด' },
  attendance: { title: 'เช็คชื่อในชั้นเรียน', subtitle: 'บันทึกเวลาเรียนรายคาบ มา / สาย / ลา / ขาด' },
  'ai-scan': { title: 'สแกนใบเช็คชื่อด้วย AI', subtitle: 'อัปโหลดภาพเอกสาร AI อ่านข้อมูลและจัดเก็บลงฐานข้อมูล' },
  students: { title: 'จัดการข้อมูลนักเรียน', subtitle: 'รายชื่อนักเรียน ค้นหา ข้อมูลผู้ปกครอง และคำนำหน้า' },
  subjects: { title: 'รายวิชาและตารางเรียน', subtitle: 'จัดการรายวิชา ตารางสอน และห้องเรียน' },
  history: { title: 'ประวัติการเข้าเรียน', subtitle: 'ตรวจสอบย้อนหลังรายวิชาและรายบุคคล' },
  export: { title: 'ส่งออกข้อมูล Excel', subtitle: 'ดาวน์โหลดรายงานการเข้าเรียนในรูปแบบ .xlsx' },
  alerts: { title: 'แจ้งเตือนการขาด/สาย', subtitle: 'ติดตามนักเรียนกลุ่มเสี่ยงขาดเรียนเกินเกณฑ์' },
  roles: { title: 'จัดการบทบาทและสิทธิ์การใช้งาน', subtitle: 'กำหนดสิทธิ์ครู ผู้ดูแลระบบ และคำนำหน้าผู้ใช้' },
};

export default function Header({
  activeTab,
  setActiveTab,
  alertCount,
  currentUser,
  onLogout,
}: HeaderProps) {
  const current = titles[activeTab] || { title: 'ClassMe', subtitle: '' };
  const isAdmin = currentUser?.role?.name === 'admin';

  return (
    <header className="h-16 bg-white border-b border-pink-100/80 px-8 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-base font-bold text-slate-800">{current.title}</h2>
        <p className="text-xs text-slate-500 font-normal">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Sky Blue Accent 10% - Semester Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200/80 rounded-lg text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5 text-sky-600" />
          <span>ภาคเรียนที่ 1/2569</span>
        </div>

        {/* Alert Icon with Pink Badge */}
        <button
          onClick={() => setActiveTab('alerts')}
          className="relative p-2 rounded-lg text-slate-500 hover:text-pink-600 hover:bg-pink-50 transition-colors cursor-pointer"
          title="แจ้งเตือน"
        >
          <Bell className="w-4 h-4" />
          {alertCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500 ring-2 ring-white" />
          )}
        </button>

        {/* User profile with Prefix and Role - Pink (30%) & Sky (10%) */}
        <button
          onClick={() => setActiveTab('roles')}
          className="flex items-center gap-2.5 pl-3 border-l border-pink-100 hover:opacity-85 transition-opacity text-left cursor-pointer"
          title="คลิกเพื่อจัดการโปรไฟล์และบทบาท"
        >
          <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs shadow-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-800">
              {currentUser?.prefix ? `${currentUser.prefix} ` : ''}
              {currentUser?.name || 'ผู้ใช้งาน'}
            </div>
            <div className="text-[11px] font-medium flex items-center gap-1">
              <span
                className={`px-1.5 py-0.2 rounded ${
                  isAdmin ? 'bg-pink-100 text-pink-700' : 'bg-sky-100 text-sky-700'
                }`}
              >
                {currentUser?.role?.display_name || 'ผู้ใช้งาน'}
              </span>
            </div>
          </div>
        </button>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer ml-1"
            title="ออกจากระบบ (Logout)"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
