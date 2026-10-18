/**
 * Steganography LSB (Least Significant Bit) Engine
 * 
 * Supports:
 * - 1-bit and 2-bit LSB per RGB channel (preserving alpha)
 * - Any input image format (PNG, JPEG, WebP, BMP, GIF, SVG, AVIF) via HTML5 Canvas rasterization
 * - Zero-knowledge encrypted payload embedding or plain UTF-8 embedding
 * - Quality calculation (PSNR & MSE)
 * - Visual difference heatmap generation
 */

import { encryptWithPassword, decryptWithPassword } from './crypto';
import { StegoOptions, EncodeResult, DecodeResult } from '../types';

export const MAGIC_HEADER = new Uint8Array([0x53, 0x54, 0x45, 0x47]); // 'STEG'

/**
 * Calculates max payload capacity in bytes for an image resolution.
 */
export function calculateCapacity(
  width: number,
  height: number,
  bitsPerChannel: 1 | 2,
  isEncrypted: boolean
): { totalCapacityBytes: number; maxPayloadBytes: number; headerOverheadBytes: number } {
  const totalChannels = width * height * 3; // R, G, B
  const totalBits = totalChannels * bitsPerChannel;
  const totalCapacityBytes = Math.floor(totalBits / 8);

  // Magic (4) + Flags (1) + Length (4)
  // If encrypted: + Salt (16) + IV (12) + AES-GCM Tag (16)
  const headerOverheadBytes = isEncrypted ? 4 + 1 + 16 + 12 + 4 + 16 : 4 + 1 + 4;
  const maxPayloadBytes = Math.max(0, totalCapacityBytes - headerOverheadBytes);

  return { totalCapacityBytes, maxPayloadBytes, headerOverheadBytes };
}

/**
 * Encodes a secret message into an ImageData object using LSB steganography.
 */
