const items = document.querySelectorAll('.t-item');
const style = document.createElement('style');
let active_set = new Set();
let pre_active_set = new Set();
// const hdiv = document.createElement('div');

const unactive_scale = 1;
const pre_active_scale = 1.2;
const active_scale = 1.4;
const margin_scale = 1.3;
const padding_scale = 1.2;

// 按顺序交替添加 left / right
items.forEach((item, index) => {

  item.classList.add('index_' + index);

  if (index % 2 === 0) {
    item.classList.add('left');
  } else {
    item.classList.add('right');
  }

  const card = item.firstElementChild.firstElementChild
  style.textContent += `.t-item.index_${index} .t-card { height: ${card.scrollHeight}px }\n\n`;
  style.textContent += `.t-item.index_${index} { height: ${card.scrollHeight + 40}px }\n\n`;

});

document.head.appendChild(style);

// let last_index = -1;

function add_height(index, classname) {
  const card = items[index].firstElementChild.firstElementChild.firstElementChild;
  const card_rule = `.t-item.index_${index}.${classname} .t-card { height: ${card.scrollHeight}px }`;
  style.sheet.insertRule(card_rule, style.sheet.cssRules.length);
  if(classname === 'active'){
    const item_rule = `.t-item.index_${index}.${classname} { height: ${40 + padding_scale*margin_scale*(active_scale * card.scrollHeight)}px }`;
    style.sheet.insertRule(item_rule, style.sheet.cssRules.length);
  }else if(classname === 'pre-active'){
    const item_rule = `.t-item.index_${index}.${classname} { height: ${40 + margin_scale*(pre_active_scale * card.scrollHeight)}px }`;
    style.sheet.insertRule(item_rule, style.sheet.cssRules.length);
  }
}

function checkVisible() {

  const viewportCenter = window.innerHeight / 2;
  let closestIndex = -1;
  let minDistance = Infinity;

  // 找最近的卡片 index
  items.forEach((item, index) => {
    const rect = item.getBoundingClientRect();
    const itemCenter = rect.top + rect.height / 2;
    const distance = Math.abs(viewportCenter - itemCenter);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  // if (closestIndex !== last_index) {
  // 清空所有状态
  items.forEach(item => {
    item.classList.remove('active', 'pre-active');
  });
  if (closestIndex !== -1) {
    // 中心卡片加 active
    items[closestIndex].classList.add('active');
    if (active_set.has(closestIndex) === false) {
      add_height(closestIndex, 'active');
      active_set.add(closestIndex);
    }

    // 前一个加 pre-active
    if (closestIndex - 1 >= 0) {
      items[closestIndex - 1].classList.add('pre-active');
      if (pre_active_set.has(closestIndex - 1) === false) {
        add_height(closestIndex - 1, 'pre-active');
        pre_active_set.add(closestIndex - 1);
      }
    }

    // 后一个加 pre-active
    if (closestIndex + 1 < items.length) {
      items[closestIndex + 1].classList.add('pre-active');
      if (pre_active_set.has(closestIndex + 1) === false) {
        add_height(closestIndex + 1, 'pre-active');
        pre_active_set.add(closestIndex + 1);
      }
    }
  }
  // last_index = closestIndex;
  // }

}

window.addEventListener('scroll', checkVisible);
window.addEventListener('load', checkVisible);
checkVisible();