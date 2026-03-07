import { cn } from '@/lib/utils';
import { Transport, TransportAccumulationLevel } from '@/types/production';
import { ArrowRight } from 'lucide-react';

const accumulationMeta: Record<TransportAccumulationLevel, { label: string; color: string; bgColor: string }> = {
  empty:    { label: 'Vazio',    color: 'text-muted-foreground/50', bgColor: 'bg-muted/30' },
  low:      { label: 'Baixo',    color: 'text-status-running',      bgColor: 'bg-status-running/15' },
  normal:   { label: 'Normal',   color: 'text-status-running',      bgColor: 'bg-status-running/20' },
  high:     { label: 'Alto',     color: 'text-status-accumulation', bgColor: 'bg-status-accumulation/20' },
  critical: { label: 'Crítico',  color: 'text-status-fault',        bgColor: 'bg-status-fault/20' },
};

interface FlowConnectorProps {
  transport?: Transport;
}

export function FlowConnector({ transport }: FlowConnectorProps) {
  if (!transport) {
    return (
      <div className="flex items-center justify-center w-8 shrink-0 self-center mt-1.5">
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
      </div>
    );
  }

  const meta = accumulationMeta[transport.accumulation];
  const fillPercent = transport.accumulationPercent;

  return (
    <div className="flex flex-col items-center justify-center w-14 shrink-0 self-center mt-1.5 gap-1 px-1">
      {/* Accumulation bar */}
      <div className={cn('relative w-full h-3 rounded-full border border-border/50 overflow-hidden', meta.bgColor)}>
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
            transport.accumulation === 'critical' ? 'bg-status-fault' :
            transport.accumulation === 'high' ? 'bg-status-accumulation' :
            transport.accumulation === 'normal' ? 'bg-status-running' :
            transport.accumulation === 'low' ? 'bg-status-running/60' :
            'bg-muted-foreground/20'
          )}
          style={{ width: `${fillPercent}%` }}
        />
        {/* Flow direction arrow overlay */}
        <ArrowRight className="absolute inset-0 m-auto h-2.5 w-2.5 text-foreground/50" />
      </div>
      {/* Percentage label */}
      <span className={cn('text-[9px] tabular-nums leading-none font-medium', meta.color)}>
        {fillPercent}%
      </span>
    </div>
  );
}
