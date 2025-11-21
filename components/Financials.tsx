
import React, { useState } from 'react';
import { Client, Job, User, Expense } from '../types';
import { TrendingUp, DollarSign, AlertCircle, CheckCircle, PieChart, Calendar, FileText, ChevronDown, ChevronUp, CreditCard, Edit3, Save, Plus, X, Lock } from 'lucide-react';

interface FinancialsProps {
  clients: Client[];
  jobs: Job[];
  currentUser?: User | null;
  onUpdateClient: (client: Client) => void;
  onAddExpense: (clientId: string, expense: Expense) => void;
}

const Financials: React.FC<FinancialsProps> = ({ clients, jobs, currentUser, onUpdateClient, onAddExpense }) => {
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit State for Client Details
  const [editClientData, setEditClientData] = useState<Partial<Client>>({});
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', date: '', status: 'Pending' });

  // Only SuperAdmin can edit after creation
  const isSuperAdmin = currentUser?.role === 'SuperAdmin';

  // Calculate Totals
  const totalBudget = clients.reduce((acc, curr) => acc + (curr.budget || 0), 0);
  const totalPaid = clients.reduce((acc, curr) => acc + (curr.paidAmount || 0), 0);
  const totalAllocated = clients.reduce((acc, curr) => acc + (curr.allocatedBudget || 0), 0);

  const handleEditClick = (client: Client) => {
      setEditClientData({
          id: client.id,
          budget: client.budget,
          allocatedBudget: client.allocatedBudget,
          paidAmount: client.paidAmount,
          paymentStatus: client.paymentStatus
      });
      setIsEditing(true);
      setExpandedClient(client.id);
  };

  const handleSaveClick = (originalClient: Client) => {
      const updatedClient = {
          ...originalClient,
          ...editClientData
      };
      onUpdateClient(updatedClient as Client);
      setIsEditing(false);
      setEditClientData({});
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!expandedClient) return;
      
      const expense: Expense = {
          id: `exp-${Date.now()}`,
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          date: newExpense.date,
          status: newExpense.status as 'Pending' | 'Paid' | 'Overdue'
      };
      
      onAddExpense(expandedClient, expense);
      setShowExpenseModal(false);
      setNewExpense({ description: '', amount: '', date: '', status: 'Pending' });
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn pb-20">
       <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Financial Overview</h2>
          <p className="text-slate-500 mt-1">
              {isSuperAdmin ? 'Manage client budgets and expense tracking.' : 'Read-only view of executive financials.'}
          </p>
        </div>
        {!isSuperAdmin && (
            <div className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-full border border-slate-200 flex items-center gap-1">
                <Lock size={12}/> Read Only Mode
            </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-slate-500 text-sm font-medium mb-2">Total Contract Value</p>
              <h3 className="text-3xl font-bold text-slate-800">R {totalBudget.toLocaleString()}</h3>
              <div className="mt-4 flex items-center gap-2 text-green-600 text-sm bg-green-50 px-2 py-1 rounded w-fit">
                  <TrendingUp size={16}/>
                  <span>Projected Revenue</span>
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-slate-500 text-sm font-medium mb-2">Total Collected</p>
              <h3 className="text-3xl font-bold text-slate-800">R {totalPaid.toLocaleString()}</h3>
              <div className="mt-4 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: `${(totalPaid/totalBudget)*100}%` }}></div>
              </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <p className="text-slate-500 text-sm font-medium mb-2">Allocation Rate</p>
              <h3 className="text-3xl font-bold text-slate-800">{Math.round((totalAllocated/totalBudget)*100)}%</h3>
              <div className="mt-4 text-sm text-slate-400">
                  R {totalAllocated.toLocaleString()} Allocated to Roles
              </div>
          </div>
      </div>

      {/* Clients Financial List */}
      <div className="space-y-4">
          {clients.map(client => {
              const isExpanded = expandedClient === client.id;
              const isEditingThis = isEditing && isExpanded;

              return (
                  <div key={client.id} className={`bg-white rounded-xl shadow-sm border transition-all ${isExpanded ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-100'}`}>
                      <div 
                        className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                        onClick={() => {
                            if(!isEditing) setExpandedClient(isExpanded ? null : client.id);
                        }}
                      >
                          <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                                  <DollarSign size={20}/>
                              </div>
                              <div>
                                  <h3 className="font-bold text-slate-800">{client.name}</h3>
                                  <p className="text-xs text-slate-500">{client.contractNature} • {client.paymentStatus}</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-6">
                              <div className="text-right hidden md:block">
                                  <p className="text-xs text-slate-400">Budget</p>
                                  <p className="font-mono font-medium">R {client.budget?.toLocaleString()}</p>
                              </div>
                              {isExpanded ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
                          </div>
                      </div>

                      {isExpanded && (
                          <div className="p-6 border-t border-slate-100 bg-slate-50/50 animate-fadeIn">
                              <div className="flex justify-between items-start mb-6">
                                  <h4 className="font-bold text-slate-700 flex items-center gap-2"><PieChart size={18}/> Financial Details</h4>
                                  {isSuperAdmin && !isEditingThis && (
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleEditClick(client); }}
                                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                                      >
                                          <Edit3 size={14}/> Edit Figures
                                      </button>
                                  )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                                      <label className="block text-xs font-medium text-slate-500 mb-1">Total Budget</label>
                                      {isEditingThis ? (
                                          <input 
                                            type="number" 
                                            className="w-full p-1 border rounded" 
                                            value={editClientData.budget} 
                                            onChange={(e) => setEditClientData({...editClientData, budget: parseFloat(e.target.value)})}
                                          />
                                      ) : (
                                          <p className="text-lg font-bold text-slate-800">R {client.budget?.toLocaleString()}</p>
                                      )}
                                  </div>
                                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                                      <label className="block text-xs font-medium text-slate-500 mb-1">Paid To Date</label>
                                      {isEditingThis ? (
                                          <input 
                                            type="number" 
                                            className="w-full p-1 border rounded" 
                                            value={editClientData.paidAmount} 
                                            onChange={(e) => setEditClientData({...editClientData, paidAmount: parseFloat(e.target.value)})}
                                          />
                                      ) : (
                                          <p className="text-lg font-bold text-green-600">R {client.paidAmount?.toLocaleString()}</p>
                                      )}
                                  </div>
                                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                                      <label className="block text-xs font-medium text-slate-500 mb-1">Account Status</label>
                                      {isEditingThis ? (
                                          <select 
                                            className="w-full p-1 border rounded text-sm"
                                            value={editClientData.paymentStatus}
                                            onChange={(e) => setEditClientData({...editClientData, paymentStatus: e.target.value as any})}
                                          >
                                              <option value="Good Standing">Good Standing</option>
                                              <option value="Owing">Owing</option>
                                              <option value="Overdue">Overdue</option>
                                          </select>
                                      ) : (
                                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                              client.paymentStatus === 'Good Standing' ? 'bg-green-100 text-green-700' :
                                              client.paymentStatus === 'Overdue' ? 'bg-red-100 text-red-700' :
                                              'bg-orange-100 text-orange-700'
                                          }`}>
                                              {client.paymentStatus === 'Good Standing' ? <CheckCircle size={12}/> : <AlertCircle size={12}/>}
                                              {client.paymentStatus}
                                          </span>
                                      )}
                                  </div>
                              </div>

                              {isEditingThis && (
                                  <div className="flex justify-end gap-2 mb-6 border-b border-slate-200 pb-6">
                                      <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-200 rounded">Cancel</button>
                                      <button onClick={() => handleSaveClick(client)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-2">
                                          <Save size={14}/> Save Changes
                                      </button>
                                  </div>
                              )}

                              {/* Expenses Section */}
                              <div>
                                  <div className="flex justify-between items-center mb-3">
                                      <h5 className="font-semibold text-slate-700 text-sm">Expenses & Invoices</h5>
                                      {isSuperAdmin && (
                                          <button 
                                            onClick={() => setShowExpenseModal(true)}
                                            className="text-xs flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-50 text-slate-600"
                                          >
                                              <Plus size={12}/> Add Entry
                                          </button>
                                      )}
                                  </div>
                                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                      <table className="w-full text-sm text-left">
                                          <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                              <tr>
                                                  <th className="px-4 py-3">Date</th>
                                                  <th className="px-4 py-3">Description</th>
                                                  <th className="px-4 py-3">Status</th>
                                                  <th className="px-4 py-3 text-right">Amount</th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                              {client.expenses && client.expenses.length > 0 ? (
                                                  client.expenses.map(exp => (
                                                      <tr key={exp.id}>
                                                          <td className="px-4 py-3 text-slate-500">{exp.date}</td>
                                                          <td className="px-4 py-3 font-medium text-slate-700">{exp.description}</td>
                                                          <td className="px-4 py-3">
                                                              <span className={`text-[10px] px-2 py-0.5 rounded ${
                                                                  exp.status === 'Paid' ? 'bg-green-50 text-green-700' :
                                                                  exp.status === 'Overdue' ? 'bg-red-50 text-red-700' :
                                                                  'bg-orange-50 text-orange-700'
                                                              }`}>
                                                                  {exp.status}
                                                              </span>
                                                          </td>
                                                          <td className="px-4 py-3 text-right font-mono">R {exp.amount.toLocaleString()}</td>
                                                      </tr>
                                                  ))
                                              ) : (
                                                  <tr><td colSpan={4} className="p-4 text-center text-slate-400 italic text-xs">No expense records found.</td></tr>
                                              )}
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>
              );
          })}
      </div>

      {/* Add Expense Modal - SuperAdmin Only */}
      {showExpenseModal && isSuperAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fadeIn">
                  <div className="p-4 border-b flex justify-between items-center">
                      <h3 className="font-bold">Add Financial Entry</h3>
                      <button onClick={() => setShowExpenseModal(false)}><X size={18}/></button>
                  </div>
                  <form onSubmit={handleAddExpenseSubmit} className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-medium mb-1">Description</label>
                          <input required className="w-full border rounded p-2 text-sm" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-medium mb-1">Amount (R)</label>
                          <input required type="number" className="w-full border rounded p-2 text-sm" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-medium mb-1">Date</label>
                          <input required type="date" className="w-full border rounded p-2 text-sm" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-medium mb-1">Status</label>
                          <select className="w-full border rounded p-2 text-sm" value={newExpense.status} onChange={e => setNewExpense({...newExpense, status: e.target.value})}>
                              <option value="Pending">Pending</option>
                              <option value="Paid">Paid</option>
                              <option value="Overdue">Overdue</option>
                          </select>
                      </div>
                      <button className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700">Add Entry</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Financials;
