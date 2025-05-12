interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    isConnected: () => boolean;
    request: (args: { method: string; params?: any }) => Promise<any>;
    on: (event: string, callback: (...args: any[]) => void) => void;
    removeListener: (event: string, callback: (...args: any[]) => void) => void;
  };
  solana?: {
    isPhantom?: boolean;
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    disconnect: () => Promise<void>;
    request: (args: { method: string; params?: any }) => Promise<any>;
    connection: {
      getNetwork: () => Promise<string>;
    };
  };
} 