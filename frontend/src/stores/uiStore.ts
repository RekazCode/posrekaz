/**
 * UI Store for global UI state
 * Manages modals, toasts, and other UI state
 */

import { create } from 'zustand';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UIState {
  // Modals
  modals: Record<string, boolean>;
  openModal: (name: string) => void;
  closeModal: (name: string) => void;
  toggleModal: (name: string) => void;
  isModalOpen: (name: string) => boolean;

  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Loading states
  loadingStates: Record<string, boolean>;
  setLoading: (key: string, isLoading: boolean) => void;
  isLoading: (key: string) => boolean;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

let toastId = 0;

export const useUIStore = create<UIState>()((set, get) => ({
  // Modals
  modals: {},

  openModal: (name: string) => {
    set((state) => ({
      modals: { ...state.modals, [name]: true },
    }));
  },

  closeModal: (name: string) => {
    set((state) => ({
      modals: { ...state.modals, [name]: false },
    }));
  },

  toggleModal: (name: string) => {
    set((state) => ({
      modals: { ...state.modals, [name]: !state.modals[name] },
    }));
  },

  isModalOpen: (name: string) => {
    return get().modals[name] || false;
  },

  // Toasts
  toasts: [],

  addToast: (toast: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastId}`;
    const newToast: Toast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  // Loading states
  loadingStates: {},

  setLoading: (key: string, isLoading: boolean) => {
    set((state) => ({
      loadingStates: { ...state.loadingStates, [key]: isLoading },
    }));
  },

  isLoading: (key: string) => {
    return get().loadingStates[key] || false;
  },

  // Sidebar
  sidebarOpen: false,

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },
}));

// Helper functions for common toast patterns
export const toast = {
  success: (message: string, duration?: number) => {
    useUIStore.getState().addToast({ type: 'success', message, duration });
  },
  error: (message: string, duration?: number) => {
    useUIStore.getState().addToast({ type: 'error', message, duration });
  },
  warning: (message: string, duration?: number) => {
    useUIStore.getState().addToast({ type: 'warning', message, duration });
  },
  info: (message: string, duration?: number) => {
    useUIStore.getState().addToast({ type: 'info', message, duration });
  },
};
