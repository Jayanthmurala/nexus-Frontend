'use client';

import React, { useState } from 'react';
import { X, Calendar, MapPin, Users, Clock, BookOpen, Trophy, Network, Plus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import toast from 'react-hot-toast';

type EventType = 'workshop' | 'seminar' | 'competition' | 'networking';
type AccessType = 'ALL' | 'CSE' | 'ECE' | 'ME' | 'CE' | 'EE';

interface EventFormData {
  title: string;
  type: EventType;
  description: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  maxAttendees: string; // keep as string for input control
  access: AccessType;
  link: string;
  tags: string[];
}

interface CreateEventProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateEvent({ onClose, onSuccess }: CreateEventProps) {
  const { user } = useAuth();
  const { addEvent } = useData();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    type: 'workshop',
    description: '',
    date: '',
    time: '',
    duration: '',
    location: '',
    maxAttendees: '',
    access: 'ALL',
    link: '',
    tags: ['']
  });

  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});

  type IconType = LucideIcon;
  const eventTypes: { value: EventType; label: string; icon: IconType }[] = [
    { value: 'workshop', label: 'Workshop', icon: BookOpen },
    { value: 'seminar', label: 'Seminar', icon: Users },
    { value: 'competition', label: 'Competition', icon: Trophy },
    { value: 'networking', label: 'Networking', icon: Network }
  ];

  const accessOptions: { value: AccessType; label: string }[] = [
    { value: 'ALL', label: 'All Departments' },
    { value: 'CSE', label: 'Computer Science' },
    { value: 'ECE', label: 'Electronics & Communication' },
    { value: 'ME', label: 'Mechanical Engineering' },
    { value: 'CE', label: 'Civil Engineering' },
    { value: 'EE', label: 'Electrical Engineering' }
  ];

  const mapAccessToDepartment = (access: AccessType) => {
    switch (access) {
      case 'ALL':
        return 'All Departments';
      case 'CSE':
        return 'Computer Science';
      case 'ECE':
        return 'Electronics & Communication';
      case 'ME':
        return 'Mechanical Engineering';
      case 'CE':
        return 'Civil Engineering';
      case 'EE':
        return 'Electrical Engineering';
      default:
        return 'All Departments';
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Event title is required';
    if (!formData.description.trim()) newErrors.description = 'Event description is required';

    if (!formData.date) {
      newErrors.date = 'Event date is required';
    } else {
      const selectedDate = new Date(`${formData.date}T${formData.time || '00:00'}`);
      if (selectedDate <= new Date()) newErrors.date = 'Event date must be in the future';
    }

    if (!formData.time) newErrors.time = 'Event time is required';
    if (!formData.location.trim()) newErrors.location = 'Event location is required';
    const isOnlineLocation = formData.location.trim().toLowerCase() === 'online';
    if (isOnlineLocation && !formData.link.trim()) newErrors.link = 'Online link is required for online events';
    if (!formData.maxAttendees || parseInt(formData.maxAttendees) <= 0) newErrors.maxAttendees = 'Maximum attendees must be a positive number';
    if (!formData.duration.trim()) newErrors.duration = 'Event duration is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const eventDate = new Date(`${formData.date}T${formData.time}`);
      const location = formData.location.trim();
      const link = formData.link.trim();
      const isOnlineLocation = location.toLowerCase() === 'online';
      const mode: 'online' | 'in_person' | 'hybrid' = link
        ? (isOnlineLocation ? 'online' : 'hybrid')
        : 'in_person';

      await addEvent({
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: eventDate,
        location,
        organizer: user?.name || 'Unknown Organizer',
        department: mapAccessToDepartment(formData.access),
        type: formData.type as 'workshop' | 'seminar' | 'competition' | 'networking',
        capacity: parseInt(formData.maxAttendees),
        registered: 0,
        joinUrl: link || undefined,
        mode,
      });

      toast.success('Event created successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof EventFormData, value: string) => {
    setFormData((prev: EventFormData) => ({ ...prev, [field]: value }));
    if (errors[field])
      setErrors((prev: Partial<Record<keyof EventFormData, string>>) => ({
        ...prev,
        [field]: undefined,
      }));
  };

  const addTag = () => setFormData((prev: EventFormData) => ({ ...prev, tags: [...prev.tags, ''] }));
  const updateTag = (index: number, value: string) => setFormData((prev: EventFormData) => ({ ...prev, tags: prev.tags.map((t: string, i: number) => i === index ? value : t) }));
  const removeTag = (index: number) => setFormData((prev: EventFormData) => ({ ...prev, tags: prev.tags.filter((_, i: number) => i !== index) }));

  const getTypeIcon = (type: EventType): IconType => {
    const eventType = eventTypes.find((et) => et.value === type);
    return eventType?.icon || BookOpen;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
              <p className="text-gray-600 mt-1">Organize workshops, seminars, competitions, and networking events</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter event title"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.title ? 'border-red-300' : 'border-gray-300'}`}
                />
                {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your event"
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.description ? 'border-red-300' : 'border-gray-300'}`}
              />
              {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
            </div>
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Date & Time</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.date ? 'border-red-300' : 'border-gray-300'}`}
                />
                {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.time ? 'border-red-300' : 'border-gray-300'}`}
                />
                {errors.time && <p className="text-red-600 text-sm mt-1">{errors.time}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration *</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  placeholder="e.g., 2 hours"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.duration ? 'border-red-300' : 'border-gray-300'}`}
                />
                {errors.duration && <p className="text-red-600 text-sm mt-1">{errors.duration}</p>}
              </div>
            </div>
          </div>

          {/* Location and Capacity */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Location & Capacity</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Venue or 'Online'"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.location ? 'border-red-300' : 'border-gray-300'}`}
                />
                {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Attendees *</label>
                <input
                  type="number"
                  value={formData.maxAttendees}
                  onChange={(e) => handleInputChange('maxAttendees', e.target.value)}
                  placeholder="100"
                  min={1}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.maxAttendees ? 'border-red-300' : 'border-gray-300'}`}
                />
                {errors.maxAttendees && <p className="text-red-600 text-sm mt-1">{errors.maxAttendees}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Access</label>
                <select
                  value={formData.access}
                  onChange={(e) => handleInputChange('access', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {accessOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Online Link (Optional)</label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => handleInputChange('link', e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.link ? 'border-red-300' : 'border-gray-300'}`}
                />
                {errors.link && <p className="text-red-600 text-sm mt-1">{errors.link}</p>}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
            <div className="space-y-2">
              {formData.tags.map((tag: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => updateTag(index, e.target.value)}
                    placeholder="Add a tag"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {formData.tags.length > 1 && (
                    <button type="button" onClick={() => removeTag(index)} className="text-red-600 hover:text-red-700 p-2">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addTag} className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                <Plus className="w-4 h-4 mr-1" />
                Add Tag
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Preview</h3>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  {(() => { const TypeIcon = getTypeIcon(formData.type); return <TypeIcon className="w-5 h-5 text-blue-600" aria-hidden="true" /> })()}
                </div>
                <div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">{formData.type.toUpperCase()}</span>
                  <h4 className="font-semibold text-gray-900 mt-1">{formData.title || 'Event Title'}</h4>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-3">{formData.description || 'Event description will appear here...'}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" aria-hidden="true" />
                  {formData.date ? new Date(formData.date).toLocaleDateString() : 'Date'}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" aria-hidden="true" />
                  {formData.time || 'Time'}
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" aria-hidden="true" />
                  {formData.location || 'Location'}
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" aria-hidden="true" />
                  {formData.maxAttendees || '0'} max
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Creating Event...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
