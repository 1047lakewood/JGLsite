import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const devLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.log(...args);
};

const devError = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.error(...args);
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

devLog('[supabase] VITE_SUPABASE_URL:', supabaseUrl || '<missing>');
devLog('[supabase] VITE_SUPABASE_ANON_KEY present:', !!supabaseAnonKey);

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

if (import.meta.env.DEV) {
  if (isSupabaseConfigured) {
    devLog('[supabase] Client initialized with provided credentials');
  } else {
    devError('[supabase] Missing credentials, using demo client');
  }
}

const loggingFetch = async (url: string, options?: RequestInit) => {
  const start = Date.now();
  devLog('[supabase] fetch', options?.method || 'GET', url);
  try {
    const res = await fetch(url, options);
    devLog(
      '[supabase] response',
      res.status,
      url,
      `${Date.now() - start}ms`
    );
    return res;
  } catch (err) {
    devError('[supabase] fetch error:', err);
    throw err;
  }
};

export const supabase: SupabaseClient<Database> = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, { global: { fetch: loggingFetch } })
  // @ts-expect-error - create a dummy client to avoid runtime crashes in demo mode
  : (createClient('https://demo.supabase.co', 'demo-key', { global: { fetch: loggingFetch } }) as SupabaseClient<Database>);

// Auth helpers
export const signUp = async (
  email: string,
  password: string,
  userData: Database['public']['Tables']['user_profiles']['Insert']
) => {
  devLog('[supabase] signUp', email);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData,
      emailRedirectTo: undefined,
      emailConfirmation: false
    },
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  devLog('[supabase] signIn', email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    devError('[supabase] signIn error:', error);
  }
  return { data, error };
};

