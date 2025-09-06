'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  MapPin, 
  Calendar, 
  Award, 
  BookOpen, 
  Code, 
  ExternalLink, 
  Github, 
  Linkedin, 
  Twitter, 
  Building2, 
  GraduationCap, 
  Users, 
  Target, 
  Briefcase, 
  Plus, 
  Edit3, 
  Trash2, 
  Save,
  ArrowUpRight,
  Star,
  TrendingUp,
  Activity,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Code2,
  Zap,
  Globe,
  FileText,
  Mail,
  Phone,
  Loader2,
  Camera,
  UserPlus,
  UserMinus,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch } from '@/store/hooks';
import { fetchProfile } from '@/store/slices/profileSlice';
import { profileApi } from '@/lib/profileApi';
import { networkApi } from '@/lib/networkApi';
import { uploadToCloudinary } from '@/utils/cloudinary';
import toast from 'react-hot-toast';

interface ProfileProps {
  userId?: string;
  isPublicView?: boolean;
}

interface ProfileData {
  id: string;
  displayName: string;
  email: string;
  bio?: string;
  department?: string;
  college?: string;
  collegeName?: string;
  year?: number;
  collegeMemberId?: string;
  avatarUrl?: string;
  location?: string;
  linkedIn?: string;
  twitter?: string;
  github?: string;
  website?: string;
  phoneNumber?: string;
  skills?: string[];
  expertise?: string[];
  roles?: string[];
  joinedAt?: string;
}

