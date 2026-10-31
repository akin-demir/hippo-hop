'use strict';
const canvas=document.querySelector('canvas'),c=canvas.getContext('2d'),$=id=>document.getElementById(id);
let W=1000,H=410,dpr=1,state='ready',distance=0,speed=290,y=0,vy=0,obstacles=[],timer=1.8,last=0,clock=0,best=0,lastShake=0,motionEnabled=false,sensorSeen=false,motionTimer;
let level=1,jumpStyle=-1,jumpAge=0,landing=0,particles=[],levelFlash=0;
let playMode=false,nativeWasFull=false,ambientClock=0,cheer=0,crashAge=0;
function enterPlay(native=true){
 if(!playMode){playMode=true;document.body.classList.add('playing');resize();}
 if(native&&!document.fullscreenElement){const request=document.documentElement.requestFullscreen;if(request){try{Promise.resolve(request.call(document.documentElement)).catch(()=>{});}catch{}}}
}
function exitPlay(){
 playMode=false;document.body.classList.remove('playing');if(state==='running'){state='paused';ui();}
 if(document.fullscreenElement&&document.exitFullscreen){try{Promise.resolve(document.exitFullscreen()).catch(()=>{});}catch{}}
 resize();
}
document.addEventListener('fullscreenchange',()=>{if(document.fullscreenElement){nativeWasFull=true;resize();}else if(nativeWasFull){nativeWasFull=false;exitPlay();}});
$('exitPlay').addEventListener('click',exitPlay);$('expand').addEventListener('click',()=>enterPlay());
function difficulty(score){return {level:Math.min(5,1+Math.floor(score/100)),speed:Math.min(570,290+score*.6),gap:Math.max(.98,1.65-score*.0015)};}
function burst(x,z,count,spark=false){for(let i=0;i<count;i++){const life=.3+Math.random()*.35;particles.push({x,z,vx:-30-Math.random()*100,vy:-25-Math.random()*100,life,total:life,size:2+Math.random()*4,spark});}}
function drawEffects(){for(const p of particles){c.save();c.globalAlpha=p.life/p.total;if(p.spark){c.strokeStyle='#b69b47';c.lineWidth=2;c.beginPath();c.moveTo(p.x-p.size,p.z);c.lineTo(p.x+p.size,p.z);c.moveTo(p.x,p.z-p.size);c.lineTo(p.x,p.z+p.size);c.stroke();}else ellipse(p.x,p.z,p.size,p.size*.7,'#c0bb93');c.restore();}
}

