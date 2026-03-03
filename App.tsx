import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { Home, Trophy, User as UserIcon, Settings, PlusCircle, BookOpen, Cloud, CloudOff, RefreshCw, Loader, AlertCircle } from 'lucide-react';
import { seedData, loadFromCloud, getUsers, getSyncStatus, manualSync } from './storage';
import type { LoadResult } from './storage';
import { SyncMeta } from './types';

import Dashboard  from './Dashboard';
import Rankings   from './Rankings';
import MatchEntry from './MatchEntry';
import Profile    from './Profile';
import Admin      from './Admin';
import { Guide }  from './Guide';
import { Screensaver } from './Screensaver';

// ─── Sync indicator (sidebar bottom) ────────────────────────
const SyncIndicator: React.FC = () => {
  const [meta, setMeta] = useState<SyncMeta>(getSyncStatus());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      setMeta((e as CustomEvent<SyncMeta>).detail);
    };
    window.addEventListener('rivals-sync-changed', handler);
    // Refresh every 30s regardless
    const iv = setInterval(() => setMeta(getSyncStatus()), 30000);
    return () => { window.removeEventListener('rivals-sync-changed', handler); clearInterval(iv); };
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    await manualSync();
    setMeta(getSyncStatus());
    setSyncing(false);
  };

  const fmt = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  const { status, lastSync, pendingChanges } = meta;

  return (
    <div className="px-4 pb-4">
      <div
        className={`rounded-2xl p-3 border text-[10px] font-bold ${
          status === 'SYNCED'  ? 'bg-green-900/20 border-green-700/40 text-green-400' :
          status === 'PENDING' ? 'bg-yellow-900/20 border-yellow-700/40 text-yellow-400' :
          status === 'SYNCING' ? 'bg-blue-900/20 border-blue-700/40 text-blue-400' :
          status === 'ERROR'   ? 'bg-red-900/20 border-red-700/40 text-red-400' :
          'bg-slate-800/40 border-slate-700/40 text-slate-500'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            {status === 'SYNCED'  && <Cloud size={12} />}
            {status === 'PENDING' && <CloudOff size={12} />}
            {status === 'SYNCING' && <Loader size={12} className="animate-spin" />}
            {status === 'ERROR'   && <AlertCircle size={12} />}
            {status === 'NEVER'   && <CloudOff size={12} />}
            <span className="uppercase tracking-widest">
              {status === 'SYNCED'  ? 'Synced' :
               status === 'PENDING' ? `未保存 (${pendingChanges})` :
               status === 'SYNCING' ? 'Syncing...' :
               status === 'ERROR'   ? 'Sync Error' : 'Not Synced'}
            </span>
          </div>
          <button
            onClick={handleManualSync}
            disabled={syncing || status === 'SYNCING'}
            className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-40 transition-colors"
            title="今すぐ同期"
          >
            <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
          </button>
        </div>
        <div className="text-slate-500 font-normal">
          最終同期: {fmt(lastSync)}
        </div>
        {status === 'ERROR' && (
          <div className="mt-1 text-red-400">
            ⚠ クラウド保存に失敗。ローカルには保存済みです。
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Layout ─────────────────────────────────────────────────
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navItems = [
    { path: '/',         icon: Home,       label: 'ホーム' },
    { path: '/rankings', icon: Trophy,     label: 'ランキング' },
    { path: '/match',    icon: PlusCircle, label: '対戦記録' },
    { path: '/profile',  icon: UserIcon,   label: '個人データ' },
    { path: '/guide',    icon: BookOpen,   label: 'ガイド' },
    { path: '/admin',    icon: Settings,   label: '管理画面' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans text-slate-200">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 bg-slate-950/80 backdrop-blur-xl border-r border-white/5 z-30">
        <div className="p-8 pb-4">
          <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 italic">RIVALS</h1>
          <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">Shogi Club Manager</p>
        </div>
        <nav className="flex-1 px-4 space-y-3 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden
                  ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-[1.02]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <item.icon size={22} className={isActive ? 'scale-110' : 'group-hover:scale-110'} />
                <span className="font-bold tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <SyncIndicator />
        <div className="px-6 pb-6 text-[10px] text-slate-500 text-center border-t border-white/5 pt-4">
          <div className="font-bold text-slate-400">巣鴨学園 将棋部</div>
          <div className="mt-1 opacity-50">©秀村 紘嗣</div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-slate-950/90 backdrop-blur-md text-white px-6 py-4 flex justify-between items-center z-40 border-b border-white/5 shadow-lg">
        <div className="font-black text-xl italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">RIVALS</div>
        <SyncDot />
      </header>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 bg-slate-900/95 backdrop-blur-xl text-white rounded-[2rem] p-2 flex justify-between items-center z-40 shadow-2xl border border-white/10 overflow-x-auto">
        {navItems.map(item => (
          <Link key={item.path} to={item.path}
            className={`flex-1 flex flex-col items-center justify-center py-2 transition-all min-w-[60px]
              ${location.pathname === item.path ? 'text-blue-400' : 'text-slate-400'}`}>
            <item.icon size={24} />
          </Link>
        ))}
      </div>

      <main className="flex-1 flex flex-col relative overflow-hidden pt-[70px] md:pt-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-10 scrollbar-hide">
          <div className="max-w-6xl mx-auto h-full pb-24 md:pb-0">{children}</div>
        </div>
      </main>
    </div>
  );
};

/** Tiny dot for mobile header */
const SyncDot: React.FC = () => {
  const [status, setStatus] = useState(getSyncStatus().status);
  useEffect(() => {
    const h = (e: Event) => setStatus((e as CustomEvent<SyncMeta>).detail.status);
    window.addEventListener('rivals-sync-changed', h);
    return () => window.removeEventListener('rivals-sync-changed', h);
  }, []);
  const color =
    status === 'SYNCED'  ? 'bg-green-400' :
    status === 'PENDING' ? 'bg-yellow-400 animate-pulse' :
    status === 'SYNCING' ? 'bg-blue-400 animate-pulse' :
    status === 'ERROR'   ? 'bg-red-400 animate-pulse' : 'bg-slate-500';
  return <div className={`w-2 h-2 rounded-full ${color}`} title={`Sync: ${status}`} />;
};

// ─── App ─────────────────────────────────────────────────────
type InitStatus = 'LOADING' | 'SUCCESS' | 'ERROR';

const App: React.FC = () => {
  const [isIdle, setIsIdle] = useState(false);
  const [initStatus, setInitStatus] = useState<InitStatus>('LOADING');
  const [initMessage, setInitMessage] = useState('クラウドデータを取得中...');
  const timerRef = useRef<number | null>(null);
  const IDLE_TIMEOUT = 45000;

  const resetTimer = () => {
    setIsIdle(false);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setIsIdle(true), IDLE_TIMEOUT);
  };

  useEffect(() => {
    const initialize = async () => {
      setInitMessage('クラウドデータを取得中...');
      const result: LoadResult = await loadFromCloud();

      if (result === 'CLOUD_LOADED') {
        setInitMessage('クラウドから最新データを取得しました');
      } else if (result === 'LOCAL_NEWER') {
        setInitMessage('ローカルデータをクラウドに同期しました');
      } else if (result === 'EMPTY') {
        setInitMessage('初回セットアップ中...');
        await seedData();
      } else {
        // FAILED → use local data (no overwrite happened)
        const hasLocal = getUsers().length > 0;
        if (!hasLocal) {
          setInitMessage('初回セットアップ中...');
          await seedData();
        } else {
          setInitMessage('オフライン：ローカルデータで起動します');
        }
      }
      setInitStatus('SUCCESS');
    };

    initialize();
    resetTimer();

    const events = ['mousedown', 'mousemove', 'keypress', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, []);

  if (initStatus === 'LOADING') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <Cloud size={64} className="text-blue-500 animate-pulse" />
          <RefreshCw size={24} className="absolute -bottom-2 -right-2 text-white animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="text-white font-black text-xl tracking-widest uppercase">CLUB RIVALS</h2>
          <p className="text-slate-500 text-sm mt-2 font-bold animate-pulse">{initMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      {isIdle && <Screensaver onDismiss={resetTimer} />}
      <Layout>
        <Routes>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/match"    element={<MatchEntry />} />
          <Route path="/profile"  element={<Profile />} />
          <Route path="/guide"    element={<Guide />} />
          <Route path="/admin"    element={<Admin />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
