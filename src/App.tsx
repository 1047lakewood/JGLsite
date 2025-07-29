import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GymnastProvider } from './contexts/GymnastContext';
import { LandingPage } from './components/Layout/LandingPage';
import { LoginForm } from './components/Auth/LoginForm';
import { SignupForm } from './components/Auth/SignupForm';
import { Header } from './components/Layout/Header';
import { AdminDashboard } from './components/Dashboard/AdminDashboard';
import { CoachDashboard } from './components/Dashboard/CoachDashboard';
import { GymnastDashboard } from './components/Dashboard/GymnastDashboard';
import { EventManagement } from './components/Events/EventManagement';
import { GymnastManagement } from './components/Gymnasts/GymnastManagement';
import { ChallengeSystem } from './components/Challenges/ChallengeSystem';
import { GymManagement } from './components/Gyms/GymManagement';
import { MemberManagement } from './components/Members/MemberManagement';
import { devLog } from './lib/logger';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [authScreen, setAuthScreen] = useState<'login' | 'signup' | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  useEffect(() => {
    devLog('[app] activeTab', activeTab);
  }, [activeTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authScreen === 'login') {
      return <LoginForm onShowSignup={() => setAuthScreen('signup')} />;
    }
    if (authScreen === 'signup') {
      return <SignupForm onShowLogin={() => setAuthScreen('login')} />;
    }
    return <LandingPage onGetStarted={() => setAuthScreen('login')} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (user.role === 'admin')
          return (
            <AdminDashboard
              onCreateEvent={() => {
                setShowCreateEvent(true);
                setActiveTab('events');
              }}
            />
          );
        if (user.role === 'coach' || user.role === 'gym_admin') return <CoachDashboard />;
        if (user.role === 'gymnast') return <GymnastDashboard />;
        return <AdminDashboard />;

      case 'events':
        return (
          <EventManagement
            showCreateOnLoad={showCreateEvent}
            onCreateFormClose={() => setShowCreateEvent(false)}
          />
        );
      
      case 'gymnasts':
        return <GymnastManagement />;
      
      case 'challenges':
        return <ChallengeSystem />;
      
      case 'gyms':
        return <GymManagement />;
      
      case 'members':
        return <MemberManagement />;
      
      case 'communications':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Communications</h2>
            <p className="text-gray-600">Email communication features coming soon...</p>
          </div>
        );
      
      case 'registrations':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Registration Management</h2>
            <p className="text-gray-600">Registration management features coming soon...</p>
          </div>
        );
      
      case 'profile':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">My Profile</h2>
            <p className="text-gray-600">Profile management features coming soon...</p>
          </div>
        );
      
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <GymnastProvider>
        <AppContent />
      </GymnastProvider>
    </AuthProvider>
  );
}

export default App;