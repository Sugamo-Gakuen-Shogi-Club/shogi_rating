import React, { useState } from 'react';
import {
  BookOpen, Shield, Star, Trophy, Swords, Settings,
  TrendingUp, Award, Crown, Users, Lock, Medal,
  ChevronRight, ChevronDown, Globe, Key, AlertCircle,
  Zap, Heart, Target, Flame, Snowflake, Calendar,
  BarChart2, GitBranch
} from 'lucide-react';
import { ShogiPiece } from './ShogiPiece';

// ─── 共通コンポーネント ──────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode; accent?: string }> = ({
  title, children, accent = 'border-blue-500'
}) => (
  <div className="mb-8">
    <h3 className={`text-xl font-black text-white mb-4 border-l-4 ${accent} pl-4 py-1`}>{title}</h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const InfoBox: React.FC<{ children: React.ReactNode; color?: string }> = ({
  children, color = 'bg-blue-900/20 border-blue-700/40 text-blue-200'
}) => (
  <div className={`p-4 rounded-xl border text-sm leading-relaxed ${color}`}>{children}</div>
);

const Step: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <div className="flex gap-4">
    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 mt-0.5">{n}</div>
    <div>
      <div className="font-black text-white mb-1">{title}</div>
      <div className="text-sm text-slate-400 leading-relaxed">{children}</div>
    </div>
  </div>
);

const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({
  title, children, defaultOpen = false
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
      >
        <span className="font-black text-white">{title}</span>
        {open
          ? <ChevronDown size={18} className="text-slate-400" />
          : <ChevronRight size={18} className="text-slate-400" />}
      </button>
      {open && (
        <div className="px-5 pb-5 text-sm text-slate-300 leading-relaxed space-y-3 border-t border-white/5 pt-4">
          {children}
        </div>
      )}
    </div>
  );
};

// ─── タブ1: はじめに ─────────────────────────────────────────

