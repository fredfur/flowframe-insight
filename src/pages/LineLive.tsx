import { useState } from 'react';
import { mockLines, mockDLIData } from '@/data/mockData';
import { useLineStore } from '@/stores/lineStore';
import { Machine } from '@/types/production';
import { MachineNode } from '@/components/production/MachineNode';
import { FlowConnector } from '@/components/production/FlowConnector';
import { MachineDetailPanel } from '@/components/production/MachineDetailPanel';
import { LineMetricsBar } from '@/components/production/LineMetricsBar';
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

  const vGraphData = sortedMachines.map(m => ({
    name: m.name.length > 8 ? m.name.slice(0, 8) + '…' : m.name,
    throughput: m.throughput,
    nominal: m.nominalSpeed,
  }));

  return (
    <div className="flex h-full gap-0">
      <div className="flex-1 flex flex-col gap-5 min-w-0 overflow-y-auto">
        <div>
          <h1 className="text-base font-semibold text-foreground">{line.name}</h1>
          <p className="text-[11px] text-muted-foreground">
            {line.type} · Nominal: {line.nominalSpeed} u/h
          </p>
        </div>

        <LineMetricsBar line={line} />

        {/* Flow */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] text-muted-foreground">Fluxo de Linha</p>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-sm bg-status-running" /> Produzindo</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-sm bg-status-stopped" /> Parada</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-sm bg-status-setup" /> Setup</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-sm bg-status-idle" /> Ociosa</span>
            </div>
          </div>
          <div className="flex items-start overflow-x-auto pb-2 rounded-lg border bg-card p-3">
            {sortedMachines.map((machine, i) => (
              <div key={machine.id} className="flex items-start">
                <MachineNode
                  machine={machine}
                  onClick={setSelectedMachine}
                  isSelected={selectedMachine?.id === machine.id}
                />
                {i < sortedMachines.length - 1 && <FlowConnector />}
              </div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-[11px] text-muted-foreground mb-3">V-Graph — Vazão por Máquina</p>
            <ChartContainer config={vGraphConfig} className="h-[180px]">
              <BarChart data={vGraphData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="throughput" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="nominal" fill="hsl(var(--muted))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <p className="text-[11px] text-muted-foreground mb-3">Produção — Vazão ao Longo do Dia</p>
            <ChartContainer config={dliConfig} className="h-[180px]">
              <LineChart data={mockDLIData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" interval={3} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="throughput" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={{ r: 1.5 }} />
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
