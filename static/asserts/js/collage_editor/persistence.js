// Persistence layer: save/load canvas state including layout, regions, and images
(function () {
    /**
     * Serialize the entire canvas state to a JSON-compatible object.
     * Returns: { version, canvas, splitter, regions: [ tree structure ] }
     */
    function serializeCanvas() {
        const canvasEl = document.getElementById('canvas');
        if (!canvasEl) return null;

        const cs = window.getComputedStyle(canvasEl);
        const state = {
            version: 1,
            canvas: {
                width: canvasEl.style.width || 'auto',
                height: canvasEl.style.height || 'auto'
            },
            splitter: {
                width: cs.getPropertyValue('--splitter-width')?.trim() || '8px',
                color: cs.getPropertyValue('--splitter-color')?.trim() || 'rgba(16,24,40,0.06)',
                hitSize: cs.getPropertyValue('--splitter-hit-size')?.trim() || '8px'
            },
            regions: serializeRegionTree(canvasEl.children[0])
        };
        return state;
    }

    /**
     * Recursively serialize region/split tree structure.
     * Each node is either:
     * - { type: 'region', id, fillMode, image, crop, flexGrow }
     * - { type: 'split', dir, children: [childA, childB] }
     */
    function serializeRegionTree(el) {
        if (!el) return null;

        if (el.classList.contains('region')) {
            const id = el.dataset.regionId;
            const meta = window.CERegions.regionsMap.get(id);
            const cs = window.getComputedStyle(el);
            const flexGrow = parseFloat(cs.flexGrow) || 1;
            return {
                type: 'region',
                id,
                fillMode: meta?.fillMode || 'cover',
                image: meta?.image?.src || null,
                crop: meta?.crop ? { ...meta.crop } : { x: 0, y: 0, scale: 1 },
                nodeId: meta?.nodeId || null,
                flexGrow: flexGrow
            };
        }

        if (el.classList.contains('split')) {
            const dir = el.classList.contains('vertical') ? 'vertical' : 'horizontal';
            const children = [];
            for (const child of el.children) {
                if (child.classList.contains('region')) {
                    children.push(serializeRegionTree(child));
                } else if (child.classList.contains('split')) {
                    // recursively serialize nested splits
                    children.push(serializeRegionTree(child));
                } else if (child.classList.contains('splitter')) {
                    // splitters are metadata, not serialized separately (reconstructed during split)
                }
            }
            return {
                type: 'split',
                dir,
                children // [childA, childB] or nested splits, excluding splitters
            };
        }

        return null;
    }

    /**
     * Download canvas state as JSON file.
     */
    function exportStateAsJSON() {
        const state = serializeCanvas();
        if (!state) return alert('无法序列化画布状态');
        // DEBUG: log the full state for inspection
        try {
            console.log('Serialized state:', JSON.stringify(state, null, 2));
        } catch (e) { }
        const json = JSON.stringify(state, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `collage-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Load canvas state from a JSON file.
     * Reconstructs the layout, splitters, and region metadata.
     */
    function importStateFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const state = JSON.parse(reader.result);
                    await reconstructCanvas(state);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    /**
     * Reconstruct the entire canvas from a serialized state.
     */
    async function reconstructCanvas(state) {
        if (!state || state.version !== 1) throw new Error('Invalid state version');

        // 1. Reset canvas
        const canvasEl = document.getElementById('canvas');
        canvasEl.innerHTML = '';

        // 2. Restore canvas size
        if (state.canvas.width && state.canvas.width !== 'auto') {
            canvasEl.style.width = state.canvas.width;
        }
        if (state.canvas.height && state.canvas.height !== 'auto') {
            canvasEl.style.height = state.canvas.height;
        }
        canvasEl.style.flex = '0 0 auto';
        canvasEl.style.margin = '12px auto';

        // 3. Restore splitter config
        if (state.splitter) {
            if (state.splitter.width) canvasEl.style.setProperty('--splitter-width', state.splitter.width);
            if (state.splitter.color) canvasEl.style.setProperty('--splitter-color', state.splitter.color);
            if (state.splitter.hitSize) canvasEl.style.setProperty('--splitter-hit-size', state.splitter.hitSize);
        }

        // 4. Reconstruct region tree
        if (state.regions) {
            const root = await reconstructRegionTree(state.regions);
            if (root) canvasEl.appendChild(root);
        }

        // 5. Select first region
        const firstRegion = canvasEl.querySelector('[data-region-id]');
        if (firstRegion && firstRegion.dataset.regionId) {
            window.CERegions.selectRegion(firstRegion.dataset.regionId);
        }
    }

    /**
     * Recursively reconstruct the region/split tree from serialized form.
     */
    async function reconstructRegionTree(node) {
        if (!node) return null;

        if (node.type === 'region') {
            // Create a new region element with the saved ID
            const el = document.createElement('div');
            el.className = 'region pane';
            el.dataset.regionId = node.id;
            // Restore flex layout with saved flexGrow value
            const flexGrow = node.flexGrow || 1;
            el.style.flex = `${flexGrow} 1 0%`;
            el.style.minWidth = '0';
            el.style.minHeight = '0';

            // Add click and double-click handlers
            el.addEventListener('click', e => {
                e.stopPropagation();
                window.CERegions.selectRegion(node.id);
            });
            el.addEventListener('dblclick', e => {
                e.stopPropagation();
                document.dispatchEvent(new CustomEvent('ce-region-dblclick', { detail: { id: node.id } }));
            });

            // Register in regions map
            window.CERegions.regionsMap.set(node.id, {
                el,
                fillMode: node.fillMode || 'cover',
                image: null,
                imgEl: null,
                crop: node.crop || { x: 0, y: 0, scale: 1 },
                nodeId: node.nodeId || null
            });

            // Add placeholder
            const ph = document.createElement('div');
            ph.className = 'placeholder';
            ph.textContent = '双击添加图片';
            el.appendChild(ph);

            // Attach image if present
            if (node.image) {
                try {
                    await new Promise((res) => {
                        window.CERegions.attachImageToRegion(node.id, node.image, node.fillMode);
                        setTimeout(res, 500); // wait for image load
                    });
                } catch (err) {
                    console.warn('Failed to load image:', err);
                }
            }

            return el;
        }

        if (node.type === 'split') {
            const container = document.createElement('div');
            container.className = 'split ' + node.dir;
            container.style.display = 'flex';
            container.style.flexDirection = node.dir === 'vertical' ? 'row' : 'column';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.minWidth = '0';
            container.style.minHeight = '0';
            container.style.flex = '1 1 0%';

            // node.children should have exactly 2 items (pane A and pane B, which can themselves be regions or splits)
            if (node.children && node.children.length >= 2) {
                const childA = await reconstructRegionTree(node.children[0]);
                const childB = await reconstructRegionTree(node.children[1]);

                if (childA && childB) {
                    // Create splitter between them
                    const splitter = document.createElement('div');
                    splitter.className = 'splitter ' + node.dir;
                    splitter.innerHTML = '<div class="handle"></div>';
                    splitter.dataset.splitDir = node.dir;

                    container.appendChild(childA);
                    container.appendChild(splitter);
                    container.appendChild(childB);

                    // Initialize splitter drag behavior
                    try {
                        window.CERegions.initSplitterForReconstructed(splitter, container, node.dir);
                    } catch (err) {
                        console.warn('Failed to init splitter:', err);
                    }
                }
            }

            return container;
        }

        return null;
    }

    // Expose API
    window.CESave = {
        exportStateAsJSON,
        importStateFromJSON,
        serializeCanvas,
        getJSONData: function() {
            const state = serializeCanvas();
            if (!state) return null;
            return JSON.stringify(state, null, 2);
        }
    };
})();
