const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const tagContainer = document.getElementById('tagContainer');
const nodesContainer = document.getElementById('nodesContainer');
const sortButton = document.getElementById('sortButton');
const sortDropdown = document.getElementById('sortDropdown');

// 创建列容器
let columns = [];
let records = [];
let currentSort = { type: 'time', order: 'desc' }; // 默认按时间倒序

// 根据屏幕宽度确定列数
function getColumnCount() {
    if (window.innerWidth < 640) return 2;      // 手机
    if (window.innerWidth < 1024) return 3;     // 平板
    if (window.innerWidth < 1400) return 4;     // 桌面小
    return 5;                                   // 桌面大
}

function createColumns(count) {
    console.log(count);
    nodesContainer.innerHTML = ''; // 清空
    columns = [];
    for (let i = 0; i < count; i++) {
        const col = document.createElement('div');
        col.className = 'nodes-column';
        nodesContainer.appendChild(col);
        columns.push(col);
    }
}

// 把卡片插入最短列
function appendNode(node) {
    const nodeElem = document.createElement('div');
    nodeElem.className = 'node';
    var img = ``;
    if (node.cover){
        const imgsrc = `/media/${node.cover}`;
        img = `<img src=${imgsrc} alt=\"${node.title}\">`;
    }
    nodeElem.innerHTML = `
        <a href=\"/archives/node/${node.id}\" target="_blank">
            ${img}
            <div class=\"node-body\">
                <h2>${node.title}</h2>
                <p>${node.con}</p>
            </div>
        </a>
    `;
    // <div class=\"tags\">${node.tags.map(t => `<span>${t}</span>`).join('')}</div>
    // 找到最短列
    const shortest = columns.reduce((a, b) =>
        a.scrollHeight <= b.scrollHeight ? a : b
    );
    shortest.appendChild(nodeElem);
}

// 排序函数
function sortRecords(records, sortType, sortOrder) {
    const sortedRecords = [...records];

    if (sortType === 'time') {
        sortedRecords.sort((a, b) => {
            const dateA = new Date(a.date || a.created_at || 0);
            const dateB = new Date(b.date || b.created_at || 0);
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
    } else if (sortType === 'name') {
        sortedRecords.sort((a, b) => {
            const nameA = (a.title || '').toLowerCase();
            const nameB = (b.title || '').toLowerCase();
            if (sortOrder === 'asc') {
                return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
            } else {
                return nameA > nameB ? -1 : nameA < nameB ? 1 : 0;
            }
        });
    }

    return sortedRecords;
}

// 渲染记录
function renderRecords(records) {
    if (records.length === 0) {
        nodesContainer.innerHTML = '<p style="font-family:-webkit-body;">O_o 空空如也 Orz...</p>';
        return;
    }

    // 应用当前排序
    const sortedRecords = sortRecords(records, currentSort.type, currentSort.order);
    sortedRecords.forEach(node => appendNode(node));
}

// 监听窗口大小变化重新布局
window.addEventListener('resize', () => {
    if (columns.length !== getColumnCount()) {
        createColumns(getColumnCount());
        renderRecords(records);
    }
});

// 封装请求函数
function fetchRecords() {
    const keyword = searchInput.value.trim();

    // 获取所有选中的tag
    const selectedTags = Array.from(tagContainer.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value);

    // 拼接请求URL
    let url = '/api/get_historynodes/?';
    if (keyword) {
        url += 'q=' + encodeURIComponent(keyword) + '&';
    }
    // 如果多选tag，可以用后端多个参数 tag=news&tag=sport
    // 或者自定义后端支持 tag=tag1,tag2
    if (selectedTags.length > 0) {
        // 这里假设后端接受 tag=tag1,tag2
        url += 'tag=' + encodeURIComponent(selectedTags.join(',')) + '&';
    }
    fetch(url)
        .then(res => res.json())
        .then(data => {
            createColumns(getColumnCount());
            renderRecords(data);
            records = data;
        })
        .catch(err => console.error(err));
}

// 页面加载完成时先加载全部
document.addEventListener('DOMContentLoaded', () => {
    fetchRecords();
    const tagsLabels = tagContainer.querySelectorAll('input[type="checkbox"]');
    tagsLabels.forEach(label => {
        label.addEventListener('change', fetchRecords);
    })
    searchInput.addEventListener('keydown', (e)=>{
        if(e.key == 'Enter'){
            fetchRecords();
        }
    })
    searchButton.addEventListener('click', fetchRecords);

    // 排序按钮点击事件
    sortButton.addEventListener('click', () => {
        sortDropdown.classList.toggle('show');
    });

    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', (e) => {
        if (!sortButton.contains(e.target) && !sortDropdown.contains(e.target)) {
            sortDropdown.classList.remove('show');
        }
    });

    // 排序选项点击事件
    const sortOptions = sortDropdown.querySelectorAll('.sort-option');
    sortOptions.forEach(option => {
        option.addEventListener('click', () => {
            const sortType = option.getAttribute('data-sort');
            const sortOrder = option.getAttribute('data-order');

            // 更新当前排序状态
            currentSort = { type: sortType, order: sortOrder };

            // 更新选中状态
            sortOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');

            // 关闭下拉菜单
            sortDropdown.classList.remove('show');

            // 重新渲染已加载的记录
            if (records.length > 0) {
                createColumns(getColumnCount());
                renderRecords(records);
            }
        });
    });
});
