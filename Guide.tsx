
import React, { useState } from 'react';
import { BookOpen, HelpCircle, Shield, TrendingUp, Star, Crown, CheckCircle, Info, Clock, Save, Flag, Settings } from 'lucide-react';
import { ShogiPiece } from './ShogiPiece';
import { Card } from './Card';

const ManualTab = () => (
    <div className="space-y-8 animate-in slide-in-from-right duration-300 text-slate-200">
        <section>
            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2 font-serif-jp">
                <Shield className="text-blue-500" /> レート (Rating) システム
            </h3>
            <Card>
                <p className="text-slate-200 leading-relaxed mb-4 font-medium">
                    本アプリでは、チェスや将棋で広く使われている<strong>イロレーティング (Elo Rating)</strong>を採用しています。<br/>
                    これは「対戦相手の強さ」に応じて、勝敗時の変動幅が変わる公平なシステムです。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-950/40 p-5 rounded-xl border border-blue-500/30 shadow-lg">
                        <h4 className="font-bold text-blue-300 mb-2 text-lg">格上に勝った場合 (Giant Killing)</h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            自分より強い相手に勝つと、通常より<strong>多くのレート</strong>を獲得できます。<br/>
                            相手との差が100以上ある場合、獲得量は1.5倍になります。
                        </p>
                    </div>
                    <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700 shadow-lg">
                        <h4 className="font-bold text-slate-200 mb-2 text-lg">格下に負けた場合</h4>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            自分より弱い相手に負けると、通常より<strong>大きくレートが減少</strong>します。<br/>
                            ただし、本アプリではモチベーション維持のため、減少幅はマイルドに調整されています。
                        </p>
                    </div>
                </div>
            </Card>
        </section>

        <section>
            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2 font-serif-jp">
                <Star className="text-amber-500" /> ポイント (Points) システム
            </h3>
            <Card>
                <p className="text-slate-200 leading-relaxed mb-4 font-medium">
                    強さを示す「レート」とは別に、活動量を示す「ポイント」があります。<br/>
                    ポイントは毎月リセットされ、月間MVPを決める指標となります。
                </p>
                <ul className="space-y-3">
                    <li className="flex items-center justify-between p-4 bg-amber-900/20 rounded-xl border border-amber-500/20">
                        <span className="font-bold text-amber-300 flex items-center gap-3"><CheckCircle size={20}/> 対局勝利</span>
                        <span className="font-black text-amber-400 text-xl">+10 pt</span>
                    </li>
                    <li className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                        <span className="font-bold text-slate-300 flex items-center gap-3"><CheckCircle size={20}/> 対局敗北</span>
                        <span className="font-black text-slate-400 text-xl">+5 pt</span>
                    </li>
                    <li className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                        <span className="font-bold text-slate-300 flex items-center gap-3"><CheckCircle size={20}/> 出席 (1日1回)</span>
                        <span className="font-black text-slate-400 text-xl">+5 pt</span>
                    </li>
                </ul>
                <div className="mt-4 text-xs text-slate-400 text-right font-mono">※イベント期間中は倍率がかかることがあります</div>
            </Card>
        </section>

        <section>
            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2 font-serif-jp">
                <Flag className="text-red-500" /> 紅白戦 (Faction War)
            </h3>
            <div className="bg-gradient-to-br from-red-950 to-slate-900 p-8 rounded-3xl shadow-2xl text-white border border-red-900/40 relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-slate-200 leading-relaxed mb-6 font-medium">
                        不定期で開催されるチーム対抗イベントです。部員は自動的に<strong>紅組(Red)</strong>と<strong>白組(White)</strong>に分けられます。<br/>
                        各軍にはトッププレイヤーから「大将」が選出されます。
                    </p>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2 font-bold text-red-400 text-lg">
                                <Crown size={20} /> 大将 (General)
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                大将同士の対局は<strong>「一騎討ち (Duel)」</strong>と呼ばれ、勝利すると特別な称号とボーナスポイントが手に入ります。
                            </p>
                        </div>
                        <div className="flex-1 bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2 font-bold text-blue-400 text-lg">
                                <TrendingUp size={20} /> 勝利条件
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                イベント期間中に、敵チームのメンバーに勝利することでチームスコアが加算されます。<br/>
                                最終的にスコアの高いチームが勝利となります。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section>
            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2 font-serif-jp">
                <Info className="text-slate-400" /> システム仕様詳細
            </h3>
            <Card>
                <div className="space-y-4 divide-y divide-white/5">
                    <div className="pt-4 first:pt-0">
                         <h4 className="font-bold text-slate-200 flex items-center gap-2 mb-2"><Clock size={16}/> クールダウン (不正防止)</h4>
                         <p className="text-sm text-slate-400">
                             同じ相手との対戦は、前回の対局終了から<strong>「1分間」</strong>経過するまで記録できません。<br/>
                             これは連打による不正なポイント稼ぎや誤入力を防ぐための仕様です。
                         </p>
                    </div>
                    <div className="pt-4">
                         <h4 className="font-bold text-slate-200 flex items-center gap-2 mb-2"><TrendingUp size={16}/> 順位決定ロジック</h4>
                         <p className="text-sm text-slate-400">
                             ランキングでスコアが同点の場合、内部的に同一順位（例: 1位, 1位, 3位）として処理されます。<br/>
                             スクリーンセーバー等では微細な小数点の差で表示順が変わる場合があります。
                         </p>
                    </div>
                    <div className="pt-4">
                         <h4 className="font-bold text-slate-200 flex items-center gap-2 mb-2"><Save size={16}/> データバックアップ</h4>
                         <p className="text-sm text-slate-400">
                             データはブラウザ内に保存されます。タブレットを変更する場合や初期化する場合は、<br/>
                             管理画面の「バックアップ」からテキストデータをコピーし、新しい端末で「復元」してください。
                         </p>
                    </div>
                    <div className="pt-4">
                         <h4 className="font-bold text-slate-200 flex items-center gap-2 mb-2"><Settings size={16}/> スクリーンセーバー</h4>
                         <p className="text-sm text-slate-400">
                             操作がない状態で<strong>「45秒」</strong>経過すると、自動的にランキング表示モード（スクリーンセーバー）に切り替わります。<br/>
                             画面をタップすると解除されます。
                         </p>
                    </div>
                </div>
            </Card>
        </section>
    </div>
);

