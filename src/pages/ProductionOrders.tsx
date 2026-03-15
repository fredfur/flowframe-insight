import { useState, useEffect, useCallback } from 'react';
import { mockLines } from '@/data/mockData';
import { useLineStore } from '@/stores/lineStore';
import { ProductionOrderPanel } from '@/components/production/ProductionOrderPanel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList } from 'lucide-react';
import { LineService } from '@/services/api';
import type { ProductionLine } from '@/types/production';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export default function ProductionOrders() {
  const { selectedLineId, setSelectedLineId } = useLineStore();
  const [lines, setLines] = useState<ProductionLine[]>(mockLines as ProductionLine[]);

  const loadLines = useCallback(async () => {
    if (!API_BASE) {
      setLines(mockLines as ProductionLine[]);
      return;
    }
    try {
      const list = await LineService.getAll();
      setLines(list as ProductionLine[]);
      if (list.length > 0 && !list.some(l => l.id === selectedLineId)) {
        setSelectedLineId(list[0].id);
      }
    } catch {
      setLines(mockLines as ProductionLine[]);
    }
  }, [selectedLineId, setSelectedLineId]);

  useEffect(() => {
    loadLines();
  }, [loadLines]);

  const line = lines.find(l => l.id === selectedLineId) ?? lines[0];

  return (
    <div className="flex flex-col gap-4 md:gap-6 overflow-y-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Ordens de Produção</h1>
            <p className="text-sm text-muted-foreground">Gerencie as ordens de produção por linha</p>
          </div>
        </div>
        <Select value={selectedLineId} onValueChange={setSelectedLineId}>
          <SelectTrigger className="w-[220px] h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {lines.map(l => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ProductionOrderPanel lineId={line?.id ?? selectedLineId} />
    </div>
  );
}
