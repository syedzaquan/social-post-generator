/* ==========================================================================
   StudioPost — Canvas Engine & High-DPI Renderer
   Renders layers, handles text wrapping with Fraunces, and exports crisp PNGs.
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

    // Cache loaded images
    this.imageCache = new Map();
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

  // Ensure Google Font Fraunces is loaded before painting
  async ensureFontsLoaded(textLayers) {
    try {
      await document.fonts.ready;
      for (const layer of textLayers) {
        const style = layer.italic ? 'italic' : 'normal';
        const weight = layer.fontWeight || 700;
        const fontStr = `${style} ${weight} 48px 'Fraunces'`;
        await document.fonts.load(fontStr);
      }
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
    const weight = layer.fontWeight || 700;
    const fontSize = layer.fontSize || 54;
    ctx.font = `${style} ${weight} ${fontSize}px 'Fraunces', serif`;

    const maxWidth = this.logicalWidth * 0.84;
    const lines = this.wrapText(ctx, layer.text, maxWidth);
    const lineHeight = fontSize * (layer.lineHeight || 1.2);

    let maxLineWidth = 0;
    for (const line of lines) {
      const w = ctx.measureText(line).width;
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
        // Apply adjustments
        const brightness = state.bgBrightness ?? 100;
        const contrast = state.bgContrast ?? 100;
        const blur = state.bgBlur ?? 0;
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) blur(${blur}px)`;

        // Cover canvas
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

        // Draw slightly oversized if blurred to avoid edge transparency
        if (blur > 0) {
          const expand = blur * 4;
          ctx.drawImage(bgImg, offsetX - expand, offsetY - expand, drawWidth + expand * 2, drawHeight + expand * 2);
        } else {
          ctx.drawImage(bgImg, offsetX, offsetY, drawWidth, drawHeight);
        }
      }
    }
    ctx.restore();

    // 2. Render Gradient Layer (Readability & Styling)
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
        // Linear gradient with angle
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

      // Add color stops
      if (grad.stops && grad.stops.length > 0) {
        grad.stops.forEach((stop) => {
          const rgba = this.hexToRgba(stop.color, stop.alpha ?? 1);
          canvasGradient.addColorStop(stop.position, rgba);
        });
      } else {
        // Fallback default bottom fade
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

        // Rounded corners clip
        if (radius > 0) {
          ctx.beginPath();
          ctx.roundRect(-half, -half, bounds.width, bounds.height, radius);
          ctx.clip();
        }

        ctx.drawImage(logoImg, -half, -half, bounds.width, bounds.height);
      }
      ctx.restore();
    }

    // 4. Render Text Layers (Using Fraunces Google Font)
    if (state.textLayers && state.textLayers.length > 0) {
      await this.ensureFontsLoaded(state.textLayers);

      for (const layer of state.textLayers) {
        if (!layer.text || layer.visible === false) continue;
        ctx.save();

        const style = layer.italic ? 'italic' : 'normal';
        const weight = layer.fontWeight || 700;
        const fontSize = layer.fontSize || 54;
        const color = layer.color || '#ffffff';

        ctx.font = `${style} ${weight} ${fontSize}px 'Fraunces', serif`;
        ctx.textBaseline = 'top';
        ctx.textAlign = layer.align || 'left';

        const bounds = this.getTextBounds(ctx, layer);

        // Highlight Pill Badge background
        if (layer.isBadge) {
          ctx.save();
          ctx.fillStyle = 'rgba(99, 102, 241, 0.28)';
          ctx.strokeStyle = 'rgba(165, 180, 252, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(bounds.left, bounds.top, bounds.width, bounds.height, 8);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        // Text Readability Glow / Shadow
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
    // Render full-resolution to exportCanvas
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
