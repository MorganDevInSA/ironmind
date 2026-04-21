import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppTheme = 'crimson' | 'hot-pink' | 'custom';

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

  // Theme
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  customAccent: string;
  setCustomAccent: (hex: string) => void;

  // Workout state (ephemeral)
  activeWorkoutId: string | null;
  restTimerEnd: number | null;
  setActiveWorkoutId: (id: string | null) => void;
  startRestTimer: (durationSeconds: number) => void;
  stopRestTimer: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      activeModal: null,
      modalData: null,
      openModal: (modal, data) => set({ activeModal: modal, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),

      currentRoute: '/dashboard',
      setCurrentRoute: (route) => set({ currentRoute: route }),

      theme: 'crimson',
      setTheme: (theme) => set({ theme }),
      customAccent: '#DC2626',
      setCustomAccent: (hex) => set({ customAccent: hex }),

      activeWorkoutId: null,
      restTimerEnd: null,
      setActiveWorkoutId: (id) => set({ activeWorkoutId: id }),
      startRestTimer: (durationSeconds) =>
        set({ restTimerEnd: Date.now() + durationSeconds * 1000 }),
      stopRestTimer: () => set({ restTimerEnd: null }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
        customAccent: state.customAccent,
      }),
    }
  )
);
