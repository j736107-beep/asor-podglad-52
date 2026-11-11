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
if(PHASE>=2){
// ---------------- FAZA 2 ----------------
const ids=await page.evaluate(()=>SKM.list.map(m=>m.id));const side=await page.evaluate(()=>[...document.querySelectorAll('#side [data-id]')].map(b=>b.dataset.id));
rec('F2 Menu: brak „Telefony szpitalne”, „ICD-10”, „ICD-9”, „EUCAST”; jest „Książka telefoniczna” i „ICD”',!side.includes('telszp')&&!side.includes('icd10')&&!side.includes('icd9')&&!side.includes('eucast')&&side.includes('telefony')&&side.includes('icd'),side.join(','));
await page.evaluate(()=>SKS.goTab('ahf','nor'));await sleep(800);t=await main();
rec('F2 ONS: stary link „Noradrenalina” → zakładka „Leki wlewowe → Pompy SOR”; brak drugiego kalkulatora',/Leki wlewowe w AHF – ściąga/.test(t)&&!/Liczba ampułek \/ fiolek/.test(t)&&!/Pompa: ampułki → ml\/h/.test(t),t.slice(0,400));
const tabsA=await page.evaluate(()=>[...document.querySelectorAll('#main [data-clin-tab]')].map(b=>b.dataset.clinTab));rec('F2 ONS: zakładki assessment + pompy (bez b1/nor/dob/dop)',JSON.stringify(tabsA)===JSON.stringify(['assessment','pompy']),JSON.stringify(tabsA));
const btns=await page.evaluate(()=>[...document.querySelectorAll('#main [data-open-pompa]')].map(b=>b.dataset.openPompa));
rec('F2 ONS: przyciski „Otwórz w Pompach” dla 9 presetów (nor×3, dob, adr, dop, lev, ntg, fur)',btns.length===9&&['noradrenalina_c80','noradrenalina_c','noradrenalina_p','dobutamina','adrenalina','dopamina','levosimendan','nitrogliceryna','furosemid'].every(x=>btns.includes(x)),btns.join(','));
rec('F2 ONS: worek 250 ml wg ChPL przy 70 kg – dobutamina 5 µg/kg/min = 21,0 ml/h, dopamina 0,8 mg/ml 5 µg/kg/min = 26,3 ml/h',/21(,0)? ml\/h/.test(t)&&/26,3 ml\/h/.test(t),t.slice(t.indexOf('Worek'),t.indexOf('Worek')+400));
await shot('f2-1-ons-sciaga-pompy.png');
await page.evaluate(()=>document.querySelector('#main [data-open-pompa="levosimendan"]').click());await sleep(1500);
const fr=page.frames().find(f=>/mod\/pompy/.test(f.url()));let lv={};
if(fr){await fr.evaluate(()=>{const e=document.querySelector('#ds');if(e){e.value='0.1';e.dispatchEvent(new Event('input',{bubbles:true}));}});await sleep(400);lv=await fr.evaluate(()=>({h:location.hash,ml:(document.querySelector('#ml')||{}).value,txt:document.body.innerText.slice(0,3000)}));}
rec('F2 Pompy: przycisk otwiera preset Levosimendan; 70 kg × 0,1 µg/kg/min = 8,4 ml/h (ChPL tab. 0,05 mg/ml: 8)',lv.h==='#d/levosimendan'&&/Levosimendan/.test(lv.txt||'')&&/^8[.,]4/.test(String(lv.ml||'')),JSON.stringify({h:lv.h,ml:lv.ml}));
await shot('f2-2-pompy-levosimendan.png');
await page.evaluate(()=>SKS.show('telszp'));await sleep(900);t=await main();let tb=await page.evaluate(()=>(document.querySelector('#main .tl-tabs button.on')||{}).textContent);
rec('F2 Stary id „telszp” → Książka telefoniczna, zakładka „Nasz szpital”',(await page.evaluate(()=>localStorage.getItem('sk_mod')))==='telefony'&&tb==='Nasz szpital'&&/PSZS|Nowy Targ/.test(t),tb+' :: '+t.slice(0,200));
await shot('f2-3-ksiazka-nasz-szpital.png');
await page.evaluate(()=>SKS.show('icd9'));await sleep(1200);tb=await page.evaluate(()=>(document.querySelector('#main .icd-tabs button.on')||{}).textContent);t=await main();
rec('F2 Stary id „icd9” → moduł ICD, zakładka ICD-9',(await page.evaluate(()=>localStorage.getItem('sk_mod')))==='icd'&&/ICD-9/.test(tb||'')&&/ICD-9 — procedury/.test(t),tb);
await page.evaluate(()=>document.querySelector('#main .icd-tabs [data-t="icd10"]').click());await sleep(1200);t=await main();
const icdOk=await page.evaluate(async()=>{const q=document.querySelector('#icd-q');q.value='J18';q.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,1500));return document.querySelector('#icd-res').innerText.slice(0,300);});
rec('F2 ICD: zakładka ICD-10 wyszukuje (J18 → zapalenie płuc)',/J18/.test(icdOk),icdOk);
await shot('f2-4-icd.png');
for(const [mod,tab,lab] of [['sepsis','c','Sepsa → Antybiotyki wg ogniska'],['cap','abx51','ZP → Antybiotykoterapia'],['leki',null,'Leki']]){
 if(tab)await page.evaluate((m,tb)=>SKS.goTab(m,tb),mod,tab);else await page.evaluate(m=>SKS.show(m),mod);await sleep(1000);
 const has=await page.evaluate(()=>!!document.querySelector('#main [data-eucast] .euc-open'));rec('F2 EUCAST: przycisk w module '+lab,has,'');}
