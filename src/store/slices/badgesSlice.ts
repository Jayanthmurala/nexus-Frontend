import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type {
  BadgeDefinition,
  CreateBadgeDefinitionPayload,
  UpdateBadgeDefinitionPayload,
  StudentBadgeAward,
  AwardBadgePayload,
} from '@/lib/profileApi';
import {
  getBadgeDefinitions,
  createBadgeDefinition,
  updateBadgeDefinition,
  deleteBadgeDefinition,
  getAwards,
  getRecentAwards,
  getAwardCounts,
  awardBadge as apiAwardBadge,
} from '@/lib/profileApi';

interface BadgesState {
  definitions: BadgeDefinition[];
  awardsByStudent: Record<string, StudentBadgeAward[]>;
  badges: StudentBadgeAward[]; // Alias for profile components
  recentAwards: StudentBadgeAward[];
  awardCounts: Record<string, number>;
  loading: boolean;
  error?: string;
  loadingByStudent: Record<string, boolean>;
}

const initialState: BadgesState = {
  definitions: [],
  awardsByStudent: {},
  badges: [],
  recentAwards: [],
  awardCounts: {},
  loading: false,
  loadingByStudent: {},
};

export const fetchBadgeDefinitions = createAsyncThunk<BadgeDefinition[]>(
  'badges/fetchDefinitions',
  async () => {
    const defs = await getBadgeDefinitions();
    return defs;
  }
);

export const fetchAwardsForStudent = createAsyncThunk<
  { studentId: string; awards: StudentBadgeAward[] },
  { studentId: string }
>('badges/fetchAwardsForStudent', async ({ studentId }) => {
  const awards = await getAwards(studentId);
  // sort desc by date
  awards.sort((a, b) => new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime());
  return { studentId, awards };
});

// Alias for profile components
export const fetchStudentBadges = fetchAwardsForStudent;

export const fetchRecentAwards = createAsyncThunk<StudentBadgeAward[], { limit?: number } | undefined>(
  'badges/fetchRecentAwards',
  async (arg) => {
    const list = await getRecentAwards(arg?.limit);
    return list;
  }
);

export const fetchAwardCounts = createAsyncThunk<Record<string, number>>(
  'badges/fetchAwardCounts',
  async () => {
    const counts = await getAwardCounts();
    return counts;
  }
);

export const awardBadge = createAsyncThunk<StudentBadgeAward, AwardBadgePayload>(
  'badges/awardBadge',
  async (payload) => {
    const created = await apiAwardBadge(payload);
    return created;
  }
);

export const createBadgeDefinitionThunk = createAsyncThunk<BadgeDefinition, CreateBadgeDefinitionPayload>(
  'badges/createDefinition',
  async (payload) => {
    const created = await createBadgeDefinition(payload);
    return created;
  }
);

export const updateBadgeDefinitionThunk = createAsyncThunk<BadgeDefinition, { id: string; changes: UpdateBadgeDefinitionPayload }>(
  'badges/updateDefinition',
  async ({ id, changes }) => {
    const updated = await updateBadgeDefinition(id, changes);
    return updated;
  }
);

export const deleteBadgeDefinitionThunk = createAsyncThunk<string, string>(
  'badges/deleteDefinition',
  async (id) => {
    await deleteBadgeDefinition(id);
    return id;
  }
);

const badgesSlice = createSlice({
  name: 'badges',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBadgeDefinitions.pending, (state) => {
        state.loading = true;
        state.error = undefined;
      })
      .addCase(fetchBadgeDefinitions.fulfilled, (state, action: PayloadAction<BadgeDefinition[]>) => {
        state.loading = false;
        state.definitions = action.payload;
      })
      .addCase(fetchBadgeDefinitions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load badges';
      })
      .addCase(fetchAwardsForStudent.pending, (state, action) => {
        const studentId = (action.meta.arg as any).studentId as string;
        state.loadingByStudent[studentId] = true;
      })
      .addCase(fetchAwardsForStudent.fulfilled, (state, action) => {
        const { studentId, awards } = action.payload;
        state.awardsByStudent[studentId] = awards;
        state.badges = awards; // Update badges array for profile components
        state.loadingByStudent[studentId] = false;
      })
      .addCase(fetchAwardsForStudent.rejected, (state, action) => {
        const studentId = (action.meta.arg as any).studentId as string;
        state.loadingByStudent[studentId] = false;
        state.error = action.error.message || 'Failed to load awards';
      })
      .addCase(fetchRecentAwards.fulfilled, (state, action: PayloadAction<StudentBadgeAward[]>) => {
        state.recentAwards = action.payload;
      })
      .addCase(fetchAwardCounts.fulfilled, (state, action: PayloadAction<Record<string, number>>) => {
        state.awardCounts = action.payload;
      })
      .addCase(awardBadge.fulfilled, (state, action: PayloadAction<StudentBadgeAward>) => {
        const award = action.payload;
        const arr = state.awardsByStudent[award.studentId] || [];
        state.awardsByStudent[award.studentId] = [award, ...arr];
        state.recentAwards = [award, ...state.recentAwards].slice(0, 50);
        state.awardCounts[award.badgeId] = (state.awardCounts[award.badgeId] || 0) + 1;
      })
      .addCase(createBadgeDefinitionThunk.fulfilled, (state, action: PayloadAction<BadgeDefinition>) => {
        state.definitions = [action.payload, ...state.definitions];
      })
      .addCase(updateBadgeDefinitionThunk.fulfilled, (state, action: PayloadAction<BadgeDefinition>) => {
        state.definitions = state.definitions.map((d) => (d.id === action.payload.id ? action.payload : d));
      })
      .addCase(deleteBadgeDefinitionThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.definitions = state.definitions.filter((d) => d.id !== action.payload);
      });
  },
});

export const selectBadgeDefinitions = (state: RootState) => state.badges.definitions;
export const selectBadgeById = (state: RootState, id: string) =>
  state.badges.definitions.find((d: BadgeDefinition) => d.id === id);
export const selectAwardsForStudent = (state: RootState, studentId: string) => state.badges.awardsByStudent[studentId] || [];
export const selectRecentAwards = (state: RootState) => state.badges.recentAwards;
export const selectAwardCounts = (state: RootState) => state.badges.awardCounts;
export const selectBadgesLoading = (state: RootState) => state.badges.loading;

// Selector for current user's badges (assumes current user ID is available in auth state)
export const selectMyBadges = (state: RootState) => {
  // This will need to be updated based on how user ID is stored in your auth state
  // For now, returning empty array - should be connected to auth state
  return [];
};

export default badgesSlice.reducer;
