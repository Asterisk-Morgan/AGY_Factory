import { 
  AGVVehicle, 
  Direction, 
  FactoryStats, 
  Item, 
  ItemType, 
  Machine, 
  MachineType, 
  Scenario 
} from '../types';
import { ITEM_DEFS, RECIPES } from '../constants';
import { soundManager } from '../audio';

export function getOffsetForDirection(dir: Direction): { dx: number; dy: number } {
  switch (dir) {
    case 'up': return { dx: 0, dy: -1 };
    case 'right': return { dx: 1, dy: 0 };
    case 'down': return { dx: 0, dy: 1 };
    case 'left': return { dx: -1, dy: 0 };
  }
}

export function getOppositeDirection(dir: Direction): Direction {
  switch (dir) {
    case 'up': return 'down';
    case 'right': return 'left';
    case 'down': return 'up';
    case 'left': return 'right';
  }
}

export function getRotatedDirection(dir: Direction): Direction {
  switch (dir) {
    case 'up': return 'right';
    case 'right': return 'down';
    case 'down': return 'left';
    case 'left': return 'up';
  }
}

export function getKey(x: number, y: number): string {
  return `${x},${y}`;
}

export class SimulationEngine {
  public width: number;
  public height: number;
  public machines: Map<string, Machine> = new Map();
  public items: Item[] = [];
  public agvs: AGVVehicle[] = [];
  public stats: FactoryStats;
  public currentScenario: Scenario | null = null;
  public tickCount: number = 0;
  
  // Throughput sliding window
  private recentShipments: number[] = []; // timestamps or ticks

  constructor(width: number = 24, height: number = 16) {
    this.width = width;
    this.height = height;
    this.stats = {
      cash: 1000,
      totalShipped: 0,
      totalDefectsShipped: 0,
      totalDiscarded: 0,
      throughputPerMinute: 0,
      energyUsageKw: 0,
      efficiencyScore: 100,
      bottleneckMachines: [],
    };
  }

  public getMachine(x: number, y: number): Machine | undefined {
    return this.machines.get(getKey(x, y));
  }

  public addMachine(m: Machine): boolean {
    const key = getKey(m.x, m.y);
    if (this.machines.has(key)) return false;
    this.machines.set(key, m);
    return true;
  }

  public removeMachine(x: number, y: number): Machine | undefined {
    const key = getKey(x, y);
    const m = this.machines.get(key);
    if (m) {
      this.machines.delete(key);
      // Remove any items that were on this tile
      this.items = this.items.filter(item => Math.floor(item.x) !== x || Math.floor(item.y) !== y);
    }
    return m;
  }

  public loadScenario(scenario: Scenario) {
    this.currentScenario = JSON.parse(JSON.stringify(scenario));
    this.machines.clear();
    this.items = [];
    this.agvs = [];
    this.recentShipments = [];
    this.tickCount = 0;
    this.stats = {
      cash: scenario.initialCash,
      totalShipped: 0,
      totalDefectsShipped: 0,
      totalDiscarded: 0,
      throughputPerMinute: 0,
      energyUsageKw: 0,
      efficiencyScore: 100,
      bottleneckMachines: [],
    };

    // Build default initial factory setup for the scenario
    this.setupScenarioPresets(scenario.id);
  }

