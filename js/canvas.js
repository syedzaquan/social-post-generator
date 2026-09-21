/* ==========================================================================
   StudioPost — Canvas Engine & High-DPI Renderer
   Renders layers, handles Fraunces variable fonts (SOFT, opsz, wght), and exports crisp PNGs.
   ========================================================================== */

export const ASPECT_RATIOS = {
  '1:1': { width: 1080, height: 1080, label: '1:1 Post' },
  '9:16': { width: 1080, height: 1920, label: '9:16 Story' },
  '4:5': { width: 1080, height: 1350, label: '4:5 Portrait' },
  '16:9': { width: 1920, height: 1080, label: '16:9 Banner' }
};

export class CanvasRenderer {
  constructor(previewCanvas, exportCanvas) {
    this.previewCanvas = previewCanvas;
    this.previewCtx = previewCanvas.getContext('2d');
    this.exportCanvas = exportCanvas;
    this.exportCtx = exportCanvas.getContext('2d');

    this.aspectRatio = '1:1';
    this.logicalWidth = 1080;
    this.logicalHeight = 1080;

    // Cache loaded images & base64 fonts
    this.imageCache = new Map();
    this.fontBase64Cache = {};
  }

  setAspectRatio(ratioKey) {
    if (ASPECT_RATIOS[ratioKey]) {
      this.aspectRatio = ratioKey;
      this.logicalWidth = ASPECT_RATIOS[ratioKey].width;
      this.logicalHeight = ASPECT_RATIOS[ratioKey].height;
    }
  }

