import React, { useState } from 'react';
import { BookOpen, Star, Trophy, Calendar, Swords, Shield, Users, Award, TrendingUp, Info, ChevronDown, ChevronUp, Crown, Zap, RefreshCw, Wrench, BarChart2 } from 'lucide-react';

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  color: string;
  content: React.ReactNode;
}

const A: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-slate-300 text-sm leading-relaxed mb-3">{children}</p>
);
const H: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h4 className="font-black text-white text-base mb-2 mt-4 first:mt-0">{children}</h4>
);
const Table: React.FC<{ headers: string[]; rows: (string | React.ReactNode)[][] }> = ({ headers, rows }) => (
  <div className="overflow-x-auto mb-4">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-slate-800">{headers.map((h, i) => <th key={i} className="px-3 py-2 text-left text-slate-400 font-bold border border-slate-700 text-xs">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className={i % 2 === 0 ? 'bg-slate-900/50' : 'bg-slate-900/20'}>
            {row.map((cell, j) => <td key={j} className="px-3 py-2 border border-slate-700/50 text-slate-300 text-xs">{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
const Tip: React.FC<{ children: React.ReactNode; type?: 'info' | 'warn' | 'good' }> = ({ children, type = 'info' }) => {
  const cls = type === 'warn' ? 'bg-amber-900/20 border-amber-700/40 text-amber-300' : type === 'good' ? 'bg-green-900/20 border-green-700/40 text-green-300' : 'bg-blue-900/20 border-blue-700/40 text-blue-300';
  return <div className={`rounded-xl border p-3 text-xs font-bold mb-3 ${cls}`}>{children}</div>;
};

const sections: Section[] = [
  {
    id: 'overview', icon: <BookOpen size={20}/>, title: 'アプリ概要', color: 'text-blue-400',
    content: (
      <div>
        <A>Club Rivals は巣鴨学園将棋部の活動を記録・見える化するゲーミフィケーション型管理アプリです。対局記録・出席管理・ランキング・称号システムが統合されています。</A>
        <H>データの保存先</H>
        <A>すべてのデータは①このデバイスのブラウザ（localStorage）と②Firebase（クラウド）の両方に保存されます。クラウドと同期されると複数端末で同じデータを参照できます。</A>
        <Tip type="info">画面左下（モバイルはヘッダー右のドット）に同期ステータスが常時表示されます。「未保存」の状態でもローカルには保存済みです。</Tip>
        <H>初期レートについて</H>
        <A>全部員の初期レートは 0 です。対局を重ねることでレートが上がっていきます。レートは負けると下がりますが、0 未満にはなりません。</A>
      </div>
    )
  },
  {
    id: 'attendance', icon: <Calendar size={20}/>, title: '出席登録', color: 'text-green-400',
    content: (
      <div>
        <A>ホーム画面の「出席登録」ボタンをタップして自分の名前を選ぶだけです。</A>
        <H>仕様</H>
        <Table headers={['項目', '内容']} rows={[
          ['ポイント', '+5pt / 日'],
          ['回数制限', '1日1回のみ'],
          ['活動日数', '出席のたびに +1'],
          ['イベント中', 'ポイントにイベント倍率が適用'],
        ]}/>
        <Tip type="good">毎日来るだけでポイントが積み上がります。続けるとランキング「活動家」称号につながります。</Tip>
      </div>
    )
  },
  {
    id: 'match', icon: <Swords size={20}/>, title: '対局記録', color: 'text-red-400',
    content: (
      <div>
        <A>ヘッダーの「対戦記録」から入力します。管理者PINが必要です（デフォルト: 1123）。</A>
        <H>入力手順</H>
        <A>① Player 1・Player 2 を選択 → ② 勝者をタップ（または引き分け）→ ③ PINを入力 → ④「記録する」</A>
        <H>レート変動（Eloシステム）</H>
        <A>勝者はレートが上がり、敗者は下がります。強い相手に勝つほど大きく上昇し、弱い相手に負けるほど大きく下落します（K=32のElo方式）。</A>
        <Table headers={['結果', 'レート', 'ポイント']} rows={[
          ['勝利', '+（相手の強さに応じて変動）', '+10pt ＋ボーナス'],
          ['敗北', '−（相手の強さに応じて変動）', '+5pt'],
          ['引き分け', '+/−（微小変動）', '+7pt（双方）'],
        ]}/>
        <H>ポイントボーナス一覧</H>
        <Table headers={['条件', 'ボーナス']} rows={[
          ['連勝中（1連勝ごと）', '+2pt（最大+6pt）'],
          ['新入部員との対局', '+3pt'],
          ['イベント中', '全ポイントにx倍率'],
          ['30分以内に3戦以上（連戦補正）', 'x0.5ペナルティ'],
        ]}/>
        <Tip type="good">負けてもポイントは必ず加算されます。長期的にはポイント合計が一番の実績指標になります。</Tip>
      </div>
    )
  },
  {
    id: 'ranking', icon: <Trophy size={20}/>, title: 'ランキング', color: 'text-yellow-400',
    content: (
      <div>
        <A>6種類のランキング軸で部員の順位を確認できます。</A>
        <Table headers={['軸', '計算方法']} rows={[
          ['総合 (COMBINED)', 'レート + ポイント の合算'],
          ['実力 (RATE)', '現在のEloレート'],
          ['通算ポイント', '累積ポイント合計'],
          ['今期の成長', 'シーズン開始時からのレート＋ポイント増加量'],
          ['活動日数', '出席登録の累計日数'],
          ['勝利数', '通算勝利数'],
        ]}/>
        <Tip type="info">「総合」ランキングは負けても下がりにくく、継続して参加することで上位を目指せます。</Tip>
        <H>段位・級位の表示</H>
        <A>個人データ画面で段位・級位を申請し、管理者に承認されると名前の横に表示されます（例: 将棋ウォーズ 初段）。</A>
      </div>
    )
  },
  {
    id: 'profile', icon: <TrendingUp size={20}/>, title: '個人データ', color: 'text-purple-400',
    content: (
      <div>
        <A>部員を選択すると以下の詳細データが確認できます。</A>
        <Table headers={['セクション', '内容']} rows={[
          ['ヘッダー', 'アバター・称号・レート・ポイント・段位表示'],
          ['活動ヒートマップ', '直近90日の活動記録（緑が濃いほど活動多）'],
          ['レート推移グラフ', '対局のたびに更新されるEloレートの折れ線グラフ'],
          ['戦績データ', '勝率・活動日数・連勝・通算成績'],
          ['ポイント内訳', '対局/出席/特別ポイントの棒グラフ'],
          ['ライバル分析', 'お得意様（最も勝ち越している相手）・天敵（最も負け越している相手）'],
          ['最近の対局', '直近10局の星取表と詳細'],
          ['称号コレクション', '解除済み・未解除の称号一覧'],
          ['アイコンコレクション', '将棋駒・チェス駒などのアイコン（条件達成で解除）'],
        ]}/>
        <H>称号の切り替え</H>
        <A>ヘッダーの「称号変更」セレクトで、解除済みの称号を名前の横に表示できます。</A>
        <H>段位・級位の申請</H>
        <A>「段位・級位を申請」ボタンから出典（将棋ウォーズなど）と段位・級位を入力して申請します。管理者が承認するとランキングに表示されます。</A>
      </div>
    )
  },
  {
    id: 'titles', icon: <Award size={20}/>, title: '称号システム', color: 'text-amber-400',
    content: (
      <div>
        <H>四天王称号（管理者が手動更新）</H>
        <A>管理者画面で「称号を更新する」を押すと、現在の成績に基づいて自動計算されます。</A>
        <Table headers={['称号', '条件']} rows={[
          ['👑 名人 (Master)', '現在のレートが最も高い部員'],
          ['⭐ 新星 (Rising Star)', '今シーズン（レート＋ポイント）の成長幅が最大の部員'],
          ['🔥 活動家 (Grinder)', '対局数＋活動日数の合計が最大の部員'],
          ['⚔ 下克上 (Giant Killer)', '格上（レート高い相手）への勝利数が最多の部員'],
        ]}/>
        <H>アチーブメント称号（自動付与）</H>
        <Table headers={['称号', '解除条件']} rows={[
          ['スタートダッシュ', '最初の対局（対局数1回）'],
          ['初勝利', '初めての勝利'],
          ['駆け出し棋士', '対局数10回'],
          ['盤上の常連', '対局数50回'],
          ['百戦錬磨', '対局数100回'],
          ['十人斬り', '勝利数10回'],
          ['名手', '勝利数30回'],
          ['将棋の鬼', '勝利数50回'],
          ['好調', '3連勝'],
          ['猛攻', '5連勝'],
          ['無双', '10連勝'],
          ['脱・初心者', 'レート200到達'],
          ['熟練者', 'レート500到達'],
          ['マスター', 'レート800到達'],
          ['レジェンド', 'レート1000到達'],
          ['将棋好き', '活動日数10日'],
          ['部室の主', '活動日数30日'],
          ['生ける伝説', '活動日数100日'],
          ['大将軍', 'イベントで大将に任命される'],
          ['一騎討ち', '紅白戦で敵将を撃破'],
        ]}/>
      </div>
    )
  },
  {
    id: 'icons', icon: <Star size={20}/>, title: 'アイコンシステム', color: 'text-cyan-400',
    content: (
      <div>
        <A>アイコンは個人データ画面のアバターをタップして変更できます。条件を満たすと自動で解除されます。</A>
        <Table headers={['カテゴリ', '解除条件の例']} rows={[
          ['DEFAULT（デフォルト）', '最初から所持'],
          ['SHOGI（将棋の駒）', '対局数・勝利数・レートに応じて段階的に解除（歩兵→と金→香車→…→玉将）'],
          ['CHESS（チェス駒）', '勝利数・レートに応じて解除（ポーン→ナイト→…→キング）'],
        ]}/>
        <Tip type="info">アイコンは変更しても戦績に影響しません。自由にカスタマイズできます。</Tip>
      </div>
    )
  },
  {
    id: 'event', icon: <Zap size={20}/>, title: 'イベント機能', color: 'text-orange-400',
    content: (
      <div>
        <H>通常イベント</H>
        <A>期間中のすべてのポイントに倍率（デフォルト×2）が適用されます。管理者が「イベント開始」から設定します。</A>
        <H>紅白戦（Faction War）</H>
        <A>部員を紅組・白組に自動振り分けし、チーム対抗でポイントを競います。</A>
        <Table headers={['手順', '内容']} rows={[
          ['①', '管理者がイベントウィザードを開く'],
          ['②', 'タイプ「紅白戦」を選択して期間を入力'],
          ['③', '自動チーム編成ボタンでレートと活動日数を均等に振り分け'],
          ['④', '紅組・白組それぞれ大将を任命（大将軍称号が付与される）'],
          ['⑤', 'イベント開始！ホームにスコアゲージが表示される'],
        ]}/>
        <Tip type="warn">大将同士が対局すると「一騎討ち」として扱われ、勝者に「一騎討ち」称号が付与されます（MatchEntry側で isDuel=true で呼び出す必要あり）。</Tip>
      </div>
    )
  },
  {
    id: 'admin', icon: <Shield size={20}/>, title: '管理者機能', color: 'text-slate-400',
    content: (
      <div>
        <A>管理画面はPIN認証（デフォルト: 1123）でアクセスできます。対局記録時にも同じPINが必要です。</A>
        <Table headers={['機能', '内容']} rows={[
          ['部員追加', '個別または CSVファイルで一括追加。読みを入力すると五十音順ソートに対応'],
          ['休眠・再入班', '退部者は「休眠」にするとデータが保持され、再入班時に引き継げる'],
          ['段位申請承認', 'ユーザーが申請した段位・級位を承認/却下'],
          ['称号更新', '「称号を更新する」で四天王称号を再計算'],
          ['シーズン変更', 'シーズンを変更すると成長度の基準（レート・ポイント）がスナップショットされる'],
          ['手動ポイント調整', '貢献など任意のポイント・レートを加減算'],
          ['月次ポイントリセット', '今月の表示ポイントを0にリセット（累計ポイントは変わらない）'],
        ]}/>
        <H>操作の取り消し（Undo）</H>
        <A>誤操作した場合、管理画面の「操作履歴・取り消し」から直前の状態に戻せます。最大15件の操作履歴が保持されます。</A>
        <H>バックアップ</H>
        <A>データ変更のたびに自動バックアップが作成されます（直近7日分）。管理画面の「自動バックアップ」からワンクリックで復元できます。手動でJSONをエクスポートして安全な場所に保存することも可能です。</A>
      </div>
    )
  },
  {
    id: 'maintenance', icon: <Wrench size={20}/>, title: 'メンテナンスモード', color: 'text-amber-400',
    content: (
      <div>
        <A>新機能の動作確認や設定変更のテストをしたいときに使います。</A>
        <Table headers={['フェーズ', '内容']} rows={[
          ['開始時', 'ローカルとFirebaseの両方に「メンテナンス前バックアップ」を自動作成。画面上部に警告バナーを表示。'],
          ['メンテナンス中', '通常通りアプリを使用可能。確認したいデータでテスト操作できる。'],
          ['終了（データ破棄）', 'メンテナンス前の状態に完全復元。テストデータは削除される。'],
          ['終了（データ保持）', 'メンテナンス中のデータをそのまま保持して終了。'],
        ]}/>
        <Tip type="warn">メンテナンスモードでも他の端末には通常通り表示されます。本番環境でのテストなので注意してください。</Tip>
      </div>
    )
  },
  {
    id: 'sync', icon: <RefreshCw size={20}/>, title: 'クラウド同期の仕組み', color: 'text-sky-400',
    content: (
      <div>
        <A>データの変更は3秒後に自動でFirebaseに同期されます（デバウンス処理）。連続して操作した場合はまとめて1回だけ送信されます。</A>
        <Table headers={['ステータス', '意味']} rows={[
          ['Synced（緑）', 'クラウドと完全に一致している'],
          ['未保存・黄色', '変更があり、まだ送信待ち（ローカルには保存済み）'],
          ['Syncing（青）', '現在送信中'],
          ['Error（赤）', '送信に失敗（ローカルには保存済み）。10秒後に自動リトライ。'],
        ]}/>
        <H>起動時の動作</H>
        <A>アプリ起動時にFirebaseとローカルのタイムスタンプを比較し、新しい方のデータを採用します。ローカルが新しい場合はFirebaseに自動プッシュします。</A>
        <Tip type="warn">同じデータを複数端末で同時に編集した場合、後から同期した端末のデータが上書きされます（last-write-wins）。</Tip>
      </div>
    )
  },
];

const GuideSection: React.FC<{ section: Section }> = ({ section }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden bg-slate-900/60 backdrop-blur-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`${section.color}`}>{section.icon}</div>
          <span className="font-black text-white text-base">{section.title}</span>
        </div>
        {open ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-white/5 pt-4">
          {section.content}
        </div>
      )}
    </div>
  );
};

export const Guide: React.FC = () => {
  const [openAll, setOpenAll] = useState(false);
  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen size={32} className="text-white"/>
          <div>
            <h2 className="text-3xl font-black text-white">ガイドブック</h2>
            <p className="text-slate-400 text-sm font-bold">セクションをタップして展開</p>
          </div>
        </div>
        <button onClick={() => setOpenAll(!openAll)} className="text-xs font-bold text-slate-400 hover:text-white px-4 py-2 bg-slate-800 rounded-xl border border-slate-700">
          {openAll ? '全て閉じる' : '全て開く'}
        </button>
      </div>
      {sections.map(s => (
        openAll
          ? (
            <div key={s.id} className="rounded-2xl border border-white/10 overflow-hidden bg-slate-900/60 backdrop-blur-sm">
              <div className="flex items-center gap-4 p-5 border-b border-white/5">
                <div className={`${s.color}`}>{s.icon}</div>
                <span className="font-black text-white text-base">{s.title}</span>
              </div>
              <div className="px-5 pb-5 pt-4">{s.content}</div>
            </div>
          )
          : <GuideSection key={s.id} section={s}/>
      ))}
    </div>
  );
};
