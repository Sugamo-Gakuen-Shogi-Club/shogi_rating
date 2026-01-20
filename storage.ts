
import { User, MatchRecord, SystemSettings, ActivityLog, ActivityType, AchievementDef, MatchProcessResult, AttendanceResult, BackupData, PointBreakdown, EventType, Season, IconDef, RivalData, SystemTitle, TitleDef } from './types';

const USERS_KEY = 'club_rivals_users_v2';
const MATCHES_KEY = 'club_rivals_matches';
const SETTINGS_KEY = 'club_rivals_settings';
const LOGS_KEY = 'club_rivals_logs';

/**
 * Firebase Realtime Database URL
 * ユーザーの指定したリージョン別URL (asia-southeast1) に更新
 */
const CLOUD_API_URL = 'https://club-rivals-test1-default-rtdb.asia-southeast1.firebasedatabase.app/rivals_data.json'; 

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

// --- Missing constants added to fix compilation errors ---
const NAME_READINGS: Record<string, string> = {
  "将棋太郎": "しょうぎたろう",
  "駒次郎": "こまじろう"
};

const INITIAL_MEMBERS: { name: string; isNew: boolean }[] = [
  { name: "将棋太郎", isNew: false },
  { name: "駒次郎", isNew: true }
];

// --- CLOUD SYNC LOGIC (Firebase REST API) ---

