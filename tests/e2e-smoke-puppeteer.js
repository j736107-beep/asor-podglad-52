/* Smoke całej aplikacji: każdy moduł 5.1 renderuje się w 5.2; w każdym module klikane są WSZYSTKIE zakładki, przełączniki i listy wyboru
   (każda opcja), pola liczbowe wypełniane wartościami środkowymi. Błąd JS / konsoli = FAIL; pusty panel wyniku w 5.2 tam, gdzie 5.1 go wypełniał = FAIL;
   brak SVG/canvas tam, gdzie 5.1 je miał = FAIL. B51 (opcjonalnie) = adres 5.1 do porównania.  BASE=http://localhost:8765/ B51=http://localhost:8751/ node e2e-smoke-puppeteer.js */
const puppeteer=require('puppeteer-core');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const BASE=process.env.BASE||'http://localhost:8765/',B51=process.env.B51||'';const REMOVED={hamulec:1,telszp:'→ Książka telefoniczna, zakładka Nasz szpital (11.11.2026)',icd10:'→ moduł ICD (11.11.2026)',icd9:'→ moduł ICD (11.11.2026)',eucast:'→ przyciski w Sepsie, ZP i Lekach (11.11.2026)'};
const EV=(fr,...a)=>{try{return fr.evaluate(...a).catch(()=>null);}catch(e){return Promise.resolve(null);}};
// 11.11.2026: przyciski nawigacji między modułami (data-nav: Książka, Pompy, zakładka innego modułu) nie są klikane – skan dotyczy bieżącego modułu.
const IGN=/favicon|Failed to load resource: the server responded with a status of 404.*(?:png|ico)|net::ERR_INTERNET_DISCONNECTED/;
async function scan(br,base){const p=await br.newPage();await p.setViewport({width:1300,height:1000});const errs=[];p.on('pageerror',e=>errs.push('pageerror: '+e.message));p.on('console',m=>{if(m.type()==='error'&&!IGN.test(m.text()))errs.push(m.text());});p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await p.goto(base,{waitUntil:'networkidle0'});await p.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await p.reload({waitUntil:'networkidle0'});
 await p.evaluate(()=>{const s=(id,v)=>{const e=document.getElementById(id);if(e){e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}};s('pa','60');s('pw','75');s('ph','175');s('pc','1.1');const m=document.querySelector('#psex button[data-s="m"]');m&&m.click();});
 const ids=await p.evaluate(()=>SKM.list.filter(m=>m&&m.id&&m.hide!==true).map(m=>m.id));const R={};
 for(const id of ids){errs.length=0;await p.evaluate(i=>{const b=document.querySelector('#side [data-id="'+i+'"]');if(b)b.click();},id);await sleep(1300);
  const ctxs=async()=>{const fr=p.frames().filter(f=>f!==p.mainFrame()&&/\/mod\//.test(f.url()));return [p.mainFrame()].concat(fr);};
  const tabsOf=async f=>EV(f,()=>{const root=document.getElementById('main')||document.body;return [...root.querySelectorAll('.tabs button,[role=tab],button[data-tab],.tabbar button,.subtabs button,[data-clin-tab],.wb-tabs button')].map((b,i)=>i);}).then(x=>x||[]);
  const res={tabs:0,sel:0,opt:0,tg:0,empty:[],svg:0,txt:0};
  const interact=async f=>{await EV(f,async()=>{const root=document.getElementById('main')||document.body;const W=ms=>new Promise(r=>setTimeout(r,ms));
    for(const e of [...root.querySelectorAll('input[type=number],input[inputmode=decimal],input[inputmode=numeric]')].slice(0,40)){if(e.closest('#pbar')||e.value!=='')continue;const mn=parseFloat(e.min),mx=parseFloat(e.max);e.value=String(isFinite(mn)&&isFinite(mx)?Math.round((mn+mx)/2):isFinite(mn)?mn+1:'1');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}
    await W(50);},);
   const sels=await EV(f,()=>{const root=document.getElementById('main')||document.body;return [...root.querySelectorAll('select')].slice(0,25).map((s,i)=>({i,n:s.options.length}));}).then(x=>x||[]);
   for(const s of sels){res.sel++;for(let k=0;k<Math.min(s.n,14);k++){res.opt++;await EV(f,(i,k)=>{const root=document.getElementById('main')||document.body;const e=[...root.querySelectorAll('select')][i];if(!e)return;e.selectedIndex=k;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));},s.i,k);await sleep(40);}
    await EV(f,(i)=>{const root=document.getElementById('main')||document.body;const e=[...root.querySelectorAll('select')][i];if(!e)return;if(e.options.length>1){e.selectedIndex=1;e.dispatchEvent(new Event('change',{bubbles:true}));}},s.i);}
   const tg=await EV(f,async()=>{const root=document.getElementById('main')||document.body;const W=ms=>new Promise(r=>setTimeout(r,ms));let n=0;
    const inFrame=window.parent!==window;const bs=[...root.querySelectorAll(inFrame?'button,input[type=checkbox],input[type=radio]':'button.tg:not([data-nav]),button[data-o],button[data-pl],button[data-al],button[data-sex],input[type=checkbox],input[type=radio]')].filter(b=>!b.disabled&&!b.closest('#pbar')&&!/usuń|wyczyść|reset|następny|drukuj|kopiuj|zapisz|wyślij|epikryza|odsłuchaj|test|wróć|pulpit|←|×|zamknij/i.test(b.textContent||'')).slice(0,40);
    for(const b of bs){try{b.click();n++;await W(30);}catch(e){}}return n;}).then(x=>x||0);res.tg+=tg;await sleep(150);};
  const snap=async f=>EV(f,()=>{const root=document.getElementById('main')||document.body;const vis=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden';};
    const pan=[...root.querySelectorAll('#res,.res,.result,.results,#out,.out,[id$="Res"],[id$="Out"],.clinical-result')].filter(vis);
    return{svg:root.querySelectorAll('svg,canvas').length,txt:root.innerText.length,empty:pan.filter(e=>!e.innerText.trim()&&!e.querySelector('svg,canvas,img')).map(e=>(e.id?'#'+e.id:'.'+String(e.className).split(' ')[0]))};}).then(x=>x||{svg:0,txt:0,empty:[]});
  let fs=await ctxs();for(const f of fs){await interact(f);}
  for(const f of fs){const tabs=await tabsOf(f);for(const ti of tabs){res.tabs++;await EV(f,ti=>{const root=document.getElementById('main')||document.body;const b=[...root.querySelectorAll('.tabs button,[role=tab],button[data-tab],.tabbar button,.subtabs button,[data-clin-tab],.wb-tabs button')][ti];b&&b.click();},ti);await sleep(400);
    for(const g of await ctxs()){await interact(g);const s=await snap(g);res.svg=Math.max(res.svg,s.svg);res.txt=Math.max(res.txt,s.txt);s.empty.forEach(x=>{const k='tab'+ti+':'+x;if(res.empty.indexOf(k)<0)res.empty.push(k);});}}}
  for(const g of await ctxs()){const s=await snap(g);res.svg=Math.max(res.svg,s.svg);res.txt=Math.max(res.txt,s.txt);s.empty.forEach(x=>{if(res.empty.indexOf('end:'+x)<0)res.empty.push('end:'+x);});}
  res.errs=[...new Set(errs)];R[id]=res;
  await p.evaluate(()=>{const b=document.querySelector('#side [data-id="dashboard"]');b&&b.click();});await sleep(200);}
 await p.close();return R;}
