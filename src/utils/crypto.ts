/**
 * Cryptographic helpers using the native Web Crypto API.
 * 
 * ZERO-KNOWLEDGE GUARANTEE:
 * The password is NEVER stored in the image or payload, neither in plain text
 * nor as a hash. AES-256-GCM authentication tags guarantee that only the exact
 * correct password can decrypt the data without leaking password information.
 */

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12; // 96 bits for AES-GCM

/**
 * Derives an AES-GCM 256-bit CryptoKey from a password and salt using PBKDF2-SHA256.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using AES-256-GCM with a PBKDF2 derived key.
 * Returns: { salt, iv, ciphertext (which includes the 16-byte auth tag) }
 */
export async function encryptWithPassword(
  plaintext: string,
  password: string
): Promise<{ salt: Uint8Array; iv: Uint8Array; ciphertext: Uint8Array }> {
  if (!password) {
    throw new Error('Password cannot be empty');
  }

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);

  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource,
    },
    key,
    data
  );

  return {
    salt,
    iv,
    ciphertext: new Uint8Array(ciphertextBuffer),
  };
}

/**
 * Decrypts AES-256-GCM ciphertext using the user-provided password, salt, and IV.
 * If the password is wrong, WebCrypto throws an OperationError (auth tag mismatch).
 */
export async function decryptWithPassword(
  ciphertext: Uint8Array,
  password: string,
  salt: Uint8Array,
  iv: Uint8Array
): Promise<string> {
  if (!password) {
    throw new Error('Password is required to decrypt this message');
  }

  try {
    const key = await deriveKey(password, salt);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource,
      },
      key,
      ciphertext as BufferSource
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err: unknown) {
    // WebCrypto returns an error on authentication tag mismatch
    const errorMsg = (err instanceof Error) ? err.message : String(err);
    if (errorMsg.includes('operation') || errorMsg.includes('tag') || errorMsg.includes('OperationError')) {
      throw new Error('Incorrect password or corrupted image payload. Decryption authentication failed.');
    }
    throw new Error('Failed to decrypt: ' + errorMsg);
  }
}
