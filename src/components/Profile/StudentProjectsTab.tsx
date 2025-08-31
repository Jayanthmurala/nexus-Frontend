'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code, 
  ExternalLink, 
  Github, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar,
  Star,
  Eye,
  Filter,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import ProjectModal from './ProjectModal';

interface Project {
  id: string;
  title: string;
  description: string;
  github?: string;
  demoLink?: string;
  image?: string;
  technologies: string[];
  createdAt: string;
  stars?: number;
  views?: number;
}

interface StudentProjectsTabProps {
  projects: Project[];
  isOwnProfile: boolean;
  loading?: boolean;
  onAddProject?: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateProject?: (id: string, project: Partial<Project>) => Promise<void>;
  onDeleteProject?: (id: string) => Promise<void>;
}

export default function StudentProjectsTab({ 
  projects, 
  isOwnProfile, 
  loading = false,
  onAddProject,
  onUpdateProject,
  onDeleteProject
}: StudentProjectsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTech, setSelectedTech] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Get all unique technologies
  const allTechnologies = Array.from(
    new Set(projects.flatMap(project => project.technologies))
  ).sort();

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTech = !selectedTech || project.technologies.includes(selectedTech);
    return matchesSearch && matchesTech;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const ProjectSkeleton = () => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="h-48 bg-gray-200 animate-pulse"></div>
      <div className="p-6 space-y-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <ProjectSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header with filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Technology filter */}
          <select
            value={selectedTech}
            onChange={(e) => setSelectedTech(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">All Technologies</option>
            {allTechnologies.map(tech => (
              <option key={tech} value={tech}>{tech}</option>
            ))}
          </select>
        </div>

        {/* Add project button */}
        {isOwnProfile && (
          <motion.button
            onClick={() => setShowAddModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Add Project
          </motion.button>
        )}
      </div>

      {/* Projects grid */}
      {filteredProjects.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className="text-center py-12"
        >
          <Code className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedTech ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedTech 
              ? 'Try adjusting your search or filters'
              : 'Start building and showcase your amazing projects!'
            }
          </p>
          {isOwnProfile && !searchTerm && !selectedTech && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Your First Project
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence>
            {filteredProjects.map((project) => (
              <motion.div
                key={project.id}
                variants={itemVariants}
                layout
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
              >
                {/* Project image */}
                <div className="relative h-48 bg-gradient-to-br from-emerald-50 to-blue-50 overflow-hidden">
                  {project.image ? (
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Code className="w-16 h-16 text-emerald-300" />
                    </div>
                  )}
                  
                  {/* Overlay with actions */}
                  {isOwnProfile && (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingProject(project)}
                          className="p-2 bg-white/90 hover:bg-white text-gray-700 rounded-lg shadow-sm transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteProject?.(project.id)}
                          className="p-2 bg-white/90 hover:bg-white text-red-600 rounded-lg shadow-sm transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Stats overlay */}
                  <div className="absolute bottom-3 left-3 flex gap-3">
                    {project.stars !== undefined && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-black/20 backdrop-blur-sm rounded-lg text-white text-xs">
                        <Star className="w-3 h-3" />
                        {project.stars}
                      </div>
                    )}
                    {project.views !== undefined && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-black/20 backdrop-blur-sm rounded-lg text-white text-xs">
                        <Eye className="w-3 h-3" />
                        {project.views}
                      </div>
                    )}
                  </div>
                </div>

                {/* Project content */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                    {project.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Technologies */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        +{project.technologies.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </div>

                    <div className="flex items-center gap-2">
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                      {project.demoLink && (
                        <a
                          href={project.demoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add/Edit Project Modal */}
      <ProjectModal
        isOpen={showAddModal || !!editingProject}
        onClose={() => {
          setShowAddModal(false);
          setEditingProject(null);
        }}
        onSave={async (projectData) => {
          if (!onAddProject) return;
          setModalLoading(true);
          try {
            await onAddProject(projectData);
            setShowAddModal(false);
          } finally {
            setModalLoading(false);
          }
        }}
        onUpdate={async (id, projectData) => {
          if (!onUpdateProject) return;
          setModalLoading(true);
          try {
            await onUpdateProject(id, projectData);
            setEditingProject(null);
          } finally {
            setModalLoading(false);
          }
        }}
        project={editingProject}
        loading={modalLoading}
      />
    </motion.div>
  );
}
