import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wifi, WifiOff, Camera, CameraOff, AlertTriangle, Info, XCircle, CheckCircle2, Terminal, Router, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// --- Mock debug data ---

type LogLevel = 'info' | 'warning' | 'error' | 'success';

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
}

interface ConnectivityEvent {
  id: string;
  timestamp: string;
  device: 'gateway' | 'camera';
  event: 'connected' | 'disconnected' | 'timeout' | 'reconnected' | 'latency_spike';
  detail: string;
  latency?: number;
}

interface ErrorSignal {
  id: string;
  timestamp: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  code: string;
  message: string;
  resolved: boolean;
}

const mockLogs: LogEntry[] = [
  { id: 'l1', timestamp: '2026-03-08T22:35:12', level: 'info', source: 'Gateway', message: 'Heartbeat recebido — latência 18ms' },
  { id: 'l2', timestamp: '2026-03-08T22:34:58', level: 'warning', source: 'Câmera', message: 'FPS caiu para 12 (mínimo esperado: 15)' },
  { id: 'l3', timestamp: '2026-03-08T22:34:30', level: 'error', source: 'Câmera', message: 'Timeout de conexão — sem resposta por 15s' },
  { id: 'l4', timestamp: '2026-03-08T22:33:45', level: 'info', source: 'SignalR', message: 'Hub reconectado ao servidor .NET' },
  { id: 'l5', timestamp: '2026-03-08T22:33:10', level: 'warning', source: 'Gateway', message: 'Pico de latência detectado: 142ms' },
  { id: 'l6', timestamp: '2026-03-08T22:32:00', level: 'success', source: 'Sistema', message: 'Sincronização de dados concluída com sucesso' },
  { id: 'l7', timestamp: '2026-03-08T22:31:20', level: 'error', source: 'Gateway', message: 'Pacote corrompido descartado (CRC inválido)' },
  { id: 'l8', timestamp: '2026-03-08T22:30:50', level: 'info', source: 'OEE Engine', message: 'Recalculando métricas — ciclo 5min' },
  { id: 'l9', timestamp: '2026-03-08T22:30:15', level: 'warning', source: 'Inspeção Visual', message: 'Resolução da câmera abaixo do ideal: 480p' },
  { id: 'l10', timestamp: '2026-03-08T22:29:40', level: 'info', source: 'Gateway', message: 'Firmware v2.4.1 — boot completo' },
  { id: 'l11', timestamp: '2026-03-08T22:28:00', level: 'error', source: 'Câmera', message: 'Desconexão inesperada — tentando reconectar' },
  { id: 'l12', timestamp: '2026-03-08T22:27:30', level: 'success', source: 'Câmera', message: 'Reconexão bem-sucedida após 3 tentativas' },
  { id: 'l13', timestamp: '2026-03-08T22:26:00', level: 'info', source: 'Sistema', message: 'Turno 3 iniciado — operadores logados: 4' },
  { id: 'l14', timestamp: '2026-03-08T22:25:10', level: 'warning', source: 'Gateway', message: 'Uso de memória: 82% — próximo do limite' },
  { id: 'l15', timestamp: '2026-03-08T22:24:00', level: 'info', source: 'SignalR', message: 'Clientes conectados: 7' },
];

const mockConnectivity: ConnectivityEvent[] = [
  { id: 'c1', timestamp: '2026-03-08T22:35:12', device: 'gateway', event: 'connected', detail: 'Heartbeat OK', latency: 18 },
  { id: 'c2', timestamp: '2026-03-08T22:34:30', device: 'camera', event: 'timeout', detail: 'Sem resposta por 15s' },
  { id: 'c3', timestamp: '2026-03-08T22:33:10', device: 'gateway', event: 'latency_spike', detail: 'Latência 142ms (limite: 100ms)', latency: 142 },
  { id: 'c4', timestamp: '2026-03-08T22:28:00', device: 'camera', event: 'disconnected', detail: 'Perda total de sinal' },
  { id: 'c5', timestamp: '2026-03-08T22:27:30', device: 'camera', event: 'reconnected', detail: 'Reconexão após 3 tentativas', latency: 45 },
  { id: 'c6', timestamp: '2026-03-08T22:20:00', device: 'gateway', event: 'connected', detail: 'Boot completo — firmware v2.4.1', latency: 12 },
  { id: 'c7', timestamp: '2026-03-08T22:15:00', device: 'gateway', event: 'disconnected', detail: 'Reinício programado' },
  { id: 'c8', timestamp: '2026-03-08T22:10:00', device: 'camera', event: 'connected', detail: 'Streaming iniciado — 24 FPS', latency: 28 },
  { id: 'c9', timestamp: '2026-03-08T21:55:00', device: 'gateway', event: 'latency_spike', detail: 'Latência 230ms — rede instável', latency: 230 },
  { id: 'c10', timestamp: '2026-03-08T21:40:00', device: 'camera', event: 'timeout', detail: 'Frame drop — buffer overflow' },
];

