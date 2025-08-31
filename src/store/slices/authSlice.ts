import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { getCurrentUser, loginUser as apiLoginUser } from '@/lib/authApi';
import type { AuthResponse } from '@/lib/authApi';

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  avatar?: string;
  collegeMemberId?: string;
  college?: string;
  department?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error?: string;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
};

// Real auth thunks using backend API
export const checkAuth = createAsyncThunk<User>(
  'auth/checkAuth',
  async () => {
    try {
      const userData = await getCurrentUser();
      // Transform the API response to match our User interface
      return {
        id: userData.id,
        name: userData.displayName,
        email: userData.email,
        roles: userData.roles,
        avatar: userData.avatarUrl || undefined,
        // Note: Additional fields like collegeMemberId, college, department 
        // should come from the profile API, not auth API
      };
    } catch (error) {
      console.error('Auth check failed:', error);
      throw error;
    }
  }
);

export const loginUser = createAsyncThunk<User, { email: string; password: string }>(
  'auth/login',
  async ({ email, password }) => {
    try {
      const authResponse = await apiLoginUser(email, password);
      // Transform the API response to match our User interface
      return {
        id: authResponse.user.id,
        name: authResponse.user.displayName,
        email: authResponse.user.email,
        roles: authResponse.user.roles,
        avatar: authResponse.user.avatarUrl || undefined,
        // Note: Additional fields like collegeMemberId, college, department 
        // should come from the profile API, not auth API
      };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = undefined;
    },
    clearError: (state) => {
      state.error = undefined;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Authentication failed';
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      });
  },
});

// Selectors
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;

// Actions
export const { setUser, clearAuth, clearError } = authSlice.actions;

export default authSlice.reducer;
