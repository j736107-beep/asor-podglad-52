// fix29 (t71u): Transfuzjologia – „Kreator przetoczenia” (kafelki kroków, wynik automatyczny, KKP, tekst do skopiowania). BASE opcjonalne; SHOTS – katalog zrzutów (prefiks f20-).
const pp=require('puppeteer-core');
const BASE=process.env.BASE||'http://localhost:8765/',SHOTS=process.env.SHOTS||'';
const sleep=t=>new Promise(r=>setTimeout(r,t));
let n=0,fail=0;const rec=(name,ok,info)=>{n++;if(!ok)fail++;console.log((ok?'PASS ':'FAIL ')+name+(ok?'':' :: '+String(info||'').slice(0,900)));};
(async()=>{
  const br=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await br.newPage();await page.setViewport({width:1280,height:900});
  const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('dialog',d=>d.accept());
  await page.goto(BASE+'?t='+Date.now(),{waitUntil:'networkidle2',timeout:60000});
  await page.evaluate(async()=>{try{for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister();for(const k of await caches.keys())await caches.delete(k);}catch(e){}localStorage.clear();sessionStorage.clear();});
  await page.goto(BASE+'?t='+Date.now(),{waitUntil:'networkidle2',timeout:60000});await page.evaluate(()=>{window.print=()=>{};});await sleep(300);
  const setP=o=>page.evaluate(o=>{for(const [id,v] of Object.entries(o)){const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}},o);
  const setF=(id,v)=>page.evaluate((id,v)=>{const e=document.querySelector('#main #f #'+id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},id,v);
  const tile=async(k,v)=>{await page.click('#main .kr-tile[data-k="'+k+'"][data-v="'+v+'"]');await sleep(250);};
  const st=()=>page.evaluate(()=>({steps:[...document.querySelectorAll('#main .kr-step')].map(s=>s.dataset.step),act:[...document.querySelectorAll('#main .kr-step.kr-act')].map(s=>s.dataset.step),dec:(document.getElementById('krDec')||{}).textContent||'',units:(document.getElementById('krUnits')||{}).textContent||'',rate:(document.getElementById('krRate')||{}).textContent||'',mon:(document.getElementById('krMon')||{}).textContent||'',txt:(document.getElementById('krTxt')||{}).value||'',dd:(document.getElementById('krDD')||{}).textContent||'',plt:(document.getElementById('krPlt')||{}).textContent||'',out:document.querySelector('#main #out').innerText}));
  const shot=async name=>{if(!SHOTS)return;const vp=page.viewport();const H=await page.evaluate(()=>{const m=document.getElementById('main');const r=m.getBoundingClientRect();return Math.ceil(r.top+m.scrollHeight+20);});await page.setViewport({width:vp.width,height:Math.min(Math.max(H,vp.height),6000)});await sleep(400);await page.screenshot({path:SHOTS+'/'+name});await page.setViewport(vp);await sleep(200);};
  const sw=await page.evaluate(()=>fetch('sw.js?'+Date.now()).then(r=>r.text()));rec('SW asor-v52-fix29 lub nowszy',/asor-v52-fix(29|[3-9]\d)/.test(sw),sw.slice(0,40));
  await setP({pw:'70'});await page.evaluate(()=>SKS.show('transf'));await sleep(1000);
  const tabs=await page.evaluate(()=>[...document.querySelectorAll('#main .tabs button')].map(b=>b.dataset.t+':'+b.textContent));rec('Transfuzjologia: osobna zakładka „Kreator przetoczenia”',tabs.some(t=>/^kr:.*Kreator przetoczenia/.test(t)),JSON.stringify(tabs));
  await page.evaluate(()=>document.querySelector('#main .tabs button[data-t="kr"]').click());await sleep(600);
  let s=await st();rec('Start: tylko krok 1 (rodzaj niedokrwistości) podświetlony, brak wyniku',JSON.stringify(s.steps)==='["path","pctx"]'&&s.act[0]==='path'&&!s.dec,JSON.stringify(s));
  await tile('path','acute');s=await st();rec('Po wyborze „ostre” pojawia się krok 2 (sytuacja kliniczna) podświetlony',s.steps.includes('actx')&&s.act[0]==='actx',JSON.stringify(s));
  await tile('actx','gi');s=await st();rec('GOPP → krok „choroba sercowo-naczyniowa”',s.act[0]==='cv',JSON.stringify(s));
  await tile('cv','no');s=await st();rec('Następny krok: Hb (podświetlony), wynik jeszcze niewidoczny',s.act[0]==='hb'&&!s.dec&&/Wynik pojawi się automatycznie/.test(s.out),JSON.stringify(s));
  await setF('kr_hb','6,5');await sleep(300);await tile('sym','no');await shot('f20-po-1280-transfuzja-1-kroki.png');
  await tile('taco','no');s=await st();
  rec('Ostre GI bez CV, 70 kg, Hb 6,5 → PRZETOCZ KKCz, próg ≤7, 2 j., 140 ml/h, monitorowanie 15 min',/PRZETOCZ KKCz/.test(s.dec)&&/≤7 g\/dl/.test(s.out)&&/2 j\. KKCz teraz/.test(s.units)&&/140 ml\/h/.test(s.rate)&&/po 15 min/.test(s.mon),JSON.stringify(s));
  rec('Tekst do skopiowania gotowy',/Kreator przetoczenia KKCz: PRZETOCZ KKCz/.test(s.txt)&&/Decyzja i zlecenie – lekarz/.test(s.txt),s.txt);
  await shot('f20-po-1280-transfuzja-2-wynik-gi.png');
  // Zmiana kroku 1 kasuje zależne kroki
  await tile('path','chronic');s=await st();rec('Zmiana rodzaju → zależne kroki wyczyszczone, wynik znika',s.act[0]==='cgrp'&&!s.dec,JSON.stringify(s));
  await setP({pw:'80'});await sleep(300);await page.evaluate(()=>document.querySelector('#main .tabs button[data-t="kr"]').click());await sleep(500);
  await tile('cgrp','cv');await tile('cvs','hf');await setF('kr_hb','7,2');await sleep(300);await tile('sym','no');
  s=await st();rec('Niewydolność serca: TACO sugerowane w opisie kroku',/sugerowane TAK: niewydolność serca/.test(s.out),s.out.slice(0,1500));
  await tile('taco','yes');await setF('kr_plt','8');await sleep(300);await tile('pctx','proph');s=await st();
  rec('Przewlekła + NS, 80 kg, Hb 7,2, TACO → 1 j. teraz, 80 ml/h ≈3,5 h, DO DECYZJI (1 ml/kg/h)',/PRZETOCZ KKCz/.test(s.dec)&&/1 j\. KKCz teraz/.test(s.units)&&/80 ml\/h/.test(s.rate)&&/3,5 h/.test(s.rate)&&/UpToDate/.test(s.dd)&&/TACO/.test(s.mon),JSON.stringify(s));
  rec('KKP: PLT 8, profilaktyka → 1 dawka terapeutyczna, ≤30 min',/1 dawka terapeutyczna/.test(s.plt)&&/≤30 min/.test(s.plt)&&/KKP:/.test(s.txt),s.plt);
  await shot('f20-po-1280-transfuzja-3-wynik-ns-taco-kkp.png');
  // PChN dializowana
  await tile('cgrp','ckd');await tile('ckd','hd');await tile('tx','no');await tile('ckdcv','no');await setF('kr_hb','6,5');await sleep(300);await tile('sym','yes');await tile('taco','yes');s=await st();
  rec('PChN dializowana, objawy → PRZETOCZ; KDIGO bez progu – DO DECYZJI; uwaga o dializie',/PRZETOCZ KKCz/.test(s.dec)&&/KDIGO nie podaje/.test(s.dd)&&/hemodializy/.test(s.out),JSON.stringify(s));
  // Niestabilny
  await tile('path','acute');await tile('actx','unstable');s=await st();rec('Niestabilność / MTP → PRZETOCZ natychmiast, szybko, ogrzewacz',/PRZETOCZ KKCz/.test(s.dec)&&/natychmiast/.test(s.units)&&/50 ml\/min/.test(s.rate),JSON.stringify(s));
  // Zapis po powrocie do modułu
  await page.evaluate(()=>SKS.show('gib'));await sleep(600);await page.evaluate(()=>SKS.show('transf'));await sleep(800);s=await st();rec('Wybory zachowane po powrocie do modułu',/PRZETOCZ KKCz/.test(s.dec)&&/natychmiast/.test(s.units),JSON.stringify(s).slice(0,300));
  rec('Brak błędów JS',errs.length===0,errs.join(' | '));
  console.log(fail?('FAILS '+fail+'/'+n):('ALL PASS '+n+'/'+n));await br.close();process.exit(fail?1:0);
})().catch(e=>{console.log('FAIL fatal',e.message);process.exit(1);});
