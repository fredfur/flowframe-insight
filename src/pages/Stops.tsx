import { useState } from 'react';
import { mockStops, mockLines } from '@/data/mockData';
import { useLineStore } from '@/stores/lineStore';
import { STOP_CATEGORIES, Stop } from '@/types/production';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Plus, Clock } from 'lucide-react';

export default function Stops() {
  const { selectedLineId } = useLineStore();
  const line = mockLines.find(l => l.id === selectedLineId) ?? mockLines[0];
  const lineStops = mockStops.filter(s => s.lineId === selectedLineId);
  const activeStops = lineStops.filter(s => !s.endTime);
  const closedStops = lineStops.filter(s => s.endTime);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-foreground">Registro de Paradas</h1>
          <p className="text-[11px] text-muted-foreground">{line.name}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> Nova Parada
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-sm">Registrar Parada</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Máquina</label>
                <Select>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Selecionar máquina" />
                  </SelectTrigger>
                  <SelectContent>
                    {line.machines.map(m => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Categoria</label>
                <Select>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Selecionar categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {STOP_CATEGORIES.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Início</label>
                  <Input type="datetime-local" className="h-8 text-xs" />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Fim (opcional)</label>
                  <Input type="datetime-local" className="h-8 text-xs" />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Observações</label>
                <Textarea className="text-xs" rows={3} placeholder="Detalhes da parada..." />
              </div>
              <Button className="w-full h-8 text-xs" onClick={() => setDialogOpen(false)}>
                Registrar Parada
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {activeStops.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-[11px] font-medium text-destructive flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Paradas Ativas ({activeStops.length})
          </h2>
          <div className="space-y-1">
            {activeStops.map((stop) => (
              <StopRow key={stop.id} stop={stop} active />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" /> Histórico
        </h2>
        <div className="space-y-1">
          {closedStops.map((stop) => (
            <StopRow key={stop.id} stop={stop} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StopRow({ stop, active }: { stop: Stop; active?: boolean }) {
  const cat = STOP_CATEGORIES.find(c => c.id === stop.category);
  return (
    <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${active ? 'border-destructive/30 bg-destructive/5' : 'bg-card'}`}>
      <div className="flex items-center gap-2.5">
        <Badge variant="outline" style={{ borderColor: cat?.color, color: cat?.color }} className="text-[10px]">
          {cat?.label}
        </Badge>
        <div>
          <p className="text-[12px] font-medium text-foreground">{stop.machineName}</p>
          {stop.notes && <p className="text-[10px] text-muted-foreground">{stop.notes}</p>}
        </div>
      </div>
      <div className="text-right">
        <p className="text-[11px] tabular-nums text-foreground">
          {new Date(stop.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          {stop.endTime && ` — ${new Date(stop.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
        </p>
        {stop.duration && (
          <p className="text-[10px] tabular-nums text-muted-foreground">{stop.duration} min</p>
        )}
        {!stop.endTime && (
          <Badge variant="destructive" className="text-[9px] mt-0.5">Em andamento</Badge>
        )}
      </div>
    </div>
  );
}
