"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  Filter,
  Clock,
  Users,
  BookOpen,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useData, Project } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import ApplicationModal from "@/components/Dashboard/Student/ApplicationModal";
import toast from "react-hot-toast";

export default function ProjectMarketplace() {
  const { projects, applyToProject } = useData();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedSkill, setSelectedSkill] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<
    Pick<Project, "id" | "title" | "facultyName" | "department" | "skills">
    | null
  >(null);

  const departments = useMemo(
    () => ["all", ...Array.from(new Set(projects.map((p) => p.department)))],
    [projects]
  );
  const allSkills = useMemo(
    () => ["all", ...Array.from(new Set(projects.flatMap((p) => p.skills)))],
    [projects]
  );

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesSearch =
        term === "" ||
        p.title.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.facultyName.toLowerCase().includes(term);
      const matchesDept = selectedDepartment === "all" || p.department === selectedDepartment;
      const matchesSkill = selectedSkill === "all" || p.skills.includes(selectedSkill);
      const isOpen = p.status === "open";
      return matchesSearch && matchesDept && matchesSkill && isOpen;
    });
  }, [projects, searchTerm, selectedDepartment, selectedSkill]);

  const handleApply = (project: Project) => {
    setSelectedProject({
      id: project.id,
      title: project.title,
      facultyName: project.facultyName,
      department: project.department,
      skills: project.skills,
    });
    setModalOpen(true);
  };

  const handleApplicationSubmit = async (
    projectId: string,
    motivation: string,
    skills: string
  ) => {
    if (!user) {
      toast.error("You must be signed in to apply.");
      throw new Error("Not signed in");
    }
    const message = `Motivation: ${motivation}\n\nSkills & Experience: ${skills}`;
    try {
      await applyToProject(projectId, user.id, message);
      toast.success("Application submitted");
    } catch (err: any) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to submit application";
      toast.error(apiMsg);
      throw err; // keep modal open by signaling failure to the caller
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Marketplace</h1>
          <p className="text-gray-600 mt-1">
            Discover exciting research opportunities and collaborations
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {filtered.length} projects available
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects, faculty, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept === "all" ? "All Departments" : dept}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Skill
                </label>
                <select
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {allSkills.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill === "all" ? "All Skills" : skill}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Projects grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              expanded={expandedId === project.id}
              onToggleExpand={() =>
                setExpandedId((id) => (id === project.id ? null : project.id))
              }
              onApply={() => handleApply(project)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or filters</p>
        </div>
      )}

      {/* Application Modal */}
      <ApplicationModal
        project={selectedProject}
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setSelectedProject(null);
        }}
        onSubmit={handleApplicationSubmit}
      />
    </div>
  );
}

function ProjectCard({
  project,
  expanded,
  onToggleExpand,
  onApply,
}: {
  project: Project;
  expanded: boolean;
  onToggleExpand: () => void;
  onApply: () => void;
}) {
  const appStatus = project.myApplicationStatus;
  const hasApplied = project.hasApplied;
  const appBadgeClass =
    appStatus === 'accepted'
      ? 'bg-green-100 text-green-800'
      : appStatus === 'pending'
      ? 'bg-yellow-100 text-yellow-800'
      : appStatus === 'rejected'
      ? 'bg-red-100 text-red-800'
      : '';
  const appBadgeText =
    appStatus === 'accepted'
      ? 'Accepted'
      : appStatus === 'pending'
      ? 'Pending'
      : appStatus === 'rejected'
      ? 'Rejected'
      : '';
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-1">{project.title}</h3>
            <div className="flex items-center text-gray-600 text-sm">
              <Users className="w-4 h-4 mr-1" />
              <span className="font-medium">{project.facultyName}</span>
              <span className="mx-2">•</span>
              <span>{project.department}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {project.status}
            </span>
            {appStatus && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${appBadgeClass}`}>
                {appBadgeText}
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-3">
          {project.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {project.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md font-medium"
            >
              {skill}
            </span>
          ))}
          {project.skills.length > 4 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">
              +{project.skills.length - 4} more
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-xs text-gray-500">Duration</div>
            <div className="text-sm font-semibold text-gray-900">{project.duration}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-xs text-gray-500">Team Size</div>
            <div className="text-sm font-semibold text-gray-900">
              {project.currentStudents}/{project.maxStudents}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <CalendarIcon className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-xs text-gray-500">Deadline</div>
            <div className="text-sm font-semibold text-gray-900">
              {project.deadline ? new Date(project.deadline).toLocaleDateString() : "Flexible"}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center text-gray-500 text-sm">
          <CalendarIcon className="w-4 h-4 mr-1" />
          Posted {new Date(project.createdAt).toLocaleDateString()}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onToggleExpand}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            {expanded ? "Less Info" : "More Info"}
          </button>
          <button
            onClick={onApply}
            disabled={!!hasApplied}
            className={`px-6 py-2 text-white font-medium text-sm rounded-lg transition-colors ${hasApplied ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {hasApplied ? (appStatus === 'accepted' ? 'Accepted' : appStatus === 'rejected' ? 'Rejected' : 'Applied') : 'Apply Now'}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Requirements</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {project.requirements?.map((req, i) => (
                  <li key={i} className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Expected Outcomes</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {project.outcomes?.map((outcome, i) => (
                  <li key={i} className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {outcome}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
