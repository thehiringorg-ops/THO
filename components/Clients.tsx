import React, { useState, useRef, useEffect } from 'react';
import { Client, Job, User, INDUSTRIES, Permission, ServiceType, ChatMessage, ClientDocument, DocumentType, SystemConfig } from '../types';
import { Building2, User as UserIcon, Phone, Mail, Briefcase, Plus, X, CheckCircle, AlertCircle, Star, ChevronDown, ChevronUp, Edit3, MessageCircle, Key, Filter, Search, Users, LogIn, ExternalLink as ViewIcon, Globe, DollarSign, PieChart, Save, Send, RefreshCw, ShieldAlert, Copy, MapPin, Archive, Clock, PauseCircle, MoreVertical, LayoutGrid, List as ListIcon, UserCheck, HelpCircle, Upload, FileText, Lock, Bot, Loader2, Scale, BookOpen, FileCheck, Download, ArrowLeft } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface ClientsProps {
  clients: Client[];
  jobs: Job[];
  users: User[];
  currentUser?: User | null;
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onSendMessage?: (text: string, recipientId: string) => void;
  onAccessPortal?: (clientId: string) => void;
  onArchiveClient?: (clientId: string, reason: string) => void;
  messages?: ChatMessage[];
}

const RECRUITMENT_SERVICES: { id: ServiceType; label: string; icon: any, description: string }[] = [
    { id: 'Executive Search', label: 'Executive Search', icon: Star, description: 'Specialized recruitment for C-suite and senior leadership roles.' },
    { id: 'Permanent Recruitment', label: 'Permanent Recruitment', icon: Briefcase, description: 'Full-cycle hiring for long-term staff positions.' },
    { id: 'Temporary/Contract Staffing', label: 'Temp & Contract Staffing', icon: Clock, description: 'Flexible staffing solutions for projects or seasonal needs.' },
];

const SPECIAL_SERVICES: { id: ServiceType; label: string; icon: any, description: string }[] = [
    { id: 'HR Consulting', label: 'HR Consulting', icon: Scale, description: 'Labour relations, BCEA compliance, and policy development.' },
    { id: 'Employee Training & Development', label: 'Training & Development', icon: BookOpen, description: 'Workplace Skills Plans (WSP), ATR, and staff upskilling.' },
    { id: 'Payroll Management', label: 'Payroll Management', icon: DollarSign, description: 'SARS compliance, EMP201 submissions, and monthly payroll.' }
];

const CLIENT_STATUS_REASONS = {
    'Active': [
        "Contract Signed & Valid",
        "Payment Received",
        "Re-engagement",
        "Trial Period Started",
        "Compliance Cleared",
        "Admin Override"
    ],
    'Inactive': [
        "Payment Overdue",
        "Contract Expired",
        "Client Request",
        "Legal / Compliance Issue",
        "No Active Roles",
        "Internal Review"
    ],
    'Pending Approval': [
        "Awaiting Signed SLA",
        "Credit Check Pending",
        "Management Review",
        "Incomplete Documentation",
        "Negotiation Phase"
    ],
    'Prospect': [
        "Initial Contact",
        "Lead Qualification",
        "Cold Outreach"
    ],
    'Archived': [
        "Client Churned",
        "Business Closed",
        "Duplicate Entry"
    ]
};

