(()=>{
const root=document.documentElement,loader=document.getElementById('opening-loader'),skip=document.getElementById('skip-intro'),stage=document.getElementById('loader-stage'),fill=document.getElementById('load-track-fill'),main=document.querySelector('main'),header=document.querySelector('.site-header');let cancelled=false;const animations=[];const wait=ms=>new Promise(r=>setTimeout(r,ms));
function release(){main.inert=false;header.inert=false}
function finish(){cancelled=true;animations.forEach(a=>a.cancel());clearTimeout(window.introSafety);release();root.classList.remove('intro-active','intro-typing','loader-exiting','writing-greeting','shape-revealing');root.classList.add('intro-revealed');loader.hidden=true;window.dispatchEvent(new Event('intro-finished'))}
skip.addEventListener('click',finish);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&root.classList.contains('intro-active'))finish()});
if(!root.classList.contains('intro-active')){finish();return}
try{if(localStorage.getItem('ayesha-studio-motion')==='off'){finish();return}}catch{}
main.inert=true;header.inert=true;matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches)finish()});window.addEventListener('intro-emergency-finish',finish);
const paths=[...document.querySelectorAll('.pen-stroke')];paths.forEach(p=>{const length=p.getTotalLength();p.style.strokeDasharray=length;p.style.strokeDashoffset=length});
(async()=>{await Promise.race([document.fonts.ready,wait(1800)]);if(cancelled)return;fill.style.width='100%';stage.textContent='A little introduction.';await wait(300);if(cancelled)return;root.classList.add('writing-greeting');
const total=paths.reduce((n,p)=>n+p.getTotalLength(),0);for(const path of paths){if(cancelled)return;const length=path.getTotalLength(),duration=Math.max(35,length/total*3700);const animation=path.animate([{strokeDashoffset:length},{strokeDashoffset:0}],{duration,easing:'linear',fill:'forwards'});animations.push(animation);await animation.finished}
if(cancelled)return;stage.textContent='Thoughtful ideas. Working products.';await wait(850);if(cancelled)return;root.classList.add('shape-revealing');await wait(850);if(cancelled)return;finish();})().catch(()=>{if(!cancelled)finish()});
})();
