
import React, { useState } from 'react';
import { Job, User, Client } from '../types';
import { MoreHorizontal, MapPin, Clock, Search, Filter, Briefcase, Banknote, ArrowUpDown, Building2, Hash, Calendar, Shield, CheckCircle, Trash2, PauseCircle, FileEdit, PlayCircle, Archive, XCircle, MessageSquare, AlertOctagon, Edit3 } from 'lucide-react';

interface JobListProps {
  jobs: Job[];
  clients?: Client[];
  currentUser?: User | null;
  onApprove?: (jobId: string, reason: string) => void;
  onDelete?: (jobId: string) => void;
  onSuspend?: (jobId: string, reason: string) => void;
  onReinstate?: (jobId: string, reason: string) => void;
  onEdit?: (jobId: string) => void;
}

type SortOption = 'DateNewest' | 'DateOldest' | 'SalaryHigh' | 'SalaryLow';
type ActionType = 'Approve' | 'Suspend' | 'Reinstate';

const JobList: React.FC<JobListProps> = ({ jobs, clients = [], currentUser, onApprove, onDelete, onSuspend, onReinstate, onEdit }) => {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('DateNewest');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Salary Filter State
  const [minSalaryFilter, setMinSalaryFilter] = useState<number>(0);
  const [maxSalaryFilter, setMaxSalaryFilter] = useState<number>(2000000);

  // Action Modal State
  const [actionModal, setActionModal] = useState<{ isOpen: boolean; type: ActionType | null; jobId: string | null }>({ isOpen: false, type: null, jobId: null });
  const [actionReason, setActionReason] = useState('');

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';

  const filteredAndSortedJobs = jobs
    .filter(job => {
      const matchesStatus = statusFilter === 'All' || job.status === statusFilter;
      const matchesType = typeFilter === 'All' || job.type === typeFilter;
      const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            job.department.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Salary Logic: Simple overlap check
      const jobMin = job.salaryMin || 0;
      const jobMax = job.salaryMax || jobMin; 
      // If job salary range overlaps with filter range
      const matchesSalary = (jobMax >= minSalaryFilter) && (jobMin <= maxSalaryFilter);

      // Permission check
      if((job.status === 'Pending Approval' || job.status === 'Suspended' || job.status === 'Draft' || job.status === 'Pending Deletion' || job.status === 'Archived') && !isAdmin && job.postedBy !== currentUser?.id) return false;

      return matchesStatus && matchesType && matchesSearch && matchesSalary;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'DateNewest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'DateOldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'SalaryHigh':
          return (b.salaryMax || 0) - (a.salaryMax || 0);
        case 'SalaryLow':
          return (a.salaryMin || 0) - (b.salaryMin || 0);
        default:
          return 0;
      }
    });

  const formatSalary = (job: Job) => {
    if (job.salaryType === 'Market Related') return 'Market Related';
    if (job.salaryType === 'Negotiable') return 'Negotiable';
    const symbol = job.salaryCurrency === 'USD' ? '$' : job.salaryCurrency === 'EUR' ? '€' : job.salaryCurrency === 'GBP' ? '£' : 'R';
    
    if (job.salaryType === 'Fixed' && job.salaryMin) return `${symbol}${job.salaryMin.toLocaleString()}`;
    if (job.salaryType === 'Range' && job.salaryMin && job.salaryMax) {
        const k = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n);
        return `${symbol}${k(job.salaryMin)} - ${symbol}${k(job.salaryMax)}`;
    }
    return 'Not Specified';
  };

  const handleActionClick = (type: ActionType, jobId: string) => {
    setActionModal({ isOpen: true, type, jobId });
    setActionReason('');
  };

  const handleSubmitAction = () => {
    if(!actionModal.jobId || !actionReason) return;
    
    if(actionModal.type === 'Approve' && onApprove) onApprove(actionModal.jobId, actionReason);
    if(actionModal.type === 'Suspend' && onSuspend) onSuspend(actionModal.jobId, actionReason);
    if(actionModal.type === 'Reinstate' && onReinstate) onReinstate(actionModal.jobId, actionReason);

    setActionModal({ isOpen: false, type: null, jobId: null });
    setActionReason('');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Modal for Reasons */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
               <div className={`p-4 border-b flex items-center gap-2 ${
                   actionModal.type === 'Suspend' ? 'bg-red-50 border-red-100 text-red-800' :
                   actionModal.type === 'Approve' ? 'bg-green-50 border-green-100 text-green-800' :
                   'bg-blue-50 border-blue-100 text-blue-800'
               }`}>
                   {actionModal.type === 'Suspend' && <AlertOctagon size={20}/>}
                   {actionModal.type === 'Approve' && <CheckCircle size={20}/>}
                   {actionModal.type === 'Reinstate' && <PlayCircle size={20}/>}
                   <h3 className="font-bold">{actionModal.type} Job Listing</h3>
               </div>
               <div className="p-6">
                   <label className="block text-sm font-medium text-slate-700 mb-2">
                       Reason for action <span className="text-red-500">*</span>
                   </label>
                   <textarea 
                       value={actionReason}
                       onChange={(e) => setActionReason(e.target.value)}
                       placeholder="Please provide a mandatory reason for this action..."
                       className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none text-sm"
                   />
                   <p className="text-xs text-slate-500 mt-2">This reason will be recorded in the audit trail.</p>
               </div>
               <div className="p-4 bg-slate-50 flex justify-end gap-3">
                   <button 
                       onClick={() => setActionModal({ isOpen: false, type: null, jobId: null })}
                       className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                   >
                       Cancel
                   </button>
                   <button 
                       onClick={handleSubmitAction}
                       disabled={!actionReason.trim()}
                       className={`px-6 py-2 text-white font-medium rounded-lg transition-all shadow-sm ${
                           !actionReason.trim() ? 'opacity-50 cursor-not-allowed bg-slate-400' :
                           actionModal.type === 'Suspend' ? 'bg-red-600 hover:bg-red-700' :
                           actionModal.type === 'Approve' ? 'bg-green-600 hover:bg-green-700' :
                           'bg-blue-600 hover:bg-blue-700'
                       }`}
                   >
                       Confirm Action
                   </button>
               </div>
           </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800">Job Listings</h2>
          
          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs..." 
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Filters and Sort Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mr-2">
            <Filter size={16} />
            <span>Filters:</span>
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50 text-sm text-slate-600 cursor-pointer hover:border-slate-300"
          >
            <option value="All">Status: All</option>
            <option value="Active">Open</option>
            <option value="Closed">Closed</option>
            <option value="Draft">Draft</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Suspended">Suspended</option>
            <option value="Pending Deletion">Pending Deletion</option>
            <option value="Archived">Archived</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50 text-sm text-slate-600 cursor-pointer hover:border-slate-300"
          >
            <option value="All">Type: All</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Freelance">Freelance</option>
          </select>
          
          {/* Salary Slider / Range Inputs */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3 ml-2">
             <span className="text-xs font-medium text-slate-500">Salary (R):</span>
             <input 
                type="number" 
                placeholder="Min" 
                value={minSalaryFilter} 
                onChange={e => setMinSalaryFilter(Number(e.target.value))}
                className="w-20 px-2 py-1 border border-slate-200 rounded text-xs"
             />
             <span className="text-slate-400">-</span>
             <input 
                type="number" 
                placeholder="Max" 
                value={maxSalaryFilter} 
                onChange={e => setMaxSalaryFilter(Number(e.target.value))}
                className="w-24 px-2 py-1 border border-slate-200 rounded text-xs"
             />
          </div>

          <div className="flex-1 hidden md:block"></div>
          <div className="w-px h-8 bg-slate-200 hidden md:block mx-2"></div>

          {/* Sort By */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <ArrowUpDown size={16} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="flex-1 md:w-48 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-sm text-slate-600 cursor-pointer hover:border-slate-300"
            >
              <option value="DateNewest">Newest First</option>
              <option value="DateOldest">Oldest First</option>
              <option value="SalaryHigh">Salary: High to Low</option>
              <option value="SalaryLow">Salary: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredAndSortedJobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <Filter size={24} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No jobs match your criteria.</p>
          </div>
        ) : (
          filteredAndSortedJobs.map((job) => {
             const clientName = clients.find(c => c.id === job.clientId)?.name;
             
             return (
              <div key={job.id} className={`bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow ${
                job.status === 'Pending Approval' ? 'border-orange-200 bg-orange-50/30' : 
                job.status === 'Suspended' ? 'border-red-200 bg-red-50/30' :
                job.status === 'Draft' ? 'border-slate-300 bg-slate-50' :
                job.status === 'Pending Deletion' ? 'border-red-300 bg-red-50' :
                'border-slate-100'
              }`}>
                <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-800">{job.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        job.status === 'Active' ? 'bg-green-100 text-green-700' : 
                        job.status === 'Closed' ? 'bg-red-100 text-red-700' :
                        job.status === 'Pending Approval' ? 'bg-orange-100 text-orange-700 flex items-center gap-1' :
                        job.status === 'Suspended' ? 'bg-red-100 text-red-800 flex items-center gap-1' :
                        job.status === 'Pending Deletion' ? 'bg-red-200 text-red-900 flex items-center gap-1' :
                        job.status === 'Archived' ? 'bg-gray-200 text-gray-700' :
                        'bg-slate-200 text-slate-700 flex items-center gap-1'
                      }`}>
                        {job.status === 'Pending Approval' && <Shield size={10}/>}
                        {job.status === 'Suspended' && <PauseCircle size={10}/>}
                        {job.status === 'Draft' && <FileEdit size={10}/>}
                        {job.status === 'Pending Deletion' && <Trash2 size={10}/>}
                        {job.status === 'Active' ? 'Open' : job.status}
                      </span>
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                          <Hash size={12}/> {job.listingReference}
                      </span>
                      {/* Client Name for Staff View */}
                      {clientName && (
                         <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 font-semibold">
                           Client: {clientName}
                         </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 mb-3">
                        <span className="font-medium text-slate-700">{job.department}</span>
                        {job.industry && (
                          <span className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded text-blue-700 text-xs">
                              <Building2 size={12} /> {job.industry}
                          </span>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-slate-500 mb-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={16} className="text-slate-400" />
                        <span>{job.location || 'Remote'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Briefcase size={16} className="text-slate-400" />
                        <span>{job.type || 'Full-time'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Banknote size={16} className="text-slate-400" />
                        <span className="font-medium text-slate-700">{formatSalary(job)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={16} className="text-slate-400" />
                        <span>Apply by: {new Date(job.applyBy).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {job.dateOpened && (
                         <div className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                             <Clock size={12}/> Opened: {new Date(job.dateOpened).toLocaleDateString()}
                         </div>
                    )}
                    
                    <div className="border-t border-slate-50 pt-3">
                       <p className="text-sm text-slate-600 line-clamp-2">{job.description}</p>
                    </div>

                    {/* Action Footprint Display */}
                    {job.lastActionBy && job.lastActionReason && (
                        <div className={`mt-4 p-3 rounded-lg border text-xs ${
                            job.status === 'Suspended' ? 'bg-red-100 border-red-200 text-red-800' :
                            job.status === 'Active' ? 'bg-green-50 border-green-200 text-green-800' :
                            'bg-slate-50 border-slate-200 text-slate-600'
                        }`}>
                            <div className="flex justify-between items-start">
                                <div className="font-bold flex items-center gap-1">
                                    <MessageSquare size={12}/>
                                    {job.status === 'Suspended' ? 'Suspended' : job.status === 'Active' ? 'Approved/Reinstated' : 'Updated'} By {job.lastActionBy}
                                </div>
                                <span className="opacity-75">{job.lastActionDate ? new Date(job.lastActionDate).toLocaleDateString() : ''}</span>
                            </div>
                            <p className="mt-1 italic opacity-90">"{job.lastActionReason}"</p>
                        </div>
                    )}
                  </div>
                  
                  <div className="flex lg:flex-col items-end gap-3 w-full lg:w-auto justify-between lg:justify-start">
                    {/* Admin Actions */}
                    {isAdmin ? (
                      <div className="flex gap-2 flex-wrap justify-end">
                         {/* Admin Edit Button */}
                         <button
                            onClick={() => onEdit && onEdit(job.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 text-xs font-medium rounded border border-slate-200 hover:bg-slate-100"
                            title="Edit Listing"
                         >
                            <Edit3 size={14} /> Edit
                         </button>

                        {job.status === 'Pending Approval' && (
                          <button 
                            onClick={() => handleActionClick('Approve', job.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200 hover:bg-green-100"
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                        )}
                        {job.status === 'Pending Deletion' && (
                           <div className="flex gap-1">
                               <button 
                                 onClick={() => onDelete && onDelete(job.id)}
                                 className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded border border-red-200 hover:bg-red-100"
                               >
                                 <Trash2 size={14} /> Confirm Delete
                               </button>
                               <button 
                                 onClick={() => handleActionClick('Reinstate', job.id)}
                                 className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-700 text-xs font-medium rounded border border-slate-200 hover:bg-slate-100"
                               >
                                 <XCircle size={14} /> Reject
                               </button>
                           </div>
                        )}
                        {job.status === 'Active' && (
                           <button 
                              onClick={() => handleActionClick('Suspend', job.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded border border-amber-200 hover:bg-amber-100"
                            >
                              <PauseCircle size={14} /> Suspend
                            </button>
                        )}
                        {job.status === 'Suspended' && (
                           <button 
                              onClick={() => handleActionClick('Reinstate', job.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200 hover:bg-green-100"
                            >
                              <PlayCircle size={14} /> Reinstate
                            </button>
                        )}
                         <button 
                            onClick={() => onDelete && onDelete(job.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-400 text-xs font-medium rounded border border-slate-200 hover:bg-red-50 hover:text-red-500 transition-colors"
                            title="Delete Job"
                         >
                            <Trash2 size={14} />
                         </button>
                      </div>
                    ) : (
                       // Staff Actions
                       (job.postedBy === currentUser?.id || job.status === 'Draft') && (
                         <div className="flex gap-2">
                            <button
                                onClick={() => onEdit && onEdit(job.id)}
                                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                title="Edit Job"
                            >
                                <Edit3 size={16} />
                            </button>
                            <button 
                                onClick={() => onDelete && onDelete(job.id)}
                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                title="Delete Job"
                            >
                                <Trash2 size={16} />
                            </button>
                         </div>
                       )
                    )}

                    {job.recruiterName && (
                      <div className="flex items-center gap-2 text-xs bg-slate-50 pl-2 pr-3 py-1.5 rounded-full border border-slate-100">
                          <img src={job.recruiterAvatar || 'https://ui-avatars.com/api/?name=' + job.recruiterName} className="w-6 h-6 rounded-full" alt=""/>
                          <div className="flex flex-col items-start">
                              <span className="text-[10px] text-slate-400 leading-none">Posted by</span>
                              <span className="text-slate-600 font-medium leading-tight">{job.recruiterName}</span>
                          </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default JobList;
