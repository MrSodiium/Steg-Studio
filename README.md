# Steg Studio 🛡️
> **Zero-Knowledge Multi-Media Steganography & Digital Forensics Platform**

Steg Studio is a modern web application designed for secure, undetectable data hiding (steganography) and forensic detection (steganalysis) across four primary media types: **Images**, **Videos**, **Audio**, and **Documents**. 

All cryptographic and steganographic computations run **100% locally in the browser runtime** via the native Web Crypto, Canvas, and Web Audio APIs. No carrier files, secret messages, or passwords are ever transmitted to any external server or database.

---

## 📑 Table of Contents
1. [Key Features](#-key-features)
2. [Resources & Technology Stack](#-resources--technology-stack)
   - [Frontend Architecture](#frontend-architecture)
   - [Backend & Server Runtime](#backend--server-runtime)
   - [Database & Storage Architecture](#database--storage-architecture)
   - [Cryptographic Primitives](#cryptographic-primitives)
   - [Steganographic Algorithms](#steganographic-algorithms)
   - [Steganalysis & Digital Forensics Engine](#steganalysis--digital-forensics-engine)
3. [How to Use Steg Studio](#-how-to-use-steg-studio)
   - [Image Carrier Studio](#1-image-carrier-studio)
   - [Video Carrier Studio](#2-video-carrier-studio)
   - [Audio Carrier Studio](#3-audio-carrier-studio)
   - [Document Carrier Studio](#4-document-carrier-studio)
   - [Universal Steganalysis Hub](#5-universal-steganalysis-hub)
   - [Plausible Deniability Workflow](#6-plausible-deniability-workflow)
4. [How to Run the Code (Git & Local Setup)](#-how-to-run-the-code-git--local-setup)
   - [Prerequisites](#prerequisites)
   - [Step 1: Clone the Repository](#step-1-clone-the-repository)
   - [Step 2: Install Dependencies](#step-2-install-dependencies)
   - [Step 3: Environment Configuration](#step-3-environment-configuration)
   - [Step 4: Launch Development Server](#step-4-launch-development-server)
   - [Step 5: Production Build & Preview](#step-5-production-build--preview)
   - [Step 6: Code Quality & Type Checking](#step-6-code-quality--type-checking)
5. [Project Directory Structure](#-project-directory-structure)
6. [Security Best Practices & Threat Model](#-security-best-practices--threat-model)
7. [License](#-license)

---

## 🌟 Key Features

- **Multi-Media Carrier Coverage:** Embed secrets into Images (PNG, WebP, JPEG, BMP), Videos (MP4, WebM), Audio (WAV, MP3, OGG), and Documents (TXT, Markdown, Code, PDF, DOCX).
- **Zero-Knowledge Privacy:** 100% client-side operations; zero telemetry, zero server-side logging.
- **Military-Grade Encryption:** AES-256-GCM authenticated encryption with PBKDF2 (100,000 iterations of SHA-256) and unique 16-byte random salts.
- **Plausible Deniability:** Decryption failures and missing payloads return identical neutral feedback. The carrier never admits whether it contains encrypted data.
- **Built-in Synthetic Media Generators:** Generate test carriers on the fly (Canvas animated video, Web Audio acoustic chords, pixel patterns) without needing external media.
- **Multi-Media Steganalysis:** Run statistical scans including $\chi^2$ (Chi-square) pairs-of-values analysis, Shannon entropy calculation, bit-plane 0 noise mapping, and invisible Unicode marker detection.
- **Interactive Visual Comparison:** Split-slider overlay comparing original vs. stego images down to individual pixel differences.

---

## 🛠️ Resources & Technology Stack

### Frontend Architecture
| Resource | Purpose |
| :--- | :--- |
| **React 19 (`react`, `react-dom`)** | Component-driven UI runtime, functional components, and hooks. |
| **TypeScript 7** | Strict static typing, custom interfaces, and type safety across binary data buffers. |
| **Vite 8** | Next-generation build tool providing near-instant dev server startup and optimized tree-shaken production bundles. |
| **Tailwind CSS 4 (`@tailwindcss/vite`)** | Modern utility-first CSS framework with custom glassmorphism and cyber-forensic themes. |
| **Lucide React** | Feather-light SVG iconography for media carriers, cryptographic locks, and forensic tools. |
| **Motion** | Smooth UI transitions for drawers, tabs, and metric badges. |

### Backend & Server Runtime
- **Zero-Knowledge Architecture:** Unlike conventional applications that send user files to a server for processing, Steg Studio processes all heavy binary arrays, audio sample frames, and image pixels directly inside the client's browser engine.
- **Express / Node.js Runtime:** Included for containerization, production previewing, and server-side capability bindings where needed.
- **Native Browser Web APIs:**
  - `crypto.subtle` (Web Crypto API): Hardware-accelerated AES-256-GCM cipher and PBKDF2 key derivation.
  - `CanvasRenderingContext2D` / `ImageData`: Direct read/write access to RGBA pixel bytes.
  - `AudioContext` & `OfflineAudioContext`: 16-bit PCM audio decoding and sample modulation.
  - `MediaRecorder` & `canvas.captureStream`: Client-side synthetic video and audio rendering.

### Database & Storage Architecture
- **Zero-Persistence Privacy Model:** Steg Studio deliberately uses **no central database** (neither SQL nor NoSQL).
- **Ephemeral In-Memory Lifecycle:** Files, audio buffers, and generated stego media reside solely in browser memory via `ArrayBuffer`, `Uint8Array`, and temporary `URL.createObjectURL` references.
- **Automatic Garbage Collection:** Object URLs are released and buffers discarded on tab navigation or reset, leaving no forensic traces on disk.

### Cryptographic Primitives
| Parameter | Specification | Purpose |
| :--- | :--- | :--- |
| **Cipher** | **AES-256-GCM** | Authenticated symmetric encryption with 256-bit keys and 128-bit authentication tags. |
| **Key Derivation** | **PBKDF2** | Derives encryption keys from user passwords. |
| **Hash Function** | **SHA-256** | Secure hash for the derivation function. |
| **Iterations** | **100,000 rounds** | Defense against GPU/ASIC brute-force dictionary attacks. |
| **Salt** | **16 bytes (128 bits)** | Cryptographically secure random bytes generated via `crypto.getRandomValues`. |
| **Initialization Vector (IV)** | **12 bytes (96 bits)** | Unique random IV per message to ensure identical plaintexts yield different ciphertexts. |

### Steganographic Algorithms
1. **Images (LSB Substitution):**
   - Modulates the least significant bits (1 or 2 bits) of Red, Green, and Blue color channels while preserving the Alpha channel.
   - Embeds a 32-bit payload length header followed by binary payload streams.
2. **Audio (PCM Sample Modulation):**
   - Decodes audio to raw 16-bit signed PCM audio samples.
   - Adjusts the lowest significant bit of uncompressed audio samples, preserving audio fidelity with zero audible distortion.
3. **Video (Stream & Container Atoms):**
   - Appends synchronized metadata streams and trailer payload packets without corrupting video container playback.
4. **Documents (Zero-Width Unicode & Trailer Stream):**
   - For text/markdown/code: Encodes binary bits into invisible non-printing Unicode characters:
     - `0` bit $\to$ `\u200B` (Zero-Width Space)
     - `1` bit $\to$ `\u200C` (Zero-Width Non-Joiner)
     - Delimiter $\to$ `\u200D` (Zero-Width Joiner)
   - For binary files (PDF/DOCX): Injects cryptographic payload streams past EOF (End-Of-File) delimiters without corrupting document viewers.

### Steganalysis & Digital Forensics Engine
- **$\chi^2$ (Chi-square) Pairs of Values (PoV):** Tests whether adjacent even/odd pixel value pairs have artificially equalized frequencies due to LSB replacement.
- **Shannon Bit-Plane Entropy:** Measures information density in bit-plane 0 ($H = -\sum p_i \log_2 p_i$). Natural media exhibits low/moderate entropy; encrypted data approaches theoretical maximum randomness ($8.0$).
- **Visual Bit-Plane 0 Contrast Map:** Isolates the least significant bit plane and scales values to pure black ($0$) and white ($255$) to expose artificial static noise patterns.
- **Invisible Unicode Scanner:** Traverses text streams to detect hidden zero-width character sequences and calculates hidden-to-visible character ratios.

---

## 🚀 How to Use Steg Studio

### 1. Image Carrier Studio
1. Click the **Media Types** button (or top navigation pill) and select **Image**.
2. **Hide Message (Encoder):**
   - Upload an image (PNG, WebP, JPEG, BMP) or choose a preset.
   - Type your secret message.
   - Choose LSB density (1 bit/channel for maximum stealth, 2 bits/channel for double capacity).
   - Enable **Password Protection** with AES-256-GCM.
   - Click **Embed & Encrypt**.
   - Inspect the **Interactive Visual Comparison Slider** to verify zero visible degradation.
   - Download the resulting lossless `.png` carrier.
3. **Extract Message (Decoder):**
   - Upload the stego image.
   - Enter the password (if protected).
   - Click **Extract Secret Message**.

### 2. Video Carrier Studio
1. Select **Video** from the media selector.
2. **Hide:** Upload an MP4/WebM video or click **"Generate Canvas Preset Video"** to render a 60-frame animated test video in real time.
3. Enter your secret message and optional password, then click **Embed Message Into Video**.
4. Download the carrier video or click **Test in Decoder**.
5. **Extract:** Upload the video in the **Extract Message** tab to retrieve the secret.

### 3. Audio Carrier Studio
1. Select **Audio** from the media selector.
2. **Hide:** Upload a WAV/MP3 file or click **"Generate Acoustic Tone Audio"** to synthesize a sample chord.
3. Enter your message and password, then click **Encode Secret into Audio**.
4. Listen to the audio preview to verify clear acoustics, then download the resulting WAV carrier.
5. **Extract:** Upload the stego audio in the **Extract Message** tab to reveal the payload.

### 4. Document Carrier Studio
1. Select **Document** from the media selector.
2. **Invisible Text Mode:**
   - Type or paste standard text (an article, email, or code snippet).
   - Enter your secret message and optional password.
   - Click **Embed Secret into Document**.
   - Copy or download the output. To any reader, text editor, or spellchecker, the text appears completely standard, while containing invisible zero-width stego sequences.
3. **Binary PDF / DOCX Mode:**
   - Upload a PDF or DOCX file, embed your secret payload, and download the resulting file. The document opens normally in PDF viewers while retaining the hidden payload.

### 5. Universal Steganalysis Hub
1. Click the **Steganalysis** tab in the top header.
2. Drop any image, video, audio track, document, or paste suspicious text into the analysis box.
3. The forensic engine computes:
   - **Risk Score** (0 - 100) and overall verdict (Clean, Suspicious, or High Probability of Stego).
   - **LSB Bit-Plane 0 Visualization** (for images).
   - **Shannon Entropy and Chi-square statistic**.
   - **Hidden-to-visible ratio** and auxiliary trailer indicators.

### 6. Plausible Deniability Workflow
- If an unauthorized person inspects a protected carrier file or enters an incorrect password:
  - Steg Studio **does NOT say** `"Invalid Password"` or `"Authentication Failed"`.
  - Instead, it returns: `"No readable message found in this file"`.
  - This guarantees that an adversary cannot prove whether a carrier contains encrypted data or is simply an ordinary file.

---

## 💻 How to Run the Code (Git & Local Setup)

Follow these instructions to clone, install, and run Steg Studio on your local machine.

### Prerequisites
Before starting, ensure you have the following installed:
- **Node.js**: v18.18.0 or later (v20+ recommended) — [Download Node.js](https://nodejs.org/)
- **npm** (comes with Node.js) or **pnpm** / **yarn** / **bun**
- **Git** — [Download Git](https://git-scm.com/)

Verify installations:
```bash
node -v
npm -v
git --version
```

---

### Step 1: Clone the Repository
Open your terminal and clone the repository using Git:

```bash
git clone https://github.com/your-username/steg-studio.git
```

Navigate into the project directory:
```bash
cd steg-studio
```

---

### Step 2: Install Dependencies
Install all required npm packages:

```bash
npm install
```

*(Or using your preferred package manager)*:
```bash
# Using pnpm
pnpm install

# Using bun
bun install
```

---

### Step 3: Environment Configuration
Copy the sample environment file to `.env`:

```bash
cp .env.example .env
```

> **Note:** Steg Studio's steganography, encryption, and forensic engines run 100% locally in the browser and do not require external API keys for core operation.

---

### Step 4: Launch Development Server
Start the Vite development server:

```bash
npm run dev
```

The terminal will display the local development URL:
```text
  VITE v8.3.0  ready in 240 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://0.0.0.0:3000/
```

Open your browser and navigate to **`http://localhost:3000`** to start using Steg Studio.

---

### Step 5: Production Build & Preview
To create an optimized production build:

```bash
npm run build
```

This compiles TypeScript, bundles assets, and outputs static production files to the `dist/` directory.

To test the production build locally before deployment:
```bash
npm run preview
```

---

### Step 6: Code Quality & Type Checking
To validate TypeScript types and catch any syntax or interface issues:

```bash
npm run lint
```

---

## 📂 Project Directory Structure

```text
├── index.html                   # HTML entry point (title, metadata, fonts)
├── metadata.json                # Application metadata & capabilities
├── package.json                 # Scripts and dependency specifications
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite configuration (plugins, aliases, server port)
├── public/                      # Static assets and icons
└── src/
    ├── App.tsx                  # Root application component & routing layout
    ├── main.tsx                 # React application mounting entry point
    ├── index.css                # Global Tailwind CSS imports & custom styles
    ├── types.ts                 # Shared TypeScript interfaces & types
    ├── components/
    │   ├── Header.tsx           # Top navigation bar, media selector, tab switches
    │   ├── SidebarDrawer.tsx    # 3-bars slide-out drawer for media carrier selection
    │   ├── Encoder.tsx          # Image steganography encoder & password encryptor
    │   ├── Decoder.tsx          # Image steganography extractor & decryptor
    │   ├── ImageComparator.tsx  # Split-view visual comparison slider (Before vs After)
    │   ├── AudioStudio.tsx      # Audio PCM steganography studio & tone generator
    │   ├── VideoStudio.tsx      # Video container steganography & canvas recorder
    │   ├── DocumentStudio.tsx   # Zero-width Unicode & binary PDF steganography
    │   ├── SteganalysisHub.tsx  # Multi-media digital forensics & entropy scanner
    │   ├── SecurityGuide.tsx    # Operational security & cryptographic documentation
    │   └── Feedback.tsx         # User feedback & issue reporting module
    └── utils/
        ├── crypto.ts            # AES-256-GCM & PBKDF2 Web Crypto implementation
        ├── steganography.ts     # LSB pixel bit manipulation & image buffers
        ├── audioSteganography.ts# Audio PCM sample manipulation & tone synthesizer
        ├── videoSteganography.ts# Video container stream & payload injection
        ├── documentSteganography.ts # Zero-width Unicode encoder/decoder
        ├── steganalysis.ts      # Chi-square, Shannon entropy, and bit-plane analysis
        └── presets.ts           # Curated test images & carrier presets
```

---

## 🔒 Security Best Practices & Threat Model

1. **Lossless Storage Required for LSB Media:**
   - LSB image and audio steganography depends on exact bit values. Never upload stego images or audio to platforms that re-encode or compress files (e.g., social media messengers, Twitter/X, WhatsApp compression). Always share them as **uncompressed files or documents**.
2. **Document Steganography Resilience:**
   - Invisible zero-width text survives copy-pasting into most messaging apps, text editors, and email clients that preserve Unicode formatting.
3. **Plausible Deniability in Practice:**
   - Steg Studio generates random salts and IVs for every encryption operation. An attacker cannot use precomputed rainbow tables or deduce plaintext lengths from ciphertext alone.
4. **Clean Carrier Media:**
   - Always choose carrier files with sufficient organic texture (photographs, ambient audio) rather than flat solid color backgrounds to minimize statistical anomaly detection.

---

## 📄 License
This project is open-source and available under the **MIT License**.
