import { Machine, ProductionLine, Stop, DLIDataPoint, OEEHistoryPoint, Site, Equipment, ProductionFlow } from '@/types/production';
import { MachineTimeline, TimelineSegment, TimelineStatus, SpeedSample } from '@/components/production/LineTimeline';

const createMachines = (lineId: string): Machine[] => [
  {
    id: `${lineId}-m1`, name: 'Alimentador', type: 'Feeder',
    lineId, position: 1, x: 80, y: 200, status: 'running',
    oee: { availability: 95, performance: 88, quality: 99, oee: 82.8 },
    throughput: 440, nominalSpeed: 500,
  },
  {
    id: `${lineId}-m2`, name: 'Processadora A', type: 'Processor',
    lineId, position: 2, x: 280, y: 200, status: 'running',
    oee: { availability: 90, performance: 85, quality: 97, oee: 74.2 },
    throughput: 410, nominalSpeed: 500,
  },
  {
    id: `${lineId}-m3`, name: 'Inspeção Visual', type: 'Inspection',
    lineId, position: 3, x: 480, y: 200, status: 'fault',
    oee: { availability: 70, performance: 92, quality: 100, oee: 64.4 },
    throughput: 0, nominalSpeed: 500,
  },
  {
    id: `${lineId}-m4`, name: 'Processadora B', type: 'Processor',
    lineId, position: 4, x: 680, y: 200, status: 'setup',
    oee: { availability: 60, performance: 80, quality: 95, oee: 45.6 },
    throughput: 0, nominalSpeed: 500,
  },
  {
    id: `${lineId}-m5`, name: 'Embaladora', type: 'Packer',
    lineId, position: 5, x: 880, y: 200, status: 'running',
    oee: { availability: 92, performance: 90, quality: 98, oee: 81.1 },
    throughput: 430, nominalSpeed: 500,
  },
];

export const mockSites: Site[] = [
  {
    id: 'site-1',
    name: 'Planta São Paulo',
    location: 'São Paulo, SP',
    lines: ['line-1', 'line-2'],
  },
];

export const mockLines: ProductionLine[] = [
  {
    id: 'line-1', name: 'Linha 01 — Envase', type: 'Envase',
    siteId: 'site-1',
    nominalSpeed: 500,
    machines: createMachines('line-1'),
    oee: { availability: 81.4, performance: 87, quality: 97.8, oee: 69.2 },
    throughput: 380,
  },
  {
    id: 'line-2', name: 'Linha 02 — Montagem', type: 'Montagem',
    siteId: 'site-1',
    nominalSpeed: 300,
    machines: createMachines('line-2').map(m => ({
      ...m, lineId: 'line-2', id: m.id.replace('line-1', 'line-2'),
      status: m.position === 3 ? 'running' as const : m.status,
    })),
    oee: { availability: 88, performance: 82, quality: 96, oee: 69.3 },
    throughput: 245,
  },
];

export const mockEquipments: Equipment[] = [
  { id: 'eq-1', name: 'Alimentador', type: 'Feeder', lineId: 'line-1', position: 1, nominalSpeed: 500 },
  { id: 'eq-2', name: 'Processadora A', type: 'Processor', lineId: 'line-1', position: 2, nominalSpeed: 500 },
  { id: 'eq-3', name: 'Inspeção Visual', type: 'Inspection', lineId: 'line-1', position: 3, nominalSpeed: 500 },
  { id: 'eq-4', name: 'Processadora B', type: 'Processor', lineId: 'line-1', position: 4, nominalSpeed: 500 },
  { id: 'eq-5', name: 'Embaladora', type: 'Packer', lineId: 'line-1', position: 5, nominalSpeed: 500 },
  { id: 'eq-6', name: 'Alimentador', type: 'Feeder', lineId: 'line-2', position: 1, nominalSpeed: 300 },
  { id: 'eq-7', name: 'Processadora A', type: 'Processor', lineId: 'line-2', position: 2, nominalSpeed: 300 },
  { id: 'eq-8', name: 'Inspeção Visual', type: 'Inspection', lineId: 'line-2', position: 3, nominalSpeed: 300 },
  { id: 'eq-9', name: 'Processadora B', type: 'Processor', lineId: 'line-2', position: 4, nominalSpeed: 300 },
  { id: 'eq-10', name: 'Embaladora', type: 'Packer', lineId: 'line-2', position: 5, nominalSpeed: 300 },
];

