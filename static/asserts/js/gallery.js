const galleryContEl = document.querySelector('.gallery-container');
const galleryEl = document.querySelector('.gallery');
let zoomedItem = null;
let timer;
let scrollTop = 0;

if (typeof CSS.registerProperty === 'function') {
    CSS.registerProperty({
        name: '--left',
        syntax: '<length>',
        inherits: false,
        initialValue: 0,
    });
    CSS.registerProperty({
        name: '--top',
        syntax: '<length>',
        inherits: false,
        initialValue: 0,
    });
    CSS.registerProperty({
        name: '--zoom',
        syntax: '<number>',
        inherits: false,
        initialValue: 1,
    });
}

galleryEl.addEventListener('click', function (e) {

    const item = e.target.closest('.gallery-item');

    const allGalleryCard = document.querySelectorAll('.gallery-item-card');
    allGalleryCard.forEach(elem => {
        elem.style.opacity = '1';
    })

    if (!item || zoomedItem === item) return;

    e.preventDefault();
    e.stopPropagation();

    const picW = item.offsetWidth;
    const picH = item.offsetHeight;
    const picCX = item.offsetLeft + picW / 2;
    const picCY = item.offsetTop + picH / 2;
    let { paddingLeft: itemPaddLeft, paddingRight: itemPaddRight } = getComputedStyle(item);
    itemPaddLeft = parseFloat(itemPaddLeft);
    itemPaddRight = parseFloat(itemPaddRight);
    const zoom = Math.min(
        (window.innerHeight - 30) / picH,
        (window.innerWidth - 30) / picW,
        // item.querySelector('img').naturalWidth / item.querySelector('img').offsetWidth,
    ) * 0.8;

    if (zoomedItem) {
        galleryEl.style.transitionProperty = '--left, --top, --zoom, transform-origin';
    } else {
        scrollTop = window.scrollY;
        galleryEl.style.top = -scrollTop + 'px';
    }

    galleryEl.style.transformOrigin = `${picCX}px ${picCY}px`;
    galleryEl.style.setProperty('--left', `${galleryEl.offsetWidth / 2 - picCX}px`);
    galleryEl.style.setProperty('--top', `${-item.offsetTop + scrollTop + (window.innerHeight - picH) / 2}px`);
    galleryEl.style.setProperty('--zoom', zoom);
    galleryContEl.classList.add('zoomed-in');
    document.getElementsByClassName('container nav')[0].classList.add('hidden');
    document.querySelector('footer').style.display = 'none';

    if (zoomedItem) zoomedItem.classList.remove('current');
    item.classList.add('current');
    zoomedItem = item;

    clearTimeout(timer);
    galleryContEl.style.overflow = 'hidden';
    galleryContEl.style.height = '100vh';
});

document.body.addEventListener('click', function (e) {
    if (!zoomedItem) return;
    
    const aElem = e.target.closest('a');
    if (aElem) {
        return;
    }

    const allGallery = document.querySelectorAll('.gallery-item');
    allGallery.forEach(elem => {
        const card = elem.querySelector('.gallery-item-card');
        card.style.opacity = '0';
        const body = elem.querySelector('.gallery-item-body');
        body.style.opacity = '0';
    });

    e.preventDefault();

    galleryContEl.classList.remove('zoomed-in');
    document.getElementsByClassName('container nav')[0].classList.remove('hidden');
    document.querySelector('footer').style.display = '';
    galleryEl.style.transitionProperty = '';
    galleryEl.style.setProperty('--left', '');
    galleryEl.style.setProperty('--top', '');
    galleryEl.style.setProperty('--zoom', '');

    zoomedItem.classList.remove('current');
    zoomedItem = null;

    clearTimeout(timer);
    timer = setTimeout(() => {
        galleryEl.style.top = 0;
        galleryContEl.style.overflow = '';
        galleryContEl.style.height = '';
        window.scrollTo(0, scrollTop);
    }, 800);
});

document.addEventListener("DOMContentLoaded", function() {
    fetch('/api/get_gallery_nodes/')
    .then(response => response.json())
    .then(data => {
        
        const gallery = document.querySelector('.gallery');
        data.forEach(item => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.style.setProperty('--frame', 'hsla(0, 0%, 0%, 0.6)');
            const imgsrc = `/media/${item.cover}`;
            const title = item.title;
            const card_l = 50;
            const card_con = item.con.length <= card_l ? item.con : item.con.substring(0, card_l) + '...';
            const body_l = 200;
            const body_con = item.con.length <= body_l ? item.con : item.con.substring(0, body_l) + '...';
            var display;
            if (item.details) {
                display = "block";
            } else {
                display = "none";
            }
            const href = `/archives/node/${item.id}`;
            galleryItem.innerHTML = `
                <div class="gallery-item-perspective" >
                    <div class="gallery-item-wrap">
                        <div class="gallery-item-overlay"></div>
                        <div style="position: relative;">
                            <img class="gallery-img"
                                src="${imgsrc}"
                                alt="" />
                            <div class="gallery-item-body">
                                <h2 class="gallery-item-body-title">${title}</h2>
                                <p class="gallery-item-body-time">时间：${item.time}年</p>
                                <p class="gallery-item-body-content">简介：${body_con}</p>
                                <a class="gallery-item-body-more" style="display: ${display};" href="${href}" target="_blank" rel="noopener noreferrer">了解更多→</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="gallery-item-card">
                    <h2 class="gallery-item-card-title">${title}</h2>
                    <p class="gallery-item-card-content">${card_con}</p>
                </div>
                <div class="gallery-item-strings-perspective">
                    <div class="gallery-item-strings"></div>
                </div>
            `;
            gallery.appendChild(galleryItem);
        });

        const allGallery = document.querySelectorAll('.gallery-item');
        allGallery.forEach(elem => {
            const card = elem.querySelector('.gallery-item-card');
            const body = elem.querySelector('.gallery-item-body');
            card.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                if (card.getAttribute('show_body') === 'true') {
                    body.style.opacity = '0';
                    card.setAttribute('show_body', 'false');
                    card.style.cursor = 'zoom-in';
                } else {
                    body.style.opacity = '1';
                    card.setAttribute('show_body', 'true');
                    card.style.cursor = 'zoom-out';
                }
            });
        });
    })
    .catch(error => console.error('Error fetching people nodes:', error));
});