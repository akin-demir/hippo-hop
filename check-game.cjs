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
 if(makeObstacle(999).type!=='rock'||makeObstacle(1000).type!=='gorilla')throw Error('Primate unlock boundary');
 Math.random=()=>.5;
 if(makeObstacle(1000).type!=='monkey')throw Error('Monkey never spawns');
 Math.random=originalRandom;
 start();jump();const first=vy;jump();if(vy!==first)throw Error('Double jump');
 state='running';distance=40000;obstacles=[];timer=0;y=0;vy=0;last=0;tick(16);
 if(speed!==490||level!==11||obstacles.length!==1)throw Error('1000 XP tick progression');
 for(const type of ['monkey','gorilla']){
  state='running';y=0;vy=0;obstacles=[{x:Math.min(135,W*.22),w:54,h:62,type,phase:0}];tick(last+16);
  if(state!=='dead')throw Error(type+' collision missed');
  state='running';y=100;vy=0;obstacles=[{x:Math.min(135,W*.22),w:54,h:62,type,phase:0}];tick(last+16);
  if(state!=='running')throw Error(type+' cannot be jumped');
 }
 pause();const before=distance;tick(last+16);if(distance!==before)throw Error('Paused progression');
 start();if(state!=='running')throw Error('Resume failed');
 finish();start();if(distance!==0||speed!==290||level!==1||obstacles.length)throw Error('Restart reset');
 for(const width of [320,390,1000]){W=width;bg();drawPrimate({x:200,w:54,h:62,type:'gorilla',phase:0},H-75);}
`,sandbox);
console.log('PASS: XP boundaries, primate unlock and types, collision/jump clearance, pause/resume, restart, and drawing at 3 widths');
