// Pilot „Epikryza (AI)” – test przeglądarkowy. API AI jest ATRAPĄ (przechwytywanie żądań puppeteer) – brak prawdziwych wywołań i kluczy.
const puppeteer=require('puppeteer-core'),fs=require('fs');
const BASE=process.env.BASE||'http://localhost:8765/';const SHOTS=process.env.SHOTS||'';
let fails=0;function rec(id,ok,msg){if(!ok)fails++;console.log(id.padEnd(66),ok?'PASS':'FAIL',String(msg||'').slice(0,260));}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SAMPLE='EPIKRYZA\nPacjent 82-letni przyjęty do SOR z powodu gorączki i kaszlu od 3 dni. RR 32/min, SBP 95 mmHg, HR 118/min, SpO₂ 84%, splątanie. CURB-65 4/5. PSI klasa V. Miejsce leczenia: Ciężkie PZP – OIOM / OIT rozważany.\n\nROZPOZNANIA ICD-10\nJ18.9 – Zapalenie płuc, nieokreślone\n\nUZASADNIENIE PRZEKAZANIA DO OIT\nCiężka hipoksemia (SpO₂ 84%) i ≥3 małe kryteria ATS/IDSA.\n\n=====\nUWAGI DLA LEKARZA\n- Brak wyniku RTG klatki piersiowej.\n- Zweryfikuj dawkę klarytromycyny przy QT.';
(async()=>{const br=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox'],headless:'new'});
const ctx=br.defaultBrowserContext();try{await ctx.overridePermissions(new URL(BASE).origin,['clipboard-read','clipboard-write','clipboard-sanitized-write']);}catch(e){}
const page=await br.newPage();await page.setViewport({width:1300,height:1000});const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});page.on('dialog',d=>d.accept());
const sent=[];let mode='ok',real=[];
await page.setRequestInterception(true);
page.on('request',q=>{const u=q.url();if(/api\.(openai|anthropic)\.com|api\.x\.ai/.test(u)){const H={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Content-Type':'application/json'};
  if(q.method()==='OPTIONS')return q.respond({status:204,headers:H,body:''});
  sent.push({url:u,method:q.method(),headers:q.headers(),body:q.postData()||''});
  if(/\/models$/.test(u))return q.respond({status:mode==='bad'?401:200,headers:H,body:mode==='bad'?'{"error":{"message":"Incorrect API key"}}':'{"data":[{"id":"gpt-4.1-mini"}]}'});
  if(mode==='bad')return /x\.ai/.test(u)?q.respond({status:400,headers:H,body:'{"code":"invalid-argument","error":"Incorrect API key provided. You can obtain an API key from https://console.x.ai."}'}):q.respond({status:401,headers:H,body:'{"error":{"message":"Incorrect API key provided"}}'});
  if(mode==='quota')return q.respond({status:429,headers:H,body:'{"error":{"message":"You exceeded your current quota"}}'});
  if(/anthropic/.test(u))return q.respond({status:200,headers:H,body:JSON.stringify({model:'claude-sonnet-5-5',content:[{type:'text',text:SAMPLE}]})});
  if(/x\.ai/.test(u))return q.respond({status:200,headers:H,body:JSON.stringify({model:'grok-4.7',choices:[{message:{role:'assistant',content:SAMPLE}}]})});
  return q.respond({status:200,headers:H,body:JSON.stringify({model:'gpt-4.1-mini',choices:[{message:{content:SAMPLE}}]})});}
 if(!u.startsWith(BASE)&&!u.startsWith('data:'))real.push(u);q.continue();});
await page.goto(BASE,{waitUntil:'networkidle0'});await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.reload({waitUntil:'networkidle0'});
const go=async id=>{await page.evaluate(id=>document.querySelector('#side button[data-id="'+id+'"]').click(),id);await sleep(700);};
await page.type('#pbName','Jan Testowy');
await page.evaluate(()=>{const s=(q,v)=>{const e=document.querySelector(q);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));};s('#pa','82');s('#pw','78');s('#pc','1.3');document.querySelector('#psex button[data-s="m"]').click();});await sleep(300);
await go('cap');
let b=await page.evaluate(()=>{const x=document.getElementById('aiBtn');return{has:!!x,dis:x&&x.disabled,why:(document.getElementById('aiWhy')||{}).textContent};});
rec('Bez klucza: przycisk „Epikryza (AI)” wyszarzony z wyjaśnieniem',b.has&&b.dis&&/Brak klucza API/.test(b.why||''),JSON.stringify(b));
// Ustawienia
await go('settings');
const st=await page.evaluate(()=>{const s=document.getElementById('aiSet');return{has:!!s,h:s&&s.querySelector('h3').textContent,prov:[...document.querySelectorAll('#aiProv option')].map(o=>o.value),sel:document.getElementById('aiProv').value,ph:document.getElementById('aiKey').placeholder,hint:document.getElementById('aiKeyHint').textContent,models:[...document.querySelectorAll('#aiModel option')].map(o=>o.value),type:document.getElementById('aiKey').type,del:document.getElementById('aiKeyDel').disabled};});
rec('Ustawienia: xAI (Grok) domyślny + OpenAI/Anthropic; modele Grok + inny; podpowiedź xai-; pole maskowane',st.has&&st.h==='Sztuczna inteligencja (pilot)'&&st.prov.join()==='xai,openai,anthropic'&&st.sel==='xai'&&st.models.join()==='grok-4.7,grok-4.20-0309-non-reasoning,grok-4.3,_custom'&&st.ph==='xai-…'&&/xai-/.test(st.hint)&&/console\.x\.ai/.test(st.hint)&&st.type==='password'&&st.del,JSON.stringify(st));
const KEY='xai-test-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123';
await page.type('#aiKey',KEY);await page.click('#aiKeySave');await sleep(200);
const ks=await page.evaluate(k=>({state:document.getElementById('aiKeyState').textContent,ls:Object.keys(localStorage).filter(x=>x.startsWith('v52:')),val:document.getElementById('aiKey').value,html:document.getElementById('aiSet').innerHTML.includes(k),stored:JSON.parse(localStorage.getItem('v52:ai_cfg')).keys.xai===k}),KEY);
rec('Klucz zapisany lokalnie (v52:ai_cfg), wyświetlany zamaskowany',ks.stored&&ks.ls.includes('v52:ai_cfg')&&/xai…••••••0123/.test(ks.state)&&!ks.html&&ks.val==='',JSON.stringify(ks));
await page.click('#aiTest');await sleep(600);
const tm=await page.evaluate(()=>document.getElementById('aiSetMsg').textContent);rec('Test połączenia (atrapa GET /v1/models) → OK',/Połączenie OK/.test(tm)&&sent.length===0||/Połączenie OK/.test(tm),tm);
rec('Test połączenia xAI: GET api.x.ai/v1/models, Authorization Bearer xai-…',sent[0]&&sent[0].method==='GET'&&sent[0].url==='https://api.x.ai/v1/models'&&sent[0].headers.authorization==='Bearer '+KEY,sent[0]&&sent[0].url);
if(SHOTS){await page.evaluate(()=>document.getElementById('aiSet').scrollIntoView());await sleep(200);await page.screenshot({path:SHOTS+'/ai-ustawienia.png'});}
// Zapalenie płuc – dane
await go('cap');await page.evaluate(()=>document.querySelector('[data-clin-tab="scores"]').click());await sleep(500);
await page.evaluate(()=>{const f=document.querySelector('.clinical-form');const V={rr:32,sbp:95,dbp:60,hr:118,temp:38.9,spo2:84,urea:9.2,na:132,glu:8,ph:7.33,hct:38,pao2:55,pf:240,wbc:15,platelets:210,confusion:'yes',oral:'no',nursing:'no',cancer:'no',liver:'no',heart:'yes',stroke:'no',renal:'no',effusion:'no',ventilation:'no',vasopressor:'no',multilobar:'yes',fluidHypotension:'no'};
 for(const[k,v]of Object.entries(V)){const e=f.querySelector('#'+k);if(!e)continue;e.value=String(v);e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));}});await sleep(500);
