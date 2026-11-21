// fix28: telefony pracowni endoskopowej w module Krwawienie z GI i Książce; NAC – objętość końcowa i ml/h na ekranie i w wydruku. BASE opcjonalne; SHOTS – katalog zrzutów (prefiks f19-).
const pp=require('puppeteer-core');
const BASE=process.env.BASE||'http://localhost:8765/',SHOTS=process.env.SHOTS||'';
const sleep=t=>new Promise(r=>setTimeout(r,t));
let n=0,fail=0;const rec=(name,ok,info)=>{n++;if(!ok)fail++;console.log((ok?'PASS ':'FAIL ')+name+(ok?'':' :: '+String(info||'').slice(0,900)));};
(async()=>{
  const br=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await br.newPage();await page.setViewport({width:1280,height:900});
  const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('dialog',d=>d.accept());
  await page.goto(BASE+'?t='+Date.now(),{waitUntil:'networkidle2',timeout:60000});
  await page.evaluate(async()=>{try{for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister();for(const k of await caches.keys())await caches.delete(k);}catch(e){}localStorage.clear();sessionStorage.clear();});
  await page.goto(BASE+'?t='+Date.now(),{waitUntil:'networkidle2',timeout:60000});await page.evaluate(()=>{window.print=()=>{};});await sleep(300);
  const setP=o=>page.evaluate(o=>{for(const [id,v] of Object.entries(o)){const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}},o);
  const shot=async name=>{if(!SHOTS)return;const vp=page.viewport();const H=await page.evaluate(()=>{const m=document.getElementById('main');const r=m.getBoundingClientRect();return Math.ceil(r.top+m.scrollHeight+20);});await page.setViewport({width:vp.width,height:Math.min(Math.max(H,vp.height),6000)});await sleep(400);await page.screenshot({path:SHOTS+'/'+name});await page.setViewport(vp);await sleep(200);};
  const sw=await page.evaluate(()=>fetch('sw.js?'+Date.now()).then(r=>r.text()));rec('SW asor-v52-fix28 lub nowszy',/asor-v52-fix(2[8-9]|[3-9]\d)/.test(sw),sw.slice(0,40));
  // GI
  await page.evaluate(()=>SKS.show('gib'));await sleep(1200);
  const gi=await page.evaluate(()=>{const b=document.querySelector('#main [data-gi-endo-tel]');return b?{t:b.innerText,h:[...b.querySelectorAll('a[href^="tel:"]')].map(a=>a.getAttribute('href'))}:null;});
  rec('Krwawienie z GI: baner – Pracownia endoskopowa – gastroskopia, 3910 i 3911 (linki tel:), „w godzinach pracy pracowni” bez wymyślonych godzin (fix28a)',!!gi&&/Pracownia endoskopowa – gastroskopia/.test(gi.t)&&/3910/.test(gi.t)&&/3911/.test(gi.t)&&/w godzinach pracy pracowni/.test(gi.t)&&!/8:00|15:00|pn–pt|święta/.test(gi.t)&&gi.h.includes('tel:3910')&&gi.h.includes('tel:3911'),JSON.stringify(gi));
  const tabs=await page.evaluate(()=>[...document.querySelectorAll('#main .tabs button')].map(b=>b.dataset.t));let allTabs=true;
  for(const tb of tabs){await page.evaluate(t=>document.querySelector('#main .tabs button[data-t="'+t+'"]').click(),tb);await sleep(500);if(!await page.evaluate(()=>/3910/.test((document.querySelector('#main [data-gi-endo-tel]')||{}).innerText||'')))allTabs=false;}
  rec('Numery widoczne we wszystkich zakładkach modułu GI ('+tabs.join(',')+')',allTabs&&tabs.length>=3,JSON.stringify(tabs));
  await page.evaluate(()=>document.querySelector('#main .tabs button[data-t="e"]').click());await sleep(500);await shot('f19-po-1280-gi-telefony.png');
  await page.setViewport({width:390,height:844});await sleep(400);await shot('f19-po-390-gi-telefony.png');await page.setViewport({width:1280,height:900});
  await page.evaluate(()=>SORTel.openBook('gastroskopia','szpital'));await sleep(1200);
  const bk=await page.evaluate(()=>document.getElementById('main').innerText);rec('Książka telefoniczna – wyszukiwanie „gastroskopia” → 3910, 3911',/Pracownia endoskopowa – gastroskopia/.test(bk)&&/3910/.test(bk)&&/3911/.test(bk),bk.slice(0,600));
  // NAC
  await setP({pw:'80'});await page.evaluate(()=>SKS.show('tox'));await sleep(1000);await page.evaluate(()=>document.querySelector('[data-clin-tab="para"]').click());await sleep(500);
  await page.evaluate(()=>{for(const [id,v] of [['mg','12000'],['hrs','2']]){const e=document.querySelector('#main .clinical-form #'+id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}});await sleep(500);
  const tb=await page.evaluate(()=>{const s=[...document.querySelectorAll('#main .clinical-result')].find(x=>/NAC – schemat 3-workowy/.test(x.querySelector('h3').textContent));if(!s)return null;return{head:[...s.querySelectorAll('th')].map(x=>x.textContent),rows:[...s.querySelectorAll('tbody tr')].map(tr=>[...tr.children].map(td=>td.textContent)),rule:(s.querySelector('[data-nac-rule]')||{}).textContent||''};});
  rec('NAC ekran: kolumny NAC 100 mg/ml / Rozcieńczalnik / Objętość końcowa / Czas / Prędkość',!!tb&&JSON.stringify(tb.head)==='["Worek","Dawka","NAC 100 mg/ml","Rozcieńczalnik (NaCl 0,9% lub G5%)","Objętość końcowa","Czas","Prędkość"]',JSON.stringify(tb&&tb.head));
  rec('NAC 80 kg: 120 ml + 200 ml = 320 ml / 60 min = 320 ml/h; 40 + 500 = 540 ml / 4 h = 135 ml/h; 80 + 1000 = 1080 ml / 16 h = 67,5 ml/h',!!tb&&tb.rows.map(r=>r.slice(2).join('|')).join(' # ')==='120 ml|200 ml|320 ml|60 min|320 ml/h # 40 ml|500 ml|540 ml|4 h|135 ml/h # 80 ml|1000 ml|1080 ml|16 h|67,5 ml/h'&&/rozcieńczalnik \+ objętość koncentratu NAC/.test(tb.rule),JSON.stringify(tb));
  await shot('f19-po-1280-nac.png');await page.setViewport({width:390,height:844});await sleep(400);await shot('f19-po-390-nac.png');await page.setViewport({width:1280,height:900});
  const pr=await page.evaluate(()=>{const m=SKM.list.find(x=>x.id==='tox');const s=m.snapshot({print:true});return s?s.text:'';});
  rec('NAC wydruk: rozcieńczalnik, objętość końcowa, czas, ml/h',/rozcieńczalnik \(NaCl 0,9% lub G5%\): 200 ml; objętość końcowa 320 ml; czas 60 min; 320 ml\/h/.test(pr)&&/objętość końcowa 540 ml; czas 4 h; 135 ml\/h/.test(pr)&&/objętość końcowa 1080 ml; czas 16 h; 67,5 ml\/h/.test(pr),pr);
  rec('Brak błędów JS',errs.length===0,errs.join(' | '));
  console.log(fail?('FAILS '+fail+'/'+n):('ALL PASS '+n+'/'+n));await br.close();process.exit(fail?1:0);
})().catch(e=>{console.log('FAIL fatal',e.message);process.exit(1);});
