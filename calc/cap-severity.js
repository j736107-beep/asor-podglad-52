// Asystent SOR 5.2 (testowa, 09.11.2026) – JEDEN silnik ciężkości PZP i miejsca leczenia.
// Używany przez zakładkę „Skale i hospitalizacja” (clinical-ui.js) ORAZ moduł antybiotykoterapii (mod/zp).
// Zasady (SPEC 5.2, P1): PSI liczony automatycznie (bez ręcznego wyboru klasy), małe/duże kryteria ATS/IDSA 2019 liczone z danych,
// brak danych NIE otwiera drogi do domu, ręczna zmiana miejsca leczenia tylko W GÓRĘ.
// Progi zaakceptowane przez lekarza 09.11.2026: SpO₂ <85% → konsultacja OIT; SpO₂ 85–91% → oddział; PSI III → krótka obserwacja.
(function(root,f){var m=f();if(typeof module==='object'&&module.exports)module.exports=m;else root.CAPSEV=m;})(this,function(){
'use strict';
var SPO2_ICU=85,SPO2_WARD=92; // zaakceptowane przez lekarza 09.11.2026
function num(v){if(typeof v==='number')return v;v=String(v==null?'':v).replace(',','.').trim();return v===''?NaN:parseFloat(v);}
function fin(v){return typeof v==='number'&&isFinite(v);}
function norm(i){i=i||{};var o={};for(var k in i)o[k]=i[k];
 ['age','rr','sbp','dbp','hr','temp','urea','na','glu','ph','hct','pao2','spo2','pf','wbc','platelets'].forEach(function(k){o[k]=num(i[k]);});
 if(o.ventilation===undefined&&typeof i.vent==='boolean')o.ventilation=i.vent;
 if(o.vasopressor===undefined&&typeof i.vaso==='boolean')o.vasopressor=i.vaso;
 if(o.sex==='K'||o.sex==='k')o.sex='f';if(o.sex==='M')o.sex='m';
 return o;}
function curb(i){var missing=[],items=[],score=0;
 function n(key,lab,fn){if(!fin(i[key]))missing.push(lab.split(' ')[0]);else if(fn(i[key])){score++;items.push(lab);}}
 if(typeof i.confusion!=='boolean')missing.push('splątanie');else if(i.confusion){score++;items.push('splątanie');}
 n('urea','mocznik >7 mmol/l',function(v){return v>7;});n('rr','oddechy ≥30/min',function(v){return v>=30;});
 if(!fin(i.sbp)||!fin(i.dbp)){if((fin(i.sbp)&&i.sbp<90)||(fin(i.dbp)&&i.dbp<=60)){score++;items.push('hipotensja');}else missing.push('SBP i DBP');}else if(i.sbp<90||i.dbp<=60){score++;items.push('hipotensja');}
 n('age','wiek ≥65',function(v){return v>=65;});
 return{score:score,complete:missing.length===0,missing:missing,items:items};}
var psiFlags=[['nursing',10,'dom opieki'],['cancer',30,'nowotwór'],['liver',20,'choroba wątroby'],['heart',10,'niewydolność serca'],['stroke',10,'choroba naczyniowa mózgu'],['renal',10,'choroba nerek'],['confusion',20,'zaburzenia świadomości'],['effusion',10,'płyn opłucnowy']];
var psiNumbers=[['rr',20,'oddechy',function(v){return v>=30;}],['sbp',20,'SBP',function(v){return v<90;}],['temp',15,'temperatura',function(v){return v<35||v>=40;}],['hr',10,'HR',function(v){return v>=125;}],['ph',30,'pH tętnicze',function(v){return v<7.35;}],['urea',20,'mocznik',function(v){return v>=10.71;}],['na',20,'Na',function(v){return v<130;}],['glu',10,'glukoza',function(v){return v>=13.88;}],['hct',10,'hematokryt',function(v){return v<30;}]];
function psi(i){var score=0,missing=[],breakdown=[];
 if(!fin(i.age)||i.age<18)missing.push('wiek dorosłego');else{score=i.age-(i.sex==='f'?10:0);breakdown.push(['wiek/płeć',score]);}
 if(['m','f'].indexOf(i.sex)<0)missing.push('płeć');
 psiFlags.forEach(function(x){if(typeof i[x[0]]!=='boolean')missing.push(x[2]);else if(i[x[0]]){score+=x[1];breakdown.push([x[2],x[1]]);}});
 psiNumbers.forEach(function(x){if(!fin(i[x[0]]))missing.push(x[2]);else if(x[3](i[x[0]])){score+=x[1];breakdown.push([x[2],x[1]]);}});
 var oxK=fin(i.pao2)||fin(i.spo2),oxL=(fin(i.pao2)&&i.pao2<60)||(fin(i.spo2)&&i.spo2<90);
 if(!oxK)missing.push('PaO₂ / SpO₂');else if(oxL){score+=10;breakdown.push(['hipoksemia',10]);}
 var sf=['cancer','liver','heart','stroke','renal','confusion'];
 var step1=fin(i.age)&&i.age<=50&&i.age>=18&&sf.every(function(k){return i[k]===false;})&&fin(i.rr)&&i.rr<30&&fin(i.sbp)&&i.sbp>=90&&fin(i.hr)&&i.hr<125&&fin(i.temp)&&i.temp>=35&&i.temp<40;
 var cls=step1?'I':score<=70?'II':score<=90?'III':score<=130?'IV':'V';
 // klasa „co najmniej IV/V” rozpoznawalna już przy niepełnych danych (punkty tylko rosną)
 var atLeast=step1?'I':score>130?'V':score>90?'IV':score>70?'III':'';
 return{score:score,cls:cls,step1:step1,complete:step1||missing.length===0,missing:step1?[]:missing,breakdown:breakdown,atLeast:atLeast};}
var MAJ={ventilation:'wentylacja mechaniczna (inwazyjna)',vasopressor:'wstrząs septyczny wymagający wazopresorów'};
var MIN={rr:'oddechy ≥30/min',pf:'PaO₂/FiO₂ ≤250 mmHg',urea:'mocznik ≥7,14 mmol/l (BUN ≥20 mg/dl)',wbc:'leukopenia <4 G/l (z powodu zakażenia)',platelets:'małopłytkowość <100 G/l',temp:'hipotermia <36 °C',multilobar:'nacieki wielopłatowe',confusion:'splątanie / dezorientacja',fluidHypotension:'hipotensja wymagająca intensywnej płynoterapii'};
function severeCap(i){var major=[],minor=[],missing=[];
 ['ventilation','vasopressor'].forEach(function(k){if(i[k]===true)major.push(k);else if(typeof i[k]!=='boolean')missing.push(k);});
 [['rr',function(v){return v>=30;}],['pf',function(v){return v<=250;}],['urea',function(v){return v>=7.14;}],['wbc',function(v){return v<4;}],['platelets',function(v){return v<100;}],['temp',function(v){return v<36;}]].forEach(function(x){if(!fin(i[x[0]]))missing.push(x[0]);else if(x[1](i[x[0]]))minor.push(x[0]);});
 ['multilobar','confusion','fluidHypotension'].forEach(function(k){if(i[k]===true)minor.push(k);else if(typeof i[k]!=='boolean')missing.push(k);});
 return{severe:major.length>0||minor.length>=3,major:major,minor:minor,missing:missing,complete:missing.length===0,majorTxt:major.map(function(k){return MAJ[k];}),minorTxt:minor.map(function(k){return MIN[k];})};}
var RANK={home:0,obs:0,ward:1,icu:2};
var LABEL={home:'Leczenie domowe możliwe',obs:'Krótka obserwacja w SOR – dom możliwy tylko po decyzji lekarza',ward:'HOSPITALIZACJA – oddział (wypis do domu zablokowany)',icu:'CIĘŻKIE PZP – sugerowany OIOM / OIT (wypis do domu zablokowany)'};
// Deterministyczne miejsce leczenia. Zwraca {place, homeBlocked, icuSuggest, reasons[], missing[], curb, psi, severe, complete}
function assess(raw){var i=norm(raw),c=curb(i),p=psi(i),s=severeCap(i),R=[],place='home',icu=false,ward=false,why;
 function up(pl,t){R.push(t);if(RANK[pl]>RANK[place]||(pl==='obs'&&place==='home'))place=pl;}
 if(s.major.length)up('icu','duże kryterium ciężkiego PZP (ATS/IDSA 2019): '+s.majorTxt.join(', ')+' → OIT obowiązkowo');
 if(s.minor.length>=3)up('icu','≥3 małe kryteria ciężkiego PZP (ATS/IDSA 2019): '+s.minorTxt.join(', ')+' → OIT');
 if(fin(i.spo2)&&i.spo2<SPO2_ICU)up('icu','SpO₂ '+i.spo2+'% (<'+SPO2_ICU+'%) – ciężka hipoksemia → pilna konsultacja OIT');
 if(c.score>=3)up('icu','CURB-65 '+c.score+'/5 – ciężkie PZP → oddział z rozważeniem OIT (NPOA 2016 / BTS)');
 var pc=p.complete?p.cls:p.atLeast;
 if(pc==='IV'||pc==='V')up('ward','PSI '+(p.complete?'':'co najmniej ')+'klasa '+pc+' ('+p.score+' pkt) – leczenie szpitalne');
 if(c.score===2)up('ward','CURB-65 2/5 – leczenie szpitalne');
 if(fin(i.spo2)&&i.spo2<SPO2_WARD&&i.spo2>=SPO2_ICU)up('ward','SpO₂ '+i.spo2+'% (<'+SPO2_WARD+'%) – hipoksemia → oddział');
 if(fin(i.sbp)&&i.sbp<90)up('ward','SBP <90 mmHg');
 if(i.oral===false)up('ward','brak tolerancji leczenia doustnego');
 var miss=[];if(!c.complete)miss.push('CURB-65: '+c.missing.join(', '));if(!p.complete)miss.push('PSI: '+p.missing.join(', '));if(!fin(i.spo2)&&!fin(i.pao2))miss.push('SpO₂');
 if(place==='home'&&miss.length)up('ward','dane niepełne – domyślnie oddział, wypis do domu zablokowany do czasu uzupełnienia ('+miss.join('; ')+')');
 if(place==='home'){if(p.cls==='III')up('obs','PSI klasa III ('+p.score+' pkt) – krótka obserwacja / ocena warunków opieki przed decyzją o domu');
  else R.push('PSI klasa '+p.cls+(p.step1?' (reguła pierwszego etapu)':' ('+p.score+' pkt)')+', CURB-65 '+c.score+'/5 – niskie ryzyko; dom możliwy, jeśli są warunki opieki');}
 var blocked=RANK[place]>=1;
 return{place:place,label:LABEL[place],homeBlocked:blocked,icuSuggest:place==='icu',icuMandatory:s.major.length>0,reasons:R,missing:miss,curb:c,psi:p,severe:s,complete:c.complete&&p.complete&&s.complete,input:i};}
// ręczna zmiana tylko w górę
function allowed(manual,auto){if(!manual)return true;return RANK[manual]>=RANK[auto];}
return{assess:assess,allowed:allowed,curb:curb,psi:psi,severeCap:severeCap,norm:norm,RANK:RANK,LABEL:LABEL,MIN:MIN,MAJ:MAJ,SPO2_ICU:SPO2_ICU,SPO2_WARD:SPO2_WARD,psiFlags:psiFlags,psiNumbers:psiNumbers};});
