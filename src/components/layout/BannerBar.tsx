'use client';

import React from 'react';
import { X, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { hideBanner } from '@/store/slices/bannerSlice';

const variantStyles: Record<string, { container: string; icon: React.ReactNode }> = {
  info: {
    container: 'bg-sky-50 text-sky-800 border-sky-200',
    icon: <Info className="w-4 h-4" />,
  },
  success: {
    container: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: <CheckCircle2 className="w-4 h-4" />,
  },
  warning: {
    container: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  error: {
    container: 'bg-rose-50 text-rose-800 border-rose-200',
    icon: <AlertCircle className="w-4 h-4" />,
  },
};

export default function BannerBar() {
  const dispatch = useAppDispatch();
  const { visible, message, variant } = useAppSelector((s) => s.banner);

  if (!visible || !message) return null;

  const styles = variantStyles[variant] ?? variantStyles.info;

  return (
    <div className={`w-full border-b ${styles.container}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2 text-sm">
          <div className="flex items-center gap-2">
            {styles.icon}
            <span className="font-medium">{message}</span>
          </div>
          <button
            aria-label="Dismiss banner"
            onClick={() => dispatch(hideBanner())}
            className="p-1 rounded hover:bg-white/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
