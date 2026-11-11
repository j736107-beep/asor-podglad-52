// Wdrożenie audytu modułów (11.11.2026) – testy przeglądarkowe faz 1–3. BASE (domyślnie lokalnie :8765), SHOTS (katalog zrzutów), PHASE (1|2|3, domyślnie 3).
const pp=require('puppeteer-core'),fs=require('fs');const BASE=process.env.BASE||'http://localhost:8765/',SHOTS=process.env.SHOTS||'',PHASE=+(process.env.PHASE||3);
const sleep=t=>new Promise(r=>setTimeout(r,t));let n=0,fail=0;const rec=(name,ok,info)=>{n++;if(!ok)fail++;console.log((ok?'PASS ':'FAIL ')+name+(ok?'':' :: '+String(info||'').slice(0,300)));};
(async()=>{const br=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const page=await br.newPage();await page.setViewport({width:1280,height:900});
const errs=[];page.on('pageerror',e=>errs.push(e.message));
await page.goto(BASE+'?'+Date.now(),{waitUntil:'networkidle2'});await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.reload({waitUntil:'networkidle2'});
await page.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(b=>/Rozumiem|Akceptuj/i.test(b.textContent));b&&b.click();});await sleep(300);
const shot=async f=>{if(SHOTS){fs.mkdirSync(SHOTS,{recursive:true});await page.screenshot({path:SHOTS+'/'+f});}};
const setBar=async(w,age)=>page.evaluate((w,age)=>{const s=(id,v)=>{const e=document.getElementById(id);if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}};s('pw',w);s('pa',age);},w,age);
const type=async(id,v)=>page.evaluate((id,v)=>{const e=document.querySelector('#main #'+id);if(!e)return false;e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true;},id,v);
const main=()=>page.evaluate(()=>document.getElementById('main').innerText);
await setBar('70','60');
// ---------------- FAZA 1 ----------------
await page.evaluate(()=>SKS.goTab('acoag','alt2'));await sleep(500);
let t=await main();rec('F1 Antykoagulacja → „Alteplaza: udar”: brak drugiego kalkulatora, link do Neurologii',/w module Neurologia/.test(t)&&!/0,9 mg\/kg, maks\. 90 mg: 10% w bolusie/.test(t)&&!/Czas od ostatniego widzenia zdrowego/.test(t),t.slice(0,300));
await shot('f1-1-antykoagulacja-udar-link.png');
await page.evaluate(()=>document.querySelector('#main [data-go-tab="neuro:t"]').click());await sleep(700);
let on=await page.evaluate(()=>({mod:localStorage.getItem('sk_mod'),tab:(document.querySelector('#main .tabs button.on, #main [data-t].on')||{}).textContent||'',inr:!!document.querySelector('#main #inr'),plt:!!document.querySelector('#main #plt')}));
rec('F1 Link otwiera Neurologia → Tromboliza (pola INR i PLT)',on.mod==='neuro'&&/Trombol/.test(on.tab)&&on.inr&&on.plt,JSON.stringify(on));
await type('h','2');await type('sbp','185');await type('dbp','110');await type('glu','120');await type('inr','1.8');await sleep(400);t=await main();
rec('F1 Neurologia: INR 1,8 → przeciwwskazanie, brak dawki',/INR >1,7/.test(t)&&/Brak wskazań/.test(t),t.slice(0,400));
await type('inr','1.0');await type('plt','200');await sleep(400);t=await main();
rec('F1 Neurologia: RR 185/110 dopuszczone (ChPL >185/>110) → dawka 63 mg (0,9 × 70 kg), bolus 6,3, wlew 56,7 ml/h',/63 mg = 63 ml/.test(t)&&/6,3 ml/.test(t)&&/56,7 ml\/h/.test(t)&&!/Obniż RR przed podaniem/.test(t),t.slice(0,600));
await shot('f1-2-neurologia-tromboliza-63mg.png');
await type('glu','450');await sleep(300);t=await main();rec('F1 Neurologia: glikemia 450 mg/dl → przeciwwskazanie ChPL (czerwone, dawka dopiero po wyrównaniu)',/przeciwwskazanie wg ChPL Actilyse/.test(t)&&/Dopiero po wyrównaniu/.test(t),t.slice(0,500));
await page.evaluate(()=>SKS.goTab('acoag','alt3'));await sleep(500);t=await main();rec('F1 Antykoagulacja → „Alteplaza: ZP”: link do modułu Zatorowość płucna',/w module Zatorowość płucna/.test(t),t.slice(0,300));
await page.evaluate(()=>document.querySelector('#main [data-go-tab="pe:lysis"]').click());await sleep(700);t=await main();await shot('f1-3-zp-alteplaza-nzk.png');
rec('F1 Link otwiera Zatorowość płucna → Alteplaza; notka NZK (ERC 2021) przeniesiona',(await page.evaluate(()=>localStorage.getItem('sk_mod')))==='pe'&&/Zatrzymanie krążenia z powodu ZP/.test(t),t.slice(0,300));
await page.evaluate(()=>SKS.goTab('acoag','alt1'));await sleep(800);t=await main();rec('F1 Alteplaza STEMI zostaje w Antykoagulacji',/fibrynoliza, gdy PPCI/i.test(t)&&/Czas od początku objawów/i.test(t),t.slice(0,900));
if(PHASE>=2){}
if(PHASE>=3){}
rec('Brak błędów JS',!errs.length,errs.join(' | '));
await br.close();console.log((n-fail)+'/'+n+(fail?' FAIL':' PASS'));process.exit(fail?1:0);})();
