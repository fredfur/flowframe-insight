import { Machine } from '@/types/production';
import { MachineNode } from './MachineNode';

interface FlowNodeProps {
  machines: Machine[];
  selectedMachineId?: string;
  onMachineClick: (machine: Machine) => void;
}

/**
 * A flow node can contain 1+ machines.
 * When multiple machines share the same position, they operate in parallel.
 */
export function FlowNode({ machines, selectedMachineId, onMachineClick }: FlowNodeProps) {
  if (machines.length === 1) {
    return (
      <MachineNode
        machine={machines[0]}
        onClick={onMachineClick}
        isSelected={selectedMachineId === machines[0].id}
      />
    );
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Parallel indicator */}
      <div className="flex items-center gap-1 px-1">
        <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
          Paralelo
        </span>
        <span className="text-[9px] text-muted-foreground">
          ×{machines.length}
        </span>
      </div>
      {/* Parallel bracket + machines */}
      <div className="relative flex flex-col gap-1 pl-2 border-l-2 border-dashed border-primary/30">
        {machines.map((machine) => (
          <MachineNode
            key={machine.id}
            machine={machine}
            onClick={onMachineClick}
            isSelected={selectedMachineId === machine.id}
          />
        ))}
      </div>
    </div>
  );
}
