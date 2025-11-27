
import React, { useState, useEffect } from 'react';
import { getUsers, saveUsers, getSettings, saveSettings, manualPointAdjustment, resetMonthly, isEventActive, exportData, importData, getMatches, deleteMatch, balanceFactions, toggleGeneral, assignGenerals, resetEventPoints, getFactionBalanceSimulation, awardSystemTitles } from './storage';
import { User, SystemSettings, MatchRecord, Season, EventType } from './types';
import { Card } from './Card';
import { NumPad } from './NumPad';
import { Settings, Trash2, Plus, ToggleLeft, ToggleRight, Calendar, Download, Copy, ClipboardCheck, History, CheckCircle, AlertCircle, Shuffle, Users, Crown, ChevronRight, X, UserCheck } from 'lucide-react';
import { UserSelector } from './UserSelector';

const Admin: React.FC = () => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(getSettings());
  const [users, setUsers] = useState<User[]>([]);
  const [activeEvent, setActiveEvent] = useState(false);
  const [recentMatches, setRecentMatches] = useState<MatchRecord[]>([]);
  
  // Event Wizard State
  const [isEventWizardOpen, setIsEventWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1); // 1: Config, 2: Balance/Check, 3: Generals
  
  // Wizard Data
  const [wName, setWName] = useState('');
  const [wDuration, setWDuration] = useState(7);
  const [wType, setWType] = useState<EventType>(EventType.STANDARD);
  const [wRedGeneral, setWRedGeneral] = useState<string | null>(null);
  const [wWhiteGeneral, setWWhiteGeneral] = useState<string | null>(null);
  const [wSelectingTarget, setWSelectingTarget] = useState<'RED' | 'WHITE' | null>(null);
  
  // Balance Simulation Data
  const [wSimData, setWSimData] = useState<ReturnType<typeof getFactionBalanceSimulation> | null>(null);

  // New User Form
  const [newName, setNewName] = useState('');
  
  // Point Adjustment
  const [adjUser, setAdjUser] = useState('');
  const [adjPoints, setAdjPoints] = useState(10);
  const [adjReason, setAdjReason] = useState('部室掃除');
  const [isPointProcessing, setIsPointProcessing] = useState(false);
  const [pointSuccessMsg, setPointSuccessMsg] = useState<string | null>(null);

  // Backup Text State
  const [backupText, setBackupText] = useState('');
  const [showBackupArea, setShowBackupArea] = useState(false);

  useEffect(() => {
      refreshData();
  }, []);

  const handleLogin = () => {
    if (pin === settings.adminPin) {
      setIsAuthenticated(true);
      refreshData();
    } else {
      alert('PINが違います');
      setPin('');
    }
  };

  const refreshData = () => {
    setUsers(getUsers());
    const s = getSettings();
    setSettings(s);
    setActiveEvent(isEventActive());
    setRecentMatches(getMatches().slice(0, 20)); // Get last 20
  };

  const handleAddUser = () => {
    if (!newName.trim()) return;
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName,
      isNewMember: true,
      rate: 1000,
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
    };
    const updated = [...users, newUser];
    saveUsers(updated);
    setNewName('');
    refreshData();
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('本当に削除しますか？この操作は取り消せません。')) {
      const updated = users.filter(u => u.id !== id);
      saveUsers(updated);
      refreshData();
    }
  };

  const toggleNewMember = (id: string) => {
      const updated = users.map(u => {
          if (u.id === id) return { ...u, isNewMember: !u.isNewMember };
          return u;
      });
      saveUsers(updated);
      refreshData();
  };

  const handleUpdateTitles = () => {
      if (window.confirm('現在のデータに基づいて、四大タイトル（名人・新星・活動家・下克上）を更新しますか？')) {
          awardSystemTitles();
          refreshData();
          alert('タイトルを更新しました！');
      }
  }

  // --- WIZARD HANDLERS ---
  const openEventWizard = () => {
      if (settings.eventName) setWName(settings.eventName); // Prefill if exists
      else setWName('');
      setWType(EventType.STANDARD);
      setWDuration(7);
      setWRedGeneral(null);
      setWWhiteGeneral(null);
      setWSimData(null);
      setWizardStep(1);
      setIsEventWizardOpen(true);
  }

  const finishEventSetup = () => {
      // Validate Faction War logic
      if (wType === EventType.FACTION_WAR) {
          if (!wRedGeneral || !wWhiteGeneral) {
              alert('紅組・白組それぞれの大将を決定してください');
              return;
          }
          if (wRedGeneral === wWhiteGeneral) {
              alert('同一人物を両方の大将にすることはできません');
              return;
          }
          assignGenerals(wRedGeneral, wWhiteGeneral);
      }

      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + wDuration);
      
      const newSettings: SystemSettings = {
          ...settings,
          eventName: wName,
          eventEndsAt: endsAt.toISOString(),
          eventType: wType
      };
      
      // Reset event-specific points for all users when starting new event
      resetEventPoints();

      saveSettings(newSettings);
      refreshData();
      setIsEventWizardOpen(false);
      alert('イベントを開始しました！\nイベントポイントはリセットされました。');
  };

  const handleWizardNext = () => {
      if (wizardStep === 1) {
          if (!wName) { alert('イベント名を入力してください'); return; }
          if (wType === EventType.FACTION_WAR) {
              // Run simulation on transition to step 2
              setWSimData(getFactionBalanceSimulation(users));
              setWizardStep(2); 
          } else {
              finishEventSetup(); // Standard event just starts
          }
      } else if (wizardStep === 2) {
           setWizardStep(3); // Go to generals
      } else if (wizardStep === 3) {
          finishEventSetup();
      }
  }

  const handleWizardBalanceApply = () => {
      if (window.confirm('この編成を適用しますか？\n(現在のチーム設定は上書きされます)')) {
          const balanced = balanceFactions(users);
          saveUsers(balanced);
          setUsers(balanced); 
          refreshData(); 
          setWizardStep(3); // Move to next step
      }
  }

  const handleGeneralSelect = (id: string) => {
      if (wSelectingTarget === 'RED') setWRedGeneral(id);
      else if (wSelectingTarget === 'WHITE') setWWhiteGeneral(id);
      setWSelectingTarget(null);
  }
  // -------------------------

  const handleStopEvent = () => {
      if (window.confirm('開催中のイベントを強制終了しますか？')) {
        const newSettings: SystemSettings = {
            ...settings,
            eventEndsAt: null,
        };
        saveSettings(newSettings);
        refreshData();
      }
  };

  const handleGivePoints = () => {
    if (!adjUser) return;
    
    setIsPointProcessing(true);
    manualPointAdjustment(adjUser, adjPoints, adjReason);
    setPointSuccessMsg(`${adjPoints}ポイントを付与しました (完了)`);
    
    refreshData();

    setTimeout(() => {
        setIsPointProcessing(false);
        setPointSuccessMsg(null);
    }, 3000);
  };

  const handleResetMonthly = () => {
      if (window.confirm('今月のランキングをリセットしますか？（表示上の月間ポイントが0になります）')) {
          resetMonthly();
          refreshData();
          alert('月間ランキングをリセットしました');
      }
  }

  const handleDeleteMatch = (matchId: string) => {
      if (window.confirm('この対戦記録を取り消しますか？\nレートとポイントの変動も元に戻ります。')) {
          try {
              deleteMatch(matchId);
              refreshData();
              alert('対戦を取り消しました');
          } catch(e) {
              alert('取り消しに失敗しました');
          }
      }
  }

  // --- New Text-Based Backup Handlers ---
  const handleGenerateBackup = () => {
      const json = exportData();
      setBackupText(json);
      setShowBackupArea(true);
  };

  const handleRestoreBackup = () => {
      if (!backupText) return;
      if (window.confirm('入力されたデータで復元しますか？現在のデータはすべて上書きされます。')) {
          if (importData(backupText)) {
              alert('復元に成功しました。ページをリロードします。');
              window.location.reload();
          } else {
              alert('データの形式が正しくありません。');
          }
      }
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(backupText);
      alert('クリップボードにコピーしました');
  };

  const getPlayerName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="glass-panel-dark w-full max-w-md p-8 text-center space-y-6 animate-in zoom-in duration-300 rounded-3xl shadow-2xl border border-white/10">
          <Settings className="mx-auto text-slate-500" size={48} />
          <h2 className="text-2xl font-bold text-white">管理者ログイン</h2>
          <div>
             <input type="password" value={pin} readOnly placeholder="PIN" className="w-full p-4 border border-slate-700 rounded-xl text-center text-2xl tracking-[1em] outline-none bg-slate-900 text-white font-mono focus:ring-2 focus:ring-blue-500 cursor-default" />
             <NumPad value={pin} onChange={setPin} maxLength={4} />
          </div>
          <button onClick={handleLogin} disabled={pin.length < 4} className="w-full bg-slate-200 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 py-3 rounded-xl font-bold active:scale-95 transition-transform shadow-lg">ログイン</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      
      {/* --- EVENT SETUP WIZARD MODAL --- */}
      {isEventWizardOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10">
                  {/* Header */}
                  <div className="bg-slate-950 text-white p-6 shrink-0 flex justify-between items-center border-b border-white/10">
                      <div>
                        <h3 className="text-xl font-black flex items-center gap-2"><Calendar /> イベントセットアップ</h3>
                        <div className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">
                            Step {wizardStep} / {wType === EventType.FACTION_WAR ? 3 : 1}
                        </div>
                      </div>
                      <button onClick={() => setIsEventWizardOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><X /></button>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 overflow-y-auto flex-1">
                      {wizardStep === 1 && (
                          <div className="space-y-6">
                              <div>
                                  <label className="block text-sm font-bold text-slate-400 mb-2">イベント名</label>
                                  <input type="text" value={wName} onChange={e => setWName(e.target.value)} className="w-full p-3 border border-slate-700 rounded-xl font-bold text-lg bg-slate-800 text-white" placeholder="例: 紅白対抗戦 2024" />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-400 mb-2">イベントタイプ</label>
                                  <div className="grid grid-cols-2 gap-4">
                                      <button onClick={() => setWType(EventType.STANDARD)} className={`p-4 rounded-xl border text-left transition-all ${wType === EventType.STANDARD ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700 hover:bg-slate-800'}`}>
                                          <div className="font-bold text-slate-200">通常強化</div>
                                          <div className="text-xs text-slate-500 mt-1">ポイント倍率UPのみ</div>
                                      </button>
                                      <button onClick={() => setWType(EventType.FACTION_WAR)} className={`p-4 rounded-xl border text-left transition-all ${wType === EventType.FACTION_WAR ? 'border-red-500 bg-red-900/20' : 'border-slate-700 hover:bg-slate-800'}`}>
                                          <div className="font-bold text-red-400">紅白戦</div>
                                          <div className="text-xs text-slate-500 mt-1">チーム戦 & 大将選出</div>
                                      </button>
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-400 mb-2">期間</label>
                                  <div className="flex items-center gap-2">
                                    <input type="number" value={wDuration} onChange={e => setWDuration(Number(e.target.value))} className="w-24 p-3 border border-slate-700 rounded-xl font-bold text-lg text-center bg-slate-800 text-white" />
                                    <span className="font-bold text-slate-500">日間</span>
                                  </div>
                              </div>
                          </div>
                      )}

                      {wizardStep === 2 && wType === EventType.FACTION_WAR && (
                          <div className="space-y-6">
                              <div className="text-center mb-6">
                                  <Shuffle size={48} className="mx-auto text-indigo-500 mb-2" />
                                  <h4 className="text-2xl font-black text-white">チーム編成シミュレーション</h4>
                                  <p className="text-slate-400 text-sm">
                                      「活動日数」を最重視して戦力が均等になるように振り分けました。<br/>
                                      以下のバランスを確認し、適用してください。
                                  </p>
                              </div>

                              {wSimData && (
                                  <div className="grid grid-cols-2 gap-4">
                                      {/* Red Sim */}
                                      <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-4">
                                          <div className="text-red-400 font-black uppercase text-xs mb-2">Red Army Preview</div>
                                          <div className="space-y-2">
                                              <div className="flex justify-between text-sm">
                                                  <span className="text-slate-400">人数</span>
                                                  <span className="font-bold text-white">{wSimData.redStats.count} 名</span>
                                              </div>
                                              <div className="flex justify-between text-sm">
                                                  <span className="text-slate-400">平均Rate</span>
                                                  <span className="font-bold text-white">{wSimData.redStats.avgRate}</span>
                                              </div>
                                              <div className="flex justify-between text-sm">
                                                  <span className="text-slate-400">総活動日数</span>
                                                  <span className="font-bold text-white">{wSimData.redStats.totalDays} 日</span>
                                              </div>
                                          </div>
                                      </div>

                                      {/* White Sim */}
                                      <div className="bg-slate-800/50 border border-slate-600/30 rounded-2xl p-4">
                                          <div className="text-slate-400 font-black uppercase text-xs mb-2">White Army Preview</div>
                                           <div className="space-y-2">
                                              <div className="flex justify-between text-sm">
                                                  <span className="text-slate-400">人数</span>
                                                  <span className="font-bold text-white">{wSimData.whiteStats.count} 名</span>
                                              </div>
                                              <div className="flex justify-between text-sm">
                                                  <span className="text-slate-400">平均Rate</span>
                                                  <span className="font-bold text-white">{wSimData.whiteStats.avgRate}</span>
                                              </div>
                                              <div className="flex justify-between text-sm">
                                                  <span className="text-slate-400">総活動日数</span>
                                                  <span className="font-bold text-white">{wSimData.whiteStats.totalDays} 日</span>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              )}
                              
                              <button onClick={handleWizardBalanceApply} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                                  <Shuffle size={20} /> この編成を適用して次へ
                              </button>
                              
                              <div className="text-center">
                                <button onClick={() => setWizardStep(3)} className="text-xs text-slate-500 underline hover:text-slate-400">
                                    現在のチーム編成を維持したまま次へ
                                </button>
                              </div>
                          </div>
                      )}

                      {wizardStep === 3 && wType === EventType.FACTION_WAR && (
                          <div className="space-y-6">
                              <div className="text-center">
                                  <Crown size={48} className="mx-auto text-yellow-500 mb-2" />
                                  <h4 className="text-2xl font-black text-white">大将任命の儀</h4>
                                  <p className="text-slate-400 text-sm">各軍のリーダーとなる「大将」を指名してください。<br/>この選択はイベントの運命を左右します。</p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                  {/* Red General Selection */}
                                  <button onClick={() => setWSelectingTarget('RED')} className={`p-4 rounded-2xl border transition-all relative overflow-hidden group ${wRedGeneral ? 'border-red-500 bg-red-900/20' : 'border-dashed border-red-900/50 bg-red-900/10 hover:bg-red-900/20'}`}>
                                      <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] px-2 py-1 font-black uppercase">Red General</div>
                                      {wRedGeneral ? (
                                          <div className="mt-4 text-center">
                                              <div className="text-3xl mb-2">👺</div>
                                              <div className="font-black text-lg truncate text-red-300">{getPlayerName(wRedGeneral)}</div>
                                              <div className="text-xs text-red-500 font-bold mt-1">変更する</div>
                                          </div>
                                      ) : (
                                          <div className="h-32 flex flex-col items-center justify-center text-red-300/50 group-hover:text-red-400">
                                              <Plus size={32} />
                                              <div className="font-bold text-sm mt-2">紅組大将を選択</div>
                                          </div>
                                      )}
                                  </button>

                                  {/* White General Selection */}
                                   <button onClick={() => setWSelectingTarget('WHITE')} className={`p-4 rounded-2xl border transition-all relative overflow-hidden group ${wWhiteGeneral ? 'border-slate-500 bg-slate-800' : 'border-dashed border-slate-700 bg-slate-900 hover:bg-slate-800'}`}>
                                      <div className="absolute top-0 left-0 bg-slate-500 text-white text-[10px] px-2 py-1 font-black uppercase">White General</div>
                                      {wWhiteGeneral ? (
                                          <div className="mt-4 text-center">
                                              <div className="text-3xl mb-2">🤠</div>
                                              <div className="font-black text-lg truncate text-slate-300">{getPlayerName(wWhiteGeneral)}</div>
                                              <div className="text-xs text-slate-500 font-bold mt-1">変更する</div>
                                          </div>
                                      ) : (
                                          <div className="h-32 flex flex-col items-center justify-center text-slate-600 group-hover:text-slate-400">
                                              <Plus size={32} />
                                              <div className="font-bold text-sm mt-2">白組大将を選択</div>
                                          </div>
                                      )}
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 border-t border-white/5 bg-slate-950 shrink-0 flex justify-end gap-3">
                      {wizardStep === 1 ? (
                          <button onClick={handleWizardNext} className="bg-slate-200 text-slate-900 px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-white active:scale-95 transition-all flex items-center gap-2">
                              次へ <ChevronRight size={16} />
                          </button>
                      ) : (
                          <>
                             <button onClick={() => setWizardStep(prev => (prev - 1) as any)} className="text-slate-500 font-bold px-4 hover:bg-slate-900 rounded-lg transition-colors">戻る</button>
                             {wizardStep === 3 && (
                                <button onClick={finishEventSetup} className="bg-slate-200 text-slate-900 px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-white active:scale-95 transition-all flex items-center gap-2">
                                    イベント開始確定 <ChevronRight size={16} />
                                </button>
                             )}
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}

      {wSelectingTarget && (
          <UserSelector 
            users={users}
            onSelect={handleGeneralSelect}
            onClose={() => setWSelectingTarget(null)}
            title={wSelectingTarget === 'RED' ? '紅組大将を選択' : '白組大将を選択'}
          />
      )}

      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
           <div className="flex items-center gap-3 mb-2">
               <Settings size={32} className="text-white" />
               <h2 className="text-3xl font-black text-white">管理パネル</h2>
           </div>
           <p className="text-slate-400 font-bold">イベント開催、ユーザー管理、ポイント調整</p>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={openEventWizard}
                className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center gap-2 ${activeEvent ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {activeEvent ? <><Crown size={18} /> イベント管理</> : <><Calendar size={18} /> イベント開始ウィザード</>}
            </button>
            
            {activeEvent && (
                <button onClick={handleStopEvent} className="px-4 py-3 rounded-xl font-bold bg-slate-800 text-red-400 border border-red-900/50 hover:bg-red-900/20">
                    終了
                </button>
            )}
        </div>
      </div>
      
      {/* Current Event Status Card */}
      {activeEvent && (
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-white/10">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Event</div>
                      <h3 className="text-3xl font-black text-white mb-2">{settings.eventName}</h3>
                      <div className="flex gap-4 text-sm font-medium text-slate-300">
                          <span>終了: {new Date(settings.eventEndsAt!).toLocaleDateString()}</span>
                          <span>タイプ: {settings.eventType}</span>
                          <span className="text-yellow-400">倍率: {settings.eventMultiplier}x</span>
                      </div>
                  </div>
                  {settings.eventType === EventType.FACTION_WAR && (
                      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                          <Crown size={24} className="text-yellow-400" />
                          <div>
                              <div className="text-xs font-bold text-slate-400 uppercase">Faction War Mode</div>
                              <div className="font-bold">紅白戦進行中</div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* User Management */}
        <Card title="部員管理" icon={<Users />}>
          <div className="space-y-6">
            <div className="flex gap-2">
               <input 
                 type="text" 
                 value={newName} 
                 onChange={e => setNewName(e.target.value)} 
                 placeholder="新しい部員の名前"
                 className="flex-1 p-3 border border-slate-700 rounded-xl font-bold outline-none bg-slate-900 text-white focus:border-blue-500"
               />
               <button onClick={handleAddUser} className="bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 active:scale-95">
                 <Plus />
               </button>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2">
               {users.map(u => (
                   <div key={u.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700">
                       <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-full ${u.avatarColor} flex items-center justify-center text-white text-xs font-bold`}>
                               {u.name.charAt(0)}
                           </div>
                           <div>
                               <div className="font-bold text-sm text-slate-200">{u.name}</div>
                               <div className="text-xs text-slate-400 flex gap-2">
                                   <span>Rate: {Math.round(u.rate)}</span>
                                   <button onClick={() => toggleNewMember(u.id)} className={`hover:underline ${u.isNewMember ? 'text-green-400 font-bold' : 'text-slate-500'}`}>
                                       {u.isNewMember ? '新入部員' : '一般部員'}
                                   </button>
                               </div>
                           </div>
                       </div>
                       <button onClick={() => handleDeleteUser(u.id)} className="text-slate-500 hover:text-red-500 transition-colors p-2">
                           <Trash2 size={18} />
                       </button>
                   </div>
               ))}
            </div>
          </div>
        </Card>

        {/* System & Points */}
        <div className="space-y-8">
            <Card title="タイトル戦 (The Crown)" icon={<Crown className="text-yellow-500" />}>
                <div className="space-y-4">
                     <p className="text-sm text-slate-400">
                         現在のデータに基づき、「名人」「新星」「活動家」「下克上」の称号を授与します。<br/>
                         2週間に1回程度、手動で更新してください。
                     </p>
                     <button 
                        onClick={handleUpdateTitles} 
                        className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 text-white py-3 rounded-xl font-black hover:from-amber-500 hover:to-yellow-500 active:scale-95 transition-all shadow-lg border border-yellow-500/20"
                    >
                         タイトル戦 決着（更新）
                    </button>
                    <div className="text-xs text-slate-500 text-center">
                        最終更新: {settings.lastTitleUpdate ? new Date(settings.lastTitleUpdate).toLocaleDateString() : '未実施'}
                    </div>
                </div>
            </Card>

            <Card title="ポイント特別付与" icon={<Crown />}>
                <div className="space-y-4">
                    <select 
                        className="w-full p-3 border border-slate-700 rounded-xl font-bold bg-slate-900 text-white"
                        value={adjUser}
                        onChange={e => setAdjUser(e.target.value)}
                    >
                        <option value="">対象者を選択...</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    
                    <div className="flex gap-2">
                        <input type="number" value={adjPoints} onChange={e => setAdjPoints(Number(e.target.value))} className="w-24 p-3 border border-slate-700 rounded-xl font-bold text-center bg-slate-900 text-white" />
                        <input type="text" value={adjReason} onChange={e => setAdjReason(e.target.value)} className="flex-1 p-3 border border-slate-700 rounded-xl font-bold bg-slate-900 text-white" placeholder="理由 (例: 掃除)" />
                    </div>

                    <button 
                        onClick={handleGivePoints} 
                        disabled={!adjUser || isPointProcessing}
                        className="w-full bg-slate-200 text-slate-900 py-3 rounded-xl font-bold hover:bg-white active:scale-95 disabled:opacity-50 transition-all relative overflow-hidden"
                    >
                         {isPointProcessing ? '処理中...' : 'ポイント付与'}
                         {pointSuccessMsg && (
                             <div className="absolute inset-0 bg-green-500 text-white flex items-center justify-center animate-in fade-in">
                                 <CheckCircle size={20} className="mr-2"/> {pointSuccessMsg}
                             </div>
                         )}
                    </button>
                </div>
            </Card>

            <Card title="データ管理 & バックアップ" icon={<Download />}>
                <div className="space-y-3">
                    <button onClick={handleResetMonthly} className="w-full p-3 border border-slate-700 rounded-xl font-bold text-slate-400 hover:bg-slate-800 text-left flex items-center gap-3">
                         <History size={18}/> 月間ランキングのリセット
                    </button>
                     <button onClick={handleGenerateBackup} className="w-full p-3 border border-blue-900 rounded-xl font-bold text-blue-400 hover:bg-blue-900/20 text-left flex items-center gap-3">
                         <Download size={18}/> バックアップデータの生成
                    </button>
                    <button onClick={handleRestoreBackup} className="w-full p-3 border border-slate-700 rounded-xl font-bold text-slate-400 hover:bg-slate-800 text-left flex items-center gap-3">
                         <ClipboardCheck size={18}/> テキストから復元 (下の枠に入力)
                    </button>
                    
                    {showBackupArea && (
                        <div className="mt-4 animate-in slide-in-from-top-4 fade-in">
                            <div className="relative">
                                <textarea 
                                    className="w-full h-32 p-3 text-xs font-mono border border-slate-700 rounded-xl bg-slate-900 text-white focus:border-blue-500 outline-none"
                                    value={backupText}
                                    onChange={e => setBackupText(e.target.value)}
                                    placeholder="ここにバックアップJSONを貼り付け..."
                                />
                                <button onClick={copyToClipboard} className="absolute top-2 right-2 bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-600 text-slate-400 hover:text-blue-400">
                                    <Copy size={14} />
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 text-center">このテキストをコピーして保存、または復元時に貼り付けてください</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
      </div>
      
      {/* Recent Matches (Admin View) */}
      <div className="mt-8">
          <h3 className="text-xl font-black text-white mb-4">最近の対戦記録 (削除可能)</h3>
          <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-700 overflow-hidden">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800 text-slate-400 border-b border-slate-700">
                      <tr>
                          <th className="p-4 font-bold">日時</th>
                          <th className="p-4 font-bold">Player 1</th>
                          <th className="p-4 font-bold">Result</th>
                          <th className="p-4 font-bold">Player 2</th>
                          <th className="p-4 font-bold text-right">操作</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                      {recentMatches.map(m => (
                          <tr key={m.id} className="hover:bg-slate-800 transition-colors">
                              <td className="p-4 font-mono text-slate-500">{new Date(m.date).toLocaleString()}</td>
                              <td className="p-4 font-bold text-slate-300">{getPlayerName(m.player1Id)} <span className="text-xs font-normal text-slate-500">({m.p1RateChange > 0 ? '+' : ''}{m.p1RateChange})</span></td>
                              <td className="p-4 font-bold text-center text-slate-400">
                                  {m.result === 'DRAW' ? 'DRAW' : m.result === 'PLAYER1_WIN' ? '>' : '<'}
                              </td>
                              <td className="p-4 font-bold text-slate-300">{getPlayerName(m.player2Id)} <span className="text-xs font-normal text-slate-500">({m.p2RateChange > 0 ? '+' : ''}{m.p2RateChange})</span></td>
                              <td className="p-4 text-right">
                                  <button onClick={() => handleDeleteMatch(m.id)} className="text-red-400 hover:text-red-300 font-bold text-xs border border-red-900/50 hover:bg-red-900/20 px-3 py-1 rounded-full transition-colors">
                                      取り消し
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default Admin;
