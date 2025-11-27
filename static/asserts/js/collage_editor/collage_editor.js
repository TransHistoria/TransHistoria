// 应用逻辑：连接 toolbar -> regions -> crop modal -> 导出

var allNodes = [];

(function () {
  document.addEventListener('DOMContentLoaded', () => {
    // Ensure sensible defaults for splitter appearance so it's not stuck at 0
    const canvasEl = document.getElementById('canvas');
    if (canvasEl) {
      const cs = window.getComputedStyle(canvasEl);
      const cur = cs.getPropertyValue('--splitter-width')?.trim();
      if (!cur) {
        canvasEl.style.setProperty('--splitter-width', '8px');
      }
      const curHit = cs.getPropertyValue('--splitter-hit-size')?.trim();
      if (!curHit) canvasEl.style.setProperty('--splitter-hit-size', '8px');
      const curHandle = cs.getPropertyValue('--splitter-handle-display')?.trim();
      if (!curHandle) canvasEl.style.setProperty('--splitter-handle-display', 'block');
    }
    fetch('/api/get_historynodes/')
      .then(response => response.json())
      .then(data => {
        allNodes = data;
        console.log('History nodes loaded:', data);
      })
      .catch(error => {
        console.error('Error loading history nodes:', error);
      });
  });

  // Canvas height controls (increase/decrease by half)
  function freezeLayoutPixels() {
    const canvasEl = document.getElementById('canvas');
    if (!canvasEl) return;
    const canvasRect = canvasEl.getBoundingClientRect();
    const root = canvasEl.children[0];
    if (!root) return;
    function recurse(el) {
      if (!el) return;
      if (el.classList && el.classList.contains('region')) {
        const r = el.getBoundingClientRect();
        // Lock both width and height in pixels to preserve splitter positions
        el.style.flex = `0 0 ${Math.round(r.height)}px`;
        el.style.width = `${Math.round(r.width)}px`;
        el.style.height = `${Math.round(r.height)}px`;
        return;
      }
      if (el.classList && el.classList.contains('split')) {
        const isVertical = el.classList.contains('vertical');
        for (const ch of Array.from(el.children)) {
          if (!ch) continue;
          if (ch.classList && ch.classList.contains('splitter')) continue;
          const r = ch.getBoundingClientRect();
          if (isVertical) {
            ch.style.flex = `0 0 ${Math.round(r.width)}px`;
            ch.style.width = `${Math.round(r.width)}px`;
            ch.style.height = `${Math.round(r.height)}px`;
          } else {
            ch.style.flex = `0 0 ${Math.round(r.height)}px`;
            ch.style.height = `${Math.round(r.height)}px`;
            ch.style.width = `${Math.round(r.width)}px`;
          }
          recurse(ch);
        }
      }
    }
    recurse(root);
  }

  function adjustCanvasHeight(delta) {
    const canvasEl = document.getElementById('canvas');
    if (!canvasEl) return;
    // Freeze current layout in pixels so splitters remain at fixed positions
    try { freezeLayoutPixels(); } catch (e) { }
    // prefer explicit style height if set, else use layout height
    let cur = null;
    if (canvasEl.style && canvasEl.style.height) cur = parseInt(canvasEl.style.height, 10);
    if (!cur || Number.isNaN(cur) || cur <= 0) {
      const rect = canvasEl.getBoundingClientRect();
      cur = Math.max(1, Math.round(rect.height));
    }
    let next = Math.max(1, Math.round(cur + delta));
    // dispatch set-canvas-size with only height (width null)
    document.dispatchEvent(new CustomEvent('ce-toolbar-action', { detail: { action: 'set-canvas-size', width: null, height: next } }));
  }

  // wire up control buttons if present
  function initCanvasControls() {
    const inc = document.getElementById('canvas-increase');
    const dec = document.getElementById('canvas-decrease');
    const zoomSlider = document.getElementById('canvas-zoom');
    const zoomPercent = document.getElementById('zoom-percent');
    const zoomFitBtn = document.getElementById('canvas-zoom-fit');

    if (inc) inc.addEventListener('click', () => {
      const canvasEl = document.getElementById('canvas');
      if (!canvasEl) return;
      const h = Math.max(1, Math.round(canvasEl.getBoundingClientRect().height));
      adjustCanvasHeight(Math.round(h / 2));
    });
    if (dec) dec.addEventListener('click', () => {
      const canvasEl = document.getElementById('canvas');
      if (!canvasEl) return;
      const h = Math.max(1, Math.round(canvasEl.getBoundingClientRect().height));
      adjustCanvasHeight(-Math.round(h / 2));
    });

    // Zoom control
    if (zoomSlider) {
      zoomSlider.addEventListener('input', (e) => {
        const scale = parseInt(e.target.value, 10) / 100;
        setCanvasZoom(scale);
        if (zoomPercent) zoomPercent.textContent = `${e.target.value}%`;
        localStorage.setItem('canvas-zoom', e.target.value);
      });
      // Restore zoom from localStorage
      const savedZoom = localStorage.getItem('canvas-zoom');
      if (savedZoom) {
        zoomSlider.value = savedZoom;
        const scale = parseInt(savedZoom, 10) / 100;
        setCanvasZoom(scale);
        if (zoomPercent) zoomPercent.textContent = `${savedZoom}%`;
      }
    }

    // Zoom fit button
    if (zoomFitBtn) {
      zoomFitBtn.addEventListener('click', () => {
        const canvasEl = document.getElementById('canvas');
        const wrapper = document.getElementById('canvas-wrapper');
        if (!canvasEl || !wrapper) return;

        // Get the canvas actual size
        const canvasRect = canvasEl.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        
        // Calculate fit scale
        const scaleX = (wrapperRect.width - 24) / canvasRect.width;
        const scaleY = (wrapperRect.height - 24) / canvasRect.height;
        const fitScale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%

        const zoomPercent = Math.round(fitScale * 100);
        if (zoomSlider) {
          zoomSlider.value = zoomPercent;
          document.getElementById('zoom-percent').textContent = `${zoomPercent}%`;
          setCanvasZoom(fitScale);
          localStorage.setItem('canvas-zoom', zoomPercent);
        }
      });
    }
  }

  function setCanvasZoom(scale) {
    const canvasEl = document.getElementById('canvas');
    if (!canvasEl) return;
    canvasEl.style.setProperty('--canvas-scale', scale);
  }
  // init controls after DOM ready
  try { window.addEventListener('load', initCanvasControls); } catch (e) { setTimeout(initCanvasControls, 300); }
  // small on-screen debug widget to show current splitter vars (helpful when devtools unavailable)
  function ensureSplitterDebug() {
    let dbg = document.getElementById('splitter-debug');
    const root = document.getElementById('app');
    if (!root) return null;
    if (!dbg) {
      dbg = document.createElement('div');
      dbg.id = 'splitter-debug';
      dbg.style.position = 'fixed';
      dbg.style.right = '12px';
      dbg.style.bottom = '12px';
      dbg.style.background = 'rgba(0,0,0,0.6)';
      dbg.style.color = '#fff';
      dbg.style.padding = '6px 8px';
      dbg.style.fontSize = '12px';
      dbg.style.borderRadius = '6px';
      dbg.style.zIndex = 9999;
      dbg.style.pointerEvents = 'none';
      root.appendChild(dbg);
    }
    return dbg;
  }
  function updateSplitterDebug() {
    const dbg = ensureSplitterDebug();
    if (!dbg) return;
    const canvasEl = document.getElementById('canvas');
    if (!canvasEl) return;
    try {
      const cs = window.getComputedStyle(canvasEl);
      const w = cs.getPropertyValue('--splitter-width')?.trim() || '(unset)';
      const hit = cs.getPropertyValue('--splitter-hit-size')?.trim() || '(unset)';
      const handle = cs.getPropertyValue('--splitter-handle-display')?.trim() || '(unset)';
      dbg.textContent = `splitter: ${w} hit:${hit} handle:${handle}`;
    } catch (e) { dbg.textContent = 'splitter: (error)'; }
  }

  // hidden file input for double-click and toolbar uploads
  let fileInputEl = null;
  function getFileInput() {
    if (!fileInputEl) {
      fileInputEl = document.createElement('input');
      fileInputEl.type = 'file';
      fileInputEl.accept = 'image/*';
      fileInputEl.style.display = 'none';
      document.body.appendChild(fileInputEl);
      fileInputEl.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          document.dispatchEvent(new CustomEvent('ce-toolbar-action', {
            detail: { action: 'upload', file }
          }));
        }
        e.target.value = ''; // reset
      });
    }
    return fileInputEl;
  }

  // handle double-click on region to upload image
  document.addEventListener('ce-region-dblclick', (e) => {
    const { id } = e.detail;
    if (id) window.CERegions.selectRegion(id);
    getFileInput().click();
  });


  document.addEventListener('ce-toolbar-action', async (e) => {
    const { action, file, mode, width, height, color } = e.detail;
    const sel = window.CERegions.selectedId();
    if (action === 'split-vertical') {
      if (sel) window.CERegions.splitRegion(sel, 'vertical');
    } else if (action === 'split-horizontal') {
      if (sel) window.CERegions.splitRegion(sel, 'horizontal');
    } else if (action === 'upload') {
      if (!sel) return alert('请先选择一个区域');
      const url = await readFileAsDataURL(file);
      window.CERegions.attachImageToRegion(sel, url, 'cover');
    } else if (action === 'fill-mode') {
      if (!sel) return;
      const meta = window.CERegions.regionsMap.get(sel);
      if (meta) { meta.fillMode = mode; if (meta.imgEl) meta.imgEl.style.objectFit = mode; }
    } else if (action === 'remove') {
      if (!sel) return;
      window.CERegions.removeImageFromRegion(sel);
    } else if (action === 'delete-region') {
      if (!sel) return;
      if (!confirm('确认删除该区域？此操作会合并/移除该区域。')) return;
      window.CERegions.deleteRegion(sel);
    } else if (action === 'set-canvas-size') {
      const canvasEl = document.getElementById('canvas');
      if (!canvasEl) return;
      // Apply width/height in pixels. If either is missing, only set the provided dimension.
      if (width) canvasEl.style.width = `${parseInt(width, 10)}px`;
      if (height) canvasEl.style.height = `${parseInt(height, 10)}px`;
      // set flex to fixed so layout doesn't stretch the canvas
      canvasEl.style.flex = '0 0 auto';
      // center canvas horizontally
      canvasEl.style.margin = '12px auto';
    } else if (action === 'set-splitter-config') {
      const canvasEl = document.getElementById('canvas');
      if (!canvasEl) return;
      // DEBUG: log incoming splitter config for troubleshooting
      try { console.debug('ce-toolbar-action set-splitter-config received', { width, color }); } catch (e) { }
      const minHit = 8; // minimum interactive hit area in px
      // Normalize and validate provided width. Accept numbers or numeric-strings.
      let vis = null;
      if (width !== undefined && width !== null) {
        const n = Number(width);
        if (Number.isFinite(n)) vis = Math.max(0, Math.round(n));
      }
      let hit = null;
      if (vis !== null) {
        // by default hit area equals visual; expand for very thin visuals or invisible handle
        hit = vis;
        if (vis < 5) hit = minHit; // visual widths under 5px get expanded hit area
        if (vis === 0) hit = minHit; // invisible visual still needs a hit area
      }
      // Apply CSS vars only when we have valid numbers to avoid writing 'nullpx' or 'NaNpx'
      if (vis !== null) canvasEl.style.setProperty('--splitter-width', `${vis}px`);
      if (hit !== null) canvasEl.style.setProperty('--splitter-hit-size', `${hit}px`);
      if (color) canvasEl.style.setProperty('--splitter-color', color);
      // control visual handle display: hide when visual width explicitly zero
      if (vis === 0) canvasEl.style.setProperty('--splitter-handle-display', 'none');
      else if (vis !== null) canvasEl.style.setProperty('--splitter-handle-display', 'block');
      // DEBUG: read back computed CSS vars
      try {
        const cs = window.getComputedStyle(canvasEl);
        console.debug('applied-splitter-vars', {
          splitterWidth: cs.getPropertyValue('--splitter-width')?.trim(),
          splitterHit: cs.getPropertyValue('--splitter-hit-size')?.trim(),
          splitterHandleDisplay: cs.getPropertyValue('--splitter-handle-display')?.trim(),
          splitterColor: cs.getPropertyValue('--splitter-color')?.trim()
        });
      } catch (e) { }
      // update on-screen debug widget
      try { updateSplitterDebug(); } catch (e) { }
    }
  });

  function readFileAsDataURL(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
  }
})();