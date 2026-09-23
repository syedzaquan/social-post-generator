/* ==========================================================================
   StudioPost — Application Controller
   Full-screen canvas with pinch zoom, pan, floating tools, Fraunces SOFT,
   optical size, letter-spacing, and default 400 italic typography.
   ========================================================================== */

import { CanvasRenderer, ASPECT_RATIOS } from './canvas.js?v=3.0';
import { TouchControls } from './touch-controls.js?v=2.9';
import { 
  GRADIENT_PRESETS, 
  SAMPLE_BACKGROUNDS, 
  STARTER_TEMPLATES 
} from './presets.js?v=2.9';

// Self-contained sample sticker graphics (prevents browser module caching errors)
export const SAMPLE_STICKERS = {
  'star': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="%23fbbf24" stroke="%23d97706" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  'verified': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%230ea5e9"/><path d="m9 12 2 2 4-4" fill="none" stroke="%23ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'sparkle': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="%23c084fc"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>`,
  'tag': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="%23f43f5e"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><circle cx="7" cy="7" r="2" fill="%23ffffff"/></svg>`,
  'heart': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="%23ef4444"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`
};

class App {
  constructor() {
    // Canvas & Viewport Elements
    this.previewCanvas = document.getElementById('previewCanvas');
    this.exportCanvas = document.getElementById('exportCanvas');
    this.viewportArea = document.getElementById('viewportArea');
    this.canvasZoomContainer = document.getElementById('canvasZoomContainer');
    this.canvasStage = document.getElementById('canvasStage');
    this.textOverlayStage = document.getElementById('textOverlayStage');
    this.selectionBox = document.getElementById('selectionBox');
    this.selectionTag = document.getElementById('selectionTag');
    this.toastEl = document.getElementById('toast');

    // Controls Dock & Expand Pill
    this.controlsDock = document.getElementById('controlsDock');
    this.dockHandleBar = document.getElementById('dockHandleBar');
    this.btnToggleDock = document.getElementById('btnToggleDock');
    this.btnExpandDock = document.getElementById('btnExpandDock');
    this.dockToggleIcon = document.getElementById('dockToggleIcon');
    this.dockTabs = document.getElementById('dockTabs');
    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.panels = document.querySelectorAll('.panel');

    // Top Bar Controls: Export, Reset, Ratio & Zoom
    this.btnExport = document.getElementById('btnExport');
    this.btnReset = document.getElementById('btnReset');
    this.ratioChips = document.querySelectorAll('.format-chips-bar .chip');
    this.btnZoomIn = document.getElementById('btnZoomIn');
    this.btnZoomOut = document.getElementById('btnZoomOut');
    this.btnZoomFit = document.getElementById('btnZoomFit');

    // Text & Typography Controls
    this.textInput = document.getElementById('textInput');
    this.btnFmtBold = document.getElementById('btnFmtBold');
    this.btnFmtItalic = document.getElementById('btnFmtItalic');
    this.btnFmtUnderline = document.getElementById('btnFmtUnderline');
    this.btnFmtColor = document.getElementById('btnFmtColor');
    this.fmtColorDot = document.getElementById('fmtColorDot');
    this.fmtColorPopover = document.getElementById('fmtColorPopover');
    this.fmtCustomColorPicker = document.getElementById('fmtCustomColorPicker');
    this.btnFmtClear = document.getElementById('btnFmtClear');
    this.softSlider = document.getElementById('softSlider');
    this.softValue = document.getElementById('softValue');
    this.opszSlider = document.getElementById('opszSlider');
    this.opszValue = document.getElementById('opszValue');
    this.fontWeightSlider = document.getElementById('fontWeightSlider');
    this.fontWeightValue = document.getElementById('fontWeightValue');
    this.fontSizeSlider = document.getElementById('fontSizeSlider');
    this.fontSizeValue = document.getElementById('fontSizeValue');
    this.lineHeightSlider = document.getElementById('lineHeightSlider');
    this.lineHeightValue = document.getElementById('lineHeightValue');
    this.letterSpacingSlider = document.getElementById('letterSpacingSlider');
    this.letterSpacingValue = document.getElementById('letterSpacingValue');
    this.textRotationSlider = document.getElementById('textRotationSlider');
    this.textRotationValue = document.getElementById('textRotationValue');
    this.btnResetTextRotation = document.getElementById('btnResetTextRotation');
    this.textAlignBtns = document.querySelectorAll('#textAlignControl .segment-btn');
    this.btnToggleItalic = document.getElementById('btnToggleItalic');
    this.btnToggleShadow = document.getElementById('btnToggleShadow');
    this.btnToggleBadge = document.getElementById('btnToggleBadge');
    this.textColorPicker = document.getElementById('textColorPicker');
    this.textColorPreview = document.getElementById('textColorPreview');
    this.btnAddTextLayer = document.getElementById('btnAddTextLayer');
    this.weightPresetBtns = document.querySelectorAll('.weight-presets .preset-pill');

    // Gradient Controls
    this.toggleGradientActive = document.getElementById('toggleGradientActive');
    this.gradientPresetsGrid = document.getElementById('gradientPresetsGrid');
    this.gradientOpacitySlider = document.getElementById('gradientOpacitySlider');
    this.gradientOpacityValue = document.getElementById('gradientOpacityValue');
    this.gradientAngleSlider = document.getElementById('gradientAngleSlider');
    this.gradientAngleValue = document.getElementById('gradientAngleValue');
    this.gradientAnglePresetBtns = document.querySelectorAll('#gradientAnglePresets .preset-pill');
    this.gradientBlendMode = document.getElementById('gradientBlendMode');
    this.gradStartColor = document.getElementById('gradStartColor');
    this.gradStartAlpha = document.getElementById('gradStartAlpha');
    this.gradEndColor = document.getElementById('gradEndColor');
    this.gradEndAlpha = document.getElementById('gradEndAlpha');
    this.gradientHeightSlider = document.getElementById('gradientHeightSlider');
    this.gradientHeightValue = document.getElementById('gradientHeightValue');

    // Snap Guides Elements
    this.snapGuideX = document.getElementById('snapGuideX');
    this.snapGuideY = document.getElementById('snapGuideY');
    this.snapBadgeX = document.getElementById('snapBadgeX');
    this.snapBadgeY = document.getElementById('snapBadgeY');

    // Image Layer Controls
    this.btnAddImageLayer = document.getElementById('btnAddImageLayer');
    this.btnAddImageLayerFromLayers = document.getElementById('btnAddImageLayerFromLayers');
    this.btnAddTextLayerFromLayers = document.getElementById('btnAddTextLayerFromLayers');
    this.imageLayerFileInput = document.getElementById('imageLayerFileInput');
    this.activeImgLayerControls = document.getElementById('activeImgLayerControls');
    this.imgLayerSizeSlider = document.getElementById('imgLayerSizeSlider');
    this.imgLayerSizeValue = document.getElementById('imgLayerSizeValue');
    this.imgLayerRadiusSlider = document.getElementById('imgLayerRadiusSlider');
    this.imgLayerRadiusValue = document.getElementById('imgLayerRadiusValue');
    this.imgLayerOpacitySlider = document.getElementById('imgLayerOpacitySlider');
    this.imgLayerOpacityValue = document.getElementById('imgLayerOpacityValue');
    this.imgLayerRotationSlider = document.getElementById('imgLayerRotationSlider');
    this.imgLayerRotationValue = document.getElementById('imgLayerRotationValue');
    this.btnResetImgLayerRotation = document.getElementById('btnResetImgLayerRotation');
    this.btnDuplicateImgLayer = document.getElementById('btnDuplicateImgLayer');
    this.btnDeleteImgLayer = document.getElementById('btnDeleteImgLayer');
    this.imgPosBtns = document.querySelectorAll('[data-imgpos]');
    this.sampleImgChips = document.querySelectorAll('.sample-img-chip');

    // Background Image Controls
    this.bgFileInput = document.getElementById('bgFileInput');
    this.bgScaleSlider = document.getElementById('bgScaleSlider');
    this.bgScaleValue = document.getElementById('bgScaleValue');
    this.btnResetBgScale = document.getElementById('btnResetBgScale');
    this.bgPosXSlider = document.getElementById('bgPosXSlider');
    this.bgPosXValue = document.getElementById('bgPosXValue');
    this.btnResetBgPosX = document.getElementById('btnResetBgPosX');
    this.bgPosYSlider = document.getElementById('bgPosYSlider');
    this.bgPosYValue = document.getElementById('bgPosYValue');
    this.btnResetBgPosY = document.getElementById('btnResetBgPosY');
    this.bgBrightnessSlider = document.getElementById('bgBrightnessSlider');
    this.bgBrightnessValue = document.getElementById('bgBrightnessValue');
    this.bgContrastSlider = document.getElementById('bgContrastSlider');
    this.bgContrastValue = document.getElementById('bgContrastValue');
    this.bgBlurSlider = document.getElementById('bgBlurSlider');
    this.bgBlurValue = document.getElementById('bgBlurValue');

    // Templates & Layers List
    this.templatesGrid = document.getElementById('templatesGrid');
    this.layersList = document.getElementById('layersList');

    // State Initialization
    this.state = this.getDefaultState();
    this.selectedLayer = null;

    // Services
    this.renderer = new CanvasRenderer(this.previewCanvas, this.exportCanvas);
    this.touchControls = new TouchControls(
      this.viewportArea,
      this.canvasStage,
      this.previewCanvas,
      this.selectionBox,
      this.selectionTag,
      {
        snapGuideX: this.snapGuideX,
        snapGuideY: this.snapGuideY,
        snapBadgeX: this.snapBadgeX,
        snapBadgeY: this.snapBadgeY,
        onLayerChange: () => this.onLayerModifiedByGesture(),
        onSelectLayer: (x, y, targetEl) => this.hitTestLayer(x, y, targetEl),
        onCanvasTransform: (zoom, panX, panY, animate) => this.onCanvasTransform(zoom, panX, panY, animate)
      }
    );

    this.init();
  }

  getDefaultState() {
    return {
      aspectRatio: '1:1',
      bgColor: 'transparent',
      bgImage: null,
      bgScale: 100,
      bgPosX: 0,
      bgPosY: 0,
      bgBrightness: 100,
      bgContrast: 100,
      bgBlur: 0,
      gradient: {
        active: true,
        presetId: 'bottom-fade',
        type: 'linear',
        angle: 180,
        opacity: 100,
        height: 50,
        blendMode: 'normal',
        stops: [
          { color: '#000000', alpha: 0, position: 0.2 },
          { color: '#000000', alpha: 0.9, position: 1.0 }
        ]
      },
      imageLayers: [],
      textLayers: [
        {
          id: 'text-1',
          text: 'Design with intention, craft with soul.',
          fontSize: 72,
          fontWeight: 350, // DEFAULT: 350
          fontOpsz: 72,
          soft: 100, // DEFAULT: SOFT 100
          letterSpacing: -1, 
          lineHeight: 1.16,
          align: 'center',
          color: '#ffffff',
          italic: false, // DEFAULT: NON-ITALIC
          hasShadow: false, // DEFAULT: NO GLOW
          isBadge: false,
          x: 540,
          y: 520
        }
      ]
    };
  }

  init() {
    this.populateGradientPresets();
    this.populateTemplates();
    this.bindEvents();
    
    // Select first text layer by default
    if (this.state.textLayers.length > 0) {
      this.selectTextLayer(this.state.textLayers[0]);
    }

    this.updateCanvasDimensions();
    this.render();

    window.addEventListener('resize', () => {
      this.updateCanvasDimensions();
      this.render();
    });
  }

  updateCanvasDimensions() {
    const ratioData = ASPECT_RATIOS[this.state.aspectRatio];
    this.renderer.setAspectRatio(this.state.aspectRatio);

    const winW = window.innerWidth;
    const winH = window.innerHeight;
    // The tools dock overlays the workspace; opening it must never resize the canvas.
    let availableW = winW;
    let availableH = winH;

    if (winW >= 960) {
      const dockWidth = 380;
      availableW = winW - dockWidth - 64; // consistent workspace width
      availableH = winH - 84;
    } else {
      availableW = winW - 24;
      availableH = winH - 330;
    }

    const targetRatio = ratioData.width / ratioData.height;
    let stageWidth, stageHeight;

    if (availableW / availableH > targetRatio) {
      stageHeight = availableH;
      stageWidth = stageHeight * targetRatio;
    } else {
      stageWidth = availableW;
      stageHeight = stageWidth / targetRatio;
    }

    stageWidth = Math.max(180, Math.round(stageWidth));
    stageHeight = Math.max(180, Math.round(stageHeight));

    this.canvasStage.style.width = `${stageWidth}px`;
    this.canvasStage.style.height = `${stageHeight}px`;

    this.touchControls.updateSelectionBounds();
  }

  onCanvasTransform(zoom, panX, panY, animate = false) {
    this.canvasZoomContainer.style.transition = animate ? 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)' : 'none';
    this.canvasZoomContainer.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoom})`;
    this.btnZoomFit.textContent = Math.abs(zoom - 1.0) < 0.01 ? 'Fit' : `${Math.round(zoom * 100)}%`;
  }

  async render() {
    await this.renderer.render(this.state, 'preview');
    this.updateDOMTextOverlay();
    this.updateSelectionBox();
    this.updateLayersPanel();
  }

  // Live DOM Text Overlay — renders true Fraunces variable font with full SOFT, opsz, wght & letter-spacing
  updateDOMTextOverlay() {
    const stageWidth = this.canvasStage.offsetWidth || parseFloat(this.canvasStage.style.width) || this.renderer.logicalWidth;
    const scale = stageWidth / this.renderer.logicalWidth;

    const existingDivs = new Map();
    this.textOverlayStage.querySelectorAll('.dom-text-layer').forEach(el => {
      existingDivs.set(el.dataset.id, el);
    });

    const activeIds = new Set();

    this.state.textLayers.forEach(layer => {
      if (!layer.text || layer.visible === false) return;
      activeIds.add(layer.id);

      const bounds = this.renderer.getTextBounds(this.renderer.previewCtx, layer);
      const screenPos = this.touchControls.canvasToClient(bounds.left, bounds.top, bounds.width, bounds.height);

      let div = existingDivs.get(layer.id);
      if (!div) {
        div = document.createElement('div');
        div.className = 'dom-text-layer';
        div.dataset.id = layer.id;
        this.textOverlayStage.appendChild(div);
      }

      div.style.left = `${screenPos.left}px`;
      div.style.top = `${screenPos.top}px`;
      div.style.width = `${screenPos.width}px`;
      div.style.height = `${screenPos.height}px`;
      div.style.fontFamily = "'Fraunces', serif";
      div.style.fontStyle = layer.italic ? 'italic' : 'normal';
      div.style.fontWeight = layer.fontWeight ?? 350;
      div.style.fontSize = `${(layer.fontSize || 72) * scale}px`;
      div.style.fontVariationSettings = `'SOFT' ${layer.soft ?? 100}, 'opsz' ${layer.fontOpsz ?? Math.max(9, Math.min(144, layer.fontSize || 72))}, 'wght' ${layer.fontWeight ?? 350}, 'WONK' 0`;
      div.style.letterSpacing = `${(layer.letterSpacing !== undefined ? layer.letterSpacing : -1) * scale}px`;
      div.style.lineHeight = `${bounds.lineHeight * scale}px`;
      div.style.color = layer.color || '#ffffff';
      div.style.textAlign = layer.align || 'center';

      if (layer.hasShadow) {
        div.style.textShadow = `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.85)`;
      } else {
        div.style.textShadow = 'none';
      }

      if (layer.isBadge) {
        div.style.background = 'rgba(229, 9, 20, 0.28)';
        div.style.border = `${1.5 * scale}px solid rgba(248, 113, 113, 0.5)`;
        div.style.borderRadius = `${8 * scale}px`;
        div.style.padding = `${bounds.padY * scale}px ${bounds.padX * scale}px`;
      } else {
        div.style.background = 'none';
        div.style.border = 'none';
        div.style.padding = '0';
      }

      div.style.transformOrigin = 'center center';
      if (layer.rotation) {
        div.style.transform = `rotate(${layer.rotation}deg)`;
      } else {
        div.style.transform = 'none';
      }

      div.innerHTML = bounds.parsedLines.map(lineObj => {
        const lineHtml = lineObj.tokens.map(token => {
          const tWeight = token.style.weight ?? 350;
          const tStyle = token.style.italic ? 'italic' : 'normal';
          const tColor = token.style.color || layer.color || '#ffffff';
          const tSoft = token.style.soft ?? (layer.soft ?? 100);
          const tOpsz = token.style.opsz ?? (layer.fontOpsz ?? Math.max(9, Math.min(144, layer.fontSize || 72)));
          const tUnderline = token.style.underline ? 'text-decoration:underline;text-underline-offset:0.12em;text-decoration-thickness:0.04em;' : '';

          const styleAttr = [
            `font-weight:${tWeight}`,
            `font-style:${tStyle}`,
            `color:${tColor}`,
            `font-variation-settings:'SOFT' ${tSoft}, 'opsz' ${tOpsz}, 'wght' ${tWeight}, 'WONK' 0`,
            tUnderline
          ].filter(Boolean).join(';');

          return `<span style="${styleAttr}">${this.renderer.escapeSvg(token.text) || '&nbsp;'}</span>`;
        }).join('');

        return `<div>${lineHtml || '&nbsp;'}</div>`;
      }).join('');
    });

    existingDivs.forEach((el, id) => {
      if (!activeIds.has(id)) {
        el.remove();
      }
    });
  }

  updateSelectionBox() {
    if (!this.selectedLayer) {
      this.touchControls.select(null, null, null);
      return;
    }

    if (this.selectedLayer.id && this.selectedLayer.id.startsWith('img-')) {
      const bounds = this.renderer.getImageBounds(this.selectedLayer);
      this.touchControls.select('image', this.selectedLayer, bounds);
    } else {
      const bounds = this.renderer.getTextBounds(this.renderer.previewCtx, this.selectedLayer);
      this.touchControls.select('text', this.selectedLayer, bounds);
    }
  }

  // Canvas Hit testing on tap
  hitTestLayer(canvasX, canvasY, targetEl = null) {
    if (targetEl) {
      const textDom = targetEl.closest('.dom-text-layer');
      if (textDom && textDom.dataset.id) {
        const layer = this.state.textLayers.find(l => l.id === textDom.dataset.id);
        if (layer) {
          this.selectTextLayer(layer);
          this.switchTab('text');
          this.render();
          return { type: 'text', layer };
        }
      }
    }

    // 1. Text layers (top-most first)
    for (let i = this.state.textLayers.length - 1; i >= 0; i--) {
      const layer = this.state.textLayers[i];
      const bounds = this.renderer.getTextBounds(this.renderer.previewCtx, layer);
      if (
        canvasX >= bounds.left &&
        canvasX <= bounds.left + bounds.width &&
        canvasY >= bounds.top &&
        canvasY <= bounds.top + bounds.height
      ) {
        this.selectTextLayer(layer);
        this.switchTab('text');
        this.render();
        return { type: 'text', layer };
      }
    }

    // 2. Image layers (top-most first)
    if (this.state.imageLayers && this.state.imageLayers.length > 0) {
      for (let i = this.state.imageLayers.length - 1; i >= 0; i--) {
        const layer = this.state.imageLayers[i];
        if (layer.visible === false) continue;
        const bounds = this.renderer.getImageBounds(layer);
        if (
          canvasX >= bounds.left &&
          canvasX <= bounds.left + bounds.width &&
          canvasY >= bounds.top &&
          canvasY <= bounds.top + bounds.height
        ) {
          this.selectImageLayer(layer);
          this.switchTab('image-layer');
          this.render();
          return { type: 'image', layer };
        }
      }
    }

    return null;
  }

  onLayerModifiedByGesture() {
    this.syncControlsFromState();
    this.updateDOMTextOverlay();
    // Moving or resizing changes the logical bounds used by the selection handles.
    this.updateSelectionBox();
    if (this.selectedLayer && this.selectedLayer.id && this.selectedLayer.id.startsWith('img-')) {
      this.renderer.render(this.state, 'preview');
    }
  }

  selectTextLayer(layer) {
    this.selectedLayer = layer;
    this.syncControlsFromState();
    this.updateSelectionBox();
  }

  selectImageLayer(layer) {
    this.selectedLayer = layer;
    this.syncControlsFromState();
    this.updateSelectionBox();
  }

  addImageLayer(imageDataUrl, name = 'Image Layer') {
    if (!imageDataUrl) return;
    const img = new Image();
    img.onload = () => {
      const aspect = (img.naturalWidth && img.naturalHeight) ? (img.naturalWidth / img.naturalHeight) : 1;
      const initialSize = 320;
      const newLayer = {
        id: `img-${Date.now()}`,
        name: name || 'Image Layer',
        image: imageDataUrl,
        aspectRatio: aspect,
        x: Math.round(this.renderer.logicalWidth / 2),
        y: Math.round(this.renderer.logicalHeight / 2),
        size: initialSize,
        opacity: 100,
        radius: 0,
        rotation: 0,
        visible: true
      };
      if (!this.state.imageLayers) {
        this.state.imageLayers = [];
      }
      this.state.imageLayers.push(newLayer);
      this.selectImageLayer(newLayer);
      this.switchTab('image-layer');
      this.render();
      this.showToast('Added image layer');
    };
    img.src = imageDataUrl;
  }

  deleteSelectedImageLayer() {
    if (!this.selectedLayer || !this.selectedLayer.id || !this.selectedLayer.id.startsWith('img-')) return;
    const idx = this.state.imageLayers.findIndex(l => l.id === this.selectedLayer.id);
    if (idx !== -1) {
      this.state.imageLayers.splice(idx, 1);
      if (this.state.imageLayers.length > 0) {
        this.selectImageLayer(this.state.imageLayers[Math.max(0, idx - 1)]);
      } else if (this.state.textLayers.length > 0) {
        this.selectTextLayer(this.state.textLayers[0]);
        this.switchTab('text');
      } else {
        this.selectedLayer = null;
        this.updateSelectionBox();
      }
      this.render();
      this.showToast('Deleted image layer');
    }
  }

  duplicateSelectedImageLayer() {
    if (!this.selectedLayer || !this.selectedLayer.id || !this.selectedLayer.id.startsWith('img-')) return;
    const l = this.selectedLayer;
    const newLayer = {
      ...l,
      id: `img-${Date.now()}`,
      name: `${l.name || 'Image'} (Copy)`,
      x: Math.min(this.renderer.logicalWidth - 50, (l.x || 540) + 35),
      y: Math.min(this.renderer.logicalHeight - 50, (l.y || 540) + 35)
    };
    this.state.imageLayers.push(newLayer);
    this.selectImageLayer(newLayer);
    this.render();
    this.showToast('Duplicated image layer');
  }

  switchTab(tabName) {
    this.tabBtns.forEach(btn => {
      const isActive = btn.dataset.tab === tabName;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    this.panels.forEach(p => {
      p.classList.toggle('active', p.id === `panel-${tabName}`);
    });

    // Auto expand dock if collapsed
    if (this.controlsDock.classList.contains('collapsed')) {
      this.toggleDock(false);
    }
  }

  toggleDock(shouldCollapse = null) {
    const willCollapse = shouldCollapse !== null ? shouldCollapse : !this.controlsDock.classList.contains('collapsed');
    this.controlsDock.classList.toggle('collapsed', willCollapse);
    this.btnExpandDock.classList.toggle('hidden', !willCollapse);
    this.dockToggleIcon.textContent = willCollapse ? '▲' : '▼';

    // Smoothly re-center canvas when dock visibility changes
    this.updateCanvasDimensions();
    this.touchControls.resetView(true);
  }

  syncControlsFromState() {
    // Text controls & Fraunces variable axes
    if (this.selectedLayer && this.selectedLayer.id !== 'logo' && !this.selectedLayer.id.startsWith('img-')) {
      const l = this.selectedLayer;
      this.textInput.value = l.text || '';
      
      // SOFT Axis
      this.softSlider.value = l.soft ?? 100;
      this.softValue.textContent = l.soft ?? 100;

      // Optical Size
      this.opszSlider.value = l.fontOpsz ?? 72;
      this.opszValue.textContent = l.fontOpsz ?? 72;

      // Font Weight
      this.fontWeightSlider.value = l.fontWeight ?? 350;
      this.fontWeightValue.textContent = l.fontWeight ?? 350;

      // Size & Spacing
      this.fontSizeSlider.value = l.fontSize || 72;
      this.fontSizeValue.textContent = `${l.fontSize || 72}px`;
      this.lineHeightSlider.value = l.lineHeight || 1.15;
      this.lineHeightValue.textContent = (l.lineHeight || 1.15).toFixed(2);
      this.letterSpacingSlider.value = l.letterSpacing !== undefined ? l.letterSpacing : -1;
      this.letterSpacingValue.textContent = `${l.letterSpacing !== undefined ? l.letterSpacing : -1}px`;
      if (this.textRotationSlider) {
        this.textRotationSlider.value = l.rotation || 0;
        this.textRotationValue.textContent = `${l.rotation || 0}°`;
      }

      this.textColorPicker.value = l.color || '#ffffff';
      this.textColorPreview.style.background = l.color || '#ffffff';

      this.textAlignBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.align === (l.align || 'center'));
      });

      this.btnToggleItalic.classList.toggle('active', !!l.italic);
      this.btnToggleShadow.classList.toggle('active', !!l.hasShadow);
      this.btnToggleBadge.classList.toggle('active', !!l.isBadge);

      this.weightPresetBtns.forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.weight) === Number(l.fontWeight ?? 350));
      });
    }

    // Image layer controls
    if (this.selectedLayer && this.selectedLayer.id && this.selectedLayer.id.startsWith('img-')) {
      const l = this.selectedLayer;
      if (this.activeImgLayerControls) {
        this.activeImgLayerControls.classList.remove('hidden');
      }
      if (this.imgLayerSizeSlider) {
        this.imgLayerSizeSlider.value = l.size || 320;
        this.imgLayerSizeValue.textContent = `${l.size || 320}px`;
      }
      if (this.imgLayerRadiusSlider) {
        this.imgLayerRadiusSlider.value = l.radius || 0;
        this.imgLayerRadiusValue.textContent = `${l.radius || 0}px`;
      }
      if (this.imgLayerOpacitySlider) {
        this.imgLayerOpacitySlider.value = l.opacity ?? 100;
        this.imgLayerOpacityValue.textContent = `${l.opacity ?? 100}%`;
      }
      if (this.imgLayerRotationSlider) {
        this.imgLayerRotationSlider.value = l.rotation || 0;
        this.imgLayerRotationValue.textContent = `${l.rotation || 0}°`;
      }
    } else {
      if (this.activeImgLayerControls && (!this.state.imageLayers || this.state.imageLayers.length === 0)) {
        this.activeImgLayerControls.classList.add('hidden');
      }
    }

    // Gradient controls
    if (this.state.gradient) {
      this.toggleGradientActive.checked = this.state.gradient.active;
      this.gradientOpacitySlider.value = this.state.gradient.opacity;
      this.gradientOpacityValue.textContent = `${this.state.gradient.opacity}%`;
      this.gradientAngleSlider.value = this.state.gradient.angle;
      this.gradientAngleValue.textContent = `${this.state.gradient.angle}°`;
      if (this.gradientAnglePresetBtns) {
        this.gradientAnglePresetBtns.forEach(btn => {
          btn.classList.toggle('active', Number(btn.dataset.angle) === Number(this.state.gradient.angle));
        });
      }
      this.gradientBlendMode.value = this.state.gradient.blendMode || 'normal';
      const gradHeight = this.state.gradient.height ?? 100;
      if (this.gradientHeightSlider) {
        this.gradientHeightSlider.value = gradHeight;
        this.gradientHeightValue.textContent = `${gradHeight}%`;
      }
    }

    // Background Image adjustments
    if (this.bgScaleSlider) {
      this.bgScaleSlider.value = this.state.bgScale ?? 100;
      this.bgScaleValue.textContent = `${this.state.bgScale ?? 100}%`;
    }
    if (this.bgPosXSlider) {
      this.bgPosXSlider.value = this.state.bgPosX ?? 0;
      this.bgPosXValue.textContent = `${this.state.bgPosX ?? 0}%`;
    }
    if (this.bgPosYSlider) {
      this.bgPosYSlider.value = this.state.bgPosY ?? 0;
      this.bgPosYValue.textContent = `${this.state.bgPosY ?? 0}%`;
    }
    this.bgBrightnessSlider.value = this.state.bgBrightness ?? 100;
    this.bgBrightnessValue.textContent = `${this.state.bgBrightness ?? 100}%`;
    this.bgContrastSlider.value = this.state.bgContrast ?? 100;
    this.bgContrastValue.textContent = `${this.state.bgContrast ?? 100}%`;
    this.bgBlurSlider.value = this.state.bgBlur ?? 0;
    this.bgBlurValue.textContent = `${this.state.bgBlur ?? 0}px`;
  }

  bindEvents() {
    // Dock collapse & expand triggers
    this.dockHandleBar.addEventListener('click', () => this.toggleDock());
    this.btnExpandDock.addEventListener('click', () => this.toggleDock(false));

    // Zoom buttons
    this.btnZoomIn.addEventListener('click', () => {
      this.touchControls.setZoomAndPan(this.touchControls.zoom + 0.15, this.touchControls.panX, this.touchControls.panY, true);
    });

    this.btnZoomOut.addEventListener('click', () => {
      this.touchControls.setZoomAndPan(this.touchControls.zoom - 0.15, this.touchControls.panX, this.touchControls.panY, true);
    });

    this.btnZoomFit.addEventListener('click', () => {
      this.touchControls.resetView(true);
    });

    // Wheel Zoom on Desktop (Ctrl/Cmd + Wheel)
    window.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        this.touchControls.setZoomAndPan(this.touchControls.zoom + delta, this.touchControls.panX, this.touchControls.panY, false);
      }
    }, { passive: false });

    // Category Tabs
    this.dockTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (btn) {
        this.switchTab(btn.dataset.tab);
        if (btn.dataset.tab === 'text' && !this.selectedLayer) {
          if (this.state.textLayers.length > 0) {
            this.selectTextLayer(this.state.textLayers[0]);
            this.render();
          }
        }
      }
    });

    // Aspect Ratio Chips
    this.ratioChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.ratioChips.forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-checked', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-checked', 'true');

        this.state.aspectRatio = chip.dataset.ratio;
        this.updateCanvasDimensions();
        this.touchControls.resetView(false);
        this.render();
        this.showToast(`Canvas: ${chip.dataset.ratio}`);
      });
    });

    // Fraunces SOFT Axis Slider (0 - 100)
    this.softSlider.addEventListener('input', (e) => {
      if (this.selectedLayer && this.selectedLayer.id !== 'logo') {
        const val = Number(e.target.value);
        this.selectedLayer.soft = val;
        this.softValue.textContent = val;
        this.render();
      }
    });

    // Fraunces Optical Size opsz Slider (9 - 144)
    this.opszSlider.addEventListener('input', (e) => {
      if (this.selectedLayer && this.selectedLayer.id !== 'logo') {
        const val = Number(e.target.value);
        this.selectedLayer.fontOpsz = val;
        this.opszValue.textContent = val;
        this.render();
      }
    });

    // Letter Spacing Slider (-3 to 25px)
    this.letterSpacingSlider.addEventListener('input', (e) => {
      if (this.selectedLayer && this.selectedLayer.id !== 'logo') {
        const val = parseFloat(e.target.value);
        this.selectedLayer.letterSpacing = val;
        this.letterSpacingValue.textContent = `${val}px`;
        this.render();
      }
    });

    // Selection Formatting Toolbar Events (Bold, Italic, Underline, Color, Clear)
    if (this.btnFmtBold) {
      this.btnFmtBold.addEventListener('click', () => {
        this.applySelectionFormat('**', '**', 'bold');
      });
    }

    if (this.btnFmtItalic) {
      this.btnFmtItalic.addEventListener('click', () => {
        this.applySelectionFormat('*', '*', 'italic');
      });
    }

    if (this.btnFmtUnderline) {
      this.btnFmtUnderline.addEventListener('click', () => {
        this.applySelectionFormat('<u>', '</u>', 'underline');
      });
    }

    if (this.btnFmtColor) {
      this.btnFmtColor.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.fmtColorPopover) {
          this.fmtColorPopover.classList.toggle('hidden');
        }
      });
    }

    if (this.fmtColorPopover) {
      this.fmtColorPopover.querySelectorAll('.swatch-circle').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const color = btn.dataset.color;
          this.applySelectionColor(color);
          this.fmtColorPopover.querySelectorAll('.swatch-circle').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (this.fmtColorDot) this.fmtColorDot.style.background = color;
          this.fmtColorPopover.classList.add('hidden');
        });
      });
    }

    if (this.fmtCustomColorPicker) {
      this.fmtCustomColorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        this.applySelectionColor(color);
        if (this.fmtColorDot) this.fmtColorDot.style.background = color;
      });
      this.fmtCustomColorPicker.addEventListener('change', () => {
        if (this.fmtColorPopover) this.fmtColorPopover.classList.add('hidden');
      });
    }

    if (this.btnFmtClear) {
      this.btnFmtClear.addEventListener('click', () => {
        this.clearSelectionFormatting();
      });
    }

    // Close color popover on click outside
    document.addEventListener('click', (e) => {
      if (this.fmtColorPopover && !this.fmtColorPopover.classList.contains('hidden')) {
        if (!e.target.closest('.color-swatch-dropdown-wrapper')) {
          this.fmtColorPopover.classList.add('hidden');
        }
      }
    });

    // Text Content & Font Sliders
    this.textInput.addEventListener('input', (e) => {
      if (this.selectedLayer && this.selectedLayer.id !== 'logo') {
        this.selectedLayer.text = e.target.value;
        this.render();
      }
    });

    this.fontWeightSlider.addEventListener('input', (e) => {
      if (this.selectedLayer && this.selectedLayer.id !== 'logo') {
        const val = Number(e.target.value);
        this.selectedLayer.fontWeight = val;
        this.fontWeightValue.textContent = val;
        this.weightPresetBtns.forEach(b => b.classList.toggle('active', Number(b.dataset.weight) === val));
        this.render();
      }
    });

    this.weightPresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.selectedLayer && this.selectedLayer.id !== 'logo') {
          const val = Number(btn.dataset.weight);
          this.selectedLayer.fontWeight = val;
          this.fontWeightSlider.value = val;
          this.fontWeightValue.textContent = val;
          this.weightPresetBtns.forEach(b => b.classList.toggle('active', b === btn));
          this.render();
        }
      });
    });

    this.fontSizeSlider.addEventListener('input', (e) => {
      if (this.selectedLayer && this.selectedLayer.id !== 'logo') {
        const val = Number(e.target.value);
        this.selectedLayer.fontSize = val;
        this.fontSizeValue.textContent = `${val}px`;
        this.render();
      }
    });

    this.lineHeightSlider.addEventListener('input', (e) => {
      if (this.selectedLayer && this.selectedLayer.id !== 'logo') {
        const val = parseFloat(e.target.value);
        this.selectedLayer.lineHeight = val;
        this.lineHeightValue.textContent = val.toFixed(2);
        this.render();
      }
    });

    if (this.textRotationSlider) {
      this.textRotationSlider.addEventListener('input', (e) => {
        if (this.selectedLayer && this.selectedLayer.id !== 'logo') {
          const val = parseInt(e.target.value, 10) || 0;
          this.selectedLayer.rotation = val;
          this.textRotationValue.textContent = `${val}°`;
          this.render();
        }
      });
    }

    if (this.btnResetTextRotation) {
      this.btnResetTextRotation.addEventListener('click', () => {
        if (this.selectedLayer && this.selectedLayer.id !== 'logo') {
          this.selectedLayer.rotation = 0;
          if (this.textRotationSlider) this.textRotationSlider.value = 0;
          if (this.textRotationValue) this.textRotationValue.textContent = '0°';
          this.render();
        }
      });
    }

    this.textAlignBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.selectedLayer && this.selectedLayer.id !== 'logo') {
          this.textAlignBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.selectedLayer.align = btn.dataset.align;
          this.render();
        }
      });
    });

    this.btnToggleItalic.addEventListener('click', () => {
      if (this.selectedLayer && this.selectedLayer.id !== 'logo') {
        this.selectedLayer.italic = !this.selectedLayer.italic;
        this.btnToggleItalic.classList.toggle('active', this.selectedLayer.italic);
        this.render();
      }
    });

    this.btnToggleShadow.addEventListener('click', () => {
      if (this.selectedLayer && this.selectedLayer.id !== 'logo') {
        this.selectedLayer.hasShadow = !this.selectedLayer.hasShadow;
        this.btnToggleShadow.classList.toggle('active', this.selectedLayer.hasShadow);
        this.render();
      }
    });

    this.btnToggleBadge.addEventListener('click', () => {
      if (this.selectedLayer && this.selectedLayer.id !== 'logo') {
        this.selectedLayer.isBadge = !this.selectedLayer.isBadge;
        this.btnToggleBadge.classList.toggle('active', this.selectedLayer.isBadge);
        this.render();
      }
    });

    this.textColorPicker.addEventListener('input', (e) => {
      if (this.selectedLayer && this.selectedLayer.id !== 'logo') {
        this.selectedLayer.color = e.target.value;
        this.textColorPreview.style.background = e.target.value;
        this.render();
      }
    });

    this.btnAddTextLayer.addEventListener('click', () => {
      const newLayer = {
        id: `text-${Date.now()}`,
        text: 'New Fraunces Text',
        fontSize: 72,
        fontWeight: 350, // DEFAULT 350
        fontOpsz: 72,
        soft: 100,
        letterSpacing: -1,
        lineHeight: 1.2,
        align: 'center',
        color: '#ffffff',
        italic: false, // DEFAULT NON-ITALIC
        hasShadow: false, // DEFAULT: NO GLOW
        isBadge: false,
        x: Math.round(this.renderer.logicalWidth / 2),
        y: 400 + Math.random() * 80
      };
      this.state.textLayers.push(newLayer);
      this.selectTextLayer(newLayer);
      this.render();
      this.showToast('Added Fraunces text layer');
    });

    // Gradient Events
    this.toggleGradientActive.addEventListener('change', (e) => {
      this.state.gradient.active = e.target.checked;
      this.render();
    });

    this.gradientOpacitySlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      this.state.gradient.opacity = val;
      this.gradientOpacityValue.textContent = `${val}%`;
      this.render();
    });

    const GRADIENT_SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315, 360];
    const GRADIENT_SNAP_THRESHOLD = 6;

    this.gradientAngleSlider.addEventListener('input', (e) => {
      let val = Number(e.target.value);
      for (const snap of GRADIENT_SNAP_ANGLES) {
        if (Math.abs(val - snap) <= GRADIENT_SNAP_THRESHOLD) {
          val = snap === 360 ? 0 : snap;
          break;
        }
      }
      this.state.gradient.angle = val;
      this.gradientAngleSlider.value = val;
      this.gradientAngleValue.textContent = `${val}°`;
      if (this.gradientAnglePresetBtns) {
        this.gradientAnglePresetBtns.forEach(btn => {
          btn.classList.toggle('active', Number(btn.dataset.angle) === val);
        });
      }
      this.render();
    });

    if (this.gradientAnglePresetBtns) {
      this.gradientAnglePresetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const angle = Number(btn.dataset.angle);
          this.state.gradient.angle = angle;
          this.gradientAngleSlider.value = angle;
          this.gradientAngleValue.textContent = `${angle}°`;
          this.gradientAnglePresetBtns.forEach(b => b.classList.toggle('active', b === btn));
          this.render();
        });
      });
    }

    if (this.gradientHeightSlider) {
      this.gradientHeightSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.state.gradient.height = val;
        this.gradientHeightValue.textContent = `${val}%`;
        this.render();
      });
    }

    this.gradientBlendMode.addEventListener('change', (e) => {
      this.state.gradient.blendMode = e.target.value;
      this.render();
    });

    const updateCustomGradientColors = () => {
      const startColor = this.gradStartColor.value;
      const startAlpha = Number(this.gradStartAlpha.value) / 100;
      const endColor = this.gradEndColor.value;
      const endAlpha = Number(this.gradEndAlpha.value) / 100;

      this.state.gradient.type = 'linear';
      this.state.gradient.stops = [
        { color: startColor, alpha: startAlpha, position: 0 },
        { color: endColor, alpha: endAlpha, position: 1.0 }
      ];
      this.render();
    };

    this.gradStartColor.addEventListener('input', updateCustomGradientColors);
    this.gradStartAlpha.addEventListener('input', updateCustomGradientColors);
    this.gradEndColor.addEventListener('input', updateCustomGradientColors);
    this.gradEndAlpha.addEventListener('input', updateCustomGradientColors);

    // Image Layers Events
    if (this.imageLayerFileInput) {
      this.imageLayerFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const cleanName = file.name.replace(/\.[^/.]+$/, "");
            this.addImageLayer(ev.target.result, cleanName);
          };
          reader.readAsDataURL(file);
        }
        e.target.value = '';
      });
    }

    if (this.btnAddImageLayer) {
      this.btnAddImageLayer.addEventListener('click', () => {
        if (this.imageLayerFileInput) this.imageLayerFileInput.click();
      });
    }

    if (this.btnAddImageLayerFromLayers) {
      this.btnAddImageLayerFromLayers.addEventListener('click', () => {
        if (this.imageLayerFileInput) this.imageLayerFileInput.click();
      });
    }

    if (this.btnAddTextLayerFromLayers) {
      this.btnAddTextLayerFromLayers.addEventListener('click', () => {
        this.btnAddTextLayer.click();
      });
    }

    this.sampleImgChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const key = chip.dataset.sample;
        if (SAMPLE_STICKERS && SAMPLE_STICKERS[key]) {
          this.addImageLayer(SAMPLE_STICKERS[key], chip.textContent.trim());
        }
      });
    });

    if (this.imgLayerSizeSlider) {
      this.imgLayerSizeSlider.addEventListener('input', (e) => {
        if (this.selectedLayer && this.selectedLayer.id && this.selectedLayer.id.startsWith('img-')) {
          const val = Number(e.target.value);
          this.selectedLayer.size = val;
          this.imgLayerSizeValue.textContent = `${val}px`;
          this.updateSelectionBox();
          this.render();
        }
      });
    }

    if (this.imgLayerRadiusSlider) {
      this.imgLayerRadiusSlider.addEventListener('input', (e) => {
        if (this.selectedLayer && this.selectedLayer.id && this.selectedLayer.id.startsWith('img-')) {
          const val = Number(e.target.value);
          this.selectedLayer.radius = val;
          this.imgLayerRadiusValue.textContent = `${val}px`;
          this.render();
        }
      });
    }

    if (this.imgLayerOpacitySlider) {
      this.imgLayerOpacitySlider.addEventListener('input', (e) => {
        if (this.selectedLayer && this.selectedLayer.id && this.selectedLayer.id.startsWith('img-')) {
          const val = Number(e.target.value);
          this.selectedLayer.opacity = val;
          this.imgLayerOpacityValue.textContent = `${val}%`;
          this.render();
        }
      });
    }

    if (this.imgLayerRotationSlider) {
      this.imgLayerRotationSlider.addEventListener('input', (e) => {
        if (this.selectedLayer && this.selectedLayer.id && this.selectedLayer.id.startsWith('img-')) {
          const val = parseInt(e.target.value, 10) || 0;
          this.selectedLayer.rotation = val;
          this.imgLayerRotationValue.textContent = `${val}°`;
          this.updateSelectionBox();
          this.render();
        }
      });
    }

    if (this.btnResetImgLayerRotation) {
      this.btnResetImgLayerRotation.addEventListener('click', () => {
        if (this.selectedLayer && this.selectedLayer.id && this.selectedLayer.id.startsWith('img-')) {
          this.selectedLayer.rotation = 0;
          if (this.imgLayerRotationSlider) this.imgLayerRotationSlider.value = 0;
          if (this.imgLayerRotationValue) this.imgLayerRotationValue.textContent = '0°';
          this.updateSelectionBox();
          this.render();
        }
      });
    }

    if (this.btnDuplicateImgLayer) {
      this.btnDuplicateImgLayer.addEventListener('click', () => {
        this.duplicateSelectedImageLayer();
      });
    }

    if (this.btnDeleteImgLayer) {
      this.btnDeleteImgLayer.addEventListener('click', () => {
        this.deleteSelectedImageLayer();
      });
    }

    // Quick Image Position Presets
    this.imgPosBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this.selectedLayer || !this.selectedLayer.id || !this.selectedLayer.id.startsWith('img-')) return;
        const pos = btn.dataset.imgpos;
        const width = this.renderer.logicalWidth;
        const height = this.renderer.logicalHeight;
        const bounds = this.renderer.getImageBounds(this.selectedLayer);
        const marginX = Math.round(width * 0.05);
        const marginY = Math.round(height * 0.05);
        const halfW = bounds.width / 2;
        const halfH = bounds.height / 2;

        if (pos === 'top-left') {
          this.selectedLayer.x = marginX + halfW;
          this.selectedLayer.y = marginY + halfH;
        } else if (pos === 'top-right') {
          this.selectedLayer.x = width - marginX - halfW;
          this.selectedLayer.y = marginY + halfH;
        } else if (pos === 'center') {
          this.selectedLayer.x = Math.round(width / 2);
          this.selectedLayer.y = Math.round(height / 2);
        } else if (pos === 'bottom-left') {
          this.selectedLayer.x = marginX + halfW;
          this.selectedLayer.y = height - marginY - halfH;
        } else if (pos === 'bottom-right') {
          this.selectedLayer.x = width - marginX - halfW;
          this.selectedLayer.y = height - marginY - halfH;
        }
        this.updateSelectionBox();
        this.render();
        this.showToast(`Positioned image layer`);
      });
    });

    // Background Image Upload & Filters
    if (this.bgFileInput) {
      this.bgFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            this.state.bgImage = ev.target.result;
            this.render();
            this.showToast('Background image set! 🖼️');
          };
          reader.readAsDataURL(file);
        }
        e.target.value = '';
      });
    }

    const btnSwitchToOverlay = document.getElementById('btnSwitchToOverlay');
    if (btnSwitchToOverlay) {
      btnSwitchToOverlay.addEventListener('click', () => {
        this.switchTab('image-layer');
        if (this.imageLayerFileInput) this.imageLayerFileInput.click();
      });
    }

    document.querySelectorAll('.sample-bg-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const key = chip.dataset.bg;
        if (SAMPLE_BACKGROUNDS[key]) {
          this.state.bgImage = SAMPLE_BACKGROUNDS[key];
          this.render();
          this.showToast(`Applied ${chip.textContent}`);
        }
      });
    });

    if (this.bgScaleSlider) {
      this.bgScaleSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.state.bgScale = val;
        this.bgScaleValue.textContent = `${val}%`;
        this.render();
      });
    }

    if (this.btnResetBgScale) {
      this.btnResetBgScale.addEventListener('click', () => {
        this.state.bgScale = 100;
        if (this.bgScaleSlider) this.bgScaleSlider.value = 100;
        if (this.bgScaleValue) this.bgScaleValue.textContent = '100%';
        this.render();
      });
    }

    if (this.bgPosXSlider) {
      this.bgPosXSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.state.bgPosX = val;
        this.bgPosXValue.textContent = `${val}%`;
        this.render();
      });
    }

    if (this.btnResetBgPosX) {
      this.btnResetBgPosX.addEventListener('click', () => {
        this.state.bgPosX = 0;
        if (this.bgPosXSlider) this.bgPosXSlider.value = 0;
        if (this.bgPosXValue) this.bgPosXValue.textContent = '0%';
        this.render();
      });
    }

    if (this.bgPosYSlider) {
      this.bgPosYSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.state.bgPosY = val;
        this.bgPosYValue.textContent = `${val}%`;
        this.render();
      });
    }

    if (this.btnResetBgPosY) {
      this.btnResetBgPosY.addEventListener('click', () => {
        this.state.bgPosY = 0;
        if (this.bgPosYSlider) this.bgPosYSlider.value = 0;
        if (this.bgPosYValue) this.bgPosYValue.textContent = '0%';
        this.render();
      });
    }

    this.bgBrightnessSlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      this.state.bgBrightness = val;
      this.bgBrightnessValue.textContent = `${val}%`;
      this.render();
    });

    this.bgContrastSlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      this.state.bgContrast = val;
      this.bgContrastValue.textContent = `${val}%`;
      this.render();
    });

    this.bgBlurSlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      this.state.bgBlur = val;
      this.bgBlurValue.textContent = `${val}px`;
      this.render();
    });

    // Reset Button
    this.btnReset.addEventListener('click', () => {
      if (confirm('Reset canvas to default?')) {
        this.state = this.getDefaultState();
        this.selectTextLayer(this.state.textLayers[0]);
        this.touchControls.resetView();
        this.updateCanvasDimensions();
        this.render();
        this.showToast('Reset complete');
      }
    });

    // Export PNG
    this.btnExport.addEventListener('click', async () => {
      this.btnExport.disabled = true;
      this.btnExport.style.opacity = '0.7';
      this.showToast('Rendering high-res PNG... ⏳');

      try {
        const success = await this.renderer.exportPNG(this.state, 'StudioPost');
        if (success) {
          this.showToast('Exported crisp PNG! ✨');
        } else {
          this.showToast('Export failed. Please try again.');
        }
      } catch (err) {
        console.error(err);
        this.showToast('Error exporting image');
      } finally {
        this.btnExport.disabled = false;
        this.btnExport.style.opacity = '1';
      }
    });
  }

  populateGradientPresets() {
    this.gradientPresetsGrid.innerHTML = '';
    GRADIENT_PRESETS.forEach(preset => {
      const card = document.createElement('div');
      card.className = `gradient-preset-card ${this.state.gradient.presetId === preset.id ? 'active' : ''}`;
      card.style.background = preset.preview;
      card.title = preset.description;
      card.innerHTML = `<span>${preset.name}</span>`;

      card.addEventListener('click', () => {
        document.querySelectorAll('.gradient-preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        this.state.gradient.active = true;
        this.state.gradient.presetId = preset.id;
        this.state.gradient.type = preset.type;
        this.state.gradient.angle = preset.angle;
        this.state.gradient.opacity = Math.round(preset.opacity * 100);
        this.state.gradient.blendMode = preset.blendMode;
        this.state.gradient.stops = JSON.parse(JSON.stringify(preset.stops));
        this.state.gradient.height = preset.height ?? this.state.gradient.height ?? 100;

        this.syncControlsFromState();
        this.render();
      });

      this.gradientPresetsGrid.appendChild(card);
    });
  }

  populateTemplates() {
    this.templatesGrid.innerHTML = '';
    STARTER_TEMPLATES.forEach(tpl => {
      const card = document.createElement('div');
      card.className = 'template-card';
      const bgSrc = SAMPLE_BACKGROUNDS[tpl.bg] || '';
      card.style.backgroundImage = `url("${bgSrc}")`;

      card.innerHTML = `
        <span class="tpl-category">${tpl.category}</span>
        <span class="tpl-title">${tpl.name}</span>
      `;

      card.addEventListener('click', () => {
        this.loadTemplate(tpl);
      });

      this.templatesGrid.appendChild(card);
    });
  }

  loadTemplate(tpl) {
    this.state.aspectRatio = tpl.aspectRatio || '1:1';
    this.state.bgImage = SAMPLE_BACKGROUNDS[tpl.bg] || this.state.bgImage;

    this.ratioChips.forEach(c => {
      const active = c.dataset.ratio === this.state.aspectRatio;
      c.classList.toggle('active', active);
      c.setAttribute('aria-checked', active ? 'true' : 'false');
    });

    const gradPreset = GRADIENT_PRESETS.find(p => p.id === tpl.gradientPreset) || GRADIENT_PRESETS[0];
    this.state.gradient = {
      active: true,
      presetId: gradPreset.id,
      type: gradPreset.type,
      angle: gradPreset.angle,
      opacity: Math.round((tpl.gradientOpacity ?? gradPreset.opacity) * 100),
      height: tpl.gradientHeight ?? gradPreset.height ?? 100,
      blendMode: gradPreset.blendMode,
      stops: JSON.parse(JSON.stringify(gradPreset.stops))
    };

    this.state.imageLayers = [];
    this.state.textLayers = tpl.textLayers.map((l, idx) => ({
      ...l,
      soft: l.soft ?? 100,
      fontWeight: l.fontWeight ?? 350, // DEFAULT 350
      italic: l.italic !== undefined ? l.italic : false, // DEFAULT NON-ITALIC
      letterSpacing: l.letterSpacing !== undefined ? l.letterSpacing : -1,
      id: `text-${idx + 1}`
    }));

    this.selectTextLayer(this.state.textLayers[0]);
    this.touchControls.resetView();
    this.updateCanvasDimensions();
    this.render();
    this.switchTab('text');
    this.showToast(`Loaded "${tpl.name}"`);
  }

  updateLayersPanel() {
    this.layersList.innerHTML = '';

    // Text layers
    this.state.textLayers.forEach((layer, idx) => {
      const item = document.createElement('div');
      const isSelected = this.selectedLayer && this.selectedLayer.id === layer.id;
      item.className = `layer-item ${isSelected ? 'active' : ''}`;

      item.innerHTML = `
        <div class="layer-info">
          <span class="layer-icon">✍️</span>
          <span class="layer-name">Text: "${layer.text.substring(0, 16)}..."</span>
        </div>
        <div class="layer-actions">
          <button class="layer-btn delete-btn" title="Delete Layer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.delete-btn')) {
          if (this.state.textLayers.length <= 1) {
            this.showToast('At least one text layer is required');
            return;
          }
          this.state.textLayers.splice(idx, 1);
          this.selectTextLayer(this.state.textLayers[0]);
          this.render();
          return;
        }

        this.selectTextLayer(layer);
        this.switchTab('text');
        this.render();
      });

      this.layersList.appendChild(item);
    });

    // Image layers
    if (this.state.imageLayers && this.state.imageLayers.length > 0) {
      this.state.imageLayers.forEach((layer, idx) => {
        const item = document.createElement('div');
        const isSelected = this.selectedLayer && this.selectedLayer.id === layer.id;
        item.className = `layer-item ${isSelected ? 'active' : ''}`;

        item.innerHTML = `
          <div class="layer-info">
            <img class="layer-thumb" src="${layer.image}" alt="${layer.name || 'Image'}">
            <span class="layer-name">${layer.name || 'Image Layer'}</span>
          </div>
          <div class="layer-actions">
            <button class="layer-btn delete-btn" title="Delete Layer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        `;

        item.addEventListener('click', (e) => {
          if (e.target.closest('.delete-btn')) {
            this.state.imageLayers.splice(idx, 1);
            if (this.selectedLayer && this.selectedLayer.id === layer.id) {
              if (this.state.imageLayers.length > 0) {
                this.selectImageLayer(this.state.imageLayers[Math.max(0, idx - 1)]);
              } else if (this.state.textLayers.length > 0) {
                this.selectTextLayer(this.state.textLayers[0]);
              } else {
                this.selectedLayer = null;
                this.updateSelectionBox();
              }
            }
            this.render();
            this.showToast('Deleted image layer');
            return;
          }

          this.selectImageLayer(layer);
          this.switchTab('image-layer');
          this.render();
        });

        this.layersList.appendChild(item);
      });
    }
  }

  applySelectionFormat(openTag, closeTag, defaultPlaceholder = 'text') {
    if (!this.selectedLayer || this.selectedLayer.id === 'logo') return;
    const input = this.textInput;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const val = input.value;

    let selectedText = val.substring(start, end);
    let newStart, newEnd;

    if (selectedText.length > 0) {
      if (selectedText.startsWith(openTag) && selectedText.endsWith(closeTag)) {
        const unwrapped = selectedText.slice(openTag.length, selectedText.length - closeTag.length);
        input.value = val.substring(0, start) + unwrapped + val.substring(end);
        newStart = start;
        newEnd = start + unwrapped.length;
      } else {
        const replacement = openTag + selectedText + closeTag;
        input.value = val.substring(0, start) + replacement + val.substring(end);
        newStart = start;
        newEnd = start + replacement.length;
      }
    } else {
      const replacement = openTag + defaultPlaceholder + closeTag;
      input.value = val.substring(0, start) + replacement + val.substring(end);
      newStart = start + openTag.length;
      newEnd = newStart + defaultPlaceholder.length;
    }

    input.focus();
    input.setSelectionRange(newStart, newEnd);
    this.selectedLayer.text = input.value;
    this.render();
    this.updateSelectionBox();
  }

  applySelectionColor(color) {
    if (!this.selectedLayer || this.selectedLayer.id === 'logo') return;
    const openTag = `<color:${color}>`;
    const closeTag = '</color>';
    this.applySelectionFormat(openTag, closeTag, 'colored');
  }

  clearSelectionFormatting() {
    if (!this.selectedLayer || this.selectedLayer.id === 'logo') return;
    const input = this.textInput;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const val = input.value;
    let newStart, newEnd;

    if (start === end) {
      input.value = this.renderer.stripFormatting(val);
      newStart = 0;
      newEnd = input.value.length;
    } else {
      const selected = val.substring(start, end);
      const cleaned = this.renderer.stripFormatting(selected);
      input.value = val.substring(0, start) + cleaned + val.substring(end);
      newStart = start;
      newEnd = start + cleaned.length;
    }

    input.focus();
    input.setSelectionRange(newStart, newEnd);
    this.selectedLayer.text = input.value;
    this.render();
    this.updateSelectionBox();
  }

  showToast(message) {
    this.toastEl.textContent = message;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastEl.classList.remove('show');
    }, 2200);
  }
}

// Instantiate on DOM load
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
