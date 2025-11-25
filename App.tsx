import React, { useState, useEffect } from 'react';
import { ViewState, User, Job, Candidate, Client, ServiceRequest, AccessRequest, SystemTicket, ActivityLog, ChatMessage, ChatGroup, SystemConfig, CommissionRecord, PayrollRecord, UserAvailability, AdminUpdateMetadata, JobAlert, UserNotification, INDUSTRIES } from './types';
import { collection, onSnapshot, setDoc, updateDoc, doc, deleteDoc } from './firebase'; // Using the mock firebase
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import JobList from './components/JobList';
import JobCreator from './components/JobCreator';
import CandidateScreener from './components/CandidateScreener';
import Candidates from './components/Candidates';
import Leads from './components/Leads';
import TeamManagement from './components/TeamManagement';
import Clients from './components/Clients';
import Financials from './components/Financials';
import ExecutiveAnalytics from './components/ExecutiveAnalytics';
import Approvals from './components/Approvals';
import SuperAdminSettings from './components/SuperAdminSettings';
import Commissions from './components/Commissions';
import Payroll from './components/Payroll';
import MonthlyReports from './components/MonthlyReports';
import Tutorials from './components/Tutorials';
import ChatSystem from './components/ChatSystem';
import NotificationsView from './components/NotificationsView';
import CandidatePortal from './components/CandidatePortal';
import ClientPortal from './components/ClientPortal';
import SpecialisedServices from './components/SpecialisedServices';
import UserProfile from './components/UserProfile';
import SystemSupport from './components/SystemSupport';
import Login from './components/Login';
import CoPilot from './components/CoPilot';
import { Globe, Shield, Building2, Monitor } from 'lucide-react';

// Helper to create default admin if no users exist
const DEFAULT_ADMIN: User = {
  id: 'admin-1',
  name: 'System Admin',
  email: 'admin@thehiringorg.co.za',
  password: 'password',
  role: 'SuperAdmin',
  status: 'Active',
  avatar: 'https://ui-avatars.com/api/?name=System+Admin&background=random',
  permissions: [],
  staffNumber: 'STF-001',
  phoneNumber: '+27 11 555 0100',
  officeExtension: '1001',
  createdAt: new Date().toISOString()
};

const DEFAULT_CONFIG: SystemConfig = {
  companyName: 'The Hiring Org',
  supportEmail: 'support@thehiringorg.co.za',
  enableCandidateAI: true,
  enableCandidateFAQs: true,
  enableCandidateRecruiterMessaging: true,
  defaultCurrency: 'ZAR',
  retentionDays: 365,
  maintenanceMode: false,
  allowGuestAccess: true,
  sessionTimeoutMinutes: 60,
  maxUploadSizeMB: 10,
  requireTwoFactor: false,
  themeColor: 'Slate',
  enableChatFileSharing: true,
  enableChatGiphy: true,
  chatRetentionDays: 365,
  timezone: 'Africa/Johannesburg',
  dateFormat: 'DD/MM/YYYY',
  systemLanguage: 'English (UK)',
  autoBackup: true,
  backupFrequency: 'Daily',
  standardCommissionRate: 10,
  commissionFlatFee: 0
};