export const mockFlows: ProductionFlow[] = [
  {
    id: 'flow-1', name: 'Produto A — Garrafa 500ml', sku: 'SKU-101', lineId: 'line-1',
    equipmentIds: ['eq-1', 'eq-2', 'eq-3', 'eq-4', 'eq-5'],
    nominalSpeed: 500,
  },
  {
    id: 'flow-2', name: 'Produto B — Garrafa 1L', sku: 'SKU-204', lineId: 'line-1',
    equipmentIds: ['eq-1', 'eq-2', 'eq-3', 'eq-4', 'eq-5'],
    nominalSpeed: 350,
  },
  {
    id: 'flow-3', name: 'Produto C — Kit Montagem', sku: 'SKU-310', lineId: 'line-2',
    equipmentIds: ['eq-6', 'eq-7', 'eq-8', 'eq-9', 'eq-10'],
    nominalSpeed: 300,
  },
];

export const mockStops: Stop[] = [
  {
    id: 's1', machineId: 'line-1-m3', machineName: 'Inspeção Visual', lineId: 'line-1',
    category: 'maintenance', startTime: '2026-03-07T08:30:00', endTime: null,
    duration: null, notes: 'Sensor de câmera com falha', registeredBy: 'operador@fabrica.com',
  },
  {
    id: 's2', machineId: 'line-1-m4', machineName: 'Processadora B', lineId: 'line-1',
    category: 'setup', startTime: '2026-03-07T09:00:00', endTime: null,
    duration: null, notes: 'Troca de molde para SKU-204', registeredBy: 'operador@fabrica.com',
  },
  {
    id: 's3', machineId: 'line-1-m2', machineName: 'Processadora A', lineId: 'line-1',
    category: 'material_shortage', startTime: '2026-03-07T06:15:00', endTime: '2026-03-07T06:45:00',
    duration: 30, notes: 'Aguardando reposição de insumo X', registeredBy: 'operador@fabrica.com',
  },
  {
    id: 's4', machineId: 'line-1-m1', machineName: 'Alimentador', lineId: 'line-1',
    category: 'quality_issue', startTime: '2026-03-07T05:00:00', endTime: '2026-03-07T05:20:00',
    duration: 20, notes: 'Produto fora de especificação', registeredBy: 'operador@fabrica.com',
  },
  {
    id: 's5', machineId: 'line-1-m5', machineName: 'Embaladora', lineId: 'line-1',
    category: 'planned', startTime: '2026-03-07T04:00:00', endTime: '2026-03-07T04:30:00',
    duration: 30, notes: 'Parada para limpeza programada', registeredBy: 'operador@fabrica.com',
  },
];

