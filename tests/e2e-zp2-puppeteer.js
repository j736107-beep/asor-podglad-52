/* 11.11.2026 (ZP2): brak rekomendacji domyślnej; rekomendacja po minimum danych; macierz miejsce × alergia × KAŻDY modyfikator → schemat się zmienia.
   BASE=http://localhost:8765/ SHOTS=/workspace/fix_zp2 node e2e-zp2-puppeteer.js */
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://localhost:8765/',SHOTS=process.env.SHOTS||'';let n=0,fail=0;function ok(c,m,d){n++;if(!c||process.env.V)console.log((c?'PASS ':'FAIL ')+m+(c||!d?'':' — '+String(d).slice(0,300)));if(!c)fail++;}
(async()=>{const br=await puppeteer.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox'],headless:'new'});
 const page=await br.newPage();await page.setViewport({width:1200,height:1500});const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 const shot=async f=>{if(SHOTS){require('fs').mkdirSync(SHOTS,{recursive:true});await page.screenshot({path:SHOTS+'/'+f,fullPage:false});}};
 // a) w powłoce: pusty formularz
 await page.goto(BASE,{waitUntil:'networkidle0'});await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.reload({waitUntil:'networkidle0'});
 await page.evaluate(()=>document.querySelector('#side [data-id="cap"]').click());await sleep(600);
 await page.evaluate(()=>[...document.querySelectorAll('#main button')].find(b=>/Antybiotykoterapia/.test(b.textContent)).click());await sleep(1200);
 let zf=page.frames().find(f=>/mod\/zp/.test(f.url()));
 const S=async()=>zf.evaluate(()=>({rec:(document.getElementById('zpRec')||{}).textContent||'',need:(document.getElementById('zpNeed')||{}).textContent||'',on:[...document.querySelectorAll('[data-pl].on,[data-al].on')].map(b=>b.dataset.pl||b.dataset.al),recBtn:[...document.querySelectorAll('[data-pl].rec')].map(b=>b.dataset.pl),quick:document.getElementById('quick').textContent,res:document.getElementById('res').innerText,why:(document.getElementById('plWhy')||{}).textContent}));
 let s=await S();
 ok(/^Uzupełnij: /.test(s.rec)&&!/Rekomendacja:/.test(s.rec)&&s.on.length===0&&s.recBtn.length===0&&s.quick===''&&/Brak rekomendacji/.test(s.why),'Pusty formularz: brak rekomendacji, brak preselekcji, „Uzupełnij: …”',JSON.stringify(s));
 ok(/splątanie/.test(s.rec)&&/mocznik/.test(s.rec)&&/SpO₂/.test(s.rec),'„Uzupełnij” wymienia brakujące pozycje',s.rec);
 await page.evaluate(()=>{const f=document.getElementById('zpFrame');f.scrollIntoView();});await shot('zp-1-pusty-formularz-brak-rekomendacji.png');
 // b) dane minimalne w module
 const typ=async(id,v)=>zf.evaluate((id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},id,v);
 await typ('age','50');await zf.evaluate(()=>document.querySelector('[data-sex="m"]').click());await typ('w','75');await typ('crea','1');await typ('urea','5');await typ('rr','16');await typ('sbp','120');await typ('dbp','80');await sleep(200);
 s=await S();ok(/^Uzupełnij: /.test(s.rec)&&/splątanie/.test(s.rec)&&/SpO₂/.test(s.rec)&&s.recBtn.length===0,'Częściowe dane (bez splątania i SpO₂) → nadal brak rekomendacji',s.rec);
 await zf.evaluate(()=>document.querySelector('[data-cf="0"]').click());await sleep(200);await typ('spo2','97');await sleep(300);
 s=await S();ok(/Rekomendacja: leczenie domowe/.test(s.rec)&&s.recBtn.join()==='home'&&s.on.length===0&&/miejsce leczenia/.test(s.need),'Minimum danych → rekomendacja wyliczona (dom), wybór nadal należy do lekarza',JSON.stringify(s).slice(0,300));
 await shot('zp-2-rekomendacja-po-danych.png');
 // c) macierz
 const MODS=await zf.evaluate(()=>[...document.querySelectorAll('[data-o]')].map(b=>b.dataset.o).filter(k=>!['vent','vaso','noOral','statin','vka','doac','ssri','steroid','colch'].includes(k)));
 ok(MODS.includes('asp')&&MODS.includes('abscess')&&MODS.includes('empyema')&&MODS.includes('mrsa')&&MODS.includes('pseudo'),'Lista modyfikatorów: '+MODS.join(','),'');
 const click=async sel=>{await zf.evaluate(sel=>document.querySelector(sel).click(),sel);await sleep(120);};
 const txt=async()=>zf.evaluate(()=>document.getElementById('quick').textContent+'|'+document.getElementById('res').innerText);
 const SAME_OK={comorb:['ward','icu'],atyp:['home:late','home:imm','ward','icu'],social:['ward','icu']};
 for(const p of ['home','ward','icu'])for(const al of ['none','late','imm']){await click('[data-pl="'+p+'"]');if(!(await zf.evaluate(p=>document.querySelector('[data-pl="'+p+'"]').classList.contains('on'),p)))await click('[data-pl="'+p+'"]');await click('[data-al="'+al+'"]');
  const t0=await txt();ok(/💊 Proponowane/.test(t0),`baza ${p}/${al}: schemat`,t0.slice(0,200));
  for(const m of MODS){await click('[data-o="'+m+'"]');const t=await txt();const q=t.split('|')[0];const id=`${m} × ${p} × ${al}`;
   ok(t!==t0||(SAME_OK[m]||[]).some(x=>x===p||x===p+':'+al),id+': tekst schematu zmienia się',q.slice(0,200));
   if(['asp','abscess','empyema'].includes(m)){ok(!/Amoksycylina<?\/?b?>? 1 g|\bAmoksycylina 1 g/.test(q)&&!/Ampicylina 1 g/.test(q),id+': nie sama amoksycylina / ampicylina',q.slice(0,250));
    if(al==='none')ok(/klawulan|sulbakt/i.test(q),id+': β-laktam z inhibitorem w propozycji',q.slice(0,250));
    else ok(/Moksyfloksacyna|Klindamycyna|Ceftriakson|Lewofloksacyna/.test(q)&&(al!=='imm'||!/Ceftriakson|klawulan|sulbakt|Amoksycylina|Ampicylina/.test(q)),id+': alergia – lek bez penicylin'+(al==='imm'?' i β-laktamów':''),q.slice(0,250));}
   if(m==='abscess'||m==='empyema')ok(/tyg/.test(t)&&/torakochirurg/.test(t),id+': czas w tygodniach + konsultacja/drenaż',t.slice(0,200));
   if(p==='home'&&al==='none'&&m==='asp')await shot('zp-3-dom-brak-alergii-zachlystowe.png');
   if(p==='ward'&&al==='none'&&m==='abscess')await shot('zp-4-oddzial-ropien-pluca.png');
   if(p==='home'&&al==='imm'&&m==='abscess')await shot('zp-5-dom-alergia-natychmiastowa-ropien.png');
   await click('[data-o="'+m+'"]');}
  if(p==='home'&&al==='none')await shot('zp-0-dom-bez-modyfikatorow-amoksycylina.png');}
 ok(!errs.length,'Brak błędów JS / konsoli',errs.join(' | '));
 await br.close();console.log((n-fail)+'/'+n+(fail?' FAIL':' PASS'));process.exit(fail?1:0);})();
