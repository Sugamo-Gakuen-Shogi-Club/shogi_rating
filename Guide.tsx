
import React, { useState } from 'react';
import { BookOpen, HelpCircle, Shield, TrendingUp, Star, Users, Flag, Crown, CheckCircle } from 'lucide-react';
import { ShogiPiece } from './ShogiPiece';
import { Card } from './Card';

const ManualTab = () => (
    <div className="space-y-8 animate-in slide-in-from-right duration-300">
        <section>
            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                <Shield className="text-blue-500" /> レート (Rating) システム
            </h3>
            <Card>
                <p className="text-slate-300 leading-relaxed mb-4">
                    本アプリでは、チェスや将棋で広く使われている<strong>イロレーティング (Elo Rating)</strong>を採用しています。<br/>
                    これは「対戦相手の強さ」に応じて、勝敗時の変動幅が変わる公平なシステムです。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-900/30 p-4 rounded-xl border border-blue-500/30">
                        <h4 className="font-bold text-blue-300 mb-2">格上に勝った場合 (Giant Killing)</h4>
                        <p className="text-sm text-slate-300">
                            自分より強い相手に勝つと、通常より<strong>多くのレート</strong>を獲得できます。<br/>
                            相手との差が100以上ある場合、獲得量は1.5倍になります。
                        </p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <h4 className="font-bold text-slate-200 mb-2">格下に負けた場合</h4>
                        <p className="text-sm text-slate-400">
                            自分より弱い相手に負けると、通常より<strong>大きくレートが減少</strong>します。<br/>
                            ただし、本アプリではモチベーション維持のため、減少幅はマイルドに調整されています。
                        </p>
                    </div>
                </div>
            </Card>
        </section>

        <section>
            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                <Star className="text-amber-500" /> ポイント (Points) システム
            </h3>
            <Card>
                <p className="text-slate-300 leading-relaxed mb-4">
                    強さを示す「レート」とは別に、活動量を示す「ポイント」があります。<br/>
                    ポイントは毎月リセットされ、月間MVPを決める指標となります。
                </p>
                <ul className="space-y-3">
                    <li className="flex items-center justify-between p-3 bg-amber-900/20 rounded-lg border border-amber-500/20">
                        <span className="font-bold text-amber-300 flex items-center gap-2"><CheckCircle size={16}/> 対局勝利</span>
                        <span className="font-black text-amber-500 text-lg">+10 pt</span>
                    </li>
                    <li className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <span className="font-bold text-slate-300 flex items-center gap-2"><CheckCircle size={16}/> 対局敗北</span>
                        <span className="font-black text-slate-400 text-lg">+5 pt</span>
                    </li>
                    <li className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                        <span className="font-bold text-slate-300 flex items-center gap-2"><CheckCircle size={16}/> 出席 (1日1回)</span>
                        <span className="font-black text-slate-400 text-lg">+5 pt</span>
                    </li>
                </ul>
                <div className="mt-4 text-xs text-slate-500 text-right">※イベント期間中は倍率がかかることがあります</div>
            </Card>
        </section>

        <section>
            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                <Flag className="text-red-500" /> 紅白戦 (Faction War)
            </h3>
            <div className="bg-gradient-to-br from-red-950 to-slate-900 p-6 rounded-3xl shadow-lg text-white border border-red-900/30">
                <p className="text-slate-300 leading-relaxed mb-6">
                    不定期で開催されるチーム対抗イベントです。部員は自動的に<strong>紅組(Red)</strong>と<strong>白組(White)</strong>に分けられます。<br/>
                    各軍にはトッププレイヤーから「大将」が選出されます。
                </p>
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="flex items-center gap-2 mb-2 font-bold text-red-400">
                            <Crown size={18} /> 大将 (General)
                        </div>
                        <p className="text-sm text-slate-300">
                            大将同士の対局は<strong>「一騎討ち (Duel)」</strong>と呼ばれ、勝利すると特別な称号とボーナスポイントが手に入ります。
                        </p>
                    </div>
                    <div className="flex-1 bg-white/5 p-4 rounded-xl border border-white/10">
                        <div className="flex items-center gap-2 mb-2 font-bold text-blue-400">
                            <TrendingUp size={18} /> 勝利条件
                        </div>
                        <p className="text-sm text-slate-300">
                            イベント期間中に、敵チームのメンバーに勝利することでチームスコアが加算されます。<br/>
                            最終的にスコアの高いチームが勝利となります。
                        </p>
                    </div>
                </div>
            </div>
        </section>
    </div>
);

