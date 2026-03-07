import { Machine } from '@/types/production';
import { OEEGauge } from './OEEGauge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle } from 'lucide-react';
import { mockStops } from '@/data/mockData';
import { STOP_CATEGORIES } from '@/types/production';
import { useNavigate } from 'react-router-dom';

interface MachineDetailPanelProps {
  machine: Machine | null;
  onClose: () => void;
}

export function MachineDetailPanel({ machine, onClose }: MachineDetailPanelProps) {
  const navigate = useNavigate();
  if (!machine) return null;

  const machineStops = mockStops.filter(s => s.machineId === machine.id);
  const activeStops = machineStops.filter(s => !s.endTime);

  return (
    <div className="w-[340px] shrink-0 border-l bg-card overflow-y-auto">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{machine.name}</h3>
          <p className="text-[11px] text-muted-foreground">{machine.type} · Pos. {machine.position}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-muted-foreground">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="p-4 space-y-5">
        {/* OEE */}
        <div>
          <p className="text-[11px] text-muted-foreground mb-3">OEE</p>
          <div className="flex justify-center mb-3">
            <OEEGauge value={machine.oee.oee} label="OEE" size="md" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <OEEGauge value={machine.oee.availability} label="Disp." size="sm" />
            <OEEGauge value={machine.oee.performance} label="Perf." size="sm" />
            <OEEGauge value={machine.oee.quality} label="Qual." size="sm" />
          </div>
        </div>

        {/* Throughput */}
        <div>
          <p className="text-[11px] text-muted-foreground mb-1.5">Vazão (DLI)</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular-nums text-foreground">{machine.throughput}</span>
            <span className="text-xs text-muted-foreground">u/h</span>
          </div>
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(machine.throughput / machine.nominalSpeed) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
            Nominal: {machine.nominalSpeed} u/h ({((machine.throughput / machine.nominalSpeed) * 100).toFixed(0)}%)
          </p>
        </div>

        {/* Active Stops */}
        {activeStops.length > 0 && (
          <div>
            <p className="text-[11px] text-destructive mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Paradas Ativas
            </p>
            <div className="space-y-1.5">
              {activeStops.map((stop) => {
                const cat = STOP_CATEGORIES.find(c => c.id === stop.category);
                return (
                  <div key={stop.id} className="flex items-center justify-between text-xs">
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
          <p className="text-[11px] text-muted-foreground mb-2">Paradas Recentes</p>
          <div className="space-y-1.5">
            {machineStops.filter(s => s.endTime).length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma parada encerrada</p>
            ) : (
              machineStops.filter(s => s.endTime).map((stop) => {
                const cat = STOP_CATEGORIES.find(c => c.id === stop.category);
                return (
                  <div key={stop.id} className="flex items-center justify-between text-xs">
                    <Badge variant="outline" style={{ borderColor: cat?.color, color: cat?.color }} className="text-[10px]">
                      {cat?.label}
                    </Badge>
                    <span className="text-muted-foreground tabular-nums text-[11px]">{stop.duration}min</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

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
