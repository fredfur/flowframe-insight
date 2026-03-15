/**
 * API Service Layer
 * -----------------
 * Abstração de acesso a dados. Todas as páginas devem consumir dados
 * através desta camada — nunca importar mockData diretamente.
 *
 * Ao conectar o backend .NET, basta trocar as implementações abaixo
 * por chamadas HTTP reais (fetch/axios) sem alterar os componentes.
 */

import type {
  Site,
  ProductionLine,
  Equipment,
  ProductionFlow,
  Machine,
  Stop,
  StopCategory,
  OEEMetrics,
  DLIDataPoint,
  OEEHistoryPoint,
} from '@/types/production';

import {
  mockSites,
  mockLines,
  mockEquipments,
  mockFlows,
  mockStops,
  mockDLIData,
  mockOEEHistory,
  mockParetoData,
} from '@/data/mockData';

// ---------------------------------------------------------------------------
// Config — trocar pelo endereço real do backend .NET
// ---------------------------------------------------------------------------
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

// ---------------------------------------------------------------------------
// Generic fetch helper (pronto para .NET) — erros são enviados para Debug
// ---------------------------------------------------------------------------
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    const msg = `[api] API_BASE_URL not configured — endpoint: ${endpoint}`;
    try {
      const { useApiErrorLogStore } = await import('@/stores/apiErrorLogStore');
      useApiErrorLogStore.getState().push({
        endpoint,
        method: (options?.method ?? 'GET').toUpperCase(),
        status: 0,
        statusText: 'No API URL',
        message: msg,
      });
    } catch {
      // store may not be ready
    }
    throw new Error(msg);
  }
  const method = (options?.method ?? 'GET').toUpperCase();
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    const message = `[api] ${res.status} ${res.statusText}: ${body}`;
    try {
      const { useApiErrorLogStore } = await import('@/stores/apiErrorLogStore');
      useApiErrorLogStore.getState().push({
        endpoint,
        method,
        status: res.status,
        statusText: res.statusText,
        message,
        body: body.slice(0, 500),
      });
    } catch {
      // ignore if store not ready
    }
    throw new Error(message);
  }
  // DELETE e outros endpoints podem retornar 204 No Content (sem corpo)
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---------------------------------------------------------------------------
// Flag: usar mock ou API real
// ---------------------------------------------------------------------------
const USE_MOCK = !API_BASE_URL;

// ═══════════════════════════════════════════════════════════════════════════
// SITES
// ═══════════════════════════════════════════════════════════════════════════

