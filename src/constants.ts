import { ItemDef, ItemType, MachineType, Recipe, Scenario } from './types';

export const ITEM_DEFS: Record<ItemType, ItemDef> = {
  iron_ore: {
    id: 'iron_ore',
    name: '鉄鉱石',
    category: 'raw',
    color: '#94a3b8',
    iconText: '🪨',
    value: 10,
    description: '未加工の鉄鉱石。プレス機で鉄板に成形します。',
  },
  copper_ore: {
    id: 'copper_ore',
    name: '銅鉱石',
    category: 'raw',
    color: '#f97316',
    iconText: '🟠',
    value: 12,
    description: '純度の高い銅鉱石。伸線機で銅線に加工します。',
  },
  silicon: {
    id: 'silicon',
    name: '高純度シリコン',
    category: 'raw',
    color: '#38bdf8',
    iconText: '💎',
    value: 25,
    description: '半導体グレードのシリコン結晶ウェハー。',
  },
  plastic_resin: {
    id: 'plastic_resin',
    name: 'プラスチックペレット',
    category: 'raw',
    color: '#e2e8f0',
    iconText: '⚪',
    value: 8,
    description: '熱可塑性ポリマー樹脂。射出成形機で筐体に成形。',
  },
  iron_plate: {
    id: 'iron_plate',
    name: '高張力鉄板',
    category: 'processed',
    color: '#64748b',
    iconText: '⏹️',
    value: 30,
    description: '大型プレス機で打ち抜かれた強固な金属フレームプレート。',
  },
  copper_wire: {
    id: 'copper_wire',
    name: 'エナメル銅線コイル',
    category: 'processed',
    color: '#ea580c',
    iconText: '➰',
    value: 35,
    description: '精密に伸線された高導電率コイル。モーターや回路用。',
  },
  ic_chip: {
    id: 'ic_chip',
    name: '制御用マイクロIC',
    category: 'processed',
    color: '#10b981',
    iconText: '🟩',
    value: 75,
    description: '微細エッチングされた高度な半導体チップ。',
  },
  plastic_casing: {
    id: 'plastic_casing',
    name: '耐衝撃筐体ユニット',
    category: 'processed',
    color: '#475569',
    iconText: '📦',
    value: 28,
    description: '射出成形された精密製品カバー。内部回路を保護。',
  },
  smart_sensor: {
    id: 'smart_sensor',
    name: 'スマートIoTセンサー',
    category: 'product',
    color: '#06b6d4',
    iconText: '📟',
    value: 180,
    description: 'ICチップと銅線を高密度実装した産業用センサーユニット。',
  },
  ev_battery: {
    id: 'ev_battery',
    name: 'EV次世代バッテリーモジュール',
    category: 'product',
    color: '#eab308',
    iconText: '🔋',
    value: 260,
    description: '強固な鉄板フレームと高伝導銅線を結合した大容量蓄電モジュール。',
  },
  robot_controller: {
    id: 'robot_controller',
    name: '協働ロボットコントローラ',
    category: 'product',
    color: '#8b5cf6',
    iconText: '🤖',
    value: 420,
    description: 'ICチップ、保護筐体、配線を統合した最先端制御中枢。',
  },
};

