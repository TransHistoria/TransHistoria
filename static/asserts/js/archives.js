const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const tagContainer = document.getElementById('tagContainer');
const nodesContainer = document.getElementById('nodesContainer');

// 创建列容器
let columns = [];
let records = [];

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
        <a href=\"/archives/node/${node.id}\">
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

// 渲染记录
function renderRecords(records) {
    if (records.length === 0) {
        nodesContainer.innerHTML = '<p style="font-family:-webkit-body;">O_o 空空如也 Orz...</p>';
        return;
    }

    records.forEach(node => appendNode(node));
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
});
