// 全局变量
let peopleNodes = [];
let collageData = null;
let isMobile = false;

// 检测设备类型
function detectDeviceType() {
    isMobile = window.innerWidth <= 768;
}

// 加载人物节点数据
async function loadPeopleNodes() {
    try {
        const response = await fetch('/api/get_people_nodes/');
        if (!response.ok) {
            throw new Error('Failed to fetch people nodes');
        }
        peopleNodes = await response.json();
        console.log('已加载人物节点数据:', peopleNodes);
    } catch (error) {
        console.error('加载人物节点数据时出错:', error);
        document.querySelector('.loading-indicator p').textContent = '加载人物数据失败';
    }
}

// 加载拼贴画配置
async function loadCollageConfig() {
    try {
        const configPath = isMobile ? '/media/config/people_mobile.json' : '/media/config/people.json';
        console.log('正在加载拼贴画配置:', configPath);
        const response = await fetch(configPath);

        if (!response.ok) {
            throw new Error(`Failed to fetch collage config: ${configPath}`);
        }

        collageData = await response.json();
        console.log('已加载拼贴画配置:', collageData);
        console.log('regions类型:', typeof collageData.regions);
        console.log('regions是否为数组:', Array.isArray(collageData.regions));
        if (collageData.regions) {
            console.log('regions内容:', collageData.regions);
        }
    } catch (error) {
        console.error('加载拼贴画配置时出错:', error);
        document.querySelector('.loading-indicator p').textContent = '加载拼贴画配置失败';
    }
}

// 递归处理嵌套结构，提取所有区域
function extractRegions(node, regions = []) {
    if (node.type === 'region') {
        regions.push(node);
    } else if (node.type === 'split' && node.children) {
        node.children.forEach(child => extractRegions(child, regions));
    }
    return regions;
}

