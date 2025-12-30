
import React from 'react';
import { 
  Users, 
  CreditCard, 
  Calendar, 
  User, 
  ChevronRight,
  GraduationCap,
  MessageSquare
} from 'lucide-react';
import { AuthUser } from '../types';
import { translations, Language } from '../translations';

interface SidebarProps {
  user: AuthUser;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  lang: Language;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, setActiveTab, isOpen, setIsOpen, lang }) => {
  if (!user) return null;
  const t = translations[lang];

  const staffItems = [
    { id: 'students', icon: Users, label: t.enrollmentHub },
    { id: 'payments', icon: CreditCard, label: t.financeBoard },
    { id: 'attendance', icon: Calendar, label: t.attendanceLog },
  ];

  const studentItems = [
    { id: 'profile', icon: User, label: t.digitalId },
    { id: 'payment', icon: CreditCard, label: t.feePayments },
    { id: 'attendance', icon: Calendar, label: t.sessionHistory },
  ];

  const menuItems = user.type === 'STAFF' ? staffItems : studentItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-slate-100 z-50 transform transition-transform duration-300 ease-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full shadow-none'}`}>
        <div className="flex flex-col h-full p-6">
          {/* Logo Section */}
          <div className="flex items-center gap-3 mb-12 px-2">
            <div className="bg-[#2E3192] p-2 rounded-xl">
              <GraduationCap className="text-white" size={24} />
            </div>
            <span className="font-black text-black uppercase tracking-tighter text-lg">{t.brand}</span>
          </div>

          {/* User Profile Summary */}
          <div className="mb-10 px-2">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-[#2E3192]">
                <User size={20} />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t.signedInAs}</p>
                <p className="font-black text-black text-sm truncate uppercase tracking-tighter">
                  {user.type === 'STAFF' ? 'Administrator' : user.data.name}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                  activeTab === item.id 
                    ? 'bg-[#2E3192] text-white shadow-xl shadow-indigo-100 scale-[1.02]' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-black'
                }`}
              >
                <div className="flex items-center gap-4">
                  <item.icon size={20} />
                  <span className="font-black uppercase tracking-widest text-[10px]">{item.label}</span>
                </div>
                {activeTab === item.id && <ChevronRight size={14} className="animate-pulse" />}
              </button>
            ))}
          </nav>

          {/* WhatsApp Support Link in Sidebar */}
          <div className="mt-auto">
            <a 
              href="https://wa.me/94770612011" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 transition-colors group"
            >
              <MessageSquare size={20} className="group-hover:rotate-12 transition-transform" />
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{t.helpDesk}</p>
                <p className="font-black text-sm tracking-tight">+94 77 061 2011</p>
              </div>
            </a>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
