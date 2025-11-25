
import React, { useState } from 'react';
import { PayrollRecord, User, Candidate } from '../types';
import { Banknote, Search, Filter, DollarSign, Calendar, FileText, CheckCircle, Clock, Plus, Download, Trash2, User as UserIcon, X } from 'lucide-react';

interface PayrollProps {
  records: PayrollRecord[];
  users: User[];
  candidates: Candidate[]; // For contractor payments
  onAddRecord: (record: PayrollRecord) => void;
  onUpdateStatus: (id: string, status: 'Pending' | 'Paid' | 'Processing') => void;
  onDeleteRecord: (id: string) => void;
}

const Payroll: React.FC<PayrollProps> = ({ records, users, candidates, onAddRecord, onUpdateStatus, onDeleteRecord }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [periodFilter, setPeriodFilter] = useState('All');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<PayrollRecord>>({
    type: 'Salary',
    status: 'Pending',
    payPeriod: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    date: new Date().toISOString().split('T')[0],
  });

  // Filter Logic
  const filteredRecords = records.filter(r => {
    const matchesSearch = r.recipientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchesType = typeFilter === 'All' || r.type === typeFilter;
    const matchesPeriod = periodFilter === 'All' || r.payPeriod === periodFilter;
    return matchesSearch && matchesStatus && matchesType && matchesPeriod;
  });

  // Summary Stats
  const totalPayroll = filteredRecords.reduce((acc, r) => acc + r.amount, 0);
  const pendingPayroll = filteredRecords.filter(r => r.status === 'Pending').reduce((acc, r) => acc + r.amount, 0);
  const processedPayroll = filteredRecords.filter(r => r.status === 'Paid').reduce((acc, r) => acc + r.amount, 0);

  // Available Periods
  const periods = Array.from(new Set(records.map(r => r.payPeriod)));

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRecord.recipientId && newRecord.amount) {
      const recipientName = users.find(u => u.id === newRecord.recipientId)?.name || 
                            candidates.find(c => c.id === newRecord.recipientId)?.name || 'Unknown';
      const recipientRole = users.find(u => u.id === newRecord.recipientId)?.role || 'Contractor';

      const record: PayrollRecord = {
        id: `pay-${Date.now()}`,
        recipientId: newRecord.recipientId,
        recipientName,
        recipientRole,
        type: newRecord.type as any,
        amount: Number(newRecord.amount),
        status: newRecord.status as any,
        payPeriod: newRecord.payPeriod || '',
        date: newRecord.date || new Date().toISOString(),
        reference: newRecord.reference
      };
      onAddRecord(record);
      setShowAddModal(false);
      setNewRecord({
        type: 'Salary',
        status: 'Pending',
        payPeriod: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        date: new Date().toISOString().split('T')[0],
      });
    }
  };

  const exportPayroll = () => {
      const header = "ID,Name,Role,Type,Amount,Status,Period,Date,Reference\n";
      const rows = filteredRecords.map(r => 
          `${r.id},"${r.recipientName}",${r.recipientRole},${r.type},${r.amount},${r.status},"${r.payPeriod}",${r.date},${r.reference || ''}`
      ).join("\n");
      
      const blob = new Blob([header + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payroll_Export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
  };

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Payroll Management</h2>
          <p className="text-slate-500 mt-1">Manage staff salaries, commissions, and contractor payments.</p>
        </div>
        <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-black transition-colors"
        >
            <Plus size={18}/> Add Payment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-slate-500 text-sm font-medium mb-1">Total Payroll (View)</p>
              <h3 className="text-3xl font-bold text-slate-800">R {totalPayroll.toLocaleString()}</h3>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-slate-500 text-sm font-medium mb-1">Pending Payments</p>
              <h3 className="text-3xl font-bold text-orange-600">R {pendingPayroll.toLocaleString()}</h3>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-slate-500 text-sm font-medium mb-1">Processed / Paid</p>
              <h3 className="text-3xl font-bold text-green-600">R {processedPayroll.toLocaleString()}</h3>
          </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mr-2">
            <Filter size={16} />
            <span>Filters:</span>
          </div>

          <div className="relative w-full md:w-64">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
             <input 
               type="text" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search recipient..." 
               className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
             />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50 text-sm text-slate-600"
          >
            <option value="All">Status: All</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Paid">Paid</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50 text-sm text-slate-600"
          >
             <option value="All">Type: All</option>
             <option value="Salary">Salary</option>
             <option value="Commission">Commission</option>
             <option value="Bonus">Bonus</option>
             <option value="Contractor Pay">Contractor Pay</option>
          </select>

          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50 text-sm text-slate-600"
          >
             <option value="All">Period: All</option>
             {periods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <button 
            onClick={exportPayroll}
            className="ml-auto flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium"
          >
              <Download size={16}/> Export CSV
          </button>
      </div>

      {/* Records List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500">
                      <tr>
                          <th className="px-6 py-4">Recipient</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Period / Date</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filteredRecords.map(record => (
                          <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                          <UserIcon size={16} className="text-slate-500"/>
                                      </div>
                                      <div>
                                          <div className="font-bold text-slate-800">{record.recipientName}</div>
                                          <div className="text-xs text-slate-400">{record.recipientRole}</div>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${
                                      record.type === 'Commission' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                      record.type === 'Salary' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                      'bg-slate-50 text-slate-600 border-slate-100'
                                  }`}>
                                      {record.type === 'Commission' && <CheckCircle size={10}/>}
                                      {record.type}
                                  </span>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="font-medium text-slate-700">{record.payPeriod}</div>
                                  <div className="text-xs text-slate-400">{record.date}</div>
                              </td>
                              <td className="px-6 py-4 font-mono font-bold text-slate-800">
                                  R {record.amount.toLocaleString()}
                              </td>
                              <td className="px-6 py-4">
                                  <select 
                                    value={record.status}
                                    onChange={(e) => onUpdateStatus(record.id, e.target.value as any)}
                                    className={`text-xs font-medium px-2 py-1 rounded border outline-none cursor-pointer ${
                                        record.status === 'Paid' ? 'bg-green-100 text-green-700 border-green-200' :
                                        record.status === 'Pending' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                        'bg-blue-100 text-blue-700 border-blue-200'
                                    }`}
                                  >
                                      <option value="Pending">Pending</option>
                                      <option value="Processing">Processing</option>
                                      <option value="Paid">Paid</option>
                                  </select>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <button 
                                    onClick={() => onDeleteRecord(record.id)}
                                    className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                                  >
                                      <Trash2 size={16}/>
                                  </button>
                              </td>
                          </tr>
                      ))}
                      {filteredRecords.length === 0 && (
                          <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                                  No records found.
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-800">Add Payroll Entry</h3>
                      <button onClick={() => setShowAddModal(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                  </div>
                  <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Recipient (Staff/Contractor)</label>
                          <select 
                            required
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                            value={newRecord.recipientId}
                            onChange={(e) => setNewRecord({...newRecord, recipientId: e.target.value})}
                          >
                              <option value="">Select Recipient...</option>
                              <optgroup label="Internal Staff">
                                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                              </optgroup>
                              <optgroup label="Candidates / Contractors">
                                  {candidates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </optgroup>
                          </select>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Payment Type</label>
                          <select 
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                            value={newRecord.type}
                            onChange={(e) => setNewRecord({...newRecord, type: e.target.value as any})}
                          >
                              <option value="Salary">Base Salary</option>
                              <option value="Commission">Commission</option>
                              <option value="Bonus">Bonus</option>
                              <option value="Reimbursement">Reimbursement</option>
                              <option value="Contractor Pay">Contractor Pay</option>
                          </select>
                      </div>

                      <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Pay Period</label>
                           <input 
                             type="text" 
                             required
                             className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                             placeholder="e.g. October 2023"
                             value={newRecord.payPeriod}
                             onChange={(e) => setNewRecord({...newRecord, payPeriod: e.target.value})}
                           />
                      </div>

                      <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Amount (R)</label>
                           <input 
                             type="number" 
                             required
                             className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                             value={newRecord.amount}
                             onChange={(e) => setNewRecord({...newRecord, amount: parseFloat(e.target.value)})}
                           />
                      </div>
                      
                      <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                           <input 
                             type="date" 
                             required
                             className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                             value={newRecord.date}
                             onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
                           />
                      </div>

                      <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Reference (Optional)</label>
                           <input 
                             type="text" 
                             className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                             placeholder="e.g. Inv-001"
                             value={newRecord.reference}
                             onChange={(e) => setNewRecord({...newRecord, reference: e.target.value})}
                           />
                      </div>

                      <button className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-black transition-all">
                          Create Payment Record
                      </button>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};

export default Payroll;
    