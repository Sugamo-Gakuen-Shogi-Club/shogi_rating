
import { User, MatchRecord, SystemSettings, ActivityLog, ActivityType, AchievementDef, MatchProcessResult, AttendanceResult, BackupData, PointBreakdown, EventType, Season, IconDef, RivalData, SystemTitle, TitleDef } from './types';

const USERS_KEY = 'club_rivals_users_v2';
const MATCHES_KEY = 'club_rivals_matches';
const SETTINGS_KEY = 'club_rivals_settings';
const LOGS_KEY = 'club_rivals_logs';

// Default Settings
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
  // Faction / Special
  { id: 'FACTION_GENERAL', name: '大将軍', description: 'チームの大将に任命される', conditionType: 'SPECIAL', threshold: 1 },
  { id: 'DUEL_VICTORY', name: '一騎討ち', description: '敵将との直接対決を制する', conditionType: 'SPECIAL', threshold: 1 },

  // Matches
  { id: 'START_DASH', name: 'スタートダッシュ', description: '記念すべき最初の対局', conditionType: 'MATCHES', threshold: 1 },
  { id: 'MATCHES_10', name: '駆け出し棋士', description: '対局数10回到達', conditionType: 'MATCHES', threshold: 10 },
  { id: 'MATCHES_50', name: '盤上の常連', description: '対局数50回到達', conditionType: 'MATCHES', threshold: 50 },
  { id: 'MATCHES_100', name: '百戦錬磨', description: '対局数100回到達', conditionType: 'MATCHES', threshold: 100 },

  // Wins
  { id: 'FIRST_WIN', name: '初勝利', description: '初めての勝利', conditionType: 'WINS', threshold: 1 },
  { id: 'WINS_10', name: '十人斬り', description: '勝利数10回到達', conditionType: 'WINS', threshold: 10 },
  { id: 'WINS_30', name: '名手', description: '勝利数30回到達', conditionType: 'WINS', threshold: 30 },
  { id: 'WINS_50', name: '将棋の鬼', description: '勝利数50回到達', conditionType: 'WINS', threshold: 50 },

  // Streak
  { id: 'STREAK_3', name: '好調', description: '3連勝達成', conditionType: 'STREAK', threshold: 3 },
  { id: 'STREAK_5', name: '猛攻', description: '5連勝達成', conditionType: 'STREAK', threshold: 5 },
  { id: 'STREAK_10', name: '無双', description: '10連勝達成', conditionType: 'STREAK', threshold: 10 },

  // Rate
  { id: 'RATE_1100', name: '有望株', description: 'レート1100到達', conditionType: 'RATE', threshold: 1100 },
  { id: 'RATE_1200', name: '脱・初心者', description: 'レート1200到達', conditionType: 'RATE', threshold: 1200 },
  { id: 'RATE_1500', name: '熟練者', description: 'レート1500到達', conditionType: 'RATE', threshold: 1500 },
  { id: 'RATE_1800', name: 'マスター', description: 'レート1800到達', conditionType: 'RATE', threshold: 1800 },
  { id: 'RATE_2000', name: 'レジェンド', description: 'レート2000到達', conditionType: 'RATE', threshold: 2000 },

  // Days
  { id: 'DAYS_3', name: '三日坊主卒業', description: '活動日数3日', conditionType: 'DAYS', threshold: 3 },
  { id: 'DAYS_10', name: '将棋好き', description: '活動日数10日', conditionType: 'DAYS', threshold: 10 },
  { id: 'DAYS_30', name: '部室の主', description: '活動日数30日', conditionType: 'DAYS', threshold: 30 },
  { id: 'DAYS_100', name: '生ける伝説', description: '活動日数100日', conditionType: 'DAYS', threshold: 100 },
];

