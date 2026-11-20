// fix23: wydruk Neurologia / Omdlenie – tylko wypełnione pozycje, dawki z silników, skale z kompletu, WNIOSKI (Troponina: e2e-ozw-wydruk + e2e-wydruk23)
global.window=global.window||{};
const TP=require('../calc/tab-print.js'),N=require('../calc/neuro.js'),DM=require('../calc/dementiaB2.js');
const R=require('../mod/omdlenie/rules.json'),E=require('../mod/omdlenie/engine.js'),OP=require('../mod/omdlenie/print.js');
let n=0,f=0;const ok=(name,c,info)=>{n++;if(!c)f++;console.log((c?'PASS ':'FAIL ')+name+(c?'':' :: '+String(info||'').slice(0,600)));};
const JUNK=/Źródł|Wytyczne i ChPL|ChPL 4\.2|undefined|NaN|null|\[object|Nie wpisano|zatwierdzony przez lekarza|CMAJ|Hemphill|Teasdale/;
const X=(o,x)=>Object.assign({g:id=>o[id],touched:Object.keys(o).length,fields:Object.keys(o).map(k=>({id:k,label:k,type:typeof o[k]==='boolean'?'chk':'val',val:String(o[k]),unit:''}))},x||{});
const NP=(tabs,P,o)=>TP.neuro(Object.assign({N,DM,tabs,P:P||{w:80,age:70,sex:'m'},gl:x=>String(x).replace('.',',')+' mmol/l'},o||{}));
// ---- Neurologia ----
let r=NP({t:X({h:2,sbp:170,dbp:95,glu:6.5,inr:1.1,plt:220})});
ok('NEU-1 alteplaza 80 kg: 72 mg = 72 ml, bolus 7,2 ml, 64,8 ml w 60 min = 64,8 ml/h; tenekteplaza 22,5 mg = 4,5 ml',/łącznie 72 mg = 72 ml; bolus 10%: 7,2 ml i\.v\. w 1 min; reszta 64,8 ml w 60 min = 64,8 ml\/h/.test(r.text)&&/22,5 mg = 4,5 ml/.test(r.text)&&/1 mg\/ml/.test(r.text)&&r.dose,r.text);
ok('NEU-2 bez nadmiaru, WNIOSKI',/WNIOSKI:/.test(r.text)&&!JUNK.test(r.text),r.text.match(JUNK)||r.text);
r=NP({t:X({h:2,a_ich:true})});ok('NEU-3 zaznaczone przeciwwskazanie → brak dawek, wypisane przeciwwskazanie',!/Alteplaza \(/.test(r.text)&&/PRZECIWWSKAZANIA/.test(r.text)&&!r.dose,r.text);
r=NP({t:X({},{print:true,current:true})});ok('NEU-4 Drukuj bez czasu zachorowania → bez dawek',!/72 mg/.test(r.text)&&/czas zachorowania/.test(r.text),r.text);
r=NP({t:X({h:2})},{age:70});ok('NEU-5 brak masy → nie wyliczono',/brak masy ciała/.test(r.text)&&!r.dose,r.text);
r=NP({i:X({gcs:10,vol:35,ivh:true})},{w:80,sex:'m'});ok('NEU-6 ICH bez wieku → bez ICH score (skala tylko z kompletu)',!/ICH score/.test(r.text)&&/Objętość krwiaka: 35 ml/.test(r.text),r.text);
r=NP({i:X({gcs:10,vol:35,ivh:true,ac:true})});ok('NEU-7 ICH score 3/6 z kompletu + odwrócenie antykoagulacji',/ICH score: 3 \/ 6/.test(r.text)&&/odwrócenie antykoagulacji/.test(r.text),r.text);
r=NP({a:X({h:2,foc:true,aph:true,nih:8})});ok('NEU-8 algorytm: KOD UDAROWY we WNIOSKACH, bez imienia/przyjęcia',/KOD UDAROWY/.test(r.text)&&!/pname|adm/.test(r.text),r.text);
r=NP({a:X({pname:'Jan Kowalski',adm:'2026-11-20 10:00'})});ok('NEU-9 imię i godzina przyjęcia nie trafiają do wydruku',!/Kowalski|2026-11-20/.test(r.text),r.text);
r=NP({p:X({sbp:150,dbp:90,dur:70,clin:'w',dm:true})},{w:80,age:65});ok('NEU-10 ABCD² 7/7 z kompletu',/ABCD²: 7 \/ 7/.test(r.text),r.text);
r=NP({p:X({sbp:150})},{w:80});ok('NEU-11 ABCD² niekompletne → brak wyniku',!/ABCD²/.test(r.text),r.text);
r=NP({n:X({n1a:'1',n5a:'2'})});ok('NEU-12 NIHSS tylko pozycje >0',/NIHSS/.test(r.text)&&/Wynik: 3 \/ 42/.test(r.text),r.text);
// ---- Omdlenie ----
const LAB={red:['CZERWONE','SZPITAL — bezwzględnie zostań w szpitalu'],yellow:['ŻÓŁTE','UZUPEŁNIJ DANE'],green:['ZIELONE','DOM / diagnostyka ambulatoryjna']};
const all=(yes)=>{const a={};R.groups.forEach(g=>g.items.forEach(it=>{a[it.code]=it.type==='incl'?'yes':'no'}));(yes||[]).forEach(c=>a[c]=c.startsWith('!')?undefined:'yes');return a;};
let o=OP.build(R,E,{answers:{}},{LAB});ok('OMD-1 brak odpowiedzi → pusty, nie użyto',o.text===''&&!o.used);
const gm=R.groups.find(g=>g.id==='G').items.find(i=>i.type==='major');
o=OP.build(R,E,{answers:all([gm.code]),troponin:'neg',dx:'other'},{LAB});
ok('OMD-2 cecha DUŻA EKG → CZERWONE, powód, WNIOSKI hospitalizacja; NIE nie drukowane',/Wynik: CZERWONE/.test(o.text)&&o.text.includes(gm.code)&&/HOSPITALIZACJA|hospitalizacja/.test(o.text)&&!/– NIE/.test(o.text)&&o.used,o.text);
ok('OMD-3 bez nadmiaru (źródła, tabele)',!JUNK.test(o.text)&&!/ESC Tab\. 7 — przyjęcie/.test(o.text),o.text.match(JUNK)||o.text);
o=OP.build(R,E,{answers:{'K-1':'yes'}},{LAB});ok('OMD-4 niepełne → ocena niepełna, brak CSRS',/Ocena niepełna/.test(o.text)&&!/Canadian/.test(o.text)&&!o.used,o.text);
ok('OMD-5 jedna odpowiedź + Drukuj = użycie',OP.build(R,E,{answers:{'K-1':'yes'}},{LAB,print:true}).used);
console.log(f?`${n-f}/${n} PASS, ${f} FAIL`:`${n}/${n} PASS`);process.exit(f?1:0);
