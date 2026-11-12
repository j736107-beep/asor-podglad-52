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
rec('14 grup, ≥46 kalkulatorów, ≤6 w grupie',info.g===14&&info.c>=46&&info.max<=6,JSON.stringify(info));
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
// SCORE2-OP wstrzymany
await page.evaluate(()=>{document.querySelector('.kk-chip[data-c="score2op"]').click();});await sleep(200);
const sp=await page.evaluate(()=>{const p=document.getElementById('kk-panel');const ins=[...p.querySelectorAll('input,select')];const t=document.getElementById('kk-susp');return {n:ins.length,dis:ins.every(x=>x.disabled),txt:t&&t.textContent,col:t&&getComputedStyle(t).color,out:document.getElementById('kk-out').textContent,vis:!!document.querySelector('.kk-chip[data-c="score2op"]').offsetParent};});
rec('SCORE2-OP: widoczny, pola nieaktywne, czerwony napis, brak liczby, odesłanie do ESC 2021',sp.vis&&sp.n>0&&sp.dis&&sp.txt==='Kalkulator wstrzymany – wynik niezweryfikowany'&&/rgb\(198, 40, 40\)/.test(sp.col)&&/ESC 2021/.test(sp.out)&&!/\d+,\d %/.test(sp.out),JSON.stringify(sp).slice(0,200));
if(SHOTS){await page.evaluate(()=>document.getElementById('kk-panel').scrollIntoView());await sleep(200);await page.screenshot({path:SHOTS+'/kalk-score2op-wstrzymany.png'});}
await page.evaluate(()=>{document.querySelector('.kk-chip[data-c="score2"]').click();});await sleep(150);
await page.evaluate(()=>{const e=document.querySelector('#pa');e.value='75';e.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(250);
const s75=await page.evaluate(()=>document.getElementById('kk-out').textContent);rec('SCORE2 przy wieku 75 → brak liczby, komunikat WSTRZYMANY',/WSTRZYMANY/.test(s75)&&!/\d+,\d %/.test(s75),s75.slice(0,100));
await page.evaluate(()=>{const e=document.querySelector('#pa');e.value='50';e.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(200);
// 09.11.2026: HeartScore, SCORE2 → SCORE2-Diabetes, SCORE2-Diabetes, PESI/sPESI
const hs=await page.evaluate(()=>['score2','score2op','score2dm'].map(id=>{document.querySelector('.kk-chip[data-c="'+id+'"]').click();const a=document.querySelector('#kk-panel .kk-url a');return a&&a.href;}));
rec('HeartScore: link w SCORE2 / SCORE2-OP / SCORE2-Diabetes',hs.every(h=>h==='https://www.heartscore.org/en_GB'),JSON.stringify(hs));
await page.evaluate(()=>{document.querySelector('.kk-chip[data-c="score2"]').click();});await sleep(150);await page.click('#kk-score2-dm');await sleep(200);
const sdm=await page.evaluate(()=>({t:document.getElementById('kk-out').textContent,b:!!document.querySelector('#kk-out [data-kalk="score2dm"]')}));
rec('SCORE2 + cukrzyca → odesłanie do SCORE2-Diabetes (przycisk)',/SCORE2-Diabetes/.test(sdm.t)&&sdm.b,sdm.t.slice(0,120));
await page.click('#kk-out [data-kalk="score2dm"]');await sleep(300);
const sel=await page.evaluate(()=>document.querySelector('#kk-panel h3').textContent);
for(const [k,v] of [['sbp','140'],['tc','5.5'],['hdl','1.3'],['dx','45'],['hbap','7'],['egfr','90']])await page.type('#kk-score2dm-'+k,v);await sleep(250);
const dmo=await page.evaluate(()=>document.getElementById('kk-out').textContent);
rec('SCORE2-Diabetes: otwarty z SCORE2, wiek z paska, HbA1c 7% → 53 mmol/mol, wynik % + kategoria',/SCORE2-Diabetes/.test(sel)&&/\d+,\d %/.test(dmo)&&/53,0 mmol\/mol/.test(dmo)&&/ryzyko (MAŁE|UMIARKOWANE|DUŻE|BARDZO DUŻE)/.test(dmo),sel.slice(0,40)+' | '+dmo.slice(0,140));
if(SHOTS){await page.evaluate(()=>document.getElementById('kk-panel').scrollIntoView());await sleep(200);await page.screenshot({path:SHOTS+'/kalk-score2dm.png'});}
await page.click('#kk-score2dm-a3');await sleep(200);
const dmv=await page.evaluate(()=>document.getElementById('kk-out').textContent);rec('SCORE2-Diabetes: białkomocz A3 → BARDZO DUŻE bez liczenia',/BARDZO DUŻE/.test(dmv)&&!/\d+,\d %/.test(dmv),dmv.slice(0,100));
await go('pe');await page.evaluate(()=>{const f=document.querySelector('.clinical-form');if(f){const e=f.querySelector('#hr');if(e){e.value='80';e.dispatchEvent(new Event('input',{bubbles:true}));}}});await sleep(300);
const peb=await page.evaluate(()=>!!document.querySelector('#main [data-kalk="pesi"]'));
await page.evaluate(()=>document.querySelector('#main [data-kalk="pesi"]').click());await sleep(500);
const pa=await page.evaluate(()=>({act:SKS.active().id,h:document.querySelector('#kk-panel h3').textContent}));
for(const [k,v] of [['hr','115'],['sbp','120'],['rr','16'],['temp','37'],['spo2','95']])await page.type('#kk-pesi-'+k,v);await page.click('#kk-pesi-ca');await sleep(250);
const po=await page.evaluate(()=>document.getElementById('kk-out').textContent);
rec('PESI: przycisk w module ZP → Kalkulatory; 50 l. M (pasek) + nowotwór + HR 115 = 110 pkt, klasa IV',peb&&pa.act==='kalk'&&/PESI/.test(pa.h)&&/110 pkt – klasa IV/.test(po)&&/4,0–11,4%/.test(po),JSON.stringify(pa)+' | '+po.slice(0,90));
if(SHOTS){await page.evaluate(()=>document.getElementById('kk-panel').scrollIntoView());await sleep(200);await page.screenshot({path:SHOTS+'/kalk-pesi.png'});}
await page.evaluate(()=>{document.querySelector('.kk-chip[data-c="spesi"]').click();});await sleep(150);
for(const [k,v] of [['hr','115'],['sbp','120'],['spo2','95']])await page.type('#kk-spesi-'+k,v);await page.click('#kk-spesi-ca');await sleep(250);
const so=await page.evaluate(()=>document.getElementById('kk-out').textContent);rec('sPESI: nowotwór + HR 115 = 2 pkt → 10,9% (8,5–13,2)',/^2 pkt/.test(so.trim())&&/10,9% \(95% CI 8,5–13,2\)/.test(so),so.slice(0,90));
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
rec('ZP (11.11): bez wyboru lekarza wydruk NIE podaje domyślnego schematu – „uzupełnij”',!/Proponowane/.test(capTxt.sub)&&/uzupełnij|Uzupełnij/.test(capTxt.sub),capTxt.name+' | '+capTxt.sub.slice(0,160));
await page.evaluate(()=>localStorage.setItem('zp1state',JSON.stringify({allergy:'none',place:'ward',o:{}})));// = wybór lekarza w zakładce „Antybiotykoterapia – dobór”
// symulacja: ramka antybiotykoterapii nigdy nie załadowana (usunięta z DOM) → treść z silnika
const capAuto=await page.evaluate(()=>{SORReport.clearSnaps();document.querySelectorAll('#main iframe').forEach(f=>f.remove());const m=SKM.list.find(x=>x.id==='cap');SORReport.capture(m);const s=SORReport.snaps().cap||{};return {sub:s.sub||'',name:s.subName||'',auto:!!s.subAuto};});
rec('ZP: bez ramki – antybiotykoterapia wyliczona ze wspólnego silnika z wyborów lekarza (alergia, miejsce)',capAuto.auto&&/wyliczone z silnika/.test(capAuto.name)&&/Proponowane|Propozycja/.test(capAuto.sub)&&/DO DECYZJI LEKARZA/.test(capAuto.sub),capAuto.name+' | '+capAuto.sub.slice(0,160));
// SW
const sw=await page.evaluate(async()=>{const t=await (await fetch('sw.js',{cache:'no-store'})).text();return /asor-v52-fix14/.test(t)&&/calc\/kalk\.js/.test(t)&&/kalk-ui\.js/.test(t);});rec('SW: etap4 + pliki kalkulatorów',sw,'');
rec('Brak błędów JS',errs.length===0,errs.join(' | '));
await br.close();console.log(fails?('FAILS: '+fails):'ALL PASS');process.exit(fails?1:0);})();
