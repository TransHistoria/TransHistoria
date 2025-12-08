const refList = document.getElementById("refList");
const attrList = document.getElementById("attrList");
const addRefBtn = document.getElementById("addRefBtn");
const addAttrBtn = document.getElementById("addAttrBtn");
const refItemTpl = document.getElementById("refItemTpl");
const attrItemTpl = document.getElementById("attrItemTpl");
const form = document.getElementById("entryForm");
const preview = document.getElementById("jsonPreview");
const cover = document.getElementById("cover");

// 初始化
addRef();
addAttr();
updateRefNumbers();
refreshAttrOptions();

// 检查是否有node_id，如果有则加载节点数据
document.addEventListener('DOMContentLoaded', function () {
    const nodeId = document.getElementById('node_id').value;
    if (nodeId) {
        loadNodeData(nodeId);
        document.querySelector('.bar h1').textContent = 'TransHistoria 资料编辑卡';
    }
})

// 加载节点数据
async function loadNodeData(id) {
    try {
        const response = await fetch(`/api/historynode/${id}/`);
        if (!response.ok) throw new Error('获取节点数据失败');
        const nodeData = await response.json();

        // 填充表单
        document.getElementById('title').value = nodeData.title || '';
        document.getElementById('content').value = nodeData.con || '';
        document.getElementById('time').value = nodeData.time || '';

        // 填充参考文献
        refList.innerHTML = '';
        if (nodeData.ref && nodeData.ref.length > 0) {
            nodeData.ref.forEach(ref => addRef(ref));
        } else {
            addRef();
        }
        updateRefNumbers();

        // 填充属性
        attrList.innerHTML = '';
        if (nodeData.time_name) addAttr('time_name', nodeData.time_name);
        if (nodeData.field) addAttr('field', nodeData.field);
        if (nodeData.theme) addAttr('theme', nodeData.theme);
        if (nodeData.region) addAttr('region', nodeData.region);

        // 设置标签
        if (nodeData.tag) {
            const tagRadio = document.querySelector(`input[name="tag"][value="${nodeData.tag}"]`);
            if (tagRadio) tagRadio.checked = true;
        }

        // 设置封面图片
        if (nodeData.cover) {
            document.getElementById('cover_image_url').value = nodeData.cover;
            document.getElementById('cover_preview').src = `/media/${nodeData.cover}`;
        }

        refreshAttrOptions();
    } catch (error) {
        console.error('加载节点数据失败:', error);
        alert('加载节点数据失败，请重试');
    }
}

// 添加参考文献
addRefBtn.addEventListener("click", () => {
    addRef();
    updateRefNumbers();
});

// 添加属性
addAttrBtn.addEventListener("click", () => {
    addAttr();
    refreshAttrOptions();
});

// 参考文献删除（事件委托）
refList.addEventListener("click", (e) => {
    if (
        e.target.classList.contains("remove-ref") ||
        e.target.closest(".remove-ref")
    ) {
        e.target.closest(".ref-item").remove();
        updateRefNumbers();
    }
});

// 属性删除（事件委托）
attrList.addEventListener("click", (e) => {
    if (
        e.target.classList.contains("remove-attr") ||
        e.target.closest(".remove-attr")
    ) {
        e.target.closest(".attr-item").remove();
        refreshAttrOptions();
    }
});

// 属性选择变更，刷新禁用状态
attrList.addEventListener("change", (e) => {
    if (e.target.classList.contains("attr-key")) {
        refreshAttrOptions();
    }
});

// JSON 预览按钮
document.getElementById("previewBtn").addEventListener("click", () => {
    const data = collectData();
    preview.textContent = JSON.stringify(data, null, 2);
});

var csrftoken = '{{ csrf_token }}';
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
csrftoken = getCookie('csrftoken');

