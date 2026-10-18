import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  Send,
  CheckCircle2,
  Bug,
  Lightbulb,
  ShieldCheck,
  Smile,
  Paperclip,
  X,
  Clock,
  Trash2,
  Download,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileImage
} from 'lucide-react';
import { FeedbackCategory, FeedbackItem } from '../types';

interface FeedbackProps {
  onNavigateToEncode?: () => void;
}

const STORAGE_KEY = 'steganography_studio_feedback_v1';

const CATEGORIES: {
  id: FeedbackCategory;
  label: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
  activeBorder: string;
}[] = [
  {
    id: 'general',
    label: 'General Experience',
    description: 'Overall design, ease of use, and usability feedback',
    icon: Smile,
    colorClass: 'text-amber-400',
    activeBorder: 'border-amber-500/60 bg-amber-500/10 text-amber-300',
  },
  {
    id: 'bug',
    label: 'Bug Report',
    description: 'Issues with encoding, decoding, or corrupted images',
    icon: Bug,
    colorClass: 'text-rose-400',
    activeBorder: 'border-rose-500/60 bg-rose-500/10 text-rose-300',
  },
  {
    id: 'feature',
    label: 'Feature Request',
    description: 'Suggestions for new formats, algorithms, or tools',
    icon: Lightbulb,
    colorClass: 'text-cyan-400',
    activeBorder: 'border-cyan-500/60 bg-cyan-500/10 text-cyan-300',
  },
  {
    id: 'cryptography',
    label: 'Security & Crypto',
    description: 'AES-256-GCM, zero-knowledge, or key derivation thoughts',
    icon: ShieldCheck,
    colorClass: 'text-emerald-400',
    activeBorder: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300',
  },
];

const RATING_LABELS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Fair Experience',
  3: 'Good & Functional',
  4: 'Very Good & Smooth',
  5: 'Excellent & Impressive!',
};

const SAMPLE_TAGS: Record<FeedbackCategory, string[]> = {
  general: ['Intuitive layout', 'Fast performance', 'Dark theme looks great', 'Could use tooltips'],
  bug: ['Decoding failed on JPEG', 'Large file slowdown', 'Password error edge-case', 'Mobile layout issue'],
  feature: ['Batch image processing', 'Audio steganography', 'Custom encryption keys', 'Stego pixel map export'],
  cryptography: ['Zero-knowledge verified', 'PBKDF2 rounds discussion', 'Argon2 support request', 'Salt randomness check'],
};

