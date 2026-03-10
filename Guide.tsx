import React, { useState } from 'react';
import {
  Home, Trophy, User as UserIcon, Settings, PlusCircle, BookOpen,
  Star, Award, Crown, Swords, Globe, Medal, Shield, TrendingUp,
  Calendar, Lock, Key, ChevronDown, ChevronRight, Info, Zap,
  AlertTriangle, CheckCircle, ArrowRight, Users, RotateCcw,
  Flame, Snowflake, Eye, FileText, Database, RefreshCw
} from 'lucide-react';

// ─── 共通UI ──────────────────────────────────────────────────

const Acc: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; accent?: string }> = ({
  title, children, defaultOpen = false, accent = 'text-blue-400'
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/5 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left gap-3"
      >
        <span className={`font-black text-sm ${accent}`}>{title}</span>
        {open ? <ChevronDown size={16} className="text-slate-500 shrink-0" /> : <ChevronRight size={16} className="text-slate-500 shrink-0" />}
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
  const styles = {
    info: 'bg-blue-900/20 border-blue-700/40 text-blue-200',
    warn: 'bg-amber-900/20 border-amber-700/40 text-amber-200',
    ok:   'bg-green-900/20 border-green-700/40 text-green-200',
  };
  const icons = { info: <Info size={14} />, warn: <AlertTriangle size={14} />, ok: <CheckCircle size={14} /> };
  return (
    <div className={`flex gap-2 p-3 rounded-xl border text-xs font-bold leading-relaxed ${styles[type]}`}>
      <span className="shrink-0 mt-0.5">{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
};

const Step: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <div className="flex gap-4">
    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 mt-0.5">{n}</div>
    <div>
      <div className="font-black text-white text-sm mb-1">{title}</div>
      <div className="text-xs text-slate-400 font-medium leading-relaxed">{children}</div>
    </div>
  </div>
);

const H = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-black text-white text-base border-l-4 border-blue-500 pl-3 py-0.5">{children}</h3>
);

const Table: React.FC<{ rows: [string, string][] }> = ({ rows }) => (
  <div className="rounded-xl overflow-hidden border border-white/5">
    {rows.map(([k, v], i) => (
      <div key={i} className={`flex gap-3 px-4 py-3 text-xs font-bold ${i % 2 === 0 ? 'bg-slate-800/60' : 'bg-slate-900/60'}`}>
        <span className="text-slate-400 shrink-0 w-32">{k}</span>
        <span className="text-slate-200">{v}</span>
      </div>
    ))}
  </div>
);

// ─── タブ: はじめに ──────────────────────────────────────────

const TabIntro = () => (
  <div className="space-y-6">
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 p-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      <h2 className="text-3xl font-black text-white mb-2">Club Rivals とは？</h2>
      <p className="text-slate-400 font-bold text-sm mb-6">将棋部の活動を記録・可視化・盛り上げるための部活管理アプリです。</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { icon: <PlusCircle size={18} className="text-red-400" />,   label: '対局記録',    desc: 'Eloレートで実力を数値化' },
          { icon: <Star size={18} className="text-yellow-400" />,      label: '称号・実績',  desc: '活動で解放されるバッジ' },
          { icon: <Trophy size={18} className="text-amber-400" />,     label: 'ランキング',  desc: '4軸の順位表' },
          { icon: <Swords size={18} className="text-rose-400" />,      label: 'イベント',    desc: '紅白戦・ポイントマッチ' },
          { icon: <Medal size={18} className="text-purple-400" />,     label: '段位登録',    desc: '将棋ウォーズ等のランクを申請' },
          { icon: <Globe size={18} className="text-cyan-400" />,       label: '公開ページ',  desc: 'URL共有で外部も閲覧可' },
        ].map(item => (
          <div key={item.label} className="bg-slate-800/60 border border-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">{item.icon}<span className="font-black text-white text-sm">{item.label}</span></div>
            <div className="text-[11px] text-slate-400 font-bold">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="space-y-3">
      <H>画面一覧</H>
      <Table rows={[
        ['🏠 ホーム',       '出席ボタン、イベント状況、四天王の確認'],
        ['⚔️ 対戦記録',     '対局結果の入力（管理者PIN必要）'],
        ['🏆 ランキング',   '4軸の順位表。全部員のレート・成長を比較'],
        ['👤 個人データ',   '自分のプロフィール・レート推移・称号（PIN必要）'],
        ['📖 ガイド',       'このページ。全機能の説明書'],
        ['⚙️ 管理画面',     '部員管理・イベント設定など（管理者専用）'],
        ['🌐 /board',      '外部公開用の閲覧専用ページ（URLを知っている人のみ）'],
      ]} />
    </div>

    <div className="space-y-3">
      <H>PIN コード一覧</H>
      <Table rows={[
        ['管理者PIN',   '対局登録・管理画面の操作に必要。管理者が設定'],
        ['個人PIN',     '個人ページの閲覧に必要。初期値は 0000。管理者が変更可'],
      ]} />
      <Tip type="warn">管理者PINは他の部員に見られないよう注意してください。個人PINは自分のプロフィールを守るためのものです。</Tip>
    </div>

    <Acc title="アプリの基本的な流れ" defaultOpen>
      <div className="space-y-3">
        <Step n={1} title="出席を記録する">ホーム画面で自分の名前をタップ → 出席ポイントがもらえます</Step>
        <Step n={2} title="対局を記録する">対戦記録ページで対戦相手・結果・管理者PINを入力して登録</Step>
        <Step n={3} title="結果を確認する">ランキングページや個人ページでレート・ポイントの変動を確認</Step>
        <Step n={4} title="称号を集める">対局や出席を重ねると自動で称号・アイコンが解放される</Step>
      </div>
    </Acc>

    <Acc title="データはどこに保存されているの？">
      <div className="space-y-2">
        <p>データは2箇所に保存されています。</p>
        <Table rows={[
          ['ローカル（このデバイス）', '端末のブラウザに保存。すぐに読み書きできる'],
          ['Firebase（クラウド）',     'インターネット上に保存。複数端末で共有できる'],
        ]} />
        <p>書き込みのたびに自動で3秒後にクラウドへ同期されます。画面右下のアイコンで同期状態が確認できます。</p>
        <Tip type="ok">毎日自動バックアップが取られます。万が一データが壊れても管理者画面から復元できます。</Tip>
      </div>
    </Acc>
  </div>
);

// ─── タブ: 対局 ──────────────────────────────────────────────

const TabMatch = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <H>対局の記録方法</H>
      <div className="space-y-3">
        <Step n={1} title="「対戦記録」ページを開く">下部ナビの ⊕ ボタンから</Step>
        <Step n={2} title="Player 1（先手）を選ぶ">カードをタップ → 部員リストから選択</Step>
        <Step n={3} title="Player 2（後手）を選ぶ">同様に選択。自分自身は選べません</Step>
        <Step n={4} title="勝者のカードを押す">「Winner」ボタン、または「引き分け」ボタンを押す</Step>
        <Step n={5} title="管理者PINを入力して送信">4桁のPINを入力 → 結果画面が表示される</Step>
      </div>
    </div>

    <div className="space-y-3">
      <H>結果画面の見方</H>
      <Table rows={[
        ['Rate変動',      '今回の対局でレートがいくら変わったか（+ / −）'],
        ['Points獲得',    '今回の対局で得たポイント（負けても最低1pt）'],
        ['内訳',          'ベース・連勝ボーナス・新入生ボーナス・イベント倍率など'],
        ['新着称号',      '今回の対局で新しく解放された称号があれば表示'],
      ]} />
    </div>

    <Acc title="対局はいつでも取り消せる（管理者向け）">
      <div className="space-y-2">
        <p>管理者画面 → 「最近の対局」から削除できます。削除するとレートとポイントが巻き戻ります。</p>
        <p>また、UNDOパネル（画面右下）から直前の操作を丸ごと取り消すこともできます。</p>
        <Tip type="warn">UNDO履歴は直近10件まで。アプリを閉じても残ります。</Tip>
      </div>
    </Acc>

    <Acc title="同じ相手と何局でも打てる？">
      <p>打てますが、短時間に同じ相手と連続対局するとスパム防止ペナルティが入り、ポイント獲得が減ります。レート変動は通常通りです。</p>
    </Acc>

    <Acc title="引き分けのときはどうなる？">
      <div className="space-y-2">
        <p>引き分けはレートが微増（0以上）し、ポイントも少量もらえます。</p>
        <Tip type="info">引き分けは弱者に有利な設計です。格上との引き分けほどレートが上がります。</Tip>
      </div>
    </Acc>
  </div>
);

// ─── タブ: レート & ポイント ──────────────────────────────────

const TabRate = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <H>レート（Rate）とは</H>
      <p className="text-sm text-slate-400 font-medium">将棋ウォーズなどでも使われる <strong className="text-white">Eloレーティング</strong> と同じ仕組みです。勝つと上がり、負けると下がります。初期値は <strong className="text-white">0</strong>。</p>
      <Table rows={[
        ['初期値',         '0（全員同じスタートライン）'],
        ['最低値',         '0（マイナスにはならない）'],
        ['勝ったとき',     '最低でも +1 は上がる'],
        ['負けたとき',     '最大で −自分のレート まで下がる（0未満にはならない）'],
        ['引き分けのとき', '格上相手なら +α、格下相手なら ±0'],
      ]} />
    </div>

    <Acc title="Eloの計算式（詳細）" accent="text-blue-300">
      <div className="space-y-3">
        <p>K係数（動きの激しさ）= <strong className="text-white">32</strong></p>
        <p>期待勝率 = <code className="bg-slate-800 px-2 py-0.5 rounded text-xs">1 / (1 + 10^((相手レート - 自分レート) / 400))</code></p>
        <p>レート変動 = <code className="bg-slate-800 px-2 py-0.5 rounded text-xs">K × (実際の結果 - 期待勝率)</code></p>
        <Tip type="info">格上に勝てば大きく上がり、格下に負ければ大きく下がる。これが「実力を正確に反映する」仕組みです。</Tip>
      </div>
    </Acc>

    <div className="space-y-3">
      <H>ポイント（Points）とは</H>
      <p className="text-sm text-slate-400 font-medium">出席や対局で貯まる「活動の積み重ね」を表す値です。<strong className="text-white">負けても必ずもらえる</strong>ので、活発に参加するほど有利になります。</p>
      <Table rows={[
        ['出席ポイント',       '部活に来るだけでもらえる（設定値による）'],
        ['対局ベース（勝ち）', '設定値のポイント'],
        ['対局ベース（負け）', '設定値の半分（0にはならない）'],
        ['連勝ボーナス',       '3連勝以上で追加ポイント（設定可能）'],
        ['新入生ボーナス',     '新入生は一定期間、ポイントが割増'],
        ['イベント倍率',       'イベント期間中は全ポイントが倍率倍'],
      ]} />
    </div>

    <Acc title="スパム防止ペナルティの仕組み">
      <div className="space-y-2">
        <p>同じ相手と24時間以内に繰り返し対局すると、ポイント獲得が徐々に減ります（3局目以降から適用）。</p>
        <p>レート変動には影響しません。あくまでポイントのみです。</p>
        <Tip type="ok">翌日に持ち越せばペナルティはリセットされます。</Tip>
      </div>
    </Acc>

    <div className="space-y-3">
      <H>ランキングの4つの軸</H>
      <Table rows={[
        ['今期成長',   'シーズン開始時点からのレート増加 + ポイント増加の合計'],
        ['レート',     '現在のEloレート。純粋な実力値'],
        ['活動日数',   '今シーズンに部活に来た日数'],
        ['総ポイント', '累計で貯めたポイント数'],
      ]} />
      <Tip type="info">「今期成長」は強い人だけでなく頑張った人も評価される指標です。レートが低くても大きく伸びれば上位に入れます。</Tip>
    </div>
  </div>
);

