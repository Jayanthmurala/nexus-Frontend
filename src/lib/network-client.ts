/**
 * Network Client Instance
 * Pre-configured NetworkApiClient for use throughout the application
 */

import { createNetworkClient } from '@/lib/network-service/api-client';
import { getSession } from 'next-auth/react';

// Create a configured network client instance
export const networkClient = createNetworkClient({
  baseUrl: process.env.NEXT_PUBLIC_NETWORK_API_BASE_URL || 'http://localhost:4005',
  getAuthToken: () => {
    // This will be called synchronously, so we need to handle auth differently
    // For now, return null and let the components handle auth via hooks
    return null;
  }
});

// Alternative client factory that can be used with auth token
export const createAuthenticatedNetworkClient = (token: string) => {
  return createNetworkClient({
    baseUrl: process.env.NEXT_PUBLIC_NETWORK_API_BASE_URL || 'http://localhost:4005',
    getAuthToken: () => token
  });
};
