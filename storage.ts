import {
  User, MatchRecord, SystemSettings, ActivityLog, ActivityType,
  AchievementDef, AttendanceResult, BackupData, PointBreakdown,
  EventType, Season, IconDef, FrameDef, RivalData, SystemTitle, TitleDef,
  SyncStatus, SyncMeta, AutoBackupEntry,
  UndoEntry, UndoActionType,
  MaintenanceState,
  RankEntry, RankApplication,
  SystemTitleHistoryEntry, SystemTitleSnapshot,
  MissionDef, MissionProgress, MissionAchieved,
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
const DEVICE_TOKEN_KEY = 'club_rivals_device_token'; // このデバイスのトークン
const APPROVED_DEVICES_KEY = 'club_rivals_approved_devices'; // 承認済みトークン一覧（設定に埋め込み）
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
  adminPin: '112233',
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

const DEFAULT_UNLOCKED_ICONS = [
  'DEFAULT_INITIAL', 'DEFAULT_SMILE', 'DEFAULT_CAT', 'DEFAULT_DOG',
  'DEFAULT_BEAR', 'DEFAULT_PIG', 'DEFAULT_RABBIT', 'DEFAULT_CHICK',
  'SHOGI_FU',
];

// ============================================================
// STATIC DATA
// ============================================================
export const SYSTEM_TITLES: TitleDef[] = [
  { id: 'MASTER',       name: '覇者',       english: 'The Master',    description: '今期レート上昇1位',      color: 'text-yellow-400' },
  { id: 'RISING_STAR',  name: '新星',       english: 'Rising Star',   description: '今期ポイント上昇1位',    color: 'text-blue-400' },
  { id: 'GRINDER',      name: '鉄人',       english: 'The Grinder',   description: '出席日数1位',            color: 'text-green-400' },
  { id: 'GIANT_KILLER', name: '巨人キラー', english: 'Giant Killer',  description: '格上撃破数No.1',         color: 'text-red-400' },
];

export const ACHIEVEMENTS_DATA: AchievementDef[] = [
  { id: 'FACTION_GENERAL', name: '大将軍', description: 'チームの大将に任命される', conditionType: 'SPECIAL', threshold: 1 },
  { id: 'DUEL_VICTORY', name: '一騎討ち', description: '敵将との直接対決を制する', conditionType: 'SPECIAL', threshold: 1 },
  { id: 'COMEBACK_3', name: '不屈', description: '3連敗後に勝利する', conditionType: 'SPECIAL', threshold: 1 },
  { id: 'COMEBACK_5', name: '逆境の勇者', description: '5連敗後に勝利する', conditionType: 'SPECIAL', threshold: 1 },
  { id: 'COMEBACK_10', name: '復活劇', description: '10連敗後に勝利する', conditionType: 'SPECIAL', threshold: 1 },
  { id: 'COLLECTION_5', name: 'コレクター', description: '称号を5個獲得する', conditionType: 'SPECIAL', threshold: 1 },
  { id: 'COLLECTION_15', name: '秘宝の番人', description: '称号を15個獲得する', conditionType: 'SPECIAL', threshold: 1 },
  { id: 'COLLECTION_30', name: '伝説の収集家', description: '称号を30個獲得する', conditionType: 'SPECIAL', threshold: 1 },
  { id: 'COLLECTION_50', name: '究極の収集家', description: '称号を50個獲得する', conditionType: 'SPECIAL', threshold: 1 },
  { id: 'RANK_FIRST', name: '公式認定', description: '段位が初めて承認される', conditionType: 'SPECIAL', threshold: 1 },
  { id: 'FIRST_LOSS', name: '初黒星', description: '初めての敗戦（ネタ称号）', conditionType: 'SPECIAL', threshold: 1 },
  { id: 'LOSSES_30', name: 'めげない心', description: '敗戦数30回', conditionType: 'SPECIAL', threshold: 1 },
  { id: 'LOSSES_100', name: '七転八起', description: '敗戦数100回', conditionType: 'SPECIAL', threshold: 1 },
  { id: 'MAX_STREAK_5', name: 'スプリンター', description: '連勝記録5以上を達成', conditionType: 'SPECIAL', threshold: 1 },
  { id: 'MAX_STREAK_10', name: '記録破り', description: '連勝記録10以上を達成', conditionType: 'SPECIAL', threshold: 1 },
  { id: 'MAX_STREAK_15', name: '伝説の連勝', description: '連勝記録15以上を達成', conditionType: 'SPECIAL', threshold: 1 },
  { id: 'MAX_STREAK_20', name: '神話', description: '連勝記録20以上を達成', conditionType: 'SPECIAL', threshold: 1 },
  { id: 'START_DASH', name: '初陣', description: '記念すべき最初の対局', conditionType: 'MATCHES', threshold: 1 },
  { id: 'MATCHES_5', name: '見習い棋士', description: '対局数5回到達', conditionType: 'MATCHES', threshold: 5 },
  { id: 'MATCHES_10', name: '駆け出し棋士', description: '対局数10回到達', conditionType: 'MATCHES', threshold: 10 },
  { id: 'MATCHES_25', name: '中堅棋士', description: '対局数25回到達', conditionType: 'MATCHES', threshold: 25 },
  { id: 'MATCHES_40', name: '盤上の常連', description: '対局数40回到達', conditionType: 'MATCHES', threshold: 40 },
  { id: 'MATCHES_50', name: '折返し地点', description: '対局数50回到達', conditionType: 'MATCHES', threshold: 50 },
  { id: 'MATCHES_80', name: '百戦錬磨', description: '対局数80回到達', conditionType: 'MATCHES', threshold: 80 },
  { id: 'MATCHES_150', name: '千局の侍', description: '対局数150回到達', conditionType: 'MATCHES', threshold: 150 },
  { id: 'MATCHES_300', name: '無限の棋士', description: '対局数300回到達', conditionType: 'MATCHES', threshold: 300 },
  { id: 'FIRST_WIN', name: '初勝利', description: '初めての勝利', conditionType: 'WINS', threshold: 1 },
  { id: 'WINS_3', name: '三連撃', description: '勝利数3回到達', conditionType: 'WINS', threshold: 3 },
  { id: 'WINS_10', name: '十人斬り', description: '勝利数10回到達', conditionType: 'WINS', threshold: 10 },
  { id: 'WINS_20', name: '二十連撃', description: '勝利数20回到達', conditionType: 'WINS', threshold: 20 },
  { id: 'WINS_30', name: '名手', description: '勝利数30回到達', conditionType: 'WINS', threshold: 30 },
  { id: 'WINS_40', name: '達人', description: '勝利数40回到達', conditionType: 'WINS', threshold: 40 },
  { id: 'WINS_50', name: '将棋の鬼', description: '勝利数50回到達', conditionType: 'WINS', threshold: 50 },
  { id: 'WINS_60', name: '覇道', description: '勝利数60回到達', conditionType: 'WINS', threshold: 60 },
  { id: 'WINS_80', name: '百勝将軍', description: '勝利数80回到達', conditionType: 'WINS', threshold: 80 },
  { id: 'WINS_100', name: '無敵の証', description: '勝利数100回到達', conditionType: 'WINS', threshold: 100 },
  { id: 'WINS_120', name: '不滅の強者', description: '勝利数120回到達', conditionType: 'WINS', threshold: 120 },
  { id: 'WINS_160', name: '伝説の棋士', description: '勝利数160回到達', conditionType: 'WINS', threshold: 160 },
  { id: 'WINS_250', name: '最強の名', description: '勝利数250回到達', conditionType: 'WINS', threshold: 250 },
  { id: 'STREAK_3', name: '好調', description: '3連勝達成', conditionType: 'STREAK', threshold: 3 },
  { id: 'STREAK_5', name: '猛攻', description: '5連勝達成', conditionType: 'STREAK', threshold: 5 },
  { id: 'STREAK_7', name: '破竹の勢い', description: '7連勝達成', conditionType: 'STREAK', threshold: 7 },
  { id: 'STREAK_10', name: '無双', description: '10連勝達成', conditionType: 'STREAK', threshold: 10 },
  { id: 'STREAK_12', name: '覚醒', description: '12連勝達成', conditionType: 'STREAK', threshold: 12 },
  { id: 'STREAK_15', name: '神がかり', description: '15連勝達成', conditionType: 'STREAK', threshold: 15 },
  { id: 'STREAK_20', name: '鬼神', description: '20連勝達成', conditionType: 'STREAK', threshold: 20 },
  { id: 'STREAK_25', name: '無敗伝説', description: '25連勝達成', conditionType: 'STREAK', threshold: 25 },
  { id: 'STREAK_30', name: '天下無双', description: '30連勝達成', conditionType: 'STREAK', threshold: 30 },
  { id: 'RATE_200', name: '第一歩', description: 'レート200到達', conditionType: 'RATE', threshold: 200 },
  { id: 'RATE_400', name: '登り坂', description: 'レート400到達', conditionType: 'RATE', threshold: 400 },
  { id: 'RATE_600', name: '中堅入り', description: 'レート600到達', conditionType: 'RATE', threshold: 600 },
  { id: 'RATE_800', name: '脱・初心者', description: 'レート800到達', conditionType: 'RATE', threshold: 800 },
  { id: 'RATE_950', name: '実力者', description: 'レート950到達', conditionType: 'RATE', threshold: 950 },
  { id: 'RATE_1100', name: '熟練者', description: 'レート1100到達', conditionType: 'RATE', threshold: 1100 },
  { id: 'RATE_1250', name: '精鋭', description: 'レート1250到達', conditionType: 'RATE', threshold: 1250 },
  { id: 'RATE_1400', name: 'マスター', description: 'レート1400到達', conditionType: 'RATE', threshold: 1400 },
  { id: 'RATE_1550', name: '超越者', description: 'レート1550到達', conditionType: 'RATE', threshold: 1550 },
  { id: 'RATE_1700', name: 'レジェンド', description: 'レート1700到達', conditionType: 'RATE', threshold: 1700 },
  { id: 'RATE_1900', name: '覇王', description: 'レート1900到達', conditionType: 'RATE', threshold: 1900 },
  { id: 'RATE_2100', name: '神の領域', description: 'レート2100到達', conditionType: 'RATE', threshold: 2100 },
  { id: 'RATE_2300', name: '雲の上', description: 'レート2300到達', conditionType: 'RATE', threshold: 2300 },
  { id: 'RATE_2500', name: '至高', description: 'レート2500到達', conditionType: 'RATE', threshold: 2500 },
  { id: 'DAYS_5', name: '将棋好き', description: '活動日数5日到達', conditionType: 'DAYS', threshold: 5 },
  { id: 'DAYS_15', name: '常連', description: '活動日数15日到達', conditionType: 'DAYS', threshold: 15 },
  { id: 'DAYS_25', name: '部室の主', description: '活動日数25日到達', conditionType: 'DAYS', threshold: 25 },
  { id: 'DAYS_40', name: '皆勤候補', description: '活動日数40日到達', conditionType: 'DAYS', threshold: 40 },
  { id: 'DAYS_55', name: '熱心な部員', description: '活動日数55日到達', conditionType: 'DAYS', threshold: 55 },
  { id: 'DAYS_70', name: '生ける伝説', description: '活動日数70日到達', conditionType: 'DAYS', threshold: 70 },
  { id: 'DAYS_100', name: '部の柱', description: '活動日数100日到達', conditionType: 'DAYS', threshold: 100 },
  { id: 'DAYS_140', name: '鉄の意志', description: '活動日数140日到達', conditionType: 'DAYS', threshold: 140 },
  { id: 'DAYS_180', name: '永遠の棋士', description: '活動日数180日到達', conditionType: 'DAYS', threshold: 180 },
  { id: 'DAYS_210', name: '殿堂', description: '活動日数210日到達（3年フル参加）', conditionType: 'DAYS', threshold: 210 },
  { id: 'DRAWS_1', name: '初和解', description: '引き分け1回', conditionType: 'DRAWS', threshold: 1 },
  { id: 'DRAWS_5', name: '均衡', description: '引き分け5回', conditionType: 'DRAWS', threshold: 5 },
  { id: 'DRAWS_10', name: '静寂の盤', description: '引き分け10回', conditionType: 'DRAWS', threshold: 10 },
  { id: 'DRAWS_20', name: '禅の境地', description: '引き分け20回', conditionType: 'DRAWS', threshold: 20 },
  { id: 'DRAWS_30', name: '引き分け職人', description: '引き分け30回', conditionType: 'DRAWS', threshold: 30 },
  { id: 'DRAWS_50', name: '虚無', description: '引き分け50回', conditionType: 'DRAWS', threshold: 50 },
  { id: 'POINTS_50', name: '活動者', description: '総ポイント50到達', conditionType: 'POINTS', threshold: 50 },
  { id: 'POINTS_150', name: '勤勉家', description: '総ポイント150到達', conditionType: 'POINTS', threshold: 150 },
  { id: 'POINTS_300', name: '精力的', description: '総ポイント300到達', conditionType: 'POINTS', threshold: 300 },
  { id: 'POINTS_600', name: '牽引役', description: '総ポイント600到達', conditionType: 'POINTS', threshold: 600 },
  { id: 'POINTS_1200', name: '部の功労者', description: '総ポイント1200到達', conditionType: 'POINTS', threshold: 1200 },
  { id: 'POINTS_2500', name: '金字塔', description: '総ポイント2500到達', conditionType: 'POINTS', threshold: 2500 },
  { id: 'POINTS_4000', name: '金剛', description: '総ポイント4000到達', conditionType: 'POINTS', threshold: 4000 },
  { id: 'POINTS_6000', name: '無限の積み重ね', description: '総ポイント6000到達', conditionType: 'POINTS', threshold: 6000 },
  { id: 'UPSET_1', name: '番狂わせ', description: '格上（+100以上）に勝利', conditionType: 'UPSET_WINS', threshold: 1 },
  { id: 'UPSET_10', name: 'ジャイアントキリング', description: '格上撃破10回', conditionType: 'UPSET_WINS', threshold: 10 },
  { id: 'UPSET_20', name: '下剋上', description: '格上撃破20回', conditionType: 'UPSET_WINS', threshold: 20 },
  { id: 'UPSET_30', name: '巨人の天敵', description: '格上撃破30回', conditionType: 'UPSET_WINS', threshold: 30 },
  { id: 'UPSET_50', name: '不可能を可能に', description: '格上撃破50回', conditionType: 'UPSET_WINS', threshold: 50 }
];
export const ICONS_DATA: IconDef[] = [
  { id: 'DEFAULT_INITIAL', char: '名', name: '頭文字', conditionDescription: 'デフォルト', type: 'DEFAULT', category: 'DEFAULT' },
  { id: 'DEFAULT_SMILE', char: '🙂', name: 'スマイル', conditionDescription: 'デフォルト', type: 'DEFAULT', category: 'DEFAULT' },
  { id: 'DEFAULT_CAT', char: '🐱', name: 'ねこ', conditionDescription: '最初から所持', type: 'DEFAULT', category: 'DEFAULT' },
  { id: 'DEFAULT_DOG', char: '🐶', name: 'いぬ', conditionDescription: '最初から所持', type: 'DEFAULT', category: 'DEFAULT' },
  { id: 'DEFAULT_BEAR', char: '🐻', name: 'くま', conditionDescription: '最初から所持', type: 'DEFAULT', category: 'DEFAULT' },
  { id: 'DEFAULT_PIG', char: '🐷', name: 'ぶた', conditionDescription: '最初から所持', type: 'DEFAULT', category: 'DEFAULT' },
  { id: 'DEFAULT_RABBIT', char: '🐰', name: 'うさぎ', conditionDescription: '最初から所持', type: 'DEFAULT', category: 'DEFAULT' },
  { id: 'DEFAULT_CHICK', char: '🐤', name: 'ひよこ', conditionDescription: '最初から所持', type: 'DEFAULT', category: 'DEFAULT' },
  { id: 'DEFAULT_BUTTERFLY', char: '🦋', name: 'ちょうちょ', conditionDescription: '初勝利', type: 'WINS', category: 'DEFAULT', threshold: 1 },
  { id: 'DEFAULT_TURTLE', char: '🐢', name: 'かめ', conditionDescription: '対局20回', type: 'MATCHES', category: 'DEFAULT', threshold: 20 },
  { id: 'DEFAULT_PENGUIN', char: '🐧', name: 'ペンギン', conditionDescription: '出席5日', type: 'DAYS', category: 'DEFAULT', threshold: 5 },
  { id: 'DEFAULT_PANDA', char: '🐼', name: 'パンダ', conditionDescription: '対局5回', type: 'MATCHES', category: 'DEFAULT', threshold: 5 },
  { id: 'DEFAULT_TIGER', char: '🐯', name: 'とら', conditionDescription: '勝利5回', type: 'WINS', category: 'DEFAULT', threshold: 5 },
  { id: 'DEFAULT_OWL', char: '🦉', name: 'ふくろう', conditionDescription: '出席10日', type: 'DAYS', category: 'DEFAULT', threshold: 10 },
  { id: 'DEFAULT_SHARK', char: '🦈', name: 'さめ', conditionDescription: '格上に初勝利', type: 'SPECIAL', category: 'DEFAULT' },
  { id: 'DEFAULT_LION', char: '🦁', name: 'ライオン', conditionDescription: '勝利20回', type: 'WINS', category: 'DEFAULT', threshold: 20 },
  { id: 'DEFAULT_EAGLE', char: '🦅', name: 'わし', conditionDescription: 'レート400到達', type: 'RATE', category: 'DEFAULT', threshold: 400 },
  { id: 'DEFAULT_FOX', char: '🦊', name: 'きつね', conditionDescription: '連勝5以上', type: 'STREAK', category: 'DEFAULT', threshold: 5 },
  { id: 'DEFAULT_WOLF', char: '🐺', name: 'おおかみ', conditionDescription: '勝利30回', type: 'WINS', category: 'DEFAULT', threshold: 30 },
  { id: 'DEFAULT_DRAGON', char: '🐉', name: '龍', conditionDescription: '勝利100回', type: 'WINS', category: 'DEFAULT', threshold: 100 },
  { id: 'DEFAULT_HEDGEHOG', char: '🦔', name: 'はりねずみ', conditionDescription: '引き分け3回', type: 'DRAWS', category: 'DEFAULT', threshold: 3 },
  { id: 'DEFAULT_OCTOPUS', char: '🐙', name: 'たこ', conditionDescription: '引き分け10回', type: 'DRAWS', category: 'DEFAULT', threshold: 10 },
  { id: 'DEFAULT_FISH', char: '🐠', name: 'さかな', conditionDescription: '総ポイント150', type: 'POINTS', category: 'DEFAULT', threshold: 150 },
  { id: 'DEFAULT_TANUKI', char: '🦝', name: 'たぬき', conditionDescription: '出席30日', type: 'DAYS', category: 'DEFAULT', threshold: 30 },
  { id: 'DEFAULT_CRAB', char: '🦀', name: 'かに', conditionDescription: '総ポイント600', type: 'POINTS', category: 'DEFAULT', threshold: 600 },
  { id: 'DEFAULT_CROW', char: '🐦', name: 'からす', conditionDescription: '連勝10以上', type: 'STREAK', category: 'DEFAULT', threshold: 10 },
  { id: 'DEFAULT_SEAL', char: '🦭', name: 'あざらし', conditionDescription: '引き分け20回', type: 'DRAWS', category: 'DEFAULT', threshold: 20 },
  { id: 'DEFAULT_PIRATE', char: '🏴‍☠️', name: '海賊', conditionDescription: '格上撃破10回', type: 'SPECIAL', category: 'DEFAULT' },
  { id: 'DEFAULT_DODO', char: '🦤', name: 'ドードー', conditionDescription: '10連敗記録', type: 'SPECIAL', category: 'DEFAULT' },
  { id: 'SHOGI_FU', char: '歩兵', name: '歩兵', conditionDescription: '最初から所持', type: 'DEFAULT', category: 'SHOGI' },
  { id: 'SHOGI_TO', char: 'と金', name: 'と金', conditionDescription: '対局数3回', type: 'MATCHES', category: 'SHOGI', threshold: 3 },
  { id: 'SHOGI_KY', char: '香車', name: '香車', conditionDescription: '対局数5回', type: 'MATCHES', category: 'SHOGI', threshold: 5 },
  { id: 'SHOGI_NKY', char: '成香', name: '成香', conditionDescription: '対局数10回', type: 'MATCHES', category: 'SHOGI', threshold: 10 },
  { id: 'SHOGI_KE', char: '桂馬', name: '桂馬', conditionDescription: '勝利数3回', type: 'WINS', category: 'SHOGI', threshold: 3 },
  { id: 'SHOGI_NKE', char: '成桂', name: '成桂', conditionDescription: '勝利数5回', type: 'WINS', category: 'SHOGI', threshold: 5 },
  { id: 'SHOGI_GI', char: '銀将', name: '銀将', conditionDescription: '勝利数7回', type: 'WINS', category: 'SHOGI', threshold: 7 },
  { id: 'SHOGI_NGI', char: '成銀', name: '成銀', conditionDescription: '勝利数12回', type: 'WINS', category: 'SHOGI', threshold: 12 },
  { id: 'SHOGI_KI', char: '金将', name: '金将', conditionDescription: '勝利数15回', type: 'WINS', category: 'SHOGI', threshold: 15 },
  { id: 'SHOGI_KA', char: '角行', name: '角行', conditionDescription: 'レート700到達', type: 'RATE', category: 'SHOGI', threshold: 700 },
  { id: 'SHOGI_UMA', char: '龍馬', name: '龍馬', conditionDescription: 'レート900到達', type: 'RATE', category: 'SHOGI', threshold: 900 },
  { id: 'SHOGI_HI', char: '飛車', name: '飛車', conditionDescription: 'レート800到達', type: 'RATE', category: 'SHOGI', threshold: 800 },
  { id: 'SHOGI_RYU', char: '龍王', name: '龍王', conditionDescription: 'レート1050到達', type: 'RATE', category: 'SHOGI', threshold: 1050 },
  { id: 'SHOGI_OU', char: '王将', name: '王将', conditionDescription: 'レート1200到達', type: 'RATE', category: 'SHOGI', threshold: 1200 },
  { id: 'SHOGI_GYOKU', char: '玉将', name: '玉将', conditionDescription: 'レート1400到達', type: 'RATE', category: 'SHOGI', threshold: 1400 },
  { id: 'SHOGI_FU2', char: '歩', name: '歩（古体）', conditionDescription: '対局数80回', type: 'MATCHES', category: 'SHOGI', threshold: 80 },
  { id: 'SHOGI_GI2', char: '銀', name: '銀（草書）', conditionDescription: '活動日数70日', type: 'DAYS', category: 'SHOGI', threshold: 70 },
  { id: 'SHOGI_KI2', char: '金', name: '金（古風）', conditionDescription: '活動日数100日', type: 'DAYS', category: 'SHOGI', threshold: 100 },
  { id: 'SHOGI_OU2', char: '王', name: '王（草書）', conditionDescription: 'レート1700到達', type: 'RATE', category: 'SHOGI', threshold: 1700 },
  { id: 'SHOGI_GYOKU2', char: '玉', name: '玉（古体）', conditionDescription: 'レート2100到達', type: 'RATE', category: 'SHOGI', threshold: 2100 },
  { id: 'SHOGI_RYU2', char: '飛', name: '飛（草書）', conditionDescription: '勝利数160回', type: 'WINS', category: 'SHOGI', threshold: 160 },
  { id: 'SHOGI_UMA2', char: '角', name: '角（草書）', conditionDescription: '連勝記録15', type: 'SPECIAL', category: 'SHOGI' },
  { id: 'CHESS_PAWN', char: '♟️', name: 'ポーン', conditionDescription: '勝利数20回', type: 'WINS', category: 'CHESS', threshold: 20 },
  { id: 'CHESS_KNIGHT', char: '♞', name: 'ナイト', conditionDescription: '勝利数40回', type: 'WINS', category: 'CHESS', threshold: 40 },
  { id: 'CHESS_BISHOP', char: '♝', name: 'ビショップ', conditionDescription: 'レート950到達', type: 'RATE', category: 'CHESS', threshold: 950 },
  { id: 'CHESS_ROOK', char: '♜', name: 'ルーク', conditionDescription: 'レート1100到達', type: 'RATE', category: 'CHESS', threshold: 1100 },
  { id: 'CHESS_QUEEN', char: '♛', name: 'クイーン', conditionDescription: 'レート1400到達', type: 'RATE', category: 'CHESS', threshold: 1400 },
  { id: 'CHESS_KING', char: '♚', name: 'キング', conditionDescription: 'レート1700到達', type: 'RATE', category: 'CHESS', threshold: 1700 },
  { id: 'SPECIAL_SAKURA', char: '🌸', name: '桜', conditionDescription: '春季限定', type: 'SPECIAL', category: 'SPECIAL', isLimited: true },
  { id: 'SPECIAL_HIMAWARI', char: '🌻', name: 'ひまわり', conditionDescription: '夏季限定', type: 'SPECIAL', category: 'SPECIAL', isLimited: true },
  { id: 'SPECIAL_MOMIJI', char: '🍁', name: '紅葉', conditionDescription: '秋季限定', type: 'SPECIAL', category: 'SPECIAL', isLimited: true },
  { id: 'SPECIAL_YUKI', char: '❄️', name: '雪', conditionDescription: '冬季限定', type: 'SPECIAL', category: 'SPECIAL', isLimited: true },
  { id: 'SPECIAL_KOINOBORI', char: '🎏', name: '鯉のぼり', conditionDescription: '春の合宿参加', type: 'SPECIAL', category: 'SPECIAL', isLimited: true },
  { id: 'SPECIAL_HANABI', char: '🎆', name: '花火', conditionDescription: '夏の合宿参加', type: 'SPECIAL', category: 'SPECIAL', isLimited: true },
  { id: 'SPECIAL_MATSU', char: '🎍', name: '松飾り', conditionDescription: '3学期参加', type: 'SPECIAL', category: 'SPECIAL', isLimited: true },
  { id: 'SPECIAL_SAKURA2', char: '🌸❄', name: '卒業桜', conditionDescription: '卒部・引退時', type: 'SPECIAL', category: 'SPECIAL', isLimited: true },
  { id: 'SPECIAL_KITSUNE', char: '🦊', name: 'きつね', conditionDescription: '連勝5以上（SPECIALタブ）', type: 'STREAK', category: 'SPECIAL', threshold: 5 },
  { id: 'SPECIAL_TANUKI', char: '🦝', name: 'たぬき', conditionDescription: '出席30日', type: 'DAYS', category: 'SPECIAL', threshold: 30 },
  { id: 'SPECIAL_DRAGON', char: '🐉', name: '龍（S）', conditionDescription: '勝利100回', type: 'WINS', category: 'SPECIAL', threshold: 100 },
  { id: 'SPECIAL_STAR', char: '⭐', name: '星', conditionDescription: '四天王に選出', type: 'SPECIAL', category: 'SPECIAL' },
  { id: 'SPECIAL_CROWN', char: '👑', name: '王冠', conditionDescription: '四天王に2回以上選出', type: 'SPECIAL', category: 'SPECIAL' },
  { id: 'SPECIAL_FIRE', char: '🔥', name: '炎', conditionDescription: '10連勝達成', type: 'STREAK', category: 'SPECIAL', threshold: 10 },
  { id: 'SPECIAL_ZEN', char: '☯️', name: '禅', conditionDescription: '引き分け20回', type: 'DRAWS', category: 'SPECIAL', threshold: 20 },
  { id: 'SPECIAL_VOLCANO', char: '🌋', name: '火山', conditionDescription: '15連勝達成', type: 'STREAK', category: 'SPECIAL', threshold: 15 },
  { id: 'SPECIAL_WAVE', char: '🌊', name: '大波', conditionDescription: '20連勝達成', type: 'STREAK', category: 'SPECIAL', threshold: 20 },
  { id: 'SPECIAL_TYPHOON', char: '🌪️', name: '竜巻', conditionDescription: '25連勝達成', type: 'STREAK', category: 'SPECIAL', threshold: 25 },
  { id: 'SPECIAL_SPROUT', char: '🌱', name: '芽', conditionDescription: 'レート400到達', type: 'RATE', category: 'SPECIAL', threshold: 400 },
  { id: 'SPECIAL_TREE', char: '🌳', name: '大樹', conditionDescription: 'レート800到達', type: 'RATE', category: 'SPECIAL', threshold: 800 },
  { id: 'SPECIAL_FUJI', char: '🗻', name: '富士山', conditionDescription: 'レート1400到達', type: 'RATE', category: 'SPECIAL', threshold: 1400 },
  { id: 'SPECIAL_GALAXY', char: '🌌', name: '銀河', conditionDescription: 'レート1900到達', type: 'RATE', category: 'SPECIAL', threshold: 1900 },
  { id: 'SPECIAL_COIN', char: '💰', name: '小判', conditionDescription: '総ポイント300', type: 'POINTS', category: 'SPECIAL', threshold: 300 },
  { id: 'SPECIAL_DIAMOND', char: '💎', name: 'ダイヤ', conditionDescription: '総ポイント1200', type: 'POINTS', category: 'SPECIAL', threshold: 1200 },
  { id: 'SPECIAL_VAULT', char: '🏦', name: '金庫', conditionDescription: '総ポイント4000', type: 'POINTS', category: 'SPECIAL', threshold: 4000 },
  { id: 'SPECIAL_TARGET', char: '🎯', name: '的', conditionDescription: '対局150回', type: 'MATCHES', category: 'SPECIAL', threshold: 150 },
  { id: 'SPECIAL_MEDAL', char: '🏅', name: 'メダル', conditionDescription: '対局300回', type: 'MATCHES', category: 'SPECIAL', threshold: 300 },
  { id: 'SPECIAL_SWORDS', char: '⚔️', name: '交差する剣', conditionDescription: '勝利60回', type: 'WINS', category: 'SPECIAL', threshold: 60 },
  { id: 'SPECIAL_RIBBON', char: '🎗️', name: 'リボン', conditionDescription: '勝利160回', type: 'WINS', category: 'SPECIAL', threshold: 160 },
  { id: 'SPECIAL_AXE', char: '🪓', name: '斧', conditionDescription: '格上（+200）に勝利', type: 'SPECIAL', category: 'SPECIAL' },
  { id: 'SPECIAL_DAGGER', char: '🗡️', name: '短剣', conditionDescription: '格上（+300）に勝利', type: 'SPECIAL', category: 'SPECIAL' },
  { id: 'SPECIAL_FIST', char: '👊', name: 'こぶし', conditionDescription: '格上撃破20回', type: 'SPECIAL', category: 'SPECIAL' },
  { id: 'SPECIAL_BOMB', char: '💣', name: '爆弾', conditionDescription: '格上撃破50回', type: 'SPECIAL', category: 'SPECIAL' },
  { id: 'SPECIAL_TROPHY', char: '🏆', name: 'トロフィー', conditionDescription: '勝利80回', type: 'WINS', category: 'SPECIAL', threshold: 80 },
  { id: 'SPECIAL_SCALES', char: '⚖️', name: '天秤', conditionDescription: '引き分け15回', type: 'DRAWS', category: 'SPECIAL', threshold: 15 },
  { id: 'SPECIAL_HANDSHAKE', char: '🤝', name: '握手', conditionDescription: '引き分け30回', type: 'DRAWS', category: 'SPECIAL', threshold: 30 },
  { id: 'SPECIAL_DOOR', char: '🚪', name: '扉', conditionDescription: '出席3日', type: 'DAYS', category: 'SPECIAL', threshold: 3 },
  { id: 'SPECIAL_CLOCK', char: '⏰', name: '時計', conditionDescription: '出席55日', type: 'DAYS', category: 'SPECIAL', threshold: 55 },
  { id: 'SPECIAL_HOME', char: '🏠', name: '家', conditionDescription: '出席100日', type: 'DAYS', category: 'SPECIAL', threshold: 100 },
  { id: 'SPECIAL_PALACE', char: '🏛️', name: '殿堂', conditionDescription: '出席180日', type: 'DAYS', category: 'SPECIAL', threshold: 180 },
  { id: 'SPECIAL_EGG', char: '🥚', name: 'たまご', conditionDescription: '称号を5個獲得', type: 'SPECIAL', category: 'SPECIAL' },
  { id: 'SPECIAL_KEY', char: '🗝️', name: '鍵', conditionDescription: '称号を15個獲得', type: 'SPECIAL', category: 'SPECIAL' },
  { id: 'SPECIAL_CRYSTAL', char: '🔮', name: '水晶球', conditionDescription: '称号を30個獲得', type: 'SPECIAL', category: 'SPECIAL' },
  { id: 'SPECIAL_WAND', char: '🪄', name: '魔法の杖', conditionDescription: '称号を50個獲得', type: 'SPECIAL', category: 'SPECIAL' },
  { id: 'SPECIAL_LIGHTNING', char: '⚡', name: '雷帝', conditionDescription: '10連勝＋格上撃破あり', type: 'SPECIAL', category: 'SPECIAL' },
  { id: 'SPECIAL_ONI', char: '👹', name: '鬼', conditionDescription: '格上撃破10回', type: 'SPECIAL', category: 'SPECIAL' },
  { id: 'SPECIAL_NINJA', char: '🥷', name: '忍者', conditionDescription: '格上撃破20回', type: 'SPECIAL', category: 'SPECIAL' },
  { id: 'SPECIAL_SKULL', char: '💀', name: '骸骨', conditionDescription: '敗戦100回', type: 'SPECIAL', category: 'SPECIAL' },
  { id: 'SPECIAL_ICE', char: '🧊', name: '氷塊', conditionDescription: '連敗10回', type: 'SPECIAL', category: 'SPECIAL' },
  { id: 'SPECIAL_PHOENIX', char: '🐦', name: '不死鳥', conditionDescription: '5連敗後に勝利', type: 'SPECIAL', category: 'SPECIAL' },
  { id: 'SPECIAL_HAT', char: '🎩', name: '帽子', conditionDescription: 'アイコン20種解放', type: 'SPECIAL', category: 'SPECIAL' },
  { id: 'ELITE_MASTER_SWORD', char: '⚔️', name: '覇者の剣', conditionDescription: '覇者に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'MASTER', isLimited: true },
  { id: 'ELITE_MASTER_SHIELD', char: '🛡', name: '覇者の盾', conditionDescription: '覇者に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'MASTER', isLimited: true },
  { id: 'ELITE_MASTER_CROWN', char: '👑', name: '覇者の冠', conditionDescription: '覇者に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'MASTER', isLimited: true },
  { id: 'ELITE_MASTER_GOLD', char: '🏆', name: '金杯', conditionDescription: '覇者に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'MASTER', isLimited: true },
  { id: 'ELITE_MASTER_LION', char: '🦁', name: '百獣の王', conditionDescription: '覇者に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'MASTER', isLimited: true },
  { id: 'ELITE_MASTER_FLAME', char: '🔥', name: '覇者の炎', conditionDescription: '覇者に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'MASTER', isLimited: true },
  { id: 'ELITE_MASTER_STAR', char: '⭐', name: '覇者の星', conditionDescription: '覇者に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'MASTER', isLimited: true },
  { id: 'ELITE_MASTER_CASTLE', char: '🏯', name: '城', conditionDescription: '覇者に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'MASTER', isLimited: true },
  { id: 'ELITE_MASTER_HAWK', char: '🦅', name: '鷹', conditionDescription: '覇者に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'MASTER', isLimited: true },
  { id: 'ELITE_MASTER_SUN', char: '☀️', name: '太陽', conditionDescription: '覇者に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'MASTER', isLimited: true },
  { id: 'ELITE_RISING_STAR', char: '🌟', name: '金の星', conditionDescription: '新星に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'RISING_STAR', isLimited: true },
  { id: 'ELITE_RISING_METEOR', char: '☄️', name: '流星', conditionDescription: '新星に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'RISING_STAR', isLimited: true },
  { id: 'ELITE_RISING_ROCKET', char: '🚀', name: '急上昇', conditionDescription: '新星に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'RISING_STAR', isLimited: true },
  { id: 'ELITE_RISING_COMET', char: '💫', name: '彗星', conditionDescription: '新星に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'RISING_STAR', isLimited: true },
  { id: 'ELITE_RISING_ANGEL', char: '😇', name: '新星の翼', conditionDescription: '新星に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'RISING_STAR', isLimited: true },
  { id: 'ELITE_RISING_MOON', char: '🌙', name: '月', conditionDescription: '新星に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'RISING_STAR', isLimited: true },
  { id: 'ELITE_RISING_SPACE', char: '🌌', name: '宇宙', conditionDescription: '新星に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'RISING_STAR', isLimited: true },
  { id: 'ELITE_RISING_PRISM', char: '🔮', name: 'プリズム', conditionDescription: '新星に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'RISING_STAR', isLimited: true },
  { id: 'ELITE_RISING_LIGHT', char: '✨', name: '光', conditionDescription: '新星に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'RISING_STAR', isLimited: true },
  { id: 'ELITE_RISING_WING', char: '🕊️', name: '翼', conditionDescription: '新星に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'RISING_STAR', isLimited: true },
  { id: 'ELITE_GRINDER_IRON', char: '⚙️', name: '鉄の歯車', conditionDescription: '鉄人に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'GRINDER', isLimited: true },
  { id: 'ELITE_GRINDER_MUSCLE', char: '💪', name: '鉄腕', conditionDescription: '鉄人に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'GRINDER', isLimited: true },
  { id: 'ELITE_GRINDER_ANVIL', char: '🔩', name: '鉄のボルト', conditionDescription: '鉄人に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'GRINDER', isLimited: true },
  { id: 'ELITE_GRINDER_ROBOT', char: '🤖', name: '鉄人ロボ', conditionDescription: '鉄人に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'GRINDER', isLimited: true },
  { id: 'ELITE_GRINDER_BULL', char: '🐂', name: '鉄牛', conditionDescription: '鉄人に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'GRINDER', isLimited: true },
  { id: 'ELITE_GRINDER_ANVIL2', char: '🏋️', name: 'ダンベル', conditionDescription: '鉄人に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'GRINDER', isLimited: true },
  { id: 'ELITE_GRINDER_FORT', char: '🏯', name: '要塞', conditionDescription: '鉄人に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'GRINDER', isLimited: true },
  { id: 'ELITE_GRINDER_MTN', char: '⛰️', name: '山', conditionDescription: '鉄人に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'GRINDER', isLimited: true },
  { id: 'ELITE_GRINDER_GORILLA', char: '🦍', name: '鉄の意志', conditionDescription: '鉄人に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'GRINDER', isLimited: true },
  { id: 'ELITE_GRINDER_TRAIN', char: '🚂', name: '機関車', conditionDescription: '鉄人に選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'GRINDER', isLimited: true },
  { id: 'ELITE_KILLER_SKULL', char: '💀', name: '骸骨', conditionDescription: '巨人キラーに選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'GIANT_KILLER', isLimited: true },
  { id: 'ELITE_KILLER_AXE', char: '🪓', name: '斧', conditionDescription: '巨人キラーに選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'GIANT_KILLER', isLimited: true },
  { id: 'ELITE_KILLER_NINJA', char: '🥷', name: '忍者', conditionDescription: '巨人キラーに選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'GIANT_KILLER', isLimited: true },
  { id: 'ELITE_KILLER_WOLF', char: '🐺', name: '一匹狼', conditionDescription: '巨人キラーに選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'GIANT_KILLER', isLimited: true },
  { id: 'ELITE_KILLER_VIPER', char: '🐍', name: '毒蛇', conditionDescription: '巨人キラーに選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'GIANT_KILLER', isLimited: true },
  { id: 'ELITE_KILLER_STAR', char: '🌠', name: '流れ星', conditionDescription: '巨人キラーに選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'GIANT_KILLER', isLimited: true },
  { id: 'ELITE_KILLER_SHURIKEN', char: '🌀', name: '手裏剣', conditionDescription: '巨人キラーに選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'GIANT_KILLER', isLimited: true },
  { id: 'ELITE_KILLER_SPIDER', char: '🕷️', name: '蜘蛛', conditionDescription: '巨人キラーに選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'GIANT_KILLER', isLimited: true },
  { id: 'ELITE_KILLER_DAGGER', char: '🗡️', name: '刃', conditionDescription: '巨人キラーに選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'GIANT_KILLER', isLimited: true },
  { id: 'ELITE_KILLER_BOMB', char: '💥', name: '爆裂', conditionDescription: '巨人キラーに選出中のみ', type: 'SPECIAL', category: 'ELITE', requiredTitle: 'GIANT_KILLER', isLimited: true },
  { id: 'ELITE_COMMON_GEM', char: '💎', name: '宝石', conditionDescription: '四天王に選出中のみ', type: 'SPECIAL', category: 'ELITE', isLimited: true },
  { id: 'ELITE_COMMON_THUNDER', char: '⚡', name: '雷帝', conditionDescription: '四天王に選出中のみ', type: 'SPECIAL', category: 'ELITE', isLimited: true },
  { id: 'ELITE_COMMON_DRAGON', char: '🐲', name: '神龍', conditionDescription: '四天王に選出中のみ', type: 'SPECIAL', category: 'ELITE', isLimited: true },
  { id: 'ELITE_COMMON_SHRINE', char: '⛩️', name: '武者', conditionDescription: '四天王に選出中のみ', type: 'SPECIAL', category: 'ELITE', isLimited: true },
  { id: 'ELITE_COMMON_FLAME', char: '🔥', name: '業火', conditionDescription: '四天王に選出中のみ', type: 'SPECIAL', category: 'ELITE', isLimited: true },
  { id: 'ELITE_COMMON_MOON', char: '🌕', name: '満月', conditionDescription: '四天王に選出中のみ', type: 'SPECIAL', category: 'ELITE', isLimited: true },
  { id: 'ELITE_COMMON_AURORA', char: '🌌', name: 'オーロラ', conditionDescription: '四天王に選出中のみ', type: 'SPECIAL', category: 'ELITE', isLimited: true },
  { id: 'ELITE_COMMON_CROWN', char: '👑', name: '黄金の冠', conditionDescription: '四天王に選出中のみ', type: 'SPECIAL', category: 'ELITE', isLimited: true },
  { id: 'ELITE_COMMON_INFINITY', char: '♾️', name: '無限', conditionDescription: '四天王に選出中のみ', type: 'SPECIAL', category: 'ELITE', isLimited: true },
  { id: 'ELITE_COMMON_SWORD', char: '🗡️', name: '神の剣', conditionDescription: '四天王に選出中のみ', type: 'SPECIAL', category: 'ELITE', isLimited: true }
];
export const FRAMES_DATA: FrameDef[] = [
  { id: 'FRAME_NONE', name: 'なし', description: 'フレームなし', ringClass: '', glowClass: '', isEliteOnly: false },
  { id: 'FRAME_DEFAULT', name: '標準', description: 'デフォルトフレーム', ringClass: 'ring-2 ring-white/20', glowClass: '', isEliteOnly: false },
  { id: 'FRAME_BLUE', name: 'ブルー', description: '対局数10回以上', ringClass: 'ring-2 ring-blue-500', glowClass: 'shadow-[0_0_8px_rgba(59,130,246,0.6)]', isEliteOnly: false },
  { id: 'FRAME_GREEN', name: 'グリーン', description: '出席25日以上', ringClass: 'ring-2 ring-green-500', glowClass: 'shadow-[0_0_8px_rgba(34,197,94,0.6)]', isEliteOnly: false },
  { id: 'FRAME_SILVER', name: 'シルバー', description: '勝利10回以上', ringClass: 'ring-2 ring-slate-400', glowClass: 'shadow-[0_0_6px_rgba(148,163,184,0.5)]', isEliteOnly: false },
  { id: 'FRAME_RED', name: 'レッド', description: '勝利30回以上', ringClass: 'ring-2 ring-red-500', glowClass: 'shadow-[0_0_8px_rgba(239,68,68,0.6)]', isEliteOnly: false },
  { id: 'FRAME_PURPLE', name: 'パープル', description: '勝利50回以上', ringClass: 'ring-2 ring-purple-500', glowClass: 'shadow-[0_0_8px_rgba(168,85,247,0.6)]', isEliteOnly: false },
  { id: 'FRAME_ORANGE', name: 'オレンジ', description: '連勝5以上を達成', ringClass: 'ring-2 ring-orange-500', glowClass: 'shadow-[0_0_8px_rgba(249,115,22,0.6)]', isEliteOnly: false },
  { id: 'FRAME_WHITE', name: 'ホワイト', description: '活動日数40日以上', ringClass: 'ring-2 ring-white', glowClass: 'shadow-[0_0_8px_rgba(255,255,255,0.5)]', isEliteOnly: false },
  { id: 'FRAME_CYAN', name: 'シアン', description: 'レート950以上', ringClass: 'ring-2 ring-cyan-500', glowClass: 'shadow-[0_0_8px_rgba(6,182,212,0.6)]', isEliteOnly: false },
  { id: 'FRAME_EMERALD', name: 'エメラルド', description: '出席70日以上', ringClass: 'ring-[3px] ring-emerald-400', glowClass: 'shadow-[0_0_12px_rgba(52,211,153,0.7)]', isEliteOnly: false },
  { id: 'FRAME_DEEPSEA', name: '深海', description: 'レート1250以上', ringClass: 'ring-2 ring-cyan-600', glowClass: 'shadow-[0_0_12px_rgba(8,145,178,0.7)]', isEliteOnly: false },
  { id: 'FRAME_FIRE', name: '炎', description: 'レート1700以上', ringClass: 'ring-[3px] ring-orange-500 animate-pulse', glowClass: 'shadow-[0_0_16px_rgba(249,115,22,0.8)]', isEliteOnly: false },
  { id: 'FRAME_RAINBOW', name: '虹', description: '称号20個以上獲得', ringClass: 'ring-[3px] ring-pink-400', glowClass: 'shadow-[0_0_14px_rgba(244,114,182,0.8)]', isEliteOnly: false },
  { id: 'FRAME_PURPLEGOLD', name: '紫金', description: '総ポイント2500以上', ringClass: 'ring-[3px] ring-violet-500', glowClass: 'shadow-[0_0_14px_rgba(139,92,246,0.8)]', isEliteOnly: false },
  { id: 'FRAME_CRIMSON', name: '深紅', description: '格上撃破30回以上', ringClass: 'ring-[3px] ring-rose-600', glowClass: 'shadow-[0_0_14px_rgba(225,29,72,0.8)]', isEliteOnly: false },
  { id: 'FRAME_STEEL', name: '鋼鉄', description: '対局200回以上', ringClass: 'ring-[3px] ring-slate-300', glowClass: 'shadow-[0_0_10px_rgba(203,213,225,0.6)]', isEliteOnly: false },
  { id: 'FRAME_GOLD', name: '黄金', description: '四天王に選出中のみ', ringClass: 'ring-[3px] ring-yellow-400', glowClass: 'shadow-[0_0_16px_rgba(251,191,36,0.9)]', isEliteOnly: true },
  { id: 'FRAME_GOLD_PULSE', name: '黄金（光）', description: '四天王に選出中のみ', ringClass: 'ring-[3px] ring-yellow-300 animate-pulse', glowClass: 'shadow-[0_0_20px_rgba(251,191,36,1)]', isEliteOnly: true },
  { id: 'FRAME_ELITE_MOON', name: '月光', description: '四天王に選出中のみ', ringClass: 'ring-[3px] ring-indigo-400', glowClass: 'shadow-[0_0_18px_rgba(129,140,248,0.9)]', isEliteOnly: true },
  { id: 'FRAME_ELITE_DARK', name: '暗黒', description: '四天王に選出中のみ', ringClass: 'ring-[3px] ring-slate-700', glowClass: 'shadow-[0_0_16px_rgba(15,23,42,1)]', isEliteOnly: true },
  { id: 'FRAME_MASTER', name: '覇者の枠', description: '覇者に選出中のみ', ringClass: 'ring-[3px] ring-amber-400', glowClass: 'shadow-[0_0_18px_rgba(251,191,36,0.9)]', isEliteOnly: true, requiredTitle: 'MASTER' },
  { id: 'FRAME_MASTER2', name: '覇者の炎枠', description: '覇者に選出中のみ', ringClass: 'ring-[4px] ring-amber-500 animate-pulse', glowClass: 'shadow-[0_0_24px_rgba(245,158,11,1)]', isEliteOnly: true, requiredTitle: 'MASTER' },
  { id: 'FRAME_MASTER3', name: '覇者の黒金枠', description: '覇者に選出中のみ', ringClass: 'ring-[3px] ring-yellow-200', glowClass: 'shadow-[0_0_20px_rgba(254,240,138,0.8)]', isEliteOnly: true, requiredTitle: 'MASTER' },
  { id: 'FRAME_MASTER4', name: '覇者の王冠枠', description: '覇者に選出中のみ', ringClass: 'ring-[4px] ring-yellow-300 animate-pulse', glowClass: 'shadow-[0_0_28px_rgba(253,224,71,1)]', isEliteOnly: true, requiredTitle: 'MASTER' },
  { id: 'FRAME_RISING', name: '新星の枠', description: '新星に選出中のみ', ringClass: 'ring-[3px] ring-sky-400', glowClass: 'shadow-[0_0_18px_rgba(56,189,248,0.9)]', isEliteOnly: true, requiredTitle: 'RISING_STAR' },
  { id: 'FRAME_RISING2', name: '新星の銀河枠', description: '新星に選出中のみ', ringClass: 'ring-[3px] ring-indigo-400', glowClass: 'shadow-[0_0_18px_rgba(99,102,241,0.9)]', isEliteOnly: true, requiredTitle: 'RISING_STAR' },
  { id: 'FRAME_RISING3', name: '新星の彗星枠', description: '新星に選出中のみ', ringClass: 'ring-[3px] ring-sky-200', glowClass: 'shadow-[0_0_20px_rgba(186,230,253,0.8)]', isEliteOnly: true, requiredTitle: 'RISING_STAR' },
  { id: 'FRAME_RISING4', name: '新星の夜光枠', description: '新星に選出中のみ', ringClass: 'ring-[4px] ring-blue-300 animate-pulse', glowClass: 'shadow-[0_0_22px_rgba(147,197,253,0.9)]', isEliteOnly: true, requiredTitle: 'RISING_STAR' },
  { id: 'FRAME_GRINDER', name: '鉄人の枠', description: '鉄人に選出中のみ', ringClass: 'ring-[3px] ring-emerald-400', glowClass: 'shadow-[0_0_18px_rgba(52,211,153,0.9)]', isEliteOnly: true, requiredTitle: 'GRINDER' },
  { id: 'FRAME_GRINDER2', name: '鉄人の鋼枠', description: '鉄人に選出中のみ', ringClass: 'ring-[4px] ring-slate-300', glowClass: 'shadow-[0_0_14px_rgba(203,213,225,0.7)]', isEliteOnly: true, requiredTitle: 'GRINDER' },
  { id: 'FRAME_GRINDER3', name: '鉄人の岩枠', description: '鉄人に選出中のみ', ringClass: 'ring-[3px] ring-stone-500', glowClass: 'shadow-[0_0_12px_rgba(120,113,108,0.7)]', isEliteOnly: true, requiredTitle: 'GRINDER' },
  { id: 'FRAME_GRINDER4', name: '鉄人の鎧枠', description: '鉄人に選出中のみ', ringClass: 'ring-[4px] ring-emerald-300 animate-pulse', glowClass: 'shadow-[0_0_22px_rgba(110,231,183,0.9)]', isEliteOnly: true, requiredTitle: 'GRINDER' },
  { id: 'FRAME_KILLER', name: 'キラーの枠', description: '巨人キラーに選出中のみ', ringClass: 'ring-[3px] ring-rose-400', glowClass: 'shadow-[0_0_18px_rgba(251,113,133,0.9)]', isEliteOnly: true, requiredTitle: 'GIANT_KILLER' },
  { id: 'FRAME_KILLER2', name: '刺客の血枠', description: '巨人キラーに選出中のみ', ringClass: 'ring-[3px] ring-red-900', glowClass: 'shadow-[0_0_14px_rgba(127,29,29,0.8)]', isEliteOnly: true, requiredTitle: 'GIANT_KILLER' },
  { id: 'FRAME_KILLER3', name: '闇の枠', description: '巨人キラーに選出中のみ', ringClass: 'ring-[3px] ring-slate-800', glowClass: 'shadow-[0_0_16px_rgba(30,41,59,0.9)]', isEliteOnly: true, requiredTitle: 'GIANT_KILLER' },
  { id: 'FRAME_KILLER4', name: '毒の枠', description: '巨人キラーに選出中のみ', ringClass: 'ring-[4px] ring-rose-500 animate-pulse', glowClass: 'shadow-[0_0_20px_rgba(244,63,94,0.9)]', isEliteOnly: true, requiredTitle: 'GIANT_KILLER' }
];
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

  // スナップショットを復元（normalizeUserを通して型安全に）
  const restoredUsers = (entry.snapshot.users as any[]).map(normalizeUser);
  localStorage.setItem(USERS_KEY,   JSON.stringify(restoredUsers));
  localStorage.setItem(MATCHES_KEY, JSON.stringify(entry.snapshot.matches));
  localStorage.setItem(LOGS_KEY,    JSON.stringify(entry.snapshot.logs));
  window.dispatchEvent(new CustomEvent('rivals-users-changed'));

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

    // ★ 競合チェック: 本番への書き込み前にクラウドの現在時刻を確認
    // メンテナンスモード中はsandboxなので競合チェック不要
    const maint = getMaintenanceState();
    if (!maint.active) {
      const meta = getSyncStatus();
      const lastKnown = meta.lastCloudTimestamp;
      if (lastKnown) {
        try {
          const checkRes = await fetch(
            `${CLOUD_API_URL}?shallow=true&nocache=${Date.now()}`
          );
          if (checkRes.ok) {
            const checkData: { timestamp?: string } | null = await checkRes.json();
            const currentCloudTime = checkData?.timestamp || '';
            if (currentCloudTime && currentCloudTime > lastKnown) {
              // 別デバイスがクラウドを更新していた → ローカルに取り込んでから書く
              console.warn('[Sync] Conflict detected: cloud was updated by another device. Merging...');
              const fullRes = await fetch(`${CLOUD_API_URL}?nocache=${Date.now()}`);
              if (fullRes.ok) {
                const cloudData: BackupData | null = await fullRes.json();
                if (cloudData && Array.isArray(cloudData.users) && cloudData.users.length > 0) {
                  // クラウドデータをローカルに取り込む（クラウド優先）
                  localStorage.setItem(USERS_KEY,    JSON.stringify(cloudData.users));
                  localStorage.setItem(MATCHES_KEY,  JSON.stringify(cloudData.matches || []));
                  localStorage.setItem(SETTINGS_KEY, JSON.stringify(cloudData.settings || DEFAULT_SETTINGS));
                  localStorage.setItem(LOGS_KEY,     JSON.stringify(cloudData.logs || []));
                  window.dispatchEvent(new CustomEvent('rivals-users-changed'));
                  updateSyncMeta({
                    status: 'SYNCED',
                    lastSync: new Date().toISOString(),
                    localTimestamp: currentCloudTime,
                    pendingChanges: 0,
                    lastCloudTimestamp: currentCloudTime,
                  });
                  // ローカルへの変更通知（UIが再描画される）
                  window.dispatchEvent(new CustomEvent('rivals-conflict-resolved', {
                    detail: { mergedAt: new Date().toISOString() }
                  }));
                  return true; // プッシュせず取り込みのみ（クラウドが正）
                }
              }
            }
          }
        } catch (_) {
          // チェック失敗は無視してプッシュ続行（ネットワーク問題など）
        }
      }
    }

    const data: BackupData = {
      users: getRawUsers(),
      matches: getMatches(),
      settings: getSettings(),
      logs: getLogs(),
      timestamp,
      approvedDevices: getApprovedDevices(),
    };
    // メンテナンスモード中はsandboxに書く
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
    updateSyncMeta({
      status: 'SYNCED',
      lastSync: timestamp,
      pendingChanges: 0,
      lastError: undefined,
      lastCloudTimestamp: timestamp,  // ★ 書き込み後、自分がクラウドの最新であることを記録
    });
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
 * - If local has newer data AND no other device has written since → push local to cloud
 * - If conflict (both sides changed) → cloud wins to protect multi-device integrity
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
    const cloudTime  = data.timestamp || '';
    const localTime  = meta.localTimestamp  || '';   // このデバイスが最後に書いた時刻
    const lastKnown  = meta.lastCloudTimestamp || ''; // 前回読み込んだクラウド時刻

    // ローカルが新しい かつ クラウドが前回読み込み時から変わっていない
    // → このデバイスだけが変更者 → ローカルをプッシュしてよい
    const localIsNewer    = localTime && cloudTime && localTime > cloudTime;
    const cloudUnchanged  = !lastKnown || cloudTime <= lastKnown;

    if (localIsNewer && cloudUnchanged && meta.pendingChanges > 0) {
      // このデバイスのみが変更 → ローカルをクラウドに反映
      await pushToCloud();
      return 'LOCAL_NEWER';
    }

    // クラウドが新しい、または競合（両方変更）→ クラウドを正とする
    localStorage.setItem(USERS_KEY,    JSON.stringify(data.users));
    localStorage.setItem(MATCHES_KEY,  JSON.stringify(data.matches || []));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings || DEFAULT_SETTINGS));
    localStorage.setItem(LOGS_KEY,     JSON.stringify(data.logs || []));
    // 承認済みデバイスも復元（ただし上書きは しない：このデバイス自身のトークンを消さないため）
    if (data.approvedDevices && Array.isArray(data.approvedDevices)) {
      const local = getApprovedDevices();
      const merged = [...data.approvedDevices];
      local.forEach(d => { if (!merged.some(m => m.token === d.token)) merged.push(d); });
      localStorage.setItem(APPROVED_DEVICES_KEY, JSON.stringify(merged));
    }

    const syncedAt = new Date().toISOString();
    updateSyncMeta({
      status: 'SYNCED',
      lastSync: syncedAt,
      localTimestamp: cloudTime,
      pendingChanges: 0,
      lastCloudTimestamp: cloudTime,  // ★ 今読んだクラウド時刻を記録
    });
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
  upsetWins:      user.upsetWins      ?? 0,
  lossStreak:     user.lossStreak     ?? 0,
  activityDays:   user.activityDays   ?? 0,
  totalPoints:    user.totalPoints    ?? 0,
  monthlyPoints:  user.monthlyPoints  ?? 0,
  pointsMatch:    user.pointsMatch    ?? 0,
  pointsAttendance: user.pointsAttendance ?? 0,
  pointsSpecial:  user.pointsSpecial  ?? 0,
  eventPoints:    user.eventPoints    ?? 0,
  seasonStartRate:   user.seasonStartRate   ?? user.rate ?? INITIAL_RATE,
  seasonStartPoints: user.seasonStartPoints ?? user.totalPoints ?? 0,
  systemTitle:    Array.isArray(user.systemTitle) ? user.systemTitle : (user.systemTitle ? [user.systemTitle] : []),
  faction:        user.faction        ?? 'WHITE',
  isGeneral:      user.isGeneral      ?? false,
  isNewMember:    user.isNewMember    ?? false,
  activeTitle:    user.activeTitle    ?? null,
  lastAttendance: user.lastAttendance ?? null,
  avatarColor:    user.avatarColor    || 'bg-blue-500',
  rateHistory:    Array.isArray(user.rateHistory) ? user.rateHistory
    : [{ date: new Date().toISOString(), rate: user.rate ?? INITIAL_RATE }],
  ranks:          Array.isArray(user.ranks) ? user.ranks : [],
  profilePin:     user.profilePin ?? '000000',
  activeFrameId:  user.activeFrameId ?? 'FRAME_NONE',
  unlockedFrames: Array.isArray(user.unlockedFrames) ? user.unlockedFrames : ['FRAME_NONE', 'FRAME_DEFAULT'],
  earnedHonors:   Array.isArray(user.earnedHonors) ? user.earnedHonors : [],
  pendingMissionAlert: Array.isArray(user.pendingMissionAlert) ? user.pendingMissionAlert : [],
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
  // 常に normalizeUser を通して保存（型変換漏れ・旧形式データの混入を防ぐ）
  const normalized = users.map(normalizeUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent('rivals-users-changed'));
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
  matchContext?: { isDuelWin: boolean; opponentRateBefore?: number }
): { newAchievements: AchievementDef[]; newIcons: IconDef[] } => {
  const newAchievements: AchievementDef[] = [];
  const newIcons: IconDef[] = [];
  const ach   = user.achievements    || [];
  const icons = user.unlockedIcons   || [];
  const totalMatches = (user.wins || 0) + (user.losses || 0) + (user.draws || 0);
  const draws       = user.draws       || 0;
  const totalPoints = user.totalPoints || 0;
  const upsetWins   = user.upsetWins   || 0;
  const lossStreak  = user.lossStreak  || 0;
  const maxStreak   = user.maxStreak   || 0;
  const achCount    = ach.length;
  const iconCount   = icons.length;

  // ── Achievements ─────────────────────────────────────────
  ACHIEVEMENTS_DATA.forEach(a => {
    if (ach.includes(a.id)) return;
    let met = false;
    switch (a.conditionType) {
      case 'WINS':       met = (user.wins || 0)  >= a.threshold; break;
      case 'STREAK':     met = (user.currentStreak || 0) >= a.threshold; break;
      case 'RATE':       met = (user.rate || 0)  >= a.threshold; break;
      case 'DAYS':       met = (user.activityDays || 0) >= a.threshold; break;
      case 'MATCHES':    met = totalMatches       >= a.threshold; break;
      case 'DRAWS':      met = draws              >= a.threshold; break;
      case 'POINTS':     met = totalPoints        >= a.threshold; break;
      case 'UPSET_WINS': met = upsetWins          >= a.threshold; break;
      case 'SPECIAL':
        if (a.id === 'FACTION_GENERAL') met = !!user.isGeneral;
        if (a.id === 'DUEL_VICTORY')    met = !!matchContext?.isDuelWin;
        // 連敗後勝利
        if (a.id === 'COMEBACK_3')  met = lossStreak >= 3  && (user.wins || 0) > 0 && user.currentStreak > 0;
        if (a.id === 'COMEBACK_5')  met = lossStreak >= 5  && user.currentStreak > 0;
        if (a.id === 'COMEBACK_10') met = lossStreak >= 10 && user.currentStreak > 0;
        // 連勝記録（maxStreak）
        if (a.id === 'MAX_STREAK_5')  met = maxStreak >= 5;
        if (a.id === 'MAX_STREAK_10') met = maxStreak >= 10;
        if (a.id === 'MAX_STREAK_15') met = maxStreak >= 15;
        if (a.id === 'MAX_STREAK_20') met = maxStreak >= 20;
        // 累計敗戦
        if (a.id === 'FIRST_LOSS')  met = (user.losses || 0) >= 1;
        if (a.id === 'LOSSES_30')   met = (user.losses || 0) >= 30;
        if (a.id === 'LOSSES_100')  met = (user.losses || 0) >= 100;
        // 称号コレクション（achCount は push 前の数）
        if (a.id === 'COLLECTION_5')  met = achCount >= 5;
        if (a.id === 'COLLECTION_15') met = achCount >= 15;
        if (a.id === 'COLLECTION_30') met = achCount >= 30;
        if (a.id === 'COLLECTION_50') met = achCount >= 50;
        // 段位承認（管理者が呼ぶ approveRankApplication 内で直接push）
        // → ここでは不要
        break;
    }
    if (met) { user.achievements.push(a.id); newAchievements.push(a); }
  });

  // ── Icons ─────────────────────────────────────────────────
  ICONS_DATA.forEach(icon => {
    if (icon.type === 'DEFAULT') return;
    if (icons.includes(icon.id)) return;
    // ELITE は四天王在籍中にのみ解放（processMatch/awardSystemTitles で付与）
    if (icon.category === 'ELITE') return;

    let met = false;
    const th = icon.threshold ?? 9999;
    switch (icon.type) {
      case 'RATE':    met = (user.rate || 0)          >= th; break;
      case 'WINS':    met = (user.wins || 0)          >= th; break;
      case 'MATCHES': met = totalMatches              >= th; break;
      case 'STREAK':  met = (user.currentStreak || 0) >= th; break;
      case 'DAYS':    met = (user.activityDays || 0)  >= th; break;
      case 'DRAWS':   met = draws                     >= th; break;
      case 'POINTS':  met = totalPoints               >= th; break;
      case 'SPECIAL':
        // アイコン固有のSPECIAL条件
        if (icon.id === 'DEFAULT_SHARK')     met = upsetWins >= 1;
        if (icon.id === 'DEFAULT_PIRATE')    met = upsetWins >= 10;
        if (icon.id === 'DEFAULT_DODO')      met = lossStreak >= 10;
        if (icon.id === 'SPECIAL_STAR')      met = (user.systemTitle?.length || 0) >= 1;
        if (icon.id === 'SPECIAL_CROWN')     met = (user.earnedHonors?.length || 0) >= 2;
        if (icon.id === 'SPECIAL_ONI')       met = upsetWins >= 10;
        if (icon.id === 'SPECIAL_NINJA')     met = upsetWins >= 20;
        if (icon.id === 'SPECIAL_SKULL')     met = (user.losses || 0) >= 100;
        if (icon.id === 'SPECIAL_ICE')       met = lossStreak >= 10;
        if (icon.id === 'SPECIAL_PHOENIX')   met = lossStreak >= 5 && user.currentStreak > 0;
        if (icon.id === 'SPECIAL_AXE')       met = !!(matchContext?.opponentRateBefore && matchContext.opponentRateBefore - (user.rate - (user.wins > 0 ? 1 : 0)) >= 200 && user.wins > 0);
        if (icon.id === 'SPECIAL_DAGGER')    met = !!(matchContext?.opponentRateBefore && matchContext.opponentRateBefore - (user.rate - (user.wins > 0 ? 1 : 0)) >= 300 && user.wins > 0);
        if (icon.id === 'SPECIAL_FIST')      met = upsetWins >= 20;
        if (icon.id === 'SPECIAL_BOMB')      met = upsetWins >= 50;
        if (icon.id === 'SPECIAL_LIGHTNING') met = (user.currentStreak || 0) >= 10 && upsetWins >= 1;
        if (icon.id === 'SPECIAL_EGG')       met = achCount  >= 5;
        if (icon.id === 'SPECIAL_KEY')       met = achCount  >= 15;
        if (icon.id === 'SPECIAL_CRYSTAL')   met = achCount  >= 30;
        if (icon.id === 'SPECIAL_WAND')      met = achCount  >= 50;
        if (icon.id === 'SPECIAL_HAT')       met = iconCount >= 20;
        if (icon.id === 'SHOGI_UMA2')        met = maxStreak >= 15;
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
  // ★ デバイス承認チェック
  if (!isDeviceApproved()) {
    return { success: false, newAchievements: [], newIcons: [], message: 'DEVICE_NOT_APPROVED' };
  }
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
  // ★ デバイス承認チェック
  if (!isDeviceApproved()) throw new Error('DEVICE_NOT_APPROVED');

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

  // Streaks + lossStreak
  if (p1IsWinner) {
    p1.currentStreak++;
    if (p1.currentStreak > p1.maxStreak) p1.maxStreak = p1.currentStreak;
    p2.currentStreak = 0;
    // lossStreak: p1 が勝った → p2 の連敗更新、p1 の連敗リセット
    p2.lossStreak = (p2.lossStreak || 0) + 1;
    p1.lossStreak = 0;
  } else if (p2IsWinner) {
    p2.currentStreak++;
    if (p2.currentStreak > p2.maxStreak) p2.maxStreak = p2.currentStreak;
    p1.currentStreak = 0;
    p1.lossStreak = (p1.lossStreak || 0) + 1;
    p2.lossStreak = 0;
  } else {
    p1.currentStreak = 0;
    p2.currentStreak = 0;
    p1.lossStreak = 0;
    p2.lossStreak = 0;
  }

  // upsetWins: レート差+100以上の格上撃破
  const p1RateBefore = p1.rate;
  const p2RateBefore = p2.rate;
  if (p1IsWinner && p2.rate - p1.rate >= 100) p1.upsetWins = (p1.upsetWins || 0) + 1;
  if (p2IsWinner && p1.rate - p2.rate >= 100) p2.upsetWins = (p2.upsetWins || 0) + 1;

  // Rate (with rateHistory update ← FIX)
  p1.rate = Math.max(0, p1.rate + p1RateChange);
  p2.rate = Math.max(0, p2.rate + p2RateChange);
  p1.rateHistory = [...(p1.rateHistory || []), { date: now, rate: p1.rate }];
  p2.rateHistory = [...(p2.rateHistory || []), { date: now, rate: p2.rate }];

  // Points (with pointsMatch breakdown ← FIX)
  p1.totalPoints   += p1Detail.total;
  p1.monthlyPoints  = (p1.monthlyPoints || 0) + p1Detail.total;
  p1.pointsMatch    = (p1.pointsMatch   || 0) + p1Detail.total;

  // 紅白戦中の同士討ち（同じfaction同士）はイベントポイントにカウントしない
  const isSameFaction = isFactionWar && p1.faction === p2.faction;
  if (eventActive && !isSameFaction) p1.eventPoints = (p1.eventPoints || 0) + p1Detail.total;

  p2.totalPoints   += p2Detail.total;
  p2.monthlyPoints  = (p2.monthlyPoints || 0) + p2Detail.total;
  p2.pointsMatch    = (p2.pointsMatch   || 0) + p2Detail.total;
  if (eventActive && !isSameFaction) p2.eventPoints = (p2.eventPoints || 0) + p2Detail.total;

  // Achievements & Icons
  const resP1 = checkAchievementsAndIcons(p1, { isDuelWin: effectiveDuel && p1IsWinner, opponentRateBefore: p2RateBefore });
  const resP2 = checkAchievementsAndIcons(p2, { isDuelWin: effectiveDuel && p2IsWinner, opponentRateBefore: p1RateBefore });

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
export const getRivalryStats = (userId: string): { bestCustomer: RivalData | null; nemeses: RivalData | null; allRivals: RivalData[]; currentRival: RivalData | null } => {
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

  const allRivals: RivalData[] = Object.entries(map).map(([oppId, s]) => ({
    opponentId:   oppId,
    opponentName: users.find(u => u.id === oppId)?.name || 'Unknown',
    wins:    s.wins,
    losses:  s.losses,
    draws:   s.draws,
    total:   s.wins + s.losses + s.draws,
    winRate: (s.wins + s.losses + s.draws) > 0 ? s.wins / (s.wins + s.losses + s.draws) : 0,
  })).sort((a, b) => b.total - a.total);

  const rivals = allRivals.filter(r => r.total >= 2);

  if (rivals.length === 0) return { bestCustomer: null, nemeses: null, allRivals, currentRival: null };

  const byWinDiff = [...rivals].sort((a, b) => (b.wins - b.losses) - (a.wins - a.losses));
  const bestCustomer = byWinDiff[0]?.wins > byWinDiff[0]?.losses ? byWinDiff[0] : null;

  const byLossDiff = [...rivals].sort((a, b) => (b.losses - b.wins) - (a.losses - a.wins));
  const nemeses    = byLossDiff[0]?.losses > byLossDiff[0]?.wins ? byLossDiff[0] : null;

  const currentRival = allRivals[0] ?? null;

  return { bestCustomer, nemeses, allRivals, currentRival };
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
  // ★ メンテナンスモード中は実行不可
  if (getMaintenanceState().active) {
    console.warn('awardSystemTitles: メンテナンスモード中は実行できません');
    return;
  }

  const all      = getRawUsers();
  const active   = all.filter(u => u.isActive !== false);
  if (active.length === 0) return;

  // 全員のタイトルをリセット（配列を空に）、前回タイトルを記録
  const prevTitleMap: Record<string, SystemTitle[]> = {};
  all.forEach(u => { prevTitleMap[u.id] = [...u.systemTitle]; u.systemTitle = []; });

  // ★ 退任処理用：ELITEアイコン・フレームのIDセット
  const eliteIconIds = new Set(ICONS_DATA.filter(i => i.category === 'ELITE').map(i => i.id));
  const eliteFrameIds = new Set(FRAMES_DATA.filter(f => f.isEliteOnly).map(f => f.id));

  // MASTER: 今期レート上昇1位（兼任可・除外なし）
  const byRateGrowth = [...active].sort((a, b) =>
    (b.rate - b.seasonStartRate) - (a.rate - a.seasonStartRate)
  );
  const master = byRateGrowth[0];

  // RISING_STAR: 今期ポイント上昇1位（兼任可・除外なし）
  const byPointsGrowth = [...active].sort((a, b) =>
    (b.totalPoints - b.seasonStartPoints) - (a.totalPoints - a.seasonStartPoints)
  );
  const rising = byPointsGrowth[0] ?? null;

  // GRINDER: 出席日数1位（兼任可・除外なし）
  const byActivity = [...active].sort((a, b) => b.activityDays - a.activityDays);
  const grinder = byActivity[0] ?? null;

  // GIANT_KILLER: 格上撃破数1位（兼任可・除外なし）
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
  const byUpsets = [...active].sort((a, b) => (upsetCount[b.id] || 0) - (upsetCount[a.id] || 0));
  const killer = byUpsets[0] ?? null;

  // 同率タイ検出（除外なし・全員対象）
  const masterScore  = master  ? (master.rate - master.seasonStartRate)          : null;
  const risingScore  = rising  ? (rising.totalPoints - rising.seasonStartPoints) : null;
  const grinderScore = grinder ? grinder.activityDays                            : null;
  const killerScore  = killer  ? (upsetCount[killer.id] || 0)                    : null;

  const masterHolders  = masterScore  !== null ? active.filter(u => (u.rate - u.seasonStartRate) === masterScore)               : [];
  const risingHolders  = risingScore  !== null ? active.filter(u => (u.totalPoints - u.seasonStartPoints) === risingScore)      : [];
  const grinderHolders = grinderScore !== null ? active.filter(u => u.activityDays === grinderScore)                            : [];
  const killerHolders  = killerScore  !== null ? active.filter(u => (upsetCount[u.id] || 0) === killerScore && killerScore > 0) : [];

  // Assign（兼任可：配列にpush、重複なし）
  const addTitle = (userId: string, title: SystemTitle) => {
    const x = all.find(a => a.id === userId);
    if (x && !x.systemTitle.includes(title)) x.systemTitle.push(title);
  };
  masterHolders.forEach(u  => addTitle(u.id, 'MASTER'));
  risingHolders.forEach(u  => addTitle(u.id, 'RISING_STAR'));
  grinderHolders.forEach(u => addTitle(u.id, 'GRINDER'));
  killerHolders.forEach(u  => addTitle(u.id, 'GIANT_KILLER'));

  // 履歴記録
  recordSystemTitleChange('MASTER',       masterHolders.map(u => u.id));
  recordSystemTitleChange('RISING_STAR',  risingHolders.map(u => u.id));
  recordSystemTitleChange('GRINDER',      grinderHolders.map(u => u.id));
  recordSystemTitleChange('GIANT_KILLER', killerHolders.map(u => u.id));

  // 特別アイコン解放（四天王選出者）
  const unlockEliteForTitle = (holders: User[], titleId: string) => {
    holders.forEach(u => {
      const x = all.find(a => a.id === u.id);
      if (!x) return;
      if (!x.unlockedIcons.includes('SPECIAL_STAR'))  x.unlockedIcons.push('SPECIAL_STAR');
      if (!x.unlockedFrames) x.unlockedFrames = ['FRAME_NONE', 'FRAME_DEFAULT'];
      // 共通エリートフレーム
      if (!x.unlockedFrames.includes('FRAME_GOLD'))       x.unlockedFrames.push('FRAME_GOLD');
      if (!x.unlockedFrames.includes('FRAME_GOLD_PULSE')) x.unlockedFrames.push('FRAME_GOLD_PULSE');
      // タイトル固有フレーム・アイコン
      const titleFrameMap: Record<string, string> = {
        MASTER: 'FRAME_MASTER', RISING_STAR: 'FRAME_RISING',
        GRINDER: 'FRAME_GRINDER', GIANT_KILLER: 'FRAME_KILLER',
      };
      const tFrame = titleFrameMap[titleId];
      if (tFrame && !x.unlockedFrames.includes(tFrame)) x.unlockedFrames.push(tFrame);
      // タイトル専用アイコンを一括解放
      ICONS_DATA.filter(i => i.category === 'ELITE' && (!i.requiredTitle || i.requiredTitle === titleId))
        .forEach(i => { if (!x.unlockedIcons.includes(i.id)) x.unlockedIcons.push(i.id); });
      // 2回以上選出歴があれば王冠アイコン解放
      const hist = getSystemTitleHistory().entries.filter(e => e.userId === u.id);
      if (hist.length >= 2 && !x.unlockedIcons.includes('SPECIAL_CROWN')) x.unlockedIcons.push('SPECIAL_CROWN');
    });
  };
  unlockEliteForTitle(masterHolders,  'MASTER');
  unlockEliteForTitle(risingHolders,  'RISING_STAR');
  unlockEliteForTitle(grinderHolders, 'GRINDER');
  unlockEliteForTitle(killerHolders,  'GIANT_KILLER');

  // ★ 退任確定後：全タイトルを失ったユーザーのみELITEアイコン・フレームを剥奪
  all.forEach(u => {
    const hadAny = (prevTitleMap[u.id] ?? []).length > 0;
    const hasAny = u.systemTitle.length > 0;
    if (hadAny && !hasAny) {
      if (u.activeIconId && eliteIconIds.has(u.activeIconId)) u.activeIconId = 'DEFAULT_INITIAL';
      if (u.activeFrameId && eliteFrameIds.has(u.activeFrameId)) u.activeFrameId = 'FRAME_NONE';
      u.unlockedIcons = u.unlockedIcons.filter(id => !eliteIconIds.has(id));
      u.unlockedFrames = (u.unlockedFrames || []).filter(id => !eliteFrameIds.has(id));
    }
  });

  // ★ 永続称号「第n代 [称号名]」を earnedHonors に付与（退任後も残る）
  const snap = getSystemTitleHistory();
  const TITLE_NAME: Record<string, string> = {
    MASTER: '覇者', RISING_STAR: '新星', GRINDER: '鉄人', GIANT_KILLER: '巨人キラー',
  };
  const allHolders: { titleId: string; holders: typeof masterHolders }[] = [
    { titleId: 'MASTER',       holders: masterHolders },
    { titleId: 'RISING_STAR',  holders: risingHolders },
    { titleId: 'GRINDER',      holders: grinderHolders },
    { titleId: 'GIANT_KILLER', holders: killerHolders },
  ];
  allHolders.forEach(({ titleId, holders }) => {
    const gen = (snap.nextGeneration[titleId] ?? 1);
    holders.forEach(u => {
      const x = all.find(a => a.id === u.id);
      if (!x) return;
      if (!x.earnedHonors) x.earnedHonors = [];
      const honor = `第${gen}代 ${TITLE_NAME[titleId]}`;
      if (!x.earnedHonors.includes(honor)) x.earnedHonors.push(honor);
    });
  });

  const settings = getSettings();
  saveSettings({ ...settings, lastTitleUpdate: new Date().toISOString() });
  saveUsers(all);
};


// ============================================================
// 四天王 履歴システム
// ============================================================
const SYSTEM_TITLE_HISTORY_KEY = 'club_rivals_system_title_history';

export const getSystemTitleHistory = (): SystemTitleSnapshot => {
  try {
    const raw = localStorage.getItem(SYSTEM_TITLE_HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { entries: [], nextGeneration: { MASTER: 1, RISING_STAR: 1, GRINDER: 1, GIANT_KILLER: 1 } };
};

const saveSystemTitleHistory = (snap: SystemTitleSnapshot): void => {
  localStorage.setItem(SYSTEM_TITLE_HISTORY_KEY, JSON.stringify(snap));
};

/** 管理者用：四天王の全履歴をリセット（テスト・誤操作訂正用） */
export const clearSystemTitleHistory = (): void => {
  localStorage.removeItem(SYSTEM_TITLE_HISTORY_KEY);
  // ユーザーの earnedHonors もリセット
  const all = getRawUsers();
  all.forEach(u => { u.earnedHonors = []; });
  saveUsers(all);
};

/** 四天王を更新し、履歴を記録する */
export const recordSystemTitleChange = (
  titleId: string,
  newHolderIds: string[]
): void => {
  const snap = getSystemTitleHistory();
  const now = new Date().toISOString();
  const users = getRawUsers();

  // 現役エントリを終了
  snap.entries.forEach(e => {
    if (e.titleId === titleId && !e.revokedAt) {
      if (!newHolderIds.includes(e.userId)) {
        e.revokedAt = now;
      }
    }
  });

  // 新しいホルダーのうち、まだ現役でないものを追加
  newHolderIds.forEach(uid => {
    const already = snap.entries.find(e => e.titleId === titleId && e.userId === uid && !e.revokedAt);
    if (!already) {
      const gen = snap.nextGeneration[titleId] || 1;
      const u = users.find(x => x.id === uid);
      snap.entries.push({
        id: Math.random().toString(36).slice(2),
        titleId,
        userId: uid,
        userName: u?.name || '不明',
        generation: gen,
        awardedAt: now,
      });
      snap.nextGeneration[titleId] = gen + 1;
    }
  });

  saveSystemTitleHistory(snap);
};

/** ユーザーの四天王歴を返す */
export const getUserSystemTitleHistory = (userId: string): SystemTitleHistoryEntry[] =>
  getSystemTitleHistory().entries.filter(e => e.userId === userId);

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

/**
 * ランキング入賞ボーナスをログに記録（ポイント付与 + 変動履歴に残す）
 * 管理者が「四天王を更新」「月次リセット」を実行したタイミングで呼ぶ想定
 */
export const recordRankingAward = (
  uid: string,
  rankLabel: string,   // 例: '今期成長'
  position: 1 | 2 | 3,
  pts: number,
): void => {
  const all = getRawUsers();
  const u = all.find(x => x.id === uid);
  if (!u || pts <= 0) return;
  u.totalPoints    += pts;
  u.pointsSpecial   = (u.pointsSpecial || 0) + pts;
  u.monthlyPoints  += pts;
  checkAchievementsAndIcons(u);
  saveUsers(all);
  const posLabel = position === 1 ? '🥇 1位' : position === 2 ? '🥈 2位' : '🥉 3位';
  appendLogs([{
    id: randomId(), userId: uid,
    type: ActivityType.BONUS,
    points: pts,
    description: `🏆 ${rankLabel}ランキング ${posLabel} — +${pts}pt`,
    date: new Date().toISOString(),
  }]);
  syncWithServer();
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

// ============================================================
// DEVICE TOKEN (承認済みデバイス管理)
// ============================================================

/** このブラウザ固有のトークンを取得（なければ生成して保存） */
export const getOrCreateDeviceToken = (): string => {
  let token = localStorage.getItem(DEVICE_TOKEN_KEY);
  if (!token) {
    token = 'dev_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36);
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  }
  return token;
};

/** このデバイスのトークンを取得（なければ null） */
export const getDeviceToken = (): string | null =>
  localStorage.getItem(DEVICE_TOKEN_KEY);

/** 承認済みトークン一覧を取得 */
export const getApprovedDevices = (): { token: string; label: string; approvedAt: string }[] => {
  const s = localStorage.getItem(APPROVED_DEVICES_KEY);
  return s ? JSON.parse(s) : [];
};

const saveApprovedDevices = (list: { token: string; label: string; approvedAt: string }[]): void => {
  localStorage.setItem(APPROVED_DEVICES_KEY, JSON.stringify(list));
  // Firebase にも同期（設定の一部として）
  syncWithServer();
};

/** このデバイスが承認済みかチェック */
export const isDeviceApproved = (): boolean => {
  const token = getDeviceToken();
  if (!token) return false;
  return getApprovedDevices().some(d => d.token === token);
};

/** このデバイスを承認する（管理者がAdmin画面から実行） */
export const approveThisDevice = (label: string): void => {
  const token = getOrCreateDeviceToken();
  const list = getApprovedDevices();
  if (!list.some(d => d.token === token)) {
    list.push({ token, label, approvedAt: new Date().toISOString() });
    saveApprovedDevices(list);
  }
};

/** 指定トークンの承認を取り消す */
export const revokeDevice = (token: string): void => {
  const list = getApprovedDevices().filter(d => d.token !== token);
  saveApprovedDevices(list);
};

/** 承認済みデバイス一覧をFirebaseから同期して復元（別デバイス間での共有） */
export const syncApprovedDevicesFromCloud = async (): Promise<void> => {
  try {
    const res = await fetch(`${CLOUD_API_URL}?nocache=${Date.now()}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data?.approvedDevices) {
      localStorage.setItem(APPROVED_DEVICES_KEY, JSON.stringify(data.approvedDevices));
    }
  } catch { /* silent */ }
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
      const [name, reading, isNew, studentId] = line.split(',').map(s => s.trim());
      return { name: name || '名称未設定', reading: reading || '', isNewMember: isNew === '1', ...(studentId ? { studentId } : {}) };
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
  systemTitle:      [],
  totalPoints:      0,
  pointsMatch:      0,
  pointsAttendance: 0,
  pointsSpecial:    0,
  monthlyPoints:    0,
  eventPoints:      0,
  currentStreak:    0,
  maxStreak:        0,
  upsetWins:        0,
  lossStreak:       0,
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
  profilePin:       '000000',
  studentId:        undefined,
  activeFrameId:    'FRAME_NONE',
  unlockedFrames:   ['FRAME_NONE', 'FRAME_DEFAULT'],
  earnedHonors:     [],
});

export const bulkAddUsers = (stubs: Partial<User>[]): void => {
  const all = getRawUsers();
  const added = stubs.map(s => ({ ...newUserBase(s.name || '名称未設定', s.reading, !!s.isNewMember), ...(s.studentId ? { studentId: s.studentId } : {}) }));
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

  const n = scored.length;
  // 人数を均等に（奇数の場合は紅組が1人多い）
  const redTarget   = Math.ceil(n / 2);
  const whiteTarget = Math.floor(n / 2);

  const red: User[] = [], white: User[] = [];
  let rScore = 0, wScore = 0;
  scored.forEach(u => {
    const redFull   = red.length   >= redTarget;
    const whiteFull = white.length >= whiteTarget;
    if      (redFull)                          { white.push(u); wScore += u._score; }
    else if (whiteFull)                        { red.push(u);   rScore += u._score; }
    else if (rScore <= wScore)                 { red.push(u);   rScore += u._score; }
    else                                       { white.push(u); wScore += u._score; }
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
  // 初期データなし。管理者画面から部員を追加してください。
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
  syncWithServer(); // ローカル削除をFirebaseに即反映
};

// ============================================================
// ACHIEVEMENT MANAGEMENT (管理者用)
// ============================================================

/**
 * 管理者が部員の称号を剥奪する
 * activeTitle が剥奪対象なら同時にリセット
 */
export const removeAchievement = (userId: string, achievementId: string): void => {
  const all = getRawUsers();
  const user = all.find(u => u.id === userId);
  if (!user) return;
  user.achievements = (user.achievements || []).filter(id => id !== achievementId);
  if (user.activeTitle === achievementId) user.activeTitle = null;
  saveUsers(all);
  syncWithServer();
};

// ============================================================
// ATTENDANCE DELETION (管理者用)
// ============================================================

/**
 * 管理者が出席ログを削除する
 * 関連するポイント・activityDays を正確に巻き戻す
 */
export const deleteAttendanceLog = (logId: string): { success: boolean; message: string } => {
  const logs = getLogs();
  const log = logs.find(l => l.id === logId && l.type === 'ATTENDANCE');
  if (!log) return { success: false, message: '出席ログが見つかりません' };

  const all = getRawUsers();
  const user = all.find(u => u.id === log.userId);
  if (!user) return { success: false, message: 'ユーザーが見つかりません' };

  const pts = log.points;

  // ポイントを巻き戻す
  user.totalPoints      = Math.max(0, (user.totalPoints || 0) - pts);
  user.monthlyPoints    = Math.max(0, (user.monthlyPoints || 0) - pts);
  user.pointsAttendance = Math.max(0, (user.pointsAttendance || 0) - pts);
  user.activityDays     = Math.max(0, (user.activityDays || 0) - 1);

  // イベントポイントも巻き戻す（イベント中に記録されたログか確認は省略し安全に減算）
  if (user.eventPoints && user.eventPoints > 0) {
    user.eventPoints = Math.max(0, user.eventPoints - pts);
  }

  // ログを削除
  const newLogs = logs.filter(l => l.id !== logId);
  localStorage.setItem('club_rivals_logs', JSON.stringify(newLogs));

  // lastAttendance を残ったログから再計算
  const remainingAttendances = newLogs
    .filter(l => l.userId === log.userId && l.type === 'ATTENDANCE')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  user.lastAttendance = remainingAttendances[0]?.date ?? undefined;

  saveUsers(all);
  syncWithServer();
  return { success: true, message: `${user.name} の出席を削除しました` };
};

/**
 * 管理者が個人ページPINを変更する
 * 6桁数字のみ許可
 */
export const updateProfilePin = (userId: string, newPin: string): { success: boolean; error?: string } => {
  if (!/^\d{6}$/.test(newPin)) return { success: false, error: '6桁の数字で入力してください' };
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

export const getUserFrameDef = (id?: string): FrameDef =>
  FRAMES_DATA.find(f => f.id === id) || FRAMES_DATA[0];

export const updateUserFrame = (id: string, frameId: string): void => {
  const all = getRawUsers();
  const u = all.find(x => x.id === id);
  if (u) { u.activeFrameId = frameId; saveUsers(all); }
};

export const playSound  = (_type: any): void => {};
export const vibrate    = (_p: any): void => {};
export const balanceFactions = (u: any) => u;
export const toggleGeneral   = (_id: any): void => {};

// ============================================================
// MISSION SYSTEM (Stage4)
// ============================================================
const MISSION_PROGRESS_KEY = 'club_rivals_mission_progress';

export const MISSIONS_DATA: MissionDef[] = [
  // ── デイリー ──────────────────────────────────────────
  { id: 'D_PLAY1',    type: 'DAILY',  label: '今日の一局',       description: '本日1局対戦する',         target: 1,  rewardPts: 3,  metric: 'MATCHES'    },
  { id: 'D_PLAY3',    type: 'DAILY',  label: '三番勝負',         description: '本日3局対戦する',         target: 3,  rewardPts: 8,  metric: 'MATCHES'    },
  { id: 'D_WIN1',     type: 'DAILY',  label: '今日の白星',       description: '本日1勝する',             target: 1,  rewardPts: 5,  metric: 'WINS'       },
  { id: 'D_WIN2',     type: 'DAILY',  label: '連勝スタート',     description: '本日2勝する',             target: 2,  rewardPts: 10, metric: 'WINS'       },
  { id: 'D_ATTEND',   type: 'DAILY',  label: '出席ボーナス',     description: '本日出席する',            target: 1,  rewardPts: 5,  metric: 'ATTENDANCE' },
  // ── ウィークリー ──────────────────────────────────────
  { id: 'W_PLAY5',    type: 'WEEKLY', label: '週5局',            description: '今週5局対戦する',         target: 5,  rewardPts: 15, metric: 'MATCHES'    },
  { id: 'W_PLAY10',   type: 'WEEKLY', label: '週10局',           description: '今週10局対戦する',        target: 10, rewardPts: 30, metric: 'MATCHES'    },
  { id: 'W_WIN3',     type: 'WEEKLY', label: '今週3勝',          description: '今週3勝する',             target: 3,  rewardPts: 20, metric: 'WINS'       },
  { id: 'W_WIN5',     type: 'WEEKLY', label: '今週5勝',          description: '今週5勝する',             target: 5,  rewardPts: 35, metric: 'WINS'       },
  { id: 'W_ATTEND3',  type: 'WEEKLY', label: '今週3日出席',      description: '今週3日出席する',         target: 3,  rewardPts: 20, metric: 'ATTENDANCE' },
  { id: 'W_DRAW1',    type: 'WEEKLY', label: '引き分け職人',     description: '今週1回引き分ける',       target: 1,  rewardPts: 10, metric: 'DRAWS'      },
];

/** 本日のキー（JST） */
export const getDailyKey = (): string => getLocalDateString();

/** 今週のキー（JST月曜起点） */
export const getWeeklyKey = (): string => {
  const now = new Date();
  const jstOffset = 9 * 60;
  const jst = new Date(now.getTime() + (now.getTimezoneOffset() + jstOffset) * 60000);
  const day = jst.getDay(); // 0=日曜
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(jst);
  monday.setDate(jst.getDate() + diff);
  return `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`;
};

const getMissionProgressAll = (): MissionProgress[] => {
  try {
    const raw = localStorage.getItem(MISSION_PROGRESS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveMissionProgressAll = (list: MissionProgress[]): void => {
  localStorage.setItem(MISSION_PROGRESS_KEY, JSON.stringify(list));
};

/** ユーザーの全ミッション進捗を取得 */
export const getMissionProgress = async (userId: string): Promise<MissionProgress[]> => {
  const all = getMissionProgressAll();
  return all.filter(p => (p as any).userId === userId);
};

/**
 * 対局後にミッション進捗を更新し、達成したミッションを返す
 * MatchEntry.tsx から呼ばれる
 */
export const updateMissionsAfterMatch = async (
  player: { id: string; name: string; rate: number; wins: number; losses: number },
  opponent: { id: string; rate: number },
  playerWon: boolean,
  allMatches: MatchRecord[],
): Promise<MissionAchieved[]> => {
  const dailyKey  = getDailyKey();
  const weeklyKey = getWeeklyKey();
  const today     = dailyKey;

  // 本日のこのユーザーの対局数・勝数・引き分け数
  const todayMatches = allMatches.filter(
    m => (m.player1Id === player.id || m.player2Id === player.id) &&
         getLocalDateString(m.date) === today
  );
  const todayWins  = todayMatches.filter(m =>
    (m.player1Id === player.id && m.result === 'PLAYER1_WIN') ||
    (m.player2Id === player.id && m.result === 'PLAYER2_WIN')
  ).length;
  const todayDraws = todayMatches.filter(m => m.result === 'DRAW').length;

  // 今週の集計（月曜〜今日）
  const weekStart = weeklyKey;
  const weekMatches = allMatches.filter(m =>
    (m.player1Id === player.id || m.player2Id === player.id) &&
    getLocalDateString(m.date) >= weekStart
  );
  const weekWins = weekMatches.filter(m =>
    (m.player1Id === player.id && m.result === 'PLAYER1_WIN') ||
    (m.player2Id === player.id && m.result === 'PLAYER2_WIN')
  ).length;
  const weekDraws = weekMatches.filter(m => m.result === 'DRAW').length;

  const getCount = (metric: MissionDef['metric'], type: 'DAILY' | 'WEEKLY'): number => {
    if (type === 'DAILY') {
      if (metric === 'MATCHES')    return todayMatches.length;
      if (metric === 'WINS')       return todayWins;
      if (metric === 'DRAWS')      return todayDraws;
      if (metric === 'ATTENDANCE') return 0; // 出席は recordAttendance 側で処理
    } else {
      if (metric === 'MATCHES')    return weekMatches.length;
      if (metric === 'WINS')       return weekWins;
      if (metric === 'DRAWS')      return weekDraws;
      if (metric === 'ATTENDANCE') return 0;
    }
    return 0;
  };

  const all = getMissionProgressAll();
  const achieved: MissionAchieved[] = [];

  for (const def of MISSIONS_DATA) {
    if (def.metric === 'ATTENDANCE') continue; // 出席ミッションはスキップ
    const periodKey = def.type === 'DAILY' ? dailyKey : weeklyKey;
    const idx = all.findIndex(p => (p as any).userId === player.id && p.missionId === def.id && p.periodKey === periodKey);
    const current = getCount(def.metric, def.type);
    const completed = current >= def.target;

    if (idx >= 0) {
      const prev = all[idx];
      if (!prev.completed && completed) {
        // 今回達成
        all[idx] = { ...prev, current, completed: true, completedAt: new Date().toISOString() };
        achieved.push({ userName: player.name, mission: def, rewardPts: def.rewardPts });
        // ポイント付与
        const users = getRawUsers();
        const u = users.find(x => x.id === player.id);
        if (u) {
          u.totalPoints   = (u.totalPoints   || 0) + def.rewardPts;
          u.monthlyPoints = (u.monthlyPoints || 0) + def.rewardPts;
          u.pointsSpecial = (u.pointsSpecial || 0) + def.rewardPts;
          saveUsers(users);
        }
      } else {
        all[idx] = { ...prev, current };
      }
    } else {
      const entry: MissionProgress & { userId: string } = {
        userId: player.id, missionId: def.id, periodKey, current, completed,
        ...(completed ? { completedAt: new Date().toISOString() } : {}),
      };
      if (completed) {
        achieved.push({ userName: player.name, mission: def, rewardPts: def.rewardPts });
        const users = getRawUsers();
        const u = users.find(x => x.id === player.id);
        if (u) {
          u.totalPoints   = (u.totalPoints   || 0) + def.rewardPts;
          u.monthlyPoints = (u.monthlyPoints || 0) + def.rewardPts;
          u.pointsSpecial = (u.pointsSpecial || 0) + def.rewardPts;
          saveUsers(users);
        }
      }
      all.push(entry as any);
    }
  }

  saveMissionProgressAll(all);
  return achieved;
};

/** 個人ページログイン時に表示済みのミッション通知をクリア */
export const clearPendingMissionAlert = (userId: string): void => {
  const all = getRawUsers();
  const u = all.find(x => x.id === userId);
  if (!u) return;
  u.pendingMissionAlert = [];
  saveUsers(all);
};
