/* ==========================================================================
   StudioPost — Presets, Default Assets & Templates
   All vector graphics are self-contained SVG Data URIs (zero external asset risk)
   ========================================================================== */

export const GRADIENT_PRESETS = [
  {
    id: 'bottom-fade',
    name: 'Bottom Shadow',
    description: 'Smooth fade to dark for ultimate text readability',
    type: 'linear',
    angle: 180,
    opacity: 0.85,
    blendMode: 'normal',
    stops: [
      { color: '#000000', alpha: 0, position: 0.2 },
      { color: '#000000', alpha: 0.9, position: 1.0 }
    ],
    preview: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 100%)'
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    description: 'Warm aesthetic dusk gradient',
    type: 'linear',
    angle: 135,
    opacity: 0.7,
    blendMode: 'soft-light',
    stops: [
      { color: '#f43f5e', alpha: 0.8, position: 0 },
      { color: '#8b5cf6', alpha: 0.7, position: 0.5 },
      { color: '#0f172a', alpha: 0.9, position: 1.0 }
    ],
    preview: 'linear-gradient(135deg, #f43f5e 0%, #8b5cf6 50%, #0f172a 100%)'
  },
  {
    id: 'cyber-neon',
    name: 'Cyber Neon',
    description: 'Electric cyan and violet vibes',
    type: 'linear',
    angle: 45,
    opacity: 0.65,
    blendMode: 'overlay',
    stops: [
      { color: '#06b6d4', alpha: 0.8, position: 0 },
      { color: '#6366f1', alpha: 0.7, position: 0.6 },
      { color: '#030712', alpha: 0.95, position: 1.0 }
    ],
    preview: 'linear-gradient(45deg, #06b6d4 0%, #6366f1 60%, #030712 100%)'
  },
  {
    id: 'emerald-luxury',
    name: 'Emerald Luxury',
    description: 'Deep jewel forest tones',
    type: 'linear',
    angle: 160,
    opacity: 0.75,
    blendMode: 'multiply',
    stops: [
      { color: '#064e3b', alpha: 0.4, position: 0 },
      { color: '#022c22', alpha: 0.9, position: 1.0 }
    ],
    preview: 'linear-gradient(160deg, #064e3b 0%, #022c22 100%)'
  },
  {
    id: 'warm-noir',
    name: 'Warm Noir',
    description: 'Moody sepia & coffee contrast',
    type: 'linear',
    angle: 180,
    opacity: 0.8,
    blendMode: 'soft-light',
    stops: [
      { color: '#78350f', alpha: 0.5, position: 0 },
      { color: '#1c1917', alpha: 0.95, position: 1.0 }
    ],
    preview: 'linear-gradient(180deg, #78350f 0%, #1c1917 100%)'
  },
  {
    id: 'vignette',
    name: 'Vignette',
    description: 'Radial focus vignette darkening the corners',
    type: 'radial',
    angle: 0,
    opacity: 0.85,
    blendMode: 'multiply',
    stops: [
      { color: '#000000', alpha: 0, position: 0.4 },
      { color: '#000000', alpha: 0.95, position: 1.0 }
    ],
    preview: 'radial-gradient(circle, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 100%)'
  }
];

