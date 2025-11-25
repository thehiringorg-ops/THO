
import React, { useState } from 'react';
import { User, SystemTicket, COMMON_ISSUES, TicketPriority } from '../types';
import { LifeBuoy, CheckSquare, Square, AlertTriangle, CheckCircle, Clock, Plus, Filter, Search, Trash2, AlertOctagon } from 'lucide-react';

interface SystemSupportProps {
  currentUser: User | null;
  tickets: SystemTicket[];
  onCreateTicket: (ticket: SystemTicket) => void;
  onResolveTicket: (ticketId: string) => void;
  onDeleteTicket?: (ticketId: string) => void;
}

const SystemSupport: React.FC<SystemSupportProps> = ({ currentUser, tickets, onCreateTicket, onResolveTicket, onDeleteTicket }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [filterStatus, setFilterStatus] = useState<'All' | 'Open' | 'Resolved'>('Open');

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';

  const toggleSymptom = (issue: string) => {
      setSelectedSymptoms(prev => 
          prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
      );
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedSymptoms.length === 0) {
          alert("Please select at least one symptom.");
          return;
      }
      if (!currentUser) return;

      const newTicket: SystemTicket = {
          id: `tick-${Date.now()}`,
          reporterId: currentUser.id,
          reporterName: currentUser.name,
          reporterAvatar: currentUser.avatar,
          symptoms: selectedSymptoms,
          description,
          priority,
          status: 'Open',
          createdAt: new Date().toISOString()
      };

      onCreateTicket(newTicket);
      setShowForm(false);
      setSelectedSymptoms([]);
      setDescription('');
      setPriority('Medium');
  };

  const filteredTickets = tickets.filter(t => {
      if (filterStatus === 'All') return true;
      if (filterStatus === 'Open') return t.status !== 'Resolved';
      return t.status === 'Resolved';
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getPriorityColor = (p: TicketPriority) => {
      switch(p) {
          case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
          case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
          case 'Medium': return 'bg-blue-50 text-blue-700 border-blue-200';
          default: return 'bg-slate-100 text-slate-600 border-slate-200';
      }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <LifeBuoy className="text-red-500"/> System Support & Status
          </h2>
          <p className="text-slate-500 mt-1">Report technical issues and view system health.</p>
        </div>
        <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-md flex items-center gap-2"
        >
            {showForm ? 'Cancel Report' : 'Report System Issue'}
        </button>
      </div>

      {/* Report Form */}
      {showForm && (
          <div className="bg-white rounded-xl shadow-lg border border-red-100 mb-8 overflow-hidden animate-fadeIn">
              <div className="p-4 bg-red-50 border-b border-red-100">
                  <h3 className="font-bold text-red-800 flex items-center gap-2">
                      <AlertTriangle size={18}/> Log New Issue
                  </h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">Select Symptoms (Tick all that apply)</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {COMMON_ISSUES.map(issue => (
                              <div 
                                key={issue}
                                onClick={() => toggleSymptom(issue)}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedSymptoms.includes(issue) ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 hover:border-red-200'}`}
                              >
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedSymptoms.includes(issue) ? 'bg-red-500 border-red-500 text-white' : 'border-slate-300 text-transparent'}`}>
                                      <CheckSquare size={14}/>
                                  </div>
                                  <span className={`text-sm ${selectedSymptoms.includes(issue) ? 'font-bold text-red-700' : 'text-slate-600'}`}>{issue}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Additional Details (Optional)</label>
                          <textarea 
                              className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-red-500 h-24"
                              placeholder="Describe what you were doing when the error occurred..."
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Priority Level</label>
                          <div className="space-y-2">
                              {(['Low', 'Medium', 'High', 'Critical'] as TicketPriority[]).map(p => (
                                  <label key={p} className="flex items-center gap-2 cursor-pointer">
                                      <input 
                                          type="radio" 
                                          name="priority" 
                                          checked={priority === p}
                                          onChange={() => setPriority(p)}
                                          className="text-red-600 focus:ring-red-500"
                                      />
                                      <span className={`text-xs px-2 py-0.5 rounded font-medium border ${getPriorityColor(p)}`}>{p}</span>
                                  </label>
                              ))}
                          </div>
                      </div>
                  </div>

                  <div className="flex justify-end border-t border-slate-100 pt-4">
                      <button type="submit" className="bg-slate-900 text-white px-8 py-2 rounded-lg font-bold hover:bg-black transition-colors">
                          Submit Ticket
                      </button>
                  </div>
              </form>
          </div>
      )}

      {/* Issue Board */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 justify-between items-center">
              <div className="flex items-center gap-2">
                  <Filter size={16} className="text-slate-400"/>
                  <span className="text-sm font-medium text-slate-600">Filter:</span>
                  <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                      <button onClick={() => setFilterStatus('Open')} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterStatus === 'Open' ? 'bg-red-100 text-red-700' : 'text-slate-500 hover:bg-slate-50'}`}>Active Issues</button>
                      <button onClick={() => setFilterStatus('Resolved')} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterStatus === 'Resolved' ? 'bg-green-100 text-green-700' : 'text-slate-500 hover:bg-slate-50'}`}>Resolved History</button>
                      <button onClick={() => setFilterStatus('All')} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filterStatus === 'All' ? 'bg-slate-100 text-slate-700' : 'text-slate-500 hover:bg-slate-50'}`}>All</button>
                  </div>
              </div>
              <div className="text-xs text-slate-400">
                  {filteredTickets.length} tickets found
              </div>
          </div>

          <div className="divide-y divide-slate-50">
              {filteredTickets.length > 0 ? filteredTickets.map(ticket => (
                  <div key={ticket.id} className={`p-6 hover:bg-slate-50 transition-colors ${ticket.status === 'Resolved' ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                      <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${getPriorityColor(ticket.priority)}`}>
                                  {ticket.priority}
                              </span>
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Clock size={12}/> {new Date(ticket.createdAt).toLocaleString()}
                              </span>
                              <span className="text-xs text-slate-400">Ticket ID: {ticket.id}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                              {ticket.status === 'Resolved' ? (
                                  <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                      <CheckCircle size={14}/> Resolved
                                  </span>
                              ) : (
                                  isAdmin && (
                                      <button 
                                          onClick={() => onResolveTicket(ticket.id)}
                                          className="flex items-center gap-1 text-slate-500 hover:text-green-600 text-xs font-medium border border-slate-200 px-3 py-1 rounded-lg hover:bg-green-50 hover:border-green-200 transition-all"
                                      >
                                          <CheckCircle size={14}/> Mark Resolved
                                      </button>
                                  )
                              )}
                              {isAdmin && onDeleteTicket && (
                                  <button onClick={() => onDeleteTicket(ticket.id)} className="text-slate-300 hover:text-red-500 p-1">
                                      <Trash2 size={16}/>
                                  </button>
                              )}
                          </div>
                      </div>

                      <div className="flex gap-4">
                          <div className="flex-shrink-0 pt-1">
                              <img src={ticket.reporterAvatar} className="w-10 h-10 rounded-full border border-slate-200" alt={ticket.reporterName} title={ticket.reporterName}/>
                          </div>
                          <div className="flex-1">
                              <div className="flex flex-wrap gap-2 mb-2">
                                  {ticket.symptoms.map((symptom, i) => (
                                      <span key={i} className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium border border-slate-200">
                                          {symptom}
                                      </span>
                                  ))}
                              </div>
                              {ticket.description && (
                                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-100">
                                      {ticket.description}
                                  </p>
                              )}
                              <p className="text-xs text-slate-400 mt-2">Reported by <strong className="text-slate-600">{ticket.reporterName}</strong></p>
                          </div>
                      </div>
                  </div>
              )) : (
                  <div className="p-12 text-center text-slate-400">
                      <AlertOctagon size={48} className="mx-auto mb-3 opacity-20"/>
                      <p>No tickets found matching criteria.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default SystemSupport;
