
export interface User {
  id: string;
  email: string;
  fullName: string;
  groupName: string;
  phone: string;
  telegramLink?: string;
  uniqueCode: string;
  role: 'user' | 'admin';
  avatarUrl?: string;
  createdAt: string;

  fullNameStatus?: 'pending' | 'approved' | 'rejected';
  fullNameNote?: string;
  avatarStatus?: 'pending' | 'approved' | 'rejected';
  avatarNote?: string;
  nameLocked?: boolean;
  banDeadline?: string;
  emailConfirmed?: boolean; 
}

export interface Team {
  id: string;
  name: string;
  captainId: string;
  createdAt: string;
  renameDeadline?: string;

  nameStatus?: 'pending' | 'approved' | 'rejected';
  nameNote?: string;
  pendingRename?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}


export interface Invitation {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserCode: string;
  teamId: string;
  teamName: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  expiresAt?: string;
}


export interface TeamMember {
  userId: string;
  fullName: string;
  groupName: string;
  uniqueCode: string;
  role: 'captain' | 'member';
  joinedAt: string;
  invitationStatus?: 'pending' | 'accepted'; 
}




export interface Case {
  id: string;
  title: string;
  description: string;
  maxTeams: number;
  slotsAvailable: number;
  isActive: boolean;
  submissionDeadline?: string;
}


export interface CasePriority {
  caseId: string;
  priority: number; 
}


export interface Invitation {
  id: string;
  fromUserId: string;
  toUserCode: string;
  teamId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  expiresAt?: string;
}


export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}


export interface HackathonConfig {
  minTeamSize: number; 
  maxTeamSize: number; 
  caseSelectionStartTime: string; 
  cases: Partial<Case>[];
}