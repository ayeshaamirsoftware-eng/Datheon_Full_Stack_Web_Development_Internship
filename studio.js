(()=>{
const root=document.documentElement,reduce=matchMedia('(prefers-reduced-motion: reduce)'),button=document.getElementById('motion-toggle');let on=!reduce.matches;try{if(localStorage.getItem('ayesha-studio-motion')==='off')on=false}catch{}
function motion(){root.classList.toggle('motion-off',!on);root.classList.toggle('js-motion',on);button.textContent=on?'Motion on':'Motion off';button.setAttribute('aria-pressed',String(on));window.dispatchEvent(new CustomEvent('portfolio-motion',{detail:on}));if(!on)document.querySelectorAll('.reveal').forEach(e=>e.classList.add('visible'))}motion();button.addEventListener('click',()=>{on=!on;try{localStorage.setItem('ayesha-studio-motion',on?'on':'off')}catch{}motion()});reduce.addEventListener('change',e=>{on=!e.matches;motion()});
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(e=>observer.observe(e));
const wave=document.querySelector('feDisplacementMap');let current=0,target=0;const role=document.querySelector('.role');role.addEventListener('pointermove',e=>{if(on&&e.pointerType==='mouse')target=16+(e.offsetX/role.clientWidth)*12});role.addEventListener('pointerleave',()=>target=0);let raf;function ripple(){current+=(target-current)*.08;wave.setAttribute('scale',on?current.toFixed(2):0);if(Math.abs(current-target)>.03)raf=requestAnimationFrame(ripple);else raf=null}role.addEventListener('pointermove',()=>{if(!raf)ripple()});role.addEventListener('pointerleave',()=>{if(!raf)ripple()});
document.querySelectorAll('.project-visual').forEach(card=>{card.addEventListener('pointermove',e=>{if(!on||e.pointerType!=='mouse')return;const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform=`rotateX(${-y*3}deg) rotateY(${x*4}deg)`});card.addEventListener('pointerleave',()=>card.style.transform='')});
window.addEventListener('intro-finished',()=>{if(on){current=32;target=0;if(!raf)ripple()}});
let experiencePromise = null, experienceAttempt = 0, returnFocus = null;
function loadExperience() {
  if (!experiencePromise) {
    const suffix = experienceAttempt++ ? '?retry=' + experienceAttempt : '';
    experiencePromise = import('./experience.js' + suffix).catch(error => {
      experiencePromise = null;
      throw error;
    });
  }
  return experiencePromise;
}
async function prepareCase(dialog) {
  let status = dialog.querySelector('.case-load-status');
  if (!status) {
    status = document.createElement('div');
    status.className = 'case-load-status';
    status.setAttribute('role', 'status');
    dialog.querySelector('.dialog-head').after(status);
  }
  status.hidden = false;
  status.textContent = 'Preparing the interactive preview…';
  dialog.setAttribute('aria-busy', 'true');
  try {
    const experience = await loadExperience();
    if (dialog.id === 'case-2') {
      const viewer = await experience.loadPhonePreview();
      requestAnimationFrame(() => viewer.resize());
    }
    status.hidden = true;
  } catch (error) {
    status.textContent = 'The preview could not load. Check your connection and try again.';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Retry preview';
    retry.addEventListener('click', async () => {
      await prepareCase(dialog);
      if (status.hidden && dialog.open) dialog.querySelector('.close-case').focus();
    });
    status.append(retry);
    console.warn('Interactive preview unavailable.', error);
  } finally {
    dialog.removeAttribute('aria-busy');
  }
}
document.querySelectorAll('[data-case]').forEach(trigger => trigger.addEventListener('click', () => {
  returnFocus = trigger;
  const dialog = document.getElementById('case-' + trigger.dataset.case);
  dialog.showModal();
  document.body.style.overflow = 'hidden';
  prepareCase(dialog);
}));
document.querySelectorAll('.case-dialog').forEach(dialog => {
  const close = () => dialog.close();
  dialog.querySelector('.close-case').addEventListener('click', close);
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
    }
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
    returnFocus?.focus();
  });
});
document.querySelectorAll('.expertise-item').forEach(e=>{e.setAttribute('aria-pressed','false');e.addEventListener('click',()=>{document.querySelectorAll('.expertise-item').forEach(x=>{const active=x===e;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active))});window.dispatchEvent(new CustomEvent('portfolio-focus',{detail:Number(e.dataset.focus)}))})});
})();
