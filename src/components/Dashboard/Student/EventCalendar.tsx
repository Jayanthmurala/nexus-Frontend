'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Trophy,
  Video,
  Building,
  Globe,
  CheckCircle,
  XCircle,
  TrendingUp
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchEvents,
  registerForEvent,
  unregisterFromEvent,
  selectEvents,
  selectEventsLoading,
  selectMyRegisteredEvents
} from '@/store/slices/eventsSlice';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import type { Event as AppEvent } from '@/lib/eventsApi';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function EventCalendar() {
  const dispatch = useAppDispatch();
  const events = useAppSelector(selectEvents);
  const loading = useAppSelector(selectEventsLoading);
  const myRegisteredEvents = useAppSelector(selectMyRegisteredEvents);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchEvents({ page: 1, limit: 100 }));
  }, [dispatch]);

  const myRegisteredEventIds = useMemo(() => {
    return myRegisteredEvents?.map((reg: any) => reg.eventId) || [];
  }, [myRegisteredEvents]);

  const filteredEvents = useMemo(() => {
    return events.filter((event: AppEvent) => {
      const matchesSearch = 
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || event.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [events, searchTerm, typeFilter]);

  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter((event: AppEvent) => {
      const eventDate = new Date(event.startAt);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Previous month's trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }
    
    // Next month's leading days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'WORKSHOP': return 'bg-blue-500';
      case 'SEMINAR': return 'bg-emerald-500';
      case 'HACKATHON': return 'bg-purple-500';
      case 'MEETUP': return 'bg-orange-500';
      default: return 'bg-gray-500';
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

  const handleRegister = async (eventId: string) => {
    try {
      await dispatch(registerForEvent(eventId)).unwrap();
      toast.success('Successfully registered for event!');
    } catch (error) {
      toast.error('Failed to register for event');
    }
  };

  const handleUnregister = async (eventId: string) => {
    try {
      await dispatch(unregisterFromEvent(eventId)).unwrap();
      toast.success('Successfully unregistered from event');
    } catch (error) {
      toast.error('Failed to unregister from event');
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = filteredEvents.filter((e: AppEvent) => new Date(e.startAt) >= now).length;
    const registered = myRegisteredEventIds.length;
    const thisMonth = filteredEvents.filter((e: AppEvent) => {
      const eventDate = new Date(e.startAt);
      return eventDate.getMonth() === currentDate.getMonth() && 
             eventDate.getFullYear() === currentDate.getFullYear();
    }).length;
    return { upcoming, registered, thisMonth };
  }, [filteredEvents, myRegisteredEventIds, currentDate]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            {[...Array(3)].map((_, i) => (
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
      className="max-w-6xl mx-auto space-y-6 p-6"
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
            Event Calendar
          </h1>
          <p className="text-gray-600 mt-1">Discover and manage your academic events</p>
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
              <p className="text-sm font-semibold text-blue-700 mb-1">Upcoming Events</p>
              <p className="text-3xl font-bold text-blue-900">{stats.upcoming}</p>
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
              <p className="text-sm font-semibold text-purple-700 mb-1">This Month</p>
              <p className="text-3xl font-bold text-purple-900">{stats.thisMonth}</p>
            </div>
            <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
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

            {/* Type Filter */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <motion.div 
          className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {/* Calendar Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="p-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 text-sm"
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="p-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            {/* Days Header */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {DAYS.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentDate).map(({ date, isCurrentMonth }, index) => {
                const dayEvents = getEventsForDate(date);
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                const isTodayDate = isToday(date);

                return (
                  <motion.div
                    key={index}
                    className={`
                      relative p-2 min-h-[80px] border border-gray-100 rounded-lg cursor-pointer transition-all duration-200
                      ${isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 text-gray-400'}
                      ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                      ${isTodayDate ? 'bg-blue-100 border-blue-300' : ''}
                    `}
                    onClick={() => setSelectedDate(date)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isTodayDate ? 'text-blue-700' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {date.getDate()}
                    </div>
                    
                    {dayEvents.slice(0, 2).map((event: AppEvent, eventIndex: number) => (
                      <div
                        key={event.id}
                        className={`text-xs px-1 py-0.5 rounded mb-1 text-white truncate ${
                          getEventTypeColor(event.type)
                        }`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 font-medium">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Event Details Sidebar */}
        <motion.div 
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedDate ? 
                `Events on ${selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'short', 
                  day: 'numeric' 
                })}` : 
                'Select a date'
              }
            </h3>
          </div>

          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No events on this date</p>
              </div>
            ) : (
              selectedDateEvents.map((event: AppEvent) => {
                const EventIcon = getEventIcon(event.type);
                const ModeIcon = getModeIcon(event.mode);
                const isRegistered = myRegisteredEventIds.includes(event.id);
                const isPastEvent = new Date(event.startAt) < new Date();

                return (
                  <motion.div
                    key={event.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        getEventTypeColor(event.type).replace('bg-', 'bg-').replace('-500', '-100')
                      } text-gray-700`}>
                        <EventIcon className="h-3 w-3" />
                        {event.type}
                      </div>
                      {isRegistered && (
                        <Badge variant="secondary" className="text-xs">
                          Registered
                        </Badge>
                      )}
                    </div>

                    <h4 className="font-semibold text-gray-900 mb-2">{event.title}</h4>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(event.startAt)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <ModeIcon className="h-4 w-4" />
                        <span>{event.mode}</span>
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
                    </div>

                    {!isPastEvent && (
                      <div className="mt-4">
                        <Button
                          size="sm"
                          variant={isRegistered ? "outline" : "default"}
                          onClick={() => isRegistered ? handleUnregister(event.id) : handleRegister(event.id)}
                          className="w-full"
                        >
                          {isRegistered ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Unregister
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Register
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
