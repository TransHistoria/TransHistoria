// 全局变量
let Nodes = [];
let collageData = null;
let isMobile = false;

// 随机着色相关变量
let colorTimers = []; // 存储所有的定时器ID
let curretntRegions = []; // 当前正在着色的区域
let activeColorCount = 0; // 当前同时着色的区域数量
let isPaused = false; // 是否暂停随机着色
let currentHoverRegion = null; // 当前鼠标悬停的区域
let isContentVisible = false;

// 检测设备类型
function detectDeviceType() {
    isMobile = window.innerWidth <= 768;
}

// 加载人物节点数据
async function loadNodes(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch nodes');
        }
        Nodes = await response.json();
        console.log('已加载节点数据:', Nodes);
    } catch (error) {
        console.error('加载节点数据时出错:', error);
        document.querySelector('.loading-indicator p').textContent = '加载节点数据失败';
    }
}

// 加载拼贴画配置
async function loadCollageConfig(config) {
    try {
        const configPath = isMobile ? `/media/config/${config}_mobile.json` : `/media/config/${config}.json`;
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

function initInfoCard(node){
    // 创建信息卡片
    const infoCard = document.createElement('div');
    infoCard.className = 'info-card';
    const title = document.createElement('h3');
    title.textContent = node.title || '未知标题';
    const description = document.createElement('p');
    if (node.con.length > 200) {
        description.textContent = node.con.substring(0, 200) + '...';
    } else {
        description.textContent = node.con;
    }
    const aElem = document.createElement("a"); 
    aElem.textContent = "深入了解→";
    aElem.target = "_blank";
    if (node.details) {
        aElem.style.display = "block";
        aElem.href = `/archives/node/${node.id}`;
    }
    else {
        aElem.style.display = "none";
    }
    infoCard.appendChild(title);
    infoCard.appendChild(description);
    infoCard.appendChild(aElem);
    return infoCard;
}

// 渲染拼贴画
function renderCollage(grayColor, scale, contentMode) {
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
                    const historyNode = Nodes.find(n => n.id == node.nodeId);
                    if (historyNode && historyNode.cover) {
                        imgSrc = `/media/${historyNode.cover}`;
                        regionEl.dataset.nodeId = node.nodeId;
                        const infoCard = initInfoCard(historyNode);
                        if (contentMode == 'outer') {
                            infoCard.style.position = 'fixed';
                        } else {
                            infoCard.style.position = 'absolute';
                        }
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
                img.alt = '节点图片';
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

                this.style.transform = "none";

                if (contentMode == 'outer') {
                    const body = document.querySelector('body');
                    const infoCardFixed = body.querySelector('.info-card-fixed');
                    if (infoCardFixed) {
                        infoCardFixed.remove();
                    } else {
                        const nodeId = this.dataset.nodeId;
                        if (nodeId) {
                            const historyNode = Nodes.find(n => n.id == nodeId);
                            if (historyNode) {
                                const infoCard = initInfoCard(historyNode);
                                infoCard.classList.add('info-card-fixed');
                                infoCard.style.position = 'fixed';
                                infoCard.style.opacity = '1';
                                infoCard.style.pointerEvents = 'auto';
                                infoCard.addEventListener('click', function(e) {
                                    e.stopPropagation();
                                    body.removeChild(infoCard);
                                })
                                body.appendChild(infoCard);
                            }
                        }
                    }
                } else {
                    // 查找信息卡片
                    const infoCard = this.querySelector('.info-card');
                    console.log('找到infoCard:', infoCard); // 添加调试信息

                    if (infoCard) {
                        if (infoCard.classList.contains('visible')) {
                            isPaused = false;
                            currentHoverRegion = null;
                            isContentVisible = false;
                        } else {
                            isPaused = true;
                            currentHoverRegion = this;
                            isContentVisible = true;
                        }
                        infoCard.classList.toggle('visible');
                        console.log('切换infoCard显示状态'); // 添加调试信息
                    } else {
                        console.log('未找到infoCard'); // 添加调试信息
                    }
                }
            });
            
            // 添加鼠标悬停事件
            regionEl.addEventListener('mouseenter', function(e) {
                isPaused = true;
                currentHoverRegion = this;
                console.log('区域悬停'); // 添加调试信息
                
                this.style.transform = `scale(${scale})`;
                // 重置着色区域
                curretntRegions = [];
                // 重置所有区域为灰度
                document.querySelectorAll('.collage-region').forEach(region => {
                    region.classList.remove('autohover');
                    const img = region.querySelector('img');
                    if (img && grayColor) {
                        img.style.filter = 'grayscale(100%)';
                    }
                });
                
                const img = this.querySelector('img');
                if (img && grayColor) {
                    img.style.filter = 'grayscale(0)';
                }
            });
            
            regionEl.addEventListener('mouseleave', function(e) {
                if (!isContentVisible) {
                    isPaused = false;
                    currentHoverRegion = null;
                }
                this.style.transform = "none";

                const img = this.querySelector('img');
                if (img && grayColor) {
                    img.style.filter = 'grayscale(100%)';
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
            // 使用保存的flex属性，如果没有保存则使用默认值
            if (node.flex) {
                splitContainer.style.flex = `${node.flex.grow || 1} ${node.flex.shrink || 1} ${node.flex.basis || '0%'}`;
            } else {
                splitContainer.style.flex = '1 1 0%';
            }

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

    window.addEventListener("mouseout", (e) => {
        if (!e.relatedTarget && !e.toElement) {
            //真正离开浏览器窗口
            forceCardLeave();
        }
    });

    function forceCardLeave() {
        const card = document.querySelector(".info-card.visible");
        if (!card) return;
        card.classList.remove("visible");
    }


}

// 初始化随机着色
function initRandomColoring(maxSimultaneousColors = 3, colorDuration = 3000) {
    activeColorCount = maxSimultaneousColors;
    
    // 初始化所有区域为灰度
    const regions = document.querySelectorAll('.collage-region');
    regions.forEach(region => {
        const img = region.querySelector('img');
        if (img) {
            img.style.filter = 'grayscale(100%)';
        }
    });
    
    // 启动多个定时器，每个定时器负责一个区域的着色
    for (let i = 0; i < activeColorCount; i++) {
        // 初始延迟不同，避免同时变化
        const initialDelay = 200;
        const timerId = setTimeout(() => {
            colorRandomRegion(colorDuration);
            // 设置循环定时器
            const intervalId = setInterval(() => {
                if (!isPaused) {
                    colorRandomRegion(colorDuration);
                }
            }, colorDuration);
            colorTimers.push(intervalId);
        }, initialDelay);
        colorTimers.push(timerId);
    }
}

// 随机选择一个区域进行着色
function colorRandomRegion(colorDuration = 3000) {
    const regions = document.querySelectorAll('.collage-region');
    if (regions.length === 0) return;
    
    // 随机选择一个区域
    let randomIndex = Math.floor(Math.random() * regions.length);
    let n = 100; // 防止死循环
    while (curretntRegions.includes(regions[randomIndex]) && n > 0) {
        randomIndex = Math.floor(Math.random() * regions.length);
        n--;
    }
    if (n === 0) return; // 如果尝试多次仍未找到不同区域，则放弃此次着色
    const randomRegion = regions[randomIndex];
    curretntRegions.push(randomRegion);

    // add hover
    randomRegion.classList.add('autohover');
    
    // 设置为彩色
    const img = randomRegion.querySelector('img');
    if (img) {
        img.style.filter = 'grayscale(0)';
    }
    
    // 如果不是鼠标悬停状态，则在指定时间后恢复灰度
    if (!isPaused) {
        setTimeout(() => {
            if (randomRegion !== currentHoverRegion) {
                randomRegion.classList.remove('autohover');
                if (img) {
                    img.style.filter = 'grayscale(100%)';
                }
                // 从当前着色列表中移除
                const index = curretntRegions.indexOf(randomRegion);
                curretntRegions.splice(index, 1);
            }
        }, colorDuration);
    }
}

// 清除所有定时器
function clearAllColorTimers() {
    colorTimers.forEach(timerId => {
        clearTimeout(timerId);
        clearInterval(timerId);
    });
    colorTimers = [];
}

// 初始化页面
async function initPage(nodeApiUrl, config, grayColor = false, scale, contentMode = "inner", random = false) {
    // 检测设备类型
    detectDeviceType();

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        const wasMobile = isMobile;
        detectDeviceType();

        // 如果设备类型改变，重新加载配置并重新渲染
        if (wasMobile !== isMobile) {
            loadCollageConfig(config).then(() => {
                renderCollage();
            });
        }
    });

    // 加载所有数据
    await Promise.all([
        loadNodes(nodeApiUrl),
        loadCollageConfig(config)
    ]);

    // 渲染拼贴画
    renderCollage(grayColor, scale, contentMode);
    
    if (random) {
        // 初始化随机着色，默认同时有3个区域随机着色，每个区域着色持续5秒
        initRandomColoring(1, 3000);
    }
}
