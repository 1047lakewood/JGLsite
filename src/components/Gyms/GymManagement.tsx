import React, { useState } from 'react';
import { Building2, MapPin, Phone, Mail, Globe, CheckCircle, Clock, Plus, Edit, Trash2, Users, Eye } from 'lucide-react';
import { useGyms, Gym } from '../../hooks/useSupabaseData';
import { useAuth } from '../../contexts/AuthContext';
import { createGym as createGymApi, updateGym as updateGymApi, deleteGym as deleteGymApi } from '../../lib/supabase';
import type { Database } from '../../types/database';

export const GymManagement: React.FC = () => {
  const { user } = useAuth();
  const { gyms, loading, error, refetch } = useGyms();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    contactEmail: '',
    contactPhone: '',
    website: ''
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Error loading gyms: {error}
      </div>
    );
  }

  const filteredGyms = gyms.filter(gym => {
    const matchesSearch = gym.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gym.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gym.contact_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'approved' && gym.is_approved) ||
                         (filterStatus === 'pending' && !gym.is_approved);
    return matchesSearch && matchesFilter;
  });

  const approveGym = async (gymId: string) => {
    await updateGymApi(gymId, { is_approved: true });
    await refetch();
  };

  const rejectGym = async (gymId: string) => {
    if (confirm('Are you sure you want to reject this gym application?')) {
      await deleteGymApi(gymId);
      await refetch();
    }
  };

  const handleDeleteGym = async (gymId: string) => {
    if (confirm('Are you sure you want to delete this gym? This action cannot be undone.')) {
      await deleteGymApi(gymId);
      await refetch();
    }
  };

  const toggleVisibility = async (gym: Gym) => {
    const newStatus = !gym.is_approved;
    await updateGymApi(gym.id, { is_approved: newStatus });
    await refetch();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingGym) {
      const updates = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone || null,
        website: formData.website || null,
        updated_at: new Date().toISOString(),
      };
      await updateGymApi(editingGym.id, updates);
      await refetch();
      setEditingGym(null);
    } else {
      // Create new gym
      const newGym: Database['public']['Tables']['gyms']['Insert'] = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone || null,
        website: formData.website || null,
        is_approved: false,
        admin_id: user?.id || null,
      };
      await createGymApi(newGym);
      await refetch();
    }
    
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      contactEmail: '',
      contactPhone: '',
      website: ''
    });
    setShowCreateForm(false);
  };

  const startEdit = (gym: Gym) => {
    setEditingGym(gym);
    setFormData({
      name: gym.name,
      address: gym.address,
      city: gym.city,
      state: gym.state,
      zipCode: gym.zip_code,
      contactEmail: gym.contact_email,
      contactPhone: gym.contact_phone || '',
      website: gym.website || ''
    });
    setShowCreateForm(true);
  };

  const cancelEdit = () => {
    setEditingGym(null);
    setShowCreateForm(false);
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      contactEmail: '',
      contactPhone: '',
      website: ''
    });
  };

  const stats = {
    total: gyms.length,
    approved: gyms.filter(g => g.is_approved).length,
    pending: gyms.filter(g => !g.is_approved).length,
    totalMembers: gyms.length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gym Management</h1>
          <p className="text-gray-600 mt-1">Manage gymnastics facilities across the league</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Gym</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Gyms</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Building2 className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <Clock className="w-10 h-10 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalMembers}</p>
            </div>
            <Users className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search gyms by name, city, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Approval</option>
          </select>
        </div>
      </div>

      {/* Gyms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredGyms.map((gym) => (
          <div key={gym.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{gym.name}</h3>
                <div className="flex items-center space-x-2">
                  {gym.is_approved ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Approved</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Pending</span>
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{gym.address}, {gym.city}, {gym.state} {gym.zip_code}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{gym.contact_email}</span>
                </div>
                {gym.contact_phone && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{gym.contact_phone}</span>
                  </div>
                )}
                {gym.website && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Globe className="w-4 h-4" />
                    <span>{gym.website}</span>
                  </div>
                )}
              </div>

              {gym.is_approved && (
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-gray-600">Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <div className="text-sm text-gray-600">Active Events</div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Added: {new Date(gym.created_at).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  {!gym.is_approved && (
                    <>
                      <button
                        onClick={() => approveGym(gym.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectGym(gym.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => toggleVisibility(gym)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startEdit(gym)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGym(gym.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Gym Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingGym ? 'Edit Gym' : 'Add New Gym'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gym Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter gym name"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter street address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter city"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter state"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.zipCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter ZIP code"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter contact email"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter website URL"
                  />
                </div>
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
                {editingGym ? 'Update Gym' : 'Create Gym'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