export async function encodeMessageInImage(
  imageSource: HTMLImageElement | HTMLCanvasElement,
  message: string,
  options: StegoOptions
): Promise<EncodeResult> {
  const width = 'naturalWidth' in imageSource ? imageSource.naturalWidth || imageSource.width : imageSource.width;
  const height = 'naturalHeight' in imageSource ? imageSource.naturalHeight || imageSource.height : imageSource.height;

  // Create canvas to process image data
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2D canvas rendering context');

  // Draw original image
  ctx.drawImage(imageSource, 0, 0, width, height);
  const originalImageData = ctx.getImageData(0, 0, width, height);

  // Clone original for stego manipulation
  const stegoCanvas = document.createElement('canvas');
  stegoCanvas.width = width;
  stegoCanvas.height = height;
  const stegoCtx = stegoCanvas.getContext('2d', { willReadFrequently: true });
  if (!stegoCtx) throw new Error('Could not get stego canvas rendering context');
  stegoCtx.drawImage(imageSource, 0, 0, width, height);
  const stegoImageData = stegoCtx.getImageData(0, 0, width, height);

  // Prepare binary package
  let payloadBytes: Uint8Array;
  let salt: Uint8Array | null = null;
  let iv: Uint8Array | null = null;
  const isEncrypted = options.usePassword && !!options.password && options.password.trim().length > 0;

  if (isEncrypted && options.password) {
    const encrypted = await encryptWithPassword(message, options.password);
    payloadBytes = encrypted.ciphertext;
    salt = encrypted.salt;
    iv = encrypted.iv;
  } else {
    const encoder = new TextEncoder();
    payloadBytes = encoder.encode(message);
  }

  // Construct full packet:
  // [0..3]: MAGIC ('STEG')
  // [4]: Flags (bit 0 = isEncrypted, bit 1 = bitsPerChannel === 2 ? 1 : 0)
  // If encrypted:
  //   [5..20]: Salt (16 bytes)
  //   [21..32]: IV (12 bytes)
  //   [33..36]: Payload Length (uint32 BE)
  //   [37..]: Payload Bytes (ciphertext with auth tag)
  // If not encrypted:
  //   [5..8]: Payload Length (uint32 BE)
  //   [9..]: Payload Bytes
  let packetLength = 4 + 1 + 4 + payloadBytes.length;
  if (isEncrypted && salt && iv) {
    packetLength += 16 + 12;
  }

  const packet = new Uint8Array(packetLength);
  packet.set(MAGIC_HEADER, 0);

  let flags = 0;
  if (isEncrypted) flags |= 0x01;
  if (options.bitsPerChannel === 2) flags |= 0x02;
  packet[4] = flags;

  let offset = 5;
  if (isEncrypted && salt && iv) {
    packet.set(salt, offset);
    offset += 16;
    packet.set(iv, offset);
    offset += 12;
  }

  // Length 4 bytes BE
  const view = new DataView(packet.buffer);
  view.setUint32(offset, payloadBytes.length, false);
  offset += 4;

  // Payload
  packet.set(payloadBytes, offset);

  // Verify capacity
  const { totalCapacityBytes, maxPayloadBytes } = calculateCapacity(
    width,
    height,
    options.bitsPerChannel,
    isEncrypted
  );

  if (packet.length > totalCapacityBytes) {
    throw new Error(
      `Message payload (${packet.length.toLocaleString()} bytes) exceeds image capacity (${totalCapacityBytes.toLocaleString()} bytes). Try a larger image or 2-bit LSB mode.`
    );
  }

  // Embed packet into RGB channels
  embedPacketIntoPixels(stegoImageData.data, packet, options.bitsPerChannel);

  // Put modified data back to stego canvas
  stegoCtx.putImageData(stegoImageData, 0, 0);

  // Calculate PSNR & MSE
  const { psnr, mse } = calculateQualityMetrics(originalImageData, stegoImageData);

  // Generate output URLs & Blobs
  const originalDataUrl = canvas.toDataURL('image/png');
  const stegoDataUrl = stegoCanvas.toDataURL('image/png');

  const stegoBlob = await new Promise<Blob>((resolve, reject) => {
    stegoCanvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create PNG blob from canvas'));
    }, 'image/png');
  });

  return {
    stegoDataUrl,
    stegoBlob,
    width,
    height,
    totalPixels: width * height,
    capacityBytes: totalCapacityBytes,
    usedBytes: packet.length,
    usedPercentage: Math.min(100, (packet.length / totalCapacityBytes) * 100),
    psnr,
    mse,
    bitsPerChannel: options.bitsPerChannel,
    isEncrypted,
    originalDataUrl,
  };
}

/**
 * Injects byte array into pixel buffer LSBs.
 */
function embedPacketIntoPixels(
  pixelData: Uint8ClampedArray,
  packet: Uint8Array,
  bitsPerChannel: 1 | 2
): void {
  let packetByteIdx = 0;
  let packetBitIdx = 0; // bit index within current packet byte (0..7, MSB first)
  const totalPacketBits = packet.length * 8;

  for (let i = 0; i < pixelData.length; i += 4) {
    // Process R, G, B channels
    for (let c = 0; c < 3; c++) {
      if (packetByteIdx * 8 + packetBitIdx >= totalPacketBits) {
        return; // all bits embedded
      }

      const channelIdx = i + c;

      if (bitsPerChannel === 1) {
        // Extract 1 bit from packet (MSB to LSB)
        const bit = (packet[packetByteIdx] >> (7 - packetBitIdx)) & 1;
        pixelData[channelIdx] = (pixelData[channelIdx] & 0xfe) | bit;

        packetBitIdx++;
        if (packetBitIdx === 8) {
          packetBitIdx = 0;
          packetByteIdx++;
        }
      } else {
        // 2 bits per channel
        const bit1 = (packet[packetByteIdx] >> (7 - packetBitIdx)) & 1;
        packetBitIdx++;
        if (packetBitIdx === 8) {
          packetBitIdx = 0;
          packetByteIdx++;
        }

        let bit2 = 0;
        if (packetByteIdx * 8 + packetBitIdx < totalPacketBits) {
          bit2 = (packet[packetByteIdx] >> (7 - packetBitIdx)) & 1;
          packetBitIdx++;
          if (packetBitIdx === 8) {
            packetBitIdx = 0;
            packetByteIdx++;
          }
        }

        const twoBits = (bit1 << 1) | bit2;
        pixelData[channelIdx] = (pixelData[channelIdx] & 0xfc) | (twoBits & 3);
      }
    }
  }
}

