// 👤 Пользователь
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
  // 🔥 Поля модерации
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
  // 🔥 Поля модерации команды
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

// 📨 Приглашение в команду
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

// 👥 Участник команды (расширенный)
export interface TeamMember {
  userId: string;
  fullName: string;
  groupName: string;
  uniqueCode: string;
  role: 'captain' | 'member';
  joinedAt: string;
  invitationStatus?: 'pending' | 'accepted'; // для отображения статуса приглашения
}



// 🎯 Кейс
export interface Case {
  id: string;
  title: string;
  description: string;
  maxTeams: number;
  slotsAvailable: number;
  isActive: boolean;
  submissionDeadline?: string;
}

// 📋 Приоритет кейса для команды
export interface CasePriority {
  caseId: string;
  priority: number; // 1 = высший приоритет
}

// 📨 Приглашение
export interface Invitation {
  id: string;
  fromUserId: string;
  toUserCode: string;
  teamId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  expiresAt?: string;
}

// 🔐 Ответы API
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// 🎛️ Настройки хакатона (для админа)
export interface HackathonConfig {
  minTeamSize: number; // 2
  maxTeamSize: number; // 5
  caseSelectionStartTime: string; // ISO timestamp
  cases: Partial<Case>[];
}