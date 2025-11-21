
import React, { useState } from 'react';
import { Job, Candidate } from '../types';
import { FileText, Search, Briefcase, ChevronRight, Users, Filter } from 'lucide-react';

interface LeadsProps {
  jobs: Job[];
  candidates: Candidate[];
}

const Leads: React.FC<LeadsProps> = ({ jobs, candidates }) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs.filter(j => j.status === 'Active')[0]?.id || '');

  const activeJobs = jobs.filter(j => j.status === 'Active');
  const selectedJob = jobs.find(j => j.id === selectedJobId);

  // Simulated Lead Matching Logic
  // In a real app, this would run an AI analysis on the entire candidate pool against the selected job description
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

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn pb-20">
       <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Leads Report</h2>
          <p className="text-slate-500 mt-1">Identify top candidates from your existing pool for open positions.</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           {/* Left Panel: Job Selector */}
           <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
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
                                   <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${score > 75 ? 'bg-green-500' : score > 50 ? 'bg-orange-500' : 'bg-slate-300'}`}>
                                       {score}%
                                   </div>
                                   <div className="flex-1">
                                       <div className="flex justify-between">
                                           <h4 className="font-bold text-slate-800">{candidate.name}</h4>
                                           <span className="text-xs text-slate-400">Last Active: {candidate.applicationDate ? new Date(candidate.applicationDate).toLocaleDateString() : 'N/A'}</span>
                                       </div>
                                       <p className="text-sm text-slate-600">{candidate.role ? 'Applied to another role' : 'General Profile'} • {candidate.location}</p>
                                       {candidate.skills && (
                                           <div className="flex flex-wrap gap-1 mt-1">
                                               {candidate.skills.slice(0, 3).map((s, i) => (
                                                   <span key={i} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">{s}</span>
                                               ))}
                                           </div>
                                       )}
                                   </div>
                                   <button className="opacity-0 group-hover:opacity-100 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded shadow-sm hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all">
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
    </div>
  );
};

export default Leads;
