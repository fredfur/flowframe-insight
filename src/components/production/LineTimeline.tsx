import { useState, useMemo, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Machine, MachineStatus } from '@/types/production';
import { ChevronDown, ChevronUp, AlertTriangle, Activity, Layers, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export type TimelineStatus = MachineStatus;

export interface TimelineSegment {
  status: TimelineStatus;
  startMin: number;
  endMin: number;
}

export interface MachineTimeline {
  machineId: string;
  machineName: string;
  segments: TimelineSegment[];
}

export interface SpeedSample {
  min: number;
  speed: number;
}

const STATUS_META: Record<TimelineStatus, { label: string; colorClass: string }> = {
  running:      { label: 'Produzindo',    colorClass: 'bg-status-running' },
  fault:        { label: 'Falha',         colorClass: 'bg-status-fault' },
  shortage:     { label: 'Falta',         colorClass: 'bg-status-shortage' },
  accumulation: { label: 'Acúmulo',       colorClass: 'bg-status-accumulation' },
  scheduled:    { label: 'Programada',    colorClass: 'bg-status-scheduled' },
  setup:        { label: 'Setup',         colorClass: 'bg-status-setup' },
  disconnected: { label: 'Desconectado',  colorClass: 'bg-status-disconnected' },
};

const SHIFTS = [
  { label: '1º Turno', startMin: 6 * 60, endMin: 14 * 60 },
  { label: '2º Turno', startMin: 14 * 60, endMin: 22 * 60 },
  { label: '3º Turno', startMin: 22 * 60, endMin: 30 * 60 },
];

interface LineTimelineProps {
  machines: Machine[];
  timelines: MachineTimeline[];
  speedSamples?: SpeedSample[];
  nominalSpeed?: number;
  shiftIndex?: number;
}

function getShiftRange(shiftIdx: number) {
  const s = SHIFTS[shiftIdx] ?? SHIFTS[0];
  return { start: s.startMin, end: s.endMin, totalMin: s.endMin - s.startMin, label: s.label };
}

function formatTime(minutes: number) {
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function aggregateTimelines(timelines: MachineTimeline[], start: number, end: number): TimelineSegment[] {
  const priority: TimelineStatus[] = ['disconnected', 'fault', 'shortage', 'accumulation', 'setup', 'scheduled', 'running'];

  const worstAtMinute = (min: number): TimelineStatus => {
    let worst: TimelineStatus = 'running';
    let worstIdx = priority.indexOf('running');
    for (const tl of timelines) {
      const seg = tl.segments.find(s => s.startMin <= min && s.endMin > min);
      if (seg) {
        const idx = priority.indexOf(seg.status);
        if (idx < worstIdx) {
          worst = seg.status;
          worstIdx = idx;
        }
      }
    }
    return worst;
  };

  const result: TimelineSegment[] = [];
  let current: TimelineStatus | null = null;
  let segStart = start;

  for (let m = start; m < end; m++) {
    const s = worstAtMinute(m);
    if (s !== current) {
      if (current !== null) {
        result.push({ status: current, startMin: segStart, endMin: m });
      }
      current = s;
      segStart = m;
    }
  }
  if (current !== null) {
    result.push({ status: current, startMin: segStart, endMin: end });
  }
  return result;
}

function TimelineBar({ segments, start, totalMin, height = 'h-5' }: { segments: TimelineSegment[]; start: number; totalMin: number; height?: string }) {
  return (
    <div className={cn('w-full rounded-sm overflow-hidden flex', height)}>
      {segments.map((seg, i) => {
        const width = ((seg.endMin - seg.startMin) / totalMin) * 100;
        if (width <= 0) return null;
        return (
          <div
            key={i}
            className={cn(STATUS_META[seg.status].colorClass, 'shrink-0')}
            style={{ width: `${width}%` }}
            title={`${STATUS_META[seg.status].label}: ${formatTime(seg.startMin)} – ${formatTime(seg.endMin)}`}
          />
        );
      })}
    </div>
  );
}

function SpeedOverlay({ samples, start, totalMin, nominalSpeed, height }: {
  samples: SpeedSample[];
  start: number;
  totalMin: number;
  nominalSpeed: number;
  height: number;
}) {
  if (samples.length < 2) return null;

  const maxSpeed = nominalSpeed * 1.15;
  const filtered = samples.filter(s => s.min >= start && s.min <= start + totalMin);
  const points = filtered.map(s => ({
    x: ((s.min - start) / totalMin) * 100,
    y: height - (s.speed / maxSpeed) * height,
  }));

  if (points.length < 2) return null;

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = pathD + ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
  const nominalY = height - (nominalSpeed / maxSpeed) * height;

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      <defs>
        <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#speedGrad)" />
      <line
        x1="0" y1={nominalY} x2="100" y2={nominalY}
        stroke="hsl(var(--foreground))"
        strokeWidth="0.4"
        strokeDasharray="2 1.5"
        opacity="0.35"
        vectorEffect="non-scaling-stroke"
      />
      <path d={pathD} fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" opacity="0.3" vectorEffect="non-scaling-stroke" />
      <path d={pathD} fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.9" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

function TimeAxis({ ticks, start, totalMin }: { ticks: number[]; start: number; totalMin: number }) {
  return (
    <div className="relative h-4 mt-1">
      {ticks.map((m) => (
        <span
          key={m}
          className="absolute text-[10px] text-muted-foreground tabular-nums -translate-x-1/2"
          style={{ left: `${((m - start) / totalMin) * 100}%` }}
        >
          {formatTime(m)}
        </span>
      ))}
    </div>
  );
}

const LABEL_W = 'w-14 md:w-16';

export function LineTimeline({ machines, timelines, speedSamples, nominalSpeed, shiftIndex }: LineTimelineProps) {
  const [expanded, setExpanded] = useState(false);

  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const autoShift = SHIFTS.findIndex(s => {
    if (s.endMin > 1440) return currentMin >= s.startMin || currentMin < (s.endMin - 1440);
    return currentMin >= s.startMin && currentMin < s.endMin;
  });
  const activeShift = shiftIndex ?? (autoShift >= 0 ? autoShift : 0);
  const shiftRange = getShiftRange(activeShift);

  // Zoom state: custom window within shift
  const [zoomStart, setZoomStart] = useState<number | null>(null);
  const [zoomEnd, setZoomEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragCurrent, setDragCurrent] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const isZoomed = zoomStart !== null && zoomEnd !== null;
  const viewStart = isZoomed ? zoomStart : shiftRange.start;
  const viewEnd = isZoomed ? zoomEnd : shiftRange.end;
  const viewTotal = viewEnd - viewStart;

  const aggregated = useMemo(
    () => aggregateTimelines(timelines, viewStart, viewEnd),
    [timelines, viewStart, viewEnd]
  );

  // Compute tick interval based on zoom level
  const tickInterval = useMemo(() => {
    if (viewTotal <= 60) return 10;      // ≤1h → every 10min
    if (viewTotal <= 120) return 15;     // ≤2h → every 15min
    if (viewTotal <= 240) return 30;     // ≤4h → every 30min
    return 60;                           // full shift → every 1h
  }, [viewTotal]);

  const ticks = useMemo(() => {
    const t: number[] = [];
    const first = Math.ceil(viewStart / tickInterval) * tickInterval;
    for (let m = first; m <= viewEnd; m += tickInterval) t.push(m);
    return t;
  }, [viewStart, viewEnd, tickInterval]);

  const barHeightPx = expanded ? 28 : 32;

  // Convert mouse X to minute
  const xToMin = useCallback((clientX: number) => {
    if (!barRef.current) return viewStart;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(viewStart + pct * viewTotal);
  }, [viewStart, viewTotal]);

  // Drag-to-zoom on the bar
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(xToMin(e.clientX));
  }, [xToMin]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || dragStart === null) return;
    setDragCurrent(xToMin(e.clientX));
  }, [isDragging, dragStart, xToMin]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragging || dragStart === null) return;
    const dragEnd = xToMin(e.clientX);
    setIsDragging(false);
    const minVal = Math.min(dragStart, dragEnd);
    const maxVal = Math.max(dragStart, dragEnd);
    if (maxVal - minVal >= 10) {
      setZoomStart(minVal);
      setZoomEnd(maxVal);
    }
    setDragStart(null);
    setDragCurrent(null);
  }, [isDragging, dragStart, xToMin]);

  // Zoom in/out buttons
  const handleZoomIn = useCallback(() => {
    const center = (viewStart + viewEnd) / 2;
    const halfRange = viewTotal / 4; // zoom to 50%
    const newStart = Math.max(shiftRange.start, Math.round(center - halfRange));
    const newEnd = Math.min(shiftRange.end, Math.round(center + halfRange));
    if (newEnd - newStart >= 15) {
      setZoomStart(newStart);
      setZoomEnd(newEnd);
    }
  }, [viewStart, viewEnd, viewTotal, shiftRange]);

  const handleZoomOut = useCallback(() => {
    if (!isZoomed) return;
    const center = (viewStart + viewEnd) / 2;
    const halfRange = viewTotal; // double the range
    const newStart = Math.max(shiftRange.start, Math.round(center - halfRange));
    const newEnd = Math.min(shiftRange.end, Math.round(center + halfRange));
    if (newEnd - newStart >= shiftRange.totalMin * 0.95) {
      setZoomStart(null);
      setZoomEnd(null);
    } else {
      setZoomStart(newStart);
      setZoomEnd(newEnd);
    }
  }, [isZoomed, viewStart, viewEnd, viewTotal, shiftRange]);

  const handleReset = useCallback(() => {
    setZoomStart(null);
    setZoomEnd(null);
  }, []);

  // Drag selection overlay position
  const getDragOverlay = () => {
    if (!isDragging || dragStart === null || !barRef.current) return null;
    return dragStart;
  };

  return (
    <div className="rounded-lg border bg-card p-3 md:p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <AlertTriangle className="h-4 w-4 text-status-fault" />
          <p className="text-sm font-medium text-foreground">Visão de Status</p>
          <span className="text-xs text-muted-foreground">· {shiftRange.label}</span>
          {isZoomed && (
            <span className="text-[10px] text-primary font-medium tabular-nums">
              {formatTime(viewStart)} – {formatTime(viewEnd)}
            </span>
          )}
          {speedSamples && speedSamples.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Activity className="h-3 w-3" /> Vel. atual
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <button
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            disabled={!isZoomed}
            className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          {isZoomed && (
            <button
              onClick={handleReset}
              className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              title="Resetar zoom"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="w-px h-4 bg-border mx-1" />
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="hidden sm:inline">{expanded ? 'Recolher' : 'Por equipamento'}</span>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Zoom hint */}
      {!isZoomed && (
        <p className="text-[9px] text-muted-foreground/60 mb-1.5 hidden md:block">
          Arraste sobre a barra para zoom em faixa de tempo
        </p>
      )}

      <div>
        {/* Aggregated line row */}
        <div className="flex items-center gap-1.5 mb-1">
          <div className={cn(LABEL_W, 'shrink-0 flex items-center gap-1 justify-end')}>
            <Layers className="h-3 w-3 text-primary" />
            <span className="text-[11px] font-medium text-foreground">Linha</span>
          </div>
          <div
            ref={barRef}
            className="flex-1 relative cursor-crosshair select-none"
            style={{ height: `${barHeightPx}px` }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { if (isDragging) { setIsDragging(false); setDragStart(null); setDragCurrent(null); } }}
          >
            {ticks.map((m) => (
              <div
                key={`grid-${m}`}
                className="absolute top-0 h-full border-l border-foreground/10"
                style={{ left: `${((m - viewStart) / viewTotal) * 100}%` }}
              />
            ))}
            <TimelineBar segments={aggregated} start={viewStart} totalMin={viewTotal} height="h-full" />
            {speedSamples && nominalSpeed && (
              <SpeedOverlay
                samples={speedSamples}
                start={viewStart}
                totalMin={viewTotal}
                nominalSpeed={nominalSpeed}
                height={barHeightPx}
              />
            )}
            {/* Drag selection overlay */}
            {isDragging && dragStart !== null && dragCurrent !== null && (
              (() => {
                const selLeft = Math.min(dragStart, dragCurrent);
                const selRight = Math.max(dragStart, dragCurrent);
                const leftPct = ((selLeft - viewStart) / viewTotal) * 100;
                const widthPct = ((selRight - selLeft) / viewTotal) * 100;
                return (
                  <>
                    {/* Dimmed areas outside selection */}
                    <div
                      className="absolute top-0 h-full bg-background/60 pointer-events-none"
                      style={{ left: 0, width: `${Math.max(0, leftPct)}%` }}
                    />
                    <div
                      className="absolute top-0 h-full bg-background/60 pointer-events-none"
                      style={{ left: `${leftPct + widthPct}%`, right: 0 }}
                    />
                    {/* Selection highlight */}
                    <div
                      className="absolute top-0 h-full border-2 border-primary bg-primary/10 rounded-sm pointer-events-none"
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    />
                    {/* Time labels on selection edges */}
                    <span
                      className="absolute -top-5 text-[9px] font-medium text-primary tabular-nums -translate-x-1/2 pointer-events-none"
                      style={{ left: `${leftPct}%` }}
                    >
                      {formatTime(selLeft)}
                    </span>
                    <span
                      className="absolute -top-5 text-[9px] font-medium text-primary tabular-nums -translate-x-1/2 pointer-events-none"
                      style={{ left: `${leftPct + widthPct}%` }}
                    >
                      {formatTime(selRight)}
                    </span>
                  </>
                );
              })()
            )}
          </div>
        </div>

        {/* Expanded equipment swimlanes */}
        {expanded && timelines.map((tl) => (
          <div key={tl.machineId} className="flex items-center gap-1.5 mb-0.5">
            <span className={cn(LABEL_W, 'shrink-0 text-[10px] text-muted-foreground text-right truncate tabular-nums')}>
              {tl.machineName}
            </span>
            <div className="flex-1 relative h-3">
              {ticks.map((m) => (
                <div
                  key={`grid-eq-${tl.machineId}-${m}`}
                  className="absolute top-0 h-full border-l border-foreground/10"
                  style={{ left: `${((m - viewStart) / viewTotal) * 100}%` }}
                />
              ))}
              <TimelineBar segments={tl.segments} start={viewStart} totalMin={viewTotal} height="h-full" />
            </div>
          </div>
        ))}

        {/* Shared time axis */}
        <div className="flex items-start gap-1.5">
          <span className={cn(LABEL_W, 'shrink-0')} />
          <div className="flex-1">
            <TimeAxis ticks={ticks} start={viewStart} totalMin={viewTotal} />
          </div>
        </div>
      </div>

      {/* Minimap when zoomed — shows full shift with viewport indicator */}
      {isZoomed && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className={cn(LABEL_W, 'shrink-0')} />
          <div className="flex-1 relative h-2 rounded-sm overflow-hidden bg-muted/30 cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              const clickMin = Math.round(shiftRange.start + pct * shiftRange.totalMin);
              const halfView = viewTotal / 2;
              const newStart = Math.max(shiftRange.start, Math.round(clickMin - halfView));
              const newEnd = Math.min(shiftRange.end, newStart + viewTotal);
              setZoomStart(newEnd - viewTotal);
              setZoomEnd(newEnd);
            }}
          >
            {/* Full shift aggregated bar (tiny) */}
            <TimelineBar
              segments={aggregateTimelines(timelines, shiftRange.start, shiftRange.end)}
              start={shiftRange.start}
              totalMin={shiftRange.totalMin}
              height="h-full"
            />
            {/* Viewport indicator */}
            <div
              className="absolute top-0 h-full border border-primary/60 bg-primary/10 rounded-sm"
              style={{
                left: `${((viewStart - shiftRange.start) / shiftRange.totalMin) * 100}%`,
                width: `${(viewTotal / shiftRange.totalMin) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <span key={key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className={cn('h-2 w-3 rounded-sm', meta.colorClass)} />
            {meta.label}
          </span>
        ))}
        {speedSamples && speedSamples.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="h-[1px] w-3 bg-foreground opacity-80" />
            Vel. atual (u/h)
          </span>
        )}
        {nominalSpeed && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="h-[1px] w-3 bg-foreground opacity-40 border-t border-dashed border-foreground" />
            Nominal ({nominalSpeed} u/h)
          </span>
        )}
      </div>
    </div>
  );
}
