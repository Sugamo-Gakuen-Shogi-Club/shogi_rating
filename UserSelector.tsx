
import React, { useState } from 'react';
import { User } from './types';
import { Search, X, Filter, CheckCircle, User as UserIcon, Users } from 'lucide-react';

interface UserSelectorProps {
  users: User[];
  onSelect: (userId: string) => void;
  onClose?: () => void;
  excludeIds?: string[];
  mode?: 'ATTENDANCE' | 'SIMPLE' | 'MATCH_SELECT';
  title?: string;
}

// 五十音データ
const GOJUUON = [
    ['あ', 'い', 'う', 'え', 'お'],
    ['か', 'き', 'く', 'け', 'こ'],
    ['さ', 'し', 'す', 'せ', 'そ'],
    ['た', 'ち', 'つ', 'て', 'と'],
    ['な', 'に', 'ぬ', 'ね', 'の'],
    ['は', 'ひ', 'ふ', 'へ', 'ほ'],
    ['ま', 'み', 'む', 'め', 'も'],
    ['や', '', 'ゆ', '', 'よ'],
    ['ら', 'り', 'る', 'れ', 'ろ'],
    ['わ', '', 'を', '', 'ん']
];

// 濁音・半濁音対応マッピング
const matchesKana = (reading: string | undefined, char: string) => {
    if (!reading) return false;
    const firstChar = reading.charAt(0);
    if (firstChar === char) return true;

    const dakuonMap: Record<string, string[]> = {
        'か': ['が'], 'き': ['ぎ'], 'く': ['ぐ'], 'け': ['げ'], 'こ': ['ご'],
        'さ': ['ざ'], 'し': ['じ'], 'す': ['ず'], 'せ': ['ぜ'], 'そ': ['ぞ'],
        'た': ['だ'], 'ち': ['ぢ'], 'つ': ['づ'], 'て': ['で'], 'と': ['ど'],
        'は': ['ば', 'ぱ'], 'ひ': ['び', 'ぴ'], 'ふ': ['ぶ', 'ぷ'], 'へ': ['べ', 'ぺ'], 'ほ': ['ぼ', 'ぽ']
    };

    if (dakuonMap[char] && dakuonMap[char].includes(firstChar)) return true;
    return false;
};

