'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Plus,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Event as AppEvent } from '@/lib/eventsApi';

interface CalendarToggleProps {
  events: AppEvent[];
  onEventSelect?: (event: AppEvent) => void;
  onCreateEvent?: () => void;
  showCreateButton?: boolean;
  myRegisteredEventIds?: string[];
  onRegister?: (eventId: string) => void;
  onUnregister?: (eventId: string) => void;
}

export default function CalendarToggle({
  events,
  onEventSelect,
  onCreateEvent,
  showCreateButton = false,
  myRegisteredEventIds = [],
  onRegister,
  onUnregister
}: CalendarToggleProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
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

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startAt);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return getEventsForDate(selectedDate);
  }, [selectedDate, events]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
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

  const days = getDaysInMonth(currentDate);
  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <motion.div 
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex">
        {/* Calendar */}
        <div className="flex-1 p-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">{monthYear}</h3>
            </div>
            
            <div className="flex items-center gap-1">
              {showCreateButton && onCreateEvent && (
                <Button
                  onClick={onCreateEvent}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs px-2 py-1"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className="px-2 py-1"
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className="px-2 py-1"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-1 text-center text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="p-1 h-12"></div>;
              }

              const dayEvents = getEventsForDate(day);
              const isSelected = selectedDate?.toDateString() === day.toDateString();
              const isToday = day.toDateString() === new Date().toDateString();

              // Filter events based on user role and registration status
              const relevantEvents = dayEvents.filter(event => {
                if (showCreateButton) {
                  // Faculty view - show all events they created or can manage
                  return true;
                } else {
                  // Student view - show registered events and available events
                  return myRegisteredEventIds.includes(event.id) || true;
                }
              });

              return (
                <motion.div
                  key={day.toISOString()}
                  className={`p-1 h-12 border border-gray-100 rounded-md cursor-pointer transition-all duration-200 overflow-hidden ${
                    isSelected 
                      ? 'bg-blue-100 border-blue-300' 
                      : isToday 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedDate(day)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-xs font-medium text-gray-900 mb-1">
                    {day.getDate()}
                  </div>
                  
                  <div className="space-y-0.5">
                    {relevantEvents.slice(0, 1).map((event, eventIndex) => {
                      const isRegistered = myRegisteredEventIds.includes(event.id);
                      return (
                        <div
                          key={event.id}
                          className={`text-xs px-1 py-0.5 rounded text-white truncate ${
                            isRegistered 
                              ? getEventTypeColor(event.type)
                              : 'bg-gray-400'
                          }`}
                          title={event.title}
                        >
                          {event.title.length > 8 ? event.title.substring(0, 8) + '...' : event.title}
                        </div>
                      );
                    })}
                    {relevantEvents.length > 1 && (
                      <div className="text-xs text-gray-500 font-medium">
                        +{relevantEvents.length - 1}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Event Details Sidebar */}
        <div className="w-64 border-l border-gray-200 bg-gray-50">
          <div className="p-4">
            <h4 className="text-base font-semibold text-gray-900 mb-3">
              {selectedDate ? formatDate(selectedDate) : 'Select a date'}
            </h4>

            <AnimatePresence mode="wait">
              {selectedDate ? (
                <motion.div
                  key={selectedDate.toISOString()}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {selectedDateEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No events on this date</p>
                    </div>
                  ) : (
                    selectedDateEvents.map((event, index) => {
                      const isRegistered = myRegisteredEventIds.includes(event.id);
                      const isPastEvent = new Date(event.startAt) < new Date();

                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.1 }}
                          className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <Badge className={`${getEventTypeColor(event.type)} text-white`}>
                              {event.type}
                            </Badge>
                            {isRegistered && (
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                Registered
                              </Badge>
                            )}
                          </div>

                          <h5 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {event.title}
                          </h5>

                          <div className="space-y-2 mb-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(event.startAt)}</span>
                            </div>
                            
                            {event.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{event.registrationCount || 0} registered</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {!isPastEvent && onRegister && onUnregister && (
                              <Button
                                size="sm"
                                onClick={() => isRegistered ? onUnregister(event.id) : onRegister(event.id)}
                                className={`flex-1 ${
                                  isRegistered 
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200' 
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                                variant={isRegistered ? "outline" : "default"}
                              >
                                {isRegistered ? (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Unregister
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Register
                                  </>
                                )}
                              </Button>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEventSelect?.(event)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Click on a date to view events</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
