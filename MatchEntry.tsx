

import React, { useState, useEffect } from 'react';
import { getUsers, processMatch, getSettings, getUserAvatarChar, playSound, vibrate, isEventActive } from './storage';
import { User, MatchProcessResult, AchievementDef, PointBreakdown, IconDef, EventType } from './types';
import { NumPad } from './NumPad';
import { Trophy, Minus, TrendingUp, Star, Search, User as UserIcon, Crown, Flame, Snowflake, Swords } from 'lucide-react';
import { AchievementPopup } from './AchievementPopup';
import { UserSelector } from './UserSelector';

// Declare confetti global
declare const confetti: any;

interface AchievementItem {
  achievement: AchievementDef;
  playerName?: string;
}

const MatchEntry: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [result, setResult] = useState<'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW' | null>(null);
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{p1Name: string, p2Name: string, record: MatchProcessResult, p1Faction?: string, p2Faction?: string} | null>(null);
  const [newAchievements, setNewAchievements] = useState<AchievementItem[]>([]);
  
  // Modal State
  const [modalTarget, setModalTarget] = useState<'p1' | 'p2' | null>(null);

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  const triggerConfetti = (colors?: string[]) => {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 },
            colors: colors || ['#EF4444', '#3B82F6', '#FBBF24', '#10B981'],
            gravity: 0.8,
            scalar: 1.2,
        });
    }
  };

  const handleSelection = (target: 'p1' | 'p2') => {
      playSound('CLICK');
      vibrate(10);
      setModalTarget(target);
  }

  const handleResultSelect = (res: 'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW' | null) => {
      playSound('CLICK');
      vibrate(20);
      setResult(res);
  }

  const handleSubmit = () => {
    playSound('CLICK');
    vibrate(10);
    const settings = getSettings();
    if (pin !== settings.adminPin) {
      playSound('ERROR');
      vibrate([50, 50, 50]);
      alert('管理者PINが間違っています');
      setPin('');
      return;
    }
    if (!p1 || !p2 || !result) {
      playSound('ERROR');
      alert('すべての項目を入力してください');
      return;
    }
    if (p1 === p2) {
        playSound('ERROR');
        alert('自分自身とは対戦できません');
        return;
    }

    setIsSubmitting(true);
    try {
      const record = processMatch(p1, p2, result);
      
      const p1User = users.find(u => u.id === p1);
      const p2User = users.find(u => u.id === p2);
      const p1Name = p1User?.name || '';
      const p2Name = p2User?.name || '';

      setSuccessData({
        p1Name,
        p2Name,
        record,
        p1Faction: p1User?.faction,
        p2Faction: p2User?.faction
      });

      // Collect new achievements with names
      const earned: AchievementItem[] = [
          ...record.newAchievementsP1.map(a => ({ achievement: a, playerName: p1Name })),
          ...record.newAchievementsP2.map(a => ({ achievement: a, playerName: p2Name }))
      ];
      
      if (earned.length > 0) {
          setTimeout(() => playSound('FANFARE'), 500);
          setNewAchievements(earned);
      } else {
          // Play different sound based on win/draw
          if (result === 'DRAW') playSound('SUCCESS');
          else playSound('WIN'); // Using Taiko for win
      }

      // Effect
      if (result !== 'DRAW') {
          // Determine winner faction for confetti
          const winnerFaction = result === 'PLAYER1_WIN' ? p1User?.faction : p2User?.faction;
          let confettiColors = undefined;
          
          if (isEventActive() && settings.eventType === EventType.FACTION_WAR) {
              if (winnerFaction === 'RED') confettiColors = ['#ef4444', '#b91c1c', '#f87171', '#ffffff'];
              else if (winnerFaction === 'WHITE') confettiColors = ['#3b82f6', '#1d4ed8', '#60a5fa', '#ffffff'];
          }
          
          triggerConfetti(confettiColors);
      }

      vibrate([50, 50, 100]);

      // Reset Form
      setP1('');
      setP2('');
      setResult(null);
      setPin('');
    } catch (e: any) {
      console.error(e);
      playSound('ERROR');
      alert(e.message || '対戦処理中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const BreakdownItem: React.FC<{ label: string, value: number, isPenalty?: boolean }> = ({ label, value, isPenalty }) => {
    if (value === 0) return null;
    return (
      <div className={`flex justify-between text-xs ${isPenalty ? 'text-red-400' : 'text-white/70'}`}>
        <span>{label}</span>
        <span className="font-bold">{value > 0 ? '+' : ''}{value}</span>
      </div>
    );
  };

  const PlayerResultCard: React.FC<{ 
    name: string, 
    label: string, 
    rateChange: number, 
    pointTotal: number,
    pointDetail: PointBreakdown,
    isWinner: boolean,
    isDraw: boolean,
    faction?: string
  }> = ({ name, label, rateChange, pointTotal, pointDetail, isWinner, isDraw, faction }) => {
    const isFactionWar = isEventActive() && getSettings().eventType === EventType.FACTION_WAR;
    
    // Determine card styles based on winner/loser/draw and faction
    let bgStyle = 'bg-slate-800/80 border-slate-700';
    
    if (isWinner) {
        if (isFactionWar && faction === 'RED') {
            bgStyle = 'bg-gradient-to-br from-red-900/90 to-red-800/90 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] scale-105 z-10';
        } else if (isFactionWar && faction === 'WHITE') {
            bgStyle = 'bg-gradient-to-br from-blue-900/90 to-blue-800/90 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)] scale-105 z-10';
        } else {
            bgStyle = 'bg-gradient-to-br from-yellow-600/20 to-amber-900/40 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)] scale-105 z-10';
        }
    } else if (isDraw) {
        bgStyle = 'bg-slate-800 border-slate-600 opacity-90';
    } else {
        bgStyle = 'bg-slate-900/50 border-slate-800 opacity-60 grayscale scale-95';
    }

    return (
    <div className={`flex-1 relative p-6 rounded-3xl border transition-all duration-500 ${bgStyle} animate-pop-in flex flex-col justify-between`}>
        
        {isWinner && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                <Crown size={40} className="text-yellow-400 fill-yellow-400 animate-bounce drop-shadow-lg" />
            </div>
        )}

        <div>
            <div className="flex justify-between items-center mb-2">
                <div className="bg-black/30 text-white/80 text-[10px] font-bold px-3 py-1 rounded-full uppercase border border-white/10">
                    {label}
                </div>
                {isFactionWar && faction && (
                    <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${faction === 'RED' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
                        {faction}
                    </div>
                )}
            </div>
            
            <div className="font-black text-2xl text-white mb-6 text-center drop-shadow-md truncate font-serif-jp">
                {name}
            </div>
        </div>
        
        <div className="space-y-4">
            {/* Rate Section */}
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-blue-200 uppercase flex items-center gap-1 opacity-80">
                        <TrendingUp size={12}/> RATE CHANGE
                    </span>
                </div>
                <div className="text-center">
                    <span className="text-4xl font-black text-white drop-shadow-sm">+{rateChange}</span>
                </div>
                {pointDetail.spamPenalty < 1 && (
                     <div className="text-[10px] text-center text-red-400 font-bold mt-1">連戦補正あり (x{pointDetail.spamPenalty})</div>
                )}
            </div>

            {/* Points Section */}
            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                 <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-200 uppercase flex items-center gap-1 opacity-80">
                        <Star size={12}/> POINTS
                    </span>
                </div>
                <div className="text-center mb-2">
                    <span className="text-4xl font-black text-amber-400 drop-shadow-sm">+{pointTotal}</span>
                </div>
                
                {/* Breakdown */}
                <div className="border-t border-white/10 pt-2 space-y-1">
                    <BreakdownItem label="基本ポイント" value={pointDetail.base} />
                    <BreakdownItem label="連勝ボーナス" value={pointDetail.streakBonus} />
                    <BreakdownItem label="新入部員交流" value={pointDetail.newMemberBonus} />
                    {pointDetail.eventMultiplier > 1 && (
                        <div className="text-[10px] text-center text-yellow-300 font-bold animate-pulse mt-1">EVENT BONUS x{pointDetail.eventMultiplier} APPLIED!</div>
                    )}
                </div>
            </div>
        </div>
    </div>
  )};

  // --------------------------------------------------------------------------------
  // SUCCESS VIEW - FLASHY RESULT SCREEN (SONG PROGRAM STYLE)
  // --------------------------------------------------------------------------------
  if (successData) {
    const isFactionWar = isEventActive() && getSettings().eventType === EventType.FACTION_WAR;
    
    // Logic to determine winner for display
    const p1Won = successData.record.result === 'PLAYER1_WIN';
    const p2Won = successData.record.result === 'PLAYER2_WIN';
    const isDraw = successData.record.result === 'DRAW';
    
    let themeGradient = "from-slate-900 via-slate-800 to-slate-900";
    
    if (isFactionWar && !isDraw) {
        const winningFaction = p1Won ? successData.p1Faction : successData.p2Faction;
        if (winningFaction === 'RED') themeGradient = "from-red-950 via-red-900 to-black";
        if (winningFaction === 'WHITE') themeGradient = "from-blue-950 via-blue-900 to-black";
    }

    return (
      <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br ${themeGradient} text-white animate-in fade-in duration-500 overflow-y-auto py-8`}>
        
        {/* Dynamic Background Spotlights & Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
             {/* Japanese Pattern Overlay */}
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/seigaiha.png')] opacity-10"></div>
             
             {/* Rotating Light Beams */}
             <div className="absolute top-[-50%] left-[-20%] w-[100%] h-[200%] bg-white/5 rotate-[30deg] animate-[spin_20s_linear_infinite] opacity-30 blur-3xl"></div>
             <div className="absolute top-[-50%] right-[-20%] w-[100%] h-[200%] bg-white/5 rotate-[-30deg] animate-[spin_25s_linear_infinite_reverse] opacity-30 blur-3xl"></div>

             {/* Winner Spotlight (Center) */}
             {!isDraw && (
                 <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[100px] animate-pulse opacity-40 ${
                     isFactionWar && (p1Won ? successData.p1Faction : successData.p2Faction) === 'RED' ? 'bg-red-500' : 
                     isFactionWar && (p1Won ? successData.p1Faction : successData.p2Faction) === 'WHITE' ? 'bg-blue-500' : 'bg-yellow-500'
                 }`}></div>
             )}
        </div>

        <AchievementPopup items={newAchievements} onClose={() => setNewAchievements([])} />
        
        <div className="relative z-10 w-full max-w-6xl px-4 flex flex-col items-center">
            
            {/* Header / Winner Announcement (Song Program Style) */}
            <div className="mb-12 text-center animate-in zoom-in slide-in-from-bottom-4 duration-700">
                {isDraw ? (
                     <h2 className="text-6xl md:text-8xl font-black text-slate-300 tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] uppercase italic font-serif-jp">
                         引き分け
                     </h2>
                ) : (
                    <>
                        <div className="flex items-center justify-center gap-4 mb-4">
                             <Trophy size={56} className="text-yellow-400 fill-yellow-400 animate-bounce drop-shadow-lg" />
                             {isFactionWar && (p1Won ? successData.p1Faction : successData.p2Faction) === 'RED' && <Flame size={56} className="text-red-500 fill-red-500 animate-pulse"/>}
                             {isFactionWar && (p1Won ? successData.p1Faction : successData.p2Faction) === 'WHITE' && <Snowflake size={56} className="text-blue-500 fill-blue-500 animate-pulse"/>}
                        </div>
                        
                        {/* Huge Typography */}
                        <h2 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-300 to-amber-600 tracking-tighter drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] uppercase italic transform -skew-x-12 leading-none pb-4">
                            WINNER!
                        </h2>
                        
                        {/* Faction Victory Banner */}
                        {isFactionWar && (
                            <div className={`text-3xl md:text-4xl font-black tracking-[0.3em] uppercase mt-4 animate-pulse px-8 py-2 border-y-4 bg-black/30 backdrop-blur-md transform skew-x-[-12deg] inline-block ${
                                (p1Won ? successData.p1Faction : successData.p2Faction) === 'RED' ? 'text-red-500 border-red-500' : 'text-blue-400 border-blue-500'
                            }`}>
                                {(p1Won ? successData.p1Faction : successData.p2Faction) === 'RED' ? '紅組 勝利' : '白組 勝利'}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Cards Container */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-center relative">
                 {/* VS Badge in Center */}
                 <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-24 h-24 bg-slate-900 rounded-full items-center justify-center border-4 border-slate-700 shadow-2xl">
                     <span className="font-black text-3xl italic text-slate-500 font-serif-jp">VS</span>
                 </div>

                 <PlayerResultCard 
                    name={successData.p1Name} 
                    label="Player 1" 
                    rateChange={successData.record.p1RateChange}
                    pointTotal={successData.record.p1PointsEarned}
                    pointDetail={successData.record.p1PointsDetail}
                    isWinner={p1Won}
                    isDraw={isDraw}
                    faction={successData.p1Faction}
                 />

                 <PlayerResultCard 
                    name={successData.p2Name} 
                    label="Player 2" 
                    rateChange={successData.record.p2RateChange}
                    pointTotal={successData.record.p2PointsEarned}
                    pointDetail={successData.record.p2PointsDetail}
                    isWinner={p2Won}
                    isDraw={isDraw}
                    faction={successData.p2Faction}
                 />
            </div>
          
            <button 
                onClick={() => setSuccessData(null)}
                className="mt-16 bg-white text-slate-900 px-16 py-5 rounded-full font-black text-2xl hover:bg-slate-200 active:scale-95 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)] animate-pulse uppercase tracking-widest"
            >
                次の対戦へ
            </button>
        </div>
      </div>
    );
  }

  // Helper for avatar
  const getAvatar = (userId: string) => {
      const u = users.find(user => user.id === userId);
      if (!u) return null;
      const avatarChar = getUserAvatarChar(u);

      return (
        <div className="flex flex-col items-center animate-pop-in">
          <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full ${u.avatarColor} p-1 shadow-lg border-4 border-slate-700 mb-3`}>
              <div className="w-full h-full rounded-full bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center text-4xl md:text-5xl text-white font-serif-jp">
                  {avatarChar}
              </div>
          </div>
          <div className="font-bold text-lg text-white">{u.name}</div>
          <div className="font-mono text-sm text-slate-400">Rate: {Math.round(u.rate)}</div>
        </div>
      );
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {modalTarget && (
          <UserSelector 
            users={users}
            onSelect={(id) => {
                if (modalTarget === 'p1') setP1(id);
                else setP2(id);
                setModalTarget(null);
                playSound('CLICK');
            }}
            onClose={() => setModalTarget(null)}
            excludeIds={modalTarget === 'p1' ? (p2 ? [p2] : []) : (p1 ? [p1] : [])}
            mode="MATCH_SELECT"
            title={modalTarget === 'p1' ? 'Player 1 を選択' : 'Player 2 を選択'}
          />
      )}

      <div className="mb-8 text-center">
        <h2 className="text-4xl font-black text-white tracking-tight uppercase flex items-center justify-center gap-3">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Versus</span> Mode
        </h2>
        <p className="text-slate-400 font-medium">対戦結果を入力してください</p>
      </div>

      {/* VS Screen Layout */}
      <div className="relative">
        {/* Background VS Text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[200px] font-black text-white/5 select-none pointer-events-none italic font-serif-jp">VS</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12 relative z-10">
            
            {/* Player 1 Card */}
            <div 
                onClick={() => handleSelection('p1')}
                className={`
                    relative p-6 rounded-[2rem] border-4 transition-all duration-300 cursor-pointer group min-h-[280px] flex flex-col justify-center
                    ${result === 'PLAYER1_WIN' ? 'bg-red-950/30 border-red-500 shadow-xl shadow-red-500/20 scale-105 z-20 backdrop-blur-md' : 
                      result === 'DRAW' ? 'bg-slate-800/50 border-slate-600 opacity-80 backdrop-blur-md' :
                      result === 'PLAYER2_WIN' ? 'bg-slate-900/50 border-slate-800 opacity-60 grayscale blur-[1px]' :
                      'bg-slate-800/50 border-slate-700 hover:border-red-400 hover:shadow-lg backdrop-blur-md'
                    }
                `}
            >
                <div className="absolute -top-4 left-6 bg-red-600 text-white px-4 py-1 rounded-full font-black tracking-wider shadow-md uppercase text-sm flex items-center gap-2 border border-red-400">
                    Player 1 <Search size={14} className="opacity-70"/>
                </div>
                <div className="flex flex-col items-center py-6">
                    {p1 ? getAvatar(p1) : (
                        <div className="flex flex-col items-center text-slate-500 group-hover:text-red-400 transition-colors">
                            <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border-2 border-slate-700 border-dashed">
                                <UserIcon size={40}/>
                            </div>
                            <div className="font-bold text-lg">タップして選択</div>
                        </div>
                    )}

                    {p1 && result !== 'PLAYER1_WIN' && result !== 'DRAW' && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleResultSelect('PLAYER1_WIN'); }}
                            className="mt-6 px-8 py-3 bg-red-600 text-white rounded-full font-black shadow-lg hover:bg-red-500 active:scale-95 transition-all uppercase tracking-wider border border-red-400"
                        >
                            Winner
                        </button>
                    )}
                    {result === 'PLAYER1_WIN' && <div className="mt-6 text-red-500 font-black text-2xl uppercase tracking-widest animate-pulse drop-shadow-md">Victory</div>}
                </div>
            </div>

            {/* Center VS Badge */}
            <div className="md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-30 flex justify-center my-4 md:my-0">
                <div className="bg-slate-900 text-white w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl border-4 border-slate-700 shadow-xl italic font-serif-jp">
                    VS
                </div>
            </div>

            {/* Player 2 Card */}
            <div 
                 onClick={() => handleSelection('p2')}
                 className={`
                    relative p-6 rounded-[2rem] border-4 transition-all duration-300 cursor-pointer group min-h-[280px] flex flex-col justify-center
                    ${result === 'PLAYER2_WIN' ? 'bg-blue-950/30 border-blue-500 shadow-xl shadow-blue-500/20 scale-105 z-20 backdrop-blur-md' : 
                      result === 'DRAW' ? 'bg-slate-800/50 border-slate-600 opacity-80 backdrop-blur-md' :
                      result === 'PLAYER1_WIN' ? 'bg-slate-900/50 border-slate-800 opacity-60 grayscale blur-[1px]' :
                      'bg-slate-800/50 border-slate-700 hover:border-blue-400 hover:shadow-lg backdrop-blur-md'
                    }
                `}
            >
                <div className="absolute -top-4 right-6 bg-blue-600 text-white px-4 py-1 rounded-full font-black tracking-wider shadow-md uppercase text-sm flex items-center gap-2 border border-blue-400">
                     <Search size={14} className="opacity-70"/> Player 2
                </div>
                <div className="flex flex-col items-center py-6">
                    {p2 ? getAvatar(p2) : (
                        <div className="flex flex-col items-center text-slate-500 group-hover:text-blue-400 transition-colors">
                             <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-4 border-2 border-slate-700 border-dashed">
                                <UserIcon size={40}/>
                            </div>
                            <div className="font-bold text-lg">タップして選択</div>
                        </div>
                    )}

                    {p2 && result !== 'PLAYER2_WIN' && result !== 'DRAW' && (
                        <button 
                             onClick={(e) => { e.stopPropagation(); handleResultSelect('PLAYER2_WIN'); }}
                            className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-full font-black shadow-lg hover:bg-blue-500 active:scale-95 transition-all uppercase tracking-wider border border-blue-400"
                        >
                            Winner
                        </button>
                    )}
                     {result === 'PLAYER2_WIN' && <div className="mt-6 text-blue-500 font-black text-2xl uppercase tracking-widest animate-pulse drop-shadow-md">Victory</div>}
                </div>
            </div>
        </div>

        {/* Draw Button Area */}
        <div className="flex justify-center mt-8">
             <button 
                onClick={() => handleResultSelect(result === 'DRAW' ? null : 'DRAW')}
                className={`px-8 py-3 rounded-full font-bold border-2 transition-all active:scale-95 flex items-center gap-2 ${
                    result === 'DRAW' 
                    ? 'bg-slate-700 text-white border-slate-600 shadow-lg' 
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
            >
                <Minus size={20}/> 引き分け (Draw)
            </button>
        </div>

        {/* Confirmation Area */}
        <div className={`mt-8 transition-all duration-500 ${p1 && p2 && result ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 grayscale pointer-events-none'}`}>
             <div className="bg-slate-800/80 p-6 rounded-3xl border border-white/10 shadow-xl max-w-xl mx-auto backdrop-blur-md">
                 <div className="flex flex-col gap-4">
                     <div>
                         <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase">Admin PIN</label>
                            <div className="text-xs font-mono bg-slate-900 px-2 rounded text-slate-500 border border-slate-700">入力</div>
                         </div>
                        <input 
                            type="password" 
                            value={pin}
                            readOnly
                            placeholder="PIN"
                            className="w-full p-3 rounded-xl border border-slate-600 bg-slate-900 font-mono text-lg text-white text-center tracking-widest cursor-default outline-none"
                            maxLength={4}
                        />
                        <NumPad value={pin} onChange={(v) => { playSound('CLICK'); setPin(v); }} maxLength={4} />
                     </div>

                     <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting || !p1 || !p2 || !result || pin.length < 4}
                        className="w-full h-[60px] bg-white hover:bg-slate-200 text-slate-900 rounded-xl font-black text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                    >
                        {isSubmitting ? 'Processing...' : '記録する'}
                    </button>
                 </div>
             </div>
        </div>

      </div>
    </div>
  );
};

export default MatchEntry;