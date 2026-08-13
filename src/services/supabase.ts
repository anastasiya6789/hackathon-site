import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Team, Case, Invitation, HackathonConfig } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase env vars not set — using mock mode');
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://mock.supabase.co',
  supabaseAnonKey || 'mock-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: { 'X-Client-Info': 'hackathon-frontend/v1' },
    },
  }
);

// 🧪 Mock-данные для разработки (пока нет бэкенда)
export const mockUser: User = {
  id: 'mock-user-id',
  fullName: 'Иван Иванов',
  groupName: 'ИТ-201',
  phone: '+7 (999) 123-45-67',
  telegramLink: 'https://t.me/ivanov',
  uniqueCode: 'A1B 2C3',
  createdAt: new Date().toISOString(),
};

export const mockTeam: Team = {
  id: 'mock-team-id',
  name: 'Команда #001',
  captainId: 'mock-user-id',
  createdAt: new Date().toISOString(),
  members: [
    {
      userId: 'mock-user-id',
      fullName: 'Иван Иванов',
      groupName: 'ИТ-201',
      uniqueCode: 'A1B 2C3',
      role: 'captain',
      joinedAt: new Date().toISOString(),
    },
  ],
};

export const mockCases: Case[] = [
  {
    id: 'case-1',
    title: 'Кейс #1: Умный кампус',
    description: 'Разработайте концепцию цифрового помощника для студентов...',
    maxTeams: 5,
    slotsAvailable: 3,
    isActive: true,
  },
  {
    id: 'case-2',
    title: 'Кейс #2: Эко-трекер',
    description: 'Создайте приложение для мониторинга экологической обстановки...',
    maxTeams: 5,
    slotsAvailable: 5,
    isActive: true,
  },
  {
    id: 'case-3',
    title: 'Кейс #3: AI-репетитор',
    description: 'Прототип системы персонализированного обучения...',
    maxTeams: 5,
    slotsAvailable: 0, // занят
    isActive: true,
  },
];

export const mockConfig: HackathonConfig = {
  minTeamSize: 2,
  maxTeamSize: 5,
  caseSelectionStartTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // завтра
  cases: mockCases.map(c => ({ id: c.id, title: c.title, maxTeams: c.maxTeams })),
};