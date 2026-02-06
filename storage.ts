import { User, MatchRecord, SystemSettings, ActivityLog, ActivityType, AchievementDef, MatchProcessResult, AttendanceResult, BackupData, PointBreakdown, EventType, Season, IconDef, RivalData, SystemTitle, TitleDef } from './types';

const USERS_KEY = 'club_rivals_users_v2';
const MATCHES_KEY = 'club_rivals_matches';
const SETTINGS_KEY = 'club_rivals_settings';
const LOGS_KEY = 'club_rivals_logs';

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
    { id: 'SPECIAL_DAYS_3', char: '🌱', name: '新芽', conditionDescription: '活動日数3日', type: 'DAYS', threshold: 3, category: 'SPECIAL' },
    { id: 'SPECIAL_DAYS_7', char: '🌿', name: '若葉', conditionDescription: '活動日数7日', type: 'DAYS', threshold: 7, category: 'SPECIAL' },
    { id: 'SPECIAL_DAYS_14', char: '🍀', name: '四つ葉', conditionDescription: '活動日数14日', type: 'DAYS', threshold: 14, category: 'SPECIAL' },
    { id: 'SPECIAL_DAYS_21', char: '🌳', name: '大樹', conditionDescription: '活動日数21日', type: 'DAYS', threshold: 21, category: 'SPECIAL' },
];

