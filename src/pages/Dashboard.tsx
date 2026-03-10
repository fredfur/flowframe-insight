import { useState, useMemo } from 'react';
import { mockLines, mockOEEHistory, mockDLIData, mockParetoData, mockStops } from '@/data/mockData';
import { OEEGauge } from '@/components/production/OEEGauge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area } from 'recharts';
import { Factory, TrendingUp, AlertTriangle, Zap } from 'lucide-react';
import { AIInsightChips, MOCK_DASHBOARD_INSIGHTS } from '@/components/ai/AIInsights';
import { useNavigate } from 'react-router-dom';
import { DashboardFilters, DEFAULT_FILTERS, type DashboardFilterValues } from '@/components/dashboard/DashboardFilters';

const oeeChartConfig = {
  oee: { label: 'OEE', color: 'hsl(var(--primary))' },
  availability: { label: 'Disponibilidade', color: 'hsl(200 70% 50%)' },
  performance: { label: 'Performance', color: 'hsl(38 90% 55%)' },
  quality: { label: 'Qualidade', color: 'hsl(280 60% 55%)' },
};

const dliChartConfig = {
  throughput: { label: 'Vazão Real', color: 'hsl(var(--primary))' },
  target: { label: 'Meta', color: 'hsl(var(--muted-foreground))' },
};

const paretoConfig = {
  minutes: { label: 'Minutos', color: 'hsl(var(--destructive))' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const totalOEE = mockLines.reduce((sum, l) => sum + l.oee.oee, 0) / mockLines.length;
  const totalThroughput = mockLines.reduce((sum, l) => sum + l.throughput, 0);
  const totalStoppedMachines = mockLines.reduce((sum, l) => sum + l.machines.filter(m => m.status !== 'running').length, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-base font-semibold text-foreground">Dashboard</h1>
        <AIInsightChips insights={MOCK_DASHBOARD_INSIGHTS} onAskAI={() => navigate('/assistente')} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <SummaryCard icon={Factory} label="Linhas Ativas" value={String(mockLines.length)} />
        <SummaryCard icon={TrendingUp} label="OEE Médio" value={`${totalOEE.toFixed(1)}%`} />
        <SummaryCard icon={Zap} label="Vazão Total" value={`${totalThroughput} u/h`} />
        <SummaryCard icon={AlertTriangle} label="Máquinas Paradas" value={String(totalStoppedMachines)} destructive={totalStoppedMachines > 0} />
      </div>

      {/* OEE per line */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {mockLines.map((line) => (
          <div key={line.id} className="rounded-lg border bg-card p-4">
            <p className="text-[12px] font-medium text-foreground mb-3">{line.name}</p>
            <div className="flex items-center gap-5">
              <OEEGauge value={line.oee.oee} label="OEE" size="md" />
              <div className="grid grid-cols-3 gap-2 flex-1">
                <OEEGauge value={line.oee.availability} label="Disp." size="sm" />
                <OEEGauge value={line.oee.performance} label="Perf." size="sm" />
                <OEEGauge value={line.oee.quality} label="Qual." size="sm" />
              </div>
            </div>
          </div>
        ))}
      </div>


      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-[11px] text-muted-foreground mb-3">OEE — Última Semana</p>
          <ChartContainer config={oeeChartConfig} className="h-[220px] w-full">
            <AreaChart data={mockOEEHistory} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="oee" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.08} strokeWidth={1.5} />
              <Area type="monotone" dataKey="availability" stroke="hsl(200 70% 50%)" fill="transparent" strokeWidth={1} strokeDasharray="4 2" />
              <Area type="monotone" dataKey="performance" stroke="hsl(38 90% 55%)" fill="transparent" strokeWidth={1} strokeDasharray="4 2" />
            </AreaChart>
          </ChartContainer>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-[11px] text-muted-foreground mb-3">Vazão (DLI) — Hoje</p>
          <ChartContainer config={dliChartConfig} className="h-[220px] w-full">
            <LineChart data={mockDLIData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="throughput" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="target" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="6 3" dot={false} />
            </LineChart>
          </ChartContainer>
        </div>

        <div className="rounded-lg border bg-card p-4 lg:col-span-2">
          <p className="text-[11px] text-muted-foreground mb-3">Pareto de Paradas — Tempo Total (min)</p>
          <ChartContainer config={paretoConfig} className="h-[220px] w-full">
            <BarChart data={mockParetoData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="category" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="minutes" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, destructive }: {
  icon: typeof Factory; label: string; value: string; destructive?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
      <div className={`flex h-8 w-8 items-center justify-center rounded-md ${destructive ? 'bg-destructive/10' : 'bg-primary/10'}`}>
        <Icon className={`h-4 w-4 ${destructive ? 'text-destructive' : 'text-primary'}`} />
      </div>
      <div>
        <p className="text-lg font-semibold tabular-nums text-foreground">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
