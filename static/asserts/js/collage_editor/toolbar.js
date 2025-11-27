(async function initToolbar() {
  const container = document.getElementById('toolbar');
  if (!container) return;

  const toolbar = container.querySelector('.ce-toolbar');
  if (!toolbar) return;

  toolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'export') {
      exportCanvasPNG();
    }
    if (action === 'save') {
      if (window.CESave?.exportStateAsJSON) window.CESave.exportStateAsJSON();
      return;
    }
    if (action === 'save-to-server') {
      if (window.CESave?.exportStateAsJSON) {
        // 获取JSON数据
        const jsonData = window.CESave.getJSONData();
        if (!jsonData) {
          alert('没有可保存的数据');
          return;
        }

        // 发送到服务器
        // 使用pageType来命名文件
        const pageType = window.pageType || 'index';
        const filePath = `/media/config/${pageType}.json`;

        fetch('/api/save_collage/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
          },
          body: JSON.stringify({
            data: jsonData,
            path: filePath
          })
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('保存失败');
          }
          return response.json();
        })
        .then(result => {
          alert('保存成功！');
        })
        .catch(error => {
          console.error('保存错误:', error);
          alert('保存失败: ' + error.message);
        });
      }
      return;
    }
    if (action === 'load') {
      const fileInput = document.getElementById('load-json-input');
      if (fileInput) fileInput.click();
      return;
    }
    if (action === 'set-canvas-size') {
      const sel = container.querySelector('#canvas-size-presets');
      let width = null, height = null;
      if (sel && sel.value && sel.value !== 'auto'){
        const parts = sel.value.split('x');
        if (parts.length === 2){
          width = parseInt(parts[0],10);
          height = parseInt(parts[1],10);
        }
      }
      dispatchAction('set-canvas-size', { width, height });
      return;
    }
    if (action === 'set-splitter-config') {
      const wInp = container.querySelector('#splitter-width');
      const cInp = container.querySelector('#splitter-color');
      const width = wInp && wInp.value ? parseInt(wInp.value,10) : null;
      const color = cInp && cInp.value ? cInp.value : null;
      dispatchAction('set-splitter-config', { width, color });
      return;
    }
    if (action === 'initialize') {
      // 显示确认对话框
      if (confirm('确定要初始化画布吗？这将清空所有内容并重置为当前尺寸设置。')) {
        // 获取当前画布尺寸设置
        const sel = container.querySelector('#canvas-size-presets');
        let width = null, height = null;
        if (sel && sel.value && sel.value !== 'auto') {
          const parts = sel.value.split('x');
          if (parts.length === 2) {
            width = parseInt(parts[0], 10);
            height = parseInt(parts[1], 10);
          }
        }

        // 清空画布并重置区域ID
        if (window.CERegions) {
          // 获取当前画布元素
          const canvas = document.getElementById('canvas');
          if (canvas) {
            // 创建新的根区域
            window.CERegions.createRoot();

            // 应用画布尺寸
            if (width && height) {
              dispatchAction('set-canvas-size', { width, height });
            }

            // 显示初始化成功消息
            alert('画布已成功初始化！');
          }
        } else {
          alert('无法初始化画布，请刷新页面后重试。');
        }
      }
      return;
    }
    dispatchAction(action);
  });

  async function exportCanvasPNG() {
    const canvasEl = document.createElement('canvas');
    // use bounding box of canvas
    const canvasRoot = document.getElementById('canvas');
    const box = canvasRoot.getBoundingClientRect();

    // 获取缩放比例
    const cs = window.getComputedStyle(canvasRoot);
    const scale = parseFloat(cs.getPropertyValue('--canvas-scale')) || 1;

    // 计算实际尺寸（不受缩放影响）
    canvasEl.width = Math.max(1, Math.floor(box.width / scale));
    canvasEl.height = Math.max(1, Math.floor(box.height / scale));
    const ctx = canvasEl.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

    // render recursively by walking DOM of canvasRoot
    await drawElementToCanvas(canvasRoot, ctx, 0, 0, canvasEl.width, canvasEl.height);

    // 转换为Blob并上传到服务器
    canvasEl.toBlob(async (blob) => {
      // 获取当前页面类型
      const pageType = window.pageType || 'default';

      // 创建FormData对象
      const formData = new FormData();
      formData.append('image', blob, `${pageType}.png`);
      formData.append('page_type', pageType); // 添加页面类型参数

      try {
        // 上传到服务器
        const response = await fetch('/api/upload_collage_image/', {
          method: 'POST',
          headers: {
            'X-CSRFToken': getCookie('csrftoken')
          },
          body: formData
        });
        

        if (response.ok) {
          const result = await response.json();
          console.log('图片上传成功:', result);
          alert('图片已成功上传到服务器！');
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('图片上传失败:', response.statusText, errorData);
          alert(`图片上传失败: ${errorData.message || response.statusText}`);
        }
      } catch (error) {
        console.error('上传过程中出错:', error);
        alert('上传过程中出错，请重试！');
      }
    });

    // 仍然在新标签页中打开图片
    const url = canvasEl.toDataURL('image/png');
    const w = window.open('');
    w.document.write(`<img src="${url}" style="max-width:100%;">`);
  }

  async function drawElementToCanvas(el, ctx, offsetX, offsetY, w, h) {
    // if it's a simple region with image draw it; else recurse into children
    if (el.classList.contains('region') && el.dataset.regionId) {
      const id = el.dataset.regionId;
      const meta = window.CERegions.regionsMap.get(id);
      const rect = el.getBoundingClientRect();
      const parentRect = document.getElementById('canvas').getBoundingClientRect();

      // 获取缩放比例
      const canvasRoot = document.getElementById('canvas');
      const cs = window.getComputedStyle(canvasRoot);
      const scale = parseFloat(cs.getPropertyValue('--canvas-scale')) || 1;

      // 计算实际位置和尺寸（不受缩放影响）
      const x = Math.round((rect.left - parentRect.left) / scale);
      const y = Math.round((rect.top - parentRect.top) / scale);
      const width = Math.round(rect.width / scale);
      const height = Math.round(rect.height / scale);

      // clip to region to prevent images from overflowing into neighbors
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.clip();

      // draw background (inside clip)
      ctx.fillStyle = '#efefef';
      ctx.fillRect(x, y, width, height);

      if (meta && meta.image) {
        const img = await loadImage(meta.image.src);
        // If there's a transform-based crop (translate/scale) use it
        if (meta.crop && (meta.crop.scale !== undefined)) {
          const imgScale = meta.crop.scale || 1;
          const tx = meta.crop.x || 0;
          const ty = meta.crop.y || 0;
          // move origin to region top-left, then apply user's transform
          ctx.save();
          ctx.translate(x, y);
          ctx.transform(imgScale, 0, 0, imgScale, tx, ty);
          ctx.drawImage(img, 0, 0);
          ctx.restore();
        } else {
          // fallback: draw respecting fillMode (cover / contain)
          const iw = img.naturalWidth || img.width;
          const ih = img.naturalHeight || img.height;
          const rw = width;
          const rh = height;
          const sx = rw / iw;
          const sy = rh / ih;
          let imgScale;
          if (meta.fillMode === 'contain') {
            imgScale = Math.min(sx, sy);
          } else {
            // default to cover
            imgScale = Math.max(sx, sy);
          }
          const dw = iw * imgScale;
          const dh = ih * imgScale;
          const ox = Math.round(x + (rw - dw) / 2);
          const oy = Math.round(y + (rh - dh) / 2);
          ctx.drawImage(img, ox, oy, Math.round(dw), Math.round(dh));
        }
      }

      ctx.restore();
    } else if (el.classList.contains('splitter')) {
      // draw splitter bar into export canvas: entire line should have the visual color
      const rect = el.getBoundingClientRect();
      const parentRect = document.getElementById('canvas').getBoundingClientRect();
      const canvasRoot = document.getElementById('canvas');
      const cs = window.getComputedStyle(canvasRoot);

      // 获取缩放比例
      const scale = parseFloat(cs.getPropertyValue('--canvas-scale')) || 1;

      // visual width/thickness as set in --splitter-width
      let vis = cs.getPropertyValue('--splitter-width') || '';
      vis = vis.trim();
      let visPx = 0;
      if (vis) {
        if (vis.endsWith('px')) visPx = parseFloat(vis);
        else visPx = parseFloat(vis);
      } else {
        // fallback to the element's dimension if var not set
        visPx = (rect.width >= rect.height) ? rect.width : rect.height;
      }
      // if visual width is zero, don't draw
      if (!visPx) return;

      // determine if vertical or horizontal split, and draw the entire line with visual thickness
      const isVertical = rect.width < rect.height; // vertical splitter is narrow, tall
      const sx = Math.round((rect.left - parentRect.left) / scale);
      const sy = Math.round((rect.top - parentRect.top) / scale);
      let sw, sh;
      if (isVertical) {
        // vertical line: width = visual thickness, height = full splitter height
        sw = Math.round(visPx);
        sh = Math.round(rect.height / scale);
        // center horizontally
        const cx = Math.round(sx + (rect.width / scale - visPx) / 2);
        ctx.fillStyle = cs.getPropertyValue('--splitter-color')?.trim() || 'rgba(16,24,40,0.06)';
        ctx.fillRect(cx, sy, sw, sh);
      } else {
        // horizontal line: width = full splitter width, height = visual thickness
        sw = Math.round(rect.width / scale);
        sh = Math.round(visPx);
        // center vertically
        const cy = Math.round(sy + (rect.height / scale - visPx) / 2);
        ctx.fillStyle = cs.getPropertyValue('--splitter-color')?.trim() || 'rgba(16,24,40,0.06)';
        ctx.fillRect(sx, cy, sw, sh);
      }
    } else {
      for (const child of Array.from(el.children)) {
        await drawElementToCanvas(child, ctx, offsetX, offsetY, w, h);
      }
    }
  }

  function loadImage(src) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });
  }

  // handle JSON file load
  const fileInput = document.getElementById('load-json-input');
  if (fileInput) {
    fileInput.addEventListener('change', async (e)=>{
      if (!e.target.files || !e.target.files[0]) return;
      try {
        await window.CESave?.importStateFromJSON(e.target.files[0]);
        alert('项目已加载');
      } catch(err){
        alert(`加载失败: ${err.message}`);
      }
      e.target.value = '';
    });
  }

  // make load button clickable
  const loadBtn = document.querySelector('label.ce-file span[style*="cursor"]')?.parentElement;
  if (loadBtn?.querySelector('#load-json-input')){
    loadBtn.addEventListener('click', ()=>{
      document.getElementById('load-json-input')?.click();
    });
  }


  toolbar.addEventListener('change', (e) => {
    const target = e.target;
    const action = target.dataset.action;
    if (!action) return;
    if (action === 'upload' && target.files && target.files[0]) {
      const file = target.files[0];
      dispatchAction('upload', { file });
      target.value = '';
    } else if (action === 'fill-mode') {
      dispatchAction('fill-mode', { mode: target.value });
    }
  });

  function dispatchAction(action, detail = {}) {
    document.dispatchEvent(new CustomEvent('ce-toolbar-action', { detail: { action, ...detail } }));
  }

  // 获取CSRF token
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
})();