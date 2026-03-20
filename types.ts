
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
  conditionType: 'WINS' | 'STREAK' | 'RATE' | 'DAYS' | 'MATCHES' | 'SPECIAL' | 'DRAWS' | 'POINTS' | 'UPSET_WINS';
  threshold: number;
}

export interface IconDef {
  id: string;
  char: string;
  name: string;
  conditionDescription: string;
  type: 'DEFAULT' | 'RATE' | 'WINS' | 'STREAK' | 'SPECIAL' | 'MATCHES' | 'DAYS' | 'DRAWS' | 'POINTS';
  category: 'DEFAULT' | 'SHOGI' | 'CHESS' | 'SPECIAL' | 'RANK' | 'ELITE';
  threshold?: number;
  isLimited?: boolean;
  requiredTitle?: string; // SystemTitle ID — 四天王保持中のみ使用可
}

export interface FrameDef {
  id: string;
  name: string;
  description: string;
  ringClass: string;      // Tailwind ring/border CSS
  gradientStyle?: string; // inline CSS gradient border
  glowClass?: string;
  isEliteOnly: boolean;
  requiredTitle?: string;
}

export interface RateHistoryPoint {
  date: string;
  rate: number;
}

export enum Season {
  TERM_1_EARLY = '１学期前半',
  TERM_1_LATE = '１学期後半',
  SUMMER_CAMP = '夏季合宿',
  TERM_2_EARLY = '２学期前半',
  TERM_2_LATE = '２学期後半',
  WINTER_CAMP = '冬季合宿',
  TERM_3 = '３学期',
  SPRING_CAMP = '春季合宿'
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
  // ★ 追加: 休眠フラグ（falseのとき退部扱い）
  isActive: boolean;
  rate: number;
  faction?: 'RED' | 'WHITE';
  isGeneral: boolean;

  // Seasonal Snapshot
  seasonStartRate: number;
  seasonStartPoints: number;

  // System Title (The Four Kings)
  systemTitle: SystemTitle[];  // 兼任可：複数保持可能

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
  upsetWins: number;      // 格上撃破（レート差+100以上）の累計
  lossStreak: number;     // 現在の連敗数（comeback 判定用）
  wins: number;
  losses: number;
  draws: number;
  lastAttendance: string | null;
  activityDays: number;
  rateHistory: RateHistoryPoint[];
  achievements: string[];
  activeTitle: string | null;
  avatarColor: string;
  // ★ 承認済み級位・段位
  ranks: RankEntry[];
  // ★ 個人ページPIN（初期値 "0000"）
  profilePin: string;
  // ★ アイコンフレーム
  activeFrameId?: string;
  unlockedFrames?: string[];
  // ★ 永続称号（「第n代 覇者」など、退任後も保持）
  earnedHonors?: string[];
}


export interface SystemTitleHistoryEntry {
  id: string;
  titleId: string;           // 'MASTER' | 'RISING_STAR' | 'GRINDER' | 'GIANT_KILLER'
  userId: string;
  userName: string;
  generation: number;        // 第何代
  awardedAt: string;         // ISO日時
  revokedAt?: string;        // 外れた日時（nullなら現役）
}

export interface SystemTitleSnapshot {
  entries: SystemTitleHistoryEntry[];
  nextGeneration: Record<string, number>; // titleId -> 次の代数
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
  clubName: string;
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
    spamPenalty: number;
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
  result: 'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW';
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
  approvedDevices?: { token: string; label: string; approvedAt: string }[];
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

// ★ 追加: 同期ステータス
export type SyncStatus = 'SYNCED' | 'SYNCING' | 'PENDING' | 'ERROR' | 'NEVER';

export interface SyncMeta {
  status: SyncStatus;
  lastSync: string | null;
  localTimestamp: string | null;
  pendingChanges: number;
  lastError?: string;
  /** ★ このデバイスが最後にクラウドから読んだ／書いたときのクラウド側timestamp。
   *  競合検知に使用: pushToCloud時にこれより新しいcloudTimestampがあれば別デバイスが書いている。 */
  lastCloudTimestamp?: string;
}

export interface AutoBackupEntry {
  date: string;
  key: string;
  userCount: number;
  matchCount: number;
  timestamp: string;
}

// ★ 級位・段位
export interface RankEntry {
  id: string;
  source: string;       // "将棋ウォーズ" など
  rank: string;         // "3級" "初段" など
  approvedAt: string;
}

export interface RankApplication {
  id: string;
  userId: string;
  userName: string;
  source: string;
  rank: string;
  note: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedAt?: string;
  reviewNote?: string;
}

// ★ Maintenance mode
export interface MaintenanceState {
  active: boolean;
  startedAt: string | null;
  startedBy: string;          // 開始した管理者メモ（任意）
  backupTimestamp: string | null;  // Firebase backup保存日時
  backupVerified: boolean;    // Firebaseバックアップ確認済みか
  note: string;               // 作業メモ
}

// ★ Undo system
export type UndoActionType =
  | 'MATCH'
  | 'ATTENDANCE'
  | 'POINT_ADJUST'
  | 'RATE_ADJUST'
  | 'USER_ADD'
  | 'USER_DEACTIVATE'
  | 'USER_REACTIVATE';

export interface UndoEntry {
  id: string;
  actionType: UndoActionType;
  description: string;   // 表示用: "対局: 田中 vs 鈴木"
  timestamp: string;
  // complete snapshots needed to revert
  snapshot: {
    users: User[];
    matches: MatchRecord[];
    logs: ActivityLog[];
  };
}

// ============================================================
// MISSION SYSTEM (Stage4)
// ============================================================
export type MissionType = 'DAILY' | 'WEEKLY';

export interface MissionDef {
  id: string;
  type: MissionType;
  label: string;
  description: string;
  target: number;       // 達成に必要な数
  rewardPts: number;    // 達成時ポイント
  /** 進捗カウント方法 */
  metric: 'MATCHES' | 'WINS' | 'ATTENDANCE' | 'DRAWS';
}

export interface MissionProgress {
  missionId: string;
  periodKey: string;    // getDailyKey() or getWeeklyKey()
  current: number;
  completed: boolean;
  completedAt?: string;
}

export interface MissionAchieved {
  userName: string;
  mission: MissionDef;
  rewardPts: number;
}
