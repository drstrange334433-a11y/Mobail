/**
 * Paracha Mobile Shop — Authentication Service
 * Trust • Quality • Technology
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export const authService = {
  /**
   * Real Supabase email/password sign-in
   */
  async signInWithPassword(email: string, password: string): Promise<{ session: Session | null; user: User | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return {
        session: null,
        user: null,
        error: new Error('SUPABASE_NOT_CONFIGURED: Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'),
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        return { session: null, user: null, error };
      }

      return { session: data.session, user: data.user, error: null };
    } catch (err: unknown) {
      return {
        session: null,
        user: null,
        error: err instanceof Error ? err : new Error('An unexpected network error occurred while signing in.'),
      };
    }
  },

  /**
   * Real Supabase Sign Out
   */
  async signOut(): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signOut();
      return { error: error || null };
    } catch (err: unknown) {
      return {
        error: err instanceof Error ? err : new Error('An unexpected error occurred during sign out.'),
      };
    }
  },

  /**
   * Retrieve current authenticated session
   */
  async getSession(): Promise<{ session: Session | null; error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { session: null, error: null };
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      return { session: data.session, error: error || null };
    } catch (err: unknown) {
      return {
        session: null,
        error: err instanceof Error ? err : new Error('Failed to retrieve auth session.'),
      };
    }
  },

  /**
   * Retrieve current user
   */
  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data } = await supabase.auth.getUser();
      return data.user;
    } catch {
      return null;
    }
  },

  /**
   * Check whether current authenticated user is in public.admins via public.is_admin() RPC
   */
  async checkIsAdmin(): Promise<boolean> {
    if (!isSupabaseConfigured) return true; // Offline / local fallback
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) {
        console.warn('is_admin RPC returned error:', error.message);
        return false;
      }
      return Boolean(data);
    } catch {
      return false;
    }
  },

  /**
   * Listen for Auth state changes
   */
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    if (!isSupabaseConfigured) {
      return {
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      };
    }

    return supabase.auth.onAuthStateChange(callback);
  },
};
