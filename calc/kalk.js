// Asystent SOR 5.2 – etap 4: moduł „Kalkulatory” (offline). WŁASNE implementacje z oryginalnych publikacji (wzory/kryteria);
// nie kopiowano treści ani kodu żadnego serwisu z kalkulatorami. Każdy kalkulator: źródło + rok, wynik, interpretacja, konsekwencja kliniczna.
// Zasada: brak danych → brak wyniku (lista braków); nic nie jest zgadywane. Narzędzie pomocnicze – decyzję podejmuje lekarz.
(function(r,f){var m=f();if(typeof module==='object'&&module.exports)module.exports=m;else r.KALK=m;})(this,function(){
'use strict';
function num(x){if(x===null||x===undefined||x==='')return NaN;if(typeof x==='number')return x;var s=String(x).trim().replace(',','.');if(s==='')return NaN;var n=Number(s);return isFinite(n)?n:NaN;}
function ok(x){return typeof x==='number'&&isFinite(x);}
function fmt(x,d){if(!ok(x))return '—';d=d==null?1:d;var s=x.toFixed(d);if(d>0)s=s.replace(/\.?0+$/,'');return s.replace('.',',');}
function fx(x,d){if(!ok(x))return '—';return x.toFixed(d).replace('.',',');}
// N: liczba; units: [[etykieta, mnożnik → jednostka kanoniczna (pierwsza)]]; bar: klucz z paska pacjenta
function N(k,l,u,o){o=o||{};var f={k:k,t:'n',l:l};if(Array.isArray(u))f.units=u;else f.u=u||'';for(var p in o)f[p]=o[p];return f;}
function Y(k,l,p,o){var f={k:k,t:'y',l:l,p:p==null?1:p};if(o)for(var q in o)f[q]=o[q];return f;}
function S(k,l,opts,o){var f={k:k,t:'s',l:l,o:opts};if(o)for(var q in o)f[q]=o[q];return f;}
function H(l){return {t:'h',l:l};}
var SEX=S('sex','Płeć',[['m','mężczyzna'],['f','kobieta']],{bar:'sex'});
var AGE=N('age','Wiek','lat',{bar:'age',min:0,max:120});
var WT=N('w','Masa ciała','kg',{bar:'w',min:1,max:300});
var CR_U=[['mg/dl',1],['µmol/l',1/88.42]];
var CR=N('cr','Kreatynina w surowicy',CR_U,{bar:'crMg',si:1,min:0.05,max:30});
var GLU_U=[['mg/dl',1],['mmol/l',18.016]];
var ALB_U=[['g/dl',1],['g/l',0.1]];
var BILI_U=[['mg/dl',1],['µmol/l',1/17.1]];
var CHOL_U=[['mmol/l',1],['mg/dl',1/38.67]];
var KPA=[['mmHg',1],['kPa',7.50062]];
function sumPts(c,v){var s=0,miss=[],rows=[];c.f.forEach(function(f){if(f.noscore)return;if(f.t==='y'){if(v[f.k]===true){s+=f.p;rows.push([f.l,(f.p>0?'+':'')+fmt(f.p,1)]);}}
 else if(f.t==='s'&&f.o[0]&&f.o[0].length>2){var x=v[f.k];if(x===undefined||x===null||x===''){if(!f.opt)miss.push(f.l);return;}var o=f.o.filter(function(z){return String(z[0])===String(x);})[0];if(o){s+=o[2];if(o[2])rows.push([f.l+': '+o[1],(o[2]>0?'+':'')+fmt(o[2],1)]);}}});return{s:s,miss:miss,rows:rows};}
function band(b,s){for(var i=0;i<b.length;i++)if(s<=b[i][0])return b[i];return b[b.length-1];}
function scoreCalc(c,v,max){var r=sumPts(c,v);if(r.miss.length)return{miss:r.miss};var b=band(c.bands,r.s);return{v:fmt(r.s,1)+(max!=null?' / '+max+' pkt':' pkt'),n:r.s,lvl:b[2],interp:b[1],cons:b[3],rows:r.rows};}
function need(v,keys,lab){var m=[];keys.forEach(function(k,i){if(!ok(v[k]))m.push(lab[i]);});return m;}
var C={};
// ================= KARDIOLOGIA =================
var S2={m:{age:0.3742,smk:0.6012,sbp:0.2777,dm:0.6457,tc:0.1458,hdl:-0.2698,smkA:-0.0755,sbpA:-0.0255,tcA:-0.0281,hdlA:0.0426,dmA:-0.0983,s0:0.9605},
 f:{age:0.4648,smk:0.7744,sbp:0.3131,dm:0.8096,tc:0.1002,hdl:-0.2606,smkA:-0.1088,sbpA:-0.0277,tcA:-0.0226,hdlA:0.0613,dmA:-0.1272,s0:0.9776},
 cal:{low:{m:[-0.5699,0.7476],f:[-0.7380,0.7019]},mod:{m:[-0.1565,0.8009],f:[-0.3143,0.7701]},high:{m:[0.3207,0.9360],f:[0.5710,0.9369]},vhigh:{m:[0.5836,0.8294],f:[0.9412,0.8329]}}};
var OP={m:{age:0.0634,dm:0.4245,smk:0.3524,sbp:0.0094,tc:0.0850,hdl:-0.3564,dmA:-0.0174,smkA:-0.0247,sbpA:-0.0005,tcA:0.0073,hdlA:0.0091,s0:0.7576,mean:0.0929},
 f:{age:0.0789,dm:0.6010,smk:0.4921,sbp:0.0102,tc:0.0605,hdl:-0.3040,dmA:-0.0107,smkA:-0.0255,sbpA:-0.0004,tcA:-0.0009,hdlA:0.0154,s0:0.8082,mean:0.2290},
 cal:{low:{m:[-0.34,1.19],f:[-0.52,1.01]},mod:{m:[0.01,1.25],f:[-0.10,1.10]},high:{m:[0.08,1.15],f:[0.38,1.09]},vhigh:{m:[0.05,0.70],f:[0.38,0.69]}}};
function score2(age,sex,smk,sbp,tc,hdl,dm,region){var b=S2[sex],cal=S2.cal[region][sex];var ca=(age-60)/5,cs=(sbp-120)/20,ct=tc-6,ch=(hdl-1.3)/0.5;
 var lp=b.age*ca+b.smk*smk+b.sbp*cs+b.dm*dm+b.tc*ct+b.hdl*ch+b.smkA*ca*smk+b.sbpA*ca*cs+b.tcA*ca*ct+b.hdlA*ca*ch+b.dmA*ca*dm;
 var u=1-Math.pow(b.s0,Math.exp(lp));return 1-Math.exp(-Math.exp(cal[0]+cal[1]*Math.log(-Math.log(1-u))));}
function score2op(age,sex,smk,sbp,tc,hdl,dm,region){var b=OP[sex],cal=OP.cal[region][sex];var ca=age-73,cs=sbp-150,ct=tc-6,ch=hdl-1.4;
 var lp=b.age*ca+b.dm*dm+b.smk*smk+b.sbp*cs+b.tc*ct+b.hdl*ch+b.dmA*ca*dm+b.smkA*ca*smk+b.sbpA*ca*cs+b.tcA*ca*ct+b.hdlA*ca*ch;
 var u=1-Math.pow(b.s0,Math.exp(lp-b.mean));return 1-Math.exp(-Math.exp(cal[0]+cal[1]*Math.log(-Math.log(1-u))));}
C.score2={g:'kard',n:'SCORE2 / SCORE2-OP – 10-letnie ryzyko sercowo-naczyniowe',d:'Systematic COronary Risk Evaluation 2 (40–69 lat) i SCORE2-Older Persons (70–89 lat): 10-letnie ryzyko zawału serca, udaru lub zgonu sercowo-naczyniowego u osób bez rozpoznanej choroby sercowo-naczyniowej.',
 src:'SCORE2 working group, Eur Heart J 2021;42:2439 (współczynniki: suplement, tab. 1 – 4 miejsca po przecinku); SCORE2-OP working group, Eur Heart J 2021;42:2455 (suplement – średni predyktor liniowy); ESC 2021 – wytyczne Europejskiego Towarzystwa Kardiologicznego dot. prewencji chorób sercowo-naczyniowych (Visseren i wsp., Eur Heart J 2021;42:3227) – regiony ryzyka (Polska: region wysokiego ryzyka)',yr:2021,
 f:[AGE,SEX,Y('smk','Aktualnie pali tytoń',0),Y('dm','Cukrzyca',0),N('sbp','Ciśnienie skurczowe (SBP)','mmHg',{min:60,max:260}),N('tc','Cholesterol całkowity',CHOL_U,{min:1,max:20}),N('hdl','Cholesterol HDL (lipoprotein wysokiej gęstości)',CHOL_U,{min:0.2,max:5}),
  S('reg','Region ryzyka (ESC 2021)',[['high','Polska – region WYSOKIEGO ryzyka (ESC 2021)'],['vhigh','region bardzo wysokiego ryzyka'],['mod','region umiarkowanego ryzyka'],['low','region niskiego ryzyka']],{def:'high'})],
 calc:function(v){var m=need(v,['age','sbp','tc','hdl'],['wiek','SBP','cholesterol całkowity','HDL']);if(!v.sex)m.push('płeć');if(m.length)return{miss:m};
  var a=v.age,reg=v.reg||'high',dm=v.dm===true?1:0,smk=v.smk===true?1:0;if(a<40||a>89)return{err:'Model zwalidowany dla wieku 40–89 lat (SCORE2: 40–69, SCORE2-OP: 70–89).'};
  if(a<70&&dm)return{err:'SCORE2 nie dotyczy chorych na cukrzycę – w cukrzycy typu 2 ESC 2023 zaleca SCORE2-Diabetes (nie zaimplementowano).'};
  var op=a>=70,risk=(op?score2op:score2)(a,v.sex,smk,v.sbp,v.tc,v.hdl,dm,reg)*100;
  var th=a<50?[2.5,7.5]:a<70?[5,10]:[7.5,15],cat=risk<th[0]?0:risk<th[1]?1:2;
  var L=['niskie do umiarkowanego','wysokie','bardzo wysokie'][cat];
  var cons=[op?'Wiek ≥70 lat: decyzję o leczeniu czynników ryzyka uzależnij od kruchości, chorób współistniejących, oczekiwanej długości życia i preferencji pacjenta.':'Leczenie farmakologiczne czynników ryzyka zwykle niezalecane – styl życia.',
   'Należy rozważyć leczenie czynników ryzyka (lipidy, ciśnienie tętnicze) – ESC 2021'+(op?', z uwzględnieniem kruchości i preferencji.':'; uwzględnij modyfikatory ryzyka i preferencje.'),
   op?'Należy rozważyć leczenie czynników ryzyka (ESC 2021) – korzyść zależna od kruchości, wielochorobowości i oczekiwanej długości życia.':'Leczenie czynników ryzyka zalecane (ESC 2021).'][cat];
  return{v:fx(risk,1)+' %',n:risk,lvl:['green','orange','red'][cat],interp:(op?'SCORE2-OP':'SCORE2')+': ryzyko '+L+' (progi dla wieku '+(a<50?'<50 lat: <2,5 / 2,5–<7,5 / ≥7,5 %':a<70?'50–69 lat: <5 / 5–<10 / ≥10 %':'≥70 lat: <7,5 / 7,5–<15 / ≥15 %')+').',
   cons:cons+' Nie stosuj przy rozpoznanej chorobie sercowo-naczyniowej, przewlekłej chorobie nerek, hipercholesterolemii rodzinnej (ryzyko z definicji wysokie/bardzo wysokie). W SOR wynik informacyjny – do przekazania lekarzowi POZ (podstawowej opieki zdrowotnej).',
   rows:[['Model',op?'SCORE2-OP (≥70 lat)':'SCORE2 (40–69 lat)'],['Region',{high:'wysokiego ryzyka (Polska)',vhigh:'bardzo wysokiego ryzyka',mod:'umiarkowanego ryzyka',low:'niskiego ryzyka'}[reg]],['Cholesterol nie-HDL',fx(v.tc-v.hdl,1)+' mmol/l']]};}};
C.qtc={g:'kard',n:'QTc – skorygowany odstęp QT (Bazett, Fridericia, Framingham, Hodges)',d:'Korekcja odstępu QT względem częstości rytmu serca czterema wzorami.',
 src:'Bazett, Heart 1920; Fridericia, Acta Med Scand 1920; Sagie i wsp. (Framingham), Am J Cardiol 1992;70:797; Hodges i wsp., J Am Coll Cardiol 1983; progi: AHA/ACCF/HRS 2009 (Rautaharju i wsp., Circulation 2009;119:e241) – Amerykańskie Towarzystwo Kardiologiczne / Amerykańskie Kolegium Kardiologii / Towarzystwo Rytmu Serca',yr:2009,
 f:[N('qt','Odstęp QT (zmierzony)','ms',{min:150,max:800}),N('hr','Częstość rytmu serca (HR)','/min',{min:20,max:250}),SEX],
 calc:function(v){var m=need(v,['qt','hr'],['QT','HR']);if(m.length)return{miss:m};var rr=60/v.hr,qt=v.qt;
  var b=qt/Math.sqrt(rr),fr=qt/Math.cbrt(rr),fm=qt+154*(1-rr),ho=qt+1.75*(v.hr-60);
  var ref=(v.hr<60||v.hr>90)?fr:b,lim=v.sex==='f'?460:450,lvl=ref>=500?'red':ref>lim?'orange':ref<=340?'orange':'green';
  return{v:'Fridericia '+fx(fr,0)+' ms · Bazett '+fx(b,0)+' ms',n:ref,lvl:lvl,
   interp:(ref>=500?'QTc ≥500 ms – znacznie wydłużony, wysokie ryzyko częstoskurczu typu torsade de pointes.':ref>lim?'QTc wydłużony (>'+lim+' ms dla '+(v.sex==='f'?'kobiet':v.sex==='m'?'mężczyzn':'płci nieokreślonej – przyjęto próg męski')+').':ref<=340?'QTc krótki (≤340 ms) – rozważ zespół krótkiego QT.':'QTc w normie.')+' Przy HR <60 lub >90/min wzór Bazetta jest niedokładny – jako referencyjny użyto '+(ref===fr?'wzoru Fridericii':'wzoru Bazetta')+'.',
   cons:ref>=500?'Odstaw leki wydłużające QT, wyrównaj K⁺ i Mg²⁺, monitorowanie EKG; podobnie przy wzroście QTc o >60 ms od wartości wyjściowej.':ref>lim?'Unikaj leków wydłużających QT, kontrola elektrolitów, powtórz EKG.':'Brak działań wynikających z QTc.',
   rows:[['RR',fx(rr*1000,0)+' ms'],['Bazett QT/√RR',fx(b,0)+' ms'],['Fridericia QT/∛RR',fx(fr,0)+' ms'],['Framingham QT+154×(1−RR)',fx(fm,0)+' ms'],['Hodges QT+1,75×(HR−60)',fx(ho,0)+' ms']]};}};
C.abi={g:'kard',n:'ABI – wskaźnik kostka–ramię (ankle-brachial index)',d:'Iloraz ciśnienia skurczowego na kostce (wyższe z tętnicy grzbietowej stopy i piszczelowej tylnej) do wyższego ciśnienia skurczowego na ramionach – osobno dla każdej kończyny.',
 src:'AHA/ACC 2016 – wytyczne dot. choroby tętnic obwodowych kończyn dolnych (Gerhard-Herman i wsp., Circulation 2017;135:e726); ESC 2024 – wytyczne dot. chorób tętnic obwodowych i aorty (Mazzolai i wsp., Eur Heart J 2024)',yr:2024,
 f:[N('bra_r','Ramię prawe – ciśnienie skurczowe','mmHg',{opt:1}),N('bra_l','Ramię lewe – ciśnienie skurczowe','mmHg',{opt:1}),H('Kończyna dolna prawa'),N('pt_r','Tętnica piszczelowa tylna prawa','mmHg',{opt:1}),N('dp_r','Tętnica grzbietowa stopy prawa','mmHg',{opt:1}),H('Kończyna dolna lewa'),N('pt_l','Tętnica piszczelowa tylna lewa','mmHg',{opt:1}),N('dp_l','Tętnica grzbietowa stopy lewa','mmHg',{opt:1})],
 calc:function(v){var br=Math.max(ok(v.bra_r)?v.bra_r:-1,ok(v.bra_l)?v.bra_l:-1);if(br<=0)return{miss:['ciśnienie na ramieniu (co najmniej jedno)']};
  function leg(pt,dp){var a=Math.max(ok(pt)?pt:-1,ok(dp)?dp:-1);return a>0?{abi:a/br,ank:a}:null;}
  var R=leg(v.pt_r,v.dp_r),L=leg(v.pt_l,v.dp_l);if(!R&&!L)return{miss:['ciśnienie na kostce (co najmniej jedna tętnica)']};
  function cls(x){return x>1.4?['>1,40 – tętnice niepodatne na ucisk (zwapnienie; cukrzyca, przewlekła choroba nerek) – wynik niediagnostyczny, wykonaj wskaźnik palec–ramię (TBI)','orange']:x>=1.0?['1,00–1,40 – prawidłowy','green']:x>0.9?['0,91–0,99 – graniczny','orange']:['≤0,90 – choroba tętnic obwodowych kończyn dolnych','red'];}
  var w=[R,L].filter(Boolean).sort(function(a,b){return a.abi-b.abi;})[0],c=cls(w.abi),rows=[['Ciśnienie ramienne (wyższe)',fx(br,0)+' mmHg']];
  if(R)rows.push(['ABI prawy',fx(R.abi,2)+' – '+cls(R.abi)[0]]);if(L)rows.push(['ABI lewy',fx(L.abi,2)+' – '+cls(L.abi)[0]]);
  var crit=[R,L].some(function(x){return x&&x.ank<50;});
  return{v:(R?'P '+fx(R.abi,2):'')+(R&&L?' · ':'')+(L?'L '+fx(L.abi,2):''),n:w.abi,lvl:crit?'red':c[1],interp:'Niższy wskaźnik: '+c[0]+'.',rows:rows,
   cons:(crit?'Ciśnienie na kostce <50 mmHg – podejrzenie przewlekłego niedokrwienia zagrażającego kończynie: pilna konsultacja chirurga naczyniowego. ':'')+(w.abi<=0.9?'ABI ≤0,90 potwierdza chorobę tętnic obwodowych (wysokie ryzyko sercowo-naczyniowe) – prewencja wtórna, dalsza diagnostyka naczyniowa. Ostre niedokrwienie (ból, bladość, brak tętna, parestezje, porażenie) – tryb pilny niezależnie od ABI.':w.abi>1.4?'Wynik niewiarygodny – wykonaj TBI lub USG dopplerowskie.':'ABI nie wskazuje na istotną chorobę tętnic; przy objawach chromania rozważ ABI po wysiłku.')};}};
C.duke={g:'kard',n:'Zmodyfikowane kryteria Duke – Duke-ISCVID 2023 (infekcyjne zapalenie wsierdzia)',d:'Kryteria Duke zaktualizowane w 2023 r. przez Międzynarodowe Towarzystwo Chorób Sercowo-Naczyniowych o Etiologii Zakaźnej (ISCVID); uwzględnione w wytycznych ESC 2023 dot. infekcyjnego zapalenia wsierdzia (IZW).',
 src:'Fowler i wsp., The 2023 Duke-ISCVID Criteria for Infective Endocarditis, Clin Infect Dis 2023;77:518; ESC 2023 – wytyczne Europejskiego Towarzystwa Kardiologicznego dot. IZW (Delgado i wsp., Eur Heart J 2023;44:3948)',yr:2023,
 f:[H('Kryteria patologiczne'),Y('path','Drobnoustroje lub czynne IZW w badaniu histologicznym / hodowli / PCR (reakcji łańcuchowej polimerazy) wegetacji, tkanki serca, protezy lub materiału zatorowego',0),
  H('Kryteria duże'),Y('M_mic','Mikrobiologiczne: typowy drobnoustrój (S. aureus, S. lugdunensis, E. faecalis, paciorkowce poza S. pneumoniae i S. pyogenes, Granulicatella, Abiotrophia, Gemella, grupa HACEK) w ≥2 oddzielnych zestawach posiewów krwi; LUB nietypowy drobnoustrój w ≥3 zestawach; LUB dodatni PCR krwi na Coxiella burnetii, Bartonella, Tropheryma whipplei; LUB IgG anty-Coxiella (faza I) >1:800; LUB IgM i IgG anty-Bartonella >1:800',0),
  Y('M_img','Obrazowe: w echokardiografii lub tomografii komputerowej serca – wegetacja, perforacja lub tętniak płatka, ropień, tętniak rzekomy, przetoka wewnątrzsercowa, nowa istotna niedomykalność, nowe częściowe rozejście protezy; LUB w PET/CT z [18F]FDG (pozytonowej tomografii emisyjnej z 18F-fluorodeoksyglukozą) patologiczny wychwyt na zastawce, protezie, grafcie aorty wstępującej lub elektrodach (>3 mies. od zabiegu)',0),
  Y('M_sur','Chirurgiczne: IZW stwierdzone w śródoperacyjnej ocenie bezpośredniej (bez potwierdzenia obrazowego lub mikrobiologicznego)',0),
  H('Kryteria małe'),Y('m_pre','Predyspozycja: przebyte IZW, proteza zastawki, plastyka zastawki, wrodzona wada serca, niedomykalność lub zwężenie więcej niż łagodne, wszczepione urządzenie wewnątrzsercowe (CIED), kardiomiopatia przerostowa ze zwężeniem drogi odpływu, dożylne przyjmowanie narkotyków',0),
  Y('m_fev','Gorączka >38,0 °C',0),Y('m_vas','Zjawiska naczyniowe: zatory tętnicze, septyczne zawały płuc, ropień mózgu lub śledziony, tętniak zakaźny, krwawienie śródczaszkowe, wybroczyny spojówkowe, zmiany Janewaya, plamica ropna',0),
  Y('m_imm','Zjawiska immunologiczne: czynnik reumatoidalny, guzki Oslera, plamki Rotha, kłębuszkowe zapalenie nerek z kompleksami immunologicznymi',0),
  Y('m_mic','Mikrobiologiczne niespełniające kryterium dużego (np. dodatni posiew krwi z drobnoustrojem zgodnym z IZW; dodatni posiew/PCR z innego jałowego miejsca)',0),
  Y('m_img','Obrazowe: patologiczny wychwyt w PET/CT z [18F]FDG <3 mies. od wszczepienia protezy zastawki, graftu aorty, CIED lub innego materiału',0),
  Y('m_ex','Badanie przedmiotowe: nowa niedomykalność zastawki stwierdzona osłuchowo, gdy echokardiografia niedostępna',0),
  H('Kryteria odrzucenia'),Y('rej','Pewne alternatywne rozpoznanie LUB ustąpienie objawów po ≤4 dniach antybiotykoterapii LUB brak cech IZW w ocenie śródoperacyjnej/sekcyjnej po ≤4 dniach antybiotyku',0)],
 calc:function(v){var M=['M_mic','M_img','M_sur'].filter(function(k){return v[k]===true;}).length,m=['m_pre','m_fev','m_vas','m_imm','m_mic','m_img','m_ex'].filter(function(k){return v[k]===true;}).length;
  var rows=[['Kryteria duże',M+' / 3'],['Kryteria małe',m+' / 7']],def=v.path===true||M>=2||(M>=1&&m>=3)||m>=5,pos=(M>=1&&m>=1)||m>=3;
  if(def)return{v:'PEWNE IZW',lvl:'red',rows:rows,interp:v.path===true?'Spełnione kryterium patologiczne.':'Kryteria kliniczne: 2 duże, lub 1 duże + 3 małe, lub 5 małych.',cons:'Hospitalizacja, konsultacja kardiologa / zespołu ds. IZW (Endocarditis Team), antybiotykoterapia celowana po pobraniu posiewów, ocena wskazań do leczenia operacyjnego.'};
  if(v.rej===true)return{v:'IZW ODRZUCONE',lvl:'green',rows:rows,interp:'Spełnione kryterium odrzucenia.',cons:'Szukaj alternatywnej przyczyny objawów.'};
  if(pos)return{v:'MOŻLIWE IZW',lvl:'orange',rows:rows,interp:'1 duże + 1 małe lub 3 małe kryteria.',cons:'Dalsza diagnostyka: powtórne posiewy krwi (≥3 zestawy przed antybiotykiem, jeśli stan pozwala), echokardiografia przezprzełykowa, ewentualnie TK serca lub PET/CT; konsultacja kardiologa.'};
  return{v:'NIE SPEŁNIA kryteriów możliwego IZW',lvl:'green',rows:rows,interp:'Kryteria IZW niespełnione na obecnym etapie.',cons:'Przy utrzymującym się podejrzeniu – ponowna ocena po uzupełnieniu badań (posiewy, echokardiografia).'};}};
C.hasbled={g:'kard',n:'HAS-BLED – ryzyko poważnego krwawienia przy leczeniu przeciwkrzepliwym',d:'Nadciśnienie, nieprawidłowa czynność nerek/wątroby, udar, krwawienie, chwiejny INR, wiek podeszły, leki/alkohol (akronim angielski).',
 src:'Pisters i wsp., Chest 2010;138:1093; ESC 2024 – wytyczne dot. migotania przedsionków (Van Gelder i wsp., Eur Heart J 2024)',yr:2010,
 f:[Y('h','Niekontrolowane nadciśnienie tętnicze (ciśnienie skurczowe >160 mmHg)'),Y('ar','Nieprawidłowa czynność nerek (dializa, przeszczep, kreatynina ≥2,26 mg/dl / ≥200 µmol/l)'),Y('al','Nieprawidłowa czynność wątroby (marskość lub bilirubina >2× GGN z AST/ALT/ALP >3× GGN; GGN – górna granica normy, AST/ALT – aminotransferazy, ALP – fosfataza zasadowa)'),
  Y('s','Przebyty udar mózgu'),Y('b','Krwawienie w wywiadzie lub skłonność do krwawień (np. niedokrwistość, małopłytkowość)'),Y('l','Chwiejny INR (międzynarodowy współczynnik znormalizowany) – czas w zakresie terapeutycznym <60% (tylko u leczonych antagonistą witaminy K)'),
  N('age','Wiek','lat',{bar:'age',noscore:1}),Y('dr','Leki zwiększające ryzyko krwawienia (przeciwpłytkowe, niesteroidowe leki przeciwzapalne)'),Y('alc','Alkohol ≥8 jednostek (drinków) na tydzień')],
 calc:function(v){var r=sumPts(this,v),s=r.s,rows=r.rows;if(!ok(v.age))return{miss:['wiek']};if(v.age>65){s+=1;rows.push(['Wiek >65 lat','+1']);}
  return{v:s+' / 9 pkt',n:s,lvl:s>=3?'red':s===2?'orange':'green',rows:rows,interp:s>=3?'Wysokie ryzyko krwawienia (≥3 pkt).':s===2?'Umiarkowane ryzyko krwawienia.':'Niskie ryzyko krwawienia.',
   cons:s>=3?'Wysoki wynik NIE jest przeciwwskazaniem do antykoagulacji – skoryguj modyfikowalne czynniki (ciśnienie, leki, alkohol, INR) i zapewnij częstszą kontrolę.':'Koryguj modyfikowalne czynniki ryzyka krwawienia.'};}};
// ================= PULMONOLOGIA =================
C.light={g:'pulm',n:'Kryteria Lighta – płyn opłucnowy: wysięk czy przesięk',d:'Płyn jest wysiękiem, gdy spełnione jest ≥1 kryterium.',
 src:'Light i wsp., Ann Intern Med 1972;77:507; gradient albumin: Roth i wsp., Chest 1990;98:546; BTS 2023 – wytyczne Brytyjskiego Towarzystwa Chorób Klatki Piersiowej dot. chorób opłucnej (Roberts i wsp., Thorax 2023)',yr:1972,
 f:[N('pp','Białko całkowite w płynie opłucnowym',ALB_U),N('sp','Białko całkowite w surowicy',ALB_U),N('pl','LDH (dehydrogenaza mleczanowa) w płynie','U/l'),N('sl','LDH w surowicy','U/l'),N('uln','Górna granica normy LDH w surowicy (laboratorium)','U/l'),
  H('Opcjonalnie – przy leczeniu diuretykami'),N('pa','Albumina w płynie',ALB_U,{opt:1}),N('sa','Albumina w surowicy',ALB_U,{opt:1})],
 calc:function(v){var m=need(v,['pp','sp','pl','sl','uln'],['białko w płynie','białko w surowicy','LDH w płynie','LDH w surowicy','górna granica normy LDH']);if(m.length)return{miss:m};
  var r1=v.pp/v.sp,r2=v.pl/v.sl,r3=v.pl/v.uln,c1=r1>0.5,c2=r2>0.6,c3=r3>2/3,ex=c1||c2||c3;
  var rows=[['Białko płyn/surowica',fx(r1,2)+(c1?' >0,5 ✔':' ≤0,5')],['LDH płyn/surowica',fx(r2,2)+(c2?' >0,6 ✔':' ≤0,6')],['LDH płynu / górna granica normy',fx(r3,2)+(c3?' >2/3 ✔':' ≤2/3')]],grad='';
  if(ok(v.pa)&&ok(v.sa)){var g=v.sa-v.pa;rows.push(['Gradient albumin surowica − płyn',fx(g,2)+' g/dl'+(g>1.2?' (>1,2 → przesięk)':'')]);if(ex&&g>1.2)grad=' Gradient albumin >1,2 g/dl przemawia za przesiękiem mimo kryteriów Lighta (typowe po diuretykach w niewydolności serca).';}
  return{v:ex?'WYSIĘK':'PRZESIĘK',lvl:ex?'orange':'green',rows:rows,interp:(ex?'Spełnione kryteria: '+[c1?'iloraz białka':'',c2?'iloraz LDH':'',c3?'LDH >2/3 górnej granicy normy':''].filter(Boolean).join(', ')+'.':'Żadne kryterium niespełnione.')+grad,
   cons:ex?'Wysięk: szukaj zakażenia (pH, glukoza, posiew, barwienie metodą Grama), nowotworu (cytologia), gruźlicy, zatorowości płucnej; przy pH <7,2 w zakażeniu – drenaż.':'Przesięk: niewydolność serca, marskość, zespół nerczycowy, hipoalbuminemia – leczenie przyczyny. Kryteria Lighta mylnie klasyfikują ok. 25% przesięków jako wysięki u chorych leczonych diuretykami.'};}};
C.aa={g:'pulm',n:'Gradient pęcherzykowo-tętniczy tlenu (A–a) i wskaźnik PaO₂/FiO₂',d:'PAO₂ = FiO₂ × (ciśnienie atmosferyczne − 47) − PaCO₂ / 0,8. Wskaźnik oksygenacji PaO₂/FiO₂ (Horowitza).',
 src:'Równanie gazu pęcherzykowego; norma wiekowa ≈ wiek/4 + 4 mmHg; definicja ARDS (zespołu ostrej niewydolności oddechowej): ARDS Definition Task Force (definicja berlińska), JAMA 2012;307:2526',yr:2012,
 f:[N('fio2','FiO₂ – frakcja tlenu w mieszaninie oddechowej','%',{min:21,max:100}),N('pao2','PaO₂ – ciśnienie parcjalne tlenu we krwi tętniczej',KPA),N('paco2','PaCO₂ – ciśnienie parcjalne dwutlenku węgla we krwi tętniczej',KPA),AGE,N('patm','Ciśnienie atmosferyczne (domyślnie 760)','mmHg',{opt:1})],
 calc:function(v){var m=need(v,['fio2','pao2','paco2'],['FiO₂','PaO₂','PaCO₂']);if(m.length)return{miss:m};var F=v.fio2/100,P=ok(v.patm)?v.patm:760,PA=F*(P-47)-v.paco2/0.8,g=PA-v.pao2,pf=v.pao2/F;
  var exp=ok(v.age)?v.age/4+4:NaN,hi=ok(exp)?g>exp:g>15;
  var ards=pf<=100?'≤100 – ciężka hipoksemia (kategoria ARDS ciężki, jeśli PEEP – dodatnie ciśnienie końcowowydechowe ≥5 cmH₂O)':pf<=200?'101–200 – umiarkowana (kategoria ARDS umiarkowany)':pf<=300?'201–300 – łagodna (kategoria ARDS łagodny)':'>300 – bez kryterium ARDS';
  return{v:'A–a '+fx(g,0)+' mmHg · PaO₂/FiO₂ '+fx(pf,0),n:g,lvl:pf<=200?'red':hi||pf<=300?'orange':'green',rows:[['PAO₂ (pęcherzykowe)',fx(PA,0)+' mmHg'],['Gradient A–a',fx(g,1)+' mmHg'],['Norma dla wieku',ok(exp)?'≤ '+fx(exp,0)+' mmHg':'brak wieku (orientacyjnie <15 mmHg)'],['PaO₂/FiO₂',fx(pf,0)+' mmHg – '+ards]],
   interp:hi?'Gradient A–a podwyższony – hipoksemia z zaburzeń stosunku wentylacji do perfuzji, przecieku lub dyfuzji (np. zapalenie płuc, zatorowość płucna, obrzęk płuc).':'Gradient A–a w normie – przy hipoksemii rozważ hipowentylację (↑PaCO₂) lub niskie ciśnienie wdychanego tlenu.',
   cons:'Wynik wiarygodny przy znanym FiO₂ (wentylacja, mieszalnik; przy masce/wąsach FiO₂ jest szacunkowe). '+(P===760?'Przyjęto 760 mmHg (poziom morza); w Nowym Targu (ok. 600 m n.p.m.) ciśnienie jest niższe – ok. 705 mmHg – wpisz wartość z barometru, jeśli dostępna.':'')};}};
C.rox={g:'pulm',n:'Wskaźnik ROX – ryzyko niepowodzenia tlenoterapii donosowej wysokoprzepływowej (HFNC)',d:'ROX = (SpO₂ / FiO₂) / częstość oddechów.',
 src:'Roca i wsp., Am J Respir Crit Care Med 2019;199:1368',yr:2019,
 f:[N('spo2','SpO₂ – saturacja krwi tętniczej (pulsoksymetria)','%',{min:50,max:100}),N('fio2','FiO₂ – frakcja tlenu','%',{min:21,max:100}),N('rr','Częstość oddechów','/min',{min:4,max:80}),S('t','Czas od rozpoczęcia HFNC',[['2','2 h'],['6','6 h'],['12','12 h']],{def:'2'})],
 calc:function(v){var m=need(v,['spo2','fio2','rr'],['SpO₂','FiO₂','częstość oddechów']);if(m.length)return{miss:m};var x=(v.spo2/(v.fio2/100))/v.rr,low={'2':2.85,'6':3.47,'12':3.85}[v.t||'2'];
  return{v:fx(x,2),n:x,lvl:x>=4.88?'green':x<low?'red':'orange',interp:x>=4.88?'≥4,88 – mniejsze ryzyko intubacji.':x<low?'<'+fx(low,2)+' po '+(v.t||'2')+' h – wysokie ryzyko niepowodzenia HFNC.':'Strefa pośrednia – ponów pomiar za 1–2 h.',
   cons:x<low?'Pilna ocena anestezjologiczna: rozważ intubację/wentylację; nie opóźniaj eskalacji.':x>=4.88?'Kontynuuj HFNC z monitorowaniem.':'Ścisłe monitorowanie, ponowna ocena ROX.',rows:[['SpO₂/FiO₂',fx(v.spo2/(v.fio2/100),0)]]};}};
// ================= GASTROENTEROLOGIA =================
C.rockall={g:'gast',n:'Skala Rockalla – krwawienie z górnego odcinka przewodu pokarmowego',d:'Skala przedendoskopowa (wiek, wstrząs, choroby współistniejące; 0–7) i pełna (+ rozpoznanie i stygmaty krwawienia w endoskopii; 0–11).',
 src:'Rockall i wsp., Gut 1996;38:316; ESGE 2021 – wytyczne Europejskiego Towarzystwa Endoskopii Przewodu Pokarmowego (Gralnek i wsp., Endoscopy 2021;53:300)',yr:1996,
 f:[S('a','Wiek',[['0','<60 lat',0],['1','60–79 lat',1],['2','≥80 lat',2]]),S('sh','Wstrząs',[['0','brak (ciśnienie skurczowe ≥100 mmHg, tętno <100/min)',0],['1','tachykardia (tętno ≥100/min, ciśnienie skurczowe ≥100 mmHg)',1],['2','hipotensja (ciśnienie skurczowe <100 mmHg)',2]]),
  S('co','Choroby współistniejące',[['0','brak istotnych',0],['2','niewydolność serca, choroba niedokrwienna serca, inna poważna choroba',2],['3','niewydolność nerek, niewydolność wątroby, rozsiany nowotwór',3]]),
  H('Po endoskopii (opcjonalnie)'),S('dx','Rozpoznanie endoskopowe',[['0','zespół Mallory’ego-Weissa lub brak zmian i brak stygmatów',0],['1','każde inne rozpoznanie',1],['2','nowotwór górnego odcinka przewodu pokarmowego',2]],{opt:1}),
  S('srh','Stygmaty krwawienia',[['0','brak lub ciemna plamka',0],['2','krew w świetle, przylegający skrzep, widoczne lub krwawiące naczynie',2]],{opt:1})],
 calc:function(v){var r=sumPts(this,v);if(r.miss.length)return{miss:r.miss};var full=v.dx!==undefined&&v.dx!==''&&v.srh!==undefined&&v.srh!=='',s=r.s;
  if(!full){return{v:'przedendoskopowa '+s+' / 7 pkt',n:s,lvl:s===0?'green':s>=4?'red':'orange',rows:r.rows,interp:s===0?'0 pkt – bardzo niskie ryzyko zgonu.':'Wynik przedendoskopowy – ryzyko rośnie z liczbą punktów.',cons:'Do decyzji o wypisie przed endoskopią preferowana jest skala Glasgow-Blatchford (moduł „Krwawienie z GI”). Pełną skalę Rockalla uzupełnij po endoskopii.'};}
  return{v:'pełna '+s+' / 11 pkt',n:s,lvl:s<=2?'green':s>=8?'red':'orange',rows:r.rows,interp:s<=2?'≤2 pkt – niskie ryzyko nawrotu krwawienia i zgonu.':s>=8?'≥8 pkt – bardzo wysokie ryzyko zgonu.':'Ryzyko pośrednie do wysokiego.',cons:s<=2?'Możliwy wczesny wypis po leczeniu endoskopowym – decyzja lekarza.':'Hospitalizacja z monitorowaniem; ocena ryzyka nawrotu.'};}};
C.aims65={g:'gast',n:'AIMS65 – śmiertelność w krwawieniu z górnego odcinka przewodu pokarmowego',d:'Albumina, INR, zaburzenia świadomości, ciśnienie skurczowe, wiek ≥65 (akronim angielski).',
 src:'Saltzman i wsp., Gastrointest Endosc 2011;74:1215',yr:2011,
 f:[Y('al','Albumina <3,0 g/dl (<30 g/l)'),Y('inr','INR (międzynarodowy współczynnik znormalizowany) >1,5'),Y('ms','Zaburzenia świadomości (GCS – skala śpiączki Glasgow <14, dezorientacja, senność)'),Y('sbp','Ciśnienie skurczowe ≤90 mmHg'),Y('age','Wiek ≥65 lat')],
 bands:[[0,'0 pkt – śmiertelność wewnątrzszpitalna ok. 0,3%','green','Niskie ryzyko zgonu (nie jest to kryterium wypisu – użyj skali Glasgow-Blatchford).'],[1,'1 pkt – śmiertelność ok. 1,2%','orange','Hospitalizacja wg oceny klinicznej.'],[5,'≥2 pkt – wysokie ryzyko zgonu (2 pkt ok. 5%, 3 pkt ok. 10%, 4 pkt ok. 17%, 5 pkt ok. 25%)','red','Hospitalizacja, intensywny nadzór, pilna endoskopia po stabilizacji.']],
 calc:function(v){return scoreCalc(this,v,5);}};
C.childpugh={g:'gast',n:'Skala Childa-Pugha – zaawansowanie marskości wątroby',d:'Bilirubina, albumina, INR, wodobrzusze, encefalopatia wątrobowa.',
 src:'Pugh i wsp., Br J Surg 1973;60:646 (modyfikacja klasyfikacji Childa-Turcotte’a 1964)',yr:1973,
 f:[N('bili','Bilirubina całkowita',BILI_U),N('alb','Albumina',ALB_U),N('inr','INR – międzynarodowy współczynnik znormalizowany',''),S('asc','Wodobrzusze',[['1','brak',1],['2','niewielkie / kontrolowane lekami',2],['3','umiarkowane do dużego / oporne',3]]),S('enc','Encefalopatia wątrobowa',[['1','brak',1],['2','stopień 1–2 (lub kontrolowana lekami)',2],['3','stopień 3–4',3]])],
 calc:function(v){var m=need(v,['bili','alb','inr'],['bilirubina','albumina','INR']);if(!v.asc)m.push('wodobrzusze');if(!v.enc)m.push('encefalopatia');if(m.length)return{miss:m};
  var b=v.bili<2?1:v.bili<=3?2:3,a=v.alb>3.5?1:v.alb>=2.8?2:3,i=v.inr<1.7?1:v.inr<=2.3?2:3,s=b+a+i+(+v.asc)+(+v.enc),k=s<=6?'A':s<=9?'B':'C';
  return{v:'klasa '+k+' ('+s+' pkt)',n:s,lvl:k==='A'?'green':k==='B'?'orange':'red',rows:[['Bilirubina',b+' pkt'],['Albumina',a+' pkt'],['INR',i+' pkt'],['Wodobrzusze',v.asc+' pkt'],['Encefalopatia',v.enc+' pkt']],
   interp:{A:'Klasa A (5–6 pkt) – marskość wyrównana.',B:'Klasa B (7–9 pkt) – istotne upośledzenie czynności wątroby.',C:'Klasa C (10–15 pkt) – marskość niewyrównana.'}[k],
   cons:'Klasa B/C: dostosuj dawki leków metabolizowanych w wątrobie (wg ChPL – Charakterystyki Produktu Leczniczego), unikaj leków hepatotoksycznych i nadmiernej sedacji; konsultacja hepatologa/gastroenterologa. W cholestatycznych chorobach wątroby (np. pierwotne zapalenie dróg żółciowych) progi bilirubiny są inne.'};}};
C.meldna={g:'gast',n:'MELD-Na – model schyłkowej choroby wątroby z sodem',d:'Model for End-stage Liver Disease z korektą sodu (wersja OPTN/UNOS 2016).',
 src:'Kim i wsp., N Engl J Med 2008;359:1018; OPTN/UNOS (amerykańska Sieć Pozyskiwania i Przeszczepiania Narządów) – zasady obliczania MELD-Na 2016; od 2023 r. OPTN stosuje MELD 3.0 (Kim i wsp., Gastroenterology 2021) – nie zaimplementowano',yr:2016,
 f:[CR,N('bili','Bilirubina całkowita',BILI_U),N('inr','INR – międzynarodowy współczynnik znormalizowany',''),N('na','Sód w surowicy','mmol/l'),Y('dial','Dializa ≥2× w ostatnim tygodniu lub ciągła terapia nerkozastępcza ≥24 h w ostatnim tygodniu',0)],
 calc:function(v){var m=need(v,['cr','bili','inr','na'],['kreatynina','bilirubina','INR','sód']);if(m.length)return{miss:m};
  var cr=v.dial===true?4:Math.min(Math.max(v.cr,1),4),bi=Math.max(v.bili,1),inr=Math.max(v.inr,1),na=Math.min(Math.max(v.na,125),137);
  var meld=Math.round((0.957*Math.log(cr)+0.378*Math.log(bi)+1.120*Math.log(inr)+0.643)*100)/10,mn=meld>11?meld+1.32*(137-na)-0.033*meld*(137-na):meld;mn=Math.min(40,Math.round(mn));
  return{v:'MELD-Na '+mn,n:mn,lvl:mn>=30?'red':mn>=20?'orange':'green',rows:[['MELD (bez sodu)',fx(meld,1)],['Wartości użyte (ograniczenia 1–4 / 125–137)','kreatynina '+fx(cr,2)+' mg/dl, bilirubina '+fx(bi,2)+' mg/dl, INR '+fx(inr,2)+', Na '+na+' mmol/l']],
   interp:'3-miesięczna śmiertelność rośnie z wynikiem (orientacyjnie wg kohort MELD: <10 – ok. 2%; 10–19 – ok. 6%; 20–29 – ok. 20%; 30–39 – ok. 50%; ≥40 – ok. 70%).',
   cons:mn>=15?'Wynik ≥15 – rozważ konsultację ośrodka transplantacyjnego. W SOR: przy dekompensacji (wodobrzusze, encefalopatia, krwawienie, zakażenie) – hospitalizacja.':'Wynik nie zastępuje oceny klinicznej dekompensacji (wodobrzusze, encefalopatia, krwawienie, zakażenie).'};}};
C.bisap={g:'gast',n:'BISAP – ciężkość ostrego zapalenia trzustki',d:'Bedside Index for Severity in Acute Pancreatitis – ocena w ciągu pierwszych 24 h.',
 src:'Wu i wsp., Gut 2008;57:1698',yr:2008,
 f:[Y('bun','Azot mocznikowy (BUN) >25 mg/dl (≈ mocznik >53,5 mg/dl lub >8,9 mmol/l)'),Y('ms','Zaburzenia świadomości (GCS – skala śpiączki Glasgow <15)'),Y('sirs','SIRS – zespół ogólnoustrojowej odpowiedzi zapalnej (≥2 kryteria; patrz kalkulator SIRS)'),Y('age','Wiek >60 lat'),Y('pe','Płyn w jamie opłucnej w badaniu obrazowym')],
 bands:[[2,'0–2 pkt – niskie ryzyko zgonu (<2%)','green','Leczenie standardowe: płynoterapia ukierunkowana na cel, analgezja, wczesne żywienie doustne.'],[5,'≥3 pkt – wysokie ryzyko ciężkiego przebiegu i zgonu (wielokrotnie wyższa śmiertelność)','red','Monitorowanie w warunkach wzmożonego nadzoru, ocena niewydolności narządowej, konsultacja chirurga i OIT (oddziału intensywnej terapii).']],
 calc:function(v){return scoreCalc(this,v,5);}};
// ================= NEFROLOGIA I ELEKTROLITY =================
function ckdepi21(cr,age,sex){var k=sex==='f'?0.7:0.9,a=sex==='f'?-0.241:-0.302,x=cr/k;return 142*Math.pow(Math.min(x,1),a)*Math.pow(Math.max(x,1),-1.2)*Math.pow(0.9938,age)*(sex==='f'?1.012:1);}
function cg(cr,age,w,sex){return (140-age)*w/(72*cr)*(sex==='f'?0.85:1);}
C.egfr={g:'nef',n:'eGFR (CKD-EPI 2021) i klirens kreatyniny (Cockcroft-Gault)',d:'Szacowany współczynnik przesączania kłębuszkowego wg równania CKD-EPI (Chronic Kidney Disease Epidemiology Collaboration) 2021 bez współczynnika rasy oraz klirens kreatyniny wg Cockcrofta-Gaulta.',
 src:'Inker i wsp., N Engl J Med 2021;385:1737 (CKD-EPI 2021); Cockcroft, Gault, Nephron 1976;16:31; KDIGO 2024 – wytyczne Kidney Disease: Improving Global Outcomes dot. przewlekłej choroby nerek',yr:2021,
 f:[CR,AGE,SEX,WT],
 calc:function(v){var m=need(v,['cr','age'],['kreatynina','wiek']);if(!v.sex)m.push('płeć');if(m.length)return{miss:m};if(v.age<18)return{err:'Równania dla dorosłych (≥18 lat).'};
  var e=ckdepi21(v.cr,v.age,v.sex),c=ok(v.w)?cg(v.cr,v.age,v.w,v.sex):NaN,G=e>=90?'G1':e>=60?'G2':e>=45?'G3a':e>=30?'G3b':e>=15?'G4':'G5';
  return{v:'eGFR '+fx(e,0)+' ml/min/1,73 m²'+(ok(c)?' · CrCl '+fx(c,0)+' ml/min':''),n:e,lvl:e<30?'red':e<60?'orange':'green',rows:[['CKD-EPI 2021',fx(e,0)+' ml/min/1,73 m² (kategoria '+G+' wg KDIGO)'],['Cockcroft-Gault (klirens kreatyniny – CrCl)',ok(c)?fx(c,0)+' ml/min (masa rzeczywista '+fx(v.w,0)+' kg)':'brak masy ciała']],
   interp:'Kategoria '+G+': '+{G1:'≥90 – prawidłowy lub wysoki',G2:'60–89 – łagodnie obniżony',G3a:'45–59 – łagodnie do umiarkowanie obniżony',G3b:'30–44 – umiarkowanie do znacznie obniżony',G4:'15–29 – znacznie obniżony',G5:'<15 – niewydolność nerek'}[G]+' (przewlekłą chorobę nerek rozpoznaje się przy utrzymywaniu >3 mies.).',
   cons:'Dawkowanie leków: stosuj wartość wskazaną w ChPL (Charakterystyce Produktu Leczniczego) – zwykle Cockcroft-Gault. W ostrym uszkodzeniu nerek (niestabilna kreatynina) oba wzory są niewiarygodne. Przy otyłości/kacheksji Cockcroft-Gault z masą rzeczywistą jest niedokładny.'};}};
C.fena={g:'nef',n:'FENa i FEUrea – frakcyjne wydalanie sodu i mocznika',d:'FENa = (Na w moczu × kreatynina w surowicy) / (Na w surowicy × kreatynina w moczu) × 100%.',
 src:'Espinel, JAMA 1976;236:579; Miller i wsp., Ann Intern Med 1978;89:47; FEUrea: Carvounis i wsp., Kidney Int 2002;62:2223',yr:2002,
 f:[N('pna','Sód w surowicy','mmol/l'),N('una','Sód w moczu (próbka jednorazowa)','mmol/l'),N('pcr','Kreatynina w surowicy','(ta sama jednostka co w moczu)'),N('ucr','Kreatynina w moczu','(ta sama jednostka co w surowicy)'),H('Opcjonalnie – FEUrea (przy diuretykach)'),N('pu','Mocznik w surowicy','(ta sama jednostka co w moczu)',{opt:1}),N('uu','Mocznik w moczu','(ta sama jednostka)',{opt:1})],
 calc:function(v){var m=need(v,['pna','una','pcr','ucr'],['Na w surowicy','Na w moczu','kreatynina w surowicy','kreatynina w moczu']);if(m.length)return{miss:m};var fe=v.una*v.pcr/(v.pna*v.ucr)*100,fu=ok(v.pu)&&ok(v.uu)?v.uu*v.pcr/(v.pu*v.ucr)*100:NaN;
  var rows=[['FENa',fx(fe,2)+' %']];if(ok(fu))rows.push(['FEUrea',fx(fu,1)+' % ('+(fu<35?'<35% – przednerkowe':fu>50?'>50% – nerkowe (ostra martwica cewek)':'35–50% – niejednoznaczne')+')']);
  return{v:'FENa '+fx(fe,2)+' %'+(ok(fu)?' · FEUrea '+fx(fu,1)+' %':''),n:fe,lvl:fe>2?'red':'orange',rows:rows,interp:fe<1?'<1% – przemawia za przednerkowym ostrym uszkodzeniem nerek (hipowolemia, niewydolność serca, marskość).':fe>2?'>2% – przemawia za nerkową przyczyną (ostra martwica cewek nerkowych).':'1–2% – wynik niejednoznaczny.',
   cons:'Wiarygodne przy skąpomoczu i bez diuretyków; po diuretykach użyj FEUrea. Fałszywie niskie FENa: kontrast, rabdomioliza, ostre kłębuszkowe zapalenie nerek, posocznica. Leczenie zależy od oceny wolemii.'};}};
C.osm={g:'nef',n:'Osmolalność wyliczona i luka osmolalna',d:'Osmolalność = 2 × Na⁺ + glukoza + mocznik (+ etanol) [wszystko w mmol/l]; luka = zmierzona − wyliczona.',
 src:'Dorwart i Chalmers, Clin Chem 1975;21:190; Purssell i wsp., Ann Emerg Med 2001;38:653 (udział etanolu); EXTRIP (Extracorporeal Treatments in Poisoning Workgroup) – metanol 2015, glikol etylenowy 2022',yr:2001,
 f:[N('na','Sód','mmol/l'),N('glu','Glukoza',GLU_U,{si:1}),N('ur','Mocznik (nie BUN)',[['mmol/l',1],['mg/dl',1/6.006]]),N('et','Etanol (jeśli oznaczony)',[['mg/dl',1],['‰ (promile ≈ g/l)',100],['mmol/l',4.607]],{opt:1}),N('mo','Osmolalność zmierzona (osmometr)','mOsm/kg H₂O',{opt:1})],
 calc:function(v){var m=need(v,['na','glu','ur'],['sód','glukoza','mocznik']);if(m.length)return{miss:m};var g=v.glu/18.016,et=ok(v.et)?v.et/4.607:0,c=2*v.na+g+v.ur+et,gap=ok(v.mo)?v.mo-c:NaN;
  var rows=[['Osmolalność wyliczona',fx(c,0)+' mOsm/kg'],['Glukoza',fx(g,1)+' mmol/l'],['Etanol w obliczeniu',ok(v.et)?fx(et,1)+' mmol/l':'nie oznaczono (luka zawiera wtedy etanol!)']];if(ok(gap))rows.push(['Luka osmolalna',fx(gap,0)+' mOsm/kg']);
  return{v:ok(gap)?'luka '+fx(gap,0)+' mOsm/kg':'wyliczona '+fx(c,0)+' mOsm/kg',n:ok(gap)?gap:c,lvl:ok(gap)?(gap>20?'red':gap>10?'orange':'green'):(c>320||c<275?'orange':'green'),rows:rows,
   interp:ok(gap)?(gap>20?'Luka >20 mOsm/kg – silnie podejrzane zatrucie metanolem/glikolem etylenowym (lub innym osmotycznie czynnym związkiem).':gap>10?'Luka >10 mOsm/kg – podwyższona.':'Luka prawidłowa (≤10) – nie wyklucza późnej fazy zatrucia toksycznym alkoholem.'):'Norma osmolalności 275–295 mOsm/kg. Wpisz osmolalność zmierzoną, aby obliczyć lukę.',
   cons:'Podejrzenie toksycznego alkoholu → moduł „Zatrucia” (luka anionowa, odtrutka, wskazania do dializy wg EXTRIP), kontakt z ośrodkiem toksykologicznym.'};}};
C.ag={g:'nef',n:'Luka anionowa z korektą na albuminę i współczynnik delta',d:'AG (luka anionowa) = Na⁺ − (Cl⁻ + HCO₃⁻); korekta: AG + 2,5 × (4,0 − albumina [g/dl]); delta = (AG − norma) / (24 − HCO₃⁻).',
 src:'Emmett, Narins, Medicine 1977;56:38; korekta na albuminę: Figge i wsp., Crit Care Med 1998;26:1807; współczynnik delta: Wrenn, Ann Emerg Med 1990;19:1310',yr:1998,
 f:[N('na','Sód (Na⁺)','mmol/l'),N('cl','Chlorki (Cl⁻)','mmol/l'),N('hco3','Wodorowęglany (HCO₃⁻)','mmol/l'),N('k','Potas (K⁺) – opcjonalnie','mmol/l',{opt:1}),N('alb','Albumina',ALB_U,{opt:1}),N('nag','Norma AG w laboratorium bez K⁺ (domyślnie 12)','mmol/l',{opt:1})],
 calc:function(v){var m=need(v,['na','cl','hco3'],['Na⁺','Cl⁻','HCO₃⁻']);if(m.length)return{miss:m};var n=ok(v.nag)?v.nag:12,ag=v.na-v.cl-v.hco3,agc=ok(v.alb)?ag+2.5*(4-v.alb):ag,dr=v.hco3<24?(agc-n)/(24-v.hco3):NaN;
  var rows=[['AG (bez K⁺)',fx(ag,1)+' mmol/l']];if(ok(v.k))rows.push(['AG z K⁺',fx(ag+v.k,1)+' mmol/l']);if(ok(v.alb))rows.push(['AG skorygowana na albuminę',fx(agc,1)+' mmol/l (albumina '+fx(v.alb,1)+' g/dl)']);if(ok(dr))rows.push(['Współczynnik delta',fx(dr,2)]);
  var hi=agc>n,di=!ok(dr)||!hi?'':dr<0.4?'<0,4 – przeważa kwasica z prawidłową luką (hiperchloremiczna).':dr<1?'0,4–1 – kwasica z dużą luką + współistniejąca kwasica z prawidłową luką.':dr<=2?'1–2 – czysta kwasica z dużą luką.':'>2 – kwasica z dużą luką + współistniejąca zasadowica metaboliczna (lub przewlekła kwasica oddechowa).';
  return{v:'AG '+fx(agc,1)+' mmol/l'+(ok(v.alb)?' (skorygowana)':''),n:agc,lvl:hi?'red':'green',rows:rows,interp:(hi?'Podwyższona luka anionowa – kwasica metaboliczna z dużą luką (mleczany, ketony, niewydolność nerek, toksyczne alkohole, salicylany).':'Luka anionowa w normie.')+(di?' Delta: '+di:'')+(!ok(v.alb)?' Bez albuminy luka może być fałszywie niska (hipoalbuminemia maskuje kwasicę z dużą luką).':''),
   cons:hi?'Oznacz mleczany, ketony, kreatyninę, osmolalność (luka osmolalna), salicylany; podejrzenie toksycznego alkoholu → moduł „Zatrucia”.':'Przy kwasicy z prawidłową luką: utrata HCO₃⁻ z przewodu pokarmowego, kwasica cewkowa, nadmiar NaCl 0,9%.'};}};
C.na={g:'nef',n:'Sód: korekta w hiperglikemii i deficyt wolnej wody',d:'Na skorygowany = Na + 1,6 (Katz) lub 2,4 (Hillier) × [(glukoza − 100 mg/dl) / 100]; deficyt wody = całkowita woda ustrojowa × (Na / 140 − 1).',
 src:'Katz, N Engl J Med 1973;289:843; Hillier i wsp., Am J Med 1999;106:399; Adrogué, Madias, N Engl J Med 2000;342:1493 (hipernatremia)',yr:1999,
 f:[N('na','Sód (Na⁺)','mmol/l'),N('glu','Glukoza (opcjonalnie – korekta)',GLU_U,{si:1,opt:1}),WT,AGE,SEX],
 calc:function(v){if(!ok(v.na))return{miss:['sód']};var rows=[],out=[],lvl='green';
  if(ok(v.glu)){var gm=v.glu,k=v.na+1.6*Math.max(0,gm-100)/100,h=v.na+2.4*Math.max(0,gm-100)/100;rows.push(['Na skorygowany (Katz 1,6)',fx(k,1)+' mmol/l'],['Na skorygowany (Hillier 2,4)',fx(h,1)+' mmol/l']);out.push('Na skorygowany '+fx(k,0)+'–'+fx(h,0)+' mmol/l');}
  if(v.na>145){if(!ok(v.w)||!ok(v.age)||!v.sex)return{miss:['masa ciała, wiek i płeć (do deficytu wody)']};var fr=v.age>=65?(v.sex==='f'?0.45:0.5):(v.sex==='f'?0.5:0.6),tbw=fr*v.w,d=tbw*(v.na/140-1);rows.push(['Całkowita woda ustrojowa',fx(tbw,1)+' l (współczynnik '+fx(fr,2)+')'],['Deficyt wolnej wody',fx(d,1)+' l']);out.push('deficyt wody '+fx(d,1)+' l');lvl=v.na>=160?'red':'orange';}
  else if(v.na<135)lvl='orange';
  if(!out.length)out.push('Na '+fx(v.na,0)+' mmol/l');
  return{v:out.join(' · '),n:v.na,lvl:lvl,rows:rows,interp:(v.na>145?'Hipernatremia.':v.na<135?'Hiponatremia'+(ok(v.glu)&&v.glu>200?' – częściowo translokacyjna w hiperglikemii (patrz Na skorygowany).':'.'):'Natremia w normie.')+(ok(v.glu)?' Współczynnik 2,4 (Hillier) dokładniejszy przy glukozie >400 mg/dl.':''),
   cons:v.na>145?'Wyrównuj stopniowo: w hipernatremii przewlekłej (>48 h) obniżaj Na⁺ nie szybciej niż ok. 10 mmol/l na dobę; kontrola Na⁺ co 2–4 h; uwzględnij bieżące straty wody.':v.na<135?'Hiponatremia – postępowanie w module „Elektrolity” (cel i limit korekty).':'—'};}};
C.caCorr={g:'nef',n:'Wapń skorygowany względem albuminy',d:'Ca skorygowany = Ca + 0,8 × (4,0 − albumina [g/dl]) [mg/dl]; = Ca + 0,02 × (40 − albumina [g/l]) [mmol/l].',
 src:'Payne i wsp., Br Med J 1973;4:643',yr:1973,
 f:[N('ca','Wapń całkowity',[['mg/dl',1],['mmol/l',4.008]]),N('alb','Albumina',ALB_U)],
 calc:function(v){var m=need(v,['ca','alb'],['wapń całkowity','albumina']);if(m.length)return{miss:m};var c=v.ca+0.8*(4-v.alb),mm=c/4.008;
  return{v:fx(c,2)+' mg/dl ('+fx(mm,2)+' mmol/l)',n:c,lvl:c>12||c<7.5?'red':c>10.5||c<8.5?'orange':'green',rows:[['Ca zmierzony',fx(v.ca,2)+' mg/dl ('+fx(v.ca/4.008,2)+' mmol/l)'],['Albumina',fx(v.alb,1)+' g/dl ('+fx(v.alb*10,0)+' g/l)']],
   interp:c>10.5?'Hiperkalcemia (skorygowana >10,5 mg/dl / >2,62 mmol/l).':c<8.5?'Hipokalcemia (skorygowana <8,5 mg/dl / <2,12 mmol/l).':'Wapń skorygowany w normie (8,5–10,5 mg/dl; 2,12–2,62 mmol/l – zakres orientacyjny, sprawdź normę laboratorium).',
   cons:'Wzór jest niedokładny w przewlekłej chorobie nerek, stanach krytycznych i zaburzeniach kwasowo-zasadowych – przy decyzji terapeutycznej oznacz wapń zjonizowany.'};}};
// ================= HEMATOLOGIA =================
C.fourT={g:'hem',n:'Skala 4T – prawdopodobieństwo małopłytkowości poheparynowej (HIT)',d:'Trombocytopenia, czas wystąpienia (timing), zakrzepica (thrombosis), inne przyczyny (other) – HIT: heparin-induced thrombocytopenia.',
 src:'Lo i wsp., J Thromb Haemost 2006;4:759; ASH 2018 – wytyczne Amerykańskiego Towarzystwa Hematologicznego dot. HIT (Cuker i wsp., Blood Adv 2018;2:3360)',yr:2006,
 f:[S('t1','Małopłytkowość',[['2','spadek >50% i nadir ≥20 G/l',2],['1','spadek 30–50% lub nadir 10–19 G/l',1],['0','spadek <30% lub nadir <10 G/l',0]]),
  S('t2','Czas wystąpienia spadku',[['2','5.–10. dzień lub ≤1 dzień przy ekspozycji na heparynę w ostatnich 30 dniach',2],['1','zgodny z 5.–10. dniem, ale niepewny; po 10. dniu; lub ≤1 dzień przy ekspozycji 30–100 dni temu',1],['0','<4 dni bez niedawnej ekspozycji',0]]),
  S('t3','Zakrzepica lub inne następstwa',[['2','nowa zakrzepica, martwica skóry w miejscu wstrzyknięć, ostra reakcja ogólnoustrojowa po bolusie heparyny',2],['1','postępująca/nawrotowa zakrzepica, zaczerwienienie skóry, podejrzenie zakrzepicy',1],['0','brak',0]]),
  S('t4','Inne przyczyny małopłytkowości',[['2','brak oczywistych',2],['1','możliwe',1],['0','pewne',0]])],
 bands:[[3,'0–3 pkt – niskie prawdopodobieństwo HIT (ujemna wartość predykcyjna ok. 99%)','green','HIT praktycznie wykluczona – zwykle bez testów i bez odstawiania heparyny z tego powodu.'],[5,'4–5 pkt – pośrednie prawdopodobieństwo','orange','Odstaw wszystkie heparyny, włącz lek przeciwkrzepliwy niebędący heparyną (wybór i dawka wg ChPL i konsultacji hematologa), oznacz przeciwciała przeciw kompleksom PF4 (czynnik płytkowy 4)/heparyna.'],[8,'6–8 pkt – wysokie prawdopodobieństwo','red','Odstaw wszystkie heparyny, natychmiast lek przeciwkrzepliwy niebędący heparyną, test anty-PF4/heparyna, konsultacja hematologa; nie przetaczaj profilaktycznie płytek.']],
 calc:function(v){return scoreCalc(this,v,8);}};
C.dic={g:'hem',n:'Skala ISTH – jawny zespół rozsianego wykrzepiania wewnątrznaczyniowego (DIC)',d:'Międzynarodowe Towarzystwo Zakrzepicy i Hemostazy (ISTH); stosuj tylko przy chorobie podstawowej mogącej wywołać DIC.',
 src:'Taylor i wsp., Thromb Haemost 2001;86:1327 (ISTH)',yr:2001,
 f:[N('plt','Płytki krwi','G/l'),S('dd','Marker fibryny (D-dimer)',[['0','bez wzrostu',0],['2','umiarkowany wzrost',2],['3','znaczny wzrost',3]]),N('pt','Wydłużenie czasu protrombinowego (PT) ponad górną granicę normy','s'),N('fib','Fibrynogen','g/l')],
 calc:function(v){var m=need(v,['plt','pt','fib'],['płytki','wydłużenie PT','fibrynogen']);if(v.dd===undefined||v.dd==='')m.push('D-dimer');if(m.length)return{miss:m};
  var p=v.plt>100?0:v.plt>=50?1:2,t=v.pt<3?0:v.pt<=6?1:2,f=v.fib>1?0:1,s=p+(+v.dd)+t+f;
  return{v:s+' / 8 pkt',n:s,lvl:s>=5?'red':'orange',rows:[['Płytki',p+' pkt'],['D-dimer',v.dd+' pkt'],['PT',t+' pkt'],['Fibrynogen',f+' pkt']],interp:s>=5?'≥5 pkt – zgodne z jawnym DIC.':'<5 pkt – sugeruje (nie potwierdza) brak jawnego DIC.',
   cons:s>=5?'Leczenie choroby podstawowej; uzupełnianie składników krwi tylko przy krwawieniu lub planowanym zabiegu (moduł „Transfuzjologia”); powtarzaj ocenę co 1–2 dni.':'Powtórz ocenę za 1–2 dni, jeśli utrzymuje się podejrzenie.'};}};
C.plasmic={g:'hem',n:'Skala PLASMIC – prawdopodobieństwo zakrzepowej plamicy małopłytkowej (TTP)',d:'Ocena prawdopodobieństwa ciężkiego niedoboru ADAMTS13 (metaloproteinazy rozkładającej czynnik von Willebranda) u chorych z mikroangiopatią zakrzepową.',
 src:'Bendapudi i wsp., Lancet Haematol 2017;4:e157',yr:2017,
 f:[Y('plt','Płytki krwi <30 G/l'),Y('hem','Hemoliza (retikulocyty >2,5%, niewykrywalna haptoglobina lub bilirubina pośrednia >2 mg/dl)'),Y('ca','Brak czynnego nowotworu (leczonego w ostatnim roku)'),Y('tx','Brak przeszczepu narządu litego lub komórek krwiotwórczych w wywiadzie'),Y('mcv','MCV (średnia objętość krwinki czerwonej) <90 fl'),Y('inr','INR (międzynarodowy współczynnik znormalizowany) <1,5'),Y('cr','Kreatynina <2,0 mg/dl (<177 µmol/l)')],
 bands:[[4,'0–4 pkt – niskie ryzyko ciężkiego niedoboru ADAMTS13','green','TTP mało prawdopodobna – szukaj innych przyczyn mikroangiopatii (zespół hemolityczno-mocznicowy, DIC, leki, nadciśnienie złośliwe).'],[5,'5 pkt – ryzyko pośrednie','orange','Pobierz ADAMTS13 przed leczeniem; pilna konsultacja hematologa – decyzja o wymianie osocza.'],[7,'6–7 pkt – wysokie ryzyko TTP','red','Pobierz ADAMTS13, pilna konsultacja hematologa i ośrodka wykonującego wymianę osocza; nie przetaczaj profilaktycznie płytek.']],
 calc:function(v){return scoreCalc(this,v,7);}};
C.anc={g:'hem',n:'Bezwzględna liczba neutrofilów (ANC)',d:'ANC = leukocyty × (neutrofile segmentowane % + pałeczkowate %) / 100.',
 src:'Definicje neutropenii i gorączki neutropenicznej: ESMO 2016 – wytyczne Europejskiego Towarzystwa Onkologii Klinicznej (Klastersky i wsp., Ann Oncol 2016;27:v111)',yr:2016,
 f:[N('wbc','Leukocyty (WBC)','G/l'),N('neu','Neutrofile (segmentowane)','%'),N('band','Neutrofile pałeczkowate','%',{opt:1})],
 calc:function(v){var m=need(v,['wbc','neu'],['leukocyty','neutrofile %']);if(m.length)return{miss:m};var a=v.wbc*(v.neu+(ok(v.band)?v.band:0))/100;
  return{v:fx(a,2)+' G/l',n:a,lvl:a<0.5?'red':a<1.5?'orange':'green',interp:a<0.1?'<0,1 G/l – głęboka neutropenia.':a<0.5?'<0,5 G/l – ciężka neutropenia.':a<1.0?'0,5–1,0 G/l – umiarkowana neutropenia.':a<1.5?'1,0–1,5 G/l – łagodna neutropenia.':'Prawidłowa liczba neutrofilów (≥1,5 G/l).',
   cons:a<0.5?'Gorączka (≥38,3 °C jednorazowo lub ≥38,0 °C przez 1 h) przy ANC <0,5 G/l = gorączka neutropeniczna: antybiotyk o szerokim spektrum w ciągu 1 h po pobraniu posiewów, izolacja; moduł „Transfuzjologia → Neutropenia / G-CSF”.':'—'};}};
// ================= NEUROLOGIA =================
C.ccthr={g:'neu',n:'Kanadyjska reguła TK głowy (Canadian CT Head Rule)',d:'Wskazania do tomografii komputerowej (TK) głowy po łagodnym urazie głowy (GCS – skala śpiączki Glasgow 13–15) z utratą przytomności, niepamięcią lub dezorientacją.',
 src:'Stiell i wsp., Lancet 2001;357:1391',yr:2001,
 f:[Y('inc','Kryteria włączenia spełnione: uraz głowy z udokumentowaną utratą przytomności, niepamięcią lub dezorientacją; GCS 13–15',0),
  Y('exc','Kryteria wyłączenia: wiek <16 lat, leczenie przeciwkrzepliwe lub skaza krwotoczna, drgawki po urazie, ogniskowe objawy neurologiczne, niestabilne parametry życiowe, jawny uraz penetrujący/wgłobienie, ciąża, ponowna wizyta z powodu tego samego urazu',0),
  H('Wysokie ryzyko (interwencja neurochirurgiczna)'),Y('h1','GCS <15 po 2 h od urazu',0),Y('h2','Podejrzenie otwartego lub wgłobionego złamania czaszki',0),Y('h3','Objawy złamania podstawy czaszki (krwiak okularowy, krwiak za uchem, płynotok z nosa/ucha, krew za błoną bębenkową)',0),Y('h4','Wymioty ≥2 razy',0),N('age','Wiek','lat',{bar:'age'}),
  H('Średnie ryzyko (istotne klinicznie uszkodzenie mózgu)'),Y('m1','Niepamięć wsteczna (przed urazem) ≥30 min',0),Y('m2','Niebezpieczny mechanizm: pieszy potrącony przez pojazd, wypadnięcie z pojazdu, upadek z wysokości >0,9 m (3 stopy) lub z 5 stopni',0)],
 calc:function(v){if(v.exc===true)return{v:'reguła NIE MA ZASTOSOWANIA',lvl:'orange',interp:'Spełnione kryterium wyłączenia.',cons:'Decyzja o TK wg oceny klinicznej – u chorych leczonych przeciwkrzepliwie zwykle wskazana TK głowy (NICE NG232 2023 – wytyczne brytyjskiego Narodowego Instytutu Zdrowia i Doskonałości Opieki).'};
  if(v.inc!==true)return{miss:['potwierdzenie kryteriów włączenia (zaznacz pierwsze pole)']};if(!ok(v.age))return{miss:['wiek']};
  var hi=['h1','h2','h3','h4'].some(function(k){return v[k]===true;})||v.age>=65,me=v.m1===true||v.m2===true;
  if(hi)return{v:'TK GŁOWY WSKAZANA (wysokie ryzyko)',lvl:'red',interp:'Obecny czynnik wysokiego ryzyka'+(v.age>=65?' (wiek ≥65 lat)':'')+' – ryzyko konieczności interwencji neurochirurgicznej.',cons:'Wykonaj TK głowy bez kontrastu; obserwacja neurologiczna.'};
  if(me)return{v:'TK GŁOWY WSKAZANA (średnie ryzyko)',lvl:'orange',interp:'Czynnik średniego ryzyka – ryzyko istotnego klinicznie uszkodzenia mózgu.',cons:'Wykonaj TK głowy bez kontrastu.'};
  return{v:'TK niewymagana wg reguły',lvl:'green',interp:'Brak czynników ryzyka – czułość reguły dla interwencji neurochirurgicznej 100% w badaniu derywacyjnym.',cons:'Wypis z pisemną informacją o objawach alarmowych i opieką osoby dorosłej – decyzja lekarza.'};}};
C.ccsr={g:'neu',n:'Kanadyjska reguła kręgosłupa szyjnego (Canadian C-Spine Rule)',d:'Wskazania do obrazowania kręgosłupa szyjnego u przytomnych (GCS 15), stabilnych chorych po urazie.',
 src:'Stiell i wsp., JAMA 2001;286:1841',yr:2001,
 f:[Y('exc','Wyłączenia: wiek <16 lat, GCS <15, niestabilne parametry, porażenie, znana choroba kręgosłupa lub operacja szyjna, uraz penetrujący, uraz >48 h',0),
  H('1. Czynnik wysokiego ryzyka?'),N('age','Wiek','lat',{bar:'age'}),Y('h2','Niebezpieczny mechanizm: upadek z ≥0,9 m lub 5 stopni, uraz osiowy głowy (np. skok do wody), wypadek z dużą prędkością (>100 km/h), dachowanie, wypadnięcie z pojazdu, wypadek pojazdem rekreacyjnym, rowerzysta w zderzeniu',0),Y('h3','Parestezje kończyn',0),
  H('2. Czynnik niskiego ryzyka pozwalający bezpiecznie ocenić ruchomość?'),Y('l1','Proste najechanie od tyłu (bez: zepchnięcia do rowu, uderzenia przez autobus/ciężarówkę, dachowania, dużej prędkości)',0),Y('l2','Pozycja siedząca na SOR',0),Y('l3','Chodzący w dowolnym momencie po urazie',0),Y('l4','Opóźniony początek bólu szyi',0),Y('l5','Brak tkliwości wyrostków kolczystych w linii pośrodkowej',0),
  H('3. Ruchomość'),Y('rot','Potrafi czynnie obrócić głowę o 45° w lewo i w prawo',0)],
 calc:function(v){if(v.exc===true)return{v:'reguła NIE MA ZASTOSOWANIA',lvl:'orange',interp:'Spełnione kryterium wyłączenia.',cons:'Unieruchomienie i obrazowanie wg oceny klinicznej (zwykle TK).'};if(!ok(v.age))return{miss:['wiek']};
  if(v.age>=65||v.h2===true||v.h3===true)return{v:'OBRAZOWANIE WSKAZANE',lvl:'red',interp:'Czynnik wysokiego ryzyka'+(v.age>=65?' (wiek ≥65 lat)':'')+'.',cons:'Utrzymaj stabilizację, wykonaj TK kręgosłupa szyjnego.'};
  if(!['l1','l2','l3','l4','l5'].some(function(k){return v[k]===true;}))return{v:'OBRAZOWANIE WSKAZANE',lvl:'red',interp:'Brak czynnika niskiego ryzyka – nie można bezpiecznie ocenić ruchomości.',cons:'Utrzymaj stabilizację, obrazowanie.'};
  if(v.rot===true)return{v:'obrazowanie NIEWYMAGANE',lvl:'green',interp:'Czynnik niskiego ryzyka i zachowana rotacja 45° w obie strony.',cons:'Można zdjąć stabilizację – decyzja lekarza.'};
  return{v:'OBRAZOWANIE WSKAZANE',lvl:'red',interp:'Nie potrafi obrócić głowy o 45° w obie strony (lub nie oceniono).',cons:'Obrazowanie kręgosłupa szyjnego.'};}};
C.ottawasah={g:'neu',n:'Reguła ottawska krwotoku podpajęczynówkowego (Ottawa SAH Rule)',d:'Dla przytomnych chorych ≥15 lat z nowym, silnym, nieurazowym bólem głowy osiągającym szczyt w ciągu 1 h.',
 src:'Perry i wsp., JAMA 2013;310:1248; walidacja: Perry i wsp., CMAJ 2017;189:E1379',yr:2013,
 f:[Y('inc','Kryteria włączenia: przytomny, ≥15 lat, nowy silny nieurazowy ból głowy ze szczytem ≤1 h',0),Y('exc','Wyłączenia: nowe ogniskowe objawy neurologiczne, przebyty tętniak/krwotok podpajęczynówkowy, guz mózgu, nawracające podobne bóle (≥3 epizody w ≥6 mies.)',0),
  N('age','Wiek','lat',{bar:'age'}),Y('neck','Ból lub sztywność karku',0),Y('loc','Utrata przytomności w obecności świadków',0),Y('ex','Początek w czasie wysiłku',0),Y('tc','Ból „piorunujący” – natychmiast maksymalny',0),Y('flex','Ograniczone zgięcie szyi w badaniu (nie dotyka brodą mostka / nie unosi głowy na 3 cm od łóżka w leżeniu)',0)],
 calc:function(v){if(v.exc===true)return{v:'reguła NIE MA ZASTOSOWANIA',lvl:'orange',interp:'Kryterium wyłączenia.',cons:'Diagnostyka wg oceny klinicznej (TK, angio-TK, ewentualnie nakłucie lędźwiowe).'};
  if(v.inc!==true)return{miss:['potwierdzenie kryteriów włączenia']};if(!ok(v.age))return{miss:['wiek']};var p=['neck','loc','ex','tc','flex'].filter(function(k){return v[k]===true;}).length+(v.age>=40?1:0);
  return p?{v:'DIAGNOSTYKA WSKAZANA ('+p+' kryt.)',lvl:'red',interp:'Obecne kryterium reguły'+(v.age>=40?' (m.in. wiek ≥40 lat)':'')+' – nie można wykluczyć krwotoku podpajęczynówkowego.',cons:'TK głowy bez kontrastu (w ciągu 6 h od początku bardzo wysoka czułość); dalej angio-TK lub nakłucie lędźwiowe wg wytycznych i czasu od początku.'}
   :{v:'krwotok podpajęczynówkowy WYKLUCZONY wg reguły',lvl:'green',interp:'Brak wszystkich 6 kryteriów (czułość 100% w walidacji).',cons:'Dalsza diagnostyka bólu głowy wg obrazu klinicznego.'};}};
// ================= ŻChZZ i ZP (żylna choroba zakrzepowo-zatorowa, zatorowość płucna) =================
var DD_U=[['ng/ml FEU',1],['mg/l FEU (= µg/ml)',1000]];
C.wellsDvt={g:'vte',n:'Skala Wellsa – zakrzepica żył głębokich (ZŻG)',d:'Kliniczne prawdopodobieństwo zakrzepicy żył głębokich kończyny dolnej (wersja dwustopniowa).',
 src:'Wells i wsp., N Engl J Med 2003;349:1227; Wells i wsp., Lancet 1997;350:1795',yr:2003,
 f:[Y('ca','Czynny nowotwór (leczenie w ostatnich 6 mies. lub paliatywne)'),Y('par','Porażenie, niedowład lub niedawne unieruchomienie kończyny dolnej w opatrunku gipsowym'),Y('bed','Unieruchomienie w łóżku ≥3 dni lub duża operacja w ciągu 12 tygodni'),Y('ten','Tkliwość wzdłuż przebiegu żył głębokich'),Y('leg','Obrzęk całej kończyny dolnej'),Y('calf','Obwód łydki większy o >3 cm niż po stronie zdrowej (10 cm poniżej guzowatości piszczeli)'),Y('pit','Obrzęk ciastowaty (z dołkiem) ograniczony do objawowej kończyny'),Y('col','Widoczne żyły powierzchowne krążenia obocznego (nieżylakowe)'),Y('prev','Przebyta zakrzepica żył głębokich'),Y('alt','Inne rozpoznanie co najmniej równie prawdopodobne',-2)],
 bands:[[1,'≤1 pkt – ZŻG mało prawdopodobna','green','Oznacz D-dimer (ewentualnie z progiem zależnym od wieku): ujemny wyklucza ZŻG; dodatni → ultrasonografia uciskowa (USG).'],[99,'≥2 pkt – ZŻG prawdopodobna','red','Ultrasonografia uciskowa żył; gdy niedostępna w rozsądnym czasie – rozważ tymczasowe leczenie przeciwkrzepliwe (decyzja lekarza, dawki wg ChPL / modułu „Antykoagulacja”).']],
 calc:function(v){return scoreCalc(this,v);}};
C.wellsPe={g:'vte',n:'Skala Wellsa – zatorowość płucna (ZP)',d:'Kliniczne prawdopodobieństwo zatorowości płucnej (wersja dwu- i trzystopniowa).',
 src:'Wells i wsp., Thromb Haemost 2000;83:416; Wells i wsp., Ann Intern Med 2001;135:98; ESC 2019 – wytyczne dot. ostrej zatorowości płucnej (Konstantinides i wsp., Eur Heart J 2020;41:543)',yr:2000,
 f:[Y('dvt','Kliniczne objawy zakrzepicy żył głębokich (obrzęk kończyny, ból przy ucisku żył głębokich)',3),Y('alt','Zatorowość płucna najbardziej prawdopodobnym rozpoznaniem',3),Y('hr','Częstość rytmu serca >100/min',1.5),Y('imm','Unieruchomienie ≥3 dni lub operacja w ciągu 4 tygodni',1.5),Y('prev','Przebyta zakrzepica żył głębokich lub zatorowość płucna',1.5),Y('hem','Krwioplucie',1),Y('ca','Czynny nowotwór (leczenie w ostatnich 6 mies. lub paliatywne)',1)],
 bands:[[4,'≤4 pkt – ZP mało prawdopodobna','green','Rozważ kryteria PERC (przy bardzo niskim prawdopodobieństwie) lub oznacz D-dimer (próg zależny od wieku: wiek × 10 ng/ml u >50 lat); ujemny wyklucza ZP. Szczegóły – moduł „Zatorowość płucna”.'],[99,'>4 pkt – ZP prawdopodobna','red','Angio-TK tętnic płucnych bez oznaczania D-dimeru; przy dużym prawdopodobieństwie i braku przeciwwskazań rozważ leczenie przeciwkrzepliwe przed wynikiem (decyzja lekarza).']],
 calc:function(v){var r=scoreCalc(this,v);if(r.miss)return r;var t=r.n<2?'niskie (<2 pkt)':r.n<=6?'pośrednie (2–6 pkt)':'wysokie (>6 pkt)';r.rows=(r.rows||[]).concat([['Wersja trzystopniowa',t]]);return r;}};
C.geneva={g:'vte',n:'Zmodyfikowana skala genewska (pełna i uproszczona) – zatorowość płucna',d:'Ocena prawdopodobieństwa klinicznego ZP oparta wyłącznie na danych obiektywnych.',
 src:'Le Gal i wsp., Ann Intern Med 2006;144:165 (wersja zmodyfikowana); Klok i wsp., Arch Intern Med 2008;168:2131 (wersja uproszczona i dwustopniowa)',yr:2008,
 f:[S('ver','Wersja',[['full','pełna (punkty ważone)'],['simp','uproszczona (po 1 pkt)']],{def:'full'}),N('age','Wiek','lat',{bar:'age'}),Y('prev','Przebyta zakrzepica żył głębokich lub zatorowość płucna'),Y('sur','Operacja (w znieczuleniu ogólnym) lub złamanie kończyny dolnej w ciągu 1 miesiąca'),Y('ca','Czynny nowotwór (lub uznany za wyleczony <1 rok)'),Y('pain','Jednostronny ból kończyny dolnej'),Y('hem','Krwioplucie'),N('hr','Częstość rytmu serca','/min'),Y('dvt','Ból przy ucisku żył głębokich kończyny dolnej i jednostronny obrzęk')],
 calc:function(v){var m=need(v,['age','hr'],['wiek','częstość rytmu serca']);if(m.length)return{miss:m};var s=v.ver==='simp',W=s?{age:1,prev:1,sur:1,ca:1,pain:1,hem:1,hr1:1,hr2:2,dvt:1}:{age:1,prev:3,sur:2,ca:2,pain:3,hem:2,hr1:3,hr2:5,dvt:4};
  var p=0,rows=[];if(v.age>65){p+=W.age;rows.push(['Wiek >65 lat','+'+W.age]);}['prev','sur','ca','pain','hem','dvt'].forEach(function(k){if(v[k]===true){p+=W[k];rows.push([this.f.filter(function(f){return f.k===k;})[0].l,'+'+W[k]]);}},this);
  if(v.hr>=95){p+=W.hr2;rows.push(['HR ≥95/min','+'+W.hr2]);}else if(v.hr>=75){p+=W.hr1;rows.push(['HR 75–94/min','+'+W.hr1]);}
  var lik=s?p>=3:p>=6,three=s?(p<=1?'niskie (0–1)':p<=4?'pośrednie (2–4)':'wysokie (≥5)'):(p<=3?'niskie (0–3)':p<=10?'pośrednie (4–10)':'wysokie (≥11)');rows.push(['Wersja trzystopniowa',three]);
  return{v:p+' pkt ('+(s?'uproszczona':'pełna')+')',n:p,lvl:lik?'red':'green',rows:rows,interp:lik?'ZP prawdopodobna (wersja dwustopniowa: '+(s?'≥3':'≥6')+' pkt).':'ZP mało prawdopodobna (wersja dwustopniowa: '+(s?'≤2':'≤5')+' pkt).',
   cons:lik?'Angio-TK tętnic płucnych (bez D-dimeru).':'Oznacz D-dimer (próg zależny od wieku u >50 lat); ujemny wyklucza ZP, dodatni → angio-TK.'};}};
C.perc={g:'vte',n:'Kryteria PERC – wykluczenie zatorowości płucnej bez badań',d:'Pulmonary Embolism Rule-out Criteria – stosować WYŁĄCZNIE przy niskim prawdopodobieństwie klinicznym (ocena lekarza <15%).',
 src:'Kline i wsp., J Thromb Haemost 2004;2:1247; Freund i wsp. (PROPER), JAMA 2018;319:559',yr:2004,
 f:[Y('low','Lekarz ocenia prawdopodobieństwo ZP jako niskie (<15%) – warunek stosowania',0,{noscore:1}),N('age','Wiek','lat',{bar:'age'}),N('hr','Częstość rytmu serca','/min'),N('spo2','SpO₂ (powietrze atmosferyczne)','%'),Y('leg','Jednostronny obrzęk kończyny dolnej'),Y('hem','Krwioplucie'),Y('sur','Uraz lub operacja w znieczuleniu ogólnym w ciągu 4 tygodni'),Y('prev','Przebyta zakrzepica żył głębokich lub zatorowość płucna'),Y('hor','Doustna antykoncepcja, hormonalna terapia zastępcza lub estrogeny')],
 calc:function(v){var m=need(v,['age','hr','spo2'],['wiek','częstość rytmu serca','SpO₂']);if(m.length)return{miss:m};if(v.low!==true)return{v:'PERC NIE MA ZASTOSOWANIA',lvl:'orange',interp:'Kryteria PERC wolno stosować tylko przy niskim prawdopodobieństwie klinicznym (zaznacz pierwsze pole, jeśli tak oceniasz).',cons:'Oceń prawdopodobieństwo skalą Wellsa lub genewską, następnie D-dimer / angio-TK.'};
  var pos=[];if(v.age>=50)pos.push('wiek ≥50 lat');if(v.hr>=100)pos.push('HR ≥100/min');if(v.spo2<95)pos.push('SpO₂ <95%');['leg','hem','sur','prev','hor'].forEach(function(k){if(v[k]===true)pos.push(this.f.filter(function(f){return f.k===k;})[0].l);},this);
  return pos.length?{v:'PERC dodatni ('+pos.length+')',n:pos.length,lvl:'orange',rows:pos.map(function(x){return[x,'tak'];}),interp:'Co najmniej jedno kryterium spełnione – nie można wykluczyć ZP bez badań.',cons:'Oznacz D-dimer (próg zależny od wieku), dalej wg algorytmu – moduł „Zatorowość płucna”.'}
   :{v:'PERC ujemny (0/8)',n:0,lvl:'green',interp:'Wszystkie 8 kryteriów ujemne przy niskim prawdopodobieństwie klinicznym – ryzyko ZP <2%.',cons:'Dalsza diagnostyka ZP (D-dimer) zwykle niepotrzebna – decyzja lekarza.'};}};
function yearsCore(v,dd,preg){var it=['dvt','hem','pe'].filter(function(k){return v[k]===true;}).length,ex=it===0?dd<1000:dd<500;
 return{it:it,ex:ex,thr:it===0?1000:500};}
C.years={g:'vte',n:'Algorytm YEARS – zatorowość płucna',d:'Trzy elementy YEARS (objawy zakrzepicy żył głębokich, krwioplucie, ZP najbardziej prawdopodobnym rozpoznaniem) + D-dimer z progiem zależnym od liczby elementów.',
 src:'van der Hulle i wsp., Lancet 2017;390:289',yr:2017,
 f:[Y('dvt','Kliniczne objawy zakrzepicy żył głębokich'),Y('hem','Krwioplucie'),Y('pe','Zatorowość płucna najbardziej prawdopodobnym rozpoznaniem'),N('dd','D-dimer',DD_U)],
 calc:function(v){if(!ok(v.dd))return{miss:['D-dimer']};var r=yearsCore(v,v.dd);
  return{v:r.ex?'ZP WYKLUCZONA':'ANGIO-TK WSKAZANA',n:r.it,lvl:r.ex?'green':'red',rows:[['Elementy YEARS',r.it+' / 3'],['Próg D-dimeru',r.thr+' ng/ml FEU'],['D-dimer',fx(v.dd,0)+' ng/ml FEU']],interp:r.it+' elementów YEARS; D-dimer '+(r.ex?'poniżej':'≥')+' progu '+r.thr+' ng/ml.',cons:r.ex?'ZP wykluczona bez obrazowania (ryzyko ŻChZZ w 3 mies. 0,43% w badaniu YEARS).':'Wykonaj angio-TK tętnic płucnych.'};}};
C.pregYears={g:'vte',n:'Algorytm YEARS dostosowany do ciąży – zatorowość płucna u ciężarnej',d:'Przy objawach zakrzepicy żył głębokich najpierw ultrasonografia uciskowa (USG) żył kończyny; następnie elementy YEARS i D-dimer.',
 src:'van der Pol i wsp. (Artemis), N Engl J Med 2019;380:1139',yr:2019,
 f:[Y('preg','Pacjentka w ciąży (wg paska pacjenta lub wywiadu)',0,{bar:'preg',noscore:1}),Y('dvt','Kliniczne objawy zakrzepicy żył głębokich'),S('cus','Ultrasonografia uciskowa żył kończyny objawowej',[['na','nie wykonano / nie dotyczy'],['neg','ujemna'],['pos','dodatnia (zakrzepica)']],{def:'na'}),Y('hem','Krwioplucie'),Y('pe','Zatorowość płucna najbardziej prawdopodobnym rozpoznaniem'),N('dd','D-dimer',DD_U,{opt:1})],
 calc:function(v){if(v.dvt===true&&v.cus==='pos')return{v:'ZŻG POTWIERDZONA – LECZENIE',lvl:'red',interp:'Objawy zakrzepicy i dodatnia ultrasonografia uciskowa.',cons:'Rozpocznij leczenie przeciwkrzepliwe heparyną drobnocząsteczkową (dawka wg ChPL i masy ciała, konsultacja położnicza); angio-TK zwykle niepotrzebna.'};
  if(v.dvt===true&&v.cus!=='neg')return{miss:['wynik ultrasonografii uciskowej (przy objawach zakrzepicy wykonaj ją najpierw)']};
  if(!ok(v.dd))return{miss:['D-dimer']};var r=yearsCore(v,v.dd);
  return{v:r.ex?'ZP WYKLUCZONA':'ANGIO-TK WSKAZANA',n:r.it,lvl:r.ex?'green':'red',rows:[['Elementy YEARS',r.it+' / 3'],['Próg D-dimeru',r.thr+' ng/ml FEU'],['D-dimer',fx(v.dd,0)+' ng/ml FEU']].concat(v.preg!==true?[['Uwaga','nie potwierdzono ciąży – dla nieciężarnych użyj algorytmu YEARS']]:[]),
   interp:r.it+' elementów YEARS; D-dimer '+(r.ex?'poniżej':'≥')+' progu '+r.thr+' ng/ml FEU.',cons:r.ex?'ZP wykluczona bez obrazowania (Artemis: ryzyko ŻChZZ w 3 mies. 0,21%; uniknięto TK u 39% ciężarnych).':'Wykonaj angio-TK tętnic płucnych (dawka promieniowania dla płodu niska – konsultacja radiologiczna/położnicza).'};}};
// ================= OSTRY BRZUCH =================
C.alvarado={g:'brz',n:'Skala Alvarado (MANTRELS) – ostre zapalenie wyrostka robaczkowego',d:'Objawy, badanie przedmiotowe i laboratoryjne; maksymalnie 10 pkt.',
 src:'Alvarado, Ann Emerg Med 1986;15:557; WSES 2020 – wytyczne Światowego Towarzystwa Chirurgii Ratunkowej (Di Saverio i wsp., World J Emerg Surg 2020;15:27)',yr:1986,
 f:[H('Objawy'),Y('mig','Wędrówka bólu do prawego dołu biodrowego'),Y('ano','Brak łaknienia (lub aceton w moczu)'),Y('nv','Nudności lub wymioty'),H('Badanie'),Y('rlq','Tkliwość w prawym dole biodrowym',2),Y('reb','Objaw Blumberga (ból przy nagłym odjęciu ręki)'),Y('t','Temperatura ≥37,3 °C'),H('Laboratorium'),Y('wbc','Leukocytoza >10 G/l',2),Y('shift','Przesunięcie w lewo (neutrofile >75%)')],
 bands:[[4,'1–4 pkt – zapalenie wyrostka mało prawdopodobne','green','Rozważ inne przyczyny; przy utrzymywaniu się dolegliwości – ponowna ocena lub obserwacja.'],[6,'5–6 pkt – wynik niejednoznaczny','orange','Obserwacja z ponowną oceną, badanie obrazowe (USG, ewentualnie TK); konsultacja chirurgiczna.'],[8,'7–8 pkt – zapalenie wyrostka prawdopodobne','red','Konsultacja chirurgiczna; obrazowanie wg sytuacji klinicznej.'],[10,'9–10 pkt – zapalenie wyrostka bardzo prawdopodobne','red','Pilna konsultacja chirurgiczna.']],
 calc:function(v){return scoreCalc(this,v,10);}};
C.air={g:'brz',n:'Skala AIR – odpowiedź zapalna w zapaleniu wyrostka robaczkowego',d:'Appendicitis Inflammatory Response score – 0–12 pkt; uwzględnia CRP (białko C-reaktywne).',
 src:'Andersson, Andersson, World J Surg 2008;32:1843; WSES 2020 (Di Saverio i wsp.)',yr:2008,
 f:[Y('vom','Wymioty'),Y('rif','Ból w prawym dole biodrowym'),S('reb','Objawy otrzewnowe (objaw Blumberga lub obrona mięśniowa)',[['0','brak',0],['1','słabe',1],['2','umiarkowane',2],['3','silne',3]]),Y('t','Temperatura ≥38,5 °C'),
  S('pmn','Odsetek neutrofili',[['0','<70%',0],['1','70–84%',1],['2','≥85%',2]]),S('wbc','Leukocyty',[['0','<10 G/l',0],['1','10,0–14,9 G/l',1],['2','≥15 G/l',2]]),S('crp','CRP',[['0','<10 mg/l',0],['1','10–49 mg/l',1],['2','≥50 mg/l',2]])],
 bands:[[4,'0–4 pkt – niskie prawdopodobieństwo','green','Leczenie ambulatoryjne z kontrolą, jeśli stan ogólny dobry (ponowna ocena przy nasileniu objawów).'],[8,'5–8 pkt – prawdopodobieństwo pośrednie','orange','Obserwacja szpitalna z ponowną oceną punktacji, obrazowanie (USG/TK) lub laparoskopia diagnostyczna wg chirurga.'],[12,'9–12 pkt – wysokie prawdopodobieństwo','red','Konsultacja chirurgiczna – leczenie operacyjne.']],
 calc:function(v){return scoreCalc(this,v,12);}};
// ================= ENDOKRYNOLOGIA =================
C.bwps={g:'endo',n:'Skala Burcha-Wartofsky\'ego – przełom tarczycowy',d:'Burch-Wartofsky Point Scale (BWPS): termoregulacja, układ nerwowy, przewód pokarmowy i wątroba, układ krążenia, czynnik wyzwalający.',
 src:'Burch, Wartofsky, Endocrinol Metab Clin North Am 1993;22:263; ETA 2018 – wytyczne Europejskiego Towarzystwa Tyreologicznego (Kahaly i wsp., Eur Thyroid J 2018;7:167)',yr:1993,
 f:[S('t','Temperatura',[['0','<37,2 °C',0],['5','37,2–37,7 °C',5],['10','37,8–38,2 °C',10],['15','38,3–38,8 °C',15],['20','38,9–39,4 °C',20],['25','39,4–39,9 °C',25],['30','≥40,0 °C',30]]),
  S('cns','Ośrodkowy układ nerwowy',[['0','bez zaburzeń',0],['10','łagodne (pobudzenie)',10],['20','umiarkowane (majaczenie, psychoza, skrajne spowolnienie)',20],['30','ciężkie (drgawki, śpiączka)',30]]),
  S('gi','Przewód pokarmowy i wątroba',[['0','bez zaburzeń',0],['10','umiarkowane (biegunka, nudności/wymioty, ból brzucha)',10],['20','ciężkie (niewyjaśniona żółtaczka)',20]]),
  S('hr','Częstość rytmu serca',[['0','<90/min',0],['5','90–109/min',5],['10','110–119/min',10],['15','120–129/min',15],['20','130–139/min',20],['25','≥140/min',25]]),
  S('hf','Niewydolność serca',[['0','brak',0],['5','łagodna (obrzęki kończyn dolnych)',5],['10','umiarkowana (trzeszczenia u podstawy płuc)',10],['15','ciężka (obrzęk płuc)',15]]),
  Y('af','Migotanie przedsionków',10),Y('prec','Czynnik wyzwalający obecny (np. zakażenie, zabieg, poród, odstawienie leków przeciwtarczycowych, jod)',10)],
 bands:[[24,'<25 pkt – przełom tarczycowy mało prawdopodobny','green','Leczenie nadczynności tarczycy wg stanu; ponowna ocena przy pogorszeniu.'],[44,'25–44 pkt – zagrażający przełom tarczycowy','orange','Pilna konsultacja endokrynologiczna; rozważ leczenie jak w przełomie (beta-adrenolityk, tyreostatyk, potem jod, glikokortykosteroid) – dawki wg wytycznych/ChPL, decyzja lekarza.'],[999,'≥45 pkt – przełom tarczycowy wysoce prawdopodobny','red','Stan zagrożenia życia: intensywny nadzór (OIT), leczenie wielokierunkowe (beta-adrenolityk, tyreostatyk, jod ≥1 h po tyreostatyku, glikokortykosteroid, chłodzenie, leczenie czynnika wyzwalającego) – dawki wg ETA 2018/ChPL.']],
 calc:function(v){var r=scoreCalc(this,v,140);if(r.miss)return r;r.v=fmt(r.n,0)+' pkt';r.cons+=' Skala nie zastępuje oceny klinicznej (umiarkowana swoistość); w Japonii stosuje się też kryteria JTA.';return r;}};
// ================= SEPSA =================
C.sirs={g:'sep',n:'Kryteria SIRS – zespół ogólnoustrojowej reakcji zapalnej',d:'Systemic Inflammatory Response Syndrome: ≥2 z 4 kryteriów.',
 src:'Bone i wsp. (ACCP/SCCM), Chest 1992;101:1644 – konferencja Amerykańskiego Kolegium Lekarzy Chorób Klatki Piersiowej i Towarzystwa Medycyny Krytycznej',yr:1992,
 f:[N('t','Temperatura','°C'),N('hr','Częstość rytmu serca','/min'),N('rr','Częstość oddechów','/min'),N('paco2','PaCO₂ (opcjonalnie)',KPA,{opt:1}),N('wbc','Leukocyty','G/l'),N('band','Neutrofile pałeczkowate (opcjonalnie)','%',{opt:1})],
 calc:function(v){var m=need(v,['t','hr','rr','wbc'],['temperatura','HR','częstość oddechów','leukocyty']);if(m.length)return{miss:m};
  var c=[];if(v.t>38||v.t<36)c.push(['Temperatura >38 °C lub <36 °C',fx(v.t,1)+' °C']);if(v.hr>90)c.push(['HR >90/min',fx(v.hr,0)]);if(v.rr>20||(ok(v.paco2)&&v.paco2<32))c.push(['Częstość oddechów >20/min lub PaCO₂ <32 mmHg',fx(v.rr,0)+'/min']);if(v.wbc>12||v.wbc<4||(ok(v.band)&&v.band>10))c.push(['Leukocyty >12 lub <4 G/l lub >10% pałeczkowatych',fx(v.wbc,1)+' G/l']);
  var n=c.length;return{v:n+' / 4 kryteria',n:n,lvl:n>=2?'orange':'green',rows:c,interp:n>=2?'SIRS obecny (≥2 kryteria).':'SIRS nieobecny.',cons:'Od Sepsis-3 (2016) sepsę definiuje dysfunkcja narządowa (wzrost SOFA ≥2), nie SIRS; SIRS pozostaje czułym sygnałem zakażenia – oceń qSOFA/SOFA i mleczany. Moduł „Sepsa”.'};}};
C.qsofa={g:'sep',n:'qSOFA – szybka ocena niewydolności narządów',d:'quick Sequential Organ Failure Assessment: częstość oddechów ≥22/min, zaburzenia świadomości (GCS <15), ciśnienie skurczowe ≤100 mmHg.',
 src:'Seymour i wsp., JAMA 2016;315:762; Singer i wsp. (Sepsis-3), JAMA 2016;315:801; SSC 2021 – Surviving Sepsis Campaign (Evans i wsp., Crit Care Med 2021;49:e1063)',yr:2016,
 f:[Y('rr','Częstość oddechów ≥22/min'),Y('ms','Zaburzenia świadomości (GCS <15)'),Y('sbp','Ciśnienie skurczowe ≤100 mmHg')],
 bands:[[1,'0–1 pkt – niskie ryzyko złego rokowania','green','Nie wyklucza sepsy – SSC 2021 nie zaleca qSOFA jako jedynego narzędzia przesiewowego.'],[3,'≥2 pkt – zwiększone ryzyko zgonu / długiego pobytu na OIT','red','Oceń dysfunkcję narządową (SOFA, mleczany), posiewy i antybiotyk wg modułu „Sepsa”; rozważ intensywny nadzór.']],
 calc:function(v){return scoreCalc(this,v,3);}};
function sofaParts(v){var P={};
 if(ok(v.pf)){var vent=v.vent===true;P.resp=v.pf<100&&vent?4:v.pf<200&&vent?3:v.pf<300?2:v.pf<400?1:0;}
 if(ok(v.plt))P.coag=v.plt<20?4:v.plt<50?3:v.plt<100?2:v.plt<150?1:0;
 if(ok(v.bili))P.liv=v.bili>=12?4:v.bili>=6?3:v.bili>=2?2:v.bili>=1.2?1:0;
 if(v.cv!==undefined&&v.cv!=='')P.cv=+v.cv;
 if(ok(v.gcs))P.cns=v.gcs<6?4:v.gcs<=9?3:v.gcs<=12?2:v.gcs<=14?1:0;
 if(ok(v.cr)||ok(v.uo)){var a=ok(v.cr)?(v.cr>=5?4:v.cr>=3.5?3:v.cr>=2?2:v.cr>=1.2?1:0):0,b=ok(v.uo)?(v.uo<200?4:v.uo<500?3:0):0;P.ren=Math.max(a,b);}
 return P;}
C.sofa={g:'sep',n:'SOFA – ocena niewydolności narządów (Sepsis-3)',d:'Sequential Organ Failure Assessment: 6 układów po 0–4 pkt; sepsa = zakażenie + wzrost SOFA o ≥2 pkt od wartości wyjściowej. Wynik częściowy, jeśli brak danych.',
 src:'Vincent i wsp., Intensive Care Med 1996;22:707; Singer i wsp. (Sepsis-3), JAMA 2016;315:801',yr:2016,
 f:[H('Oddychanie'),N('pf','PaO₂/FiO₂ (wskaźnik oksygenacji)','mmHg',{opt:1}),Y('vent','Wspomaganie oddychania (wentylacja mechaniczna / nieinwazyjna)',0,{noscore:1}),H('Krzepnięcie'),N('plt','Płytki krwi','G/l',{opt:1}),H('Wątroba'),N('bili','Bilirubina',BILI_U,{opt:1,si:1}),
  H('Układ krążenia'),S('cv','Krążenie',[['0','średnie ciśnienie tętnicze (MAP) ≥70 mmHg'],['1','MAP <70 mmHg'],['2','dopamina ≤5 µg/kg/min lub dobutamina (dowolna dawka)'],['3','dopamina >5 lub adrenalina ≤0,1 lub noradrenalina ≤0,1 µg/kg/min'],['4','dopamina >15 lub adrenalina >0,1 lub noradrenalina >0,1 µg/kg/min']],{opt:1}),
  H('Ośrodkowy układ nerwowy'),N('gcs','Skala śpiączki Glasgow (GCS)','pkt',{opt:1,min:3,max:15}),H('Nerki'),N('cr','Kreatynina w surowicy',CR_U,{bar:'crMg',si:1,opt:1}),N('uo','Diureza (opcjonalnie)','ml/dobę',{opt:1}),
  H('Wartość wyjściowa'),N('base','SOFA wyjściowa (przed zachorowaniem; nieznana = 0)','pkt',{opt:1})],
 calc:function(v){var P=sofaParts(v),L={resp:'Oddychanie',coag:'Krzepnięcie',liv:'Wątroba',cv:'Krążenie',cns:'OUN',ren:'Nerki'},k=Object.keys(P);if(!k.length)return{miss:['co najmniej jeden układ']};
  var s=k.reduce(function(a,x){return a+P[x];},0),b=ok(v.base)?v.base:0,d=s-b,miss=Object.keys(L).filter(function(x){return P[x]===undefined;}).map(function(x){return L[x];});
  return{v:s+' pkt'+(miss.length?' (częściowy: '+k.length+'/6 układów)':''),n:s,lvl:d>=2?'red':s>0?'orange':'green',rows:k.map(function(x){return[L[x],P[x]+' pkt'];}).concat([['Zmiana względem wartości wyjściowej',(d>=0?'+':'')+d+' pkt']]).concat(miss.length?[['Brak danych',miss.join(', ')]]:[]),
   interp:(d>=2?'Wzrost SOFA o ≥2 pkt – przy podejrzeniu zakażenia spełnia definicję sepsy (Sepsis-3); wzrost o ≥2 pkt wiąże się z ok. 10% śmiertelnością szpitalną.':'Wzrost SOFA <2 pkt względem wartości wyjściowej.')+(miss.length?' Wynik zaniżony o nieocenione układy.':''),
   cons:d>=2?'Postępowanie jak w sepsie: posiewy, antybiotyk w ciągu 1 h, mleczany, płynoterapia przy hipoperfuzji – moduł „Sepsa”; rozważ OIT.':'Monitoruj, powtórz ocenę przy pogorszeniu.'};}};
// ================= KONWERSJE LEKÓW =================
// [klucz, nazwa, dawka równoważna mg, siła glikokortykosteroidowa, siła mineralokortykosteroidowa, czas działania biologicznego]
var GKS=[['hc','hydrokortyzon',20,1,1,'krótki (8–12 h)'],['cort','kortyzon',25,0.8,0.8,'krótki (8–12 h)'],['pred','prednizon',5,4,0.8,'pośredni (12–36 h)'],['predl','prednizolon',5,4,0.8,'pośredni (12–36 h)'],
 ['mp','metyloprednizolon',4,5,0.5,'pośredni (12–36 h)'],['tri','triamcynolon',4,5,0,'pośredni (12–36 h)'],['dex','deksametazon',0.75,30,0,'długi (36–72 h)'],['beta','betametazon',0.6,30,0,'długi (36–72 h)']];
function gk(k){return GKS.filter(function(x){return x[0]===k;})[0];}
C.gks={g:'leki',n:'Równoważne dawki glikokortykosteroidów (GKS)',d:'Przeliczenie dawki ogólnoustrojowej (doustnej/dożylnej) według równoważnych dawek przeciwzapalnych.',
 src:'Liu i wsp., Allergy Asthma Clin Immunol 2013;9:30 (tab. 1); Schimmer, Funder – Goodman & Gilman\'s The Pharmacological Basis of Therapeutics',yr:2013,
 f:[S('from','Lek wyjściowy',GKS.map(function(x){return[x[0],x[1]+' ('+fmt(x[2],2)+' mg)'];}),{def:'pred'}),N('dose','Dawka leku wyjściowego','mg'),S('to','Lek docelowy',GKS.map(function(x){return[x[0],x[1]];}),{def:'mp'})],
 calc:function(v){if(!ok(v.dose))return{miss:['dawka']};var a=gk(v.from||'pred'),b=gk(v.to||'mp');if(!a||!b)return{miss:['lek wyjściowy i docelowy']};var t=v.dose/a[2]*b[2];
  return{v:fx(t,t<10?2:1).replace(/,?0+$/,'')+' mg '+b[1],n:t,lvl:'',rows:GKS.map(function(x){return[x[1],fmt(v.dose/a[2]*x[2],2)+' mg · siła mineralokort. '+fmt(x[4],1)+' · '+x[5]];}),
   interp:fmt(v.dose,2)+' mg '+a[1]+' ≈ '+fmt(t,2)+' mg '+b[1]+' (równoważność przeciwzapalna; ≈ '+fmt(v.dose/a[2]*5,1)+' mg prednizonu).',
   cons:'Równoważność dotyczy działania glikokortykosteroidowego – leki różnią się działaniem mineralokortykosteroidowym i czasem działania (deksametazon/betametazon bez działania mineralokortykosteroidowego: nie zastępują hydrokortyzonu w niedoczynności kory nadnerczy). Przy leczeniu >3 tygodni nie odstawiaj nagle (ryzyko niedoczynności nadnerczy). Dawkę ostateczną ustala lekarz.'};}};
// Ashton – dawki w przybliżeniu równoważne 10 mg diazepamu [klucz, nazwa, mg min, mg max]
var BZD=[['alp','alprazolam',0.5,0.5],['brom','bromazepam',5,6],['chl','chlordiazepoksyd',25,25],['clob','klobazam',20,20],['clon','klonazepam',0.5,0.5],['clor','klorazepat',15,15],['diaz','diazepam',10,10],['est','estazolam',1,2],['lor','lorazepam',1,1],['lorm','lormetazepam',1,2],['med','medazepam',10,10],['nit','nitrazepam',10,10],['oxa','oksazepam',20,20],['tem','temazepam',20,20],['zol','zolpidem',20,20],['zop','zopiklon',15,15]];
function bz(k){return BZD.filter(function(x){return x[0]===k;})[0];}
C.bzd={g:'leki',n:'Równoważne dawki benzodiazepin (BZD) i leków „Z”',d:'Przybliżone dawki doustne równoważne 10 mg diazepamu – głównie do zamiany na diazepam przy stopniowym odstawianiu.',
 src:'Ashton H., Benzodiazepines: How They Work and How to Withdraw (The Ashton Manual), Newcastle University, wyd. 2002 (uaktualnienie tabeli równoważności 2007)',yr:2007,
 f:[S('from','Lek wyjściowy',BZD.map(function(x){return[x[0],x[1]];}),{def:'alp'}),N('dose','Dobowa dawka leku wyjściowego','mg'),S('to','Lek docelowy',BZD.map(function(x){return[x[0],x[1]];}),{def:'diaz'})],
 calc:function(v){if(!ok(v.dose))return{miss:['dawka']};var a=bz(v.from||'alp'),b=bz(v.to||'diaz');if(!a||!b)return{miss:['lek wyjściowy i docelowy']};
  var dzLo=v.dose/a[3]*10,dzHi=v.dose/a[2]*10,lo=dzLo/10*b[2],hi=dzHi/10*b[3],rng=Math.abs(hi-lo)>1e-9;
  return{v:(rng?fmt(lo,2)+'–'+fmt(hi,2):fmt(lo,2))+' mg '+b[1],n:lo,lvl:'',rows:[['Ekwiwalent diazepamu',(Math.abs(dzHi-dzLo)>1e-9?fmt(dzLo,1)+'–'+fmt(dzHi,1):fmt(dzLo,1))+' mg/dobę'],['Dawka równoważna 10 mg diazepamu – '+a[1],a[2]===a[3]?fmt(a[2],2)+' mg':fmt(a[2],2)+'–'+fmt(a[3],2)+' mg'],['Dawka równoważna 10 mg diazepamu – '+b[1],b[2]===b[3]?fmt(b[2],2)+' mg':fmt(b[2],2)+'–'+fmt(b[3],2)+' mg']],
   interp:'Wartości przybliżone – duża zmienność osobnicza; leki różnią się czasem działania (diazepam: długi okres półtrwania, aktywne metabolity).',
   cons:'Nie stosuj do ostrego leczenia drgawek ani sedacji (midazolam i dawki dożylne celowo pominięte). U osób starszych, z niewydolnością wątroby lub oddechową zacznij od niższej dawki. Odstawianie stopniowe (zwykle ok. 10% dawki co 1–2 tygodnie wg Ashton) – plan ustala lekarz.'};}};
// Opioidy: mnożnik do doustnej morfiny (mg/dobę) – [klucz, nazwa, jednostka, mnożnik dolny, mnożnik górny]
var OPI=[['mor','morfina doustnie','mg/dobę',1,1],['morp','morfina podskórnie/dożylnie','mg/dobę',2,3],['oxy','oksykodon doustnie','mg/dobę',1.5,2],['hyd','hydromorfon doustnie','mg/dobę',4,5],['tram','tramadol doustnie','mg/dobę',0.1,0.2],['cod','kodeina doustnie','mg/dobę',0.1,0.15],['dhc','dihydrokodeina doustnie','mg/dobę',0.1,0.1],['tap','tapentadol doustnie','mg/dobę',0.4,0.4],['fen','fentanyl – system transdermalny (plaster)','µg/h',2.4,3.6]];
var PATCH=[12,25,50,75,100];
function op(k){return OPI.filter(function(x){return x[0]===k;})[0];}
C.opioid={g:'leki',n:'Konwersja opioidów (ekwiwalent morfiny doustnej)',d:'Przeliczenie przez dobową dawkę morfiny doustnej (MME – miligramowy ekwiwalent morfiny) z redukcją dawki leku docelowego z powodu niepełnej tolerancji krzyżowej.',
 src:'Dowell i wsp., CDC Clinical Practice Guideline for Prescribing Opioids for Pain, MMWR Recomm Rep 2022;71(3):1 (Centra Kontroli i Prewencji Chorób USA); Caraceni i wsp. (EAPC – Europejskie Stowarzyszenie Opieki Paliatywnej), Lancet Oncol 2012;13:e58; ChPL fentanylu w systemie transdermalnym',yr:2022,
 f:[S('from','Opioid wyjściowy',OPI.map(function(x){return[x[0],x[1]];}),{def:'oxy'}),N('dose','Dawka dobowa leku wyjściowego (dla plastra: µg/h)','mg/dobę lub µg/h'),S('to','Opioid docelowy',OPI.map(function(x){return[x[0],x[1]];}),{def:'mor'}),
  S('red','Redukcja dawki leku docelowego (niepełna tolerancja krzyżowa)',[['50','50% (zalecana domyślnie – maksymalna ostrożność)'],['25','25% (dobrze kontrolowany ból, chory młodszy, bez niewydolności narządów)']],{def:'50'})],
 calc:function(v){if(!ok(v.dose)||v.dose<=0)return{miss:['dawka dobowa']};var a=op(v.from||'oxy'),b=op(v.to||'mor');if(!a||!b)return{miss:['opioid wyjściowy i docelowy']};if(a[0]===b[0])return{err:'Wybierz różne opioidy.'};
  var red=(+(v.red||50))/100,mme=v.dose*a[3],tgt=mme*(1-red)/b[4],rows=[['MME leku wyjściowego (mnożnik dolny '+fmt(a[3],2)+')',fmt(mme,0)+' mg morfiny doustnej/dobę'],['Mnożnik leku docelowego (górny, ostrożny)',fmt(b[4],2)],['Redukcja',fmt(red*100,0)+'%']],warn=[];
  var out;if(b[0]==='fen'){var p=PATCH.filter(function(x){return x<=tgt+1e-9;}).pop();rows.push(['Wyliczona moc plastra',fmt(tgt,1)+' µg/h']);
   if(!p){out='poniżej najmniejszego plastra (12 µg/h)';warn.push('Wyliczona dawka mniejsza niż 12 µg/h – plaster fentanylowy nieodpowiedni; rozważ opioid doustny.');}else{out=p+' µg/h (zaokrąglono w dół do dostępnej mocy)';}
   warn.push('Plaster wyłącznie u chorych z tolerancją opioidów, w stabilnym bólu przewlekłym – nie w bólu ostrym ani przy gorączce/ogrzewaniu skóry. Pełny efekt po 12–24 h: kontynuuj dotychczasowy opioid wg ChPL do czasu działania plastra.');}
  else{out=fmt(tgt,tgt<10?1:0)+' '+b[2]+' '+b[1]+' (dawka dobowa, podzielona wg ChPL)';}
  if(a[0]==='fen')warn.push('Po zdjęciu plastra fentanyl działa jeszcze ok. 17 h (12–24 h) – lek docelowy rozpoczynaj stopniowo, wg ChPL.');
  if(a[0]==='tram'||b[0]==='tram'||a[0]==='tap'||b[0]==='tap')warn.push('Tramadol i tapentadol mają dodatkowy mechanizm (serotoninowo-noradrenergiczny) – przeliczniki mniej pewne; maks. dawka tramadolu 400 mg/dobę; tapentadolu w dawkach >500 mg/dobę nie badano (ChPL).');
  if(a[0]==='cod'||b[0]==='cod'||a[0]==='dhc'||b[0]==='dhc')warn.push('Kodeina/dihydrokodeina: zmienny metabolizm (CYP2D6) – przelicznik niepewny.');
  if(mme>=90)warn.push('Duża dawka (≥90 mg MME/dobę) – zwiększone ryzyko depresji oddechowej; rozważ konsultację specjalisty leczenia bólu / medycyny paliatywnej.');
  return{v:out,n:tgt,lvl:'orange',rows:rows,interp:'Przeliczenie celowo ostrożne: dla leku wyjściowego przyjęto dolny, a dla docelowego górny mnożnik z piśmiennictwa, a następnie zmniejszono dawkę o '+fmt(red*100,0)+'%. '+warn.join(' '),
   cons:'Zapewnij dawkę ratunkową opioidu o natychmiastowym uwalnianiu (EAPC 2012: zwykle 10–15% dawki dobowej; szczegóły wg ChPL) i miareczkuj według efektu; monitoruj sedację i oddech (nalokson dostępny). Metadon i buprenorfina ŚWIADOMIE WYŁĄCZONE z kalkulatora (nieliniowa konwersja, długi i zmienny okres półtrwania, wydłużanie QT – wyłącznie ze specjalistą). Niewydolność nerek/wątroby, wiek podeszły – dalsza redukcja. Dawkę ostateczną ustala lekarz.'};}};
// ================= LABORATORIUM: przelicznik jednostek =================
// [klucz, nazwa, jednostka konwencjonalna, jednostka SI, mnożnik konw.→SI, miejsca dziesiętne SI, uwaga]
var LAB=[['glu','Glukoza','mg/dl','mmol/l',1/18.016,2,''],['urea','Mocznik','mg/dl','mmol/l',1/6.006,2,''],['bun','Azot mocznika (BUN)','mg/dl','mmol/l mocznika',0.357,2,'mocznik [mg/dl] = BUN [mg/dl] × 2,14'],
 ['crea','Kreatynina','mg/dl','µmol/l',88.42,0,''],['na','Sód (Na⁺)','mEq/l','mmol/l',1,0,''],['k','Potas (K⁺)','mEq/l','mmol/l',1,1,''],['ca','Wapń całkowity','mg/dl','mmol/l',1/4.008,2,'mEq/l = mmol/l × 2'],['cai','Wapń zjonizowany','mg/dl','mmol/l',1/4.008,2,''],
 ['mg','Magnez','mg/dl','mmol/l',1/2.431,2,'mEq/l = mmol/l × 2'],['ua','Kwas moczowy','mg/dl','µmol/l',59.48,0,''],['bili','Bilirubina','mg/dl','µmol/l',17.1,0,''],['tc','Cholesterol całkowity','mg/dl','mmol/l',1/38.67,2,''],
 ['ldl','Cholesterol LDL (lipoprotein niskiej gęstości)','mg/dl','mmol/l',1/38.67,2,''],['hdl','Cholesterol HDL (lipoprotein wysokiej gęstości)','mg/dl','mmol/l',1/38.67,2,''],['tg','Triglicerydy','mg/dl','mmol/l',1/88.57,2,''],
 ['tsh','TSH (hormon tyreotropowy)','µIU/ml','mIU/l',1,2,'wartość liczbowo identyczna'],['fer','Ferrytyna','ng/ml','µg/l',1,0,'wartość liczbowo identyczna'],['phos','Fosforany (fosfor nieorganiczny)','mg/dl','mmol/l',1/3.097,2,''],
 ['pth','PTH (parathormon)','pg/ml','pmol/l',0.106,1,''],['alb','Albumina','g/dl','g/l',10,0,''],['tp','Białko całkowite','g/dl','g/l',10,0,'']];
function lab(k){return LAB.filter(function(x){return x[0]===k;})[0];}
C.units={g:'lab',n:'Przelicznik jednostek laboratoryjnych (konwencjonalne ↔ SI)',d:'Przeliczenie między jednostkami konwencjonalnymi (mg/dl) a jednostkami układu SI (mmol/l, µmol/l) na podstawie mas molowych.',
 src:'Masy molowe wg IUPAC; współczynniki zgodne z tabelami jednostek SI AMA Manual of Style (Amerykańskie Stowarzyszenie Lekarzy, 11. wyd., 2020) i Young DS, Ann Intern Med 1987;106:114',yr:2020,
 f:[S('an','Badanie',LAB.map(function(x){return[x[0],x[1]];}),{def:'glu'}),S('dir','Kierunek',[['c2s','konwencjonalne → SI'],['s2c','SI → konwencjonalne']],{def:'c2s'}),N('x','Wartość','',{})],
 calc:function(v){if(!ok(v.x))return{miss:['wartość']};var a=lab(v.an||'glu');if(!a)return{miss:['badanie']};var c2s=(v.dir||'c2s')==='c2s',y=c2s?v.x*a[4]:v.x/a[4],d=c2s?a[5]:Math.max(0,a[5]-1);if(!c2s&&a[4]>=10)d=2;
  var rows=[['Współczynnik',a[2]+' × '+fmt(a[4],4)+' = '+a[3]]];if(a[6])rows.push(['Uwaga',a[6]]);if(a[0]==='bun')rows.push(['Mocznik',fmt(c2s?v.x*2.14:y*2.14,1)+' mg/dl']);if(a[0]==='mg'||a[0]==='ca')rows.push(['mEq/l',fmt((c2s?y:v.x)*2,2)]);
  return{v:fmt(v.x,3)+' '+(c2s?a[2]:a[3])+' = '+fmt(y,d+1)+' '+(c2s?a[3]:a[2]),n:y,lvl:'',rows:rows,interp:a[1]+': '+fmt(v.x,3)+' '+(c2s?a[2]:a[3])+' odpowiada '+fmt(y,d+1)+' '+(c2s?a[3]:a[2])+'.',cons:'Zakresy referencyjne zależą od laboratorium – porównuj z normą podaną na wyniku.'};}};
C.labtab={g:'lab',n:'Tabela współczynników przeliczeniowych',d:'Zestawienie mnożników konwencjonalne → SI dla wszystkich badań przelicznika.',src:C.units.src,yr:2020,f:[],
 calc:function(){return{v:LAB.length+' badań',lvl:'',rows:LAB.map(function(x){return[x[1],'1 '+x[2]+' = '+fmt(x[4],4)+' '+x[3]+(x[6]?' ('+x[6]+')':'')];}),interp:'Mnożenie przez współczynnik: jednostki konwencjonalne → SI; dzielenie: SI → konwencjonalne.',cons:'—'};}};
// ================= GRUPY =================
var G=[['kard','Kardiologia',['score2','qtc','abi','duke','hasbled'],[['trop','Ból w klatce / troponina (HEART, EKG)'],['af','Migotanie przedsionków (CHA₂DS₂-VA)'],['ahf','Ostra niewydolność serca']]],
 ['pulm','Pulmonologia',['light','aa','rox'],[['cap','Zapalenie płuc (CURB-65, PSI, antybiotyk)']]],
 ['gast','Gastroenterologia / krwawienie z przewodu pokarmowego',['rockall','aims65','childpugh','meldna','bisap'],[['gib','Krwawienie z przewodu pokarmowego (Glasgow-Blatchford)']]],
 ['nef','Nefrologia i elektrolity',['egfr','fena','osm','ag','na','caCorr'],[['el','Elektrolity'],['tox','Zatrucia (luki, EXTRIP)'],['dka','Cukrzycowa kwasica ketonowa / stan hiperglikemiczno-hiperosmolalny']]],
 ['hem','Hematologia',['fourT','dic','plasmic','anc'],[['transf','Transfuzjologia'],['acoag','Antykoagulacja / odwracanie']]],
 ['neu','Neurologia',['ccthr','ccsr','ottawasah'],[['neuro','Neurologia (NIHSS, GCS, ABCD², ICH, 4AT)']]],
 ['vte','Żylna choroba zakrzepowo-zatorowa i zatorowość płucna',['wellsDvt','wellsPe','geneva','perc','years','pregYears'],[['pe','Zatorowość płucna (sPESI, leczenie)']]],
 ['brz','Ostry brzuch',['alvarado','air'],[]],
 ['endo','Endokrynologia',['bwps'],[['dka','Cukrzycowa kwasica ketonowa']]],
 ['sep','Sepsa i niewydolność narządów',['sirs','qsofa','sofa'],[['sepsis','Sepsa (pakiet 1 h)']]],
 ['leki','Konwersje leków',['gks','bzd','opioid'],[['leki','Leki (dawkowanie, nerki)']]],
 ['lab','Laboratorium – jednostki',['units','caCorr','labtab'],[]]];
Object.keys(C).forEach(function(k){C[k].id=k;});
function run(id,v){var c=C[id];if(!c)return{err:'Nieznany kalkulator: '+id};try{return c.calc(v||{});}catch(e){return{err:'Błąd obliczenia: '+e.message};}}
return{C:C,G:G,run:run,num:num,fmt:fmt,fx:fx,score2:score2,score2op:score2op,ckdepi21:ckdepi21,cg:cg,LAB:LAB,OPI:OPI,BZD:BZD,GKS:GKS,PATCH:PATCH};
});
