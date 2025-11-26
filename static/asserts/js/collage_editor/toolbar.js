(async function initToolbar() {
  const container = document.getElementById('toolbar');
  if (!container) return;

  const toolbar = container.querySelector('.ce-toolbar');
  if (!toolbar) return;

  toolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'upload') return;
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