export const SiteService = {
  async getAll(): Promise<Site[]> {
    if (USE_MOCK) return structuredClone(mockSites);
    return apiFetch<Site[]>('/api/sites');
  },

  async getById(id: string): Promise<Site | undefined> {
    if (USE_MOCK) return structuredClone(mockSites.find(s => s.id === id));
    return apiFetch<Site>(`/api/sites/${id}`);
  },

  async create(data: Omit<Site, 'id'>): Promise<Site> {
    if (USE_MOCK) {
      const site: Site = { ...data, id: `site-${Date.now()}` };
      mockSites.push(site);
      return site;
    }
    return apiFetch<Site>('/api/sites', { method: 'POST', body: JSON.stringify(data) });
  },

  async update(id: string, data: Partial<Site>): Promise<Site> {
    if (USE_MOCK) {
      const idx = mockSites.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Site not found');
      mockSites[idx] = { ...mockSites[idx], ...data };
      return mockSites[idx];
    }
    return apiFetch<Site>(`/api/sites/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      const idx = mockSites.findIndex(s => s.id === id);
      if (idx !== -1) mockSites.splice(idx, 1);
      return;
    }
    await apiFetch(`/api/sites/${id}`, { method: 'DELETE' });
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCTION LINES
// ═══════════════════════════════════════════════════════════════════════════

export const LineService = {
  async getAll(): Promise<ProductionLine[]> {
    if (USE_MOCK) return structuredClone(mockLines);
    return apiFetch<ProductionLine[]>('/api/lines');
  },

  async getBySite(siteId: string): Promise<ProductionLine[]> {
    if (USE_MOCK) return structuredClone(mockLines.filter(l => l.siteId === siteId));
    return apiFetch<ProductionLine[]>(`/api/sites/${siteId}/lines`);
  },

  async getById(id: string): Promise<ProductionLine | undefined> {
    if (USE_MOCK) return structuredClone(mockLines.find(l => l.id === id));
    return apiFetch<ProductionLine>(`/api/lines/${id}`);
  },

  async create(data: Omit<ProductionLine, 'id' | 'machines' | 'oee' | 'throughput'>): Promise<ProductionLine> {
    if (USE_MOCK) {
      const line: ProductionLine = {
        ...data,
        id: `line-${Date.now()}`,
        machines: [],
        oee: { availability: 0, performance: 0, quality: 0, oee: 0 },
        throughput: 0,
      };
      mockLines.push(line);
      return line;
    }
    return apiFetch<ProductionLine>('/api/lines', { method: 'POST', body: JSON.stringify(data) });
  },

  async update(id: string, data: Partial<ProductionLine>): Promise<ProductionLine> {
    if (USE_MOCK) {
      const idx = mockLines.findIndex(l => l.id === id);
      if (idx === -1) throw new Error('Line not found');
      mockLines[idx] = { ...mockLines[idx], ...data };
      return mockLines[idx];
    }
    return apiFetch<ProductionLine>(`/api/lines/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      const idx = mockLines.findIndex(l => l.id === id);
      if (idx !== -1) mockLines.splice(idx, 1);
      return;
    }
    await apiFetch(`/api/lines/${id}`, { method: 'DELETE' });
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// EQUIPMENT
// ═══════════════════════════════════════════════════════════════════════════

export const EquipmentService = {
  async getAll(): Promise<Equipment[]> {
    if (USE_MOCK) return structuredClone(mockEquipments);
    return apiFetch<Equipment[]>('/api/equipments');
  },

  async getByLine(lineId: string): Promise<Equipment[]> {
    if (USE_MOCK) return structuredClone(mockEquipments.filter(e => e.lineId === lineId));
    return apiFetch<Equipment[]>(`/api/lines/${lineId}/equipments`);
  },

  async create(data: Omit<Equipment, 'id'>): Promise<Equipment> {
    if (USE_MOCK) {
      const eq: Equipment = { ...data, id: `eq-${Date.now()}` };
      mockEquipments.push(eq);
      return eq;
    }
    return apiFetch<Equipment>('/api/equipments', { method: 'POST', body: JSON.stringify(data) });
  },

  async update(id: string, data: Partial<Equipment>): Promise<Equipment> {
    if (USE_MOCK) {
      const idx = mockEquipments.findIndex(e => e.id === id);
      if (idx === -1) throw new Error('Equipment not found');
      mockEquipments[idx] = { ...mockEquipments[idx], ...data };
      return mockEquipments[idx];
    }
    return apiFetch<Equipment>(`/api/equipments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      const idx = mockEquipments.findIndex(e => e.id === id);
      if (idx !== -1) mockEquipments.splice(idx, 1);
      return;
    }
    await apiFetch(`/api/equipments/${id}`, { method: 'DELETE' });
  },

  /** Define equipamento como bottleneck (eficiência da linha = eficiência deste equipamento). Não exige login. */
  async setBottleneck(id: string, isBottleneck: boolean): Promise<Equipment> {
    if (USE_MOCK) {
      const idx = mockEquipments.findIndex(e => e.id === id);
      if (idx === -1) throw new Error('Equipment not found');
      mockEquipments[idx] = { ...mockEquipments[idx], isBottleneck };
      return mockEquipments[idx];
    }
    return apiFetch<Equipment>(`/api/equipments/${id}/bottleneck`, { method: 'PATCH', body: JSON.stringify({ isBottleneck }) });
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// DEVICES (camera + microcontroller; measures output/input of equipment)
// ═══════════════════════════════════════════════════════════════════════════

export interface Device {
  id: string;
  externalId: string;
  name: string;
  lineId: string;
  measuresOutputOfEquipmentId: string | null;
  measuresInputOfEquipmentId: string | null;
  streamUrl: string | null;
  lastSeen: string | null;
  isActive: boolean;
}

export interface CreateDevicePayload {
  externalId: string;
  name: string;
  lineId: string;
  measuresOutputOfEquipmentId?: string | null;
  measuresInputOfEquipmentId?: string | null;
  streamUrl?: string | null;
}

export interface UpdateDevicePayload {
  name?: string;
  measuresOutputOfEquipmentId?: string | null;
  measuresInputOfEquipmentId?: string | null;
  streamUrl?: string | null;
  isActive?: boolean;
}

export const DeviceService = {
  async getAll(): Promise<Device[]> {
    if (USE_MOCK) return [];
    return apiFetch<Device[]>('/api/devices');
  },

  async getByLine(lineId: string): Promise<Device[]> {
    if (USE_MOCK) return [];
    return apiFetch<Device[]>(`/api/lines/${lineId}/devices`);
  },

  async create(data: CreateDevicePayload): Promise<Device> {
    if (USE_MOCK) throw new Error('[api] Devices require API');
    return apiFetch<Device>('/api/devices', { method: 'POST', body: JSON.stringify(data) });
  },

  async update(id: string, data: UpdateDevicePayload): Promise<Device> {
    if (USE_MOCK) throw new Error('[api] Devices require API');
    return apiFetch<Device>(`/api/devices/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) throw new Error('[api] Devices require API');
    await apiFetch(`/api/devices/${id}`, { method: 'DELETE' });
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// FLOWS (Products/SKUs)
// ═══════════════════════════════════════════════════════════════════════════

export const FlowService = {
  async getAll(): Promise<ProductionFlow[]> {
    if (USE_MOCK) return structuredClone(mockFlows);
    return apiFetch<ProductionFlow[]>('/api/flows');
  },

  async getByLine(lineId: string): Promise<ProductionFlow[]> {
    if (USE_MOCK) return structuredClone(mockFlows.filter(f => f.lineId === lineId));
    return apiFetch<ProductionFlow[]>(`/api/lines/${lineId}/flows`);
  },

  async create(data: Omit<ProductionFlow, 'id'>): Promise<ProductionFlow> {
    if (USE_MOCK) {
      const flow: ProductionFlow = { ...data, id: `flow-${Date.now()}` };
      mockFlows.push(flow);
      return flow;
    }
    return apiFetch<ProductionFlow>('/api/flows', { method: 'POST', body: JSON.stringify(data) });
  },

  async update(id: string, data: Partial<ProductionFlow>): Promise<ProductionFlow> {
    if (USE_MOCK) {
      const idx = mockFlows.findIndex(f => f.id === id);
      if (idx === -1) throw new Error('Flow not found');
      mockFlows[idx] = { ...mockFlows[idx], ...data };
      return mockFlows[idx];
    }
    return apiFetch<ProductionFlow>(`/api/flows/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK) {
      const idx = mockFlows.findIndex(f => f.id === id);
      if (idx !== -1) mockFlows.splice(idx, 1);
      return;
    }
    await apiFetch(`/api/flows/${id}`, { method: 'DELETE' });
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// STOPS
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateStopPayload {
  machineId: string;
  machineName: string;
  lineId: string;
  category: StopCategory;
  startTime: string;
  endTime?: string | null;
  notes: string;
  registeredBy: string;
}

export const StopService = {
  async getByLine(lineId: string): Promise<Stop[]> {
    if (USE_MOCK) return structuredClone(mockStops.filter(s => s.lineId === lineId));
    return apiFetch<Stop[]>(`/api/lines/${lineId}/stops`);
  },

  async getByMachine(machineId: string): Promise<Stop[]> {
    if (USE_MOCK) return structuredClone(mockStops.filter(s => s.machineId === machineId));
    return apiFetch<Stop[]>(`/api/machines/${machineId}/stops`);
  },

  async getActive(lineId: string): Promise<Stop[]> {
    if (USE_MOCK) return structuredClone(mockStops.filter(s => s.lineId === lineId && !s.endTime));
    return apiFetch<Stop[]>(`/api/lines/${lineId}/stops?active=true`);
  },

  async create(data: CreateStopPayload): Promise<Stop> {
    if (USE_MOCK) {
      const stop: Stop = {
        ...data,
        id: `s-${Date.now()}`,
        endTime: data.endTime ?? null,
        duration: data.endTime
          ? Math.round((new Date(data.endTime).getTime() - new Date(data.startTime).getTime()) / 60000)
          : null,
      };
      mockStops.push(stop);
      return stop;
    }
    return apiFetch<Stop>('/api/stops', { method: 'POST', body: JSON.stringify(data) });
  },

  async close(id: string, endTime: string): Promise<Stop> {
    if (USE_MOCK) {
      const stop = mockStops.find(s => s.id === id);
      if (!stop) throw new Error('Stop not found');
      stop.endTime = endTime;
      stop.duration = Math.round((new Date(endTime).getTime() - new Date(stop.startTime).getTime()) / 60000);
      return structuredClone(stop);
    }
    return apiFetch<Stop>(`/api/stops/${id}/close`, { method: 'PATCH', body: JSON.stringify({ endTime }) });
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// REAL-TIME DATA (Dashboard / LineLive)
// ═══════════════════════════════════════════════════════════════════════════

export interface RealtimeLineData {
  lineId: string;
  machines: Machine[];
  oee: OEEMetrics;
  throughput: number;
}

/** Line snapshot usable as `line` in LineLive (id, name, type, nominalSpeed, machines, oee, throughput, transports). */
export interface LineSnapshotForDisplay extends RealtimeLineData {
  id: string;
  name: string;
  type: string;
  nominalSpeed: number;
  transports?: import('@/types/production').Transport[];
}

/** Raw response from GET /api/realtime/lines/:id (camelCase). */
interface RealtimeLineSnapshotResponse {
  lineId: string;
  lineName: string;
  type?: string;
  nominalSpeed: number;
  throughput: number;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  machines: Array<{
    id: string;
    name: string;
    type: string;
    lineId: string;
    position: number;
    x: number;
    y: number;
    status: string;
    oee: number;
    availability: number;
    performance: number;
    quality: number;
    throughput: number;
    nominalSpeed: number;
  }>;
}

function mapSnapshotToLineSnapshot(res: RealtimeLineSnapshotResponse): LineSnapshotForDisplay {
  const oee: OEEMetrics = {
    availability: res.availability,
    performance: res.performance,
    quality: res.quality,
    oee: res.oee,
  };
  const machines: Machine[] = (res.machines ?? []).map(m => ({
    id: m.id,
    name: m.name,
    type: m.type,
    lineId: m.lineId,
    position: m.position,
    x: m.x,
    y: m.y,
    status: m.status as Machine['status'],
    oee: { availability: m.availability, performance: m.performance, quality: m.quality, oee: m.oee },
    throughput: m.throughput,
    nominalSpeed: m.nominalSpeed,
  }));
  return {
    id: res.lineId,
    lineId: res.lineId,
    name: res.lineName ?? '',
    type: res.type ?? '',
    nominalSpeed: res.nominalSpeed ?? 0,
    machines,
    oee,
    throughput: res.throughput ?? 0,
    transports: [],
  };
}

export interface ParetoDataPoint {
  category: string;
  minutes: number;
  count: number;
}

export const RealtimeService = {
  /** Dados instantâneos de uma linha (polling). Com API, retorna formato para exibição (LineSnapshotForDisplay). */
  async getLineSnapshot(lineId: string): Promise<LineSnapshotForDisplay> {
    if (USE_MOCK) {
      const line = mockLines.find(l => l.id === lineId) ?? mockLines[0];
      return {
        id: line.id,
        lineId: line.id,
        name: line.name,
        type: line.type,
        nominalSpeed: line.nominalSpeed,
        machines: structuredClone(line.machines),
        oee: structuredClone(line.oee),
        throughput: line.throughput,
        transports: structuredClone(line.transports ?? []),
      };
    }
    const res = await apiFetch<RealtimeLineSnapshotResponse>(`/api/realtime/lines/${lineId}`);
    return mapSnapshotToLineSnapshot(res);
  },

  /** DLI (throughput ao longo do dia) */
  async getDLI(lineId: string, date?: string): Promise<DLIDataPoint[]> {
    if (USE_MOCK) return structuredClone(mockDLIData);
    const params = date ? `?date=${date}` : '';
    return apiFetch<DLIDataPoint[]>(`/api/lines/${lineId}/dli${params}`);
  },

  /** Histórico OEE semanal */
  async getOEEHistory(lineId: string): Promise<OEEHistoryPoint[]> {
    if (USE_MOCK) return structuredClone(mockOEEHistory);
    return apiFetch<OEEHistoryPoint[]>(`/api/lines/${lineId}/oee-history`);
  },

  /** Pareto de paradas */
  async getPareto(lineId: string): Promise<ParetoDataPoint[]> {
    if (USE_MOCK) return structuredClone(mockParetoData);
    return apiFetch<ParetoDataPoint[]>(`/api/lines/${lineId}/stops/pareto`);
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// CONNECTIVITY (ESP32 Gateway + Camera)
// ═══════════════════════════════════════════════════════════════════════════

export interface GatewayStatus {
  connected: boolean;
  latency?: number;
  lastSeen?: string;
}

export interface CameraStatus {
  connected: boolean;
  fps?: number;
  lastFrame?: string;
}

export interface ConnectivityStatus {
  gateway: GatewayStatus;
  camera: CameraStatus;
}

export const ConnectivityService = {
  async getStatus(): Promise<ConnectivityStatus> {
    if (USE_MOCK) {
      return {
        gateway: { connected: true, latency: 23, lastSeen: 'agora' },
        camera: { connected: false, fps: 0, lastFrame: '2 min atrás' },
      };
    }
    return apiFetch<ConnectivityStatus>('/api/connectivity/status');
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// AUTH (placeholder — implementar no .NET)
// ═══════════════════════════════════════════════════════════════════════════

export type UserRole = 'admin' | 'lideranca' | 'operacao';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

export const AuthService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    if (USE_MOCK) {
      return {
        user: { id: 'u1', email: payload.email, name: 'Operador Mock', role: 'operacao' },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      };
    }
    return apiFetch<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    if (USE_MOCK) {
      return {
        user: { id: 'u2', email: payload.email, name: payload.name, role: payload.role },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      };
    }
    return apiFetch<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  },

  async me(): Promise<AuthUser> {
    if (USE_MOCK) {
      return { id: 'u1', email: 'operador@fabrica.com', name: 'Operador Mock', role: 'operacao' };
    }
    return apiFetch<AuthUser>('/api/auth/me');
  },

  async logout(): Promise<void> {
    if (USE_MOCK) return;
    await apiFetch('/api/auth/logout', { method: 'POST' });
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// WEBSOCKET (Real-time via SignalR)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Placeholder para conexão real-time via SignalR.
 * No Cursor, implementar com @microsoft/signalr:
 *
 *   import * as signalR from '@microsoft/signalr';
 *
 *   const connection = new signalR.HubConnectionBuilder()
 *     .withUrl(`${API_BASE_URL}/hubs/production`)
 *     .withAutomaticReconnect()
 *     .build();
 *
 * Eventos esperados do hub:
 *   - "MachineStatusChanged"  → { machineId, status, timestamp }
 *   - "ThroughputUpdate"      → { machineId, throughput, timestamp }
 *   - "OEEUpdate"             → { lineId, oee: OEEMetrics }
 *   - "StopStarted"           → Stop
 *   - "StopEnded"             → Stop
 *   - "GatewayStatusChanged"  → GatewayStatus
 *   - "CameraStatusChanged"   → CameraStatus
 */
export const WebSocketEvents = {
  MACHINE_STATUS_CHANGED: 'MachineStatusChanged',
  THROUGHPUT_UPDATE: 'ThroughputUpdate',
  OEE_UPDATE: 'OEEUpdate',
  STOP_STARTED: 'StopStarted',
  STOP_ENDED: 'StopEnded',
  GATEWAY_STATUS_CHANGED: 'GatewayStatusChanged',
  CAMERA_STATUS_CHANGED: 'CameraStatusChanged',
} as const;
