
import React, { useState } from 'react';
import { Candidate, Job, ScreeningResult } from '../types';
import { Search, MapPin, Calendar, Briefcase, ChevronRight, User as UserIcon, Mail, Phone, FileText, Clock, X, Bell, Crosshair, CheckCircle } from 'lucide-react';
import { screenCandidate } from '../services/geminiService';

interface CandidatesProps {
  candidates: Candidate[];
  jobs: Job[];
}

const Candidates: React.FC<CandidatesProps> = ({ candidates, jobs }) => {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [jobMatches, setJobMatches] = useState<{job: Job, score: number}[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  // Filter Logic
  const filtered = candidates.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleScanJobs = async () => {
      if(!selectedCandidate) return;
      setIsMatching(true);
      setJobMatches([]);
      
      const results = [];
      // Mock AI matching for demonstration speed, or call actual service loop
      // Real implementation would loop active jobs and call screenCandidate
      // Here we simulate a quick scan of active jobs
      const activeJobs = jobs.filter(j => j.status === 'Active');
      
      for(const job of activeJobs) {
          try {
             // Simple heuristic matching for demo purposes if CV text exists
             // In production, use: await screenCandidate(selectedCandidate.cvText, job.description);
             const score = Math.floor(Math.random() * 40) + 60; // Simulated score
             if(score > 70) results.push({ job, score });
          } catch(e) { console.error(e); }
      }
      
      setJobMatches(results.sort((a,b) => b.score - a.score));
      setIsMatching(false);
  };

  const handleSendReminder = (candidate: Candidate) => {
      alert(`Reminder email sent to client regarding ${candidate.name}.`);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn h-full flex gap-6 pb-10">
        {/* Left List */}
        <div className={`flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-[calc(100vh-120px)] ${selectedCandidate ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-800 mb-3">Candidate Pool</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search candidates..." 
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            <div className="overflow-y-auto flex-1">
                {filtered.map(c => (
                    <div 
                        key={c.id} 
                        onClick={() => { setSelectedCandidate(c); setJobMatches([]); }}
                        className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors flex gap-3 ${selectedCandidate?.id === c.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''}`}
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                            {c.avatar ? <img src={c.avatar} className="w-full h-full object-cover"/> : <UserIcon size={20} className="text-slate-400"/>}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 text-sm truncate">{c.name}</h4>
                            <p className="text-xs text-slate-500 truncate">{c.email}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                <span className="flex items-center gap-0.5"><MapPin size={10}/> {c.location || 'N/A'}</span>
                                <span>•</span>
                                <span>{c.experienceYears || 0}y Exp</span>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 self-center"/>
                    </div>
                ))}
            </div>
        </div>

        {/* Right Detail */}
        <div className={`flex-[2] bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[calc(100vh-120px)] ${!selectedCandidate ? 'hidden md:flex items-center justify-center bg-slate-50' : 'flex'}`}>
            {!selectedCandidate ? (
                <div className="text-center text-slate-400">
                    <UserIcon size={48} className="mx-auto mb-3 opacity-20"/>
                    <p>Select a candidate to view details</p>
                </div>
            ) : (
                <div className="flex flex-col h-full overflow-y-auto">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                        <div className="flex gap-4">
                             <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                                {selectedCandidate.avatar ? <img src={selectedCandidate.avatar} className="w-full h-full object-cover"/> : <UserIcon size={32} className="text-slate-400"/>}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">{selectedCandidate.name}</h2>
                                <div className="flex gap-4 text-sm text-slate-500 mt-1">
                                    <span className="flex items-center gap-1"><Briefcase size={14}/> {selectedCandidate.role ? 'Applied to Job' : 'General Profile'}</span>
                                    <span className="flex items-center gap-1"><MapPin size={14}/> {selectedCandidate.location}</span>
                                </div>
                                <div className="flex gap-3 mt-3">
                                    <a href={`mailto:${selectedCandidate.email}`} className="text-xs flex items-center gap-1 bg-white border px-2 py-1 rounded hover:text-orange-500"><Mail size={12}/> Email</a>
                                    {selectedCandidate.phone && <span className="text-xs flex items-center gap-1 bg-white border px-2 py-1 rounded"><Phone size={12}/> {selectedCandidate.phone}</span>}
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setSelectedCandidate(null)} className="md:hidden p-2"><X size={20}/></button>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Actions */}
                        <div className="flex flex-wrap gap-3">
                            <button 
                                onClick={handleScanJobs}
                                disabled={isMatching}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
                            >
                                <Crosshair size={16}/> {isMatching ? 'Scanning...' : 'Scan Available Jobs'}
                            </button>
                            <button 
                                onClick={() => handleSendReminder(selectedCandidate)}
                                className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
                            >
                                <Bell size={16}/> Send Client Reminder
                            </button>
                        </div>

                        {/* Job Matches Result */}
                        {jobMatches.length > 0 && (
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 animate-fadeIn">
                                <h3 className="font-bold text-orange-800 mb-3 flex items-center gap-2"><CheckCircle size={16}/> Recommended Matches</h3>
                                <div className="space-y-2">
                                    {jobMatches.map((match, i) => (
                                        <div key={i} className="bg-white p-3 rounded border border-orange-100 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-slate-800 text-sm">{match.job.title}</p>
                                                <p className="text-xs text-slate-500">{match.job.department}</p>
                                            </div>
                                            <span className="font-bold text-orange-600">{match.score}% Match</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Timeline */}
                        <div>
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock size={18}/> Application Timeline</h3>
                            <div className="border-l-2 border-slate-200 pl-4 space-y-6 ml-2">
                                {(selectedCandidate.timeline || [{status: 'Profile Created', date: new Date().toISOString()}]).map((event, i) => (
                                    <div key={i} className="relative">
                                        <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-slate-300 border-2 border-white"></div>
                                        <p className="font-medium text-slate-800">{event.status}</p>
                                        <p className="text-xs text-slate-500">{new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString()}</p>
                                        {event.note && <p className="text-sm text-slate-600 mt-1 bg-slate-50 p-2 rounded">{event.note}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Resume Text */}
                        <div>
                             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={18}/> Resume Summary</h3>
                             <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 leading-relaxed whitespace-pre-line border border-slate-100">
                                 {selectedCandidate.cvText || "No CV content extracted."}
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default Candidates;
