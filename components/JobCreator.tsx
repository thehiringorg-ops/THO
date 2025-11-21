
import React, { useState, useEffect } from 'react';
import { Job, User, Client } from '../types';
import { generateJobDescription, GeneratedJobContent } from '../services/geminiService';
import { Sparkles, Save, X, Loader2, MapPin, ListChecks, Briefcase, Building2, Calendar, Hash, Star, HeartHandshake, Info, ShieldAlert, FileEdit, Globe2 } from 'lucide-react';

interface JobCreatorProps {
  onSave: (job: Job) => void;
  onCancel: () => void;
  currentUser?: User | null;
  clients: Client[];
  nextRefNumber: string;
  initialData?: Job | null;
}

// Comprehensive list of countries with dial codes
const COUNTRIES = [
  { name: "South Africa", code: "+27" },
  { name: "United States", code: "+1" },
  { name: "United Kingdom", code: "+44" },
  { name: "Australia", code: "+61" },
  { name: "Germany", code: "+49" },
  { name: "France", code: "+33" },
  { name: "United Arab Emirates", code: "+971" },
  { name: "Saudi Arabia", code: "+966" },
  { name: "Canada", code: "+1" },
  { name: "Ireland", code: "+353" },
  { name: "Netherlands", code: "+31" },
  { name: "Singapore", code: "+65" },
  { name: "New Zealand", code: "+64" },
  { name: "India", code: "+91" },
  { name: "China", code: "+86" },
  { name: "Japan", code: "+81" },
  { name: "Brazil", code: "+55" },
  { name: "Switzerland", code: "+41" },
  { name: "Spain", code: "+34" },
  { name: "Portugal", code: "+351" },
  { name: "Italy", code: "+39" },
  { name: "Sweden", code: "+46" },
  { name: "Norway", code: "+47" },
  { name: "Denmark", code: "+45" },
  { name: "Belgium", code: "+32" },
  { name: "Other", code: "" }
];

