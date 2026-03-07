import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Machine, MachineStatus } from '@/types/production';
import { ChevronDown, ChevronUp, AlertTriangle, Activity, Layers } from 'lucide-react';

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

/** Speed samples over time for overlay */
export interface SpeedSample {
  min: number; // minute from midnight
  speed: number; // u/h
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

/** SVG sparkline overlay for speed on top of the aggregated bar */
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
  // Area fill path (close to bottom)
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
      {/* Area fill — subtle gradient under the line */}
      <path d={areaD} fill="url(#speedGrad)" />
      {/* Nominal speed reference */}
      <line
        x1="0" y1={nominalY} x2="100" y2={nominalY}
        stroke="hsl(var(--foreground))"
        strokeWidth="0.4"
        strokeDasharray="2 1.5"
        opacity="0.35"
        vectorEffect="non-scaling-stroke"
      />
      {/* Speed line — thicker, white, with slight glow */}
      <path
        d={pathD}
        fill="none"
        stroke="hsl(var(--foreground))"
        strokeWidth="2"
        opacity="0.3"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={pathD}
        fill="none"
        stroke="hsl(var(--foreground))"
        strokeWidth="1.5"
        opacity="0.9"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
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

const LABEL_W = 'w-28';

export function LineTimeline({ machines, timelines, speedSamples, nominalSpeed, shiftIndex }: LineTimelineProps) {
  const [expanded, setExpanded] = useState(false);

  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const autoShift = SHIFTS.findIndex(s => {
    if (s.endMin > 1440) return currentMin >= s.startMin || currentMin < (s.endMin - 1440);
    return currentMin >= s.startMin && currentMin < s.endMin;
  });
  const activeShift = shiftIndex ?? (autoShift >= 0 ? autoShift : 0);
  const { start, end, totalMin, label: shiftLabel } = getShiftRange(activeShift);

  const aggregated = useMemo(
    () => aggregateTimelines(timelines, start, end),
    [timelines, start, end]
  );

  const ticks = useMemo(() => {
    const t: number[] = [];
    const firstHour = Math.ceil(start / 60) * 60;
    for (let m = firstHour; m <= end; m += 60) t.push(m);
    return t;
  }, [start, end]);

  const barHeightPx = expanded ? 28 : 32;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-status-fault" />
          <p className="text-sm font-medium text-foreground">Visão de Status</p>
          <span className="text-xs text-muted-foreground">· {shiftLabel}</span>
          {speedSamples && speedSamples.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground ml-2">
              <Activity className="h-3 w-3" /> Vel. atual
            </span>
          )}
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? 'Recolher' : 'Por equipamento'}
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div>
        {/* Aggregated line bar — with speed overlay */}
        <div className={cn('flex items-center gap-2', expanded && 'mb-2')}>
          <div className={cn(LABEL_W, 'shrink-0 flex items-center gap-1.5 justify-end')}>
            <Layers className="h-3 w-3 text-primary" />
            <span className="text-[11px] font-medium text-foreground">Linha</span>
          </div>
          <div className="flex-1 relative" style={{ height: `${barHeightPx}px` }}>
            <TimelineBar segments={aggregated} start={start} totalMin={totalMin} height="h-full" />
            {speedSamples && nominalSpeed && (
              <SpeedOverlay
                samples={speedSamples}
                start={start}
                totalMin={totalMin}
                nominalSpeed={nominalSpeed}
                height={barHeightPx}
              />
            )}
          </div>
        </div>

        {/* Expanded equipment swimlanes */}
        {expanded && (
          <div className="space-y-1 border-l-2 border-border ml-[6.5rem] pl-0">
            {timelines.map((tl) => (
              <div key={tl.machineId} className="flex items-center gap-2">
                <span className={cn('w-[5.5rem] shrink-0 text-[10px] text-muted-foreground text-right truncate tabular-nums pr-2')}>
                  {tl.machineName}
                </span>
                <div className="flex-1">
                  <TimelineBar segments={tl.segments} start={start} totalMin={totalMin} height="h-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Shared time axis */}
        <div className="flex items-start gap-2">
          <span className={cn(LABEL_W, 'shrink-0')} />
          <div className="flex-1">
            <TimeAxis ticks={ticks} start={start} totalMin={totalMin} />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <span key={key} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className={cn('h-2 w-3 rounded-sm', meta.colorClass)} />
            {meta.label}
          </span>
        ))}
        {speedSamples && speedSamples.length > 0 && (
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="h-[1px] w-3 bg-foreground opacity-80" />
            Vel. atual (u/h)
          </span>
        )}
        {nominalSpeed && (
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="h-[1px] w-3 bg-foreground opacity-40 border-t border-dashed border-foreground" />
            Nominal ({nominalSpeed} u/h)
          </span>
        )}
      </div>
    </div>
  );
}
