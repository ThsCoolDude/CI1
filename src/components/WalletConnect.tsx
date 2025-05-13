import { useState } from 'react';
import { ethers } from 'ethers';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { NETWORKS } from '../constants/config';

interface WalletConnectProps {
  onConnect: (address: string) => void;
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
      onConnect(address);
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
            onConnect(address);
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
    <div className="flex flex-col items-center space-y-4 p-4">
      <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
      {!connectedWallet ? (
        <div className="flex space-x-4">
          <button
            onClick={connectEthereum}
            disabled={isConnecting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </button>
          <button
            onClick={connectSolana}
            disabled={isConnecting}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {isConnecting ? 'Connecting...' : 'Connect Phantom'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-2">
          <p className="text-sm text-gray-600">
            Connected: {connectedAddress?.slice(0, 6)}...{connectedAddress?.slice(-4)}
          </p>
          <button
            onClick={disconnectWallet}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Disconnect Wallet
          </button>
        </div>
      )}
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}; 