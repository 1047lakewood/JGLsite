import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as AuthUser } from '@supabase/supabase-js';
import {
  supabase,
  signIn,
  signOut,
  signUp as supabaseSignUp,
  getUserProfile,
  createUserProfile,
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

  const log = (...args: unknown[]) => {
    if (import.meta.env.DEV) console.log('[auth]', ...args);
  };
  const logError = (...args: unknown[]) => {
    if (import.meta.env.DEV) console.error('[auth]', ...args);
  };

  useEffect(() => {
    log('AuthProvider initializing');

    // Check for demo mode first
    const demoUser = localStorage.getItem('demoUser');
    if (demoUser) {
      try {
        const parsedUser = JSON.parse(demoUser);
        log('Found demo user in localStorage:', parsedUser);
        setUser(parsedUser);
        setIsLoading(false);
        return;
      } catch (err) {
        logError('Error parsing demo user, removing:', err);
        localStorage.removeItem('demoUser');
      }
    }

    // Get initial session
    log('Checking existing session');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      log('getSession result', session, error);
      if (session?.user) {
        setAuthUser(session.user);
        loadUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        log('onAuthStateChange', event, session);
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

    return () => {
      log('auth subscription cleanup');
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    log('loadUserProfile', userId);
    try {
      const { data, error } = await getUserProfile(userId);
      if (error) {
        logError('Error loading user profile:', error);
        setError('Failed to load user profile');
      } else if (data) {
        setUser(data);
      }
    } catch (err) {
      logError('Error loading user profile:', err);
      setError('Failed to load user profile');
    } finally {
      log('loadUserProfile complete');
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    log('login', email);
    setIsLoading(true);
    setError(null);

    // Demo credentials
    if (password === 'demo123' && demoUsers[email]) {
      log('Using demo mode for:', email);
      const demoUser = demoUsers[email];
      setUser(demoUser);
      localStorage.setItem('demoUser', JSON.stringify(demoUser));
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      const msg = 'Supabase credentials are not configured.';
      setError(msg);
      setIsLoading(false);
      logError(msg);
      throw new Error(msg);
    }

    try {
      log('Attempting Supabase login...');
      const { error } = await signIn(email, password);
      if (error) {
        logError('Supabase login error:', error);

        if (error.message.includes('Email not confirmed') && password === 'demo123') {
          log('Email not confirmed, checking for demo fallback...');
          const demoUser = demoUsers[email];
          if (demoUser) {
            log('Using demo fallback for:', email);
            setUser(demoUser);
            localStorage.setItem('demoUser', JSON.stringify(demoUser));
            setIsLoading(false);
            return;
          }
        }

        throw new Error(error.message);
      }
      log('Supabase login successful');
      // User profile will be loaded via the auth state change listener
    } catch (err) {
      logError('Login failed:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      setIsLoading(false);
      throw err instanceof Error ? err : new Error('Login failed');
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

    if (!isSupabaseConfigured) {
      const demoUser: UserProfile = {
        id: `demo-${Date.now()}`,
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
      setUser(demoUser);
      localStorage.setItem('demoUser', JSON.stringify(demoUser));
      setIsLoading(false);
      return;
    }

    try {
      log('signUp start', email);
      const { data, error } = await supabaseSignUp(email, password, {
        email,
        first_name: firstName,
        last_name: lastName,
        role: 'gymnast',
      });

      if (error) {
        throw new Error(error.message);
      }

      log('supabaseSignUp result', data, error);

      const userId = data.user?.id;
      if (!userId) {
        const msg = 'Sign up succeeded but no user ID returned';
        logError(msg);
        throw new Error(msg);
      }

      // Log the user in to satisfy RLS checks for profile creation
      log('signing in immediately after signup');
      const { error: loginError } = await signIn(email, password);
      if (loginError) {
        logError('login after signup failed:', loginError);
        throw new Error(loginError.message);
      }

      const { error: profileError } = await createUserProfile({
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        role: 'gymnast',
      });
      if (profileError) {
        logError('createUserProfile error:', profileError);
        throw new Error(profileError.message);
      }
      log('signUp complete');
    } catch (err) {
      logError('signUp failed:', err);
      setError(err instanceof Error ? err.message : 'Sign up failed');
      setIsLoading(false);
      throw err instanceof Error ? err : new Error('Sign up failed');
    }
  };

  const logout = async () => {
    log('logout');
    setError(null);
    
    // Clear demo user
    localStorage.removeItem('demoUser');
    
    // Sign out from Supabase
    const { error } = await signOut();
    if (error) {
      logError('Logout error:', error);
      setError(error.message);
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