
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

// System Titles Definition
export const SYSTEM_TITLES: TitleDef[] = [
    { id: 'MASTER', name: '名人', english: 'The Master', description: '現在のレート最強', color: 'text-yellow-400' },
    { id: 'RISING_STAR', name: '新星', english: 'Rising Star', description: '今月のレート上昇幅No.1', color: 'text-blue-400' },
    { id: 'GRINDER', name: '活動家', english: 'The Grinder', description: '対局数＋出席数No.1', color: 'text-green-400' },
    { id: 'GIANT_KILLER', name: '下克上', english: 'Giant Killer', description: '格上撃破数No.1', color: 'text-red-400' },
];

// Achievements Definition
export const ACHIEVEMENTS_DATA: AchievementDef[] = [
  { id: 'FACTION_GENERAL', name: '大将軍', description: 'チームの大将に任命される', conditionType: 'SPECIAL', threshold: 1 },
  { id: 'DUEL_VICTORY', name: '一騎討ち', description: '敵将との直接対決を制する', conditionType: 'SPECIAL', threshold: 1 },
  { id: 'START_DASH', name: 'スタートダッシュ', description: '記念すべき最初の対局', conditionType: 'MATCHES', threshold: 1 },
  { id: 'MATCHES_10', name: '駆け出し棋士', description: '対局数10回到達', conditionType: 'MATCHES', threshold: 10 },
  { id: 'MATCHES_50', name: '盤上の常連', description: '対局数50回到達', conditionType: 'MATCHES', threshold: 50 },
  { id: 'MATCHES_100', name: '百戦錬磨', description: '対局数100回到達', conditionType: 'MATCHES', threshold: 100 },
  { id: 'FIRST_WIN', name: '初勝利', description: '初めての勝利', conditionType: 'WINS', threshold: 1 },
  { id: 'WINS_10', name: '十人斬り', description: '勝利数10回到達', conditionType: 'WINS', threshold: 10 },
  { id: 'WINS_30', name: '名手', description: '勝利数30回到達', conditionType: 'WINS', threshold: 30 },
  { id: 'WINS_50', name: '将棋の鬼', description: '勝利数50回到達', conditionType: 'WINS', threshold: 50 },
  { id: 'STREAK_3', name: '好調', description: '3連勝達成', conditionType: 'STREAK', threshold: 3 },
  { id: 'STREAK_5', name: '猛攻', description: '5連勝達成', conditionType: 'STREAK', threshold: 5 },
  { id: 'STREAK_10', name: '無双', description: '10連勝達成', conditionType: 'STREAK', threshold: 10 },
  { id: 'RATE_1200', name: '脱・初心者', description: 'レート1200到達', conditionType: 'RATE', threshold: 1200 },
  { id: 'RATE_1500', name: '熟練者', description: 'レート1500到達', conditionType: 'RATE', threshold: 1500 },
  { id: 'RATE_1800', name: 'マスター', description: 'レート1800到達', conditionType: 'RATE', threshold: 1800 },
  { id: 'RATE_2000', name: 'レジェンド', description: 'レート2000到達', conditionType: 'RATE', threshold: 2000 },
  { id: 'DAYS_10', name: '将棋好き', description: '活動日数10日', conditionType: 'DAYS', threshold: 10 },
  { id: 'DAYS_30', name: '部室の主', description: '活動日数30日', conditionType: 'DAYS', threshold: 30 },
  { id: 'DAYS_100', name: '生ける伝説', description: '活動日数100日', conditionType: 'DAYS', threshold: 100 },
];

