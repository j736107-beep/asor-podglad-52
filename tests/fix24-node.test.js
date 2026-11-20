// fix24: (1) UFH – jedna konwencja „zlecono / nastawa 0,1 ml/h / faktycznie podawane” w ZP, Antykoagulacji, STEMI, korekcie APTT; algorytmy bez zmian.
//        (2) KKCz – jeden przelicznik z masy (≈4 ml/kg → +1 g/dl; jednostka jak w zakładce wskazań) w zakładkach „Dawki” i „KKCz – wskazania” + strategia restrykcyjna.
global.window=global.window||{};
const UR=require('../calc/ufh-rate.js'),E=require('../calc/clinical.js'),A=require('../calc/acoag.js'),AB=require('../calc/acoagB1.js'),PEP=require('../calc/pe-print.js'),TP=require('../calc/tab-print.js'),T=require('../calc/transf.js'),TB=require('../calc/transfB1.js');
let n=0,f=0;const ok=(name,c,info)=>{n++;if(!c)f++;console.log((c?'PASS ':'FAIL ')+name+(c?'':' :: '+String(info||'').slice(0,700)));};
const STD='zlecono 18 j./kg/h = 1 440 j./h; nastawa pompy 2,9 ml/h = 1 450 j./h (faktycznie podawane)';
ok('U-1 helper 80 kg: '+STD,UR.text({perKg:18,raw:1440,ordered:1440,conc:500})===STD);
const s=UR.set(1440,500);ok('U-2 nastawa 2,9 ml/h, faktycznie 1 450 j./h',s.mlh===2.9&&s.actual===1450,JSON.stringify(s));
// silniki bez zmian
const u=E.ufhStart(80,25000,50,false),a=A.ufh(80);ok('U-3 silniki bez zmian (ZP 1450 po zaokr. do 50; Antykoagulacja 1440)',u.rate===1450&&u.rawRate===1440&&a.rate===1440&&a.conc===500);
// wydruki ZP i Antykoagulacji – identyczny tekst wlewu
const X=(o,x)=>Object.assign({g:id=>o[id],touched:Object.keys(o).length,fields:[]},x||{});
const peTxt=(()=>{try{const o={tabs:{ufh:X({amount:25000,volume:50},{print:true,current:true})},P:{w:80},E,print:true};const r=PEP.text?PEP.text(o):PEP.build(o);return r.text||r;}catch(e){return 'ERR '+e.message;}})();
const acTxt=TP.acoag({tabs:{ufh:X({},{print:true,current:true})},P:{w:80},A,AB,print:true}).text;
const lineOf=(t)=>((String(t).match(/Wlew: [^\n]*/)||[''])[0]);
ok('U-4 Antykoagulacja – wydruk: Wlew: '+STD,lineOf(acTxt)==='Wlew: '+STD,acTxt);
ok('U-5 ZP – wydruk: identyczny wiersz wlewu jak w Antykoagulacji',lineOf(peTxt)===lineOf(acTxt),lineOf(peTxt)+' | '+String(peTxt).slice(0,400));
ok('U-6 ZP – prędkość pompy i zużycie z nastawy (2,9 ml/h = 1 450 j.m./h; 17,2 h; 34 800 j.m./24 h)',/Prędkość pompy: 2,9 ml\/h \(= 1 450 j\.m\.\/h faktycznie\); strzykawka wystarczy na 17,2 h; zapotrzebowanie 24 h: 34 800 j\.m\./.test(peTxt),peTxt);
ok('U-7 limit ZP 140 kg: zlecono 2 520 → limit 2 000; nastawa 4,0 ml/h = 2 000',UR.text({perKg:18,raw:2520,ordered:2000,conc:500})==='zlecono 18 j./kg/h = 2 520 j./h → limit 2 000 j./h; nastawa pompy 4,0 ml/h = 2 000 j./h (faktycznie podawane)');
const acs=TP.acoag({tabs:{ufh:X({acs:true},{print:true,current:true})},P:{w:100},A,AB,print:true}).text;
ok('U-8 ACS 100 kg: zlecono 12 j./kg/h = 1 200 → limit 1 000; nastawa 2,0 ml/h = 1 000',/Wlew: zlecono 12 j\.\/kg\/h = 1 200 j\.\/h → limit 1 000 j\.\/h; nastawa pompy 2,0 ml\/h = 1 000 j\.\/h \(faktycznie podawane\)/.test(acs),acs);
const st=AB.stemi({w:80,age:60,hours:2,delayMin:150,sbp:130,crcl:90,v:{}});ok('U-9 STEMI – alternatywa UFH w tej samej konwencji (960 → 1,9 ml/h = 950)',st&&st.adj&&st.adj.ufh&&/zlecono 12 j\.\/kg\/h = 960 j\.\/h; nastawa pompy 1,9 ml\/h = 950 j\.\/h \(faktycznie podawane\)/.test(st.adj.ufh.txt),st&&st.adj&&st.adj.ufh&&st.adj.ufh.txt);
const adj=E.ufhAdjust({w:80,current:1450,aptt:50,concentration:500,local:true,baselineNormal:true,bleeding:false,postLysis:false,otherAnticoagulant:false,twoTherapeutic:false});
ok('U-10 korekta APTT: kroki bez zmian (+160 → 1 610 j./h); prezentacja zlecono / nastawa 3,2 ml/h = 1 600 j./h',adj.rate===1610&&adj.delta===160&&UR.text({lead:'zlecono 1 450 + 160 = 1 610 j./h',ordered:1610,conc:500})==='zlecono 1 450 + 160 = 1 610 j./h; nastawa pompy 3,2 ml/h = 1 600 j./h (faktycznie podawane)');
// ---- KKCz ----
const cv=TB.rbcConv(80);ok('K-1 przelicznik 80 kg: 320 ml na 1 g/dl, ≈0,88 g/dl/j., jednostka ≈280 ml (zależy od preparatu RCKiK)',cv.mlPerG===320&&Math.abs(cv.incPerUnit-0.875)<1e-9&&/320 ml na 1 g\/dl/.test(cv.txt)&&/≈280 ml – zależy od preparatu RCKiK/.test(cv.txt)&&/0,88 g\/dl na jednostkę/.test(cv.txt),JSON.stringify(cv));
const r=TB.rbc({kind:'chronic',hb:6.5,w:80});ok('K-2 zakładka wskazań: przelicznik bez zmian (0,88 g/dl/j., 2 j. do celu 8)',r.incPerUnit===0.88&&r.unitsTotal===2&&r.conv.mlPerG===320,JSON.stringify(r));
const ru=TB.rbcUnitsW(6.5,9,80);ok('K-3 zakładka Dawki: ten sam przelicznik – Hb 6,5 → 9 przy 80 kg = 3 j. (2,5 / 0,875)',ru.units===3&&ru.conv.incPerUnit===cv.incPerUnit);
ok('K-4 Dawki 100 kg: Hb 7 → 9 = 3 j. (2 / 0,7; dawniej 2 j. wg 1 j. = 1 g/dl)',TB.rbcUnitsW(7,9,100).units===3);
ok('K-5 brak masy → brak liczby jednostek',TB.rbcUnitsW(6.5,9,NaN)===null);
const tr=TP.transf({T,TB,A,P:{w:80},tabs:{d:X({hb:6.5,hbt:9}),rbc:X({kind:'chronic',hb:6.5})}}).text;
const pl=(tr.match(/Przelicznik: [^\n]*/g)||[]);
ok('K-6 wydruk: jeden przelicznik w obu zakładkach + adnotacja 70 kg + strategia restrykcyjna (2×)',pl.length===2&&pl[0]===pl[1]&&/orientacyjnie u dorosłego ok\. 70 kg/.test(pl[0])&&(tr.match(/Strategia: Przetaczaj po 1 jednostce, kontrola Hb przed kolejną \(strategia restrykcyjna\)\./g)||[]).length===2,tr);
ok('K-7 wydruk bez dawnej reguły „1 j. ≈ +1 g/dl u ~70 kg; przetaczaj po 1 j. i oceniaj”',!/przetaczaj po 1 j\. i oceniaj|g\/dl\/j\./.test(tr),tr);
const tr0=TP.transf({T,TB,A,P:{},tabs:{d:X({hb:6.5,hbt:9})}}).text;ok('K-8 Dawki bez masy: nie wyliczono liczby jednostek',/nie wyliczono liczby jednostek \(brak masy ciała\)/.test(tr0),tr0);
console.log(f?`${n-f}/${n} PASS, ${f} FAIL`:`${n}/${n} PASS`);process.exit(f?1:0);
