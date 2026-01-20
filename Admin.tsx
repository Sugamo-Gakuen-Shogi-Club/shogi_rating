
import React, { useState, useEffect } from 'react';
// toggleGeneral is not exported from storage, and it is not used in this file.
import { getUsers, saveUsers, getSettings, saveSettings, manualPointAdjustment, manualRateAdjustment, resetMonthly, isEventActive, exportData, importData, getMatches, deleteMatch, balanceFactions, assignGenerals, resetEventPoints, getFactionBalanceSimulation, awardSystemTitles, syncWithServer } from './storage';
import { User, SystemSettings, MatchRecord, Season, EventType } from './types';
import { Card } from './Card';
import { NumPad } from './NumPad';
import { Settings, Trash2, Plus, ToggleLeft, ToggleRight, Calendar, Download, Copy, ClipboardCheck, History, CheckCircle, AlertCircle, Shuffle, Users, Crown, ChevronRight, X, UserCheck, Snowflake, Sun, Leaf, TrendingUp, Star, RefreshCw, Cloud, Send, Database } from 'lucide-react';
import { UserSelector } from './UserSelector';

const Admin: React.FC = () => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(getSettings());
  const [users, setUsers] = useState<User[]>([]);
  const [activeEvent, setActiveEvent] = useState(false);
  const [recentMatches, setRecentMatches] = useState<MatchRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  
  // Event Wizard State
  const [isEventWizardOpen, setIsEventWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  
  // Wizard Data
  const [wName, setWName] = useState('');
  const [wDuration, setWDuration] = useState(7);
  const [wType, setWType] = useState<EventType>(EventType.STANDARD);
  const [wRedGeneral, setWRedGeneral] = useState<string | null>(null);
  const [wWhiteGeneral, setWWhiteGeneral] = useState<string | null>(null);
  const [wSelectingTarget, setWSelectingTarget] = useState<'RED' | 'WHITE' | null>(null);
  
  const [wSimData, setWSimData] = useState<ReturnType<typeof getFactionBalanceSimulation> | null>(null);
  const [newName, setNewName] = useState('');
  const [adjMode, setAdjMode] = useState<'POINT' | 'RATE'>('POINT');
  const [adjUser, setAdjUser] = useState('');
  const [adjValue, setAdjValue] = useState(10);
  const [adjReason, setAdjReason] = useState(adjMode === 'POINT' ? '部室掃除' : 'レート補正');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [backupText, setBackupText] = useState('');
  const [showBackupArea, setShowBackupArea] = useState(false);

  useEffect(() => {
      refreshData();
  }, []);

  useEffect(() => {
      setAdjReason(adjMode === 'POINT' ? '部室掃除' : 'レート補正');
  }, [adjMode]);

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
    setRecentMatches(getMatches().slice(0, 20));
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    const success = await syncWithServer();
    setIsSyncing(false);
    if (success) {
      setLastSync(new Date().toLocaleTimeString());
      alert('Firebase と同期しました');
    } else {
      alert('同期に失敗しました。インターネット接続を確認してください。');
    }
  };

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newSeason = e.target.value as Season;
      if (window.confirm(`シーズンを「${newSeason}」に変更し、アプリをリロードしますか？`)) {
          const newSettings = { ...settings, currentSeason: newSeason };
          saveSettings(newSettings);
          setSettings(newSettings);
          window.location.reload();
      }
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
    if (window.confirm('本当に削除しますか？')) {
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
      if (window.confirm('現在のデータに基づいてタイトルを更新しますか？')) {
          awardSystemTitles();
          refreshData();
          alert('タイトルを更新しました！');
      }
  }

  const openEventWizard = () => {
      if (settings.eventName) setWName(settings.eventName);
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
      if (wType === EventType.FACTION_WAR) {
          if (!wRedGeneral || !wWhiteGeneral) { alert('大将を決定してください'); return; }
          assignGenerals(wRedGeneral, wWhiteGeneral);
      }
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + wDuration);
      const newSettings: SystemSettings = { ...settings, eventName: wName, eventEndsAt: endsAt.toISOString(), eventType: wType };
      resetEventPoints();
      saveSettings(newSettings);
      refreshData();
      setIsEventWizardOpen(false);
  };

  const handleWizardNext = () => {
      if (wizardStep === 1) {
          if (!wName) { alert('イベント名を入力してください'); return; }
          if (wType === EventType.FACTION_WAR) { setWSimData(getFactionBalanceSimulation(users)); setWizardStep(2); }
          else finishEventSetup();
      } else if (wizardStep === 2) setWizardStep(3);
      else if (wizardStep === 3) finishEventSetup();
  }

  const handleWizardBalanceApply = () => {
      if (window.confirm('この編成を適用しますか？')) {
          const balanced = balanceFactions(users);
          saveUsers(balanced);
          setUsers(balanced); 
          setWizardStep(3);
      }
  }

  const handleGeneralSelect = (id: string) => {
      if (wSelectingTarget === 'RED') setWRedGeneral(id);
      else if (wSelectingTarget === 'WHITE') setWWhiteGeneral(id);
      setWSelectingTarget(null);
  }

  const handleStopEvent = () => {
      if (window.confirm('強制終了しますか？')) {
        saveSettings({ ...settings, eventEndsAt: null });
        refreshData();
      }
  };

  const handleAdjustmentApply = () => {
    if (!adjUser) return;
    setIsProcessing(true);
    if (adjMode === 'POINT') manualPointAdjustment(adjUser, adjValue, adjReason);
    else manualRateAdjustment(adjUser, adjValue, adjReason);
    refreshData();
    setSuccessMsg('反映しました');
    setTimeout(() => { setIsProcessing(false); setSuccessMsg(null); }, 3000);
  };

  const handleResetMonthly = () => {
      if (window.confirm('今月のランキングをリセットしますか？')) {
          resetMonthly();
          refreshData();
      }
  }

  const handleDeleteMatch = (matchId: string) => {
      if (window.confirm('取り消しますか？')) {
          deleteMatch(matchId);
          refreshData();
      }
  }

  const getPlayerName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="glass-panel-dark w-full max-w-md p-8 text-center space-y-6 rounded-3xl shadow-2xl border border-white/10">
          <Settings className="mx-auto text-slate-500" size={48} />
          <h2 className="text-2xl font-bold text-white">管理者ログイン</h2>
          <NumPad value={pin} onChange={setPin} maxLength={4} />
          <button onClick={handleLogin} disabled={pin.length < 4} className="w-full bg-slate-200 text-slate-900 py-3 rounded-xl font-bold shadow-lg">ログイン</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {isEventWizardOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
              <div className="bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10">
                  <div className="bg-slate-950 text-white p-6 shrink-0 flex justify-between items-center border-b border-white/10">
                      <h3 className="text-xl font-black flex items-center gap-2"><Calendar /> イベントセットアップ</h3>
                      <button onClick={() => setIsEventWizardOpen(false)} className="bg-white/10 p-2 rounded-full"><X /></button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1">
                      {wizardStep === 1 && (
                          <div className="space-y-6">
                              <div>
                                  <label className="block text-sm font-bold text-slate-400 mb-2">イベント名</label>
                                  <input type="text" value={wName} onChange={e => setWName(e.target.value)} className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white" />
                              </div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-400 mb-2">イベントタイプ</label>
                                  <div className="grid grid-cols-2 gap-4">
                                      <button onClick={() => setWType(EventType.STANDARD)} className={`p-4 rounded-xl border text-left ${wType === EventType.STANDARD ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700'}`}>通常強化</button>
                                      <button onClick={() => setWType(EventType.FACTION_WAR)} className={`p-4 rounded-xl border text-left ${wType === EventType.FACTION_WAR ? 'border-red-500 bg-red-900/20' : 'border-slate-700'}`}>紅白戦</button>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>
                  <div className="p-4 border-t border-white/5 bg-slate-950 shrink-0 flex justify-end gap-3">
                      <button onClick={handleWizardNext} className="bg-slate-200 text-slate-900 px-8 py-3 rounded-xl font-bold">次へ</button>
                  </div>
              </div>
          </div>
      )}

      {wSelectingTarget && (
          <UserSelector users={users} onSelect={handleGeneralSelect} onClose={() => setWSelectingTarget(null)} />
      )}

      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
           <h2 className="text-3xl font-black text-white">管理パネル</h2>
           <p className="text-slate-400 font-bold">イベント開催、ユーザー管理、報酬付与</p>
        </div>
        <button onClick={openEventWizard} className="px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg">
            イベント開始ウィザード
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Firebase Sync Section */}
        <Card title="Firebase クラウド同期" icon={<Database size={20} className={isSyncing ? "animate-spin" : ""} />}>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-white/5">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Database Status</div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isSyncing ? "bg-blue-500 animate-pulse" : "bg-green-500"}`}></div>
                  <span className="font-bold text-slate-200">{isSyncing ? "Syncing..." : "Connected (Realtime)"}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Last Sync</div>
                <div className="text-slate-200 font-mono text-xs">{lastSync || "Not synced yet"}</div>
              </div>
            </div>
            
            <button 
              onClick={handleForceSync}
              disabled={isSyncing}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 hover:from-blue-900/60 hover:to-indigo-900/60 text-blue-300 py-3 rounded-xl font-bold border border-blue-500/30 transition-all shadow-lg"
            >
              <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} /> 
              クラウドへ手動同期
            </button>
            
            <div className="p-3 bg-black/30 rounded-lg border border-white/5">
              <p className="text-[10px] text-slate-500 leading-relaxed italic">
                Firebase Realtime Database を使用しています。
                全てのデータ変更は即座にバックグラウンドでクラウドへバックアップされます。
              </p>
            </div>
          </div>
        </Card>

        <Card title="部員管理" icon={<Users />}>
          <div className="space-y-4">
            <div className="flex gap-2">
               <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="新しい名前" className="flex-1 p-3 rounded-xl bg-slate-900 text-white" />
               <button onClick={handleAddUser} className="bg-blue-600 text-white px-6 rounded-xl font-bold"><Plus /></button>
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2 scrollbar-thin">
               {users.map(u => (
                   <div key={u.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl border border-slate-700">
                       <span className="font-bold text-slate-200">{u.name}</span>
                       <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 p-2 hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={18} /></button>
                   </div>
               ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
