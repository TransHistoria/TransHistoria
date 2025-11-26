(function () {
  const canvas = document.getElementById('canvas');
  if (!canvas) return;

  let idCounter = 1;
  const regions = new Map();

  function createRegionElement(id) {
    const el = document.createElement('div');
    el.className = 'region pane';
    el.dataset.regionId = id;
    const ph = document.createElement('div');
    ph.className = 'placeholder';
    ph.textContent = '双击上传图片';
    el.appendChild(ph);
    el.addEventListener('click', e => { e.stopPropagation(); selectRegion(id); });
    el.addEventListener('dblclick', e => {
      e.stopPropagation();
      document.dispatchEvent(new CustomEvent('ce-region-dblclick', { detail: { id } }));
    });
    regions.set(id, { el, fillMode:'cover', image:null, imgEl:null, crop:{x:0,y:0,scale:1} });
    el.style.flex = '1 1 0%';
    el.style.minWidth = '0';
    el.style.minHeight = '0';
    return el;
  }

  let selectedId = null;
  function selectRegion(id){
    if(selectedId){
      const prev = findRegionEl(selectedId);
      if(prev) prev.classList.remove('selected');
    }
    selectedId = String(id);
    const cur = findRegionEl(selectedId);
    if(cur) cur.classList.add('selected');
    document.dispatchEvent(new CustomEvent('ce-region-select',{detail:{id:selectedId}}));
  }

  function findRegionEl(id){ const r = regions.get(String(id)); return r ? r.el : null; }

  function createRoot(){
    canvas.innerHTML='';
    idCounter = 1;
    regions.clear();
    selectedId = null;
    const rootId = String(idCounter++);
    const root = createRegionElement(rootId);
    root.style.width='100%';
    root.style.height='100%';
    canvas.appendChild(root);
    selectRegion(rootId);
    return rootId;
  }

  function splitRegion(id, dir){
    const el = findRegionEl(id);
    if(!el) return;

    const container = document.createElement('div');
    container.className = 'split ' + (dir==='vertical'?'vertical':'horizontal');
    container.style.display='flex';
    container.style.flexDirection = dir==='vertical'?'row':'column';
    container.style.width='100%';
    container.style.height='100%';
    container.style.minWidth='0';
    container.style.minHeight='0';
    container.style.flex='1 1 0%';

    const aId = String(idCounter++);
    const bId = String(idCounter++);
    const a = createRegionElement(aId);
    const b = createRegionElement(bId);

    const splitter = document.createElement('div');
    splitter.className = 'splitter ' + (dir==='vertical'?'vertical':'horizontal');
    splitter.innerHTML='<div class="handle"></div>';
    splitter.dataset.splitDir = dir;

    el.replaceWith(container);
    container.appendChild(a);
    container.appendChild(splitter);
    container.appendChild(b);

    initSplitter(splitter, container, dir);

    const meta = regions.get(String(id));
    if(meta && meta.image) attachImageToRegion(aId, meta.image.src, meta.fillMode);
    regions.delete(String(id));
    selectRegion(aId);
    return {aId,bId};
  }

  function initSplitter(splitter, container, dir){
    let dragging=false, startPos=0, startFlexA=1, startFlexB=1, pointerId=null;

    const handleMove = ev=>{
      if(!dragging||ev.pointerId!==pointerId) return;
      console.debug && console.debug('CE splitter move', dir, ev.clientX, ev.clientY);
      const now = dir==='vertical'?ev.clientX:ev.clientY;
      const delta = now-startPos;
      const rect = container.getBoundingClientRect();
      const totalSize = dir==='vertical'?rect.width:rect.height;
      let newFlexA = startFlexA + delta/totalSize;
      let newFlexB = startFlexB - delta/totalSize;
      const minFlex=0.1;
      if(newFlexA<minFlex) newFlexA=minFlex;
      if(newFlexB<minFlex) newFlexB=minFlex;
      const a = splitter.previousElementSibling;
      const b = splitter.nextElementSibling;
      a.style.flex=`${newFlexA} 1 0%`;
      b.style.flex=`${newFlexB} 1 0%`;
    };

    const handleUp = ev=>{
      if(!dragging||ev.pointerId!==pointerId) return;
      console.debug && console.debug('CE splitter up', dir, ev.clientX, ev.clientY);
      dragging=false;
      try{splitter.releasePointerCapture(pointerId);}catch(e){}
      document.removeEventListener('pointermove',handleMove);
      document.removeEventListener('pointerup',handleUp);
    };

    splitter.addEventListener('pointerdown', ev=>{
      if(dragging) return;
      console.debug && console.debug('CE splitter down', splitter, dir, ev.pointerId);
      ev.preventDefault();
      dragging=true;
      pointerId=ev.pointerId;
      splitter.setPointerCapture(pointerId);
      const a = splitter.previousElementSibling;
      const b = splitter.nextElementSibling;
      const aStyle = window.getComputedStyle(a);
      const bStyle = window.getComputedStyle(b);
      console.debug && console.debug('CE splitter', container, a, b);
      startFlexA=parseFloat(aStyle.flexGrow)||1;
      startFlexB=parseFloat(bStyle.flexGrow)||1;
      startPos = dir==='vertical'?ev.clientX:ev.clientY;
      document.addEventListener('pointermove', handleMove);
      document.addEventListener('pointerup', handleUp);
    });
  }

  function attachImageToRegion(id, src, fillMode='cover'){
    const meta = regions.get(String(id));
    if(!meta) return;
    meta.el.querySelectorAll('.placeholder').forEach(n=>n.remove());
    if(meta.imgEl){ meta.imgEl.remove(); meta.imgEl=null; }
    const img = new Image();
    img.className='img-el';
    img.draggable=false;
    img.src=src;
    img.onload = ()=>{
      meta.image = img;
      meta.fillMode = fillMode;
      meta.imgEl = img;
      // restore interactive transform-based behavior: position absolute + transform origin
      img.style.position = 'absolute';
      img.style.left = '0'; img.style.top = '0';
      img.style.transformOrigin = 'left top';
      img.style.willChange = 'transform';
      // append and initialize transform + interactions
      meta.el.appendChild(img);
      // ensure meta.crop exists
      if(!meta.crop) meta.crop = { x:0, y:0, scale:1 };
      updateImageTransform(meta);
      makeImageDraggable(img, meta);
    };
  }

  function updateImageTransform(meta){
    const img = meta.imgEl;
    if(!img) return;
    const crop = meta.crop || {x:0,y:0,scale:1};
    img.style.transform = `translate(${crop.x}px,${crop.y}px) scale(${crop.scale})`;
  }

  function makeImageDraggable(img, meta){
    let dragging=false,startX=0,startY=0,sx=0,sy=0,pointerId=null;

    const handleMove = ev=>{
      if(!dragging||ev.pointerId!==pointerId) return;
      const dx = ev.clientX-startX;
      const dy = ev.clientY-startY;
      meta.crop.x = sx + dx;
      meta.crop.y = sy + dy;
      updateImageTransform(meta);
    };
    const handleUp = ev=>{
      if(!dragging||ev.pointerId!==pointerId) return;
      dragging=false;
      try{img.releasePointerCapture(pointerId);}catch(e){}
      document.removeEventListener('pointermove',handleMove);
      document.removeEventListener('pointerup',handleUp);
    };
    img.addEventListener('pointerdown', ev=>{
      console.log(dragging);
      
      if(dragging) return;
      ev.preventDefault(); ev.stopPropagation();
      dragging=true; pointerId=ev.pointerId;
      img.setPointerCapture(pointerId);
      startX=ev.clientX; startY=ev.clientY;
      sx=meta.crop.x; sy=meta.crop.y;
      document.addEventListener('pointermove',handleMove);
      document.addEventListener('pointerup',handleUp);
    });
    img.addEventListener('wheel', ev=>{
      ev.preventDefault();
      meta.crop.scale = Math.max(0.1, meta.crop.scale - ev.deltaY*0.001);
      updateImageTransform(meta);
    });
  }

  // Note: cropping (translate/scale) behavior removed. Images are fitted via CSS object-fit.

  function removeImageFromRegion(id){
    const meta = regions.get(String(id));
    if(!meta) return;
    if(meta.imgEl){ meta.imgEl.remove(); meta.imgEl=null; meta.image=null; meta.nodeId=null; }
    if(!meta.el.querySelector('.placeholder')){
      const ph = document.createElement('div');
      ph.className='placeholder';
      ph.textContent='双击上传图片';
      meta.el.appendChild(ph);
    }
  }

  function deleteRegion(id){
    const el = findRegionEl(id);
    if(!el) return false;
    const parent = el.parentElement;
    // if direct child of canvas (root), replace with a new empty region
    if(parent === canvas){
      const newId = String(idCounter++);
      const newRegion = createRegionElement(newId);
      newRegion.style.width = el.style.width || '100%';
      newRegion.style.height = el.style.height || '100%';
      canvas.replaceChild(newRegion, el);
      regions.delete(String(id));
      selectRegion(newId);
      return true;
    }

    // if parent is a split container, replace the split with the sibling region
    if(parent && parent.classList && parent.classList.contains('split')){
      // find sibling region element
      let sibling = null;
      for(const ch of Array.from(parent.children)){
        if(ch === el) continue;
        if(ch.classList && ch.classList.contains('region')){ sibling = ch; break; }
      }
      if(!sibling){
        // nothing sensible to do, just remove
        el.remove();
        regions.delete(String(id));
        return true;
      }
      // keep sibling as-is (it already has a region id/meta)
      parent.replaceWith(sibling);
      sibling.style.flex = sibling.style.flex || '1 1 0%';
      regions.delete(String(id));
      selectRegion(sibling.dataset.regionId);
      return true;
    }

    // fallback: simply remove the element
    el.remove();
    regions.delete(String(id));
    return true;
  }

  function getRegionData(id){
    const meta = regions.get(String(id));
    if(!meta) return null;
    return { id, fillMode:meta.fillMode, src:meta.image?meta.image.src:null, rect:meta.el.getBoundingClientRect() };
  }
  // cropping API removed

  window.CERegions = {
    createRoot, splitRegion, attachImageToRegion, selectRegion,
    selectedId:()=>selectedId, removeImageFromRegion, getRegionData,
    regionsMap:regions,
    deleteRegion,
    initSplitterForReconstructed: initSplitter // expose for persistence layer
  };

  createRoot();
})();