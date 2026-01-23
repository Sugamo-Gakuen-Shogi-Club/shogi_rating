
import { User, MatchRecord, SystemSettings, ActivityLog, ActivityType, AchievementDef, MatchProcessResult, AttendanceResult, BackupData, PointBreakdown, EventType, Season, IconDef, RivalData, SystemTitle, TitleDef } from './types';

const USERS_KEY = 'club_rivals_users_v2';
const MATCHES_KEY = 'club_rivals_matches';
const SETTINGS_KEY = 'club_rivals_settings';
const LOGS_KEY = 'club_rivals_logs';

// Firebase Realtime Database URL (REST API requires .json suffix)
const CLOUD_API_URL = 'https://club-rivals-test1-default-rtdb.asia-southeast1.firebasedatabase.app/rivals_data.json';

const DEFAULT_SETTINGS: SystemSettings = {
  adminPin: '1123',
  eventName: null,
  eventType: EventType.STANDARD,
  eventEndsAt: null,
  eventMultiplier: 2,
  currentSeason: Season.TERM_1_EARLY,
  lastMonthlyReset: new Date().toISOString(),
  lastTitleUpdate: null
};

const safeParse = (val: string | null, fallback: any) => {
  if (!val || val === 'undefined' || val === 'null') return fallback;
  try {
    const parsed = JSON.parse(val);
    return parsed === null ? fallback : parsed;
  } catch (e) {
    console.error("JSON parse error:", e, "Value:", val);
    return fallback;
  }
};

// --- CLOUD SYNC LOGIC ---