export const syncWithServer = async () => {
  try {
    const data: BackupData = {
      users: getUsers(),
      matches: getMatches(),
      settings: getSettings(),
      logs: getLogs(),
      timestamp: new Date().toISOString()
    };

    const response = await fetch(CLOUD_API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    console.debug('Firebase sync successful');
    return true;
  } catch (e) {
    console.warn('Firebase sync failed, working in offline mode', e);
    return false;
  }
};

export const loadFromCloud = async (): Promise<boolean> => {
  try {
    const response = await fetch(CLOUD_API_URL);
    if (!response.ok) return false;
    const data: BackupData | null = await response.json();
    
    if (!data) return false;

    if (data.users && data.matches) {
      saveUsers(data.users, false); 
      localStorage.setItem(MATCHES_KEY, JSON.stringify(data.matches));
      if (data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
      if (data.logs) localStorage.setItem(LOGS_KEY, JSON.stringify(data.logs));
      return true;
    }
    return false;
  } catch (e) {
    console.warn('Firebase load failed', e);
    return false;
  }
};

// --- 以下、既存のロジック ---

export const SYSTEM_TITLES: TitleDef[] = [
    { id: 'MASTER', name: '名人', english: 'The Master', description: '現在のレート最強', color: 'text-yellow-400' },
    { id: 'RISING_STAR', name: '新星', english: 'Rising Star', description: '今月のレート上昇幅No.1', color: 'text-blue-400' },
    { id: 'GRINDER', name: '活動家', english: 'The Grinder', description: '対局数＋出席数No.1', color: 'text-green-400' },
    { id: 'GIANT_KILLER', name: '下克上', english: 'Giant Killer', description: '格上撃破数No.1', color: 'text-red-400' },
];

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
  { id: 'RATE_1100', name: '有望株', description: 'レート1100到達', conditionType: 'RATE', threshold: 1100 },
  { id: 'RATE_1200', name: '脱・初心者', description: 'レート1200到達', conditionType: 'RATE', threshold: 1200 },
  { id: 'RATE_1500', name: '熟練者', description: 'レート1500到達', conditionType: 'RATE', threshold: 1500 },
  { id: 'RATE_1800', name: 'マスター', description: 'レート1800到達', conditionType: 'RATE', threshold: 1800 },
  { id: 'RATE_2000', name: 'レジェンド', description: 'レート2000到達', conditionType: 'RATE', threshold: 2000 },
  { id: 'DAYS_3', name: '三日坊主卒業', description: '活動日数3日', conditionType: 'DAYS', threshold: 3 },
  { id: 'DAYS_10', name: '将棋好き', description: '活動日数10日', conditionType: 'DAYS', threshold: 10 },
  { id: 'DAYS_30', name: '部室の主', description: '活動日数30日', conditionType: 'DAYS', threshold: 30 },
  { id: 'DAYS_100', name: '生ける伝説', description: '活動日数100日', conditionType: 'DAYS', threshold: 100 },
];

export const ICONS_DATA: IconDef[] = [
    { id: 'DEFAULT_INITIAL', char: '名', name: '頭文字', conditionDescription: 'デフォルト', type: 'DEFAULT', category: 'DEFAULT' },
    { id: 'DEFAULT_SMILE', char: '🙂', name: 'スマイル', conditionDescription: 'デフォルト', type: 'DEFAULT', category: 'DEFAULT' },
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
    { id: 'CHESS_PAWN', char: '♟️', name: 'ポーン', conditionDescription: '勝利数30回', type: 'WINS', threshold: 30, category: 'CHESS' },
    { id: 'CHESS_KNIGHT', char: '♞', name: 'ナイト', conditionDescription: 'レート1500到達', type: 'RATE', threshold: 1500, category: 'CHESS' },
    { id: 'CHESS_BISHOP', char: '♝', name: 'ビショップ', conditionDescription: 'レート1600到達', type: 'RATE', threshold: 1600, category: 'CHESS' },
    { id: 'CHESS_ROOK', char: '♜', name: 'ルーク', conditionDescription: 'レート1700到達', type: 'RATE', threshold: 1700, category: 'CHESS' },
    { id: 'CHESS_QUEEN', char: '♛', name: 'クイーン', conditionDescription: 'レート1800到達', type: 'RATE', threshold: 1800, category: 'CHESS' },
    { id: 'CHESS_KING', char: '♚', name: 'キング', conditionDescription: 'レート2000到達', type: 'RATE', threshold: 2000, category: 'CHESS' },
    { id: 'STREAK_5', char: '⚡', name: '疾風', conditionDescription: '5連勝達成', type: 'STREAK', threshold: 5, category: 'SPECIAL' },
    { id: 'STREAK_10', char: '👑', name: '無双', conditionDescription: '10連勝達成', type: 'STREAK', threshold: 10, category: 'SPECIAL' },
    { id: 'WINS_50', char: '🔥', name: '闘神', conditionDescription: '50勝達成', type: 'WINS', threshold: 50, category: 'SPECIAL' },
    { id: 'SPECIAL_GENERAL', char: '👺', name: '大将軍', conditionDescription: 'チーム大将に任命', type: 'SPECIAL', category: 'SPECIAL' },
    { id: 'SPECIAL_DUEL', char: '⚜️', name: '決闘者', conditionDescription: '一騎討ちで勝利', type: 'SPECIAL', category: 'SPECIAL' },
];

export const playSound = (type: 'CLICK' | 'SUCCESS' | 'ERROR' | 'WIN' | 'FANFARE') => {
    if (typeof window === 'undefined') return;
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.5; 
        masterGain.connect(ctx.destination);
        const now = ctx.currentTime;
        const createNoiseBuffer = () => {
            const bufferSize = ctx.sampleRate * 1; 
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
            return buffer;
        };
        switch (type) {
            case 'CLICK': {
                const noise = ctx.createBufferSource();
                noise.buffer = createNoiseBuffer();
                const noiseFilter = ctx.createBiquadFilter();
                noiseFilter.type = 'highpass';
                noiseFilter.frequency.value = 1200;
                const noiseGain = ctx.createGain();
                noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(masterGain);
                noiseGain.gain.setValueAtTime(0.8, now); noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
                noise.start(now); noise.stop(now + 0.05);
                const osc = ctx.createOscillator();
                osc.type = 'triangle'; osc.frequency.setValueAtTime(350, now); osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
                const oscGain = ctx.createGain(); oscGain.gain.setValueAtTime(0.4, now); oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.connect(oscGain); oscGain.connect(masterGain); osc.start(now); osc.stop(now + 0.1);
                break;
            }
            case 'SUCCESS': {
                const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
                const gain = ctx.createGain(); gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.8, now + 0.01); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
                osc.connect(gain); gain.connect(masterGain); osc.start(now); osc.stop(now + 0.35);
                break;
            }
            case 'WIN': {
                const hit = (time: number, freq: number, decay: number, vol: number) => {
                    const osc = ctx.createOscillator(); osc.type = 'square'; const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 180;
                    osc.frequency.setValueAtTime(freq, time); const g = ctx.createGain(); g.gain.setValueAtTime(vol, time); g.gain.exponentialRampToValueAtTime(0.001, time + decay);
                    osc.connect(filter); filter.connect(g); g.connect(masterGain); osc.start(time); osc.stop(time + decay);
                };
                hit(now, 80, 0.1, 0.5); hit(now + 0.1, 80, 0.1, 0.6); hit(now + 0.25, 60, 0.4, 0.8);
                break;
            }
            case 'FANFARE': {
                const freqs = [523.25, 659.25, 783.99, 1046.50, 1174.66];
                freqs.forEach((f, i) => {
                    const osc = ctx.createOscillator(); osc.type = 'sawtooth'; const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1500;
                    const g = ctx.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.08, now + 0.5 + (i * 0.05)); g.gain.linearRampToValueAtTime(0, now + 3.0);
                    osc.connect(filter); filter.connect(g); g.connect(masterGain); osc.start(now); osc.stop(now + 3.5);
                });
                break;
            }
            case 'ERROR': {
                const osc = ctx.createOscillator(); osc.type = 'square'; osc.frequency.setValueAtTime(800, now); const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1200;
                const g = ctx.createGain(); g.gain.setValueAtTime(0.4, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.connect(filter); filter.connect(g); g.connect(masterGain); osc.start(now); osc.stop(now + 0.15);
                break;
            }
        }
    } catch (e) { console.error('Audio play failed', e); }
};