// High-fidelity self-contained SVG Backgrounds
export const SAMPLE_BACKGROUNDS = {
  'gradient-dark': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><defs><radialGradient id="r1" cx="20%" cy="20%" r="70%"><stop offset="0%" stop-color="%236366f1" stop-opacity="0.8"/><stop offset="100%" stop-color="%230f172a" stop-opacity="0"/></radialGradient><radialGradient id="r2" cx="80%" cy="80%" r="65%"><stop offset="0%" stop-color="%23ec4899" stop-opacity="0.7"/><stop offset="100%" stop-color="%23030712" stop-opacity="0"/></radialGradient><radialGradient id="r3" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%2314b8a6" stop-opacity="0.3"/><stop offset="100%" stop-color="%23000" stop-opacity="0"/></radialGradient></defs><rect width="1080" height="1080" fill="%23090a10"/><rect width="1080" height="1080" fill="url(%23r1)"/><rect width="1080" height="1080" fill="url(%23r2)"/><rect width="1080" height="1080" fill="url(%23r3)"/><circle cx="850" cy="200" r="300" fill="%233b82f6" opacity="0.25" filter="blur(60px)"/><circle cx="200" cy="850" r="350" fill="%23a855f7" opacity="0.25" filter="blur(80px)"/></svg>`,
  
  'minimal-warm': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><defs><linearGradient id="warmg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23382218"/><stop offset="50%" stop-color="%231a100b"/><stop offset="100%" stop-color="%230d0704"/></linearGradient><radialGradient id="sun" cx="80%" cy="20%" r="60%"><stop offset="0%" stop-color="%23f59e0b" stop-opacity="0.5"/><stop offset="100%" stop-color="%23382218" stop-opacity="0"/></radialGradient></defs><rect width="1080" height="1080" fill="url(%23warmg)"/><rect width="1080" height="1080" fill="url(%23sun)"/><circle cx="900" cy="150" r="180" fill="%23f97316" opacity="0.2"/></svg>`,
  
  'cyber-night': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><defs><linearGradient id="gcyber" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23050814"/><stop offset="50%" stop-color="%230a1128"/><stop offset="100%" stop-color="%2302040a"/></linearGradient><radialGradient id="glown" cx="40%" cy="70%" r="50%"><stop offset="0%" stop-color="%2306b6d4" stop-opacity="0.35"/><stop offset="100%" stop-color="%230a1128" stop-opacity="0"/></radialGradient></defs><rect width="1080" height="1080" fill="url(%23gcyber)"/><rect width="1080" height="1080" fill="url(%23glown)"/><line x1="0" y1="540" x2="1080" y2="540" stroke="%2338bdf8" stroke-opacity="0.08" stroke-width="2"/><line x1="540" y1="0" x2="540" y2="1080" stroke="%2338bdf8" stroke-opacity="0.08" stroke-width="2"/></svg>`,
  
  'editorial': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><rect width="1080" height="1080" fill="%23121316"/><circle cx="540" cy="540" r="420" fill="none" stroke="%23ffffff" stroke-opacity="0.06" stroke-width="1.5"/><circle cx="540" cy="540" r="300" fill="none" stroke="%23ffffff" stroke-opacity="0.04" stroke-width="1"/><rect x="80" y="80" width="920" height="920" fill="none" stroke="%23ffffff" stroke-opacity="0.08" stroke-width="1.5"/></svg>`
};

// High-fidelity self-contained SVG Sample Brand Logos
export const SAMPLE_LOGOS = {
  'modern': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100"><rect x="15" y="15" width="70" height="70" rx="18" fill="%23ffffff" fill-opacity="0.1" stroke="%23ffffff" stroke-width="3"/><path d="M35 65 L50 35 L65 65" stroke="%23ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/><line x1="40" y1="56" x2="60" y2="56" stroke="%23ffffff" stroke-width="5" stroke-linecap="round"/></svg>`,

  'spark': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100"><path d="M50 10 C50 32 68 50 90 50 C68 50 50 68 50 90 C50 68 32 50 10 50 C32 50 50 32 50 10 Z" fill="%23ffffff"/><circle cx="50" cy="50" r="8" fill="%236366f1"/></svg>`,

  'badge': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="%236366f1" stroke="%23ffffff" stroke-width="3"/><text x="50" y="58" font-family="sans-serif" font-weight="900" font-size="28" fill="%23ffffff" text-anchor="middle">ST</text></svg>`
};

// Curated Starter Post Templates
export const STARTER_TEMPLATES = [
  {
    id: 'editorial-statement',
    name: 'Fraunces Editorial',
    category: 'Thought Leadership',
    aspectRatio: '1:1',
    bg: 'gradient-dark',
    gradientPreset: 'bottom-fade',
    gradientOpacity: 0.85,
    logo: 'modern',
    logoPos: { x: Math.round(1080 * 0.05) + 42, y: Math.round(1080 * 0.05) + 42, size: 85 },
    textLayers: [
      {
        text: 'True design is making the complex feel quiet, intentional & timeless.',
        fontSize: 58,
        fontWeight: 700,
        fontOpsz: 72,
        soft: 0,
        lineHeight: 1.18,
        align: 'left',
        color: '#ffffff',
        italic: false,
        hasShadow: true,
        isBadge: false,
        x: 90,
        y: 520
      },
      {
        text: 'VOLUME 04 — SEPTEMBER 2026',
        fontSize: 18,
        fontWeight: 400,
        fontOpsz: 18,
        lineHeight: 1.2,
        align: 'left',
        color: '#a5b4fc',
        italic: false,
        hasShadow: false,
        isBadge: true,
        x: 90,
        y: 440
      }
    ]
  },
  {
    id: 'golden-quote',
    name: 'Mindful Moment',
    category: 'Quote & Inspiration',
    aspectRatio: '1:1',
    bg: 'minimal-warm',
    gradientPreset: 'warm-noir',
    gradientOpacity: 0.7,
    logo: 'spark',
    logoPos: { x: 540, y: 160, size: 90 }, // Centered
    textLayers: [
      {
        text: '“Simplicity is the keynote of all true elegance.”',
        fontSize: 64,
        fontWeight: 600,
        fontOpsz: 96,
        lineHeight: 1.2,
        align: 'center',
        color: '#fef3c7',
        italic: true,
        hasShadow: true,
        isBadge: false,
        x: 540,
        y: 520
      },
      {
        text: 'COCO CHANEL',
        fontSize: 16,
        fontWeight: 700,
        fontOpsz: 24,
        lineHeight: 1.3,
        align: 'center',
        color: '#fbbf24',
        italic: false,
        hasShadow: false,
        isBadge: false,
        x: 540,
        y: 840
      }
    ]
  },
  {
    id: 'cyber-drop',
    name: 'Product Drop',
    category: 'Announcement',
    aspectRatio: '1:1',
    bg: 'cyber-night',
    gradientPreset: 'cyber-neon',
    gradientOpacity: 0.6,
    logo: 'badge',
    logoPos: { x: 990, y: 90, size: 90 },
    textLayers: [
      {
        text: 'Introducing Studio v2.0',
        fontSize: 68,
        fontWeight: 900,
        fontOpsz: 144,
        lineHeight: 1.1,
        align: 'left',
        color: '#ffffff',
        italic: false,
        hasShadow: true,
        isBadge: false,
        x: 80,
        y: 600
      },
      {
        text: 'Built for modern creative workflows.',
        fontSize: 26,
        fontWeight: 400,
        fontOpsz: 32,
        lineHeight: 1.3,
        align: 'left',
        color: '#93c5fd',
        italic: false,
        hasShadow: false,
        isBadge: false,
        x: 80,
        y: 820
      }
    ]
  },
  {
    id: 'editorial-frame',
    name: 'Minimal Classic',
    category: 'Fashion & Art',
    aspectRatio: '4:5',
    bg: 'editorial',
    gradientPreset: 'vignette',
    gradientOpacity: 0.75,
    logo: 'modern',
    logoPos: { x: 540, y: 180, size: 80 },
    textLayers: [
      {
        text: 'The Art of Fraunces Typography',
        fontSize: 54,
        fontWeight: 600,
        fontOpsz: 80,
        lineHeight: 1.25,
        align: 'center',
        color: '#ffffff',
        italic: true,
        hasShadow: false,
        isBadge: false,
        x: 540,
        y: 600
      },
      {
        text: 'CURATED DESIGN COLLECTION',
        fontSize: 14,
        fontWeight: 700,
        fontOpsz: 16,
        lineHeight: 1.4,
        align: 'center',
        color: '#e2e8f0',
        italic: false,
        hasShadow: false,
        isBadge: true,
        x: 540,
        y: 800
      }
    ]
  }
];
