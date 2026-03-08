import { ProductionLine } from '@/types/production';

interface LineMetricsBarProps {
  line: ProductionLine;
}

export function LineMetricsBar({ line }: LineMetricsBarProps) {
  const runningCount = line.machines.filter(m => m.status === 'running').length;
  const stoppedCount = line.machines.filter(m => ['fault', 'shortage', 'accumulation'].includes(m.status)).length;
  const setupCount = line.machines.filter(m => m.status === 'setup').length;
  const otherCount = line.machines.filter(m => ['scheduled', 'disconnected'].includes(m.status)).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <MetricCard label="OEE" value={`${line.oee.oee.toFixed(1)}%`} highlight={line.oee.oee >= 70} />
      <MetricCard label="Vazão" value={`${line.throughput}`} sub="u/h" highlight />
      <MetricCard label="Disponibilidade" value={`${line.oee.availability.toFixed(1)}%`} />
      <MetricCard label="Performance" value={`${line.oee.performance.toFixed(1)}%`} />
      <div className="flex items-center gap-4 rounded-lg border bg-card px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-status-running" /> {runningCount}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-status-stopped" /> {stoppedCount}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-status-setup" /> {setupCount}
        </span>
        {otherCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-status-disconnected" /> {otherCount}
          </span>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col justify-center rounded-lg border bg-card px-3 py-2.5">
      <span className="text-xs text-muted-foreground mb-0.5">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-semibold tabular-nums ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}
