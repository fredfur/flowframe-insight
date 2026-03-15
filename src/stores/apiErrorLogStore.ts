import { create } from 'zustand';

export interface ApiErrorEntry {
  id: string;
  timestamp: string;
  endpoint: string;
  method: string;
  status: number;
  statusText: string;
  message: string;
  body?: string;
}

const MAX_ENTRIES = 200;

interface ApiErrorLogStore {
  entries: ApiErrorEntry[];
  push: (entry: Omit<ApiErrorEntry, 'id' | 'timestamp'>) => void;
  clear: () => void;
}

export const useApiErrorLogStore = create<ApiErrorLogStore>((set) => ({
  entries: [],

  push: (entry) =>
    set((state) => ({
      entries: [
        {
          ...entry,
          id: `api-err-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          timestamp: new Date().toISOString(),
        },
        ...state.entries,
      ].slice(0, MAX_ENTRIES),
    })),

  clear: () => set({ entries: [] }),
}));