const mockErrors: ErrorSignal[] = [
  { id: 'e1', timestamp: '2026-03-08T22:34:30', severity: 'critical', source: 'ESP32-CAM', code: 'CAM_TIMEOUT', message: 'Câmera sem resposta — possível falha de hardware', resolved: false },
  { id: 'e2', timestamp: '2026-03-08T22:33:10', severity: 'high', source: 'Gateway ESP32', code: 'GW_LAT_SPIKE', message: 'Latência acima do limiar (142ms > 100ms)', resolved: false },
  { id: 'e3', timestamp: '2026-03-08T22:31:20', severity: 'medium', source: 'Gateway ESP32', code: 'GW_CRC_FAIL', message: 'Pacote com CRC inválido descartado', resolved: true },
  { id: 'e4', timestamp: '2026-03-08T22:28:00', severity: 'critical', source: 'ESP32-CAM', code: 'CAM_DISCONN', message: 'Desconexão inesperada da câmera', resolved: true },
  { id: 'e5', timestamp: '2026-03-08T22:25:10', severity: 'medium', source: 'Gateway ESP32', code: 'GW_MEM_HIGH', message: 'Uso de memória em 82% — risco de crash', resolved: false },
  { id: 'e6', timestamp: '2026-03-08T21:55:00', severity: 'high', source: 'Gateway ESP32', code: 'GW_NET_UNSTABLE', message: 'Rede instável — latência 230ms', resolved: true },
  { id: 'e7', timestamp: '2026-03-08T21:40:00', severity: 'low', source: 'ESP32-CAM', code: 'CAM_BUF_OVERFLOW', message: 'Buffer overflow — frames descartados', resolved: true },
];

// --- Helpers ---

const levelConfig: Record<LogLevel, { icon: typeof Info; color: string; label: string }> = {
  info: { icon: Info, color: 'text-muted-foreground', label: 'Info' },
  warning: { icon: AlertTriangle, color: 'text-status-setup', label: 'Aviso' },
  error: { icon: XCircle, color: 'text-destructive', label: 'Erro' },
  success: { icon: CheckCircle2, color: 'text-status-running', label: 'OK' },
};

const eventConfig: Record<ConnectivityEvent['event'], { color: string; label: string }> = {
  connected: { color: 'bg-status-running/15 text-status-running border-status-running/30', label: 'Conectado' },
  disconnected: { color: 'bg-destructive/15 text-destructive border-destructive/30', label: 'Desconectado' },
  timeout: { color: 'bg-destructive/15 text-destructive border-destructive/30', label: 'Timeout' },
  reconnected: { color: 'bg-status-setup/15 text-status-setup border-status-setup/30', label: 'Reconectado' },
  latency_spike: { color: 'bg-status-setup/15 text-status-setup border-status-setup/30', label: 'Pico Latência' },
};

const severityConfig: Record<ErrorSignal['severity'], { color: string; label: string }> = {
  critical: { color: 'bg-destructive/15 text-destructive border-destructive/30', label: 'Crítico' },
  high: { color: 'bg-status-setup/15 text-status-setup border-status-setup/30', label: 'Alto' },
  medium: { color: 'bg-status-scheduled/15 text-status-scheduled border-status-scheduled/30', label: 'Médio' },
  low: { color: 'bg-muted text-muted-foreground border-border', label: 'Baixo' },
};

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// --- Components ---

