import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  LogIn, 
  QrCode, 
  Trash2, 
  Search, 
  Sparkles,
  GraduationCap,
  Loader2,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Info,
  MessageCircle,
  Menu,
  Globe,
  ArrowRight,
  Star,
  ShieldCheck
} from 'lucide-react';
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

  // Sidebar State
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
      alert("Invalid details. Use your STU-ID as the password.");
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
        alert("Payment slip uploaded successfully!");
      } catch (err) {
        alert("Upload failed.");
      } finally {
        setUploadLoading(false);
      }
    };
    reader.readAsDataURL(file);
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
      className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-md border border-slate-100 text-black text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all group"
    >
      <Globe size={16} className="text-[#2E3192] group-hover:rotate-12 transition-transform" />
      {lang === 'en' ? 'සිංහල' : 'English'}
    </button>
  );

  const WhatsAppFAB = () => (
    <a 
      href="https://wa.me/94770612011" 
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-[60] bg-[#25D366] text-white p-4 lg:p-5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group flex items-center gap-3 border-4 border-white"
    >
      <span className="hidden md:inline font-black uppercase tracking-widest text-[10px]">{t.supportDesk}</span>
      <MessageCircle size={24} />
    </a>
  );

  // STAFF VIEW
  if (user?.type === 'STAFF') {
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
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:text-black"><Menu size={24} /></button>
            <div className="flex-1 lg:flex-none">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Academy Admin</p>
              <h1 className="text-lg lg:text-xl font-black text-black uppercase truncate">{adminTab === 'students' ? t.enrollmentHub : t.financeBoard}</h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <button onClick={logout} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-slate-200">{t.signOut}</button>
            </div>
          </header>

          <main className="p-4 lg:p-10 space-y-6">
            {adminTab === 'students' && (
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 lg:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <h2 className="text-xl font-black text-black uppercase">{t.enrollmentHub}</h2>
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black">
                      <tr>
                        <th className="px-8 py-4 text-left">ID</th>
                        <th className="px-8 py-4 text-left">Details</th>
                        <th className="px-8 py-4 text-left">Contact</th>
                        <th className="px-8 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(s => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="px-8 py-5 font-mono font-black text-[#2E3192]">{s.id}</td>
                          <td className="px-8 py-5">
                            <div className="font-black text-black uppercase">{s.name}</div>
                            <div className="text-xs text-slate-400 font-bold uppercase">Grade {s.grade} • {s.schoolName}</div>
                          </td>
                          <td className="px-8 py-5 font-bold text-slate-600">{s.whatsappNumber}</td>
                          <td className="px-8 py-5 text-right">
                            <button onClick={() => storageService.deleteStudent(s.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={18} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Payment Verification Logic would go here */}
          </main>
        </div>
      </div>
    );
  }

  // STUDENT VIEW
  if (user?.type === 'STUDENT') {
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
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500"><Menu size={24} /></button>
            <div className="text-center lg:text-left flex-1 lg:flex-none">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.studentPortal}</p>
              <h1 className="text-lg lg:text-xl font-black text-black uppercase truncate">{user.data.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <button onClick={logout} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase border border-slate-200">{t.signOut}</button>
            </div>
          </header>

          <main className="p-4 lg:p-10 flex items-start justify-center">
            <div className="max-w-4xl w-full">
              {studentTab === 'profile' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-700">
                  <div className="bg-white p-8 lg:p-12 rounded-[3rem] shadow-sm border border-slate-200 flex flex-col items-center text-center space-y-8">
                    <div className="bg-indigo-50 p-6 rounded-3xl shadow-inner">
                      <GraduationCap size={64} className="text-[#2E3192]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-black uppercase mb-2">{user.data.name}</h2>
                      <div className="bg-emerald-100 text-emerald-700 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200 inline-block">{t.grade} {user.data.grade}</div>
                    </div>
                    <div className="w-full space-y-3">
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.idCode}</span>
                        <span className="font-mono font-black text-[#2E3192] text-xl">{user.data.id}</span>
                      </div>
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.school}</span>
                        <span className="font-black text-black truncate max-w-[140px] text-sm uppercase">{user.data.schoolName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 lg:p-12 rounded-[3rem] shadow-sm border border-slate-200 flex flex-col items-center gap-8">
                    <div className="flex items-center gap-3 text-black">
                      <QrCode size={32} className="text-[#2E3192]" />
                      <h3 className="text-xl font-black uppercase tracking-tight">{t.entrancePass}</h3>
                    </div>
                    <div className="p-4 bg-white border-[12px] border-slate-50 rounded-[3rem] shadow-inner">
                      <QRCodeGenerator value={user.data.id} size={200} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">{t.scanQr}</p>
                  </div>
                </div>
              )}
              {/* Payment and Attendance tabs follow similar aesthetic logic */}
            </div>
          </main>
          <WhatsAppFAB />
        </div>
      </div>
    );
  }

  // LANDING PAGE / AUTH
  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-[#2E3192] selection:text-white">
      <main className="flex-grow flex flex-col lg:flex-row min-h-screen">
        {/* Left Side: Brand & Hero */}
        <div className="flex-1 bg-[#FFDD00] p-6 lg:p-16 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 0)', backgroundSize: '30px 30px'}}></div>
          
          <div className="relative z-10 flex flex-col items-center max-w-2xl w-full">
            <div className="animate-in zoom-in duration-1000 flex flex-col items-center">
               <div className="relative group">
                 <div className="absolute -inset-4 bg-white/20 rounded-[3rem] blur-2xl group-hover:bg-white/40 transition-all duration-700"></div>
                 <img 
                   src="https://i.ibb.co/Q7Kv171m/Gemini-Generated-Image-8s2c3q8s2c3q8s2c.png" 
                   alt="Smart English" 
                   className="relative max-w-full h-auto drop-shadow-2xl rounded-[3rem] lg:rounded-[4.5rem] transform hover:rotate-1 hover:scale-[1.02] transition-all duration-700 border-8 lg:border-[16px] border-white"
                   style={{ maxHeight: '60vh' }}
                 />
                 <div className="absolute -bottom-6 -right-6 bg-white p-4 lg:p-6 rounded-[2rem] shadow-2xl border-4 border-[#FFDD00] animate-bounce hidden lg:block">
                    <Star className="text-[#2E3192] fill-[#2E3192]" size={32} />
                 </div>
               </div>
            </div>
            
            <div className="mt-12 flex flex-col items-center gap-4">
              <h2 className="text-4xl lg:text-6xl font-black text-black uppercase tracking-tighter leading-none italic">Smart English</h2>
              <div className="bg-black text-white px-8 py-3 rounded-full font-black text-[10px] lg:text-xs uppercase tracking-[0.4em] shadow-xl border-2 border-white/10">
                {t.grades}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Portal */}
        <div className="flex-1 p-6 lg:p-20 flex items-center justify-center bg-white relative">
          <div className="max-w-md w-full relative z-10 animate-in slide-in-from-right-10 duration-700">
            <div className="flex justify-between items-center mb-10">
               <div className="flex items-center gap-2">
                 <div className="w-10 h-10 bg-[#2E3192] rounded-xl flex items-center justify-center text-white font-black">S</div>
                 <span className="font-black uppercase tracking-widest text-[10px] text-slate-400">Portal Access</span>
               </div>
               <LanguageToggle />
            </div>
            
            <div className="flex p-1.5 bg-slate-100 rounded-[2rem] mb-8 shadow-inner">
              <button 
                onClick={() => setActiveTab('register')} 
                className={`flex-1 py-4 px-6 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'register' ? 'bg-[#2E3192] text-white shadow-xl' : 'text-slate-400'}`}
              >
                <UserPlus size={14} /> {t.register}
              </button>
              <button 
                onClick={() => setActiveTab('login')} 
                className={`flex-1 py-4 px-6 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'login' ? 'bg-[#2E3192] text-white shadow-xl' : 'text-slate-400'}`}
              >
                <LogIn size={14} /> {t.login}
              </button>
            </div>

            <div className="bg-white p-8 lg:p-10 rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.08)] border border-slate-50">
              {activeTab === 'register' ? (
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">{t.fullName}</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#2E3192] focus:bg-white outline-none font-black text-black text-base transition-all" 
                      placeholder="e.g. John Doe"
                      value={regForm.name} 
                      onChange={(e) => setRegForm({...regForm, name: e.target.value})} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">{t.grade}</label>
                      <select 
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#2E3192] outline-none font-black text-black text-base appearance-none cursor-pointer"
                        value={regForm.grade} 
                        onChange={(e) => setRegForm({...regForm, grade: parseInt(e.target.value) as Grade})}
                      >
                        {[...Array(11)].map((_, i) => (
                          <option key={i+1} value={i+1}>{lang === 'si' ? `${i+1} ශ්‍රේණිය` : `Grade ${i+1}`}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">{t.whatsapp}</label>
                      <input 
                        type="tel" 
                        required 
                        className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#2E3192] focus:bg-white outline-none font-black text-black text-base" 
                        placeholder="07xxxxxxxx" 
                        value={regForm.whatsappNumber} 
                        onChange={(e) => setRegForm({...regForm, whatsappNumber: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">{t.school}</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#2E3192] focus:bg-white outline-none font-black text-black text-base" 
                      placeholder="Enter School Name"
                      value={regForm.schoolName} 
                      onChange={(e) => setRegForm({...regForm, schoolName: e.target.value})} 
                    />
                  </div>
                  <button type="submit" className="w-full bg-[#2E3192] hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl transition-all transform active:scale-95 uppercase tracking-[0.2em] text-xs mt-2 flex items-center justify-center gap-2">
                    {t.activate} <ArrowRight size={16} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">{t.whatsapp}</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#2E3192] focus:bg-white outline-none font-black text-black text-base" 
                      value={loginForm.whatsappNumber} 
                      onChange={(e) => setLoginForm({...loginForm, whatsappNumber: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">{t.idKey}</label>
                    <input 
                      type="password" 
                      required 
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#2E3192] focus:bg-white outline-none font-black text-black text-base" 
                      value={loginForm.password} 
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} 
                    />
                  </div>
                  <button type="submit" className="w-full bg-[#2E3192] hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl transition-all transform active:scale-95 uppercase tracking-[0.2em] text-xs">
                    {t.enterPortal}
                  </button>
                  <div className="flex items-start gap-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                    <ShieldCheck className="text-[#2E3192] mt-0.5 shrink-0" size={16} />
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