// 渲染拼贴画
function renderCollage() {
    const container = document.getElementById('collage-container');
    container.innerHTML = '';

    if (!collageData) {
        container.innerHTML = '<div class="error-message">拼贴画配置无效</div>';
        return;
    }

    // 从canvas获取尺寸
    const canvas = collageData.canvas || {};
    const originalWidth = parseInt(canvas.width) || 800;
    const originalHeight = parseInt(canvas.height) || 600;

    // 获取当前屏幕可用宽度
    const screenWidth = window.innerWidth;

    // 计算缩放比例
    const canvasScale = screenWidth / originalWidth;
    console.log(canvasScale);


    // 创建拼贴画容器
    const collage = document.createElement('div');
    collage.className = 'collage';

    // 应用缩放后的尺寸
    collage.style.width = '100vw';
    collage.style.height = `${originalHeight * canvasScale}px`;

    // 创建Flexbox容器来处理分割布局
    const flexContainer = document.createElement('div');
    flexContainer.className = 'flex-container';
    flexContainer.style.width = '100%';
    flexContainer.style.height = '100%';
    flexContainer.style.display = 'flex';
    flexContainer.style.flexDirection = 'row';

    // 递归函数构建分割布局
    function buildSplitLayout(node, parentElement) {
        if (node.type === 'region') {
            // 创建区域元素
            const regionEl = document.createElement('div');
            regionEl.className = 'collage-region';
            regionEl.dataset.regionId = node.id;

            // 设置flex属性，参考regions.js中的实现
            const flexGrow = node.flexGrow !== undefined ? node.flexGrow : 1;
            regionEl.style.flex = `${flexGrow} 1 0%`;
            regionEl.style.minWidth = '0';
            regionEl.style.minHeight = '0';
            regionEl.style.overflow = 'hidden';
            regionEl.style.position = 'relative';
            regionEl.style.display = 'flex';
            regionEl.style.flexDirection = 'column';
            regionEl.style.justifyContent = 'center';
            regionEl.style.alignItems = 'center';

            // 处理图片
            if (node.image) {
                let imgSrc;

                // 如果有nodeId，从节点数据中获取图片
                if (node.nodeId) {
                    const personNode = peopleNodes.find(n => n.id == node.nodeId);
                    if (personNode && personNode.cover) {
                        imgSrc = `/media/${personNode.cover}`;

                        // 创建信息卡片
                        const infoCard = document.createElement('div');
                        infoCard.className = 'info-card';
                        const title = document.createElement('h3');
                        title.textContent = personNode.title || '未知标题';
                        const description = document.createElement('p');
                        if (personNode.con.length > 200) {
                            description.textContent = personNode.con.substring(0, 200) + '...';
                        } else {
                            description.textContent = personNode.con;
                        }
                        const aElem = document.createElement("a"); 
                        aElem.textContent = "深入了解→";
                        aElem.target = "_blank";
                        // aElem.classList.add("stickynote-link");
                        if (personNode.details) {
                            aElem.style.display = "block";
                            aElem.href = `/archives/node/${personNode.id}`;
                        }
                        else {
                            aElem.style.display = "none";
                        }
                        infoCard.appendChild(title);
                        infoCard.appendChild(description);
                        infoCard.appendChild(aElem);
                        regionEl.appendChild(infoCard);
                    } else {
                        console.warn(`未找到ID为 ${node.nodeId} 的节点或节点没有封面图片`);
                        imgSrc = node.image; // 使用原始图像作为后备
                    }
                } else {
                    // 没有nodeId，直接使用图像
                    imgSrc = node.image;
                }

                const img = document.createElement('img');
                img.src = imgSrc;
                img.alt = '人物图片';
                img.className = 'collage-image';

                // 根据regions.js中的实现设置图片样式
                img.style.position = 'absolute';
                img.style.left = '0';
                img.style.top = '0';
                img.style.width = 'auto';  // 使用原始宽度
                img.style.height = 'auto'; // 使用原始高度
                img.style.objectFit = 'none'; // 不进行缩放，显示完整图片尺寸
                img.style.objectPosition = 'left top'; // 确保图片从左上角开始显示
                img.style.willChange = 'transform';
                img.overflow = 'visible';

                if (node.crop) {
                    const { x, y, scale } = node.crop;
                    // 确保scale是有效的数字
                    const imgScale = (typeof scale === 'number' && !isNaN(scale)) ? scale * canvasScale : 1;

                    // 应用缩放后的裁剪参数
                    const scaledX = (x || 0) * canvasScale;
                    const scaledY = (y || 0) * canvasScale;
                    img.style.transform = `translate(${scaledX}px, ${scaledY}px) scale(${imgScale})`;
                    img.style.transformOrigin = 'left top';
                }

                // 图片不需要单独的点击事件，将在区域上处理

                regionEl.appendChild(img);
            }

            // 在区域元素上添加点击事件
            regionEl.addEventListener('click', function (e) {
                console.log('区域被点击'); // 添加调试信息

                // 查找信息卡片
                const infoCard = this.querySelector('.info-card');
                console.log('找到infoCard:', infoCard); // 添加调试信息

                if (infoCard) {
                    infoCard.classList.toggle('visible');
                    console.log('切换infoCard显示状态'); // 添加调试信息
                } else {
                    console.log('未找到infoCard'); // 添加调试信息
                }
            });

            parentElement.appendChild(regionEl);
        } else if (node.type === 'split' && node.children) {
            // 创建分割容器，参考regions.js中的实现
            const splitContainer = document.createElement('div');
            splitContainer.className = 'split-container';
            splitContainer.style.display = 'flex';
            splitContainer.style.width = '100%';
            splitContainer.style.height = '100%';
            splitContainer.style.flexDirection = node.dir === 'horizontal' ? 'column' : 'row';
            splitContainer.style.minWidth = '0';
            splitContainer.style.minHeight = '0';
            splitContainer.style.flex = '1 1 0%';

            // 递归处理子元素
            node.children.forEach((child, index) => {
                buildSplitLayout(child, splitContainer);

                // 如果不是最后一个子元素，添加分割线
                if (index < node.children.length - 1 && collageData.splitter) {
                    const splitterEl = document.createElement('div');
                    splitterEl.className = 'splitter ' + node.dir;
                    const splitter = collageData.splitter;
                    splitterEl.style.backgroundColor = splitter.color || 'rgba(16,24,40,0.06)';

                    const width = parseInt(`${splitter.width}`.replace('px', ''));
                    // 设置分割线尺寸，参考regions.js并根据缩放比例调整
                    if (node.dir === 'horizontal') {
                        splitterEl.style.width = '100%';

                        const splitterHeight = width * canvasScale;
                        splitterEl.style.height = `${splitterHeight}px`;
                        splitterEl.style.cursor = 'row-resize';
                    } else {
                        const splitterWidth = width * canvasScale;
                        splitterEl.style.width = `${splitterWidth}px`;
                        splitterEl.style.height = '100%';
                        splitterEl.style.cursor = 'col-resize';
                    }

                    splitterEl.style.flex = '0 0 auto';
                    splitterEl.style.position = 'relative';
                    splitterEl.style.zIndex = '10';

                    // 添加手柄元素，参考regions.js并根据缩放比例调整
                    const handle = document.createElement('div');
                    handle.className = 'handle';
                    handle.style.position = 'absolute';
                    handle.style.top = '50%';
                    handle.style.left = '50%';
                    handle.style.transform = 'translate(-50%, -50%)';
                    const handleSize = 30 * canvasScale;
                    handle.style.width = `${handleSize}px`;
                    handle.style.height = `${handleSize}px`;
                    handle.style.backgroundColor = 'rgba(255,255,255,0.3)';
                    handle.style.borderRadius = '50%';
                    handle.style.display = 'none';

                    splitterEl.appendChild(handle);

                    // 添加悬停效果
                    splitterEl.addEventListener('mouseenter', () => {
                        handle.style.display = 'block';
                    });

                    splitterEl.addEventListener('mouseleave', () => {
                        handle.style.display = 'none';
                    });

                    splitContainer.appendChild(splitterEl);
                }
            });

            parentElement.appendChild(splitContainer);
        }
    }

    // 从regions开始构建布局
    if (collageData.regions) {
        buildSplitLayout(collageData.regions, flexContainer);
    }

    collage.appendChild(flexContainer);
    container.appendChild(collage);

    // 隐藏加载指示器
    const loadingIndicator = container.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// 初始化页面
async function initPage() {
    // 检测设备类型
    detectDeviceType();

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        const wasMobile = isMobile;
        detectDeviceType();

        // 如果设备类型改变，重新加载配置并重新渲染
        if (wasMobile !== isMobile) {
            loadCollageConfig().then(() => {
                renderCollage();
            });
        }
    });

    // 加载所有数据
    await Promise.all([
        loadPeopleNodes(),
        loadCollageConfig()
    ]);

    // 渲染拼贴画
    renderCollage();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initPage);