export const Feedback: React.FC<FeedbackProps> = ({ onNavigateToEncode }) => {
  // Form fields
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [message, setMessage] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // Steganography specific context
  const [showStegoContext, setShowStegoContext] = useState<boolean>(false);
  const [imageFormatTested, setImageFormatTested] = useState<string>('PNG');
  const [passwordUsed, setPasswordUsed] = useState<'yes' | 'no' | 'not_applicable'>('yes');
  const [decodingResult, setDecodingResult] = useState<'success' | 'failed' | 'not_tested'>('success');

  // Attachment
  const [attachment, setAttachment] = useState<{ name: string; dataUrl: string; sizeKb: number } | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedFeedback, setSubmittedFeedback] = useState<FeedbackItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Past submissions
  const [history, setHistory] = useState<FeedbackItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch {
      // ignore parsing error
    }
  }, []);

  const handleRatingClick = (val: number) => {
    setRating(val);
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachmentError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAttachmentError('Attachment must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        dataUrl: reader.result as string,
        sizeKb: Math.round(file.size / 1024),
      });
    };
    reader.onerror = () => {
      setAttachmentError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentError(null);
  };

  const addTagToMessage = (tag: string) => {
    if (message.includes(tag)) return;
    setMessage((prev) => (prev.trim() ? `${prev.trim()}\n• ${tag}` : `• ${tag}`));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (message.trim().length < 5) {
      setFormError('Please provide a message with at least 5 characters so we can understand your feedback.');
      return;
    }

    setIsSubmitting(true);

    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const newFeedback: FeedbackItem = {
      id: `STG-FB-${Date.now().toString().slice(-4)}-${randomSuffix}`,
      createdAt: Date.now(),
      category,
      rating,
      message: message.trim(),
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      stegoContext: showStegoContext
        ? {
            imageFormatTested,
            passwordUsed,
            decodingResult,
          }
        : undefined,
      attachmentName: attachment?.name,
      attachmentDataUrl: attachment?.dataUrl,
    };

    setTimeout(() => {
      const updatedHistory = [newFeedback, ...history];
      setHistory(updatedHistory);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      } catch (err) {
        console.warn('Could not persist feedback to localStorage', err);
      }

      setSubmittedFeedback(newFeedback);
      setIsSubmitting(false);

      // Reset form fields
      setMessage('');
      setAttachment(null);
    }, 450);
  };

  const resetForm = () => {
    setSubmittedFeedback(null);
    setMessage('');
    setAttachment(null);
    setFormError(null);
  };

  const deleteHistoryItem = (id: string) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearAllHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const copyFeedbackDetails = (item: FeedbackItem) => {
    const text = `Feedback ID: ${item.id}\nCategory: ${item.category}\nRating: ${item.rating}/5 stars\nDate: ${new Date(
      item.createdAt
    ).toLocaleString()}\nMessage:\n${item.message}${
      item.stegoContext
        ? `\n\nContext:\n- Format: ${item.stegoContext.imageFormatTested}\n- Password Protected: ${item.stegoContext.passwordUsed}\n- Decoding: ${item.stegoContext.decodingResult}`
        : ''
    }`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadHistoryJson = () => {
    const jsonStr = JSON.stringify(history, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `steganography-feedback-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Intro Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>User Feedback & Security Insights</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Help Us Improve Steganography Studio
        </h2>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Share your experience with image encoding, zero-knowledge AES-256 decryption,
          report edge cases, or request features. Your feedback is processed client-side.
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-sm">
        {/* Success View */}
        {submittedFeedback ? (
          <div className="text-center py-8 space-y-6 animate-fadeIn">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white">Thank You for Your Feedback!</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Your submission has been recorded with reference ID:
              </p>
              <div className="inline-flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400">
                <span>{submittedFeedback.id}</span>
                <button
                  type="button"
                  onClick={() => copyFeedbackDetails(submittedFeedback)}
                  className="hover:text-emerald-300 ml-1"
                  title="Copy Reference"
                >
                  {copiedId === submittedFeedback.id ? 'Copied!' : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-left max-w-lg mx-auto text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-400 pb-2 border-b border-slate-800">
                <span className="capitalize font-semibold text-slate-200">
                  {submittedFeedback.category} Feedback
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3 h-3 fill-current" />
                  {submittedFeedback.rating} / 5
                </span>
              </div>
              <p className="text-slate-300 italic whitespace-pre-line">"{submittedFeedback.message}"</p>
              {submittedFeedback.stegoContext && (
                <div className="pt-2 text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-800/60">
                  <span>Format: <strong>{submittedFeedback.stegoContext.imageFormatTested}</strong></span>
                  <span>Protected: <strong>{submittedFeedback.stegoContext.passwordUsed}</strong></span>
                  <span>Decode: <strong>{submittedFeedback.stegoContext.decodingResult}</strong></span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-all border border-slate-700"
              >
                Submit Another Response
              </button>
              {onNavigateToEncode && (
                <button
                  type="button"
                  onClick={onNavigateToEncode}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-bold transition-all shadow-md shadow-emerald-500/20"
                >
                  Return to Steganography Tool
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Feedback Submission Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
                1. What is your feedback about?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-start text-left p-3 rounded-xl border transition-all ${
                        isSelected
                          ? cat.activeBorder
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? '' : cat.colorClass}`} />
                        <span className="text-xs font-bold text-slate-200">{cat.label}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">{cat.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Star Rating */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
                  2. Overall Experience Rating
                </label>
                <span className="text-xs text-amber-400 font-medium">
                  {RATING_LABELS[hoverRating || rating]}
                </span>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-1.5" onMouseLeave={() => setHoverRating(null)}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        className="p-1 rounded-md text-slate-600 hover:scale-110 transition-transform focus:outline-none focus:ring-1 focus:ring-amber-400"
                        aria-label={`Rate ${star} stars`}
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            isFilled
                              ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_6px_rgba(251,191,36,0.3)]'
                              : 'text-slate-700 hover:text-slate-500'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="h-4 w-px bg-slate-800 mx-2" />
                <span className="text-xs text-slate-400">
                  {rating} of 5 stars selected
                </span>
              </div>
            </div>

            {/* Stego Context Accordion / Optional Toggle */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
              <button
                type="button"
                onClick={() => setShowStegoContext(!showStegoContext)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs text-slate-300 font-medium hover:bg-slate-800/40 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Image & Encryption Test Details (Optional)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {showStegoContext ? 'Expanded' : 'Add context'}
                  </span>
                </span>
                {showStegoContext ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showStegoContext && (
                <div className="p-4 pt-1 border-t border-slate-800 space-y-4 text-xs animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Image Format Tested</label>
                      <select
                        value={imageFormatTested}
                        onChange={(e) => setImageFormatTested(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="PNG">PNG (Lossless - Recommended)</option>
                        <option value="JPEG">JPEG / JPG</option>
                        <option value="WebP">WebP</option>
                        <option value="GIF">GIF</option>
                        <option value="BMP">BMP</option>
                        <option value="Generated Preset">Sample Preset Canvas</option>
                        <option value="Other">Other / Multiple</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Password Protection</label>
                      <select
                        value={passwordUsed}
                        onChange={(e) => setPasswordUsed(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="yes">Yes (AES-256-GCM Encrypted)</option>
                        <option value="no">No (Plain LSB Payload)</option>
                        <option value="not_applicable">Not Applicable</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-medium">Extraction / Decoding</label>
                      <select
                        value={decodingResult}
                        onChange={(e) => setDecodingResult(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="success">Success (Extracted perfectly)</option>
                        <option value="failed">Failed / Error Encountered</option>
                        <option value="not_tested">Have Not Tested Decoding</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="feedback-message" className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
                  3. Your Comments & Suggestions <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {message.length} / 1000 characters
                </span>
              </div>

              {/* Quick tags to assist user */}
              <div className="flex flex-wrap gap-1.5 items-center text-[11px] text-slate-400">
                <span className="text-slate-500">Suggested points:</span>
                {SAMPLE_TAGS[category].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTagToMessage(tag)}
                    className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>

              <textarea
                id="feedback-message"
                rows={4}
                maxLength={1000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  category === 'bug'
                    ? 'Please describe what happened, the image size, your browser, and if an error message appeared...'
                    : category === 'cryptography'
                    ? 'What do you think about the PBKDF2 + AES-256-GCM zero-knowledge architecture? Any suggestions for cryptographic hardening?'
                    : category === 'feature'
                    ? 'What new feature or workflow would make Steganography Studio even better for you?'
                    : 'What did you like or think can be improved? Share your experience with hiding secrets in images...'
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                required
              />
            </div>

            {/* Optional Attachment (e.g. Screenshot or Sample) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                <span>4. Optional Screenshot or Test Image</span>
              </label>

              {attachment ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <img
                      src={attachment.dataUrl}
                      alt="Attachment preview"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-800"
                    />
                    <div>
                      <p className="text-xs font-medium text-slate-200 truncate max-w-xs">{attachment.name}</p>
                      <p className="text-[10px] text-slate-400">{attachment.sizeKb} KB attached</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Remove attachment"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-400 hover:text-slate-300 cursor-pointer text-xs transition-colors">
                  <FileImage className="w-4 h-4 text-slate-500" />
                  <span>Attach an image or screenshot (PNG, JPG, max 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAttachmentUpload}
                    className="hidden"
                  />
                </label>
              )}

              {attachmentError && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {attachmentError}
                </p>
              )}
            </div>

            {/* Optional Contact Information */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase block mb-2">
                5. Contact Information (Optional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name or alias (optional)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email for reply (optional)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Submissions are processed locally. Your email is never shared or stored externally.
              </p>
            </div>

            {/* Error Display */}
            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                All feedback is stored locally in your session.
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Feedback</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Past Submissions History Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Your Feedback History ({history.length})
              </h3>
              <p className="text-xs text-slate-400">
                View or export feedback responses recorded in this browser
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {history.length} saved
              </span>
            )}
            {showHistory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {showHistory && (
          <div className="p-6 border-t border-slate-800 space-y-4 animate-fadeIn">
            {history.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">
                No feedback submissions recorded yet. Once you submit, your entries will appear here.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Saved Submissions ({history.length})</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={downloadHistoryJson}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                      title="Export as JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON</span>
                    </button>
                    <button
                      type="button"
                      onClick={clearAllHistory}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs border border-rose-500/20 transition-colors"
                      title="Clear all saved feedback"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-2 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 font-mono text-[11px] text-emerald-400 border border-slate-700">
                            {item.id}
                          </span>
                          <span className="capitalize font-semibold text-slate-200">
                            {item.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-amber-400">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{item.rating}/5</span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyFeedbackDetails(item)}
                            className="text-slate-500 hover:text-slate-300 p-1"
                            title="Copy details"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteHistoryItem(item.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                        {item.message}
                      </p>

                      {item.stegoContext && (
                        <div className="pt-2 text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-800/60">
                          <span>Format: <span className="text-slate-200">{item.stegoContext.imageFormatTested}</span></span>
                          <span>Password: <span className="text-slate-200">{item.stegoContext.passwordUsed}</span></span>
                          <span>Decoding: <span className="text-slate-200">{item.stegoContext.decodingResult}</span></span>
                        </div>
                      )}

                      {item.attachmentName && (
                        <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                          <Paperclip className="w-3 h-3" />
                          <span>Attached: {item.attachmentName}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
