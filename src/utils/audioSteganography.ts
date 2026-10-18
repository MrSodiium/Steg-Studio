/**
 * Audio Steganography Engine
 * 
 * Supports:
 * - 16-bit PCM WAV direct sample LSB manipulation
 * - AudioContext decoding of MP3/WAV/OGG into lossless WAV stego export
 * - AES-256-GCM zero-knowledge password protection
 * - Plausible deniability: Does NOT reveal encryption if password is invalid
 */

import { encryptWithPassword, decryptWithPassword } from './crypto';

const AUDIO_MAGIC = new Uint8Array([0x53, 0x54, 0x41, 0x55]); // 'STAU'

/**
 * Encodes a message into WAV audio sample LSBs.
 */
export async function encodeMessageInAudio(
  audioFile: File | ArrayBuffer,
  message: string,
  options: { usePassword: boolean; password?: string }
): Promise<{ audioBlob: Blob; audioUrl: string; duration: number; sampleRate: number; channels: number }> {
  const arrayBuffer = audioFile instanceof File ? await audioFile.arrayBuffer() : audioFile;
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));

  const sampleRate = audioBuffer.sampleRate;
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const duration = audioBuffer.duration;

  // Prepare payload
  const isEncrypted = options.usePassword && !!options.password && options.password.trim().length > 0;
  let payloadBytes: Uint8Array;
  let salt: Uint8Array | null = null;
  let iv: Uint8Array | null = null;

  if (isEncrypted && options.password) {
    const encrypted = await encryptWithPassword(message, options.password);
    payloadBytes = encrypted.ciphertext;
    salt = encrypted.salt;
    iv = encrypted.iv;
  } else {
    payloadBytes = new TextEncoder().encode(message);
  }

  // Construct packet:
  // [0..3]: MAGIC ('STAU')
  // [4]: Flags (bit 0 = isEncrypted)
  // [5..20]: Salt (16 bytes, if encrypted)
  // [21..32]: IV (12 bytes, if encrypted)
  // [33..36]: Length (uint32 BE)
  // [37..]: Payload Bytes
  let packetLength = 4 + 1 + 4 + payloadBytes.length;
  if (isEncrypted && salt && iv) {
    packetLength += 16 + 12;
  }

  const packet = new Uint8Array(packetLength);
  packet.set(AUDIO_MAGIC, 0);
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

  // Convert float audio channels to 16-bit PCM
  const totalSamples = length * numChannels;
  const capacityBytes = Math.floor(totalSamples / 8);

  if (packet.length > capacityBytes) {
    throw new Error(
      `Payload size (${packet.length} bytes) exceeds audio capacity (${capacityBytes} bytes). Please use a longer audio track.`
    );
  }

  // Interleaved 16-bit PCM buffer
  const pcmData = new Int16Array(totalSamples);
  let pcmIdx = 0;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const channelData = audioBuffer.getChannelData(ch);
      const s = Math.max(-1, Math.min(1, channelData[i]));
      pcmData[pcmIdx++] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
  }

  // Embed packet bits into LSB of 16-bit samples
  let byteIdx = 0;
  let bitIdx = 0;
  const totalBits = packet.length * 8;

  for (let i = 0; i < pcmData.length && (byteIdx * 8 + bitIdx < totalBits); i++) {
    const bit = (packet[byteIdx] >> (7 - bitIdx)) & 1;
    pcmData[i] = (pcmData[i] & ~1) | bit;

    bitIdx++;
    if (bitIdx === 8) {
      bitIdx = 0;
      byteIdx++;
    }
  }

  // Build standard WAV file
  const wavBuffer = createWavFile(pcmData, numChannels, sampleRate);
  const audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
  const audioUrl = URL.createObjectURL(audioBlob);

  return {
    audioBlob,
    audioUrl,
    duration,
    sampleRate,
    channels: numChannels,
  };
}

/**
 * Decodes a secret message from an audio file.
 * PLAUSIBLE DENIABILITY GUARANTEE:
 * If the password is not valid or missing, it NEVER reveals that the audio is encrypted.
 */
