"use client";

import type { CredentialType } from "./stellar";

export interface ClaimParams {
  threshold_years?: string;
  threshold?: string;
  restricted?: string[];
  /** "0" = denylist/block (default), "1" = allowlist/allow */
  mode?: string;
}

export interface Credential {
  type: CredentialType;
  title: string;
  claim: string;
  issuer: string;
  issuerId: string;
  holder: string;
  value: string;
  salt: string;
  commitment: string;
  sig: number[];
  issuerPubX: number[];
  issuerPubY: number[];
  issuedAt: number;
  expiry: string;
  /**
   * Issuer-attested tenure (years), set on `employment` credentials so the
   * holder can prove `seniority >= min_seniority` against the issuer's signed
   * commitment. Required for employment; absent for other types.
   */
  seniority?: string;
  /** Protocol-specific proof parameters (e.g. age threshold, restricted list). */
  claimParams?: ClaimParams;
  /** Unix timestamp (seconds) when the proof was last successfully submitted. */
  provedAt?: number;
  /** Transaction hash of the last submitted proof. */
  provedTxHash?: string;
}

export const TYPE_META: Record<
  CredentialType,
  { title: string; claim: string; issuable: boolean; attribute?: string }
> = {
  kyc: { title: "KYC Complete", claim: "identity verified", issuable: true },
  age: {
    title: "Age Verified",
    claim: "age ≥ 18",
    issuable: true,
    attribute: "Date of birth",
  },
  income: {
    title: "Accredited (Income)",
    claim: "income > $200,000",
    issuable: true,
    attribute: "Annual income (USD)",
  },
  jurisdiction: {
    title: "Jurisdiction Eligible",
    claim: "country not restricted",
    issuable: true,
    attribute: "Country (ISO numeric)",
  },
  funds: {
    title: "Proof of Funds",
    claim: "balance > $10,000",
    issuable: true,
    attribute: "Account balance (USD)",
  },
  accreditation: {
    title: "Accredited Investor",
    claim: "net worth ≥ $1,000,000",
    issuable: true,
    attribute: "Net worth (USD)",
  },
  employment: {
    title: "Employed",
    claim: "employed, seniority ≥ 3",
    issuable: true,
    attribute: "Seniority (years)",
  },
};

// BN254 scalar field is ~254 bits; 31 random bytes (248 bits) is always in range.
export function randomField(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(31));
  return (
    "0x" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

// ---- At-rest encryption (AES-256-GCM) ---------------------------------------

const STORE_KEY = "stellarcred:credentials";
const ENC_KEY_STORE = "stellarcred:cred-enc-key";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// TS 5.9+ types Uint8Array.slice() as Uint8Array<ArrayBufferLike> which
// is not assignable to WebCrypto's BufferSource (needs <ArrayBuffer>).
// fromBase64 always uses `new Uint8Array(n)` (never SharedArrayBuffer), so
// the cast is safe.
function toAB(u8: Uint8Array): Uint8Array<ArrayBuffer> {
  return u8 as unknown as Uint8Array<ArrayBuffer>;
}

async function getEncryptionKey(): Promise<CryptoKey> {
  try {
    const stored = sessionStorage.getItem(ENC_KEY_STORE);
    if (stored) {
      const raw = fromBase64(stored);
      return crypto.subtle.importKey(
        "raw",
        toAB(raw),
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"],
      );
    }
  } catch {
    sessionStorage.removeItem(ENC_KEY_STORE);
    localStorage.removeItem(STORE_KEY);
  }

  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", key));
  sessionStorage.setItem(ENC_KEY_STORE, toBase64(raw));

  return key;
}

async function encryptBlob(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded),
  );

  const combined = new Uint8Array(iv.length + ciphertext.length);
  combined.set(iv);
  combined.set(ciphertext, iv.length);

  return toBase64(combined);
}

async function decryptBlob(ciphertextB64: string): Promise<string> {
  const key = await getEncryptionKey();
  const combined = fromBase64(ciphertextB64);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toAB(iv) },
    key,
    toAB(ciphertext),
  );

  return new TextDecoder().decode(decrypted);
}

// ---- Local wallet (this browser) --------------------------------------------

export async function loadCredentials(): Promise<Credential[]> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const decrypted = await decryptBlob(raw);
    return JSON.parse(decrypted);
  } catch {
    return [];
  }
}

export async function saveCredential(cred: Credential): Promise<Credential[]> {
  const all = await loadCredentials();
  const next = [
    cred,
    ...all.filter(
      (c) => !(c.type === cred.type && c.commitment === cred.commitment),
    ),
  ];
  localStorage.setItem(STORE_KEY, await encryptBlob(JSON.stringify(next)));
  return next;
}

export async function markProved(commitment: string, txHash: string): Promise<Credential[]> {
  const all = await loadCredentials();
  const next = all.map((c) =>
    c.commitment === commitment
      ? { ...c, provedAt: Math.floor(Date.now() / 1000), provedTxHash: txHash }
      : c,
  );
  localStorage.setItem(STORE_KEY, await encryptBlob(JSON.stringify(next)));
  return next;
}

/** Mark multiple credentials as proved in a single localStorage write. */
export async function markAllProved(
  commitments: string[],
  txHash: string,
): Promise<Credential[]> {
  const set = new Set(commitments);
  const now = Math.floor(Date.now() / 1000);
  const all = await loadCredentials();
  const next = all.map((c) =>
    set.has(c.commitment) ? { ...c, provedAt: now, provedTxHash: txHash } : c,
  );
  localStorage.setItem(STORE_KEY, await encryptBlob(JSON.stringify(next)));
  return next;
}

export async function removeCredential(commitment: string): Promise<Credential[]> {
  const all = await loadCredentials();
  const next = all.filter((c) => c.commitment !== commitment);
  localStorage.setItem(STORE_KEY, await encryptBlob(JSON.stringify(next)));
  return next;
}

export function parseCredential(json: string): Credential {
  const c = JSON.parse(json);
  if (
    !c.type ||
    c.value === undefined ||
    !c.commitment ||
    !c.issuerId ||
    !c.sig
  ) {
    throw new Error(
      "Not a valid credential (missing type, value, commitment, issuerId, or sig).",
    );
  }
  return c as Credential;
}
