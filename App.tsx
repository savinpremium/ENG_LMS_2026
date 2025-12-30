import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  User,
  LogIn, 
  QrCode, 
  Trash2, 
  Search, 
  Sparkles,
  GraduationCap,
  Loader2,
  Upload,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Eye,
  PlusCircle,
  AlertCircle,
  Info,
  DollarSign,
  TrendingUp,
  CreditCard as PaymentIcon
} from 'lucide-react';
import Navbar from './components/Navbar';
import QRCodeGenerator from './components/QRCodeGenerator';
import { AuthUser, Student, Grade, PaymentRecord, AttendanceRecord, PaymentStatus } from './types';
import { storageService } from './services/storageService';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');
  const [aiTip, setAiTip] = useState<string>('');
  const [adminInsights, setAdminInsights] = useState<string>('');
  
  // Navigation Tabs
  const [studentTab, setStudentTab] = useState<'profile' | 'payment' | 'attendance'>('profile');
  const [adminTab, setAdminTab] = useState<'students' | 'payments' | 'attendance'>('students');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('pending');

  // Form States
  const [regForm, setRegForm] = useState({ name: '', grade: 1 as Grade, schoolName: '', whatsappNumber: '' });
  const [loginForm, setLoginForm] = useState({ whatsappNumber: '', password: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Real-time Data Sync
  useEffect(() => {
    const unsubStudents = storageService.subscribeToStudents(setStudents);
    const unsubPayments = storageService.subscribeToPayments(setPayments);
    const unsubAttendance = storageService.subscribeToAttendance((att) => {
      setAttendance(att);
      setIsLoading(false);
    });

    return () => {
      unsubStudents();
      unsubPayments();
      unsubAttendance();
    };
  }, []);

  // AI Assistant Insights
  useEffect(() => {
    if (user?.type === 'STUDENT') {
      geminiService.getLearningTip(user.data.grade).then(setAiTip);
    }
    if (user?.type === 'STAFF') {
      geminiService.getAdminInsights(students).then(setAdminInsights);
    }
  }, [user, students.length]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.name || !regForm.whatsappNumber || !regForm.schoolName) {
      alert("Please fill all fields");
      return;
    }

    const studentId = storageService.generateStudentId();
    const newStudent: Student = {
      ...regForm,
      id: studentId,
      registeredAt: Date.now(),
    };

    try {
      await storageService.saveStudent(newStudent);
      setUser({ type: 'STUDENT', data: newStudent });
      setRegForm({ name: '', grade: 1, schoolName: '', whatsappNumber: '' });
    } catch (error) {
      alert("Registration failed. Check connection.");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.whatsappNumber === 'Savin2011' && loginForm.password === 'Savin2011') {
      setUser({ type: 'STAFF', username: 'Savin2011' });
      return;
    }
    const found = students.find(s => s.whatsappNumber === loginForm.whatsappNumber && s.id === loginForm.password);
    if (found) {
      setUser({ type: 'STUDENT', data: found });
    } else {
      alert("Invalid login details. Student ID is your password.");
    }
  };

  const handlePaymentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || user.type !== 'STUDENT') return;

    setUploadLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const currentMonth = new Date().toISOString().slice(0, 7); 
      
      try {
        await storageService.uploadPayment({
          studentId: user.data.id,
          month: currentMonth,
          slipData: base64String
        });
        alert("Payment slip stored successfully! The admin will verify it shortly.");
      } catch (err) {
        alert("Payment storage failed.");
      } finally {
        setUploadLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const markPresent = async (studentId: string, week: 1 | 2 | 3 | 4) => {
    try {
      await storageService.markAttendance(studentId, week);
    } catch (err) {
      alert("Failed to mark attendance.");
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPaymentStatus = (studentId: string, month?: string) => {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    return payments.find(p => p.studentId === studentId && p.month === targetMonth);
  };

  const getAttendanceForStudent = (studentId: string) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return attendance.filter(a => a.studentId === studentId && a.month === currentMonth);
  };

  const logout = () => {
    setUser(null);
    setAiTip('');
    setAdminInsights('');
    setLoginForm({ whatsappNumber: '', password: '' });
  };

  const StatusBadge = ({ status }: { status: PaymentStatus }) => {
    const styles = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
      rejected: "bg-rose-100 text-rose-700 border-rose-200"
    };
    return (
      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  // STAFF VIEW
  if (user?.type === 'STAFF') {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyApproved = payments.filter(p => p.month === currentMonth && p.status === 'approved').length;
    const monthlyPending = payments.filter(p => p.month === currentMonth && p.status === 'pending').length;
    const totalPaymentsCount = payments.filter(p => p.status === 'approved').length;

    const displayedPayments = payments
      .filter(p => {
        if (paymentFilter === 'all') return true;
        return p.status === paymentFilter;
      })
      .filter(p => {
        const student = students.find(s => s.id === p.studentId);
        return !searchQuery || 
               p.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
               student?.name.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => b.uploadedAt - a.uploadedAt);

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-black selection:text-white">
        <Navbar user={user} onLogout={logout} />
        
        <div className="bg-[#2E3192] text-white p-4 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'students', icon: Users, label: 'Students' },
              { id: 'payments', icon: PaymentIcon, label: 'Payment Mgt' },
              { id: 'attendance', icon: Calendar, label: 'Attendance' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all whitespace-nowrap ${adminTab === tab.id ? 'bg-white text-[#2E3192] shadow-lg' : 'hover:bg-indigo-600'}`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
          {adminTab === 'students' && (
            <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100">
               <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                 <h2 className="text-2xl font-black text-black uppercase tracking-tight">Student Directory</h2>
                 <div className="relative w-full md:w-80">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                   <input 
                     type="text" 
                     placeholder="Search..."
                     className="w-full pl-12 pr-4 py-3 bg-slate-100 rounded-2xl border-none font-bold text-black"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                   />
                 </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full">
                   <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                     <tr>
                       <th className="px-8 py-4 text-left">ID</th>
                       <th className="px-8 py-4 text-left">Student</th>
                       <th className="px-8 py-4 text-left">WhatsApp</th>
                       <th className="px-8 py-4 text-left">Month Fees</th>
                       <th className="px-8 py-4 text-right">Delete</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {filteredStudents.map(s => {
                       const p = getPaymentStatus(s.id);
                       return (
                         <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-8 py-5 font-mono font-black text-[#2E3192]">{s.id}</td>
                           <td className="px-8 py-5">
                             <div className="font-black text-black">{s.name}</div>
                             <div className="text-xs text-slate-400 font-bold">Grade {s.grade} • {s.schoolName}</div>
                           </td>
                           <td className="px-8 py-5 font-bold text-slate-600">{s.whatsappNumber}</td>
                           <td className="px-8 py-5">
                             {p ? <StatusBadge status={p.status} /> : <span className="text-[10px] text-slate-300 font-black uppercase">No Slip</span>}
                           </td>
                           <td className="px-8 py-5 text-right">
                             <button onClick={() => storageService.deleteStudent(s.id)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                               <Trash2 size={20} />
                             </button>
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
            </div>
          )}

          {adminTab === 'payments' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center gap-6">
                  <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 shadow-inner">
                    <Clock size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Approval</p>
                    <h3 className="text-3xl font-black text-black">{monthlyPending}</h3>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center gap-6">
                  <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Approved ({new Date().toLocaleString('default', { month: 'short' })})</p>
                    <h3 className="text-3xl font-black text-black">{monthlyApproved}</h3>
                  </div>
                </div>
                <div className="bg-[#2E3192] p-8 rounded-[2.5rem] shadow-xl text-white flex items-center gap-6 overflow-hidden relative">
                  <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-white shadow-inner relative z-10">
                    <TrendingUp size={32} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Total Fee Collected</p>
                    <h3 className="text-2xl font-black text-white">{totalPaymentsCount} Records</h3>
                  </div>
                  <Sparkles className="absolute -right-4 -bottom-4 text-white/5" size={120} />
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex gap-2">
                     {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                       <button 
                         key={f}
                         onClick={() => setPaymentFilter(f)}
                         className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentFilter === f ? 'bg-[#2E3192] text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                       >
                         {f}
                       </button>
                     ))}
                   </div>
                   <div className="relative w-full md:w-80">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                     <input 
                       type="text" 
                       placeholder="Filter by Student ID..."
                       className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl border-none font-bold text-black text-sm"
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                     />
                   </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedPayments.map(p => {
                    const student = students.find(s => s.id === p.studentId);
                    return (
                      <div key={p.id} className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all border-t-4 border-t-[#2E3192]">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-black text-black leading-tight">{student?.name || 'Deleted Student'}</h4>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{p.studentId} • {p.month}</p>
                          </div>
                          <StatusBadge status={p.status} />
                        </div>
                        <div 
                          className="aspect-square bg-slate-50 rounded-2xl overflow-hidden cursor-pointer relative shadow-inner mb-4"
                          onClick={() => setPreviewImage(p.slipData)}
                        >
                          <img src={p.slipData} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Slip" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="text-white" size={24} />
                          </div>
                        </div>
                        {p.status === 'pending' && (
                          <div className="grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => storageService.updatePaymentStatus(p.id, 'approved')}
                              className="bg-emerald-500 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-50"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => storageService.updatePaymentStatus(p.id, 'rejected')}
                              className="bg-rose-500 text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {p.status !== 'pending' && (
                           <div className="text-center py-2 text-[10px] font-black uppercase text-slate-300 italic tracking-widest">
                             Marked as {p.status}
                           </div>
                        )}
                      </div>
                    );
                  })}
                  {displayedPayments.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs border-2 border-dashed border-slate-100 rounded-3xl">
                      No records found matching criteria
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {adminTab === 'attendance' && (
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
               <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                 <h2 className="text-2xl font-black text-black uppercase tracking-tight">Daily Attendance Manager</h2>
                 <div className="text-xs font-black text-[#2E3192] bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100 uppercase tracking-widest">
                   {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                 </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                      <tr>
                        <th className="px-8 py-5 text-left">Student Info</th>
                        <th className="px-8 py-5 text-left">Payment</th>
                        <th className="px-8 py-5 text-center">W1</th>
                        <th className="px-8 py-5 text-center">W2</th>
                        <th className="px-8 py-5 text-center">W3</th>
                        <th className="px-8 py-5 text-center">W4</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {students.map(s => {
                        const atts = getAttendanceForStudent(s.id);
                        const p = getPaymentStatus(s.id);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-6">
                              <div className="font-black text-black">{s.name}</div>
                              <div className="text-[10px] font-mono font-bold text-[#2E3192] uppercase">{s.id}</div>
                            </td>
                            <td className="px-8 py-6">
                              {p ? <StatusBadge status={p.status} /> : <div className="text-[8px] font-black text-rose-400 uppercase">Unpaid</div>}
                            </td>
                            {[1, 2, 3, 4].map(w => {
                              const record = atts.find(a => a.week === w);
                              return (
                                <td key={w} className="px-8 py-6 text-center">
                                  {record ? (
                                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto shadow-sm">
                                      <CheckCircle2 size={20} />
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => markPresent(s.id, w as any)}
                                      className="w-10 h-10 bg-slate-50 hover:bg-[#2E3192] text-slate-200 hover:text-white rounded-xl flex items-center justify-center transition-all border-2 border-slate-100 border-dashed hover:border-solid mx-auto group"
                                    >
                                      <PlusCircle size={18} />
                                    </button>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                 </table>
               </div>
            </div>
          )}
        </main>

        {previewImage && (
          <div className="fixed inset-0 z-[100] bg-black/90 p-8 flex flex-col items-center justify-center backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
            <img src={previewImage} className="max-w-full max-h-[80vh] rounded-3xl shadow-2xl border-4 border-white" alt="Preview" />
            <button className="mt-6 bg-white text-black px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs">Close Preview</button>
          </div>
        )}
      </div>
    );
  }

  // STUDENT VIEW
  if (user?.type === 'STUDENT') {
    const studentPayments = payments.filter(p => p.studentId === user.data.id).sort((a,b) => b.uploadedAt - a.uploadedAt);
    const studentAtts = getAttendanceForStudent(user.data.id);
    const currentMonthRecord = getPaymentStatus(user.data.id);

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-black selection:text-white">
        <Navbar user={user} onLogout={logout} />
        
        <div className="bg-[#2E3192] text-white p-4 sticky top-16 z-40 shadow-lg border-b border-indigo-400">
          <div className="max-w-4xl mx-auto flex gap-3">
            {[
              { id: 'profile', icon: User, label: 'Portal' },
              { id: 'payment', icon: CreditCard, label: 'Finance' },
              { id: 'attendance', icon: Calendar, label: 'Sessions' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStudentTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${studentTab === tab.id ? 'bg-white text-[#2E3192] shadow-xl' : 'hover:bg-indigo-600'}`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        <main className="flex-grow p-4 md:p-12 flex items-start justify-center">
          <div className="max-w-4xl w-full">
            {studentTab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-8 animate-in fade-in duration-500">
                   <div className="bg-indigo-50 p-8 rounded-[2.5rem] shadow-inner">
                     <GraduationCap size={72} className="text-[#2E3192]" />
                   </div>
                   <div>
                     <h2 className="text-3xl font-black text-black leading-tight mb-2">{user.data.name}</h2>
                     <div className="bg-emerald-100 text-emerald-700 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200 inline-block">Grade {user.data.grade} Member</div>
                   </div>
                   <div className="w-full space-y-4">
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex justify-between items-center group cursor-copy active:scale-95 transition-all">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student ID</span>
                        <span className="font-mono font-black text-[#2E3192] text-2xl">{user.data.id}</span>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Institution</span>
                        <span className="font-black text-black text-right truncate max-w-[150px]">{user.data.schoolName}</span>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col items-center gap-8 animate-in zoom-in duration-500">
                  <div className="flex items-center gap-3 text-black">
                    <QrCode size={28} className="text-[#2E3192]" />
                    <h3 className="text-xl font-black uppercase tracking-tight">Class Entrance Key</h3>
                  </div>
                  <div className="p-6 bg-white border-[16px] border-slate-50 rounded-[3.5rem] shadow-inner hover:scale-105 transition-transform duration-500">
                    <QRCodeGenerator value={user.data.id} size={220} />
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 text-center leading-relaxed uppercase tracking-wider">Present this QR code to confirm your attendance <br/> for the current weekly session.</p>
                </div>
              </div>
            )}

            {studentTab === 'payment' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in duration-500">
                <div className="lg:col-span-3 space-y-8">
                  <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100">
                    <h2 className="text-2xl font-black text-black mb-1 uppercase tracking-tight">Fee Verification</h2>
                    <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-10">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Cycle</p>
                    
                    {currentMonthRecord ? (
                      <div className="space-y-8">
                         <div className={`p-8 rounded-[2.5rem] border-4 flex items-center gap-6 ${
                           currentMonthRecord.status === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                           currentMonthRecord.status === 'rejected' ? 'bg-rose-50 border-rose-100 text-rose-800' :
                           'bg-amber-50 border-amber-100 text-amber-800'
                         }`}>
                           {currentMonthRecord.status === 'approved' && <CheckCircle2 size={40} />}
                           {currentMonthRecord.status === 'rejected' && <XCircle size={40} />}
                           {currentMonthRecord.status === 'pending' && <Clock size={40} className="animate-pulse" />}
                           <div>
                              <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-40">Verification Status</p>
                              <h4 className="text-2xl font-black capitalize">{currentMonthRecord.status}</h4>
                           </div>
                         </div>
                         <div className="aspect-[16/10] rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-lg bg-slate-100">
                           <img src={currentMonthRecord.slipData} className="w-full h-full object-cover" alt="My Slip" />
                         </div>
                         {currentMonthRecord.status === 'rejected' && (
                            <label className="block w-full cursor-pointer">
                                <input type="file" className="hidden" onChange={handlePaymentUpload} accept="image/*" />
                                <div className="bg-black text-white py-6 rounded-3xl font-black uppercase tracking-widest text-center shadow-xl hover:bg-slate-800 transition-all">
                                  Upload Corrected Slip
                                </div>
                            </label>
                         )}
                      </div>
                    ) : (
                      <label className="block border-8 border-dashed border-slate-50 rounded-[4rem] p-20 text-center hover:bg-slate-50 transition-all cursor-pointer group relative overflow-hidden">
                        <input type="file" className="hidden" onChange={handlePaymentUpload} accept="image/*" />
                        {uploadLoading ? (
                          <div className="flex flex-col items-center">
                            <Loader2 className="animate-spin text-[#2E3192] mb-6" size={56} />
                            <p className="font-black text-[#2E3192] uppercase tracking-[0.3em] text-[10px]">Processing Image...</p>
                          </div>
                        ) : (
                          <>
                            <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                              <Upload className="text-[#2E3192]" size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-black mb-3">Deposit Slip</h3>
                            <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-widest">Select or Capture receipt <br/> for this month's fee</p>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex-grow">
                    <h3 className="text-lg font-black text-black mb-6 uppercase tracking-tight flex items-center gap-2">
                       <Clock className="text-slate-400" size={18} /> History
                    </h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                       {studentPayments.map(p => (
                         <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                               <p className="font-black text-black text-xs uppercase">{new Date(p.month).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Uploaded {new Date(p.uploadedAt).toLocaleDateString()}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                               p.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                               p.status === 'rejected' ? 'bg-rose-100 text-rose-600' :
                               'bg-amber-100 text-amber-600'
                            }`}>
                               {p.status}
                            </div>
                         </div>
                       ))}
                       {studentPayments.length === 0 && (
                         <div className="py-10 text-center text-[10px] font-black uppercase text-slate-300 tracking-widest italic">
                           No payment history found
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {studentTab === 'attendance' && (
              <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-10 duration-500">
                <div className="bg-white p-16 rounded-[4.5rem] shadow-2xl border border-slate-100">
                   <h2 className="text-3xl font-black text-black mb-2 uppercase tracking-tight">Active Learning Log</h2>
                   <p className="text-slate-400 font-black text-xs uppercase tracking-[0.3em] mb-16">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} Sessions</p>
                   
                   <div className="grid grid-cols-1 gap-6">
                     {[1, 2, 3, 4].map(week => {
                       const record = studentAtts.find(a => a.week === week);
                       return (
                         <div key={week} className={`p-8 rounded-[2.5rem] border-2 flex items-center justify-between transition-all duration-300 ${record ? 'bg-emerald-50 border-emerald-100 shadow-xl shadow-emerald-50' : 'bg-slate-50 border-slate-100'}`}>
                           <div className="flex items-center gap-6">
                             <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-sm ${record ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300'}`}>
                               {week}
                             </div>
                             <div>
                               <h4 className={`font-black uppercase tracking-[0.2em] text-[10px] ${record ? 'text-emerald-900' : 'text-slate-400'}`}>Session Week {week}</h4>
                               <p className="text-[10px] font-black uppercase mt-1 opacity-60">
                                 {record ? `Completed on ${record.date}` : 'Not attended yet'}
                               </p>
                             </div>
                           </div>
                           {record ? (
                             <CheckCircle2 className="text-emerald-500" size={32} />
                           ) : (
                             <Clock className="text-slate-200" size={32} />
                           )}
                         </div>
                       );
                     })}
                   </div>
                </div>
                
                <div className="bg-[#2E3192] p-10 rounded-[3rem] text-white flex items-center gap-6 shadow-2xl relative overflow-hidden group">
                   <div className="p-5 bg-white/10 rounded-3xl transition-transform group-hover:rotate-12">
                     <Sparkles className="text-yellow-400" size={28} />
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Monthly Learning Tip</p>
                      <p className="text-lg font-bold leading-relaxed tracking-tight">{aiTip || "Ready to master English this session?"}</p>
                   </div>
                   <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // LANDING PAGE / AUTH
  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-black selection:text-white">
      <Navbar user={null} onLogout={() => {}} />
      <main className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 bg-[#FFDD00] p-10 lg:p-16 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 0)', backgroundSize: '24px 24px'}}></div>
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ background: 'repeating-conic-gradient(from 0deg, #FFFFFF 0deg 8deg, transparent 8deg 16deg)', transform: 'scale(2)'}}></div>
          <div className="relative z-10 flex flex-col items-center max-w-2xl w-full px-6 py-12">
            <div className="animate-in zoom-in duration-1000 flex flex-col items-center">
               <a href="https://ibb.co/8n7gSnS8" target="_blank" rel="noopener noreferrer">
                 <img 
                   src="https://i.ibb.co/6cW0fcfs/Gemini-Generated-Image-8s2c3q8s2c3q8s2c.png" 
                   alt="Smart English Hero" 
                   className="max-w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-3xl transform hover:scale-105 transition-transform duration-500 border-8 border-white"
                   style={{ maxHeight: '70vh' }}
                 />
               </a>
            </div>
          </div>
        </div>

        <div className="flex-1 p-8 lg:p-24 flex items-center justify-center bg-slate-50 relative border-l-4 border-slate-100">
          <div className="max-w-lg w-full relative z-10 animate-in fade-in slide-in-from-right-10 duration-700">
            <div className="flex p-2 bg-white rounded-[2.5rem] mb-12 shadow-[0_40px_100px_rgba(0,0,0,0.1)] border-2 border-slate-50">
              <button onClick={() => setActiveTab('register')} className={`flex-1 py-6 px-8 rounded-[1.8rem] text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${activeTab === 'register' ? 'bg-[#2E3192] text-white shadow-2xl' : 'text-slate-400 hover:text-black'}`}><UserPlus size={18} /> Join Now</button>
              <button onClick={() => setActiveTab('login')} className={`flex-1 py-6 px-8 rounded-[1.8rem] text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${activeTab === 'login' ? 'bg-[#2E3192] text-white shadow-2xl' : 'text-slate-400 hover:text-black'}`}><LogIn size={18} /> Member Access</button>
            </div>

            <div className="bg-white p-12 rounded-[4rem] shadow-[0_50px_120px_rgba(0,0,0,0.1)] border-4 border-slate-50">
              {activeTab === 'register' ? (
                <form onSubmit={handleRegister} className="space-y-8">
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Full Legal Name</label>
                    <input type="text" required className="w-full px-8 py-5 bg-slate-50 border-4 border-transparent rounded-3xl focus:border-[#2E3192] focus:bg-white outline-none font-black text-black text-xl transition-all shadow-sm" placeholder="e.g. John Doe" value={regForm.name} onChange={(e) => setRegForm({...regForm, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Grade</label>
                      <select className="w-full px-8 py-5 bg-slate-50 border-4 border-transparent rounded-3xl focus:border-[#2E3192] outline-none font-black text-black text-xl appearance-none cursor-pointer transition-all shadow-sm" value={regForm.grade} onChange={(e) => setRegForm({...regForm, grade: parseInt(e.target.value) as Grade})}>
                        {[...Array(11)].map((_, i) => (<option key={i+1} value={i+1}>Grade {i+1}</option>))}
                      </select>
                    </div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">WhatsApp</label>
                      <input type="tel" required className="w-full px-8 py-5 bg-slate-50 border-4 border-transparent rounded-3xl focus:border-[#2E3192] focus:bg-white outline-none font-black text-black text-xl transition-all shadow-sm" placeholder="07xxxxxxxx" value={regForm.whatsappNumber} onChange={(e) => setRegForm({...regForm, whatsappNumber: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Current School</label>
                    <input type="text" required className="w-full px-8 py-5 bg-slate-50 border-4 border-transparent rounded-3xl focus:border-[#2E3192] focus:bg-white outline-none font-black text-black text-xl transition-all shadow-sm" placeholder="School Name" value={regForm.schoolName} onChange={(e) => setRegForm({...regForm, schoolName: e.target.value})} />
                  </div>
                  <button type="submit" className="w-full bg-[#2E3192] hover:bg-black text-white font-black py-8 rounded-[2.5rem] shadow-[0_25px_60px_rgba(46,49,146,0.3)] transition-all transform active:scale-95 uppercase tracking-[0.4em] text-[10px] mt-4">Create My Profile</button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-10">
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Username (WhatsApp)</label>
                    <input type="text" required className="w-full px-8 py-6 bg-slate-50 border-4 border-transparent rounded-[2rem] focus:border-[#2E3192] focus:bg-white outline-none font-black text-black text-2xl transition-all shadow-sm" value={loginForm.whatsappNumber} onChange={(e) => setLoginForm({...loginForm, whatsappNumber: e.target.value})} />
                  </div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Password (Student ID)</label>
                    <input type="password" required className="w-full px-8 py-6 bg-slate-50 border-4 border-transparent rounded-[2rem] focus:border-[#2E3192] focus:bg-white outline-none font-black text-black text-2xl transition-all shadow-sm" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} />
                  </div>
                  <button type="submit" className="w-full bg-[#2E3192] hover:bg-black text-white font-black py-8 rounded-[2.5rem] shadow-[0_30px_80px_rgba(46,49,146,0.4)] transition-all transform active:scale-95 uppercase tracking-[0.4em] text-[10px] mt-4">Enter Student Portal</button>
                  <div className="flex items-start gap-3 p-5 bg-indigo-50 rounded-3xl">
                    <Info className="text-[#2E3192] mt-0.5" size={18} />
                    <p className="text-[9px] font-black text-indigo-900 uppercase leading-relaxed tracking-wider">Use your registered WhatsApp number as username and the 'stu-xxxx' ID you received as password.</p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;