export const INDUSTRIES = [
  "Manufacturing",
  "Mining",
  "Financial Services",
  "Information Technology (IT)",
  "Agriculture & Agro-Processing",
  "Tourism & Hospitality",
  "Renewable Energy",
  "Construction",
  "Retail & FMCG",
  "Telecommunications",
  "Healthcare & Medical Services",
  "Education",
  "Logistics & Supply Chain",
  "Power, Oil & Gas",
  "Business Process Outsourcing (BPO)"
];

export const OTHER_SERVICES = [
  "HR Consulting",
  "Employee Training & Development",
  "Payroll Management"
];

export const APPROVE_REASONS = [
  "Meets All Quality Standards",
  "Urgent Client Request",
  "Correction Verified",
  "Standard Listing Approval",
  "Executive Override"
];

export const SUSPEND_REASONS = [
  "Client Budget Hold",
  "Internal Quality Review",
  "Position Filled (Pending Paperwork)",
  "Information Incomplete",
  "Duplicate Listing Suspected",
  "Client Request"
];

export const REJECT_REASONS = [
  "Duplicate Listing",
  "Inappropriate Content",
  "Client Contract Expired",
  "Formatting/Spelling Errors",
  "Missing Mandatory Fields"
];

export const REINSTATE_REASONS = [
  "Client Re-opened Position",
  "Corrections Made",
  "Internal Review Passed",
  "New Budget Allocation",
  "Restored from Archive",
  "Accidental Deletion"
];

export const RETURN_REASONS = [
  "Description Too Vague",
  "Salary Range Discrepancy",
  "Incorrect Client Assigned",
  "Spelling/Grammar Errors",
  "Missing Mandatory Requirements",
  "Formatting Issues",
  "Duplicate Listing Detected"
];

export const USER_STATUS_REASONS = [
  "New Hire - Probation",
  "Performance Review Pending",
  "Disciplinary Action",
  "Extended Leave / Sabbatical",
  "Resignation / Termination",
  "Account Verification Needed",
  "Contract Ended",
  "Reinstated by Management"
];

export const ARCHIVE_REASONS = [
    "No Longer Active",
    "Resigned / Terminated",
    "Duplicate Entry",
    "Created in Error",
    "Contract Expired",
    "Client Churned",
    "Position Cancelled",
    "Historical Record Only"
];

export const TRANSFER_REASONS = [
  "Staff Resignation / Termination",
  "Role Transition / Promotion",
  "Workload Rebalancing",
  "Extended Leave Coverage",
  "Client Request",
  "Department Restructuring"
];

export const COMMON_ISSUES = [
    "System Freeze / Unresponsive",
    "Data Not Saving",
    "Login / Authentication Failure",
    "Slow Performance / Lag",
    "Error Message Pop-up",
    "Visual Glitch / Layout Issue",
    "Search Not Working",
    "File Upload Failed",
    "Notification Error",
    "Other (Specify below)"
];

export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved';

export interface SystemTicket {
    id: string;
    reporterId: string;
    reporterName: string;
    reporterAvatar: string;
    symptoms: string[]; // Array of checked boxes
    description?: string; // Optional extra details
    priority: TicketPriority;
    status: TicketStatus;
    createdAt: string;
    resolvedAt?: string;
    resolvedBy?: string;
}

// --- ACCESS REQUEST REASONS ---
export const ACCESS_REQUEST_REASONS = [
  "New Role Assignment",
  "Promotion / Level Up",
  "Project Requirement",
  "Temporary Coverage",
  "Internship / Trainee Programme",
  "Re-activation of Duties",
  "Other (Specify)"
];

export const ACCESS_DECISION_REASONS = [
  "Approved - Standard Promotion",
  "Approved - Project Specific",
  "Approved - Temporary Coverage",
  "Denied - Insufficient Tenure",
  "Denied - Training Required",
  "Denied - Security Policy",
  "Denied - Role Does Not Require Access",
  "Clarification Needed"
];

export const TEAM_APPROVAL_REASONS = [
  "Standard New Hire",
  "Contractor Activation",
  "Re-hire / Re-activation",
  "Executive Appointment",
  "Temporary Access Grant"
];

export const TEAM_REJECTION_REASONS = [
  "Identity Not Verified",
  "Duplicate Account",
  "No Longer Employed",
  "Information Incomplete",
  "Security Flag"
];

// --- SYSTEM CONFIGURATION ---
export interface SystemConfig {
  companyName: string;
  supportEmail: string;
  enableCandidateAI: boolean;
  enableCandidateFAQs: boolean;
  enableCandidateRecruiterMessaging: boolean; // Limited exchange
  defaultCurrency: string;
  retentionDays: number;
  superAdminCode?: string; // Master access code for Client Portal
  
