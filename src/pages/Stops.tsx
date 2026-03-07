import { useState, useMemo } from 'react';
import { mockStops, mockLines } from '@/data/mockData';
import { useLineStore } from '@/stores/lineStore';
import { STOP_CATEGORIES, Stop, StopCategory } from '@/types/production';
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
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertTriangle, Plus, Clock, Filter, Search, Pencil, StopCircle,
  Timer, BarChart3, ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SortField = 'startTime' | 'duration' | 'category';
type SortDir = 'asc' | 'desc';

export default function Stops() {
  const { selectedLineId } = useLineStore();
  const line = mockLines.find(l => l.id === selectedLineId) ?? mockLines[0];

  const [stops, setStops] = useState<Stop[]>(mockStops);
  const lineStops = stops.filter(s => s.lineId === selectedLineId);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'closed'>('all');
  const [sortField, setSortField] = useState<SortField>('startTime');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<Stop | null>(null);
  const [formMachine, setFormMachine] = useState('');
  const [formCategory, setFormCategory] = useState<string>('');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Detail sheet
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);

  const openCreate = () => {
    setEditingStop(null);
    setFormMachine('');
    setFormCategory('');
    setFormStart(new Date().toISOString().slice(0, 16));
    setFormEnd('');
    setFormNotes('');
    setDialogOpen(true);
  };

  const openEdit = (stop: Stop) => {
    setEditingStop(stop);
    setFormMachine(stop.machineId);
    setFormCategory(stop.category);
    setFormStart(stop.startTime.slice(0, 16));
    setFormEnd(stop.endTime?.slice(0, 16) ?? '');
    setFormNotes(stop.notes);
    setDialogOpen(true);
  };

  const handleSave = () => {
    const machine = line.machines.find(m => m.id === formMachine);
    if (!machine || !formCategory) return;

    const endTime = formEnd || null;
    const duration = endTime
      ? Math.round((new Date(endTime).getTime() - new Date(formStart).getTime()) / 60000)
      : null;

    if (editingStop) {
      const updated = {
        ...editingStop,
        machineId: formMachine,
        machineName: machine.name,
        category: formCategory as StopCategory,
        startTime: formStart,
        endTime,
        duration,
        notes: formNotes,
      };
      setStops(prev => prev.map(s => s.id === editingStop.id ? updated : s));
      if (selectedStop?.id === editingStop.id) setSelectedStop(updated);
    } else {
      const newStop: Stop = {
        id: `s-${Date.now()}`,
        machineId: formMachine,
        machineName: machine.name,
        lineId: selectedLineId,
        category: formCategory as StopCategory,
        startTime: formStart,
        endTime,
        duration,
        notes: formNotes,
        registeredBy: 'operador@fabrica.com',
      };
      setStops(prev => [newStop, ...prev]);
    }
    setDialogOpen(false);
  };

  const handleCloseStop = (stop: Stop) => {
    const now = new Date().toISOString();
    const duration = Math.round((new Date(now).getTime() - new Date(stop.startTime).getTime()) / 60000);
    const updated = { ...stop, endTime: now, duration };
    setStops(prev => prev.map(s => s.id === stop.id ? updated : s));
    if (selectedStop?.id === stop.id) setSelectedStop(updated);
  };

  // Filtered + sorted
  const filtered = useMemo(() => {
    let result = lineStops;
    if (filterCategory !== 'all') result = result.filter(s => s.category === filterCategory);
    if (filterStatus === 'active') result = result.filter(s => !s.endTime);
    if (filterStatus === 'closed') result = result.filter(s => !!s.endTime);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.machineName.toLowerCase().includes(term) ||
        s.notes.toLowerCase().includes(term) ||
        STOP_CATEGORIES.find(c => c.id === s.category)?.label.toLowerCase().includes(term)
      );
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'startTime') cmp = new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      else if (sortField === 'duration') cmp = (a.duration ?? Infinity) - (b.duration ?? Infinity);
      else if (sortField === 'category') cmp = a.category.localeCompare(b.category);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [lineStops, filterCategory, filterStatus, searchTerm, sortField, sortDir]);

  const activeCount = lineStops.filter(s => !s.endTime).length;
  const totalDuration = lineStops.reduce((acc, s) => acc + (s.duration ?? 0), 0);
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    lineStops.forEach(s => map.set(s.category, (map.get(s.category) ?? 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [lineStops]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />;
  };

  return (
    <div className="flex flex-col gap-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Registro de Paradas</h1>
          <p className="text-sm text-muted-foreground">{line.name}</p>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Nova Parada
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard icon={AlertTriangle} label="Ativas" value={String(activeCount)} color="text-status-fault" />
        <SummaryCard icon={Clock} label="Total Paradas" value={String(lineStops.length)} />
        <SummaryCard icon={Timer} label="Tempo Total" value={`${totalDuration} min`} />
        <SummaryCard icon={BarChart3} label="Maior Causa" value={
          categoryBreakdown[0] ? STOP_CATEGORIES.find(c => c.id === categoryBreakdown[0][0])?.label ?? '—' : '—'
        } />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar máquina, nota..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {STOP_CATEGORIES.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="closed">Encerradas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[120px_1fr_140px_80px_72px] gap-0 px-4 py-2.5 border-b bg-muted/40 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          <button className="flex items-center gap-1 hover:text-foreground transition-colors text-left" onClick={() => toggleSort('startTime')}>
            Horário <SortIcon field="startTime" />
          </button>
          <span>Máquina / Nota</span>
          <button className="flex items-center gap-1 hover:text-foreground transition-colors" onClick={() => toggleSort('category')}>
            Categoria <SortIcon field="category" />
          </button>
          <button className="flex items-center gap-1 hover:text-foreground transition-colors text-right justify-end" onClick={() => toggleSort('duration')}>
            Duração <SortIcon field="duration" />
          </button>
          <span className="text-right">Ações</span>
        </div>

        {filtered.length === 0 && (
          <p className="px-4 py-8 text-sm text-muted-foreground text-center">Nenhuma parada encontrada.</p>
        )}

        {filtered.map(stop => {
          const cat = STOP_CATEGORIES.find(c => c.id === stop.category);
          const isActive = !stop.endTime;
          return (
            <div
              key={stop.id}
              className={cn(
                'grid grid-cols-[120px_1fr_140px_80px_72px] gap-0 px-4 py-3 border-b last:border-b-0 items-center cursor-pointer transition-colors',
                isActive ? 'bg-destructive/5 hover:bg-destructive/10' : 'hover:bg-muted/20',
                selectedStop?.id === stop.id && 'bg-primary/5',
              )}
              onClick={() => setSelectedStop(stop)}
            >
              {/* Time */}
              <div className="text-sm tabular-nums text-foreground font-medium">
                {new Date(stop.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                {stop.endTime && (
                  <span className="text-muted-foreground font-normal"> — {new Date(stop.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                )}
              </div>

              {/* Machine + notes */}
              <div className="min-w-0 pr-3">
                <p className="text-sm font-medium text-foreground truncate">{stop.machineName}</p>
                {stop.notes && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{stop.notes}</p>}
              </div>

              {/* Category */}
              <div>
                <Badge variant="outline" style={{ borderColor: cat?.color, color: cat?.color }} className="text-[10px]">
                  {cat?.label}
                </Badge>
              </div>

              {/* Duration */}
              <div className="text-right">
                {isActive ? (
                  <Badge variant="destructive" className="text-[10px]">Ativa</Badge>
                ) : (
                  <span className="text-sm tabular-nums text-muted-foreground">{stop.duration} min</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 justify-end" onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(stop)}>
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </Button>
                {isActive && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCloseStop(stop)}>
                    <StopCircle className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedStop} onOpenChange={(open) => !open && setSelectedStop(null)}>
        <SheetContent className="w-[360px] sm:w-[400px] p-0">
          {selectedStop && (
            <StopDetail
              stop={selectedStop}
              onEdit={() => openEdit(selectedStop)}
              onCloseStop={() => handleCloseStop(selectedStop)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {editingStop ? 'Editar Parada' : 'Registrar Nova Parada'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-[11px]">Máquina</Label>
              <Select value={formMachine} onValueChange={setFormMachine}>
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue placeholder="Selecionar máquina" />
                </SelectTrigger>
                <SelectContent>
                  {line.machines.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px]">Categoria</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px]">Início</Label>
                <Input type="datetime-local" value={formStart} onChange={e => setFormStart(e.target.value)} className="h-8 text-sm mt-1" />
              </div>
              <div>
                <Label className="text-[11px]">Fim (opcional)</Label>
                <Input type="datetime-local" value={formEnd} onChange={e => setFormEnd(e.target.value)} className="h-8 text-sm mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-[11px]">Observações</Label>
              <Textarea rows={3} value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="Detalhes da parada..." className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} className="text-xs">Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={!formMachine || !formCategory} className="text-xs">
              {editingStop ? 'Salvar' : 'Registrar'}
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

function StopDetail({ stop, onEdit, onCloseStop }: {
  stop: Stop;
  onEdit: () => void;
  onCloseStop: () => void;
}) {
  const cat = STOP_CATEGORIES.find(c => c.id === stop.category);
  const isActive = !stop.endTime;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <SheetHeader className="px-6 py-5 border-b">
        <SheetTitle className="text-base">Detalhes da Parada</SheetTitle>
      </SheetHeader>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {isActive && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs font-medium text-destructive">Parada em andamento</span>
          </div>
        )}

        <DetailField label="Máquina" value={stop.machineName} />

        <DetailField label="Categoria">
          <Badge variant="outline" style={{ borderColor: cat?.color, color: cat?.color }} className="text-xs">
            {cat?.label}
          </Badge>
        </DetailField>

        <div className="grid grid-cols-2 gap-4">
          <DetailField
            label="Início"
            value={new Date(stop.startTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          />
          {stop.endTime && (
            <DetailField
              label="Fim"
              value={new Date(stop.endTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            />
          )}
        </div>

        {stop.duration != null && <DetailField label="Duração" value={`${stop.duration} min`} />}
        <DetailField label="Registrado por" value={stop.registeredBy} />

        {stop.notes && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Observações</p>
            <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3 leading-relaxed">{stop.notes}</p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t px-6 py-4 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" onClick={onEdit}>
          <Pencil className="h-3 w-3" /> Editar
        </Button>
        {isActive && (
          <Button variant="destructive" size="sm" className="flex-1 text-xs gap-1.5" onClick={onCloseStop}>
            <StopCircle className="h-3 w-3" /> Encerrar
          </Button>
        )}
      </div>
    </div>
  );
}

function DetailField({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      {children ?? <p className="text-sm font-medium text-foreground">{value}</p>}
    </div>
  );
}
