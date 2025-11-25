
import React, { useState, useRef, useEffect } from 'react';
import { User, Tutorial } from '../types';
import { BookOpen, PlayCircle, Clock, Lock, ChevronRight, Video, FileText, Shield, MessageCircle, X, Send, Loader2, Sparkles, Bot, Download, CheckSquare, Square } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface TutorialsProps {
  currentUser: User | null;
}

// Hierarchy: 1 (Recruiter), 2 (Hiring Manager), 3 (Admin), 4 (SuperAdmin)
const getRoleLevel = (role: string | undefined): number => {
    if (!role) return 0;
    switch (role) {
        case 'SuperAdmin': return 4;
        case 'Admin': return 3;
        case 'Hiring Manager': return 2;
        case 'Recruiter': return 1;
        case 'Guest': return 0;
        default: return 0;
    }
};

const TUTORIAL_CONTENT: Tutorial[] = [
    // Basic Level (Recruiter+)
    {
        id: 'tut-1',
        title: 'Platform Overview & Navigation',
        description: 'Navigate the sidebar, understand the dashboard metrics, and customize your workspace.',
        duration: '5 min read',
        category: 'Getting Started',
        minRoleLevel: 1
    },
    {
        id: 'tut-2',
        title: 'Posting a Compliant Job Listing',
        description: 'Step-by-step guide on creating a job spec that meets legal requirements and uses our AI generator efficiently.',
        duration: '8 min video',
        category: 'Recruitment',
        minRoleLevel: 1
    },
    {
        id: 'tut-3',
        title: 'AI Candidate Screening Explained',
        description: 'How the algorithm scores candidates, how to interpret "Smart Matches", and avoiding bias.',
        duration: '6 min video',
        category: 'Recruitment',
        minRoleLevel: 1
    },
    {
        id: 'tut-4',
        title: 'Managing Candidate Pipelines',
        description: 'Moving candidates through stages: From "New" to "Hired", adding notes, and scheduling interviews.',
        duration: '7 min read',
        category: 'Recruitment',
        minRoleLevel: 1
    },

    // Intermediate Level (Hiring Manager+)
    {
        id: 'tut-5',
        title: 'Effective Shortlisting Techniques',
        description: 'Best practices for reviewing shortlisted candidates and providing constructive feedback to recruiters.',
        duration: '5 min read',
        category: 'Management',
        minRoleLevel: 2
    },
    {
        id: 'tut-6',
        title: 'Interview Compliance Standards (SA)',
        description: 'Critical guidelines for conducting fair interviews aligned with the Employment Equity Act.',
        duration: '12 min read',
        category: 'Compliance',
        minRoleLevel: 2
    },

    // Advanced Level (Admin+)
    {
        id: 'tut-7',
        title: 'Approval Workflows & Quality Control',
        description: 'How to review pending job listings, request changes, and finalize approvals.',
        duration: '6 min video',
        category: 'Administration',
        minRoleLevel: 3
    },
    {
        id: 'tut-8',
        title: 'Team Management & Access Control',
        description: 'Onboarding new staff, setting revenue targets, and handling portfolio transfers.',
        duration: '10 min read',
        category: 'Administration',
        minRoleLevel: 3
    },
    {
        id: 'tut-9',
        title: 'Financial Reporting & Commissions',
        description: 'Deep dive into the monthly revenue reports, commission calculations, and payouts.',
        duration: '15 min video',
        category: 'Management',
        minRoleLevel: 3
    },
    
    // Expert Level (SuperAdmin)
    {
        id: 'tut-10',
        title: 'System Configuration & Security',
        description: 'Managing global settings, API keys, backup protocols, and emergency access codes.',
        duration: '20 min video',
        category: 'Administration',
        minRoleLevel: 4
    },
    {
        id: 'tut-11',
        title: 'Client Portal Administration',
        description: 'Generating UINs, resetting client access, and managing the document archive.',
        duration: '12 min read',
        category: 'Management',
        minRoleLevel: 4
    }
];