export const ICONS_DATA: IconDef[] = [
    { id: 'DEFAULT_INITIAL', char: '名', name: '頭文字', conditionDescription: 'デフォルト', type: 'DEFAULT', category: 'DEFAULT' },
    { id: 'DEFAULT_SMILE', char: '🙂', name: 'スマイル', conditionDescription: 'デフォルト', type: 'DEFAULT', category: 'DEFAULT' },
    // SHOGI PIECES - Full Kanji names
    { id: 'SHOGI_FU', char: '歩兵', name: '歩兵', conditionDescription: '最初から所持', type: 'DEFAULT', category: 'SHOGI' },
    { id: 'SHOGI_TO', char: 'と金', name: 'と金', conditionDescription: '対局数3回', type: 'MATCHES', threshold: 3, category: 'SHOGI' },
    { id: 'SHOGI_KY', char: '香車', name: '香車', conditionDescription: '対局数5回', type: 'MATCHES', threshold: 5, category: 'SHOGI' },
    { id: 'SHOGI_KE', char: '桂馬', name: '桂馬', conditionDescription: '勝利数3回', type: 'WINS', threshold: 3, category: 'SHOGI' },
    { id: 'SHOGI_GI', char: '銀将', name: '銀将', conditionDescription: '勝利数5回', type: 'WINS', threshold: 5, category: 'SHOGI' },
    { id: 'SHOGI_KI', char: '金将', name: '金将', conditionDescription: '勝利数10回', type: 'WINS', threshold: 10, category: 'SHOGI' },
    { id: 'SHOGI_KA', char: '角行', name: '角行', conditionDescription: 'レート1100到達', type: 'RATE', threshold: 1100, category: 'SHOGI' },
    { id: 'SHOGI_HI', char: '飛車', name: '飛車', conditionDescription: 'レート1200到達', type: 'RATE', threshold: 1200, category: 'SHOGI' },
    { id: 'SHOGI_OU', char: '王将', name: '王将', conditionDescription: 'レート1300到達', type: 'RATE', threshold: 1300, category: 'SHOGI' },
    { id: 'SHOGI_RYU', char: '龍王', name: '龍王', conditionDescription: 'レート1400到達', type: 'RATE', threshold: 1400, category: 'SHOGI' },
    { id: 'SHOGI_UMA', char: '龍馬', name: '龍馬', conditionDescription: 'レート1400到達', type: 'RATE', threshold: 1400, category: 'SHOGI' },

    // CHESS PIECES
    { id: 'CHESS_PAWN', char: '♟️', name: 'ポーン', conditionDescription: '勝利数30回', type: 'WINS', threshold: 30, category: 'CHESS' },
    { id: 'CHESS_KNIGHT', char: '♞', name: 'ナイト', conditionDescription: 'レート1500到達', type: 'RATE', threshold: 1500, category: 'CHESS' },
    { id: 'CHESS_BISHOP', char: '♝', name: 'ビショップ', conditionDescription: 'レート1600到達', type: 'RATE', threshold: 1600, category: 'CHESS' },
    { id: 'CHESS_ROOK', char: '♜', name: 'ルーク', conditionDescription: 'レート1700到達', type: 'RATE', threshold: 1700, category: 'CHESS' },
    { id: 'CHESS_QUEEN', char: '♛', name: 'クイーン', conditionDescription: 'レート1800到達', type: 'RATE', threshold: 1800, category: 'CHESS' },
    { id: 'CHESS_KING', char: '♚', name: 'キング', conditionDescription: 'レート2000到達', type: 'RATE', threshold: 2000, category: 'CHESS' },
    
    // SPECIAL
    { id: 'STREAK_5', char: '⚡', name: '疾風', conditionDescription: '5連勝達成', type: 'STREAK', threshold: 5, category: 'SPECIAL' },
    { id: 'STREAK_10', char: '👑', name: '無双', conditionDescription: '10連勝達成', type: 'STREAK', threshold: 10, category: 'SPECIAL' },
    { id: 'WINS_50', char: '🔥', name: '闘神', conditionDescription: '50勝達成', type: 'WINS', threshold: 50, category: 'SPECIAL' },
    { id: 'SPECIAL_GENERAL', char: '👺', name: '大将軍', conditionDescription: 'チーム大将に任命', type: 'SPECIAL', category: 'SPECIAL' },
    { id: 'SPECIAL_DUEL', char: '⚜️', name: '決闘者', conditionDescription: '一騎討ちで勝利', type: 'SPECIAL', category: 'SPECIAL' },
];

