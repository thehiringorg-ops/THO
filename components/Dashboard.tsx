
import React, { useState, useEffect } from 'react';
import { Job, Candidate } from '../types';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Briefcase, Users, TrendingUp, Video, RefreshCw, CheckCircle, Clock, Mic, Play, Loader2, ArrowRight } from 'lucide-react';

interface DashboardProps {
  jobs: Job[];
  candidates: Candidate[];
  onViewJobs?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ jobs, candidates, onViewJobs }) => {
  const [briefData, setBriefData] = useState<{text: string, actions: string[]} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [rediscoveredTalent, setRediscoveredTalent] = useState<Candidate[]>([]);

  // Mock Talent Rediscovery
  useEffect(() => {
      // Simulate finding old candidates who match new jobs
      const found = candidates.filter(c => c.status === 'Rejected' && Math.random() > 0.8).slice(0, 3);
      setRediscoveredTalent(found);
  }, [candidates]);

  const generateMorningBrief = async () => {
      setIsGenerating(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const activeCount = jobs.filter(j => j.status === 'Active').length;
          const newCands = candidates.filter(c => c.status === 'New').length;
          
          const prompt = `
            Analyse today's pipeline: ${activeCount} active jobs, ${newCands} new candidates.
            Generate a 60-second spoken brief script for a South African Recruitment MD.
            Plus 3 bullet priority actions.
            Return JSON: { "text": "Script...", "actions": ["Action 1", "Action 2", "Action 3"] }
          `;
          
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: { responseMimeType: 'application/json' }
          });
          
          setBriefData(JSON.parse(response.text || '{}'));
      } catch(e) {
          console.error(e);
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      
      {/* HERO: Morning Brief */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-2xl p-8 text-white shadow-2xl shadow-indigo-900/20 relative overflow-hidden group">
          <div className="relative z-10 max-w-4xl">
              <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                      <Mic size={24} className="text-white"/>
                  </div>
                  <div>
                      <h2 className="text-3xl font-bold tracking-tight">Morning Executive Brief</h2>
                      <p className="text-indigo-200 text-sm font-medium">AI Analysis • 07:00 AM</p>
                  </div>
              </div>
              
              {briefData ? (
                  <div className="space-y-6 animate-slideDown">
                      <div className="bg-white/10 p-6 rounded-2xl border border-white/10 backdrop-blur-md shadow-inner">
                          <p className="text-lg font-medium leading-relaxed font-serif italic opacity-90 text-slate-100">"{briefData.text}"</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {briefData.actions.map((action, i) => (
                              <div key={i} className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3 backdrop-blur-sm hover:bg-emerald-500/20 transition-colors">
                                  <CheckCircle size={20} className="text-emerald-400 shrink-0 mt-0.5"/>
                                  <span className="text-sm font-semibold text-emerald-100 leading-snug">{action}</span>
                              </div>
                          ))}
                      </div>
                      <button onClick={() => setShowVideo(true)} className="flex items-center gap-2 text-sm text-orange-300 hover:text-orange-200 font-bold mt-2 px-4 py-2 rounded-lg hover:bg-white/5 w-fit transition-colors">
                          <Video size={18}/> Watch Avatar Brief
                      </button>
                  </div>
              ) : (
                  <div className="py-6">
                      <p className="text-slate-300 mb-8 text-lg max-w-xl">Gemini AI is ready to analyze overnight pipeline activity, identify retention risks, and forecast daily priorities.</p>
                      <button 
                          onClick={generateMorningBrief}
                          disabled={isGenerating}
                          className="bg-white text-slate-900 px-8 py-4 rounded-xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
                      >
                          {isGenerating ? <Loader2 className="animate-spin"/> : <Play size={20} fill="currentColor"/>}
                          Generate Daily Briefing
                      </button>
                  </div>
              )}
          </div>
          
          {/* Background Decor */}
          <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-orange-500/10 to-transparent pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none"></div>
          <Sparkles className="absolute top-10 right-10 text-orange-300 opacity-30 group-hover:opacity-60 transition-opacity duration-700" size={64}/>
      </div>

      {/* Talent Rediscovery Engine */}
      {rediscoveredTalent.length > 0 && (
          <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h3 className="font-bold text-xl text-slate-800 flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><RefreshCw size={20}/></div> 
                          Talent Rediscovery Engine
                      </h3>
                      <p className="text-sm text-slate-500 mt-1 ml-1">AI found 3 previously rejected candidates matching new roles.</p>
                  </div>
                  <button className="text-indigo-600 text-sm font-bold hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors">Review All Matches</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {rediscoveredTalent.map(c => (
                      <div key={c.id} className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-indigo-700 shadow-sm text-lg group-hover:scale-110 transition-transform">
                              {c.name.charAt(0)}
                          </div>
                          <div>
                              <p className="font-bold text-slate-800">{c.name}</p>
                              <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-0.5"><TrendingUp size={12}/> 92% Match Score</p>
                          </div>
                          <ArrowRight size={16} className="ml-auto text-indigo-300 group-hover:text-indigo-600 transition-colors"/>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Active Jobs</p>
                      <h3 className="text-4xl font-bold text-slate-800">{jobs.filter(j => j.status === 'Active').length}</h3>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-100 transition-colors">
                      <Briefcase size={24}/>
                  </div>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-3/4 rounded-full"></div>
              </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Candidates</p>
                      <h3 className="text-4xl font-bold text-slate-800">{candidates.length}</h3>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                      <Users size={24}/>
                  </div>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-1/2 rounded-full"></div>
              </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Time to Hire</p>
                      <h3 className="text-4xl font-bold text-slate-800">18 <span className="text-lg text-slate-400 font-medium">Days</span></h3>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-xl text-orange-500 group-hover:bg-orange-100 transition-colors">
                      <Clock size={24}/>
                  </div>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full w-4/5 rounded-full"></div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