const TabIntro = () => (
  <div className="space-y-8 animate-in fade-in duration-300">
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 p-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      <h2 className="text-3xl font-black text-white mb-2">Club Rivals とは？</h2>
      <p className="text-slate-400 font-bold text-sm mb-6">将棋部の活動を記録・可視化・盛り上げるための部活管理アプリです。</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { icon: <Shield size={18} className="text-blue-400" />,    label: '対局記録',    desc: 'Eloレートで実力を数値化' },
          { icon: <Star size={18} className="text-yellow-400" />,    label: '称号・実績',  desc: '活動で解放されるバッジ' },
          { icon: <Trophy size={18} className="text-amber-400" />,   label: 'ランキング',  desc: '4軸の順位表' },
          { icon: <Swords size={18} className="text-red-400" />,     label: 'イベント',    desc: '紅白戦・ポイントマッチ' },
          { icon: <Medal size={18} className="text-purple-400" />,   label: '段位登録',    desc: '将棋ウォーズ等のランクを申請' },
          { icon: <Globe size={18} className="text-cyan-400" />,     label: '公開ページ',  desc: 'URL共有で外部も閲覧可' },
        ].map(item => (
          <div key={item.label} className="bg-slate-800/60 border border-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">{item.icon}<span className="font-black text-white text-sm">{item.label}</span></div>
            <div className="text-[11px] text-slate-400 font-bold">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>

    <Section title="画面構成" accent="border-cyan-500">
      <div className="space-y-2">
        {[
          { path: 'ホーム',      icon: '🏠', desc: '出席ボタン、イベント状況、称号ホルダー一覧' },
          { path: 'ランキング',  icon: '🏆', desc: '今期成長・レート・活動日数・総ポイントの4軸ランキング' },
          { path: '対戦記録',   icon: '⚔️', desc: '対局入力（管理者PINが必要）' },
          { path: '個人データ', icon: '👤', desc: 'レート推移・称号・実績・ライバル分析（個人PINが必要）' },
          { path: 'ガイド',     icon: '📖', desc: 'このページ' },
          { path: '管理画面',   icon: '⚙️', desc: '部員管理・イベント設定（管理者PINが必要）' },
        ].map(item => (
          <div key={item.path} className="flex items-start gap-3 bg-slate-900 border border-white/5 rounded-xl p-4">
            <span className="text-xl">{item.icon}</span>
            <div>
              <div className="font-black text-white text-sm">{item.path}</div>
              <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>

    <Section title="PINコード一覧" accent="border-amber-500">
      <InfoBox color="bg-amber-900/20 border-amber-700/40 text-amber-200">
        <div className="font-black mb-3 flex items-center gap-2"><Key size={14} /> このアプリには2種類のPINがあります</div>
        <div className="space-y-3">
          <div className="bg-black/20 rounded-xl p-3">
            <div className="font-black text-white mb-1">管理者PIN</div>
            <div className="text-sm">対局入力・管理画面の操作に必要。部長・副部長のみが知っています。</div>
          </div>
          <div className="bg-black/20 rounded-xl p-3">
            <div className="font-black text-white mb-1">個人PIN</div>
            <div className="text-sm">自分の個人ページを開くのに必要。初期値は <code className="bg-black/30 px-1 rounded font-mono">0000</code>。変更は管理者に依頼。</div>
          </div>
        </div>
      </InfoBox>
    </Section>

    <Section title="公開ページ（/board）" accent="border-cyan-500">
      <InfoBox color="bg-cyan-900/20 border-cyan-700/40 text-cyan-200">
        <div className="font-black mb-2 flex items-center gap-2"><Globe size={14} /> 閲覧専用の外部公開ページ</div>
        <p>管理者からURLを教えてもらえばブラウザで誰でも閲覧できます。対局登録などの操作はできません。個人ページはPIN認証が必要です。</p>
      </InfoBox>
    </Section>
  </div>
);

// ─── タブ2: レート・ポイント ──────────────────────────────────

const TabRate = () => (
  <div className="space-y-8 animate-in fade-in duration-300">
    <Section title="レートシステム（Rate）" accent="border-blue-500">
      <InfoBox>
        <p>独自の<strong>「経験値蓄積型Eloレーティング」</strong>を採用しています。</p>
        <p className="mt-2 text-yellow-200 font-bold">⚡ 最大の特徴：<strong>負けてもレートが下がらない</strong></p>
        <p className="mt-1">対局すればするほどレートが上がり続けます。初心者が臆せず挑戦できる設計です。</p>
      </InfoBox>

      <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 space-y-4">
        <h4 className="font-black text-white border-l-4 border-blue-500 pl-3">変動ルール（1試合あたり）</h4>
        <div className="space-y-3 text-sm">
          {[
            { label: '勝利',     value: '+1以上',  color: 'text-green-400',  note: 'Eloの理論値（マイナスでも最低+1保証）' },
            { label: '引き分け', value: '+0以上',  color: 'text-yellow-400', note: '計算結果が0以下でも最低0' },
            { label: '敗北',     value: '−（最低0)', color: 'text-red-400',  note: 'マイナスになるが0以下にはならない' },
          ].map(r => (
            <div key={r.label} className="flex items-center gap-4 bg-slate-800/60 rounded-xl p-3">
              <div className="w-16 font-black text-slate-300 shrink-0">{r.label}</div>
              <div className={`font-black text-xl font-mono ${r.color} w-28 shrink-0`}>{r.value}</div>
              <div className="text-slate-500 text-xs">{r.note}</div>
            </div>
          ))}
        </div>
      </div>

      <Accordion title="Eloの計算式（詳細）">
        <div className="space-y-3">
          <p><span className="text-blue-300 font-black">K値：</span>32（変動の大きさの係数）</p>
          <p><span className="text-blue-300 font-black">勝率期待値：</span><code className="bg-slate-800 px-1 rounded text-xs">1 / (1 + 10^((相手Rate - 自分Rate) / 400))</code></p>
          <p><span className="text-blue-300 font-black">変動値：</span><code className="bg-slate-800 px-1 rounded text-xs">K × (実スコア - 勝率期待値)</code></p>
          <p className="text-slate-400">実スコア = 勝利:1.0 / 引き分け:0.5 / 敗北:0.0</p>
          <InfoBox color="bg-slate-800 border-slate-600 text-slate-300">
            <strong>例：</strong>自分Rate=500 vs 相手Rate=300 のとき<br />
            勝率期待値 ≈ 0.76 → 勝利変動 = 32×(1−0.76) ≈ +8<br />
            格下に勝っても伸びにくく、格上に勝つと大きく伸びる
          </InfoBox>
        </div>
      </Accordion>
    </Section>

    <Section title="ポイントシステム（Points）" accent="border-amber-500">
      <InfoBox color="bg-amber-900/20 border-amber-700/40 text-amber-200">
        レートとは別に蓄積するポイントです。<strong>ポイントは絶対に減りません。</strong><br />
        ランキングの「今期成長」は <code className="bg-black/20 px-1 rounded">レート増加 + ポイント増加</code> の合計で計算します。
      </InfoBox>

      <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 space-y-3">
        <h4 className="font-black text-white border-l-4 border-amber-500 pl-3">ポイント獲得源</h4>
        <div className="space-y-2 text-sm">
          {[
            { source: '勝利',         pts: '多めに獲得',   note: '対局ポイント基本値' },
            { source: '引き分け',     pts: '少なめに獲得', note: '勝利より少なめ' },
            { source: '敗北',         pts: '微量獲得',     note: '参加賞（0にはならない）' },
            { source: '出席',         pts: '固定ポイント', note: '活動日に出席ボタンを押す' },
            { source: 'イベント中',   pts: '×倍率',        note: 'イベント期間中は倍率がかかる' },
            { source: '連勝ボーナス', pts: '+追加',        note: '3連勝以上で加算' },
            { source: '新入部員補正', pts: '+追加',        note: '入部初期に上乗せ' },
          ].map(r => (
            <div key={r.source} className="flex items-center gap-3 bg-slate-800/60 rounded-xl p-3">
              <div className="w-24 font-black text-slate-200 shrink-0">{r.source}</div>
              <div className="text-amber-400 font-bold w-28 shrink-0">{r.pts}</div>
              <div className="text-slate-500 text-xs">{r.note}</div>
            </div>
          ))}
        </div>
      </div>

      <Accordion title="スパム防止ペナルティ">
        <p>同じ相手と短時間に連続で対局した場合、ポイントにペナルティが発生します。</p>
        <p className="text-slate-400">意図的な水増しを防ぐための仕組みです。レートには影響しません。</p>
      </Accordion>
    </Section>

    <Section title="ランキングの4つの軸" accent="border-purple-500">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: '今期成長',   icon: <TrendingUp size={16} />, color: 'text-indigo-400', desc: 'シーズン開始からのRate増加＋ポイント増加の合計' },
          { label: 'レート',     icon: <Shield size={16} />,     color: 'text-blue-400',   desc: '現在のレート値（高いほど実力が高い）' },
          { label: '活動日数',   icon: <Calendar size={16} />,   color: 'text-green-400',  desc: '出席ボタンを押した日数の累計' },
          { label: '総ポイント', icon: <Star size={16} />,       color: 'text-amber-400',  desc: '累計ポイント（絶対に減らない）' },
        ].map(r => (
          <div key={r.label} className="bg-slate-900 border border-white/5 rounded-2xl p-4">
            <div className={`flex items-center gap-2 font-black mb-2 ${r.color}`}>{r.icon}{r.label}</div>
            <p className="text-xs text-slate-400">{r.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  </div>
);

// ─── タブ3: 称号・実績・アイコン ─────────────────────────────

const TabAchievements = () => (
  <div className="space-y-8 animate-in fade-in duration-300">
    <Section title="称号（Title）" accent="border-yellow-500">
      <InfoBox color="bg-yellow-900/20 border-yellow-700/40 text-yellow-200">
        称号は<strong>自分のプロフィールに表示できるバッジ</strong>です。条件を達成すると解放され、好きなものを選んで表示できます。<br />
        称号の変更は<strong>個人ページ（PIN認証後）</strong>から行います。
      </InfoBox>

      <Accordion title="称号の解放条件（例）" defaultOpen>
        <div className="space-y-2">
          {[
            { name: '初陣',       cond: '初めての対局' },
            { name: '連勝王',     cond: '3連勝以上' },
            { name: '精勤賞',     cond: '出席日数10日以上' },
            { name: '千本ノック', cond: '対局数50回以上' },
            { name: '下克上',     cond: '格上（レート差100以上）に勝利' },
            { name: '大黒柱',     cond: '出席日数30日以上' },
          ].map(a => (
            <div key={a.name} className="flex items-center gap-3 bg-slate-800/60 rounded-xl p-3">
              <Award size={14} className="text-yellow-400 shrink-0" />
              <span className="font-black text-white w-28 shrink-0">{a.name}</span>
              <span className="text-slate-400 text-xs">{a.cond}</span>
            </div>
          ))}
          <p className="text-slate-500 text-xs mt-2">※ 他にも多数の称号があります。対局・出席を重ねて集めよう！</p>
        </div>
      </Accordion>
    </Section>

    <Section title="システム称号（四天王）" accent="border-orange-500">
      <InfoBox color="bg-orange-900/20 border-orange-700/40 text-orange-200">
        毎シーズン自動計算される<strong>特別な称号</strong>です。それぞれ1人しかもらえません。管理者が「称号を更新」ボタンを押したタイミングで付与されます。
      </InfoBox>
      <div className="grid grid-cols-2 gap-3">
        {[
          { title: 'MASTER',       label: '覇者',       color: 'text-yellow-400', desc: '今期レート上昇1位' },
          { title: 'RISING_STAR',  label: '新星',       color: 'text-green-400',  desc: '今期ポイント上昇1位' },
          { title: 'GRINDER',      label: '鉄人',       color: 'text-blue-400',   desc: '出席日数1位' },
          { title: 'GIANT_KILLER', label: '巨人キラー', color: 'text-red-400',    desc: '格上撃破数1位' },
        ].map(t => (
          <div key={t.title} className="bg-slate-900 border border-white/5 rounded-2xl p-4">
            <div className={`font-black text-xs uppercase tracking-widest mb-1 ${t.color}`}>{t.title}</div>
            <div className="font-black text-white">{t.label}</div>
            <div className="text-xs text-slate-500 mt-1">{t.desc}</div>
          </div>
        ))}
      </div>
    </Section>

    <Section title="アイコン（Icon）" accent="border-purple-500">
      <InfoBox color="bg-purple-900/20 border-purple-700/40 text-purple-200">
        プロフィールのアバターを将棋の駒アイコンに変更できます。対局数・勝利数・レートが一定値に達すると解放されます。
      </InfoBox>
      <div className="flex gap-6 overflow-x-auto pb-4 items-end justify-center">
        {[
          { char: '歩兵', label: '歩兵（初期）', promoted: false, color: 'text-slate-500' },
          { char: '香車', label: '香車',         promoted: false, color: 'text-slate-500' },
          { char: '飛車', label: '飛車',         promoted: false, color: 'text-slate-500' },
          { char: '角行', label: '角行',         promoted: false, color: 'text-slate-500' },
          { char: '王将', label: '王将（最高）', promoted: true,  color: 'text-amber-400 font-black' },
        ].map(p => (
          <div key={p.char} className="flex flex-col items-center gap-2 shrink-0">
            <ShogiPiece char={p.char} scale={p.promoted ? 0.55 : 0.45} isPromoted={p.promoted} />
            <span className={`text-[10px] ${p.color}`}>{p.label}</span>
          </div>
        ))}
      </div>
    </Section>

    <Section title="段位・級位の申請" accent="border-indigo-500">
      <InfoBox color="bg-indigo-900/20 border-indigo-700/40 text-indigo-200">
        将棋ウォーズや将棋連盟道場などで取得したランクを登録できます。承認されるとプロフィールとランキングに表示されます。
      </InfoBox>
      <div className="space-y-3">
        <Step n={1} title="個人ページを開く">個人データ → 自分を選択 → PINを入力</Step>
        <Step n={2} title="「段位・級位」カードを探す">プロフィール画面をスクロールすると「段位・級位」カードがあります</Step>
        <Step n={3} title="「ランクを申請する」ボタンを押す">棋力認定元（例：将棋ウォーズ）、段位・級位（例：2級）を入力して送信</Step>
        <Step n={4} title="管理者の承認を待つ">管理者が管理画面で確認・承認するとプロフィールに表示されます</Step>
      </div>
    </Section>
  </div>
);

// ─── タブ4: イベント・紅白戦 ─────────────────────────────────

const TabEvents = () => (
  <div className="space-y-8 animate-in fade-in duration-300">
    <Section title="イベントの種類" accent="border-red-500">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-red-900/30 to-blue-900/30 border border-yellow-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 font-black text-yellow-300 mb-3">
            <Swords size={18} /> 紅白戦（FACTION WAR）
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            部員を紅組・白組に分けてチーム対抗戦。各対局の獲得ポイントがチームの合計スコアになります。
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 font-black text-blue-300 mb-3">
            <Zap size={18} /> ポイントマッチ（STANDARD）
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            イベント期間中、ポイント獲得量に倍率がかかります。チーム分けなしの個人戦です。
          </p>
        </div>
      </div>
    </Section>

    <Section title="紅白戦の流れ" accent="border-orange-500">
      <div className="space-y-3">
        <Step n={1} title="チーム分け">
          管理画面 → 「自動振り分け」でレートバランスを考慮して自動分類。手動変更も可能。
        </Step>
        <Step n={2} title="大将を任命">
          管理画面で紅組・白組それぞれの大将を指定。<br />
          <span className="text-yellow-300 font-bold">→ 大将に任命されると「大将軍」の称号が即座に付与されます</span>
        </Step>
        <Step n={3} title="対局を重ねる">
          通常通り対局を記録。勝者の獲得ポイントがチームスコアに加算。ダッシュボードでリアルタイム確認できます。
        </Step>
        <Step n={4} title="一騎討ち（大将同士の対局）">
          紅組大将と白組大将が対局すると<strong>自動的に「一騎討ち」</strong>として認識されます。<br />
          <span className="text-yellow-300 font-bold">→ 勝者に「一騎討ち」の称号が付与されます</span>
        </Step>
        <Step n={5} title="イベント終了">管理画面 → イベント終了。スコア上位チームが勝利！</Step>
      </div>

      <InfoBox color="bg-yellow-900/20 border-yellow-700/40 text-yellow-200">
        <div className="flex items-center gap-2 font-black mb-2"><AlertCircle size={14} /> 一騎討ちの自動判定条件（全部満たす必要あり）</div>
        <ul className="space-y-1 text-sm">
          <li>✅ 紅白戦イベントが開催中</li>
          <li>✅ 対局する2人が両方「大将」に指定されている</li>
          <li>✅ 2人が異なるチーム（紅組 vs 白組）に所属している</li>
        </ul>
      </InfoBox>
    </Section>

    <Section title="ダッシュボードの見方（紅白戦中）" accent="border-red-500">
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-black text-red-400 font-mono">248</div>
            <div className="text-[10px] text-red-300 font-black flex items-center gap-1">
              <Flame size={10} /> 紅組 — 12勝（一騎討ち1）
            </div>
          </div>
          <div className="text-center flex-1 px-4">
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-l-full" style={{ width: '56%' }} />
            </div>
            <div className="text-[10px] text-slate-500 mt-1">ゲージ = スコア比率</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-blue-400 font-mono">197</div>
            <div className="text-[10px] text-blue-300 font-black flex items-center gap-1 justify-end">
              白組 — 9勝 <Snowflake size={10} />
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500">大将のアバターには 👑 バッジが表示されます。</p>
      </div>
    </Section>
  </div>
);

// ─── タブ5: 個人ページ ────────────────────────────────────────

const TabProfile = () => (
  <div className="space-y-8 animate-in fade-in duration-300">
    <Section title="個人ページを開くまで" accent="border-blue-500">
      <div className="space-y-3">
        <Step n={1} title="ナビから「個人データ」を選ぶ">画面下部（スマホ）または左サイドバー（PC）の人型アイコンをタップ</Step>
        <Step n={2} title="自分の名前を選ぶ">部員一覧から自分の名前を選択します</Step>
        <Step n={3} title="PINを入力する">
          数字キーパッドが出るので4桁のPINを入力 → 「開く」<br />
          <span className="text-slate-400">初期PINは <code className="bg-slate-800 px-1 rounded font-mono">0000</code>。変更は管理者に依頼。</span>
        </Step>
      </div>
      <InfoBox color="bg-green-900/20 border-green-700/40 text-green-200">
        <div className="flex items-center gap-2 font-black mb-1"><Lock size={14} /> ロック機能</div>
        ページ右上の「ロック」ボタンを押すと即座にPIN画面に戻ります。共有端末で使用した後は必ずロックしてください。
      </InfoBox>
    </Section>

    <Section title="個人ページでできること" accent="border-purple-500">
      <div className="space-y-3">
        {[
          { icon: <BarChart2 size={16} className="text-blue-400" />,  title: 'レート推移グラフ', desc: '過去の対局でレートがどう変化したかを折れ線グラフで確認できます' },
          { icon: <GitBranch size={16} className="text-green-400" />, title: '勝敗・連勝記録',   desc: '勝利数・敗北数・引き分け・最大連勝・現在の連勝を確認できます' },
          { icon: <Target size={16} className="text-red-400" />,      title: 'ライバル分析',     desc: '最も勝ち越している相手（お得意様）と最も負け越している相手（天敵）が表示されます' },
          { icon: <Award size={16} className="text-yellow-400" />,    title: '称号の選択',       desc: '解放済みの称号一覧から、プロフィールに表示する称号を選べます' },
          { icon: <Star size={16} className="text-purple-400" />,     title: 'アイコンの変更',   desc: '解放済みのアイコンからアバターを選べます' },
          { icon: <Medal size={16} className="text-indigo-400" />,    title: '段位・級位の申請', desc: '将棋ウォーズ等の段位を申請できます（管理者承認後に表示）' },
          { icon: <Heart size={16} className="text-rose-400" />,      title: '最近の対局履歴',   desc: '直近10局の結果と相手・レート変動を確認できます' },
        ].map(item => (
          <div key={item.title} className="flex items-start gap-3 bg-slate-900 border border-white/5 rounded-xl p-4">
            <div className="mt-0.5 shrink-0">{item.icon}</div>
            <div>
              <div className="font-black text-white text-sm">{item.title}</div>
              <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </Section>

    <Section title="公開ページ（/board）での個人ページ" accent="border-cyan-500">
      <InfoBox color="bg-cyan-900/20 border-cyan-700/40 text-cyan-200">
        公開ページからも個人ページが閲覧できます。通常と同じくPIN認証が必要です。<br />
        称号変更・アイコン変更・段位申請も公開ページから行えます。
      </InfoBox>
    </Section>
  </div>
);

// ─── タブ6: 管理者向け ────────────────────────────────────────

const TabAdmin = () => (
  <div className="space-y-8 animate-in fade-in duration-300">
    <InfoBox color="bg-red-900/20 border-red-700/40 text-red-200">
      <div className="flex items-center gap-2 font-black mb-1"><Settings size={14} /> 管理者専用の情報です</div>
      管理画面（管理者PIN必要）から操作します。部長・副部長のみが知るPINで保護されています。
    </InfoBox>

    <Section title="部員管理" accent="border-blue-500">
      <div className="space-y-3">
        <Accordion title="部員を追加する" defaultOpen>
          <Step n={1} title="管理画面を開く">管理者PINを入力して管理画面へ</Step>
          <Step n={2} title="「部員管理」カードを探す">左列にあります</Step>
          <Step n={3} title="名前を入力して追加">名前を入力 → 「追加」ボタン。初期レート0、初期PIN「0000」で作成されます</Step>
        </Accordion>
        <Accordion title="部員を退部させる（ソフト削除）">
          <p>「退部」ボタンを押します。データは保持されます（レート・実績はすべて残ります）。再入班も可能です。</p>
        </Accordion>
        <Accordion title="個人PINを変更する">
          <p>右列の「個人ページPIN管理」カードで部員を選択 → 4桁の新PINを入力 → 「PINを変更する」</p>
          <p className="text-yellow-200 mt-1">部員本人からの依頼を受けて管理者が変更します。</p>
        </Accordion>
      </div>
    </Section>

    <Section title="対局記録" accent="border-green-500">
      <div className="space-y-3">
        <Accordion title="対局を記録する" defaultOpen>
          <Step n={1} title="「対戦記録」ページを開く">管理者PINを入力</Step>
          <Step n={2} title="対戦者を選ぶ">Player 1・Player 2 のカードをタップして部員を選択</Step>
          <Step n={3} title="結果を入力">勝ったほうの「Winner」ボタンを押す（または「Draw」）</Step>
          <Step n={4} title="登録">「対局を登録」ボタンで確定。レート・ポイントが自動計算されます</Step>
        </Accordion>
        <Accordion title="対局を取り消す（Undo）">
          <p>画面右下のUndoパネル（↩ ボタン）から直近の操作を取り消せます。最大10件まで遡れます。</p>
          <p className="text-yellow-200 mt-1">⚠️ Undoはクラウドにも反映されます。</p>
        </Accordion>
      </div>
    </Section>

    <Section title="イベント管理" accent="border-red-500">
      <div className="space-y-3">
        <Accordion title="紅白戦を開始する" defaultOpen>
          <Step n={1} title="管理画面 → 「イベント設定」">右列にあります</Step>
          <Step n={2} title="イベント名・種類・終了日時を設定">種類を「紅白戦」に選択</Step>
          <Step n={3} title="チームを振り分ける">「自動振り分け」ボタンでレートバランスを考慮して自動分類</Step>
          <Step n={4} title="大将を任命する">「大将を選ぶ」から紅組・白組の大将を指定 → 「大将軍」称号が自動付与</Step>
          <Step n={5} title="完了">設定を保存すると即座にイベントが始まります</Step>
        </Accordion>
        <Accordion title="イベントポイントをリセットする">
          <p>「イベントポイントをリセット」ボタンで全員のイベントポイントを0に戻せます。</p>
          <p className="text-yellow-200 mt-1">⚠️ 通常の総ポイントには影響しません。イベントポイントのみリセットされます。</p>
        </Accordion>
      </div>
    </Section>

    <Section title="シーズン管理" accent="border-purple-500">
      <div className="space-y-3">
        <Accordion title="シーズンをリセットする">
          <p>「月次リセット」を実行すると今期の成長スコアがリセットされ、新シーズンが始まります。</p>
          <p className="text-slate-400 mt-1">レート・総ポイント・実績はそのまま。「今期成長」ランキングの基準点だけリセットされます。</p>
        </Accordion>
        <Accordion title="システム称号（四天王）を更新する">
          <p>「称号を更新」ボタンで四天王の再計算と付与が行われます。シーズン終了時やイベント後に実行するのがおすすめです。</p>
        </Accordion>
      </div>
    </Section>

    <Section title="データ管理" accent="border-amber-500">
      <div className="space-y-3">
        <Accordion title="バックアップとリストア">
          <p>データは<strong>毎日自動でローカルにバックアップ</strong>されます（7日分保持）。</p>
          <p className="mt-2">「自動バックアップ」パネルから過去のデータに復元できます。</p>
          <p className="text-yellow-200 mt-1">⚠️ リストアするとその時点以降のデータは失われます。</p>
        </Accordion>
        <Accordion title="メンテナンスモード">
          <p>大規模な変更を行うときに使います。メンテナンス中の変更は「サンドボックス」に保存され、終了時に本番へ反映するかどうかを選べます。</p>
        </Accordion>
        <Accordion title="段位・級位申請の承認">
          <p>右列「段位・級位の申請」パネルに承認待ちの申請が表示されます。</p>
          <p className="mt-1">「承認」→ 即座にユーザーのプロフィールに反映・Firebase同期<br />
          「却下」→ 却下理由（任意）を入力して拒否</p>
        </Accordion>
      </div>
    </Section>

    <Section title="公開ランキングページの共有" accent="border-cyan-500">
      <InfoBox color="bg-cyan-900/20 border-cyan-700/40 text-cyan-200">
        <div className="font-black mb-2 flex items-center gap-2"><Globe size={14} /> URLを知っている人だけが閲覧できます</div>
        <p>管理画面右列「公開ランキングページ」カードからURLをコピー → 部員や観客に共有。</p>
        <p className="mt-2 text-xs">管理者PINは不要。ランキング閲覧・個人ページ（PIN必要）のみ可能。管理機能へのリンクはありません。</p>
      </InfoBox>
    </Section>
  </div>
);

// ─── メインコンポーネント ─────────────────────────────────────

type TabKey = 'intro' | 'rate' | 'achievements' | 'events' | 'profile' | 'admin';

const TABS: { key: TabKey; label: string; icon: React.ReactNode; activeColor: string }[] = [
  { key: 'intro',        label: 'はじめに',        icon: <BookOpen size={14} />,   activeColor: 'bg-slate-600' },
  { key: 'rate',         label: 'レート・ポイント', icon: <TrendingUp size={14} />, activeColor: 'bg-blue-600' },
  { key: 'achievements', label: '称号・実績',       icon: <Award size={14} />,      activeColor: 'bg-yellow-600' },
  { key: 'events',       label: 'イベント',         icon: <Swords size={14} />,     activeColor: 'bg-red-600' },
  { key: 'profile',      label: '個人ページ',       icon: <Users size={14} />,      activeColor: 'bg-purple-600' },
  { key: 'admin',        label: '管理者向け',       icon: <Settings size={14} />,   activeColor: 'bg-orange-600' },
];

export const Guide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('intro');

  const renderTab = () => {
    switch (activeTab) {
      case 'intro':        return <TabIntro />;
      case 'rate':         return <TabRate />;
      case 'achievements': return <TabAchievements />;
      case 'events':       return <TabEvents />;
      case 'profile':      return <TabProfile />;
      case 'admin':        return <TabAdmin />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-5xl font-black text-white tracking-tighter mb-2 font-serif-jp">ガイドブック</h2>
        <p className="text-slate-400 font-bold text-sm">Club Rivals の使い方・仕様書</p>
      </div>

      {/* Tab bar — scroll on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm whitespace-nowrap transition-all shrink-0 ${
              activeTab === tab.key
                ? `${tab.activeColor} text-white shadow-lg scale-105`
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="text-slate-200">
        {renderTab()}
      </div>
    </div>
  );
};
