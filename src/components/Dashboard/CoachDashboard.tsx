import React from 'react';
import { useState } from 'react';
import { Users, Calendar, CheckCircle, Clock, Trophy, Star } from 'lucide-react';
import { useNotifications, useGymnasts } from '../../hooks/useSupabaseData';

export const CoachDashboard: React.FC = () => {
  const { gymnasts } = useGymnasts();
  const { notifications } = useNotifications();
  const [showAddGymnastModal, setShowAddGymnastModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [gymnastData, setGymnastData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    level: '',
    dateOfBirth: '',
    teamName: ''
  });

  const pendingApprovals = gymnasts.filter(g => !g.approved_by_coach);
  const totalPoints = gymnasts.reduce((sum, g) => sum + (g.total_points || 0), 0);

  const stats = [
    { label: 'My Gymnasts', value: gymnasts.length.toString(), icon: Users, color: 'bg-blue-500', change: 'Active team members' },
    { label: 'Pending Approvals', value: pendingApprovals.length.toString(), icon: Clock, color: 'bg-orange-500', change: 'Requires action' },
    { label: 'Upcoming Events', value: '2', icon: Calendar, color: 'bg-purple-500', change: 'Next: March 15' },
    { label: 'Team Points', value: totalPoints.toLocaleString(), icon: Trophy, color: 'bg-green-500', change: 'Total earned' },
  ];

  const pendingApprovalsData = pendingApprovals.slice(0, 3).map(gymnast => ({
    name: `${gymnast.user?.first_name} ${gymnast.user?.last_name}`,
    event: 'Membership Approval',
    level: gymnast.level,
    registeredAt: new Date(gymnast.created_at).toLocaleDateString()
  }));

  const recentActivity = notifications.slice(0, 3).map(notif => ({
    type: 'info',
    message: notif.message,
    gymnast: notif.title,
    time: new Date(notif.created_at).toLocaleDateString()
  }));
  const handleAddGymnast = () => {
    setShowAddGymnastModal(true);
  };

  const handleExportReport = () => {
    setShowExportModal(true);
  };

  const handleSubmitGymnast = () => {
    // Validate required fields
    if (!gymnastData.firstName || !gymnastData.lastName || !gymnastData.email || 
        !gymnastData.level || !gymnastData.dateOfBirth || !gymnastData.teamName) {
      alert('Please fill in all required fields: First Name, Last Name, Email, Date of Birth, Level, and Team.');
      return;
    }

    alert('Gymnast creation not implemented.');
    setShowAddGymnastModal(false);
  };

  const handleExportTeamReport = () => {
    const teamData = [
      ['Name', 'Level', 'Status', 'Points', 'Team Member', 'Join Date'],
      ...gymnasts.map(g => [
        `${g.user?.first_name} ${g.user?.last_name}`,
        g.level,
        g.membership_status,
        g.total_points || 0,
        g.is_team_member ? 'Yes' : 'No',
        new Date(g.created_at).toLocaleDateString()
      ])
    ];
    
    const csvContent = teamData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `team-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    alert('Team report exported to Downloads folder!');
    setShowExportModal(false);
  };

  const handleExportProgress = () => {
    const progressData = {
      team_overview: {
        total_gymnasts: gymnasts.length,
        pending_approvals: pendingApprovals.length,
        total_points: totalPoints,
        generated_date: new Date().toISOString()
      },
      gymnast_details: gymnasts.map(g => ({
        name: `${g.user?.first_name} ${g.user?.last_name}`,
        level: g.level,
        points: g.total_points || 0,
        status: g.membership_status,
        approved: g.approved_by_coach,
        team_member: g.is_team_member
      }))
    };
    
    const jsonContent = JSON.stringify(progressData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `team-progress-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    alert('Team progress exported to Downloads folder!');
    setShowExportModal(false);
  };

  const approveGymnast = () => {
    console.log('Gymnast approval not implemented');
  };

  const rejectGymnast = () => {
    if (confirm('Are you sure you want to reject this gymnast application?')) {
      console.log('Gymnast rejection not implemented');
    }
  };

  // Get gym ID based on team selection
  // Team helper not implemented

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Coach Dashboard</h1>
        <div className="flex space-x-3">
          <button 
            onClick={handleAddGymnast}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Gymnast
          </button>
          <button 
            onClick={handleExportReport}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
              <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {pendingApprovalsData.length} pending
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {pendingApprovalsData.map((approval, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div>
                    <p className="font-medium text-gray-900">{approval.name}</p>
                    <p className="text-sm text-gray-600">{approval.event} • {approval.level}</p>
                    <p className="text-xs text-gray-500 mt-1">Registered {approval.registeredAt}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => approveGymnast(pendingApprovals[index].id)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => rejectGymnast(pendingApprovals[index].id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {activity.type === 'approval' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    {activity.type === 'challenge' && <Star className="w-5 h-5 text-yellow-500" />}
                    {activity.type === 'registration' && <Calendar className="w-5 h-5 text-blue-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-sm text-gray-600">{activity.gymnast}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Team Performance</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">85%</div>
              <div className="text-sm text-gray-600 mt-1">Event Participation Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">92%</div>
              <div className="text-sm text-gray-600 mt-1">Challenge Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">4.8</div>
              <div className="text-sm text-gray-600 mt-1">Average Team Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Gymnast Modal */}
      {showAddGymnastModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Add New Gymnast</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    required
                    value={gymnastData.firstName}
                    onChange={(e) => setGymnastData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter first name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    required
                    value={gymnastData.lastName}
                    onChange={(e) => setGymnastData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter last name"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={gymnastData.email}
                    onChange={(e) => setGymnastData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={gymnastData.dateOfBirth}
                    onChange={(e) => setGymnastData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level *</label>
                  <select
                    required
                    value={gymnastData.level}
                    onChange={(e) => setGymnastData(prev => ({ ...prev, level: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select level</option>
                    <option value="Level 1">Level 1</option>
                    <option value="Level 2">Level 2</option>
                    <option value="Level 3">Level 3</option>
                    <option value="Level 4">Level 4</option>
                    <option value="Level 5">Level 5</option>
                    <option value="Level 6">Level 6</option>
                    <option value="Level 7">Level 7</option>
                    <option value="Level 8">Level 8</option>
                    <option value="Level 9">Level 9</option>
                    <option value="Level 10">Level 10</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Team *</label>
                  <select
                    required
                    value={gymnastData.teamName}
                    onChange={(e) => setGymnastData(prev => ({ ...prev, teamName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select team</option>
                    <option value="Team Spring">Team Spring</option>
                    <option value="Team Tovi's">Team Tovi's</option>
                    <option value="Team Elite">Team Elite</option>
                    <option value="Team Metro">Team Metro</option>
                    <option value="Team Sunshine">Team Sunshine</option>
                    <option value="Team Pacific">Team Pacific</option>
                  </select>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Team Selection</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      The gymnast will appear in the selected team's coach approval list.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddGymnastModal(false);
                  setGymnastData({ firstName: '', lastName: '', email: '', level: '', dateOfBirth: '', teamName: '' });
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitGymnast}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Gymnast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Report Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Export Team Data</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <button
                onClick={handleExportTeamReport}
                className="w-full text-left p-4 rounded-xl border border-gray-200 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Team Report (CSV)</p>
                    <p className="text-sm text-gray-500">All gymnasts with levels and status</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={handleExportProgress}
                className="w-full text-left p-4 rounded-xl border border-gray-200 hover:bg-green-50 hover:border-green-200 transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Progress Report (JSON)</p>
                    <p className="text-sm text-gray-500">Detailed team progress and analytics</p>
                  </div>
                </div>
              </button>
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