export default function Debug() {
  const [logFilter, setLogFilter] = useState<LogLevel | 'all'>('all');

  const filteredLogs = logFilter === 'all' ? mockLogs : mockLogs.filter(l => l.level === logFilter);
  const unresolvedErrors = mockErrors.filter(e => !e.resolved).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
          <Terminal className="h-4 w-4 text-destructive" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Debug</h1>
          <p className="text-xs text-muted-foreground">Logs, conectividade e sinais de erro — acesso restrito</p>
        </div>
        <Badge variant="outline" className="ml-auto gap-1 border-destructive/30 text-destructive text-[10px]">
          <Shield className="h-3 w-3" />
          Admin
        </Badge>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Logs (última hora)" value={String(mockLogs.length)} icon={Terminal} />
        <SummaryCard label="Erros não resolvidos" value={String(unresolvedErrors)} icon={XCircle} variant={unresolvedErrors > 0 ? 'danger' : 'default'} />
        <SummaryCard label="Gateway" value="Online" sub="18ms" icon={Wifi} variant="success" />
        <SummaryCard label="Câmera" value="Offline" sub="2 min" icon={CameraOff} variant="danger" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="logs" className="space-y-3">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="logs" className="text-xs gap-1.5">
            <Terminal className="h-3.5 w-3.5" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="connectivity" className="text-xs gap-1.5">
            <Router className="h-3.5 w-3.5" />
            Conectividade
          </TabsTrigger>
          <TabsTrigger value="errors" className="text-xs gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Erros
            {unresolvedErrors > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] text-destructive-foreground font-bold">
                {unresolvedErrors}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* LOGS TAB */}
        <TabsContent value="logs" className="space-y-3">
          <div className="flex gap-1.5">
            {(['all', 'error', 'warning', 'info', 'success'] as const).map(level => (
              <button
                key={level}
                onClick={() => setLogFilter(level)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors border',
                  logFilter === level
                    ? 'bg-accent text-accent-foreground border-border'
                    : 'text-muted-foreground border-transparent hover:bg-accent/50'
                )}
              >
                {level === 'all' ? 'Todos' : levelConfig[level].label}
              </button>
            ))}
          </div>
          <ScrollArea className="h-[420px] rounded-lg border border-border/50">
            <div className="font-mono text-[11px]">
              {filteredLogs.map(log => {
                const cfg = levelConfig[log.level];
                const Icon = cfg.icon;
                return (
                  <div key={log.id} className="flex items-start gap-2 px-3 py-1.5 border-b border-border/30 hover:bg-accent/30 transition-colors">
                    <Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', cfg.color)} />
                    <span className="text-muted-foreground shrink-0 tabular-nums">{formatTime(log.timestamp)}</span>
                    <span className="text-muted-foreground shrink-0">[{log.source}]</span>
                    <span className="text-foreground">{log.message}</span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* CONNECTIVITY TAB */}
        <TabsContent value="connectivity" className="space-y-3">
          <ScrollArea className="h-[420px] rounded-lg border border-border/50">
            <div className="divide-y divide-border/30">
              {mockConnectivity.map(evt => {
                const ecfg = eventConfig[evt.event];
                const isGw = evt.device === 'gateway';
                const DeviceIcon = isGw ? (evt.event === 'disconnected' || evt.event === 'timeout' ? WifiOff : Wifi)
                  : (evt.event === 'disconnected' || evt.event === 'timeout' ? CameraOff : Camera);
                return (
                  <div key={evt.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/30 transition-colors">
                    <DeviceIcon className={cn('h-4 w-4 shrink-0',
                      evt.event === 'connected' || evt.event === 'reconnected' ? 'text-status-running' :
                      evt.event === 'disconnected' || evt.event === 'timeout' ? 'text-destructive' :
                      'text-status-setup'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">{isGw ? 'Gateway ESP32' : 'ESP32-CAM'}</span>
                        <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 h-4 border', ecfg.color)}>
                          {ecfg.label}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{evt.detail}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-muted-foreground tabular-nums">{formatTime(evt.timestamp)}</span>
                      {evt.latency !== undefined && (
                        <p className={cn('text-[10px] tabular-nums font-medium',
                          evt.latency > 100 ? 'text-status-setup' : 'text-status-running'
                        )}>
                          {evt.latency}ms
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ERRORS TAB */}
        <TabsContent value="errors" className="space-y-3">
          <ScrollArea className="h-[420px] rounded-lg border border-border/50">
            <div className="divide-y divide-border/30">
              {mockErrors.map(err => {
                const scfg = severityConfig[err.severity];
                return (
                  <div key={err.id} className={cn(
                    'flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-accent/30',
                    err.resolved && 'opacity-50'
                  )}>
                    <AlertTriangle className={cn('h-4 w-4 mt-0.5 shrink-0',
                      err.severity === 'critical' ? 'text-destructive' :
                      err.severity === 'high' ? 'text-status-setup' :
                      'text-muted-foreground'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 h-4 border', scfg.color)}>
                          {scfg.label}
                        </Badge>
                        <code className="text-[10px] text-muted-foreground font-mono">{err.code}</code>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{err.source}</span>
                        {err.resolved && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-status-running/30 text-status-running bg-status-running/10">
                            Resolvido
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-foreground mt-1">{err.message}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">{formatTime(err.timestamp)}</span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Summary card ---

function SummaryCard({ label, value, sub, icon: Icon, variant = 'default' }: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Info;
  variant?: 'default' | 'success' | 'danger';
}) {
  return (
    <div className="flex flex-col justify-center rounded-lg border border-border/50 px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={cn('h-3 w-3',
          variant === 'success' ? 'text-status-running' :
          variant === 'danger' ? 'text-destructive' :
          'text-muted-foreground'
        )} />
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={cn('text-lg font-semibold tabular-nums',
          variant === 'success' ? 'text-status-running' :
          variant === 'danger' ? 'text-destructive' :
          'text-foreground'
        )}>
          {value}
        </span>
        {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}
