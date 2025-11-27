
import React, { useState, useEffect } from 'react';
import { getUsers, getMatches, ACHIEVEMENTS_DATA, updateUserTitle, getRivalryStats, ICONS_DATA, updateUserIcon, getUserAvatarChar, getLogs, getSettings, isEventActive, getUserIconDef, SYSTEM_TITLES } from './storage';
import { User, MatchRecord, IconDef, ActivityLog, ActivityType, EventType, RivalData } from './types';
import { Card } from './Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Award, TrendingUp, Calendar, ArrowLeft, Tag, Star, Crown, Swords, Search, Skull, Smile, Lock, Grid, Shield, List } from 'lucide-react';
import { UserSelector } from './UserSelector';
import { useNavigate } from 'react-router-dom';
import { ShogiPiece } from './ShogiPiece';

// ... (Modal Components same as before, simplified for brevity in this delta, but ensuring Heatmap and Visuals are added) ...

// Title Collection Modal
const TitleCollectionModal: React.FC<{ user: User, onClose: () => void }> = ({ user, onClose }) => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-white/5 bg-slate-800 flex items-center justify-between shrink-0">
                     <h3 className="text-lg font-black text-white flex items-center gap-2">
                         <Award className="text-yellow-500" /> 称号コレクション
                     </h3>
                     <button onClick={onClose} className="p-2 bg-slate-700 text-slate-300 rounded-full hover:bg-slate-600 transition-colors">
                         <ArrowLeft size={20} />
                     </button>
                </div>
                <div className="p-4 overflow-y-auto bg-slate-900 space-y-2">
                    {ACHIEVEMENTS_DATA.map(ach => {
                        const isUnlocked = user.achievements.includes(ach.id);
                        return (
                            <div key={ach.id} className={`p-3 rounded-xl border flex items-center justify-between ${isUnlocked ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-slate-800/50 border-slate-700/50 opacity-60'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isUnlocked ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-500'}`}>
                                        <Award size={20} />
                                    </div>
                                    <div>
                                        <div className={`font-bold ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>{ach.name}</div>
                                        <div className="text-xs text-slate-500">{ach.description}</div>
                                    </div>
                                </div>
                                {isUnlocked ? (
                                    <span className="text-xs font-bold text-green-400 bg-green-900/20 px-2 py-1 rounded">獲得済</span>
                                ) : (
                                    <Lock size={16} className="text-slate-600" />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

// Icon Selector Modal
const IconSelectorModal: React.FC<{
    user: User;
    onClose: () => void;
    onSelect: (iconId: string) => void;
}> = ({ user, onClose, onSelect }) => {
    const categories: {key: string, label: string, icon: React.ReactNode}[] = [
        { key: 'DEFAULT', label: '基本', icon: <Smile size={16}/> },
        { key: 'SHOGI', label: '将棋の駒', icon: <Grid size={16}/> },
        { key: 'CHESS', label: 'チェス駒', icon: <Shield size={16}/> },
        { key: 'SPECIAL', label: 'スペシャル', icon: <Star size={16}/> },
    ];
    const [activeCategory, setActiveCategory] = useState('DEFAULT');

    const displayedIcons = ICONS_DATA.filter(i => {
        if (activeCategory === 'SPECIAL') {
            return i.category === 'SPECIAL' || i.category === 'RANK'; 
        }
        return i.category === activeCategory;
    });

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-white/5 bg-slate-800 flex items-center justify-between shrink-0">
                     <h3 className="text-lg font-black text-white flex items-center gap-2">
                         <Smile className="text-blue-500" /> アイコンコレクション
                     </h3>
                     <button onClick={onClose} className="p-2 bg-slate-700 text-slate-300 rounded-full hover:bg-slate-600 transition-colors">
                         <ArrowLeft size={20} />
                     </button>
                </div>

                <div className="flex bg-slate-950 p-1 shrink-0 gap-1 overflow-x-auto border-b border-white/5">
                    {categories.map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => setActiveCategory(cat.key)}
                            className={`flex-1 py-2 px-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap
                                ${activeCategory === cat.key ? 'bg-slate-800 text-blue-400 shadow-sm border border-white/5' : 'text-slate-500 hover:bg-white/5'}`}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                </div>
                
                <div className="p-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6 overflow-y-auto bg-slate-900">
                    {displayedIcons.map(icon => {
                        const isUnlocked = user.unlockedIcons.includes(icon.id);
                        const isActive = user.activeIconId === icon.id;
                        
                        return (
                            <button
                                key={icon.id}
                                disabled={!isUnlocked}
                                onClick={() => onSelect(icon.id)}
                                className={`
                                    relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all group border-2 p-2
                                    ${isActive 
                                        ? 'bg-blue-900/20 border-blue-500 ring-2 ring-blue-500/30' 
                                        : isUnlocked 
                                            ? 'bg-slate-800 border-slate-700 hover:border-blue-500 hover:shadow-lg hover:-translate-y-1' 
                                            : 'bg-slate-900 border-slate-800 opacity-40 cursor-not-allowed'}
                                `}
                            >
                                <div className={`flex items-center justify-center mb-2 ${isUnlocked ? '' : 'blur-[2px] opacity-30'}`}>
                                    {icon.category === 'SHOGI' ? (
                                        <ShogiPiece char={icon.char} scale={0.6} shadow={false} />
                                    ) : (
                                        <div className="text-3xl text-white font-serif-jp">{icon.char}</div>
                                    )}
                                </div>
                                
                                <div className="text-[10px] font-bold truncate w-full text-center leading-tight text-slate-300">
                                    {icon.name}
                                </div>

                                {!isUnlocked && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 rounded-2xl backdrop-blur-[1px] p-2 text-center z-10 border border-white/5">
                                        <Lock size={16} className="text-slate-500 mb-1" />
                                        <div className="text-[8px] font-bold text-slate-500 leading-tight line-clamp-2">
                                            {icon.conditionDescription}
                                        </div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Activity Heatmap Component
const ActivityHeatmap: React.FC<{ logs: ActivityLog[], userId: string }> = ({ logs, userId }) => {
    // Generate last 90 days
    const days = [];
    for (let i = 89; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }

    const activityCounts: Record<string, number> = {};
    logs.forEach(l => {
        if(l.userId !== userId) return;
        const date = l.date.split('T')[0];
        activityCounts[date] = (activityCounts[date] || 0) + 1;
    });

    const getColor = (count: number) => {
        if (!count) return 'bg-slate-800/50';
        if (count >= 4) return 'bg-green-400';
        if (count >= 2) return 'bg-green-600';
        return 'bg-green-900';
    };

    return (
        <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
            <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-2"><Calendar size={12}/> Activity Heatmap (Last 90 Days)</h4>
            <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
                {days.map(day => (
                    <div 
                        key={day} 
                        className={`w-3 h-3 rounded-sm ${getColor(activityCounts[day])} transition-colors`}
                        title={`${day}: ${activityCounts[day] || 0} activities`}
                    ></div>
                ))}
            </div>
        </div>
    );
};

const Profile: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [rivalStats, setRivalStats] = useState<{bestCustomer: RivalData | null, nemeses: RivalData | null}>({bestCustomer: null, nemeses: null});
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setUsers(getUsers());
    setMatches(getMatches());
    setLogs(getLogs());
  }, []);

  useEffect(() => {
      if (selectedId) {
          setRivalStats(getRivalryStats(selectedId));
      }
  }, [selectedId]);

  const handleTitleChange = (userId: string, titleId: string) => {
    const newTitle = titleId === 'NONE' ? null : titleId;
    updateUserTitle(userId, newTitle);
    setUsers(getUsers()); // Refresh
  };

  const handleIconChange = (iconId: string) => {
      if (!selectedId) return;
      updateUserIcon(selectedId, iconId);
      setUsers(getUsers());
      setIsIconModalOpen(false);
  };

  // View 1: User Selection
  if (!selectedId) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <UserSelector 
            users={users}
            onSelect={(id) => setSelectedId(id)}
            onClose={() => navigate('/')}
            title="プロフィール閲覧（部員を選択）"
            mode="SIMPLE"
        />
      </div>
    );
  }

  // View 2: Detailed Profile
  const user = users.find(u => u.id === selectedId);
  if (!user) return <div>User not found</div>;

  const settings = getSettings();
  const isFactionWar = isEventActive() && settings.eventType === EventType.FACTION_WAR;
  const iconDef = getUserIconDef(user.activeIconId);
  const avatarChar = getUserAvatarChar(user);
  const isRed = user.faction === 'RED';
  
  // System Title Lookups
  const systemTitleDef = user.systemTitle ? SYSTEM_TITLES.find(t => t.id === user.systemTitle) : null;

  // Prepare graph data
  const graphData = user.rateHistory.map(h => ({
    date: new Date(h.date).toLocaleDateString('ja-JP'),
    rate: h.rate
  }));

  // Get recent matches for this user
  const userMatches = matches.filter(m => m.player1Id === user.id || m.player2Id === user.id).slice(0, 10); // Last 10
  
  const getOpponentName = (m: MatchRecord) => {
    const oppId = m.player1Id === user.id ? m.player2Id : m.player1Id;
    return users.find(u => u.id === oppId)?.name || 'Unknown';
  };

  const getMatchResult = (m: MatchRecord) => {
      if (m.result === 'DRAW') return 'DRAW';
      if (m.player1Id === user.id && m.result === 'PLAYER1_WIN') return 'WIN';
      if (m.player2Id === user.id && m.result === 'PLAYER2_WIN') return 'WIN';
      return 'LOSS';
  };

  const unlockedAchievements = ACHIEVEMENTS_DATA.filter(ach => user.achievements.includes(ach.id));
  const maxPoint = Math.max(user.pointsMatch, user.pointsAttendance, user.pointsSpecial, 10);
  const getBarWidth = (val: number) => `${(val / maxPoint) * 100}%`;


  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-20">
      
      {isSelectorOpen && (
          <UserSelector 
            users={users}
            onSelect={(id) => {
                setSelectedId(id);
                setIsSelectorOpen(false);
            }}
            onClose={() => setIsSelectorOpen(false)}
            title="別の部員を選択"
          />
      )}

      {isIconModalOpen && (
          <IconSelectorModal 
            user={user}
            onClose={() => setIsIconModalOpen(false)}
            onSelect={handleIconChange}
          />
      )}

      {isTitleModalOpen && (
          <TitleCollectionModal user={user} onClose={() => setIsTitleModalOpen(false)} />
      )}

      {/* Back Button & Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setSelectedId(null)}
                className="p-2 rounded-full hover:bg-slate-700 transition-colors bg-slate-800 shadow-sm border border-slate-700"
            >
                <ArrowLeft size={24} className="text-slate-300"/>
            </button>
            <h2 className="text-2xl font-bold text-white">個人詳細データ</h2>
        </div>
        <button 
            onClick={() => setIsSelectorOpen(true)}
            className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-sm font-bold text-slate-300 hover:bg-slate-700 transition-colors shadow-sm"
        >
            <Search size={16}/> 他の部員を見る
        </button>
      </div>

      {/* Main Profile Header */}
      <div className={`relative overflow-hidden rounded-3xl bg-slate-900 shadow-xl border ${isFactionWar && isRed ? 'border-red-900/50' : isFactionWar ? 'border-blue-900/50' : systemTitleDef ? 'border-yellow-500/50' : 'border-white/10'}`}>
         {/* Background Gradients */}
         <div className={`absolute inset-0 opacity-20 ${user.avatarColor} bg-gradient-to-br from-white via-transparent to-transparent mix-blend-overlay`}></div>
         {isFactionWar && isRed ? (
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-red-600 to-orange-600 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20"></div>
         ) : isFactionWar ? (
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-blue-600 to-cyan-600 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20"></div>
         ) : systemTitleDef ? (
             <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-yellow-400 to-amber-600 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20 animate-pulse"></div>
         ) : null}

         <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center gap-12">
             
             {/* Avatar Section */}
             <div className="relative group cursor-pointer shrink-0" onClick={() => setIsIconModalOpen(true)}>
                {iconDef.category === 'SHOGI' ? (
                     <div className="transform transition-transform group-hover:scale-105 group-hover:rotate-3 drop-shadow-2xl">
                        <ShogiPiece char={iconDef.char} scale={1.2} />
                     </div>
                ) : (
                    <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full ${user.avatarColor} p-1 shadow-2xl ring-4 ring-slate-800 relative`}>
                        <div className="w-full h-full rounded-full bg-slate-900/50 backdrop-blur-sm flex items-center justify-center text-7xl shadow-inner relative overflow-hidden text-white font-serif-jp">
                            <span className="drop-shadow-md transform group-hover:scale-110 transition-transform duration-300 select-none">
                                {avatarChar}
                            </span>
                        </div>
                    </div>
                )}
                
                {isFactionWar && user.isGeneral && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 animate-bounce">
                        <Crown size={48} className="text-yellow-400 fill-yellow-400 drop-shadow-lg" />
                    </div>
                )}
                
                {systemTitleDef && (
                    <div className="absolute -top-6 -right-6 z-20">
                         <div className="bg-gradient-to-b from-yellow-300 to-yellow-600 text-slate-900 font-black p-2 rounded-lg shadow-lg border-2 border-white rotate-12 text-xs uppercase tracking-widest">
                             {systemTitleDef.english}
                         </div>
                    </div>
                )}
                
                <div className="absolute -bottom-2 -right-2 bg-slate-800 text-white p-2 rounded-full shadow-lg border-2 border-slate-700 group-hover:bg-blue-600 transition-colors z-20">
                    <Smile size={16} />
                </div>
             </div>
             
             {/* Info Section */}
             <div className="flex-1 text-center md:text-left min-w-0 w-full">
                <div className="flex flex-col gap-2 mb-6">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                         {user.activeTitle ? (
                            <span className="px-3 py-1 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-300 rounded-full text-xs font-black shadow-sm flex items-center gap-1 border border-yellow-500/30">
                                <Award size={12} />
                                {ACHIEVEMENTS_DATA.find(a => a.id === user.activeTitle)?.name || user.activeTitle}
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-bold border border-slate-700">
                                称号なし
                            </span>
                        )}
                        {isFactionWar && user.faction && (
                            <span className={`px-3 py-1 rounded-full text-xs font-black border shadow-sm flex items-center gap-1 ${user.faction === 'RED' ? 'bg-red-900/50 text-red-200 border-red-800' : 'bg-slate-800 text-slate-300 border-slate-600'}`}>
                               {user.faction === 'RED' ? '紅組 (Red)' : '白組 (White)'}
                               {user.isGeneral && <Crown size={12} fill="currentColor"/>}
                            </span>
                        )}
                    </div>
                    
                    <h2 className={`font-black text-4xl tracking-tight ${systemTitleDef ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'text-white'}`}>
                        {user.name}
                    </h2>
                    
                    {systemTitleDef && (
                        <div className={`font-serif-jp font-bold text-lg ${systemTitleDef.color} flex items-center justify-center md:justify-start gap-2`}>
                            <Crown size={18} /> {systemTitleDef.name} - {systemTitleDef.description}
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
                    <div className="bg-slate-950/40 backdrop-blur px-6 py-3 rounded-2xl border border-white/10 shadow-sm flex flex-col items-center min-w-[120px]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RATE</span>
                        <span className="text-3xl font-black text-blue-400">{Math.round(user.rate)}</span>
                    </div>
                    <div className="bg-slate-950/40 backdrop-blur px-6 py-3 rounded-2xl border border-white/10 shadow-sm flex flex-col items-center min-w-[120px]">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">POINTS</span>
                         <span className="text-3xl font-black text-amber-500">{user.totalPoints}</span>
                    </div>
                </div>

                {/* Title Selector */}
                <div className="flex items-center justify-center md:justify-start gap-2 bg-slate-800/50 p-2 rounded-lg inline-flex border border-white/5">
                    <Tag size={16} className="text-slate-500 ml-2" />
                    <label className="text-xs font-bold text-slate-400 shrink-0">称号変更:</label>
                    <select 
                        className="p-1 text-sm bg-transparent font-bold text-slate-200 outline-none cursor-pointer"
                        value={user.activeTitle || 'NONE'}
                        onChange={(e) => handleTitleChange(user.id, e.target.value)}
                    >
                        <option value="NONE" className="bg-slate-800">設定なし</option>
                        {unlockedAchievements.map(ach => (
                            <option key={ach.id} value={ach.id} className="bg-slate-800">{ach.name}</option>
                        ))}
                    </select>
                </div>
             </div>
         </div>
      </div>
      
      {/* Activity Heatmap */}
      <ActivityHeatmap logs={logs} userId={user.id} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
             <Card title="戦績データ" icon={<TrendingUp size={18}/>}>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-400">勝率</span>
                        <span className="font-bold text-slate-200">
                            {user.wins + user.losses + user.draws > 0 
                                ? Math.round((user.wins / (user.wins + user.losses + user.draws)) * 100) 
                                : 0}%
                        </span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-400">活動日数</span>
                        <span className="font-bold text-slate-200">{user.activityDays || 0} 日</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-400">現在の連勝</span>
                        <span className="font-bold text-rose-400">{user.currentStreak} 連勝</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-slate-400">最大連勝</span>
                        <span className="font-bold text-slate-200">{user.maxStreak} 連勝</span>
                    </div>
                     <div className="flex justify-between pb-2">
                        <span className="text-slate-400">通算成績</span>
                        <span className="font-bold text-slate-200">{user.wins}勝 {user.losses}敗 {user.draws}分</span>
                    </div>
                </div>
            </Card>

            {/* Rival Analysis Card */}
            {(rivalStats.bestCustomer || rivalStats.nemeses) && (
                <Card title="ライバル分析" icon={<Swords size={18} className="text-purple-400"/>}>
                    <div className="space-y-4">
                        {rivalStats.bestCustomer && (
                            <div className="bg-green-900/20 p-3 rounded-xl border border-green-500/20">
                                <div className="flex items-center gap-2 text-xs font-bold text-green-400 uppercase mb-1">
                                    <Crown size={14} /> お得意様 (最も勝ち越し)
                                </div>
                                <div className="font-bold text-slate-200">{rivalStats.bestCustomer.opponentName}</div>
                                <div className="text-xs text-slate-400">
                                    勝率 {Math.round(rivalStats.bestCustomer.winRate * 100)}% ({rivalStats.bestCustomer.wins}勝 {rivalStats.bestCustomer.losses}敗)
                                </div>
                            </div>
                        )}
                         {rivalStats.nemeses && (
                            <div className="bg-red-900/20 p-3 rounded-xl border border-red-500/20">
                                <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase mb-1">
                                    <Skull size={14} /> 天敵 (最も負け越し)
                                </div>
                                <div className="font-bold text-slate-200">{rivalStats.nemeses.opponentName}</div>
                                <div className="text-xs text-slate-400">
                                    勝率 {Math.round(rivalStats.nemeses.winRate * 100)}% ({rivalStats.nemeses.wins}勝 {rivalStats.nemeses.losses}敗)
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Points Breakdown Chart */}
            <Card title="獲得ポイント内訳" icon={<Star size={18} className="text-amber-500"/>}>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-bold text-slate-400">対局で獲得</span>
                            <span className="font-bold text-slate-200">{user.pointsMatch || 0} pt</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: getBarWidth(user.pointsMatch || 0) }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-bold text-slate-400">出席で獲得</span>
                            <span className="font-bold text-slate-200">{user.pointsAttendance || 0} pt</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: getBarWidth(user.pointsAttendance || 0) }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-bold text-slate-400">特別付与など</span>
                            <span className="font-bold text-slate-200">{user.pointsSpecial || 0} pt</span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: getBarWidth(user.pointsSpecial || 0) }}></div>
                        </div>
                    </div>
                    <div className="pt-2 text-[10px] text-slate-500 text-center border-t border-white/5 mt-2">
                        すべての合計: {user.totalPoints} pt
                    </div>
                </div>
            </Card>

            <Card title="最近のポイント履歴" icon={<Calendar size={18}/>}>
                 <div className="space-y-0">
                    {getLogs().filter(l => l.userId === user.id && l.points > 0).slice(0, 5).length > 0 ? getLogs().filter(l => l.userId === user.id && l.points > 0).slice(0, 5).map(l => (
                        <div key={l.id} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400">
                                    {new Date(l.date).toLocaleString('ja-JP', {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                                </span>
                                <span className="font-bold text-sm text-slate-300">
                                    {l.type === ActivityType.ATTENDANCE ? '出席' : 
                                     l.type === ActivityType.MATCH_WIN ? '対局勝利' :
                                     l.type === ActivityType.MATCH_LOSS ? '対局参加' :
                                     l.type === ActivityType.CONTRIBUTION ? '特別貢献' : 'その他'}
                                </span>
                            </div>
                            <span className="font-bold text-amber-500">+{l.points}</span>
                        </div>
                    )) : (
                        <div className="text-center text-slate-500 text-sm py-4">履歴がありません</div>
                    )}
                 </div>
            </Card>
        </div>

        {/* Main Chart and History */}
        <div className="lg:col-span-2 space-y-6">
            <Card title="レート推移 (実力グラフ)">
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="date" hide />
                            <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={12} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="rate" 
                                stroke="#3b82f6" 
                                strokeWidth={3} 
                                dot={{ r: 4, fill: '#3b82f6' }} 
                                activeDot={{ r: 6 }} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

             <Card title="獲得称号リスト" icon={<Award size={18} />}>
                <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                        {unlockedAchievements.length > 0 ? (
                            unlockedAchievements.map(ach => (
                                <div key={ach.id} className="flex items-center gap-2 p-2 bg-indigo-900/20 rounded-lg border border-indigo-500/20">
                                    <Award size={16} className="text-indigo-400 shrink-0" />
                                    <div>
                                        <div className="text-xs font-bold text-slate-200">{ach.name}</div>
                                        <div className="text-[10px] text-slate-400">{ach.description}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 text-center text-slate-500 py-4 text-sm">
                                まだ称号を獲得していません。<br/>対局や活動を重ねてゲットしよう！
                            </div>
                        )}
                    </div>
                    <button onClick={() => setIsTitleModalOpen(true)} className="w-full mt-2 bg-slate-800 text-slate-300 py-2 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                        <List size={14} /> 全称号リストを確認する (コレクション)
                    </button>
                </div>
            </Card>

            <Card title="最近の対局 (星取表)" icon={<Swords size={18}/>}>
                <div className="flex gap-1 overflow-x-auto pb-4 mb-2 border-b border-white/5">
                    {userMatches.slice().reverse().map((m, i) => {
                         const res = getMatchResult(m);
                         return (
                             <div key={i} title={`${new Date(m.date).toLocaleDateString()} vs ${getOpponentName(m)}`} 
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0
                                ${res === 'WIN' ? 'bg-white text-slate-900 border-2 border-slate-900' : 
                                  res === 'LOSS' ? 'bg-slate-800 text-slate-500' : 'bg-slate-700 text-slate-300 border border-slate-500 border-dashed'}`}
                             >
                                 {res === 'WIN' ? '○' : res === 'LOSS' ? '●' : '△'}
                             </div>
                         )
                    })}
                </div>
                <div className="space-y-0">
                    {userMatches.length > 0 ? userMatches.map(m => {
                         const res = getMatchResult(m);
                         return (
                            <div key={m.id} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                <div>
                                    <div className="font-bold text-sm text-slate-300 flex items-center gap-2">
                                        vs {getOpponentName(m)}
                                        {m.isDuel && <span className="bg-purple-900/30 text-purple-300 text-[10px] px-1.5 py-0.5 rounded font-black border border-purple-500/30">DUEL</span>}
                                    </div>
                                    <div className="text-xs text-slate-500">{new Date(m.date).toLocaleDateString('ja-JP')}</div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    res === 'WIN' ? 'bg-green-900/30 text-green-400' : 
                                    res === 'LOSS' ? 'bg-red-900/30 text-red-400' : 'bg-slate-800 text-slate-400'
                                }`}>
                                    {res === 'WIN' ? '勝ち' : res === 'LOSS' ? '負け' : '引分'}
                                </div>
                            </div>
                         );
                    }) : (
                        <div className="text-center text-slate-500 text-sm py-4">記録がありません</div>
                    )}
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