/**
 * Checks if an image contains a valid STEG header without reading the full image.
 */
export function probeSteganographyHeader(
  pixelData: Uint8ClampedArray
): { hasHeader: boolean; isEncrypted: boolean; bitsPerChannel: 1 | 2 } {
  // Try 1-bit first
  const try1Bit = readHeaderFromPixels(pixelData, 1);
  if (try1Bit.hasHeader) return try1Bit;

  // Try 2-bit
  const try2Bit = readHeaderFromPixels(pixelData, 2);
  if (try2Bit.hasHeader) return try2Bit;

  return { hasHeader: false, isEncrypted: false, bitsPerChannel: 1 };
}

function readHeaderFromPixels(
  pixelData: Uint8ClampedArray,
  bitsPerChannel: 1 | 2
): { hasHeader: boolean; isEncrypted: boolean; bitsPerChannel: 1 | 2 } {
  const headerBytes = new Uint8Array(5);
  let byteIdx = 0;
  let bitIdx = 0;
  let currentByte = 0;

  for (let i = 0; i < pixelData.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const channelIdx = i + c;
      if (bitsPerChannel === 1) {
        const bit = pixelData[channelIdx] & 1;
        currentByte = (currentByte << 1) | bit;
        bitIdx++;
        if (bitIdx === 8) {
          headerBytes[byteIdx] = currentByte;
          byteIdx++;
          bitIdx = 0;
          currentByte = 0;
          if (byteIdx === 5) break;
        }
      } else {
        const twoBits = pixelData[channelIdx] & 3;
        const bit1 = (twoBits >> 1) & 1;
        const bit2 = twoBits & 1;

        currentByte = (currentByte << 1) | bit1;
        bitIdx++;
        if (bitIdx === 8) {
          headerBytes[byteIdx] = currentByte;
          byteIdx++;
          bitIdx = 0;
          currentByte = 0;
          if (byteIdx === 5) break;
        }

        currentByte = (currentByte << 1) | bit2;
        bitIdx++;
        if (bitIdx === 8) {
          headerBytes[byteIdx] = currentByte;
          byteIdx++;
          bitIdx = 0;
          currentByte = 0;
          if (byteIdx === 5) break;
        }
      }
    }
    if (byteIdx === 5) break;
  }

  if (byteIdx < 5) return { hasHeader: false, isEncrypted: false, bitsPerChannel };

  const isMagic =
    headerBytes[0] === MAGIC_HEADER[0] &&
    headerBytes[1] === MAGIC_HEADER[1] &&
    headerBytes[2] === MAGIC_HEADER[2] &&
    headerBytes[3] === MAGIC_HEADER[3];

  if (!isMagic) {
    return { hasHeader: false, isEncrypted: false, bitsPerChannel };
  }

  const flags = headerBytes[4];
  const isEncrypted = (flags & 0x01) === 0x01;
  const recordedBitsPerChannel: 1 | 2 = (flags & 0x02) === 0x02 ? 2 : 1;

  return { hasHeader: true, isEncrypted, bitsPerChannel: recordedBitsPerChannel };
}

/**
 * Decodes message from image data.
 */
