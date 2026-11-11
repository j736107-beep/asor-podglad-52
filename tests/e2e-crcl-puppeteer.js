/* 11.11.2026: pole CrCl/eGFR w ZP – sama liczba (bez „auto:”), czarna, 2–3 cyfry mieszczą się (390 px i desktop).
   BASE=http://localhost:8765/ SHOTS=/workspace/fix_crcl node e2e-crcl-puppeteer.js */
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://localhost:8765/',SHOTS=process.env.SHOTS||'';let n=0,fail=0;function ok(c,m,d){n++;console.log((c?'PASS ':'FAIL ')+m+(c||!d?'':' — '+String(d).slice(0,300)));if(!c)fail++;}
(async()=>{const br=await puppeteer.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox'],headless:'new'});
 for(const vp of [{w:390,h:844,m:true,n:'mobile-390'},{w:1280,h:900,m:false,n:'desktop-1280'}]){
  const page=await br.newPage();await page.setViewport({width:vp.w,height:vp.h,isMobile:vp.m,hasTouch:vp.m,deviceScaleFactor:vp.m?2:1});const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(BASE,{waitUntil:'networkidle0'});await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.reload({waitUntil:'networkidle0'});
  await page.evaluate(()=>document.querySelector('#side [data-id="cap"]').click());await sleep(600);
  await page.evaluate(()=>[...document.querySelectorAll('#main button')].find(b=>/Antybiotykoterapia/.test(b.textContent)).click());await sleep(1200);
  const zf=page.frames().find(f=>/mod\/zp/.test(f.url()));
  const typ=async(id,v)=>zf.evaluate((id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},id,v);
  await zf.evaluate(()=>document.querySelector('[data-sex="m"]').click());
  const M=async()=>zf.evaluate(()=>{const e=document.getElementById('crclManual');const cs=getComputedStyle(e),ps=getComputedStyle(e,'::placeholder');const c=document.createElement('canvas').getContext('2d');c.font=ps.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
   const avail=e.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);const r=e.getBoundingClientRect();return{ph:e.placeholder,color:ps.color,tw:c.measureText(e.placeholder).width,avail:avail,inView:r.left>=0&&r.right<=innerWidth};});
  for(const [age,w,cr,exp] of [[70,80,1.2,'65'],[40,85,0.8,'148']]){await typ('age',String(age));await typ('w',String(w));await typ('crea',String(cr));await sleep(300);
   const m=await M();
   ok(m.ph===exp&&!/auto/i.test(m.ph),vp.n+': CrCl '+exp+' – sama liczba, bez „auto:”',m.ph);
   ok(m.color==='rgb(0, 0, 0)',vp.n+': liczba czarna',m.color);
   ok(m.tw<=m.avail&&m.inView,vp.n+': '+exp+' mieści się w polu ('+m.tw.toFixed(0)+' ≤ '+m.avail.toFixed(0)+' px)',JSON.stringify(m));
   if(SHOTS){require('fs').mkdirSync(SHOTS,{recursive:true});await zf.evaluate(()=>document.getElementById('crclManual').scrollIntoView({block:'center'}));await sleep(200);await page.screenshot({path:SHOTS+'/crcl-'+vp.n+'-'+exp+'.png'});}}
  // 3-cyfrowe 150 (test szerokości przez wpis ręczny)
  await typ('crclManual','150');await sleep(200);const v=await zf.evaluate(()=>{const e=document.getElementById('crclManual');return{sw:e.scrollWidth,cw:e.clientWidth,col:getComputedStyle(e).color};});
  ok(v.sw<=v.cw+1,vp.n+': wpisane ręcznie 150 mieści się',JSON.stringify(v));await typ('crclManual','');
  ok(!errs.length,vp.n+': brak błędów JS',errs.join('|'));await page.close();}
 await br.close();console.log((n-fail)+'/'+n+(fail?' FAIL':' PASS'));process.exit(fail?1:0);})();
