"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
  User,
  FileText,
  MessageSquare,
  Search,
  Filter,
  TrendingUp,
  ExternalLink,
  Eye,
  MoreHorizontal,
  Download,
  RefreshCw,
  AlertCircle,
  Zap,
  MapPin,
  Users,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function ApplicationTracker() {
  const { user } = useAuth();
  const { applications, projects } = useData();
  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  
  // Accessibility: Respect user's motion preferences
  const prefersReducedMotion = useReducedMotion();
  
  // Animation variants that respect reduced motion preferences
  const cardVariants = {
    hidden: { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: prefersReducedMotion ? 0 : 0.3 } },
    exit: { opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : -20, transition: { duration: prefersReducedMotion ? 0 : 0.2 } }
  };

  const myApplications = applications.filter((app) => app.studentId === user?.id);

  // Simulate loading for applications
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setApplicationsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const filteredApplications = useMemo(() => {
    let filtered = myApplications.filter((app) => {
      const project = projects.find((p) => p.id === app.projectId);
      const matchesSearch = project?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project?.facultyName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      const matchesTab = activeTab === "all" || app.status === activeTab;
      return matchesSearch && matchesStatus && matchesTab;
    });
    return filtered.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  }, [myApplications, projects, searchTerm, statusFilter, activeTab]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "accepted":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const stats = [
    {
      name: "Total Applications",
      value: myApplications.length,
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      name: "Pending Review",
      value: myApplications.filter((app) => app.status === "pending").length,
      icon: Clock,
      color: "bg-yellow-500",
    },
    {
      name: "Accepted",
      value: myApplications.filter((app) => app.status === "accepted").length,
      icon: CheckCircle,
      color: "bg-green-500",
    },
    {
      name: "Rejected",
      value: myApplications.filter((app) => app.status === "rejected").length,
      icon: XCircle,
      color: "bg-red-500",
    },
  ];

  const applicationsByStatus = useMemo(() => {
    return {
      pending: myApplications.filter(app => app.status === "pending"),
      accepted: myApplications.filter(app => app.status === "accepted"),
      rejected: myApplications.filter(app => app.status === "rejected")
    };
  }, [myApplications]);

  const successRate = myApplications.length > 0 
    ? Math.round((applicationsByStatus.accepted.length / myApplications.length) * 100)
    : 0;

  // Loading skeleton component
  const ApplicationSkeleton = () => (
    <Card className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start space-x-4 flex-1">
            <Skeleton className="w-14 h-14 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-24 rounded-xl" />
            <Skeleton className="h-8 w-20 rounded-xl" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <motion.div 
        className="space-y-8 p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <Skeleton className="h-10 w-80 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-4">
            <Skeleton className="h-8 w-32 rounded-xl" />
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="w-12 h-12 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filters Skeleton */}
        <Card className="bg-white rounded-2xl shadow-lg border border-gray-200">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <Skeleton className="flex-1 h-12 rounded-xl" />
              <div className="flex gap-3">
                <Skeleton className="h-12 w-32 rounded-xl" />
                <Skeleton className="h-12 w-28 rounded-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications List Skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <ApplicationSkeleton key={i} />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-8 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Applications
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Track your project applications and their status
          </p>
        </div>
        <motion.div 
          className="mt-4 sm:mt-0 flex items-center space-x-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.span 
            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {filteredApplications.length} applications
          </motion.span>
        </motion.div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                      <div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
                      {i === 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                          <div className="h-1 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          stats.map((stat) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      {stat.name === "Total Applications" && myApplications.length > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {successRate}% success rate
                          </div>
                          <Progress value={successRate} className="mt-1 h-1" />
                        </div>
                      )}
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Enhanced Search and Filters */}
      <motion.div 
        className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {loading ? (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="flex gap-3">
              <div className="h-12 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects, faculty, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm placeholder-gray-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-4 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-medium"
              >
                <option value="all">📋 All Status</option>
                <option value="pending">⏳ Pending</option>
                <option value="accepted">✅ Accepted</option>
                <option value="rejected">❌ Rejected</option>
              </select>
            </div>
          </div>
        )}
      </motion.div>

      {/* Tabbed Applications View */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            All ({myApplications.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending ({applicationsByStatus.pending.length})
          </TabsTrigger>
          <TabsTrigger value="accepted" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Accepted ({applicationsByStatus.accepted.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Rejected ({applicationsByStatus.rejected.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">

          {/* Applications List */}
          {applicationsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="w-12 h-12 bg-gray-200 rounded-2xl animate-pulse"></div>
                          <div className="flex-1 space-y-3">
                            <div className="h-6 bg-gray-200 rounded-lg animate-pulse w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                            <div className="flex gap-2">
                              <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                              <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                            </div>
                            <div className="flex gap-2">
                              <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                              <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                              <div className="h-5 w-18 bg-gray-200 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="h-8 w-24 bg-gray-200 rounded-xl animate-pulse"></div>
                          <div className="h-8 w-20 bg-gray-200 rounded-xl animate-pulse"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : filteredApplications.length > 0 ? (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredApplications.map((application) => {
                  const project = projects.find((p) => p.id === application.projectId);
                  if (!project) return null;

                  return (
                    <motion.div
                      key={application.id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout={!prefersReducedMotion}
                    >
                          <Card className="group hover:shadow-lg hover:border-blue-200 transition-all duration-300 border-l-4 border-l-blue-500">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-start space-x-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      {project.title}
                                    </h3>
                                    <Badge variant="outline" className="text-xs">
                                      {project.projectType || 'Project'}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex items-center text-gray-600 text-sm mb-2">
                                    <User className="w-4 h-4 mr-1" />
                                    <span className="font-medium">{project.facultyName}</span>
                                  </div>
                                  
                                  {/* Faculty's actual department */}
                                  {/* {project.authorDepartment && (
                                    <div className="flex items-center gap-1 mb-2">
                                      <Users className="w-3 h-3 text-purple-500" />
                                      <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                                        Faculty: {project.authorDepartment}
                                      </span>
                                    </div>
                                  )} */}
                                  
                                  {/* Project applicable departments */}
                                  {project.departments && project.departments.length > 0 && (
                                    <div className="flex items-center gap-1 mb-2">
                                      <MapPin className="w-3 h-3 text-blue-500" />
                                      <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                        Open to: {project.departments.join(', ')}
                                      </span>
                                    </div>
                                  )}
                                  
                                  <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                                    {project.description}
                                  </p>

                                  {/* Skills */}
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {project.skills.slice(0, 3).map((skill: string) => (
                                      <Badge key={skill} variant="secondary" className="text-xs">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {project.skills.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{project.skills.length - 3} more
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="flex items-center text-gray-500 text-sm">
                                    <CalendarIcon className="w-4 h-4 mr-1" />
                                    Applied {new Date(application.appliedAt).toLocaleDateString()}
                                  </div>
                                </div>

                                <div className="text-right space-y-2">
                                  <div className="flex items-center justify-end">
                                    {getStatusIcon(application.status)}
                                    <Badge 
                                      variant={application.status === 'accepted' ? 'default' : 
                                              application.status === 'pending' ? 'secondary' : 'destructive'}
                                      className="ml-2"
                                    >
                                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                    </Badge>
                                  </div>

                                  {application.status === "pending" && (
                                    <Button variant="outline" size="sm" className="w-full hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors duration-200">
                                      <Clock className="w-4 h-4 mr-1" />
                                      Withdraw Application
                                    </Button>
                                  )}
                                  {application.status === "accepted" && (
                                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 hover:scale-105 transition-transform duration-200">
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      View Project Details
                                    </Button>
                                  )}
                                  {application.status === "rejected" && (
                                    <Button variant="outline" size="sm" className="w-full hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors duration-200">
                                      <Eye className="w-4 h-4 mr-1" />
                                      View Feedback
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {application.message && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                  <h4 className="font-medium text-gray-900 text-sm mb-2 flex items-center">
                                    <MessageSquare className="w-4 h-4 mr-1" />
                                    Your Application Message
                                  </h4>
                                  <p className="text-gray-700 text-sm leading-relaxed">{application.message}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-12">
              <Card>
                <CardContent className="p-12">
                  {myApplications.length === 0 ? (
                    <>
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Start exploring the project marketplace to find opportunities that match your interests and skills.
                      </p>
                      <Button asChild>
                        <Link href="/student/marketplace">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Browse Projects
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
                      <p className="text-gray-600 mb-4">
                        Try adjusting your search criteria or filters.
                      </p>
                      <Button variant="outline" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Clear Filters
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
