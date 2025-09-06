import { createNetworkClient } from './network-service/api-client';

export const networkClient = createNetworkClient({
  baseUrl: process.env.NEXT_PUBLIC_NETWORK_API_URL || 'http://localhost:4005',
  getAuthToken: () => {
    // For now, we'll implement basic token retrieval
    // This should be integrated with your NextAuth session
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }
});

export default networkClient;
