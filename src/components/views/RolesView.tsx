'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  User,
  Key,
  CheckCircle2,
  Lock,
  Save,
  Sparkles,
  Layers,
  Settings,
  Plus,
  Trash2,
  AlertCircle,
  Tag,
  Users,
  Check,
} from 'lucide-react';
import { api } from '@/lib/api';

interface RolesViewProps {
  currentUser?: any;
}

export default function RolesView({ currentUser }: RolesViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'prefixes' | 'roles_permissions' | 'profile'>('prefixes');
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<Record<string, any[]>>({});
  const [prefixes, setPrefixes] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile Form State
  const [profilePrefix, setProfilePrefix] = useState('อาจารย์');
  const [customProfilePrefix, setCustomProfilePrefix] = useState('');
  const [profileName, setProfileName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveProfileSuccess, setSaveProfileSuccess] = useState(false);

  // New Prefix Form State
  const [newPrefixName, setNewPrefixName] = useState('');
  const [newPrefixType, setNewPrefixType] = useState<'student' | 'staff' | 'all'>('student');
  const [addingPrefix, setAddingPrefix] = useState(false);
  const [prefixFeedback, setPrefixFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Role Permissions Editor State
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<any | null>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<number[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);
  const [permsSuccess, setPermsSuccess] = useState(false);

  const isAdmin = currentUser?.role?.name === 'admin' || userProfile?.role?.name === 'admin';

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [rRes, pRes, uRes, prefRes] = await Promise.all([
        api.getRoles(),
        api.getPermissions(),
        api.getUserProfile(),
        api.getPrefixes(),
      ]);

      if (rRes.data) {
        setRoles(rRes.data);
        if (!selectedRoleForPerms && rRes.data.length > 0) {
          const defaultRole = rRes.data.find((r: any) => r.name === 'teacher') || rRes.data[0];
          setSelectedRoleForPerms(defaultRole);
          setSelectedPermIds(defaultRole.permissions?.map((p: any) => p.id) || []);
        }
      }
      if (pRes.data) setPermissions(pRes.data);
      if (prefRes.data) setPrefixes(prefRes.data);

      if (uRes.data) {
        setUserProfile(uRes.data);
        setProfilePrefix(uRes.data.prefix || 'อาจารย์');
        setProfileName(uRes.data.name || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: any) => {
    setSelectedRoleForPerms(role);
    setSelectedPermIds(role.permissions?.map((p: any) => p.id) || []);
    setPermsSuccess(false);
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
    if (!isAdmin || !selectedRoleForPerms) return;
    try {
      setSavingPerms(true);
      const res = await api.updateRolePermissions(selectedRoleForPerms.id, selectedPermIds);
      if (res.status === 'success') {
        setPermsSuccess(true);
        // refresh roles
        const rRes = await api.getRoles();
        if (rRes.data) {
          setRoles(rRes.data);
          const updated = rRes.data.find((r: any) => r.id === selectedRoleForPerms.id);
          if (updated) setSelectedRoleForPerms(updated);
        }
        setTimeout(() => setPermsSuccess(false), 3000);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการบันทึกสิทธิ์: ' + err.message);
    } finally {
      setSavingPerms(false);
    }
  };

  const handleAddPrefix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrefixName.trim()) return;

    try {
      setAddingPrefix(true);
      setPrefixFeedback(null);
      const res = await api.createPrefix({
        name: newPrefixName.trim(),
        type: newPrefixType,
      });
      if (res.status === 'success') {
        setPrefixFeedback({ type: 'success', message: 'เพิ่มคำนำหน้าเรียบร้อยแล้ว' });
        setNewPrefixName('');
        // Reload prefixes
        const prefRes = await api.getPrefixes();
        if (prefRes.data) setPrefixes(prefRes.data);
        setTimeout(() => setPrefixFeedback(null), 3000);
      }
    } catch (err: any) {
      setPrefixFeedback({ type: 'error', message: err.message || 'ไม่สามารถเพิ่มคำนำหน้าได้ (อาจซ้ำกับที่มีอยู่)' });
    } finally {
      setAddingPrefix(false);
    }
  };

  const handleDeletePrefix = async (id: number, name: string) => {
    if (!confirm(`ต้องการลบคำนำหน้า "${name}" หรือไม่?`)) return;

    try {
      const res = await api.deletePrefix(id);
      if (res.status === 'success') {
        setPrefixFeedback({ type: 'success', message: `ลบคำนำหน้า "${name}" สำเร็จ` });
        const prefRes = await api.getPrefixes();
        if (prefRes.data) setPrefixes(prefRes.data);
        setTimeout(() => setPrefixFeedback(null), 3000);
      }
    } catch (err: any) {
      setPrefixFeedback({ type: 'error', message: err.message || 'ลบไม่สำเร็จ' });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const finalPrefix = profilePrefix === 'other' ? customProfilePrefix : profilePrefix;
      const res = await api.updateUserProfile({
        prefix: finalPrefix,
        name: profileName,
      });
      if (res.status === 'success') {
        setUserProfile(res.data);
        setSaveProfileSuccess(true);
        setTimeout(() => setSaveProfileSuccess(false), 3000);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const studentPrefixes = prefixes.filter((p) => p.type === 'student' || p.type === 'all');
  const staffPrefixes = prefixes.filter((p) => p.type === 'staff' || p.type === 'all');

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Tab Navigation */}
      <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">การจัดการบทบาท สิทธิ์ และคำนำหน้า</h3>
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? 'คุณกำลังใช้งานในฐานะผู้ดูแลระบบ (Admin) มีสิทธิ์จัดการคำนำหน้า บทบาท และสิทธิ์การใช้งาน'
                  : 'บทบาทปัจจุบัน: ครูผู้สอน (Teacher) - สามารถดูข้อมูลสิทธิ์และโปรไฟล์ของตนเองได้'}
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
          <button
            onClick={() => setActiveSubTab('prefixes')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'prefixes'
                ? 'bg-white text-pink-700 shadow-xs border border-pink-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            จัดการคำนำหน้า
          </button>
          <button
            onClick={() => setActiveSubTab('roles_permissions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'roles_permissions'
                ? 'bg-white text-pink-700 shadow-xs border border-pink-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            บทบาท & สิทธิ์ ({roles.length})
          </button>
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'profile'
                ? 'bg-white text-pink-700 shadow-xs border border-pink-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            โปรไฟล์ผู้ใช้งาน
          </button>
        </div>
      </div>

      {/* Non-Admin Notice if applicable */}
      {!isAdmin && activeSubTab !== 'profile' && (
        <div className="p-4 bg-sky-50 border border-sky-200 text-sky-800 rounded-2xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-sky-600 shrink-0" />
            <div>
              <span className="font-bold">โหมดดูข้อมูลเท่านั้น (Read-Only):</span>{' '}
              <span>คุณเข้าสู่ระบบในฐานะ ครูผู้สอน สามารถดูข้อมูลสิทธิ์และคำนำหน้าได้ หากต้องการแก้ไขกรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ (Admin)</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: PREFIXES MANAGEMENT */}
      {activeSubTab === 'prefixes' && (
        <div className="space-y-6">
          {/* Add Prefix Card (Only active for Admin) */}
          {isAdmin && (
            <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-xs">
              <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-pink-600" />
                <span>เพิ่มคำนำหน้าชื่อใหม่ (Prefix)</span>
              </h4>

              {prefixFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 mb-4 ${
                    prefixFeedback.type === 'success'
                      ? 'bg-pink-50 border border-pink-200 text-pink-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {prefixFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{prefixFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleAddPrefix} className="flex flex-col sm:flex-row items-end gap-3">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อคำนำหน้า <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPrefixName}
                    onChange={(e) => setNewPrefixName(e.target.value)}
                    placeholder="เช่น ว่าที่ร้อยตรี, ศ., ดร., สามเณร"
                    required
                    className="w-full px-3.5 py-2 border border-pink-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400 focus:outline-none"
                  />
                </div>

                <div className="w-full sm:w-48">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ประเภทการใช้งาน
                  </label>
                  <select
                    value={newPrefixType}
                    onChange={(e: any) => setNewPrefixType(e.target.value)}
                    className="w-full px-3 py-2 border border-pink-200 rounded-xl text-xs bg-slate-50 focus:ring-2 focus:ring-pink-400 focus:outline-none"
                  >
                    <option value="student">สำหรับนักเรียน</option>
                    <option value="staff">สำหรับครู / บุคลากร</option>
                    <option value="all">ใช้ได้ทั้งหมด</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={addingPrefix}
                  className="w-full sm:w-auto px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs shadow-pink-200 disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{addingPrefix ? 'กำลังบันทึก...' : 'เพิ่มคำนำหน้า'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Prefixes Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Prefixes */}
            <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-pink-50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">คำนำหน้าสำหรับนักเรียน</h4>
                    <p className="text-[11px] text-slate-500">ใช้ในฟอร์มเพิ่ม/แก้ไขข้อมูลนักเรียน</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 text-pink-700">
                  {studentPrefixes.length} รายการ
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {studentPrefixes.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-pink-300 flex items-center justify-between bg-slate-50/50 transition-all group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">{p.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {p.is_system ? 'ค่าเริ่มต้นระบบ' : 'กำหนดเอง'}
                      </div>
                    </div>
                    {isAdmin && !p.is_system && (
                      <button
                        onClick={() => handleDeletePrefix(p.id, p.name)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="ลบคำนำหน้านี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {p.is_system && (
                      <span title="ค่าเริ่มต้นระบบไม่สามารถลบได้">
                        <Lock className="w-3 h-3 text-slate-300" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Staff / Teacher Prefixes */}
            <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-sky-50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">คำนำหน้าสำหรับครูและบุคลากร</h4>
                    <p className="text-[11px] text-slate-500">ใช้ในโปรไฟล์และข้อมูลผู้สอน</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700">
                  {staffPrefixes.length} รายการ
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {staffPrefixes.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-sky-300 flex items-center justify-between bg-slate-50/50 transition-all group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">{p.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {p.is_system ? 'ค่าเริ่มต้นระบบ' : 'กำหนดเอง'}
                      </div>
                    </div>
                    {isAdmin && !p.is_system && (
                      <button
                        onClick={() => handleDeletePrefix(p.id, p.name)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="ลบคำนำหน้านี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {p.is_system && (
                      <span title="ค่าเริ่มต้นระบบไม่สามารถลบได้">
                        <Lock className="w-3 h-3 text-slate-300" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & PERMISSIONS MATRIX */}
      {activeSubTab === 'roles_permissions' && (
        <div className="space-y-6">
          {/* Role selector cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roles.map((r) => {
              const isSelected = selectedRoleForPerms?.id === r.id;
              return (
                <div
                  key={r.id}
                  onClick={() => handleRoleSelect(r)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-pink-400 ring-2 ring-pink-100 shadow-md'
                      : 'bg-white border-slate-200 hover:border-pink-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-pink-50 text-pink-700">
                      {r.name}
                    </span>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500 text-white">
                        กำลังกำหนดสิทธิ์
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">{r.display_name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{r.description}</p>
                  <div className="mt-3 text-[11px] font-medium text-pink-600">
                    สิทธิ์ปัจจุบัน: {r.permissions?.length || 0} รายการ
                  </div>
                </div>
              );
            })}
          </div>

          {/* Permissions Matrix */}
          {selectedRoleForPerms && (
            <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-50 pb-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Key className="w-4 h-4 text-pink-600" />
                    <span>กำหนดสิทธิ์การใช้งานสำหรับ: {selectedRoleForPerms.display_name}</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    {isAdmin
                      ? 'คลิกเพื่อเลือกหรือยกเลิกสิทธิ์ แล้วกดปุ่มบันทึกการเปลี่ยนแปลง'
                      : 'รายการสิทธิ์ที่บทบาทนี้ได้รับอนุญาต'}
                  </p>
                </div>

                {isAdmin && (
                  <button
                    onClick={handleSavePermissions}
                    disabled={savingPerms}
                    className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-pink-200 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingPerms ? 'กำลังบันทึก...' : 'บันทึกการกำหนดสิทธิ์'}</span>
                  </button>
                )}
              </div>

              {permsSuccess && (
                <div className="p-3 bg-pink-50 border border-pink-200 text-pink-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />
                  <span className="font-semibold">บันทึกสิทธิ์ของบทบาทสำเร็จเรียบร้อยแล้ว</span>
                </div>
              )}

              {/* Groups */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(permissions).map(([group, perms]) => (
                  <div
                    key={group}
                    className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-3"
                  >
                    <span className="text-xs font-bold text-pink-700 px-2 py-0.5 rounded bg-pink-50 inline-block">
                      {group}
                    </span>

                    <div className="space-y-2 pt-1">
                      {perms.map((p: any) => {
                        const isChecked = selectedPermIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${
                              isAdmin ? 'cursor-pointer hover:bg-white' : 'cursor-default'
                            } ${isChecked ? 'bg-white shadow-2xs' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(p.id)}
                              disabled={!isAdmin}
                              className="mt-0.5 w-4 h-4 text-pink-600 rounded border-slate-300 focus:ring-pink-500"
                            />
                            <div>
                              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span>{p.display_name}</span>
                              </div>
                              <div className="text-[11px] text-slate-500">{p.description}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.name}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CURRENT USER PROFILE */}
      {activeSubTab === 'profile' && (
        <div className="bg-white p-6 rounded-2xl border border-pink-100 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-pink-50 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shadow-xs">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">ข้อมูลโปรไฟล์ผู้ใช้งาน</h3>
                <p className="text-xs text-slate-500">แก้ไขคำนำหน้าและชื่อผู้ใช้งานของคุณ</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-semibold">
              บทบาท: {userProfile?.role?.display_name || 'ผู้ใช้งาน'}
            </span>
          </div>

          {saveProfileSuccess && (
            <div className="p-3 bg-pink-50 border border-pink-200 text-pink-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />
              <span className="font-semibold">อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  คำนำหน้า (Prefix)
                </label>
                <select
                  value={profilePrefix}
                  onChange={(e) => setProfilePrefix(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-pink-400"
                >
                  {staffPrefixes.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                  <option value="other">กำหนดเอง...</option>
                </select>

                {profilePrefix === 'other' && (
                  <input
                    type="text"
                    placeholder="ระบุคำนำหน้า..."
                    value={customProfilePrefix}
                    onChange={(e) => setCustomProfilePrefix(e.target.value)}
                    className="mt-2 w-full px-3 py-1.5 bg-slate-50 border border-pink-200 rounded-lg text-xs focus:ring-2 focus:ring-pink-400"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  ชื่อ - นามสกุล
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">ชื่อแสดงผลเต็ม:</span>
              <span className="font-bold text-pink-600">
                {(profilePrefix === 'other' ? customProfilePrefix : profilePrefix) + ' ' + profileName}
              </span>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-pink-200 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