export const ICONS_DATA: IconDef[] = [
    { id: 'DEFAULT_INITIAL', char: '名', name: '頭文字', conditionDescription: 'デフォルト', type: 'DEFAULT', category: 'DEFAULT' },
    { id: 'DEFAULT_SMILE', char: '🙂', name: 'スマイル', conditionDescription: 'デフォルト', type: 'DEFAULT', category: 'DEFAULT' },
    { id: 'DEFAULT_CAT', char: '🐱', name: 'ねこ', conditionDescription: '最初から所持', type: 'DEFAULT', category: 'DEFAULT' },
    { id: 'DEFAULT_DOG', char: '🐶', name: 'いぬ', conditionDescription: '最初から所持', type: 'DEFAULT', category: 'DEFAULT' },
    { id: 'SHOGI_FU', char: '歩兵', name: '歩兵', conditionDescription: '最初から所持', type: 'DEFAULT', category: 'SHOGI' },
    { id: 'SHOGI_TO', char: 'と金', name: 'と金', conditionDescription: '対局数3回', type: 'MATCHES', threshold: 3, category: 'SHOGI' },
    { id: 'SHOGI_KY', char: '香車', name: '香車', conditionDescription: '対局数5回', type: 'MATCHES', threshold: 5, category: 'SHOGI' },
    { id: 'SHOGI_NKY', char: '成香', name: '成香', conditionDescription: '対局数10回', type: 'MATCHES', threshold: 10, category: 'SHOGI' },
    { id: 'SHOGI_KE', char: '桂馬', name: '桂馬', conditionDescription: '勝利数3回', type: 'WINS', threshold: 3, category: 'SHOGI' },
    { id: 'SHOGI_NKE', char: '成桂', name: '成桂', conditionDescription: '勝利数5回', type: 'WINS', threshold: 5, category: 'SHOGI' },
    { id: 'SHOGI_GI', char: '銀将', name: '銀将', conditionDescription: '勝利数7回', type: 'WINS', threshold: 7, category: 'SHOGI' },
    { id: 'SHOGI_NGI', char: '成銀', name: '成銀', conditionDescription: '勝利数12回', type: 'WINS', threshold: 12, category: 'SHOGI' },
    { id: 'SHOGI_KI', char: '金将', name: '金将', conditionDescription: '勝利数15回', type: 'WINS', threshold: 15, category: 'SHOGI' },
    { id: 'SHOGI_KA', char: '角行', name: '角行', conditionDescription: 'レート1100到達', type: 'RATE', threshold: 1100, category: 'SHOGI' },
    { id: 'SHOGI_UMA', char: '龍馬', name: '龍馬', conditionDescription: 'レート1250到達', type: 'RATE', threshold: 1250, category: 'SHOGI' },
    { id: 'SHOGI_HI', char: '飛車', name: '飛車', conditionDescription: 'レート1200到達', type: 'RATE', threshold: 1200, category: 'SHOGI' },
    { id: 'SHOGI_RYU', char: '龍王', name: '龍王', conditionDescription: 'レート1400到達', type: 'RATE', threshold: 1400, category: 'SHOGI' },
    { id: 'SHOGI_OU', char: '王将', name: '王将', conditionDescription: 'レート1600到達', type: 'RATE', threshold: 1600, category: 'SHOGI' },
    { id: 'SHOGI_GYOKU', char: '玉将', name: '玉将', conditionDescription: 'レート1800到達', type: 'RATE', threshold: 1800, category: 'SHOGI' },
    { id: 'CHESS_PAWN', char: '♟️', name: 'ポーン', conditionDescription: '勝利数20回', type: 'WINS', threshold: 20, category: 'CHESS' },
    { id: 'CHESS_KNIGHT', char: '♞', name: 'ナイト', conditionDescription: '勝利数40回', type: 'WINS', threshold: 40, category: 'CHESS' },
    { id: 'CHESS_BISHOP', char: '♝', name: 'ビショップ', conditionDescription: 'レート1350到達', type: 'RATE', threshold: 1350, category: 'CHESS' },
    { id: 'CHESS_ROOK', char: '♜', name: 'ルーク', conditionDescription: 'レート1450到達', type: 'RATE', threshold: 1450, category: 'CHESS' },
    { id: 'CHESS_QUEEN', char: '♛', name: 'クイーン', conditionDescription: 'レート1700到達', type: 'RATE', threshold: 1700, category: 'CHESS' },
    { id: 'CHESS_KING', char: '♚', name: 'キング', conditionDescription: 'レート2000到達', type: 'RATE', threshold: 2000, category: 'CHESS' },
    { id: 'SPECIAL_FIRE', char: '🔥', name: '不倒', conditionDescription: '5連勝達成', type: 'STREAK', threshold: 5, category: 'SPECIAL' },
    { id: 'SPECIAL_LIGHTNING', char: '⚡', name: '電光石火', conditionDescription: '10連勝達成', type: 'STREAK', threshold: 10, category: 'SPECIAL' },
    { id: 'SPECIAL_MEDAL', char: '🏅', name: '皆勤', conditionDescription: '活動日数50日', type: 'DAYS', threshold: 50, category: 'SPECIAL' },
    { id: 'SPECIAL_TROPHY', char: '🏆', name: '覇者', conditionDescription: '100勝達成', type: 'WINS', threshold: 100, category: 'SPECIAL' },
    { id: 'SPECIAL_SHIELD', char: '🛡️', name: '守護神', conditionDescription: '引き分け10回', type: 'SPECIAL', category: 'SPECIAL' }, 
    { id: 'SPECIAL_CROWN', char: '👑', name: '王族', conditionDescription: 'レート2200到達', type: 'RATE', threshold: 2200, category: 'SPECIAL' },
    { id: 'SPECIAL_SWORDS', char: '⚔️', name: '剣士', conditionDescription: '対局数200回', type: 'MATCHES', threshold: 200, category: 'SPECIAL' },
    { id: 'SPECIAL_DRAGON', char: '🐲', name: '神龍', conditionDescription: 'レート2500到達', type: 'RATE', threshold: 2500, category: 'SPECIAL' },
];

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
  const res = checkAchievementsAndIcons(user);
  saveUsers(users);
  addLog({
    id: Math.random().toString(36).substr(2, 9),
    userId: user.id,
    type: ActivityType.ATTENDANCE,
    points: 5,
    description: 'Daily Attendance',
    date: new Date().toISOString()
  });
  return { success: true, newAchievements: res.newAchievements, newIcons: res.newIcons, message: '出席を記録しました！ (+5 pt)' };
};