export const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
};

const generateId = () => Math.random().toString(36).substr(2, 9);
const getTimestamp = () => new Date().toISOString();

export const getSettings = (): SystemSettings => {
  const s = localStorage.getItem(SETTINGS_KEY);
  if (!s) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
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

// --- Updated guessReading to use Record type and fix undefined constants ---
const guessReading = (name: string): string => {
    const cleanName = name.replace(/\s+/g, ' ');
    if (NAME_READINGS[cleanName]) return NAME_READINGS[cleanName];
    const tightName = name.replace(/\s+/g, '');
    for (const [key, val] of Object.entries(NAME_READINGS)) {
      if (key.replace(/\s+/g, '') === tightName) return val as string;
    }
    return '';
};

export const getUsers = (): User[] => {
  const u = localStorage.getItem(USERS_KEY);
  if (!u) return [];
  const users: User[] = JSON.parse(u);
  return users.map(user => ({
    ...user,
    pointsMatch: user.pointsMatch ?? 0, pointsAttendance: user.pointsAttendance ?? 0, pointsSpecial: user.pointsSpecial ?? 0,
    monthlyPoints: user.monthlyPoints ?? 0, eventPoints: user.eventPoints ?? 0, reading: user.reading || guessReading(user.name),
    faction: user.faction || 'WHITE', isGeneral: user.isGeneral || false, systemTitle: user.systemTitle || null,
    unlockedIcons: Array.from(new Set([...(user.unlockedIcons || []), 'DEFAULT_INITIAL', 'DEFAULT_SMILE', 'SHOGI_FU'])),
    activeIconId: user.activeIconId || 'DEFAULT_INITIAL'
  }));
};

export const saveUsers = (users: User[], triggerSync = true) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  if (triggerSync) syncWithServer();
};

export const getMatches = (): MatchRecord[] => {
  const m = localStorage.getItem(MATCHES_KEY);
  return m ? JSON.parse(m) : [];
};

export const addMatch = (match: MatchRecord) => {
  const matches = getMatches();
  matches.unshift(match);
  localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
  syncWithServer();
};

export const saveMatches = (matches: MatchRecord[]) => {
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
    syncWithServer();
}

export const getLogs = (): ActivityLog[] => {
  const l = localStorage.getItem(LOGS_KEY);
  return l ? JSON.parse(l) : [];
};

export const addLog = (log: ActivityLog) => {
  const logs = getLogs();
  logs.unshift(log);
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  syncWithServer();
};

