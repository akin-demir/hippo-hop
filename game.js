'use strict';
const canvas=document.querySelector('canvas'),c=canvas.getContext('2d'),$=id=>document.getElementById(id);
let W=1000,H=410,dpr=1,state='ready',distance=0,speed=290,y=0,vy=0,obstacles=[],timer=1.8,last=0,clock=0,best=0,lastShake=0,motionEnabled=false,sensorSeen=false,motionTimer;
try{best=Number(localStorage.getItem('hippo-hop-best'))||0;}catch{} $('best').textContent=String(best).padStart(5,'0');
function resize(){const r=canvas.getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=W*dpr;canvas.height=H*dpr;c.setTransform(dpr,0,0,dpr,0,0);}window.addEventListener('resize',resize);resize();
function ellipse(x,z,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,z,rx,ry,0,0,Math.PI*2);c.fill();}
function round(x,z,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,z,w,h,r);c.fill();}
function hippo(x,z,t,active){
 const stride=t*13,bounce=active?Math.abs(Math.sin(stride))*3:0;
 c.save();c.translate(x,z-bounce);
 function leg(px,phase,far){
  const swing=active?Math.sin(stride+phase):0,lift=active?Math.max(0,Math.cos(stride+phase))*7:0;
  c.save();c.translate(px,-19);c.rotate(swing*.65+(y>1?-.35:0));
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
 ellipse(27,-39,26,27,'#98abb0');ellipse(16,-65,9,11,'#859ba0');ellipse(16,-65,4,6,'#b8c2bc');ellipse(40,-62,8,9,'#8dA3a6');round(22,-44,42,29,12,'#a8babc');ellipse(52,-37,3,2,'#647d80');ellipse(40,-37,3,2,'#647d80');ellipse(31,-51,3,4,'#263f3d');ellipse(32,-52,1,1,'white');c.strokeStyle='#617d7d';c.lineWidth=1.5;c.beginPath();c.moveTo(41,-23);c.quadraticCurveTo(49,-19,55,-24);c.stroke();ellipse(28,-32,6,4,'#c0b2a6');c.restore();
}
function bg(){c.clearRect(0,0,W,H);c.fillStyle='#eaf0d9';c.fillRect(0,0,W,H);const ground=H-75;ellipse(W*.78,114,37,37,'#e4e9b7');c.fillStyle='#dce5c5';c.beginPath();c.moveTo(0,ground-65);for(let x=0;x<=W+30;x+=20)c.lineTo(x,ground-70+Math.sin(x/150+1)*18);c.lineTo(W,H);c.lineTo(0,H);c.fill();c.fillStyle='#ccdaba';c.beginPath();c.moveTo(0,ground-35);for(let x=0;x<=W+30;x+=20)c.lineTo(x,ground-32+Math.sin(x/100)*11);c.lineTo(W,H);c.lineTo(0,H);c.fill();c.fillStyle='#bfcfaa';c.fillRect(0,ground-13,W,14);c.fillStyle='#ecedd6';c.fillRect(0,ground,W,H-ground);c.strokeStyle='#a3b78a';c.lineWidth=1;c.beginPath();c.moveTo(0,ground);c.lineTo(W,ground);c.stroke();for(let i=0;i<18;i++){let x=((i*89-distance*.5)% (W+90)+W+90)%(W+90)-20;let z=ground+12+(i%3)*17;c.strokeStyle='#c6caae';c.beginPath();c.moveTo(x,z);c.lineTo(x+7+(i%3)*3,z);c.stroke();}for(let i=0;i<5;i++){let x=((i*263-distance*.17)%(W+200)+W+200)%(W+200)-50;let z=ground-14;c.strokeStyle='#8fa879';c.lineWidth=2;c.beginPath();c.moveTo(x,z);c.lineTo(x-5,z-17);c.moveTo(x,z);c.lineTo(x+3,z-23);c.moveTo(x,z);c.lineTo(x+9,z-13);c.stroke();}for(let i=0;i<3;i++){let x=(i*340+170-distance*.05)%(W+300);round(x,100+i*27,60,6,4,'#f6f7e8');round(x+13,94+i*27,30,9,4,'#f6f7e8');}}
function drawObstacle(o){let g=H-75;if(o.type==='rock'){ellipse(o.x+o.w/2,g-3,o.w*.56,5,'#bac3a0');c.fillStyle='#8b9981';c.beginPath();c.moveTo(o.x,g);c.lineTo(o.x+3,g-o.h*.6);c.lineTo(o.x+o.w*.35,g-o.h);c.lineTo(o.x+o.w*.75,g-o.h*.9);c.lineTo(o.x+o.w,g);c.closePath();c.fill();c.strokeStyle='#aeba9e';c.beginPath();c.moveTo(o.x+8,g-o.h*.55);c.lineTo(o.x+o.w*.36,g-o.h*.8);c.lineTo(o.x+o.w*.64,g-o.h*.72);c.stroke();}else{round(o.x,g-o.h,o.w,o.h,7,'#8a7856');ellipse(o.x+o.w-3,g-o.h/2,6,o.h/2,'#b1a078');ellipse(o.x+o.w-3,g-o.h/2,3,o.h/2-5,'#8d7952');c.strokeStyle='#b2a27c';c.beginPath();c.moveTo(o.x+6,g-o.h+7);c.lineTo(o.x+o.w-12,g-o.h+9);c.stroke();}}
function ui(){ $('overlay').classList.toggle('hidden',state==='running');$('pause').textContent=state==='paused'?'▶':'Ⅱ';if(state==='dead'){$('message').textContent='One more little hop?';$('sub').textContent=`You made it to ${Math.floor(distance*.025)}. The riverbank is calling.`;$('start').innerHTML='Run again <span>↗</span>';}else if(state==='paused'){$('message').textContent='Take a little breather.';$('sub').textContent='Your adventure will be right here.';$('start').innerHTML='Keep running <span>↗</span>';} $('runStatus').textContent=state==='running'?'●  FIND YOUR RHYTHM':state==='dead'?'●  A GOOD RUN. A FRESH START.':state==='paused'?'●  TAKING A BREATHER':'●  YOUR NEXT ADVENTURE AWAITS';}
function start(){if(state==='paused'){state='running';ui();return;}distance=0;speed=290;y=0;vy=0;timer=1.7;obstacles=[];state='running';$('score').textContent='00000';ui();}
function jump(){if(state!=='running')return;if(y<1){vy=600;y=.1;}}
function finish(){state='dead';const score=Math.floor(distance*.025);if(score>best){best=score;try{localStorage.setItem('hippo-hop-best',best);}catch{}$('best').textContent=String(best).padStart(5,'0');}ui();}
function tick(now){let dt=Math.min((now-last)/1000||0,.035);last=now;if(state==='running'){clock+=dt;distance+=speed*dt;speed=Math.min(570,290+distance*.004);vy-=1600*dt;y+=vy*dt;if(y<0){y=0;vy=0;}timer-=dt;if(timer<=0){const rock=Math.random()<.65;obstacles.push({x:W+50,w:rock?30+Math.random()*13:48,h:rock?30+Math.random()*12:29,type:rock?'rock':'log'});timer=1.25+Math.random()*.9;}const hx=Math.min(135,W*.22);for(const o of obstacles){o.x-=speed*dt;if(hx+48>o.x+4&&hx-30<o.x+o.w-3&&y<o.h-7)finish();}obstacles=obstacles.filter(o=>o.x+o.w>0);$('score').textContent=String(Math.floor(distance*.025)).padStart(5,'0');}bg();const hx=Math.min(135,W*.22),g=H-75;ellipse(hx+3,g+6,43*(1-y/500),5,'#b5c0a0');hippo(hx,g-9-y,clock,state==='running'&&y===0);obstacles.forEach(drawObstacle);requestAnimationFrame(tick);}requestAnimationFrame(tick);
$('start').addEventListener('click',start);canvas.addEventListener('pointerdown',e=>{e.preventDefault();if(state==='ready'||state==='dead')start();else if(state==='paused')start();else jump();});function pause(){if(state==='running'){state='paused';ui();}else if(state==='paused')start();}$('pause').addEventListener('click',pause);document.addEventListener('keydown',e=>{if(e.target.matches('button,input'))return;if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();if(e.repeat)return;if(state==='running')jump();else start();}if(e.code==='Escape')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='running'){state='paused';ui();}});
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
  lastShake=now;motionStatus('Shake detected! Tap “Let’s run” if you have not started.','Shake detected ✓');
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
$('shakeStart').addEventListener('click',()=>{enableMotion().then(ok=>{if(ok)start();});});
