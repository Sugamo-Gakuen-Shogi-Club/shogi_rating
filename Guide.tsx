import React, { useState } from 'react';
import {
  Home, Trophy, User as UserIcon, Settings, PlusCircle, BookOpen,
  Star, Award, Crown, Swords, Medal, Shield, TrendingUp,
  Lock, Key, ChevronDown, ChevronRight, Info, Zap,
  AlertTriangle, CheckCircle, ArrowRight, Users, RotateCcw,
  Eye, FileText, Layers, Minus, Plus, Target,
  GraduationCap, Monitor, Undo2, Map, Pencil, Trash2,
  Calendar, Cloud, Database, RefreshCw,
} from 'lucide-react';
import { Tutorial, markTutorialDone } from './Tutorial';

// ─── シンプル/詳細 トグルコンテキスト ────────────────────────
const ModeCtx = React.createContext<boolean>(false);
const useSimple = () => React.useContext(ModeCtx);

// ─── 共通 UI ─────────────────────────────────────────────────

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
        {open ? <ChevronDown size={15} className="text-slate-500 shrink-0" /> : <ChevronRight size={15} className="text-slate-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 py-4 bg-slate-900/60 text-sm text-slate-300 font-medium leading-relaxed space-y-3">
          {children}
        </div>
      )}
    </div>
  );
};

const Tip: React.FC<{ children: React.ReactNode; type?: 'info' | 'warn' | 'ok' }> = ({ children, type = 'info' }) => {
  const styles = { info: 'bg-blue-900/20 border-blue-700/40 text-blue-200', warn: 'bg-amber-900/20 border-amber-700/40 text-amber-200', ok: 'bg-green-900/20 border-green-700/40 text-green-200' };
  const icons  = { info: <Info size={13}/>, warn: <AlertTriangle size={13}/>, ok: <CheckCircle size={13}/> };
  return (
    <div className={`flex gap-2 p-3 rounded-xl border text-xs font-bold leading-relaxed ${styles[type]}`}>
      <span className="shrink-0 mt-0.5">{icons[type]}</span><span>{children}</span>
    </div>
  );
};

const Step: React.FC<{ n: number; title: string; children?: React.ReactNode }> = ({ n, title, children }) => (
  <div className="flex gap-3">
    <div className="w-7 h-7 rounded-full bg-blue-600/80 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">{n}</div>
    <div>
      <div className="font-black text-white text-sm">{title}</div>
      {children && <div className="text-xs text-slate-400 font-medium leading-relaxed mt-0.5">{children}</div>}
    </div>
  </div>
);

const H: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
  <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
    {icon && <span className="text-blue-400">{icon}</span>}
    <h3 className="font-black text-white text-base">{children}</h3>
  </div>
);

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

const QCard: React.FC<{ icon: React.ReactNode; title: string; desc: string; color?: string }> = ({ icon, title, desc, color = 'text-blue-400' }) => (
  <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 space-y-2">
    <div className={`flex items-center gap-2 ${color} font-black text-sm`}>{icon} {title}</div>
    <p className="text-xs text-slate-400 font-medium leading-relaxed">{desc}</p>
  </div>
);

const SimpleOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const simple = useSimple(); return simple ? <>{children}</> : null;
};
const DetailOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const simple = useSimple(); return !simple ? <>{children}</> : null;
};

