import React, { useState } from 'react';
import {
  Home, Trophy, User as UserIcon, Settings, PlusCircle, BookOpen,
  Star, Award, Crown, Swords, Globe, Medal, Shield, TrendingUp,
  Calendar, Lock, Key, ChevronDown, ChevronRight, Info, Zap,
  AlertTriangle, CheckCircle, ArrowRight, Users, RotateCcw,
  Flame, Snowflake, Eye, FileText, Database, RefreshCw,
  Smartphone, LayoutGrid, Layers, ToggleRight, Minus, Plus,
  Monitor, Cloud, Hash, Cpu
} from 'lucide-react';
import { Tutorial, isTutorialDone, markTutorialDone } from './Tutorial';

// ─── シンプル/詳細 トグルコンテキスト ────────────────────────
const ModeCtx = React.createContext<boolean>(false);
const useSimple = () => React.useContext(ModeCtx);

// ─── 共通 UI ─────────────────────────────────────────────────

/** アコーディオン — 詳細モードのみ表示 */
const Acc: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({
  title, children, defaultOpen = false,
}) => {
  const simple = useSimple();
  const [open, setOpen] = useState(defaultOpen);
  if (simple) return null;
  return (
    <div className="border border-white/5 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left gap-3"
      >
        <span className="font-black text-sm text-slate-200">{title}</span>
        {open
          ? <ChevronDown size={15} className="text-slate-500 shrink-0" />
          : <ChevronRight size={15} className="text-slate-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 py-4 bg-slate-900/60 text-sm text-slate-300 font-medium leading-relaxed space-y-3">
          {children}
        </div>
      )}
    </div>
  );
};

/** ヒントボックス */
const Tip: React.FC<{ children: React.ReactNode; type?: 'info' | 'warn' | 'ok' }> = ({ children, type = 'info' }) => {
  const styles = {
    info: 'bg-blue-900/20 border-blue-700/40 text-blue-200',
    warn: 'bg-amber-900/20 border-amber-700/40 text-amber-200',
    ok:   'bg-green-900/20 border-green-700/40 text-green-200',
  };
  const icons = {
    info: <Info size={13} />,
    warn: <AlertTriangle size={13} />,
    ok:   <CheckCircle size={13} />,
  };
  return (
    <div className={`flex gap-2 p-3 rounded-xl border text-xs font-bold leading-relaxed ${styles[type]}`}>
      <span className="shrink-0 mt-0.5">{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
};

/** ステップ */
const Step: React.FC<{ n: number; title: string; children?: React.ReactNode }> = ({ n, title, children }) => (
  <div className="flex gap-3">
    <div className="w-7 h-7 rounded-full bg-blue-600/80 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
      {n}
    </div>
    <div>
      <div className="font-black text-white text-sm">{title}</div>
      {children && <div className="text-xs text-slate-400 font-medium leading-relaxed mt-0.5">{children}</div>}
    </div>
  </div>
);

/** セクション見出し */
const H: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
  <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
    {icon && <span className="text-blue-400">{icon}</span>}
    <h3 className="font-black text-white text-base">{children}</h3>
  </div>
);

/** テーブル */
const Table: React.FC<{ rows: [string, string][] }> = ({ rows }) => (
  <div className="rounded-xl overflow-hidden border border-white/5 text-xs">
    {rows.map(([k, v], i) => (
      <div key={i} className={`flex gap-3 px-4 py-2.5 font-bold ${i % 2 === 0 ? 'bg-slate-800/60' : 'bg-slate-900/60'}`}>
        <span className="text-slate-400 shrink-0 w-36">{k}</span>
        <span className="text-slate-200">{v}</span>
      </div>
    ))}
  </div>
);

/** シンプルモード用のクイックカード */
const QCard: React.FC<{ icon: React.ReactNode; title: string; desc: string; color?: string }> = ({
  icon, title, desc, color = 'text-blue-400',
}) => (
  <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex gap-3 items-start">
    <span className={`${color} shrink-0 mt-0.5`}>{icon}</span>
    <div>
      <div className="font-black text-white text-sm">{title}</div>
      <div className="text-xs text-slate-400 font-medium leading-relaxed mt-0.5">{desc}</div>
    </div>
  </div>
);

/** シンプルモードのみ表示 */
const SimpleOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const simple = useSimple();
  return simple ? <>{children}</> : null;
};