const NAME_READINGS: Record<string, string> = {
    "熱田　　望": "あつた のぞむ",
    "池田　大翔": "いけだ ひろと",
    "岩間　悠希": "いわま ゆうき",
    "辻井　琥基": "つじい こうき",
    "白石　怜大": "しらいし れお",
    "高椋　煌生": "たかむく こうき",
    "布施　皓己": "ふせ こうき",
    "吉井　千智": "よしい ちさと",
    "秋山　七星": "あきやま ななせ",
    "大庭　悠誠": "おおば ゆうせい",
    "熊谷　流星": "くまがい りゅうせい",
    "佐藤　勘太": "さとう かんた",
    "下田　　聖": "しもだ ひじり",
    "遅　　志丞": "ち しじょう",
    "皆川　哲弥": "みながわ てつや",
    "宮崎　惺也": "みやざき せいや",
    "山崎　泰蔵": "やまざき たいぞう",
    "片山　幸典": "かたやま ゆきのり",
    "葛石　知佑": "かついし ともすけ",
    "金　　悠鉉": "きむ ゆひょん",
    "小林　慈人": "こばやし よしと",
    "坂内　元気": "さかうち げんき",
    "下村　篤生": "しもむら あつき",
    "染谷　尚太朗": "そめや しょうたろう",
    "高木　翔玄": "たかぎ しょうげん",
    "棚瀬　侑真": "たなせ ゆうま",
    "中野　琥太郎": "なかの こたろう",
    "西内　幸輝": "にしうち こうき",
    "野田　　慧": "のだ けい",
    "秀村　紘嗣": "ひでむら ひろし",
    "船津　太一": "ふなつ たいち",
    "槇　　啓秀": "まき けいしゅう",
    "松井　俐真": "まつい りま",
    "森本　直樹": "もりもと なおき",
    "山田　悠聖": "やまだ ゆうせい",
    "若林　　空": "わかばやし そら",
    "小畑　貴慈": "おばた たかちか",
    "龍口　直史": "たつぐち なおふみ"
};

const INITIAL_MEMBERS = [
  // 中１ (New Members)
  { name: "熱田　　望", isNew: true },
  { name: "池田　大翔", isNew: true },
  { name: "岩間　悠希", isNew: true },
  { name: "辻井　琥基", isNew: true },
  // 中２
  { name: "白石　怜大", isNew: false },
  { name: "高椋　煌生", isNew: false },
  { name: "布施　皓己", isNew: false },
  { name: "吉井　千智", isNew: false },
  // 中３
  { name: "秋山　七星", isNew: false },
  { name: "大庭　悠誠", isNew: false },
  { name: "熊谷　流星", isNew: false },
  { name: "佐藤　勘太", isNew: false },
  { name: "下田　　聖", isNew: false },
  { name: "遅　　志丞", isNew: false },
  { name: "皆川　哲弥", isNew: false },
  { name: "宮崎　惺也", isNew: false },
  { name: "山崎　泰蔵", isNew: false },
  // 高１
  { name: "片山　幸典", isNew: false },
  { name: "葛石　知佑", isNew: false },
  { name: "金　　悠鉉", isNew: false },
  { name: "小林　慈人", isNew: false },
  { name: "坂内　元気", isNew: false },
  { name: "下村　篤生", isNew: false },
  { name: "染谷　尚太朗", isNew: false },
  { name: "高木　翔玄", isNew: false },
  { name: "棚瀬　侑真", isNew: false },
  { name: "中野　琥太郎", isNew: false },
  { name: "西内　幸輝", isNew: false },
  { name: "野田　　慧", isNew: false },
  { name: "秀村　紘嗣", isNew: false },
  { name: "船津　太一", isNew: false },
  { name: "槇　　啓秀", isNew: false },
  { name: "松井　俐真", isNew: false },
  { name: "森本　直樹", isNew: false },
  { name: "山田　悠聖", isNew: false },
  { name: "若林　　空", isNew: false },
  { name: "小畑　貴慈", isNew: false },
  { name: "龍口　直史", isNew: false }
];

// --- SOUND & HAPTICS ---
export const playSound = (type: 'CLICK' | 'SUCCESS' | 'ERROR' | 'WIN' | 'FANFARE') => {
    if (typeof window === 'undefined') return;
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        
        switch (type) {
            case 'CLICK':
                // Short Wood Click
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            case 'SUCCESS':
                // Chime
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;
            case 'WIN':
                // Victory Chord
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(523.25, now); // C
                osc.frequency.setValueAtTime(659.25, now + 0.1); // E
                osc.frequency.setValueAtTime(783.99, now + 0.2); // G
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.6);
                osc.start(now);
                osc.stop(now + 0.6);
                break;
            case 'FANFARE':
                 // Simpler fanfare
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.setValueAtTime(500, now + 0.1);
                osc.frequency.setValueAtTime(600, now + 0.2);
                osc.frequency.setValueAtTime(800, now + 0.4);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
                osc.start(now);
                osc.stop(now + 1.5);
                break;
            case 'ERROR':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(100, now + 0.3);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
        }
    } catch (e) {
        console.error('Audio play failed', e);
    }
};

export const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

// ----------------------

const generateId = () => Math.random().toString(36).substr(2, 9);
const getTimestamp = () => new Date().toISOString();

