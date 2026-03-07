import { cn } from '@/lib/utils';
import { Machine, MachineStatus } from '@/types/production';

const statusColors: Record<MachineStatus, string> = {
  running: 'bg-status-running',
  stopped: 'bg-status-stopped',
  setup: 'bg-status-setup',
  idle: 'bg-status-idle',
};

const statusLabels: Record<MachineStatus, string> = {
  running: 'Produzindo',
  stopped: 'Parada',
  setup: 'Setup',
  idle: 'Ociosa',
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
        'relative flex flex-col rounded-lg border bg-card cursor-pointer transition-all min-w-[110px] hover:bg-accent',
        isSelected ? 'border-primary ring-1 ring-primary/20' : 'border-border',
      )}
    >
      <div className={cn('h-1 w-full rounded-t-[7px]', statusColors[machine.status])} />

      <div className="px-3 py-2 flex flex-col items-start gap-0.5">
        <span className="text-[12px] font-medium text-foreground leading-tight truncate w-full text-left">
          {machine.name}
        </span>
        <div className="flex items-center justify-between w-full mt-0.5">
          <span className="text-[11px] text-muted-foreground">DM</span>
          <span className={cn(
            'text-[13px] font-semibold tabular-nums',
            machine.oee.availability >= 90 ? 'text-oee-excellent' :
            machine.oee.availability >= 70 ? 'text-oee-warning' : 'text-oee-critical'
          )}>
            {machine.oee.availability.toFixed(0)}%
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {machine.status === 'running' ? `${machine.throughput} u/h` : statusLabels[machine.status]}
        </span>
      </div>
    </button>
  );
}
