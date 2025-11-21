
import { User, MatchRecord, SystemSettings, ActivityLog, ActivityType, AchievementDef, MatchProcessResult, AttendanceResult, BackupData, PointBreakdown } from './types';

const USERS_KEY = 'club_rivals_users_v2';
const MATCHES_KEY = 'club_rivals_matches';
const SETTINGS_KEY = 'club_rivals_settings';
const LOGS_KEY = 'club_rivals_logs';

// Default Settings
const DEFAULT_SETTINGS: SystemSettings = {
  adminPin: '1123',
  eventName: null,
  eventEndsAt: null,
  eventMultiplier: 2,
  lastMonthlyReset: new Date().toISOString(),
};

// Achievements Definition
export const ACHIEVEMENTS_DATA: AchievementDef[] = [
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

// Member List Data
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

const generateId = () => Math.random().toString(36).substr(2, 9);
const getTimestamp = () => new Date().toISOString();

// --- Data Access ---

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

export const getUsers = (): User[] => {
  const u = localStorage.getItem(USERS_KEY);
  if (!u) return [];
  
  // Migration for existing data (ensure new fields exist)
  const users: User[] = JSON.parse(u);
  return users.map(user => ({
    ...user,
    pointsMatch: user.pointsMatch ?? 0,
    pointsAttendance: user.pointsAttendance ?? 0,
    pointsSpecial: user.pointsSpecial ?? 0,
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
  matches.unshift(match); // Newest first
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

// --- Logic Helpers ---

// Check and unlock achievements
const checkAchievements = (user: User): AchievementDef[] => {
  const unlocked: AchievementDef[] = [];
  
  ACHIEVEMENTS_DATA.forEach(ach => {
    if (user.achievements.includes(ach.id)) return;

    let met = false;
    switch (ach.conditionType) {
      case 'WINS': met = user.wins >= ach.threshold; break;
      case 'STREAK': met = user.currentStreak >= ach.threshold; break;
      case 'RATE': met = user.rate >= ach.threshold; break;
      case 'DAYS': met = user.activityDays >= ach.threshold; break;
      case 'MATCHES': met = (user.wins + user.losses + user.draws) >= ach.threshold; break;
    }

    if (met) {
      user.achievements.push(ach.id);
      unlocked.push(ach);
      // Auto-set first title if none set
      if (!user.activeTitle) {
          user.activeTitle = ach.id;
      }
    }
  });
  return unlocked;
};

export const updateUserTitle = (userId: string, titleId: string | null) => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return;
  
  // Verify ownership
  if (titleId && !user.achievements.includes(titleId)) return;

  user.activeTitle = titleId;
  saveUsers(users);
};

export interface RivalData {
    opponentId: string;
    opponentName: string;
    wins: number;
    losses: number;
    draws: number;
    total: number;
    winRate: number;
}

// Calculate Rival Stats
export const getRivalryStats = (userId: string): { bestCustomer: RivalData | null, nemeses: RivalData | null } => {
    const matches = getMatches();
    const users = getUsers();
    const statsMap = new Map<string, { wins: number, losses: number, draws: number }>();

    matches.forEach(m => {
        if (m.player1Id !== userId && m.player2Id !== userId) return;
        
        const isP1 = m.player1Id === userId;
        const opponentId = isP1 ? m.player2Id : m.player1Id;
        
        if (!statsMap.has(opponentId)) {
            statsMap.set(opponentId, { wins: 0, losses: 0, draws: 0 });
        }
        const stat = statsMap.get(opponentId)!;

        if (m.result === 'DRAW') {
            stat.draws++;
        } else if ((isP1 && m.result === 'PLAYER1_WIN') || (!isP1 && m.result === 'PLAYER2_WIN')) {
            stat.wins++;
        } else {
            stat.losses++;
        }
    });

    let bestCustomer: RivalData | null = null;
    let nemeses: RivalData | null = null;

    statsMap.forEach((val, key) => {
        const total = val.wins + val.losses + val.draws;
        if (total < 3) return; // Need minimum sample size

        const oppName = users.find(u => u.id === key)?.name || 'Unknown';
        const data: RivalData = {
            opponentId: key,
            opponentName: oppName,
            wins: val.wins,
            losses: val.losses,
            draws: val.draws,
            total,
            winRate: val.wins / total
        };

        // Best Customer: Most wins, >50% win rate
        if (!bestCustomer || (data.wins > bestCustomer.wins)) {
            if (data.wins > data.losses) bestCustomer = data;
        }

        // Nemesis: Most losses
        if (!nemeses || (data.losses > nemeses.losses)) {
             if (data.losses >= data.wins) nemeses = data;
        }
    });

    return { bestCustomer, nemeses };
}

// --- Game Logic ---

const K_FACTOR = 32;

export const calculateEloChange = (playerRate: number, opponentRate: number, actualScore: number): number => {
  const expectedScore = 1 / (1 + 10 ** ((opponentRate - playerRate) / 400));
  
  if (actualScore === 1) {
      // WIN: Standard calculation but ensure good reward
      let change = K_FACTOR * (actualScore - expectedScore);
      
      // Giant Killing Bonus (1.5x) if winning against opponent with 100+ higher rate
      if (opponentRate - playerRate >= 100) {
        change = change * 1.5; 
      }
      
      // Minimum gain of 10 for a win to feel good
      return Math.max(10, Math.round(change));
  } else if (actualScore === 0.5) {
      // DRAW: Fixed gain
      return 5;
  } else {
      // LOSS: "Even if you lose, rate goes up" -> Fixed small gain
      return 2;
  }
};

// Calculate point details for a player in a match
const calculateMatchPoints = (
    resultType: 'WIN' | 'LOSS' | 'DRAW',
    currentStreak: number,
    isNewMemberInvolved: boolean,
    multiplier: number
): PointBreakdown => {
    let base = 0;
    if (resultType === 'WIN') base = 10;
    else if (resultType === 'LOSS') base = 5;
    else base = 7;
    
    // Multiplier applies to base points
    // (Usually events double the win points)
    const effectiveBase = base * multiplier;

    let streakBonus = 0;
    if (resultType === 'WIN') {
        const nextStreak = currentStreak + 1;
        if (nextStreak === 3) streakBonus = 10;
        if (nextStreak === 5) streakBonus = 30;
    }

    let newMemberBonus = 0;
    if (isNewMemberInvolved) {
        newMemberBonus = 5;
    }

    return {
        base: effectiveBase,
        streakBonus,
        newMemberBonus,
        eventMultiplier: multiplier,
        total: effectiveBase + streakBonus + newMemberBonus
    };
};

// Anti-Spam: Check cooldown between specific pair
const validateMatchCooldown = (p1Id: string, p2Id: string) => {
    const matches = getMatches();
    // Look for a match between these two in the last 5 minutes
    const COOLDOWN_MINUTES = 5;
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

export const processMatch = (
  p1Id: string,
  p2Id: string,
  result: 'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW'
): MatchProcessResult => {
  // 0. Validate
  validateMatchCooldown(p1Id, p2Id);

  const users = getUsers();
  const settings = getSettings();
  const p1 = users.find(u => u.id === p1Id);
  const p2 = users.find(u => u.id === p2Id);

  if (!p1 || !p2) throw new Error("User not found");

  // 1. Elo Calculation
  let p1Score = 0.5;
  if (result === 'PLAYER1_WIN') p1Score = 1;
  if (result === 'PLAYER2_WIN') p1Score = 0;
  const p2Score = 1 - p1Score;

  // Calculate changes (always positive now based on rules)
  const p1RateDelta = calculateEloChange(p1.rate, p2.rate, p1Score);
  const p2RateDelta = calculateEloChange(p2.rate, p1.rate, p2Score);

  // 2. Point Calculation
  const activeEvent = isEventActive();
  const multiplier = activeEvent ? settings.eventMultiplier : 1;
  const isNewMemberInvolved = p1.isNewMember || p2.isNewMember;

  let p1ResType: 'WIN' | 'LOSS' | 'DRAW' = 'DRAW';
  if (result === 'PLAYER1_WIN') p1ResType = 'WIN';
  if (result === 'PLAYER2_WIN') p1ResType = 'LOSS';

  let p2ResType: 'WIN' | 'LOSS' | 'DRAW' = 'DRAW';
  if (result === 'PLAYER2_WIN') p2ResType = 'WIN';
  if (result === 'PLAYER1_WIN') p2ResType = 'LOSS';

  const p1PointsDetail = calculateMatchPoints(p1ResType, p1.currentStreak, isNewMemberInvolved, multiplier);
  const p2PointsDetail = calculateMatchPoints(p2ResType, p2.currentStreak, isNewMemberInvolved, multiplier);

  // 3. Update Objects
  const date = getTimestamp();

  const updateUserStats = (u: User, won: boolean, draw: boolean, rateChange: number, pointsDetail: PointBreakdown) => {
    u.rate += rateChange; 
    u.rateHistory.push({ date, rate: u.rate });
    
    // Point Updates
    u.totalPoints += pointsDetail.total;
    u.monthlyPoints += pointsDetail.total;
    u.pointsMatch = (u.pointsMatch || 0) + pointsDetail.total;
    
    if (draw) {
      u.draws += 1;
      u.currentStreak = 0;
    } else if (won) {
      u.wins += 1;
      u.currentStreak += 1;
      if (u.currentStreak > u.maxStreak) u.maxStreak = u.currentStreak;
    } else {
      u.losses += 1;
      u.currentStreak = 0;
    }

    return checkAchievements(u);
  };

  const newAchievementsP1 = updateUserStats(p1, result === 'PLAYER1_WIN', result === 'DRAW', p1RateDelta, p1PointsDetail);
  const newAchievementsP2 = updateUserStats(p2, result === 'PLAYER2_WIN', result === 'DRAW', p2RateDelta, p2PointsDetail);

  saveUsers(users);

  const matchRecord: MatchRecord = {
    id: generateId(),
    date,
    player1Id: p1Id,
    player2Id: p2Id,
    result,
    p1RateChange: p1RateDelta,
    p2RateChange: p2RateDelta,
    p1PointsEarned: p1PointsDetail.total,
    p2PointsEarned: p2PointsDetail.total
  };
  addMatch(matchRecord);

  addLog({
    id: generateId(),
    userId: p1Id,
    type: result === 'PLAYER1_WIN' ? ActivityType.MATCH_WIN : result === 'DRAW' ? ActivityType.MATCH_DRAW : ActivityType.MATCH_LOSS,
    points: p1PointsDetail.total,
    description: `Match vs ${p2.name}`,
    date
  });
  addLog({
    id: generateId(),
    userId: p2Id,
    type: result === 'PLAYER2_WIN' ? ActivityType.MATCH_WIN : result === 'DRAW' ? ActivityType.MATCH_DRAW : ActivityType.MATCH_LOSS,
    points: p2PointsDetail.total,
    description: `Match vs ${p1.name}`,
    date
  });

  return {
    p1RateChange: p1RateDelta,
    p2RateChange: p2RateDelta,
    p1PointsEarned: p1PointsDetail.total,
    p2PointsEarned: p2PointsDetail.total,
    p1PointsDetail,
    p2PointsDetail,
    newAchievementsP1,
    newAchievementsP2
  };
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
        // Revert P1
        p1.rate -= match.p1RateChange;
        p1.totalPoints -= match.p1PointsEarned;
        p1.monthlyPoints -= match.p1PointsEarned;
        p1.pointsMatch = (p1.pointsMatch || match.p1PointsEarned) - match.p1PointsEarned;

        // Remove last rate history point if it matches (imperfect but sufficient for simple undo)
        if (p1.rateHistory.length > 1) p1.rateHistory.pop();

        // Revert Stats (Approximate: Streak is hard to revert perfectly without full history replay)
        if (match.result === 'PLAYER1_WIN') { p1.wins--; p2.losses--; }
        else if (match.result === 'PLAYER2_WIN') { p1.losses--; p2.wins--; }
        else { p1.draws--; p2.draws--; }

        // Revert P2
        p2.rate -= match.p2RateChange;
        p2.totalPoints -= match.p2PointsEarned;
        p2.monthlyPoints -= match.p2PointsEarned;
        p2.pointsMatch = (p2.pointsMatch || match.p2PointsEarned) - match.p2PointsEarned;

        if (p2.rateHistory.length > 1) p2.rateHistory.pop();

        saveUsers(users);
    }

    // Remove match
    matches.splice(matchIndex, 1);
    saveMatches(matches);
}

export const recordAttendance = (userId: string): AttendanceResult => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, newAchievements: [], message: 'ユーザーが見つかりません' };

  const today = new Date().toISOString().split('T')[0];
  const last = user.lastAttendance ? new Date(user.lastAttendance).toISOString().split('T')[0] : null;

  if (today === last) return { success: false, newAchievements: [], message: '本日はすでに出席済みです' };

  user.lastAttendance = new Date().toISOString();
  user.totalPoints += 5;
  user.monthlyPoints += 5;
  user.pointsAttendance = (user.pointsAttendance || 0) + 5;
  user.activityDays = (user.activityDays || 0) + 1;
  
  const newAchievements = checkAchievements(user);
  saveUsers(users);
  
  addLog({
    id: generateId(),
    userId: user.id,
    type: ActivityType.ATTENDANCE,
    points: 5,
    description: 'Daily Attendance',
    date: new Date().toISOString()
  });

  return { success: true, newAchievements, message: '出席を記録しました！ (+5 pt)' };
};

export const manualPointAdjustment = (userId: string, points: number, reason: string) => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;

    user.totalPoints += points;
    user.monthlyPoints += points;
    user.pointsSpecial = (user.pointsSpecial || 0) + points;
    
    checkAchievements(user);
    saveUsers(users);

    addLog({
        id: generateId(),
        userId: user.id,
        type: ActivityType.CONTRIBUTION,
        points: points,
        description: reason,
        date: new Date().toISOString()
    });
};

export const resetMonthly = () => {
    const users = getUsers();
    const settings = getSettings();
    
    users.forEach(u => {
        u.monthlyPoints = 0;
    });
    settings.lastMonthlyReset = new Date().toISOString();
    
    saveUsers(users);
    saveSettings(settings);
}

// --- Backup & Restore ---
export const exportData = (): string => {
    const data: BackupData = {
        users: getUsers(),
        matches: getMatches(),
        settings: getSettings(),
        logs: getLogs(),
        timestamp: new Date().toISOString()
    };
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
    } catch (e) {
        console.error(e);
        return false;
    }
}

export const seedData = () => {
  if (getUsers().length === 0) {
    const users: User[] = INITIAL_MEMBERS.map((m, idx) => ({
      id: `u${idx + 100}`,
      name: m.name.replace(/\s+/g, ' '),
      isNewMember: m.isNew,
      rate: 1000,
      
      totalPoints: 0,
      pointsMatch: 0,
      pointsAttendance: 0,
      pointsSpecial: 0,

      monthlyPoints: 0,
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
      avatarColor: `bg-${['red','blue','green','yellow','purple','pink','indigo','teal'][idx % 8]}-500`
    }));
    saveUsers(users);
    console.log('Seeded new member data');
  }
};
