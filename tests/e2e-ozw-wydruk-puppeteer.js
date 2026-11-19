// OZW (Troponina): wydruk modułu i raport zbiorczy – tylko wypełnione pola, RBBB w opisie EKG, skale z kompletu, wnioski. BASE, SHOTS opcjonalne.
const pp=require('puppeteer-core'),fs=require('fs');
const BASE=process.env.BASE||'http://localhost:8765/',SHOTS=process.env.SHOTS||'';
const sleep=t=>new Promise(r=>setTimeout(r,t));
let n=0,fail=0;const rec=(name,ok,info)=>{n++;if(!ok)fail++;console.log((ok?'PASS ':'FAIL ')+name+(ok?'':' :: '+String(info||'').slice(0,700)));};
// treści, które NIE mogą trafić na wydruk (niezaznaczone pozycje, karty dydaktyczne, negacje bez zaznaczenia)
const NOT=[/Cukrzyca/,/Poty/,/Ból trwa nadal/,/opłucnowy/,/odtwarzalny uciskiem/,/CK-MB/,/Inne przyczyny wzrostu/,/Nowe ↑ST w punkcie J/,/Wzór de Wintera/,/EDACS nie jest policzona/,/EKG prawidłowe/,/bez zmian/,/\bbrak\b/i,/nie stwierdzono/i,/—/,/Zaprzecza/];
(async()=>{
  const br=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await br.newPage();await page.setViewport({width:1280,height:900});
  const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('dialog',d=>d.accept());
  async function fresh(){
    await page.goto(BASE+'?t='+Date.now(),{waitUntil:'networkidle2',timeout:60000});
    await page.evaluate(async()=>{try{if(navigator.serviceWorker){for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister();}for(const k of await caches.keys())await caches.delete(k);}catch(e){}localStorage.clear();sessionStorage.clear();});
    await page.goto(BASE+'?t='+Date.now(),{waitUntil:'networkidle2',timeout:60000});
    await page.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(b=>/Rozumiem|Akceptuj/i.test(b.textContent));b&&b.click();window.print=()=>{};});
    await sleep(400);
  }
  async function frame(){await page.evaluate(()=>SKS.show('trop'));for(let k=0;k<40;k++){const f=page.frames().find(f=>f.url().includes('mod/troponina'));if(f){try{await f.waitForSelector('#fxList input');await f.evaluate(()=>{window.print=()=>{};});await sleep(300);return f;}catch(e){}}await sleep(200);}return null;}
  const yes=(f,k,v)=>f.evaluate((k,v)=>document.querySelector('[data-k="'+k+'"][data-v="'+v+'"]').click(),k,v);
  const set=(f,id,v)=>f.evaluate((id,v)=>{const e=document.getElementById(id);if(e.type==='checkbox'){e.click();return;}e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},id,v);
  async function report(parts){return page.evaluate(p=>{SORReport.capture(SKS.active());SORReport.fill(p);const a=document.getElementById('printArea');return {text:a.textContent,used:SORReport.usedIds()};},parts);}
  async function fillCase(f,full){
    await yes(f,'typ',1);await yes(f,'rad',1);await yes(f,'ongo',0);           // NIE zaznaczone jawnie – nie drukujemy
    await set(f,'rhy','sin');await set(f,'fx_rbbbC');await set(f,'noisch');
    if(!full)return;
    await yes(f,'htn',1);await yes(f,'dm',0);
    await set(f,'age','58');await set(f,'sex','m');
    await set(f,'ecgFmc','08:35');await set(f,'ecgT','08:42');
    await f.evaluate(()=>document.querySelector('input[name=tref][value=sample]').click());
    await set(f,'t0','08:40');await set(f,'c0','6');await set(f,'t1','09:40');await set(f,'c1','7');
    await sleep(400);
  }
  // ---- 1. pełny przypadek (RBBB) – raport zbiorczy ----
  await fresh();let f=await frame();await fillCase(f,true);
  const R=await report(['done','pumps','fluid','modules']);const t=R.text;
  const must=[/Troponina \/ OZW/,/Ból typowy/,/Promieniowanie/,/Nadciśnienie tętnicze/,/rytm zatokowy, RBBB – blok prawej odnogi pęczka Hisa, zupełny, bez cech świeżego niedokrwienia/,/0 h \(08:40\): 6 ng\/l/,/Δ \+1,0/,/Algorytm ESC: RULE-OUT 0\/1 h/,/Skala HEART: 5\/10 – pośrednie ryzyko \(H2 E1 A1 R1 T0\)/,/EDACS: \d+ pkt/,/RBBB może maskować zawał/,/0 h 6 < 12 i \|Δ1h\| 1\.0 < 3 ng\/l/,/WNIOSKI: Hospitalizacja – konsultacja kardiologiczna/];
  const miss=must.filter(r=>!r.test(t)).map(String),bad=NOT.filter(r=>r.test(t)).map(String);
  rec('Raport zbiorczy: OZW tylko z wypełnionych pól (RBBB, bez cech świeżego niedokrwienia, HEART z kompletu, wnioski)',!miss.length&&!bad.length&&R.used.join()==='trop',JSON.stringify({miss,bad,used:R.used,t:t.slice(0,1800)}));
  // ---- 2. wydruk własny modułu (przycisk 🖨 Wydruk A4 w ramce) ----
  const P=await f.evaluate(()=>{document.getElementById('print').click();return document.getElementById('pr').textContent;});
  const miss2=must.slice(1).filter(r=>!r.test(P)).map(String),bad2=NOT.filter(r=>r.test(P)).map(String);
  rec('Wydruk modułu (A4): te same treści, bez niewypełnionych pozycji i kart dydaktycznych',!miss2.length&&!bad2.length&&/wiek 58 lat · płeć M/.test(P),JSON.stringify({miss2,bad2,P:P.slice(0,1500)}));
  // ---- 3. „EKG prawidłowe” wyklucza się z anomaliami ----
  const ex=await f.evaluate(async()=>{const S=()=>({norm:document.querySelector('.ek[data-card="norm"]').classList.contains('on'),rbbb:document.getElementById('fx_rbbbC').checked,noisch:document.getElementById('noisch').checked});
    document.querySelector('#ecg .mk[data-k="norm"]').click();const a=S();document.getElementById('fx_rbbbI').click();await new Promise(r=>setTimeout(r,100));const b=S();
    document.getElementById('fx_rbbbC').click();await new Promise(r=>setTimeout(r,100));const c={rbbbI:document.getElementById('fx_rbbbI').checked,rbbbC:document.getElementById('fx_rbbbC').checked};
    document.getElementById('noisch').click();document.querySelector('#ecg .mk[data-k="std"]').click();const d=document.getElementById('noisch').checked;return {a,b,c,d};});
  rec('„EKG prawidłowe” ↔ anomalie wzajemnie wykluczające; RBBB zupełny/niezupełny wykluczające; karta niedokrwienna odznacza „bez cech świeżego niedokrwienia”',
    ex.a.norm&&!ex.a.rbbb&&!ex.a.noisch&&!ex.b.norm&&ex.c.rbbbC&&!ex.c.rbbbI&&ex.d===false,JSON.stringify(ex));
  if(SHOTS){fs.mkdirSync(SHOTS,{recursive:true});}
  // ---- 4. niepełne dane → HEART nie drukowany jako wynik ----
  await fresh();f=await frame();await fillCase(f,false);await sleep(300);
  const I=await report([{module:'trop'}]);
  rec('Niepełne dane (bez wieku i troponiny): brak wyniku HEART na wydruku, opis EKG z RBBB jest',!/HEART/.test(I.text)&&/RBBB/.test(I.text)&&/Ból typowy/.test(I.text)&&!NOT.some(r=>r.test(I.text)),I.text.slice(0,1200));
  // ---- 5. stan przetrwał przejście do innego modułu i z powrotem ----
  await page.evaluate(()=>SKS.show('dka'));await sleep(500);f=await frame();
  const back=await f.evaluate(()=>({rbbb:document.getElementById('fx_rbbbC').checked,rhy:document.getElementById('rhy').value,typ:!!document.querySelector('[data-k="typ"][data-v="1"].on')}));
  rec('Po powrocie do modułu zaznaczenia zostają (bieżący pacjent)',back.rbbb&&back.rhy==='sin'&&back.typ,JSON.stringify(back));
  // ---- 6. moduł nieużywany nie trafia do raportu; Następny pacjent czyści ----
  await page.evaluate(()=>{window.confirm=()=>true;SKS.wipe();});await sleep(300);await page.reload({waitUntil:'networkidle2'});await page.evaluate(()=>{window.print=()=>{};});await sleep(300);
  f=await frame();const st=await f.evaluate(()=>({rbbb:document.getElementById('fx_rbbbC').checked,on:document.querySelectorAll('button.on').length}));
  const E=await report(['done','pumps','fluid','modules']);
  rec('Po „Następny pacjent” moduł pusty, a raport bez OZW',!st.rbbb&&st.on===0&&!/Troponina \/ OZW/.test(E.text)&&/Żaden panel nie został użyty/.test(E.text),JSON.stringify({st,t:E.text.slice(0,300)}));
  rec('Brak błędów JS',!errs.length,errs.join(' | '));
  await br.close();console.log((n-fail)+'/'+n+(fail?' FAIL':' PASS'));process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
