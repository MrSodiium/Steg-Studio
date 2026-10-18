/**
 * Document Steganography Engine
 * 
 * Supports:
 * - Invisible Zero-Width Unicode Steganography (for TXT, MD, HTML, Source Code, Copied Text)
 * - Binary EOF & Trailer Stream Steganography (for PDF, DOCX, ZIP, Rich Documents)
 * - AES-256-GCM zero-knowledge encryption
 * - Plausible deniability: Does NOT reveal that the document is encrypted if password is wrong
 */

import { encryptWithPassword, decryptWithPassword } from './crypto';

// Zero-width Unicode characters for invisible steganography
export const ZW_CHARS = {
  ZERO: '\u200B', // Zero Width Space = bit 0
  ONE: '\u200C',  // Zero Width Non-Joiner = bit 1
  DELIM: '\u200D',// Zero Width Joiner = delimiter / start-end marker
  WORD_JOINER: '\u2060',
  BOM: '\uFEFF',
};

const DOC_MAGIC = 'STGDOC';

/**
 * Encodes a message invisibly into document text using zero-width characters.
 */
export async function encodeMessageInText(
  coverText: string,
  secretMessage: string,
  options: { usePassword: boolean; password?: string }
): Promise<{ stegoText: string; addedChars: number; isEncrypted: boolean }> {
  if (!coverText || coverText.trim().length === 0) {
    coverText = 'Confidential Report and Documentation Notes.\nAll contents are strictly verified for operational requirements.';
  }

  const isEncrypted = options.usePassword && !!options.password && options.password.trim().length > 0;
  let payloadStr: string;

  if (isEncrypted && options.password) {
    const encrypted = await encryptWithPassword(secretMessage, options.password);
    // Serialize { salt: b64, iv: b64, ciphertext: b64 }
    const packet = {
      m: DOC_MAGIC,
      e: 1,
      s: uint8ToBase64(encrypted.salt),
      i: uint8ToBase64(encrypted.iv),
      c: uint8ToBase64(encrypted.ciphertext),
    };
    payloadStr = JSON.stringify(packet);
  } else {
    const packet = {
      m: DOC_MAGIC,
      e: 0,
      t: secretMessage,
    };
    payloadStr = JSON.stringify(packet);
  }

  // Convert payload string to binary string
  const binaryString = stringToBinary(payloadStr);

  // Convert binary to zero-width characters
  let zwString = ZW_CHARS.DELIM;
  for (let i = 0; i < binaryString.length; i++) {
    zwString += binaryString[i] === '0' ? ZW_CHARS.ZERO : ZW_CHARS.ONE;
  }
  zwString += ZW_CHARS.DELIM;

  // Insert invisibly into cover text (after the first word or line)
  const firstSpaceIndex = coverText.indexOf(' ');
  let stegoText: string;

  if (firstSpaceIndex !== -1) {
    stegoText = coverText.slice(0, firstSpaceIndex) + zwString + coverText.slice(firstSpaceIndex);
  } else {
    stegoText = coverText + zwString;
  }

  return {
    stegoText,
    addedChars: zwString.length,
    isEncrypted,
  };
}

/**
 * Encodes a message into a binary document (e.g. PDF / DOCX) using trailer stream injection.
 */
export async function encodeMessageInBinaryDoc(
  file: File | ArrayBuffer,
  fileName: string,
  secretMessage: string,
  options: { usePassword: boolean; password?: string }
): Promise<{ stegoBlob: Blob; downloadUrl: string; originalSize: number; stegoSize: number }> {
  const originalBuffer = file instanceof File ? await file.arrayBuffer() : file;
  const originalBytes = new Uint8Array(originalBuffer);

  const isEncrypted = options.usePassword && !!options.password && options.password.trim().length > 0;
  let payloadBytes: Uint8Array;
  let salt: Uint8Array | null = null;
  let iv: Uint8Array | null = null;

  if (isEncrypted && options.password) {
    const enc = await encryptWithPassword(secretMessage, options.password);
    payloadBytes = enc.ciphertext;
    salt = enc.salt;
    iv = enc.iv;
  } else {
    payloadBytes = new TextEncoder().encode(secretMessage);
  }

  // Construct trailer packet
  // MAGIC [4] + Flags [1] + Salt [16] + IV [12] + Length [4] + Payload
  const headerSize = isEncrypted ? 4 + 1 + 16 + 12 + 4 : 4 + 1 + 4;
  const packet = new Uint8Array(headerSize + payloadBytes.length);
  const magicBytes = new TextEncoder().encode('STGD');
  packet.set(magicBytes, 0);
  packet[4] = isEncrypted ? 0x01 : 0x00;

  let offset = 5;
  if (isEncrypted && salt && iv) {
    packet.set(salt, offset);
    offset += 16;
    packet.set(iv, offset);
    offset += 12;
  }

  const view = new DataView(packet.buffer);
  view.setUint32(offset, payloadBytes.length, false);
  offset += 4;
  packet.set(payloadBytes, offset);

  // Combine original file bytes + trailer packet
  const combined = new Uint8Array(originalBytes.length + packet.length);
  combined.set(originalBytes, 0);
  combined.set(packet, originalBytes.length);

  const stegoBlob = new Blob([combined], { type: (file instanceof File ? file.type : 'application/octet-stream') });
  const downloadUrl = URL.createObjectURL(stegoBlob);

  return {
    stegoBlob,
    downloadUrl,
    originalSize: originalBytes.length,
    stegoSize: combined.length,
  };
}

/**
 * Decodes secret message from document text or file.
 * PLAUSIBLE DENIABILITY GUARANTEE:
 * If password is wrong or missing, it NEVER reveals that the document contains encrypted data.
 */
