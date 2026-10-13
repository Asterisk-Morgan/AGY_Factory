import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Direction, Machine, MachineType, Scenario } from './types';
import { SimulationEngine, getRotatedDirection } from './engine/simulation';
import { MACHINE_METADATA, SCENARIOS, RECIPES } from './constants';
import { soundManager } from './audio';

import { FactoryCanvas } from './components/FactoryCanvas';
import { Toolbar } from './components/Toolbar';
import { ControlBar } from './components/ControlBar';
import { InspectorPanel } from './components/InspectorPanel';
import { StatsModal } from './components/StatsModal';
import { ScenarioModal } from './components/ScenarioModal';
import { Award, CheckCircle2, RotateCcw } from 'lucide-react';

export const App: React.FC = () => {
  // Engine reference
  const engineRef = useRef<SimulationEngine>(new SimulationEngine(24, 16));
  const [engineVersion, setEngineVersion] = useState(0); // Trigger React re-renders

  // UI state
  const [selectedTool, setSelectedTool] = useState<MachineType | 'select' | 'delete'>('conveyor');
  const [direction, setDirection] = useState<Direction>('right');
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  // Simulation play state
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isScenariosOpen, setIsScenariosOpen] = useState<boolean>(false);
  const [completedScenario, setCompletedScenario] = useState<Scenario | null>(null);
  const hasTriggeredClearRef = useRef<boolean>(false);

  // Toast message
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Initialize with the first scenario (tutorial)
  useEffect(() => {
    const engine = engineRef.current;
    engine.loadScenario(SCENARIOS[0]);
    setEngineVersion(v => v + 1);
  }, []);

  // Main simulation tick loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    const tickInterval = 1000 / 60; // 60 ticks per second baseline

    const loop = (currentTime: number) => {
      if (isRunning) {
        const delta = currentTime - lastTime;
        // Run multiple ticks based on speed
        const ticksToRun = Math.floor((delta / tickInterval) * speed);

        if (ticksToRun > 0) {
          const engine = engineRef.current;
          // Clamp max ticks to prevent freeze if tab unfocused
          const safeTicks = Math.min(ticksToRun, 15);
          for (let i = 0; i < safeTicks; i++) {
            engine.update();
          }

          // Check scenario clear condition
          if (!hasTriggeredClearRef.current && engine.isScenarioCompleted()) {
            hasTriggeredClearRef.current = true;
            soundManager.playSuccess();
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
            });
            setCompletedScenario(engine.currentScenario);
          }

          lastTime = currentTime;
          setEngineVersion(v => v + 1);
        }
      } else {
        lastTime = currentTime;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, speed]);

  // Rotate direction helper
  const handleRotate = useCallback(() => {
    setDirection(prev => getRotatedDirection(prev));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.key === 'r' || e.key === 'R') {
        handleRotate();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsRunning(r => !r);
      } else if (e.key === '1') {
        setSpeed(1);
      } else if (e.key === '2') {
        setSpeed(2);
      } else if (e.key === '5') {
        setSpeed(5);
      } else if (e.key === 'Escape') {
        setSelectedTool('select');
        setSelectedMachine(null);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedMachine) {
          handleDeleteMachine(selectedMachine.x, selectedMachine.y);
          setSelectedMachine(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRotate, selectedMachine]);

  // Build Machine
  const handleBuildMachine = (x: number, y: number) => {
    if (selectedTool === 'select' || selectedTool === 'delete') return;

    const engine = engineRef.current;
    const meta = MACHINE_METADATA[selectedTool];
    const cost = meta.cost;

    // Check funds
    if (engine.stats.cash < cost) {
      showToast('資金が不足しています！出荷を増やしてください。');
      return;
    }

    // If existing machine, remove it first
    const existing = engine.getMachine(x, y);
    if (existing) {
      // Don't rebuild if exactly the same type and direction
      if (existing.type === selectedTool && existing.direction === direction) return;
      engine.removeMachine(x, y);
    }

    // Deduct cost
    engine.stats.cash -= cost;

    // Create machine template
    const newMachine: Machine = {
      id: `m_${x}_${y}_${Date.now()}`,
      x,
      y,
      type: selectedTool,
      direction,
      state: 'idle',
      itemsProcessed: 0,
      uptimeTicks: 0,
      blockedTicks: 0,
      idleTicks: 0,
    };

    // Defaults per type
    if (selectedTool === 'spawner') {
      newMachine.spawnerItem = 'iron_ore';
      newMachine.spawnerInterval = 80;
      newMachine.spawnDefectRate = 0.05;
      newMachine.state = 'working';
    } else if (selectedTool === 'processor') {
      newMachine.processorRecipe = 'iron_to_plate';
      newMachine.workingTime = 60;
      newMachine.progress = 0;
      newMachine.inventory = [];
      newMachine.maxInventory = 4;
    } else if (selectedTool === 'assembler') {
      newMachine.processorRecipe = 'assemble_sensor';
      newMachine.workingTime = 120;
      newMachine.progress = 0;
      newMachine.inventory = [];
      newMachine.maxInventory = 6;
    } else if (selectedTool === 'sorter') {
      newMachine.sorterRule = {
        targetItem: 'defective',
        divertDirection: getRotatedDirection(direction),
      };
    } else if (selectedTool === 'agv_station') {
      newMachine.stationId = `STA_${x}_${y}`;
      newMachine.inventory = [];
      newMachine.maxInventory = 2;
    }

    engine.addMachine(newMachine);
    soundManager.playPlace();
    setEngineVersion(v => v + 1);
  };

  // Delete Machine
  const handleDeleteMachine = (x: number, y: number) => {
    const engine = engineRef.current;
    const removed = engine.removeMachine(x, y);
    if (removed) {
      // Refund partial cost
      const meta = MACHINE_METADATA[removed.type];
      if (meta) {
        engine.stats.cash += Math.round(meta.cost * 0.7);
      }
      soundManager.playRemove();
      if (selectedMachine?.id === removed.id) {
        setSelectedMachine(null);
      }
      setEngineVersion(v => v + 1);
    }
  };

  // Update Machine Config from Inspector
  const handleUpdateMachine = (updated: Machine) => {
    const engine = engineRef.current;
    engine.machines.set(`${updated.x},${updated.y}`, updated);
    setSelectedMachine(updated);
    setEngineVersion(v => v + 1);
  };

  // Select Scenario
  const handleSelectScenario = (sc: Scenario) => {
    hasTriggeredClearRef.current = false;
    setCompletedScenario(null);
    setSelectedMachine(null);
    engineRef.current.loadScenario(sc);
    setEngineVersion(v => v + 1);
    showToast(`シナリオ「${sc.title}」を開始しました！`);
  };

  // Reset current scenario
  const handleReset = () => {
    if (window.confirm('現在のラインを初期化してリセットしますか？')) {
      const cur = engineRef.current.currentScenario || SCENARIOS[0];
      handleSelectScenario(cur);
    }
  };

  const engine = engineRef.current;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d1117] text-slate-100 font-sans overflow-hidden">
      {/* Top Navigation & Status Bar */}
      <ControlBar
        isRunning={isRunning}
        onTogglePlay={() => setIsRunning(!isRunning)}
        speed={speed}
        onChangeSpeed={setSpeed}
        onReset={handleReset}
        stats={engine.stats}
        scenario={engine.currentScenario}
        onOpenScenarios={() => setIsScenariosOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          soundManager.enabled = next;
        }}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Equipment Toolbar */}
        <Toolbar
          selectedTool={selectedTool}
          onSelectTool={(tool) => {
            setSelectedTool(tool);
            if (tool !== 'select') setSelectedMachine(null);
          }}
          direction={direction}
          onRotate={handleRotate}
          unlockedMachines={engine.currentScenario?.unlockedMachines}
        />

        {/* Central Factory Grid Canvas */}
        <main className="flex-1 h-full relative">
          <FactoryCanvas
            engine={engine}
            selectedTool={selectedTool}
            currentDirection={direction}
            selectedMachine={selectedMachine}
            onSelectMachine={setSelectedMachine}
            onBuildMachine={handleBuildMachine}
            onDeleteMachine={handleDeleteMachine}
          />
        </main>

        {/* Right Machine Inspector / PLC Logic Panel */}
        {selectedMachine && (
          <InspectorPanel
            machine={selectedMachine}
            onClose={() => setSelectedMachine(null)}
            onUpdateMachine={handleUpdateMachine}
            onDeleteMachine={handleDeleteMachine}
            onRotateMachine={(m) => {
              const next = getRotatedDirection(m.direction);
              handleUpdateMachine({ ...m, direction: next });
            }}
          />
        )}
      </div>

      {/* Modals */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={engine.stats}
        engine={engine}
      />

      <ScenarioModal
        isOpen={isScenariosOpen}
        onClose={() => setIsScenariosOpen(false)}
        currentScenario={engine.currentScenario}
        onSelectScenario={handleSelectScenario}
      />

      {/* Mission Clear Banner Modal */}
      {completedScenario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-[#151a27] border-2 border-emerald-500 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
              <Award size={44} />
            </div>

            <h2 className="text-2xl font-black font-display text-white mb-1">
              ミッション達成！
            </h2>
            <p className="text-sm font-semibold text-emerald-400 mb-4">
              {completedScenario.title} クリア
            </p>

            <div className="bg-[#1b2233] p-4 rounded-xl border border-slate-700/60 mb-6 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">生産効率スコア:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {engine.stats.efficiencyScore}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">出荷スループット:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {engine.stats.throughputPerMinute} 個/分
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">欠陥品流出件数:</span>
                <span className="font-mono font-bold text-slate-200">
                  {engine.stats.totalDefectsShipped} 件
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCompletedScenario(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors border border-slate-700"
              >
                この工場を続ける
              </button>
              <button
                onClick={() => {
                  setCompletedScenario(null);
                  setIsScenariosOpen(true);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20"
              >
                次の課題を選ぶ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-950/90 border border-red-500/60 text-red-200 px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-sm text-xs font-semibold animate-bounce">
          {toast}
        </div>
      )}
    </div>
  );
};

export default App;
