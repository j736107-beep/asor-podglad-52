/* 11.11.2026: Sepsa – antybiotyki wg KAŻDEGO ogniska; Zapalenie płuc – CrCl na żywo (pola / wiek i płeć z paska), CURB-65 = 2 → dom wybieralny z rekomendacją; brak blokady wypisu.
   BASE=http://localhost:8765/ node e2e-fix-puppeteer.js */
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://localhost:8765/';let n=0,fail=0;function ok(c,m,d){n++;console.log((c?'PASS ':'FAIL ')+m+(c||!d?'':' — '+String(d).slice(0,300)));if(!c)fail++;}
(async()=>{const br=await puppeteer.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox'],headless:'new'});
 const page=await br.newPage();await page.setViewport({width:1300,height:1400});const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error')errs.push(m.text());});page.on('dialog',d=>d.accept());
 const fresh=async()=>{await page.goto(BASE,{waitUntil:'networkidle0'});await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.reload({waitUntil:'networkidle0'});};
 const go=async id=>{await page.evaluate(id=>document.querySelector('#side [data-id="'+id+'"]').click(),id);await sleep(700);};
 const tab=async re=>{await page.evaluate(re=>{const b=[...document.querySelectorAll('#main button')].find(b=>new RegExp(re).test(b.textContent));b&&b.click();},re);await sleep(600);};
 // ===== Sepsa: każde ognisko, bez wieku i z wiekiem
 for(const age of ['','67']){await fresh();if(age)await page.evaluate(a=>{const e=document.getElementById('pa');e.value=a;e.dispatchEvent(new Event('input',{bubbles:true}));},age);
  await go('sepsis');await tab('Antybiotyki wg ogniska');
  const opts=await page.evaluate(()=>[...document.getElementById('source').options].filter(o=>o.value).map(o=>[o.value,o.textContent]));
  ok(opts.length>=8,'Sepsa: lista ognisk ('+opts.length+')',JSON.stringify(opts));
  for(const [v,l] of opts){await page.evaluate(v=>{const s=document.getElementById('source');s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}));s.dispatchEvent(new Event('input',{bubbles:true}));},v);await sleep(450);
   const t=await page.evaluate(()=>document.getElementById('main').innerText);
   const hasReg=/Pierwsza dawka teraz|Schemat alternatywny/.test(t)&&/\d+(,\d+)?\s*(g|mg)(\/kg)?\b/.test(t)&&/co \d+ h|co \d+–\d+ h/.test(t)&&!/Brak wyniku: podaj wiek/.test(t);
   ok(hasReg,'Sepsa'+(age?' (wiek '+age+')':' (bez wieku)')+': ognisko „'+l+'” → schemat z dawkami',t.slice(-400));}
  if(age){await page.evaluate(()=>{const e=document.getElementById('pc');if(e){e.value='2.5';e.dispatchEvent(new Event('input',{bubbles:true}));}const w=document.getElementById('pw');w.value='70';w.dispatchEvent(new Event('input',{bubbles:true}));const m=document.querySelector('#psex button[data-s="m"]');m&&m.click();});await sleep(500);
   await go('sepsis');await tab('Antybiotyki wg ogniska');await page.evaluate(()=>{const s=document.getElementById('source');s.value='lung';s.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(500);
   const t=await page.evaluate(()=>document.getElementById('main').innerText);ok(/CrCl/.test(t)&&/\d+ ml\/min/.test(t),'Sepsa: korekta nerkowa z CrCl (kreatynina 2,5)',t.slice(0,300));}}
 // ===== Zapalenie płuc – CrCl na żywo
 await fresh();await go('cap');await tab('Antybiotykoterapia');
 let zf=page.frames().find(f=>/mod\/zp/.test(f.url()));
 const typ=async(id,v)=>zf.evaluate((id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},id,v);
 await typ('age','70');await zf.evaluate(()=>document.querySelector('[data-sex="m"]').click());await typ('w','80');await typ('crea','1,2');await sleep(300);
 let c=await zf.evaluate(()=>({live:document.getElementById('crclLive').textContent,ph:document.getElementById('crclManual').placeholder}));
 ok(/CrCl: 65 ml\/min/.test(c.live)&&/\(140 − 70\) × 80 kg \/ \(72 × 1,2 mg\/dl\)/.test(c.live)&&c.ph==='65','ZP: CrCl na żywo 70 l./M/80 kg/kr 1,2 mg/dl = 65 ml/min ze wzorem',JSON.stringify(c));
 await zf.evaluate(()=>document.querySelector('[data-cu="umol"]').click());await typ('crea','106');await sleep(300);
 c=await zf.evaluate(()=>document.getElementById('crclLive').textContent);ok(/CrCl: 65 ml\/min/.test(c),'ZP: kreatynina 106 µmol/l → 65 ml/min',c);
 await zf.evaluate(()=>document.querySelector('[data-cu="mgdl"]').click());await typ('crea','2,4');await sleep(300);await zf.evaluate(()=>document.querySelector('[data-al="none"]').click());await sleep(200);await zf.evaluate(()=>document.querySelector('[data-pl="ward"]').click());await sleep(300);
 c=await zf.evaluate(()=>({live:document.getElementById('crclLive').textContent,res:document.getElementById('res').innerText}));ok(/CrCl: 32 ml\/min/.test(c.live)&&/CrCl: 32 ml\/min/.test(c.res),'ZP: kreatynina 2,4 → 32 ml/min, schemat liczony z tym CrCl',c.live);
 // wiek i płeć z paska (wpis ręczny) → CrCl
 await fresh();await page.evaluate(()=>{const e=document.getElementById('pa');e.value='82';e.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#psex [data-s="m"]').click();const w=document.getElementById('pw');w.value='80';w.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(300);
 await go('cap');await tab('Antybiotykoterapia');zf=page.frames().find(f=>/mod\/zp/.test(f.url()));await typ('crea','1,2');await sleep(300);
 const exp=await page.evaluate(()=>{const a=SKS.P().age;return Math.round((140-a)*80/(72*1.2));});
 c=await zf.evaluate(()=>document.getElementById('crclLive').textContent);ok(new RegExp('CrCl: '+exp+' ml/min').test(c),'ZP: wiek 82 i płeć M z paska → CrCl '+exp+' ml/min',c);
 // CURB-65 = 2 → dom wybieralny, rekomendacja z uzasadnieniem
 await fresh();await go('cap');await tab('Skale i hospitalizacja');
 await page.evaluate(()=>{const f=document.querySelector('.clinical-form');const set=(k,v)=>{const e=f.querySelector('#'+k);if(!e)return;if(e.tagName==='SELECT'){e.value=v;e.dispatchEvent(new Event('change',{bubbles:true}));}else{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}};
  const a=document.getElementById('pa');a.value='70';a.dispatchEvent(new Event('input',{bubbles:true}));set('rr','20');set('sbp','125');set('dbp','75');set('urea',(document.querySelector('[data-u]')&&/mmol/.test(f.querySelector('#urea').closest('label').textContent))?'8':'50');set('spo2','95');set('confusion','no');});await sleep(600);
 await tab('Antybiotykoterapia');zf=page.frames().find(f=>/mod\/zp/.test(f.url()));await sleep(500);
 let z=await zf.evaluate(()=>({rec:(document.getElementById('zpRec')||{}).textContent||'',home:(()=>{const b=document.querySelector('[data-pl="home"]');return{dis:b.disabled,blk:b.classList.contains('blk')};})(),curb:(document.getElementById('curbOut')||{}).textContent}));
 ok(/^2/.test(z.curb.trim())&&/ścisłą kontrolą/.test(z.rec)&&!z.home.dis&&!z.home.blk,'ZP: CURB-65 = 2 → rekomendacja (krótka hospitalizacja / dom ze ścisłą kontrolą), „Dom” aktywny',JSON.stringify(z));
 await zf.evaluate(()=>document.querySelector('[data-al="none"]').click());await sleep(200);await zf.evaluate(()=>document.querySelector('[data-pl="home"]').click());await sleep(400);
 z=await zf.evaluate(()=>({place:document.getElementById('zpPlace').textContent,res:document.getElementById('res').innerText}));
 ok(/Leczenie domowe/.test(z.place)&&/Amoksycylina/i.test(z.res)&&/48–72 h/.test(z.res),'ZP: lekarz wybiera „Dom” przy CURB-65 = 2 → schemat domowy z dawkami i kontrolą 48–72 h',z.place);
 ok(!/ZABLOKOWAN|zablokowan/.test(z.res),'ZP: brak komunikatów o blokadzie',z.res.match(/.{40}zablokowan.{40}/i));
 ok(await page.evaluate(()=>typeof window.SORHold==='undefined'&&!document.querySelector('#holdLamp,#holdOv,#holdBanner')),'Brak mechanizmu blokady wypisu w aplikacji');
 ok(!errs.length,'Brak błędów JS / konsoli',errs.join(' | '));
 await br.close();console.log((n-fail)+'/'+n+' PASS');process.exit(fail?1:0);})();
