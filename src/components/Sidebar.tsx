'use client';

import React from 'react';
import {
  LayoutDashboard,
  UserCheck,
  ScanLine,
  Users,
  BookOpen,
  History,
  FileSpreadsheet,
  Bell,
  GraduationCap,
  ShieldCheck,
  LogOut,
  User,
  Lock,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'attendance'
  | 'ai-scan'
  | 'students'
  | 'subjects'
  | 'history'
  | 'export'
  | 'alerts'
  | 'roles';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  alertCount: number;
  currentUser?: any;
  onLogout?: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  alertCount,
  currentUser,
  onLogout,
}: SidebarProps) {
  const isAdmin = currentUser?.role?.name === 'admin';

  const menuItems = [
    { id: 'dashboard', label: 'ภาพรวมระบบ', icon: LayoutDashboard },
    { id: 'attendance', label: 'เช็คชื่อในชั้นเรียน', icon: UserCheck },
    { id: 'ai-scan', label: 'สแกนใบเช็คชื่อ AI', icon: ScanLine },
    { id: 'students', label: 'ข้อมูลนักเรียน', icon: Users },
    { id: 'subjects', label: 'วิชาและตารางเรียน', icon: BookOpen },
    { id: 'history', label: 'ประวัติการเข้าเรียน', icon: History },
    { id: 'export', label: 'ส่งออก Excel', icon: FileSpreadsheet },
    { id: 'alerts', label: 'แจ้งเตือนขาด/สาย', icon: Bell, badge: alertCount },
    {
      id: 'roles',
      label: isAdmin ? 'บทบาท สิทธิ์ & คำนำหน้า' : 'บทบาทและสิทธิ์',
      icon: ShieldCheck,
      adminOnly: false,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-pink-100/80 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-pink-50 gap-3 bg-white">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center font-bold shadow-sm shadow-pink-200">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 text-base leading-tight">ClassMe</h1>
          <p className="text-xs text-pink-600/80 font-medium">ระบบบริหารจัดการชั้นเรียน</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 px-3 space-y-1 bg-white overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-pink-50/90 text-pink-700 font-semibold border-l-4 border-pink-500 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-pink-50/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-pink-600' : 'text-slate-400 group-hover:text-pink-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.id === 'roles' && !isAdmin && (
                  <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">
                    ดูสิทธิ์
                  </span>
                )}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-pink-500 text-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* User Session Mini Card */}
      {currentUser && (
        <div className="p-3 mx-3 mb-2 rounded-2xl bg-slate-50/80 border border-pink-100/70">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {currentUser.prefix ? `${currentUser.prefix} ` : ''}{currentUser.name}
                </div>
                <div className="text-[10px] text-pink-600 font-medium truncate">
                  {currentUser.role?.display_name || 'ผู้ใช้งาน'}
                </div>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status Footer - Sky Blue accent (10%) */}
      <div className="p-4 border-t border-pink-50 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-700">ฐานข้อมูล:</span>{' '}
            <span className="text-sky-600 font-medium">classme_db (MySQL)</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
