// fix19: wydruk Zatorowość płucna (UFH: bolus + wlew + pompa) i wspólny mechanizm „Drukuj” dla dawek z masy (Antykoagulacja, Pompy). BASE, SHOTS opcjonalne.
const pp=require('puppeteer-core');
const BASE=process.env.BASE||'http://localhost:8765/',SHOTS=process.env.SHOTS||'';
const sleep=t=>new Promise(r=>setTimeout(r,t));
let n=0,fail=0;const rec=(name,ok,info)=>{n++;if(!ok)fail++;console.log((ok?'PASS ':'FAIL ')+name+(ok?'':' :: '+String(info||'').slice(0,600)));};
const DIDACT=/Źródła, wersje|Rozbieżność schematów|Nie zwiększaj stężenia|Nie wpisano rzeczywistej|Przed podaniem: wiek|Weryfikacja dostępu|Brak danych do raportu|SOR \/ MODUŁ KLINICZNY|Łączna ilość w pompie j\.m\.:|Nie ustalonoNieTak/;
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
  const setP=(o)=>page.evaluate(o=>{for(const [id,v] of Object.entries(o)){const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}},o);
  const setF=(o)=>page.evaluate(o=>{for(const [id,v] of Object.entries(o)){const e=document.querySelector('#main .clinical-form #'+id);if(!e)throw Error('brak '+id);if(e.type==='checkbox'){if(e.checked!==v)e.click();}else{e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));}}},o);
  const printMod=async()=>{await page.evaluate(()=>document.getElementById('printMod').click());await sleep(400);return page.evaluate(()=>document.getElementById('printArea').innerText);};
  const fullReport=()=>page.evaluate(()=>{SORReport.capture(SKS.active());return SORReport.fill(['done','pumps','fluid','modules']).innerText;});
  // 1. sama masa + zakładka UFH → „Drukuj”
  await fresh();await setP({pw:'80',pa:'60'});
  await page.evaluate(()=>SKS.goTab('pe','ufh'));await sleep(900);
  let t=await printMod();
  rec('Wydruk ZP: bolus 6 400 j.m. (1,28 ml) i wlew 1 450 j.m./h = 2,9 ml/h z masy 80 kg',/Bolus: 80 j\.m\.\/kg × 80 kg = 6 400 j\.m\. → 6 400 j\.m\. i\.v\. w 3 min = 1,28 ml/.test(t)&&/1 450 j\.m\.\/h \(18,13 j\.m\.\/kg\/h/.test(t)&&/Prędkość pompy: 2,9 ml\/h/.test(t),t);
  rec('Wydruk ZP: przygotowanie pompy, limity, kontrola APTT, WNIOSKI',/5 ml leku \+ 45 ml NaCl 0,9% → objętość końcowa 50 ml; stężenie 500 j\.m\.\/ml/.test(t)&&/maks\. 10 000 j\.m\./.test(t)&&/APTT po 6 h/.test(t)&&/WNIOSKI:/.test(t),t);
  rec('Wydruk ZP: bez treści dydaktycznych, niewypełnionych pól i „Brak danych”',!DIDACT.test(t)&&!/OCENA RYZYKA|TROMBOLIZA|sPESI/.test(t),t.match(DIDACT));
  if(SHOTS){await page.evaluate(()=>{const a=document.getElementById('printArea');a.style.cssText='position:fixed;inset:0;overflow:auto;z-index:99999;background:#fff;padding:12px;display:block;visibility:visible';});await page.screenshot({path:SHOTS+'/pe-1280.png'});}
  t=await fullReport();
  rec('Raport zbiorczy po wydruku: ZP z dawką UFH',/Zatorowość płucna/.test(t)&&/6 400 j\.m\./.test(t)&&/2,9 ml\/h/.test(t),t);
  // 2. samo przeglądanie (bez wydruku, bez pól) → nie trafia do raportu zbiorczego
  await fresh();await setP({pw:'80'});await page.evaluate(()=>SKS.goTab('pe','ufh'));await sleep(900);await page.evaluate(()=>SKS.show('dashboard'));await sleep(500);
  t=await fullReport();
  rec('Samo otwarcie zakładki UFH (bez Drukuj/pól) → ZP nie w raporcie zbiorczym',!/Zatorowość płucna/.test(t),t);
  // 3. pełny przypadek: ryzyko + UFH z bezpieczeństwem i potwierdzeniem
  await fresh();await setP({pw:'80',pa:'60'});
  await page.evaluate(()=>SKS.goTab('pe','risk'));await sleep(800);
  await setF({state:'stable',sbp:'120',hr:'115',sat:'94',cancer:'no',cardio:'no',rv:'yes',trop:'yes'});
  await page.evaluate(()=>document.querySelector('#main [data-clin-tab="ufh"]').click());await sleep(500);
  await setF({bleed:'no',hit:'no',other:'no'});await setF({review:true});await sleep(300);
  await page.evaluate(()=>SKS.show('dashboard'));await sleep(500);
  t=await fullReport();
  rec('Raport zbiorczy: sPESI 1/6 z kompletu, RV+troponina, UFH z dawkami, bezpieczeństwo, potwierdzenie',/Skala sPESI: 1\/6 \(HR ≥110\/min\)/.test(t)&&/Stwierdzono: dysfunkcja RV/.test(t)&&/6 400 j\.m\./.test(t)&&/bez czynnego krwawienia; bez HIT/.test(t)&&/☑ Lekarz potwierdził/.test(t),t);
  rec('Raport zbiorczy: wnioski hospitalizacja (RV+trop) + UFH; bez „nowotwór”/dydaktyki',/Hospitalizacja i monitorowanie/.test(t)&&/Leczenie przeciwkrzepliwe: UFH/.test(t)&&!/nowotwór/.test(t)&&!DIDACT.test(t),t);
  // 4. „Następny pacjent” czyści
  await Promise.all([page.waitForNavigation({waitUntil:'networkidle2',timeout:60000}).catch(()=>{}),page.evaluate(()=>{window.confirm=()=>true;SKS.wipe();})]);await page.waitForFunction(()=>window.SKS&&window.SORReport,{timeout:30000});await sleep(300);
  t=await fullReport();
  rec('Po „Następny pacjent” brak ZP w raporcie',!/Zatorowość płucna/.test(t)&&!/6 400/.test(t),t);
  // 5. Antykoagulacja → Heparyna: sama masa + Drukuj
  await fresh();await setP({pw:'80'});await page.evaluate(()=>SKS.goTab('acoag','ufh'));await sleep(900);
  t=await printMod();
  rec('Antykoagulacja → Heparyna: Drukuj z samą masą drukuje bolus i wlew',/Antykoagulacja/.test(t)&&/Bolus/.test(t)&&/Wlew/.test(t)&&/ml\/h/.test(t)&&!/Brak danych do raportu/.test(t),t);
  // 6. Pompy: bieżące (niezapisane) wyliczenie na wydruku nastaw
  await fresh();await setP({pw:'80'});await page.evaluate(()=>SKS.show('pompy'));await sleep(1200);
  let fr=page.frames().find(f=>/mod\/pompy/.test(f.url()));
  await fr.evaluate(()=>{location.hash='d/heparyna';});await sleep(800);
  await fr.evaluate(()=>{const s=document.getElementById('ds');s.value='1000';s.dispatchEvent(new Event('input',{bubbles:true}));const d=document.getElementById('dil');if(d&&!d.value){d.value=d.options[d.options.length-1].value;d.dispatchEvent(new Event('change',{bubbles:true}));}});await sleep(400);
  const cur=await fr.evaluate(()=>window.SORPumpCurrent());
  await fr.evaluate(()=>document.getElementById('printPump').click());await sleep(500);
  t=await page.evaluate(()=>document.getElementById('printArea').innerText);
  rec('Pompy: „Drukuj nastawy” bez zapisu drukuje bieżące wyliczenie (ml/h)',!!cur&&/heparyna/i.test(t)&&/ml\/h/.test(t)&&!/Brak danych do raportu/.test(t),cur+' || '+t);
  rec('Brak błędów JS',errs.length===0,errs.join(' | '));
  await br.close();console.log(fail?`${n-fail}/${n} PASS, ${fail} FAIL`:`${n}/${n} PASS`);process.exit(fail?1:0);
})().catch(e=>{console.log('FAIL wyjątek '+e.message);process.exit(1);});