try{best=Number(localStorage.getItem('hippo-hop-best'))||0;}catch{} $('best').textContent=String(best).padStart(5,'0');
function resize(){const r=canvas.getBoundingClientRect();W=r.width;H=Math.max(320,r.height);dpr=Math.min(devicePixelRatio||1,2);canvas.width=W*dpr;canvas.height=r.height*dpr;c.setTransform(dpr,0,0,dpr*r.height/H,0,0);}window.addEventListener('resize',resize);resize();
function ellipse(x,z,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,z,rx,ry,0,0,Math.PI*2);c.fill();}
function round(x,z,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,z,w,h,r);c.fill();}
function hippo(x,z,t,active){
 const stride=t*(13+(speed-290)*.015),bounce=active?Math.abs(Math.sin(stride))*3:0,air=y>1;
 const airBeat=Math.sin(Math.min(1,jumpAge/.75)*Math.PI);
 const tilt=state==='dead'?Math.sin(crashAge*10)*.12:air?airBeat*[-.12,.15,-.2,.1,-.28,.3,-.16,.16][jumpStyle]:active?Math.sin(t*4)*.025:0;
 const face=air?jumpStyle:cheer>0?6:Math.floor(t/2.8)%4;
 c.save();c.translate(x,z-bounce);c.rotate(tilt);
 const squash=landing>0?Math.sin(landing/.16*Math.PI)*.13:0;c.scale(1+squash,1-squash);
 if(air)c.scale(1-airBeat*.035,1+airBeat*.05);
 function leg(px,phase,far){
  const swing=active?Math.sin(stride+phase):0,lift=active?Math.max(0,Math.cos(stride+phase))*7:0;
  c.save();c.translate(px,-19);// Lift the foot during its forward recovery; plant it while sweeping backward.
  const aerial=jumpStyle===5?-1.45:jumpStyle===4?(px>0?-1.4:.5):jumpStyle===7?Math.sin(jumpAge*24+phase)*.9:jumpStyle===6?(px>0?-1.1:.7):((jumpStyle===2?-.95:-.4)+(px>0?.25:-.25)*airBeat);
  c.rotate(-swing*.65+(air?aerial:0));
  round(-7,0,14,25-lift,6,far?'#6d858c':'#8c9fa5');
  round(-8,20-lift,22,9,4,far?'#536e76':'#647e85');
  c.strokeStyle=far?'#84999d':'#afbfbd';c.lineWidth=1.5;
  for(let j=0;j<3;j++){c.beginPath();c.moveTo(3+j*4,24-lift);c.lineTo(3+j*4,28-lift);c.stroke();}
  c.restore();
 }
 c.strokeStyle='#536846';c.lineWidth=4;c.beginPath();c.moveTo(-36,-29);c.quadraticCurveTo(-52,-40+Math.sin(stride)*3,-45,-48);c.stroke();
 leg(-23,Math.PI,true);leg(20,0,true);
 ellipse(-5,-32,42,29,'#8c9fa5');ellipse(-13,-40,26,16,'#9eafb2');
 leg(-28,0,false);leg(19,Math.PI,false);
 ellipse(27,-39,26,27,'#98abb0');const earWiggle=Math.sin((air?jumpAge*24:t*9))*2;ellipse(16,-65+earWiggle,9,11,'#859ba0');ellipse(16,-65+earWiggle,4,6,'#b8c2bc');ellipse(40,-62-earWiggle,8,9,'#8dA3a6');round(22,-44,42,29,12,'#a8babc');ellipse(52,-37,3,2,'#647d80');ellipse(40,-37,3,2,'#647d80');c.strokeStyle='#263f3d';c.lineWidth=2;
 const blink=!air&&t%3.6<.12,goofy=air||cheer>0;
 if(state==='dead'){
  for(const px of [29,39]){c.beginPath();c.moveTo(px-3,-55);c.lineTo(px+3,-48);c.moveTo(px+3,-55);c.lineTo(px-3,-48);c.stroke();}
 }else if(goofy&&face===6){
  for(const px of [29,39]){c.fillStyle='#c67585';c.beginPath();c.moveTo(px,-48);c.bezierCurveTo(px-10,-54,px-2,-59,px,-54);c.bezierCurveTo(px+4,-61,px+10,-53,px,-48);c.fill();}
 }else if(blink||face===0&&goofy){c.beginPath();c.moveTo(27,-50);c.quadraticCurveTo(31,-57,35,-50);c.stroke();}
 else if(face===1){c.beginPath();c.moveTo(27,-52);c.lineTo(34,-50);c.stroke();}
 else{ellipse(31,-51,3,goofy&&face===3?5:4,'#263f3d');ellipse(32,-52,1,1,'white');}
 if(state==='dead'){ellipse(48,-23,8,5,'#475c59');round(47,-24,6,10,3,'#dfa2ab');}
 else if(goofy){
  if(face===3){ellipse(49,-24,5,7,'#475c59');ellipse(50,-22,2,3,'#d9a9a0');}
  else if(face===5){ellipse(49,-23,12,8,'#b7c6c4');c.beginPath();c.moveTo(44,-24);c.lineTo(52,-24);c.stroke();}
  else{ellipse(48,-24,10,7,'#475c59');round(42,-30,12,4,1,'#f7f4df');ellipse(49,-21,6,3,'#d68f97');if(face===1||face===7)round(48,-23,7,9,3,'#e3a0a4');}
 }else if(face===2){ellipse(51,-23,3,3,'#647d7d');}
 else{c.strokeStyle='#617d7d';c.lineWidth=1.5;c.beginPath();c.moveTo(41,-23);c.quadraticCurveTo(49,-19,55,-24);c.stroke();}
 ellipse(28,-32,6,4,goofy?'#d5aaa1':'#c0b2a6');
 if(active&&face===2){c.strokeStyle='#698679';c.lineWidth=1.5;c.beginPath();c.moveTo(62,-32);c.lineTo(69,-35);c.moveTo(66,-22);c.lineTo(74,-22);c.stroke();}
 if(state==='dead'){for(let i=0;i<3;i++){const angle=ambientClock*4+i*Math.PI*2/3;ellipse(24+Math.cos(angle)*26,-82+Math.sin(angle)*5,3,2,'#c7a252');}}
 c.restore();
}
function bg(){c.clearRect(0,0,W,H);c.fillStyle='#eaf0d9';c.fillRect(0,0,W,H);const ground=H-75;ellipse(W*.78,114,37,37,'#e4e9b7');c.fillStyle='#dce5c5';c.beginPath();c.moveTo(0,ground-65);for(let x=0;x<=W+30;x+=20)c.lineTo(x,ground-70+Math.sin(x/150+1)*18);c.lineTo(W,H);c.lineTo(0,H);c.fill();c.fillStyle='#ccdaba';c.beginPath();c.moveTo(0,ground-35);for(let x=0;x<=W+30;x+=20)c.lineTo(x,ground-32+Math.sin(x/100)*11);c.lineTo(W,H);c.lineTo(0,H);c.fill();c.fillStyle='#bfcfaa';c.fillRect(0,ground-13,W,14);c.fillStyle='#ecedd6';c.fillRect(0,ground,W,H-ground);c.strokeStyle='#a3b78a';c.lineWidth=1;c.beginPath();c.moveTo(0,ground);c.lineTo(W,ground);c.stroke();for(let i=0;i<18;i++){let x=((i*89-distance*.5)% (W+90)+W+90)%(W+90)-20;let z=ground+12+(i%3)*17;c.strokeStyle='#c6caae';c.beginPath();c.moveTo(x,z);c.lineTo(x+7+(i%3)*3,z);c.stroke();}for(let i=0;i<5;i++){let x=((i*263-distance*.17)%(W+200)+W+200)%(W+200)-50;let z=ground-14;c.strokeStyle='#8fa879';c.lineWidth=2;c.beginPath();c.moveTo(x,z);c.lineTo(x-5,z-17);c.moveTo(x,z);c.lineTo(x+3,z-23);c.moveTo(x,z);c.lineTo(x+9,z-13);c.stroke();}for(let i=0;i<3;i++){let x=(i*340+170-distance*.05)%(W+300);round(x,100+i*27,60,6,4,'#f6f7e8');round(x+13,94+i*27,30,9,4,'#f6f7e8');}}
function drawObstacle(o){let g=H-75;if(o.type==='rock'){ellipse(o.x+o.w/2,g-3,o.w*.56,5,'#bac3a0');c.fillStyle='#8b9981';c.beginPath();c.moveTo(o.x,g);c.lineTo(o.x+3,g-o.h*.6);c.lineTo(o.x+o.w*.35,g-o.h);c.lineTo(o.x+o.w*.75,g-o.h*.9);c.lineTo(o.x+o.w,g);c.closePath();c.fill();c.strokeStyle='#aeba9e';c.beginPath();c.moveTo(o.x+8,g-o.h*.55);c.lineTo(o.x+o.w*.36,g-o.h*.8);c.lineTo(o.x+o.w*.64,g-o.h*.72);c.stroke();}else{round(o.x,g-o.h,o.w,o.h,7,'#8a7856');ellipse(o.x+o.w-3,g-o.h/2,6,o.h/2,'#b1a078');ellipse(o.x+o.w-3,g-o.h/2,3,o.h/2-5,'#8d7952');c.strokeStyle='#b2a27c';c.beginPath();c.moveTo(o.x+6,g-o.h+7);c.lineTo(o.x+o.w-12,g-o.h+9);c.stroke();}}
function ui(){ $('overlay').classList.toggle('hidden',state==='running');$('pause').textContent=state==='paused'?'▶':'Ⅱ';if(state==='dead'){$('message').textContent='One more little hop?';$('sub').textContent=`You made it to ${Math.floor(distance*.025)}. The riverbank is calling.`;$('start').innerHTML='Run again <span>↗</span>';}else if(state==='paused'){$('message').textContent='Take a little breather.';$('sub').textContent='Your adventure will be right here.';$('start').innerHTML='Keep running <span>↗</span>';} $('runStatus').textContent=state==='running'?'●  FIND YOUR RHYTHM':state==='dead'?'●  A GOOD RUN. A FRESH START.':state==='paused'?'●  TAKING A BREATHER':'●  YOUR NEXT ADVENTURE AWAITS';}
function start(){enterPlay();if(state==='paused'){state='running';ui();return;}distance=0;speed=290;y=0;vy=0;timer=1.7;obstacles=[];level=1;jumpAge=0;landing=0;particles=[];levelFlash=0;cheer=0;crashAge=0;state='running';$('level').textContent='LV 1 · EASY DOES IT';$('score').textContent='00000';ui();}
function jump(){if(state!=='running')return;if(y<1){vy=600;y=.1;jumpAge=0;jumpStyle=(jumpStyle+1+Math.floor(Math.random()*7))%8;burst(Math.min(135,W*.22),H-75,10);burst(Math.min(135,W*.22)+25,H-125,5,true);}}
function finish(){if(state==='dead')return;state='dead';crashAge=0;const score=Math.floor(distance*.025);if(score>best){best=score;try{localStorage.setItem('hippo-hop-best',best);}catch{}$('best').textContent=String(best).padStart(5,'0');}ui();}
function tick(now){
 const dt=Math.min((now-last)/1000||0,.035);last=now;ambientClock+=dt;if(state==='dead')crashAge+=dt;
 if(state==='running'){
  clock+=dt;cheer=Math.max(0,cheer-dt);distance+=speed*dt;
  const d=difficulty(Math.floor(distance*.025));speed=d.speed;
  if(d.level!==level){level=d.level;levelFlash=2;cheer=1.2;burst(Math.min(135,W*.22)+20,H-150,12,true);}
  $('level').textContent='LV '+level+' · '+['','EASY DOES IT','FIND YOUR FLOW','PICKING UP SPEED','WILD STRIDE','HIPPO HUSTLE'][level];
  levelFlash=Math.max(0,levelFlash-dt);landing=Math.max(0,landing-dt);
  if(y>0)jumpAge+=dt;
  const wasAirborne=y>0;vy-=1600*dt;y+=vy*dt;
  if(y<0){y=0;vy=0;if(wasAirborne){cheer=.65;landing=.16;burst(Math.min(135,W*.22),H-75,12);}}
  for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.z+=p.vy*dt;p.vy+=180*dt;}particles=particles.filter(p=>p.life>0);
  timer-=dt;
  if(timer<=0){const rock=Math.random()<.65;obstacles.push({x:W+50,w:rock?30+Math.random()*(13+level):48+Math.random()*level*2,h:rock?30+Math.random()*(12+level*2):29+level*2,type:rock?'rock':'log'});timer=d.gap+Math.random()*.65;}
  const hx=Math.min(135,W*.22);
  for(const o of obstacles){o.x-=speed*dt;if(!o.cleared&&o.x+o.w<hx-35){o.cleared=true;cheer=.8;burst(hx+22,H-140,5,true);}if(hx+48>o.x+4&&hx-30<o.x+o.w-3&&y<o.h-7){finish();break;}}
  obstacles=obstacles.filter(o=>o.x+o.w>0);$('score').textContent=String(Math.floor(distance*.025)).padStart(5,'0');
 }
 bg();const hx=Math.min(135,W*.22),g=H-75;ellipse(hx+3,g+6,43*(1-y/500),5,'#b5c0a0');hippo(hx,g-9-y,clock,state==='running'&&y===0);obstacles.forEach(drawObstacle);drawEffects();requestAnimationFrame(tick);
}requestAnimationFrame(tick);
$('start').addEventListener('click',start);
function hitsHippo(clientX,clientY){
 const rect=canvas.getBoundingClientRect();
 const px=(clientX-rect.left)*W/rect.width-Math.min(135,W*.22);
 const pz=(clientY-rect.top)*H/rect.height-(H-84-y);
 // Generous silhouette targets include the head, body, snout, and moving feet.
 return (px+5)**2/54**2+(pz+32)**2/39**2<=1
  ||(px-28)**2/37**2+(pz+40)**2/39**2<=1
  ||(px>=15&&px<=74&&pz>=-56&&pz<=-5)
  ||(px>=-42&&px<=42&&pz>=-23&&pz<=18);
}
canvas.addEventListener('pointerdown',e=>{
 if(e.isPrimary===false||(e.button!==undefined&&e.button!==0)||!hitsHippo(e.clientX,e.clientY))return;
 e.preventDefault();
 if(state==='running')jump();else start();
});
function pause(){if(state==='running'){state='paused';ui();}else if(state==='paused')start();}
$('pause').addEventListener('click',pause);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='running'){state='paused';ui();}});
// Motion permission must be requested directly inside a button's click handler on iOS.
let gravity=null,peakMotion=0,lastSensorUi=0,motionPending=false;
function motionStatus(message,label){
 $('motionStatus').textContent=message;
 const badge=$('motionBadge');if(badge)badge.textContent=label||message;
}
function onMotion(e){
 const a=e.acceleration,g=e.accelerationIncludingGravity;
 const valid=v=>v&&['x','y','z'].some(k=>Number.isFinite(v[k]));
 if(!valid(a)&&!valid(g))return;
 const first=!sensorSeen;sensorSeen=true;
 if(first){clearTimeout(motionTimer);$('motion').textContent='Shake settings ↗';$('motionQuick').textContent='Test shake';}
 const vec=v=>['x','y','z'].map(k=>Number.isFinite(v?.[k])?v[k]:0);
 const gv=vec(g);
 // Some browsers supply only accelerationIncludingGravity. Remove a slowly
 // changing gravity baseline, rather than assuming a fixed orientation/sign.
 if(!gravity&&valid(g))gravity=gv.slice();
 const linear=valid(a)?vec(a):gv.map((v,i)=>v-gravity[i]);
 if(valid(g))gravity=gravity.map((v,i)=>v*.94+gv[i]*.06);
 const strength=Math.hypot(...linear),now=performance.now();
 peakMotion=Math.max(peakMotion,strength);
 if(now-lastSensorUi>150||first){
  $('motionMeter').value=Math.min(25,strength);
  motionStatus('Sensor connected. Give your phone a quick upward shake to hop.','Sensor live · '+strength.toFixed(1)+' m/s²');lastSensorUi=now;
 }
 const threshold=Number($('sensitivity').max)+3-Number($('sensitivity').value);
 if(strength>threshold&&now-lastShake>450){
  lastShake=now;motionStatus('Shake detected! Start a run to hop.','Shake detected ✓');
  if(state==='running')jump();
 }
}
async function enableMotion(){
 $('settings').classList.add('open');
 if(state==='running'){state='paused';ui();}
 if(motionPending)return false;
 const Motion=window.DeviceMotionEvent;
 if(!window.isSecureContext){motionStatus('Motion needs HTTPS. Open https://akin-demir.github.io/hippo-hop/ directly in your phone browser.','HTTPS required');return false;}
 if(!Motion){motionStatus('This browser does not expose motion sensors. Open this page directly in Safari on iPhone or Chrome on Android.','Motion unavailable');return false;}
 motionPending=true;motionStatus('Requesting motion access…','Requesting access…');
 try{
  // Do not await anything before this call: Safari requires the original tap.
  if(typeof Motion.requestPermission==='function'){
   const permission=await Motion.requestPermission();
   if(permission!=='granted'){motionStatus('Motion permission was denied. Allow Motion & Orientation access in your browser settings, then try again. Tap controls still work.','Permission denied');return false;}
  }
  window.removeEventListener('devicemotion',onMotion);
  sensorSeen=false;gravity=null;peakMotion=0;
  window.addEventListener('devicemotion',onMotion,{passive:true});motionEnabled=true;
  $('motion').textContent='Retry / test motion ↗';$('motionQuick').textContent='Test / retry shake';
  motionStatus('Listening for sensors. Android usually starts without a permission popup. Move your phone to test.','Waiting for sensor…');
  clearTimeout(motionTimer);motionTimer=setTimeout(()=>{
   if(!sensorSeen){motionEnabled=false;motionStatus('No sensor data received. Open this link directly in Safari or Chrome, not an in-app preview. On Android, allow Site settings → Motion sensors. Then tap Enable shake again.','No sensor data — retry');}
  },5000);
  return true;
 }catch(error){motionEnabled=false;motionStatus('Motion access failed ('+(error?.name||'browser restriction')+'). Open directly in Safari or Chrome and check motion permissions.','Motion blocked');return false;
 }finally{motionPending=false;}
}
$('motion').addEventListener('click',enableMotion);
$('motionQuick').addEventListener('click',enableMotion);
$('shakeStart').addEventListener('click',()=>{enterPlay(false);enableMotion().then(ok=>{if(ok)start();});});

// Keep mobile long presses inside the game from opening selection or image menus.
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('dragstart',e=>e.preventDefault());
