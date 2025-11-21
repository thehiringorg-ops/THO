
import React from 'react';
import { LayoutDashboard, Briefcase, FilePlus, UserCheck, LogOut, Globe, Users, Building2, Search, UserCircle, PieChart } from 'lucide-react';
import { ViewState, User } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  currentUser?: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, currentUser, onLogout }) => {
  const isSuperAdmin = currentUser?.role === 'SuperAdmin';

  const navItems = [
    { id: ViewState.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: ViewState.JOBS, label: 'Active Jobs', icon: Briefcase },
    { id: ViewState.CREATE_JOB, label: 'Post New Job', icon: FilePlus },
    { id: ViewState.SCREENING, label: 'AI Screener', icon: UserCheck },
    { id: ViewState.CANDIDATES_LIST, label: 'Candidates', icon: UserCircle },
    { id: ViewState.LEADS, label: 'Leads Report', icon: Search },
    { id: ViewState.TEAM, label: 'Team', icon: Users },
    { id: ViewState.CLIENTS, label: 'Clients', icon: Building2 },
  ];

  return (
    <div className="w-64 bg-slate-800 text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-10">
      <div className="p-6 border-b border-slate-700 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden p-1">
             <img 
              src="https://cdn1.site-media.eu/images/0/18949945/SlateBlueTHOlogo-YALN5aQrIMvAv5iD9degXQ.png" 
              alt="Logo" 
              className="w-full h-full object-contain"
             />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight leading-none text-white">The Hiring Org</h1>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Recruitment</span>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="mb-6">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recruiter Admin</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-900/20' 
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
          
          {/* SuperAdmin Only: Financials */}
          {isSuperAdmin && (
            <>
              <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-6 text-amber-500">Executive</p>
              <button
                onClick={() => setView(ViewState.FINANCIALS)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  currentView === ViewState.FINANCIALS 
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-900/20' 
                    : 'text-amber-200 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <PieChart size={20} />
                <span className="font-medium">Client Financials</span>
              </button>
            </>
          )}
        </div>

        <div>
           <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Public View</p>
           <button
              onClick={() => setView(ViewState.CANDIDATE_PORTAL)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                currentView === ViewState.CANDIDATE_PORTAL
                  ? 'bg-slate-700 text-white shadow-md shadow-slate-900/20' 
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Globe size={20} />
              <span className="font-medium">Candidate Portal</span>
            </button>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-700 bg-slate-900/30">
        {currentUser ? (
          <div className="flex items-center gap-3 px-2">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className={`w-10 h-10 rounded-full border-2 object-cover ${isSuperAdmin ? 'border-amber-400' : 'border-slate-600'}`}
            />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                 <span className={`truncate max-w-[80px] ${isSuperAdmin ? 'text-amber-400 font-bold' : ''}`}>
                    {currentUser.role}
                 </span>
                 {currentUser.status === 'Pending' && <span className="text-orange-400">(Pending)</span>}
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white w-full transition-colors"
          >
            <LogOut size={20} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
