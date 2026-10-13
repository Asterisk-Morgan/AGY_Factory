import React from 'react';
import { Direction, ItemType, Machine } from '../types';
import { ITEM_DEFS, MACHINE_METADATA, RECIPES } from '../constants';
import { 
  X, 
  RotateCw, 
  Trash2, 
  Sliders, 
  Zap, 
  Settings2,
  GitBranch,
  Clock,
  Activity
} from 'lucide-react';

interface InspectorPanelProps {
  machine: Machine | null;
  onClose: () => void;
  onUpdateMachine: (updated: Machine) => void;
  onDeleteMachine: (x: number, y: number) => void;
  onRotateMachine: (m: Machine) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  machine,
  onClose,
  onUpdateMachine,
  onDeleteMachine,
  onRotateMachine,
}) => {
  if (!machine) return null;

  const meta = MACHINE_METADATA[machine.type];

  // Raw items for spawner
  const rawItemTypes: ItemType[] = ['iron_ore', 'copper_ore', 'silicon', 'plastic_resin'];

  // Recipes for processor
  const processorRecipes = RECIPES.filter(r => r.machineType === 'processor');
  const assemblerRecipes = RECIPES.filter(r => r.machineType === 'assembler');

  const directions: Direction[] = ['up', 'right', 'down', 'left'];

  const getDirLabel = (d: Direction) => {
    switch (d) {
      case 'up': return '上 (↑)';
      case 'right': return '右 (→)';
      case 'down': return '下 (↓)';
      case 'left': return '左 (←)';
    }
  };

  return (
    <div className="w-80 bg-[#161b26]/95 border-l border-[#263043] flex flex-col h-full z-10 backdrop-blur-sm shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-[#263043] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{meta.icon}</span>
          <div>
            <h2 className="text-sm font-bold text-slate-100 font-display">{meta.name}</h2>
            <p className="text-[11px] text-slate-400 font-mono">
              座標: ({machine.x}, {machine.y})
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Machine Status Badge */}
        <div className="bg-[#1b212f] p-3 rounded-xl border border-[#2a364d]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">動作状態</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  machine.state === 'working'
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                    : machine.state === 'blocked'
                    ? 'bg-red-400 animate-pulse'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-xs font-bold text-slate-200 uppercase">
                {machine.state === 'working'
                  ? '稼働中 (Normal)'
                  : machine.state === 'blocked'
                  ? '詰まり (Blocked)'
                  : '待機 (Idle)'}
              </span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex justify-between border-t border-slate-700/50 pt-2">
            <span>累計処理数:</span>
            <span className="font-mono font-bold text-cyan-300">
              {machine.itemsProcessed} 個
            </span>
          </div>
        </div>

        {/* Direction Setting */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <RotateCw size={13} className="text-cyan-400" />
            搬出方向
          </label>
          <div className="grid grid-cols-2 gap-2">
            {directions.map((d) => (
              <button
                key={d}
                onClick={() => onUpdateMachine({ ...machine, direction: d })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  machine.direction === d
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60'
                    : 'bg-[#1b212f] text-slate-400 border-[#2a364d] hover:bg-[#222a3b]'
                }`}
              >
                {getDirLabel(d)}
              </button>
            ))}
          </div>
        </div>

        {/* Spawner Specific Settings */}
        {machine.type === 'spawner' && (
          <div className="space-y-4 bg-[#141822] p-3 rounded-xl border border-[#232b3d]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
              <Sliders size={14} />
              投入設定
            </div>

            {/* Material select */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400">投入素材</label>
              <div className="space-y-1">
                {rawItemTypes.map((t) => {
                  const def = ITEM_DEFS[t];
                  const active = machine.spawnerItem === t;
                  return (
                    <button
                      key={t}
                      onClick={() => onUpdateMachine({ ...machine, spawnerItem: t })}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs border text-left transition-colors ${
                        active
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                          : 'bg-[#1a202d] text-slate-300 border-[#273244] hover:bg-[#202737]'
                      }`}
                    >
                      <span>{def.iconText}</span>
                      <span>{def.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interval slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>投入間隔:</span>
                <span className="font-mono text-cyan-300">
                  {(((machine.spawnerInterval || 80) / 60)).toFixed(1)} 秒
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="180"
                step="10"
                value={machine.spawnerInterval || 80}
                onChange={(e) =>
                  onUpdateMachine({ ...machine, spawnerInterval: parseInt(e.target.value) })
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Defect rate slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>不良品混入率:</span>
                <span className="font-mono text-red-400">
                  {Math.round((machine.spawnDefectRate || 0) * 100)} %
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={machine.spawnDefectRate || 0}
                onChange={(e) =>
                  onUpdateMachine({ ...machine, spawnDefectRate: parseFloat(e.target.value) })
                }
                className="w-full accent-red-400 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Processor Specific Settings */}
        {machine.type === 'processor' && (
          <div className="space-y-3 bg-[#141822] p-3 rounded-xl border border-[#232b3d]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Zap size={14} />
              加工レシピ
            </div>
            <div className="space-y-1.5">
              {processorRecipes.map((r) => {
                const active = machine.processorRecipe === r.id;
                const outDef = ITEM_DEFS[r.output];
                return (
                  <button
                    key={r.id}
                    onClick={() => onUpdateMachine({ ...machine, processorRecipe: r.id })}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs border text-left transition-colors ${
                      active
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                        : 'bg-[#1a202d] text-slate-300 border-[#273244] hover:bg-[#202737]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{outDef.iconText}</span>
                      <span>{r.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {((r.duration / 60)).toFixed(1)}s
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Assembler Specific Settings */}
        {machine.type === 'assembler' && (
          <div className="space-y-3 bg-[#141822] p-3 rounded-xl border border-[#232b3d]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
              <Settings2 size={14} />
              組立レシピ
            </div>
            <div className="space-y-1.5">
              {assemblerRecipes.map((r) => {
                const active = machine.processorRecipe === r.id;
                const outDef = ITEM_DEFS[r.output];
                return (
                  <button
                    key={r.id}
                    onClick={() => onUpdateMachine({ ...machine, processorRecipe: r.id })}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs border text-left transition-colors ${
                      active
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 font-bold'
                        : 'bg-[#1a202d] text-slate-300 border-[#273244] hover:bg-[#202737]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{outDef.iconText}</span>
                      <span>{r.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ¥{outDef.value}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sorter Specific Settings */}
        {machine.type === 'sorter' && (
          <div className="space-y-4 bg-[#141822] p-3 rounded-xl border border-[#232b3d]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
              <GitBranch size={14} />
              PLC 分岐仕分けルール
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400">振り分け条件:</label>
              <select
                value={machine.sorterRule?.targetItem || 'defective'}
                onChange={(e) =>
                  onUpdateMachine({
                    ...machine,
                    sorterRule: {
                      divertDirection: machine.sorterRule?.divertDirection || 'down',
                      targetItem: e.target.value as any,
                    },
                  })
                }
                className="w-full bg-[#1b212f] border border-[#2a364d] text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-rose-500"
              >
                <option value="defective">🚨 不良品（Defective）のみ分岐</option>
                <option value="all">🔁 全てのアイテムを分岐</option>
                <option value="iron_plate">鉄板のみ分岐</option>
                <option value="copper_wire">銅線のみ分岐</option>
                <option value="ic_chip">ICチップのみ分岐</option>
                <option value="smart_sensor">スマートセンサーのみ分岐</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400">条件合致時の分岐先方向:</label>
              <div className="grid grid-cols-2 gap-2">
                {directions.map((d) => (
                  <button
                    key={d}
                    onClick={() =>
                      onUpdateMachine({
                        ...machine,
                        sorterRule: {
                          targetItem: machine.sorterRule?.targetItem || 'defective',
                          divertDirection: d,
                        },
                      })
                    }
                    className={`px-2 py-1 rounded text-xs border ${
                      machine.sorterRule?.divertDirection === d
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 font-bold'
                        : 'bg-[#1b212f] text-slate-400 border-[#2a364d]'
                    }`}
                  >
                    {getDirLabel(d)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[#263043] flex items-center gap-2">
        <button
          onClick={() => onRotateMachine(machine)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1f283a] hover:bg-[#27334a] text-slate-200 text-xs font-semibold rounded-lg border border-[#2f3d54] transition-colors"
        >
          <RotateCw size={14} />
          回転 [R]
        </button>

        <button
          onClick={() => onDeleteMachine(machine.x, machine.y)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold rounded-lg border border-red-500/40 transition-colors"
        >
          <Trash2 size={14} />
          撤去
        </button>
      </div>
    </div>
  );
};
