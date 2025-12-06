const header = document.querySelector('header');
const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.menu');
toggle.addEventListener('click', () => {
    menu.classList.toggle('open');
    header.classList.toggle('open');
});
document.addEventListener("click", (e) => {
    const h = e.target.closest("header");
    if (h == null && menu.classList.contains("open")) {
        header.classList.remove("open");
        menu.classList.remove("open");
    }
});

const footer_searchButton = document.getElementById("footer_searchButton");
const footer_searchInput = document.getElementById("footer_searchInput");
footer_searchButton.addEventListener("click", () => {
    const url = "/archives/?input=" + footer_searchInput.value
    window.open(url);
});


document.addEventListener("DOMContentLoaded", () => {
    const toTw = OpenCC.Converter({ from: 'cn', to: 'tw' });
    const toCn = OpenCC.Converter({ from: 'tw', to: 'cn' });

    const langBtn = document.getElementById("lang-toggle");
    const fontBtn = document.getElementById("font-toggle");

    // 你可以换成自己项目的字体列表：
    const fonts = [
        "default"   // 系统默认字体
    ];

    // === 从 localStorage 恢复状态 ===
    let currentLang = localStorage.getItem("lang") || "cn";
    let currentFont = localStorage.getItem("font") || "default";

    // === 应用字体 ===
    function applyFont(font) {
        document.documentElement.style.setProperty("--app-font", font);
    }
    applyFont(currentFont);

    // === 简繁转换 ===
    function walkConvert(node, converter) {
        if (node.nodeType === Node.TEXT_NODE) {
            node.nodeValue = converter(node.nodeValue);
        } else {
            node.childNodes.forEach(n => walkConvert(n, converter));
        }
    }

    function convertPage(to) {
        if (to === "tw") {
            walkConvert(document.body, toTw);
            langBtn.textContent = "简体";
            currentLang = "tw";
        } else {
            walkConvert(document.body, toCn);
            langBtn.textContent = "繁體";
            currentLang = "cn";
        }
        localStorage.setItem("lang", currentLang);
    }

    // === 页面加载后根据 localStorage 自动恢复语言 ===
    if (currentLang === "tw") {
        convertPage("tw");
    } else {
        langBtn.textContent = "繁體";
    }

    // === 语言切换按钮 ===
    langBtn.addEventListener("click", () => {
        convertPage(currentLang === "cn" ? "tw" : "cn");
    });
});