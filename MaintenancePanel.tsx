import React, { useState, useEffect } from 'react';
import {
  Wrench, ShieldAlert, CheckCircle2, XCircle,
  CloudDownload, Trash2, ArrowRightCircle, Loader,
  AlertTriangle, Eye, RefreshCw
} from 'lucide-react';
import {
  getMaintenanceState, startMaintenanceMode,
  endMaintenanceMode, verifyMaintenanceBackup,
} from './storage';
import { MaintenanceState } from './types';

interface Props {
  onModeChange?: (active: boolean) => void;
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('ja-JP', {
    month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }) : '—';

const MaintenancePanel: React.FC<Props> = ({ onModeChange }) => {
  const [state, setState] = useState<MaintenanceState>(getMaintenanceState());
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [verifyResult, setVerifyResult] = useState<{
    ok: boolean; userCount?: number; matchCount?: number; savedAt?: string; error?: string;
  } | null>(null);
  const [endConfirm, setEndConfirm] = useState<'DISCARD' | 'PROMOTE' | null>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    const h = (e: Event) => {
      const s = (e as CustomEvent<MaintenanceState>).detail;
      setState(s);
      onModeChange?.(s.active);
    };
    window.addEventListener('rivals-maintenance-changed', h);
    return () => window.removeEventListener('rivals-maintenance-changed', h);
  }, [onModeChange]);

  const showMsg = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const handleStart = async () => {
    if (!window.confirm(
      'メンテナンスモードを開始します。\n\n' +
      '・現在の全データをFirebaseにバックアップします\n' +
      '・以後の変更はサンドボックスに書き込まれます（本番には反映されません）\n' +
      '・終了時に「変更を破棄」または「本番に反映」を選べます\n\n続けますか？'
    )) return;

    setLoading(true);
    const result = await startMaintenanceMode(note || '機能テスト', '管理者');
    setLoading(false);

    if (result.success) {
      setState(getMaintenanceState());
      showMsg('ok', 'メンテナンスモード開始。Firebaseにバックアップ済みです。');
    } else {
      showMsg('err', `開始失敗: ${result.error}`);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    const res = await verifyMaintenanceBackup();
    setVerifyResult(res);
    setState(getMaintenanceState());
    setLoading(false);
    if (!res.ok) showMsg('err', `確認失敗: ${res.error}`);
  };

  const handleEnd = async (discard: boolean) => {
    const label = discard ? '変更を破棄してメンテ開始前に戻す' : 'サンドボックスの変更を本番に反映';
    if (!window.confirm(
      `メンテナンスモードを終了します。\n\n` +
      `選択: 【${label}】\n\n` +
      (discard
        ? 'メンテ中の変更はすべて削除されます。本番データは影響を受けません。'
        : 'メンテ中の変更が本番Firebaseに書き込まれます。')
      + '\n\n本当に実行しますか？'
    )) return;

    setLoading(true);
    setEndConfirm(null);
    const result = await endMaintenanceMode(discard);
    setLoading(false);

    if (result.success) {
      setState(getMaintenanceState());
      setVerifyResult(null);
      showMsg('ok', discard
        ? 'メンテ終了。本番データを復元しました。'
        : 'メンテ終了。変更を本番に反映しました。'
      );
      // ページリロードで本番データを再読込
      setTimeout(() => window.location.reload(), 1500);
    } else {
      showMsg('err', `終了失敗: ${result.error}`);
    }
  };

  return (
    <div className={`rounded-3xl border overflow-hidden transition-all ${
      state.active
        ? 'border-orange-500/60 shadow-orange-900/30 shadow-2xl'
        : 'border-slate-700/50'
    }`}>
      {/* Header */}
      <div className={`px-6 py-4 flex items-center justify-between ${
        state.active ? 'bg-orange-950/60' : 'bg-slate-800/60'
      }`}>
        <div className="flex items-center gap-3">
          <Wrench size={20} className={state.active ? 'text-orange-400' : 'text-slate-400'} />
          <div>
            <div className="font-black text-white flex items-center gap-2">
              メンテナンスモード
              {state.active && (
                <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-black animate-pulse">
                  稼働中
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 font-bold">
              {state.active ? `開始: ${fmtDate(state.startedAt)}` : '新機能テスト・動作確認用'}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-900/80 space-y-5">

        {/* メッセージ */}
        {msg && (
          <div className={`flex items-start gap-3 p-3 rounded-xl border font-bold text-sm ${
            msg.type === 'ok'
              ? 'bg-green-900/20 border-green-700/40 text-green-300'
              : 'bg-red-900/20 border-red-700/40 text-red-300'
          }`}>
            {msg.type === 'ok' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <XCircle size={18} className="shrink-0 mt-0.5" />}
            {msg.text}
          </div>
        )}

        {!state.active ? (
          /* ── 未開始状態 ── */
          <div className="space-y-4">
            <div className="bg-slate-800/60 rounded-2xl p-4 space-y-3 border border-slate-700/50">
              <p className="text-xs text-slate-400 font-bold leading-relaxed">
                メンテナンスモードでは：<br />
                <span className="text-slate-300">1.</span> 現在の全データをFirebaseにバックアップ<br />
                <span className="text-slate-300">2.</span> 以後の変更はFirebaseのサンドボックスに書き込み<br />
                <span className="text-slate-300">3.</span> 終了時に「破棄（本番に戻す）」か「本番に反映」を選択
              </p>
              <div className="flex items-center gap-2 text-[10px] font-bold text-amber-400 bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-2">
                <AlertTriangle size={12} className="shrink-0" />
                ローカル完結ではなく、Firebaseとの通信を確認しながら動作します
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">作業メモ（任意）</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="例: v2.1新機能テスト"
                className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:border-orange-500 outline-none"
              />
            </div>

            <button
              onClick={handleStart}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-4 rounded-xl font-black text-base transition-all active:scale-[0.98] shadow-lg"
            >
              {loading ? <Loader size={20} className="animate-spin" /> : <Wrench size={20} />}
              {loading ? '準備中...' : 'メンテナンスモードを開始'}
            </button>
          </div>
        ) : (
          /* ── 稼働中状態 ── */
          <div className="space-y-4">
            {/* 状態表示 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/60 rounded-2xl p-4 border border-orange-900/40">
                <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">開始時刻</div>
                <div className="text-sm font-bold text-white">{fmtDate(state.startedAt)}</div>
              </div>
              <div className={`rounded-2xl p-4 border ${state.backupVerified ? 'bg-green-900/20 border-green-700/40' : 'bg-slate-800/60 border-slate-700/40'}`}>
                <div className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-400">Firebaseバックアップ</div>
                <div className={`text-sm font-bold flex items-center gap-2 ${state.backupVerified ? 'text-green-400' : 'text-slate-500'}`}>
                  {state.backupVerified
                    ? <><CheckCircle2 size={14} /> 確認済</>
                    : <>未確認</>
                  }
                </div>
              </div>
            </div>

            {state.note && (
              <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-slate-300 font-bold">
                📝 {state.note}
              </div>
            )}

            {/* Firebaseバックアップ確認ボタン */}
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
            >
              {loading ? <Loader size={16} className="animate-spin" /> : <Eye size={16} />}
              Firebaseバックアップを確認
            </button>

            {verifyResult && (
              <div className={`rounded-xl border p-4 space-y-1 ${
                verifyResult.ok
                  ? 'bg-green-900/20 border-green-700/40'
                  : 'bg-red-900/20 border-red-700/40'
              }`}>
                {verifyResult.ok ? (
                  <>
                    <div className="text-green-400 font-black text-sm flex items-center gap-2">
                      <CheckCircle2 size={16} /> バックアップ確認 OK
                    </div>
                    <div className="text-xs text-slate-400 font-bold space-y-0.5">
                      <div>部員数: {verifyResult.userCount}名</div>
                      <div>対局数: {verifyResult.matchCount}件</div>
                      <div>保存日時: {fmtDate(verifyResult.savedAt || null)}</div>
                    </div>
                  </>
                ) : (
                  <div className="text-red-400 font-black text-sm">{verifyResult.error}</div>
                )}
              </div>
            )}

            {/* 終了ボタン */}
            <div className="pt-2 border-t border-white/5 space-y-3">
              <div className="text-xs font-black text-slate-500 uppercase tracking-widest">メンテナンスを終了する</div>

              {endConfirm ? (
                <div className="space-y-2">
                  <p className="text-sm text-amber-300 font-bold bg-amber-900/20 border border-amber-700/30 rounded-xl p-3">
                    ⚠ {endConfirm === 'DISCARD'
                      ? 'メンテ中の変更をすべて破棄し、バックアップを本番に復元します。'
                      : 'メンテ中の変更を本番Firebaseに反映します。'}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setEndConfirm(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-400 bg-slate-800 border border-slate-700">キャンセル</button>
                    <button
                      onClick={() => handleEnd(endConfirm === 'DISCARD')}
                      disabled={loading}
                      className={`flex-1 py-3 rounded-xl font-black text-white ${endConfirm === 'DISCARD' ? 'bg-red-700 hover:bg-red-600' : 'bg-blue-700 hover:bg-blue-600'}`}
                    >
                      {loading ? '処理中...' : '実行'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setEndConfirm('DISCARD')}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-red-900/20 border border-red-700/40 hover:bg-red-900/40 transition-all active:scale-[0.97]"
                  >
                    <Trash2 size={20} className="text-red-400" />
                    <div className="text-xs font-black text-red-400">変更を破棄</div>
                    <div className="text-[10px] text-slate-500 font-bold text-center">本番に戻す</div>
                  </button>
                  <button
                    onClick={() => setEndConfirm('PROMOTE')}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-900/20 border border-blue-700/40 hover:bg-blue-900/40 transition-all active:scale-[0.97]"
                  >
                    <ArrowRightCircle size={20} className="text-blue-400" />
                    <div className="text-xs font-black text-blue-400">変更を反映</div>
                    <div className="text-[10px] text-slate-500 font-bold text-center">本番に昇格</div>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenancePanel;