export const mockDLIData: DLIDataPoint[] = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, '0')}:00`,
  throughput: Math.round(300 + Math.random() * 150 + (i > 6 && i < 18 ? 50 : -50)),
  target: 450,
}));

export const mockOEEHistory: OEEHistoryPoint[] = [
  { time: 'Seg', oee: 72, availability: 85, performance: 88, quality: 96 },
  { time: 'Ter', oee: 68, availability: 80, performance: 87, quality: 97 },
  { time: 'Qua', oee: 75, availability: 88, performance: 89, quality: 96 },
  { time: 'Qui', oee: 70, availability: 82, performance: 88, quality: 97 },
  { time: 'Sex', oee: 69, availability: 81, performance: 87, quality: 98 },
  { time: 'Sáb', oee: 65, availability: 78, performance: 85, quality: 98 },
  { time: 'Dom', oee: 60, availability: 75, performance: 82, quality: 97 },
];

export const mockParetoData = [
  { category: 'Manutenção', minutes: 180, count: 8 },
  { category: 'Setup', minutes: 120, count: 12 },
  { category: 'Falta Material', minutes: 90, count: 5 },
  { category: 'Qualidade', minutes: 60, count: 4 },
  { category: 'Ausência Op.', minutes: 45, count: 3 },
  { category: 'Planejada', minutes: 30, count: 2 },
  { category: 'Outros', minutes: 15, count: 1 },
];

// --- Timeline mock data (1º Turno: 360–840 min = 06:00–14:00) ---
function makeSegments(patterns: Array<[TimelineStatus, number, number]>): TimelineSegment[] {
  return patterns.map(([status, startMin, endMin]) => ({ status, startMin, endMin }));
}

export const mockTimelines: Record<string, MachineTimeline[]> = {
  'line-1': [
    {
      machineId: 'line-1-m1', machineName: 'Alimentador',
      segments: makeSegments([
        // 1º Turno
        ['running', 360, 420], ['shortage', 420, 435], ['running', 435, 540],
        ['scheduled', 540, 570], ['running', 570, 720], ['fault', 720, 740], ['running', 740, 840],
        // 2º Turno
        ['running', 840, 870], ['fault', 870, 890], ['running', 890, 1050],
        ['scheduled', 1050, 1070], ['running', 1070, 1250], ['shortage', 1250, 1270], ['running', 1270, 1320],
        // 3º Turno
        ['running', 1320, 1380], ['fault', 1380, 1400], ['running', 1400, 1620],
        ['scheduled', 1620, 1650], ['running', 1650, 1800],
      ]),
    },
    {
      machineId: 'line-1-m2', machineName: 'Processadora A',
      segments: makeSegments([
        ['running', 360, 375], ['shortage', 375, 405], ['running', 405, 510],
        ['accumulation', 510, 535], ['running', 535, 600], ['scheduled', 600, 630], ['running', 630, 840],
        ['running', 840, 960], ['fault', 960, 1000], ['running', 1000, 1140],
        ['accumulation', 1140, 1160], ['running', 1160, 1320],
        ['running', 1320, 1500], ['shortage', 1500, 1530], ['running', 1530, 1800],
      ]),
    },
    {
      machineId: 'line-1-m3', machineName: 'Inspeção Visual',
      segments: makeSegments([
        ['running', 360, 510], ['fault', 510, 600], ['running', 600, 750],
        ['disconnected', 750, 780], ['running', 780, 840],
        ['running', 840, 1050], ['fault', 1050, 1070], ['running', 1070, 1320],
        ['running', 1320, 1500], ['disconnected', 1500, 1530], ['running', 1530, 1720],
        ['fault', 1720, 1740], ['running', 1740, 1800],
      ]),
    },
    {
      machineId: 'line-1-m4', machineName: 'Processadora B',
      segments: makeSegments([
        ['setup', 360, 420], ['running', 420, 540], ['accumulation', 540, 570],
        ['running', 570, 690], ['shortage', 690, 710], ['running', 710, 840],
        ['running', 840, 960], ['setup', 960, 990], ['running', 990, 1140],
        ['shortage', 1140, 1160], ['running', 1160, 1320],
        ['running', 1320, 1500], ['accumulation', 1500, 1530], ['running', 1530, 1800],
      ]),
    },
    {
      machineId: 'line-1-m5', machineName: 'Embaladora',
      segments: makeSegments([
        ['running', 360, 480], ['scheduled', 480, 510], ['running', 510, 660],
        ['fault', 660, 680], ['running', 680, 840],
        ['running', 840, 1050], ['scheduled', 1050, 1070], ['running', 1070, 1250],
        ['fault', 1250, 1270], ['running', 1270, 1320],
        ['running', 1320, 1620], ['scheduled', 1620, 1650], ['running', 1650, 1800],
      ]),
    },
  ],
  'line-2': [
    {
      machineId: 'line-2-m1', machineName: 'Alimentador',
      segments: makeSegments([
        ['running', 360, 600], ['shortage', 600, 630], ['running', 630, 840],
        ['running', 840, 900], ['shortage', 900, 920], ['running', 920, 1320],
        ['running', 1320, 1400], ['fault', 1400, 1430], ['running', 1430, 1800],
      ]),
    },
    {
      machineId: 'line-2-m2', machineName: 'Processadora A',
      segments: makeSegments([
        ['running', 360, 500], ['fault', 500, 530], ['running', 530, 840],
        ['running', 840, 1020], ['fault', 1020, 1050], ['running', 1050, 1320],
        ['running', 1320, 1550], ['fault', 1550, 1580], ['running', 1580, 1800],
      ]),
    },
    {
      machineId: 'line-2-m3', machineName: 'Inspeção Visual',
      segments: makeSegments([
        ['running', 360, 840], ['running', 840, 1320], ['running', 1320, 1800],
      ]),
    },
    {
      machineId: 'line-2-m4', machineName: 'Processadora B',
      segments: makeSegments([
        ['running', 360, 450], ['setup', 450, 480], ['running', 480, 840],
        ['running', 840, 1200], ['setup', 1200, 1220], ['running', 1220, 1320],
        ['running', 1320, 1700], ['setup', 1700, 1720], ['running', 1720, 1800],
      ]),
    },
    {
      machineId: 'line-2-m5', machineName: 'Embaladora',
      segments: makeSegments([
        ['running', 360, 700], ['accumulation', 700, 730], ['running', 730, 840],
        ['running', 840, 1200], ['accumulation', 1200, 1220], ['running', 1220, 1320],
        ['running', 1320, 1700], ['accumulation', 1700, 1720], ['running', 1720, 1800],
      ]),
    },
  ],
};

// --- Speed samples (line-level throughput over time) ---
function generateSpeedSamples(start: number, end: number, nominal: number, events: Array<[number, number, number]>): SpeedSample[] {
  // events: [startMin, endMin, speedDuringEvent]
  const samples: SpeedSample[] = [];
  for (let m = start; m <= end; m += 5) {
    const event = events.find(([s, e]) => m >= s && m < e);
    const base = event ? event[2] : nominal * (0.82 + Math.random() * 0.15);
    samples.push({ min: m, speed: Math.round(base) });
  }
  return samples;
}

export const mockSpeedSamples: Record<string, SpeedSample[]> = {
  'line-1': [
    // 1º Turno (06:00–14:00)
    ...generateSpeedSamples(360, 840, 500, [
      [420, 435, 0], [510, 560, 50], [540, 570, 80], [660, 680, 30], [720, 740, 0],
    ]),
    // 2º Turno (14:00–22:00)
    ...generateSpeedSamples(840, 1320, 500, [
      [870, 890, 0], [960, 1000, 60], [1050, 1070, 0], [1140, 1160, 40], [1250, 1270, 0],
    ]),
    // 3º Turno (22:00–06:00 = 1320–1800)
    ...generateSpeedSamples(1320, 1800, 500, [
      [1380, 1400, 0], [1500, 1530, 70], [1620, 1650, 0], [1720, 1740, 50],
    ]),
  ],
  'line-2': [
    ...generateSpeedSamples(360, 840, 300, [
      [450, 480, 0], [500, 530, 40], [600, 630, 0], [700, 730, 60],
    ]),
    ...generateSpeedSamples(840, 1320, 300, [
      [900, 920, 0], [1020, 1050, 30], [1200, 1220, 0],
    ]),
    ...generateSpeedSamples(1320, 1800, 300, [
      [1400, 1430, 0], [1550, 1580, 50], [1700, 1720, 0],
    ]),
  ],
};
