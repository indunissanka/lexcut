// Render frames [from,to) of the story to an MP4 part (frozen time, exact frames).
const path=require('path'),{spawn}=require('child_process'),{chromium}=require('playwright');
const [,,html,out,from,to,fps='30']=process.argv;
(async()=>{
  const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',fps,'-c:v','png','-i','-',
    '-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-r',fps,out],{stdio:['pipe','inherit','inherit']});
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
  await p.addInitScript(()=>{window.__RENDER=1;let f=0;window.__setT=v=>{f=v};performance.now=()=>f;
    const raf=window.requestAnimationFrame.bind(window);window.requestAnimationFrame=cb=>raf(()=>cb(f));});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve(html));await p.waitForTimeout(500);
  const t0=Date.now();
  for(let i=+from;i<+to;i++){
    await p.evaluate(ms=>new Promise(r=>{__setT(ms);requestAnimationFrame(()=>requestAnimationFrame(r));}),i*1000/+fps);
    const buf=await p.screenshot({type:'png'});
    if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));
    if((i-from)%300===0)console.log(`${out}: frame ${i} (${((Date.now()-t0)/1000).toFixed(0)}s)`);
  }
  ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();
  console.log(`${out} done in ${((Date.now()-t0)/1000).toFixed(0)}s`, errs.length?errs:'');
})();
