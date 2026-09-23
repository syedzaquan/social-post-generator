/* ==========================================================================
   StudioPost — Canvas Engine & High-DPI Renderer
   Renders layers, handles Fraunces variable fonts (SOFT, opsz, wght), and exports crisp PNGs.
   ========================================================================== */

export const ASPECT_RATIOS = {
  '1:1': { width: 1080, height: 1080, label: '1:1 Post' },
  '9:16': { width: 1080, height: 1920, label: '9:16 Story' },
  '4:5': { width: 1080, height: 1350, label: '4:5 Portrait' },
  '3:4': { width: 1080, height: 1440, label: '3:4 Portrait' },
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
    this.exportFontData = new Map();
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
      if (!src.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
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

  // Ensure Google Font / Local Fraunces is ready before painting
  async ensureFontsLoaded(textLayers) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('Font load check failed:', e);
    }
  }

  async getExportFontData(style) {
    const filename = style === 'italic' ? 'assets/Fraunces-Italic.ttf' : 'assets/Fraunces-Roman.ttf';
    if (!this.exportFontData.has(filename)) {
      this.exportFontData.set(filename, fetch(filename)
        .then(response => response.ok ? response.arrayBuffer() : Promise.reject(new Error('Font unavailable')))
        .then(buffer => {
          const bytes = new Uint8Array(buffer);
          let binary = '';
          const chunkSize = 0x8000;
          for (let index = 0; index < bytes.length; index += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
          }
          return btoa(binary);
        })
        .catch(error => {
          console.warn('Could not embed export font:', error);
          return '';
        }));
    }
    return this.exportFontData.get(filename);
  }

  escapeSvg(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[character]));
  }

  async drawExportText(ctx, layer, bounds) {
    const style = layer.italic ? 'italic' : 'normal';
    const fontData = await this.getExportFontData(style);
    const weight = layer.fontWeight ?? 350;
    const fontSize = layer.fontSize || 72;
    const soft = layer.soft ?? 100;
    const opsz = layer.fontOpsz ?? Math.max(9, Math.min(144, fontSize));
    const letterSpacing = layer.letterSpacing !== undefined ? layer.letterSpacing : -1;
    const anchor = (layer.align || 'center') === 'left' ? 'start' : (layer.align || 'center') === 'right' ? 'end' : 'middle';
    const fontFace = fontData
      ? `@font-face{font-family:ExportFraunces;src:url(data:font/ttf;base64,${fontData}) format('truetype');font-style:${style};font-weight:100 900;}`
      : '';
    const shadow = layer.hasShadow ? '<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.85"/></filter>' : '';

    const tspans = bounds.lines.map((line, index) => {
      const lineY = bounds.firstBaseline + (index * bounds.lineHeight);
      return `<tspan x="${layer.x}" y="${lineY}">${this.escapeSvg(line)}</tspan>`;
    }).join('');

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${this.logicalWidth}" height="${this.logicalHeight}" viewBox="0 0 ${this.logicalWidth} ${this.logicalHeight}"><style>${fontFace}</style><defs>${shadow}</defs><text x="${layer.x}" text-anchor="${anchor}" font-family="${fontData ? 'ExportFraunces' : 'Fraunces'}, serif" font-size="${fontSize}px" font-style="${style}" font-weight="${weight}" letter-spacing="${letterSpacing}px" fill="${this.escapeSvg(layer.color || '#ffffff')}" style="font-variation-settings:'SOFT' ${soft}, 'opsz' ${opsz}, 'wght' ${weight}, 'WONK' 0"${layer.hasShadow ? ' filter="url(#shadow)"' : ''}>${tspans}</text></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
      const image = await this.loadImage(url);
      if (image) ctx.drawImage(image, 0, 0, this.logicalWidth, this.logicalHeight);
    } finally {
      this.imageCache.delete(url);
      URL.revokeObjectURL(url);
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
    const weight = layer.fontWeight ?? 350;
    const fontSize = layer.fontSize || 72;
    const soft = layer.soft ?? 100;
    const opsz = layer.fontOpsz ?? Math.max(9, Math.min(144, fontSize));
    const letterSpacing = layer.letterSpacing !== undefined ? layer.letterSpacing : -1;

    ctx.font = `${style} ${weight} ${fontSize}px 'Fraunces', serif`;
    if ('fontVariationSettings' in ctx) {
      ctx.fontVariationSettings = `'SOFT' ${soft}, 'opsz' ${opsz}, 'wght' ${weight}, 'WONK' 0`;
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
    const align = layer.align || 'center';
    if (align === 'center') {
      left = x - maxLineWidth / 2;
    } else if (align === 'right') {
      left = x - maxLineWidth;
    }

    const padX = layer.isBadge ? 14 : 0;
    const padY = layer.isBadge ? 6 : 0;

    // Font metrics for baseline calculation
    const metrics = ctx.measureText('Mg');
    const ascent = metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent || (fontSize * 0.88);
    const halfLeading = (lineHeight - fontSize) / 2;
    const firstBaseline = y + halfLeading + ascent;

    return {
      left: left - padX,
      top: y - padY,
      width: maxLineWidth + padX * 2,
      height: totalHeight + padY * 2,
      contentLeft: left,
      contentTop: y,
      contentWidth: maxLineWidth,
      contentHeight: totalHeight,
      padX,
      padY,
      lines,
      lineHeight,
      maxLineWidth,
      firstBaseline,
      ascent,
      halfLeading
    };
  }

  // Calculate image layer bounds in logical canvas coordinates (preserving natural aspect ratio)
  getImageBounds(layer, img = null) {
    let aspect = layer.aspectRatio;
    if (!aspect && img && img.naturalWidth && img.naturalHeight) {
      aspect = img.naturalWidth / img.naturalHeight;
      layer.aspectRatio = aspect;
    }
    aspect = aspect || 1;
    const size = layer.size || 300;
    let width, height;
    if (aspect >= 1) {
      width = size;
      height = size / aspect;
    } else {
      height = size;
      width = size * aspect;
    }
    return {
      left: layer.x - width / 2,
      top: layer.y - height / 2,
      width,
      height
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
    if (state.bgColor && state.bgColor !== 'transparent') {
      ctx.fillStyle = state.bgColor;
      ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
    }

    if (state.bgImage) {
      const bgImg = await this.loadImage(state.bgImage);
      if (bgImg) {
        const brightness = state.bgBrightness ?? 100;
        const contrast = state.bgContrast ?? 100;
        const blur = state.bgBlur ?? 0;
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) blur(${blur}px)`;

        const scale = Math.max(0.1, Math.min(6.0, (state.bgScale ?? 100) / 100));
        const imgRatio = bgImg.width / bgImg.height;
        const canvasRatio = this.logicalWidth / this.logicalHeight;
        let baseWidth, baseHeight;

        if (imgRatio > canvasRatio) {
          baseHeight = this.logicalHeight;
          baseWidth = this.logicalHeight * imgRatio;
        } else {
          baseWidth = this.logicalWidth;
          baseHeight = this.logicalWidth / imgRatio;
        }

        const drawWidth = baseWidth * scale;
        const drawHeight = baseHeight * scale;

        // Position offsets: state.bgPosX (-100% to +100%) and state.bgPosY (-100% to +100%)
        const panX = ((state.bgPosX ?? 0) / 100) * this.logicalWidth;
        const panY = ((state.bgPosY ?? 0) / 100) * this.logicalHeight;

        const offsetX = (this.logicalWidth - drawWidth) / 2 + panX;
        const offsetY = (this.logicalHeight - drawHeight) / 2 + panY;

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

      const coverage = Math.max(0.15, Math.min(1.0, (grad.height ?? 100) / 100));

      let canvasGradient;
      if (grad.type === 'radial') {
        const cx = this.logicalWidth / 2;
        const cy = this.logicalHeight / 2;
        const radius = Math.max(this.logicalWidth, this.logicalHeight) * 0.7 * coverage;
        canvasGradient = ctx.createRadialGradient(cx, cy, radius * 0.1, cx, cy, radius);
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
        const startOffset = 1.0 - coverage;
        if (startOffset > 0) {
          const firstColor = grad.stops[0]?.color || '#000000';
          canvasGradient.addColorStop(0, this.hexToRgba(firstColor, 0));
          canvasGradient.addColorStop(startOffset, this.hexToRgba(firstColor, 0));
        }

        grad.stops.forEach((stop) => {
          const pos = startOffset + stop.position * coverage;
          const clampedPos = Math.max(0, Math.min(1, pos));
          const rgba = this.hexToRgba(stop.color, stop.alpha ?? 1);
          canvasGradient.addColorStop(clampedPos, rgba);
        });
      } else {
        const startOffset = 1.0 - coverage;
        if (startOffset > 0) {
          canvasGradient.addColorStop(0, 'rgba(0,0,0,0)');
          canvasGradient.addColorStop(startOffset, 'rgba(0,0,0,0)');
        }
        canvasGradient.addColorStop(startOffset, 'rgba(0,0,0,0)');
        canvasGradient.addColorStop(1, 'rgba(0,0,0,0.85)');
      }

      ctx.fillStyle = canvasGradient;
      ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);
      ctx.restore();
    }

    // 3. Render Image Layers
    if (state.imageLayers && state.imageLayers.length > 0) {
      for (const layer of state.imageLayers) {
        if (!layer.image || layer.visible === false) continue;
        ctx.save();
        const img = await this.loadImage(layer.image);
        if (img) {
          const bounds = this.getImageBounds(layer, img);
          const opacity = Math.max(0, Math.min(1, (layer.opacity ?? 100) / 100));
          ctx.globalAlpha = opacity;

          const radius = Math.min((layer.radius ?? 0), Math.min(bounds.width, bounds.height) / 2);

          ctx.translate(layer.x, layer.y);
          if (layer.rotation) {
            ctx.rotate((layer.rotation * Math.PI) / 180);
          }

          const halfW = bounds.width / 2;
          const halfH = bounds.height / 2;
          if (radius > 0) {
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(-halfW, -halfH, bounds.width, bounds.height, radius);
            } else {
              ctx.rect(-halfW, -halfH, bounds.width, bounds.height);
            }
            ctx.clip();
          }

          ctx.drawImage(img, -halfW, -halfH, bounds.width, bounds.height);
        }
        ctx.restore();
      }
    }

    // 4. Render Default Brand Logo (assets/logo.png at top-left 4% safe area with 200px width and subtle dropshadow)
    const defaultLogoImg = await this.loadImage('assets/logo.png');
    if (defaultLogoImg) {
      ctx.save();
      const logoW = 200;
      const logoH = logoW * (defaultLogoImg.naturalHeight || defaultLogoImg.height) / (defaultLogoImg.naturalWidth || defaultLogoImg.width);
      const marginX = this.logicalWidth * 0.04;
      const marginY = this.logicalHeight * 0.04;
      ctx.globalAlpha = 1;

      // High-contrast, wider dropshadow for legibility on any background.
      ctx.shadowColor = 'rgba(0, 0, 0, 1)';
      ctx.shadowBlur = 84;
      ctx.shadowOffsetX = -5;
      ctx.shadowOffsetY = 0;

      ctx.drawImage(defaultLogoImg, marginX, marginY, logoW, logoH);
      ctx.restore();
    }

    // 4. Render Text Layers (Only onto export canvas, or as fallback)
    // On preview canvas, live DOM overlay provides real-time variable font rendering!
    if (isExport && state.textLayers && state.textLayers.length > 0) {
      await this.ensureFontsLoaded(state.textLayers);

      for (const layer of state.textLayers) {
        if (!layer.text || layer.visible === false) continue;
        const bounds = this.getTextBounds(ctx, layer);

        // Canvas text does not consistently honor Fraunces's SOFT axis. SVG does,
        // so export text is rendered from the same variable-font settings as preview.
        ctx.save();
        if (layer.rotation) {
          const centerX = bounds.left + bounds.width / 2;
          const centerY = bounds.top + bounds.height / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate((layer.rotation * Math.PI) / 180);
          ctx.translate(-centerX, -centerY);
        }
        const fontSize = layer.fontSize || 72;


        // Badge pill
        if (layer.isBadge) {
          ctx.save();
          ctx.fillStyle = 'rgba(229, 9, 20, 0.28)';
          ctx.strokeStyle = 'rgba(248, 113, 113, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(bounds.left, bounds.top, bounds.width, bounds.height, 8);
          } else {
            ctx.rect(bounds.left, bounds.top, bounds.width, bounds.height);
          }
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        await this.drawExportText(ctx, layer, bounds);
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

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${filenamePrefix}-${this.aspectRatio.replace(':', 'x')}-${timestamp}.png`;

    return new Promise((resolve, reject) => {
      try {
        if (this.exportCanvas.toBlob) {
          this.exportCanvas.toBlob((blob) => {
            if (!blob) {
              resolve(false);
              return;
            }
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = filename;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            resolve(true);
          }, 'image/png', 1.0);
        } else {
          const dataUrl = this.exportCanvas.toDataURL('image/png', 1.0);
          const link = document.createElement('a');
          link.download = filename;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          resolve(true);
        }
      } catch (err) {
        console.error('Export canvas error:', err);
        reject(err);
      }
    });
  }
}
