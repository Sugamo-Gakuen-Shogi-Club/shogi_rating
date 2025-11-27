
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
  char: string;
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

export type SystemTitle = 'MASTER' | 'RISING_STAR' | 'GRINDER' | 'GIANT_KILLER';

export interface TitleDef {
    id: SystemTitle;
    name: string;
    english: string;
    description: string;
    color: string;
}

export interface User {
  id: string;
  name: string;
  reading?: string;
  isNewMember: boolean;
  rate: number;
  faction?: 'RED' | 'WHITE';
  isGeneral: boolean;
  
  // System Title (The Four Kings)
  systemTitle: SystemTitle | null;

  // Icon System
  activeIconId: string;
  unlockedIcons: string[];

  // Point Breakdown
  totalPoints: number;
  pointsMatch: number;
  pointsAttendance: number;
  pointsSpecial: number;

  monthlyPoints: number;
  eventPoints: number;

  currentStreak: number;
  maxStreak: number;
  wins: number;
  losses: number;
  draws: number;
  lastAttendance: string | null;
  activityDays: number;
  rateHistory: RateHistoryPoint[];
  achievements: string[];
  activeTitle: string | null; // Cosmetic title
  avatarColor: string;
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
  isDuel?: boolean;
}

export interface SystemSettings {
  adminPin: string;
  eventName: string | null;
  eventType: EventType;
  eventEndsAt: string | null;
  eventMultiplier: number;
  currentSeason: Season;
  lastMonthlyReset: string;
  lastTitleUpdate: string | null;
}

export interface ActivityLog {
  id: string;
  userId: string;
  type: ActivityType;
  points: number;
  description: string;
  date: string;
}

export interface PointBreakdown {
    base: number;
    streakBonus: number;
    newMemberBonus: number;
    eventMultiplier: number;
    total: number;
}

export interface MatchProcessResult {
  p1RateChange: number;
  p2RateChange: number;
  p1PointsDetail: PointBreakdown;
  p2PointsDetail: PointBreakdown;
  p1PointsEarned: number;
  p2PointsEarned: number;
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
