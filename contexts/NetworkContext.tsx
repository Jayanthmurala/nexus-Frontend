import React, { createContext, useContext } from 'react';
import { NetworkApiClient } from '../lib/network-service/api-client';
import { networkClient } from '../lib/network-client';

interface NetworkContextType {
  client: NetworkApiClient;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <NetworkContext.Provider value={{ client: networkClient }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetworkClient = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetworkClient must be used within a NetworkProvider');
  }
  return context;
};
