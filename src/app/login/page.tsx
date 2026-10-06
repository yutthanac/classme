'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginView from '@/components/LoginView';
import { useApp } from '@/context/AppContext';

export default function LoginPage() {
  const router = useRouter();
  const { currentUser, authChecking, login } = useApp();

  useEffect(() => {
    if (!authChecking && currentUser) {
      router.replace('/');
    }
  }, [authChecking, currentUser, router]);

  const handleLoginSuccess = (user: any) => {
    login(user);
    router.push('/');
  };

  if (authChecking) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600">กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</p>
      </div>
    );
  }

  return <LoginView onLoginSuccess={handleLoginSuccess} />;
}
