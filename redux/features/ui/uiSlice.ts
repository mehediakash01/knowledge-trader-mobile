import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

interface ToastState {
  message: string | null;
  type: ToastType;
  visible: boolean;
}

interface UiState {
  toast: ToastState;
}

const initialState: UiState = {
  toast: {
    message: null,
    type: 'info',
    visible: false,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showToast: (state, action: PayloadAction<{ message: string; type?: ToastType }>) => {
      state.toast.message = action.payload.message;
      state.toast.type = action.payload.type || 'info';
      state.toast.visible = true;
    },
    hideToast: (state) => {
      state.toast.visible = false;
    },
  },
});

export const { showToast, hideToast } = uiSlice.actions;
export default uiSlice.reducer;
