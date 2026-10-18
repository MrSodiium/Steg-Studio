import React, { useState, useEffect, useRef } from 'react';
import { Eye, Layers, Sparkles, SlidersHorizontal, Activity } from 'lucide-react';
import { generateDifferenceHeatmap } from '../utils/steganography';

interface ImageComparatorProps {
  originalUrl: string;
  stegoUrl: string;
  psnr: number;
  mse: number;
  width: number;
  height: number;
}

export const ImageComparator: React.FC<ImageComparatorProps> = ({
  originalUrl,
  stegoUrl,
  psnr,
  mse,
  width,
  height,
}) => {
  const [viewMode, setViewMode] = useState<'stego' | 'split' | 'heatmap'>('stego');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [loadingHeatmap, setLoadingHeatmap] = useState<boolean>(false);
  const [amplification, setAmplification] = useState<number>(80);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<boolean>(false);

  // Generate heatmap when requested
  useEffect(() => {
    if (viewMode === 'heatmap' && (!heatmapUrl || amplification)) {
      setLoadingHeatmap(true);
      generateDifferenceHeatmap(originalUrl, stegoUrl, amplification)
        .then((url) => {
          setHeatmapUrl(url);
          setLoadingHeatmap(false);
        })
        .catch(() => {
          setLoadingHeatmap(false);
        });
    }
  }, [viewMode, originalUrl, stegoUrl, amplification]);

  // Handle slider dragging
  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const offsetX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
    setSliderPosition(percentage);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Top Controls */}
      <div className="px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">View Mode:</span>
          <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
            <button
              id="view-stego-btn"
              type="button"
              onClick={() => setViewMode('stego')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'stego'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Stego Image
            </button>
            <button
              id="view-split-btn"
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'split'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Split Comparison
            </button>
            <button
              id="view-heatmap-btn"
              type="button"
              onClick={() => setViewMode('heatmap')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'heatmap'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Difference Heatmap
            </button>
          </div>
        </div>

        {/* Quality Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PSNR: <strong>{psnr >= 99 ? '> 90 dB' : `${psnr} dB`}</strong></span>
            <span className="text-emerald-500/70">(Imperceptible)</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/50 border border-slate-700/50 text-slate-300 text-xs font-mono">
            <span>MSE: {mse}</span>
          </div>
        </div>
      </div>

      {/* Main Image Stage */}
      <div className="p-4 sm:p-6 bg-slate-950/90 flex flex-col items-center justify-center min-h-[360px]">
        {viewMode === 'stego' && (
          <div className="relative group max-w-full rounded-xl overflow-hidden shadow-2xl border border-slate-800">
            <img
              src={stegoUrl}
              alt="Steganography encoded"
              className="max-h-[460px] object-contain w-auto mx-auto select-none"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-slate-950/80 backdrop-blur border border-slate-800 text-[11px] text-emerald-400 font-mono">
              Stego Image ({width} × {height} px)
            </div>
          </div>
        )}

        {viewMode === 'split' && (
          <div className="w-full flex flex-col items-center">
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onMouseMove={handleMouseMove}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              onTouchMove={handleMouseMove}
              className="relative max-h-[460px] overflow-hidden select-none cursor-ew-resize rounded-xl border border-slate-800 shadow-2xl inline-block max-w-full"
            >
              {/* Underneath: Original Image */}
              <img
                src={originalUrl}
                alt="Original"
                className="max-h-[460px] object-contain w-auto block select-none pointer-events-none"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur border border-slate-800 text-[10px] text-slate-300 uppercase tracking-wider font-semibold z-10">
                Original
              </div>

              {/* On Top: Stego Image clipped to sliderPosition */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
              >
                <img
                  src={stegoUrl}
                  alt="Steganography"
                  className="max-h-[460px] object-contain w-auto block select-none pointer-events-none"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-emerald-950/80 backdrop-blur border border-emerald-800/80 text-[10px] text-emerald-300 uppercase tracking-wider font-semibold">
                  Stego Image
                </div>
              </div>

              {/* Drag divider line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 shadow-lg pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center shadow-lg text-slate-950">
                  <SlidersHorizontal className="w-3.5 h-3.5 rotate-90" />
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400 flex items-center gap-1.5">
              <span>Drag the slider horizontally to compare original and stego pixels. Notice: they are visually identical!</span>
            </p>
          </div>
        )}

        {viewMode === 'heatmap' && (
          <div className="w-full flex flex-col items-center">
            {loadingHeatmap ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <Activity className="w-8 h-8 animate-spin text-emerald-400 mb-2" />
                <span className="text-xs">Computing amplified pixel differences...</span>
              </div>
            ) : heatmapUrl ? (
              <div className="relative max-w-full rounded-xl overflow-hidden shadow-2xl border border-slate-800">
                <img
                  src={heatmapUrl}
                  alt="Pixel Difference Heatmap"
                  className="max-h-[440px] object-contain w-auto mx-auto select-none"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-slate-950/90 backdrop-blur border border-slate-800 text-[11px] text-cyan-300 font-mono">
                  Heatmap Amplification: {amplification}×
                </div>
              </div>
            ) : null}

            {/* Amplification control */}
            <div className="mt-4 flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400">Visual Amplification:</span>
              <input
                id="heatmap-amp-slider"
                type="range"
                min="20"
                max="150"
                step="10"
                value={amplification}
                onChange={(e) => setAmplification(Number(e.target.value))}
                className="w-32 accent-emerald-500"
              />
              <span className="font-mono text-emerald-400">{amplification}×</span>
              <span className="text-slate-500 text-[11px]">(Highlights the tiny ±1 LSB bit changes)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
