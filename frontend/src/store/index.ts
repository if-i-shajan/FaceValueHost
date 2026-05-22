import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { User } from '../types'

interface AuthState {
  authUser: SupabaseUser | null
  userProfile: User | null
  isLoading: boolean
  isAuthenticated: boolean
  role: 'user' | 'admin' | null
  setAuthUser: (user: SupabaseUser | null) => void
  setUserProfile: (profile: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      authUser: null,
      userProfile: null,
      isLoading: true,
      isAuthenticated: false,
      role: null,
      setAuthUser: (user) =>
        set({
          authUser: user,
          isAuthenticated: !!user,
        }),
      setUserProfile: (profile) =>
        set({
          userProfile: profile,
          role: profile?.role ?? null,
        }),
      setLoading: (loading) => set({ isLoading: loading }),
      logout: () =>
        set({
          authUser: null,
          userProfile: null,
          isAuthenticated: false,
          role: null,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ role: state.role }),
    },
  ),
)

// ─── Survey Session Store ─────────────────────────────────────
interface SurveySessionState {
  surveyId: string | null
  participantId: string | null
  currentIndex: number
  photoOrder: string[]
  completedIds: string[]
  skippedIds: string[]
  skipCount: number
  isOnBreak: boolean
  breakEndTime: number | null
  lastRatingTime: number | null
  consecutiveIdenticalRatings: number
  lastRating: number | null
  setSurveySession: (data: Partial<SurveySessionState>) => void
  resetSession: () => void
  markCompleted: (photoId: string) => void
  markSkipped: (photoId: string) => void
  incrementIndex: () => void
  recordRating: (rating: number) => void
}

export const useSurveySessionStore = create<SurveySessionState>()(
  persist(
    (set, get) => ({
      surveyId: null,
      participantId: null,
      currentIndex: 0,
      photoOrder: [],
      completedIds: [],
      skippedIds: [],
      skipCount: 0,
      isOnBreak: false,
      breakEndTime: null,
      lastRatingTime: null,
      consecutiveIdenticalRatings: 0,
      lastRating: null,
      setSurveySession: (data) => set((state) => ({ ...state, ...data })),
      resetSession: () =>
        set({
          surveyId: null,
          participantId: null,
          currentIndex: 0,
          photoOrder: [],
          completedIds: [],
          skippedIds: [],
          skipCount: 0,
          isOnBreak: false,
          breakEndTime: null,
          lastRatingTime: null,
          consecutiveIdenticalRatings: 0,
          lastRating: null,
        }),
      markCompleted: (photoId) =>
        set((state) => ({
          completedIds: [...state.completedIds, photoId],
          currentIndex: state.currentIndex + 1,
        })),
      markSkipped: (photoId) =>
        set((state) => ({
          skippedIds: [...state.skippedIds, photoId],
          skipCount: state.skipCount + 1,
          currentIndex: state.currentIndex + 1,
        })),
      incrementIndex: () =>
        set((state) => ({ currentIndex: state.currentIndex + 1 })),
      recordRating: (rating) =>
        set((state) => ({
          lastRating: rating,
          lastRatingTime: Date.now(),
          consecutiveIdenticalRatings:
            rating === state.lastRating ? state.consecutiveIdenticalRatings + 1 : 0,
        })),
    }),
    {
      name: 'survey-session',
    },
  ),
)

// ─── Admin UI Store ────────────────────────────────────────────
interface AdminUIState {
  sidebarCollapsed: boolean
  activePage: string
  toggleSidebar: () => void
  setActivePage: (page: string) => void
}

export const useAdminUIStore = create<AdminUIState>((set) => ({
  sidebarCollapsed: false,
  activePage: 'dashboard',
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setActivePage: (page) => set({ activePage: page }),
}))
