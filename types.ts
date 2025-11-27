

export enum ActivityType {
  MATCH_WIN = 'MATCH_WIN',
  MATCH_LOSS = 'MATCH_LOSS',
  MATCH_DRAW = 'MATCH_DRAW',
  ATTENDANCE = 'ATTENDANCE',
  CONTRIBUTION = 'CONTRIBUTION',
  BONUS = 'BONUS'
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  conditionType: 'WINS' | 'STREAK' | 'RATE' | 'DAYS' | 'MATCHES' | 'SPECIAL';
  threshold: number;
}

export interface IconDef {
  id: string;
  char: string; // Emoji or Character. If special ID 'DEFAULT_INITIAL', handled dynamically.
  name: string;
  conditionDescription: string;
  type: 'DEFAULT' | 'RATE' | 'WINS' | 'STREAK' | 'SPECIAL' | 'MATCHES';
  category: 'DEFAULT' | 'SHOGI' | 'CHESS' | 'SPECIAL' | 'RANK';
  threshold?: number;
}

export interface RateHistoryPoint {
  date: string;
  rate: number;
}

// 5 Seasons definition (Updated)
export enum Season {
  TERM_1_EARLY = '1学期前半',
  TERM_1_LATE = '1学期後半',
  TERM_2_EARLY = '2学期前半',
  TERM_2_LATE = '2学期後半',
  TERM_3 = '3学期'
}

export enum EventType {
  STANDARD = '通常イベント',
  FACTION_WAR = '紅白戦'
}

export interface User {
  id: string;
  name: string;
  reading?: string; // Hiragana reading for sorting/filtering
  isNewMember: boolean;
  rate: number;
  faction?: 'RED' | 'WHITE'; // Team assignment
  isGeneral: boolean; // Faction Leader (Taisho)
  
  // Icon System
  activeIconId: string;
  unlockedIcons: string[];

  // Point Breakdown
  totalPoints: number;      // Sum of below
  pointsMatch: number;      // Points from matches
  pointsAttendance: number; // Points from attendance
  pointsSpecial: number;    // Points from admin/contribution

  monthlyPoints: number; // Resets monthly
  eventPoints: number;   // Resets per event, used for Faction War specific scoring

  currentStreak: number; // Winning streak
  maxStreak: number;
  wins: number;
  losses: number;
  draws: number;
  lastAttendance: string | null; // ISO Date string
  activityDays: number; // Number of days attended
  rateHistory: RateHistoryPoint[];
  achievements: string[]; // Array of Achievement IDs
  activeTitle: string | null; // Currently selected title
  avatarColor: string; // Background gradient class
}

export interface MatchRecord {
  id: string;
  date: string;
  player1Id: string;
  player2Id: string;
  result: 'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW';
  p1RateChange: number;
  p2RateChange: number;
  p1PointsEarned: number;
  p2PointsEarned: number;
  isDuel?: boolean; // General vs General
}

export interface SystemSettings {
  adminPin: string;
  // Event config
  eventName: string | null;
  eventType: EventType;
  eventEndsAt: string | null; // ISO Date string
  eventMultiplier: number;
  
  currentSeason: Season; // Current Season Context
  lastMonthlyReset: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  type: ActivityType;
  points: number;
  description: string;
  date: string;
}

// Point breakdown details for UI display
export interface PointBreakdown {
    base: number;
    streakBonus: number;
    newMemberBonus: number;
    eventMultiplier: number; // 1 if none
    total: number;
}

// Return types for actions
export interface MatchProcessResult {
  p1RateChange: number;
  p2RateChange: number;
  
  p1PointsDetail: PointBreakdown;
  p2PointsDetail: PointBreakdown;

  p1PointsEarned: number; // total
  p2PointsEarned: number; // total
  
  newAchievementsP1: AchievementDef[];
  newAchievementsP2: AchievementDef[];
  
  newIconsP1: IconDef[];
  newIconsP2: IconDef[];
  
  isDuel: boolean;
}

export interface AttendanceResult {
  success: boolean;
  newAchievements: AchievementDef[];
  newIcons: IconDef[];
  message: string;
}

export interface BackupData {
  users: User[];
  matches: MatchRecord[];
  settings: SystemSettings;
  logs: ActivityLog[];
  timestamp: string;
}

export interface RivalData {
  opponentId: string;
  opponentName: string;
  wins: number;
  losses: number;
  draws: number;
  total: number;
  winRate: number;
}