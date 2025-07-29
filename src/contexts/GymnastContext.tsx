import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { devLog, devError } from '../lib/logger';

interface Gymnast {
  id: string;
  user_id: string;
  gym_id: string;
  level: string;
  is_team_member: boolean;
  team_name: string;
  approved_by_coach: boolean;
  approved_by_coach_at: string | null;
  approved_by_coach_id: string | null;
  membership_status: 'pending' | 'active' | 'inactive' | 'suspended';
  total_points: number;
  created_at: string;
  updated_at: string;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
    date_of_birth?: string;
  };
}

interface GymnastContextType {
  gymnasts: Gymnast[];
  addGymnast: (gymnast: Gymnast) => void;
  updateGymnast: (id: string, updates: Partial<Gymnast>) => void;
  removeGymnast: (id: string) => void;
  loading: boolean;
}

const GymnastContext = createContext<GymnastContextType | undefined>(undefined);

export const useGymnastContext = () => {
  const context = useContext(GymnastContext);
  if (context === undefined) {
    throw new Error('useGymnastContext must be used within a GymnastProvider');
  }
  return context;
};

export const GymnastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gymnasts, setGymnasts] = useState<Gymnast[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Initialize with demo data
  useEffect(() => {
    const storedGymnasts = localStorage.getItem('gymnasts');
    if (storedGymnasts) {
      try {
        setGymnasts(JSON.parse(storedGymnasts));
      } catch (error) {
        devError('[gymnasts] failed parsing stored gymnasts:', error);
      }
    } else {
      // Initialize with demo data
      const demoGymnasts: Gymnast[] = [
        {
          id: 'demo-gymnast-1',
          user_id: 'demo-gymnast-id',
          gym_id: 'demo-gym-id',
          level: 'Level 5',
          is_team_member: true,
          team_name: 'Team Elite',
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
          team_name: 'Team Elite',
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
      setGymnasts(demoGymnasts);
      localStorage.setItem('gymnasts', JSON.stringify(demoGymnasts));
    }
    setLoading(false);
  }, []);

  // Save to localStorage whenever gymnasts change
  useEffect(() => {
    if (gymnasts.length >= 0) {
      localStorage.setItem('gymnasts', JSON.stringify(gymnasts));
      devLog('[gymnasts] saved to localStorage:', gymnasts.length);
    }
  }, [gymnasts]);

  // Filter gymnasts by coach's team
  const getGymnastsForCoach = () => {
    if (!user?.gym_id) return gymnasts;
    return gymnasts.filter(g => g.gym_id === user.gym_id);
  };

  const addGymnast = (gymnast: Gymnast) => {
    setGymnasts(prev => [...prev, gymnast]);
    devLog('[gymnasts] added', gymnast.user?.first_name);
  };

  const updateGymnast = (id: string, updates: Partial<Gymnast>) => {
    setGymnasts(prev =>
      prev.map(g =>
        g.id === id
          ? { ...g, ...updates, updated_at: new Date().toISOString() }
          : g
      )
    );
    devLog('[gymnasts] updated', id, updates);
  };

  const removeGymnast = (id: string) => {
    setGymnasts(prev => prev.filter(g => g.id !== id));
    devLog('[gymnasts] removed', id);
  };

  return (
    <GymnastContext.Provider value={{
      gymnasts: getGymnastsForCoach(),
      addGymnast,
      updateGymnast,
      removeGymnast,
      loading
    }}>
      {children}
    </GymnastContext.Provider>
  );
};