
import React, { useState } from 'react';
import { Job, Candidate } from '../types';
import { screenCandidate, extractCandidateInfo } from '../services/geminiService';
import { Upload, CheckCircle, AlertCircle, Loader2, FileText, ArrowRight, Tags, Sparkles, UserPlus } from 'lucide-react';

interface CandidateScreenerProps {
  jobs: Job[];
  onScreeningComplete: (candidate: Candidate) => void;
  onQuickRegister?: (candidate: Candidate) => void; // New prop
}

const CandidateScreener: React.FC<CandidateScreenerProps> = ({ jobs, onScreeningComplete, onQuickRegister }) => {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [cvText, setCvText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentResult, setCurrentResult] = useState<Candidate | null>(null);

  // Quick Add State
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setCvText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleQuickAddUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file || !onQuickRegister) return;
     
     setIsQuickAdding(true);
     try {
        const base64Promise = new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const base64String = await base64Promise;
        const base64Data = base64String.split(',')[1];
        const mimeType = file.type || 'application/pdf';

        const data = await extractCandidateInfo(base64Data, mimeType);
        
        const newProfile: Candidate = {
            id: `CAND-${Date.now()}`,
            name: data.name || 'Unknown Candidate',
            email: data.email || '',
            role: '',
            cvText: data.summary || '',
            status: 'New',
            ...data
        } as Candidate;
        
        onQuickRegister(newProfile);
        alert(`Quick Profile created for ${newProfile.name}`);
     } catch(err) {
        console.error(err);
        alert("Failed to parse CV for quick add.");
     } finally {
        setIsQuickAdding(false);
     }
  };

  const handleAnalyze = async () => {
    if (!selectedJobId || !cvText || !candidateName) return;

    const job = jobs.find(j => j.id === selectedJobId);
    if (!job) return;

    setIsAnalyzing(true);
    setCurrentResult(null);

    // Construct a full context description for the AI
    const fullJobContext = `
      Job Title: ${job.title}
      
      Overview:
      ${job.description}
      
      Responsibilities:
      ${job.responsibilities.join('\n')}
      
      Essential Requirements:
      ${job.requirements.join('\n')}
      
      Desirable Skills:
      ${job.desirableSkills.join('\n')}
    `;

    try {
      const result = await screenCandidate(cvText, fullJobContext);
      
      const newCandidate: Candidate = {
        id: crypto.randomUUID(),
        name: candidateName,
        role: job.id,
        cvText: cvText,
        screeningResult: result,
        status: 'Screened'
      };

      setCurrentResult(newCandidate);
      onScreeningComplete(newCandidate);
    } catch (error) {
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setCandidateName('');
    setCvText('');
    setCurrentResult(null);
  };

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <div className="mb-8 flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">AI Candidate Screener</h2>
            <p className="text-slate-500 mt-1">Evaluate CVs against your active job descriptions instantly.</p>
        </div>
        {/* Quick Add Button for Staff */}
        <div className="relative">
             <input 
                type="file" 
                accept=".pdf,.txt"
                onChange={handleQuickAddUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isQuickAdding}
             />
             <button className={`bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50 flex items-center gap-2 text-sm font-medium ${isQuickAdding ? 'opacity-50' : ''}`}>
                 {isQuickAdding ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
                 Quick Add Profile (CV)
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Input Form */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-orange-100 text-orange-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
              Select Position
            </h3>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
            >
              <option value="">Choose a job...</option>
              {jobs.filter(j => j.status === 'Active').map(job => (
                <option key={job.id} value={job.id}>{job.title} ({job.listingReference})</option>
              ))}
            </select>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-orange-100 text-orange-600 w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
              Candidate Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g. Lerato Molefe"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CV Content</label>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative">
                  <input 
                    type="file" 
                    accept=".txt,.md" 
                    onChange={handleCvUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                  <p className="text-sm text-slate-600">Upload CV (.txt) or click to browse</p>
                  <p className="text-xs text-slate-400 mt-1">For demo, simple text files work best</p>
                </div>
                <div className="relative flex py-3 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-400 text-xs">OR PASTE TEXT</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                </div>
                <textarea 
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder="Paste CV text here..."
                  rows={6}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !selectedJobId || !cvText || !candidateName}
              className={`w-full mt-6 py-3 rounded-lg font-medium text-white flex items-center justify-center gap-2 transition-all ${
                isAnalyzing || !selectedJobId || !cvText || !candidateName
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20'
              }`}
            >
              {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
              {isAnalyzing ? 'Analyse Profile...' : 'Run AI Screening'}
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div className="h-full">
          {currentResult ? (
            <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden h-full flex flex-col animate-fadeIn">
              <div className={`p-6 ${
                  (currentResult.screeningResult?.matchScore || 0) >= 80 ? 'bg-green-50 border-b border-green-100' :
                  (currentResult.screeningResult?.matchScore || 0) >= 50 ? 'bg-orange-50 border-b border-orange-100' :
                  'bg-red-50 border-b border-red-100'
                }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{currentResult.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">Applied for: {jobs.find(j => j.id === currentResult.role)?.title}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-4xl font-bold ${
                      (currentResult.screeningResult?.matchScore || 0) >= 80 ? 'text-green-600' :
                      (currentResult.screeningResult?.matchScore || 0) >= 50 ? 'text-orange-500' :
                      'text-red-600'
                    }`}>
                      {currentResult.screeningResult?.matchScore}%
                    </div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mt-1">Match Score</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">AI Summary</h4>
                  <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                    {currentResult.screeningResult?.summary}
                  </p>
                </div>

                {/* Matching Skills Section */}
                {currentResult.screeningResult?.matchingSkills && (
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                     <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                       <Tags size={16} className="text-orange-500" /> 
                       Skill Match Detection
                     </h4>
                     <div className="flex flex-wrap gap-2">
                       {currentResult.screeningResult.matchingSkills.length > 0 ? (
                         currentResult.screeningResult.matchingSkills.map((skill, i) => (
                           <span 
                            key={i} 
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
                           >
                             <Sparkles size={10} className="text-orange-500" />
                             {skill}
                           </span>
                         ))
                       ) : (
                         <p className="text-sm text-slate-500 italic">No direct skill keywords found in CV.</p>
                       )}
                     </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                      <CheckCircle size={16} /> Key Strengths
                    </h4>
                    <ul className="space-y-2">
                      {currentResult.screeningResult?.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-700 mb-2 flex items-center gap-2">
                      <AlertCircle size={16} /> Areas of Concern
                    </h4>
                    <ul className="space-y-2">
                      {currentResult.screeningResult?.weaknesses.map((w, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={resetForm}
                  className="text-slate-600 hover:text-slate-800 font-medium text-sm flex items-center gap-1"
                >
                  Screen Next Candidate <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 p-8">
              <FileText size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">No analysis generated yet</p>
              <p className="text-sm mt-2 text-center max-w-xs">Select a job and provide candidate details to see the AI evaluation here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateScreener;
