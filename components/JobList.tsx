
import React, { useState } from 'react';
import { Job, User, Client, Candidate, APPROVE_REASONS, SUSPEND_REASONS, REINSTATE_REASONS, REJECT_REASONS, Permission } from '../types';
import { MoreHorizontal, MapPin, Clock, Search, Filter, Briefcase, Banknote, ArrowUpDown, Building2, Hash, Calendar, Shield, CheckCircle, Trash2, PauseCircle, FileEdit, PlayCircle, Archive, XCircle, MessageSquare, AlertOctagon, Edit3, ChevronDown, ChevronUp, Lock, UserCheck, BadgeCheck, Users, Crosshair, Zap, Star, HeartHandshake, Info, ShieldAlert, FileText, Globe2, Target, Plus, History, RotateCcw, ArrowLeftRight, ArrowRight, Share2, Link as LinkIcon, Facebook, Linkedin, Twitter, Copy, Check, Timer } from 'lucide-react';

interface JobListProps {
  jobs: Job[];
  clients?: Client[];
  candidates?: Candidate[]; 
  currentUser?: User | null;
  onApprove?: (jobId: string, reason: string, adminNotes: string, ownerFeedback: string) => void;
  onDelete?: (jobId: string) => void;
  onSuspend?: (jobId: string, reason: string, adminNotes: string, ownerFeedback: string) => void;
  onReinstate?: (jobId: string, reason: string, adminNotes: string, ownerFeedback: string) => void;
  onEdit?: (jobId: string) => void;
}

type SortOption = 'DateNewest' | 'DateOldest' | 'SalaryHigh' | 'SalaryLow';
type ActionType = 'Approve' | 'Suspend' | 'Reinstate' | 'Reject';
type ViewMode = 'Mine' | 'All';

