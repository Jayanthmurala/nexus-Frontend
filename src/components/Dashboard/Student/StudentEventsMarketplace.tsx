'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Filter, 
  Search, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  Loader2, 
  Video,
  BookOpen,
  Trophy,
  Building,
  Globe,
  CheckCircle,
  XCircle,
  TrendingUp,
  Star,
  Heart,
  Share2,
  Grid3X3,
  List,
  SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchEvents,
  fetchMyEvents,
  registerForEvent,
  unregisterFromEvent,
  selectEvents,
  selectEventsLoading,
  selectMyRegisteredEvents
} from '@/store/slices/eventsSlice';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import toast from 'react-hot-toast';
import type { Event as AppEvent } from '@/lib/eventsApi';
import CalendarToggle from '@/components/Dashboard/Student/CalendarToggle';

export default function StudentEventsMarketplace() {
  const dispatch = useAppDispatch();
  const events = useAppSelector(selectEvents);
  const loading = useAppSelector(selectEventsLoading);
  const myRegisteredEvents = useAppSelector(selectMyRegisteredEvents);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCalendar, setShowCalendar] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    dispatch(fetchEvents({ page: 1, limit: 100 }));
    dispatch(fetchMyEvents()); // Fetch user's registered events
  }, [dispatch]);

  const myRegisteredEventIds = useMemo(() => {
    // myRegisteredEvents is already an array of event IDs from the selector
    return myRegisteredEvents || [];
  }, [myRegisteredEvents]);

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events.filter((event: AppEvent) => {
      const matchesSearch = 
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || event.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'upcoming' && new Date(event.startAt) >= new Date()) ||
        (statusFilter === 'past' && new Date(event.startAt) < new Date()) ||
        (statusFilter === 'registered' && myRegisteredEventIds.includes(event.id));
      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort events
    filtered.sort((a: AppEvent, b: AppEvent) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
        case 'popularity':
          return (b.registrationCount || 0) - (a.registrationCount || 0);
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [events, searchTerm, typeFilter, statusFilter, sortBy, myRegisteredEventIds]);

  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = events.filter((e: AppEvent) => new Date(e.startAt) >= now).length;
    const registered = myRegisteredEventIds.length;
    const available = events.filter((e: AppEvent) => 
      new Date(e.startAt) >= now && !myRegisteredEventIds.includes(e.id)
    ).length;
    return { upcoming, registered, available };
  }, [events, myRegisteredEventIds]);

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'WORKSHOP': return 'bg-blue-500';
      case 'SEMINAR': return 'bg-emerald-500';
      case 'HACKATHON': return 'bg-purple-500';
      case 'MEETUP': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventTypeColorLight = (type: string) => {
    switch (type) {
      case 'WORKSHOP': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'SEMINAR': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'HACKATHON': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'MEETUP': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'WORKSHOP': return BookOpen;
      case 'SEMINAR': return Users;
      case 'HACKATHON': return Trophy;
      case 'MEETUP': return Users;
      default: return CalendarIcon;
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'ONLINE': return Video;
      case 'ONSITE': return Building;
      case 'HYBRID': return Globe;
      default: return MapPin;
    }
  };

  const handleRegister = useCallback(async (eventId: string) => {
    setRegistrationLoading(prev => ({ ...prev, [eventId]: true }));
    try {
      await dispatch(registerForEvent(eventId)).unwrap();
      // Refresh my events to update registration status
      dispatch(fetchMyEvents());
      toast.success('🎉 Successfully registered for event!');
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error?.message || 'Failed to register';
      
      if (errorMessage.includes('capacity') || errorMessage.includes('full')) {
        toast.error('😔 Event is full. Registration closed.');
      } else if (errorMessage.includes('deadline')) {
        toast.error('⏰ Registration deadline has passed.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('🔌 Network error. Please try again.');
      } else {
        toast.error(`❌ ${errorMessage}`);
      }
    } finally {
      setRegistrationLoading(prev => ({ ...prev, [eventId]: false }));
    }
  }, [dispatch]);

  const handleUnregister = useCallback(async (eventId: string) => {
    setRegistrationLoading(prev => ({ ...prev, [eventId]: true }));
    try {
      await dispatch(unregisterFromEvent(eventId)).unwrap();
      // Refresh my events to update registration status
      dispatch(fetchMyEvents());
      toast.success('✅ Successfully unregistered from event');
    } catch (error: any) {
      console.error('Unregistration error:', error);
      const errorMessage = error?.message || 'Failed to unregister';
      
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        toast.error('🔌 Network error. Please try again.');
      } else {
        toast.error(`❌ ${errorMessage}`);
      }
    } finally {
      setRegistrationLoading(prev => ({ ...prev, [eventId]: false }));
    }
  }, [dispatch]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const EventCard = React.memo(({ event, index }: { event: AppEvent; index: number }) => {
    const EventIcon = getEventIcon(event.type);
    const ModeIcon = getModeIcon(event.mode);
    const isRegistered = myRegisteredEventIds.includes(event.id);
    const isPastEvent = new Date(event.startAt) < new Date();
    const isLoading = registrationLoading[event.id] || false;
    const isFull = event.capacity && event.registrationCount >= event.capacity;
    const registrationDeadlinePassed = event.registrationDeadline ? new Date(event.registrationDeadline) < new Date() : false;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        whileHover={{ y: -4 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getEventTypeColorLight(event.type)}`}>
                <EventIcon className="h-4 w-4" />
                {event.type}
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <ModeIcon className="h-4 w-4" />
                {event.mode}
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              {isRegistered && (
                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                  Registered
                </Badge>
              )}
              {isPastEvent && (
                <Badge variant="secondary" className="text-xs">
                  Past Event
                </Badge>
              )}
              {isFull && !isPastEvent && (
                <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                  Full
                </Badge>
              )}
              {registrationDeadlinePassed && !isPastEvent && !isFull && (
                <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                  Deadline Passed
                </Badge>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
              {event.title}
            </h3>
            <p className="text-gray-600 line-clamp-3 mb-4">
              {event.description}
            </p>
          </div>

          {/* Event Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{formatDate(event.startAt)}</span>
            </div>
            
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{event.registrationCount || 0} / {event.capacity || '∞'} registered</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Join Meeting Button for Online/Hybrid Events */}
            {(event.mode === 'ONLINE' || event.mode === 'HYBRID') && event.meetingUrl && isRegistered && (
              <Button
                onClick={() => window.open(event.meetingUrl!, '_blank')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
              >
                <Video className="h-4 w-4 mr-2" />
                Join Meeting
              </Button>
            )}
            
            {!isPastEvent && (
              <Button
                onClick={() => isRegistered ? handleUnregister(event.id) : handleRegister(event.id)}
                disabled={isLoading || (!isRegistered && (isFull || registrationDeadlinePassed))}
                className={`${(event.mode === 'ONLINE' || event.mode === 'HYBRID') && event.meetingUrl && isRegistered ? 'flex-1' : 'flex-1'} transition-all duration-200 ${
                  isRegistered 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200' 
                    : isFull || registrationDeadlinePassed
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                }`}
                variant={isRegistered ? "outline" : "default"}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    {isRegistered ? 'Unregistering...' : 'Registering...'}
                  </>
                ) : isRegistered ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Unregister
                  </>
                ) : isFull ? (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Event Full
                  </>
                ) : registrationDeadlinePassed ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Deadline Passed
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Register
                  </>
                )}
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:text-blue-600 flex-shrink-0"
              onClick={() => {
                // Open event details modal or navigate to event details
                toast(`Viewing details for: ${event.title}`);
              }}
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    );
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="max-w-7xl mx-auto space-y-6 p-6"
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
            Event Marketplace
          </h1>
          <p className="text-gray-600 mt-1">Discover and join amazing academic events</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowCalendar(!showCalendar)}
            className="flex items-center gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            Calendar View
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <motion.div 
          className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 mb-1">Available Events</p>
              <p className="text-3xl font-bold text-blue-900">{stats.available}</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-emerald-700 mb-1">My Registrations</p>
              <p className="text-3xl font-bold text-emerald-900">{stats.registered}</p>
            </div>
            <div className="p-3 bg-emerald-500 rounded-xl shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-700 mb-1">Upcoming Events</p>
              <p className="text-3xl font-bold text-purple-900">{stats.upcoming}</p>
            </div>
            <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters and Controls */}
      <motion.div 
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-3">
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

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Events</option>
                <option value="upcoming">Upcoming</option>
                <option value="registered">My Registrations</option>
                <option value="past">Past Events</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Sort by Date</option>
                <option value="popularity">Sort by Popularity</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="px-3 py-1"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-3 py-1"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Calendar Toggle */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CalendarToggle 
              events={filteredAndSortedEvents} 
              onEventSelect={(event: AppEvent) => {
                // Handle event selection from calendar
                console.log('Selected event:', event);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events Grid/List */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        {filteredAndSortedEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
            <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No events are currently available'}
            </p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            <AnimatePresence>
              {filteredAndSortedEvents.map((event: AppEvent, index: number) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