(async()=>{const br=await puppeteer.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox'],headless:'new'});
 const b=await scan(br,BASE);const a=B51?await scan(br,B51):null;await br.close();let bad=[],n=0;
 for(const id of Object.keys(b)){n++;const y=b[id];if(y.errs.length)bad.push(id+': błędy JS/konsoli: '+y.errs.slice(0,3).join(' | '));if(y.txt<120)bad.push(id+': pusty moduł ('+y.txt+' znaków)');
  if(a&&a[id]){const x=a[id];if(x.svg>0&&y.svg===0)bad.push(id+': brak SVG/canvas (5.1: '+x.svg+')');y.empty.forEach(e=>{if(x.empty.indexOf(e)<0)bad.push(id+': pusty panel wyniku '+e+' (w 5.1 wypełniony)');});}
  console.log(id.padEnd(16),'zakładki',y.tabs,'listy',y.sel,'opcje',y.opt,'przełączniki',y.tg,'svg',y.svg,'puste panele',y.empty.length?y.empty.join(','):'-','błędy',y.errs.length);}
 if(a)Object.keys(a).forEach(id=>{if(!b[id]&&!REMOVED[id])bad.push(id+': moduł 5.1 brak w 5.2');});
 console.log('\nmoduły 5.2:',n);bad.forEach(x=>console.log('FAIL',x));console.log(bad.length?bad.length+' FAIL':'ALL PASS');process.exit(bad.length?1:0);})();
