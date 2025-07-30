import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as AuthUser } from '@supabase/supabase-js';
import {
  supabase,
  signIn,
  signOut,
  signUp as supabaseSignUp,
  getUserProfile,
  isSupabaseConfigured
} from '../lib/supabase';
import { Database } from '../types/database';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'] & {
  gym?: Database['public']['Tables']['gyms']['Row'];
};

interface AuthContextType {
  user: UserProfile | null;
  authUser: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

if (import.meta.env.DEV) {
  console.log('[auth] Supabase configured:', isSupabaseConfigured);
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Demo user profiles
const demoUsers: { [key: string]: UserProfile } = {
  'admin@demo.com': {
    id: 'demo-admin-id',
    email: 'admin@demo.com',
    first_name: 'League',
    last_name: 'Administrator',
    role: 'admin',
    gym_id: null,
    phone: null,
    date_of_birth: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  'coach@demo.com': {
    id: 'demo-coach-id',
    email: 'coach@demo.com',
    first_name: 'Sarah',
    last_name: 'Johnson',
    role: 'coach',
    gym_id: 'demo-gym-id',
    phone: null,
    date_of_birth: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  'gymnast@demo.com': {
    id: 'demo-gymnast-id',
    email: 'gymnast@demo.com',
    first_name: 'Emma',
    last_name: 'Davis',
    role: 'gymnast',
    gym_id: 'demo-gym-id',
    phone: null,
    date_of_birth: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    if (import.meta.env.DEV) {
      console.log('[auth] AuthProvider initializing');
    }

    const initializeAuth = async () => {
      if (!isSupabaseConfigured) {
        const stored = localStorage.getItem('demoUser');
        if (stored) {
          setUser(JSON.parse(stored));
        }
        setIsLoading(false);
        return;
      }

      try {
        if (import.meta.env.DEV) {
          console.log('[auth] Checking existing session');
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (import.meta.env.DEV) {
          console.log('[auth] getSession result', session, error);
        }
        
        if (!mounted) return;
        
        if (error) {
          console.error('[auth] Session error:', error);
          setError(error.message);
          setIsLoading(false);
          return;
        }
        
        if (session?.user) {
          setAuthUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[auth] Initialize auth error:', err);
        if (mounted) {
          setError('Failed to initialize authentication');
          setIsLoading(false);
        }
      }
    };
    
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('[auth] Auth initialization timeout');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout
    
    initializeAuth();

    // Listen for auth changes
    let subscription: { unsubscribe: () => void } = { unsubscribe: () => {} };
    if (isSupabaseConfigured) {
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (import.meta.env.DEV) {
            console.log('[auth] onAuthStateChange', event, session);
          }

          if (!mounted) return;

          if (session?.user) {
            setAuthUser(session.user);
            await loadUserProfile(session.user.id);
          } else {
            setAuthUser(null);
            setUser(null);
            setIsLoading(false);
          }
        }
      );
      subscription = sub;
    }

    return () => {
      mounted = false;
      clearTimeout(timeout);
      if (import.meta.env.DEV) {
        console.log('[auth] auth subscription cleanup');
      }
      if (isSupabaseConfigured) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    if (import.meta.env.DEV) {
      console.log('[auth] loadUserProfile', userId);
    }
    try {
      const { data, error } = await getUserProfile(userId);
      console.log('[auth] getUserProfile result:', { data, error });
      if (error) {
        console.error('Error loading user profile:', error);
        console.error('[auth] Profile loading failed, but continuing with authentication');
      } else if (data) {
        console.log('[auth] Setting user profile:', data);
        setUser(data);
      } else {
        console.warn('[auth] No user profile data returned');
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      console.warn('[auth] Continuing without user profile');
    } finally {
      if (import.meta.env.DEV) {
        console.log('[auth] loadUserProfile complete');
      }
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('[auth] Login attempt for:', email);
    setIsLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured) {
        const demoUser = demoUsers[email];
        if (demoUser && password === 'demo123') {
          setUser(demoUser);
          localStorage.setItem('demoUser', JSON.stringify(demoUser));
          setIsLoading(false);
          return;
        }
        throw new Error('Invalid email or password');
      }

      console.log('[auth] Attempting Supabase signIn...');
      const { error } = await signIn(email, password);
      console.log('[auth] signIn response:', { error });

      if (error) {
        console.error('[auth] Supabase login error:', error);
        throw new Error(error.message);
      }
      console.log('[auth] Supabase login successful, waiting for auth state change...');
      // User profile will be loaded via the auth state change listener
    } catch (err) {
      console.error('[auth] Login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured) {
        const newUser: UserProfile = {
          id: crypto.randomUUID(),
          email,
          first_name: firstName,
          last_name: lastName,
          role: 'gymnast',
          gym_id: null,
          phone: null,
          date_of_birth: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setUser(newUser);
        localStorage.setItem('demoUser', JSON.stringify(newUser));
        setIsLoading(false);
        return;
      }

      const { error } = await supabaseSignUp(email, password, {
        id: crypto.randomUUID(),
        email,
        first_name: firstName,
        last_name: lastName,
        role: 'gymnast',
      });

      if (error) {
        throw new Error(error.message);
      }

      // User profile will be loaded via the auth state change listener
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log('Logging out...');
    setError(null);

    if (!isSupabaseConfigured) {
      localStorage.removeItem('demoUser');
    } else {
      const { error } = await signOut();
      if (error) {
        console.error('Logout error:', error);
        setError(error.message);
      }
    }
    
    // Reset state
    setUser(null);
    setAuthUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, authUser, login, signUp, logout, isLoading, error }}
    >
      {children}
    </AuthContext.Provider>
  );
};