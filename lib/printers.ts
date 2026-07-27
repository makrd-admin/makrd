import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

// Excludes visually ambiguous characters (0/O, 1/I/L).
const MODEL_ID_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** A human-readable, unique-enough printer model ID, e.g. "MK-7F3K9Q". */
export function generateModelId(): string {
  const bytes = randomBytes(6);
  let suffix = "";
  for (const byte of bytes) {
    suffix += MODEL_ID_ALPHABET[byte % MODEL_ID_ALPHABET.length];
  }
  return `MK-${suffix}`;
}

/**
 * Hashes a printer's anti-fraud code word with a random salt (scrypt).
 * Never store the code word itself — only this hash.
 */
export async function hashCodeWord(codeWord: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(codeWord.trim(), salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}