/** 詳細モードのみ表示 */
const DetailOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const simple = useSimple();
  return !simple ? <>{children}</> : null;
};

// ─── 四天王バッジ ─────────────────────────────────────────────
const FK_CFG: Record<string, { gradient: string; icon: string; label: string }> = {
  MASTER:       { gradient: 'from-yellow-400 to-amber-500',  icon: '⚔️', label: '覇者' },
  RISING_STAR:  { gradient: 'from-sky-400 to-blue-500',      icon: '🌟', label: '新星' },
  GRINDER:      { gradient: 'from-emerald-400 to-teal-500',  icon: '🛡️', label: '鉄人' },
  GIANT_KILLER: { gradient: 'from-rose-400 to-pink-500',     icon: '💀', label: '巨人キラー' },
};
const FKBadge: React.FC<{ id: string }> = ({ id }) => {
  const c = FK_CFG[id];
  if (!c) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-black bg-gradient-to-r ${c.gradient} text-slate-900 border border-white/20 shrink-0`}>
      {c.icon} {c.label}
    </span>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// タブ: はじめに
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TabIntro = () => (
  <div className="space-y-6">
    {/* Hero */}
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-500/20 p-7">
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl" />
      <div className="relative">
        <div className="text-[11px] font-black uppercase tracking-widest text-blue-400 mb-2">Club Rivals</div>
        <h2 className="text-2xl font-black text-white mb-2 leading-tight">将棋班の活動を<br />記録・可視化・盛り上げる</h2>
        <p className="text-slate-400 text-sm font-medium">対局記録・レーティング・称号・イベントをひとつのアプリで管理する、将棋班向けの班活管理ツールです。</p>
      </div>
    </div>

    {/* 機能カード */}
    <div className="grid grid-cols-2 gap-3">
      {[
        { icon: <PlusCircle size={18}/>, label: '対局記録',   desc: 'Eloレートを自動計算', color: 'text-red-400',    bg: 'bg-red-900/20 border-red-700/20' },
        { icon: <Trophy size={18}/>,     label: 'ランキング', desc: '4軸＋四天王で比較',   color: 'text-amber-400',  bg: 'bg-amber-900/20 border-amber-700/20' },
        { icon: <Star size={18}/>,       label: '称号・実績', desc: '活動で自動解放',       color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-700/20' },
        { icon: <Swords size={18}/>,     label: 'イベント',   desc: '紅白戦・ポイントマッチ', color: 'text-rose-400', bg: 'bg-rose-900/20 border-rose-700/20' },
        { icon: <Medal size={18}/>,      label: '段位登録',   desc: 'ウォーズ等の棋力を申請', color: 'text-purple-400', bg: 'bg-purple-900/20 border-purple-700/20' },
        { icon: <Globe size={18}/>,      label: '公開ページ', desc: 'URL共有で外部閲覧',    color: 'text-cyan-400',   bg: 'bg-cyan-900/20 border-cyan-700/20' },
      ].map(item => (
        <div key={item.label} className={`${item.bg} border rounded-2xl p-4`}>
          <span className={item.color}>{item.icon}</span>
          <div className="font-black text-white text-sm mt-2">{item.label}</div>
          <div className="text-[11px] text-slate-400 font-bold mt-0.5">{item.desc}</div>
        </div>
      ))}
    </div>

    {/* 画面一覧 */}
    <div className="space-y-3">
      <H icon={<LayoutGrid size={16}/>}>画面一覧</H>
      <Table rows={[
        ['🏠 ホーム',      '出席記録・イベント状況・四天王'],
        ['⊕ 対局記録',    '結果入力（管理者PIN必要）'],
        ['🏆 ランキング',  '全班員の順位・四天王基準'],
        ['👤 個人データ',  'レート推移・称号・ライバル（PIN必要）'],
        ['📖 ガイド',      'このページ'],
        ['⚙️ 管理画面',   '班員管理・各種設定（管理者専用）'],
        ['🌐 /board',     'URL共有の閲覧専用ページ'],
      ]} />
    </div>

    {/* PINコード */}
    <div className="space-y-3">
      <H icon={<Key size={16}/>}>PINコード</H>
      <Table rows={[
        ['管理者PIN', '対局登録・管理画面の操作に必要'],
        ['個人PIN',   '個人ページの閲覧に必要。初期値 000000'],
      ]} />
      <Tip type="warn">管理者PINは他の班員に見られないよう管理してください。</Tip>
    </div>

    {/* 基本の流れ */}
    <div className="space-y-3">
      <H icon={<ArrowRight size={16}/>}>基本の流れ</H>
      <div className="space-y-3">
        <Step n={1} title="出席を記録する">ホームで自分の名前をタップ → 出席ポイントが付与される</Step>
        <Step n={2} title="対局を記録する">対局記録ページで相手・結果・管理者PINを入力して送信</Step>
        <Step n={3} title="結果を確認する">ランキングや個人ページでレートとポイントの変動を確認</Step>
        <Step n={4} title="称号を集める">対局・出席を重ねると称号やアイコンが自動解放される</Step>
      </div>
    </div>

    <DetailOnly>
      <Acc title="データの保存場所">
        <Table rows={[
          ['ローカル（このデバイス）', 'ブラウザに保存。即時読み書き可能'],
          ['Firebase（クラウド）',     'ネット上に保存。複数端末で共有できる'],
        ]} />
        <p className="text-xs text-slate-400 mt-2">書き込みから3秒後に自動でクラウドへ同期。画面右下のアイコンで状態を確認できる。毎日自動バックアップも取られる。</p>
        <Tip type="ok">管理画面からバックアップを復元できる。</Tip>
      </Acc>
    </DetailOnly>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// タブ: 対局
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TabMatch = () => (
  <div className="space-y-6">
    {/* シンプルモード */}
    <SimpleOnly>
      <div className="space-y-3">
        <QCard icon={<PlusCircle size={18}/>} title="対局の記録手順" color="text-red-400"
          desc="① 対局記録ページを開く → ② P1・P2を選択 → ③ 勝者カードをタップ → ④ 管理者PIN入力 → 送信" />
        <QCard icon={<RotateCcw size={18}/>} title="取り消したいとき" color="text-amber-400"
          desc="画面右下の「↩」ボタンからUNDOパネルを開き「直前に戻す」を押す。直近10件まで対応。" />
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-green-400">勝ち</div>
            <div className="text-[11px] text-slate-400 font-bold mt-1">レート↑ ポイント獲得</div>
          </div>
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-red-400">負け</div>
            <div className="text-[11px] text-slate-400 font-bold mt-1">レート↓ 最低1pt獲得</div>
          </div>
        </div>
      </div>
    </SimpleOnly>

    {/* 詳細モード */}
    <DetailOnly>
      <div className="space-y-3">
        <H icon={<PlusCircle size={16}/>}>対局の記録手順</H>
        <div className="space-y-3">
          <Step n={1} title="「対局記録」ページを開く">下部ナビの ⊕ ボタンから</Step>
          <Step n={2} title="Player 1 を選ぶ">班員リストからタップして選択</Step>
          <Step n={3} title="Player 1 の PIN を入力">本人が自分のPINを入力（他の人に見せない）。初期値（000000）のままだと対局できない。</Step>
          <Step n={4} title="Player 2 を選ぶ">同様に選択。同じ人は選べない</Step>
          <Step n={5} title="Player 2 の PIN を入力">同様に本人が入力</Step>
          <Step n={6} title="勝者を選んで送信">勝者ボタン or 引き分けを選択 → 「記録する」を押す（管理者PIN不要）</Step>
        </div>
      </div>

      <div className="space-y-3">
        <H icon={<Eye size={16}/>}>結果画面の見方</H>
        <Table rows={[
          ['Rate変動',   '今回の対局でレートがいくら変わったか（+/−）'],
          ['Points獲得', '今回の対局で得たポイント（負けても最低1pt）'],
          ['ポイント内訳', 'ベース・連勝ボーナス・新入生ボーナス・イベント倍率など'],
          ['新着称号',   '今回の対局で新たに解放された称号があれば表示'],
        ]} />
      </div>

      <div className="space-y-3">
        <H icon={<Smartphone size={16}/>}>デバイス承認について</H>
        <p className="text-sm text-slate-400 font-medium">出席記録には「承認済みデバイス」からの操作が必要。管理画面 → デバイス管理から承認できる。</p>
        <Tip type="info">対局記録は管理者PINで保護されているため、デバイス承認は不要。出席のみ承認が必要。</Tip>
      </div>

      <Acc title="引き分けの仕組み">
        <p>引き分けはレートが微増（0以上）し、ポイントも少量もらえる。</p>
        <Tip type="info">格上との引き分けほどレートが上がる設計。</Tip>
      </Acc>

      <Acc title="スパム防止ペナルティ">
        <p>24時間以内に同じ相手と繰り返し対局すると3局目以降からポイント獲得が徐々に減る。レート変動は通常通り。翌日にはリセットされる。</p>
      </Acc>

      <Acc title="対局の取り消し（UNDO）">
        <p>画面右下の「↩」ボタンからUNDOパネルを開く。「直前に戻す」で最新1件を取り消し、「ここまで戻す」で複数件まとめて戻せる。直近10件まで保存される。</p>
        <Tip type="warn">UNDO後はFirebaseにも即時反映される。他端末でも同期される。</Tip>
      </Acc>
    </DetailOnly>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// タブ: レート & ポイント
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TabRate = () => (
  <div className="space-y-6">
    {/* Rate */}
    <div className="space-y-3">
      <H icon={<TrendingUp size={16}/>}>レート（Rate）</H>
      <SimpleOnly>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '初期値', value: '0', color: 'text-slate-300' },
            { label: '勝ち',   value: '+α',  color: 'text-green-400' },
            { label: '負け',   value: '−α',  color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-900 border border-white/5 rounded-2xl p-4 text-center">
              <div className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-slate-500 font-bold mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 font-medium">将棋ウォーズと同じ <strong className="text-white">Eloレーティング</strong> 方式。格上に勝つほど大きく上がり、格下に負けるほど大きく下がる。レートは0未満にならない。</p>
      </SimpleOnly>
      <DetailOnly>
        <p className="text-sm text-slate-400 font-medium">将棋ウォーズと同じ <strong className="text-white">Eloレーティング</strong> 方式。初期値は 0。</p>
        <Table rows={[
          ['初期値',       '0（全員同じスタートライン）'],
          ['最低値',       '0（マイナスにはならない）'],
          ['勝ったとき',   '最低でも +1 は上がる'],
          ['負けたとき',   '最大で −自分のレート まで下がる（0未満にはならない）'],
          ['引き分け',     '格上相手なら +α、格下相手なら ±0'],
        ]} />
        <Acc title="Eloの計算式">
          <p>K係数 = <strong className="text-white">32</strong></p>
          <p>期待勝率 = <code className="bg-slate-800 px-2 py-0.5 rounded text-xs">1 / (1 + 10^((相手レート - 自分レート) / 400))</code></p>
          <p>レート変動 = <code className="bg-slate-800 px-2 py-0.5 rounded text-xs">K × (実際の結果 - 期待勝率)</code></p>
        </Acc>
      </DetailOnly>
    </div>

    {/* Points */}
    <div className="space-y-3">
      <H icon={<Star size={16}/>}>ポイント（Points）</H>
      <p className="text-sm text-slate-400 font-medium">出席や対局で貯まる「活動量」の指標。<strong className="text-white">負けても必ずもらえる</strong>ので、参加するほど有利。</p>
      <Table rows={[
        ['出席',             '班活に来るだけでもらえる'],
        ['対局（勝ち）',     '設定値のポイント'],
        ['対局（負け）',     '設定値の半分（0にはならない）'],
        ['連勝ボーナス',     '3連勝以上で追加ポイント'],
        ['新入生ボーナス',   '新入生は一定期間、割増'],
        ['イベント倍率',     'イベント期間中は全体に倍率がかかる'],
      ]} />
    </div>

    {/* ランキングの4軸 */}
    <div className="space-y-3">
      <H icon={<Trophy size={16}/>}>ランキングの4軸</H>
      <Table rows={[
        ['今期成長',   'シーズン開始時からのレート増加＋ポイント増加の合計'],
        ['レート',     '現在のEloレート。純粋な実力値'],
        ['活動日数',   '今シーズンに班活に来た日数'],
        ['総ポイント', '累計の活動ポイント'],
      ]} />
      <Tip type="info">「今期成長」は実力の強さだけでなく、頑張りも評価される指標。レートが低くても大きく伸びれば上位に入れる。</Tip>
    </div>

    <DetailOnly>
      <Acc title="シーズン管理のタイミング">
        <Step n={1} title="四天王を更新">現在の成績で称号を確定させる</Step>
        <Step n={2} title="シーズン基準値をスナップショット">現在のレート・ポイントを「今期の基準」として記録</Step>
        <Step n={3} title="月次リセットを実行">今月の活動日数・イベントポイントをリセット</Step>
        <Tip type="ok">総ポイントとレートはリセットされない。活動日数などの今月分のみリセット対象。</Tip>
      </Acc>
    </DetailOnly>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// タブ: 称号・アイコン
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TabAchievements = () => (
  <div className="space-y-6">
    {/* 称号 */}
    <div className="space-y-3">
      <H icon={<Award size={16}/>}>称号（Title）</H>
      <p className="text-sm text-slate-400 font-medium">条件を満たすと自動で解放される。個人ページで表示する称号を1つ選べる。</p>
      <DetailOnly>
        <Table rows={[
          ['初対局',       '初めて対局を記録する'],
          ['勝利への道',   '1勝する'],
          ['10勝達成',     '通算10勝'],
          ['連勝記録',     '3連勝以上を達成する'],
          ['出席の鬼',     '出席日数が一定数を超える'],
          ['大将軍',       '紅白戦でチームの大将に任命される'],
          ['一騎討ち',     '大将同士の直接対決に勝つ'],
          ['格上キラー',   '自分より高レートの相手に勝つ'],
        ]} />
      </DetailOnly>
    </div>

    {/* 四天王 */}
    <div className="space-y-3">
      <H icon={<Crown size={16}/>}>システム称号（四天王）</H>
      <p className="text-sm text-slate-400 font-medium">各部門でシーズン1位の班員に自動付与される特別称号。毎月の更新時に再計算される。</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { id: 'MASTER',       desc: '今期レート上昇1位' },
          { id: 'RISING_STAR',  desc: '今期ポイント上昇1位' },
          { id: 'GRINDER',      desc: '出席日数1位' },
          { id: 'GIANT_KILLER', desc: '格上撃破数1位' },
        ].map(t => (
          <div key={t.id} className="bg-slate-900 border border-yellow-500/20 rounded-2xl p-4 space-y-2">
            <FKBadge id={t.id} />
            <div className="text-[11px] text-slate-400 font-bold">{t.desc}</div>
          </div>
        ))}
      </div>
      <Tip type="info">四天王称号は兼任可能（複数の班員が同時に保持できる）。履歴も管理画面で確認できる。</Tip>
    </div>

    {/* アイコン・フレーム */}
    <div className="space-y-3">
      <H icon={<Layers size={16}/>}>アイコン・フレーム</H>
      <p className="text-sm text-slate-400 font-medium">プロフィールに表示する将棋駒アイコンとフレームを選択できる。条件を満たすと新しいものが解放される。</p>
      <DetailOnly>
        <Table rows={[
          ['アイコン変更', '個人ページ → 「アイコンを変更」ボタン'],
          ['フレーム変更', '個人ページ → 「フレームを変更」ボタン'],
          ['解放条件',     '対局数・レート・出席日数・称号などで解放'],
          ['四天王限定',   '四天王保持中のみ使えるフレームがある'],
        ]} />
      </DetailOnly>
    </div>

    {/* 段位・級位 */}
    <div className="space-y-3">
      <H icon={<Medal size={16}/>}>段位・級位の登録</H>
      <p className="text-sm text-slate-400 font-medium">将棋ウォーズ等の外部棋力認定を登録できる。管理者が承認するとプロフィールとランキングに表示される。</p>
      <DetailOnly>
        <div className="space-y-3">
          <Step n={1} title="個人ページを開く">個人データ → 自分を選択 → PIN入力</Step>
          <Step n={2} title="「ランクを申請する」を押す">認定元（例：将棋ウォーズ）と段位・級位（例：2級）を入力</Step>
          <Step n={3} title="管理者の承認を待つ">承認されるとプロフィールに表示される</Step>
        </div>
      </DetailOnly>
    </div>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// タブ: イベント
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TabEvents = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <H icon={<Swords size={16}/>}>イベントの種類</H>
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-2xl p-4">
          <div className="font-black text-blue-300 text-sm flex items-center gap-2"><Zap size={14}/> ポイントマッチ</div>
          <div className="text-xs text-slate-400 font-medium mt-1">期間中の対局ポイントに倍率がかかる。レートは通常通り。</div>
        </div>
        <div className="bg-rose-900/20 border border-rose-700/30 rounded-2xl p-4">
          <div className="font-black text-rose-300 text-sm flex items-center gap-2"><Swords size={14}/> 紅白戦</div>
          <div className="text-xs text-slate-400 font-medium mt-1">紅組・白組に分かれて対戦。チームのポイント合計で勝敗を競う。</div>
        </div>
      </div>
    </div>

    {/* 紅白戦の詳細 */}
    <div className="space-y-3">
      <H icon={<Users size={16}/>}>紅白戦の仕組み</H>
      <Table rows={[
        ['チーム分け',     '管理者がシャッフル → レートが均等になるよう自動振り分け。手動変更も可'],
        ['大将（将軍）',   '各チーム1人を任命。任命時に「大将軍」称号が付与される'],
        ['一騎討ち',       '大将同士の対局は自動で一騎討ち判定。勝者に「一騎討ち」称号'],
        ['チームスコア',   'イベント期間中の各班員のポイント合計がチームスコアになる'],
      ]} />
      <Tip type="info">ホーム画面のゲージでリアルタイムにチームスコアが確認できる。</Tip>
    </div>

    <DetailOnly>
      <Acc title="イベントの設定手順（管理者）">
        <Step n={1} title="管理画面 → 「イベント管理」を開く" />
        <Step n={2} title="イベント種類・名前・終了日を設定する">終了日を過ぎると自動でイベント終了</Step>
        <Step n={3} title="紅白戦の場合はチームを編成する">「チームをシャッフル」または手動で振り分け</Step>
        <Step n={4} title="大将を任命する（任意）">大将選択ドロップダウンから選ぶ</Step>
      </Acc>
      <Acc title="イベント終了後の処理">
        <p>管理者が「イベントポイントをリセット」を押すと全員のイベントポイントが0に戻る。総ポイント・レートはリセットされない。</p>
      </Acc>
    </DetailOnly>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// タブ: 個人ページ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TabProfile = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <H icon={<UserIcon size={16}/>}>個人ページでできること</H>
      <Table rows={[
        ['プロフィール確認', 'レート・ポイント・勝敗・活動日数'],
        ['レート推移グラフ', '対局のたびに記録される折れ線グラフ'],
        ['称号変更',         '解放済み称号から表示するものを選ぶ'],
        ['アイコン変更',     '解放済み将棋駒アイコンを選ぶ'],
        ['フレーム変更',     '解放済みフレームを選ぶ'],
        ['ライバル分析',     'お得意様（最も勝ち越した相手）と天敵（最も負け越した相手）'],
        ['段位・級位',       '承認済みランクの確認と新規申請'],
        ['対局履歴',         '直近の対局結果とレート変動'],
      ]} />
    </div>

    <div className="space-y-3">
      <H icon={<Lock size={16}/>}>PIN認証</H>
      <Table rows={[
        ['初期PIN',    '000000（全員共通）'],
        ['変更方法',   '管理画面 → 「個人ページPIN管理」から変更可能'],
        ['変更権限',   '管理者のみ変更できる'],
        ['ロック',     'プロフィール内の「ロック」ボタンを押すと即ロック'],
      ]} />
    </div>

    <DetailOnly>
      <Acc title="ライバル分析の計算方法">
        <p><strong className="text-white">お得意様</strong>：対局した相手のうち、勝率が最も高い相手</p>
        <p><strong className="text-white">天敵</strong>：対局した相手のうち、勝率が最も低い相手</p>
        <Tip type="info">最低3局以上の対局がある相手のみ対象。</Tip>
      </Acc>
      <Acc title="公開ページからも個人ページを見れる？">
        <p>見られる。公開ページのランキング行をタップ → PIN入力で閲覧可能。PINを知らない人には見せられない。</p>
      </Acc>
    </DetailOnly>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// タブ: 管理者向け
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TabAdmin = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <H icon={<Settings size={16}/>}>管理画面でできること</H>
      <Table rows={[
        ['部員管理',           '追加・退班・再入班（データは保持）・CSV一括追加'],
        ['対局管理',           '直近の対局の削除'],
        ['出席・ポイント調整', '手動でポイントを加減算'],
        ['レート調整',         '手動でレートを変更'],
        ['シーズン管理',       '基準値のスナップショット・月次リセット'],
        ['四天王の更新',       'システム称号を現在の成績で再計算'],
        ['イベント管理',       '作成・チーム編成・大将任命'],
        ['段位申請の承認',     '班員からの申請を承認・却下'],
        ['PIN管理',            '個人ページPINの変更'],
        ['デバイス管理',       '出席操作を許可するデバイスの承認・取り消し'],
        ['公開URL管理',        '/board ページのURLをコピー・開く'],
        ['クラウド同期',       '手動でFirebaseと同期'],
        ['バックアップ管理',   '自動バックアップの確認・手動復元'],
        ['メンテナンスモード', 'データ整備のための安全なサンドボックス'],
        ['UNDO操作',           '直近10件の操作を取り消せるパネル'],
      ]} />
    </div>

    <DetailOnly>
      <Acc title="班員をCSVで一括追加">
        <p className="text-xs text-slate-400">以下の形式のCSVを用意してください：</p>
        <div className="bg-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300 leading-relaxed">
          名前,読み<br/>
          山田太郎,やまだたろう<br/>
          鈴木一郎,すずきいちろう
        </div>
        <Step n={1} title="管理画面 → 「CSVで一括追加」を開く" />
        <Step n={2} title="CSVファイルを選択 → 「追加する」を押す" />
      </Acc>

      <Acc title="メンテナンスモードとは">
        <p>データの大規模な整備（レートの一括変更など）を安全に行う機能。</p>
        <Table rows={[
          ['開始時', 'その時点のデータをFirebaseにバックアップ → サンドボックスで作業開始'],
          ['作業中', 'すべての書き込みが本番ではなくサンドボックスへ'],
          ['終了時', '「反映する」→本番に適用 / 「破棄する」→バックアップを復元'],
        ]} />
        <Tip type="warn">メンテナンス中は全端末にオレンジのバナーが表示される。対局記録は終了後に行うこと。</Tip>
      </Acc>

      <Acc title="シーズン更新の推奨手順">
        <Step n={1} title="四天王を更新する">現在の成績で称号を確定</Step>
        <Step n={2} title="シーズン基準値をスナップショット">レート・ポイントを今期の基準として記録</Step>
        <Step n={3} title="月次リセットを実行">活動日数・イベントポイントをリセット</Step>
        <Tip type="ok">総ポイントとレートはリセットされない。</Tip>
      </Acc>

      <Acc title="UNDOパネルの使い方">
        <p>画面右下の「↩」ボタンでUNDOパネルを開く。対局・出席・ポイント/レート調整・退部・再入班の操作に対応。直近10件まで保存。</p>
      </Acc>
    </DetailOnly>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// タブ: 公開ページ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TabPublic = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <H icon={<Globe size={16}/>}>公開ページ（/board）</H>
      <p className="text-sm text-slate-400 font-medium">管理機能を持たない閲覧専用のページ。URLを知っている人なら誰でもアクセスできる。</p>
      <Table rows={[
        ['できること',   'ランキング閲覧・個人ページ閲覧（PIN必要）・称号/アイコン変更・ランク申請'],
        ['できないこと', '対局登録・出席記録・管理画面へのアクセス'],
      ]} />
    </div>

    <div className="space-y-3">
      <H icon={<Monitor size={16}/>}>スクリーンセーバー</H>
      <p className="text-sm text-slate-400 font-medium">ホーム画面で一定時間操作がないと自動起動する。班室のモニターに映しっぱなしにするのに最適。</p>
      <DetailOnly>
        <Tip type="ok">/board ページをブラウザのフルスクリーンで開くと、ナビゲーションバーがなくなりスッキリした表示になる。</Tip>
      </DetailOnly>
    </div>

    <DetailOnly>
      <Acc title="URLの共有方法">
        <Step n={1} title="管理画面 → 「公開ランキングページ」パネルを開く" />
        <Step n={2} title="「URLをコピー」ボタンを押す">クリップボードにURLが入る</Step>
        <Step n={3} title="LINEやメール等で共有する" />
      </Acc>
      <Acc title="セキュリティ">
        <p>URLを知っている人のみアクセス可能。管理者ページへのリンクは公開ページに一切存在しないため、URLを知られても管理機能にはアクセスできない。個人ページはさらにPINで保護されている。</p>
      </Acc>
    </DetailOnly>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// タブ定義
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type TabKey = 'intro' | 'match' | 'rate' | 'achievements' | 'events' | 'profile' | 'admin' | 'public';

const TABS: { key: TabKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'intro',        label: 'はじめに',   icon: <BookOpen size={14}/>,    color: 'text-blue-400' },
  { key: 'match',        label: '対局',       icon: <PlusCircle size={14}/>,  color: 'text-red-400' },
  { key: 'rate',         label: 'レート',     icon: <TrendingUp size={14}/>,  color: 'text-green-400' },
  { key: 'achievements', label: '称号',       icon: <Star size={14}/>,        color: 'text-yellow-400' },
  { key: 'events',       label: 'イベント',   icon: <Swords size={14}/>,      color: 'text-rose-400' },
  { key: 'profile',      label: '個人',       icon: <UserIcon size={14}/>,    color: 'text-purple-400' },
  { key: 'admin',        label: '管理者',     icon: <Settings size={14}/>,    color: 'text-slate-400' },
  { key: 'public',       label: '公開',       icon: <Globe size={14}/>,       color: 'text-cyan-400' },
];

const CONTENT: Record<TabKey, React.ReactNode> = {
  intro:        <TabIntro />,
  match:        <TabMatch />,
  rate:         <TabRate />,
  achievements: <TabAchievements />,
  events:       <TabEvents />,
  profile:      <TabProfile />,
  admin:        <TabAdmin />,
  public:       <TabPublic />,
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// メインコンポーネント
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const Guide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('intro');
  const [simple, setSimple] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const activeTabDef = TABS.find(t => t.key === activeTab)!;

  return (
    <ModeCtx.Provider value={simple}>
      {showTutorial && (
        <Tutorial onDone={() => { setShowTutorial(false); }} />
      )}
      <div className="space-y-4 animate-in fade-in duration-300 pb-20">

        {/* ─── ヘッダー ─── */}
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <BookOpen size={20} className="text-blue-400" />
                <h1 className="text-2xl font-black text-white tracking-tight">ガイド</h1>
              </div>
              <p className="text-slate-500 text-xs font-bold">Club Rivals の全機能リファレンス</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* チュートリアル再表示ボタン */}
              <button
                onClick={() => { markTutorialDone(); setShowTutorial(true); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 font-black text-xs transition-all"
                title="チュートリアルを再表示"
              >
                <RotateCcw size={12}/> チュートリアル
              </button>
              {/* 簡易/詳細 トグル */}
              <button
                onClick={() => setSimple(s => !s)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border font-black text-xs transition-all ${ simple ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700' }`}
              >
                {simple ? <Minus size={13}/> : <Plus size={13}/>}
                {simple ? '簡易版 表示中' : '詳細版 表示中'}
              </button>
            </div>
          </div>

          {/* モード説明バー */}
          <div className={`mt-3 flex items-center gap-2 text-[11px] font-bold rounded-xl px-3 py-2 ${
            simple ? 'bg-blue-900/20 text-blue-300' : 'bg-slate-800/60 text-slate-500'
          }`}>
            {simple
              ? <><Eye size={12}/> キーポイントのみ表示</>
              : <><FileText size={12}/> 詳細説明・アコーディオンを含む全表示</>}
          </div>
        </div>

        {/* ─── タブバー ─── */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all shrink-0 ${
                activeTab === tab.key
                  ? 'bg-slate-700 text-white border border-white/10 shadow-sm'
                  : 'bg-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-800 border border-white/5'
              }`}
            >
              <span className={activeTab === tab.key ? tab.color : ''}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── セクションタイトル ─── */}
        <div className={`flex items-center gap-2 px-1`}>
          <span className={activeTabDef.color}>{activeTabDef.icon}</span>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{activeTabDef.label}</span>
        </div>

        {/* ─── コンテンツ ─── */}
        <div key={`${activeTab}-${simple}`} className="animate-in fade-in duration-200">
          {CONTENT[activeTab]}
        </div>
      </div>
    </ModeCtx.Provider>
  );
};