export async function decodeMessageFromImage(
  imageSource: HTMLImageElement | HTMLCanvasElement,
  password?: string
): Promise<DecodeResult> {
  const width = 'naturalWidth' in imageSource ? imageSource.naturalWidth || imageSource.width : imageSource.width;
  const height = 'naturalHeight' in imageSource ? imageSource.naturalHeight || imageSource.height : imageSource.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2D canvas context for decoding');

  ctx.drawImage(imageSource, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixelData = imageData.data;

  // Probe header
  const probe = probeSteganographyHeader(pixelData);
  if (!probe.hasHeader) {
    return {
      message: '',
      isEncrypted: false,
      bitsPerChannel: 1,
      payloadLength: 0,
      success: false,
      error: 'No steganographic message found in this image. Ensure the image was not compressed by lossy JPEG filters or messaging apps.',
    };
  }

  const { isEncrypted, bitsPerChannel } = probe;

  // Determine header length to read
  // If encrypted: 4 (magic) + 1 (flags) + 16 (salt) + 12 (iv) + 4 (length) = 37 bytes
  // If not encrypted: 4 (magic) + 1 (flags) + 4 (length) = 9 bytes
  const headerTotalBytes = isEncrypted ? 37 : 9;

  // Extract initial header bytes
  const headerBuffer = extractRawBytes(pixelData, headerTotalBytes, bitsPerChannel);

  let offset = 5;
  let salt: Uint8Array | null = null;
  let iv: Uint8Array | null = null;

  if (isEncrypted) {
    salt = headerBuffer.slice(offset, offset + 16);
    offset += 16;
    iv = headerBuffer.slice(offset, offset + 12);
    offset += 12;
  }

  const view = new DataView(headerBuffer.buffer, headerBuffer.byteOffset, headerBuffer.byteLength);
  const payloadLength = view.getUint32(offset, false);
  offset += 4;

  if (payloadLength <= 0 || payloadLength > width * height * 3) {
    return {
      message: '',
      isEncrypted,
      bitsPerChannel,
      payloadLength: 0,
      success: false,
      error: 'Corrupted payload length header detected.',
    };
  }

  // Extract the exact payload bytes
  const fullPacketBytes = extractRawBytes(pixelData, headerTotalBytes + payloadLength, bitsPerChannel);
  const payloadBytes = fullPacketBytes.slice(headerTotalBytes, headerTotalBytes + payloadLength);

  if (isEncrypted) {
    // Zero-leakage plausible deniability:
    // If the password is not provided or is invalid, do NOT disclose that the media is encrypted.
    // Return a generic unrevealing failure without revealing cryptographic status.
    if (!password || password.trim().length === 0 || !salt || !iv) {
      return {
        message: '',
        isEncrypted: false,
        bitsPerChannel,
        payloadLength: 0,
        success: false,
        error: 'NO_VALID_MESSAGE',
      };
    }

    try {
      const plaintext = await decryptWithPassword(payloadBytes, password, salt, iv);
      return {
        message: plaintext,
        isEncrypted: true, // ONLY revealed when password is valid and verified!
        bitsPerChannel,
        payloadLength,
        success: true,
      };
    } catch {
      // Intentionally suppress specific crypto error to prevent oracle or detection.
      return {
        message: '',
        isEncrypted: false, // NEVER reveal that media is encrypted if password is wrong
        bitsPerChannel,
        payloadLength: 0,
        success: false,
        error: 'NO_VALID_MESSAGE',
      };
    }
  } else {
    // Unencrypted UTF-8 text
    const decoder = new TextDecoder();
    const message = decoder.decode(payloadBytes);
    return {
      message,
      isEncrypted: false,
      bitsPerChannel,
      payloadLength,
      success: true,
    };
  }
}

/**
 * Extracts N bytes from pixel data LSBs.
 */
function extractRawBytes(
  pixelData: Uint8ClampedArray,
  numBytes: number,
  bitsPerChannel: 1 | 2
): Uint8Array {
  const result = new Uint8Array(numBytes);
  let byteIdx = 0;
  let bitIdx = 0;
  let currentByte = 0;

  for (let i = 0; i < pixelData.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const channelIdx = i + c;

      if (bitsPerChannel === 1) {
        const bit = pixelData[channelIdx] & 1;
        currentByte = (currentByte << 1) | bit;
        bitIdx++;
        if (bitIdx === 8) {
          result[byteIdx] = currentByte;
          byteIdx++;
          bitIdx = 0;
          currentByte = 0;
          if (byteIdx === numBytes) return result;
        }
      } else {
        const twoBits = pixelData[channelIdx] & 3;
        const bit1 = (twoBits >> 1) & 1;
        const bit2 = twoBits & 1;

        currentByte = (currentByte << 1) | bit1;
        bitIdx++;
        if (bitIdx === 8) {
          result[byteIdx] = currentByte;
          byteIdx++;
          bitIdx = 0;
          currentByte = 0;
          if (byteIdx === numBytes) return result;
        }

        currentByte = (currentByte << 1) | bit2;
        bitIdx++;
        if (bitIdx === 8) {
          result[byteIdx] = currentByte;
          byteIdx++;
          bitIdx = 0;
          currentByte = 0;
          if (byteIdx === numBytes) return result;
        }
      }
    }
    if (byteIdx === numBytes) break;
  }

  return result;
}

