
import React, { useState } from 'react';
import { BookOpen, HelpCircle, Shield, TrendingUp, Star, Crown, CheckCircle, Info, Clock, Save, Flag, Settings, Volume2, Activity, Zap, AlertTriangle, List, Database, Code, Terminal, Server } from 'lucide-react';
import { ShogiPiece } from './ShogiPiece';
import { Card } from './Card';
import { SYSTEM_TITLES } from './storage';

const ManualTab = () => (
    <div className="space-y-8 animate-in slide-in-from-right duration-300 text-slate-200">
        
        {/* ARCHITECTURE */}
        <section>
            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2 font-serif-jp border-b border-white/10 pb-2">
                <Server className="text-indigo-400" /> システムアーキテクチャ (Technical Overview)
            </h3>
            <div className="bg-slate-950/50 p-6 rounded-xl border border-indigo-500/20 space-y-4 font-mono text-sm">
                <div>
                    <h4 className="text-indigo-300 font-bold mb-1">[Frontend / Stack]</h4>
                    <p className="text-slate-400">React 19, TypeScript, Vite, TailwindCSS, Recharts, Lucide-React</p>
                </div>
                <div>
                    <h4 className="text-indigo-300 font-bold mb-1">[Data Persistence]</h4>
                    <p className="text-slate-400">
                        LocalStorage (ブラウザ依存)。バックエンドサーバー非依存のスタンドアロン設計。<br/>
                        以下のキーを使用:
                    </p>
                    <ul className="list-disc list-inside mt-1 ml-2 text-slate-500">
                        <li><code>club_rivals_users_v2</code>: ユーザーデータ (User[])</li>
                        <li><code>club_rivals_matches</code>: 対戦履歴 (MatchRecord[])</li>
                        <li><code>club_rivals_settings</code>: システム設定 (SystemSettings)</li>
                        <li><code>club_rivals_logs</code>: アクティビティログ (ActivityLog[])</li>
                    </ul>
                </div>
            </div>
        </section>

        {/* ALGORITHM: RATE */}
        <section>
            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2 font-serif-jp border-b border-white/10 pb-2">
                <Shield className="text-blue-500" /> レート計算アルゴリズム (Elo Rating Logic)
            </h3>
            <Card>
                <div className="space-y-4 text-sm">
                    <p className="text-slate-200 font-bold">基本ロジック: Elo Rating System (K=32)</p>
                    <div className="bg-slate-900 p-4 rounded-lg font-mono text-xs text-slate-400 border border-slate-700">
                        Exp = 1 / (1 + 10^((Rate_Opponent - Rate_Player) / 400))<br/>
                        Change = K * (ActualScore - Exp)
                    </div>
                    
                    <h4 className="font-bold text-blue-300 mt-4">[独自仕様 / 補正]</h4>
                    <ul className="list-disc list-inside space-y-2 text-slate-300">
                        <li><strong>デフレ防止 (Inflationary):</strong> 敗北時の減少幅を抑制し、勝利時の増加幅を維持。</li>
                        <li><strong>最低保証変動:</strong> 勝利(+10), 引分(+5), 敗北(+2) の固定値を加算ベースとする。</li>
                        <li><strong>ジャイアントキリング (Giant Killing):</strong> レート差100以上の格上に勝利した場合、変動値に <code className="bg-slate-800 px-1 rounded">x1.5</code> の係数を適用。</li>
                        <li><strong>連戦ペナルティ (Spam Protection):</strong> 同一日・同ペアによる対戦が3回目(index>=2)以降の場合、変動値およびポイントに <code className="bg-red-900/30 text-red-400 px-1 rounded">x0.5</code> の係数を適用。</li>
                    </ul>
                </div>
            </Card>
        </section>

        {/* ALGORITHM: POINTS */}
        <section>
            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2 font-serif-jp border-b border-white/10 pb-2">
                <Star className="text-amber-500" /> ポイント計算仕様 (Point Logic)
            </h3>
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left font-mono">
                        <thead className="bg-slate-800 text-slate-400">
                            <tr>
                                <th className="p-2">Action</th>
                                <th className="p-2">Base Points</th>
                                <th className="p-2">Multipliers / Bonus</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700 bg-slate-900/50">
                            <tr>
                                <td className="p-2">WIN</td>
                                <td className="p-2 text-amber-500">10 pt</td>
                                <td className="p-2">EventMultiplier, StreakBonus(3連+10, 5連+30), NewMember(+5)</td>
                            </tr>
                            <tr>
                                <td className="p-2">DRAW</td>
                                <td className="p-2 text-slate-400">7 pt</td>
                                <td className="p-2">EventMultiplier, NewMember(+5)</td>
                            </tr>
                            <tr>
                                <td className="p-2">LOSS</td>
                                <td className="p-2 text-slate-500">5 pt</td>
                                <td className="p-2">EventMultiplier, NewMember(+5)</td>
                            </tr>
                            <tr>
                                <td className="p-2">ATTENDANCE</td>
                                <td className="p-2 text-green-500">5 pt</td>
                                <td className="p-2">1日1回制限 (Daily check)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p className="mt-4 text-xs text-slate-500">
                    ※ <code>MatchRecord</code> オブジェクト内に <code>PointBreakdown</code> として計算内訳が保存されます。
                </p>
            </Card>
        </section>

        {/* ADMIN & BACKUP */}
        <section>
            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2 font-serif-jp border-b border-white/10 pb-2">
                <Database className="text-red-400" /> データ管理・バックアップ仕様
            </h3>
            <Card>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-bold text-white mb-1 flex items-center gap-2"><Settings size={16}/> 管理機能 (Admin.tsx)</h4>
                        <p className="text-sm text-slate-400">
                            管理画面へのアクセスにはPINコード（デフォルト: <code>1123</code>）が必要です。<br/>
                            <code>storage.ts</code> 内の <code>DEFAULT_SETTINGS</code> 定数で定義されています。
                        </p>
                    </div>
                    
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-white/10">
                        <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Save size={16}/> JSONバックアップ構造</h4>
                        <pre className="text-[10px] text-slate-400 overflow-x-auto bg-black p-2 rounded border border-slate-800">
{`{
  "users": User[],          // 全ユーザーデータ
  "matches": MatchRecord[], // 全対戦履歴
  "settings": SystemSettings, // 現在の設定（シーズン、イベント等）
  "logs": ActivityLog[],    // 直近の活動ログ
  "timestamp": string       // エクスポート日時
}`}
                        </pre>
                        <p className="text-xs text-slate-500 mt-2">
                            ※ データ復元時は、このJSON構造を解析し、検証に成功した場合のみLocalStorageを上書きします。
                        </p>
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
                <p className="text-sm text-slate-300 mb-2">
                    <code>getFactionBalanceSimulation()</code> 関数により、以下の指標を用いて戦力が均等になるよう貪欲法で振り分けます。
                </p>
                <div className="bg-slate-900 p-4 rounded-lg font-mono text-xs text-slate-400 border border-slate-700 mb-4">
                    PowerScore = (Rate * 0.3) + (ActivityDays * 300)
                </div>
                <p className="text-xs text-slate-400">
                    単純なレート順ではなく、<strong>「活動日数（ActivityDays）」</strong>に高い重み付けを行うことで、
                    幽霊部員ばかりのチームができないようにし、アクティブ率の均衡化を図っています。
                </p>
            </Card>
        </section>
        
        {/* AUDIO ENGINE */}
        <section>
            <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2 font-serif-jp border-b border-white/10 pb-2">
                <Volume2 className="text-green-400" /> オーディオエンジン (Web Audio API)
            </h3>
            <Card>
                <p className="text-sm text-slate-300 mb-2">
                    外部アセット（mp3/wav）を使用せず、<code>AudioContext</code> を用いてブラウザ上で波形をリアルタイム合成しています。
                </p>
                <ul className="list-disc list-inside text-xs text-slate-400 space-y-1 font-mono">
                    <li><strong>CLICK (将棋音):</strong> High-pass filtered Noise Burst + Triangle wave resonance.</li>
                    <li><strong>SUCCESS (鼓):</strong> Pitch-bending Sine wave (High to Low).</li>
                    <li><strong>WIN (和太鼓):</strong> Low-pass filtered Square waves with decay.</li>
                    <li><strong>FANFARE (雅楽・笙):</strong> Sawtooth oscillators stacking Pentatonic scale (E5, A5, B5, E6, F#6).</li>
                </ul>
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
