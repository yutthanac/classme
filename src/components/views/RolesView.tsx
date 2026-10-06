'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Key,
  CheckCircle2,
  Lock,
  Save,
  Tag,
  Plus,
  Trash2,
  AlertCircle,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';

interface RolesViewProps {
  currentUser?: any;
}

export default function RolesView({ currentUser }: RolesViewProps) {
  const [activeTab, setActiveTab] = useState<'permissions' | 'prefixes'>('permissions');
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<Record<string, any[]>>({});
  const [prefixes, setPrefixes] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(1);
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Prefix Form State
  const [newPrefix, setNewPrefix] = useState('');
  const [addingPrefix, setAddingPrefix] = useState(false);
  const [prefixError, setPrefixError] = useState<string | null>(null);

  // Save Permissions State
  const [savingPerms, setSavingPerms] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isAdmin = currentUser?.role?.name === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rRes, pRes, prefRes] = await Promise.all([
        api.getRoles(),
        api.getPermissions(),
        api.getPrefixes('student'),
      ]);

      if (rRes.data) {
        // Strictly filter to only 2 roles: admin and teacher
        const filteredRoles = rRes.data.filter((r: any) =>
          ['admin', 'teacher'].includes(r.name)
        );
        setRoles(filteredRoles);
        if (filteredRoles.length > 0) {
          const currentSelected = filteredRoles.find((r: any) => r.id === selectedRoleId) || filteredRoles[0];
          setSelectedRoleId(currentSelected.id);
          setSelectedPermIds(currentSelected.permissions?.map((p: any) => p.id) || []);
        }
      }

      if (pRes.data) setPermissions(pRes.data);
      if (prefRes.data) setPrefixes(prefRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (role: any) => {
    setSelectedRoleId(role.id);
    setSelectedPermIds(role.permissions?.map((p: any) => p.id) || []);
    setSaveSuccess(false);
  };

  const togglePermission = (permId: number) => {
    if (!isAdmin) return;
    if (selectedPermIds.includes(permId)) {
      setSelectedPermIds(selectedPermIds.filter((id) => id !== permId));
    } else {
      setSelectedPermIds([...selectedPermIds, permId]);
    }
  };

  const handleSavePermissions = async () => {
    if (!isAdmin) return;
    try {
      setSavingPerms(true);
      const res = await api.updateRolePermissions(selectedRoleId, selectedPermIds);
      if (res.status === 'success') {
        setSaveSuccess(true);
        // Refresh roles in state
        const rRes = await api.getRoles();
        if (rRes.data) {
          const filtered = rRes.data.filter((r: any) => ['admin', 'teacher'].includes(r.name));
          setRoles(filtered);
        }
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err: any) {
      alert('บันทึกสิทธิ์ไม่สำเร็จ: ' + err.message);
    } finally {
      setSavingPerms(false);
    }
  };

  const handleAddPrefix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrefix.trim() || !isAdmin) return;

    try {
      setAddingPrefix(true);
      setPrefixError(null);
      const res = await api.createPrefix({
        name: newPrefix.trim(),
        type: 'student',
      });
      if (res.status === 'success') {
        setNewPrefix('');
        const prefRes = await api.getPrefixes('student');
        if (prefRes.data) setPrefixes(prefRes.data);
      }
    } catch (err: any) {
      setPrefixError(err.message || 'คำนำหน้านี้มีอยู่ในระบบแล้ว');
    } finally {
      setAddingPrefix(false);
    }
  };

  const handleDeletePrefix = async (id: number, name: string) => {
    if (!isAdmin || !confirm(`ลบคำนำหน้า "${name}" หรือไม่?`)) return;

    try {
      const res = await api.deletePrefix(id);
      if (res.status === 'success') {
        const prefRes = await api.getPrefixes('student');
        if (prefRes.data) setPrefixes(prefRes.data);
      }
    } catch (err: any) {
      alert(err.message || 'ลบไม่สำเร็จ');
    }
  };

  const currentRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-pink-100/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">จัดการสิทธิ์และคำนำหน้า</h2>
          <p className="text-xs text-slate-500">กำหนดสิทธิ์การใช้งาน 2 บทบาท และจัดการคำนำหน้านักเรียน</p>
        </div>

        {/* Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-center">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'permissions'
                ? 'bg-white text-pink-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            สิทธิ์การใช้งาน (Permissions)
          </button>
          <button
            onClick={() => setActiveTab('prefixes')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'prefixes'
                ? 'bg-white text-pink-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            คำนำหน้านักเรียน (Prefixes)
          </button>
        </div>
      </div>

      {/* TAB 1: PERMISSIONS (2 ROLES ONLY) */}
      {activeTab === 'permissions' && (
        <div className="space-y-5">
          {/* 2 Role Selectors */}
          <div className="grid grid-cols-2 gap-3">
            {roles.map((r) => {
              const isSelected = selectedRoleId === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => handleSelectRole(r)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-pink-50/70 border-pink-400 ring-2 ring-pink-100 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-pink-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">{r.display_name}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        r.name === 'admin'
                          ? 'bg-pink-100 text-pink-700'
                          : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {r.name}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {r.name === 'admin'
                      ? 'สิทธิ์เต็มในการบริหารจัดการระบบ'
                      : 'เช็คชื่อ, สแกน AI, ข้อมูลนักเรียน และวิชาสอน'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Role Permission Content Card */}
          <div className="bg-white rounded-2xl border border-pink-100/80 p-6 shadow-xs space-y-5">
            {/* Action Bar */}
            <div className="flex items-center justify-between border-b border-pink-50 pb-4">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-pink-600" />
                <span className="text-xs font-bold text-slate-800">
                  สิทธิ์ของ: {currentRole?.display_name || ''} ({selectedPermIds.length} สิทธิ์)
                </span>
                {!isAdmin && (
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded ml-2">
                    โหมดดูข้อมูล (Read-Only)
                  </span>
                )}
              </div>

              {isAdmin && (
                <button
                  onClick={handleSavePermissions}
                  disabled={savingPerms}
                  className="px-4 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shadow-pink-200 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingPerms ? 'กำลังบันทึก...' : 'บันทึกการกำหนดสิทธิ์'}</span>
                </button>
              )}
            </div>

            {saveSuccess && (
              <div className="p-3 bg-pink-50 border border-pink-200 text-pink-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />
                <span className="font-semibold">บันทึกสิทธิ์เรียบร้อยแล้ว</span>
              </div>
            )}

            {/* Categorized Permission Matrix (4 Clean Groups) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(permissions).map(([group, perms]) => (
                <div key={group} className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2.5">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                    <span>{group}</span>
                  </div>

                  <div className="space-y-1.5">
                    {perms.map((p: any) => {
                      const isChecked = selectedPermIds.includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                            isAdmin ? 'cursor-pointer hover:bg-white' : 'cursor-default'
                          } ${isChecked ? 'bg-white font-medium text-slate-800 shadow-2xs' : 'text-slate-500'}`}
                        >
                          <span>{p.display_name}</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(p.id)}
                            disabled={!isAdmin}
                            className="w-4 h-4 text-pink-600 rounded border-slate-300 focus:ring-pink-500 cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PREFIXES MANAGEMENT */}
      {activeTab === 'prefixes' && (
        <div className="bg-white rounded-2xl border border-pink-100/80 p-6 shadow-xs space-y-6">
          {/* Quick Add Bar (Admin Only) */}
          {isAdmin && (
            <div className="space-y-3 pb-4 border-b border-pink-50">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-pink-600" />
                <span>เพิ่มคำนำหน้านักเรียนใหม่</span>
              </div>

              {prefixError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{prefixError}</span>
                </div>
              )}

              <form onSubmit={handleAddPrefix} className="flex gap-2">
                <input
                  type="text"
                  value={newPrefix}
                  onChange={(e) => setNewPrefix(e.target.value)}
                  placeholder="พิมพ์คำนำหน้า เช่น สามเณร, ว่าที่ร้อยตรี..."
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-pink-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400 focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={addingPrefix}
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shadow-pink-200 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>{addingPrefix ? 'กำลังเพิ่ม...' : 'เพิ่ม'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Active Prefixes Chips */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>รายการคำนำหน้าที่เปิดใช้งาน ({prefixes.length} รายการ)</span>
              <span className="text-[11px] text-slate-400 font-normal">
                จะแสดงในตัวเลือกฟอร์มนักเรียนโดยอัตโนมัติ
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {prefixes.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 hover:border-pink-300 transition-colors"
                >
                  <span>{p.name}</span>
                  {p.is_system ? (
                    <span title="ค่าเริ่มต้นระบบ">
                      <Lock className="w-3 h-3 text-slate-300" />
                    </span>
                  ) : (
                    isAdmin && (
                      <button
                        onClick={() => handleDeletePrefix(p.id, p.name)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="ลบคำนำหน้านี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
