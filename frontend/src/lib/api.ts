import type { PasswordAnalysis } from '../types';

/**
 * Sends password to Flask backend for analysis.
 * SECURITY: The password is sent over localhost only (never the internet).
 * The backend analyzes it and immediately discards it — no persistence.
 */
export async function analyzePassword(password: string): Promise<PasswordAnalysis> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    throw new Error('Analysis request failed');
  }

  return response.json();
}

/**
 * Have I Been Pwned breach check using k-anonymity.
 * SECURITY: Only the first 5 characters of the SHA-1 hash are ever transmitted.
 * The real password NEVER leaves the browser for this check.
 *
 * How it works:
 * 1. SHA-1 hash the password entirely in the browser (Web Crypto API)
 * 2. Send only the first 5 hex chars (the "prefix") to HIBP
 * 3. HIBP returns all hashes that start with that prefix (~500 results)
 * 4. We check locally if our full hash is in that list
 * 5. If found, we know it's been breached — without HIBP ever seeing the real hash
 */
export async function runBreachCheck(
  password: string,
  analysis: PasswordAnalysis
): Promise<PasswordAnalysis & { breachCount: number }> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-1', encoder.encode(password));
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  const prefix = hashHex.slice(0, 5);
  const suffix = hashHex.slice(5);

  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  if (!response.ok) throw new Error('HIBP API unavailable');

  const text = await response.text();
  const match = text.split('\n').find(line => line.startsWith(suffix));
  const count = match ? parseInt(match.split(':')[1], 10) : 0;

  const BREACH_PREFIXES = ['No breaches', 'Extremely dangerous', 'Very unsafe', 'Unsafe —', 'Found in'];
  const cleanFeedback = analysis.feedback.filter(
    msg => !BREACH_PREFIXES.some(p => msg.startsWith(p))
  );

  if (count === 0) {
    return {
      ...analysis,
      breachCount: 0,
      feedback: ['No breaches found for this password.', ...cleanFeedback],
    };
  }

  let penalty: number;
  let message: string;

  if (count >= 1_000_000) {
    penalty = 100;
    message = `Extremely dangerous — seen in ${count.toLocaleString()} breaches. Never use this.`;
  } else if (count >= 10_000) {
    penalty = 80;
    message = `Very unsafe — found in ${count.toLocaleString()} breaches. Avoid this password.`;
  } else if (count >= 100) {
    penalty = 60;
    message = `Unsafe — found in ${count.toLocaleString()} breaches. Choose something else.`;
  } else {
    penalty = 40;
    message = `Found in ${count.toLocaleString()} known breach${count === 1 ? '' : 'es'}. Consider a different password.`;
  }

  return {
    ...analysis,
    breachCount: count,
    score: Math.max(0, analysis.score - penalty),
    time_to_crack: count > 10 ? 'COMPROMISED' : analysis.time_to_crack,
    feedback: [message, ...cleanFeedback],
  };
}

/**
 * Salted SHA-256 demo — educational only.
 * Shows how salting prevents rainbow table attacks.
 * The password is hashed in-browser via Web Crypto API.
 * Result is shown as a demo — we never store this hash.
 */
export async function sha256SaltedDemo(password: string): Promise<{ saltHex: string; hashHex: string }> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);

  const encoder = new TextEncoder();
  const pwBytes = encoder.encode(password);
  const data = new Uint8Array(salt.length + pwBytes.length);
  data.set(salt, 0);
  data.set(pwBytes, salt.length);

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const toHex = (buf: Uint8Array) =>
    Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    saltHex: toHex(salt),
    hashHex: toHex(new Uint8Array(hashBuffer)),
  };
}

/**
 * Password generator — no character is ever reused.
 */
export function generateStrongPassword(length = 24): string {
  const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower   = 'abcdefghijklmnopqrstuvwxyz';
  const nums    = '0123456789';
  const special = '!@#$%&*()_+~|}{[]:;?></=';
  const all     = upper + lower + nums + special;
  const used    = new Set<string>();

  const pick = (pool: string) => {
    const available = pool.split('').filter(c => !used.has(c));
    if (!available.length) return '';
    const c = available[Math.floor(Math.random() * available.length)];
    used.add(c);
    return c;
  };

  const chars = [pick(upper), pick(lower), pick(nums), pick(special)];
  for (let i = 4; i < length; i++) {
    const c = pick(all);
    if (!c) break;
    chars.push(c);
  }

  for (let i = chars.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [chars[i], chars[j]] = [chars[j], chars[i]];
}
return chars.join('');
}

const WORD_LIST = [
  'apple','bridge','castle','dragon','eagle','forest','garden','harbor','island','jungle',
  'kettle','lantern','marble','needle','orange','palace','quartz','rocket','silver','temple',
  'umbrella','valley','walnut','xenon','yellow','zipper','anchor','basket','candle','desert',
  'engine','falcon','gravel','hunter','impact','jacket','kitten','lemon','mirror','napkin',
  'oyster','pencil','quiver','rabbit','salmon','tiger','turtle','upbeat','velvet','winter',
  'almond','breeze','cobalt','dagger','ember','flint','grotto','hollow','jasper','kelvin',
  'lunar','mystic','noble','onyx','prism','quest','riddle','scarlet','throne','ultra',
  'vortex','wilder','zenith','arcane','bloom','cipher','drift','epoch','fable','glint',
  'haven','irony','jewel','knack','lapis','maple','nexus','orbit','pixel','quirk',
  'realm','stone','thorn','unite','vivid','whirl','yearn','azure','brine','coast',
];

export function generatePassphrase(wordCount = 4): string {
  const used = new Set<number>();
  const words: string[] = [];

  while (words.length < wordCount) {
    const idx = Math.floor(Math.random() * WORD_LIST.length);
    if (!used.has(idx)) {
      used.add(idx);
      words.push(WORD_LIST[idx]);
    }
  }

  const capitalized = words.map(w => w[0].toUpperCase() + w.slice(1));
  const num = Math.floor(Math.random() * 900) + 100;
  const symbols = ['!', '@', '#', '$', '&'];
  const sym = symbols[Math.floor(Math.random() * symbols.length)];

  return `${capitalized.join('-')}${num}${sym}`;
}