// Mock Data Generators
const generateMockData = () => {
    // Generate Mock Staff
    const users: User[] = Array.from({ length: 10 }).map((_, i) => {
        const role = i === 0 ? 'Admin' : i < 4 ? 'Hiring Manager' : 'Recruiter';
        return {
            id: `u-mock-${i}`,
            staffNumber: `STF-${String(10+i).padStart(3, '0')}`,
            name: ['Sarah Connor', 'James Bond', 'Ethan Hunt', 'Jason Bourne', 'Jack Ryan', 'Ellen Ripley', 'John Wick', 'Lara Croft', 'Indiana Jones', 'Marty McFly'][i],
            email: `staff${i}@thehiringorg.co.za`,
            role: role as any,
            status: 'Active',
            avatar: `https://ui-avatars.com/api/?name=User+${i}&background=random`,
            permissions: [],
            revenueTarget: 1000000,
            reportsTo: 'admin-1',
            reportsToName: 'System Admin',
            phoneNumber: `+27 82 555 010${i}`,
            officeExtension: `100${i}`,
            availability: 'Online',
            createdAt: new Date(Date.now() - (i * 86400000 * 30)).toISOString() // Staggered start dates
        };
    });

    const clients: Client[] = Array.from({ length: 10 }).map((_, i) => ({
        id: `cli-mock-${i}`,
        uin: `CLT-${10000 + i}`,
        name: ['Acme Corp', 'Global Tech', 'Sunrise Mining', 'Apex Financial', 'MediCare Plus', 'Green Energy Solutions', 'BuildRight Construction', 'AgriGrow', 'Urban Logistics', 'BlueSky Consulting'][i],
        contactPerson: ['John Smith', 'Sarah Jones', 'Mike Brown', 'Emily Davis', 'David Wilson', 'Lisa Taylor', 'Robert Miller', 'Jessica White', 'William Harris', 'Karen Martin'][i],
        email: `contact${i}@client.com`,
        phone: `+27 11 555 020${i}`,
        industry: INDUSTRIES[i % INDUSTRIES.length],
        contractNature: i % 3 === 0 ? 'Retainer' : 'Placement Fee',
        budget: (i + 1) * 500000,
        paymentStatus: i === 3 ? 'Overdue' : 'Good Standing',
        allocatedBudget: (i + 1) * 200000,
        paidAmount: (i + 1) * 100000,
        clientStatus: 'Active',
        standardFee: 15,
        ownerName: 'System Admin',
        ownerId: 'admin-1',
        createdAt: new Date().toISOString(),
        portalAccess: true,
        password: 'password123'
    }));

    const jobs: Job[] = Array.from({ length: 10 }).map((_, i) => ({
        id: `job-mock-${i}`,
        clientId: clients[i % clients.length].id,
        title: ['Senior Developer', 'Financial Manager', 'Mining Engineer', 'HR Specialist', 'Nurse Manager', 'Solar Technician', 'Site Foreman', 'Agronomist', 'Logistics Coordinator', 'Business Analyst'][i],
        department: ['IT', 'Finance', 'Operations', 'Human Resources', 'Healthcare', 'Engineering', 'Construction', 'Agriculture', 'Logistics', 'Consulting'][i],
        industry: INDUSTRIES[i % INDUSTRIES.length],
        location: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Sandton'][i % 5],
        description: `We are seeking a qualified professional for this role. Responsible for leading key projects and ensuring operational excellence within the ${INDUSTRIES[i % INDUSTRIES.length]} sector.`,
        responsibilities: ['Manage daily operations', 'Lead team meetings', 'Report to senior management', 'Ensure compliance with regulations'],
        requirements: ['Degree in relevant field', '5+ years experience', 'Strong communication skills', 'Proficiency in industry software'],
        desirableSkills: ['Project Management', 'Leadership', 'Data Analysis'],
        benefits: ['Medical Aid', 'Pension Fund', 'Performance Bonus'],
        listingReference: `JOB-2024-${100 + i}`,
        applyBy: new Date(Date.now() + 86400000 * 30).toISOString(),
        status: 'Active',
        createdAt: new Date().toISOString(),
        type: 'Full-time',
        salaryType: 'Range',
        salaryMin: 30000 + (i * 5000),
        salaryMax: 45000 + (i * 5000),
        salaryCurrency: 'ZAR',
        postedBy: users[i % users.length].id,
        recruiterName: users[i % users.length].name,
        recruiterAvatar: users[i % users.length].avatar
    }));

    const candidates: Candidate[] = Array.from({ length: 10 }).map((_, i) => ({
        id: `cand-mock-${i}`,
        name: ['Alice Johnson', 'Bob Williams', 'Charlie Brown', 'Diana Miller', 'Evan Davis', 'Fiona Wilson', 'George Moore', 'Hannah Taylor', 'Ian Anderson', 'Julia Thomas'][i],
        email: `candidate${i}@email.com`,
        role: jobs[i % jobs.length].id, // Applied to a job
        status: ['New', 'Screened', 'Interview', 'Hired', 'New'][i % 5] as any,
        experienceYears: 3 + i,
        location: ['Johannesburg', 'Cape Town', 'Durban'][i % 3],
        skills: ['Communication', 'Management', 'Microsoft Office', 'Teamwork'],
        applicationDate: new Date().toISOString(),
        cvText: "Experienced professional with a proven track record in the industry. Dedicated to achieving results and driving business growth.",
        screeningResult: {
            matchScore: 60 + (i * 3),
            summary: "Candidate shows strong potential based on experience matching job requirements.",
            strengths: ["Experience", "Education"],
            weaknesses: ["Specific tool knowledge"],
            matchingSkills: ["Management", "Teamwork"]
        }
    }));

    return { users, clients, jobs, candidates };
};

