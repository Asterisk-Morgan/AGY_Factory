import React from 'react';
import { Direction, MachineType } from '../types';
import { MACHINE_METADATA } from '../constants';
import { 
  RotateCw, 
  Trash2, 
  MousePointer, 
  Layers,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

interface ToolbarProps {
  selectedTool: MachineType | 'select' | 'delete';
  onSelectTool: (tool: MachineType | 'select' | 'delete') => void;
  direction: Direction;
  onRotate: () => void;
  unlockedMachines?: MachineType[];
}

export const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  onSelectTool,
  direction,
  onRotate,
  unlockedMachines,
}) => {
  const machineList: MachineType[] = [
    'conveyor',
    'spawner',
    'processor',
    'assembler',
    'inspector',
    'sorter',
    'agv_station',
    'exporter',
    'trash',
  ];

  const getDirectionArrow = (dir: Direction) => {
    switch (dir) {
      case 'up': return '⬆️ 上';
      case 'right': return '➡️ 右';
      case 'down': return '⬇️ 下';
      case 'left': return '⬅️ 左';
    }
  };

  return (
    <aside className="w-72 bg-[#161b26]/95 border-r border-[#263043] flex flex-col h-full z-10 backdrop-blur-sm shadow-xl">
      {/* Title */}
      <div className="p-4 border-b border-[#263043] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Layers size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide text-slate-100 font-display">設備パレット</h2>
            <p className="text-[11px] text-slate-400">クリックして配置 / ドラッグ敷設</p>
          </div>
        </div>
      </div>

      {/* Basic Tools (Select & Delete) */}
      <div className="p-3 border-b border-[#263043] grid grid-cols-2 gap-2">
        <button
          onClick={() => onSelectTool('select')}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            selectedTool === 'select'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
              : 'bg-[#1e2535] text-slate-300 hover:bg-[#252f44] border border-transparent'
          }`}
        >
          <MousePointer size={14} />
          選択
        </button>

        <button
          onClick={() => onSelectTool('delete')}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            selectedTool === 'delete'
              ? 'bg-red-500/20 text-red-300 border border-red-500/50 shadow-sm'
              : 'bg-[#1e2535] text-slate-300 hover:bg-red-950/40 hover:text-red-400 border border-transparent'
          }`}
        >
          <Trash2 size={14} />
          撤去
        </button>
      </div>

      {/* Rotation Control */}
      <div className="px-4 py-2.5 bg-[#121620] border-b border-[#263043] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          <span className="text-slate-400">向き:</span>
          <span className="font-semibold text-cyan-400">{getDirectionArrow(direction)}</span>
        </div>
        <button
          onClick={onRotate}
          title="向きを変更 (ショートカット: Rキー)"
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-[#20293d] hover:bg-cyan-500/20 text-slate-200 hover:text-cyan-300 transition-colors border border-slate-700/50"
        >
          <RotateCw size={13} />
          回転 [R]
        </button>
      </div>

      {/* Machines List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {machineList.map((mType) => {
          const meta = MACHINE_METADATA[mType];
          const isSelected = selectedTool === mType;
          const isUnlocked = !unlockedMachines || unlockedMachines.includes(mType);

          if (!isUnlocked) {
            return (
              <div
                key={mType}
                className="opacity-40 p-2.5 rounded-lg border border-dashed border-slate-700 bg-slate-900/50 flex items-center justify-between cursor-not-allowed"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{meta.icon}</span>
                  <div className="text-left">
                    <p className="text-xs font-medium text-slate-400">{meta.name}</p>
                    <p className="text-[10px] text-slate-600">このシナリオでは未解放</p>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <button
              key={mType}
              onClick={() => onSelectTool(mType)}
              className={`w-full p-2.5 rounded-lg border transition-all text-left flex items-start gap-2.5 group relative ${
                isSelected
                  ? 'bg-cyan-500/10 border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30'
                  : 'bg-[#1b2232] border-[#29354a] hover:border-slate-500 hover:bg-[#20293d]'
              }`}
            >
              <div className="text-2xl mt-0.5">{meta.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 truncate group-hover:text-cyan-300">
                    {meta.name}
                  </h3>
                  <span className="text-[11px] font-mono font-medium text-emerald-400 ml-1">
                    ¥{meta.cost}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                  {meta.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Tips Footer */}
      <div className="p-3 bg-[#11151e] border-t border-[#263043] text-[11px] text-slate-400 flex items-center gap-2">
        <HelpCircle size={14} className="text-cyan-400 shrink-0" />
        <span>Rキーで回転、ドラッグで連続敷設できます</span>
      </div>
    </aside>
  );
};
