
import React, { useState, useEffect } from 'react';
import { Job, User, Client, INDUSTRIES, JobVersion } from '../types';
import { generateJobDescription, GeneratedJobContent } from '../services/geminiService';
import { Sparkles, Save, X, Loader2, MapPin, ListChecks, Briefcase, Building2, Calendar, Hash, Star, HeartHandshake, Info, ShieldAlert, FileEdit, Globe2, CheckCircle, Target, Plus, History, RotateCcw, ArrowLeftRight, ArrowRight, UserCheck, Lock } from 'lucide-react';

interface JobCreatorProps {
  onSave: (job: Job) => void;
  onCancel: () => void;
  currentUser?: User | null;
  users?: User[]; // Added to allow Admins to allocate jobs
  clients: Client[];
  nextRefNumber: string;
  initialData?: Job | null;
  isApprovalReview?: boolean;
}

// Comprehensive list of countries with dial codes
const COUNTRIES = [
  { name: "Afghanistan", code: "+93" },
  // ... (Abbreviated list, assume standard countries)
  { name: "South Africa", code: "+27" },
  { name: "United Kingdom", code: "+44" },
  { name: "United States", code: "+1" }
];

const JobCreator: React.FC<JobCreatorProps> = ({ onSave, onCancel, currentUser, users = [], clients, nextRefNumber, initialData, isApprovalReview }) => {
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';

  // Initial state holding
  const [initialState] = useState<Partial<Job>>(initialData ? JSON.parse(JSON.stringify(initialData)) : {
    title: '',
    clientId: '',
    department: '',
    industry: INDUSTRIES[0],
    location: 'Johannesburg, Gauteng',
    isInternational: false,
    country: 'South Africa',
    description: '',
    responsibilities: [],
    requirements: [],
    desirableSkills: [],
    benefits: [],
    listingReference: nextRefNumber,
    applyBy: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    status: 'Draft',
    createdAt: new Date().toISOString(),
    type: 'Full-time',
    recruitmentType: 'Permanent Recruitment',
    salaryType: 'Range',
    salaryMin: 0,
    salaryMax: 0,
    salaryCurrency: 'ZAR',
    postedBy: currentUser?.id || '',
    recruiterName: currentUser?.name || 'Recruiter',
    recruiterAvatar: currentUser?.avatar || ''
  });

  const [job, setJob] = useState<Partial<Job>>(JSON.parse(JSON.stringify(initialState)));
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [activeList, setActiveList] = useState<'responsibilities' | 'requirements' | 'desirableSkills' | 'benefits'>('responsibilities');

  // Version Control State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [comparisonVersion, setComparisonVersion] = useState<JobVersion | null>(null);

  useEffect(() => {
      if (job.isInternational) {
          if (job.country === 'United States') setJob(prev => ({ ...prev, salaryCurrency: 'USD' }));
          else if (job.country === 'United Kingdom') setJob(prev => ({ ...prev, salaryCurrency: 'GBP' }));
          else if (['France', 'Germany', 'Italy', 'Spain', 'Netherlands'].includes(job.country || '')) setJob(prev => ({ ...prev, salaryCurrency: 'EUR' }));
      } else {
          setJob(prev => ({ ...prev, salaryCurrency: 'ZAR' }));
      }
  }, [job.isInternational, job.country]);

  const handleAddItem = () => {
    if (newItem.trim()) {
      setJob(prev => ({
        ...prev,
        [activeList]: [...(prev[activeList] || []), newItem.trim()]
      }));
      setNewItem('');
    }
  };

  const handleRemoveItem = (key: typeof activeList, index: number) => {
    setJob(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, i) => i !== index)
    }));
  };

  const handleGenerateAI = async () => {
    if (!job.title || !job.industry) {
      alert("Please enter at least a Job Title and Industry to generate content.");
      return;
    }

    setIsGenerating(true);
    try {
      const content = await generateJobDescription(
        job.title,
        job.department || 'General',
        job.industry,
        job.location || 'Remote',
        job.desirableSkills?.join(', ') || 'Standard professional skills',
        job.type || 'Full-time'
      );

      setJob(prev => ({
        ...prev,
        description: content.description,
        responsibilities: content.responsibilities,
        requirements: content.requirements,
        desirableSkills: content.desirableSkills,
        benefits: content.benefits
      }));
    } catch (error) {
      console.error(error);
      alert("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent, status: Job['status']) => {
    e.preventDefault();
    if (job.title && job.description) {
      onSave({ ...job, status } as Job);
    } else {
      alert("Please fill in at least the Job Title and Description.");
    }
  };

  // Logic: If saving without changing status (Save & Return)
  const handleSaveAndReturn = (e: React.FormEvent) => {
      e.preventDefault();
      if (job.title && job.description) {
          // Preserve current status
          onSave(job as Job); 
          // Navigation handled by parent via onSave usually, but if specific 'Return' needed:
          // In this architecture, onSave usually closes the creator.
      }
  };

  // --- Version Control Handlers ---
  const handleResetChanges = () => {
      if (confirm("Are you sure? This will revert all changes made in this session.")) {
          setJob(JSON.parse(JSON.stringify(initialState)));
      }
  };

  const handleRestoreVersion = (version: JobVersion) => {
      if (confirm(`Restore version from ${new Date(version.savedAt).toLocaleString()}? Current changes will be lost.`)) {
          setJob({ ...job, ...version.data });
          setComparisonVersion(null);
          setShowHistoryModal(false);
      }
  };

  const handleOwnerChange = (newOwnerId: string) => {
      const newOwner = users.find(u => u.id === newOwnerId);
      if (newOwner) {
          setJob(prev => ({
              ...prev,
              postedBy: newOwner.id,
              recruiterName: newOwner.name,
              recruiterAvatar: newOwner.avatar
          }));
      }
  };

  // --- Render Comparison View ---
  if (comparisonVersion) {
      const oldData = comparisonVersion.data;
      const newData = job;

      const renderDiffField = (label: string, key: keyof Job) => {
          const oldVal = String(oldData[key] || '');
          const newVal = String(newData[key] || '');
          const isDiff = oldVal !== newVal;

          return (
              <div className="mb-4 grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                  <div>
                      <label className="block text-xs text-slate-400 uppercase font-bold mb-1">{label} (v.{new Date(comparisonVersion.savedAt).toLocaleTimeString()})</label>
                      <div className={`p-3 rounded text-sm ${isDiff ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-slate-50 text-slate-600'}`}>
                          {oldVal || <span className="italic text-slate-400">Empty</span>}
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs text-slate-400 uppercase font-bold mb-1">{label} (Current Draft)</label>
                      <div className={`p-3 rounded text-sm ${isDiff ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-slate-50 text-slate-600'}`}>
                          {newVal || <span className="italic text-slate-400">Empty</span>}
                      </div>
                  </div>
              </div>
          );
      };

      return (
          <div className="fixed inset-0 z-50 bg-white flex flex-col animate-fadeIn">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-3">
                      <button onClick={() => setComparisonVersion(null)} className="p-2 hover:bg-slate-200 rounded-full"><X size={20}/></button>
                      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><ArrowLeftRight size={20}/> Version Comparison</h2>
                  </div>
                  <button 
                      onClick={() => handleRestoreVersion(comparisonVersion)} 
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
                  >
                      <RotateCcw size={16}/> Restore This Version
                  </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full">
                  {renderDiffField('Title', 'title')}
                  {renderDiffField('Department', 'department')}
                  {renderDiffField('Location', 'location')}
                  {renderDiffField('Salary Min', 'salaryMin')}
                  {renderDiffField('Salary Max', 'salaryMax')}
                  
                  <div className="mb-4 grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                      <div>
                          <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Description (Old)</label>
                          <div className={`p-3 rounded text-sm whitespace-pre-wrap ${oldData.description !== newData.description ? 'bg-red-50 text-red-700' : 'bg-slate-50'}`}>
                              {oldData.description}
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs text-slate-400 uppercase font-bold mb-1">Description (Current)</label>
                          <div className={`p-3 rounded text-sm whitespace-pre-wrap ${oldData.description !== newData.description ? 'bg-green-50 text-green-700' : 'bg-slate-50'}`}>
                              {newData.description}
                          </div>
                      </div>
                  </div>
                  
                  <div className="mb-4">
                      <label className="block text-xs text-slate-400 uppercase font-bold mb-2">Lists (Responsibilities, Requirements, etc)</label>
                      <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-500 text-sm italic">
                          Detailed list comparison is simplified in this view. Check main fields for major changes.
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  const isOwnListing = job.postedBy === currentUser?.id;

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
              {isApprovalReview ? 'Governance Review' : (initialData ? 'Edit Job Listing' : 'Create New Job Listing')}
          </h2>
          <p className="text-slate-500 mt-1">
              {isApprovalReview ? 'Review, audit, and adjudicate this listing.' : 'Define role requirements. Strict approval required.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
            {initialData && (
                <>
                    <button 
                        onClick={handleResetChanges} 
                        className="text-slate-500 hover:text-red-600 px-3 py-2 rounded hover:bg-red-50 transition-colors text-sm flex items-center gap-1"
                        title="Revert all unsaved changes"
                    >
                        <RotateCcw size={16}/> Reset
                    </button>
                    <button 
                        onClick={() => setShowHistoryModal(true)} 
                        className="text-blue-600 hover:text-blue-800 px-3 py-2 rounded hover:bg-blue-50 transition-colors text-sm flex items-center gap-1 font-medium"
                    >
                        <History size={16}/> Versions
                    </button>
                    <div className="h-6 w-px bg-slate-300 mx-2"></div>
                </>
            )}
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Governance & Audit Trail Section */}
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <ShieldAlert size={16}/> Governance & Audit Trail
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-bold text-indigo-800 mb-1">Listing Owner (Accountable)</label>
                      {isAdmin && !isApprovalReview ? (
                          <select 
                              className="w-full border border-indigo-200 rounded p-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={job.postedBy}
                              onChange={(e) => handleOwnerChange(e.target.value)}
                          >
                              {users.filter(u => u.status === 'Active').map(u => (
                                  <option key={u.id} value={u.id}>{u.name} ({u.role}) {u.id === currentUser?.id ? '(Me)' : ''}</option>
                              ))}
                          </select>
                      ) : (
                          <div className="flex items-center gap-2 p-2 bg-white rounded border border-indigo-100">
                              <img src={job.recruiterAvatar} className="w-5 h-5 rounded-full"/>
                              <span className="text-sm text-slate-700 font-medium">{job.recruiterName}</span>
                          </div>
                      )}
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-indigo-800 mb-1">Current Editor</label>
                      <div className="flex items-center gap-2 p-2 bg-white/50 rounded border border-indigo-100">
                          <span className="text-sm text-slate-600">{currentUser?.name}</span>
                          <span className="text-xs text-slate-400">({new Date().toLocaleTimeString()})</span>
                      </div>
                  </div>
              </div>
              {!isAdmin && (
                  <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1">
                      <Info size={12}/> Listings must be approved by a manager before publishing.
                  </p>
              )}
              {isAdmin && isOwnListing && (
                  <p className="text-xs text-orange-700 font-bold mt-2 flex items-center gap-1 bg-orange-100 p-2 rounded border border-orange-200">
                      <Lock size={12}/> Governance Rule: You cannot approve your own listing. It must be reviewed by another Admin.
                  </p>
              )}
          </div>

          {/* Basic Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Briefcase className="text-orange-500" size={20} /> Role Details
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Title <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="e.g. Senior React Developer"
                  value={job.title}
                  onChange={(e) => setJob({...job, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                  value={job.clientId}
                  onChange={(e) => setJob({...job, clientId: e.target.value})}
                >
                  <option value="">Select Client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="e.g. Engineering"
                  value={job.department}
                  onChange={(e) => setJob({...job, department: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                  value={job.industry}
                  onChange={(e) => setJob({...job, industry: e.target.value})}
                >
                  {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Service Type</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                  value={job.recruitmentType}
                  onChange={(e) => setJob({...job, recruitmentType: e.target.value as any})}
                >
                  <option value="Permanent Recruitment">Permanent Recruitment</option>
                  <option value="Temporary/Contract Staffing">Temporary/Contract Staffing</option>
                  <option value="Executive Search">Executive Search</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location & Salary */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Globe2 className="text-blue-500" size={20} /> Location & Compensation
            </h3>

            <div className="flex items-center justify-between mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${job.isInternational ? 'bg-blue-600' : 'bg-slate-300'}`} onClick={() => setJob({...job, isInternational: !job.isInternational})}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${job.isInternational ? 'translate-x-4' : ''}`}></div>
                    </div>
                    <span className="text-sm font-medium text-slate-700">Global Recruitment (International)</span>
                </div>
                {job.isInternational && <span className="text-xs text-blue-600 font-bold px-2 py-1 bg-blue-50 rounded">Global Mode Active</span>}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
               {job.isInternational ? (
                   <div className="col-span-2 grid grid-cols-2 gap-4 animate-fadeIn">
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                           <select 
                              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                              value={job.country}
                              onChange={(e) => {
                                  const selected = COUNTRIES.find(c => c.name === e.target.value);
                                  setJob({...job, country: e.target.value, dialCode: selected?.code });
                              }}
                           >
                               <option value="">Select Country</option>
                               {COUNTRIES.map(c => (
                                   <option key={c.name} value={c.name}>{c.name}</option>
                               ))}
                           </select>
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">City / State</label>
                           <input 
                              type="text" 
                              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                              placeholder="e.g. London"
                              value={job.location}
                              onChange={(e) => setJob({...job, location: e.target.value})}
                           />
                       </div>
                   </div>
               ) : (
                   <div className="col-span-2">
                       <label className="block text-sm font-medium text-slate-700 mb-1">Location (South Africa)</label>
                       <div className="relative">
                           <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                           <input 
                              type="text" 
                              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                              placeholder="e.g. Sandton, Gauteng"
                              value={job.location}
                              onChange={(e) => setJob({...job, location: e.target.value})}
                           />
                       </div>
                   </div>
               )}

               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Employment Type</label>
                   <select 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                      value={job.type}
                      onChange={(e) => setJob({...job, type: e.target.value as any})}
                   >
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Contract</option>
                      <option>Freelance</option>
                   </select>
               </div>

               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Salary Structure</label>
                   <select 
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                      value={job.salaryType}
                      onChange={(e) => setJob({...job, salaryType: e.target.value as any})}
                   >
                      <option value="Fixed">Fixed Amount</option>
                      <option value="Range">Range</option>
                      <option value="Hourly">Hourly Rate</option>
                      <option value="Market Related">Market Related</option>
                      <option value="Negotiable">Negotiable</option>
                   </select>
               </div>

               {(job.salaryType === 'Fixed' || job.salaryType === 'Range' || job.salaryType === 'Hourly') && (
                   <div className="col-span-2 grid grid-cols-2 gap-4 animate-fadeIn">
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">
                               Min {job.salaryCurrency}
                           </label>
                           <input 
                              type="number" 
                              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                              value={job.salaryMin}
                              onChange={(e) => setJob({...job, salaryMin: Number(e.target.value)})}
                           />
                       </div>
                       {job.salaryType === 'Range' && (
                           <div>
                               <label className="block text-sm font-medium text-slate-700 mb-1">
                                   Max {job.salaryCurrency}
                               </label>
                               <input 
                                  type="number" 
                                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                  value={job.salaryMax}
                                  onChange={(e) => setJob({...job, salaryMax: Number(e.target.value)})}
                               />
                           </div>
                       )}
                   </div>
               )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileEdit className="text-purple-500" size={20} /> Job Description
                </h3>
                <button 
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className="text-sm bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-100 flex items-center gap-2 hover:bg-purple-100 transition-colors"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>}
                  Auto-Generate with AI
                </button>
            </div>
            
            <textarea 
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none min-h-[200px] text-sm leading-relaxed"
              placeholder="Describe the role, responsibilities, and company culture..."
              value={job.description}
              onChange={(e) => setJob({...job, description: e.target.value})}
            />
          </div>
        </div>

        {/* Right Side: Lists */}
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full flex flex-col">
               <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ListChecks className="text-green-500" size={20} /> Detailed Requirements
               </h3>

               <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                   {(['responsibilities', 'requirements', 'desirableSkills', 'benefits'] as const).map(key => (
                       <button
                          key={key}
                          onClick={() => setActiveList(key)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                              activeList === key 
                              ? 'bg-slate-800 text-white' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                       >
                           {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                       </button>
                   ))}
               </div>

               <div className="flex-1 bg-slate-50 rounded-xl p-4 mb-4 overflow-y-auto max-h-[400px]">
                   <ul className="space-y-2">
                       {(job[activeList] as string[] || []).map((item, idx) => (
                           <li key={idx} className="flex items-start gap-2 group">
                               <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0"></span>
                               <span className="text-sm text-slate-700 flex-1">{item}</span>
                               <button 
                                  onClick={() => handleRemoveItem(activeList, idx)}
                                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                   <X size={14}/>
                               </button>
                           </li>
                       ))}
                       {(job[activeList] as string[] || []).length === 0 && (
                           <li className="text-sm text-slate-400 italic text-center py-4">No items added yet.</li>
                       )}
                   </ul>
               </div>

               <div className="flex gap-2">
                   <input 
                      type="text" 
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder={`Add to ${activeList}...`}
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                   />
                   <button 
                      onClick={handleAddItem}
                      className="bg-slate-800 text-white px-3 py-2 rounded-lg hover:bg-black transition-colors"
                   >
                       <Plus size={18}/>
                   </button>
               </div>
           </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 md:pl-72 z-20">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
              <div className="text-sm text-slate-500 hidden md:block">
                  <span className="font-bold text-slate-800">Reference:</span> {job.listingReference}
              </div>
              <div className="flex gap-3">
                  {isApprovalReview ? (
                      <>
                          {/* Reviewer Options */}
                          <button 
                            onClick={handleSaveAndReturn} 
                            className="px-6 py-2.5 bg-white border border-blue-200 text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
                          >
                              Save Changes & Keep Pending
                          </button>
                          <button 
                            onClick={(e) => handleSubmit(e, 'Active')}
                            disabled={isOwnListing}
                            className={`px-6 py-2.5 text-white font-bold rounded-lg shadow-lg transition-colors flex items-center gap-2 ${isOwnListing ? 'bg-slate-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-green-500/20'}`}
                            title={isOwnListing ? "Admins cannot approve their own listings." : "Publish to Live Board"}
                          >
                              <CheckCircle size={18}/> Approve & Publish
                          </button>
                      </>
                  ) : (
                      <>
                          {/* Creator Options */}
                          <button 
                            onClick={(e) => handleSubmit(e, 'Draft')}
                            className="px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                          >
                              {isAdmin && !isOwnListing ? 'Assign & Save Draft' : 'Save as Draft'}
                          </button>
                          
                          {/* No direct Publish button anymore - strictly Approval Workflow */}
                          <button 
                            onClick={(e) => handleSubmit(e, 'Pending Approval')}
                            className="px-6 py-2.5 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 flex items-center gap-2"
                          >
                              <ShieldAlert size={18}/> Submit for Approval
                          </button>
                      </>
                  )}
              </div>
          </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><History size={20}/> Version History</h3>
                      <button onClick={() => setShowHistoryModal(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                  </div>
                  <div className="p-2 max-h-[60vh] overflow-y-auto">
                      {initialData?.versions && initialData.versions.length > 0 ? (
                          initialData.versions.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()).map((v, i) => (
                              <div key={v.id} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                                  <div className="flex justify-between items-start">
                                      <div>
                                          <p className="font-bold text-slate-700 text-sm">Version {initialData.versions!.length - i}</p>
                                          <p className="text-xs text-slate-500">{new Date(v.savedAt).toLocaleString()}</p>
                                          <p className="text-xs text-slate-400 mt-1">Edited by: {v.savedBy}</p>
                                      </div>
                                      <button 
                                          onClick={() => setComparisonVersion(v)}
                                          className="px-3 py-1.5 bg-white border border-slate-200 text-blue-600 text-xs font-medium rounded hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-1"
                                      >
                                          <ArrowLeftRight size={12}/> Compare
                                      </button>
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="p-8 text-center text-slate-400 italic">No history available for this job.</div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default JobCreator;
