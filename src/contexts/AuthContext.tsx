'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut, useSession } from 'next-auth/react';
import { getMe } from '@/lib/me';
import http from '@/lib/http';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
// Profile slice removed - profile functionality disabled
import { useRouter } from 'next/navigation';

export type UserRole = 'student' | 'faculty' | 'dept_admin' | 'placements_admin' | 'head_admin' | 'HEAD_ADMIN';

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  website?: string;
  resume?: string;
  scholar?: string;
  orcid?: string;
  twitter?: string;
}

export interface User {
  displayName: string;
  id: string;
  name: string;
  email: string;
  role: UserRole;
  collegeId?: string; // used during registration for profile initialization
  department?: string;
  year?: number;
  skills?: string[];
  expertise?: string[];
  bio?: string;
  avatar?: string;
  collegeMemberId?: string;
  contactInfo?: string;
  social?: SocialLinks;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  // Profile functionality removed
  const router = useRouter();

  // Guards to prevent redundant fetches/updates
  const lastSessionUserIdRef = useRef<string | null>(null);
  const inFlightMeRef = useRef(false);
  const meResolvedRef = useRef(false);
  const lastMeSyncAtRef = useRef<number>(0);
  const ME_SYNC_DEBOUNCE_MS = 15000; // 15s

  useEffect(() => {
    // Treat session pending or role resolution pending as loading to avoid wrong redirects/data fetches
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (status === 'authenticated' && session?.user) {
      // hydrate profile slice once per session user id change
      const sessionUserId = (session as any)?.user?.id as string | undefined;
      if (sessionUserId && lastSessionUserIdRef.current !== sessionUserId) {
        lastSessionUserIdRef.current = sessionUserId;
        try { console.debug('[AuthContext] profile functionality disabled', { userId: sessionUserId }); } catch {}
        // Profile functionality removed
      }

      const allowed = ['student','faculty','dept_admin','placements_admin','head_admin'] as const;
      const roles = ((session as any).user?.roles as string[] | undefined) ?? [];
      const hasAccessToken = Boolean((session as any).accessToken);
      const hasValidRole = roles.length > 0;
      const oauthPending = !!(session as any)?.oauth && !hasAccessToken;

      try { console.debug('[AuthContext] session state', { hasAccessToken, roles, oauthPending }); } catch {}

      // If OAuth just completed (roles empty and oauth present) OR roles not yet available, wait.
      if (oauthPending || !hasValidRole) {
        setLoading(true);
        // If we do have an access token, try resolving role via /me (guarded and debounced)
        if (
          hasAccessToken &&
          !inFlightMeRef.current &&
          (!meResolvedRef.current || Date.now() - lastMeSyncAtRef.current > ME_SYNC_DEBOUNCE_MS)
        ) {
          inFlightMeRef.current = true;
          (async () => {
            try {
              const res = await getMe();
              if (res.ok && res.data) {
                const me = res.data;
                const r2 = (me.roles?.[0] ?? 'STUDENT').toLowerCase();
                const role2 = (allowed as readonly string[]).includes(r2) ? (r2 as UserRole) : ('student' as UserRole);
                const nextUser: User = {
                  id: me.id,
                  name: me.displayName || (session.user.name as string) || '',
                  email: me.email || session.user.email || '',
                  role: role2,
                  avatar: me.avatarUrl || undefined,
                  collegeId: me.collegeId,
                  department: me.department,
                  year: me.year,
                  collegeMemberId: me.collegeMemberId,
                  createdAt: new Date(),
                  displayName: ''
                };
                setUser((prev) => {
                  const same = !!prev && prev.id === nextUser.id && prev.email === nextUser.email && prev.role === nextUser.role && (prev.name || '') === (nextUser.name || '');
                  return same ? prev : nextUser;
                });
                meResolvedRef.current = true;
                lastMeSyncAtRef.current = Date.now();
                setLoading(false);
                try { console.debug('[AuthContext] role resolved via /me', { role: role2 }); } catch {}
              }
            } catch (e) {
              try { console.error('[AuthContext] /me failed', e); } catch {}
              setLoading(false);
            } finally {
              inFlightMeRef.current = false;
            }
          })();
        }
        return;
      }

      // We have roles from session; set user immediately
      const primary = roles[0].toLowerCase();
      const role = (allowed as readonly string[]).includes(primary) ? (primary as UserRole) : ('student' as UserRole);
      const mapped: User = {
        id: (session as any).user.id,
        name: (session.user.name as string) || '',
        email: session.user.email || '',
        role,
        avatar: (session as any).user.avatarUrl || undefined,
        collegeId: (session as any).user.collegeId,
        department: (session as any).user.department,
        year: (session as any).user.year,
        collegeMemberId: (session as any).user.collegeMemberId,
        createdAt: new Date(),
        displayName: ''
      };
      setUser((prev) => {
        const same = !!prev && prev.id === mapped.id && prev.email === mapped.email && prev.role === mapped.role && (prev.name || '') === (mapped.name || '');
        if (same) {
          try { console.debug('[AuthContext] skip setUser: no changes'); } catch {}
          return prev;
        }
        return mapped;
      });
      setLoading(false);

      // Optionally sync from backend /v1/auth/me to keep roles fresh
      if (
        hasAccessToken &&
        !meResolvedRef.current &&
        !inFlightMeRef.current &&
        (Date.now() - lastMeSyncAtRef.current > ME_SYNC_DEBOUNCE_MS)
      ) {
        inFlightMeRef.current = true;
        (async () => {
          try {
            const res = await getMe();
            if (res.ok && res.data) {
              const me = res.data;
              const r2 = (me.roles?.[0] ?? 'STUDENT').toLowerCase();
              const role2 = (allowed as readonly string[]).includes(r2) ? (r2 as UserRole) : ('student' as UserRole);
              const nextUser: User = {
                id: me.id,
                name: me.displayName || '',
                email: me.email,
                role: role2,
                avatar: me.avatarUrl || undefined,
                collegeId: me.collegeId,
                department: me.department,
                year: me.year,
                collegeMemberId: me.collegeMemberId,
                createdAt: new Date(),
                displayName: ''
              };
              setUser((prev) => {
                const same = !!prev && prev.id === nextUser.id && prev.email === nextUser.email && prev.role === nextUser.role && (prev.name || '') === (nextUser.name || '');
                return same ? prev : nextUser;
              });
              lastMeSyncAtRef.current = Date.now();
              try { console.debug('[AuthContext] role refreshed via /me', { role: role2 }); } catch {}
            }
          } catch (e) {
            try { console.error('[AuthContext] /me refresh failed', e); } catch {}
          } finally {
            inFlightMeRef.current = false;
          }
        })();
      }
    } else if (status === 'unauthenticated') {
      setUser(null);
      setLoading(false);
    } else {
      // Keep loading true for initial state or unknown status
      setLoading(true);
    }
  }, [session, status, dispatch]);


  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { data } = await http.post(`/v1/auth/login`, { email, password });
      if (!data?.accessToken) return false;
      const result = await nextAuthSignIn('credentials', {
        accessToken: data.accessToken,
        user: JSON.stringify(data.user),
        redirect: false,
      });
      return !result?.error;
    } finally {
      setLoading(false);
    }
  };


  const logout = async () => {
    try {
      await http.post(`/v1/auth/logout`);
    } catch {}
    await nextAuthSignOut({ redirect: false });
    setUser(null);
    // Force redirect to login page
    window.location.href = '/login';
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      // Persist supported fields via profile-service using Redux thunk
      const backendChanges: any = {};
      if (typeof updates.year !== 'undefined') backendChanges.year = updates.year;
      if (typeof updates.skills !== 'undefined') backendChanges.skills = updates.skills;
      if (typeof updates.expertise !== 'undefined') backendChanges.expertise = updates.expertise;
      if (updates.social) {
        const isHttp = (v: unknown) => typeof v === 'string' && /^https?:\/\//i.test(v);
        if (typeof updates.social.linkedin !== 'undefined') {
          if (!updates.social.linkedin || isHttp(updates.social.linkedin)) backendChanges.linkedIn = updates.social.linkedin;
        }
        if (typeof updates.social.github !== 'undefined') {
          if (!updates.social.github || isHttp(updates.social.github)) backendChanges.github = updates.social.github;
        }
        if (typeof updates.social.resume !== 'undefined') {
          if (!updates.social.resume || isHttp(updates.social.resume)) backendChanges.resumeUrl = updates.social.resume;
        }
        if (typeof updates.social.twitter !== 'undefined') {
          if (!updates.social.twitter || isHttp(updates.social.twitter)) backendChanges.twitter = updates.social.twitter;
        }
      }
      if (typeof updates.bio !== 'undefined') backendChanges.bio = updates.bio;
      if (typeof updates.collegeMemberId !== 'undefined') backendChanges.collegeMemberId = updates.collegeMemberId;
      if (typeof updates.contactInfo !== 'undefined') backendChanges.contactInfo = updates.contactInfo;
      if (typeof updates.avatar !== 'undefined') {
        const v = updates.avatar;
        if (typeof v === 'string' && /^https?:\/\//i.test(v)) {
          backendChanges.avatar = v;
        }
      }
      // Only dispatch if we have an existing profile (collegeId & department known)
      // Profile functionality removed - no backend sync
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      updateProfile,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
