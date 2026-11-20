// fix21: wydruk Elektrolity / Stan padaczkowy / DKA-HHS – tylko wypełnione pozycje, dawki i pompy z silników, WNIOSKI
global.window=global.window||{};
const EL=require('../mod/el/engine.js'),ELP=require('../mod/el/print.js'),SE=require('../mod/se/engine.js'),SEP=require('../mod/se/print.js'),TH=require('../calc/thiamine.js');
const TP=require('../calc/tab-print.js'),DK=require('../calc/dkaB1.js');
let n=0,f=0;const ok=(name,c,info)=>{n++;if(!c)f++;console.log((c?'PASS ':'FAIL ')+name+(c?'':' :: '+String(info||'').slice(0,600)));};
const JUNK=/Źródł|Wytyczne i ChPL|ChPL 4\.2|Efekt:|undefined|NaN|null|\[object|zatwierdzony przez lekarza/;
// ---- Elektrolity ----
let r=ELP.build(EL,{w:80,dis:'hipoK',lab:{k:2.6},opt:{}},{print:true},TH);
ok('EL-1 KCl: 40 mmol = 20 ml, 1000 ml, 40 mmol/l, 500 ml/h, 2 h',/40 mmol = 20 ml KCl 15% \(2 amp\. 10 ml\) w objętości końcowej 1000 ml → stężenie 40 mmol\/l; 20 mmol\/h = 500 ml\/h; czas 2 h/.test(r.text),r.text);
ok('EL-2 jeden wynik + Drukuj = użycie; bez Drukuj nie',r.used&&!ELP.build(EL,{w:80,dis:'hipoK',lab:{k:2.6},opt:{}},{},TH).used,r.n);
ok('EL-3 bez nadmiaru',!JUNK.test(r.text),r.text.match(JUNK));
r=ELP.build(EL,{w:80,dis:'hipoK',lab:{k:2.6},opt:{},ed:{kcl:{mmol:20,vol:500,rate:10}}},{},TH);
ok('EL-4 edytowane przez lekarza: 20 mmol / 500 ml / 10 mmol/h → 250 ml/h',/20 mmol = 10 ml KCl 15% \(1 amp\. 10 ml\) w objętości końcowej 500 ml → stężenie 40 mmol\/l; 10 mmol\/h = 250 ml\/h; czas 2 h/.test(r.text)&&r.used,r.text);
r=ELP.build(EL,{w:80,dis:'hipoMg',lab:{mg:1.0,mgu:'mgdl'},opt:{tdp:true}},{},TH);
ok('EL-5 MgSO₄: pełny opis wlewu (g, ml 20%, mmol, objętość, czas, ml/h)',/Wlew MgSO₄: \d.* g = .* ml MgSO₄ 20% .* mmol w objętości końcowej \d+ ml; czas \d+ min = .* ml\/h/.test(r.text),r.text);
r=ELP.build(EL,{w:80,dis:'hiperK',lab:{k:7.1},opt:{ecg:true}},{},TH);
ok('EL-6 hiperK: wapń, insulina, WNIOSKI ciężkie, bez listy dializy i niezaznaczonych opcji',/9,2 mmol Ca/.test(r.text)&&/10 j\. i\.v\./.test(r.text)&&/Ciężkie zaburzenie/.test(r.text)&&!/oliguria\/anuria w AKI|NZK|digoksyna/.test(r.text),r.text);
ok('EL-7 brak wyniku → pusty wydruk',ELP.build(EL,{w:80,dis:'hiperK',lab:{},opt:{}},{print:true},TH).text==='');
// ---- Stan padaczkowy ----
const now=Date.now();const sr=st=>SE.compute({w:st.w,zrmDoses:st.zrmDoses||0,zrmDzp:0,crcl:NaN,co:st.co||{},given:{dzpMg:0},log:st.log||[],now:now,t0:null});
let st={w:80,sel:'lev',ed:{},log:[],co:{}};r=SEP.build(SE,st,sr(st),{print:true},{SH:{lev:'Keppra fiol. 500 mg/5 ml'},TH});
ok('SE-1 LEV 4500 mg, 45 ml, 145 ml, 580 ml/h (Drukuj z samej masy = użycie)',/4500 mg = 56,3 mg\/kg; = 45 ml \(9 fiol\. 500 mg\/5 ml\); w 100 ml NaCl → 145 ml; pompa: 580 ml\/h przez 15 min/.test(r.text)&&r.used&&r.dose,r.text);
ok('SE-2 wybór leku bez Drukuj i bez innych danych → nie użyto',!SEP.build(SE,st,sr(st),{},{TH}).used);
st={w:80,sel:'mid3',ed:{},log:[{t:now-60000,k:'lev',txt:'Lewetyracetam (Keppra) i.v. 4500 mg (56,3 mg/kg)'}],co:{}};r=SEP.build(SE,st,sr(st),{},{SH:{mid3:'Midanium 5 mg/ml, strzykawka 50 ml'},TH});
ok('SE-3 dziennik + midazolam bolus 16 mg / wlew 0,8 ml/h + preparat, WNIOSKI II rzut',/PODANO/.test(r.text)&&/bolus = 3,2 ml z 5 mg\/ml/.test(r.text)&&/0,8 ml\/h/.test(r.text)&&/Midanium 5 mg\/ml, strzykawka 50 ml/.test(r.text)&&/Po leku II rzutu/.test(r.text)&&!JUNK.test(r.text),r.text);
ok('SE-4 sama masa → pusty wydruk',SEP.build(SE,{w:80,ed:{},log:[],co:{}},sr({w:80}),{print:true},{TH}).text==='');
// ---- DKA / HHS ----
const T=(o,F)=>({g:id=>o[id],touched:Object.keys(o).length,fields:F||[]});
r=TP.dka({D:DK,P:{w:80,age:40,co:{}},cfg:{rr:0.05,dex:10},nowHM:()=>'05:30',tabs:{main:T({glu:30,ket:5,ph:7.1,hco3:10,k:4.5,na:135,cl:100,syrU:'50',syrMl:'50',dm:true},[{id:'glu',label:'Glukoza',val:'540',unit:'mg/dl',type:'val'}])}});
ok('DKA-1 insulina 8 j./h = 8 ml/h; 0,5 ml + 49,5 ml NaCl → 50 ml, 1 j./ml',/8 j\.\/h = 8 ml\/h/.test(r.text)&&/0,5 ml z pena 100 j\.\/ml \+ 49,5 ml NaCl 0,9% → objętość końcowa 50 ml; stężenie 1 j\.\/ml/.test(r.text)&&r.dose,r.text);
ok('DKA-2 płyny, faza zmniejszona 4 ml/h + glukoza 10% 125 ml/h, WNIOSKI hospitalizacja',/1 000 ml\/h/.test(r.text)&&/4 j\.\/h = 4 ml\/h \+ glukoza 10% 125 ml\/h/.test(r.text)&&/HOSPITALIZACJA – DKA/.test(r.text)&&!JUNK.test(r.text),r.text);
r=TP.dka({D:DK,P:{w:80,co:{}},cfg:{rr:0.05,dex:10},tabs:{main:T({glu:30,ket:5,ph:7.1,hco3:10,k:3.0,syrU:'50',syrMl:'50'})}});
ok('DKA-3 K⁺ 3,0 → insulina wstrzymana (bez ml/h insuliny) + wniosek',/Insulina i\.v\.: WSTRZYMANA/.test(r.text)&&/Insulina wstrzymana/.test(r.text)&&!/pompa strzykawkowa/.test(r.text),r.text);
ok('DKA-4 nic nie wpisano → pusty wydruk',TP.dka({D:DK,P:{w:80},tabs:{main:T({}),rates:T({})}}).text==='');
console.log(`${n-f}/${n} ${f?'FAIL':'PASS'}`);process.exit(f?1:0);
