/**
 * Paracha Mobile Shop — Auth Context
 * Real Supabase Authentication state and session management
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { authService } from '../services/authService';
import { isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; isAdmin?: boolean }>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      if (!isSupabaseConfigured) {
        if (isMounted) {
          setIsAdmin(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        const { session: currentSession } = await authService.getSession();
        if (isMounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            const adminStatus = await authService.checkIsAdmin();
            if (isMounted) setIsAdmin(adminStatus);
          } else {
            setIsAdmin(false);
          }
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    const { data: authListener } = authService.onAuthStateChange(async (_event, newSession) => {
      if (isMounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          const adminStatus = await authService.checkIsAdmin();
          if (isMounted) setIsAdmin(adminStatus);
        } else {
          setIsAdmin(false);
        }
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    const { session: newSession, user: newUser, error } = await authService.signInWithPassword(email, password);

    if (error) {
      setIsLoading(false);
      return { error };
    }

    setSession(newSession);
    setUser(newUser);

    let adminCheck = true;
    if (isSupabaseConfigured) {
      adminCheck = await authService.checkIsAdmin();
    }
    setIsAdmin(adminCheck);
    setIsLoading(false);

    return { error: null, isAdmin: adminCheck };
  };

  const signOut = async () => {
    setIsLoading(true);
    const { error } = await authService.signOut();
    setIsLoading(false);

    if (!error) {
      setSession(null);
      setUser(null);
      setIsAdmin(false);
    }
    return { error };
  };

  const value = useMemo(
    () => ({
      user,
      session,
      isAdmin,
      isLoading,
      isConfigured: isSupabaseConfigured,
      signIn,
      signOut,
    }),
    [user, session, isAdmin, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
