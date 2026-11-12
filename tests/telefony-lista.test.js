// Książka telefoniczna – lista 12.11.2026 (PSZS Nowy Targ). node tests/telefony-lista.test.js
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const D=JSON.parse(fs.readFileSync(path.join(root,'data/telefony.json'),'utf8'));
const js=fs.readFileSync(path.join(root,'data/telefony.js'),'utf8');
let pass=0,fail=0;
function t(id,fn){let m;try{m=fn();}catch(e){m=e.stack||e;}if(m===true){pass++;console.log('PASS '+id);}else{fail++;console.log('FAIL '+id+' — '+String(m).slice(0,400));}}
function valid(n){var d=String(n.nr).replace(/\D/g,'');if(n.typ==='alarm')return /^(112|999)$/.test(d);if(n.typ==='wew'){var c=n.centrala?String(n.centrala).replace(/\D/g,''):'';return (d.length===4||d.length===3||(d.length===2&&c.length===9))&&(!c||c.length===9);}return d.length===9;}
function allN(){const a=[];D.grupy.forEach(g=>g.pozycje.forEach(p=>p.numery.forEach(n=>a.push({g:g.id,m:g.modul,p:p.nazwa,n}))));return a;}
const N=allN();
const nrs=new Set(N.map(x=>x.n.nr));
const blob=JSON.stringify(D);
const szp=N.filter(x=>x.m==='szpital');

t('TL-1 JSON i JS zsynchronizowane, wersja 2026-11-12',()=>{
  const m=js.match(/window\.SORTelefony=([\s\S]*)/);
  if(!m)return 'brak window.SORTelefony';
  const J=JSON.parse(m[1].trim().replace(/;+\s*$/,''));
  return J.wersja===D.wersja&&D.wersja==='2026-11-12'&&JSON.stringify(J.grupy)===JSON.stringify(D.grupy)?true:[J.wersja,D.wersja].join(' ');
});
t('TL-2 wszystkie numery przechodzą valid(), wew. 2-cyfrowe tylko z centralą 9-cyfrową',()=>{
  const bad=N.filter(x=>!valid(x.n));
  return bad.length===0?true:JSON.stringify(bad.slice(0,5));
});
t('TL-3 brak kodów PIN i PUK w JSON i JS',()=>{
  return !/PIN|PUK/.test(blob)&&!/PIN|PUK/.test(js)?true:'wyciek';
});
t('TL-4 PSSE Nowy Targ 18 266 29 14 nadal w książce, z adresem',()=>{
  const san=D.grupy.find(g=>g.id==='sanepid');
  const p=san&&san.pozycje[0];
  const has=p&&p.numery.some(n=>n.nr==='182662914')&&p.numery.some(n=>n.nr==='182663165');
  return has&&/Jana Kazimierza 6/.test(p.adres||'')?true:JSON.stringify(p&&{adres:p.adres,nrs:p.numery.map(n=>n.nr)});
});
t('TL-5 nowe wewnętrzne SOR/OIT/kardio/portier/apteka z aktualnej listy',()=>{
  const need=['3200','3210','3202','3201','3104','3230','3231','3232','3233','3234','573900862','503735714','503736372','519091100','519097100','122633000','3087','503735942','503735978','503453860','3370','3270','664775084'];
  const miss=need.filter(x=>!nrs.has(x));
  const inSzp=need.filter(x=>szp.some(s=>s.n.nr===x));
  return miss.length===0&&inSzp.length===need.length?true:'brak '+miss.join(',')+' szp='+inSzp.length;
});
t('TL-6 służby: policja, WCZK, WKRM, OCD',()=>{
  const need=['478346400','478346402','478346750','478346700','478347400','123921300','123921115','123921100','123921109','123921909','519097106','519097107','519097108','519097109'];
  const miss=need.filter(x=>!nrs.has(x));
  return miss.length===0?true:'brak '+miss.join(',');
});
t('TL-7 usunięte nieaktualne numery wewnętrzne (nie ma ich na nowej liście)',()=>{
  // 182633000 = stara centrala (zastąpiona 12 263 30 00 do potwierdzenia)
  const gone=['504162321','690536728','606968616','517097100','182633000','182633154','790666163','182633600','182633601','182633954','888390673','797488253','781447767','733887052','182611788','503736186','519097103','601510540'];
  const still=gone.filter(x=>nrs.has(x));
  return still.length===0?true:'nadal są: '+still.join(',');
});
t('TL-8 TRANSPORT 32-10 nie wpisany (kolizja z TRIAGE 3210); 3210 tylko jako triage',()=>{
  const t3210=szp.filter(x=>x.n.nr==='3210');
  return t3210.length===1&&/triage/i.test(t3210[0].n.opis||'')&&t3210[0].p.toLowerCase().includes('triage')?true:JSON.stringify(t3210);
});
t('TL-9 rozbieżność kardiologii 091 vs 097: oba numery, do potwierdzenia / rozb',()=>{
  const a=szp.find(x=>x.n.nr==='519091100'),b=szp.find(x=>x.n.nr==='519097100');
  return a&&b&&a.n.st==='rozb'&&b.n.st==='rozb'&&/do potwierdzenia/.test(a.n.uwaga||'')&&/do potwierdzenia/.test(b.n.uwaga||'')?true:'flags';
});
t('TL-10 portier 12 263 30 00 oznaczony do potwierdzenia (kierunkowy 12)',()=>{
  const p=szp.find(x=>x.n.nr==='122633000');
  return p&&!p.n.st&&/do potwierdzenia/.test(p.n.uwaga||'')?true:JSON.stringify(p&&p.n);
});
t('TL-11 PERT: dotychczasowy numer zachowany, do potwierdzenia',()=>{
  const g=D.grupy.find(g=>g.id==='pert');
  const n=g&&g.pozycje[0]&&g.pozycje[0].numery[0];
  return n&&n.nr==='505015173'&&/do potwierdzenia/.test(n.uwaga||'')?true:JSON.stringify(n);
});
t('TL-12 numery zewnętrzne spoza nowej listy zachowane (toksykologia 12 411 99 99, Nowy Sącz OIOM 18 442 58 02)',()=>{
  return nrs.has('124119999')&&nrs.has('184425802')&&nrs.has('124003614')?true:'utracono zewnętrzne';
});
t('TL-13 pełne numery (9 cyfr, nie fax) mają linkowalny typ tel; wew. bez centrali to 3–4 cyfry',()=>{
  const bad=N.filter(x=>{
    if(x.n.typ==='fax'||x.n.typ==='alarm')return false;
    const d=String(x.n.nr).replace(/\D/g,'');
    if(d.length===9)return x.n.typ!=='tel';
    return x.n.typ!=='wew';
  });
  return bad.length===0?true:JSON.stringify(bad.slice(0,5));
});
t('TL-14 Zakopane OIOM: wew. 110 jest, ucięty komórkowy nie został wymyślony',()=>{
  const o=D.grupy.find(g=>g.id==='oiomm').pozycje.find(p=>/Zakopane/.test(p.nazwa));
  return o&&o.numery.some(n=>n.nr==='110')&&o.numery.length===1?true:JSON.stringify(o);
});
console.log(pass+'/'+(pass+fail)+(fail?' FAIL':' PASS'));
process.exit(fail?1:0);
