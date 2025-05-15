import { useState } from 'react';
import { ethers } from 'ethers';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { NETWORKS } from '../constants/config';

interface WalletConnectProps {
  onConnect: (address: string, walletType: 'ethereum' | 'solana') => void;
  onDisconnect?: () => void;
}

export const WalletConnect = ({ onConnect, onDisconnect }: WalletConnectProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedWallet, setConnectedWallet] = useState<'ethereum' | 'solana' | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  const isMetaMask = () => {
    console.log('Checking MetaMask:', { 
      hasEthereum: !!window.ethereum, 
      isMetaMask: window.ethereum?.isMetaMask 
    });
    return window.ethereum && window.ethereum.isMetaMask;
  };

  const disconnectWallet = async () => {
    try {
      if (connectedWallet === 'ethereum') {
        // For MetaMask, we can't programmatically disconnect
        // But we can clear the local state
        setConnectedWallet(null);
        setConnectedAddress(null);
        if (onDisconnect) onDisconnect();
      } else if (connectedWallet === 'solana') {
        // For Phantom, we can programmatically disconnect
        if (window.solana) {
          await window.solana.disconnect();
          setConnectedWallet(null);
          setConnectedAddress(null);
          if (onDisconnect) onDisconnect();
        }
      }
    } catch (err) {
      console.error('Disconnect error:', err);
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    }
  };

  const switchToSepolia = async (provider: ethers.providers.Web3Provider) => {
    try {
      console.log('Attempting to switch to Sepolia...');
      await provider.send('wallet_switchEthereumChain', [
        { chainId: NETWORKS.ETHEREUM.SEPOLIA.chainId },
      ]);
      console.log('Successfully switched to Sepolia');
    } catch (switchError: any) {
      console.error('Switch error:', switchError);
      if (switchError.code === 4902) {
        try {
          console.log('Adding Sepolia network...');
          await provider.send('wallet_addEthereumChain', [
            {
              chainId: NETWORKS.ETHEREUM.SEPOLIA.chainId,
              chainName: NETWORKS.ETHEREUM.SEPOLIA.chainName,
              rpcUrls: [NETWORKS.ETHEREUM.SEPOLIA.rpcUrl],
              blockExplorerUrls: [NETWORKS.ETHEREUM.SEPOLIA.blockExplorerUrl],
            },
          ]);
          console.log('Successfully added Sepolia network');
        } catch (addError) {
          console.error('Add network error:', addError);
          throw new Error('Failed to add Sepolia network to MetaMask');
        }
      } else {
        throw new Error('Failed to switch to Sepolia network');
      }
    }
  };

  const connectEthereum = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      console.log('Starting Ethereum connection...');

      if (!isMetaMask()) {
        throw new Error('Please install MetaMask to use this feature');
      }

      // Create new provider
      console.log('Creating new provider...');
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      
      // Request new connection with explicit popup
      console.log('Requesting new connection...');
      if (!window.ethereum) throw new Error('MetaMask not found');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Connected accounts:', accounts);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please connect your wallet.');
      }

      const signer = provider.getSigner();
      const address = await signer.getAddress();
      console.log('Connected address:', address);

      // Check and switch network if needed
      const network = await provider.getNetwork();
      console.log('Current network:', network);
      if (network.chainId !== 11155111) { // Sepolia chainId
        await switchToSepolia(provider);
      }

      setConnectedWallet('ethereum');
      setConnectedAddress(address);
      onConnect(address, 'ethereum');
    } catch (err) {
      console.error('Ethereum connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const connectSolana = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      console.log('Starting Solana connection...');

      if (!window.solana || !window.solana.isPhantom) {
        throw new Error('Please install Phantom wallet to use this feature');
      }

      // Add retry logic for Phantom connection
      let retries = 3;
      let lastError;

      while (retries > 0) {
        try {
          console.log(`Attempting Phantom connection (${retries} retries left)...`);
          
          // Force a new connection with explicit popup
          const resp = await window.solana.connect();
          const address = resp.publicKey.toString();
          console.log('Connected address:', address);

          // Simple network check since we're already in testnet
          console.log('Checking network...');
          const connection = new Connection(clusterApiUrl('devnet'));
          
          try {
            // Just verify we can connect to the network
            const version = await connection.getVersion();
            console.log('Connected to Solana network version:', version);
            
            // If we get here, we're successfully connected to devnet
            console.log('Successfully connected to devnet');
            setConnectedWallet('solana');
            setConnectedAddress(address);
            onConnect(address, 'solana');
            return;
          } catch (e) {
            console.error('Network check error:', e);
            throw new Error('Failed to connect to Solana devnet. Please check your network settings.');
          }
        } catch (err) {
          console.error(`Connection attempt failed:`, err);
          lastError = err;
          retries--;
          if (retries > 0) {
            console.log('Waiting before retry...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      throw lastError;
    } catch (err) {
      console.error('Solana connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {!connectedWallet ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
          <button
            onClick={connectEthereum}
            disabled={isConnecting}
            className="group flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-6 h-6 transform group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.49 4L13.54 0.9C12.62 0.5 11.58 0.5 10.66 0.9L2.71 4C1.79 4.4 1.2 5.3 1.2 6.3V17.7C1.2 18.7 1.79 19.6 2.71 20L10.66 23.1C11.58 23.5 12.62 23.5 13.54 23.1L21.49 20C22.41 19.6 23 18.7 23 17.7V6.3C23 5.3 22.41 4.4 21.49 4ZM12.1 2.5L19.5 5.5L12.1 8.5L4.7 5.5L12.1 2.5ZM3.2 7.5L10.6 10.5V21.5L3.2 18.5V7.5ZM13.6 21.5V10.5L21 7.5V18.5L13.6 21.5Z" fill="currentColor"/>
            </svg>
            <span className="font-medium">{isConnecting ? 'Connecting...' : 'Connect MetaMask'}</span>
          </button>
          <button
            onClick={connectSolana}
            disabled={isConnecting}
            className="group flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-6 h-6 transform group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-medium">{isConnecting ? 'Connecting...' : 'Connect Phantom'}</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4 w-full max-w-md">
          <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
            <div className={`w-3 h-3 rounded-full ${connectedWallet === 'ethereum' ? 'bg-blue-500 animate-pulse' : 'bg-purple-500 animate-pulse'}`} />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {connectedWallet === 'ethereum' ? 'MetaMask' : 'Phantom'} Connected
            </p>
          </div>
          <div className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl text-center shadow-md hover:shadow-lg transition-all duration-300">
            <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
              {connectedAddress?.slice(0, 6)}...{connectedAddress?.slice(-4)}
            </p>
          </div>
          <button
            onClick={disconnectWallet}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Disconnect Wallet
          </button>
        </div>
      )}
      {error && (
        <div className="w-full max-w-md px-4 py-3 bg-red-50 dark:bg-red-900/30 rounded-xl shadow-md animate-shake">
          <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
        </div>
      )}
    </div>
  );
}; 