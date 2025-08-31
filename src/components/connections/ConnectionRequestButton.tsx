'use client';

import React, { useState } from 'react';
import { UserPlus, UserCheck, Clock, X } from 'lucide-react';
import { sendConnectionRequest } from '@/lib/connectionsApi';
import { toast } from 'react-hot-toast';

interface ConnectionRequestButtonProps {
  userId: string;
  currentStatus?: 'none' | 'sent' | 'connected' | 'received';
  onStatusChange?: (newStatus: 'sent' | 'connected') => void;
  className?: string;
}

export default function ConnectionRequestButton({ 
  userId, 
  currentStatus = 'none', 
  onStatusChange,
  className = '' 
}: ConnectionRequestButtonProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState('');

  const handleSendRequest = async () => {
    if (status !== 'none') return;
    
    setLoading(true);
    try {
      await sendConnectionRequest(userId, note.trim() || undefined);
      setStatus('sent');
      onStatusChange?.('sent');
      toast.success('Connection request sent!');
      setShowNoteInput(false);
      setNote('');
    } catch (error) {
      console.error('Failed to send connection request:', error);
      toast.error('Failed to send connection request');
    } finally {
      setLoading(false);
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <UserCheck className="w-4 h-4" />,
          text: 'Connected',
          className: 'bg-green-100 text-green-700 cursor-default',
          disabled: true
        };
      case 'sent':
        return {
          icon: <Clock className="w-4 h-4" />,
          text: 'Request Sent',
          className: 'bg-yellow-100 text-yellow-700 cursor-default',
          disabled: true
        };
      case 'received':
        return {
          icon: <UserPlus className="w-4 h-4" />,
          text: 'Respond to Request',
          className: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
          disabled: false
        };
      default:
        return {
          icon: <UserPlus className="w-4 h-4" />,
          text: 'Connect',
          className: 'bg-blue-600 text-white hover:bg-blue-700',
          disabled: loading
        };
    }
  };

  const buttonContent = getButtonContent();

  if (showNoteInput && status === 'none') {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={200}
          />
          <button
            onClick={() => {
              setShowNoteInput(false);
              setNote('');
            }}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSendRequest}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        if (status === 'none') {
          setShowNoteInput(true);
        }
      }}
      disabled={buttonContent.disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${buttonContent.className} ${className}`}
    >
      {buttonContent.icon}
      {buttonContent.text}
    </button>
  );
}
