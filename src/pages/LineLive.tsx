import { useState, useMemo } from 'react';
import { mockLines, mockDLIData, mockTimelines, mockSpeedSamples } from '@/data/mockData';
import { useLineStore } from '@/stores/lineStore';
import { Machine } from '@/types/production';
import { FlowNode } from '@/components/production/FlowNode';
import { FlowConnector } from '@/components/production/FlowConnector';
import { MachineDetailPanel } from '@/components/production/MachineDetailPanel';
import { LineMetricsBar } from '@/components/production/LineMetricsBar';
import { LineTimeline } from '@/components/production/LineTimeline';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { AIInsightChips, MOCK_LINELIVE_INSIGHTS } from '@/components/ai/AIInsights';
import { useNavigate } from 'react-router-dom';

const vGraphConfig = {
  throughput: { label: 'Vazão Real', color: 'hsl(var(--primary))' },
  nominal: { label: 'Vel. Nominal', color: 'hsl(var(--muted-foreground))' },
};
const dliConfig = {
  throughput: { label: 'Vazão Real', color: 'hsl(var(--primary))' },
  target: { label: 'Meta', color: 'hsl(var(--muted-foreground))' },
};

export default function LineLive() {
  const { selectedLineId } = useLineStore();
  const line = mockLines.find(l => l.id === selectedLineId) ?? mockLines[0];
  const navigate = useNavigate();

  const sortedMachines = [...line.machines].sort((a, b) => a.position - b.position);

  // Group machines by position for parallel node support
  const flowNodes = useMemo(() => {
    const positionMap = new Map<number, Machine[]>();
    sortedMachines.forEach(m => {
      const existing = positionMap.get(m.position) || [];
      existing.push(m);
      positionMap.set(m.position, existing);
    });
    return Array.from(positionMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([position, machines]) => ({ position, machines }));
  }, [sortedMachines]);

  const vGraphData = sortedMachines.map(m => ({
    name: m.name.length > 8 ? m.name.slice(0, 8) + '…' : m.name,
    throughput: m.throughput,
    nominal: m.nominalSpeed,
  }));

  return (
    <div className="flex flex-col gap-4 md:gap-6 overflow-y-auto">
      <div className="flex flex-col gap-4 md:gap-6 min-w-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{line.name}</h1>
            <p className="text-sm text-muted-foreground">
              {line.type} · Nominal: {line.nominalSpeed} u/h
            </p>
          </div>
          <AIInsightChips insights={MOCK_LINELIVE_INSIGHTS} onAskAI={() => navigate('/assistente')} />
        </div>

        <LineMetricsBar line={line} />

        <LineTimeline
          machines={sortedMachines}
          timelines={mockTimelines[line.id] ?? []}
          speedSamples={mockSpeedSamples[line.id]}
          nominalSpeed={line.nominalSpeed}
        />

        {/* Flow */}
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-sm font-medium text-foreground">Fluxo de Linha</p>
            <div className="hidden lg:flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-status-running" /> Produzindo</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-status-fault" /> Falha</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-status-shortage" /> Falta</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-status-accumulation" /> Acúmulo</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-status-scheduled" /> Programada</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-status-setup" /> Setup</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-status-disconnected" /> Desconectado</span>
            </div>
          </div>

          {/* Desktop: horizontal flow */}
          <div className="hidden lg:flex items-stretch gap-0 overflow-x-auto pb-2 rounded-lg border bg-card p-4 w-full">
            {flowNodes.map((node, i) => {
              const nextNode = flowNodes[i + 1];
              const transport = nextNode
                ? line.transports.find(t => t.fromPosition === node.position && t.toPosition === nextNode.position)
                : undefined;

              return (
                <div key={node.position} className="flex items-center flex-1 min-w-0">
                  <FlowNode
                    machines={node.machines}
                    selectedMachineId={selectedMachine?.id}
                    onMachineClick={setSelectedMachine}
                  />
                  {i < flowNodes.length - 1 && <FlowConnector transport={transport} />}
                </div>
              );
            })}
          </div>

          {/* Mobile: vertical stacked flow */}
          <div className="lg:hidden rounded-lg border bg-card p-3 space-y-1">
            {flowNodes.map((node, i) => {
              const nextNode = flowNodes[i + 1];
              const transport = nextNode
                ? line.transports.find(t => t.fromPosition === node.position && t.toPosition === nextNode.position)
                : undefined;

              return (
                <div key={node.position}>
                  {/* Machine card — compact row for mobile */}
                  {node.machines.map(machine => (
                    <MobileFlowCard
                      key={machine.id}
                      machine={machine}
                      isSelected={selectedMachine?.id === machine.id}
                      onClick={() => setSelectedMachine(machine)}
                    />
                  ))}
                  {/* Transport connector — vertical */}
                  {transport && i < flowNodes.length - 1 && (
                    <MobileTransportConnector percent={transport.accumulationPercent} accumulation={transport.accumulation} />
                  )}
                </div>
              );
            })}
          </div>
        </div>


        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium text-foreground mb-4">V-Graph — Vazão por Máquina</p>
            <ChartContainer config={vGraphConfig} className="h-[200px] w-full">
              <BarChart data={vGraphData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="throughput" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="nominal" fill="hsl(var(--muted-foreground) / 0.45)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium text-foreground mb-4">Produção — Vazão ao Longo do Dia</p>
            <ChartContainer config={dliConfig} className="h-[200px] w-full">
              <LineChart data={mockDLIData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" interval={3} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="throughput" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="target" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="6 3" dot={false} />
              </LineChart>
            </ChartContainer>
          </div>
        </div>
      </div>

      <MachineDetailPanel machine={selectedMachine} onClose={() => setSelectedMachine(null)} />
    </div>
  );
}

// --- Mobile-specific subcomponents ---

import { cn } from '@/lib/utils';
import { TransportAccumulationLevel, MachineStatus } from '@/types/production';
import { ArrowDown } from 'lucide-react';

const mobileStatusColors: Record<MachineStatus, string> = {
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

function MobileFlowCard({ machine, isSelected, onClick }: { machine: Machine; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 rounded-lg border bg-background p-2.5 transition-all',
        isSelected ? 'border-primary ring-1 ring-primary/20' : 'border-border',
      )}
    >
      <div className={cn('w-1 h-8 rounded-full shrink-0', mobileStatusColors[machine.status])} />
      <div className="flex-1 min-w-0 text-left">
        <p className="text-xs font-medium text-foreground truncate">{machine.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {machine.status === 'running' ? `${machine.throughput} u/h` : statusLabels[machine.status]}
        </p>
      </div>
      <span className={cn(
        'text-sm font-semibold tabular-nums shrink-0',
        machine.oee.availability >= 90 ? 'text-oee-excellent' :
        machine.oee.availability >= 70 ? 'text-oee-warning' : 'text-oee-critical'
      )}>
        {machine.oee.availability.toFixed(0)}%
      </span>
    </button>
  );
}

function MobileTransportConnector({ percent, accumulation }: { percent: number; accumulation: TransportAccumulationLevel }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1">
      <div className="relative w-16 h-2 rounded-full border border-border/50 overflow-hidden bg-muted/20">
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full',
            accumulation === 'critical' ? 'bg-status-fault' :
            accumulation === 'high' ? 'bg-status-accumulation' :
            accumulation === 'normal' ? 'bg-status-running' :
            accumulation === 'low' ? 'bg-status-running/60' :
            'bg-muted-foreground/20'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <ArrowDown className="h-3 w-3 text-muted-foreground/40" />
      <span className={cn(
        'text-[9px] tabular-nums font-medium',
        accumulation === 'critical' ? 'text-status-fault' :
        accumulation === 'high' ? 'text-status-accumulation' : 'text-muted-foreground'
      )}>
        {percent}%
      </span>
    </div>
  );
}
