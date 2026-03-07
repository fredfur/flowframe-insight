import { Machine } from '@/types/production';
import { OEEGauge } from './OEEGauge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle } from 'lucide-react';
import { mockStops } from '@/data/mockData';
import { STOP_CATEGORIES } from '@/types/production';
import { motion, AnimatePresence } from 'framer-motion';
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
    <AnimatePresence>
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-[360px] shrink-0 border-l border-border bg-card overflow-y-auto"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground">{machine.name}</h3>
            <p className="text-xs text-muted-foreground font-mono">{machine.type} • Pos. {machine.position}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-5">
          {/* OEE */}
          <Card className="bg-background border-border">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">OEE</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="flex justify-center mb-3">
                <OEEGauge value={machine.oee.oee} label="OEE" size="md" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <OEEGauge value={machine.oee.availability} label="Disp." size="sm" />
                <OEEGauge value={machine.oee.performance} label="Perf." size="sm" />
                <OEEGauge value={machine.oee.quality} label="Qual." size="sm" />
              </div>
            </CardContent>
          </Card>

          {/* DLI / Throughput */}
          <Card className="bg-background border-border">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Vazão (DLI)</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-bold text-foreground">{machine.throughput}</span>
                <span className="text-xs text-muted-foreground">u/h</span>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(machine.throughput / machine.nominalSpeed) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                Nominal: {machine.nominalSpeed} u/h ({((machine.throughput / machine.nominalSpeed) * 100).toFixed(0)}%)
              </p>
            </CardContent>
          </Card>

          {/* Active Stops */}
          {activeStops.length > 0 && (
            <Card className="bg-background border-destructive/30">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs uppercase tracking-widest text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Paradas Ativas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                {activeStops.map((stop) => {
                  const cat = STOP_CATEGORIES.find(c => c.id === stop.category);
                  return (
                    <div key={stop.id} className="flex items-center justify-between text-xs">
                      <Badge variant="outline" style={{ borderColor: cat?.color, color: cat?.color }} className="text-[10px]">
                        {cat?.label}
                      </Badge>
                      <span className="text-muted-foreground font-mono">
                        {new Date(stop.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Recent Stops */}
          <Card className="bg-background border-border">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">Paradas Recentes</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
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
                      <span className="text-muted-foreground font-mono">{stop.duration}min</span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Button
            className="w-full"
            variant="destructive"
            onClick={() => navigate('/paradas')}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Registrar Parada
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
