import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../types/database';

export type EventWithRelations = Database['public']['Tables']['events']['Row'] & {
  host_gym: Database['public']['Tables']['gyms']['Row'];
  creator: Database['public']['Tables']['user_profiles']['Row'];
};

export const useEvents = () => {
  const [events, setEvents] = useState<EventWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`*, host_gym:gyms(*), creator:user_profiles(*)`)
        .order('event_date', { ascending: true });
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addEvent = (event: EventWithRelations) => {
    setEvents(prev => [...prev, event]);
  };

  const updateEvent = (event: EventWithRelations) => {
    setEvents(prev => prev.map(e => (e.id === event.id ? event : e)));
  };

  const removeEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  return { events, loading, error, refetch: fetchEvents, addEvent, updateEvent, removeEvent };
};

export type Gym = Database['public']['Tables']['gyms']['Row'];

export const useGyms = () => {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGyms = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setGyms(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gyms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGyms();
  }, [fetchGyms]);

  const addGym = (gym: Gym) => setGyms(prev => [...prev, gym]);
  const updateGym = (gym: Gym) => setGyms(prev => prev.map(g => (g.id === gym.id ? gym : g)));
  const removeGym = (id: string) => setGyms(prev => prev.filter(g => g.id !== id));

  return { gyms, loading, error, refetch: fetchGyms, addGym, updateGym, removeGym };
};

export type MemberProfile = Database['public']['Tables']['user_profiles']['Row'] & {
  gym?: Database['public']['Tables']['gyms']['Row'] | null;
};

export const useMembers = () => {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`*, gym:gyms(*)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addMember = (m: MemberProfile) => setMembers(prev => [...prev, m]);
  const updateMember = (m: MemberProfile) => setMembers(prev => prev.map(mm => (mm.id === m.id ? m : mm)));
  const removeMember = (id: string) => setMembers(prev => prev.filter(m => m.id !== id));

  return { members, loading, error, refetch: fetchMembers, addMember, updateMember, removeMember };
};

type GymnastWithUser = Database['public']['Tables']['gymnasts']['Row'] & { user: Database['public']['Tables']['user_profiles']['Row'] };

export const useGymnasts = () => {
  const { user } = useAuth();
  const [gymnasts, setGymnasts] = useState<GymnastWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGymnasts = useCallback(async () => {
    if (!user?.gym_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('gymnasts')
        .select(`*, user:user_profiles(*)`)
        .eq('gym_id', user.gym_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setGymnasts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gymnasts');
    } finally {
      setLoading(false);
    }
  }, [user?.gym_id]);

  useEffect(() => {
    fetchGymnasts();
  }, [fetchGymnasts]);

  return { gymnasts, loading, error, refetch: fetchGymnasts };
};

export const useChallenges = () => {
  const [challenges, setChallenges] = useState<Database['public']['Tables']['challenges']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChallenges = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('challenges')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setChallenges(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch challenges');
      } finally {
        setLoading(false);
      }
    };
    fetchChallenges();
  }, []);

  return { challenges, loading, error };
};

export const useRegistrations = (eventId?: string) => {
  const [registrations, setRegistrations] = useState<Array<Database['public']['Tables']['registrations']['Row'] & { event: Database['public']['Tables']['events']['Row']; gymnast: GymnastWithUser }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegistrations = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('registrations')
          .select(`*, event:events(*), gymnast:gymnasts(*, user:user_profiles(*))`);
        if (eventId) query = query.eq('event_id', eventId);
        const { data, error } = await query.order('registered_at', { ascending: false });
        if (error) throw error;
        setRegistrations(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch registrations');
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrations();
  }, [eventId]);

  return { registrations, loading, error };
};

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Database['public']['Tables']['notifications']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) throw error;
        setNotifications(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, payload => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, [user?.id]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  return { notifications, loading, error, markAsRead };
};
