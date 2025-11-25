
import React, { useState, useRef, useEffect } from 'react';
import { Job, User, APPROVE_REASONS, REINSTATE_REASONS, RETURN_REASONS, AccessRequest, AVAILABLE_PERMISSIONS, Permission, TEAM_APPROVAL_REASONS, TEAM_REJECTION_REASONS, ActivityLog, ServiceRequest, ServiceType } from '../types';
import { Shield, CheckCircle, XCircle, ChevronDown, ChevronUp, FileText, UserCheck, Trash2, ExternalLink, Lock, Unlock, Briefcase, Send, MessageSquare, Clock, UserPlus, CornerUpLeft, Zap, X, CheckSquare } from 'lucide-react';

interface ApprovalsProps {
  jobs: Job[];
  users: User[];
  accessRequests?: AccessRequest[];
  serviceRequests?: ServiceRequest[];
  currentUser: User | null;
  activityLogs: ActivityLog[]; 
  onApproveJob: (jobId: string, reason: string, adminNotes: string, ownerFeedback: string) => void;
  onDeleteJob: (jobId: string) => void;
  onRejectJobDeletion: (jobId: string, reason: string, adminNotes: string, ownerFeedback: string) => void;
  onReturnJob?: (jobId: string, reason: string, adminNotes: string, ownerFeedback: string) => void;
  onApproveUser: (userId: string, reason: string, notes: string) => void;
  onRejectUser: (userId: string, reason: string, notes: string) => void;
  onRemoveUser: (userId: string) => void;
  onViewJob: (jobId: string) => void;
  onApproveAccessRequest?: (requestId: string, permissions: Permission[], reason: string) => void;
  onRejectAccessRequest?: (requestId: string, reason: string) => void;
  onAddAccessRequestComment?: (requestId: string, text: string) => void;
  onAssignServiceRequest?: (requestId: string, staffId: string) => void;
}

