import { create } from 'zustand';

interface LineStore {
  selectedLineId: string;
  setSelectedLineId: (id: string) => void;
}

export const useLineStore = create<LineStore>((set) => ({
  selectedLineId: 'line-1',
  setSelectedLineId: (id) => set({ selectedLineId: id }),
}));
