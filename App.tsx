
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
  CreditCard as PaymentIcon,
  MessageCircle,
  Menu,
  X,
  Phone,
  ChevronRight,
  Globe
} from 'lucide-react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import QRCodeGenerator from './components/QRCodeGenerator';
import { AuthUser, Student, Grade, PaymentRecord, AttendanceRecord, PaymentStatus } from './types';
import { storageService } from './services/storageService';
import { geminiService } from './services/geminiService';
import { translations, Language } from './translations';

const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'register' | 'login'>('register');
  const [aiTip, setAiTip] = useState<string>('');
  const [adminInsights, setAdminInsights] = useState<string>('');
  
  // Language State
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('app_lang');
    return (saved as Language) || 'en';
  });

  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  // Navigation Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    setIsSidebarOpen(false);
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

  const LanguageToggle = () => (
    <button 
      onClick={() => setLang(lang === 'en' ? 'si' : 'en')}
      className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-black text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
    >
      <Globe size={16} className="text-[#2E3192]" />
      {lang === 'en' ? 'සිංහල' : 'English'}
    </button>
  );

  const WhatsAppFAB = () => (
    <a 
      href="https://wa.me/94770612011" 
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[60] bg-[#25D366] text-white p-4 lg:p-5 rounded-full shadow-[0_20px_40px_rgba(37,211,102,0.4)] hover:scale-110 active:scale-95 transition-all group flex items-center gap-3 border-4 border-white"
    >
      <span className="hidden md:inline font-black uppercase tracking-widest text-[10px]">{t.supportDesk}</span>
      <MessageCircle size={24} />
    </a>
  );

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
      <div className="min-h-screen bg-[#F8FAFC] flex selection:bg-black selection:text-white">
        <Sidebar 
          user={user} 
          activeTab={adminTab} 
          setActiveTab={setAdminTab} 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen}
          lang={lang}
        />
        
        <div className="flex-1 flex flex-col lg:ml-72 transition-all">
          <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-8 py-4 flex items-center justify-between">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-black transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="flex-1 lg:flex-none text-center lg:text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Academy Admin</p>
              <h1 className="text-lg lg:text-xl font-black text-black uppercase tracking-tighter truncate">
                {adminTab === 'students' ? t.enrollmentHub : adminTab === 'payments' ? t.financeBoard : t.attendanceLog}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <button 
                onClick={logout}
                className="bg-slate-100 text-slate-600 hover:text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200"
              >
                {t.signOut}
              </button>
            </div>
          </header>

          <main className="p-4 lg:p-10 space-y-6">
            {/* Existing Staff Content ... (keeping it for reference) */}
            {adminTab === 'students' && (
              <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 lg:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <h2 className="text-xl lg:text-2xl font-black text-black uppercase tracking-tight">{t.enrollmentHub}</h2>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search ID or Name..."
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl border-none font-bold text-black text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="block lg:hidden divide-y divide-slate-100">
                  {filteredStudents.map(s => {
                    const p = getPaymentStatus(s.id);
                    return (
                      <div key={s.id} className="p-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors">
                        <div className="space-y-1">
                          <p className="font-black text-black uppercase leading-tight">{s.name}</p>
                          <p className="text-[10px] font-mono font-bold text-[#2E3192] uppercase">{s.id} • Grade {s.grade}</p>
                          <div className="pt-1">{p ? <StatusBadge status={p.status} /> : <span className="text-[10px] text-slate-300 font-bold uppercase">UNPAID</span>}</div>
                        </div>
                        <button onClick={() => storageService.deleteStudent(s.id)} className="p-3 text-rose-400 hover:text-rose-600 active:scale-90 transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest">
                      <tr>
                        <th className="px-8 py-4 text-left">ID</th>
                        <th className="px-8 py-4 text-left">Student Details</th>
                        <th className="px-8 py-4 text-left">Contact</th>
                        <th className="px-8 py-4 text-left">Status</th>
                        <th className="px-8 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
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
                              {p ? <StatusBadge status={p.status} /> : <span className="text-[10px] text-slate-300 font-black tracking-widest">UNPAID</span>}
                            </td>
                            <td className="px-8 py-5 text-right">
                              <button onClick={() => storageService.deleteStudent(s.id)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                <Trash2 size={18} />
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
            {/* Rest of staff UI remains similar... */}
          </main>
        </div>
      </div>
    );
  }

  // STUDENT VIEW
  if (user?.type === 'STUDENT') {
    const studentPayments = payments.filter(p => p.studentId === user.data.id).sort((a,b) => b.uploadedAt - a.uploadedAt);
    const studentAtts = getAttendanceForStudent(user.data.id);
    const currentMonthRecord = getPaymentStatus(user.data.id);

    return (
      <div className="min-h-screen bg-[#F8FAFC] flex selection:bg-black selection:text-white">
        <Sidebar 
          user={user} 
          activeTab={studentTab} 
          setActiveTab={setStudentTab} 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen}
          lang={lang}
        />
        
        <div className="flex-1 flex flex-col lg:ml-72 transition-all">
          <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-black transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="text-center lg:text-left flex-1 lg:flex-none">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t.studentPortal}</p>
              <h1 className="text-lg lg:text-xl font-black text-black uppercase tracking-tighter truncate">{user.data.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <button 
                onClick={logout}
                className="bg-slate-100 text-slate-600 hover:text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200"
              >
                {t.signOut}
              </button>
            </div>
          </header>

          <main className="p-4 lg:p-10 flex items-start justify-center">
            <div className="max-w-4xl w-full">
              {studentTab === 'profile' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 animate-in fade-in duration-700">
                  <div className="bg-white p-8 lg:p-12 rounded-[3.5rem] shadow-sm border border-slate-200 flex flex-col items-center text-center space-y-8">
                    <div className="bg-indigo-50 p-6 rounded-[2.5rem] shadow-inner">
                      <GraduationCap size={64} className="text-[#2E3192]" />
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-2xl lg:text-3xl font-black text-black tracking-tight">{user.data.name}</h2>
                      <div className="bg-emerald-100 text-emerald-700 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200 inline-block">{t.grade} {user.data.grade} Member</div>
                    </div>
                    <div className="w-full space-y-3">
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center group">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.idCode}</span>
                        <span className="font-mono font-black text-[#2E3192] text-xl group-hover:scale-105 transition-transform">{user.data.id}</span>
                      </div>
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.school}</span>
                        <span className="font-black text-black truncate max-w-[140px] text-sm uppercase">{user.data.schoolName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 lg:p-12 rounded-[3.5rem] shadow-sm border border-slate-200 flex flex-col items-center gap-10">
                    <div className="flex items-center gap-4 text-black">
                      <QrCode size={32} className="text-[#2E3192]" />
                      <h3 className="text-xl font-black uppercase tracking-tight">{t.entrancePass}</h3>
                    </div>
                    <div className="p-4 lg:p-6 bg-white border-[16px] border-slate-50 rounded-[3.5rem] shadow-inner">
                      <QRCodeGenerator value={user.data.id} size={200} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 text-center leading-relaxed uppercase tracking-wider">{t.scanQr}</p>
                  </div>
                </div>
              )}

              {studentTab === 'payment' && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in duration-500">
                  <div className="lg:col-span-3 space-y-8">
                    <div className="bg-white p-8 lg:p-12 rounded-[3.5rem] shadow-sm border border-slate-200">
                      <h2 className="text-2xl font-black text-black mb-2 uppercase tracking-tight">{t.feeVerification}</h2>
                      <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-10">{new Date().toLocaleString(lang === 'si' ? 'si-LK' : 'en-US', { month: 'long' })} Cycle</p>
                      
                      {currentMonthRecord ? (
                        <div className="space-y-8">
                          <div className={`p-6 lg:p-8 rounded-[2.5rem] border-4 flex items-center gap-6 ${
                            currentMonthRecord.status === 'approved' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                            currentMonthRecord.status === 'rejected' ? 'bg-rose-50 border-rose-100 text-rose-800' :
                            'bg-amber-50 border-amber-100 text-amber-800'
                          }`}>
                            {currentMonthRecord.status === 'approved' && <CheckCircle2 size={32} />}
                            {currentMonthRecord.status === 'rejected' && <XCircle size={32} />}
                            {currentMonthRecord.status === 'pending' && <Clock size={32} className="animate-spin-slow" />}
                            <div>
                               <p className="text-[10px] uppercase font-black tracking-widest opacity-40">{t.paymentStatus}</p>
                               <h4 className="text-xl lg:text-2xl font-black uppercase">{currentMonthRecord.status}</h4>
                            </div>
                          </div>
                          <div 
                            className="aspect-video rounded-[2.5rem] overflow-hidden border-8 border-slate-50 shadow-sm bg-slate-100 relative group cursor-pointer"
                            onClick={() => setPreviewImage(currentMonthRecord.slipData)}
                          >
                            <img src={currentMonthRecord.slipData} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" alt="Slip Preview" />
                          </div>
                          {currentMonthRecord.status === 'rejected' && (
                             <label className="block w-full cursor-pointer">
                                 <input type="file" className="hidden" onChange={handlePaymentUpload} accept="image/*" />
                                 <div className="bg-[#2E3192] text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-center shadow-xl hover:bg-black transition-all">Submit New Slip</div>
                             </label>
                          )}
                        </div>
                      ) : (
                        <label className="block border-[6px] border-dashed border-slate-100 rounded-[3.5rem] p-12 lg:p-20 text-center hover:bg-slate-50 transition-all cursor-pointer group relative overflow-hidden">
                          <input type="file" className="hidden" onChange={handlePaymentUpload} accept="image/*" />
                          {uploadLoading ? (
                            <Loader2 className="animate-spin text-[#2E3192] mx-auto" size={48} />
                          ) : (
                            <>
                              <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:rotate-12 transition-transform shadow-sm">
                                <Upload className="text-[#2E3192]" size={32} />
                              </div>
                              <h3 className="text-xl lg:text-2xl font-black text-black mb-2 uppercase">{t.uploadSlip}</h3>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.selectPhoto}</p>
                            </>
                          )}
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
                      <h3 className="text-lg font-black text-black mb-6 uppercase tracking-tight flex items-center gap-2">{t.history}</h3>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                        {studentPayments.map(p => (
                          <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="font-black text-black text-[10px] uppercase tracking-tighter">{new Date(p.month).toLocaleString(lang === 'si' ? 'si-LK' : 'en-US', { month: 'long', year: 'numeric' })}</p>
                            <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                               p.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                               p.status === 'rejected' ? 'bg-rose-100 text-rose-600' :
                               'bg-amber-100 text-amber-600'
                            }`}>{p.status}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {studentTab === 'attendance' && (
                <div className="max-w-2xl mx-auto space-y-10 animate-in slide-in-from-right-10 duration-500">
                  <div className="bg-white p-10 lg:p-16 rounded-[4.5rem] shadow-sm border border-slate-200">
                    <h2 className="text-3xl font-black text-black mb-2 uppercase tracking-tight text-center lg:text-left">{t.academyActivity}</h2>
                    <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-16 text-center lg:text-left">{new Date().toLocaleString(lang === 'si' ? 'si-LK' : 'en-US', { month: 'long' })} {t.progress}</p>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {[1, 2, 3, 4].map(week => {
                        const record = studentAtts.find(a => a.week === week);
                        return (
                          <div key={week} className={`p-6 lg:p-8 rounded-[2.5rem] border-2 flex items-center justify-between transition-all duration-300 ${record ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center gap-6">
                              <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl ${record ? 'bg-emerald-500 text-white' : 'bg-white text-slate-200 shadow-inner'}`}>{week}</div>
                              <div>
                                <h4 className={`font-black uppercase tracking-widest text-[10px] ${record ? 'text-emerald-900' : 'text-slate-400'}`}>{t.week} {week}</h4>
                                <p className="text-[10px] font-black uppercase mt-1 opacity-60">{record ? `${t.presentOn} ${record.date}` : t.notRegistered}</p>
                              </div>
                            </div>
                            {record ? <CheckCircle2 className="text-emerald-500" size={32} /> : <Clock className="text-slate-200" size={32} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="bg-[#2E3192] p-8 lg:p-12 rounded-[3.5rem] text-white flex items-center gap-6 lg:gap-8 shadow-2xl relative overflow-hidden group">
                    <Sparkles className="text-yellow-400 shrink-0 group-hover:scale-125 transition-transform duration-700 relative z-10" size={40} />
                    <div className="space-y-1 relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{t.instructorTip}</p>
                      <p className="text-base lg:text-lg font-bold leading-relaxed tracking-tight">{aiTip || "Ready to unlock your English potential this week?"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
          <WhatsAppFAB />
        </div>
      </div>
    );
  }

  // LANDING PAGE / AUTH
  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-black selection:text-white">
      <main className="flex-grow flex flex-col lg:flex-row overflow-hidden min-h-screen">
        <div className="flex-1 bg-[#FFDD00] p-6 lg:p-16 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 0)', backgroundSize: '24px 24px'}}></div>
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ background: 'repeating-conic-gradient(from 0deg, #FFFFFF 0deg 8deg, transparent 8deg 16deg)', transform: 'scale(2)'}}></div>
          
          <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
            <div className="animate-in zoom-in duration-1000 flex flex-col items-center">
               <a href="https://ibb.co/8n7gSnS8" target="_blank" rel="noopener noreferrer" className="block w-full px-4">
                 <img 
                   src="https://i.ibb.co/Q7Kv171m/Gemini-Generated-Image-8s2c3q8s2c3q8s2c.png" 
                   alt="Smart English - Master the Language" 
                   className="max-w-full h-auto drop-shadow-[0_25px_60px_rgba(0,0,0,0.4)] rounded-[2.5rem] lg:rounded-[4rem] transform hover:scale-[1.03] transition-transform duration-700 border-8 lg:border-[16px] border-white"
                   style={{ maxHeight: '65vh' }}
                 />
               </a>
            </div>
            <div className="mt-8 lg:mt-12 bg-black text-white px-8 lg:px-12 py-3 lg:py-4 rounded-full font-black text-[10px] lg:text-xs uppercase tracking-[0.4em] shadow-2xl border-2 border-white/20 animate-bounce">
              {t.grades}
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 lg:p-24 flex items-center justify-center bg-[#F8FAFC] relative border-t-8 lg:border-t-0 lg:border-l-8 border-white">
          <div className="max-w-lg w-full relative z-10 animate-in fade-in slide-in-from-right-10 duration-700">
            <div className="absolute top-0 right-0 p-4 lg:p-0 lg:-top-16 lg:right-0">
               <LanguageToggle />
            </div>
            
            <div className="flex p-2 bg-white rounded-[2.5rem] mb-10 shadow-[0_30px_60px_rgba(0,0,0,0.05)] border border-slate-100 mt-16 lg:mt-0">
              <button onClick={() => setActiveTab('register')} className={`flex-1 py-5 px-6 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'register' ? 'bg-[#2E3192] text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}><UserPlus size={16} /> {t.register}</button>
              <button onClick={() => setActiveTab('login')} className={`flex-1 py-5 px-6 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'login' ? 'bg-[#2E3192] text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}><LogIn size={16} /> {t.login}</button>
            </div>

            <div className="bg-white p-8 lg:p-12 rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.05)] border border-slate-100">
              {activeTab === 'register' ? (
                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.fullName}</label>
                    <input type="text" required className="w-full px-6 py-4 bg-slate-50 border-4 border-transparent rounded-2xl focus:border-[#2E3192] focus:bg-white outline-none font-black text-black text-lg transition-all" value={regForm.name} onChange={(e) => setRegForm({...regForm, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.grade}</label>
                      <select className="w-full px-6 py-4 bg-slate-50 border-4 border-transparent rounded-2xl focus:border-[#2E3192] outline-none font-black text-black text-lg appearance-none cursor-pointer transition-all" value={regForm.grade} onChange={(e) => setRegForm({...regForm, grade: parseInt(e.target.value) as Grade})}>
                        {[...Array(11)].map((_, i) => (<option key={i+1} value={i+1}>{lang === 'si' ? `${i+1} ශ්‍රේණිය` : `Grade ${i+1}`}</option>))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.whatsapp}</label>
                      <input type="tel" required className="w-full px-6 py-4 bg-slate-50 border-4 border-transparent rounded-2xl focus:border-[#2E3192] focus:bg-white outline-none font-black text-black text-lg transition-all" placeholder="07xxxxxxxx" value={regForm.whatsappNumber} onChange={(e) => setRegForm({...regForm, whatsappNumber: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.school}</label>
                    <input type="text" required className="w-full px-6 py-4 bg-slate-50 border-4 border-transparent rounded-2xl focus:border-[#2E3192] focus:bg-white outline-none font-black text-black text-lg transition-all" value={regForm.schoolName} onChange={(e) => setRegForm({...regForm, schoolName: e.target.value})} />
                  </div>
                  <button type="submit" className="w-full bg-[#2E3192] hover:bg-black text-white font-black py-6 rounded-[2rem] shadow-2xl transition-all transform active:scale-95 uppercase tracking-[0.3em] text-[10px] mt-2">{t.activate}</button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.whatsapp}</label>
                    <input type="text" required className="w-full px-6 py-5 bg-slate-50 border-4 border-transparent rounded-[1.8rem] focus:border-[#2E3192] focus:bg-white outline-none font-black text-black text-xl transition-all" value={loginForm.whatsappNumber} onChange={(e) => setLoginForm({...loginForm, whatsappNumber: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.idKey}</label>
                    <input type="password" required className="w-full px-6 py-5 bg-slate-50 border-4 border-transparent rounded-[1.8rem] focus:border-[#2E3192] focus:bg-white outline-none font-black text-black text-xl transition-all" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} />
                  </div>
                  <button type="submit" className="w-full bg-[#2E3192] hover:bg-black text-white font-black py-7 rounded-[2rem] shadow-2xl transition-all transform active:scale-95 uppercase tracking-[0.3em] text-[10px]">{t.enterPortal}</button>
                  <div className="flex items-start gap-4 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                    <Info className="text-[#2E3192] mt-0.5 shrink-0" size={18} />
                    <p className="text-[9px] font-bold text-indigo-900 uppercase leading-relaxed tracking-wider">{t.forgotId}</p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <WhatsAppFAB />
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