const JobCreator: React.FC<JobCreatorProps> = ({ onSave, onCancel, currentUser, clients, nextRefNumber, initialData }) => {
  // Basic Info
  const [title, setTitle] = useState(initialData?.title || '');
  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [department, setDepartment] = useState(initialData?.department || '');
  const [industry, setIndustry] = useState(initialData?.industry || '');
  
  // Location State
  const [isInternational, setIsInternational] = useState(initialData?.isInternational || false);
  const [country, setCountry] = useState(initialData?.country || 'South Africa');
  const [zipCode, setZipCode] = useState(initialData?.zipCode || '');
  const [dialCode, setDialCode] = useState(initialData?.dialCode || '+27');
  
  const [city, setCity] = useState('Johannesburg');
  const [province, setProvince] = useState('Gauteng');

  // Auto-generated reference (read-only)
  const [reference] = useState(initialData?.listingReference || nextRefNumber);
  
  const [applyBy, setApplyBy] = useState(initialData?.applyBy || new Date(Date.now() + 2592000000).toISOString().split('T')[0]); // Default 30 days
  const [level, setLevel] = useState('Mid-Level');
  const [skills, setSkills] = useState('');
  const [jobType, setJobType] = useState<'Full-time' | 'Part-time' | 'Contract' | 'Freelance'>(initialData?.type || 'Full-time');

  // Content Sections
  const [description, setDescription] = useState(initialData?.description || '');
  const [responsibilities, setResponsibilities] = useState(initialData?.responsibilities.map(r => `• ${r}`).join('\n') || '');
  const [requirements, setRequirements] = useState(initialData?.requirements.map(r => `• ${r}`).join('\n') || '');
  const [desirableSkills, setDesirableSkills] = useState(initialData?.desirableSkills.map(r => `• ${r}`).join('\n') || '');
  const [benefits, setBenefits] = useState(initialData?.benefits.map(r => `• ${r}`).join('\n') || '');

  // Remuneration
  const [salaryType, setSalaryType] = useState<'Fixed' | 'Range' | 'Market Related' | 'Negotiable'>(initialData?.salaryType || 'Range');
  const [salaryMin, setSalaryMin] = useState<number>(initialData?.salaryMin || 0);
  const [salaryMax, setSalaryMax] = useState<number>(initialData?.salaryMax || 0);
  const [salaryCurrency, setSalaryCurrency] = useState(initialData?.salaryCurrency || 'ZAR');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTitleTooltip, setShowTitleTooltip] = useState(false);

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';

  // Effect to parse location string back to city/province if editing
  useEffect(() => {
      if (initialData?.location && !initialData.isInternational) {
          const parts = initialData.location.split(',');
          if (parts.length >= 1) setCity(parts[0].trim());
          if (parts.length >= 2) setProvince(parts[1].trim());
      } else if (initialData?.isInternational) {
          // For international, location string might be "City, Country (Zip)"
          // But we primarily rely on stored fields country/zipCode
          if(initialData.location.includes(',')) {
              setCity(initialData.location.split(',')[0].trim());
          }
      }
  }, [initialData]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedName = e.target.value;
      setCountry(selectedName);
      const found = COUNTRIES.find(c => c.name === selectedName);
      if(found) setDialCode(found.code);
  };

  const provinces = [
    "Eastern Cape",
    "Free State",
    "Gauteng",
    "KwaZulu-Natal",
    "Limpopo",
    "Mpumalanga",
    "North West",
    "Northern Cape",
    "Western Cape"
  ];
  
  const currencies = [
      { code: 'ZAR', symbol: 'R' },
      { code: 'USD', symbol: '$' },
      { code: 'EUR', symbol: '€' },
      { code: 'GBP', symbol: '£' },
      { code: 'AUD', symbol: 'A$' },
      { code: 'AED', symbol: 'AED' }
  ];

  const handleGenerate = async () => {
    if (!title || !skills) return;
    
    setIsGenerating(true);
    let fullLocation = '';
    if (isInternational) {
        fullLocation = `${city}, ${country}`;
    } else {
        fullLocation = `${city}, ${province}, South Africa`;
    }
    
    try {
      const content: GeneratedJobContent = await generateJobDescription(title, department, industry, fullLocation, skills, level);
      
      setDescription(content.description);
      setResponsibilities(content.responsibilities.map(r => `• ${r}`).join('\n'));
      setRequirements(content.requirements.map(r => `• ${r}`).join('\n'));
      setDesirableSkills(content.desirableSkills.map(r => `• ${r}`).join('\n'));
      setBenefits(content.benefits.map(r => `• ${r}`).join('\n'));
      
    } catch (error) {
      alert('Failed to generate description. Please check your API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const createJobObject = (status: 'Draft' | 'Active' | 'Pending Approval'): Job => {
     let fullLocation = '';
     if(isInternational) {
         fullLocation = `${city}, ${country}`;
     } else {
         fullLocation = `${city}, ${province}`;
     }
     
     // If initialData exists, we preserve its ID and basic meta-data
     // If not, we create new ID
     return {
      id: initialData?.id || crypto.randomUUID(),
      title,
      clientId,
      department,
      industry,
      location: fullLocation,
      
      // International Fields
      isInternational,
      country: isInternational ? country : 'South Africa',
      zipCode: isInternational ? zipCode : '',
      dialCode: isInternational ? dialCode : '+27',

      description,
      responsibilities: responsibilities.split('\n').filter(r => r.trim() !== '').map(r => r.replace(/^[•\-\*]\s*/, '').trim()),
      requirements: requirements.split('\n').filter(r => r.trim() !== '').map(r => r.replace(/^[•\-\*]\s*/, '').trim()),
      desirableSkills: desirableSkills.split('\n').filter(r => r.trim() !== '').map(r => r.replace(/^[•\-\*]\s*/, '').trim()),
      benefits: benefits.split('\n').filter(r => r.trim() !== '').map(r => r.replace(/^[•\-\*]\s*/, '').trim()),
      
      listingReference: reference,
      applyBy,
      
      status: initialData ? (status === 'Draft' ? 'Draft' : status) : status,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      type: jobType,
      
      salaryType,
      salaryMin: (salaryType === 'Fixed' || salaryType === 'Range') ? salaryMin : undefined,
      salaryMax: (salaryType === 'Range') ? salaryMax : undefined,
      salaryCurrency,
      
      postedBy: initialData?.postedBy || currentUser?.id || 'unknown',
      recruiterName: initialData?.recruiterName || currentUser?.name || 'Admin',
      recruiterAvatar: initialData?.recruiterAvatar || currentUser?.avatar || 'https://ui-avatars.com/api/?name=Admin'
    };
  };

  const handleSave = () => {
    if (!title || !description) return;
    // If editing, permissions are handled in App.tsx
    // If creating, basic check
    const status = isAdmin ? 'Active' : 'Pending Approval';
    onSave(createJobObject(status));
  };

  const handleDraft = () => {
    if (!title) {
        alert("Please provide at least a title to save a draft.");
        return;
    }
    onSave(createJobObject('Draft'));
  };

  const listPlaceholder = (text: string) => `• ${text} 1\n• ${text} 2\n• ${text} 3`;

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800">
                {initialData ? 'Edit Job Listing' : 'Create Job Listing'}
            </h2>
            {currentUser && (
              <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200">
                By {currentUser.name}
              </span>
            )}
          </div>
          <p className="text-slate-500 mt-1">{initialData ? 'Update job specification details.' : 'Create a comprehensive job specification.'}</p>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
          <X size={24} />
        </button>
      </div>

      {!isAdmin && (
         <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
            <ShieldAlert size={18} />
            <span>
                <strong>Note:</strong> {initialData ? 'Editing this job will submit it for re-approval by a Super User.' : 'Since you are not an Admin, this job post will require approval from a Super User before going live.'}
            </span>
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="font-semibold text-slate-700 mb-4">Basic Information</h3>
            
            {/* Listing Type Toggle */}
            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg mb-2">
                <button 
                    onClick={() => setIsInternational(false)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${!isInternational ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                >
                    <MapPin size={12}/> Local (SA)
                </button>
                <button 
                    onClick={() => setIsInternational(true)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${isInternational ? 'bg-white shadow text-orange-600' : 'text-slate-500'}`}
                >
                    <Globe2 size={12}/> International
                </button>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                 <label className="block text-xs font-medium text-slate-500">Job Title</label>
                 <div className="relative">
                    <Info 
                      size={14} 
                      className="text-slate-400 cursor-help hover:text-orange-500"
                      onMouseEnter={() => setShowTitleTooltip(true)}
                      onMouseLeave={() => setShowTitleTooltip(false)}
                    />
                    {showTitleTooltip && (
                      <div className="absolute left-6 bottom-0 w-48 bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg z-50">
                        This is the main title of the position being advertised. Make it clear and standard.
                      </div>
                    )}
                 </div>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior React Engineer"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Client / Portfolio</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-sm"
              >
                <option value="">-- Select Client --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Reference No.</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  value={reference}
                  readOnly
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 font-mono text-sm cursor-not-allowed"
                  title="Auto-generated sequential reference"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">Department</label>
                 <input 
                   type="text"
                   value={department}
                   onChange={(e) => setDepartment(e.target.value)}
                   placeholder="e.g. IT"
                   className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                 />
               </div>
               <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">Industry</label>
                 <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g. Fintech"
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                 </div>
               </div>
            </div>

            {/* Location Group - Dynamic based on International Toggle */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <label className="block text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                  {isInternational ? <Globe2 size={12}/> : <MapPin size={12}/>}
                  {isInternational ? 'International Location' : 'South Africa Location'}
              </label>
              
              {isInternational ? (
                <div className="space-y-2">
                    <div>
                        <select 
                            value={country}
                            onChange={handleCountryChange}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-sm"
                        >
                            {COUNTRIES.map(c => (
                                <option key={c.name} value={c.name}>{c.name} ({c.code})</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                         <input
                           type="text"
                           value={city}
                           onChange={(e) => setCity(e.target.value)}
                           placeholder="City"
                           className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                         />
                         <input
                           type="text"
                           value={zipCode}
                           onChange={(e) => setZipCode(e.target.value)}
                           placeholder="Zip Code"
                           className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                         />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                        <span>Format: {dialCode} (Phone Suffix)</span>
                    </div>
                </div>
              ) : (
                  <div className="space-y-2">
                     <div className="relative">
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City (e.g. Sandton)"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                        />
                     </div>
                     <select 
                       value={province}
                       onChange={(e) => setProvince(e.target.value)}
                       className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-sm"
                     >
                       {provinces.map(p => (
                         <option key={p} value={p}>{p}</option>
                       ))}
                     </select>
                  </div>
              )}
            </div>

             <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Job Type</label>
                  <select 
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-sm"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Apply By</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="date"
                      value={applyBy}
                      onChange={(e) => setApplyBy(e.target.value)}
                      className="w-full pl-9 pr-2 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                    />
                  </div>
                </div>
             </div>

            <div className="pt-4 border-t border-slate-100">
               <h3 className="font-semibold text-slate-700 mb-3 text-sm">Remuneration</h3>
               
               <div className="flex gap-2 mb-3">
                  <div className="w-1/3">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Currency</label>
                      <select 
                         value={salaryCurrency}
                         onChange={(e) => setSalaryCurrency(e.target.value)}
                         className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-sm"
                      >
                         {currencies.map(c => (
                             <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                         ))}
                      </select>
                  </div>
                  <div className="w-2/3">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Structure</label>
                      <select 
                          value={salaryType}
                          onChange={(e) => setSalaryType(e.target.value as any)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-sm"
                       >
                          <option value="Range">Salary Range</option>
                          <option value="Fixed">Fixed Amount</option>
                          <option value="Market Related">Market Related</option>
                          <option value="Negotiable">Negotiable</option>
                       </select>
                   </div>
               </div>

               {(salaryType === 'Range' || salaryType === 'Fixed') && (
                 <div className="grid grid-cols-2 gap-2">
                   <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                        {currencies.find(c => c.code === salaryCurrency)?.symbol}
                     </span>
                     <input
                        type="number"
                        value={salaryMin || ''}
                        onChange={(e) => setSalaryMin(parseInt(e.target.value))}
                        placeholder={salaryType === 'Fixed' ? 'Amount' : 'Min'}
                        className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                     />
                   </div>
                   {salaryType === 'Range' && (
                     <div className="relative">
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                           {currencies.find(c => c.code === salaryCurrency)?.symbol}
                       </span>
                       <input
                          type="number"
                          value={salaryMax || ''}
                          onChange={(e) => setSalaryMax(parseInt(e.target.value))}
                          placeholder="Max"
                          className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                       />
                     </div>
                   )}
                 </div>
               )}
            </div>

            <div className="pt-4 border-t border-slate-100 bg-orange-50 -mx-6 -mb-6 p-6 rounded-b-xl">
              <label className="block text-sm font-semibold text-orange-800 mb-2">AI Generation Setup</label>
              <p className="text-xs text-orange-600 mb-3">Enter skills and seniority level to help AI draft the specification.</p>
              
              <div className="mb-3">
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Skills: e.g. React, Node.js, Team Lead"
                  className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white"
                />
              </div>
              
              <select 
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-sm mb-4"
              >
                <option value="Entry Level">Entry Level</option>
                <option value="Mid-Level">Mid-Level</option>
                <option value="Senior">Senior</option>
                <option value="Lead/Principal">Lead/Principal</option>
                <option value="Executive">Executive</option>
              </select>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !title || !skills}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-white transition-all text-sm ${
                  isGenerating || !title || !skills
                    ? 'bg-orange-300 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 shadow-md'
                }`}
              >
                {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                {isGenerating ? 'Drafting Spec...' : 'Generate Specification'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* ... Same as before ... */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                <Briefcase size={16} className="text-blue-500" /> Job Description & Role Overview
              </h3>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a compelling overview of the role..."
              className="w-full h-48 p-4 bg-white border-none rounded-b-xl focus:ring-0 outline-none text-sm leading-relaxed resize-none"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                <ListChecks size={16} className="text-green-600" /> Key Responsibilities
              </h3>
            </div>
            <textarea
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              placeholder={listPlaceholder("Responsibility")}
              className="w-full h-40 p-4 bg-white border-none rounded-b-xl focus:ring-0 outline-none text-sm leading-relaxed resize-none font-mono"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
               <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                 <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                   <Star size={16} className="text-orange-500" /> Essential Requirements
                 </h3>
               </div>
               <textarea
                 value={requirements}
                 onChange={(e) => setRequirements(e.target.value)}
                 placeholder={listPlaceholder("Requirement")}
                 className="w-full h-40 p-4 bg-white border-none rounded-b-xl focus:ring-0 outline-none text-sm leading-relaxed resize-none font-mono"
               />
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
               <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                 <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                   <Sparkles size={16} className="text-purple-500" /> Desirable / Nice to Have
                 </h3>
               </div>
               <textarea
                 value={desirableSkills}
                 onChange={(e) => setDesirableSkills(e.target.value)}
                 placeholder={listPlaceholder("Bonus Skill")}
                 className="w-full h-40 p-4 bg-white border-none rounded-b-xl focus:ring-0 outline-none text-sm leading-relaxed resize-none font-mono"
               />
             </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                <HeartHandshake size={16} className="text-red-500" /> Benefits & Perks
              </h3>
            </div>
            <textarea
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              placeholder={listPlaceholder("Benefit")}
              className="w-full h-32 p-4 bg-white border-none rounded-b-xl focus:ring-0 outline-none text-sm leading-relaxed resize-none font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
             <button 
              onClick={onCancel}
              className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
             
             {!initialData && (
                 <button 
                   onClick={handleDraft}
                   className="flex items-center gap-2 px-6 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 shadow-sm transition-all"
                 >
                   <FileEdit size={18} />
                   Save Draft
                 </button>
             )}

            <button 
              onClick={handleSave}
              disabled={!description || !title}
              className="flex items-center gap-2 px-8 py-3 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 shadow-lg shadow-slate-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {isAdmin ? (initialData ? 'Update & Publish' : 'Publish Listing') : (initialData ? 'Submit Changes' : 'Submit for Approval')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobCreator;