export const getUserAvatarChar = (user: User): string => {
    if (!user.activeIconId || user.activeIconId === 'DEFAULT_INITIAL') return user.name.charAt(0);
    const icon = ICONS_DATA.find(i => i.id === user.activeIconId);
    return icon ? icon.char : user.name.charAt(0);
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
      case 'SPECIAL': if (ach.id === 'FACTION_GENERAL') met = user.isGeneral; if (ach.id === 'DUEL_VICTORY') met = !!matchContext?.isDuelWin; break;
    }
    if (met) { user.achievements.push(ach.id); newAchievements.push(ach); if (!user.activeTitle) user.activeTitle = ach.id; }
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
          case 'SPECIAL': if (icon.id === 'SPECIAL_GENERAL') met = user.isGeneral; if (icon.id === 'SPECIAL_DUEL') met = user.achievements.includes('DUEL_VICTORY') || !!matchContext?.isDuelWin; break;
      }
      if (met) { user.unlockedIcons.push(icon.id); newIcons.push(icon); }
  });
  return { newAchievements, newIcons };
};

export const updateUserTitle = (userId: string, titleId: string | null) => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user || (titleId && !user.achievements.includes(titleId))) return;
  user.activeTitle = titleId;
  saveUsers(users);
};

export const updateUserIcon = (userId: string, iconId: string) => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user || !user.unlockedIcons.includes(iconId)) return;
    user.activeIconId = iconId;
    saveUsers(users);
}

export const awardSystemTitles = () => {
    const users = getUsers();
    const matches = getMatches();
    const settings = getSettings();
    users.forEach(u => u.systemTitle = null);
    let master: User | null = null; let maxRate = -1;
    users.forEach(u => { if (u.rate > maxRate) { maxRate = u.rate; master = u; } });
    if (master) (master as User).systemTitle = 'MASTER';
    const currentMonth = new Date().getMonth();
    let rising: User | null = null; let maxDelta = -9999;
    users.filter(u => u.systemTitle === null).forEach(u => {
        const monthlyHistory = u.rateHistory.filter(h => new Date(h.date).getMonth() === currentMonth);
        if (monthlyHistory.length > 0) {
            const delta = u.rate - monthlyHistory[0].rate;
            if (delta > maxDelta && delta > 0) { maxDelta = delta; rising = u; }
        }
    });
    if (rising) (rising as User).systemTitle = 'RISING_STAR';
    let grinder: User | null = null; let maxPts = -1;
    users.filter(u => u.systemTitle === null).forEach(u => { if (u.monthlyPoints > maxPts) { maxPts = u.monthlyPoints; grinder = u; } });
    if (grinder) (grinder as User).systemTitle = 'GRINDER';
    const giantKillerCounts: Record<string, number> = {};
    matches.forEach(m => { if (new Date(m.date).getMonth() === currentMonth) {
        if (m.result === 'PLAYER1_WIN' && m.p1RateChange >= 24) giantKillerCounts[m.player1Id] = (giantKillerCounts[m.player1Id] || 0) + 1;
        else if (m.result === 'PLAYER2_WIN' && m.p2RateChange >= 24) giantKillerCounts[m.player2Id] = (giantKillerCounts[m.player2Id] || 0) + 1;
    }});
    let gk: string | null = null; let maxKills = 0;
    Object.entries(giantKillerCounts).forEach(([uid, count]) => {
        const u = users.find(user => user.id === uid);
        if (u && u.systemTitle === null && count > maxKills) { maxKills = count; gk = uid; }
    });
    if (gk) { const u = users.find(u => u.id === gk); if (u) u.systemTitle = 'GIANT_KILLER'; }
    settings.lastTitleUpdate = new Date().toISOString();
    saveUsers(users);
    saveSettings(settings);
}

export const balanceFactions = (users: User[]): User[] => {
    const scoredUsers = users.map(u => ({ ...u, _ps: (u.rate * 0.3) + ((u.activityDays||0) * 300) }));
    scoredUsers.sort((a, b) => b._ps - a._ps);
    const newUsers = [...users]; let rScore = 0, wScore = 0;
    scoredUsers.forEach(su => {
        const u = newUsers.find(nu => nu.id === su.id); if(!u) return;
        if (rScore <= wScore) { u.faction = 'RED'; rScore += su._ps; } else { u.faction = 'WHITE'; wScore += su._ps; }
    });
    return newUsers;
};

