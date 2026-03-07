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

const vGraphConfig = {
  throughput: { label: 'Vazão', color: 'hsl(var(--primary))' },
};
const dliConfig = {
  throughput: { label: 'Vazão Real', color: 'hsl(var(--primary))' },
  target: { label: 'Meta', color: 'hsl(var(--muted-foreground))' },
};

export default function LineLive() {
  const { selectedLineId } = useLineStore();
  const line = mockLines.find(l => l.id === selectedLineId) ?? mockLines[0];
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

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
    <div className="flex h-full gap-0">
      <div className="flex-1 flex flex-col gap-6 min-w-0 overflow-y-auto">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{line.name}</h1>
          <p className="text-sm text-muted-foreground">
            {line.type} · Nominal: {line.nominalSpeed} u/h
          </p>
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
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-foreground">Fluxo de Linha</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-status-running" /> Produzindo</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-status-fault" /> Falha</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-status-shortage" /> Falta</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-status-accumulation" /> Acúmulo</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-status-scheduled" /> Programada</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-status-setup" /> Setup</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-status-disconnected" /> Desconectado</span>
            </div>
          </div>
          <div className="flex items-stretch gap-0 overflow-x-auto pb-2 rounded-lg border bg-card p-4 w-full">
            {flowNodes.map((node, i) => {
              // Find transport between this node and next
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
                <Bar dataKey="nominal" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
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

      {selectedMachine && (
        <MachineDetailPanel machine={selectedMachine} onClose={() => setSelectedMachine(null)} />
      )}
    </div>
  );
}
