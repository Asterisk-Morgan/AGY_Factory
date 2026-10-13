export type Direction = 'up' | 'right' | 'down' | 'left';

export type ItemType = 
  | 'iron_ore' 
  | 'copper_ore' 
  | 'silicon' 
  | 'plastic_resin'
  | 'iron_plate' 
  | 'copper_wire' 
  | 'ic_chip' 
  | 'plastic_casing'
  | 'smart_sensor' 
  | 'ev_battery' 
  | 'robot_controller';

export interface ItemDef {
  id: ItemType;
  name: string;
  category: 'raw' | 'processed' | 'product';
  color: string;
  iconText: string;
  value: number;
  description: string;
}

export interface Item {
  id: string;
  type: ItemType;
  x: number; // grid float coordinates
  y: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1 between tiles
  isDefective: boolean;
  createdAt: number;
}

export type MachineType = 
  | 'conveyor'
  | 'spawner'
  | 'processor'
  | 'assembler'
  | 'inspector'
  | 'sorter'
  | 'agv_station'
  | 'exporter'
  | 'trash';

export type MachineState = 'idle' | 'working' | 'blocked' | 'error';

export interface SorterRule {
  targetItem: ItemType | 'defective' | 'all';
  divertDirection: Direction; // alternate direction if rule matches
}

export interface Machine {
  id: string;
  x: number;
  y: number;
  type: MachineType;
  direction: Direction;
  state: MachineState;
  
  // Specific configurations
  spawnerItem?: ItemType;
  spawnerInterval?: number; // ticks
  spawnDefectRate?: number; // 0 to 1
  
  processorRecipe?: string; // recipe id
  progress?: number; // 0 to 1 for ongoing work
  workingTime?: number; // ticks needed
  
  inventory?: Item[];
  maxInventory?: number;
  
  sorterRule?: SorterRule;
  
  // AGV specific
  stationId?: string;
  targetStationId?: string;
  
  // Stats
  itemsProcessed: number;
  uptimeTicks: number;
  blockedTicks: number;
  idleTicks: number;
}

export interface Recipe {
  id: string;
  name: string;
  machineType: 'processor' | 'assembler';
  inputs: { type: ItemType; count: number }[];
  output: ItemType;
  duration: number; // in ticks (60 ticks = 1s at 1x)
}

export interface AGVVehicle {
  id: string;
  x: number;
  y: number;
  stationAId: string;
  stationBId: string;
  targetStationId: string;
  carryingItem: Item | null;
  state: 'moving' | 'loading' | 'unloading' | 'idle';
  progress: number;
}

export interface FactoryGrid {
  width: number;
  height: number;
  machines: Map<string, Machine>; // key: `${x},${y}`
}

export interface Scenario {
  id: string;
  title: string;
  subtitle: string;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  description: string;
  goals: {
    targetItem: ItemType;
    requiredCount: number;
    currentCount: number;
  }[];
  maxDefectShipmentAllowed: number;
  initialCash: number;
  unlockedMachines: MachineType[];
  setupFactory?: (gridWidth: number, gridHeight: number) => { machines: Machine[]; agvs?: AGVVehicle[] };
}

export interface FactoryStats {
  cash: number;
  totalShipped: number;
  totalDefectsShipped: number;
  totalDiscarded: number;
  throughputPerMinute: number;
  energyUsageKw: number;
  efficiencyScore: number;
  bottleneckMachines: { id: string; x: number; y: number; reason: string }[];
}
