const $=id=>document.getElementById(id);
function decision(){const w=Number($('growth').value)/100,a=9*w+4*(1-w),b=6*w+9*(1-w);$('growth-value').textContent=Math.round(w*100)+'%';$('startup-score').textContent=a.toFixed(1);$('steady-score').textContent=b.toFixed(1);$('startup-bar').style.width=a*10+'%';$('steady-bar').style.width=b*10+'%';$('decision-result').textContent=Math.abs(a-b)<.05?'A close call. Your priorities put both paths on equal footing.':a>b?'The ambitious leap leads with your current priorities.':'The steady path leads with your current priorities.';}
$('growth').addEventListener('input',decision);decision();
const examples=[{answer:'Inertia is the tendency of an object to resist a change in its state of motion.',source:'Velocity is the rate of change of displacement with time in a specified direction. Acceleration is the rate of change of velocity with time. ',after:' Force is an interaction that can change the motion of an object. Momentum is the product of mass and velocity.',passage:1},{answer:"Newton's first law states that an object remains at rest or in uniform straight-line motion unless acted upon by a net external force.",source:'',after:' A book resting on a desk remains stationary because the forces acting on it are balanced. An object moving without a net external force continues moving at constant velocity.',passage:2},{answer:"These sample notes do not contain information about DNA replication. There isn’t enough evidence here to answer reliably.",source:'This document covers motion, forces, energy and measurement.',after:'',passage:null}];
function answer(i){const x=examples[i];$('answer-text').textContent=x.answer;$('source-text').replaceChildren();$('source-text').append(document.createTextNode(x.source));if(x.passage){const mark=document.createElement('mark');mark.textContent=x.answer;$('source-text').append(mark,document.createTextNode(x.after));} $('citation').hidden=!x.passage;$('citation').textContent=`[1] Motion and forces · Passage ${x.passage} ↗`;$('source-pane').classList.remove('highlighted');document.querySelectorAll('[data-question]').forEach(b=>{const active=Number(b.dataset.question)===i;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});}
document.querySelectorAll('[data-question]').forEach(b=>b.addEventListener('click',()=>answer(Number(b.dataset.question))));$('citation').addEventListener('click',()=>{$('source-pane').classList.add('highlighted');$('source-pane').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});});answer(0);
// Keep the phone's network requests independent of the other case studies.
let phonePromise = null;
let phoneAttempt = 0;
export function loadPhonePreview() {
  if (phonePromise) return phonePromise;
  const suffix = phoneAttempt++ ? '?retry=' + phoneAttempt : '';
  phonePromise = (async () => {
    const [{PhoneViewer}, {calculatePrice}, response] = await Promise.all([
      import('./assets/dialex/viewer.js' + suffix),
      import('./assets/dialex/pricing.js' + suffix),
      fetch('./assets/dialex/catalogue.json')
    ]);
    if (!response.ok) throw new Error('Catalogue unavailable');
    const catalogue = await response.json();
    const original = catalogue.find(product => product.id === 'sovereign-pro');
    if (!original?.colors?.length) throw new Error('Phone configuration unavailable');
    const product = {...original, colors: [...original.colors].sort((a,b) =>
      (a.name === 'Platinum Silver' ? -1 : 0) - (b.name === 'Platinum Silver' ? -1 : 0))};
    const viewer = new PhoneViewer($('phone-viewer'), {
      product, fallback: './assets/dialex/sovereign-silver.webp', auto: false, yaw: Math.PI - .38
    });
    window.portfolioViewer = viewer;
    const money = value => 'Rs ' + value.toLocaleString('en-PK');
    function quote() {
      const finish = product.colors.find(color => color.name === $('finish').value);
      if (viewer.renderer) {
        viewer.frameMat.color.set(finish.frame);
        viewer.ringMat.color.set(finish.accent);
        viewer.setFinish(finish.body);
      }
      const result = calculatePrice(catalogue, [{
        id: product.id, finish: finish.name, ram: 12,
        storage: Number($('storage').value), qty: 1
      }], $('shipping').value, $('coupon').checked ? 'DIALEX10' : '');
      $('phone-price').textContent = money(result.subtotal);
      $('delivery-price').textContent = money(result.shippingFee);
      $('discount-price').textContent = '− ' + money(result.discount);
      $('total-price').textContent = money(result.total);
    }
    $('configuration').addEventListener('submit', event => event.preventDefault());
    $('configuration').addEventListener('change', quote);
    $('phone-reset').addEventListener('click', () => viewer.reset());
    $('phone-viewer').addEventListener('hotspot', event => {
      $('hotspot-info').textContent = event.detail.label + ' · ' + event.detail.info;
    });
    quote();
    return viewer;
  })().catch(error => {
    phonePromise = null;
    $('total-price').textContent = 'Preview unavailable';
    $('hotspot-info').textContent = 'The preview could not load. Use Retry preview above to try again.';
    throw error;
  });
  return phonePromise;
}
