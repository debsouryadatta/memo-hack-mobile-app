/** OWASP-recommended minimum iterations for PBKDF2-HMAC-SHA256 (2023+). */
const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const DERIVED_BITS = 256;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) return null;
    out[i] = byte;
  }
  return out;
}

/** New hashes use PBKDF2 (Web Crypto, Convex-safe). Legacy rows use single-round SHA-256 + salt. */
export function isLegacyPasswordHash(stored: string): boolean {
  const parts = stored.split(":");
  return !(
    parts.length === 5 &&
    parts[0] === "pbkdf2_sha256" &&
    parts[1] === "v1"
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const saltHex = bytesToHex(salt);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    DERIVED_BITS,
  );
  const hashHex = bytesToHex(new Uint8Array(bits));
  return `pbkdf2_sha256:v1:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  const parts = hashedPassword.split(":");
  if (
    parts.length === 5 &&
    parts[0] === "pbkdf2_sha256" &&
    parts[1] === "v1"
  ) {
    const iterations = parseInt(parts[2], 10);
    const saltHex = parts[3];
    const expectedHex = parts[4];
    if (!Number.isFinite(iterations) || iterations < 1) return false;
    const saltBytes = hexToBytes(saltHex);
    if (!saltBytes) return false;
    // Copy so `salt` is a BufferSource (plain ArrayBuffer), not Uint8Array<ArrayBufferLike>.
    const salt = new Uint8Array(saltBytes);

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations,
        hash: "SHA-256",
      },
      keyMaterial,
      DERIVED_BITS,
    );
    const hashHex = bytesToHex(new Uint8Array(bits));
    return hashHex === expectedHex;
  }

  // Legacy: saltHex:sha256Hex (single round — migrate on next successful login)
  if (parts.length === 2) {
    const [salt, expectedHash] = parts;
    if (!salt || !expectedHash) return false;
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex === expectedHash;
  }

  return false;
}
