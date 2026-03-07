import { Machine } from '@/types/production';
import { OEEGauge } from './OEEGauge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { mockStops } from '@/data/mockData';
import { STOP_CATEGORIES } from '@/types/production';
import { useNavigate } from 'react-router-dom';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';

interface MachineDetailPanelProps {
  machine: Machine | null;
  onClose: () => void;
}

export function MachineDetailPanel({ machine, onClose }: MachineDetailPanelProps) {
  return (
    <Sheet open={!!machine} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[360px] sm:w-[400px] p-0">
        {machine && <MachineDetailContent machine={machine} />}
      </SheetContent>
    </Sheet>
  );
}

function MachineDetailContent({ machine }: { machine: Machine }) {
  const navigate = useNavigate();
  const machineStops = mockStops.filter(s => s.machineId === machine.id);
  const activeStops = machineStops.filter(s => !s.endTime);
  const closedStops = machineStops.filter(s => s.endTime);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <SheetHeader className="px-6 py-5 border-b">
        <SheetTitle className="text-base">{machine.name}</SheetTitle>
        <p className="text-xs text-muted-foreground">{machine.type} · Pos. {machine.position}</p>
      </SheetHeader>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* OEE */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">OEE</p>
          <div className="flex justify-center mb-4">
            <OEEGauge value={machine.oee.oee} label="OEE" size="md" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <OEEGauge value={machine.oee.availability} label="Disp." size="sm" />
            <OEEGauge value={machine.oee.performance} label="Perf." size="sm" />
            <OEEGauge value={machine.oee.quality} label="Qual." size="sm" />
          </div>
        </div>

        {/* Throughput */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Vazão (DLI)</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular-nums text-foreground">{machine.throughput}</span>
            <span className="text-xs text-muted-foreground">u/h</span>
          </div>
          <div className="mt-2.5 h-2 bg-muted/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min(100, (machine.throughput / machine.nominalSpeed) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 tabular-nums">
            Nominal: {machine.nominalSpeed} u/h ({((machine.throughput / machine.nominalSpeed) * 100).toFixed(0)}%)
          </p>
        </div>

        {/* Active Stops */}
        {activeStops.length > 0 && (
          <div>
            <p className="text-[10px] text-destructive uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Paradas Ativas
            </p>
            <div className="space-y-2">
              {activeStops.map((stop) => {
                const cat = STOP_CATEGORIES.find(c => c.id === stop.category);
                return (
                  <div key={stop.id} className="flex items-center justify-between rounded-lg border bg-destructive/5 px-3 py-2.5">
                    <Badge variant="outline" style={{ borderColor: cat?.color, color: cat?.color }} className="text-[10px]">
                      {cat?.label}
                    </Badge>
                    <span className="text-muted-foreground tabular-nums text-[11px]">
                      {new Date(stop.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Stops */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Paradas Recentes</p>
          {closedStops.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Nenhuma parada encerrada</p>
          ) : (
            <div className="space-y-1.5">
              {closedStops.map((stop) => {
                const cat = STOP_CATEGORIES.find(c => c.id === stop.category);
                return (
                  <div key={stop.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <Badge variant="outline" style={{ borderColor: cat?.color, color: cat?.color }} className="text-[10px]">
                      {cat?.label}
                    </Badge>
                    <span className="text-muted-foreground tabular-nums text-[11px]">{stop.duration} min</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-6 py-4">
        <Button
          className="w-full"
          variant="destructive"
          size="sm"
          onClick={() => navigate('/paradas')}
        >
          <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
          Registrar Parada
        </Button>
      </div>
    </div>
  );
}
