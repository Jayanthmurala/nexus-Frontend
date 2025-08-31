'use client';

import httpNetwork from './httpNetwork';

export interface ConnectionRequest {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED' | 'BLOCKED';
  note?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface Connection {
  userId: string;
  connectedAt: string;
}

export interface ListConnectionsResponse {
  items: Connection[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface ListConnectionRequestsResponse {
  items: ConnectionRequest[];
  nextCursor?: string;
  hasMore: boolean;
}

// Send connection request
export async function sendConnectionRequest(addresseeId: string, note?: string): Promise<{ ok: boolean; requestId: string }> {
  const { data } = await httpNetwork.post('/v1/connections/request', { addresseeId, note });
  return data;
}

// Get received connection requests
export async function getReceivedRequests(params?: {
  cursor?: string;
  limit?: number;
}): Promise<ListConnectionRequestsResponse> {
  const { data } = await httpNetwork.get('/v1/connections/requests/received', { params });
  return data;
}

// Get sent connection requests
export async function getSentRequests(params?: {
  cursor?: string;
  limit?: number;
}): Promise<ListConnectionRequestsResponse> {
  const { data } = await httpNetwork.get('/v1/connections/requests/sent', { params });
  return data;
}

// Accept connection request
export async function acceptConnectionRequest(requestId: string): Promise<{ ok: boolean; connected: boolean }> {
  const { data } = await httpNetwork.put(`/v1/connections/requests/${requestId}/accept`);
  return data;
}

// Reject connection request
export async function rejectConnectionRequest(requestId: string): Promise<{ ok: boolean; rejected: boolean }> {
  const { data } = await httpNetwork.put(`/v1/connections/requests/${requestId}/reject`);
  return data;
}

// Get connections list
export async function getConnections(params?: {
  cursor?: string;
  limit?: number;
}): Promise<ListConnectionsResponse> {
  const { data } = await httpNetwork.get('/v1/connections', { params });
  return data;
}

// Remove connection
export async function removeConnection(userId: string): Promise<{ ok: boolean; removed: boolean }> {
  const { data } = await httpNetwork.delete(`/v1/connections/${userId}`);
  return data;
}

export default {
  sendConnectionRequest,
  getReceivedRequests,
  getSentRequests,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getConnections,
  removeConnection
};
