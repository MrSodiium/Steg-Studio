/**
 * Steg Studio Type Definitions
 * Multi-media steganography and steganalysis
 */

export type MediaType = 'image' | 'video' | 'audio' | 'document';

export interface StegoOptions {
  bitsPerChannel: 1 | 2; // 1 = ultra stealth (1 bit LSB), 2 = high capacity
  usePassword: boolean;
  password?: string;
}

export interface StegoMetadata {
  isEncrypted: boolean;
  bitsPerChannel: 1 | 2;
  payloadLength: number;
  timestamp?: number;
}

export interface EncodeResult {
  stegoDataUrl: string;
  stegoBlob: Blob;
  width: number;
  height: number;
  totalPixels: number;
  capacityBytes: number;
  usedBytes: number;
  usedPercentage: number;
  psnr: number;
  mse: number;
  bitsPerChannel: 1 | 2;
  isEncrypted: boolean;
  originalDataUrl: string;
}

export interface DecodeResult {
  message: string;
  isEncrypted: boolean;
  bitsPerChannel: 1 | 2;
  payloadLength: number;
  success: boolean;
  error?: string;
}

export interface SamplePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

export interface AudioEncodeResult {
  audioBlob: Blob;
  audioUrl: string;
  sampleRate: number;
  channels: number;
  durationSeconds: number;
  capacityBytes: number;
  usedBytes: number;
  usedPercentage: number;
}

export interface VideoEncodeResult {
  videoBlob: Blob;
  videoUrl: string;
  durationSeconds: number;
  fileSize: number;
  width: number;
  height: number;
  capacityBytes: number;
}

export interface DocumentEncodeResult {
  documentText?: string;
  documentBlob?: Blob;
  documentUrl?: string;
  fileName: string;
  mimeType: string;
  method: 'zero_width' | 'eof_trailer';
  originalSize: number;
  stegoSize: number;
}

export interface SteganalysisMetric {
  name: string;
  value: string | number;
  description: string;
  status: 'normal' | 'suspicious' | 'anomalous';
}

export interface SteganalysisReport {
  mediaType: MediaType;
  fileName: string;
  fileSize: number;
  overallRisk: 'clean' | 'low' | 'suspicious' | 'high_probability';
  riskScore: number; // 0 - 100
  summary: string;
  metrics: SteganalysisMetric[];
  findings: {
    title: string;
    detail: string;
    severity: 'info' | 'warning' | 'danger';
  }[];
  visualArtifactUrl?: string;
}

export type FeedbackCategory = 'general' | 'bug' | 'feature' | 'cryptography';

export interface FeedbackItem {
  id: string;
  createdAt: number;
  category: FeedbackCategory;
  rating: number; // 1 - 5
  message: string;
  name?: string;
  email?: string;
  stegoContext?: {
    imageFormatTested?: string;
    passwordUsed?: 'yes' | 'no' | 'not_applicable';
    decodingResult?: 'success' | 'failed' | 'not_tested';
  };
  attachmentName?: string;
  attachmentDataUrl?: string;
}
