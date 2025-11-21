import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { Home, Trophy, User as UserIcon, Settings, PlusCircle, Menu } from 'lucide-react';
import { seedData } from './services/storage';

// Pages
import Dashboard from './pages/Dashboard';
import Rankings from './pages/Rankings';
import MatchEntry from './pages/MatchEntry';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import { Screensaver } from './components/Screensaver';

// Layout Component
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'ホーム' },
    { path: '/rankings', icon: Trophy, label: 'ランキング' },
    { path: '/match', icon: PlusCircle, label: '対戦記録' },
    { path: '/profile', icon: UserIcon, label: '個人データ' },
    { path: '/admin', icon: Settings, label: '管理画面' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      {/* Sidebar for Tablet/Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shadow-xl z-20">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
            巣鴨学園将棋班 対局出席促進アプリ
          </h1>
          <p className="text-xs text-slate-400 mt-1">Point & Rate Manager</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 text-[10px] text-slate-500 text-center border-t border-slate-800">
          <div>巣鴨学園将棋班 対局出席促進アプリ</div>
          <div>©秀村 紘嗣</div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-20 shadow-md">
        <div className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
          将棋班 Rivals
        </div>
        <div className="flex gap-4">
            {navItems.map(item => (
                 <Link key={item.path} to={item.path} className={`${location.pathname === item.path ? 'text-blue-400' : 'text-slate-400'}`}>
                     <item.icon size={24} />
                 </Link>
            ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto h-full">
            {children}
          </div>
        </div>
        {/* Footer for Mobile */}
        <div className="md:hidden p-2 text-center text-[10px] text-slate-400 bg-slate-100 border-t border-slate-200">
            巣鴨学園将棋班 対局出席促進アプリ ©秀村 紘嗣
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<number | null>(null);
  const IDLE_TIMEOUT = 30000; // 30 seconds

  const resetTimer = () => {
    setIsIdle(false);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setIsIdle(true);
    }, IDLE_TIMEOUT);
  };

  useEffect(() => {
    seedData();
    resetTimer();

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();

    events.forEach(event => window.addEventListener(event, handleActivity));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, []);

  return (
    <HashRouter>
      {isIdle && <Screensaver onDismiss={() => resetTimer()} />}
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/match" element={<MatchEntry />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
