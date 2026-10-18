import React from 'react';
import { ShieldCheck, KeyRound, Lock, Eye, AlertTriangle, Layers, CheckCircle2, HelpCircle } from 'lucide-react';

export const SecurityGuide: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Hero Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            Zero-Knowledge Cryptographic Steganography
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            How Password Protection Works Without Storing the Password
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            You specifically asked: <em>"don't hide the password in the image"</em>. Here is how modern cryptographic steganography achieves impenetrable security without ever writing your password or password hash into the carrier file.
          </p>
        </div>
      </div>

      {/* 3 Pillar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">1. PBKDF2 Key Derivation</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your password is never stored. Instead, it is passed through <strong>100,000 iterations</strong> of HMAC-SHA256 with a cryptographically random 128-bit salt to derive a 256-bit symmetric encryption key.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">2. AES-256-GCM Encryption</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The plaintext message is encrypted with Galois/Counter Mode (GCM). GCM generates an authentication tag that guarantees confidentiality and integrity against any tampering or altered pixels.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Eye className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">3. Zero-Knowledge Verify</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            When another person enters the password, WebCrypto verifies the 128-bit authentication tag. If the password is wrong, decryption immediately fails. The password cannot be extracted from the file.
          </p>
        </div>
      </div>

      {/* Bit Layout Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          What Actually Sits Inside the Image Pixels?
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          The embedded payload consists strictly of the following byte sequence stored in the Least Significant Bits (LSB):
        </p>

        <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs overflow-x-auto space-y-2 text-slate-300">
          <div className="flex items-center gap-2 text-emerald-400 font-bold pb-2 border-b border-slate-800">
            <span>[MAGIC: 'STEG']</span>
            <span>+</span>
            <span>[FLAGS: 1 Byte]</span>
            <span>+</span>
            <span>[SALT: 16 Bytes]</span>
            <span>+</span>
            <span>[IV: 12 Bytes]</span>
            <span>+</span>
            <span>[CIPHERTEXT + 16-BYTE AUTH TAG]</span>
          </div>
          <p className="text-slate-400 text-[11px] pt-1">
            Notice: No password, no password hash, and no password hints are stored. The salt and IV are public cryptographic nonces that prevent precomputed rainbow table attacks.
          </p>
        </div>
      </div>

      {/* Image Format & Transmission Rules */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          Formats & Transmission: How to Send Stego Images Without Corrupting Them
        </h3>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold">Any Input Image Format Supported</strong>
              <span>
                You can upload source images in <strong>JPEG, PNG, WebP, BMP, GIF, SVG, or AVIF</strong>. The browser rasterizes the image onto an HTML5 canvas to prepare pixel data for bitwise embedding.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold">Lossless PNG Export</strong>
              <span>
                The output carrier must be saved as <strong>PNG (Lossless)</strong>. If an image with hidden LSB data is saved as lossy JPEG, JPEG compression algorithms (DCT & quantization) round color values and permanently destroy the hidden bits.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-200 block font-semibold">How to Send via Messaging Apps (WhatsApp, Discord, Telegram)</strong>
              <p className="text-slate-300 mt-1 leading-relaxed">
                Most social media and chat apps automatically re-compress images to save bandwidth, which strips out steganography! To send a stego image safely:
              </p>
              <ul className="list-disc pl-4 mt-1.5 space-y-1 text-slate-400">
                <li><strong>WhatsApp:</strong> Send as <em>Document</em> (not Photo/Gallery).</li>
                <li><strong>Telegram:</strong> Send as <em>File / Uncompressed</em>.</li>
                <li><strong>Discord:</strong> Upload the `.png` file directly or send as a zip.</li>
                <li><strong>Email / Cloud Drive:</strong> Attach as a regular `.png` file or share via Google Drive/Dropbox.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
