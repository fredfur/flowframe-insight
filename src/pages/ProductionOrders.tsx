import { useState } from 'react';
import { mockLines } from '@/data/mockData';
import { useLineStore } from '@/stores/lineStore';
import { ProductionOrderPanel } from '@/components/production/ProductionOrderPanel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList } from 'lucide-react';

export default function ProductionOrders() {
  const { selectedLineId, setSelectedLineId } = useLineStore();
  const line = mockLines.find(l => l.id === selectedLineId) ?? mockLines[0];

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
            {mockLines.map(l => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ProductionOrderPanel lineId={line.id} />
    </div>
  );
}