/**
 * Calculates PSNR (Peak Signal-to-Noise Ratio in dB) and MSE (Mean Squared Error)
 * between the original and stego image.
 */
export function calculateQualityMetrics(
  originalData: ImageData,
  stegoData: ImageData
): { psnr: number; mse: number } {
  const orig = originalData.data;
  const stego = stegoData.data;
  let sumSquaredError = 0;
  const numChannels = (orig.length / 4) * 3; // R, G, B channels only

  for (let i = 0; i < orig.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const diff = orig[i + c] - stego[i + c];
      sumSquaredError += diff * diff;
    }
  }

  const mse = sumSquaredError / numChannels;
  if (mse === 0) {
    return { psnr: 99.9, mse: 0 };
  }

  const maxVal = 255;
  const psnr = 10 * Math.log10((maxVal * maxVal) / mse);

  return {
    psnr: Number(psnr.toFixed(2)),
    mse: Number(mse.toFixed(4)),
  };
}

/**
 * Generates an amplified difference heatmap canvas to visualize altered pixels.
 */
export function generateDifferenceHeatmap(
  originalDataUrl: string,
  stegoDataUrl: string,
  amplification: number = 80
): Promise<string> {
  return new Promise((resolve, reject) => {
    const origImg = new Image();
    const stegoImg = new Image();
    let loaded = 0;

    const checkBothLoaded = () => {
      loaded++;
      if (loaded === 2) {
        const width = origImg.naturalWidth || origImg.width;
        const height = origImg.naturalHeight || origImg.height;

        const c1 = document.createElement('canvas');
        c1.width = width;
        c1.height = height;
        const ctx1 = c1.getContext('2d');

        const c2 = document.createElement('canvas');
        c2.width = width;
        c2.height = height;
        const ctx2 = c2.getContext('2d');

        if (!ctx1 || !ctx2) {
          reject(new Error('Canvas context error in heatmap'));
          return;
        }

        ctx1.drawImage(origImg, 0, 0);
        ctx2.drawImage(stegoImg, 0, 0);

        const imgData1 = ctx1.getImageData(0, 0, width, height);
        const imgData2 = ctx2.getImageData(0, 0, width, height);
        const diffData = ctx1.createImageData(width, height);

        const d1 = imgData1.data;
        const d2 = imgData2.data;
        const out = diffData.data;

        for (let i = 0; i < d1.length; i += 4) {
          const diffR = Math.abs(d1[i] - d2[i]);
          const diffG = Math.abs(d1[i + 1] - d2[i + 1]);
          const diffB = Math.abs(d1[i + 2] - d2[i + 2]);
          const totalDiff = diffR + diffG + diffB;

          if (totalDiff > 0) {
            // Highlight modified pixel with vibrant emerald/cyan heatmap
            out[i] = Math.min(255, diffR * amplification + 16); // R
            out[i + 1] = Math.min(255, 120 + diffG * amplification); // G
            out[i + 2] = Math.min(255, 200 + diffB * amplification); // B
            out[i + 3] = 255;
          } else {
            // Dark muted background
            out[i] = 12;
            out[i + 1] = 16;
            out[i + 2] = 24;
            out[i + 3] = 255;
          }
        }

        ctx1.putImageData(diffData, 0, 0);
        resolve(c1.toDataURL('image/png'));
      }
    };

    origImg.onload = checkBothLoaded;
    stegoImg.onload = checkBothLoaded;
    origImg.onerror = reject;
    stegoImg.onerror = reject;

    origImg.src = originalDataUrl;
    stegoImg.src = stegoDataUrl;
  });
}
