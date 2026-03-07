import { cn } from '@/lib/utils';
import { Machine, MachineStatus } from '@/types/production';
import { motion } from 'framer-motion';
import { Cog, AlertTriangle, Wrench, Pause } from 'lucide-react';

const statusConfig: Record<MachineStatus, { bg: string; glow: string; icon: typeof Cog; label: string }> = {
  running: { bg: 'bg-status-running', glow: 'glow-green', icon: Cog, label: 'Rodando' },
  stopped: { bg: 'bg-status-stopped', glow: 'glow-red', icon: AlertTriangle, label: 'Parada' },
  setup: { bg: 'bg-status-setup', glow: 'glow-amber', icon: Wrench, label: 'Setup' },
  idle: { bg: 'bg-status-idle', glow: '', icon: Pause, label: 'Ociosa' },
};

interface MachineNodeProps {
  machine: Machine;
  onClick: (machine: Machine) => void;
  isSelected: boolean;
}

export function MachineNode({ machine, onClick, isSelected }: MachineNodeProps) {
  const config = statusConfig[machine.status];
  const StatusIcon = config.icon;

  return (
    <motion.button
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => onClick(machine)}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-xl border-2 bg-card p-4 w-[140px] h-[120px] cursor-pointer transition-all',
        isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-muted-foreground/50',
        config.glow,
      )}
    >
      <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg mb-2', config.bg)}>
        <StatusIcon className={cn(
          'h-4 w-4',
          machine.status === 'running' ? 'text-primary-foreground animate-spin' : 'text-primary-foreground'
        )} style={machine.status === 'running' ? { animationDuration: '3s' } : {}} />
      </div>
      <span className="text-xs font-semibold text-foreground truncate w-full text-center">
        {machine.name}
      </span>
      <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
        {machine.status === 'running' ? `${machine.throughput} u/h` : config.label}
      </span>
      <div className={cn(
        'absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-card',
        config.bg,
        machine.status === 'stopped' && 'animate-pulse-status',
      )} />
    </motion.button>
  );
}