export const getSettings = (): SystemSettings => {
  const s = localStorage.getItem(SETTINGS_KEY);
  if (!s) return DEFAULT_SETTINGS;
  const parsed = JSON.parse(s);
  return { ...DEFAULT_SETTINGS, ...parsed };
};

export const saveSettings = (settings: SystemSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const isEventActive = (): boolean => {
  const settings = getSettings();
  if (!settings.eventEndsAt) return false;
  return new Date() < new Date(settings.eventEndsAt);
};

const guessReading = (name: string): string => {
    const cleanName = name.replace(/\s+/g, ' ');
    if (NAME_READINGS[cleanName]) return NAME_READINGS[cleanName];
    const tightName = name.replace(/\s+/g, '');
    for (const [key, val] of Object.entries(NAME_READINGS)) {
        if (key.replace(/\s+/g, '') === tightName) return val;
    }
    return '';
};

export const getUsers = (): User[] => {
  const u = localStorage.getItem(USERS_KEY);
  if (!u) return [];
  
  const users: User[] = JSON.parse(u);
  return users.map(user => ({
    ...user,
    pointsMatch: user.pointsMatch ?? 0,
    pointsAttendance: user.pointsAttendance ?? 0,
    pointsSpecial: user.pointsSpecial ?? 0,
    monthlyPoints: user.monthlyPoints ?? 0,
    eventPoints: user.eventPoints ?? 0, 
    reading: user.reading || guessReading(user.name),
    faction: user.faction || 'WHITE',
    isGeneral: user.isGeneral || false,
    systemTitle: user.systemTitle || null,
    unlockedIcons: Array.from(new Set([...(user.unlockedIcons || []), 'DEFAULT_INITIAL', 'DEFAULT_SMILE', 'SHOGI_FU'])),
    activeIconId: user.activeIconId || 'DEFAULT_INITIAL'
  }));
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getMatches = (): MatchRecord[] => {
  const m = localStorage.getItem(MATCHES_KEY);
  return m ? JSON.parse(m) : [];
};

export const addMatch = (match: MatchRecord) => {
  const matches = getMatches();
  matches.unshift(match);
  localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
};

export const saveMatches = (matches: MatchRecord[]) => {
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
}

export const getLogs = (): ActivityLog[] => {
  const l = localStorage.getItem(LOGS_KEY);
  return l ? JSON.parse(l) : [];
};

export const addLog = (log: ActivityLog) => {
  const logs = getLogs();
  logs.unshift(log);
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
};

export const getUserAvatarChar = (user: User): string => {
    if (!user.activeIconId || user.activeIconId === 'DEFAULT_INITIAL') {
        return user.name.charAt(0);
    }
    const icon = ICONS_DATA.find(i => i.id === user.activeIconId);
    if (!icon) return user.name.charAt(0);
    return icon.char;
}

export const getUserIconDef = (iconId: string): IconDef => {
    return ICONS_DATA.find(i => i.id === iconId) || ICONS_DATA[0];
}

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
          case 'SPECIAL':
            if (icon.id === 'SPECIAL_GENERAL') met = user.isGeneral;
            if (icon.id === 'SPECIAL_DUEL') met = user.achievements.includes('DUEL_VICTORY') || !!matchContext?.isDuelWin;
            break;
      }
      if (met) {
          user.unlockedIcons.push(icon.id);
          newIcons.push(icon);
      }
  });

  return { newAchievements, newIcons };
};

export const updateUserTitle = (userId: string, titleId: string | null) => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return;
  if (titleId && !user.achievements.includes(titleId)) return;
  user.activeTitle = titleId;
  saveUsers(users);
};

export const updateUserIcon = (userId: string, iconId: string) => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;
    if (!user.unlockedIcons.includes(iconId)) return;
    user.activeIconId = iconId;
    saveUsers(users);
}