export const signOut = async () => {
  devLog('[supabase] signOut');
  const { error } = await supabase.auth.signOut();
  if (error) {
    devError('[supabase] signOut error:', error);
  }
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Database helpers
export const getUserProfile = async (userId: string) => {
  devLog('[supabase] getUserProfile for', userId);
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      gym:gyms(*)
    `)
    .eq('id', userId)
    .single();

  if (error) {
    devError('[supabase] getUserProfile error:', error);
  } else {
    devLog('[supabase] getUserProfile result:', data);
  }

  return { data, error };
};

export const createUserProfile = async (
  profile: Database['public']['Tables']['user_profiles']['Insert']
) => {
  devLog('[supabase] createUserProfile', profile);
  const { data, error } = await supabase
    .from('user_profiles')
    .insert(profile)
    .single();

  if (error) {
    devError('[supabase] createUserProfile error:', error);
  } else {
    devLog('[supabase] createUserProfile id:', data?.id);
  }

  return { data, error };
};

export const getGymnastProfile = async (userId: string) => {
  devLog('[supabase] getGymnastProfile for', userId);
  const { data, error } = await supabase
    .from('gymnasts')
    .select(`
      *,
      user:user_profiles(*),
      gym:gyms(*)
    `)
    .eq('user_id', userId)
    .single();

  if (error) {
    devError('[supabase] getGymnastProfile error:', error);
  } else {
    devLog('[supabase] getGymnastProfile result:', data);
  }

  return { data, error };
};

export const getEvents = async (status?: string) => {
  devLog('[supabase] getEvents status:', status);
  let query = supabase
    .from('events')
    .select(`
      *,
      host_gym:gyms(*),
      creator:user_profiles(*)
    `)
    .order('event_date', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    devError('[supabase] getEvents error:', error);
  } else {
    devLog('[supabase] getEvents result count:', data?.length);
  }
  return { data, error };
};

export const getRegistrations = async (eventId?: string, gymnastId?: string) => {
  devLog('[supabase] getRegistrations eventId:', eventId, 'gymnastId:', gymnastId);
  let query = supabase
    .from('registrations')
    .select(`
      *,
      event:events(*),
      gymnast:gymnasts(
        *,
        user:user_profiles(*)
      )
    `);

  if (eventId) {
    query = query.eq('event_id', eventId);
  }
  
  if (gymnastId) {
    query = query.eq('gymnast_id', gymnastId);
  }

  const { data, error } = await query;
  if (error) {
    devError('[supabase] getRegistrations error:', error);
  } else {
    devLog('[supabase] getRegistrations result count:', data?.length);
  }
  return { data, error };
};

export const getChallenges = async (isActive = true) => {
  devLog('[supabase] getChallenges isActive:', isActive);
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_active', isActive)
    .order('created_at', { ascending: false });

  if (error) {
    devError('[supabase] getChallenges error:', error);
  } else {
    devLog('[supabase] getChallenges result count:', data?.length);
  }

  return { data, error };
};

export const getChallengeCompletions = async (gymnastId?: string, challengeId?: string) => {
  devLog('[supabase] getChallengeCompletions gymnastId:', gymnastId, 'challengeId:', challengeId);
  let query = supabase
    .from('challenge_completions')
    .select(`
      *,
      challenge:challenges(*),
      gymnast:gymnasts(
        *,
        user:user_profiles(*)
      )
    `);

  if (gymnastId) {
    query = query.eq('gymnast_id', gymnastId);
  }
  
  if (challengeId) {
    query = query.eq('challenge_id', challengeId);
  }

  const { data, error } = await query;
  if (error) {
    devError('[supabase] getChallengeCompletions error:', error);
  } else {
    devLog('[supabase] getChallengeCompletions result count:', data?.length);
  }
  return { data, error };
};

export const getGymnastsByGym = async (gymId: string) => {
  devLog('[supabase] getGymnastsByGym gymId:', gymId);
  const { data, error } = await supabase
    .from('gymnasts')
    .select(`
      *,
      user:user_profiles(*)
    `)
    .eq('gym_id', gymId)
    .order('created_at', { ascending: false });
  
  if (error) {
    devError('[supabase] getGymnastsByGym error:', error);
  } else {
    devLog('[supabase] getGymnastsByGym result count:', data?.length);
  }
  return { data, error };
};

export const getNotifications = async (userId: string) => {
  devLog('[supabase] getNotifications userId:', userId);
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    devError('[supabase] getNotifications error:', error);
  } else {
    devLog('[supabase] getNotifications result count:', data?.length);
  }

  return { data, error };
};

export const markNotificationAsRead = async (notificationId: string) => {
  devLog('[supabase] markNotificationAsRead id:', notificationId);
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    devError('[supabase] markNotificationAsRead error:', error);
  } else {
    devLog('[supabase] markNotificationAsRead success');
  }

  return { data, error };
};

// Creation helpers
export const createEvent = async (
  event: Database['public']['Tables']['events']['Insert']
) => {
  devLog('[supabase] createEvent', event);
  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .single();
  if (error) {
    devError('[supabase] createEvent error:', error);
  } else {
    devLog('[supabase] createEvent id:', data?.id);
  }
  return { data, error };
};

export const updateEvent = async (
  id: string,
  updates: Database['public']['Tables']['events']['Update']
) => {
  devLog('[supabase] updateEvent id:', id, 'updates:', updates);
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .single();
  if (error) {
    devError('[supabase] updateEvent error:', error);
  } else {
    devLog('[supabase] updateEvent updated id:', data?.id);
  }
  return { data, error };
};

// Real-time subscriptions
import type {
  RealtimePostgresChangesPayload,
} from '@supabase/realtime-js';

export const subscribeToRegistrations = (
  callback: (
    payload: RealtimePostgresChangesPayload<
      Database['public']['Tables']['registrations']['Row']
    >
  ) => void
) => {
  return supabase
    .channel('registrations')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'registrations' }, 
      callback
    )
    .subscribe();
};

export const subscribeToNotifications = (
  userId: string,
  callback: (
    payload: RealtimePostgresChangesPayload<
      Database['public']['Tables']['notifications']['Row']
    >
  ) => void
) => {
  return supabase
    .channel('notifications')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, 
      callback
    )
    .subscribe();
};
