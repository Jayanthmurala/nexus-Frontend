"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Search,
  Filter,
  Clock,
  Users,
  BookOpen,
  Calendar as CalendarIcon,
  Heart,
  MapPin,
  Star,
  TrendingUp,
  Zap,
  CheckCircle,
  Award,
  Eye,
} from "lucide-react";
import { projectsApi, Project, Application } from '@/lib/projectsApi';
import { useAuth } from "@/contexts/AuthContext";
import ApplicationModal from "@/components/Dashboard/Student/ApplicationModal";
import { useWebSocket, ProjectUpdateEvent } from "@/lib/websocket";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function ProjectMarketplace() {
  const { user } = useAuth();
  const { connect, disconnect, onProjectUpdate, offProjectUpdate } = useWebSocket();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedSkill, setSelectedSkill] = useState("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savedProjects, setSavedProjects] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'newest' | 'deadline' | 'popular'>('newest');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await projectsApi.listProjects({ limit: 50 });
        setProjects(response.projects.filter(p => p.progressStatus === 'OPEN'));
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        toast.error('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (user) {
      connect();

      const handleProjectUpdate = (event: ProjectUpdateEvent) => {
        setProjects(prev => {
          const existingIndex = prev.findIndex(p => p.id === event.project.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = event.project;
            return updated;
          } else {
            return [event.project, ...prev];
          }
        });
        toast.success(`New project: ${event.project.title}`);
      };

      onProjectUpdate(handleProjectUpdate);

      return () => {
        offProjectUpdate(handleProjectUpdate);
        disconnect();
      };
    }
  }, [user, connect, disconnect, onProjectUpdate, offProjectUpdate]);

  const departments = useMemo(() => {
    const depts = new Set(projects.flatMap((p: Project) => p.departments));
    return Array.from(depts).sort();
  }, [projects]);

  const skills = useMemo(() => {
    const skillsSet = new Set(projects.flatMap((p: Project) => p.skills));
    return Array.from(skillsSet).sort();
  }, [projects]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return projects.filter((p: Project) => {
      const matchesSearch = term === "" || p.title.toLowerCase().includes(term) || p.description.toLowerCase().includes(term) || p.authorName.toLowerCase().includes(term);
      const matchesDept = selectedDepartment === "all" || p.departments.includes(selectedDepartment);
      const matchesSkill = selectedSkill === "all" || p.skills.includes(selectedSkill);
      const isOpen = p.progressStatus === "OPEN";
      return matchesSearch && matchesDept && matchesSkill && isOpen;
    });
  }, [projects, searchTerm, selectedDepartment, selectedSkill]);

  const sortedProjects = useMemo(() => {
    return [...filtered].sort((a: Project, b: Project) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filtered]);

  const handleApplyToProject = async (projectId: string, message: string) => {
    try {
      await projectsApi.applyToProject(projectId, { message });
      toast.success("Application submitted successfully!");
      setShowApplicationModal(false);
      setSelectedProject(null);
      // Update the project's hasApplied status
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, hasApplied: true, myApplicationStatus: 'PENDING' } : p
      ));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to submit application";
      toast.error(errorMessage);
      throw error; // keep modal open by signaling failure to the caller
    }
  };

  const handleApply = (project: Project) => {
    setSelectedProject(project);
    setShowApplicationModal(true);
  };

  const handleApplicationSubmit = async (projectId: string, message: string) => {
    await handleApplyToProject(projectId, message);
  };

  const handleSaveProject = (projectId: string) => {
    setSavedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
        toast.success("Project removed from saved", {
          icon: '💔',
          duration: 2000,
        });
      } else {
        newSet.add(projectId);
        toast.success("Project saved! ❤️", {
          icon: '❤️',
          duration: 2000,
          style: {
            background: '#EF4444',
            color: 'white',
          },
        });
      }
      return newSet;
    });
  };

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
            Project Marketplace
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Discover exciting research opportunities and collaborations
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
            {filtered.length} projects available
          </motion.span>
          {savedProjects.size > 0 && (
            <motion.span 
              className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-red-100 text-red-700 border border-red-200"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
            >
              <Heart className="w-4 h-4 mr-2 fill-current" />
              {savedProjects.size} saved
            </motion.span>
          )}
        </motion.div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div 
        className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
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

          {/* Sort and Filter Controls */}
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-4 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-medium"
            >
              <option value="newest">🆕 Newest First</option>
              <option value="deadline">⏰ Deadline Soon</option>
              <option value="popular">🔥 Most Popular</option>
            </select>
            
            <motion.button
              onClick={() => setShowFilters((v: boolean) => !v)}
              className="flex items-center px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
              {(selectedDepartment !== 'all' || selectedSkill !== 'all' || selectedType !== 'all') && (
                <motion.span 
                  className="ml-2 w-2 h-2 bg-yellow-400 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                />
              )}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              className="mt-6 pt-6 border-t border-gray-200"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    🏢 Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full py-3 px-4 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-medium"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept === "all" ? "All Departments" : dept}
                      </option>
                    ))}
                  </select>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    🛠️ Required Skill
                  </label>
                  <select
                    value={selectedSkill}
                    onChange={(e) => setSelectedSkill(e.target.value)}
                    className="w-full py-3 px-4 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-medium"
                  >
                    {skills.map((skill: string) => (
                      <option key={skill} value={skill}>
                        {skill === "all" ? "All Skills" : skill}
                      </option>
                    ))}
                  </select>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    📋 Project Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full py-3 px-4 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm font-medium"
                  >
                    <option value="all">All Types</option>
                    <option value="PROJECT">Project</option>
                    <option value="RESEARCH">Research</option>
                    <option value="PAPER_PUBLISH">Paper Publish</option>
                    <option value="OTHER">Other</option>
                  </select>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Projects grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
            >
              {/* Header skeleton */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded-full animate-pulse mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded-full animate-pulse w-3/4"></div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded-xl animate-pulse"></div>
                </div>
              </div>

              {/* Title skeleton */}
              <div className="h-6 bg-gray-200 rounded-lg animate-pulse mb-3"></div>
              
              {/* Description skeleton */}
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-4/5"></div>
              </div>

              {/* Stats skeleton */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3">
                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse mx-auto mb-2"></div>
                    <div className="h-2 bg-gray-200 rounded animate-pulse mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>

              {/* Skills skeleton */}
              <div className="flex gap-2 mb-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                ))}
              </div>

              {/* Buttons skeleton */}
              <div className="flex gap-3">
                <div className="flex-1 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="flex-1 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          layout
        >
          {sortedProjects.map((project: Project, index: number) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
            >
              <ProjectCard
                project={project}
                expanded={expandedId === project.id}
                onToggleExpand={() =>
                  setExpandedId((id) => (id === project.id ? null : project.id))
                }
                onApply={() => handleApply(project)}
                onSave={() => handleSaveProject(project.id)}
                isSaved={savedProjects.has(project.id)}
                hasApplied={!!project.myApplicationStatus}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div 
          className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-200"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No projects found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Try adjusting your search criteria or filters to discover more opportunities
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* Application Modal */}
      <ApplicationModal
        project={selectedProject}
        onSubmit={handleApplicationSubmit}
        onClose={() => {
          setShowApplicationModal(false);
          setSelectedProject(null);
        }}
      />
    </motion.div>
  );
}

function ProjectCard({
  project,
  expanded,
  onToggleExpand,
  onApply,
  onSave,
  isSaved,
  hasApplied,
}: {
  project: Project;
  expanded: boolean;
  onToggleExpand: () => void;
  onApply: () => void;
  onSave: () => void;
  isSaved: boolean;
  hasApplied: boolean;
}) {
  const appStatus = project.myApplicationStatus;
  const appBadgeClass =
    appStatus === 'ACCEPTED'
      ? 'bg-green-100 text-green-800'
      : appStatus === 'PENDING'
      ? 'bg-yellow-100 text-yellow-800'
      : appStatus === 'REJECTED'
      ? 'bg-red-100 text-red-800'
      : '';
  const appBadgeText =
    appStatus === 'ACCEPTED'
      ? 'Accepted'
      : appStatus === 'PENDING'
      ? 'Pending'
      : appStatus === 'REJECTED'
      ? 'Rejected'
      : '';
  const getProjectTypeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'research':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'internship':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <motion.div
      layout
      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden group"
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Card Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                project.projectType === 'RESEARCH' 
                  ? 'bg-purple-100 text-purple-700' 
                  : project.projectType === 'PROJECT'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {project.projectType}
              </span>
              {project.myApplicationStatus === "ACCEPTED" && (
                <motion.span 
                  className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  ✓ Accepted
                </motion.span>
              )}
              {project.myApplicationStatus === "PENDING" && (
                <motion.span 
                  className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  ⏳ Pending
                </motion.span>
              )}
              {project.myApplicationStatus === "REJECTED" && (
                <motion.span 
                  className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  ✗ Rejected
                </motion.span>
              )}
            </div>
            <div className="flex items-center text-gray-600 text-sm mb-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">{project.authorName}</span>
                  {/* Faculty's actual department */}
                  {project.authorDepartment && (
                    <div className="flex items-center gap-1 mt-1">
                      <Users className="w-3 h-3 text-purple-500" />
                      <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        Faculty: {project.authorDepartment}
                      </span>
                    </div>
                  )}
                  {/* Project applicable departments */}
                  {project.departments && project.departments.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-blue-500" />
                      <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        Open to: {project.departments.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <Users className="w-3 h-3 mr-1" />
                  <span>{project.acceptedStudentsCount || 0}/{project.maxStudents} students</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <motion.button
              onClick={onToggleExpand}
              className="p-2 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="View Project Details"
            >
              <Eye className={`w-5 h-5 ${expanded ? 'text-blue-600' : 'text-gray-400'}`} />
            </motion.button>
            <motion.button
              onClick={onSave}
              className="p-2 rounded-xl border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Save Project"
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
            </motion.button>
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">{project.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>

        {/* Project Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <motion.div 
            className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-xs text-gray-600 font-medium">Duration</div>
            <div className="text-sm font-bold text-gray-900">{project.projectDuration || 'Not specified'}</div>
          </motion.div>
          
          <motion.div 
            className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-xs text-gray-600 font-medium">Team Size</div>
            <div className="text-sm font-bold text-gray-900">{project.acceptedStudentsCount || 0}/{project.maxStudents}</div>
          </motion.div>
          
          <motion.div 
            className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-100"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-center mb-2">
              <CalendarIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-xs text-gray-600 font-medium">Deadline</div>
            <div className="text-sm font-bold text-gray-900">
              {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'Flexible'}
            </div>
          </motion.div>
        </div>

        {/* Skills */}
        <div className="mb-6">
          <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
            <Star className="w-4 h-4 mr-2 text-yellow-500" />
            Required Skills
          </h4>
          <div className="flex flex-wrap gap-2">
            {project.skills.map((skill, index) => (
              <motion.span
                key={skill}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-xs font-semibold rounded-full border border-blue-200"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.1 }}
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <motion.button
            onClick={onToggleExpand}
            className="flex-1 px-4 py-3 font-semibold text-sm rounded-xl border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="flex items-center justify-center">
              <Eye className="w-4 h-4 mr-2" />
              {expanded ? 'Hide Details' : 'View Details'}
            </span>
          </motion.button>
          
          <motion.button
            onClick={onApply}
            disabled={hasApplied}
            className={`flex-1 px-4 py-3 font-bold text-sm rounded-xl transition-all duration-200 shadow-lg ${
              hasApplied 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white hover:shadow-xl'
            }`}
            whileHover={!hasApplied ? { scale: 1.02 } : {}}
            whileTap={!hasApplied ? { scale: 0.98 } : {}}
          >
            {hasApplied ? (
              <span className="flex items-center justify-center">
                {project.myApplicationStatus === "ACCEPTED" && (
                  <div className="text-green-600 text-sm font-medium">✓ Accepted</div>
                )}
                {project.myApplicationStatus === "PENDING" && (
                  <div className="text-yellow-600 text-sm font-medium">⏳ Pending</div>
                )}
                {project.myApplicationStatus === "REJECTED" && (
                  <div className="text-red-600 text-sm font-medium">✗ Rejected</div>
                )}
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Zap className="w-4 h-4 mr-2" />
                Apply Now
              </span>
            )}
          </motion.button>
        </div>
      </div>

      {/* Expandable Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-gradient-to-br from-gray-50 to-blue-50">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
                  Project Description
                </h4>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">{project.description}</p>
              </motion.div>

              {project.requirements && project.requirements.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mb-6"
                >
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    Requirements
                  </h4>
                  <ul className="space-y-2">
                    {project.requirements.map((req, i) => (
                      <motion.li 
                        key={i} 
                        className="flex items-start p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.05 }}
                      >
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {req}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {project.outcomes && project.outcomes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                    <Award className="w-4 h-4 mr-2 text-purple-500" />
                    Expected Outcomes
                  </h4>
                  <ul className="space-y-2">
                    {project.outcomes.map((outcome, i) => (
                      <motion.li 
                        key={i} 
                        className="flex items-start p-2 rounded-lg hover:bg-green-50 transition-colors"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.05 }}
                      >
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {outcome}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