// System Title Logic
export const awardSystemTitles = () => {
    const users = getUsers();
    const matches = getMatches();
    const settings = getSettings();
    
    // Clear current titles
    users.forEach(u => u.systemTitle = null);

    // 1. MASTER (Highest Rate)
    let master: User | null = null;
    let maxRate = -1;
    users.forEach(u => {
        if (u.rate > maxRate) { maxRate = u.rate; master = u; }
    });
    if (master) (master as User).systemTitle = 'MASTER';

    // 2. RISING STAR (Rate Increase this month)
    // Calc delta: Current Rate - Rate at start of month (or first history entry of month)
    const now = new Date();
    const currentMonth = now.getMonth();
    
    let rising: User | null = null;
    let maxDelta = -9999;
    
    users.filter(u => u.systemTitle === null).forEach(u => {
        // Find first rate entry of this month
        const monthlyHistory = u.rateHistory.filter(h => new Date(h.date).getMonth() === currentMonth);
        if (monthlyHistory.length > 0) {
            const startRate = monthlyHistory[0].rate;
            const delta = u.rate - startRate;
            if (delta > maxDelta && delta > 0) {
                maxDelta = delta;
                rising = u;
            }
        }
    });
    if (rising) (rising as User).systemTitle = 'RISING_STAR';

    // 3. GRINDER (Highest Monthly Points - Activity)
    let grinder: User | null = null;
    let maxPts = -1;
    users.filter(u => u.systemTitle === null).forEach(u => {
        if (u.monthlyPoints > maxPts) { maxPts = u.monthlyPoints; grinder = u; }
    });
    if (grinder) (grinder as User).systemTitle = 'GRINDER';

    // 4. GIANT KILLER (Wins against rate+100 opponents)
    // Scan matches this month
    const giantKillerCounts: Record<string, number> = {};
    matches.forEach(m => {
        const d = new Date(m.date);
        if (d.getMonth() !== currentMonth) return;
        
        // Check P1 Win
        if (m.result === 'PLAYER1_WIN') {
            // Need historical rate? Approximation: use current rate or reconstructing is complex.
            // Simplified: Use current rates for GK calc or assume stored rate change reflects difficulty.
            // Better: Use recorded match data if we stored rates. We didn't store snapshot rates in MatchRecord.
            // Fallback: Check if rate change was >= 25 (High K-factor win implies giant killing roughly)
            // Or better: Re-use the existing logic that Giant Killing gives 1.5x K-factor.
            // If p1RateChange > 20 (approx normal max 16 * 1.5 = 24+), it's likely a GK.
            if (m.p1RateChange >= 24) {
                giantKillerCounts[m.player1Id] = (giantKillerCounts[m.player1Id] || 0) + 1;
            }
        } else if (m.result === 'PLAYER2_WIN') {
             if (m.p2RateChange >= 24) {
                giantKillerCounts[m.player2Id] = (giantKillerCounts[m.player2Id] || 0) + 1;
            }
        }
    });

    let gk: string | null = null;
    let maxKills = 0;
    Object.entries(giantKillerCounts).forEach(([uid, count]) => {
        const u = users.find(user => user.id === uid);
        if (u && u.systemTitle === null) {
            if (count > maxKills) { maxKills = count; gk = uid; }
        }
    });
    
    if (gk) {
        const u = users.find(u => u.id === gk);
        if (u) u.systemTitle = 'GIANT_KILLER';
    }

    settings.lastTitleUpdate = new Date().toISOString();
    saveUsers(users);
    saveSettings(settings);
}

const calculatePowerScore = (user: User): number => {
    const baseRate = user.rate || 1000;
    const days = user.activityDays || 0;
    return (baseRate * 0.3) + (days * 300);
};

export const getFactionBalanceSimulation = (users: User[]) => {
    const scoredUsers = users.map(u => ({
        ...u,
        _powerScore: calculatePowerScore(u)
    }));
    scoredUsers.sort((a, b) => b._powerScore - a._powerScore);
    const red: typeof scoredUsers = [];
    const white: typeof scoredUsers = [];
    let redScore = 0;
    let whiteScore = 0;
    scoredUsers.forEach(u => {
        if (redScore <= whiteScore) { red.push(u); redScore += u._powerScore; } 
        else { white.push(u); whiteScore += u._powerScore; }
    });
    const getStats = (list: User[]) => ({
        count: list.length,
        avgRate: list.length ? Math.round(list.reduce((acc, c) => acc + c.rate, 0) / list.length) : 0,
        totalDays: list.reduce((acc, c) => acc + (c.activityDays||0), 0)
    });
    return { redUsers: red, whiteUsers: white, redStats: getStats(red), whiteStats: getStats(white) };
}

export const balanceFactions = (users: User[]): User[] => {
    const simulation = getFactionBalanceSimulation(users);
    const newUsers = [...users];
    simulation.redUsers.forEach(su => { const u = newUsers.find(nu => nu.id === su.id); if(u) u.faction = 'RED'; });
    simulation.whiteUsers.forEach(su => { const u = newUsers.find(nu => nu.id === su.id); if(u) u.faction = 'WHITE'; });
    return newUsers;
};

