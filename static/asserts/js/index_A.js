

document.addEventListener("DOMContentLoaded", () => {
    // 找到所有 t-item
    const items = document.querySelectorAll(".timeline .t-item");

    items.forEach(item => {
        const tIdElem = item.querySelector(".t-id");
        if (!tIdElem) return;

        const id = tIdElem.textContent.trim(); // 获取 t-id

        // 请求后端数据
        fetch(`/api/historynode/${id}/`)  // 假设你的 Django URL 是 /api/historynode/<id>/
            .then(response => response.json())
            .then(data => {
                // 更新前端
                const yearElem = item.querySelector(".t-year");
                const aElem = item.querySelector(".t-bar a");
                const titleElem = item.querySelector(".t-title");
                const contentElem = item.querySelector(".t-content");

                if (yearElem) yearElem.textContent = data.time || "";
                if (data.mkdoc) {
                    aElem.style.display = "block";
                    aElem.href = `/detail/${data.mkdoc}`;
                }
                if (titleElem) titleElem.textContent = data.title || "";
                // 处理 t-content，添加引用 tooltip
                if (contentElem) {
                    let contentHtml = data.con || "";
                    const refs = data.ref || [];

                    // 用正则匹配 [1], [2] ...
                    contentHtml = contentHtml.replace(/\[(\d+)\]/g, (match, num) => {
                        const index = parseInt(num, 10) - 1;
                        const refText = refs[index] || "未找到引用";

                        try {
                            // 尝试判断是否是链接
                            const url = new URL(refText);
                            return `<a href="${url.href}" target="_blank" rel="noopener noreferrer" style="display: inline-block;">${match}</a>`;
                        } catch (err) {
                            // 普通文本 → tooltip
                            return `<span class="ref-tooltip">${match}<span class="tooltip-box">${refText}</span></span>`;
                        }
                    });

                    contentElem.innerHTML = contentHtml;
                }
                document.addEventListener("click", (e) => {
                    const tooltip = e.target.closest(".ref-tooltip");
                    if (tooltip) {
                        const box = tooltip.querySelector(".tooltip-box");
                        if (box) {
                            // 切换 fixed 状态
                            box.classList.toggle("fixed");
                            e.stopPropagation(); // 阻止关闭逻辑
                        }
                    } else {
                        // 点击页面其他地方，关闭所有 fixed tooltip
                        document.querySelectorAll(".tooltip-box.fixed").forEach(box => box.classList.remove("fixed"));
                    }
                });
            })
            .catch(err => console.error("Error fetching history node:", err));
    });
});
