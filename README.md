# Crypto Invoice App

A minimal crypto invoice app built with React, TypeScript, and Web3 technologies. Supports Ethereum (Sepolia) and Solana (devnet) payments with automatic $1 fee forwarding.

## Features

- Create and share crypto invoices
- Support for ETH, SOL, USDC, and USDT payments
- Automatic $1 fee forwarding to a designated wallet
- Testnet-only support (Sepolia & Solana devnet)
- Wallet connection (MetaMask & Phantom)
- QR code payment support

## Prerequisites

- Node.js (v16 or higher)
- MetaMask or Phantom wallet
- Sepolia ETH for testing
- Solana devnet SOL for testing

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd crypto-invoice
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
VITE_SEPOLIA_RPC_URL=your_sepolia_rpc_url
VITE_PRIVATE_KEY=your_deployer_private_key
VITE_FEE_WALLET_ADDRESS=your_fee_wallet_address
```

4. Deploy the smart contract:
```bash
node src/contracts/deploy.cjs
```

5. Update the contract address in `src/constants/config.ts` with the deployed contract address.

6. Start the development server:
```bash
npm run dev
```

## Usage

1. Connect your wallet (MetaMask for Ethereum, Phantom for Solana)
2. Create a new invoice by filling out the form
3. Share the invoice link with your client
4. Client can pay using the QR code or "Pay Invoice" button
5. The $1 fee is automatically forwarded to the fee wallet

## Development

- `src/components/` - React components
- `src/pages/` - Page components
- `src/store/` - Zustand store
- `src/contracts/` - Smart contract and deployment script
- `src/lib/` - Utility functions
- `src/constants/` - Configuration and constants

## Testing

The app is configured to work with testnets only:
- Ethereum Sepolia
- Solana Devnet

Make sure your wallet is connected to the correct network before testing.

## License

MIT
