import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import bannerReducer from './slices/bannerSlice';
import studentProjectsReducer from './slices/studentProjectsSlice';
import publicationsReducer from './slices/publicationsSlice';
import badgesReducer from './slices/badgesSlice';
import collegesReducer from './slices/collegesSlice';
import projectsReducer from './slices/projectsSlice';
import applicationsReducer from './slices/applicationsSlice';
import commentsReducer from './slices/commentsSlice';
import tasksReducer from './slices/tasksSlice';
import attachmentsReducer from './slices/attachmentsSlice';
import eventsReducer from './slices/eventsSlice';
import profileReducer from './slices/profileSlice';
import authReducer from './slices/authSlice';
import feedReducer from './slices/feedSlice';
import networkReducer from './slices/networkSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    banner: bannerReducer,
    studentProjects: studentProjectsReducer,
    publications: publicationsReducer,
    badges: badgesReducer,
    colleges: collegesReducer,
    projects: projectsReducer,
    applications: applicationsReducer,
    comments: commentsReducer,
    tasks: tasksReducer,
    attachments: attachmentsReducer,
    events: eventsReducer,
    profile: profileReducer,
    auth: authReducer,
    feed: feedReducer,
    network: networkReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
