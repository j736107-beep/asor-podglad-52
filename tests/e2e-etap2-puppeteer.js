const puppeteer=require('puppeteer-core');const fs=require('fs');
const BASE=process.env.BASE||'http://localhost:8765/';
const R=[];let fails=0;function rec(id,ok,msg){R.push([id,ok]);if(!ok)fails++;console.log(id.padEnd(60),ok?'PASS':'FAIL',String(msg||'').slice(0,400));}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const hhmm=d=>('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);
(async()=>{
const br=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required'],headless:'new'});
const page=await br.newPage();await page.setViewport({width:1400,height:1000});
const errs=[];page.on('pageerror',e=>errs.push('pageerror '+e.message));page.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text());});
page.on('dialog',d=>d.accept());
await page.goto(BASE,{waitUntil:'networkidle0'});await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.reload({waitUntil:'networkidle0'});
const ver=await page.$eval('#ver',e=>e.textContent);rec('Wersja: etap 2+',/5\.2 \(testowa\) · etap [2-9] · 09\.11\.2026/.test(ver),ver);
const go=async id=>{await page.evaluate(id=>{document.querySelector('#side button[data-id="'+id+'"]').click();},id);await sleep(800);};
const frameOf=async src=>{for(let k=0;k<30;k++){const f=page.frames().find(f=>f.url().includes(src));if(f){try{await f.waitForSelector('body');return f;}catch(e){}}await sleep(200);}return null;};
await page.type('#pbName','Anna Testowa');
await page.evaluate(()=>{const w=document.querySelector('#pw');w.value='70';w.dispatchEvent(new Event('input'));const a=document.querySelector('#pa');a.value='40';a.dispatchEvent(new Event('input'));});await sleep(300);
// ===== SE
await go('se');let f=await frameOf('mod/se');await sleep(800);
await f.evaluate(()=>{[...document.querySelectorAll('button')].find(b=>/Lewetyracetam/.test(b.textContent)).click();});await sleep(300);
await f.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(b=>/Podano/i.test(b.textContent));b&&b.click();});await sleep(500);
const t45=hhmm(new Date(Date.now()-45*60000));
await f.evaluate(t=>{const e=document.getElementById('t0');e.value=t;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},t45);await sleep(500);
let se=await f.evaluate(()=>({sec:(document.getElementById('secondCard')||{}).textContent||'',s3:(document.getElementById('s3msg')||{}).textContent||''}));
rec("SE: drugi lek II rzutu = walproinian 2800 mg / 28 ml / 168 ml/h",/walproinian/i.test(se.sec)&&/2800/.test(se.sec)&&/168/.test(se.sec),se.sec.slice(-400));
rec('SE: ≥40 min → komunikat III rzutu',/III rzut/.test(se.s3),se.s3);
await f.evaluate(()=>{document.querySelector('.tg2[data-c="polg"]').click();});await sleep(400);
se=await f.evaluate(()=>(document.getElementById('secondCard')||{}).textContent||'');
rec('SE: POLG → walproinian ZABLOKOWANY',/ZABLOKOWANY/.test(se),se.slice(0,250));
await f.evaluate(()=>{document.querySelector('.tg2[data-c="polg"]').click();document.querySelector('.tg2[data-c="alco"]').click();});await sleep(300);
await f.evaluate(()=>{document.querySelector('.tg2[data-c="wern"]').click();});await sleep(400);
let th=await f.evaluate(()=>(document.getElementById('thiaCard')||{}).textContent||'');
rec('SE: tiamina 100 mg + Wernicke 500 mg 3×/d, 5 amp.',/100 mg/.test(th)&&/500 mg/.test(th)&&/5 amp/.test(th)&&/aptek/i.test(th),th.slice(0,250));