const Approvals: React.FC<ApprovalsProps> = ({ 
    jobs, 
    users, 
    accessRequests = [], 
    serviceRequests = [],
    currentUser, 
    activityLogs = [], 
    onApproveJob, 
    onDeleteJob, 
    onRejectJobDeletion, 
    onReturnJob,
    onApproveUser, 
    onRejectUser,
    onRemoveUser, 
    onViewJob,
    onApproveAccessRequest,
    onRejectAccessRequest,
    onAddAccessRequestComment,
    onAssignServiceRequest
}) => {
  // Filter Data
  const pendingJobs = jobs.filter(j => j.status === 'Pending Approval');
  const pendingDeletions = jobs.filter(j => j.status === 'Pending Deletion');
  const pendingUsers = users.filter(u => u.status === 'Pending');
  
  // Service Request Filters
  const pendingServiceRequests = serviceRequests.filter(r => r.status === 'Pending' && !r.assignedStaffId);
  const historyServiceRequests = serviceRequests.filter(r => r.status !== 'Pending' || r.assignedStaffId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // History Filters
  const jobHistory = jobs.filter(j => j.lastActionDate && (j.status === 'Active' || j.status === 'Draft' || j.status === 'Suspended')).sort((a, b) => new Date(b.lastActionDate || 0).getTime() - new Date(a.lastActionDate || 0).getTime());
  const deletionHistory = activityLogs.filter(l => l.action === 'Deleted Job' || l.action === 'Reinstated Job').sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // User History Filtering (Approved recently or Rejected)
  const historyUsers = users.filter(u => (u.status === 'Active' && u.approvedBy) || u.status === 'Rejected').sort((a, b) => new Date(b.approvedAt || 0).getTime() - new Date(a.approvedAt || 0).getTime());

  // Access Requests Filtering
  const pendingAccessRequests = accessRequests.filter(r => r.status === 'Pending');
  const historyAccessRequests = accessRequests.filter(r => r.status === 'Approved' || r.status === 'Rejected').sort((a, b) => new Date(b.adjudicatedAt || b.date).getTime() - new Date(a.adjudicatedAt || a.date).getTime());

  // Tabs State
  const [activeAccessTab, setActiveAccessTab] = useState<'pending' | 'history'>('pending');
  const [activeUserTab, setActiveUserTab] = useState<'pending' | 'history'>('pending');
  const [activeJobTab, setActiveJobTab] = useState<'pending' | 'history'>('pending');
  const [activeDeletionTab, setActiveDeletionTab] = useState<'pending' | 'history'>('pending');
  const [activeServiceTab, setActiveServiceTab] = useState<'pending' | 'history'>('pending');

  // Collapse State
  const [sections, setSections] = useState({
    jobs: true,
    deletions: true,
    users: true,
    access: true,
    services: true
  });

  // Action Modal State for Jobs
  const [actionModal, setActionModal] = useState<{ isOpen: boolean; type: 'ApproveJob' | 'RejectDelete' | 'ReturnJob' | null; jobId: string | null }>({ isOpen: false, type: null, jobId: null });
  const [selectedReason, setSelectedReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [ownerFeedback, setOwnerFeedback] = useState('');

  // User Action Modal State
  const [userActionModal, setUserActionModal] = useState<{ isOpen: boolean; type: 'Approve' | 'Reject' | null; userId: string | null }>({ isOpen: false, type: null, userId: null });
  const [userReason, setUserReason] = useState('');
  const [userNotes, setUserNotes] = useState('');

  // Access Request Review State
  const [reviewRequestId, setReviewRequestId] = useState<string | null>(null);
  const [accessReason, setAccessReason] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  // Service Allocation State
  const [allocationModal, setAllocationModal] = useState<{ isOpen: boolean, requestId: string | null }>({ isOpen: false, requestId: null });
  const [selectedStaffId, setSelectedStaffId] = useState('');

  const reviewRequest = accessRequests.find(r => r.id === reviewRequestId);
  const selectedUser = users.find(u => u.id === userActionModal.userId);
  const selectedServiceRequest = serviceRequests.find(r => r.id === allocationModal.requestId);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
      if(reviewRequestId && chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [reviewRequest?.comments, reviewRequestId]);

  const toggleSection = (key: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleJobActionClick = (type: 'ApproveJob' | 'RejectDelete' | 'ReturnJob', jobId: string) => {
      setActionModal({ isOpen: true, type, jobId });
      setSelectedReason('');
      setAdminNotes('');
      setOwnerFeedback('');
  };

  const handleUserActionClick = (type: 'Approve' | 'Reject', userId: string) => {
      setUserActionModal({ isOpen: true, type, userId });
      setUserReason('');
      setUserNotes('');
  };

  const handleApproveAllJobs = () => {
      if (confirm(`Are you sure you want to force approve all ${pendingJobs.length} pending jobs?`)) {
          pendingJobs.forEach(job => {
              if (job.postedBy !== currentUser?.id) {
                  onApproveJob(job.id, 'Bulk Approval', 'Force Approved by Admin', '');
              }
          });
      }
  };

  const submitJobAction = () => {
      if(!actionModal.jobId || !selectedReason) return;
      
      if(actionModal.type === 'ApproveJob') {
          onApproveJob(actionModal.jobId, selectedReason, adminNotes, ownerFeedback);
      } else if (actionModal.type === 'RejectDelete') {
          onRejectJobDeletion(actionModal.jobId, selectedReason, adminNotes, ownerFeedback);
      } else if (actionModal.type === 'ReturnJob' && onReturnJob) {
          onReturnJob(actionModal.jobId, selectedReason, adminNotes, ownerFeedback);
      }
      
      setActionModal({ isOpen: false, type: null, jobId: null });
  };

  const submitUserAction = () => {
      if (!userActionModal.userId || !userReason) return;

      if (userActionModal.type === 'Approve') {
          onApproveUser(userActionModal.userId, userReason, userNotes);
      } else if (userActionModal.type === 'Reject') {
          onRejectUser(userActionModal.userId, userReason, userNotes);
      }
      setUserActionModal({ isOpen: false, type: null, userId: null });
  };

  const getReasons = () => {
      if (actionModal.type === 'ReturnJob') return RETURN_REASONS;
      return actionModal.type === 'ApproveJob' ? APPROVE_REASONS : REINSTATE_REASONS;
  };

  // Access Request Helpers
  const openAccessReview = (req: AccessRequest) => {
      setReviewRequestId(req.id);
      setAccessReason('');
      // Pre-select standard permissions if logic allows, otherwise start empty
      setSelectedPermissions([]); 
  };

  const handlePermissionToggle = (perm: Permission) => {
      setSelectedPermissions(prev => 
          prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
      );
  };

  const submitAccessApproval = () => {
      if (reviewRequestId && onApproveAccessRequest && accessReason) {
          onApproveAccessRequest(reviewRequestId, selectedPermissions, accessReason);
          setReviewRequestId(null);
      }
  };

  const submitAccessRejection = () => {
      if (reviewRequestId && onRejectAccessRequest && accessReason) {
          onRejectAccessRequest(reviewRequestId, accessReason);
          setReviewRequestId(null);
      }
  };

  const sendAccessComment = (e: React.FormEvent) => {
      e.preventDefault();
      if (reviewRequestId && chatInput.trim() && onAddAccessRequestComment) {
          onAddAccessRequestComment(reviewRequestId, chatInput);
          setChatInput('');
      }
  };

  const handleAllocationSubmit = () => {
      if (allocationModal.requestId && selectedStaffId && onAssignServiceRequest) {
          onAssignServiceRequest(allocationModal.requestId, selectedStaffId);
          setAllocationModal({ isOpen: false, requestId: null });
          setSelectedStaffId('');
      }
  };

  const isRecruitmentService = (type: ServiceType) => {
      return ['Executive Search', 'Permanent Recruitment', 'Temporary/Contract Staffing'].includes(type);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn pb-20">
      <div className="mb-8">
         <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <Shield className="text-orange-500"/> Admin Approvals Center
         </h2>
         <p className="text-slate-500 mt-1">Manage pending requests, job listings, user access, and role upgrades.</p>
      </div>

      {/* Counters Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Pending Jobs</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingJobs.length}</p>
              </div>
              <div className="bg-orange-50 p-2 rounded-lg text-orange-500"><FileText size={20}/></div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Deletion Requests</p>
                  <p className="text-2xl font-bold text-red-600">{pendingDeletions.length}</p>
              </div>
              <div className="bg-red-50 p-2 rounded-lg text-red-500"><Trash2 size={20}/></div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">New Users</p>
                  <p className="text-2xl font-bold text-blue-600">{pendingUsers.length}</p>
              </div>
              <div className="bg-blue-50 p-2 rounded-lg text-blue-500"><UserCheck size={20}/></div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Permission Requests</p>
                  <p className="text-2xl font-bold text-purple-600">{pendingAccessRequests.length}</p>
              </div>
              <div className="bg-purple-50 p-2 rounded-lg text-purple-500"><Unlock size={20}/></div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase">Service Requests</p>
                  <p className="text-2xl font-bold text-indigo-600">{pendingServiceRequests.length}</p>
              </div>
              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-500"><Zap size={20}/></div>
          </div>
      </div>

      <div className="space-y-6">
        
        {/* Adjudication & Access Requests Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div 
                className="p-4 bg-purple-50 border-b border-purple-100 flex justify-between items-center cursor-pointer hover:bg-purple-100 transition-colors"
                onClick={() => toggleSection('access')}
            >
                <h3 className="font-bold text-purple-900 flex items-center gap-2">
                    <Unlock size={18} className="text-purple-600"/> Adjudication & Permissions
                </h3>
                {sections.access ? <ChevronUp size={20} className="text-purple-400"/> : <ChevronDown size={20} className="text-purple-400"/>}
            </div>
            
            {sections.access && (
                <div>
                    <div className="flex border-b border-purple-100 bg-purple-50/30">
                        <button 
                            onClick={() => setActiveAccessTab('pending')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeAccessTab === 'pending' ? 'border-purple-600 text-purple-700 bg-white' : 'border-transparent text-slate-500 hover:text-purple-600'}`}
                        >
                            Pending Reviews ({pendingAccessRequests.length})
                        </button>
                        <button 
                            onClick={() => setActiveAccessTab('history')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeAccessTab === 'history' ? 'border-purple-600 text-purple-700 bg-white' : 'border-transparent text-slate-500 hover:text-purple-600'}`}
                        >
                            Decision History
                        </button>
                    </div>

                    {activeAccessTab === 'pending' ? (
                        <div className="divide-y divide-slate-50">
                            {pendingAccessRequests.length > 0 ? pendingAccessRequests.map(req => (
                                <div key={req.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col gap-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <img src={req.userAvatar} className="w-10 h-10 rounded-full border border-slate-200" alt=""/>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{req.userName}</h4>
                                                <div className="flex items-center gap-2 text-xs mt-0.5">
                                                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{req.currentRole}</span>
                                                    <span className="text-slate-400">→</span>
                                                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold">{req.requestedRole}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-400">{new Date(req.date).toLocaleDateString()}</span>
                                    </div>
                                    
                                    <div className="bg-slate-50 p-3 rounded border border-slate-100 text-sm text-slate-600">
                                        <p className="font-semibold text-xs text-slate-500 uppercase mb-1">Reason: {req.customReason || req.reason}</p>
                                        <p className="italic">"{req.motivation}"</p>
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => openAccessReview(req)}
                                            className="px-4 py-2 text-xs font-medium bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-1 shadow-sm"
                                        >
                                            Review Request
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-slate-400 italic text-sm">No new permission requests.</div>
                            )}
                        </div>
                    ) : (
                        /* History View */
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-600">
                                <thead className="bg-slate-50 font-medium text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3">Requester</th>
                                        <th className="px-6 py-3">Role Change</th>
                                        <th className="px-6 py-3">Adjudicated By</th>
                                        <th className="px-6 py-3">Decision Date</th>
                                        <th className="px-6 py-3">Reason</th>
                                        <th className="px-6 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {historyAccessRequests.length > 0 ? historyAccessRequests.map(req => (
                                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3 font-medium text-slate-800">{req.userName}</td>
                                            <td className="px-6 py-3">
                                                <span className="text-slate-500">{req.currentRole}</span> → <span className="text-purple-700 font-bold">{req.requestedRole}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                {req.adjudicatedByName ? (
                                                    <span className="font-medium text-indigo-700">{req.adjudicatedByName}</span>
                                                ) : 'System'}
                                            </td>
                                            <td className="px-6 py-3">{req.adjudicatedAt ? new Date(req.adjudicatedAt).toLocaleString() : 'N/A'}</td>
                                            <td className="px-6 py-3 italic max-w-xs truncate" title={req.decisionReason}>{req.decisionReason || 'No reason provided'}</td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                    req.status === 'Approved' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">No history available.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Service Requests Allocation Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div 
                className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center cursor-pointer hover:bg-indigo-100 transition-colors"
                onClick={() => toggleSection('services')}
            >
                <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                    <Zap size={18} className="text-indigo-600"/> Service Request Allocation
                </h3>
                {sections.services ? <ChevronUp size={20} className="text-indigo-400"/> : <ChevronDown size={20} className="text-indigo-400"/>}
            </div>
            
            {sections.services && (
                <div>
                    <div className="flex border-b border-indigo-100 bg-indigo-50/30">
                        <button 
                            onClick={() => setActiveServiceTab('pending')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeServiceTab === 'pending' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-indigo-600'}`}
                        >
                            Pending Allocation ({pendingServiceRequests.length})
                        </button>
                        <button 
                            onClick={() => setActiveServiceTab('history')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeServiceTab === 'history' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-indigo-600'}`}
                        >
                            Allocation History
                        </button>
                    </div>

                    {activeServiceTab === 'pending' ? (
                        <div className="divide-y divide-slate-50">
                            {pendingServiceRequests.length > 0 ? pendingServiceRequests.map(req => {
                                const isRecruitment = isRecruitmentService(req.serviceType);
                                return (
                                    <div key={req.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-4 justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-slate-800 text-lg">{req.serviceType}</h4>
                                                {req.subCategory && <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">{req.subCategory}</span>}
                                            </div>
                                            <p className="text-sm text-slate-500 font-medium mb-1">Client: {req.clientName}</p>
                                            <div className="bg-slate-50 p-3 rounded border border-slate-100 text-sm text-slate-600 mt-2 max-w-2xl">
                                                {req.details}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                                <Clock size={12}/> Requested: {new Date(req.date).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {isRecruitment ? (
                                                <button 
                                                    onClick={() => setAllocationModal({ isOpen: true, requestId: req.id })}
                                                    className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg shadow-sm hover:bg-emerald-700 flex items-center gap-2 text-xs justify-center"
                                                >
                                                    <Briefcase size={14}/> Convert & Allocate
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => setAllocationModal({ isOpen: true, requestId: req.id })}
                                                    className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 flex items-center gap-2 text-xs justify-center"
                                                >
                                                    <UserPlus size={14}/> Allocate Staff
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="p-8 text-center text-slate-400 italic text-sm">No pending service requests.</div>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-600">
                                <thead className="bg-slate-50 font-medium text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3">Client</th>
                                        <th className="px-6 py-3">Service</th>
                                        <th className="px-6 py-3">Details</th>
                                        <th className="px-6 py-3">Assigned To</th>
                                        <th className="px-6 py-3">Date Assigned</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {historyServiceRequests.length > 0 ? historyServiceRequests.map(req => (
                                        <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3 font-bold text-slate-700">{req.clientName}</td>
                                            <td className="px-6 py-3">
                                                {req.serviceType}
                                                {req.subCategory && <div className="text-[10px] text-slate-400">{req.subCategory}</div>}
                                            </td>
                                            <td className="px-6 py-3 max-w-xs truncate text-slate-500" title={req.details}>{req.details}</td>
                                            <td className="px-6 py-3 font-medium text-indigo-700">{req.assignedStaffName || 'Unassigned'}</td>
                                            <td className="px-6 py-3">{new Date(req.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                    req.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                                    req.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 
                                                    'bg-orange-100 text-orange-700'
                                                }`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">No allocation history available.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* User Requests Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div 
                className="p-4 bg-blue-50/50 border-b border-blue-100 flex justify-between items-center cursor-pointer hover:bg-blue-50 transition-colors"
                onClick={() => toggleSection('users')}
            >
                <h3 className="font-bold text-blue-800 flex items-center gap-2">
                    <UserCheck size={18} className="text-blue-500"/> Team Access Requests ({pendingUsers.length})
                </h3>
                {sections.users ? <ChevronUp size={20} className="text-blue-400"/> : <ChevronDown size={20} className="text-blue-400"/>}
            </div>
            
            {sections.users && (
                <div>
                    <div className="flex border-b border-blue-100 bg-blue-50/30">
                        <button 
                            onClick={() => setActiveUserTab('pending')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeUserTab === 'pending' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-blue-600'}`}
                        >
                            Pending ({pendingUsers.length})
                        </button>
                        <button 
                            onClick={() => setActiveUserTab('history')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeUserTab === 'history' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-blue-600'}`}
                        >
                            Access History
                        </button>
                    </div>

                    {activeUserTab === 'pending' ? (
                        <div className="divide-y divide-slate-50">
                             {pendingUsers.length > 0 ? pendingUsers.map(user => (
                                <div key={user.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-4 items-start justify-between">
                                     <div className="flex-1">
                                         <div className="flex items-center gap-3">
                                             <img src={user.avatar} className="w-10 h-10 rounded-full bg-slate-200" alt=""/>
                                             <div>
                                                 <h4 className="font-bold text-slate-800">{user.name}</h4>
                                                 <p className="text-sm text-slate-500">{user.email} • <span className="font-medium text-slate-700">{user.role}</span></p>
                                                 <p className="text-xs text-slate-400 font-mono mt-0.5">Staff ID: {user.staffNumber || 'Not Assigned'}</p>
                                             </div>
                                         </div>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <button onClick={() => handleUserActionClick('Reject', user.id)} className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-50 flex items-center gap-1">
                                             <XCircle size={14}/> Deny
                                         </button>
                                         <button onClick={() => handleUserActionClick('Approve', user.id)} className="px-3 py-1.5 text-xs font-medium bg-blue-50 border border-blue-200 text-blue-700 rounded hover:bg-blue-100 flex items-center gap-1">
                                             <CheckCircle size={14}/> Approve Access
                                         </button>
                                     </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-slate-400 italic text-sm">No new team requests.</div>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-600">
                                <thead className="bg-slate-50 font-medium text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3">Staff Member</th>
                                        <th className="px-6 py-3">Role</th>
                                        <th className="px-6 py-3">Adjudicated By</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Reason</th>
                                        <th className="px-6 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {historyUsers.length > 0 ? historyUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <img src={u.avatar} className="w-6 h-6 rounded-full"/>
                                                    <span className="font-medium text-slate-800">{u.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">{u.role}</td>
                                            <td className="px-6 py-3">{u.approvedByName || 'System'}</td>
                                            <td className="px-6 py-3">{u.approvedAt ? new Date(u.approvedAt).toLocaleString() : 'N/A'}</td>
                                            <td className="px-6 py-3 italic max-w-xs truncate" title={u.status === 'Rejected' ? u.rejectionReason : u.statusChangeReason}>
                                                {u.status === 'Rejected' ? u.rejectionReason : u.statusChangeReason || 'Standard Approval'}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                    u.status === 'Active' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {u.status === 'Active' ? 'Approved' : u.status}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">No history available.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Job Listings Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div 
                className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => toggleSection('jobs')}
            >
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <FileText size={18} className="text-orange-500"/> Job Listings Approval
                    </h3>
                    {pendingJobs.length > 0 && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleApproveAllJobs(); }}
                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 flex items-center gap-1 shadow-sm z-10"
                        >
                            <CheckCircle size={12}/> Force Approve All
                        </button>
                    )}
                </div>
                {sections.jobs ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
            </div>
            
            {sections.jobs && (
                <div>
                    <div className="flex border-b border-slate-200 bg-slate-50/50">
                        <button 
                            onClick={() => setActiveJobTab('pending')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeJobTab === 'pending' ? 'border-orange-500 text-orange-600 bg-white' : 'border-transparent text-slate-500 hover:text-orange-600'}`}
                        >
                            Pending Approval ({pendingJobs.length})
                        </button>
                        <button 
                            onClick={() => setActiveJobTab('history')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeJobTab === 'history' ? 'border-orange-500 text-orange-600 bg-white' : 'border-transparent text-slate-500 hover:text-orange-600'}`}
                        >
                            Decision History
                        </button>
                    </div>

                    {activeJobTab === 'pending' ? (
                        <div className="divide-y divide-slate-50">
                            {pendingJobs.length > 0 ? pendingJobs.map(job => {
                                const isOwnJob = job.postedBy === currentUser?.id;
                                return (
                                    <div key={job.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-4 items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-slate-800">{job.title}</h4>
                                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{job.listingReference}</span>
                                            </div>
                                            <p className="text-sm text-slate-500 mb-2">{job.department} • {job.location} • Posted by <span className="font-medium text-slate-700">{job.recruiterName}</span></p>
                                            <p className="text-xs text-slate-400 italic">Created: {new Date(job.createdAt).toLocaleDateString()}</p>
                                            {isOwnJob && (
                                                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 font-bold mt-2 flex items-center gap-1 p-1.5 rounded w-fit">
                                                    <Lock size={10} /> Governance: You cannot approve your own listing. It must be reviewed by another Admin.
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => onViewJob(job.id)} className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-50 flex items-center gap-1 shadow-sm">
                                                <ExternalLink size={14}/> Review
                                            </button>
                                            {onReturnJob && (
                                                <button 
                                                    onClick={() => handleJobActionClick('ReturnJob', job.id)} 
                                                    className="px-3 py-1.5 text-xs font-medium bg-amber-50 border border-amber-200 text-amber-700 rounded hover:bg-amber-100 flex items-center gap-1"
                                                >
                                                    <CornerUpLeft size={14}/> Return / Decline
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleJobActionClick('ApproveJob', job.id)} 
                                                disabled={isOwnJob}
                                                className={`px-3 py-1.5 text-xs font-medium border rounded flex items-center gap-1 shadow-sm transition-all ${
                                                    isOwnJob 
                                                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-70' 
                                                    : 'border-green-200 bg-green-600 text-white hover:bg-green-700'
                                                }`}
                                                title={isOwnJob ? "Governance Rule: You cannot approve your own listing." : "Approve Listing"}
                                            >
                                                {isOwnJob ? <Lock size={14}/> : <CheckCircle size={14}/>} 
                                                Approve
                                            </button>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="p-8 text-center text-slate-400 italic text-sm">No jobs pending approval.</div>
                            )}
                        </div>
                    ) : (
                        /* Job History Table */
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-600">
                                <thead className="bg-slate-50 font-medium text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3">Job Title</th>
                                        <th className="px-6 py-3">Recruiter</th>
                                        <th className="px-6 py-3">Actioned By</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Action</th>
                                        <th className="px-6 py-3">Reason</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {jobHistory.length > 0 ? jobHistory.map(j => (
                                        <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3">
                                                <span className="font-medium text-slate-800">{j.title}</span>
                                                <span className="block text-[10px] text-slate-400">{j.listingReference}</span>
                                            </td>
                                            <td className="px-6 py-3">{j.recruiterName}</td>
                                            <td className="px-6 py-3">{j.lastActionBy || 'System'}</td>
                                            <td className="px-6 py-3">{j.lastActionDate ? new Date(j.lastActionDate).toLocaleDateString() : 'N/A'}</td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                    j.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                    j.status === 'Draft' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {j.status === 'Draft' ? 'Returned' : j.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 italic max-w-xs truncate" title={j.lastActionReason}>
                                                {j.lastActionReason || '-'}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">No recent history.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Deletion Requests Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div 
                className="p-4 bg-red-50/50 border-b border-red-100 flex justify-between items-center cursor-pointer hover:bg-red-50 transition-colors"
                onClick={() => toggleSection('deletions')}
            >
                <h3 className="font-bold text-red-800 flex items-center gap-2">
                    <Trash2 size={18} className="text-red-500"/> Deletion Requests
                </h3>
                {sections.deletions ? <ChevronUp size={20} className="text-red-400"/> : <ChevronDown size={20} className="text-red-400"/>}
            </div>
            
            {sections.deletions && (
                <div>
                    <div className="flex border-b border-red-100 bg-red-50/30">
                        <button 
                            onClick={() => setActiveDeletionTab('pending')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeDeletionTab === 'pending' ? 'border-red-600 text-red-700 bg-white' : 'border-transparent text-slate-500 hover:text-red-600'}`}
                        >
                            Pending Requests ({pendingDeletions.length})
                        </button>
                        <button 
                            onClick={() => setActiveDeletionTab('history')}
                            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeDeletionTab === 'history' ? 'border-red-600 text-red-700 bg-white' : 'border-transparent text-slate-500 hover:text-red-600'}`}
                        >
                            Deletion History
                        </button>
                    </div>

                    {activeDeletionTab === 'pending' ? (
                        <div className="divide-y divide-slate-50">
                             {pendingDeletions.length > 0 ? pendingDeletions.map(job => (
                                <div key={job.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row gap-4 items-start justify-between">
                                     <div className="flex-1">
                                         <div className="flex items-center gap-2 mb-1">
                                             <h4 className="font-bold text-slate-800">{job.title}</h4>
                                             <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{job.listingReference}</span>
                                         </div>
                                         <p className="text-sm text-slate-500 mb-2">{job.department} • {job.location} • Posted by <span className="font-medium text-slate-700">{job.recruiterName}</span></p>
                                         <p className="text-xs text-slate-400 italic">Requested: {new Date(job.lastActionDate || job.createdAt).toLocaleDateString()}</p>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <button onClick={() => handleJobActionClick('RejectDelete', job.id)} className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-50 flex items-center gap-1">
                                             <CornerUpLeft size={14}/> Restore / Reject
                                         </button>
                                         <button onClick={() => onDeleteJob(job.id)} className="px-3 py-1.5 text-xs font-medium bg-red-50 border border-red-200 text-red-700 rounded hover:bg-red-100 flex items-center gap-1">
                                             <Trash2 size={14}/> Confirm Delete
                                         </button>
                                     </div>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-slate-400 italic text-sm">No pending deletion requests.</div>
                            )}
                        </div>
                    ) : (
                        /* Deletion History Table */
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-600">
                                <thead className="bg-slate-50 font-medium text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3">Action</th>
                                        <th className="px-6 py-3">Details</th>
                                        <th className="px-6 py-3">Admin</th>
                                        <th className="px-6 py-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {deletionHistory.length > 0 ? deletionHistory.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3 font-medium text-slate-800">{log.action}</td>
                                            <td className="px-6 py-3 max-w-xs truncate" title={log.details}>{log.details}</td>
                                            <td className="px-6 py-3">{log.userName}</td>
                                            <td className="px-6 py-3">{new Date(log.timestamp).toLocaleString()}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">No deletion history.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>

      </div>

      {/* Action Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
               <div className={`p-4 border-b flex items-center gap-2 ${
                   actionModal.type === 'ApproveJob' ? 'bg-green-50 border-green-100 text-green-800' : 
                   actionModal.type === 'ReturnJob' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                   'bg-red-50 border-red-100 text-red-800'
               }`}>
                   {actionModal.type === 'ApproveJob' && <CheckCircle size={20}/>}
                   {actionModal.type === 'ReturnJob' && <CornerUpLeft size={20}/>}
                   {actionModal.type === 'RejectDelete' && <Briefcase size={20}/>}
                   <h3 className="font-bold">
                       {actionModal.type === 'ApproveJob' ? 'Approve Listing' : 
                        actionModal.type === 'ReturnJob' ? 'Return to Recruiter' :
                        'Reject Deletion & Restore'}
                   </h3>
               </div>
               
               <div className="p-6 space-y-4">
                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-2">Reason <span className="text-red-500">*</span></label>
                       <select
                           value={selectedReason}
                           onChange={(e) => setSelectedReason(e.target.value)}
                           className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-sm"
                       >
                           <option value="">-- Select Reason --</option>
                           {getReasons().map((r, i) => (
                               <option key={i} value={r}>{r}</option>
                           ))}
                       </select>
                   </div>

                   <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1"><Lock size={12}/> Internal Note (Admin Only)</label>
                        <textarea 
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Private log..."
                            className="w-full p-2 border border-slate-300 rounded outline-none text-xs h-16"
                        />
                   </div>

                   <div className="bg-blue-50 p-3 rounded border border-blue-100">
                        <label className="block text-xs font-bold text-blue-700 mb-2 flex items-center gap-1"><MessageSquare size={12}/> Feedback to Owner</label>
                        <textarea 
                            value={ownerFeedback}
                            onChange={(e) => setOwnerFeedback(e.target.value)}
                            placeholder="Message visible to recruiter..."
                            className="w-full p-2 border border-blue-200 rounded outline-none text-xs h-16 bg-white"
                        />
                   </div>
               </div>

               <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                   <button 
                       onClick={() => setActionModal({ isOpen: false, type: null, jobId: null })}
                       className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
                   >
                       Cancel
                   </button>
                   <button 
                       onClick={submitJobAction}
                       disabled={!selectedReason}
                       className={`px-6 py-2 text-white font-medium rounded-lg shadow-sm ${
                           !selectedReason ? 'opacity-50 cursor-not-allowed bg-slate-400' :
                           actionModal.type === 'ApproveJob' ? 'bg-green-600 hover:bg-green-700' :
                           actionModal.type === 'ReturnJob' ? 'bg-amber-600 hover:bg-amber-700' :
                           'bg-slate-700 hover:bg-slate-800'
                       }`}
                   >
                       Confirm Decision
                   </button>
               </div>
           </div>
        </div>
      )}

      {/* User Action Modal */}
      {userActionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
               <div className={`p-4 border-b flex items-center gap-2 ${
                   userActionModal.type === 'Approve' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
               }`}>
                   {userActionModal.type === 'Approve' ? <CheckCircle size={20}/> : <XCircle size={20}/>}
                   <h3 className="font-bold">
                       {userActionModal.type === 'Approve' ? 'Approve Access' : 'Deny Access'}
                   </h3>
               </div>
               <div className="p-6 space-y-4">
                   <p className="text-sm text-slate-600">
                       Applying action for <strong>{selectedUser?.name}</strong> ({selectedUser?.role}).
                   </p>
                   
                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-2">Reason <span className="text-red-500">*</span></label>
                       <select
                           value={userReason}
                           onChange={(e) => setUserReason(e.target.value)}
                           className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                       >
                           <option value="">-- Select Reason --</option>
                           {(userActionModal.type === 'Approve' ? TEAM_APPROVAL_REASONS : TEAM_REJECTION_REASONS).map((r, i) => (
                               <option key={i} value={r}>{r}</option>
                           ))}
                       </select>
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                       <textarea 
                           value={userNotes}
                           onChange={(e) => setUserNotes(e.target.value)}
                           placeholder="Additional context..."
                           className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm h-20"
                       />
                   </div>
               </div>
               <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                   <button onClick={() => setUserActionModal({ isOpen: false, type: null, userId: null })} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                   <button 
                       onClick={submitUserAction}
                       disabled={!userReason}
                       className={`px-6 py-2 text-white font-medium rounded-lg ${!userReason ? 'bg-slate-300' : userActionModal.type === 'Approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                   >
                       Confirm
                   </button>
               </div>
           </div>
        </div>
      )}

      {/* Access Review Modal */}
      {reviewRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b flex justify-between items-start bg-purple-50">
                      <div>
                          <h3 className="font-bold text-lg text-purple-900">Review Access Request</h3>
                          <p className="text-sm text-purple-700">{reviewRequest.userName} • {reviewRequest.currentRole} ➞ {reviewRequest.requestedRole}</p>
                      </div>
                      <button onClick={() => setReviewRequestId(null)}><X size={20} className="text-purple-400 hover:text-purple-700"/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {/* Details */}
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm space-y-2">
                          <p><span className="font-bold text-slate-500 uppercase text-xs">Reason:</span> {reviewRequest.customReason || reviewRequest.reason}</p>
                          <p><span className="font-bold text-slate-500 uppercase text-xs">Motivation:</span> "{reviewRequest.motivation}"</p>
                      </div>

                      {/* Permission Selection */}
                      <div>
                          <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm"><Unlock size={16}/> Grant Specific Permissions</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {AVAILABLE_PERMISSIONS.map(perm => (
                                  <label key={perm.id} className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${selectedPermissions.includes(perm.id) ? 'bg-purple-50 border-purple-200' : 'bg-white border-slate-200 hover:border-purple-200'}`}>
                                      <input 
                                          type="checkbox" 
                                          checked={selectedPermissions.includes(perm.id)}
                                          onChange={() => handlePermissionToggle(perm.id)}
                                          className="rounded text-purple-600 w-4 h-4 focus:ring-purple-500"
                                      />
                                      <div>
                                          <div className="font-bold text-xs text-slate-800">{perm.label}</div>
                                          <div className="text-[10px] text-slate-500">{perm.description}</div>
                                      </div>
                                  </label>
                              ))}
                          </div>
                      </div>

                      {/* Chat / Comments */}
                      <div className="border-t border-slate-100 pt-4">
                          <h4 className="font-bold text-slate-700 mb-3 text-sm">Discussion</h4>
                          <div className="space-y-3 mb-4 max-h-40 overflow-y-auto bg-slate-50 p-3 rounded">
                              {reviewRequest.comments && reviewRequest.comments.length > 0 ? (
                                  reviewRequest.comments.map(c => (
                                      <div key={c.id} className={`flex gap-2 ${c.isAdmin ? 'flex-row-reverse' : ''}`}>
                                          <div className={`text-xs p-2 rounded-lg max-w-[80%] ${c.isAdmin ? 'bg-purple-100 text-purple-900' : 'bg-white border text-slate-700'}`}>
                                              <p className="font-bold mb-0.5">{c.authorName}</p>
                                              <p>{c.text}</p>
                                          </div>
                                      </div>
                                  ))
                              ) : (
                                  <p className="text-xs text-slate-400 italic text-center">No comments yet.</p>
                              )}
                              <div ref={chatEndRef}/>
                          </div>
                          <form onSubmit={sendAccessComment} className="flex gap-2">
                              <input 
                                  className="flex-1 text-sm border border-slate-200 rounded px-3 py-2 outline-none focus:border-purple-500"
                                  placeholder="Ask for clarification..."
                                  value={chatInput}
                                  onChange={(e) => setChatInput(e.target.value)}
                              />
                              <button type="submit" disabled={!chatInput.trim()} className="bg-slate-800 text-white p-2 rounded hover:bg-slate-900 disabled:opacity-50">
                                  <Send size={16}/>
                              </button>
                          </form>
                      </div>

                      {/* Decision */}
                      <div className="border-t border-slate-100 pt-4">
                          <label className="block text-sm font-medium text-slate-700 mb-2">Decision Reason / Notes <span className="text-red-500">*</span></label>
                          <textarea 
                              className="w-full border border-slate-200 rounded p-2 text-sm h-20 outline-none focus:border-purple-500"
                              placeholder="Required for approval or rejection..."
                              value={accessReason}
                              onChange={(e) => setAccessReason(e.target.value)}
                          />
                      </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                      <button onClick={() => setReviewRequestId(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded font-medium text-sm">Cancel</button>
                      <button 
                          onClick={submitAccessRejection} 
                          disabled={!accessReason}
                          className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded font-medium text-sm disabled:opacity-50"
                      >
                          Reject Request
                      </button>
                      <button 
                          onClick={submitAccessApproval}
                          disabled={!accessReason}
                          className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded font-medium text-sm disabled:opacity-50 shadow-sm"
                      >
                          Approve & Grant
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Allocation Modal */}
      {allocationModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-lg text-slate-800">Allocate Request</h3>
                      <button onClick={() => setAllocationModal({ isOpen: false, requestId: null })}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      {selectedServiceRequest && (
                          <div className="bg-indigo-50 p-3 rounded text-sm text-indigo-900 mb-4">
                              <p className="font-bold">{selectedServiceRequest.serviceType}</p>
                              <p className="text-xs mt-1">{selectedServiceRequest.clientName}</p>
                          </div>
                      )}
                      
                      {selectedServiceRequest && ['Executive Search', 'Permanent Recruitment', 'Temporary/Contract Staffing'].includes(selectedServiceRequest.serviceType) && (
                          <div className="bg-emerald-50 border border-emerald-100 p-3 rounded text-xs text-emerald-800 flex items-start gap-2">
                              <Zap size={14} className="shrink-0 mt-0.5"/>
                              <p><strong>Recruitment Request:</strong> Allocating this request will automatically create a <strong>Draft Job Listing</strong> assigned to the selected staff member for completion.</p>
                          </div>
                      )}

                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Assign Staff Member</label>
                          <select 
                              className="w-full border border-slate-200 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                              value={selectedStaffId}
                              onChange={(e) => setSelectedStaffId(e.target.value)}
                          >
                              <option value="">Select Staff...</option>
                              {users.filter(u => u.status === 'Active').map(u => (
                                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                              ))}
                          </select>
                      </div>
                      
                      <button 
                          onClick={handleAllocationSubmit}
                          disabled={!selectedStaffId}
                          className="w-full py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
                      >
                          {selectedServiceRequest && ['Executive Search', 'Permanent Recruitment', 'Temporary/Contract Staffing'].includes(selectedServiceRequest.serviceType) ? 'Assign & Create Job Draft' : 'Assign & Notify'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Approvals;
