
import React, { useState } from 'react';
import { CommissionRecord, User } from '../types';
import { Search, Filter, ChevronDown, ChevronUp, Download, DollarSign, Calendar, CheckCircle, Clock, Briefcase, Building2, User as UserIcon, Percent } from 'lucide-react';

interface CommissionsProps {
  records: CommissionRecord[];
  users: User[];
  currentUser: User | null;
}

const Commissions: React.FC<CommissionsProps> = ({ records, users, currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(records.length > 0 ? records[0].month : null);
  const [expandedRecruiters, setExpandedRecruiters] = useState<Record<string, boolean>>({});

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';

  // Filter records based on permissions first
  const accessibleRecords = isAdmin 
      ? records 
      : records.filter(r => r.recipientId === currentUser?.id);

  // Get Unique Months
  const months = Array.from(new Set(accessibleRecords.map(r => r.month))).sort((a: string, b: string) => {
      return new Date(b).getTime() - new Date(a).getTime();
  });

  const filteredRecords = accessibleRecords.filter(r => {
      const matchesSearch = r.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            r.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            r.candidateName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMonth = selectedMonth ? r.month === selectedMonth : true;
      return matchesSearch && matchesMonth;
  });

  // Group by Recruiter
  const groupedByRecruiter: Record<string, CommissionRecord[]> = {};
  filteredRecords.forEach(r => {
      if (!groupedByRecruiter[r.recipientId]) {
          groupedByRecruiter[r.recipientId] = [];
      }
      groupedByRecruiter[r.recipientId].push(r);
  });

  const toggleRecruiter = (recruiterId: string) => {
      setExpandedRecruiters(prev => ({
          ...prev,
          [recruiterId]: !prev[recruiterId]
      }));
  };

  const totalCommissionForMonth = filteredRecords.reduce((sum, r) => sum + r.amount, 0);
  const pendingCommissionForMonth = filteredRecords.filter(r => r.status === 'Pending').reduce((sum, r) => sum + r.amount, 0);
  const paidCommissionForMonth = filteredRecords.filter(r => r.status === 'Paid').reduce((sum, r) => sum + r.amount, 0);

  const exportCSV = () => {
      const header = "Period,Recruiter,Client,Job,Candidate,Deal Value,Comm %,Commission Amount,Status,Date\n";
      const rows = filteredRecords.map(r => 
          `"${r.month}","${r.recipientName}","${r.clientName}","${r.jobTitle}","${r.candidateName}",${r.placementValue},${r.commissionRate},${r.amount},${r.status},${r.date}`
      ).join("\n");

      const blob = new Blob([header + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Commissions_Export_${selectedMonth?.replace(' ', '_')}.csv`;
      a.click();
  };

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Commission Management</h2>
          <p className="text-slate-500 mt-1">
              {isAdmin ? 'Track placement commissions across the organization.' : 'View your personal commission history.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
            <div className="relative">
                <select 
                    value={selectedMonth || ''} 
                    onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        setExpandedRecruiters({}); // Reset expansions on month change
                    }}
                    className="appearance-none bg-white border border-slate-200 text-slate-700 py-2 pl-4 pr-10 rounded-lg font-medium shadow-sm focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
                >
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/>
            </div>
            <button 
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm font-medium"
            >
                <Download size={16}/> Export Report
            </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                          {isAdmin ? `Total Commission (${selectedMonth})` : 'Your Total Commission'}
                      </p>
                      <h3 className="text-3xl font-bold text-slate-800">R {totalCommissionForMonth.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-slate-100 rounded-lg text-slate-600">
                      <DollarSign size={24}/>
                  </div>
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Paid Out</p>
                      <h3 className="text-3xl font-bold text-green-600">R {paidCommissionForMonth.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-green-600">
                      <CheckCircle size={24}/>
                  </div>
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
               <div className="flex justify-between items-start">
                  <div>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Pending Approval</p>
                      <h3 className="text-3xl font-bold text-orange-600">R {pendingCommissionForMonth.toLocaleString()}</h3>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
                      <Clock size={24}/>
                  </div>
              </div>
          </div>
      </div>

      {/* Grouped List */}
      <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-100 p-4 rounded-lg mb-4">
               <div className="flex items-center gap-2 text-slate-600">
                   <Filter size={18}/> <span>Filters:</span>
                   <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                        <input 
                            type="text" 
                            placeholder="Search recruiter, client..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-md outline-none focus:border-orange-500"
                        />
                   </div>
               </div>
               <span className="text-sm text-slate-500 italic">Showing accumulation for <strong>{selectedMonth}</strong></span>
          </div>

          {Object.keys(groupedByRecruiter).length > 0 ? (
              Object.keys(groupedByRecruiter).map(recruiterId => {
                  const recruiterComms = groupedByRecruiter[recruiterId];
                  const recruiterTotal = recruiterComms.reduce((sum, r) => sum + r.amount, 0);
                  const recruiterName = recruiterComms[0].recipientName;
                  const isExpanded = expandedRecruiters[recruiterId] || (!isAdmin); // Auto expand if single user view

                  return (
                      <div key={recruiterId} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                          <div 
                            className={`p-5 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                            onClick={() => isAdmin && toggleRecruiter(recruiterId)}
                          >
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                                      {recruiterName.charAt(0)}
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-slate-800 text-lg">{recruiterName}</h3>
                                      <p className="text-xs text-slate-500">{recruiterComms.length} deals closed</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-6">
                                  <div className="text-right">
                                      <p className="text-xs text-slate-400 uppercase tracking-wider">Accumulated Total</p>
                                      <p className="text-xl font-bold text-slate-800">R {recruiterTotal.toLocaleString()}</p>
                                  </div>
                                  {isAdmin && (isExpanded ? <ChevronUp size={24} className="text-slate-400"/> : <ChevronDown size={24} className="text-slate-400"/>)}
                              </div>
                          </div>

                          {isExpanded && (
                              <div className="border-t border-slate-100 animate-fadeIn">
                                  <div className="overflow-x-auto">
                                      <table className="w-full text-left text-sm text-slate-600">
                                          <thead className="bg-slate-50/50 text-xs uppercase font-medium text-slate-500">
                                              <tr>
                                                  <th className="px-6 py-4">Placement Date</th>
                                                  <th className="px-6 py-4">Client / Job</th>
                                                  <th className="px-6 py-4">Candidate</th>
                                                  <th className="px-6 py-4 text-right">Deal Value (Fee)</th>
                                                  <th className="px-6 py-4 text-center">Split %</th>
                                                  <th className="px-6 py-4 text-right">Commission</th>
                                                  <th className="px-6 py-4 text-center">Status</th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                              {recruiterComms.map(comm => (
                                                  <tr key={comm.id} className="hover:bg-slate-50/80">
                                                      <td className="px-6 py-4 font-mono text-xs">
                                                          {new Date(comm.date).toLocaleDateString()}
                                                      </td>
                                                      <td className="px-6 py-4">
                                                          <div className="font-medium text-slate-800">{comm.clientName}</div>
                                                          <div className="text-xs text-slate-500 flex items-center gap-1"><Briefcase size={10}/> {comm.jobTitle}</div>
                                                      </td>
                                                      <td className="px-6 py-4">
                                                          <div className="flex items-center gap-2">
                                                              <UserIcon size={14} className="text-slate-400"/>
                                                              <span>{comm.candidateName}</span>
                                                          </div>
                                                      </td>
                                                      <td className="px-6 py-4 text-right font-medium text-slate-500">
                                                          R {comm.placementValue.toLocaleString()}
                                                      </td>
                                                      <td className="px-6 py-4 text-center">
                                                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs font-medium">
                                                              <Percent size={10}/> {comm.commissionRate}%
                                                          </span>
                                                      </td>
                                                      <td className="px-6 py-4 text-right font-bold text-slate-800">
                                                          R {comm.amount.toLocaleString()}
                                                      </td>
                                                      <td className="px-6 py-4 text-center">
                                                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                              comm.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-100' :
                                                              comm.status === 'Processing' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                              'bg-orange-50 text-orange-700 border-orange-100'
                                                          }`}>
                                                              {comm.status}
                                                          </span>
                                                      </td>
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                          )}
                      </div>
                  );
              })
          ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
                  <DollarSign size={48} className="mx-auto text-slate-200 mb-4"/>
                  <h3 className="text-lg font-bold text-slate-400">No commissions found</h3>
                  <p className="text-slate-400 text-sm">No records available for this period.</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default Commissions;
