const the_item = document.querySelector('.timeline-item');
const timeline = document.querySelector('.timeline');
for (let i = 0; i < 7; i++) {
    timeline.appendChild(the_item.cloneNode(true));
}
timeline.removeChild(the_item);
const ids = [12,13,16,18,14,19,20]


document.addEventListener("DOMContentLoaded", () => {
    // 找到所有 t-item
    const items = document.querySelectorAll(".timeline .timeline-item");
    let i = 0;
    items.forEach(item => {

        const randomIndex = Math.floor(Math.random() * ids.length);
        const id = ids[i]; // 随机获取 t-id

        // 请求后端数据
        fetch(`/api/historynode/${id}/`)  // 假设你的 Django URL 是 /api/historynode/<id>/
            .then(response => response.json())
            .then(data => {
                // 更新前端
                const titleElem = item;
                const imageElem = item.querySelector(".timeline__img");
                const yearElem = item.querySelector(".timeline__content-title");
                const aElem = item.querySelector(".timeline__details");
                const contentElem = item.querySelector(".timeline__content-desc");

                if (titleElem) titleElem.dataset.text = data.title || "";
                const randomIndex = Math.floor(Math.random() * 7) + 1;
                if (imageElem) imageElem.src = `/static/asserts/images/index/${randomIndex}.jpg` || "";
                if (yearElem) yearElem.textContent = data.time || "";
                if (data.mkdoc) {
                    aElem.style.display = "block";
                    aElem.href = `/detail/${data.mkdoc}`;
                }

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
        i = i + 1;
    });
});


(function ($) {
    $.fn.timeline = function () {
        var selectors = {
            id: $(this),
            item: $(this).find(".timeline-item"),
            activeClass: "timeline-item--active",
            img: ".timeline__img"
        };
        selectors.item.eq(0).addClass(selectors.activeClass);
        selectors.id.css(
            "background-image",
            "url(" + selectors.item.first().find(selectors.img).attr("src") + ")"
        );
        var itemLength = selectors.item.length;
        const viewportCenter = window.innerHeight / 2;
        $(window).scroll(function () {
            var max, min;
            var pos = $(this).scrollTop();
            selectors.item.each(function (i) {
                min = $(this).offset().top;
                max = $(this).height() + $(this).offset().top;
                var that = $(this);
                if (i == itemLength - 2 && pos > min + 1 * $(this).height() / 2) {
                    selectors.item.removeClass(selectors.activeClass);
                    selectors.id.css(
                        "background-image",
                        "url(" + selectors.item.last().find(selectors.img).attr("src") + ")"
                    );
                    selectors.item.last().addClass(selectors.activeClass);
                    console.log(1)
                } else if (pos <= max - 40 && pos + viewportCenter / 2 >= min) {
                    selectors.id.css(
                        "background-image",
                        "url(" + $(this).find(selectors.img).attr("src") + ")"
                    );
                    selectors.item.removeClass(selectors.activeClass);
                    $(this).addClass(selectors.activeClass);
                }
            });
        });
    };
})(jQuery);

$("#timeline-1").timeline();
