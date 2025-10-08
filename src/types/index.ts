// User-related types
export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  dailyGoal: number;
}

// Contact-related types
export type ContactCategory = 'HOTLIST' | 'A_LIST' | 'B_LIST' | 'C_LIST' | 'STANDARD';

export interface Contact {
  id: number;
  fullName: string;
  spouseFullName?: string;
  spouseEmail?: string;
  spousePhone?: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  category: ContactCategory;
  lastContacted?: Date;
  nextContactDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
}

// Reminder-related types
export interface Reminder {
  id: number;
  message: string;
  time: Date;
  completed: boolean;
  sentViaText: boolean;
  sentViaEmail: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: number;
}

// Authentication-related types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Interaction types
export type InteractionType = 'CALL' | 'EMAIL' | 'TEXT' | 'IN_PERSON' | 'OTHER' | 'NOTE';

export interface ContactInteraction {
  id: number;
  contactId: number;
  type: InteractionType;
  notes?: string;
  createdAt: Date;
  userId: number;
}

// Goal progress type for new API format
export interface GoalProgress {
  dailyGoal: number;
  contacted: number;
  remaining: number;
  dueToday: number;
}

// Followup settings type
export interface FollowupSettings {
  followupHotlist: number;
  followupAList: number;
  followupBList: number;
  followupCList: number;
  followupStandard: number;
} 