type AppDomain = 'jobs' | 'staff' | 'client';

const App: React.FC = () => {
  const [currentDomain, setCurrentDomain] = useState<AppDomain>('staff'); // Default to staff for dev
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD); 
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [impersonatingAdmin, setImpersonatingAdmin] = useState<User | null>(null);
  const [chatTargetId, setChatTargetId] = useState<string | null>(null);
  const [impersonatingClientId, setImpersonatingClientId] = useState<string | null>(null); // New state for client impersonation

  // Data Collections
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [systemTickets, setSystemTickets] = useState<SystemTicket[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(DEFAULT_CONFIG);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize / Load Data
  useEffect(() => {
    // Mock Firebase Listeners
    const unsubUsers = onSnapshot(collection(null, 'users'), (snap: any) => {
        const data = snap.docs.map((d: any) => d.data());
        if (data.length === 0) {
            // Always ensure Admin exists
            setDoc(doc(null, 'users', DEFAULT_ADMIN.id), DEFAULT_ADMIN);
            
            // Inject Full Mock Data Suite if empty
            const mocks = generateMockData();
            mocks.users.forEach(u => setDoc(doc(null, 'users', u.id), u));
            mocks.clients.forEach(c => setDoc(doc(null, 'clients', c.id), c));
            mocks.jobs.forEach(j => setDoc(doc(null, 'jobs', j.id), j));
            mocks.candidates.forEach(c => setDoc(doc(null, 'candidates', c.id), c));
        } else {
            setUsers(data);
        }
    });
    
    const unsubJobs = onSnapshot(collection(null, 'jobs'), (snap: any) => setJobs(snap.docs.map((d: any) => d.data())));
    const unsubCandidates = onSnapshot(collection(null, 'candidates'), (snap: any) => setCandidates(snap.docs.map((d: any) => d.data())));
    const unsubClients = onSnapshot(collection(null, 'clients'), (snap: any) => setClients(snap.docs.map((d: any) => d.data())));
    const unsubServices = onSnapshot(collection(null, 'serviceRequests'), (snap: any) => setServiceRequests(snap.docs.map((d: any) => d.data())));
    const unsubAccess = onSnapshot(collection(null, 'accessRequests'), (snap: any) => setAccessRequests(snap.docs.map((d: any) => d.data())));
    const unsubTickets = onSnapshot(collection(null, 'tickets'), (snap: any) => setSystemTickets(snap.docs.map((d: any) => d.data())));
    const unsubLogs = onSnapshot(collection(null, 'logs'), (snap: any) => setActivityLogs(snap.docs.map((d: any) => d.data())));
    const unsubMessages = onSnapshot(collection(null, 'messages'), (snap: any) => setMessages(snap.docs.map((d: any) => d.data())));
    const unsubGroups = onSnapshot(collection(null, 'chatGroups'), (snap: any) => setChatGroups(snap.docs.map((d: any) => d.data())));
    const unsubComms = onSnapshot(collection(null, 'commissions'), (snap: any) => setCommissions(snap.docs.map((d: any) => d.data())));
    const unsubPayroll = onSnapshot(collection(null, 'payroll'), (snap: any) => setPayrollRecords(snap.docs.map((d: any) => d.data())));
    
    const unsubConfig = onSnapshot(collection(null, 'config'), (snap: any) => {
        if (!snap.empty) setSystemConfig(snap.docs[0].data());
        else setDoc(doc(null, 'config', 'main'), DEFAULT_CONFIG);
    });

    return () => {
        // Cleanup listeners
    };
  }, []);

  // Domain Detection Logic (Simulated)
  useEffect(() => {
      const hostname = window.location.hostname;
      if (hostname.startsWith('jobs.')) setCurrentDomain('jobs');
      else if (hostname.startsWith('client.')) setCurrentDomain('client');
      else if (hostname.startsWith('staff.')) setCurrentDomain('staff');
      // Default to staff for localhost if not overridden
  }, []);

  const logActivity = (action: string, details: string, type: ActivityLog['type']) => {
      if (!currentUser) return;
      const log: ActivityLog = {
          id: `log-${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          action,
          details,
          type,
          timestamp: new Date().toISOString()
      };
      setDoc(doc(null, 'logs', log.id), log);
  };

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      setCurrentView(ViewState.DASHBOARD);
      logActivity('Login', 'User logged into the system', 'System');
  };

  const handleLogout = () => {
      if (impersonatingAdmin) {
          setCurrentUser(impersonatingAdmin);
          setImpersonatingAdmin(null);
          logActivity('Stop Impersonation', 'Returned to admin account', 'System');
      } else {
          setCurrentUser(null);
          setCurrentView(ViewState.LOGIN);
      }
  };

  const handleSaveJob = (j: Job) => { 
      if(jobs.find(job => job.id === j.id)) updateDoc(doc(null, 'jobs', j.id), j);
      else setDoc(doc(null, 'jobs', j.id), j);
      setCurrentView(ViewState.JOBS);
      logActivity(j.status === 'Active' ? 'Publish Job' : 'Save Job', `Job: ${j.title}`, 'Job');
  };

  const handleDeleteJob = (id: string) => {
      const job = jobs.find(j => j.id === id);
      if(job) {
          updateDoc(doc(null, 'jobs', id), { ...job, status: 'Archived', isArchived: true, archivedAt: new Date().toISOString() });
          logActivity('Archive Job', `Archived: ${job.title}`, 'Job');
      }
  };

  const handleAddUser = (u: User) => { 
      // Sequential Staff ID Logic
      let nextNum = 1;
      if (users.length > 0) {
          const maxId = users.reduce((max, user) => {
              // Extract number from STF-XXX
              const strNum = user.staffNumber?.replace('STF-', '') || '0';
              const num = parseInt(strNum, 10);
              return !isNaN(num) && num > max ? num : max;
          }, 0);
          nextNum = maxId + 1;
      }
      
      const autoStaffId = `STF-${String(nextNum).padStart(3, '0')}`;
      
      const newUserWithId = {
          ...u,
          staffNumber: autoStaffId,
          createdAt: new Date().toISOString()
      };

      setDoc(doc(null, 'users', u.id), newUserWithId); 
      logActivity('Add User', `Added ${u.name} (${autoStaffId})`, 'Team'); 
  };

  const handleUpdateUser = (u: User) => { updateDoc(doc(null, 'users', u.id), u); if(currentUser?.id === u.id) setCurrentUser(u); logActivity('Update User', `Updated ${u.name}`, 'Team'); };
  
  const handleAddClient = (c: Client) => { setDoc(doc(null, 'clients', c.id), c); logActivity('Add Client', `Added ${c.name}`, 'Client'); };
  const handleUpdateClient = (c: Client) => { updateDoc(doc(null, 'clients', c.id), c); logActivity('Update Client', `Updated ${c.name}`, 'Client'); };

  const handleCreateGroup = (group: ChatGroup) => {
      setDoc(doc(null, 'chatGroups', group.id), group);
      logActivity('Create Group', `Created chat group: ${group.name}`, 'System');
  };

  const handleUpdateGroup = (group: ChatGroup) => {
      updateDoc(doc(null, 'chatGroups', group.id), group);
  };

  const handleSendMessage = (text: string, type: any, recipientId?: string, fileData?: any, metadata?: any, isPinned?: boolean, replyToId?: string, groupId?: string) => {
      if (!currentUser) return;
      const msg: ChatMessage = {
          id: `msg-${Date.now()}`,
          senderId: currentUser.id,
          recipientId,
          groupId,
          text,
          type,
          fileName: fileData?.name,
          fileUrl: fileData?.url,
          timestamp: new Date().toISOString(),
          read: false,
          metadata,
          isPinned,
          replyToId
      };
      setDoc(doc(null, 'messages', msg.id), msg);
  };

  // --- Domain Routing ---

  if (currentDomain === 'jobs') {
      return (
          <>
            <CandidatePortal 
                jobs={jobs} 
                candidates={candidates} 
                onApply={(c) => { 
                    if(candidates.find(cand => cand.id === c.id)) updateDoc(doc(null, 'candidates', c.id), c);
                    else setDoc(doc(null, 'candidates', c.id), c); 
                }} 
                onSubscribe={(email, keywords) => console.log(email, keywords)}
                onLoginClick={() => {
                    // In real world, this would redirect to staff.thehiringorg.co.za
                    setCurrentDomain('staff'); 
                }}
                onRegister={(c) => setDoc(doc(null, 'candidates', c.id), c)}
                systemConfig={systemConfig}
            />
            <DevDomainSwitcher current={currentDomain} onChange={setCurrentDomain}/>
          </>
      );
  }

  if (currentDomain === 'client') {
      return (
          <>
            <ClientPortal 
                clients={clients}
                jobs={jobs}
                serviceRequests={serviceRequests}
                onLogin={() => {}}
                onRequestService={(req) => setDoc(doc(null, 'serviceRequests', req.id), req)}
                onRegister={(c) => setDoc(doc(null, 'clients', c.id), c)}
                onBackToLogin={() => {
                    // Handled internally in component for now, or reset state
                }}
                systemConfig={systemConfig}
                initialClient={impersonatingClientId ? clients.find(c => c.id === impersonatingClientId) : null}
                onBackToAdmin={impersonatingClientId ? () => {
                    setImpersonatingClientId(null);
                    setCurrentDomain('staff');
                } : undefined}
            />
            <DevDomainSwitcher current={currentDomain} onChange={setCurrentDomain}/>
          </>
      );
  }

  // STAFF DOMAIN (Default / Internal OS)
  if (!currentUser) {
      return (
          <>
            <Login 
                users={users} 
                onLogin={handleLogin} 
                onRegister={handleAddUser} 
                onPublicView={() => setCurrentDomain('jobs')}
                onClientPortal={() => setCurrentDomain('client')}
            />
            <DevDomainSwitcher current={currentDomain} onChange={setCurrentDomain}/>
          </>
      );
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar 
          currentView={currentView} 
          setView={setCurrentView} 
          currentUser={currentUser} 
          onLogout={handleLogout}
          impersonatingAdmin={impersonatingAdmin}
          onStopImpersonation={() => { setCurrentUser(impersonatingAdmin); setImpersonatingAdmin(null); }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          pendingCount={jobs.filter(j => j.status === 'Pending Approval').length}
          chatUnreadCount={messages.filter(m => m.recipientId === currentUser?.id && !m.read).length}
          allUsers={users}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Mobile Header Toggle */}
          <div className="md:hidden bg-slate-800 text-white p-4 flex items-center justify-between">
              <div className="font-bold">The Hiring Org</div>
              <button onClick={() => setIsSidebarOpen(true)}>Menu</button>
          </div>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
              {currentView === ViewState.DASHBOARD && <Dashboard jobs={jobs} candidates={candidates} onViewJobs={() => setCurrentView(ViewState.JOBS)} />}
              {currentView === ViewState.JOBS && <JobList jobs={jobs} clients={clients} candidates={candidates} currentUser={currentUser} onEdit={(id) => { /* Navigate to edit */ }} onDelete={handleDeleteJob} />}
              {currentView === ViewState.CREATE_JOB && <JobCreator onSave={handleSaveJob} onCancel={() => setCurrentView(ViewState.JOBS)} currentUser={currentUser} users={users} clients={clients} nextRefNumber={`JOB-${jobs.length + 1001}`} />}
              {currentView === ViewState.SCREENING && <CandidateScreener jobs={jobs} onScreeningComplete={(c) => { setDoc(doc(null, 'candidates', c.id), c); }} />}
              {currentView === ViewState.CANDIDATES_LIST && <Candidates candidates={candidates} jobs={jobs} currentUser={currentUser} />}
              {currentView === ViewState.LEADS && <Leads jobs={jobs} candidates={candidates} />}
              
              {currentView === ViewState.TEAM && (
                  <TeamManagement 
                      users={users} 
                      jobs={jobs} 
                      currentUser={currentUser} 
                      activityLogs={activityLogs} 
                      onAddUser={handleAddUser} 
                      onUpdateUser={handleUpdateUser} 
                      onRemoveUser={(id, reason, notes) => {
                          const user = users.find(u => u.id === id);
                          if (user) {
                              updateDoc(doc(null, 'users', id), { ...user, isArchived: true, archiveReason: reason, archivedAt: new Date().toISOString() });
                              logActivity('Archive User', `Archived ${user.name}: ${reason}`, 'Team');
                          }
                      }} 
                      onApproveUser={(id, reason, notes) => {
                          const user = users.find(u => u.id === id);
                          if (user) {
                              updateDoc(doc(null, 'users', id), { ...user, status: 'Active', approvedBy: currentUser?.id, approvedAt: new Date().toISOString() });
                              logActivity('Approve User', `Approved ${user.name}`, 'Team');
                          }
                      }}
                      onRejectUser={(id, reason, notes) => {
                          const user = users.find(u => u.id === id);
                          if (user) {
                              updateDoc(doc(null, 'users', id), { ...user, status: 'Rejected', rejectionReason: reason });
                              logActivity('Reject User', `Rejected ${user.name}`, 'Team');
                          }
                      }}
                      onUpdateStatus={(id, status, reason, notes) => {
                          const user = users.find(u => u.id === id);
                          if (user) {
                              updateDoc(doc(null, 'users', id), { ...user, status, statusChangeReason: reason });
                              logActivity('Update Status', `Set ${user.name} to ${status}`, 'Team');
                          }
                      }} 
                      onTransferPortfolio={(from, to, jobIds) => { 
                          jobIds.forEach(jid => {
                              const job = jobs.find(j => j.id === jid);
                              const newOwner = users.find(u => u.id === to);
                              if (job && newOwner) {
                                  updateDoc(doc(null, 'jobs', jid), { ...job, postedBy: to, recruiterName: newOwner.name, recruiterAvatar: newOwner.avatar });
                              }
                          });
                          logActivity('Portfolio Transfer', `Transferred ${jobIds.length} jobs`, 'Team');
                      }} 
                      onUpdateAvatar={(id, url) => {
                          const user = users.find(u => u.id === id);
                          if (user) updateDoc(doc(null, 'users', id), { ...user, avatar: url });
                      }} 
                      onMessageUser={(userId) => { setChatTargetId(userId); setCurrentView(ViewState.CHAT); }} 
                      onImpersonateUser={(targetUser) => {
                          setImpersonatingAdmin(currentUser);
                          setCurrentUser(targetUser);
                          setCurrentView(ViewState.DASHBOARD);
                          logActivity('Impersonation', `Admin started impersonating ${targetUser.name}`, 'System');
                      }}
                  />
              )}

              {currentView === ViewState.CLIENTS && <Clients 
                  clients={clients} 
                  jobs={jobs} 
                  users={users} 
                  currentUser={currentUser} 
                  onAddClient={handleAddClient} 
                  onUpdateClient={handleUpdateClient} 
                  onAddExpense={(id, exp) => { /* logic */ }}
                  onSendMessage={(text, recipientId) => handleSendMessage(text, 'text', recipientId)} 
                  onAccessPortal={(clientId) => {
                      setImpersonatingClientId(clientId);
                      setCurrentDomain('client');
                  }}
              />}
              {currentView === ViewState.FINANCIALS && <Financials clients={clients} jobs={jobs} currentUser={currentUser} onUpdateClient={handleUpdateClient} onAddExpense={(id, exp) => { /* logic */ }} />}
              {currentView === ViewState.EXECUTIVE_ANALYTICS && <ExecutiveAnalytics jobs={jobs} candidates={candidates} users={users} clients={clients} activityLogs={activityLogs} />}
              {currentView === ViewState.APPROVALS && <Approvals jobs={jobs} users={users} currentUser={currentUser} activityLogs={activityLogs} onApproveJob={(id) => { /* logic */ }} onDeleteJob={handleDeleteJob} onRejectJobDeletion={() => {}} onApproveUser={() => {}} onRejectUser={() => {}} onRemoveUser={() => {}} onViewJob={() => {}} />}
              {currentView === ViewState.SUPER_ADMIN_SETTINGS && <SuperAdminSettings currentUser={currentUser} systemConfig={systemConfig} onUpdateConfig={(c) => setDoc(doc(null, 'config', 'main'), c)} allUsers={users} allJobs={jobs} allClients={clients} activityLogs={activityLogs} />}
              {currentView === ViewState.COMMISSIONS && <Commissions records={commissions} users={users} currentUser={currentUser} />}
              {currentView === ViewState.PAYROLL && <Payroll records={payrollRecords} users={users} candidates={candidates} onAddRecord={(r) => setDoc(doc(null, 'payroll', r.id), r)} onUpdateStatus={() => {}} onDeleteRecord={() => {}} />}
              {currentView === ViewState.MONTHLY_REPORTS && <MonthlyReports jobs={jobs} users={users} commissions={commissions} candidates={candidates} currentUser={currentUser} activityLogs={activityLogs} />}
              {currentView === ViewState.TUTORIALS && <Tutorials currentUser={currentUser} />}
              {currentView === ViewState.CHAT && <ChatSystem 
                  currentUser={currentUser} 
                  users={users} 
                  clients={clients}
                  messages={messages} 
                  chatGroups={chatGroups} 
                  onSendMessage={handleSendMessage} 
                  onUpdateStatus={() => {}} 
                  onViewNotifications={() => setCurrentView(ViewState.NOTIFICATIONS)} 
                  initialActiveChatId={chatTargetId}
                  onCreateGroup={handleCreateGroup}
                  onUpdateGroup={handleUpdateGroup} 
              />}
              {currentView === ViewState.NOTIFICATIONS && <NotificationsView currentUser={currentUser} onMarkAsRead={() => {}} onClearAll={() => {}} onDeleteNotification={() => {}} />}
              {currentView === ViewState.SPECIALISED_SERVICES && <SpecialisedServices serviceRequests={serviceRequests} users={users} onUpdateStatus={() => {}} currentUser={currentUser} />}
              {currentView === ViewState.PROFILE && currentUser && <UserProfile currentUser={currentUser} onUpdateUser={handleUpdateUser} activityLogs={activityLogs} allUsers={users} />}
              {currentView === ViewState.SUPPORT && <SystemSupport currentUser={currentUser} tickets={systemTickets} onCreateTicket={(t) => setDoc(doc(null, 'tickets', t.id), t)} onResolveTicket={() => {}} />}
              
              {/* GEMINI CO-PILOT (ALWAYS ON) */}
              {currentUser && (
                  <CoPilot 
                    jobs={jobs} 
                    candidates={candidates} 
                    clients={clients} 
                    users={users} 
                    currentUser={currentUser}
                  />
              )}
          </main>
      </div>
      <DevDomainSwitcher current={currentDomain} onChange={setCurrentDomain}/>
    </div>
  );
};

// Helper Component for Dev Environment to simulate Domains
const DevDomainSwitcher = ({ current, onChange }: { current: AppDomain, onChange: (d: AppDomain) => void }) => (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl z-[100] flex items-center gap-4 text-xs font-mono border border-slate-700 animate-fadeIn">
        <div className="flex items-center gap-2">
            <Monitor size={14} className="text-blue-400"/>
            <span className="text-slate-400">Domain Simulator:</span>
        </div>
        <div className="flex bg-slate-800 rounded p-1">
            <button 
                onClick={() => onChange('jobs')}
                className={`px-3 py-1 rounded transition-all ${current === 'jobs' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
                jobs.
            </button>
            <button 
                onClick={() => onChange('staff')}
                className={`px-3 py-1 rounded transition-all ${current === 'staff' ? 'bg-orange-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
                staff.
            </button>
            <button 
                onClick={() => onChange('client')}
                className={`px-3 py-1 rounded transition-all ${current === 'client' ? 'bg-green-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
            >
                client.
            </button>
        </div>
    </div>
);

export default App;