const FK_CFG: Record<string, { gradient: string; icon: string; label: string }> = {
  MASTER:       { gradient: 'from-yellow-400 via-amber-300 to-yellow-600', icon: '⚔️', label: '覇者' },
  RISING_STAR:  { gradient: 'from-sky-400 via-cyan-300 to-blue-500',       icon: '🌟', label: '新星' },
  GRINDER:      { gradient: 'from-emerald-400 via-green-300 to-teal-500',  icon: '🛡️', label: '鉄人' },
  GIANT_KILLER: { gradient: 'from-rose-400 via-red-300 to-pink-500',       icon: '💀', label: '巨人キラー' },
};
const FKBadge: React.FC<{ id: string }> = ({ id }) => {
  const c = FK_CFG[id]; if (!c) return null;
  return <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-black bg-gradient-to-r ${c.gradient} text-slate-900 border border-white/20 shrink-0`}>{c.icon} {c.label}</span>;
};

// ━━━ タブ: はじめに ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TabIntro = () => (
  <div className="space-y-6">
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-500/20 p-7">
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl" />
      <div className="relative">
        <div className="text-[11px] font-black uppercase tracking-widest text-blue-400 mb-2">Club Rivals</div>
        <h2 className="text-2xl font-black text-white mb-2 leading-tight">巣鴨学園将棋班の活動を<br />記録・可視化・盛り上げる</h2>
        <p className="text-slate-400 text-sm font-medium">対局記録・レーティング・称号・ランキング・ミッション・指導対局をひとつで管理する将棋班専用ツール。</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      {[
        { icon: <PlusCircle size={18}/>, label: '対局記録',   desc: 'Eloレートを自動計算',        color: 'text-red-400',    bg: 'bg-red-900/20 border-red-700/20' },
        { icon: <Trophy size={18}/>,     label: 'ランキング', desc: '12軸＋四天王で多角比較',     color: 'text-amber-400',  bg: 'bg-amber-900/20 border-amber-700/20' },
        { icon: <Star size={18}/>,       label: '称号・実績', desc: '活動で自動解放',              color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-700/20' },
        { icon: <Target size={18}/>,     label: 'ミッション', desc: 'デイリー/ウィークリーでPt',   color: 'text-indigo-400', bg: 'bg-indigo-900/20 border-indigo-700/20' },
        { icon: <Swords size={18}/>,     label: 'イベント',   desc: '紅白戦・ポイントマッチ',      color: 'text-rose-400',   bg: 'bg-rose-900/20 border-rose-700/20' },
        { icon: <GraduationCap size={18}/>, label: '指導対局', desc: '指導者と生徒でポイント記録', color: 'text-yellow-400', bg: 'bg-yellow-900/20 border-yellow-700/20' },
      ].map(item => (
        <div key={item.label} className={`${item.bg} border rounded-2xl p-4`}>
          <span className={item.color}>{item.icon}</span>
          <div className="font-black text-white text-sm mt-2">{item.label}</div>
          <div className="text-[11px] text-slate-400 font-bold mt-0.5">{item.desc}</div>
        </div>
      ))}
    </div>

    <div className="space-y-3">
      <H icon={<Layers size={16}/>}>画面一覧</H>
      <Table rows={[
        ['🏠 ホーム',       '出席記録・イベント状況・四天王・スコア速報'],
        ['⊕ 対局記録',     '結果入力（本人PINで確認）'],
        ['🏆 ランキング',   '全班員の12軸順位・今期成長表彰台'],
        ['👑 四天王',       '歴代四天王の記録一覧'],
        ['🎓 指導対局',     '指導者と生徒のセッション記録'],
        ['👤 個人データ',   'レート推移・ミッション・因縁ボード（PIN必要）'],
        ['📖 ガイド',       'このページ'],
        ['⚙️ 管理画面',    '班員管理・各種設定（承認済みデバイスのみ）'],
      ]} />
    </div>

    <div className="space-y-3">
      <H icon={<Key size={16}/>}>PINコード</H>
      <Table rows={[
        ['管理者PIN（6桁）',  '管理画面の操作に必要'],
        ['個人PIN（6桁）',    '対局時の本人確認・個人ページ閲覧に必要。初期値 000000'],
        ['指導者PIN（6桁）',  '指導対局ページで使用。指導者共通'],
        ['変更パスワード',    'デバイス承認時に入力する合言葉（管理者が設定）'],
      ]} />
      <Tip type="warn">個人PIN（000000）のままでは対局に参加できない。管理者に変更してもらおう。</Tip>
    </div>

    <div className="space-y-3">
      <H icon={<ArrowRight size={16}/>}>基本の流れ</H>
      <div className="space-y-3">
        <Step n={1} title="出席を記録する">ホームで自分の名前をタップ → 出席ポイント（+5pt）が付与される</Step>
        <Step n={2} title="対局を記録する">対局記録ページでP1・P2が各自PINを入力 → 勝者を選んで送信</Step>
        <Step n={3} title="結果を確認する">ランキングや個人ページでレートとポイントの変動を確認</Step>
        <Step n={4} title="称号・ミッションを集める">対局・出席を重ねると称号やミッションボーナスが解放される</Step>
      </div>
    </div>

    <div className="space-y-3">
      <H icon={<Monitor size={16}/>}>スクリーンセーバー</H>
      <p className="text-sm text-slate-400 font-medium">45秒間操作がないと自動でスクリーンセーバーが起動する。ランキング上位者を複数のスライドで表示。タップ・クリックで解除。</p>
      <DetailOnly>
        <Table rows={[
          ['起動条件',   '45秒間の無操作'],
          ['表示内容',   'レート・今期成長・今月Pt・活動日数・連勝・格上撃破・勝利数・通算Pt・四天王・紅白戦スコア'],
          ['解除',       '画面のどこかをタップ・クリック'],
        ]} />
        <Tip type="info">部室の大型モニターに映しておくと盛り上がる。</Tip>
      </DetailOnly>
    </div>

    <div className="space-y-3">
      <H icon={<Undo2 size={16}/>}>操作取り消し（アンドゥ）</H>
      <p className="text-sm text-slate-400 font-medium">対局・出席・ポイント調整などの操作は後から取り消せる。画面右下のアンドゥボタンから履歴を確認して巻き戻す。</p>
      <DetailOnly>
        <Table rows={[
          ['対象操作',   '対局記録・出席記録・ポイント調整・レート調整・部員追加・休眠・再入班'],
          ['認証',       '取り消しにはPIN認証が必要（誤操作防止）'],
          ['制限',       '直近の操作のみ取り消し可能。古い操作は管理画面から手動対応'],
        ]} />
      </DetailOnly>
    </div>

    <DetailOnly>
      <Acc title="データの保存場所">
        <Table rows={[
          ['ローカル（このデバイス）', 'ブラウザに保存。即時読み書き可能'],
          ['Firebase（クラウド）',     'ネット上に保存。複数端末で共有できる'],
        ]} />
        <p className="text-xs text-slate-400 mt-2">書き込みから3秒後に自動でクラウドへ同期。毎日自動バックアップも取られる。</p>
        <Tip type="ok">管理画面からバックアップを復元できる。</Tip>
      </Acc>
    </DetailOnly>
  </div>
);

// ━━━ タブ: 対局 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TabMatch = () => (
  <div className="space-y-6">
    <SimpleOnly>
      <div className="space-y-3">
        <QCard icon={<PlusCircle size={18}/>} title="対局の記録手順" color="text-red-400"
          desc="① 対局記録ページを開く → ② P1を選んでPIN入力 → ③ P2を選んでPIN入力 → ④ 勝者を選んで送信" />
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-green-400">勝ち</div>
            <div className="text-[11px] text-slate-400 font-bold mt-1">レート↑ +10pt</div>
          </div>
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-slate-400">引分</div>
            <div className="text-[11px] text-slate-400 font-bold mt-1">レート微増 +7pt</div>
          </div>
          <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-red-400">負け</div>
            <div className="text-[11px] text-slate-400 font-bold mt-1">レート↓ +5pt</div>
          </div>
        </div>
        <Tip type="info">負けても必ずポイントがもらえるので、たくさん対局するほど有利！</Tip>
      </div>
    </SimpleOnly>

    <DetailOnly>
      <div className="space-y-3">
        <H icon={<PlusCircle size={16}/>}>対局の記録手順</H>
        <div className="space-y-3">
          <Step n={1} title="「対局記録」ページを開く">下部ナビの ⊕ ボタンから</Step>
          <Step n={2} title="Player 1 を選ぶ">班員リストからタップして選択</Step>
          <Step n={3} title="Player 1 が PIN を入力">本人が自分の6桁PINを入力。初期値（000000）のままでは対局できない</Step>
          <Step n={4} title="Player 2 を選ぶ">同様に選択。同じ人は選べない</Step>
          <Step n={5} title="Player 2 が PIN を入力">同様に本人が入力</Step>
          <Step n={6} title="勝者を選んで送信">勝者ボタン or 引き分けを選択 → 「記録する」を押す</Step>
        </div>
        <Tip type="warn">管理者PINは不要。各自の個人PINで本人確認を行う。</Tip>
      </div>

      <div className="space-y-3">
        <H icon={<Eye size={16}/>}>結果画面の見方</H>
        <Table rows={[
          ['Rate変動',   '今回の対局でレートがいくら変わったか（+/−）'],
          ['Points獲得', '今回の対局で得たポイント（負けても最低5pt）'],
          ['ポイント内訳','ベース・連勝ボーナス・新入班員ボーナス・イベント倍率など'],
          ['連戦補正',   '同じ相手と繰り返すとポイント獲得が減る（スパム防止）'],
          ['新着称号',   '今回の対局で新たに解放された称号があれば表示'],
          ['ミッション', '達成したミッションがあれば個人ページ開時に通知'],
        ]} />
      </div>

      <div className="space-y-3">
        <H icon={<Shield size={16}/>}>デバイス承認について</H>
        <p className="text-sm text-slate-400 font-medium">対局記録・出席記録は「承認済みデバイス」からの操作が必要。未承認デバイスからは操作できない。</p>
        <Tip type="info">承認手順：管理画面 → 変更パスワード入力 → 管理者PIN入力 → デバイス名を入力して承認。</Tip>
      </div>

      <Acc title="引き分けの仕組み">
        <p>引き分けはレートが微増（0以上）し、ポイントも7pt もらえる。</p>
        <Tip type="info">格上との引き分けほどレートが上がる設計。</Tip>
      </Acc>

      <Acc title="スパム防止ペナルティ">
        <p>24時間以内に同じ相手と繰り返し対局すると3局目以降からポイント獲得が徐々に減る。レート変動は通常通り。翌日にはリセットされる。</p>
      </Acc>

      <Acc title="紅白戦中の同士討ち">
        <p>紅白戦（FACTION_WAR）イベント中に同じチーム同士で対局した場合、その結果はイベントポイント・勝敗数のいずれにもカウントされない。レート変動のみ通常通り適用される。</p>
        <Tip type="warn">同士討ちは対局記録として残るが、チームスコアや個人の勝率には影響しない。</Tip>
      </Acc>
    </DetailOnly>
  </div>
);

// ━━━ タブ: レート & ポイント ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TabRate = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <H icon={<TrendingUp size={16}/>}>レート（Rate）</H>
      <SimpleOnly>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '初期値', value: '0',  color: 'text-slate-300' },
            { label: '勝ち',   value: '+α', color: 'text-green-400' },
            { label: '負け',   value: '−α', color: 'text-red-400' },
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
          ['初期値',     '0（全員同じスタートライン）'],
          ['最低値',     '0（マイナスにはならない）'],
          ['勝ったとき', '最低でも +1 は上がる'],
          ['負けたとき', '最大で −自分のレート まで下がる（0未満にはならない）'],
          ['引き分け',   '格上相手なら +α、格下相手なら ±0'],
        ]} />
        <Acc title="Eloの計算式">
          <p>K係数 = <strong className="text-white">32</strong></p>
          <p>期待勝率 = <code className="bg-slate-800 px-2 py-0.5 rounded text-xs">1 / (1 + 10^((相手レート - 自分レート) / 400))</code></p>
          <p>レート変動 = <code className="bg-slate-800 px-2 py-0.5 rounded text-xs">K × (実際の結果 - 期待勝率)</code></p>
        </Acc>
      </DetailOnly>
    </div>

    <div className="space-y-3">
      <H icon={<Star size={16}/>}>ポイント（Points）</H>
      <p className="text-sm text-slate-400 font-medium">出席や対局で貯まる「活動量」の指標。<strong className="text-white">負けても必ずもらえる</strong>ので、参加するほど有利。</p>
      <Table rows={[
        ['出席',              '5pt（1日1回）'],
        ['対局（勝ち）',      '10pt（基本）'],
        ['対局（引き分け）',  '7pt（基本）'],
        ['対局（負け）',      '5pt（基本）'],
        ['連勝ボーナス',      '連勝中は1連勝ごとに+2pt（最大+6pt）'],
        ['新入班員ボーナス',  '新入班員フラグON時は+3pt'],
        ['指導対局（指導者）','通常対局勝利相当のポイント獲得'],
        ['指導対局（生徒）',  '通常対局負け相当のポイント獲得'],
        ['イベント倍率',      'イベント期間中は全ポイントに倍率がかかる'],
      ]} />
      <Tip type="info">スパム防止：24時間以内に同じ相手と3局以上対局するとポイントが減衰する。レート変動は通常通り。</Tip>
    </div>

    <div className="space-y-3">
      <H icon={<Trophy size={16}/>}>ランキング12軸</H>
      <Table rows={[
        ['今期成長',   'シーズン開始時からのレート＋ポイント増加の合計（上位3名を表彰台表示）'],
        ['レート',     '現在のEloレート。純粋な実力値'],
        ['通算Pt',     '全期間の累計ポイント'],
        ['今月のPt',   '今月獲得したポイント累計'],
        ['今週の勝率', '今週（月〜日）の対局勝率（3局以上で集計）'],
        ['格上撃破',   'レート差+100以上の相手に勝った回数'],
        ['今期対局数', '今シーズンの総対局数'],
        ['最大連勝',   '過去最高の連勝記録'],
        ['活動日数',   '今シーズンに部活に来た日数'],
        ['最終活動日', '直近に活動した日付（出席または対局）'],
        ['引き分け',   '引き分け対局の総数'],
        ['四天王基準', '四天王選出に使われる各指標値'],
      ]} />
      <Tip type="info">ランキングタブを開くと自動でソート選択モーダルが表示される。「ソートを変更」ボタンからいつでも切り替え可能。</Tip>
    </div>

    <DetailOnly>
      <Acc title="シーズン管理のタイミング">
        <Step n={1} title="四天王を更新">現在の成績で称号を確定させる</Step>
        <Step n={2} title="シーズン基準値をスナップショット">現在のレート・ポイントを「今期の基準」として記録</Step>
        <Step n={3} title="月次リセットを実行">今月の活動日数・イベントポイントをリセット</Step>
        <Tip type="ok">総ポイントとレートはリセットされない。活動日数などの今月分のみリセット対象。</Tip>
      </Acc>
      <Acc title="合宿ベースラインとは">
        <p>学期開始時などに「合宿ベースライン」を記録しておくと、そこからの成長度を表彰に使える。管理画面 → シーズン・称号 → 合宿ベースラインに起点を入力して「起点を記録」ボタンを押す。</p>
        <Tip type="info">「○○ 夏季合宿」のようなラベルで複数記録できる。</Tip>
      </Acc>
    </DetailOnly>
  </div>
);

// ━━━ タブ: 称号・アイコン ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TabAchievements = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <H icon={<Award size={16}/>}>称号（Title）</H>
      <p className="text-sm text-slate-400 font-medium">条件を満たすと自動で解放される。個人ページで表示する称号を1つ選べる。</p>
      <DetailOnly>
        <div className="space-y-2">
          {[
            { cat: '対局数',      items: ['初陣（1局）','見習い棋士（5局）','駆け出し棋士（10局）','中堅棋士（25局）','盤上の常連（40局）','百戦錬磨（80局）','千局の侍（150局）','無限の棋士（300局）'] },
            { cat: '勝利数',      items: ['初勝利','三連撃（3勝）','十人斬り（10勝）','名手（30勝）','将棋の鬼（50勝）','百勝将軍（80勝）','無敵の証（100勝）','伝説の棋士（160勝）','最強の名（250勝）'] },
            { cat: 'レート',      items: ['第一歩（200）','登り坂（400）','中堅入り（600）','脱・初心者（800）','実力者（950）','熟練者（1100）','精鋭（1250）','マスター（1400）','超越者（1550）','レジェンド（1700）'] },
            { cat: '活動日数',    items: ['将棋好き（5日）','常連（15日）','部室の主（25日）','皆勤候補（40日）','熱心な部員（55日）','部の柱（100日）','永遠の棋士（180日）','殿堂（210日）'] },
            { cat: '格上撃破',    items: ['番狂わせ（1回）','ジャイアントキリング（10回）','下剋上（20回）','巨人の天敵（30回）','不可能を可能に（50回）'] },
            { cat: '連勝記録',    items: ['スプリンター（5連勝）','記録破り（10連勝）','伝説の連勝（15連勝）','神話（20連勝）'] },
            { cat: 'カムバック',  items: ['不屈（3連敗後に勝利）','逆境の勇者（5連敗後）','復活劇（10連敗後）'] },
            { cat: 'イベント',    items: ['大将軍（紅白戦で大将に任命）','一騎討ち（大将同士の対決を制す）','紅白戦 第1功（+30pt）','紅白戦 第2功（+20pt）','紅白戦 第3功（+10pt）'] },
            { cat: 'その他',      items: ['初黒星','めげない心（30敗）','七転八起（100敗）','公式認定（段位承認）','コレクター（称号5個）〜究極の収集家（50個）'] },
          ].map(group => (
            <div key={group.cat} className="bg-slate-800/40 border border-white/5 rounded-xl p-3">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{group.cat}</div>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map(item => (
                  <span key={item} className="text-[11px] bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-lg font-bold">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DetailOnly>
    </div>

    <div className="space-y-3">
      <H icon={<Crown size={16}/>}>システム称号（四天王）</H>
      <p className="text-sm text-slate-400 font-medium">各部門でシーズン1位の班員に自動付与される特別称号。更新時に再計算される。「四天王」ページで歴代記録が確認できる。</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { id: 'MASTER',       desc: '今期レート上昇1位' },
          { id: 'RISING_STAR',  desc: '今期ポイント上昇1位' },
          { id: 'GRINDER',      desc: '活動日数1位' },
          { id: 'GIANT_KILLER', desc: '格上撃破数1位' },
        ].map(t => (
          <div key={t.id} className="bg-slate-900 border border-yellow-500/20 rounded-2xl p-4 space-y-2">
            <FKBadge id={t.id} />
            <div className="text-[11px] text-slate-400 font-bold">{t.desc}</div>
          </div>
        ))}
      </div>
      <Tip type="info">四天王称号は兼任可能（複数の班員が同時に保持できる）。歴代記録はナビの「四天王」ページで確認できる。</Tip>
    </div>

    <div className="space-y-3">
      <H icon={<Layers size={16}/>}>アイコン・フレーム</H>
      <p className="text-sm text-slate-400 font-medium">プロフィールに表示する将棋駒アイコンとフレームを選択できる。条件を満たすと新しいものが解放される。</p>
      <DetailOnly>
        <Table rows={[
          ['アイコン変更', '個人ページ → 「アイコン」ボタン'],
          ['フレーム変更', '個人ページ → 「フレーム」ボタン'],
          ['解放条件',     '対局数・レート・活動日数・称号数などで解放'],
          ['四天王限定',   '四天王保持中のみ使えるフレームがある'],
        ]} />
      </DetailOnly>
    </div>

    <div className="space-y-3">
      <H icon={<Medal size={16}/>}>段位・級位の登録</H>
      <p className="text-sm text-slate-400 font-medium">将棋ウォーズ等の外部棋力認定を登録できる。管理者が承認するとプロフィールに表示される。</p>
      <DetailOnly>
        <div className="space-y-3">
          <Step n={1} title="個人ページを開く">個人データ → 自分を選択 → PIN入力</Step>
          <Step n={2} title="「段位申請」をタップ">認定元（例：将棋ウォーズ）と段位・級位（例：2級）を入力して送信</Step>
          <Step n={3} title="管理者の承認を待つ">承認されるとプロフィールに表示される</Step>
        </div>
        <Tip type="info">段位が初めて承認されると「公式認定」称号が解放される。</Tip>
      </DetailOnly>
    </div>
  </div>
);

// ━━━ タブ: イベント ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TabEvents = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <H icon={<Swords size={16}/>}>イベントの種類</H>
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-2xl p-4">
          <div className="font-black text-blue-300 text-sm flex items-center gap-2"><Zap size={14}/> ポイントマッチ</div>
          <div className="text-xs text-slate-400 font-medium mt-1">期間中の対局・出席ポイントに倍率がかかる。レートは通常通り。</div>
        </div>
        <div className="bg-rose-900/20 border border-rose-700/30 rounded-2xl p-4">
          <div className="font-black text-rose-300 text-sm flex items-center gap-2"><Swords size={14}/> 紅白戦</div>
          <div className="text-xs text-slate-400 font-medium mt-1">紅組・白組に分かれて対戦。チームのイベントポイント合計で勝敗を競う。</div>
        </div>
      </div>
    </div>

    <div className="space-y-3">
      <H icon={<Users size={16}/>}>紅白戦の仕組み</H>
      <Table rows={[
        ['チーム分け',   '管理者がシャッフル → レートが均等になるよう自動振り分け。手動変更も可'],
        ['大将（将軍）', '各チーム1人を任命。任命時に「大将軍」称号が付与される'],
        ['一騎討ち',     '大将同士の対局は自動で一騎討ち判定。勝者に「一騎討ち」称号'],
        ['チームスコア', 'イベント期間中の各班員のイベントポイント合計がチームスコアになる'],
        ['同士討ち',     '同じチーム同士の対局は勝敗数・イベントポイントにカウントされない'],
        ['終了後',       '勝利チームが確定。上位者に殊勲表彰（第1功+30pt・第2功+20pt・第3功+10pt）'],
      ]} />
      <Tip type="info">ホーム画面のゲージでリアルタイムにチームスコアが確認できる。個人ページに結果モーダルが表示される。</Tip>
    </div>

    <DetailOnly>
      <Acc title="イベントの設定手順（管理者）">
        <Step n={1} title="管理画面 → 「イベント管理」を開く" />
        <Step n={2} title="イベント種類・名前・終了日を設定する">終了日を過ぎると自動でイベント終了</Step>
        <Step n={3} title="紅白戦の場合はチームを編成する">「チームをシャッフル」または手動で振り分け</Step>
        <Step n={4} title="大将を任命する（任意）">大将選択から各チームの大将を選ぶ</Step>
      </Acc>
      <Acc title="紅白戦終了後の処理">
        <p>イベント終了時に自動で集計・殊勲表彰が処理される。各班員の個人ページを開いた際に結果モーダルが表示される（1回のみ）。</p>
        <p className="mt-2">管理者が「イベントポイントをリセット」を押すと全員のイベントポイントが0に戻る。総ポイント・レートはリセットされない。</p>
      </Acc>
    </DetailOnly>
  </div>
);

// ━━━ タブ: 個人ページ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TabProfile = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <H icon={<UserIcon size={16}/>}>個人ページでできること</H>
      <Table rows={[
        ['プロフィール確認',  'レート・ポイント・勝敗・活動日数'],
        ['シーズンステータス','12軸の現在順位一覧・シーズン残り日数バー'],
        ['レート推移グラフ',  '対局のたびに記録される折れ線グラフ'],
        ['活動ヒートマップ',  '直近90日の活動状況をカレンダー形式で表示'],
        ['ミッション確認',    'デイリー/ウィークリーの達成状況・報酬Pt'],
        ['因縁ボード',        'ライバル・お得意様・天敵を煽り文付きで表示'],
        ['称号変更',          '解放済み称号から表示するものを選ぶ'],
        ['称号一覧',          '解放済み・未解放すべての称号を確認'],
        ['アイコン変更',      '解放済み将棋駒アイコンを選ぶ'],
        ['フレーム変更',      '解放済みフレームを選ぶ'],
        ['段位・級位',        '承認済みランクの確認と新規申請'],
        ['対局履歴',          '直近の対局結果とレート変動'],
      ]} />
      <Tip type="info">ランキングの名前をタップするとPINなしで他のプレイヤーのプロフィールを閲覧できる（編集不可）。</Tip>
    </div>

    <div className="space-y-3">
      <H icon={<Map size={16}/>}>シーズンステータスカード</H>
      <p className="text-sm text-slate-400 font-medium">個人ページ内に表示される。12軸全ランキングの現在順位と、シーズン残り日数を一画面で確認できる。</p>
      <DetailOnly>
        <Table rows={[
          ['残り日数バー',   'シーズン進行率をプログレスバーで表示。残り7日でラストスパート警告'],
          ['12軸順位グリッド','1〜3位はゴールドハイライト。各軸の自分のスコアと1つ上の順位者名も表示'],
          ['浮上メッセージ', 'レート・今期成長で「あと○○で○○位浮上」を自動計算して表示'],
        ]} />
      </DetailOnly>
    </div>

    <div className="space-y-3">
      <H icon={<Target size={16}/>}>ミッション</H>
      <p className="text-sm text-slate-400 font-medium">達成するとポイントボーナスがもらえる。個人ページ上部に常時表示。</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-indigo-900/20 border border-indigo-700/30 rounded-2xl p-4">
          <div className="font-black text-indigo-300 text-sm mb-2">デイリー（部活ごとリセット）</div>
          <ul className="text-[11px] text-slate-400 space-y-1">
            <li>• 1局対局する</li>
            <li>• 1勝する</li>
            <li>• 3局対局する</li>
            <li>• ランダム相手と対局</li>
            <li>• 格上に挑戦</li>
          </ul>
        </div>
        <div className="bg-purple-900/20 border border-purple-700/30 rounded-2xl p-4">
          <div className="font-black text-purple-300 text-sm mb-2">ウィークリー</div>
          <ul className="text-[11px] text-slate-400 space-y-1">
            <li>• 5局対局する</li>
            <li>• ライバルに勝利</li>
            <li>• 格上3人撃破</li>
            <li>• 出席2日以上</li>
            <li>• 勝率50%以上</li>
          </ul>
        </div>
      </div>
      <Tip type="info">対局後にミッションを達成した場合、次回個人ページを開いたときに通知が表示される。</Tip>
    </div>

    <div className="space-y-3">
      <H icon={<Lock size={16}/>}>PIN認証</H>
      <Table rows={[
        ['初期PIN',  '000000（全員共通）'],
        ['変更方法', '管理画面 → 「個人ページPIN管理」から変更可能'],
        ['変更権限', '管理者のみ変更できる'],
        ['ロック',   'プロフィール内の「ロック」ボタンを押すと即ロック'],
      ]} />
      <Tip type="warn">初期PINのままでは対局に参加できない。</Tip>
    </div>

    <DetailOnly>
      <Acc title="因縁ボードの仕組み">
        <p><strong className="text-white">今期ライバル</strong>：今シーズン最も多く対局した相手</p>
        <p><strong className="text-white">お得意様</strong>：対局した相手のうち、勝率が最も高い相手</p>
        <p><strong className="text-white">天敵</strong>：対局した相手のうち、勝率が最も低い相手</p>
        <p><strong className="text-white">全因縁履歴</strong>：2局以上対戦した相手を勝率バー付きで一覧表示</p>
        <Tip type="info">因縁ボードは本人のみ表示。他のユーザーからは閲覧できない。</Tip>
      </Acc>
      <Acc title="プロフィール閲覧ビュー（PIN不要）">
        <p>ランキング画面で名前をタップすると、誰でも閲覧できるプロフィールページが開く。PIN不要で以下が見られる。</p>
        <Table rows={[
          ['表示内容', 'レート・勝敗・段位・四天王称号・取得実績・対局履歴・レート推移グラフ'],
          ['非表示',   '因縁ボード・ミッション・PIN関連操作'],
        ]} />
      </Acc>
    </DetailOnly>
  </div>
);

// ━━━ タブ: 指導対局 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TabCoaching = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <H icon={<GraduationCap size={16}/>}>指導対局とは</H>
      <p className="text-sm text-slate-400 font-medium">指導者（上位者）が班員に将棋を教える「指導対局」を記録する専用ページ。通常の対局と分けて管理される。</p>
      <Table rows={[
        ['指導者',     '管理者が isInstructor フラグをONにした部員のみ選択可'],
        ['ポイント',   '指導者：通常勝利相当 / 生徒：通常負け相当のポイントをそれぞれ獲得'],
        ['レート',     '変動なし（指導対局はレーティングに影響しない）'],
        ['重複防止',   '同日・同指導者での登録は1回まで'],
        ['認証',       '指導者共通PINを入力して記録（個人PINとは別）'],
      ]} />
    </div>

    <div className="space-y-3">
      <H icon={<ArrowRight size={16}/>}>記録手順</H>
      <div className="space-y-3">
        <Step n={1} title="「指導対局」ページを開く">ナビの 🎓 アイコンから</Step>
        <Step n={2} title="指導者を選ぶ">指導者フラグが付いている班員が一覧に表示される</Step>
        <Step n={3} title="指導者PINを入力">指導者共通PIN（6桁）を入力して認証</Step>
        <Step n={4} title="生徒を選んで記録">対局する生徒を選択して「記録する」を押す</Step>
      </div>
      <Tip type="warn">承認済みデバイスからのみ記録できる。</Tip>
    </div>

    <DetailOnly>
      <Acc title="指導者の設定（管理者）">
        <p>管理画面 → 「在籍部員」で部員カードを開き、「指導者」トグルボタンをONにする。</p>
        <p className="mt-2">指導者PINの変更は管理画面 → 「PIN管理」→「指導者PIN変更」から行う。</p>
      </Acc>
    </DetailOnly>
  </div>
);

// ━━━ タブ: 管理者向け ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const TabAdmin = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <H icon={<Settings size={16}/>}>管理画面でできること</H>
      <Table rows={[
        ['部員管理',           '追加・名前編集・学籍番号管理・新入班員フラグ・休眠・再入班・完全削除・CSV一括追加'],
        ['部員表示順',         'ドラッグ&ドロップで表示順をカスタマイズ'],
        ['ポイント/レート調整','個別手動調整・複数部員への一括付与'],
        ['シーズン管理',       '基準値スナップショット・合宿ベースライン・月次リセット・終了日設定'],
        ['四天王の更新',       'システム称号を現在の成績で再計算'],
        ['イベント管理',       '作成・チーム編成・大将任命・強制終了'],
        ['段位申請の承認',     '班員からの申請を承認・却下'],
        ['PIN管理',            '個人ページPIN・指導者PINの変更'],
        ['デバイス管理',       '対局・出席操作を許可するデバイスの承認・取り消し'],
        ['クラウド同期',       '手動でFirebaseと同期'],
        ['バックアップ管理',   '自動バックアップの確認・手動復元'],
        ['メンテナンスモード', 'データ整備のための安全なサンドボックス'],
      ]} />
      <Tip type="info">管理画面の各カードをタップするとフルスクリーンで詳細が開く。</Tip>
    </div>

    <div className="space-y-3">
      <H icon={<Users size={16}/>}>部員の管理</H>
      <Table rows={[
        ['名前編集',       '在籍部員の名前横の ✏ ボタンから編集。Enterで確定、Escでキャンセル'],
        ['学籍番号',       '各部員カードの入力欄から設定・変更可能'],
        ['新入班員フラグ', '「新入」「一般」ボタンで切り替え。ONの間は対局・出席でボーナス+3pt'],
        ['指導者フラグ',   '指導対局ページで指導者として選択されるには管理者がONにする必要がある'],
        ['休眠（退班）',   '部員リスト右の 👤✕ ボタンで休眠状態に。データはすべて保持される'],
        ['再入班',         '休眠中の部員パネルから「再入班」ボタン。過去の実績が引き継がれる'],
        ['完全削除',       '休眠中の部員パネルから「完全削除」ボタン。データが完全に消去される（取り消し不可）'],
      ]} />
      <Tip type="warn">完全削除は取り消しできない。誤操作防止のため確認ダイアログが2回表示される。</Tip>
    </div>

    <div className="space-y-3">
      <H icon={<Database size={16}/>}>ポイント・レートの調整</H>
      <Table rows={[
        ['個別調整',   '管理画面 → 「出席・ポイント調整」で部員を選択してポイントまたはレートを加減算'],
        ['一括付与',   '管理画面 → 「一括付与」で複数部員を選択して同一値を一度に付与'],
        ['理由の記録', '調整理由をテキストで入力して記録できる'],
      ]} />
    </div>

    <div className="space-y-3">
      <H icon={<Lock size={16}/>}>アクセス制限</H>
      <Table rows={[
        ['管理者PIN（6桁）', '管理画面ログインに必要'],
        ['変更パスワード',   'デバイス承認時に入力する合言葉（管理者が任意で設定）'],
        ['承認済みデバイス', '対局記録・出席記録はこのデバイスからのみ操作可能'],
        ['デバイス承認手順', '変更パスワード入力 → 管理者PIN入力 → デバイス名登録'],
      ]} />
      <Tip type="warn">未承認デバイスからは管理者ページへのログイン自体ができない。</Tip>
    </div>

    <DetailOnly>
      <Acc title="班員をCSVで一括追加">
        <p className="text-xs text-slate-400">以下の形式のCSVを用意してください：</p>
        <div className="bg-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300 leading-relaxed">
          名前,読み,学籍番号<br/>
          山田太郎,やまだたろう,125001<br/>
          鈴木一郎,すずきいちろう,125002
        </div>
        <Step n={1} title="管理画面 → 「在籍部員」→「CSVで一括追加」を開く" />
        <Step n={2} title="CSVファイルを選択 → 「追加する」を押す" />
        <Step n={3} title="確認モーダルで内容を確認して「追加を実行」" />
        <Tip type="warn">学籍番号未入力の行があるとエラーが表示される。</Tip>
      </Acc>

      <Acc title="シーズン更新の推奨手順">
        <Step n={1} title="四天王を更新する">現在の成績で称号を確定</Step>
        <Step n={2} title="シーズン基準値をスナップショット">レート・ポイントを今期の基準として記録</Step>
        <Step n={3} title="月次リセットを実行">活動日数・イベントポイントをリセット</Step>
        <Tip type="ok">総ポイントとレートはリセットされない。</Tip>
      </Acc>

      <Acc title="合宿ベースラインの設定">
        <p>学期開始時などに現在のレート・ポイントを「起点」として記録する機能。合宿などで「学期中の成長度」を表彰するために使う。</p>
        <Step n={1} title="管理画面 → 「シーズン・称号」を開く" />
        <Step n={2} title="合宿ベースランのラベルを入力">例：「2025 夏季合宿」</Step>
        <Step n={3} title="「起点を記録」ボタンを押す">全部員の現在レート・ポイントが起点として保存される</Step>
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
    </DetailOnly>
  </div>
);

// ━━━ タブ定義 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type TabKey = 'intro' | 'match' | 'rate' | 'achievements' | 'events' | 'coaching' | 'profile' | 'admin';

const TABS: { key: TabKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'intro',        label: 'はじめに', icon: <BookOpen size={14}/>,      color: 'text-blue-400' },
  { key: 'match',        label: '対局',     icon: <PlusCircle size={14}/>,    color: 'text-red-400' },
  { key: 'rate',         label: 'レート',   icon: <TrendingUp size={14}/>,    color: 'text-green-400' },
  { key: 'achievements', label: '称号',     icon: <Star size={14}/>,          color: 'text-yellow-400' },
  { key: 'events',       label: 'イベント', icon: <Swords size={14}/>,        color: 'text-rose-400' },
  { key: 'coaching',     label: '指導対局', icon: <GraduationCap size={14}/>, color: 'text-amber-400' },
  { key: 'profile',      label: '個人',     icon: <UserIcon size={14}/>,      color: 'text-purple-400' },
  { key: 'admin',        label: '管理者',   icon: <Settings size={14}/>,      color: 'text-slate-400' },
];

const CONTENT: Record<TabKey, React.ReactNode> = {
  intro:        <TabIntro />,
  match:        <TabMatch />,
  rate:         <TabRate />,
  achievements: <TabAchievements />,
  events:       <TabEvents />,
  coaching:     <TabCoaching />,
  profile:      <TabProfile />,
  admin:        <TabAdmin />,
};

// ━━━ メインコンポーネント ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const Guide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('intro');
  const [simple, setSimple] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const activeTabDef = TABS.find(t => t.key === activeTab)!;

  return (
    <ModeCtx.Provider value={simple}>
      {showTutorial && <Tutorial onDone={() => setShowTutorial(false)} />}
      <div className="space-y-4 animate-in fade-in duration-300 pb-20">

        {/* ヘッダー */}
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
              <button
                onClick={() => { markTutorialDone(); setShowTutorial(true); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700 font-black text-xs transition-all"
                title="チュートリアルを再表示"
              >
                <RotateCcw size={12}/> チュートリアル
              </button>
              <button
                onClick={() => setSimple(s => !s)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border font-black text-xs transition-all ${simple ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
              >
                {simple ? <Minus size={13}/> : <Plus size={13}/>}
                {simple ? '簡易版 表示中' : '詳細版 表示中'}
              </button>
            </div>
          </div>
          <div className={`mt-3 flex items-center gap-2 text-[11px] font-bold rounded-xl px-3 py-2 ${simple ? 'bg-blue-900/20 text-blue-300' : 'bg-slate-800/60 text-slate-500'}`}>
            {simple ? <><Eye size={12}/> キーポイントのみ表示</> : <><FileText size={12}/> 詳細説明・アコーディオンを含む全表示</>}
          </div>
        </div>

        {/* タブバー */}
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

        {/* セクションタイトル */}
        <div className="flex items-center gap-2 px-1">
          <span className={activeTabDef.color}>{activeTabDef.icon}</span>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{activeTabDef.label}</span>
        </div>

        {/* コンテンツ */}
        <div key={`${activeTab}-${simple}`} className="animate-in fade-in duration-200">
          {CONTENT[activeTab]}
        </div>
      </div>
    </ModeCtx.Provider>
  );
};
