import React, { useState, useRef } from 'react';
import {
  ScanEye,
  FileImage,
  Video,
  Music,
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Binary,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { analyzeImage, analyzeAudio, analyzeVideo, analyzeDocument } from '../utils/steganalysis';
import { SteganalysisReport, MediaType } from '../types';

export const SteganalysisHub: React.FC = () => {
  const [activeMediaFilter, setActiveMediaFilter] = useState<MediaType | 'auto'>('auto');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [report, setReport] = useState<SteganalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const runAnalysisOnFile = async (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setIsAnalyzing(true);
    setError(null);
    setReport(null);

    try {
      const type = file.type.toLowerCase();
      const name = file.name.toLowerCase();

      if (type.startsWith('image/') || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.webp') || name.endsWith('.bmp')) {
        const img = new Image();
        img.onload = async () => {
          try {
            const rep = await analyzeImage(img, file.name, file.size);
            setReport(rep);
            setIsAnalyzing(false);
          } catch (e: any) {
            setError(e?.message || 'Failed to analyze image');
            setIsAnalyzing(false);
          }
        };
        img.onerror = () => {
          setError('Failed to load image for forensic rendering');
          setIsAnalyzing(false);
        };
        img.src = URL.createObjectURL(file);
      } else if (type.startsWith('audio/') || name.endsWith('.wav') || name.endsWith('.mp3') || name.endsWith('.ogg')) {
        const rep = await analyzeAudio(file, file.name);
        setReport(rep);
        setIsAnalyzing(false);
      } else if (type.startsWith('video/') || name.endsWith('.mp4') || name.endsWith('.webm') || name.endsWith('.avi')) {
        const rep = await analyzeVideo(file, file.name);
        setReport(rep);
        setIsAnalyzing(false);
      } else {
        // Document / PDF / Text
        const rep = await analyzeDocument(file, file.name);
        setReport(rep);
        setIsAnalyzing(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Forensic analysis failed.');
      setIsAnalyzing(false);
    }
  };

  const runAnalysisOnText = async () => {
    if (!pastedText.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setReport(null);
    try {
      const rep = await analyzeDocument(pastedText);
      setReport(rep);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Text analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
          <ScanEye className="w-4 h-4" />
          <span>Steganalysis & Digital Forensics Suite</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Universal Multi-Media Steganalysis Hub
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Scan images, videos, audio tracks, and documents for statistical anomalies,
          LSB entropy elevation, χ² flattening, invisible Unicode markers, and trailing streams.
        </p>
      </div>

      {/* Input Selector Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Upload Carrier or Paste Text
          </span>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="flex items-center gap-1"><FileImage className="w-3.5 h-3.5 text-emerald-400" /> Images</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5 text-violet-400" /> Video</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Music className="w-3.5 h-3.5 text-cyan-400" /> Audio</span>
            <span>•</span>
            <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-amber-400" /> Documents</span>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-8 text-center cursor-pointer bg-slate-950/60 transition-colors group"
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) runAnalysisOnFile(e.target.files[0]);
            }}
          />
          <ScanEye className="w-10 h-10 text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
          <p className="text-sm font-semibold text-slate-200">
            {selectedFile ? selectedFile.name : 'Select or drop any media file to begin steganalysis'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Supports PNG, JPEG, WebP, MP4, WebM, WAV, MP3, PDF, DOCX, and TXT files
          </p>
        </div>

        {/* Text Paste Option for Quick Zero-Width Document Check */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-300">Or Paste Text to Inspect for Invisible Characters</label>
            <button
              type="button"
              onClick={runAnalysisOnText}
              disabled={!pastedText.trim() || isAnalyzing}
              className="px-3 py-1 rounded-md bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-all"
            >
              Analyze Text
            </button>
          </div>
          <textarea
            rows={2}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste text directly here to scan for zero-width Unicode steganography..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {isAnalyzing && (
          <div className="p-8 text-center space-y-3 bg-slate-950 rounded-xl border border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
            <p className="text-xs text-slate-300 font-medium">
              Computing bit-plane entropy, sample pairs, and cryptographic anomalies...
            </p>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Forensic Report Output */}
      {report && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-fadeIn">
          {/* Top Verdict Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                Target: {report.fileName} ({(report.fileSize / 1024).toFixed(1)} KB)
              </span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Verdict:</span>
                <span
                  className={`${
                    report.overallRisk === 'high_probability'
                      ? 'text-rose-400'
                      : report.overallRisk === 'suspicious'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {report.overallRisk === 'high_probability'
                    ? 'High Steganography Likelihood'
                    : report.overallRisk === 'suspicious'
                    ? 'Suspicious Anomalies Detected'
                    : 'Clean Natural Media'}
                </span>
              </h3>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Risk Score</span>
                <span className="text-2xl font-mono font-bold text-white">{report.riskScore} / 100</span>
              </div>

              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                  report.overallRisk === 'high_probability'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : report.overallRisk === 'suspicious'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}
              >
                {report.overallRisk === 'high_probability' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : report.overallRisk === 'suspicious' ? (
                  <AlertCircle className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            {report.summary}
          </p>

          {/* Visual Bit-Plane Map for Images */}
          {report.visualArtifactUrl && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  LSB Bit-Plane 0 Visualization
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Least Significant Bit Map</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Natural images show faint organic outlines; encrypted steganography creates uniform static white noise.
              </p>
              <div className="max-h-60 overflow-hidden rounded-lg border border-slate-800 bg-black flex items-center justify-center p-2">
                <img
                  src={report.visualArtifactUrl}
                  alt="LSB Plane Map"
                  className="max-h-56 object-contain"
                />
              </div>
            </div>
          )}

          {/* Metric Cards Grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Forensic Quantitative Metrics
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.metrics.map((metric, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">{metric.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        metric.status === 'anomalous'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : metric.status === 'suspicious'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {metric.status}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-sm text-slate-100">{metric.value}</div>
                  <p className="text-[11px] text-slate-500">{metric.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Findings */}
          {report.findings.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Detailed Forensic Findings
              </span>
              <div className="space-y-2">
                {report.findings.map((finding, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs ${
                      finding.severity === 'danger'
                        ? 'bg-rose-950/20 border-rose-800/60 text-rose-300'
                        : finding.severity === 'warning'
                        ? 'bg-amber-950/20 border-amber-800/60 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <strong className="block font-semibold mb-0.5">{finding.title}</strong>
                    <p className="text-[11px] opacity-90 leading-relaxed">{finding.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
