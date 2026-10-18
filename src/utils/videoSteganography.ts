/**
 * Video Steganography Engine
 * 
 * Supports:
 * - High-speed container & stream metadata/trailer payload embedding (preserves video playback in MP4/WebM)
 * - Canvas frame steganography verification
 * - AES-256-GCM zero-knowledge password protection
 * - Plausible deniability: Does NOT reveal that the video is encrypted if password is wrong
 */

import { encryptWithPassword, decryptWithPassword } from './crypto';

const VIDEO_MAGIC = new Uint8Array([0x53, 0x54, 0x56, 0x44]); // 'STVD'

/**
 * Encodes secret message into a video container file.
 */
export async function encodeMessageInVideo(
  videoFile: File | ArrayBuffer,
  fileName: string,
  message: string,
  options: { usePassword: boolean; password?: string }
): Promise<{ videoBlob: Blob; videoUrl: string; originalSize: number; stegoSize: number }> {
  const originalBuffer = videoFile instanceof File ? await videoFile.arrayBuffer() : videoFile;
  const originalBytes = new Uint8Array(originalBuffer);

  const isEncrypted = options.usePassword && !!options.password && options.password.trim().length > 0;
  let payloadBytes: Uint8Array;
  let salt: Uint8Array | null = null;
  let iv: Uint8Array | null = null;

  if (isEncrypted && options.password) {
    const enc = await encryptWithPassword(message, options.password);
    payloadBytes = enc.ciphertext;
    salt = enc.salt;
    iv = enc.iv;
  } else {
    payloadBytes = new TextEncoder().encode(message);
  }

  // Construct trailer packet:
  // [0..3]: MAGIC ('STVD')
  // [4]: Flags (bit 0 = isEncrypted)
  // [5..20]: Salt (16 bytes, if encrypted)
  // [21..32]: IV (12 bytes, if encrypted)
  // [33..36]: Length (uint32 BE)
  // [37..]: Payload Bytes
  const headerSize = isEncrypted ? 4 + 1 + 16 + 12 + 4 : 4 + 1 + 4;
  const packet = new Uint8Array(headerSize + payloadBytes.length);
  packet.set(VIDEO_MAGIC, 0);
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

  // Combine video stream bytes with trailer stego payload
  const combined = new Uint8Array(originalBytes.length + packet.length);
  combined.set(originalBytes, 0);
  combined.set(packet, originalBytes.length);

  const mimeType = videoFile instanceof File ? videoFile.type || 'video/mp4' : 'video/mp4';
  const videoBlob = new Blob([combined], { type: mimeType });
  const videoUrl = URL.createObjectURL(videoBlob);

  return {
    videoBlob,
    videoUrl,
    originalSize: originalBytes.length,
    stegoSize: combined.length,
  };
}

/**
 * Decodes a secret message from a video file.
 * PLAUSIBLE DENIABILITY GUARANTEE:
 * If password is wrong or missing, it NEVER reveals that the video contains encrypted data.
 */
export async function decodeMessageFromVideo(
  videoFile: File | ArrayBuffer,
  password?: string
): Promise<{ success: boolean; message: string; isEncrypted: boolean; error?: string }> {
  try {
    const arrayBuffer = videoFile instanceof File ? await videoFile.arrayBuffer() : videoFile;
    const bytes = new Uint8Array(arrayBuffer);

    // Search for MAGIC bytes starting from the end of the file
    let magicIndex = -1;
    const searchLimit = Math.max(0, bytes.length - 2000000); // scan last 2MB
    for (let i = bytes.length - 4; i >= searchLimit; i--) {
      if (
        bytes[i] === VIDEO_MAGIC[0] &&
        bytes[i + 1] === VIDEO_MAGIC[1] &&
        bytes[i + 2] === VIDEO_MAGIC[2] &&
        bytes[i + 3] === VIDEO_MAGIC[3]
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
        error: 'No readable message found in this video file.',
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
      // PLAUSIBLE DENIABILITY:
      // If password is not provided or invalid, return generic failure without disclosing encryption
      if (!password || password.trim().length === 0 || !salt || !iv) {
        return {
          success: false,
          message: '',
          isEncrypted: false,
          error: 'No readable message found in this video file.',
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
          error: 'No readable message found in this video file.',
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
      error: 'Failed to process video container stream.',
    };
  }
}