cover.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("markdown-image-upload", file);

    fetch("/api/images_uploader/", {
        method: "POST",
        body: formData,
        headers: {
            "X-CSRFToken": csrftoken,
            "cover": true
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 200) {
                // 把返回的图片链接存到隐藏字段
                document.getElementById("cover_image_url").value = data.link;
                document.getElementById("cover_preview").src = `/media/${data.link}`;
                alert("图片上传成功: " + data.link);
            } else {
                alert("上传失败: " + data.error);
            }
        })
        .catch(err => {
            console.error("上传出错", err);
        });
});

// 表单提交
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = collectData();
    // preview.textContent = JSON.stringify(data, null, 2);
    document.getElementById('json_data').value = JSON.stringify(data);
    const formData = new FormData(form);

    const nodeId = document.getElementById('node_id').value;
    const isEdit = nodeId !== '';

    try {
        let url = '/api/add_node/';
        let method = 'POST';

        // 如果是编辑模式，使用不同的URL和方法
        if (isEdit) {
            url = `/api/update_node/${nodeId}/`;
            method = 'POST';
        }

        const res = await fetch(url, {
            method: method,
            headers: {
                'X-CSRFToken': csrftoken
            },
            body: formData
        });

        if (!res.ok) throw new Error(isEdit ? '更新失败' : '提交失败');
        const result = await res.json();
        console.log(result);
        alert(isEdit ? '更新成功，JSON 返回已打印到控制台' : '提交成功，JSON 返回已打印到控制台');
    } catch (err) {
        console.error(err);
        alert(isEdit ? '更新失败：' + err.message : '提交失败：' + err.message);
    }
});

function addRef(value = "") {
    const node = refItemTpl.content.firstElementChild.cloneNode(true);
    node.querySelector(".ref-input").value = value;
    refList.appendChild(node);
}

function addAttr(key = "", val = "") {
    const node = attrItemTpl.content.firstElementChild.cloneNode(true);
    const sel = node.querySelector(".attr-key");
    const input = node.querySelector(".attr-val");
    if (key) sel.value = key;
    if (val) input.value = val;
    attrList.appendChild(node);
    refreshAttrOptions();
}

function updateRefNumbers() {
    [...refList.querySelectorAll(".ref-item")].forEach((item, idx) => {
        item.querySelector(".num").textContent = idx + 1;
    });
}

function getUsedAttrKeys() {
    return new Set(
        [...attrList.querySelectorAll(".attr-key")]
            .map((s) => s.value)
            .filter(Boolean)
    );
}

function refreshAttrOptions() {
    const used = getUsedAttrKeys();
    const allKeys = ["time", "field", "theme", "region"];
    addAttrBtn.disabled = used.size >= allKeys.length;
    [...attrList.querySelectorAll(".attr-item")].forEach((item) => {
        const sel = item.querySelector(".attr-key");
        const current = sel.value;
        [...sel.options].forEach((opt) => {
            if (!opt.value) return;
            opt.disabled = used.has(opt.value) && opt.value !== current;
        });
    });
}

function collectData() {
    const title = document.getElementById("title").value.trim();
    const con = document.getElementById("content").value.trim();
    const time = document.getElementById("time").value.trim();
    const ref = [...refList.querySelectorAll(".ref-input")]
        .map((i) => i.value.trim())
        .filter((v) => v.length > 0);

    const attr = { time_name: "", field: "", theme: "", region: "", tag: "" };
    [...attrList.querySelectorAll(".attr-item")].forEach((item) => {
        const key = item.querySelector(".attr-key").value;
        const val = item.querySelector(".attr-val").value.trim();
        if (key && val) attr[key] = val;
    });

    const tag = (new FormData(form).get("tag") || "").toString();
    attr.tag = tag;

    const username = document.getElementById("username")?.textContent.trim();
    const useremail = document.getElementById("useremail")?.textContent.trim();
    const user = { name: username, email: useremail };

    const cover = document.getElementById("cover_image_url").value.trim();
    return { title, con, time, ref, attr, user, cover};
}