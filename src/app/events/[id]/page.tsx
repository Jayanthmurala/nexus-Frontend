import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import EventDetailClient from '@/components/events/EventDetailClient';

export default function EventDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/events" className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>
      </div>
      <EventDetailClient id={params.id} />
    </div>
  );
}
