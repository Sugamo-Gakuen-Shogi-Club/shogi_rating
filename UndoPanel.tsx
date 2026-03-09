import React, { useState, useEffect } from 'react';
import { RotateCcw, X, Clock, Trash2, ChevronDown } from 'lucide-react';
import { getUndoStack, undoLastAction, clearUndoStack } from './storage';
import { UndoEntry, UndoActionType } from './types';

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

interface Props {
  /** 管理者ログイン済みか（未ログインでも最新1件は取り消し可） */
  isAdmin?: boolean;
}

const UndoPanel: React.FC<Props> = ({ isAdmin = false }) => {
  const [stack, setStack] = useState<UndoEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [undoing, setUndoing] = useState<string | null>(null);
  const [justUndone, setJustUndone] = useState<string | null>(null);

  const refresh = () => setStack(getUndoStack());

  useEffect(() => {
    refresh();
    const h = (e: Event) => setStack((e as CustomEvent<UndoEntry[]>).detail);
    window.addEventListener('rivals-undo-changed', h);
    return () => window.removeEventListener('rivals-undo-changed', h);
  }, []);

  if (stack.length === 0) return null;

  const handleUndo = async (entryId?: string) => {
    const id = entryId || stack[0].id;
    setUndoing(id);
    const entry = undoLastAction(id);
    if (entry) {
      setJustUndone(entry.description);
      setTimeout(() => setJustUndone(null), 3000);
    }
    setUndoing(null);
    setOpen(false);
  };

  const latest = stack[0];
  const meta = ACTION_LABELS[latest.actionType];

  return (
    <>
      {/* ── フローティングボタン ─────────────────── */}
      <div className="fixed bottom-24 md:bottom-8 right-4 z-50 flex flex-col items-end gap-2">

        {/* Just-undone toast */}
        {justUndone && (
          <div className="bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xl animate-in fade-in slide-in-from-bottom-2">
            ✓ 取り消しました: {justUndone}
          </div>
        )}

        {/* Undo panel (expanded) */}
        {open && (
          <div className="w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-white/5">
              <div className="flex items-center gap-2 font-black text-white">
                <RotateCcw size={16} className="text-blue-400" />
                操作履歴
                <span className="text-[10px] font-bold text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded">
                  {stack.length}件
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && stack.length > 0 && (
                  <button
                    onClick={() => { if (window.confirm('操作履歴をすべて削除しますか？')) clearUndoStack(); }}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    title="履歴をクリア"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white transition-colors p-1">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto scrollbar-hide">
              {stack.map((entry, i) => {
                const m = ACTION_LABELS[entry.actionType];
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${m.color}`}>
                          {m.label}
                        </span>
                        {i === 0 && (
                          <span className="text-[9px] bg-blue-900/50 text-blue-400 border border-blue-700/40 px-1.5 py-0.5 rounded font-bold">
                            最新
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-200 font-bold truncate mt-0.5">
                        {entry.description}
                      </div>
                      <div className="text-[10px] text-slate-600 flex items-center gap-1 mt-0.5">
                        <Clock size={9} /> {fmtTime(entry.timestamp)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUndo(entry.id)}
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

            <div className="px-4 py-3 bg-slate-800/50 text-[10px] text-slate-600 font-bold">
              ※ 選んだ操作以降の変更がすべて取り消されます
            </div>
          </div>
        )}

        {/* Main button */}
        <button
          onClick={() => open ? handleUndo() : setOpen(true)}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white px-4 py-3 rounded-2xl shadow-xl font-black text-sm transition-all active:scale-95"
        >
          <RotateCcw size={18} className="text-blue-400" />
          <span>
            {open ? `${latest.description.slice(0, 18)}…を取消` : '取り消す'}
          </span>
          {!open && stack.length > 1 && (
            <ChevronDown size={14} className="text-slate-500" />
          )}
        </button>
      </div>
    </>
  );
};

export default UndoPanel;
