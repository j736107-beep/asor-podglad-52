// fix25: rejestr leczenia usunięty, Bilans płynów (płyny + inne straty), Antykoagulacja – kratka w nagłówku, SpO₂, napisy usunięte, AI ukryte, AF czytelniej, wersja i data. BASE opcjonalne.
const pp=require('puppeteer-core');
const BASE=process.env.BASE||'http://localhost:8765/';
const sleep=t=>new Promise(r=>setTimeout(r,t));
let n=0,fail=0;const rec=(name,ok,info)=>{n++;if(!ok)fail++;console.log((ok?'PASS ':'FAIL ')+name+(ok?'':' :: '+String(info||'').slice(0,800)));};
const JUNK=/Źródła|Źródło|Wytyczne i ChPL|ChPL 4\.2|Efekt:|Wpisz wynik|Wpisz masę|Nie wpisano|Brak danych do raportu|zatwierdzony przez lekarza|Tabela dawek|Drożność dróg|Osmolalność efektywna = 2×|Profilaktyka ZŻ|Ustawienia lokalne – DO/;
(async()=>{
  const br=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await br.newPage();await page.setViewport({width:1280,height:900});
  const errs=[];page.on('pageerror',e=>errs.push(e.message));page.on('dialog',d=>d.accept());
  async function fresh(){
    await page.goto(BASE+'?t='+Date.now(),{waitUntil:'networkidle2',timeout:60000});
    await page.evaluate(async()=>{try{for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister();for(const k of await caches.keys())await caches.delete(k);}catch(e){}localStorage.clear();sessionStorage.clear();});
    await page.goto(BASE+'?t='+Date.now(),{waitUntil:'networkidle2',timeout:60000});
    await page.evaluate(()=>{window.print=()=>{};});await sleep(300);
  }
  const setP=o=>page.evaluate(o=>{for(const [id,v] of Object.entries(o)){const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}},o);
  const setF=o=>page.evaluate(o=>{for(const [id,v] of Object.entries(o)){const e=document.querySelector('#main #f #'+id);if(!e)throw Error('brak '+id);if(e.type==='checkbox'){if(e.checked!==v)e.click();}else{e.value=v;e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));}}},o);
  const show=async id=>{await page.evaluate(id=>SKS.show(id),id);await sleep(1500);};
  const tab=async(m,t)=>{await page.evaluate((m,t)=>SKS.goTab(m,t),m,t);await sleep(900);};
  const frame=async()=>{const h=await page.$('#main iframe');return h.contentFrame();};
  const printMod=async()=>{await page.evaluate(()=>document.getElementById('printMod').click());await sleep(600);return page.evaluate(()=>{const a=document.getElementById('printArea'),x=[...a.querySelectorAll('.rp-sect')];return x.length?x.map(e=>e.innerText).join('\n'):a.innerText;});};
  const full=()=>page.evaluate(()=>{SORReport.capture(SKS.active());return SORReport.fill(['done','pumps','fluid','modules']).innerText;});
  const wipe=async()=>{await Promise.all([page.waitForNavigation({waitUntil:'networkidle2',timeout:60000}).catch(()=>{}),page.evaluate(()=>{window.confirm=()=>true;SKS.wipe();})]);await page.waitForFunction(()=>window.SKS&&window.SORReport,{timeout:30000});await sleep(300);};
  const txt=()=>page.evaluate(()=>document.getElementById('main').innerText);
  // Pulpit i nawigacja
  await fresh();await show('dashboard');let t=await txt();
  const nav=await page.evaluate(()=>[...document.querySelectorAll('#side button')].map(b=>b.dataset.id));
  rec('Pulpit: hasło bez rejestru; brak kafelka i wpisu menu „Rejestr leczenia”; brak „Testy techniczne…”',/Kalkulatory, algorytmy, wydruk i wyniki w jednej przestrzeni\./.test(t)&&!/Rejestr leczenia|rejestr leczenia/.test(t)&&!nav.includes('treatment-log')&&!/Testy techniczne nie zastępują/.test(t),JSON.stringify(nav).slice(0,200));
  const hv=await page.evaluate(()=>({h:document.querySelector('#top .brand').innerText,f:(document.querySelector('.nav-foot')||{}).innerText,title:document.title}));
  rec('Nagłówek i stopka menu: „wersja 5.2 (testowa) · 21.11.2026”, bez „Narzędzie pomocnicze – niecertyfikowane” i „etap 4”',/wersja 5\.2 \(testowa\) · 21\.11\.2026/.test(hv.h)&&!/niecertyfikowane|etap 4/i.test(hv.h+hv.f+hv.title),JSON.stringify(hv));
  await page.evaluate(()=>SKS.show('treatment-log'));await sleep(800);
  rec('Stary odnośnik „treatment-log” → Pulpit dyżuru',await page.evaluate(()=>SKS.active&&SKS.active()&&SKS.active().id)==='dashboard',await page.evaluate(()=>SKS.active&&SKS.active()&&SKS.active().id));
  // Bilans płynów
  await setP({pw:'80'});await show('fluid');
  const fl=await page.evaluate(()=>({iv:[...document.querySelectorAll('.fl-type')].map(b=>b.textContent),lo:[...document.querySelectorAll('.fl-loss')].map(b=>b.textContent)}));
  rec('Bilans: płyny Optilyte, G5%, NaCl 0,9%, 1:1, Ringer; inne straty: sonda, biegunka, wymioty, opłucna, otrzewna',['0,9% NaCl','Glukoza 5%','Optilyte (płyn wieloelektrolitowy)','Płyn 1:1 (Glukoza 5% : NaCl 0,9%)','Płyn Ringera'].every(x=>fl.iv.includes(x))&&fl.lo.length===5&&/Sonda/.test(fl.lo[0])&&/otrzewnej/.test(fl.lo[4]),JSON.stringify(fl));
  await page.evaluate(()=>{const c=s=>{document.querySelector(s).click();};c('.fl-type[data-type="Optilyte (płyn wieloelektrolitowy)"]');c('.fl-iv .fl-b[data-ml="1000"]');c('.fl-ur .fl-b[data-ml="300"]');c('.fl-loss[data-loss="Jama otrzewnej (paracenteza)"]');c('.fl-lo .fl-b[data-ml="1000"]');c('.fl-loss[data-loss="Wymioty"]');c('.fl-lo .fl-b[data-ml="200"]');});await sleep(300);
  const fb=await page.evaluate(()=>({bal:document.getElementById('fl-bal').textContent,lo:document.getElementById('fl-lo').textContent,list:document.getElementById('fl-list').innerText}));
  rec('Bilans: 1000 (Optilyte) − 300 diurezy − 1200 strat = −500 ml; wpisy z nazwą płynu / straty',/−500 ml/.test(fb.bal)&&/1200 ml/.test(fb.lo)&&/Optilyte/.test(fb.list)&&/Inne straty – Jama otrzewnej \(paracenteza\)/.test(fb.list)&&/Inne straty – Wymioty/.test(fb.list),JSON.stringify(fb));
  t=await page.evaluate(()=>{SORReport.capture(SKS.active());return SORReport.fill(['fluid']).innerText;});
  rec('Bilans – wydruk: kolumna „Inne straty” i wpisy strat',/Inne straty/.test(t)&&/Jama otrzewnej \(paracenteza\)/.test(t)&&/−500 ml/.test(t),t.slice(0,600));
  // Antykoagulacja – kratka w nagłówku
  await fresh();await setP({pw:'80',pa:'60'});await tab('acoag','vka');await setF({inr:'4.5'});await sleep(200);
  const hc=await page.evaluate(()=>{const r=document.querySelector('.h2row'),h=r&&r.querySelector('h2'),l=r&&r.querySelector('.h2chk'),fe=document.querySelector('#main #f #bleed');return{has:!!l,txt:l&&l.textContent.trim(),fsH:h&&getComputedStyle(h).fontSize,fsL:l&&getComputedStyle(l).fontSize,right:l&&h&&(l.getBoundingClientRect().left>h.getBoundingClientRect().left),formHidden:fe&&fe.closest('label').style.display==='none'};});
  rec('Antykoagulacja (Warfaryna): kratka „krwawienie zagrażające życiu / pilny zabieg” w nagłówku, po prawej, czcionka jak nagłówek; pole w formularzu ukryte',hc.has&&/krwawienie zagrażające życiu \/ pilny zabieg/.test(hc.txt)&&hc.fsH===hc.fsL&&hc.right&&hc.formHidden,JSON.stringify(hc));
  await page.click('#hc_bleed');await sleep(400);t=await txt();
  rec('Kratka w nagłówku działa: witamina K / PCC (jak dawniej)',/Witamina K|witamina K/.test(t)&&/PCC/.test(t),t.slice(0,300));
  let pr=await printMod();rec('Wydruk VKA: wskazanie „krwawienie zagrażające życiu / pilny zabieg” zachowane',/krwawienie zagrażające życiu \/ pilny zabieg/.test(pr)&&/Witamina K/.test(pr),pr);
  await tab('acoag','noac');const hn=await page.evaluate(()=>({has:!!document.querySelector('#hc_nb'),chk:document.querySelector('#hc_nb')&&document.querySelector('#hc_nb').checked}));
  rec('Zakładka NOAC: własna kratka w nagłówku (niezaznaczona)',hn.has&&hn.chk===false,JSON.stringify(hn));
  await tab('acoag','ufh');rec('Zakładka Heparyna: bez kratki w nagłówku',await page.evaluate(()=>!document.querySelector('.h2chk')));
  // SpO₂
  await fresh();await setP({pw:'80',pa:'60'});await show('pe');t=await txt();
  const pe1=await page.evaluate(()=>document.getElementById('main').innerText);
  await show('ahf');const ah=await txt();
  rec('Zatorowość płucna i Ostra niewydolność serca: „SpO₂”, nigdzie „SpO (” ani samo „SpO”',/SpO₂/.test(pe1+ah)&&!/SpO(?![₂2])/.test(pe1+ah),(pe1.match(/SpO.{0,20}/g)||[]).concat(ah.match(/SpO.{0,20}/g)||[]).join(' | '));
  // AI ukryte
  await show('cap');t=await txt();rec('Zapalenie płuc: brak „✨ Epikryza (AI)”, „PILOT”, „Brak klucza API”',!/Epikryza \(AI\)|PILOT|Brak klucza API/.test(t)&&!(await page.evaluate(()=>!!document.getElementById('aiBtn'))),t.slice(0,200));
  await show('settings');rec('Ustawienia: sekcja AI zostaje (przełącznik widoczności, klucz)',await page.evaluate(()=>!!document.getElementById('aiShow')&&!!document.getElementById('aiKey')));
  // EUCAST
  await show('leki');t=await txt();rec('Leki: brak „To nie lokalna tabela breakpointów…”',!/breakpointów|offline tabeli EUCAST/.test(t)&&/EUCAST/.test(t),t.slice(0,200));
  // O programie
  await show('about');t=await txt();rec('O programie: wersja i data 21.11.2026, wpis fix25 (lub – po usunięciu najstarszego wpisu – odsyłacz do README), bez „Test techniczny, nie walidacja…”',/Wersja 5\.2 \(testowa\)/.test(t)&&/21\.11\.2026/.test(t)&&(/porządki i czytelność/.test(t)||/README\.md/.test(t))&&!/nie testowano na sprzęcie szpitalnym/.test(t)&&!/Narzędzie pomocnicze – niecertyfikowane/.test(t),t.slice(0,300));
  // AF
  await fresh();await setP({pw:'80',pa:'60'});await tab('af','e');
  const af=await page.evaluate(()=>{const l=document.querySelector('#main #f #k_oac').closest('label'),s=document.querySelector('#main #f #o_stab');return{txt:l.innerText.replace(/\s+/g,' ').trim(),fs:getComputedStyle(l).fontSize,sel:getComputedStyle(s).fontSize,base:getComputedStyle(document.documentElement).fontSize,gl:!!l.querySelector('.pl')};});
  rec('AF: OAC jako jeden czytelny napis (bez wtrąceń słowniczka), większa czcionka pól',/^skuteczna antykoagulacja ≥3 tyg\. ?DOAK przyjmowany regularnie lub warfaryna \/ acenokumarol z INR ≥2$/.test(af.txt)&&!af.gl&&parseFloat(af.fs)>=20&&parseFloat(af.sel)>=20,JSON.stringify(af));
  rec('Cała aplikacja: bazowa czcionka 17 px (ustawienie 16 + 1)',af.base==='17px',af.base);
  const ov=await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1);rec('1280 px: brak poziomego przewinięcia',ov);
  await page.setViewport({width:390,height:844});await sleep(500);
  const ov2=await page.evaluate(()=>({sw:document.getElementById('main').scrollWidth,cw:document.getElementById('main').clientWidth}));rec('390 px: sekcja AF mieści się w szerokości (bez poziomego przewinięcia #main)',ov2.sw<=ov2.cw+1,JSON.stringify(ov2));
  await page.setViewport({width:1280,height:900});
  rec('Brak błędów JS',errs.length===0,errs.join(' | '));
  await br.close();console.log(fail?`${n-fail}/${n} PASS, ${fail} FAIL`:`${n}/${n} PASS`);process.exit(fail?1:0);
})().catch(e=>{console.log('FAIL wyjątek '+e.message);process.exit(1);});
