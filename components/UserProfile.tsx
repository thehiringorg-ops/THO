
import React, { useState, useRef, useEffect } from 'react';
import { User, AVAILABLE_PERMISSIONS, ActivityLog, UserAvailability } from '../types';
import { User as UserIcon, Mail, Hash, Target, Shield, Briefcase, Lock, Save, Camera, CheckCircle, Globe, Wrench, Activity, AlertTriangle, ToggleRight, Clock, Phone, Building, Info, Users, ChevronDown, ArrowDown } from 'lucide-react';

interface UserProfileProps {
  currentUser: User;
  allUsers?: User[];
  onUpdateUser: (user: User) => void;
  activityLogs?: ActivityLog[];
}

const STATUS_OPTIONS: { value: UserAvailability; label: string; color: string }[] = [
    { value: 'Online', label: 'Online', color: 'bg-green-500' },
    { value: 'Busy', label: 'Busy', color: 'bg-red-500' },
    { value: 'Away', label: 'Away', color: 'bg-yellow-500' },
    { value: 'In a Meeting', label: 'In a Meeting', color: 'bg-purple-500' },
    { value: 'Out of Office', label: 'Out of Office', color: 'bg-slate-400' }
];

const UserProfile: React.FC<UserProfileProps> = ({ currentUser, allUsers = [], onUpdateUser, activityLogs = [] }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'activity'>('overview');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentStatus, setCurrentStatus] = useState<UserAvailability>(currentUser.availability || 'Online');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      setCurrentStatus(currentUser.availability || 'Online');
  }, [currentUser]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onUpdateUser({ ...currentUser, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newStatus = e.target.value as UserAvailability;
      setCurrentStatus(newStatus);
      onUpdateUser({ ...currentUser, availability: newStatus });
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword === confirmPassword && newPassword.length >= 6) {
      onUpdateUser({ ...currentUser, password: newPassword });
      setNewPassword('');
      setConfirmPassword('');
      alert("Password updated successfully.");
    } else {
      alert("Passwords do not match or are too short.");
    }
  };

  // Filter logs for this user
  const myLogs = activityLogs.filter(log => log.userId === currentUser.id);

  // Hierarchy Logic
  const manager = allUsers.find(u => u.id === currentUser.reportsTo);
  const directReports = allUsers.filter(u => u.reportsTo === currentUser.id);

  const UserCardCompact = ({ user, label, highlight = false }: { user: User, label?: string, highlight?: boolean }) => (
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${highlight ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-white border-slate-200'}`}>
          <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-100"/>
          <div>
              {label && <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">{label}</p>}
              <p className={`text-sm font-bold ${highlight ? 'text-orange-900' : 'text-slate-800'}`}>{user.name}</p>
              <p className="text-xs text-slate-500">{user.role}</p>
          </div>
      </div>
  );

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn pb-20">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>
        <p className="text-slate-500 mt-1">Manage your personal information and account settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Identity Column (Left) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-slate-800 to-slate-900"></div>
            <div className="px-6 pb-6 relative">
              <div className="relative -mt-12 mb-4 inline-block group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white"/>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAvatarChange}
                />
              </div>
              
              <h3 className="text-xl font-bold text-slate-800">{currentUser.name}</h3>
              <p className="text-slate-500 text-sm mb-4">{currentUser.role}</p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  currentUser.role === 'SuperAdmin' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                  currentUser.role === 'Admin' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {currentUser.role}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 flex items-center gap-1">
                  <CheckCircle size={10}/> {currentUser.status}
                </span>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-bold uppercase">Staff ID</p>
                    <div className="flex items-center gap-2 text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100 font-mono">
                      <Hash size={14} className="text-slate-400"/>
                      {currentUser.staffNumber}
                    </div>
                </div>
                
                <div className="space-y-1">
                    <p className="text-xs text-slate-400 font-bold uppercase">Corporate Email</p>
                    <div className="flex items-center gap-2 text-sm text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                      <Mail size={14} className="text-slate-400"/>
                      <span className="truncate">{currentUser.email}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <p className="text-xs text-slate-400 font-bold uppercase">Phone</p>
                        <div className="flex items-center gap-2 text-xs text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                          <Phone size={12} className="text-slate-400"/>
                          <span>{currentUser.phoneNumber || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs text-slate-400 font-bold uppercase">Ext</p>
                        <div className="flex items-center gap-2 text-xs text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                          <Building size={12} className="text-slate-400"/>
                          <span>{currentUser.officeExtension || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div className="bg-amber-50 text-amber-800 text-[10px] p-2 rounded border border-amber-100 leading-tight flex gap-2">
                    <Info size={14} className="shrink-0 mt-0.5"/>
                    <span>Contact Admin to update these personal details.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Column (Right) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
            <div className="flex border-b border-slate-100 overflow-x-auto">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Organization & Settings
              </button>
              <button 
                onClick={() => setActiveTab('security')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'security' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Security
              </button>
              <button 
                onClick={() => setActiveTab('activity')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'activity' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Activity Log
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  
                  {/* Status Setting */}
                  <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                      <div>
                          <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                              <Clock size={16} className="text-blue-500"/> Current Availability
                          </h4>
                          <p className="text-xs text-slate-500 mt-1">This status will be visible to the team and in chats.</p>
                      </div>
                      <div className="relative">
                          <select 
                              value={currentStatus} 
                              onChange={handleStatusChange}
                              className="appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-4 pr-10 rounded-lg text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[160px]"
                          >
                              {STATUS_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                          </select>
                          <div className={`absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${STATUS_OPTIONS.find(s => s.value === currentStatus)?.color} pointer-events-none`}></div>
                      </div>
                  </section>

                  {/* Reporting Structure */}
                  <section>
                      <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Users size={18} className="text-indigo-500"/> Reporting Structure
                      </h4>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col items-center">
                          {/* Manager */}
                          {manager ? (
                              <>
                                <UserCardCompact user={manager} label="Reports To (Manager)" />
                                <div className="h-6 w-0.5 bg-slate-300 my-1"></div>
                                <ArrowDown size={16} className="text-slate-300 -mt-2 mb-1"/>
                              </>
                          ) : (
                              <div className="text-xs text-slate-400 italic mb-4 border border-dashed border-slate-300 px-4 py-2 rounded">No Direct Manager (Top Level)</div>
                          )}

                          {/* Self */}
                          <UserCardCompact user={currentUser} highlight={true} label="You" />

                          {/* Subordinates */}
                          {directReports.length > 0 && (
                              <>
                                  <div className="h-6 w-0.5 bg-slate-300 my-1"></div>
                                  <div className="w-full border-t border-slate-300 relative top-0"></div>
                                  <div className="flex flex-wrap justify-center gap-4 mt-4 w-full">
                                      {directReports.map(report => (
                                          <div key={report.id} className="flex flex-col items-center relative">
                                              <div className="h-4 w-0.5 bg-slate-300 absolute -top-4"></div>
                                              <UserCardCompact user={report} />
                                          </div>
                                      ))}
                                  </div>
                              </>
                          )}
                          {directReports.length === 0 && (
                              <div className="mt-4 text-xs text-slate-400 italic">No direct reports assigned.</div>
                          )}
                      </div>
                  </section>

                  {/* Specialisations Section */}
                  <section>
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Briefcase size={18} className="text-blue-500"/> Assigned Specialisations
                    </h4>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                        <div className="flex flex-wrap gap-2">
                          {currentUser.specialisations && currentUser.specialisations.length > 0 ? (
                            currentUser.specialisations.map(spec => (
                              <span key={spec} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100">
                                {spec}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-slate-400 italic">Generalist (All Industries)</span>
                          )}
                        </div>
                    </div>
                  </section>

                  {/* Permissions Section */}
                  <section>
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Shield size={18} className="text-green-500"/> Access & Permissions
                    </h4>
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                      {currentUser.permissions && currentUser.permissions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {currentUser.permissions.map(perm => {
                            const details = AVAILABLE_PERMISSIONS.find(p => p.id === perm);
                            return (
                              <div key={perm} className="flex items-start gap-2 p-2 bg-white rounded border border-slate-200">
                                <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0"/>
                                <div>
                                  <p className="text-xs font-bold text-slate-700">{details?.label || perm}</p>
                                  <p className="text-xs text-slate-500 leading-tight">{details?.description}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">Standard role-based access only.</p>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="max-w-md">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Lock size={18} className="text-orange-500"/> Update Password
                  </h4>
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                      <input 
                        type="password" 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
                      <input 
                        type="password" 
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                      />
                    </div>
                    <div className="pt-4">
                      <button 
                        type="submit"
                        disabled={!newPassword || !confirmPassword}
                        className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-black transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                      >
                        <Save size={16}/> Update Password
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'activity' && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-blue-500"/> Account Activity Log
                  </h4>
                  <p className="text-sm text-slate-500 mb-4">History of actions performed on your account.</p>
                  
                  <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="max-h-[400px] overflow-y-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Time</th>
                            <th className="px-4 py-3">Action</th>
                            <th className="px-4 py-3">Performed By</th>
                            <th className="px-4 py-3">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {myLogs.length > 0 ? myLogs.map((log, i) => {
                            const isAdminAction = log.details.includes('[ADMIN ACTION]') || log.details.includes('[ADMIN OVERRIDE]');
                            return (
                              <tr key={i} className={`hover:bg-slate-50 ${isAdminAction ? 'bg-red-50/50' : ''}`}>
                                <td className="px-4 py-3 text-slate-500 text-xs font-mono whitespace-nowrap">
                                  {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className={`px-4 py-3 font-medium ${isAdminAction ? 'text-red-700' : 'text-slate-700'}`}>
                                  {log.action}
                                </td>
                                <td className="px-4 py-3 flex items-center gap-2">
                                  {isAdminAction && <AlertTriangle size={12} className="text-red-500"/>}
                                  <span className={isAdminAction ? 'font-bold text-red-700' : 'text-slate-600'}>
                                    {log.userName}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600 text-xs max-w-[200px] truncate" title={log.details}>
                                  {log.details}
                                </td>
                              </tr>
                            );
                          }) : (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-400 italic">No activity recorded yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
