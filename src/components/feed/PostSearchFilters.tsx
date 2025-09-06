'use client';

import { useState } from 'react';
import { Search, Filter, Calendar, User, Hash, X, ChevronDown } from 'lucide-react';
import { networkApi } from '@/lib/networkApi';

interface SearchFilters {
  postTypes: string[];
  dateRange: { from: string; to: string } | null;
  authorId: string | null;
  tags: string[];
}

interface PostSearchFiltersProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  filters: SearchFilters;
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>;
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  isSearching: boolean;
}

const POST_TYPES = [
  { value: 'GENERAL', label: 'General' },
  { value: 'COLLABORATION', label: 'Collaboration' },
  { value: 'PROJECT_UPDATE', label: 'Project Update' },
  { value: 'EVENT', label: 'Event' },
  { value: 'ANNOUNCEMENT', label: 'Announcement' }
];

export default function PostSearchFilters({ 
  onSearch, 
  searchQuery, 
  setSearchQuery, 
  filters, 
  setFilters, 
  showFilters, 
  setShowFilters, 
  isSearching 
}: PostSearchFiltersProps) {
  const [newTag, setNewTag] = useState('');

  const handleSearch = () => {
    onSearch(searchQuery, filters);
  };

  const handleClear = () => {
    setSearchQuery('');
    setFilters({
      postTypes: [],
      dateRange: { from: '', to: '' },
      authorId: '',
      tags: []
    });
    setNewTag('');
  };

  const handlePostTypeToggle = (type: string) => {
    setFilters((prev: SearchFilters) => ({
      ...prev,
      postTypes: prev.postTypes.includes(type)
        ? prev.postTypes.filter((t: string) => t !== type)
        : [...prev.postTypes, type]
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !filters.tags.includes(newTag.trim())) {
      setFilters((prev: SearchFilters) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFilters((prev: SearchFilters) => ({
      ...prev,
      tags: prev.tags.filter((tag: string) => tag !== tagToRemove)
    }));
  };

  const hasActiveFilters = 
    filters.postTypes.length > 0 || 
    (filters.dateRange?.from) || 
    (filters.dateRange?.to) || 
    filters.authorId || 
    filters.tags.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
      {/* Search Bar */}
      <div className="flex space-x-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search posts, content, authors..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 border rounded-lg flex items-center space-x-2 transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-5 h-5" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
              {filters.postTypes.length + (filters.dateRange?.from ? 1 : 0) + (filters.authorId ? 1 : 0) + filters.tags.length}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
        <button
          onClick={handleSearch}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Search
        </button>
        {(searchQuery || hasActiveFilters) && (
          <button
            onClick={handleClear}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          {/* Post Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post Types
            </label>
            <div className="flex flex-wrap gap-2">
              {POST_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handlePostTypeToggle(type.value)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    filters.postTypes.includes(type.value)
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="flex space-x-3">
              <div className="flex-1">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={filters.dateRange?.from || ''}
                    onChange={(e) => setFilters((prev: SearchFilters) => ({
                      ...prev,
                      dateRange: {
                        from: e.target.value,
                        to: prev.dateRange?.to || ''
                      }
                    }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="From date"
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={filters.dateRange?.to || ''}
                    onChange={(e) => setFilters((prev: SearchFilters) => ({
                      ...prev,
                      dateRange: {
                        from: prev.dateRange?.from || '',
                        to: e.target.value
                      }
                    }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="To date"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Author Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Author
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.authorId || ''}
                onChange={(e) => setFilters((prev: SearchFilters) => ({ ...prev, authorId: e.target.value }))}
                placeholder="Search by author name or ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="space-y-3">
              {filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Add a tag to filter by..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
