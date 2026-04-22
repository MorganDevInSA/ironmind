import { create } from 'zustand';

interface OnlineState {
  isOnline: boolean;
  setOnline: (online: boolean) => void;
}

export const useOnlineStore = create<OnlineState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  setOnline: (online: boolean) => set({ isOnline: online }),
}));
