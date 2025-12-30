
export type Grade = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export interface Student {
  id: string; // Auto-generated
  name: string;
  grade: Grade;
  schoolName: string;
  whatsappNumber: string;
  registeredAt: number;
}

export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentRecord {
  id: string;
  studentId: string;
  month: string; // e.g., "2024-05"
  slipData: string; // base64 image
  status: PaymentStatus;
  uploadedAt: number;
  amount?: number; // Optional: can be set by admin on approval
}

export interface AttendanceRecord {
  id: string; // studentId_month_week
  studentId: string;
  month: string; // YYYY-MM
  week: 1 | 2 | 3 | 4;
  date: string; // Actual date marked YYYY-MM-DD
  status: 'present';
}

export type AuthUser = 
  | { type: 'STUDENT'; data: Student }
  | { type: 'STAFF'; username: string }
  | null;

export interface AppState {
  students: Student[];
  currentUser: AuthUser;
}
