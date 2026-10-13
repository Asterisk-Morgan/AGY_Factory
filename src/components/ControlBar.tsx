import React from 'react';
import { 
  Play, 
  Pause, 
  FastForward, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  BarChart3, 
  FolderKanban,
  Coins,
  Activity,
  AlertTriangle,
  Award
} from 'lucide-react';
import { FactoryStats, Scenario } from '../types';
import { ITEM_DEFS } from '../constants';

interface ControlBarProps {
  isRunning: boolean;
  onTogglePlay: () => void;
  speed: number;
  onChangeSpeed: (spd: number) => void;
  onReset: () => void;
  stats: FactoryStats;
  scenario: Scenario | null;
  onOpenScenarios: () => void;
  onOpenStats: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isRunning,
  onTogglePlay,
  speed,
  onChangeSpeed,
  onReset,
  stats,
  scenario,
  onOpenScenarios,
  onOpenStats,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="h-16 bg-[#161b26]/95 border-b border-[#263043] px-4 flex items-center justify-between z-20 backdrop-blur-sm shadow-md select-none">
      {/* Brand & Scenario */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 font-black text-lg">
            🏭
          </div>
          <div>
            <h1 className="text-base font-bold tracking-wider text-slate-100 font-display flex items-center gap-2">
              AGY FACTORY STUDIO
              <span className="text-[10px] font-sans px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">
                v1.0
              </span>
            </h1>
            <button
              onClick={onOpenScenarios}
              className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors text-left"
            >
              <FolderKanban size={12} className="text-cyan-400" />
              <span className="truncate max-w-[200px]">
                {scenario ? scenario.title : 'シナリオを選択'}
              </span>
            </button>
          </div>
        </div>

        {/* Scenario Goals Progress Badge */}
        {scenario && scenario.goals.length > 0 && (
          <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-slate-700/60">
            {scenario.goals.map((g, idx) => {
              const def = ITEM_DEFS[g.targetItem];
              const pct = Math.min(100, Math.round((g.currentCount / g.requiredCount) * 100));
              const isDone = g.currentCount >= g.requiredCount;
              return (
                <div key={idx} className="flex items-center gap-2 bg-[#1b212f] px-2.5 py-1 rounded-lg border border-[#2a364d]">
                  <span className="text-sm">{def?.iconText}</span>
                  <div className="text-left">
                    <div className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="text-slate-300 font-medium">{def?.name}</span>
                      <span className={`font-mono font-bold ${isDone ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {g.currentCount}/{g.requiredCount}
                      </span>
                    </div>
                    <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isDone ? 'bg-emerald-500' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  {isDone && <Award size={14} className="text-amber-400 ml-0.5 shrink-0" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Simulation Controls (Play, Pause, Speed, Reset) */}
      <div className="flex items-center gap-2 bg-[#10141d] p-1 rounded-xl border border-[#242d3e]">
        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            isRunning
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20 hover:bg-emerald-400'
          }`}
        >
          {isRunning ? (
            <>
              <Pause size={14} /> 一時停止
            </>
          ) : (
            <>
              <Play size={14} fill="currentColor" /> 開始
            </>
          )}
        </button>

        {/* Speed selectors */}
        <div className="flex items-center bg-[#181e2b] rounded-lg p-0.5 border border-[#283244]">
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              onClick={() => onChangeSpeed(spd)}
              className={`px-2 py-1 text-xs font-mono font-bold rounded transition-all ${
                speed === spd
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        <button
          onClick={onReset}
          title="リセット"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#202838] rounded-lg transition-colors"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Metrics & Dashboard Buttons */}
      <div className="flex items-center gap-3">
        {/* Cash Funds */}
        <div className="flex items-center gap-1.5 bg-[#1b212f] px-3 py-1.5 rounded-lg border border-[#2a364d]">
          <Coins size={15} className="text-amber-400" />
          <span className="text-xs text-slate-400">資金:</span>
          <span className="font-mono text-sm font-bold text-amber-300">
            ¥{stats.cash.toLocaleString()}
          </span>
        </div>

        {/* Throughput */}
        <div className="hidden sm:flex items-center gap-1.5 bg-[#1b212f] px-3 py-1.5 rounded-lg border border-[#2a364d]">
          <Activity size={15} className="text-cyan-400" />
          <span className="text-xs text-slate-400">出荷:</span>
          <span className="font-mono text-xs font-bold text-cyan-300">
            {stats.throughputPerMinute} /分
          </span>
        </div>

        {/* Defects Warning */}
        {stats.totalDefectsShipped > 0 && (
          <div className="hidden md:flex items-center gap-1.5 bg-red-950/40 px-2.5 py-1.5 rounded-lg border border-red-500/40 text-red-300">
            <AlertTriangle size={14} className="text-red-400" />
            <span className="text-xs font-mono font-bold">
              欠陥出荷: {stats.totalDefectsShipped}
            </span>
          </div>
        )}

        {/* SCADA Analytics Modal Button */}
        <button
          onClick={onOpenStats}
          className="flex items-center gap-1.5 bg-[#1f283a] hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 px-3 py-1.5 rounded-lg border border-[#2f3d54] text-xs font-medium transition-all"
        >
          <BarChart3 size={15} />
          SCADA分析
        </button>

        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'サウンドミュート' : 'サウンド有効'}
          className={`p-2 rounded-lg border transition-colors ${
            soundEnabled
              ? 'bg-[#1b212f] text-cyan-400 border-[#2a364d] hover:bg-[#232c3f]'
              : 'bg-[#1b212f] text-slate-500 border-[#2a364d] hover:bg-[#232c3f]'
          }`}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>
    </header>
  );
};
