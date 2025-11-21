
import React from 'react';
import { User, ViewState } from '../types';
import { Users, ArrowRight, Globe } from 'lucide-react';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  onPublicView: () => void;
}

const Login: React.FC<LoginProps> = ({ users, onLogin, onPublicView }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Left Side: Branding */}
        <div className="bg-slate-800 p-12 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-orange-500 blur-3xl"></div>
             <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-blue-500 blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center overflow-hidden p-1 mb-6">
                <img 
                  src="https://cdn1.site-media.eu/images/0/18949945/SlateBlueTHOlogo-YALN5aQrIMvAv5iD9degXQ.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                />
            </div>
            <h1 className="text-3xl font-bold mb-2">The Hiring Org</h1>
            <p className="text-slate-400">Recruitment Management System</p>
          </div>

          <div className="relative z-10">
             <button 
               onClick={onPublicView}
               className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
             >
               <Globe size={18} />
               <span className="group-hover:underline">Go to Public Candidate Portal</span>
               <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
             </button>
          </div>
        </div>

        {/* Right Side: User Selection */}
        <div className="p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
            <p className="text-slate-500 mt-1">Select your profile to sign in to the dashboard.</p>
          </div>

          <div className="space-y-4">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => onLogin(user)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-orange-500 hover:shadow-md hover:shadow-orange-500/5 bg-white transition-all group text-left"
              >
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 group-hover:border-orange-200"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 group-hover:text-orange-600 transition-colors">{user.name}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{user.role}</p>
                </div>
                <ArrowRight size={20} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
              </button>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400">
               Secure Internal Access Only • The Hiring Org &copy; {new Date().getFullYear()}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
