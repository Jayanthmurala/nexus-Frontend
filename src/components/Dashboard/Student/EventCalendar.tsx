"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  Clock,
  Search,
  XCircle,
  BookOpen,
  Trophy,
  Share2,
  CalendarCheck2,
  History,
  SlidersHorizontal,
  Video,
  ExternalLink,
  Copy,
  BookmarkCheck,
} from "lucide-react";
import { useData, Event as NexusEvent } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

export default function EventCalendar() {
  const { events, eventRegistrations, registerForEvent, unregisterFromEvent } = useData();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<NexusEvent | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "mine">("upcoming");

  const eventTypes = ["all", "workshop", "seminar", "competition", "networking"];
  const departments = useMemo(
    () => [
      "all",
      ...Array.from(new Set(events.map((e) => e.department).filter(Boolean))),
    ],
    [events]
  );
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === "all" || event.type === selectedType;
      const matchesDepartment =
        selectedDepartment === "all" || event.department === selectedDepartment;
      return matchesSearch && matchesType && matchesDepartment;
    });
  }, [events, searchTerm, selectedType, selectedDepartment]);

  // Registration state for current user
  const myRegisteredEventIds = useMemo(
    () => (user ? eventRegistrations.filter((r) => r.studentId === user.id).map((r) => r.eventId) : []),
    [eventRegistrations, user]
  );
  const isRegisteredOn = (event: NexusEvent) => myRegisteredEventIds.includes(event.id);

  const upcomingEvents = filteredEvents.filter((e) => e.date >= new Date());
  const pastEvents = filteredEvents.filter((e) => e.date < new Date());
  const myEvents = useMemo(
    () => filteredEvents.filter((e) => myRegisteredEventIds.includes(e.id)),
    [filteredEvents, myRegisteredEventIds]
  );

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "workshop":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "seminar":
        return "bg-green-100 text-green-800 border-green-200";
      case "competition":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "networking":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "workshop":
        return BookOpen;
      case "seminar":
        return Users;
      case "competition":
        return Trophy;
      case "networking":
        return Share2;
      default:
        return CalendarIcon;
    }
  };

  const isEventFull = (event: NexusEvent) => event.registered >= event.capacity;
  const canJoinOnline = (event: NexusEvent) =>
    !!event.joinUrl && (event.mode === "online" || event.mode === "hybrid");

  // Time-gating: show Join within a window before and shortly after the start time
  const JOIN_WINDOW_BEFORE_MIN = 15; // minutes before start
  const JOIN_WINDOW_AFTER_MIN = 120; // minutes after start (no explicit end time available)
  const [nowTs, setNowTs] = useState<number>(Date.now());
  const isWithinJoinWindow = (event: NexusEvent) => {
    const start = event.date.getTime();
    return (
      nowTs >= start - JOIN_WINDOW_BEFORE_MIN * 60 * 1000 &&
      nowTs <= start + JOIN_WINDOW_AFTER_MIN * 60 * 1000
    );
  };

  // Periodically update current time so time-gated UI (Join button/countdown) updates automatically
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 30000); // 30s
    return () => clearInterval(id);
  }, []);

  // Keep modal selectedEvent in sync with latest events data (counts/fields may update after register/unregister)
  useEffect(() => {
    if (selectedEvent) {
      const latest = events.find((e) => e.id === selectedEvent.id);
      if (latest) setSelectedEvent(latest);
    }
  }, [events]);

  // Register/unregister handlers
  const [regBusyId, setRegBusyId] = useState<string | null>(null);
  const handleRegister = (event: NexusEvent, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user) {
      toast.error("Please log in as a student to register");
      return;
    }
    if (isEventFull(event)) {
      toast.error("Event is full");
      return;
    }
    if (isRegisteredOn(event)) {
      toast("Already registered");
      return;
    }
    setRegBusyId(event.id);
    try {
      registerForEvent(event.id, user.id);
      toast.success("Registered for event");
    } finally {
      setRegBusyId(null);
    }
  };
  const handleUnregister = (event: NexusEvent, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user || !isRegisteredOn(event)) return;
    setRegBusyId(event.id);
    try {
      unregisterFromEvent(event.id, user.id);
      toast.success("Unregistered from event");
    } finally {
      setRegBusyId(null);
    }
  };

  const handleCopyJoinLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Join link copied");
    } catch (e) {
      toast.error("Failed to copy link");
    }
  };

  const openRegistrationModal = (event: NexusEvent) => {
    setSelectedEvent(event);
    setShowRegistrationModal(true);
  };

  const getRegistrationProgress = (event: NexusEvent) => {
    return (event.registered / event.capacity) * 100;
  };

  const EventCard = ({ event, isPast = false }: { event: NexusEvent; isPast?: boolean }) => {
    const EventIcon = getEventIcon(event.type);
    const progress = getRegistrationProgress(event);

    // Date parts and type-based accent for left column
    const dateObj = event.date;
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString("en-US", { month: "short" });
    const weekday = dateObj.toLocaleString("en-US", { weekday: "short" });
    const timeStr = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const typeSolid =
      event.type === "workshop"
        ? "bg-blue-100 text-blue-700"
        : event.type === "seminar"
        ? "bg-green-100 text-green-700"
        : event.type === "competition"
        ? "bg-orange-100 text-orange-700"
        : "bg-purple-100 text-purple-700";

    return (
      <div
        className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 ${
          isPast ? "opacity-75" : ""
        } cursor-pointer`}
        onClick={() => !isPast && openRegistrationModal(event)}
      >
        <div className="p-4 sm:p-5 md:p-6">
          <div className="grid grid-cols-12 gap-4 sm:gap-5 items-center">
            {/* Left accent + icon/date */}
            <div className="col-span-12 sm:col-span-3 md:col-span-2">
              <div className="flex sm:block items-center gap-3">
                <div className={`relative w-12 h-12 rounded-xl ${typeSolid} flex items-center justify-center shadow-sm`}>
                  <EventIcon className="w-5 h-5" />
                </div>
                <div className="hidden sm:flex sm:flex-col sm:items-start">
                  <div className="text-xs uppercase tracking-wide text-gray-500">{weekday}</div>
                  <div className="text-2xl font-extrabold leading-none text-gray-900">{day}</div>
                  <div className="text-xs text-gray-500">{month} • {timeStr}</div>
                </div>
                <div className="sm:hidden ml-2">
                  <div className="text-xs text-gray-500">{weekday}, {month} {day}</div>
                  <div className="text-xs text-gray-500">{timeStr}</div>
                </div>
              </div>
            </div>

            {/* Middle: details */}
            <div className="col-span-12 sm:col-span-6 md:col-span-7">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${getEventTypeColor(event.type)}`}>
                  {event.type}
                </span>
                {event.department !== "All Departments" && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-medium border bg-gray-50 text-gray-700 border-gray-200">
                    {event.department}
                  </span>
                )}
                {event.mode && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-medium border bg-indigo-50 text-indigo-700 border-indigo-200">
                    {event.mode === 'online' ? 'Online' : event.mode === 'hybrid' ? 'Hybrid' : 'In-person'}
                  </span>
                )}
                {isEventFull(event) && (
                  <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[11px] rounded-full font-medium">Full</span>
                )}
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-1">{event.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-2 line-clamp-2">{event.description}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-gray-600 text-sm">
                <div className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  <span>
                    {event.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} • {timeStr}
                  </span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="font-medium">{event.location}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{event.registered}/{event.capacity} attendees</span>
                </div>
              </div>
            </div>

            {/* Right: progress + actions */}
            <div className="col-span-12 sm:col-span-3 md:col-span-3 flex flex-col justify-center sm:justify-between gap-3">
              <div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      progress >= 90 ? "bg-red-500" : progress >= 70 ? "bg-yellow-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
                <div className="mt-1 text-xs text-gray-500 text-right">{Math.round(progress)}% full</div>
              </div>
              {!isPast ? (
                <div className="flex flex-col gap-2">
                  {canJoinOnline(event) && isWithinJoinWindow(event) && (
                    <a
                      href={event.joinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-2 font-medium text-sm rounded-lg transition-colors hover:-translate-y-0.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Video className="w-4 h-4" /> Join
                      <ExternalLink className="w-4 h-4 opacity-80" />
                    </a>
                  )}
                  {isRegisteredOn(event) ? (
                    <button
                      type="button"
                      onClick={(e) => handleUnregister(event, e)}
                      disabled={regBusyId === event.id}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-2 font-medium text-sm rounded-lg transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <XCircle className="w-4 h-4" /> Unregister
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleRegister(event, e)}
                      disabled={isEventFull(event) || regBusyId === event.id || !user}
                      className={`w-full inline-flex items-center justify-center gap-2 px-5 py-2 font-medium text-sm rounded-lg transition-colors ${
                        isEventFull(event) ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      <CalendarCheck2 className="w-4 h-4" /> Register
                    </button>
                  )}
                </div>
              ) : (
                <span className="w-full text-center px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">Completed</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Modern Header with Tabs */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600">Discover workshops, seminars, competitions, and networking opportunities.</p>
        </div>
        <div className="hidden md:flex bg-white/70 backdrop-blur rounded-lg p-1 border border-gray-200">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${
              activeTab === "upcoming" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <CalendarCheck2 className="w-4 h-4" /> Upcoming
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${
              activeTab === "past" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <History className="w-4 h-4" /> Past
          </button>
          <button
            onClick={() => setActiveTab("mine")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${
              activeTab === "mine" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <BookmarkCheck className="w-4 h-4" /> My Registrations
          </button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="md:hidden flex justify-end">
        <div className="bg-white/70 backdrop-blur rounded-lg p-1 border border-gray-200 inline-flex">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
              activeTab === "upcoming" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <CalendarCheck2 className="w-4 h-4" /> Upcoming
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
              activeTab === "past" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <History className="w-4 h-4" /> Past
          </button>
          <button
            onClick={() => setActiveTab("mine")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm ${
              activeTab === "mine" ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <BookmarkCheck className="w-4 h-4" /> Mine
          </button>
        </div>
      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 md:-mx-8 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="px-4 sm:px-6 md:px-8 py-3 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden md:inline-flex items-center text-xs text-gray-500 mr-1">
              <SlidersHorizontal className="w-4 h-4 mr-1" /> Type
            </span>
            {eventTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedType === type
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <div className="min-w-[180px]">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full py-2.5 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === "all" ? "All Departments" : dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Read-only: no registrations summary */}

      {/* Timeline List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            {activeTab === "upcoming"
              ? "Upcoming Events"
              : activeTab === "past"
              ? "Past Events"
              : "My Registrations"}
          </h2>
          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
            {(activeTab === "upcoming"
              ? upcomingEvents
              : activeTab === "past"
              ? pastEvents
              : myEvents
            ).length} events
          </span>
        </div>

        {(activeTab === "upcoming" ? upcomingEvents : activeTab === "past" ? pastEvents : myEvents).length > 0 ? (
          <div className="relative">
            <div className="hidden sm:block absolute left-3 top-0 bottom-0 w-px bg-gray-200" />
            <div className="space-y-4">
              {(activeTab === "upcoming" ? upcomingEvents : activeTab === "past" ? pastEvents : myEvents).map((event) => (
                <div key={event.id} className="grid grid-cols-[24px_1fr] gap-3 items-start">
                  <div className="relative flex justify-center">
                    <div className="hidden sm:block w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-100 mt-6" />
                  </div>
                  <EventCard event={event} isPast={event.date < new Date()} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === "upcoming" ? "No upcoming events" : activeTab === "past" ? "No past events" : "No registrations found"}
            </h3>
            <p className="text-gray-600">Try adjusting search or filters.</p>
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {showRegistrationModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Event Details</h2>
                <button
                  onClick={() => setShowRegistrationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${getEventTypeColor(
                        selectedEvent.type
                      )}`}
                    >
                      {selectedEvent.type.toUpperCase()}
                    </span>
                    {selectedEvent.department !== "All Departments" && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                        {selectedEvent.department}
                      </span>
                    )}
                    {selectedEvent.mode && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium border bg-indigo-50 text-indigo-700 border-indigo-200">
                        {selectedEvent.mode === 'online' ? 'Online' : selectedEvent.mode === 'hybrid' ? 'Hybrid' : 'In-person'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{selectedEvent.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{selectedEvent.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 rounded-xl p-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <CalendarIcon className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <div className="font-medium text-gray-900">Date & Time</div>
                        <div className="text-gray-600">
                          {selectedEvent.date.toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                        <div className="text-gray-600">
                          {selectedEvent.date.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <div className="font-medium text-gray-900">Location</div>
                        <div className="text-gray-600">{selectedEvent.location}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Users className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <div className="font-medium text-gray-900">Capacity</div>
                        <div className="text-gray-600">
                          {selectedEvent.registered}/{selectedEvent.capacity} attendees
                        </div>
                        {isEventFull(selectedEvent) && (
                          <div className="text-red-600 text-sm font-medium">Event is full</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <div className="font-medium text-gray-900">Organizer</div>
                        <div className="text-gray-600">{selectedEvent.organizer}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Registration actions are provided in the footer */}

                <div className="flex items-center justify-between flex-wrap gap-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    {canJoinOnline(selectedEvent) && (
                      isWithinJoinWindow(selectedEvent) ? (
                        <>
                          <a
                            href={selectedEvent.joinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 font-medium text-sm rounded-lg transition-colors bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Video className="w-4 h-4" /> Join
                            <ExternalLink className="w-4 h-4 opacity-80" />
                          </a>
                          {selectedEvent.joinUrl && (
                            <button
                              type="button"
                              onClick={() => handleCopyJoinLink(selectedEvent.joinUrl!)}
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                              <Copy className="w-4 h-4" /> Copy link
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-sm text-gray-600">
                            Join available {Math.ceil((selectedEvent.date.getTime() - nowTs) / 60000)}m before start
                          </span>
                          {selectedEvent.joinUrl && (
                            <button
                              type="button"
                              onClick={() => handleCopyJoinLink(selectedEvent.joinUrl!)}
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                              <Copy className="w-4 h-4" /> Copy link
                            </button>
                          )}
                        </>
                      )
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {isRegisteredOn(selectedEvent) ? (
                      <button
                        type="button"
                        onClick={() => handleUnregister(selectedEvent)}
                        disabled={regBusyId === selectedEvent.id || selectedEvent.date < new Date()}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <XCircle className="w-4 h-4 inline mr-2" /> Unregister
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRegister(selectedEvent)}
                        disabled={isEventFull(selectedEvent) || regBusyId === selectedEvent.id || !user || selectedEvent.date < new Date()}
                        className={`px-6 py-2 rounded-lg transition-colors ${
                          isEventFull(selectedEvent) ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        <CalendarCheck2 className="w-4 h-4 inline mr-2" /> Register
                      </button>
                    )}
                    <button
                      onClick={() => setShowRegistrationModal(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
