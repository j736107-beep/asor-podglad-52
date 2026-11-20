// fix21: wydruk Elektrolity, DKA/HHS, Stan padaczkowy – tylko wypełnione pozycje, dawki/pompy, WNIOSKI; raport zbiorczy; Następny pacjent; samo przeglądanie nie dodaje modułu. BASE opcjonalne.
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
  // ===== Elektrolity: hipokaliemia – pompa KCl z samego wyniku + Drukuj =====
  await fresh();await setP({pw:'80',pa:'60'});await show('el');let f=await frame();
  await f.evaluate(()=>document.querySelector('[data-k="hipoK"]').click());await sleep(300);
  await f.evaluate(()=>{const i=document.querySelector('#L_k');i.value='2.6';i.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(300);
  let t=await printMod();
  rec('EL: hipokaliemia 2,6 → wlew KCl: 40 mmol = 20 ml KCl 15%, 1000 ml, 40 mmol/l, 500 ml/h, 2 h',/Pompa \/ wlew KCl: 40 mmol = 20 ml KCl 15% \(2 amp\. 10 ml\) w objętości końcowej 1000 ml → stężenie 40 mmol\/l; 20 mmol\/h = 500 ml\/h; czas 2 h/.test(t),t);
  rec('EL: wynik, monitorowanie, WNIOSKI, bez nadmiaru (źródła, ChPL 4.2, dializa)',/Wynik: 2,6 mmol\/l/.test(t)&&/Monitorowanie:/.test(t)&&/WNIOSKI:/.test(t)&&!JUNK.test(t)&&!/Wskazania do dializy/.test(t),t.match(JUNK)||t);
  // hiperkaliemia z EKG
  await f.evaluate(()=>document.querySelector('[data-k="hiperK"]').click());await sleep(300);
  await f.evaluate(()=>{const i=document.querySelector('#L_k');i.value='7.1';i.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-o="ecg"]').click();});await sleep(400);
  t=await printMod();
  rec('EL: hiperkaliemia 7,1 + EKG → wapń 20 ml = 9,2 mmol, insulina 10 j. + glukoza 25 g, zaznaczono EKG, hospitalizacja',/20 ml \(2 amp\. × 10 ml\) = 9,2 mmol Ca/.test(t)&&/10 j\. i\.v\. \+ glukoza 25 g/.test(t)&&/Zaznaczono: zmiany EKG/.test(t)&&/Ciężkie zaburzenie/.test(t)&&!/NZK|digoksyna/.test(t),t);
  rec('EL: hiperkaliemia bez nadmiaru',!JUNK.test(t),t.match(JUNK));
  t=await full();rec('EL w raporcie zbiorczym',/Elektrolity SOR/.test(t)&&/9,2 mmol Ca/.test(t),t);
  await wipe();t=await full();rec('EL: po „Następny pacjent” brak w raporcie',!/Elektrolity SOR/.test(t),t);
  await fresh();await setP({pw:'80'});await show('el');await show('dashboard');t=await full();rec('EL: samo otwarcie modułu → nie w raporcie',!/Elektrolity SOR/.test(t),t);
  // ===== DKA =====
  await fresh();await setP({pw:'80',pa:'40'});await tab('dka','main');
  await setF({glu:'540',ket:'5',ph:'7.1',hco3:'10',k:'4.5',na:'135',cl:'100',dm:true});await sleep(400);
  t=await printMod();
  rec('DKA: insulina 8 j./h = 8 ml/h, pompa 50 j. = 0,5 ml + 49,5 ml NaCl → 50 ml, 1 j./ml',/8 j\.\/h = 8 ml\/h \(0,1 j\.\/kg\/h × 80 kg\)/.test(t)&&/50 j\. insuliny = 0,5 ml z pena 100 j\.\/ml \+ 49,5 ml NaCl 0,9% → objętość końcowa 50 ml; stężenie 1 j\.\/ml/.test(t),t);
  rec('DKA: płyny 1 000 ml/h, dane wpisane, WNIOSKI hospitalizacja + OIT (luka >16)',/1\. 1 l \/ 1 h = 1 000 ml\/h/.test(t)&&/Dane: Glukoza 540 mg\/dl/.test(t)&&/znana cukrzyca/.test(t)&&/HOSPITALIZACJA – DKA/.test(t)&&/OIT \/ HDU/.test(t),t);
  rec('DKA: bez nadmiaru (źródła, wskazówki HHS, kryteria ustąpienia, niezaznaczone)',!JUNK.test(t)&&!/Kryteria ustąpienia|HHS – wskazówki|glikemia nie spada/.test(t),t.match(JUNK)||t);
  t=await full();rec('DKA w raporcie zbiorczym',/Kwasica ketonowa/.test(t)&&/8 ml\/h/.test(t),t);
  await wipe();t=await full();rec('DKA: po „Następny pacjent” brak w raporcie',!/Kwasica ketonowa/.test(t),t);
  await fresh();await setP({pw:'80'});await tab('dka','rates');await show('dashboard');t=await full();rec('DKA: samo przeglądanie zakładek → nie w raporcie',!/Kwasica ketonowa/.test(t),t);
  // ===== Stan padaczkowy =====
  await fresh();await setP({pw:'80',pa:'40'});await show('se');f=await frame();
  await f.evaluate(()=>document.querySelector('[data-k="lev"]').click());await sleep(400);
  t=await printMod();
  rec('SE: lewetyracetam z masy (Drukuj) – 4500 mg, 45 ml, 145 ml, 580 ml/h',/Dawka: 4500 mg = 56,3 mg\/kg; = 45 ml \(9 fiol\. 500 mg\/5 ml\); w 100 ml NaCl → 145 ml; pompa: 580 ml\/h przez 15 min/.test(t)&&/Preparat: Keppra/.test(t),t);
  rec('SE: WNIOSKI, bez nadmiaru (źródła, tabela, etap 0)',/WNIOSKI:/.test(t)&&!JUNK.test(t)&&!/Stabilizacja/.test(t),t.match(JUNK)||t);
  await f.evaluate(()=>document.querySelector('#give').click());await sleep(400);
  await f.evaluate(()=>document.querySelector('[data-k="pro"]').click());await sleep(400);
  t=await printMod();
  rec('SE: dziennik podań + propofol bolus 80 mg = 8 ml, wlew 9,6 ml/h, WNIOSKI II rzut',/PODANO \(DZIENNIK\)/.test(t)&&/Lewetyracetam/.test(t)&&/bolus = 8 ml \(10 mg\/ml\)/.test(t)&&/9,6 ml\/h/.test(t)&&/Po leku II rzutu/.test(t),t);
  t=await full();rec('SE w raporcie zbiorczym',/Stan padaczkowy/.test(t)&&/4500 mg/.test(t),t);
  await wipe();t=await full();rec('SE: po „Następny pacjent” brak w raporcie',!/Stan padaczkowy/.test(t),t);
  await fresh();await setP({pw:'80'});await show('se');await show('dashboard');t=await full();rec('SE: samo otwarcie modułu → nie w raporcie',!/Stan padaczkowy/.test(t),t);
  rec('Brak błędów JS',errs.length===0,errs.join(' | '));
  await br.close();console.log(fail?`${n-fail}/${n} PASS, ${fail} FAIL`:`${n}/${n} PASS`);process.exit(fail?1:0);
})().catch(e=>{console.log('FAIL wyjątek '+e.message);process.exit(1);});
