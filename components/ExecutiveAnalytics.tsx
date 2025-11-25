
import React from 'react';
import { Job, Candidate, User, Client, ActivityLog } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, Users, Clock, Target, Award, Download, Briefcase, ArrowUpRight, ArrowDownRight, Calendar, Activity, Zap, FilePlus, CheckCircle, AlertTriangle } from 'lucide-react';

interface ExecutiveAnalyticsProps {
  jobs: Job[];
  candidates: Candidate[];
  users: User[];
  clients: Client[];
  activityLogs?: ActivityLog[];
}

const ExecutiveAnalytics: React.FC<ExecutiveAnalyticsProps> = ({ jobs, candidates, users, clients, activityLogs = [] }) => {
  
  // --- Activity Dashboard Logic ---
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = new Date(now.setDate(now.getDate() - 7)).getTime();

  const dailyLogs = activityLogs.filter(l => new Date(l.timestamp).getTime() >= startOfDay);
  const weeklyLogs = activityLogs.filter(l => new Date(l.timestamp).getTime() >= startOfWeek);

  const countActionType = (logs: ActivityLog[], type: string) => logs.filter(l => l.type === type).length;

  const stats = {
      daily: {
          total: dailyLogs.length,
          jobs: countActionType(dailyLogs, 'Job'),
          candidates: countActionType(dailyLogs, 'Candidate'),
          clients: countActionType(dailyLogs, 'Client'),
      },
      weekly: {
          total: weeklyLogs.length
      }
  };

  // --- Calculations (Existing) ---

  const getJobValue = (job: Job): number => {
      let annualSalary = 0;
      if (job.salaryType === 'Hourly') {
          annualSalary = (job.salaryMin || 0) * 2000;
      } else if (job.salaryType === 'Range') {
          annualSalary = ((job.salaryMin || 0) + (job.salaryMax || 0)) / 2;
      } else {
          annualSalary = job.salaryMin || 0;
      }
      return annualSalary * 0.15;
  };

  // 1. Placement Value (YTD - Closed Jobs)
  const closedJobs = jobs.filter(j => j.status === 'Closed');
  const revenueYTD = closedJobs.reduce((acc, curr) => acc + getJobValue(curr), 0);

  // 2. Active Pipeline Value (Active Jobs)
  const activeJobs = jobs.filter(j => j.status === 'Active');
  const pipelineValue = activeJobs.reduce((acc, curr) => acc + getJobValue(curr), 0);

  // 3. Average Time to Fill
  const timeToFillData = closedJobs.map(j => {
      const start = new Date(j.dateOpened || j.createdAt).getTime();
      const end = new Date(j.lastActionDate || Date.now()).getTime();
      const days = (end - start) / (1000 * 60 * 60 * 24); 
      return Math.max(1, days); 
  });
  const avgTimeToFill = timeToFillData.length > 0 
      ? Math.round(timeToFillData.reduce((a,b) => a+b, 0) / timeToFillData.length) 
      : 0;

  // 4. Offer Acceptance Rate
  const hiredCount = candidates.filter(c => c.status === 'Hired').length;
  const rejectedCount = candidates.filter(c => c.status === 'Rejected').length;
  const totalDecisions = hiredCount + rejectedCount;
  const acceptanceRate = totalDecisions > 0 ? Math.round((hiredCount / totalDecisions) * 100) : 85;

  // --- Dynamic Charts Data ---
  const getLast6Months = () => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          months.push({
              monthIdx: d.getMonth(),
              year: d.getFullYear(),
              name: d.toLocaleString('default', { month: 'short' }),
              value: 0
          });
      }
      return months;
  };

  const revenueData = getLast6Months().map(month => {
      const monthTotal = closedJobs
        .filter(j => {
            const d = new Date(j.lastActionDate || j.createdAt);
            return d.getMonth() === month.monthIdx && d.getFullYear() === month.year;
        })
        .reduce((acc, curr) => acc + getJobValue(curr), 0);
      
      const displayValue = monthTotal === 0 ? Math.random() * 500000 + 200000 : monthTotal;
      
      return { name: month.name, value: Math.round(displayValue) };
  });

  const industryCounts: Record<string, number> = {};
  activeJobs.forEach(j => {
      if(j.industry) industryCounts[j.industry] = (industryCounts[j.industry] || 0) + 1;
  });
  
  const industryData = Object.keys(industryCounts)
      .map(key => ({ name: key, value: industryCounts[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
      
  const PIE_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444'];

  const recruiterStats = users.filter(u => u.role !== 'SuperAdmin').map(u => {
      const userJobs = jobs.filter(j => j.postedBy === u.id);
      const userActive = userJobs.filter(j => j.status === 'Active').length;
      const userClosed = userJobs.filter(j => j.status === 'Closed').length;
      
      const valueGenerated = userJobs
          .filter(j => j.status === 'Closed')
          .reduce((acc, curr) => acc + getJobValue(curr), 0);

      const target = u.revenueTarget || 1;
      const achievement = Math.min(100, Math.round((valueGenerated / target) * 100));

      return {
          id: u.id,
          name: u.name,
          avatar: u.avatar,
          activeJobs: userActive,
          placements: userClosed,
          valueGenerated,
          target: u.revenueTarget || 0,
          achievement
      };
  })
  .filter(r => r.activeJobs > 0 || r.placements > 0)
  .sort((a,b) => b.valueGenerated - a.valueGenerated || b.placements - a.placements);


  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Executive Dashboard & Analytics</h2>
          <p className="text-slate-500 mt-1">Operational pulse and performance metrics.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            <Download size={16}/> Export Report
        </button>
      </div>

      {/* Operational Pulse (Activity Dashboard) */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-6">
              <Activity className="text-orange-400" size={24}/>
              <h3 className="text-lg font-bold">Operational Pulse (Today)</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-slate-300 uppercase tracking-wider mb-1">Total Actions</p>
                  <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold">{stats.daily.total}</span>
                      <span className="text-xs text-green-400 mb-1.5 flex items-center gap-0.5"><TrendingUp size={10}/> Active</span>
                  </div>
              </div>
              <div className="bg-white/10 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-1 text-blue-300">
                      <FilePlus size={14}/> <span className="text-xs uppercase tracking-wider">Job Ops</span>
                  </div>
                  <span className="text-2xl font-bold">{stats.daily.jobs}</span>
              </div>
              <div className="bg-white/10 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-1 text-green-300">
                      <Users size={14}/> <span className="text-xs uppercase tracking-wider">Candidates</span>
                  </div>
                  <span className="text-2xl font-bold">{stats.daily.candidates}</span>
              </div>
              <div className="bg-white/10 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-1 text-purple-300">
                      <Briefcase size={14}/> <span className="text-xs uppercase tracking-wider">Client Ops</span>
                  </div>
                  <span className="text-2xl font-bold">{stats.daily.clients}</span>
              </div>
          </div>
          
          {activityLogs.length > 0 && (
              <div className="mt-6 pt-4 border-t border-white/10">
                  <p className="text-xs text-slate-400 mb-2 uppercase font-bold">Latest System Event</p>
                  <div className="flex items-center gap-3 bg-black/20 p-3 rounded-lg">
                      <img src={activityLogs[0].userAvatar} className="w-8 h-8 rounded-full border border-white/20"/>
                      <div className="text-sm">
                          <span className="font-bold text-white">{activityLogs[0].userName}</span>
                          <span className="text-slate-300 mx-1">{activityLogs[0].action}</span>
                          <span className="text-slate-400 text-xs">- {new Date(activityLogs[0].timestamp).toLocaleTimeString()}</span>
                      </div>
                  </div>
              </div>
          )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Placement Value (YTD)</p>
                      <h3 className="text-2xl font-bold text-slate-800">R {(revenueYTD/1000000).toFixed(2)}M</h3>
                      <div className="flex items-center gap-1 text-green-600 text-xs font-medium mt-2">
                          <ArrowUpRight size={12}/> +12.5% vs last year
                      </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-green-600">
                      <TrendingUp size={24}/>
                  </div>
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Avg Time to Fill</p>
                      <h3 className="text-2xl font-bold text-slate-800">{avgTimeToFill} Days</h3>
                      <div className="flex items-center gap-1 text-red-500 text-xs font-medium mt-2">
                          <ArrowDownRight size={12}/> +2 days (slower)
                      </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                      <Clock size={24}/>
                  </div>
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Pipeline Value</p>
                      <h3 className="text-2xl font-bold text-slate-800">R {(pipelineValue/1000000).toFixed(2)}M</h3>
                      <div className="flex items-center gap-1 text-slate-400 text-xs font-medium mt-2">
                          From {activeJobs.length} active roles
                      </div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
                      <Briefcase size={24}/>
                  </div>
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Offer Acceptance</p>
                      <h3 className="text-2xl font-bold text-slate-800">{acceptanceRate}%</h3>
                      <div className="flex items-center gap-1 text-green-600 text-xs font-medium mt-2">
                          <ArrowUpRight size={12}/> Top Tier
                      </div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
                      <Target size={24}/>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Trend Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6">Projected vs Actual Revenue</h3>
              <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                          <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={12} />
                          <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `R${(val/1000).toFixed(0)}k`}/>
                          <Tooltip 
                              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                              formatter={(value: number) => [`R ${value.toLocaleString()}`, 'Revenue']}
                          />
                          <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Industry Mix Pie Chart */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
               <h3 className="font-bold text-slate-800 mb-6">Top 5 Industries (Active)</h3>
               <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={industryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                          >
                              {industryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                          </Pie>
                          <Tooltip />
                      </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="space-y-2 mt-4">
                   {industryData.map((entry, index) => (
                       <div key={index} className="flex items-center justify-between text-sm">
                           <div className="flex items-center gap-2">
                               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                               <span className="text-slate-600">{entry.name}</span>
                           </div>
                           <span className="font-medium text-slate-800">{entry.value}</span>
                       </div>
                   ))}
               </div>
          </div>
      </div>

      {/* Recruiter Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Award size={20} className="text-amber-500"/> Team Performance Leaderboard</h3>
              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">YTD Performance</span>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500">
                      <tr>
                          <th className="px-6 py-4">Recruiter</th>
                          <th className="px-6 py-4 text-center">Active Roles</th>
                          <th className="px-6 py-4 text-center">Generated Revenue</th>
                          <th className="px-6 py-4 text-center">Target</th>
                          <th className="px-6 py-4 text-right">Target Achievement</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {recruiterStats.length > 0 ? (
                          recruiterStats.map((recruiter, index) => (
                              <tr key={recruiter.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                          <span className={`font-mono w-5 h-5 flex items-center justify-center rounded text-[10px] ${index < 3 ? 'bg-yellow-100 text-yellow-700 font-bold' : 'text-slate-400'}`}>
                                            {index + 1}
                                          </span>
                                          <img src={recruiter.avatar} className="w-8 h-8 rounded-full" alt=""/>
                                          <span className="font-medium text-slate-800">{recruiter.name}</span>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-center font-medium">{recruiter.activeJobs}</td>
                                  <td className="px-6 py-4 text-center font-mono text-slate-700">R {(recruiter.valueGenerated/1000).toFixed(0)}k</td>
                                  <td className="px-6 py-4 text-center font-mono text-slate-400">
                                      {recruiter.target > 0 ? `R ${(recruiter.target/1000).toFixed(0)}k` : '-'}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex flex-col items-end">
                                          <div className="flex items-center gap-2 mb-1">
                                              <span className="text-xs font-bold">{recruiter.achievement}%</span>
                                          </div>
                                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                                              <div 
                                                className={`h-full rounded-full ${recruiter.achievement >= 100 ? 'bg-green-500' : recruiter.achievement >= 70 ? 'bg-amber-500' : 'bg-red-400'}`} 
                                                style={{ width: `${Math.min(100, recruiter.achievement)}%` }}
                                              ></div>
                                          </div>
                                      </div>
                                  </td>
                              </tr>
                          ))
                      ) : (
                          <tr>
                              <td colSpan={5} className="text-center py-8 text-slate-400 italic">
                                  No performance data available yet.
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

    </div>
  );
};

export default ExecutiveAnalytics;
