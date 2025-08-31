'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, MapPin, Users, Tag, Plus, Loader2, FileText, Globe, Building, Video } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { useAppDispatch } from '@/store/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { getCollegeDepartments } from '@/lib/authApi';
import { createEvent, updateEvent } from '@/store/slices/eventsSlice';
import { EventType, EventMode } from '@/lib/eventsApi';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingEvent?: any | null;
}

export default function CreateEventModal({ isOpen, onClose, editingEvent }: CreateEventModalProps) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<string[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'WORKSHOP',
    mode: 'ONSITE',
    startAt: '',
    endAt: '',
    location: '',
    meetingUrl: '',
    capacity: '',
    visibleToAllDepts: true,
    departments: [] as string[],
    tags: [] as string[]
  });

  // Populate form when editing
  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title || '',
        description: editingEvent.description || '',
        type: editingEvent.type || 'WORKSHOP',
        mode: editingEvent.mode || 'ONSITE',
        startAt: editingEvent.startAt ? new Date(editingEvent.startAt).toISOString().slice(0, 16) : '',
        endAt: editingEvent.endAt ? new Date(editingEvent.endAt).toISOString().slice(0, 16) : '',
        location: editingEvent.location || '',
        meetingUrl: editingEvent.meetingUrl || '',
        capacity: editingEvent.capacity?.toString() || '',
        visibleToAllDepts: editingEvent.visibleToAllDepts ?? true,
        departments: editingEvent.departments || [],
        tags: editingEvent.tags || []
      });
    } else {
      // Reset form for new event
      setFormData({
        title: '',
        description: '',
        type: 'WORKSHOP',
        mode: 'ONSITE',
        startAt: '',
        endAt: '',
        location: '',
        meetingUrl: '',
        capacity: '',
        visibleToAllDepts: true,
        departments: [],
        tags: []
      });
    }
  }, [editingEvent, isOpen]);

  const [newTag, setNewTag] = useState('');

  // Fetch college departments on mount
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      try {
        console.log('User object:', user);
        console.log('User collegeId:', user?.collegeId);
        
        if (!user?.collegeId) {
          console.warn('No collegeId found in user context, using fallback departments');
          // Use common departments as fallback
          setDepartments(['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Chemical', 'Biotechnology', 'Mathematics', 'Physics']);
          return;
        }
        
        console.log('Fetching departments for collegeId:', user.collegeId);
        const depts = await getCollegeDepartments(user.collegeId);
        console.log('Fetched departments:', depts);
        setDepartments(depts);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
        // Fallback to common departments
        setDepartments(['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Chemical', 'Biotechnology', 'Mathematics', 'Physics']);
      } finally {
        setLoadingDepartments(false);
      }
    };

    if (isOpen) {
      fetchDepartments();
    }
  }, [isOpen, user?.collegeId]);

  const eventTypes = [
    { value: 'WORKSHOP', label: 'Workshop', color: 'bg-blue-500' },
    { value: 'SEMINAR', label: 'Seminar', color: 'bg-emerald-500' },
    { value: 'HACKATHON', label: 'Hackathon', color: 'bg-purple-500' },
    { value: 'MEETUP', label: 'Meetup', color: 'bg-orange-500' }
  ];

  const eventModes = [
    { value: 'ONSITE', label: 'On-site', icon: Building },
    { value: 'ONLINE', label: 'Online', icon: Video },
    { value: 'HYBRID', label: 'Hybrid', icon: Globe }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.startAt) errors.startAt = 'Start date is required';
    
    if (formData.startAt) {
      const start = new Date(formData.startAt);
      const now = new Date();
      
      // Only validate future date for new events, not when editing
      if (!editingEvent && start <= now) {
        errors.startAt = 'Start date must be in the future';
      }
      
      if (formData.endAt) {
        const end = new Date(formData.endAt);
        if (end < start) {
          errors.endAt = 'End date must be after or equal to start date';
        }
      }
    }
    
    if (formData.capacity && parseInt(formData.capacity) < 1) {
      errors.capacity = 'Capacity must be at least 1';
    }
    
    // Validate meeting URL for online/hybrid events
    if ((formData.mode === 'ONLINE' || formData.mode === 'HYBRID') && !formData.meetingUrl.trim()) {
      errors.meetingUrl = 'Meeting URL is required for online/hybrid events';
    }
    
    // Validate location for onsite/hybrid events
    if ((formData.mode === 'ONSITE' || formData.mode === 'HYBRID') && !formData.location.trim()) {
      errors.location = 'Location is required for onsite/hybrid events';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    // Only show loading for create operations, not updates
    if (!editingEvent) {
      setLoading(true);
    }
    
    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        type: formData.type as EventType,
        mode: formData.mode as EventMode,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: formData.endAt && formData.endAt.trim() ? new Date(formData.endAt).toISOString() : new Date(new Date(formData.startAt).getTime() + 60 * 60 * 1000).toISOString(),
        location: formData.location || undefined,
        meetingUrl: formData.meetingUrl || undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        visibleToAllDepts: formData.visibleToAllDepts,
        departments: formData.visibleToAllDepts ? [] : formData.departments,
        tags: formData.tags,
      };

      if (editingEvent) {
        await dispatch(updateEvent({ id: editingEvent.id, changes: eventData })).unwrap();
        toast.success('✨ Event updated successfully!');
        onClose();
        return; // Exit early for updates to avoid form reset
      } else {
        await dispatch(createEvent(eventData)).unwrap();
        toast.success('🎉 Event created successfully!');
      }
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'SEMINAR',
        mode: 'ONLINE',
        startAt: '',
        endAt: '',
        location: '',
        meetingUrl: '',
        capacity: '',
        visibleToAllDepts: true,
        departments: [] as string[],
        tags: [] as string[]
      });
      setValidationErrors({});
    } catch (error: any) {
      console.error('Event creation error:', error);
      const errorMessage = error?.message || 'Failed to create event';
      
      // Check for specific validation errors
      if (errorMessage.includes('End date must be after start date') || 
          errorMessage.includes('endAt') || 
          errorMessage.includes('startAt')) {
        toast.error('📅 Please check your event dates and try again.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('🔌 Network error. Please check your connection and try again.');
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
        toast.error('🔐 Authentication required. Please log in again.');
      } else if (errorMessage.includes('validation') || errorMessage.includes('400')) {
        // Show the actual error message if available
        const detailedError = error?.response?.data?.message || error?.response?.data?.error || errorMessage;
        toast.error(`📝 ${detailedError}`);
      } else {
        toast.error(`❌ ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingEvent ? 'Edit Event' : 'Create New Event'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Describe your event"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Mode *
                </label>
                <select
                  name="mode"
                  value={formData.mode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {eventModes.map(mode => (
                    <option key={mode.value} value={mode.value}>
                      {mode.label}
                    </option>
                  ))}
                </select>
                {validationErrors.mode && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.mode}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="startAt"
                  value={formData.startAt}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.startAt ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.startAt && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.startAt}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time <span className="text-gray-500 text-xs">(optional - leave empty for single-day events)</span>
                </label>
                <input
                  type="datetime-local"
                  name="endAt"
                  value={formData.endAt}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.endAt ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {validationErrors.endAt && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.endAt}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location {(formData.mode === 'ONSITE' || formData.mode === 'HYBRID') && '*'}
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.location ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Event location (required for onsite/hybrid events)"
                />
                {validationErrors.location && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.location}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.capacity ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Maximum participants"
                  min="1"
                />
                {validationErrors.capacity && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.capacity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting URL {(formData.mode === 'ONLINE' || formData.mode === 'HYBRID') && '*'}
                </label>
                <input
                  type="url"
                  name="meetingUrl"
                  value={formData.meetingUrl}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validationErrors.meetingUrl ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="https://meet.google.com/... (required for online/hybrid)"
                />
                {validationErrors.meetingUrl && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.meetingUrl}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <input
                    type="checkbox"
                    name="visibleToAllDepts"
                    checked={formData.visibleToAllDepts}
                    onChange={(e) => setFormData(prev => ({ ...prev, visibleToAllDepts: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Visible to all departments
                </label>
                
                {!formData.visibleToAllDepts && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Departments
                    </label>
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {loadingDepartments ? (
                        <div className="text-sm text-gray-500 text-center py-2">Loading departments...</div>
                      ) : departments.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-2">No departments available</div>
                      ) : (
                        departments.map(dept => (
                          <label key={dept} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={formData.departments.includes(dept)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({ ...prev, departments: [...prev.departments, dept] }));
                                } else {
                                  setFormData(prev => ({ ...prev, departments: prev.departments.filter(d => d !== dept) }));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            {dept}
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add a tag"
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    Add Tag
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingEvent ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingEvent ? 'Update Event' : 'Create Event'
                )}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