// ─── タブ: 称号・実績 ────────────────────────────────────────

const TabAchievements = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <H>称号（Title）とは</H>
      <p className="text-sm text-slate-400 font-medium">対局や活動の条件を満たすと自動で解放されるバッジです。個人ページで「表示する称号」を1つ選べます。</p>
      <Acc title="主な称号の解放条件" defaultOpen accent="text-yellow-400">
        <Table rows={[
          ['初対局',        '初めて対局を記録する'],
          ['勝利への道',    '1勝する'],
          ['10勝達成',      '通算10勝'],
          ['連勝記録',      '3連勝以上を達成する'],
          ['出席の鬼',      '出席日数が一定数を超える'],
          ['大将軍',        '紅白戦でチームの大将に任命される'],
          ['一騎討ち',      '大将同士の直接対決に勝つ'],
          ['格上キラー',    '自分より高レートの相手に勝つ'],
        ]} />
      </Acc>
    </div>

    <div className="space-y-3">
      <H>システム称号（四天王）</H>
      <p className="text-sm text-slate-400 font-medium">シーズン中に各部門で1位の部員に自動付与される特別な称号です。毎月の更新時に再計算されます。</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { id: 'MASTER',       label: '覇者',       color: 'from-yellow-900/40 border-yellow-600/50 text-yellow-300', desc: '今期レート上昇1位' },
          { id: 'RISING_STAR',  label: '新星',       color: 'from-green-900/40 border-green-600/50 text-green-300',   desc: '今期ポイント上昇1位' },
          { id: 'GRINDER',      label: '鉄人',       color: 'from-blue-900/40 border-blue-600/50 text-blue-300',     desc: '出席日数1位' },
          { id: 'GIANT_KILLER', label: '巨人キラー', color: 'from-red-900/40 border-red-600/50 text-red-300',        desc: '格上撃破数1位' },
        ].map(t => (
          <div key={t.id} className={`bg-gradient-to-br ${t.color} border rounded-2xl p-4`}>
            <Crown size={16} className={t.color.split(' ')[2]} />
            <div className={`font-black text-sm mt-2 ${t.color.split(' ')[2]}`}>{t.label}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-bold">{t.desc}</div>
          </div>
        ))}
      </div>
      <Tip type="info">四天王称号は毎月リセットされます。管理者が「四天王を更新」ボタンを押したタイミングで反映されます。</Tip>
    </div>

    <div className="space-y-3">
      <H>アイコン（Icon）とは</H>
      <p className="text-sm text-slate-400 font-medium">プロフィールに表示できる将棋駒のアイコンです。条件を満たすと新しいアイコンが解放されます。</p>
      <Acc title="アイコンの変更方法">
        <div className="space-y-3">
          <Step n={1} title="個人ページを開く">個人データ → 自分を選択 → PIN入力</Step>
          <Step n={2} title="「アイコンを変更」ボタンを押す">プロフィールヘッダーの下にあります</Step>
          <Step n={3} title="解放済みのアイコンを選ぶ">鍵マークのついたアイコンはまだ解放されていません</Step>
        </div>
      </Acc>
    </div>

    <div className="space-y-3">
      <H>段位・級位の登録</H>
      <p className="text-sm text-slate-400 font-medium">将棋ウォーズなど外部の棋力認定を登録できます。管理者が承認するとプロフィールとランキングに表示されます。</p>
      <Acc title="申請の手順">
        <div className="space-y-3">
          <Step n={1} title="個人ページを開く">個人データ → 自分を選択 → PIN入力</Step>
          <Step n={2} title="「段位・級位」カードを探す">画面をスクロールすると出てきます</Step>
          <Step n={3} title="「ランクを申請する」ボタンを押す">認定元（例：将棋ウォーズ）、段位・級位（例：2級）を入力</Step>
          <Step n={4} title="管理者が承認を待つ">管理者画面に通知が届き、承認されると表示される</Step>
        </div>
      </Acc>
    </div>
  </div>
);

