
import React, { useState, useEffect, useRef } from 'react';
import { getUsers, saveUsers, getSettings, saveSettings, manualPointAdjustment, resetMonthly, isEventActive, exportData, importData, getMatches, deleteMatch } from '../services/storage';
import { User, SystemSettings, MatchRecord } from '../types';
import { Card } from '../components/ui/Card';
import { NumPad } from '../components/ui/NumPad';
import { Settings, Trash2, Plus, ToggleLeft, ToggleRight, Calendar, Download, Upload, History, AlertCircle, CheckCircle } from 'lucide-react';

const Admin: React.FC = () => {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(getSettings());
  const [users, setUsers] = useState<User[]>([]);
  const [activeEvent, setActiveEvent] = useState(false);
  const [recentMatches, setRecentMatches] = useState<MatchRecord[]>([]);
  
  // Event Form
  const [eventName, setEventName] = useState('');
  const [eventDuration, setEventDuration] = useState(7); // Days

  // New User Form
  const [newName, setNewName] = useState('');
  
  // Point Adjustment
  const [adjUser, setAdjUser] = useState('');
  const [adjPoints, setAdjPoints] = useState(10);
  const [adjReason, setAdjReason] = useState('部室掃除');
  const [isPointProcessing, setIsPointProcessing] = useState(false);
  const [pointSuccessMsg, setPointSuccessMsg] = useState<string | null>(null);

  // File Input
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      refreshData();
  }, []);

  const handleLogin = () => {
    if (pin === settings.adminPin) {
      setIsAuthenticated(true);
      refreshData();
    } else {
      alert('PINが違います');
      setPin('');
    }
  };

  const refreshData = () => {
    setUsers(getUsers());
    const s = getSettings();
    setSettings(s);
    setActiveEvent(isEventActive());
    if (s.eventName) setEventName(s.eventName);
    setRecentMatches(getMatches().slice(0, 20)); // Get last 20
  };

  const handleAddUser = () => {
    if (!newName.trim()) return;
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName,
      isNewMember: true,
      rate: 1000,
      totalPoints: 0,
      pointsMatch: 0,
      pointsAttendance: 0,
      pointsSpecial: 0,
      monthlyPoints: 0,
      currentStreak: 0,
      maxStreak: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      lastAttendance: null,
      activityDays: 0,
      rateHistory: [{ date: new Date().toISOString(), rate: 1000 }],
      achievements: [],
      activeTitle: null,
      avatarColor: `bg-${['red','blue','green','yellow','purple','pink'][Math.floor(Math.random()*6)]}-500`
    };
    const updated = [...users, newUser];
    saveUsers(updated);
    setNewName('');
    refreshData();
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('本当に削除しますか？この操作は取り消せません。')) {
      const updated = users.filter(u => u.id !== id);
      saveUsers(updated);
      refreshData();
    }
  };

  const toggleNewMember = (id: string) => {
      const updated = users.map(u => {
          if (u.id === id) return { ...u, isNewMember: !u.isNewMember };
          return u;
      });
      saveUsers(updated);
      refreshData();
  };

  const handleStartEvent = () => {
      if (!eventName) {
          alert('イベント名を入力してください');
          return;
      }
      const endsAt = new Date();
      endsAt.setDate(endsAt.getDate() + eventDuration);
      
      const newSettings: SystemSettings = {
          ...settings,
          eventName: eventName,
          eventEndsAt: endsAt.toISOString(),
      };
      saveSettings(newSettings);
      refreshData();
      alert('イベントを開始しました！');
  };

  const handleStopEvent = () => {
      if (window.confirm('開催中のイベントを強制終了しますか？')) {
        const newSettings: SystemSettings = {
            ...settings,
            eventEndsAt: null,
        };
        saveSettings(newSettings);
        refreshData();
      }
  };

  const handleGivePoints = () => {
    if (!adjUser) return;
    
    setIsPointProcessing(true);
    manualPointAdjustment(adjUser, adjPoints, adjReason);
    setPointSuccessMsg(`${adjPoints}ポイントを付与しました (完了)`);
    
    refreshData();

    setTimeout(() => {
        setIsPointProcessing(false);
        setPointSuccessMsg(null);
    }, 3000);
  };

  const handleResetMonthly = () => {
      if (window.confirm('今月のランキングをリセットしますか？（表示上の月間ポイントが0になります）')) {
          resetMonthly();
          refreshData();
          alert('月間ランキングをリセットしました');
      }
  }

  const handleBackup = () => {
      const json = exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `club_rivals_backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
  }

  const handleRestoreClick = () => {
      fileInputRef.current?.click();
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          const content = ev.target?.result as string;
          if (importData(content)) {
              alert('データを復元しました。ページをリロードします。');
              window.location.reload();
          } else {
              alert('データの復元に失敗しました。ファイル形式を確認してください。');
          }
      };
      reader.readAsText(file);
  }

  const handleDeleteMatch = (matchId: string) => {
      if (window.confirm('この対戦記録を取り消しますか？\nレートとポイントの変動も元に戻ります。')) {
          try {
              deleteMatch(matchId);
              refreshData();
              alert('対戦を取り消しました');
          } catch(e) {
              alert('取り消しに失敗しました');
          }
      }
  }

  const getPlayerName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="w-full max-w-md p-8 text-center space-y-6 animate-in zoom-in duration-300">
          <Settings className="mx-auto text-slate-400" size={48} />
          <h2 className="text-2xl font-bold text-slate-800">管理者ログイン</h2>
          
          <div>
             <input 
                type="password" 
                value={pin}
                readOnly
                placeholder="PIN"
                className="w-full p-4 border rounded-xl text-center text-2xl tracking-[1em] outline-none bg-slate-50 font-mono focus:ring-2 focus:ring-blue-500 cursor-default"
             />
             <NumPad value={pin} onChange={setPin} maxLength={4} />
          </div>

          <button 
            onClick={handleLogin}
            disabled={pin.length < 4}
            className="w-full bg-slate-800 disabled:bg-slate-300 text-white py-3 rounded-xl font-bold active:scale-95 transition-transform shadow-lg"
          >
            ログイン
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <Settings /> 管理者ダッシュボード
      </h2>

      {/* Data Management (Backup/Restore) */}
      <Card title="データ管理">
          <div className="flex flex-col md:flex-row gap-4">
              <button 
                onClick={handleBackup}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-xl font-bold transition-all border border-slate-200"
              >
                  <Download size={20} />
                  バックアップを保存
              </button>
              <button 
                onClick={handleRestoreClick}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-xl font-bold transition-all border border-slate-200"
              >
                  <Upload size={20} />
                  データを復元
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleFileChange}
              />
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">※ タブレットを変更する場合や、データを守るために定期的にバックアップを保存してください。</p>
      </Card>

      {/* Recent Matches (Undo) */}
      <Card title="直近の対戦履歴 (修正)" icon={<History size={20}/>}>
          <div className="max-h-80 overflow-y-auto border border-slate-100 rounded-xl">
            {recentMatches.length === 0 ? (
                <div className="p-6 text-center text-slate-400">履歴がありません</div>
            ) : (
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 sticky top-0">
                        <tr>
                            <th className="p-3 text-slate-500">日時</th>
                            <th className="p-3 text-slate-500">対戦カード</th>
                            <th className="p-3 text-slate-500">勝者</th>
                            <th className="p-3 text-slate-500 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {recentMatches.map(m => {
                            const p1Name = getPlayerName(m.player1Id);
                            const p2Name = getPlayerName(m.player2Id);
                            return (
                                <tr key={m.id} className="hover:bg-slate-50">
                                    <td className="p-3 text-slate-400 text-xs">
                                        {new Date(m.date).toLocaleDateString()} {new Date(m.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </td>
                                    <td className="p-3 font-bold text-slate-700">
                                        {p1Name} vs {p2Name}
                                    </td>
                                    <td className="p-3">
                                        {m.result === 'PLAYER1_WIN' ? <span className="text-blue-600 font-bold">{p1Name}</span> : 
                                         m.result === 'PLAYER2_WIN' ? <span className="text-blue-600 font-bold">{p2Name}</span> : 
                                         <span className="text-slate-400">引き分け</span>}
                                    </td>
                                    <td className="p-3 text-right">
                                        <button 
                                            onClick={() => handleDeleteMatch(m.id)}
                                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors text-xs flex items-center gap-1 ml-auto"
                                        >
                                            <Trash2 size={14} /> 取り消し
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
          </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card title="イベント設定">
           <div className="space-y-4">
             <div className={`p-4 rounded-xl border ${activeEvent ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-slate-800">現在のステータス</div>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${activeEvent ? 'bg-green-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                        {activeEvent ? '開催中' : '通常モード'}
                    </span>
                </div>
                {activeEvent && settings.eventEndsAt && (
                    <div className="text-sm text-slate-600">
                        <div>イベント: <span className="font-bold">{settings.eventName}</span></div>
                        <div>終了予定: {new Date(settings.eventEndsAt).toLocaleDateString()}</div>
                    </div>
                )}
             </div>

             {!activeEvent ? (
                 <div className="space-y-3">
                    <div>
                        <label className="text-xs font-bold text-slate-500">イベント名</label>
                        <input 
                            type="text" 
                            value={eventName}
                            onChange={e => setEventName(e.target.value)}
                            placeholder="例: 新入生歓迎大会"
                            className="w-full p-2 border rounded-lg bg-white"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500">期間 (日数)</label>
                        <div className="flex gap-2">
                            <input 
                                type="number" 
                                value={eventDuration}
                                onChange={e => setEventDuration(Number(e.target.value))}
                                className="w-24 p-2 border rounded-lg bg-white"
                            />
                            <span className="self-center text-slate-500 text-sm">日間</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleStartEvent}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <Calendar size={16} /> イベントを開始
                    </button>
                 </div>
             ) : (
                 <button 
                    onClick={handleStopEvent}
                    className="w-full bg-red-500 text-white py-2 rounded-lg font-bold hover:bg-red-600 active:scale-95 transition-transform"
                 >
                     イベントを強制終了
                 </button>
             )}

             <hr className="border-slate-100 my-4"/>
             
             <button onClick={handleResetMonthly} className="w-full py-2 border border-slate-300 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 active:scale-95 transition-transform">
                 月間ランキングのリセット
             </button>
           </div>
        </Card>

        <Card title="ポイント手動付与">
            <div className="space-y-3">
                <select 
                    value={adjUser} 
                    onChange={e => setAdjUser(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                >
                    <option value="">部員を選択...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <div className="flex gap-2">
                    <input 
                        type="number" 
                        value={adjPoints} 
                        onChange={e => setAdjPoints(Number(e.target.value))}
                        className="w-24 p-2 border rounded-lg bg-slate-50" 
                    />
                    <input 
                        type="text" 
                        value={adjReason} 
                        onChange={e => setAdjReason(e.target.value)}
                        placeholder="理由 (例: 掃除)"
                        className="flex-1 p-2 border rounded-lg bg-slate-50" 
                    />
                </div>
                <button 
                    onClick={handleGivePoints}
                    disabled={isPointProcessing}
                    className={`w-full text-white py-2 rounded-lg font-bold active:scale-95 transition-all flex items-center justify-center gap-2 ${isPointProcessing ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    {isPointProcessing ? (
                        <>
                            <CheckCircle size={18} /> 付与完了
                        </>
                    ) : 'ポイント付与'}
                </button>
                {pointSuccessMsg && (
                    <div className="text-center text-green-600 text-sm font-bold animate-pulse">
                        {pointSuccessMsg}
                    </div>
                )}
            </div>
        </Card>
      </div>

      {/* User Management */}
      <Card title="部員管理">
        <div className="space-y-6">
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="新しい部員の名前"
                    className="flex-1 p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button 
                    onClick={handleAddUser}
                    className="bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 active:scale-95 transition-transform"
                >
                    <Plus size={18} /> 追加
                </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="p-3 text-slate-500">名前</th>
                            <th className="p-3 text-slate-500 text-center">新入部員</th>
                            <th className="p-3 text-slate-500 text-right">レート</th>
                            <th className="p-3 text-slate-500 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50/50">
                                <td className="p-3 font-bold text-slate-700">{u.name}</td>
                                <td className="p-3 text-center">
                                    <button onClick={() => toggleNewMember(u.id)} className="text-slate-400 hover:text-blue-600 active:scale-90 transition-transform">
                                        {u.isNewMember ? <ToggleRight className="text-green-500 mx-auto" size={24}/> : <ToggleLeft className="mx-auto" size={24}/>}
                                    </button>
                                </td>
                                <td className="p-3 text-right font-mono text-blue-600">{Math.round(u.rate)}</td>
                                <td className="p-3 text-right">
                                    <button 
                                        onClick={() => handleDeleteUser(u.id)}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors active:scale-90"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </Card>
    </div>
  );
};

export default Admin;
