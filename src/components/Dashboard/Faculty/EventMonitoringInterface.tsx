"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Search,
  Eye,
  Download,
  Filter,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Video,
  BarChart3,
  FileText,
  ExternalLink,
  Sparkles,
  Activity,
  Target,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchEvents,
  fetchMyEvents,
  exportEventRegistrations,
  selectEvents,
  selectMyEvents,
  selectEventsLoading,
  selectEventsError,
  selectEventsPagination,
} from "@/store/slices/eventsSlice";
import { AppDispatch } from "@/store/store";
import toast from "react-hot-toast";

export default function EventMonitoringInterface() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  
  const events = useSelector(selectEvents);
  const myEvents = useSelector(selectMyEvents);
  const loading = useSelector(selectEventsLoading);
  const error = useSelector(selectEventsError);
  const pagination = useSelector(selectEventsPagination);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"all" | "authored" | "monitoring">("all");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  // Fetch events on mount
  useEffect(() => {
    dispatch(fetchEvents({ page: 1, limit: 50 }));
    dispatch(fetchMyEvents());
  }, [dispatch]);

  // Filter events based on search, status, and view mode
  const filteredEvents = (() => {
    let eventList = events;
    
    if (viewMode === "authored") {
      eventList = myEvents.filter(e => e.authorId === user?.id);
    } else if (viewMode === "monitoring") {
      eventList = events.filter(e => e.monitorId === user?.id);
    }
    
    return eventList.filter((event) => {
      const matchesSearch = 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.authorName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || event.moderationStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  })();

  const handleExportRegistrations = async (eventId: string, eventTitle: string) => {
    try {
      const result = await dispatch(exportEventRegistrations(eventId)).unwrap();
      
      // Create download link
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported registrations for ${eventTitle}`);
    } catch (error) {
      toast.error("Failed to export registrations");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING_REVIEW":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING_REVIEW":
        return AlertCircle;
      case "APPROVED":
        return CheckCircle;
      case "REJECTED":
        return XCircle;
      default:
        return Clock;
    }
  };

  // Calculate stats
  const totalEvents = filteredEvents.length;
  const totalRegistrations = filteredEvents.reduce((sum, event) => sum + (event.registrationCount ?? 0), 0);
  const averageRegistrations = totalEvents > 0 ? Math.round(totalRegistrations / totalEvents) : 0;
  const upcomingEvents = filteredEvents.filter(e => new Date(e.startAt) >= new Date()).length;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4 }
    },
    hover: {
      scale: 1.02,
      y: -4,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-indigo-600/20 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 30, 0],
            scale: [1.1, 1, 1.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Animated Header */}
        <motion.div className="mb-8" variants={itemVariants}>
          <motion.div 
            className="flex items-center gap-4 mb-4"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 rounded-2xl shadow-lg"
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <BarChart3 className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <motion.h1 
                className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                📊 Event Analytics Hub
              </motion.h1>
              <motion.p 
                className="text-gray-600 mt-2 text-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                🚀 Monitor, analyze, and optimize your events
              </motion.p>
            </div>
          </motion.div>
          
          {/* Animated Stats Overview */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {[
              {
                icon: Calendar,
                value: totalEvents,
                label: "Total Events",
                color: "from-blue-500 to-cyan-500",
                bgColor: "from-blue-50 to-cyan-50",
                emoji: "📅"
              },
              {
                icon: Users,
                value: totalRegistrations,
                label: "Total Registrations",
                color: "from-emerald-500 to-teal-500",
                bgColor: "from-emerald-50 to-teal-50",
                emoji: "👥"
              },
              {
                icon: TrendingUp,
                value: averageRegistrations,
                label: "Avg. Registrations",
                color: "from-purple-500 to-indigo-500",
                bgColor: "from-purple-50 to-indigo-50",
                emoji: "📈"
              },
              {
                icon: Clock,
                value: upcomingEvents,
                label: "Upcoming Events",
                color: "from-orange-500 to-red-500",
                bgColor: "from-orange-50 to-red-50",
                emoji: "⏰"
              }
            ].map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <motion.div
                  key={index}
                  className={`bg-gradient-to-br ${stat.bgColor} backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/20 relative overflow-hidden group`}
                  variants={cardVariants}
                  whileHover="hover"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <motion.div
                        className={`bg-gradient-to-br ${stat.color} p-3 rounded-2xl shadow-lg`}
                        whileHover={{ rotate: 10, scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <IconComponent className="h-6 w-6 text-white" />
                      </motion.div>
                      <motion.span 
                        className="text-2xl"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {stat.emoji}
                      </motion.span>
                    </div>
                    <motion.p 
                      className="text-3xl font-bold text-gray-900 mb-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 200 }}
                    >
                      {stat.value}
                    </motion.p>
                    <p className="text-gray-600 font-medium">{stat.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Animated View Mode Tabs */}
        <motion.div 
          className="flex space-x-2 mb-8 bg-white/80 backdrop-blur-sm p-2 rounded-3xl shadow-xl border border-white/20 w-fit"
          variants={itemVariants}
        >
          {[
            { key: "all", label: "All Events", count: events.length, emoji: "🌟", icon: Activity },
            { key: "authored", label: "My Events", count: myEvents.filter(e => e.authorId === user?.id).length, emoji: "✍️", icon: FileText },
            { key: "monitoring", label: "Monitoring", count: events.filter(e => e.monitorId === user?.id).length, emoji: "👁️", icon: Eye },
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <motion.button
                key={tab.key}
                onClick={() => setViewMode(tab.key as any)}
                className={`relative px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  viewMode === tab.key
                    ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                layout
              >
                {viewMode === tab.key && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl"
                    layoutId="activeTab"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: viewMode === tab.key ? [0, 10, -10, 0] : 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {tab.emoji}
                  </motion.span>
                  <IconComponent className="h-4 w-4" />
                  <span>{tab.label}</span>
                  <motion.span 
                    className={`px-2 py-1 rounded-full text-xs font-bold ${
                      viewMode === tab.key 
                        ? "bg-white/20 text-white" 
                        : "bg-gray-100 text-gray-600"
                    }`}
                    whileHover={{ scale: 1.1 }}
                  >
                    {tab.count}
                  </motion.span>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Enhanced Search and Filters */}
        <motion.div 
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 mb-8 border border-white/20"
          variants={itemVariants}
        >
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative group">
              <motion.div
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Search className="h-5 w-5" />
              </motion.div>
              <motion.input
                type="text"
                placeholder="🔍 Search events, authors, and more..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/90 backdrop-blur-sm text-lg font-medium placeholder-gray-500 shadow-lg"
                whileFocus={{ scale: 1.02 }}
              />
            </div>
            
            <motion.select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-6 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/90 backdrop-blur-sm text-lg font-medium shadow-lg min-w-[200px]"
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02 }}
            >
              <option value="all">📊 All Status</option>
              <option value="PENDING_REVIEW">⏳ Pending Review</option>
              <option value="APPROVED">✅ Approved</option>
              <option value="REJECTED">❌ Rejected</option>
            </motion.select>

            <motion.button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="px-6 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 font-medium shadow-lg flex items-center gap-2"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="h-5 w-5" />
              🧹 Clear Filters
            </motion.button>
          </div>
        </motion.div>

        {/* Events Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registrations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map((event) => {
                  const StatusIcon = getStatusIcon(event.moderationStatus);
                  const isUpcoming = new Date(event.startAt) >= new Date();
                  
                  return (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              {event.mode === "ONLINE" && <Video className="h-3 w-3" />}
                              {event.mode === "ONSITE" && <MapPin className="h-3 w-3" />}
                              {event.mode === "HYBRID" && (
                                <>
                                  <Video className="h-2 w-2" />
                                  <MapPin className="h-2 w-2" />
                                </>
                              )}
                              <span className="capitalize">{event.mode.toLowerCase()}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{event.type}</p>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{event.authorName}</div>
                        <div className="text-xs text-gray-500">{event.authorRole}</div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(event.startAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(event.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {event.registrationCount ?? 0}
                          {event.capacity && ` / ${event.capacity}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {event.capacity && (
                            `${Math.round(((event.registrationCount ?? 0) / event.capacity) * 100)}% full`
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(event.moderationStatus)}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {event.moderationStatus.replace("_", " ")}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {(event.authorId === user?.id || event.monitorId === user?.id) && 
                           event.moderationStatus === "APPROVED" && (
                            <button
                              onClick={() => handleExportRegistrations(event.id, event.title)}
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Export registrations"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Event Details Panel */}
        {selectedEvent && (() => {
          const event = filteredEvents.find(e => e.id === selectedEvent);
          if (!event) return null;

          return (
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Title</label>
                      <p className="text-sm text-gray-900 mt-1">{event.title}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Type</label>
                        <p className="text-sm text-gray-900 mt-1">{event.type}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Mode</label>
                        <p className="text-sm text-gray-900 mt-1 capitalize">{event.mode.toLowerCase()}</p>
                      </div>
                    </div>

                    {event.location && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Location</label>
                        <p className="text-sm text-gray-900 mt-1">{event.location}</p>
                      </div>
                    )}

                    {event.meetingUrl && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Meeting URL</label>
                        <a 
                          href={event.meetingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 mt-1 flex items-center gap-1"
                        >
                          {event.meetingUrl}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Registration & Analytics */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Registration Analytics</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Registered</label>
                        <p className="text-sm text-gray-900 mt-1">{event.registrationCount ?? 0}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Capacity</label>
                        <p className="text-sm text-gray-900 mt-1">{event.capacity || "Unlimited"}</p>
                      </div>
                    </div>
                    
                    {event.capacity && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Fill Rate</label>
                        <div className="mt-2">
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: `${Math.min(100, ((event.registrationCount ?? 0) / event.capacity) * 100)}%` 
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {Math.round(((event.registrationCount ?? 0) / event.capacity) * 100)}% full
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Created</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {new Date(event.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Updated</label>
                        <p className="text-sm text-gray-900 mt-1">
                          {new Date(event.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {event.departments.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Departments</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {event.departments.map((dept, index) => (
                            <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                              {dept}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {event.tags.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Tags</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {event.tags.map((tag, index) => (
                            <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Enhanced Empty State */}
        {!loading && filteredEvents.length === 0 && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="bg-gradient-to-br from-purple-100 to-indigo-100 p-8 rounded-full w-32 h-32 mx-auto mb-6 flex items-center justify-center"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <BarChart3 className="h-16 w-16 text-purple-600" />
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">📭 No events found</h3>
            <p className="text-gray-600 text-lg mb-6">No events match your current filters</p>
            <motion.button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-2xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 font-medium shadow-lg flex items-center gap-2 mx-auto"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="h-5 w-5" />
              🧹 Clear All Filters
            </motion.button>
          </motion.div>
        )}

        {/* Enhanced Loading State */}
        {loading && (
          <motion.div 
            className="flex flex-col justify-center items-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="relative">
              <motion.div
                className="w-16 h-16 border-4 border-purple-200 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-0 w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <motion.p 
              className="text-gray-600 mt-6 text-lg font-medium"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⚡ Loading amazing events...
            </motion.p>
          </motion.div>
        )}

        {/* Enhanced Error State */}
        {error && (
          <motion.div 
            className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-3xl p-8 mb-8 shadow-xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-4 text-red-800 mb-4">
              <motion.div
                className="bg-red-100 p-3 rounded-2xl"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <XCircle className="h-6 w-6 text-red-600" />
              </motion.div>
              <div>
                <span className="font-bold text-xl">❌ Error loading events</span>
                <p className="text-red-700 mt-2 text-lg">{error}</p>
              </div>
            </div>
            <motion.button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-2xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 font-medium shadow-lg flex items-center gap-2"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Target className="h-5 w-5" />
              🔄 Retry
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