// ─── タブ: イベント ──────────────────────────────────────────

const TabEvents = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <H>イベントの種類</H>
      <Table rows={[
        ['ポイントマッチ', '期間中の対局ポイントが倍率倍になる。レートにも通常通り反映'],
        ['紅白戦',         'チームを紅組・白組に分け、チームのポイント合計で勝敗を競う'],
      ]} />
    </div>

    <div className="space-y-6">
      <H>紅白戦（チーム戦）の仕組み</H>

      <Acc title="チームの分け方" defaultOpen accent="text-rose-400">
        <div className="space-y-2">
          <p>管理者が「チームをシャッフル」ボタンを押すと、<strong className="text-white">レートが均等になるよう</strong>自動で振り分けられます。</p>
          <p>手動で変更することも可能です（管理者画面のチーム編成パネル）。</p>
        </div>
      </Acc>

      <Acc title="大将（将軍）の仕組み" accent="text-yellow-400">
        <div className="space-y-2">
          <p>各チームに1人だけ「大将」を任命できます。大将に任命された瞬間に <strong className="text-yellow-300">「大将軍」称号</strong>が付与されます。</p>
          <p>大将同士が対局すると自動的に <strong className="text-white">「一騎討ち」</strong> と判定されます。</p>
          <div className="flex items-center gap-3 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-xl">
            <Swords size={20} className="text-yellow-400 shrink-0" />
            <div className="text-xs font-bold text-yellow-200">一騎討ちで勝った大将には「一騎討ち」称号が授与されます。対局画面に「大将同士の一騎討ち！」バナーが表示されます。</div>
          </div>
        </div>
      </Acc>

      <Acc title="チームスコアの計算" accent="text-blue-300">
        <div className="space-y-2">
          <p>イベント期間中に各部員が獲得したポイントの合計がチームスコアになります。</p>
          <p>ホーム画面の大きなゲージでリアルタイムに確認できます。チーム別の勝数・一騎討ち勝数も表示されます。</p>
        </div>
      </Acc>

      <Acc title="イベント終了後の処理">
        <div className="space-y-2">
          <p>管理者が「イベントポイントをリセット」ボタンを押すと、全員のイベントポイントが0に戻ります。</p>
          <Tip type="warn">総ポイントやレートはリセットされません。イベントポイントのみです。</Tip>
        </div>
      </Acc>
    </div>

    <div className="space-y-3">
      <H>イベントの設定方法（管理者）</H>
      <div className="space-y-3">
        <Step n={1} title="管理画面 → 「イベント管理」を開く">設定パネルがあります</Step>
        <Step n={2} title="イベント種類を選ぶ">ポイントマッチ or 紅白戦</Step>
        <Step n={3} title="イベント名・終了日を設定する">終了日を過ぎると自動でイベント終了</Step>
        <Step n={4} title="紅白戦の場合はチームを編成する">「チームをシャッフル」または手動で振り分け</Step>
        <Step n={5} title="大将を任命する（任意）">大将選択ドロップダウンから選ぶ</Step>
      </div>
    </div>
  </div>
);

