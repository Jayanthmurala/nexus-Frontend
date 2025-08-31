'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  ExternalLink, 
  Plus, 
  Edit3, 
  Trash2, 
  Calendar,
  Star,
  TrendingUp,
  Filter,
  Search,
  Award,
  X,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Publication {
  id: string;
  userId: string;
  title: string;
  link?: string;
  year: number;
  journal?: string;
  authors?: string[];
  abstract?: string;
  createdAt?: string;
}

interface FacultyPublicationsTabProps {
  publications: Publication[];
  isOwnProfile: boolean;
  loading?: boolean;
  onAddPublication?: (publication: Omit<Publication, 'id' | 'userId'>) => Promise<void>;
  onUpdatePublication?: (id: string, publication: Partial<Publication>) => Promise<void>;
  onDeletePublication?: (id: string) => Promise<void>;
}

export default function FacultyPublicationsTab({ 
  publications, 
  isOwnProfile, 
  loading = false,
  onAddPublication,
  onUpdatePublication,
  onDeletePublication
}: FacultyPublicationsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [sortBy, setSortBy] = useState<'year' | 'title'>('year');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null);

  // Get unique years and sort descending
  const years = Array.from(new Set(publications.map(pub => pub.year)))
    .sort((a, b) => b - a);

  // Filter and sort publications
  const filteredPublications = publications
    .filter(pub => {
      const matchesSearch = pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pub.journal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pub.authors?.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesYear = !selectedYear || pub.year.toString() === selectedYear;
      return matchesSearch && matchesYear;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'year':
          return b.year - a.year;
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  // Group publications by year
  const publicationsByYear = filteredPublications.reduce((acc, pub) => {
    const year = pub.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(pub);
    return acc;
  }, {} as Record<number, Publication[]>);

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

  const PublicationSkeleton = () => (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="space-y-4">
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
        {Array.from({ length: 5 }).map((_, index) => (
          <PublicationSkeleton key={index} />
        ))}
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
      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">{publications.length}</div>
              <div className="text-purple-100">Publications</div>
            </div>
            <FileText className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">
                {publications.length > 0 ? Math.round(publications.reduce((sum, pub) => sum + pub.year, 0) / publications.length) : 0}
              </div>
              <div className="text-amber-100">Average Year</div>
            </div>
            <Calendar className="w-8 h-8 text-amber-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold">
                {years.length}
              </div>
              <div className="text-emerald-100">Years Active</div>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-200" />
          </div>
        </div>
      </motion.div>

      {/* Header with filters */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex-1 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search publications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Year filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="">All Years</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          {/* Sort by */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'year' | 'title')}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="year">Sort by Year</option>
            <option value="title">Sort by Title</option>
          </select>
        </div>

        {/* Add publication button */}
        {isOwnProfile && (
          <motion.button
            onClick={() => setShowAddModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Add Publication
          </motion.button>
        )}
      </motion.div>

      {/* Publications */}
      {filteredPublications.length === 0 ? (
        <motion.div variants={itemVariants} className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedYear ? 'No publications found' : 'No publications yet'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || selectedYear 
              ? 'Try adjusting your search or filters'
              : 'Start adding your research publications and papers!'
            }
          </p>
          {isOwnProfile && !searchTerm && !selectedYear && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Your First Publication
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} className="space-y-8">
          <AnimatePresence>
            {Object.entries(publicationsByYear)
              .sort(([a], [b]) => parseInt(b) - parseInt(a))
              .map(([year, yearPublications]) => (
                <motion.div
                  key={year}
                  variants={itemVariants}
                  layout
                  className="space-y-4"
                >
                  {/* Year header */}
                  <div className="flex items-center gap-4">
                    <h3 className="text-2xl font-bold text-gray-900">{year}</h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {yearPublications.length} publication{yearPublications.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Publications for this year */}
                  <div className="space-y-4">
                    {yearPublications.map((publication) => (
                      <motion.div
                        key={publication.id}
                        whileHover={{ y: -2, transition: { duration: 0.2 } }}
                        className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                              {publication.title}
                            </h4>

                            {publication.authors && (
                              <p className="text-gray-600 text-sm mb-2">
                                {publication.authors.join(', ')}
                              </p>
                            )}

                            {publication.journal && (
                              <p className="text-purple-600 font-medium text-sm mb-3">
                                {publication.journal}
                              </p>
                            )}

                            {publication.abstract && (
                              <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                                {publication.abstract}
                              </p>
                            )}


                            {/* Footer */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {publication.year}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {publication.link && (
                                  <a
                                    href={publication.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                                
                                {isOwnProfile && (
                                  <>
                                    <button
                                      onClick={() => setEditingPublication(publication)}
                                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => onDeletePublication?.(publication.id)}
                                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Add Publication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <PublicationForm
              onSubmit={async (data) => {
                await onAddPublication?.(data);
                setShowAddModal(false);
              }}
              onCancel={() => setShowAddModal(false)}
            />
          </motion.div>
        </div>
      )}

      {/* Edit Publication Modal */}
      {editingPublication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <PublicationForm
              publication={editingPublication}
              onSubmit={async (data) => {
                await onUpdatePublication?.(editingPublication.id, data);
                setEditingPublication(null);
              }}
              onCancel={() => setEditingPublication(null)}
            />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

// Publication Form Component
interface PublicationFormProps {
  publication?: Publication;
  onSubmit: (data: Omit<Publication, 'id' | 'userId'>) => Promise<void>;
  onCancel: () => void;
}

function PublicationForm({ publication, onSubmit, onCancel }: PublicationFormProps) {
  const [formData, setFormData] = useState({
    title: publication?.title || '',
    link: publication?.link || '',
    year: publication?.year || new Date().getFullYear(),
    journal: publication?.journal || '',
    authors: publication?.authors?.join(', ') || '',
    abstract: publication?.abstract || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: formData.title.trim(),
        link: formData.link.trim() || undefined,
        year: formData.year,
        journal: formData.journal.trim() || undefined,
        authors: formData.authors.trim() ? formData.authors.split(',').map(a => a.trim()) : undefined,
        abstract: formData.abstract.trim() || undefined
      });
      toast.success(publication ? 'Publication updated!' : 'Publication added!');
    } catch (error) {
      toast.error(publication ? 'Failed to update publication' : 'Failed to add publication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">
          {publication ? 'Edit Publication' : 'Add Publication'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter publication title"
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
              min="1900"
              max={new Date().getFullYear() + 10}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Journal/Conference</label>
            <input
              type="text"
              value={formData.journal}
              onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
              placeholder="e.g., Nature, IEEE Transactions"
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Authors</label>
          <input
            type="text"
            value={formData.authors}
            onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
            placeholder="Enter authors separated by commas"
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Link</label>
          <input
            type="url"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            placeholder="https://..."
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Abstract</label>
          <textarea
            value={formData.abstract}
            onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
            placeholder="Enter publication abstract..."
            rows={4}
            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {publication ? 'Update Publication' : 'Add Publication'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