// ===== EL
await go('el');f=await frameOf('mod/el');await sleep(800);
await f.evaluate(()=>document.querySelector('[data-k="hipoNa"]').click());await sleep(300);
const setNa=async v=>{await f.evaluate(v=>{const e=document.getElementById('L_na');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},v);await sleep(300);};
await setNa('104');let od=await f.evaluate(()=>({o:(document.getElementById('odsBox')||{}).textContent,l:(document.getElementById('limitBox')||{}).textContent,c:(document.getElementById('targetBox')||{}).textContent}));
rec('EL: Na 104 → ryzyko ODS TAK, limit 8, cel 4–6',/TAK/.test(od.o)&&/105/.test(od.o)&&/≤8/.test(od.l)&&/4–6/.test(od.c),JSON.stringify(od));
await setNa('118');await f.evaluate(()=>document.querySelector('[data-o="sympt:severe"]').click());await sleep(300);
od=await f.evaluate(()=>({o:(document.getElementById('odsBox')||{}).textContent,l:(document.getElementById('limitBox')||{}).textContent}));
rec('EL: Na 118 bez ryzyka → ODS NIE, limit 10',/NIE/.test(od.o)&&/≤10/.test(od.l),JSON.stringify(od));
const bol=async()=>{await f.evaluate(()=>document.getElementById('bolGive').click());await sleep(250);};
const addNa=async v=>{await f.evaluate(v=>{const e=document.getElementById('naNext');e.value=v;document.getElementById('naSame').click();},v);await sleep(250);};
await bol();await addNa('121');let tr=await f.evaluate(()=>document.getElementById('naTrack').textContent);
const ok1=!/STOP/.test(tr);await bol();await addNa('124');tr=await f.evaluate(()=>document.getElementById('naTrack').textContent);
rec('EL: 118→121→124 → STOP bolusom po 2. bolusie (+6)',ok1&&/STOP/.test(tr)&&/\+6/.test(tr),tr);
await addNa('129');let rl=await f.evaluate(()=>(document.getElementById('relower')||{}).textContent||'');
rec('EL: +11 → korekta w dół G5% 700 ml w 1 h',/700 ml w 1 h/.test(rl)&&/desmopresyna/i.test(rl),rl.slice(0,200));
await f.evaluate(()=>document.querySelector('[data-o="alco"]').click());await sleep(300);
th=await f.evaluate(()=>(document.getElementById('thiaCard')||{}).textContent||'');rec('EL: alkoholizm → karta tiaminy',/100 mg/.test(th),th.slice(0,120));
await f.evaluate(()=>document.getElementById('trkClr').click());
// ===== ANA
await go('ana');
const chk=async id=>{await page.evaluate(id=>{const e=document.querySelector('#main #'+id);e.checked=true;e.dispatchEvent(new Event('change',{bubbles:true}));},id);await sleep(250);};
await chk('refr');await chk('bb');await chk('hypo');
let an=await page.evaluate(()=>({inf:(document.getElementById('anaInf')||{}).textContent,out:document.querySelector('#main #out').textContent,glu:(document.getElementById('anaGlu')||{}).textContent,nor:(document.getElementById('anaNor')||{}).textContent}));
rec('ANA: 70 kg oporna → 20 µg/ml 17,5–35 ml/h, 5,8–11,7 µg/min',/5,8–11,7 µg\/min/.test(an.inf)&&/17,5–35 ml\/h/.test(an.out)&&/3,5–7 ml\/h/.test(an.out),an.inf);
rec('ANA: β-bloker → glukagon 1–2 mg co 5 min',/1–2 mg/.test(an.glu)&&/co 5 min/.test(an.glu),an.glu);
rec('ANA: noradrenalina 80 µg/ml z rachunkiem',/ml\/h/.test(an.nor),an.nor);
await page.evaluate(()=>document.querySelector('#main .tabs button[data-t="obs"]').click());await sleep(400);
await page.evaluate(()=>{const e=document.querySelector('#main #doses');e.value='2';e.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(200);
const now=new Date(),tres=new Date(now.getTime()-60*60000),exp=hhmm(new Date(tres.getTime()+6*3600e3));
await page.evaluate(t=>{const e=document.getElementById('anaTres');e.value=t;e.dispatchEvent(new Event('input',{bubbles:true}));},hhmm(tres));await sleep(300);
let ob=await page.evaluate(()=>({r:(document.getElementById('anaObsRes')||{}).textContent,h:typeof window.SORHold}));
rec('ANA: 2 dawki, ustąpienie −1 h → obserwacja do +6 h ('+exp+'), bez blokady wypisu',ob.r&&ob.r.indexOf('Obserwacja do '+exp)>=0&&ob.h==='undefined',JSON.stringify(ob));
await chk('inf');ob=await page.evaluate(()=>(document.getElementById('anaObsRes')||{}).textContent);rec('ANA: wlew adrenaliny → HOSPITALIZACJA',/HOSPITALIZACJA/.test(ob),ob);

// ===== Sepsa – materiał na posiewy
await go('sepsis');await page.evaluate(()=>document.querySelector('#main .tabs button[data-t="m"]').click());await sleep(500);
const setT=async(id,v)=>page.evaluate((id,v)=>{const e=document.querySelector('#main #'+id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},id,v);
await chk('bc1');await setT('bc1t','10:00');await chk('bc2');await setT('bc2t','10:05');await sleep(300);
let cu=await page.evaluate(()=>document.querySelector('#main #out').textContent);
rec('SEP: 2 zestawy → „2/2, 4 butelki” + godziny',/2\/2, 4 butelki/.test(cu)&&/10:00/.test(cu)&&/10:05/.test(cu),cu.slice(0,200));
await setT('abxT','10:02');await sleep(300);cu=await page.evaluate(()=>(document.getElementById('cultAfter')||{}).textContent||'');
rec('SEP: pobranie po antybiotyku → adnotacja',/po antybiotyku/.test(cu),cu);
await chk('csf');cu=await page.evaluate(()=>({n:document.querySelectorAll('#csfList li').length,vis:!document.getElementById('csfTubes').hidden}));
rec('SEP: PMR → lista 4 probówek',cu.n===4&&cu.vis,JSON.stringify(cu));
await page.evaluate(()=>document.querySelector('#main .tabs button[data-t="e"]').click());await sleep(500);
cu=await page.evaluate(()=>document.querySelector('#main #out').textContent);rec('SEP: raport zawiera materiał na posiewy z godzinami',/Materiał na posiewy/.test(cu)&&/10:05/.test(cu),'');

// ===== Neuroinfekcje
await page.evaluate(()=>{const c=document.querySelector('#pcr');if(c){c.value='0.9';c.dispatchEvent(new Event('input'));}});
await go('neuroinf');await page.evaluate(()=>document.querySelector('#main .tabs button[data-t="p"]').click());await sleep(500);
for(const [k,v] of [['cells','150'],['neut','10'],['prot','60'],['glu','65'],['sglu','100'],['lac','1.8']])await setT(k,v);await sleep(300);
await page.evaluate(()=>document.querySelector('#main .tabs button[data-t="t"]').click());await sleep(600);
let nu=await page.evaluate(()=>({s:(document.getElementById('csfSteer')||{}).textContent||'',o:document.querySelector('#main #out').textContent}));
rec('NEU: wzorzec wirusowy → acyklowir 700 mg co 8 h na 1. miejscu',/WIRUSOWY/.test(nu.o)&&/700 mg co 8 h/.test(nu.s)&&nu.o.indexOf('Acyklowir')<nu.o.indexOf('Ceftriakson'),nu.s.slice(0,200));

// ===== DKA nazwy
const dn=await page.$eval('#side button[data-id="dka"]',b=>b.textContent);await go('dka');const dt=await page.evaluate(()=>document.querySelector('#main h2').textContent);
rec('DKA: polskie nazwy w menu i tytule',/Kwasica ketonowa \(DKA\)/.test(dn)&&/Cukrzycowa kwasica ketonowa \(DKA\)/.test(dt)&&/Hiperglikemiczny stan hiperosmolarny \(HHS\)/.test(dt),dn+' | '+dt);
await page.evaluate(()=>{const f=document.querySelector('#f');const set=(id,v)=>{const e=f.querySelector('#'+id);if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}};set('glu','450');set('ket','5');set('ph','7.1');set('hco3','10');set('k','4.5');set('na','135');});await sleep(400);await page.evaluate(()=>{SORReport.capture(SKS.active());SORReport.fill([{module:'dka'}]);});let pd=await page.evaluate(()=>document.getElementById('printArea').textContent);
rec('DKA: wydruk zawiera pełne polskie nazwy',/Kwasica ketonowa \(DKA\) \/ Stan hiperosmolarny \(HHS\)/.test(pd),'');
// ===== Bilans płynów + Antykoagulacja
await go('fluid');let fl=await page.evaluate(()=>({s:(document.getElementById('ptStrip')||{}).textContent||'',b:!!document.querySelector('#main .tabPrint')}));
rec('Bilans płynów: pasek pacjenta + przycisk wydruku',/Anna Testowa/.test(fl.s)&&/wiek 40/.test(fl.s)&&fl.b,fl.s);
await go('acoag');const tabs=await page.evaluate(()=>[...document.querySelectorAll('#main .tabs button')].map(b=>b.dataset.t));let okA=[];
for(const t of tabs){await page.evaluate(t=>document.querySelector('#main .tabs button[data-t="'+t+'"]').click(),t);await sleep(300);const x=await page.evaluate(()=>({s:(document.getElementById('ptStrip')||{}).textContent||'',b:!!document.querySelector('#main .tabPrint')}));if(/Anna Testowa/.test(x.s)&&x.b)okA.push(t);}
rec('Antykoagulacja: pasek pacjenta + wydruk w każdej zakładce ('+tabs.length+')',okA.length===tabs.length&&tabs.length===8,okA.join(','));
await page.evaluate(()=>{SORReport.capture(SKS.active());SORReport.fill([{module:'acoag'}]);});
await page.emulateMediaType('print');let pdf=await page.pdf({format:'A4',printBackground:true});await page.emulateMediaType('screen');let pages=(pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;
pd=await page.evaluate(()=>document.getElementById('printArea').textContent);rec('Antykoagulacja: wydruk zakładki 1 strona A4 z nazwiskiem',pages===1&&/Anna Testowa/.test(pd),'stron '+pages);
// ===== Zapalenie płuc: wydruk zawiera antybiotykoterapię
await go('cap');await page.evaluate(()=>document.querySelector('[data-clin-tab="abx51"]').click());await sleep(600);const zf=await frameOf('mod/zp');await sleep(1200);
await zf.evaluate(()=>{document.querySelector('[data-al="none"]').click();});await sleep(300);await zf.evaluate(()=>{document.querySelector('[data-pl="ward"]').click();});await sleep(500);
await page.evaluate(()=>{SORReport.capture(SKS.active());SORReport.fill([{module:'cap'}]);});
pd=await page.evaluate(()=>document.getElementById('printArea').textContent);
await page.emulateMediaType('print');pdf=await page.pdf({format:'A4',printBackground:true});await page.emulateMediaType('screen');pages=(pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g)||[]).length;fs.writeFileSync('/workspace/print_cap_etap2.pdf',pdf);
rec('ZP: wydruk zawiera treść antybiotykoterapii (1–2 str.)',/antybiotykoterapia/i.test(pd)&&/Proponowane/.test(pd)&&pages<=2,'stron '+pages+' · '+pd.slice(pd.search(/Proponowane/),pd.search(/Proponowane/)+160));
rec('Brak błędów JS (etap 2)',errs.length===0,JSON.stringify(errs).slice(0,800));
console.log(`\n${R.length-fails} PASS, ${fails} FAIL`);await br.close();process.exit(fails?1:0);})().catch(e=>{console.error(e);process.exit(2);});