export const assignGenerals = (redGeneralId: string, whiteGeneralId: string) => {
    const users = getUsers();
    users.forEach(u => u.isGeneral = false);
    const red = users.find(u => u.id === redGeneralId);
    if (red) { red.isGeneral = true; red.faction = 'RED'; checkAchievementsAndIcons(red); }
    const white = users.find(u => u.id === whiteGeneralId);
    if (white) { white.isGeneral = true; white.faction = 'WHITE'; checkAchievementsAndIcons(white); }
    saveUsers(users);
}

export const resetEventPoints = () => {
    const users = getUsers();
    users.forEach(u => u.eventPoints = 0);
    saveUsers(users);
}

export const toggleGeneral = (userId: string) => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;
    if (!user.isGeneral) {
        users.forEach(u => { if (u.faction === user.faction && u.isGeneral) u.isGeneral = false; });
        user.isGeneral = true;
    } else { user.isGeneral = false; }
    checkAchievementsAndIcons(user);
    saveUsers(users);
}

export const getRivalryStats = (userId: string): { bestCustomer: RivalData | null, nemeses: RivalData | null } => {
    const matches = getMatches();
    const users = getUsers();
    const statsMap = new Map<string, { wins: number, losses: number, draws: number }>();
    matches.forEach(m => {
        if (m.player1Id !== userId && m.player2Id !== userId) return;
        const isP1 = m.player1Id === userId;
        const opponentId = isP1 ? m.player2Id : m.player1Id;
        if (!statsMap.has(opponentId)) statsMap.set(opponentId, { wins: 0, losses: 0, draws: 0 });
        const stat = statsMap.get(opponentId)!;
        if (m.result === 'DRAW') stat.draws++;
        else if ((isP1 && m.result === 'PLAYER1_WIN') || (!isP1 && m.result === 'PLAYER2_WIN')) stat.wins++;
        else stat.losses++;
    });
    let bestCustomer: RivalData | null = null;
    let nemeses: RivalData | null = null;
    statsMap.forEach((val, key) => {
        const total = val.wins + val.losses + val.draws;
        if (total < 3) return; 
        const oppName = users.find(u => u.id === key)?.name || 'Unknown';
        const data: RivalData = { opponentId: key, opponentName: oppName, wins: val.wins, losses: val.losses, draws: val.draws, total, winRate: val.wins / total };
        if (!bestCustomer || (data.wins > bestCustomer.wins)) { if (data.wins > data.losses) bestCustomer = data; }
        if (!nemeses || (data.losses > nemeses.losses)) { if (data.losses >= data.wins) nemeses = data; }
    });
    return { bestCustomer, nemeses };
}

const K_FACTOR = 32;
export const calculateEloChange = (playerRate: number, opponentRate: number, actualScore: number): number => {
  const expectedScore = 1 / (1 + 10 ** ((opponentRate - playerRate) / 400));
  if (actualScore === 1) {
      let change = K_FACTOR * (actualScore - expectedScore);
      if (opponentRate - playerRate >= 100) change = change * 1.5; 
      return Math.max(10, Math.round(change));
  } else if (actualScore === 0.5) { return 5; } else { return 2; }
};

const calculateMatchPoints = (resultType: 'WIN' | 'LOSS' | 'DRAW', currentStreak: number, isNewMemberInvolved: boolean, multiplier: number): PointBreakdown => {
    let base = 0;
    if (resultType === 'WIN') base = 10; else if (resultType === 'LOSS') base = 5; else base = 7;
    const effectiveBase = base * multiplier;
    let streakBonus = 0;
    if (resultType === 'WIN') { const nextStreak = currentStreak + 1; if (nextStreak === 3) streakBonus = 10; if (nextStreak === 5) streakBonus = 30; }
    let newMemberBonus = 0;
    if (isNewMemberInvolved) newMemberBonus = 5;
    return { base: effectiveBase, streakBonus, newMemberBonus, eventMultiplier: multiplier, total: effectiveBase + streakBonus + newMemberBonus };
};

const validateMatchCooldown = (p1Id: string, p2Id: string) => {
    const matches = getMatches();
    const COOLDOWN_MINUTES = 1; 
    const now = new Date().getTime();
    const recentMatch = matches.find(m => {
        const isSamePair = (m.player1Id === p1Id && m.player2Id === p2Id) || (m.player1Id === p2Id && m.player2Id === p1Id);
        if (!isSamePair) return false;
        const matchTime = new Date(m.date).getTime();
        return (now - matchTime) < (COOLDOWN_MINUTES * 60 * 1000);
    });
    if (recentMatch) {
        const matchTime = new Date(recentMatch.date).getTime();
        const minutesLeft = Math.ceil((COOLDOWN_MINUTES * 60 * 1000 - (now - matchTime)) / 60000);
        throw new Error(`同じ相手との対戦は時間を空けてください。\nクールダウン中: あと約${minutesLeft}分`);
    }
}

