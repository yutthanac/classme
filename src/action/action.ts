import { API_BASE, getAuthToken, fetchApi } from '@/lib/api';

export interface StudentDraft {
  id: string | number;
  student_number: number;
  student_code: string;
  title: string;
  first_name: string;
  last_name: string;
  gender: 'male' | 'female';
  guardian_name?: string;
  guardian_phone?: string;
}

export interface AiScanRosterResponse {
  status: string;
  message?: string;
  data: {
    image_path: string;
    students: Array<{
      student_number?: number;
      student_code?: string;
      title?: string;
      first_name?: string;
      last_name?: string;
      name?: string;
      gender?: 'male' | 'female' | string;
      guardian_phone?: string;
    }>;
    total_detected: number;
  };
}

export interface BatchImportResponse {
  status: string;
  message: string;
  data: any;
}

// -------------------------------------------------------------
// 1. BACKEND API FETCH ACTIONS
// -------------------------------------------------------------

/**
 * Send image to backend AI Vision OCR to scan and extract students.
 */
export async function scanRosterWithAi(formData: FormData): Promise<AiScanRosterResponse> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/students/ai-scan-roster`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `การสแกนภาพล้มเหลว (HTTP ${res.status})`);
  }

  return res.json();
}

/**
 * Save draft student roster to backend in a single batch.
 */
export async function batchImportStudents(data: {
  classroom: string;
  students: Array<{
    student_number: number;
    student_code: string;
    title: string;
    first_name: string;
    last_name: string;
    gender: 'male' | 'female';
    guardian_phone?: string | null;
  }>;
}): Promise<BatchImportResponse> {
  return fetchApi<BatchImportResponse>('/students/batch-import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// -------------------------------------------------------------
// 2. PARSING & CLIENT UTILITY ACTIONS
// -------------------------------------------------------------

/**
 * Parse Thai full names into components: title, firstName, lastName, gender.
 */
export function parseThaiName(fullName: string) {
  let cleaned = fullName.trim().replace(/\s+/g, ' ');
  let title = 'นาย';
  let gender: 'male' | 'female' = 'male';

  const prefixes = [
    { prefix: 'เด็กชาย', title: 'ด.ช.', gender: 'male' },
    { prefix: 'ด.ช.', title: 'ด.ช.', gender: 'male' },
    { prefix: 'ด.ช', title: 'ด.ช.', gender: 'male' },
    { prefix: 'เด็กหญิง', title: 'ด.ญ.', gender: 'female' },
    { prefix: 'ด.ญ.', title: 'ด.ญ.', gender: 'female' },
    { prefix: 'ด.ญ', title: 'ด.ญ.', gender: 'female' },
    { prefix: 'นางสาว', title: 'นางสาว', gender: 'female' },
    { prefix: 'น.ส.', title: 'นางสาว', gender: 'female' },
    { prefix: 'น.ส', title: 'นางสาว', gender: 'female' },
    { prefix: 'นาง', title: 'นาง', gender: 'female' },
    { prefix: 'นาย', title: 'นาย', gender: 'male' },
  ];

  for (const p of prefixes) {
    if (cleaned.startsWith(p.prefix)) {
      title = p.title;
      gender = p.gender as 'male' | 'female';
      cleaned = cleaned.substring(p.prefix.length).trim();
      break;
    }
  }

  const parts = cleaned.split(' ');
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';

  return { title, firstName, lastName, gender };
}

import * as XLSX from 'xlsx';

/**
 * Robust RFC 4180 CSV/TSV Matrix parser (linear scan, zero regex while-loop errors).
 */
export function parseCSVToMatrix(text: string): string[][] {
  const cleanText = text.replace(/^\uFEFF/, '');
  if (!cleanText.trim()) return [];

  // Determine delimiter by voting across non-empty lines (handles title lines at top)
  const lines = cleanText.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
  let tabCount = 0;
  let commaCount = 0;
  let semiCount = 0;
  for (const line of lines.slice(0, 15)) {
    tabCount += (line.match(/\t/g) || []).length;
    commaCount += (line.match(/,/g) || []).length;
    semiCount += (line.match(/;/g) || []).length;
  }

  let delimiter = ',';
  if (tabCount > commaCount && tabCount > semiCount) {
    delimiter = '\t';
  } else if (semiCount > commaCount && semiCount > tabCount) {
    delimiter = ';';
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n of \r\n
      }
      currentRow.push(currentField.trim());
      currentField = '';
      if (currentRow.some((col) => col.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((col) => col.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Universal Matrix-to-Students Parser:
 * Auto-detects table headers (skips school banners, instructions, empty merged rows),
 * handles 'คำนำหน้าชื่อ' vs 'ชื่อ', and intelligently handles Thai school formats.
 */
export function parseMatrixToStudents(rawRows: any[][]): StudentDraft[] {
  if (!rawRows || rawRows.length === 0) return [];

  const rows = rawRows.map((r) =>
    Array.isArray(r) ? r.map((c) => (c !== null && c !== undefined ? String(c).trim() : '')) : []
  );

  // Scan up to 15 rows to find the actual header row
  let headerRowIndex = -1;
  let numIdx = -1;
  let codeIdx = -1;
  let titleIdx = -1;
  let firstIdx = -1;
  let lastIdx = -1;
  let fullNameIdx = -1;
  let genderIdx = -1;
  let phoneIdx = -1;

  for (let r = 0; r < Math.min(rows.length, 15); r++) {
    const row = rows[r];
    const norm = row.map((c) => c.toLowerCase().replace(/[\s\-_."']/g, ''));

    // Check title column
    const tIdx = norm.findIndex(
      (h) =>
        h === 'คำนำหน้า' ||
        h === 'คำนำหน้านาม' ||
        h === 'คำนำหน้าชื่อ' ||
        h === 'คำนำ' ||
        h === 'title' ||
        h === 'prefix'
    );

    // Check first name column (MUST NOT be title column, MUST NOT contain คำนำ, สกุล, ผู้ปกครอง, โรงเรียน, etc.)
    const fIdx = norm.findIndex(
      (h, idx) =>
        idx !== tIdx &&
        (h === 'ชื่อ' ||
          h === 'ชื่อจริง' ||
          h === 'firstname' ||
          h === 'first' ||
          (h.includes('ชื่อ') &&
            !h.includes('คำนำ') &&
            !h.includes('สกุล') &&
            !h.includes('ผู้ปกครอง') &&
            !h.includes('โรงเรียน') &&
            !h.includes('รายชื่อ') &&
            !h.includes('ห้อง') &&
            !h.includes('ชั้น')))
    );

    // Check last name column
    const lIdx = norm.findIndex(
      (h) => h.includes('นามสกุล') || h === 'สกุล' || h === 'lastname' || h === 'surname'
    );

    // Check full name column (combining first and last)
    const fnIdx = norm.findIndex(
      (h) =>
        (h.includes('ชื่อสกุล') ||
          h.includes('ชื่อนามสกุล') ||
          (h.includes('ชื่อ') && h.includes('สกุล'))) &&
        !h.includes('ผู้ปกครอง')
    );

    // Check number column
    const nIdx = norm.findIndex(
      (h) =>
        h.includes('เลขที่') || h === 'no' || h.includes('ลำดับ') || h === 'num' || h === 'studentnumber'
    );

    // Check student code column
    const cIdx = norm.findIndex(
      (h) =>
        (h.includes('รหัส') || h.includes('ประจำตัว')) &&
        !h.includes('ประชาชน') &&
        !h.includes('บัตร')
    );

    // Check gender column
    const gIdx = norm.findIndex((h) => h.includes('เพศ') || h === 'gender' || h === 'sex');

    // Check phone column
    const pIdx = norm.findIndex(
      (h) =>
        h.includes('เบอร์') ||
        h.includes('โทร') ||
        h === 'phone' ||
        h === 'tel' ||
        h === 'mobile'
    );

    const matchesCount = [nIdx, cIdx, tIdx, fIdx, lIdx, fnIdx, gIdx, pIdx].filter((x) => x !== -1).length;
    if (matchesCount >= 2 || (matchesCount >= 1 && (fIdx !== -1 || fnIdx !== -1))) {
      headerRowIndex = r;
      numIdx = nIdx;
      codeIdx = cIdx;
      titleIdx = tIdx;
      firstIdx = fIdx;
      lastIdx = lIdx;
      fullNameIdx = fnIdx;
      genderIdx = gIdx;
      phoneIdx = pIdx;
      break;
    }
  }

  const hasHeader = headerRowIndex !== -1;
  const startIndex = hasHeader ? headerRowIndex + 1 : 0;

  const results: StudentDraft[] = [];

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every((c) => !c)) continue;

    let studentNumber = results.length + 1;
    let studentCode = '';
    let title = 'นาย';
    let firstName = '';
    let lastName = '';
    let gender: 'male' | 'female' = 'male';
    let guardianPhone = '';

    if (hasHeader) {
      if (numIdx !== -1 && row[numIdx]) {
        const parsedNum = parseInt(row[numIdx], 10);
        if (!isNaN(parsedNum)) studentNumber = parsedNum;
      }
      if (codeIdx !== -1 && row[codeIdx]) {
        studentCode = row[codeIdx].trim();
      }
      if (titleIdx !== -1 && row[titleIdx]) {
        title = row[titleIdx].trim();
      }
      if (firstIdx !== -1 && row[firstIdx]) {
        firstName = row[firstIdx].trim();
      }
      if (lastIdx !== -1 && row[lastIdx]) {
        lastName = row[lastIdx].trim();
      }
      if (fullNameIdx !== -1 && row[fullNameIdx] && !firstName) {
        const parsed = parseThaiName(row[fullNameIdx]);
        title = parsed.title;
        firstName = parsed.firstName;
        lastName = parsed.lastName;
        gender = parsed.gender;
      }
      if (genderIdx !== -1 && row[genderIdx]) {
        const gStr = row[genderIdx].toLowerCase().trim();
        if (gStr === 'หญิง' || gStr === 'female' || gStr === 'f' || gStr === 'ญ') {
          gender = 'female';
        } else if (gStr === 'ชาย' || gStr === 'male' || gStr === 'm' || gStr === 'ช') {
          gender = 'male';
        }
      }
      if (phoneIdx !== -1 && row[phoneIdx]) {
        guardianPhone = row[phoneIdx].trim();
      }
    } else {
      // Positional fallback
      const parsedNum = parseInt(row[0], 10);
      if (!isNaN(parsedNum)) {
        studentNumber = parsedNum;
      }

      if (row.length >= 6) {
        studentCode = row[1] || '';
        title = row[2] || 'นาย';
        firstName = row[3] || '';
        lastName = row[4] || '';
        const g = (row[5] || '').toLowerCase();
        gender = g === 'หญิง' || g === 'female' || g === 'ญ' ? 'female' : 'male';
        guardianPhone = row[6] || '';
      } else if (row.length === 5) {
        studentCode = row[1] || '';
        title = row[2] || 'นาย';
        firstName = row[3] || '';
        lastName = row[4] || '';
        guardianPhone = row[5] || '';
      } else if (row.length === 4) {
        studentCode = row[1] || '';
        // If col 3 is phone number (starts with 0 or has 9-10 digits)
        const isCol3Phone = /^[0\+]\d{8,12}$/.test(row[3].replace(/[-\s]/g, ''));
        if (isCol3Phone) {
          const parsed = parseThaiName(row[2]);
          title = parsed.title;
          firstName = parsed.firstName;
          lastName = parsed.lastName;
          gender = parsed.gender;
          guardianPhone = row[3];
        } else {
          const parsed = parseThaiName(row[2]);
          title = parsed.title;
          firstName = parsed.firstName;
          lastName = row[3] || parsed.lastName;
          gender = parsed.gender;
        }
      } else if (row.length === 3) {
        studentCode = row[1] || '';
        const parsed = parseThaiName(row[2]);
        title = parsed.title;
        firstName = parsed.firstName;
        lastName = parsed.lastName;
        gender = parsed.gender;
      } else if (row.length === 2) {
        const parsed = parseThaiName(row[1]);
        title = parsed.title;
        firstName = parsed.firstName;
        lastName = parsed.lastName;
        gender = parsed.gender;
      }
    }

    // If firstName still contains prefix, extract it
    if (firstName && titleIdx === -1) {
      const parsed = parseThaiName(firstName);
      if (parsed.firstName !== firstName) {
        title = parsed.title;
        firstName = parsed.firstName;
        if (!lastName && parsed.lastName) lastName = parsed.lastName;
        gender = parsed.gender;
      }
    }

    // Auto-derive gender from title if not explicitly set
    if (['นางสาว', 'ด.ญ.', 'เด็กหญิง', 'นาง', 'น.ส.'].includes(title)) {
      gender = 'female';
    } else if (['นาย', 'ด.ช.', 'เด็กชาย'].includes(title)) {
      gender = 'male';
    }

    if (!studentCode) {
      studentCode = `100${String(studentNumber).padStart(2, '0')}`;
    }

    if (firstName || lastName) {
      results.push({
        id: `draft-${Date.now()}-${i}`,
        student_number: studentNumber,
        student_code: studentCode,
        title: title || 'นาย',
        first_name: firstName,
        last_name: lastName,
        gender,
        guardian_phone: guardianPhone,
      });
    }
  }

  return results;
}

/**
 * Parse raw text (CSV, TSV, or copied spreadsheet) into StudentDraft[].
 */
export function parseTextToStudents(text: string): StudentDraft[] {
  const rows = parseCSVToMatrix(text);
  return parseMatrixToStudents(rows);
}

/**
 * Universal File Buffer Reader:
 * Seamlessly handles Excel (.xlsx, .xls, .ods) and Thai CSV/TSV with UTF-8 / Windows-874 fallback.
 */
export async function parseSpreadsheetBuffer(buffer: ArrayBuffer, filename: string): Promise<StudentDraft[]> {
  const lowerName = filename.toLowerCase();

  // If Excel binary file (.xlsx, .xls, .ods)
  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.ods')) {
    try {
      const wb = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = wb.SheetNames[0];
      if (!firstSheetName) return [];
      const sheet = wb.Sheets[firstSheetName];
      const matrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      return parseMatrixToStudents(matrix);
    } catch (e: any) {
      throw new Error(`ไม่สามารถเปิดไฟล์ Excel ได้: ${e.message}`);
    }
  }

  // Otherwise, handle text/csv
  let text = '';
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: false });
    text = utf8Decoder.decode(buffer);
    if (text.includes('\uFFFD')) {
      try {
        const thaiDecoder = new TextDecoder('windows-874');
        text = thaiDecoder.decode(buffer);
      } catch {
        // keep utf8
      }
    }
  } catch {
    text = new TextDecoder().decode(buffer);
  }

  return parseTextToStudents(text);
}

/**
 * Detect and fetch public Google Sheet URL directly
 */
export async function fetchGoogleSheetByUrl(url: string): Promise<StudentDraft[]> {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    throw new Error('ไม่พบรหัสเอกสาร Google Sheets ใน URL นี้');
  }

  const sheetId = match[1];
  const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : '0';
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

  try {
    const res = await fetch(exportUrl);
    if (!res.ok) {
      throw new Error('ไม่สามารถเข้าถึง Google Sheets ได้ กรุณาแชร์ลิงก์เป็น "ทุกคนที่มีลิงก์ (Anyone with link)"');
    }
    const text = await res.text();
    const students = parseTextToStudents(text);
    if (students.length === 0) {
      throw new Error('ไม่พบรายชื่อใน Google Sheets นี้');
    }
    return students;
  } catch (err: any) {
    throw new Error(err.message || 'ไม่สามารถดาวน์โหลดข้อมูลจาก Google Sheets ได้');
  }
}

/**
 * Client-side Image compression: reduces large photo (5-10MB) to ~300KB before upload
 */
export async function compressImageForUpload(file: File, maxDim = 1600, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}

/**
 * Download sample student list CSV template with UTF-8 BOM.
 */
export function downloadSampleTemplate(): void {
  const header = 'เลขที่,รหัสนักเรียน,คำนำหน้า,ชื่อ,นามสกุล,เพศ,เบอร์ผู้ปกครอง\n';
  const sampleRows = [
    '1,10001,นาย,กิตติศักดิ์,มีเจริญ,ชาย,0812345678',
    '2,10002,นาย,ชานนท์,สุขเกษม,ชาย,0823456789',
    '3,10003,นางสาว,ณัฐธิดา,วงศ์สวัสดิ์,หญิง,0834567890',
    '4,10004,นางสาว,ทิพวรรณ,บุญส่ง,หญิง,0845678901',
    '5,10005,นาย,ธนภัทร,จันทร์เพ็ญ,ชาย,0856789012',
  ].join('\n');

  const blob = new Blob(['\uFEFF' + header + sampleRows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'แม่แบบรายชื่อนักเรียน_ClassMe.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
