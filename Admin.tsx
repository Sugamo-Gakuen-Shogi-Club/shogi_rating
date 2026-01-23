
import React, { useState, useEffect, useRef } from 'react';
import { getUsers, saveUsers, getSettings, saveSettings, manualPointAdjustment, manualRateAdjustment, resetMonthly, isEventActive, exportData, importData, getMatches, deleteMatch, balanceFactions, toggleGeneral, assignGenerals, resetEventPoints, getFactionBalanceSimulation, awardSystemTitles, snapshotSeasonBaseline, updateUserReading, parseUserCSV, bulkAddUsers } from './storage';
import { User, SystemSettings, MatchRecord, Season, EventType } from './types';
import { Card } from './Card';
import { NumPad } from './NumPad';
import { Settings, Trash2, Plus, Calendar, Download, History, CheckCircle, Shuffle, Users, Crown, ChevronRight, X, RefreshCw, Languages, FileUp, Upload } from 'lucide-react';
import { UserSelector } from './UserSelector';

const Admin: React.FC = () => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(getSettings());
  const [users, setUsers] = useState<User[]>([]);
  const [activeEvent, setActiveEvent] = useState(false);
  
  const [isEventWizardOpen, setIsEventWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wName, setWName] = useState('');
  const [wDuration, setWDuration] = useState(7);
  const [wType, setWType] = useState<EventType>(EventType.STANDARD);
  const [wRedGeneral, setWRedGeneral] = useState<string | null>(null);
  const [wWhiteGeneral, setWWhiteGeneral] = useState<string | null>(null);
  const [wSelectingTarget, setWSelectingTarget] = useState<'RED' | 'WHITE' | null>(null);
  const [wSimData, setWSimData] = useState<ReturnType<typeof getFactionBalanceSimulation> | null>(null);
  
  // 新規部員フォーム
  const [newName, setNewName] = useState('');
  const [newReading, setNewReading] = useState('');

  // CSV 一括追加
  const [csvPreview, setCsvPreview] = useState<Partial<User>[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [adjMode, setAdjMode] = useState<'POINT' | 'RATE'>('POINT');
  const [adjUser, setAdjUser] = useState('');
  const [adjValue, setAdjValue] = useState(10);
  const [adjReason, setAdjReason] = useState('部室掃除');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [backupText, setBackupText] = useState('');
  const [showBackupArea, setShowBackupArea] = useState(false);

  useEffect(() => { refreshData(); }, []);

  const handleLogin = () => {
    if (pin === settings.adminPin) { setIsAuthenticated(true); refreshData(); } 
    else { alert('PINが違います'); setPin(''); }
  };

  const refreshData = () => {
    const u = getUsers();
    setUsers(u);
    const s = getSettings();
    setSettings(s);
    setActiveEvent(isEventActive());
  };

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newSeason = e.target.value as Season;
      if (window.confirm(`シーズンを「${newSeason}」に変更し、成長度計算用のレート・ポイントをスナップショットしますか？`)) {
          snapshotSeasonBaseline();
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
      reading: newReading || undefined,
      isNewMember: true,
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
    };
    saveUsers([...users, newUser]);
    setNewName('');
    setNewReading('');
    refreshData();
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          const parsed = parseUserCSV(content);
          if (parsed.length === 0) {
              alert('有効なデータが見つかりませんでした。');
              return;
          }
          setCsvPreview(parsed);
      };
      reader.readAsText(file);
      // 同じファイルを再度選択できるようにリセット
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmBulkAdd = () => {
      if (!csvPreview) return;
      bulkAddUsers(csvPreview);
      setCsvPreview(null);
      refreshData();
      alert(`${csvPreview.length}名の部員を追加しました。`);
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('本当に削除しますか？')) {
      saveUsers(users.filter(u => u.id !== id));
      refreshData();
    }
  };

  const toggleNewMember = (id: string) => {
      saveUsers(users.map(u => u.id === id ? { ...u, isNewMember: !u.isNewMember } : u));
      refreshData();
  };

  const handleReadingChange = (id: string, reading: string) => {
      updateUserReading(id, reading);
      // ローカルの状態も更新して入力を反映
      setUsers(users.map(u => u.id === id ? { ...u, reading } : u));
  };

  const handleUpdateTitles = () => {
      if (window.confirm('現在のシーズン成長度に基づいてタイトルを更新しますか？')) {
          awardSystemTitles();
          refreshData();
          alert('タイトルを更新しました！');
      }
  }

  const openEventWizard = () => {
      setWName(settings.eventName || '');
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
      saveSettings({ ...settings, eventName: wName, eventEndsAt: endsAt.toISOString(), eventType: wType });
      resetEventPoints();
      refreshData();
      setIsEventWizardOpen(false);
  };

  const handleStopEvent = () => {
      if (window.confirm('イベントを強制終了しますか？')) {
        saveSettings({ ...settings, eventEndsAt: null });
        refreshData();
      }
  };

  const handleAdjustmentApply = () => {
    if (!adjUser) return;
    setIsProcessing(true);
    if (adjMode === 'POINT') { manualPointAdjustment(adjUser, adjValue, adjReason); setSuccessMsg(`${adjValue}pt付与`); } 
    else { manualRateAdjustment(adjUser, adjValue, adjReason); setSuccessMsg(`レート${adjValue}変動`); }
    refreshData();
    setTimeout(() => { setIsProcessing(false); setSuccessMsg(null); }, 2000);
  };

  const handleResetMonthly = () => {
    if (window.confirm('今月の表示ポイントをリセットしますか？')) {
      resetMonthly();
      refreshData();
    }
  };

  const handleImport = () => {
    if (!backupText) return;
    if (window.confirm('現在のすべてのデータを上書きして復元しますか？')) {
        const success = importData(backupText);
        if (success) {
            alert('データの復元に成功しました。再読み込みします。');
            window.location.reload();
        } else {
            alert('データの形式が正しくありません。');
        }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="glass-panel-dark w-full max-md p-8 text-center space-y-6 rounded-3xl border border-white/10 shadow-2xl">
          <Settings className="mx-auto text-slate-500" size={48} />
          <h2 className="text-2xl font-bold text-white font-serif-jp">管理者ログイン</h2>
          <div>
             <input type="password" value={pin} readOnly placeholder="PIN" className="w-full p-4 border border-slate-700 rounded-xl text-center text-2xl tracking-[1em] outline-none bg-slate-900 text-white font-mono focus:ring-2 focus:ring-blue-500" />
             <NumPad value={pin} onChange={setPin} maxLength={4} />
          </div>
          <button onClick={handleLogin} disabled={pin.length < 4} className="w-full bg-slate-200 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 py-3 rounded-xl font-bold active:scale-95 transition-transform shadow-lg">ログイン</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* CSV プレビューモーダル */}
      {csvPreview && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-in fade-in">
              <div className="bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/10">
                  <div className="bg-slate-800 text-white p-6 shrink-0 flex justify-between items-center border-b border-white/10">
                      <h3 className="text-xl font-black flex items-center gap-2 font-serif-jp"><FileUp size={24} className="text-blue-400" /> 一括登録の確認</h3>
                      <button onClick={() => setCsvPreview(null)} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><X /></button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1">
                      <p className="text-sm text-slate-400 mb-4 font-bold">以下の {csvPreview.length} 名の部員を追加します。よろしいですか？</p>
                      <div className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden">
                          <table className="w-full text-left text-sm">
                              <thead className="bg-slate-800 text-slate-400 font-bold">
                                  <tr>
                                      <th className="px-4 py-3">名前</th>
                                      <th className="px-4 py-3">読み</th>
                                      <th className="px-4 py-3 text-center">区分</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                  {csvPreview.map((p, i) => (
                                      <tr key={i} className="text-slate-300">
                                          <td className="px-4 py-3 font-bold">{p.name}</td>
                                          <td className="px-4 py-3 font-mono text-xs">{p.reading}</td>
                                          <td className="px-4 py-3 text-center">
                                              {p.isNewMember ? <span className="text-[10px] bg-green-900/40 text-green-400 px-2 py-0.5 rounded border border-green-800">新入</span> : <span className="text-[10px] text-slate-600">一般</span>}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
                  <div className="p-6 border-t border-white/5 bg-slate-950 flex justify-end gap-3">
                      <button onClick={() => setCsvPreview(null)} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white transition-colors">キャンセル</button>
                      <button onClick={confirmBulkAdd} className="bg-blue-600 text-white px-10 py-3 rounded-xl font-black shadow-lg shadow-blue-900/20 active:scale-95 transition-all">追加を実行</button>
                  </div>
              </div>
          </div>
      )}

      {isEventWizardOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10">
                  <div className="bg-slate-950 text-white p-6 shrink-0 flex justify-between items-center border-b border-white/10">
                      <h3 className="text-xl font-black flex items-center gap-2 font-serif-jp"><Calendar /> イベント設定</h3>
                      <button onClick={() => setIsEventWizardOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><X /></button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 space-y-6">
                      {wizardStep === 1 && (
                          <>
                              <div><label className="block text-sm font-bold text-slate-400 mb-2">イベント名</label><input type="text" value={wName} onChange={e => setWName(e.target.value)} className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white font-bold" /></div>
                              <div>
                                  <label className="block text-sm font-bold text-slate-400 mb-2">タイプ</label>
                                  <div className="grid grid-cols-2 gap-4">
                                      <button onClick={() => setWType(EventType.STANDARD)} className={`p-4 rounded-xl border text-left ${wType === EventType.STANDARD ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700'}`}><div className="font-bold">通常強化</div></button>
                                      <button onClick={() => setWType(EventType.FACTION_WAR)} className={`p-4 rounded-xl border text-left ${wType === EventType.FACTION_WAR ? 'border-red-500 bg-red-900/20' : 'border-slate-700'}`}><div className="font-bold text-red-400">紅白戦</div></button>
                                  </div>
                              </div>
                              <div><label className="block text-sm font-bold text-slate-400 mb-2">期間(日)</label><input type="number" value={wDuration} onChange={e => setWDuration(Number(e.target.value))} className="w-24 p-3 border border-slate-700 rounded-xl bg-slate-800 text-white font-bold text-center" /></div>
                          </>
                      )}
                      {wizardStep === 2 && (
                          <div className="space-y-6">
                              <h4 className="text-lg font-bold text-white text-center">チーム編成</h4>
                              <button onClick={() => { saveUsers(balanceFactions(users)); setWizardStep(3); }} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2"><Shuffle size={20} /> 自動編成を実行</button>
                          </div>
                      )}
                      {wizardStep === 3 && (
                          <div className="space-y-6">
                              <h4 className="text-lg font-bold text-white text-center">大将任命</h4>
                              <div className="grid grid-cols-2 gap-4">
                                  <button onClick={() => setWSelectingTarget('RED')} className={`p-4 rounded-2xl border flex flex-col items-center justify-center h-32 ${wRedGeneral ? 'border-red-500 bg-red-900/20' : 'border-dashed border-red-900/50'}`}>
                                      {wRedGeneral ? <div className="font-black text-red-400">{users.find(u => u.id === wRedGeneral)?.name}</div> : "紅組大将を選択"}
                                  </button>
                                  <button onClick={() => setWSelectingTarget('WHITE')} className={`p-4 rounded-2xl border flex flex-col items-center justify-center h-32 ${wWhiteGeneral ? 'border-slate-500 bg-slate-800' : 'border-dashed border-slate-700'}`}>
                                      {wWhiteGeneral ? <div className="font-black text-slate-400">{users.find(u => u.id === wWhiteGeneral)?.name}</div> : "白組大将を選択"}
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
                  <div className="p-4 border-t border-white/5 bg-slate-950 flex justify-end gap-3">
                      {wizardStep === 1 && <button onClick={() => wType === EventType.FACTION_WAR ? setWizardStep(2) : finishEventSetup()} className="bg-slate-200 text-slate-900 px-8 py-3 rounded-xl font-bold">次へ <ChevronRight size={16} /></button>}
                      {wizardStep > 1 && <button onClick={finishEventSetup} className="bg-slate-200 text-slate-900 px-8 py-3 rounded-xl font-bold">イベント開始</button>}
                  </div>
              </div>
          </div>
      )}
      {wSelectingTarget && <UserSelector users={users} onSelect={id => { if(wSelectingTarget === 'RED') setWRedGeneral(id); else setWWhiteGeneral(id); setWSelectingTarget(null); }} onClose={() => setWSelectingTarget(null)} title="大将を選択" />}

      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2"><Settings size={32} className="text-white" /><h2 className="text-3xl font-black text-white font-serif-jp">管理パネル</h2></div>
          <p className="text-slate-400 font-bold">部員の管理とイベント設定</p>
        </div>
        <div className="flex gap-2">
            <button onClick={openEventWizard} className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg ${activeEvent ? 'bg-orange-600' : 'bg-blue-600'}`}>{activeEvent ? 'イベント終了・変更' : 'イベント開始'}</button>
            {activeEvent && <button onClick={handleStopEvent} className="px-4 py-3 rounded-xl font-bold bg-slate-800 text-red-400 border border-red-900/50">停止</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="部員名簿管理" icon={<Users />}>
          <div className="space-y-6">
            {/* 個別登録フォーム */}
            <div className="space-y-3 p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] gap-3">
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="名前（例：秀村 紘嗣）" className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                    <input type="text" value={newReading} onChange={e => setNewReading(e.target.value)} placeholder="読み（例：ひでむら ひろし）" className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                    <button onClick={handleAddUser} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 md:col-span-2 lg:col-span-1">
                      <Plus size={20} /> <span className="lg:hidden">部員を追加</span>
                    </button>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                    <p className="text-[10px] text-slate-500 font-bold px-1 flex items-center gap-1"><Languages size={10}/> 五十音順のために「読み」をひらがなで入力してください。</p>
                    {/* CSV 一括追加ボタン */}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold transition-all border border-slate-700 shadow-sm"
                    >
                        <FileUp size={16} className="text-blue-400" />
                        CSVで一括追加
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleCsvUpload} accept=".csv" className="hidden" />
                </div>
            </div>
            
            <div className="max-h-[500px] overflow-y-auto pr-2 space-y-3 scrollbar-hide">
               {users.map(u => (
                   <div key={u.id} className="flex flex-col p-4 bg-slate-800 rounded-2xl border border-slate-700 gap-3 group transition-all hover:border-slate-500">
                       <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-full ${u.avatarColor} flex items-center justify-center text-white font-black text-lg font-serif-jp shadow-inner`}>{u.name.charAt(0)}</div>
                               <div>
                                   <div className="font-bold text-slate-100">{u.name}</div>
                                   <div className="text-[10px] text-slate-500 font-mono">Rate: {Math.round(u.rate)}</div>
                               </div>
                           </div>
                           <div className="flex items-center gap-2">
                               <button onClick={() => toggleNewMember(u.id)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${u.isNewMember ? 'bg-green-900/30 text-green-400 border-green-600' : 'bg-slate-900 text-slate-500 border-slate-700'}`}>{u.isNewMember ? '🔰 新入' : '一般'}</button>
                               <button onClick={() => handleDeleteUser(u.id)} className="text-slate-500 hover:text-red-500 p-2 transition-colors"><Trash2 size={18} /></button>
                           </div>
                       </div>
                       <div className="flex items-center gap-2 pl-2">
                           <Languages size={14} className="text-slate-500 shrink-0" />
                           <input 
                            type="text" 
                            value={u.reading || ''} 
                            onChange={e => handleReadingChange(u.id, e.target.value)}
                            placeholder="読みを入力..."
                            className={`flex-1 bg-slate-900/50 border ${u.reading ? 'border-slate-700 text-slate-300' : 'border-orange-500/50 text-orange-200'} rounded-lg px-3 py-1.5 text-xs font-bold focus:border-blue-500 outline-none`}
                           />
                       </div>
                   </div>
               ))}
            </div>
          </div>
        </Card>

        <div className="space-y-8">
            <Card title="シーズン・タイトル" icon={<Crown className="text-yellow-500" />}>
                <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">現在のシーズン</label>
                        <div className="relative">
                            <select className="w-full p-4 border border-slate-600 rounded-xl font-bold bg-slate-900 text-white appearance-none cursor-pointer" value={settings.currentSeason} onChange={handleSeasonChange}>{Object.values(Season).map(s => (<option key={s} value={s}>{s}</option>))}</select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><RefreshCw size={18} /></div>
                        </div>
                     </div>
                     <div className="pt-4 border-t border-white/5">
                        <p className="text-sm text-slate-400 mb-4">成長度や対局数に基づき「名人」「新星」などの称号を再計算します。</p>
                        <button onClick={handleUpdateTitles} className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 text-white py-3 rounded-xl font-black shadow-lg hover:shadow-yellow-500/20 active:scale-[0.98] transition-all">称号を更新する</button>
                     </div>
                </div>
            </Card>

            <Card title="手動ポイント調整" icon={<Plus className="text-blue-400" />}>
                <div className="space-y-4">
                    <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                        <button onClick={() => setAdjMode('POINT')} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${adjMode === 'POINT' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500'}`}>ポイント</button>
                        <button onClick={() => setAdjMode('RATE')} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${adjMode === 'RATE' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>レート</button>
                    </div>
                    <select className="w-full p-3 border border-slate-700 rounded-xl font-bold bg-slate-900 text-white" value={adjUser} onChange={e => setAdjUser(e.target.value)}><option value="">対象を選択...</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
                    <div className="flex gap-2"><input type="number" value={adjValue} onChange={e => setAdjValue(Number(e.target.value))} className="w-24 p-3 border border-slate-700 rounded-xl font-bold text-center bg-slate-900 text-white" /><input type="text" value={adjReason} onChange={setAdjReason} className="flex-1 p-3 border border-slate-700 rounded-xl font-bold bg-slate-900 text-white" /></div>
                    <button onClick={handleAdjustmentApply} disabled={!adjUser || isProcessing} className={`w-full text-slate-900 py-4 rounded-xl font-black transition-all relative overflow-hidden ${adjMode === 'POINT' ? 'bg-amber-400 hover:bg-amber-300' : 'bg-blue-400 hover:bg-blue-300'}`}>
                         {isProcessing ? '処理中...' : '反映'}{successMsg && <div className="absolute inset-0 bg-green-500 text-white flex items-center justify-center font-bold animate-in fade-in"><CheckCircle size={20} className="mr-2"/> {successMsg}</div>}
                    </button>
                </div>
            </Card>

            <Card title="データ保守" icon={<Download />}>
                <div className="space-y-4">
                    <button onClick={handleResetMonthly} className="w-full p-3 border border-slate-700 rounded-xl font-bold text-slate-400 flex items-center justify-center gap-3 hover:bg-white/5 transition-colors"><History size={18}/> 今月の表示ポイントをリセット</button>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => { const json = exportData(); setBackupText(json); setShowBackupArea(true); }} className="w-full p-3 border border-blue-900 rounded-xl font-bold text-blue-400 flex items-center justify-center gap-3 hover:bg-blue-900/10 transition-colors">
                            <Download size={18}/> バックアップ
                        </button>
                        <button onClick={() => { setShowBackupArea(true); setBackupText(''); }} className="w-full p-3 border border-green-900 rounded-xl font-bold text-green-400 flex items-center justify-center gap-3 hover:bg-green-900/10 transition-colors">
                            <Upload size={18}/> データ復元
                        </button>
                    </div>

                    {showBackupArea && (
                        <div className="mt-4 space-y-3 animate-in slide-in-from-top duration-300">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">JSON Data System</label>
                                <button onClick={() => setShowBackupArea(false)} className="text-slate-500 hover:text-white"><X size={14}/></button>
                            </div>
                            <textarea 
                                className="w-full h-32 p-3 text-xs font-mono border border-slate-700 rounded-xl bg-slate-950 text-white focus:border-blue-500 outline-none" 
                                placeholder="復元する場合はここにJSONを貼り付けてください..."
                                value={backupText} 
                                onChange={e => setBackupText(e.target.value)} 
                            />
                            <div className="flex gap-2">
                                <button onClick={async () => { if(!backupText) return; await navigator.clipboard.writeText(backupText); alert('コピー完了'); }} className="flex-1 text-xs text-blue-400 font-bold underline bg-blue-900/10 py-2 rounded-lg">クリップボードにコピー</button>
                                <button onClick={handleImport} disabled={!backupText} className="flex-1 text-xs text-green-400 font-black bg-green-900/20 py-2 rounded-lg border border-green-900/50 disabled:opacity-30">このデータで復元する</button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
