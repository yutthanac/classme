'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Calendar,
  User,
  ShieldCheck,
  LogOut,
  ChevronDown,
  X,
  Save,
  CheckCircle2,
  Settings,
  UserCog,
} from 'lucide-react';
import { TabType } from './Sidebar';
import AlertsPopup from './AlertsPopup';
import { api, setStoredUser } from '@/lib/api';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  alertCount: number;
  setAlertCount?: (count: number) => void;
  currentUser?: any;
  setCurrentUser?: (user: any) => void;
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
  users: { title: 'จัดการข้อมูลผู้ใช้งาน', subtitle: 'รายชื่อผู้ใช้งานทั้งหมดและการแก้ไขข้อมูลส่วนตัว' },
  roles: { title: 'จัดการสิทธิ์และคำนำหน้า', subtitle: 'กำหนดสิทธิ์ 2 บทบาทและจัดการคำนำหน้านักเรียน' },
};

export default function Header({
  activeTab,
  setActiveTab,
  alertCount,
  setAlertCount,
  currentUser,
  setCurrentUser,
  onLogout,
}: HeaderProps) {
  const [isAlertsPopupOpen, setIsAlertsPopupOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Profile modal edit states
  const [editPrefix, setEditPrefix] = useState(currentUser?.prefix || '');
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const current = titles[activeTab] || { title: 'ClassMe', subtitle: '' };
  const isAdmin = currentUser?.role?.name === 'admin';

  // Sync edit form when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setEditPrefix(currentUser.prefix || '');
      setEditName(currentUser.name || '');
    }
  }, [currentUser]);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const handleOpenProfileModal = () => {
    setIsProfileMenuOpen(false);
    setEditPrefix(currentUser?.prefix || '');
    setEditName(currentUser?.name || '');
    setProfileSuccess(false);
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await api.updateUserProfile({
        prefix: editPrefix.trim(),
        name: editName.trim(),
      });
      if (res.status === 'success' && res.data) {
        setProfileSuccess(true);
        if (setCurrentUser) {
          setCurrentUser(res.data);
        }
        setStoredUser(res.data);
        setTimeout(() => {
          setIsProfileModalOpen(false);
          setProfileSuccess(false);
        }, 1200);
      }
    } catch (err: any) {
      alert('บันทึกไม่สำเร็จ: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const displayName = currentUser?.prefix
    ? `${currentUser.prefix} ${currentUser.name}`
    : currentUser?.name || 'ผู้ใช้งาน';

  return (
    <>
      <header className="h-16 bg-white border-b border-pink-100/80 px-8 flex items-center justify-between shrink-0 relative z-30">
        <div>
          <h2 className="text-base font-bold text-slate-800">{current.title}</h2>
          <p className="text-xs text-slate-500 font-normal">{current.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Semester Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200/80 rounded-lg text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            <span>ภาคเรียนที่ 1/2569</span>
          </div>

          {/* Alert Bell Button with Popup */}
          <div className="relative">
            <button
              onClick={() => setIsAlertsPopupOpen((prev) => !prev)}
              className={`relative p-2 rounded-xl transition-all cursor-pointer ${
                isAlertsPopupOpen
                  ? 'bg-pink-100 text-pink-700 ring-2 ring-pink-200'
                  : 'text-slate-500 hover:text-pink-600 hover:bg-pink-50'
              }`}
              title="การแจ้งเตือน"
            >
              <Bell className="w-4 h-4" />
              {alertCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500 ring-2 ring-white animate-pulse" />
              )}
            </button>

            <AlertsPopup
              isOpen={isAlertsPopupOpen}
              onClose={() => setIsAlertsPopupOpen(false)}
              onAlertsCountChange={(newCount) => {
                if (setAlertCount) setAlertCount(newCount);
              }}
            />
          </div>

          {/* User Profile Pill with Dropdown Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className={`flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl border transition-all text-left cursor-pointer ${
                isProfileMenuOpen
                  ? 'bg-pink-50/80 border-pink-300 ring-2 ring-pink-100'
                  : 'border-pink-100 hover:bg-pink-50/40'
              }`}
              title="คลิกเพื่อเปิดเมนูโปรไฟล์"
            >
              <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs shadow-xs">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {displayName}
                </div>
                <div className="text-[10px] font-medium text-pink-600 mt-0.5">
                  {currentUser?.role?.display_name || 'ผู้ใช้งาน'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl border border-pink-100 shadow-2xl shadow-pink-100/50 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                {/* Header preview */}
                <div className="p-4 border-b border-pink-50 bg-slate-50/50">
                  <div className="text-xs font-bold text-slate-900 truncate">{displayName}</div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{currentUser?.email}</div>
                  <div className="mt-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isAdmin ? 'bg-pink-100 text-pink-700' : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {currentUser?.role?.display_name || 'ผู้ใช้งาน'}
                    </span>
                  </div>
                </div>

                {/* Dropdown Options */}
                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={handleOpenProfileModal}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:text-pink-700 hover:bg-pink-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>จัดการโปรไฟล์ตัวเอง</span>
                  </button>

                  {isAdmin && (
                    <>
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setActiveTab('users');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:text-pink-700 hover:bg-pink-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <UserCog className="w-4 h-4 text-slate-400" />
                        <span>จัดการผู้ใช้งาน</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setActiveTab('roles');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:text-pink-700 hover:bg-pink-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                        <span>จัดการสิทธิ์ & คำนำหน้า</span>
                      </button>
                    </>
                  )}

                  <div className="my-1 border-t border-slate-100" />

                  {onLogout && (
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer font-medium"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>ออกจากระบบ</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Edit My Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-pink-50 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">จัดการโปรไฟล์ตัวเอง</h3>
                  <p className="text-xs text-slate-400">แก้ไขข้อมูลชื่อผู้ใช้งานและคำนำหน้า</p>
                </div>
              </div>

              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {profileSuccess && (
                <div className="p-3 bg-pink-50 border border-pink-200 text-pink-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />
                  <span className="font-semibold">บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว</span>
                </div>
              )}

              {/* Email (Readonly) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  อีเมล (เข้าสู่ระบบ)
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.email || ''}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono cursor-not-allowed"
                />
              </div>

              {/* Role (Readonly) */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  บทบาทในระบบ
                </label>
                <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium">
                  {currentUser?.role?.display_name || 'ผู้ใช้งาน'}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Prefix */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    คำนำหน้า
                  </label>
                  <input
                    type="text"
                    value={editPrefix}
                    onChange={(e) => setEditPrefix(e.target.value)}
                    placeholder="เว้นว่างได้"
                    className="w-full px-3 py-2 bg-slate-50 border border-pink-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400 focus:outline-none"
                  />
                </div>

                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อ - นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="เช่น Admin หรือ ประสิทธิ์ ศรีวิชัย"
                    className="w-full px-3 py-2 bg-slate-50 border border-pink-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">แสดงผลชื่อ:</span>
                <span className="font-bold text-pink-600">
                  {editPrefix ? `${editPrefix} ` : ''}{editName}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-pink-200 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingProfile ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
