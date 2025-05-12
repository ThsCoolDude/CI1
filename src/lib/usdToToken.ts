import { TOKENS } from '../constants/config';

export async function getTokenPrice(token: keyof typeof TOKENS): Promise<number> {
  // TODO: Implement price fetching from a price oracle or API
  // For now, return mock prices for testing
  const mockPrices: Record<keyof typeof TOKENS, number> = {
    ETH: 2000, // $2000 per ETH
    SOL: 100,  // $100 per SOL
    USDC: 1,   // $1 per USDC
    USDT: 1,   // $1 per USDT
  };
  return mockPrices[token];
}

export async function usdToToken(usdAmount: number, token: keyof typeof TOKENS): Promise<string> {
  const tokenPrice = await getTokenPrice(token);
  const tokenAmount = usdAmount / tokenPrice;
  const decimals = TOKENS[token].decimals;
  
  // Convert to smallest unit (wei, lamports, etc.)
  return (tokenAmount * Math.pow(10, decimals)).toFixed(0);
}

export async function tokenToUsd(tokenAmount: string, token: keyof typeof TOKENS): Promise<number> {
  const tokenPrice = await getTokenPrice(token);
  const decimals = TOKENS[token].decimals;
  
  // Convert from smallest unit to decimal
  const decimalAmount = parseFloat(tokenAmount) / Math.pow(10, decimals);
  return decimalAmount * tokenPrice;
} 