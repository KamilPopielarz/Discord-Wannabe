/**
 * Crypto utilities for password hashing compatible with Cloudflare Workers
 * Uses Web Crypto API (PBKDF2) instead of bcrypt for web platform compatibility
 */

const PBKDF2_ITERATIONS = 100000; // OWASP recommended minimum for PBKDF2-SHA256
const SALT_LENGTH = 16; // 16 bytes = 128 bits
const KEY_LENGTH = 32; // 32 bytes = 256 bits

/**
 * Convert ArrayBuffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Convert hex string to ArrayBuffer
 */
function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

/**
 * Hash a password using PBKDF2
 * @param password - Plain text password to hash
 * @returns Hashed password in format "salt:hash" (hex encoded)
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  // Derive key using PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    KEY_LENGTH * 8 // bits
  );

  // Return salt and hash as hex strings separated by colon
  return `${bufferToHex(salt.buffer)}:${bufferToHex(hashBuffer)}`;
}

/**
 * Verify a password against a stored hash
 * @param password - Plain text password to verify
 * @param storedHash - Stored hash in format "salt:hash" (hex encoded)
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    // Split stored hash into salt and hash
    const parts = storedHash.split(":");
    if (parts.length !== 2) {
      return false;
    }

    const [saltHex, hashHex] = parts;

    // Convert hex strings back to buffers
    const salt = new Uint8Array(hexToBuffer(saltHex));
    const expectedHash = new Uint8Array(hexToBuffer(hashHex));

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    // Derive key using PBKDF2 with the same salt
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      KEY_LENGTH * 8 // bits
    );

    const hash = new Uint8Array(hashBuffer);

    // Constant-time comparison to prevent timing attacks
    if (hash.length !== expectedHash.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < hash.length; i++) {
      result |= hash[i] ^ expectedHash[i];
    }

    return result === 0;
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

/**
 * Generate a random hex string (useful for tokens, invite links, etc.)
 * @param length - Length in bytes (default: 16)
 * @returns Random hex string
 */
export function generateRandomHex(length: number = 16): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return bufferToHex(bytes.buffer);
}

