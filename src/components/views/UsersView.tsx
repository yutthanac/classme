'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Search,
  ShieldCheck,
  Mail,
  Lock,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '@/lib/api';

interface UsersViewProps {
  currentUser?: any;
  onUserUpdated?: (user: any) => void;
}

export default function UsersView({ currentUser, onUserUpdated }: UsersViewProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [prefixes, setPrefixes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    prefix: '',
    name: '',
    email: '',
    password: '',
    role_id: 2,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isAdmin = currentUser?.role?.name === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [uRes, rRes, pRes] = await Promise.all([
        api.getUsers(),
        api.getRoles(),
        api.getPrefixes(),
      ]);

      if (uRes.data) setUsers(uRes.data);
      if (rRes.data) {
        const filteredRoles = rRes.data.filter((r: any) => ['admin', 'teacher'].includes(r.name));
        setRoles(filteredRoles);
      }
      if (pRes.data) setPrefixes(pRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      prefix: '',
      name: '',
      email: '',
      password: '',
      role_id: roles.find((r) => r.name === 'teacher')?.id || 2,
    });
    setShowPassword(false);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({
      prefix: user.prefix || '',
      name: user.name || '',
      email: user.email || '',
      password: '', // blank means no change
      role_id: user.role_id || (roles.find((r) => r.name === 'teacher')?.id || 2),
    });
    setShowPassword(false);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setSubmitting(true);
      setFeedback(null);

      if (editingUser) {
        // Update user
        const updatePayload: any = {
          prefix: formData.prefix,
          name: formData.name.trim(),
          email: formData.email.trim(),
          role_id: Number(formData.role_id),
        };
        if (formData.password.trim()) {
          updatePayload.password = formData.password.trim();
        }

        const res = await api.updateUser(editingUser.id, updatePayload);
        if (res.status === 'success') {
          if (editingUser.id === currentUser?.id && res.data) {
            onUserUpdated?.(res.data);
          }
          setFeedback({ type: 'success', message: 'แก้ไขข้อมูลผู้ใช้งานสำเร็จ' });
          setTimeout(() => {
            setIsModalOpen(false);
            loadData();
          }, 1000);
        }
      } else {
        // Create user
        if (!formData.password.trim()) {
          setFeedback({ type: 'error', message: 'กรุณาระบุรหัสผ่านสำหรับผู้ใช้ใหม่' });
          setSubmitting(false);
          return;
        }

        const res = await api.createUser({
          prefix: formData.prefix,
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
          role_id: Number(formData.role_id),
        });

        if (res.status === 'success') {
          setFeedback({ type: 'success', message: 'เพิ่มผู้ใช้งานใหม่สำเร็จ' });
          setTimeout(() => {
            setIsModalOpen(false);
            loadData();
          }, 1000);
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: any) => {
    if (!isAdmin) return;
    if (user.email === 'admin@classme.ac.th') {
      alert('ไม่สามารถลบบัญชีผู้ดูแลระบบหลักได้');
      return;
    }

    if (!confirm(`ต้องการลบผู้ใช้งาน "${user.name}" (${user.email}) หรือไม่?`)) {
      return;
    }

    try {
      const res = await api.deleteUser(user.id);
      if (res.status === 'success') {
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'ลบไม่สำเร็จ');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const nameMatch = (u.name || '').toLowerCase().includes(q);
    const emailMatch = (u.email || '').toLowerCase().includes(q);
    const prefixMatch = (u.prefix || '').toLowerCase().includes(q);
    return nameMatch || emailMatch || prefixMatch;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-pink-100/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">จัดการข้อมูลผู้ใช้งาน</h2>
          <p className="text-xs text-slate-500">
            ดูรายชื่อผู้ใช้งานทั้งหมด และแก้ไขข้อมูลส่วนตัว สิทธิ์การใช้งาน และรหัสผ่าน
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs shadow-pink-200 cursor-pointer self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มผู้ใช้งานใหม่</span>
          </button>
        )}
      </div>

      {/* Search and Table Card */}
      <div className="bg-white rounded-2xl border border-pink-100/80 shadow-xs overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-pink-50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาตามชื่อ หรืออีเมล..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400 focus:outline-none"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            ทั้งหมด <span className="font-bold text-pink-600">{filteredUsers.length}</span> คน
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">ผู้ใช้งาน</th>
                <th className="py-3 px-4">อีเมล</th>
                <th className="py-3 px-4">บทบาท (Role)</th>
                <th className="py-3 px-4">วันที่สร้าง</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    กำลังโหลดข้อมูลผู้ใช้งาน...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    ไม่พบข้อมูลผู้ใช้งานที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isUserAdmin = u.role?.name === 'admin';
                  const isCurrent = currentUser?.id === u.id;
                  const fullName = u.prefix ? `${u.prefix} ${u.name}` : u.name;

                  return (
                    <tr key={u.id} className="hover:bg-pink-50/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                              isUserAdmin ? 'bg-pink-100 text-pink-700' : 'bg-sky-100 text-sky-700'
                            }`}
                          >
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">
                              <span>{fullName}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-normal">
                                  คุณ
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: #{u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {u.email}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isUserAdmin
                              ? 'bg-pink-100 text-pink-700'
                              : 'bg-sky-100 text-sky-700'
                          }`}
                        >
                          {u.role?.display_name || (isUserAdmin ? 'ผู้ดูแลระบบ' : 'ครูผู้สอน')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('th-TH') : '-'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isAdmin ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 text-slate-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors cursor-pointer"
                              title="แก้ไขข้อมูลส่วนตัว"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {u.email !== 'admin@classme.ac.th' && (
                              <button
                                onClick={() => handleDelete(u)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="ลบผู้ใช้งาน"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-pink-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold">
                  {editingUser ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingUser ? 'แก้ไขข้อมูลส่วนตัวผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingUser ? `แก้ไขข้อมูลของ ${editingUser.name}` : 'กำหนดข้อมูลและสิทธิ์การเข้าใช้งาน'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {feedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-pink-50 border border-pink-200 text-pink-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                {/* Prefix */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    คำนำหน้า
                  </label>
                  <input
                    type="text"
                    list="user-prefix-list"
                    value={formData.prefix}
                    onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                    placeholder="เช่น อาจารย์, ดร."
                    className="w-full px-3 py-2 bg-slate-50 border border-pink-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400 focus:outline-none"
                  />
                  <datalist id="user-prefix-list">
                    {prefixes.map((p) => (
                      <option key={p.id} value={p.name} />
                    ))}
                  </datalist>
                </div>

                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ชื่อ - นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="เช่น Admin หรือ ประสิทธิ์ ศรีวิชัย"
                    className="w-full px-3 py-2 bg-slate-50 border border-pink-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อีเมล (เข้าสู่ระบบ) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="เช่น user@classme.ac.th"
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-pink-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Role Selection (2 Roles Only) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  บทบาทในระบบ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-pink-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400 focus:outline-none"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.display_name} ({r.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {editingUser ? 'รหัสผ่านใหม่ (หากไม่ต้องการเปลี่ยนให้เว้นว่าง)' : 'รหัสผ่าน'}
                    {!editingUser && <span className="text-rose-500"> *</span>}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-pink-600 hover:underline flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'ซ่อน' : 'ดูรหัส'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'เว้นว่างเพื่อใช้รหัสผ่านเดิม' : 'กำหนดรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)'}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-pink-200 rounded-xl text-xs focus:ring-2 focus:ring-pink-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">แสดงผลชื่อ:</span>
                <span className="font-bold text-pink-600">
                  {formData.prefix ? `${formData.prefix} ` : ''}{formData.name || '-'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-pink-200 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
