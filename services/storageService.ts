import { ref, set, get, remove, onValue, push, child } from "firebase/database";
import { db } from "./firebase";
import { Student, PaymentRecord, AttendanceRecord } from "../types";

const STUDENTS_PATH = 'students';
const PAYMENTS_PATH = 'payments';
const ATTENDANCE_PATH = 'attendance';

export const storageService = {
  // --- STUDENTS ---
  subscribeToStudents: (callback: (students: Student[]) => void) => {
    const studentsRef = ref(db, STUDENTS_PATH);
    return onValue(studentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const studentList = Object.keys(data).map(key => ({
          ...data[key]
        })) as Student[];
        callback(studentList);
      } else {
        callback([]);
      }
    });
  },

  // --- PAYMENTS ---
  subscribeToPayments: (callback: (payments: PaymentRecord[]) => void) => {
    const paymentsRef = ref(db, PAYMENTS_PATH);
    return onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const paymentList = Object.keys(data).map(key => ({
          ...data[key]
        })) as PaymentRecord[];
        callback(paymentList);
      } else {
        callback([]);
      }
    });
  },

  uploadPayment: async (payment: Omit<PaymentRecord, 'id' | 'uploadedAt' | 'status'>): Promise<void> => {
    const paymentId = `${payment.studentId}_${payment.month}`;
    const paymentRef = ref(db, `${PAYMENTS_PATH}/${paymentId}`);
    const newRecord: PaymentRecord = {
      ...payment,
      id: paymentId,
      uploadedAt: Date.now(),
      status: 'pending'
    };
    await set(paymentRef, newRecord);
  },

  updatePaymentStatus: async (paymentId: string, status: 'approved' | 'rejected'): Promise<void> => {
    const statusRef = ref(db, `${PAYMENTS_PATH}/${paymentId}/status`);
    await set(statusRef, status);
  },

  // --- ATTENDANCE ---
  subscribeToAttendance: (callback: (attendance: AttendanceRecord[]) => void) => {
    const attRef = ref(db, ATTENDANCE_PATH);
    return onValue(attRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          ...data[key]
        })) as AttendanceRecord[];
        callback(list);
      } else {
        callback([]);
      }
    });
  },

  markAttendance: async (studentId: string, week: 1 | 2 | 3 | 4): Promise<void> => {
    const now = new Date();
    const month = now.toISOString().slice(0, 7); // YYYY-MM
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const id = `${studentId}_${month}_${week}`; // Deterministic key: 1 per week
    
    const attRef = ref(db, `${ATTENDANCE_PATH}/${id}`);
    const record: AttendanceRecord = {
      id,
      studentId,
      month,
      week,
      date,
      status: 'present'
    };
    await set(attRef, record);
  },

  // --- UTILS ---
  onConnectionChange: (callback: (online: boolean) => void) => {
    const connectedRef = ref(db, ".info/connected");
    const unsubscribe = onValue(connectedRef, (snap) => {
      callback(!!snap.val());
    });
    return unsubscribe;
  },

  saveStudent: async (student: Student): Promise<void> => {
    const studentRef = ref(db, `${STUDENTS_PATH}/${student.id}`);
    await set(studentRef, student);
  },

  deleteStudent: async (id: string): Promise<void> => {
    const studentRef = ref(db, `${STUDENTS_PATH}/${id}`);
    await remove(studentRef);
  },

  generateStudentId: (): string => {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `stu-${random}`;
  }
};