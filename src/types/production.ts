export type MachineStatus = 'running' | 'stopped' | 'setup' | 'idle';

export interface Site {
  id: string;
  name: string;
  location: string;
  lines: string[];
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  lineId: string;
  position: number;
  nominalSpeed: number;
}

export interface ProductionFlow {
  id: string;
  name: string;
  lineId: string;
  equipmentIds: string[];
  normalizer: string;
  nominalSpeed: number;
}

export interface Machine {
  id: string;
  name: string;
  type: string;
  lineId: string;
  position: number;
  x: number;
  y: number;
  status: MachineStatus;
  oee: OEEMetrics;
  throughput: number;
  nominalSpeed: number;
}

export interface OEEMetrics {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

export interface ProductionLine {
  id: string;
  name: string;
  type: string;
  siteId: string;
  nominalSpeed: number;
  machines: Machine[];
  oee: OEEMetrics;
  throughput: number;
}

export type StopCategory =
  | 'maintenance'
  | 'setup'
  | 'material_shortage'
  | 'quality_issue'
  | 'operator_absence'
  | 'planned'
  | 'other';

export interface Stop {
  id: string;
  machineId: string;
  machineName: string;
  lineId: string;
  category: StopCategory;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  notes: string;
  registeredBy: string;
}

export interface StopCategoryInfo {
  id: StopCategory;
  label: string;
  color: string;
}

export const STOP_CATEGORIES: StopCategoryInfo[] = [
  { id: 'maintenance', label: 'Manutenção', color: 'hsl(0, 72%, 51%)' },
  { id: 'setup', label: 'Setup', color: 'hsl(38, 95%, 55%)' },
  { id: 'material_shortage', label: 'Falta de Material', color: 'hsl(280, 60%, 55%)' },
  { id: 'quality_issue', label: 'Problema de Qualidade', color: 'hsl(200, 80%, 50%)' },
  { id: 'operator_absence', label: 'Ausência de Operador', color: 'hsl(320, 60%, 50%)' },
  { id: 'planned', label: 'Parada Planejada', color: 'hsl(210, 15%, 55%)' },
  { id: 'other', label: 'Outros', color: 'hsl(0, 0%, 50%)' },
];

export interface DLIDataPoint {
  time: string;
  throughput: number;
  target: number;
}

export interface OEEHistoryPoint {
  time: string;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
}
