// 手指位置
let touchStartY = 0;


function initScrollEffect() {
  const indexContainer = document.getElementById('index-container');
  const topElement = document.getElementById('top-element');

  if (!indexContainer || !topElement) {
    console.error('缺少必要的元素');
    return;
  }

  const topHeight = topElement.offsetHeight;
  let topHidden = false; // 是否已经隐藏了 top

  // 监听滚轮
  window.addEventListener('wheel', (e) => {
    const atTop = window.scrollY <= 0;

    // 向下滚且 top 还在，则立即隐藏
    if (e.deltaY > 10 && !topHidden) {
      hideTop();
      return;
    }

    // 向上滚且已经隐藏了，并且在页面顶部，则显示
    if (e.deltaY < 10 && atTop && topHidden) {
      showTop();
      return;
    }
  }, { passive: false }); // 不阻止页面滚动

  // 手机触摸：同样行为
  window.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    touchStartY = touch.clientY;
  }, { passive: true });
  
  window.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    const touchEndY = touch.clientY;
    const deltaY = touchEndY - touchStartY;
    const atTop = window.scrollY <= 0;
    // 向上滑动且 top 还在，则隐藏
    if (deltaY < -10 && !topHidden) {
      hideTop();
      return;
    }
    // 向下滑动且已经隐藏了，并且在页面顶部，则显示
    if (deltaY > 10 && atTop && topHidden) {
      showTop();
      return;
    }
  }, { passive: false }); // 不阻止页面滚动

  // ------- 操作函数 -------
  function hideTop() {
    topHidden = true;
    topElement.style.transition = "transform .4s ease";
    topElement.style.transform = `translateY(-${topHeight}px)`;
  }

  function showTop() {
    topHidden = false;
    topElement.style.transition = "transform .4s ease";
    topElement.style.transform = `translateY(0)`;
  }
}