  // Extended Settings for Super Admin
  maintenanceMode: boolean;
  allowGuestAccess: boolean;
  sessionTimeoutMinutes: number;
  maxUploadSizeMB: number;
  requireTwoFactor: boolean;
  themeColor: 'Slate' | 'Blue' | 'Green';
  
  // Chat Settings
  enableChatFileSharing: boolean;
  enableChatGiphy: boolean;
  chatRetentionDays: number;

  // Localization & Admin
  timezone: string;
  dateFormat: string;
  systemLanguage: string;
  autoBackup: boolean;
  backupFrequency: 'Daily' | 'Weekly' | 'Monthly';

  // Commission Settings
  standardCommissionRate: number; // %
  commissionFlatFee: number; // Fixed amount
}

// --- PERMISSIONS SYSTEM ---
export type Permission = 
  | 'CREATE_JOB' 
  | 'EDIT_JOB' 
  | 'DELETE_JOB' 
  | 'CREATE_CLIENT' 
  | 'EDIT_CLIENT' 
  | 'VIEW_FINANCIALS' 
  | 'MANAGE_TEAM'
  | 'APPROVE_JOB'
  | 'EMERGENCY_ACCESS'
  | 'MANAGE_SYSTEM_SETTINGS'
  | 'ACCESS_ARCHIVES'
  | 'MANAGE_PAYROLL';

export const AVAILABLE_PERMISSIONS: { id: Permission; label: string; description: string }[] = [
  { id: 'CREATE_JOB', label: 'Create Listings', description: 'Post new job advertisements' },
  { id: 'EDIT_JOB', label: 'Edit Any Listing', description: 'Edit jobs posted by others' },
  { id: 'DELETE_JOB', label: 'Archive Listings', description: 'Move job listings to archive' },
  { id: 'APPROVE_JOB', label: 'Approve Listings', description: 'Approve pending job posts' },
  { id: 'CREATE_CLIENT', label: 'Create Clients', description: 'Add new client profiles' },
  { id: 'EDIT_CLIENT', label: 'Edit Clients', description: 'Update client details and contracts' },
  { id: 'VIEW_FINANCIALS', label: 'View Financials', description: 'Access detailed financial reports' },
  { id: 'MANAGE_TEAM', label: 'Manage Team', description: 'Add or remove team members' },
  { id: 'EMERGENCY_ACCESS', label: 'Emergency Portal Access', description: 'View/Reset Master Client Access Code (Sensitive)' },
  { id: 'MANAGE_SYSTEM_SETTINGS', label: 'System Configuration', description: 'Manage global settings, features, and security' },
  { id: 'ACCESS_ARCHIVES', label: 'Access Archives', description: 'View and restore archived data (SuperAdmin)' },
  { id: 'MANAGE_PAYROLL', label: 'Manage Payroll', description: 'Process salaries, commissions, and contractor payments' }
];

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'Info' | 'Alert' | 'Success' | 'System';
}

export type UserRole = 'SuperAdmin' | 'Admin' | 'Recruiter' | 'Hiring Manager' | 'Guest';
export type UserAvailability = 'Online' | 'Away' | 'Busy' | 'In a Meeting' | 'Out of Office';

export interface User {
  id: string;
  staffNumber?: string; 
  name: string;
  email: string;
  phoneNumber?: string; // New field
  officeExtension?: string; // New field
  role: UserRole;
  status: 'Active' | 'Frozen' | 'Pending' | 'Rejected' | 'Archived';
  avatar: string;
  password?: string; 
  reportsTo?: string; // ID of the manager they report to
  reportsToName?: string; // Name of the manager
  revenueTarget?: number;
  placementsTarget?: number;
  specialisations?: string[]; 
  serviceSpecialisations?: string[]; 
  availability?: UserAvailability;
  notifications?: UserNotification[];
  pinnedChatIds?: string[]; 
  permissions?: Permission[]; // New granular permissions
  // Approval/History fields
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  statusChangeReason?: string;
  statusChangeNotes?: string;
  rejectionReason?: string;
  // Archiving
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;
  createdAt?: string; // Added for Master Register timeline
}

export interface JobVersion {
    id: string;
    savedAt: string;
    savedBy: string;
    data: Partial<Job>; // Snapshot of the job data
    changeSummary?: string;
}