/** 日本時間の日付文字列を取得 (YYYY-MM-DD) */
export const getLocalDateString = (date?: Date | string) => {
    const d = date ? new Date(date) : new Date();
    const offset = 9 * 60; // JST
    const jstDate = new Date(d.getTime() + (d.getTimezoneOffset() + offset) * 60000);
    const year = jstDate.getFullYear();
    const month = String(jstDate.getMonth() + 1).padStart(2, '0');
    const day = String(jstDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const loadFromCloud = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${CLOUD_API_URL}?nocache=${Date.now()}`);
    if (!response.ok) return false;
    const data: BackupData | null = await response.json();
    if (!data || !data.users) return false;
    localStorage.setItem(USERS_KEY, JSON.stringify(data.users));
    localStorage.setItem(MATCHES_KEY, JSON.stringify(data.matches || []));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings || DEFAULT_SETTINGS));
    localStorage.setItem(LOGS_KEY, JSON.stringify(data.logs || []));
    return true;
  } catch (e) { return false; }
};

export const syncWithServer = async () => {
  try {
    const data: BackupData = { users: getUsers(), matches: getMatches(), settings: getSettings(), logs: getLogs(), timestamp: new Date().toISOString() };
    await fetch(CLOUD_API_URL, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  } catch (e) {}
};

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

export const getUsers = (): User[] => {
  const u = localStorage.getItem(USERS_KEY);
  const rawUsers: any[] = u ? JSON.parse(u) : [];
  return rawUsers.map(user => ({
    ...user,
    achievements: Array.isArray(user.achievements) ? user.achievements : [],
    unlockedIcons: Array.isArray(user.unlockedIcons) ? Array.from(new Set([...user.unlockedIcons, 'DEFAULT_INITIAL', 'DEFAULT_SMILE', 'SHOGI_FU'])) : ['DEFAULT_INITIAL', 'DEFAULT_SMILE', 'SHOGI_FU'],
    activeIconId: user.activeIconId || 'DEFAULT_INITIAL',
    rate: user.rate || 1000,
    wins: user.wins || 0,
    losses: user.losses || 0,
    draws: user.draws || 0,
    currentStreak: user.currentStreak || 0,
    maxStreak: user.maxStreak || 0,
    activityDays: user.activityDays || 0,
    totalPoints: user.totalPoints || 0,
    monthlyPoints: user.monthlyPoints || 0,
    rateHistory: Array.isArray(user.rateHistory) ? user.rateHistory : [{ date: new Date().toISOString(), rate: user.rate || 1000 }]
  }));
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  syncWithServer();
};

export const getMatches = (): MatchRecord[] => {
  const m = localStorage.getItem(MATCHES_KEY);
  return m ? JSON.parse(m) : [];
};

export const getLogs = (): ActivityLog[] => {
  const l = localStorage.getItem(LOGS_KEY);
  return l ? JSON.parse(l) : [];
};

export const recordAttendance = (userId: string): AttendanceResult => {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, newAchievements: [], newIcons: [], message: 'ユーザーが見つかりません' };
  
  const today = getLocalDateString();
  const last = user.lastAttendance ? getLocalDateString(user.lastAttendance) : null;
  if (today === last) return { success: false, newAchievements: [], newIcons: [], message: '本日はすでに出席済みです' };
  
  user.lastAttendance = new Date().toISOString();
  user.totalPoints += 5;
  user.monthlyPoints += 5;
  user.pointsAttendance = (user.pointsAttendance || 0) + 5;
  user.activityDays += 1;
  
  const res = checkAchievementsAndIcons(user);
  saveUsers(users);
  
  const logs = getLogs();
  logs.unshift({ id: Math.random().toString(36).substr(2, 9), userId, type: ActivityType.ATTENDANCE, points: 5, description: 'Daily Attendance', date: new Date().toISOString() });
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
  
  return { success: true, newAchievements: res.newAchievements, newIcons: res.newIcons, message: '出席を記録しました！ (+5 pt)' };
};

const checkAchievementsAndIcons = (user: User, matchContext?: { isDuelWin: boolean }): { newAchievements: AchievementDef[], newIcons: any[] } => {
  const newAchievements: AchievementDef[] = [];
  const newIcons: any[] = [];
  const achievements = user.achievements || [];
  const unlockedIcons = user.unlockedIcons || [];

  ACHIEVEMENTS_DATA.forEach(ach => {
    if (achievements.includes(ach.id)) return;
    let met = false;
    switch (ach.conditionType) {
      case 'WINS': met = (user.wins || 0) >= ach.threshold; break;
      case 'STREAK': met = (user.currentStreak || 0) >= ach.threshold; break;
      case 'RATE': met = (user.rate || 0) >= ach.threshold; break;
      case 'DAYS': met = (user.activityDays || 0) >= ach.threshold; break;
      case 'MATCHES': met = ((user.wins || 0) + (user.losses || 0) + (user.draws || 0)) >= ach.threshold; break;
      case 'SPECIAL': 
        if (ach.id === 'FACTION_GENERAL') met = !!user.isGeneral;
        if (ach.id === 'DUEL_VICTORY') met = !!matchContext?.isDuelWin;
        break;
    }
    if (met) { user.achievements.push(ach.id); newAchievements.push(ach); }
  });

  ICONS_DATA.forEach(icon => {
      if (icon.type === 'DEFAULT') return;
      if (unlockedIcons.includes(icon.id)) return;
      let met = false;
      switch (icon.type) {
          case 'RATE': met = (user.rate || 0) >= (icon.threshold || 9999); break;
          case 'WINS': met = (user.wins || 0) >= (icon.threshold || 9999); break;
          case 'MATCHES': met = ((user.wins || 0) + (user.losses || 0) + (user.draws || 0)) >= (icon.threshold || 9999); break;
          case 'STREAK': met = (user.currentStreak || 0) >= (icon.threshold || 9999); break;
          case 'DAYS': met = (user.activityDays || 0) >= (icon.threshold || 9999); break;
          case 'SPECIAL':
            if (icon.id === 'SPECIAL_GENERAL') met = !!user.isGeneral;
            if (icon.id === 'SPECIAL_DUEL') met = achievements.includes('DUEL_VICTORY') || !!matchContext?.isDuelWin;
            break;
      }
      if (met) { user.unlockedIcons.push(icon.id); newIcons.push(icon); }
  });
  return { newAchievements, newIcons };
};

export const playSound = (type: any) => {}; 
export const vibrate = (p: any) => {}; 
export const getUserAvatarChar = (u: any) => (u.activeIconId && u.activeIconId !== 'DEFAULT_INITIAL') ? (ICONS_DATA.find(i => i.id === u.activeIconId)?.char || u.name.charAt(0)) : u.name.charAt(0);
export const getUserIconDef = (id: any) => ICONS_DATA.find(i => i.id === id) || ICONS_DATA[0];

/** 対戦記録を処理し、レート・ポイントを計算する */
export const processMatch = (p1Id: string, p2Id: string, result: 'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW'): MatchProcessResult => {
    const users = getUsers();
    const matches = getMatches();
    const settings = getSettings();
    const p1 = users.find(u => u.id === p1Id);
    const p2 = users.find(u => u.id === p2Id);
    if (!p1 || !p2) throw new Error("Users not found");
    
    const isDuel = p1.isGeneral && p2.isGeneral;
    
    // ===== レート計算 (Elo Rating System) =====
    const K_FACTOR = 32; // 変動幅係数
    const rateDiff = p1.rate - p2.rate;
    const expectedP1 = 1 / (1 + Math.pow(10, -rateDiff / 400));
    const expectedP2 = 1 - expectedP1;
    
    let p1Score = 0;
    let p2Score = 0;
    let p1RateChange = 0;
    let p2RateChange = 0;
    
    if (result === 'PLAYER1_WIN') {
        p1Score = 1; p2Score = 0;
        p1RateChange = Math.max(10, Math.round(K_FACTOR * (p1Score - expectedP1)));
        p2RateChange = -2; // 敗者は固定 -2
        p1.wins++; p2.losses++;
        p1.currentStreak++; p2.currentStreak = 0;
        
        // ジャイアントキリング判定（レート差100以上の格上に勝利）
        if (rateDiff <= -100) {
            p1RateChange = Math.round(p1RateChange * 1.5);
        }
    } else if (result === 'PLAYER2_WIN') {
        p1Score = 0; p2Score = 1;
        p1RateChange = -2; // 敗者は固定 -2
        p2RateChange = Math.max(10, Math.round(K_FACTOR * (p2Score - expectedP2)));
        p2.wins++; p1.losses++;
        p2.currentStreak++; p1.currentStreak = 0;
        
        // ジャイアントキリング判定（レート差100以上の格上に勝利）
        if (rateDiff >= 100) {
            p2RateChange = Math.round(p2RateChange * 1.5);
        }
    } else {
        // 引き分け
        p1Score = 0.5; p2Score = 0.5;
        p1RateChange = 5; // 引き分けは固定 +5
        p2RateChange = 5;
        p1.draws++; p2.draws++;
        p1.currentStreak = 0; p2.currentStreak = 0;
    }
    
    // レート更新
    p1.rate += p1RateChange;
    p2.rate += p2RateChange;
    
    // maxStreakの更新
    if (p1.currentStreak > p1.maxStreak) p1.maxStreak = p1.currentStreak;
    if (p2.currentStreak > p2.maxStreak) p2.maxStreak = p2.currentStreak;
    
    // レート履歴に記録
    const now = new Date().toISOString();
    p1.rateHistory.push({ date: now, rate: p1.rate });
    p2.rateHistory.push({ date: now, rate: p2.rate });
    
    // ===== ポイント計算 =====
    const calculatePoints = (user: User, isWinner: boolean, isDraw: boolean, opponentIsNew: boolean): PointBreakdown => {
        let base = 0;
        if (isWinner) base = 10; // 勝利
        else if (isDraw) base = 7; // 引き分け
        else base = 5; // 敗北でもポイント獲得
        
        // 連勝ボーナス
        let streakBonus = 0;
        if (user.currentStreak === 3) streakBonus = 10;
        else if (user.currentStreak === 5) streakBonus = 20;
        else if (user.currentStreak >= 10) streakBonus = 30;
        
        // 新入部員交流ボーナス
        let newMemberBonus = opponentIsNew ? 5 : 0;
        
        // イベント倍率
        let eventMultiplier = 1;
        if (isEventActive()) {
            eventMultiplier = settings.eventMultiplier;
        }
        
        // 連戦補正（スパム防止）
        let spamPenalty = 1.0;
        const recentMatches = matches.filter(m => 
            (m.player1Id === user.id || m.player2Id === user.id) &&
            new Date(m.date).getTime() > Date.now() - (5 * 60 * 1000) // 過去5分以内
        );
        if (recentMatches.length >= 3) spamPenalty = 0.5;
        
        // 合計計算
        let subtotal = (base + streakBonus + newMemberBonus) * eventMultiplier;
        let total = Math.round(subtotal * spamPenalty);
        
        return {
            base,
            streakBonus,
            newMemberBonus,
            eventMultiplier,
            spamPenalty,
            total
        };
    };
    
    const p1PointsDetail = calculatePoints(p1, result === 'PLAYER1_WIN', result === 'DRAW', p2.isNewMember);
    const p2PointsDetail = calculatePoints(p2, result === 'PLAYER2_WIN', result === 'DRAW', p1.isNewMember);
    
    // ポイント更新
    p1.totalPoints += p1PointsDetail.total;
    p1.monthlyPoints += p1PointsDetail.total;
    p1.eventPoints = (p1.eventPoints || 0) + p1PointsDetail.total;
    p1.pointsMatch = (p1.pointsMatch || 0) + p1PointsDetail.total;
    
    p2.totalPoints += p2PointsDetail.total;
    p2.monthlyPoints += p2PointsDetail.total;
    p2.eventPoints = (p2.eventPoints || 0) + p2PointsDetail.total;
    p2.pointsMatch = (p2.pointsMatch || 0) + p2PointsDetail.total;
    
    // 実績とアイコンのチェック
    const isDuelWin1 = isDuel && result === 'PLAYER1_WIN';
    const isDuelWin2 = isDuel && result === 'PLAYER2_WIN';
    const resP1 = checkAchievementsAndIcons(p1, { isDuelWin: isDuelWin1 });
    const resP2 = checkAchievementsAndIcons(p2, { isDuelWin: isDuelWin2 });
    
    // 対戦記録を保存
    const matchRecord: MatchRecord = {
        id: Math.random().toString(36).substr(2, 9),
        date: now,
        player1Id: p1Id,
        player2Id: p2Id,
        result,
        p1RateChange,
        p2RateChange,
        p1PointsEarned: p1PointsDetail.total,
        p2PointsEarned: p2PointsDetail.total,
        isDuel
    };
    
    matches.unshift(matchRecord);
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches.slice(0, 1000))); // 最大1000件まで保持
    
    // ログ記録
    const logs = getLogs();
    if (result === 'PLAYER1_WIN') {
        logs.unshift({
            id: Math.random().toString(36).substr(2, 9),
            userId: p1Id,
            type: ActivityType.MATCH_WIN,
            points: p1PointsDetail.total,
            description: `勝利 vs ${p2.name}`,
            date: now
        });
        logs.unshift({
            id: Math.random().toString(36).substr(2, 9),
            userId: p2Id,
            type: ActivityType.MATCH_LOSS,
            points: p2PointsDetail.total,
            description: `敗北 vs ${p1.name}`,
            date: now
        });
    } else if (result === 'PLAYER2_WIN') {
        logs.unshift({
            id: Math.random().toString(36).substr(2, 9),
            userId: p2Id,
            type: ActivityType.MATCH_WIN,
            points: p2PointsDetail.total,
            description: `勝利 vs ${p1.name}`,
            date: now
        });
        logs.unshift({
            id: Math.random().toString(36).substr(2, 9),
            userId: p1Id,
            type: ActivityType.MATCH_LOSS,
            points: p1PointsDetail.total,
            description: `敗北 vs ${p2.name}`,
            date: now
        });
    } else {
        logs.unshift({
            id: Math.random().toString(36).substr(2, 9),
            userId: p1Id,
            type: ActivityType.MATCH_DRAW,
            points: p1PointsDetail.total,
            description: `引き分け vs ${p2.name}`,
            date: now
        });
        logs.unshift({
            id: Math.random().toString(36).substr(2, 9),
            userId: p2Id,
            type: ActivityType.MATCH_DRAW,
            points: p2PointsDetail.total,
            description: `引き分け vs ${p1.name}`,
            date: now
        });
    }
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 200)));
    
    saveUsers(users);
    
    return {
        p1RateChange,
        p2RateChange,
        p1PointsDetail,
        p2PointsDetail,
        p1PointsEarned: p1PointsDetail.total,
        p2PointsEarned: p2PointsDetail.total,
        newAchievementsP1: resP1.newAchievements,
        newAchievementsP2: resP2.newAchievements,
        newIconsP1: resP1.newIcons,
        newIconsP2: resP2.newIcons,
        isDuel,
        result
    };
};

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

export const updateUserReading = (id: string, reading: string) => {
    const users = getUsers();
    const user = users.find(u => u.id === id);
    if (user) { user.reading = reading; saveUsers(users); }
};

export const parseUserCSV = (csv: string): Partial<User>[] => {
    const lines = csv.split('\n');
    return lines.filter(line => line.trim() !== '').map(line => {
        const [name, reading, isNew] = line.split(',').map(s => s.trim());
        return { name: name || '名称未設定', reading: reading || '', isNewMember: isNew === '1' };
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
        faction: 'WHITE',
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

export const getFactionBalanceSimulation = (users: User[]) => {
    const scoredUsers = users.map(u => ({ ...u, _score: (u.rate * 0.3) + (u.activityDays * 300) })).sort((a, b) => b._score - a._score);
    const red: User[] = []; const white: User[] = []; let rScore = 0, wScore = 0;
    scoredUsers.forEach(u => { if (rScore <= wScore) { red.push(u); rScore += u._score; } else { white.push(u); wScore += u._score; } });
    const stats = (team: User[]) => ({ count: team.length, avgRate: team.length ? Math.round(team.reduce((a, b) => a + b.rate, 0) / team.length) : 0, totalDays: team.reduce((a, b) => a + (b.activityDays || 0), 0), totalScore: Math.round(team.reduce((a, b) => a + ((b.rate * 0.3) + (b.activityDays * 300)), 0)) });
    return { redUsers: red, whiteUsers: white, redStats: stats(red), whiteStats: stats(white) };
};

export const assignGenerals = (redId: string, whiteId: string) => {
    const users = getUsers();
    users.forEach(u => u.isGeneral = false);
    const r = users.find(u => u.id === redId); if(r) r.isGeneral = true;
    const w = users.find(u => u.id === whiteId); if(w) w.isGeneral = true;
    saveUsers(users);
};

export const resetEventPoints = () => { const u = getUsers(); u.forEach(user => user.eventPoints = 0); saveUsers(u); };
export const snapshotSeasonBaseline = () => {};
export const awardSystemTitles = () => {};
export const deleteMatch = (id: any) => {};
export const balanceFactions = (u: any) => u;
export const toggleGeneral = (id: any) => {};
/** ライバル分析: お得意様（最も勝ち越している相手）と天敵（最も負け越している相手）を取得 */
export const getRivalryStats = (userId: string): { bestCustomer: RivalData | null, nemeses: RivalData | null } => {
    const matches = getMatches();
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return { bestCustomer: null, nemeses: null };
    
    // 対戦相手ごとの戦績を集計
    const opponentStats = new Map<string, { wins: number, losses: number, draws: number }>();
    
    matches.forEach(m => {
        let opponentId: string | null = null;
        let isWin = false;
        let isLoss = false;
        let isDraw = false;
        
        if (m.player1Id === userId) {
            opponentId = m.player2Id;
            if (m.result === 'PLAYER1_WIN') isWin = true;
            else if (m.result === 'PLAYER2_WIN') isLoss = true;
            else isDraw = true;
        } else if (m.player2Id === userId) {
            opponentId = m.player1Id;
            if (m.result === 'PLAYER2_WIN') isWin = true;
            else if (m.result === 'PLAYER1_WIN') isLoss = true;
            else isDraw = true;
        }
        
        if (opponentId) {
            const current = opponentStats.get(opponentId) || { wins: 0, losses: 0, draws: 0 };
            if (isWin) current.wins++;
            if (isLoss) current.losses++;
            if (isDraw) current.draws++;
            opponentStats.set(opponentId, current);
        }
    });
    
    // RivalData形式に変換
    const rivalDataList: RivalData[] = [];
    opponentStats.forEach((stats, opponentId) => {
        const opponent = users.find(u => u.id === opponentId);
        if (!opponent) return;
        
        const total = stats.wins + stats.losses + stats.draws;
        if (total < 3) return; // 3回以上対戦した相手のみ
        
        const winRate = total > 0 ? stats.wins / total : 0;
        
        rivalDataList.push({
            opponentId,
            opponentName: opponent.name,
            wins: stats.wins,
            losses: stats.losses,
            draws: stats.draws,
            total,
            winRate
        });
    });
    
    if (rivalDataList.length === 0) return { bestCustomer: null, nemeses: null };
    
    // お得意様: 勝率が最も高い相手
    const bestCustomer = rivalDataList.reduce((best, current) => 
        (current.winRate > best.winRate) ? current : best
    );
    
    // 天敵: 勝率が最も低い相手
    const nemeses = rivalDataList.reduce((worst, current) => 
        (current.winRate < worst.winRate) ? current : worst
    );
    
    return {
        bestCustomer: bestCustomer.winRate >= 0.6 ? bestCustomer : null,
        nemeses: nemeses.winRate <= 0.4 ? nemeses : null
    };
};
export const updateUserTitle = (id: string, t: string | null) => { const u = getUsers(); const user = u.find(x => x.id === id); if(user) { user.activeTitle = t; saveUsers(u); } };
export const updateUserIcon = (id: string, i: string) => { const u = getUsers(); const user = u.find(x => x.id === id); if(user) { user.activeIconId = i; saveUsers(u); } };

/* Fix: Added missing properties to seedData to correctly match the User interface type. */
export const seedData = async () => {
  if (getUsers().length > 0) return;
  const initial = [
    { name: "熱田 望", reading: "あつた のぞむ" }, { name: "池田 大翔", reading: "いけだ ひろと" }, { name: "岩間 悠希", reading: "いわま ゆうき" }, { name: "辻井 琥基", reading: "つじい こうき" },
    { name: "白石 怜大", reading: "しらいし れお" }, { name: "高椋 煌生", reading: "たかむく こうき" }, { name: "布施 皓己", reading: "ふせ こうき" }, { name: "吉井 千智", reading: "よしい ちさと" }
  ];
  saveUsers(initial.map((m, i) => ({ 
    id: `u${100+i}`, 
    name: m.name, 
    reading: m.reading, 
    isNewMember: i < 4, 
    rate: 1000, 
    seasonStartRate: 1000,
    seasonStartPoints: 0,
    faction: i % 2 === 0 ? 'RED' : 'WHITE',
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
    achievements: [], 
    activeTitle: null,
    unlockedIcons: ['DEFAULT_INITIAL', 'DEFAULT_SMILE', 'SHOGI_FU'], 
    activeIconId: 'DEFAULT_INITIAL', 
    avatarColor: 'bg-blue-500', 
    rateHistory: [{ date: new Date().toISOString(), rate: 1000 }] 
  })));
};