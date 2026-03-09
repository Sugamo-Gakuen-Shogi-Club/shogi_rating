
import React, { useState } from 'react';
import { HelpCircle, Shield, Star, CheckCircle, Save, Flag, Settings, Volume2, Activity, Zap, Database, Terminal, Server } from 'lucide-react';
import { ShogiPiece } from './ShogiPiece';
import { Card } from './Card';

const ManualTab = () => (
    <div className="space-y-8 animate-in slide-in-from-right duration-300 text-slate-200">
        
        {/* RATE SYSTEM */}
        <section>
            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2 font-serif-jp border-b border-white/10 pb-2">
                <Shield className="text-blue-500" /> レートシステム (Rate System)
            </h3>
            <Card>
                <div className="space-y-4">
                    <p className="text-sm text-slate-300 leading-relaxed">
                        当アプリでは、独自の<strong>「経験値蓄積型Eloレーティング」</strong>を採用しています。<br/>
                        一般的なレーティングと異なり、<span className="text-white font-bold bg-blue-600/20 px-1 rounded">敗北してもレートが下がらない（負の変動が正になる）</span>仕様により、
                        対局すればするほど数値が上昇する「インフレ型」設計となっています。
                        これにより、初心者が敗北を恐れずに対局できる環境を作ります。
                    </p>
                    
                    <div className="bg-slate-950/50 p-6 rounded-xl border border-white/10">
                         <h4 className="text-white font-bold mb-4 border-l-4 border-blue-500 pl-3">詳細計算ロジック</h4>
                         <ul className="space-y-3 text-sm text-slate-400">
                             <li className="flex gap-2">
                                 <span className="font-bold text-blue-400 shrink-0">1. 基本計算式:</span>
                                 <span>
                                     Elo Rating System (K=32) をベースにしています。<br/>
                                     <code>変動値 = K × (実スコア - 勝率期待値)</code>
                                 </span>
                             </li>
                             <li className="flex gap-2">
                                 <span className="font-bold text-blue-400 shrink-0">2. 勝利時:</span>
                                 <span>
                                     計算結果の変動値に加え、<strong>最低保証値 (+10)</strong> が適用されます。<br/>
                                     <span className="text-xs text-slate-500">※相手が格上の場合、変動値が大きくなります。</span>
                                 </span>
                             </li>
                             <li className="flex gap-2">
                                 <span className="font-bold text-amber-400 shrink-0">3. 下克上補正:</span>
                                 <span>
                                     相手とのレート差が100以上ある格上に勝利した場合（Giant Killing）、<br/>
                                     変動値に <code className="bg-slate-800 px-1 text-white">x1.5</code> の倍率が掛かります。
                                 </span>
                             </li>
                             <li className="flex gap-2">
                                 <span className="font-bold text-green-400 shrink-0">4. 引き分け:</span>
                                 <span>
                                     計算式に関わらず、固定で <strong>+5</strong> レート上昇します。
                                 </span>
                             </li>
                             <li className="flex gap-2">
                                 <span className="font-bold text-red-400 shrink-0">5. 敗北時:</span>
                                 <span>
                                     レート減少の代わりに、参加賞として固定で <strong>+2</strong> レート上昇します。
                                 </span>
                             </li>
                         </ul>
                    </div>
                </div>
            </Card>
        </section>

        {/* POINT SYSTEM */}
        <section>
            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2 font-serif-jp border-b border-white/10 pb-2">
                <Star className="text-amber-500" /> ポイントシステム (Point System)
            </h3>
            <Card>
                <div className="space-y-4">
                     <p className="text-sm text-slate-300 leading-relaxed">
                        レートとは別に、部活動への貢献度を可視化する「ポイント」があります。<br/>
                        ポイントは月間ランキングや通算ランキングに使用されます。
                    </p>

                    <div className="overflow-x-auto rounded-xl border border-white/10">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-900 text-slate-400 uppercase text-xs font-bold">
                                <tr>
                                    <th className="p-4">アクション</th>
                                    <th className="p-4">基本ポイント</th>
                                    <th className="p-4">適用されるボーナス・倍率</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 bg-slate-950/30">
                                <tr>
                                    <td className="p-4 font-bold text-white">勝利 (WIN)</td>
                                    <td className="p-4 text-amber-400 font-bold text-lg">10 pt</td>
                                    <td className="p-4 text-slate-400">
                                        <div>• イベント倍率 (開催中のみ)</div>
                                        <div>• 連勝ボーナス</div>
                                        <div>• 新入部員ボーナス</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-bold text-slate-300">引き分け (DRAW)</td>
                                    <td className="p-4 font-bold">7 pt</td>
                                    <td className="p-4 text-slate-400">• イベント倍率<br/>• 新入部員ボーナス</td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-bold text-slate-400">敗北 (LOSS)</td>
                                    <td className="p-4 font-bold">5 pt</td>
                                    <td className="p-4 text-slate-400">• イベント倍率<br/>• 新入部員ボーナス</td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-bold text-green-400">出席 (Attendance)</td>
                                    <td className="p-4 font-bold">5 pt</td>
                                    <td className="p-4 text-slate-400">1日1回のみ獲得可能</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/10">
                            <h4 className="text-amber-400 font-bold mb-2 flex items-center gap-2"><Zap size={16}/> 連勝ボーナス</h4>
                            <ul className="text-xs text-slate-300 space-y-1">
                                <li>• <strong>3連勝:</strong> +10 pt</li>
                                <li>• <strong>5連勝:</strong> +30 pt</li>
                            </ul>
                            <p className="text-[10px] text-slate-500 mt-2">※引き分け・敗北で連勝カウントはリセットされます。</p>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/10">
                            <h4 className="text-green-400 font-bold mb-2 flex items-center gap-2"><CheckCircle size={16}/> その他ボーナス</h4>
                            <ul className="text-xs text-slate-300 space-y-1">
                                <li>• <strong>新入部員ボーナス:</strong> +5 pt (対戦相手または自分が新入部員の場合)</li>
                                <li>• <strong>イベント倍率:</strong> 管理者が設定した倍率 (例: x2, x3) が基本ポイントに掛かります。</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </Card>
        </section>

        {/* ANTI-SPAM */}
        <section>
            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2 font-serif-jp border-b border-white/10 pb-2">
                <Settings className="text-red-400" /> 不正防止・連戦ペナルティ
            </h3>
            <Card>
                 <div className="space-y-4">
                     <p className="text-sm text-slate-300 leading-relaxed">
                        ポイント稼ぎのための「馴れ合い対局」や「短時間での連戦」を抑制するため、以下のシステムが稼働しています。
                    </p>
                    <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/30">
                        <h4 className="text-red-400 font-bold mb-2 flex items-center gap-2">連戦ペナルティ (Spam Protection)</h4>
                        <p className="text-sm text-slate-300 mb-2">
                            同一ペアによる対戦回数が1日の中で特定回数を超えると、獲得できるレート・ポイントが減少します。
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold mt-2">
                            <div className="bg-slate-900 p-2 rounded border border-slate-700">
                                <div className="text-slate-400">1戦目</div>
                                <div className="text-green-400 text-lg">通常</div>
                                <div className="text-slate-600">x1.0</div>
                            </div>
                            <div className="bg-slate-900 p-2 rounded border border-slate-700">
                                <div className="text-slate-400">2戦目</div>
                                <div className="text-green-400 text-lg">通常</div>
                                <div className="text-slate-600">x1.0</div>
                            </div>
                            <div className="bg-slate-900 p-2 rounded border border-red-900/50 relative overflow-hidden">
                                <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
                                <div className="relative">
                                    <div className="text-red-300">3戦目以降</div>
                                    <div className="text-red-500 text-lg">半減</div>
                                    <div className="text-red-400">x0.5</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800">
                         <div className="bg-slate-800 p-2 rounded text-slate-400"><Activity size={16}/></div>
                         <div>
                             <h5 className="text-sm font-bold text-slate-300">クールダウン (Cooldown)</h5>
                             <p className="text-xs text-slate-500">
                                 同じ相手との再戦には <strong>1分間</strong> のインターバルが必要です。<br/>
                                 連続して送信しようとするとエラーになります。
                             </p>
                         </div>
                    </div>
                 </div>
            </Card>
        </section>

        {/* FACTION WAR ALGORITHM */}
        <section>
            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2 font-serif-jp border-b border-white/10 pb-2">
                <Flag className="text-red-500" /> 紅白戦チーム分けロジック
            </h3>
            <Card>
                <div className="space-y-4">
                    <p className="text-sm text-slate-300 leading-relaxed">
                        紅白戦イベント開催時のチーム分けは、以下のアルゴリズムによって自動計算され、戦力が均等になるように配分されます。
                    </p>
                    
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-white/10 font-mono text-sm text-slate-300">
                        <div className="mb-2 text-xs text-slate-500 uppercase font-bold">Power Score Formula</div>
                        <div>PowerScore = (Rate × 0.3) + (ActivityDays × 300)</div>
                    </div>

                    <p className="text-xs text-slate-400">
                        <span className="font-bold text-white">解説:</span><br/>
                        単純な「将棋の強さ（レート）」だけでなく、<strong>「部活動への参加頻度（活動日数）」</strong>に対して非常に高い重み付け（係数300）を行っています。<br/>
                        これは、幽霊部員ばかりのチームが生成されるのを防ぎ、実際に活動している部員が両チームに均等に分散されるようにするためです。
                    </p>
                </div>
            </Card>
        </section>

        {/* DATA & AUDIO */}
        <section>
            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2 font-serif-jp border-b border-white/10 pb-2">
                <Database className="text-indigo-400" /> システム仕様・その他
            </h3>
            <Card>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                         <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Save size={16}/> データ保存とバックアップ</h4>
                         <p className="text-xs text-slate-400 leading-relaxed mb-2">
                             本アプリはサーバーを使用せず、すべてのデータを<strong>ブラウザのローカルストレージ (LocalStorage)</strong> に保存します。<br/>
                             iPadのキャッシュクリア等でデータが消えないよう注意してください。
                         </p>
                         <p className="text-xs text-slate-400 leading-relaxed">
                             管理者画面から「JSON形式」でデータのバックアップ（エクスポート）と復元（インポート）が可能です。
                             定期的なバックアップを推奨します。
                         </p>
                     </div>
                     <div>
                         <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Volume2 size={16}/> オーディオエンジン</h4>
                         <p className="text-xs text-slate-400 leading-relaxed">
                             効果音はmp3などの外部ファイルを使用せず、<strong>Web Audio API</strong> を用いてプログラム上で波形をリアルタイム合成しています。
                         </p>
                         <ul className="text-[10px] text-slate-500 mt-2 space-y-1 font-mono">
                             <li>• 駒音: ノイズバースト + フィルター</li>
                             <li>• 鼓: ピッチベンド・サイン波</li>
                             <li>• 笙: 鋸波の多重和音 (Pentatonic)</li>
                         </ul>
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

        <section>
             <h4 className="text-xl font-bold text-white mb-4 border-l-4 border-purple-500 pl-4 py-1">4. データを分析しよう</h4>
             <Card>
                 <p className="text-slate-200 text-sm mb-4 leading-relaxed">
                     プロフィール画面では、自分の活動履歴を詳しく見ることができます。
                 </p>
                 <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-400">
                     <div className="bg-slate-800 p-3 rounded-lg flex items-center gap-2">
                         <Activity size={16} className="text-green-500" /> 活動ヒートマップ (草)
                     </div>
                     <div className="bg-slate-800 p-3 rounded-lg flex items-center gap-2">
                         <Zap size={16} className="text-yellow-500" /> 星取表 (○●)
                     </div>
                 </div>
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
                <p className="text-slate-400 font-medium">システム仕様 (Manual) & 使い方 (Tutorial)</p>
            </div>

            <div className="flex justify-center mb-10">
                <div className="bg-slate-800 p-1.5 rounded-2xl shadow-lg border border-slate-700 flex gap-1">
                    <button 
                        onClick={() => setTab('MANUAL')}
                        className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${tab === 'MANUAL' ? 'bg-slate-600 text-white shadow-md ring-1 ring-slate-500' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    >
                        <Terminal size={18} /> システム仕様書 (Technical)
                    </button>
                    <button 
                        onClick={() => setTab('TUTORIAL')}
                        className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${tab === 'TUTORIAL' ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-500' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                    >
                        <HelpCircle size={18} /> チュートリアル (User)
                    </button>
                </div>
            </div>

            {tab === 'MANUAL' ? <ManualTab /> : <TutorialTab />}
        </div>
    );
};
