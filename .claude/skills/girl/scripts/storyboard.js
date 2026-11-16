const path=require('path'),{chromium}=require('playwright');
(async()=>{const [,,html,out,times]=process.argv;const T=times.split(',').map(Number);
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:800,height:450}});
  await p.addInitScript(()=>{let f=0;window.__setT=v=>{f=v};performance.now=()=>f;const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(()=>cb(f));});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve(html));await p.waitForTimeout(400);
  const files=[];for(const [i,t] of T.entries()){await p.evaluate(ms=>new Promise(r=>{__setT(ms);requestAnimationFrame(()=>requestAnimationFrame(r));}),t*1000);
    const f=`${out}_${i}.png`;await p.screenshot({path:f});files.push(f);}
  console.log(errs.length?errs.slice(0,5):'no errors');await b.close();
  require('child_process').execSync(`python3 -c "
from PIL import Image,ImageDraw
fs='${files.join(',')}'.split(',');ts='${times}'.split(',')
ims=[Image.open(f) for f in fs];c=4;r=(len(ims)+c-1)//c;m=Image.new('RGB',(800*c,450*r),'black')
for i,im in enumerate(ims):
  d=ImageDraw.Draw(im);d.rectangle([0,0,70,22],fill='black');d.text((6,5),ts[i]+'s',fill='yellow');m.paste(im,((i%c)*800,(i//c)*450))
m.save('${out}.png')"`);})();