// ─── タブ: 個人ページ ────────────────────────────────────────

const TabProfile = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <H>個人ページでできること</H>
      <Table rows={[
        ['プロフィール確認',   'レート・ポイント・勝敗・活動日数を一覧表示'],
        ['レート推移グラフ',   '対局のたびに記録されるレートの折れ線グラフ'],
        ['称号変更',           '解放済み称号の中から表示する称号を選択'],
        ['アイコン変更',       '解放済み将棋駒アイコンを選択'],
        ['ライバル分析',       'お得意様（最も勝ち越した相手）と天敵（最も負け越した相手）'],
        ['段位・級位の確認',   '承認済みのランクが一覧表示される'],
        ['段位・級位の申請',   '新しいランクを申請できる'],
        ['最近の対局履歴',     '直近の対局結果とレート変動'],
        ['獲得称号リスト',     '今まで解放したすべての称号'],
      ]} />
    </div>

    <div className="space-y-3">
      <H>PIN認証の仕組み</H>
      <div className="space-y-3">
        <p className="text-sm text-slate-400 font-medium">個人ページはPINコードで保護されています。</p>
        <Table rows={[
          ['初期PIN',   '0000（全員共通）'],
          ['変更方法',  '管理者画面 → 「個人ページPIN管理」から変更可能'],
          ['変更権限',  '管理者のみ変更できます（本人は変更不可）'],
          ['忘れた場合', '管理者に変更してもらってください'],
        ]} />
        <Tip type="ok">ロックボタンを押すとすぐに画面をロックできます。端末を他の人に渡す前に使ってください。</Tip>
      </div>
    </div>

    <Acc title="公開ページ（/board）からも個人ページは見れる？">
      <div className="space-y-2">
        <p>見られます。公開ページのランキング行をタップすると、その部員の個人ページに遷移します。</p>
        <p>ただし通常と同じく <strong className="text-white">PIN認証が必要</strong>です。PIN を知らない人は見られません。</p>
      </div>
    </Acc>

    <Acc title="ライバル分析の計算方法">
      <div className="space-y-2">
        <p><strong className="text-white">お得意様</strong>：対局したことがある相手のうち、勝率が最も高い（最も勝ち越している）相手</p>
        <p><strong className="text-white">天敵</strong>：対局したことがある相手のうち、勝率が最も低い（最も負け越している）相手</p>
        <Tip type="info">対局数が少ないうちは精度が低いです。最低3局以上が目安です。</Tip>
      </div>
    </Acc>
  </div>
);

