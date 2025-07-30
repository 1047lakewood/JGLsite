import React, { useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Trophy } from 'lucide-react';
import { useMembers } from '../../hooks/useSupabaseData';
import {
  createMember as createMemberApi,
  updateMember as updateMemberApi,
  deleteMember as deleteMemberApi
} from '../../lib/supabase';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'gym_admin' | 'coach' | 'gymnast' | 'host';
  gymId?: string;
  gymName?: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  level?: string;
  isActive: boolean;
  totalPoints?: number;
  membershipStatus?: 'pending' | 'active' | 'inactive' | 'suspended';
  approvedByCoach?: boolean;
  createdAt: string;
  lastLogin?: string;
}

export const MemberManagement: React.FC = () => {
  const { members, refetch } = useMembers();

  const memberList: Member[] = members.map(m => {
    const extra = m as unknown as {
      level?: string;
      total_points?: number;
      membership_status?: Member['membershipStatus'];
      approved_by_coach?: boolean;
    };
    return {
      id: m.id,
      firstName: m.first_name,
      lastName: m.last_name,
      email: m.email,
      role: m.role,
      gymId: m.gym_id || '',
      gymName: m.gym?.name,
      phone: m.phone,
      dateOfBirth: m.date_of_birth,
      level: extra.level,
      isActive: m.is_active,
      totalPoints: extra.total_points,
      membershipStatus: extra.membership_status,
      approvedByCoach: extra.approved_by_coach,
      createdAt: m.created_at,
      lastLogin: m.updated_at
    };
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'gymnast' as Member['role'],
    gymId: '',
    phone: '',
    dateOfBirth: '',
    level: ''
  });

  const filteredMembers = memberList.filter(member => {
    const fullName = `${member.firstName} ${member.lastName}`;
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.gymName && member.gymName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && member.isActive) ||
                         (filterStatus === 'inactive' && !member.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const toggleMemberStatus = async (memberId: string) => {
    const member = memberList.find(m => m.id === memberId);
    if (!member) return;

    const newStatus = !member.isActive;
    await updateMemberApi(memberId, { is_active: newStatus });
    await refetch();
  };

  const deleteMember = async (memberId: string) => {
    if (confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      await deleteMemberApi(memberId);
      await refetch();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingMember) {
      // Update existing member
      const updates = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        role: formData.role,
        gym_id: formData.gymId || null,
        phone: formData.phone || null,
        date_of_birth: formData.dateOfBirth || null,
        is_active: editingMember.isActive
      };
      await updateMemberApi(editingMember.id, updates);
      await refetch();
      setEditingMember(null);
    } else {
      // Create new member
      const newMember: Member = {
        id: `member-${Date.now()}`,
        ...formData,
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0]
      };
      await createMemberApi({
        id: newMember.id,
        first_name: newMember.firstName,
        last_name: newMember.lastName,
        email: newMember.email,
        role: newMember.role,
        gym_id: newMember.gymId || null,
        phone: newMember.phone || null,
        date_of_birth: newMember.dateOfBirth || null,
        is_active: true
      });
      await refetch();
    }
    
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'gymnast',
      gymId: '',
      phone: '',
      dateOfBirth: '',
      level: ''
    });
    setShowCreateForm(false);
  };

  const startEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      role: member.role,
      gymId: member.gymId || '',
      phone: member.phone || '',
      dateOfBirth: member.dateOfBirth || '',
      level: member.level || ''
    });
    setShowCreateForm(true);
  };

  const cancelEdit = () => {
    setEditingMember(null);
    setShowCreateForm(false);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'gymnast',
      gymId: '',
      phone: '',
      dateOfBirth: '',
      level: ''
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'gym_admin': return 'bg-purple-100 text-purple-800';
      case 'coach': return 'bg-blue-100 text-blue-800';
      case 'gymnast': return 'bg-green-100 text-green-800';
      case 'host': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: memberList.length,
    active: memberList.filter(m => m.isActive).length,
    inactive: memberList.filter(m => !m.isActive).length,
    gymnasts: memberList.filter(m => m.role === 'gymnast').length,
    coaches: memberList.filter(m => m.role === 'coach').length,
    admins: memberList.filter(m => m.role === 'admin' || m.role === 'gym_admin').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Member Management</h1>
          <p className="text-gray-600 mt-1">Manage all league members and their roles</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Member</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Members</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <div className="text-sm text-gray-600">Inactive</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.gymnasts}</div>
            <div className="text-sm text-gray-600">Gymnasts</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.coaches}</div>
            <div className="text-sm text-gray-600">Coaches</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.admins}</div>
            <div className="text-sm text-gray-600">Admins</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search members by name, email, or gym..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="gym_admin">Gym Admin</option>
              <option value="coach">Coach</option>
              <option value="gymnast">Gymnast</option>
              <option value="host">Host</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            League Members ({filteredMembers.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gym
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                      {member.phone && (
                        <div className="text-sm text-gray-500">{member.phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(member.role)}`}>
                      {member.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {member.gymName || 'No gym assigned'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        member.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {member.role === 'gymnast' && member.approvedByCoach !== undefined && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          member.approvedByCoach 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {member.approvedByCoach ? 'Approved' : 'Pending'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {member.role === 'gymnast' && (
                        <div>
                          {member.level && <div>Level: {member.level}</div>}
                          {member.totalPoints !== undefined && (
                            <div className="flex items-center space-x-1">
                              <Trophy className="w-3 h-3 text-yellow-500" />
                              <span>{member.totalPoints} pts</span>
                            </div>
                          )}
                          {member.dateOfBirth && (
                            <div>Age: {new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear()}</div>
                          )}
                        </div>
                      )}
                      {member.lastLogin && (
                        <div className="text-xs text-gray-500">
                          Last login: {new Date(member.lastLogin).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleMemberStatus(member.id)}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          member.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {member.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => startEdit(member)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteMember(member.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Member Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter first name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter last name"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as Member['role'] }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="gymnast">Gymnast</option>
                    <option value="coach">Coach</option>
                    <option value="gym_admin">Gym Admin</option>
                    <option value="host">Host</option>
                    <option value="admin">League Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
                
                {formData.role === 'gymnast' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                      <select
                        value={formData.level}
                        onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
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
                  </>
                )}
              </div>
            </form>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={cancelEdit}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
              >
                {editingMember ? 'Update Member' : 'Create Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
