import React, { useState, useRef } from 'react';
import {
  Music,
  Lock,
  Eye,
  EyeOff,
  Upload,
  Download,
  KeyRound,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Play,
  Pause,
  ScanEye,
  RefreshCw,
  Sliders,
  Volume2
} from 'lucide-react';
import { encodeMessageInAudio, decodeMessageFromAudio } from '../utils/audioSteganography';
import { analyzeAudio } from '../utils/steganalysis';
import { SteganalysisReport } from '../types';

interface AudioStudioProps {
  onSendToForensics?: (file: File) => void;
}

export const AudioStudio: React.FC<AudioStudioProps> = () => {
  const [subTab, setSubTab] = useState<'encode' | 'decode' | 'steganalysis'>('encode');

  // --- ENCODE STATE ---
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [usePassword, setUsePassword] = useState<boolean>(true);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isEncoding, setIsEncoding] = useState<boolean>(false);
  const [encodeError, setEncodeError] = useState<string | null>(null);
  const [encodedResult, setEncodedResult] = useState<{
    audioUrl: string;
    audioBlob: Blob;
    duration: number;
    sampleRate: number;
    channels: number;
  } | null>(null);

  // --- DECODE STATE ---
  const [decodeFile, setDecodeFile] = useState<File | null>(null);
  const [decodePassword, setDecodePassword] = useState<string>('');
  const [showDecodePassword, setShowDecodePassword] = useState<boolean>(false);
  const [isDecoding, setIsDecoding] = useState<boolean>(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decodedMessage, setDecodedMessage] = useState<string | null>(null);
  const [isDecryptedWithPassword, setIsDecryptedWithPassword] = useState<boolean>(false);

  // --- STEGANALYSIS STATE ---
  const [analysisFile, setAnalysisFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisReport, setAnalysisReport] = useState<SteganalysisReport | null>(null);

  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const decodeFileInputRef = useRef<HTMLInputElement>(null);
  const analysisFileInputRef = useRef<HTMLInputElement>(null);

  // Generate synthetic sample audio for quick testing
  const handleGenerateSampleAudio = () => {
    const sampleRate = 44100;
    const durationSec = 3;
    const numSamples = sampleRate * durationSec;
    const pcm = new Int16Array(numSamples);

    // Generate warm harmonic acoustic chord (A4 440Hz + E5 660Hz)
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const wave1 = Math.sin(2 * Math.PI * 440 * t) * 0.4;
      const wave2 = Math.sin(2 * Math.PI * 660 * t) * 0.3;
      const wave3 = Math.sin(2 * Math.PI * 880 * t) * 0.15;
      const decay = Math.exp(-t * 0.8);
      const combined = (wave1 + wave2 + wave3) * decay;
      pcm[i] = combined * 0x7fff;
    }

    // Build WAV
    const buffer = new ArrayBuffer(44 + pcm.length * 2);
    const view = new DataView(buffer);
    const writeString = (offset: number, str: string) => {
      for (let j = 0; j < str.length; j++) view.setUint8(offset + j, str.charCodeAt(j));
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcm.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, pcm.length * 2, true);

    let offset = 44;
    for (let i = 0; i < pcm.length; i++) {
      view.setInt16(offset, pcm[i], true);
      offset += 2;
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    const sampleFile = new File([blob], 'acoustic_preset_sample.wav', { type: 'audio/wav' });
    setAudioFile(sampleFile);
    setAudioPreviewUrl(URL.createObjectURL(blob));
    setEncodedResult(null);
  };

  const handleAudioUpload = (file: File) => {
    setAudioFile(file);
    setAudioPreviewUrl(URL.createObjectURL(file));
    setEncodedResult(null);
    setEncodeError(null);
  };

  const handleEncode = async () => {
    if (!audioFile) {
      setEncodeError('Please select or generate an audio file.');
      return;
    }
    if (!message.trim()) {
      setEncodeError('Please enter a secret message to embed.');
      return;
    }
    if (usePassword && !password) {
      setEncodeError('Please specify a secret password or uncheck password protection.');
      return;
    }

    setIsEncoding(true);
    setEncodeError(null);

    try {
      const result = await encodeMessageInAudio(audioFile, message, {
        usePassword,
        password: usePassword ? password : undefined,
      });
      setEncodedResult(result);
    } catch (err: unknown) {
      setEncodeError(err instanceof Error ? err.message : 'Encoding failed.');
    } finally {
      setIsEncoding(false);
    }
  };

  const handleDecode = async () => {
    if (!decodeFile) {
      setDecodeError('Please upload an audio file to extract.');
      return;
    }

    setIsDecoding(true);
    setDecodeError(null);
    setDecodedMessage(null);
    setIsDecryptedWithPassword(false);

    try {
      const result = await decodeMessageFromAudio(decodeFile, decodePassword);
      if (result.success) {
        setDecodedMessage(result.message);
        setIsDecryptedWithPassword(result.isEncrypted);
        setDecodeError(null);
      } else {
        // PLAUSIBLE DENIABILITY: Never reveal if the audio is encrypted
        setDecodeError('No readable message detected in this audio track. (If protected, verify your secret password).');
      }
    } catch {
      setDecodeError('No readable message detected in this audio track. (If protected, verify your secret password).');
    } finally {
      setIsDecoding(false);
    }
  };

  const handleRunAnalysis = async (file: File) => {
    setAnalysisFile(file);
    setIsAnalyzing(true);
    try {
      const rep = await analyzeAudio(file, file.name);
      setAnalysisReport(rep);
    } catch {
      // ignore
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyMessage = () => {
    if (!decodedMessage) return;
    navigator.clipboard.writeText(decodedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-1">
            <Music className="w-3.5 h-3.5" />
            <span>Audio Waveform Steganography</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Audio Carrier Studio
          </h2>
          <p className="text-xs text-slate-400">
            Embed secrets into 16-bit PCM audio sample LSBs with zero password leakage
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('encode')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'encode'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hide Message
          </button>
          <button
            type="button"
            onClick={() => setSubTab('decode')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'decode'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Extract Message
          </button>
          <button
            type="button"
            onClick={() => setSubTab('steganalysis')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'steganalysis'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Steganalysis
          </button>
        </div>
      </div>

      {/* SUBTAB: ENCODE */}
      {subTab === 'encode' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Audio Source */}
          <div className="lg:col-span-6 space-y-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                1. Select Carrier Audio
              </h3>
              <button
                type="button"
                onClick={handleGenerateSampleAudio}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium"
              >
                Use Acoustic Preset Sample
              </button>
            </div>

            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700/80 hover:border-cyan-500/60 rounded-xl p-6 text-center cursor-pointer bg-slate-950/60 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleAudioUpload(e.target.files[0]);
                }}
              />
              <Music className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-200">
                {audioFile ? audioFile.name : 'Upload Audio File (WAV, MP3, OGG, FLAC)'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {audioFile
                  ? `${(audioFile.size / 1024).toFixed(1)} KB • Click to change`
                  : 'Or click "Use Acoustic Preset Sample" above to test immediately'}
              </p>
            </div>

            {audioPreviewUrl && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] text-slate-400 font-medium block">Audio Playback Preview:</span>
                <audio controls src={audioPreviewUrl} className="w-full h-8" />
              </div>
            )}
          </div>

          {/* Right Column: Message & Password */}
          <div className="lg:col-span-6 space-y-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              2. Secret Message & Encryption
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Secret Message</label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type the secret message you want to hide inside the audio..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Password Toggle */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usePassword}
                  onChange={(e) => setUsePassword(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-xs font-medium text-slate-200">
                  Password Protect with AES-256-GCM
                </span>
              </label>

              {usePassword && (
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter secret password..."
                    className="w-full pl-3 pr-10 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>

            {encodeError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{encodeError}</span>
              </div>
            )}

            <button
              type="button"
              disabled={isEncoding}
              onClick={handleEncode}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
            >
              {isEncoding ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Modulating Audio PCM Samples...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Embed Message Into Audio</span>
                </>
              )}
            </button>

            {/* Encoded Success Card */}
            {encodedResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Audio Stego Encoded Successfully!
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {encodedResult.duration.toFixed(1)}s • 16-bit WAV
                  </span>
                </div>

                <audio controls src={encodedResult.audioUrl} className="w-full h-8" />

                <div className="flex gap-2 pt-1">
                  <a
                    href={encodedResult.audioUrl}
                    download="stego_secret_audio.wav"
                    className="flex-1 py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Stego WAV</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const file = new File([encodedResult.audioBlob], 'stego_audio.wav', { type: 'audio/wav' });
                      setDecodeFile(file);
                      setDecodePassword(password);
                      setSubTab('decode');
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    Test in Decoder →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB: DECODE */}
      {subTab === 'decode' && (
        <div className="max-w-2xl mx-auto space-y-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              Extract Secret From Audio
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Upload the carrier audio file and enter the secret password if protected.
            </p>
          </div>

          {/* Upload Drop Zone */}
          <div
            onClick={() => decodeFileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-5 text-center cursor-pointer bg-slate-950/60 transition-colors"
          >
            <input
              ref={decodeFileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setDecodeFile(e.target.files[0]);
                  setDecodedMessage(null);
                  setDecodeError(null);
                }
              }}
            />
            <Music className="w-7 h-7 text-cyan-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-200">
              {decodeFile ? decodeFile.name : 'Select or drop stego audio file'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">Supports WAV lossless stego containers</p>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Secret Password <span className="text-slate-500 font-normal">(Leave empty if not protected)</span>
            </label>
            <div className="relative">
              <input
                type={showDecodePassword ? 'text' : 'password'}
                value={decodePassword}
                onChange={(e) => setDecodePassword(e.target.value)}
                placeholder="Enter secret password (if protected)..."
                className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowDecodePassword(!showDecodePassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showDecodePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {decodeError && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{decodeError}</span>
            </div>
          )}

          <button
            type="button"
            disabled={isDecoding || !decodeFile}
            onClick={handleDecode}
            className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            {isDecoding ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Scanning PCM Audio Samples...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Extract Hidden Message</span>
              </>
            )}
          </button>

          {/* Decoded Message Card */}
          {decodedMessage && (
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/50 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Message Successfully Extracted!
                </span>
                {isDecryptedWithPassword && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono">
                    AES-256-GCM Verified
                  </span>
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-100 whitespace-pre-wrap select-all">
                {decodedMessage}
              </div>

              <button
                type="button"
                onClick={handleCopyMessage}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Secret Message'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB: STEGANALYSIS */}
      {subTab === 'steganalysis' && (
        <div className="max-w-3xl mx-auto space-y-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ScanEye className="w-4 h-4 text-cyan-400" />
              Audio Steganalysis & Entropy Forensics
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Inspect 16-bit PCM audio samples for LSB entropy elevation and sample pair anomalies.
            </p>
          </div>

          <div
            onClick={() => analysisFileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-5 text-center cursor-pointer bg-slate-950/60 transition-colors"
          >
            <input
              ref={analysisFileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleRunAnalysis(e.target.files[0]);
              }}
            />
            <ScanEye className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-200">
              {analysisFile ? analysisFile.name : 'Select audio file to analyze'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">WAV, MP3, OGG, or FLAC</p>
          </div>

          {isAnalyzing && (
            <div className="p-6 text-center text-xs text-slate-400 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cyan-400" />
              <p>Analyzing audio PCM bit-planes and frequency noise...</p>
            </div>
          )}

          {analysisReport && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Stego Likelihood Score</span>
                  <span className="text-xl font-bold text-white">{analysisReport.riskScore} / 100</span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    analysisReport.overallRisk === 'high_probability'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : analysisReport.overallRisk === 'suspicious'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {analysisReport.overallRisk === 'high_probability'
                    ? 'High Stego Risk'
                    : analysisReport.overallRisk === 'suspicious'
                    ? 'Suspicious Variance'
                    : 'Clean / Natural Acoustic'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysisReport.metrics.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <span className="text-slate-400 block font-medium">{m.name}</span>
                    <span className="text-slate-100 font-mono font-bold text-sm">{m.value}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5">{m.description}</p>
                  </div>
                ))}
              </div>

              {analysisReport.findings.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-slate-300">Detailed Findings:</span>
                  {analysisReport.findings.map((f, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl text-xs border ${
                        f.severity === 'danger'
                          ? 'bg-rose-950/20 border-rose-800/60 text-rose-300'
                          : f.severity === 'warning'
                          ? 'bg-amber-950/20 border-amber-800/60 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <strong className="block font-semibold mb-0.5">{f.title}</strong>
                      <p className="text-[11px] opacity-90">{f.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
