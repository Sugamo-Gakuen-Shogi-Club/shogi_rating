import {
  User, MatchRecord, SystemSettings, ActivityLog, ActivityType,
  AchievementDef, AttendanceResult, BackupData, PointBreakdown,
  EventType, Season, IconDef, RivalData, SystemTitle, TitleDef,
  SyncStatus, SyncMeta, AutoBackupEntry,
  UndoEntry, UndoActionType,
  MaintenanceState,
  RankEntry, RankApplication
} from './types';
import { getAppCheckToken } from './appCheck';

// ============================================================
// STORAGE KEYS
// ============================================================
const USERS_KEY     = 'club_rivals_users_v2';
const MATCHES_KEY   = 'club_rivals_matches';
const SETTINGS_KEY  = 'club_rivals_settings';
const LOGS_KEY      = 'club_rivals_logs';
const SYNC_META_KEY = 'club_rivals_sync_meta';
const AUTOBACKUP_PREFIX = 'club_rivals_backup_';
const UNDO_KEY      = 'club_rivals_undo_stack';
const MAINTENANCE_KEY = 'club_rivals_maintenance';
const RANK_APPS_KEY   = 'club_rivals_rank_apps';
const UNDO_MAX      = 10;
const LOGS_MAX      = 200;

const FIREBASE_BASE = 'https://club-rivals-test1-default-rtdb.asia-southeast1.firebasedatabase.app';
const CLOUD_API_URL         = `${FIREBASE_BASE}/rivals_data.json`;
const MAINTENANCE_BACKUP_URL = `${FIREBASE_BASE}/maintenance_backup.json`;
const MAINTENANCE_SANDBOX_URL = `${FIREBASE_BASE}/maintenance_sandbox.json`;

// ============================================================
// DEFAULTS
// ============================================================
const DEFAULT_SETTINGS: SystemSettings = {
  adminPin: '1123',
  clubName: '将棋部',
  eventName: null,
  eventType: EventType.STANDARD,
  eventEndsAt: null,
  eventMultiplier: 2,
  currentSeason: Season.TERM_1_EARLY,
  lastMonthlyReset: new Date().toISOString(),
  lastTitleUpdate: null
};

// 初期レートは0（負けで減る仕様のため）
const INITIAL_RATE = 0;

const DEFAULT_UNLOCKED_ICONS = ['DEFAULT_INITIAL', 'DEFAULT_SMILE', 'DEFAULT_CAT', 'DEFAULT_DOG', 'SHOGI_FU'];

// ============================================================
// STATIC DATA
// ============================================================
export const SYSTEM_TITLES: TitleDef[] = [
  { id: 'MASTER',       name: '名人',   english: 'The Master',    description: '現在のレート最強',          color: 'text-yellow-400' },
  { id: 'RISING_STAR',  name: '新星',   english: 'Rising Star',   description: '今シーズンの成長幅No.1',    color: 'text-blue-400' },
  { id: 'GRINDER',      name: '活動家', english: 'The Grinder',   description: '対局数＋出席数No.1',        color: 'text-green-400' },
  { id: 'GIANT_KILLER', name: '下克上', english: 'Giant Killer',  description: '格上撃破数No.1',            color: 'text-red-400' },
];

export const ACHIEVEMENTS_DATA: AchievementDef[] = [
  { id: 'FACTION_GENERAL', name: '大将軍',         description: 'チームの大将に任命される',   conditionType: 'SPECIAL',  threshold: 1 },
  { id: 'DUEL_VICTORY',    name: '一騎討ち',        description: '敵将との直接対決を制する',   conditionType: 'SPECIAL',  threshold: 1 },
  { id: 'START_DASH',      name: 'スタートダッシュ', description: '記念すべき最初の対局',       conditionType: 'MATCHES',  threshold: 1 },
  { id: 'MATCHES_10',      name: '駆け出し棋士',    description: '対局数10回到達',             conditionType: 'MATCHES',  threshold: 10 },
  { id: 'MATCHES_50',      name: '盤上の常連',      description: '対局数50回到達',             conditionType: 'MATCHES',  threshold: 50 },
  { id: 'MATCHES_100',     name: '百戦錬磨',        description: '対局数100回到達',            conditionType: 'MATCHES',  threshold: 100 },
  { id: 'FIRST_WIN',       name: '初勝利',          description: '初めての勝利',               conditionType: 'WINS',     threshold: 1 },
  { id: 'WINS_10',         name: '十人斬り',        description: '勝利数10回到達',             conditionType: 'WINS',     threshold: 10 },
  { id: 'WINS_30',         name: '名手',            description: '勝利数30回到達',             conditionType: 'WINS',     threshold: 30 },
  { id: 'WINS_50',         name: '将棋の鬼',        description: '勝利数50回到達',             conditionType: 'WINS',     threshold: 50 },
  { id: 'STREAK_3',        name: '好調',            description: '3連勝達成',                 conditionType: 'STREAK',   threshold: 3 },
  { id: 'STREAK_5',        name: '猛攻',            description: '5連勝達成',                 conditionType: 'STREAK',   threshold: 5 },
  { id: 'STREAK_10',       name: '無双',            description: '10連勝達成',                conditionType: 'STREAK',   threshold: 10 },
  { id: 'RATE_1200',       name: '脱・初心者',      description: 'レート1200到達',             conditionType: 'RATE',     threshold: 1200 },
  { id: 'RATE_1500',       name: '熟練者',          description: 'レート1500到達',             conditionType: 'RATE',     threshold: 1500 },
  { id: 'RATE_1800',       name: 'マスター',        description: 'レート1800到達',             conditionType: 'RATE',     threshold: 1800 },
  { id: 'RATE_2000',       name: 'レジェンド',      description: 'レート2000到達',             conditionType: 'RATE',     threshold: 2000 },
  { id: 'DAYS_10',         name: '将棋好き',        description: '活動日数10日',               conditionType: 'DAYS',     threshold: 10 },
  { id: 'DAYS_30',         name: '部室の主',        description: '活動日数30日',               conditionType: 'DAYS',     threshold: 30 },
  { id: 'DAYS_100',        name: '生ける伝説',      description: '活動日数100日',              conditionType: 'DAYS',     threshold: 100 },
];