export const RECIPES: Recipe[] = [
  // 加工機レシピ (1入力 -> 1出力)
  {
    id: 'iron_to_plate',
    name: '鉄板プレス加工',
    machineType: 'processor',
    inputs: [{ type: 'iron_ore', count: 1 }],
    output: 'iron_plate',
    duration: 60, // 1秒
  },
  {
    id: 'copper_to_wire',
    name: '銅線伸線加工',
    machineType: 'processor',
    inputs: [{ type: 'copper_ore', count: 1 }],
    output: 'copper_wire',
    duration: 60,
  },
  {
    id: 'silicon_to_ic',
    name: '半導体微細エッチング',
    machineType: 'processor',
    inputs: [{ type: 'silicon', count: 1 }],
    output: 'ic_chip',
    duration: 90, // 1.5秒
  },
  {
    id: 'resin_to_casing',
    name: '射出成形ハウジング',
    machineType: 'processor',
    inputs: [{ type: 'plastic_resin', count: 1 }],
    output: 'plastic_casing',
    duration: 60,
  },
  // 組立機レシピ (複数入力 -> 1出力)
  {
    id: 'assemble_sensor',
    name: 'スマートセンサー組立',
    machineType: 'assembler',
    inputs: [
      { type: 'ic_chip', count: 1 },
      { type: 'copper_wire', count: 1 },
    ],
    output: 'smart_sensor',
    duration: 120, // 2秒
  },
  {
    id: 'assemble_battery',
    name: 'EVバッテリーモジュール組立',
    machineType: 'assembler',
    inputs: [
      { type: 'iron_plate', count: 1 },
      { type: 'copper_wire', count: 1 },
    ],
    output: 'ev_battery',
    duration: 140, // 2.3秒
  },
  {
    id: 'assemble_controller',
    name: 'ロボットコントローラ組立',
    machineType: 'assembler',
    inputs: [
      { type: 'ic_chip', count: 1 },
      { type: 'plastic_casing', count: 1 },
    ],
    output: 'robot_controller',
    duration: 160, // 2.6秒
  },
];

export interface MachineMetadata {
  type: MachineType;
  name: string;
  shortName: string;
  cost: number;
  description: string;
  color: string;
  icon: string;
  category: 'logistics' | 'production' | 'quality' | 'output';
}

export const MACHINE_METADATA: Record<MachineType, MachineMetadata> = {
  conveyor: {
    type: 'conveyor',
    name: 'ベルトコンベア',
    shortName: 'コンベア',
    cost: 10,
    description: 'アイテムを矢印の向きへ一定速度で搬送します。直進・カーブ・合流が可能。',
    color: '#334155',
    icon: '➡️',
    category: 'logistics',
  },
  spawner: {
    type: 'spawner',
    name: 'マテリアル供給機',
    shortName: '供給機',
    cost: 50,
    description: '指定した原料を定期的にラインへ投入します。投入間隔や不良品率を設定可能。',
    color: '#0284c7',
    icon: '🏭',
    category: 'production',
  },
  processor: {
    type: 'processor',
    name: '精密加工機 (プレス/伸線/成形)',
    shortName: '加工機',
    cost: 150,
    description: '原料を単一部品へ加工します。鉄板、銅線、ICチップ、筐体に対応。',
    color: '#d97706',
    icon: '⚙️',
    category: 'production',
  },
  assembler: {
    type: 'assembler',
    name: '自動組立機 (ロボットセル)',
    shortName: '組立機',
    cost: 300,
    description: '2種類の部品を受け取り、高付加価値な完成品モジュールへと組み立てます。',
    color: '#7c3aed',
    icon: '🦾',
    category: 'production',
  },
  inspector: {
    type: 'inspector',
    name: 'AI画像品質検査スキャナー',
    shortName: '検査機',
    cost: 120,
    description: '通過するアイテムを非破壊レーザースキャンし、不良品（Defect）を瞬時にタグ付け。',
    color: '#059669',
    icon: '🔍',
    category: 'quality',
  },
  sorter: {
    type: 'sorter',
    name: 'スマートPLC分岐ソーター',
    shortName: 'ソーター',
    cost: 80,
    description: '条件（不良品、アイテム種別など）に合わせて直進ラインと分岐ラインへ自動仕分け。',
    color: '#e11d48',
    icon: '🔀',
    category: 'logistics',
  },
  agv_station: {
    type: 'agv_station',
    name: '無人搬送車 (AGV) ドッキングステーション',
    shortName: 'AGV拠点',
    cost: 250,
    description: '離れたエリア間を自動走行AGV台車がアイテムを積んで往復輸送します。',
    color: '#0891b2',
    icon: '🚚',
    category: 'logistics',
  },
  exporter: {
    type: 'exporter',
    name: '出荷ドック (収益化)',
    shortName: '出荷口',
    cost: 50,
    description: '完成品や部品を納品して資金を獲得します。不良品を出荷するとペナルティ！',
    color: '#16a34a',
    icon: '📦',
    category: 'output',
  },
  trash: {
    type: 'trash',
    name: 'リサイクル廃棄ユニット',
    shortName: '廃棄機',
    cost: 20,
    description: '不要な中間品や不良品を破砕・廃棄します。ラインの詰まり解消に必須。',
    color: '#475569',
    icon: '🗑️',
    category: 'output',
  },
};