// ─── タブ: 管理者向け ────────────────────────────────────────

const TabAdmin = () => (
  <div className="space-y-6">
    <Tip type="warn">このセクションは管理者（運営担当者）向けの内容です。</Tip>

    <div className="space-y-3">
      <H>管理画面でできること（一覧）</H>
      <Table rows={[
        ['部員管理',           '部員の追加・退部・再入班（データは保持）'],
        ['対局管理',           '最近の対局の削除（取り消し）'],
        ['出席・ポイント調整', '手動でポイントを加減算'],
        ['レート調整',         '手動でレートを変更'],
        ['シーズン管理',       'シーズン基準値のスナップショット・月次リセット'],
        ['四天王の更新',       'システム称号（覇者・新星・鉄人・巨人キラー）を再計算'],
        ['イベント管理',       'イベント作成・チーム編成・大将任命'],
        ['段位申請の承認',     '部員からの申請を承認・却下'],
        ['PIN管理',            '個人ページPINの変更'],
        ['公開URL管理',        '/board ページのURLをコピー・開く'],
        ['クラウド同期',       '手動でFirebaseと同期'],
        ['バックアップ',       '過去のバックアップを確認・復元'],
        ['メンテナンスモード', 'データ整備のための一時的なサンドボックス環境'],
      ]} />
    </div>

    <div className="space-y-3">
      <H>部員を追加する方法</H>
      <div className="space-y-3">
        <Acc title="1人ずつ追加" defaultOpen>
          <div className="space-y-2">
            <Step n={1} title="管理画面 → 「部員一覧」パネルを開く" />
            <Step n={2} title="名前・読みを入力して「追加」を押す">読みはランキングの検索に使われます</Step>
          </div>
        </Acc>
        <Acc title="CSVで一括追加">
          <div className="space-y-2">
            <p>以下の形式のCSVファイルを用意してください：</p>
            <div className="bg-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300">
              名前,読み<br/>
              山田太郎,やまだたろう<br/>
              鈴木一郎,すずきいちろう
            </div>
            <Step n={1} title="管理画面 → 「CSVで一括追加」パネルを開く" />
            <Step n={2} title="CSVファイルを選択 → 「追加する」を押す" />
          </div>
        </Acc>
      </div>
    </div>

    <Acc title="メンテナンスモードとは？">
      <div className="space-y-3">
        <p>データの大規模な整備（レートの一括変更など）を安全に行うための機能です。</p>
        <Table rows={[
          ['開始時',   'その時点のデータを Firebase にバックアップして、サンドボックスで作業開始'],
          ['作業中',   '全ての書き込みが本番データではなくサンドボックスへ'],
          ['終了時',   '「反映する」→サンドボックスの変更を本番に適用 / 「破棄する」→バックアップを復元'],
        ]} />
        <Tip type="warn">メンテナンス中は全端末でオレンジのバナーが表示されます。対局記録は終了後に行ってください。</Tip>
      </div>
    </Acc>

    <Acc title="UNDOパネルの使い方">
      <div className="space-y-3">
        <p>画面右下の「↩」ボタンを押すとUNDOパネルが開きます。</p>
        <Table rows={[
          ['対応操作',   '対局登録・出席記録・ポイント/レート調整・退部・再入班'],
          ['件数',       '直近10件まで保存'],
          ['操作方法',   '「直前に戻す」で最新を1件取り消し / 「ここまで戻す」で指定した地点まで一気に戻す'],
        ]} />
        <Tip type="warn">UNDO後はFirebaseとも同期されます。他の端末でも即時反映されます。</Tip>
      </div>
    </Acc>

    <Acc title="シーズン管理のタイミング">
      <div className="space-y-3">
        <p>月の変わり目に以下の順で実行することを推奨します。</p>
        <Step n={1} title="四天王を更新する">現在の成績で称号を確定</Step>
        <Step n={2} title="シーズン基準値をスナップショット">現在のレート・ポイントを「今期の基準」として記録</Step>
        <Step n={3} title="月次リセットを実行">今月の活動日数・イベントポイントなどをリセット</Step>
        <Tip type="ok">総ポイントとレートはリセットされません。リセットされるのは今月分の活動日数などです。</Tip>
      </div>
    </Acc>
  </div>
);