await page.evaluate(()=>SKS.show('eucast'));await sleep(700);rec('F2 Stary id „eucast” → Leki z przyciskiem EUCAST',(await page.evaluate(()=>localStorage.getItem('sk_mod')))==='leki'&&await page.evaluate(()=>!!document.querySelector('#main [data-eucast]')),'');
const kalk=await page.evaluate(()=>{const G=window.KALK?KALK.G:null;if(!G)return null;let c=0;G.forEach(g=>g[2].forEach(x=>{if(x==='caCorr')c++;}));return c;});
rec('F2 Kalkulatory: „Wapń skorygowany” raz w menu (Nefrologia)',kalk===1,String(kalk));
await page.evaluate(()=>SKS.goTab('tox','alcohols'));await sleep(900);t=await main();const tl=await page.evaluate(()=>[...document.querySelectorAll('#b2contacts a[href^="tel:"]')].map(a=>a.textContent));
rec('F2 Zatrucia: w panelu tylko telefon alarmowy toksykologa 24 h + przyciski do Książki (bez przepisanych numerów)',tl.length===1&&/12 411 99 99/.test(tl[0])&&/Książka telefoniczna/.test(t),JSON.stringify(tl));
await shot('f2-5-zatrucia-kontakty.png');
await page.evaluate(()=>{const b=[...document.querySelectorAll('#b2contacts [data-book]')].find(x=>x.dataset.book==='PSSE');b&&b.click();});await sleep(1200);t=await main();
rec('F2 Zatrucia → Książka: wyszukiwanie „PSSE” pokazuje PSSE Nowy Targ (18 266 29 14)',(await page.evaluate(()=>localStorage.getItem('sk_mod')))==='telefony'&&/18 266 29 14/.test(t),t.slice(0,300));
await page.evaluate(()=>SORTel.openBook('toksykolog'));await sleep(1000);t=await main();
rec('F2 Książka: kontakty przeniesione z Zatruć (12 400 26 60, 12 400 36 14) są w Książce',/12 400 26 60/.test(t)&&/12 400 36 14/.test(t),t.slice(0,300));
await page.evaluate(()=>SKS.goTab('neuroinf','r'));await sleep(900);t=await main();const nl=await page.evaluate(()=>document.querySelectorAll('#main .tl-nums a[href^="tel:"]').length);
rec('F2 Neuroinfekcje: lista oddziałów zakaźnych zastąpiona przyciskiem do Książki',nl===0&&!!(await page.evaluate(()=>document.querySelector('#main [data-zak-link] [data-book]'))),String(nl));
await page.evaluate(()=>document.querySelector('#main [data-zak-link] [data-book]').click());await sleep(1000);t=await main();
rec('F2 Neuroinfekcje → Książka: „zakaźne” pokazuje oddziały zakaźne',/zakaźn/i.test(t)&&/📞/.test(t),t.slice(0,200));
}
if(PHASE>=3){}
rec('Brak błędów JS',!errs.length,errs.join(' | '));
await br.close();console.log((n-fail)+'/'+n+(fail?' FAIL':' PASS'));process.exit(fail?1:0);})();
