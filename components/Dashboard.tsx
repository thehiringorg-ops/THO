
import React, { useState } from 'react';
import { Job, Candidate } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Briefcase, FileText, TrendingUp, ExternalLink, Calendar, MapPin, Hash } from 'lucide-react';

interface DashboardProps {
  jobs: Job[];
  candidates: Candidate[];
  onViewJobs?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ jobs, candidates, onViewJobs }) => {
  const [hoveredJob, setHoveredJob] = useState<Job | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{x: number, y: number} | null>(null);

  const activeJobs = jobs.filter(j => j.status === 'Active').length;
  const totalCandidates = candidates.length;
  const screenedCandidates = candidates.filter(c => c.status !== 'New').length;
  
  const avgScore = candidates.reduce((acc, curr) => acc + (curr.screeningResult?.matchScore || 0), 0) / (screenedCandidates || 1);

  const data = jobs.map(job => ({
    name: job.title.split(' ')[0], // Shorten for chart
    applicants: candidates.filter(c => c.role === job.id).length
  }));

  const statusData = [
    { name: 'New', value: candidates.filter(c => c.status === 'New').length },
    { name: 'Screened', value: candidates.filter(c => c.status === 'Screened').length },
    { name: 'Interview', value: candidates.filter(c => c.status === 'Interview').length },
    { name: 'Hired', value: candidates.filter(c => c.status === 'Hired').length },
  ];

  const COLORS = ['#94a3b8', '#60a5fa', '#f97316', '#22c55e'];

  // Sort jobs by creation date (newest first) and take top 5
  const recentJobs = [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
        <span className="text-sm text-slate-500">Last updated: Just now</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Active Jobs</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{activeJobs}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Briefcase size={24} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Candidates</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{totalCandidates}</h3>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">AI Screened</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{screenedCandidates}</h3>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg text-orange-500">
              <FileText size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Avg. Match Score</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{Math.round(avgScore)}%</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Applicants per Job</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="applicants" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Candidate Pipeline Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {statusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-xs text-slate-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Job Postings History */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Calendar size={20} className="text-slate-400" /> Recent Job Postings
          </h3>
          {onViewJobs && (
             <button onClick={onViewJobs} className="text-sm text-orange-500 font-medium hover:text-orange-600 transition-colors">
               View All Jobs
             </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Job Title</th>
                <th className="px-6 py-4 font-semibold">Recruiter</th>
                <th className="px-6 py-4 font-semibold">Department</th>
                <th className="px-6 py-4 font-semibold">Reference</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors group relative">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      <span 
                        className="cursor-pointer hover:text-orange-500 border-b border-dashed border-slate-300 hover:border-orange-500 transition-all pb-0.5"
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltipPos({ x: rect.left, y: rect.bottom + 5 });
                          setHoveredJob(job);
                        }}
                        onMouseLeave={() => {
                          setHoveredJob(null);
                          setTooltipPos(null);
                        }}
                      >
                        {job.title}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {job.recruiterAvatar && (
                          <img src={job.recruiterAvatar} alt="" className="w-5 h-5 rounded-full" />
                        )}
                        <span className="text-xs text-slate-500">{job.recruiterName || 'Admin'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{job.department}</td>
                    <td className="px-6 py-4 font-mono text-xs">{job.listingReference}</td>
                    <td className="px-6 py-4">
                       <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              job.status === 'Active' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                          {job.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                        onClick={onViewJobs} 
                        className="text-slate-400 hover:text-orange-500 transition-colors group-hover:text-orange-500"
                        title="View Details"
                       >
                         <ExternalLink size={18} />
                       </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 italic">
                    No jobs posted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Job Details Tooltip */}
      {hoveredJob && tooltipPos && (
        <div 
          className="fixed z-[100] bg-white p-5 rounded-xl shadow-xl border border-slate-200 w-96 pointer-events-none animate-fadeIn"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">{hoveredJob.title}</h4>
              <div className="flex gap-3 mt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Briefcase size={12}/> {hoveredJob.department}</span>
                {hoveredJob.location && <span className="flex items-center gap-1"><MapPin size={12}/> {hoveredJob.location}</span>}
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                hoveredJob.status === 'Active' 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
              {hoveredJob.status}
            </span>
          </div>
          
          <div className="space-y-3 border-t border-slate-100 pt-3">
             <div className="flex items-center gap-2 mb-2">
                <img src={hoveredJob.recruiterAvatar || 'https://ui-avatars.com/api/?name=Admin'} className="w-6 h-6 rounded-full border border-slate-100"/>
                <span className="text-[10px] text-slate-500">Posted by <span className="font-medium text-slate-700">{hoveredJob.recruiterName}</span></span>
             </div>
             <div>
               <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Overview</p>
               <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{hoveredJob.description}</p>
             </div>
             
             {hoveredJob.requirements && hoveredJob.requirements.length > 0 && (
               <div>
                 <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Key Requirements</p>
                 <ul className="space-y-1">
                   {hoveredJob.requirements.slice(0, 3).map((req, i) => (
                     <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                       <span className="mt-1 w-1 h-1 rounded-full bg-orange-400 flex-shrink-0" />
                       <span className="line-clamp-1">{req.replace(/^[•\-\*]\s*/, '')}</span>
                     </li>
                   ))}
                   {hoveredJob.requirements.length > 3 && (
                      <li className="text-[10px] text-slate-400 italic pl-2.5">+{hoveredJob.requirements.length - 3} more...</li>
                   )}
                 </ul>
               </div>
             )}
             
             <div className="pt-2 border-t border-slate-50 flex justify-between items-center">
                <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 flex items-center gap-1">
                   <Hash size={10}/> {hoveredJob.listingReference}
                </span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
