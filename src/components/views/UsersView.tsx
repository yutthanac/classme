'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  Camera,
  Upload,
  Check,
  User,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { api } from '@/lib/api';
import { getAvatarUrl, uploadAvatarFile, AVATAR_PRESETS } from '@/lib/avatar';
import { Button, PageContainer, Select, LiquidWaveSpinner, TableRowSkeleton } from '@/components/ui';

interface UsersViewProps {
  currentUser?: any;
  onUserUpdated?: (user: any) => void;
}

export default function UsersView({ currentUser, onUserUpdated }: UsersViewProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [prefixes, setPrefixes] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
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
    subject_ids: [] as number[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Avatar states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [avatarTab, setAvatarTab] = useState<'upload' | 'presets'>('upload');
  const [isDragging, setIsDragging] = useState(false);

  const isAdmin = currentUser?.role?.name === 'admin';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [uRes, rRes, pRes, sRes] = await Promise.all([
        api.getUsers(),
        api.getRoles(),
        api.getPrefixes(),
        api.getSubjects(),
      ]);

      if (uRes.data) setUsers(uRes.data);
      if (rRes.data) {
        const filteredRoles = rRes.data.filter((r: any) => ['admin', 'teacher'].includes(r.name));
        setRoles(filteredRoles);
      }
      if (pRes.data) setPrefixes(pRes.data);
      if (sRes.data) setSubjects(sRes.data);
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
      subject_ids: [],
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(false);
    setAvatarTab('upload');
    setShowPassword(false);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: any) => {
    setEditingUser(user);
    const userSubjectIds = (user.subjects || []).map((s: any) => s.id);
    setFormData({
      prefix: user.prefix || '',
      name: user.name || '',
      email: user.email || '',
      password: '', // blank means no change
      role_id: user.role_id || (roles.find((r) => r.name === 'teacher')?.id || 2),
      subject_ids: userSubjectIds,
    });
    setAvatarFile(null);
    setAvatarPreview(getAvatarUrl(user.avatar_url || user.avatar));
    setRemoveAvatar(false);
    setAvatarTab('upload');
    setShowPassword(false);
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleProcessFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', message: 'กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WEBP, GIF)' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', message: 'ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB' });
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setRemoveAvatar(false);
    setFeedback(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleClearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectPreset = (presetUrl: string) => {
    setAvatarFile(null);
    setAvatarPreview(presetUrl);
    setRemoveAvatar(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setSubmitting(true);
      setFeedback(null);

      // Determine avatar to save
      let avatarToSave: string | null | undefined = undefined;

      if (avatarFile) {
        // Upload image file to backend storage library
        const uploadRes = await uploadAvatarFile(avatarFile);
        avatarToSave = uploadRes.path;
      } else if (removeAvatar) {
        avatarToSave = 'remove';
      } else if (avatarPreview && (avatarPreview.startsWith('http://') || avatarPreview.startsWith('https://'))) {
        avatarToSave = avatarPreview;
      }

      if (editingUser) {
        // Update user
        const updatePayload: any = {
          prefix: formData.prefix,
          name: formData.name.trim(),
          email: formData.email.trim(),
          role_id: Number(formData.role_id),
          subject_ids: formData.subject_ids,
        };
        if (formData.password.trim()) {
          updatePayload.password = formData.password.trim();
        }
        if (avatarToSave !== undefined) {
          updatePayload.avatar = avatarToSave;
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

        const createPayload: any = {
          prefix: formData.prefix,
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
          role_id: Number(formData.role_id),
          subject_ids: formData.subject_ids,
        };
        if (avatarToSave && avatarToSave !== 'remove') {
          createPayload.avatar = avatarToSave;
        }

        const res = await api.createUser(createPayload);

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
    <PageContainer>
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-pink-100/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">จัดการข้อมูลผู้ใช้งาน</h2>
          <p className="text-xs text-slate-500">
            ดูรายชื่อผู้ใช้งานทั้งหมด และแก้ไขข้อมูลส่วนตัว สิทธิ์การใช้งาน รูปโปรไฟล์ และรหัสผ่าน
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={handleOpenAddModal}
            variant="primary"
            className="self-start"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มผู้ใช้งานใหม่</span>
          </Button>
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
                <th className="py-3 px-4">วิชาที่สอน</th>
                <th className="py-3 px-4">วันที่สร้าง</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 px-4 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <LiquidWaveSpinner
                        size="sm"
                        words={[
                          'กำลังโหลดข้อมูลผู้ใช้งาน...',
                          'กำลังตรวจสอบสิทธิ์การใช้งาน...',
                          'กำลังดึงข้อมูลโปรไฟล์...',
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    ไม่พบข้อมูลผู้ใช้งานที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isUserAdmin = u.role?.name === 'admin';
                  const isCurrent = currentUser?.id === u.id;
                  const fullName = u.prefix ? `${u.prefix} ${u.name}` : u.name;
                  const avatarSrc = getAvatarUrl(u.avatar_url || u.avatar);
                  const teacherSubjects = u.subjects || [];

                  return (
                    <tr key={u.id} className="hover:bg-pink-50/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {avatarSrc ? (
                            <div
                              className={`w-9 h-9 rounded-xl overflow-hidden ring-2 shrink-0 bg-slate-50 shadow-xs ${
                                isUserAdmin ? 'ring-pink-200' : 'ring-sky-200'
                              }`}
                            >
                              <img
                                src={avatarSrc}
                                alt={fullName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${
                                isUserAdmin ? 'bg-pink-100 text-pink-700' : 'bg-sky-100 text-sky-700'
                              }`}
                            >
                              {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
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

                      <td className="py-3.5 px-4">
                        {isUserAdmin ? (
                          <span className="text-[11px] text-pink-600 font-medium">ทุกวิชา (Admin)</span>
                        ) : teacherSubjects.length === 0 ? (
                          <span className="text-[11px] text-slate-400 italic">ยังไม่ได้กำหนดวิชา</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {teacherSubjects.map((s: any) => (
                              <span
                                key={s.id}
                                className="px-2 py-0.5 bg-pink-50 text-pink-700 border border-pink-100 rounded-md text-[10px] font-semibold"
                                title={s.name}
                              >
                                {s.code}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('th-TH') : '-'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isAdmin ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              onClick={() => handleOpenEditModal(u)}
                              variant="ghost"
                              size="icon"
                              className="hover:text-pink-600 hover:bg-pink-50"
                              title="แก้ไขข้อมูลส่วนตัว"
                              aria-label="แก้ไขข้อมูลส่วนตัว"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            {u.email !== 'admin@classme.ac.th' && (
                              <Button
                                onClick={() => handleDelete(u)}
                                variant="ghost"
                                size="icon"
                                className="hover:text-rose-600 hover:bg-rose-50"
                                title="ลบผู้ใช้งาน"
                                aria-label="ลบผู้ใช้งาน"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
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
          <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-pink-50 flex items-center justify-between shrink-0">
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

              <Button
                onClick={() => setIsModalOpen(false)}
                variant="ghost"
                size="icon"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
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

              {/* Avatar Upload / Selection Section */}
              <div className="p-4 bg-pink-50/40 rounded-2xl border border-pink-100/90 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-pink-600" />
                    <span>รูปภาพโปรไฟล์ (Avatar)</span>
                  </label>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-pink-100 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setAvatarTab('upload')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                        avatarTab === 'upload'
                          ? 'bg-pink-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      อัปโหลดรูป
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarTab('presets')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                        avatarTab === 'presets'
                          ? 'bg-pink-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      เลือกจากคลัง
                    </button>
                  </div>
                </div>

                {avatarTab === 'upload' ? (
                  <div className="flex flex-col items-center justify-center text-center pt-1 pb-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {/* Centered Circular Drop & Click Zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative group w-28 h-28 rounded-full cursor-pointer transition-all duration-200 flex items-center justify-center select-none shadow-sm ${
                        isDragging
                          ? 'border-3 border-dashed border-pink-500 bg-pink-100/90 scale-105 ring-4 ring-pink-200 shadow-md'
                          : avatarPreview
                          ? 'ring-4 ring-pink-100 hover:ring-pink-300 border-2 border-white'
                          : 'border-2 border-dashed border-pink-300 bg-pink-50/70 hover:bg-pink-100/70 hover:border-pink-400'
                      }`}
                      title="คลิกหรือลากไฟล์รูปภาพมาวางที่นี่"
                    >
                      {avatarPreview ? (
                        <>
                          <img
                            src={avatarPreview}
                            alt="Avatar preview"
                            className="w-full h-full rounded-full object-cover"
                          />
                          {/* Hover / Drag Overlay */}
                          <div
                            className={`absolute inset-0 rounded-full bg-slate-900/50 backdrop-blur-2xs flex flex-col items-center justify-center text-white transition-opacity ${
                              isDragging ? 'opacity-100 bg-pink-900/60' : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <Upload className="w-5 h-5 mb-1 animate-bounce" />
                            <span className="text-[10px] font-semibold">
                              {isDragging ? 'วางรูปที่นี่' : 'คลิกเพื่อเปลี่ยน'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-3 text-slate-400 group-hover:text-pink-600 transition-colors">
                          {isDragging ? (
                            <>
                              <Upload className="w-7 h-7 text-pink-600 animate-bounce mb-1" />
                              <span className="text-[11px] font-bold text-pink-600">วางไฟล์ที่นี่</span>
                            </>
                          ) : (
                            <>
                              <div className="w-9 h-9 rounded-full bg-white shadow-xs flex items-center justify-center text-pink-500 mb-1.5 group-hover:scale-110 transition-transform">
                                <Camera className="w-4 h-4" />
                              </div>
                              <span className="text-[10px] font-medium text-slate-600 leading-tight">
                                ลากรูปมาวาง
                              </span>
                              <span className="text-[9px] text-slate-400">หรือคลิกเพื่อเลือก</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Floating Badge (Camera button at bottom-right corner) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-pink-600 text-white shadow-md hover:bg-pink-700 flex items-center justify-center ring-2 ring-white transition-transform hover:scale-110 cursor-pointer"
                        title="คลิกเพื่อเลือกไฟล์รูปภาพ"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Helper text & action buttons */}
                    <div className="mt-3 space-y-1.5">
                      <p className="text-xs font-semibold text-slate-700">
                        {avatarPreview ? 'อัปโหลดรูปโปรไฟล์แล้ว' : 'ลากไฟล์รูปภาพมาวาง หรือคลิกที่วงกลม'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        รองรับไฟล์ PNG, JPG, WEBP (ขนาดไม่เกิน 5MB)
                      </p>

                      <div className="flex items-center justify-center gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs h-7.5 px-3"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          <span>{avatarPreview ? 'เปลี่ยนรูปภาพ' : 'เลือกไฟล์จากเครื่อง'}</span>
                        </Button>

                        {avatarPreview && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClearAvatar}
                            className="text-xs h-7.5 px-3 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            <span>ลบรูป</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Presets picker */
                  <div className="space-y-3">
                    {/* Centered preview of currently selected preset or user avatar */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 rounded-full ring-4 ring-pink-100 overflow-hidden bg-white shadow-xs border-2 border-white mb-2">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Avatar preview"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-pink-50 text-slate-300">
                            <User className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        เลือกอวตารด้านล่างเพื่อเปลี่ยนรูป
                      </span>
                    </div>

                    <div className="grid grid-cols-6 gap-2">
                      {AVATAR_PRESETS.map((preset) => {
                        const isSelected = avatarPreview === preset.url;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleSelectPreset(preset.url)}
                            className={`relative rounded-2xl p-1 bg-white border transition-all cursor-pointer hover:scale-105 ${
                              isSelected
                                ? 'border-pink-500 ring-2 ring-pink-300 shadow-xs'
                                : 'border-slate-200 hover:border-pink-300'
                            }`}
                            title={preset.name}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              className="w-10 h-10 rounded-full mx-auto object-cover bg-slate-50"
                            />
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center shadow-xs">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {avatarPreview && (
                      <div className="text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleClearAvatar}
                          className="text-xs h-7 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          <span>คืนค่า / ไม่ใช้รูป</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

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
                <Select
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: Number(e.target.value) })}
                  className="w-full"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.display_name} ({r.name})
                    </option>
                  ))}
                </Select>
              </div>

              {/* Subject Assignment Section (for teachers) */}
              <div className="bg-pink-50/40 p-4 rounded-2xl border border-pink-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-pink-600" />
                    <span>รายวิชาที่สอน ({formData.subject_ids.length} วิชา)</span>
                  </label>
                  <span className="text-[10px] text-pink-600 font-medium">
                    {roles.find((r) => r.id === formData.role_id)?.name === 'admin'
                      ? 'Admin เข้าถึงได้ทุกวิชา'
                      : 'เลือกวิชาที่ครูท่านนี้สอน'}
                  </span>
                </div>

                {subjects.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">ยังไม่มีรายวิชาในระบบ</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 divide-y divide-pink-100/60">
                    {subjects.map((sub) => {
                      const isChecked = formData.subject_ids.includes(sub.id);
                      return (
                        <label
                          key={sub.id}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-white/80 cursor-pointer text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    subject_ids: [...formData.subject_ids, sub.id],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    subject_ids: formData.subject_ids.filter((id) => id !== sub.id),
                                  });
                                }
                              }}
                              className="w-4 h-4 rounded text-pink-600 focus:ring-pink-500 border-pink-300"
                            />
                            <div>
                              <span className="font-bold text-slate-800 mr-1.5">{sub.code}</span>
                              <span className="text-slate-600">{sub.name}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400">{sub.credit} นก.</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="text-[10px] text-slate-400">
                  เมื่อครูท่านนี้เข้าสู่ระบบ จะมองเห็นและเข้าสอนเฉพาะห้องเรียนที่มีวิชาเหล่านี้เท่านั้น
                </p>
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
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  variant="outline"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  variant="primary"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
