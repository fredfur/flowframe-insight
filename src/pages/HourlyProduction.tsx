import { useState, useMemo } from 'react';
import { mockLines, mockDLIData } from '@/data/mockData';
import { useLineStore } from '@/stores/lineStore';
import { STOP_CATEGORIES, StopCategory } from '@/types/production';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Clock, Pencil, Save, TrendingUp, TrendingDown, AlertTriangle, Package, Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Cell } from 'recharts';

interface HourlyRecord {
  hour: string;        // "06:00"
  produced: number;
  target: number;
  scrap: number;
  stops: HourlyEvent[];
}

interface HourlyEvent {
  id: string;
  type: 'stop' | 'quality' | 'observation';
  category?: StopCategory;
  description: string;
  durationMin: number;
}

function generateMockHourlyData(lineId: string): HourlyRecord[] {
  const nominalSpeed = lineId === 'line-1' ? 500 : 300;
  const records: HourlyRecord[] = [];
  for (let h = 6; h < 22; h++) {
    const hour = `${String(h).padStart(2, '0')}:00`;
    const hasMajorStop = h === 8 || h === 14;
    const hasMinorStop = h === 11 || h === 17;
    const target = nominalSpeed;
    const stopMinutes = hasMajorStop ? 25 : hasMinorStop ? 10 : 0;
    const efficiency = hasMajorStop ? 0.4 : hasMinorStop ? 0.75 : 0.85 + Math.random() * 0.12;
    const produced = Math.round(target * efficiency * ((60 - stopMinutes) / 60));
    const scrap = Math.round(produced * (0.01 + Math.random() * 0.02));

    const stops: HourlyEvent[] = [];
    if (hasMajorStop) {
      stops.push({
        id: `ev-${lineId}-${h}-1`,
        type: 'stop',
        category: h === 8 ? 'maintenance' : 'setup',
        description: h === 8 ? 'Troca de componente no alimentador' : 'Setup para novo SKU',
        durationMin: 25,
      });
    }
    if (hasMinorStop) {
      stops.push({
        id: `ev-${lineId}-${h}-1`,
        type: 'stop',
        category: 'material_shortage',
        description: 'Aguardando reposição de material',
        durationMin: 10,
      });
    }
    if (h === 10) {
      stops.push({
        id: `ev-${lineId}-${h}-q`,
        type: 'quality',
        description: 'Lote com variação dimensional detectada',
        durationMin: 0,
      });
    }

    records.push({ hour, produced, target, scrap, stops });
  }
  return records;
}

const chartConfig = {
  produced: { label: 'Produzido', color: 'hsl(var(--primary))' },
};

