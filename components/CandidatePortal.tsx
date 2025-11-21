
import React, { useState } from 'react';
import { Job, Candidate, EmploymentItem, EducationItem } from '../types';
import { extractCandidateInfo, ExtractedCandidateData } from '../services/geminiService';
import { MapPin, Phone, Globe, Upload, FileText, CheckCircle, Briefcase, ChevronRight, Loader2, Search, Copy, Bell, Building2, Calendar, HeartHandshake, Hash, ListChecks, Star, Sparkles, Banknote, UserPlus, Lock, User, Clock, GraduationCap, Globe2, Plus, Trash2, Share2, Camera, LogIn, ChevronDown, ChevronUp, Facebook, Linkedin, Twitter } from 'lucide-react';

interface CandidatePortalProps {
  jobs: Job[];
  candidates: Candidate[];
  onApply: (candidate: Candidate) => void;
  onSubscribe: (email: string, keywords: string[]) => void;
  onRegister?: (profile: Candidate) => void;
  onLoginClick: () => void;
}

const CandidatePortal: React.FC<CandidatePortalProps> = ({ jobs, candidates, onApply, onSubscribe, onRegister, onLoginClick }) => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications' | 'alerts' | 'register' | 'login'>('jobs');
  const [applicationStep, setApplicationStep] = useState<'list' | 'success'>('list');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  
  const [isExtracting, setIsExtracting] = useState(false);
  
  // Candidate Session State
  const [candidateUser, setCandidateUser] = useState<Candidate | null>(null);
  const [loginEmail, setLoginEmail] = useState('');

  // My Applications Search Local Filter
  const [appSearchQuery, setAppSearchQuery] = useState('');

  const [alertEmail, setAlertEmail] = useState('');
  const [alertKeywords, setAlertKeywords] = useState('');
  const [alertSuccess, setAlertSuccess] = useState(false);

  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [profileAvatar, setProfileAvatar] = useState('');
  const [profileData, setProfileData] = useState<Partial<Candidate>>({
    name: '',
    email: '',
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
  const [profileFileName, setProfileFileName] = useState('');

  const activeJobs = jobs.filter(j => j.status === 'Active');

  const formatSalary = (job: Job) => {
    if (job.salaryType === 'Market Related') return 'Market Related';
    if (job.salaryType === 'Negotiable') return 'Negotiable';
    const symbol = job.salaryCurrency === 'USD' ? '$' : job.salaryCurrency === 'EUR' ? '€' : job.salaryCurrency === 'GBP' ? '£' : 'R';

    if (job.salaryType === 'Fixed' && job.salaryMin) return `${symbol}${job.salaryMin.toLocaleString()}`;
    if (job.salaryType === 'Range' && job.salaryMin && job.salaryMax) {
        const k = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n);
        return `${symbol}${k(job.salaryMin)} - ${symbol}${k(job.salaryMax)}`;
    }
    return 'Competitive';
  };

  const parseCV = async (file: File, callback: (data: ExtractedCandidateData, fileName: string) => void) => {
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

      const extractedData = await extractCandidateInfo(base64Data, mimeType);
      callback(extractedData, file.name);
    } catch (error) {
      alert("Could not auto-fill details from CV. Please enter them manually.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(file) {
          const reader = new FileReader();
          reader.onload = () => setProfileAvatar(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const handleRegisterCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProfileFileName(file.name);
    parseCV(file, (data, fileName) => {
      setProfileData(prev => ({
        ...prev,
        name: data.name || prev.name,
        email: data.email || prev.email,
        phone: data.phone || prev.phone,
        linkedin: data.linkedin || prev.linkedin,
        location: data.location || prev.location,
        noticePeriod: data.noticePeriod || prev.noticePeriod,
        skills: data.skills || prev.skills,
        languages: data.languages || prev.languages,
        employmentHistory: data.employmentHistory || [],
        education: data.education || [],
        experienceYears: data.experienceYears || 0,
        cvText: data.summary || ''
      }));
    });
  };

  const handleCandidateLogin = (e: React.FormEvent) => {
      e.preventDefault();
      // Simple mock login - checks if email exists in candidates array
      // NOTE: In this demo data structure, candidates array holds applications as well as profiles.
      // We find any record with matching email to log them in.
      const found = candidates.find(c => c.email?.toLowerCase() === loginEmail.toLowerCase());
      if(found) {
          setCandidateUser(found);
          setActiveTab('jobs');
          setLoginEmail('');
      } else {
          alert("No account found with this email. Please register.");
          setActiveTab('register');
      }
  };

  const handleApply = (job: Job) => {
      if(!candidateUser) {
          alert("You must be logged in to apply.");
          setActiveTab('login');
          return;
      }

      const applicationId = 'APP-' + Math.floor(100000 + Math.random() * 900000);
      const newApplication: Candidate = {
          ...candidateUser, // Copy profile data
          id: applicationId,
          role: job.id,
          status: 'New',
          timeline: [{ status: 'Applied', date: new Date().toISOString() }]
      };
      
      onApply(newApplication);
      setApplicationStep('success');
      setExpandedJobId(null);
      setTimeout(() => setApplicationStep('list'), 3000);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRegister && profileData.name && profileData.email) {
      const finalProfile: Candidate = {
        id: `CAND-${Date.now()}`,
        name: profileData.name,
        email: profileData.email,
        avatar: profileAvatar,
        role: '', 
        cvText: profileData.cvText || '',
        status: 'New',
        timeline: [{ status: 'Profile Created', date: new Date().toISOString() }],
        ...profileData
      } as Candidate;

      onRegister(finalProfile);
      setCandidateUser(finalProfile); // Auto login
      setRegisterSuccess(true);
    }
  };

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const keywords = alertKeywords.split(',').map(k => k.trim()).filter(Boolean);
    if (alertEmail && keywords.length > 0) {
      onSubscribe(alertEmail, keywords);
      setAlertSuccess(true);
      setAlertEmail('');
      setAlertKeywords('');
      setTimeout(() => setAlertSuccess(false), 5000);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Hired': return 'bg-green-100 text-green-700 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'Interview': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Screened': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };
  
  const handleShare = (platform: string, job?: Job) => {
     if(!job) return;
     const url = window.location.href;
     const text = `Check out this ${job.title} position at The Hiring Org!`;
     
     let shareUrl = '';
     switch(platform) {
         case 'linkedin': shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`; break;
         case 'twitter': shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`; break;
         case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`; break;
         case 'whatsapp': shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`; break;
     }
     if(shareUrl) window.open(shareUrl, '_blank');
  };

  // My Applications Filter logic:
  // 1. Match logged in email.
  // 2. Must have a 'role' (which implies it's an application to a specific job ID).
  // 3. Filter by search query locally.
  const myApps = candidateUser 
    ? candidates.filter(c => c.email?.toLowerCase() === candidateUser.email?.toLowerCase() && c.role) 
    : [];
    
  const displayedApps = myApps.filter(app => {
      const job = jobs.find(j => j.id === app.role);
      const search = appSearchQuery.toLowerCase();
      return job?.title.toLowerCase().includes(search) || 
             job?.listingReference.toLowerCase().includes(search);
  });

  return (
    <div className="bg-slate-50 min-h-full animate-fadeIn pb-20 relative">
       
       <div className="absolute top-2 right-4 z-50 flex items-center gap-3">
           {candidateUser ? (
               <div className="flex items-center gap-2 text-sm text-slate-600">
                   <User size={14}/> Hi, {candidateUser.name}
                   <button onClick={() => setCandidateUser(null)} className="text-[10px] underline ml-2">Logout</button>
               </div>
           ) : (
               <button onClick={() => setActiveTab('login')} className="text-sm font-medium text-orange-600 hover:text-orange-700">
                   Candidate Login
               </button>
           )}
           <span className="text-slate-300">|</span>
           <button onClick={onLoginClick} className="text-[10px] text-slate-400 hover:text-slate-600">Staff Admin</button>
       </div>

      {/* Company Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-sm border border-slate-100">
                 <img 
                  src="https://cdn1.site-media.eu/images/0/18949945/SlateBlueTHOlogo-YALN5aQrIMvAv5iD9degXQ.png" 
                  alt="The Hiring Org" 
                  className="w-full h-full object-contain"
                 />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">The Hiring Org</h1>
                <p className="text-slate-500 mt-1 text-lg">Connecting Talent with Opportunity</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-orange-500" />
                <a href="https://thehiringorg.co.za" target="_blank" rel="noreferrer" className="hover:text-orange-500 transition-colors">thehiringorg.co.za</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-orange-500" />
                <span>+27 72 538 3171</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-orange-500" />
                <span>Bellairs Dr, North Riding, South Africa</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-8 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('jobs')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'jobs' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Open Positions
            </button>
            {!candidateUser && (
                <button 
                onClick={() => setActiveTab('register')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'register' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                <UserPlus size={16} /> Create Profile
                </button>
            )}
            <button 
              onClick={() => setActiveTab('applications')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'applications' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              My Applications
            </button>
            <button 
              onClick={() => setActiveTab('alerts')}
              className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'alerts' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Job Alerts
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 relative">
        
        {/* CANDIDATE LOGIN */}
        {activeTab === 'login' && !candidateUser && (
            <div className="max-w-md mx-auto animate-fadeIn bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Candidate Login</h2>
                <form onSubmit={handleCandidateLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input 
                            required
                            type="email" 
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <button className="w-full py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900">Login</button>
                </form>
                <p className="mt-4 text-center text-sm text-slate-500">
                    Don't have a profile? <button onClick={() => setActiveTab('register')} className="text-orange-500 font-medium hover:underline">Create Account</button>
                </p>
            </div>
        )}

        {/* REGISTER PROFILE TAB */}
        {activeTab === 'register' && (
          <div className="max-w-3xl mx-auto animate-fadeIn">
            {registerSuccess ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Profile Created!</h2>
                <p className="text-slate-600 mb-6">
                  Your detailed candidate profile has been saved. You can now apply for jobs with one click.
                </p>
                <button 
                  onClick={() => { setActiveTab('jobs'); setRegisterSuccess(false); }}
                  className="px-6 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Browse Jobs
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-slate-800">Create Detailed Profile</h2>
                  <p className="text-slate-500 mt-1">Creating an account is mandatory to apply. Upload your CV to auto-fill.</p>
                </div>

                {/* CV Upload Section */}
                <div className="mb-8">
                  <div className="border-2 border-dashed border-blue-200 bg-blue-50 rounded-xl p-6 text-center relative hover:bg-blue-100 transition-colors">
                    <input 
                      type="file" 
                      accept=".pdf,.txt" 
                      onChange={handleRegisterCvUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isExtracting}
                    />
                    {isExtracting ? (
                      <div className="flex flex-col items-center justify-center py-2">
                        <Loader2 className="animate-spin text-blue-500 mb-2" size={24} />
                        <span className="text-blue-700 font-medium">Extracting data from CV...</span>
                      </div>
                    ) : profileFileName ? (
                      <div className="flex flex-col items-center justify-center py-2">
                        <CheckCircle className="text-green-500 mb-2" size={24} />
                        <span className="text-slate-700 font-medium">Parsed: {profileFileName}</span>
                        <span className="text-xs text-slate-500 mt-1">Review details below</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-2">
                        <Upload className="text-blue-500 mb-2" size={24} />
                        <span className="text-slate-800 font-semibold">Upload CV to Auto-fill</span>
                      </div>
                    )}
                  </div>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-8">
                  {/* Section 1: Personal Details */}
                  <section>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <User size={20} className="text-orange-500" /> Personal & Contact
                    </h3>
                    
                    {/* Profile Picture Upload */}
                    <div className="mb-6 flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden relative">
                            {profileAvatar ? (
                                <img src={profileAvatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={32} className="text-slate-300" />
                            )}
                        </div>
                        <div className="relative">
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <button type="button" className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm hover:bg-slate-50">
                                <Camera size={16}/> Upload Photo
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                        <input
                          required
                          type="text"
                          value={profileData.name || ''}
                          onChange={e => setProfileData({...profileData, name: e.target.value})}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                        <input
                          required
                          type="tel"
                          value={profileData.phone || ''}
                          onChange={e => setProfileData({...profileData, phone: e.target.value})}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input
                          required
                          type="email"
                          value={profileData.email || ''}
                          onChange={e => setProfileData({...profileData, email: e.target.value})}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Current Location</label>
                        <input
                          type="text"
                          value={profileData.location || ''}
                          onChange={e => setProfileData({...profileData, location: e.target.value})}
                          placeholder="City, Country"
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">Notice Period</label>
                         <select
                             value={profileData.noticePeriod || ''}
                             onChange={e => setProfileData({...profileData, noticePeriod: e.target.value})}
                             className="w-full px-4 py-2.5 border border-slate-200 rounded-lg"
                         >
                             <option value="Immediate">Immediate</option>
                             <option value="1 Week">1 Week</option>
                             <option value="2 Weeks">2 Weeks</option>
                             <option value="30 Days">30 Days</option>
                             <option value="Calendar Month">Calendar Month</option>
                             <option value="2 Months">2 Months</option>
                             <option value="3 Months">3 Months</option>
                         </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Total Experience (Years)</label>
                        <input
                          type="number"
                          value={profileData.experienceYears || 0}
                          onChange={e => setProfileData({...profileData, experienceYears: parseInt(e.target.value)})}
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                       <Briefcase size={20} className="text-orange-500" /> Employment History
                    </h3>
                    <div className="space-y-4">
                       {profileData.employmentHistory?.map((item, i) => (
                           <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                               <div className="grid grid-cols-2 gap-4 mb-2">
                                   <input className="p-2 border rounded" placeholder="Company" value={item.company} onChange={e => {
                                       const h = [...(profileData.employmentHistory || [])]; h[i].company = e.target.value; setProfileData({...profileData, employmentHistory: h});
                                   }}/>
                                   <input className="p-2 border rounded" placeholder="Role" value={item.role} onChange={e => {
                                       const h = [...(profileData.employmentHistory || [])]; h[i].role = e.target.value; setProfileData({...profileData, employmentHistory: h});
                                   }}/>
                               </div>
                               <textarea className="w-full p-2 border rounded text-sm" rows={2} placeholder="Description" value={item.description} onChange={e => {
                                   const h = [...(profileData.employmentHistory || [])]; h[i].description = e.target.value; setProfileData({...profileData, employmentHistory: h});
                               }}/>
                           </div>
                       ))}
                       <button type="button" onClick={() => setProfileData({...profileData, employmentHistory: [...(profileData.employmentHistory || []), {company:'',role:'',startDate:'',endDate:'',description:''}]})} className="text-sm text-orange-600 font-medium">+ Add Position</button>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                       <GraduationCap size={20} className="text-orange-500" /> Education
                    </h3>
                    <div className="space-y-4">
                       {profileData.education?.map((item, i) => (
                           <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-3 gap-4">
                               <input className="p-2 border rounded" placeholder="Institution" value={item.institution} onChange={e => {
                                   const eduList = [...(profileData.education || [])]; eduList[i].institution = e.target.value; setProfileData({...profileData, education: eduList});
                               }}/>
                               <input className="p-2 border rounded" placeholder="Qualification" value={item.qualification} onChange={e => {
                                   const eduList = [...(profileData.education || [])]; eduList[i].qualification = e.target.value; setProfileData({...profileData, education: eduList});
                               }}/>
                               <input className="p-2 border rounded" placeholder="Year" value={item.year} onChange={e => {
                                   const eduList = [...(profileData.education || [])]; eduList[i].year = e.target.value; setProfileData({...profileData, education: eduList});
                               }}/>
                           </div>
                       ))}
                       <button type="button" onClick={() => setProfileData({...profileData, education: [...(profileData.education || []), {institution:'',qualification:'',year:''}]})} className="text-sm text-orange-600 font-medium">+ Add Education</button>
                    </div>
                  </section>
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <UserPlus size={18} /> Create Account & Save Profile
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* MY APPLICATIONS TAB */}
        {activeTab === 'applications' && (
          <div className="max-w-2xl mx-auto animate-fadeIn">
             <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 mb-6">
                 {!candidateUser ? (
                     <div className="text-center py-12">
                         <Lock className="mx-auto text-slate-300 mb-4" size={48}/>
                         <h2 className="text-xl font-bold text-slate-800 mb-2">Login Required</h2>
                         <p className="text-slate-500 mb-6">Please login to view your application history.</p>
                         <button onClick={() => setActiveTab('login')} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900">Go to Login</button>
                     </div>
                 ) : (
                    <>
                      <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-bold text-slate-800">My Applications</h2>
                          <div className="relative w-64">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                             <input 
                                type="text" 
                                value={appSearchQuery}
                                onChange={e => setAppSearchQuery(e.target.value)}
                                placeholder="Filter applications..."
                                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500"
                             />
                          </div>
                      </div>

                      {displayedApps.length > 0 ? (
                        <div className="space-y-4 animate-fadeIn">
                            {displayedApps.map(app => {
                                const job = jobs.find(j => j.id === app.role);
                                return (
                                <div key={app.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-lg font-bold text-slate-800">{job?.title || 'Unknown Position'}</h4>
                                        <div className={`px-4 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(app.status)}`}>
                                            {app.status}
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 mb-4 flex items-center gap-2">
                                        <Hash size={14}/> Ref: {job?.listingReference}
                                    </p>
                                    {/* Timeline View for Candidate */}
                                    {app.timeline && app.timeline.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-50">
                                            <h5 className="text-xs font-semibold text-slate-400 uppercase mb-3">Application Timeline</h5>
                                            <div className="space-y-3 pl-2 border-l-2 border-slate-100">
                                                {app.timeline.map((event, i) => (
                                                    <div key={i} className="relative pl-4">
                                                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-slate-200"></div>
                                                        <p className="text-sm font-medium text-slate-700">{event.status}</p>
                                                        <p className="text-xs text-slate-400">{new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString()}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                        </div>
                      ) : (
                          <div className="text-center py-12 bg-slate-50 rounded-lg">
                              <FileText className="mx-auto text-slate-300 mb-3" size={32}/>
                              <p className="text-slate-500">No applications found matching your criteria.</p>
                          </div>
                      )}
                    </>
                 )}
             </div>
          </div>
        )}

        {/* ALERTS TAB */}
        {activeTab === 'alerts' && (
          <div className="max-w-2xl mx-auto animate-fadeIn">
             <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                 <h2 className="text-xl font-bold text-slate-800 mb-6">Job Alerts</h2>
                 {alertSuccess ? <div className="text-green-600">Subscribed!</div> : 
                 <form onSubmit={handleSubscribeSubmit} className="space-y-4">
                     <input type="email" required placeholder="Email" className="w-full px-4 py-3 border rounded-lg" onChange={e=>setAlertEmail(e.target.value)}/>
                     <input type="text" required placeholder="Keywords" className="w-full px-4 py-3 border rounded-lg" onChange={e=>setAlertKeywords(e.target.value)}/>
                     <button className="w-full py-3 bg-orange-500 text-white rounded-lg">Subscribe</button>
                 </form>}
             </div>
          </div>
        )}

        {/* JOBS TAB with Accordion Expansion */}
        {activeTab === 'jobs' && (
           <>
            {applicationStep === 'success' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-sm animate-fadeIn">
                         <CheckCircle className="mx-auto text-green-500 mb-4" size={48}/>
                        <h2 className="text-2xl font-bold">Application Sent!</h2>
                        <p className="text-slate-600 mt-2">Good luck with your application.</p>
                    </div>
                </div>
            )}

              <div className="grid gap-4">
                 {activeJobs.map(job => {
                    const isExpanded = expandedJobId === job.id;
                    return (
                      <div key={job.id} className="bg-white rounded-xl shadow-sm border border-slate-100 transition-all group overflow-hidden">
                        <div 
                            className="p-6 cursor-pointer hover:bg-slate-50" 
                            onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                        >
                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-xl font-bold text-slate-800">{job.title}</h3>
                                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-mono">{job.listingReference}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
                                        <span className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-medium">{job.department}</span>
                                        <span className="flex items-center gap-1"><MapPin size={14} />{job.location || 'Remote'}</span>
                                        <span className="flex items-center gap-1"><Banknote size={14} />{formatSalary(job)} ({job.salaryType})</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isExpanded ? <ChevronUp className="text-slate-400"/> : <ChevronDown className="text-slate-400"/>}
                                </div>
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="p-8 border-t border-slate-100 bg-slate-50/30 animate-fadeIn">
                                <div className="max-w-4xl">
                                    
                                    {/* Job Details Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-white p-4 rounded-lg border border-slate-200 text-sm">
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-semibold">Industry</p>
                                            <p className="text-slate-700 font-medium">{job.industry || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-semibold">Listing Reference</p>
                                            <p className="text-slate-700 font-medium">{job.listingReference}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-semibold">Apply By</p>
                                            <p className="text-slate-700 font-medium">{new Date(job.applyBy).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-semibold">Remuneration</p>
                                            <p className="text-slate-700 font-medium">{formatSalary(job)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase font-semibold">Location</p>
                                            <p className="text-slate-700 font-medium">{job.location}</p>
                                        </div>
                                    </div>

                                    <div className="mb-8">
                                        <h4 className="font-bold text-slate-800 mb-3 text-lg flex items-center gap-2">
                                            <FileText size={20} className="text-slate-400"/> Job Description
                                        </h4>
                                        <p className="text-slate-600 leading-relaxed whitespace-pre-line bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                            {job.description}
                                        </p>
                                    </div>

                                    <div className="mb-8">
                                        <h4 className="font-bold text-slate-800 mb-3 text-lg flex items-center gap-2">
                                            <ListChecks size={20} className="text-blue-500"/> Key Responsibilities
                                        </h4>
                                        <ul className="space-y-2 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                            {job.responsibilities.map((r, i) => (
                                                <li key={i} className="flex items-start gap-2 text-slate-700">
                                                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                                    <span>{r}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                        <div>
                                            <h4 className="font-bold text-slate-800 mb-3 text-lg flex items-center gap-2">
                                                <Star size={20} className="text-orange-500"/> Essential Requirements
                                            </h4>
                                            <ul className="space-y-2 bg-white p-6 rounded-lg border border-slate-200 shadow-sm h-full">
                                                {job.requirements.map((r, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-slate-700">
                                                        <CheckCircle size={16} className="text-orange-500 mt-1 shrink-0" />
                                                        <span>{r}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        {job.desirableSkills.length > 0 && (
                                            <div>
                                                <h4 className="font-bold text-slate-800 mb-3 text-lg flex items-center gap-2">
                                                    <Sparkles size={20} className="text-purple-500"/> Desirable Skills
                                                </h4>
                                                <ul className="space-y-2 bg-white p-6 rounded-lg border border-slate-200 shadow-sm h-full">
                                                    {job.desirableSkills.map((r, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-slate-700">
                                                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                                                            <span>{r}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {job.benefits.length > 0 && (
                                        <div className="mb-8">
                                            <h4 className="font-bold text-slate-800 mb-3 text-lg flex items-center gap-2">
                                                <HeartHandshake size={20} className="text-red-500"/> Benefits
                                            </h4>
                                            <div className="flex flex-wrap gap-2 bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                                                {job.benefits.map((b, i) => (
                                                    <span key={i} className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm border border-red-100 font-medium">
                                                        {b}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-200">
                                        <div className="flex gap-3">
                                            <button onClick={() => handleShare('linkedin', job)} className="flex items-center gap-1 bg-[#0077b5] text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-[#006396]">
                                                <Linkedin size={14}/> Share
                                            </button>
                                            <button onClick={() => handleShare('twitter', job)} className="flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-gray-800">
                                                <Twitter size={14}/> Share
                                            </button>
                                            <button onClick={() => handleShare('facebook', job)} className="flex items-center gap-1 bg-[#1877f2] text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-[#166fe5]">
                                                <Facebook size={14}/> Share
                                            </button>
                                        </div>

                                        {candidateUser ? (
                                            <button 
                                                onClick={() => handleApply(job)} 
                                                className="flex items-center gap-2 px-8 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 shadow-lg shadow-orange-500/20"
                                            >
                                                <Sparkles size={18}/> Quick Apply
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-slate-500 italic">Login to apply</span>
                                                <button 
                                                    onClick={() => setActiveTab('login')} 
                                                    className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900"
                                                >
                                                    <LogIn size={16}/> Login / Register
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                      </div>
                    );
                 })}
              </div>
           </>
        )}
      </div>
    </div>
  );
};

export default CandidatePortal;
