import React from 'react';
import { Scenario } from '../types';
import { SCENARIOS, ITEM_DEFS } from '../constants';
import { X, Award, CheckCircle, Play, Sparkles } from 'lucide-react';

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScenario: Scenario | null;
  onSelectScenario: (scenario: Scenario) => void;
}

export const ScenarioModal: React.FC<ScenarioModalProps> = ({
  isOpen,
  onClose,
  currentScenario,
  onSelectScenario,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#141824] border border-[#263147] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#263147] flex items-center justify-between bg-[#192030]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
              <Award size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-display">
                シナリオ & 自動化ミッション選択
              </h2>
              <p className="text-xs text-slate-400">
                目標に合わせた工場ラインを設計し、課題をクリアしてください
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

        {/* Scenarios List */}
        <div className="p-6 overflow-y-auto space-y-4">
          {SCENARIOS.map((sc) => {
            const isCurrent = currentScenario?.id === sc.id;
            let diffColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
            if (sc.difficulty === 'NORMAL') diffColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
            if (sc.difficulty === 'HARD') diffColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';

            return (
              <div
                key={sc.id}
                className={`p-4 rounded-xl border transition-all text-left flex flex-col gap-3 ${
                  isCurrent
                    ? 'bg-purple-950/20 border-purple-500/60 shadow-lg'
                    : 'bg-[#181e2b] border-[#273245] hover:border-slate-500 hover:bg-[#1c2333]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-100">{sc.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-mono font-bold ${diffColor}`}>
                        {sc.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-purple-300 font-medium mt-0.5">{sc.subtitle}</p>
                  </div>

                  <button
                    onClick={() => {
                      onSelectScenario(sc);
                      onClose();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-200 border border-slate-700'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <CheckCircle size={14} /> プレイ中
                      </>
                    ) : (
                      <>
                        <Play size={14} /> ロード
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{sc.description}</p>

                {/* Goals */}
                <div className="bg-[#121622] p-2.5 rounded-lg border border-[#222b3d] flex flex-wrap items-center gap-3">
                  <span className="text-[11px] text-slate-400 font-medium">納品目標:</span>
                  {sc.goals.map((g, idx) => {
                    const itemDef = ITEM_DEFS[g.targetItem];
                    return (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-200">
                        <span>{itemDef?.iconText}</span>
                        <span className="font-semibold">{itemDef?.name}</span>
                        <span className="font-mono text-cyan-300">×{g.requiredCount}</span>
                      </div>
                    );
                  })}
                  <div className="ml-auto text-[11px] text-slate-400">
                    初期資金: <span className="text-amber-400 font-mono font-bold">¥{sc.initialCash.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#263147] bg-[#192030] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors border border-slate-700"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
