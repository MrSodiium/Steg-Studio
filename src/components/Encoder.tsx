import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Download,
  AlertCircle,
  CheckCircle2,
  FileImage,
  RefreshCw,
  Sliders,
  ArrowRight,
  Shield,
  KeyRound,
  FileText,
  Info
} from 'lucide-react';
import { SAMPLE_PRESETS, renderPresetToDataUrl } from '../utils/presets';
import { encodeMessageInImage, calculateCapacity } from '../utils/steganography';
import { EncodeResult } from '../types';
import { ImageComparator } from './ImageComparator';

interface EncoderProps {
  onSendToDecoder?: (dataUrl: string, passwordHint?: string) => void;
}

const SAMPLE_MESSAGES = [
  {
    title: 'Coordinates & Meetup',
    text: 'Operation Nightfall rendezvous at 45.4215° N, 75.6972° W on Friday 21:00 UTC. Bring the secondary hardware security key.',
  },
  {
    title: 'Secret Recovery Phrase',
    text: 'abandon dignity crystal galaxy hazard inherit jewel kingdom lemon marble nature orange planet quantum radiant solar velvet wonder zenith',
  },
  {
    title: 'Confidential Memo',
    text: 'Projected Q4 R&D allocation confirmed. Prototype telemetry remains strictly confidential under NDA 2026-B. Do not distribute over unencrypted channels.',
  },
];

