export const NETWORKS = {
  ETHEREUM: {
    SEPOLIA: {
      chainId: '0xaa36a7',
      chainName: 'Sepolia',
      rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
      blockExplorerUrl: 'https://sepolia.etherscan.io',
    },
  },
  SOLANA: {
    DEVNET: {
      endpoint: 'https://api.devnet.solana.com',
      chainName: 'Solana Devnet',
    },
  },
};

export const TOKENS = {
  ETH: {
    symbol: 'ETH',
    decimals: 18,
    name: 'Ethereum',
  },
  SOL: {
    symbol: 'SOL',
    decimals: 9,
    name: 'Solana',
  },
  USDC: {
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
  },
  USDT: {
    symbol: 'USDT',
    decimals: 6,
    name: 'Tether USD',
  },
};

// Update this with your deployed contract address
export const CONTRACT_ADDRESS = '0x778A4782d7ca3d7DA31e0Af0f95b364Eb65F9a36';

// Update this with your fee wallet address
export const FEE_WALLET_ADDRESS = '0x5ADBB0Cb192e71b20be1435abd11447FBD4E4A85'; 