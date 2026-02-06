// Generate cryptographically secure random codes
// Uses Web Crypto API for true randomness

const ALPHANUMERIC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars: 0, O, I, 1

export function generateSecureCode(length: number = 8): string {
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += ALPHANUMERIC[array[i] % ALPHANUMERIC.length];
  }
  
  return result;
}

export function generateSessionCode(): string {
  return generateSecureCode(8);
}

export function generateNetworkToken(): string {
  return generateSecureCode(8);
}
