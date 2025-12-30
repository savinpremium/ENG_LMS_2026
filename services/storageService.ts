import { Student, PaymentRecord, AttendanceRecord } from "../types";

const STUDENTS_KEY = 'se_students';
const PAYMENTS_KEY = 'se_payments';
const ATTENDANCE_KEY = 'se_attendance';

// Helper to get from local storage
const getLocal = <T>(key: string, fallback: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
};

// Helper to save to local storage
const saveLocal = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
  // Dispatch a custom event to simulate real-time updates for the same window
  window.dispatchEvent(new Event('storage_update'));
};

export const storageService = {
  // --- STUDENTS ---
  subscribeToStudents: (callback: (students: Student[]) => void) => {
    const update = () => callback(getLocal(STUDENTS_KEY, []));
    update();
    window.addEventListener('storage_update', update);
    return () => window.removeEventListener('storage_update', update);
  },

  // --- PAYMENTS ---
  subscribeToPayments: (callback: (payments: PaymentRecord[]) => void) => {
    const update = () => callback(getLocal(PAYMENTS_KEY, []));
    update();
    window.addEventListener('storage_update', update);
    return () => window.removeEventListener('storage_update', update);
  },

  uploadPayment: async (payment: Omit<PaymentRecord, 'id' | 'uploadedAt' | 'status'>): Promise<void> => {
    const payments = getLocal<PaymentRecord[]>(PAYMENTS_KEY, []);
    const paymentId = `${payment.studentId}_${payment.month}`;
    
    // Replace existing if same month
    const filtered = payments.filter(p => p.id !== paymentId);
    
    const newRecord: PaymentRecord = {
      ...payment,
      id: paymentId,
      uploadedAt: Date.now(),
      status: 'pending'
    };
    
    saveLocal(PAYMENTS_KEY, [...filtered, newRecord]);
  },

  updatePaymentStatus: async (paymentId: string, status: 'approved' | 'rejected'): Promise<void> => {
    const payments = getLocal<PaymentRecord[]>(PAYMENTS_KEY, []);
    const updated = payments.map(p => p.id === paymentId ? { ...p, status } : p);
    saveLocal(PAYMENTS_KEY, updated);
  },

  // --- ATTENDANCE ---
  subscribeToAttendance: (callback: (attendance: AttendanceRecord[]) => void) => {
    const update = () => callback(getLocal(ATTENDANCE_KEY, []));
    update();
    window.addEventListener('storage_update', update);
    return () => window.removeEventListener('storage_update', update);
  },

  markAttendance: async (studentId: string, week: 1 | 2 | 3 | 4): Promise<void> => {
    const now = new Date();
    const month = now.toISOString().slice(0, 7);
    const date = now.toISOString().split('T')[0];
    const id = `${studentId}_${month}_${week}`;
    
    const attendance = getLocal<AttendanceRecord[]>(ATTENDANCE_KEY, []);
    if (attendance.some(a => a.id === id)) return; // Already marked

    const record: AttendanceRecord = {
      id,
      studentId,
      month,
      week,
      date,
      status: 'present'
    };
    
    saveLocal(ATTENDANCE_KEY, [...attendance, record]);
  },

  // --- UTILS ---
  onConnectionChange: (callback: (online: boolean) => void) => {
    const handle = () => callback(navigator.onLine);
    window.addEventListener('online', handle);
    window.addEventListener('offline', handle);
    handle();
    return () => {
      window.removeEventListener('online', handle);
      window.removeEventListener('offline', handle);
    };
  },

  saveStudent: async (student: Student): Promise<void> => {
    const students = getLocal<Student[]>(STUDENTS_KEY, []);
    saveLocal(STUDENTS_KEY, [...students, student]);
  },

  deleteStudent: async (id: string): Promise<void> => {
    const students = getLocal<Student[]>(STUDENTS_KEY, []);
    saveLocal(STUDENTS_KEY, students.filter(s => s.id !== id));
  },

  generateStudentId: (): string => {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `STU-${random}`;
  }
};
