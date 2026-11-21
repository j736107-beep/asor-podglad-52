// fix20: wydruk ONS (ostra niewydolność serca), Zapalenie płuc, Zatrucia – tylko wypełnione pozycje, dawki/pompy, skale z kompletu, wnioski. BASE, SHOTS opcjonalne.
const pp=require('puppeteer-core');
const BASE=process.env.BASE||'http://localhost:8765/',SHOTS=process.env.SHOTS||'';
const sleep=t=>new Promise(r=>setTimeout(r,t));
let n=0,fail=0;const rec=(name,ok,info)=>{n++;if(!ok)fail++;console.log((ok?'PASS ':'FAIL ')+name+(ok?'':' :: '+String(info||'').slice(0,700)));};
const JUNK=/Nie ustalonoNieTak|Źródła, wersje|Weryfikacja dostępu|Brak danych do raportu|SOR \/ MODUŁ KLINICZNY|Nie wpisano|Przed podaniem: wiek|Dalsza ocena|Morfina nie jest|Którą skalę wybrać|Jawny rachunek PSI|Diagnostyka i kontrola|Antizol \(etykieta\)|Hemodializa zmienia harmonogram|Etanol jako odtrutka|Pracownia Toksykologiczna|Kiedy ZAKOŃCZYĆ NAC|Zasada: nie czekaj|Uzupełnij parametry/;
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
  const setF=o=>page.evaluate(o=>{for(const [id,v] of Object.entries(o)){const e=document.querySelector('#main .clinical-form #'+id);if(!e)throw Error('brak '+id);if(e.type==='checkbox'){if(e.checked!==v)e.click();}else{e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));}}},o);
  const tab=async(m,t)=>{await page.evaluate((m,t)=>SKS.goTab(m,t),m,t);await sleep(900);};
  const printMod=async()=>{await page.evaluate(()=>document.getElementById('printMod').click());await sleep(500);return page.evaluate(()=>document.getElementById('printArea').innerText);};
  const full=()=>page.evaluate(()=>{SORReport.capture(SKS.active());return SORReport.fill(['done','pumps','fluid','modules']).innerText;});
  const wipe=async()=>{await Promise.all([page.waitForNavigation({waitUntil:'networkidle2',timeout:60000}).catch(()=>{}),page.evaluate(()=>{window.confirm=()=>true;SKS.wipe();})]);await page.waitForFunction(()=>window.SKS&&window.SORReport,{timeout:30000});await sleep(300);};
  // ===== ONS =====
  await fresh();await setP({pw:'80',pa:'70'});await tab('ahf','assessment');
  await setF({sbp:'150',sat:'95',rr:'22',congest:'yes',hypo:'no',naive:'yes',ntg:'20',pde:'no'});await sleep(300);
  let t=await printMod();
  rec('ONS: furosemid 20–40 mg i.v. i pompa NTG 50 mg/50 ml, 20 µg/min = 1,2 ml/h',/Furosemid i\.v\.: 20–40 mg i\.v\./.test(t)&&/50 mg leku w objętości końcowej 50 ml \(stężenie 1 mg\/ml = 1000 µg\/ml\); dawka 20 µg\/min → 1,2 ml\/h/.test(t),t);
  rec('ONS: przeciwwskazania udokumentowane (bez PDE-5), parametry, WNIOSKI',/bez PDE-5 \/ riocyguatu/.test(t)&&/SBP 150 mmHg, SpO₂ 95%, oddechy 22\/min/.test(t)&&/WNIOSKI:/.test(t)&&/Miejsce leczenia: decyzja lekarza/.test(t),t);
  rec('ONS: bez nadmiaru (dydaktyka, listy, źródła, NIE)',!JUNK.test(t)&&!/hipoperfuzji/.test(t),t.match(JUNK));
  if(SHOTS){await page.evaluate(()=>{const a=document.getElementById('printArea');a.style.cssText='position:fixed;inset:0;overflow:auto;z-index:99999;background:#fff;padding:12px;display:block;visibility:visible';});await page.screenshot({path:SHOTS+'/ons.png'});}
  await setF({sbp:'85'});await sleep(300);t=await printMod();
  rec('ONS: SBP 85 → HOSPITALIZACJA BEZWZGLĘDNA, NTG nie wyliczono (SBP >110 wymagane)',/HOSPITALIZACJA BEZWZGLĘDNA – hipotensja/.test(t)&&/nie wyliczono – wymagane SBP >110/.test(t)&&!/1,2 ml\/h/.test(t),t);
  t=await full();rec('ONS w raporcie zbiorczym',/Ostra niewydolność serca/.test(t)&&/Furosemid/.test(t),t);
  await wipe();t=await full();rec('ONS: po „Następny pacjent” brak w raporcie',!/Ostra niewydolność serca/.test(t),t);
  // ===== Zapalenie płuc =====
  await fresh();await setP({pw:'80',pa:'70'});await tab('cap','scores');
  await setF({rr:'24',sbp:'125',dbp:'75',hr:'98',temp:'38.6',spo2:'93',urea:'30',confusion:'no'});await sleep(400);
  t=await printMod();
  rec('PZP: CURB-65 z kompletu 1/5, PSI niepełny nie drukowany, parametry',/CURB-65: 1\/5 \(wiek ≥65\)/.test(t)&&!/PSI \/ PORT:/.test(t)&&/oddechy 24\/min, RR 125\/75 mmHg, HR 98\/min, temp\. 38,6 °C, SpO₂ 93%/.test(t),t);
  rec('PZP: WNIOSKI z rekomendacją programu + antybiotykoterapia z silnika',/WNIOSKI:/.test(t)&&/Rekomendacja programu: leczenie domowe/.test(t)&&/antybiotykoterapia/i.test(t),t);
  rec('PZP: bez nadmiaru (Jawny rachunek PSI, Którą skalę, Diagnostyka, listy, NIE)',!JUNK.test(t)&&!/splątanie/.test(t),t.match(JUNK));
  t=await full();rec('PZP w raporcie zbiorczym',/Zapalenie płuc/.test(t)&&/CURB-65: 1\/5/.test(t),t);
  await wipe();t=await full();rec('PZP: po „Następny pacjent” brak w raporcie',!/Zapalenie płuc/.test(t),t);
  // ===== Zatrucia: fomepizol z samej masy + Drukuj =====
  await fresh();await setP({pw:'80'});await tab('tox','antidote');
  t=await printMod();
  rec('Zatrucia: fomepizol z samej masy (Drukuj) – 1 200 mg, 1,2 ml + 100 ml → 101,2 ml, 202,4 ml/h',/15 mg\/kg × 80 kg = 1 200 mg/.test(t)&&/1,2 ml leku \+ 100 ml/.test(t)&&/objętość końcowa 101,2 ml; stężenie 11,86 mg\/ml/.test(t)&&/202,4 ml\/h/.test(t),t);
  rec('Zatrucia: fomepizol – status ChPL, konsultacja toksykologiczna, bez nadmiaru',/bez polskiej ChPL/.test(t)&&/12 411 99 99/.test(t)&&!JUNK.test(t),t.match(JUNK)||t);
  // paracetamol
  await tab('tox','para');await setF({mg:'12000',hrs:'2'});await sleep(400);
  t=await printMod();
  rec('Zatrucia: paracetamol 150 mg/kg → NAC 3 worki z mg, ml, ml/h',/1\. worek \(nasycenie\): 12 000 mg \(150 mg\/kg\) = 120 ml NAC 100 mg\/ml; rozcieńczalnik \(NaCl 0,9% lub G5%\): 200 ml; objętość końcowa 320 ml; czas 60 min; 320 ml\/h/.test(t)&&/3\. worek: 8 000 mg/.test(t)&&/NAC i\.v\. wskazany/.test(t),t);
  rec('Zatrucia: paracetamol bez nadmiaru (wykres/zasady/kryteria zakończenia)',!JUNK.test(t)&&!/<svg|Rumack–Matthew: POWYŻEJ/.test(t),t.match(JUNK));
  t=await full();rec('Zatrucia w raporcie zbiorczym (fomepizol + NAC)',/Zatrucia/.test(t)&&/1 200 mg/.test(t)&&/12 000 mg/.test(t),t);
  // etanol
  await tab('tox','ethanol');await setF({rr:'14',sbp:'120',spo2:'96',temp:'36.4',ethanol:'250',escort:'yes',trauma:'no'});await sleep(300);
  t=await printMod();
  rec('Zatrucia: etanol 250 mg/dl (= 54,3 mmol/l), obserwacja, bez „możliwy uraz”',/Etanol: 250 mg\/dl \(= 54,3 mmol\/l\)/.test(t)&&/Obserwacja w SOR/.test(t)&&!/możliwy uraz/.test(t),t);
  await wipe();t=await full();rec('Zatrucia: po „Następny pacjent” brak w raporcie',!/Zatrucia/.test(t)&&!/1 200 mg/.test(t),t);
  // samo przeglądanie zakładki fomepizolu (bez Drukuj/pól) nie dodaje modułu
  await fresh();await setP({pw:'80'});await tab('tox','antidote');await page.evaluate(()=>SKS.show('dashboard'));await sleep(500);
  t=await full();rec('Zatrucia: samo otwarcie zakładki fomepizolu → nie w raporcie',!/Zatrucia/.test(t),t);
  rec('Brak błędów JS',errs.length===0,errs.join(' | '));
  await br.close();console.log(fail?`${n-fail}/${n} PASS, ${fail} FAIL`:`${n}/${n} PASS`);process.exit(fail?1:0);
})().catch(e=>{console.log('FAIL wyjątek '+e.message);process.exit(1);});
