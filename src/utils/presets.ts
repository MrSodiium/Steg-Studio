/**
 * High-resolution demo presets generated programmatically on canvas.
 * Allows instant testing of encoding and decoding without requiring local file uploads.
 */

import { SamplePreset } from '../types';

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'cosmic-nebula',
    name: 'Cosmic Nebula',
    category: 'Abstract',
    description: 'Deep celestial nebula with radiant dust clouds and starfield.',
    draw: (ctx, width, height) => {
      // Cosmic background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0a0a23');
      bgGrad.addColorStop(0.5, '#1e113a');
      bgGrad.addColorStop(1, '#05030f');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Nebula gas glow 1
      const neb1 = ctx.createRadialGradient(width * 0.35, height * 0.45, 20, width * 0.35, height * 0.45, width * 0.45);
      neb1.addColorStop(0, 'rgba(236, 72, 153, 0.45)');
      neb1.addColorStop(0.4, 'rgba(147, 51, 234, 0.25)');
      neb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = neb1;
      ctx.fillRect(0, 0, width, height);

      // Nebula gas glow 2
      const neb2 = ctx.createRadialGradient(width * 0.7, height * 0.6, 30, width * 0.7, height * 0.6, width * 0.5);
      neb2.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
      neb2.addColorStop(0.5, 'rgba(16, 185, 129, 0.2)');
      neb2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = neb2;
      ctx.fillRect(0, 0, width, height);

      // Stars
      const numStars = 250;
      for (let i = 0; i < numStars; i++) {
        const x = (Math.sin(i * 997) * 0.5 + 0.5) * width;
        const y = (Math.cos(i * 353) * 0.5 + 0.5) * height;
        const r = (Math.sin(i * 123) * 0.5 + 0.5) * 1.8 + 0.4;
        const alpha = (Math.cos(i * 881) * 0.5 + 0.5) * 0.7 + 0.3;

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  {
    id: 'emerald-aurora',
    name: 'Emerald Aurora',
    category: 'Nature',
    description: 'Vibrant northern lights reflecting over calm fjord waters.',
    draw: (ctx, width, height) => {
      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, '#041712');
      sky.addColorStop(0.45, '#062922');
      sky.addColorStop(0.7, '#02100d');
      sky.addColorStop(1, '#010605');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      // Aurora waves
      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        ctx.moveTo(0, height * (0.2 + w * 0.08));
        for (let x = 0; x <= width; x += 15) {
          const y = height * (0.2 + w * 0.08) + Math.sin(x * 0.008 + w) * 35 + Math.cos(x * 0.015) * 20;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height * 0.7);
        ctx.lineTo(0, height * 0.7);
        ctx.closePath();

        const auroraGrad = ctx.createLinearGradient(0, height * 0.1, 0, height * 0.7);
        auroraGrad.addColorStop(0, 'rgba(52, 211, 153, 0.4)');
        auroraGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.2)');
        auroraGrad.addColorStop(1, 'rgba(6, 78, 59, 0)');
        ctx.fillStyle = auroraGrad;
        ctx.fill();
      }

      // Mountain silhouettes
      ctx.fillStyle = '#020b08';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.65);
      const peaks = [0.15, 0.3, 0.48, 0.68, 0.85, 1.0];
      peaks.forEach((px, idx) => {
        const peakHeight = idx % 2 === 0 ? 0.48 : 0.54;
        ctx.lineTo(width * px, height * peakHeight);
      });
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Water reflection
      const water = ctx.createLinearGradient(0, height * 0.7, 0, height);
      water.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
      water.addColorStop(1, '#010504');
      ctx.fillStyle = water;
      ctx.fillRect(0, height * 0.7, width, height * 0.3);
    },
  },
  {
    id: 'cyber-sunset',
    name: 'Cyberpunk Horizon',
    category: 'Vaporwave',
    description: 'Retro synthwave sun with isometric geometric grid.',
    draw: (ctx, width, height) => {
      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, height * 0.6);
      sky.addColorStop(0, '#110326');
      sky.addColorStop(0.5, '#3b0764');
      sky.addColorStop(1, '#be185d');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height * 0.6);

      // Glowing Sun
      const sunY = height * 0.48;
      const sunR = width * 0.16;
      const sunGrad = ctx.createLinearGradient(0, sunY - sunR, 0, sunY + sunR);
      sunGrad.addColorStop(0, '#fef08a');
      sunGrad.addColorStop(0.5, '#f43f5e');
      sunGrad.addColorStop(1, '#831843');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(width * 0.5, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();

      // Horizontal sun scanlines
      ctx.fillStyle = '#110326';
      for (let s = 0; s < 6; s++) {
        const lineY = sunY + s * 10;
        const lineH = 2 + s * 0.8;
        ctx.fillRect(width * 0.5 - sunR, lineY, sunR * 2, lineH);
      }

      // Ground plane
      const ground = ctx.createLinearGradient(0, height * 0.6, 0, height);
      ground.addColorStop(0, '#090117');
      ground.addColorStop(1, '#1e053a');
      ctx.fillStyle = ground;
      ctx.fillRect(0, height * 0.6, width, height * 0.4);

      // Grid perspective lines
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.35)';
      ctx.lineWidth = 1.2;
      const horizonY = height * 0.6;
      const vanishingX = width * 0.5;

      for (let x = -width; x <= width * 2; x += 40) {
        ctx.beginPath();
        ctx.moveTo(vanishingX, horizonY);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let y = 1; y <= 10; y++) {
        const lineY = horizonY + Math.pow(y / 10, 2) * (height * 0.4);
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(width, lineY);
        ctx.stroke();
      }
    },
  },
];

/**
 * Renders a preset onto a fresh canvas data URL at custom resolution (default 800x600).
 */
export function renderPresetToDataUrl(
  preset: SamplePreset,
  width: number = 800,
  height: number = 600
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  preset.draw(ctx, width, height);
  return canvas.toDataURL('image/png');
}