export default function HourlyProduction() {
  const { selectedLineId } = useLineStore();
  const line = mockLines.find(l => l.id === selectedLineId) ?? mockLines[0];

  const [records, setRecords] = useState<HourlyRecord[]>(() => generateMockHourlyData(selectedLineId));
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [eventDialog, setEventDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HourlyRecord | null>(null);
  const [editingEvent, setEditingEvent] = useState<HourlyEvent | null>(null);
  const [editingEventHour, setEditingEventHour] = useState<string>('');

  // Edit record form
  const [formProduced, setFormProduced] = useState('');
  const [formScrap, setFormScrap] = useState('');

  // Event form
  const [evType, setEvType] = useState<'stop' | 'quality' | 'observation'>('stop');
  const [evCategory, setEvCategory] = useState<string>('');
  const [evDescription, setEvDescription] = useState('');
  const [evDuration, setEvDuration] = useState('');

  const totalProduced = records.reduce((s, r) => s + r.produced, 0);
  const totalTarget = records.reduce((s, r) => s + r.target, 0);
  const totalScrap = records.reduce((s, r) => s + r.scrap, 0);
  const totalStopMin = records.reduce((s, r) => s + r.stops.reduce((ss, ev) => ss + ev.durationMin, 0), 0);
  const fulfillment = totalTarget > 0 ? ((totalProduced / totalTarget) * 100).toFixed(1) : '0';

  const openEditRecord = (record: HourlyRecord) => {
    setEditingRecord(record);
    setFormProduced(String(record.produced));
    setFormScrap(String(record.scrap));
    setEditDialog(true);
  };

  const saveRecord = () => {
    if (!editingRecord) return;
    setRecords(prev => prev.map(r => r.hour === editingRecord.hour ? {
      ...r,
      produced: Number(formProduced) || 0,
      scrap: Number(formScrap) || 0,
    } : r));
    setEditDialog(false);
  };

  const openCreateEvent = (hour: string) => {
    setEditingEvent(null);
    setEditingEventHour(hour);
    setEvType('stop');
    setEvCategory('');
    setEvDescription('');
    setEvDuration('');
    setEventDialog(true);
  };

  const openEditEvent = (hour: string, event: HourlyEvent) => {
    setEditingEvent(event);
    setEditingEventHour(hour);
    setEvType(event.type);
    setEvCategory(event.category ?? '');
    setEvDescription(event.description);
    setEvDuration(String(event.durationMin));
    setEventDialog(true);
  };

  const saveEvent = () => {
    const ev: HourlyEvent = {
      id: editingEvent?.id ?? `ev-${Date.now()}`,
      type: evType,
      category: evType === 'stop' ? (evCategory as StopCategory) : undefined,
      description: evDescription,
      durationMin: Number(evDuration) || 0,
    };
    setRecords(prev => prev.map(r => {
      if (r.hour !== editingEventHour) return r;
      if (editingEvent) {
        return { ...r, stops: r.stops.map(e => e.id === editingEvent.id ? ev : e) };
      }
      return { ...r, stops: [...r.stops, ev] };
    }));
    setEventDialog(false);
  };

  const deleteEvent = (hour: string, eventId: string) => {
    setRecords(prev => prev.map(r => r.hour === hour ? { ...r, stops: r.stops.filter(e => e.id !== eventId) } : r));
  };

  const chartData = records.map(r => ({
    hour: r.hour,
    produced: r.produced,
    target: r.target,
    pct: r.target > 0 ? r.produced / r.target : 0,
  }));

  return (
    <div className="flex flex-col gap-4 overflow-y-auto">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Produção Hora a Hora</h1>
        <p className="text-sm text-muted-foreground">{line.name} · {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <SummaryCard icon={Package} label="Produzido" value={totalProduced.toLocaleString('pt-BR')} />
        <SummaryCard icon={Target} label="Meta" value={totalTarget.toLocaleString('pt-BR')} />
        <SummaryCard icon={TrendingUp} label="Atendimento"
          value={`${fulfillment}%`}
          color={Number(fulfillment) >= 90 ? 'text-oee-excellent' : Number(fulfillment) >= 70 ? 'text-oee-warning' : 'text-oee-critical'}
        />
        <SummaryCard icon={AlertTriangle} label="Refugo" value={totalScrap.toLocaleString('pt-BR')} color="text-status-fault" />
        <SummaryCard icon={Clock} label="Paradas" value={`${totalStopMin} min`} />
      </div>

      {/* Chart */}
      <div className="rounded-lg border bg-card p-4">
        <p className="text-sm font-medium text-foreground mb-3">Produção vs Meta por Hora</p>
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="hour" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ReferenceLine y={line.nominalSpeed} stroke="hsl(var(--muted-foreground))" strokeDasharray="6 3" strokeWidth={1} />
            <Bar dataKey="produced" radius={[3, 3, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.pct >= 0.9 ? 'hsl(var(--primary))' : entry.pct >= 0.7 ? 'hsl(38, 95%, 55%)' : 'hsl(0, 72%, 51%)'} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      {/* Hourly table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="grid grid-cols-[70px_1fr_1fr_80px_80px_auto] gap-2 px-4 py-2 border-b bg-muted/30 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          <span>Hora</span>
          <span>Produzido</span>
          <span>Meta</span>
          <span>Refugo</span>
          <span>%</span>
          <span className="text-right">Eventos</span>
        </div>

        {records.map(record => {
          const pct = record.target > 0 ? (record.produced / record.target) * 100 : 0;
          const isExpanded = selectedHour === record.hour;
          const hasEvents = record.stops.length > 0;

          return (
            <div key={record.hour} className="border-b last:border-b-0">
              <div
                className={cn(
                  'grid grid-cols-[70px_1fr_1fr_80px_80px_auto] gap-2 px-4 py-2.5 items-center cursor-pointer transition-colors',
                  isExpanded ? 'bg-primary/5' : 'hover:bg-muted/20',
                )}
                onClick={() => setSelectedHour(isExpanded ? null : record.hour)}
              >
                <span className="text-sm font-medium tabular-nums text-foreground">{record.hour}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm tabular-nums text-foreground">{record.produced.toLocaleString('pt-BR')}</span>
                  <div className="flex-1 max-w-[100px] h-1.5 rounded-full bg-muted/30 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        pct >= 90 ? 'bg-status-running' : pct >= 70 ? 'bg-status-accumulation' : 'bg-status-fault',
                      )}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">{record.target.toLocaleString('pt-BR')}</span>
                <span className={cn('text-sm tabular-nums', record.scrap > 0 ? 'text-status-fault' : 'text-muted-foreground')}>
                  {record.scrap}
                </span>
                <span className={cn(
                  'text-sm font-medium tabular-nums',
                  pct >= 90 ? 'text-oee-excellent' : pct >= 70 ? 'text-oee-warning' : 'text-oee-critical',
                )}>
                  {pct.toFixed(0)}%
                </span>
                <div className="flex items-center gap-1 justify-end">
                  {hasEvents && (
                    <Badge variant="secondary" className="text-[9px] gap-0.5">
                      <AlertTriangle className="h-2.5 w-2.5" /> {record.stops.length}
                    </Badge>
                  )}
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); openEditRecord(record); }}>
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              {/* Expanded events */}
              {isExpanded && (
                <div className="px-4 pb-3 pt-1 bg-muted/10 space-y-1.5">
                  {record.stops.length === 0 && (
                    <p className="text-[11px] text-muted-foreground italic">Nenhum evento registrado nesta hora.</p>
                  )}
                  {record.stops.map(ev => {
                    const cat = ev.category ? STOP_CATEGORIES.find(c => c.id === ev.category) : null;
                    return (
                      <div key={ev.id} className="flex items-center justify-between px-3 py-2 rounded-md bg-card border">
                        <div className="flex items-center gap-2 min-w-0">
                          {ev.type === 'stop' && <AlertTriangle className="h-3 w-3 text-status-fault shrink-0" />}
                          {ev.type === 'quality' && <TrendingDown className="h-3 w-3 text-status-accumulation shrink-0" />}
                          {ev.type === 'observation' && <Clock className="h-3 w-3 text-muted-foreground shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium text-foreground truncate">{ev.description}</p>
                            <div className="flex items-center gap-2">
                              {cat && <span className="text-[9px]" style={{ color: cat.color }}>{cat.label}</span>}
                              {ev.durationMin > 0 && <span className="text-[9px] text-muted-foreground">{ev.durationMin} min</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditEvent(record.hour, ev)}>
                            <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteEvent(record.hour, ev.id)}>
                            <span className="text-destructive text-xs">×</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <Button variant="outline" size="sm" className="w-full text-[10px] h-7 gap-1 mt-1" onClick={() => openCreateEvent(record.hour)}>
                    + Adicionar Evento
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit record dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Editar Produção — {editingRecord?.hour}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-[11px]">Quantidade Produzida</Label>
              <Input type="number" value={formProduced} onChange={e => setFormProduced(e.target.value)} className="h-8 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-[11px]">Refugo</Label>
              <Input type="number" value={formScrap} onChange={e => setFormScrap(e.target.value)} className="h-8 text-sm mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditDialog(false)} className="text-xs">Cancelar</Button>
            <Button size="sm" onClick={saveRecord} className="text-xs gap-1"><Save className="h-3 w-3" /> Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event dialog */}
      <Dialog open={eventDialog} onOpenChange={setEventDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editingEvent ? 'Editar Evento' : 'Novo Evento'} — {editingEventHour}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-[11px]">Tipo</Label>
              <Select value={evType} onValueChange={v => setEvType(v as any)}>
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stop">Parada</SelectItem>
                  <SelectItem value="quality">Qualidade</SelectItem>
                  <SelectItem value="observation">Observação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {evType === 'stop' && (
              <div>
                <Label className="text-[11px]">Categoria</Label>
                <Select value={evCategory} onValueChange={setEvCategory}>
                  <SelectTrigger className="h-8 text-sm mt-1">
                    <SelectValue placeholder="Selecionar categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {STOP_CATEGORIES.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-[11px]">Descrição</Label>
              <Textarea rows={2} value={evDescription} onChange={e => setEvDescription(e.target.value)} placeholder="Detalhes..." className="mt-1" />
            </div>
            <div>
              <Label className="text-[11px]">Duração (min)</Label>
              <Input type="number" value={evDuration} onChange={e => setEvDuration(e.target.value)} placeholder="0" className="h-8 text-sm mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEventDialog(false)} className="text-xs">Cancelar</Button>
            <Button size="sm" onClick={saveEvent} disabled={!evDescription.trim()} className="text-xs gap-1">
              <Save className="h-3 w-3" /> {editingEvent ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('h-3.5 w-3.5', color ?? 'text-muted-foreground')} />
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <p className={cn('text-lg font-semibold', color ?? 'text-foreground')}>{value}</p>
    </div>
  );
}
