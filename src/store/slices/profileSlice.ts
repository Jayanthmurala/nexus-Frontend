import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { profileApi, Profile, Experience } from '@/lib/profileApi';

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  error?: string;
  updating: boolean;
}

const initialState: ProfileState = {
  profile: null,
  loading: false,
  updating: false,
};

// Async thunks
export const fetchProfile = createAsyncThunk<Profile, string>(
  'profile/fetchProfile',
  async (userId) => {
    const response = await profileApi.getProfile(userId);
    return response;
  }
);

export const updateProfile = createAsyncThunk<Profile, Partial<Profile>>(
  'profile/updateProfile',
  async (data) => {
    console.log('profileSlice: Calling updateProfile API with data:', data);
    const response = await profileApi.updateProfile(data);
    console.log('profileSlice: API response:', response);
    return response;
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = undefined;
    },
    clearProfile: (state) => {
      state.profile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchProfile.fulfilled, (state, action: PayloadAction<Profile>) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load profile';
      })
      
      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.updating = true;
        state.error = undefined;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<Profile>) => {
        state.updating = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updating = false;
        state.error = action.error.message || 'Failed to update profile';
      });
  },
});

// Selectors
export const selectProfile = (state: RootState) => state.profile.profile;
export const selectProfileLoading = (state: RootState) => state.profile.loading;
export const selectProfileError = (state: RootState) => state.profile.error;
export const selectProfileUpdating = (state: RootState) => state.profile.updating;

// Actions
export const { clearError, clearProfile } = profileSlice.actions;

export default profileSlice.reducer;