export async function decodeMessageFromAudio(
  audioFile: File | ArrayBuffer,
  password?: string
): Promise<{ success: boolean; message: string; isEncrypted: boolean; error?: string }> {
  try {
    const arrayBuffer = audioFile instanceof File ? await audioFile.arrayBuffer() : audioFile;
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));

    const numChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const totalSamples = length * numChannels;

    // Convert audio to 16-bit PCM for LSB extraction
    const pcmData = new Int16Array(totalSamples);
    let pcmIdx = 0;
    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const channelData = audioBuffer.getChannelData(ch);
        const s = Math.max(-1, Math.min(1, channelData[i]));
        pcmData[pcmIdx++] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
    }

    // Read header (magic 4 bytes + flags 1 byte)
    const headerBytes = extractBitsFromPcm(pcmData, 0, 5);
    const isMagic =
      headerBytes[0] === AUDIO_MAGIC[0] &&
      headerBytes[1] === AUDIO_MAGIC[1] &&
      headerBytes[2] === AUDIO_MAGIC[2] &&
      headerBytes[3] === AUDIO_MAGIC[3];

    if (!isMagic) {
      return {
        success: false,
        message: '',
        isEncrypted: false,
        error: 'No readable message detected in this audio track.',
      };
    }

    const isEncrypted = (headerBytes[4] & 0x01) === 0x01;
    const headerSize = isEncrypted ? 37 : 9;
    const fullHeader = extractBitsFromPcm(pcmData, 0, headerSize);

    let offset = 5;
    let salt: Uint8Array | null = null;
    let iv: Uint8Array | null = null;

    if (isEncrypted) {
      salt = fullHeader.slice(offset, offset + 16);
      offset += 16;
      iv = fullHeader.slice(offset, offset + 12);
      offset += 12;
    }

    const view = new DataView(fullHeader.buffer, fullHeader.byteOffset, fullHeader.byteLength);
    const payloadLength = view.getUint32(offset, false);
    offset += 4;

    if (payloadLength <= 0 || payloadLength > totalSamples / 8) {
      return {
        success: false,
        message: '',
        isEncrypted: false,
        error: 'No readable message detected in this audio track.',
      };
    }

    const fullPacket = extractBitsFromPcm(pcmData, 0, headerSize + payloadLength);
    const payloadBytes = fullPacket.slice(headerSize, headerSize + payloadLength);

    if (isEncrypted) {
      // PLAUSIBLE DENIABILITY:
      // If password is not provided or invalid, return generic failure without revealing encryption
      if (!password || password.trim().length === 0 || !salt || !iv) {
        return {
          success: false,
          message: '',
          isEncrypted: false,
          error: 'No readable message detected in this audio track.',
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
        // Suppress crypto errors to prevent oracle leakage
        return {
          success: false,
          message: '',
          isEncrypted: false,
          error: 'No readable message detected in this audio track.',
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
      error: 'Failed to process audio file format.',
    };
  }
}

function extractBitsFromPcm(pcmData: Int16Array, startByte: number, numBytes: number): Uint8Array {
  const result = new Uint8Array(numBytes);
  const startBit = startByte * 8;
  const endBit = (startByte + numBytes) * 8;

  let byteIdx = 0;
  let bitIdx = 0;
  let currentByte = 0;

  for (let i = startBit; i < endBit && i < pcmData.length; i++) {
    const bit = pcmData[i] & 1;
    currentByte = (currentByte << 1) | bit;
    bitIdx++;
    if (bitIdx === 8) {
      result[byteIdx++] = currentByte;
      bitIdx = 0;
      currentByte = 0;
    }
  }

  return result;
}

/**
 * Creates a valid RIFF WAV container for 16-bit PCM audio samples.
 */
function createWavFile(pcmData: Int16Array, channels: number, sampleRate: number): ArrayBuffer {
  const byteRate = sampleRate * channels * 2;
  const blockAlign = channels * 2;
  const dataSize = pcmData.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // data subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < pcmData.length; i++) {
    view.setInt16(offset, pcmData[i], true);
    offset += 2;
  }

  return buffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