const TutorialTab = () => (
    <div className="space-y-8 animate-in slide-in-from-right duration-300">
        <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-3xl flex items-start gap-4">
            <div className="shrink-0 drop-shadow-lg">
                <ShogiPiece char="歩兵" scale={0.6} />
            </div>
            <div>
                <h4 className="font-black text-blue-300 text-lg mb-1">ようこそ、新入部員！</h4>
                <p className="text-blue-100/80 text-sm leading-relaxed">
                    このアプリは、日々の活動を記録し、みんなで競い合うためのツールだよ。<br/>
                    まずは基本的な使い方をマスターしよう。
                </p>
            </div>
        </div>

        <section>
            <h4 className="text-lg font-bold text-white mb-3 border-l-4 border-blue-500 pl-3">1. 出席登録をしよう</h4>
            <Card>
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1 space-y-2">
                        <p className="text-slate-300 text-sm">
                            部室に来たら、まずダッシュボードの大きな<strong>「出席登録」</strong>ボタンを押そう。
                        </p>
                        <p className="text-slate-300 text-sm">
                            自分の名前を探してタップするだけで完了！<br/>
                            これで毎日 <span className="font-bold text-amber-500">+5ポイント</span> ゲットだ。
                        </p>
                    </div>
                    <div className="w-full md:w-1/3 bg-slate-800 rounded-xl h-32 flex items-center justify-center border-2 border-dashed border-slate-700">
                        <span className="text-slate-500 text-xs font-bold">出席ボタンのイメージ</span>
                    </div>
                </div>
            </Card>
        </section>

        <section>
            <h4 className="text-lg font-bold text-white mb-3 border-l-4 border-red-500 pl-3">2. 対局結果を記録しよう</h4>
            <Card>
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1 space-y-2">
                        <p className="text-slate-300 text-sm">
                            将棋やチェスの対局が終わったら、<strong>「対局記録」</strong>タブへ移動しよう。
                        </p>
                        <ol className="list-decimal list-inside text-sm text-slate-400 space-y-1 ml-2">
                            <li>Player 1 (自分) を選択</li>
                            <li>Player 2 (相手) を選択</li>
                            <li>勝者 (Winner) を選択</li>
                            <li>管理用PINコードを入力して送信</li>
                        </ol>
                        <p className="text-slate-500 text-xs mt-2">
                            ※PINコードは部室のホワイトボードを確認してね。
                        </p>
                    </div>
                    <div className="w-full md:w-1/3 bg-slate-800 rounded-xl h-32 flex items-center justify-center border-2 border-dashed border-slate-700">
                        <span className="text-slate-500 text-xs font-bold">対戦入力画面</span>
                    </div>
                </div>
            </Card>
        </section>
        
        <section>
             <h4 className="text-lg font-bold text-white mb-3 border-l-4 border-amber-500 pl-3">3. アイコンを集めよう</h4>
             <Card>
                 <p className="text-slate-300 text-sm mb-4">
                     対局数や勝利数、レートが上がると、プロフィール画面で新しいアイコン（将棋の駒など）に変更できるようになるよ。
                 </p>
                 <div className="flex gap-4 overflow-x-auto pb-2">
                     <ShogiPiece char="歩兵" scale={0.5} />
                     <ShogiPiece char="香車" scale={0.5} />
                     <ShogiPiece char="桂馬" scale={0.5} />
                     <ShogiPiece char="金将" scale={0.5} />
                     <ShogiPiece char="王将" scale={0.5} isPromoted />
                 </div>
                 <p className="text-xs text-slate-500 mt-2">目指せ、「王将」アイコン！</p>
             </Card>
        </section>
    </div>
);

export const Guide: React.FC = () => {
    const [tab, setTab] = useState<'MANUAL' | 'TUTORIAL'>('MANUAL');

    return (
        <div className="max-w-4xl mx-auto pb-24">
            <div className="mb-8 text-center">
                <h2 className="text-4xl font-black text-white tracking-tight mb-2">ガイドブック</h2>
                <p className="text-slate-400 font-medium">アプリの使い方とルールをマスターしよう</p>
            </div>

            <div className="flex justify-center mb-8">
                <div className="bg-slate-800 p-1 rounded-2xl shadow-sm border border-slate-700 flex">
                    <button 
                        onClick={() => setTab('MANUAL')}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${tab === 'MANUAL' ? 'bg-slate-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}
                    >
                        <BookOpen size={18} /> 説明書 (Manual)
                    </button>
                    <button 
                        onClick={() => setTab('TUTORIAL')}
                        className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${tab === 'TUTORIAL' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}
                    >
                        <HelpCircle size={18} /> チュートリアル
                    </button>
                </div>
            </div>

            {tab === 'MANUAL' ? <ManualTab /> : <TutorialTab />}
        </div>
    );
};
