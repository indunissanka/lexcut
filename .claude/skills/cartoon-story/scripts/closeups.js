// Close-ups of the monkey at given times, cropped around his computed screen position.
const path=require('path'),{chromium}=require('playwright');
(async()=>{const [,,html,out,times]=process.argv;const T=times.split(',').map(Number);
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:900}});
await p.addInitScript(()=>{window.__RENDER=1;let f=0;window.__setT=v=>{f=v};performance.now=()=>f;const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(()=>cb(f));});
await p.goto('file://'+path.resolve(html));await p.waitForTimeout(300);
const fs=[];for(const [i,t] of T.entries()){await p.evaluate(ms=>new Promise(r=>{__setT(ms);requestAnimationFrame(()=>requestAnimationFrame(r));}),t*1000);
  const pos=await p.evaluate(t=>{const c=crocAt(t),m=monkeyAt(t,c),cam=camAt(t,c);return [800+(m.x-cam.x)*cam.z,450+(m.y-70-cam.y)*cam.z,cam.z];},t);
  const sz=Math.round(230*pos[2]);const x=Math.max(0,Math.min(1600-sz,Math.round(pos[0]-sz/2))),y=Math.max(0,Math.min(900-sz,Math.round(pos[1]-sz/2)));
  const f=`${out}_${i}.png`;await p.screenshot({path:f,clip:{x,y,width:sz,height:sz}});fs.push(f);}
await b.close();
require('child_process').execSync(`python3 -c "
from PIL import Image
fs='${fs.join(',')}'.split(',');m=Image.new('RGB',(320*len(fs),320))
for i,f in enumerate(fs): m.paste(Image.open(f).resize((320,320)),(i*320,0))
m.save('${out}.png')"`);})();