export const processMatch = (p1Id: string, p2Id: string, result: 'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW'): MatchProcessResult => {
  validateMatchCooldown(p1Id, p2Id);
  const users = getUsers();
  const settings = getSettings();
  const p1 = users.find(u => u.id === p1Id);
  const p2 = users.find(u => u.id === p2Id);
  if (!p1 || !p2) throw new Error("User not found");
  const isDuel = p1.isGeneral && p2.isGeneral && p1.faction !== p2.faction;
  let p1Score = 0.5;
  if (result === 'PLAYER1_WIN') p1Score = 1;
  if (result === 'PLAYER2_WIN') p1Score = 0;
  const p2Score = 1 - p1Score;
  const p1RateDelta = calculateEloChange(p1.rate, p2.rate, p1Score);
  const p2RateDelta = calculateEloChange(p2.rate, p1.rate, p2Score);
  const activeEvent = isEventActive();
  const multiplier = activeEvent ? settings.eventMultiplier : 1;
  const isNewMemberInvolved = p1.isNewMember || p2.isNewMember;
  const isInterFactionMatch = activeEvent && settings.eventType === EventType.FACTION_WAR && p1.faction !== p2.faction;
  let p1ResType: 'WIN' | 'LOSS' | 'DRAW' = 'DRAW';
  if (result === 'PLAYER1_WIN') p1ResType = 'WIN';
  if (result === 'PLAYER2_WIN') p1ResType = 'LOSS';
  let p2ResType: 'WIN' | 'LOSS' | 'DRAW' = 'DRAW';
  if (result === 'PLAYER2_WIN') p2ResType = 'WIN';
  if (result === 'PLAYER1_WIN') p2ResType = 'LOSS';
  const p1PointsDetail = calculateMatchPoints(p1ResType, p1.currentStreak, isNewMemberInvolved, multiplier);
  const p2PointsDetail = calculateMatchPoints(p2ResType, p2.currentStreak, isNewMemberInvolved, multiplier);
  const date = getTimestamp();
  const updateUserStats = (u: User, won: boolean, draw: boolean, rateChange: number, pointsDetail: PointBreakdown, duelWin: boolean, isInterFaction: boolean) => {
    u.rate += rateChange; 
    u.rateHistory.push({ date, rate: u.rate });
    u.totalPoints += pointsDetail.total;
    u.monthlyPoints += pointsDetail.total;
    u.pointsMatch = (u.pointsMatch || 0) + pointsDetail.total;
    if (isInterFaction) { u.eventPoints = (u.eventPoints || 0) + pointsDetail.total; }
    if (draw) { u.draws += 1; u.currentStreak = 0; } else if (won) { u.wins += 1; u.currentStreak += 1; if (u.currentStreak > u.maxStreak) u.maxStreak = u.currentStreak; } else { u.losses += 1; u.currentStreak = 0; }
    return checkAchievementsAndIcons(u, { isDuelWin: duelWin });
  };
  const resultsP1 = updateUserStats(p1, result === 'PLAYER1_WIN', result === 'DRAW', p1RateDelta, p1PointsDetail, isDuel && result === 'PLAYER1_WIN', isInterFactionMatch);
  const resultsP2 = updateUserStats(p2, result === 'PLAYER2_WIN', result === 'DRAW', p2RateDelta, p2PointsDetail, isDuel && result === 'PLAYER2_WIN', isInterFactionMatch);
  saveUsers(users);
  const matchRecord: MatchRecord = { id: generateId(), date, player1Id: p1Id, player2Id: p2Id, result, p1RateChange: p1RateDelta, p2RateChange: p2RateDelta, p1PointsEarned: p1PointsDetail.total, p2PointsEarned: p2PointsDetail.total, isDuel };
  addMatch(matchRecord);
  addLog({ id: generateId(), userId: p1Id, type: result === 'PLAYER1_WIN' ? ActivityType.MATCH_WIN : result === 'DRAW' ? ActivityType.MATCH_DRAW : ActivityType.MATCH_LOSS, points: p1PointsDetail.total, description: isDuel ? `Duel vs ${p2.name}` : `Match vs ${p2.name}`, date });
  addLog({ id: generateId(), userId: p2Id, type: result === 'PLAYER2_WIN' ? ActivityType.MATCH_WIN : result === 'DRAW' ? ActivityType.MATCH_DRAW : ActivityType.MATCH_LOSS, points: p2PointsDetail.total, description: isDuel ? `Duel vs ${p1.name}` : `Match vs ${p1.name}`, date });
  return { p1RateChange: p1RateDelta, p2RateChange: p2RateDelta, p1PointsEarned: p1PointsDetail.total, p2PointsEarned: p2PointsDetail.total, p1PointsDetail, p2PointsDetail, newAchievementsP1: resultsP1.newAchievements, newAchievementsP2: resultsP2.newAchievements, newIconsP1: resultsP1.newIcons, newIconsP2: resultsP2.newIcons, isDuel };
};

