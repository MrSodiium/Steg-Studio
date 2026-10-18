import React from 'react';
import {
  Menu,
  Lock,
  FileImage,
  Video,
  Music,
  FileText,
  ScanEye,
  ShieldCheck,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { MediaType } from '../types';

interface HeaderProps {
  onOpenSidebar: () => void;
  activeMediaType: MediaType;
  onSelectMediaType: (type: MediaType) => void;
  activeTab: 'studio' | 'steganalysis' | 'security' | 'feedback';
  setActiveTab: (tab: 'studio' | 'steganalysis' | 'security' | 'feedback') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  activeMediaType,
  onSelectMediaType,
  activeTab,
  setActiveTab,
}) => {
  const mediaIcons = {
    image: FileImage,
    video: Video,
    audio: Music,
    document: FileText,
  };

  const ActiveMediaIcon = mediaIcons[activeMediaType];

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Left Side: Three Bars (Menu) + Brand */}
        <div className="flex items-center justify-between w-full lg:w-auto gap-3">
          <div className="flex items-center gap-3">
            {/* Three Bars Button */}
            <button
              type="button"
              onClick={onOpenSidebar}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm flex items-center gap-2 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              title="Open media selection menu (Image, Video, Audio, Document)"
              aria-label="Open carrier media selector menu"
            >
              <Menu className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline text-xs font-semibold text-slate-300 group-hover:text-white">
                Media Types
              </span>
            </button>

            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                    Steg Studio
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                    AES-256-GCM
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Zero-Knowledge Multi-Media Steganography & Forensics
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Current Media Badge */}
          <button
            type="button"
            onClick={onOpenSidebar}
            className="lg:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
          >
            <ActiveMediaIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="capitalize">{activeMediaType}</span>
          </button>
        </div>

        {/* Center / Right: Quick Media Switcher + Main Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-2 w-full lg:w-auto">
          {/* Media Quick Switcher Pills */}
          <div className="hidden sm:flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            {(['image', 'video', 'audio', 'document'] as MediaType[]).map((type) => {
              const Icon = mediaIcons[type];
              const isCurrent = activeMediaType === type && activeTab === 'studio';
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    onSelectMediaType(type);
                    setActiveTab('studio');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    isCurrent
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{type}</span>
                </button>
              );
            })}
          </div>

          {/* Steganalysis Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('steganalysis')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              activeTab === 'steganalysis'
                ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/25'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            <ScanEye className="w-4 h-4 text-cyan-400" />
            <span>Steganalysis</span>
          </button>

          {/* Security Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              activeTab === 'security'
                ? 'bg-slate-800 text-emerald-400 border-emerald-500/30 font-bold'
                : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Security</span>
          </button>

          {/* Feedback Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('feedback')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              activeTab === 'feedback'
                ? 'bg-slate-800 text-emerald-400 border-emerald-500/30 font-bold'
                : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Feedback</span>
          </button>
        </div>
      </div>
    </header>
  );
};
