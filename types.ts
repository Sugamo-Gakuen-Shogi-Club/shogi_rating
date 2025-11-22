
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
  conditionType: 'WINS' | 'STREAK' | 'RATE' | 'DAYS' | 'MATCHES';
  threshold: number;
}

export interface RateHistoryPoint {
  date: string;
  rate: number;
}

export interface User {
  id: string;
  name: string;
  reading?: string; // Hiragana reading for sorting/filtering
  isNewMember: boolean;
  rate: number;
  
  // Point Breakdown
  totalPoints: number;      // Sum of below
  pointsMatch: number;      // Points from matches
  pointsAttendance: number; // Points from attendance
  pointsSpecial: number;    // Points from admin/contribution

  monthlyPoints: number;
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
  avatarColor: string; // Just for UI
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
}

export interface SystemSettings {
  adminPin: string;
  // Event config
  eventName: string | null;
  eventEndsAt: string | null; // ISO Date string
  eventMultiplier: number;
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
}

export interface AttendanceResult {
  success: boolean;
  newAchievements: AchievementDef[];
  message: string;
}

export interface BackupData {
  users: User[];
  matches: MatchRecord[];
  settings: SystemSettings;
  logs: ActivityLog[];
  timestamp: string;
}
