import React, { useState, useEffect } from 'react';
import { RotateCcw, X, Clock, Trash2, Lock, ShieldAlert } from 'lucide-react';
import { getUndoStack, undoLastAction, clearUndoStack, getSettings, isDeviceApproved } from './storage';
import { UndoEntry, UndoActionType } from './types';
import { NumPad } from './NumPad';

const ACTION_LABELS: Record<UndoActionType, { label: string; color: string }> = {
  MATCH:           { label: '対局',     color: 'text-blue-400' },
  ATTENDANCE:      { label: '出席',     color: 'text-green-400' },
  POINT_ADJUST:    { label: 'Pt調整',   color: 'text-amber-400' },
  RATE_ADJUST:     { label: 'Rate調整', color: 'text-purple-400' },
  USER_ADD:        { label: '部員追加', color: 'text-cyan-400' },
  USER_DEACTIVATE: { label: '休眠',     color: 'text-yellow-400' },
  USER_REACTIVATE: { label: '再入班',   color: 'text-emerald-400' },
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const UndoPanel: React.FC = () => {
  const [stack, setStack]         = useState<UndoEntry[]>([]);
  const [open, setOpen]           = useState(false);
  const [undoing, setUndoing]     = useState<string | null>(null);
  const [justUndone, setJustUndone] = useState<string | null>(null);
  const [pinAuthed, setPinAuthed] = useState(false);
  const [showPin, setShowPin]     = useState(false);
  const [pin, setPin]             = useState('');
  const [pinErr, setPinErr]       = useState(false);
  const [pendingId, setPendingId] = useState<string | undefined>(undefined);

  const refresh = () => setStack(getUndoStack());

  useEffect(() => {
    refresh();
    const h = (e: Event) => setStack((e as CustomEvent<UndoEntry[]>).detail);
    window.addEventListener('rivals-undo-changed', h);
    return () => window.removeEventListener('rivals-undo-changed', h);
  }, []);

  // ─── PIN 認証 ──────────────────────────────────────────────
  const handlePinCheck = (value: string) => {
    if (value.length < 6) return;
    const settings = getSettings();
    if (value === settings.adminPin) {
      setPinAuthed(true);
      setShowPin(false);
      setPin('');
      setPinErr(false);
      executeUndo(pendingId);
    } else {
      setPinErr(true);
      setTimeout(() => { setPin(''); setPinErr(false); }, 600);
    }
  };

  // ─── UNDO 実行 ────────────────────────────────────────────
  const executeUndo = async (entryId?: string) => {
    const id = entryId ?? (stack[0]?.id);
    if (!id) return;
    setUndoing(id);
    const entry = undoLastAction(id);
    if (entry) {
      setJustUndone(entry.description);
      setTimeout(() => setJustUndone(null), 3000);
    }
    setUndoing(null);
    setOpen(false);
    setPinAuthed(false); // 実行後に認証リセット
  };

  const handleUndoClick = (entryId?: string) => {
    if (pinAuthed) {
      executeUndo(entryId);
    } else {
      setPendingId(entryId);
      setShowPin(true);
      setOpen(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setPinAuthed(false); // パネルを閉じたら認証リセット
  };

  const isEmpty = stack.length === 0;
  const latest  = stack[0];
  const deviceApproved = isDeviceApproved();

  return (
    <>
      {/* PIN 入力モーダル */}
      {showPin && deviceApproved && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
          <div className="bg-slate-900 w-full max-w-xs rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-slate-800 border-b border-white/5">
              <div className="flex items-center gap-2 font-black text-white">
                <Lock size={16} className="text-blue-400" /> 管理者PIN
              </div>
              <button onClick={() => { setShowPin(false); setPin(''); setPinErr(false); }}
                className="text-slate-500 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-400 font-bold text-center">
                操作を取り消すには管理者PINが必要です
              </p>
              <div className={`flex justify-center gap-3 py-3 transition-all ${pinErr ? 'animate-bounce' : ''}`}>
                {[0,1,2,3,4,5].map(i => (
                  <div key={i} className={`w-4 h-4 rounded-full border-2 ${
                    i < pin.length
                      ? pinErr ? 'bg-red-500 border-red-500' : 'bg-blue-500 border-blue-500'
                      : 'border-slate-600 bg-transparent'
                  }`} />
                ))}
              </div>
              <NumPad value={pin} onChange={(v) => { setPin(v); handlePinCheck(v); }} maxLength={6} />
              {pinErr && <p className="text-red-400 text-xs font-bold text-center">PINが違います</p>}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-24 md:bottom-8 right-4 z-50 flex flex-col items-end gap-2">
        {/* 取り消し完了トースト */}
        {justUndone && (
          <div className="bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xl animate-in fade-in slide-in-from-bottom-2">
            ✓ 取り消しました: {justUndone}
          </div>
        )}

        {/* 履歴パネル */}
        {open && !isEmpty && deviceApproved && (
          <div className="w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-white/5">
              <div className="flex items-center gap-2 font-black text-white">
                <RotateCcw size={16} className="text-blue-400" />
                操作履歴
                <span className="text-[10px] font-bold text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded">{stack.length}件</span>
              </div>
              <div className="flex items-center gap-2">
                {pinAuthed && stack.length > 0 && (
                  <button onClick={() => { if (window.confirm('操作履歴をすべて削除しますか？')) clearUndoStack(); }}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1" title="履歴をクリア">
                    <Trash2 size={14} />
                  </button>
                )}
                <button onClick={handleClose} className="text-slate-500 hover:text-white transition-colors p-1">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto scrollbar-hide">
              {stack.map((entry, i) => {
                const m = ACTION_LABELS[entry.actionType];
                return (
                  <div key={entry.id} className="flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${m.color}`}>{m.label}</span>
                        {i === 0 && <span className="text-[9px] bg-blue-900/50 text-blue-400 border border-blue-700/40 px-1.5 py-0.5 rounded font-bold">最新</span>}
                      </div>
                      <div className="text-sm text-slate-200 font-bold truncate mt-0.5">{entry.description}</div>
                      <div className="text-[10px] text-slate-600 flex items-center gap-1 mt-0.5">
                        <Clock size={9} /> {fmtTime(entry.timestamp)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUndoClick(entry.id)}
                      disabled={undoing === entry.id}
                      className="shrink-0 bg-slate-700 hover:bg-blue-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-black transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
                    >
                      <RotateCcw size={11} />
                      {undoing === entry.id ? '...' : 'ここまで戻す'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="px-4 py-3 bg-slate-800/50 flex items-center justify-between">
              <span className="text-[10px] text-slate-600 font-bold">※ 以降の変更がすべて取り消されます</span>
              {pinAuthed && <span className="text-[10px] text-green-500 font-bold">✓ 管理者認証済み</span>}
            </div>
          </div>
        )}

        {/* メインボタン（常に表示） */}
        <button
          onClick={() => {
            if (!deviceApproved) return;    // 未承認デバイスは操作不可
            if (isEmpty) return;
            if (open) {
              handleClose();
            } else {
              setPinAuthed(false);
              setOpen(true);
            }
          }}
          title={!deviceApproved ? 'このデバイスは承認されていません' : undefined}
          className={`flex items-center gap-2 border border-white/10 px-4 py-3 rounded-2xl shadow-xl font-black text-sm transition-all active:scale-95 ${
            !deviceApproved
              ? 'bg-slate-900 text-slate-600 cursor-not-allowed'   // 未承認: 操作不可
              : isEmpty
              ? 'bg-slate-900 text-slate-600 cursor-default'       // スタック空: グレーアウト
              : 'bg-slate-800 hover:bg-slate-700 text-white'       // 通常: 白
          }`}
        >
          {!deviceApproved
            ? <ShieldAlert size={18} className="text-red-700" />
            : <RotateCcw size={18} className={isEmpty ? 'text-slate-700' : 'text-blue-400'} />
          }
          <span>
            {!deviceApproved ? '未承認デバイス' : isEmpty ? '取り消す履歴なし' : (open ? '閉じる' : '取り消す')}
          </span>
          {deviceApproved && !isEmpty && !open && <Lock size={12} className="text-slate-500" />}
        </button>
      </div>
    </>
  );
};

export default UndoPanel;