export const ICONS_DATA: IconDef[] = [
  { id: 'DEFAULT_INITIAL', char: '名',   name: '頭文字',  conditionDescription: 'デフォルト',        type: 'DEFAULT',  category: 'DEFAULT' },
  { id: 'DEFAULT_SMILE',   char: '🙂',  name: 'スマイル', conditionDescription: 'デフォルト',        type: 'DEFAULT',  category: 'DEFAULT' },
  { id: 'DEFAULT_CAT',     char: '🐱',  name: 'ねこ',    conditionDescription: '最初から所持',       type: 'DEFAULT',  category: 'DEFAULT' },
  { id: 'DEFAULT_DOG',     char: '🐶',  name: 'いぬ',    conditionDescription: '最初から所持',       type: 'DEFAULT',  category: 'DEFAULT' },
  { id: 'SHOGI_FU',        char: '歩兵', name: '歩兵',    conditionDescription: '最初から所持',       type: 'DEFAULT',  category: 'SHOGI' },
  { id: 'SHOGI_TO',        char: 'と金', name: 'と金',    conditionDescription: '対局数3回',          type: 'MATCHES',  threshold: 3,    category: 'SHOGI' },
  { id: 'SHOGI_KY',        char: '香車', name: '香車',    conditionDescription: '対局数5回',          type: 'MATCHES',  threshold: 5,    category: 'SHOGI' },
  { id: 'SHOGI_NKY',       char: '成香', name: '成香',    conditionDescription: '対局数10回',         type: 'MATCHES',  threshold: 10,   category: 'SHOGI' },
  { id: 'SHOGI_KE',        char: '桂馬', name: '桂馬',    conditionDescription: '勝利数3回',          type: 'WINS',     threshold: 3,    category: 'SHOGI' },
  { id: 'SHOGI_NKE',       char: '成桂', name: '成桂',    conditionDescription: '勝利数5回',          type: 'WINS',     threshold: 5,    category: 'SHOGI' },
  { id: 'SHOGI_GI',        char: '銀将', name: '銀将',    conditionDescription: '勝利数7回',          type: 'WINS',     threshold: 7,    category: 'SHOGI' },
  { id: 'SHOGI_NGI',       char: '成銀', name: '成銀',    conditionDescription: '勝利数12回',         type: 'WINS',     threshold: 12,   category: 'SHOGI' },
  { id: 'SHOGI_KI',        char: '金将', name: '金将',    conditionDescription: '勝利数15回',         type: 'WINS',     threshold: 15,   category: 'SHOGI' },
  { id: 'SHOGI_KA',        char: '角行', name: '角行',    conditionDescription: 'レート1100到達',     type: 'RATE',     threshold: 1100, category: 'SHOGI' },
  { id: 'SHOGI_UMA',       char: '龍馬', name: '龍馬',    conditionDescription: 'レート1250到達',     type: 'RATE',     threshold: 1250, category: 'SHOGI' },
  { id: 'SHOGI_HI',        char: '飛車', name: '飛車',    conditionDescription: 'レート1200到達',     type: 'RATE',     threshold: 1200, category: 'SHOGI' },
  { id: 'SHOGI_RYU',       char: '龍王', name: '龍王',    conditionDescription: 'レート1400到達',     type: 'RATE',     threshold: 1400, category: 'SHOGI' },
  { id: 'SHOGI_OU',        char: '王将', name: '王将',    conditionDescription: 'レート1600到達',     type: 'RATE',     threshold: 1600, category: 'SHOGI' },
  { id: 'SHOGI_GYOKU',     char: '玉将', name: '玉将',    conditionDescription: 'レート1800到達',     type: 'RATE',     threshold: 1800, category: 'SHOGI' },
  { id: 'CHESS_PAWN',      char: '♟️',  name: 'ポーン',  conditionDescription: '勝利数20回',         type: 'WINS',     threshold: 20,   category: 'CHESS' },
  { id: 'CHESS_KNIGHT',    char: '♞',   name: 'ナイト',  conditionDescription: '勝利数40回',         type: 'WINS',     threshold: 40,   category: 'CHESS' },
  { id: 'CHESS_BISHOP',    char: '♝',   name: 'ビショップ',conditionDescription: 'レート1350到達',   type: 'RATE',     threshold: 1350, category: 'CHESS' },
  { id: 'CHESS_ROOK',      char: '♜',   name: 'ルーク',  conditionDescription: 'レート1450到達',     type: 'RATE',     threshold: 1450, category: 'CHESS' },
  { id: 'CHESS_QUEEN',     char: '♛',   name: 'クイーン',conditionDescription: 'レート1700到達',     type: 'RATE',     threshold: 1700, category: 'CHESS' },
  { id: 'CHESS_KING',      char: '♚',   name: 'キング',  conditionDescription: 'レート2000到達',     type: 'RATE',     threshold: 2000, category: 'CHESS' },
];

// ============================================================
// UTILITIES
// ============================================================
export const getLocalDateString = (date?: Date | string): string => {
  const d = date ? new Date(date) : new Date();
  const offset = 9 * 60;
  const jst = new Date(d.getTime() + (d.getTimezoneOffset() + offset) * 60000);
  return `${jst.getFullYear()}-${String(jst.getMonth() + 1).padStart(2, '0')}-${String(jst.getDate()).padStart(2, '0')}`;
};

const randomId = () => Math.random().toString(36).substr(2, 9);

// ============================================================
// SYNC STATUS
// ============================================================
const getSyncMetaDefault = (): SyncMeta => ({
  status: 'NEVER', lastSync: null, localTimestamp: null, pendingChanges: 0
});

export const getSyncStatus = (): SyncMeta => {
  try {
    const s = localStorage.getItem(SYNC_META_KEY);
    return s ? { ...getSyncMetaDefault(), ...JSON.parse(s) } : getSyncMetaDefault();
  } catch { return getSyncMetaDefault(); }
};

const updateSyncMeta = (update: Partial<SyncMeta>) => {
  const cur = getSyncStatus();
  const next = { ...cur, ...update };
  localStorage.setItem(SYNC_META_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('rivals-sync-changed', { detail: next }));
};

// ============================================================
// UNDO SYSTEM
// ============================================================

export const getUndoStack = (): UndoEntry[] => {
  try {
    const raw = localStorage.getItem(UNDO_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

/**
 * スナップショットを取ってUndoスタックに積む。
 * 破壊的操作（processMatch, recordAttendance, manualAdjust, deactivate…）の直前に呼ぶ。
 */
export const pushUndoSnapshot = (
  actionType: UndoActionType,
  description: string
): void => {
  const entry: UndoEntry = {
    id:         randomId(),
    actionType,
    description,
    timestamp:  new Date().toISOString(),
    snapshot: {
      users:   getRawUsers(),
      matches: getMatches(),
      logs:    getLogs(),
    },
  };
  const stack = getUndoStack();
  const next = [entry, ...stack].slice(0, UNDO_MAX);
  localStorage.setItem(UNDO_KEY, JSON.stringify(next));
  // Undoスタックの変更をUIに通知
  window.dispatchEvent(new CustomEvent('rivals-undo-changed', { detail: next }));
};

/**
 * 直近の操作を取り消す。
 * 対象エントリのsnapshotをlocalStorageに書き戻し、Firebaseにも同期する。
 */
export const undoLastAction = (entryId?: string): UndoEntry | null => {
  const stack = getUndoStack();
  if (stack.length === 0) return null;

  const idx = entryId ? stack.findIndex(e => e.id === entryId) : 0;
  if (idx === -1) return null;
  const entry = stack[idx];

  // スナップショットを復元
  localStorage.setItem(USERS_KEY,   JSON.stringify(entry.snapshot.users));
  localStorage.setItem(MATCHES_KEY, JSON.stringify(entry.snapshot.matches));
  localStorage.setItem(LOGS_KEY,    JSON.stringify(entry.snapshot.logs));

  // そのエントリ以降（新しい側）をすべてスタックから削除
  const next = stack.slice(idx + 1);
  localStorage.setItem(UNDO_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('rivals-undo-changed', { detail: next }));

  // クラウドにも同期（取り消し後の状態を正とする）
  syncWithServer();
  return entry;
};

export const clearUndoStack = (): void => {
  localStorage.removeItem(UNDO_KEY);
  window.dispatchEvent(new CustomEvent('rivals-undo-changed', { detail: [] }));
};

// ============================================================
// AUTO BACKUP
// ============================================================
export const saveAutoBackup = (): void => {
  try {
    const today = getLocalDateString();
    const key = `${AUTOBACKUP_PREFIX}${today}`;
    const data: BackupData = {
      users: getRawUsers(),
      matches: getMatches(),
      settings: getSettings(),
      logs: getLogs(),
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(data));

    // Prune: keep only last 7 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = getLocalDateString(cutoff);
    Object.keys(localStorage)
      .filter(k => k.startsWith(AUTOBACKUP_PREFIX) && k.replace(AUTOBACKUP_PREFIX, '') < cutoffStr)
      .forEach(k => localStorage.removeItem(k));
  } catch (_) {}
};

export const getAutoBackups = (): AutoBackupEntry[] => {
  return Object.keys(localStorage)
    .filter(k => k.startsWith(AUTOBACKUP_PREFIX))
    .sort().reverse()
    .map(key => {
      try {
        const data: BackupData = JSON.parse(localStorage.getItem(key) || '{}');
        return {
          date: key.replace(AUTOBACKUP_PREFIX, ''),
          key,
          userCount: (data.users || []).filter((u: any) => u.isActive !== false).length,
          matchCount: (data.matches || []).length,
          timestamp: data.timestamp || key.replace(AUTOBACKUP_PREFIX, ''),
        };
      } catch { return null; }
    }).filter(Boolean) as AutoBackupEntry[];
};

export const restoreFromAutoBackup = (key: string): boolean => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    return importData(raw);
  } catch { return false; }
};

// ============================================================
// MAINTENANCE MODE
// ============================================================

const DEFAULT_MAINTENANCE: MaintenanceState = {
  active: false,
  startedAt: null,
  startedBy: '',
  backupTimestamp: null,
  backupVerified: false,
  note: '',
};

export const getMaintenanceState = (): MaintenanceState => {
  try {
    const raw = localStorage.getItem(MAINTENANCE_KEY);
    return raw ? { ...DEFAULT_MAINTENANCE, ...JSON.parse(raw) } : DEFAULT_MAINTENANCE;
  } catch { return DEFAULT_MAINTENANCE; }
};

const saveMaintenanceState = (state: MaintenanceState): void => {
  localStorage.setItem(MAINTENANCE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('rivals-maintenance-changed', { detail: state }));
};

/**
 * メンテナンスモード開始
 * 1. 現在のデータをFirebase /maintenance_backup に保存
 * 2. 同じデータをFirebase /maintenance_sandbox にコピー
 * 3. 以後の書き込みはsandboxへ（pushToCloudが自動切替）
 * 4. localStorageにメンテ状態を保存
 */
export const startMaintenanceMode = async (note: string, startedBy = '管理者'): Promise<{ success: boolean; error?: string }> => {
  try {
    const timestamp = new Date().toISOString();
    const data: BackupData = {
      users: getRawUsers(),
      matches: getMatches(),
      settings: getSettings(),
      logs: getLogs(),
      timestamp,
    };

    // 1. 本番データをmaintenance_backupに保存
    const backupRes = await fetch(MAINTENANCE_BACKUP_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, backedUpAt: timestamp }),
    });
    if (!backupRes.ok) throw new Error(`バックアップ保存失敗: HTTP ${backupRes.status}`);

    // 2. 同じデータをsandboxにもコピー（メンテ中の作業開始点として）
    const sandboxRes = await fetch(MAINTENANCE_SANDBOX_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!sandboxRes.ok) throw new Error(`サンドボックス初期化失敗: HTTP ${sandboxRes.status}`);

    // 3. ローカルにも自動バックアップ
    saveAutoBackup();

    // 4. メンテナンス状態を保存
    const state: MaintenanceState = {
      active: true,
      startedAt: timestamp,
      startedBy,
      backupTimestamp: timestamp,
      backupVerified: true,
      note,
    };
    saveMaintenanceState(state);
    updateSyncMeta({ status: 'PENDING', pendingChanges: 0 });

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || '不明なエラー' };
  }
};