const checkAchievementsAndIcons = (user: User, matchContext?: { isDuelWin: boolean }): { newAchievements: AchievementDef[], newIcons: any[] } => {
  const newAchievements: AchievementDef[] = [];
  const newIcons: any[] = [];
  
  ACHIEVEMENTS_DATA.forEach(ach => {
    if (user.achievements.includes(ach.id)) return;
    let met = false;
    switch (ach.conditionType) {
      case 'WINS': met = user.wins >= ach.threshold; break;
      case 'STREAK': met = user.currentStreak >= ach.threshold; break;
      case 'RATE': met = user.rate >= ach.threshold; break;
      case 'DAYS': met = user.activityDays >= ach.threshold; break;
      case 'MATCHES': met = (user.wins + user.losses + user.draws) >= ach.threshold; break;
      case 'SPECIAL': 
        if (ach.id === 'FACTION_GENERAL') met = user.isGeneral;
        if (ach.id === 'DUEL_VICTORY') met = !!matchContext?.isDuelWin;
        break;
    }
    if (met) {
      user.achievements.push(ach.id);
      newAchievements.push(ach);
      if (!user.activeTitle) user.activeTitle = ach.id;
    }
  });

  ICONS_DATA.forEach(icon => {
      if (icon.type === 'DEFAULT') return;
      if (user.unlockedIcons.includes(icon.id)) return;
      let met = false;
      switch (icon.type) {
          case 'RATE': met = user.rate >= (icon.threshold || 9999); break;
          case 'WINS': met = user.wins >= (icon.threshold || 9999); break;
          case 'MATCHES': met = (user.wins + user.losses + user.draws) >= (icon.threshold || 9999); break;
          case 'STREAK': met = user.currentStreak >= (icon.threshold || 9999); break;
          case 'DAYS': met = user.activityDays >= (icon.threshold || 9999); break;
          case 'SPECIAL':
            if (icon.id === 'SPECIAL_GENERAL') met = user.isGeneral;
            if (icon.id === 'SPECIAL_DUEL') met = user.achievements.includes('DUEL_VICTORY');
            if (icon.id === 'SPECIAL_SHIELD') met = user.draws >= 10;
            break;
      }
      if (met) {
          user.unlockedIcons.push(icon.id);
          newIcons.push(icon);
      }
  });

  return { newAchievements, newIcons };
};

// --- CSV UTILITIES ---

export const parseUserCSV = (csv: string): Partial<User>[] => {
    const lines = csv.split('\n');
    return lines.filter(line => line.trim() !== '').map(line => {
        const [name, reading, isNew] = line.split(',').map(s => s.trim());
        return {
            name: name || '名称未設定',
            reading: reading || '',
            isNewMember: isNew === '1'
        };
    });
};

export const bulkAddUsers = (userStubs: Partial<User>[]) => {
    const users = getUsers();
    const newUsers: User[] = userStubs.map(stub => ({
        id: Math.random().toString(36).substr(2, 9),
        name: stub.name || '名称未設定',
        reading: stub.reading,
        isNewMember: !!stub.isNewMember,
        rate: 1000,
        seasonStartRate: 1000,
        seasonStartPoints: 0,
        faction: Math.random() > 0.5 ? 'RED' : 'WHITE',
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
        avatarColor: `bg-${['red','blue','green','yellow','purple','pink'][Math.floor(Math.random()*6)]}-500`,
        activeIconId: 'DEFAULT_INITIAL',
        unlockedIcons: ['DEFAULT_INITIAL', 'DEFAULT_SMILE', 'SHOGI_FU']
    }));
    saveUsers([...users, ...newUsers]);
};

// --- TEAM BALANCE LOGIC ---

const calculatePowerScore = (user: User): number => {
    // レート(30%) + 出席(70%) の重み付けで「アクティブな実力」を算出
    return (user.rate * 0.3) + (user.activityDays * 300);
};

