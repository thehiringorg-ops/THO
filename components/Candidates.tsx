import React, { useState, useEffect, useRef } from 'react';
import { Candidate, Job, User, CandidateComment, ChatMessage, ActivityLog, InterviewAnalysis, ReferenceCheck } from '../types';
import { Search, MapPin, Calendar, Briefcase, ChevronRight, User as UserIcon, Mail, Phone, FileText, Clock, X, Bell, Crosshair, CheckCircle, Send, MessageSquare, Link as LinkIcon, UserPlus, FileDown, ExternalLink, Filter, ArrowUpDown, Eye, Gavel, AlertCircle, Mic, Brain, TrendingUp, Share2, Video, PhoneCall, PlayCircle, Unlock, Lock, Shield, ShieldAlert, History, Sparkles, Star } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface CandidatesProps {
  candidates: Candidate[];
  jobs: Job[];
  currentUser?: User | null;
  onAddComment?: (candidateId: string, text: string) => void;
  onUpdateCandidateStatus?: (candidateId: string, status: Candidate['status'], notes?: string) => void;
  messages?: ChatMessage[];
  onSendMessage?: (text: string, recipientId: string) => void;
  activityLogs?: ActivityLog[];
  initialCandidateId?: string | null;
}

const Candidates: React.FC<CandidatesProps> = ({ candidates, jobs, currentUser, onAddComment, onUpdateCandidateStatus, messages = [], onSendMessage, activityLogs = [], initialCandidateId }) => {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [jobFilter, setJobFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'Newest' | 'Oldest' | 'Name'>('Newest');
  const [activeDetailTab, setActiveDetailTab] = useState<'profile' | 'insights' | 'interviews' | 'references' | 'timeline' | 'messages'>('profile');
  
  // FIX: Default to 'all' for Admins so the list isn't empty initially
  const [viewMode, setViewMode] = useState<'mine' | 'all'>(
      currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin' ? 'all' : 'mine'
  );
  
  const [complianceMode, setComplianceMode] = useState(false); // Bias Shield

  // AI Loading States
  const [isAnalyzingInsights, setIsAnalyzingInsights] = useState(false);
  const [isProcessingInterview, setIsProcessingInterview] = useState(false);
  const [isCallingReference, setIsCallingReference] = useState(false);

  // Adjudication
  const [statusNote, setStatusNote] = useState('');
  const [targetStatus, setTargetStatus] = useState<Candidate['status']>('Screened');
  
  const [newComment, setNewComment] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Gemini Client
  const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

  useEffect(() => {
      if (initialCandidateId) {
          const candidate = candidates.find(c => c.id === initialCandidateId);
          if (candidate) setSelectedCandidate(candidate);
      }
  }, [initialCandidateId, candidates]);

  const filtered = candidates.filter(c => {
      if (viewMode === 'mine' && currentUser) {
          const job = jobs.find(j => j.id === c.role);
          // If applied to a job, check if I own the job.
          if (job && job.postedBy !== currentUser.id) return false; 
          // If pool candidate (no role), hide in 'mine' view unless explicitly assigned (future feature)
          if (!job) return false; 
      }
      const matchesSearch = (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.email || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      const matchesJob = jobFilter === 'All' || c.role === jobFilter; 
      return matchesSearch && matchesStatus && matchesJob;
  }).sort((a, b) => {
      if (sortBy === 'Name') return a.name.localeCompare(b.name);
      if (sortBy === 'Oldest') return new Date(a.applicationDate || a.id).getTime() - new Date(b.applicationDate || b.id).getTime();
      return new Date(b.applicationDate || b.id).getTime() - new Date(a.applicationDate || a.id).getTime();
  });

  // --- AI Feature: Placement & Flight Risk Analysis ---
  const runSmartInsights = async () => {
      if(!selectedCandidate) return;
      setIsAnalyzingInsights(true);
      
      try {
          const ai = getAi();
          const prompt = `
            Analyze this candidate:
            Experience: ${selectedCandidate.experienceYears} years
            Skills: ${selectedCandidate.skills?.join(', ')}
            History: ${JSON.stringify(selectedCandidate.employmentHistory)}
            
            1. Predict likelihood to accept an offer (0-100) based on salary gap (assume market), commute, and notice period.
            2. Score flight risk (0-100) for 12 months post-placement based on job hopping history.
            
            Return JSON: { "placementProbability": number, "placementFactors": string[], "flightRisk": number, "flightRiskDrivers": string[] }
          `;
          
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: { responseMimeType: 'application/json' }
          });
          
          const data = JSON.parse(response.text || '{}');
          setSelectedCandidate(prev => prev ? ({ ...prev, ...data }) : null);
      } catch (e) {
          alert("Analysis failed. Please try again.");
      } finally {
          setIsAnalyzingInsights(false);
      }
  };

  // --- AI Feature: Voice/Video Intelligence ---
  const processInterview = async () => {
      setIsProcessingInterview(true);
      // Simulation: In real app, we'd upload the audio blob
      setTimeout(async () => {
          const ai = getAi();
          const prompt = `
            Simulate an analysis of a recruitment interview.
            Transcribe a 2 minute segment. 
            Analyze tone, confidence, hesitation, enthusiasm.
            Output a scorecard 0-100 and 3 coaching bullets.
            Return JSON: { "score": number, "summary": string, "sentiment": "Positive", "transcript": "..." }
          `;
          const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
          const result = JSON.parse(response.text || '{}');
          
          const newInterview: InterviewAnalysis = {
              id: `int-${Date.now()}`,
              date: new Date().toISOString(),
              type: 'Video',
              score: result.score,
              summary: result.summary,
              sentiment: result.sentiment,
              flags: ['Low Eye Contact', 'Good Posture'],
              transcript: result.transcript
          };
          
          setSelectedCandidate(prev => prev ? ({ ...prev, interviews: [...(prev.interviews || []), newInterview] }) : null);
          setIsProcessingInterview(false);
      }, 2000);
  };

  // --- AI Feature: Reference Check Automation ---
  const conductReferenceCheck = async () => {
      setIsCallingReference(true);
      setTimeout(async () => {
          const ai = getAi();
          const prompt = `
            You are a senior recruiter. You just conducted a 4-minute reference check for ${selectedCandidate?.name}.
            The referee was "John Smith" (Former Manager).
            Summarize the call, strengths, concerns, and give a rating /10.
            Return JSON: { "summary": string, "rating": number }
          `;
          const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json' } });
          const result = JSON.parse(response.text || '{}');
          
          const newRef: ReferenceCheck = {
              id: `ref-${Date.now()}`,
              refereeName: "John Smith",
              refereeRole: "Former Manager",
              company: "Tech Corp",
              date: new Date().toISOString(),
              summary: result.summary,
              rating: result.rating,
              status: 'Completed'
          };
          
          setSelectedCandidate(prev => prev ? ({ ...prev, references: [...(prev.references || []), newRef] }) : null);
          setIsCallingReference(false);
      }, 2500);
  };

  // Redaction Helper
  const getDisplayValue = (val: string | undefined, type: 'text' | 'contact') => {
      if (!complianceMode) return val || 'N/A';
      if (type === 'contact') return '• • • • • • • •';
      return '[REDACTED]';
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn h-full flex gap-6 pb-10">
        
        {/* Left List */}
        <div className={`flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-[calc(100vh-120px)] ${selectedCandidate ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                    <h2 className="font-bold text-slate-800">Candidates</h2>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">{filtered.length}</span>
                </div>
                
                {/* Added View & Status Toggle */}
                <div className="flex gap-2">
                    <select 
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value as 'mine' | 'all')}
                        className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 outline-none focus:ring-1 focus:ring-orange-500"
                    >
                        <option value="mine">My Candidates</option>
                        <option value="all">All Candidates</option>
                    </select>
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="flex-1 text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 outline-none focus:ring-1 focus:ring-orange-500"
                    >
                        <option value="All">Status: All</option>
                        <option value="New">New</option>
                        <option value="Screened">Screened</option>
                        <option value="Interview">Interview</option>
                        <option value="Hired">Hired</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search pool..." 
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-orange-500"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="overflow-y-auto flex-1">
                {filtered.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <UserIcon size={32} className="mx-auto mb-2 opacity-30"/>
                        <p className="text-xs">No candidates found.</p>
                        <button onClick={() => setViewMode('all')} className="text-xs text-blue-600 mt-2 hover:underline">Try "All Candidates"</button>
                    </div>
                ) : (
                    filtered.map(c => (
                        <div 
                            key={c.id} 
                            onClick={() => setSelectedCandidate(c)}
                            className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors flex gap-3 ${selectedCandidate?.id === c.id ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                                {c.avatar ? <img src={c.avatar} className="w-full h-full object-cover"/> : <UserIcon size={20} className="text-slate-400"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between">
                                    <h4 className="font-bold text-slate-800 text-sm truncate">{c.name}</h4>
                                    <span className={`text-[10px] px-1.5 rounded border ${
                                        c.status === 'Hired' ? 'bg-green-100 text-green-700 border-green-200' :
                                        c.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                        'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}>{c.status}</span>
                                </div>
                                <p className="text-xs text-slate-500 truncate">{c.role ? (jobs.find(j => j.id === c.role)?.title || 'Applicant') : 'Talent Pool'}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Right Detail */}
        <div className={`flex-[2] bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[calc(100vh-120px)] ${!selectedCandidate ? 'hidden md:flex items-center justify-center bg-slate-50' : 'flex'}`}>
            {!selectedCandidate ? (
                <div className="text-center text-slate-400">
                    <UserIcon size={48} className="mx-auto mb-3 opacity-20"/>
                    <p>Select a candidate to view Galaxy Profile</p>
                </div>
            ) : (
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Header with Bias Shield Toggle */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                 <div className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border-4 shadow-sm ${complianceMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-200 border-white'}`}>
                                    {complianceMode ? <Shield size={32} className="text-white"/> : (selectedCandidate.avatar ? <img src={selectedCandidate.avatar} className="w-full h-full object-cover"/> : <UserIcon size={32} className="text-slate-400"/>)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">{getDisplayValue(selectedCandidate.name, 'text')}</h2>
                                    <div className="flex gap-3 mt-2">
                                        <span className="text-xs bg-white border px-2 py-1 rounded flex items-center gap-1"><Mail size={12}/> {getDisplayValue(selectedCandidate.email, 'contact')}</span>
                                        <span className="text-xs bg-white border px-2 py-1 rounded flex items-center gap-1"><Phone size={12}/> {getDisplayValue(selectedCandidate.phone, 'contact')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setComplianceMode(!complianceMode)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${complianceMode ? 'bg-slate-800 text-white shadow-lg ring-2 ring-slate-300' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                                >
                                    {complianceMode ? <ShieldAlert size={14}/> : <Shield size={14}/>}
                                    {complianceMode ? 'Bias Shield Active' : 'Enable Bias Shield'}
                                </button>
                                <button onClick={() => setSelectedCandidate(null)} className="md:hidden p-2"><X size={20}/></button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-100 bg-white px-4 shrink-0 overflow-x-auto no-scrollbar">
                        {['profile', 'insights', 'interviews', 'references', 'timeline'].map(tab => (
                            <button 
                                key={tab}
                                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap capitalize ${activeDetailTab === tab ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                                onClick={() => setActiveDetailTab(tab as any)}
                            >
                                {tab === 'insights' && <Sparkles size={12} className="inline mr-1"/>}
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto bg-white p-6">
                        
                        {/* SMART INSIGHTS */}
                        {activeDetailTab === 'insights' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-slate-800">AI Predictive Analytics</h3>
                                    <button onClick={runSmartInsights} disabled={isAnalyzingInsights} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 disabled:opacity-50">
                                        {isAnalyzingInsights ? 'Analyzing...' : 'Run Analysis'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="font-bold text-slate-700 flex items-center gap-2"><TrendingUp size={18} className="text-green-500"/> Placement Probability</h4>
                                            <span className="text-2xl font-bold text-green-600">{selectedCandidate.placementProbability || '-'}%</span>
                                        </div>
                                        <ul className="space-y-2 text-sm text-slate-600">
                                            {selectedCandidate.placementFactors?.map((f, i) => <li key={i} className="flex items-center gap-2"><CheckCircle size={12} className="text-green-500"/> {f}</li>) || <li className="italic text-slate-400">Run analysis to see factors.</li>}
                                        </ul>
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="font-bold text-slate-700 flex items-center gap-2"><AlertCircle size={18} className="text-red-500"/> Flight Risk Radar</h4>
                                            <span className="text-2xl font-bold text-red-600">{selectedCandidate.flightRisk || '-'}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                                            <div className="bg-red-500 h-2 rounded-full" style={{ width: `${selectedCandidate.flightRisk || 0}%` }}></div>
                                        </div>
                                        <p className="text-xs text-slate-500">Likelihood of leaving within 12 months post-placement.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* INTERVIEWS */}
                        {activeDetailTab === 'interviews' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center border-dashed">
                                    <Video size={48} className="mx-auto text-slate-300 mb-4"/>
                                    <h3 className="font-bold text-slate-700 mb-2">Interview Intelligence</h3>
                                    <p className="text-sm text-slate-500 mb-6">Drag and drop Zoom/Meet recordings to analyze sentiment and confidence.</p>
                                    <button 
                                        onClick={processInterview}
                                        disabled={isProcessingInterview}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        {isProcessingInterview ? 'Transcribing & Analyzing...' : 'Upload Recording'}
                                    </button>
                                </div>

                                {selectedCandidate.interviews?.map(int => (
                                    <div key={int.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${int.sentiment === 'Positive' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    {int.score}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800">Interview Analysis</h4>
                                                    <p className="text-xs text-slate-500">{new Date(int.date).toLocaleDateString()} • {int.type}</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded">{int.sentiment} Sentiment</span>
                                        </div>
                                        <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded mb-4">"{int.summary}"</p>
                                        <div className="text-xs text-slate-500 font-mono max-h-24 overflow-hidden relative">
                                            <p className="font-bold mb-1">TRANSCRIPT SNIPPET:</p>
                                            {int.transcript}
                                            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-white to-transparent"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* REFERENCES */}
                        {activeDetailTab === 'references' && (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-800">Reference Checks</h3>
                                    <button 
                                        onClick={conductReferenceCheck}
                                        disabled={isCallingReference}
                                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                                    >
                                        <PhoneCall size={16}/> {isCallingReference ? 'Calling Referee via Twilio...' : 'Auto-Call Referee'}
                                    </button>
                                </div>

                                {selectedCandidate.references?.map(ref => (
                                    <div key={ref.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-slate-800">{ref.refereeName}</h4>
                                                <p className="text-xs text-slate-500">{ref.refereeRole} at {ref.company}</p>
                                            </div>
                                            <div className="flex items-center gap-1 text-orange-500 font-bold">
                                                <Star size={14} fill="currentColor"/> {ref.rating}/10
                                            </div>
                                        </div>
                                        <div className="mt-4 text-sm text-slate-600 bg-green-50 p-3 rounded-r-lg border border-green-100">
                                            <p className="font-bold text-green-800 text-xs mb-1">AI CALL SUMMARY</p>
                                            {ref.summary}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* TIMELINE */}
                        {activeDetailTab === 'timeline' && (
                            <div className="space-y-6 animate-fadeIn px-4">
                                <div className="relative border-l-2 border-slate-200 pl-8 space-y-8 py-4">
                                    {(selectedCandidate.employmentHistory || []).map((role, i) => (
                                        <div key={i} className="relative">
                                            <div className="absolute -left-[41px] top-0 w-6 h-6 bg-slate-900 rounded-full border-4 border-white shadow-sm flex items-center justify-center">
                                                <Briefcase size={10} className="text-white"/>
                                            </div>
                                            <div className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                                                <h4 className="font-bold text-slate-800">{role.role}</h4>
                                                <p className="text-sm text-indigo-600 font-medium mb-2">{role.company}</p>
                                                <p className="text-xs text-slate-400 mb-3">{role.startDate} - {role.endDate}</p>
                                                <p className="text-sm text-slate-600">{role.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* PROFILE (Default) */}
                        {activeDetailTab === 'profile' && (
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <h4 className="font-bold text-slate-700 mb-2 text-sm">Skills</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedCandidate.skills?.map(s => <span key={s} className="px-2 py-1 bg-white border rounded text-xs font-medium">{s}</span>)}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <h4 className="font-bold text-slate-700 mb-2 text-sm">Details</h4>
                                        <p className="text-sm text-slate-600"><span className="font-bold">Exp:</span> {selectedCandidate.experienceYears} years</p>
                                        <p className="text-sm text-slate-600"><span className="font-bold">Notice:</span> {selectedCandidate.noticePeriod || 'Standard'}</p>
                                    </div>
                                </div>
                                
                                {/* Comments */}
                                <div className="border-t pt-6">
                                    <h4 className="font-bold text-slate-800 mb-4">Internal Comments</h4>
                                    <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                                        {selectedCandidate.internalComments?.map(c => (
                                            <div key={c.id} className="bg-slate-50 p-3 rounded text-sm">
                                                <span className="font-bold text-slate-700 text-xs">{c.authorName}</span>
                                                <p className="text-slate-600 mt-1">{c.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <form onSubmit={(e) => { e.preventDefault(); if(newComment && onAddComment) { onAddComment(selectedCandidate.id, newComment); setNewComment(''); } }} className="flex gap-2">
                                        <input className="flex-1 border rounded px-3 py-2 text-sm" placeholder="Add note..." value={newComment} onChange={e => setNewComment(e.target.value)}/>
                                        <button className="bg-slate-800 text-white px-4 py-2 rounded text-sm">Add</button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default Candidates;