/**
 * メンテナンスモード終了
 * discard=true → sandboxデータを破棄し、backupから本番を復元
 * discard=false → sandboxデータを本番に昇格（変更を本番反映）
 */
export const endMaintenanceMode = async (discard: boolean): Promise<{ success: boolean; error?: string }> => {
  try {
    if (discard) {
      // backupから本番データを取得して復元
      const res = await fetch(`${MAINTENANCE_BACKUP_URL}?nocache=${Date.now()}`);
      if (!res.ok) throw new Error(`バックアップ取得失敗: HTTP ${res.status}`);
      const backup: BackupData | null = await res.json();
      if (!backup || !Array.isArray(backup.users)) throw new Error('バックアップデータが無効です');

      // ローカルに書き戻す
      localStorage.setItem(USERS_KEY,    JSON.stringify(backup.users));
      localStorage.setItem(MATCHES_KEY,  JSON.stringify(backup.matches || []));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(backup.settings || {}));
      localStorage.setItem(LOGS_KEY,     JSON.stringify(backup.logs || []));

      // 本番Firebaseに書き戻す
      const restoreRes = await fetch(CLOUD_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...backup, timestamp: new Date().toISOString() }),
      });
      if (!restoreRes.ok) throw new Error(`本番復元失敗: HTTP ${restoreRes.status}`);
    } else {
      // sandboxの内容を本番に昇格
      const sandboxRes = await fetch(`${MAINTENANCE_SANDBOX_URL}?nocache=${Date.now()}`);
      if (!sandboxRes.ok) throw new Error(`サンドボックス取得失敗: HTTP ${sandboxRes.status}`);
      const sandbox: BackupData | null = await sandboxRes.json();
      if (!sandbox || !Array.isArray(sandbox.users)) throw new Error('サンドボックスデータが無効です');

      const promoteRes = await fetch(CLOUD_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sandbox, timestamp: new Date().toISOString() }),
      });
      if (!promoteRes.ok) throw new Error(`本番への昇格失敗: HTTP ${promoteRes.status}`);
    }

    // sandboxを削除
    await fetch(MAINTENANCE_SANDBOX_URL, { method: 'DELETE' }).catch(() => {});

    // メンテ状態をリセット
    saveMaintenanceState(DEFAULT_MAINTENANCE);
    clearUndoStack();
    updateSyncMeta({ status: 'SYNCED', lastSync: new Date().toISOString(), pendingChanges: 0 });

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || '不明なエラー' };
  }
};

/**
 * Firebaseのbackupデータを確認取得（メンテ画面の「バックアップ確認」ボタン用）
 */
