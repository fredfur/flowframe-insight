import { useState } from 'react';
import { mockStops, mockLines } from '@/data/mockData';
import { useLineStore } from '@/stores/lineStore';
import { STOP_CATEGORIES, Stop, StopCategory } from '@/types/production';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Plus, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Stops() {
  const { selectedLineId } = useLineStore();
  const line = mockLines.find(l => l.id === selectedLineId) ?? mockLines[0];
  const lineStops = mockStops.filter(s => s.lineId === selectedLineId);
  const activeStops = lineStops.filter(s => !s.endTime);
  const closedStops = lineStops.filter(s => s.endTime);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Registro de Paradas</h1>
          <p className="text-xs text-muted-foreground font-mono">{line.name}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Nova Parada
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Registrar Parada</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Máquina</label>
                <Select>
                  <SelectTrigger className="bg-background border-border">
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
                <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
                <Select>
                  <SelectTrigger className="bg-background border-border">
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
                  <label className="text-xs text-muted-foreground mb-1 block">Início</label>
                  <Input type="datetime-local" className="bg-background border-border text-xs" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Fim (opcional)</label>
                  <Input type="datetime-local" className="bg-background border-border text-xs" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Observações</label>
                <Textarea className="bg-background border-border text-xs" rows={3} placeholder="Detalhes da parada..." />
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
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-destructive flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> Paradas Ativas ({activeStops.length})
          </h2>
          <div className="grid gap-3">
            {activeStops.map((stop, i) => (
              <StopCard key={stop.id} stop={stop} index={i} active />
            ))}
          </div>
        </div>
      )}

      {/* Closed stops */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-4 w-4" /> Histórico
        </h2>
        <div className="grid gap-3">
          {closedStops.map((stop, i) => (
            <StopCard key={stop.id} stop={stop} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StopCard({ stop, index, active }: { stop: Stop; index: number; active?: boolean }) {
  const cat = STOP_CATEGORIES.find(c => c.id === stop.category);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={active ? 'border-destructive/40 bg-destructive/5' : 'bg-card border-border'}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" style={{ borderColor: cat?.color, color: cat?.color }} className="text-[10px]">
              {cat?.label}
            </Badge>
            <div>
              <p className="text-sm font-medium text-foreground">{stop.machineName}</p>
              <p className="text-[10px] text-muted-foreground">{stop.notes}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono text-foreground">
              {new Date(stop.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              {stop.endTime && ` — ${new Date(stop.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
            </p>
            {stop.duration && (
              <p className="text-[10px] font-mono text-muted-foreground">{stop.duration} min</p>
            )}
            {!stop.endTime && (
              <Badge variant="destructive" className="text-[10px] mt-1">Em andamento</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
