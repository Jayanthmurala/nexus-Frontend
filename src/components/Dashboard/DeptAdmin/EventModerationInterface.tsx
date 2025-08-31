'use client';

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  UserCheck,
  Calendar,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Video,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchEvents,
  fetchApprovalFlows,
  moderateEvent,
  selectEvents,
  selectApprovalFlows,
  selectEventsLoading,
  selectEventsError,
  setFilters,
  clearFilters,
} from "@/store/slices/eventsSlice";
import { AppDispatch } from "@/store/store";
import { ModerateEventRequest, ModerationStatus } from "@/lib/eventsApi";
import toast from "react-hot-toast";

// Moderation Action Modal Component
interface ModerationActionModalProps {
  action: {
    eventId: string;
    action: "APPROVE" | "REJECT" | "ASSIGN";
  };
  onConfirm: (data: {
    eventId: string;
    action: "APPROVE" | "REJECT" | "ASSIGN";
    monitorId?: string;
    monitorName?: string;
    rejectionReason?: string;
  }) => void;
  onCancel: () => void;
}

function ModerationActionModal({ action, onConfirm, onCancel }: ModerationActionModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [monitorId, setMonitorId] = useState("");
  const [monitorName, setMonitorName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onConfirm({
      eventId: action.eventId,
      action: action.action,
      monitorId: monitorId || undefined,
      monitorName: monitorName || undefined,
      rejectionReason: rejectionReason || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {action.action === "APPROVE" && "Approve Event"}
          {action.action === "REJECT" && "Reject Event"}
          {action.action === "ASSIGN" && "Assign Monitor"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {action.action === "REJECT" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Please provide a reason for rejection..."
              />
            </div>
          )}

          {action.action === "ASSIGN" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monitor ID *
                </label>
                <input
                  type="text"
                  value={monitorId}
                  onChange={(e) => setMonitorId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter monitor user ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monitor Name *
                </label>
                <input
                  type="text"
                  value={monitorName}
                  onChange={(e) => setMonitorName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter monitor name"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {action.action === "APPROVE" && "Approve"}
              {action.action === "REJECT" && "Reject"}
              {action.action === "ASSIGN" && "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EventModerationInterface() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  
  const events = useSelector(selectEvents);
  const approvalFlows = useSelector(selectApprovalFlows);
  const loading = useSelector(selectEventsLoading);
  const error = useSelector(selectEventsError);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ModerationStatus | "ALL">("PENDING_REVIEW");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [moderationAction, setModerationAction] = useState<{
    eventId: string;
    action: "APPROVE" | "REJECT" | "ASSIGN";
  } | null>(null);

  // Fetch events and approval flows on mount
  useEffect(() => {
    dispatch(fetchEvents({ status: statusFilter === "ALL" ? undefined : statusFilter }));
    dispatch(fetchApprovalFlows());
  }, [dispatch, statusFilter]);

  // Filter events based on search and status
  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.authorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || event.moderationStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle moderation actions
  const handleModerate = async (eventId: string, action: "APPROVE" | "REJECT" | "ASSIGN", data?: any) => {
    try {
      const request: ModerateEventRequest = {
        action,
        ...data,
      };
      
      await dispatch(moderateEvent({ id: eventId, data: request })).unwrap();
      
      toast.success(`Event ${action.toLowerCase()}d successfully`);
      setModerationAction(null);
      
      // Refresh data
      dispatch(fetchEvents({ status: statusFilter === "ALL" ? undefined : statusFilter }));
      dispatch(fetchApprovalFlows());
    } catch (error) {
      toast.error(`Failed to ${action.toLowerCase()} event`);
    }
  };

  // Get stats for overview cards
  const pendingCount = events.filter(e => e.moderationStatus === "PENDING_REVIEW").length;
  const approvedCount = events.filter(e => e.moderationStatus === "APPROVED").length;
  const rejectedCount = events.filter(e => e.moderationStatus === "REJECTED").length;

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">Error loading events</span>
        </div>
        <p className="text-red-700 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Event Moderation</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">Pending Review</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900 mt-2">{pendingCount}</p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">Approved</span>
          </div>
          <p className="text-2xl font-bold text-green-900 mt-2">{approvedCount}</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="font-medium text-red-800">Rejected</span>
          </div>
          <p className="text-2xl font-bold text-red-900 mt-2">{rejectedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ModerationStatus | "ALL")}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ALL">All Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filteredEvents.map((event) => {
          const isExpanded = expandedEvent === event.id;
          const isPending = event.moderationStatus === "PENDING_REVIEW";
          const approvalFlow = approvalFlows[event.id];

          return (
            <div key={event.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      event.moderationStatus === "PENDING_REVIEW" 
                        ? "bg-yellow-100 text-yellow-800"
                        : event.moderationStatus === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {event.moderationStatus.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>By {event.authorName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(event.startAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{event.registrationCount || 0} registered</span>
                    </div>
                    {event.mode === "ONLINE" ? (
                      <div className="flex items-center gap-1">
                        <Video className="h-4 w-4" />
                        <span>Online</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location || "TBD"}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-gray-700 mb-3 line-clamp-2">{event.description}</p>

                  {event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {event.tags.map((tag, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Event Details</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Description</label>
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Start Date</label>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(event.startAt).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">End Date</label>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(event.endAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

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

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Approval Flow</h4>
                      {approvalFlow ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Submitted At</label>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(approvalFlow.submittedAt).toLocaleString()}
                            </p>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-700">Assigned To</label>
                            <p className="text-sm text-gray-600 mt-1">
                              {approvalFlow.assignedToName || "Unassigned"}
                            </p>
                          </div>
                          
                          {approvalFlow.approvedAt && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Approved At</label>
                              <p className="text-sm text-gray-600 mt-1">
                                {new Date(approvalFlow.approvedAt).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">By {approvalFlow.approvedByName}</p>
                            </div>
                          )}
                          
                          {approvalFlow.rejectedAt && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Rejected At</label>
                              <p className="text-sm text-gray-600 mt-1">
                                {new Date(approvalFlow.rejectedAt).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">By {approvalFlow.rejectedByName}</p>
                            </div>
                          )}
                          
                          {approvalFlow.rejectionReason && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Rejection Reason</label>
                              <p className="text-sm text-gray-600 mt-1">{approvalFlow.rejectionReason}</p>
                            </div>
                          )}
                          
                          {approvalFlow.isEscalated && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Escalated</label>
                              <p className="text-sm text-gray-600 mt-1">
                                {approvalFlow.escalatedAt ? new Date(approvalFlow.escalatedAt).toLocaleString() : "Yes"}
                              </p>
                              {approvalFlow.escalatedToName && (
                                <p className="text-xs text-gray-500">To {approvalFlow.escalatedToName}</p>
                              )}
                            </div>
                          )}

                          {approvalFlow.mentorAssigned && (
                            <div>
                              <label className="text-sm font-medium text-gray-700">Assigned Mentor</label>
                              <p className="text-sm text-gray-600 mt-1">{approvalFlow.mentorName}</p>
                            </div>
                          )}

                          {/* Moderation Actions */}
                          {isPending && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                              <h4 className="font-medium text-gray-900 mb-3">Moderation Actions</h4>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleModerate(event.id, "APPROVE")}
                                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Approve
                                </button>
                                
                                <button
                                  onClick={() => setModerationAction({
                                    eventId: event.id,
                                    action: "REJECT",
                                  })}
                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Reject
                                </button>
                                
                                <button
                                  onClick={() => setModerationAction({
                                    eventId: event.id,
                                    action: "ASSIGN",
                                  })}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                  <UserCheck className="h-4 w-4" />
                                  Assign Monitor
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">No approval flow data available</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {!loading && filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600">No events match your current filters</p>
        </div>
      )}

      {/* Moderation Action Modal */}
      {moderationAction && (
        <ModerationActionModal
          action={moderationAction}
          onConfirm={(data: any) => handleModerate(data.eventId, data.action, data)}
          onCancel={() => setModerationAction(null)}
        />
      )}
    </div>
  );
}
