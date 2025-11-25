
import React, { useState, useEffect, useRef } from 'react';
import { Job, Candidate, EmploymentItem, EducationItem, SystemConfig, ChatMessage, JobAlert } from '../types';
import { extractCandidateInfo, ExtractedCandidateData } from '../services/geminiService';
import { GoogleGenAI } from "@google/genai";
import { MapPin, Phone, Globe, Upload, FileText, CheckCircle, Briefcase, ChevronRight, Loader2, Search, Copy, Bell, Building2, Calendar, HeartHandshake, Hash, ListChecks, Star, Sparkles, Banknote, UserPlus, Lock, User, Clock, GraduationCap, Globe2, Plus, Trash2, Share2, Camera, LogIn, ChevronDown, ChevronUp, Facebook, Linkedin, Twitter, AlertCircle, Settings, Save, RefreshCw, X, ArrowUpDown, History, MessageCircle, HelpCircle, Send, Bot, Edit2, ArrowRight, Link as LinkIcon, Check } from 'lucide-react';

interface CandidatePortalProps {
  jobs: Job[];
  candidates: Candidate[];
  onApply: (candidate: Candidate) => void;
  onSubscribe: (email: string, keywords: string[]) => void;
  onRegister?: (profile: Candidate) => void;
  onLoginClick: () => void;
  onUpdateProfile?: (candidate: Candidate) => void;
  systemConfig?: SystemConfig;
  messages?: ChatMessage[];
  onSendMessage?: (text: string, recipientId: string) => void;
  onSaveAlert?: (candidateId: string, alert: JobAlert) => void;
  onDeleteAlert?: (candidateId: string, alertId: string) => void;
}

const FAQs = [
    { q: "How do I apply for a job?", a: "Browse the job listings on the 'Find Jobs' tab. Click 'View & Apply' on any job card. If you have a profile, your details will be auto-filled." },
    { q: "Can I update my CV after applying?", a: "Yes, you can go to 'Settings' to update your profile and CV. However, applications already submitted may not reflect these changes immediately for the recruiter." },
    { q: "How does the AI screening work?", a: "Our AI analyzes your skills and experience against the job requirements to highlight the best matches to our recruiters. It does not automatically reject candidates." },
    { q: "What happens after I apply?", a: "You will see your application status in the 'My Applications' tab. Statuses move from 'New' to 'Screened', 'Interview', etc." },
    { q: "Is my data secure?", a: "Yes, The Hiring Org uses enterprise-grade security to protect your personal information in compliance with POPIA/GDPR." }
];

