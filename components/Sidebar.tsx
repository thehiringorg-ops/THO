
import React from 'react';
import { LayoutDashboard, Briefcase, FilePlus, UserCheck, LogOut, Globe, Users, Building2, Search, UserCircle, PieChart, BarChart3, ShieldAlert, Settings, EyeOff, Bell, Coins, CalendarRange, X, BookOpen, MessageCircle, Lock, Unlock, BriefcaseBusiness, LifeBuoy, Banknote } from 'lucide-react';
import { ViewState, User, Permission } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  currentUser?: User | null;
  onLogout: () => void;
  pendingCount?: number;
  impersonatingAdmin?: User | null; 
  onStopImpersonation?: () => void;
  isOpen: boolean;
  onClose: () => void;
  onRequestAccess?: () => void;
  chatUnreadCount?: number;
  allUsers?: User[];
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setView, 
  currentUser, 
  onLogout, 
  pendingCount = 0, 
  impersonatingAdmin, 
  onStopImpersonation,
  isOpen,
  onClose,
  onRequestAccess,
  chatUnreadCount = 0
}) => {
  const role = impersonatingAdmin ? currentUser?.role : currentUser?.role;
  
  const isSuperAdmin = role === 'SuperAdmin';
  const isAdmin = role === 'Admin' || isSuperAdmin;
  const isGuest = role === 'Guest';
  const unreadNotifications = currentUser?.notifications?.filter(n => !n.read).length || 0;

  const hasPermission = (perm: Permission) => {
      return isSuperAdmin || (currentUser?.permissions && currentUser.permissions?.includes(perm));
  };

  const navItems = [
    { id: ViewState.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: ViewState.JOBS, label: 'Active Jobs', icon: Briefcase },
    { id: ViewState.CREATE_JOB, label: 'Post New Job', icon: FilePlus, permission: 'CREATE_JOB' }, 
    { id: ViewState.SCREENING, label: 'AI Screener', icon: UserCheck },
    { id: ViewState.CANDIDATES_LIST, label: 'Candidates', icon: UserCircle },
    { id: ViewState.LEADS, label: 'Leads Report', icon: Search },
    { id: ViewState.TEAM, label: 'Team', icon: Users, permission: 'MANAGE_TEAM' }, 
    { id: ViewState.CLIENTS, label: 'Clients', icon: Building2 },
  ];

  const getBoardTitle = () => {
      if (isSuperAdmin) return 'Executive Board';
      if (isAdmin) return 'Management Board';
      if (isGuest) return 'Guest View';
      return 'My Board';
  };

  const getBoardColor = () => {
      if (isSuperAdmin) return 'text-amber-400';
      if (isAdmin) return 'text-blue-400';
      return 'text-emerald-400';
  };

  const handleNavClick = (view: ViewState) => {
      setView(view);
      onClose(); 
  };

  const canAccessSettings = isSuperAdmin || hasPermission('MANAGE_SYSTEM_SETTINGS') || hasPermission('EMERGENCY_ACCESS');

  return (
    <>
        {/* Mobile Overlay */}
        {isOpen && (
            <div 
                className="fixed inset-0 bg-slate-900/60 z-30 md:hidden backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
        )}

        {/* Sidebar Container */}
        <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-slate-300 flex flex-col h-screen shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:shadow-none shrink-0 border-r border-slate-800`}>
          
          {/* Impersonation Banner */}
          {impersonatingAdmin && (
              <div className="bg-gradient-to-r from-orange-600 to-red-600 p-3 text-xs text-center font-bold text-white flex flex-col gap-1 shadow-inner">
                  <div className="flex items-center justify-center gap-2">
                      <EyeOff size={12}/>
                      <span>VIEWING AS: {currentUser?.name.toUpperCase()}</span>
                  </div>
                  <button 
                     onClick={onStopImpersonation}
                     className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-[10px] transition-colors w-fit mx-auto border border-white/30"
                  >
                      EXIT VIEW
                  </button>
              </div>
          )}

          <div className="p-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-white to-slate-200 rounded-xl flex items-center justify-center overflow-hidden p-1 shadow-lg shadow-slate-900/50">
                 <img 
                  src="https://cdn1.site-media.eu/images/0/18949945/SlateBlueTHOlogo-YALN5aQrIMvAv5iD9degXQ.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                 />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white">The Hiring Org</h1>
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Recruitment OS</span>
              </div>
            </div>
            <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white transition-colors">
                <X size={24}/>
            </button>
          </div>
          
          <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {/* Access Request Button */}
            {(!isSuperAdmin && onRequestAccess) && (
                <div className="mb-6 px-2">
                    <button 
                        onClick={onRequestAccess}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-600/20 transition-all border border-white/5"
                    >
                        <Unlock size={14}/> Request Access
                    </button>
                </div>
            )}

            <div className="mb-6 space-y-1">
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 mt-2">Recruitment Operations</p>
              
              <button
                onClick={() => handleNavClick(ViewState.NOTIFICATIONS)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                  currentView === ViewState.NOTIFICATIONS
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-900/20 font-medium' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                    <Bell size={18} className={currentView === ViewState.NOTIFICATIONS ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                    <span>Notifications</span>
                </div>
                {unreadNotifications > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {unreadNotifications}
                    </span>
                )}
              </button>

              <button
                onClick={() => handleNavClick(ViewState.CHAT)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                  currentView === ViewState.CHAT 
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-900/20 font-medium' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                    <MessageCircle size={18} className={currentView === ViewState.CHAT ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                    <span>Team Chat</span>
                </div>
                {chatUnreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {chatUnreadCount}
                    </span>
                )}
              </button>

              {hasPermission('APPROVE_JOB') && (
                 <button
                    onClick={() => handleNavClick(ViewState.APPROVALS)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                      currentView === ViewState.APPROVALS
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-900/20 font-medium' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                       <ShieldAlert size={18} className={currentView === ViewState.APPROVALS ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                       <span>Approvals</span>
                    </div>
                    {pendingCount > 0 && (
                       <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                           {pendingCount}
                       </span>
                    )}
                  </button>
              )}

              <button
                onClick={() => handleNavClick(ViewState.SPECIALISED_SERVICES)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                  currentView === ViewState.SPECIALISED_SERVICES
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-900/20 font-medium' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <BriefcaseBusiness size={18} className={currentView === ViewState.SPECIALISED_SERVICES ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                <span>Specialised Services</span>
              </button>

              {navItems.map((item) => {
                if (item.id === ViewState.CREATE_JOB && !hasPermission('CREATE_JOB')) return null;
                if (isGuest) {
                    const allowed = [ViewState.DASHBOARD, ViewState.JOBS, ViewState.CANDIDATES_LIST, ViewState.TEAM];
                    if (!allowed.includes(item.id)) return null;
                }
                if (item.id === ViewState.TEAM && !hasPermission('MANAGE_TEAM') && !isAdmin) {
                    // Everyone can see Team
                }

                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                      isActive 
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-900/20 font-medium' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
              
            <div className="mt-8 mb-4 px-4 flex items-center gap-3">
                 <div className="h-px bg-slate-700 flex-1"></div>
                 <p className={`text-[10px] font-bold uppercase tracking-widest ${getBoardColor()}`}>{getBoardTitle()}</p>
                 <div className="h-px bg-slate-700 flex-1"></div>
            </div>

            <div className="space-y-1">
              {!isGuest && (
                  <>
                    <button
                        onClick={() => handleNavClick(ViewState.MONTHLY_REPORTS)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                        currentView === ViewState.MONTHLY_REPORTS
                            ? 'bg-slate-800 text-white border-l-2 border-emerald-500 pl-[14px]' 
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-2 border-transparent'
                        }`}
                    >
                        <CalendarRange size={18} className={currentView === ViewState.MONTHLY_REPORTS ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'} />
                        <span>Reports & Activity</span>
                    </button>
                    
                    <button
                        onClick={() => handleNavClick(ViewState.COMMISSIONS)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                        currentView === ViewState.COMMISSIONS 
                            ? 'bg-slate-800 text-white border-l-2 border-emerald-500 pl-[14px]' 
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-2 border-transparent'
                        }`}
                    >
                        <Coins size={18} className={currentView === ViewState.COMMISSIONS ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'} />
                        <span>Commissions</span>
                    </button>
                  </>
              )}

              {(isAdmin || hasPermission('MANAGE_PAYROLL')) && (
                  <button
                    onClick={() => handleNavClick(ViewState.PAYROLL)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                      currentView === ViewState.PAYROLL
                        ? 'bg-slate-800 text-white border-l-2 border-emerald-500 pl-[14px]' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-2 border-transparent'
                    }`}
                  >
                    <Banknote size={18} className={currentView === ViewState.PAYROLL ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'} />
                    <span>Payroll</span>
                  </button>
              )}

              {(isAdmin || hasPermission('VIEW_FINANCIALS')) && (
                  <button
                    onClick={() => handleNavClick(ViewState.FINANCIALS)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                      currentView === ViewState.FINANCIALS 
                        ? 'bg-slate-800 text-white border-l-2 border-blue-500 pl-[14px]' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-2 border-transparent'
                    }`}
                  >
                    <PieChart size={18} className={currentView === ViewState.FINANCIALS ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
                    <span>Client Financials</span>
                  </button>
              )}
                  
              {isAdmin && (
                  <button
                    onClick={() => handleNavClick(ViewState.EXECUTIVE_ANALYTICS)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                      currentView === ViewState.EXECUTIVE_ANALYTICS
                        ? 'bg-slate-800 text-white border-l-2 border-blue-500 pl-[14px]' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-2 border-transparent'
                    }`}
                  >
                    <BarChart3 size={18} className={currentView === ViewState.EXECUTIVE_ANALYTICS ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'} />
                    <span>Analytics & KPI</span>
                  </button>
              )}

              {canAccessSettings && (
                <button
                  onClick={() => handleNavClick(ViewState.SUPER_ADMIN_SETTINGS)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                    currentView === ViewState.SUPER_ADMIN_SETTINGS
                      ? 'bg-slate-800 text-white border-l-2 border-amber-500 pl-[14px]' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-2 border-transparent'
                  }`}
                >
                  <Settings size={18} className={currentView === ViewState.SUPER_ADMIN_SETTINGS ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'} />
                  <span>System Settings</span>
                </button>
              )}
              
              <button
                onClick={() => handleNavClick(ViewState.SUPPORT)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                  currentView === ViewState.SUPPORT
                    ? 'bg-slate-800 text-white border-l-2 border-red-500 pl-[14px]' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-2 border-transparent'
                }`}
              >
                <LifeBuoy size={18} className={currentView === ViewState.SUPPORT ? 'text-red-500' : 'text-slate-500 group-hover:text-slate-300'} />
                <span>System Support</span>
              </button>
            </div>

            {/* Learning Section */}
            <div className="mt-6 space-y-1">
               <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Knowledge Base</p>
               <button
                  onClick={() => handleNavClick(ViewState.TUTORIALS)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                    currentView === ViewState.TUTORIALS
                      ? 'bg-slate-800 text-white shadow-sm' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <BookOpen size={18} className={currentView === ViewState.TUTORIALS ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                  <span>Tutorials & Guides</span>
                </button>
            </div>
          </nav>

          <div className="p-4 bg-slate-900 border-t border-slate-800">
            {currentUser ? (
              <div className="flex items-center gap-3 px-1 relative">
                <div 
                    className="cursor-pointer flex items-center gap-3 flex-1 hover:bg-slate-800 rounded-xl p-2 transition-all group"
                    onClick={() => handleNavClick(ViewState.PROFILE)}
                    title="My Profile"
                >
                    <div className="relative">
                        <img 
                        src={currentUser.avatar} 
                        alt={currentUser.name} 
                        className={`w-9 h-9 rounded-full border-2 object-cover shadow-sm group-hover:scale-105 transition-transform ${isSuperAdmin ? 'border-amber-400' : 'border-slate-500'}`}
                        />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-800 rounded-full"></div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-slate-200 truncate group-hover:text-white">{currentUser.name}</p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <span className={`truncate uppercase tracking-wide ${isSuperAdmin ? 'text-amber-400 font-bold' : ''}`}>
                                {currentUser.role}
                            </span>
                        </div>
                    </div>
                </div>
                <button 
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={onLogout}
                className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white w-full transition-colors hover:bg-slate-800 rounded-xl"
              >
                <LogOut size={20} />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
    </>
  );
};

export default Sidebar;