const Tutorials: React.FC<TutorialsProps> = ({ currentUser }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  
  // AI Chat State
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'model', text: string}[]>([
      { role: 'model', text: 'Hello! I am your AI Tutor. Ask me any quick questions about the platform or recruitment process.' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Manual Generator State
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [isGeneratingManual, setIsGeneratingManual] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);

  const userLevel = getRoleLevel(currentUser?.role);
  const categories = ['All', ...Array.from(new Set(TUTORIAL_CONTENT.map(t => t.category)))];
  const uniqueCategories = Array.from(new Set(TUTORIAL_CONTENT.map(t => t.category)));

  const filteredTutorials = TUTORIAL_CONTENT.filter(t => {
      return (activeCategory === 'All' || t.category === activeCategory) &&
             userLevel >= t.minRoleLevel;
  });

  const nextLevelTutorials = TUTORIAL_CONTENT.filter(t => t.minRoleLevel === userLevel + 1);

  useEffect(() => {
      if(showAiChat && chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [aiMessages, showAiChat]);

  const handleAskAi = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!aiInput.trim()) return;
      
      const userMsg = aiInput;
      setAiMessages(prev => [...prev, { role: 'user', text: userMsg }]);
      setAiInput('');
      setIsAiLoading(true);

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const model = 'gemini-2.5-flash';
          
          const systemInstruction = `You are an expert AI Tutor for "The Hiring Org" recruitment platform. 
          The platform has features like Dashboard, Job Creation (with AI), Candidate Screening (AI), Team Management, Client Portfolios, Financials, and Chat.
          Users have roles: Recruiter, Hiring Manager, Admin, SuperAdmin.
          Answer the user's question about how to use the platform or general recruitment best practices concisely and professionally.
          Keep answers relatively short and helpful.`;

          const history = aiMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
          
          const response = await ai.models.generateContent({
              model: model,
              contents: [
                  ...history,
                  { role: 'user', parts: [{ text: userMsg }] }
              ],
              config: {
                  systemInstruction: systemInstruction
              }
          });

          const text = response.text;
          if (text) {
               setAiMessages(prev => [...prev, { role: 'model', text }]);
          }
      } catch (error) {
          console.error(error);
          setAiMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting right now. Please try again later." }]);
      } finally {
          setIsAiLoading(false);
      }
  };

  const handleDownloadGuide = async () => {
      const selectedContent = TUTORIAL_CONTENT.filter(t => selectedSections.includes(t.category));
      if(selectedContent.length === 0) return;

      setIsGeneratingManual(true);
      setGenerationProgress(0);
      setGenerationStatus('Initializing system scan...');

      const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

      await delay(800);
      setGenerationProgress(10);
      setGenerationStatus('Analyzing user role and permissions...');
      
      await delay(1000);
      setGenerationProgress(25);
      setGenerationStatus('Fetching module configuration data...');

      let textContent = "THE HIRING ORG - COMPREHENSIVE USER MANUAL\n";
      textContent += "Generated for: " + (currentUser?.name || 'User') + "\n";
      textContent += "Role Scope: " + (currentUser?.role || 'Guest') + "\n";
      textContent += "Date: " + new Date().toLocaleString() + "\n";
      textContent += "---------------------------------------------------------\n\n";
      textContent += "TABLE OF CONTENTS\n";
      
      selectedContent.forEach((t, i) => {
          textContent += `${i + 1}. ${t.title} [${t.category}]\n`;
      });
      textContent += "\n---------------------------------------------------------\n\n";

      const totalSections = selectedSections.length;
      let currentSectionIndex = 0;

      for (const section of selectedSections) {
          setGenerationStatus(`Compiling module: ${section.toUpperCase()}...`);
          const progressBase = 25 + ((currentSectionIndex / totalSections) * 60);
          setGenerationProgress(progressBase);
          
          await delay(800); 

          textContent += `\n=================================================\n`;
          textContent += `MODULE: ${section.toUpperCase()}\n`;
          textContent += `=================================================\n\n`;
          
          const tutorials = selectedContent.filter(t => t.category === section);
          
          for (const tut of tutorials) {
              setGenerationStatus(`Generating content: "${tut.title}"...`);
              await delay(500); 

              textContent += `TOPIC: ${tut.title}\n`;
              textContent += `ESTIMATED TIME: ${tut.duration}\n`;
              textContent += `ACCESS LEVEL: Level ${tut.minRoleLevel}+\n\n`;
              
              textContent += `OVERVIEW\n`;
              textContent += `${tut.description}\n\n`;
              
              textContent += `STANDARD OPERATING PROCEDURE (SOP)\n`;
              textContent += `1. Navigate to the "${tut.category}" section via the sidebar menu.\n`;
              textContent += `2. Ensure you have the required permissions active in your profile settings.\n`;
              textContent += `3. Locate the specific dashboard or tool related to ${tut.title}.\n`;
              textContent += `4. Follow the on-screen prompts. Input fields marked with (*) are mandatory.\n`;
              textContent += `5. Save your changes. A confirmation notification will appear.\n\n`;
              
              textContent += `BEST PRACTICES\n`;
              textContent += `- Always verify data accuracy before submission.\n`;
              textContent += `- Use the built-in AI tools to enhance quality where available.\n`;
              textContent += `- Refer to the Help Center if you encounter specific error codes.\n\n`;
              
              textContent += `TROUBLESHOOTING\n`;
              textContent += `- "Access Denied": Check your role level in Team Management.\n`;
              textContent += `- "System Error": Log a ticket via the Support portal with screenshots.\n`;
              
              textContent += `-------------------------------------------------\n\n`;
          }
          currentSectionIndex++;
      }

      setGenerationProgress(90);
      setGenerationStatus('Finalizing document formatting & PDF structure...');
      await delay(1200);

      setGenerationProgress(100);
      setGenerationStatus('Download starting...');
      await delay(500);

      const blob = new Blob([textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `THO_Comprehensive_User_Manual_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      
      setIsGeneratingManual(false);
      setShowDownloadModal(false);
  };

  const toggleSection = (cat: string) => {
      if(selectedSections.includes(cat)) {
          setSelectedSections(selectedSections.filter(c => c !== cat));
      } else {
          setSelectedSections([...selectedSections, cat]);
      }
  };

  const toggleAllSections = () => {
      if(selectedSections.length === uniqueCategories.length) {
          setSelectedSections([]);
      } else {
          setSelectedSections(uniqueCategories);
      }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="text-orange-500"/> Learning Center
            </h2>
            <p className="text-slate-500 mt-1">
                Training resources tailored to your role as <strong>{currentUser?.role}</strong>.
            </p>
        </div>
        <div className="flex gap-2">
            {(userLevel >= 3) && ( 
                <button 
                    onClick={() => setShowDownloadModal(true)}
                    className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-all shadow-sm"
                >
                    <Download size={18}/> Generate Full Manual
                </button>
            )}
            <button 
                onClick={() => setShowAiChat(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all animate-pulse-slow"
            >
                <Sparkles size={18} /> Ask AI Tutor
            </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === cat 
                    ? 'bg-slate-800 text-white shadow-md' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                  {cat}
              </button>
          ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Available Tutorials */}
          {filteredTutorials.map(tut => (
              <div 
                key={tut.id} 
                onClick={() => setSelectedTutorial(tut)}
                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all cursor-pointer group"
              >
                  <div className="h-32 bg-slate-100 relative flex items-center justify-center group-hover:bg-orange-50 transition-colors">
                      {tut.duration.includes('video') ? (
                          <Video size={32} className="text-slate-400 group-hover:text-orange-500"/>
                      ) : (
                          <FileText size={32} className="text-slate-400 group-hover:text-orange-500"/>
                      )}
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock size={10}/> {tut.duration}
                      </span>
                  </div>
                  <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{tut.category}</span>
                          {tut.minRoleLevel > 1 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 font-medium">
                                  Level {tut.minRoleLevel}
                              </span>
                          )}
                      </div>
                      <h3 className="font-bold text-slate-800 mb-2 group-hover:text-orange-600 transition-colors">{tut.title}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2">{tut.description}</p>
                      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center text-sm font-medium text-orange-600">
                          Start Learning <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform"/>
                      </div>
                  </div>
              </div>
          ))}

          {/* Locked / Next Level Content */}
          {nextLevelTutorials.map(tut => (
              <div key={tut.id} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden opacity-70 relative">
                  <div className="absolute inset-0 bg-white/50 z-10 flex flex-col items-center justify-center text-center p-6">
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center mb-2">
                          <Lock size={20} className="text-slate-500"/>
                      </div>
                      <p className="font-bold text-slate-700 text-sm">Locked Content</p>
                      <p className="text-xs text-slate-500 mt-1">Promote to next level to access</p>
                  </div>
                  <div className="h-32 bg-slate-200 flex items-center justify-center">
                      <Shield size={32} className="text-slate-300"/>
                  </div>
                  <div className="p-5 filter blur-[2px]">
                      <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{tut.category}</span>
                      </div>
                      <h3 className="font-bold text-slate-600 mb-2">{tut.title}</h3>
                      <p className="text-sm text-slate-400">{tut.description}</p>
                  </div>
              </div>
          ))}
      </div>

      {/* Tutorial Viewer Modal */}
      {selectedTutorial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[85vh]">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                      <div>
                          <span className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-1 block">{selectedTutorial.category}</span>
                          <h3 className="text-2xl font-bold text-slate-800">{selectedTutorial.title}</h3>
                      </div>
                      <button onClick={() => setSelectedTutorial(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                          <X size={20} className="text-slate-400"/>
                      </button>
                  </div>
                  <div className="p-8 overflow-y-auto">
                      <div className="bg-slate-900 rounded-xl aspect-video flex items-center justify-center mb-8 text-white shadow-lg">
                          {selectedTutorial.duration.includes('video') ? (
                              <div className="text-center">
                                  <PlayCircle size={64} className="mx-auto mb-4 opacity-80 hover:opacity-100 cursor-pointer transition-opacity"/>
                                  <p className="font-medium">Simulated Video Player</p>
                                  <p className="text-xs text-slate-400 mt-2">(Video hosting integration required)</p>
                              </div>
                          ) : (
                              <div className="text-center">
                                  <BookOpen size={64} className="mx-auto mb-4 opacity-50"/>
                                  <p className="font-medium">Interactive Guide</p>
                              </div>
                          )}
                      </div>
                      
                      <div className="prose prose-slate max-w-none">
                          <h4 className="font-bold text-lg mb-4">Module Content</h4>
                          <p className="text-slate-600 leading-relaxed">
                              <strong>Objective:</strong> {selectedTutorial.description}
                          </p>
                          
                          <hr className="my-6 border-slate-200"/>
                          
                          <h5 className="font-bold text-slate-800">Standard Procedure</h5>
                          <ol className="list-decimal list-inside space-y-2 text-slate-600 mt-2">
                              <li><strong>Preparation:</strong> Ensure you have the necessary permissions active in your profile. Gather all required data (e.g., Job Spec, Candidate CV) before starting.</li>
                              <li><strong>Execution:</strong> Navigate to the specific module via the sidebar. Follow the required input fields marked with an asterisk (*). Use AI assistance where available to improve data quality.</li>
                              <li><strong>Review:</strong> Double-check all entries against company policy compliance standards (e.g., POPIA, BCEA).</li>
                              <li><strong>Submission:</strong> Click the primary action button (e.g., "Create", "Approve"). Wait for the success notification to confirm the action was logged.</li>
                          </ol>

                          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
                              <p className="text-sm text-blue-800 font-medium">
                                  <strong>Tip:</strong> If you encounter an error, check the System Support tab for reported outages or log a new ticket with specific symptoms.
                              </p>
                          </div>
                      </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                      <button onClick={() => setSelectedTutorial(null)} className="px-6 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-black transition-colors">
                          Mark as Complete
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Download Manual Generator Modal */}
      {showDownloadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2"><Download size={20}/> Generate User Manual</h3>
                      {!isGeneratingManual && (
                          <button onClick={() => setShowDownloadModal(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                      )}
                  </div>
                  
                  <div className="p-6">
                      {isGeneratingManual ? (
                          <div className="flex flex-col items-center justify-center py-8 space-y-6">
                              <div className="relative w-20 h-20">
                                  <svg className="w-full h-full" viewBox="0 0 100 100">
                                      <circle 
                                          className="text-slate-100 stroke-current" 
                                          strokeWidth="8" 
                                          cx="50" 
                                          cy="50" 
                                          r="40" 
                                          fill="transparent"
                                      />
                                      <circle 
                                          className="text-orange-500 progress-ring__circle stroke-current" 
                                          strokeWidth="8" 
                                          strokeLinecap="round" 
                                          cx="50" 
                                          cy="50" 
                                          r="40" 
                                          fill="transparent" 
                                          strokeDasharray={`${251.2 * (generationProgress/100)} 251.2`} 
                                          strokeDashoffset="0"
                                          transform="rotate(-90 50 50)"
                                      />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-700">
                                      {Math.round(generationProgress)}%
                                  </div>
                              </div>
                              
                              <div className="text-center space-y-2 max-w-xs">
                                  <h4 className="font-bold text-slate-800 animate-pulse">Generating Document...</h4>
                                  <p className="text-sm text-slate-500">{generationStatus}</p>
                              </div>
                          </div>
                      ) : (
                          <>
                              <p className="text-sm text-slate-500 mb-4">Select the modules to include in the comprehensive guide. The system will compile the latest procedures and policies.</p>
                              
                              <div className="flex justify-end mb-2">
                                  <button 
                                      onClick={toggleAllSections}
                                      className="text-xs text-blue-600 font-medium hover:underline"
                                  >
                                      {selectedSections.length === uniqueCategories.length ? 'Deselect All' : 'Select All'}
                                  </button>
                              </div>

                              <div className="space-y-2 mb-6 border border-slate-200 rounded-lg p-2 max-h-60 overflow-y-auto bg-slate-50">
                                  {uniqueCategories.map(cat => (
                                      <label key={cat} className="flex items-center gap-3 p-2 hover:bg-white rounded cursor-pointer transition-colors">
                                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedSections.includes(cat) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-transparent'}`}>
                                              <CheckSquare size={14}/>
                                          </div>
                                          <input 
                                              type="checkbox" 
                                              className="hidden"
                                              checked={selectedSections.includes(cat)}
                                              onChange={() => toggleSection(cat)}
                                          />
                                          <span className="text-sm text-slate-700">{cat}</span>
                                      </label>
                                  ))}
                              </div>

                              <button 
                                  onClick={handleDownloadGuide}
                                  disabled={selectedSections.length === 0}
                                  className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
                              >
                                  <FileText size={18}/> Generate & Download Guide
                              </button>
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* AI Tutor Chat Modal */}
      {showAiChat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn flex flex-col h-[600px] max-h-[90vh]">
                  <div className="p-4 border-b border-slate-100 bg-indigo-600 text-white flex justify-between items-center">
                      <div className="flex items-center gap-2">
                          <Bot size={24} className="text-indigo-200"/>
                          <div>
                              <h3 className="font-bold text-sm">AI Tutor</h3>
                              <p className="text-[10px] text-indigo-200">Powered by Gemini</p>
                          </div>
                      </div>
                      <button onClick={() => setShowAiChat(false)} className="p-1 hover:bg-indigo-500 rounded transition-colors">
                          <X size={20}/>
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                      {aiMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed shadow-sm ${
                                  msg.role === 'user' 
                                  ? 'bg-indigo-600 text-white rounded-br-none' 
                                  : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                              }`}>
                                  {msg.text}
                              </div>
                          </div>
                      ))}
                      {isAiLoading && (
                          <div className="flex justify-start">
                              <div className="bg-white p-3 rounded-xl rounded-bl-none border border-slate-100 shadow-sm">
                                  <Loader2 size={16} className="animate-spin text-indigo-600"/>
                              </div>
                          </div>
                      )}
                      <div ref={chatEndRef}/>
                  </div>

                  <form onSubmit={handleAskAi} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                      <input 
                          type="text" 
                          className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Ask a question..."
                          value={aiInput}
                          onChange={(e) => setAiInput(e.target.value)}
                      />
                      <button 
                          type="submit"
                          disabled={!aiInput.trim() || isAiLoading}
                          className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                          <Send size={18}/>
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Tutorials;