// ─── タブ: 公開ページ ────────────────────────────────────────

const TabPublic = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <H>公開ページ（/board）とは</H>
      <p className="text-sm text-slate-400 font-medium">管理機能を一切持たない<strong className="text-white">閲覧専用のページ</strong>です。URLを知っている人なら誰でもアクセスできます。</p>
      <Table rows={[
        ['できること',   'ランキング閲覧・個人ページ閲覧（PIN必要）・称号/アイコン変更・ランク申請'],
        ['できないこと', '対局登録・出席記録・ポイント変更・管理画面へのアクセス'],
      ]} />
    </div>

    <div className="space-y-3">
      <H>URLの共有方法</H>
      <div className="space-y-3">
        <Step n={1} title="管理画面 → 「公開ランキングページ」パネルを開く" />
        <Step n={2} title="「URLをコピー」ボタンを押す">クリップボードにURLが入ります</Step>
        <Step n={3} title="LINEやメールなどで部員や観客に共有する" />
      </div>
    </div>

    <Acc title="大画面に映しっぱなしにするには？">
      <div className="space-y-2">
        <p>/board ページをブラウザのフルスクリーンで開いてください。ナビゲーションバーがないため、スッキリした表示になります。</p>
        <p>ホーム画面の <strong className="text-white">スクリーンセーバー</strong> 機能（一定時間操作がないと自動起動）と組み合わせると、部室のモニター展示に最適です。</p>
      </div>
    </Acc>

    <Acc title="セキュリティについて">
      <div className="space-y-2">
        <p>URLを知っている人だけがアクセスできます。外部に公開するかどうかはURLを共有するかどうかで管理者がコントロールできます。</p>
        <p>個人ページはさらにPINで保護されているため、プライバシーも守られています。</p>
        <Tip type="ok">管理者ページ（/admin）へのリンクは公開ページに一切存在しません。URLを知られても管理機能にはアクセスできません。</Tip>
      </div>
    </Acc>
  </div>
);

