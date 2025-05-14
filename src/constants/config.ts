export const NETWORKS = {
  ETHEREUM: {
    SEPOLIA: {
      chainId: '0xaa36a7',
      chainName: 'Sepolia Test Network',
      rpcUrl: 'https://sepolia.infura.io/v3/your-infura-key',
      blockExplorerUrl: 'https://sepolia.etherscan.io',
    },
  },
  SOLANA: {
    DEVNET: {
      endpoint: 'https://api.devnet.solana.com',
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
export const CONTRACT_ADDRESS = '0x239eAe057A14d69984E5541BdC2b318cc514D6B2';

// Fee wallet addresses
export const FEE_WALLET_ADDRESS = {
  ETHEREUM: '0x...', // Your Ethereum fee wallet address
  SOLANA: 'kVJuCqWmoFowzAiGpFD7AFrrbL1U5bZpSnDDQwrJ39r' // Solana fee wallet address
}; 