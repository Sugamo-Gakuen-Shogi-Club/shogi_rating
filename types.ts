
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
  seasonStartUpsetWins: number;

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
  /** ★ 連続出席ストリーク（活動日ベース） */
  attendanceStreak: number;
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
  /** ★ 部員登録時に設定した初期PIN（任意）。未設定なら "000000" */
  initialPin?: string;
  /** ★ 卒業フラグ（年度またぎで卒業扱いにした部員） */
  isGraduated?: boolean;
  /** ★ 卒業年度（例: 2026） */
  graduatedYear?: number;
  // ★ 学籍番号（Googleログイン連携用）
  studentId?: string;
  // ★ アイコンフレーム
  activeFrameId?: string;
  unlockedFrames?: string[];
  // ★ 永続称号（「第n代 覇者」など、退任後も保持）
  earnedHonors?: string[];
  /** ★ 指導者フラグ */
  isInstructor?: boolean;
  /** ★ ミッション達成通知（次回個人ページログイン時に表示） */
  pendingMissionAlert?: string[];
  /** ★ 紅白戦結果発表を既読済みか（closedAtをキーとして保持） */
  factionWarResultSeen?: string;
}


export interface SystemTitleHistoryEntry {
  id: string;
  titleId: string;           // 'MASTER' | 'RISING_STAR' | 'GRINDER' | 'GIANT_KILLER'
  userId: string;
  userName: string;
  generation: number;        // 第何代
  awardedAt: string;         // ISO日時
  revokedAt?: string;        // 外れた日時（nullなら現役）
  score?: number;            // 選出時のスコア（表示用）
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
  isSameFaction?: boolean;   // 紅白戦中の同士討ち（チームスコア・勝数除外）
}

export interface SystemSettings {
  adminPin: string;
  changePassword: string;        // デバイス承認に使う変更パスワード
  clubName: string;
  eventName: string | null;
  eventType: EventType;
  eventEndsAt: string | null;
  eventMultiplier: number;
  currentSeason: Season;
  lastMonthlyReset: string;
  lastTitleUpdate: string | null;
  /** 紅白戦開始日時（先鋒判定・結果集計に使用） */
  factionWarStartAt?: string | null;
  /** 紅白戦終了時に確定した結果（未クリアのユーザーに結果発表モーダルを表示） */
  factionWarResult?: {
    eventName: string;
    winnerFaction: 'RED' | 'WHITE' | 'DRAW';
    redScore: number;
    whiteScore: number;
    closedAt: string;
    /** 第1〜3功のユーザーID */
    merit1?: string[];
    merit2?: string[];
    merit3?: string[];
  } | null;
  /** ★ 指導対局PIN（全指導者共通・初期値 "000000"） */
  instructorPin?: string;
  /** ★ クラブ活動日カレンダー（1人でも出席した日付の配列 YYYY-MM-DD） */
  activityDates?: string[];
  /** ★ 合宿表彰用スナップショット */
  campBaselineRate?:   Record<string, number>;
  campBaselinePoints?: Record<string, number>;
  campBaselineLabel?:  string | null;
  campSlots?: Partial<Record<string, CampSlotSnapshot>>;
  /** ★ 年度（例: 2026）。年度またぎ処理の基準 */
  fiscalYear?: number;
  /** ★ seasonEndsAt（残り日数表示用） */
  seasonEndsAt?: string | null;
  /** ★ 最終活動日（Rankings用） */
  lastActivityDate?: string;
  /** ★ 部員表示順 */
  memberOrder?: string[];
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
  titleHistory?: SystemTitleSnapshot;  // 四天王履歴（同期対象）
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
// MISSION SYSTEM
// ============================================================
export type MissionType = 'DAILY' | 'WEEKLY';

export interface MissionDef {
  id: string;
  type: MissionType;
  label: string;
  description: string;
  target: number;
  rewardPts: number;
  metric: 'MATCHES' | 'WINS' | 'ATTENDANCE' | 'DRAWS';
}

export interface MissionProgress {
  missionId: string;
  periodKey: string;
  current: number;
  completed: boolean;
  completedAt?: string;
}

export interface MissionAchieved {
  userName: string;
  mission: MissionDef;
  rewardPts: number;
}

// ============================================================
// COACHING SYSTEM（指導対局）
// ============================================================
export interface InstructorSession {
  id: string;
  date: string;            // ISO日時
  instructorId: string;
  instructorName: string;
  studentId: string;
  studentName: string;
  content: string;         // 指導内容（簡潔に）
  instructorPointsEarned: number;
  studentPointsEarned: number;  // 3倍
}

// ─── 合宿表彰スロット ────────────────────────────────────────
export type CampSlotId =
  | 'S1_FIRST'   // 1学期前半
  | 'S1_SECOND'  // 1学期後半
  | 'SUMMER'     // 夏合宿
  | 'S2_FIRST'   // 2学期前半
  | 'S2_SECOND'  // 2学期後半
  | 'WINTER'     // 冬合宿
  | 'S3'         // 3学期
  | 'SPRING';    // 春合宿

export interface CampSlotSnapshot {
  snapshotAt: string;
  rate:   Record<string, number>;
  points: Record<string, number>;
}

/** ★ 年度またぎ処理の部員カテゴリ */
export type FiscalYearCategory = 'graduate' | 'withdraw' | 'continue';