  private setupScenarioPresets(scenarioId: string) {
    if (scenarioId === 'tutorial') {
      // Simple starter line: Spawner -> Conveyors -> Processor -> Conveyors -> Exporter
      this.addMachine({
        id: 'sp_1', x: 2, y: 7, type: 'spawner', direction: 'right', state: 'working',
        spawnerItem: 'iron_ore', spawnerInterval: 75, spawnDefectRate: 0,
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({
        id: 'c_1', x: 3, y: 7, type: 'conveyor', direction: 'right', state: 'idle',
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({
        id: 'c_2', x: 4, y: 7, type: 'conveyor', direction: 'right', state: 'idle',
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({
        id: 'proc_1', x: 5, y: 7, type: 'processor', direction: 'right', state: 'idle',
        processorRecipe: 'iron_to_plate', workingTime: 60, progress: 0, inventory: [], maxInventory: 3,
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({
        id: 'c_3', x: 6, y: 7, type: 'conveyor', direction: 'right', state: 'idle',
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({
        id: 'c_4', x: 7, y: 7, type: 'conveyor', direction: 'right', state: 'idle',
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({
        id: 'exp_1', x: 8, y: 7, type: 'exporter', direction: 'right', state: 'idle',
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
    } else if (scenarioId === 'quality_control') {
      // Quality control preset:
      // Spawner (with 25% defects) -> Conveyor -> Processor -> Inspector -> Sorter
      // Sorter -> Straight (Good) -> Exporter
      // Sorter -> Branch Down (Defect) -> Trash
      this.addMachine({
        id: 'sp_qc', x: 2, y: 6, type: 'spawner', direction: 'right', state: 'working',
        spawnerItem: 'iron_ore', spawnerInterval: 70, spawnDefectRate: 0.35,
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({
        id: 'c_qc1', x: 3, y: 6, type: 'conveyor', direction: 'right', state: 'idle',
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({
        id: 'proc_qc', x: 4, y: 6, type: 'processor', direction: 'right', state: 'idle',
        processorRecipe: 'iron_to_plate', workingTime: 60, progress: 0, inventory: [], maxInventory: 3,
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({
        id: 'insp_1', x: 5, y: 6, type: 'inspector', direction: 'right', state: 'idle',
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({
        id: 'sort_1', x: 6, y: 6, type: 'sorter', direction: 'right', state: 'idle',
        sorterRule: { targetItem: 'defective', divertDirection: 'down' },
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      // Good line (straight to exporter)
      this.addMachine({
        id: 'c_good1', x: 7, y: 6, type: 'conveyor', direction: 'right', state: 'idle',
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({
        id: 'exp_qc', x: 8, y: 6, type: 'exporter', direction: 'right', state: 'idle',
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      // Defect line (downwards to trash)
      this.addMachine({
        id: 'c_def1', x: 6, y: 7, type: 'conveyor', direction: 'down', state: 'idle',
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({
        id: 'trash_qc', x: 6, y: 8, type: 'trash', direction: 'down', state: 'idle',
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
    } else if (scenarioId === 'hybrid_assembly') {
      // Two lines merging into an assembler:
      // Line A (Silicon -> IC): Spawner (y=4) -> Processor -> Conveyors
      // Line B (Copper -> Wire): Spawner (y=8) -> Processor -> Conveyors
      // Assembler at (x=8, y=6) -> Exporter at (x=11, y=6)
      
      // Line A
      this.addMachine({
        id: 'sp_a', x: 2, y: 4, type: 'spawner', direction: 'right', state: 'working',
        spawnerItem: 'silicon', spawnerInterval: 90, spawnDefectRate: 0.05,
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({
        id: 'proc_a', x: 3, y: 4, type: 'processor', direction: 'right', state: 'idle',
        processorRecipe: 'silicon_to_ic', workingTime: 80, progress: 0, inventory: [], maxInventory: 3,
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({ id: 'c_a1', x: 4, y: 4, type: 'conveyor', direction: 'right', state: 'idle', itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0 });
      this.addMachine({ id: 'c_a2', x: 5, y: 4, type: 'conveyor', direction: 'right', state: 'idle', itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0 });
      this.addMachine({ id: 'c_a3', x: 6, y: 4, type: 'conveyor', direction: 'down', state: 'idle', itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0 });
      this.addMachine({ id: 'c_a4', x: 6, y: 5, type: 'conveyor', direction: 'right', state: 'idle', itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0 });

      // Line B
      this.addMachine({
        id: 'sp_b', x: 2, y: 8, type: 'spawner', direction: 'right', state: 'working',
        spawnerItem: 'copper_ore', spawnerInterval: 80, spawnDefectRate: 0.05,
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({
        id: 'proc_b', x: 3, y: 8, type: 'processor', direction: 'right', state: 'idle',
        processorRecipe: 'copper_to_wire', workingTime: 60, progress: 0, inventory: [], maxInventory: 3,
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({ id: 'c_b1', x: 4, y: 8, type: 'conveyor', direction: 'right', state: 'idle', itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0 });
      this.addMachine({ id: 'c_b2', x: 5, y: 8, type: 'conveyor', direction: 'right', state: 'idle', itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0 });
      this.addMachine({ id: 'c_b3', x: 6, y: 8, type: 'conveyor', direction: 'up', state: 'idle', itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0 });
      this.addMachine({ id: 'c_b4', x: 6, y: 7, type: 'conveyor', direction: 'right', state: 'idle', itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0 });

      // Feeder conveyor into Assembler
      this.addMachine({ id: 'c_merge', x: 7, y: 6, type: 'conveyor', direction: 'right', state: 'idle', itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0 });
      this.addMachine({ id: 'c_merge_top', x: 7, y: 5, type: 'conveyor', direction: 'down', state: 'idle', itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0 });
      this.addMachine({ id: 'c_merge_bot', x: 7, y: 7, type: 'conveyor', direction: 'up', state: 'idle', itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0 });

      // Assembler
      this.addMachine({
        id: 'asm_1', x: 8, y: 6, type: 'assembler', direction: 'right', state: 'idle',
        processorRecipe: 'assemble_sensor', workingTime: 120, progress: 0, inventory: [], maxInventory: 6,
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({ id: 'c_out1', x: 9, y: 6, type: 'conveyor', direction: 'right', state: 'idle', itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0 });
      this.addMachine({ id: 'c_out2', x: 10, y: 6, type: 'conveyor', direction: 'right', state: 'idle', itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0 });
      this.addMachine({ id: 'exp_asm', x: 11, y: 6, type: 'exporter', direction: 'right', state: 'idle', itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0 });
    } else if (scenarioId === 'smart_logistics') {
      // AGV Smart factory:
      // Cluster 1 at left, Cluster 2 at right with AGV Stations connecting them
      this.addMachine({
        id: 'sp_agv1', x: 2, y: 4, type: 'spawner', direction: 'right', state: 'working',
        spawnerItem: 'silicon', spawnerInterval: 80, spawnDefectRate: 0,
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({
        id: 'proc_agv1', x: 3, y: 4, type: 'processor', direction: 'right', state: 'idle',
        processorRecipe: 'silicon_to_ic', workingTime: 70, progress: 0, inventory: [], maxInventory: 3,
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({
        id: 'agv_st1', x: 4, y: 4, type: 'agv_station', direction: 'right', state: 'idle',
        stationId: 'STA_1', targetStationId: 'STA_2', inventory: [], maxInventory: 2,
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });

      // Target AGV station at x=14, y=4
      this.addMachine({
        id: 'agv_st2', x: 14, y: 4, type: 'agv_station', direction: 'right', state: 'idle',
        stationId: 'STA_2', targetStationId: 'STA_1', inventory: [], maxInventory: 2,
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });

      // From AGV 2 to Assembler
      this.addMachine({ id: 'c_agv_out', x: 15, y: 4, type: 'conveyor', direction: 'down', state: 'idle', itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0 });
      this.addMachine({ id: 'c_agv_out2', x: 15, y: 5, type: 'conveyor', direction: 'right', state: 'idle', itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0 });

      // Second raw material near right
      this.addMachine({
        id: 'sp_agv2', x: 12, y: 7, type: 'spawner', direction: 'right', state: 'working',
        spawnerItem: 'plastic_resin', spawnerInterval: 80, spawnDefectRate: 0,
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({
        id: 'proc_agv2', x: 13, y: 7, type: 'processor', direction: 'right', state: 'idle',
        processorRecipe: 'resin_to_casing', workingTime: 60, progress: 0, inventory: [], maxInventory: 3,
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({ id: 'c_agv2_1', x: 14, y: 7, type: 'conveyor', direction: 'right', state: 'idle', itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0 });
      this.addMachine({ id: 'c_agv2_2', x: 15, y: 7, type: 'conveyor', direction: 'up', state: 'idle', itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0 });

      // Assembler controller
      this.addMachine({
        id: 'asm_agv', x: 16, y: 6, type: 'assembler', direction: 'right', state: 'idle',
        processorRecipe: 'assemble_controller', workingTime: 140, progress: 0, inventory: [], maxInventory: 6,
        itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0
      });
      this.addMachine({ id: 'c_agv_f1', x: 17, y: 6, type: 'conveyor', direction: 'right', state: 'idle', itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0 });
      this.addMachine({ id: 'exp_agv', x: 18, y: 6, type: 'exporter', direction: 'right', state: 'idle', itemsProcessed: 0, uptimeTicks: 0, blockedTicks: 0, idleTicks: 0 });

      // Spawn AGV vehicle
      this.agvs.push({
        id: 'agv_cart_1',
        x: 4,
        y: 4,
        stationAId: 'STA_1',
        stationBId: 'STA_2',
        targetStationId: 'STA_2',
        carryingItem: null,
        state: 'idle',
        progress: 0,
      });
    }
  }

  public update() {
    this.tickCount++;

    // 1. Spawners tick
    this.updateSpawners();

    // 2. Processors & Assemblers tick
    this.updateProcessors();

    // 3. Move items along conveyors / into machines
    this.updateItems();

    // 4. Update AGVs
    this.updateAGVs();

    // 5. Calculate statistics and bottleneck diagnostics
    this.updateStats();
  }

  private isTileOccupiedByItem(x: number, y: number, excludeId?: string): boolean {
    return this.items.some(it => {
      if (it.id === excludeId) return false;
      const curX = Math.round(it.x);
      const curY = Math.round(it.y);
      const tgtX = Math.round(it.targetX);
      const tgtY = Math.round(it.targetY);
      return (curX === x && curY === y) || (tgtX === x && tgtY === y);
    });
  }

  private updateSpawners() {
    for (const machine of this.machines.values()) {
      if (machine.type !== 'spawner') continue;

      const interval = machine.spawnerInterval || 80;
      if (this.tickCount % interval === 0) {
        const offset = getOffsetForDirection(machine.direction);
        const spawnX = machine.x + offset.dx;
        const spawnY = machine.y + offset.dy;

        // Check bounds
        if (spawnX < 0 || spawnX >= this.width || spawnY < 0 || spawnY >= this.height) {
          machine.state = 'error';
          machine.blockedTicks++;
          continue;
        }

        // Check if target tile can receive
        const targetMachine = this.getMachine(spawnX, spawnY);
        if (!targetMachine) {
          machine.state = 'blocked';
          machine.blockedTicks++;
          continue;
        }

        // Check if tile already has an item
        if (this.isTileOccupiedByItem(spawnX, spawnY)) {
          machine.state = 'blocked';
          machine.blockedTicks++;
          continue;
        }

        // Determine defect
        const defectRate = machine.spawnDefectRate ?? 0;
        const isDefective = Math.random() < defectRate;

        // Spawn item
        const itemType = machine.spawnerItem || 'iron_ore';
        const newItem: Item = {
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: itemType,
          x: machine.x,
          y: machine.y,
          targetX: spawnX,
          targetY: spawnY,
          progress: 0,
          isDefective,
          createdAt: this.tickCount,
        };

        this.items.push(newItem);
        machine.itemsProcessed++;
        machine.state = 'working';
        machine.uptimeTicks++;
      } else {
        if (machine.state !== 'blocked') {
          machine.state = 'working';
          machine.uptimeTicks++;
        }
      }
    }
  }

  private updateProcessors() {
    for (const machine of this.machines.values()) {
      if (machine.type !== 'processor' && machine.type !== 'assembler') continue;

      if (!machine.inventory) machine.inventory = [];
      const recipe = RECIPES.find(r => r.id === machine.processorRecipe);

      if (!recipe) {
        machine.state = 'idle';
        machine.idleTicks++;
        continue;
      }

      // Check if we have needed ingredients
      const hasIngredients = recipe.inputs.every(inp => {
        const count = machine.inventory?.filter(it => it.type === inp.type).length || 0;
        return count >= inp.count;
      });

      if (hasIngredients) {
        // Working
        machine.state = 'working';
        machine.uptimeTicks++;
        machine.progress = (machine.progress || 0) + 1;

        if (machine.progress >= recipe.duration) {
          // Completed! Try to output
          const offset = getOffsetForDirection(machine.direction);
          const outX = machine.x + offset.dx;
          const outY = machine.y + offset.dy;

          const outMachine = this.getMachine(outX, outY);
          const isTileOccupied = this.isTileOccupiedByItem(outX, outY);

          if (!outMachine || isTileOccupied) {
            // Cannot output, blocked!
            machine.state = 'blocked';
            machine.blockedTicks++;
            // Hold progress at max
            machine.progress = recipe.duration;
          } else {
            // Consume inputs
            let anyInputDefective = false;
            for (const inp of recipe.inputs) {
              for (let i = 0; i < inp.count; i++) {
                const idx = machine.inventory.findIndex(it => it.type === inp.type);
                if (idx !== -1) {
                  if (machine.inventory[idx].isDefective) anyInputDefective = true;
                  machine.inventory.splice(idx, 1);
                }
              }
            }

            // Create output item
            const newItem: Item = {
              id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              type: recipe.output,
              x: machine.x,
              y: machine.y,
              targetX: outX,
              targetY: outY,
              progress: 0,
              isDefective: anyInputDefective || Math.random() < 0.05,
              createdAt: this.tickCount,
            };

            this.items.push(newItem);
            machine.itemsProcessed++;
            machine.progress = 0;
            machine.state = 'working';
          }
        }
      } else {
        machine.state = 'idle';
        machine.idleTicks++;
      }
    }
  }

  private updateItems() {
    const speed = 0.04; // Movement speed per tick
    const itemsToRemove = new Set<string>();

    for (const item of this.items) {
      if (item.progress < 1) {
        item.progress += speed;
        if (item.progress > 1) item.progress = 1;
        
        // Linear interpolation for smooth display
        item.x = item.x + (item.targetX - item.x) * speed * 2;
        item.y = item.y + (item.targetY - item.y) * speed * 2;
      }

      if (item.progress >= 1) {
        item.x = item.targetX;
        item.y = item.targetY;

        const currentTileMachine = this.getMachine(Math.round(item.x), Math.round(item.y));
        if (!currentTileMachine) {
          // Fallen off grid or deleted conveyor
          itemsToRemove.add(item.id);
          continue;
        }

        // Handle tile machine types
        if (currentTileMachine.type === 'exporter') {
          // Export product!
          this.handleExportItem(item, currentTileMachine);
          itemsToRemove.add(item.id);
          continue;
        }

        if (currentTileMachine.type === 'trash') {
          // Discard
          this.stats.totalDiscarded++;
          currentTileMachine.itemsProcessed++;
          currentTileMachine.state = 'working';
          soundManager.playRemove();
          itemsToRemove.add(item.id);
          continue;
        }

        if (currentTileMachine.type === 'inspector') {
          // Inspector scans item
          currentTileMachine.itemsProcessed++;
          currentTileMachine.state = 'working';
          if (item.isDefective) {
            soundManager.playDefectAlert();
          }
        }

        if (currentTileMachine.type === 'processor' || currentTileMachine.type === 'assembler') {
          // Absorbed into processor/assembler inventory if accepted
          if (!currentTileMachine.inventory) currentTileMachine.inventory = [];
          const maxInv = currentTileMachine.maxInventory || 6;
          if (currentTileMachine.inventory.length < maxInv) {
            currentTileMachine.inventory.push(item);
            itemsToRemove.add(item.id);
            continue;
          }
        }

        if (currentTileMachine.type === 'agv_station') {
          // Transfer to AGV station
          if (!currentTileMachine.inventory) currentTileMachine.inventory = [];
          if (currentTileMachine.inventory.length < (currentTileMachine.maxInventory || 3)) {
            currentTileMachine.inventory.push(item);
            itemsToRemove.add(item.id);
            continue;
          }
        }

        // Determine next move direction
        let nextDir = currentTileMachine.direction;

        // Sorter logic!
        if (currentTileMachine.type === 'sorter' && currentTileMachine.sorterRule) {
          const rule = currentTileMachine.sorterRule;
          let match = false;
          if (rule.targetItem === 'all') {
            match = true;
          } else if (rule.targetItem === 'defective') {
            match = item.isDefective;
          } else if (rule.targetItem === item.type) {
            match = true;
          }

          if (match) {
            nextDir = rule.divertDirection;
          }
          currentTileMachine.itemsProcessed++;
        }

        const offset = getOffsetForDirection(nextDir);
        const nextX = Math.round(item.x) + offset.dx;
        const nextY = Math.round(item.y) + offset.dy;

        // Check if next tile exists
        const nextMachine = this.getMachine(nextX, nextY);
        if (nextMachine && !this.isTileOccupiedByItem(nextX, nextY, item.id)) {
          // Move forward to next tile
          item.targetX = nextX;
          item.targetY = nextY;
          item.progress = 0;
          currentTileMachine.state = 'working';
        } else {
          // Blocked waiting for clearance
          currentTileMachine.state = 'blocked';
          currentTileMachine.blockedTicks++;
        }
      }
    }

    // Clean up processed items
    if (itemsToRemove.size > 0) {
      this.items = this.items.filter(it => !itemsToRemove.has(it.id));
    }
  }

  private handleExportItem(item: Item, exporter: Machine) {
    const itemDef = ITEM_DEFS[item.type];
    const value = itemDef ? itemDef.value : 10;

    exporter.itemsProcessed++;
    exporter.state = 'working';

    if (item.isDefective) {
      // Defect exported! Penalty
      this.stats.totalDefectsShipped++;
      const penalty = Math.round(value * 1.5);
      this.stats.cash = Math.max(0, this.stats.cash - penalty);
      soundManager.playDefectAlert();
    } else {
      // Good item!
      this.stats.totalShipped++;
      this.stats.cash += value;
      this.recentShipments.push(this.tickCount);
      soundManager.playExport();

      // Check scenario progress
      if (this.currentScenario) {
        for (const goal of this.currentScenario.goals) {
          if (goal.targetItem === item.type) {
            goal.currentCount++;
          }
        }
      }
    }
  }

  private updateAGVs() {
    for (const agv of this.agvs) {
      const stA = Array.from(this.machines.values()).find(m => m.stationId === agv.stationAId);
      const stB = Array.from(this.machines.values()).find(m => m.stationId === agv.stationBId);

      if (!stA || !stB) continue;

      const targetSt = agv.targetStationId === agv.stationAId ? stA : stB;
      const currentSt = agv.targetStationId === agv.stationAId ? stB : stA;

      // Distance to target
      const dx = targetSt.x - agv.x;
      const dy = targetSt.y - agv.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 0.2) {
        agv.x = targetSt.x;
        agv.y = targetSt.y;

        // Arrived at target station
        if (agv.carryingItem) {
          // Unload item to station's output if possible
          const outOffset = getOffsetForDirection(targetSt.direction);
          const outX = targetSt.x + outOffset.dx;
          const outY = targetSt.y + outOffset.dy;
          const outMachine = this.getMachine(outX, outY);

          if (outMachine && !this.isTileOccupiedByItem(outX, outY)) {
            agv.carryingItem.x = targetSt.x;
            agv.carryingItem.y = targetSt.y;
            agv.carryingItem.targetX = outX;
            agv.carryingItem.targetY = outY;
            agv.carryingItem.progress = 0;
            this.items.push(agv.carryingItem);
            agv.carryingItem = null;
            // Reverse target
            agv.targetStationId = currentSt.stationId || agv.stationAId;
          }
        } else {
          // Try to load item from target station inventory
          if (targetSt.inventory && targetSt.inventory.length > 0) {
            agv.carryingItem = targetSt.inventory.shift()!;
            // Reverse target to destination
            agv.targetStationId = currentSt.stationId || agv.stationBId;
          } else {
            // Idle waiting for cargo
            agv.state = 'idle';
          }
        }
      } else {
        // Move towards target
        const moveSpeed = 0.05;
        agv.state = 'moving';
        agv.x += (dx / dist) * moveSpeed;
        agv.y += (dy / dist) * moveSpeed;
      }
    }
  }

  private updateStats() {
    // Keep shipments within last 3600 ticks (60s at 60fps)
    const windowStart = this.tickCount - 3600;
    this.recentShipments = this.recentShipments.filter(t => t > windowStart);
    this.stats.throughputPerMinute = this.recentShipments.length;

    // Bottleneck detection
    const bottlenecks: { id: string; x: number; y: number; reason: string }[] = [];
    let totalUptime = 0;
    let totalBlocked = 0;

    for (const machine of this.machines.values()) {
      totalUptime += machine.uptimeTicks;
      totalBlocked += machine.blockedTicks;

      if (machine.state === 'blocked' && machine.blockedTicks > 120) {
        let reason = '搬出先が満杯のためラインが停止中';
        if (machine.type === 'spawner') reason = '供給先のコンベアが渋滞しています';
        if (machine.type === 'processor') reason = '完成品の搬出経路が詰まっています';
        if (machine.type === 'sorter') reason = '分岐先の搬送路が塞がっています';
        bottlenecks.push({ id: machine.id, x: machine.x, y: machine.y, reason });
      }
    }

    this.stats.bottleneckMachines = bottlenecks.slice(0, 5);

    // Efficiency Score (0-100)
    const totalTicks = totalUptime + totalBlocked;
    if (totalTicks > 0) {
      const activeRatio = totalUptime / totalTicks;
      const defectPenalty = this.stats.totalDefectsShipped * 5;
      this.stats.efficiencyScore = Math.max(0, Math.min(100, Math.round(activeRatio * 100 - defectPenalty)));
    }
  }

  public isScenarioCompleted(): boolean {
    if (!this.currentScenario) return false;
    if (this.currentScenario.goals.length === 0) return false;
    return this.currentScenario.goals.every(g => g.currentCount >= g.requiredCount);
  }
}
