import * as THREE from './vendor/three.module.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const finishHex={Sapphire:'#183d79',Silver:'#c2cbd8',Onyx:'#272c35'};

function wallpaperTexture(style='Aurora'){
  const canvas=document.createElement('canvas'); canvas.width=512; canvas.height=1024;
  const ctx=canvas.getContext('2d');
  const palettes={Aurora:['#030b21','#112b68','#8a62bd'],Ocean:['#061729','#0c5880','#53b8c6'],Ember:['#18091d','#783d69','#e6a56a'],Minimal:['#111c2b','#344e68','#a3bfd3']};
  const colors=palettes[style]||palettes.Aurora;
  let g=ctx.createLinearGradient(0,0,400,1024); colors.forEach((c,i)=>g.addColorStop(i/(colors.length-1),c)); ctx.fillStyle=g;ctx.fillRect(0,0,512,1024);
  for(let i=0;i<9;i++){
    ctx.save();ctx.translate(256,520);ctx.rotate(i*.37);ctx.beginPath();ctx.ellipse(0,110+i*22,135+i*18,460-i*20,-.4,0,Math.PI*2);
    ctx.strokeStyle=`rgba(205,225,255,${.13-i*.009})`;ctx.lineWidth=20+i*4;ctx.shadowColor='#81c8ff';ctx.shadowBlur=28;ctx.stroke();ctx.restore();
  }
  ctx.textAlign='center'; ctx.fillStyle='rgba(255,255,255,.94)';ctx.font='300 112px Arial';ctx.fillText('09:41',256,270);
  ctx.font='24px Arial';ctx.fillText('MONDAY · 28 SEPTEMBER',256,317);
  ctx.fillStyle='rgba(255,255,255,.5)';ctx.fillRect(218,979,76,5);
  let texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}
function box(w,h,d,r,mat){return new THREE.Mesh(new RoundedBoxGeometry(w,h,d,5,r),mat)}
function mat(color,metalness=.15,roughness=.32){return new THREE.MeshPhysicalMaterial({color,metalness,roughness,clearcoat:.65,clearcoatRoughness:.17})}

