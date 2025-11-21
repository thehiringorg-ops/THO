
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import JobCreator from './components/JobCreator';
import CandidateScreener from './components/CandidateScreener';
import JobList from './components/JobList';
import CandidatePortal from './components/CandidatePortal';
import Login from './components/Login';
import TeamManagement from './components/TeamManagement';
import Clients from './components/Clients';
import Candidates from './components/Candidates';
import Leads from './components/Leads';
import Financials from './components/Financials';
import { ViewState, Job, Candidate, Subscriber, User, Client, ActivityLog, Expense } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.CANDIDATE_PORTAL);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [nextJobSequence, setNextJobSequence] = useState(104);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // --- Data State ---
  const [users, setUsers] = useState<User[]>([
    {
      id: 'u0',
      name: 'The Chairman',
      email: 'chairman@thehiringorg.co.za',
      role: 'SuperAdmin', // 1st Tier
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces'
    },
    {
      id: 'u1',
      name: 'Sarah Jenkins',
      email: 'sarah.j@thehiringorg.co.za',
      role: 'Recruiter',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces'
    },
    {
      id: 'u2',
      name: 'Mike Ross',
      email: 'mike.r@thehiringorg.co.za',
      role: 'Hiring Manager',
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=faces'
    },
    {
      id: 'u3',
      name: 'Jessica Pearson',
      email: 'jessica.p@thehiringorg.co.za',
      role: 'Admin', // 2nd Tier
      status: 'Active',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces'
    }
  ]);
  
  const [clients, setClients] = useState<Client[]>([
    { 
        id: 'c1', 
        name: 'TechFin Solutions', 
        contactPerson: 'David Miller', 
        email: 'd.miller@techfin.com', 
        phone: '+27 11 888 1234', 
        logo: '', 
        website: 'https://example.com',
        industry: 'Fintech',
        address: '12 Sandton Dr, Sandton, 2196',
        isHotlist: true,
        ownerName: 'Jessica Pearson',
        ownerId: 'u3',
        createdBy: 'u3',
        createdByName: 'Jessica Pearson',
        createdAt: new Date(Date.now() - 1000000000).toISOString(),
        
        // Financials Mock
        contractNature: 'Retainer',
        budget: 1200000,
        allocatedBudget: 450000,
        paidAmount: 300000,
        paymentStatus: 'Good Standing',
        expenses: [
            { id: 'e1', description: 'Q1 Retainer Fee', amount: 100000, date: '2024-01-15', status: 'Paid' },
            { id: 'e2', description: 'Recruitment Ad Spend', amount: 50000, date: '2024-02-01', status: 'Paid' },
            { id: 'e3', description: 'Q2 Retainer Fee', amount: 100000, date: '2024-04-15', status: 'Pending' }
        ]
    },
    { 
        id: 'c2', 
        name: 'Creative Studio', 
        contactPerson: 'Amanda Cole', 
        email: 'amanda@studio.co.za', 
        phone: '+27 21 444 5678', 
        logo: '', 
        website: 'https://example.com',
        industry: 'Marketing',
        address: '8 Long Street, Cape Town, 8001',
        isHotlist: false,
        ownerName: 'Sarah Jenkins',
        ownerId: 'u1',
        createdBy: 'u3',
        createdByName: 'Jessica Pearson',
        createdAt: new Date(Date.now() - 800000000).toISOString(),

        // Financials Mock
        contractNature: 'Project-based',
        budget: 500000,
        allocatedBudget: 500000,
        paidAmount: 100000,
        paymentStatus: 'Overdue',
        expenses: [
            { id: 'e4', description: 'Initial Deposit', amount: 100000, date: '2024-03-10', status: 'Paid' },
            { id: 'e5', description: 'Milestone 1 Delivery', amount: 200000, date: '2024-05-01', status: 'Overdue' }
        ]
    }
  ]);

  const [jobs, setJobs] = useState<Job[]>([
    {
      id: '1',
      clientId: 'c1',
      title: 'Senior Frontend Engineer',
      department: 'Engineering',
      industry: 'Software Development',
      location: 'Johannesburg, Gauteng',
      description: 'We are looking for a Senior Frontend Engineer to lead our UI development initiatives.',
      responsibilities: ['Lead React development', 'Mentor juniors', 'Collaborate with UX', 'Optimise performance'],
      requirements: ['5+ years frontend exp', 'React, TypeScript, CSS', 'State management', 'Browser performance'],
      desirableSkills: ['Next.js', 'GraphQL', 'AWS'],
      benefits: ['Competitive salary', 'Remote-first', 'Learning budget'],
      listingReference: 'THO-0101',
      applyBy: '2024-12-31',
      status: 'Active',
      createdAt: new Date().toISOString(),
      dateOpened: new Date().toISOString(),
      type: 'Full-time',
      salaryType: 'Range',
      salaryMin: 850000,
      salaryMax: 1200000,
      salaryCurrency: 'ZAR',
      postedBy: 'u1',
      recruiterName: 'Sarah Jenkins',
      recruiterAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces',
      lastActionBy: 'The Chairman',
      lastActionReason: 'Initial approval for Q4 hiring plan.',
      lastActionDate: new Date().toISOString()
    },
    {
      id: '2',
      clientId: 'c2',
      title: 'UX/UI Designer',
      department: 'Design',
      industry: 'Creative / Design',
      location: 'Cape Town, Western Cape',
      description: 'Seeking a creative UX/UI Designer.',
      responsibilities: ['Wireframes', 'Visual design', 'User research', 'Design systems'],
      requirements: ['3+ years exp', 'Figma', 'Portfolio', 'Presentation skills'],
      desirableSkills: ['HTML/CSS', 'Animation'],
      benefits: ['Studio environment', 'MacBook Pro', 'Team lunches'],
      listingReference: 'THO-0102',
      applyBy: '2024-11-15',
      status: 'Active',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      dateOpened: new Date(Date.now() - 86000000).toISOString(),
      type: 'Full-time',
      salaryType: 'Range',
      salaryMin: 450000,
      salaryMax: 650000,
      salaryCurrency: 'ZAR',
      postedBy: 'u2',
      recruiterName: 'Mike Ross',
      recruiterAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop&crop=faces'
    }
  ]);

  const [candidates, setCandidates] = useState<Candidate[]>([
    {
      id: 'APP-982310',
      name: 'Nandi Dlamini',
      email: 'nandi.d@example.co.za',
      role: '1',
      cvText: 'Experienced React developer...',
      status: 'Screened',
      location: 'Johannesburg',
      noticePeriod: '30 Days',
      skills: ['React', 'TypeScript', 'Node.js', 'Tailwind CSS'],
      experienceYears: 5,
      applicationDate: new Date().toISOString(),
      timeline: [
          { status: 'Applied', date: new Date().toISOString() },
          { status: 'Screened', date: new Date().toISOString(), note: 'Strong match' }
      ],
      screeningResult: {
        matchScore: 85,
        summary: 'Strong technical fit.',
        strengths: ['React', 'TypeScript'],
        weaknesses: ['No AWS'],
        matchingSkills: ['React', 'TypeScript']
      }
    }
  ]);

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([
    {
      id: 'log-1',
      userId: 'u3',
      userName: 'Jessica Pearson',
      userAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces',
      action: 'Created Client',
      details: 'Added new client: TechFin Solutions',
      type: 'Client',
      timestamp: new Date(Date.now() - 1000000000).toISOString()
    },
    {
      id: 'log-2',
      userId: 'u1',
      userName: 'Sarah Jenkins',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces',
      action: 'Posted Job',
      details: 'Published listing THO-0101 (Senior Frontend Engineer)',
      type: 'Job',
      timestamp: new Date().toISOString()
    }
  ]);

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [candidateProfiles, setCandidateProfiles] = useState<Candidate[]>([]);

  // --- Helpers ---
  const logActivity = (action: string, details: string, type: ActivityLog['type']) => {
      if (!currentUser) return;
      const newLog: ActivityLog = {
          id: `log-${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          action,
          details,
          type,
          timestamp: new Date().toISOString()
      };
      setActivityLogs(prev => [newLog, ...prev]);
  };

  // --- Handlers ---

  const handleLogin = (user: User) => {
    if(user.status === 'Pending') {
      alert("Your account is still pending approval.");
      return;
    }
    if(user.status === 'Frozen') {
      alert("Your account has been frozen. Please contact an Administrator.");
      return;
    }
    setCurrentUser(user);
    setCurrentView(ViewState.DASHBOARD);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView(ViewState.CANDIDATE_PORTAL);
  };

  const handleJobSave = (jobData: Job) => {
    if (editingJob) {
        // We are editing an existing job
        // If user is NOT admin, any edit forces status to 'Pending Approval'
        const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';
        const updatedStatus = isAdmin ? jobData.status : (jobData.status === 'Draft' ? 'Draft' : 'Pending Approval');
        
        const updatedJob = {
            ...jobData,
            id: editingJob.id, // Ensure we keep original ID
            listingReference: editingJob.listingReference, // Ensure reference doesn't change
            createdAt: editingJob.createdAt, // Keep original creation date
            status: updatedStatus,
            lastActionBy: currentUser?.name,
            lastActionReason: isAdmin ? 'Updated by Admin' : 'Edited by Staff - Pending Approval',
            lastActionDate: new Date().toISOString()
        };

        setJobs(jobs.map(j => j.id === editingJob.id ? updatedJob : j));
        
        logActivity(
            'Edited Job',
            `Updated listing ${updatedJob.title} (${updatedJob.listingReference})`,
            'Job'
        );
        
        if(!isAdmin && updatedStatus === 'Pending Approval') {
            alert("Job updated. It is now Pending Approval.");
        }
        
        setEditingJob(null);
    } else {
        // Creating new job
        const newJob = { 
            ...jobData, 
            dateOpened: jobData.status === 'Active' ? new Date().toISOString() : undefined 
        };
        setJobs([newJob, ...jobs]);
        setNextJobSequence(prev => prev + 1);
        
        logActivity(
            jobData.status === 'Draft' ? 'Drafted Job' : 'Posted Job',
            `${jobData.status === 'Draft' ? 'Saved draft' : 'Created listing'} for ${jobData.title} (${jobData.listingReference})`,
            'Job'
        );

        if (jobData.status === 'Active') alert(`Job posted successfully.`);
    }

    setCurrentView(ViewState.JOBS);
  };

  const handleEditJob = (jobId: string) => {
      const jobToEdit = jobs.find(j => j.id === jobId);
      if (jobToEdit) {
          setEditingJob(jobToEdit);
          setCurrentView(ViewState.CREATE_JOB);
      }
  };

  const handleCancelEdit = () => {
      setEditingJob(null);
      setCurrentView(ViewState.JOBS);
  };

  const handleScreeningComplete = (candidate: Candidate) => {
    const updatedCandidate = {
        ...candidate,
        timeline: [
            ...(candidate.timeline || []),
            { status: 'Screened', date: new Date().toISOString(), note: `AI Score: ${candidate.screeningResult?.matchScore}` }
        ]
    };
    setCandidates(prev => {
        const exists = prev.find(c => c.id === candidate.id);
        if (exists) return prev.map(c => c.id === candidate.id ? updatedCandidate : c);
        return [updatedCandidate, ...prev];
    });
    logActivity('Screened Candidate', `AI Screen completed for ${candidate.name} (Score: ${candidate.screeningResult?.matchScore}%)`, 'Candidate');
  };

  const handleCandidateApplication = (candidate: Candidate) => {
    const newCandidate = {
        ...candidate,
        applicationDate: new Date().toISOString(),
        timeline: [{ status: 'Applied', date: new Date().toISOString() }]
    };
    setCandidates([newCandidate, ...candidates]);
  };
  
  const handleCandidateRegistration = (profile: Candidate) => {
    setCandidateProfiles([...candidateProfiles, profile]);
    setCandidates([...candidates, profile]); 
  };

  const handleQuickRegister = (profile: Candidate) => {
      setCandidates([profile, ...candidates]);
      logActivity('Quick Register', `Manually added profile for ${profile.name} from CV upload`, 'Candidate');
  };

  const handleSubscribe = (email: string, keywords: string[]) => {
    setSubscribers(prev => [...prev, { email, keywords }]);
  };

  const handleAddUser = (newUser: User) => {
      setUsers([...users, newUser]);
      logActivity('Added Team Member', `Invited ${newUser.name} as ${newUser.role}`, 'Team');
  };

  const handleRemoveUser = (userId: string) => {
      const user = users.find(u => u.id === userId);
      setUsers(users.filter(u => u.id !== userId));
      logActivity('Removed Team Member', `Removed access for ${user?.name}`, 'Team');
  };

  const handleUpdateUser = (updatedUser: User) => {
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
      logActivity('Updated Team Member', `Updated details for ${updatedUser.name}`, 'Team');
  };

  const handleApproveUser = (userId: string) => {
      const user = users.find(u => u.id === userId);
      setUsers(users.map(u => u.id === userId ? { ...u, status: 'Active' } : u));
      logActivity('Approved User', `Activated account for ${user?.name}`, 'Team');
  };
  
  const handleUpdateUserStatus = (userId: string, newStatus: 'Active' | 'Frozen' | 'Pending') => {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      logActivity('Changed User Status', `Changed status of ${user.name} to ${newStatus}`, 'Team');
  };
  
  const handleUpdateUserAvatar = (userId: string, avatar: string) => {
      setUsers(users.map(u => u.id === userId ? { ...u, avatar } : u));
      if(currentUser?.id === userId) {
          logActivity('Updated Profile', 'Updated profile picture', 'System');
      }
  };

  const handleApproveJob = (jobId: string, reason: string) => {
    const job = jobs.find(j => j.id === jobId);
    setJobs(jobs.map(j => j.id === jobId ? { 
        ...j, 
        status: 'Active', 
        dateOpened: new Date().toISOString(),
        lastActionBy: currentUser?.name,
        lastActionReason: reason,
        lastActionDate: new Date().toISOString()
    } : j));
    logActivity('Approved Job', `Approved listing ${job?.listingReference}. Reason: ${reason}`, 'Job');
  };

  const handleSuspendJob = (jobId: string, reason: string) => {
    const job = jobs.find(j => j.id === jobId);
    setJobs(jobs.map(j => j.id === jobId ? { 
        ...j, 
        status: 'Suspended',
        lastActionBy: currentUser?.name,
        lastActionReason: reason,
        lastActionDate: new Date().toISOString() 
    } : j));
    logActivity('Suspended Job', `Suspended listing ${job?.listingReference}. Reason: ${reason}`, 'Job');
  };

  const handleReinstateJob = (jobId: string, reason: string) => {
    const job = jobs.find(j => j.id === jobId);
    setJobs(jobs.map(j => j.id === jobId ? { 
        ...j, 
        status: 'Active',
        lastActionBy: currentUser?.name,
        lastActionReason: reason,
        lastActionDate: new Date().toISOString()
    } : j));
    logActivity('Reinstated Job', `Reinstated listing ${job?.listingReference}. Reason: ${reason}`, 'Job');
  };

  const handleDeleteJob = (jobId: string) => {
     const job = jobs.find(j => j.id === jobId);
     // Admin (2nd tier) or SuperAdmin (1st tier) can delete
     const canDelete = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';
     
     if(canDelete || job?.status === 'Draft') {
         if(window.confirm("Delete this job permanently?")) {
             setJobs(jobs.filter(j => j.id !== jobId));
             logActivity('Deleted Job', `Permanently deleted ${job?.title} (${job?.listingReference})`, 'Job');
         }
     } else {
         setJobs(jobs.map(j => j.id === jobId ? { ...j, status: 'Pending Deletion' } : j));
         logActivity('Requested Deletion', `Marked ${job?.title} for deletion`, 'Job');
         alert("Job marked for deletion. Admin approval required.");
     }
  };

  const handleAddClient = (clientData: Client) => {
     // Add footprint
     const newClient = {
         ...clientData,
         createdBy: currentUser?.id,
         createdByName: currentUser?.name,
         createdAt: new Date().toISOString()
     };
     setClients([...clients, newClient]);
     logActivity('Created Client', `Added new client: ${clientData.name}`, 'Client');
  };

  const handleUpdateClient = (updatedClient: Client) => {
      setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
      logActivity('Updated Client', `Updated details for ${updatedClient.name}`, 'Client');
  };

  const handleAddExpense = (clientId: string, expense: Expense) => {
      setClients(clients.map(c => {
          if(c.id === clientId) {
              return {
                  ...c,
                  expenses: [...(c.expenses || []), expense]
              };
          }
          return c;
      }));
      logActivity('Added Expense', `Added expense record for client`, 'Client');
  };

  const handleTransferPortfolio = (fromId: string, toId: string) => {
     const fromUser = users.find(u => u.id === fromId);
     const toUser = users.find(u => u.id === toId);
     
     if (!fromUser || !toUser) return;

     // Get jobs owned by Source
     const jobsToTransfer = jobs.filter(j => j.postedBy === fromId);
     
     if (jobsToTransfer.length === 0) {
         alert("No jobs found for the selected source user.");
         return;
     }

     setJobs(jobs.map(j => {
         if (j.postedBy === fromId) {
             return {
                 ...j,
                 postedBy: toId,
                 recruiterName: toUser.name,
                 recruiterAvatar: toUser.avatar
             };
         }
         return j;
     }));
     
     logActivity('Transferred Portfolio', `Transferred ${jobsToTransfer.length} jobs from ${fromUser.name} to ${toUser.name}`, 'System');
     alert(`Successfully transferred ${jobsToTransfer.length} jobs.`);
  };

  // --- Render Logic ---
  const renderContent = () => {
    switch (currentView) {
      case ViewState.LOGIN:
        return (
           <Login 
              users={users} 
              onLogin={handleLogin} 
              onPublicView={() => setCurrentView(ViewState.CANDIDATE_PORTAL)} 
           />
        );
      case ViewState.DASHBOARD:
        return <Dashboard jobs={jobs} candidates={candidates} onViewJobs={() => setCurrentView(ViewState.JOBS)}/>;
      case ViewState.JOBS:
        return (
          <JobList 
            jobs={jobs} 
            clients={clients}
            currentUser={currentUser} 
            onApprove={handleApproveJob} 
            onDelete={handleDeleteJob}
            onSuspend={handleSuspendJob}
            onReinstate={handleReinstateJob}
            onEdit={handleEditJob}
          />
        );
      case ViewState.CREATE_JOB:
        return (
          <JobCreator 
            onSave={handleJobSave} 
            onCancel={handleCancelEdit} 
            currentUser={currentUser}
            clients={clients}
            nextRefNumber={editingJob ? editingJob.listingReference : `THO-${String(nextJobSequence).padStart(4, '0')}`}
            initialData={editingJob}
          />
        );
      case ViewState.SCREENING:
        return (
          <CandidateScreener 
            jobs={jobs} 
            onScreeningComplete={handleScreeningComplete} 
            onQuickRegister={handleQuickRegister}
          />
        );
      case ViewState.TEAM:
        return (
          <TeamManagement 
            users={users} 
            jobs={jobs}
            currentUser={currentUser} 
            activityLogs={activityLogs}
            onAddUser={handleAddUser} 
            onRemoveUser={handleRemoveUser} 
            onUpdateUser={handleUpdateUser}
            onApproveUser={handleApproveUser}
            onUpdateStatus={handleUpdateUserStatus}
            onTransferPortfolio={handleTransferPortfolio}
            onUpdateAvatar={handleUpdateUserAvatar}
          />
        );
      case ViewState.CLIENTS:
        return <Clients clients={clients} jobs={jobs} currentUser={currentUser} onAddClient={handleAddClient} onUpdateClient={handleUpdateClient} />;
      case ViewState.CANDIDATES_LIST:
        return <Candidates candidates={candidates} jobs={jobs} />;
      case ViewState.LEADS:
        return <Leads jobs={jobs} candidates={candidates} />;
      case ViewState.FINANCIALS:
        return (
            <Financials 
                clients={clients} 
                jobs={jobs} 
                currentUser={currentUser} 
                onUpdateClient={handleUpdateClient}
                onAddExpense={handleAddExpense}
            />
        );
      case ViewState.CANDIDATE_PORTAL:
        return (
          <CandidatePortal 
            jobs={jobs}
            candidates={candidates}
            onApply={handleCandidateApplication}
            onSubscribe={handleSubscribe}
            onRegister={handleCandidateRegistration}
            onLoginClick={() => setCurrentView(ViewState.LOGIN)}
          />
        );
      default:
        return <Dashboard jobs={jobs} candidates={candidates} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {currentView === ViewState.CANDIDATE_PORTAL ? (
          renderContent()
      ) : (
          <div className="flex h-screen">
              <Sidebar 
                currentView={currentView} 
                setView={setCurrentView} 
                currentUser={currentUser}
                onLogout={handleLogout}
              />
              <main className="flex-1 ml-64 overflow-y-auto h-screen">
                <div className="p-8">
                   {renderContent()}
                </div>
              </main>
          </div>
      )}
    </div>
  );
};

export default App;
