// fix26: kalkulator „SCORE2 / SCORE2-OP – 10-letnie ryzyko sercowo-naczyniowe” (jak HeartScore; Polska – region wysokiego ryzyka). BASE opcjonalne; SHOTS – katalog zrzutów.
const pp=require('puppeteer-core');
const BASE=process.env.BASE||'http://localhost:8765/',SHOTS=process.env.SHOTS||'';
const sleep=t=>new Promise(r=>setTimeout(r,t));
let n=0,fail=0;const rec=(name,ok,info)=>{n++;if(!ok)fail++;console.log((ok?'PASS ':'FAIL ')+name+(ok?'':' :: '+String(info||'').slice(0,800)));};
(async()=>{
  const br=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await br.newPage();await page.setViewport({width:1280,height:900});
  const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('dialog',d=>d.accept());
  await page.goto(BASE+'?t='+Date.now(),{waitUntil:'networkidle2',timeout:60000});
  await page.evaluate(async()=>{try{for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister();for(const k of await caches.keys())await caches.delete(k);}catch(e){}localStorage.clear();sessionStorage.clear();});
  await page.goto(BASE+'?t='+Date.now(),{waitUntil:'networkidle2',timeout:60000});await page.evaluate(()=>{window.print=()=>{};});await sleep(300);
  const Y=new Date().getFullYear(),M=new Date().getMonth()+1;
  const set=(k,v)=>page.evaluate((k,v)=>{const e=document.getElementById('kk-score2hs-'+k);if(!e)throw Error('brak '+k);e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));},k,v);
  const unit=(k,i)=>page.evaluate((k,i)=>{const s=document.querySelector('#kk-panel [data-u="'+k+'"]');s.value=String(i);s.dispatchEvent(new Event('change',{bubbles:true}));},k,i);
  const out=()=>page.evaluate(()=>document.getElementById('kk-out').innerText);
  const go=async()=>{await page.click('#kk-go');await sleep(250);};
  await page.evaluate(()=>SKS.show('kalk'));await sleep(1000);
  const chips=await page.evaluate(()=>[...document.querySelectorAll('.kk-g[data-g="kardr"] .kk-chip')].map(b=>b.dataset.c));
  rec('Grupa kardiologiczna: „SCORE2 / SCORE2-OP” pierwszy, brak chipu „SCORE2-OP wstrzymany”',chips[0]==='score2hs'&&!chips.includes('score2op'),JSON.stringify(chips));
  await page.evaluate(()=>document.querySelector('.kk-chip[data-c="score2hs"]').click());await sleep(400);
  const p=await page.evaluate(()=>{const P=document.getElementById('kk-panel');return{h:P.querySelector('h3').textContent,d:P.querySelector('.kk-d').textContent,w:(P.querySelector('#kk-warn')||{}).textContent||'',req:P.querySelectorAll('.kk-fields .kk-req').length,leg:!!P.querySelector('.kk-leg'),btn:(P.querySelector('#kk-go')||{}).textContent,labels:[...P.querySelectorAll('.kk-fields label > span:first-child')].map(s=>s.textContent),units:[...P.querySelectorAll('[data-u]')].map(s=>s.dataset.u+':'+[...s.options].map(o=>o.text).join('/')),wait:!!document.getElementById('kk-wait')};});
  rec('Nagłówek i opis jak HeartScore',p.h==='SCORE2 / SCORE2-OP – 10-letnie ryzyko sercowo-naczyniowe'&&p.d.startsWith('Oblicz 10-letnie ryzyko śmiertelnych i nieśmiertelnych chorób sercowo-naczyniowych'),JSON.stringify(p));
  rec('Ostrzeżenie: tylko osoby pozornie zdrowe (ASCVD, cukrzyca, FH, rzadkie zaburzenia, CKD, ciąża)',['pozornie zdrowych','ASCVD','cukrzyc','FH','CKD','ciąży'].every(x=>p.w.includes(x)),p.w);
  rec('Pola: data urodzenia (miesiąc/rok), płeć, SBP, TC, HDL, LDL, palacz; 7 pól wymaganych (*), legenda, przycisk „Oblicz”',p.req===7&&p.leg&&p.btn==='Oblicz'&&/miesiąc/.test(p.labels[0])&&/rok/.test(p.labels[1])&&p.labels.some(l=>/LDL/.test(l)&&/opcjonalnie/.test(l))&&p.labels.some(l=>/Palacz/.test(l)),JSON.stringify(p.labels));
  rec('Przełącznik mmol/l ↔ mg/dl dla TC, HDL, LDL',JSON.stringify(p.units)==='["tc:mmol/l/mg/dl","hdl:mmol/l/mg/dl","ldl:mmol/l/mg/dl"]',JSON.stringify(p.units));
  rec('Przed „Oblicz”: brak wyniku, komunikat',p.wait,'');
  await go();let o=await out();rec('„Oblicz” bez danych → lista braków',/Brakuje danych/.test(o)&&/miesiąc urodzenia/.test(o)&&/palacz/.test(o),o);
  // 50 lat (urodzony 2 mies. wcześniej, w tym roku – 50), M, palacz, SBP 140, TC 212,7 mg/dl (=5,5), HDL 1,3 → SCORE2 Polska 8,1 %
  const bm=M>1?M-1:M,by=Y-50;await set('bm',String(bm));await set('by',String(by));await set('sex','m');await set('sbp','140');await unit('tc',1);await set('tc','212,7');await set('hdl','1,3');await set('smk','1');
  o=await out();rec('Po zmianie danych wynik niewidoczny do ponownego „Oblicz”',/naciśnij „Oblicz”/.test(o),o);
  await go();o=await out();
  rec('SCORE2 (50 l.): 8,1 %, ryzyko wysokie, progi 50–69, region Polska, wiek z daty urodzenia',/^8,1 %/.test(o)&&/SCORE2: 10-letnie ryzyko/.test(o)&&/ryzyko wysokie/.test(o)&&/50–69 lat/.test(o)&&/wysokiego ryzyka \(Polska/.test(o)&&/Wiek \(z daty urodzenia\)\s*50 lat/.test(o),o);
  rec('Zalecenie ESC 2021: KROK 1 dla wszystkich + IIa; bez LDL brak celu LDL-C',/KROK 1 dla wszystkich/.test(o)&&/klasa IIa/.test(o)&&!/Cel LDL-C/.test(o),o);
  await set('ldl','3,5');await go();o=await out();rec('LDL 3,5 → cele LDL-C KROK 1 <2,6 i KROK 2 <1,8 z wymaganą redukcją',/Cel LDL-C – KROK 1\s*<2,6 mmol\/l/.test(o)&&/KROK 2\s*<1,8 mmol\/l.*≥49 %/.test(o),o);
  if(SHOTS){for(const w of [1280,390]){await page.setViewport({width:w,height:900});await sleep(300);const h=await page.evaluate(()=>{const P=document.getElementById('kk-panel');P.scrollIntoView();return Math.ceil(P.getBoundingClientRect().height)+40;});await page.setViewport({width:w,height:Math.min(h,4000)});await sleep(300);await page.evaluate(()=>document.getElementById('kk-panel').scrollIntoView());await sleep(200);await page.screenshot({path:SHOTS+'/f18-po-'+w+'-score2.png'});}await page.setViewport({width:1280,height:900});}
  // wydruk – tylko wypełnione pola + wynik
  let sn=await page.evaluate(()=>{SORReport.capture(SKM.list.find(m=>m.id==='kalk'));return (SORReport.snaps().kalk||{}).text||'';});
  rec('Wydruk: wypełnione pola (mg/dl z przeliczeniem) + wynik + cel LDL-C',/KALKULATOR: SCORE2 \/ SCORE2-OP/.test(sn)&&/Cholesterol całkowity: 212,7 mg\/dl \(= 5,5/.test(sn)&&/Palacz tytoniu: tak/.test(sn)&&/WYNIK: 8,1 %/.test(sn)&&/Cel LDL-C – KROK 2/.test(sn),sn);
  await set('ldl','');await go();sn=await page.evaluate(()=>{SORReport.capture(SKM.list.find(m=>m.id==='kalk'));return (SORReport.snaps().kalk||{}).text||'';});
  rec('Wydruk: puste LDL nie drukowane',!/Cholesterol LDL/.test(sn)&&/WYNIK: 8,1 %/.test(sn),sn);
  // ≥70 → SCORE2-OP automatycznie
  await set('by',String(Y-75));await go();o=await out();rec('Wiek 75 → automatycznie SCORE2-OP, progi ≥70 lat',/SCORE2-OP: 10-letnie ryzyko/.test(o)&&/≥70 lat: <7,5/.test(o)&&/SCORE2-OP \(≥70 lat\)/.test(o),o);
  await set('by',String(Y-30));await go();o=await out();rec('Wiek 30 → komunikat o zakresie 40–69 / 70–89, bez liczby',/40–69/.test(o)&&!/\d+,\d %/.test(o),o);
  sn=await page.evaluate(()=>{const e=document.getElementById('kk-score2hs-sbp');e.value='150';e.dispatchEvent(new Event('input',{bubbles:true}));SORReport.capture(SKM.list.find(m=>m.id==='kalk'));return (SORReport.snaps().kalk||{}).text||'';});
  rec('Wydruk przed ponownym „Oblicz”: bez nieaktualnego wyniku',/nie obliczono/.test(sn),sn.slice(-300));
  const ov=await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1);rec('1280 px: brak poziomego przewinięcia',ov);
  await page.setViewport({width:390,height:844});await sleep(400);
  const ov2=await page.evaluate(()=>({sw:document.getElementById('main').scrollWidth,cw:document.getElementById('main').clientWidth,d:document.documentElement.scrollWidth}));rec('390 px: kalkulator mieści się w szerokości',ov2.sw<=ov2.cw+1&&ov2.d<=391,JSON.stringify(ov2));
  const ab=await page.evaluate(()=>{SKS.show('about');return new Promise(r=>setTimeout(()=>r(document.getElementById('main').innerText),900));});
  rec('O programie: wpis o SCORE2 / SCORE2-OP (fix26)',/SCORE2 \/ SCORE2-OP/.test(ab)&&/fix26/.test(ab),ab.slice(0,400));
  const sw=await page.evaluate(()=>fetch('sw.js?'+Date.now()).then(r=>r.text()));rec('SW asor-v52-fix26',/asor-v52-fix26/.test(sw));
  rec('Brak błędów JS',errs.length===0,errs.join(' | '));
  await br.close();console.log(fail?`${n-fail}/${n} PASS, ${fail} FAIL`:`${n}/${n} PASS`);process.exit(fail?1:0);
})().catch(e=>{console.log('FAIL wyjątek '+e.message);process.exit(1);});
