import React, { useState } from 'react';
import { User, SystemConfig, Permission, Job, Client, REINSTATE_REASONS, ActivityLog } from '../types';
import { Settings, Database, Globe, Shield, Server, Key, Save, ToggleLeft, ToggleRight, MessageCircle, HelpCircle, Sparkles, RefreshCw, Eye, EyeOff, Lock, Cloud, Archive, RefreshCcw, Trash2, Users, FileText, Building2, X, AlertTriangle, Search, CheckCircle, Loader2, Info, Layout, Code, Copy, Check, Clock, Activity, Zap, Calendar, DollarSign, CreditCard, MessageSquare, Gavel, List } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface SuperAdminSettingsProps {
  currentUser: User | null;
  systemConfig?: SystemConfig;
  onUpdateConfig?: (config: SystemConfig) => void;
  allUsers?: User[];
  allJobs?: Job[];
  allClients?: Client[];
  activityLogs?: ActivityLog[];
  onReinstate?: (type: 'User' | 'Job' | 'Client', id: string, reason: string) => void;
}

const SuperAdminSettings: React.FC<SuperAdminSettingsProps> = ({ currentUser, systemConfig, onUpdateConfig, allUsers = [], allJobs = [], allClients = [], activityLogs = [], onReinstate }) => {
  const [activeTab, setActiveTab] = useState<'system' | 'archives' | 'governance'>('system');
  const [archiveType, setArchiveType] = useState<'User' | 'Job' | 'Client'>('User');
  const [archiveSearch, setArchiveSearch] = useState('');
  const [reinstateModal, setReinstateModal] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});
  const [reinstateReason, setReinstateReason] = useState('');
  const [customReinstateReason, setCustomReinstateReason] = useState('');

  // Audit Trail State
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilterType, setAuditFilterType] = useState<string>('All');

  const [showCode, setShowCode] = useState(false);
  const [tempCode, setTempCode] = useState(systemConfig?.superAdminCode || '');
  const [deployMode, setDeployMode] = useState<'root' | 'subdomain' | 'embed'>('subdomain');

  // AI Health Check State
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthStatus, setHealthStatus] = useState<string>('');

  const isSuperAdmin = currentUser?.role === 'SuperAdmin';
  
  const hasPermission = (perm: Permission) => {
      return isSuperAdmin || (currentUser?.permissions && currentUser.permissions.includes(perm));
  };

  if (!isSuperAdmin && !hasPermission('EMERGENCY_ACCESS') && !hasPermission('MANAGE_SYSTEM_SETTINGS') && !hasPermission('ACCESS_ARCHIVES')) {
      return (
          <div className="p-20 text-center text-slate-400 flex flex-col items-center">
              <Lock size={48} className="mb-4 opacity-20"/>
              <h3 className="text-lg font-bold text-slate-600">Access Denied</h3>
              <p>You do not have permission to view system settings.</p>
          </div>
      );
  }

  const archivedUsers = allUsers.filter(u => u.isArchived && (u.name.toLowerCase().includes(archiveSearch.toLowerCase()) || u.email.toLowerCase().includes(archiveSearch.toLowerCase())));
  const archivedJobs = allJobs.filter(j => j.isArchived && (j.title.toLowerCase().includes(archiveSearch.toLowerCase()) || j.listingReference.toLowerCase().includes(archiveSearch.toLowerCase())));
  const archivedClients = allClients.filter(c => c.isArchived && (c.name.toLowerCase().includes(archiveSearch.toLowerCase())));

  // Audit Trail Filtering
  const filteredLogs = activityLogs.filter(log => {
      const matchesSearch = 
          log.action.toLowerCase().includes(auditSearch.toLowerCase()) || 
          log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
          log.details.toLowerCase().includes(auditSearch.toLowerCase());
      const matchesType = auditFilterType === 'All' || log.type === auditFilterType;
      return matchesSearch && matchesType;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleReinstateSubmit = () => {
      if (reinstateModal.id && onReinstate) {
          const reason = customReinstateReason || reinstateReason;
          onReinstate(archiveType, reinstateModal.id, reason);
          setReinstateModal({isOpen: false, id: null});
          setReinstateReason('');
          setCustomReinstateReason('');
      }
  };

  const handleConfigChange = (key: keyof SystemConfig, value: any) => {
      if(systemConfig && onUpdateConfig) {
          onUpdateConfig({
              ...systemConfig,
              [key]: value
          });
      }
  };

  const generateDailyCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setTempCode(result);
  };

  const saveCode = () => {
      if (systemConfig && onUpdateConfig) {
          onUpdateConfig({ ...systemConfig, superAdminCode: tempCode });
          alert("Master Access Code Updated.");
      }
  };

  const runAiHealthCheck = async () => {
      setIsCheckingHealth(true);
      setHealthStatus('');
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const model = 'gemini-2.5-flash';
          
          const systemState = JSON.stringify({
              totalUsers: allUsers.length,
              activeUsers: allUsers.filter(u => u.status === 'Active').length,
              totalJobs: allJobs.length,
              activeJobs: allJobs.filter(j => j.status === 'Active').length,
              clients: allClients.length,
              config: systemConfig
          }, null, 2);

          const prompt = `Analyze this system state for a recruitment platform. 
          Identify any potential configuration risks, unusual data ratios (e.g. high user inactivity), or security concerns based on the settings. 
          Provide a brief, professional status report with 3 key observations.
          State: ${systemState}`;

          const response = await ai.models.generateContent({
              model: model,
              contents: prompt
          });

          setHealthStatus(response.text || "Analysis complete. System appears nominal.");
      } catch (err) {
          console.error(err);
          setHealthStatus("Error running AI diagnostic. Please check API connectivity.");
      } finally {
          setIsCheckingHealth(false);
      }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn pb-20">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Settings className="text-amber-500"/> System Administration
            </h2>
            <p className="text-slate-500 mt-1">Global settings, security, and data governance.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto max-w-full">
            {(isSuperAdmin || hasPermission('MANAGE_SYSTEM_SETTINGS')) && (
                <button onClick={() => setActiveTab('system')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'system' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>System Config</button>
            )}
            {(isSuperAdmin || hasPermission('ACCESS_ARCHIVES')) && (
                <button onClick={() => setActiveTab('archives')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'archives' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Archives & Retention</button>
            )}
            {(isSuperAdmin) && (
                <button onClick={() => setActiveTab('governance')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'governance' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Governance & Audit</button>
            )}
        </div>
      </div>

      {activeTab === 'governance' && isSuperAdmin && (
          <div className="space-y-6 animate-fadeIn">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 flex items-start gap-4">
                  <div className="bg-white p-3 rounded-full shadow-sm text-indigo-600"><Gavel size={24}/></div>
                  <div>
                      <h3 className="font-bold text-indigo-900 text-lg">Governance Controls</h3>
                      <p className="text-indigo-800 text-sm mt-1 max-w-3xl">
                          Enforce strict data policies and review system-wide activity logs. These settings override regular user permissions.
                      </p>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-white p-2 rounded border border-indigo-100">
                              <input type="checkbox" className="rounded text-indigo-600" checked readOnly /> Enforce Approval Workflows
                          </label>
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-white p-2 rounded border border-indigo-100">
                              <input type="checkbox" className="rounded text-indigo-600" checked readOnly /> Log Sensitive Data Views
                          </label>
                          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 bg-white p-2 rounded border border-indigo-100">
                              <input type="checkbox" className="rounded text-indigo-600" checked={systemConfig?.requireTwoFactor} readOnly /> Strict Access Control
                          </label>
                      </div>
                  </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px]">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2"><List size={18}/> Master Audit Trail</h3>
                      <div className="flex gap-2">
                          <select 
                              className="text-xs border rounded p-1.5 bg-white"
                              value={auditFilterType}
                              onChange={(e) => setAuditFilterType(e.target.value)}
                          >
                              <option value="All">All Actions</option>
                              <option value="System">System</option>
                              <option value="Job">Job</option>
                              <option value="Candidate">Candidate</option>
                              <option value="User">User</option>
                              <option value="Client">Client</option>
                          </select>
                          <div className="relative">
                              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12}/>
                              <input 
                                  className="pl-7 pr-2 py-1.5 border rounded text-xs w-48 outline-none focus:ring-1 focus:ring-indigo-500" 
                                  placeholder="Search logs..."
                                  value={auditSearch}
                                  onChange={(e) => setAuditSearch(e.target.value)}
                              />
                          </div>
                      </div>
                  </div>
                  <div className="flex-1 overflow-auto">
                      <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10 shadow-sm">
                              <tr>
                                  <th className="px-4 py-3">Timestamp</th>
                                  <th className="px-4 py-3">Actor</th>
                                  <th className="px-4 py-3">Action Type</th>
                                  <th className="px-4 py-3">Action</th>
                                  <th className="px-4 py-3">Details</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                              {filteredLogs.length > 0 ? filteredLogs.map(log => (
                                  <tr key={log.id} className="hover:bg-slate-50/80">
                                      <td className="px-4 py-2 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                                          {new Date(log.timestamp).toLocaleString()}
                                      </td>
                                      <td className="px-4 py-2 font-medium text-slate-800">{log.userName}</td>
                                      <td className="px-4 py-2">
                                          <span className={`px-1.5 py-0.5 rounded text-[10px] border ${
                                              log.type === 'System' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                                              log.type === 'Job' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                              log.type === 'Candidate' ? 'bg-green-50 text-green-600 border-green-100' :
                                              'bg-blue-50 text-blue-600 border-blue-100'
                                          }`}>
                                              {log.type}
                                          </span>
                                      </td>
                                      <td className="px-4 py-2 font-medium">{log.action}</td>
                                      <td className="px-4 py-2 max-w-md truncate" title={log.details}>{log.details}</td>
                                  </tr>
                              )) : (
                                  <tr><td colSpan={5} className="p-8 text-center italic text-slate-400">No logs match criteria.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'archives' && (isSuperAdmin || hasPermission('ACCESS_ARCHIVES')) && (
          <div className="space-y-6 animate-fadeIn">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-start gap-4">
                  <div className="bg-white p-3 rounded-full shadow-sm text-amber-600"><Archive size={24}/></div>
                  <div>
                      <h3 className="font-bold text-amber-900 text-lg">Secure Data Archive</h3>
                      <p className="text-amber-800 text-sm mt-1 max-w-3xl">
                          Items are never permanently deleted by staff. They are moved here for compliance and record-keeping. 
                          Only Super Admins can reinstate records.
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-amber-800 font-mono bg-amber-100/50 p-2 rounded w-fit border border-amber-200">
                          <label className="font-semibold flex items-center gap-2"><Clock size={16}/> Retention Policy:</label>
                          <input 
                              type="number" 
                              min="30"
                              max="3650"
                              className="w-20 border border-amber-300 rounded p-1 text-center bg-white text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                              value={systemConfig?.retentionDays || 90}
                              onChange={(e) => handleConfigChange('retentionDays', parseInt(e.target.value))}
                          />
                          <span className="text-xs font-bold uppercase opacity-70">Days</span>
                      </div>
                  </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div className="flex gap-2">
                          <button onClick={() => setArchiveType('User')} className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 ${archiveType === 'User' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><Users size={16}/> Team ({archivedUsers.length})</button>
                          <button onClick={() => setArchiveType('Job')} className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 ${archiveType === 'Job' ? 'bg-white shadow text-orange-600' : 'text-slate-500'}`}><FileText size={16}/> Jobs ({archivedJobs.length})</button>
                          <button onClick={() => setArchiveType('Client')} className={`px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 ${archiveType === 'Client' ? 'bg-white shadow text-purple-600' : 'text-slate-500'}`}><Building2 size={16}/> Clients ({archivedClients.length})</button>
                      </div>
                      <div className="relative w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                          <input className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500" placeholder="Search archive..." value={archiveSearch} onChange={e => setArchiveSearch(e.target.value)}/>
                      </div>
                  </div>

                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600">
                          <thead className="bg-slate-50 font-medium text-slate-500">
                              <tr>
                                  <th className="px-6 py-3">Name / Title</th>
                                  <th className="px-6 py-3">Archived Date</th>
                                  <th className="px-6 py-3">Reason</th>
                                  <th className="px-6 py-3 text-right">Action</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {archiveType === 'User' && archivedUsers.map(u => (
                                  <tr key={u.id} className="hover:bg-slate-50">
                                      <td className="px-6 py-3 font-medium text-slate-800">{u.name} <span className="text-slate-400 font-normal">({u.role})</span></td>
                                      <td className="px-6 py-3">{u.archivedAt ? new Date(u.archivedAt).toLocaleDateString() : 'N/A'}</td>
                                      <td className="px-6 py-3 italic">{u.archiveReason}</td>
                                      <td className="px-6 py-3 text-right"><button onClick={() => setReinstateModal({isOpen: true, id: u.id})} className="text-green-600 hover:underline text-xs font-bold flex items-center gap-1 ml-auto"><RefreshCcw size={12}/> Reinstate</button></td>
                                  </tr>
                              ))}
                              {archiveType === 'Job' && archivedJobs.map(j => (
                                  <tr key={j.id} className="hover:bg-slate-50">
                                      <td className="px-6 py-3 font-medium text-slate-800">{j.title} <span className="text-slate-400 font-normal">({j.listingReference})</span></td>
                                      <td className="px-6 py-3">{j.archivedAt ? new Date(j.archivedAt).toLocaleDateString() : 'N/A'}</td>
                                      <td className="px-6 py-3 italic">{j.archiveReason}</td>
                                      <td className="px-6 py-3 text-right"><button onClick={() => setReinstateModal({isOpen: true, id: j.id})} className="text-green-600 hover:underline text-xs font-bold flex items-center gap-1 ml-auto"><RefreshCcw size={12}/> Reinstate</button></td>
                                  </tr>
                              ))}
                              {archiveType === 'Client' && archivedClients.map(c => (
                                  <tr key={c.id} className="hover:bg-slate-50">
                                      <td className="px-6 py-3 font-medium text-slate-800">{c.name}</td>
                                      <td className="px-6 py-3">{c.archivedAt ? new Date(c.archivedAt).toLocaleDateString() : 'N/A'}</td>
                                      <td className="px-6 py-3 italic">{c.archiveReason}</td>
                                      <td className="px-6 py-3 text-right"><button onClick={() => setReinstateModal({isOpen: true, id: c.id})} className="text-green-600 hover:underline text-xs font-bold flex items-center gap-1 ml-auto"><RefreshCcw size={12}/> Reinstate</button></td>
                                  </tr>
                              ))}
                              {((archiveType === 'User' && archivedUsers.length === 0) || (archiveType === 'Job' && archivedJobs.length === 0) || (archiveType === 'Client' && archivedClients.length === 0)) && (
                                  <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">No archived records found.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'system' && (isSuperAdmin || hasPermission('MANAGE_SYSTEM_SETTINGS')) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                  
                  {/* AI Diagnostics */}
                  <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
                      <div className="relative z-10">
                          <div className="flex justify-between items-start mb-4">
                              <h3 className="font-bold text-lg flex items-center gap-2"><Zap className="text-yellow-400"/> System Health Check</h3>
                              <button 
                                  onClick={runAiHealthCheck}
                                  disabled={isCheckingHealth}
                                  className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                              >
                                  {isCheckingHealth ? <Loader2 size={14} className="animate-spin"/> : <Activity size={14}/>}
                                  Run Diagnostics
                              </button>
                          </div>
                          <p className="text-slate-300 text-sm mb-4">
                              Use AI to analyze current system parameters, user ratios, and configuration risks.
                          </p>
                          {healthStatus && (
                              <div className="bg-black/30 rounded-lg p-4 border border-white/10 animate-fadeIn">
                                  <pre className="text-xs font-mono text-green-300 whitespace-pre-wrap">{healthStatus}</pre>
                              </div>
                          )}
                      </div>
                      <Activity size={120} className="absolute -right-4 -bottom-4 text-white opacity-5"/>
                  </div>

                  {/* Communication & Chat Configuration */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><MessageSquare size={18} className="text-indigo-600"/> Communication & Chat Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="flex items-center justify-between text-sm text-slate-700 mb-3">
                                  <span>Enable File Sharing</span>
                                  <button onClick={() => handleConfigChange('enableChatFileSharing', !systemConfig?.enableChatFileSharing)} className={systemConfig?.enableChatFileSharing ? "text-green-600" : "text-slate-300"}>
                                      {systemConfig?.enableChatFileSharing ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
                                  </button>
                              </label>
                              <label className="flex items-center justify-between text-sm text-slate-700 mb-3">
                                  <span>Enable Giphy/Stickers</span>
                                  <button onClick={() => handleConfigChange('enableChatGiphy', !systemConfig?.enableChatGiphy)} className={systemConfig?.enableChatGiphy ? "text-green-600" : "text-slate-300"}>
                                      {systemConfig?.enableChatGiphy ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
                                  </button>
                              </label>
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Chat Message Retention (Days)</label>
                              <input 
                                  type="number"
                                  min="30"
                                  max="3650"
                                  className="w-full border border-slate-200 rounded p-2 text-sm"
                                  value={systemConfig?.chatRetentionDays || 365}
                                  onChange={(e) => handleConfigChange('chatRetentionDays', parseInt(e.target.value))}
                              />
                              <p className="text-[10px] text-slate-400 mt-1">Messages older than this will be archived.</p>
                          </div>
                      </div>
                  </div>

                  {/* Financial & Commission Settings */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><CreditCard size={18} className="text-emerald-600"/> Financial & Commission Configuration</h3>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Standard Commission Rate (%)</label>
                              <input 
                                type="number"
                                step="0.1"
                                className="w-full border border-slate-200 rounded p-2 text-sm"
                                value={systemConfig?.standardCommissionRate || 0}
                                onChange={(e) => handleConfigChange('standardCommissionRate', parseFloat(e.target.value))}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Commission Flat Fee</label>
                              <input 
                                type="number"
                                className="w-full border border-slate-200 rounded p-2 text-sm"
                                value={systemConfig?.commissionFlatFee || 0}
                                onChange={(e) => handleConfigChange('commissionFlatFee', parseFloat(e.target.value))}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Default Currency</label>
                              <select 
                                className="w-full border border-slate-200 rounded p-2 text-sm bg-slate-50"
                                value={systemConfig?.defaultCurrency}
                                onChange={(e) => handleConfigChange('defaultCurrency', e.target.value)}
                              >
                                  <option value="ZAR">ZAR (South African Rand)</option>
                                  <option value="USD">USD (US Dollar)</option>
                                  <option value="GBP">GBP (British Pound)</option>
                                  <option value="EUR">EUR (Euro)</option>
                              </select>
                          </div>
                      </div>
                  </div>

                  {/* Global Configuration */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Settings size={18}/> Global Configuration</h3>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Company Name</label>
                              <input 
                                className="w-full border border-slate-200 rounded p-2 text-sm"
                                value={systemConfig?.companyName}
                                onChange={(e) => handleConfigChange('companyName', e.target.value)}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Support Email</label>
                              <input 
                                className="w-full border border-slate-200 rounded p-2 text-sm"
                                value={systemConfig?.supportEmail}
                                onChange={(e) => handleConfigChange('supportEmail', e.target.value)}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Theme Mode</label>
                              <select 
                                className="w-full border border-slate-200 rounded p-2 text-sm bg-slate-50"
                                value={systemConfig?.themeColor}
                                onChange={(e) => handleConfigChange('themeColor', e.target.value)}
                              >
                                  <option value="Slate">Slate Professional</option>
                                  <option value="Blue">Ocean Blue</option>
                                  <option value="Green">Eco Green</option>
                              </select>
                          </div>
                      </div>
                  </div>

                  {/* Regional & Localization */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Globe size={18}/> Regional & System Defaults</h3>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Timezone</label>
                              <select 
                                className="w-full border border-slate-200 rounded p-2 text-sm bg-slate-50"
                                value={systemConfig?.timezone}
                                onChange={(e) => handleConfigChange('timezone', e.target.value)}
                              >
                                  <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                                  <option value="Europe/London">Europe/London (GMT)</option>
                                  <option value="America/New_York">America/New_York (EST)</option>
                                  <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Date Format</label>
                              <select 
                                className="w-full border border-slate-200 rounded p-2 text-sm bg-slate-50"
                                value={systemConfig?.dateFormat}
                                onChange={(e) => handleConfigChange('dateFormat', e.target.value)}
                              >
                                  <option value="DD/MM/YYYY">DD/MM/YYYY (UK/SA)</option>
                                  <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">System Language</label>
                              <select 
                                className="w-full border border-slate-200 rounded p-2 text-sm bg-slate-50"
                                value={systemConfig?.systemLanguage}
                                onChange={(e) => handleConfigChange('systemLanguage', e.target.value)}
                              >
                                  <option value="English (UK)">English (UK)</option>
                                  <option value="English (US)">English (US)</option>
                                  <option value="Afrikaans">Afrikaans</option>
                                  <option value="Zulu">Zulu</option>
                                  <option value="Xhosa">Xhosa</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Backup Preference</label>
                              <select 
                                className="w-full border border-slate-200 rounded p-2 text-sm bg-slate-50"
                                value={systemConfig?.backupFrequency}
                                onChange={(e) => handleConfigChange('backupFrequency', e.target.value)}
                              >
                                  <option value="Daily">Daily (Automated)</option>
                                  <option value="Weekly">Weekly</option>
                                  <option value="Monthly">Monthly</option>
                              </select>
                          </div>
                      </div>
                  </div>

                  {/* Security & Access */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Shield size={18}/> Security & Access</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className="flex items-center justify-between text-sm text-slate-700 mb-3">
                                  <span>Maintenance Mode</span>
                                  <button onClick={() => handleConfigChange('maintenanceMode', !systemConfig?.maintenanceMode)} className={systemConfig?.maintenanceMode ? "text-red-600" : "text-slate-300"}>
                                      {systemConfig?.maintenanceMode ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
                                  </button>
                              </label>
                              <label className="flex items-center justify-between text-sm text-slate-700 mb-3">
                                  <span>Allow Guest Access</span>
                                  <button onClick={() => handleConfigChange('allowGuestAccess', !systemConfig?.allowGuestAccess)} className={systemConfig?.allowGuestAccess ? "text-green-600" : "text-slate-300"}>
                                      {systemConfig?.allowGuestAccess ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
                                  </button>
                              </label>
                              <label className="flex items-center justify-between text-sm text-slate-700 mb-3">
                                  <span>Require 2FA (Staff)</span>
                                  <button onClick={() => handleConfigChange('requireTwoFactor', !systemConfig?.requireTwoFactor)} className={systemConfig?.requireTwoFactor ? "text-green-600" : "text-slate-300"}>
                                      {systemConfig?.requireTwoFactor ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
                                  </button>
                              </label>
                              <label className="flex items-center justify-between text-sm text-slate-700 mb-3">
                                  <span>Auto-Backup Enabled</span>
                                  <button onClick={() => handleConfigChange('autoBackup', !systemConfig?.autoBackup)} className={systemConfig?.autoBackup ? "text-blue-600" : "text-slate-300"}>
                                      {systemConfig?.autoBackup ? <ToggleRight size={28}/> : <ToggleLeft size={28}/>}
                                  </button>
                              </label>
                          </div>
                          <div className="space-y-3">
                              <div>
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Session Timeout (Minutes)</label>
                                  <input 
                                      type="number" 
                                      className="w-full border border-slate-200 rounded p-2 text-sm" 
                                      value={systemConfig?.sessionTimeoutMinutes}
                                      onChange={(e) => handleConfigChange('sessionTimeoutMinutes', Number(e.target.value))}
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-medium text-slate-500 mb-1">Max Upload Size (MB)</label>
                                  <input 
                                      type="number" 
                                      className="w-full border border-slate-200 rounded p-2 text-sm" 
                                      value={systemConfig?.maxUploadSizeMB}
                                      onChange={(e) => handleConfigChange('maxUploadSizeMB', Number(e.target.value))}
                                  />
                              </div>
                          </div>
                      </div>
                  </div>
                  
                  {/* Feature Toggles */}
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Globe size={18}/> Feature Modules</h3>
                      <div className="space-y-4">
                          <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-600">Enable AI Candidate Assistant</span>
                              <button onClick={() => handleConfigChange('enableCandidateAI', !systemConfig?.enableCandidateAI)} className="text-slate-400 hover:text-indigo-600">
                                  {systemConfig?.enableCandidateAI ? <ToggleRight size={32} className="text-indigo-600"/> : <ToggleLeft size={32}/>}
                              </button>
                          </div>
                          <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-600">Enable Help Centre</span>
                              <button onClick={() => handleConfigChange('enableCandidateFAQs', !systemConfig?.enableCandidateFAQs)} className="text-slate-400 hover:text-green-600">
                                  {systemConfig?.enableCandidateFAQs ? <ToggleRight size={32} className="text-green-600"/> : <ToggleLeft size={32}/>}
                              </button>
                          </div>
                          <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-600">Allow Direct Recruiter Messaging</span>
                              <button onClick={() => handleConfigChange('enableCandidateRecruiterMessaging', !systemConfig?.enableCandidateRecruiterMessaging)} className="text-slate-400 hover:text-green-600">
                                  {systemConfig?.enableCandidateRecruiterMessaging ? <ToggleRight size={32} className="text-green-600"/> : <ToggleLeft size={32}/>}
                              </button>
                          </div>
                      </div>
                  </div>
                  
                  {/* Emergency Access */}
                  <div className="bg-red-50 border border-red-100 rounded-xl p-6">
                      <h3 className="font-bold text-red-900 mb-4 flex items-center gap-2"><Lock size={18}/> Emergency Client Portal Access</h3>
                      <div className="flex flex-col md:flex-row gap-4 items-end">
                          <div className="flex-1 w-full">
                              <label className="block text-xs font-bold text-red-800 mb-1 uppercase">Current Master Code</label>
                              <div className="relative">
                                  <input 
                                      type={showCode ? "text" : "password"} 
                                      className="w-full border border-red-200 rounded p-2 pr-10 text-sm font-mono bg-white"
                                      value={tempCode}
                                      onChange={(e) => setTempCode(e.target.value)}
                                  />
                                  <button 
                                      onClick={() => setShowCode(!showCode)}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                  >
                                      {showCode ? <EyeOff size={16}/> : <Eye size={16}/>}
                                  </button>
                              </div>
                          </div>
                          <div className="flex gap-2">
                              <button 
                                  onClick={generateDailyCode}
                                  className="flex items-center gap-2 px-3 py-2 bg-white border border-red-200 text-red-700 text-sm font-medium rounded hover:bg-red-100 transition-colors"
                              >
                                  <RefreshCw size={14}/> Regenerate
                              </button>
                              <button 
                                  onClick={saveCode}
                                  className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded hover:bg-red-700 shadow-sm"
                              >
                                  Update
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
              
              {/* Deployment Side Panel */}
              <div className="lg:col-span-1 space-y-6">
                   <div className="bg-slate-800 text-slate-300 rounded-xl p-6 border border-slate-700 shadow-xl">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Cloud size={18}/> Deployment Guide</h3>
                        <div className="flex bg-slate-700/50 p-1 rounded-lg mb-4">
                            <button onClick={() => setDeployMode('subdomain')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${deployMode === 'subdomain' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Subdomain</button>
                            <button onClick={() => setDeployMode('root')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${deployMode === 'root' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Root</button>
                        </div>
                        <div className="text-[10px] text-slate-400 space-y-2">
                            <p>1. Add domain in Firebase Console.</p>
                            <p>2. Add CNAME record: <strong className="text-white">{deployMode === 'subdomain' ? 'jobs' : '@'}</strong> pointing to <strong>the-hiring-org.web.app</strong>.</p>
                        </div>
                   </div>
              </div>
          </div>
      )}

      {/* Reinstate Modal */}
      {reinstateModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-green-50">
                      <h3 className="text-lg font-bold text-green-800 flex items-center gap-2"><RefreshCcw size={20}/> Restore {archiveType}</h3>
                      <button onClick={() => setReinstateModal({isOpen: false, id: null})}><X size={20} className="text-green-600 opacity-50 hover:opacity-100"/></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <p className="text-sm text-slate-600">This item will be moved back to the active list.</p>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Reinstatement</label>
                          <select className="w-full border p-2 rounded-lg" value={reinstateReason} onChange={(e) => setReinstateReason(e.target.value)}>
                              <option value="">-- Select Reason --</option>
                              {REINSTATE_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                              <option value="Other">Other</option>
                          </select>
                      </div>
                      {reinstateReason === 'Other' && (
                          <input 
                              className="w-full border p-2 rounded-lg text-sm" 
                              placeholder="Specify reason..." 
                              value={customReinstateReason} 
                              onChange={(e) => setCustomReinstateReason(e.target.value)}
                          />
                      )}
                      <div className="flex justify-end gap-2 pt-2">
                          <button onClick={() => setReinstateModal({isOpen: false, id: null})} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                          <button onClick={handleReinstateSubmit} disabled={!reinstateReason} className={`px-6 py-2 text-white font-medium rounded-lg shadow-sm ${!reinstateReason ? 'bg-slate-300' : 'bg-green-600 hover:bg-green-700'}`}>Confirm Restore</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SuperAdminSettings;