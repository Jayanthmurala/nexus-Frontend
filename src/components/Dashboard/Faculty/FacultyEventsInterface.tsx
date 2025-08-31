'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Download,
  MoreHorizontal,
  TrendingUp,
  CheckCircle,
  XCircle,
  BookOpen,
  Trophy,
  Video,
  Building,
  Globe,
  Target,
  Sparkles,
  ExternalLink,
  BarChart3,
  Calendar,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchEvents,
  fetchMyEvents,
  updateEvent,
  deleteEventById,
  exportEventRegistrations,
  selectEvents,
  selectMyEvents,
  selectEventsLoading,
  selectEventsError,
} from '@/store/slices/eventsSlice';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import type { Event as AppEvent } from '@/lib/eventsApi';
import CalendarToggle from '@/components/Dashboard/Student/CalendarToggle';
import CreateEventModal from './CreateEventModal';

export default function FacultyEventsInterface() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const events = useAppSelector(selectEvents);
  const myEvents = useAppSelector(selectMyEvents);
  const loading = useAppSelector(selectEventsLoading);
  const error = useAppSelector(selectEventsError);
  // const pagination = useAppSelector(selectEventsPagination);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'all' | 'mine'>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);
  const [analyticsEvent, setAnalyticsEvent] = useState<AppEvent | null>(null);

  useEffect(() => {
    dispatch(fetchEvents({ page: 1, limit: 20 }));
    dispatch(fetchMyEvents());
  }, [dispatch]);

  const filteredEvents = useMemo(() => {
    let eventsToFilter = events;
    
    // Filter by viewMode
    if (viewMode === 'mine') {
      eventsToFilter = events.filter((event: AppEvent) => event.authorId === user?.id);
    }
    
    return eventsToFilter.filter((event: AppEvent) => {
      const matchesSearch = 
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' ? true : event.type === typeFilter;
      const matchesStatus = statusFilter === 'all' ? true : 
        (statusFilter === 'upcoming' && new Date(event.startAt) >= new Date()) ||
        (statusFilter === 'past' && new Date(event.startAt) < new Date());
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [events, viewMode, user?.id, searchTerm, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const allMyEvents = events.filter((e: AppEvent) => e.authorId === user?.id);
    const upcoming = allMyEvents.filter((e: AppEvent) => new Date(e.startAt) >= now).length;
    const past = allMyEvents.filter((e: AppEvent) => new Date(e.startAt) < now).length;
    const total = allMyEvents.length;
    const totalRegistrations = allMyEvents.reduce((sum: number, e: AppEvent) => sum + (e.registrationCount || 0), 0);
    return { upcoming, past, total, totalRegistrations };
  }, [events, user?.id]);

  const getEventTypeColor = useCallback((type: string) => {
    switch (type) {
      case 'WORKSHOP': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'SEMINAR': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'HACKATHON': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'MEETUP': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }, []);

  const getEventIcon = useCallback((type: string) => {
    switch (type) {
      case 'WORKSHOP': return BookOpen;
      case 'SEMINAR': return Users;
      case 'HACKATHON': return Trophy;
      case 'MEETUP': return Users;
      default: return Calendar;
    }
  }, []);

  const getModeIcon = useCallback((mode: string) => {
    switch (mode) {
      case 'ONLINE': return Video;
      case 'ONSITE': return Building;
      case 'HYBRID': return Globe;
      default: return MapPin;
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const handleExportRegistrations = useCallback(async (eventId: string) => {
    try {
      const result = await dispatch(exportEventRegistrations(eventId)).unwrap();
      
      // Create download link and trigger download
      const url = window.URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Registration data exported successfully');
    } catch (error) {
      toast.error('Failed to export registration data');
    }
  }, [dispatch]);

  const handleEditEvent = useCallback((event: AppEvent) => {
    setEditingEvent(event);
    setCreateModalOpen(true);
  }, []);

  const handleDeleteEvent = useCallback(async (eventId: string, eventTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
      try {
        await dispatch(deleteEventById(eventId)).unwrap();
        toast.success('Event deleted successfully');
      } catch (error) {
        toast.error('Failed to delete event');
      }
    }
  }, [dispatch]);

  // Animated counter component
  const AnimatedCounter = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      let startTime: number;
      let animationFrame: number;
      
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        setCount(Math.floor(progress * value));
        
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };
      
      animationFrame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);
    
    return <span>{count}</span>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Event Management
          </h1>
          <p className="text-gray-600 mt-1">Create, manage and monitor academic events</p>
        </div>
        <motion.span 
          className="text-sm text-gray-500 font-medium px-3 py-1 bg-gray-100 rounded-full"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <AnimatedCounter value={filteredEvents.length} /> events
        </motion.span>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 mb-1">My Events</p>
              <p className="text-3xl font-bold text-blue-900">
                <AnimatedCounter value={stats.total} />
              </p>
            </div>
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700 mb-1">Upcoming</p>
              <p className="text-3xl font-bold text-emerald-900">
                <AnimatedCounter value={stats.upcoming} />
              </p>
            </div>
            <div className="p-3 bg-emerald-500 rounded-xl shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 mb-1">Past Events</p>
              <p className="text-3xl font-bold text-purple-900">
                <AnimatedCounter value={stats.past} />
              </p>
            </div>
            <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-orange-700 mb-1">Total Registrations</p>
              <p className="text-3xl font-bold text-orange-900">
                <AnimatedCounter value={stats.totalRegistrations} />
              </p>
            </div>
            <div className="p-3 bg-orange-500 rounded-xl shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Calendar Toggle - Positioned above events */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <CalendarToggle 
              events={filteredEvents}
              showCreateButton={true}
              onCreateEvent={() => setCreateModalOpen(true)}
              onEventSelect={(event: AppEvent) => {
                toast(`Viewing event: ${event.title}`);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <motion.div 
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="SEMINAR">Seminar</option>
              <option value="HACKATHON">Hackathon</option>
              <option value="MEETUP">Meetup</option>
            </select>
          </div>

        </div>
      </motion.div>

      {/* Events Grid */}
      <motion.div 
        className="grid gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setShowCalendar(!showCalendar)}
              variant={showCalendar ? 'default' : 'outline'}
              className="transition-all duration-200"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
            </Button>
            
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'all' ? 'default' : 'ghost'}
                onClick={() => setViewMode('all')}
                className="transition-all duration-200 text-sm px-4 py-2"
                size="sm"
              >
                All Events
              </Button>
              <Button
                variant={viewMode === 'mine' ? 'default' : 'ghost'}
                onClick={() => setViewMode('mine')}
                className="transition-all duration-200 text-sm px-4 py-2"
                size="sm"
              >
                My Events
              </Button>
            </div>
          </div>
          
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>
        <AnimatePresence>
          {filteredEvents.length === 0 ? (
            <motion.div 
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first event to get started'}
              </p>
              <Button 
                onClick={() => setCreateModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </motion.div>
          ) : (
            <div className="grid gap-6">
              {filteredEvents.map((event: AppEvent, index: number) => {
                const EventIcon = getEventIcon(event.type);
                const ModeIcon = getModeIcon(event.mode);
                const isPastEvent = new Date(event.startAt) < new Date();

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ y: -2 }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getEventTypeColor(event.type)}`}>
                            <EventIcon className="h-4 w-4" />
                            {event.type}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <ModeIcon className="h-4 w-4" />
                            {event.mode}
                          </div>
                          {isPastEvent && (
                            <Badge variant="secondary" className="text-xs">
                              Past Event
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Join Meeting Button for Online/Hybrid Events */}
                          {(event.mode === 'ONLINE' || event.mode === 'HYBRID') && event.meetingUrl && (
                            <Button
                              onClick={() => window.open(event.meetingUrl!, '_blank')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                            >
                              <Video className="h-4 w-4 mr-1" />
                              Join
                            </Button>
                          )}
                          
                          {/* CRUD Operations for Faculty's Own Events */}
                          {event.authorId === user?.id && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditEvent(event)}
                                className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEvent(event.id, event.title)}
                                className="text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportRegistrations(event.id)}
                            className="text-gray-600 hover:text-green-600"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {event.title}
                        </h3>
                        <p className="text-gray-600 line-clamp-2">
                          {event.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{formatDate(event.startAt)}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{event.registrationCount || 0} / {event.capacity || '∞'}</span>
                        </div>
                        <div 
                          className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 p-2 rounded-lg transition-all duration-200"
                          onClick={() => setAnalyticsEvent(event)}
                        >
                          <BarChart3 className="h-4 w-4" />
                          <span className="text-blue-600 font-medium hover:text-blue-700">View Analytics</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Create Event Modal */}
      <CreateEventModal 
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingEvent(null);
        }}
        editingEvent={editingEvent}
      />

      {/* Analytics Modal */}
      {analyticsEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Event Analytics</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAnalyticsEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Analytics Content */}
            <div className="p-6 space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{analyticsEvent.title}</h3>
                <p className="text-gray-600">{formatDate(analyticsEvent.startAt)}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {analyticsEvent.registrationCount || 0}
                    </div>
                    <div className="text-sm text-blue-700 font-medium">Registrations</div>
                  </div>
                </div>

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-600 mb-1">
                      {analyticsEvent.capacity || '∞'}
                    </div>
                    <div className="text-sm text-emerald-700 font-medium">Capacity</div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      {analyticsEvent.capacity ? 
                        Math.round(((analyticsEvent.registrationCount || 0) / analyticsEvent.capacity) * 100) : 
                        0}%
                    </div>
                    <div className="text-sm text-purple-700 font-medium">Fill Rate</div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-1">
                      {new Date(analyticsEvent.startAt) > new Date() ? 'Upcoming' : 'Past'}
                    </div>
                    <div className="text-sm text-orange-700 font-medium">Status</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-3">Event Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">{analyticsEvent.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mode:</span>
                    <span className="font-medium">{analyticsEvent.mode}</span>
                  </div>
                  {analyticsEvent.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{analyticsEvent.location}</span>
                    </div>
                  )}
                  {analyticsEvent.tags && analyticsEvent.tags.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tags:</span>
                      <div className="flex gap-1 flex-wrap">
                        {analyticsEvent.tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleExportRegistrations(analyticsEvent.id)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Registrations
                </Button>
                <Button
                  onClick={() => setAnalyticsEvent(null)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}

