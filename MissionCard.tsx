/**
 * MissionCard.tsx — Stage4
 * Profile.tsx 上部に常設表示するミッションカード
 */
import React, { useEffect, useState, useCallback } from 'react';
import { getMissionProgress, MISSIONS_DATA, getDailyKey, getWeeklyKey } from './storage';
import { MissionDef, MissionProgress } from './types';
import { Target, Calendar, RefreshCw, CheckCircle2, Circle } from 'lucide-react';

interface Props {
  userId: string;
}

interface MissionWithProgress extends MissionDef {
  progress: MissionProgress | null;
}

const ProgressBar: React.FC<{ current: number; target: number; completed: boolean }> = ({ current, target, completed }) => {
  const pct = completed ? 100 : Math.min(100, Math.round((current / target) * 100));
  return (
    <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1.5">
      <div
        className={`h-full rounded-full transition-all duration-500 ${completed ? 'bg-emerald-400' : 'bg-indigo-400'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

export const MissionCard: React.FC<Props> = ({ userId }) => {
  const [dailyMissions, setDailyMissions]   = useState<MissionWithProgress[]>([]);
  const [weeklyMissions, setWeeklyMissions] = useState<MissionWithProgress[]>([]);
  const [loading, setLoading]               = useState(true);
  const [tab, setTab]                       = useState<'DAILY' | 'WEEKLY'>('DAILY');

  const load = useCallback(async () => {
    setLoading(true);
    const progList = await getMissionProgress(userId);
    const dailyKey  = getDailyKey();
    const weeklyKey = getWeeklyKey();

    const withProg = (def: MissionDef): MissionWithProgress => {
      const key = def.type === 'DAILY' ? dailyKey : weeklyKey;
      const found = progList.find(p => p.missionId === def.id && p.periodKey === key) ?? null;
      return { ...def, progress: found };
    };

    setDailyMissions(MISSIONS_DATA.filter(d => d.type === 'DAILY').map(withProg));
    setWeeklyMissions(MISSIONS_DATA.filter(d => d.type === 'WEEKLY').map(withProg));
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const missions = tab === 'DAILY' ? dailyMissions : weeklyMissions;
  const completedCount = missions.filter(m => m.progress?.completed).length;

  return (
    <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden mb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-indigo-900/40 to-purple-900/40">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-indigo-400" />
          <span className="font-black text-sm text-white uppercase tracking-wider">Mission Board</span>
          <span className="text-xs font-bold bg-indigo-600/60 px-2 py-0.5 rounded-full text-indigo-200">
            {completedCount}/{missions.length}
          </span>
        </div>
        <button onClick={load} className="text-slate-500 hover:text-white transition-colors">
          <RefreshCw size={13} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {(['DAILY', 'WEEKLY'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
              tab === t ? 'text-white bg-slate-700/50' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t === 'DAILY' ? <><Calendar size={11} />デイリー</> : <><Target size={11} />ウィークリー</>}
          </button>
        ))}
      </div>

      {/* Mission List */}
      <div className="px-3 py-2 space-y-2">
        {loading ? (
          <div className="text-center py-4 text-slate-500 text-xs">読み込み中...</div>
        ) : missions.map(m => {
          const done    = !!m.progress?.completed;
          const current = m.progress?.current ?? 0;
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                done
                  ? 'bg-emerald-900/20 border-emerald-700/40 opacity-80'
                  : 'bg-slate-700/30 border-slate-600/30'
              }`}
            >
              {done
                ? <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                : <Circle      size={16} className="text-slate-600 mt-0.5 shrink-0" />
              }
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-black truncate ${done ? 'text-emerald-300 line-through opacity-70' : 'text-white'}`}>
                    {m.label}
                  </span>
                  <span className={`text-[10px] font-bold shrink-0 ${done ? 'text-emerald-400' : 'text-amber-400'}`}>
                    +{m.rewardPts}pt
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{m.description}</div>
                {!done && m.target > 1 && (
                  <>
                    <ProgressBar current={current} target={m.target} completed={done} />
                    <div className="text-[9px] text-slate-500 text-right mt-0.5">{current}/{m.target}</div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
