document.addEventListener("DOMContentLoaded", () => {
    const the_item = document.querySelector('.timeline-item');
    const timeline = document.querySelector('.timeline');
    timeline.removeChild(the_item);
    fetch(`/api/get_timeline/`)
        .then(response => response.json())
        .then(all_timepoint => {
            all_timepoint.forEach(data => {
                const item = the_item.cloneNode(true);
                const yearElem = item;
                const imageElem = item.querySelector(".timeline__img");
                const titleElem = item.querySelector(".timeline__content-title");
                const aElem = item.querySelector(".timeline__details");
                const contentElem = item.querySelector(".timeline__content-desc");

                if (yearElem) yearElem.dataset.text = data.time_name || "";
                var imgsrc;
                if (data.cover){
                    imgsrc = `/media/${data.cover}`;
                } else {
                    imgsrc = "";
                }
                if (imageElem) imageElem.src = imgsrc;
                if (titleElem) titleElem.textContent = data.title || "";
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
                timeline.appendChild(item);
            })
        })
        .catch(err => console.error("Error fetching history node:", err))
        .then(() => {
            $("#timeline-1").timeline_scroll();
        });
});


(function ($) {
    $.fn.timeline_scroll = function () {
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
        console.log(selectors.item.first().find(selectors.img))
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

