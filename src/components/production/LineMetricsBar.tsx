import { ProductionLine } from '@/types/production';

interface LineMetricsBarProps {
  line: ProductionLine;
}

export function LineMetricsBar({ line }: LineMetricsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <MetricCard label="OEE" value={`${line.oee.oee.toFixed(1)}%`} sub="acum. turno" highlight={line.oee.oee >= 70} />
      <MetricCard label="Vazão instantânea" value={`${line.throughput}`} sub="u/h" highlight />
      <MetricCard label="Disponibilidade" value={`${line.oee.availability.toFixed(1)}%`} sub="acum. turno" />
      <MetricCard label="Performance" value={`${line.oee.performance.toFixed(1)}%`} sub="acum. turno" />
    </div>
  );
}

function MetricCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col justify-center rounded-lg border border-border/50 px-3 py-2.5">
      <span className="text-xs text-muted-foreground mb-0.5">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-semibold tabular-nums ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}
