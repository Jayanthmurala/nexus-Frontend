'use client';

import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full border-t bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between text-xs text-gray-500">
        <p>
          © {new Date().getFullYear()} Nexus. All rights reserved.
        </p>
        <div className="hidden sm:flex items-center gap-4">
          <a href="#" className="hover:text-gray-700">Privacy</a>
          <a href="#" className="hover:text-gray-700">Terms</a>
          <a href="#" className="hover:text-gray-700">Support</a>
        </div>
      </div>
    </footer>
  );
}
