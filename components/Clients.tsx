
import React, { useState } from 'react';
import { Client, Job, User } from '../types';
import { Building2, User as UserIcon, Phone, Mail, ExternalLink, Briefcase, Plus, X, Calendar, FileText, MapPin, Star, PenSquare, PauseCircle, CheckCircle, XCircle, Archive } from 'lucide-react';

interface ClientsProps {
  clients: Client[];
  jobs: Job[];
  currentUser: User | null;
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
}

const Clients: React.FC<ClientsProps> = ({ clients, jobs, currentUser, onAddClient, onUpdateClient }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Form State for Add/Edit
  const [formClient, setFormClient] = useState<Partial<Client>>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    contractNature: 'Retainer',
    budget: 0,
    industry: '',
    address: '',
    isHotlist: false,
    ownerName: currentUser?.name || '',
    ownerId: currentUser?.id || ''
  });

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';

  const openAddModal = () => {
    setFormClient({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      website: '',
      contractNature: 'Retainer',
      budget: 0,
      industry: '',
      address: '',
      isHotlist: false,
      ownerName: currentUser?.name || '',
      ownerId: currentUser?.id || ''
    });
    setShowAddModal(true);
  };

  const openEditModal = (client: Client) => {
    setFormClient({ ...client });
    setShowEditModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client: Client = {
        id: `cli-${Date.now()}`,
        name: formClient.name || 'New Client',
        contactPerson: formClient.contactPerson || '',
        email: formClient.email || '',
        phone: formClient.phone || '',
        website: formClient.website,
        logo: '',
        contractNature: formClient.contractNature,
        budget: Number(formClient.budget) || 0,
        paymentStatus: 'Good Standing',
        allocatedBudget: 0,
        paidAmount: 0,
        expenses: [],
        industry: formClient.industry,
        address: formClient.address,
        isHotlist: formClient.isHotlist,
        ownerId: formClient.ownerId || currentUser?.id,
        ownerName: formClient.ownerName || currentUser?.name,
        createdBy: currentUser?.id,
        createdByName: currentUser?.name,
        createdAt: new Date().toISOString()
    };
    onAddClient(client);
    setShowAddModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (formClient.id) {
          onUpdateClient(formClient as Client);
          setShowEditModal(false);
      }
  };
  
  return (
    <div className="max-w-6xl mx-auto animate-fadeIn pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Client Portfolios</h2>
          <p className="text-slate-500 mt-1">Manage client relationships and view detailed statistics.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20"
          >
            <Plus size={18} /> Add New Client
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {clients.map(client => {
          const clientJobs = jobs.filter(j => j.clientId === client.id);
          const openJobs = clientJobs.filter(j => j.status === 'Active').length;
          const closedJobs = clientJobs.filter(j => j.status === 'Closed').length;
          const holdJobs = clientJobs.filter(j => j.status === 'Suspended').length;
          const cancelledJobs = clientJobs.filter(j => j.status === 'Pending Deletion' || j.status === 'Archived').length;
          
          return (
            <div key={client.id} className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${client.isHotlist ? 'border-orange-200 ring-1 ring-orange-100' : 'border-slate-100'}`}>
              <div className="p-6 flex flex-col md:flex-row gap-6">
                 {/* Left Section: Basic Info */}
                 <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                         <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center overflow-hidden p-2 relative">
                                {client.logo ? (
                                    <img src={client.logo} alt={client.name} className="w-full h-full object-contain" />
                                ) : (
                                    <Building2 className="text-slate-300" size={32} />
                                )}
                                {client.isHotlist && (
                                    <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                        <Star size={14} className="text-orange-500 fill-orange-500"/>
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-800 text-xl">{client.name}</h3>
                                    {client.industry && (
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100 font-medium">
                                            {client.industry}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                                    {client.website && (
                                        <a href={client.website} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline flex items-center gap-1">
                                            <ExternalLink size={12} /> Website
                                        </a>
                                    )}
                                    {client.address && (
                                        <span className="flex items-center gap-1 text-slate-400">
                                            <MapPin size={12}/> {client.address}
                                        </span>
                                    )}
                                </div>
                            </div>
                         </div>
                         
                         {isAdmin && (
                             <button 
                                onClick={() => openEditModal(client)}
                                className="text-slate-400 hover:text-blue-600 transition-colors p-2 hover:bg-slate-50 rounded-full"
                                title="Edit Client Details"
                             >
                                 <PenSquare size={18}/>
                             </button>
                         )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                         <div className="space-y-2">
                             <div className="flex items-center gap-2 text-sm text-slate-600">
                                <UserIcon size={14} className="text-slate-400" />
                                <span className="font-medium">{client.contactPerson}</span>
                             </div>
                             <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Mail size={14} className="text-slate-400" />
                                <a href={`mailto:${client.email}`} className="hover:text-orange-500 truncate">{client.email}</a>
                             </div>
                         </div>
                         <div className="space-y-2">
                             <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone size={14} className="text-slate-400" />
                                <span>{client.phone}</span>
                             </div>
                             <div className="flex items-center gap-2 text-sm text-slate-600">
                                <FileText size={14} className="text-slate-400" />
                                <span>{client.contractNature}</span>
                             </div>
                         </div>
                    </div>
                 </div>

                 {/* Right Section: Stats */}
                 <div className="w-full md:w-72 flex flex-col justify-between">
                     <div className="bg-white border border-slate-100 rounded-lg p-4 shadow-sm">
                         <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-50 pb-2">Job Statistics</h4>
                         <div className="grid grid-cols-2 gap-3">
                             <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                 <div className="flex flex-col">
                                     <span className="text-xs text-slate-400">Open</span>
                                     <span className="font-bold text-slate-700">{openJobs}</span>
                                 </div>
                             </div>
                             <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                 <div className="flex flex-col">
                                     <span className="text-xs text-slate-400">Closed</span>
                                     <span className="font-bold text-slate-700">{closedJobs}</span>
                                 </div>
                             </div>
                             <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                 <div className="flex flex-col">
                                     <span className="text-xs text-slate-400">On Hold</span>
                                     <span className="font-bold text-slate-700">{holdJobs}</span>
                                 </div>
                             </div>
                             <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                 <div className="flex flex-col">
                                     <span className="text-xs text-slate-400">Cancelled</span>
                                     <span className="font-bold text-slate-700">{cancelledJobs}</span>
                                 </div>
                             </div>
                         </div>
                     </div>

                     <div className="mt-4 flex items-center justify-between text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded border border-slate-100">
                         <span className="flex items-center gap-1"><UserIcon size={12}/> Owner: <span className="text-slate-600 font-medium">{client.ownerName || client.createdByName || 'Unassigned'}</span></span>
                         {client.isHotlist && <span className="text-orange-500 font-bold flex items-center gap-1"><Star size={10} fill="currentColor"/> Hotlist</span>}
                     </div>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Client Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-lg font-bold text-slate-800">{showEditModal ? 'Edit Client Details' : 'Add New Client'}</h3>
                  <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
               </div>
               <form onSubmit={showEditModal ? handleEditSubmit : handleAddSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="col-span-2">
                       <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                       <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500" 
                              value={formClient.name} onChange={e => setFormClient({...formClient, name: e.target.value})} />
                   </div>
                   
                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                       <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500" 
                              placeholder="e.g. Fintech, Retail"
                              value={formClient.industry} onChange={e => setFormClient({...formClient, industry: e.target.value})} />
                   </div>
                   
                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                       <input type="url" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500" 
                              placeholder="https://"
                              value={formClient.website} onChange={e => setFormClient({...formClient, website: e.target.value})} />
                   </div>

                   <div className="col-span-2">
                       <label className="block text-sm font-medium text-slate-700 mb-1">Full Address</label>
                       <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500" 
                              value={formClient.address} onChange={e => setFormClient({...formClient, address: e.target.value})} />
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                       <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500" 
                              value={formClient.contactPerson} onChange={e => setFormClient({...formClient, contactPerson: e.target.value})} />
                   </div>
                   
                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                       <input required type="email" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500" 
                              value={formClient.email} onChange={e => setFormClient({...formClient, email: e.target.value})} />
                   </div>
                   
                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                       <input required type="text" className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500" 
                              value={formClient.phone} onChange={e => setFormClient({...formClient, phone: e.target.value})} />
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Contract Nature</label>
                       <select className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-orange-500"
                           value={formClient.contractNature} 
                           onChange={e => setFormClient({...formClient, contractNature: e.target.value as any})}
                       >
                           <option value="Retainer">Retainer</option>
                           <option value="Project-based">Project-based</option>
                           <option value="Hourly">Hourly</option>
                           <option value="Placement Fee">Placement Fee</option>
                           <option value="SLA">SLA</option>
                       </select>
                   </div>

                   <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mt-6 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={formClient.isHotlist || false} 
                                onChange={(e) => setFormClient({...formClient, isHotlist: e.target.checked})}
                                className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500"
                            />
                            Mark as Hotlist Client
                        </label>
                   </div>

                   <div className="col-span-2 pt-4 border-t border-slate-100 flex justify-end gap-3">
                       <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                       <button type="submit" className="px-6 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 shadow-md">
                           {showEditModal ? 'Save Changes' : 'Create Client'}
                       </button>
                   </div>
               </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
