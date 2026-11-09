const puppeteer=require('puppeteer-core');
const BASE=process.env.BASE||'http://localhost:8765/';const SHOTS=process.env.SHOTS||'';
let fails=0;function rec(id,ok,msg){if(!ok)fails++;console.log(id.padEnd(62),ok?'PASS':'FAIL',String(msg||'').slice(0,300));}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const br=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox'],headless:'new'});
const page=await br.newPage();await page.setViewport({width:1400,height:1000});const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});page.on('dialog',d=>d.accept());
await page.goto(BASE,{waitUntil:'networkidle0'});await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.reload({waitUntil:'networkidle0'});
const ver=await page.$eval('#ver',e=>e.textContent);rec('Wersja: etap 4',/5\.2 \(testowa\) · etap 4 · 09\.11\.2026/.test(ver),ver);
const go=async id=>{await page.evaluate(id=>document.querySelector('#side button[data-id="'+id+'"]').click(),id);await sleep(700);};
const has=await page.evaluate(()=>!!document.querySelector('#side button[data-id="kalk"]'));rec('Moduł Kalkulatory w menu',has,'');
// pasek pacjenta
await page.evaluate(()=>{const s=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};s('#pa','50');s('#pw','70');s('#pc','1.0');document.querySelector('#psex button[data-s="m"]').click();});await sleep(300);
await go('kalk');
const info=await page.evaluate(()=>({g:document.querySelectorAll('.kk-g').length,c:document.querySelectorAll('.kk-chip').length,max:Math.max(...[...document.querySelectorAll('.kk-g')].map(g=>g.querySelectorAll('.kk-chip').length))}));
rec('12 grup, ≥43 kalkulatory, ≤6 w grupie',info.g===12&&info.c>=43&&info.max<=6,JSON.stringify(info));
// każdy kalkulator otwiera się bez błędu
const ids=await page.evaluate(()=>Object.keys(KALK.C));let bad=[];
for(const id of ids){const r=await page.evaluate(id=>{const b=document.querySelector('.kk-chip[data-c="'+id+'"]');b.click();const p=document.getElementById('kk-panel');return !!(p&&p.querySelector('.kk-res')&&p.querySelector('.kk-src'));},id);if(!r)bad.push(id);}
rec('Każdy kalkulator renderuje panel, wynik/braki i źródło',bad.length===0,bad.join(','));
// prefill eGFR
await page.evaluate(()=>document.querySelector('.kk-chip[data-c="egfr"]').click());await sleep(200);
const eg=await page.evaluate(()=>({age:document.getElementById('kk-egfr-age').value,cr:document.getElementById('kk-egfr-cr').value,bar:document.querySelectorAll('#kk-panel .kk-bar').length,v:document.querySelector('#kk-out .kk-v')&&document.querySelector('#kk-out .kk-v').textContent}));
rec('eGFR: wiek/kreatynina z paska, wynik',eg.age==='50'&&/^1/.test(eg.cr)&&eg.bar>=3&&/\d/.test(eg.v||''),JSON.stringify(eg));
// zmiana paska → aktualizacja
await page.evaluate(()=>{const e=document.querySelector('#pa');e.value='70';e.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(300);
const eg2=await page.evaluate(()=>document.getElementById('kk-egfr-age').value);rec('Zmiana wieku w pasku aktualizuje kalkulator',eg2==='70',eg2);
// QTc wpis ręczny
await page.evaluate(()=>{document.querySelector('.kk-chip[data-c="qtc"]').click();});await sleep(150);
await page.type('#kk-qtc-qt','400');await page.type('#kk-qtc-hr','75');await sleep(150);
const q=await page.evaluate(()=>document.getElementById('kk-out').textContent);rec('QTc 400/75 → Fridericia 431, Bazett 447',/Fridericia 431/.test(q)&&/Bazett 447/.test(q),q.slice(0,80));
// SCORE2
await page.evaluate(()=>{document.querySelector('.kk-chip[data-c="score2"]').click();});await sleep(150);
await page.evaluate(()=>{const e=document.querySelector('#pa');e.value='50';e.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(200);
await page.click('#kk-score2-smk');await page.type('#kk-score2-sbp','140');await page.type('#kk-score2-tc','5.5');await page.type('#kk-score2-hdl','1.3');await sleep(150);
const s2=await page.evaluate(()=>document.getElementById('kk-out').textContent);rec('SCORE2 50 l. M palacz, region wysokiego ryzyka (Polska) – wynik',/\d+,\d %/.test(s2)&&/wysokie|bardzo/.test(s2),s2.slice(0,90));
if(SHOTS){await page.evaluate(()=>document.getElementById('kk-panel').scrollIntoView());await sleep(200);await page.screenshot({path:SHOTS+'/kalk-score2.png'});}
// wydruk – snapshot
const sn=await page.evaluate(()=>{SORReport.capture(SKM.list.find(m=>m.id==='kalk'));const s=SORReport.snaps();return s.kalk&&s.kalk.text||'';});
rec('Wydruk: snapshot kalkulatora z danymi i źródłem',/KALKULATOR: SCORE2/.test(sn)&&/Źródło \(2021\)/.test(sn)&&/Wiek: 50/.test(sn),sn.slice(0,120));
// opioidy
await page.evaluate(()=>{document.querySelector('.kk-chip[data-c="opioid"]').click();});await sleep(150);await page.type('#kk-opioid-dose','40');await sleep(150);
const o=await page.evaluate(()=>document.getElementById('kk-out').textContent);rec('Opioidy: oksykodon 40 → morfina 30 mg (ostrożnie, −50%), metadon wyłączony',/^30 mg/.test(o.trim())&&/Metadon/.test(o),o.slice(0,90));
if(SHOTS){await page.evaluate(()=>document.getElementById('kk-panel').scrollIntoView());await sleep(200);await page.screenshot({path:SHOTS+'/kalk-opioid.png'});}
// link do modułu
await page.evaluate(()=>document.querySelector('.kk-g[data-g="vte"] .kk-link').click());await sleep(500);
const act=await page.evaluate(()=>SKS.active&&(typeof SKS.active==='function'?SKS.active():SKS.active));rec('Link „Powiązane moduły” otwiera moduł ZP',!!act&&act.id==='pe',act&&act.id);
// wyszukiwarka
await go('kalk');await page.type('#kk-q','wells');await sleep(200);const n=await page.evaluate(()=>document.querySelectorAll('.kk-chip').length);rec('Wyszukiwarka „wells” → 2',n===2,n);
// Zapalenie płuc: wydruk z antybiotykoterapią bez otwierania zakładki
await go('cap');await page.evaluate(()=>document.querySelector('[data-clin-tab="scores"]').click());await sleep(500);
await page.evaluate(()=>{const set=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};set('rr','24');set('sbp','125');set('dbp','75');set('hr','98');set('temp','38.6');set('spo2','93');set('urea','30');});await sleep(500);
const capTxt=await page.evaluate(()=>{const m=SKM.list.find(x=>x.id==='cap');SORReport.capture(m);const s=SORReport.snaps().cap||{};return {sub:s.sub||'',name:s.subName||''};});
rec('ZP: wydruk zawiera antybiotykoterapię',/Proponowane|Propozycja/.test(capTxt.sub),capTxt.name+' | '+capTxt.sub.slice(0,120));
// symulacja: ramka antybiotykoterapii nigdy nie załadowana (usunięta z DOM) → treść z silnika
const capAuto=await page.evaluate(()=>{SORReport.clearSnaps();document.querySelectorAll('#main iframe').forEach(f=>f.remove());const m=SKM.list.find(x=>x.id==='cap');SORReport.capture(m);const s=SORReport.snaps().cap||{};return {sub:s.sub||'',name:s.subName||'',auto:!!s.subAuto};});
rec('ZP: bez ramki – antybiotykoterapia wyliczona ze wspólnego silnika',capAuto.auto&&/wyliczone z silnika/.test(capAuto.name)&&/Proponowane|Propozycja/.test(capAuto.sub)&&/DO DECYZJI LEKARZA/.test(capAuto.sub),capAuto.name+' | '+capAuto.sub.slice(0,160));
// SW
const sw=await page.evaluate(async()=>{const t=await (await fetch('sw.js',{cache:'no-store'})).text();return /asor-v52-etap4/.test(t)&&/calc\/kalk\.js/.test(t)&&/kalk-ui\.js/.test(t);});rec('SW: etap4 + pliki kalkulatorów',sw,'');
rec('Brak błędów JS',errs.length===0,errs.join(' | '));
await br.close();console.log(fails?('FAILS: '+fails):'ALL PASS');process.exit(fails?1:0);})();