export const getFactionBalanceSimulation = (users: User[]) => {
    const scoredUsers = users.map(u => ({
        ...u,
        _score: calculatePowerScore(u)
    })).sort((a, b) => b._score - a._score);

    const red: User[] = [];
    const white: User[] = [];
    let redTotalScore = 0;
    let whiteTotalScore = 0;

    // 欲張り法（Greedy）による分配
    scoredUsers.forEach(u => {
        if (redTotalScore <= whiteTotalScore) {
            red.push(u);
            redTotalScore += u._score;
        } else {
            white.push(u);
            whiteTotalScore += u._score;
        }
    });

    const getStats = (team: User[]) => ({
        count: team.length,
        avgRate: team.length ? Math.round(team.reduce((acc, u) => acc + u.rate, 0) / team.length) : 0,
        totalDays: team.reduce((acc, u) => acc + u.activityDays, 0),
        totalScore: Math.round(team.reduce((acc, u) => acc + calculatePowerScore(u), 0))
    });

    return {
        redUsers: red,
        whiteUsers: white,
        redStats: getStats(red),
        whiteStats: getStats(white),
        difference: Math.abs(redTotalScore - whiteTotalScore)
    };
};

export const balanceFactions = (users: User[]): User[] => {
    const sim = getFactionBalanceSimulation(users);
    return users.map(u => {
        const isRed = sim.redUsers.some(ru => ru.id === u.id);
        return { ...u, faction: isRed ? 'RED' : 'WHITE' };
    });
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
export const getUserIconDef = (id: any) => ICONS_DATA.find(i => i.id === id) || ICONS_DATA[0];

export const processMatch = (p1Id: string, p2Id: string, result: 'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW'): any => {
    // Basic ELO logic for test
    const users = getUsers();
    const settings = getSettings();
    const p1 = users.find(u => u.id === p1Id);
    const p2 = users.find(u => u.id === p2Id);
    if (!p1 || !p2) throw new Error("Users not found");
    
    let p1Change = 10, p2Change = 10;
    let p1Pts = 5, p2Pts = 5;
    
    if (result === 'PLAYER1_WIN') { p1Change = 16; p2Change = 2; p1Pts = 10; }
    else if (result === 'PLAYER2_WIN') { p1Change = 2; p2Change = 16; p2Pts = 10; }
    else { p1Change = 5; p2Change = 5; p1Pts = 7; p2Pts = 7; }
    
    p1.rate += p1Change; p1.wins += (result === 'PLAYER1_WIN' ? 1 : 0); p1.totalPoints += p1Pts;
    p2.rate += p2Change; p2.wins += (result === 'PLAYER2_WIN' ? 1 : 0); p2.totalPoints += p2Pts;
    
    checkAchievementsAndIcons(p1);
    checkAchievementsAndIcons(p2);
    
    saveUsers(users);
    return { p1RateChange: p1Change, p2RateChange: p2Change, p1PointsEarned: p1Pts, p2PointsEarned: p2Pts, result };
};

export const deleteMatch = (id: any) => {};
export const manualPointAdjustment = (uid: string, p: number, r: string) => {
    const users = getUsers();
    const u = users.find(u => u.id === uid);
    if(u) { u.totalPoints += p; checkAchievementsAndIcons(u); saveUsers(users); }
};
export const manualRateAdjustment = (uid: string, r: number, rs: string) => {
    const users = getUsers();
    const u = users.find(u => u.id === uid);
    if(u) { u.rate += r; checkAchievementsAndIcons(u); saveUsers(users); }
};
export const resetMonthly = () => { const u = getUsers(); u.forEach(user => user.monthlyPoints = 0); saveUsers(u); };
export const exportData = () => JSON.stringify({ users: getUsers(), matches: getMatches(), settings: getSettings(), logs: getLogs() });
export const importData = (json: string) => {
    try {
        const d = JSON.parse(json);
        saveUsers(d.users || []);
        localStorage.setItem(MATCHES_KEY, JSON.stringify(d.matches || []));
        saveSettings(d.settings || DEFAULT_SETTINGS);
        localStorage.setItem(LOGS_KEY, JSON.stringify(d.logs || []));
        return true;
    } catch(e) { return false; }
};
export const snapshotSeasonBaseline = () => {};
export const awardSystemTitles = () => {};
export const assignGenerals = (r: any, w: any) => {};
export const resetEventPoints = () => {};
export const toggleGeneral = (id: any) => {};
export const getRivalryStats = (id: any) => ({ bestCustomer: null, nemeses: null });
export const updateUserTitle = (id: string, t: string | null) => {
    const u = getUsers(); const user = u.find(x => x.id === id);
    if(user) { user.activeTitle = t; saveUsers(u); }
};
export const updateUserIcon = (id: string, i: string) => {
    const u = getUsers(); const user = u.find(x => x.id === id);
    if(user) { user.activeIconId = i; saveUsers(u); }
};
