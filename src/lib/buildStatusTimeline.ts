/**
 * Constrói timelines de status (Linha e por equipamento) a partir de paradas e do
 * status atual das máquinas, para refletir na Visão de Status.
 */
import type { Machine, MachineStatus } from '@/types/production';
import type { Stop, StopCategory } from '@/types/production';
import type { MachineTimeline, TimelineSegment } from '@/components/production/LineTimeline';

const SHIFTS = [
  { startMin: 6 * 60, endMin: 14 * 60 },
  { startMin: 14 * 60, endMin: 22 * 60 },
  { startMin: 22 * 60, endMin: 30 * 60 },
];

const VALID_STATUSES: MachineStatus[] = ['running', 'fault', 'shortage', 'accumulation', 'scheduled', 'setup', 'disconnected'];

function normalizeStatus(s: string | undefined): MachineStatus {
  const lower = (s ?? 'running').toString().toLowerCase();
  return (VALID_STATUSES.includes(lower as MachineStatus) ? lower : 'running') as MachineStatus;
}

function stopCategoryToStatus(cat: StopCategory): MachineStatus {
  switch (cat) {
    case 'setup': return 'setup';
    case 'material_shortage': case 'operator_absence': return 'shortage';
    case 'planned': return 'scheduled';
    case 'maintenance': case 'quality_issue': case 'other':
    default: return 'fault';
  }
}

/** Data/hora de início do turno no calendário (para o turno atual). */
function getShiftStartEndDates(shiftIndex: number): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setSeconds(0, 0);
  const s = SHIFTS[shiftIndex] ?? SHIFTS[0];
  const totalMin = s.endMin - s.startMin;
  if (s.endMin > 24 * 60) {
    // 3º turno (22:00–06:00)
    if (now.getHours() < 6) {
      start.setDate(start.getDate() - 1);
      start.setHours(22, 0, 0);
    } else {
      start.setHours(22, 0, 0);
    }
  } else {
    start.setHours(Math.floor(s.startMin / 60), s.startMin % 60, 0);
  }
  const end = new Date(start.getTime() + totalMin * 60 * 1000);
  return { start, end };
}

/** Converte Date para minuto na escala do turno (startMin .. endMin). */
function dateToShiftMinute(d: Date, shiftStart: Date, shiftStartMin: number, shiftEndMin: number): number {
  const minSinceStart = (d.getTime() - shiftStart.getTime()) / 60000;
  const m = shiftStartMin + minSinceStart;
  return Math.max(shiftStartMin, Math.min(shiftEndMin, Math.round(m)));
}

/** Minuto atual na escala do turno (startMin .. endMin). */
function nowInShiftScale(shiftIndex: number): number {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const currentMinOfDay = h * 60 + m;
  const s = SHIFTS[shiftIndex] ?? SHIFTS[0];
  if (s.endMin > 24 * 60) {
    if (currentMinOfDay < 6 * 60) return 1440 + currentMinOfDay;
    if (currentMinOfDay >= 22 * 60) return currentMinOfDay;
    return s.startMin;
  }
  return currentMinOfDay >= s.startMin && currentMinOfDay < s.endMin
    ? currentMinOfDay
    : s.startMin;
}

/**
 * Constrói MachineTimeline[] para a Visão de Status: segmentos vindos das paradas
 * e do status atual das máquinas (preenche até ao fim do turno com o status atual).
 */
export function buildTimelinesFromStopsAndMachines(
  machines: Machine[],
  stops: Stop[],
  shiftIndex: number
): MachineTimeline[] {
  const shift = SHIFTS[shiftIndex] ?? SHIFTS[0];
  const { start: shiftStart, end: shiftEnd } = getShiftStartEndDates(shiftIndex);
  const nowMin = nowInShiftScale(shiftIndex);

  return machines.map((machine) => {
    const machineStops = stops
      .filter((s) => s.machineId === machine.id)
      .map((s) => {
        const startMin = dateToShiftMinute(
          new Date(s.startTime),
          shiftStart,
          shift.startMin,
          shift.endMin
        );
        const endMin = s.endTime
          ? dateToShiftMinute(new Date(s.endTime), shiftStart, shift.startMin, shift.endMin)
          : Math.min(nowMin, shift.endMin);
        return { startMin, endMin, status: stopCategoryToStatus(s.category) };
      })
      .filter((seg) => seg.endMin > seg.startMin)
      .sort((a, b) => a.startMin - b.startMin);

    const segments: TimelineSegment[] = [];
    let pos = shift.startMin;
    const currentStatus = normalizeStatus(machine.status);

    for (const stop of machineStops) {
      if (stop.startMin > pos) {
        segments.push({ status: 'running', startMin: pos, endMin: stop.startMin });
      }
      segments.push({
        status: stop.status,
        startMin: stop.startMin,
        endMin: stop.endMin,
      });
      pos = stop.endMin;
    }
    if (pos < shift.endMin) {
      segments.push({ status: 'running', startMin: pos, endMin: shift.endMin });
    }

    // Cortar segmentos em nowMin e usar status atual até ao fim do turno
    const result: TimelineSegment[] = [];
    for (const seg of segments) {
      if (seg.endMin <= nowMin) {
        result.push(seg);
      } else if (seg.startMin < nowMin) {
        result.push({ ...seg, endMin: nowMin });
        result.push({ status: currentStatus, startMin: nowMin, endMin: shift.endMin });
        break;
      } else {
        result.push({ status: currentStatus, startMin: nowMin, endMin: shift.endMin });
        break;
      }
    }
    if (result.length === 0 || result[result.length - 1].endMin < shift.endMin) {
      result.push({ status: currentStatus, startMin: nowMin, endMin: shift.endMin });
    }

    return {
      machineId: machine.id,
      machineName: machine.name,
      segments: mergeAdjacentSegments(result),
    };
  });
}

function mergeAdjacentSegments(segments: TimelineSegment[]): TimelineSegment[] {
  if (segments.length <= 1) return segments;
  const out: TimelineSegment[] = [segments[0]];
  for (let i = 1; i < segments.length; i++) {
    const prev = out[out.length - 1];
    const cur = segments[i];
    if (prev.status === cur.status && prev.endMin === cur.startMin) {
      out[out.length - 1] = { ...prev, endMin: cur.endMin };
    } else {
      out.push(cur);
    }
  }
  return out;
}
