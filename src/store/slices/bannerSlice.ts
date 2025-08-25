import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type BannerVariant = 'info' | 'success' | 'warning' | 'error';

interface BannerState {
  visible: boolean;
  message: string | null;
  variant: BannerVariant;
}

const initialState: BannerState = {
  visible: false,
  message: null,
  variant: 'info',
};

const bannerSlice = createSlice({
  name: 'banner',
  initialState,
  reducers: {
    showBanner(
      state,
      action: PayloadAction<{ message: string; variant?: BannerVariant }>
    ) {
      state.visible = true;
      state.message = action.payload.message;
      state.variant = action.payload.variant ?? 'info';
    },
    hideBanner(state) {
      state.visible = false;
    },
    setBannerMessage(state, action: PayloadAction<string | null>) {
      state.message = action.payload;
    },
    setBannerVisible(state, action: PayloadAction<boolean>) {
      state.visible = action.payload;
    },
  },
});

export const { showBanner, hideBanner, setBannerMessage, setBannerVisible } = bannerSlice.actions;
export default bannerSlice.reducer;