export const loadFromCloud = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${CLOUD_API_URL}?nocache=${Date.now()}`);
    if (!response.ok) return false;
    const data: BackupData | null = await response.json();
    if (!data || !data.users || data.users.length === 0) return false;
    localStorage.setItem(USERS_KEY, JSON.stringify(data.users));
    localStorage.setItem(MATCHES_KEY, JSON.stringify(data.matches || []));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings || DEFAULT_SETTINGS));
    localStorage.setItem(LOGS_KEY, JSON.stringify(data.logs || []));
    return true;
  } catch (e) {
    console.error("Failed to load from cloud:", e);
    return false;
  }
};

export const syncWithServer = async () => {
  try {
    const data: BackupData = {
      users: getUsers(),
      matches: getMatches(),
      settings: getSettings(),
      logs: getLogs(),
      timestamp: new Date().toISOString()
    };
    await fetch(CLOUD_API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return true;
  } catch (e) {
    console.error("Cloud sync failed:", e);
    return false;
  }
};

// --- DATA ACCESSORS ---

export const getSettings = (): SystemSettings => {
  const s = localStorage.getItem(SETTINGS_KEY);
  const parsed = safeParse(s, DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...parsed };
};

export const saveSettings = (settings: SystemSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  syncWithServer();
};

export const isEventActive = (): boolean => {
  const settings = getSettings();
  if (!settings.eventEndsAt) return false;
  return new Date() < new Date(settings.eventEndsAt);
};

export const getUsers = (): User[] => {
  const u = localStorage.getItem(USERS_KEY);
  const users: User[] = safeParse(u, []);
  return users.map(user => ({
    ...user,
    unlockedIcons: Array.from(new Set([...(user.unlockedIcons || []), 'DEFAULT_INITIAL', 'DEFAULT_SMILE', 'SHOGI_FU'])),
    activeIconId: user.activeIconId || 'DEFAULT_INITIAL'
  }));
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  syncWithServer();
};

/**
 * 特定のユーザーの読み（かな）を更新します
 */
export const updateUserReading = (userId: string, reading: string) => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
        user.reading = reading;
        saveUsers(users);
    }
};

export const getMatches = (): MatchRecord[] => {
  const m = localStorage.getItem(MATCHES_KEY);
  return safeParse(m, []);
};

export const getLogs = (): ActivityLog[] => {
  const l = localStorage.getItem(LOGS_KEY);
  return safeParse(l, []);
};

const addLog = (l: any) => {
    const logs = safeParse(localStorage.getItem(LOGS_KEY), []);
    logs.unshift(l);
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
};

// --- CORE LOGIC ---

export const recordAttendance = (userId: string): AttendanceResult => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, newAchievements: [], newIcons: [], message: 'ユーザーが見つかりません' };
  const today = new Date().toISOString().split('T')[0];
  const last = user.lastAttendance ? new Date(user.lastAttendance).toISOString().split('T')[0] : null;
  if (today === last) return { success: false, newAchievements: [], newIcons: [], message: '本日はすでに出席済みです' };
  user.lastAttendance = new Date().toISOString();
  user.totalPoints += 5;
  user.monthlyPoints += 5;
  user.pointsAttendance = (user.pointsAttendance || 0) + 5;
  user.activityDays = (user.activityDays || 0) + 1;
  saveUsers(users);
  addLog({
    id: Math.random().toString(36).substr(2, 9),
    userId: user.id,
    type: ActivityType.ATTENDANCE,
    points: 5,
    description: 'Daily Attendance',
    date: new Date().toISOString()
  });
  return { success: true, newAchievements: [], newIcons: [], message: '出席を記録しました！ (+5 pt)' };
};

// --- INITIAL SEED DATA ---

export const seedData = async () => {
  const users = getUsers();
  if (users.length > 0) return;

  const namesWithReadings = [
    { name: "熱田 望", reading: "あつた のぞむ" },
    { name: "池田 大翔", reading: "いけだ ひろと" },
    { name: "岩間 悠希", reading: "いわま ゆうき" },
    { name: "辻井 琥基", reading: "つじい こうき" },
    { name: "白石 怜大", reading: "しらいし れお" },
    { name: "高椋 煌生", reading: "たかむく こうき" },
    { name: "布施 皓己", reading: "ふせ こうき" },
    { name: "吉井 千智", reading: "よしい ちさと" },
    { name: "秋山 七星", reading: "あきやま ななせ" },
    { name: "大庭 悠誠", reading: "おおば ゆうせい" },
    { name: "熊谷 流星", reading: "くまがい りゅうせい" },
    { name: "佐藤 勘太", reading: "さとう かん太" },
    { name: "下田 聖", reading: "しもだ ひじり" },
    { name: "遅 志丞", reading: "ち しじょう" },
    { name: "皆川 哲弥", reading: "みながわ てつや" },
    { name: "宮崎 惺也", reading: "みやざき せいや" },
    { name: "山崎 泰蔵", reading: "やまざき たいぞう" },
    { name: "片山 幸典", reading: "かたやま ゆきのり" },
    { name: "葛石 知佑", reading: "かついし ともすけ" },
    { name: "金 悠鉉", reading: "きむ ゆひょん" },
    { name: "小林 慈人", reading: "こばやし よしと" },
    { name: "坂内 元気", reading: "さかうち げんき" },
    { name: "下村 篤生", reading: "しもむら あつき" },
    { name: "染谷 尚太朗", reading: "そめや しょうたろう" },
    { name: "高木 翔玄", reading: "たかぎ しょうげん" },
    { name: "棚瀬 侑真", reading: "たなせ ゆうま" },
    { name: "中野 琥太郎", reading: "なかの こたろう" },
    { name: "西内 幸輝", reading: "にしうち こうき" },
    { name: "野田 慧", reading: "のだ けい" },
    { name: "秀村 紘嗣", reading: "ひでむら ひろし" },
    { name: "船津 太一", reading: "ふなつ たいち" },
    { name: "槇 啓秀", reading: "まき けいしゅう" },
    { name: "松井 俐真", reading: "まつい りま" },
    { name: "森本 直樹", reading: "もりもと なおき" },
    { name: "山田 悠聖", reading: "やまだ ゆうせい" },
    { name: "若林 空", reading: "わかばやし そら" },
    { name: "小畑 貴慈", reading: "おばた たかちか" },
    { name: "龍口 直史", reading: "たつぐち なおふみ" }
  ];

  const initialUsers: User[] = namesWithReadings.map((m, idx) => ({
    id: `u${100 + idx}`,
    name: m.name,
    reading: m.reading,
    isNewMember: idx < 4,
    rate: 1000,
    seasonStartRate: 1000,
    seasonStartPoints: 0,
    faction: idx % 2 === 0 ? 'RED' : 'WHITE',
    isGeneral: false,
    systemTitle: null,
    totalPoints: 0,
    pointsMatch: 0,
    pointsAttendance: 0,
    pointsSpecial: 0,
    monthlyPoints: 0,
    eventPoints: 0,
    currentStreak: 0,
    maxStreak: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    lastAttendance: null,
    activityDays: 0,
    rateHistory: [{ date: new Date().toISOString(), rate: 1000 }],
    achievements: [],
    activeTitle: null,
    avatarColor: `bg-${['red','blue','green','yellow','purple','pink','indigo','teal'][idx % 8]}-500`,
    unlockedIcons: ['DEFAULT_INITIAL', 'DEFAULT_SMILE', 'SHOGI_FU'],
    activeIconId: 'DEFAULT_INITIAL'
  }));

  saveUsers(initialUsers);
};

export const playSound = (type: any) => {}; 
export const vibrate = (p: any) => {}; 
export const getUserAvatarChar = (u: any) => u.name.charAt(0);
export const getUserIconDef = (id: any) => ({ category: 'DEFAULT', char: '?' });
export const ACHIEVEMENTS_DATA: any[] = [];
export const ICONS_DATA: any[] = [];
export const SYSTEM_TITLES: TitleDef[] = [
    { id: 'MASTER', name: '名人', english: 'The Master', description: '現在のレート最強', color: 'text-yellow-400' },
    { id: 'RISING_STAR', name: '新星', english: 'Rising Star', description: '今月のレート上昇幅No.1', color: 'text-blue-400' },
    { id: 'GRINDER', name: '活動家', english: 'The Grinder', description: '対局数＋出席数No.1', color: 'text-green-400' },
    { id: 'GIANT_KILLER', name: '下克上', english: 'Giant Killer', description: '格上撃破数No.1', color: 'text-red-400' },
];
export const processMatch = (p1: any, p2: any, res: any): any => ({});
export const deleteMatch = (id: any) => {};
export const manualPointAdjustment = (uid: any, p: any, r: any) => {};
export const manualRateAdjustment = (uid: any, r: any, rs: any) => {};
export const resetMonthly = () => {};
export const exportData = () => "";
export const importData = (s: any) => true;
export const snapshotSeasonBaseline = () => {};
export const awardSystemTitles = () => {};
export const balanceFactions = (u: any) => u;
export const assignGenerals = (r: any, w: any) => {};
export const resetEventPoints = () => {};
export const getFactionBalanceSimulation = (u: any) => ({ redStats: { count: 0, avgRate: 0 }, whiteStats: { count: 0, avgRate: 0 } });
export const toggleGeneral = (id: any) => {};
export const getRivalryStats = (id: any) => ({ bestCustomer: null, nemeses: null });
export const updateUserTitle = (id: any, t: any) => {};
export const updateUserIcon = (id: any, i: any) => {};
