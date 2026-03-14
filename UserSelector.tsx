
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, EventType } from './types';
import { Search, X, Filter, CheckCircle, User as UserIcon, Users, RefreshCw, Crown } from 'lucide-react';
import { getUserAvatarChar, getSettings, isEventActive, getUserIconDef, getLocalDateString } from './storage';
import { ShogiPiece } from './ShogiPiece';

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
  const [selectedChar, setSelectedChar] = useState<string | null>(null);

  // Check for active Faction War
  const settings = getSettings();
  const activeEvent = isEventActive();
  const isFactionWar = activeEvent && settings.eventType === EventType.FACTION_WAR;

  // フィルタリングロジック
  const filteredUsers = users.filter(u => {
    if (excludeIds.includes(u.id)) return false;

    // 五十音フィルター
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

  const today = getLocalDateString();

  const content = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 md:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[800px] border border-white/10 relative z-[51]">
        {/* ヘッダー */}
        <div className={`p-4 text-white flex items-center justify-between shrink-0 shadow-lg ${
            mode === 'ATTENDANCE' ? 'bg-gradient-to-r from-blue-700 to-blue-600' : 
            mode === 'MATCH_SELECT' ? 'bg-gradient-to-r from-slate-800 to-slate-700' : 'bg-gradient-to-r from-indigo-700 to-indigo-600'
        }`}>
          <div className="flex items-center gap-3">
             {mode === 'ATTENDANCE' ? <CheckCircle className="text-blue-200" /> : 
              mode === 'MATCH_SELECT' ? <Users className="text-slate-200" /> : <UserIcon className="text-indigo-200" />}
             <h3 className="text-lg font-black uppercase tracking-widest drop-shadow-sm">{title}</h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors active:scale-95 backdrop-blur-sm">
                <X size={24} />
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row h-full overflow-hidden">
            {/* 左側: 五十音キーボード */}
            <div className="w-full md:w-[45%] lg:w-[40%] bg-slate-800 border-r border-slate-700 flex flex-col order-2 md:order-1">
                 {/* ステータス＆リセット */}
                 <div className="p-3 border-b border-slate-700 bg-slate-800/80 backdrop-blur shrink-0 z-10 flex items-center justify-between">
                     <span className="font-bold text-slate-300 text-sm">
                         {selectedChar ? `「${selectedChar}」行を選択中` : 'フィルタなし'}
                     </span>
                     {selectedChar && (
                        <button 
                            onClick={() => setSelectedChar(null)} 
                            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 transition-colors"
                        >
                            <RefreshCw size={12} /> 解除
                        </button>
                     )}
                 </div>
                 
                 {/* キーボード本体 */}
                 <div className="flex-1 overflow-y-auto p-2 bg-slate-900 scrollbar-thin">
                     <div className="flex flex-col gap-2 select-none pb-20 md:pb-4">
                        <button 
                            onClick={() => setSelectedChar(null)}
                            className={`w-full py-3 rounded-xl font-bold text-sm transition-all border flex items-center justify-center gap-2 ${!selectedChar ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
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
                                            }}
                                            disabled={!hasUsers}
                                            className={`
                                                flex-1 aspect-[1.3] flex items-center justify-center rounded-xl font-bold text-xl transition-all border shadow-sm touch-manipulation
                                                ${isSelected 
                                                    ? 'bg-blue-600 text-white border-blue-600 scale-105 z-10 shadow-blue-900' 
                                                    : hasUsers 
                                                        ? 'bg-slate-800 text-slate-200 border-slate-700 hover:border-blue-500 hover:text-blue-400 active:bg-slate-700' 
                                                        : 'bg-slate-900/50 text-slate-700 border-slate-800 opacity-50 cursor-default'}
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
            <div className="flex-1 bg-slate-900/50 flex flex-col h-full overflow-hidden relative order-1 md:order-2">
                 {/* ステータスバー */}
                 <div className="p-3 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between shrink-0 text-sm sticky top-0 z-10 shadow-sm">
                     <span className="font-bold text-slate-400 flex items-center gap-2">
                         {selectedChar ? <><span className="bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">「{selectedChar}」</span>行</> : '全員'}
                     </span>
                     <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-bold border border-slate-700">
                         {filteredUsers.length}名
                     </span>
                 </div>

                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-20">
                        {filteredUsers.map(u => {
                            const last = u.lastAttendance ? getLocalDateString(u.lastAttendance) : null;
                            const isAttendedToday = today === last;
                            const iconDef = getUserIconDef(u.activeIconId);
                            const avatarChar = getUserAvatarChar(u);
                            
                            // 出席モードの場合のみ、すでに出席済みの人を選択不可にする
                            const isDisabled = mode === 'ATTENDANCE' && isAttendedToday;
                            const isGeneral = u.isGeneral;
                            const isRed = u.faction === 'RED';
                            const hasSystemTitle = u.systemTitle.length > 0;

                            return (
                            <button 
                                key={u.id}
                                onClick={() => !isDisabled && onSelect(u.id)}
                                disabled={isDisabled}
                                className={`relative flex flex-col items-center p-4 rounded-2xl border transition-all text-center group overflow-hidden
                                    ${isDisabled 
                                        ? 'bg-slate-950 border-slate-800 grayscale brightness-75 cursor-default' 
                                        : isFactionWar && isRed 
                                            ? 'bg-red-950/20 border-red-900/50 hover:border-red-500 hover:shadow-xl hover:shadow-red-900/20 hover:-translate-y-1 cursor-pointer'
                                            : isFactionWar && !isRed
                                                ? 'bg-slate-800 border-slate-600 hover:border-slate-400 hover:shadow-xl hover:-translate-y-1 cursor-pointer'
                                                : hasSystemTitle
                                                    ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-yellow-500/50 hover:border-yellow-400 hover:shadow-xl hover:shadow-yellow-500/10'
                                                    : 'bg-slate-800 border-slate-700 hover:border-blue-500 hover:shadow-xl hover:-translate-y-1 cursor-pointer'
                                    }
                                `}
                            >
                                {/* Faction Badge Top Left - ONLY DURING ACTIVE FACTION WAR */}
                                {isFactionWar && (
                                    <div className={`absolute top-0 left-0 px-2 py-1 rounded-br-lg text-[10px] font-black z-10 ${isRed ? 'bg-red-600 text-white' : 'bg-slate-500 text-white'}`}>
                                        {isRed ? '紅' : '白'}
                                    </div>
                                )}

                                {mode === 'ATTENDANCE' && isAttendedToday && (
                                    <div className="absolute top-0 right-0 bg-green-700/90 text-white px-3 py-1 rounded-bl-xl text-[10px] font-bold shadow-sm z-10 border-l border-b border-slate-900">
                                        出席済
                                    </div>
                                )}
                                
                                {u.isNewMember && (
                                     <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                )}
                                
                                {isFactionWar && isGeneral && (
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20">
                                        <Crown size={24} className="text-yellow-400 drop-shadow-md fill-yellow-400" />
                                    </div>
                                )}

                                {hasSystemTitle && !isGeneral && (
                                     <div className="absolute -top-3 -right-3 rotate-12 z-20">
                                        <Crown size={20} className="text-yellow-400 drop-shadow-md fill-yellow-400" />
                                    </div>
                                )}

                                <div className="group-hover:scale-110 transition-transform relative mb-1">
                                    {iconDef.category === 'SHOGI' ? (
                                        <ShogiPiece char={iconDef.char} scale={0.6} />
                                    ) : (
                                        <div className={`w-14 h-14 rounded-full ${u.avatarColor} p-0.5 shadow-md flex items-center justify-center`}>
                                            <div className="w-full h-full rounded-full bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center text-3xl font-black text-white drop-shadow-md font-serif-jp">
                                                {avatarChar}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="w-full mt-2">
                                    <div className={`font-bold text-sm leading-tight w-full truncate flex items-center justify-center gap-1 ${isDisabled ? 'text-slate-500' : hasSystemTitle ? 'text-yellow-200' : 'text-slate-200'}`}>
                                        {u.name}
                                    </div>
                                </div>
                                
                                {/* モード別の追加情報 */}
                                <div className="mt-2 pt-2 border-t border-white/5 w-full">
                                    {mode === 'MATCH_SELECT' ? (
                                        <div className="text-xs font-mono text-blue-400 font-bold bg-blue-900/30 rounded py-0.5 border border-blue-500/20">Rate: {Math.round(u.rate)}</div>
                                    ) : (
                                        <div className={`text-[10px] ${isDisabled ? 'text-slate-600 font-bold' : 'text-slate-500'}`}>
                                             {isDisabled ? '記録完了' : '選択'}
                                        </div>
                                    )}
                                </div>
                            </button>
                            );
                        })}
                        {filteredUsers.length === 0 && (
                            <div className="col-span-full text-center py-12 text-slate-500 flex flex-col items-center justify-center h-full min-h-[200px]">
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

  return createPortal(content, document.body);
};