export interface Job {
  id: string;
  clientId: string;
  title: string;
  department: string;
  industry: string;
  location: string;
  isInternational?: boolean; 
  country?: string;
  dialCode?: string; 
  description: string;
  responsibilities: string[];
  requirements: string[];
  desirableSkills: string[];
  benefits: string[];
  listingReference: string;
  applyBy: string;
  status: 'Draft' | 'Pending Approval' | 'Active' | 'Closed' | 'Suspended' | 'Pending Deletion' | 'Archived';
  createdAt: string;
  dateOpened?: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance';
  salaryType: 'Fixed' | 'Range' | 'Hourly' | 'Market Related' | 'Negotiable';
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  postedBy: string;
  recruiterName: string;
  recruiterAvatar: string;
  recruitmentType?: 'Executive Search' | 'Permanent Recruitment' | 'Temporary/Contract Staffing';
  
  // Approval Workflow Fields
  lastActionBy?: string;
  lastActionReason?: string;
  lastActionDate?: string;
  adminNotes?: string; 
  ownerFeedback?: string; 
  approvedBy?: string;
  approvedByName?: string;
  
  // Archiving
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;

  // Version Control
  versions?: JobVersion[];

  // AI Fields
  predictedFillDate?: string; 
  predictionConfidence?: number;
  campaignVariants?: { version: string; text: string; performance: number }[];
}

export interface ScreeningResult {
  matchScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  matchingSkills: string[];
}

export interface EmploymentItem {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface EducationItem {
  institution: string;
  qualification: string;
  year: string;
}

export interface TimelineEvent {
  status: string;
  date: string;
  note?: string;
}

export interface JobAlert {
    id: string;
    keywords: string;
    location: string;
    createdAt: string;
}

export interface CandidateComment {
    id: string;
    text: string;
    authorName: string;
    authorAvatar: string;
    timestamp: string;
}

export interface InterviewAnalysis {
    id: string;
    date: string;
    type: 'Video' | 'Audio';
    score: number; // 0-100
    summary: string;
    sentiment: 'Positive' | 'Neutral' | 'Negative';
    flags: string[];
    transcript: string;
}

export interface ReferenceCheck {
    id: string;
    refereeName: string;
    refereeRole: string;
    company: string;
    date: string;
    summary: string; // AI Generated
    rating: number;
    status: 'Completed' | 'Pending';
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  password?: string; // Added password for login
  role: string; // Job ID applied for
  avatar?: string;
  location?: string;
  phone?: string;
  linkedin?: string;
  experienceYears?: number;
  status: 'New' | 'Screened' | 'Interview' | 'Hired' | 'Rejected';
  cvText?: string;
  skills?: string[];
  languages?: string[];
  screeningResult?: ScreeningResult;
  applicationDate?: string;
  employmentHistory?: EmploymentItem[];
  education?: EducationItem[];
  timeline?: TimelineEvent[];
  noticePeriod?: string;
  internalComments?: CandidateComment[];
  alerts?: JobAlert[];

