
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { Home, Trophy, User as UserIcon, Settings, PlusCircle, BookOpen, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { seedData, loadFromCloud, getUsers } from './storage';

// Pages
import Dashboard from './Dashboard';
import Rankings from './Rankings';
import MatchEntry from './MatchEntry';
import Profile from './Profile';
import Admin from './Admin';
import { Guide } from './Guide';
import { Screensaver } from './Screensaver';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navItems = [
    { path: '/', icon: Home, label: 'ホーム' },
    { path: '/rankings', icon: Trophy, label: 'ランキング' },
    { path: '/match', icon: PlusCircle, label: '対戦記録' },
    { path: '/profile', icon: UserIcon, label: '個人データ' },
    { path: '/guide', icon: BookOpen, label: 'ガイド' },
    { path: '/admin', icon: Settings, label: '管理画面' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans text-slate-200">
      <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 bg-slate-950/80 backdrop-blur-xl border-r border-white/5 z-30">
        <div className="p-8 pb-4">
          <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 italic">RIVALS</h1>
          <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">Shogi Club Manager</p>
        </div>
        <nav className="flex-1 px-4 space-y-3 mt-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-[1.02]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                <item.icon size={22} className={`${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="font-bold tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-6 text-[10px] text-slate-500 text-center border-t border-white/5">
          <div className="font-bold text-slate-400">巣鴨学園 将棋部</div>
          <div className="mt-2 opacity-50">©秀村 紘嗣</div>
        </div>
      </aside>

      <header className="md:hidden fixed top-0 left-0 right-0 bg-slate-950/90 backdrop-blur-md text-white px-6 py-4 flex justify-between items-center z-40 border-b border-white/5 shadow-lg">
        <div className="font-black text-xl italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">RIVALS</div>
      </header>

      <div className="md:hidden fixed bottom-6 left-4 right-4 bg-slate-900/95 backdrop-blur-xl text-white rounded-[2rem] p-2 flex justify-between items-center z-40 shadow-2xl border border-white/10 overflow-x-auto">
        {navItems.map(item => (
          <Link key={item.path} to={item.path} className={`flex-1 flex flex-col items-center justify-center py-2 transition-all min-w-[60px] ${location.pathname === item.path ? 'text-blue-400' : 'text-slate-400'}`}>
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

const App: React.FC = () => {
  const [isIdle, setIsIdle] = useState(false);
  const [initStatus, setInitStatus] = useState<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING');
  const timerRef = useRef<number | null>(null);
  const IDLE_TIMEOUT = 45000;

  const resetTimer = () => {
    setIsIdle(false);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setIsIdle(true), IDLE_TIMEOUT);
  };

  useEffect(() => {
    const initialize = async () => {
      // 1. Try to load from cloud first
      const loaded = await loadFromCloud();
      
      // 2. Check if we have any data (local or cloud)
      const currentUsers = getUsers();
      
      if (currentUsers.length === 0) {
        // 3. If no data anywhere, seed with the 38-member list
        await seedData();
        setInitStatus('SUCCESS');
      } else {
        setInitStatus('SUCCESS');
      }
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
          <h2 className="text-white font-black text-xl tracking-widest uppercase">Fetching Cloud Data</h2>
          <p className="text-slate-500 text-sm mt-2 font-bold animate-pulse">Synchronizing club roster...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      {isIdle && <Screensaver onDismiss={resetTimer} />}
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/match" element={<MatchEntry />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
