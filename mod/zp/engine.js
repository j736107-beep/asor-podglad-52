// Zapalenie płuc – dobór antybiotykoterapii u dorosłych (Asystent SOR 5.1, 03.11.2026).
// Kolejność źródeł: NPOA 2016 (Rekomendacje postępowania w pozaszpitalnych zakażeniach układu oddechowego), ATS/IDSA 2019 (+ ATS 2025),
// ERS/ESICM/ESCMID/ALAT 2023, BTS / NICE NG138. Dawki i korekty nerkowe: ChPL z RPL (rejestrymedyczne.ezdrowie.gov.pl), pobrane 03.11.2026.
// Zasada: brak danych → brak dawki; rozbieżności pokazane obok siebie z dopiskiem DO DECYZJI LEKARZA. Nie zawiera tekstów Indeksu MP.
(function(root,f){var m=f();if(typeof module==='object'&&module.exports)module.exports=m;else root.ZP=m;})(this,function(){
'use strict';
var DEC='DO DECYZJI LEKARZA',LOK='STANDARD LOKALNY – zatwierdzony przez lekarza',PROP='PROPOZYCJA – DO AKCEPTACJI LEKARZA';
var RPL='https://rejestrymedyczne.ezdrowie.gov.pl/api/rpl/medicinal-products/';
var S={
 npoa:{n:'NPOA 2016 – Rekomendacje postępowania w pozaszpitalnych zakażeniach układu oddechowego (PZP u dorosłych, rek. 6, 9, 10; leczenie skorygowane s. 171–172)',url:'https://antybiotyki.edu.pl/wp-content/uploads/Rekomendacje/Rekomendacje2016.pdf'},
 ats:{n:'ATS/IDSA 2019 – Metlay i wsp., Am J Respir Crit Care Med 2019;200:e45 (tab. 3 i 4)',url:'https://www.atsjournals.org/doi/10.1164/rccm.201908-1581ST'},
 ats25:{n:'ATS 2025 – aktualizacja wytycznych PZP (GKS, czas leczenia)',url:'https://www.atsjournals.org/doi/10.1164/rccm.202507-1692ST'},
 ers:{n:'ERS/ESICM/ESCMID/ALAT 2023 – ciężkie PZP, Eur Respir J 2023;61:2200735',url:'https://erj.ersjournals.com/content/61/4/2200735'},
 idsaal:{n:'IDSA/AAAAI/ACAAI 2022 – Drug allergy: practice parameter update (β-laktamy, aztreonam)',url:'https://www.jacionline.org/article/S0091-6749(22)01186-1/fulltext'},
 nice:{n:'NICE NG138 (2019) – Pneumonia (community-acquired): antimicrobial prescribing; BTS 2009/2015',url:'https://www.nice.org.uk/guidance/ng138'},
 mandell:{n:'Mandell LA, Niederman MS – Aspiration Pneumonia, N Engl J Med 2019;380:651–663 (beztlenowce tylko przy ropniu/ropniaku/martwicy)',url:'https://www.nejm.org/doi/full/10.1056/NEJMra1714562'},
 allewelt:{n:'Allewelt M i wsp. – Ampicylina/sulbaktam vs klindamycyna ± cefalosporyna w zachłystowym PZP i ropniu płuca, Clin Microbiol Infect 2004;10:163–170',url:'https://www.clinicalmicrobiologyandinfection.org/article/S1198-743X(14)64706-6/fulltext'},
 ott:{n:'Ott SR i wsp. – Moksyfloksacyna vs ampicylina/sulbaktam w zachłystowym PZP i ropniu płuca, Infection 2008;36:23–30',url:'https://pubmed.ncbi.nlm.nih.gov/18231720/'},
 btspl:{n:'BTS 2023 – Guideline for pleural disease (zakażenie opłucnej / ropniak), Thorax 2023;78(S3); BTS 2010 – pleural infection',url:'https://doi.org/10.1136/thorax-2023-220304'},
 msd:{n:'MSD Manual Professional – Lung abscess (leczenie: β-laktam z inhibitorem; alternatywy; czas do poprawy radiologicznej)',url:'https://www.msdmanuals.com/professional/pulmonary-disorders/lung-abscess/lung-abscess'}
};
// ChPL z RPL – identyfikatory produktów sprawdzone 03.11.2026
var CH={amox:[531,'Amotaks 1 g tabl.'],amoxclav_po:[16004,'AMOclan 875 mg + 125 mg tabl.'],amoxclav_iv:[520,'Amoksiklav 1000 mg + 200 mg i.v.'],amp:[43622,'Ampicillin Adamed i.v.'],ampsul:[43641,'Ampicilin + Sulbactam AptaPharma 2 g + 1 g i.v.'],amoxclav_po4:[522,'Amoksiklav 500 mg + 125 mg tabl.'],clinda_po:[37392,'Clindamycin Mylan 300 mg kaps.'],
 cftx:[41102,'Ceftriaxon AptaPharma 1 g / 2 g i.v.'],cfx:[1063,'Biotaksym 1 g i.v.'],cfur:[24624,'Cefuroxim Kabi 750 mg / 1,5 g i.v.'],clari_po:[37744,'Clarithromycin Genoptim tabl.'],clari_iv:[43851,'Clarithromycin hameln 500 mg i.v.'],
 azi:[12266,'Azibiot 500 mg tabl.'],doxy:[40734,'Doxycycline Genoptim 100 mg kaps.'],levo_iv:[50375,'Levofloxacin AptaPharma 5 mg/ml i.v.'],levo_po:[41800,'Levocin 500 mg tabl.'],moxi_iv:[33144,'Moloxin 400 mg/250 ml i.v.'],moxi_po:[37890,'Kimoks 400 mg tabl.'],
 ptz:[48494,'Piperacillin + Tazobactam Accord 4 g + 0,5 g i.v.'],cfep:[33273,'Cefepim MIP Pharma 1 g / 2 g i.v.'],cftz:[1065,'Biotum 1 g / 2 g i.v.'],mero:[4281,'Meronem 500 mg / 1 g i.v.'],vanco:[2112,'Edicin 500 mg / 1 g i.v.'],linez:[14767,'Dilizolen 2 mg/ml (600 mg/300 ml) i.v.'],
 cipro:[1447,'Ciprinol 400 mg/200 ml i.v.'],
 metro:[8679,'Metronidazol 0,5% Fresenius i.v.'],clinda:[42092,'Clindamycin hameln 150 mg/ml i.v.']};
function chUrl(k){return RPL+CH[k][0]+'/characteristic';}
function fmt(x,d){if(!isFinite(x))return '–';var p=Math.pow(10,d==null?0:d);return String(Math.round(x*p)/p).replace('.',',');}
function num(v){if(typeof v==='number')return v;v=String(v==null?'':v).replace(',','.').trim();return v===''?NaN:parseFloat(v);}
// ---------- skale ----------
// CURB-65: splątanie; mocznik >7 mmol/l (BTS); RR ≥30; SBP <90 lub DBP ≤60; wiek ≥65.
function curb65(i){var miss=[],sc=0;
 function add(v,ok,l){if(v===undefined||v===null||(typeof v==='number'&&!isFinite(v)))miss.push(l);else if(ok(v))sc++;}
 add(i.confusion,function(v){return v===true;},'splątanie');
 add(num(i.urea),function(v){return v>7;},'mocznik (mmol/l)');
 add(num(i.rr),function(v){return v>=30;},'oddechy');
 var sbp=num(i.sbp),dbp=num(i.dbp);if(!isFinite(sbp)&&!isFinite(dbp))miss.push('ciśnienie');else if((isFinite(sbp)&&sbp<90)||(isFinite(dbp)&&dbp<=60))sc++;
 add(num(i.age),function(v){return v>=65;},'wiek');
 return{score:sc,complete:!miss.length,missing:miss,crb:sc-(num(i.urea)>7?1:0)};}
// 5.2: miejsce leczenia z JEDNEGO silnika (calc/cap-severity.js) – PSI liczony automatycznie, małe/duże kryteria ATS/IDSA z danych.
function CS(){if(typeof CAPSEV!=='undefined')return CAPSEV;if(typeof window!=='undefined'&&window.CAPSEV)return window.CAPSEV;if(typeof require==='function')return require('../../calc/cap-severity.js');throw new Error('brak silnika CAPSEV');}
// 11.11.2026 (lekarz): brak rekomendacji domyślnej – p=null, dopóki brak minimum danych (CURB-65 + SpO₂)
function place(i){var a=CS().assess(i);return{p:a.place,ready:a.ready,c:a.curb,why:a.reasons,auto:true,a:a,blocked:false};}
// ---------- nerki ----------
function crcl(i){var m=num(i.crclManual);if(isFinite(m)&&m>0)return{v:m,src:'wpisany ręcznie',auto:false};
 var a=num(i.age),w=num(i.w),cr=num(i.crea),note='';if(i.creaU==='umol')cr=cr/88.42;else if(cr>25&&cr<=1800){cr=cr/88.42;note='Kreatynina '+String(num(i.crea)).replace('.',',')+' > 25 – przyjęto µmol/l (sprawdź jednostkę).';}
 var miss=[];if(!(a>=18&&a<=110))miss.push('wiek');if(!(i.sex==='m'||i.sex==='f'))miss.push('płeć');if(!(w>=30&&w<=250))miss.push('masa');if(!(cr>=0.2&&cr<=20))miss.push('kreatynina');
 if(miss.length)return{v:NaN,src:'brak danych: '+miss.join(', '),auto:true,missing:miss};
 var v=(140-a)*w/(72*cr)*(i.sex==='f'?0.85:1);var c2=Math.round(cr*100)/100,F2=function(x){return String(Math.round(x*100)/100).replace('.',',');};
 return{v:Math.round(v),src:'Cockcroft–Gault, masa rzeczywista',auto:true,f:'(140 − '+F2(a)+') × '+F2(w)+' kg / (72 × '+F2(c2)+' mg/dl)'+(i.sex==='f'?' × 0,85':''),note:note};}
// korekty nerkowe wg ChPL (zwraca {t, mod, avoid, dec})
function R(k,c,ctx){ctx=ctx||{};var hd=ctx.hd===true,w=num(ctx.w),T=function(t,o){o=o||{};o.t=t;return o;};
 if(!isFinite(c)&&!hd)return T('CrCl nieznany – nie oceniono korekty nerkowej',{unk:true});
 switch(k){
 case 'amox':if(hd)return T('HD (ChPL): 15 mg/kg raz na dobę'+(isFinite(w)?' ≈ '+fmt(w*15)+' mg':'')+'; dodatkowo 15 mg/kg przed i po dializie',{mod:1});
  if(c>30)return T('bez korekty (CrCl >30)');if(c>=10)return T('ChPL: maks. 500 mg dwa razy na dobę (CrCl 10–30)',{mod:1});return T('ChPL: maks. 500 mg na dobę (CrCl <10)',{mod:1});
 case 'amoxclav_po':if(hd||c<30)return T('ChPL: postać 7:1 (875/125) NIEZALECANA przy CrCl <30 – wybierz postać i.v. z korektą lub inny lek',{avoid:1});return T('bez korekty (CrCl ≥30)');
 case 'amoxclav_iv':if(hd)return T('HD (ChPL): 1,2 g, potem 600 mg co 24 h + 600 mg na koniec dializy',{mod:1});if(c>30)return T('bez korekty (CrCl >30)');if(c>=10)return T('ChPL: 1,2 g, potem 600 mg (500/100) co 12 h',{mod:1});return T('ChPL: 1,2 g, potem 600 mg (500/100) co 24 h',{mod:1});
 case 'amoxclav_po4':if(hd)return T('HD (ChPL): 500/125 mg co 24 h + dodatkowa dawka w czasie dializy, powtórzona na koniec dializy',{mod:1});if(c>30)return T('bez korekty (CrCl >30)');if(c>=10)return T('ChPL: 500/125 mg dwa razy na dobę (CrCl 10–30)',{mod:1});return T('ChPL: 500/125 mg raz na dobę (CrCl <10)',{mod:1});
 case 'ampsul':if(hd)return T('HD (ChPL): podać bezpośrednio po dializie, dalej co 48 h',{mod:1});if(c>30)return T('bez korekty (CrCl >30: co 6–8 h)');if(c>=15)return T('ChPL: ta sama dawka co 12 h (CrCl 15–30)',{mod:1});if(c>=5)return T('ChPL: ta sama dawka co 24 h (CrCl 5–14)',{mod:1});return T('ChPL: ta sama dawka co 48 h (CrCl <5)',{mod:1});
 case 'amp':if(c>30&&!hd)return T('bez korekty (CrCl >30)');if(c>=20&&!hd)return T('ChPL: ⅔ dawki (≈ 670 mg co 6 h); ciężka niewydolność – nie więcej niż 1 g co 8 h',{mod:1});return T('ChPL: ⅓ dawki (≈ 330 mg co 6 h); nie więcej niż 1 g co 8 h',{mod:1});
 case 'cftx':if(hd)return T('HD: bez dawki uzupełniającej; maks. 2 g/dobę (ChPL)');if(c<10)return T('ChPL: maks. 2 g na dobę (CrCl <10)',{mod:1});return T('bez korekty (ChPL), o ile wątroba wydolna');
 case 'cfx':if(c<5||hd)return T('ChPL (Biotaksym): CrCl <5 – po dawce 1 g dawka dobowa o połowę (np. 2 g co 8 h → 1 g co 8 h)',{mod:1});return T('bez korekty (ChPL: tylko CrCl <5)');
 case 'clari':if(hd||c<30)return T('ChPL: dawka o połowę – 250 mg co 12 h (CrCl <30); maks. 14 dni',{mod:1});return T('bez korekty');
 case 'azi':if(c<10||hd)return T('ChPL: GFR <10 – ostrożnie (bez schematu korekty)',{dec:1});return T('bez korekty (GFR ≥10)');
 case 'doxy':return T('bez korekty nerkowej');
 case 'levo500x2':if(hd||c<10)return T('ChPL: 500 mg, potem 125 mg co 24 h (bez dawek po HD)',{mod:1});if(c<20)return T('ChPL: 500 mg, potem 125 mg co 12 h',{mod:1});if(c<=50)return T('ChPL: 500 mg, potem 250 mg co 12 h',{mod:1});return T('bez korekty (CrCl >50)');
 case 'levo500':if(hd||c<20)return T('ChPL: 500 mg, potem 125 mg co 24 h',{mod:1});if(c<=50)return T('ChPL: 500 mg, potem 250 mg co 24 h',{mod:1});return T('bez korekty (CrCl >50)');
 case 'moxi':return T('bez korekty (ChPL – także HD/CAPD)');
 case 'ptz':if(hd)return T('HD (ChPL): maks. 4,5 g co 12 h + 2,25 g po każdej dializie',{mod:1});if(c>40)return T('bez korekty (CrCl >40)');if(c>=20)return T('ChPL: maks. 4,5 g co 8 h (CrCl 20–40)',{mod:1});return T('ChPL: maks. 4,5 g co 12 h (CrCl <20)',{mod:1});
 case 'cfep':if(hd)return T('HD (ChPL): 1 g w 1. dobie, potem 500 mg/dobę, po dializie',{mod:1});if(c>50)return T('bez korekty (CrCl >50)');if(c>=30)return T('ChPL (zapalenie płuc): 2 g co 24 h',{mod:1});if(c>10)return T('ChPL: 1 g co 24 h',{mod:1});return T('ChPL: 0,5 g co 24 h',{mod:1});
 case 'cftz':if(c>50&&!hd)return T('bez korekty (CrCl >50)');if(hd)return T('ChPL: dawka nasycająca 1 g; dalej wg tabeli ChPL i po dializie – '+DEC,{mod:1,dec:1});if(c>30)return T('ChPL: 1 g, potem 1 g co 12 h',{mod:1});if(c>=16)return T('ChPL: 1 g, potem 1 g co 24 h',{mod:1});if(c>=6)return T('ChPL: 1 g, potem 0,5 g co 24 h',{mod:1});return T('ChPL: 1 g, potem 0,5 g co 48 h',{mod:1});
 case 'mero':if(hd)return T('HD (ChPL): dawka po zakończeniu dializy (jak CrCl <10: 500 mg co 24 h)',{mod:1});if(c>50)return T('bez korekty (CrCl >50)');if(c>=26)return T('ChPL: 1 g co 12 h',{mod:1});if(c>=10)return T('ChPL: 500 mg co 12 h',{mod:1});return T('ChPL: 500 mg co 24 h',{mod:1});
 case 'vanco':if(hd)return T('ChPL: dawka nasycająca bez zmniejszania; dalej WYŁĄCZNIE wg stężeń (dawka uzupełniająca po HD)',{mod:1,tdm:1});if(c>=50)return T('ChPL: 15–20 mg/kg co 8–12 h, dalej wg stężeń',{tdm:1});if(c>=20)return T('ChPL: 15–20 mg/kg co 24 h (CrCl 20–49), wg stężeń',{mod:1,tdm:1});return T('ChPL: CrCl <20 – kolejne dawki WYŁĄCZNIE wg stężenia minimalnego',{mod:1,tdm:1});
 case 'linez':if(hd)return T('ChPL: bez korekty; podawać po dializie; ostrożnie (metabolity)',{dec:0});if(c<30)return T('ChPL: bez korekty, ale CrCl <30 – stosować tylko gdy korzyść > ryzyko (kumulacja metabolitów)');return T('bez korekty');
 case 'cipro':if(hd)return T('ChPL: 200–400 mg co 24 h, po dializie',{mod:1});if(c>60)return T('bez korekty (CrCl >60)');if(c>=30)return T('ChPL: 200–400 mg co 12 h (CrCl 30–60)',{mod:1});return T('ChPL: 200–400 mg co 24 h (CrCl <30)',{mod:1});
 case 'metro':return T('bez korekty nerkowej (ChPL); ciężka niewydolność wątroby – ⅓ dawki raz na dobę');
 case 'clinda':if(c<30||hd)return T('ChPL: ciężka niewydolność nerek – monitoruj stężenie; ewentualnie odstęp 8–12 h',{dec:1});return T('bez korekty (lekka/umiarkowana niewydolność)');
 }return T(DEC);}
// ---------- leki (dawki z ChPL; obok – dawka z wytycznych, gdy inna) ----------
// q – co ile; days – domyślny czas; qt – wydłuża QT; preg: 'ok'|'caution'|'avoid'
var D={
 amox:{n:'Amoksycylina',ch:'amox',route:'p.o.',dose:'1 g',q:'co 8 h',r:'amox',preg:'ok',cls:'pen',g:'NPOA 2016 rek. 6: 3 × 1 g p.o. (ChPL PZP: 500 mg–1 g co 8 h). NICE NG138: 500 mg co 8 h – informacja źródłowa.',lok:'1 g co 8 h (większa dawka, NPOA); korekta nerkowa wg ChPL'},
 amoxclav_po:{n:'Amoksycylina z kwasem klawulanowym',ch:'amoxclav_po',route:'p.o.',dose:'875/125 mg',q:'co 8 h',r:'amoxclav_po',preg:'ok',cls:'pen',g:'ChPL: 875/125 mg 2×/dobę; większa dawka 3×/dobę w zakażeniach dolnych dróg oddechowych. ATS/IDSA: 875/125 mg co 12 h. NPOA: postać SR 2000/125 mg co 12 h.'},
 amoxclav_iv:{n:'Amoksycylina z kwasem klawulanowym',ch:'amoxclav_iv',route:'i.v.',dose:'1,2 g (1000/200 mg)',q:'co 8 h',r:'amoxclav_iv',preg:'ok',cls:'pen',g:'NPOA 2016 rek. 6: 3 × 1,2 g i.v. (= ChPL).'},
 amp:{n:'Ampicylina',ch:'amp',route:'i.v.',dose:'1 g',q:'co 6 h',r:'amp',preg:'ok',cls:'pen',g:'NPOA 2016 rek. 6: 4 × 1 g i.v. (ChPL: 500 mg–2 g 4–6 ×/dobę).'},
 cftx:{n:'Ceftriakson',ch:'cftx',route:'i.v.',dose:'2 g',q:'co 24 h',r:'cftx',preg:'ok',cls:'ceph',g:'ChPL PZP: 1–2 g raz na dobę; NPOA rek. 10: 1–2 g/dobę wg ciężkości; ATS/IDSA: 1–2 g/dobę.'},
 cftx1:{n:'Ceftriakson',ch:'cftx',route:'i.v.',dose:'1–2 g',q:'co 24 h',r:'cftx',preg:'ok',cls:'ceph',g:'ChPL PZP: 1–2 g raz na dobę; NPOA rek. 10: 1–2 g wg ciężkości.'},
 cfx:{n:'Cefotaksym',ch:'cfx',route:'i.v.',dose:'1–2 g',q:'co 8 h',r:'cfx',preg:'ok',cls:'ceph',g:'NPOA rek. 10: 1–2 g co 8 h (ChPL: 2–3 g co 8 h w zakażeniach krytycznych).'},
 clari_iv:{n:'Klarytromycyna',ch:'clari_iv',route:'i.v.',dose:'500 mg',q:'co 12 h',r:'clari',qt:1,preg:'caution',cls:'mac',g:'ChPL i.v.: 1 g/dobę w 2 dawkach, i.v. 2–5 dni, potem p.o.; łącznie ≤14 dni.',lok:'makrolid i.v. z wyboru (azytromycyny i.v. brak w szpitalu)'},
 clari_po:{n:'Klarytromycyna',ch:'clari_po',route:'p.o.',dose:'500 mg',q:'co 12 h',r:'clari',qt:1,preg:'caution',cls:'mac',g:'NPOA rek. 10: 500 mg co 12 h p.o.; ChPL: ciężkie zakażenia 500 mg co 12 h, PZP 6–14 dni. NICE: 500 mg co 12 h.'},
 azi:{n:'Azytromycyna',ch:'azi',route:'p.o.',dose:'500 mg w 1. dobie, potem 250 mg',q:'co 24 h (dni 2–5)',r:'azi',qt:1,preg:'caution',cls:'mac',days:'5 dni (łącznie 1,5 g)',g:'NPOA rek. 10 i ChPL: 500 mg dzień 1, potem 250 mg dni 2–5; ChPL – alternatywnie 500 mg/dobę przez 3 dni. Wyłącznie p.o.: azytromycyny i.v. brak w RPL i w szpitalu – nie proponowana.'},
 doxy:{n:'Doksycyklina',ch:'doxy',route:'p.o.',dose:'200 mg w 1. dobie, potem 100 mg',q:'co 24 h (cięższe: 200 mg/dobę)',r:'doxy',preg:'avoid',cls:'tet',g:'ChPL: 200 mg w 1. dobie, potem 100 mg/dobę; cięższe zakażenia 200 mg/dobę. ATS/IDSA i NICE: 100 mg co 12 h / 200 mg → 100 mg. NPOA 2016: niska wrażliwość pneumokoków (70%) – nie lek pierwszego wyboru.'},
 levo:{n:'Lewofloksacyna',ch:'levo_iv',route:'i.v./p.o.',dose:'500 mg',q:'co 12 h',r:'levo500x2',qt:1,preg:'avoid',cls:'fq',g:'ChPL (PL) PZP: 500 mg 1–2 ×/dobę, 7–14 dni. Informacja źródłowa: ATS/IDSA i NPOA rek. 10 podają 750 mg co 24 h (poza polską ChPL – nie stosowane).',lok:'dawka wg polskiej ChPL: 500 mg 1–2 ×/dobę'},
 levo1:{n:'Lewofloksacyna',ch:'levo_po',route:'p.o./i.v.',dose:'500 mg',q:'co 24 h',r:'levo500',qt:1,preg:'avoid',cls:'fq',g:'ChPL PZP: 500 mg 1–2 ×/dobę. Informacja źródłowa: ATS/IDSA, NPOA rek. 10 – 750 mg/dobę (poza polską ChPL).',lok:'dawka wg polskiej ChPL: 500 mg 1–2 ×/dobę'},
 moxi:{n:'Moksyfloksacyna',ch:'moxi_iv',route:'i.v./p.o.',dose:'400 mg',q:'co 24 h',r:'moxi',qt:1,preg:'avoid',cls:'fq',hep:1,g:'ChPL: 400 mg raz na dobę, łącznie 7–14 dni w PZP; NPOA rek. 10: 400 mg/dobę 7–10 dni.'},
 ptz:{n:'Piperacylina z tazobaktamem',ch:'ptz',route:'i.v.',dose:'4,5 g (4 g + 0,5 g)',q:'co 6 h',r:'ptz',preg:'ok',cls:'pen',g:'ChPL: ciężkie zapalenie płuc 4,5 g co 6 h (infuzja 30 min).'},
 cfep:{n:'Cefepim',ch:'cfep',route:'i.v.',dose:'2 g',q:'co 12 h',r:'cfep',preg:'ok',cls:'ceph',g:'ChPL: zapalenie płuc 2 g co 12 h (bardzo ciężkie zakażenia 2 g co 8 h). ATS/IDSA: 2 g co 8 h – '+DEC+'.'},
 cftz:{n:'Ceftazydym',ch:'cftz',route:'i.v.',dose:'2 g',q:'co 8 h',r:'cftz',preg:'ok',cls:'ceph',g:'ChPL: 1–2 g co 8 h; ATS/IDSA: 2 g co 8 h.'},
 mero:{n:'Meropenem',ch:'mero',route:'i.v.',dose:'1 g',q:'co 8 h',r:'mero',preg:'caution',cls:'carb',g:'ChPL / ATS/IDSA: 1 g co 8 h.'},
 vanco:{n:'Wankomycyna',ch:'vanco',route:'i.v.',dose:'25–30 mg/kg (nasycająca), dalej 15–20 mg/kg',q:'co 8–12 h wg stężeń',r:'vanco',preg:'caution',cls:'gly',wt:1,g:'ChPL: 15–20 mg/kg co 8–12 h (≤2 g na dawkę); ciężki stan – nasycająca 25–30 mg/kg. ATS/IDSA: 15 mg/kg co 12 h, korekta wg stężeń.'},
 linez:{n:'Linezolid',ch:'linez',route:'i.v./p.o.',dose:'600 mg',q:'co 12 h',r:'linez',preg:'caution',cls:'oxa',g:'ChPL PZP: 600 mg 2 ×/dobę, 10–14 dni.'},
 cipro:{n:'Cyprofloksacyna',ch:'cipro',route:'i.v.',dose:'400 mg',q:'co 8 h',r:'cipro',qt:1,preg:'avoid',cls:'fq',g:'ChPL (Ciprinol): zakażenia dolnych dróg oddechowych 400 mg 2–3 ×/dobę, 7–14 dni; Pseudomonas – większe dawki i skojarzenie (ChPL). NPOA 2016: cyprofloksacyna w skojarzeniu przy ryzyku P. aeruginosa. Słaba aktywność wobec pneumokoka.'},
 metro:{n:'Metronidazol',ch:'metro',route:'i.v.',dose:'500 mg',q:'co 8 h',r:'metro',preg:'caution',cls:'nitro',g:'ChPL: 500 mg co 8 h (lub 1,5 g raz na dobę).'},
 ampsul:{n:'Ampicylina z sulbaktamem',ch:'ampsul',route:'i.v.',dose:'3 g (2 g + 1 g)',q:'co 6–8 h',r:'ampsul',preg:'caution',cls:'pen',g:'ChPL (Ampicilin + Sulbactam AptaPharma): 1,5–12 g/dobę w dawkach co 6–8 h, zakażenia ciężkie do 12 g/dobę (maks. sulbaktam 4 g/dobę). W badaniach zachłystowego PZP / ropnia płuca: 3 g (2 g + 1 g) co 8 h i.v. (Allewelt 2004, Ott 2008).'},
 amoxclav_po4:{n:'Amoksycylina z kwasem klawulanowym',ch:'amoxclav_po4',route:'p.o.',dose:'500/125 mg',q:'co 8 h',r:'amoxclav_po4',preg:'ok',cls:'pen',g:'ChPL (Amoksiklav 500/125): 1 tabl. 3 ×/dobę; postać 4:1 – jedyna doustna z korektą nerkową w ChPL (CrCl 10–30: 2 ×/dobę; <10: 1 ×/dobę).'},
 clinda_po:{n:'Klindamycyna',ch:'clinda_po',route:'p.o.',dose:'300–450 mg',q:'co 6 h',r:'clinda',preg:'caution',cls:'linc',g:'ChPL (Clindamycin Mylan): 150–450 mg co 6 h wg ciężkości. Allewelt 2004: po fazie i.v. 300 mg 3 ×/dobę p.o. Ryzyko C. difficile.'},
 clinda:{n:'Klindamycyna',ch:'clinda',route:'i.v.',dose:'600 mg',q:'co 8 h',r:'clinda',preg:'caution',cls:'linc',g:'ChPL: ciężkie zakażenia (m.in. zachłystowe zapalenie płuc) 1800–2700 mg/dobę w 2–4 dawkach; jednorazowo ≤1200 mg w 1 h.'}
};
// interakcje i QT
var IX={
 qt:'Makrolidy i fluorochinolony wydłużają QT (ChPL). Przy QTc wydłużonym, leki wydłużające QT, hipokaliemii/hipomagnezemii – wybierz schemat bez nich lub EKG + wyrównanie K/Mg: '+DEC+'.',
 statin:'Klarytromycyna (silny inhibitor CYP3A4) – przeciwwskazana z symwastatyną, lowastatyną; atorwastatyna – wstrzymaj lub zmniejsz dawkę. Azytromycyna – mniej interakcji.',
 vka:'Warfaryna/acenokumarol + makrolid, fluorochinolon lub doksycyklina – wzrost INR: kontrola INR w 3.–5. dobie.',
 doac:'Klarytromycyna zwiększa stężenie DOAC (P-gp/CYP3A4) – ryzyko krwawienia: rozważ azytromycynę lub doksycyklinę.',
 ssri:'Linezolid + SSRI/SNRI/IMAO/tryptany – ryzyko zespołu serotoninowego (ChPL): unikaj lub ścisła obserwacja; preferuj wankomycynę.',
 steroid:'Fluorochinolon + glikokortykosteroid u osób starszych – ryzyko zerwania ścięgna (ChPL).',
 cation:'Doksycyklina, lewofloksacyna, moksyfloksacyna p.o. – odstęp ≥2 h od preparatów Ca, Mg, Al, Fe, Zn (ChPL).',
 colch:'Klarytromycyna + kolchicyna – przeciwwskazane (ChPL).'
};
function item(k,ctx,over){var d=D[k],o={k:k,n:d.n,brand:CH[d.ch][1],url:chUrl(d.ch),route:d.route,dose:d.dose,q:d.q,g:d.g,qt:!!d.qt,cls:d.cls,lok:d.lok||''};if(over)for(var x in over)o[x]=over[x];
 var r=R(d.r,ctx.crcl,ctx);o.renal=r.t;o.rmod=!!r.mod;o.ravoid=!!r.avoid;o.rdec=!!r.dec;o.tdm=!!r.tdm;
 if(d.wt&&isFinite(ctx.w)){var lo=Math.round(ctx.w*25/50)*50,hi=Math.round(ctx.w*30/50)*50,m1=Math.round(ctx.w*15/50)*50,m2=Math.round(ctx.w*20/50)*50;o.calc='Masa '+fmt(ctx.w)+' kg: nasycająca '+fmt(lo)+'–'+fmt(hi)+' mg; podtrzymująca '+fmt(m1)+'–'+fmt(Math.min(m2,2000))+' mg/dawkę (ChPL ≤2 g na dawkę)'+(hi>2000?'; dawka nasycająca >2 g – '+DEC:'');}
 if(ctx.preg&&d.preg==='caution')o.pregNote='Ciąża: ChPL – bezpieczeństwo nieustalone, stosować gdy korzyść > ryzyko – '+DEC+'.';
 return o;}
function txtItem(o){return o.n+' ('+o.brand+') '+o.dose+' '+o.route+' '+o.q;}
// ---------- dobór ----------
function plan(i){i=i||{};var out={ok:false,need:[],regs:[],avoid:[],dec:[],notes:[],ix:[],dur:'',src:['npoa','ats','ers','nice']};
 out.warn=[];var age=num(i.age);if(isFinite(age)&&!(age>=18&&age<=110))out.need.push('moduł tylko dla dorosłych (18–110 lat)');if(!isFinite(age))out.warn.push('brak wieku – założono pacjenta dorosłego (CURB-65 bez kryterium wieku)');
 var pl=place(i);out.place=pl;out.pAuto=pl.p;var LBL={home:'Dom',obs:'krótka obserwacja / dom ze ścisłą kontrolą',ward:'Oddział',icu:'OIT'};
 // 11.11.2026: miejsce leczenia i alergia NIE mają wartości domyślnych – wybiera lekarz; puste pole ≠ „brak” / „dom”
 var P=(i.place==='home'||i.place==='ward'||i.place==='icu')?i.place:'';
 if(!P)out.need.push('miejsce leczenia – wybierz (Dom / Oddział / OIT)'+(pl.ready?' – rekomendacja silnika powyżej':''));
 if(!['none','late','imm'].includes(i.allergy))out.need.push('alergia na penicyliny – wybierz (brak / nienatychmiastowa / natychmiastowa)');
 if(P&&pl.ready&&pl.p&&CS().RANK[P]<CS().RANK[pl.p])out.warn.push('Wybrano „'+LBL[P]+'” – rekomendacja silnika: '+pl.a.label.replace('Rekomendacja: ','')+' ('+(pl.why||[]).join('; ')+'). Decyzja lekarza – udokumentuj uzasadnienie.');
 if(P&&!pl.ready)out.warn.push('Rekomendacja miejsca leczenia niewyliczona (brak: '+pl.a.missingMin.join(', ')+') – schemat dla miejsca wybranego przez lekarza.');
 out.obs=false;out.p=P;
 if(P==='home')out.notes.push('Leczenie domowe: kontrola kliniczna po 48–72 h (wcześniej przy pogorszeniu: duszność, SpO₂ <92%, splątanie, brak poprawy); pisemna informacja dla pacjenta (BTS / NICE NG138 / NPOA 2016).');
 if(out.need.length)return out;
 var c=crcl(i);out.crcl=c;var ctx={crcl:c.v,hd:i.hd===true,w:num(i.w),preg:i.preg===true};
 if(!isFinite(c.v)&&!ctx.hd)out.warn.push('brak kreatyniny – korekta nerkowa nieoceniona (dawki standardowe dla dorosłego; uzupełnij kreatyninę lub CrCl/eGFR)');
 var imm=i.allergy==='imm',late=i.allergy==='late',pen=!imm&&!late;var preg=i.preg===true,qt=i.qt===true,liver=i.liver===true;
 var noMac=qt,noFq=qt||preg,noDoxy=preg;
 var sev=P==='icu';var recent=i.recent===true;var mrsa=i.mrsa===true||(recent&&sev);var pseudo=i.pseudo===true||(recent&&sev);
 var asp=i.asp===true,leg=i.leg===true;
 if(imm)out.avoid.push('Wszystkie β-laktamy (penicyliny, cefalosporyny, karbapenemy) – alergia natychmiastowa (NPOA 2016 rek. 10: makrolid / fluorochinolon). Konsultacja alergologiczna po leczeniu.');
 if(late)out.avoid.push('Penicyliny (amoksycylina, ampicylina, amoksycylina/klawulanian, piperacylina/tazobaktam) – alergia nienatychmiastowa. NPOA 2016 rek. 10: można ceftriakson lub cefotaksym.');
 if(qt)out.avoid.push('Makrolidy i fluorochinolony – wydłużony QT / leki wydłużające QT.');
 if(preg)out.avoid.push('Doksycyklina i fluorochinolony – ciąża (ChPL: przeciwwskazane / nie stosować). Klarytromycyna – bezpieczeństwo nieustalone (ChPL).');
 if(liver)out.avoid.push('Moksyfloksacyna – ciężka niewydolność wątroby (ChPL); ceftriakson przy jednoczesnej niewydolności nerek – obserwacja.');
 function reg(t,tier,items,why,src,dur){out.regs.push({t:t,tier:tier,items:items.filter(Boolean),why:why||'',src:src||[],dur:dur||''});}
 var I=function(k,o){return item(k,ctx,o);};
 // drugi filar (atypowe / Legionella)
 function macro(route){if(noMac)return null;if(preg)return I('azi',{note:route==='iv'?'azytromycyna wyłącznie p.o. (brak i.v. w szpitalu); gdy p.o. niemożliwe – klarytromycyna i.v. wg ChPL (ciąża: korzyść > ryzyko) – '+DEC:''});return route==='iv'?I('clari_iv'):I('clari_po');}
 var durStd='7 dni ('+LOK+'; NPOA 2016: ok. 7 dni) – ocena odpowiedzi klinicznej po 48–72 h; przy szybkiej stabilizacji możliwe skrócenie (NICE/ATS: min. 5 dni), przy braku poprawy – diagnostyka i zmiana leczenia.';
 var durLeg='Legionella / atypowe: 10–14 dni (NPOA 2016); ATS: 7–14 dni.';
 var durSev='Ciężkie PZP: 7 dni, dłużej przy powikłaniach (ERS 2023, ATS 2025 ≥5 dni); MRSA / Pseudomonas: 7 dni (ATS/IDSA 2019); S. aureus, pałeczki Gram-ujemne – dłużej (NPOA 2016).';
 out.dur=(sev?durSev:durStd)+(leg?' '+durLeg:'');
 var D2=leg?durLeg:'7 dni (ocena odpowiedzi klinicznej po 48–72 h)';
 // 11.11.2026: modyfikatory etiologiczne (zachłyśnięcie, ropień płuca, ropniak) ZMIENIAJĄ schemat
 var absc=i.abscess===true,emp=i.empyema===true,anaer=absc||emp;
 var lowCl=(isFinite(c.v)&&c.v<30)||ctx.hd;
 var moxiPO=function(){return I('moxi',{route:'p.o.',brand:CH.moxi_po[1],url:chUrl('moxi_po')});};
 var acPO=function(){return lowCl?I('amoxclav_po4'):I('amoxclav_po');};
 var ANW=(absc?'Ropień płuca':'')+(absc&&emp?' + ':'')+(emp?'ropniak opłucnej':'');
 var durAbs='Ropień płuca: zwykle 3–6 tyg. lub dłużej – do poprawy radiologicznej (zniknięcie jamy lub mała stabilna blizna); i.v. do poprawy klinicznej (w badaniach ≥6 dni), potem p.o. (Allewelt 2004: śr. 22–24 dni; Ott 2008: mediana 30–35 dni; MSD) – '+DEC+'.';
 var durEmp='Ropniak / zakażenie opłucnej: drenaż + zwykle 2–6 tyg. (BTS 2023: optymalny czas nieustalony; RCT ODAPE / SLIM: 2–3 tyg. u stabilnych bez leczenia operacyjnego); i.v. zwykle 5–7 dni do poprawy, potem p.o. – '+DEC+'.';
 var durAn=(absc?durAbs:'')+(absc&&emp?' ':'')+(emp?durEmp:'');
 var durAsp='5–7 dni (ATS/IDSA 2019: min. 5 dni, jak PZP; Ott 2008: mediana 9–11 dni w zachłystowym PZP) – ocena po 48–72 h.';
 if(anaer)out.dur=durAn;else if(asp&&!sev)out.dur=durAsp+(leg?' '+durLeg:'');
 if(anaer)out.notes.push(ANW+': hospitalizacja zalecana; konsultacja torakochirurgiczna – '+(emp?'ropniak wymaga drenażu opłucnej (BTS 2023: ropa lub pH płynu <7,2 → drenaż); ':'')+'bronchoskopia przy braku poprawy po 7–10 dniach (zwężenie oskrzela, nowotwór – MSD). Metronidazol NIE w monoterapii (słabo działa na paciorkowce tlenowe/mikroaerofilne). Antybiotyk wg posiewu (beztlenowce trudno hodować – nie zawężaj pokrycia beztlenowców bez powodu, BTS).');
 if(P==='home'){
  if(pseudo||mrsa)out.dec.push('Dom, a w wywiadzie MRSA / Pseudomonas w drogach oddechowych: dane ATS/IDSA 2019 dotyczą leczenia szpitalnego – rozważ hospitalizację, posiew plwociny przed antybiotykiem: '+DEC+'.');
  if(anaer){
   out.dec.push(ANW+' – rekomendacja: hospitalizacja (antybiotyk i.v., ocena drenażu). Schemat doustny poniżej tylko jako kontynuacja po poprawie lub przy świadomym wyborze lekarza: '+DEC+'.');
   if(pen)reg(ANW+' – p.o.: amoksycylina z kwasem klawulanowym (sama amoksycylina NIE wystarcza)','pref',[acPO()],'Pokrycie beztlenowców i szczepów wytwarzających β-laktamazy: BTS 2023 (zakażenie opłucnej – amoksycylina/klawulanian), Allewelt 2004 i Ott 2008 (aminopenicylina z inhibitorem p.o. po fazie i.v.), MSD.'+(lowCl?' CrCl <30 / HD: postać 500/125 z korektą wg ChPL (postać 7:1 niezalecana).':''),['btspl','allewelt','ott','msd'],durAn);
   var an=[];if(!noFq&&!liver)an.push(moxiPO());an.push(I('clinda_po'));
   reg((pen?'Alternatywa':'Alergia na penicyliny ('+(imm?'natychmiastowa':'nienatychmiastowa')+')')+' – '+ANW+' p.o.: JEDEN z leków',pen?'alt':'pref',an,'Moksyfloksacyna – równie skuteczna jak ampicylina/sulbaktam w zachłystowym PZP i ropniu płuca (Ott 2008); klindamycyna – Allewelt 2004, BTS 2023 (alergia na penicyliny).'+(noFq?' Fluorochinolony przeciwwskazane (QT / ciąża) – tylko klindamycyna.':'')+' '+DEC+'.',['ott','allewelt','btspl'],durAn);
  }else if(asp){
   if(pen)reg('Zachłystowe PZP – dom: amoksycylina z kwasem klawulanowym (ZAMIAST samej amoksycyliny)','pref',[acPO()],'NPOA 2016 (zachłystowe PZP): amoksycylina/klawulanian; Mandell i Niederman NEJM 2019: aminopenicylina z inhibitorem β-laktamaz. ATS/IDSA 2019: dodatkowe pokrycie beztlenowców (metronidazol) NIE jest rutynowo potrzebne bez ropnia / ropniaka.'+(lowCl?' CrCl <30 / HD: postać 500/125 z korektą wg ChPL (7:1 niezalecana).':''),['npoa','mandell','ats'],durAsp);
   else{var aa=[];if(!noFq&&!liver)aa.push(moxiPO());aa.push(I('clinda_po'));
    reg('Zachłystowe PZP + alergia na penicyliny ('+(imm?'natychmiastowa':'nienatychmiastowa')+') – dom: JEDEN z leków','pref',aa,'Moksyfloksacyna – Ott 2008 (skuteczność jak ampicylina/sulbaktam); NPOA 2016: klindamycyna w zachłystowym PZP (uwaga: klindamycyna nie działa na H. influenzae).'+(noFq?' Fluorochinolony przeciwwskazane – klindamycyna.':'')+' '+DEC+'.',['ott','npoa','mandell'],durAsp);}
   if(pen&&(leg||i.atyp)){var m2=macro('po')||(!noDoxy?I('doxy'):null);if(m2)reg('+ lek na atypowe / Legionellę','pref',[m2],'Amoksycylina/klawulanian nie działa na Legionellę ani atypowe – NPOA 2016, ATS/IDSA 2019.',['npoa','ats'],durLeg);}
  }else if(pseudo&&!noFq){
   reg(PROP+': ryzyko Pseudomonas – dom: lewofloksacyna ZAMIAST amoksycyliny','prop',[I('levo',{route:'p.o.',brand:CH.levo_po[1],url:chUrl('levo_po')})],'Pseudomonas w drogach oddechowych w wywiadzie: amoksycylina nie działa na P. aeruginosa. Lewofloksacyna – fluorochinolon aktywny wobec P. aeruginosa i pneumokoka (ChPL: PZP 500 mg 1–2 ×/dobę); ATS/IDSA 2019 – pokrycie Pseudomonas przy wcześniejszej izolacji, posiew. Zalecana raczej hospitalizacja – '+DEC+'.',['ats','npoa'],'7 dni (ATS/IDSA 2019)');
  }else if(pen&&!(i.comorb||recent)){reg('Pierwszy wybór – dom, bez chorób współistniejących','pref',[I('amox')],'Amoksycylina działa na pneumokoka (wrażliwość 94% w Polsce, NPOA 2016).',['npoa','nice'],D2);
   if(leg){var ml=macro('po');if(ml)reg('+ makrolid (podejrzenie Legionelli – amoksycylina nie działa na Legionellę)','pref',[ml],'NPOA 2016, ATS/IDSA 2019: Legionella – makrolid lub fluorochinolon.',['npoa','ats'],durLeg);
    if(!noFq)reg('Alternatywa przy podejrzeniu Legionelli: fluorochinolon w monoterapii','alt',[liver?I('levo1'):moxiPO()],'ATS/IDSA 2019, NPOA 2016.',['ats','npoa'],durLeg);
    if(!ml&&noFq&&!noDoxy)reg('Makrolid i fluorochinolon przeciwwskazane – doksycyklina (słabsze dane)','alt',[I('doxy')],'ATS/IDSA 2019 – '+DEC+'.',['ats'],durLeg);}
   else if(i.atyp)reg('Podejrzenie drobnoustrojów atypowych – zamiast lub z amoksycyliną','alt',[macro('po')||(!noDoxy?I('doxy'):null)],'NPOA 2016: makrolid u młodych dorosłych z łagodnym przebiegiem bez chorób współistniejących.',['npoa','ats'],durLeg);
   else if(out.place&&out.place.c&&out.place.c.complete&&out.place.c.score>=2)reg('CURB-65 '+out.place.c.score+' leczony w domu – rozważ dołączenie do amoksycyliny','alt',[macro('po')||(!noDoxy?I('doxy'):null)],'BTS (umiarkowane PZP): amoksycylina + makrolid; ATS/IDSA 2019: makrolid lub doksycyklina – drugi lek '+DEC+'. Kontrola po 48–72 h.',['ats','npoa'],D2);}
  else if(pen){var okCl=!lowCl;
   reg('Dom + '+(i.comorb?'choroby współistniejące':'')+(i.comorb&&recent?' / ':'')+(recent?'antybiotyk i.v. w 90 dniach':''),'pref',[okCl?I('amoxclav_po'):I('amoxclav_po4'),macro('po')||(!noDoxy?I('doxy'):null)],'Amoksycylina/klawulanian'+(okCl?'':' 500/125 (CrCl <30 – postać 7:1 niezalecana, ChPL)')+' + makrolid lub doksycyklina (ATS/IDSA 2019 tab. 3 – choroby współistniejące).'+(recent?' Niedawna antybiotykoterapia: posiewy; nie powtarzaj leku z tej samej klasy (ATS/IDSA 2019).':'')+' NPOA 2016 nie wymaga skojarzenia – drugi lek '+DEC+'.',['ats','npoa'],leg?durLeg:D2);
   if(!noFq)reg('Alternatywa: fluorochinolon w monoterapii','alt',[liver?I('levo1'):moxiPO()],'ATS/IDSA 2019. Ryzyko: ścięgna, OUN, glikemia, tętniak aorty, QT.',['ats'],'7 dni (ChPL: 7–14 dni)');}
  else{var alt=[];if(leg&&!noFq)alt.push(liver?I('levo1'):moxiPO());if(!noMac)alt.push(preg?I('azi'):I('clari_po'));if(!noDoxy&&!leg)alt.push(I('doxy'));
   if(late&&!alt.length&&!noFq)alt.push(liver?I('levo1'):moxiPO());
   if(alt.length)reg('Alergia na penicyliny – dom: JEDEN z leków','pref',alt,'NPOA 2016 rek. 10 (makrolid), NICE NG138 (doksycyklina lub klarytromycyna). Doksycyklina – niższa wrażliwość pneumokoków (NPOA).'+(leg?' Legionella: makrolid lub fluorochinolon.':''),['npoa','nice'],D2);
   if((i.comorb||recent)&&!noFq&&!leg)reg('Alergia + choroby współistniejące: fluorochinolon w monoterapii','alt',[liver?I('levo1'):moxiPO()],'NPOA 2016 rek. 10: moksyfloksacyna 400 mg/dobę lub lewofloksacyna 7–10 dni.',['npoa','ats'],'7–10 dni (NPOA)');
   if(!alt.length&&!((i.comorb||recent)&&!noFq))out.dec.push('Alergia na penicyliny + przeciwwskazania do makrolidów, doksycykliny i fluorochinolonów (QT / ciąża): brak zweryfikowanego schematu doustnego – '+DEC+(late?' (NPOA: ceftriakson / cefotaksym pozajelitowo)':'')+'.');}
  if(mrsa&&!anaer)reg(PROP+': ryzyko MRSA – dom: DODAJ linezolid','prop',[I('linez',{warn:i.ssri?IX.ssri:''})],'MRSA w drogach oddechowych w wywiadzie: ATS/IDSA 2019 – pokrycie MRSA i posiewy (zalecenie dla leczenia szpitalnego); linezolid dostępny p.o. (ChPL: PZP 600 mg 2 ×/dobę). Rozważ hospitalizację – '+DEC+'.',['ats'],'7 dni (ATS/IDSA)');
 }else{
  // oddział / OIT
  var bl=[];
  if(pseudo&&!imm){var ps=[];if(pen)ps.push(I('ptz'));ps.push(I('cfep'),I('cftz'),I('mero'));
   reg('Ryzyko Pseudomonas – ZAMIAST ceftriaksonu: JEDEN β-laktam przeciwpseudomonasowy','pref',ps,(i.pseudo?'Pseudomonas w drogach oddechowych w wywiadzie':'hospitalizacja + antybiotyk i.v. w 90 dniach przy ciężkim PZP')+' (ATS/IDSA 2019 tab. 4; NPOA 2016: ceftazydym, cefepim, penicylina przeciwpseudomonasowa, karbapenem). Pobierz posiew; deeskalacja po 48–72 h.'+(late?' Alergia nienatychmiastowa: cefalosporyny / karbapenem – ryzyko krzyżowe małe, '+DEC+'.':'')+(anaer||asp?' '+(anaer?ANW:'Zachłyśnięcie')+': piperacylina/tazobaktam i meropenem pokrywają beztlenowce; przy cefepimie / ceftazydymie '+(anaer?'DODAJ metronidazol':'metronidazol tylko przy ropniu/ropniaku')+'.':''),['ats','npoa'].concat(anaer?['btspl']:[]),anaer?durAn:'7 dni (ATS/IDSA)');
   if(anaer)reg('+ metronidazol (tylko przy cefepimie / ceftazydymie)','pref',[I('metro')],'Cefepim i ceftazydym nie działają na beztlenowce – BTS 2023 / MSD.',['btspl','msd'],durAn);}
  else if(!imm){
   if(anaer){
    if(pen){reg(ANW+' – JEDEN β-laktam z inhibitorem β-laktamaz (pokrywa beztlenowce)','pref',[I('amoxclav_iv'),I('ampsul')],'BTS 2023 (ropniak pozaszpitalny): amoksycylina/klawulanian; ampicylina/sulbaktam – lek pierwszego wyboru w ropniu płuca (MSD; Allewelt 2004, Ott 2008); NPOA 2016: aminopenicylina z inhibitorem.',['btspl','msd','allewelt','ott','npoa'],durAn);
     reg('Alternatywa: ceftriakson + metronidazol','alt',[I('cftx1'),I('metro')],'MSD (ropień płuca) i NPOA 2016: ceftriakson + metronidazol; BTS 2023: cefalosporyna + metronidazol / klindamycyna.',['msd','npoa','btspl'],durAn);}
    else{reg('Alergia nienatychmiastowa – '+ANW+': ceftriakson + metronidazol','pref',[I('cftx1'),I('metro')],'NPOA 2016 rek. 10: cefalosporyny dopuszczalne przy alergii nienatychmiastowej; MSD / BTS 2023: ceftriakson + metronidazol.',['npoa','msd','btspl'],durAn);
     reg('Alternatywa: klindamycyna ± cefalosporyna','alt',[I('clinda'),I('cftx1')],'Allewelt 2004: klindamycyna 600 mg co 8 h ± cefalosporyna; BTS 2023: klindamycyna sama lub z cefalosporyną przy alergii na penicyliny.',['allewelt','btspl'],durAn);}
   }else if(asp){
    bl=pen?(sev?[I('amoxclav_iv'),I('ampsul'),I('cftx')]:[I('amoxclav_iv'),I('ampsul')]):(sev?[I('cftx'),I('cfx',{dose:'2 g'})]:[I('cftx1'),I('cfx')]);
    reg('Zachłystowe PZP – '+(sev?'ciężkie (OIT)':'oddział')+': JEDEN '+(pen?'β-laktam z inhibitorem β-laktamaz':'β-laktam (cefalosporyna III gen.)'),'pref',bl,(pen?'NPOA 2016: aminopenicylina z inhibitorem (amoksycylina/klawulanian, ampicylina/sulbaktam); Mandell i Niederman NEJM 2019: ampicylina/sulbaktam lub ceftriakson; Allewelt 2004 / Ott 2008 – ampicylina/sulbaktam 3 g co 8 h.':'Alergia nienatychmiastowa – NPOA 2016 rek. 10: ceftriakson lub cefotaksym; Mandell i Niederman NEJM 2019: ceftriakson w zachłystowym PZP.')+' ATS/IDSA 2019: bez ropnia / ropniaka NIE dodawaj rutynowo metronidazolu ani klindamycyny.',['npoa','mandell','ats','allewelt'],sev?durSev:durAsp);
    if(pen&&!sev)reg('Alternatywa: ceftriakson (bez rutynowego metronidazolu)','alt',[I('cftx1')],'ATS/IDSA 2019, Mandell i Niederman NEJM 2019: ceftriakson wystarcza w zachłystowym PZP bez ropnia; metronidazol tylko przy ropniu / ropniaku / martwicy.',['ats','mandell'],durAsp);
   }else{
    if(sev)bl=[I('cftx'),I('cfx',{dose:'2 g'})];
    else if(pen)bl=[I('amoxclav_iv'),I('amp'),I('cftx1')];
    else bl=[I('cftx1'),I('cfx')];
    reg(sev?'Ciężkie PZP (OIT): β-laktam + makrolid – JEDEN β-laktam':'Oddział: JEDEN β-laktam','pref',bl,sev?'NPOA 2016 rek. 6: ceftriakson lub cefotaksym z makrolidem [BI]; ERS 2023: makrolid preferowany nad fluorochinolonem; ATS/IDSA 2019: β-laktam + makrolid.':(pen?'NPOA 2016 rek. 6: amoksycylina/klawulanian 3 × 1,2 g i.v. lub ampicylina 4 × 1 g i.v.; ceftriakson – ATS/IDSA 2019 i NPOA rek. 9. Cefuroksym NIE jest rekomendowany (NPOA 2016: niska wrażliwość pneumokoków).':'NPOA 2016 rek. 10: alergia nienatychmiastowa – ceftriakson 1–2 g raz na dobę lub cefotaksym 1–2 g co 8 h.'),['npoa','ats','ers'],D2);}}
  // makrolid
  if(!imm){var m=macro('iv');var skipMac=anaer&&!sev&&!leg&&!i.atyp;
   if(skipMac)out.notes.push(ANW+': makrolid nie jest rutynowo potrzebny (BTS) – dodaj przy podejrzeniu Legionelli / atypowych lub w ciężkim PZP.');
   else if(m)reg(sev?'+ makrolid (obowiązkowo w ciężkim PZP)':'+ makrolid','pref',[m],sev?'NPOA 2016 rek. 6 [BI], ERS 2023, ATS/IDSA 2019 – pokrycie Legionelli i drobnoustrojów atypowych. Makrolid 3–5 dni (ERS), dalej wg wyniku antygenu Legionelli.':LOK+': na oddziale zawsze β-laktam + makrolid (ATS/IDSA 2019, BTS/NICE). Informacja źródłowa: NPOA 2016 – brak przewagi skojarzenia w nieciężkim PZP.',['ats','npoa','nice'],leg?durLeg:'3–5 dni (ERS 2023)');
   else if(!noFq&&sev)reg('Makrolid przeciwwskazany (QT) – zamiast makrolidu: fluorochinolon','alt',[I('levo')],'Uwaga: fluorochinolon także wydłuża QT – '+DEC+'.',['ats'],'');
   else if(!noDoxy)reg('Makrolid przeciwwskazany – doksycyklina jako lek na atypowe (opcja słabsza)','alt',[I('doxy',{route:'p.o.',q:'co 12 h',dose:'100 mg'})],'ATS/IDSA 2019: β-laktam + doksycyklina (niska jakość dowodów) – '+DEC+'.',['ats'],'');
   else out.dec.push('QT + ciąża: brak zweryfikowanego leku na atypowe/Legionellę (makrolid, fluorochinolon, doksycyklina wykluczone) – '+DEC+'.');
   if(!noFq&&!pseudo){if(asp||anaer){if(!liver)reg('Alternatywa: moksyfloksacyna'+(sev?' + β-laktam':' w monoterapii')+' (działa także na beztlenowce)','alt',[I('moxi')],'Ott 2008: moksyfloksacyna = ampicylina/sulbaktam w zachłystowym PZP i ropniu płuca; ATS/IDSA 2019 – fluorochinolon oddechowy.',['ott','ats'],anaer?durAn:durAsp);}
    else reg('Alternatywa dla β-laktam + makrolid: fluorochinolon'+(sev?' + β-laktam':' w monoterapii'),'alt',[I('levo'),liver?null:I('moxi')],sev?'ATS/IDSA 2019: β-laktam + fluorochinolon oddechowy; NPOA 2016: lewofloksacyna nieco mniej skuteczna niż β-laktam + makrolid w ciężkim PZP.':'ATS/IDSA 2019: monoterapia fluorochinolonem oddechowym.',['ats','npoa'],'');}}
  else{var f=[];if(!noFq){if(!liver)f.push(I('moxi'));f.push(I('levo'));if(!(asp||anaer))f.reverse();}
   if(f.length&&sev)reg('Alergia natychmiastowa – ciężkie PZP: fluorochinolon + wankomycyna LUB linezolid','pref',f.concat([I('vanco'),I('linez')]),'NPOA 2016 rek. 10: „w cięższych przypadkach glikopeptydy lub linezolid z moksyfloksacyną lub lewofloksacyną”. Wybierz JEDEN fluorochinolon + JEDEN lek na Gram-dodatnie.'+(asp||anaer?' Zachłyśnięcie / ropień: preferuj moksyfloksacynę (beztlenowce – Ott 2008).':''),['npoa'].concat(asp||anaer?['ott']:[]),anaer?durAn:durSev);
   else if(f.length&&anaer)reg('Alergia natychmiastowa – '+ANW+': JEDEN z leków (bez β-laktamów)','pref',(liver||noFq?[]:[I('moxi')]).concat([I('clinda')]),'Ott 2008: moksyfloksacyna = ampicylina/sulbaktam w ropniu płuca i zachłystowym PZP; Allewelt 2004: klindamycyna 600 mg co 8 h ± cefalosporyna (tu bez β-laktamu); BTS 2023 (ropniak, alergia): klindamycyna sama lub z cyprofloksacyną. Klindamycyna nie działa na H. influenzae / Gram-ujemne – '+DEC+'.',['ott','allewelt','btspl'],durAn);
   else if(f.length)reg('Alergia natychmiastowa – oddział: fluorochinolon w monoterapii (JEDEN)','pref',f,'NPOA 2016 rek. 10: moksyfloksacyna 400 mg/dobę lub lewofloksacyna 7–10 dni; ATS/IDSA 2019.'+(asp||anaer?' Zachłyśnięcie / ropień: preferuj moksyfloksacynę (działa na beztlenowce – Ott 2008).':''),['npoa','ats'].concat(asp||anaer?['ott']:[]),anaer?durAn:asp?durAsp:'7–10 dni (NPOA)');
   else if(!noMac&&!sev)reg('Alergia natychmiastowa – makrolid','alt',[preg?macro('iv'):I('clari_iv')],'NPOA 2016 rek. 10. W cięższym PZP niewystarczające – '+DEC+'.',['npoa'],'');
   if((asp||anaer)&&!(anaer&&!sev&&f.length)){reg('Alergia natychmiastowa + '+(anaer?ANW:'zachłystowe PZP')+': klindamycyna (bez β-laktamów)'+(anaer?(f.length?' – zamiast / obok fluorochinolonu':''):' – gdy fluorochinolon niemożliwy lub podejrzenie ropnia'),anaer&&!f.length?'pref':'alt',[I('clinda')],'Allewelt 2004: klindamycyna 600 mg co 8 h i.v.; NPOA 2016: klindamycyna w zachłystowym PZP; '+(anaer?'BTS 2023 (ropniak, alergia): klindamycyna sama lub z cyprofloksacyną; MSD (ropień): moksyfloksacyna lub lewofloksacyna + metronidazol.':'ATS/IDSA 2019: bez ropnia leku na beztlenowce nie dodaje się rutynowo.')+' Klindamycyna nie działa na H. influenzae / Gram-ujemne – w skojarzeniu, '+DEC+'.',['allewelt','npoa','btspl','msd'],anaer?durAn:durAsp);
    if(anaer&&!noFq)reg('Alternatywa (MSD): lewofloksacyna + metronidazol','alt',[I('levo'),I('metro')],'MSD Manual (ropień płuca, alergia na penicyliny).',['msd'],durAn);}
   if(!f.length){var gp=[I('vanco'),i.ssri?I('linez',{warn:IX.ssri}):I('linez')];var atyp=[];if(!noMac)atyp.push(preg?macro('iv'):I('clari_iv'));else if(!noDoxy)atyp.push(I('doxy',{dose:'100 mg',q:'co 12 h'}));
    reg(PROP+': alergia natychmiastowa + '+(preg&&qt?'QT i ciąża':qt?'wydłużony QT':'ciąża')+' – lek na Gram-dodatnie (pneumokok) + lek na atypowe','prop',gp.concat(atyp),'Bez β-laktamów i fluorochinolonów. NPOA 2016 rek. 10: glikopeptyd lub linezolid w cięższych przypadkach (tu bez fluorochinolonu); atypowe/Legionella: '+(atyp.length?(atyp[0].k==='doxy'?'doksycyklina (ATS/IDSA 2019 – opcja, niska jakość dowodów)':'makrolid (ciąża: azytromycyna p.o.)'):'BRAK leku – Legionella niepokryta')+'. Wybierz JEDEN z (wankomycyna / linezolid)'+(atyp.length?' + lek na atypowe':'')+'. Konsultacja zakaźna i alergologiczna (IDSA/AAAAI 2022: rozważ test prowokacji lub cefalosporynę o odmiennym łańcuchu bocznym).',['npoa','ats','idsaal'],D2);
    if(!atyp.length)out.dec.push('Alergia natychmiastowa + QT + ciąża: brak leku na Legionellę/atypowe bez ryzyka QT/teratogenności – konsultacja zakaźna: '+DEC+'.');}
   if(pseudo){var pz=[];if(!noFq)pz.push(I('cipro'),I('levo'));
    reg(PROP+': alergia natychmiastowa + ryzyko Pseudomonas','prop',pz.concat([I('vanco'),I('linez')]),'Aztreonam i.v. (ATS/IDSA 2019 tab. 4: β-laktam przeciwpseudomonasowy bezpieczny przy alergii na penicyliny – IDSA/AAAAI 2022; reakcja krzyżowa tylko z ceftazydymem) – BRAK w RPL (03.11.2026, tylko Cayston do nebulizacji i Emblaveo = aztreonam/awibaktam – lek rezerwowy): dostępność przez import docelowy / aptekę szpitalną, dawka wg ChPL importowanego produktu – nie podano. '+(pz.length?'Do czasu aztreonamu: fluorochinolon przeciwpseudomonasowy (cyprofloksacyna LUB lewofloksacyna, ChPL) – NPOA 2016: cyprofloksacyna w skojarzeniu przy P. aeruginosa; ':'Fluorochinolony przeciwwskazane (QT/ciąża) – ')+'pokrycie pneumokoka/MRSA: wankomycyna LUB linezolid (NPOA rek. 10). Konsultacja zakaźna; deeskalacja po posiewach.',['ats','npoa','idsaal'],'7 dni (ATS/IDSA 2019)');}}
  // MRSA
  if(mrsa&&!(imm&&sev)){var vv=[I('vanco')];if(i.ssri!==true)vv.push(I('linez'));else vv.push(I('linez',{warn:IX.ssri}));
   reg('Ryzyko MRSA – DODAJ JEDEN: wankomycyna LUB linezolid','pref',vv,(i.mrsa?'MRSA w drogach oddechowych w wywiadzie':'hospitalizacja + antybiotyk i.v. w 90 dniach przy ciężkim PZP')+' (ATS/IDSA 2019). Pobierz posiew i wymaz z nosa (PCR MRSA); odstaw po 48 h przy ujemnych wynikach.',['ats','npoa'],'7 dni (ATS/IDSA)');}
  if(mrsa&&imm&&sev)out.notes.push('Ryzyko MRSA: pokryte przez wankomycynę LUB linezolid w schemacie powyżej (ATS/IDSA 2019) – posiew i PCR MRSA z nosa; odstaw po 48 h przy ujemnych wynikach.');
  if(recent&&!sev&&!i.mrsa&&!i.pseudo)out.notes.push('Hospitalizacja + antybiotyk i.v. w 90 dniach, PZP nieciężkie: ATS/IDSA 2019 – posiewy (plwocina, krew, PCR MRSA); NIE rozszerzaj empirycznie na MRSA / Pseudomonas bez lokalnych danych – '+DEC+'.');
 }
 if(asp&&!anaer)out.notes.push('Zachłystowe zapalenie chemiczne (pneumonitis) bez nacieku zapalnego często ustępuje w 24–48 h bez antybiotyku (ATS/IDSA 2019, Mandell i Niederman NEJM 2019). Beztlenowce rutynowo nie – tylko przy ropniu, ropniaku lub martwicy.');
 // Legionella
 if(leg){out.notes.push('Podejrzenie Legionelli (hiponatremia, biegunka, zaburzenia świadomości, wysoka gorączka, podróż/klimatyzacja, brak odpowiedzi na β-laktam): wymagany makrolid lub fluorochinolon; antygen Legionella pneumophila w moczu (wykrywa tylko serogrupę 1, ok. 80%). Czas leczenia 10–14 dni (NPOA 2016).');
  if(noMac&&noFq)out.dec.push('Legionella + przeciwwskazania do makrolidów i fluorochinolonów: '+DEC+' (doksycyklina – słabsze dane).');}
 // ciąża
 if(preg)out.notes.push('Ciąża: β-laktamy (amoksycylina, amoksycylina/klawulanian, ceftriakson) – leki z wyboru; makrolid – azytromycyna zamiast klarytromycyny ('+DEC+'); konsultacja położnicza.');
 if(liver)out.notes.push('Ciężka choroba wątroby: amoksycylina/klawulanian – ostrożnie, kontrola prób wątrobowych (ChPL); metronidazol – ⅓ dawki.');
 if(ctx.hd)out.notes.push('Hemodializa: pierwsza dawka zawsze pełna; kolejne – po dializie wg ChPL.');
 if(sev)out.notes.push('Ciężkie PZP: antybiotyk w 1. godzinie po rozpoznaniu, posiewy krwi i plwociny przed antybiotykiem (nie opóźniaj); antygeny Legionelli i pneumokoka w moczu (NPOA 2016 rek. 5). GKS (hydrokortyzon) – ATS 2025 / ERS 2023 przy wstrząsie lub ciężkim PZP bez grypy: '+DEC+'.');
 if(isFinite(c.v)&&c.v<30)out.notes.push('CrCl '+c.v+' ml/min (<30): sprawdź korekty przy każdym leku – pierwsza dawka pełna, korekta dotyczy dawek kolejnych.');
 // interakcje
 var usesMac=out.regs.some(function(r){return r.items.some(function(x){return x.cls==='mac';});}),usesFq=out.regs.some(function(r){return r.items.some(function(x){return x.cls==='fq';});});
 if(usesMac||usesFq)out.ix.push(IX.qt);
 if(i.statin&&usesMac)out.ix.push(IX.statin);if(i.vka&&(usesMac||usesFq))out.ix.push(IX.vka);if(i.doac&&usesMac)out.ix.push(IX.doac);if(i.ssri&&mrsa)out.ix.push(IX.ssri);if(i.steroid&&usesFq)out.ix.push(IX.steroid);if(i.colch&&usesMac)out.ix.push(IX.colch);
 if(out.regs.some(function(r){return r.items.some(function(x){return x.k==='doxy'||x.route.indexOf('p.o.')>=0&&x.cls==='fq';});}))out.ix.push(IX.cation);
 if(!isFinite(ctx.w)&&out.regs.some(function(r){return r.items.some(function(x){return x.k==='vanco'})}))out.warn.push('brak masy – wankomycyny nie policzono (dawka mg/kg wymaga masy ciała)');
 out.ok=out.regs.length>0||out.dec.length>0;return out;}
// tekst do zaleceń wypisowych (wybrany schemat)
function discharge(o,idx){var r=o.regs[idx];if(!r)return '';var c=o.place&&o.place.c;var L=['Rozpoznanie: pozaszpitalne zapalenie płuc'+(c&&c.complete?' (CURB-65 '+c.score+'/5)':'')+'.','Antybiotykoterapia:'];
 (o.warn||[]).forEach(function(w){L.push('UWAGA: '+w+'.');});
 if(r.tier==='prop')L.push('UWAGA: '+PROP+'.');
 r.items.forEach(function(x){L.push('- '+txtItem(x)+(x.rmod?' [korekta nerkowa: '+x.renal+']':'')+'.');});
 L.push('Czas leczenia: '+(r.dur||o.dur)+'.');
 L.push('Kontrola lekarska po 48–72 h lub wcześniej przy duszności, gorączce >3 dni, splątaniu, pogorszeniu. Kontrolne RTG po ok. 6 tygodniach u palaczy i osób >50 r.ż. / przy braku poprawy (NPOA 2016 rek. 7).');
 if(o.ix.length)L.push('Uwaga: '+o.ix.join(' '));
 return L.join('\n');}
return{LOK:LOK,PROP:PROP,DEC:DEC,S:S,CH:CH,D:D,IX:IX,curb65:curb65,place:place,crcl:crcl,R:R,plan:plan,discharge:discharge,fmt:fmt,chUrl:chUrl};});
