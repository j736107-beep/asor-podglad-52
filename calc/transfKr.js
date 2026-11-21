/* fix29 (t71u): Kreator przetoczenia KKCz/KKP – silnik decyzyjny (czysty JS, UMD SK.transfKr).
   Progi/cele/szybkości wyłącznie ze źródeł w SRC; wartości bez rekomendacji wytycznych mają flagę dd (DO DECYZJI lekarza).
   Liczba jednostek: wspólny przelicznik aplikacji SK.transfB1.rbcUnitsW (≈4 ml/kg KKCz → +1 g/dl, jednostka 280 ml – fix24). */
(function(r,f){var TB=typeof module==='object'&&module.exports?require('./transfB1.js'):(r.SK&&r.SK.transfB1);var m=f(TB);if(typeof module==='object'&&module.exports)module.exports=m;else{r.SK=r.SK||{};r.SK.transfKr=m;}})(typeof self!=='undefined'?self:this,function(TB){
var SRC={
 AABB:'AABB 2023 (Carson i wsp., JAMA 2023;330:1892): próg restrykcyjny Hb 7 g/dl u stabilnych hospitalizowanych; 8 g/dl przy istniejącej chorobie sercowo-naczyniowej (i ortopedii); 7,5 w kardiochirurgii; brak rekomendacji dla ACS',
 ESGE:'ESGE 2021 (Gralnek i wsp., Endoscopy 2021;53:300; potw. aktualizacja ESGE 2026): krwawienie z GOPP bez ch. sercowo-naczyniowej – przetoczenie przy Hb ≤7 g/dl, cel 7–9; z ostrą/przewlekłą ch. sercowo-naczyniową – Hb ≤8 g/dl, cel ≥10; niestabilność hemodynamiczna – natychmiastowa resuscytacja',
 NICE:'NICE NG24 (2015, przegl. 2026): próg 7 g/dl, cel 7–9; ACS próg 8, cel 8–10; u niekrwawiących – pojedyncza jednostka i ponowna ocena Hb przed kolejną',
 TRAUMA:'Europejskie wytyczne krwawienia urazowego, wyd. 6 (Rossaint i wsp., Crit Care 2023;27:80): gdy przetoczenie KKCz konieczne – cel Hb 7–9 g/dl (1C)',
 MINT:'MINT 2023 (Carson i wsp., NEJM 2023;389:2446): zawał + Hb <10 – strategia liberalna (próg <10, utrzymanie ≥10) vs restrykcyjna (7–8): zgon/ponowny zawał 16,9% vs 14,5%, p=0,07 (bez istotności; trend na korzyść liberalnej)',
 ACC:'ACC/AHA 2025 ACS: u chorych z ACS i niedokrwistością bez czynnego krwawienia przetoczenie dla utrzymania Hb 10 g/dl może być rozsądne (klasa 2b). ESC 2023 ACS – brak formalnej rekomendacji progu',
 KDIGO:'KDIGO 2012 (4.1.1–4.2) i KDIGO 2026 (PP 4.1–4.6): w PChN unikać przetoczeń, zwłaszcza u kandydatów do przeszczepu (alloimmunizacja HLA); decyzja na podstawie objawów, nie samego Hb; przetoczenie przy ostrym krwotoku, niestabilnej chorobie wieńcowej, szybkiej korekcie przedoperacyjnej lub nieskuteczności/przeciwwskazaniu ESA. KDIGO nie podaje liczbowego progu Hb',
 BSH:'BSH 2017/2018 (Robinson i wsp., Transfus Med 2018;28:3): KKCz rutynowo 90–120 min/jednostkę; w masywnym krwotoku szybko; przy ryzyku TACO wolniej + ocena wskazań do diuretyku; zakończyć w ciągu 4 h od wyjęcia z warunków przechowywania; KKP 30–60 min/dawkę; ryzyko TACO: wiek >70 lat, niewydolność serca, niewydolność nerek, hipoalbuminemia, przewodnienie, niska masa ciała',
 BSHPLT:'BSH 2017 (Estcourt i wsp., Br J Haematol 2017;176:365): progi KKP – <10 profilaktycznie, <50 krwawienie/zabieg, <100 OUN/uraz wielonarządowy; 1 dawka terapeutyczna dorosłego; kontrola PLT 10 min–1 h po przetoczeniu',
 PL:'Rozporządzenie MZ z 12.10.2017 w sprawie leczenia krwią… (t.j. Dz.U. 2023 poz. 1742): rozpoczęcie przetoczenia KKCz ≤30 min od wydania z banku krwi; jednej jednostki KKCz nie przetacza się dłużej niż 4 h, jednej jednostki KKP/osocza dłużej niż 30 min; temperatura, tętno i ciśnienie – przed rozpoczęciem każdej jednostki, po 15 min i po zakończeniu; ogrzewanie KKCz u dorosłych przy szybkości >50 ml/min; obserwacja 24 h po przetoczeniu (w oddziale) lub ≥2 h przy wypisie',
 UTD:'UpToDate (Red blood cell transfusion / TACO): u chorych z ryzykiem TACO ok. 1 ml/kg/h – źródło podręcznikowe, nie wytyczne (BSH: „wolniej” bez liczby)'
};
var UNIT_ML=TB&&TB.RBC_UNIT_ML||280,ML_PER_KG_G=TB&&TB.RBC_ML_PER_KG_G||4;
function fin(x){return typeof x==='number'&&isFinite(x);}
function r0(x){return Math.round(x);}
function pl(x,d){var p=Math.pow(10,d||0);return String(Math.round(x*p)/p).replace('.',',');}
/* Kroki kreatora – kolejność i odpowiedzi do kliknięcia (UI rysuje kafelki; silnik określa, które są aktywne). */
var Q={
 path:[['acute','Ostre krwawienie / nagła utrata krwi'],['chronic','Niedokrwistość przewlekła']],
 actx:[['unstable','Niestabilność hemodynamiczna / wstrząs / masywne krwawienie (MTP)'],['gi','Krwawienie z górnego odcinka przewodu pokarmowego – stabilny'],['trauma','Uraz – stabilny'],['other','Inne ostre krwawienie – stabilny']],
 cv:[['no','Bez choroby sercowo-naczyniowej'],['yes','Choroba sercowo-naczyniowa (ostra lub przewlekła)']],
 cgrp:[['nocv','Bez obciążeń sercowo-naczyniowych'],['cv','Przewlekła choroba sercowo-naczyniowa'],['acs','Ostry zespół wieńcowy'],['ckd','Przewlekła choroba nerek (PChN)']],
 cvs:[['tia','Miażdżyca tt. mózgowych – po TIA / udarze'],['pad','Miażdżyca tt. kończyn dolnych (PAD)'],['cad','Choroba wieńcowa / po zawale'],['hf','Przewlekła niewydolność serca']],
 ckd:[['hd','Dializowany'],['nd','Niedializowany']],
 tx:[['yes','Kandydat do przeszczepu nerki'],['no','Nie jest kandydatem']],
 ckdcv:[['no','Bez choroby sercowo-naczyniowej'],['yes','Z chorobą sercowo-naczyniową']],
 sym:[['yes','TAK – objawy niedokrwistości'],['no','NIE – bez objawów']],
 taco:[['yes','TAK – ryzyko TACO'],['no','NIE']],
 pctx:[['proph','Profilaktyka (bez krwawienia)'],['bleed','Krwawienie / zabieg inwazyjny'],['cns','OUN / oko / uraz wielonarządowy']]
};
var SYM='ból wieńcowy, duszność spoczynkowa, tachykardia lub hipotensja niereagujące na płyny, omdlenie / zaburzenia świadomości';
function steps(i){var s=['path'];if(i.path==='acute'){s.push('actx');if(i.actx&&i.actx!=='unstable')s.push('cv');}
 else if(i.path==='chronic'){s.push('cgrp');if(i.cgrp==='cv')s.push('cvs');if(i.cgrp==='ckd')s.push('ckd','tx','ckdcv');}
 if(i.path&&i.actx!=='unstable')s.push('hb','sym','taco');return s;}
function missing(i){return steps(i).filter(function(k){return k==='hb'?!fin(i.hb):!i[k];});}
function tacoAuto(i){var why=[];if(i.cvs==='hf')why.push('niewydolność serca');if(i.cgrp==='ckd')why.push('PChN');if(fin(i.age)&&i.age>70)why.push('wiek >70 lat');return why;}
/* Próg / cel wg ścieżki */
function rule(i){
 if(i.path==='acute'){
  if(i.actx==='unstable')return{op:'any',thr:null,goal:null,target:'7–9 g/dl po opanowaniu krwawienia',src:['TRAUMA','BSH','PL'],txt:'Bezwzględne wskazanie SOR – przetaczaj niezależnie od Hb (Hb w ostrym krwotoku jest niemiarodajne); przy przewidywanej masywnej utracie – protokół masywnego przetoczenia (zakładka „Masywne przetoczenie”).'};
  if(i.actx==='gi')return i.cv==='yes'?{op:'le',thr:8,goal:10,target:'≥10 g/dl',src:['ESGE'],txt:'Krwawienie z GOPP + choroba sercowo-naczyniowa: próg Hb ≤8 g/dl, cel ≥10 g/dl (ESGE 2021).'}
   :{op:'le',thr:7,goal:8,target:'7–9 g/dl',src:['ESGE','NICE'],txt:'Krwawienie z GOPP bez choroby sercowo-naczyniowej: strategia restrykcyjna – próg Hb ≤7 g/dl, cel 7–9 g/dl (ESGE 2021, NICE NG24).'};
  if(i.actx==='trauma')return i.cv==='yes'?{op:'lt',thr:8,goal:9,target:'7–9 g/dl',src:['TRAUMA','AABB'],txt:'Uraz, stabilny, z chorobą sercowo-naczyniową: próg Hb <8 g/dl (AABB 2023), cel 7–9 g/dl (wytyczne urazowe 2023).',dd:'Próg 8 przy ch. sercowo-naczyniowej w urazie – przeniesiony z AABB 2023 (wytyczne urazowe podają tylko cel 7–9).'}
   :{op:'lt',thr:7,goal:8,target:'7–9 g/dl',src:['TRAUMA','AABB'],txt:'Uraz, stabilny: próg Hb <7 g/dl (AABB 2023), cel 7–9 g/dl (wytyczne urazowe 2023).'};
  return i.cv==='yes'?{op:'lt',thr:8,goal:9,target:'≥8 g/dl (cel obliczeniowy 9)',src:['AABB'],txt:'Ostre krwawienie, stabilny, z chorobą sercowo-naczyniową: próg Hb <8 g/dl (AABB 2023).',dd:'Cel obliczeniowy 9 g/dl – arbitralny (AABB podaje tylko próg).'}
   :{op:'lt',thr:7,goal:8,target:'7–9 g/dl',src:['AABB','NICE'],txt:'Ostre krwawienie, stabilny: próg Hb <7 g/dl, cel 7–9 g/dl (AABB 2023, NICE NG24).'};}
 if(i.cgrp==='nocv')return{op:'lt',thr:7,goal:8,target:'7–9 g/dl',src:['AABB','NICE'],txt:'Niedokrwistość przewlekła bez obciążeń: próg Hb <7 g/dl (AABB 2023, NICE NG24).'};
 if(i.cgrp==='cv'){var nm={tia:'po TIA / udarze',pad:'PAD',cad:'choroba wieńcowa / po zawale',hf:'przewlekła niewydolność serca'}[i.cvs]||'';
  return{op:'lt',thr:8,goal:9,target:'8–9 g/dl (cel obliczeniowy 9)',src:['AABB'],txt:'Niedokrwistość przewlekła + choroba sercowo-naczyniowa ('+nm+'): próg Hb <8 g/dl (AABB 2023 – istniejąca choroba sercowo-naczyniowa).',dd:'Cel 9 g/dl – arbitralny, zgodny z zakładką „KKCz – wskazania” (AABB podaje tylko próg).'};}
 if(i.cgrp==='acs')return{op:'lt',thr:10,goal:10,target:'≥10 g/dl',src:['MINT','ACC','NICE','AABB'],txt:'Ostry zespół wieńcowy: próg liberalny Hb <10 g/dl, utrzymanie ≥10 g/dl (MINT 2023; ACC/AHA 2025 klasa 2b).',dd:'ACS: ESC 2023 i AABB 2023 bez rekomendacji progu; MINT bez istotności (p=0,07); NICE NG24: próg 8, cel 8–10. Wybór progu 10 vs 8 – DO DECYZJI lekarza.'};
 if(i.cgrp==='ckd'){var c=i.ckdcv==='yes';return{op:'lt',thr:c?8:7,goal:c?9:8,target:c?'8–9 g/dl':'7–9 g/dl',src:['KDIGO','AABB'],txt:'PChN '+(i.ckd==='hd'?'dializowana':'niedializowana')+': KDIGO – decyzja na podstawie objawów, unikać przetoczeń; próg orientacyjny Hb <'+(c?8:7)+' g/dl (AABB 2023'+(c?', ch. sercowo-naczyniowa':'')+').',dd:'KDIGO nie podaje liczbowego progu Hb – próg '+(c?8:7)+' g/dl przeniesiony z AABB 2023.'};}
 return null;}
function below(rl,hb){return rl.op==='any'||(rl.op==='le'?hb<=rl.thr:hb<rl.thr);}
function rate(i,vol,taco,rapid){var o={vol:vol,lines:[],dd:[]};
 if(rapid){o.mode='rapid';o.mlh=null;o.txt='Szybko – zestaw/pompa do szybkich przetoczeń wg hemodynamiki; przy szybkości >50 ml/min (>3000 ml/h) – ogrzewacz krwi z termometrem i alarmem (Rozp. MZ).';return o;}
 if(taco){if(!(i.w>0)){o.mode='taco';o.mlh=null;o.txt='Ryzyko TACO – podaj masę ciała, aby wyliczyć ml/h (≈1 ml/kg/h).';return o;}
  var q=1*i.w,h=vol/q,cap=false;if(h>4){h=4;q=vol/4;cap=true;}
  o.mode='taco';o.mlh=r0(q);o.min=r0(h*60);o.txt='Ryzyko TACO: wolno ≈1 ml/kg/h → '+r0(q)+' ml/h, czas ≈'+pl(h,1)+' h / jednostkę'+(cap?' (1 ml/kg/h przekroczyłoby limit 4 h – szybkość podniesiona do '+r0(q)+' ml/h, aby zmieścić się w 4 h)':'')+'; rozważ diuretyk przed/między jednostkami; po 1 jednostce ponowna ocena.';
  o.dd.push('Szybkość 1 ml/kg/h przy ryzyku TACO – źródło podręcznikowe (UpToDate), BSH 2017 zaleca tylko „wolniej” bez liczby.');if(cap)o.dd.push('Przy masie <'+r0(vol/4)+' kg 1 ml/kg/h nie mieści '+vol+' ml w 4 h – rozważ mniejszą objętość/jednostkę dzieloną z banku krwi lub zaakceptuj szybkość '+r0(q)+' ml/h.');return o;}
 o.mode='routine';o.mlh=r0(vol/2);o.mlhHi=r0(vol/1.5);o.min=120;o.txt='Rutynowo 90–120 min / jednostkę → '+r0(vol/2)+' ml/h (120 min); zakres '+r0(vol/2)+'–'+r0(vol/1.5)+' ml/h.';return o;}
function plt(i){if(!fin(i.plt))return null;var t=i.pctx==='cns'?100:i.pctx==='bleed'?50:10,need=i.plt<t;
 return{t:t,need:need,txt:need?'PLT '+i.plt+' <'+t+' ×10⁹/l → 1 dawka terapeutyczna KKP (1 KKP z aferezy lub zlewany z 4–6 donacji); oczekiwany przyrost ≈20–40 ×10⁹/l u ~70 kg; czas przetaczania jednej jednostki KKP ≤30 min (Rozp. MZ); kontrola PLT 10 min–1 h po przetoczeniu.':'PLT '+i.plt+' ≥'+t+' ×10⁹/l – brak wskazań do KKP w tej sytuacji.',src:['BSHPLT','PL'],
  dd:need?['Czas KKP: Rozp. MZ ≤30 min/jednostkę vs BSH 30–60 min/dawkę – zastosowano przepis polski.']:[]};}
function plan(i){i=i||{};var o={done:false,miss:missing(i),steps:steps(i),dd:[],src:[],notes:[]};var tb=tacoAuto(i);o.tacoAuto=tb;
 o.kkp=plt(i);if(o.kkp){o.dd=o.dd.concat(o.kkp.dd);}
 if(o.miss.length)return o;var rl=rule(i);if(!rl)return o;o.done=true;o.rule=rl;o.src=rl.src.slice();if(rl.dd)o.dd.push(rl.dd);
 var vol=fin(i.uml)&&i.uml>=100&&i.uml<=500?i.uml:UNIT_ML;o.vol=vol;o.volLabel=fin(i.uml)&&i.uml>=100&&i.uml<=500;
 var unst=rl.op==='any',hb=i.hb,bel=unst||below(rl,hb),sym=i.sym==='yes',ckd=i.cgrp==='ckd',chronic=i.path==='chronic';
 /* decyzja */
 if(unst)o.dec='TAK';else if(bel){o.dec=ckd&&(i.tx==='yes'||!sym)?'ROZWAŻ':'TAK';}else o.dec=sym?'ROZWAŻ':'NIE';
 o.decTxt=o.dec==='TAK'?'PRZETOCZ KKCz':o.dec==='ROZWAŻ'?'ROZWAŻ PRZETOCZENIE – decyzja lekarza':'NIE PRZETACZAJ – powyżej progu, bez objawów';
 if(!unst&&!bel&&sym)o.notes.push('Hb powyżej progu, ale objawy niedokrwistości ('+SYM+') – przetoczenie może być uzasadnione objawami niezależnie od Hb; wyklucz inne przyczyny objawów (AABB 2023, NICE NG24'+(ckd?', KDIGO PP 4.4':'')+').');
 if(ckd&&bel&&!sym)o.notes.push('PChN bez objawów: KDIGO – unikać przetoczenia u bezobjawowych; rozważ ESA/żelazo.');
 if(ckd&&i.tx==='yes')o.notes.push('Kandydat do przeszczepu nerki: unikać przetoczeń (ryzyko alloimmunizacji HLA) – tylko gdy korzyść przewyższa ryzyko (KDIGO); jeśli konieczne – poinformuj ośrodek transplantacyjny.');
 if(ckd)o.notes.push('ESA: KDIGO – przy niedokrwistości PChN rozważ ESA i suplementację żelaza (nie w SOR jako leczenie doraźne); hiperkaliemia – kontrola K⁺ (ryzyko wzrostu K⁺ po przetoczeniu, zwłaszcza starszych jednostek); przewodnienie – ocena wolemii.');
 if(ckd&&i.ckd==='hd')o.notes.push('Dializowany: rozważ przetoczenie w trakcie hemodializy (kontrola objętości i K⁺) – praktyka kliniczna, brak rekomendacji KDIGO.');
 if(ckd&&i.ckd==='hd')o.dd.push('Przetaczanie w trakcie dializy – praktyka, bez rekomendacji KDIGO.');
 /* jednostki */
 var transfuse=o.dec!=='NIE';o.taco=i.taco==='yes';
 if(transfuse&&!unst){var ru=TB?TB.rbcUnitsW(hb,rl.goal,i.w):null;o.ru=ru;o.unitsTotal=ru?ru.units:null;
  if(ru&&vol!==UNIT_ML){var inc=vol/(ML_PER_KG_G*i.w),u=Math.max(1,Math.ceil((rl.goal-hb)/inc-1e-9));o.unitsTotal=hb>=rl.goal?null:u;o.inc=inc;}else if(ru)o.inc=ru.conv.incPerUnit;
  o.unitsNow=chronic||o.taco?1:o.unitsTotal;if(!(i.w>0))o.unitsNote='Podaj masę ciała – liczba jednostek z masy (≈4 ml/kg KKCz → +1 g/dl; 1 j. ≈ +1 g/dl przy ~70 kg).';
  else if(o.unitsTotal==null)o.unitsNote='Hb ≥ celu obliczeniowego '+rl.goal+' g/dl – przy decyzji objawowej 1 jednostka i ponowna ocena.';
  if(o.unitsTotal==null&&i.w>0)o.unitsNow=1;}
 o.rate=transfuse?rate(i,vol,o.taco,unst):null;if(o.rate)o.dd=o.dd.concat(o.rate.dd);if(o.rate)o.src.push('BSH','PL');if(o.taco&&o.rate&&o.rate.mode==='taco')o.src.push('UTD');
 /* monitorowanie i kontrola Hb */
 o.mon=['Przed każdą jednostką, po 15 min i po zakończeniu: temperatura, tętno, ciśnienie (Rozp. MZ); pierwsze 15 min – wolno, pod obserwacją przy łóżku.','Rozpoczęcie ≤30 min od wydania z banku krwi; jedna jednostka KKCz ≤4 h (Rozp. MZ).','Obserwacja 24 h po przetoczeniu (oddział) lub ≥2 h przy wypisie (Rozp. MZ).'];
 if(o.taco)o.mon.push('Ryzyko TACO: SpO₂, częstość oddechów, osłuchiwanie, bilans płynów; nowa duszność/↑RR/↓SpO₂ – przerwij przetoczenie (BSH 2017).');
 o.hbCtl=unst?'Hb/hematokryt często (np. POCT) w trakcie resuscytacji – cel 7–9 g/dl po opanowaniu krwawienia; MTP – zakładka „Masywne przetoczenie”.':transfuse?(chronic||o.taco?'Kontrola Hb po każdej jednostce, przed decyzją o kolejnej (NICE NG24 – pojedyncza jednostka i ponowna ocena).':'Kontrola Hb po każdej jednostce i przy zmianie stanu (ryzyko dalszego krwawienia).'):'Kontrola Hb wg stanu klinicznego.';
 o.text=copyText(i,o);return o;}
function copyText(i,o){var L=[],rl=o.rule;L.push('Kreator przetoczenia KKCz: '+o.decTxt+'.');L.push('Wskazanie: '+rl.txt);
 if(fin(i.hb))L.push('Hb '+pl(i.hb,1)+' g/dl; próg '+(rl.thr==null?'—':(rl.op==='le'?'≤':'<')+rl.thr+' g/dl')+'; cel '+rl.target+'.');
 if(i.sym)L.push('Objawy niedokrwistości: '+(i.sym==='yes'?'tak':'nie')+'. Ryzyko TACO: '+(o.taco?'tak':'nie')+'.');
 if(o.dec!=='NIE'){if(o.rule.op==='any')L.push('KKCz: przetaczać natychmiast wg hemodynamiki / MTP.');
  else if(o.unitsNow)L.push('KKCz: '+o.unitsNow+' j. teraz'+(o.unitsTotal&&o.unitsTotal!==o.unitsNow?' (do celu orientacyjnie '+o.unitsTotal+' j.)':'')+(o.inc?'; przyrost ≈'+pl(o.inc,1)+' g/dl/j. przy '+pl(i.w,0)+' kg':'')+'.');
  if(o.rate)L.push('Szybkość: '+o.rate.txt+' Objętość jednostki '+o.vol+' ml'+(o.volLabel?' (z etykiety)':' (orientacyjnie – rzeczywista z etykiety)')+'.');}
 L.push('Monitorowanie: temperatura, tętno, ciśnienie tętnicze przed, po 15 min i po zakończeniu każdej jednostki.');L.push('Kontrola Hb: '+o.hbCtl);
 if(o.kkp)L.push('KKP: '+o.kkp.txt);L.push('Decyzja i zlecenie – lekarz.');return L.join('\n');}
return{SRC:SRC,Q:Q,SYM:SYM,UNIT_ML:UNIT_ML,steps:steps,missing:missing,tacoAuto:tacoAuto,rule:rule,rate:rate,plt:plt,plan:plan,copyText:copyText};});