const TutorialTab = () => (
    <div className="space-y-8 animate-in slide-in-from-right duration-300 text-slate-200">
        <div className="bg-blue-950/40 border border-blue-500/30 p-8 rounded-3xl flex items-center gap-6 shadow-lg">
            <div className="shrink-0 drop-shadow-2xl">
                <ShogiPiece char="歩兵" scale={0.8} />
            </div>
            <div>
                <h4 className="font-black text-blue-300 text-2xl mb-2 font-serif-jp">ようこそ、新入部員！</h4>
                <p className="text-blue-100 text-base leading-relaxed font-medium">
                    このアプリは、日々の活動を記録し、みんなで競い合うためのツールだよ。<br/>
                    まずは基本的な使い方をマスターしよう。
                </p>
            </div>
        </div>

        <section>
            <h4 className="text-xl font-bold text-white mb-4 border-l-4 border-blue-500 pl-4 py-1">1. 出席登録をしよう</h4>
            <Card>
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1 space-y-4">
                        <p className="text-slate-200 text-base">
                            部室に来たら、まずダッシュボードの大きな<strong>「出席登録」</strong>ボタンを押そう。
                        </p>
                        <p className="text-slate-300 text-sm">
                            自分の名前を探してタップするだけで完了！<br/>
                            これで毎日 <span className="font-bold text-amber-500 text-lg">+5ポイント</span> ゲットだ。
                        </p>
                    </div>
                    <div className="w-full md:w-1/3 bg-slate-800 rounded-xl h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 gap-2">
                        <div className="bg-blue-600 p-3 rounded-xl shadow-lg"><CheckCircle size={24} className="text-white"/></div>
                        <span className="text-slate-400 text-xs font-bold">出席ボタン</span>
                    </div>
                </div>
            </Card>
        </section>

        <section>
            <h4 className="text-xl font-bold text-white mb-4 border-l-4 border-red-500 pl-4 py-1">2. 対局結果を記録しよう</h4>
            <Card>
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-1 space-y-4">
                        <p className="text-slate-200 text-base">
                            将棋やチェスの対局が終わったら、<strong>「対局記録」</strong>タブへ移動しよう。
                        </p>
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                            <ol className="list-decimal list-inside text-sm text-slate-300 space-y-2 ml-2 font-mono">
                                <li>Player 1 (自分) を選択</li>
                                <li>Player 2 (相手) を選択</li>
                                <li>勝者 (Winner) を選択</li>
                                <li>管理用PINコードを入力して送信</li>
                            </ol>
                        </div>
                        <p className="text-slate-500 text-xs mt-2">
                            ※PINコードは部室のホワイトボードを確認してね。
                        </p>
                    </div>
                </div>
            </Card>
        </section>
        
        <section>
             <h4 className="text-xl font-bold text-white mb-4 border-l-4 border-amber-500 pl-4 py-1">3. アイコンを集めよう</h4>
             <Card>
                 <p className="text-slate-200 text-sm mb-6 leading-relaxed">
                     対局数や勝利数、レートが上がると、プロフィール画面で新しいアイコン（将棋の駒など）に変更できるようになるよ。
                 </p>
                 <div className="flex gap-4 overflow-x-auto pb-4 items-end">
                     <ShogiPiece char="歩兵" scale={0.5} />
                     <ShogiPiece char="香車" scale={0.5} />
                     <ShogiPiece char="桂馬" scale={0.5} />
                     <ShogiPiece char="金将" scale={0.5} />
                     <div className="mb-2"><span className="text-slate-500">...</span></div>
                     <ShogiPiece char="王将" scale={0.6} isPromoted />
                 </div>
                 <p className="text-xs text-amber-500 mt-2 font-bold text-center w-full">目指せ、「王将」アイコン！</p>
             </Card>
        </section>
    </div>
);

export const Guide: React.FC = () => {
    const [tab, setTab] = useState<'MANUAL' | 'TUTORIAL'>('MANUAL');

    return (
        <div className="max-w-4xl mx-auto pb-24">
            <div className="mb-10 text-center">
                <h2 className="text-5xl font-black text-white tracking-tighter mb-4 font-serif-jp drop-shadow-lg">ガイドブック</h2>
                <p className="text-slate-400 font-medium">アプリの使い方とルールをマスターしよう</p>
            </div>

            <div className="flex justify-center mb-10">
                <div className="bg-slate-800 p-1.5 rounded-2xl shadow-lg border border-slate-700 flex gap-1">
                    <button 
                        onClick={() => setTab('MANUAL')}
                        className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${tab === 'MANUAL' ? 'bg-slate-600 text-white shadow-md ring-1 ring-slate-500' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    >
                        <BookOpen size={18} /> 説明書 (Manual)
                    </button>
                    <button 
                        onClick={() => setTab('TUTORIAL')}
                        className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${tab === 'TUTORIAL' ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-500' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    >
                        <HelpCircle size={18} /> チュートリアル
                    </button>
                </div>
            </div>

            {tab === 'MANUAL' ? <ManualTab /> : <TutorialTab />}
        </div>
    );
};
