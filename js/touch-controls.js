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

    // Snap Guides DOM elements
    this.snapGuideX = options.snapGuideX || null;
    this.snapGuideY = options.snapGuideY || null;
    this.snapBadgeX = options.snapBadgeX || null;
    this.snapBadgeY = options.snapBadgeY || null;

    // Layer state
    this.activeLayer = null;
    this.activeType = null; // 'text' | 'logo' | 'image'
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
    this.rafId = null;

    this.initEvents();
  }

  // Convert client viewport coordinates to logical canvas coordinates (e.g. 1080x...)
  clientToCanvas(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: 0, y: 0 };
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  // Convert logical canvas coordinates to Stage CSS pixels (relative to this.stage)
  canvasToClient(canvasX, canvasY, width, height) {
    const stageW = this.stage.offsetWidth || parseFloat(this.stage.style.width) || this.canvas.width;
    const stageH = this.stage.offsetHeight || parseFloat(this.stage.style.height) || this.canvas.height;
    const scaleX = stageW / this.canvas.width;
    const scaleY = stageH / this.canvas.height;

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

  scheduleTransform(animate = false) {
    if (animate) {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.onCanvasTransform(this.zoom, this.panX, this.panY, true);
      return;
    }
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.onCanvasTransform(this.zoom, this.panX, this.panY, false);
        this.rafId = null;
      });
    }
  }

  setZoomAndPan(zoom, panX = 0, panY = 0, animate = false) {
    this.zoom = Math.max(0.35, Math.min(3.0, zoom));
    this.panX = panX;
    this.panY = panY;
    this.scheduleTransform(animate);
  }

  resetView(animate = true) {
    this.setZoomAndPan(1.0, 0, 0, animate);
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
    this.selectionTag.textContent = type === 'image' ? (layer.name || 'Image Layer') : 'Text Layer';
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

    if (this.activeLayer.rotation) {
      this.selectionBox.style.transform = `rotate(${this.activeLayer.rotation}deg)`;
    } else {
      this.selectionBox.style.transform = 'none';
    }
  }

  // Keep handles in sync while dragging, including browsers that defer DOM layout
  // updates until after a touch event (notably iOS Safari).
  updateCachedDragBounds(nextX, nextY) {
    if (!this.initialBounds || !this.initialLayerState) return;

    this.cachedBounds = {
      ...this.initialBounds,
      left: this.initialBounds.left + (nextX - this.initialLayerState.x),
      top: this.initialBounds.top + (nextY - this.initialLayerState.y)
    };
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

        this.scheduleTransform(false);
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
    e.preventDefault();
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

  getLayerCenter() {
    if (!this.activeLayer) return { x: 0, y: 0 };
    if (this.activeType === 'image') {
      return { x: this.activeLayer.x, y: this.activeLayer.y };
    }
    const b = this.cachedBounds;
    if (b) {
      return {
        x: b.left + b.width / 2,
        y: b.top + b.height / 2
      };
    }
    return { x: this.activeLayer.x, y: this.activeLayer.y };
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
      this.initialBounds = this.cachedBounds ? { ...this.cachedBounds } : null;
      if (this.activeHandle === 'rotate') {
        const center = this.getLayerCenter();
        this.initialAngle = Math.atan2(coords.y - center.y, coords.x - center.x) * (180 / Math.PI);
        this.initialRotation = this.activeLayer.rotation || 0;
      }
      return;
    }

    // 2. Click inside current layer selection
    if (isSelectionBox && this.activeLayer) {
      this.isDragging = true;
      this.dragStart = coords;
      this.initialLayerState = { ...this.activeLayer };
      this.initialBounds = this.cachedBounds ? { ...this.cachedBounds } : null;
      return;
    }

    // 3. Click on stage/canvas elements (Hit-test layer)
    if (isStageOrCanvas) {
      const hit = this.onSelectLayer(coords.x, coords.y, targetEl);
      if (hit) {
        this.isDragging = true;
        this.dragStart = coords;
        this.initialLayerState = { ...hit.layer };
        this.initialBounds = this.cachedBounds ? { ...this.cachedBounds } : null;
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
      this.scheduleTransform(false);
      return;
    }

    if (!this.activeLayer) return;

    const coords = this.clientToCanvas(clientX, clientY);
    const deltaX = coords.x - this.dragStart.x;
    const deltaY = coords.y - this.dragStart.y;

    // Moving layer
    if (this.isDragging) {
      const rawX = Math.round(this.initialLayerState.x + deltaX);
      const rawY = Math.round(this.initialLayerState.y + deltaY);

      const snapped = this.calculateSnap(rawX, rawY);
      this.activeLayer.x = snapped.x;
      this.activeLayer.y = snapped.y;

      this.updateCachedDragBounds(snapped.x, snapped.y);
      this.updateSelectionBounds();
      this.onLayerChange();
    }
    // Resizing layer via corner handles or rotate handle
    else if (this.isResizing) {
      if (this.activeHandle === 'rotate') {
        const center = this.getLayerCenter();
        const currentAngle = Math.atan2(coords.y - center.y, coords.x - center.x) * (180 / Math.PI);
        let deltaAngle = currentAngle - this.initialAngle;
        let newRotation = Math.round((this.initialRotation + deltaAngle) % 360);
        if (newRotation > 180) newRotation -= 360;
        if (newRotation < -180) newRotation += 360;

        // Subtle magnetic snap near 0°, 90°, -90°, 180°
        if (Math.abs(newRotation) <= 4) newRotation = 0;
        else if (Math.abs(newRotation - 90) <= 4) newRotation = 90;
        else if (Math.abs(newRotation + 90) <= 4) newRotation = -90;
        else if (Math.abs(Math.abs(newRotation) - 180) <= 4) newRotation = 180;

        this.activeLayer.rotation = newRotation;
      } else {
        const dist = Math.hypot(deltaX, deltaY);
        const sign = (this.activeHandle === 'se' || this.activeHandle === 'ne')
          ? (deltaX > 0 || deltaY > 0 ? 1 : -1)
          : (deltaX < 0 || deltaY < 0 ? 1 : -1);

        if (this.activeType === 'text') {
          const deltaSize = sign * (dist / 4);
          const newSize = Math.max(16, Math.min(140, Math.round(this.initialLayerState.fontSize + deltaSize)));
          this.activeLayer.fontSize = newSize;
        } else if (this.activeType === 'image') {
          const deltaSize = sign * (dist / 2);
          const newSize = Math.max(40, Math.min(900, Math.round(this.initialLayerState.size + deltaSize)));
          this.activeLayer.size = newSize;
        }
      }
      this.onLayerChange();
      this.updateSelectionBounds();
    }
  }

  hideSnapGuides() {
    if (this.snapGuideX) this.snapGuideX.classList.add('hidden');
    if (this.snapGuideY) this.snapGuideY.classList.add('hidden');
  }

  updateSnapGuides(guideX, guideY) {
    if (this.snapGuideX) {
      if (guideX) {
        this.snapGuideX.style.left = `${guideX.percent}%`;
        if (this.snapBadgeX) this.snapBadgeX.textContent = guideX.label;
        this.snapGuideX.classList.remove('hidden');
      } else {
        this.snapGuideX.classList.add('hidden');
      }
    }

    if (this.snapGuideY) {
      if (guideY) {
        this.snapGuideY.style.top = `${guideY.percent}%`;
        if (this.snapBadgeY) this.snapBadgeY.textContent = guideY.label;
        this.snapGuideY.classList.remove('hidden');
      } else {
        this.snapGuideY.classList.add('hidden');
      }
    }
  }

  calculateSnap(nextX, nextY) {
    const canvasW = this.canvas.width;
    const canvasH = this.canvas.height;
    const centerX = canvasW / 2;
    const centerY = canvasH / 2;
    const margin = Math.round(canvasW * 0.05); // 5% safe margin (54px)
    const threshold = 18; // Snap magnetic radius in canvas pixels

    let snappedX = nextX;
    let snappedY = nextY;
    let guideX = null;
    let guideY = null;

    // Calculate layer bounds
    let boundsLeft, boundsRight, boundsTop, boundsBottom, itemCenterX, itemCenterY;

    if (this.activeType === 'image') {
      const b = this.cachedBounds;
      const w = b ? b.width : (this.activeLayer.size || 200);
      const h = b ? b.height : (this.activeLayer.size || 200);
      itemCenterX = nextX;
      itemCenterY = nextY;
      boundsLeft = nextX - w / 2;
      boundsRight = nextX + w / 2;
      boundsTop = nextY - h / 2;
      boundsBottom = nextY + h / 2;
    } else if (this.activeType === 'text') {
      const b = this.cachedBounds;
      const w = b ? b.width : 200;
      const h = b ? b.height : 60;
      const maxW = b ? b.maxLineWidth : w;
      const padding = this.activeLayer.isBadge ? 18 : 6;

      const align = this.activeLayer.align || 'center';
      if (align === 'center') {
        itemCenterX = nextX;
        boundsLeft = nextX - maxW / 2 - padding;
        boundsRight = nextX + maxW / 2 + padding;
      } else if (align === 'right') {
        itemCenterX = nextX - maxW / 2;
        boundsLeft = nextX - maxW - padding;
        boundsRight = nextX + padding;
      } else {
        itemCenterX = nextX + maxW / 2;
        boundsLeft = nextX - padding;
        boundsRight = nextX + maxW + padding;
      }

      boundsTop = nextY - padding;
      boundsBottom = nextY + h - padding;
      itemCenterY = nextY + h / 2 - padding;
    }

    // Horizontal snapping: Center -> Safe Margin -> Canvas Edge
    if (Math.abs(itemCenterX - centerX) <= threshold) {
      snappedX += (centerX - itemCenterX);
      guideX = { percent: 50, label: 'Center' };
    } else if (Math.abs(boundsLeft - margin) <= threshold) {
      snappedX += (margin - boundsLeft);
      guideX = { percent: (margin / canvasW) * 100, label: 'Safe Margin' };
    } else if (Math.abs(boundsRight - (canvasW - margin)) <= threshold) {
      snappedX += ((canvasW - margin) - boundsRight);
      guideX = { percent: ((canvasW - margin) / canvasW) * 100, label: 'Safe Margin' };
    } else if (Math.abs(boundsLeft - 0) <= threshold) {
      snappedX += (0 - boundsLeft);
      guideX = { percent: 0, label: 'Edge' };
    } else if (Math.abs(boundsRight - canvasW) <= threshold) {
      snappedX += (canvasW - boundsRight);
      guideX = { percent: 100, label: 'Edge' };
    }

    // Vertical snapping: Center -> Safe Margin -> Canvas Edge
    if (Math.abs(itemCenterY - centerY) <= threshold) {
      snappedY += (centerY - itemCenterY);
      guideY = { percent: 50, label: 'Center' };
    } else if (Math.abs(boundsTop - margin) <= threshold) {
      snappedY += (margin - boundsTop);
      guideY = { percent: (margin / canvasH) * 100, label: 'Safe Margin' };
    } else if (Math.abs(boundsBottom - (canvasH - margin)) <= threshold) {
      snappedY += ((canvasH - margin) - boundsBottom);
      guideY = { percent: ((canvasH - margin) / canvasH) * 100, label: 'Safe Margin' };
    } else if (Math.abs(boundsTop - 0) <= threshold) {
      snappedY += (0 - boundsTop);
      guideY = { percent: 0, label: 'Edge' };
    } else if (Math.abs(boundsBottom - canvasH) <= threshold) {
      snappedY += (canvasH - boundsBottom);
      guideY = { percent: 100, label: 'Edge' };
    }

    this.updateSnapGuides(guideX, guideY);

    return { x: Math.round(snappedX), y: Math.round(snappedY) };
  }

  handlePointerUp() {
    this.isDragging = false;
    this.isResizing = false;
    this.isPanningCanvas = false;
    this.isPinchingCanvas = false;
    this.activeHandle = null;
    this.hideSnapGuides();
  }
}
