export interface Student {
  id: number;
  student_code: string;
  student_number: number;
  title: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  classroom: string;
  classroom_id?: number | null;
  gender: 'male' | 'female' | string;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  status: 'active' | 'inactive' | string;
  avatar?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudentFormData {
  student_code: string;
  student_number: number;
  title: string;
  first_name: string;
  last_name: string;
  classroom: string;
  gender: string;
  guardian_name: string;
  guardian_phone: string;
  status: string;
}

export interface StudentStats {
  total_sessions: number;
  present: number;
  late: number;
  leave: number;
  absent: number;
  attendance_rate: number;
}

export interface AttendanceSessionInfo {
  id: number;
  date: string;
  period: string;
  topic?: string | null;
  subject?: {
    id: number;
    name: string;
    code?: string;
  };
}

export interface AttendanceHistoryRecord {
  id: number;
  student_id: number;
  session_id: number;
  status: 'present' | 'late' | 'leave' | 'absent';
  remark?: string | null;
  session?: AttendanceSessionInfo;
}

export interface StudentProfileData {
  student: Student;
  stats: StudentStats;
  history: AttendanceHistoryRecord[];
}

export interface ClassroomOption {
  id: number;
  name: string;
  level?: string;
  room?: string;
}

export interface PrefixOption {
  id: number;
  name: string;
  type?: 'student' | 'staff' | 'all';
}
