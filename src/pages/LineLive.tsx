import { useState } from 'react';
import { mockLines, mockDLIData } from '@/data/mockData';
import { useLineStore } from '@/stores/lineStore';
import { Machine } from '@/types/production';
import { MachineNode } from '@/components/production/MachineNode';
import { FlowConnector } from '@/components/production/FlowConnector';
import { MachineDetailPanel } from '@/components/production/MachineDetailPanel';
import { LineMetricsBar } from '@/components/production/LineMetricsBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';

const vGraphConfig = {
  throughput: { label: 'Vazão', color: 'hsl(142, 60%, 50%)' },
};
const dliConfig = {
  throughput: { label: 'Vazão Real', color: 'hsl(142, 60%, 50%)' },
  target: { label: 'Meta', color: 'hsl(0, 0%, 50%)' },
};

export default function LineLive() {
  const { selectedLineId } = useLineStore();
  const line = mockLines.find(l => l.id === selectedLineId) ?? mockLines[0];
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  const sortedMachines = [...line.machines].sort((a, b) => a.position - b.position);

  // V-Graph data: throughput per machine vs nominal
  const vGraphData = sortedMachines.map(m => ({
    name: m.name.length > 8 ? m.name.slice(0, 8) + '…' : m.name,
    throughput: m.throughput,
    nominal: m.nominalSpeed,
  }));

  return (
    <div className="flex h-full gap-0">
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">{line.name}</h1>
            <p className="text-[10px] text-muted-foreground font-mono">
              {line.type} • Nominal: {line.nominalSpeed} u/h
            </p>
          </div>
        </div>

        {/* Summary Metrics */}
        <LineMetricsBar line={line} />

        {/* Flow Section */}
        <Card className="bg-card border-border">
          <CardHeader className="px-4 py-2.5 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground">
                ⛓ Fluxo de Linha
              </CardTitle>
              {/* Legend */}
              <div className="flex items-center gap-3 text-[9px]">
                <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm bg-status-running" /> Produzindo</span>
                <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm bg-status-stopped" /> Parada</span>
                <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm bg-status-setup" /> Setup</span>
                <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm bg-status-idle" /> Ociosa</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 py-3">
            <div className="flex items-start overflow-x-auto pb-2">
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
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* V-Graph */}
          <Card className="bg-card border-border">
            <CardHeader className="px-4 py-2.5 pb-1">
              <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground">
                📊 V-Graph — Vazão por Máquina
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3">
              <ChartContainer config={vGraphConfig} className="h-[200px]">
                <BarChart data={vGraphData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="throughput" fill="hsl(142, 60%, 50%)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="nominal" fill="hsl(var(--muted))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Production / DLI */}
          <Card className="bg-card border-border">
            <CardHeader className="px-4 py-2.5 pb-1">
              <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground">
                📈 Produção — Vazão ao Longo do Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3">
              <ChartContainer config={dliConfig} className="h-[200px]">
                <LineChart data={mockDLIData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" interval={3} />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="throughput" stroke="hsl(142, 60%, 50%)" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="target" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="6 3" dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedMachine && (
        <MachineDetailPanel machine={selectedMachine} onClose={() => setSelectedMachine(null)} />
      )}
    </div>
  );
}
