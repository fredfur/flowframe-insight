import { useState } from 'react';
import { mockLines } from '@/data/mockData';
import { useLineStore } from '@/stores/lineStore';
import { Machine } from '@/types/production';
import { MachineNode } from '@/components/production/MachineNode';
import { FlowConnector } from '@/components/production/FlowConnector';
import { MachineDetailPanel } from '@/components/production/MachineDetailPanel';
import { LineMetricsBar } from '@/components/production/LineMetricsBar';

export default function LineLive() {
  const { selectedLineId } = useLineStore();
  const line = mockLines.find(l => l.id === selectedLineId) ?? mockLines[0];
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  const sortedMachines = [...line.machines].sort((a, b) => a.position - b.position);

  return (
    <div className="flex h-full gap-0">
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <div>
          <h1 className="text-xl font-bold text-foreground mb-1">{line.name}</h1>
          <p className="text-xs text-muted-foreground font-mono">
            Tipo: {line.type} • Velocidade nominal: {line.nominalSpeed} u/h
          </p>
        </div>

        <LineMetricsBar line={line} />

        {/* Machine Flow */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center overflow-x-auto py-8 px-4">
            {sortedMachines.map((machine, i) => (
              <div key={machine.id} className="flex items-center">
                <MachineNode
                  machine={machine}
                  onClick={setSelectedMachine}
                  isSelected={selectedMachine?.id === machine.id}
                />
                {i < sortedMachines.length - 1 && <FlowConnector />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedMachine && (
        <MachineDetailPanel machine={selectedMachine} onClose={() => setSelectedMachine(null)} />
      )}
    </div>
  );
}
