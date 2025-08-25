'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectBadgeDefinitions, fetchBadgeDefinitions, fetchAwardsForStudent, selectAwardsForStudent } from '@/store/slices/badgesSlice';
import {
  selectStudentProjects,
  fetchMyProjects,
  createStudentProject,
  updateStudentProject,
  deleteStudentProject,
} from '@/store/slices/studentProjectsSlice';
import type { UIProject } from '@/store/slices/studentProjectsSlice';
import { selectProfile, fetchMyProfile, saveMyProfile, initializeMyProfile } from '@/store/slices/profileSlice';
import { selectColleges, fetchColleges } from '@/store/slices/collegesSlice';

import { uploadMedia } from '@/lib/uploadMedia';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  User as UserIcon,
  Edit,
  Plus,
  Trash,
  Save,
  Link as LinkIcon,
  ExternalLink,
  Tag,
  FileText,
  Github,
  Activity,
  Award,
  Briefcase,
  Calendar,
  LogOut,
  X,
  Mail,
  Copy,
  Camera,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

function ensureHttp(url?: string) {
  if (!url) return undefined;
  if (!url.trim()) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function getHost(url?: string) {
  try {
    if (!url) return null;
    const h = new URL(url).hostname;
    return h.startsWith('www.') ? h.slice(4) : h;
  } catch {
    return null;
  }
}

export default function StudentProfile({ userId }: { userId?: string }) {
  const { user, updateProfile, logout } = useAuth();
  const {
    applications,
    eventRegistrations,
    drives,
    // network additions
    users,
    posts,
  } = useData();

  const dispatch = useAppDispatch();
  const myProjects = useAppSelector(selectStudentProjects);
  const profile = useAppSelector(selectProfile);
  const colleges = useAppSelector(selectColleges);

  const [profileOpen, setProfileOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [projOpen, setProjOpen] = useState(false);
  const [editingProj, setEditingProj] = useState<UIProject | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeFileInputRef = useRef<HTMLInputElement>(null);
  const projImageFileInputRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState({
    resume: user?.social?.resume || '',
    linkedin: user?.social?.linkedin || '',
    github: user?.social?.github || '',
    twitter: user?.social?.twitter || '',
    year: (typeof user?.year === 'number' ? String(user?.year) : ''),
    bio: user?.bio || '',
    contactInfo: user?.contactInfo || '',
    collegeMemberId: '',
  });

  const [setupForm, setSetupForm] = useState({
    collegeId: '',
    department: '',
    year: '',
  });

  const [skillInput, setSkillInput] = useState('');

  const viewedUser = useMemo(() => {
    if (userId) return users.find((u) => u.id === userId);
    return user || undefined;
  }, [userId, users, user]);

  const isSelf = viewedUser && user ? viewedUser.id === user.id : false;
  const canEdit = isSelf && user?.role === 'student';

  // Badges: load definitions (once) and awards for the viewed user
  const badgeDefs = useAppSelector(selectBadgeDefinitions);
  const awardsForViewed = useAppSelector((s) => (viewedUser ? selectAwardsForStudent(s, viewedUser.id) : []));

  useEffect(() => {
    // load definitions on mount
    dispatch(fetchBadgeDefinitions());
  }, [dispatch]);

  useEffect(() => {
    if (viewedUser?.id) {
      dispatch(fetchAwardsForStudent({ studentId: viewedUser.id }));
    }
  }, [dispatch, viewedUser?.id]);

  useEffect(() => {
    if (isSelf) {
      dispatch(fetchMyProjects());
      dispatch(fetchMyProfile());
    }
  }, [dispatch, isSelf]);

  // Load colleges once to map collegeId -> name
  useEffect(() => {
    if (colleges.length === 0) {
      dispatch(fetchColleges());
    }
  }, [dispatch, colleges.length]);

  // Keep form fields in sync with backend profile
  useEffect(() => {
    if (!isSelf || !profile) return;
    setProfileForm((p) => ({
      ...p,
      resume: profile.resumeUrl ?? p.resume,
      linkedin: profile.linkedIn ?? p.linkedin,
      github: profile.github ?? p.github,
      twitter: (profile as any).twitter ?? p.twitter,
      year: typeof profile.year === 'number' ? String(profile.year) : p.year,
      bio: typeof profile.bio === 'string' ? profile.bio : p.bio,
      contactInfo: typeof (profile as any).contactInfo === 'string' ? (profile as any).contactInfo : p.contactInfo,
      collegeMemberId: typeof (profile as any).collegeMemberId === 'string' ? (profile as any).collegeMemberId : p.collegeMemberId,
    }));
  }, [isSelf, profile?.resumeUrl, profile?.linkedIn, profile?.github, (profile as any)?.twitter, profile?.year, profile?.bio, (profile as any)?.contactInfo, (profile as any)?.collegeMemberId]);

  // Prompt first-time setup when required fields are missing
  useEffect(() => {
    if (!isSelf) return;
    if (!profile?.collegeId || !profile?.department) {
      setSetupOpen(true);
    }
  }, [isSelf, profile?.collegeId, profile?.department]);

  const myApplications = useMemo(() => {
    if (!viewedUser) return [] as typeof applications;
    return applications.filter((a) => a.studentId === viewedUser.id);
  }, [applications, viewedUser]);

  const myEventRegs = useMemo(() => {
    if (!viewedUser) return [] as typeof eventRegistrations;
    return eventRegistrations.filter((r) => r.studentId === viewedUser.id);
  }, [eventRegistrations, viewedUser]);

  const myBadgeDetails = useMemo(() => {
    if (!viewedUser) return [] as Array<{ sb: any; badge: any }>;
    return (awardsForViewed || [])
      .map((sb: any) => ({ sb, badge: badgeDefs.find((b: any) => b.id === sb.badgeId) }))
      .filter((x) => !!x.badge);
  }, [awardsForViewed, badgeDefs, viewedUser]);

  const jobApplicationsCount = useMemo(() => {
    if (!viewedUser) return 0;
    return drives.reduce((count, d) => (d.applicants.includes(viewedUser.id) ? count + 1 : count), 0);
  }, [drives, viewedUser]);

  const isStudent = viewedUser?.role === 'student';

  const collegeName = useMemo(() => {
    if (!profile?.collegeId) return undefined;
    return colleges.find((c) => c.id === profile.collegeId)?.name;
  }, [colleges, profile?.collegeId]);

  const profileCompleteness = useMemo(() => {
    if (!viewedUser) return 0;
    const checks = [
      Boolean(viewedUser.avatar),
      Boolean(viewedUser.bio && viewedUser.bio.trim().length >= 20),
      Boolean(profile?.resumeUrl),
      Boolean(profile?.linkedIn),
      Boolean(profile?.github),
      Boolean(typeof profile?.year === 'number'),
      (profile?.skills?.length || 0) >= 3,
    ];
    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  }, [viewedUser, profile]);

  const [projForm, setProjForm] = useState({
    title: '',
    description: '',
    techText: '',
    link: '',
    repo: '',
    demo: '',
    image: '',
  });

  if (!viewedUser) return <div className="text-sm text-gray-600">User not found.</div>;

  const resetProjForm = () => {
    setEditingProj(null);
    setProjForm({
      title: '',
      description: '',
      techText: '',
      link: '',
      repo: '',
      demo: '',
      image: '',
    });
  };

  const openCreateProj = () => {
    resetProjForm();
    setProjOpen(true);
  };

  const openEditProj = (proj: UIProject) => {
    setEditingProj(proj);
    setProjForm({
      title: proj.title,
      description: proj.description,
      techText: (proj.tech || []).join(', '),
      link: proj.link || '',
      repo: proj.repo || '',
      demo: proj.demo || '',
      image: proj.image || '',
    });
    setProjOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    // Persist supported fields to backend (resumeUrl, linkedIn, github, twitter, contact info)
    try {
      if (profile) {
        const y = profileForm.year ? parseInt(profileForm.year, 10) : undefined;
        await dispatch(
          saveMyProfile({
            resumeUrl: ensureHttp(profileForm.resume),
            linkedIn: ensureHttp(profileForm.linkedin),
            github: ensureHttp(profileForm.github),
            twitter: ensureHttp(profileForm.twitter),
            year: typeof y === 'number' && !Number.isNaN(y) ? y : undefined,
            bio: (profileForm.bio || '').trim(),
            contactInfo: (profileForm.contactInfo || '').trim() || undefined,
            collegeMemberId: profileForm.collegeMemberId?.trim() || undefined,
          })
        ).unwrap();
      } else {
        toast.error('Please set up your profile (college & department) before saving links.');
      }
    } catch {
      toast.error('Failed to save profile links');
      return;
    }
    toast.success('Profile updated');
    setProfileOpen(false);
  };

  const handleInitializeProfile = async () => {
    const collegeId = setupForm.collegeId.trim();
    const department = setupForm.department.trim();
    const y = setupForm.year.trim() ? parseInt(setupForm.year.trim(), 10) : undefined;
    if (!collegeId || !department) {
      toast.error('College ID and Department are required');
      return;
    }
    try {
      await dispatch(
        initializeMyProfile({
          collegeId,
          department,
          year: typeof y === 'number' && !Number.isNaN(y) ? y : undefined,
        })
      ).unwrap();
      toast.success('Profile setup complete');
      setSetupOpen(false);
    } catch (e) {
      toast.error('Failed to initialize profile');
    }
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!projForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!projForm.description.trim()) {
      toast.error('Description is required');
      return;
    }

    const tech = projForm.techText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editingProj) {
        await dispatch(
          updateStudentProject({
            id: editingProj.id,
            changes: {
              title: projForm.title.trim(),
              description: projForm.description.trim(),
              tech,
              repo: ensureHttp(projForm.repo),
              demo: ensureHttp(projForm.demo),
              image: ensureHttp(projForm.image),
              link: ensureHttp(projForm.link), // link is derived in UI; keep for local state
            } as any,
          })
        ).unwrap();
        toast.success('Project updated');
      } else {
        await dispatch(
          createStudentProject({
            title: projForm.title.trim(),
            description: projForm.description.trim(),
            tech,
            repo: ensureHttp(projForm.repo),
            demo: ensureHttp(projForm.demo),
            image: ensureHttp(projForm.image),
          })
        ).unwrap();
        toast.success('Project added');
      }
      setProjOpen(false);
      resetProjForm();
    } catch (err) {
      toast.error('Failed to save project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await dispatch(deleteStudentProject(projectId)).unwrap();
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const handleAddSkill = async () => {
    const s = skillInput.trim();
    if (!user || !s) return;
    if (!profile) {
      toast.error('Complete profile setup first');
      return;
    }
    const current = profile?.skills || [];
    if (current.map((x) => x.toLowerCase()).includes(s.toLowerCase())) {
      toast.error('Skill already added');
      return;
    }
    try {
      await dispatch(saveMyProfile({ skills: [...current, s] })).unwrap();
      setSkillInput('');
      toast.success('Skill added');
    } catch {
      toast.error('Failed to add skill');
    }
  };

  const handleRemoveSkill = async (s: string) => {
    if (!user) return;
    if (!profile) {
      toast.error('Complete profile setup first');
      return;
    }
    const current = profile?.skills || [];
    const updated = current.filter((k) => k !== s);
    try {
      await dispatch(saveMyProfile({ skills: updated })).unwrap();
      toast.success('Skill removed');
    } catch {
      toast.error('Failed to remove skill');
    }
  };

  const copyToClipboard = async (text?: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const triggerAvatarPicker = () => fileInputRef.current?.click();
  const triggerResumePicker = () => resumeFileInputRef.current?.click();
  const triggerProjImagePicker = () => projImageFileInputRef.current?.click();

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let toastId: string | undefined;
    try {
      toastId = toast.loading('Uploading avatar...');
      const { url } = await uploadMedia(file, { folder: 'user_avatars', resource_type: 'image' });
      if (toastId) toast.dismiss(toastId);
      updateProfile({ avatar: url });
      toast.success('Avatar updated');
    } catch (err) {
      if (toastId) toast.dismiss(toastId);
      toast.error('Failed to upload avatar');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResumeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let toastId: string | undefined;
    try {
      toastId = toast.loading('Uploading resume...');
      const { url } = await uploadMedia(file, { folder: 'resumes', resource_type: 'auto' });
      if (toastId) toast.dismiss(toastId);
      setProfileForm((p) => ({ ...p, resume: url }));
      toast.success('Resume uploaded');
    } catch {
      if (toastId) toast.dismiss(toastId);
      toast.error('Failed to upload resume');
    } finally {
      if (resumeFileInputRef.current) resumeFileInputRef.current.value = '';
    }
  };

  const handleProjImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let toastId: string | undefined;
    try {
      toastId = toast.loading('Uploading image...');
      const { url } = await uploadMedia(file, { folder: 'project_images', resource_type: 'image' });
      if (toastId) toast.dismiss(toastId);
      setProjForm((p) => ({ ...p, image: url }));
      toast.success('Image uploaded');
    } catch {
      if (toastId) toast.dismiss(toastId);
      toast.error('Failed to upload image');
    } finally {
      if (projImageFileInputRef.current) projImageFileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-indigo-600" /> Profile
          </h1>
          <p className="text-gray-600">{isSelf ? 'Manage your profile, resume, and showcase projects' : 'Profile overview'}</p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button onClick={() => setProfileOpen(true)} variant="secondary">
              <Edit className="w-4 h-4 mr-2" /> Edit Profile
            </Button>
          )}
          {isSelf && (
            <Button variant="outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {isSelf && (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="transition-transform hover:-translate-y-0.5">
          <Card className="shadow-sm hover:shadow-lg transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Projects</div>
                <div className="text-2xl font-semibold">{myProjects.length}</div>
              </div>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Activity className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="transition-transform hover:-translate-y-0.5">
          <Card className="shadow-sm hover:shadow-lg transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Applications</div>
                <div className="text-2xl font-semibold">{myApplications.length + jobApplicationsCount}</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Briefcase className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="transition-transform hover:-translate-y-0.5">
          <Card className="shadow-sm hover:shadow-lg transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Badges</div>
                <div className="text-2xl font-semibold">{myBadgeDetails.length}</div>
              </div>
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Award className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="transition-transform hover:-translate-y-0.5">
          <Card className="shadow-sm hover:shadow-lg transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Events</div>
                <div className="text-2xl font-semibold">{myEventRegs.length}</div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Calendar className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {/* Profile Card */}
      <Card className="shadow-sm hover:shadow-md transition-all">
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={viewedUser.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(viewedUser.name)}
                alt={viewedUser.name}
                className="w-20 h-20 rounded-full object-cover border ring-2 ring-indigo-500/20 shadow-md"
              />
              {canEdit && (
                <button
                  type="button"
                  onClick={triggerAvatarPicker}
                  className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-xs rounded-full"
                  aria-label="Change avatar"
                >
                  <Camera className="w-4 h-4" /> Change
                </button>
              )}
            </div>
            <div>
              <div className="text-xl font-semibold flex items-center gap-2">
                {viewedUser.name}
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-sm text-gray-600 capitalize">{viewedUser.role.replace('_', ' ')}</div>
              {(profile?.department || viewedUser.department) && <div className="text-sm text-gray-600">{profile?.department || viewedUser.department}</div>}
              {collegeName && <div className="text-sm text-gray-600">{collegeName}</div>}
              {typeof profile?.year === 'number' && <div className="text-sm text-gray-600">Year: {profile?.year}</div>}
              {profile?.collegeMemberId && (
                <div className="text-sm text-gray-600">College Member ID: {profile.collegeMemberId}</div>
              )}
              <div className="text-xs text-gray-500 mt-1">Joined {new Date(viewedUser.createdAt).toLocaleDateString()}</div>
              <div className="text-sm text-gray-700 mt-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" /> {viewedUser.email}
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-700"
                  onClick={() => copyToClipboard(viewedUser.email)}
                  aria-label="Copy email"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            {isSelf && (
              <div>
                <div className="text-sm font-medium text-gray-800 mb-1 flex items-center gap-2">
                  Profile Strength
                  <span className="text-xs text-gray-500">{profileCompleteness}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${profileCompleteness}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 transition-all"
                  />
                </div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-gray-800 mb-1">Bio</div>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {(profile?.bio ?? viewedUser.bio) || 'No bio added yet.'}
              </p>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-800 mb-1">Resume & Links</div>
              <div className="flex flex-wrap gap-2">
                {profile?.resumeUrl && (
                  <a className="text-rose-700 hover:underline inline-flex items-center gap-1 text-sm" href={profile.resumeUrl} target="_blank" rel="noreferrer" title={getHost(profile.resumeUrl) || undefined}>
                    <FileText className="w-3.5 h-3.5" /> Resume
                  </a>
                )}
                {profile?.linkedIn && (
                  <a className="text-blue-600 hover:underline inline-flex items-center gap-1 text-sm" href={profile.linkedIn} target="_blank" rel="noreferrer" title={getHost(profile.linkedIn) || undefined}>
                    <LinkIcon className="w-3.5 h-3.5" /> LinkedIn
                  </a>
                )}
                {profile?.github && (
                  <a className="text-gray-800 hover:underline inline-flex items-center gap-1 text-sm" href={profile.github} target="_blank" rel="noreferrer" title={getHost(profile.github) || undefined}>
                    <Github className="w-3.5 h-3.5" /> GitHub
                  </a>
                )}
                {(profile as any)?.twitter && (
                  <a className="text-sky-500 hover:underline inline-flex items-center gap-1 text-sm" href={(profile as any).twitter} target="_blank" rel="noreferrer" title={getHost((profile as any).twitter) || undefined}>
                    <LinkIcon className="w-3.5 h-3.5" /> Twitter
                  </a>
                )}
                {!profile?.resumeUrl && !profile?.linkedIn && !profile?.github && !(profile as any)?.twitter && (
                  <div className="text-sm text-gray-500">No links added yet.</div>
                )}
              </div>
            </div>

            {(profile as any)?.contactInfo && (
              <div>
                <div className="text-sm font-medium text-gray-800 mb-1">Contact Info</div>
                <p className="text-sm text-gray-700 whitespace-pre-line">{(profile as any).contactInfo}</p>
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-gray-800 mb-1">Skills</div>
              <div className="flex flex-wrap gap-2">
                {(profile?.skills || viewedUser.skills || []).length === 0 && (
                  <div className="text-sm text-gray-500">No skills added yet.</div>
                )}
                {(profile?.skills || viewedUser.skills || []).map((s) => (
                  <div key={s} className="flex items-center gap-1 transition-transform hover:scale-[1.03]">
                    <Badge variant="muted" className="inline-flex items-center gap-1 shadow-sm">
                      <Tag className="w-3 h-3" /> {s}
                    </Badge>
                    {canEdit && (
                      <button
                        aria-label={`Remove ${s}`}
                        className="text-gray-400 hover:text-gray-700"
                        onClick={() => handleRemoveSkill(s)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {canEdit && (
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    placeholder="Add a skill (press Add)"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                  />
                  <Button onClick={handleAddSkill} variant="secondary">Add</Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Award className="w-5 h-5" /> Badges
        </h2>
        <Card>
          <CardContent className="p-6">
            {myBadgeDetails.length === 0 ? (
              <div className="text-sm text-gray-600">No badges earned yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {myBadgeDetails.map(({ sb, badge }) => (
                  <div
                    key={sb.id}
                    className="p-3 rounded border flex items-center justify-between shadow-sm hover:shadow-md transition-all"
                    
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-xl">
                        {badge.icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{badge.name}</div>
                        <div className="text-xs text-gray-500">{badge.category} • {badge.rarity}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">{new Date(sb.awardedAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projects Showcase */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          Showcase Projects
        </h2>
        {canEdit && (
          <Button onClick={openCreateProj}>
            <Plus className="w-4 h-4 mr-2" /> Add Project
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {myProjects.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-6 text-sm text-gray-600 flex items-center justify-between">
              <div>No showcase projects yet. Click "Add Project" to create one.</div>
              {canEdit && (
                <Button onClick={openCreateProj} variant="secondary">
                  <Plus className="w-4 h-4 mr-2" /> Add Project
                </Button>
              )}
            </CardContent>
          </Card>
        )}
        {myProjects.map((proj) => (
          <div key={proj.id} className="transition-opacity">
            <Card className="shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-28 h-24 rounded-md overflow-hidden border bg-gray-50 shrink-0">
                    {proj.image ? (
                      <img src={proj.image} alt={proj.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-base">
                      {proj.link ? (
                        <a href={proj.link} target="_blank" rel="noreferrer" className="hover:underline inline-flex items-center gap-1">
                          {proj.title}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        proj.title
                      )}
                    </div>
                    <div className="text-sm text-gray-700 mt-1">{proj.description}</div>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      {proj.repo && (
                        <a href={proj.repo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gray-800 hover:underline">
                          <Github className="w-3.5 h-3.5" /> Code
                        </a>
                      )}
                      {proj.demo && (
                        <a href={proj.demo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-700 hover:underline">
                          <ExternalLink className="w-3.5 h-3.5" /> Demo
                        </a>
                      )}
                    </div>
                    {proj.tech && proj.tech.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {proj.tech.map((t) => (
                          <Badge key={t} variant="muted" className="inline-flex items-center gap-1 shadow-sm">
                            <Tag className="w-3 h-3" /> {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-2">Added {new Date(proj.createdAt).toLocaleDateString()}</div>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-2 self-start">
                      <Button variant="secondary" onClick={() => openEditProj(proj)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <Trash className="w-4 h-4 mr-2" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete project?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the project "{proj.title}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteProject(proj.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Recent Posts */}
      {isSelf && (
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          Activity
        </h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            {posts.filter((p) => p.authorId === viewedUser.id).length === 0 ? (
              <div className="text-sm text-gray-600">No recent posts.</div>
            ) : (
              posts
                .filter((p) => p.authorId === viewedUser.id)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 5)
                .map((p) => (
                  <div key={p.id} className="border rounded-lg p-3 hover:shadow-sm transition-all">
                    <div className="text-xs text-gray-500 mb-1">{new Date(p.timestamp).toLocaleString()}</div>
                    <div className="text-sm text-gray-800 whitespace-pre-line">{p.content}</div>
                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.tags.map((t) => (
                          <Badge key={t} variant="muted">#{t}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>
      )}

      {/* Setup Profile Dialog (first-time) */}
      {canEdit && (
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Profile Setup</DialogTitle>
            <DialogDescription>Provide required details to initialize your profile.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="collegeId">College ID *</Label>
                <Input id="collegeId" value={setupForm.collegeId} onChange={(e) => setSetupForm((p) => ({ ...p, collegeId: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="department">Department *</Label>
                <Input id="department" value={setupForm.department} onChange={(e) => setSetupForm((p) => ({ ...p, department: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label htmlFor="year-setup">Year (optional)</Label>
              <Input id="year-setup" type="number" min={1} max={10} value={setupForm.year} onChange={(e) => setSetupForm((p) => ({ ...p, year: e.target.value }))} />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleInitializeProfile}>
                <Save className="w-4 h-4 mr-2" /> Save & Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      )}

      {/* Edit Profile Dialog */}
      {canEdit && (
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your year, bio, links, contact info, and college member ID.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="year">Year</Label>
                <Input id="year" type="number" min={1} max={10} value={profileForm.year} onChange={(e) => setProfileForm((p) => ({ ...p, year: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="resume">Resume</Label>
                <div className="flex gap-2">
                  <Input id="resume" placeholder="https://link-to-your-resume.pdf" value={profileForm.resume} onChange={(e) => setProfileForm((p) => ({ ...p, resume: e.target.value }))} />
                  <Button type="button" variant="secondary" onClick={triggerResumePicker}>Upload</Button>
                </div>
                <input ref={resumeFileInputRef} type="file" accept=".pdf,application/pdf,image/*" className="hidden" onChange={handleResumeFile} />
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input id="linkedin" placeholder="https://linkedin.com/in/username" value={profileForm.linkedin} onChange={(e) => setProfileForm((p) => ({ ...p, linkedin: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="github">GitHub</Label>
                <Input id="github" placeholder="https://github.com/username" value={profileForm.github} onChange={(e) => setProfileForm((p) => ({ ...p, github: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="twitter">Twitter</Label>
                <Input id="twitter" placeholder="https://twitter.com/username" value={profileForm.twitter} onChange={(e) => setProfileForm((p) => ({ ...p, twitter: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" rows={4} placeholder="Tell us about yourself" value={profileForm.bio} onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="contactInfo">Contact Info</Label>
                <Textarea id="contactInfo" rows={3} placeholder="Preferred contact details (e.g., phone/email, office hours)" value={profileForm.contactInfo} onChange={(e) => setProfileForm((p) => ({ ...p, contactInfo: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="collegeMemberId">College Member ID</Label>
                <Input id="collegeMemberId" placeholder="e.g., student/member ID" value={profileForm.collegeMemberId} onChange={(e) => setProfileForm((p) => ({ ...p, collegeMemberId: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile}>
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      )}

      {/* Project Create/Edit Dialog */}
      {canEdit && (
      <Dialog open={projOpen} onOpenChange={(open) => { setProjOpen(open); if (!open) resetProjForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProj ? 'Edit Project' : 'Add Project'}</DialogTitle>
            <DialogDescription>{editingProj ? 'Update your showcase project details' : 'Create a new showcase project'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitProject} className="space-y-3">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={projForm.title} onChange={(e) => setProjForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" rows={3} value={projForm.description} onChange={(e) => setProjForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="image">Image (optional)</Label>
              <div className="flex gap-2">
                <Input id="image" placeholder="https://..." value={projForm.image} onChange={(e) => setProjForm((p) => ({ ...p, image: e.target.value }))} />
                <Button type="button" variant="secondary" onClick={triggerProjImagePicker}>Upload</Button>
              </div>
              <input ref={projImageFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProjImageFile} />
            </div>
            <div>
              <Label htmlFor="tech">Tech (comma-separated)</Label>
              <Input id="tech" value={projForm.techText} onChange={(e) => setProjForm((p) => ({ ...p, techText: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="link">Live Link</Label>
                <Input id="link" value={projForm.link} onChange={(e) => setProjForm((p) => ({ ...p, link: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="repo">Repository</Label>
                <Input id="repo" value={projForm.repo} onChange={(e) => setProjForm((p) => ({ ...p, repo: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="demo">Demo/Video</Label>
                <Input id="demo" value={projForm.demo} onChange={(e) => setProjForm((p) => ({ ...p, demo: e.target.value }))} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" /> {editingProj ? 'Save Changes' : 'Create Project'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}
