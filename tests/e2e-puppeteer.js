const puppeteer=require('puppeteer-core');const fs=require('fs');
const BASE=process.env.BASE||'http://localhost:8765/';
const R=[];function rec(id,ok,msg){R.push([id,ok?'PASS':'FAIL',msg||'']);console.log(id.padEnd(34),ok?'PASS':'FAIL',msg||'');}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
const br=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required'],headless:'new'});
const page=await br.newPage();await page.setViewport({width:1400,height:1000});
const errs=[];page.on('pageerror',e=>errs.push('pageerror '+e.message));page.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text());});
page.on('dialog',d=>d.accept());
await page.goto(BASE,{waitUntil:'networkidle0'});
await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.reload({waitUntil:'networkidle0'});
const ver=await page.$eval('#ver',e=>e.textContent);rec('Wersja 5.2 w nagłówku',/5\.2 \(testowa\)/.test(ver)&&/09\.11\.2026/.test(ver),ver);
const go=async id=>{await page.evaluate(id=>{const b=document.querySelector('#side button[data-id="'+id+'"]');b.click();},id);await sleep(700);};
const frameOf=async src=>{for(let k=0;k<30;k++){const f=page.frames().find(f=>f.url().includes(src));if(f){try{await f.waitForSelector('body');return f;}catch(e){}}await sleep(200);}return null;};
// ---- pasek pacjenta: imię i nazwisko, wiek (ręcznie), płeć – bez numeru identyfikacyjnego (RODO)
await page.type('#pbName','Jan Testowy');await page.type('#pa','82');await page.evaluate(()=>document.querySelector('#psex [data-s="m"]').click());await sleep(300);
let pa=await page.evaluate(()=>({age:document.querySelector('#pa').value,sex:[...document.querySelectorAll('#psex button.on')].map(b=>b.dataset.s).join(),n:document.querySelectorAll('#pbar input').length,id:!!document.querySelector('[id*="Pe'+'sel"]')}));
rec('Pasek: wiek wpisany ręcznie + płeć; brak pola numeru identyfikacyjnego',pa.age==='82'&&pa.sex==='m'&&!pa.id,JSON.stringify(pa));
// propagacja do troponiny (ramka)
await go('trop');let tf=await frameOf('mod/troponina');await sleep(800);
let tv=tf?await tf.evaluate(()=>({n:document.getElementById('pname')&&document.getElementById('pname').value,a:document.getElementById('age')&&document.getElementById('age').value})):null;
rec('Propagacja → Troponina (ramka)',tv&&tv.n==='Jan Testowy'&&tv.a==='82',JSON.stringify(tv));
// propagacja do modułu natywnego z #pname (neurologia)
const nid=await page.evaluate(()=>{const m=SKM.list.find(m=>m&&m.render&&/neuro/i.test(m.id));return m&&m.id;});
if(nid){await go(nid);await sleep(500);const nv=await page.evaluate(()=>{const e=document.querySelector('#main #pname');return e?{n:e.value}:null;});rec('Propagacja → '+nid+' (natywny)',nv===null||nv.n==='Jan Testowy',JSON.stringify(nv)+(nv===null?' (moduł bez pola na 1. ekranie)':''));}
// ---- WSZYSTKIE moduły: błędy konsoli
const ids=await page.evaluate(()=>SKM.list.filter(m=>m&&!m.sep&&m.id).map(m=>m.id));
const before=errs.length;const perMod={};
for(const id of ids){const e0=errs.length;await go(id);await sleep(id==='pompy'||/frame/.test(id)?900:350);if(errs.length>e0)perMod[id]=errs.slice(e0);}
rec('Brak błędów JS w '+ids.length+' modułach',Object.keys(perMod).length===0,JSON.stringify(perMod).slice(0,1500));
// ---- Ostateczny hamulec – moduł usunięty (09.11.2026)
const hm=await page.evaluate(async()=>({menu:!!document.querySelector('#side button[data-id="hamulec"]'),list:SKM.list.some(m=>m.id==='hamulec'),wyp:typeof window.SORWypis,txt:/hamulec/i.test(document.getElementById('side').textContent),sw:/hamulec|wypis\.js/.test(await (await fetch('sw.js',{cache:'no-store'})).text())}));
rec('Hamulec usunięty (menu, lista modułów, pliki, SW)',!hm.menu&&!hm.list&&hm.wyp==='undefined'&&!hm.txt&&!hm.sw,JSON.stringify(hm));
// ---- Zapalenie płuc – Skale (ZP-1 w UI): 40 M SpO2 70
await page.evaluate(()=>{document.querySelector('#pa').value='40';document.querySelector('#pa').dispatchEvent(new Event('input'));});
await go('cap');
const setScores=async(vals)=>page.evaluate(vals=>{const f=document.querySelector('.clinical-form');for(const[k,v]of Object.entries(vals)){const e=f.querySelector('#'+k);if(!e)continue;if(e.tagName==='SELECT'){e.value=v===true?'yes':v===false?'no':'';e.dispatchEvent(new Event('change'));}else{e.value=String(v);e.dispatchEvent(new Event('input'));}}},vals);
const clickTab=async t=>{await page.evaluate(t=>document.querySelector('[data-clin-tab="'+t+'"]').click(),t);await sleep(600);};
await clickTab('scores');
const NORM={rr:16,sbp:120,dbp:80,hr:80,temp:37,spo2:97,urea:24,na:140,glu:108,ph:7.4,hct:40,pao2:85,pf:400,wbc:8,platelets:250,nursing:false,cancer:false,liver:false,heart:false,stroke:false,renal:false,confusion:false,effusion:false,multilobar:false,fluidHypotension:false,ventilation:false,vasopressor:false,oral:true};
await setScores(Object.assign({},NORM,{spo2:70}));await sleep(500);
let sc=await page.evaluate(()=>({eng:(document.querySelector('#capEngine')||{}).textContent,noHold:typeof window.SORHold==='undefined'&&!document.getElementById('holdOv')&&!document.getElementById('holdLamp'),lamp2:document.getElementById('lamp').classList.contains('on')}));
rec('ZP-1 Skale SpO₂ 70%: OIT, bez alarmu blokady wypisu (mechanizm usunięty)',/OIOM \/ OIT/.test(sc.eng||'')&&sc.noHold&&!sc.lamp2,JSON.stringify(sc).slice(0,400));
// ramka antybiotykoterapii
await clickTab('abx51');const zf=await frameOf('mod/zp');await sleep(900);
const zr=async()=>zf.evaluate(()=>({place:(document.getElementById('zpPlace')||{}).textContent,dom:(()=>{const b=document.querySelector('[data-pl="home"]');return b&&{dis:b.disabled,blk:b.classList.contains('blk'),title:b.title};})(),res:document.getElementById('res').textContent,quick:document.getElementById('quick').textContent,psiBtn:document.querySelectorAll('[data-psi]').length,minor:!!document.getElementById('minor'),psi:(document.getElementById('zpPsi')||{}).textContent}));
const zrec=async(f)=>(f||zf).evaluate(()=>({rec:(document.getElementById('zpRec')||{}).textContent||'',need:(document.getElementById('zpNeed')||{}).textContent||'',on:[...document.querySelectorAll('[data-pl].on')].map(b=>b.dataset.pl),recBtn:[...document.querySelectorAll('[data-pl].rec')].map(b=>b.dataset.pl),quick:document.getElementById('quick').textContent}));
let zz=await zrec();
rec('ZP-1a ramka: rekomendacja OIT z danych, BEZ preselekcji miejsca i alergii, brak schematu do wyboru lekarza',/OIOM \/ OIT/.test(zz.rec)&&zz.on.length===0&&zz.recBtn.join()==='icu'&&/miejsce leczenia/.test(zz.need)&&/alergia/.test(zz.need)&&zz.quick==='',JSON.stringify(zz).slice(0,400));
await zf.evaluate(()=>{document.querySelector('[data-al="none"]').click();});await sleep(300);await zf.evaluate(()=>{document.querySelector('[data-pl="icu"]').click();});await sleep(400);
let z=await zr();
rec('ZP-1 ramka: lekarz wybiera OIT, Dom dostępny (bez blokady), ceftriakson/cefotaksym+makrolid, bez amoksycyliny/ampicyliny',/OIOM \/ OIT/.test(z.place)&&!z.dom.dis&&!z.dom.blk&&/Ceftriakson|ceftriakson/.test(z.quick)&&/klarytromycyna|azytromycyna|Klarytromycyna|Azytromycyna/i.test(z.quick)&&!/amoksycylin|ampicylin/i.test(z.quick),JSON.stringify({place:z.place,dom:z.dom,quick:z.quick.slice(0,300)}));
rec('PSI automatyczny, brak ręcznych PSI/małych kryteriów',z.psiBtn===0&&!z.minor&&/automatycznie/.test(z.psi||''),z.psi);
// ZP-9: lekarz wybiera Dom mimo rekomendacji OIT – wybór przyjęty, uwaga z rekomendacją
await zf.evaluate(()=>document.querySelector('[data-pl="home"]').click());await sleep(300);z=await zr();
rec('ZP-9 klik „Dom” → wybór lekarza przyjęty + uwaga z rekomendacją',/Leczenie domowe/.test(z.place)&&/wybór lekarza/.test(z.place)&&/rekomendacja silnika/.test(z.res),z.place);
await zf.evaluate(()=>document.querySelector('[data-pl="icu"]').click());await sleep(300);
// ZP-11: alergia natychmiastowa
await zf.evaluate(()=>document.querySelector('[data-al="imm"]').click());await sleep(400);z=await zr();
rec('ZP-11 alergia natychmiastowa: bez β-laktamów, fluorochinolon',/lewofloksacyna|moksyfloksacyna/i.test(z.quick)&&!/ceftriakson|cefotaksym|amoksycylin|ampicylin|piperacylin|meropenem|cefepim|ceftazydym/i.test(z.quick),z.quick.slice(0,300));
await zf.evaluate(()=>document.querySelector('[data-al="none"]').click());await sleep(300);
// ZP-2 w UI: 30 K
await page.evaluate(()=>{const a=document.querySelector('#pa');a.value='30';a.dispatchEvent(new Event('input'));document.querySelector('#psex button[data-s="f"]').click();});
await clickTab('scores');await setScores(Object.assign({},NORM,{temp:37.5}));await sleep(400);
let s2=await page.evaluate(()=>({eng:(document.querySelector('#capEngine')||{}).textContent}));
rec('ZP-2 Skale: dom możliwy',/leczenie domowe/i.test(s2.eng),JSON.stringify(s2).slice(0,300));
await clickTab('abx51');const zf2=await frameOf('mod/zp');await sleep(900);
zz=await zrec(zf2);rec('ZP-2a ramka: rekomendacja „leczenie domowe” wyliczona z danych',/leczenie domowe/.test(zz.rec)&&zz.recBtn.join()==='home',JSON.stringify(zz).slice(0,300));
await zf2.evaluate(()=>document.querySelector('[data-pl="home"]').click());await sleep(400);
z=await zf2.evaluate(()=>({place:document.getElementById('zpPlace').textContent,quick:document.getElementById('quick').textContent,dom:document.querySelector('[data-pl="home"]').disabled}));
rec('ZP-2 ramka: dom, amoksycylina 1 g p.o. co 8 h',/domowe/.test(z.place)&&/Amoksycylina[^+]*1 g[^+]*p\.o\.[^+]*8 h/i.test(z.quick)&&!z.dom,JSON.stringify(z).slice(0,300));
// ZP-8: jawny wybór lekarza zapamiętany tylko dla bieżącego pacjenta (Następny pacjent czyści – ZP-8)
const ls1=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('zp1state')||'{}');return {place:s.place||''};});
rec('ZP-8a jawny wybór „Dom” zapisany dla bieżącego pacjenta',ls1.place==='home',JSON.stringify(ls1));
// ZP-12: zmiana SpO2 w Skalach przy otwartej ramce (druga karta z modułem ZP)
const p2=await br.newPage();await p2.goto(BASE+'mod/zp/index.html',{waitUntil:'networkidle0'});await sleep(500);
const pl2a=await p2.$eval('#zpRec',e=>e.textContent);
await clickTab('scores');await setScores({spo2:91});await sleep(800);
const pl2b=await p2.$eval('#zpRec',e=>e.textContent);
rec('ZP-12 ramka odświeża się bez przeładowania (rekomendacja przeliczona)',/domowe/.test(pl2a)&&/hospitalizacja – oddział/i.test(pl2b),pl2a.slice(0,80)+' → '+pl2b.slice(0,80));
// ZP-10 (UI): SpO2 91 → oddział + alarm
let s10=await page.evaluate(()=>({eng:(document.querySelector('#capEngine')||{}).textContent,lamp:document.getElementById('lamp').classList.contains('on')}));
rec('ZP-10 Skale: SpO₂ 91 → oddział, bez alarmu',/oddział/.test(s10.eng)&&!s10.lamp,JSON.stringify(s10).slice(0,200));
await p2.close();
// ---- Druk A4: moduł cap
await page.evaluate(()=>{SORReport.capture(SKS.active());SORReport.fill([{module:'cap'}]);});
await page.emulateMediaType('print');const pdf=await page.pdf({format:'A4',printBackground:true});await page.emulateMediaType('screen');
const pages=(pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;fs.writeFileSync('/workspace/print_cap.pdf',pdf);
const ph=await page.evaluate(()=>document.getElementById('printArea').textContent);
rec('Druk A4 modułu: 1–2 strony, nagłówek pacjenta, bez sekcji blokady wypisu',pages>=1&&pages<=2&&/Jan Testowy/.test(ph)&&/wiek:\s*\d+ lat/.test(ph)&&/płeć:/.test(ph)&&!/WSTRZYMAJ|wstrzymaj wypis/i.test(ph),'stron: '+pages);
const navp=await page.$('#skPrint');rec('Przycisk „Drukuj do dokumentacji (A4)” w module',!!navp,'');
// ---- DKA: wynik bez mechanizmu blokady wypisu
await go('dka');await page.evaluate(()=>{const f=document.querySelector('#f');const set=(id,v)=>{const e=f.querySelector('#'+id);if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}};set('glu','450');set('ket','5');set('ph','7.1');set('hco3','10');set('k','4.5');set('na','135');});await sleep(400);
let dk=await page.evaluate(()=>({t:document.getElementById('main').innerText,h:typeof window.SORHold}));rec('DKA → wynik, bez alarmu blokady wypisu',/DKA|kwasica/i.test(dk.t)&&dk.h==='undefined'&&!/WSTRZYMAJ WYPIS/.test(dk.t),dk.h);
// ---- Elektrolity (ramka) – Na 110
await go('el');const ef=await frameOf('mod/el');await sleep(700);
const eIds=await ef.evaluate(()=>[...document.querySelectorAll('input')].map(i=>i.id).filter(Boolean).slice(0,30));
// ---- Następny pacjent
await page.evaluate(()=>{localStorage.setItem('el1state:test','{"a":1}');});
await go('dashboard');
await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.evaluate(()=>document.getElementById('nextPt').click())]);await sleep(500);
const after=await page.evaluate(()=>({keys:Object.keys(localStorage),ss:Object.keys(sessionStorage),name:document.querySelector('#pbName').value,age:document.querySelector('#pa').value}));
const leftover=after.keys.filter(k=>/^(zp1state|zp_handoff|el1state:|se4state:|sk_patient|sk_m_)/.test(k)&&k!=='sk_m_dka_cfg');
rec('Następny pacjent: pełny reset (także zp1state/zp_handoff/el1state:)',leftover.length===0&&!after.name&&!after.age,JSON.stringify(after).slice(0,400));
await go('cap');await clickTab('abx51');const zf3=await frameOf('mod/zp');await sleep(800);
const z8=await zf3.evaluate(()=>({on:[...document.querySelectorAll('[data-pl].on')].map(b=>b.dataset.pl),spo2:document.getElementById('spo2').value,age:document.getElementById('age').value}));
rec('ZP-8 po „Następny pacjent”: pusty stan, brak wybranego miejsca',z8.on.length===0&&z8.spo2===''&&z8.age==='',JSON.stringify(z8));
// storage prefix
const pref=await page.evaluate(()=>{localStorage.setItem('probe','1');return window.SK_PREFIX;});
const p3=await br.newPage();await p3.goto(BASE+'manifest.webmanifest');const rawKeys=await p3.evaluate(()=>Object.keys(localStorage));await p3.close();
rec('Prefiks magazynu v52: aktywny (surowe klucze)',pref==='v52:'&&rawKeys.length>0&&rawKeys.every(k=>k.indexOf('v52:')===0),rawKeys.join(','));
rec('Brak błędów JS w całym przebiegu',errs.length===0,errs.slice(0,8).join(' | '));
fs.writeFileSync('/workspace/e2e_results.json',JSON.stringify({R,errs,eIds},null,1));
await br.close();
})().catch(e=>{console.error('CRASH',e);process.exit(2);});
