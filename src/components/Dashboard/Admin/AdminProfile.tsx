'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMyPublications, createPublicationRecord, updatePublicationRecord, deletePublicationRecord, selectPublications, selectPublicationsLoading } from '@/store/slices/publicationsSlice';
import type { PublicationRecord } from '@/lib/profileApi';
import { selectProfile, fetchMyProfile, saveMyProfile, initializeMyProfile } from '@/store/slices/profileSlice';
import { selectColleges, fetchColleges } from '@/store/slices/collegesSlice';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// (select and badge imports removed)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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
  Link as LinkIcon,
  BookOpen,
  Save,
  ExternalLink,
  Github,
  FileText,
  Tag,
  X,
} from 'lucide-react';

function ensureHttp(url?: string) {
  if (!url) return undefined;
  if (!url.trim()) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

export default function AdminProfile() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const publications = useAppSelector(selectPublications);
  const pubsLoading = useAppSelector(selectPublicationsLoading);
  const profile = useAppSelector(selectProfile);
  const colleges = useAppSelector(selectColleges);

  const [profileOpen, setProfileOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [pubOpen, setPubOpen] = useState(false);
  const [editingPub, setEditingPub] = useState<PublicationRecord | null>(null);

  const roleLower = ((user?.role as any) || '').toString().toLowerCase();
  const isFaculty = roleLower === 'faculty';
  const isFacultyOrAdmin = roleLower === 'faculty' || roleLower.includes('admin');

  useEffect(() => {
    if (user && isFaculty) {
      void dispatch(fetchMyPublications());
    }
  }, [user, isFaculty, dispatch]);

  useEffect(() => {
    if (user) {
      void dispatch(fetchMyProfile());
    }
  }, [user, dispatch]);

  // Load colleges to map collegeId -> name
  useEffect(() => {
    if (colleges.length === 0) {
      void dispatch(fetchColleges());
    }
  }, [dispatch, colleges.length]);

  const collegeName = useMemo(() => {
    if (!profile?.collegeId) return undefined;
    return colleges.find((c) => c.id === profile.collegeId)?.name;
  }, [colleges, profile?.collegeId]);

  const [profileForm, setProfileForm] = useState({
    resume: '',
    linkedin: '',
    github: '',
    twitter: '',
    year: '',
    bio: '',
    contactInfo: '',
    collegeMemberId: '',
  });

  const [setupForm, setSetupForm] = useState({
    collegeId: '',
    department: '',
    year: '',
  });

  // hydrate form from backend profile
  useEffect(() => {
    if (!profile) return;
    setProfileForm((p) => ({
      ...p,
      resume: profile.resumeUrl || p.resume,
      linkedin: profile.linkedIn || p.linkedin,
      github: profile.github || p.github,
      twitter: (profile as any).twitter || p.twitter,
      year: typeof profile.year === 'number' ? String(profile.year) : p.year,
      bio: typeof profile.bio === 'string' ? profile.bio : p.bio,
      contactInfo: typeof (profile as any).contactInfo === 'string' ? (profile as any).contactInfo : p.contactInfo,
      collegeMemberId: typeof (profile as any).collegeMemberId === 'string' ? (profile as any).collegeMemberId : p.collegeMemberId,
    }));
  }, [profile?.resumeUrl, profile?.linkedIn, profile?.github, (profile as any)?.twitter, profile?.year, (profile as any)?.collegeMemberId, profile?.bio, (profile as any)?.contactInfo]);

  // prompt setup if required
  useEffect(() => {
    if (!profile?.collegeId || !profile?.department) {
      setSetupOpen(true);
    }
  }, [profile?.collegeId, profile?.department]);

  const myPubs = useMemo(() => {
    if (!user || !isFaculty) return [] as PublicationRecord[];
    return publications;
  }, [publications, user, isFaculty]);

  const [pubForm, setPubForm] = useState<{ title: string; year: string; link: string }>({
    title: '',
    year: '',
    link: '',
  });

  // Expertise management (Faculty)
  const [expertiseInput, setExpertiseInput] = useState('');
  const handleAddExpertise = async () => {
    const s = expertiseInput.trim();
    if (!s) return;
    if (!profile) {
      toast.error('Complete profile setup first');
      return;
    }
    const current = (profile?.expertise || []) as string[];
    if (current.map((x) => x.toLowerCase()).includes(s.toLowerCase())) {
      toast.error('Expertise already added');
      return;
    }
    try {
      await dispatch(saveMyProfile({ expertise: [...current, s] })).unwrap();
      setExpertiseInput('');
      toast.success('Expertise added');
    } catch {
      toast.error('Failed to add expertise');
    }
  };
  const handleRemoveExpertise = async (s: string) => {
    if (!profile) {
      toast.error('Complete profile setup first');
      return;
    }
    const current = (profile?.expertise || []) as string[];
    const updated = current.filter((k) => k !== s);
    try {
      await dispatch(saveMyProfile({ expertise: updated })).unwrap();
      toast.success('Expertise removed');
    } catch {
      toast.error('Failed to remove expertise');
    }
  };

  if (!user) return null;

  const resetPubForm = () => {
    setEditingPub(null);
    setPubForm({
      title: '',
      year: '',
      link: '',
    });
  };

  const openCreatePub = () => {
    resetPubForm();
    setPubOpen(true);
  };

  const openEditPub = (pub: PublicationRecord) => {
    setEditingPub(pub);
    setPubForm({
      title: pub.title,
      year: String(pub.year ?? ''),
      link: pub.link || '',
    });
    setPubOpen(true);
  };

  const handleSaveProfile = async () => {
    try {
      if (!profile) {
        toast.error('Please complete setup (college & department) first');
        return;
      }
      const y = profileForm.year ? parseInt(profileForm.year, 10) : undefined;
      const payload: any = {
        linkedIn: ensureHttp(profileForm.linkedin),
        github: ensureHttp(profileForm.github),
        twitter: ensureHttp(profileForm.twitter),
        bio: (profileForm.bio || '').trim(),
        contactInfo: (profileForm.contactInfo || '').trim() || undefined,
        collegeMemberId: profileForm.collegeMemberId?.trim() || undefined,
      };
      if (!isFacultyOrAdmin) {
        payload.resumeUrl = ensureHttp(profileForm.resume);
        payload.year = typeof y === 'number' && !Number.isNaN(y) ? y : undefined;
      }
      await dispatch(saveMyProfile(payload)).unwrap();
      toast.success('Profile updated');
      setProfileOpen(false);
    } catch (e) {
      toast.error('Failed to save profile');
    }
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

  const handleSubmitPublication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const yearNum = parseInt(pubForm.year, 10);
    if (!pubForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!pubForm.year || Number.isNaN(yearNum)) {
      toast.error('Valid year is required');
      return;
    }

    const payload = {
      title: pubForm.title.trim(),
      year: yearNum,
      link: ensureHttp(pubForm.link),
    };

    try {
      if (editingPub) {
        await dispatch(updatePublicationRecord({ id: editingPub.id, changes: payload })).unwrap();
        toast.success('Publication updated');
      } else {
        await dispatch(createPublicationRecord(payload)).unwrap();
        toast.success('Publication added');
      }
      setPubOpen(false);
      resetPubForm();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save publication');
    }
  };

  const handleDeletePub = async (pubId: string) => {
    try {
      await dispatch(deletePublicationRecord(pubId)).unwrap();
      toast.success('Publication deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete publication');
    }
  };

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <UserIcon className="w-7 h-7" /> Profile
          </h1>
          <p className="text-gray-600">Manage your profile details and publications</p>
        </div>
        <Button onClick={() => setProfileOpen(true)} variant="secondary">
          <Edit className="w-4 h-4 mr-2" /> Edit Profile
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(user.name)}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover border"
            />
            <div>
              <div className="text-xl font-semibold">{user.name}</div>
              <div className="text-sm text-gray-600 capitalize">{user.role.replace('_', ' ')}</div>
              {(profile?.department || user.department) && <div className="text-sm text-gray-600">{profile?.department || user.department}</div>}
              {collegeName && <div className="text-sm text-gray-600">{collegeName}</div>}
              {typeof profile?.year === 'number' && !isFacultyOrAdmin && <div className="text-sm text-gray-600">Year: {profile?.year}</div>}
              {profile?.collegeMemberId && (
                <div className="text-sm text-gray-600">College Member ID: {profile.collegeMemberId}</div>
              )}
              <div className="text-xs text-gray-500 mt-1">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            <div>
              <div className="text-sm font-medium text-gray-800 mb-1">Bio</div>
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {(profile?.bio ?? user.bio) || 'No bio added yet.'}
              </p>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-800 mb-1">Resume & Links</div>
              <div className="flex flex-wrap gap-2">
                {profile?.resumeUrl && !isFacultyOrAdmin && (
                  <a className="text-rose-700 hover:underline inline-flex items-center gap-1 text-sm" href={profile.resumeUrl} target="_blank" rel="noreferrer">
                    <FileText className="w-3.5 h-3.5" /> Resume
                  </a>
                )}
                {profile?.linkedIn && (
                  <a className="text-blue-600 hover:underline inline-flex items-center gap-1 text-sm" href={profile.linkedIn} target="_blank" rel="noreferrer">
                    <LinkIcon className="w-3.5 h-3.5" /> LinkedIn
                  </a>
                )}
                {profile?.github && (
                  <a className="text-gray-800 hover:underline inline-flex items-center gap-1 text-sm" href={profile.github} target="_blank" rel="noreferrer">
                    <Github className="w-3.5 h-3.5" /> GitHub
                  </a>
                )}
                {(profile as any)?.twitter && (
                  <a className="text-sky-500 hover:underline inline-flex items-center gap-1 text-sm" href={(profile as any).twitter} target="_blank" rel="noreferrer">
                    <LinkIcon className="w-3.5 h-3.5" /> Twitter
                  </a>
                )}
                {!profile?.resumeUrl && !profile?.linkedIn && !profile?.github && (
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

            {isFaculty && (
              <div>
                <div className="text-sm font-medium text-gray-800 mb-1">Expertise</div>
                <div className="flex flex-wrap gap-2">
                  {((profile?.expertise || []) as string[]).length === 0 && (
                    <div className="text-sm text-gray-500">No expertise added yet.</div>
                  )}
                  {((profile?.expertise || []) as string[]).map((s) => (
                    <div key={s} className="flex items-center gap-1">
                      <Badge variant="muted" className="inline-flex items-center gap-1 shadow-sm">
                        <Tag className="w-3 h-3" /> {s}
                      </Badge>
                      <button
                        aria-label={`Remove ${s}`}
                        className="text-gray-400 hover:text-gray-700"
                        onClick={() => handleRemoveExpertise(s)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    placeholder="Add an expertise (press Add)"
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddExpertise();
                      }
                    }}
                  />
                  <Button onClick={handleAddExpertise} variant="secondary">Add</Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Publications (Faculty only) */}
      {isFaculty && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Publications
            </h2>
            <Button onClick={openCreatePub}>
              <Plus className="w-4 h-4 mr-2" /> Add Publication
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {pubsLoading && (
              <Card>
                <CardContent className="p-6 text-sm text-gray-600">Loading publications...</CardContent>
              </Card>
            )}
            {!pubsLoading && myPubs.length === 0 && (
              <Card>
                <CardContent className="p-6 text-sm text-gray-600">No publications yet. Click "Add Publication" to create one.</CardContent>
              </Card>
            )}
            {!pubsLoading && myPubs.map((pub) => (
              <Card key={pub.id}>
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="font-medium text-gray-900">
                      {pub.link ? (
                        <a href={pub.link} target="_blank" rel="noreferrer" className="hover:underline inline-flex items-center gap-1">
                          {pub.title}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        pub.title
                      )}
                    </div>
                    <div className="text-sm text-gray-700">Year: {pub.year}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => openEditPub(pub)}>
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
                          <AlertDialogTitle>Delete publication?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the publication "{pub.title}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeletePub(pub.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Setup Profile Dialog (first-time) */}
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

      {/* Edit Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your year, bio, links, contact info, and college member ID.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {!isFacultyOrAdmin && (
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" type="number" min={1} max={10} value={profileForm.year} onChange={(e) => setProfileForm((p) => ({ ...p, year: e.target.value }))} />
                </div>
              )}
              {!isFacultyOrAdmin && (
                <div>
                  <Label htmlFor="resume">Resume URL</Label>
                  <Input id="resume" placeholder="https://link-to-your-resume.pdf" value={profileForm.resume} onChange={(e) => setProfileForm((p) => ({ ...p, resume: e.target.value }))} />
                </div>
              )}
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
                <Textarea id="contactInfo" rows={3} placeholder="Preferred contact details (e.g., office hours, phone/email)" value={profileForm.contactInfo} onChange={(e) => setProfileForm((p) => ({ ...p, contactInfo: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="collegeMemberId">College Member ID</Label>
                <Input id="collegeMemberId" placeholder="e.g., faculty/member ID" value={profileForm.collegeMemberId} onChange={(e) => setProfileForm((p) => ({ ...p, collegeMemberId: e.target.value }))} />
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

      {/* Publication Create/Edit Dialog */}
      <Dialog open={pubOpen} onOpenChange={(open) => { setPubOpen(open); if (!open) resetPubForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPub ? 'Edit Publication' : 'Add Publication'}</DialogTitle>
            <DialogDescription>{editingPub ? 'Update the publication details' : 'Create a new publication record'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitPublication} className="space-y-3">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={pubForm.title} onChange={(e) => setPubForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="year">Year *</Label>
                <Input id="year" type="number" min={1900} max={3000} value={pubForm.year} onChange={(e) => setPubForm((p) => ({ ...p, year: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="link">Link</Label>
                <Input id="link" value={pubForm.link} onChange={(e) => setPubForm((p) => ({ ...p, link: e.target.value }))} />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" /> {editingPub ? 'Save Changes' : 'Create Publication'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
