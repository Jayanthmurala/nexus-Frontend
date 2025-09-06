'use client';

import React, { useState } from 'react';
import { 
  X, 
  Award, 
  Eye, 
  EyeOff, 
  Share, 
  Edit3,
  Check,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Post, BadgeData } from '@/types/post';
import { networkApi } from '@/lib/networkApi';
import toast from 'react-hot-toast';

interface BadgeNotificationModalProps {
  badgeData: BadgeData;
  draftPost: Post;
  onClose: () => void;
  onPublish: (postId: string, customContent?: string) => void;
  onKeepDraft: () => void;
}

const BadgeNotificationModal: React.FC<BadgeNotificationModalProps> = ({
  badgeData,
  draftPost,
  onClose,
  onPublish,
  onKeepDraft
}) => {
  const [customContent, setCustomContent] = useState(draftPost.content);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showCustomContent, setShowCustomContent] = useState(false);

  const rarityColors = {
    common: {
      gradient: 'from-gray-400 to-gray-600',
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800'
    },
    rare: {
      gradient: 'from-blue-400 to-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800'
    },
    epic: {
      gradient: 'from-purple-400 to-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-800'
    },
    legendary: {
      gradient: 'from-yellow-400 to-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800'
    }
  };

  const colors = rarityColors[badgeData.rarity];

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await onPublish(draftPost.id, showCustomContent ? customContent : undefined);
      toast.success('Badge achievement shared with the community!');
      onClose();
    } catch (error) {
      toast.error('Failed to publish badge post');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleKeepDraft = () => {
    onKeepDraft();
    toast.success('Badge post saved as draft');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="relative p-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-4"
          >
            <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-3xl text-white shadow-lg`}>
              {badgeData.icon}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              🎉 Badge Earned!
            </h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {badgeData.name}
            </h3>
            <p className="text-gray-600 mb-4">
              {badgeData.description}
            </p>
            <div className="flex items-center justify-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${colors.bg} ${colors.text} ${colors.border} border`}>
                {badgeData.rarity}
              </span>
              {badgeData.criteria && (
                <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                  {badgeData.criteria}
                </span>
              )}
            </div>
          </motion.div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-6">
          {/* Auto-generated post preview */}
          <div className={`p-4 rounded-lg ${colors.bg} ${colors.border} border`}>
            <div className="flex items-center space-x-2 mb-3">
              <Share className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Auto-generated post preview:
              </span>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-gray-800 leading-relaxed">
                {showCustomContent ? customContent : draftPost.content}
              </p>
            </div>
          </div>

          {/* Customize content option */}
          <div>
            <button
              onClick={() => setShowCustomContent(!showCustomContent)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span className="text-sm font-medium">
                {showCustomContent ? 'Use auto-generated content' : 'Customize your message'}
              </span>
            </button>

            <AnimatePresence>
              {showCustomContent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3"
                >
                  <textarea
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    placeholder="Share your thoughts about this achievement..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Options explanation */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <Share className="w-3 h-3 text-green-600" />
                </div>
              </div>
              <div>
                <h4 className="font-medium text-green-800">Share with Community</h4>
                <p className="text-sm text-green-700">
                  Post will be visible to your college network and celebrate your achievement
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <EyeOff className="w-3 h-3 text-gray-600" />
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Keep as Draft</h4>
                <p className="text-sm text-gray-700">
                  Save privately - you can share it later from your drafts
                </p>
              </div>
            </div>
          </div>

          {/* Privacy notice */}
          <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Privacy Note</p>
              <p>
                Badge achievements are automatically created as draft posts. 
                You control whether to share them publicly or keep them private.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleKeepDraft}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <EyeOff className="w-4 h-4" />
            <span>Keep as Draft</span>
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className={`flex items-center space-x-2 px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 bg-gradient-to-r ${colors.gradient} hover:opacity-90`}
          >
            {isPublishing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Award className="w-4 h-4" />
                </motion.div>
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Share className="w-4 h-4" />
                <span>Share Achievement</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BadgeNotificationModal;