  // AI Fields
  placementProbability?: number; // 0-100
  placementFactors?: string[];
  flightRisk?: number; // 0-100
  flightRiskDrivers?: string[];
  biasFreeSummary?: string; // Redacted summary for clients
  interviews?: InterviewAnalysis[];
  references?: ReferenceCheck[];
  isRedacted?: boolean; // UI Toggle state
}

export interface ClientDocument {
    id: string;
    name: string;
    type: DocumentType;
    uploadDate: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Archived';
    remarks?: string;
    uploadedBy: string;
    url: string;
}

export type DocumentType = 'SLA' | 'Contract' | 'Compliance' | 'Invoice' | 'Brief' | 'Other';

export interface Expense {
    id: string;
    description: string;
    amount: number;
    date: string;
    status: 'Pending' | 'Paid' | 'Overdue';
}

export type ServiceType = 'Executive Search' | 'Permanent Recruitment' | 'Temporary/Contract Staffing' | 'HR Consulting' | 'Employee Training & Development' | 'Payroll Management';
export type ServiceSubCategory = 'General' | 'Labour Relations / CCMA' | 'Contract Drafting (BCEA)' | 'Policy Development' | 'WSP / ATR Submission (SETA)' | 'Skills Audit' | 'Learnership Management' | 'Monthly Payroll Processing' | 'SARS Tax Submissions (EMP201)';

export interface ServiceRequest {
    id: string;
    clientId: string;
    clientName: string;
    serviceType: ServiceType;
    subCategory?: ServiceSubCategory;
    details: string;
    status: 'Pending' | 'In Progress' | 'Completed';
    date: string;
    assignedStaffId?: string;
    assignedStaffName?: string;
}

export interface Client {
  id: string;
  uin?: string; // Unique Identification Number for Portal Login
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  website?: string;
  logo?: string;
  industry: string;
  contractNature: 'Retainer' | 'Placement Fee' | 'Project-based';
  budget?: number;
  paymentStatus: 'Good Standing' | 'Owing' | 'Overdue';
  allocatedBudget?: number;
  paidAmount?: number;
  expenses?: Expense[];
  address?: string;
  isHotlist?: boolean;
  clientStatus: 'Active' | 'Inactive' | 'Prospect' | 'Pending Approval' | 'Archived';
  companyRegNumber?: string;
  standardFee?: number;
  notes?: string;
  ownerId?: string;
  ownerName?: string;
  delegatedStaffIds?: string[]; // IDs of other staff with access
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  portalAccess?: boolean; // Can they log in?
  password?: string; // Simple password for demo
  tempPin?: string; // Temporary Emergency PIN
  allowedServices?: ServiceType[]; // Which services they can see/request
  documents?: ClientDocument[];
  onboardingCommissionEligible?: boolean; 
  winBackStatus?: 'Active' | 'Lost' | 'Attempted';
  // Archiving
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;
}

export interface AdminUpdateMetadata {
    affectedDepartments?: string[];
    targetRoles?: string[];
    targetSkills?: string[];
    scheduledDate?: string;
    expiresAt?: string;
    category?: AnnouncementCategory;
    notifyEmail?: boolean;
    notifyPush?: boolean;
}

export type AnnouncementCategory = 'General' | 'Urgent' | 'Policy Update' | 'Event' | 'System Maintenance' | 'News' | 'Training' | 'Holiday';

export interface ChatGroup {
    id: string;
    name: string;
    members: string[]; // User IDs
    createdBy: string;
    createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId?: string; // If null and no groupId, it's a general channel message
  groupId?: string; // For group chat messages
  text: string;
  timestamp: string;
  type: 'text' | 'file' | 'celebration' | 'admin_update';
  fileName?: string;
  fileUrl?: string;
  read: boolean;
  readBy?: string[]; // List of user IDs who have read this message
  metadata?: AdminUpdateMetadata;
  isPinned?: boolean;
  // New features
  replyToId?: string;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  deletedForEveryone?: boolean;
  deletedForUsers?: string[]; // userIds
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string; // e.g., "Created Job", "Approved Candidate"
  details: string;
  type: 'Job' | 'Candidate' | 'Client' | 'System' | 'Team';
  timestamp: string;
}

export interface Subscriber {
  email: string;
  keywords: string[];
}

export interface CommissionRecord {
    id: string;
    recipientId: string;
    recipientName: string;
    amount: number;
    status: 'Pending' | 'Processing' | 'Paid';
    month: string; // e.g. "October 2023"
    date: string;
    candidateName: string;
    clientName: string;
    jobTitle: string;
    placementValue: number; // Full fee amount
    commissionRate: number; // %
}

export interface PayrollRecord {
    id: string;
    recipientId: string;
    recipientName: string;
    recipientRole: string; // 'Recruiter', 'Contractor'
    type: 'Salary' | 'Commission' | 'Bonus' | 'Reimbursement' | 'Contractor Pay';
    amount: number;
    status: 'Pending' | 'Processing' | 'Paid';
    payPeriod: string;
    date: string;
    reference?: string;
}

export interface Tutorial {
    id: string;
    title: string;
    description: string;
    duration: string;
    category: string;
    minRoleLevel: number; // 1=Recruiter, 2=Manager, 3=Admin, 4=SuperAdmin
}

export enum ViewState {
  LOGIN,
  DASHBOARD,
  JOBS,
  CREATE_JOB,
  SCREENING,
  CANDIDATES_LIST,
  LEADS,
  TEAM,
  CLIENTS,
  FINANCIALS,
  EXECUTIVE_ANALYTICS,
  APPROVALS,
  SUPER_ADMIN_SETTINGS,
  COMMISSIONS,
  PAYROLL,
  MONTHLY_REPORTS,
  TUTORIALS,
  CHAT,
  NOTIFICATIONS,
  CANDIDATE_PORTAL,
  CLIENT_PORTAL,
  SPECIALISED_SERVICES,
  PROFILE,
  SUPPORT
}

export interface AccessRequestComment {
    id: string;
    text: string;
    authorName: string;
    authorAvatar: string;
    timestamp: string;
    isAdmin: boolean;
}

export interface AccessRequest {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    currentRole: string;
    requestedRole: string;
    reason: string;
    customReason?: string;
    motivation: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    date: string;
    grantedPermissions?: Permission[];
    decisionReason?: string;
    // Required Adjudication Fields for Digital Footprint
    adjudicatedBy?: string;
    adjudicatedByName?: string;
    adjudicatedAt?: string;
    comments?: AccessRequestComment[];
}