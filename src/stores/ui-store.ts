import { create } from 'zustand';

interface UIState {
  // Sidebar state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Active modals
  activeModal: string | null;
  modalData: unknown;
  openModal: (modal: string, data?: unknown) => void;
  closeModal: () => void;

  // Navigation
  currentRoute: string;
  setCurrentRoute: (route: string) => void;

  // Workout state (ephemeral)
  activeWorkoutId: string | null;
  restTimerEnd: number | null;
  setActiveWorkoutId: (id: string | null) => void;
  startRestTimer: (durationSeconds: number) => void;
  stopRestTimer: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  activeModal: null,
  modalData: null,
  openModal: (modal, data) => set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  currentRoute: '/dashboard',
  setCurrentRoute: (route) => set({ currentRoute: route }),

  activeWorkoutId: null,
  restTimerEnd: null,
  setActiveWorkoutId: (id) => set({ activeWorkoutId: id }),
  startRestTimer: (durationSeconds) =>
    set({ restTimerEnd: Date.now() + durationSeconds * 1000 }),
  stopRestTimer: () => set({ restTimerEnd: null }),
}));
