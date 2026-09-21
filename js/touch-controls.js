/* ==========================================================================
   StudioPost — Direct Canvas Touch & Handle Controls
   Enables mobile drag, pinch, corner handle resize, and selection outlines.
   ========================================================================== */

export class TouchControls {
  constructor(canvasStage, previewCanvas, selectionBox, selectionTag, onLayerChange, onSelectLayer) {
    this.stage = canvasStage;
    this.canvas = previewCanvas;
    this.selectionBox = selectionBox;
    this.selectionTag = selectionTag;
    this.onLayerChange = onLayerChange;
    this.onSelectLayer = onSelectLayer;

    this.activeLayer = null;
    this.activeType = null; // 'text' | 'logo'
    this.isDragging = false;
    this.isResizing = false;
    this.activeHandle = null;

    this.dragStart = { x: 0, y: 0 };
    this.initialLayerState = null;
    this.initialDistance = 0; // For pinch gesture

    this.initEvents();
  }

  // Convert client viewport coordinates to logical canvas coordinates (1080x...)
  clientToCanvas(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  // Convert logical canvas coordinates to screen CSS coordinates for selection box
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
    // Stage touch & mouse start
    this.stage.addEventListener('mousedown', (e) => this.handlePointerDown(e));
    this.stage.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });

    // Window move & end
    window.addEventListener('mousemove', (e) => this.handlePointerMove(e));
    window.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });

    window.addEventListener('mouseup', () => this.handlePointerUp());
    window.addEventListener('touchend', () => this.handlePointerUp());

    // Window resize observer to update selection bounds when screen or canvas resizes
    window.addEventListener('resize', () => {
      if (this.activeLayer) this.updateSelectionBounds();
    });
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

  handleTouchStart(e) {
    if (e.touches.length === 2 && this.activeLayer) {
      // 2-finger pinch gesture
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.initialDistance = Math.hypot(dx, dy);
      this.initialLayerState = { ...this.activeLayer };
      return;
    }

    if (e.touches.length === 1) {
      this.handlePointerDown(e.touches[0]);
    }
  }

  handleTouchMove(e) {
    if (e.touches.length === 2 && this.activeLayer && this.initialDistance > 0) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / this.initialDistance;

      if (this.activeType === 'text') {
        const baseSize = this.initialLayerState.fontSize || 54;
        this.activeLayer.fontSize = Math.round(Math.max(16, Math.min(140, baseSize * ratio)));
      } else if (this.activeType === 'logo') {
        const baseSize = this.initialLayerState.size || 120;
        this.activeLayer.size = Math.round(Math.max(40, Math.min(360, baseSize * ratio)));
      }
      this.onLayerChange();
      return;
    }

    if (e.touches.length === 1 && (this.isDragging || this.isResizing)) {
      e.preventDefault();
      this.handlePointerMove(e.touches[0]);
    }
  }

  handlePointerDown(e) {
    const handleEl = e.target.closest('.handle, .handle-rotate');
    const isSelectionBox = e.target.closest('#selectionBox');

    const coords = this.clientToCanvas(e.clientX, e.clientY);

    // If clicking a resize or rotate handle
    if (handleEl && this.activeLayer) {
      this.isResizing = true;
      this.activeHandle = handleEl.dataset.handle;
      this.dragStart = coords;
      this.initialLayerState = { ...this.activeLayer };
      return;
    }

    // If clicking inside current selection box
    if (isSelectionBox && this.activeLayer) {
      this.isDragging = true;
      this.dragStart = coords;
      this.initialLayerState = { ...this.activeLayer };
      return;
    }

    // Direct Canvas hit-testing: Find which layer user tapped
    const hitResult = this.onSelectLayer(coords.x, coords.y);
    if (hitResult) {
      this.isDragging = true;
      this.dragStart = coords;
      this.initialLayerState = { ...hitResult.layer };
    }
  }

  handlePointerMove(e) {
    if (!this.activeLayer) return;

    const coords = this.clientToCanvas(e.clientX, e.clientY);
    const deltaX = coords.x - this.dragStart.x;
    const deltaY = coords.y - this.dragStart.y;

    if (this.isDragging) {
      this.activeLayer.x = Math.round(this.initialLayerState.x + deltaX);
      this.activeLayer.y = Math.round(this.initialLayerState.y + deltaY);
      this.onLayerChange();
    } else if (this.isResizing) {
      if (this.activeHandle === 'rotate') {
        // Calculate angle from center
        const angle = Math.atan2(coords.y - this.activeLayer.y, coords.x - this.activeLayer.x) * (180 / Math.PI);
        this.activeLayer.rotation = Math.round(angle);
      } else {
        // Corner resize handles
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
    }
  }

  handlePointerUp() {
    this.isDragging = false;
    this.isResizing = false;
    this.activeHandle = null;
    this.initialDistance = 0;
  }
}
