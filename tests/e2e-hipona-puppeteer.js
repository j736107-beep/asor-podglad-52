/* 11.11.2026: Hiponatremia – prowadzony protokół bolusów (ESE 2014 + standard lokalny SOR).
   BASE=http://localhost:8765/ SHOTS=/workspace/fix_hipona node e2e-hipona-puppeteer.js */
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://localhost:8765/',SHOTS=process.env.SHOTS||'';let n=0,fail=0;function ok(c,m,d){n++;console.log((c?'PASS ':'FAIL ')+m+(c||!d?'':' — '+String(d).slice(0,400)));if(!c)fail++;}
(async()=>{const br=await puppeteer.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox'],headless:'new'});
 const page=await br.newPage();await page.setViewport({width:1200,height:1600});const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error')errs.push(m.text());});page.on('dialog',d=>d.accept());
 await page.goto(BASE,{waitUntil:'networkidle0'});await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.reload({waitUntil:'networkidle0'});
 await page.evaluate(()=>document.querySelector('#side button[data-id="el"]').click());await sleep(1200);
 let f=null;for(let k=0;k<30&&!f;k++){f=page.frames().find(x=>x.url().includes('mod/el'));if(!f)await sleep(200);}
 await f.waitForSelector('body');await sleep(500);
 const shot=async name=>{if(!SHOTS)return;require('fs').mkdirSync(SHOTS,{recursive:true});const h=await page.evaluate(()=>{const fr=[...document.querySelectorAll('iframe')].find(x=>/mod\/el/.test(x.src));if(fr){fr.scrollIntoView();return fr.getBoundingClientRect();}return null;});
  const tk=await f.evaluate(()=>{const e=document.getElementById('naTrk');if(e){e.scrollIntoView();return true;}return false;});await sleep(200);await page.screenshot({path:SHOTS+'/'+name});};
 const inp=async(id,v)=>{await f.evaluate((id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},id,v);await sleep(250);};
 const click=async sel=>{await f.evaluate(sel=>{const b=document.querySelector(sel);if(!b)throw new Error('brak '+sel);b.click();},sel);await sleep(250);};
 const S=async()=>f.evaluate(()=>{const g=id=>(document.getElementById(id)||{}).textContent||'';const b=document.getElementById('bolGive');
  return{dec:g('naDecision'),bol:b?{dis:b.disabled,t:b.textContent}:null,why:g('bolWhy'),trk:g('naTrack'),plan:g('naPlan24'),hand:(document.getElementById('naHand')||{}).value||'',relower:g('relower'),naNeed:!!document.getElementById('naNeed'),volNeed:!!document.getElementById('volNeed'),sev:g('sev')};});
 const na=async(v,sym)=>{await f.evaluate(v=>{document.getElementById('naNext').value=v;},String(v));await click(sym==='better'?'#naBetter':'#naSame');await sleep(30);};
 const bol=async()=>{await click('#bolGive');await sleep(30);};
 await click('[data-k="hipoNa"]');await inp('w','70');await inp('L_na','112');
 let s=await S();
 ok(/Uzupełnij/.test(s.dec)&&/objaw/.test(s.dec)&&s.bol.dis&&!s.plan&&s.naNeed&&s.volNeed,'Na 112 bez objawów/wolemii → „Uzupełnij”, bolus zablokowany, brak planu',JSON.stringify(s).slice(0,300));
 ok(!await f.evaluate(()=>[...document.querySelectorAll('[data-o].on')].length),'Brak preselekcji objawów / wolemii','');
 await shot('hn-0-brak-danych-brak-rekomendacji.png');
 await click('[data-o="sympt:severe"]');await click('[data-o="vol:eu"]');s=await S();
 ok(/PODAJ bolus 1\/3/.test(s.dec)&&!s.bol.dis&&/nr 1 z 3/.test(s.bol.t)&&!s.volNeed,'Ciężkie objawy + euwolemia → PODAJ bolus 1/3, przycisk „nr 1 z 3” aktywny',JSON.stringify(s.bol)+s.dec);
 ok(await f.evaluate(()=>/5 amp\. NaCl 10%/.test(document.getElementById('naTrk').textContent)&&/100 ml glukozy 5%/.test(document.getElementById('naTrk').textContent)&&/≈3,3%/.test(document.getElementById('naTrk').textContent)&&/85,6 mmol/.test(document.getElementById('naTrk').textContent)&&/20 min/.test(document.getElementById('naTrk').textContent)),'Skład bolusa: 5 amp. NaCl 10% + 100 ml G5% = 150 ml ≈3,3%, 85,6 mmol, 20 min','');
 await shot('hn-1-podaj-bolus-1.png');
 await bol();s=await S();
 ok(s.bol.dis&&/kontrola Na⁺ o \d\d:\d\d/.test(s.dec)&&/ZABLOKOWANY/.test(s.why),'Po bolusie 1 → czekaj na Na⁺ (20 min), kolejny bolus zablokowany',s.dec);
 await na(115,'same');s=await S();
 ok(/SUGEROWANY kolejny bolus 2\/3/.test(s.dec)&&/\+3/.test(s.dec)&&!s.bol.dis&&/nr 2 z 3/.test(s.bol.t)&&!s.plan,'112 → bolus → 115, objawy utrzymują się → sugerowany bolus 2/3',s.dec);
 await shot('hn-2-115-sugerowany-kolejny-bolus.png');
 await bol();await na(118,'same');s=await S();
 ok(/STOP bolusom/.test(s.dec)&&/\+6/.test(s.dec)&&s.bol.dis&&/STOP/.test(s.why),'→ 118 (+6) → STOP bolusom (z powodem), przycisk zablokowany',s.dec);
 ok(/STOP hipertonicznego NaCl/.test(s.plan)&&/KVO/.test(s.plan)&&/6 h i 12 h/.test(s.plan)&&/Euwolemia \/ SIADH/.test(s.plan)&&/100 ml\/h/.test(s.plan)&&/Potas/.test(s.plan)&&/≤10 mmol\/l/.test(s.plan)&&/desmopresynę 2 µg/.test(s.plan),'Plan 24 h widoczny od razu: STOP NaCl hipert., KVO 0,9%, Na po 6/12 h, SIADH, diureza, K⁺, limit, plan korekty',s.plan.slice(0,300));
 ok(/Hiponatremia – protokół SOR/.test(s.hand)&&/Bolus 2\/3 podany/.test(s.hand)&&/Na⁺ 118/.test(s.hand)&&/\d\d:\d\d/.test(s.hand),'Tekst do przekazania / epikryzy z godzinami',s.hand.slice(0,200));
 await shot('hn-3-118-stop-plan-24h.png');
 // cofnij ostatni → wraca stan „czekaj”
 await click('#trkUndo');s=await S();ok(/kontrola Na⁺ o/.test(s.dec)&&!s.plan,'„Cofnij ostatni wpis” usuwa wynik 118',s.dec);
 // wysokie ryzyko ODS (K 3,0)
 await click('#trkClr');await inp('L_k','3.0');s=await S();ok(/PODAJ bolus 1\/3/.test(s.dec)&&/limit 8|≤8|8 mmol/.test(await f.evaluate(()=>document.getElementById('naTrk').textContent)),'K 3,0 → ryzyko ODS: limit 8 w protokole',s.dec);
 await bol();await na(116,'same');s=await S();
 ok(/STOP bolusom/.test(s.dec)&&/4–6/.test(s.dec)&&/limit 8|≤8 mmol/.test(s.plan),'ODS: 112 → 116 (+4) → STOP (bez ryzyka byłby kolejny bolus); plan z limitem 8',s.dec);
 await shot('hn-4-ryzyko-ODS-stop-przy-4.png');
 // 3 bolusy → zakaz
 await click('#trkClr');await inp('L_k','4.2');await bol();await na(113,'same');await bol();await na(114,'same');await bol();s=await S();
 ok(s.bol.dis&&/kontrola/.test(s.dec),'3. bolus podany → oczekiwanie na Na⁺',s.dec);
 await na(115,'same');s=await S();
 ok(/ZAKAZ kolejnych bolusów – podano 3\/3/.test(s.dec)&&s.bol.dis&&/STOP hipertonicznego/.test(s.plan)&&/Objawy utrzymują się/.test(s.plan),'3 bolusy (+3) → ZAKAZ, plan 24 h + postępowanie przy utrzymujących się objawach',s.dec);
 await shot('hn-5-3-bolusy-zakaz.png');
 // poprawa objawów → STOP
 await click('#trkClr');await bol();await na(114,'better');s=await S();
 ok(/STOP bolusom – objawy ustąpiły/.test(s.dec)&&s.plan,'Poprawa objawów po 1. bolusie (+2) → STOP + plan',s.dec);
 // przekroczenie limitu
 await click('#trkClr');await na(123,'same');s=await S();
 ok(/PRZEKROCZONY LIMIT/.test(s.dec)&&/700 ml/.test(s.relower)&&/Desmopresyna 2 µg/.test(s.relower)&&s.bol.dis,'Na 112 → 123 (+11) → ZAKAZ + korekta w dół (G5% 700 ml, desmopresyna 2 µg)',s.dec+' | '+s.relower.slice(0,150));
 await shot('hn-6-przekroczony-limit-korekta.png');
 // objawy umiarkowane – 1 bolus, Na po 1 h
 await click('#trkClr');await click('[data-o="sympt:mod"]');s=await S();ok(/PODAJ bolus 1\/1/.test(s.dec)&&/60 min/.test(s.dec),'Objawy umiarkowane → 1 bolus, Na⁺ po 60 min',s.dec);
 await bol();await na(114,'same');s=await S();ok(/ZAKAZ kolejnych bolusów – podano 1\/1/.test(s.dec),'Umiarkowane: po 1 bolusie → zakaz kolejnego',s.dec);
 await click('#trkClr');await click('[data-o="sympt:none"]');s=await S();ok(/NIE jest wskazany/.test(s.dec)&&s.bol.dis,'Brak / łagodne objawy → bolus niewskazany',s.dec);
 await click('#trkClr');
 ok(!errs.length,'Brak błędów JS / konsoli',errs.join(' | '));
 await br.close();console.log((n-fail)+'/'+n+(fail?' FAIL':' PASS'));process.exit(fail?1:0);})();
