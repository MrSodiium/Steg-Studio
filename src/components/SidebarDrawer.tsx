import React, { useEffect } from 'react';
import {
  X,
  FileImage,
  Video,
  Music,
  FileText,
  ScanEye,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Lock,
  ChevronRight,
  Shield
} from 'lucide-react';
import { MediaType } from '../types';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeMediaType: MediaType;
  onSelectMediaType: (type: MediaType) => void;
  onSelectTab: (tab: 'studio' | 'steganalysis' | 'security' | 'feedback') => void;
  activeTab: string;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  activeMediaType,
  onSelectMediaType,
  onSelectTab,
  activeTab,
}) => {
  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const MEDIA_OPTIONS: {
    type: MediaType;
    title: string;
    description: string;
    formats: string;
    icon: React.ElementType;
    badge: string;
    gradient: string;
  }[] = [
    {
      type: 'image',
      title: 'Image Steganography',
      description: 'LSB pixel matrix embedding across RGB color planes',
      formats: 'PNG, JPEG, WebP, BMP, GIF, SVG',
      icon: FileImage,
      badge: 'LSB Matrix',
      gradient: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    },
    {
      type: 'video',
      title: 'Video Steganography',
      description: 'Container stream & auxiliary data steganography',
      formats: 'MP4, WebM, AVI, MOV',
      icon: Video,
      badge: 'Stream / Atom',
      gradient: 'from-violet-500/20 to-purple-500/10 border-violet-500/30 text-violet-400',
    },
    {
      type: 'audio',
      title: 'Audio Steganography',
      description: '16-bit PCM sample modulation & waveform embedding',
      formats: 'WAV, MP3, OGG, FLAC',
      icon: Music,
      badge: 'Sample LSB',
      gradient: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
    },
    {
      type: 'document',
      title: 'Document Steganography',
      description: 'Zero-width Unicode invisible characters & EOF streams',
      formats: 'PDF, DOCX, TXT, MD, HTML',
      icon: FileText,
      badge: 'Zero-Width',
      gradient: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col h-full z-10 animate-slideRight">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-base">Steg Studio</span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Choose carrier media type</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Plausible Deniability Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Plausible Deniability Active</span>
            </div>
            <p className="text-[11px] text-emerald-300/80 leading-relaxed">
              If an invalid or missing password is used, media will never disclose whether it contains an encrypted payload. Only the correct password reveals the message.
            </p>
          </div>

          {/* Media Types Section */}
          <div className="space-y-2.5">
            <div className="px-1 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Select Carrier Media
              </span>
              <span className="text-[11px] text-slate-500">4 Supported Types</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {MEDIA_OPTIONS.map((media) => {
                const Icon = media.icon;
                const isSelected = activeMediaType === media.type && activeTab === 'studio';
                return (
                  <button
                    key={media.type}
                    type="button"
                    onClick={() => {
                      onSelectMediaType(media.type);
                      onSelectTab('studio');
                      onClose();
                    }}
                    className={`flex items-start gap-3.5 p-3 rounded-xl border text-left transition-all group ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl border ${media.gradient} shrink-0 mt-0.5`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold ${isSelected ? 'text-emerald-400' : 'text-slate-200 group-hover:text-white'}`}>
                          {media.title}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono shrink-0">
                          {media.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-1">
                        {media.description}
                      </p>
                      <span className="text-[10px] text-slate-500 mt-1 block font-mono truncate">
                        {media.formats}
                      </span>
                    </div>

                    <ChevronRight className={`w-4 h-4 self-center text-slate-600 transition-transform ${isSelected ? 'text-emerald-400 translate-x-0.5' : 'group-hover:text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Forensic Analysis Section */}
          <div className="space-y-2.5">
            <span className="px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
              2. Deep Steganalysis Forensics
            </span>

            <button
              type="button"
              onClick={() => {
                onSelectTab('steganalysis');
                onClose();
              }}
              className={`w-full flex items-center gap-3.5 p-3 rounded-xl border text-left transition-all group ${
                activeTab === 'steganalysis'
                  ? 'bg-slate-800/90 border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div className="p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-500/20 text-cyan-400 shrink-0">
                <ScanEye className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${activeTab === 'steganalysis' ? 'text-cyan-400' : 'text-slate-200 group-hover:text-white'}`}>
                    Steganalysis Hub
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    All Media
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  Chi-square (χ²), Shannon entropy, zero-width scan & container checks
                </p>
              </div>
            </button>
          </div>

          {/* Tools & Resources */}
          <div className="space-y-2.5">
            <span className="px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
              3. Security & Feedback
            </span>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onSelectTab('security');
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                  activeTab === 'security'
                    ? 'bg-slate-800 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-300 hover:bg-slate-800/40 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium">Security Architecture & Zero-Knowledge</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectTab('feedback');
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                  activeTab === 'feedback'
                    ? 'bg-slate-800 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-300 hover:bg-slate-800/40 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-medium">User Feedback & Feature Requests</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Client-Side AES-256-GCM</span>
          <span className="text-emerald-400 font-mono">100% Zero-Storage</span>
        </div>
      </div>
    </div>
  );
};
