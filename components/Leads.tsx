
import React, { useState } from 'react';
import { Job, Candidate } from '../types';
import { FileText, Search, Briefcase, ChevronRight, Users, Filter, X, ExternalLink, MapPin, Mail, Phone, CheckCircle, User as UserIcon } from 'lucide-react';

interface LeadsProps {
  jobs: Job[];
  candidates: Candidate[];
  onNavigateToProfile?: (candidateId: string) => void;
}

const Leads: React.FC<LeadsProps> = ({ jobs, candidates, onNavigateToProfile }) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs.filter(j => j.status === 'Active')[0]?.id || '');
  const [previewCandidate, setPreviewCandidate] = useState<Candidate | null>(null);

  const activeJobs = jobs.filter(j => j.status === 'Active');
  const selectedJob = jobs.find(j => j.id === selectedJobId);

  // Simulated Lead Matching Logic
  const leads = candidates.map(c => {
      // Mock score generation based on skills overlap if available
      let score = 40; // Base
      if (selectedJob && c.skills && selectedJob.requirements) {
          const matchCount = c.skills.filter(skill => 
              selectedJob.requirements.some(req => req.toLowerCase().includes(skill.toLowerCase()))
          ).length;
          score += matchCount * 10;
      }
      // Randomize slightly for demo variety
      score += Math.floor(Math.random() * 20);
      return { candidate: c, score: Math.min(score, 98) };
  }).sort((a, b) => b.score - a.score);

  const handleVisitProfile = () => {
      if (previewCandidate && onNavigateToProfile) {
          onNavigateToProfile(previewCandidate.id);
      }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn pb-20 relative">
       <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Leads Report</h2>
          <p className="text-slate-500 mt-1">Identify top candidates from your existing pool for open positions.</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           {/* Left Panel: Job Selector */}
           <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-100 p-4 h-fit">
               <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2"><Briefcase size={16}/> Select Active Job</h3>
               <div className="space-y-2">
                   {activeJobs.map(job => (
                       <button 
                         key={job.id}
                         onClick={() => setSelectedJobId(job.id)}
                         className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedJobId === job.id ? 'bg-orange-50 text-orange-700 font-medium border border-orange-100' : 'text-slate-600 hover:bg-slate-50'}`}
                       >
                           <div className="truncate">{job.title}</div>
                           <div className="text-xs opacity-75 truncate">{job.listingReference}</div>
                       </button>
                   ))}
               </div>
           </div>

           {/* Right Panel: Leads List */}
           <div className="lg:col-span-3">
               {selectedJob ? (
                   <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                       <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                           <div>
                               <h3 className="font-bold text-slate-800">Potential Matches</h3>
                               <p className="text-sm text-slate-500">Candidates in pool matching "{selectedJob.title}"</p>
                           </div>
                           <div className="flex items-center gap-2 text-sm text-slate-600">
                               <Users size={16}/> {leads.length} Candidates Analyzed
                           </div>
                       </div>
                       <div className="divide-y divide-slate-50">
                           {leads.map(({candidate, score}) => (
                               <div key={candidate.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center gap-4 group">
                                   <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${score > 75 ? 'bg-green-500' : score > 50 ? 'bg-orange-500' : 'bg-slate-300'}`}>
                                       {score}%
                                   </div>
                                   <div className="flex-1 min-w-0">
                                       <div className="flex justify-between">
                                           <h4 className="font-bold text-slate-800 truncate">{candidate.name}</h4>
                                           <span className="text-xs text-slate-400 whitespace-nowrap">Last Active: {candidate.applicationDate ? new Date(candidate.applicationDate).toLocaleDateString() : 'N/A'}</span>
                                       </div>
                                       <p className="text-sm text-slate-600 truncate">{candidate.role ? 'Applied to another role' : 'General Profile'} • {candidate.location}</p>
                                       {candidate.skills && (
                                           <div className="flex flex-wrap gap-1 mt-1">
                                               {candidate.skills.slice(0, 3).map((s, i) => (
                                                   <span key={i} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">{s}</span>
                                               ))}
                                           </div>
                                       )}
                                   </div>
                                   <button 
                                      onClick={() => setPreviewCandidate(candidate)}
                                      className="opacity-0 group-hover:opacity-100 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded shadow-sm hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all whitespace-nowrap"
                                   >
                                       View Profile
                                   </button>
                               </div>
                           ))}
                       </div>
                   </div>
               ) : (
                   <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
                       <Filter size={32} className="mb-2 opacity-50"/>
                       <p>Select a job to generate leads report</p>
                   </div>
               )}
           </div>
       </div>

       {/* Candidate Profile Preview Modal */}
       {previewCandidate && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                   <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                       <div className="flex items-center gap-4">
                           <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                                {previewCandidate.avatar ? (
                                    <img src={previewCandidate.avatar} className="w-full h-full object-cover" alt={previewCandidate.name}/>
                                ) : (
                                    <UserIcon size={32} className="text-slate-400"/>
                                )}
                           </div>
                           <div>
                               <h2 className="text-xl font-bold text-slate-800">{previewCandidate.name}</h2>
                               <p className="text-sm text-slate-500">{previewCandidate.role ? 'Applicant' : 'Pool Candidate'}</p>
                           </div>
                       </div>
                       <button 
                           onClick={() => setPreviewCandidate(null)}
                           className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                       >
                           <X size={20} className="text-slate-400"/>
                       </button>
                   </div>
                   
                   <div className="p-6 overflow-y-auto space-y-6">
                       {/* Contact Details */}
                       <div className="grid grid-cols-2 gap-4">
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                               <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                   <Mail size={12}/> Email
                               </div>
                               <p className="text-sm font-medium text-slate-700 truncate" title={previewCandidate.email}>{previewCandidate.email}</p>
                           </div>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                               <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                   <Phone size={12}/> Phone
                               </div>
                               <p className="text-sm font-medium text-slate-700">{previewCandidate.phone || 'N/A'}</p>
                           </div>
                           <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 col-span-2">
                               <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                                   <MapPin size={12}/> Location
                               </div>
                               <p className="text-sm font-medium text-slate-700">{previewCandidate.location || 'Not specified'}</p>
                           </div>
                       </div>

                       {/* Skills */}
                       <div>
                           <h4 className="font-bold text-slate-800 text-sm mb-2">Top Skills</h4>
                           <div className="flex flex-wrap gap-2">
                               {(previewCandidate.skills || []).length > 0 ? (
                                   previewCandidate.skills?.map((skill, i) => (
                                       <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-100">
                                           {skill}
                                       </span>
                                   ))
                               ) : (
                                   <span className="text-sm text-slate-400 italic">No skills listed.</span>
                               )}
                           </div>
                       </div>

                       {/* Summary */}
                       <div>
                           <h4 className="font-bold text-slate-800 text-sm mb-2">Profile Summary</h4>
                           <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                               {previewCandidate.cvText ? (
                                   previewCandidate.cvText.length > 200 
                                   ? `${previewCandidate.cvText.substring(0, 200)}...` 
                                   : previewCandidate.cvText
                               ) : (
                                   <span className="italic text-slate-400">No summary available.</span>
                               )}
                           </p>
                       </div>
                   </div>

                   <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                       <button 
                           onClick={() => setPreviewCandidate(null)}
                           className="px-4 py-2 text-slate-600 font-medium hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all"
                       >
                           Close
                       </button>
                       <button 
                           onClick={handleVisitProfile}
                           className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-black shadow-md transition-all flex items-center gap-2"
                       >
                           Visit Full Profile <ExternalLink size={16}/>
                       </button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default Leads;