export const SCENARIOS: Scenario[] = [
  {
    id: 'tutorial',
    title: '入門: 鉄板加工ラインの構築',
    subtitle: '基本操作とライン連結のマスター',
    difficulty: 'EASY',
    description: '鉄鉱石供給機からコンベアを伸ばし、プレス加工機で鉄板を製造して出荷ドックへ納品しましょう。',
    initialCash: 1000,
    maxDefectShipmentAllowed: 0,
    unlockedMachines: ['conveyor', 'spawner', 'processor', 'exporter', 'trash'],
    goals: [
      { targetItem: 'iron_plate', requiredCount: 15, currentCount: 0 }
    ],
  },
  {
    id: 'quality_control',
    title: '課題1: 不良品ゼロへの挑戦 (AI検査＆自動仕分け)',
    subtitle: '品質管理（QC）とPLCソーターの活用',
    difficulty: 'NORMAL',
    description: '供給機から稀に混入する欠陥品（Defect）が問題になっています。検査スキャナーとソーターを配置し、良品のみを出荷し、欠陥品は廃棄ユニットへ送る自動仕分けラインを完成させてください。欠陥品を出荷すると減点されます！',
    initialCash: 1500,
    maxDefectShipmentAllowed: 1,
    unlockedMachines: ['conveyor', 'spawner', 'processor', 'inspector', 'sorter', 'exporter', 'trash'],
    goals: [
      { targetItem: 'iron_plate', requiredCount: 25, currentCount: 0 }
    ],
  },
  {
    id: 'hybrid_assembly',
    title: '課題2: スマートIoTセンサー量産ライン',
    subtitle: '複数部品の協調と組立自動化',
    difficulty: 'HARD',
    description: 'シリコンからICチップを、銅鉱石から銅線を加工し、2系統のラインを組立機（アセンブラー）で合流させて「スマートIoTセンサー」を大量生産してください。ラインの速度バランスが崩れるとボトルネックが発生します！',
    initialCash: 2500,
    maxDefectShipmentAllowed: 2,
    unlockedMachines: ['conveyor', 'spawner', 'processor', 'assembler', 'inspector', 'sorter', 'exporter', 'trash'],
    goals: [
      { targetItem: 'smart_sensor', requiredCount: 10, currentCount: 0 }
    ],
  },
  {
    id: 'smart_logistics',
    title: '課題3: AGV自動搬送スマートファクトリー',
    subtitle: '長距離搬送とロボット物流の統合',
    difficulty: 'HARD',
    description: 'コンベアを引くのが困難な遠距離の製造エリアから出荷エリアへ、無人搬送車（AGV）を連携させてロボットコントローラを納品してください。',
    initialCash: 4000,
    maxDefectShipmentAllowed: 3,
    unlockedMachines: ['conveyor', 'spawner', 'processor', 'assembler', 'inspector', 'sorter', 'agv_station', 'exporter', 'trash'],
    goals: [
      { targetItem: 'robot_controller', requiredCount: 8, currentCount: 0 }
    ],
  },
  {
    id: 'sandbox',
    title: '自由建設: メガファクトリー サンドボックス',
    subtitle: '制限なし！究極の自動化工場を設計しよう',
    difficulty: 'EASY',
    description: 'すべての設備が解放され、潤沢な資金で自由な生産ラインを構築できます。最高のスループットと完璧な自動化を目指しましょう！',
    initialCash: 99999,
    maxDefectShipmentAllowed: 999,
    unlockedMachines: ['conveyor', 'spawner', 'processor', 'assembler', 'inspector', 'sorter', 'agv_station', 'exporter', 'trash'],
    goals: [
      { targetItem: 'robot_controller', requiredCount: 50, currentCount: 0 },
      { targetItem: 'ev_battery', requiredCount: 50, currentCount: 0 }
    ],
  }
];
