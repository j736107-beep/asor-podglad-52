const puppeteer=require('puppeteer-core');
const BASE=process.env.BASE||'http://localhost:8765/';
let fails=0;function rec(id,ok,msg){if(!ok)fails++;console.log(id.padEnd(60),ok?'PASS':'FAIL',String(msg||'').slice(0,300));}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const br=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox'],headless:'new'});
const page=await br.newPage();await page.setViewport({width:1400,height:1000});const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});page.on('dialog',d=>d.accept());
await page.goto(BASE,{waitUntil:'networkidle0'});await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.reload({waitUntil:'networkidle0'});
const ver=await page.$eval('#ver',e=>e.textContent);rec('Wersja: etap 3',/5\.2 \(testowa\) · etap 3 · 09\.11\.2026/.test(ver),ver);
const go=async id=>{await page.evaluate(id=>document.querySelector('#side button[data-id="'+id+'"]').click(),id);await sleep(900);};
const frameOf=async src=>{for(let k=0;k<30;k++){const f=page.frames().find(f=>f.url().includes(src));if(f){try{await f.waitForSelector('body');return f;}catch(e){}}await sleep(200);}return null;};
await go('trop');const tf=await frameOf('mod/troponina');await sleep(800);
const c=await tf.evaluate(()=>({n:document.querySelectorAll('#ecg .ek').length,w:[...document.querySelectorAll('#ecg .ek')].filter(e=>e.querySelector('svg.ecg-svg polyline')).length,h:document.querySelector('.ecg10')&&document.querySelector('.ecg10').textContent}));
rec('Troponina: 16 kart EKG, każda z rysunkiem',c.n===16&&c.w===16,JSON.stringify(c));
rec('Nagłówek EKG ≤10 min',/≤10 min/.test(c.h||''),c.h);
const abbr=await tf.evaluate(()=>[...document.querySelectorAll('#ecg .ek')].map(e=>e.textContent).join(' '));
rec('Skróty rozwinięte (LBBB, LAD, RCA, LVH)',/lewej odnogi pęczka Hisa/.test(abbr)&&/zstępującej/.test(abbr)&&/prawej tętnicy wieńcowej/i.test(abbr)&&/[Pp]rzerost lewej komory/.test(abbr),'');
await tf.evaluate(()=>{const t=new Date(Date.now()-15*60000);document.getElementById('ecgFmc').value=('0'+t.getHours()).slice(-2)+':'+('0'+t.getMinutes()).slice(-2);document.getElementById('ecgFmc').dispatchEvent(new Event('input',{bubbles:true}));});await sleep(300);
const cl=await tf.evaluate(()=>{const e=document.getElementById('ecgCnt');return {t:e.textContent,late:e.classList.contains('late')}});rec('Licznik: >10 min bez EKG → czerwony',cl.late,JSON.stringify(cl));
for(const k of ['dew','sgar']){await tf.evaluate(()=>{document.querySelectorAll('#ecg .mk').forEach(b=>{if(/Zaznaczone/.test(b.textContent))b.click();});});await tf.evaluate(k=>document.querySelector('#ecg .mk[data-k="'+k+'"]').click(),k);await sleep(500);
 const r=await tf.evaluate(()=>({red:!!document.querySelector('#light.L-red'),on:!!document.querySelector('#ecg button.on')}));rec('Karta '+k+' → czerwone światło',r.red&&r.on,JSON.stringify(r));}
await go('dashboard');await sleep(600);const hold=await page.evaluate(()=>JSON.stringify(Object.keys(SORHold.items())));rec('Wstrzymanie wypisu z troponiny (de Winter/Sgarbossa)',/trop/.test(hold||''),String(hold).slice(0,200));
await go('trop');const tf2=await frameOf('mod/troponina');await sleep(600);
await tf2.evaluate(()=>{document.querySelectorAll('#ecg .mk').forEach(b=>{if(/Zaznaczone/.test(b.textContent))b.click();});document.querySelector('#ecg .mk[data-k="norm"]').click();});await sleep(400);
const nr=await tf2.evaluate(()=>!document.querySelector('#light.L-red'));rec('EKG prawidłowe → bez czerwonego światła (bez troponiny)',nr,'');
for(const id of ['el','tox','omdl']){await go(id);}
const pink=await page.evaluate(()=>{const s=[...document.styleSheets].map(x=>{try{return [...x.cssRules].map(r=>r.cssText).join('')}catch(e){return ''}}).join('');return /255, 95, 162|123, 63, 228/.test(s)});rec('Brak różu/fioletu w arkuszach powłoki',!pink,'');
const om=await (await frameOf('mod/omdlenie'))?.evaluate(()=>getComputedStyle(document.querySelector('header')).backgroundColor);rec('Omdlenie: granatowy nagłówek',om==='rgb(31, 58, 95)',om);
rec('Brak błędów JS (etap 3)',errs.length===0,JSON.stringify(errs).slice(0,500));
console.log(fails?('FAILS '+fails):'ALL PASS');await br.close();process.exit(fails?1:0);})();
