import React from 'react';
import { FactoryStats } from '../types';
import { SimulationEngine } from '../engine/simulation';
import { MACHINE_METADATA } from '../constants';
import { 
  X, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Coins, 
  TrendingUp, 
  Gauge,
  Factory
} from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: FactoryStats;
  engine: SimulationEngine;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  engine,
}) => {
  if (!isOpen) return null;

  const machines = Array.from(engine.machines.values());
  const totalMachines = machines.length;

  const workingCount = machines.filter(m => m.state === 'working').length;
  const blockedCount = machines.filter(m => m.state === 'blocked').length;
  const idleCount = machines.filter(m => m.state === 'idle').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#141824] border border-[#263147] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#263147] flex items-center justify-between bg-[#192030]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Activity size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-display">
                SCADA 工場稼働・ボトルネック診断
              </h2>
              <p className="text-xs text-slate-400">
                リアルタイム自動化パフォーマンス分析 & 設備稼働率
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Efficiency Score */}
            <div className="bg-[#1a2130] p-4 rounded-xl border border-[#2b374e]">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>総合生産効率</span>
                <Gauge size={16} className="text-cyan-400" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-cyan-300">
                {stats.efficiencyScore}%
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-cyan-400 h-full transition-all"
                  style={{ width: `${stats.efficiencyScore}%` }}
                />
              </div>
            </div>

            {/* Throughput */}
            <div className="bg-[#1a2130] p-4 rounded-xl border border-[#2b374e]">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>スループット (ppm)</span>
                <TrendingUp size={16} className="text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-emerald-400">
                {stats.throughputPerMinute}
                <span className="text-xs font-normal text-slate-400 ml-1">個/分</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">過去60秒間の出荷量</p>
            </div>

            {/* Total Shipped */}
            <div className="bg-[#1a2130] p-4 rounded-xl border border-[#2b374e]">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>良品累計出荷</span>
                <CheckCircle2 size={16} className="text-blue-400" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-blue-300">
                {stats.totalShipped}
                <span className="text-xs font-normal text-slate-400 ml-1">個</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                総獲得資金: ¥{stats.cash.toLocaleString()}
              </p>
            </div>

            {/* Defects Shipped */}
            <div className="bg-[#1a2130] p-4 rounded-xl border border-[#2b374e]">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>欠陥品流出</span>
                <AlertTriangle size={16} className="text-red-400" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-red-400">
                {stats.totalDefectsShipped}
                <span className="text-xs font-normal text-slate-400 ml-1">件</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                廃棄破砕: {stats.totalDiscarded} 個
              </p>
            </div>
          </div>

          {/* Machine Fleet Status Breakdown */}
          <div className="bg-[#181e2b] p-4 rounded-xl border border-[#273245]">
            <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Factory size={16} className="text-cyan-400" />
              設備稼働ステータス概要 (合計 {totalMachines} 基)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#1e2535] p-3 rounded-lg border border-emerald-500/20 text-center">
                <span className="text-xs text-emerald-400 font-semibold">稼働中 (Working)</span>
                <p className="text-xl font-bold font-mono text-emerald-300 mt-1">
                  {workingCount}
                </p>
              </div>
              <div className="bg-[#1e2535] p-3 rounded-lg border border-amber-500/20 text-center">
                <span className="text-xs text-amber-400 font-semibold">待機中 (Idle)</span>
                <p className="text-xl font-bold font-mono text-amber-300 mt-1">
                  {idleCount}
                </p>
              </div>
              <div className="bg-[#1e2535] p-3 rounded-lg border border-red-500/20 text-center">
                <span className="text-xs text-red-400 font-semibold">詰まり・停止 (Blocked)</span>
                <p className="text-xl font-bold font-mono text-red-300 mt-1">
                  {blockedCount}
                </p>
              </div>
            </div>
          </div>

          {/* Bottleneck Diagnostics */}
          <div className="bg-[#181e2b] p-4 rounded-xl border border-[#273245]">
            <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" />
              自動ボトルネック診断 & 改善提案
            </h3>

            {stats.bottleneckMachines.length === 0 ? (
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <span>
                  お見事！現在ボトルネック（ライン詰まり）は検出されていません。スムーズに自動搬送されています。
                </span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.bottleneckMachines.map((bn, idx) => {
                  const m = engine.getMachine(bn.x, bn.y);
                  const meta = m ? MACHINE_METADATA[m.type] : null;
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-red-950/25 border border-red-500/30 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{meta?.icon || '⚙️'}</span>
                        <div>
                          <p className="font-bold text-red-200">
                            {meta?.name || '設備'} (座標: {bn.x}, {bn.y})
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{bn.reason}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                        ライン停滞中
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#263147] bg-[#192030] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
