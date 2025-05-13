import { TOKENS } from '../constants/config';

const COINGECKO_IDS: Record<string, string> = {
  ETH: 'ethereum',
  SOL: 'solana',
  USDC: 'usd-coin',
  USDT: 'tether',
};

export async function getTokenPrice(token: keyof typeof TOKENS): Promise<number> {
  const id = COINGECKO_IDS[token];
  if (!id) throw new Error('Token not supported for price lookup');

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`
    );
    const data = await res.json();
    if (data && data[id] && data[id].usd) {
      return data[id].usd;
    }
    throw new Error('Invalid price data');
  } catch (e) {
    // fallback to mock prices
    const mockPrices: Record<keyof typeof TOKENS, number> = {
      ETH: 2000,
      SOL: 100,
      USDC: 1,
      USDT: 1,
    };
    return mockPrices[token];
  }
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