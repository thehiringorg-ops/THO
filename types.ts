
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  status: 'Active' | 'Pending' | 'Frozen';
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface Client {
  id: string;
  name: string;
  logo: string;
  contactPerson: string;
  email: string;
  phone: string;
  website?: string;
  
  // New Fields
  industry?: string;
  address?: string;
  isHotlist?: boolean;
  ownerId?: string;
  ownerName?: string;

  // Footprints
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  
  // Financials (SuperAdmin Only)
  contractNature?: 'Retainer' | 'Project-based' | 'Hourly' | 'Placement Fee' | 'SLA';
  budget?: number;
  allocatedBudget?: number;
  paidAmount?: number;
  paymentStatus?: 'Good Standing' | 'Owing' | 'Overdue';
  expenses?: Expense[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  details: string;
  type: 'Job' | 'Client' | 'Candidate' | 'System' | 'Team';
  timestamp: string;
}

export interface Job {
  id: string;
  clientId?: string;
  title: string;
  department: string;
  industry: string;
  location: string;
  
  // International Specifics
  isInternational?: boolean;
  country?: string;
  zipCode?: string;
  dialCode?: string;

  description: string;
  responsibilities: string[];
  requirements: string[];
  desirableSkills: string[];
  benefits: string[];

  listingReference: string;
  applyBy: string;
  
  // Updated statuses
  status: 'Draft' | 'Active' | 'Closed' | 'Pending Approval' | 'Suspended' | 'Pending Deletion' | 'Archived'; 
  createdAt: string;
  dateOpened?: string; // New: Set when approved
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance';
  
  salaryType: 'Fixed' | 'Range' | 'Market Related' | 'Negotiable';
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string; // New: Default 'ZAR'

  postedBy: string;
  recruiterName: string;
  recruiterAvatar: string;

  // Action Footprints
  lastActionBy?: string;      // Name of user who performed last status change
  lastActionReason?: string;  // Mandatory reason typed by user
  lastActionDate?: string;    // Timestamp of change
}

export interface ScreeningResult {
  matchScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  matchingSkills?: string[];
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

export interface Candidate {
  id: string;
  avatar?: string; // New
  name: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  location?: string; 
  
  role: string; 
  noticePeriod?: string; 
  experienceYears?: number;
  skills?: string[];
  languages?: string[]; 
  
  employmentHistory?: EmploymentItem[]; 
  education?: EducationItem[]; 
  
  cvText: string; 
  documents?: string[];
  screeningResult?: ScreeningResult;
  status: 'New' | 'Screened' | 'Interview' | 'Rejected' | 'Hired';
  
  timeline?: TimelineEvent[]; // New
  applicationDate?: string;
}

export interface Subscriber {
  email: string;
  keywords: string[];
}

export enum ViewState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  JOBS = 'JOBS',
  CREATE_JOB = 'CREATE_JOB',
  SCREENING = 'SCREENING',
  CANDIDATE_PORTAL = 'CANDIDATE_PORTAL',
  TEAM = 'TEAM',
  CLIENTS = 'CLIENTS',
  CANDIDATES_LIST = 'CANDIDATES_LIST', 
  LEADS = 'LEADS',
  FINANCIALS = 'FINANCIALS', // New
}
