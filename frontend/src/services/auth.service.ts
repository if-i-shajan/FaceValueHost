import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { User } from '../types'

export interface RegisterData {
  name: string
  email: string
  password: string
  age: number
  gender: string
  country?: string
}

export const authService = {
  async register(data: RegisterData): Promise<User> {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          age: data.age,
          gender: data.gender,
          country: data.country || null,
          role: 'user',
        },
      },
    })
    if (error || !authData.user) {
      throw new Error(error?.message || 'Registration failed')
    }

    const userProfile: Omit<User, 'uid'> = {
      email: data.email,
      name: data.name,
      age: data.age,
      gender: data.gender as User['gender'],
      country: data.country,
      role: 'user',
      createdAt: new Date(),
      participationCount: 0,
      qualityScore: 100,
      isFlagged: false,
    }

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: data.email,
        name: data.name,
        age: data.age,
        gender: data.gender,
        country: data.country || null,
        role: 'user',
        participation_count: 0,
        quality_score: 100,
        is_flagged: false,
      })

    if (insertError) {
      throw new Error(insertError.message)
    }

    return { uid: authData.user.id, ...userProfile }
  },

  async login(email: string, password: string): Promise<{ user: SupabaseUser; role: string }> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      throw new Error(error?.message || 'Login failed')
    }
    const role = await authService.getUserRole(data.user)
    return { user: data.user, role }
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  },

  async getUserProfile(uid: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .single()
    if (error || !data) return null
    return {
      uid: data.id,
      email: data.email,
      name: data.name,
      age: data.age,
      gender: data.gender,
      country: data.country || undefined,
      role: data.role || 'user',
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
      participationCount: data.participation_count ?? 0,
      qualityScore: data.quality_score ?? 100,
      isFlagged: !!data.is_flagged,
    }
  },

  onAuthStateChange(callback: (user: SupabaseUser | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null)
    })
    return () => data.subscription.unsubscribe()
  },

  async getUserRole(user: SupabaseUser): Promise<string> {
    const profile = await authService.getUserProfile(user.id)
    return profile?.role || 'user'
  },
}
