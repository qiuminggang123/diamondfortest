import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info';

interface ConfirmOptions {
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface LoadingOptions {
  message?: string;
  progress?: number; // 0-100
}

interface UIState {
  toast: {
    visible: boolean;
    message: string;
    type: ToastType;
  };
  confirmDialog: {
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  };
  loginModal: {
    visible: boolean;
  };
  registerModal: {
    visible: boolean;
  };
  loadingModal: {
    visible: boolean;
    message: string;
    progress: number;
  };

  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
  
  showConfirm: (options: ConfirmOptions) => void;
  hideConfirm: () => void;
  
  setShowLogin: (visible: boolean) => void;
  showRegister: (visible: boolean) => void;
  
  showLoading: (options?: LoadingOptions) => void;
  hideLoading: () => void;
  updateLoadingProgress: (progress: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  toast: {
    visible: false,
    message: '',
    type: 'info',
  },
  confirmDialog: {
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  },
  loginModal: {
    visible: false,
  },
  registerModal: {
    visible: false,
  },
  loadingModal: {
    visible: false,
    message: '处理中...',
    progress: 0,
  },

  showToast: (message, type = 'info') => {
    set({ toast: { visible: true, message, type } });
    setTimeout(() => {
        set((state) => {
            // Only hide if the message hasn't changed (simple debounce)
            if (state.toast.message === message) {
                return { toast: { ...state.toast, visible: false } };
            }
            return state;
        });
    }, 3000);
  },
  hideToast: () => set((state) => ({ toast: { ...state.toast, visible: false } })),

  showConfirm: ({ title = '确认', message, onConfirm, onCancel }) => {
    set({
      confirmDialog: {
        visible: true,
        title,
        message,
        onConfirm: () => {
          set((state) => ({ confirmDialog: { ...state.confirmDialog, visible: false } }));
          onConfirm();
        },
        onCancel: () => {
          set((state) => ({ confirmDialog: { ...state.confirmDialog, visible: false } }));
          if (onCancel) onCancel();
        },
      },
    });
  },
  hideConfirm: () => set((state) => ({ confirmDialog: { ...state.confirmDialog, visible: false } })),
  
  setShowLogin: (visible) => set((state) => ({ 
    ...state,
    loginModal: { ...state.loginModal, visible } 
  })),
  
  showRegister: (visible) => set((state) => ({ 
    ...state,
    registerModal: { ...state.registerModal, visible } 
  })),
  
  showLoading: ({ message = '处理中...', progress = 0 } = {}) => {
    set({ 
      loadingModal: { 
        visible: true, 
        message, 
        progress 
      } 
    });
  },
  
  hideLoading: () => set((state) => ({ 
    loadingModal: { 
      ...state.loadingModal, 
      visible: false,
      progress: 0 
    } 
  })),
  
  updateLoadingProgress: (progress) => set((state) => ({ 
    loadingModal: { 
      ...state.loadingModal, 
      progress 
    } 
  })),
}));