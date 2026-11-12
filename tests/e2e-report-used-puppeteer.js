// Raport zbiorczy – tylko użyte panele (fix15). BASE, SHOTS opcjonalne.
const pp=require('puppeteer-core'),fs=require('fs');
const BASE=process.env.BASE||'http://localhost:8765/',SHOTS=process.env.SHOTS||'';
const CLEAN="Przełyk bez zmian. Żołądek zapalny, podatny na insuflację, o sprawnej motoryce, jeziorko śluzowe skąpe, przezierne. Na kącie żołądka obecne owrzodzenie średnicy 2 cm pokryte włóknikiem, w centralnej części owrzodzenia widoczne sterczące, niekrwawiące naczynie (Forrest IIa), które skoagulowano w osłonie plazmy argonowej. W trakcie koagulacji obserwowano niewielkie krwawienie, które opanowano ostrzyknięciem owrzodzenia roztworem adrenaliny oraz ponowną koagulacją w osłonie plazmy argonowej. Na koniec zabiegu owrzodzenie pokryto proszkiem hemostatycznym; krwawienia nie obserwowano. W opuszce dwunastnicy widoczne kolejne owrzodzenie średnicy 1,5 cm pokryte włóknikiem (Forrest III). Część zstępująca dwunastnicy bez zmian.";
const UNUSED=/Anafilaksja|Sepsa(?![\s\S]*nie)|Zatrucia|Kwasica ketonowa|Zatorowość|Ostra niewydolność|Omdlenie|Troponina|Stan padaczkowy|Elektrolity SOR|Antykoagulacja|Transfuzjologia|Neuroinfekcje|Zapalenie płuc|Adrenalina 0,5 mg|qSOFA/;
const sleep=t=>new Promise(r=>setTimeout(r,t));
let n=0,fail=0;const rec=(name,ok,info)=>{n++;if(!ok)fail++;console.log((ok?'PASS ':'FAIL ')+name+(ok?'':' :: '+String(info||'').slice(0,400)));};
(async()=>{
  const br=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await br.newPage();
  await page.setViewport({width:1280,height:900});
  const errs=[];page.on('pageerror',e=>errs.push(e.message));
  async function fresh(){
    await page.goto(BASE+'?t='+Date.now(),{waitUntil:'networkidle2',timeout:60000});
    await page.evaluate(async()=>{
      try{if(navigator.serviceWorker){const rs=await navigator.serviceWorker.getRegistrations();for(const r of rs)await r.unregister();}const ks=await caches.keys();for(const k of ks)await caches.delete(k);}catch(e){}
      localStorage.clear();sessionStorage.clear();
    });
    await page.goto(BASE+'?t='+Date.now(),{waitUntil:'networkidle2',timeout:60000});
    await page.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(b=>/Rozumiem|Akceptuj/i.test(b.textContent));b&&b.click();});
    await page.evaluate(()=>{window.print=()=>{};});
    await sleep(400);
  }
  async function fillGI(){
    await page.evaluate(()=>SKS.goTab('gib','g'));
    await sleep(800);
    await page.evaluate(()=>{
      for(const [id,v] of [['urea','60'],['hb','9.5'],['sbp','100'],['hr','110']]){
        const i=document.querySelector('#main #'+id);
        if(i){i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}));}
      }
    });
    await sleep(300);
    await page.evaluate(()=>SKS.goTab('gib','v'));
    await sleep(800);
    await page.evaluate(t=>{
      const ta=document.querySelector('#main #gastro');
      if(!ta)return;
      ta.value=t;
      ta.dispatchEvent(new Event('input',{bubbles:true}));
      const b=document.querySelector('#main #gi-analizuj');
      if(b)b.click();
    },CLEAN);
    await sleep(1200);
  }
  async function fillDKA(){
    await page.evaluate(()=>SKS.show('dka'));
    await sleep(800);
    await page.evaluate(()=>{
      const set=(id,v)=>{const e=document.querySelector('#main #'+id);if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}};
      set('glu','450');set('ket','5');set('ph','7.1');set('hco3','10');
    });
    await sleep(600);
    await page.evaluate(()=>{if(window.SORReport)SORReport.capture(SKS.active());});
  }
  async function report(){
    return page.evaluate(()=>{
      if(window.SORReport&&SKS.active)SORReport.capture(SKS.active());
      document.getElementById('printAll').click();
      const a=document.getElementById('printArea');
      return {html:a?a.innerHTML:'',text:a?(a.textContent||a.innerText):'',used:SORReport.usedIds(),snaps:Object.keys(SORReport.snaps())};
    });
  }
  async function shot(name){
    if(!SHOTS)return;
    fs.mkdirSync(SHOTS,{recursive:true});
    await page.screenshot({path:SHOTS+'/'+name,fullPage:false});
  }

  // ---- 1. nic nie użyte ----
  await fresh();
  const empty=await report();
  rec('Nic nie użyte: krótka nota, bez paneli, bez „nie wpisano”',
    /Żaden panel nie został użyty/.test(empty.text)&&!/Forrest|Anafilaksja|Sepsa|Pantoprazol 80|nie wpisano|nie zaznaczono/.test(empty.text)&&empty.used.length===0,
    JSON.stringify({used:empty.used,t:empty.text.slice(0,350)}));

  // ---- 2. tylko GI ----
  await fresh();
  await fillGI();
  const gi=await report();
  const giOk=/Forrest IIa/.test(gi.text)&&(/Pantoprazol|wysokodawkowy|8 mg\/h/.test(gi.text))&&/Krwawienie z GI|górnego odcinka/.test(gi.text);
  const giOnly=giOk&&!/Anafilaksja/.test(gi.text)&&!/Kwasica ketonowa/.test(gi.text)&&!/Sepsa/.test(gi.text)&&!/Zatorowość/.test(gi.text)&&!/Troponina/.test(gi.text)&&!/Omdlenie SOR/.test(gi.text)&&!/Stan padaczkowy/.test(gi.text)&&!/Antykoagulacja/.test(gi.text)&&!/Zapalenie płuc/.test(gi.text);
  rec('Tylko panel krwawienia z GI (GBS + gastroskopia + Analizuj): raport zawiera wyłącznie ten panel',
    giOnly&&gi.used.indexOf('gib')>=0&&gi.used.every(x=>x==='gib'||x==='pompy'),
    JSON.stringify({used:gi.used,snaps:gi.snaps,hasForrest:/Forrest IIa/.test(gi.text),slice:gi.text.slice(0,400)}));
  if(SHOTS){
    await page.evaluate(()=>{
      const pa=document.getElementById('printArea');
      if(pa){pa.style.position='fixed';pa.style.left='0';pa.style.top='0';pa.style.width='800px';pa.style.height='auto';pa.style.maxHeight='100vh';pa.style.overflow='auto';pa.style.zIndex='99999';pa.style.background='#fff';pa.style.padding='16px';}
    });
    await sleep(200);
    await shot('e2e-gi-only-report.png');
  }

  // ---- 3. dwa panele ----
  await fillDKA();
  const two=await report();
  rec('Dwa panele (GI + DKA): oba w raporcie, bez trzeciego nieużytego',
    /Forrest IIa/.test(two.text)&&(/Glukoza|450|keton|DKA|HHS/i.test(two.text))&&!/Anafilaksja/.test(two.text)&&!/Sepsa/.test(two.text)&&two.used.indexOf('gib')>=0&&two.used.indexOf('dka')>=0,
    JSON.stringify({used:two.used,slice:two.text.slice(0,500)}));

  // ---- 4. Następny pacjent czyści ----
  await page.evaluate(()=>{
    window.confirm=()=>true;
    const loc=window.location;
    try{Object.defineProperty(loc,'reload',{configurable:true,value:function(){window.__reloaded=1;}});}catch(e){window.__reloadStub=true;}
    SKS.wipe();
  });
  await sleep(300);
  await page.reload({waitUntil:'networkidle2'});
  await page.evaluate(()=>{window.print=()=>{};const b=[...document.querySelectorAll('button')].find(b=>/Rozumiem|Akceptuj/i.test(b.textContent));b&&b.click();});
  await sleep(400);
  const after=await report();
  rec('Po „Następny pacjent” raport znów pusty (bez GI, bez DKA)',
    /Żaden panel nie został użyty/.test(after.text)&&!/Forrest/.test(after.text)&&!/450/.test(after.text)&&after.used.length===0,
    JSON.stringify({used:after.used,t:after.text.slice(0,350)}));

  rec('Brak błędów JS',!errs.length,errs.join(' | '));
  await br.close();
  console.log((n-fail)+'/'+n+(fail?' FAIL':' PASS'));
  process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
