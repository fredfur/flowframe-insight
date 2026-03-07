import { cn } from '@/lib/utils';
import { Machine, MachineStatus } from '@/types/production';
import { motion } from 'framer-motion';

const statusColors: Record<MachineStatus, string> = {
  running: 'bg-status-running',
  stopped: 'bg-status-stopped',
  setup: 'bg-status-setup',
  idle: 'bg-status-idle',
};

const statusBorders: Record<MachineStatus, string> = {
  running: 'border-status-running/60',
  stopped: 'border-status-stopped/60',
  setup: 'border-status-setup/60',
  idle: 'border-status-idle/60',
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
    <motion.button
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={() => onClick(machine)}
      className={cn(
        'relative flex flex-col rounded-lg border-2 bg-card cursor-pointer transition-colors min-w-[120px]',
        isSelected ? 'border-primary ring-2 ring-primary/20' : statusBorders[machine.status],
      )}
    >
      {/* Status color bar at top */}
      <div className={cn('h-1.5 w-full rounded-t-[5px]', statusColors[machine.status])} />

      <div className="px-3 py-2.5 flex flex-col items-start gap-1">
        <span className="text-[11px] font-semibold text-foreground leading-tight truncate w-full text-left">
          {machine.name}
        </span>
        <div className="flex items-center justify-between w-full">
          <span className="text-[10px] text-muted-foreground font-mono">DM</span>
          <span className={cn(
            'text-sm font-mono font-bold',
            machine.oee.availability >= 90 ? 'text-oee-excellent' :
            machine.oee.availability >= 70 ? 'text-oee-warning' : 'text-oee-critical'
          )}>
            {machine.oee.availability.toFixed(0)}%
          </span>
        </div>
        <span className="text-[9px] text-muted-foreground font-mono">
          {machine.status === 'running' ? `${machine.throughput} u/h` : statusLabels[machine.status]}
        </span>
      </div>

      {/* Status dot */}
      <div className={cn(
        'absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-card',
        statusColors[machine.status],
        machine.status === 'stopped' && 'animate-pulse-status',
      )} />
    </motion.button>
  );
}
