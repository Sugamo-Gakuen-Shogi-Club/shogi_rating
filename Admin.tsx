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
  // ★ 新機能: Undo & Maintenance
  peekUndo, undoLastAction, getUndoStack,
  startMaintenanceMode, endMaintenanceMode, getMaintenanceMeta, checkMaintenanceBackupStatus,
} from './storage';
import { User, SystemSettings, Season, EventType, SyncMeta, AutoBackupEntry, UndoEntry, MaintenanceMeta } from './types';
import { Card } from './Card';
import { NumPad } from './NumPad';
import {
  Settings, Trash2, Plus, Calendar, Download, History,
  CheckCircle, Shuffle, Users, Crown, ChevronRight, X,
  RefreshCw, Languages, FileUp, Upload, Swords, Cloud,
  CloudOff, AlertCircle, Loader, UserCheck, UserX, RotateCcw,
  Undo2, Wrench, ShieldCheck, AlertTriangle, Zap,
} from 'lucide-react';
import { UserSelector } from './UserSelector';

const Admin: React.FC = () => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(getSettings());
  const [users, setUsers] = useState<User[]>([]);
  const [inactiveUsers, setInactiveUsers] = useState<User[]>([]);
  const [activeEvent, setActiveEvent] = useState(false);

  // Sync state
  const [syncMeta, setSyncMeta] = useState<SyncMeta>(getSyncStatus());
  const [isSyncing, setIsSyncing] = useState(false);

  // Auto backups
  const [autoBackups, setAutoBackups] = useState<AutoBackupEntry[]>([]);
  const [restoringKey, setRestoringKey] = useState<string | null>(null);

  // Undo
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [undoInProgress, setUndoInProgress] = useState(false);

  // Maintenance mode
  const [maintenanceMeta, setMaintenanceMeta] = useState<MaintenanceMeta>(getMaintenanceMeta());
  const [maintenanceNote, setMaintenanceNote] = useState('');
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState<string | null>(null);
  const [maintenanceBackupStatus, setMaintenanceBackupStatus] = useState<{
    backupTimestamp?: string; currentUserCount?: number; backupUserCount?: number; checked?: boolean;
  } | null>(null);

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

  // Listen for maintenance mode changes
  useEffect(() => {
    const h = (e: Event) => setMaintenanceMeta((e as CustomEvent<MaintenanceMeta>).detail);
    window.addEventListener('rivals-maintenance-changed', h);
    return () => window.removeEventListener('rivals-maintenance-changed', h);
  }, []);

  const handleLogin = () => {
    if (pin === settings.adminPin) { setIsAuthenticated(true); refreshData(); }
    else { alert('PINが違います'); setPin(''); }
  };

  // ──────────────────────────────────────────────────────────
  // UNDO
  // ──────────────────────────────────────────────────────────
  const handleUndo = async () => {
    const top = undoStack[0];
    if (!top) return;
    const label = top.type === 'MATCH' ? '対局' : '出席';
    if (!window.confirm(`直近の${label}「${top.description}」を取り消しますか？\n※この操作は元に戻せません`)) return;
    setUndoInProgress(true);
    const ok = undoLastAction();
    if (ok) {
      refreshData();
      alert('取り消しました。');
    } else {
      alert('取り消しに失敗しました。');
    }
    setUndoInProgress(false);
  };

  // ──────────────────────────────────────────────────────────
  // MAINTENANCE MODE
  // ──────────────────────────────────────────────────────────
  const handleStartMaintenance = async () => {
    if (!window.confirm('メンテナンスモードを開始します。\n現在のデータをFirebaseにバックアップしてから、テスト操作を行えます。\n終了時にバックアップから復元できます。\n\n開始しますか？')) return;
    setMaintenanceLoading(true);
    setMaintenanceMsg(null);
    const result = await startMaintenanceMode(maintenanceNote);
    if (result.ok) {
      setMaintenanceMsg('✅ メンテナンス開始。Firebaseにバックアップ完了。');
      refreshData();
    } else {
      setMaintenanceMsg(`❌ バックアップ失敗: ${result.error}`);
    }
    setMaintenanceLoading(false);
  };

  const handleEndMaintenance = async (restore: boolean) => {
    const msg = restore
      ? 'メンテナンスを終了し、開始前のデータに復元しますか？\n（テスト中の変更はすべて削除されます）'
      : 'メンテナンスを終了します。\nテスト中のデータはそのまま残ります。よろしいですか？';
    if (!window.confirm(msg)) return;
    setMaintenanceLoading(true);
    setMaintenanceMsg(null);
    const result = await endMaintenanceMode(restore);
    if (result.ok) {
      setMaintenanceMsg(restore ? '✅ 復元完了。メンテナンス終了。' : '✅ メンテナンス終了（データ保持）');
      refreshData();
    } else {
      setMaintenanceMsg(`❌ 終了に失敗: ${result.error}`);
    }
    setMaintenanceLoading(false);
  };

  const handleCheckBackupStatus = async () => {
    setMaintenanceLoading(true);
    const status = await checkMaintenanceBackupStatus();
    if (status.ok) {
      setMaintenanceBackupStatus({ ...status, checked: true });
    } else {
      setMaintenanceMsg(`❌ 確認失敗: ${status.error}`);
    }
    setMaintenanceLoading(false);
  };

  const refreshData = () => {
    setUsers(getUsers());
    setInactiveUsers(getInactiveUsers());
    setSettings(getSettings());
    setActiveEvent(isEventActive());
    setSyncMeta(getSyncStatus());
    setAutoBackups(getAutoBackups());
    setUndoStack(getUndoStack());
    setMaintenanceMeta(getMaintenanceMeta());
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
    if (window.confirm('称号を現在の成績に基づいて再計算しますか？')) {
      awardSystemTitles(); // ★ Fix: was no-op
      refreshData();
      alert('称号を更新しました！');
    }
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

  const finishEventSetup = () => {
    if (wType === EventType.FACTION_WAR) {
      if (!wRedGeneral || !wWhiteGeneral) { alert('大将を決定してください'); return; }
      if (!wSimData) { alert('チーム編成を実行してください'); return; }
      const updatedUsers = getUsers(true).map(u => ({
        ...u,
        faction: wSimData.redUsers.some(r => r.id === u.id) ? 'RED' as const : 'WHITE' as const
      }));
      saveUsers(updatedUsers);
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
  // UNDO PANEL
  // ──────────────────────────────────────────────────────────
  const UndoPanel = () => {
    const top = undoStack[0] ?? null;
    return (
      <Card title="操作の取り消し（Undo）" icon={<Undo2 size={18} className="text-orange-400" />}>
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            直近の対局・出席を1回取り消せます。取り消し後は元に戻せません。
          </p>
          {top ? (
            <div className="bg-slate-800/60 border border-orange-700/30 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 p-2 rounded-lg ${top.type === 'MATCH' ? 'bg-blue-900/40 text-blue-400' : 'bg-green-900/40 text-green-400'}`}>
                  {top.type === 'MATCH' ? <Swords size={16} /> : <CheckCircle size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-200 text-sm truncate">{top.description}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(top.timestamp).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <button
                onClick={handleUndo}
                disabled={undoInProgress}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl font-bold transition-all active:scale-95"
              >
                <Undo2 size={16} className={undoInProgress ? 'animate-spin' : ''} />
                {undoInProgress ? '取り消し中...' : 'この操作を取り消す'}
              </button>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-600">
              <Undo2 size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-bold">取り消せる操作はありません</p>
            </div>
          )}
          {undoStack.length > 1 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">履歴（参照のみ）</p>
              {undoStack.slice(1, 4).map(e => (
                <div key={e.id} className="flex items-center gap-2 text-[11px] text-slate-600 px-2">
                  <span className="shrink-0">{e.type === 'MATCH' ? '♟' : '✓'}</span>
                  <span className="truncate">{e.description}</span>
                  <span className="shrink-0 ml-auto">{new Date(e.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  };

  // ──────────────────────────────────────────────────────────
  // MAINTENANCE MODE PANEL
  // ──────────────────────────────────────────────────────────
  const MaintenancePanel = () => {
    const isActive = maintenanceMeta.active;
    return (
      <Card
        title="メンテナンスモード"
        icon={<Wrench size={18} className={isActive ? 'text-yellow-400' : 'text-slate-400'} />}
      >
        <div className="space-y-4">
          {/* Status Banner */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border font-bold text-sm ${
            isActive
              ? 'bg-yellow-900/20 border-yellow-700/40 text-yellow-300'
              : 'bg-slate-800/60 border-slate-700/40 text-slate-400'
          }`}>
            {isActive ? <AlertTriangle size={18} className="text-yellow-400 shrink-0" /> : <ShieldCheck size={18} className="text-slate-500 shrink-0" />}
            <div className="flex-1 min-w-0">
              <div>{isActive ? '🔧 メンテナンスモード 稼働中' : '通常モード'}</div>
              {isActive && maintenanceMeta.startedAt && (
                <div className="text-[10px] font-normal text-yellow-500/70 mt-0.5">
                  開始: {new Date(maintenanceMeta.startedAt).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  {maintenanceMeta.note && ` · ${maintenanceMeta.note}`}
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            開始時に全データをFirebaseへバックアップします。新機能テスト後、バックアップから復元するか、そのまま終了するか選べます。
          </p>

          {/* Message */}
          {maintenanceMsg && (
            <div className={`text-xs font-bold p-3 rounded-xl ${
              maintenanceMsg.startsWith('✅') ? 'bg-green-900/20 text-green-400 border border-green-700/30' : 'bg-red-900/20 text-red-400 border border-red-700/30'
            }`}>
              {maintenanceMsg}
            </div>
          )}

          {!isActive ? (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">メモ（任意）</label>
                <input
                  type="text"
                  value={maintenanceNote}
                  onChange={e => setMaintenanceNote(e.target.value)}
                  placeholder="例: ランキング新機能テスト"
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-bold outline-none focus:ring-2 focus:ring-yellow-500/50"
                />
              </div>
              <button
                onClick={handleStartMaintenance}
                disabled={maintenanceLoading}
                className="w-full flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl font-bold transition-all active:scale-95"
              >
                {maintenanceLoading ? <Loader size={16} className="animate-spin" /> : <Wrench size={16} />}
                {maintenanceLoading ? 'バックアップ中...' : 'メンテナンス開始 & バックアップ'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Firebase backup status check */}
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Firebaseバックアップ確認</span>
                  <button
                    onClick={handleCheckBackupStatus}
                    disabled={maintenanceLoading}
                    className="flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 bg-blue-900/20 px-2 py-1 rounded-lg border border-blue-700/30"
                  >
                    <Cloud size={10} /> 確認
                  </button>
                </div>
                {maintenanceBackupStatus?.checked && (
                  <div className="text-[11px] space-y-1 text-slate-400">
                    <div>バックアップ時刻: <span className="text-slate-200 font-bold">
                      {maintenanceBackupStatus.backupTimestamp
                        ? new Date(maintenanceBackupStatus.backupTimestamp).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'なし'
                      }
                    </span></div>
                    <div className="flex gap-4">
                      <span>現在: <span className="text-yellow-300 font-bold">{maintenanceBackupStatus.currentUserCount}名</span></span>
                      <span>バックアップ: <span className="text-green-300 font-bold">{maintenanceBackupStatus.backupUserCount}名</span></span>
                    </div>
                    {maintenanceBackupStatus.currentUserCount !== maintenanceBackupStatus.backupUserCount && (
                      <div className="text-orange-400">⚠ 部員数が変わっています（テストで変更されました）</div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleEndMaintenance(true)}
                  disabled={maintenanceLoading}
                  className="flex flex-col items-center justify-center gap-1.5 bg-green-700 hover:bg-green-600 disabled:bg-slate-700 disabled:text-slate-500 text-white py-4 rounded-xl font-bold transition-all active:scale-95 text-center"
                >
                  {maintenanceLoading ? <Loader size={18} className="animate-spin" /> : <RotateCcw size={18} />}
                  <span className="text-xs leading-tight">終了して<br />バックアップに復元</span>
                </button>
                <button
                  onClick={() => handleEndMaintenance(false)}
                  disabled={maintenanceLoading}
                  className="flex flex-col items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-200 py-4 rounded-xl font-bold transition-all active:scale-95 text-center border border-slate-600"
                >
                  {maintenanceLoading ? <Loader size={18} className="animate-spin" /> : <Zap size={18} />}
                  <span className="text-xs leading-tight">終了して<br />データ保持</span>
                </button>
              </div>
            </div>
          )}
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
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="glass-panel-dark w-full max-w-sm p-8 text-center space-y-6 rounded-3xl border border-white/10 shadow-2xl">
          <Settings className="mx-auto text-slate-500" size={48} />
          <h2 className="text-2xl font-bold text-white font-serif-jp">管理者ログイン</h2>
          <div>
            <input type="password" value={pin} readOnly placeholder="PIN"
              className="w-full p-4 border border-slate-700 rounded-xl text-center text-2xl tracking-[1em] outline-none bg-slate-900 text-white font-mono" />
            <NumPad value={pin} onChange={setPin} maxLength={4} />
          </div>
          <button onClick={handleLogin} disabled={pin.length < 4}
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

      {/* CSV Preview Modal */}
      {csvPreview && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4">
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
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
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
        <UserSelector
          users={wSimData ? (wSelectingTarget === 'RED' ? wSimData.redUsers : wSimData.whiteUsers) : users}
          onSelect={id => { if (wSelectingTarget === 'RED') setWRedGeneral(id); else setWWhiteGeneral(id); setWSelectingTarget(null); }}
          onClose={() => setWSelectingTarget(null)}
          title={`${wSelectingTarget === 'RED' ? '紅組' : '白組'}大将を選択`}
        />
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

      {/* Maintenance Mode Banner */}
      {maintenanceMeta.active && (
        <div className="flex items-center gap-3 bg-yellow-900/30 border border-yellow-600/40 rounded-2xl px-5 py-4">
          <Wrench size={20} className="text-yellow-400 shrink-0 animate-pulse" />
          <div className="flex-1">
            <div className="font-black text-yellow-300 text-sm">🔧 メンテナンスモード稼働中</div>
            <div className="text-xs text-yellow-500/80 mt-0.5">
              テスト中の操作はFirebaseに同期されます。終了時に復元するか選択できます。
              {maintenanceMeta.note && ` — ${maintenanceMeta.note}`}
            </div>
          </div>
          <button
            onClick={() => handleEndMaintenance(true)}
            className="shrink-0 text-xs font-bold text-yellow-300 bg-yellow-900/40 border border-yellow-700/40 px-3 py-2 rounded-xl hover:bg-yellow-800/40"
          >
            終了 & 復元
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── 左列 ── */}
        <div className="space-y-8">
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

        {/* ── 右列 ── */}
        <div className="space-y-8">
          {/* Season & Titles */}
          <Card title="シーズン・称号" icon={<Crown className="text-yellow-500" />}>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">現在のシーズン</label>
                <select className="w-full p-4 border border-slate-600 rounded-xl font-bold bg-slate-900 text-white appearance-none cursor-pointer"
                  value={settings.currentSeason} onChange={handleSeasonChange}>
                  {Object.values(Season).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-sm text-slate-400 mb-4">成長度・対局数に基づき四天王称号を再計算します。</p>
                <button onClick={handleUpdateTitles} className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 text-white py-3 rounded-xl font-black shadow-lg active:scale-[0.98]">称号を更新する</button>
              </div>
              {settings.lastTitleUpdate && (
                <div className="text-xs text-slate-600 text-center">最終更新: {new Date(settings.lastTitleUpdate).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
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

          {/* Undo */}
          <UndoPanel />

          {/* Maintenance Mode */}
          <MaintenancePanel />

          {/* Auto Backups */}
          <AutoBackupPanel />

          {/* Manual Backup / Restore */}
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
        </div>
      </div>
    </div>
  );
};

export default Admin;
