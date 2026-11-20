// fix20: wydruk ONS / PZP / Zatrucia – tylko wypełnione pozycje, wyliczone dawki i pompy, skale z kompletu, WNIOSKI
const B=require('../calc/clin-print.js'),E=require('../calc/clinical.js'),C=require('../calc/etapC.js'),M=require('../calc/mushB2.js');
let n=0,f=0;const ok=(name,c,info)=>{n++;if(!c)f++;console.log((c?'PASS ':'FAIL ')+name+(c?'':' :: '+String(info||'').slice(0,600)));};
const T=(o,touched,x)=>Object.assign({g:id=>o[id],touched:touched==null?Object.keys(o).filter(k=>k!=='review').length:touched,current:false,printed:false},x||{});
const JUNK=/Nie wpisano|Źródła|ChPL \(Charakterystyka|undefined|NaN|null|\[object/;
// ---- ONS ----
let r=B.ahf({P:{w:80},tabs:{assessment:T({sbp:150,sat:95,rr:22,congest:true,naive:true,ntg:20,pde:false,hypo:false})}});
ok('ONS-1 NTG 20 µg/min → 1,2 ml/h, 50 mg / 50 ml, 1 mg/ml',/50 mg leku w objętości końcowej 50 ml \(stężenie 1 mg\/ml = 1000 µg\/ml\); dawka 20 µg\/min → 1,2 ml\/h/.test(r.text),r.text);
ok('ONS-2 furosemid 20–40 mg i.v. + kontrola',/Furosemid i\.v\.: 20–40 mg i\.v\./.test(r.text)&&/Kontrola po diuretyku/.test(r.text),r.text);
ok('ONS-3 udokumentowane NIE (PDE-5) drukowane, inne NIE (hipoperfuzja) nie',/bez PDE-5/.test(r.text)&&!/hipoperfuzj/.test(r.text),r.text);
ok('ONS-4 WNIOSKI bez hospitalizacji bezwzględnej, dose=true, bez śmieci',r.dose&&/WNIOSKI:/.test(r.text)&&!/HOSPITALIZACJA BEZWZGLĘDNA/.test(r.text)&&!JUNK.test(r.text),r.text);
r=B.ahf({P:{w:80},tabs:{assessment:T({sbp:85,sat:88,ntg:20,pde:false})}});
ok('ONS-5 SBP 85 + SpO₂ 88 → HOSPITALIZACJA, NTG nie wyliczona, wsparcie oddechu',/HOSPITALIZACJA BEZWZGLĘDNA – hipotensja, hipoksemia/.test(r.text)&&/nie wyliczono – wymagane SBP >110/.test(r.text)&&!/ml\/h/.test(r.text)&&/Wsparcie oddechu/.test(r.text),r.text);
r=B.ahf({P:{w:80},tabs:{assessment:T({},0,{current:true})}});
ok('ONS-6 pusta zakładka → pusty wydruk',r.text==='',r.text);
// ---- PZP ----
const cap0={rr:24,sbp:125,dbp:75,hr:98,temp:38.6,spo2:93,confusion:false,urea:5};
r=B.cap({E,P:{age:70,sex:'M'},tabs:{scores:T(cap0)}});
ok('PZP-1 CURB-65 z kompletu 1/5 (wiek)',/CURB-65: 1\/5 \(/.test(r.text)&&/≥65/.test(r.text),r.text);
ok('PZP-2 parametry, bez NIE (splątanie)',/oddechy 24\/min, RR 125\/75 mmHg, HR 98\/min, temp\. 38,6 °C, SpO₂ 93%/.test(r.text)&&!/splątanie/.test(r.text),r.text);
ok('PZP-3 WNIOSKI: rekomendacja programu + wybór lekarza; sub antybiotykoterapii',/WNIOSKI:/.test(r.text)&&/Rekomendacja programu: /.test(r.text)&&/Lekarz zawsze wybiera/.test(r.text)&&r.subAuto===true&&/antybiotykoterapia/.test(r.subName),r.text);
r=B.cap({E,P:{age:70},tabs:{scores:T({rr:24,spo2:93})}});
ok('PZP-4 niepełne CURB-65 → brak skali CURB-65 i PSI',!/CURB-65: \d/.test(r.text)&&!/PSI \/ PORT/.test(r.text)&&!JUNK.test(r.text),r.text);
r=B.cap({E,P:{},tabs:{scores:T({},0,{current:true})},abx:()=>'X'});
ok('PZP-5 pusta ocena → brak tekstu oceny, sub z silnika przekazany',r.text===''&&r.sub==='X',r.text);
// ---- Zatrucia ----
r=B.tox({E,C,M,P:{w:80},tabs:{antidote:T({stage:'loading',final:100,diluent:'NaCl 0,9%'},0,{printed:true})}});
ok('TOX-1 fomepizol 80 kg: 1 200 mg, 1,2 ml + 100 ml → 101,2 ml, 11,86 mg/ml, 202,4 ml/h',/= 1 200 mg/.test(r.text)&&/1,2 ml leku \+ 100 ml NaCl 0,9% → objętość końcowa 101,2 ml; stężenie 11,86 mg\/ml/.test(r.text)&&/202,4 ml\/h/.test(r.text),r.text);
ok('TOX-2 fomepizol: status bez ChPL, telefon toksykologiczny, dose',r.dose&&/bez polskiej ChPL/.test(r.text)&&/12 411 99 99/.test(r.text),r.text);
r=B.tox({E,C,M,P:{w:80},tabs:{para:T({mg:12000,hrs:2})}});
ok('TOX-3 paracetamol: 3 worki NAC 12 000 / 4 000 / 8 000 mg',/12 000 mg \(150 mg\/kg\)/.test(r.text)&&/4 000 mg/.test(r.text)&&/8 000 mg/.test(r.text)&&/ml\/h/.test(r.text),r.text);
ok('TOX-4 paracetamol: WNIOSKI NAC w szpitalu, bez nieprzyjętych pozycji',/NAC i\.v\. wskazany/.test(r.text)&&!/czas nieznany|rozłożone/.test(r.text)&&!JUNK.test(r.text),r.text);
r=B.tox({E,C,M,P:{w:80},tabs:{ethanol:T({gcs:14,ethanol:250,ethanolUnit:'mgdl',trauma:false})}});
ok('TOX-5 etanol 250 mg/dl = 54,3 mmol/l, obserwacja, bez NIE (uraz)',/250 mg\/dl \(= 54,3 mmol\/l\)/.test(r.text)&&/Obserwacja w SOR/.test(r.text)&&!/uraz głowy/.test(r.text),r.text);
r=B.tox({E,C,M,P:{w:80},tabs:{ethanol:T({gcs:7})}});
ok('TOX-6 GCS 7 → HOSPITALIZACJA BEZWZGLĘDNA',/HOSPITALIZACJA BEZWZGLĘDNA/.test(r.text),r.text);
r=B.tox({E,C,M,P:{w:80},tabs:{antidote:T({stage:'loading',final:100},0,{current:false}),para:T({},0)}});
ok('TOX-7 nic nie wypełnione / zakładka tylko przeglądana → pusty wydruk',r.text===''&&!r.dose,r.text);
r=B.tox({E,C,M,P:{w:80},tabs:{mushrooms:T({syn:'amatoksyny',suspect:true,latency:8})}});
ok('TOX-8 amatoksyny: dawki NAC pomostowe w g, konsultacja tox',/NAC i\.v\. – schemat pomostowy \(masa 80 kg\)/.test(r.text)&&/ g w /.test(r.text)&&/12 411 99 99/.test(r.text),r.text);
console.log(`${n-f}/${n} ${f?'FAIL':'PASS'}`);process.exit(f?1:0);
