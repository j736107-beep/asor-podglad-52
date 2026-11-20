// fix19: wydruk Zatorowość płucna – tylko wypełnione pozycje + obowiązkowo wyliczone leczenie UFH (bolus, wlew, pompa, APTT) + wnioski
const B=require('../calc/pe-print.js'),E=require('../calc/clinical.js');
let n=0,f=0;const ok=(name,c,info)=>{n++;if(!c)f++;console.log((c?'PASS ':'FAIL ')+name+(c?'':' :: '+String(info||'').slice(0,500)));};
const G=o=>id=>o[id];
const T=(o,touched,seen)=>({g:G(o),touched:touched==null?Object.keys(o).filter(k=>k!=='review'&&k!=='amount'&&k!=='volume'&&k!=='conc'&&k!=='mode').length:touched,seen:!!seen});
const ufhDef={amount:25000,volume:50};
const P80={w:80,age:60,crcl:90,co:{}};
// 1. sama masa + zakładka UFH otwarta → bolus i wlew z liczbami
let r=B.build({E,P:P80,tabs:{ufh:T(ufhDef,0,true)}});
ok('PE-1 bolus 6 400 j.m. i 1,28 ml',/Bolus: 80 j\.m\.\/kg × 80 kg = 6 400 j\.m\. → 6 400 j\.m\. i\.v\. w 3 min = 1,28 ml/.test(r.text),r.text);
ok('PE-2 (fix24) wlew: zlecono 18 j./kg/h = 1 440 j./h; nastawa 2,9 ml/h = 1 450 j./h (faktycznie)',/Wlew: zlecono 18 j\.\/kg\/h = 1 440 j\.\/h; nastawa pompy 2,9 ml\/h = 1 450 j\.\/h \(faktycznie podawane\)/.test(r.text)&&/Prędkość pompy: 2,9 ml\/h/.test(r.text),r.text);
ok('PE-3 przygotowanie pompy: 5 ml leku + 45 ml NaCl do 50 ml, 500 j.m./ml',/25 000 j\.m\. = 5 ml leku \+ 45 ml NaCl 0,9% → objętość końcowa 50 ml; stężenie 500 j\.m\.\/ml/.test(r.text),r.text);
ok('PE-4 kontrola APTT po 6 h i limity',/APTT po 6 h/.test(r.text)&&/maks\. 10 000 j\.m\./.test(r.text),r.text);
ok('PE-5 dose=true, WNIOSKI obecne',r.dose&&/WNIOSKI:\n– /.test(r.text),r.text);
ok('PE-6 brak treści dydaktycznych / niewypełnionych',!/OCENA RYZYKA|TROMBOLIZA|HDCz|sPESI|Nie wpisano|ChPL \(Charakterystyka|Źródła|Rozbieżność|—/.test(r.text),r.text);
// 2. limity: 140 kg → bolus 10 000, wlew 2000
r=B.build({E,P:{w:140,co:{}},tabs:{ufh:T(ufhDef,0,true)}});
ok('PE-7 maksima zastosowane i opisane',/10 000 j\.m\. i\.v\./.test(r.text)&&/zastosowano maksimum 10 000/.test(r.text)&&/= 2 520 j\.\/h → limit 2 000 j\.\/h; nastawa pompy 4,0 ml\/h = 2 000 j\.\/h/.test(r.text)&&/wlew początkowy maks\. 2 000/.test(r.text),r.text);
// 3. pominięty bolus
r=B.build({E,P:P80,tabs:{ufh:T({...ufhDef,omit:true},1,true)}});
ok('PE-8 bolus pominięty',/Bolus: pominięty – decyzja lekarza/.test(r.text)&&/\(bez bolusa\)/.test(r.text),r.text);
// 4. pełny przypadek: ryzyko stabilny, komplet sPESI, RV+trop+, UFH z bezpieczeństwem i potwierdzeniem
const risk={state:'stable',sbp:120,hr:115,sat:94,cancer:false,cardio:false,rv:true,trop:true};
r=B.build({E,P:{w:80,age:60,co:{}},tabs:{risk:T(risk),ufh:T({...ufhDef,bleed:false,hit:false,other:false,review:true,base:32},4,true)},due:()=>'kontrola APTT: 19.11.2026 15:00'});
ok('PE-9 sPESI z kompletu 1/6 (HR ≥110)',/Skala sPESI: 1\/6 \(HR ≥110\/min\)/.test(r.text),r.text);
ok('PE-10 tylko stwierdzone pozycje (RV, troponina), bez „nowotwór”',/Stwierdzono: dysfunkcja RV \(echo \/ TK\), podwyższona troponina/.test(r.text)&&!/nowotwór/.test(r.text),r.text);
ok('PE-11 bezpieczeństwo i potwierdzenie lekarza',/bez czynnego krwawienia; bez HIT; bez działającego innego antykoagulantu/.test(r.text)&&/☑ Lekarz potwierdził/.test(r.text)&&/APTT wyjściowy: 32 s/.test(r.text)&&/kontrola APTT: 19\.11\.2026 15:00/.test(r.text),r.text);
ok('PE-12 wnioski: hospitalizacja RV+trop, UFH',/Hospitalizacja i monitorowanie: dysfunkcja RV/.test(r.text)&&/Leczenie przeciwkrzepliwe: UFH/.test(r.text)&&r.reviewed,r.text);
// 5. sPESI niepełne → pominięte
r=B.build({E,P:{w:80,co:{}},tabs:{risk:T({state:'stable',sbp:120})}});
ok('PE-13 niepełne sPESI nie drukowane',!/sPESI: \d/.test(r.text)&&/sPESI niepełne/.test(r.text),r.text);
// 6. niestabilny + tromboliza standard
r=B.build({E,P:{w:80,co:{}},tabs:{risk:T({state:'unstable',sbp:80}),lysis:T({ind:true,ci:false,fullCI:true,mode:'standard',conc:'1'})}});
ok('PE-14 alteplaza 100 mg: 10 mg + 90 mg w 2 h = 45 ml/h',/łącznie 100 mg: bolus 10 mg = 10 ml i\.v\. w 1–2 min, następnie 90 mg = 90 ml w 2 h → 45 ml\/h/.test(r.text),r.text);
ok('PE-15 wnioski: hospitalizacja bezwzględna / OIT + tromboliza',/HOSPITALIZACJA BEZWZGLĘDNA/.test(r.text)&&/OIT/.test(r.text)&&/Tromboliza systemowa/.test(r.text)&&!/Skala sPESI/.test(r.text),r.text);
// 7. krwawienie → ostrzeżenie zamiast wniosku o UFH
r=B.build({E,P:P80,tabs:{ufh:T({...ufhDef,bleed:true},1,true)}});
ok('PE-16 czynne krwawienie w wnioskach',/CZYNNE ISTOTNE KRWAWIENIE/.test(r.text)&&/zwykła propozycja heparyny zablokowana/.test(r.text)&&!/Leczenie przeciwkrzepliwe/.test(r.text),r.text);
// 8. pusto
r=B.build({E,P:P80,tabs:{risk:T({},0,true)}});
ok('PE-17 nic nie wypełniono → pusty tekst',r.text===''&&!r.dose,r.text);
// 9. brak masy przy otwartej zakładce → nic; przy zmianie pola → powód
r=B.build({E,P:{co:{}},tabs:{ufh:T(ufhDef,0,true)}});
ok('PE-18 brak masy i brak zmian → pusty wydruk',r.text==='',r.text);
// 10. kontrola APTT
r=B.build({E,P:P80,tabs:{aptt:T({current:1450,aptt:50,conc:500,local:true,baseNormal:true,bleed:false,post:false,other:false})}});
ok('PE-19 (fix24) APTT 50 s → +160: zlecono 1 450 + 160 = 1 610 j./h; nastawa 3,2 ml/h = 1 600 j./h (faktycznie)',/zwiększyć o 160 j\.m\.\/h: zlecono 1 450 \+ 160 = 1 610 j\.\/h; nastawa pompy 3,2 ml\/h = 1 600 j\.\/h \(faktycznie podawane\)/.test(r.text)&&/Następny APTT: za 6 h/.test(r.text),r.text);
// 11. zgodność z silnikiem (bez zmian algorytmu)
const u=E.ufhStart(80,25000,50,false);ok('PE-20 silnik niezmieniony (6400/1450/2,9)',u.bolus===6400&&u.rate===1450&&Math.abs(u.mlh-2.9)<1e-9,JSON.stringify(u));
console.log(f?`${n-f}/${n} PASS, ${f} FAIL`:`${n}/${n} PASS`);process.exit(f?1:0);
