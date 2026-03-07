import { mockLines, mockOEEHistory, mockDLIData, mockParetoData } from '@/data/mockData';
import { OEEGauge } from '@/components/production/OEEGauge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Factory, TrendingUp, AlertTriangle, Zap } from 'lucide-react';

const oeeChartConfig = {
  oee: { label: 'OEE', color: 'hsl(142, 60%, 50%)' },
  availability: { label: 'Disponibilidade', color: 'hsl(200, 80%, 50%)' },
  performance: { label: 'Performance', color: 'hsl(38, 95%, 55%)' },
  quality: { label: 'Qualidade', color: 'hsl(280, 60%, 55%)' },
};

const dliChartConfig = {
  throughput: { label: 'Vazão Real', color: 'hsl(142, 60%, 50%)' },
  target: { label: 'Meta', color: 'hsl(0, 0%, 50%)' },
};

const paretoConfig = {
  minutes: { label: 'Minutos', color: 'hsl(0, 72%, 55%)' },
};

export default function Dashboard() {
  const totalOEE = mockLines.reduce((sum, l) => sum + l.oee.oee, 0) / mockLines.length;
  const totalThroughput = mockLines.reduce((sum, l) => sum + l.throughput, 0);
  const totalStoppedMachines = mockLines.reduce((sum, l) => sum + l.machines.filter(m => m.status === 'stopped').length, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-foreground">Dashboard do Gestor</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Factory} label="Linhas Ativas" value={String(mockLines.length)} delay={0} />
        <SummaryCard icon={TrendingUp} label="OEE Médio" value={`${totalOEE.toFixed(1)}%`} delay={0.1} />
        <SummaryCard icon={Zap} label="Vazão Total" value={`${totalThroughput} u/h`} delay={0.2} />
        <SummaryCard icon={AlertTriangle} label="Máquinas Paradas" value={String(totalStoppedMachines)} delay={0.3} destructive={totalStoppedMachines > 0} />
      </div>

      {/* OEE per line */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mockLines.map((line) => (
          <Card key={line.id} className="bg-card border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-semibold">{line.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex items-center gap-6">
              <OEEGauge value={line.oee.oee} label="OEE" size="md" />
              <div className="grid grid-cols-3 gap-3 flex-1">
                <OEEGauge value={line.oee.availability} label="Disp." size="sm" />
                <OEEGauge value={line.oee.performance} label="Perf." size="sm" />
                <OEEGauge value={line.oee.quality} label="Qual." size="sm" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* OEE History */}
        <Card className="bg-card border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">OEE — Última Semana</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ChartContainer config={oeeChartConfig} className="h-[250px]">
              <AreaChart data={mockOEEHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="oee" stroke="hsl(142, 60%, 50%)" fill="hsl(142, 60%, 50%)" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="availability" stroke="hsl(200, 80%, 50%)" fill="transparent" strokeWidth={1} strokeDasharray="4 2" />
                <Area type="monotone" dataKey="performance" stroke="hsl(38, 95%, 55%)" fill="transparent" strokeWidth={1} strokeDasharray="4 2" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* DLI / Throughput */}
        <Card className="bg-card border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Vazão (DLI) — Hoje</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ChartContainer config={dliChartConfig} className="h-[250px]">
              <LineChart data={mockDLIData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="throughput" stroke="hsl(142, 60%, 50%)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="target" stroke="hsl(0, 0%, 50%)" strokeWidth={1} strokeDasharray="6 3" dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pareto */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold">Pareto de Paradas — Tempo Total (min)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ChartContainer config={paretoConfig} className="h-[250px]">
              <BarChart data={mockParetoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="minutes" fill="hsl(0, 72%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, delay, destructive }: {
  icon: typeof Factory; label: string; value: string; delay: number; destructive?: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="bg-card border-border">
        <CardContent className="p-4 flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${destructive ? 'bg-destructive/10' : 'bg-primary/10'}`}>
            <Icon className={`h-5 w-5 ${destructive ? 'text-destructive' : 'text-primary'}`} />
          </div>
          <div>
            <p className="text-2xl font-mono font-bold text-foreground">{value}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
