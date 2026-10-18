import React, { useState, useRef } from 'react';
import {
  FileText,
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
  ScanEye,
  RefreshCw,
  FileCode,
  FileCheck,
  Binary
} from 'lucide-react';
import {
  encodeMessageInText,
  encodeMessageInBinaryDoc,
  decodeMessageFromDocument,
  ZW_CHARS
} from '../utils/documentSteganography';
import { analyzeDocument } from '../utils/steganalysis';
import { SteganalysisReport } from '../types';

export const DocumentStudio: React.FC = () => {
  const [subTab, setSubTab] = useState<'encode' | 'decode' | 'steganalysis'>('encode');

  // --- ENCODE STATE ---
  const [docType, setDocType] = useState<'text' | 'file'>('text');
  const [coverText, setCoverText] = useState<string>(
    'Project Status Update\nAll scheduled sprint objectives have been successfully verified and validated for deployment.\nSecurity compliance and integrity checks are completed.'
  );
  const [uploadDocFile, setUploadDocFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [usePassword, setUsePassword] = useState<boolean>(true);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isEncoding, setIsEncoding] = useState<boolean>(false);
  const [encodeError, setEncodeError] = useState<string | null>(null);

  // Encode Output
  const [stegoTextResult, setStegoTextResult] = useState<string | null>(null);
  const [showInvisibleMarkers, setShowInvisibleMarkers] = useState<boolean>(false);
  const [binaryDocResult, setBinaryDocResult] = useState<{ downloadUrl: string; size: number } | null>(null);

  // --- DECODE STATE ---
  const [decodeInputMode, setDecodeInputMode] = useState<'text' | 'file'>('text');
  const [decodeText, setDecodeText] = useState<string>('');
  const [decodeFile, setDecodeFile] = useState<File | null>(null);
  const [decodePassword, setDecodePassword] = useState<string>('');
  const [showDecodePassword, setShowDecodePassword] = useState<boolean>(false);
  const [isDecoding, setIsDecoding] = useState<boolean>(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decodedMessage, setDecodedMessage] = useState<string | null>(null);
  const [isDecryptedWithPassword, setIsDecryptedWithPassword] = useState<boolean>(false);

  // --- STEGANALYSIS STATE ---
  const [analysisText, setAnalysisText] = useState<string>('');
  const [analysisFile, setAnalysisFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisReport, setAnalysisReport] = useState<SteganalysisReport | null>(null);

  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const decodeFileInputRef = useRef<HTMLInputElement>(null);
  const analysisFileInputRef = useRef<HTMLInputElement>(null);

  // Encode
  const handleEncode = async () => {
    if (!message.trim()) {
      setEncodeError('Please enter a secret message to embed.');
      return;
    }
    if (usePassword && !password) {
      setEncodeError('Please enter a secret password or uncheck password protection.');
      return;
    }

    setIsEncoding(true);
    setEncodeError(null);

    try {
      if (docType === 'text') {
        const res = await encodeMessageInText(coverText, message, {
          usePassword,
          password: usePassword ? password : undefined,
        });
        setStegoTextResult(res.stegoText);
        setBinaryDocResult(null);
      } else {
        if (!uploadDocFile) {
          setEncodeError('Please choose a document file (PDF, DOCX, etc.).');
          setIsEncoding(false);
          return;
        }
        const res = await encodeMessageInBinaryDoc(uploadDocFile, uploadDocFile.name, message, {
          usePassword,
          password: usePassword ? password : undefined,
        });
        setBinaryDocResult({ downloadUrl: res.downloadUrl, size: res.stegoSize });
        setStegoTextResult(null);
      }
    } catch (err: unknown) {
      setEncodeError(err instanceof Error ? err.message : 'Encoding failed.');
    } finally {
      setIsEncoding(false);
    }
  };

  // Decode
  const handleDecode = async () => {
    setIsDecoding(true);
    setDecodeError(null);
    setDecodedMessage(null);
    setIsDecryptedWithPassword(false);

    try {
      let result;
      if (decodeInputMode === 'text') {
        if (!decodeText.trim()) {
          setDecodeError('Please paste document text to extract.');
          setIsDecoding(false);
          return;
        }
        result = await decodeMessageFromDocument(decodeText, decodePassword);
      } else {
        if (!decodeFile) {
          setDecodeError('Please select a document file.');
          setIsDecoding(false);
          return;
        }
        result = await decodeMessageFromDocument(decodeFile, decodePassword);
      }

      if (result.success) {
        setDecodedMessage(result.message);
        setIsDecryptedWithPassword(result.isEncrypted);
        setDecodeError(null);
      } else {
        // PLAUSIBLE DENIABILITY: Never reveal if the document is encrypted
        setDecodeError('No hidden message found in this document. (If protected, verify your secret password).');
      }
    } catch {
      setDecodeError('No hidden message found in this document. (If protected, verify your secret password).');
    } finally {
      setIsDecoding(false);
    }
  };

  // Steganalysis
  const handleRunAnalysis = async (input: string | File) => {
    setIsAnalyzing(true);
    try {
      const rep = await analyzeDocument(input);
      setAnalysisReport(rep);
    } catch {
      // ignore
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getVisualizedStegoText = (txt: string) => {
    // Replace invisible zero-width characters with colorful visible badges
    const parts = [];
    for (let i = 0; i < txt.length; i++) {
      const ch = txt[i];
      if (ch === ZW_CHARS.ZERO) {
        parts.push(<span key={i} className="bg-cyan-500/20 text-cyan-400 font-mono text-[10px] px-0.5 rounded border border-cyan-500/40">0</span>);
      } else if (ch === ZW_CHARS.ONE) {
        parts.push(<span key={i} className="bg-amber-500/20 text-amber-400 font-mono text-[10px] px-0.5 rounded border border-amber-500/40">1</span>);
      } else if (ch === ZW_CHARS.DELIM) {
        parts.push(<span key={i} className="bg-rose-500/20 text-rose-400 font-mono text-[10px] px-0.5 rounded border border-rose-500/40">§</span>);
      } else {
        parts.push(ch);
      }
    }
    return parts;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Zero-Width & Document Steganography</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Document Carrier Studio
          </h2>
          <p className="text-xs text-slate-400">
            Invisible Unicode zero-width characters in text & PDF trailer stream steganography
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('encode')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'encode'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
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
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
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
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
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
          {/* Left Column: Carrier Source */}
          <div className="lg:col-span-6 space-y-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-amber-400" />
                1. Select Document Format
              </h3>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setDocType('text')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    docType === 'text' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  Invisible Text (Zero-Width)
                </button>
                <button
                  type="button"
                  onClick={() => setDocType('file')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    docType === 'file' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  PDF / File (Trailer)
                </button>
              </div>
            </div>

            {docType === 'text' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <label className="font-semibold text-slate-300">Carrier Cover Text</label>
                  <span>Appears normal to viewers</span>
                </div>
                <textarea
                  rows={6}
                  value={coverText}
                  onChange={(e) => setCoverText(e.target.value)}
                  placeholder="Enter normal visible text where the secret will be embedded invisibly..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700/80 hover:border-amber-500/60 rounded-xl p-8 text-center cursor-pointer bg-slate-950/60 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.doc,.zip,.bin"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setUploadDocFile(e.target.files[0]);
                  }}
                />
                <FileText className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-200">
                  {uploadDocFile ? uploadDocFile.name : 'Upload PDF or Document File'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {uploadDocFile
                    ? `${(uploadDocFile.size / 1024).toFixed(1)} KB • Click to replace`
                    : 'PDF, Word, or binary documents'}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Secret Message & Settings */}
          <div className="lg:col-span-6 space-y-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              2. Secret Message & Encryption
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Secret Message</label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type the secret message you want to hide..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Password Toggle */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={usePassword}
                  onChange={(e) => setUsePassword(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
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
                    className="w-full pl-3 pr-10 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
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
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {isEncoding ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Injecting Steganographic Stream...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Hide Message in Document</span>
                </>
              )}
            </button>

            {/* Stego Text Output */}
            {stegoTextResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Invisible Zero-Width Stego Ready!
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowInvisibleMarkers(!showInvisibleMarkers)}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <Binary className="w-3.5 h-3.5" />
                    <span>{showInvisibleMarkers ? 'Hide Markers' : 'Reveal Hidden Bits'}</span>
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto font-sans">
                  {showInvisibleMarkers ? getVisualizedStegoText(stegoTextResult) : stegoTextResult}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopyText(stegoTextResult)}
                    className="flex-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied Stego Text!' : 'Copy Invisible Stego Text'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDecodeInputMode('text');
                      setDecodeText(stegoTextResult);
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

            {/* Binary Doc Output */}
            {binaryDocResult && (
              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Document Trailer Stego Created!
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    {(binaryDocResult.size / 1024).toFixed(1)} KB
                  </span>
                </div>

                <a
                  href={binaryDocResult.downloadUrl}
                  download="stego_document.pdf"
                  className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Stego Document</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB: DECODE */}
      {subTab === 'decode' && (
        <div className="max-w-2xl mx-auto space-y-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Extract Secret From Document
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Supports invisible zero-width text and PDF trailer documents.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setDecodeInputMode('text')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  decodeInputMode === 'text' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Paste Text
              </button>
              <button
                type="button"
                onClick={() => setDecodeInputMode('file')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  decodeInputMode === 'file' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Upload File
              </button>
            </div>
          </div>

          {decodeInputMode === 'text' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Paste Document Text with Hidden Bits</label>
              <textarea
                rows={5}
                value={decodeText}
                onChange={(e) => setDecodeText(e.target.value)}
                placeholder="Paste the document text here..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:border-amber-500 focus:outline-none font-sans"
              />
            </div>
          ) : (
            <div
              onClick={() => decodeFileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-6 text-center cursor-pointer bg-slate-950/60 transition-colors"
            >
              <input
                ref={decodeFileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) setDecodeFile(e.target.files[0]);
                }}
              />
              <FileText className="w-7 h-7 text-amber-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-200">
                {decodeFile ? decodeFile.name : 'Select or drop document file (PDF, TXT, etc.)'}
              </p>
            </div>
          )}

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
                className="w-full pl-3 pr-10 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
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
            disabled={isDecoding}
            onClick={handleDecode}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {isDecoding ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Scanning Document Streams...</span>
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
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/50 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Message Successfully Extracted!
                </span>
                {isDecryptedWithPassword && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono">
                    AES-256-GCM Verified
                  </span>
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-100 whitespace-pre-wrap select-all">
                {decodedMessage}
              </div>

              <button
                type="button"
                onClick={() => handleCopyText(decodedMessage)}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
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
              <ScanEye className="w-4 h-4 text-amber-400" />
              Document & Zero-Width Steganalysis
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Detect invisible zero-width Unicode characters and PDF EOF trailer appendages.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Paste Text to Scan</label>
            <textarea
              rows={4}
              value={analysisText}
              onChange={(e) => {
                setAnalysisText(e.target.value);
                if (e.target.value) handleRunAnalysis(e.target.value);
              }}
              placeholder="Paste text here to immediately analyze for invisible characters..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="text-center text-xs text-slate-500">— OR —</div>

          <div
            onClick={() => analysisFileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-5 text-center cursor-pointer bg-slate-950/60 transition-colors"
          >
            <input
              ref={analysisFileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setAnalysisFile(e.target.files[0]);
                  handleRunAnalysis(e.target.files[0]);
                }
              }}
            />
            <FileCheck className="w-7 h-7 text-amber-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-200">
              {analysisFile ? analysisFile.name : 'Upload PDF or Document File to Analyze'}
            </p>
          </div>

          {isAnalyzing && (
            <div className="p-6 text-center text-xs text-slate-400 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-400" />
              <p>Scanning document streams and Unicode character tables...</p>
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
                    ? 'Steganography Detected'
                    : analysisReport.overallRisk === 'suspicious'
                    ? 'Suspicious Characters'
                    : 'Clean Document'}
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
