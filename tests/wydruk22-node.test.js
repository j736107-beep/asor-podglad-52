// fix22: wydruk Antykoagulacja / Anafilaksja / Transfuzjologia – tylko wypełnione pozycje, dawki i pompy z silników, WNIOSKI
global.window=global.window||{};
const TP=require('../calc/tab-print.js'),A=require('../calc/acoag.js'),AB=require('../calc/acoagB1.js'),B=require('../calc/batch3.js'),T=require('../calc/transf.js'),TB=require('../calc/transfB1.js');
let n=0,f=0;const ok=(name,c,info)=>{n++;if(!c)f++;console.log((c?'PASS ':'FAIL ')+name+(c?'':' :: '+String(info||'').slice(0,600)));};
const JUNK=/Źródł|Wytyczne i ChPL|ChPL 4\.2|Efekt:|undefined|NaN|null|\[object|Nie wpisano|zatwierdzony przez lekarza|Progi Hb|Progi PLT/;
const X=(o,x)=>Object.assign({g:id=>o[id],touched:Object.keys(o).length,fields:Object.keys(o).map(k=>({id:k,label:k,type:typeof o[k]==='boolean'?'chk':'val',val:o[k],unit:''}))},x||{});
const C=(tabs,P,o)=>Object.assign({tabs,P:P||{w:80,age:60,sex:'m'}},o||{});
// ---- Antykoagulacja ----
let r=TP.acoag(C({ufh:X({},{print:true,current:true})},null,{A,AB,print:true}));
ok('ACO-1 UFH z masy (Drukuj): bolus j. = ml, wlew j./h = ml/h, pompa 25 000 j. + 45 ml → 50 ml, 500 j./ml, aPTT',/Bolus: \d[\d ]* j\. i\.v\. = [\d,]+ ml \(5000 j\.\/ml\)/.test(r.text)&&/Wlew: zlecono 18 j\.\/kg\/h = 1 440 j\.\/h; nastawa pompy 2,9 ml\/h = 1 450 j\.\/h \(faktycznie podawane\)/.test(r.text)&&/25 000 j\. \(5 ml\) \+ 45 ml NaCl 0,9% → objętość końcowa 50 ml; stężenie 500 j\.\/ml/.test(r.text)&&/aPTT po 6 h/.test(r.text)&&r.dose,r.text);
ok('ACO-2 bez nadmiaru, WNIOSKI',/WNIOSKI:/.test(r.text)&&!JUNK.test(r.text),r.text.match(JUNK)||r.text);
r=TP.acoag(C({ufh:X({})},null,{A,AB}));ok('ACO-3 samo przeglądanie zakładki → pusty wydruk',r.text==='',r.text);
r=TP.acoag(C({vka:X({inr:4.5,bleed:true})},null,{A,AB}));
ok('ACO-4 VKA: witamina K 10 mg + 4F-PCC j. = ml',/Witamina K: 10 mg i\.v\./.test(r.text)&&/4F-PCC \(Beriplex, 25 j\.\/ml\): [\d ]+ j\. = \d+ ml/.test(r.text)&&/Odwrócenie VKA/.test(r.text),r.text);
r=TP.acoag(C({vka:X({inr:2.5})},null,{A,AB}));ok('ACO-5 VKA bez krwawienia → tylko INR, bez dawek PCC',/INR: 2,5/.test(r.text)&&!/PCC|Witamina/.test(r.text),r.text);
r=TP.acoag(C({noac:X({nb:true,api:true,ld:5,hr:3})},null,{A,AB}));ok('ACO-6 NOAC apiksaban: andeksanet + PCC 50 j./kg',/Andeksanet/.test(r.text)&&/PCC – gdy brak andeksanetu: 4 000 j\./.test(r.text),r.text);
r=TP.acoag(C({prot:X({rate:1250,run:5})},null,{A,AB}));ok('ACO-7 protamina na UFH: mg = ml (10 mg/ml)',/Protamina na UFH: .* mg = .* ml \(10 mg\/ml\)/.test(r.text)&&r.dose,r.text);
r=TP.acoag(C({enox:X({proph:false},{print:true,current:true})},{w:80,age:60,sex:'m',crcl:90},{A,AB,print:true}));ok('ACO-8 enoksaparyna 80 mg s.c. co 12 h = 0,8 ml',/80 mg s\.c\. .* = 0,8 ml/.test(r.text),r.text);
// ---- Anafilaksja ----
r=TP.ana(C({a:X({refr:true,hypo:true})},null,{B}));
ok('ANA-1 adrenalina 0,5 mg = 0,5 ml i.m.; wlew 20–40 ml/h z przygotowaniem; noradrenalina 3 ml/h',/Adrenalina i\.m\. \(1 mg\/ml\): 0,5 mg = 0,5 ml i\.m\./.test(r.text)&&/1 ml adrenaliny 1 mg\/ml \+ 49 ml NaCl 0,9% w strzykawce 50 ml → 20–40 ml\/h/.test(r.text)&&/0,05 µg\/kg\/min = 4 µg\/min = 3 ml\/h/.test(r.text)&&/anestezjolog, OIT/.test(r.text),r.text);
ok('ANA-2 bez nadmiaru; tylko jedna receptura wlewu',!JUNK.test(r.text)&&!/100 µg\/ml|10 µg\/ml/.test(r.text),r.text.match(JUNK)||r.text);
r=TP.ana(C({obs:X({doses:2})},null,{B}));ok('ANA-3 obserwacja ≥6 h (2 dawki)',/Obserwacja ≥ 6 h/.test(r.text),r.text);
r=TP.ana(C({obs:X({sev:true})},null,{B}));ok('ANA-4 ciężka reakcja → wynik zgodny z silnikiem',r.text.length>0&&/WNIOSKI/.test(r.text),r.text);
ok('ANA-5 brak danych → pusty',TP.ana(C({a:X({})},null,{B})).text==='');
// ---- Transfuzjologia ----
r=TP.transf(C({g:X({abo:'A',rh:'-'})},{w:70,age:30,sex:'f'},{T,TB,A}));ok('TR-1 A RhD− kobieta 30 l.: KKCz A, 0 tylko RhD−',/KKCz: A, 0 · RhD− \(kobieta <50 lat: wyłącznie RhD−\)/.test(r.text)&&!r.dose,r.text);
r=TP.transf(C({g:X({})},{w:70,age:30,sex:'f'},{T,TB,A}));ok('TR-2 grupa nieznana → tryb ratunkowy 0 RhD−',r.text===''||/0 RhD−/.test(r.text),r.text);
r=TP.transf(C({d:X({hb:6.5,hbt:9,coag:true,fib:1.0,plt:8})},null,{T,TB,A}));
ok('TR-3 KKCz 3 j., FFP 1 200 ml, fibrynogen 2–4 g, KKP 1 dawka',/3 j\. KKCz/.test(r.text)&&/1 200 ml \(15 ml\/kg × 80 kg\)/.test(r.text)&&/2–4 g/.test(r.text)&&/1 dawka terapeutyczna/.test(r.text)&&r.dose&&!JUNK.test(r.text),r.text);
r=TP.transf(C({rbc:X({kind:'chronic',hb:6.5})},null,{T,TB,A}));ok('TR-4 KKCz przewlekła: 2 j. teraz',/2 j\. KKCz teraz/.test(r.text),r.text);
r=TP.transf(C({m:X({th:2,rg:4,rph:2,dm:120,pg:0,ps:1,ratio:'6'})},null,{T,TB,A}));ok('TR-5 MTP: TXA 1 g, zamów 1 dawek KKP, osocze 8 j.',/1 g i\.v\. w 10 min/.test(r.text)&&/zamów 1 dawek KKP/.test(r.text)&&/osocze 8 j\./.test(r.text)&&/MTP/.test(r.text),r.text);
r=TP.transf(C({r:X({fever:true,hypo:true})},null,{T,TB,A}));ok('TR-6 reakcja: PRZERWIJ, WNIOSKI ciężka',/PRZERWIJ przetoczenie/.test(r.text)&&/Ciężka reakcja/.test(r.text),r.text);
r=TP.transf(C({n:X({nb:true,dabi:true})},null,{T,TB,A}));ok('TR-7 NOAC dabigatran → idarucyzumab 5 g',/Idarucyzumab \(Praxbind\): 5 g/.test(r.text),r.text);
console.log(f?`${n-f}/${n} PASS, ${f} FAIL`:`${n}/${n} PASS`);process.exit(f?1:0);
