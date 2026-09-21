/* ==========================================================================
   StudioPost — Direct Canvas Touch, Pinch Zoom & Handle Controls
   Enables 2-finger pinch zoom & canvas pan, touch drag & corner handle resizing.
   ========================================================================== */

export class TouchControls {
  constructor(viewportArea, canvasStage, previewCanvas, selectionBox, selectionTag, options = {}) {
    this.viewport = viewportArea;
    this.stage = canvasStage;
    this.canvas = previewCanvas;
    this.selectionBox = selectionBox;
    this.selectionTag = selectionTag;

    this.onLayerChange = options.onLayerChange || (() => {});
    this.onSelectLayer = options.onSelectLayer || (() => null);
    this.onCanvasTransform = options.onCanvasTransform || (() => {});

    // Layer state
    this.activeLayer = null;
    this.activeType = null; // 'text' | 'logo'
    this.isDragging = false;
    this.isResizing = false;
    this.activeHandle = null;
    this.dragStart = { x: 0, y: 0 };
    this.initialLayerState = null;

    // Canvas Zoom & Pan state
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isPinchingCanvas = false;
    this.isPanningCanvas = false;
    this.initialPinchDist = 0;
    this.initialPinchMid = { x: 0, y: 0 };
    this.initialZoom = 1.0;
    this.initialPan = { x: 0, y: 0 };
    this.panStartClient = { x: 0, y: 0 };

    this.initEvents();
  }

  // Convert client viewport coordinates to logical canvas coordinates (e.g. 1080x...)
  clientToCanvas(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  // Convert logical canvas coordinates to screen CSS coordinates relative to stage
  canvasToClient(canvasX, canvasY, width, height) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = rect.width / this.canvas.width;
    const scaleY = rect.height / this.canvas.height;

    return {
      left: canvasX * scaleX,
      top: canvasY * scaleY,
      width: width * scaleX,
      height: height * scaleY
    };
  }

  initEvents() {
    // Viewport touch listeners (supports multi-touch pinch & pan)
    this.viewport.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    window.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    window.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    window.addEventListener('touchcancel', (e) => this.handleTouchEnd(e));

    // Mouse listeners for desktop
    this.viewport.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', () => this.handleMouseUp());

    // Window resize observer
    window.addEventListener('resize', () => {
      if (this.activeLayer) this.updateSelectionBounds();
    });
  }

  setZoomAndPan(zoom, panX = 0, panY = 0) {
    this.zoom = Math.max(0.35, Math.min(3.0, zoom));
    this.panX = panX;
    this.panY = panY;
    this.onCanvasTransform(this.zoom, this.panX, this.panY);
    this.updateSelectionBounds();
  }

  resetView() {
    this.setZoomAndPan(1.0, 0, 0);
  }

  select(type, layer, bounds) {
    this.activeType = type;
    this.activeLayer = layer;
    this.cachedBounds = bounds;

    if (!layer) {
      this.selectionBox.classList.add('hidden');
      return;
    }

    this.selectionBox.classList.remove('hidden');
    this.selectionTag.textContent = type === 'logo' ? 'Brand Logo' : 'Text Layer';
    this.updateSelectionBounds();
  }

  updateSelectionBounds(bounds = null) {
    if (!this.activeLayer) {
      this.selectionBox.classList.add('hidden');
      return;
    }

    const b = bounds || this.cachedBounds;
    if (!b) return;

    const screenPos = this.canvasToClient(b.left, b.top, b.width, b.height);

    this.selectionBox.style.left = `${screenPos.left}px`;
    this.selectionBox.style.top = `${screenPos.top}px`;
    this.selectionBox.style.width = `${screenPos.width}px`;
    this.selectionBox.style.height = `${screenPos.height}px`;
  }

  // ==========================================
  // Touch Event Handling (Pinch & Move)
  // ==========================================
  handleTouchStart(e) {
    // 2-finger gesture: Canvas Pinch to Zoom & Pan
    if (e.touches.length === 2) {
      e.preventDefault();
      this.isDragging = false;
      this.isResizing = false;
      this.isPanningCanvas = false;

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;

      this.isPinchingCanvas = true;
      this.initialPinchDist = Math.hypot(dx, dy);
      this.initialPinchMid = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };
      this.initialZoom = this.zoom;
      this.initialPan = { x: this.panX, y: this.panY };
      return;
    }

