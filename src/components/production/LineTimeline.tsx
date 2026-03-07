import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Machine, MachineStatus } from '@/types/production';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

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

/** Shared time axis rendered once below all bars */
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

// Width of the machine name labels — swimlane bars are offset by this
const LABEL_W = 'w-24';

export function LineTimeline({ machines, timelines, shiftIndex }: LineTimelineProps) {
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

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-status-fault" />
          <p className="text-sm font-medium text-foreground">Visão de Status</p>
          <span className="text-xs text-muted-foreground">· {shiftLabel}</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? 'Recolher' : 'Por equipamento'}
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* All bars share the same horizontal grid — labels offset on the left */}
      <div>
        {/* Aggregated bar */}
        <div className={cn('flex items-center gap-2', expanded && 'mb-2')}>
          {expanded && (
            <span className={cn(LABEL_W, 'shrink-0 text-[10px] text-muted-foreground text-right truncate')}>
              Linha
            </span>
          )}
          <div className="flex-1">
            <TimelineBar segments={aggregated} start={start} totalMin={totalMin} height={expanded ? 'h-5' : 'h-6'} />
          </div>
        </div>

        {/* Expanded swimlanes — same width alignment */}
        {expanded && (
          <div className="space-y-1">
            {timelines.map((tl) => (
              <div key={tl.machineId} className="flex items-center gap-2">
                <span className={cn(LABEL_W, 'shrink-0 text-[10px] text-muted-foreground text-right truncate tabular-nums')}>
                  {tl.machineName}
                </span>
                <div className="flex-1">
                  <TimelineBar segments={tl.segments} start={start} totalMin={totalMin} height="h-3.5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Single shared time axis */}
        <div className={cn('flex items-start gap-2', expanded && 'mt-0')}>
          {expanded && <span className={cn(LABEL_W, 'shrink-0')} />}
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
      </div>
    </div>
  );
}