export const Encoder: React.FC<EncoderProps> = ({ onSendToDecoder }) => {
  // Input Image State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{
    name: string;
    width: number;
    height: number;
    sizeBytes: number;
    format: string;
  } | null>(null);

  // Message & Encryption State
  const [message, setMessage] = useState<string>('');
  const [usePassword, setUsePassword] = useState<boolean>(true);
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [bitsPerChannel, setBitsPerChannel] = useState<1 | 2>(1);

  // Status & Output State
  const [isEncoding, setIsEncoding] = useState<boolean>(false);
  const [encodeError, setEncodeError] = useState<string | null>(null);
  const [encodeResult, setEncodeResult] = useState<EncodeResult | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize with a default preset if none selected
  useEffect(() => {
    if (!imageSrc) {
      loadPreset(SAMPLE_PRESETS[0]);
    }
  }, []);

  const loadPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    const dataUrl = renderPresetToDataUrl(preset, 900, 600);
    const img = new Image();
    img.onload = () => {
      setImageSrc(dataUrl);
      setImageMeta({
        name: `${preset.name} (Built-in Preset)`,
        width: img.naturalWidth || 900,
        height: img.naturalHeight || 600,
        sizeBytes: Math.round(dataUrl.length * 0.75),
        format: 'PNG Preset',
      });
      setEncodeResult(null);
      setEncodeError(null);
    };
    img.src = dataUrl;
  };

  // Handle file uploads (PNG, JPEG, WebP, BMP, GIF, SVG, AVIF, TIFF, etc.)
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/') && !file.name.match(/\.(png|jpe?g|webp|bmp|gif|svg|avif|tiff?)$/i)) {
      setEncodeError('Please select a valid image file (JPEG, PNG, WebP, BMP, GIF, SVG, AVIF).');
      return;
    }

    setEncodeError(null);
    setEncodeResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setImageSrc(dataUrl);
        setImageMeta({
          name: file.name,
          width: img.naturalWidth,
          height: img.naturalHeight,
          sizeBytes: file.size,
          format: file.type || file.name.split('.').pop()?.toUpperCase() || 'IMAGE',
        });
      };
      img.onerror = () => {
        setEncodeError('Failed to read image data. The file might be corrupted.');
      };
      img.src = dataUrl;
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

  // Capacity calculation
  const capacityInfo = imageMeta
    ? calculateCapacity(imageMeta.width, imageMeta.height, bitsPerChannel, usePassword)
    : { totalCapacityBytes: 0, maxPayloadBytes: 0, headerOverheadBytes: 0 };

  const messageBytes = new TextEncoder().encode(message).length;
  // If encrypted, add ~16 bytes for AES-GCM tag
  const estimatedTotalPayloadBytes = messageBytes + (usePassword ? 16 : 0);
  const capacityUsedPercent = capacityInfo.maxPayloadBytes > 0
    ? Math.min(100, (estimatedTotalPayloadBytes / capacityInfo.maxPayloadBytes) * 100)
    : 0;

  // Run Encoding
  const handleEncode = async () => {
    if (!imageSrc) {
      setEncodeError('Please upload or select an image first.');
      return;
    }
    if (!message.trim()) {
      setEncodeError('Please enter a secret message to hide in the image.');
      return;
    }
    if (usePassword) {
      if (!password.trim()) {
        setEncodeError('Please enter a password to protect your secret message.');
        return;
      }
      if (confirmPassword && password !== confirmPassword) {
        setEncodeError('Passwords do not match. Please verify your password.');
        return;
      }
    }
    if (estimatedTotalPayloadBytes > capacityInfo.maxPayloadBytes) {
      setEncodeError(
        `Message is too large (${estimatedTotalPayloadBytes.toLocaleString()} bytes). Maximum payload capacity for this image is ${capacityInfo.maxPayloadBytes.toLocaleString()} bytes.`
      );
      return;
    }

    setEncodeError(null);
    setIsEncoding(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = async () => {
        try {
          const result = await encodeMessageInImage(img, message, {
            bitsPerChannel,
            usePassword,
            password: usePassword ? password : undefined,
          });
          setEncodeResult(result);
          setIsEncoding(false);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          setEncodeError(msg);
          setIsEncoding(false);
        }
      };
      img.onerror = () => {
        setEncodeError('Could not process image for encoding.');
        setIsEncoding(false);
      };
      img.src = imageSrc;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setEncodeError(msg);
      setIsEncoding(false);
    }
  };

  const handleDownload = () => {
    if (!encodeResult) return;
    const link = document.createElement('a');
    link.href = encodeResult.stegoDataUrl;
    link.download = `stego_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner Notice */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Zero-Knowledge Security Architecture
              <span className="text-[11px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                Guaranteed
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              The password is <strong>never stored</strong> in the image file—not even as a hash. AES-256-GCM authenticated encryption ensures only someone with the exact password can decrypt and reveal your message.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 self-stretch sm:self-auto justify-center">
          <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
          <span>PBKDF2-100K + AES-256-GCM</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Selection & Details */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <FileImage className="w-4 h-4 text-emerald-400" />
                  1. Select Carrier Image
                </h3>
                <p className="text-xs text-slate-400">Accepts every format: PNG, JPEG, WebP, BMP, GIF, SVG</p>
              </div>

              {imageMeta && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300 underline"
                >
                  Change Image
                </button>
              )}
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              id="drop-zone"
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
                id="file-input"
                ref={fileInputRef}
                type="file"
                accept="image/*,.png,.jpg,.jpeg,.webp,.bmp,.gif,.svg,.avif,.tiff"
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
                      alt="Carrier preview"
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
                    <span>•</span>
                    <span className="uppercase text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {imageMeta?.format}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-emerald-400 border border-slate-700">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Drag & drop your image here or browse</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports all formats: PNG, JPG, JPEG, WebP, BMP, GIF, SVG
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Sample Presets */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400">Or use instant demo images:</span>
              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    id={`preset-${preset.id}`}
                    type="button"
                    onClick={() => loadPreset(preset)}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/40 text-left transition-all group"
                  >
                    <div className="text-xs font-semibold text-slate-300 group-hover:text-emerald-400 truncate">
                      {preset.name}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{preset.category}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Carrier Capacity Gauge */}
            {imageMeta && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Steganography Capacity:
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {(capacityInfo.maxPayloadBytes / 1024).toFixed(1)} KB ({(capacityInfo.maxPayloadBytes).toLocaleString()} bytes)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      capacityUsedPercent > 90
                        ? 'bg-rose-500'
                        : capacityUsedPercent > 60
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(2, capacityUsedPercent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Used: <strong className="text-slate-200">{estimatedTotalPayloadBytes} bytes</strong> ({capacityUsedPercent.toFixed(1)}%)
                  </span>
                  <span>
                    Free: <strong className="text-slate-200">{Math.max(0, capacityInfo.maxPayloadBytes - estimatedTotalPayloadBytes).toLocaleString()} bytes</strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Secret Message & Password Encryption */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                2. Enter Secret Message
              </h3>
              <p className="text-xs text-slate-400">The confidential text to hide inside the image pixels</p>
            </div>

            {/* Quick Sample Message Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-500">Insert sample:</span>
              {SAMPLE_MESSAGES.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMessage(s.text)}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 hover:text-emerald-400 hover:bg-slate-700/60 border border-slate-700/50 transition-colors"
                >
                  {s.title}
                </button>
              ))}
            </div>

            {/* Message Textarea */}
            <div className="space-y-1">
              <textarea
                id="secret-message-input"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type or paste your secret message here..."
                className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-100 placeholder-slate-600 text-sm font-mono resize-y transition-all"
              />
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>{message.length} characters • {messageBytes} bytes</span>
                {messageBytes > 0 && (
                  <span className="text-emerald-400">Ready to encode</span>
                )}
              </div>
            </div>

            {/* Password Protection Section */}
            <div className="pt-3 border-t border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className={`w-4 h-4 ${usePassword ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="text-sm font-semibold text-slate-200">Password Protection (AES-256-GCM)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="password-protection-toggle"
                    type="checkbox"
                    checked={usePassword}
                    onChange={(e) => setUsePassword(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              </div>

              {usePassword ? (
                <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Encryption Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter a strong password..."
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-slate-100 placeholder-slate-600 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Confirm Password <span className="text-slate-500 font-normal">(prevents typos)</span>
                    </label>
                    <input
                      id="confirm-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password to confirm..."
                      className={`w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border focus:ring-1 text-sm text-slate-100 placeholder-slate-600 font-mono ${
                        confirmPassword && confirmPassword !== password
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                          : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500'
                      }`}
                    />
                    {confirmPassword && confirmPassword !== password && (
                      <p className="text-[11px] text-rose-400 mt-1">Passwords do not match.</p>
                    )}
                  </div>

                  {/* Security clarification */}
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/30 text-[11px] text-emerald-300/90 leading-relaxed">
                    <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Reminder:</strong> The password will <em>not</em> be hidden or stored in the image. You must share this password securely with the recipient via an out-of-band channel.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/30 text-xs text-amber-300/80 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Unencrypted: Anyone with a steganography decoder will be able to read this message directly.</span>
                </div>
              )}
            </div>

            {/* Steganography Settings (Bit Depth) */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>LSB Bit Depth:</span>
              </div>
              <div className="flex items-center bg-slate-950 border border-slate-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setBitsPerChannel(1)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    bitsPerChannel === 1
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  1-bit (Ultra Stealth)
                </button>
                <button
                  type="button"
                  onClick={() => setBitsPerChannel(2)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    bitsPerChannel === 2
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  2-bit (2× Capacity)
                </button>
              </div>
            </div>

            {/* Error Message */}
            {encodeError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{encodeError}</span>
              </div>
            )}

            {/* Encode Action Button */}
            <button
              id="encode-button"
              type="button"
              disabled={isEncoding || !message.trim() || !imageSrc}
              onClick={handleEncode}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
            >
              {isEncoding ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Encrypting & Embedding Data...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Encode & Hide Message in Image</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Result Section (when encoding succeeds) */}
      {encodeResult && (
        <div className="space-y-6 pt-4 border-t border-slate-800">
          <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Message Successfully Encrypted & Hidden!</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Saved in <strong>Lossless PNG</strong> format to preserve pixel bits without compression degradation.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  id="download-stego-btn"
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Stego Image (PNG)</span>
                </button>

                {onSendToDecoder && (
                  <button
                    id="send-to-decoder-btn"
                    type="button"
                    onClick={() => onSendToDecoder(encodeResult.stegoDataUrl, usePassword ? password : '')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all"
                  >
                    <span>Test in Decoder</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-emerald-900/30 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Payload Embedded:</span>
                <span className="font-mono text-emerald-400 font-bold">{encodeResult.usedBytes} bytes</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Security:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {encodeResult.isEncrypted ? 'AES-256-GCM (Password)' : 'Plaintext UTF-8'}
                </span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Visual PSNR:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {encodeResult.psnr >= 99 ? '> 90 dB' : `${encodeResult.psnr} dB`}
                </span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Bit Modification:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {encodeResult.bitsPerChannel}-bit LSB (±1 value)
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Image Comparator */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Visual Inspection & Stego Quality Analysis
            </h4>
            <ImageComparator
              originalUrl={encodeResult.originalDataUrl}
              stegoUrl={encodeResult.stegoDataUrl}
              psnr={encodeResult.psnr}
              mse={encodeResult.mse}
              width={encodeResult.width}
              height={encodeResult.height}
            />
          </div>
        </div>
      )}
    </div>
  );
};
