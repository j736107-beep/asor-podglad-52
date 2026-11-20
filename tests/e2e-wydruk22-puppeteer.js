// fix22: wydruk Antykoagulacja, Anafilaksja, Transfuzjologia – tylko wypełnione pozycje, dawki/pompy, WNIOSKI; raport zbiorczy; Następny pacjent; samo przeglądanie nie dodaje modułu. BASE opcjonalne.
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
  // ===== Antykoagulacja: UFH z samej masy + Drukuj =====
  await fresh();await setP({pw:'80',pa:'60'});await tab('acoag','ufh');
  let t=await printMod();
  rec('ACO: UFH 80 kg – wlew 1 440 j./h = 2,9 ml/h, pompa 25 000 j. + 45 ml → 50 ml, 500 j./ml, aPTT',/Wlew: 1 440 j\.\/h = 2,9 ml\/h/.test(t)&&/25 000 j\. \(5 ml\) \+ 45 ml NaCl 0,9% → objętość końcowa 50 ml; stężenie 500 j\.\/ml/.test(t)&&/Bolus: /.test(t)&&/aPTT po 6 h/.test(t),t);
  rec('ACO: WNIOSKI, bez nadmiaru (inne zakładki, źródła)',/WNIOSKI:/.test(t)&&!JUNK.test(t)&&!/ENOKSAPARYNA|WARFARYNA|PROTAMINA|ALTEPLAZA/.test(t),t.match(JUNK)||t);
  await tab('acoag','vka');await setF({inr:'4.5',bleed:true});await sleep(300);
  t=await printMod();
  rec('ACO: VKA INR 4,5 + krwawienie → witamina K 10 mg, 4F-PCC j. = ml; UFH nadal w wydruku',/Witamina K: 10 mg/.test(t)&&/4F-PCC \(Beriplex, 25 j\.\/ml\): [\d ]+ j\. = \d+ ml/.test(t)&&/2,9 ml\/h/.test(t),t);
  t=await full();rec('ACO w raporcie zbiorczym',/Antykoagulacja/.test(t)&&/2,9 ml\/h/.test(t)&&/4F-PCC/.test(t),t);
  await wipe();t=await full();rec('ACO: po „Następny pacjent” brak w raporcie',!/HEPARYNA NIEFRAKCJONOWANA/.test(t),t);
  await fresh();await setP({pw:'80'});await tab('acoag','ufh');await tab('acoag','enox');await show('dashboard');t=await full();rec('ACO: samo przeglądanie zakładek → nie w raporcie',!/HEPARYNA NIEFRAKCJONOWANA|ENOKSAPARYNA \(CLEXANE/.test(t),t);
  // ===== Anafilaksja =====
  await fresh();await setP({pw:'80',pa:'40'});await tab('ana','a');await setF({refr:true,hypo:true});await sleep(300);
  t=await printMod();
  rec('ANA: adrenalina 0,5 mg = 0,5 ml i.m., wlew 1 mg/50 ml → 20–40 ml/h, noradrenalina 3 ml/h, WNIOSKI OIT',/0,5 mg = 0,5 ml i\.m\./.test(t)&&/49 ml NaCl 0,9% w strzykawce 50 ml → 20–40 ml\/h/.test(t)&&/= 3 ml\/h/.test(t)&&/anestezjolog, OIT/.test(t),t);
  rec('ANA: bez nadmiaru (niezaznaczone, inne receptury)',!JUNK.test(t)&&!/Glukagon|Skurcz oskrzeli|100 µg\/ml/.test(t),t.match(JUNK)||t);
  t=await full();rec('ANA w raporcie zbiorczym',/Anafilaksja/.test(t)&&/20–40 ml\/h/.test(t),t);
  await wipe();t=await full();rec('ANA: po „Następny pacjent” brak w raporcie',!/ANAFILAKSJA – LECZENIE/.test(t),t);
  await fresh();await setP({pw:'80'});await tab('ana','a');await tab('ana','obs');await show('dashboard');t=await full();rec('ANA: samo przeglądanie zakładek → nie w raporcie',!/ANAFILAKSJA – LECZENIE|OBSERWACJA \/ WYPIS/.test(t),t);
  // ===== Transfuzjologia =====
  await fresh();await setP({pw:'80',pa:'60'});await tab('transf','d');await setF({hb:'6.5',hbt:'9',coag:true});await sleep(300);
  t=await printMod();
  rec('TR: Hb 6,5 → 3 j. KKCz; FFP 1 200 ml (15 ml/kg × 80 kg); WNIOSKI',/3 j\. KKCz/.test(t)&&/1 200 ml \(15 ml\/kg × 80 kg\)/.test(t)&&/WNIOSKI:/.test(t),t);
  rec('TR: bez nadmiaru (tabele progów, inne zakładki)',!JUNK.test(t)&&!/Progi Hb|Progi PLT|ZGODNOŚĆ ABO|MASYWNE/.test(t),t.match(JUNK)||t);
  t=await full();rec('TR w raporcie zbiorczym',/Transfuzjologia/.test(t)&&/1 200 ml/.test(t),t);
  await wipe();t=await full();rec('TR: po „Następny pacjent” brak w raporcie',!/DAWKI I PROGI/.test(t),t);
  await fresh();await setP({pw:'80'});await tab('transf','g');await tab('transf','m');await show('dashboard');t=await full();rec('TR: samo przeglądanie zakładek → nie w raporcie',!/ZGODNOŚĆ ABO|MASYWNE PRZETOCZENIE|DAWKI I PROGI/.test(t),t);
  rec('Brak błędów JS',errs.length===0,errs.join(' | '));
  await br.close();console.log(fail?`${n-fail}/${n} PASS, ${fail} FAIL`:`${n}/${n} PASS`);process.exit(fail?1:0);
})().catch(e=>{console.log('FAIL wyjątek '+e.message);process.exit(1);});
