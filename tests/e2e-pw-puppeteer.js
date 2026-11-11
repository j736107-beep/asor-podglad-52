/* Przegląd wyników – test przeglądarkowy (5.2, opcjonalnie porównanie z 5.1: B51=url).
   Wykresy (SVG) dla każdego analitu z ≥2 pomiarami, brak „jednostka nierozpoznana”, wiek z paska pacjenta, wydruk A4, Następny pacjent.
   BASE=http://localhost:8765/ node e2e-pw-puppeteer.js  (puppeteer-core, Chrome: CHROME=/usr/bin/google-chrome) */
const puppeteer=require('puppeteer-core');const path=require('path');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const C=require(process.env.CASES||path.join(__dirname,'data/pw_cases.js'));
const BASE=process.env.BASE||'http://localhost:8765/',B51=process.env.B51||'',SHOTS=process.env.SHOTS||'';
let n=0,fail=0;function ok(c,m){n++;if(!c){fail++;console.log('FAIL',m);}}
async function openPW(p,base){await p.goto(base,{waitUntil:'networkidle0'});await p.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await p.reload({waitUntil:'networkidle0'});
 await p.evaluate(()=>{const a=document.getElementById('pa');a.value='67';a.dispatchEvent(new Event('input',{bubbles:true}));a.dispatchEvent(new Event('change',{bubbles:true}));});
 await p.evaluate(()=>document.querySelector('#side [data-id="trends"]').click());await sleep(1200);return p.frames().find(x=>/mod\/pw/.test(x.url()));}
async function runCase(f,t){await f.evaluate(t=>{const e=document.getElementById('paste');e.value=t;e.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('go').click();},t);await sleep(400);
 return f.evaluate(()=>{const o=document.getElementById('out'),P=PW.parse(document.getElementById('paste').value);const multi=Object.keys(P.res).filter(k=>P.res[k].points.length>=2);
  const rows=[...o.querySelectorAll('.row')].map(r=>({k:r.dataset.k,svg:!!r.querySelector('svg.pw-spark polyline'),u:(r.querySelector('.u')||{}).textContent||''}));
  return{svg:o.querySelectorAll('svg.pw-spark').length,multi:multi,rows:rows,nr:/nierozpoznana|nie rozpoznana/i.test(o.innerText),txt:o.innerText};});}
(async()=>{const br=await puppeteer.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox'],headless:'new'});
 const p=await br.newPage();await p.setViewport({width:1300,height:1500});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
 const f=await openPW(p,BASE);ok(!!f,'ramka modułu Przegląd wyników');
 ok(await f.evaluate(()=>document.getElementById('age').value)==='67','wiek z paska pacjenta → moduł');
 const res={};
 for(const k of Object.keys(C)){const r=await runCase(f,C[k]);res[k]=r;
  ok(r.svg>=r.multi.length&&r.multi.length>0,k+': wykresy '+r.svg+' / analitów z ≥2 pomiarami '+r.multi.length);
  r.multi.forEach(a=>{const row=r.rows.find(x=>x.k===a);ok(row&&row.svg,k+': wykres dla '+a);});
  ok(!r.nr,k+': brak „jednostka nierozpoznana”');ok(!r.rows.some(x=>/^(WBC|HGB|PLT|Na|K)$/.test(x.u)),k+': alias nie jest jednostką');}
 ok(/próg 670/.test(res.doctor.txt)||/670/.test(res.doctor.txt),'D-dimery: próg wg wieku z paska (670)');
 // zmiana wieku w pasku przy otwartym module
 await p.evaluate(()=>{const a=document.getElementById('pa');a.value='45';a.dispatchEvent(new Event('input',{bubbles:true}));a.dispatchEvent(new Event('change',{bubbles:true}));});await sleep(600);
 ok(await f.evaluate(()=>document.getElementById('age').value)==='45','zmiana wieku w pasku przy otwartym module');
 // wydruk A4
 await runCase(f,C.doctor);
 await p.evaluate(()=>{window.print=function(){window.__printed=1;};document.getElementById('printMod').click();});await sleep(300);
 const pr=await p.evaluate(()=>({p:window.__printed,t:(document.getElementById('printArea')||{}).innerText||''}));
 ok(pr.p===1,'wydruk wywołany');ok(/Nie przeocz/.test(pr.t)&&/Troponina narasta/.test(pr.t),'wydruk: alarmy');ok(/przebieg w czasie/i.test(pr.t)&&/Kreatynina: .*1,6/.test(pr.t),'wydruk: przebieg wyników');
 // powrót do modułu – wyniki zachowane
 await p.evaluate(()=>document.querySelector('#side [data-id="dashboard"],#side button').click());await sleep(500);
 await p.evaluate(()=>document.querySelector('#side [data-id="trends"]').click());await sleep(1200);
 let f2=p.frames().find(x=>/mod\/pw/.test(x.url()));ok(f2&&await f2.evaluate(()=>document.querySelectorAll('#out svg.pw-spark').length)>=11,'po powrocie do modułu wykresy są');
 if(SHOTS){await f2.evaluate(()=>{const s=document.querySelector('.tiles');if(s)s.scrollIntoView();});await sleep(200);await p.screenshot({path:SHOTS});}
 // Następny pacjent
 await p.evaluate(()=>document.getElementById('nextPt').click());await sleep(1200);
 await p.evaluate(()=>document.querySelector('#side [data-id="trends"]').click());await sleep(1200);
 f2=p.frames().find(x=>/mod\/pw/.test(x.url()));ok(f2&&await f2.evaluate(()=>document.getElementById('paste').value===''&&document.getElementById('out').innerHTML===''),'Następny pacjent czyści moduł');
 ok(!errs.length,'brak błędów JS: '+errs.join(' | '));
 if(B51){const q=await br.newPage();await q.setViewport({width:1300,height:1500});q.on('dialog',d=>d.accept());const g=await openPW(q,B51);
  for(const k of Object.keys(C)){const a=await runCase(g,C[k]),b=res[k];
   ok(b.svg>=a.svg,k+': 5.2 ma ≥ wykresów niż 5.1 ('+b.svg+' vs '+a.svg+')');
   a.rows.forEach(r=>{if(r.svg)ok(b.rows.some(x=>x.k===r.k&&x.svg),k+': wykres '+r.k+' jak w 5.1');});}}
 await br.close();console.log((n-fail)+'/'+n+' OK');process.exit(fail?1:0);})();
