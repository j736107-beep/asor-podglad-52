// fix23: wydruk Neurologia, Omdlenie, Troponina/OZW (ujednolicony own/sekcje) – tylko wypełnione pozycje, dawki/pompy, WNIOSKI; raport zbiorczy; Następny pacjent; samo przeglądanie nie dodaje modułu. BASE opcjonalne.
const pp=require('puppeteer-core');
const BASE=process.env.BASE||'http://localhost:8765/';
const sleep=t=>new Promise(r=>setTimeout(r,t));
let n=0,fail=0;const rec=(name,ok,info)=>{n++;if(!ok)fail++;console.log((ok?'PASS ':'FAIL ')+name+(ok?'':' :: '+String(info||'').slice(0,800)));};
const JUNK=/Źródła|Źródło|Wytyczne i ChPL|ChPL 4\.2|Efekt:|Wpisz wynik|Wpisz masę|Nie wpisano|Brak danych do raportu|zatwierdzony przez lekarza|Tabela dawek|Drożność dróg|Osmolalność efektywna = 2×|Profilaktyka ZŻ|Ustawienia lokalne – DO/;
(async()=>{
  const br=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await br.newPage();await page.setViewport({width:1280,height:900});
  const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('dialog',d=>d.accept());
  async function fresh(){
    await page.goto(BASE+'?t='+Date.now(),{waitUntil:'networkidle2',timeout:60000});
    await page.evaluate(async()=>{try{for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister();for(const k of await caches.keys())await caches.delete(k);}catch(e){}localStorage.clear();sessionStorage.clear();});
    await page.goto(BASE+'?t='+Date.now(),{waitUntil:'networkidle2',timeout:60000});
    await page.evaluate(()=>{window.print=()=>{};});await sleep(300);
  }
  const setP=o=>page.evaluate(o=>{for(const [id,v] of Object.entries(o)){const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}},o);
  const setF=o=>page.evaluate(o=>{for(const [id,v] of Object.entries(o)){const e=document.querySelector('#main #f #'+id);if(!e)throw Error('brak '+id);if(e.type==='checkbox'){if(e.checked!==v)e.click();}else{e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));}}},o);
  const show=async id=>{await page.evaluate(id=>SKS.show(id),id);await sleep(1500);};
  const tab=async(m,t)=>{await page.evaluate((m,t)=>SKS.goTab(m,t),m,t);await sleep(900);};
  const frame=async()=>{const h=await page.$('#main iframe');return h.contentFrame();};
  const printMod=async()=>{await page.evaluate(()=>document.getElementById('printMod').click());await sleep(600);return page.evaluate(()=>{const a=document.getElementById('printArea'),x=[...a.querySelectorAll('.rp-sect')];return x.length?x.map(e=>e.innerText).join('\n'):a.innerText;});};
  const full=()=>page.evaluate(()=>{SORReport.capture(SKS.active());return SORReport.fill(['done','pumps','fluid','modules']).innerText;});
  const wipe=async()=>{await Promise.all([page.waitForNavigation({waitUntil:'networkidle2',timeout:60000}).catch(()=>{}),page.evaluate(()=>{window.confirm=()=>true;SKS.wipe();})]);await page.waitForFunction(()=>window.SKS&&window.SORReport,{timeout:30000});await sleep(300);};
  const tframe=async()=>{for(let k=0;k<40;k++){const f=page.frames().find(f=>f.url().includes('mod/troponina'));if(f){try{await f.waitForSelector('#fxList input');await f.evaluate(()=>{window.print=()=>{};});await sleep(300);return f;}catch(e){}}await sleep(200);}return null;};
  // ===== Neurologia: tromboliza z masy =====
  await fresh();await setP({pw:'80',pa:'70'});await tab('neuro','a');await setF({pname:'Jan Testowy',foc:true,aph:true,h:'2'});await sleep(300);
  await tab('neuro','t');await setF({h:'2',sbp:'170',dbp:'95'});await sleep(400);
  let t=await printMod();
  rec('NEU: alteplaza 72 mg = 72 ml, bolus 7,2 ml, 64,8 ml w 60 min = 64,8 ml/h; tenekteplaza 22,5 mg = 4,5 ml',/łącznie 72 mg = 72 ml; bolus 10%: 7,2 ml i\.v\. w 1 min; reszta 64,8 ml w 60 min = 64,8 ml\/h/.test(t)&&/22,5 mg = 4,5 ml/.test(t),t);
  rec('NEU: KOD UDAROWY we WNIOSKACH; bez imienia, godziny przyjęcia, źródeł i list',/WNIOSKI:/.test(t)&&/KOD UDAROWY/.test(t)&&!/Testowy|Przyjęcie/.test(t)&&!JUNK.test(t)&&!/Względne \/ ostrożnie|NINDS/.test(t),t.match(JUNK)||t);
  t=await full();rec('NEU w raporcie zbiorczym (bez imienia)',/Neurologia/.test(t)&&/64,8 ml\/h/.test(t)&&!/Testowy/.test(t),t);
  await wipe();t=await full();rec('NEU: po „Następny pacjent” brak w raporcie',!/TROMBOLIZA|PODEJRZENIE UDARU/.test(t),t);
  await fresh();await setP({pw:'80'});await tab('neuro','a');await sleep(600);await tab('neuro','t');await tab('neuro','n');await show('dashboard');t=await full();rec('NEU: samo przeglądanie zakładek (auto godzina przyjęcia) → nie w raporcie',!/TROMBOLIZA|PODEJRZENIE UDARU|NIHSS/.test(t),t);
  // ===== Omdlenie =====
  await fresh();await setP({pa:'70'});await show('omdl');let f=await frame();
  await f.evaluate(async()=>{const sl=t=>new Promise(r=>setTimeout(r,t));const steps=[...document.querySelectorAll('#steps button')].length;
    for(let i=0;i<steps;i++){document.querySelector('#steps button[data-s="'+i+'"]').click();await sl(60);const an=document.getElementById('allNo');if(an){an.click();await sl(60);}
      if(i===0){['K-1','K-1T'].forEach(c=>{const b=document.querySelector('button[data-c="'+c+'"][data-v="yes"]');b&&b.click();});await sl(60);}}
    document.querySelector('#steps button[data-s="4"]').click();await sl(80);});
  const gm=await f.evaluate(async()=>{const R=await (await fetch('rules.json')).json();const it=R.groups.find(g=>g.id==='G').items.find(i=>i.type==='major'&&document.querySelector('button[data-c="'+i.code+'"][data-v="yes"]'));return it?it.code:null;});
  await f.evaluate(async c=>{const sl=t=>new Promise(r=>setTimeout(r,t));const b=document.querySelector('button[data-c="'+c+'"][data-v="yes"]');b&&b.click();await sl(80);
    document.querySelector('#steps button[data-s="5"]').click();await sl(80);[['troponin','neg'],['dx','other']].forEach(([k,v])=>{const x=document.querySelector('button[data-k="'+k+'"][data-v="'+v+'"]');x&&x.click();});},gm);await sleep(300);
  t=await printMod();
  rec('OMD: cecha DUŻA → CZERWONE, powód z kodem, WNIOSKI hospitalizacja',/Wynik: CZERWONE/.test(t)&&t.includes(gm)&&/HOSPITALIZACJA|hospitalizacja/.test(t),gm+' '+t);
  rec('OMD: bez odpowiedzi NIE, list pytań, tabel i źródeł',!/– NIE|Pozostałe: NIE|ESC Tab\. 7 — przyjęcie|CMAJ 2016/.test(t)&&!JUNK.test(t),t.match(JUNK)||t);
  t=await full();rec('OMD w raporcie zbiorczym',/Omdlenie SOR/.test(t)&&/CZERWONE/.test(t),t);
  await wipe();t=await full();rec('OMD: po „Następny pacjent” brak w raporcie',!/OMDLENIE – OCENA/.test(t),t);
  await fresh();await show('omdl');await show('dashboard');t=await full();rec('OMD: samo otwarcie modułu → nie w raporcie',!/OMDLENIE – OCENA/.test(t),t);
  // ===== Troponina / OZW – ujednolicony wydruk (sekcje, own) =====
  await fresh();await show('trop');f=await tframe();
  const yes=(k,v)=>f.evaluate((k,v)=>document.querySelector('[data-k="'+k+'"][data-v="'+v+'"]').click(),k,v);
  const set=(id,v)=>f.evaluate((id,v)=>{const e=document.getElementById(id);if(e.type==='checkbox'){e.click();return;}e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},id,v);
  await yes('typ',1);await yes('rad',1);await set('rhy','sin');await set('noisch');await set('age','58');await set('sex','m');await set('t0','08:40');await set('c0','6');await set('t1','09:40');await set('c1','7');await sleep(400);
  t=await printMod();
  const sect=await page.evaluate(()=>document.querySelectorAll('#printArea .rp-sect').length);
  rec('TROP: Drukuj → sekcja własnego wydruku (jak fix18–22): ból typowy, troponina 0 h 6 ng/l, WNIOSKI',sect>0&&/Ból typowy/.test(t)&&/0 h \(08:40\): 6 ng\/l/.test(t)&&/WNIOSKI/.test(t),sect+' '+t);
  rec('TROP: bez nadmiaru',!JUNK.test(t)&&!/Cukrzyca|CK-MB|EKG prawidłowe/.test(t),t.match(JUNK)||t);
  t=await full();rec('TROP w raporcie zbiorczym',/Troponina \/ OZW/.test(t)&&/6 ng\/l/.test(t),t);
  await wipe();t=await full();rec('TROP: po „Następny pacjent” brak w raporcie',!/Ból typowy/.test(t),t);
  await fresh();await show('trop');await tframe();await show('dashboard');t=await full();rec('TROP: samo otwarcie modułu → nie w raporcie',!/Troponina \/ OZW \(stan/.test(t),t);
  rec('Brak błędów JS',errs.length===0,errs.join(' | '));
  await br.close();console.log(fail?`${n-fail}/${n} PASS, ${fail} FAIL`:`${n}/${n} PASS`);process.exit(fail?1:0);
})().catch(e=>{console.log('FAIL wyjątek '+e.message);process.exit(1);});
