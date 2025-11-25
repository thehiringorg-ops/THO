




import React, { useState } from 'react';
import { ServiceRequest, User, ServiceType, ServiceSubCategory } from '../types';
import { Search, Filter, Clock, CheckCircle, XCircle, User as UserIcon, Building2, Calendar, Briefcase, FileText, DollarSign, BookOpen, AlertCircle, Plus, X, Edit2 } from 'lucide-react';

interface SpecialisedServicesProps {
  serviceRequests: ServiceRequest[];
  users: User[];
  onUpdateStatus: (requestId: string, newStatus: 'Pending' | 'In Progress' | 'Completed') => void;
  // New props for manual management
  currentUser?: User | null;
  onAddManualRecord?: (record: ServiceRequest) => void;
  onUpdateRecord?: (record: ServiceRequest) => void;
}

const SpecialisedServices: React.FC<SpecialisedServicesProps> = ({ serviceRequests, users, onUpdateStatus, currentUser, onAddManualRecord, onUpdateRecord }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  
  // Manual Entry State
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState<Partial<ServiceRequest>>({
      clientName: '',
      serviceType: 'HR Consulting',
      subCategory: 'General',
      details: '',
      status: 'In Progress',
      assignedStaffId: currentUser?.id
  });

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';

  // Filter only specialised services (HR, Training, Payroll)
  const specialisedTypes: ServiceType[] = ['HR Consulting', 'Employee Training & Development', 'Payroll Management'];
  
  const filteredRequests = serviceRequests.filter(req => {
      const isSpecialised = specialisedTypes.includes(req.serviceType);
      const matchesSearch = req.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            req.details.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
      const matchesType = typeFilter === 'All' || req.serviceType === typeFilter;
      
      return isSpecialised && matchesSearch && matchesStatus && matchesType;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Pending': return 'bg-orange-100 text-orange-700 border-orange-200';
          case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
          default: return 'bg-slate-100 text-slate-700 border-slate-200';
      }
  };

  const getServiceIcon = (type: ServiceType) => {
      switch(type) {
          case 'HR Consulting': return <FileText size={16} className="text-purple-600"/>;
          case 'Payroll Management': return <DollarSign size={16} className="text-emerald-600"/>;
          case 'Employee Training & Development': return <BookOpen size={16} className="text-orange-600"/>;
          default: return <Briefcase size={16}/>;
      }
  };

  const handleOpenManualModal = (record?: ServiceRequest) => {
      if (record) {
          setEditingRecordId(record.id);
          setManualForm({
              ...record
          });
      } else {
          setEditingRecordId(null);
          setManualForm({
              clientName: '',
              serviceType: 'HR Consulting',
              subCategory: 'General',
              details: '',
              status: 'In Progress',
              assignedStaffId: currentUser?.id
          });
      }
      setShowManualModal(true);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!manualForm.clientName || !manualForm.details) {
          alert("Client Name and Details are required.");
          return;
      }

      if (editingRecordId && onUpdateRecord) {
          // Update existing
          onUpdateRecord({ ...manualForm, id: editingRecordId } as ServiceRequest);
          alert("Record updated successfully.");
      } else if (onAddManualRecord) {
          // Create new
          const newRecord: ServiceRequest = {
              id: `man-srv-${Date.now()}`,
              clientId: `manual-${Date.now()}`, // Placeholder for manual entries
              date: new Date().toISOString(),
              ...manualForm
          } as ServiceRequest;
          
          // Find staff name if assigned
          if(newRecord.assignedStaffId) {
              const staff = users.find(u => u.id === newRecord.assignedStaffId);
              if(staff) newRecord.assignedStaffName = staff.name;
          }

          onAddManualRecord(newRecord);
          alert("Manual service record created.");
      }
      setShowManualModal(false);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn pb-20">
      <div className="flex justify-between items-center mb-8">
         <div>
             <h2 className="text-2xl font-bold text-slate-800">Specialised Services Management</h2>
             <p className="text-slate-500 mt-1">Track and manage HR Consulting, Training, and Payroll service requests.</p>
         </div>
         {isAdmin && onAddManualRecord && (
             <button 
                onClick={() => handleOpenManualModal()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
             >
                 <Plus size={18}/> Add Manual Record
             </button>
         )}
      </div>

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
               placeholder="Search clients or details..." 
               className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
             />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 text-sm text-slate-600 cursor-pointer hover:border-slate-300"
          >
            <option value="All">Service Type: All</option>
            {specialisedTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 text-sm text-slate-600 cursor-pointer hover:border-slate-300"
          >
             <option value="All">Status: All</option>
             <option value="Pending">Pending</option>
             <option value="In Progress">In Progress</option>
             <option value="Completed">Completed</option>
          </select>
      </div>

      <div className="grid gap-4">
          {filteredRequests.length > 0 ? (
              filteredRequests.map(req => (
                  <div key={req.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group">
                      <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border ${
                                          req.serviceType === 'HR Consulting' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                          req.serviceType === 'Payroll Management' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                          'bg-orange-50 text-orange-700 border-orange-100'
                                      }`}>
                                          {getServiceIcon(req.serviceType)} {req.serviceType}
                                      </span>
                                      <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={10}/> {new Date(req.date).toLocaleDateString()}</span>
                                  </div>
                                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                      <Building2 size={18} className="text-slate-400"/> {req.clientName}
                                  </h3>
                                  {req.subCategory && <p className="text-xs font-semibold text-indigo-600 mt-1 bg-indigo-50 w-fit px-2 py-0.5 rounded">{req.subCategory}</p>}
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(req.status)}`}>
                                      {req.status}
                                  </span>
                                  {isAdmin && (
                                      <button 
                                        onClick={() => handleOpenManualModal(req)}
                                        className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                          <Edit2 size={12}/> Edit
                                      </button>
                                  )}
                              </div>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4 text-sm text-slate-600">
                              <p className="italic">"{req.details}"</p>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                              <div className="flex items-center gap-2 text-sm text-slate-500">
                                  <UserIcon size={14}/>
                                  <span>Assigned: <strong className="text-slate-700">{req.assignedStaffName || 'Pending Allocation'}</strong></span>
                              </div>
                              
                              <div className="flex gap-2 items-center">
                                  {req.status !== 'Completed' && (
                                      <select 
                                          value={req.status}
                                          onChange={(e) => onUpdateStatus(req.id, e.target.value as any)}
                                          className="bg-white border border-slate-200 text-slate-600 text-xs rounded px-3 py-1.5 outline-none focus:border-indigo-500 cursor-pointer"
                                      >
                                          <option value="Pending">Mark Pending</option>
                                          <option value="In Progress">In Progress</option>
                                          <option value="Completed">Mark Completed</option>
                                      </select>
                                  )}
                                  
                                  {req.status === 'In Progress' && (
                                      <button 
                                          onClick={() => alert("Upload Deliverable feature would open here.")}
                                          className="text-xs font-medium text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded border border-blue-100 transition-colors"
                                      >
                                          Upload Deliverable
                                      </button>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              ))
          ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-100 border-dashed">
                  <Clock size={48} className="mx-auto text-slate-200 mb-4"/>
                  <h3 className="text-lg font-medium text-slate-500">No specialised service requests found</h3>
                  <p className="text-slate-400 text-sm mt-1">Requests for HR, Training, or Payroll will appear here.</p>
              </div>
          )}
      </div>

      {/* Manual Entry Modal */}
      {showManualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
                      <h3 className="text-lg font-bold text-indigo-900">
                          {editingRecordId ? 'Edit Service Record' : 'Add Manual Service Record'}
                      </h3>
                      <button onClick={() => setShowManualModal(false)}><X size={20} className="text-indigo-400 hover:text-indigo-600"/></button>
                  </div>
                  <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Client Name</label>
                          <input 
                              required
                              className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                              value={manualForm.clientName}
                              onChange={(e) => setManualForm({...manualForm, clientName: e.target.value})}
                              placeholder="e.g. ACME Corp"
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Service Type</label>
                              <select 
                                  className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                  value={manualForm.serviceType}
                                  onChange={(e) => setManualForm({...manualForm, serviceType: e.target.value as ServiceType})}
                              >
                                  {specialisedTypes.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Sub-Category</label>
                              <input 
                                  className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                  value={manualForm.subCategory}
                                  onChange={(e) => setManualForm({...manualForm, subCategory: e.target.value as ServiceSubCategory})}
                                  placeholder="e.g. General"
                              />
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Staff</label>
                          <select 
                              className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                              value={manualForm.assignedStaffId || ''}
                              onChange={(e) => setManualForm({...manualForm, assignedStaffId: e.target.value})}
                          >
                              <option value="">Unassigned</option>
                              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                          <select 
                              className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                              value={manualForm.status}
                              onChange={(e) => setManualForm({...manualForm, status: e.target.value as any})}
                          >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                          </select>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Details / Scope</label>
                          <textarea 
                              required
                              className="w-full border border-slate-200 rounded-lg p-2 text-sm h-24 outline-none focus:ring-2 focus:ring-indigo-500"
                              value={manualForm.details}
                              onChange={(e) => setManualForm({...manualForm, details: e.target.value})}
                              placeholder="Describe the work required..."
                          />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setShowManualModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                          <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-sm">
                              {editingRecordId ? 'Update Record' : 'Create Record'}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default SpecialisedServices;