
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { User, EventType } from './types';
import { Search, X, Filter, CheckCircle, User as UserIcon, Users, RefreshCw, Crown, ChevronDown } from 'lucide-react';
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

/** selectedChar からその行の有効文字一覧を返す（例: 'た' → 'た・ち・つ・て・と'） */
const getRowLabel = (char: string): string => {
  const row = GOJUUON.find(r => r.includes(char));
  if (!row) return char;
  return row.filter(c => c !== '').join('・');
};

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
    users, onSelect, onClose, excludeIds = [], mode = 'SIMPLE', title = '班員を選択'
}) => {
  const [selectedChar, setSelectedChar] = useState<string | null>(null);
  const [kanaOpen, setKanaOpen] = useState(false); // スマホでは折りたたみ

  const settings = getSettings();
  const activeEvent = isEventActive();
  const isFactionWar = activeEvent && settings.eventType === EventType.FACTION_WAR;

  const filteredUsers = users.filter(u => {
    if (excludeIds.includes(u.id)) return false;
    if (selectedChar) return matchesKana(u.reading, selectedChar);
    return true;
  });

  filteredUsers.sort((a, b) => {
    // memberOrder が設定されていれば優先
    const order = settings.memberOrder ?? [];
    const ai = order.indexOf(a.id); const bi = order.indexOf(b.id);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1; if (bi !== -1) return 1;
    if (a.reading && b.reading) return a.reading.localeCompare(b.reading);
    return a.name.localeCompare(b.name);
  });

  const today = getLocalDateString();

  const content = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 md:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[92vh] max-h-[800px] border border-white/10 relative z-[51]">
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
            <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors active:scale-95">
              <X size={24} />
            </button>
          )}
        </div>

        {/* スマホ用：五十音トグルバー */}
        <div className="md:hidden border-b border-slate-700 bg-slate-800">
          <button
            onClick={() => setKanaOpen(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-black text-slate-300"
          >
            <span className="flex items-center gap-2">
              <Filter size={14} />
              {selectedChar ? `頭文字[${selectedChar}]でフィルター中` : '頭文字で絞り込む（任意）'}
            </span>
            <div className="flex items-center gap-2">
              {selectedChar && (
                <button onClick={e => { e.stopPropagation(); setSelectedChar(null); }}
                  className="text-[10px] bg-slate-700 px-2 py-0.5 rounded-full text-slate-400">解除</button>
              )}
              <ChevronDown size={16} className={`transition-transform ${kanaOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>
          {kanaOpen && (
            <div className="px-3 pb-3 grid grid-cols-10 gap-1">
              {GOJUUON.map((row, ri) =>
                row.map((char, ci) => {
                  if (!char) return <div key={`${ri}-${ci}`} />;
                  const hasUsers = users.some(u => !excludeIds.includes(u.id) && matchesKana(u.reading, char));
                  const isSel = selectedChar === char;
                  return (
                    <button key={char} onClick={() => { setSelectedChar(isSel ? null : char); setKanaOpen(false); }}
                      disabled={!hasUsers}
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm font-bold transition-all
                        ${isSel ? 'bg-blue-600 text-white' : hasUsers ? 'bg-slate-700 text-slate-200 active:bg-slate-600' : 'bg-slate-800/50 text-slate-700 opacity-40'}`}>
                      {char}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          {/* PCのみ左サイドに五十音キーボード */}
          <div className="hidden md:flex w-[40%] bg-slate-800 border-r border-slate-700 flex-col">
            <div className="p-3 border-b border-slate-700 flex items-center justify-between shrink-0">
              <span className="font-bold text-slate-300 text-sm">{selectedChar ? `頭文字[${selectedChar}]で絞り込み中` : 'フィルタなし'}</span>
              {selectedChar && (
                <button onClick={() => setSelectedChar(null)} className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-full font-bold flex items-center gap-1">
                  <RefreshCw size={12} /> 解除
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 bg-slate-900">
              <div className="flex flex-col gap-2 select-none pb-4">
                <button onClick={() => setSelectedChar(null)}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all border flex items-center justify-center gap-2 ${!selectedChar ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>
                  <Filter size={14} /> 全員表示
                </button>
                {GOJUUON.map((row, ri) => (
                  <div key={ri} className="flex gap-2 justify-between">
                    {row.map((char, ci) => {
                      if (!char) return <div key={ci} className="flex-1" />;
                      const isSel = selectedChar === char;
                      const hasUsers = users.some(u => !excludeIds.includes(u.id) && matchesKana(u.reading, char));
                      return (
                        <button key={char} onClick={() => { if (!hasUsers && !isSel) return; setSelectedChar(isSel ? null : char); }}
                          disabled={!hasUsers}
                          className={`flex-1 aspect-[1.3] flex items-center justify-center rounded-xl font-bold text-xl transition-all border shadow-sm
                            ${isSel ? 'bg-blue-600 text-white border-blue-600 scale-105' : hasUsers ? 'bg-slate-800 text-slate-200 border-slate-700 hover:border-blue-500 hover:text-blue-400' : 'bg-slate-900/50 text-slate-700 border-slate-800 opacity-50 cursor-default'}`}>
                          {char}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ユーザーリスト */}
          <div className="flex-1 bg-slate-900/50 flex flex-col overflow-hidden">
            <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between shrink-0 text-sm sticky top-0 z-10">
              <span className="font-bold text-slate-400">
                {selectedChar ? <span className="text-blue-400">頭文字[{selectedChar}]</span> : '全員'}
              </span>
              <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-bold border border-slate-700">{filteredUsers.length}名</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-2 pb-4">
                {filteredUsers.map(u => {
                  const last = u.lastAttendance ? getLocalDateString(u.lastAttendance) : null;
                  const isAttendedToday = today === last;
                  const iconDef = getUserIconDef(u.activeIconId);
                  const avatarChar = getUserAvatarChar(u);
                  const isDisabled = mode === 'ATTENDANCE' && isAttendedToday;
                  const isRed = u.faction === 'RED';
                  const hasSystemTitle = u.systemTitle.length > 0;
                  return (
                    <button key={u.id} onClick={() => !isDisabled && onSelect(u.id)} disabled={isDisabled}
                      className={`relative flex flex-col items-center p-3 rounded-2xl border transition-all text-center group overflow-hidden
                        ${isDisabled ? 'bg-slate-950 border-slate-800 grayscale brightness-75 cursor-default' :
                          isFactionWar && isRed ? 'bg-red-950/20 border-red-900/50 hover:border-red-500 cursor-pointer' :
                          isFactionWar ? 'bg-slate-800 border-slate-600 hover:border-slate-400 cursor-pointer' :
                          hasSystemTitle ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-yellow-500/50 hover:border-yellow-400' :
                          'bg-slate-800 border-slate-700 hover:border-blue-500 cursor-pointer'}`}
                    >
                      {isFactionWar && (
                        <div className={`absolute top-0 left-0 px-1.5 py-0.5 rounded-br-lg text-[9px] font-black z-10 ${isRed ? 'bg-red-600 text-white' : 'bg-slate-500 text-white'}`}>{isRed ? '紅' : '白'}</div>
                      )}
                      {mode === 'ATTENDANCE' && isAttendedToday && (
                        <div className="absolute top-0 right-0 bg-green-700/90 text-white px-2 py-0.5 rounded-bl-xl text-[9px] font-bold z-10">出席済</div>
                      )}
                      {u.isNewMember && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-400 rounded-full animate-pulse z-10" />}
                      {isFactionWar && u.isGeneral && (
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20"><Crown size={20} className="text-yellow-400 fill-yellow-400" /></div>
                      )}
                      <div className="group-hover:scale-110 transition-transform mb-1">
                        {iconDef.category === 'SHOGI' ? <ShogiPiece char={iconDef.char} scale={0.5} /> : (
                          <div className={`w-12 h-12 rounded-full ${u.avatarColor} p-0.5 shadow-md flex items-center justify-center`}>
                            <div className="w-full h-full rounded-full bg-slate-900/50 flex items-center justify-center text-2xl font-black text-white font-serif-jp">{avatarChar}</div>
                          </div>
                        )}
                      </div>
                      <div className={`font-bold text-xs leading-tight w-full truncate ${isDisabled ? 'text-slate-500' : hasSystemTitle ? 'text-yellow-200' : 'text-slate-200'}`}>{u.name}</div>
                      <div className="mt-1 w-full">
                        {mode === 'MATCH_SELECT' ? (
                          <div className="text-[10px] font-mono text-blue-400 font-bold bg-blue-900/30 rounded py-0.5 border border-blue-500/20">Rate {Math.round(u.rate)}</div>
                        ) : (
                          <div className={`text-[9px] ${isDisabled ? 'text-slate-600' : 'text-slate-500'}`}>{isDisabled ? '記録完了' : '選択'}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <div className="col-span-full text-center py-12 text-slate-500 flex flex-col items-center">
                    <Search size={40} className="opacity-20 mb-3" />
                    <p className="font-bold text-sm">該当する班員が見つかりません</p>
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

