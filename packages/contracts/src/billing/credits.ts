export const CREDITS_PER_USD = 1_000_000;
export const CENTS_PER_USD = 100;

export function usdToCredits(usd: number): number {
  return Math.ceil(usd * CREDITS_PER_USD);
}

export function creditsToUsd(credits: number): number {
  return Math.max(0, credits) / CREDITS_PER_USD;
}

export function creditsToCents(credits: number): number {
  return Math.floor(creditsToUsd(credits) * CENTS_PER_USD);
}
