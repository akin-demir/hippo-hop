const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map();
const context=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}});
const element=id=>{if(!elements.has(id))elements.set(id,{textContent:'',classList:{add(){},remove(){},toggle(){}},addEventListener(){},getBoundingClientRect:()=>({width:390,height:380,left:0,top:0}),getContext:()=>context});return elements.get(id);};
const sandbox={console,Math,Number,String,Promise,devicePixelRatio:1,localStorage:{getItem:()=>null,setItem(){}},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},performance:{now:()=>1000},document:{querySelector:()=>element('canvas'),getElementById:element,addEventListener(){},body:element('body'),documentElement:element('html')},window:{addEventListener(){},removeEventListener(){}}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(__dirname+'/game.js','utf8'),sandbox);
vm.runInContext(`
 if(difficulty(99).speed!==290||difficulty(100).speed!==310||difficulty(199).speed!==310||difficulty(200).speed!==330)throw Error('Speed milestone boundaries');
 if(difficulty(1100).speed<=difficulty(1000).speed)throw Error('Progression stopped after 1000');
 const originalRandom=Math.random;
 Math.random=()=>0;
 if(makeObstacle(99).type!=='rock'||makeObstacle(100).type!=='gorilla')throw Error('Primate unlock boundary');
 Math.random=()=>.5;
 if(makeObstacle(100).type!=='monkey')throw Error('Monkey never spawns');
 Math.random=originalRandom;
 start();
 if(flipAngle(0)!==0||Math.abs(flipAngle(.6)-Math.PI*2)>1e-10||Math.abs(flipAngle(.33)-Math.PI)>1e-10)throw Error('Flip rotation timing');
 for(let i=1;i<=3;i++){y=0;jump();if(flipJump!==(i===3)||vy!==600)throw Error('Every third jump flips with same physics');}
 finish();start();if(jumpCount!==0||flipJump)throw Error('Flip reset');
 jump();const first=vy;jump();if(vy!==first)throw Error('Double jump');
 state='running';distance=4000;obstacles=[];timer=0;y=0;vy=0;last=0;tick(16);
 if(speed!==310||level!==2||obstacles.length!==1)throw Error('100 XP tick progression');
 for(const type of ['monkey','gorilla']){
  state='running';y=0;vy=0;obstacles=[{x:Math.min(135,W*.22),w:54,h:62,type,phase:0}];tick(last+16);
  if(state!=='dead')throw Error(type+' collision missed');
  state='running';y=100;vy=0;obstacles=[{x:Math.min(135,W*.22),w:54,h:62,type,phase:0}];tick(last+16);
  if(state!=='running')throw Error(type+' cannot be jumped');
 }
 pause();const before=distance;tick(last+16);if(distance!==before)throw Error('Paused progression');
 start();if(state!=='running')throw Error('Resume failed');
 finish();start();if(distance!==0||speed!==290||level!==1||obstacles.length)throw Error('Restart reset');

 finish();start();
 if(jetpackSpawnXP<=200||jetpackSpawnXP>=300)throw Error('Spawn XP window');
 distance=200*40;updateJetpack(0);if(jetpack)throw Error('Early jetpack');
 distance=jetpackSpawnXP*40;updateJetpack(0);if(!jetpack)throw Error('No jetpack');
 jetpack.x=-50;updateJetpack(0);if(jetpack||flightStart!==null)throw Error('Missed pickup triggered flight');
 updateJetpack(0);if(jetpack)throw Error('Pickup respawned');
 finish();start();distance=220*40;jetpackSpawned=true;
 jetpack={x:Math.min(135,W*.22),z:H-145};updateJetpack(0);
 if(flightStart!==distance||jetpack)throw Error('Pickup contact');
 const flightOrigin=distance;
 state='running';timer=100;obstacles=[{x:Math.min(135,W*.22),w:54,h:62,type:'gorilla',phase:0}];tick(last+16);
 if(state!=='running')throw Error('Flight immunity on takeoff');
 distance=flightOrigin+2000;updateJetpack(0);if(y<100)throw Error('Flight height');
 const altitude=y;jump();if(y!==altitude||vy!==0)throw Error('Jump altered flight');
 pause();const pausedProgress=flightProgress();tick(last+16);if(flightProgress()!==pausedProgress)throw Error('Paused flight progressed');start();
 distance=flightOrigin+3999;updateJetpack(0);if(flightStart===null)throw Error('Flight ended before 100 XP');
 distance=flightOrigin+4000;updateJetpack(0);
 if(flightStart!==null||y!==0||landingShield<=0)throw Error('Flight landing');
 obstacles=[{x:Math.min(135,W*.22),w:54,h:62,type:'gorilla',phase:0}];tick(last+16);if(state!=='running')throw Error('Unsafe landing');
 obstacles=[];updateJetpack(1.1);if(landingShield!==0)throw Error('Shield never expires');
 finish();start();if(flightStart!==null||jetpack||jetpackSpawned||landingShield)throw Error('Jetpack restart reset');
 for(const width of [320,390,1000]){W=width;bg();drawPrimate({x:200,w:54,h:62,type:'gorilla',phase:0},H-75);}
`,sandbox);
console.log('PASS: jetpack spawn/pickup/miss, 100 XP flight, immunity, pause and reset;  XP boundaries, primate unlock and types, collision/jump clearance, pause/resume, restart, and drawing at 3 widths');