// ─── メインコンポーネント ────────────────────────────────────

type TabKey = 'intro' | 'match' | 'rate' | 'achievements' | 'events' | 'profile' | 'admin' | 'public';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'intro',        label: 'はじめに',       icon: <BookOpen size={15} /> },
  { key: 'match',        label: '対局',           icon: <PlusCircle size={15} /> },
  { key: 'rate',         label: 'レート',         icon: <TrendingUp size={15} /> },
  { key: 'achievements', label: '称号・段位',     icon: <Star size={15} /> },
  { key: 'events',       label: 'イベント',       icon: <Swords size={15} /> },
  { key: 'profile',      label: '個人ページ',     icon: <UserIcon size={15} /> },
  { key: 'admin',        label: '管理者向け',     icon: <Settings size={15} /> },
  { key: 'public',       label: '公開ページ',     icon: <Globe size={15} /> },
];

export const Guide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('intro');

  const content: Record<TabKey, React.ReactNode> = {
    intro:        <TabIntro />,
    match:        <TabMatch />,
    rate:         <TabRate />,
    achievements: <TabAchievements />,
    events:       <TabEvents />,
    profile:      <TabProfile />,
    admin:        <TabAdmin />,
    public:       <TabPublic />,
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-20">
      {/* Header */}
      <div className="bg-slate-900 border border-white/5 rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-1">
          <BookOpen size={22} className="text-blue-400" />
          <h1 className="text-2xl font-black text-white">ガイド</h1>
        </div>
        <p className="text-slate-400 text-sm font-bold">Club Rivals の全機能を解説します</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all shrink-0 ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div key={activeTab} className="animate-in fade-in duration-200">
        {content[activeTab]}
      </div>
    </div>
  );
};