export class PhoneViewer{
 constructor(host,options={}){
  this.host=host;this.product=options.product||{};this.fallback=options.fallback||'/images/sovereign-pro.png';this.auto=!!options.auto;
  this.yaw=options.yaw??-.38;this.pitch=options.pitch??-.10;this.zoom=7.2;this.frameColor=this.product.colors?.[0]?.frame||'#98a9bb';this.bodyColor=this.product.colors?.[0]?.body||'#183d79';this.accentColor=this.product.colors?.[0]?.accent||'#d4b478';this.wallpaper='Aurora';this.background='Midnight';this.visible=true;this.moving=!document.documentElement.classList.contains('motion-off');this.pointers=new Map();this.hotspots=[];
  this._init();
 }
 _init(){
  this.host.classList.add('viewer-host');this.host.innerHTML='<div class="viewer-status" role="status">Preparing the 3D showroom…</div>';
  try{
   const probe=document.createElement('canvas'); if(!probe.getContext('webgl2')&&!probe.getContext('webgl'))throw new Error('WebGL is unavailable');
   this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(40,1,.1,100);this.camera.position.set(0,.05,this.zoom);
   this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power',preserveDrawingBuffer:true});
   this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.65;
   this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));this.renderer.domElement.className='viewer-canvas';
   this.renderer.domElement.setAttribute('tabindex','0');this.renderer.domElement.setAttribute('aria-label',`Rotate ${this.product.name||'Dialex phone'} in 3D. Drag or use arrow keys. Scroll or pinch to zoom.`);
   this.host.replaceChildren(this.renderer.domElement);
   this.overlay=document.createElement('div');this.overlay.className='hotspot-layer';this.host.append(this.overlay);
   this._lights();this._buildPhone();this._setHotspots();this._bind();
   this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(this.host);
   this.onMotion = event => {this.moving=event.detail;this._restartAnimation()};
   this.onVisibility = () => this._restartAnimation();
   window.addEventListener('portfolio-motion',this.onMotion);
   document.addEventListener('visibilitychange',this.onVisibility);
   this.intersectionObserver=new IntersectionObserver(entries=>{this.visible=entries[0]?.isIntersecting??true;this._restartAnimation()}, {threshold:.02});this.intersectionObserver.observe(this.host);
   this.resize();this._animate();this.host.dispatchEvent(new CustomEvent('viewer-ready'));
  }catch(err){this._error(err)}
 }
 _lights(){this.scene.add(new THREE.AmbientLight(0xb7c7ee,1.35));
  const a=new THREE.DirectionalLight(0xffffff,3.4);a.position.set(-3,5,7);this.scene.add(a);
  const b=new THREE.DirectionalLight(0x648cff,3);b.position.set(4,-2,-5);this.scene.add(b);
  const c=new THREE.PointLight(0xf2cc8c,65);c.position.set(2,3,3);this.scene.add(c);
 }
 _buildPhone(){
  const p=this.product; const fold=p.category==='Foldable';const w=fold?2.28:2.02,h=fold?4.08:4.32,d=.19;
  this.phone=new THREE.Group();this.scene.add(this.phone);
  this.frameMat=mat(this.frameColor,.82,.22);this.bodyMat=mat(this.bodyColor,.38,.27);this.ringMat=mat(this.accentColor,.82,.19);
  const frame=box(w,h,d,.18,this.frameMat);this.phone.add(frame);
  const back=box(w-.08,h-.08,.025,.14,this.bodyMat);back.position.z=-.105;this.phone.add(back);
  const backSheen=box(w-.12,h-.12,.006,.12,new THREE.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.07,roughness:.18,metalness:.12}));backSheen.position.z=-.121;this.phone.add(backSheen);
  const front=box(w-.075,h-.075,.022,.14,mat('#060b15',.2,.12));front.position.z=.108;this.phone.add(front);
  this.screenMat=new THREE.MeshBasicMaterial({map:wallpaperTexture(this.wallpaper),toneMapped:false});
  const screen=box(w-.17,h-.18,.006,.105,this.screenMat);screen.position.z=.126;this.phone.add(screen);
  const speaker=box(.24,.016,.004,.008,mat('#1c293a',.1,.5));speaker.position.set(0,h/2-.108,.133);this.phone.add(speaker);
  const selfie=new THREE.Mesh(new THREE.CircleGeometry(.033,22),new THREE.MeshBasicMaterial({color:0x030914}));selfie.position.set(0,h/2-.18,.132);this.phone.add(selfie);
  const cameraPlate=box(p.cameraCount===4?.88:.77,p.cameraCount===4?1.08:.91,.09,.13,mat('#141923',.48,.23));cameraPlate.position.set(-w/2+.48,h/2-.57,-.176);this.phone.add(cameraPlate);
  const lensPos=p.cameraCount===4?[[-.21,.30],[.21,.30],[-.21,-.18],[.21,-.18]]:[[-.18,.24],[.18,.24],[-.18,-.21]];
  lensPos.slice(0,p.cameraCount||3).forEach(([x,y])=>{
    const ring=new THREE.Mesh(new THREE.CylinderGeometry(.126,.126,.035,40),this.ringMat);ring.rotation.x=Math.PI/2;ring.position.set(cameraPlate.position.x+x,cameraPlate.position.y+y,-.239);this.phone.add(ring);
    const lens=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.038,40),mat('#071328',.35,.1));lens.rotation.x=Math.PI/2;lens.position.set(ring.position.x,ring.position.y,-.258);this.phone.add(lens);
    const glint=new THREE.Mesh(new THREE.SphereGeometry(.028,12,12),new THREE.MeshBasicMaterial({color:0x83aed5}));glint.scale.z=.17;glint.position.set(ring.position.x-.026,ring.position.y+.024,-.28);this.phone.add(glint);
  });
  const flash=new THREE.Mesh(new THREE.CircleGeometry(.034,20),new THREE.MeshBasicMaterial({color:0xe9dfbd}));flash.rotation.y=Math.PI;flash.position.set(cameraPlate.position.x+.18,cameraPlate.position.y-.22,-.227);this.phone.add(flash);
  for(const [y,length] of [[.72,.40],[-.31,.22]]){const button=box(.028,length,.1,.012,this.frameMat);button.position.set(w/2+.012,y,0);this.phone.add(button)}
  const mute=box(.026,.16,.08,.009,this.frameMat);mute.position.set(-w/2-.012,.84,0);this.phone.add(mute);
  const port=box(.36,.018,.11,.01,mat('#090d14',.1,.5));port.position.set(0,-h/2-.003,0);this.phone.add(port);
  for(let i=0;i<5;i++)for(const side of [-1,1]){const hole=box(.023,.008,.036,.004,mat('#101724',.1,.5));hole.position.set(side*(.37+i*.075),-h/2-.008,0);this.phone.add(hole)}
  const logoCanvas=document.createElement('canvas');logoCanvas.width=512;logoCanvas.height=128;
  let ctx=logoCanvas.getContext('2d');ctx.textAlign='center';ctx.fillStyle='#d4dce6';ctx.font='500 59px Arial';ctx.letterSpacing='16px';ctx.fillText('DIALEX',256,84);
  let logoTex=new THREE.CanvasTexture(logoCanvas);let logo=new THREE.Mesh(new THREE.PlaneGeometry(.87,.22),new THREE.MeshBasicMaterial({map:logoTex,transparent:true,side:THREE.DoubleSide,opacity:.72}));logo.rotation.y=Math.PI;logo.position.set(0,-.36,-.126);this.phone.add(logo);
  if(fold){const seam=box(.012,h-.15,.012,.006,mat('#333b54',.7,.34));seam.position.set(0,0,.135);this.phone.add(seam)}
 }
 _setHotspots(){
  const w=this.product.category==='Foldable'?2.28:2.02,h=this.product.category==='Foldable'?4.08:4.32;
  const list=[['Camera array',[-w/2+.48,h/2-.57,-.29],'back','Multi-lens imaging system'],['Display',[.47,.35,.16],'front',this.product.specs?.display||'OLED display'],['Side buttons',[w/2+.04,.55,.03],'side','Tactile power and volume controls'],['Frame',[w/2-.05,-.9,-.08],'side',this.product.specs?.materials||'Precision-finished frame'],['Charging port',[0,-h/2-.04,.02],'bottom','USB-C charging port'],['Speakers',[-.59,-h/2-.02,0],'bottom','Stereo speaker grille'],['Back panel',[.35,-.8,-.16],'back','Refined rear-panel finish']];
  this.hotspots=list.map(([label,pos,face,info])=>{
   const button=document.createElement('button');button.className='hotspot';button.type='button';button.title=label;button.setAttribute('aria-label',`Inspect ${label}`);button.innerHTML='<span></span>';button.addEventListener('click',()=>{this.host.dispatchEvent(new CustomEvent('hotspot',{detail:{label,info}}));});this.overlay.append(button);
   return {button,pos:new THREE.Vector3(...pos),face};
  });
 }
 _bind(){
  const c=this.renderer.domElement;
  c.addEventListener('pointerdown',e=>{c.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});this.auto=false;c.classList.add('dragging')});
  c.addEventListener('pointermove',e=>{if(!this.pointers.has(e.pointerId))return;const last=this.pointers.get(e.pointerId);
   if(this.pointers.size===1){this.yaw+=(e.clientX-last.x)*.009;this.pitch=clamp(this.pitch+(e.clientY-last.y)*.006,-1.17,1.17)}
   else {const others=[...this.pointers.entries()].filter(([id])=>id!==e.pointerId);if(others.length){const other=others[0][1];const before=Math.hypot(last.x-other.x,last.y-other.y);const after=Math.hypot(e.clientX-other.x,e.clientY-other.y);this.zoom=clamp(this.zoom-(after-before)*.012,4.8,10.5)}}
   this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});this.render();
  });
  const end=e=>{this.pointers.delete(e.pointerId);if(!this.pointers.size)c.classList.remove('dragging')};c.addEventListener('pointerup',end);c.addEventListener('pointercancel',end);
  c.addEventListener('wheel',e=>{e.preventDefault();this.zoom=clamp(this.zoom+Math.sign(e.deltaY)*.29,4.8,10.5);this.render()},{passive:false});
  c.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key)){e.preventDefault();this.auto=false;if(e.key==='ArrowLeft')this.yaw-=.14;if(e.key==='ArrowRight')this.yaw+=.14;if(e.key==='ArrowUp')this.pitch-=.1;if(e.key==='ArrowDown')this.pitch+=.1;if(e.key==='+')this.zoom=clamp(this.zoom-.3,4.8,10.5);if(e.key==='-')this.zoom=clamp(this.zoom+.3,4.8,10.5);this.render()}});
 }
 _restartAnimation(){
  cancelAnimationFrame(this.frame);this.frame=0;
  if(this.visible&&!document.hidden){this.render();this._animate()}
 }
 _animate(){
  if(this.frame||!this.visible||!this.renderer||!this.moving||document.hidden)return;
  const tick=()=>{
   this.frame=0;
   if(!this.visible||!this.moving||document.hidden)return;
   if(this.auto)this.yaw+=.003;
   this.render();this.frame=requestAnimationFrame(tick);
  };
  this.frame=requestAnimationFrame(tick);
 }
 render(){if(!this.renderer)return;this.phone.rotation.set(this.pitch,this.yaw,0);this.phone.position.y=!this.moving?0:Math.sin(performance.now()*.0011)*.045;this.camera.position.z=this.zoom;this.camera.lookAt(0,0,0);this.renderer.render(this.scene,this.camera);
  this.phone.updateWorldMatrix(true,false);
  for(const h of this.hotspots){let world=h.pos.clone().applyMatrix4(this.phone.matrixWorld),proj=world.clone().project(this.camera);
   let front=new THREE.Vector3(0,0,1).applyQuaternion(this.phone.quaternion).z;
   let visible=h.face==='front'?front>0.18:h.face==='back'?front<-.18:h.face==='side'?Math.abs(front)<.82:this.pitch<-.3;
   h.button.style.display=visible&&Math.abs(proj.x)<.94&&Math.abs(proj.y)<.94?'block':'none';h.button.style.left=`${(proj.x*.5+.5)*100}%`;h.button.style.top=`${(-proj.y*.5+.5)*100}%`;
  }
 }
 resize(){if(!this.renderer)return;const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false);this.render()}
 setFinish(color,roughness){this.bodyColor=color;this.bodyMat.color.set(color);this.bodyMat.roughness=roughness??.27;this.render()}
 setFrame(color){this.frameColor=color;this.frameMat.color.set(color);this.render()}
 setAccent(color){this.accentColor=color;this.ringMat.color.set(color);this.render()}
 setWallpaper(style){this.wallpaper=style;this.screenMat.map.dispose();this.screenMat.map=wallpaperTexture(style);this.screenMat.needsUpdate=true;this.render()}
 setBackground(style){this.background=style;this.host.dataset.background=style.toLowerCase()}
 reset(){this.yaw=-.38;this.pitch=-.10;this.zoom=7.2;this.auto=false;this.render()}
 toggleAuto(){this.auto=!this.auto;this._animate();return this.auto}
 fullscreen(){if(document.fullscreenElement===this.host)document.exitFullscreen();else this.host.requestFullscreen?.()}
 capture(){this.render();return this.renderer?.domElement.toDataURL('image/png')}
 _error(error){this.host.innerHTML=`<div class="viewer-fallback"><img src="${this.fallback}" alt="${this.product.name||'Dialex phone'} product preview"><p>3D viewing is unavailable on this device. You can still browse and shop.</p></div>`;this.host.dispatchEvent(new CustomEvent('viewer-error',{detail:{message:error.message}}))}
 dispose(){window.removeEventListener('portfolio-motion',this.onMotion);document.removeEventListener('visibilitychange',this.onVisibility);cancelAnimationFrame(this.frame);this.resizeObserver?.disconnect();this.intersectionObserver?.disconnect();this.renderer?.dispose();this.host.replaceChildren()}
}
