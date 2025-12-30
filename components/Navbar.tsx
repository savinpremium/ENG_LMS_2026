
import React from 'react';
import { GraduationCap, LogOut, User } from 'lucide-react';
import { AuthUser } from '../types';

interface Props {
  user: AuthUser;
  onLogout: () => void;
}

const Navbar: React.FC<Props> = ({ user, onLogout }) => {
  return (
    <nav className="bg-indigo-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-8 w-8 text-indigo-200" />
            <span className="text-xl font-bold tracking-tight">Smart English</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="flex items-center space-x-2 bg-indigo-800 px-3 py-1.5 rounded-full text-sm font-medium">
                  <User size={16} />
                  <span>
                    {user.type === 'STAFF' ? 'Staff Admin' : user.data.name}
                  </span>
                </div>
                <button 
                  onClick={onLogout}
                  className="p-2 hover:bg-indigo-600 rounded-full transition-colors flex items-center space-x-1"
                >
                  <LogOut size={20} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
