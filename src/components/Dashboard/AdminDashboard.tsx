import React, { useState } from 'react';
import { Users, Calendar, Trophy, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useEvents, useNotifications, useMembers } from '../../hooks/useSupabaseData';

interface AdminDashboardProps {
  onCreateEvent?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onCreateEvent = () => alert('Create event feature coming soon!'),
}) => {
  const { events } = useEvents();
  const { members } = useMembers();
  const { notifications } = useNotifications();
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [announcementData, setAnnouncementData] = useState({
    title: '',
    message: '',
    recipients: 'all'
  });

  const stats = [
    { label: 'Total Gyms', value: '4', icon: Users, color: 'bg-blue-500', change: '+1 this month' },
    { label: 'Active Events', value: events.length.toString(), icon: Calendar, color: 'bg-purple-500', change: 'Live system' },
    { label: 'System Status', value: '✓', icon: Trophy, color: 'bg-green-500', change: 'All systems operational' },
    { label: 'Notifications', value: notifications.filter(n => !n.is_read).length.toString(), icon: Clock, color: 'bg-orange-500', change: 'Unread messages' },
  ];

  const recentActivity = notifications.slice(0, 4).map(notif => ({
    type: notif.type,
    message: notif.message,
    time: new Date(notif.created_at).toLocaleDateString(),
    status: notif.is_read ? 'completed' : 'pending'
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const handleSendAnnouncement = () => {
    console.log('Opening announcement modal');
    setShowAnnouncementModal(true);
  };

  const handleExportData = () => {
    console.log('Opening export modal');
    setShowExportModal(true);
  };

  const handleSubmitAnnouncement = () => {
    alert(`Announcement "${announcementData.title}" sent to ${announcementData.recipients}!`);
    setShowAnnouncementModal(false);
    setAnnouncementData({ title: '', message: '', recipients: 'all' });
  };

  const handleExportMembers = () => {
    const membersData = [
      ['Name', 'Email', 'Role', 'Gym', 'Status', 'Join Date'],
      ...members.map(m => [
        `${m.first_name} ${m.last_name}`,
        m.email,
        m.role,
        m.gym?.name || 'N/A',
        m.is_active ? 'Active' : 'Inactive',
        new Date(m.created_at).toLocaleDateString()
      ])
    ];
    
    const csvContent = membersData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jgl-members-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    alert('Members data exported to Downloads folder!');
    setShowExportModal(false);
  };

  const handleExportEvents = () => {
    const eventsData = [
      ['Event Name', 'Date', 'Location', 'Host Gym', 'Entry Fee', 'Ticket Price', 'Status', 'Max Participants'],
      ...events.map(e => [
        e.title,
        new Date(e.event_date).toLocaleDateString(),
        e.location,
        e.host_gym?.name || '',
        `$${e.entry_fee}`,
        `$${e.ticket_price}`,
        e.status,
        e.max_participants || ''
      ])
    ];
    
    const csvContent = eventsData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jgl-events-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    alert('Events data exported to Downloads folder!');
    setShowExportModal(false);
  };

  const handleExportAnalytics = () => {
    // Create JSON data for analytics
    const analyticsData = {
      league_overview: {
        total_gyms: 4,
        total_members: 156,
        active_events: 2,
        total_points_awarded: 45670,
        generated_date: new Date().toISOString()
      },
      gym_breakdown: [
        { name: 'Elite Gymnastics Center', members: 45, events_hosted: 3, total_points: 12450 },
        { name: 'Metro Sports Complex', members: 38, events_hosted: 2, total_points: 10890 },
        { name: 'Sunshine Gymnastics Academy', members: 32, events_hosted: 1, total_points: 8760 },
        { name: 'Pacific Coast Gymnastics', members: 41, events_hosted: 4, total_points: 13570 }
      ],
      monthly_stats: {
        january: { new_members: 12, events: 1, points_awarded: 3450 },
        february: { new_members: 18, events: 2, points_awarded: 5670 },
        march: { new_members: 15, events: 1, points_awarded: 4320 }
      }
    };
    
    const jsonContent = JSON.stringify(analyticsData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jgl-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    alert('Analytics data exported to Downloads folder!');
    setShowExportModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            League Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Overview of league operations and performance</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleSendAnnouncement}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
          >
            Send Announcement
          </button>
          <button
            onClick={handleExportData}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:border-blue-600 hover:text-blue-600 transition-all duration-200 font-semibold"
          >
            Export Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{stat.label}</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-2 font-medium">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-4 rounded-2xl shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  {getStatusIcon(activity.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button 
                onClick={() => alert('Gym applications feature coming soon!')}
                className="w-full text-left p-4 rounded-xl border border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-200 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Review Gym Applications</p>
                    <p className="text-sm text-gray-500">2 pending approvals</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={onCreateEvent}
                className="w-full text-left p-4 rounded-xl border border-gray-200 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 hover:border-green-200 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Create New Event</p>
                    <p className="text-sm text-gray-500">Set up competition details</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={handleSendAnnouncement}
                className="w-full text-left p-4 rounded-xl border border-gray-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:border-purple-200 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Send Announcement</p>
                    <p className="text-sm text-gray-500">Message all league members</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={handleExportData}
                className="w-full text-left p-4 rounded-xl border border-gray-200 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:border-orange-200 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Export Data</p>
                    <p className="text-sm text-gray-500">Download league reports</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Send Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Send League Announcement</h2>
              <p className="text-gray-600 mt-1">Send a message to all league members</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                <select
                  value={announcementData.recipients}
                  onChange={(e) => setAnnouncementData(prev => ({ ...prev, recipients: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Members</option>
                  <option value="gymnasts">Gymnasts Only</option>
                  <option value="coaches">Coaches Only</option>
                  <option value="admins">Gym Admins Only</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Announcement Title</label>
                <input
                  type="text"
                  value={announcementData.title}
                  onChange={(e) => setAnnouncementData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter announcement title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  rows={6}
                  value={announcementData.message}
                  onChange={(e) => setAnnouncementData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your announcement message..."
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Preview</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      This announcement will be sent to{' '}
                      <span className="font-semibold">
                        {announcementData.recipients === 'all' ? 'all league members' : 
                         announcementData.recipients === 'gymnasts' ? 'all gymnasts' :
                         announcementData.recipients === 'coaches' ? 'all coaches' : 'all gym administrators'}
                      </span>
                      {' '}via email and in-app notifications.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAnnouncementModal(false);
                  setAnnouncementData({ title: '', message: '', recipients: 'all' });
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAnnouncement}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
              >
                Send Announcement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Data Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Export League Data</h2>
              <p className="text-gray-600 mt-1">Download league data in various formats</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <button
                  onClick={handleExportMembers}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 hover:border-green-200 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Member Data (CSV)</p>
                      <p className="text-sm text-gray-500">All members with contact info and roles</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={handleExportEvents}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:border-purple-200 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Event Data (CSV)</p>
                      <p className="text-sm text-gray-500">All events with registration stats</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={handleExportAnalytics}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-200 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Analytics Report (JSON)</p>
                      <p className="text-sm text-gray-500">Comprehensive league statistics</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};