export default function Profile({ userId, isPublicView = false }: ProfileProps) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [personalProjects, setPersonalProjects] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  // Modal states
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showPublicationModal, setShowPublicationModal] = useState(false);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editingPublication, setEditingPublication] = useState<any>(null);
  const [editingExperience, setEditingExperience] = useState<any>(null);
  const [editingSkill, setEditingSkill] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  
  // Form states
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    github: '',
    demoLink: '',
    image: '',
    technologies: [] as string[],
    isUploading: false,
    isSubmitting: false
  });
  
  const [publicationForm, setPublicationForm] = useState({
    title: '',
    link: '',
    year: new Date().getFullYear()
  });
  
  const [experienceForm, setExperienceForm] = useState({
    area: '',
    level: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert',
    yearsExp: 0,
    description: ''
  });
  
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    bio: '',
    year: undefined as number | undefined,
    linkedIn: '',
    github: '',
    twitter: '',
    website: '',
    phoneNumber: '',
    alternateEmail: '',
    resumeUrl: '',
    avatarUrl: '',
    isUploading: false,
    isSubmitting: false
  });
  
  const [skillForm, setSkillForm] = useState({
    name: ''
  });
  
  const [skillsForm, setSkillsForm] = useState({
    skills: [] as string[]
  });
  
  const isOwnProfile = !userId || userId === user?.id;
  const targetUserId = userId || user?.id;
  const isStudent = profile?.roles?.includes('STUDENT') || user?.role === 'student';
  const isFaculty = profile?.roles?.includes('FACULTY') || user?.role === 'faculty';
  const isAdmin = false; // Simplified for now - can be enhanced later
  const canEdit = isOwnProfile || isAdmin;

  // Follow/Unfollow handlers for public view
  const handleFollow = async () => {
    if (!targetUserId || !user) return;
    
    setFollowLoading(true);
    try {
      await networkApi.followUser(targetUserId);
      setIsFollowing(true);
      toast.success('Following user!');
    } catch (error) {
      console.error('Failed to follow user:', error);
      toast.error('Failed to follow user');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!targetUserId || !user) return;
    
    setFollowLoading(true);
    try {
      await networkApi.unfollowUser(targetUserId);
      setIsFollowing(false);
      toast.success('Unfollowed user');
    } catch (error) {
      console.error('Failed to unfollow user:', error);
      toast.error('Failed to unfollow user');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = () => {
    // TODO: Implement messaging functionality
    toast.success('Messaging feature coming soon!');
  };

  // Fetch profile data
  useEffect(() => {
    const fetchData = async () => {
      if (!targetUserId) return;
      
      setLoading(true);
      try {
        // Fetch profile
        const profileData = await profileApi.getProfile(targetUserId);
        setProfile(profileData as ProfileData);
        
        // Check follow status if viewing another user's profile
        if (isPublicView && user && targetUserId !== user.id) {
          try {
            const connectionsResponse = await networkApi.getConnections(user.id);
            const connections = Array.isArray(connectionsResponse) ? connectionsResponse : [];
            const isCurrentlyFollowing = connections.some((conn: any) => conn.id === targetUserId);
            setIsFollowing(isCurrentlyFollowing);
          } catch (error) {
            console.error('Failed to fetch follow status:', error);
          }
        }
        
        // Fetch role-specific data
        if (profileData.roles?.includes('STUDENT')) {
          const [projectsData, badgesData] = await Promise.all([
            profileApi.getPersonalProjects(targetUserId),
            profileApi.getBadges(targetUserId)
          ]);
          setPersonalProjects(projectsData);
          setBadges(badgesData);
        } else if (profileData.roles?.includes('FACULTY')) {
          const [publicationsData, experiencesData] = await Promise.all([
            profileApi.getPublications(targetUserId),
            profileApi.getExperiences(targetUserId)
          ]);
          setPublications(publicationsData);
          setExperiences(experiencesData);
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [targetUserId, isPublicView, user]);

  // Initialize profile form when profile data loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        year: profile.year,
        linkedIn: profile.linkedIn || '',
        github: profile.github || '',
        twitter: (profile as any).twitter || '',
        website: (profile as any).website || '',
        phoneNumber: profile.phoneNumber || '',
        alternateEmail: (profile as any).alternateEmail || '',
        resumeUrl: (profile as any).resumeUrl || '',
        avatarUrl: profile.avatarUrl || '',
        isUploading: false,
        isSubmitting: false
      });
    }
    setShowProfileModal(false);
  }, [profile]);

  // Avatar upload handler
  const handleAvatarUpload = async (file: File) => {
    try {
      setProfileForm(prev => ({ ...prev, isUploading: true }));
      const avatarUrl = await uploadToCloudinary(file);
      setProfileForm(prev => ({ 
        ...prev, 
        avatarUrl,
        isUploading: false 
      }));
      toast.success('Avatar uploaded successfully');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast.error('Failed to upload avatar');
      setProfileForm(prev => ({ ...prev, isUploading: false }));
    }
  };

  // CRUD Handlers
  const handleSaveProfile = async () => {
    try {
      setProfileForm(prev => ({ ...prev, isSubmitting: true }));
      
      const profileData = {
        ...profileForm,
        // Only include year if it's a valid number for students
        year: isStudent && profileForm.year ? profileForm.year : undefined,
        isUploading: undefined,
        isSubmitting: undefined
      };
      
      await profileApi.updateProfile(profileData);
      setProfile(prev => prev ? { ...prev, ...profileData } : null);
      toast.success('Profile updated successfully');
      setShowProfileModal(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setProfileForm(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const resetProfileForm = () => {
    if (profile) {
      setProfileForm({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        year: profile.year,
        linkedIn: profile.linkedIn || '',
        github: profile.github || '',
        twitter: (profile as any).twitter || '',
        website: (profile as any).website || '',
        phoneNumber: profile.phoneNumber || '',
        alternateEmail: (profile as any).alternateEmail || '',
        resumeUrl: (profile as any).resumeUrl || '',
        avatarUrl: profile.avatarUrl || '',
        isUploading: false,
        isSubmitting: false
      });
    }
    setShowProfileModal(false);
  };

  const fetchSkills = async () => {
    if (!isOwnProfile) {
      setSkills([]);
      return;
    }
    
    try {
      setSkillsLoading(true);
      const skillsData = await profileApi.getMySkills?.() || [];
      setSkills(skillsData);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
      toast.error('Failed to load skills');
      setSkills([]);
    } finally {
      setSkillsLoading(false);
    }
  };

  const handleSaveSkill = async () => {
    if (!skillForm.name.trim()) {
      toast.error('Please enter a skill name');
      return;
    }

    try {
      setSkillsLoading(true);
      if (editingSkill !== null) {
        // Update existing skill
        const updatedSkills = [...skills];
        const oldSkill = updatedSkills[editingSkill];
        updatedSkills[editingSkill] = skillForm.name.trim();
        
        // Update skills via API
        const newSkills = await profileApi.updateMySkills(updatedSkills);
        setSkills(newSkills);
        toast.success('Skill updated successfully');
      } else {
        // Check if skill already exists
        const skillName = skillForm.name.trim();
        const existingSkill = skills.find(skill => 
          (typeof skill === 'string' ? skill : skill.name).toLowerCase() === skillName.toLowerCase()
        );
        
        if (existingSkill) {
          toast.error('This skill already exists');
          return;
        }
        
        // Add new skill
        const newSkills = await profileApi.addSkill(skillName);
        setSkills(newSkills);
        toast.success('Skill added successfully');
      }
      resetSkillForm();
    } catch (error) {
      console.error('Failed to save skill:', error);
      toast.error('Failed to save skill. Please try again.');
    } finally {
      setSkillsLoading(false);
    }
  };

  const resetSkillForm = () => {
    setSkillForm({
      name: ''
    });
    setEditingSkill(null);
    setShowSkillsModal(false);
  };

  const handleEditSkill = (skill: any, index: number) => {
    setSkillForm({ name: typeof skill === 'string' ? skill : skill.name || skill });
    setEditingSkill(index);
  };

  const handleDeleteSkill = async (index: number) => {
    try {
      setSkillsLoading(true);
      const skillToDelete = skills[index];
      const skillName = typeof skillToDelete === 'string' ? skillToDelete : skillToDelete.name;
      
      // Remove skill via API
      const newSkills = await profileApi.removeSkill(skillName);
      setSkills(newSkills);
      toast.success('Skill removed successfully');
    } catch (error) {
      console.error('Failed to delete skill:', error);
      toast.error('Failed to delete skill');
    } finally {
      setSkillsLoading(false);
    }
  };

  // Image upload handler
  const handleImageUpload = async (file: File) => {
    try {
      setProjectForm(prev => ({ ...prev, isUploading: true }));
      const imageUrl = await uploadToCloudinary(file);
      setProjectForm(prev => ({ 
        ...prev, 
        image: imageUrl,
        isUploading: false 
      }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Failed to upload image');
      setProjectForm(prev => ({ ...prev, isUploading: false }));
    }
  };

  // Resume upload handler
  const handleResumeUpload = async (file: File) => {
    try {
      setProfileForm(prev => ({ ...prev, isUploading: true }));
      const resumeUrl = await uploadToCloudinary(file); // Using same Cloudinary function for documents
      setProfileForm(prev => ({ 
        ...prev, 
        resumeUrl,
        isUploading: false 
      }));
      toast.success('Resume uploaded successfully');
    } catch (error) {
      console.error('Failed to upload resume:', error);
      toast.error('Failed to upload resume');
      setProfileForm(prev => ({ ...prev, isUploading: false }));
    }
  };

  // CRUD Handlers
  const handleEditProject = (project: any) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title || '',
      description: project.description || '',
      github: project.github || '',
      demoLink: project.demoLink || '',
      image: project.image || '',
      technologies: project.technologies || [],
      isUploading: false,
      isSubmitting: false
    });
    setShowProjectModal(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await profileApi.deletePersonalProject(projectId);
      setPersonalProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success('Project deleted successfully');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const handleEditPublication = (publication: any) => {
    setEditingPublication(publication);
    setPublicationForm({
      title: publication.title || '',
      link: publication.link || '',
      year: publication.year || new Date().getFullYear()
    });
    setShowPublicationModal(true);
  };

  const handleDeletePublication = async (publicationId: string) => {
    if (!confirm('Are you sure you want to delete this publication?')) return;
    
    try {
      await profileApi.deletePublication(publicationId);
      setPublications(prev => prev.filter(p => p.id !== publicationId));
      toast.success('Publication deleted successfully');
    } catch (error) {
      toast.error('Failed to delete publication');
    }
  };

  const handleEditExperience = (experience: any) => {
    setEditingExperience(experience);
    setExperienceForm({
      area: experience.area || '',
      level: experience.level || 'Beginner',
      yearsExp: experience.yearsExp || 0,
      description: experience.description || ''
    });
    setShowExperienceModal(true);
  };

  const handleDeleteExperience = async (experienceId: string) => {
    if (!confirm('Are you sure you want to delete this experience?')) return;
    
    try {
      await profileApi.deleteExperience(experienceId);
      setExperiences(prev => prev.filter(e => e.id !== experienceId));
      toast.success('Experience deleted successfully');
    } catch (error) {
      toast.error('Failed to delete experience');
    }
  };

  const handleSaveProject = async () => {
    if (!projectForm.title.trim() || !projectForm.description.trim()) {
      toast.error('Please fill in the required fields (title and description)');
      return;
    }

    try {
      setProjectForm(prev => ({ ...prev, isSubmitting: true }));
      
      const projectData = {
        ...projectForm,
        // Use fallback image if no image provided
        image: projectForm.image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop&crop=center',
        isUploading: undefined,
        isSubmitting: undefined
      };
      
      if (editingProject) {
        const updated = await profileApi.updatePersonalProject(editingProject.id, projectData);
        setPersonalProjects(prev => prev.map(p => p.id === editingProject.id ? updated : p));
        toast.success('Project updated successfully');
      } else {
        const created = await profileApi.createPersonalProject(projectData);
        setPersonalProjects(prev => [created, ...prev]);
        toast.success('Project created successfully');
      }
      resetProjectForm();
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error('Failed to save project');
    } finally {
      setProjectForm(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleSavePublication = async () => {
    try {
      if (editingPublication) {
        const updated = await profileApi.updatePublication(editingPublication.id, publicationForm);
        setPublications(prev => prev.map(p => p.id === editingPublication.id ? updated : p));
        toast.success('Publication updated successfully');
      } else {
        const created = await profileApi.createPublication(publicationForm);
        setPublications(prev => [created, ...prev]);
        toast.success('Publication created successfully');
      }
      resetPublicationForm();
    } catch (error) {
      toast.error('Failed to save publication');
    }
  };

  const handleSaveExperience = async () => {
    try {
      if (editingExperience) {
        const updated = await profileApi.updateExperience(editingExperience.id, experienceForm);
        setExperiences(prev => prev.map(e => e.id === editingExperience.id ? updated : e));
        toast.success('Experience updated successfully');
      } else {
        const created = await profileApi.createExperience(experienceForm);
        setExperiences(prev => [created, ...prev]);
        toast.success('Experience created successfully');
      }
      resetExperienceForm();
    } catch (error) {
      toast.error('Failed to save experience');
    }
  };

  const resetProjectForm = () => {
    setProjectForm({
      title: '',
      description: '',
      github: '',
      demoLink: '',
      image: '',
      technologies: [],
      isUploading: false,
      isSubmitting: false
    });
    setEditingProject(null);
    setShowProjectModal(false);
  };

  const resetPublicationForm = () => {
    setPublicationForm({
      title: '',
      link: '',
      year: new Date().getFullYear()
    });
    setEditingPublication(null);
    setShowPublicationModal(false);
  };

  const resetExperienceForm = () => {
    setExperienceForm({
      area: '',
      level: 'Beginner',
      yearsExp: 0,
      description: ''
    });
    setEditingExperience(null);
    setShowExperienceModal(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!targetUserId) return;
      
      try {
        setLoading(true);
        
        // Fetch profile data
        const profileData = await profileApi.getProfile(targetUserId);
        
        setProfile({
          ...profileData,
          email: profileData.email || '',
          displayName: profileData.displayName || profileData.name || '',
          id: profileData.id || targetUserId
        });
        
        // Fetch skills
        await fetchSkills();
        
        if (isStudent) {
          // Fetch student-specific data
          try {
            const badgeData = await profileApi.getBadges?.(targetUserId) || [];
            setBadges(badgeData);
          } catch (error) {
            console.error('Failed to fetch badges:', error);
          }
          
          try {
            const projectData = isOwnProfile 
              ? await profileApi.getMyPersonalProjects?.() || []
              : await profileApi.getPersonalProjects?.(targetUserId) || [];
            setPersonalProjects(projectData);
          } catch (error) {
            console.error('Failed to fetch projects:', error);
          }
        } else if (isFaculty) {
          // Fetch faculty-specific data
          try {
            const publicationData = isOwnProfile 
              ? await profileApi.getMyPublications()
              : await profileApi.getPublications(targetUserId);
            setPublications(publicationData);
          } catch (error) {
            console.error('Failed to fetch publications:', error);
          }
          
          try {
            const experienceData = isOwnProfile
              ? await profileApi.getMyExperiences()
              : await profileApi.getExperiences(targetUserId);
            setExperiences(experienceData);
          } catch (error) {
            console.error('Failed to fetch experiences:', error);
          }
        }
        
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [targetUserId, isStudent, isFaculty, isOwnProfile]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <Card className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-48"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-none px-8 py-6 space-y-8">
        {/* Professional Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white border border-gray-200 shadow-sm"
        >
          <div className="relative">
            {/* Cover Image */}
            <div className="h-48 bg-gradient-to-r from-slate-900 via-gray-900 to-slate-800 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute bottom-6 left-8">
                <div className="flex items-end space-x-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-lg bg-white p-1 shadow-xl">
                      {profile.avatarUrl ? (
                        <img 
                          src={profile.avatarUrl} 
                          alt={profile.displayName}
                          className="w-full h-full rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-md bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-3xl font-semibold">
                          {profile.displayName?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    {isStudent && (
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                        <GraduationCap className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {isFaculty && (
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="pb-4">
                    <h1 className="text-3xl font-bold text-white mb-1">{profile.displayName}</h1>
                    <p className="text-blue-100 text-lg font-medium">
                      {isStudent ? 'Student' : 'Faculty'} • {profile.department}
                    </p>
                    <p className="text-blue-200 text-sm">{profile.college || profile.collegeName || 'College not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Bar */}
            <div className="px-8 py-4 bg-white border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-1 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">{profile.department || 'Department'}, {profile.college || profile.collegeName || 'College'}</span>
                  </div>
                  {profile.collegeMemberId && (
                    <Badge variant="outline" className="text-xs font-mono">
                      ID: {profile.collegeMemberId}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  {profile.linkedIn && (
                    <a href={profile.linkedIn} target="_blank" rel="noopener noreferrer" 
                       className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {profile.twitter && (
                    <a href={profile.twitter} target="_blank" rel="noopener noreferrer" 
                       className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-50 rounded-lg transition-colors">
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {profile.github && (
                    <a href={profile.github} target="_blank" rel="noopener noreferrer" 
                       className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                      <Github className="w-5 h-5" />
                    </a>
                  )}
                  {(profile as any).resumeUrl && isStudent && (
                    <a href={(profile as any).resumeUrl} target="_blank" rel="noopener noreferrer" 
                       className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                      <FileText className="w-5 h-5" />
                    </a>
                  )}
                  
                  {/* Action buttons - Edit for own profile, Follow/Message for others */}
                  {canEdit ? (
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleAvatarUpload(file);
                          };
                          input.click();
                        }}
                        disabled={profileForm.isUploading}
                        className="p-2 hover:bg-gray-100 rounded-full"
                        title="Change Avatar"
                      >
                        {profileForm.isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowProfileModal(true)}
                        disabled={profileForm.isSubmitting}
                      >
                        {profileForm.isSubmitting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Edit3 className="w-4 h-4 mr-2" />
                        )}
                        Edit Profile
                      </Button>
                    </div>
                  ) : isPublicView && user && targetUserId !== user.id ? (
                    <div className="flex items-center gap-2 ml-4">
                      <Button 
                        variant={isFollowing ? "outline" : "default"}
                        size="sm"
                        onClick={isFollowing ? handleUnfollow : handleFollow}
                        disabled={followLoading}
                        className={isFollowing ? "text-gray-700 border-gray-300" : "bg-blue-600 hover:bg-blue-700 text-white"}
                      >
                        {followLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : isFollowing ? (
                          <UserMinus className="w-4 h-4 mr-2" />
                        ) : (
                          <UserPlus className="w-4 h-4 mr-2" />
                        )}
                        {isFollowing ? 'Unfollow' : 'Follow'}
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={handleMessage}
                        className="text-gray-700 border-gray-300 hover:bg-gray-50"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* About Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-slate-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">About</h2>
                  </div>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed text-base">
                      {profile.bio || `${isStudent ? 'Student' : 'Faculty member'} at ${profile.college || profile.collegeName || 'this institution'}. Passionate about learning and contributing to the academic community.`}
                    </p>
                  </div>
                  {isStudent && profile.year && (
                    <div className="mt-6 flex items-center space-x-4">
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Year {profile.year}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Skills/Expertise Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-slate-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {isStudent ? 'Technical Skills' : 'Areas of Expertise'}
                      </h2>
                    </div>
                    {isOwnProfile && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowSkillsModal(true)}
                        disabled={skillsLoading}
                      >
                        {skillsLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        Add {isStudent ? 'Skill' : 'Expertise'}
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {skillsLoading ? (
                      <div className="col-span-full flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        <span className="ml-2 text-gray-500">Loading skills...</span>
                      </div>
                    ) : skills.length > 0 ? skills.map((skill, index) => (
                      <div 
                        key={index} 
                        className={`group relative px-4 py-3 rounded-lg border text-sm font-medium text-center transition-colors hover:shadow-sm ${
                          isStudent 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        <span>{typeof skill === 'string' ? skill : skill.name}</span>
                        {isOwnProfile && (
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSkill(skill, index)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSkill(index)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )) : (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        No {isStudent ? 'skills' : 'expertise'} listed yet
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Role-specific Content */}
            {isStudent ? (
              <>
                {/* Projects Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Code2 className="w-5 h-5 text-slate-600" />
                          </div>
                          <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
                        </div>
                        {isOwnProfile && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowProjectModal(true)}
                            disabled={projectForm.isSubmitting}
                          >
                            {projectForm.isSubmitting ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Plus className="w-4 h-4 mr-2" />
                            )}
                            Add Project
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-6">
                        {personalProjects?.slice(0, 3).map((project) => (
                          <div key={project.id} className="group p-6 bg-gray-50 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all duration-200">
                            <div className="flex items-start space-x-4">
                              {/* Project Image */}
                              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                <img 
                                  src={project.image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop&crop=center'} 
                                  alt={project.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  onError={(e) => {
                                    e.currentTarget.src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop&crop=center';
                                  }}
                                />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-emerald-700">{project.title}</h3>
                                    <p className="text-gray-600 mt-2 leading-relaxed">{project.description}</p>
                                    
                                    {/* Technologies */}
                                    {project.technologies && project.technologies.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mt-3">
                                        {project.technologies.slice(0, 3).map((tech: string, index: number) => (
                                          <span key={index} className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-md font-medium">
                                            {tech}
                                          </span>
                                        ))}
                                        {project.technologies.length > 3 && (
                                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                                            +{project.technologies.length - 3} more
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    
                                    <div className="flex items-center space-x-4 mt-4">
                                      {project.github && (
                                        <a href={project.github} target="_blank" rel="noopener noreferrer" 
                                           className="inline-flex items-center text-sm text-gray-600 hover:text-emerald-600 transition-colors">
                                          <Github className="w-4 h-4 mr-2" />
                                          View Code
                                        </a>
                                      )}
                                      {project.demoLink && (
                                        <a href={project.demoLink} target="_blank" rel="noopener noreferrer" 
                                           className="inline-flex items-center text-sm text-gray-600 hover:text-emerald-600 transition-colors">
                                          <ExternalLink className="w-4 h-4 mr-2" />
                                          Live Demo
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Action buttons for own profile */}
                                  {isOwnProfile && (
                                    <div className="flex items-center space-x-2 ml-4">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleEditProject(project)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        disabled={projectForm.isSubmitting}
                                      >
                                        {projectForm.isSubmitting ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Edit3 className="w-4 h-4" />
                                        )}
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => handleDeleteProject(project.id)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
                                        disabled={projectForm.isSubmitting}
                                      >
                                        {projectForm.isSubmitting ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="w-4 h-4" />
                                        )}
                                      </Button>
                                    </div>
                                  )}
                                  
                                  <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )) || (
                          <div className="text-center py-12 text-gray-500">
                            <Code2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No projects added yet</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Achievements Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-8">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Award className="w-5 h-5 text-slate-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Achievements</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {badges?.slice(0, 6).map((badge) => (
                          <div key={badge.id} className="group p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200 hover:border-amber-300 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Award className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{badge.badge?.name || 'Achievement'}</p>
                                <p className="text-xs text-amber-700 mt-1">
                                  {new Date(badge.awardedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        )) || (
                          <div className="col-span-full text-center py-12 text-gray-500">
                            <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No achievements earned yet</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            ) : (
              <>
                {/* Experience Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-slate-600" />
                          </div>
                          <h2 className="text-xl font-semibold text-gray-900">Professional Experience</h2>
                        </div>
                        {isOwnProfile && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowExperienceModal(true)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Experience
                          </Button>
                        )}
                      </div>
                      <div className="space-y-4">
                        {experiences?.map((exp) => (
                          <div key={exp.id} className="group p-6 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Briefcase className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700">{exp.area}</h3>
                                  <p className="text-blue-600 font-medium mt-1">{exp.level}</p>
                                  <p className="text-gray-600 mt-2">{exp.description}</p>
                                  <div className="flex items-center space-x-4 mt-3">
                                    <span className="text-sm text-gray-500">{exp.yearsExp} years experience</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Action buttons for own profile */}
                              {isOwnProfile && (
                                <div className="flex items-center space-x-2 ml-4">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEditExperience(exp)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDeleteExperience(exp.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                              
                              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                          </div>
                        )) || (
                          <div className="text-center py-12 text-gray-500">
                            <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No experience added yet</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Publications Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-slate-600" />
                          </div>
                          <h2 className="text-xl font-semibold text-gray-900">Publications & Research</h2>
                        </div>
                        {isOwnProfile && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowPublicationModal(true)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Publication
                          </Button>
                        )}
                      </div>
                      <div className="space-y-4">
                        {publications?.map((pub) => (
                          <div key={pub.id} className="group p-6 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all duration-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-700">{pub.title}</h3>
                                <p className="text-indigo-600 font-medium mt-2">Published in {pub.year}</p>
                                {pub.link && (
                                  <a href={pub.link} target="_blank" rel="noopener noreferrer" 
                                     className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600 transition-colors mt-3">
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    View Publication
                                  </a>
                                )}
                              </div>
                              
                              {/* Action buttons for own profile */}
                              {isOwnProfile && (
                                <div className="flex items-center space-x-2 ml-4">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEditPublication(pub)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDeletePublication(pub.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                              
                              <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                            </div>
                          </div>
                        )) || (
                          <div className="text-center py-12 text-gray-500">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No publications added yet</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Stats</h3>
                  <div className="space-y-4">
                    {isStudent && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Projects</span>
                          <span className="font-semibold text-emerald-600">{personalProjects?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Achievements</span>
                          <span className="font-semibold text-amber-600">{badges?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Skills</span>
                          <span className="font-semibold text-blue-600">{profile.skills?.length || 0}</span>
                        </div>
                      </>
                    )}
                    {isFaculty && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Publications</span>
                          <span className="font-semibold text-indigo-600">{publications?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Experience</span>
                          <span className="font-semibold text-blue-600">{experiences?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Total Years</span>
                          <span className="font-semibold text-purple-600">
                            {experiences?.reduce((total, exp) => total + (exp.yearsExp || 0), 0) || 0}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Institution Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-slate-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      {isFaculty ? 'Currently Working' : 'Institution'}
                    </h3>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">{profile.college || profile.collegeName || 'College not specified'}</p>
                        <p className="text-gray-600 text-sm mt-1">{profile.department}</p>
                        {isStudent && profile.year && (
                          <p className="text-gray-500 text-xs mt-1">Year {profile.year}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-slate-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Contact Information</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 font-medium">{profile.email}</span>
                    </div>
                    {profile.phoneNumber && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700 font-medium">{profile.phoneNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        Member since {new Date(profile.joinedAt || '').toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            {isOwnProfile && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Zap className="w-4 h-4 text-slate-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Quick Actions</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) handleAvatarUpload(file);
                            };
                            input.click();
                          }}
                          disabled={profileForm.isUploading}
                          className="flex-1 justify-start"
                        >
                          {profileForm.isUploading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Camera className="w-4 h-4 mr-2" />
                          )}
                          Change Avatar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 justify-start"
                          onClick={() => setShowProfileModal(true)}
                          disabled={profileForm.isSubmitting}
                        >
                          {profileForm.isSubmitting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Edit3 className="w-4 h-4 mr-2" />
                          )}
                          Edit Profile
                        </Button>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => isStudent ? setShowProjectModal(true) : setShowPublicationModal(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add {isStudent ? 'Project' : 'Publication'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => setShowSkillsModal(true)}
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Update {isStudent ? 'Skills' : 'Expertise'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Project Modal */}
    <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              value={projectForm.title}
              onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter project title"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={projectForm.description}
              onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your project"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="github">GitHub URL</Label>
              <Input
                id="github"
                value={projectForm.github}
                onChange={(e) => setProjectForm(prev => ({ ...prev, github: e.target.value }))}
                placeholder="https://github.com/username/repo"
              />
            </div>
            <div>
              <Label htmlFor="demoLink">Demo URL</Label>
              <Input
                id="demoLink"
                value={projectForm.demoLink}
                onChange={(e) => setProjectForm(prev => ({ ...prev, demoLink: e.target.value }))}
                placeholder="https://your-demo.com"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="project-image">Project Image</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  disabled={projectForm.isUploading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={projectForm.isUploading}
                >
                  {projectForm.isUploading ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
              {projectForm.image && (
                <div className="relative">
                  <img 
                    src={projectForm.image} 
                    alt="Project preview" 
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setProjectForm(prev => ({ ...prev, image: '' }))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <Input
                placeholder="Or paste image URL directly"
                value={projectForm.image}
                onChange={(e) => setProjectForm(prev => ({ ...prev, image: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="technologies">Technologies <span className="text-gray-500 text-sm">(optional, comma-separated)</span></Label>
            <Input
              id="technologies"
              value={projectForm.technologies.join(', ')}
              onChange={(e) => setProjectForm(prev => ({ 
                ...prev, 
                technologies: e.target.value.split(',').map(tech => tech.trim()).filter(Boolean)
              }))}
              placeholder="React, TypeScript, Node.js"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={resetProjectForm}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProject}
              disabled={projectForm.isSubmitting || !projectForm.title.trim() || !projectForm.description.trim()}
            >
              {projectForm.isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {projectForm.isSubmitting ? 'Saving...' : (editingProject ? 'Update' : 'Create')} Project
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Publication Modal */}
    <Dialog open={showPublicationModal} onOpenChange={setShowPublicationModal}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingPublication ? 'Edit Publication' : 'Add New Publication'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="pub-title">Publication Title</Label>
            <Input
              id="pub-title"
              value={publicationForm.title}
              onChange={(e) => setPublicationForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter publication title"
            />
          </div>
          <div>
            <Label htmlFor="pub-link">Publication URL</Label>
            <Input
              id="pub-link"
              value={publicationForm.link}
              onChange={(e) => setPublicationForm(prev => ({ ...prev, link: e.target.value }))}
              placeholder="https://journal.com/article"
            />
          </div>
          <div>
            <Label htmlFor="pub-year">Publication Year</Label>
            <Input
              id="pub-year"
              type="number"
              value={publicationForm.year}
              onChange={(e) => setPublicationForm(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
              min="1900"
              max={new Date().getFullYear() + 1}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={resetPublicationForm}>
              Cancel
            </Button>
            <Button onClick={handleSavePublication}>
              <Save className="w-4 h-4 mr-2" />
              {editingPublication ? 'Update' : 'Create'} Publication
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Experience Modal */}
    <Dialog open={showExperienceModal} onOpenChange={setShowExperienceModal}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingExperience ? 'Edit Experience' : 'Add New Experience'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="exp-area">Area/Field</Label>
            <Input
              id="exp-area"
              value={experienceForm.area}
              onChange={(e) => setExperienceForm(prev => ({ ...prev, area: e.target.value }))}
              placeholder="e.g., Software Development, Data Science"
            />
          </div>
          <div>
            <Label htmlFor="exp-level">Experience Level</Label>
            <Select 
              value={experienceForm.level} 
              onValueChange={(value: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert') => 
                setExperienceForm(prev => ({ ...prev, level: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
                <SelectItem value="Expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="exp-years">Years of Experience</Label>
            <Input
              id="exp-years"
              type="number"
              value={experienceForm.yearsExp}
              onChange={(e) => setExperienceForm(prev => ({ ...prev, yearsExp: parseInt(e.target.value) || 0 }))}
              min="0"
              max="50"
            />
          </div>
          <div>
            <Label htmlFor="exp-description">Description</Label>
            <Textarea
              id="exp-description"
              value={experienceForm.description}
              onChange={(e) => setExperienceForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your experience and achievements"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={resetExperienceForm}>
              Cancel
            </Button>
            <Button onClick={handleSaveExperience}>
              <Save className="w-4 h-4 mr-2" />
              {editingExperience ? 'Update' : 'Create'} Experience
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Profile Edit Modal */}
    <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pr-2">
          <div>
            <Label htmlFor="profile-name">Display Name</Label>
            <Input
              id="profile-name"
              value={profileForm.displayName}
              onChange={(e) => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))}
              placeholder="Your display name"
            />
          </div>
          <div>
            <Label htmlFor="profile-bio">Bio</Label>
            <Textarea
              id="profile-bio"
              value={profileForm.bio}
              onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself"
              rows={3}
            />
          </div>
          {isStudent && (
            <div>
              <Label htmlFor="profile-year">Year</Label>
              <Input
                id="profile-year"
                type="number"
                value={profileForm.year || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, year: parseInt(e.target.value) || undefined }))}
                placeholder="Current year of study"
                min="1"
                max="4"
              />
            </div>
          )}
          <div>
            <Label htmlFor="profile-linkedin">LinkedIn URL</Label>
            <Input
              id="profile-linkedin"
              value={profileForm.linkedIn}
              onChange={(e) => setProfileForm(prev => ({ ...prev, linkedIn: e.target.value }))}
              placeholder="LinkedIn profile URL"
            />
          </div>
          <div>
            <Label htmlFor="profile-github">GitHub URL</Label>
            <Input
              id="profile-github"
              value={profileForm.github}
              onChange={(e) => setProfileForm(prev => ({ ...prev, github: e.target.value }))}
              placeholder="https://github.com/username"
            />
          </div>
          <div>
            <Label htmlFor="profile-twitter">Twitter URL</Label>
            <Input
              id="profile-twitter"
              value={profileForm.twitter}
              onChange={(e) => setProfileForm(prev => ({ ...prev, twitter: e.target.value }))}
              placeholder="https://twitter.com/username"
            />
          </div>
          <div>
            <Label htmlFor="profile-website">Website URL</Label>
            <Input
              id="profile-website"
              value={profileForm.website}
              onChange={(e) => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://yourwebsite.com"
            />
          </div>
          <div>
            <Label htmlFor="profile-phone">Phone Number</Label>
            <Input
              id="profile-phone"
              value={profileForm.phoneNumber || ''}
              onChange={(e) => setProfileForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="Your phone number"
            />
          </div>
          <div>
            <Label htmlFor="profile-alt-email">Alternate Email</Label>
            <Input
              id="profile-alt-email"
              value={profileForm.alternateEmail}
              onChange={(e) => setProfileForm(prev => ({ ...prev, alternateEmail: e.target.value }))}
              placeholder="alternate@email.com"
            />
          </div>
          {isStudent && (
            <div>
              <Label htmlFor="resume-upload">Resume</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleResumeUpload(file);
                    }}
                    disabled={profileForm.isUploading}
                    className="flex-1"
                  />
                  {profileForm.resumeUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(profileForm.resumeUrl, '_blank')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  )}
                </div>
                {profileForm.isUploading && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading resume...
                  </div>
                )}
                {profileForm.resumeUrl && (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">Resume uploaded</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProfileForm(prev => ({ ...prev, resumeUrl: '' }))}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={resetProfileForm}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProfile}
              disabled={profileForm.isSubmitting}
            >
              {profileForm.isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {profileForm.isSubmitting ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Skills Modal */}
    <Dialog open={showSkillsModal} onOpenChange={setShowSkillsModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Skills</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="skill-name">Skill Name</Label>
            <Input
              id="skill-name"
              value={skillForm.name}
              onChange={(e) => setSkillForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., React, Python, Machine Learning"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={resetSkillForm}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSkill}
              disabled={!skillForm.name.trim() || skillsLoading}
            >
              {skillsLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {skillsLoading ? 'Saving...' : (editingSkill !== null ? 'Update' : 'Add')} Skill
            </Button>
          </div>
        </div>
        
        {/* Current Skills List */}
        {skills.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-3">Current Skills</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {skills.map((skill, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-sm">{typeof skill === 'string' ? skill : skill.name}</span>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSkill(skill, index)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSkill(index)}
                      disabled={skillsLoading}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {skillsLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </div>
  );
}
