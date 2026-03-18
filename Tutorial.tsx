/**
 * Tutorial.tsx
 * 初回起動時に表示するチュートリアル（5ステップ）
 * localStorage の 'rivals_tutorial_done' で管理
 */
import React, { useState } from 'react';
import {
  ChevronRight, ChevronLeft, X, Users, Trophy,
  UserCircle, Settings, BookOpen, Star, Target,
} from 'lucide-react';

const TUTORIAL_KEY = 'rivals_tutorial_done';

export const isTutorialDone = (): boolean =>
  localStorage.getItem(TUTORIAL_KEY) === '1';

export const markTutorialDone = (): void =>
  localStorage.setItem(TUTORIAL_KEY, '1');

// ─── スライドデータ ────────────────────────────────────────────
interface Slide {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  accent: string; // Tailwind gradient from/to
}

const SLIDES: Slide[] = [
  {
    icon: <Trophy size={56} className="text-yellow-400 drop-shadow-[0_0_16px_rgba(251,191,36,0.7)]" />,
    title: 'ようこそ、巣鴨学園将棋班へ',
    accent: 'from-yellow-900/40 to-amber-900/20',
    body: (
      <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
        <p>このアプリは将棋班の<span className="text-white font-black">対局・出席・ランキング</span>をまとめて管理するツールです。</p>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {[
            { icon: '⚔️', label: '対局記録',   desc: 'レートが自動計算' },
            { icon: '📅', label: '出席管理',   desc: 'ポイントが貯まる' },
            { icon: '🏆', label: 'ランキング', desc: '12軸で競い合う' },
            { icon: '🎯', label: 'ミッション', desc: '達成でPtボーナス' },
          ].map(c => (
            <div key={c.label} className="bg-slate-800/60 border border-white/10 rounded-xl p-3 flex items-center gap-2">
              <span className="text-xl">{c.icon}</span>
              <div>
                <div className="text-xs font-black text-white">{c.label}</div>
                <div className="text-[10px] text-slate-500">{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: <Users size={56} className="text-blue-400 drop-shadow-[0_0_16px_rgba(59,130,246,0.7)]" />,
    title: '対局の記録手順',
    accent: 'from-blue-900/40 to-indigo-900/20',
    body: (
      <div className="space-y-2 text-sm">
        {[
          { n: 1, text: '下部ナビの ⊕ ボタンから「対局記録」を開く' },
          { n: 2, text: 'Player 1 を選択する' },
          { n: 3, text: 'Player 1 が自分のPIN（6桁）を入力する' },
          { n: 4, text: 'Player 2 を選択して同様にPINを入力する' },
          { n: 5, text: '勝者を選んで「記録する」を押す' },
        ].map(s => (
          <div key={s.n} className="flex items-start gap-3 bg-slate-800/50 rounded-xl px-3 py-2.5 border border-white/5">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xs shrink-0">{s.n}</div>
            <p className="text-slate-300 text-xs leading-relaxed">{s.text}</p>
          </div>
        ))}
        <p className="text-[10px] text-slate-500 font-bold pt-1">※ PIN の初期値は <span className="text-slate-400">000000</span> です。管理者に変更してもらうまで対局できません。</p>
      </div>
    ),
  },
  {
    icon: <UserCircle size={56} className="text-purple-400 drop-shadow-[0_0_16px_rgba(168,85,247,0.7)]" />,
    title: '個人ページ（プロフィール）',
    accent: 'from-purple-900/40 to-pink-900/20',
    body: (
      <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
        <p>自分のPINを入力して個人ページを開くと、専用の情報が見られます。</p>
        <div className="space-y-2">
          {[
            { icon: '🎯', label: 'デイリー/ウィークリーミッション', desc: '達成でポイントボーナス' },
            { icon: '📊', label: '全ランキングでの現在順位',       desc: '11軸すべての順位を確認' },
            { icon: '⚔️', label: '因縁ボード',                    desc: 'ライバルへの煽り文付き' },
            { icon: '🏅', label: 'アイコン・フレーム変更',         desc: '対局で条件を解放' },
          ].map(c => (
            <div key={c.label} className="flex items-center gap-3 bg-slate-800/50 border border-white/5 rounded-xl px-3 py-2">
              <span className="text-lg">{c.icon}</span>
              <div>
                <div className="text-xs font-black text-white">{c.label}</div>
                <div className="text-[10px] text-slate-500">{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: <Star size={56} className="text-yellow-300 drop-shadow-[0_0_16px_rgba(253,224,71,0.7)]" />,
    title: '四天王・ランキング',
    accent: 'from-yellow-900/30 to-orange-900/20',
    body: (
      <div className="space-y-3 text-slate-300 text-sm">
        <p>シーズン中に各部門1位の班員に<span className="text-yellow-300 font-black">四天王称号</span>が付与されます。</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: '⚔️', name: '覇者',       cond: '今期レート上昇1位' },
            { icon: '🌟', name: '新星',       cond: '今期ポイント上昇1位' },
            { icon: '🛡️', name: '鉄人',       cond: '出席日数1位' },
            { icon: '💀', name: '巨人キラー', cond: '格上撃破数1位' },
          ].map(t => (
            <div key={t.name} className="bg-slate-800/60 border border-yellow-700/20 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-base">{t.icon}</span>
                <span className="text-xs font-black text-yellow-300">{t.name}</span>
              </div>
              <div className="text-[10px] text-slate-500">{t.cond}</div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500">ランキングの「まとめ」タブで全軸の1〜3位を一覧できます。</p>
      </div>
    ),
  },
  {
    icon: <Settings size={56} className="text-slate-300 drop-shadow-[0_0_12px_rgba(203,213,225,0.5)]" />,
    title: '管理者・ガイドについて',
    accent: 'from-slate-800/60 to-slate-900/40',
    body: (
      <div className="space-y-3 text-slate-300 text-sm">
        <div className="bg-slate-800/60 border border-white/10 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <Settings size={14} className="text-slate-400"/>
            <span className="text-xs font-black text-white">管理者画面（Admin）</span>
          </div>
          <ul className="text-[11px] text-slate-400 space-y-1 pl-5 list-disc">
            <li>班員の追加・削除・PIN変更</li>
            <li>デバイスの承認（変更パスワード「koji」が必要）</li>
            <li>四天王の更新・シーズンリセット</li>
            <li>ポイント手動調整・出席取り消し</li>
          </ul>
        </div>
        <div className="bg-slate-800/60 border border-white/10 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-slate-400"/>
            <span className="text-xs font-black text-white">ガイド（Guide）</span>
          </div>
          <p className="text-[11px] text-slate-400">詳しい操作方法はガイドページで確認できます。</p>
        </div>
        <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-xl p-3">
          <p className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
            <Target size={12}/> 準備完了！班活を楽しんでください 🎉
          </p>
        </div>
      </div>
    ),
  },
];

// ─── コンポーネント ────────────────────────────────────────────
interface Props { onDone: () => void; }

export const Tutorial: React.FC<Props> = ({ onDone }) => {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  const finish = () => { markTutorialDone(); onDone(); };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* ヘッダー */}
        <div className={`bg-gradient-to-br ${slide.accent} px-6 pt-8 pb-6 text-center space-y-3 shrink-0`}>
          <div className="flex justify-center">{slide.icon}</div>
          <h2 className="text-xl font-black text-white leading-tight">{slide.title}</h2>
          {/* ドットインジケーター */}
          <div className="flex justify-center gap-2 pt-1">
            {SLIDES.map((_, i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${i === idx ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-slate-600'}`} />
            ))}
          </div>
        </div>

        {/* ボディ */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {slide.body}
        </div>

        {/* フッターボタン */}
        <div className="px-6 pb-6 pt-3 flex gap-3 shrink-0 border-t border-white/5">
          {idx > 0 && (
            <button onClick={() => setIdx(i => i - 1)}
              className="flex items-center gap-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-400 font-black text-sm hover:bg-slate-700 transition-all active:scale-95">
              <ChevronLeft size={16}/> 戻る
            </button>
          )}
          <button
            onClick={isLast ? finish : () => setIdx(i => i + 1)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all active:scale-95 ${isLast ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-white hover:bg-slate-100 text-slate-900'}`}
          >
            {isLast ? '🎉 はじめる' : <>次へ <ChevronRight size={16}/></>}
          </button>
          {idx === 0 && (
            <button onClick={finish}
              className="px-4 py-3 rounded-xl bg-slate-800 text-slate-500 font-black text-xs hover:bg-slate-700 transition-all active:scale-95">
              スキップ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