    // 1-finger gesture
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.processPointerDown(touch.clientX, touch.clientY, e.target);
    }
  }

  handleTouchMove(e) {
    // 2-finger Pinch Zoom & Pan
    if (e.touches.length === 2 && this.isPinchingCanvas) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      const dist = Math.hypot(dx, dy);

      if (this.initialPinchDist > 0) {
        const scale = dist / this.initialPinchDist;
        const newZoom = Math.max(0.35, Math.min(3.0, this.initialZoom * scale));

        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        const deltaX = midX - this.initialPinchMid.x;
        const deltaY = midY - this.initialPinchMid.y;

        this.zoom = newZoom;
        this.panX = Math.round(this.initialPan.x + deltaX);
        this.panY = Math.round(this.initialPan.y + deltaY);

        this.onCanvasTransform(this.zoom, this.panX, this.panY);
        this.updateSelectionBounds();
      }
      return;
    }

    // 1-finger move
    if (e.touches.length === 1) {
      if (this.isDragging || this.isResizing || this.isPanningCanvas) {
        e.preventDefault();
        this.processPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }
  }

  handleTouchEnd(e) {
    if (e.touches.length < 2) {
      this.isPinchingCanvas = false;
    }
    if (e.touches.length === 0) {
      this.handlePointerUp();
    }
  }

  // ==========================================
  // Mouse Event Handling (Desktop)
  // ==========================================
  handleMouseDown(e) {
    if (e.button !== 0) return; // Only primary button
    this.processPointerDown(e.clientX, e.clientY, e.target);
  }

  handleMouseMove(e) {
    if (this.isDragging || this.isResizing || this.isPanningCanvas) {
      this.processPointerMove(e.clientX, e.clientY);
    }
  }

  handleMouseUp() {
    this.handlePointerUp();
  }

  // ==========================================
  // Unified Pointer Processing
  // ==========================================
  processPointerDown(clientX, clientY, targetEl) {
    const handleEl = targetEl ? targetEl.closest('.handle, .handle-rotate') : null;
    const isSelectionBox = targetEl ? targetEl.closest('#selectionBox') : null;
    const isStageOrCanvas = targetEl ? targetEl.closest('#canvasStage, #previewCanvas, .text-overlay-stage, .dom-text-layer') : null;

    const coords = this.clientToCanvas(clientX, clientY);

    // 1. Click on resize or rotate handle
    if (handleEl && this.activeLayer) {
      this.isResizing = true;
      this.activeHandle = handleEl.dataset.handle;
      this.dragStart = coords;
      this.initialLayerState = { ...this.activeLayer };
      return;
    }

    // 2. Click inside current layer selection
    if (isSelectionBox && this.activeLayer) {
      this.isDragging = true;
      this.dragStart = coords;
      this.initialLayerState = { ...this.activeLayer };
      return;
    }

    // 3. Click on stage/canvas elements (Hit-test layer)
    if (isStageOrCanvas) {
      const hit = this.onSelectLayer(coords.x, coords.y);
      if (hit) {
        this.isDragging = true;
        this.dragStart = coords;
        this.initialLayerState = { ...hit.layer };
        return;
      }
    }

    // 4. Clicked outside layers: pan the canvas around
    this.isPanningCanvas = true;
    this.panStartClient = { x: clientX, y: clientY };
    this.initialPan = { x: this.panX, y: this.panY };
  }

  processPointerMove(clientX, clientY) {
    // Panning canvas
    if (this.isPanningCanvas) {
      const deltaX = clientX - this.panStartClient.x;
      const deltaY = clientY - this.panStartClient.y;
      this.panX = Math.round(this.initialPan.x + deltaX);
      this.panY = Math.round(this.initialPan.y + deltaY);
      this.onCanvasTransform(this.zoom, this.panX, this.panY);
      this.updateSelectionBounds();
      return;
    }

    if (!this.activeLayer) return;

    const coords = this.clientToCanvas(clientX, clientY);
    const deltaX = coords.x - this.dragStart.x;
    const deltaY = coords.y - this.dragStart.y;

    // Moving layer
    if (this.isDragging) {
      this.activeLayer.x = Math.round(this.initialLayerState.x + deltaX);
      this.activeLayer.y = Math.round(this.initialLayerState.y + deltaY);
      this.onLayerChange();
      this.updateSelectionBounds();
    }
    // Resizing layer via corner handles or rotate handle
    else if (this.isResizing) {
      if (this.activeHandle === 'rotate') {
        const angle = Math.atan2(coords.y - this.activeLayer.y, coords.x - this.activeLayer.x) * (180 / Math.PI);
        this.activeLayer.rotation = Math.round(angle);
      } else {
        const dist = Math.hypot(deltaX, deltaY);
        const sign = (this.activeHandle === 'se' || this.activeHandle === 'ne')
          ? (deltaX > 0 || deltaY > 0 ? 1 : -1)
          : (deltaX < 0 || deltaY < 0 ? 1 : -1);

        if (this.activeType === 'text') {
          const deltaSize = sign * (dist / 4);
          const newSize = Math.max(16, Math.min(140, Math.round(this.initialLayerState.fontSize + deltaSize)));
          this.activeLayer.fontSize = newSize;
        } else if (this.activeType === 'logo') {
          const deltaSize = sign * (dist / 2);
          const newSize = Math.max(40, Math.min(360, Math.round(this.initialLayerState.size + deltaSize)));
          this.activeLayer.size = newSize;
        }
      }
      this.onLayerChange();
      this.updateSelectionBounds();
    }
  }

  handlePointerUp() {
    this.isDragging = false;
    this.isResizing = false;
    this.isPanningCanvas = false;
    this.isPinchingCanvas = false;
    this.activeHandle = null;
  }
}