const JobList: React.FC<JobListProps> = ({ jobs, clients = [], candidates = [], currentUser, onApprove, onDelete, onSuspend, onReinstate, onEdit }) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('DateNewest');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [viewMode, setViewMode] = useState<ViewMode>('All');
  
  const [minSalaryFilter, setMinSalaryFilter] = useState<number>(0);
  const [maxSalaryFilter, setMaxSalaryFilter] = useState<number>(2000000);

  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [analysisJobId, setAnalysisJobId] = useState<string | null>(null);
  
  const [shareMenuId, setShareMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [actionModal, setActionModal] = useState<{ isOpen: boolean; type: ActionType | null; jobId: string | null }>({ isOpen: false, type: null, jobId: null });
  const [selectedReason, setSelectedReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [ownerFeedback, setOwnerFeedback] = useState('');

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';
  
  const hasPermission = (perm: Permission) => {
      return isAdmin || (currentUser?.permissions && currentUser.permissions.includes(perm));
  };

  // Basic filtering
  const filteredJobs = jobs.filter(job => {
      if (viewMode === 'Mine' && job.postedBy !== currentUser?.id) return false;

      const matchesSearch = (job.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (job.department || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' 
          ? true 
          : statusFilter === 'Returned'
            ? (job.status === 'Draft' && !!job.lastActionReason)
            : job.status === statusFilter;

      const matchesType = typeFilter === 'All' || job.type === typeFilter;
      
      const jobMin = job.salaryMin || 0;
      const jobMax = job.salaryMax || jobMin; 
      const matchesSalary = (jobMax >= minSalaryFilter) && (jobMin <= maxSalaryFilter);

      if (viewMode === 'All' && !isAdmin && job.postedBy !== currentUser?.id) {
          if (job.status !== 'Active' && job.status !== 'Closed') return false;
      }

      return matchesStatus && matchesType && matchesSearch && matchesSalary;
  });

  // Sorting helper
  const sortJobs = (jobsList: Job[]) => {
      return [...jobsList].sort((a, b) => {
        switch (sortBy) {
            case 'DateNewest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'DateOldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case 'SalaryHigh': return (b.salaryMax || 0) - (a.salaryMax || 0);
            case 'SalaryLow': return (a.salaryMin || 0) - (b.salaryMin || 0);
            default: return 0;
        }
      });
  };

  // Split jobs if viewing "All" to show user's jobs separately
  let myJobs: Job[] = [];
  let teamJobs: Job[] = [];

  if (viewMode === 'All' && currentUser) {
      myJobs = sortJobs(filteredJobs.filter(j => j.postedBy === currentUser.id));
      teamJobs = sortJobs(filteredJobs.filter(j => j.postedBy !== currentUser.id));
  } else {
      // If viewing 'Mine', only myJobs will be populated by default filter
      myJobs = sortJobs(filteredJobs); 
  }

  const formatSalary = (job: Job) => {
    if (job.salaryType === 'Market Related') return 'Market Related';
    if (job.salaryType === 'Negotiable') return 'Negotiable';
    const symbol = job.salaryCurrency === 'USD' ? '$' : job.salaryCurrency === 'EUR' ? '€' : job.salaryCurrency === 'GBP' ? '£' : 'R';
    
    if (job.salaryType === 'Hourly' && job.salaryMin) return `${symbol}${job.salaryMin.toLocaleString()}/hr`;
    if (job.salaryType === 'Fixed' && job.salaryMin) return `${symbol}${job.salaryMin.toLocaleString()}`;
    if (job.salaryType === 'Range' && job.salaryMin && job.salaryMax) {
        const k = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n);
        return `${symbol}${k(job.salaryMin)} - ${symbol}${k(job.salaryMax)}`;
    }
    return 'Not Specified';
  };

  const handleActionClick = (type: ActionType, jobId: string) => {
    setActionModal({ isOpen: true, type, jobId });
    setSelectedReason('');
    setAdminNotes('');
    setOwnerFeedback('');
  };

  const handleSubmitAction = () => {
    if(!actionModal.jobId || !selectedReason) return;
    
    if(actionModal.type === 'Approve' && onApprove) onApprove(actionModal.jobId, selectedReason, adminNotes, ownerFeedback);
    if(actionModal.type === 'Suspend' && onSuspend) onSuspend(actionModal.jobId, selectedReason, adminNotes, ownerFeedback);
    if(actionModal.type === 'Reinstate' && onReinstate) onReinstate(actionModal.jobId, selectedReason, adminNotes, ownerFeedback);
    if(actionModal.type === 'Reject' && onReinstate) onReinstate(actionModal.jobId, selectedReason, adminNotes, ownerFeedback);

    setActionModal({ isOpen: false, type: null, jobId: null });
    setSelectedReason('');
    setAdminNotes('');
    setOwnerFeedback('');
  };
  
  const getReasonsList = (type: ActionType | null) => {
      switch(type) {
          case 'Approve': return APPROVE_REASONS;
          case 'Suspend': return SUSPEND_REASONS;
          case 'Reinstate': return REINSTATE_REASONS;
          case 'Reject': return REJECT_REASONS;
          default: return [];
      }
  };

  const handleShare = (platform: string, job: Job) => {
      const url = `https://thehiringorg.com/jobs/${job.id}`; // Mock URL
      const text = `Check out this job: ${job.title}`;
      
      if (platform === 'copy') {
          navigator.clipboard.writeText(url);
          setCopiedId(job.id);
          setTimeout(() => setCopiedId(null), 2000);
          return;
      }

      let shareUrl = '';
      switch (platform) {
          case 'linkedin': shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`; break;
          case 'twitter': shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`; break;
          case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`; break;
      }
      if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
      setShareMenuId(null);
  };
  
  const getMatchedCandidates = (jobId: string, limit: number = 5) => {
      const job = jobs.find(j => j.id === jobId);
      if(!job) return [];
      return candidates.map(c => {
          let score = 40;
          if (c.skills && job.requirements) {
             const matchCount = c.skills.filter(skill => job.requirements.some(req => req.toLowerCase().includes(skill.toLowerCase()))).length;
             score += matchCount * 15;
          }
          if (c.role === jobId) score += 20; 
          return { candidate: c, score: Math.min(98, score + Math.floor(Math.random() * 20)) };
      }).sort((a, b) => b.score - a.score).slice(0, limit);
  };

  const getApplicantCount = (jobId: string) => {
      return candidates.filter(c => c.role === jobId).length;
  };

  const getDaysOpen = (dateString?: string) => {
      if (!dateString) return 0;
      const diff = new Date().getTime() - new Date(dateString).getTime();
      return Math.floor(diff / (1000 * 3600 * 24));
  };

  const renderAnalysisModal = () => {
      if (!analysisJobId) return null;
      const job = jobs.find(j => j.id === analysisJobId);
      const topMatches = getMatchedCandidates(analysisJobId, 10);
      
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[80vh]">
                   <div className="p-5 border-b bg-slate-50 flex justify-between items-center">
                       <div>
                           <h3 className="font-bold text-lg flex items-center gap-2"><Zap size={18} className="text-amber-500 fill-amber-500"/> Quick AI Analysis</h3>
                           <p className="text-sm text-slate-500">Top matches for {job?.title}</p>
                       </div>
                       <button onClick={() => setAnalysisJobId(null)} className="p-2 hover:bg-slate-200 rounded-full"><XCircle size={20} className="text-slate-400"/></button>
                   </div>
                   <div className="p-0 overflow-y-auto flex-1">
                       {topMatches.map((item, idx) => (
                           <div key={item.candidate.id} className="flex items-center gap-4 p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white ${idx < 3 ? 'bg-green-500' : 'bg-slate-400'}`}>
                                   {item.score}%
                               </div>
                               <div className="flex-1">
                                   <h4 className="font-bold text-slate-800">{item.candidate.name}</h4>
                                   <p className="text-xs text-slate-500">{item.candidate.location} • {item.candidate.experienceYears}y Exp</p>
                               </div>
                           </div>
                       ))}
                   </div>
                   <div className="p-4 bg-slate-50 border-t text-center">
                       <button onClick={() => setAnalysisJobId(null)} className="text-slate-500 hover:text-slate-800 text-sm font-medium">Close Analysis</button>
                   </div>
              </div>
          </div>
      );
  };

  const renderJobCard = (job: Job) => {
      const clientName = clients.find(c => c.id === job.clientId)?.name;
      const isExpanded = expandedJobId === job.id;
      const isOwner = currentUser?.id === job.postedBy;
      const isReturned = job.status === 'Draft' && !!job.lastActionReason;
      const daysOpen = getDaysOpen(job.dateOpened || job.createdAt);
      const applicantCount = getApplicantCount(job.id);
      
      const isUrgent = new Date(job.applyBy).getTime() < Date.now() + 86400000 * 3;
      const isClosed = job.status === 'Closed';

      return (
       <div key={job.id} className={`rounded-xl shadow-sm border hover:shadow-md transition-shadow relative overflow-hidden ${
         isReturned ? 'border-amber-200 bg-amber-50/20' :
         job.status === 'Pending Approval' ? 'border-orange-200 bg-orange-50/30' : 
         isClosed ? 'border-slate-100 bg-slate-50 opacity-75 grayscale-[0.3]' :
         'border-slate-100 bg-white'
       }`}>
         
         <div className="p-5">
             <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                 <div className="flex-1 w-full">
                     <div className="flex flex-wrap items-center gap-3 mb-2">
                         <h3 className="text-lg font-bold text-slate-800 cursor-pointer hover:text-orange-600" onClick={() => setExpandedJobId(isExpanded ? null : job.id)}>{job.title}</h3>
                         <span className={`px-2 py-1 rounded text-xs font-medium ${job.status === 'Active' ? 'bg-green-100 text-green-700' : job.status === 'Closed' ? 'bg-slate-200 text-slate-500' : 'bg-slate-200 text-slate-700'}`}>
                             {job.status}
                         </span>
                         {isReturned && <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">Returned</span>}
                         {isUrgent && job.status === 'Active' && <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1"><AlertOctagon size={10}/> Closing Soon</span>}
                     </div>
                     
                     <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-3">
                         <span className="flex items-center gap-1"><Building2 size={14}/> {clientName || 'Internal'}</span>
                         <span className="flex items-center gap-1"><MapPin size={14}/> {job.location}</span>
                         <span className="flex items-center gap-1"><Banknote size={14}/> {formatSalary(job)}</span>
                     </div>
                     
                     <div className="flex gap-3 mt-2 text-xs">
                         <span className="bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1 rounded flex items-center gap-1 font-medium">
                             <Users size={12}/> {applicantCount} Applicants
                         </span>
                         <span className="bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1 rounded flex items-center gap-1 font-medium">
                             <Timer size={12}/> {daysOpen} Days Open
                         </span>
                         <span className="bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1 rounded flex items-center gap-1 font-medium">
                             <Briefcase size={12}/> {job.type}
                         </span>
                     </div>
                     
                     {job.lastActionReason && isReturned && (
                         <div className="text-xs bg-amber-100 text-amber-800 p-2 rounded border border-amber-200 mt-2 inline-block">
                             <strong>Attention Needed:</strong> {job.lastActionReason}
                         </div>
                     )}
                 </div>
             
                 <div className="flex lg:flex-col items-end gap-3 w-full lg:w-auto justify-between lg:justify-start">
                     
                     <div className="flex flex-wrap items-center justify-end gap-2">
                         {/* Owner Tag */}
                         <div className={`flex items-center gap-2 px-2 py-1.5 rounded-full text-[10px] font-medium border ${isOwner ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                             <img src={job.recruiterAvatar} alt="" className="w-4 h-4 rounded-full"/>
                             <span>{job.recruiterName}</span>
                         </div>

                         {/* Actions */}
                         {isAdmin ? (
                         <div className="flex gap-2 flex-wrap justify-end">
                             <button onClick={() => onEdit && onEdit(job.id)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-medium rounded border border-slate-200 hover:bg-slate-100"><Edit3 size={14} /> Edit</button>
                             {job.status === 'Pending Approval' && (
                                 <button 
                                     onClick={() => handleActionClick('Approve', job.id)} 
                                     disabled={isOwner}
                                     className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border ${isOwner ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}
                                     title={isOwner ? "Governance Alert: You cannot approve your own listing." : "Approve Listing"}
                                 >
                                     {isOwner ? <Lock size={14}/> : <CheckCircle size={14} />} 
                                     Approve
                                 </button>
                             )}
                             <button 
                                 onClick={() => onDelete && onDelete(job.id)}
                                 className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-400 text-xs font-medium rounded border border-slate-200 hover:bg-red-50 hover:text-red-500 transition-colors"
                                 title="Archive Listing"
                             >
                                 <Archive size={14} /> Archive
                             </button>
                         </div>
                         ) : (
                         (job.postedBy === currentUser?.id || job.status === 'Draft' || hasPermission('EDIT_JOB') || hasPermission('DELETE_JOB')) && (
                             <div className="flex gap-2">
                                 {(job.postedBy === currentUser?.id || hasPermission('EDIT_JOB')) && (
                                     <button onClick={() => onEdit && onEdit(job.id)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit3 size={16} /></button>
                                 )}
                                 {(job.postedBy === currentUser?.id || hasPermission('DELETE_JOB')) && (
                                     <button onClick={() => onDelete && onDelete(job.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors" title="Archive"><Archive size={16} /></button>
                                 )}
                             </div>
                         )
                         )}
                     </div>

                     <div className="flex items-center justify-end gap-2 w-full relative">
                         <div className="relative">
                             <button 
                                 onClick={() => setShareMenuId(shareMenuId === job.id ? null : job.id)} 
                                 className={`p-1.5 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors ${shareMenuId === job.id ? 'bg-blue-50 text-blue-600' : ''}`}
                                 title="Share Listing"
                             >
                                 <Share2 size={18}/>
                             </button>
                             {shareMenuId === job.id && (
                                 <div className="absolute right-0 top-8 bg-white shadow-xl border border-slate-100 rounded-lg p-2 flex gap-2 z-20 animate-fadeIn">
                                     <button onClick={() => handleShare('linkedin', job)} className="p-2 hover:bg-blue-50 rounded text-blue-700"><Linkedin size={16}/></button>
                                     <button onClick={() => handleShare('twitter', job)} className="p-2 hover:bg-slate-50 rounded text-sky-500"><Twitter size={16}/></button>
                                     <button onClick={() => handleShare('facebook', job)} className="p-2 hover:bg-blue-50 rounded text-blue-600"><Facebook size={16}/></button>
                                     <div className="w-px h-6 bg-slate-200 my-auto"></div>
                                     <button onClick={() => handleShare('copy', job)} className="p-2 hover:bg-slate-50 rounded text-slate-600 flex items-center gap-1">
                                         {copiedId === job.id ? <Check size={16} className="text-green-600"/> : <Copy size={16}/>}
                                     </button>
                                 </div>
                             )}
                         </div>

                         <button onClick={() => setExpandedJobId(isExpanded ? null : job.id)} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500">
                             {isExpanded ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                         </button>
                     </div>
                 </div>
             </div>
         </div>

         {isExpanded && (
             <div className="border-t border-slate-100 bg-slate-50 p-6 animate-fadeIn rounded-b-xl">
                 <div className="grid md:grid-cols-2 gap-8">
                     <div>
                         <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-3">Description</h4>
                         <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{job.description}</p>
                     </div>
                     
                     <div className="space-y-6">
                         <div>
                             <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-3">Key Requirements</h4>
                             <ul className="space-y-2">
                                 {job.requirements && job.requirements.length > 0 ? job.requirements.map((req, i) => (
                                     <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                         <span className="mt-1.5 w-1.5 h-1.5 bg-orange-400 rounded-full shrink-0"></span>
                                         <span>{req}</span>
                                     </li>
                                 )) : <li className="text-sm text-slate-400 italic">No specific requirements listed.</li>}
                             </ul>
                         </div>

                         {job.benefits && job.benefits.length > 0 && (
                             <div>
                                 <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-3">Benefits & Perks</h4>
                                 <div className="flex flex-wrap gap-2">
                                     {job.benefits.map((b, i) => (
                                         <span key={i} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded border border-green-200 font-medium">
                                             {b}
                                         </span>
                                     ))}
                                 </div>
                             </div>
                         )}
                         
                         <div className="pt-4 border-t border-slate-200">
                             <div className="flex justify-between items-center text-sm">
                                 <span className="text-slate-500">Salary Range:</span>
                                 <span className="font-bold text-slate-800">{formatSalary(job)}</span>
                             </div>
                         </div>
                     </div>
                 </div>
                 <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end gap-3">
                     <button 
                         onClick={() => setAnalysisJobId(job.id)}
                         className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium shadow-sm"
                     >
                         <Zap size={16} className="text-amber-500"/> AI Match Analysis
                     </button>
                 </div>
             </div>
         )}
       </div>
      );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {renderAnalysisModal()}

      {/* Action Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
               <div className="p-4 border-b bg-slate-50 flex justify-between">
                   <h3 className="font-bold">{actionModal.type}</h3>
                   <button onClick={() => setActionModal({isOpen: false, type: null, jobId: null})}><XCircle size={20}/></button>
               </div>
               <div className="p-6 space-y-4">
                   <select className="w-full border p-2 rounded" value={selectedReason} onChange={e => setSelectedReason(e.target.value)}>
                       <option value="">Select Reason...</option>
                       {getReasonsList(actionModal.type).map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                   <button onClick={handleSubmitAction} disabled={!selectedReason} className="w-full bg-blue-600 text-white py-2 rounded">Confirm</button>
               </div>
           </div>
        </div>
      )}

      {/* Filters... */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                  <Filter size={16} />
                  <span>Filters:</span>
              </div>
              <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                      type="text" 
                      placeholder="Search jobs..." 
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                  />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded text-sm outline-none">
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                  <option value="Pending Approval">Pending</option>
                  <option value="Closed">Closed</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Returned">Returned</option>
              </select>
              <select value={viewMode} onChange={e => setViewMode(e.target.value as ViewMode)} className="px-3 py-2 border rounded text-sm outline-none">
                  <option value="All">All Jobs</option>
                  <option value="Mine">My Jobs Only</option>
              </select>
              {viewMode === 'All' && (
                  <button onClick={() => {setSearchQuery(''); setStatusFilter('All');}} className="text-xs text-blue-600 hover:underline">Clear Filters</button>
              )}
          </div>
      </div>

      {viewMode === 'All' && currentUser ? (
          <div className="space-y-8">
              {myJobs.length > 0 && (
                  <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-4 pl-1 flex items-center gap-2">
                          <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                          My Active Listings
                      </h3>
                      <div className="grid gap-4">
                          {myJobs.map(renderJobCard)}
                      </div>
                  </div>
              )}
              
              {teamJobs.length > 0 && (
                  <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-4 pl-1 flex items-center gap-2">
                          <div className="w-1 h-6 bg-slate-400 rounded-full"></div>
                          Team Listings
                      </h3>
                      <div className="grid gap-4">
                          {teamJobs.map(renderJobCard)}
                      </div>
                  </div>
              )}

              {myJobs.length === 0 && teamJobs.length === 0 && (
                  <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-100">
                      <p className="text-slate-500 font-medium">No jobs match your criteria.</p>
                  </div>
              )}
          </div>
      ) : (
          <div className="grid gap-4">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-100">
                <p className="text-slate-500 font-medium">No jobs match your criteria.</p>
              </div>
            ) : (
              sortJobs(filteredJobs).map(renderJobCard)
            )}
          </div>
      )}
    </div>
  );
};

export default JobList;