export const getFactionBalanceSimulation = (users: User[]) => {
    const scoredUsers = users.map(u => ({ ...u, _ps: (u.rate * 0.3) + ((u.activityDays||0) * 300) }));
    scoredUsers.sort((a, b) => b._ps - a._ps);
    const red: any[] = [], white: any[] = []; let rs = 0, ws = 0;
    scoredUsers.forEach(u => { if (rs <= ws) { red.push(u); rs += u._ps; } else { white.push(u); ws += u._ps; } });
    const stats = (l: User[]) => ({ count: l.length, avgRate: l.length ? Math.round(l.reduce((a, c) => a + c.rate, 0) / l.length) : 0, totalDays: l.reduce((a, c) => a + (c.activityDays||0), 0) });
    return { redUsers: red, whiteUsers: white, redStats: stats(red), whiteStats: stats(white) };
}

export const assignGenerals = (rg: string, wg: string) => {
    const users = getUsers(); users.forEach(u => u.isGeneral = false);
    const r = users.find(u => u.id === rg); if (r) { r.isGeneral = true; r.faction = 'RED'; checkAchievementsAndIcons(r); }
    const w = users.find(u => u.id === wg); if (w) { w.isGeneral = true; w.faction = 'WHITE'; checkAchievementsAndIcons(w); }
    saveUsers(users);
}

export const resetEventPoints = () => { const users = getUsers(); users.forEach(u => u.eventPoints = 0); saveUsers(users); }

export const getRivalryStats = (uid: string): { bestCustomer: RivalData | null, nemeses: RivalData | null } => {
    const matches = getMatches(); const users = getUsers();
    const stats = new Map<string, { w: number, l: number, d: number }>();
    matches.forEach(m => {
        if (m.player1Id !== uid && m.player2Id !== uid) return;
        const isP1 = m.player1Id === uid; const oppId = isP1 ? m.player2Id : m.player1Id;
        if (!stats.has(oppId)) stats.set(oppId, { w: 0, l: 0, d: 0 });
        const s = stats.get(oppId)!;
        if (m.result === 'DRAW') s.d++; else if ((isP1 && m.result === 'PLAYER1_WIN') || (!isP1 && m.result === 'PLAYER2_WIN')) s.w++; else s.l++;
    });
    let best: RivalData | null = null, neme: RivalData | null = null;
    stats.forEach((v, k) => {
        const total = v.w + v.l + v.d; if (total < 3) return;
        const name = users.find(u => u.id === k)?.name || 'Unknown';
        const d: RivalData = { opponentId: k, opponentName: name, wins: v.w, losses: v.l, draws: v.d, total, winRate: v.w / total };
        if (!best || d.wins > best.wins) if (d.wins > d.losses) best = d;
        if (!neme || d.losses > neme.losses) if (d.losses >= d.wins) neme = d;
    });
    return { bestCustomer: best, nemeses: neme };
}