b=await page.evaluate(()=>({dis:document.getElementById('aiBtn').disabled}));rec('Z kluczem i online: przycisk aktywny',!b.dis,'');
await page.click('#aiBtn');await sleep(300);
await page.evaluate(()=>{document.getElementById('aiPrev').open=true;});
await page.type('#aiNotes','Jan Testowy, nr 44051401359: kaszel i gorączka od 3 dni.');await sleep(300);
const pv=await page.evaluate(()=>document.getElementById('aiPrevTxt').textContent);
rec('Podgląd „Co zostanie wysłane”: dane kliniczne, PSI, miejsce leczenia, antybiotyk; bez imienia / numerów',/SpO₂ \[%\]: 84/.test(pv)&&/PSI \/ PORT: klasa/.test(pv)&&/OIOM \/ OIT/.test(pv)&&/ANTYBIOTYKOTERAPIA/.test(pv)&&/kaszel i gorączka od 3 dni/.test(pv)&&!/Jan|Testowy|44051401359/.test(pv),pv.slice(0,200));
if(SHOTS){await page.evaluate(()=>document.getElementById('aiEpi').scrollIntoView());await sleep(200);await page.screenshot({path:SHOTS+'/ai-podglad.png'});}
const n0=sent.length;await page.click('#aiSend');await page.waitForSelector('#aiOut',{timeout:15000});await sleep(300);
const rq=sent.slice(n0).find(x=>x.method==='POST');const body=rq?rq.body:'';
rec('Żądanie xAI: POST api.x.ai/v1/chat/completions, Bearer xai-…, model grok-4.7, temperatura 0,2, reasoning_effort low',rq&&rq.url==='https://api.x.ai/v1/chat/completions'&&rq.headers.authorization==='Bearer '+KEY&&JSON.parse(body).temperature===0.2&&JSON.parse(body).model==='grok-4.7'&&JSON.parse(body).reasoning_effort==='low'&&JSON.parse(body).messages.length===2,rq&&rq.url);
rec('RODO: body żądania bez imienia, nazwiska, numerów, czasu przyjęcia',body.length>500&&!/Jan|Testowy|44051401359/.test(body)&&!/\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}/.test(body),'body '+body.length+' B');
const out=await page.evaluate(()=>({ta:document.getElementById('aiOut').value,warn:document.getElementById('aiWarn').textContent,notes:(document.getElementById('aiNotesOut')||{}).textContent||''}));
rec('Panel wyniku: edytowalne pole z EPIKRYZA/ICD-10/uzasadnieniem OIT; UWAGI osobno; etykieta AI',/^EPIKRYZA/.test(out.ta)&&/J18\.9/.test(out.ta)&&/UZASADNIENIE PRZEKAZANIA DO OIT/.test(out.ta)&&!/UWAGI DLA LEKARZA|Brak wyniku RTG/.test(out.ta)&&/Brak wyniku RTG/.test(out.notes)&&out.warn==='Tekst wygenerowany przez AI – wymaga weryfikacji i zatwierdzenia przez lekarza',JSON.stringify(out).slice(0,200));
if(SHOTS){await page.evaluate(()=>document.getElementById('aiOutBox').scrollIntoView());await sleep(200);await page.screenshot({path:SHOTS+'/ai-wynik.png'});}
await page.click('#aiOut');await page.keyboard.press('End');await page.keyboard.type(' [poprawka lekarza]');await page.click('#aiCopy');await sleep(300);
let clip='';try{clip=await page.evaluate(()=>navigator.clipboard.readText());}catch(e){clip='ERR '+e.message;}
rec('Kopiuj: tylko blok do wklejenia (z edycją lekarza), bez UWAG',/^EPIKRYZA/.test(clip)&&/\[poprawka lekarza\]/.test(clip)&&!/UWAGI|Brak wyniku RTG/.test(clip),clip.slice(0,60));
// wydruk A4
await page.evaluate(()=>{SORReport.capture(SKS.active());SORReport.fill([{module:'cap'}]);});
const pr=await page.evaluate(()=>document.getElementById('printArea').textContent);
rec('Wydruk A4: nagłówek z imieniem (lokalnie) + epikryza AI z etykietą, bez UWAG i bez panelu AI',/Jan Testowy/.test(pr)&&!/44051401359/.test(pr)&&/EPIKRYZA \(AI\) – Tekst wygenerowany przez AI/.test(pr)&&/J18\.9/.test(pr)&&!/Brak wyniku RTG/.test(pr)&&!/Potwierdzam – wyślij/.test(pr),pr.slice(0,120));
// zmiana zakładki zachowuje wynik
await page.evaluate(()=>document.querySelector('[data-clin-tab="abx51"]').click());await sleep(500);
const keep=await page.evaluate(()=>(document.getElementById('aiOut')||{}).value||'');rec('Wynik zachowany po zmianie zakładki',/\[poprawka lekarza\]/.test(keep),'');
// błędy
await page.evaluate(()=>document.querySelector('[data-clin-tab="scores"]').click());await sleep(400);
mode='bad';await page.click('#aiBtn');await sleep(200);await page.click('#aiSend');await page.waitForSelector('#aiErr',{timeout:15000});
let er=await page.evaluate(()=>document.getElementById('aiErr').textContent);rec('xAI błąd 400 „Incorrect API key” → „Nieprawidłowy klucz API” + podpowiedź xai-',/Nieprawidłowy klucz API/.test(er)&&/xai-/.test(er),er);
mode='quota';await page.click('#aiSend');await sleep(800);er=await page.evaluate(()=>document.getElementById('aiErr').textContent);rec('Błąd 429 quota → komunikat o limicie/środkach',/quota|środków/.test(er),er);
mode='ok';await page.click('[data-ai="close"]');await sleep(100);
// offline
await page.setOfflineMode(true);await page.evaluate(()=>window.dispatchEvent(new Event('offline')));await sleep(300);
b=await page.evaluate(()=>({dis:document.getElementById('aiBtn').disabled,why:(document.getElementById('aiWhy')||{}).textContent}));rec('Offline: przycisk wyszarzony z wyjaśnieniem',b.dis&&/offline|internetem/.test(b.why||''),JSON.stringify(b));
await page.setOfflineMode(false);await page.evaluate(()=>window.dispatchEvent(new Event('online')));await sleep(300);
// OpenAI (alternatywa)
await go('settings');await page.select('#aiProv','openai');await sleep(200);await page.type('#aiKey','sk-test-ABCDEFGHIJKLMNOPQRSTUVWXYZ');await page.click('#aiKeySave');await sleep(200);
await go('cap');await page.evaluate(()=>document.querySelector('[data-clin-tab="scores"]').click());await sleep(400);
const n2=sent.length;await page.click('#aiBtn');await sleep(200);await page.click('#aiSend');await sleep(1200);
const oq=sent.slice(n2).find(x=>x.method==='POST');rec('OpenAI: POST api.openai.com/v1/chat/completions, model gpt-4.1-mini, bez reasoning_effort',oq&&/api\.openai\.com\/v1\/chat\/completions/.test(oq.url)&&JSON.parse(oq.body).model==='gpt-4.1-mini'&&JSON.parse(oq.body).reasoning_effort===undefined,oq&&oq.url);
// Anthropic
await go('settings');await page.select('#aiProv','anthropic');await sleep(200);await page.type('#aiKey','sk-ant-test-ABCDEFGHIJKLMNOPQRSTUV');await page.click('#aiKeySave');await sleep(200);
await go('cap');await page.evaluate(()=>document.querySelector('[data-clin-tab="scores"]').click());await sleep(400);
const n1=sent.length;await page.click('#aiBtn');await sleep(200);await page.click('#aiSend');await sleep(1200);
const aq=sent.slice(n1).find(x=>x.method==='POST');
rec('Anthropic: POST /v1/messages, x-api-key, anthropic-dangerous-direct-browser-access, bez identyfikatorów',aq&&/api\.anthropic\.com\/v1\/messages/.test(aq.url)&&aq.headers['anthropic-dangerous-direct-browser-access']==='true'&&aq.headers['x-api-key']&&!/Jan|Testowy|44051401359/.test(aq.body)&&JSON.parse(aq.body).model==='claude-sonnet-5-5',aq&&aq.url);
// Usuń klucz
await go('settings');await page.click('#aiKeyDel');await sleep(200);
const dk=await page.evaluate(()=>JSON.parse(localStorage.getItem('v52:ai_cfg')).keys.anthropic===undefined);await go('cap');
b=await page.evaluate(()=>document.getElementById('aiBtn').disabled);rec('Usuń klucz → klucz skasowany, przycisk wyszarzony',dk&&b,'');
// SW i CSP
const sw=await page.evaluate(async()=>{const t=await (await fetch('sw.js',{cache:'no-store'})).text();return{c:/asor-v52-fix6/.test(t),f:/"calc\/ai-epi\.js"/.test(t)&&/"ai-ui\.js"/.test(t),byp:/api\.x\.ai/.test(t)&&/api\.openai\.com/.test(t)&&/api\.anthropic\.com/.test(t),csp:(document.querySelector('meta[http-equiv="Content-Security-Policy"]')||{}).content};});
rec('SW asor-v52-fix6: pliki AI w cache, api.x.ai/openai/anthropic omijają SW; CSP connect-src z api.x.ai',sw.c&&sw.f&&sw.byp&&/connect-src[^;]*https:\/\/api\.x\.ai/.test(sw.csp||''),JSON.stringify(sw));
rec('Brak prawdziwych wywołań poza atrapą',real.length===0,real.slice(0,3).join(' '));
rec('Brak błędów JS',errs.filter(e=>!/401|429|Failed to load resource/.test(e)).length===0,errs.join(' | ').slice(0,300));
await br.close();console.log(fails?('FAILS: '+fails):'ALL PASS');process.exit(fails?1:0);})().catch(e=>{console.log('CRASH',e);process.exit(1);});
