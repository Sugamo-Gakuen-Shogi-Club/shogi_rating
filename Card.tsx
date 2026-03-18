/**
 * Card.tsx — モーダル式カード
 * タップ → 画面いっぱいのモーダルで中身を表示
 * 戻るボタン or 背景タップで閉じる
 */
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  /** 未使用（後方互換） */
  defaultOpen?: boolean;
  /** バッジテキスト（件数表示） */
  badge?: string | number;
  /** サブテキスト（カード一覧に表示） */
  sub?: string;
}

export const Card: React.FC<CardProps> = ({
  children, className = '', title, icon, badge, sub,
}) => {
  const [open, setOpen] = useState(false);

  // タイトルなし = 常時展開（後方互換）
  if (!title && !icon) {
    return (
      <div className={`glass-panel-dark rounded-3xl overflow-hidden shadow-xl border border-white/10 ${className}`}>
        <div className="p-6 text-slate-300">{children}</div>
      </div>
    );
  }

  return (
    <>
      {/* カードボタン */}
      <button
        onClick={() => setOpen(true)}
        className={`w-full glass-panel-dark rounded-2xl border border-white/10 shadow-lg px-5 py-4 flex items-center gap-3 hover:bg-white/[0.06] active:scale-[0.98] transition-all text-left group ${className}`}
      >
        {icon && <span className="text-blue-400 drop-shadow-sm shrink-0">{icon}</span>}
        <div className="flex-1 min-w-0">
          {title && <div className="font-bold text-slate-100 text-sm tracking-tight group-hover:text-white transition-colors truncate">{title}</div>}
          {sub && <div className="text-[10px] text-slate-500 font-bold mt-0.5 truncate">{sub}</div>}
        </div>
        {badge !== undefined && (
          <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0 min-w-[20px] text-center">
            {badge}
          </span>
        )}
        <span className="text-slate-600 text-lg shrink-0">›</span>
      </button>

      {/* フルスクリーンモーダル */}
      {open && (
        <div className="fixed inset-0 z-[500] flex flex-col bg-slate-950 animate-in slide-in-from-right duration-250">
          {/* モーダルヘッダー */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10 bg-slate-900/80 backdrop-blur-md shrink-0">
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors active:scale-95"
            >
              <ArrowLeft size={18} />
            </button>
            {icon && <span className="text-blue-400 shrink-0">{icon}</span>}
            {title && <h2 className="font-black text-white text-lg tracking-tight truncate">{title}</h2>}
            {badge !== undefined && (
              <span className="ml-auto bg-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0">
                {badge}
              </span>
            )}
          </div>

          {/* モーダルコンテンツ */}
          <div className="flex-1 overflow-y-auto p-5 text-slate-300">
            {children}
          </div>
        </div>
      )}
    </>
  );
};