export async function decodeMessageFromDocument(
  input: string | File | ArrayBuffer,
  password?: string
): Promise<{ success: boolean; message: string; isEncrypted: boolean; error?: string }> {
  try {
    // 1. Check if input is string with zero-width characters
    if (typeof input === 'string') {
      return await decodeZeroWidthText(input, password);
    }

    // 2. If it's a file or ArrayBuffer:
    const buffer = input instanceof File ? await input.arrayBuffer() : input;
    
    // First try interpreting as text in case it was uploaded as .txt / .md / .html
    try {
      const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      if (text.includes(ZW_CHARS.DELIM) || text.includes(ZW_CHARS.ZERO)) {
        const textResult = await decodeZeroWidthText(text, password);
        if (textResult.success) return textResult;
      }
    } catch {
      // not text, proceed to binary check
    }

    // Check for binary trailer steganography
    const bytes = new Uint8Array(buffer);
    const magicStr = 'STGD';
    const magicBytes = new TextEncoder().encode(magicStr);

    let magicIndex = -1;
    for (let i = bytes.length - 1; i >= Math.max(0, bytes.length - 200000); i--) {
      if (
        bytes[i] === magicBytes[0] &&
        bytes[i + 1] === magicBytes[1] &&
        bytes[i + 2] === magicBytes[2] &&
        bytes[i + 3] === magicBytes[3]
      ) {
        magicIndex = i;
        break;
      }
    }

    if (magicIndex === -1) {
      return {
        success: false,
        message: '',
        isEncrypted: false,
        error: 'No hidden message found in this document.',
      };
    }

    const flags = bytes[magicIndex + 4];
    const isEncrypted = (flags & 0x01) === 0x01;
    let offset = magicIndex + 5;
    let salt: Uint8Array | null = null;
    let iv: Uint8Array | null = null;

    if (isEncrypted) {
      salt = bytes.slice(offset, offset + 16);
      offset += 16;
      iv = bytes.slice(offset, offset + 12);
      offset += 12;
    }

    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 4);
    const payloadLen = view.getUint32(0, false);
    offset += 4;

    const payloadBytes = bytes.slice(offset, offset + payloadLen);

    if (isEncrypted) {
      if (!password || password.trim().length === 0 || !salt || !iv) {
        return {
          success: false,
          message: '',
          isEncrypted: false,
          error: 'No hidden message found in this document.',
        };
      }

      try {
        const decrypted = await decryptWithPassword(payloadBytes, password, salt, iv);
        return {
          success: true,
          message: decrypted,
          isEncrypted: true,
        };
      } catch {
        return {
          success: false,
          message: '',
          isEncrypted: false,
          error: 'No hidden message found in this document.',
        };
      }
    } else {
      const plaintext = new TextDecoder().decode(payloadBytes);
      return {
        success: true,
        message: plaintext,
        isEncrypted: false,
      };
    }
  } catch {
    return {
      success: false,
      message: '',
      isEncrypted: false,
      error: 'Failed to extract data from document.',
    };
  }
}

async function decodeZeroWidthText(
  text: string,
  password?: string
): Promise<{ success: boolean; message: string; isEncrypted: boolean; error?: string }> {
  const delim = ZW_CHARS.DELIM;
  const startIdx = text.indexOf(delim);
  if (startIdx === -1) {
    return {
      success: false,
      message: '',
      isEncrypted: false,
      error: 'No hidden message found in this document text.',
    };
  }

  const endIdx = text.indexOf(delim, startIdx + 1);
  if (endIdx === -1) {
    return {
      success: false,
      message: '',
      isEncrypted: false,
      error: 'No hidden message found in this document text.',
    };
  }

  const zwData = text.substring(startIdx + 1, endIdx);
  let binary = '';
  for (let i = 0; i < zwData.length; i++) {
    const ch = zwData[i];
    if (ch === ZW_CHARS.ZERO) binary += '0';
    else if (ch === ZW_CHARS.ONE) binary += '1';
  }

  if (binary.length === 0 || binary.length % 8 !== 0) {
    return {
      success: false,
      message: '',
      isEncrypted: false,
      error: 'No hidden message found in this document text.',
    };
  }

  const jsonStr = binaryToString(binary);
  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return {
      success: false,
      message: '',
      isEncrypted: false,
      error: 'No hidden message found in this document text.',
    };
  }

  if (!parsed || parsed.m !== DOC_MAGIC) {
    return {
      success: false,
      message: '',
      isEncrypted: false,
      error: 'No hidden message found in this document text.',
    };
  }

  if (parsed.e === 1) {
    // Encrypted zero-leakage check
    if (!password || password.trim().length === 0 || !parsed.s || !parsed.i || !parsed.c) {
      return {
        success: false,
        message: '',
        isEncrypted: false,
        error: 'No hidden message found in this document text.',
      };
    }

    try {
      const salt = base64ToUint8(parsed.s);
      const iv = base64ToUint8(parsed.i);
      const ciphertext = base64ToUint8(parsed.c);
      const decrypted = await decryptWithPassword(ciphertext, password, salt, iv);
      return {
        success: true,
        message: decrypted,
        isEncrypted: true,
      };
    } catch {
      return {
        success: false,
        message: '',
        isEncrypted: false,
        error: 'No hidden message found in this document text.',
      };
    }
  } else {
    return {
      success: true,
      message: parsed.t || '',
      isEncrypted: false,
    };
  }
}

function stringToBinary(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += bytes[i].toString(2).padStart(8, '0');
  }
  return bin;
}

function binaryToString(bin: string): string {
  const bytes = new Uint8Array(bin.length / 8);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bin.substr(i * 8, 8), 2);
  }
  return new TextDecoder().decode(bytes);
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
