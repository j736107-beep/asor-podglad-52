// fix24: UFH – jedna konwencja (ZP, Antykoagulacja, Pompy) na ekranie i wydruku; KKCz – jeden przelicznik w obu zakładkach Transfuzjologii – tylko wypełnione pozycje, dawki/pompy, WNIOSKI; raport zbiorczy; Następny pacjent; samo przeglądanie nie dodaje modułu. BASE opcjonalne.
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
  const STD='zlecono 18 j./kg/h = 1 440 j./h; nastawa pompy 2,9 ml/h = 1 450 j./h (faktycznie podawane)';
  const scr=sel=>page.evaluate(s=>{const e=document.querySelector(s);return e?e.textContent.replace(/\s+/g,' ').trim():'';},sel);
  const setC=o=>page.evaluate(o=>{for(const [id,v] of Object.entries(o)){const e=document.querySelector('#main .clinical-form #'+id);if(!e)throw Error('brak '+id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));}},o);
  // ZP – ekran i wydruk
  await fresh();await setP({pw:'80',pa:'60'});await tab('pe','ufh');await sleep(300);
  const zs=await scr('#ufhSet');rec('ZP ekran: '+STD,zs===STD,zs);
  let t=await printMod();const zl=(t.match(/Wlew: [^\n]*/)||[''])[0];rec('ZP wydruk: Wlew: '+STD,zl==='Wlew: '+STD,t);
  // Antykoagulacja – ekran i wydruk
  await fresh();await setP({pw:'80',pa:'60'});await tab('acoag','ufh');
  const as=await scr('#ufhSet');rec('Antykoagulacja ekran: identyczny tekst jak ZP',as===zs&&as===STD,as);
  t=await printMod();const al=(t.match(/Wlew: [^\n]*/)||[''])[0];rec('Antykoagulacja wydruk: identyczny wiersz jak ZP',al===zl,al+' | '+zl);
  // Pompy – heparyna: wlew i nomogram
  await fresh();await setP({pw:'80'});await page.evaluate(()=>SKS.show('pompy'));await sleep(1200);
  let fr=page.frames().find(f=>/mod\/pompy/.test(f.url()));await fr.evaluate(()=>{location.hash='d/heparyna';});await sleep(900);
  await fr.evaluate(()=>{const w=document.getElementById('hw');w.value='80';w.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(300);
  const ph=await fr.evaluate(()=>document.getElementById('hiu').textContent.replace(/\s+/g,' ').trim());rec('Pompy – heparyna: '+STD,ph===STD,ph);
  await fr.evaluate(()=>{const a=document.getElementById('hap');a.value='40';a.dispatchEvent(new Event('input',{bubbles:true}));});await sleep(300);
  const pn=await fr.evaluate(()=>document.getElementById('hanew').textContent.replace(/\s+/g,' ').trim());rec('Pompy – nomogram APTT 40 s (+2 j./kg/h): zlecono 20 j./kg/h = 1 600 j./h; nastawa 3,2 ml/h = 1 600 j./h',pn==='zlecono 20 j./kg/h = 1 600 j./h; nastawa pompy 3,2 ml/h = 1 600 j./h (faktycznie podawane)',pn);
  // Transfuzjologia – KKCz w obu zakładkach
  await fresh();await setP({pw:'80',pa:'60'});await tab('transf','d');for(const [k,v] of [['hb','6.5'],['hbt','9']]){await setF({[k]:v});await sleep(250);}
  const d1=await scr('#rbcConv'),s1=await scr('#rbcStr'),u1=await scr('#rbcU');
  await tab('transf','rbc');await setF({kind:'chronic'});await sleep(250);await setF({hb:'6.5'});await sleep(300);
  const d2=await scr('#rbcConv2'),s2=await scr('#rbcStr2');
  rec('KKCz ekran: Dawki 3 j.; ten sam przelicznik (320 ml na 1 g/dl, ≈0,88 g/dl/j., RCKiK, adnotacja 70 kg) w obu zakładkach',u1==='3 j. KKCz'&&d1&&d1===d2&&/320 ml na 1 g\/dl/.test(d1)&&/0,88 g\/dl na jednostkę/.test(d1)&&/RCKiK/.test(d1)&&/ok\. 70 kg/.test(d1),JSON.stringify({u1,d1,d2}));
  rec('KKCz ekran: strategia restrykcyjna w obu zakładkach',/Przetaczaj po 1 jednostce, kontrola Hb przed kolejną \(strategia restrykcyjna\)/.test(s1)&&s1===s2,s1+' | '+s2);
  t=await printMod();const pl=t.match(/Przelicznik: [^\n]*/g)||[];
  rec('KKCz wydruk: jeden przelicznik w obu zakładkach + strategia',pl.length===2&&pl[0]===pl[1]&&(t.match(/Strategia: Przetaczaj po 1 jednostce/g)||[]).length===2&&!/oceniaj|g\/dl\/j\./.test(t),t);
  rec('Brak błędów JS',errs.length===0,errs.join(' | '));
  await br.close();console.log(fail?`${n-fail}/${n} PASS, ${fail} FAIL`:`${n}/${n} PASS`);process.exit(fail?1:0);
})().catch(e=>{console.log('FAIL wyjątek '+e.message);process.exit(1);});
