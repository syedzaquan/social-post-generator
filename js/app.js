/* ==========================================================================
   StudioPost — Application Controller
   Full-screen canvas with pinch zoom, pan, floating tools, Fraunces SOFT,
   optical size, letter-spacing, and default 400 italic typography.
   ========================================================================== */

import { CanvasRenderer, ASPECT_RATIOS } from './canvas.js';
import { TouchControls } from './touch-controls.js';
import { 
  GRADIENT_PRESETS, 
  SAMPLE_BACKGROUNDS, 
  SAMPLE_LOGOS, 
  STARTER_TEMPLATES 
} from './presets.js';

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

    // Logo Controls
    this.toggleLogoActive = document.getElementById('toggleLogoActive');
    this.logoFileInput = document.getElementById('logoFileInput');
    this.logoSizeSlider = document.getElementById('logoSizeSlider');
    this.logoSizeValue = document.getElementById('logoSizeValue');
    this.logoRadiusSlider = document.getElementById('logoRadiusSlider');
    this.logoRadiusValue = document.getElementById('logoRadiusValue');
    this.logoOpacitySlider = document.getElementById('logoOpacitySlider');
    this.logoOpacityValue = document.getElementById('logoOpacityValue');
    this.logoPosBtns = document.querySelectorAll('.pos-btn');

    // Background Image Controls
    this.bgFileInput = document.getElementById('bgFileInput');
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
      bgColor: '#090a10',
      bgImage: SAMPLE_BACKGROUNDS['gradient-dark'],
      bgBrightness: 100,
      bgContrast: 100,
      bgBlur: 0,
      gradient: {
        active: true,
        presetId: 'bottom-fade',
        type: 'linear',
        angle: 180,
        opacity: 85,
        height: 100,
        blendMode: 'normal',
        stops: [
          { color: '#000000', alpha: 0, position: 0.2 },
          { color: '#000000', alpha: 0.9, position: 1.0 }
        ]
      },
      logo: {
        active: true,
        image: SAMPLE_LOGOS['modern'],
        x: Math.round(1080 * 0.05) + 45, // 5% corner margin
        y: Math.round(1080 * 0.05) + 45,
        size: 90,
        radius: 0,
        opacity: 100,
        rotation: 0
      },
      textLayers: [
        {
          id: 'text-1',
          text: 'Design with intention, craft with soul.',
          fontSize: 58,
          fontWeight: 400, // DEFAULT: 400
          fontOpsz: 72,
          soft: 50, // DEFAULT: SOFT 50
          letterSpacing: 0, 
          lineHeight: 1.16,
          align: 'left',
          color: '#ffffff',
          italic: true, // DEFAULT: ITALIC
          hasShadow: false, // DEFAULT: NO GLOW
          isBadge: false,
          x: 90,
          y: 540
        },
        {
          id: 'text-2',
          text: 'STUDIO COLLECTION — 2026',
          fontSize: 16,
          fontWeight: 400, // DEFAULT: 400
          fontOpsz: 24,
          soft: 50,
          letterSpacing: 1.5,
          lineHeight: 1.2,
          align: 'left',
          color: '#fecaca',
          italic: true, // DEFAULT: ITALIC
          hasShadow: false,
          isBadge: true,
          x: 90,
          y: 460
        }
      ]
    };
  }

  init() {
    this.populateGradientPresets();
    this.populateTemplates();
    this.bindEvents();
    
    // Select first text layer by default
    this.selectTextLayer(this.state.textLayers[0]);

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

    const maxAvailableWidth = winW > 960 ? winW - 420 : winW - 24;
    const maxAvailableHeight = winH - 90;

    const targetRatio = ratioData.width / ratioData.height;
    let stageWidth, stageHeight;

    if (maxAvailableWidth / maxAvailableHeight > targetRatio) {
      stageHeight = maxAvailableHeight;
      stageWidth = stageHeight * targetRatio;
    } else {
      stageWidth = maxAvailableWidth;
      stageHeight = stageWidth / targetRatio;
    }

    this.canvasStage.style.width = `${Math.round(stageWidth)}px`;
    this.canvasStage.style.height = `${Math.round(stageHeight)}px`;

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
    this.textOverlayStage.innerHTML = '';

    const stageWidth = this.canvasStage.offsetWidth || parseFloat(this.canvasStage.style.width) || this.renderer.logicalWidth;
    const scale = stageWidth / this.renderer.logicalWidth;

    this.state.textLayers.forEach(layer => {
      if (!layer.text || layer.visible === false) return;

      const bounds = this.renderer.getTextBounds(this.renderer.previewCtx, layer);
      const screenPos = this.touchControls.canvasToClient(bounds.left, bounds.top, bounds.width, bounds.height);

      const div = document.createElement('div');
      div.className = 'dom-text-layer';
      div.dataset.id = layer.id;

      div.style.left = `${screenPos.left}px`;
      div.style.top = `${screenPos.top}px`;
      div.style.width = `${screenPos.width}px`;
      div.style.fontFamily = "'Fraunces', serif";
      div.style.fontStyle = layer.italic ? 'italic' : 'normal';
      div.style.fontWeight = layer.fontWeight || 400;
      div.style.fontSize = `${(layer.fontSize || 54) * scale}px`;
      div.style.fontVariationSettings = `'SOFT' ${layer.soft ?? 50}, 'opsz' ${layer.fontOpsz ?? 72}, 'wght' ${layer.fontWeight || 400}`;
      div.style.letterSpacing = `${(layer.letterSpacing || 0) * scale}px`;
      div.style.lineHeight = layer.lineHeight || 1.15;
      div.style.color = layer.color || '#ffffff';
      div.style.textAlign = layer.align || 'left';

      if (layer.hasShadow) {
        div.style.textShadow = `0 ${4 * scale}px ${12 * scale}px rgba(0, 0, 0, 0.85)`;
      }

      if (layer.isBadge) {
        div.style.background = 'rgba(229, 9, 20, 0.28)';
        div.style.border = `${1.5 * scale}px solid rgba(248, 113, 113, 0.5)`;
        div.style.borderRadius = `${8 * scale}px`;
        div.style.padding = `${4 * scale}px ${14 * scale}px`;
      }

      div.textContent = layer.text;

      // Clicking text selects it
      div.addEventListener('mousedown', (e) => {
        this.selectTextLayer(layer);
        this.switchTab('text');
        this.render();
      });
      div.addEventListener('touchstart', (e) => {
        this.selectTextLayer(layer);
        this.switchTab('text');
        this.render();
      }, { passive: true });

      this.textOverlayStage.appendChild(div);
    });
  }

  updateSelectionBox() {
    if (!this.selectedLayer) {
      this.touchControls.select(null, null, null);
      return;
    }

    if (this.selectedLayer.id === 'logo') {
      const bounds = this.renderer.getLogoBounds(this.state.logo);
      this.touchControls.select('logo', this.state.logo, bounds);
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

    // 1. Text layers
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

    // 2. Logo layer
    if (this.state.logo && this.state.logo.active) {
      const logoBounds = this.renderer.getLogoBounds(this.state.logo);
      if (
        canvasX >= logoBounds.left &&
        canvasX <= logoBounds.left + logoBounds.width &&
        canvasY >= logoBounds.top &&
        canvasY <= logoBounds.top + logoBounds.height
      ) {
        this.selectLogoLayer();
        this.switchTab('logo');
        this.render();
        return { type: 'logo', layer: this.state.logo };
      }
    }

    return null;
  }

  onLayerModifiedByGesture() {
    this.syncControlsFromState();
    this.render();
  }

  selectTextLayer(layer) {
    this.selectedLayer = layer;
    this.syncControlsFromState();
    this.updateSelectionBox();
  }

  selectLogoLayer() {
    this.selectedLayer = { id: 'logo' };
    this.syncControlsFromState();
    this.updateSelectionBox();
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
  }

  syncControlsFromState() {
    // Text controls & Fraunces variable axes
    if (this.selectedLayer && this.selectedLayer.id !== 'logo') {
      const l = this.selectedLayer;
      this.textInput.value = l.text || '';
      
      // SOFT Axis
      this.softSlider.value = l.soft ?? 50;
      this.softValue.textContent = l.soft ?? 50;

      // Optical Size
      this.opszSlider.value = l.fontOpsz ?? 72;
      this.opszValue.textContent = l.fontOpsz ?? 72;

      // Font Weight
      this.fontWeightSlider.value = l.fontWeight || 400;
      this.fontWeightValue.textContent = l.fontWeight || 400;

      // Size & Spacing
      this.fontSizeSlider.value = l.fontSize || 54;
      this.fontSizeValue.textContent = `${l.fontSize}px`;
      this.lineHeightSlider.value = l.lineHeight || 1.15;
      this.lineHeightValue.textContent = (l.lineHeight || 1.15).toFixed(2);
      this.letterSpacingSlider.value = l.letterSpacing || 0;
      this.letterSpacingValue.textContent = `${l.letterSpacing || 0}px`;

      this.textColorPicker.value = l.color || '#ffffff';
      this.textColorPreview.style.background = l.color || '#ffffff';

      this.textAlignBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.align === (l.align || 'left'));
      });

      this.btnToggleItalic.classList.toggle('active', !!l.italic);
      this.btnToggleShadow.classList.toggle('active', !!l.hasShadow);
      this.btnToggleBadge.classList.toggle('active', !!l.isBadge);

      this.weightPresetBtns.forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.weight) === Number(l.fontWeight || 400));
      });
    }

    // Logo controls
    if (this.state.logo) {
      this.toggleLogoActive.checked = this.state.logo.active;
      this.logoSizeSlider.value = this.state.logo.size;
      this.logoSizeValue.textContent = `${this.state.logo.size}px`;
      this.logoRadiusSlider.value = this.state.logo.radius || 0;
      this.logoRadiusValue.textContent = `${this.state.logo.radius || 0}px`;
      this.logoOpacitySlider.value = this.state.logo.opacity ?? 100;
      this.logoOpacityValue.textContent = `${this.state.logo.opacity ?? 100}%`;
    }

    // Gradient controls
    if (this.state.gradient) {
      this.toggleGradientActive.checked = this.state.gradient.active;
      this.gradientOpacitySlider.value = this.state.gradient.opacity;
      this.gradientOpacityValue.textContent = `${this.state.gradient.opacity}%`;
      this.gradientAngleSlider.value = this.state.gradient.angle;
      this.gradientAngleValue.textContent = `${this.state.gradient.angle}°`;
      this.gradientBlendMode.value = this.state.gradient.blendMode || 'normal';
      const gradHeight = this.state.gradient.height ?? 100;
      if (this.gradientHeightSlider) {
        this.gradientHeightSlider.value = gradHeight;
        this.gradientHeightValue.textContent = `${gradHeight}%`;
      }
    }

    // Background Image adjustments
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
        if (btn.dataset.tab === 'logo') {
          this.selectLogoLayer();
          this.render();
        } else if (btn.dataset.tab === 'text' && (!this.selectedLayer || this.selectedLayer.id === 'logo')) {
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
        fontSize: 42,
        fontWeight: 400, // DEFAULT 400
        fontOpsz: 48,
        soft: 50,
        letterSpacing: 0,
        lineHeight: 1.2,
        align: 'left',
        color: '#ffffff',
        italic: true, // DEFAULT ITALIC
        hasShadow: false, // DEFAULT: NO GLOW
        isBadge: false,
        x: 100,
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

    this.gradientAngleSlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      this.state.gradient.angle = val;
      this.gradientAngleValue.textContent = `${val}°`;
      this.render();
    });

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

    // Logo Events
    this.toggleLogoActive.addEventListener('change', (e) => {
      this.state.logo.active = e.target.checked;
      this.render();
    });

    this.logoFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.state.logo.image = ev.target.result;
          this.state.logo.active = true;
          this.toggleLogoActive.checked = true;
          this.selectLogoLayer();
          this.render();
          this.showToast('Brand logo uploaded! 🏷️');
        };
        reader.readAsDataURL(file);
      }
    });

    document.querySelectorAll('.sample-logo-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const key = chip.dataset.logo;
        if (SAMPLE_LOGOS[key]) {
          this.state.logo.image = SAMPLE_LOGOS[key];
          this.state.logo.active = true;
          this.toggleLogoActive.checked = true;
          this.selectLogoLayer();
          this.render();
          this.showToast(`Applied ${chip.textContent} logo`);
        }
      });
    });

    this.logoSizeSlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      this.state.logo.size = val;
      this.logoSizeValue.textContent = `${val}px`;
      this.render();
    });

    this.logoRadiusSlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      this.state.logo.radius = val;
      this.logoRadiusValue.textContent = `${val}px`;
      this.render();
    });

    this.logoOpacitySlider.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      this.state.logo.opacity = val;
      this.logoOpacityValue.textContent = `${val}%`;
      this.render();
    });

    // Quick Logo 5% corner padding align
    this.logoPosBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const pos = btn.dataset.pos;
        const width = this.renderer.logicalWidth;
        const height = this.renderer.logicalHeight;

        const marginX = Math.round(width * 0.05);
        const marginY = Math.round(height * 0.05);
        const halfSize = this.state.logo.size / 2;

        if (pos === 'top-left') {
          this.state.logo.x = marginX + halfSize;
          this.state.logo.y = marginY + halfSize;
        } else if (pos === 'top-right') {
          this.state.logo.x = width - marginX - halfSize;
          this.state.logo.y = marginY + halfSize;
        } else if (pos === 'bottom-left') {
          this.state.logo.x = marginX + halfSize;
          this.state.logo.y = height - marginY - halfSize;
        } else if (pos === 'bottom-right') {
          this.state.logo.x = width - marginX - halfSize;
          this.state.logo.y = height - marginY - halfSize;
        }
        this.render();
        this.showToast(`Aligned to ${pos.replace('-', ' ')} with 5% margin`);
      });
    });

    // Background Image Upload & Filters
    this.bgFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          this.state.bgImage = ev.target.result;
          this.render();
          this.showToast('Background uploaded! 🖼️');
        };
        reader.readAsDataURL(file);
      }
    });

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

    this.state.logo = {
      active: true,
      image: SAMPLE_LOGOS[tpl.logo] || SAMPLE_LOGOS['modern'],
      x: tpl.logoPos.x,
      y: tpl.logoPos.y,
      size: tpl.logoPos.size,
      radius: 0,
      opacity: 100,
      rotation: 0
    };

    this.state.textLayers = tpl.textLayers.map((l, idx) => ({
      ...l,
      soft: l.soft ?? 50,
      fontWeight: l.fontWeight || 400, // DEFAULT 400
      italic: l.italic !== undefined ? l.italic : true, // DEFAULT ITALIC
      letterSpacing: l.letterSpacing || 0,
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

    // Logo Layer
    if (this.state.logo && this.state.logo.active) {
      const item = document.createElement('div');
      const isSelected = this.selectedLayer && this.selectedLayer.id === 'logo';
      item.className = `layer-item ${isSelected ? 'active' : ''}`;

      item.innerHTML = `
        <div class="layer-info">
          <span class="layer-icon">🏷️</span>
          <span class="layer-name">Brand Logo</span>
        </div>
      `;

      item.addEventListener('click', () => {
        this.selectLogoLayer();
        this.switchTab('logo');
        this.render();
      });

      this.layersList.appendChild(item);
    }
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
