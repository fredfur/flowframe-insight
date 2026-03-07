import { cn } from '@/lib/utils';
import { Machine, MachineStatus } from '@/types/production';

const statusColors: Record<MachineStatus, string> = {
  running: 'bg-status-running',
  fault: 'bg-status-fault',
  shortage: 'bg-status-shortage',
  accumulation: 'bg-status-accumulation',
  scheduled: 'bg-status-scheduled',
  setup: 'bg-status-setup',
  disconnected: 'bg-status-disconnected',
};

const statusLabels: Record<MachineStatus, string> = {
  running: 'Produzindo',
  fault: 'Falha',
  shortage: 'Falta',
  accumulation: 'Acúmulo',
  scheduled: 'Programada',
  setup: 'Setup',
  disconnected: 'Desconectado',
};

interface MachineNodeProps {
  machine: Machine;
  onClick: (machine: Machine) => void;
  isSelected: boolean;
}

export function MachineNode({ machine, onClick, isSelected }: MachineNodeProps) {
  return (
    <button
      onClick={() => onClick(machine)}
      className={cn(
        'relative flex flex-col rounded-lg border bg-background cursor-pointer transition-all w-full min-w-[100px] hover:bg-accent',
        isSelected ? 'border-primary ring-1 ring-primary/20' : 'border-border',
      )}
    >
      <div className={cn('h-1.5 w-full rounded-t-[7px]', statusColors[machine.status])} />

      <div className="px-3 py-2.5 flex flex-col items-start gap-1">
        <span className="text-xs font-medium text-foreground leading-tight truncate w-full text-left">
          {machine.name}
        </span>
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-muted-foreground">DM</span>
          <span className={cn(
            'text-sm font-semibold tabular-nums',
            machine.oee.availability >= 90 ? 'text-oee-excellent' :
            machine.oee.availability >= 70 ? 'text-oee-warning' : 'text-oee-critical'
          )}>
            {machine.oee.availability.toFixed(0)}%
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {machine.status === 'running' ? `${machine.throughput} u/h` : statusLabels[machine.status]}
        </span>
      </div>
    </button>
  );
}