const CandidatePortal: React.FC<CandidatePortalProps> = ({ jobs, candidates, onApply, onSubscribe, onRegister, onLoginClick, onUpdateProfile, systemConfig, messages = [], onSendMessage, onSaveAlert, onDeleteAlert }) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications' | 'inbox' | 'alerts' | 'register' | 'login' | 'settings' | 'help'>('jobs');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [candidateUser, setCandidateUser] = useState<Candidate | null>(null);
  
  // Application Confirmation State
  const [confirmingJob, setConfirmingJob] = useState<Job | null>(null);

  // Direct Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'salary_high' | 'salary_low'>('newest');

  const [alertEmail, setAlertEmail] = useState('');
  const [alertKeywords, setAlertKeywords] = useState('');
  const [alertLocation, setAlertLocation] = useState('');
  const [alertSuccess, setAlertSuccess] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const [profileData, setProfileData] = useState<Partial<Candidate>>({
    name: '',
    email: '',
    password: '', // Added password state
    phone: '',
    linkedin: '',
    location: '',
    noticePeriod: 'Immediate',
    cvText: '', 
    skills: [],
    languages: [],
    employmentHistory: [],
    education: [],
    experienceYears: 0
  });
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [settingsForm, setSettingsForm] = useState<Partial<Candidate>>({});

  // AI Chat State
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiMessages, setAiMessages] = useState<{role: 'user' | 'model', text: string}[]>([
      { role: 'model', text: 'Hi there! I can help you improve your CV, prepare for interviews, or navigate the portal. What do you need help with?' }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Recruiter Messaging State
  const [messageInput, setMessageInput] = useState('');
  const inboxEndRef = useRef<HTMLDivElement>(null);

  // Sharing State
  const [shareMenuJobId, setShareMenuJobId] = useState<string | null>(null);
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  useEffect(() => {
      if (candidateUser && activeTab === 'settings') {
          setSettingsForm({...candidateUser});
      }
  }, [candidateUser, activeTab]);

  useEffect(() => {
      if(showAiChat && chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [aiMessages, showAiChat]);

  useEffect(() => {
      if(activeTab === 'inbox' && inboxEndRef.current) {
          inboxEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [activeTab, messages]);

  // --- Candidate Filtering ---
  const candidateMessages = messages.filter(m => 
      (m.senderId === candidateUser?.id || m.recipientId === candidateUser?.id)
  ).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const activeJobs = jobs.filter(j => j.status === 'Active');
  const filteredJobs = activeJobs.filter(j => 
      ((j.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (j.description || '').toLowerCase().includes(searchQuery.toLowerCase())) &&
      ((j.location || '').toLowerCase().includes(locationFilter.toLowerCase()))
  ).sort((a, b) => {
      switch(sortBy) {
          case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'salary_high': return (b.salaryMax || 0) - (a.salaryMax || 0);
          case 'salary_low': return (a.salaryMin || 0) - (b.salaryMin || 0);
          default: return 0;
      }
  });

  // --- FIX: Robust Application Filtering ---
  const myApplications = candidateUser 
    ? candidates.filter(c => 
        // Case insensitive email check
        c.email.toLowerCase() === candidateUser.email.toLowerCase() && 
        // Must be an application (have a role linked)
        c.role && 
        // Exclude the main profile record if it exists in the same list (unlikely but safe)
        c.id !== candidateUser.id
      ).sort((a, b) => new Date(b.applicationDate || b.id).getTime() - new Date(a.applicationDate || a.id).getTime())
    : [];

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
    return 'Competitive';
  };

  const handleDirectLogin = (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      // Check email and password against stored candidates
      const user = candidates.find(c => c.email.toLowerCase() === loginEmail.toLowerCase());
      
      if (user) {
          if (user.password === loginPassword) {
              setCandidateUser(user);
              setActiveTab('jobs');
          } else {
              setLoginError('Incorrect password.');
          }
      } else {
          setLoginError('No candidate account found with this email.');
      }
  };

  const parseCV = async (file: File, callback: (data: ExtractedCandidateData, fileName: string) => void) => {
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/msword') {
        alert("Word documents are currently not supported for auto-extraction. Please upload a PDF.");
        return;
    }

    setIsExtracting(true);
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
      callback(data, file.name);
    } catch (error: any) {
        console.error(error);
        alert(error.message || "Failed to analyze CV. Please try entering details manually.");
    } finally {
        setIsExtracting(false);
    }
  };

  const handleRegisterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          parseCV(file, (data, fileName) => {
             setProfileData({
                 ...profileData,
                 name: data.name || '',
                 email: data.email || '',
                 phone: data.phone || '',
                 linkedin: data.linkedin || '',
                 location: data.location || '',
                 cvText: data.summary || '',
                 skills: data.skills || [],
                 experienceYears: data.experienceYears || 0,
                 education: data.education || [],
                 employmentHistory: data.employmentHistory || []
             });
          });
      }
  };

  const handleSettingsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          parseCV(file, (data) => {
             setSettingsForm(prev => ({
                 ...prev,
                 name: data.name || prev.name,
                 email: data.email || prev.email,
                 phone: data.phone || prev.phone,
                 linkedin: data.linkedin || prev.linkedin,
                 location: data.location || prev.location,
                 cvText: data.summary || prev.cvText,
                 skills: data.skills || prev.skills,
                 education: data.education || prev.education,
                 employmentHistory: data.employmentHistory || prev.employmentHistory
             }));
          });
      }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(onRegister && profileData.name && profileData.email && profileData.password) {
          // Ensure password is set
          const newProfile: Candidate = {
              id: `CAND-${Date.now()}`,
              status: 'New',
              name: profileData.name,
              email: profileData.email,
              password: profileData.password, 
              role: '', // Profile has no role
              cvText: profileData.cvText || '',
              ...profileData
          } as Candidate;
          
          onRegister(newProfile);
          setRegisterSuccess(true);
          setCandidateUser(newProfile); 
          setTimeout(() => {
              setRegisterSuccess(false);
              setActiveTab('jobs');
          }, 2000);
      } else {
          alert("Please fill in all required fields including password.");
      }
  };
  
  const handleSettingsSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(candidateUser && onUpdateProfile && settingsForm.name) {
          const updatedCandidate = {
              ...candidateUser,
              ...settingsForm
          };
          onUpdateProfile(updatedCandidate);
          setCandidateUser(updatedCandidate);
          alert("Profile updated successfully.");
      }
  };
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(file) {
          const reader = new FileReader();
          reader.onload = () => {
              setSettingsForm({...settingsForm, avatar: reader.result as string});
          };
          reader.readAsDataURL(file);
      }
  };

  const addEmployment = () => setSettingsForm(prev => ({ ...prev, employmentHistory: [...(prev.employmentHistory || []), { company: '', role: '', startDate: '', endDate: '', description: '' }] }));
  const removeEmployment = (idx: number) => setSettingsForm(prev => ({ ...prev, employmentHistory: prev.employmentHistory?.filter((_, i) => i !== idx) }));
  const updateEmployment = (idx: number, field: keyof EmploymentItem, val: string) => {
      setSettingsForm(prev => {
          const updated = [...(prev.employmentHistory || [])];
          updated[idx] = { ...updated[idx], [field]: val };
          return { ...prev, employmentHistory: updated };
      });
  };

  const addEducation = () => setSettingsForm(prev => ({ ...prev, education: [...(prev.education || []), { institution: '', qualification: '', year: '' }] }));
  const removeEducation = (idx: number) => setSettingsForm(prev => ({ ...prev, education: prev.education?.filter((_, i) => i !== idx) }));
  const updateEducation = (idx: number, field: keyof EducationItem, val: string) => {
      setSettingsForm(prev => {
          const updated = [...(prev.education || [])];
          updated[idx] = { ...updated[idx], [field]: val };
          return { ...prev, education: updated };
      });
  };
  
  const handleSkillsChange = (val: string) => {
      setSettingsForm(prev => ({ ...prev, skills: val.split(',').map(s => s.trim()) }));
  };

  const handleApplyToJob = (job: Job) => {
      if (candidateUser) {
          // Robust Check: Ensure comparison is case insensitive
          const hasApplied = candidates.some(c => 
              c.email.toLowerCase() === candidateUser.email.toLowerCase() && 
              c.role === job.id
          );
          
          if(hasApplied) {
              alert("You have already applied for this position.");
              return;
          }
          setConfirmingJob(job); // Open confirmation instead of immediate submit
      } else {
          setActiveTab('login');
      }
  };

  const handleConfirmSubmit = () => {
      if (candidateUser && confirmingJob) {
          const application: Candidate = {
              ...candidateUser,
              id: `APP-${Date.now()}`,
              role: confirmingJob.id,
              applicationDate: new Date().toISOString(),
              status: 'New',
              timeline: [{ status: 'Applied', date: new Date().toISOString() }]
          };
          onApply(application);
          alert(`Successfully applied to ${confirmingJob.title}`);
          setConfirmingJob(null);
          setActiveTab('applications');
      }
  };
  
  const handleAlertSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const email = candidateUser ? candidateUser.email : alertEmail;
      
      if (email && alertKeywords) {
          // For guest: Just subscribe via generic handler
          if (!candidateUser) {
              onSubscribe(email, alertKeywords.split(',').map(k => k.trim()));
              setAlertSuccess(true);
              setAlertEmail('');
              setAlertKeywords('');
              setTimeout(() => setAlertSuccess(false), 3000);
          } else if (onSaveAlert) {
              // For authenticated user: Add to alerts list
              const newAlert: JobAlert = {
                  id: `alert-${Date.now()}`,
                  keywords: alertKeywords,
                  location: alertLocation,
                  createdAt: new Date().toISOString()
              };
              onSaveAlert(candidateUser.id, newAlert);
              // Update local state to reflect change immediately if parent doesn't cause re-render instantly
              if (candidateUser.alerts) {
                  setCandidateUser({...candidateUser, alerts: [...candidateUser.alerts, newAlert]});
              } else {
                  setCandidateUser({...candidateUser, alerts: [newAlert]});
              }
              setAlertKeywords('');
              setAlertLocation('');
              setAlertSuccess(true);
              setTimeout(() => setAlertSuccess(false), 3000);
          }
      }
  };

  const handleRemoveAlert = (alertId: string) => {
      if (candidateUser && onDeleteAlert) {
          onDeleteAlert(candidateUser.id, alertId);
          // Optimistic update
          setCandidateUser({
              ...candidateUser,
              alerts: (candidateUser.alerts || []).filter(a => a.id !== alertId)
          });
      }
  };

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
          
          const systemInstruction = `You are a helpful and encouraging Recruitment Assistant for "The Hiring Org".
          Your role is to assist job seekers with career advice, resume tips, and interview preparation.
          You can also help them navigate this portal.
          Do not promise specific job offers. Be professional, concise, and friendly.`;

          const history = aiMessages.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
          
          const response = await ai.models.generateContent({
              model: model,
              contents: [
                  ...history,
                  { role: 'user', parts: [{ text: userMsg }] }
              ],
              config: { systemInstruction }
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

  const handleSendUserMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (messageInput.trim() && onSendMessage && candidateUser) {
          // Send to a generic recruiter ID or team for now
          onSendMessage(messageInput, 'recruitment-team'); 
          setMessageInput('');
      }
  };

  const handleSharePortal = () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(() => {
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 2000);
      });
  };

  const handleJobShare = (platform: string, job: Job) => {
      const url = `https://thehiringorg.com/jobs/${job.id}`; // Mock URL for sharing
      const text = `Check out this job opportunity: ${job.title}`;
      
      if (platform === 'copy') {
          navigator.clipboard.writeText(url);
          setCopiedShareId(job.id);
          setTimeout(() => setCopiedShareId(null), 2000);
          return;
      }

      let shareUrl = '';
      switch (platform) {
          case 'linkedin': shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`; break;
          case 'twitter': shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`; break;
          case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`; break;
      }
      if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
      setShareMenuJobId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative">
        {/* Navbar ... (Same as before) */}
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center overflow-hidden">
                            <img src="https://cdn1.site-media.eu/images/0/18949945/SlateBlueTHOlogo-YALN5aQrIMvAv5iD9degXQ.png" alt="" className="w-full h-full object-contain"/>
                        </div>
                        <span className="font-bold text-slate-900 text-lg hidden md:block">The Hiring Org</span>
                    </div>
                    <div className="flex items-center space-x-4 md:space-x-8 overflow-x-auto no-scrollbar">
                        <button onClick={() => setActiveTab('jobs')} className={`text-sm font-medium whitespace-nowrap ${activeTab === 'jobs' ? 'text-orange-600' : 'text-slate-500 hover:text-slate-900'}`}>Find Jobs</button>
                        {candidateUser && (
                            <>
                                <button onClick={() => setActiveTab('applications')} className={`text-sm font-medium whitespace-nowrap ${activeTab === 'applications' ? 'text-orange-600' : 'text-slate-500 hover:text-slate-900'}`}>My Applications</button>
                                <button onClick={() => setActiveTab('inbox')} className={`text-sm font-medium whitespace-nowrap ${activeTab === 'inbox' ? 'text-orange-600' : 'text-slate-500 hover:text-slate-900'}`}>Inbox</button>
                            </>
                        )}
                        <button onClick={() => setActiveTab('alerts')} className={`text-sm font-medium whitespace-nowrap ${activeTab === 'alerts' ? 'text-orange-600' : 'text-slate-500 hover:text-slate-900'}`}>Alerts</button>
                        
                        {systemConfig?.enableCandidateFAQs && (
                            <button onClick={() => setActiveTab('help')} className={`text-sm font-medium whitespace-nowrap ${activeTab === 'help' ? 'text-orange-600' : 'text-slate-500 hover:text-slate-900'}`}>Help Center</button>
                        )}
                    </div>
                    <div className="flex items-center gap-3 pl-4 border-l border-slate-100 ml-4">
                        {/* Improved Share Button */}
                        <button 
                            onClick={handleSharePortal}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${linkCopied ? 'bg-green-100 text-green-700' : 'bg-slate-900 text-white hover:bg-black'}`}
                            title="Copy Public Link"
                        >
                            {linkCopied ? <CheckCircle size={14}/> : <Share2 size={14}/>}
                            {linkCopied ? 'Copied!' : 'Share'}
                        </button>

                        {candidateUser ? (
                            <div className="flex items-center gap-3">
                                <button onClick={() => setActiveTab('settings')} className={`text-sm font-medium flex items-center gap-2 ${activeTab === 'settings' ? 'text-orange-600' : 'text-slate-700'}`}>
                                    <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden">
                                        {candidateUser.avatar ? <img src={candidateUser.avatar} className="w-full h-full object-cover"/> : candidateUser.name.charAt(0)}
                                    </div>
                                    <span className="hidden sm:inline">{candidateUser.name}</span>
                                </button>
                                <button onClick={() => setCandidateUser(null)} className="text-xs text-slate-400 hover:text-slate-600 border-l border-slate-200 pl-3">Logout</button>
                            </div>
                        ) : (
                            <>
                                <button onClick={onLoginClick} className="text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap">Staff Login</button>
                                <button onClick={() => setActiveTab('login')} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors whitespace-nowrap">Sign In</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* ... Help Tab ... */}
            {activeTab === 'help' && systemConfig?.enableCandidateFAQs && (
                <div className="max-w-3xl mx-auto animate-fadeIn">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-slate-800 mb-2">How can we help?</h2>
                        <p className="text-slate-500">Frequently asked questions about our hiring process.</p>
                    </div>
                    <div className="space-y-4">
                        {FAQs.map((faq, idx) => (
                            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-6">
                                    <h3 className="font-bold text-slate-800 text-lg mb-2 flex items-start gap-3">
                                        <HelpCircle className="text-orange-500 mt-1 flex-shrink-0" size={20}/>
                                        {faq.q}
                                    </h3>
                                    <p className="text-slate-600 leading-relaxed ml-8">{faq.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Inbox Section */}
            {activeTab === 'inbox' && candidateUser && (
                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-fadeIn flex flex-col h-[600px]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><MessageCircle className="text-orange-500"/> Messages</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                        {candidateMessages.length > 0 ? (
                            candidateMessages.map((msg) => {
                                const isMe = msg.senderId === candidateUser.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-xl text-sm leading-relaxed shadow-sm ${
                                            isMe 
                                            ? 'bg-orange-500 text-white rounded-tr-none' 
                                            : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                                        }`}>
                                            <p>{msg.text}</p>
                                            <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-orange-100' : 'text-slate-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <MessageCircle size={48} className="mb-2 opacity-50"/>
                                <p>No messages yet. Contact the recruiter if you have questions.</p>
                            </div>
                        )}
                        <div ref={inboxEndRef}/>
                    </div>
                    <form onSubmit={handleSendUserMessage} className="p-4 border-t border-slate-100 bg-white flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                            placeholder="Type a message to the recruitment team..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            disabled={!messageInput.trim()}
                            className="bg-slate-900 text-white p-2 rounded-lg hover:bg-black disabled:opacity-50 transition-colors"
                        >
                            <Send size={20}/>
                        </button>
                    </form>
                </div>
            )}

            {/* Applications Tab */}
            {activeTab === 'applications' && candidateUser && (
                <div className="max-w-4xl mx-auto animate-fadeIn">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <History className="text-orange-500"/> Application History
                        </h2>
                        <p className="text-slate-500 mt-1">Track the status of your submitted applications.</p>
                    </div>

                    <div className="space-y-4">
                        {myApplications.length > 0 ? (
                            myApplications.map((app) => {
                                const jobDetails = jobs.find(j => j.id === app.role);
                                const statusColor = 
                                    app.status === 'Hired' ? 'bg-green-100 text-green-700 border-green-200' :
                                    app.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                    app.status === 'Interview' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                    app.status === 'Screened' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                    'bg-blue-100 text-blue-700 border-blue-200';

                                return (
                                    <div key={app.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row gap-6 items-start transition-all hover:shadow-md">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-slate-800 text-lg">
                                                        {jobDetails ? jobDetails.title : 'Unknown Position'}
                                                    </h3>
                                                    <p className="text-sm text-slate-500">
                                                        {jobDetails ? `${jobDetails.department} • ${jobDetails.location}` : `Job ID: ${app.role}`}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                                                    {app.status}
                                                </span>
                                            </div>
                                            
                                            <div className="flex items-center justify-between mt-4">
                                                <div className="flex items-center gap-4 text-xs text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12}/> Applied: {new Date(app.applicationDate || '').toLocaleDateString()}
                                                    </span>
                                                    {jobDetails && (
                                                        <span className="flex items-center gap-1">
                                                            <Hash size={12}/> Ref: {jobDetails.listingReference}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                {/* Limited Recruiter Messaging - Redirects to Inbox */}
                                                {systemConfig?.enableCandidateRecruiterMessaging && (
                                                    <button 
                                                        onClick={() => setActiveTab('inbox')}
                                                        className="text-xs flex items-center gap-1 text-blue-600 font-medium hover:underline"
                                                    >
                                                        <MessageCircle size={14}/> Message Recruiter
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-16 bg-white rounded-xl border border-slate-100 border-dashed">
                                <FileText size={48} className="mx-auto text-slate-200 mb-4"/>
                                <h3 className="text-lg font-medium text-slate-500">No applications found</h3>
                                <p className="text-slate-400 text-sm mt-1">Start applying to jobs to see your history here.</p>
                                <button onClick={() => setActiveTab('jobs')} className="mt-4 text-orange-600 font-medium hover:underline">
                                    Browse Jobs
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Find Jobs Tab */}
            {activeTab === 'jobs' && (
                <div className="animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                            <div className="md:col-span-5 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                <input 
                                    type="text" 
                                    placeholder="Search job title, skills, or keywords..." 
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-4 relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                <input 
                                    type="text" 
                                    placeholder="City, province, or remote" 
                                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                                    value={locationFilter}
                                    onChange={(e) => setLocationFilter(e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-3">
                                <div className="relative">
                                    <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                    <select 
                                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 appearance-none bg-white"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="salary_high">Highest Salary</option>
                                        <option value="salary_low">Lowest Salary</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {filteredJobs.map(job => (
                            <div key={job.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow relative">
                                <div className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-1 cursor-pointer hover:text-orange-600 transition-colors" onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}>
                                                {job.title}
                                            </h3>
                                            <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-3">
                                                <span className="flex items-center gap-1"><Building2 size={14}/> {job.department}</span>
                                                <span className="flex items-center gap-1"><MapPin size={14}/> {job.location}</span>
                                                <span className="flex items-center gap-1"><Banknote size={14}/> {formatSalary(job)}</span>
                                                <span className="flex items-center gap-1"><Clock size={14}/> {job.type}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {/* Share Button Logic */}
                                            <div className="relative">
                                                <button 
                                                    onClick={() => setShareMenuJobId(shareMenuJobId === job.id ? null : job.id)}
                                                    className={`p-2 rounded-lg transition-colors ${shareMenuJobId === job.id ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                                    title="Share this job"
                                                >
                                                    <Share2 size={20}/>
                                                </button>
                                                {shareMenuJobId === job.id && (
                                                    <div className="absolute right-0 top-10 bg-white shadow-xl border border-slate-100 rounded-lg p-2 flex gap-2 z-20 animate-fadeIn">
                                                        <button onClick={() => handleJobShare('linkedin', job)} className="p-2 hover:bg-blue-50 rounded text-blue-700" title="Share on LinkedIn"><Linkedin size={16}/></button>
                                                        <button onClick={() => handleJobShare('twitter', job)} className="p-2 hover:bg-slate-50 rounded text-sky-500" title="Share on X"><Twitter size={16}/></button>
                                                        <button onClick={() => handleJobShare('facebook', job)} className="p-2 hover:bg-blue-50 rounded text-blue-600" title="Share on Facebook"><Facebook size={16}/></button>
                                                        <div className="w-px h-6 bg-slate-200 my-auto"></div>
                                                        <button onClick={() => handleJobShare('copy', job)} className="p-2 hover:bg-slate-50 rounded text-slate-600 flex items-center gap-1" title="Copy Link">
                                                            {copiedShareId === job.id ? <Check size={16} className="text-green-600"/> : <Copy size={16}/>}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <button 
                                                onClick={() => handleApplyToJob(job)}
                                                className="bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-black transition-colors shadow-lg shadow-slate-900/20"
                                            >
                                                View & Apply
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <p className="text-slate-600 text-sm line-clamp-2 mb-4">{job.description}</p>
                                    
                                    <button 
                                        onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                                        className="text-sm font-medium text-orange-600 flex items-center gap-1 hover:underline"
                                    >
                                        {expandedJobId === job.id ? 'Show Less' : 'View Details'} {expandedJobId === job.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                    </button>
                                </div>

                                {expandedJobId === job.id && (
                                    <div className="px-6 pb-6 border-t border-slate-100 bg-slate-50/50 pt-6">
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div>
                                                <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">Key Responsibilities</h4>
                                                <ul className="space-y-2">
                                                    {job.responsibilities.map((r, i) => (
                                                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                                            <div className="min-w-[6px] h-[6px] rounded-full bg-orange-400 mt-1.5"></div>
                                                            {r}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">Requirements</h4>
                                                <ul className="space-y-2">
                                                    {job.requirements.map((r, i) => (
                                                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                                            <div className="min-w-[6px] h-[6px] rounded-full bg-blue-400 mt-1.5"></div>
                                                            {r}
                                                        </li>
                                                    ))}
                                                </ul>
                                                
                                                {job.benefits && job.benefits.length > 0 && (
                                                    <div className="mt-6">
                                                        <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">Benefits</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {job.benefits.map((b, i) => (
                                                                <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md border border-green-200 font-medium">
                                                                    {b}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-slate-200 flex justify-end">
                                            <button 
                                                onClick={() => handleApplyToJob(job)}
                                                className="bg-orange-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-orange-700 transition-all shadow-lg flex items-center gap-2"
                                            >
                                                View & Submit <ArrowRight size={18}/>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {filteredJobs.length === 0 && (
                            <div className="text-center py-16">
                                <Briefcase size={48} className="mx-auto text-slate-300 mb-4"/>
                                <h3 className="text-lg font-medium text-slate-600">No jobs found matching your criteria</h3>
                                <p className="text-slate-400 mt-1">Try adjusting your search or filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ... Alerts, Login, Register, Settings Tabs (Same as before) ... */}
            {activeTab === 'alerts' && (
                <div className="max-w-3xl mx-auto animate-fadeIn">
                    {/* ... Alert content same as previous ... */}
                    <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden mb-8">
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                    <Bell size={24}/>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Job Alerts</h2>
                                    <p className="text-slate-500">Get notified immediately when new jobs matching your skills are posted.</p>
                                </div>
                            </div>
                            
                            {alertSuccess && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700 flex items-center gap-3 mb-6 animate-fadeIn">
                                    <CheckCircle size={20}/>
                                    <div>
                                        <p className="font-bold">Success!</p>
                                        <p className="text-sm">Your job alert has been created.</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleAlertSubmit} className="space-y-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
                                <h3 className="font-bold text-slate-700 mb-2 text-sm uppercase tracking-wide">Create New Alert</h3>
                                {!candidateUser && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                        <input 
                                            type="email" 
                                            required
                                            placeholder="you@example.com"
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                            value={alertEmail}
                                            onChange={(e) => setAlertEmail(e.target.value)}
                                        />
                                    </div>
                                )}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Keywords / Job Titles</label>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="e.g. React, Finance, Manager"
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                            value={alertKeywords}
                                            onChange={(e) => setAlertKeywords(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Location (Optional)</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Cape Town, Remote"
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                            value={alertLocation}
                                            onChange={(e) => setAlertLocation(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-bold hover:bg-black transition-all flex items-center justify-center gap-2">
                                    <Plus size={18}/> Create Alert
                                </button>
                            </form>
                        </div>
                    </div>

                    {candidateUser && candidateUser.alerts && candidateUser.alerts.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-4 border-b border-slate-100 bg-slate-50">
                                <h3 className="font-bold text-slate-700">Your Active Alerts</h3>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {candidateUser.alerts.map(alert => (
                                    <div key={alert.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{alert.keywords}</p>
                                            <div className="flex gap-2 text-xs text-slate-500 mt-1">
                                                <span className="flex items-center gap-1"><MapPin size={10}/> {alert.location || 'Any Location'}</span>
                                                <span className="flex items-center gap-1"><Clock size={10}/> Created: {new Date(alert.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleRemoveAlert(alert.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Alert"
                                            >
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ... Login, Register, Settings (Keeping structure identical to previous to avoid cutting code) ... */}
            {activeTab === 'login' && (
                <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden animate-fadeIn">
                    <div className="p-8">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Candidate Sign In</h2>
                        <p className="text-slate-500 mb-6">Access your profile and applications.</p>

                        {loginError && (
                            <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                                <AlertCircle size={16}/> {loginError}
                            </div>
                        )}

                        <form onSubmit={handleDirectLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <input 
                                    required
                                    type="email" 
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <input 
                                    required
                                    type="password" 
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    placeholder="Enter your password"
                                />
                            </div>
                            <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-black transition-all">
                                Sign In
                            </button>
                        </form>
                        <div className="mt-6 text-center text-sm text-slate-600">
                            Don't have an account? <button onClick={() => setActiveTab('register')} className="text-orange-600 hover:underline font-medium">Create Profile</button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'register' && (
                <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden animate-fadeIn">
                    <div className="p-8">
                        {/* ... (Registration UI same as before) ... */}
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Create Candidate Profile</h2>
                        <p className="text-slate-500 mb-6">Upload your CV to auto-fill your profile or enter details manually.</p>

                        {registerSuccess ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                                    <CheckCircle size={32}/>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Registration Complete!</h3>
                                <p className="text-slate-500 mt-2">Redirecting you to job listings...</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8 text-center border-dashed border-2">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600">
                                        {isExtracting ? <Loader2 className="animate-spin" size={24}/> : <Upload size={24}/>}
                                    </div>
                                    <h3 className="font-bold text-slate-800 mb-1">Auto-fill with CV</h3>
                                    <p className="text-sm text-slate-500 mb-4">Upload your resume (PDF) to automatically populate your profile.</p>
                                    <div className="relative inline-block">
                                        <button 
                                            disabled={isExtracting}
                                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-70"
                                        >
                                            {isExtracting ? 'Analyzing...' : 'Select File'}
                                        </button>
                                        <input 
                                            type="file" 
                                            accept=".pdf"
                                            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                            onChange={handleRegisterUpload}
                                            disabled={isExtracting}
                                        />
                                    </div>
                                </div>

                                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                                    {/* ... Form Fields ... */}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                                            <input 
                                                required
                                                type="text" 
                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                                value={profileData.name}
                                                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                                            <input 
                                                required
                                                type="email" 
                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                                value={profileData.email}
                                                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Create Password <span className="text-red-500">*</span></label>
                                        <input 
                                            required
                                            type="password"
                                            minLength={6}
                                            placeholder="Min 6 characters"
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                            value={profileData.password}
                                            onChange={(e) => setProfileData({...profileData, password: e.target.value})}
                                        />
                                    </div>
                                    {/* ... Rest of fields ... */}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                                value={profileData.phone}
                                                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                            <input 
                                                type="text" 
                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                                value={profileData.location}
                                                onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn Profile</label>
                                        <input 
                                            type="url" 
                                            placeholder="https://linkedin.com/in/..."
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                            value={profileData.linkedin}
                                            onChange={(e) => setProfileData({...profileData, linkedin: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Professional Summary</label>
                                        <textarea 
                                            rows={4}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                            value={profileData.cvText}
                                            onChange={(e) => setProfileData({...profileData, cvText: e.target.value})}
                                        />
                                    </div>
                                    <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-black transition-all mt-4">
                                        Create Account & Continue
                                    </button>
                                </form>
                                <div className="mt-4 text-center text-sm text-slate-600">
                                    Already have an account? <button onClick={() => setActiveTab('login')} className="text-orange-600 hover:underline font-medium">Sign In</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ... Settings Tab (Keeping as previously implemented) ... */}
            {activeTab === 'settings' && candidateUser && (
                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden animate-fadeIn">
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-slate-800">My Profile Settings</h2>
                        <div className="relative">
                            <button 
                                disabled={isExtracting}
                                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                            >
                                {isExtracting ? <Loader2 className="animate-spin" size={16}/> : <RefreshCw size={16}/>}
                                Update from CV
                            </button>
                            <input 
                                type="file" 
                                accept=".pdf"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleSettingsUpload}
                                disabled={isExtracting}
                            />
                        </div>
                    </div>
                    
                    <form onSubmit={handleSettingsSubmit} className="p-8 space-y-8">
                        {/* ... (Full Settings Form from previous turn) ... */}
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="w-full md:w-1/4 flex flex-col items-center gap-4">
                                <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden relative group cursor-pointer">
                                    {settingsForm.avatar ? (
                                        <img src={settingsForm.avatar} className="w-full h-full object-cover" alt="Profile"/>
                                    ) : (
                                        <User size={64} className="text-slate-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="text-white"/>
                                    </div>
                                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleAvatarChange} />
                                </div>
                                <p className="text-xs text-slate-400">Click to change photo</p>
                            </div>
                            
                            <div className="w-full md:w-3/4 space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                        <input type="text" className="w-full px-3 py-2 border rounded-lg" value={settingsForm.name || ''} onChange={e => setSettingsForm({...settingsForm, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                        <input type="email" className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-slate-500" value={settingsForm.email || ''} readOnly />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                        <input type="text" className="w-full px-3 py-2 border rounded-lg" value={settingsForm.phone || ''} onChange={e => setSettingsForm({...settingsForm, phone: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                        <input type="text" className="w-full px-3 py-2 border rounded-lg" value={settingsForm.location || ''} onChange={e => setSettingsForm({...settingsForm, location: e.target.value})} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Professional Summary</label>
                                    <textarea rows={4} className="w-full px-3 py-2 border rounded-lg" value={settingsForm.cvText || ''} onChange={e => setSettingsForm({...settingsForm, cvText: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100"/>

                        <div>
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Skills & Experience</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Skills (Comma separated)</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-3 py-2 border rounded-lg" 
                                        value={settingsForm.skills?.join(', ') || ''} 
                                        onChange={e => handleSkillsChange(e.target.value)} 
                                    />
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {settingsForm.skills?.map((s, i) => (
                                            <span key={i} className="px-2 py-1 bg-slate-100 rounded text-xs text-slate-600">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100"/>

                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-800">Employment History</h3>
                                <button type="button" onClick={addEmployment} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Plus size={14}/> Add Position</button>
                            </div>
                            <div className="space-y-4">
                                {settingsForm.employmentHistory?.map((job, index) => (
                                    <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative group">
                                        <button type="button" onClick={() => removeEmployment(index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                                        <div className="grid md:grid-cols-2 gap-4 mb-2">
                                            <input placeholder="Company" className="border p-2 rounded" value={job.company} onChange={e => updateEmployment(index, 'company', e.target.value)} />
                                            <input placeholder="Role Title" className="border p-2 rounded" value={job.role} onChange={e => updateEmployment(index, 'role', e.target.value)} />
                                            <input placeholder="Start Date" className="border p-2 rounded" value={job.startDate} onChange={e => updateEmployment(index, 'startDate', e.target.value)} />
                                            <input placeholder="End Date" className="border p-2 rounded" value={job.endDate} onChange={e => updateEmployment(index, 'endDate', e.target.value)} />
                                        </div>
                                        <textarea placeholder="Description of duties..." className="w-full border p-2 rounded text-sm" rows={2} value={job.description} onChange={e => updateEmployment(index, 'description', e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <hr className="border-slate-100"/>

                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-slate-800">Education</h3>
                                <button type="button" onClick={addEducation} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Plus size={14}/> Add Education</button>
                            </div>
                            <div className="space-y-4">
                                {settingsForm.education?.map((edu, index) => (
                                    <div key={index} className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative group">
                                        <button type="button" onClick={() => removeEducation(index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <input placeholder="Institution" className="border p-2 rounded" value={edu.institution} onChange={e => updateEducation(index, 'institution', e.target.value)} />
                                            <input placeholder="Qualification/Degree" className="border p-2 rounded" value={edu.qualification} onChange={e => updateEducation(index, 'qualification', e.target.value)} />
                                            <input placeholder="Year" className="border p-2 rounded" value={edu.year} onChange={e => updateEducation(index, 'year', e.target.value)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button type="submit" className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-black transition-all shadow-lg flex items-center gap-2">
                                <Save size={18}/> Save Profile Changes
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>

        {/* ... AI Assistant Chat Widget (Same as before) ... */}
        {systemConfig?.enableCandidateAI && (
            <>
                {!showAiChat ? (
                    <button 
                        onClick={() => setShowAiChat(true)}
                        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:bg-indigo-700 transition-transform hover:scale-105 z-50 flex items-center gap-2"
                    >
                        <Bot size={24}/>
                        <span className="font-bold pr-1">Assistant</span>
                    </button>
                ) : (
                    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-fadeIn">
                        {/* ... AI UI ... */}
                        <div className="p-4 bg-indigo-600 text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Bot size={24} className="text-indigo-200"/>
                                <div>
                                    <h3 className="font-bold text-sm">Career Assistant</h3>
                                    <p className="text-xs text-indigo-200">Powered by Gemini</p>
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
                )}
            </>
        )}

       {/* Confirmation Modal */}
       {confirmingJob && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                   <div className="p-6 border-b border-slate-100 bg-slate-50">
                       <h3 className="text-xl font-bold text-slate-800">Confirm Application</h3>
                       <p className="text-sm text-slate-500">Review details before submitting.</p>
                   </div>
                   <div className="p-6 space-y-4">
                       <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                           <h4 className="font-bold text-blue-900 mb-2 text-sm uppercase tracking-wider">Applying For</h4>
                           <p className="text-lg font-bold text-slate-800">{confirmingJob.title}</p>
                           <p className="text-sm text-slate-600">{confirmingJob.department} • {confirmingJob.location}</p>
                           <p className="text-xs text-slate-500 mt-1">Ref: {confirmingJob.listingReference}</p>
                       </div>
                       
                       <div className="border border-slate-200 rounded-lg p-4">
                           <h4 className="font-bold text-slate-700 mb-2 text-sm uppercase tracking-wider">Your Profile</h4>
                           <div className="flex items-center gap-3 mb-2">
                               {candidateUser?.avatar ? (
                                   <img src={candidateUser.avatar} className="w-10 h-10 rounded-full object-cover"/>
                               ) : (
                                   <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center"><User size={20}/></div>
                               )}
                               <div>
                                   <p className="font-bold text-sm text-slate-800">{candidateUser?.name}</p>
                                   <p className="text-xs text-slate-500">{candidateUser?.email}</p>
                               </div>
                           </div>
                           <p className="text-xs text-slate-500 flex items-center gap-1">
                               <Phone size={12}/> {candidateUser?.phone || 'No phone'}
                           </p>
                           <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                               <MapPin size={12}/> {candidateUser?.location || 'No location'}
                           </p>
                       </div>
                       
                       <p className="text-xs text-slate-400 text-center">
                           By clicking View & Submit, you agree to share your profile data with The Hiring Org for this specific opportunity.
                       </p>
                   </div>
                   <div className="p-4 border-t border-slate-100 flex gap-3 bg-slate-50">
                       <button 
                           onClick={() => setConfirmingJob(null)}
                           className="flex-1 py-3 text-slate-600 font-medium hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all"
                       >
                           Cancel
                       </button>
                       <button 
                           onClick={handleConfirmSubmit}
                           className="flex-[2] py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 shadow-md transition-all flex items-center justify-center gap-2"
                       >
                           View & Submit <Send size={18}/>
                       </button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};

export default CandidatePortal;
