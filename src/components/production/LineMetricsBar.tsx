import { ProductionLine } from '@/types/production';
import { OEEGauge } from './OEEGauge';
import { Activity, Zap, CheckCircle, Clock } from 'lucide-react';

interface LineMetricsBarProps {
  line: ProductionLine;
}

export function LineMetricsBar({ line }: LineMetricsBarProps) {
  const runningCount = line.machines.filter(m => m.status === 'running').length;
  const stoppedCount = line.machines.filter(m => m.status === 'stopped').length;

  return (
    <div className="flex flex-wrap items-center gap-6 rounded-xl border border-border bg-card p-4">
      <OEEGauge value={line.oee.oee} label="OEE" size="sm" />

      <div className="h-10 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <div>
          <p className="text-lg font-mono font-bold text-foreground">{line.throughput}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">u/h Vazão</p>
        </div>
      </div>

      <div className="h-10 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-lg font-mono font-bold text-foreground">{line.oee.availability.toFixed(1)}%</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Disponibilidade</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-lg font-mono font-bold text-foreground">{line.oee.performance.toFixed(1)}%</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Performance</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-lg font-mono font-bold text-foreground">{line.oee.quality.toFixed(1)}%</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Qualidade</p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-status-running" /> {runningCount} rodando
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-status-stopped" /> {stoppedCount} parada{stoppedCount !== 1 && 's'}
        </span>
      </div>
    </div>
  );
}
