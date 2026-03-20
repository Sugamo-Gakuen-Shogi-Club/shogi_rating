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
  getMaintenanceState,
  getPendingRankApplications, approveRankApplication, rejectRankApplication, removeRank,
  removeAchievement, deleteAttendanceLog, getLogs, ACHIEVEMENTS_DATA,
  updateProfilePin, clearSystemTitleHistory,
  getApprovedDevices, approveThisDevice, revokeDevice, getOrCreateDeviceToken, isDeviceApproved,
} from './storage';
import { User, SystemSettings, Season, EventType, SyncMeta, AutoBackupEntry, MaintenanceState, RankApplication, ActivityLog, ActivityType } from './types';
import { Card } from './Card';
import { NumPad } from './NumPad';
import {
  Settings, Trash2, Plus, Calendar, Download, History,
  CheckCircle, Shuffle, Users, Crown, ChevronRight, X,
  RefreshCw, Languages, FileUp, Upload, Swords, Cloud,
  CloudOff, AlertCircle, Loader, UserCheck, UserX, RotateCcw,
  Wrench, Medal, Check, KeyRound, Star, Lock
} from 'lucide-react';
import { UserSelector } from './UserSelector';
import MaintenancePanel from './MaintenancePanel';

const Admin: React.FC = () => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(getSettings());
  const [users, setUsers] = useState<User[]>([]);
  const [approvedDevices, setApprovedDevices] = useState<{token: string; label: string; approvedAt: string}[]>([]);
  const [newDeviceLabel, setNewDeviceLabel] = useState('部室iPad');
  const [kojiPass, setKojiPass] = useState('');
  const [kojiErr, setKojiErr] = useState(false);
  const [inactiveUsers, setInactiveUsers] = useState<User[]>([]);
  const [activeEvent, setActiveEvent] = useState(false);
  // DnD member order
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  // デバイス承認フロー（未承認デバイス用）
  const [approveStep, setApproveStep] = useState<'koji' | 'adminPin' | 'label' | 'done'>('koji');
  const [approveKoji, setApproveKoji] = useState('');
  const [approveKojiErr, setApproveKojiErr] = useState(false);
  const [approveAdminPin, setApproveAdminPin] = useState('');
  const [approveAdminErr, setApproveAdminErr] = useState(false);
  const [approveLabel, setApproveLabel] = useState('部室iPad');

  // Sync state
  const [syncMeta, setSyncMeta] = useState<SyncMeta>(getSyncStatus());
  const [isSyncing, setIsSyncing] = useState(false);

  // Maintenance
  const [maintActive, setMaintActive] = useState(getMaintenanceState().active);

  // Rank applications
  const [rankApps, setRankApps] = useState<RankApplication[]>([]);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});

  // PIN management
  const [pinTargetId, setPinTargetId] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Auto backups
  const [autoBackups, setAutoBackups] = useState<AutoBackupEntry[]>([]);
  const [restoringKey, setRestoringKey] = useState<string | null>(null);

  // Event wizard
  const [isEventWizardOpen, setIsEventWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wName, setWName] = useState('');
  const [wDuration, setWDuration] = useState(7);
  const [wType, setWType] = useState<EventType>(EventType.STANDARD);
  const [wRedGeneral, setWRedGeneral] = useState<string | null>(null);
  const [wWhiteGeneral, setWWhiteGeneral] = useState<string | null>(null);
  const [wSelectingTarget, setWSelectingTarget] = useState<'RED' | 'WHITE' | null>(null);
  const [wSimData, setWSimData] = useState<ReturnType<typeof getFactionBalanceSimulation> | null>(null);

  // Add user
  const [newName, setNewName] = useState('');
  const [newReading, setNewReading] = useState('');

  // Four Kings confirmation modal
  const [kingsConfirm, setKingsConfirm] = useState<{
    masters: string[], risings: string[], grinders: string[], killers: string[]
  } | null>(null);

  // CSV
  const [csvPreview, setCsvPreview] = useState<Partial<User>[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Adjustments
  const [adjMode, setAdjMode] = useState<'POINT' | 'RATE'>('POINT');
  const [adjUser, setAdjUser] = useState('');
  const [adjValue, setAdjValue] = useState(10);
  const [adjReason, setAdjReason] = useState('部室掃除');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Backup panel
  const [backupText, setBackupText] = useState('');
  const [showBackupArea, setShowBackupArea] = useState(false);

  useEffect(() => { refreshData(); }, []);

  // Listen for sync status changes
  useEffect(() => {
    const h = (e: Event) => setSyncMeta((e as CustomEvent<SyncMeta>).detail);
    window.addEventListener('rivals-sync-changed', h);
    return () => window.removeEventListener('rivals-sync-changed', h);
  }, []);

  const handleLogin = () => {
    if (pin === settings.adminPin) { setIsAuthenticated(true); refreshData(); setPin(''); }
    else { alert('PINが違います'); setPin(''); }
  };

  const refreshData = () => {
    setUsers(getUsers());
    setInactiveUsers(getInactiveUsers());
    setSettings(getSettings());
    setActiveEvent(isEventActive());
    setSyncMeta(getSyncStatus());
    setAutoBackups(getAutoBackups());
    setRankApps(getPendingRankApplications());
    setApprovedDevices(getApprovedDevices());
  };

  // ──────────────────────────────────────────────────────────
  // SEASON / TITLES
  // ──────────────────────────────────────────────────────────
  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSeason = e.target.value as Season;
    if (window.confirm(`シーズンを「${newSeason}」に変更し、成長度のスナップショットを取りますか？`)) {
      snapshotSeasonBaseline(); // ★ Fix: was no-op
      const s = { ...settings, currentSeason: newSeason };
      saveSettings(s);
      setSettings(s);
      refreshData();
      alert('シーズンを変更しました。成長度の基準がリセットされました。');
    }
  };

  const handleUpdateTitles = () => {
    const allU = getUsers(); // ★ activeのみ（退部者除外）
    if (allU.length === 0) { alert('部員がいません。'); return; }

    // ★ upsetCountをマッチレコードから正しく計算
    const rateMap = Object.fromEntries(allU.map(u => [u.id, u.rate]));
    const upsetCount: Record<string, number> = {};
    getMatches().forEach(m => {
      const p1Rate = rateMap[m.player1Id] ?? 0;
      const p2Rate = rateMap[m.player2Id] ?? 0;
      if (m.result === 'PLAYER1_WIN' && p2Rate > p1Rate)
        upsetCount[m.player1Id] = (upsetCount[m.player1Id] || 0) + 1;
      else if (m.result === 'PLAYER2_WIN' && p1Rate > p2Rate)
        upsetCount[m.player2Id] = (upsetCount[m.player2Id] || 0) + 1;
    });

    const topScore = (list: any[], val: (u: any) => number) => {
      if (!list.length) return [];
      const s = val(list[0]);
      return list.filter(u => val(u) === s);
    };

    const masterC  = [...allU].sort((a, b) => (b.rate - b.seasonStartRate) - (a.rate - a.seasonStartRate));
    const risingC  = [...allU].sort((a, b) => (b.totalPoints - b.seasonStartPoints) - (a.totalPoints - a.seasonStartPoints));
    const grinderC = [...allU].sort((a, b) => b.activityDays - a.activityDays);
    const killerC  = [...allU].sort((a, b) => (upsetCount[b.id] || 0) - (upsetCount[a.id] || 0));

    const masters  = topScore(masterC,  u => u.rate - u.seasonStartRate);
    const risings  = topScore(risingC,  u => u.totalPoints - u.seasonStartPoints);
    const grinders = topScore(grinderC, u => u.activityDays);
    // ★ killerは格上撃破0件の場合は「対象なし」
    const killerTop = topScore(killerC, u => upsetCount[u.id] || 0);
    const killers = killerTop.filter(u => (upsetCount[u.id] || 0) > 0);

    setKingsConfirm({
      masters:  masters.map((u: any) => u.name),
      risings:  risings.map((u: any) => u.name),
      grinders: grinders.map((u: any) => u.name),
      killers:  killers.map((u: any) => u.name),
    });
  };

  // ──────────────────────────────────────────────────────────
  // USER MANAGEMENT
  // ──────────────────────────────────────────────────────────
  const handleAddUser = () => {
    if (!newName.trim()) return;
    bulkAddUsers([{ name: newName.trim(), reading: newReading.trim(), isNewMember: true }]);
    setNewName('');
    setNewReading('');
    refreshData();
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseUserCSV(ev.target?.result as string);
      if (parsed.length === 0) { alert('有効なデータが見つかりません'); return; }
      setCsvPreview(parsed);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmBulkAdd = () => {
    if (!csvPreview) return;
    bulkAddUsers(csvPreview);
    setCsvPreview(null);
    refreshData();
    alert(`${csvPreview.length}名を追加しました。`);
  };

  // ★ Soft delete (休眠) instead of hard delete
  const handleDeactivateUser = (id: string, name: string) => {
    if (window.confirm(`「${name}」を休眠状態にしますか？\nデータは保持されます。管理画面から再入班できます。`)) {
      deactivateUser(id);
      refreshData();
    }
  };

  // ★ Reactivate
  const handleReactivateUser = (id: string, name: string) => {
    if (window.confirm(`「${name}」を再入班させますか？\n過去のレート・実績が引き継がれます。`)) {
      reactivateUser(id);
      refreshData();
      alert(`${name} を再入班させました。`);
    }
  };

  const handleApproveRank = (appId: string) => {
    approveRankApplication(appId);
    refreshData();
  };

  const handleRejectRank = (appId: string) => {
    const note = rejectNote[appId] || '';
    rejectRankApplication(appId, note);
    refreshData();
  };

  const handlePinChange = () => {
    if (!pinTargetId) { setPinMsg({ type: 'err', text: '部員を選択してください' }); return; }
    const result = updateProfilePin(pinTargetId, newPin);
    if (result.success) {
      setPinMsg({ type: 'ok', text: `PINを変更しました` });
      setNewPin('');
      setTimeout(() => setPinMsg(null), 3000);
    } else {
      setPinMsg({ type: 'err', text: result.error || '変更失敗' });
    }
  };

  const toggleNewMember = (id: string) => {
    const all = getUsers(true);
    saveUsers(all.map(u => u.id === id ? { ...u, isNewMember: !u.isNewMember } : u));
    refreshData();
  };

  const handleReadingChange = (id: string, reading: string) => {
    updateUserReading(id, reading);
    setUsers(users.map(u => u.id === id ? { ...u, reading } : u));
  };

  // ──────────────────────────────────────────────────────────
  // EVENT WIZARD
  // ──────────────────────────────────────────────────────────
  const openEventWizard = () => {
    setWName(settings.eventName || '');
    setWType(EventType.STANDARD);
    setWDuration(7);
    setWRedGeneral(null);
    setWWhiteGeneral(null);
    setWSimData(null);
    setWizardStep(1);
    setIsEventWizardOpen(true);
  };

  const handleTeamBalance = () => setWSimData(getFactionBalanceSimulation(users));

  const finishEventSetup = async () => {
    if (wType === EventType.FACTION_WAR) {
      if (!wRedGeneral || !wWhiteGeneral) { alert('大将を決定してください'); return; }
      if (!wSimData) { alert('チーム編成を実行してください'); return; }

      // ── 1. ファクション割り当て（全員 RED or WHITE を明示的にセット）──
      const allForFaction = getUsers(true).map(u => ({
        ...u,
        faction: wSimData.redUsers.some(r => r.id === u.id) ? 'RED' as const : 'WHITE' as const,
      }));
      saveUsers(allForFaction);

      // ── 2. 大将任命（getRawUsers で最新のファクション済みデータを使用）──
      assignGenerals(wRedGeneral, wWhiteGeneral);
    }

    // ── 3. イベント設定を保存 ──
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + wDuration);
    // 最新の settings を読み直して上書きリスクを回避
    const latestSettings = getSettings();
    saveSettings({ ...latestSettings, eventName: wName, eventEndsAt: endsAt.toISOString(), eventType: wType });

    // ── 4. イベントポイントをリセット ──
    resetEventPoints();

    // ── 5. 即時クラウド同期（デバウンスをスキップして他端末に即反映）──
    await manualSync();

    refreshData();
    setIsEventWizardOpen(false);
  };

  const handleStopEvent = () => {
    if (window.confirm('イベントを強制終了しますか？')) {
      saveSettings({ ...settings, eventEndsAt: null });
      refreshData();
    }
  };

  // ──────────────────────────────────────────────────────────
  // ADJUSTMENTS
  // ──────────────────────────────────────────────────────────
  const handleAdjustmentApply = () => {
    if (!adjUser) return;
    setIsProcessing(true);
    if (adjMode === 'POINT') { manualPointAdjustment(adjUser, adjValue, adjReason); setSuccessMsg(`${adjValue}pt付与`); }
    else { manualRateAdjustment(adjUser, adjValue, adjReason); setSuccessMsg(`レート${adjValue >= 0 ? '+' : ''}${adjValue}`); }
    refreshData();
    setTimeout(() => { setIsProcessing(false); setSuccessMsg(null); }, 2000);
  };

  // ──────────────────────────────────────────────────────────
  // SYNC
  // ──────────────────────────────────────────────────────────
  const handleManualSync = async () => {
    setIsSyncing(true);
    const ok = await manualSync();
    setSyncMeta(getSyncStatus());
    setIsSyncing(false);
    if (!ok) alert('同期に失敗しました。ネットワーク接続を確認してください。\nデータはローカルには保存されています。');
    else { refreshData(); }
  };

  // ──────────────────────────────────────────────────────────
  // BACKUP
  // ──────────────────────────────────────────────────────────
  const handleExport = () => {
    const json = exportData();
    setBackupText(json);
    setShowBackupArea(true);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (window.confirm('現在のすべてのデータを上書きして復元しますか？この操作は元に戻せません。')) {
        const ok = importData(content);
        if (ok) { alert('復元しました。'); refreshData(); window.location.reload(); }
        else alert('ファイルの形式が正しくありません。');
      }
    };
    reader.readAsText(file);
    if (importFileRef.current) importFileRef.current.value = '';
  };

  const handleTextImport = () => {
    if (!backupText) return;
    if (window.confirm('現在のすべてのデータを上書きして復元しますか？')) {
      const ok = importData(backupText);
      if (ok) { alert('復元しました。'); window.location.reload(); }
      else alert('データの形式が正しくありません。');
    }
  };

  const handleAutoBackupRestore = (entry: AutoBackupEntry) => {
    setRestoringKey(entry.key);
    if (window.confirm(
      `${entry.date} のバックアップから復元しますか？\n` +
      `部員数: ${entry.userCount}名 / 対局数: ${entry.matchCount}件\n\n` +
      `現在のデータは上書きされます。`
    )) {
      const ok = restoreFromAutoBackup(entry.key);
      if (ok) { alert('復元しました。'); window.location.reload(); }
      else alert('復元に失敗しました。');
    }
    setRestoringKey(null);
  };

  // ──────────────────────────────────────────────────────────
  // SYNC STATUS UI
  // ──────────────────────────────────────────────────────────
  const SyncStatusPanel = () => {
    const { status, lastSync, pendingChanges, lastError } = syncMeta;
    const fmt = (iso: string | null) => iso
      ? new Date(iso).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : '—';

    return (
      <Card title="クラウド同期状態" icon={<Cloud size={18} />}>
        <div className="space-y-4">
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${
            status === 'SYNCED'  ? 'bg-green-900/20 border-green-700/40' :
            status === 'PENDING' ? 'bg-yellow-900/20 border-yellow-700/40' :
            status === 'SYNCING' ? 'bg-blue-900/20 border-blue-700/40' :
            status === 'ERROR'   ? 'bg-red-900/20 border-red-700/40' :
            'bg-slate-800/40 border-slate-700/40'
          }`}>
            <div>
              {status === 'SYNCED'  && <Cloud size={20} className="text-green-400" />}
              {status === 'PENDING' && <CloudOff size={20} className="text-yellow-400" />}
              {status === 'SYNCING' && <Loader size={20} className="text-blue-400 animate-spin" />}
              {status === 'ERROR'   && <AlertCircle size={20} className="text-red-400" />}
              {status === 'NEVER'   && <CloudOff size={20} className="text-slate-500" />}
            </div>
            <div className="flex-1">
              <div className={`font-black text-sm ${
                status === 'SYNCED'  ? 'text-green-400' :
                status === 'PENDING' ? 'text-yellow-400' :
                status === 'SYNCING' ? 'text-blue-400' :
                status === 'ERROR'   ? 'text-red-400' : 'text-slate-400'
              }`}>
                {status === 'SYNCED'  ? '同期済み' :
                 status === 'PENDING' ? `未同期 (${pendingChanges}件の変更)` :
                 status === 'SYNCING' ? '同期中...' :
                 status === 'ERROR'   ? '同期エラー' : '未同期'}
              </div>
              <div className="text-xs text-slate-500">最終同期: {fmt(lastSync)}</div>
              {status === 'ERROR' && lastError && (
                <div className="text-xs text-red-400 mt-1">{lastError}</div>
              )}
            </div>
          </div>

          {status === 'ERROR' && (
            <div className="bg-red-900/10 border border-red-700/30 rounded-xl p-3 text-xs text-red-300 font-bold">
              ⚠ クラウド保存は失敗しましたが、<span className="text-white">このデバイスのローカルデータは正常に保存されています。</span><br />
              ネット接続後に「今すぐ同期」を押してください。
            </div>
          )}

          <button
            onClick={handleManualSync}
            disabled={isSyncing || status === 'SYNCING'}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl font-bold transition-all active:scale-95"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? '同期中...' : '今すぐ同期'}
          </button>
        </div>
      </Card>
    );
  };

  // ──────────────────────────────────────────────────────────
  // AUTO BACKUP PANEL
  // ──────────────────────────────────────────────────────────
  const AutoBackupPanel = () => (
    <Card title="自動バックアップ（直近7日）" icon={<History size={18} />}>
      <div className="space-y-2">
        {autoBackups.length === 0 ? (
          <p className="text-slate-500 text-sm">バックアップはまだありません。<br />データを変更すると自動で作成されます。</p>
        ) : (
          autoBackups.map(entry => (
            <div key={entry.key} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700 gap-3">
              <div>
                <div className="font-bold text-slate-200 text-sm">{entry.date}</div>
                <div className="text-xs text-slate-500">
                  {entry.userCount}名 / 対局{entry.matchCount}件
                  {entry.timestamp && ` · ${new Date(entry.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`}
                </div>
              </div>
              <button
                onClick={() => handleAutoBackupRestore(entry)}
                disabled={restoringKey === entry.key}
                className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                <RotateCcw size={12} />
                復元
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  );

  // ──────────────────────────────────────────────────────────
  // LOGIN SCREEN
  // ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    const deviceOk = isDeviceApproved();

    // 未承認デバイス → koji → 管理者PIN → デバイス名 → 承認
    if (!deviceOk && approveStep !== 'done') {
      const handleKojiSubmit = () => {
        if (approveKoji === 'koji') { setApproveStep('adminPin'); setApproveKojiErr(false); }
        else { setApproveKojiErr(true); setTimeout(() => setApproveKojiErr(false), 1500); }
      };
      const handleAdminPinSubmit = (v: string) => {
        const s = getSettings();
        if (v === s.adminPin) { setApproveStep('label'); setApproveAdminErr(false); }
        else { setApproveAdminErr(true); setTimeout(() => { setApproveAdminErr(false); setApproveAdminPin(''); }, 600); }
      };

      return (
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <div className="glass-panel-dark w-full max-w-sm rounded-3xl border border-yellow-700/30 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-white/5 bg-yellow-900/20">
              <div className="flex items-center gap-3">
                <Lock className="text-yellow-400 shrink-0" size={24} />
                <div>
                  <h2 className="text-base font-black text-white">このデバイスを承認する</h2>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    ステップ {approveStep === 'koji' ? '1' : approveStep === 'adminPin' ? '2' : '3'} / 3
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* ステップ1: koji */}
              {approveStep === 'koji' && (
                <>
                  <p className="text-sm text-slate-300 font-bold">変更パスワードを入力してください</p>
                  <input
                    type="password"
                    value={approveKoji}
                    onChange={e => setApproveKoji(e.target.value)}
                    placeholder="変更パスワード"
                    className={`w-full p-3 rounded-xl border bg-slate-800 text-white font-bold outline-none focus:border-yellow-500 transition-colors ${approveKojiErr ? 'border-red-500' : 'border-slate-600'}`}
                    onKeyDown={e => e.key === 'Enter' && handleKojiSubmit()}
                    autoFocus
                  />
                  {approveKojiErr && <p className="text-red-400 text-xs font-bold">パスワードが違います</p>}
                  <button onClick={handleKojiSubmit}
                    className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black rounded-xl transition-all active:scale-95">
                    次へ
                  </button>
                </>
              )}
              {/* ステップ2: 管理者PIN */}
              {approveStep === 'adminPin' && (
                <>
                  <p className="text-sm text-slate-300 font-bold">管理者PINを入力してください</p>
                  <div className="flex justify-center gap-2 py-2">
                    {[0,1,2,3,4,5].map(i => (
                      <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${
                        i < approveAdminPin.length
                          ? approveAdminErr ? 'bg-red-500 border-red-500' : 'bg-yellow-400 border-yellow-400'
                          : 'border-slate-600 bg-transparent'
                      }`} />
                    ))}
                  </div>
                  {approveAdminErr && <p className="text-red-400 text-xs font-bold text-center">PINが違います</p>}
                  <NumPad
                    value={approveAdminPin}
                    onChange={v => { setApproveAdminPin(v); if (v.length === 6) handleAdminPinSubmit(v); }}
                    maxLength={6}
                  />
                </>
              )}
              {/* ステップ3: デバイス名 */}
              {approveStep === 'label' && (
                <>
                  <p className="text-sm text-slate-300 font-bold">デバイス名を入力してください</p>
                  <input
                    value={approveLabel}
                    onChange={e => setApproveLabel(e.target.value)}
                    placeholder="例：部室iPad"
                    className="w-full p-3 rounded-xl border border-slate-600 bg-slate-800 text-white font-bold outline-none focus:border-yellow-500"
                    autoFocus
                  />
                  <div className="text-[10px] text-slate-600 break-all">Token: {getOrCreateDeviceToken()}</div>
                  <button
                    onClick={() => {
                      approveThisDevice(approveLabel || '未設定');
                      refreshData();
                      setApproveStep('done');
                    }}
                    className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl transition-all active:scale-95">
                    ✅ このデバイスを承認する
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="glass-panel-dark w-full max-w-sm p-8 text-center space-y-6 rounded-3xl border border-white/10 shadow-2xl">
          <Settings className="mx-auto text-slate-500" size={48} />
          <h2 className="text-2xl font-bold text-white font-serif-jp">管理者ログイン</h2>
          <div className="space-y-3">
            <input
              type="password"
              value={pin}
              readOnly
              placeholder="管理者PIN（6桁）"
              className="w-full p-4 border border-slate-700 rounded-xl text-center text-2xl tracking-[0.5em] outline-none bg-slate-900 text-white font-mono"
              maxLength={6}
            />
            <NumPad value={pin} onChange={v => setPin(v)} maxLength={6} />
          </div>
          <button onClick={handleLogin} disabled={pin.length < 6}
            className="w-full bg-slate-200 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 py-3 rounded-xl font-bold active:scale-95 transition-transform shadow-lg">
            ログイン
          </button>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // MAIN ADMIN UI
  // ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">

      {/* ── 四天王更新確認モーダル ───────────────────────────── */}
      {kingsConfirm && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4">
          <div className="bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-yellow-500/30 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-900/60 to-amber-900/40 p-6 border-b border-yellow-500/20">
              <h3 className="text-xl font-black text-yellow-300 flex items-center gap-2"><Crown size={22}/> 四天王 更新確認</h3>
              <p className="text-xs text-yellow-700 mt-1 font-bold">以下の内容で四天王称号を更新します。同スコアは全員選出されます。</p>
            </div>
            <div className="p-6 space-y-3">
              {[
                { icon: '⚔️', label: '覇者（今期レート上昇）', names: kingsConfirm.masters },
                { icon: '🌟', label: '新星（今期ポイント上昇）', names: kingsConfirm.risings },
                { icon: '🛡️', label: '鉄人（出席日数）',         names: kingsConfirm.grinders },
                { icon: '💀', label: '巨人キラー（格上撃破）',   names: kingsConfirm.killers },
              ].map(row => (
                <div key={row.label} className="flex items-start gap-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                  <span className="text-xl shrink-0">{row.icon}</span>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.label}</div>
                    <div className="text-sm font-black text-white mt-0.5">
                      {row.names.length > 0 ? row.names.join(' ・ ') : <span className="text-slate-500">対象なし</span>}
                    </div>
                    {row.names.length > 1 && <div className="text-[9px] text-yellow-500 font-bold mt-0.5">⚠ 同スコア: {row.names.length}名全員選出</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setKingsConfirm(null)} className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-black transition-all">キャンセル</button>
              <button onClick={() => { awardSystemTitles(); refreshData(); setKingsConfirm(null); }}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-900 font-black shadow-lg transition-all">
                ✓ この内容で更新
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Preview Modal */}
      {csvPreview && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4">
          <div className="bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/10">
            <div className="bg-slate-800 text-white p-6 flex justify-between items-center border-b border-white/10">
              <h3 className="text-xl font-black flex items-center gap-2"><FileUp size={24} className="text-blue-400" /> 一括登録の確認</h3>
              <button onClick={() => setCsvPreview(null)} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><X /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-sm text-slate-400 mb-4 font-bold">{csvPreview.length}名を追加します。</p>
              <div className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800 text-slate-400 font-bold">
                    <tr><th className="px-4 py-3">名前</th><th className="px-4 py-3">読み</th><th className="px-4 py-3 text-center">区分</th></tr>
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
              <button onClick={() => setCsvPreview(null)} className="px-6 py-3 rounded-xl font-bold text-slate-400">キャンセル</button>
              <button onClick={confirmBulkAdd} className="bg-blue-600 text-white px-10 py-3 rounded-xl font-black active:scale-95">追加を実行</button>
            </div>
          </div>
        </div>
      )}

      {/* Event Wizard */}
      {isEventWizardOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
          <div className="bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white/10">
            <div className="bg-slate-800 text-white p-6 flex justify-between items-center border-b border-white/10">
              <h3 className="text-xl font-black flex items-center gap-2"><Calendar /> イベント設定</h3>
              <button onClick={() => setIsEventWizardOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><X /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {wizardStep === 1 && (
                <>
                  <div><label className="block text-sm font-bold text-slate-400 mb-2">イベント名</label>
                    <input type="text" value={wName} onChange={e => setWName(e.target.value)} className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white font-bold" /></div>
                  <div>
                    <label className="block text-sm font-bold text-slate-400 mb-2">タイプ</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setWType(EventType.STANDARD)} className={`p-4 rounded-xl border text-left ${wType === EventType.STANDARD ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700'}`}><div className="font-bold">通常強化</div></button>
                      <button onClick={() => setWType(EventType.FACTION_WAR)} className={`p-4 rounded-xl border text-left ${wType === EventType.FACTION_WAR ? 'border-red-500 bg-red-900/20' : 'border-slate-700'}`}><div className="font-bold text-red-400">紅白戦</div></button>
                    </div>
                  </div>
                  <div><label className="block text-sm font-bold text-slate-400 mb-2">期間(日)</label>
                    <input type="number" value={wDuration} onChange={e => setWDuration(Number(e.target.value))} className="w-24 p-3 border border-slate-700 rounded-xl bg-slate-800 text-white font-bold text-center" /></div>
                </>
              )}
              {wizardStep === 2 && (
                <div className="space-y-6">
                  <h4 className="text-lg font-bold text-white text-center">戦力シミュレーション</h4>
                  {!wSimData ? (
                    <button onClick={handleTeamBalance} className="w-full bg-indigo-600 text-white py-12 rounded-2xl font-black text-xl flex flex-col items-center justify-center gap-4 shadow-xl active:scale-95 transition-all">
                      <Shuffle size={48} /><span>自動チーム編成を実行</span>
                    </button>
                  ) : (
                    <div className="space-y-4">
                      {wSimData.redStats.count !== wSimData.whiteStats.count && (
                        <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-700/40 rounded-xl px-3 py-2 text-center font-bold">
                          ⚠ 部員数が奇数のため紅組が1人多くなります
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-red-900/20 border border-red-900/50 p-4 rounded-2xl">
                          <div className="text-red-500 font-black mb-2 flex items-center gap-2"><Users size={16}/> 紅組</div>
                          <div className="text-xs text-slate-400">人数: {wSimData.redStats.count}人</div>
                          <div className="text-xs text-slate-400">平均Rate: {wSimData.redStats.avgRate}</div>
                        </div>
                        <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-2xl">
                          <div className="text-blue-400 font-black mb-2 flex items-center gap-2"><Users size={16}/> 白組</div>
                          <div className="text-xs text-slate-400">人数: {wSimData.whiteStats.count}人</div>
                          <div className="text-xs text-slate-400">平均Rate: {wSimData.whiteStats.avgRate}</div>
                        </div>
                      </div>
                      <button onClick={handleTeamBalance} className="w-full py-3 rounded-xl font-bold text-slate-400 border border-slate-700 hover:bg-white/5 flex items-center justify-center gap-2">
                        <RefreshCw size={16} /> 再シャッフル
                      </button>
                    </div>
                  )}
                </div>
              )}
              {wizardStep === 3 && (
                <div className="space-y-6">
                  <h4 className="text-lg font-bold text-white text-center">大将任命</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setWSelectingTarget('RED')} className={`p-4 rounded-2xl border flex flex-col items-center justify-center h-32 ${wRedGeneral ? 'border-red-500 bg-red-900/20' : 'border-dashed border-red-900/50'}`}>
                      {wRedGeneral ? (<div className="text-center"><Crown className="mx-auto mb-2 text-yellow-500" /><div className="font-black text-red-400">{users.find(u => u.id === wRedGeneral)?.name}</div></div>) : (<div className="text-slate-600 font-bold text-sm">紅組大将を選択</div>)}
                    </button>
                    <button onClick={() => setWSelectingTarget('WHITE')} className={`p-4 rounded-2xl border flex flex-col items-center justify-center h-32 ${wWhiteGeneral ? 'border-blue-500 bg-blue-900/20' : 'border-dashed border-slate-700'}`}>
                      {wWhiteGeneral ? (<div className="text-center"><Crown className="mx-auto mb-2 text-yellow-500" /><div className="font-black text-blue-400">{users.find(u => u.id === wWhiteGeneral)?.name}</div></div>) : (<div className="text-slate-600 font-bold text-sm">白組大将を選択</div>)}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-white/5 bg-slate-950 flex justify-end gap-3">
              {wizardStep === 1 && <button onClick={() => wType === EventType.FACTION_WAR ? setWizardStep(2) : finishEventSetup()} className="bg-slate-200 text-slate-900 px-8 py-3 rounded-xl font-bold flex items-center gap-2">次へ <ChevronRight size={16} /></button>}
              {wizardStep === 2 && <button onClick={() => setWizardStep(3)} disabled={!wSimData} className="bg-slate-200 disabled:bg-slate-800 disabled:text-slate-600 text-slate-900 px-8 py-3 rounded-xl font-bold flex items-center gap-2">次へ <ChevronRight size={16} /></button>}
              {wizardStep === 3 && <button onClick={finishEventSetup} className="bg-slate-200 text-slate-900 px-8 py-3 rounded-xl font-bold flex items-center gap-2"><Swords size={18}/> イベント開始</button>}
            </div>
          </div>
        </div>
      )}
      {wSelectingTarget && (
        // z-[700]: イベントウィザード(z-[600])より上に表示するためラッパーで引き上げる
        <div className="relative z-[700]">
          <UserSelector
            users={wSimData ? (wSelectingTarget === 'RED' ? wSimData.redUsers : wSimData.whiteUsers) : users}
            onSelect={id => { if (wSelectingTarget === 'RED') setWRedGeneral(id); else setWWhiteGeneral(id); setWSelectingTarget(null); }}
            onClose={() => setWSelectingTarget(null)}
            title={`${wSelectingTarget === 'RED' ? '紅組' : '白組'}大将を選択`}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2"><Settings size={32} className="text-white" /><h2 className="text-3xl font-black text-white font-serif-jp">管理パネル</h2></div>
          <p className="text-slate-400 font-bold">部員の管理とイベント設定</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openEventWizard} className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg ${activeEvent ? 'bg-orange-600' : 'bg-blue-600'}`}>
            {activeEvent ? 'イベント変更' : 'イベント開始'}
          </button>
          {activeEvent && <button onClick={handleStopEvent} className="px-4 py-3 rounded-xl font-bold bg-slate-800 text-red-400 border border-red-900/50">停止</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* ── 列1 ── */}
        <div className="space-y-6">
          {/* Active Member List */}
          <Card title="在籍部員" icon={<Users />}>
            <div className="space-y-4">
              {/* Add form */}
              <div className="space-y-3 p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="名前（例：秀村 紘嗣）" className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                  <input type="text" value={newReading} onChange={e => setNewReading(e.target.value)} placeholder="読み（例：ひでむら ひろし）" className="w-full p-3 border border-slate-700 rounded-xl bg-slate-800 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                  <button onClick={handleAddUser} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-500 flex items-center justify-center gap-2 md:col-span-1">
                    <Plus size={20} /> 追加
                  </button>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><Languages size={10}/> 読みはひらがなで入力（五十音順ソート用）</p>
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs font-bold border border-slate-700">
                    <FileUp size={16} className="text-blue-400" /> CSVで一括追加
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleCsvUpload} accept=".csv" className="hidden" />
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3 scrollbar-hide">
                {users.length === 0 && <p className="text-slate-500 text-sm text-center py-4">部員がいません</p>}
                {users.map(u => (
                  <div key={u.id} className="flex flex-col p-4 bg-slate-800 rounded-2xl border border-slate-700 gap-3 group hover:border-slate-500 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${u.avatarColor} flex items-center justify-center text-white font-black text-lg font-serif-jp shadow-inner`}>{u.name.charAt(0)}</div>
                        <div>
                          <div className="font-bold text-slate-100">{u.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">Rate: {Math.round(u.rate)} / {u.wins}勝{u.losses}敗</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleNewMember(u.id)} className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${u.isNewMember ? 'bg-green-900/30 text-green-400 border-green-600' : 'bg-slate-900 text-slate-500 border-slate-700'}`}>
                          {u.isNewMember ? '🔰 新入' : '一般'}
                        </button>
                        {/* ★ Soft delete button */}
                        <button onClick={() => handleDeactivateUser(u.id, u.name)} className="text-slate-500 hover:text-yellow-500 p-2 transition-colors" title="休眠（データ保持）">
                          <UserX size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-2">
                      <Languages size={14} className="text-slate-500 shrink-0" />
                      <input type="text" value={u.reading || ''} onChange={e => handleReadingChange(u.id, e.target.value)} placeholder="読みを入力..."
                        className={`flex-1 bg-slate-900/50 border ${u.reading ? 'border-slate-700 text-slate-300' : 'border-orange-500/50 text-orange-200'} rounded-lg px-3 py-1.5 text-xs font-bold focus:border-blue-500 outline-none`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* 部員表示順カスタム */}
          <Card title="部員表示順（ドラッグで並び替え）" icon={<Users className="text-indigo-400" size={18} />}>
            <div className="space-y-2">
              <p className="text-xs text-slate-500 font-bold">上に表示されるほど、同率タイ時にランキングで上位になります。新入生を上に設定することを推奨。</p>
              <div className="space-y-1">
                {(() => {
                  const order = settings.memberOrder ?? [];
                  const sorted = [...users].sort((a, b) => {
                    const ai = order.indexOf(a.id); const bi = order.indexOf(b.id);
                    if (ai === -1 && bi === -1) return 0;
                    if (ai === -1) return 1; if (bi === -1) return -1;
                    return ai - bi;
                  });
                  return sorted.map((u, i) => (
                    <div
                      key={u.id}
                      draggable
                      onDragStart={() => setDragIdx(i)}
                      onDragOver={e => { e.preventDefault(); setDragOver(i); }}
                      onDrop={() => {
                        if (dragIdx === null || dragIdx === i) return;
                        const arr = [...sorted];
                        const [moved] = arr.splice(dragIdx, 1);
                        arr.splice(i, 0, moved);
                        const newOrder = arr.map(x => x.id);
                        setSettings(s => ({ ...s, memberOrder: newOrder }));
                        saveSettings({ ...settings, memberOrder: newOrder });
                        setDragIdx(null); setDragOver(null);
                      }}
                      onDragEnd={() => { setDragIdx(null); setDragOver(null); }}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl border cursor-grab active:cursor-grabbing transition-all ${dragOver === i ? 'border-indigo-500 bg-indigo-900/20' : 'border-slate-700 bg-slate-800/40'} ${dragIdx === i ? 'opacity-40' : ''}`}
                    >
                      <span className="text-slate-600 font-black text-xs w-5 text-right shrink-0">{i + 1}</span>
                      <span className="text-xs font-black text-white flex-1">{u.name}</span>
                      {u.isNewMember && <span className="text-[9px] bg-green-900/40 text-green-400 border border-green-700/30 px-1.5 py-0.5 rounded font-bold">新入班員</span>}
                      <span className="text-slate-600 text-xs">⠿</span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </Card>

          {/* ★ Inactive / Re-join panel */}
          {inactiveUsers.length > 0 && (
            <Card title={`休眠中の部員 (${inactiveUsers.length}名)`} icon={<UserX className="text-yellow-500" size={18} />}>
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
                {inactiveUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700 gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${u.avatarColor} opacity-50 flex items-center justify-center text-white font-black text-base font-serif-jp`}>{u.name.charAt(0)}</div>
                      <div>
                        <div className="font-bold text-slate-400">{u.name}</div>
                        <div className="text-[10px] text-slate-600">Rate: {Math.round(u.rate)} / {u.wins}勝{u.losses}敗 / {u.activityDays}日</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleReactivateUser(u.id, u.name)}
                      className="flex items-center gap-1 bg-green-900/30 hover:bg-green-700/40 text-green-400 border border-green-700/40 px-3 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95"
                    >
                      <UserCheck size={14} /> 再入班
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* ── 列2 ── */}
        <div className="space-y-6">
          {/* ── ランク申請承認 ── */}
          <Card title={`段位・級位の申請`} icon={<Medal className="text-purple-400" size={18} />} badge={rankApps.length > 0 ? rankApps.length : undefined}>
            <div className="space-y-3">
              {rankApps.length === 0 ? (
                <p className="text-slate-500 text-sm font-bold py-2">承認待ちの申請はありません。</p>
              ) : (
                rankApps.map(app => (
                  <div key={app.id} className="p-4 bg-slate-800/60 border border-slate-700 rounded-2xl space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black text-white">{app.userName}</div>
                        <div className="text-sm text-purple-300 font-bold mt-0.5">
                          {app.source} <span className="text-white">→ {app.rank}</span>
                        </div>
                        {app.note && <div className="text-xs text-slate-400 mt-1">💬 {app.note}</div>}
                        <div className="text-[10px] text-slate-600 mt-1">
                          {new Date(app.submittedAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRank(app.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-green-700 hover:bg-green-600 text-white py-2 rounded-xl font-black text-sm transition-all active:scale-[0.97]"
                      >
                        <Check size={14} /> 承認
                      </button>
                      <button
                        onClick={() => handleRejectRank(app.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-700/40 py-2 rounded-xl font-black text-sm transition-all active:scale-[0.97]"
                      >
                        <X size={14} /> 却下
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="却下理由（任意）"
                      value={rejectNote[app.id] || ''}
                      onChange={e => setRejectNote(prev => ({ ...prev, [app.id]: e.target.value }))}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 font-bold focus:border-red-500 outline-none"
                    />
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Approved Rank Management */}
          <Card title="承認済みランクの管理" icon={<Medal className="text-rose-400" size={18} />}>
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-bold">承認済みのランクを誤って通した場合はここで削除できます。削除するとFirebaseにも即座に反映されます。</p>
              {getUsers(true).filter(u => (u.ranks || []).length > 0).length === 0 ? (
                <p className="text-slate-500 text-sm font-bold py-2">承認済みのランクはありません。</p>
              ) : (
                getUsers(true).filter(u => (u.ranks || []).length > 0).map(u => (
                  <div key={u.id} className="p-4 bg-slate-800/60 border border-slate-700 rounded-2xl space-y-2">
                    <div className="font-black text-white text-sm">{u.name}</div>
                    {(u.ranks || []).map(rank => (
                      <div key={rank.id} className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-700/50 rounded-xl px-3 py-2">
                        <div>
                          <span className="text-purple-300 font-bold text-sm">{rank.source}</span>
                          <span className="text-white font-black text-sm mx-2">→</span>
                          <span className="text-white font-bold text-sm">{rank.rank}</span>
                          <div className="text-[10px] text-slate-600 mt-0.5">承認: {new Date(rank.approvedAt).toLocaleDateString('ja-JP')}</div>
                        </div>
                        <button
                          onClick={() => {
                            if (!confirm(`${u.name} の「${rank.source} ${rank.rank}」を削除しますか？`)) return;
                            removeRank(u.id, rank.id);
                            alert('削除しFirebaseに反映しました。');
                          }}
                          className="flex items-center gap-1 bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-700/40 px-3 py-1.5 rounded-lg font-black text-xs transition-all active:scale-[0.97] shrink-0"
                        >
                          <Trash2 size={12} /> 削除
                        </button>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Attendance Deletion */}
          <Card title="出席記録の削除" icon={<Calendar className="text-green-400" size={18} />}>
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-bold">誤った出席記録を削除します。ポイントとactivityDaysが巻き戻ります。</p>
              {(() => {
                const attendanceLogs = getLogs()
                  .filter(l => l.type === ActivityType.ATTENDANCE)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 50);
                if (attendanceLogs.length === 0) {
                  return <p className="text-slate-500 text-sm font-bold py-2">出席記録がありません。</p>;
                }
                return (
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {attendanceLogs.map(log => {
                      const u = getUsers(true).find(u => u.id === log.userId);
                      return (
                        <div key={log.id} className="flex items-center justify-between gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2">
                          <div>
                            <span className="text-green-300 font-bold text-sm">{u?.name ?? '不明'}</span>
                            <span className="text-slate-400 text-xs ml-2">+{log.points}pt</span>
                            <div className="text-[10px] text-slate-600 mt-0.5">
                              {new Date(log.date).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (!confirm(`${u?.name ?? '不明'} の出席記録を削除しますか？`)) return;
                              const res = deleteAttendanceLog(log.id);
                              alert(res.message);
                              refreshData();
                            }}
                            className="flex items-center gap-1 bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-700/40 px-3 py-1.5 rounded-lg font-black text-xs transition-all active:scale-[0.97] shrink-0"
                          >
                            <Trash2 size={12} /> 削除
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </Card>

          {/* Achievement Deletion */}
          <Card title="称号の削除" icon={<Star className="text-yellow-400" size={18} />}>
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-bold">誤って付与された称号を剥奪します。表示中の称号だった場合は自動でリセットされます。</p>
              {getUsers(true).filter(u => (u.achievements || []).length > 0).length === 0 ? (
                <p className="text-slate-500 text-sm font-bold py-2">称号を持つ部員がいません。</p>
              ) : (
                <div className="space-y-3">
                  {getUsers(true).filter(u => (u.achievements || []).length > 0).map(u => (
                    <div key={u.id} className="p-4 bg-slate-800/60 border border-slate-700 rounded-2xl space-y-2">
                      <div className="font-black text-white text-sm">{u.name}</div>
                      <div className="flex flex-wrap gap-2">
                        {(u.achievements || []).map(achId => {
                          const ach = ACHIEVEMENTS_DATA.find(a => a.id === achId);
                          if (!ach) return null;
                          return (
                            <div key={achId} className="flex items-center gap-1 bg-slate-900 border border-slate-700/50 rounded-lg px-2 py-1">
                              <span className="text-yellow-300 text-xs font-bold">{ach.name}</span>
                              <button
                                onClick={() => {
                                  if (!confirm(`${u.name} の「${ach.name}」を削除しますか？`)) return;
                                  removeAchievement(u.id, achId);
                                  alert('削除しました');
                                  refreshData();
                                }}
                                className="text-slate-600 hover:text-red-400 transition-colors ml-1"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Season & Titles */}
          <Card title="シーズン・称号" icon={<Crown className="text-yellow-500" />}>
            <div className="space-y-6">
              <div className="border-b border-white/5 pb-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">現在のシーズン</label>
                <select className="w-full p-4 border border-slate-600 rounded-xl font-bold bg-slate-900 text-white appearance-none cursor-pointer"
                  value={settings.currentSeason} onChange={handleSeasonChange}>
                  {Object.values(Season).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {/* シーズン終了日 */}
              <div className="border-t border-white/5 pt-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
                  シーズン終了予定日
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={settings.seasonEndsAt ? settings.seasonEndsAt.split('T')[0] : ''}
                    onChange={e => setSettings(s => ({ ...s, seasonEndsAt: e.target.value ? new Date(e.target.value).toISOString() : null }))}
                    className="flex-1 p-3 border border-slate-700 rounded-xl font-bold bg-slate-900 text-white focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={() => { saveSettings(settings); alert('シーズン終了日を保存しました。'); }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-black text-sm transition-all"
                  >
                    保存
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 mt-1.5">設定すると部員の個人ページに「残り○日」が表示されます</p>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-sm text-slate-400 mb-4">成長度・対局数に基づき四天王称号を再計算します。</p>
                {maintActive ? (
                  <div className="w-full py-3 rounded-xl bg-slate-700/50 border border-orange-500/30 text-center text-orange-400 text-sm font-bold">
                    ⚠ メンテナンスモード中は更新できません
                  </div>
                ) : (
                  <button onClick={handleUpdateTitles} className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 text-white py-3 rounded-xl font-black shadow-lg active:scale-[0.98]">称号を更新する</button>
                )}
              </div>
              {/* 四天王履歴クリア */}
              <div className="pt-3 border-t border-red-900/30">
                <p className="text-xs text-slate-600 mb-2">⚠ テスト・誤操作時のリセット専用。全履歴と永続称号が消えます。</p>
                <button
                  onClick={() => {
                    if (window.confirm('四天王の全履歴と永続称号をリセットします。この操作は取り消せません。本当に実行しますか？')) {
                      clearSystemTitleHistory();
                      refreshData();
                    }
                  }}
                  className="w-full py-2 rounded-xl bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs font-black border border-red-900/40 transition-all"
                >
                  🗑 四天王履歴をすべて削除
                </button>
              </div>
              {settings.lastTitleUpdate && (
                <div className="text-xs text-slate-600 text-center">最終更新: {new Date(settings.lastTitleUpdate).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              )}
            </div>
          </Card>

        </div>{/* ── 列2 終 ── */}

        {/* ── 列3 ── */}
        <div className="space-y-6">

          {/* PIN Management */}
          <Card title="個人ページPIN管理" icon={<KeyRound className="text-amber-400" size={18} />}>
            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-bold leading-relaxed">
                個人ページは部員ごとの6桁PINで保護されています。<br/>
                初期PINは <span className="text-white font-black">000000</span> です。初期値のままの部員は対局できません。
              </p>
              {pinMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-bold ${pinMsg.type === 'ok' ? 'bg-green-900/20 border-green-700/40 text-green-300' : 'bg-red-900/20 border-red-700/40 text-red-300'}`}>
                  {pinMsg.type === 'ok' ? <Check size={14}/> : <X size={14}/>}
                  {pinMsg.text}
                </div>
              )}
              <select
                className="w-full p-3 border border-slate-700 rounded-xl font-bold bg-slate-900 text-white"
                value={pinTargetId}
                onChange={e => { setPinTargetId(e.target.value); setNewPin(''); setPinMsg(null); }}
              >
                <option value="">部員を選択...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}（現在のPIN: {u.profilePin ?? '000000'}）{(u.profilePin ?? '000000') === '000000' ? ' ⚠未変更' : ''}</option>
                ))}
              </select>
              {pinTargetId && (
                <>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">新しいPIN（6桁）</label>
                    <input
                      type="text"
                      value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/\D/g,'').slice(0,6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full p-3 border border-slate-700 rounded-xl font-mono text-2xl tracking-[0.5em] text-center bg-slate-800 text-white focus:border-amber-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={handlePinChange}
                    disabled={newPin.length < 6}
                    className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl font-black transition-all active:scale-[0.98]"
                  >
                    PINを変更する
                  </button>
                </>
              )}
            </div>
          </Card>

          {/* Manual Adjustment */}
          <Card title="手動ポイント調整" icon={<Plus className="text-blue-400" />}>
            <div className="space-y-4">
              <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                <button onClick={() => setAdjMode('POINT')} className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${adjMode === 'POINT' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500'}`}>ポイント</button>
                <button onClick={() => setAdjMode('RATE')}  className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all ${adjMode === 'RATE'  ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}>レート</button>
              </div>
              <select className="w-full p-3 border border-slate-700 rounded-xl font-bold bg-slate-900 text-white" value={adjUser} onChange={e => setAdjUser(e.target.value)}>
                <option value="">対象を選択...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="number" value={adjValue} onChange={e => setAdjValue(Number(e.target.value))} className="w-24 p-3 border border-slate-700 rounded-xl font-bold text-center bg-slate-900 text-white" />
                <input type="text" value={adjReason} onChange={e => setAdjReason(e.target.value)} className="flex-1 p-3 border border-slate-700 rounded-xl font-bold bg-slate-900 text-white" placeholder="理由" />
              </div>
              <button onClick={handleAdjustmentApply} disabled={!adjUser || isProcessing}
                className={`w-full text-slate-900 py-4 rounded-xl font-black transition-all relative overflow-hidden ${adjMode === 'POINT' ? 'bg-amber-400 hover:bg-amber-300' : 'bg-blue-400 hover:bg-blue-300'} disabled:opacity-50`}>
                {isProcessing ? '処理中...' : '反映'}
                {successMsg && <div className="absolute inset-0 bg-green-500 text-white flex items-center justify-center font-bold"><CheckCircle size={20} className="mr-2"/> {successMsg}</div>}
              </button>
              <button onClick={() => { if (window.confirm('月次ポイントをリセットしますか？')) { resetMonthly(); refreshData(); } }}
                className="w-full p-3 border border-slate-700 rounded-xl font-bold text-slate-400 flex items-center justify-center gap-3 hover:bg-white/5">
                <History size={18}/> 今月のポイントをリセット
              </button>
            </div>
          </Card>

          {/* Sync Status */}
          <SyncStatusPanel />

          {/* Auto Backups */}
          <AutoBackupPanel />

          {/* Manual Backup / Restore */}
          {/* ===== デバイス承認管理 ===== */}
          <Card title="承認済みデバイス管理" icon={<Lock size={18} />}>
            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-bold">
                出席登録・対局記録は承認済みデバイスからのみ操作できます。<br/>
                このデバイスを承認するには、変更パスワードが必要です。
              </p>

              {/* このデバイスを承認 */}
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 space-y-3">
                <div className="text-xs font-black text-slate-300 uppercase tracking-widest">このデバイスを承認する</div>
                <div className="space-y-2">
                  <input
                    value={newDeviceLabel}
                    onChange={e => setNewDeviceLabel(e.target.value)}
                    placeholder="デバイス名（例：部室iPad）"
                    className="w-full bg-slate-700 text-white text-sm font-bold px-3 py-2 rounded-lg border border-slate-600 outline-none focus:border-yellow-500"
                  />
                  <input
                    type="password"
                    value={kojiPass}
                    onChange={e => { setKojiPass(e.target.value); setKojiErr(false); }}
                    placeholder="変更パスワード"
                    className={`w-full bg-slate-700 text-white text-sm font-bold px-3 py-2 rounded-lg border outline-none focus:border-yellow-500 ${kojiErr ? 'border-red-500' : 'border-slate-600'}`}
                  />
                  {kojiErr && <p className="text-xs text-red-400 font-bold">パスワードが間違っています</p>}
                  <button
                    onClick={() => {
                      if (kojiPass !== 'koji') { setKojiErr(true); return; }
                      approveThisDevice(newDeviceLabel || '未設定');
                      refreshData();
                      setKojiPass('');
                      alert('✅ このデバイスを承認しました');
                    }}
                    className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black rounded-lg text-sm transition-all active:scale-95"
                  >
                    承認
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 font-bold break-all">
                  Token: {getOrCreateDeviceToken()}
                </div>
              </div>

              {/* 承認済みデバイス一覧 */}
              <div className="space-y-2">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest">承認済みデバイス一覧</div>
                {approvedDevices.length === 0 ? (
                  <p className="text-slate-500 text-sm py-3 text-center">承認済みデバイスなし</p>
                ) : (
                  approvedDevices.map(d => {
                    const isThis = d.token === getOrCreateDeviceToken();
                    return (
                      <div key={d.token} className={`flex items-center justify-between p-3 rounded-xl border ${isThis ? 'border-yellow-500/40 bg-yellow-900/10' : 'border-slate-700 bg-slate-800/40'}`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white">{d.label}</span>
                            {isThis && <span className="text-[9px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded font-bold">このデバイス</span>}
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                            承認日: {new Date(d.approvedAt).toLocaleDateString('ja-JP')}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (window.confirm(`「${d.label}」の承認を取り消しますか？`)) {
                              revokeDevice(d.token);
                              refreshData();
                            }
                          }}
                          className="text-slate-500 hover:text-red-400 transition-colors p-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </Card>

          <Card title="バックアップ・復元" icon={<Download />}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleExport}
                  className="w-full p-3 border border-blue-900 rounded-xl font-bold text-blue-400 flex items-center justify-center gap-2 hover:bg-blue-900/10">
                  <Download size={18}/> JSONエクスポート
                </button>
                <button onClick={() => importFileRef.current?.click()}
                  className="w-full p-3 border border-green-900 rounded-xl font-bold text-green-400 flex items-center justify-center gap-2 hover:bg-green-900/10">
                  <Upload size={18}/> ファイルから復元
                </button>
                <input type="file" ref={importFileRef} onChange={handleFileImport} accept=".json,.txt" className="hidden" />
              </div>

              {showBackupArea && (
                <div className="mt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">JSON Data</label>
                    <button onClick={() => setShowBackupArea(false)} className="text-slate-500 hover:text-white"><X size={14}/></button>
                  </div>
                  <textarea className="w-full h-32 p-3 text-xs font-mono border border-slate-700 rounded-xl bg-slate-950 text-white focus:border-blue-500 outline-none"
                    placeholder="復元する場合はJSONを貼り付けてください..."
                    value={backupText} onChange={e => setBackupText(e.target.value)} />
                  <div className="flex gap-2">
                    <button onClick={async () => { if(!backupText) return; await navigator.clipboard.writeText(backupText); alert('コピーしました'); }}
                      className="flex-1 text-xs text-blue-400 font-bold underline bg-blue-900/10 py-2 rounded-lg">コピー</button>
                    <button onClick={handleTextImport} disabled={!backupText}
                      className="flex-1 text-xs text-green-400 font-black bg-green-900/20 py-2 rounded-lg border border-green-900/50 disabled:opacity-30">このデータで復元</button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Maintenance Mode */}
          <MaintenancePanel onModeChange={setMaintActive} />
        </div>{/* ── 列3 終 ── */}
      </div>
    </div>
  );
};

export default Admin;