export const processMatch = (p1Id: string, p2Id: string, result: 'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW'): MatchProcessResult => {
  const users = getUsers(); const settings = getSettings();
  const p1 = users.find(u => u.id === p1Id), p2 = users.find(u => u.id === p2Id);
  if (!p1 || !p2) throw new Error("User not found");
  const isDuel = p1.isGeneral && p2.isGeneral && p1.faction !== p2.faction;
  const p1RateDelta = calculateEloChange(p1.rate, p2.rate, result === 'PLAYER1_WIN' ? 1 : result === 'DRAW' ? 0.5 : 0);
  const p2RateDelta = calculateEloChange(p2.rate, p1.rate, result === 'PLAYER2_WIN' ? 1 : result === 'DRAW' ? 0.5 : 0);
  const multiplier = isEventActive() ? settings.eventMultiplier : 1;
  const p1Points = calculateMatchPoints(result === 'PLAYER1_WIN' ? 'WIN' : result === 'DRAW' ? 'DRAW' : 'LOSS', p1.currentStreak, p1.isNewMember || p2.isNewMember, multiplier);
  const p2Points = calculateMatchPoints(result === 'PLAYER2_WIN' ? 'WIN' : result === 'DRAW' ? 'DRAW' : 'LOSS', p2.currentStreak, p1.isNewMember || p2.isNewMember, multiplier);
  const date = getTimestamp();
  const update = (u: User, won: boolean, draw: boolean, rd: number, pd: PointBreakdown, dw: boolean) => {
    u.rate += rd; u.rateHistory.push({ date, rate: u.rate }); u.totalPoints += pd.total; u.monthlyPoints += pd.total; u.pointsMatch = (u.pointsMatch || 0) + pd.total;
    if (draw) { u.draws++; u.currentStreak = 0; } else if (won) { u.wins++; u.currentStreak++; if (u.currentStreak > u.maxStreak) u.maxStreak = u.currentStreak; } else { u.losses++; u.currentStreak = 0; }
    return checkAchievementsAndIcons(u, { isDuelWin: dw });
  };
  const rP1 = update(p1, result === 'PLAYER1_WIN', result === 'DRAW', p1RateDelta, p1Points, isDuel && result === 'PLAYER1_WIN');
  const rP2 = update(p2, result === 'PLAYER2_WIN', result === 'DRAW', p2RateDelta, p2Points, isDuel && result === 'PLAYER2_WIN');
  saveUsers(users);
  addMatch({ id: generateId(), date, player1Id: p1Id, player2Id: p2Id, result, p1RateChange: p1RateDelta, p2RateChange: p2RateDelta, p1PointsEarned: p1Points.total, p2PointsEarned: p2Points.total, isDuel });
  return { p1RateChange: p1RateDelta, p2RateChange: p2RateDelta, p1PointsEarned: p1Points.total, p2PointsEarned: p2Points.total, p1PointsDetail: p1Points, p2PointsDetail: p2Points, newAchievementsP1: rP1.newAchievements, newAchievementsP2: rP2.newAchievements, newIconsP1: rP1.newIcons, newIconsP2: rP2.newIcons, isDuel, result };
};

const calculateEloChange = (pr: number, or: number, s: number): number => {
  const e = 1 / (1 + 10 ** ((or - pr) / 400));
  if (s === 1) return Math.max(10, Math.round(32 * (s - e) * (or - pr >= 100 ? 1.5 : 1)));
  return s === 0.5 ? 5 : 2;
};

const calculateMatchPoints = (rt: 'WIN' | 'LOSS' | 'DRAW', cs: number, inmi: boolean, em: number): PointBreakdown => {
    const base = rt === 'WIN' ? 10 : rt === 'LOSS' ? 5 : 7;
    const eb = Math.round(base * em);
    const ns = cs + 1; const sb = rt === 'WIN' ? (ns === 3 ? 10 : ns === 5 ? 30 : 0) : 0;
    const nmb = inmi ? 5 : 0;
    return { base: eb, streakBonus: sb, newMemberBonus: nmb, eventMultiplier: em, spamPenalty: 1, total: eb + sb + nmb };
};

export const deleteMatch = (mid: string) => {
    const matches = getMatches(); const i = matches.findIndex(m => m.id === mid); if (i === -1) return;
    const m = matches[i]; const users = getUsers(); const p1 = users.find(u => u.id === m.player1Id), p2 = users.find(u => u.id === m.player2Id);
    if (p1 && p2) {
        p1.rate -= m.p1RateChange; p1.totalPoints -= m.p1PointsEarned; p1.monthlyPoints -= m.p1PointsEarned; if (p1.rateHistory.length > 1) p1.rateHistory.pop();
        if (m.result === 'PLAYER1_WIN') { p1.wins--; p2.losses--; } else if (m.result === 'PLAYER2_WIN') { p1.losses--; p2.wins--; } else { p1.draws--; p2.draws--; }
        p2.rate -= m.p2RateChange; p2.totalPoints -= m.p2PointsEarned; p2.monthlyPoints -= m.p2PointsEarned; if (p2.rateHistory.length > 1) p2.rateHistory.pop();
        saveUsers(users);
    }
    matches.splice(i, 1); saveMatches(matches);
}

