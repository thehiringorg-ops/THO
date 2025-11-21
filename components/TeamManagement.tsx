
import React, { useState } from 'react';
import { User, Job, ActivityLog } from '../types';
import { Shield, UserPlus, Trash2, Mail, Crown, User as UserIcon, X, CheckCircle, Activity, RefreshCw, Camera, Edit2, Save, AlertOctagon, Lock } from 'lucide-react';

interface TeamManagementProps {
  users: User[];
  jobs: Job[];
  currentUser: User | null;
  activityLogs: ActivityLog[];
  onAddUser: (user: User) => void;
  onRemoveUser: (userId: string) => void;
  onUpdateUser: (user: User) => void;
  onApproveUser: (userId: string) => void;
  onUpdateStatus: (userId: string, status: 'Active' | 'Frozen' | 'Pending') => void;
  onTransferPortfolio: (fromUserId: string, toUserId: string) => void;
  onUpdateAvatar: (userId: string, avatar: string) => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ users, jobs, currentUser, activityLogs, onAddUser, onRemoveUser, onUpdateUser, onApproveUser, onUpdateStatus, onTransferPortfolio, onUpdateAvatar }) => {
  const [activeTab, setActiveTab] = useState<'team' | 'activity'>('team');
  const [showAddForm, setShowAddForm] = useState(false);
  const [logUserFilter, setLogUserFilter] = useState<string>('All');

  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Transfer Portfolio State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSource, setTransferSource] = useState('');
  const [transferTarget, setTransferTarget] = useState('');

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Recruiter'
  });

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';
  const isSuperAdmin = currentUser?.role === 'SuperAdmin';
  
  // Admins can see everyone except deleted users.
  const visibleUsers = users; 

  // Filter Logs
  const visibleLogs = activityLogs.filter(log => {
      if (isAdmin) {
          return logUserFilter === 'All' || log.userId === logUserFilter;
      } else {
          return log.userId === currentUser?.id;
      }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    const user: User = {
      id: `u-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newUser.name)}&background=random`,
      status: isAdmin ? 'Active' : 'Pending'
    };

    onAddUser(user);
    setNewUser({ name: '', email: '', role: 'Recruiter' });
    setShowAddForm(false);
    if(!isAdmin) alert("Account request sent for approval.");
  };

  const handleUpdateUserSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(editingUser) {
          onUpdateUser(editingUser);
          setEditingUser(null);
      }
  };
  
  const handleTransferSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(transferSource && transferTarget && transferSource !== transferTarget) {
          onTransferPortfolio(transferSource, transferTarget);
          setShowTransferModal(false);
          setTransferSource('');
          setTransferTarget('');
      } else {
          alert("Please select distinct source and target users.");
      }
  };

  const handleAvatarUpload = (userId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(file) {
          const reader = new FileReader();
          reader.onload = () => onUpdateAvatar(userId, reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  // HIERARCHY LOGIC
  // SuperAdmin (Tier 1): Can create/manage SuperAdmin, Admin, Recruiter, Hiring Manager
  // Admin (Tier 2): Can create/manage Recruiter, Hiring Manager. CANNOT manage Admin or SuperAdmin.

  const getAvailableRoles = () => {
      if (currentUser?.role === 'SuperAdmin') {
          return [
              { value: 'Recruiter', label: 'Recruiter' },
              { value: 'Hiring Manager', label: 'Hiring Manager' },
              { value: 'Admin', label: 'Admin (Super User)' },
              { value: 'SuperAdmin', label: 'SuperAdmin' }
          ];
      }
      if (currentUser?.role === 'Admin') {
          return [
              { value: 'Recruiter', label: 'Recruiter' },
              { value: 'Hiring Manager', label: 'Hiring Manager' }
          ];
      }
      return [];
  };

  const canManageUser = (targetUser: User) => {
      if (!currentUser) return false;
      // Users can always edit their own basic details (avatar etc) - handled by UI checks
      // But for Administrative actions (Remove, Freeze, Change Role):
      
      if (currentUser.role === 'SuperAdmin') return true;
      
      if (currentUser.role === 'Admin') {
          // Admin cannot touch SuperAdmin
          if (targetUser.role === 'SuperAdmin') return false;
          // Admin cannot touch other Admins
          if (targetUser.role === 'Admin') return false;
          
          return true;
      }
      
      return false;
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Team & Activity</h2>
          <p className="text-slate-500 mt-1">Manage access and view staff history.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium">
                <button 
                  onClick={() => setActiveTab('team')}
                  className={`px-4 py-1.5 rounded-md transition-all ${activeTab === 'team' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Members
                </button>
                <button 
                  onClick={() => setActiveTab('activity')}
                  className={`px-4 py-1.5 rounded-md transition-all ${activeTab === 'activity' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Activity History
                </button>
            </div>
            
            {isAdmin && activeTab === 'team' && (
              <div className="flex gap-2">
                <button 
                    onClick={() => setShowTransferModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <RefreshCw size={18} /> Transfer Portfolio
                </button>
                <button 
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20"
                >
                    <UserPlus size={18} /> Add Member
                </button>
              </div>
            )}
        </div>
      </div>

      {activeTab === 'team' && (
        <>
        {/* Add User Modal */}
        {showAddForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Add Team Member</h3>
                <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
                </div>
                <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                <div><label className="block text-sm mb-1">Name</label><input required className="w-full border p-2 rounded" value={newUser.name} onChange={e=>setNewUser({...newUser, name: e.target.value})}/></div>
                <div><label className="block text-sm mb-1">Email</label><input required className="w-full border p-2 rounded" value={newUser.email} onChange={e=>setNewUser({...newUser, email: e.target.value})}/></div>
                <div>
                    <label className="block text-sm mb-1">Role</label>
                    <select className="w-full border p-2 rounded" value={newUser.role} onChange={e=>setNewUser({...newUser, role: e.target.value})}>
                        {getAvailableRoles().map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                    </select>
                </div>
                <button className="w-full bg-orange-500 text-white py-2 rounded">Create</button>
                </form>
            </div>
            </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Edit Team Member</h3>
                <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>
                </div>
                <form onSubmit={handleUpdateUserSubmit} className="p-6 space-y-4">
                <div><label className="block text-sm mb-1">Name</label><input required className="w-full border p-2 rounded" value={editingUser.name} onChange={e=>setEditingUser({...editingUser, name: e.target.value})}/></div>
                <div><label className="block text-sm mb-1">Email</label><input required className="w-full border p-2 rounded" value={editingUser.email} onChange={e=>setEditingUser({...editingUser, email: e.target.value})}/></div>
                <div>
                    <label className="block text-sm mb-1">Role</label>
                    <select 
                        className="w-full border p-2 rounded" 
                        value={editingUser.role} 
                        onChange={e=>setEditingUser({...editingUser, role: e.target.value})}
                        disabled={!canManageUser(editingUser)} // Can only change role if allowed to manage
                    >
                        {/* Show current role plus allowed roles to switch to */}
                        <option value={editingUser.role}>{editingUser.role}</option>
                        {getAvailableRoles().filter(r => r.value !== editingUser.role).map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                    </select>
                </div>
                <button className="w-full bg-slate-800 text-white py-2 rounded flex items-center justify-center gap-2">
                    <Save size={16}/> Save Changes
                </button>
                </form>
            </div>
            </div>
        )}

        {/* Transfer Portfolio Modal */}
        {showTransferModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800">Transfer Portfolio</h3>
                        <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleTransferSubmit} className="p-6 space-y-6">
                        <p className="text-sm text-slate-500">
                            Move all active and closed job listings from one user to another. This is useful when a staff member leaves or changes roles.
                        </p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">From (Source User)</label>
                                <select 
                                    required 
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                    value={transferSource}
                                    onChange={(e) => setTransferSource(e.target.value)}
                                >
                                    <option value="">Select User...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="flex justify-center">
                                <RefreshCw className="text-slate-300 rotate-90" size={24} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">To (Target User)</label>
                                <select 
                                    required 
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                    value={transferTarget}
                                    onChange={(e) => setTransferTarget(e.target.value)}
                                >
                                    <option value="">Select User...</option>
                                    {users.filter(u => u.id !== transferSource).map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg flex gap-2 items-start text-sm text-orange-800">
                             <Shield size={16} className="mt-0.5 shrink-0"/>
                             <p>This action will transfer ownership of all job listings. The recruiter name and avatar on public listings will be updated.</p>
                        </div>

                        <button 
                            type="submit"
                            disabled={!transferSource || !transferTarget} 
                            className="w-full bg-slate-800 text-white py-3 rounded-lg font-medium hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirm Transfer
                        </button>
                    </form>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleUsers.map(user => {
                const isManageable = canManageUser(user);
                return (
                <div key={user.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow group relative ${user.status === 'Frozen' ? 'border-red-200 bg-red-50/30' : 'border-slate-100'}`}>
                    <div className="p-6 flex items-start gap-4">
                    <div className="relative group/avatar cursor-pointer">
                        <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className={`w-16 h-16 rounded-full object-cover border-4 ${user.status === 'Frozen' ? 'border-red-100' : 'border-slate-50'}`}
                        />
                        {/* Edit Overlay - anyone can edit their own avatar */}
                        {(isAdmin || currentUser?.id === user.id) && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                <Camera size={16} className="text-white" />
                                <input type="file" accept="image/*" onChange={(e) => handleAvatarUpload(user.id, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                            <h3 className="font-bold text-slate-800 truncate">{user.name}</h3>
                            {user.role === 'SuperAdmin' && <Crown size={14} className="text-amber-500" fill="currentColor"/>}
                            {user.role === 'Admin' && <Shield size={14} className="text-blue-500" fill="currentColor"/>}
                        </div>
                        <p className="text-sm text-slate-500">{user.role}</p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate mb-2">
                        <Mail size={12} /> {user.email}
                        </div>
                        
                        {/* Status Badge / Dropdown */}
                        {isManageable ? (
                            <div className="mt-2">
                            <select 
                                value={user.status} 
                                onChange={(e) => onUpdateStatus(user.id, e.target.value as any)}
                                className={`text-xs font-medium px-2 py-1 rounded border outline-none cursor-pointer ${
                                    user.status === 'Frozen' ? 'bg-red-100 text-red-700 border-red-200' : 
                                    user.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' :
                                    'bg-orange-100 text-orange-700 border-orange-200'
                                }`}
                            >
                                <option value="Active">Active</option>
                                <option value="Frozen">Frozen</option>
                                <option value="Pending">Pending</option>
                            </select>
                            </div>
                        ) : (
                            <span className={`inline-block mt-2 text-xs font-medium px-2 py-1 rounded border ${
                                user.status === 'Frozen' ? 'bg-red-100 text-red-700 border-red-200' : 
                                user.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' :
                                'bg-orange-100 text-orange-700 border-orange-200'
                            }`}>
                                {user.status}
                                {!isManageable && isAdmin && <Lock size={10} className="inline ml-1"/>}
                            </span>
                        )}
                    </div>
                    </div>
                    
                    <div className="bg-slate-50 px-6 py-3 flex justify-between items-center border-t border-slate-100">
                        <span className="text-xs text-slate-400 font-medium">{jobs.filter(j => j.postedBy === user.id).length} Jobs</span>
                        <div className="flex gap-3">
                            {/* Edit button allowed if you can manage them OR it's yourself */}
                            {(isManageable || currentUser?.id === user.id) && (
                                <button onClick={() => setEditingUser(user)} className="text-blue-500 text-xs flex gap-1 items-center hover:underline">
                                    <Edit2 size={12}/> Edit
                                </button>
                            )}
                            {/* Remove button: Only show if Manageable and NOT current user */}
                            {isManageable && currentUser?.id !== user.id && (
                                <button onClick={() => onRemoveUser(user.id)} className="text-red-500 text-xs flex gap-1 items-center hover:underline">
                                    <Trash2 size={12}/> Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                );
            })}
        </div>
        </>
      )}

      {activeTab === 'activity' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><Activity size={18}/> Staff Activity Log</h3>
                  {isAdmin && (
                      <select 
                        value={logUserFilter} 
                        onChange={(e) => setLogUserFilter(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
                      >
                          <option value="All">All Users</option>
                          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                  )}
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500">
                          <tr>
                              <th className="px-6 py-4">User</th>
                              <th className="px-6 py-4">Action</th>
                              <th className="px-6 py-4">Details</th>
                              <th className="px-6 py-4">Category</th>
                              <th className="px-6 py-4 text-right">Time</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {visibleLogs.length > 0 ? (
                              visibleLogs.map(log => (
                                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                              <img src={log.userAvatar} className="w-8 h-8 rounded-full" alt=""/>
                                              <span className="font-medium text-slate-800">{log.userName}</span>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 font-medium text-slate-700">{log.action}</td>
                                      <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{log.details}</td>
                                      <td className="px-6 py-4">
                                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                              log.type === 'Job' ? 'bg-blue-50 text-blue-700' :
                                              log.type === 'Client' ? 'bg-purple-50 text-purple-700' :
                                              log.type === 'Candidate' ? 'bg-green-50 text-green-700' :
                                              'bg-slate-100 text-slate-600'
                                          }`}>
                                              {log.type}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-right text-xs text-slate-400 font-mono">
                                          {new Date(log.timestamp).toLocaleString()}
                                      </td>
                                  </tr>
                              ))
                          ) : (
                              <tr>
                                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                      No activity records found.
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}
    </div>
  );
};

export default TeamManagement;
