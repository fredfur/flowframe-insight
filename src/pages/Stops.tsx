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
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Registro de Paradas</h1>
          <p className="text-sm text-muted-foreground">{line.name}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" /> Nova Parada
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Parada</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Máquina</label>
                <Select>
                  <SelectTrigger>
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
                <label className="text-sm text-muted-foreground mb-1.5 block">Categoria</label>
                <Select>
                  <SelectTrigger>
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
                  <label className="text-sm text-muted-foreground mb-1.5 block">Início</label>
                  <Input type="datetime-local" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Fim (opcional)</label>
                  <Input type="datetime-local" />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Observações</label>
                <Textarea rows={3} placeholder="Detalhes da parada..." />
              </div>
              <Button className="w-full" onClick={() => setDialogOpen(false)}>
                Registrar Parada
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active stops */}
      {activeStops.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-destructive flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> Paradas Ativas ({activeStops.length})
          </h2>
          <div className="space-y-2">
            {activeStops.map((stop) => (
              <StopRow key={stop.id} stop={stop} active />
            ))}
          </div>
        </div>
      )}

      {/* Closed stops */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> Histórico
        </h2>
        <div className="space-y-2">
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
    <div className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-colors ${
      active ? 'border-destructive/30 bg-destructive/5' : 'border-border bg-card hover:bg-accent'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <Badge
          variant="outline"
          style={{ borderColor: cat?.color, color: cat?.color }}
          className="text-xs shrink-0"
        >
          {cat?.label}
        </Badge>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{stop.machineName}</p>
          {stop.notes && <p className="text-xs text-muted-foreground truncate">{stop.notes}</p>}
        </div>
      </div>
      <div className="text-right shrink-0 ml-4">
        <p className="text-sm tabular-nums text-foreground">
          {new Date(stop.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          {stop.endTime && ` — ${new Date(stop.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
        </p>
        {stop.duration && (
          <p className="text-xs tabular-nums text-muted-foreground">{stop.duration} min</p>
        )}
        {!stop.endTime && (
          <Badge variant="destructive" className="text-xs mt-1">Em andamento</Badge>
        )}
      </div>
    </div>
  );
}