export const recordAttendance = (uid: string): AttendanceResult => {
  const users = getUsers(); const u = users.find(user => user.id === uid); if (!u) return { success: false, newAchievements: [], newIcons: [], message: 'User not found' };
  const today = new Date().toISOString().split('T')[0]; if (u.lastAttendance?.split('T')[0] === today) return { success: false, newAchievements: [], newIcons: [], message: 'Already attended' };
  u.lastAttendance = new Date().toISOString(); u.totalPoints += 5; u.monthlyPoints += 5; u.pointsAttendance = (u.pointsAttendance || 0) + 5; u.activityDays = (u.activityDays || 0) + 1;
  const res = checkAchievementsAndIcons(u); saveUsers(users);
  addLog({ id: generateId(), userId: u.id, type: ActivityType.ATTENDANCE, points: 5, description: 'Daily Attendance', date: new Date().toISOString() });
  return { success: true, newAchievements: res.newAchievements, newIcons: res.newIcons, message: 'Attendance recorded! (+5 pt)' };
};

export const manualPointAdjustment = (uid: string, p: number, r: string) => {
    const users = getUsers(); const u = users.find(user => user.id === uid); if (!u) return;
    u.totalPoints += p; u.monthlyPoints += p; u.pointsSpecial = (u.pointsSpecial || 0) + p;
    checkAchievementsAndIcons(u); saveUsers(users);
    addLog({ id: generateId(), userId: u.id, type: ActivityType.CONTRIBUTION, points: p, description: r, date: new Date().toISOString() });
};

export const manualRateAdjustment = (uid: string, rd: number, r: string) => {
    const users = getUsers(); const u = users.find(user => user.id === uid); if (!u) return;
    u.rate += rd; u.rateHistory.push({ date: new Date().toISOString(), rate: u.rate }); saveUsers(users);
};

export const resetMonthly = () => {
    const users = getUsers(); const settings = getSettings();
    users.forEach(u => u.monthlyPoints = 0); settings.lastMonthlyReset = new Date().toISOString();
    saveUsers(users); saveSettings(settings);
}

export const exportData = (): string => JSON.stringify({ users: getUsers(), matches: getMatches(), settings: getSettings(), logs: getLogs(), timestamp: new Date().toISOString() }, null, 2);

export const importData = (js: string): boolean => {
    try { const data: BackupData = JSON.parse(js); if (!data.users || !data.matches) return false;
        saveUsers(data.users); localStorage.setItem(MATCHES_KEY, JSON.stringify(data.matches));
        if (data.settings) saveSettings(data.settings); if (data.logs) localStorage.setItem(LOGS_KEY, JSON.stringify(data.logs));
        return true;
    } catch { return false; }
}

// --- Updated seedData to use correctly defined INITIAL_MEMBERS ---
export const seedData = () => {
  if (getUsers().length === 0) {
    const users: User[] = INITIAL_MEMBERS.map((m, idx) => ({
      id: `u${idx + 100}`, name: m.name.replace(/\s+/g, ' '), reading: guessReading(m.name), isNewMember: m.isNew, rate: 1000,
      faction: idx % 2 === 0 ? 'RED' : 'WHITE', isGeneral: false, systemTitle: null, totalPoints: 0, pointsMatch: 0, pointsAttendance: 0,
      pointsSpecial: 0, monthlyPoints: 0, eventPoints: 0, currentStreak: 0, maxStreak: 0, wins: 0, losses: 0, draws: 0,
      lastAttendance: null, activityDays: 0, rateHistory: [{ date: new Date().toISOString(), rate: 1000 }], achievements: [],
      activeTitle: null, avatarColor: `bg-${['red','blue','green','yellow','purple','pink', 'indigo', 'teal'][idx % 8]}-500`,
      unlockedIcons: ['DEFAULT_INITIAL', 'DEFAULT_SMILE', 'SHOGI_FU'], activeIconId: 'DEFAULT_INITIAL'
    }));
    saveUsers(users);
  }
};