export const UserSelector: React.FC<UserSelectorProps> = ({ 
    users, 
    onSelect, 
    onClose, 
    excludeIds = [], 
    mode = 'SIMPLE',
    title = '部員を選択'
}) => {
  const [search, setSearch] = useState('');
  const [selectedChar, setSelectedChar] = useState<string | null>(null);

  // フィルタリングロジック
  const filteredUsers = users.filter(u => {
    if (excludeIds.includes(u.id)) return false;

    // 1. 文字検索 (名前 or 読み)
    if (search) {
        return u.name.toLowerCase().includes(search.toLowerCase()) || 
               (u.reading && u.reading.includes(search));
    }
    
    // 2. 五十音フィルター
    if (selectedChar) {
        return matchesKana(u.reading, selectedChar);
    }

    return true;
  });
  
  // ソート: 読み順 -> 名前順
  filteredUsers.sort((a, b) => {
      if (a.reading && b.reading) return a.reading.localeCompare(b.reading);
      return a.name.localeCompare(b.name);
  });

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 md:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[800px]">
        {/* ヘッダー */}
        <div className={`p-4 text-white flex items-center justify-between shrink-0 shadow-md ${
            mode === 'ATTENDANCE' ? 'bg-blue-600' : 
            mode === 'MATCH_SELECT' ? 'bg-slate-800' : 'bg-indigo-600'
        }`}>
          <div className="flex items-center gap-3">
             {mode === 'ATTENDANCE' ? <CheckCircle className="text-blue-200" /> : 
              mode === 'MATCH_SELECT' ? <Users className="text-slate-200" /> : <UserIcon className="text-indigo-200" />}
             <h3 className="text-lg font-black uppercase tracking-widest">{title}</h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors active:scale-95">
                <X size={24} />
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row h-full overflow-hidden">
            {/* 左側: 五十音キーボード */}
            <div className="w-full md:w-[45%] lg:w-[40%] bg-slate-100 border-r border-slate-200 flex flex-col order-2 md:order-1">
                 {/* 検索バー */}
                 <div className="p-3 border-b border-slate-200 bg-white shrink-0 z-10">
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          autoFocus={window.innerWidth > 768} // PCのみオートフォーカス
                          type="text" 
                          placeholder="名前で検索 (ひらがなOK)..." 
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base"
                          value={search}
                          onChange={(e) => {
                            setSearch(e.target.value);
                            setSelectedChar(null);
                          }}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                                <X size={16} />
                            </button>
                        )}
                      </div>
                 </div>
                 
                 {/* キーボード本体 */}
                 <div className="flex-1 overflow-y-auto p-2 bg-slate-100 scrollbar-thin">
                     <div className="flex flex-col gap-2 select-none pb-20 md:pb-4">
                        <button 
                            onClick={() => setSelectedChar(null)}
                            className={`w-full py-3 rounded-xl font-bold text-sm transition-all border flex items-center justify-center gap-2 ${!selectedChar && !search ? 'bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50'}`}
                        >
                            <Filter size={14} /> 全員表示
                        </button>

                        {GOJUUON.map((row, rowIdx) => (
                            <div key={rowIdx} className="flex gap-2 justify-between">
                                {row.map((char, colIdx) => {
                                    if (!char) return <div key={colIdx} className="flex-1" />; // 空白調整
                                    
                                    const isSelected = selectedChar === char;
                                    const hasUsers = users.some(u => !excludeIds.includes(u.id) && matchesKana(u.reading, char));

                                    return (
                                        <button
                                            key={char}
                                            onClick={() => {
                                                if (!hasUsers && !isSelected) return;
                                                setSelectedChar(isSelected ? null : char);
                                                setSearch('');
                                            }}
                                            disabled={!hasUsers}
                                            className={`
                                                flex-1 aspect-[1.3] flex items-center justify-center rounded-xl font-bold text-xl transition-all border shadow-sm touch-manipulation
                                                ${isSelected 
                                                    ? 'bg-blue-600 text-white border-blue-600 scale-105 z-10 shadow-blue-200' 
                                                    : hasUsers 
                                                        ? 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600 active:bg-slate-50' 
                                                        : 'bg-slate-50 text-slate-300 border-slate-100 opacity-50 cursor-default'}
                                            `}
                                        >
                                            {char}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                     </div>
                 </div>
            </div>

            {/* 右側: ユーザーリスト */}
            <div className="flex-1 bg-slate-50/50 flex flex-col h-full overflow-hidden relative order-1 md:order-2">
                 {/* ステータスバー */}
                 <div className="p-3 bg-white/80 backdrop-blur border-b border-slate-100 flex items-center justify-between shrink-0 text-sm sticky top-0 z-10">
                     <span className="font-bold text-slate-500 flex items-center gap-2">
                         {selectedChar ? <><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">「{selectedChar}」</span>行</> : search ? `検索: "${search}"` : '全員'}
                     </span>
                     <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                         {filteredUsers.length}名
                     </span>
                 </div>

                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-20">
                        {filteredUsers.map(u => {
                            const last = u.lastAttendance ? new Date(u.lastAttendance).toISOString().split('T')[0] : null;
                            const isAttendedToday = today === last;
                            
                            // 出席モードの場合のみ、すでに出席済みの人を選択不可にする
                            const isDisabled = mode === 'ATTENDANCE' && isAttendedToday;

                            return (
                            <button 
                                key={u.id}
                                onClick={() => !isDisabled && onSelect(u.id)}
                                disabled={isDisabled}
                                className={`relative flex flex-col items-center p-4 rounded-2xl border transition-all text-center group overflow-hidden
                                    ${isDisabled 
                                        ? 'bg-slate-100 border-slate-200 opacity-60 cursor-default' 
                                        : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer'
                                    }
                                `}
                            >
                                {mode === 'ATTENDANCE' && isAttendedToday && (
                                    <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 rounded-bl-xl text-[10px] font-bold shadow-sm z-10">
                                        出席済
                                    </div>
                                )}
                                
                                {u.isNewMember && (
                                     <div className="absolute top-2 left-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                )}

                                <div className={`w-16 h-16 rounded-full ${u.avatarColor} flex items-center justify-center text-white font-bold mb-3 text-2xl shadow-md group-hover:scale-110 transition-transform border-2 border-white`}>
                                    {u.name.charAt(0)}
                                </div>
                                
                                <div className="w-full">
                                    <div className="font-bold text-slate-800 text-sm leading-tight w-full truncate">{u.name}</div>
                                    {/* 読み仮名表示を削除しました */}
                                </div>
                                
                                {/* モード別の追加情報 */}
                                <div className="mt-2 pt-2 border-t border-slate-50 w-full">
                                    {mode === 'MATCH_SELECT' ? (
                                        <div className="text-xs font-mono text-blue-600 font-bold bg-blue-50 rounded py-0.5">Rate: {Math.round(u.rate)}</div>
                                    ) : (
                                        <div className="text-[10px] text-slate-400">
                                             {isDisabled ? '完了' : '選択'}
                                        </div>
                                    )}
                                </div>
                            </button>
                            );
                        })}
                        {filteredUsers.length === 0 && (
                            <div className="col-span-full text-center py-12 text-slate-400 flex flex-col items-center justify-center h-full min-h-[200px]">
                                <Search size={48} className="opacity-20 mb-4" />
                                <p className="font-bold">該当する部員が見つかりません</p>
                                <p className="text-xs mt-2 opacity-70">他の文字を選んでください</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
