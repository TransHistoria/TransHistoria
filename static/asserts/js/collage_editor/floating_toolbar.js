var lastFilterTag = '全部标签';

// 浮动工具栏事件处理
(async function initFloatingToolbar() {
    const container = document.getElementById('floating-toolbar');
    if (!container) return;

    const floatingToolbar = container.querySelector('.ce-floating-toolbar');
    const collapseBtn = container.querySelector('#floating-collapse-btn');

    // 最小化/展开功能
    if (collapseBtn) {
        collapseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            floatingToolbar?.classList.toggle('collapsed');
            // 保存展开/折叠状态到localStorage
            const isCollapsed = floatingToolbar?.classList.contains('collapsed');
            localStorage.setItem('floating-toolbar-collapsed', isCollapsed);
        });
    }

    // 点击显示的工具栏标签也能展开
    if (floatingToolbar) {
        floatingToolbar.addEventListener('click', (e) => {
            // 如果点击了::after伪元素内容区域（难以直接检测），检查是否collapsed且点击在特定区域
            if (floatingToolbar.classList.contains('collapsed') && !e.target.closest('[data-action]') && !e.target.closest('.floating-collapse-btn')) {
                floatingToolbar.classList.remove('collapsed');
                localStorage.setItem('floating-toolbar-collapsed', false);
            }
        });
    }

    // 从localStorage恢复展开/折叠状态
    const wasCollapsed = localStorage.getItem('floating-toolbar-collapsed') === 'true';
    if (wasCollapsed && floatingToolbar) {
        floatingToolbar.classList.add('collapsed');
    }

    // 事件委托处理按钮点击
    if (floatingToolbar) {
        floatingToolbar.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;

            const action = btn.dataset.action;

            // 处理特殊情况
            if (action === 'upload') return;

            if (action === 'save') {
                if (window.CESave?.exportStateAsJSON) window.CESave.exportStateAsJSON();
                return;
            }

            if (action === 'set-splitter-config') {
                const wInp = container.querySelector('#splitter-width');
                const cInp = container.querySelector('#splitter-color');
                const width = wInp && wInp.value ? parseInt(wInp.value, 10) : null;
                const color = cInp && cInp.value ? cInp.value : null;

                if (width === null && color === null) {
                    alert('请输入分割线宽度或选择颜色');
                    return;
                }

                dispatchAction('set-splitter-config', { width, color });
                return;
            }

            if (action === 'choose-node') {
                showNodePicker();
                return;
            }

            dispatchAction(action);
        });
    }

    // 处理文件输入变化
    if (floatingToolbar) {
        floatingToolbar.addEventListener('change', (e) => {
            const target = e.target;
            const action = target.dataset.action;

            if (!action) return;

            if (action === 'upload' && target.files && target.files[0]) {
                const file = target.files[0];
                dispatchAction('upload', { file });
                target.value = '';
            }
        });
    }

    // 处理加载JSON文件
    const loadJsonInput = container.querySelector('#load-json-input');
    if (loadJsonInput) {
        loadJsonInput.addEventListener('change', async (e) => {
            if (!e.target.files || !e.target.files[0]) return;
            try {
                await window.CESave?.importStateFromJSON(e.target.files[0]);
                alert('项目已加载');
            } catch (err) {
                alert(`加载失败: ${err.message}`);
            }
            e.target.value = '';
        });
    }

    // 使加载按钮可点击
    const loadFileLabels = container.querySelectorAll('.floating-file-btn');
    loadFileLabels.forEach(label => {
        if (label.querySelector('input[accept=".json"]')) {
            label.addEventListener('click', () => {
                label.querySelector('input[accept=".json"]')?.click();
            });
        }
    });

    // 上传按钮处理
    const uploadLabel = container.querySelector('.floating-file-btn input[accept="image/*"]');
    if (uploadLabel?.parentElement) {
        uploadLabel.parentElement.addEventListener('click', () => {
            uploadLabel.click();
        });
    }

    function dispatchAction(action, detail = {}) {
        document.dispatchEvent(new CustomEvent('ce-toolbar-action', { detail: { action, ...detail } }));
    }

    // 节点选择器（复用collage_editor.js中的showNodePicker）
    function showNodePicker() {
        // 检查是否已有模态框
        let modal = document.getElementById('node-picker-modal');
        if (modal) {
            modal.remove();
        }

        const modal_el = document.createElement('div');
        modal_el.id = 'node-picker-modal';
        modal_el.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        padding: 20px;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 600px;
        width: 100%;
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
        max-height: 80vh;
        overflow-y: auto;
        animation: slideInUp 0.3s ease;
        `;

        const title = document.createElement('h2');
        title.textContent = '选择节点';
        title.style.cssText = 'margin: 0 0 16px 0; color: #333; font-size: 18px;';
        content.appendChild(title);

        // 筛选和排序控制区域
        const controlsContainer = document.createElement('div');
        controlsContainer.style.cssText = 'display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;';

        // 筛选控制
        const filterContainer = document.createElement('div');
        filterContainer.style.cssText = 'flex: 1; min-width: 200px;';

        const filterLabel = document.createElement('label');
        filterLabel.textContent = '筛选标签:';
        filterLabel.style.cssText = 'display: block; margin-bottom: 6px; font-weight: 600; color: #666; font-size: 14px;';
        filterContainer.appendChild(filterLabel);

        const filterSelect = document.createElement('select');
        filterSelect.style.cssText = `
        width: 100%;
        padding: 8px;
        border: 1px solid #e6eef6;
        border-radius: 6px;
        font-size: 14px;
        box-sizing: border-box;
        `;
        filterSelect.innerHTML = `<option value="">全部标签</option>`;

        // 收集所有标签
        const allTags = new Set();
        if (typeof allNodes !== 'undefined' && allNodes.length > 0) {
            allNodes.forEach(n => {
                if (n.tag) allTags.add(n.tag);
            });
        }

        // 添加标签选项
        Array.from(allTags).sort().forEach(tag => {
            const opt = document.createElement('option');
            opt.value = tag;
            opt.textContent = tag;
            filterSelect.appendChild(opt);
        });

        // 选择上次的标签
        if (lastFilterTag) {
            filterSelect.value = lastFilterTag;
        }

        filterContainer.appendChild(filterSelect);
        controlsContainer.appendChild(filterContainer);

        // 排序控制
        const sortContainer = document.createElement('div');
        sortContainer.style.cssText = 'flex: 1; min-width: 200px;';

        const sortLabel = document.createElement('label');
        sortLabel.textContent = '排序方式:';
        sortLabel.style.cssText = 'display: block; margin-bottom: 6px; font-weight: 600; color: #666; font-size: 14px;';
        sortContainer.appendChild(sortLabel);

        const sortSelect = document.createElement('select');
        sortSelect.style.cssText = `
        width: 100%;
        padding: 8px;
        border: 1px solid #e6eef6;
        border-radius: 6px;
        font-size: 14px;
        box-sizing: border-box;
        `;
        sortSelect.innerHTML = `
        <option value="name-asc">名称 (A-Z)</option>
        <option value="name-desc">名称 (Z-A)</option>
        <option value="time-asc">时间 (旧-新)</option>
        <option value="time-desc">时间 (新-旧)</option>
        `;

        sortContainer.appendChild(sortSelect);
        controlsContainer.appendChild(sortContainer);
        content.appendChild(controlsContainer);

        const selectLabel = document.createElement('label');
        selectLabel.textContent = '节点列表:';
        selectLabel.style.cssText = 'display: block; margin-bottom: 8px; font-weight: 600; color: #666;';
        content.appendChild(selectLabel);

        const select = document.createElement('select');
        select.style.cssText = `
        width: 100%;
        padding: 10px;
        border: 1px solid #e6eef6;
        border-radius: 6px;
        font-size: 14px;
        margin-bottom: 16px;
        box-sizing: border-box;
        `;
        select.innerHTML = '<option value="">-- 请选择一个节点 --</option>';

        // 预览容器
        const previewLabel = document.createElement('label');
        previewLabel.textContent = '预览:';
        previewLabel.style.cssText = 'display: block; margin-bottom: 8px; font-weight: 600; color: #666; margin-top: 16px;';
        content.appendChild(previewLabel);

        const preview = document.createElement('div');
        preview.style.cssText = `
        width: 100%;
        height: 200px;
        background: #f5f7fa;
        border: 1px solid #e6eef6;
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
        `;
        preview.textContent = '选择节点查看预览';
        content.appendChild(preview);

        // 选择改变时更新预览
        function updatePreview() {
            const idx = parseInt(select.value, 10);
            if (isNaN(idx) || !allNodes[idx]) {
                preview.innerHTML = '<div style="color: #999;">选择节点查看预览</div>';
                return;
            }
            const n = allNodes[idx];
            const src = `/media/` + n.cover;
            if (!src) {
                preview.innerHTML = '<div style="color: #999;">所选节点没有cover图片</div>';
                return;
            }
            preview.innerHTML = '';
            const img = document.createElement('img');
            img.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';
            img.src = src;
            img.onerror = () => {
                preview.innerHTML = '<div style="color: red;">图片加载失败</div>';
            };
            preview.appendChild(img);
        }

        select.addEventListener('change', updatePreview);

        // 更新节点列表的函数
        function updateNodeList() {
            // 清空现有选项
            while (select.options.length > 1) {
                select.remove(1);
            }

            // 获取筛选和排序选项
            const filterTag = filterSelect.value;
            lastFilterTag = filterTag;
            const sortOption = sortSelect.value;

            // 筛选节点
            let filteredNodes = [];
            if (typeof allNodes !== 'undefined' && allNodes.length > 0) {
                filteredNodes = filterTag 
                    ? allNodes.filter(n => n.tag === filterTag)
                    : [...allNodes];
            }

            // 排序节点
            switch (sortOption) {
                case 'name-asc':
                    filteredNodes.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
                    break;
                case 'name-desc':
                    filteredNodes.sort((a, b) => (b.title || b.name || '').localeCompare(a.title || a.name || ''));
                    break;
                case 'time-asc':
                    filteredNodes.sort((a, b) => {
                        const timeA = new Date(a.time || 0);
                        const timeB = new Date(b.time || 0);
                        return timeA - timeB;
                    });
                    break;
                case 'time-desc':
                    filteredNodes.sort((a, b) => {
                        const timeA = new Date(a.time || 0);
                        const timeB = new Date(b.time || 0);
                        return timeB - timeA;
                    });
                    break;
            }

            // 填充选项
            if (filteredNodes.length === 0) {
                const opt = document.createElement('option');
                opt.textContent = '没有符合条件的节点';
                opt.disabled = true;
                select.appendChild(opt);
            } else {
                // 创建一个索引映射，因为排序后索引会变化
                const indexMap = {};
                allNodes.forEach((n, idx) => {
                    indexMap[n.id || idx] = idx;
                });

                filteredNodes.forEach(n => {
                    const opt = document.createElement('option');
                    opt.value = indexMap[n.id || allNodes.indexOf(n)];
                    opt.textContent = n.title || n.name || `节点 ${opt.value}`;
                    select.appendChild(opt);
                });
            }

            // 重置预览
            updatePreview();
        }

        // 初始填充节点列表
        updateNodeList();

        // 监听筛选和排序变化
        filterSelect.addEventListener('change', updateNodeList);
        sortSelect.addEventListener('change', updateNodeList);
        content.appendChild(select);

        // 按钮容器
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'display: flex; gap: 12px; justify-content: flex-end;';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '取消';
        cancelBtn.style.cssText = `
        padding: 10px 16px;
        border: 1px solid #e6eef6;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
        `;
        cancelBtn.addEventListener('click', () => modal_el.remove());
        cancelBtn.addEventListener('mouseover', () => {
            cancelBtn.style.background = '#f5f7fa';
            cancelBtn.style.borderColor = '#0b74ff';
        });
        cancelBtn.addEventListener('mouseout', () => {
            cancelBtn.style.background = 'white';
            cancelBtn.style.borderColor = '#e6eef6';
        });
        btnContainer.appendChild(cancelBtn);

        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = '确认';
        confirmBtn.style.cssText = `
        padding: 10px 16px;
        border: 1px solid #0b74ff;
        background: #0b74ff;
        color: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
        `;
        confirmBtn.addEventListener('click', () => {
            const idx = parseInt(select.value, 10);
            if (isNaN(idx) || !allNodes[idx]) {
                alert('请选择一个节点');
                return;
            }
            const n = allNodes[idx];
            const src =  `/media/` + n.cover;
            if (!src) {
                alert('所选节点没有cover图片');
                return;
            }
            const selId = window.CERegions.selectedId();
            if (!selId) {
                alert('请先选择一个图片区域');
                return;
            }
            window.CERegions?.attachImageToRegion(selId, src, 'cover');
            // 存储 node_id 到该区域的元数据
            const meta = window.CERegions.regionsMap.get(selId);
            if (meta && n.id) {
                meta.nodeId = n.id;
            }
            modal_el.remove();
        });
        confirmBtn.addEventListener('mouseover', () => {
            confirmBtn.style.background = '#0a5ed7';
            confirmBtn.style.transform = 'translateY(-2px)';
        });
        confirmBtn.addEventListener('mouseout', () => {
            confirmBtn.style.background = '#0b74ff';
            confirmBtn.style.transform = 'translateY(0)';
        });
        btnContainer.appendChild(confirmBtn);

        content.appendChild(btnContainer);

        // 关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
        position: absolute;
        top: 12px;
        right: 12px;
        width: 32px;
        height: 32px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        transition: all 0.2s ease;
        padding: 0;
        `;
        closeBtn.addEventListener('click', () => modal_el.remove());
        closeBtn.addEventListener('mouseover', () => {
            closeBtn.color = '#0b74ff';
            closeBtn.style.transform = 'scale(1.2)';
        });
        closeBtn.addEventListener('mouseout', () => {
            closeBtn.style.transform = 'scale(1)';
        });
        content.appendChild(closeBtn);
        content.style.position = 'relative';

        modal_el.appendChild(content);
        document.body.appendChild(modal_el);

        // 点击背景关闭
        modal_el.addEventListener('click', (e) => {
            if (e.target === modal_el) modal_el.remove();
        });
    }

    // 暴露给全局，以便直接调用
    window.showNodePicker = showNodePicker;
})();
