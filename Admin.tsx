import React, { useState, useEffect, useRef } from 'react';
import {
  getUsers, saveUsers, getSettings, saveSettings,
  manualPointAdjustment, manualRateAdjustment, resetMonthly,
  isEventActive, exportData, importData, getMatches, deleteMatch,
  assignGenerals, resetEventPoints, getFactionBalanceSimulation,
  awardSystemTitles, snapshotSeasonBaseline, updateUserReading,
  parseUserCSV, bulkAddUsers,
  deactivateUser, reactivateUser, getInactiveUsers,
  manualSync, getSyncStatus, getAutoBackups, restoreFromAutoBackup,
  pushToCloud,
  getUndoSnapshots, applyUndoSnapshot, clearUndoHistory,
  getRankApplications, approveRankApplication, rejectRankApplication, clearOfficialRank,
  enableMaintenanceMode, disableMaintenanceMode,
} from './storage';
import { User, SystemSettings, Season, EventType, SyncMeta, AutoBackupEntry, UndoSnapshot, RankApplication } from './types';
import { Card } from './Card';
import { NumPad } from './NumPad';
import {
  Settings, Plus, Calendar, Download, History, CheckCircle, Shuffle,
  Users, Crown, ChevronRight, X, RefreshCw, Languages, FileUp, Upload,
  Swords, Cloud, CloudOff, AlertCircle, Loader, UserCheck, UserX,
  RotateCcw, Undo2, Wrench, Award, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { UserSelector } from './UserSelector';

const Admin: React.FC = () => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(getSettings());
  const [users, setUsers] = useState<User[]>([]);
  const [inactiveUsers, setInactiveUsers] = useState<User[]>([]);
  const [activeEvent, setActiveEvent] = useState(false);
  const [syncMeta, setSyncMeta] = useState<SyncMeta>(getSyncStatus());
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoBackups, setAutoBackups] = useState<AutoBackupEntry[]>([]);
  const [undoSnapshots, setUndoSnapshots] = useState<UndoSnapshot[]>([]);
  const [rankApps, setRankApps] = useState<RankApplication[]>([]);
  const [restoringKey, setRestoringKey] = useState<string | null>(null);
  const [isEventWizardOpen, setIsEventWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1|2|3>(1);
  const [wName, setWName] = useState('');
  const [wDuration, setWDuration] = useState(7);
  const [wType, setWType] = useState<EventType>(EventType.STANDARD);
  const [wRedGeneral, setWRedGeneral] = useState<string|null>(null);
  const [wWhiteGeneral, setWWhiteGeneral] = useState<string|null>(null);
  const [wSelectingTarget, setWSelectingTarget] = useState<'RED'|'WHITE'|null>(null);
  const [wSimData, setWSimData] = useState<ReturnType<typeof getFactionBalanceSimulation>|null>(null);
  const [newName, setNewName] = useState('');
  const [newReading, setNewReading] = useState('');
  const [csvPreview, setCsvPreview] = useState<Partial<User>[]|null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [adjMode, setAdjMode] = useState<'POINT'|'RATE'>('POINT');
  const [adjUser, setAdjUser] = useState('');
  const [adjValue, setAdjValue] = useState(10);
  const [adjReason, setAdjReason] = useState('部室掃除');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string|null>(null);
  const [backupText, setBackupText] = useState('');
  const [showBackupArea, setShowBackupArea] = useState(false);
  const [maintWorking, setMaintWorking] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string|null>(null);

  useEffect(() => { refreshData(); }, []);
  useEffect(() => {
    const h = (e: Event) => setSyncMeta((e as CustomEvent<SyncMeta>).detail);
    window.addEventListener('rivals-sync-changed', h);
    return () => window.removeEventListener('rivals-sync-changed', h);
  }, []);

  const refreshData = () => {
    setUsers(getUsers());
    setInactiveUsers(getInactiveUsers());
    setSettings(getSettings());
    setActiveEvent(isEventActive());
    setSyncMeta(getSyncStatus());
    setAutoBackups(getAutoBackups());
    setUndoSnapshots(getUndoSnapshots());
    setRankApps(getRankApplications());
  };

  const handleLogin = () => {
    if (pin === settings.adminPin) { setIsAuthenticated(true); refreshData(); }
    else { alert('PINが違います'); setPin(''); }
  };

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const s = e.target.value as Season;
    if (window.confirm(`シーズンを「${s}」に変更しますか？成長度の基準がリセットされます。`)) {
      snapshotSeasonBaseline();
      const ns = { ...settings, currentSeason: s };
      saveSettings(ns); setSettings(ns); refreshData();
      alert('変更しました。');
    }
  };

  const handleUpdateTitles = () => {
    if (window.confirm('称号を現在の成績で再計算しますか？')) {
      awardSystemTitles(); refreshData(); alert('称号を更新しました！');
    }
  };

  const handleAddUser = () => {
    if (!newName.trim()) return;
    bulkAddUsers([{ name: newName.trim(), reading: newReading.trim(), isNewMember: true }]);
    setNewName(''); setNewReading(''); refreshData();
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { const p = parseUserCSV(ev.target?.result as string); if (p.length === 0) { alert('有効なデータがありません'); return; } setCsvPreview(p); };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmBulkAdd = () => { if (!csvPreview) return; bulkAddUsers(csvPreview); setCsvPreview(null); refreshData(); alert(`${csvPreview.length}名追加しました。`); };

  const handleDeactivateUser = (id: string, name: string) => {
    if (window.confirm(`「${name}」を休眠にしますか？データは保持されます。`)) { deactivateUser(id); refreshData(); }
  };
  const handleReactivateUser = (id: string, name: string) => {
    if (window.confirm(`「${name}」を再入班させますか？過去のデータが引き継がれます。`)) { reactivateUser(id); refreshData(); alert(`${name} を再入班させました。`); }
  };
  const toggleNewMember = (id: string) => {
    const all = getUsers(true); saveUsers(all.map(u => u.id === id ? { ...u, isNewMember: !u.isNewMember } : u)); refreshData();
  };

  // ── Event Wizard ──
  const openEventWizard = () => {
    setWName(settings.eventName || ''); setWType(EventType.STANDARD); setWDuration(7);
    setWRedGeneral(null); setWWhiteGeneral(null); setWSimData(null); setWizardStep(1); setIsEventWizardOpen(true);
  };
  const finishEventSetup = () => {
    if (wType === EventType.FACTION_WAR) {
      if (!wRedGeneral || !wWhiteGeneral) { alert('大将を決定してください'); return; }
      if (!wSimData) { alert('チーム編成を実行してください'); return; }
      const updatedUsers = getUsers(true).map(u => ({ ...u, faction: wSimData.redUsers.some(r => r.id === u.id) ? 'RED' as const : 'WHITE' as const }));
      saveUsers(updatedUsers);
      assignGenerals(wRedGeneral, wWhiteGeneral); // ← 大将軍称号もここで付与
    }
    const endsAt = new Date(); endsAt.setDate(endsAt.getDate() + wDuration);
    saveSettings({ ...settings, eventName: wName, eventEndsAt: endsAt.toISOString(), eventType: wType });
    resetEventPoints(); refreshData(); setIsEventWizardOpen(false);
    alert(`イベント「${wName}」を開始しました！`);
  };
  const handleStopEvent = () => { if (window.confirm('イベントを強制終了しますか？')) { saveSettings({ ...settings, eventEndsAt: null }); refreshData(); } };

  // ── Undo ──
  const handleUndo = (snap: UndoSnapshot) => {
    if (window.confirm(`「${snap.label}」の直前の状態に戻しますか？\n${new Date(snap.timestamp).toLocaleString('ja-JP')}\n\nこの操作は元に戻せません。`)) {
      applyUndoSnapshot(snap.id); refreshData(); alert('戻しました。');
    }
  };

  // ── Maintenance ──
  const handleEnableMaintenance = async () => {
    if (window.confirm('メンテナンスモードを開始します。\n現在のデータがFirebaseとローカルにバックアップされます。')) {
      setMaintWorking(true);
      await enableMaintenanceMode(); refreshData(); setMaintWorking(false);
      alert('メンテナンスモードを開始しました。');
    }
  };
  const handleDisableMaintenance = async (restore: boolean) => {
    const msg = restore
      ? 'メンテナンス前のデータに戻してメンテナンスモードを終了しますか？\n（メンテナンス中のデータは削除されます）'
      : 'メンテナンス中のデータを保持したままメンテナンスモードを終了しますか？';
    if (!window.confirm(msg)) return;
    setMaintWorking(true);
    await disableMaintenanceMode(restore); refreshData(); setMaintWorking(false);
    alert('メンテナンスモードを終了しました。');
  };

  // ── Sync ──
  const handleManualSync = async () => {
    setIsSyncing(true); const ok = await manualSync(); setSyncMeta(getSyncStatus()); setIsSyncing(false);
    if (!ok) alert('同期に失敗しました。ローカルには保存済みです。');
    else refreshData();
  };

  // ── Adjustment ──
  const handleAdjustmentApply = () => {
    if (!adjUser) return; setIsProcessing(true);
    if (adjMode === 'POINT') { manualPointAdjustment(adjUser, adjValue, adjReason); setSuccessMsg(`${adjValue}pt付与`); }
    else { manualRateAdjustment(adjUser, adjValue, adjReason); setSuccessMsg(`レート${adjValue >= 0 ? '+' : ''}${adjValue}`); }
    refreshData(); setTimeout(() => { setIsProcessing(false); setSuccessMsg(null); }, 2000);
  };

  // ── Rank Apps ──
  const handleApprove = (id: string) => { approveRankApplication(id); refreshData(); };
  const handleReject = (id: string) => {
    rejectRankApplication(id, rejectReason); setRejectingId(null); setRejectReason(''); refreshData();
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="w-full max-w-sm p-8 text-center space-y-6 rounded-3xl border border-white/10 shadow-2xl bg-slate-900">
          <Settings className="mx-auto text-slate-500" size={48} />
          <h2 className="text-2xl font-bold text-white">管理者ログイン</h2>
          <div>
            <input type="password" value={pin} readOnly placeholder="PIN" className="w-full p-4 border border-slate-700 rounded-xl text-center text-2xl tracking-[1em] outline-none bg-slate-900 text-white font-mono" />
            <NumPad value={pin} onChange={setPin} maxLength={4} />
          </div>
          <button onClick={handleLogin} disabled={pin.length < 4} className="w-full bg-slate-200 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 py-3 rounded-xl font-bold active:scale-95 transition-transform">ログイン</button>
        </div>
      </div>
    );
  }

  const pendingRankApps = rankApps.filter(a => a.status === 'PENDING');

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">

      {/* CSV Preview */}
      {csvPreview && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4">
          <div className="bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/10">
            <div className="bg-slate-800 text-white p-6 flex justify-between items-center border-b border-white/10">
              <h3 className="text-xl font-black flex items-center gap-2"><FileUp size={24} className="text-blue-400" /> 一括登録確認</h3>
              <button onClick={() => setCsvPreview(null)} className="bg-white/10 p-2 rounded-full"><X /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-slate-400 mb-4 font-bold">{csvPreview.length}名を追加します。</p>
              <table className="w-full text-left text-sm bg-slate-950 rounded-2xl overflow-hidden">
                <thead className="bg-slate-800 text-slate-400"><tr><th className="px-4 py-3">名前</th><th className="px-4 py-3">読み</th><th className="px-4 py-3 text-center">区分</th></tr></thead>
                <tbody className="divide-y divide-white/5">{csvPreview.map((p, i) => (<tr key={i} className="text-slate-300"><td className="px-4 py-3 font-bold">{p.name}</td><td className="px-4 py-3 font-mono text-xs">{p.reading}</td><td className="px-4 py-3 text-center">{p.isNewMember ? <span className="text-[10px] bg-green-900/40 text-green-400 px-2 py-0.5 rounded">新入</span> : <span className="text-[10px] text-slate-600">一般</span>}</td></tr>))}</tbody>
              </table>
            </div>
            <div className="p-6 border-t border-white/5 bg-slate-950 flex justify-end gap-3">
              <button onClick={() => setCsvPreview(null)} className="px-6 py-3 rounded-xl font-bold text-slate-400">キャンセル</button>
              <button onClick={confirmBulkAdd} className="bg-blue-600 text-white px-10 py-3 rounded-xl font-black">追加を実行</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-white/10 space-y-4">
            <h3 className="font-black text-white text-lg">却下理由（任意）</h3>
            <input type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="例: 申請内容が不明確" className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold outline-none" />
            <div className="flex gap-3">
              <button onClick={() => { setRejectingId(null); setRejectReason(''); }} className="flex-1 py-3 rounded-xl font-bold text-slate-400 border border-slate-700">キャンセル</button>
              <button onClick={() => handleReject(rejectingId)} className="flex-1 py-3 rounded-xl font-black bg-red-600 text-white">却下する</button>
            </div>
          </div>
        </div>
      )}

      {/* Event wizard */}
      {isEventWizardOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
          <div className="bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white/10">
            <div className="bg-slate-800 text-white p-6 flex justify-between items-center border-b border-white/10">
              <h3 className="text-xl font-black flex items-center gap-2"><Calendar /> イベント設定</h3>
              <button onClick={() => setIsEventWizardOpen(false)} className="bg-white/10 p-2 rounded-full"><X /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {wizardStep === 1 && (<>
                <div><label className="block text-sm font-bold text-slate-400 mb-2">イベント名</label><input type="text" value={wName} onChange={e => setWName(e.target.value)} className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white font-bold" /></div>
                <div><label className="block text-sm font-bold text-slate-400 mb-2">タイプ</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setWType(EventType.STANDARD)} className={`p-4 rounded-xl border text-left ${wType === EventType.STANDARD ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700'}`}><div className="font-bold">通常強化</div><div className="text-xs text-slate-500 mt-1">ポイント倍率アップ</div></button>
                    <button onClick={() => setWType(EventType.FACTION_WAR)} className={`p-4 rounded-xl border text-left ${wType === EventType.FACTION_WAR ? 'border-red-500 bg-red-900/20' : 'border-slate-700'}`}><div className="font-bold text-red-400">紅白戦</div><div className="text-xs text-slate-500 mt-1">チーム対抗戦</div></button>
                  </div>
                </div>
                <div><label className="block text-sm font-bold text-slate-400 mb-2">期間(日)</label><input type="number" value={wDuration} onChange={e => setWDuration(Number(e.target.value))} className="w-24 p-3 border border-slate-700 rounded-xl bg-slate-800 text-white font-bold text-center" /></div>
              </>)}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white text-center">戦力シミュレーション</h4>
                  {!wSimData ? (
                    <button onClick={() => setWSimData(getFactionBalanceSimulation(users))} className="w-full bg-indigo-600 text-white py-12 rounded-2xl font-black text-xl flex flex-col items-center gap-4"><Shuffle size={48}/><span>自動チーム編成を実行</span></button>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-red-900/20 border border-red-900/50 p-4 rounded-2xl"><div className="text-red-500 font-black mb-2">紅組</div><div className="text-xs text-slate-400">人数: {wSimData.redStats.count}人</div><div className="text-xs text-slate-400">平均Rate: {wSimData.redStats.avgRate}</div></div>
                        <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-2xl"><div className="text-blue-400 font-black mb-2">白組</div><div className="text-xs text-slate-400">人数: {wSimData.whiteStats.count}人</div><div className="text-xs text-slate-400">平均Rate: {wSimData.whiteStats.avgRate}</div></div>
                      </div>
                      <button onClick={() => setWSimData(getFactionBalanceSimulation(users))} className="w-full py-3 rounded-xl font-bold text-slate-400 border border-slate-700 flex items-center justify-center gap-2"><RefreshCw size={16}/> 再シャッフル</button>
                    </div>
                  )}
                </div>
              )}
              {wizardStep === 3 && (
                <div className="space-y-6">
                  <h4 className="text-lg font-bold text-white text-center">大将任命（大将軍称号が付与されます）</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setWSelectingTarget('RED')} className={`p-4 rounded-2xl border flex flex-col items-center h-32 justify-center ${wRedGeneral ? 'border-red-500 bg-red-900/20' : 'border-dashed border-red-900/50'}`}>
                      {wRedGeneral ? (<div className="text-center"><Crown className="mx-auto mb-2 text-yellow-500"/><div className="font-black text-red-400">{users.find(u => u.id === wRedGeneral)?.name}</div></div>) : <div className="text-slate-600 font-bold text-sm">紅組大将を選択</div>}
                    </button>
                    <button onClick={() => setWSelectingTarget('WHITE')} className={`p-4 rounded-2xl border flex flex-col items-center h-32 justify-center ${wWhiteGeneral ? 'border-blue-500 bg-blue-900/20' : 'border-dashed border-slate-700'}`}>
                      {wWhiteGeneral ? (<div className="text-center"><Crown className="mx-auto mb-2 text-yellow-500"/><div className="font-black text-blue-400">{users.find(u => u.id === wWhiteGeneral)?.name}</div></div>) : <div className="text-slate-600 font-bold text-sm">白組大将を選択</div>}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-white/5 bg-slate-950 flex justify-end gap-3">
              {wizardStep === 1 && <button onClick={() => wType === EventType.FACTION_WAR ? setWizardStep(2) : finishEventSetup()} className="bg-slate-200 text-slate-900 px-8 py-3 rounded-xl font-bold flex items-center gap-2">次へ <ChevronRight size={16}/></button>}
              {wizardStep === 2 && <button onClick={() => setWizardStep(3)} disabled={!wSimData} className="bg-slate-200 disabled:bg-slate-800 disabled:text-slate-600 text-slate-900 px-8 py-3 rounded-xl font-bold flex items-center gap-2">次へ <ChevronRight size={16}/></button>}
              {wizardStep === 3 && <button onClick={finishEventSetup} className="bg-slate-200 text-slate-900 px-8 py-3 rounded-xl font-bold flex items-center gap-2"><Swords size={18}/> イベント開始</button>}
            </div>
          </div>
        </div>
      )}
      {wSelectingTarget && (
        <UserSelector users={wSimData ? (wSelectingTarget === 'RED' ? wSimData.redUsers : wSimData.whiteUsers) : users}
          onSelect={id => { if (wSelectingTarget === 'RED') setWRedGeneral(id); else setWWhiteGeneral(id); setWSelectingTarget(null); }}
          onClose={() => setWSelectingTarget(null)} title={`${wSelectingTarget === 'RED' ? '紅組' : '白組'}大将を選択`} />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div><div className="flex items-center gap-3 mb-2"><Settings size={32} className="text-white"/><h2 className="text-3xl font-black text-white">管理パネル</h2></div><p className="text-slate-400 font-bold">部員管理・イベント・システム設定</p></div>
        <div className="flex gap-2">
          <button onClick={openEventWizard} className={`px-6 py-3 rounded-xl font-bold text-white ${activeEvent ? 'bg-orange-600' : 'bg-blue-600'}`}>{activeEvent ? 'イベント変更' : 'イベント開始'}</button>
          {activeEvent && <button onClick={handleStopEvent} className="px-4 py-3 rounded-xl font-bold bg-slate-800 text-red-400 border border-red-900/50">停止</button>}
        </div>
      </div>

      {/* Pending rank applications alert */}
      {pendingRankApps.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-500/40 rounded-2xl p-4 flex items-center gap-3">
          <Award size={20} className="text-amber-400 shrink-0"/>
          <div>
            <div className="font-black text-amber-400">段位・級位の申請が{pendingRankApps.length}件あります</div>
            <div className="text-xs text-slate-400">下の「段位・級位申請」パネルから承認してください</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── 左列 ── */}
        <div className="space-y-8">
          {/* Members */}
          <Card title="在籍部員" icon={<Users />}>
            <div className="space-y-4">
              <div className="space-y-3 p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="名前" className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                  <input type="text" value={newReading} onChange={e => setNewReading(e.target.value)} placeholder="読み（ひらがな）" className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={handleAddUser} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Plus size={20}/> 追加</button>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[10px] text-slate-500 flex items-center gap-1"><Languages size={10}/> 読みはひらがなで（五十音順ソート用）</p>
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold border border-slate-700"><FileUp size={16} className="text-blue-400"/> CSVで一括追加</button>
                  <input type="file" ref={fileInputRef} onChange={handleCsvUpload} accept=".csv" className="hidden"/>
                </div>
              </div>
              <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3 scrollbar-hide">
                {users.map(u => (
                  <div key={u.id} className="flex flex-col p-4 bg-slate-800 rounded-2xl border border-slate-700 gap-3 hover:border-slate-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${u.avatarColor} flex items-center justify-center text-white font-black text-lg`}>{u.name.charAt(0)}</div>
                        <div>
                          <div className="font-bold text-slate-100 flex items-center gap-2">{u.name}{u.officialRank && <span className="text-[10px] bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded border border-purple-700/40 font-black">{u.officialRank.source} {u.officialRank.rank}</span>}</div>
                          <div className="text-[10px] text-slate-500">Rate: {Math.round(u.rate)} / {u.wins}勝{u.losses}敗</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleNewMember(u.id)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black border ${u.isNewMember ? 'bg-green-900/30 text-green-400 border-green-600' : 'bg-slate-900 text-slate-500 border-slate-700'}`}>{u.isNewMember ? '🔰 新入' : '一般'}</button>
                        <button onClick={() => handleDeactivateUser(u.id, u.name)} className="text-slate-500 hover:text-yellow-500 p-2" title="休眠（データ保持）"><UserX size={18}/></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-2">
                      <Languages size={14} className="text-slate-500 shrink-0"/>
                      <input type="text" value={u.reading || ''} onChange={e => { updateUserReading(u.id, e.target.value); setUsers(users.map(x => x.id === u.id ? { ...x, reading: e.target.value } : x)); }} placeholder="読みを入力..."
                        className={`flex-1 bg-slate-900/50 border ${u.reading ? 'border-slate-700 text-slate-300' : 'border-orange-500/50 text-orange-200'} rounded-lg px-3 py-1.5 text-xs font-bold focus:border-blue-500 outline-none`}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Inactive */}
          {inactiveUsers.length > 0 && (
            <Card title={`休眠中の部員 (${inactiveUsers.length}名)`} icon={<UserX className="text-yellow-500" size={18}/>}>
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                {inactiveUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700 gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${u.avatarColor} opacity-50 flex items-center justify-center text-white font-black`}>{u.name.charAt(0)}</div>
                      <div><div className="font-bold text-slate-400">{u.name}</div><div className="text-[10px] text-slate-600">Rate: {Math.round(u.rate)} / {u.wins}勝{u.losses}敗 / {u.activityDays}日</div></div>
                    </div>
                    <button onClick={() => handleReactivateUser(u.id, u.name)} className="flex items-center gap-1 bg-green-900/30 hover:bg-green-700/40 text-green-400 border border-green-700/40 px-3 py-1.5 rounded-lg text-xs font-black"><UserCheck size={14}/> 再入班</button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Rank Applications */}
          <Card title={`段位・級位申請 ${pendingRankApps.length > 0 ? `(${pendingRankApps.length}件待ち)` : ''}`} icon={<Award className={pendingRankApps.length > 0 ? 'text-amber-400' : 'text-slate-400'} size={18}/>}>
            {rankApps.length === 0 ? (
              <p className="text-slate-500 text-sm">申請はありません。部員が個人データ画面から申請できます。</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-hide">
                {rankApps.slice().sort((a, b) => a.status === 'PENDING' ? -1 : 1).map(app => {
                  const user = users.find(u => u.id === app.userId) || inactiveUsers.find(u => u.id === app.userId);
                  return (
                    <div key={app.id} className={`p-3 rounded-xl border ${app.status === 'PENDING' ? 'bg-amber-900/10 border-amber-700/40' : app.status === 'APPROVED' ? 'bg-green-900/10 border-green-700/30' : 'bg-slate-900/50 border-slate-800'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="font-black text-slate-200">{user?.name || '不明'}</span>
                          <span className="text-xs text-slate-400 ml-2">{new Date(app.requestedAt).toLocaleDateString('ja-JP')}</span>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${app.status === 'PENDING' ? 'bg-amber-900/30 text-amber-400' : app.status === 'APPROVED' ? 'bg-green-900/30 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
                          {app.status === 'PENDING' ? '申請中' : app.status === 'APPROVED' ? '承認済' : '却下'}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-purple-300">{app.source}  {app.rank}</div>
                      {app.status === 'PENDING' && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleApprove(app.id)} className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white py-1.5 rounded-lg text-xs font-black"><ThumbsUp size={12}/> 承認</button>
                          <button onClick={() => setRejectingId(app.id)} className="flex-1 flex items-center justify-center gap-1 bg-red-700/50 text-red-300 border border-red-700/40 py-1.5 rounded-lg text-xs font-black"><ThumbsDown size={12}/> 却下</button>
                        </div>
                      )}
                      {app.rejectReason && <div className="text-[10px] text-red-400 mt-1">却下理由: {app.rejectReason}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* ── 右列 ── */}
        <div className="space-y-8">
          {/* Season & Titles */}
          <Card title="シーズン・称号" icon={<Crown className="text-yellow-500"/>}>
            <div className="space-y-4">
              <select className="w-full p-4 border border-slate-600 rounded-xl font-bold bg-slate-900 text-white appearance-none" value={settings.currentSeason} onChange={handleSeasonChange}>
                {Object.values(Season).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <p className="text-xs text-slate-500">シーズン変更すると成長度の基準がリセットされます。</p>
              <button onClick={handleUpdateTitles} className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 text-white py-3 rounded-xl font-black">四天王称号を更新する</button>
              {settings.lastTitleUpdate && <div className="text-xs text-slate-600 text-center">最終: {new Date(settings.lastTitleUpdate).toLocaleString('ja-JP', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' })}</div>}
            </div>
          </Card>

          {/* Undo */}
          <Card title={`操作履歴・取り消し (${undoSnapshots.length}件)`} icon={<Undo2 size={18}/>}>
            {undoSnapshots.length === 0 ? (
              <p className="text-slate-500 text-sm">取り消し可能な操作はありません。</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                {undoSnapshots.map((snap, i) => (
                  <div key={snap.id} className={`flex items-center justify-between p-3 rounded-xl border gap-3 ${i === 0 ? 'bg-blue-900/10 border-blue-700/30' : 'bg-slate-800/50 border-slate-700'}`}>
                    <div>
                      <div className="text-xs font-black text-slate-200">{snap.label}</div>
                      <div className="text-[10px] text-slate-500">{new Date(snap.timestamp).toLocaleString('ja-JP', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' })}</div>
                    </div>
                    <button onClick={() => handleUndo(snap)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black ${i === 0 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}><RotateCcw size={12}/> 戻す</button>
                  </div>
                ))}
                <button onClick={() => { if (window.confirm('履歴をすべて削除しますか？')) { clearUndoHistory(); refreshData(); } }} className="w-full text-xs text-slate-500 py-2 hover:text-white transition-colors">履歴をクリア</button>
              </div>
            )}
          </Card>

          {/* Manual Adjustment */}
          <Card title="手動調整" icon={<Plus className="text-blue-400"/>}>
            <div className="space-y-4">
              <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                <button onClick={() => setAdjMode('POINT')} className={`flex-1 py-3 rounded-lg text-xs font-bold ${adjMode === 'POINT' ? 'bg-amber-600 text-white' : 'text-slate-500'}`}>ポイント</button>
                <button onClick={() => setAdjMode('RATE')}  className={`flex-1 py-3 rounded-lg text-xs font-bold ${adjMode === 'RATE'  ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>レート</button>
              </div>
              <select className="w-full p-3 border border-slate-700 rounded-xl font-bold bg-slate-900 text-white" value={adjUser} onChange={e => setAdjUser(e.target.value)}>
                <option value="">対象を選択...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="number" value={adjValue} onChange={e => setAdjValue(Number(e.target.value))} className="w-24 p-3 border border-slate-700 rounded-xl font-bold text-center bg-slate-900 text-white"/>
                <input type="text" value={adjReason} onChange={e => setAdjReason(e.target.value)} className="flex-1 p-3 border border-slate-700 rounded-xl font-bold bg-slate-900 text-white" placeholder="理由"/>
              </div>
              <button onClick={handleAdjustmentApply} disabled={!adjUser || isProcessing} className={`w-full text-slate-900 py-4 rounded-xl font-black relative overflow-hidden ${adjMode === 'POINT' ? 'bg-amber-400' : 'bg-blue-400'} disabled:opacity-50`}>
                {isProcessing ? '処理中...' : '反映'}
                {successMsg && <div className="absolute inset-0 bg-green-500 text-white flex items-center justify-center font-bold"><CheckCircle size={20} className="mr-2"/>{successMsg}</div>}
              </button>
              <button onClick={() => { if (window.confirm('月次ポイントをリセットしますか？')) { resetMonthly(); refreshData(); } }} className="w-full p-3 border border-slate-700 rounded-xl font-bold text-slate-400 flex items-center justify-center gap-2 hover:bg-white/5"><History size={18}/> 月次ポイントリセット</button>
            </div>
          </Card>

          {/* Maintenance Mode */}
          <Card title="メンテナンスモード" icon={<Wrench size={18} className={settings.maintenanceMode ? 'text-amber-400' : 'text-slate-400'}/>}>
            <div className="space-y-3">
              <p className="text-xs text-slate-400">新機能の動作確認に使います。開始時にFirebaseとローカルに自動バックアップします。終了時にメンテナンス前の状態に戻すか選べます。</p>
              {!settings.maintenanceMode ? (
                <button onClick={handleEnableMaintenance} disabled={maintWorking} className="w-full py-3 rounded-xl font-black bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center gap-2 disabled:opacity-50">
                  {maintWorking ? <Loader size={16} className="animate-spin"/> : <Wrench size={16}/>}
                  {maintWorking ? '準備中...' : 'メンテナンス開始'}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="bg-amber-900/20 border border-amber-500/40 rounded-xl p-3 text-xs text-amber-300 font-bold">⚠ メンテナンスモード中です</div>
                  <button onClick={() => handleDisableMaintenance(true)} disabled={maintWorking} className="w-full py-3 rounded-xl font-black bg-green-700 text-white flex items-center justify-center gap-2 disabled:opacity-50">
                    {maintWorking ? <Loader size={16} className="animate-spin"/> : <RotateCcw size={16}/>}
                    メンテナンス前に戻して終了
                  </button>
                  <button onClick={() => handleDisableMaintenance(false)} disabled={maintWorking} className="w-full py-3 rounded-xl font-bold bg-slate-700 text-slate-300 flex items-center justify-center gap-2 disabled:opacity-50">
                    このまま終了（データを保持）
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* Sync Status */}
          <Card title="クラウド同期" icon={<Cloud size={18}/>}>
            <div className="space-y-3">
              <div className={`flex items-center gap-3 p-3 rounded-xl border ${syncMeta.status === 'SYNCED' ? 'bg-green-900/20 border-green-700/40' : syncMeta.status === 'ERROR' ? 'bg-red-900/20 border-red-700/40' : 'bg-slate-800/40 border-slate-700'}`}>
                {syncMeta.status === 'SYNCED'  && <Cloud size={20} className="text-green-400"/>}
                {syncMeta.status === 'PENDING' && <CloudOff size={20} className="text-yellow-400"/>}
                {syncMeta.status === 'SYNCING' && <Loader size={20} className="text-blue-400 animate-spin"/>}
                {syncMeta.status === 'ERROR'   && <AlertCircle size={20} className="text-red-400"/>}
                <div>
                  <div className={`font-black text-sm ${syncMeta.status === 'SYNCED' ? 'text-green-400' : syncMeta.status === 'ERROR' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {syncMeta.status === 'SYNCED' ? '同期済み' : syncMeta.status === 'PENDING' ? `未同期 (${syncMeta.pendingChanges}件)` : syncMeta.status === 'SYNCING' ? '同期中...' : syncMeta.status === 'ERROR' ? 'エラー' : '未同期'}
                  </div>
                  <div className="text-xs text-slate-500">最終同期: {syncMeta.lastSync ? new Date(syncMeta.lastSync).toLocaleString('ja-JP', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'}</div>
                </div>
              </div>
              {syncMeta.status === 'ERROR' && <div className="text-xs text-red-300 bg-red-900/10 border border-red-700/30 rounded-xl p-3 font-bold">⚠ クラウド保存失敗。<span className="text-white">ローカルには保存済みです。</span><br/>ネット接続後に下のボタンで再試行してください。</div>}
              <button onClick={handleManualSync} disabled={isSyncing} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white py-3 rounded-xl font-bold">
                <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''}/>{isSyncing ? '同期中...' : '今すぐ同期'}
              </button>
            </div>
          </Card>

          {/* Auto Backups */}
          <Card title="自動バックアップ（直近7日）" icon={<History size={18}/>}>
            {autoBackups.length === 0 ? <p className="text-slate-500 text-sm">バックアップはまだありません。</p> : (
              <div className="space-y-2">
                {autoBackups.map(entry => (
                  <div key={entry.key} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700 gap-3">
                    <div><div className="font-bold text-slate-200 text-sm">{entry.label || entry.date}</div><div className="text-xs text-slate-500">{entry.userCount}名 / 対局{entry.matchCount}件</div></div>
                    <button onClick={() => { setRestoringKey(entry.key); if (window.confirm(`${entry.label || entry.date}から復元しますか？`)) { restoreFromAutoBackup(entry.key); alert('復元しました。'); window.location.reload(); } setRestoringKey(null); }} disabled={restoringKey === entry.key} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold"><RotateCcw size={12}/> 復元</button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Backup/Restore */}
          <Card title="バックアップ・復元" icon={<Download/>}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setBackupText(exportData()); setShowBackupArea(true); }} className="p-3 border border-blue-900 rounded-xl font-bold text-blue-400 flex items-center justify-center gap-2 hover:bg-blue-900/10"><Download size={18}/> エクスポート</button>
                <button onClick={() => importFileRef.current?.click()} className="p-3 border border-green-900 rounded-xl font-bold text-green-400 flex items-center justify-center gap-2 hover:bg-green-900/10"><Upload size={18}/> ファイルから</button>
                <input type="file" ref={importFileRef} onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { if (window.confirm('上書き復元しますか？')) { if (importData(ev.target?.result as string)) { alert('復元しました。'); window.location.reload(); } else alert('形式エラー'); } }; r.readAsText(f); if (importFileRef.current) importFileRef.current.value = ''; }} accept=".json,.txt" className="hidden"/>
              </div>
              {showBackupArea && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center"><label className="text-[10px] font-black text-slate-500 uppercase">JSON Data</label><button onClick={() => setShowBackupArea(false)} className="text-slate-500"><X size={14}/></button></div>
                  <textarea className="w-full h-32 p-3 text-xs font-mono border border-slate-700 rounded-xl bg-slate-950 text-white outline-none" value={backupText} onChange={e => setBackupText(e.target.value)} placeholder="復元する場合はJSONを貼り付け..."/>
                  <div className="flex gap-2">
                    <button onClick={async () => { await navigator.clipboard.writeText(backupText); alert('コピーしました'); }} className="flex-1 text-xs text-blue-400 underline bg-blue-900/10 py-2 rounded-lg">コピー</button>
                    <button onClick={() => { if (!backupText) return; if (window.confirm('上書きしますか？')) { if (importData(backupText)) { alert('復元しました。'); window.location.reload(); } else alert('形式エラー'); } }} disabled={!backupText} className="flex-1 text-xs text-green-400 font-black bg-green-900/20 py-2 rounded-lg border border-green-900/50 disabled:opacity-30">このデータで復元</button>
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
