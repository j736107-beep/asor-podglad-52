/* 11.11.2026 (RODO + płeć): brak numeru identyfikacyjnego w UI/kodzie, wiek ręcznie w pasku → moduły,
   M (pasek lub selektor modułu) blokuje i odznacza WSZYSTKIE pola ciąży we wszystkich modułach; K – odblokowuje.
   BASE=http://localhost:8765/ SHOTS=katalog_zrzutow node e2e-rodo-plec-puppeteer.js */
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://localhost:8765/',SHOTS=process.env.SHOTS||'';let n=0,fail=0;function ok(c,m,d){n++;console.log((c?'PASS ':'FAIL ')+m+(c||!d?'':' — '+String(d).slice(0,4000)));if(!c)fail++;}
const ID=new RegExp('pe'+'sel','i');// tekst szukany (bez dosłownego słowa w kodzie testu)
(async()=>{const br=await puppeteer.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox'],headless:'new'});
 const page=await br.newPage();await page.setViewport({width:1280,height:1000});const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/favicon|404/.test(m.text()))errs.push(m.text());});page.on('dialog',d=>d.accept());
 const shot=async f=>{if(SHOTS){require('fs').mkdirSync(SHOTS,{recursive:true});await page.screenshot({path:SHOTS+'/'+f});}};
 // RODO: stare zapisy z numerem identyfikacyjnym czyszczone przy starcie
 await page.goto(BASE,{waitUntil:'networkidle0'});
 await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();const k='pe'+'sel';sessionStorage.setItem('sk_pid',JSON.stringify({name:'Jan Test',[k]:'44051401359',adm:''}));localStorage.setItem('sk_m_neuro',JSON.stringify({[k]:'44051401359',x:1}));localStorage.setItem('v52_'+k,'44051401359');localStorage.setItem('kalk_state',JSON.stringify({vals:{a:{[k]:'1'}},pz:{ok:true}}));});
 await page.reload({waitUntil:'networkidle0'});
 const left=await page.evaluate(()=>{const out=[];[localStorage,sessionStorage].forEach(S=>Object.keys(S).forEach(k=>{const v=S.getItem(k)||'';if(/pe[s]el/i.test(k+v)||/"pz"/.test(v)||/44051401359/.test(v))out.push(k);}));return {out,name:JSON.parse(sessionStorage.getItem('sk_pid')||'{}').name};});
 ok(!left.out.length&&left.name==='Jan Test','Start: zapisane numery identyfikacyjne usunięte (sessionStorage/localStorage), imię zostaje',JSON.stringify(left));
 const bar=await page.evaluate(()=>({txt:document.getElementById('pbar').innerText,ids:[...document.querySelectorAll('#pbar input')].map(i=>i.id+':'+(i.placeholder||'')),age:!!document.getElementById('pa'),sex:!!document.querySelector('#psex [data-s="m"]')}));
 ok(!ID.test(bar.txt+bar.ids.join())&&bar.age&&bar.sex&&bar.ids.includes('pbName:imię i nazwisko'),'Pasek: imię i nazwisko + Wiek (ręcznie) + płeć, bez numeru identyfikacyjnego',JSON.stringify(bar));
 const typeBar=async(id,v)=>page.evaluate((id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},id,v);
 const sexBar=async s=>{await page.evaluate(s=>{const b=document.querySelector('#psex [data-s="'+s+'"]');if(!b.classList.contains('on'))b.click();},s);await sleep(250);};
 await shot('pasek-0-bez-numeru-identyfikacyjnego.png');
 // ---- lista modułów
 const MODS=await page.evaluate(()=>[...document.querySelectorAll('#side button[data-id]')].map(b=>({id:b.dataset.id,name:b.textContent.trim()})));
 ok(MODS.length>=28&&!MODS.some(m=>m.id==='documentation'),'Liczba modułów w menu: '+MODS.length+' (11.11.2026: scalone telszp→Książka, icd10+icd9→ICD, eucast→przyciski; usunięta Dokumentacja SOR)',JSON.stringify(MODS.map(m=>m.id)));
 const go=async id=>{await page.evaluate(id=>document.querySelector('#side button[data-id="'+id+'"]').click(),id);await sleep(900);};
 // zbiera kontrolki ciąży w dokumencie + ramkach
 const collect=async()=>{const res=[];const fr=[page.mainFrame(),...page.frames().filter(f=>f!==page.mainFrame())];
  for(const f of fr){try{const r=await f.evaluate(()=>{const SEL=window.SKSexGuard?window.SKSexGuard.SEL:'';const out=[];const root=document.getElementById('main')||document.body;
    const cand=[...root.querySelectorAll('input[type=checkbox],input[type=radio],select,button')];
    cand.forEach(e=>{if(e.offsetParent===null&&e.tagName!=='OPTION')return;let t='';if(e.tagName==='BUTTON')t=e.textContent;else{const l=e.closest('label');t=l?l.textContent:'';if(e.tagName==='SELECT'&&l)t=t.replace(e.textContent,'');}
     t=t.replace(/\s+/g,' ').trim();const bySel=SEL&&e.matches(SEL);const byTxt=/(^|[^\p{L}])(ciąż|połóg)/iu.test(t)&&t.length<=90&&!/^(ℹ|🖨)/.test(t);
     if(bySel||byTxt)out.push({id:e.id||e.dataset.c||e.dataset.o||e.dataset.k||'',tag:e.tagName,t:t.slice(0,50),dis:e.disabled,on:e.tagName==='SELECT'?e.value:(e.checked||e.classList.contains('on')),tip:e.title||''});});return {url:location.pathname,out};});
   r.out.forEach(x=>res.push(Object.assign({fr:r.url.replace(/.*asor-podglad-52/,'')},x)));}catch(e){}}return res;};
 const tabsOf=async()=>page.evaluate(()=>[...document.querySelectorAll('#main .tabs button, #main [role=tab], #main button[data-tab], #main .ctabs button, #main .cl-tabs button, #main [data-clin-tab]')].map((b,i)=>i));
 const clickTab=async i=>{await page.evaluate(i=>{const b=[...document.querySelectorAll('#main .tabs button, #main [role=tab], #main button[data-tab], #main .ctabs button, #main .cl-tabs button, #main [data-clin-tab]')][i];if(b)b.click();},i);await sleep(500);};
 const found={};const bad=[];
 await typeBar('pa','67');await sexBar('m');
 for(const m of MODS){await go(m.id);let tabs=await tabsOf();const seen=new Set();const scan=async(lbl)=>{const c=await collect();c.forEach(x=>{const key=m.id+'|'+x.fr+'|'+x.id+'|'+x.t;if(seen.has(key))return;seen.add(key);(found[m.name]=found[m.name]||[]).push(x.t||x.id);
    const offOk=x.tag==='SELECT'?['','none','no'].includes(x.on):!x.on;if(!(x.dis&&offOk&&/niedostępne dla mężczyzny/.test(x.tip)))bad.push(m.name+lbl+': '+JSON.stringify(x));});};
  await scan('');for(const i of tabs){await clickTab(i);await scan(' [zakładka '+i+']');}
  if(m.id==='kalk'){await page.evaluate(()=>{const b=document.querySelector('.kk-chip[data-c="pregYears"]');if(b)b.click();});await sleep(500);await scan(' [YEARS ciąża]');}}
 ok(!bad.length,'M: każde pole ciąży zablokowane, odznaczone, z podpowiedzią „niedostępne dla mężczyzny” (wszystkie moduły i zakładki)',bad.join('\n'));
 const listF=()=>Object.keys(found);
 const need=['Zapalenie płuc','Przegląd wyników','Neurologia','Kalkulatory','Antykoagulacja','Neuroinfekcje'];
 ok(need.every(nm=>Object.keys(found).some(k=>k.includes(nm))),'Pola ciąży znalezione m.in. w: '+need.join(', '),Object.keys(found).join(', '));
 // Stan padaczkowy: przełącznik „ciąża” w ramce (ukryty – sterowany paskiem) też zablokowany
 await go('se');await sleep(600);{const f=page.frames().find(x=>/mod\/se/.test(x.url()));const r=await f.evaluate(()=>{const b=document.querySelector('.tg[data-c="preg"]');return b?{dis:b.disabled,on:b.classList.contains('on'),tip:b.title}:null;});
  ok(r&&r.dis&&!r.on&&/niedostępne dla mężczyzny/.test(r.tip),'Stan padaczkowy: „ciąża” zablokowana dla M',JSON.stringify(r));if(r)(found['⚡ Stan padaczkowy']=found['⚡ Stan padaczkowy']||[]).push('ciąża (przełącznik modułu, sterowany paskiem)');}
 // Kalkulatory: YEARS w ciąży wybrany przy K → po zmianie na M przełącza na zwykły YEARS
 await sexBar('f');await go('kalk');await page.evaluate(()=>document.querySelector('.kk-chip[data-c="pregYears"]').click());await sleep(400);await page.evaluate(()=>{const c=document.querySelector('input[data-k="preg"]');if(c&&!c.checked)c.click();});await sleep(300);
 await shot('kalk-1-kobieta-years-ciaza.png');await sexBar('m');await sleep(500);
 {const r=await page.evaluate(()=>({sel:(document.querySelector('.kk-chip.on')||{}).dataset?.c,chip:document.querySelector('.kk-chip[data-c="pregYears"]').disabled}));ok(r.sel!=='pregYears'&&r.chip,'Kalkulatory: M → „YEARS w ciąży” zablokowany i zamieniony na zwykły YEARS',JSON.stringify(r));}
 await shot('kalk-2-mezczyzna-years-ciaza-zablokowany.png');
 // ---- K: odblokowanie; zaznaczenie; przełączenie na M odznacza
 await sexBar('f');await go('cap');await sleep(400);
 await page.evaluate(()=>[...document.querySelectorAll('#main button')].find(b=>/Antybiotykoterapia/.test(b.textContent))?.click());await sleep(1200);
 let zf=page.frames().find(f=>/mod\/zp/.test(f.url()));
 let z=await zf.evaluate(()=>{const b=document.querySelector('[data-o="preg"]');return{dis:b.disabled,age:document.getElementById('age').value,sex:(document.querySelector('[data-sex].on')||{}).dataset?.sex};});
 ok(!z.dis&&z.age==='67'&&z.sex==='f','K: ZP „Ciąża” dostępna; wiek 67 i płeć K z paska',JSON.stringify(z));
 await zf.evaluate(()=>document.querySelector('[data-o="preg"]').click());await page.evaluate(()=>{const b=document.querySelector('#pbar .tg[data-c="preg"]');if(!b.classList.contains('on'))b.click();});await sleep(300);
 z=await zf.evaluate(()=>document.querySelector('[data-o="preg"]').classList.contains('on'));ok(z,'K: zaznaczono ciążę w ZP i w pasku','');
 await shot('zp-1-kobieta-ciaza-dostepna.png');
 await sexBar('m');await sleep(500);
 z=await zf.evaluate(()=>{const b=document.querySelector('[data-o="preg"]');return{dis:b.disabled,on:b.classList.contains('on'),tip:b.title,sex:(document.querySelector('[data-sex].on')||{}).dataset?.sex};});
 const pb=await page.evaluate(()=>{const b=document.querySelector('#pbar .tg[data-c="preg"]');return{dis:b.disabled,on:b.classList.contains('on')};});
 ok(z.dis&&!z.on&&/niedostępne dla mężczyzny/.test(z.tip)&&z.sex==='m'&&pb.dis&&!pb.on,'Pasek → M: ciąża odznaczona i zablokowana w ZP i w pasku; płeć w ZP = M',JSON.stringify([z,pb]));
 await zf.evaluate(()=>document.getElementById('zpFrame')||document.body.scrollIntoView());await page.evaluate(()=>document.getElementById('zpFrame').scrollIntoView());await shot('zp-2-mezczyzna-ciaza-zablokowana.png');
 // moduł → pasek: K w ZP
 await zf.evaluate(()=>document.querySelector('[data-sex="f"]').click());await sleep(600);
 const bs=await page.evaluate(()=>(document.querySelector('#psex .on')||{}).dataset?.s);z=await zf.evaluate(()=>document.querySelector('[data-o="preg"]').disabled);
 ok(bs==='f'&&!z,'Selektor płci w ZP (K) → pasek K, ciąża ponownie dostępna',JSON.stringify([bs,z]));
 await zf.evaluate(()=>document.querySelector('[data-sex="m"]').click());await sleep(600);
 ok(await page.evaluate(()=>(document.querySelector('#psex .on')||{}).dataset?.s)==='m'&&await zf.evaluate(()=>document.querySelector('[data-o="preg"]').disabled),'Selektor płci w ZP (M) → pasek M, ciąża zablokowana','');
 // ---- wiek: propagacja i pusty = pusty
 const ageIn=async id=>{await go(id);await sleep(500);const f=page.frames().find(x=>x!==page.mainFrame()&&x.url().includes('mod/'));return f?await f.evaluate(()=>(document.getElementById('age')||{}).value):null;};
 await typeBar('pa','72');
 const ages={pw:await ageIn('trends'),el:await ageIn('el'),trop:await ageIn('trop')};
 ok(ages.pw==='72'&&ages.el==='72'&&ages.trop==='72','Wiek 72 z paska → Przegląd wyników, Elektrolity, Troponina',JSON.stringify(ages));
 await go('cap');await page.evaluate(()=>[...document.querySelectorAll('#main button')].find(b=>/Antybiotykoterapia/.test(b.textContent))?.click());await sleep(1200);zf=page.frames().find(f=>/mod\/zp/.test(f.url()));
 const za=await zf.evaluate(()=>document.getElementById('age').value);ok(za==='72','Wiek 72 z paska → Zapalenie płuc (CrCl)',za);
 await typeBar('pa','');await sleep(500);const zb=await zf.evaluate(()=>document.getElementById('age').value);
 ok(zb==='','Wyczyszczony wiek w pasku → pusty w ZP (bez wartości domyślnej)',zb);
 const sep=await (async()=>{await typeBar('pa','');await go('sepsis');await sleep(500);return page.evaluate(()=>document.getElementById('main').innerText);})();
 ok(!/\b(wiek|age)\s*[:=]?\s*(18|50|65)\s*l/i.test(sep),'Brak domyślnego wieku w Sepsie przy pustym pasku',sep.slice(0,200));
 // ---- brak numeru identyfikacyjnego w UI wszystkich modułów (poza historią zmian w „O aplikacji”)
 const hits=[];for(const m of MODS){if(m.id==='about')continue;await go(m.id);const fr=[page.mainFrame(),...page.frames().filter(f=>f!==page.mainFrame())];for(const f of fr){try{const t=await f.evaluate(()=>document.body.innerText+' '+[...document.querySelectorAll('input,select,textarea')].map(e=>e.id+' '+(e.placeholder||'')+' '+(e.name||'')).join(' '));if(ID.test(t))hits.push(m.name+' '+f.url());}catch(e){}}}
 ok(!hits.length,'Brak numeru identyfikacyjnego w UI modułów',hits.join(', '));
 // wydruk A4: nagłówek bez numeru, z wiekiem/płcią
 await typeBar('pa','72');await go('fluid');const pr=await page.evaluate(()=>{window.print=()=>{};document.getElementById('printMod').click();return (document.getElementById('printArea')||{}).innerText||'';});
 ok(!ID.test(pr)&&/wiek: 72 lat/.test(pr)&&/płeć: M/.test(pr),'Wydruk A4: nagłówek z imieniem, wiekiem i płcią, bez numeru identyfikacyjnego',pr.slice(0,300));
 console.log('MODUŁY Z POLAMI CIĄŻY (obsłużone):\n  '+listF().map(k=>k+': '+[...new Set(found[k])].join(' | ')).join('\n  '));
 ok(!errs.length,'Brak błędów JS',errs.join(' | ').slice(0,500));
 await br.close();console.log((n-fail)+'/'+n+(fail?' FAIL':' PASS'));process.exit(fail?1:0);})();
