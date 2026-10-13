import React, { useRef, useEffect, useCallback } from 'react';
import { Direction, Machine, MachineType } from '../types';
import { SimulationEngine, getOffsetForDirection } from '../engine/simulation';
import { ITEM_DEFS, MACHINE_METADATA } from '../constants';

interface FactoryCanvasProps {
  engine: SimulationEngine;
  selectedTool: MachineType | 'select' | 'delete';
  currentDirection: Direction;
  selectedMachine: Machine | null;
  onSelectMachine: (m: Machine | null) => void;
  onBuildMachine: (x: number, y: number) => void;
  onDeleteMachine: (x: number, y: number) => void;
}

export const FactoryCanvas: React.FC<FactoryCanvasProps> = ({
  engine,
  selectedTool,
  currentDirection,
  selectedMachine,
  onSelectMachine,
  onBuildMachine,
  onDeleteMachine,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Viewport camera state (pan & zoom)
  const cameraRef = useRef({
    x: 40,
    y: 40,
    zoom: 1.0,
    isPanning: false,
    startX: 0,
    startY: 0,
  });

  const mouseGridRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingBuildRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);

  const TILE_SIZE = 48; // Base pixel size per tile

  // Convert screen coordinates to factory grid coordinates
  const screenToGrid = useCallback((screenX: number, screenY: number) => {
    const cam = cameraRef.current;
    const worldX = (screenX - cam.x) / cam.zoom;
    const worldY = (screenY - cam.y) / cam.zoom;
    const gridX = Math.floor(worldX / TILE_SIZE);
    const gridY = Math.floor(worldY / TILE_SIZE);
    return { gridX, gridY };
  }, []);

  // Main rendering loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cam = cameraRef.current;
    const tick = engine.tickCount;

    // Clear background
    ctx.fillStyle = '#0f141d';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.scale(cam.zoom, cam.zoom);

    // 1. Draw Factory Floor & Grid Lines
    const gridW = engine.width * TILE_SIZE;
    const gridH = engine.height * TILE_SIZE;

    // Floor background
    ctx.fillStyle = '#141a24';
    ctx.fillRect(0, 0, gridW, gridH);

    // Grid dots / subtle lines
    ctx.strokeStyle = '#1e2638';
    ctx.lineWidth = 1;
    for (let x = 0; x <= engine.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * TILE_SIZE, 0);
      ctx.lineTo(x * TILE_SIZE, gridH);
      ctx.stroke();
    }
    for (let y = 0; y <= engine.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * TILE_SIZE);
      ctx.lineTo(gridW, y * TILE_SIZE);
      ctx.stroke();
    }

    // Outer border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, gridW, gridH);

    // 2. Draw Machines
    for (const machine of engine.machines.values()) {
      drawMachine(ctx, machine, tick, selectedMachine?.id === machine.id);
    }

    // 3. Draw AGV vehicles
    for (const agv of engine.agvs) {
      drawAGV(ctx, agv, tick);
    }

    // 4. Draw Moving Items
    for (const item of engine.items) {
      drawItem(ctx, item, tick);
    }

    // 5. Draw Tool Ghost / Preview under cursor
    const mousePos = mouseGridRef.current;
    if (mousePos && mousePos.x >= 0 && mousePos.x < engine.width && mousePos.y >= 0 && mousePos.y < engine.height) {
      drawPlacementPreview(ctx, mousePos.x, mousePos.y, selectedTool, currentDirection);
    }

    ctx.restore();
  }, [engine, selectedTool, currentDirection, selectedMachine]);

  // Separate draw functions
  const drawMachine = (
    ctx: CanvasRenderingContext2D,
    m: Machine,
    tick: number,
    isSelected: boolean
  ) => {
    const px = m.x * TILE_SIZE;
    const py = m.y * TILE_SIZE;
    const meta = MACHINE_METADATA[m.type];

    ctx.save();
    ctx.translate(px, py);

    // Machine Base Tile
    ctx.fillStyle = meta ? meta.color : '#334155';
    ctx.beginPath();
    ctx.roundRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4, 6);
    ctx.fill();

    // Machine Border
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw specific machine graphics
    const centerX = TILE_SIZE / 2;
    const centerY = TILE_SIZE / 2;

    if (m.type === 'conveyor') {
      // Conveyor belt animation
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);

      // Moving arrows
      ctx.save();
      ctx.translate(centerX, centerY);
      applyRotation(ctx, m.direction);

      const offsetAnim = (tick * 1.5) % 12;
      ctx.strokeStyle = '#00d2ff';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      for (let i = -14 + offsetAnim; i <= 14; i += 12) {
        ctx.beginPath();
        ctx.moveTo(i - 4, -4);
        ctx.lineTo(i, 0);
        ctx.lineTo(i - 4, 4);
        ctx.stroke();
      }
      ctx.restore();
    } else if (m.type === 'spawner') {
      // Spawner icon and item badge
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏭', centerX, centerY - 2);

      // Raw item badge
      if (m.spawnerItem) {
        const itemDef = ITEM_DEFS[m.spawnerItem];
        if (itemDef) {
          ctx.fillStyle = itemDef.color;
          ctx.beginPath();
          ctx.arc(centerX + 12, centerY + 12, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Direction indicator arrow
      drawDirectionArrow(ctx, centerX, centerY, m.direction);
    } else if (m.type === 'processor') {
      // Rotating gears or hydraulic press
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚙️', centerX, centerY - 2);

      // Working progress ring
      if (m.state === 'working' && m.progress && m.workingTime) {
        const ratio = m.progress / m.workingTime;
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
        ctx.stroke();
      }

      drawDirectionArrow(ctx, centerX, centerY, m.direction);
    } else if (m.type === 'assembler') {
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🦾', centerX, centerY - 2);

      if (m.state === 'working' && m.progress && m.workingTime) {
        const ratio = m.progress / m.workingTime;
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
        ctx.stroke();
      }

      drawDirectionArrow(ctx, centerX, centerY, m.direction);
    } else if (m.type === 'inspector') {
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔍', centerX, centerY);

      // Laser scan beam line animation
      const scanY = 6 + (Math.sin(tick * 0.15) * 0.5 + 0.5) * (TILE_SIZE - 12);
      ctx.strokeStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 6;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(6, scanY);
      ctx.lineTo(TILE_SIZE - 6, scanY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      drawDirectionArrow(ctx, centerX, centerY, m.direction);
    } else if (m.type === 'sorter') {
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔀', centerX, centerY);

      // Draw normal direction arrow
      drawDirectionArrow(ctx, centerX, centerY, m.direction);

      // Draw divert direction arrow (magenta)
      if (m.sorterRule) {
        ctx.save();
        ctx.strokeStyle = '#ec4899';
        drawDirectionArrow(ctx, centerX, centerY, m.sorterRule.divertDirection, '#ec4899');
        ctx.restore();
      }
    } else if (m.type === 'agv_station') {
      // Hazard stripes on border
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8);
      ctx.setLineDash([]);

      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚏', centerX, centerY);

      drawDirectionArrow(ctx, centerX, centerY, m.direction);
    } else if (m.type === 'exporter') {
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📦', centerX, centerY);

      // Inflow border
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(6, 6, TILE_SIZE - 12, TILE_SIZE - 12);
    } else if (m.type === 'trash') {
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🗑️', centerX, centerY);
    }

    // Status indicator LED (top right corner)
    let ledColor = '#10b981'; // Green for working/ready
    if (m.state === 'blocked') ledColor = '#ef4444'; // Red for blocked
    else if (m.state === 'idle') ledColor = '#eab308'; // Yellow for idle
    else if (m.state === 'error') ledColor = '#f97316';

    ctx.fillStyle = ledColor;
    ctx.shadowColor = ledColor;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(TILE_SIZE - 8, 8, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Bottleneck / Blocked Pulse Warning
    if (m.state === 'blocked' && m.blockedTicks > 60) {
      const pulse = (Math.sin(tick * 0.2) * 0.5 + 0.5);
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.5 + pulse * 0.5})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);

      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('⚠️', 10, 12);
    }

    // Selection border
    if (isSelected) {
      ctx.strokeStyle = '#00d2ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(-1, -1, TILE_SIZE + 2, TILE_SIZE + 2);
    }

    ctx.restore();
  };

  const drawDirectionArrow = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    dir: Direction,
    color: string = '#cbd5e1'
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    applyRotation(ctx, dir);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(20, 0);
    ctx.lineTo(16, -4);
    ctx.moveTo(20, 0);
    ctx.lineTo(16, 4);
    ctx.stroke();

    ctx.restore();
  };

  const applyRotation = (ctx: CanvasRenderingContext2D, dir: Direction) => {
    if (dir === 'right') ctx.rotate(0);
    else if (dir === 'down') ctx.rotate(Math.PI / 2);
    else if (dir === 'left') ctx.rotate(Math.PI);
    else if (dir === 'up') ctx.rotate(-Math.PI / 2);
  };

  const drawItem = (ctx: CanvasRenderingContext2D, item: import('../types').Item, tick: number) => {
    const px = item.x * TILE_SIZE + TILE_SIZE / 2;
    const py = item.y * TILE_SIZE + TILE_SIZE / 2;
    const def = ITEM_DEFS[item.type];
    const color = def ? def.color : '#e2e8f0';

    ctx.save();
    ctx.translate(px, py);

    // Item shape
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    // Outline
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Defective item badge!
    if (item.isDefective) {
      const flash = (Math.sin(tick * 0.3) > 0);
      ctx.fillStyle = flash ? '#ef4444' : '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✖', 0, 0);

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Regular mini dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-2, -2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  const drawAGV = (ctx: CanvasRenderingContext2D, agv: import('../types').AGVVehicle, tick: number) => {
    const px = agv.x * TILE_SIZE + TILE_SIZE / 2;
    const py = agv.y * TILE_SIZE + TILE_SIZE / 2;

    ctx.save();
    ctx.translate(px, py);

    // Vehicle body
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-14, -14, 28, 28, 6);
    ctx.fill();
    ctx.stroke();

    // Beacon light
    const beacon = (tick % 20 < 10);
    ctx.fillStyle = beacon ? '#f59e0b' : '#78350f';
    ctx.beginPath();
    ctx.arc(0, -9, 3, 0, Math.PI * 2);
    ctx.fill();

    // AGV wheels / treads
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-16, -12, 3, 24);
    ctx.fillRect(13, -12, 3, 24);

    // Cargo if carrying
    if (agv.carryingItem) {
      const def = ITEM_DEFS[agv.carryingItem.type];
      ctx.fillStyle = def ? def.color : '#e2e8f0';
      ctx.beginPath();
      ctx.arc(0, 2, 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AGV', 0, 5);
    }

    ctx.restore();
  };

  const drawPlacementPreview = (
    ctx: CanvasRenderingContext2D,
    gx: number,
    gy: number,
    tool: MachineType | 'select' | 'delete',
    dir: Direction
  ) => {
    const px = gx * TILE_SIZE;
    const py = gy * TILE_SIZE;

    ctx.save();
    ctx.translate(px, py);

    if (tool === 'delete') {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);

      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(8, 8);
      ctx.lineTo(TILE_SIZE - 8, TILE_SIZE - 8);
      ctx.moveTo(TILE_SIZE - 8, 8);
      ctx.lineTo(8, TILE_SIZE - 8);
      ctx.stroke();
    } else if (tool !== 'select') {
      const meta = MACHINE_METADATA[tool];
      ctx.fillStyle = meta ? `${meta.color}88` : 'rgba(0, 210, 255, 0.4)';
      ctx.fillRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);

      ctx.strokeStyle = '#00d2ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
      ctx.setLineDash([]);

      // Ghost arrow
      drawDirectionArrow(ctx, TILE_SIZE / 2, TILE_SIZE / 2, dir, '#ffffff');
    }

    ctx.restore();
  };

  // Animation loop
  useEffect(() => {
    const loop = () => {
      render();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [render]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
      render();
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (e.button === 1 || e.altKey) {
      // Middle click or Alt + Left click: Pan camera
      cameraRef.current.isPanning = true;
      cameraRef.current.startX = clientX - cameraRef.current.x;
      cameraRef.current.startY = clientY - cameraRef.current.y;
      return;
    }

    if (e.button === 0) {
      // Left click
      const { gridX, gridY } = screenToGrid(clientX, clientY);
      if (gridX < 0 || gridX >= engine.width || gridY < 0 || gridY >= engine.height) return;

      if (selectedTool === 'select') {
        const m = engine.getMachine(gridX, gridY);
        onSelectMachine(m || null);
      } else if (selectedTool === 'delete') {
        onDeleteMachine(gridX, gridY);
        isDraggingBuildRef.current = true;
      } else {
        onBuildMachine(gridX, gridY);
        isDraggingBuildRef.current = true;
      }
    } else if (e.button === 2) {
      // Right click: Quick delete
      const { gridX, gridY } = screenToGrid(clientX, clientY);
      onDeleteMachine(gridX, gridY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (cameraRef.current.isPanning) {
      cameraRef.current.x = clientX - cameraRef.current.startX;
      cameraRef.current.y = clientY - cameraRef.current.startY;
      return;
    }

    const { gridX, gridY } = screenToGrid(clientX, clientY);
    mouseGridRef.current = { x: gridX, y: gridY };

    // Continuous dragging build (Factorio style!)
    if (isDraggingBuildRef.current && gridX >= 0 && gridX < engine.width && gridY >= 0 && gridY < engine.height) {
      if (selectedTool === 'delete') {
        onDeleteMachine(gridX, gridY);
      } else if (selectedTool === 'conveyor') {
        onBuildMachine(gridX, gridY);
      }
    }
  };

  const handleMouseUp = () => {
    cameraRef.current.isPanning = false;
    isDraggingBuildRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(Math.max(cameraRef.current.zoom * zoomFactor, 0.4), 2.5);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom centered around mouse
    const cam = cameraRef.current;
    cam.x = mouseX - (mouseX - cam.x) * (newZoom / cam.zoom);
    cam.y = mouseY - (mouseY - cam.y) * (newZoom / cam.zoom);
    cam.zoom = newZoom;
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0d1117] select-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full cursor-crosshair block"
      />

      {/* Floating navigation controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-[#1b202a]/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs text-slate-300 shadow-lg">
        <span className="text-slate-400">ホイール: ズーム</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">Alt+ドラッグ: 視点移動</span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">右クリック: 撤去</span>
      </div>
    </div>
  );
};