const Clients: React.FC<ClientsProps> = ({ clients, jobs, users, currentUser, onAddClient, onUpdateClient, onSendMessage, onAccessPortal, onArchiveClient, messages = [] }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatTargetId, setChatTargetId] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // State for interactive menus
  const [activeStatusMenuId, setActiveStatusMenuId] = useState<string | null>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Status Change Modal State
  const [statusModal, setStatusModal] = useState<{
      isOpen: boolean;
      client: Client | null;
      newStatus: Client['clientStatus'] | null;
  }>({ isOpen: false, client: null, newStatus: null });
  const [statusReason, setStatusReason] = useState('');

  const [formClient, setFormClient] = useState<Partial<Client>>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    industry: INDUSTRIES[0],
    contractNature: 'Retainer',
    budget: 0,
    clientStatus: 'Active',
    isHotlist: false,
    notes: '',
    address: '',
    website: '',
    standardFee: 15,
    companyRegNumber: ''
  });

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';
  const isSuperAdmin = currentUser?.role === 'SuperAdmin';
  
  const hasPermission = (perm: Permission) => {
      return isAdmin || (currentUser?.permissions && currentUser.permissions.includes(perm));
  };

  const canCreateClient = hasPermission('CREATE_CLIENT') || currentUser?.role === 'Recruiter';
  const canEditClient = hasPermission('EDIT_CLIENT');

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setActiveStatusMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredClients = clients.filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (client.uin || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || client.clientStatus === statusFilter;
      return matchesSearch && matchesStatus;
  });

  const openAddModal = () => {
    setFormClient({
      name: '',
      uin: `CLT-${Math.floor(10000 + Math.random() * 90000)}`,
      contactPerson: '',
      email: '',
      phone: '',
      industry: INDUSTRIES[0],
      contractNature: 'Retainer',
      budget: 0,
      clientStatus: isAdmin ? 'Active' : 'Pending Approval',
      isHotlist: false,
      notes: '',
      ownerName: currentUser?.name || 'Pending Assignment',
      ownerId: currentUser?.id || undefined,
      address: '',
      website: '',
      standardFee: 15,
      companyRegNumber: ''
    });
    setShowAddModal(true);
  };

  const openEditModal = (client: Client) => {
    setFormClient({ ...client });
    setShowEditModal(true);
  };

  const openChatModal = (client: Client) => {
      setChatTargetId(client.id);
      setChatMessage('');
      setShowChatModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client: Client = {
        id: `cli-${Date.now()}`,
        uin: formClient.uin || `CLT-${Date.now()}`,
        name: formClient.name || 'New Client',
        contactPerson: formClient.contactPerson || '',
        email: formClient.email || '',
        phone: formClient.phone || '',
        website: formClient.website || '',
        logo: formClient.logo || '',
        contractNature: formClient.contractNature || 'Retainer',
        budget: Number(formClient.budget) || 0,
        paymentStatus: 'Good Standing',
        allocatedBudget: 0,
        paidAmount: 0,
        expenses: [],
        industry: formClient.industry || INDUSTRIES[0],
        address: formClient.address,
        isHotlist: formClient.isHotlist,
        clientStatus: formClient.clientStatus || 'Active',
        companyRegNumber: formClient.companyRegNumber,
        standardFee: Number(formClient.standardFee),
        notes: formClient.notes,
        ownerId: formClient.ownerId,
        ownerName: formClient.ownerName,
        delegatedStaffIds: formClient.delegatedStaffIds,
        createdBy: currentUser?.id,
        createdByName: currentUser?.name,
        createdAt: new Date().toISOString(),
        portalAccess: formClient.portalAccess,
        allowedServices: formClient.allowedServices,
        password: 'client123',
        onboardingCommissionEligible: false
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

  const initiateStatusChange = (client: Client, status: Client['clientStatus']) => {
      setStatusModal({ isOpen: true, client, newStatus: status });
      setStatusReason('');
      setActiveStatusMenuId(null);
  };

  const confirmStatusChange = () => {
      if (statusModal.client && statusModal.newStatus && statusReason) {
          const timestamp = new Date().toLocaleString();
          const noteEntry = `\n[${timestamp}] Status changed to ${statusModal.newStatus}: ${statusReason}`;
          
          onUpdateClient({
              ...statusModal.client,
              clientStatus: statusModal.newStatus,
              notes: (statusModal.client.notes || '') + noteEntry
          });
          
          setStatusModal({ isOpen: false, client: null, newStatus: null });
          setStatusReason('');
      }
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (chatMessage.trim() && chatTargetId && onSendMessage) {
          onSendMessage(chatMessage, chatTargetId);
          setShowChatModal(false);
          alert("Message sent.");
      }
  };

  const getUnreadCount = (clientId: string) => {
      if (!currentUser) return 0;
      return messages.filter(m => {
          if (m.senderId === clientId && !m.read) {
              if (m.recipientId === currentUser.id) return true;
              if (isAdmin && m.recipientId === 'management-pool') return true;
          }
          return false;
      }).length;
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Client Portfolios</h2>
          <p className="text-slate-500 mt-1">Manage client relationships and contact details.</p>
        </div>
        {canCreateClient && (
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/20"
          >
            <Plus size={18} /> {isAdmin ? 'Add New Client' : 'Add Potential Client'}
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
               placeholder="Search clients or UIN..." 
               className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm"
             />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50 text-sm text-slate-600 cursor-pointer"
          >
            <option value="All">Status: All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Frozen / Inactive</option>
            <option value="Prospect">Prospect</option>
            <option value="Pending Approval">Pending Approval</option>
          </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white rounded-xl border border-slate-100 border-dashed">
                <Building2 size={48} className="mx-auto text-slate-200 mb-4"/>
                <h3 className="text-lg font-medium text-slate-500">No clients found</h3>
            </div>
        ) : (
            filteredClients.map(client => {
                const unread = getUnreadCount(client.id);
                const clientJobs = jobs.filter(j => j.clientId === client.id && j.status === 'Active');
                
                return (
                    <div key={client.id} className={`bg-white rounded-xl shadow-sm border overflow-visible hover:shadow-md transition-shadow flex flex-col group ${client.clientStatus === 'Pending Approval' ? 'border-orange-200 bg-orange-50/30' : 'border-slate-100'}`}>
                        <div className="p-5 flex-1 relative">
                            {unread > 0 && (
                                <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm animate-bounce z-10 flex items-center gap-1">
                                    <MessageCircle size={12} fill="white"/> {unread}
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    {/* Logo Placeholder */}
                                    <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm overflow-hidden border border-slate-100 shrink-0">
                                        {client.logo ? <img src={client.logo} alt="" className="w-full h-full object-cover"/> : client.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-800 line-clamp-1 text-lg truncate" title={client.name}>{client.name}</h3>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                            {client.uin || 'N/A'} 
                                            {client.isHotlist && <Star size={12} className="text-orange-500 fill-orange-500" />}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Partner Display */}
                            <div className="mb-3 text-xs flex items-center gap-1 text-slate-500 bg-slate-50 px-2 py-1.5 rounded border border-slate-100">
                                <UserCheck size={12} className="text-slate-400"/>
                                <span className="font-medium text-slate-700">Partner:</span> 
                                <span>{client.ownerName || 'Unassigned'}</span>
                            </div>

                            {/* Active Jobs Carousel */}
                            {clientJobs.length > 0 && (
                                <div className="mb-4 bg-slate-50 rounded-lg p-2 border border-slate-100">
                                    <div className="flex justify-between items-center mb-2 px-1">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Jobs ({clientJobs.length})</p>
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth snap-x">
                                        {clientJobs.map(job => (
                                            <div key={job.id} className="min-w-[140px] max-w-[140px] p-2 bg-white rounded shadow-sm border border-slate-100 flex flex-col snap-start shrink-0">
                                                <span className="font-bold text-xs text-slate-700 truncate" title={job.title}>{job.title}</span>
                                                <span className="text-[10px] text-slate-400">{job.listingReference}</span>
                                                <div className="mt-1 pt-1 border-t border-slate-50 flex justify-between items-center">
                                                    <span className="text-[9px] text-slate-500">{job.type}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Detailed Contact Info */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <UserIcon size={16} className="text-blue-500 shrink-0"/>
                                    <span className="truncate font-medium text-slate-800">{client.contactPerson}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-1 px-1">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Mail size={12} className="shrink-0 text-slate-400"/>
                                        <span className="truncate">{client.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Phone size={12} className="shrink-0 text-slate-400"/>
                                        <span className="truncate">{client.phone || 'No Phone'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-50">
                                <div className="flex items-center gap-2">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                                        <Briefcase size={10}/> {client.contractNature}
                                    </span>
                                </div>
                                
                                {/* Status Dropdown Menu */}
                                <div className="relative" ref={activeStatusMenuId === client.id ? statusMenuRef : null}>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setActiveStatusMenuId(activeStatusMenuId === client.id ? null : client.id); }}
                                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 hover:opacity-80 transition-opacity shadow-sm ${
                                            client.clientStatus === 'Active' ? 'bg-green-100 text-green-700 border border-green-200' : 
                                            client.clientStatus === 'Inactive' ? 'bg-slate-200 text-slate-600 border border-slate-300' :
                                            client.clientStatus === 'Pending Approval' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                            'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        {client.clientStatus === 'Inactive' ? 'Frozen' : client.clientStatus} <ChevronDown size={10}/>
                                    </button>
                                    
                                    {activeStatusMenuId === client.id && (
                                        <div className="absolute bottom-full right-0 mb-1 w-40 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 animate-fadeIn">
                                            <button onClick={(e) => { e.stopPropagation(); initiateStatusChange(client, 'Active'); }} className="w-full text-left px-3 py-2 text-xs hover:bg-green-50 text-green-700 flex items-center gap-2 font-medium transition-colors">
                                                <CheckCircle size={14}/> Set Active
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); initiateStatusChange(client, 'Pending Approval'); }} className="w-full text-left px-3 py-2 text-xs hover:bg-orange-50 text-orange-700 flex items-center gap-2 font-medium transition-colors">
                                                <Clock size={14}/> Set Pending
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); initiateStatusChange(client, 'Inactive'); }} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 text-slate-600 flex items-center gap-2 font-medium transition-colors">
                                                <PauseCircle size={14}/> Freeze Account
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button onClick={() => openChatModal(client)} className="text-slate-400 hover:text-blue-600 p-1.5 hover:bg-white rounded-lg transition-colors relative" title="Quick Message">
                                    <MessageCircle size={16}/>
                                </button>
                                {/* Updated: Allowed 'isAdmin' (Admins & SuperAdmins) OR Client Owners to access portal */}
                                {(isAdmin || client.ownerId === currentUser?.id) && client.portalAccess && (
                                    <button 
                                        onClick={() => onAccessPortal?.(client.id)} 
                                        className="flex items-center gap-1 text-slate-400 hover:text-amber-600 px-2 py-1.5 hover:bg-white rounded-lg transition-colors font-medium text-xs" 
                                        title="Log in as Client"
                                    >
                                        <Key size={16}/> View Portal
                                    </button>
                                )}
                            </div>
                            {(canEditClient || client.ownerId === currentUser?.id) && (
                                <button onClick={() => openEditModal(client)} className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-200 transition-colors">
                                    <Edit3 size={12}/> Manage Details
                                </button>
                            )}
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {/* Chat Modal */}
      {showChatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                  <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-800">Quick Message</h3>
                      <button onClick={() => setShowChatModal(false)}><X size={18} className="text-slate-400 hover:text-slate-600"/></button>
                  </div>
                  <form onSubmit={handleSendChatMessage} className="p-4">
                      <textarea 
                          className="w-full border border-slate-300 rounded-lg p-3 h-32 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                          placeholder="Type message to client..."
                          value={chatMessage}
                          onChange={e => setChatMessage(e.target.value)}
                      />
                      <div className="flex justify-end mt-4">
                          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm flex items-center gap-2">
                              <Send size={14}/> Send Message
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="text-orange-500"/> {showAddModal ? 'Add New Client' : 'Edit Client Profile'}
              </h3>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={showAddModal ? handleAddSubmit : handleEditSubmit} className="p-6 overflow-y-auto space-y-6">
                
                {/* Core Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company Name <span className="text-red-500">*</span></label>
                        <input required className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none" value={formClient.name} onChange={e => setFormClient({...formClient, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number</label>
                        <input className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none" value={formClient.companyRegNumber || ''} onChange={e => setFormClient({...formClient, companyRegNumber: e.target.value})} placeholder="e.g. 2023/123456/07" />
                    </div>
                </div>

                {/* Contact Info */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Users size={16}/> Contact Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Contact Person <span className="text-red-500">*</span></label>
                            <input required className="w-full border border-slate-200 rounded-lg p-2 text-sm" value={formClient.contactPerson} onChange={e => setFormClient({...formClient, contactPerson: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Email Address <span className="text-red-500">*</span></label>
                            <input required type="email" className="w-full border border-slate-200 rounded-lg p-2 text-sm" value={formClient.email} onChange={e => setFormClient({...formClient, email: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Phone Number</label>
                            <input className="w-full border border-slate-200 rounded-lg p-2 text-sm" value={formClient.phone} onChange={e => setFormClient({...formClient, phone: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Website</label>
                            <input className="w-full border border-slate-200 rounded-lg p-2 text-sm" value={formClient.website || ''} onChange={e => setFormClient({...formClient, website: e.target.value})} placeholder="https://..." />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Physical Address</label>
                        <input className="w-full border border-slate-200 rounded-lg p-2 text-sm" value={formClient.address || ''} onChange={e => setFormClient({...formClient, address: e.target.value})} />
                    </div>
                </div>

                {/* Account Manager Assignment */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Account Partner / Manager</label>
                    <select 
                        className="w-full border border-slate-200 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                        value={formClient.ownerId || ''} 
                        onChange={e => {
                            const selectedUser = users.find(u => u.id === e.target.value);
                            setFormClient({...formClient, ownerId: e.target.value, ownerName: selectedUser?.name || ''});
                        }}
                    >
                        <option value="">Select Partner...</option>
                        {users.filter(u => u.status === 'Active').map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))}
                    </select>
                </div>

                {/* Contract Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                        <select className="w-full border border-slate-200 rounded-lg p-2.5 bg-white" value={formClient.industry} onChange={e => setFormClient({...formClient, industry: e.target.value})}>
                            {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Contract Type</label>
                        <select className="w-full border border-slate-200 rounded-lg p-2.5 bg-white" value={formClient.contractNature} onChange={e => setFormClient({...formClient, contractNature: e.target.value as any})}>
                            <option value="Retainer">Retainer</option>
                            <option value="Placement Fee">Placement Fee</option>
                            <option value="Project-based">Project-based</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Standard Fee (%)</label>
                        <input type="number" className="w-full border border-slate-200 rounded-lg p-2.5" value={formClient.standardFee} onChange={e => setFormClient({...formClient, standardFee: Number(e.target.value)})} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Annual Budget (Optional)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R</span>
                        <input type="number" className="w-full border border-slate-200 rounded-lg p-2.5 pl-8" value={formClient.budget} onChange={e => setFormClient({...formClient, budget: Number(e.target.value)})} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                    <textarea 
                        className="w-full border border-slate-200 rounded-lg p-3 text-sm h-24" 
                        value={formClient.notes || ''} 
                        onChange={e => setFormClient({...formClient, notes: e.target.value})}
                        placeholder="Internal notes regarding this client..."
                    />
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                    <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50">Cancel</button>
                    <button className="bg-slate-900 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-black transition-colors shadow-md">
                        {showAddModal ? 'Create Client' : 'Save Changes'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Change Reason Modal */}
      {statusModal.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="text-lg font-bold text-slate-800">Change Client Status</h3>
                      <button onClick={() => setStatusModal({ isOpen: false, client: null, newStatus: null })}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <p className="text-sm text-slate-600">
                          Changing <strong>{statusModal.client?.name}</strong> to <span className="font-bold text-slate-800">{statusModal.newStatus === 'Inactive' ? 'Frozen' : statusModal.newStatus}</span>.
                      </p>
                      
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Reason for Status Change <span className="text-red-500">*</span></label>
                          <select 
                              className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                              value={statusReason}
                              onChange={(e) => setStatusReason(e.target.value)}
                          >
                              <option value="">-- Select Reason --</option>
                              {CLIENT_STATUS_REASONS[statusModal.newStatus || 'Active'].map((r, i) => (
                                  <option key={i} value={r}>{r}</option>
                              ))}
                              <option value="Other">Other (Specify in notes)</option>
                          </select>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                          <button 
                              onClick={() => setStatusModal({ isOpen: false, client: null, newStatus: null })}
                              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                          >
                              Cancel
                          </button>
                          <button 
                              onClick={confirmStatusChange}
                              disabled={!statusReason}
                              className={`px-6 py-2 text-white font-medium rounded-lg shadow-sm transition-colors ${!statusReason ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                          >
                              Confirm Update
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Clients;
