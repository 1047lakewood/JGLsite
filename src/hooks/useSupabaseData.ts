import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
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

  const { user } = useAuth();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured || user?.id?.startsWith('demo-')) {
        const stored = localStorage.getItem('demoEvents');
        if (stored) {
          setEvents(JSON.parse(stored));
          return;
        }

        const mockEvents = [
          {
            id: 'demo-event-1',
            title: 'Spring Championship 2024',
            description: 'Annual spring gymnastics championship featuring all levels',
            event_date: '2024-04-15',
            event_time: '10:00',
            location: 'Elite Gymnastics Center',
            host_gym_id: 'demo-gym-1',
            registration_deadline: '2024-04-01',
            max_participants: 100,
            entry_fee: 25,
            ticket_price: 10,
            status: 'open',
            levels_allowed: ['Level 4', 'Level 5', 'Level 6'],
            age_groups: ['8-10', '11-13', '14+'],
            created_by: 'demo-admin-id',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            host_gym: {
              name: 'Elite Gymnastics Center',
              city: 'New York'
            },
            creator: {
              first_name: 'League',
              last_name: 'Administrator'
            }
          },
          {
            id: 'demo-event-2',
            title: 'Regional Qualifier',
            description: 'Qualifying event for regional championships',
            event_date: '2024-05-20',
            event_time: '09:00',
            location: 'Metro Sports Complex',
            host_gym_id: 'demo-gym-2',
            registration_deadline: '2024-05-05',
            max_participants: 75,
            entry_fee: 30,
            ticket_price: 15,
            status: 'open',
            levels_allowed: ['Level 6', 'Level 7', 'Level 8'],
            age_groups: ['12-14', '15+'],
            created_by: 'demo-admin-id',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            host_gym: {
              name: 'Metro Sports Complex',
              city: 'Chicago'
            },
            creator: {
              first_name: 'League',
              last_name: 'Administrator'
            }
          }
        ];
        
        setEvents(mockEvents);
        localStorage.setItem('demoEvents', JSON.stringify(mockEvents));
        return;
      }

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          host_gym:gyms(*),
          creator:user_profiles(*)
        `)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addEvent = (event: EventWithRelations) => {
    setEvents((prev) => {
      const updated = [...prev, event];
      if (!isSupabaseConfigured || user?.id?.startsWith('demo-')) {
        localStorage.setItem('demoEvents', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const updateEvent = (updatedEvent: EventWithRelations) => {
    setEvents((prev) => {
      const updated = prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e));
      if (!isSupabaseConfigured || user?.id?.startsWith('demo-')) {
        localStorage.setItem('demoEvents', JSON.stringify(updated));
      }
      return updated;
    });
  };

  return { events, loading, error, refetch: fetchEvents, addEvent, updateEvent };
};

type GymnastWithUser = Database['public']['Tables']['gymnasts']['Row'] & {
  user: Database['public']['Tables']['user_profiles']['Row'];
};

export const useGymnasts = () => {
  const { user } = useAuth();
  const [gymnasts, setGymnasts] = useState<GymnastWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.gym_id && !user?.id?.startsWith('demo-')) return;

    // For demo users, return mock gymnasts
    if (user.id?.startsWith('demo-')) {
      const mockGymnasts = [
        {
          id: 'demo-gymnast-1',
          user_id: 'demo-gymnast-id',
          gym_id: 'demo-gym-id',
          level: 'Level 5',
          is_team_member: true,
          approved_by_coach: true,
          approved_by_coach_at: new Date().toISOString(),
          approved_by_coach_id: 'demo-coach-id',
          membership_status: 'active',
          total_points: 450,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            first_name: 'Emma',
            last_name: 'Davis',
            email: 'gymnast@demo.com'
          }
        },
        {
          id: 'demo-gymnast-2',
          user_id: 'demo-gymnast-2-id',
          gym_id: 'demo-gym-id',
          level: 'Level 4',
          is_team_member: false,
          approved_by_coach: false,
          approved_by_coach_at: null,
          approved_by_coach_id: null,
          membership_status: 'pending',
          total_points: 120,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            first_name: 'Sarah',
            last_name: 'Wilson',
            email: 'sarah.wilson@demo.com'
          }
        }
      ];
      
      setGymnasts(mockGymnasts);
      setLoading(false);
      return;
    }

    const fetchGymnasts = async () => {
      try {
        const { data, error } = await supabase
          .from('gymnasts')
          .select(`
            *,
            user:user_profiles(*)
          `)
          .eq('gym_id', user.gym_id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setGymnasts(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch gymnasts');
      } finally {
        setLoading(false);
      }
    };

    fetchGymnasts();
  }, [user?.gym_id, user?.id]);

  return { gymnasts, loading, error };
};

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Database['public']['Enums']['user_role'];
  gymId?: string;
  gymName?: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  level?: string | null;
  isActive: boolean;
  totalPoints?: number | null;
  membershipStatus?: Database['public']['Enums']['membership_status'] | null;
  approvedByCoach?: boolean | null;
  createdAt: string;
  lastLogin?: string;
}

export const useMembers = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured || user?.id?.startsWith('demo-')) {
        const stored = localStorage.getItem('demoMembers');
        if (stored) {
          setMembers(JSON.parse(stored));
          return;
        }

        const mockMembers: Member[] = [
          {
            id: 'member-1',
            firstName: 'League',
            lastName: 'Administrator',
            email: 'admin@demo.com',
            role: 'admin',
            phone: '(555) 123-4567',
            isActive: true,
            createdAt: '2024-01-01',
            lastLogin: '2024-03-15',
          },
          {
            id: 'member-2',
            firstName: 'Sarah',
            lastName: 'Johnson',
            email: 'coach@demo.com',
            role: 'coach',
            gymId: 'gym-1',
            gymName: 'Elite Gymnastics Center',
            phone: '(555) 234-5678',
            isActive: true,
            createdAt: '2024-01-15',
            lastLogin: '2024-03-14',
          },
        ];

        setMembers(mockMembers);
        localStorage.setItem('demoMembers', JSON.stringify(mockMembers));
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select(
          `*,
          gym:gyms(*),
          gymnast:gymnasts(*)`
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Member[] = (data || []).map((m) => ({
        id: m.id,
        firstName: m.first_name,
        lastName: m.last_name,
        email: m.email,
        role: m.role,
        gymId: m.gym_id || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gymName: (m as any).gym?.name,
        phone: m.phone,
        dateOfBirth: m.date_of_birth,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        level: (m as any).gymnast?.level,
        isActive: m.is_active,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        totalPoints: (m as any).gymnast?.total_points,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        membershipStatus: (m as any).gymnast?.membership_status,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        approvedByCoach: (m as any).gymnast?.approved_by_coach,
        createdAt: m.created_at,
        lastLogin: m.updated_at,
      }));

      setMembers(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addMember = (member: Member) => {
    setMembers((prev) => {
      const updated = [...prev, member];
      if (!isSupabaseConfigured || user?.id?.startsWith('demo-')) {
        localStorage.setItem('demoMembers', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const updateMember = (member: Member) => {
    setMembers((prev) => {
      const updated = prev.map((m) => (m.id === member.id ? member : m));
      if (!isSupabaseConfigured || user?.id?.startsWith('demo-')) {
        localStorage.setItem('demoMembers', JSON.stringify(updated));
      }
      return updated;
    });
  };

  const removeMember = (id: string) => {
    setMembers((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      if (!isSupabaseConfigured || user?.id?.startsWith('demo-')) {
        localStorage.setItem('demoMembers', JSON.stringify(updated));
      }
      return updated;
    });
  };

  return { members, loading, error, refetch: fetchMembers, addMember, updateMember, removeMember };
};

export const useChallenges = () => {
  const [challenges, setChallenges] = useState<
    Database['public']['Tables']['challenges']['Row'][]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        // For demo mode, return mock challenges
        const mockChallenges = [
          {
            id: 'demo-challenge-1',
            title: 'Perfect Landing Challenge',
            description: 'Stick 5 consecutive landings on vault without any steps',
            points: 50,
            difficulty: 'intermediate',
            category: 'Vault',
            time_limit_days: 30,
            is_active: true,
            created_by: 'demo-coach-id',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'demo-challenge-2',
            title: 'Beam Confidence Builder',
            description: 'Complete full beam routine without falling 3 times in a row',
            points: 75,
            difficulty: 'advanced',
            category: 'Beam',
            time_limit_days: 14,
            is_active: true,
            created_by: 'demo-coach-id',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'demo-challenge-3',
            title: 'Floor Expression',
            description: 'Perform floor routine with maximum artistry and expression',
            points: 40,
            difficulty: 'beginner',
            category: 'Floor',
            time_limit_days: 21,
            is_active: true,
            created_by: 'demo-coach-id',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        setChallenges(mockChallenges);
        setLoading(false);
        return;

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
  const [registrations, setRegistrations] = useState<
    Array<
      Database['public']['Tables']['registrations']['Row'] & {
        event: Database['public']['Tables']['events']['Row'];
        gymnast: GymnastWithUser;
      }
    >
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
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
  const [notifications, setNotifications] = useState<
    Database['public']['Tables']['notifications']['Row'][]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // For demo users, return mock notifications
    if (user.id?.startsWith('demo-')) {
      const mockNotifications = [
        {
          id: 'demo-notif-1',
          title: 'Welcome to the Demo!',
          message: 'This is a sample notification to show how the system works.',
          type: 'info',
          is_read: false,
          created_at: new Date().toISOString()
        },
        {
          id: 'demo-notif-2',
          title: 'Event Registration Open',
          message: 'Spring Championship registration is now open!',
          type: 'success',
          is_read: false,
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      setNotifications(mockNotifications);
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
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

    // Subscribe to real-time notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  return { notifications, loading, error, markAsRead };
};
