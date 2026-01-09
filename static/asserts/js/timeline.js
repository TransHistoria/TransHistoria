document.addEventListener("DOMContentLoaded", () => {
    const the_item = document.querySelector('.timeline-item');
    const timeline = document.querySelector('.timeline');
    timeline.removeChild(the_item);

    // 获取菜单按钮和面板
    const menuBtn = document.getElementById('menuBtn');
    const menuPanel = document.getElementById('menuPanel');
    const menuItems = document.getElementById('menuItems');

    // 菜单按钮点击事件
    menuBtn.addEventListener('click', function() {
        this.classList.toggle('active');
        menuPanel.classList.toggle('active');

        // 当菜单打开时，禁用背景滚动
        if (menuPanel.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
            // 防止触摸事件穿透到底层，但允许菜单区域滚动
            document.body.addEventListener('touchmove', preventBodyScroll, { passive: false });
        } else {
            document.body.style.overflow = '';
            document.body.removeEventListener('touchmove', preventBodyScroll);
        }
    });

    // 阻止背景的默认触摸事件，但允许菜单区域滚动
    function preventBodyScroll(e) {
        // 检查触摸事件是否发生在菜单区域内
        const menuItems = document.getElementById('menuItems');
        const isTouchInsideMenu = menuItems.contains(e.target);

        // 如果不在菜单区域内，阻止默认滚动行为
        if (!isTouchInsideMenu) {
            e.preventDefault();
        }
    }

    // 点击面板外部关闭目录
    document.addEventListener('click', function(event) {
        const isClickInside = menuPanel.contains(event.target) || menuBtn.contains(event.target);

        if (!isClickInside && menuPanel.classList.contains('active')) {
            menuBtn.classList.remove('active');
            menuPanel.classList.remove('active');
            document.body.style.overflow = '';
            document.body.removeEventListener('touchmove', preventBodyScroll);
        }
    });

    // 获取时间线数据并生成目录
    fetch(`/api/get_timeline/`)
        .then(response => response.json())
        .then(all_timepoint => {
            // 生成目录
            all_timepoint.forEach((data, index) => {
                // 创建目录项
                const menuItem = document.createElement('div');
                menuItem.className = 'menu-item';
                menuItem.textContent = `${data.time_name} - ${data.title}` || `时间点 ${index + 1}`;

                // 为每个时间线项目添加唯一ID以便跳转
                const itemId = `timeline-item-${index}`;

                // 点击目录项时跳转到对应时间线项目并关闭目录
                menuItem.addEventListener('click', function() {
                    const targetItem = document.querySelector(`.${itemId}`);
                    if (targetItem) {
                        targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });

                        // 激活目标项目
                        document.querySelectorAll('.timeline-item').forEach(item => {
                            item.classList.remove('timeline-item--active');
                        });
                        targetItem.classList.add('timeline-item--active');

                        // 关闭目录
                        menuBtn.classList.remove('active');
                        menuPanel.classList.remove('active');

                        // 恢复背景滚动
                        document.body.style.overflow = '';
                        document.body.removeEventListener('touchmove', preventBodyScroll);
                    }
                });

                menuItems.appendChild(menuItem);
            });

            // 创建时间线项目
            all_timepoint.forEach((data, index) => {
                const item = the_item.cloneNode(true);
                // 添加唯一ID
                item.classList.add(`timeline-item-${index}`);

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
                if (data.details) {
                    aElem.style.display = "block";
                    aElem.href = `/archives/node/${data.id}`;
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

