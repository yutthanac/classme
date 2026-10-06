'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  UserCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';

interface LoginViewProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }

    try {
      setLoading(true);
      const res = await api.login({ email: email.trim(), password });
      if (res.status === 'success' && res.data?.user) {
        onLoginSuccess(res.data.user);
      } else {
        setErrorMessage(res.message || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (type: 'admin' | 'teacher') => {
    setErrorMessage(null);
    if (type === 'admin') {
      setEmail('admin@classme.ac.th');
      setPassword('admin123');
    } else {
      setEmail('teacher@classme.ac.th');
      setPassword('teacher123');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-50/60 p-4 selection:bg-pink-500 selection:text-white">
      {/* Decorative background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-pink-100/60 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-sky-100/50 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Main Card (White 60%) */}
        <div className="bg-white rounded-3xl border border-pink-100/90 shadow-xl shadow-pink-100/30 overflow-hidden">
          {/* Header Accent (Pink 30% & Sky Blue 10%) */}
          <div className="pt-8 pb-6 px-8 text-center border-b border-pink-50/80 bg-white">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white shadow-md shadow-pink-200 mb-4">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">ClassMe</h1>
            <p className="text-xs text-pink-600 font-medium mt-1">ระบบบริหารจัดการชั้นเรียนและการเข้าเรียน</p>

            {/* Sub-badge: Sky Blue 10% */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3 text-sky-500" />
              <span>เข้าสู่ระบบเพื่อเริ่มใช้งาน</span>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                อีเมลผู้ใช้งาน <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="เช่น admin@classme.ac.th หรือ teacher@classme.ac.th"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-pink-200/80 text-xs focus:outline-none focus:ring-2 focus:ring-pink-400/30 focus:border-pink-500 transition-all text-slate-800 placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {/* Password Field with Show/Hide toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  รหัสผ่าน <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">คลิกที่รูปตาเพื่อเปิด/ปิดรหัส</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านของคุณ"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-pink-200/80 text-xs focus:outline-none focus:ring-2 focus:ring-pink-400/30 focus:border-pink-500 transition-all text-slate-800 placeholder:text-slate-400 font-mono tracking-wider"
                  required
                />
                {/* Password visibility toggle button */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-pink-600 transition-colors"
                  title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-pink-600" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button (Pink 30%) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 active:scale-[0.99] text-white text-xs font-semibold shadow-md shadow-pink-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังตรวจสอบข้อมูล...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>เข้าสู่ระบบ</span>
                </>
              )}
            </button>

            {/* Demo Quick Account Selectors (Pink 30% & Sky Blue 10%) */}
            <div className="pt-4 border-t border-pink-50 space-y-2.5">
              <p className="text-[11px] font-semibold text-slate-500 text-center">
                ทดสอบเข้าสู่ระบบแบบรวดเร็ว (2 บทบาทเริ่มต้น):
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillQuickAccount('admin')}
                  className="p-2.5 rounded-xl border border-pink-200 bg-pink-50/60 hover:bg-pink-100/70 text-pink-800 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-pink-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-pink-600" />
                    <span>ผู้ดูแลระบบ</span>
                  </div>
                  <div className="text-[10px] text-pink-600/80 mt-0.5">Admin (สิทธิ์เต็ม)</div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">admin123</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillQuickAccount('teacher')}
                  className="p-2.5 rounded-xl border border-sky-200 bg-sky-50/60 hover:bg-sky-100/70 text-sky-800 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700">
                    <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span>ครูผู้สอน</span>
                  </div>
                  <div className="text-[10px] text-sky-600/80 mt-0.5">Teacher (เช็คชื่อ/AI)</div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">teacher123</div>
                </button>
              </div>
            </div>
          </form>

          {/* Footer note */}
          <div className="p-4 bg-slate-50/70 border-t border-pink-50 text-center">
            <p className="text-[11px] text-slate-500">
              ฐานข้อมูล: <span className="font-semibold text-sky-600">classme_db (MySQL)</span> • คมชัด สะอาดตา
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
