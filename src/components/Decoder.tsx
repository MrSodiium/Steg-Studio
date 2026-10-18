import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Download,
  AlertCircle,
  CheckCircle2,
  FileImage,
  RefreshCw,
  ShieldCheck,
  FileText,
  Lock,
  Sparkles,
  Info
} from 'lucide-react';
import { decodeMessageFromImage, probeSteganographyHeader } from '../utils/steganography';
import { DecodeResult } from '../types';

interface DecoderProps {
  initialImageSrc?: string | null;
  initialPassword?: string;
}

export const Decoder: React.FC<DecoderProps> = ({ initialImageSrc, initialPassword }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(initialImageSrc || null);
  const [imageMeta, setImageMeta] = useState<{
    name: string;
    width: number;
    height: number;
    sizeBytes: number;
  } | null>(null);

  // Stego Detection Status
  const [probeResult, setProbeResult] = useState<{
    probed: boolean;
    hasHeader: boolean;
    isEncrypted: boolean;
    bitsPerChannel: 1 | 2;
  }>({ probed: false, hasHeader: false, isEncrypted: false, bitsPerChannel: 1 });

  // Password & Extraction
  const [password, setPassword] = useState<string>(initialPassword || '');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isDecoding, setIsDecoding] = useState<boolean>(false);
  const [decodeResult, setDecodeResult] = useState<DecodeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clipboard copy state
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial props
  useEffect(() => {
    if (initialImageSrc) {
      loadImage(initialImageSrc, 'Transferred from Encoder');
    }
  }, [initialImageSrc]);

  useEffect(() => {
    if (initialPassword !== undefined) {
      setPassword(initialPassword);
    }
  }, [initialPassword]);

  // Load image and probe for steganographic header
  const loadImage = (dataUrl: string, fileName: string, sizeBytes?: number) => {
    setErrorMessage(null);
    setDecodeResult(null);

    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      setImageSrc(dataUrl);
      setImageMeta({
        name: fileName,
        width,
        height,
        sizeBytes: sizeBytes || Math.round(dataUrl.length * 0.75),
      });

      // Probe image canvas
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, width, height);
          const probe = probeSteganographyHeader(imgData.data);
          setProbeResult({
            probed: true,
            hasHeader: probe.hasHeader,
            isEncrypted: probe.isEncrypted,
            bitsPerChannel: probe.bitsPerChannel,
          });
        }
      } catch (err) {
        console.error('Probe failed:', err);
      }
    };
    img.onerror = () => {
      setErrorMessage('Could not load image file.');
    };
    img.src = dataUrl;
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      loadImage(dataUrl, file.name, file.size);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Run Decode
  const handleDecode = async () => {
    if (!imageSrc) {
      setErrorMessage('Please provide an image to decode.');
      return;
    }

    setErrorMessage(null);
    setIsDecoding(true);

    try {
      const img = new Image();
      img.onload = async () => {
        try {
          const result = await decodeMessageFromImage(img, password);
          setIsDecoding(false);
          if (result.success) {
            setDecodeResult(result);
            setErrorMessage(null);
          } else {
            setDecodeResult(null);
            // Plausible deniability: Never reveal that the media is encrypted if credentials are invalid
            setErrorMessage('No readable message detected in this image. (If the sender password-protected it, verify you entered the exact password).');
          }
        } catch {
          setDecodeResult(null);
          setErrorMessage('No readable message detected in this image. (If the sender password-protected it, verify you entered the exact password).');
          setIsDecoding(false);
        }
      };
      img.onerror = () => {
        setErrorMessage('Failed to process image.');
        setIsDecoding(false);
      };
      img.src = imageSrc;
    } catch {
      setErrorMessage('No readable message detected in this image.');
      setIsDecoding(false);
    }
  };

  const handleCopy = () => {
    if (!decodeResult?.message) return;
    navigator.clipboard.writeText(decodeResult.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!decodeResult?.message) return;
    const blob = new Blob([decodeResult.message], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `decoded_secret_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner Notice */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Steganographic Message Extractor & Authenticator
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload any image carrying a hidden steganographic payload. If password-protected, AES-256-GCM will authenticate and decrypt the message.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 self-stretch sm:self-auto justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Local Sandbox Decryption</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Upload & Header Inspector */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <FileImage className="w-4 h-4 text-emerald-400" />
                  1. Load Stego Image
                </h3>
                <p className="text-xs text-slate-400">Upload the image containing the secret message</p>
              </div>

              {imageMeta && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300 underline"
                >
                  Choose Different Image
                </button>
              )}
            </div>

            {/* Drop Zone */}
            <div
              id="decoder-drop-zone"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/60'
              }`}
            >
              <input
                id="decoder-file-input"
                ref={fileInputRef}
                type="file"
                accept="image/*,.png,.jpg,.jpeg,.webp,.bmp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              {imageSrc ? (
                <div className="space-y-3">
                  <div className="max-h-56 mx-auto flex items-center justify-center overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                    <img
                      src={imageSrc}
                      alt="Stego carrier preview"
                      className="max-h-52 object-contain select-none"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
                    <span className="font-medium text-slate-200 truncate max-w-[200px]">{imageMeta?.name}</span>
                    <span>•</span>
                    <span className="font-mono text-emerald-400">{imageMeta?.width} × {imageMeta?.height} px</span>
                    <span>•</span>
                    <span className="text-slate-400">{(imageMeta?.sizeBytes ? imageMeta.sizeBytes / 1024 : 0).toFixed(1)} KB</span>
                  </div>
                </div>
              ) : (
                <div className="py-10 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-emerald-400 border border-slate-700">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Drag & drop your stego image here</p>
                    <p className="text-xs text-slate-500 mt-1">Supports PNG, WebP, and other carrier formats</p>
                  </div>
                </div>
              )}
            </div>

            {/* Steganographic Auto-Probe Status */}
            {probeResult.probed && (
              <div className="p-3.5 rounded-xl border transition-all space-y-2 bg-slate-950">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Carrier Inspection Status:</span>
                  {probeResult.hasHeader ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <Sparkles className="w-3 h-3" />
                      Stego Signature Found
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <AlertCircle className="w-3 h-3" />
                      No Signature Detected
                    </span>
                  )}
                </div>

                {probeResult.hasHeader ? (
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400">
                    <span className="text-[11px] text-slate-500 block mb-0.5">Carrier Modulation:</span>
                    <span className="font-semibold text-slate-200 font-mono">
                      Stego Matrix ({probeResult.bitsPerChannel}-bit LSB / RGB)
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    No standard stego signature was detected in the initial pixels. If this was sent over messaging apps with lossy compression, the payload bits may be altered.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Password & Extraction Control */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                2. Enter Password & Extract
              </h3>
              <p className="text-xs text-slate-400">Provide the encryption password if the sender protected the message</p>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Secret Password <span className="text-slate-500 font-normal">(Leave empty if not protected)</span>
              </label>
              <div className="relative">
                <input
                  id="decoder-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secret password (if protected)..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-slate-100 placeholder-slate-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero-Knowledge Principle:</strong> The password is never stored inside the image. Decryption relies entirely on AES-GCM 128-bit authentication tag verification.
                </span>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block font-semibold">Decryption Failed</strong>
                  <p className="leading-relaxed text-rose-300/90">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Decode Action Button */}
            <button
              id="decode-button"
              type="button"
              disabled={isDecoding || !imageSrc}
              onClick={handleDecode}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
            >
              {isDecoding ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Extracting & Decrypting Message...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Extract Hidden Message</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Decoded Message Revealed Card */}
      {decodeResult && decodeResult.success && (
        <div className="pt-4 border-t border-slate-800">
          <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Secret Message Revealed!</h3>
                    {decodeResult.isEncrypted && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        AES-256-GCM Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Authentic steganographic payload extracted and verified cryptographically.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  id="copy-revealed-btn"
                  type="button"
                  onClick={handleCopy}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                      <span>Copy Message</span>
                    </>
                  )}
                </button>

                <button
                  id="download-revealed-txt-btn"
                  type="button"
                  onClick={handleDownloadTxt}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save as .txt</span>
                </button>
              </div>
            </div>

            {/* Revealed Textbox */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 shadow-inner space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-800/80">
                <span>Secret Content:</span>
                <span className="font-mono text-emerald-400">
                  {decodeResult.message.length} characters • {decodeResult.payloadLength} bytes
                </span>
              </div>
              <pre className="text-sm text-slate-100 font-mono whitespace-pre-wrap break-words leading-relaxed select-text max-h-96 overflow-y-auto">
                {decodeResult.message}
              </pre>
            </div>

            {/* Technical Verification Details */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Zero password residue: Password verified via 128-bit authentication tag.
              </span>
              <span>•</span>
              <span>Steganography Mode: {decodeResult.bitsPerChannel}-bit LSB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