  // Preload an image from URL or DataURI
  async loadImage(src) {
    if (!src) return null;
    if (this.imageCache.has(src)) {
      return this.imageCache.get(src);
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = () => {
        console.warn('Failed to load image:', src);
        resolve(null);
      };
      img.src = src;
    });
  }

  // Convert font TTF file to base64 for SVG export
  async getFontBase64(isItalic) {
    const key = isItalic ? 'italic' : 'roman';
    if (this.fontBase64Cache[key]) {
      return this.fontBase64Cache[key];
    }
    try {
      const url = isItalic ? 'assets/Fraunces-Italic.ttf' : 'assets/Fraunces-Roman.ttf';
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      this.fontBase64Cache[key] = btoa(binary);
      return this.fontBase64Cache[key];
    } catch (e) {
      console.warn('Could not load local font file for SVG export:', e);
      return null;
    }
  }

  // Ensure Google Font / Local Fraunces is ready before painting
  async ensureFontsLoaded(textLayers) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('Font load check failed:', e);
    }
  }

  // Measure text and break into wrapped lines based on max width
  wrapText(ctx, text, maxWidth) {
    if (!text) return [];
    const paragraphs = text.split('\n');
    const lines = [];

    for (const paragraph of paragraphs) {
      if (paragraph.trim() === '') {
        lines.push('');
        continue;
      }
      const words = paragraph.split(' ');
      let currentLine = words[0] || '';

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine + ' ' + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      lines.push(currentLine);
    }
    return lines;
  }

  // Calculate text layer bounding box in logical canvas coordinates
  getTextBounds(ctx, layer) {
    const style = layer.italic ? 'italic' : 'normal';
    const weight = layer.fontWeight || 400;
    const fontSize = layer.fontSize || 54;
    const soft = layer.soft ?? 50;
    const opsz = layer.fontOpsz ?? Math.max(9, Math.min(144, fontSize));
    const letterSpacing = layer.letterSpacing || 0;

    ctx.font = `${style} ${weight} ${fontSize}px 'Fraunces', serif`;
    if ('fontVariationSettings' in ctx) {
      ctx.fontVariationSettings = `'SOFT' ${soft}, 'opsz' ${opsz}, 'wght' ${weight}`;
    }
    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = `${letterSpacing}px`;
    }

    const maxWidth = this.logicalWidth * 0.84;
    const lines = this.wrapText(ctx, layer.text, maxWidth);
    const lineHeight = fontSize * (layer.lineHeight || 1.15);

    let maxLineWidth = 0;
    for (const line of lines) {
      let w = ctx.measureText(line).width;
      if (!('letterSpacing' in ctx) && letterSpacing !== 0) {
        w += Math.max(0, line.length - 1) * letterSpacing;
      }
      if (w > maxLineWidth) maxLineWidth = w;
    }

    const totalHeight = Math.max(lines.length * lineHeight, fontSize);
    let x = layer.x;
    let y = layer.y;

    // Adjust x for alignment
    let left = x;
    if (layer.align === 'center') {
      left = x - maxLineWidth / 2;
    } else if (layer.align === 'right') {
      left = x - maxLineWidth;
    }

    const padding = layer.isBadge ? 18 : 6;
    return {
      left: left - padding,
      top: y - padding,
      width: maxLineWidth + padding * 2,
      height: totalHeight + padding * 2,
      lines,
      lineHeight,
      maxLineWidth
    };
  }

  // Calculate logo layer bounds in logical canvas coordinates
  getLogoBounds(layer) {
    const size = layer.size || 120;
    return {
      left: layer.x - size / 2,
      top: layer.y - size / 2,
      width: size,
      height: size
    };
  }

  // Render text layer via SVG with embedded variable font for 100% SOFT & opsz fidelity on export
  async renderTextViaSVG(ctx, layer, bounds) {
    try {
      const isItalic = !!layer.italic;
      const base64Font = await this.getFontBase64(isItalic);
      if (!base64Font) return false;

      const soft = layer.soft ?? 50;
      const opsz = layer.fontOpsz ?? Math.max(9, Math.min(144, layer.fontSize || 54));
      const weight = layer.fontWeight || 400;
      const style = isItalic ? 'italic' : 'normal';
      const fontSize = layer.fontSize || 54;
      const letterSpacing = layer.letterSpacing || 0;
      const lineHeight = layer.lineHeight || 1.15;
      const color = layer.color || '#ffffff';
      const align = layer.align || 'left';

      // Badge pill background
      let badgeStyle = '';
      if (layer.isBadge) {
        badgeStyle = `background: rgba(229, 9, 20, 0.28); border: 1.5px solid rgba(248, 113, 113, 0.5); border-radius: 8px; padding: 4px 14px; display: inline-block;`;
      }

      // Shadow / Glow
      const textShadow = layer.hasShadow ? `0 4px 12px rgba(0,0,0,0.85)` : 'none';

      // HTML escaped text
      const escapedText = layer.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>');

      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${this.logicalWidth}" height="${this.logicalHeight}">
          <defs>
            <style>
              @font-face {
                font-family: 'FrauncesVar';
                src: url(data:font/truetype;charset=utf-8;base64,${base64Font}) format('truetype');
                font-weight: 100 900;
                font-style: ${style};
              }
              .text-box {
                font-family: 'FrauncesVar', serif;
                font-style: ${style};
                font-weight: ${weight};
                font-size: ${fontSize}px;
                font-variation-settings: 'SOFT' ${soft}, 'opsz' ${opsz}, 'wght' ${weight};
                letter-spacing: ${letterSpacing}px;
                line-height: ${lineHeight};
                color: ${color};
                text-align: ${align};
                text-shadow: ${textShadow};
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                width: ${bounds.width}px;
                ${badgeStyle}
              }
            </style>
          </defs>
          <foreignObject x="${bounds.left}" y="${bounds.top}" width="${bounds.width}" height="${bounds.height}">
            <div xmlns="http://www.w3.org/1999/xhtml" class="text-box">
              ${escapedText}
            </div>
          </foreignObject>
        </svg>
      `;

      return new Promise((resolve) => {
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          resolve(true);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve(false);
        };
        img.src = url;
      });
    } catch (e) {
      console.warn('SVG text render failed:', e);
      return false;
    }
  }

  // Main Render Routine
  async render(state, target = 'preview') {
    const isExport = target === 'export';
    const canvas = isExport ? this.exportCanvas : this.previewCanvas;
    const ctx = isExport ? this.exportCtx : this.previewCtx;

    // Set canvas logical dimensions
    canvas.width = this.logicalWidth;
    canvas.height = this.logicalHeight;

    ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

    // 1. Render Background
    ctx.save();
    ctx.fillStyle = state.bgColor || '#090a10';
    ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    if (state.bgImage) {
      const bgImg = await this.loadImage(state.bgImage);
      if (bgImg) {
        const brightness = state.bgBrightness ?? 100;
        const contrast = state.bgContrast ?? 100;
        const blur = state.bgBlur ?? 0;
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) blur(${blur}px)`;

        const imgRatio = bgImg.width / bgImg.height;
        const canvasRatio = this.logicalWidth / this.logicalHeight;
        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgRatio > canvasRatio) {
          drawHeight = this.logicalHeight;
          drawWidth = this.logicalHeight * imgRatio;
          offsetX = (this.logicalWidth - drawWidth) / 2;
          offsetY = 0;
        } else {
          drawWidth = this.logicalWidth;
          drawHeight = this.logicalWidth / imgRatio;
          offsetX = 0;
          offsetY = (this.logicalHeight - drawHeight) / 2;
        }

        if (blur > 0) {
          const expand = blur * 4;
          ctx.drawImage(bgImg, offsetX - expand, offsetY - expand, drawWidth + expand * 2, drawHeight + expand * 2);
        } else {
          ctx.drawImage(bgImg, offsetX, offsetY, drawWidth, drawHeight);
        }
      }
    }
    ctx.restore();

    // 2. Render Gradient Layer
    if (state.gradient && state.gradient.active) {
      ctx.save();
      const grad = state.gradient;
      ctx.globalAlpha = Math.max(0, Math.min(1, (grad.opacity ?? 80) / 100));
      ctx.globalCompositeOperation = grad.blendMode || 'normal';

      let canvasGradient;
      if (grad.type === 'radial') {
        const cx = this.logicalWidth / 2;
        const cy = this.logicalHeight / 2;
        const radius = Math.max(this.logicalWidth, this.logicalHeight) * 0.7;
        canvasGradient = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
      } else {
        const angleRad = ((grad.angle ?? 180) - 90) * (Math.PI / 180);
        const cx = this.logicalWidth / 2;
        const cy = this.logicalHeight / 2;
        const halfDiag = Math.sqrt(this.logicalWidth ** 2 + this.logicalHeight ** 2) / 2;

        const x0 = cx - Math.cos(angleRad) * halfDiag;
        const y0 = cy - Math.sin(angleRad) * halfDiag;
        const x1 = cx + Math.cos(angleRad) * halfDiag;
        const y1 = cy + Math.sin(angleRad) * halfDiag;

        canvasGradient = ctx.createLinearGradient(x0, y0, x1, y1);
      }

      if (grad.stops && grad.stops.length > 0) {
        grad.stops.forEach((stop) => {
          const rgba = this.hexToRgba(stop.color, stop.alpha ?? 1);
          canvasGradient.addColorStop(stop.position, rgba);
        });
      } else {
        canvasGradient.addColorStop(0, 'rgba(0,0,0,0)');
        canvasGradient.addColorStop(1, 'rgba(0,0,0,0.85)');
      }

      ctx.fillStyle = canvasGradient;
      ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
      ctx.restore();
    }

    // 3. Render Brand Logo Layer
    if (state.logo && state.logo.active && state.logo.image) {
      ctx.save();
      const logoImg = await this.loadImage(state.logo.image);
      if (logoImg) {
        const bounds = this.getLogoBounds(state.logo);
        const opacity = Math.max(0, Math.min(1, (state.logo.opacity ?? 100) / 100));
        ctx.globalAlpha = opacity;

        const radius = Math.min((state.logo.radius ?? 0), bounds.width / 2);

        ctx.translate(state.logo.x, state.logo.y);
        if (state.logo.rotation) {
          ctx.rotate((state.logo.rotation * Math.PI) / 180);
        }

        const half = bounds.width / 2;
        if (radius > 0) {
          ctx.beginPath();
          ctx.roundRect(-half, -half, bounds.width, bounds.height, radius);
          ctx.clip();
        }

        ctx.drawImage(logoImg, -half, -half, bounds.width, bounds.height);
      }
      ctx.restore();
    }

    // 4. Render Text Layers (Only onto export canvas, or as fallback)
    // On preview canvas, live DOM overlay provides real-time variable font rendering!
    if (isExport && state.textLayers && state.textLayers.length > 0) {
      await this.ensureFontsLoaded(state.textLayers);

      for (const layer of state.textLayers) {
        if (!layer.text || layer.visible === false) continue;
        const bounds = this.getTextBounds(ctx, layer);

        // Try SVG variable font rendering first for exact SOFT & opsz rendering
        const svgRendered = await this.renderTextViaSVG(ctx, layer, bounds);
        if (svgRendered) continue;

        // Fallback to Canvas 2D text drawing
        ctx.save();
        const style = layer.italic ? 'italic' : 'normal';
        const weight = layer.fontWeight || 400;
        const fontSize = layer.fontSize || 54;
        const color = layer.color || '#ffffff';
        const soft = layer.soft ?? 50;
        const opsz = layer.fontOpsz ?? Math.max(9, Math.min(144, fontSize));
        const letterSpacing = layer.letterSpacing || 0;

        ctx.font = `${style} ${weight} ${fontSize}px 'Fraunces', serif`;
        if ('fontVariationSettings' in ctx) {
          ctx.fontVariationSettings = `'SOFT' ${soft}, 'opsz' ${opsz}, 'wght' ${weight}`;
        }
        if ('letterSpacing' in ctx) {
          ctx.letterSpacing = `${letterSpacing}px`;
        }
        ctx.textBaseline = 'top';
        ctx.textAlign = layer.align || 'left';

        // Badge pill
        if (layer.isBadge) {
          ctx.save();
          ctx.fillStyle = 'rgba(229, 9, 20, 0.28)';
          ctx.strokeStyle = 'rgba(248, 113, 113, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(bounds.left, bounds.top, bounds.width, bounds.height, 8);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        // Glow
        if (layer.hasShadow) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
          ctx.shadowBlur = Math.max(12, fontSize * 0.3);
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 4;
        }

        ctx.fillStyle = color;
        let currentY = layer.y;
        for (const line of bounds.lines) {
          ctx.fillText(line, layer.x, currentY);
          currentY += bounds.lineHeight;
        }
        ctx.restore();
      }
    }
  }

  // Convert Hex to RGBA
  hexToRgba(hex, alpha = 1) {
    let cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Export Canvas to PNG and prompt browser download
  async exportPNG(state, filenamePrefix = 'studiopost') {
    await this.render(state, 'export');

    return new Promise((resolve) => {
      this.exportCanvas.toBlob((blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        link.download = `${filenamePrefix}-${this.aspectRatio.replace(':', 'x')}-${timestamp}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve(true);
      }, 'image/png', 1.0);
    });
  }
}
