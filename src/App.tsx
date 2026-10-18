/**
 * Steg Studio
 * Multi-Media Steganography & Forensics Platform
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { SidebarDrawer } from './components/SidebarDrawer';
import { Encoder } from './components/Encoder';
import { Decoder } from './components/Decoder';
import { AudioStudio } from './components/AudioStudio';
import { VideoStudio } from './components/VideoStudio';
import { DocumentStudio } from './components/DocumentStudio';
import { SteganalysisHub } from './components/SteganalysisHub';
import { SecurityGuide } from './components/SecurityGuide';
import { Feedback } from './components/Feedback';
import { MediaType } from './types';
import {
  FileImage,
  Video,
  Music,
  FileText,
  Lock,
  Eye,
  Shield,
  ScanEye,
  MessageSquare
} from 'lucide-react';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeMediaType, setActiveMediaType] = useState<MediaType>('image');
  const [activeTab, setActiveTab] = useState<'studio' | 'steganalysis' | 'security' | 'feedback'>('studio');

  // Image studio subtab state
  const [imageSubTab, setImageSubTab] = useState<'encode' | 'decode'>('encode');
  const [transferredImage, setTransferredImage] = useState<string | null>(null);
  const [transferredPassword, setTransferredPassword] = useState<string>('');

  const handleSendToDecoder = (dataUrl: string, passwordHint?: string) => {
    setTransferredImage(dataUrl);
    setTransferredPassword(passwordHint || '');
    setActiveMediaType('image');
    setActiveTab('studio');
    setImageSubTab('decode');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* 3-Bars Sidebar Drawer */}
      <SidebarDrawer
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeMediaType={activeMediaType}
        onSelectMediaType={(type) => {
          setActiveMediaType(type);
          setActiveTab('studio');
        }}
        onSelectTab={(tab) => {
          setActiveTab(tab);
        }}
        activeTab={activeTab}
      />

      {/* Top Header with 3 Bars Button */}
      <Header
        onOpenSidebar={() => setSidebarOpen(true)}
        activeMediaType={activeMediaType}
        onSelectMediaType={(type) => {
          setActiveMediaType(type);
          setActiveTab('studio');
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Studio View */}
        {activeTab === 'studio' && (
          <div className="space-y-6">
            {/* IMAGE STUDIO */}
            {activeMediaType === 'image' && (
              <div className="space-y-6">
                {/* Image Subtabs Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-1">
                      <FileImage className="w-3.5 h-3.5" />
                      <span>RGB Bit-Plane Steganography</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                      Image Carrier Studio
                    </h2>
                    <p className="text-xs text-slate-400">
                      Hide & extract password-protected secrets within lossless PNG and WebP images
                    </p>
                  </div>

                  <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
                    <button
                      type="button"
                      onClick={() => setImageSubTab('encode')}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        imageSubTab === 'encode'
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Hide Message</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageSubTab('decode')}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        imageSubTab === 'decode'
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Extract Message</span>
                    </button>
                  </div>
                </div>

                {imageSubTab === 'encode' ? (
                  <Encoder onSendToDecoder={handleSendToDecoder} />
                ) : (
                  <Decoder
                    initialImageSrc={transferredImage}
                    initialPassword={transferredPassword}
                  />
                )}
              </div>
            )}

            {/* VIDEO STUDIO */}
            {activeMediaType === 'video' && <VideoStudio />}

            {/* AUDIO STUDIO */}
            {activeMediaType === 'audio' && <AudioStudio />}

            {/* DOCUMENT STUDIO */}
            {activeMediaType === 'document' && <DocumentStudio />}
          </div>
        )}

        {/* Dedicated Steganalysis Hub */}
        {activeTab === 'steganalysis' && <SteganalysisHub />}

        {/* Security Guide */}
        {activeTab === 'security' && <SecurityGuide />}

        {/* Feedback View */}
        {activeTab === 'feedback' && (
          <Feedback onNavigateToEncode={() => {
            setActiveMediaType('image');
            setActiveTab('studio');
            setImageSubTab('encode');
          }} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>
              Steg Studio • Plausible Deniability Active • Zero Password Leakage • 100% In-Browser Cryptography
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <span>Carrier Media (Images, Video, Audio, Docs)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('steganalysis')}
              className="hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              <ScanEye className="w-3.5 h-3.5" />
              <span>Steganalysis</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Security</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('feedback')}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Feedback</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