export const verifyMaintenanceBackup = async (): Promise<{
  ok: boolean;
  userCount?: number;
  matchCount?: number;
  savedAt?: string;
  error?: string;
}> => {
  try {
    const res = await fetch(`${MAINTENANCE_BACKUP_URL}?nocache=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: BackupData & { backedUpAt?: string } = await res.json();
    if (!data || !Array.isArray(data.users)) throw new Error('データが空です');
    const state = getMaintenanceState();
    saveMaintenanceState({ ...state, backupVerified: true });
    return {
      ok: true,
      userCount: data.users.length,
      matchCount: (data.matches || []).length,
      savedAt: data.backedUpAt || data.timestamp,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
};

// ============================================================
// CLOUD SYNC
// ============================================================
export type LoadResult = 'CLOUD_LOADED' | 'LOCAL_NEWER' | 'FAILED' | 'EMPTY';

let _syncTimer: number | null = null;

/** Internal: push current local data to Firebase (or sandbox if maintenance) */
const pushToCloud = async (): Promise<boolean> => {
  try {
    const timestamp = new Date().toISOString();
    const data: BackupData = {
      users: getRawUsers(),
      matches: getMatches(),
      settings: getSettings(),
      logs: getLogs(),
      timestamp,
    };
    // メンテナンスモード中はsandboxに書く
    const maint = getMaintenanceState();
    const url = maint.active ? MAINTENANCE_SANDBOX_URL : CLOUD_API_URL;

    // ★ App Check トークンをヘッダーに付与（取得失敗時はトークンなしで継続）
    const appCheckToken = await getAppCheckToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (appCheckToken) headers['X-Firebase-AppCheck'] = appCheckToken;

    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    updateSyncMeta({ status: 'SYNCED', lastSync: timestamp, pendingChanges: 0, lastError: undefined });
    return true;
  } catch (e: any) {
    updateSyncMeta({ status: 'ERROR', lastError: e?.message || 'Unknown error' });
    return false;
  }
};

/**
 * Called after every local write. Debounces 3s to avoid hammering Firebase
 * on rapid successive writes. Tracks pendingChanges count for UI indicator.
 */
export const syncWithServer = (): void => {
  const now = new Date().toISOString();
  const cur = getSyncStatus();
  updateSyncMeta({
    status: 'PENDING',
    localTimestamp: now,
    pendingChanges: (cur.pendingChanges || 0) + 1,
  });

  // Auto-backup on every local change (max once per session per day)
  saveAutoBackup();

  if (_syncTimer !== null) window.clearTimeout(_syncTimer);
  _syncTimer = window.setTimeout(async () => {
    _syncTimer = null;
    updateSyncMeta({ status: 'SYNCING' });
    const ok = await pushToCloud();
    if (!ok) {
      // Retry once after 10s
      window.setTimeout(() => pushToCloud(), 10000);
    }
  }, 3000);
};

/** Manual sync triggered by user */
export const manualSync = async (): Promise<boolean> => {
  if (_syncTimer !== null) { window.clearTimeout(_syncTimer); _syncTimer = null; }
  updateSyncMeta({ status: 'SYNCING' });
  return await pushToCloud();
};

/**
 * Called on app startup.
 * - If cloud has newer data → overwrite local
 * - If local has newer data → push local to cloud
 * - If no cloud data → return EMPTY (caller seeds)
 */
export const loadFromCloud = async (): Promise<LoadResult> => {
  try {
    updateSyncMeta({ status: 'SYNCING' });
    const appCheckToken = await getAppCheckToken();
    const headers: Record<string, string> = {};
    if (appCheckToken) headers['X-Firebase-AppCheck'] = appCheckToken;

    const res = await fetch(`${CLOUD_API_URL}?nocache=${Date.now()}`, { headers });
    if (!res.ok) { updateSyncMeta({ status: 'ERROR', lastError: `HTTP ${res.status}` }); return 'FAILED'; }

    const data: BackupData | null = await res.json();
    if (!data || !Array.isArray(data.users) || data.users.length === 0) {
      updateSyncMeta({ status: 'NEVER' });
      return 'EMPTY';
    }

    const meta = getSyncStatus();
    const cloudTime = data.timestamp || '';
    const localTime = meta.localTimestamp || '';

    if (localTime && cloudTime && localTime > cloudTime) {
      // Local is newer → push to cloud so it doesn't get lost
      await pushToCloud();
      return 'LOCAL_NEWER';
    }

    // Cloud is authoritative → load it
    localStorage.setItem(USERS_KEY,    JSON.stringify(data.users));
    localStorage.setItem(MATCHES_KEY,  JSON.stringify(data.matches || []));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings || DEFAULT_SETTINGS));
    localStorage.setItem(LOGS_KEY,     JSON.stringify(data.logs || []));

    const syncedAt = new Date().toISOString();
    updateSyncMeta({ status: 'SYNCED', lastSync: syncedAt, localTimestamp: cloudTime, pendingChanges: 0 });
    return 'CLOUD_LOADED';
  } catch (e: any) {
    updateSyncMeta({ status: 'ERROR', lastError: e?.message });
    return 'FAILED';
  }
};

// ============================================================
// SETTINGS
// ============================================================
export const getSettings = (): SystemSettings => {
  const s = localStorage.getItem(SETTINGS_KEY);
  if (!s) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
};

export const saveSettings = (settings: SystemSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  syncWithServer();
};

export const isEventActive = (): boolean => {
  const s = getSettings();
  return !!s.eventEndsAt && new Date() < new Date(s.eventEndsAt);
};

// ============================================================
// USERS (raw = includes inactive)
// ============================================================
const normalizeUser = (user: any): User => ({
  isActive: true, // default active
  ...user,
  achievements:   Array.isArray(user.achievements)   ? user.achievements   : [],
  unlockedIcons:  Array.isArray(user.unlockedIcons)
    ? Array.from(new Set([...user.unlockedIcons, ...DEFAULT_UNLOCKED_ICONS]))
    : [...DEFAULT_UNLOCKED_ICONS],
  activeIconId:   user.activeIconId   || 'DEFAULT_INITIAL',
  rate:           user.rate           ?? INITIAL_RATE,
  wins:           user.wins           ?? 0,
  losses:         user.losses         ?? 0,
  draws:          user.draws          ?? 0,
  currentStreak:  user.currentStreak  ?? 0,
  maxStreak:      user.maxStreak      ?? 0,
  activityDays:   user.activityDays   ?? 0,
  totalPoints:    user.totalPoints    ?? 0,
  monthlyPoints:  user.monthlyPoints  ?? 0,
  pointsMatch:    user.pointsMatch    ?? 0,
  pointsAttendance: user.pointsAttendance ?? 0,
  pointsSpecial:  user.pointsSpecial  ?? 0,
  eventPoints:    user.eventPoints    ?? 0,
  seasonStartRate:   user.seasonStartRate   ?? user.rate ?? INITIAL_RATE,
  seasonStartPoints: user.seasonStartPoints ?? user.totalPoints ?? 0,
  systemTitle:    user.systemTitle    ?? null,
  faction:        user.faction        ?? 'WHITE',
  isGeneral:      user.isGeneral      ?? false,
  isNewMember:    user.isNewMember    ?? false,
  activeTitle:    user.activeTitle    ?? null,
  lastAttendance: user.lastAttendance ?? null,
  avatarColor:    user.avatarColor    || 'bg-blue-500',
  rateHistory:    Array.isArray(user.rateHistory) ? user.rateHistory
    : [{ date: new Date().toISOString(), rate: user.rate ?? INITIAL_RATE }],
  ranks:          Array.isArray(user.ranks) ? user.ranks : [],
  profilePin:     user.profilePin ?? '0000',
});

/** All users including inactive (internal use / admin) */
const getRawUsers = (): User[] => {
  try {
    const u = localStorage.getItem(USERS_KEY);
    return u ? (JSON.parse(u) as any[]).map(normalizeUser) : [];
  } catch { return []; }
};

/**
 * Active users (default) or all users.
 * Pass includeInactive=true only in Admin screens.
 */
export const getUsers = (includeInactive = false): User[] => {
  const all = getRawUsers();
  return includeInactive ? all : all.filter(u => u.isActive !== false);
};

export const saveUsers = (users: User[]): void => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  syncWithServer();
};

// ============================================================
// MATCHES
// ============================================================
export const getMatches = (): MatchRecord[] => {
  try {
    const m = localStorage.getItem(MATCHES_KEY);
    return m ? JSON.parse(m) : [];
  } catch { return []; }
};

const saveMatches = (matches: MatchRecord[]): void => {
  localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
  // Note: syncWithServer called by saveUsers in processMatch; avoid double trigger
};

// ============================================================
// LOGS
// ============================================================
export const getLogs = (): ActivityLog[] => {
  try {
    const l = localStorage.getItem(LOGS_KEY);
    return l ? JSON.parse(l) : [];
  } catch { return []; }
};

const appendLogs = (newLogs: ActivityLog[]): void => {
  const existing = getLogs();
  const merged = [...newLogs, ...existing].slice(0, LOGS_MAX);
  localStorage.setItem(LOGS_KEY, JSON.stringify(merged));
};

// ============================================================
// ACHIEVEMENTS & ICONS CHECK
// ============================================================
const checkAchievementsAndIcons = (
  user: User,
  matchContext?: { isDuelWin: boolean }
): { newAchievements: AchievementDef[]; newIcons: IconDef[] } => {
  const newAchievements: AchievementDef[] = [];
  const newIcons: IconDef[] = [];
  const ach = user.achievements || [];
  const icons = user.unlockedIcons || [];
  const totalMatches = (user.wins || 0) + (user.losses || 0) + (user.draws || 0);

  ACHIEVEMENTS_DATA.forEach(a => {
    if (ach.includes(a.id)) return;
    let met = false;
    switch (a.conditionType) {
      case 'WINS':    met = (user.wins || 0)         >= a.threshold; break;
      case 'STREAK':  met = (user.currentStreak || 0) >= a.threshold; break;
      case 'RATE':    met = (user.rate || 0)          >= a.threshold; break;
      case 'DAYS':    met = (user.activityDays || 0)  >= a.threshold; break;
      case 'MATCHES': met = totalMatches              >= a.threshold; break;
      case 'SPECIAL':
        if (a.id === 'FACTION_GENERAL') met = !!user.isGeneral;
        if (a.id === 'DUEL_VICTORY')    met = !!matchContext?.isDuelWin;
        break;
    }
    if (met) { user.achievements.push(a.id); newAchievements.push(a); }
  });

  ICONS_DATA.forEach(icon => {
    if (icon.type === 'DEFAULT') return;
    if (icons.includes(icon.id)) return;
    let met = false;
    switch (icon.type) {
      case 'RATE':    met = (user.rate || 0)          >= (icon.threshold || 9999); break;
      case 'WINS':    met = (user.wins || 0)          >= (icon.threshold || 9999); break;
      case 'MATCHES': met = totalMatches              >= (icon.threshold || 9999); break;
      case 'STREAK':  met = (user.currentStreak || 0) >= (icon.threshold || 9999); break;
      case 'SPECIAL':
        if (icon.id === 'SPECIAL_GENERAL') met = !!user.isGeneral;
        if (icon.id === 'SPECIAL_DUEL')    met = !!matchContext?.isDuelWin;
        break;
    }
    if (met) { user.unlockedIcons.push(icon.id); newIcons.push(icon); }
  });

  return { newAchievements, newIcons };
};

// ============================================================
// ATTENDANCE
// ============================================================
export const recordAttendance = (userId: string): AttendanceResult => {
  const allUsers = getRawUsers();
  const user = allUsers.find(u => u.id === userId);
  if (!user) return { success: false, newAchievements: [], newIcons: [], message: 'ユーザーが見つかりません' };
  if (user.isActive === false) return { success: false, newAchievements: [], newIcons: [], message: '休眠中の部員です' };

  const today = getLocalDateString();
  if (user.lastAttendance && getLocalDateString(user.lastAttendance) === today) {
    return { success: false, newAchievements: [], newIcons: [], message: '本日はすでに出席済みです' };
  }

  // ★ Undo snapshot
  pushUndoSnapshot('ATTENDANCE', `出席: ${user.name}`);

  const pts = 5;
  user.lastAttendance   = new Date().toISOString();
  user.totalPoints      += pts;
  user.monthlyPoints    += pts;
  user.pointsAttendance  = (user.pointsAttendance || 0) + pts;
  user.activityDays     += 1;
  if (isEventActive()) user.eventPoints = (user.eventPoints || 0) + pts;

  const res = checkAchievementsAndIcons(user);
  saveUsers(allUsers);

  appendLogs([{
    id: randomId(), userId,
    type: ActivityType.ATTENDANCE,
    points: pts,
    description: '出席',
    date: new Date().toISOString(),
  }]);

  return { success: true, newAchievements: res.newAchievements, newIcons: res.newIcons, message: `出席を記録しました！ (+${pts} pt)` };
};

// ============================================================
// MATCH PROCESSING  ← ここが全部直った
// ============================================================

/** Proper Elo expected score */
const eloExpected = (rA: number, rB: number): number =>
  1 / (1 + Math.pow(10, (rB - rA) / 400));

/**
 * Elo rating delta.
 * 勝ち → 正（最低+1）
 * 負け → 負（最大-1）
 * 引き分け → 両者微増（±0〜+3程度）
 * レートは0未満にはならない
 */
const eloChange = (myRate: number, oppRate: number, score: number): number => {
  const K = 32;
  const expected = eloExpected(myRate, oppRate);
  const raw = Math.round(K * (score - expected));
  if (score === 1)   return Math.max(1,  raw);   // 勝ち: 最低+1
  if (score === 0)   return Math.min(-1, raw);   // 負け: 最大-1（負の数）
  return Math.max(0, raw);                       // 引き分け: 0以上
};

/** Spam check: >3 matches in last 30 minutes → 0.5 penalty */
const spamPenaltyFor = (userId: string): number => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  const recent = getMatches().filter(m =>
    (m.player1Id === userId || m.player2Id === userId) &&
    new Date(m.date).getTime() > cutoff
  );
  return recent.length >= 3 ? 0.5 : 1;
};

export const processMatch = (
  p1Id: string,
  p2Id: string,
  result: 'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW',
  isDuel = false
): { p1RateChange: number; p2RateChange: number; p1PointsDetail: PointBreakdown; p2PointsDetail: PointBreakdown; p1PointsEarned: number; p2PointsEarned: number; newAchievementsP1: AchievementDef[]; newAchievementsP2: AchievementDef[]; newIconsP1: IconDef[]; newIconsP2: IconDef[]; isDuel: boolean; result: 'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW' } => {
  const allUsers = getRawUsers();
  const p1 = allUsers.find(u => u.id === p1Id);
  const p2 = allUsers.find(u => u.id === p2Id);
  if (!p1 || !p2) throw new Error('ユーザーが見つかりません');

  // ★ 自動一騎討ち判定: 紅白戦中に両大将が異なるfactionで対局
  const settings = getSettings();
  const isFactionWar = isEventActive() && settings.eventType === EventType.FACTION_WAR;
  const autoIsDuel = isFactionWar && p1.isGeneral && p2.isGeneral && p1.faction !== p2.faction;
  const effectiveDuel = isDuel || autoIsDuel;

  // ★ Undo snapshot（処理前に保存）
  const resultLabel = result === 'PLAYER1_WIN' ? `${p1.name} 勝ち` : result === 'PLAYER2_WIN' ? `${p2.name} 勝ち` : '引き分け';
  pushUndoSnapshot('MATCH', `対局: ${p1.name} vs ${p2.name}（${resultLabel}）`);

  const eventActive = isEventActive();
  const eventMult = eventActive ? (settings.eventMultiplier || 1) : 1;

  // ── Rate change (proper Elo) ──────────────────────────────
  let p1Score: number, p2Score: number;
  if      (result === 'PLAYER1_WIN') { p1Score = 1;   p2Score = 0; }
  else if (result === 'PLAYER2_WIN') { p1Score = 0;   p2Score = 1; }
  else                               { p1Score = 0.5; p2Score = 0.5; }

  const p1RateChange = eloChange(p1.rate, p2.rate, p1Score);
  const p2RateChange = eloChange(p2.rate, p1.rate, p2Score);

  // ── Points ──────────────────────────────────────────────
  const calcPoints = (user: User, isWinner: boolean, isDraw: boolean): PointBreakdown => {
    const base          = isWinner ? 10 : isDraw ? 7 : 5;
    const streakBonus   = isWinner ? Math.min((user.currentStreak || 0) * 2, 6) : 0;
    const newMemberBonus = user.isNewMember ? 3 : 0;
    const spam          = spamPenaltyFor(user.id);
    const subtotal      = Math.round((base + streakBonus + newMemberBonus) * spam);
    const total         = Math.round(subtotal * eventMult);
    return { base, streakBonus, newMemberBonus, eventMultiplier: eventMult, spamPenalty: spam, total };
  };

  const p1IsWinner = result === 'PLAYER1_WIN';
  const p2IsWinner = result === 'PLAYER2_WIN';
  const isDraw2    = result === 'DRAW';

  const p1Detail = calcPoints(p1, p1IsWinner, isDraw2);
  const p2Detail = calcPoints(p2, p2IsWinner, isDraw2);

  // ── Apply to players ─────────────────────────────────────
  const now = new Date().toISOString();

  // Wins / Losses / Draws
  if (p1IsWinner) { p1.wins++; p2.losses++; }
  else if (p2IsWinner) { p2.wins++; p1.losses++; }
  else { p1.draws++; p2.draws++; }

  // Streaks
  if (p1IsWinner) {
    p1.currentStreak++;
    if (p1.currentStreak > p1.maxStreak) p1.maxStreak = p1.currentStreak;
    p2.currentStreak = 0;
  } else if (p2IsWinner) {
    p2.currentStreak++;
    if (p2.currentStreak > p2.maxStreak) p2.maxStreak = p2.currentStreak;
    p1.currentStreak = 0;
  } else {
    p1.currentStreak = 0;
    p2.currentStreak = 0;
  }

  // Rate (with rateHistory update ← FIX)
  p1.rate = Math.max(0, p1.rate + p1RateChange);
  p2.rate = Math.max(0, p2.rate + p2RateChange);
  p1.rateHistory = [...(p1.rateHistory || []), { date: now, rate: p1.rate }];
  p2.rateHistory = [...(p2.rateHistory || []), { date: now, rate: p2.rate }];

  // Points (with pointsMatch breakdown ← FIX)
  p1.totalPoints   += p1Detail.total;
  p1.monthlyPoints  = (p1.monthlyPoints || 0) + p1Detail.total;
  p1.pointsMatch    = (p1.pointsMatch   || 0) + p1Detail.total;
  if (eventActive) p1.eventPoints = (p1.eventPoints || 0) + p1Detail.total;

  p2.totalPoints   += p2Detail.total;
  p2.monthlyPoints  = (p2.monthlyPoints || 0) + p2Detail.total;
  p2.pointsMatch    = (p2.pointsMatch   || 0) + p2Detail.total;
  if (eventActive) p2.eventPoints = (p2.eventPoints || 0) + p2Detail.total;

  // Achievements & Icons
  const resP1 = checkAchievementsAndIcons(p1, { isDuelWin: effectiveDuel && p1IsWinner });
  const resP2 = checkAchievementsAndIcons(p2, { isDuelWin: effectiveDuel && p2IsWinner });

  saveUsers(allUsers);

  // ── Save match record (← FIX: was completely missing) ──
  const matchRecord: MatchRecord = {
    id: randomId(),
    date: now,
    player1Id: p1Id,
    player2Id: p2Id,
    result,
    p1RateChange,
    p2RateChange,
    p1PointsEarned: p1Detail.total,
    p2PointsEarned: p2Detail.total,
    isDuel: effectiveDuel,
  };
  const matches = getMatches();
  matches.unshift(matchRecord);
  saveMatches(matches);

  // ── Activity logs ──────────────────────────────────────
  appendLogs([
    {
      id: randomId(), userId: p1Id,
      type: p1IsWinner ? ActivityType.MATCH_WIN : isDraw2 ? ActivityType.MATCH_DRAW : ActivityType.MATCH_LOSS,
      points: p1Detail.total,
      description: `対局 vs ${p2.name}${effectiveDuel ? ' ⚔一騎討ち' : ''}`,
      date: now,
    },
    {
      id: randomId(), userId: p2Id,
      type: p2IsWinner ? ActivityType.MATCH_WIN : isDraw2 ? ActivityType.MATCH_DRAW : ActivityType.MATCH_LOSS,
      points: p2Detail.total,
      description: `対局 vs ${p1.name}${effectiveDuel ? ' ⚔一騎討ち' : ''}`,
      date: now,
    },
  ]);

  return {
    p1RateChange, p2RateChange,
    p1PointsDetail: p1Detail, p2PointsDetail: p2Detail,
    p1PointsEarned: p1Detail.total, p2PointsEarned: p2Detail.total,
    newAchievementsP1: resP1.newAchievements, newAchievementsP2: resP2.newAchievements,
    newIconsP1: resP1.newIcons, newIconsP2: resP2.newIcons,
    isDuel: effectiveDuel, result,
  };
};

// ============================================================
// DELETE MATCH (← FIX: was a no-op stub)
// ============================================================
export const deleteMatch = (id: string): void => {
  const matches = getMatches().filter(m => m.id !== id);
  saveMatches(matches);
  syncWithServer();
};

// ============================================================
// RIVAL STATS (← FIX: was returning constant null)
// ============================================================
export const getRivalryStats = (userId: string): { bestCustomer: RivalData | null; nemeses: RivalData | null } => {
  const matches = getMatches();
  const users   = getRawUsers();
  const map: Record<string, { wins: number; losses: number; draws: number }> = {};

  matches.forEach(m => {
    if (m.player1Id !== userId && m.player2Id !== userId) return;
    const oppId = m.player1Id === userId ? m.player2Id : m.player1Id;
    if (!map[oppId]) map[oppId] = { wins: 0, losses: 0, draws: 0 };
    if (m.result === 'DRAW') {
      map[oppId].draws++;
    } else if (
      (m.player1Id === userId && m.result === 'PLAYER1_WIN') ||
      (m.player2Id === userId && m.result === 'PLAYER2_WIN')
    ) {
      map[oppId].wins++;
    } else {
      map[oppId].losses++;
    }
  });

  const rivals: RivalData[] = Object.entries(map).map(([oppId, s]) => ({
    opponentId:   oppId,
    opponentName: users.find(u => u.id === oppId)?.name || 'Unknown',
    wins:    s.wins,
    losses:  s.losses,
    draws:   s.draws,
    total:   s.wins + s.losses + s.draws,
    winRate: (s.wins + s.losses + s.draws) > 0 ? s.wins / (s.wins + s.losses + s.draws) : 0,
  })).filter(r => r.total >= 2); // at least 2 matches to be a "rival"

  if (rivals.length === 0) return { bestCustomer: null, nemeses: null };

  const byWinDiff = [...rivals].sort((a, b) => (b.wins - b.losses) - (a.wins - a.losses));
  const bestCustomer = byWinDiff[0]?.wins > byWinDiff[0]?.losses ? byWinDiff[0] : null;

  const byLossDiff = [...rivals].sort((a, b) => (b.losses - b.wins) - (a.losses - a.wins));
  const nemeses    = byLossDiff[0]?.losses > byLossDiff[0]?.wins ? byLossDiff[0] : null;

  return { bestCustomer, nemeses };
};

// ============================================================
// SEASON SNAPSHOT (← FIX: was no-op stub)
// ============================================================
export const snapshotSeasonBaseline = (): void => {
  const all = getRawUsers();
  all.forEach(u => {
    u.seasonStartRate   = u.rate;
    u.seasonStartPoints = u.totalPoints;
  });
  saveUsers(all);
};

// ============================================================
// AWARD SYSTEM TITLES  (← FIX: was no-op stub)
// ============================================================
export const awardSystemTitles = (): void => {
  const all      = getRawUsers();
  const active   = all.filter(u => u.isActive !== false);
  if (active.length === 0) return;

  // Reset all
  all.forEach(u => { u.systemTitle = null; });

  // MASTER: highest current rate
  const byRate = [...active].sort((a, b) => b.rate - a.rate);
  const master = byRate[0];

  // RISING_STAR: highest (rate + points) growth this season, excluding MASTER
  const byGrowth = [...active]
    .filter(u => u.id !== master?.id)
    .sort((a, b) =>
      ((b.rate - b.seasonStartRate) + (b.totalPoints - b.seasonStartPoints)) -
      ((a.rate - a.seasonStartRate) + (a.totalPoints - a.seasonStartPoints))
    );
  const rising = byGrowth[0] ?? null;

  // GRINDER: highest (total_matches + activityDays), excluding above
  const taken1 = new Set([master?.id, rising?.id].filter(Boolean));
  const byActivity = [...active]
    .filter(u => !taken1.has(u.id))
    .sort((a, b) =>
      ((b.wins + b.losses + b.draws) + b.activityDays) -
      ((a.wins + a.losses + a.draws) + a.activityDays)
    );
  const grinder = byActivity[0] ?? null;

  // GIANT_KILLER: most wins against higher-rated opponents (from match records)
  const taken2 = new Set([master?.id, rising?.id, grinder?.id].filter(Boolean));
  const rateMap = Object.fromEntries(active.map(u => [u.id, u.rate]));
  const upsetCount: Record<string, number> = {};
  getMatches().forEach(m => {
    const p1Rate = rateMap[m.player1Id] ?? 0;
    const p2Rate = rateMap[m.player2Id] ?? 0;
    if (m.result === 'PLAYER1_WIN' && p2Rate > p1Rate) {
      upsetCount[m.player1Id] = (upsetCount[m.player1Id] || 0) + 1;
    } else if (m.result === 'PLAYER2_WIN' && p1Rate > p2Rate) {
      upsetCount[m.player2Id] = (upsetCount[m.player2Id] || 0) + 1;
    }
  });
  const byUpsets = [...active]
    .filter(u => !taken2.has(u.id))
    .sort((a, b) => (upsetCount[b.id] || 0) - (upsetCount[a.id] || 0));
  const killer = byUpsets[0] ?? null;

  // Assign
  if (master)  { const u = all.find(x => x.id === master.id);  if (u) u.systemTitle = 'MASTER'; }
  if (rising)  { const u = all.find(x => x.id === rising.id);  if (u) u.systemTitle = 'RISING_STAR'; }
  if (grinder) { const u = all.find(x => x.id === grinder.id); if (u) u.systemTitle = 'GRINDER'; }
  if (killer)  { const u = all.find(x => x.id === killer.id);  if (u) u.systemTitle = 'GIANT_KILLER'; }

  const settings = getSettings();
  saveSettings({ ...settings, lastTitleUpdate: new Date().toISOString() });
  saveUsers(all);
};

// ============================================================
// SOFT DELETE / REACTIVATION  (← NEW)
// ============================================================
export const deactivateUser = (id: string): void => {
  const all = getRawUsers();
  const u = all.find(x => x.id === id);
  if (u) {
    pushUndoSnapshot('USER_DEACTIVATE', `休眠: ${u.name}`);
    u.isActive = false; u.isGeneral = false; saveUsers(all);
  }
};

export const reactivateUser = (id: string): void => {
  const all = getRawUsers();
  const u = all.find(x => x.id === id);
  if (u) {
    pushUndoSnapshot('USER_REACTIVATE', `再入班: ${u.name}`);
    u.isActive = true; saveUsers(all);
  }
};

export const getInactiveUsers = (): User[] =>
  getRawUsers().filter(u => u.isActive === false);

// ============================================================
// MANUAL ADJUSTMENTS
// ============================================================
export const manualPointAdjustment = (uid: string, pts: number, reason: string): void => {
  const all = getRawUsers();
  const u = all.find(x => x.id === uid);
  if (!u) return;
  // ★ Undo snapshot
  pushUndoSnapshot('POINT_ADJUST', `ポイント調整: ${u.name} (${pts >= 0 ? '+' : ''}${pts}pt)`);
  u.totalPoints    += pts;
  u.pointsSpecial   = (u.pointsSpecial || 0) + pts;
  u.monthlyPoints  += pts;
  checkAchievementsAndIcons(u);
  saveUsers(all);
  appendLogs([{
    id: randomId(), userId: uid,
    type: ActivityType.BONUS,
    points: pts,
    description: reason || '管理者付与',
    date: new Date().toISOString(),
  }]);
};

export const manualRateAdjustment = (uid: string, delta: number, reason: string): void => {
  const all = getRawUsers();
  const u = all.find(x => x.id === uid);
  if (!u) return;
  // ★ Undo snapshot
  pushUndoSnapshot('RATE_ADJUST', `レート調整: ${u.name} (${delta >= 0 ? '+' : ''}${delta})`);
  u.rate += delta;
  u.rateHistory = [...(u.rateHistory || []), { date: new Date().toISOString(), rate: u.rate }];
  checkAchievementsAndIcons(u);
  saveUsers(all);
};

export const resetMonthly = (): void => {
  const all = getRawUsers();
  all.forEach(u => { u.monthlyPoints = 0; });
  saveUsers(all);
};

// ============================================================
// USER MANAGEMENT
// ============================================================
export const updateUserReading = (id: string, reading: string): void => {
  const all = getRawUsers();
  const u = all.find(x => x.id === id);
  if (u) { u.reading = reading; saveUsers(all); }
};

export const updateUserTitle = (id: string, t: string | null): void => {
  const all = getRawUsers();
  const u = all.find(x => x.id === id);
  if (u) { u.activeTitle = t; saveUsers(all); }
};

export const updateUserIcon = (id: string, iconId: string): void => {
  const all = getRawUsers();
  const u = all.find(x => x.id === id);
  if (u) { u.activeIconId = iconId; saveUsers(all); }
};

export const parseUserCSV = (csv: string): Partial<User>[] =>
  csv.split('\n')
    .filter(line => line.trim())
    .map(line => {
      const [name, reading, isNew] = line.split(',').map(s => s.trim());
      return { name: name || '名称未設定', reading: reading || '', isNewMember: isNew === '1' };
    });

const newUserBase = (name: string, reading?: string, isNewMember = false): User => ({
  id:               randomId(),
  name,
  reading,
  isActive:         true,
  isNewMember,
  rate:             INITIAL_RATE,
  seasonStartRate:  INITIAL_RATE,
  seasonStartPoints: 0,
  faction:          'WHITE',
  isGeneral:        false,
  systemTitle:      null,
  totalPoints:      0,
  pointsMatch:      0,
  pointsAttendance: 0,
  pointsSpecial:    0,
  monthlyPoints:    0,
  eventPoints:      0,
  currentStreak:    0,
  maxStreak:        0,
  wins:             0,
  losses:           0,
  draws:            0,
  lastAttendance:   null,
  activityDays:     0,
  rateHistory:      [{ date: new Date().toISOString(), rate: INITIAL_RATE }],
  achievements:     [],
  activeTitle:      null,
  avatarColor:      `bg-${['red','blue','green','yellow','purple','pink'][Math.floor(Math.random()*6)]}-500`,
  activeIconId:     'DEFAULT_INITIAL',
  unlockedIcons:    [...DEFAULT_UNLOCKED_ICONS],
  ranks:            [],
  profilePin:       '0000',
});

export const bulkAddUsers = (stubs: Partial<User>[]): void => {
  const all = getRawUsers();
  const added = stubs.map(s => newUserBase(s.name || '名称未設定', s.reading, !!s.isNewMember));
  saveUsers([...all, ...added]);
};

// ============================================================
// FACTION
// ============================================================
export const getFactionBalanceSimulation = (users: User[]) => {
  const scored = users
    .filter(u => u.isActive !== false)
    .map(u => ({ ...u, _score: u.rate * 0.3 + (u.activityDays || 0) * 300 }))
    .sort((a, b) => b._score - a._score);
  const red: User[] = [], white: User[] = [];
  let rScore = 0, wScore = 0;
  scored.forEach(u => {
    if (rScore <= wScore) { red.push(u);   rScore += u._score; }
    else                  { white.push(u); wScore += u._score; }
  });
  const stats = (team: User[]) => ({
    count:      team.length,
    avgRate:    team.length ? Math.round(team.reduce((a, b) => a + b.rate, 0) / team.length) : 0,
    totalDays:  team.reduce((a, b) => a + (b.activityDays || 0), 0),
    totalScore: Math.round(team.reduce((a, b) => a + (b.rate * 0.3 + (b.activityDays || 0) * 300), 0)),
  });
  return { redUsers: red, whiteUsers: white, redStats: stats(red), whiteStats: stats(white) };
};

export const assignGenerals = (redId: string, whiteId: string): void => {
  const all = getRawUsers();
  // まず全員のisGeneralをリセット
  all.forEach(u => { u.isGeneral = false; });

  const r = all.find(u => u.id === redId);
  const w = all.find(u => u.id === whiteId);
  if (r) {
    r.isGeneral = true;
    // ★ 大将軍実績チェック（isGeneralをtrueにした後）
    if (!r.achievements.includes('FACTION_GENERAL')) {
      r.achievements.push('FACTION_GENERAL');
    }
  }
  if (w) {
    w.isGeneral = true;
    if (!w.achievements.includes('FACTION_GENERAL')) {
      w.achievements.push('FACTION_GENERAL');
    }
  }
  saveUsers(all);
};

export const resetEventPoints = (): void => {
  const all = getRawUsers();
  all.forEach(u => { u.eventPoints = 0; });
  saveUsers(all);
};

// ============================================================
// BACKUP / RESTORE
// ============================================================
export const exportData = (): string =>
  JSON.stringify({
    users:    getRawUsers(), // include inactive in export
    matches:  getMatches(),
    settings: getSettings(),
    logs:     getLogs(),
    timestamp: new Date().toISOString(),
  });

export const importData = (json: string): boolean => {
  try {
    const d = JSON.parse(json);
    if (!Array.isArray(d.users)) return false;
    localStorage.setItem(USERS_KEY,    JSON.stringify(d.users));
    localStorage.setItem(MATCHES_KEY,  JSON.stringify(d.matches  || []));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(d.settings || DEFAULT_SETTINGS));
    localStorage.setItem(LOGS_KEY,     JSON.stringify(d.logs     || []));
    syncWithServer();
    return true;
  } catch { return false; }
};

// ============================================================
// SEEDING
// ============================================================
export const seedData = async (): Promise<void> => {
  if (getUsers().length > 0) return;
  const initial = [
    { name: '熱田 望',   reading: 'あつた のぞむ' },
    { name: '池田 大翔', reading: 'いけだ ひろと' },
    { name: '岩間 悠希', reading: 'いわま ゆうき' },
    { name: '辻井 琥基', reading: 'つじい こうき' },
    { name: '白石 怜大', reading: 'しらいし れお' },
    { name: '高椋 煌生', reading: 'たかむく こうき' },
    { name: '布施 皓己', reading: 'ふせ こうき' },
    { name: '吉井 千智', reading: 'よしい ちさと' },
  ];
  saveUsers(initial.map((m, i) => ({
    ...newUserBase(m.name, m.reading, i < 4),
    id:      `u${100 + i}`,
    faction: (i % 2 === 0 ? 'RED' : 'WHITE') as 'RED' | 'WHITE',
  })));
};

// ============================================================
// 級位・段位 申請システム
// ============================================================

export const getRankApplications = (): RankApplication[] => {
  try {
    const raw = localStorage.getItem(RANK_APPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

export const getPendingRankApplications = (): RankApplication[] =>
  getRankApplications().filter(a => a.status === 'PENDING');

const saveRankApplications = (apps: RankApplication[]): void => {
  localStorage.setItem(RANK_APPS_KEY, JSON.stringify(apps));
  window.dispatchEvent(new CustomEvent('rivals-rank-apps-changed', { detail: apps }));
};

/**
 * 部員が申請を提出する
 * 同じユーザーの同じsourceに対してPENDING申請が既にある場合は上書き更新
 */
export const submitRankApplication = (
  userId: string,
  source: string,
  rank: string,
  note: string
): { success: boolean; error?: string } => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, error: 'ユーザーが見つかりません' };

  const trimSource = source.trim();
  const trimRank   = rank.trim();
  if (!trimSource || !trimRank) return { success: false, error: '入力が不完全です' };

  const apps = getRankApplications();

  // 同じユーザー・同じsourceのPENDING申請があれば更新
  const existingIdx = apps.findIndex(
    a => a.userId === userId && a.source === trimSource && a.status === 'PENDING'
  );

  const entry: RankApplication = {
    id:          existingIdx >= 0 ? apps[existingIdx].id : randomId(),
    userId,
    userName:    user.name,
    source:      trimSource,
    rank:        trimRank,
    note:        note.trim(),
    submittedAt: new Date().toISOString(),
    status:      'PENDING',
  };

  if (existingIdx >= 0) apps[existingIdx] = entry;
  else apps.unshift(entry);

  saveRankApplications(apps);
  return { success: true };
};

/**
 * 管理者が申請を承認する
 * User.ranks に追加して保存
 */
export const approveRankApplication = (
  appId: string,
  reviewNote = ''
): boolean => {
  const apps = getRankApplications();
  const app = apps.find(a => a.id === appId);
  if (!app || app.status !== 'PENDING') return false;

  // User.ranks に追加
  const allUsers = getRawUsers();
  const user = allUsers.find(u => u.id === app.userId);
  if (!user) return false;

  // 同じsourceの古いランクを更新 or 新規追加
  const newRank: RankEntry = {
    id:         randomId(),
    source:     app.source,
    rank:       app.rank,
    approvedAt: new Date().toISOString(),
  };
  const existingIdx = (user.ranks || []).findIndex(r => r.source === app.source);
  if (existingIdx >= 0) user.ranks[existingIdx] = newRank;
  else user.ranks = [...(user.ranks || []), newRank];

  saveUsers(allUsers);

  // 申請ステータス更新
  app.status     = 'APPROVED';
  app.reviewedAt = new Date().toISOString();
  app.reviewNote = reviewNote;
  saveRankApplications(apps);
  syncWithServer();
  return true;
};

/**
 * 管理者が申請を却下する
 */
export const rejectRankApplication = (
  appId: string,
  reviewNote = ''
): boolean => {
  const apps = getRankApplications();
  const app = apps.find(a => a.id === appId);
  if (!app || app.status !== 'PENDING') return false;

  app.status     = 'REJECTED';
  app.reviewedAt = new Date().toISOString();
  app.reviewNote = reviewNote;
  saveRankApplications(apps);
  return true;
};

/**
 * 管理者が承認済みランクを剥奪する
 */
export const removeRank = (userId: string, rankId: string): void => {
  const all = getRawUsers();
  const user = all.find(u => u.id === userId);
  if (!user) return;
  user.ranks = (user.ranks || []).filter(r => r.id !== rankId);
  saveUsers(all);
};

/**
 * 管理者が個人ページPINを変更する
 * 4桁数字のみ許可
 */
export const updateProfilePin = (userId: string, newPin: string): { success: boolean; error?: string } => {
  if (!/^\d{4}$/.test(newPin)) return { success: false, error: '4桁の数字で入力してください' };
  const all = getRawUsers();
  const u = all.find(x => x.id === userId);
  if (!u) return { success: false, error: 'ユーザーが見つかりません' };
  u.profilePin = newPin;
  saveUsers(all);
  return { success: true };
};

// ============================================================
// HELPERS USED BY UI
// ============================================================
export const getUserAvatarChar = (u: User): string =>
  (u.activeIconId && u.activeIconId !== 'DEFAULT_INITIAL')
    ? (ICONS_DATA.find(i => i.id === u.activeIconId)?.char || u.name.charAt(0))
    : u.name.charAt(0);

export const getUserIconDef = (id: string): IconDef =>
  ICONS_DATA.find(i => i.id === id) || ICONS_DATA[0];

export const playSound  = (_type: any): void => {};
export const vibrate    = (_p: any): void => {};
export const balanceFactions = (u: any) => u;
export const toggleGeneral   = (_id: any): void => {};