export const deleteMatch = (matchId: string) => {
    const matches = getMatches();
    const matchIndex = matches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) throw new Error("Match not found");
    const match = matches[matchIndex];
    const users = getUsers();
    const p1 = users.find(u => u.id === match.player1Id);
    const p2 = users.find(u => u.id === match.player2Id);
    if (p1 && p2) {
        p1.rate -= match.p1RateChange;
        p1.totalPoints -= match.p1PointsEarned;
        p1.monthlyPoints -= match.p1PointsEarned;
        if (p1.eventPoints > 0) p1.eventPoints = Math.max(0, p1.eventPoints - match.p1PointsEarned);
        p1.pointsMatch = (p1.pointsMatch || match.p1PointsEarned) - match.p1PointsEarned;
        if (p1.rateHistory.length > 1) p1.rateHistory.pop();
        if (match.result === 'PLAYER1_WIN') { p1.wins--; p2.losses--; } else if (match.result === 'PLAYER2_WIN') { p1.losses--; p2.wins--; } else { p1.draws--; p2.draws--; }
        p2.rate -= match.p2RateChange;
        p2.totalPoints -= match.p2PointsEarned;
        p2.monthlyPoints -= match.p2PointsEarned;
        if (p2.eventPoints > 0) p2.eventPoints = Math.max(0, p2.eventPoints - match.p2PointsEarned);
        p2.pointsMatch = (p2.pointsMatch || match.p2PointsEarned) - match.p2PointsEarned;
        if (p2.rateHistory.length > 1) p2.rateHistory.pop();
        saveUsers(users);
    }
    matches.splice(matchIndex, 1);
    saveMatches(matches);
}

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
  const results = checkAchievementsAndIcons(user);
  saveUsers(users);
  addLog({ id: generateId(), userId: user.id, type: ActivityType.ATTENDANCE, points: 5, description: 'Daily Attendance', date: new Date().toISOString() });
  return { success: true, newAchievements: results.newAchievements, newIcons: results.newIcons, message: '出席を記録しました！ (+5 pt)' };
};

export const manualPointAdjustment = (userId: string, points: number, reason: string) => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;
    user.totalPoints += points;
    user.monthlyPoints += points;
    user.pointsSpecial = (user.pointsSpecial || 0) + points;
    checkAchievementsAndIcons(user);
    saveUsers(users);
    addLog({ id: generateId(), userId: user.id, type: ActivityType.CONTRIBUTION, points: points, description: reason, date: new Date().toISOString() });
};

export const resetMonthly = () => {
    const users = getUsers();
    const settings = getSettings();
    users.forEach(u => { u.monthlyPoints = 0; });
    settings.lastMonthlyReset = new Date().toISOString();
    saveUsers(users);
    saveSettings(settings);
}

export const exportData = (): string => {
    const data: BackupData = { users: getUsers(), matches: getMatches(), settings: getSettings(), logs: getLogs(), timestamp: new Date().toISOString() };
    return JSON.stringify(data, null, 2);
}

export const importData = (jsonString: string): boolean => {
    try {
        const data: BackupData = JSON.parse(jsonString);
        if (!data.users || !data.matches) throw new Error("Invalid Data");
        saveUsers(data.users);
        localStorage.setItem(MATCHES_KEY, JSON.stringify(data.matches));
        if (data.settings) saveSettings(data.settings);
        if (data.logs) localStorage.setItem(LOGS_KEY, JSON.stringify(data.logs));
        return true;
    } catch (e) { console.error(e); return false; }
}

export const seedData = () => {
  if (getUsers().length === 0) {
    const users: User[] = INITIAL_MEMBERS.map((m, idx) => ({
      id: `u${idx + 100}`,
      name: m.name.replace(/\s+/g, ' '),
      reading: guessReading(m.name), 
      isNewMember: m.isNew,
      rate: 1000,
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
    saveUsers(users);
  }
};
