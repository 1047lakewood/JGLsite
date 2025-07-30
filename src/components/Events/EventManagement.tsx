import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, DollarSign, Plus, Edit, Eye, Trash2 } from 'lucide-react';
import { useEvents, useGyms, EventWithRelations } from '../../hooks/useSupabaseData';
import { createEvent, updateEvent as updateEventApi, deleteEvent as deleteEventApi } from '../../lib/supabase';
import type { Database } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';

interface EventManagementProps {
  showCreateOnLoad?: boolean;
  onCreateFormClose?: () => void;
}

export const EventManagement: React.FC<EventManagementProps> = ({
  showCreateOnLoad = false,
  onCreateFormClose,
}) => {
  const { user } = useAuth();
  const { events, loading, error, refetch } = useEvents();
  const { gyms } = useGyms();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventWithRelations | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    event_date: '',
    description: '',
    location: '',
    host_gym_id: '',
    entry_fee: 0,
    ticket_price: 0,
    max_participants: '',
    registration_deadline: '',
  });

  useEffect(() => {
    if (showCreateOnLoad) {
      setShowCreateForm(true);
      setEditingEvent(null);
    }
  }, [showCreateOnLoad]);

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
        Error loading events: {error}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'closed': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      const updates: Database['public']['Tables']['events']['Update'] = {
        title: formData.title,
        description: formData.description || null,
        event_date: formData.event_date,
        location: formData.location,
        host_gym_id: formData.host_gym_id || user?.gym_id || '',
        registration_deadline: formData.registration_deadline,
        max_participants: formData.max_participants
          ? Number(formData.max_participants)
          : null,
        entry_fee: Number(formData.entry_fee),
        ticket_price: Number(formData.ticket_price),
        updated_at: new Date().toISOString(),
      };

      const { error } = await updateEventApi(editingEvent.id, updates);
      if (error) {
        alert('Failed to update event: ' + error.message);
        return;
      }
      await refetch();
    } else {
      const newEvent: Database['public']['Tables']['events']['Insert'] = {
        title: formData.title,
        description: formData.description || null,
        event_date: formData.event_date,
        event_time: null,
        location: formData.location,
        host_gym_id: formData.host_gym_id || user?.gym_id || '',
        registration_deadline: formData.registration_deadline,
        max_participants: formData.max_participants
          ? Number(formData.max_participants)
          : null,
        entry_fee: Number(formData.entry_fee),
        ticket_price: Number(formData.ticket_price),
        status: 'open' as const,
        levels_allowed: [],
        age_groups: [],
        created_by: user?.id || '',
      };

      const { error } = await createEvent(newEvent);
      if (error) {
        alert('Failed to create event: ' + error.message);
        return;
      }
      await refetch();
    }

    setFormData({
      title: '',
      event_date: '',
      description: '',
      location: '',
      host_gym_id: '',
      entry_fee: 0,
      ticket_price: 0,
      max_participants: '',
      registration_deadline: '',
    });
    setShowCreateForm(false);
    setEditingEvent(null);
    onCreateFormClose?.();
  };

  const startEdit = (event: EventWithRelations) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      event_date: event.event_date,
      description: event.description || '',
      location: event.location,
      host_gym_id: event.host_gym_id,
      entry_fee: event.entry_fee,
      ticket_price: event.ticket_price,
      max_participants: event.max_participants ? String(event.max_participants) : '',
      registration_deadline: event.registration_deadline,
    });
    setShowCreateForm(true);
  };

  const toggleVisibility = async (event: EventWithRelations) => {
    const newStatus = event.status === 'draft' ? 'open' : 'draft';
    const { error } = await updateEventApi(event.id, { status: newStatus });
    if (error) {
      alert('Failed to update event: ' + error.message);
      return;
    }
    await refetch();
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      const { error } = await deleteEventApi(eventId);
      if (error) {
        alert('Failed to delete event: ' + error.message);
        return;
      }
      await refetch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Event Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Event</span>
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                  {event.status.toUpperCase()}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{event.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(event.event_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>Entry: ${event.entry_fee} • Tickets: ${event.ticket_price}</span>
                </div>
                {event.max_participants && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Max participants: {event.max_participants}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Registration deadline: {new Date(event.registration_deadline).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <button
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    onClick={() => toggleVisibility(event)}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    onClick={() => startEdit(event)}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Event Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h2>
            </div>

            <form className="p-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter event title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                  <input
                    type="date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter event description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={formData.host_gym_id}
                  onChange={(e) => {
                    const gym = gyms.find(g => g.id === e.target.value);
                    setFormData({
                      ...formData,
                      host_gym_id: e.target.value,
                      location: gym?.name || '',
                    });
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select gym</option>
                  {gyms.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entry Fee ($)</label>
                  <input
                    type="number"
                    value={formData.entry_fee}
                    onChange={(e) => setFormData({ ...formData, entry_fee: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Price ($)</label>
                  <input
                    type="number"
                    value={formData.ticket_price}
                    onChange={(e) => setFormData({ ...formData, ticket_price: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                  <input
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline</label>
                <input
                  type="date"
                  value={formData.registration_deadline}
                  onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingEvent(null);
                    onCreateFormClose?.();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
