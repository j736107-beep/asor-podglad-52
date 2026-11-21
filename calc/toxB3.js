// fix27 (t57u pkt 7): Zatrucia – leki psychiatryczne, kardiologiczne, substancje chemiczne.
// Schemat: rozpoznanie / objawy → leczenie wstępne na SOR → dalsze postępowanie (badania z czasem, kolejne dawki do transferu, EXTRIP/ECTR, kontakt z toksykologiem Kraków).
// ZASADA: każda dawka ma klucz źródła (SRC). Dawka bez zweryfikowanego źródła NIE jest podawana („wg toksykologa”). Rozbieżności ChPL ↔ wytyczne są jawnie oznaczone.
(function(r,f){var m=f();if(typeof module==='object'&&module.exports)module.exports=m;else r.SKT3=m;})(this,function(){
'use strict';
var fin=Number.isFinite;
function F(x,d){if(!fin(x))return '—';var s=(+x.toFixed(d==null?1:d)).toString().replace('.',',');return s.replace(/\B(?=(\d{3})+(?!\d))/g,' ');}
var RPL='https://rejestrymedyczne.ezdrowie.gov.pl/api/rpl/medicinal-products/';
function chpl(id,t){return {t:'ChPL '+t+' (RPL '+id+')',u:RPL+id+'/characteristic'};}
var SRC={
 tox:{t:'Ośrodek toksykologiczny Kraków – konsultacja całodobowa 12 411 99 99 (panel kontaktów modułu)',u:''},
 brucc:{t:'Bruccoleri RE, Burns MM. A literature review of the use of sodium bicarbonate for the treatment of QRS widening. J Med Toxicol 2016;12:121–9 (PMC4781799)',u:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4781799/'},
 xtca:{t:'EXTRIP – trójpierścieniowe leki przeciwdepresyjne: ECTR niezalecane (Yates C i wsp., Am J Kidney Dis 2014;64:347; PMID 24726629)',u:'https://pubmed.ncbi.nlm.nih.gov/24726629/'},
 xvpa:{t:'EXTRIP – kwas walproinowy (Ghannoum M i wsp., Clin Toxicol 2015;53:454; PMID 25950372)',u:'https://pubmed.ncbi.nlm.nih.gov/25950372/'},
 xli:{t:'EXTRIP – lit (Decker BS i wsp., Clin J Am Soc Nephrol 2015;10:875; PMC4422246)',u:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4422246/'},
 xcbz:{t:'EXTRIP – karbamazepina (Ghannoum M i wsp., Clin Toxicol 2014;52:993; PMC4782683)',u:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4782683/'},
 xbb:{t:'EXTRIP – β-adrenolityki (Bouchard J i wsp., Crit Care 2021;25:201; PMC8194226)',u:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8194226/'},
 carn:{t:'Perrott J, Murphy NG, Zed PJ. L-carnitine for acute valproic acid overdose. Ann Pharmacother 2010;44:1287 (PMID 20587742)',u:'https://pubmed.ncbi.nlm.nih.gov/20587742/'},
 sero:{t:'Scotton WJ i wsp. Serotonin syndrome: pathophysiology, clinical features, management. Int J Tryptophan Res 2019 (PMC6734608); kryteria Huntera',u:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6734608/'},
 sero25:{t:'Przegląd zespołu serotoninowego, Br J Clin Pharmacol 2025 (PMC11862804) – dawka cyproheptadyny 12 mg może być niewystarczająca',u:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11862804/'},
 ccb:{t:'St-Onge M i wsp. Experts consensus recommendations for the management of calcium channel blocker poisoning in adults. Crit Care Med 2017;45:e306 (PMC5312725)',u:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5312725/'},
 graud:{t:'Graudins A, Lee HM, Druda D. Calcium channel antagonist and beta-blocker overdose: antidotes and adjunct therapies. Br J Clin Pharmacol 2016;81:453 (PMC4767195)',u:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4767195/'},
 aha23:{t:'AHA 2023 Focused Update on the Management of Patients With Cardiac Arrest or Life-Threatening Toxicity Due to Poisoning (Circulation 2023;148:e149) – HIET 1 j./kg + 1–10 j./kg/h (pełna tabela niedostępna przy weryfikacji)',u:'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001161'},
 wses:{t:'Bonavina L i wsp. Foregut caustic injuries: WSES consensus conference. World J Emerg Surg 2015;10:44 (PMC4583744)',u:'https://pmc.ncbi.nlm.nih.gov/articles/PMC4583744/'},
 ipec:{t:'Höjer J i wsp. Position paper update: ipecac syrup (AACT/EAPCCT). Clin Toxicol 2013;51:134 (PMID 23406298)',u:'https://pubmed.ncbi.nlm.nih.gov/23406298/'},
 lav:{t:'Benson BE i wsp. Position paper update: gastric lavage (AACT/EAPCCT). Clin Toxicol 2013;51:140 (PMID 23418938)',u:'https://pubmed.ncbi.nlm.nih.gov/23418938/'},
 inh:{t:'Radparvar S. The clinical assessment and treatment of inhalant abuse. Perm J 2023;27:99 (PMC10266853)',u:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10266853/'},
 ssd:{t:'Hydrocarbons and sudden sniffing syndrome – przegląd 2025 (PMC12319642): adrenalina w NZK po inhalacji węglowodorów – kontrowersyjna',u:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12319642/'},
 hcasp:{t:'Cho SH, Jeong JG. Hydrocarbon pneumonitis after aspiration of industrial solvent. Ann Occup Environ Med 2026;38:e8 (PMC13089157)',u:'https://pmc.ncbi.nlm.nih.gov/articles/PMC13089157/'},
 swarf:{t:'Superwarfaryny (brodifakum) – przegląd, Front Pharmacol 2024 (PMC11631590): INR najbardziej wiarygodny 48–72 h po ekspozycji',u:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11631590/'},
 cl2:{t:'Bosse GM. Nebulized sodium bicarbonate in the treatment of chlorine gas inhalation. J Toxicol Clin Toxicol 1994;32:233 (PMID 8007031) – retrospektywnie, bez ustalonej dawki',u:'https://pubmed.ncbi.nlm.nih.gov/8007031/'},
 nh3:{t:'Zatrucie amoniakiem – opis przypadku 2025 (PMC13242269): leczenie objawowe – tlen, leki rozszerzające oskrzela, kortykosteroidy',u:'https://pmc.ncbi.nlm.nih.gov/articles/PMC13242269/'},
 co:{t:'Wytyczne S2k: zatrucie tlenkiem węgla (Eichhorn L i wsp., Dtsch Arztebl Int 2021; PMC8607608): 100% tlen od razu; HBOT – jeśli wskazana – do 6 h',u:'https://pmc.ncbi.nlm.nih.gov/articles/PMC8607608/'},
 cyan:{t:'ChPL Cyanokit (hydroksokobalamina) – EMA, wersja PL',u:'https://www.ema.europa.eu/pl/documents/product-information/cyanokit-epar-product-information_pl.pdf'},
 pom:{t:'Moduł Pompy SOR – noradrenalina 80 µg/ml (standard lokalny zatwierdzony 04.11.2026)',u:''},
 pramolan:chpl(5470,'Pramolan 50 mg (opipramol)'),efectin:chpl(9489,'Efectin ER 75 (wenlafaksyna)'),ketipinor:chpl(13203,'Ketipinor 200 mg (kwetiapina)'),lamitrin:chpl(3666,'Lamitrin 25 mg (lamotrygina)'),
 lith:chpl(3943,'Lithium Carbonicum GSK 250 mg'),convulex:chpl(1568,'Convulex 300 (kwas walproinowy)'),amizepin:chpl(511,'Amizepin 200 mg (karbamazepina)'),amit:chpl(12223,'Amitriptylinum VP 25 mg'),
 peritol:chpl(24791,'Peritol 4 mg (cyproheptadyna)'),vitacon:chpl(7089,'Vitacon 10 mg/ml (fitomenadion, witamina K1)'),cacl:chpl(9315,'Calcium chloratum WZF 67 mg/ml (0,46 mmol Ca²⁺/ml)'),bicarb:chpl(4630,'Natrium bicarbonicum 8,4% Polpharma (1 mmol/ml)'),
 glucagen:chpl(20559,'GlucaGen 1 mg HypoKit'),intralipid:chpl(3190,'Intralipid 20%'),betaloc:chpl(991,'Betaloc 1 mg/ml (metoprolol)'),propr:chpl(5583,'Propranolol WZF 10 mg'),amlozek:chpl(9,'Amlozek 10 mg (amlodypina)'),isoptin:chpl(1033,'Isoptin 40 (werapamil)'),
 tritace:chpl(10587,'Tritace 10 (ramipryl)'),cozaar:chpl(1606,'Cozaar 50 mg (losartan)'),cipramil:chpl(112,'Cipramil 20 mg (cytalopram)'),zoloft:chpl(7971,'Zoloft 50 mg (sertralina)'),zolafren:chpl(10595,'Zolafren 5 mg (olanzapina)'),
 actrapid:{t:'ChPL Actrapid (EMA): i.v. tylko z fiolki, stężenie 0,05–1,0 j./ml',u:'https://www.ema.europa.eu/pl/documents/product-information/actrapid-epar-product-information_pl.pdf'}
};
var SHORT={tox:'Toksykolog Kraków',brucc:'Bruccoleri 2016',xtca:'EXTRIP TLPD',xvpa:'EXTRIP VPA 2015',xli:'EXTRIP lit 2015',xcbz:'EXTRIP CBZ 2014',xbb:'EXTRIP β-bloker 2021',carn:'Perrott 2010',sero:'Scotton 2019',sero25:'BJCP 2025',ccb:'St-Onge 2017',graud:'Graudins 2016',aha23:'AHA 2023',wses:'WSES 2015',ipec:'AACT/EAPCCT 2013 (ipekakuana)',lav:'AACT/EAPCCT 2013 (płukanie)',inh:'Radparvar 2023',ssd:'Przegląd 2025 (wąchanie)',hcasp:'Cho 2026',swarf:'Front Pharmacol 2024',cl2:'Bosse 1994',nh3:'Opis przypadku 2025 (amoniak)',co:'S2k CO 2021',cyan:'ChPL Cyanokit',pom:'Moduł Pompy SOR',actrapid:'ChPL Actrapid'};
function short(k){var s=SRC[k];if(!s)return k;if(SHORT[k])return SHORT[k];return s.t.replace(/ \(RPL \d+\)$/,'').replace(/ \d+([,.]\d+)? ?(mg|g|%|mg\/ml|j\.\/ml).*$/,'');}
var DEC='DO DECYZJI LEKARZA';
// ---------- pola formularza (wspólne) ----------
var FIELDS={
 hrs:['n','Czas od spożycia / ekspozycji','h',0,720],amt:['n','Przyjęta dawka (deklarowana)','mg',0,2000000],sr:['c','Postać o przedłużonym uwalnianiu (SR / XR / ER)'],chr:['c','Zatrucie przewlekłe / pacjent leczony tym lekiem przewlekle'],
 sbp:['n','Ciśnienie skurczowe','mmHg',0,300],hr:['n','Tętno','/min',0,300],qrs:['n','QRS','ms',0,400],qtc:['n','QTc','ms',0,900],spo2:['n','SpO₂','%',0,100],temp:['n','Temperatura','°C',25,45],
 coma:['c','Obniżona świadomość / śpiączka'],conf:['c','Istotne splątanie'],seiz:['c','Drgawki'],mv:['c','Depresja oddechowa / wentylacja mechaniczna'],shock:['c','Wstrząs / hipotensja mimo płynów'],arr:['c','Zaburzenia rytmu zagrażające życiu'],edema:['c','Obrzęk mózgu (TK)'],
 vpa:['n','Stężenie kwasu walproinowego','mg/l',0,10000],hnh3:['c','Amoniak powyżej normy laboratorium (hiperamonemia)'],ph:['n','pH (gazometria)','',6.5,7.9],li:['n','Stężenie litu','mmol/l',0,30],cbz:['n','Stężenie karbamazepiny','mg/l',0,400],
 renal:['t','Upośledzona czynność nerek (AKI / przewlekła)'],glu:['n','Glikemia','mmol/l',0,80],k:['n','Potas','mmol/l',0,12],inr:['n','INR','',0,30],bleed:['c','Czynne krwawienie'],
 sclon:['c','Klonus samoistny'],iclon:['c','Klonus indukowany'],oclon:['c','Klonus oczny'],agit:['c','Pobudzenie'],diaph:['c','Wzmożona potliwość'],trem:['c','Drżenie'],hrefl:['c','Hiperrefleksja'],hton:['c','Wzmożone napięcie mięśniowe'],
 drool:['c','Ślinotok / dysfagia / chrypka / stridor'],perf:['c','Objawy perforacji (ból w klatce / brzuchu, objawy otrzewnowe, odma)'],resp:['c','Kaszel / duszność / cechy zachłyśnięcia'],bronch:['c','Świsty / skurcz oskrzeli'],
 fire:['c','Pożar / dym / zamknięta przestrzeń (ryzyko CO i cyjanków)'],lact:['n','Mleczany','mmol/l',0,40],cohb:['n','COHb','%',0,100],h2s:['c','Podejrzenie siarkowodoru (szamba, ścieki, zapach zgniłych jaj)'],cyan:['c','Sinica / podejrzenie methemoglobinemii']
};
var BASIC=['hrs','sbp','hr','qrs','qtc','coma','seiz'];
var HUNTER=['sclon','iclon','oclon','agit','diaph','trem','hrefl','hton','temp'];
var AG={
 vpa:{g:'psy',n:'Kwas walproinowy / walproiniany',f:BASIC.concat(['amt','sr','chr','vpa','hnh3','ph','mv','shock','edema','glu'])},
 li:{g:'psy',n:'Lit',f:BASIC.concat(['amt','sr','chr','li','renal','conf','arr'])},
 tca:{g:'psy',n:'Trójpierścieniowe leki przeciwdepresyjne (amitryptylina, klomipramina, doksepina…)',f:BASIC.concat(['amt','arr','ph','k'])},
 opi:{g:'psy',n:'Opipramol (Pramolan)',f:BASIC.concat(['amt','arr','ph','k'])},
 ven:{g:'psy',n:'Wenlafaksyna',f:BASIC.concat(['amt','sr','glu','arr']).concat(HUNTER)},
 ssri:{g:'psy',n:'SSRI (cytalopram, escytalopram, sertralina, fluoksetyna…) / zespół serotoninowy',f:BASIC.concat(['amt','arr']).concat(HUNTER)},
 quet:{g:'psy',n:'Kwetiapina',f:BASIC.concat(['amt','sr','arr','agit'])},
 olan:{g:'psy',n:'Olanzapina',f:BASIC.concat(['amt','arr','agit'])},
 cbz:{g:'psy',n:'Karbamazepina',f:BASIC.concat(['amt','sr','chr','cbz','mv','arr'])},
 ltg:{g:'psy',n:'Lamotrygina',f:BASIC.concat(['amt','arr','ph'])},
 ccb_dhp:{g:'card',n:'Antagoniści wapnia – dihydropirydyny (amlodypina, nitrendypina…)',f:BASIC.concat(['amt','sr','shock','glu','k'])},
 ccb_nd:{g:'card',n:'Antagoniści wapnia – werapamil / diltiazem',f:BASIC.concat(['amt','sr','shock','glu','k'])},
 bb:{g:'card',n:'β-adrenolityki',f:BASIC.concat(['amt','sr','bbt','shock','arr','renal','glu','k'])},
 acei:{g:'card',n:'Inhibitory ACE / sartany',f:BASIC.concat(['amt','shock','renal','k'])},
 swarf:{g:'chem',n:'Superwarfaryny (rodentycydy: brodifakum, bromadiolon…)',f:['hrs','inr','bleed','sbp','hr']},
 caustic:{g:'chem',n:'Substancje żrące – zasady (np. Kret, NaOH) i kwasy',f:['hrs','drool','perf','resp','sbp','hr','spo2']},
 hc_ing:{g:'chem',n:'Węglowodory – połknięcie (benzyna, nafta, rozpuszczalniki, olej)',f:['hrs','resp','spo2','coma','seiz','temp']},
 hc_inh:{g:'chem',n:'Węglowodory – wdychanie (rozpuszczalniki, kleje, butan, aerozole)',f:['hrs','arr','hr','sbp','spo2','coma','seiz','cyan','k']},
 gas:{g:'chem',n:'Gazy drażniące (chlor, amoniak, gazy techniczne)',f:['hrs','gast','spo2','bronch','resp','fire','lact','cohb','h2s','coma','sbp','hr']}
};
FIELDS.bbt=['s','Rodzaj β-adrenolityku',[['','— wybierz —'],['prop','propranolol'],['aten','atenolol'],['sot','sotalol'],['inny','inny (metoprolol, bisoprolol, karwedilol…)']]];
FIELDS.gast=['s','Gaz',[['','— wybierz —'],['cl','chlor (np. zmieszanie środków czystości)'],['nh3','amoniak'],['tech','inny gaz techniczny / nieznany']]];
function list(g){return Object.keys(AG).filter(function(k){return AG[k].g===g;}).map(function(k){return [k,AG[k].n];});}
// ---------- pompy i dawki (opisy pełne, jak w module Pompy) ----------
function W(i){return fin(i.w)&&i.w>0?i.w:null;}
function bicarb(i){var w=W(i);return {d:'Wodorowęglan sodu 8,4% (Natrium bicarbonicum 8,4% – 1 mmol NaHCO₃ = 1 ml)',
 dose:'Bolus 1–2 mmol/kg i.v.'+(w?' = '+F(w,0)+'–'+F(2*w,0)+' mmol = '+F(w,0)+'–'+F(2*w,0)+' ml 8,4%':' (podaj masę ciała)')+'; powtarzaj do QRS <100–110 ms / pH 7,45–7,55 (nie przekraczaj pH 7,55).',
 prep:'Bolus: nierozcieńczony, do dużej żyły, w kilka minut.',
 pump:'Wlew podtrzymujący: 150 ml NaHCO₃ 8,4% (150 mmol) w 1000 ml glukozy 5% – pompa objętościowa 150 ml/h (źródło: 150 mmol w 1 l G5%, 150 ml/h); kontynuacja do 24 h po ustąpieniu zmian EKG.',src:['brucc','bicarb']};}
function hiet(i,ccb){var w=W(i);var r={d:'Insulina krótko działająca (Actrapid 100 j./ml, z FIOLKI) – terapia wysokodawkowa (HIET)',
 dose:'Bolus 1 j./kg i.v.'+(w?' = '+F(w,0)+' j.':'')+', potem wlew 1 j./kg/h'+(w?' = '+F(w,0)+' j./h':'')+'; przy braku poprawy zwiększać do 10 j./kg/h'+(w?' (= '+F(10*w,0)+' j./h)':'')+'.',
 prep:'Glukoza 10–50% we wlewie – utrzymanie normoglikemii; potas utrzymywać >3 mmol/l (spadek K to przesunięcie do komórek, nie utrata).',
 pump:w?'Pompa strzykawkowa 50 ml – wariant ChPL (1 j./ml): Actrapid 50 j. (0,5 ml) + NaCl 0,9% 49,5 ml; 1 j./kg/h = '+F(w,1)+' ml/h (przy 10 j./kg/h '+F(10*w,0)+' ml/h – niepraktyczne). Wariant stężony (10 j./ml, Graudins: ≥10 j./ml): Actrapid 500 j. (5 ml) + NaCl 0,9% 45 ml; 1 j./kg/h = '+F(w/10,1)+' ml/h, 10 j./kg/h = '+F(w,1)+' ml/h – POZA ChPL (Actrapid 0,05–1 j./ml), '+DEC+'.':'Podaj masę ciała – prędkość pompy w ml/h.',
 src:ccb?['ccb','graud','actrapid']:['aha23','graud','actrapid'],flag:'Stężenie 10 j./ml poza ChPL Actrapid – STANDARD LOKALNY / '+DEC};return r;}
function calcium(i){var w=W(i);return {d:'Chlorek wapnia – Calcium chloratum WZF 67 mg/ml (0,46 mmol Ca²⁺/ml)',
 dose:'ChPL (zatrucie antagonistami wapnia): start 5 ml (2,3 mmol) od razu, w razie potrzeby powtarzać. St-Onge 2017: 10–20 ml 10% CaCl₂ (6,8–13,6 mmol) co 10–20 min ≈ 15–30 ml WZF (PRZELICZENIE stężeń 0,68 → 0,46 mmol/ml). Szybkość ≤1 mmol/min (ChPL): 15 ml (6,9 mmol) ≥7 min, 30 ml ≥14 min.',
 prep:'Do dużej żyły lub żyły centralnej; ChPL zaleca rozcieńczenie (NaCl 0,9% lub G5%). Kontrola stężenia wapnia (zjonizowany do 2× górnej granicy normy – Graudins).',
 pump:'Wlew: St-Onge 0,2–0,4 ml/kg/h 10% CaCl₂ (0,136–0,272 mmol/kg/h) ≈ 0,3–0,6 ml/kg/h WZF'+(w?' = '+F(0.3*w,0)+'–'+F(0.6*w,0)+' ml/h WZF nierozcieńczonego (dostęp centralny)':'')+'. Wariant rozcieńczony (pompa strzykawkowa 50 ml): WZF 20 ml (9,2 mmol) + NaCl 0,9% 30 ml = 0,184 mmol/ml'+(w?' → '+F(0.136*w/0.184,0)+'–'+F(0.272*w/0.184,0)+' ml/h':'')+' – stężenie: STANDARD LOKALNY, '+DEC+'.',
 src:['cacl','ccb','graud'],flag:'Przeliczenie 10% CaCl₂ (St-Onge) na WZF 0,46 mmol/ml – sprawdź preparat dostępny w szpitalu'};}
function nora(i){var w=W(i);return {d:'Noradrenalina – pompa wg modułu Pompy SOR (4 mg/50 ml = 80 µg/ml, dostęp centralny)',
 dose:'Start 0,05 µg/kg/min'+(w?' = '+F(0.05*w*60/80,1)+' ml/h':'')+'; zwiększać wg MAP (moduł Pompy).',prep:'Noradrenaline Kabi 1 mg/ml: cała ampułka 4 mg (4 ml) + 46 ml rozpuszczalnika (G5% / NaCl 0,9%) = 80 µg/ml.',pump:'Pompa strzykawkowa 50 ml, linia centralna; szczegóły i tabela przepływów – moduł Pompy SOR.',src:['pom','ccb']};}
function lipid(i){var w=W(i);return {d:'Emulsja tłuszczowa 20% (Intralipid 20%) – tylko oporny wstrząs / zagrożenie NZK',
 dose:'Bolus 1,5 ml/kg'+(w?' = '+F(1.5*w,0)+' ml':'')+', potem 0,25 ml/kg/min przez 30–60 min'+(w?' = '+F(0.25*w*60,0)+' ml/h':'')+'; dawka łączna maks. 10 ml/kg'+(w?' = '+F(10*w,0)+' ml':'')+'.',
 prep:'Worek Intralipid 20% – pompa objętościowa (infuzyjna).',pump:w?'Pompa objętościowa: '+F(0.25*w*60,0)+' ml/h przez 30–60 min; ZATRZYMAĆ po osiągnięciu dawki łącznej 10 ml/kg = '+F(10*w,0)+' ml razem z bolusem (przy tej prędkości po ok. 34 min wlewu, tj. '+F(8.5*w,0)+' ml).':'Podaj masę ciała.',src:['graud','ccb','intralipid'],flag:'Wskazanie i szybkość poza ChPL Intralipid (żywienie pozajelitowe) – '+DEC};}
function glucagon(i){var w=W(i);return {d:'Glukagon (GlucaGen 1 mg – fiolka 1 mg, po rozpuszczeniu 1 mg/ml)',
 dose:'Bolus 5–10 mg i.v. (Graudins; ChPL Propranolol WZF: 10 mg szybko i.v. po atropinie) = 5–10 fiolek; potem wlew 1–10 mg/h (ChPL Propranolol WZF: od 1 mg/h).',
 prep:'Każdą fiolkę rozpuścić dołączonym rozpuszczalnikiem (1 mg/ml). Wymioty częste – zabezpiecz drogi oddechowe.',pump:'Pompa strzykawkowa: glukagon 1 mg/ml nierozcieńczony, 1–10 ml/h (= 1–10 mg/h); stabilność roztworu do wlewu – brak danych w ChPL GlucaGen.',src:['graud','propr','glucagen'],flag:'Wlew glukagonu poza ChPL GlucaGen; duże zapotrzebowanie na fiolki 1 mg – '+DEC};}
function atropine(){return {d:'Atropina',dose:'1–2 mg i.v. przy istotnej bradykardii (ChPL Propranolol WZF).',prep:'',pump:'',src:['propr','betaloc']};}
function carnitine(i){var w=W(i);var m=w?Math.min(50*w,3000):null;return {d:'L-karnityna i.v.',
 dose:'100 mg/kg i.v. jednorazowo'+(w?' = '+F(100*w,0)+' mg':'')+', potem 50 mg/kg (maks. 3 g/dawkę)'+(w?' = '+F(m,0)+' mg':'')+' co 8 h – do spadku amoniaku i poprawy klinicznej.',
 prep:'Rozcieńczenie / czas wlewu – wg ChPL sprowadzanego preparatu.',pump:'',src:['carn','convulex'],flag:'L-karnityna i.v. NIE jest zarejestrowana w Polsce (brak w RPL) – import docelowy / apteka szpitalna; '+DEC};}
function cypro(){return {d:'Cyproheptadyna p.o. / przez zgłębnik (Peritol 4 mg tabl.)',
 dose:'12 mg (3 tabl.) jednorazowo, potem 2 mg (½ tabl.) co 2 h do poprawy; podtrzymująco 8 mg (2 tabl.) co 6 h (Scotton 2019). Przegląd 2025: 12 mg może być za mało.',prep:'Tabletki można rozkruszyć i podać przez zgłębnik.',pump:'',src:['sero','sero25','peritol'],flag:'ChPL Peritol (wskazania alergiczne): maks. 20 mg/dobę – schemat w zespole serotoninowym poza ChPL, '+DEC};}
function vitk(){return {d:'Witamina K1 – fitomenadion (Vitacon 10 mg/ml)',
 dose:'Ciężkie krwawienie: 10–20 mg powoli i.v. (ChPL); maks. 40 mg/dobę i.v. (ChPL). Superwarfaryny działają tygodniami–miesiącami – dalsze (często bardzo duże, doustne) dawki wg toksykologa.',
 prep:'Infuzja: 10 mg (1 ml) w 100 ml NaCl 0,9% przez 20–30 min.',pump:'Pompa objętościowa: 100 ml w 20–30 min = 200–300 ml/h.',src:['vitacon','swarf'],flag:'Dawki w superwarfarynach przekraczają ChPL (maks. 40 mg/d) – tylko wg toksykologa'};}
function hydroxo(i){var w=W(i);return {d:'Hydroksokobalamina (Cyanokit) – podejrzenie zatrucia cyjankami (dym pożarowy)',
 dose:'5 g i.v. w 15 min (dzieci 70 mg/kg, maks. 5 g); w razie potrzeby druga dawka 5 g w 15 min–2 h; maks. łącznie 10 g (ChPL).',prep:'Po odtworzeniu NaCl 0,9%: 25 mg/ml (5 g = 200 ml).',pump:'Pompa objętościowa: 200 ml w 15 min = 800 ml/h.',src:['cyan']};}
function charcoal(){return {d:'Węgiel aktywowany',dose:'50 g p.o. / przez zgłębnik, jeśli <1 h od spożycia (ChPL amitryptyliny); tylko przy zabezpieczonych drogach oddechowych.',prep:'',pump:'',src:['amit']};}
// ---------- Hunter ----------
function hunter(i){var ad=i.agit===true||i.diaph===true;var r=[];
 if(i.sclon===true)r.push('klonus samoistny');if(i.iclon===true&&ad)r.push('klonus indukowany + pobudzenie / potliwość');if(i.oclon===true&&ad)r.push('klonus oczny + pobudzenie / potliwość');
 if(i.trem===true&&i.hrefl===true)r.push('drżenie + hiperrefleksja');if(i.hton===true&&fin(i.temp)&&i.temp>38&&(i.oclon===true||i.iclon===true))r.push('wzmożone napięcie + temp. >38 °C + klonus oczny / indukowany');
 var any=HUNTER.some(function(k){return k==='temp'?fin(i.temp):i[k]===true;});return {pos:r.length>0,why:r,any:any,severe:fin(i.temp)&&i.temp>41.1};}
// ---------- plan ----------
function plan(id,i){var a=AG[id];if(!a)return {ok:false,msg:'Wybierz substancję.'};i=i||{};
 var o={ok:true,id:id,n:a.n,rec:[],init:[],doses:[],labs:[],next:[],ex:null,alarm:false,warn:[],avoid:[],disc:[],src:['tox']};
 var qrs=fin(i.qrs)&&i.qrs>100,hypo=i.shock===true||(fin(i.sbp)&&i.sbp<90),brady=fin(i.hr)&&i.hr<50;
 function A(c){if(c)o.alarm=true;}
 A(qrs||hypo||i.seiz===true||i.coma===true||i.arr===true||(fin(i.qtc)&&i.qtc>=500)||(fin(i.spo2)&&i.spo2<90));
 if(!W(i)&&['tca','opi','vpa','ccb_dhp','ccb_nd','bb','ltg'].indexOf(id)>=0)o.warn.push('Brak masy ciała w panelu pacjenta – dawki zależne od masy i prędkości pomp nie są wyliczone.');
 var tcaLike=id==='tca'||id==='opi';
 if(tcaLike){
  o.rec=['Objawy przeciwcholinergiczne (rozszerzone źrenice, tachykardia, zatrzymanie moczu, suchość), drgawki, śpiączka, depresja oddechowa.','EKG: poszerzenie QRS (dobrze koreluje z ciężkością), wydłużenie PR/QT, wzorzec Brugadów, komorowe zaburzenia rytmu; hipotensja, kwasica.',id==='opi'?'Opipramol – lek trójpierścieniowy: objawy jak w zatruciu TLPD (ChPL Pramolan).':'Spożycie ≥750 mg amitryptyliny u dorosłego może dawać ciężką toksyczność (ChPL).'];
  o.init=['ABC, dostęp i.v., ciągłe monitorowanie EKG; intubacja przy zaburzeniach świadomości / oddychania.','Nie podawać flumazenilu przy współprzyjęciu benzodiazepin (ChPL).','Drgawki: benzodiazepiny (diazepam – ChPL) – moduł Stan padaczkowy.'];
  o.doses.push(charcoal());
  if(qrs||i.arr===true||hypo){o.doses.push(bicarb(i));}else o.next.push('NaHCO₃ 8,4% – gdy QRS >100 ms, komorowe zaburzenia rytmu lub hipotensja (Bruccoleri 2016).');
  o.labs=[['EKG (QRS, QTc)','ciągle; po każdym bolusie NaHCO₃',['brucc']],['Gazometria (pH), Na, K','po każdym bolusie NaHCO₃ (cel pH 7,45–7,55; hipokaliemia)',['brucc','amit']],['Diureza, mocznik, elektrolity','przy przyjęciu i w trakcie',['amit']],['CK','przy przedłużonej nieprzytomności (rabdomioliza)',['amit']]];
  o.next.push(id==='opi'?'Monitorowanie czynności układu krążenia co najmniej 48 h (ChPL Pramolan).':'Pacjent z objawami – monitorowanie ≥12 h; w ciężkim zatruciu ciągłe EKG 3–5 dni (ChPL).');
  o.ex={lvl:'',txt:[id==='opi'?'Dializa nieskuteczna (ChPL Pramolan).':'ECTR NIE jest zalecane w zatruciu TLPD (EXTRIP).'],src:id==='opi'?['pramolan']:['xtca']};
  o.disc.push((id==='opi'?'ChPL Pramolan':'ChPL')+' wymienia wywołanie wymiotów / płukanie żołądka – AACT/EAPCCT 2013: wymioty prowokowane – nie; płukanie – nie rutynowo.');o.src.push('ipec','lav',id==='opi'?'pramolan':'amit');}
 if(id==='vpa'){
  o.rec=['Zaburzenia świadomości do śpiączki, depresja oddechowa, miosis, hipotensja, kwasica metaboliczna, hipernatremia; hiperamonemia (encefalopatia także przy prawidłowym stężeniu VPA); obrzęk mózgu.','Postać SR – szczyt stężenia opóźniony.'];
  o.init=['ABC, glikemia, gazometria, amoniak, stężenie VPA.','Nalokson – skuteczny w pojedynczych przypadkach (ChPL Convulex).'];
  if(i.coma===true||i.hnh3===true)o.doses.push(carnitine(i));else o.next.push('L-karnityna – rozważ przy obniżonej świadomości lub hiperamonemii (Perrott 2010).');
  o.labs=[['Stężenie VPA','przy przyjęciu i powtórnie do potwierdzenia spadku (SR – szczyt opóźniony); odstęp – wg toksykologa',['xvpa']],['Amoniak','przy przyjęciu; w trakcie L-karnityny do spadku',['carn']],['Gazometria (pH), Na, glukoza, mleczany, ALT/AST','przy przyjęciu i w trakcie',['xvpa','convulex']]];
  var rec=[],sug=[];if(fin(i.vpa)&&i.vpa>1300)rec.push('VPA >1300 mg/l');if(i.edema===true)rec.push('obrzęk mózgu');if(i.shock===true)rec.push('wstrząs');
  if(fin(i.vpa)&&i.vpa>900&&i.vpa<=1300)sug.push('VPA >900 mg/l');if(i.mv===true)sug.push('śpiączka / depresja oddechowa wymagająca wentylacji');if(i.hnh3===true)sug.push('ostra hiperamonemia');if(fin(i.ph)&&i.ph<=7.10)sug.push('pH ≤7,10');
  o.ex={lvl:rec.length?'red':sug.length?'orange':'',txt:[rec.length?'ECTR ZALECANE (EXTRIP 1D): '+rec.join(', ')+'.':'',sug.length?'ECTR SUGEROWANE (EXTRIP 2D): '+sug.join(', ')+'.':'',!rec.length&&!sug.length?'Brak kryteriów EXTRIP wg wprowadzonych danych (VPA >1300 mg/l, obrzęk mózgu, wstrząs – zalecane; >900 mg/l, wentylacja, hiperamonemia, pH ≤7,10 – sugerowane).':'','Metoda: hemodializa przerywana; zakończenie przy poprawie klinicznej lub VPA 50–100 mg/l.'].filter(Boolean),src:['xvpa']};A(rec.length>0);
  o.disc.push('ChPL Convulex: płukanie żołądka do 10–12 h – AACT/EAPCCT 2013: płukanie nie rutynowo.');o.src.push('xvpa','carn','convulex','lav');}
 if(id==='li'){
  o.rec=['Objawy mogą być opóźnione; szczyt nawet po ≥24 h (SR, pacjent nieleczony przewlekle).','Wymioty, biegunka, drżenie grubofaliste, ataksja, splątanie, drgawki, śpiączka, zaburzenia rytmu. 1,5–2 mmol/l (12 h po dawce): drżenie, dyzartria, ataksja; 2–3 mmol/l: splątanie, drgawki, śpiączka (ChPL).','Zatrucie przewlekłe groźniejsze przy niższych stężeniach (tkanki wysycone).'];
  o.init=['Odstawić lit; nawodnienie i.v. przy odwodnieniu (objętość / rodzaj płynu – '+DEC+').','Węgiel aktywowany NIE wiąże litu (ChPL); postać SR – rozważ płukanie całego przewodu pokarmowego (ChPL) – wg toksykologa.'];
  o.labs=[['Stężenie litu','przy przyjęciu i powtarzane (szczyt może wystąpić ≥24 h); po dializie – ponownie (efekt odbicia)',['lith','xli']],['Kreatynina / eGFR, Na, K, diureza','przy przyjęciu i w trakcie',['xli']],['EKG','przy przyjęciu i monitorowanie',['lith']]];
  var r2=[],s2=[];if(i.renal===true&&fin(i.li)&&i.li>4)r2.push('upośledzona czynność nerek + Li >4,0 mmol/l');if(i.coma===true)r2.push('obniżona świadomość');if(i.seiz===true)r2.push('drgawki');if(i.arr===true)r2.push('zaburzenia rytmu zagrażające życiu');
  if(fin(i.li)&&i.li>5)s2.push('Li >5,0 mmol/l');if(i.conf===true)s2.push('istotne splątanie');
  o.ex={lvl:r2.length?'red':s2.length?'orange':'',txt:[r2.length?'ECTR ZALECANE (EXTRIP): '+r2.join(', ')+'.':'',s2.length?'ECTR SUGEROWANE (EXTRIP): '+s2.join(', ')+'.':'','Sugerowane także, gdy przewidywany czas do Li <1,0 mmol/l przy optymalnym leczeniu >36 h.','Metoda: hemodializa przerywana (CRRT – akceptowalna); kontynuować do poprawy lub Li <1,0 mmol/l; gdy stężenie niedostępne – min. 6 h.'].filter(Boolean),src:['xli']};A(r2.length>0);
  o.disc.push('ChPL Lithium: mannitol / wymuszona diureza i płukanie – nie są elementem rekomendacji EXTRIP 2015.');o.src.push('xli','lith');}
 if(id==='cbz'){
  o.rec=['Śpiączka, ataksja, oczopląs, drgawki, depresja oddechowa, tachykardia / zaburzenia przewodzenia (poszerzenie QRS), hiponatremia (działanie ADH-podobne), rabdomioliza.','Nawrót objawów w 2.–3. dobie (opóźnione wchłanianie) – ChPL.'];
  o.init=['ABC, monitorowanie EKG; drgawki – benzodiazepiny (moduł Stan padaczkowy).','Węgiel aktywowany wielokrotny (MDAC) – zalecany przy zagrażającym życiu spożyciu (EXTRIP); dawka wg toksykologa.'];
  o.labs=[['Stężenie karbamazepiny','przy przyjęciu i powtarzane (rosnące mimo MDAC → rozważ ECTR)',['xcbz','amizepin']],['Na, gazometria, glukoza, CK','przy przyjęciu i w trakcie',['amizepin']],['EKG','ciągle',['amizepin']]];
  var r3=[],s3=[];if(i.seiz===true)r3.push('drgawki (zalecane przy mnogich, opornych na leczenie)');if(i.arr===true)r3.push('zaburzenia rytmu zagrażające życiu');if(i.coma===true||i.mv===true)s3.push('przedłużona śpiączka / wentylacja');
  o.ex={lvl:r3.length?'red':s3.length?'orange':'',txt:[r3.length?'ECTR ZALECANE (EXTRIP): '+r3.join(', ')+'.':'',s3.length?'ECTR SUGEROWANE (EXTRIP): '+s3.join(', ')+'.':'','Sugerowane też przy utrzymującej się toksyczności i rosnącym stężeniu mimo MDAC. Zakończenie: poprawa kliniczna lub CBZ <10 mg/l. Metoda: hemodializa przerywana.'].filter(Boolean),src:['xcbz']};A(r3.length>0);
  o.next.push('Obserwacja z uwzględnieniem nawrotu w 2.–3. dobie (ChPL).');
  o.disc.push('ChPL Amizepin: „sprowokować wymioty, płukanie żołądka” – AACT/EAPCCT 2013: wymioty – nie; płukanie – nie rutynowo.');o.src.push('xcbz','amizepin','ipec','lav');}
 if(id==='ltg'){
  o.rec=['Oczopląs, ataksja, zaburzenia świadomości, uogólnione drgawki, śpiączka.','EKG: poszerzenie QRS i wydłużenie QT; QRS >100 ms – cięższa toksyczność (ChPL).'];
  o.init=['Hospitalizacja, leczenie objawowe; węgiel aktywowany, jeśli wskazany (ChPL).','Drgawki – benzodiazepiny (moduł Stan padaczkowy).'];
  if(qrs){var b=bicarb(i);b.flag='ChPL Lamitrin wymienia wodorowęglan sodu bez dawki – dawka jak w TLPD (Bruccoleri) = ekstrapolacja, '+DEC;o.doses.push(b);var L=lipid(i);L.d='Emulsja tłuszczowa 20% – gdy niedostateczna odpowiedź na NaHCO₃ (ChPL Lamitrin)';L.src=['lamitrin','graud','intralipid'];o.doses.push(L);}
  o.labs=[['EKG (QRS, QT)','ciągle',['lamitrin']],['Gazometria, elektrolity','przy przyjęciu; po NaHCO₃',['brucc']]];
  o.ex={lvl:'',txt:['Brak doświadczenia z hemodializą w przedawkowaniu; 4 h HD usuwa ok. 20% leku (ChPL).'],src:['lamitrin']};o.src.push('lamitrin');}
 if(id==='ven'||id==='ssri'){
  o.rec=id==='ven'?['Tachykardia, senność do śpiączki, rozszerzenie źrenic, drgawki, wymioty; EKG: wydłużenie QT, blok odnogi, poszerzenie QRS, VT; hipotensja, hipoglikemia.','Ciężkie zatrucie możliwe po ok. 3 g u dorosłego (ChPL Efectin).']:['Senność, tachykardia, drżenie, wymioty, drgawki; wydłużenie QTc, torsade de pointes (cytalopram, sertralina); zespół serotoninowy.'];
  o.init=['Monitorowanie EKG i parametrów życiowych; węgiel aktywowany (ChPL).','Brak swoistej odtrutki (ChPL).',id==='ven'?'Przy podejrzeniu przedawkowania – niezwłoczny kontakt z ośrodkiem toksykologicznym (ChPL Efectin).':'Torsade de pointes – leczenie wg ALS.'];
  if(id==='ven'&&fin(i.amt)&&i.amt>=3000){o.warn.push('Deklarowana dawka ≥3 g – ryzyko ciężkiego zatrucia (ChPL Efectin).');A(true);}
  if(id==='ven'&&fin(i.glu)&&i.glu<3.9){o.warn.push('Hipoglikemia – korekta glukozą (dawka wg modułu / standardu).');A(true);}
  if(qrs)o.next.push('Poszerzenie QRS – postępowanie (np. NaHCO₃ jak w TLPD) tylko po konsultacji toksykologicznej; ChPL bez zaleceń dawkowania.');
  var h=hunter(i);
  if(h.any){if(h.pos){o.warn.push('Kryteria Huntera SPEŁNIONE: '+h.why.join('; ')+' → zespół serotoninowy.');A(true);o.init.push('Zespół serotoninowy: odstawić leki serotoninergiczne, benzodiazepiny (diazepam / midazolam), chłodzenie aktywne; leki przeciwgorączkowe nieskuteczne (Scotton 2019).');o.doses.push(cypro());
    if(h.severe)o.warn.push('Temperatura >41,1 °C – natychmiastowa intubacja i zwiotczenie niedepolaryzujące, sedacja benzodiazepiną, OIT (Scotton 2019).');}
   else o.next.push('Kryteria Huntera niespełnione wg zaznaczonych objawów – oceniaj ponownie (większość przypadków w ciągu 24 h).');}
  o.labs=[['EKG (QTc, QRS)','przy przyjęciu i monitorowanie ciągłe przy zmianach',[id==='ven'?'efectin':'cipramil']],id==='ven'?['Glukoza','przy przyjęciu i w trakcie (hipoglikemia)',['efectin']]:['Elektrolity (K, Mg)','przy wydłużonym QTc',['cipramil']],['CK, temperatura','przy zespole serotoninowym',['sero']]];
  o.ex={lvl:'',txt:['Dializa / hemoperfuzja prawdopodobnie nieskuteczne (ChPL).'],src:[id==='ven'?'efectin':'zoloft']};
  if(id==='ssri')o.disc.push('ChPL Cipramil wymienia płukanie żołądka – AACT/EAPCCT 2013: nie rutynowo.');
  o.src.push(id==='ven'?'efectin':'cipramil','zoloft','sero');}
 if(id==='quet'||id==='olan'){
  o.rec=id==='quet'?['Senność, sedacja, tachykardia, hipotensja, objawy przeciwcholinergiczne; wydłużenie QT, drgawki, rabdomioliza, niewydolność oddechowa, majaczenie, śpiączka (ChPL).']:['Tachykardia, pobudzenie / agresja, dyzartria, objawy pozapiramidowe, obniżona świadomość do śpiączki; drgawki, depresja oddechowa, hipotensja, rzadko zaburzenia rytmu (ChPL).'];
  o.init=['Brak swoistej odtrutki; OIT w ciężkim zatruciu, drożność dróg oddechowych, monitorowanie EKG.',id==='olan'?'Węgiel aktywowany zmniejsza biodostępność olanzapiny o 50–60%; nie prowokować wymiotów (ChPL).':'Węgiel aktywowany – rozważ wg stanu (ChPL bez dawki).','Hipotensja: płyny; jeśli konieczny lek wazopresyjny – NIE adrenalina, NIE dopamina'+(id==='olan'?' ani β-mimetyki':'')+' (blokada α – paradoksalny spadek RR; ChPL). Wybór wazopresora – '+DEC+'.'];
  if(id==='quet')o.next.push('Fizostygmina 1–2 mg (ChPL Ketipinor) – tylko majaczenie przeciwcholinergiczne i PRAWIDŁOWE EKG, nie standardowo; dostępność w PL nie zweryfikowana.');
  o.avoid.push('adrenalina','dopamina');o.labs=[['EKG (QTc)','przy przyjęciu i ciągle',[id==='quet'?'ketipinor':'zolafren']],['CK','przy przedłużonym unieruchomieniu / drgawkach',['ketipinor']]];
  o.ex={lvl:'',txt:['ECTR bez znaczenia (duża objętość dystrybucji) – brak rekomendacji w ChPL.'],src:[id==='quet'?'ketipinor':'zolafren']};o.src.push(id==='quet'?'ketipinor':'zolafren');}
 if(id==='ccb_dhp'||id==='ccb_nd'||id==='bb'){
  var isB=id==='bb';
  o.rec=isB?['Bradykardia, bloki AV, hipotensja, wstrząs kardiogenny; skurcz oskrzeli; hipoglikemia; propranolol – drgawki, poszerzenie QRS; sotalol – wydłużenie QT, torsade de pointes.']:[id==='ccb_nd'?'Werapamil / diltiazem: bradykardia, bloki AV, hipotensja, wstrząs kardiogenny.':'Dihydropirydyny: rozszerzenie naczyń, hipotensja z odruchową tachykardią; w dużych dawkach utrata wybiórczości.','Hiperglikemia (blokada wydzielania insuliny) – wskaźnik ciężkości.'];
  o.init=['ABC, monitorowanie EKG i RR, dostęp i.v.; płyny krystaloidy przy hipotensji.','Bezobjawowy po spożyciu potencjalnie toksycznej dawki – obserwacja i monitorowanie ok. 24 h (St-Onge 2017; SR – Graudins 2016).'];
  if(isB){if(brady||hypo||i.shock===true)o.doses.push(atropine());if(hypo||i.shock===true||brady)o.doses.push(glucagon(i));}
  if(hypo||i.shock===true||(!isB&&brady)){o.doses.push(calcium(i));o.doses.push(hiet(i,!isB));o.doses.push(nora(i));
   o.next.push('Wstrząs oporny / zagrożenie NZK: emulsja tłuszczowa (poniżej), rozważ VA-ECMO / transfer do ośrodka (St-Onge 2017).');o.doses.push(lipid(i));}
  else o.next.push('Przy hipotensji / wstrząsie pojawią się: '+(isB?'atropina, glukagon, ':'')+'wapń, HIET (insulina + glukoza), noradrenalina, emulsja tłuszczowa.');
  o.labs=[['RR, EKG','ciągle',['ccb']],['Glikemia i K⁺','w trakcie HIET – często (źródła: „ścisłe / regularne monitorowanie”; interwał wg protokołu OIT – '+DEC+'); cel K >3 mmol/l',['ccb','graud']],['Wapń zjonizowany','w trakcie podawania wapnia (cel do 2× górnej granicy normy)',['graud','cacl']],['Mleczany, gazometria, kreatynina','przy przyjęciu i w trakcie',['ccb']]];
  if(isB){var bt=i.bbt;var ok=(bt==='aten'||bt==='sot')&&i.renal===true&&(hypo||brady||i.shock===true||i.arr===true);
   o.ex={lvl:ok?'orange':'',txt:[bt==='prop'?'Propranolol: ECTR NIE jest zalecane (EXTRIP 2021).':'',ok?'ECTR SUGEROWANE (EXTRIP 2021): '+(bt==='aten'?'atenolol':'sotalol')+' + upośledzona czynność nerek + oporna bradykardia / hipotensja'+(bt==='sot'?' / torsade de pointes':'')+'.':'',(bt==='aten'||bt==='sot')&&!ok?'Atenolol / sotalol: ECTR sugerowane tylko przy upośledzonej czynności nerek i opornej bradykardii / hipotensji (sotalol: także TdP).':'',!bt?'Wybierz rodzaj β-adrenolityku – ocena EXTRIP zależy od leku.':'',bt==='inny'?'Pozostałe β-adrenolityki (metoprolol, bisoprolol, karwedilol…): brak wskazań do ECTR w EXTRIP 2021.':''].filter(Boolean),src:['xbb']};
   o.src.push('xbb','propr','betaloc','graud','aha23');}
  else{o.ex={lvl:'',txt:['Amlodypina / werapamil – nie są usuwane dializą (ChPL).'],src:[id==='ccb_nd'?'isoptin':'amlozek']};o.src.push('ccb','graud',id==='ccb_nd'?'isoptin':'amlozek');}}
 if(id==='acei'){
  o.rec=['Hipotensja (często dobrze tolerowana), bradykardia, zaburzenia elektrolitowe (hiperkaliemia), niewydolność nerek.'];
  o.init=['Pozycja leżąca, płyny NaCl 0,9% przy hipotensji (objętość – '+DEC+').','Oporna hipotensja: α1-mimetyki (noradrenalina – moduł Pompy) lub angiotensyna II (ChPL Tritace).'];
  if(hypo)o.doses.push(nora(i));
  o.labs=[['K⁺, kreatynina','przy przyjęciu i powtórnie',['tritace']],['RR','monitorowanie',['tritace']]];
  o.ex={lvl:'',txt:['Ramiprylat słabo dializowalny (ChPL Tritace); losartan nie jest usuwany dializą (ChPL Cozaar).'],src:['tritace','cozaar']};o.src.push('tritace','cozaar');}
 if(id==='swarf'){
  o.rec=['Często bez objawów w pierwszych dniach; krwawienia (dziąsła, krwiomocz, krwawienia z przewodu pokarmowego, śródczaszkowe) po 1–3 dobach. Działanie utrzymuje się tygodniami–miesiącami.'];
  o.init=['INR przy przyjęciu i 48–72 h po ekspozycji (najbardziej wiarygodny wynik – Front Pharmacol 2024).','Czynne istotne krwawienie: koncentrat czynników zespołu protrombiny (PCC) – dawkowanie w module Antykoagulacja → Warfaryna; krew / preparaty krwi wg potrzeb (ChPL Vitacon).'];
  if(i.bleed===true||(fin(i.inr)&&i.inr>=2)){o.doses.push(vitk());A(i.bleed===true);}else o.next.push('Witamina K1 – przy krwawieniu lub podwyższonym INR (próg i dawka u bezobjawowych – wg toksykologa).');
  o.labs=[['INR / PT','przy przyjęciu; 48–72 h po ekspozycji; 3 h po witaminie K1 (ChPL Vitacon)',['swarf','vitacon']],['Morfologia (Hb)','przy przyjęciu i przy krwawieniu',['vitacon']]];
  o.next.push('Leczenie podtrzymujące witaminą K1 trwa często miesiącami – plan, dawki i kontrole INR wg toksykologa; skierowanie po wypisie.');
  o.ex={lvl:'',txt:['ECTR bez znaczenia.'],src:['swarf']};o.src.push('swarf','vitacon');}
 if(id==='caustic'){
  o.rec=['Ból jamy ustnej / zamostkowy, ślinotok, dysfagia, wymioty (krwiste), chrypka / stridor (drogi oddechowe), objawy perforacji. Brak zmian w jamie ustnej NIE wyklucza uszkodzenia przełyku / żołądka.'];
  o.init=['Drożność dróg oddechowych, stabilizacja krążenia; intubacja – preferowana fiberoskopowa, nie „na ślepo”; w razie potrzeby tracheotomia (WSES).','NIE prowokować wymiotów, NIE płukać żołądka, NIE neutralizować (kwas ↔ zasada), NIE rozcieńczać (WSES 2015).','Nie zakładać zgłębnika nosowo-żołądkowego (WSES). Leki przeciwwymiotne. Nic doustnie.','Kortykosteroidy – tylko przy objawach z dróg oddechowych; antybiotyki – nie rutynowo; IPP / H2 – skuteczność niepotwierdzona (WSES).'];
  if(i.perf===true||i.drool===true)A(true);
  o.labs=[['Endoskopia górnego odcinka (klasyfikacja Zargara)','zwykle 3–6 h po spożyciu (WSES)',['wses']],['TK klatki piersiowej i brzucha z kontrastem','w ocenie ciężkości / kwalifikacji do zabiegu – może zastąpić endoskopię (WSES)',['wses']],['Gazometria, mleczany, morfologia, kreatynina','przy przyjęciu (ocena ciężkości) – '+DEC,['wses']]];
  o.next.push(i.perf===true?'Objawy perforacji – pilna konsultacja chirurgiczna / transfer do ośrodka z chirurgią przełyku (WSES).':'Konsultacja chirurgiczna i endoskopowa; ciężkie uszkodzenie – ośrodek referencyjny (WSES).');
  o.ex={lvl:'',txt:['Nie dotyczy.'],src:['wses']};o.src.push('wses');}
 if(id==='hc_ing'){
  o.rec=['Główne zagrożenie – zachłyśnięcie i chemiczne zapalenie płuc (kaszel, krztuszenie, duszność, gorączka); objawy płucne mogą narastać przez kilka dni (Cho 2026). Depresja OUN.'];
  o.init=['NIE prowokować wymiotów (AACT/EAPCCT 2013; Cho 2026). Dekontaminacja żołądka przeciwwskazana – duże ryzyko aspiracji (Radparvar 2023).','Nic doustnie; tlen przy hipoksemii, wsparcie oddechu.'];
  if(i.resp===true||(fin(i.spo2)&&i.spo2<94))A(true);
  o.labs=[['RTG klatki piersiowej','przy przyjęciu i powtórnie przy objawach (czas powtórzenia – '+DEC+')',['inh','hcasp']],['SpO₂ / gazometria','monitorowanie',['inh']]];
  o.next.push('Chemiczne zapalenie płuc w RTG – wsparcie oddechowe, płyny i.v., tlen; przyjęcie do szpitala na obserwację (Radparvar 2023).');
  o.ex={lvl:'',txt:['Nie dotyczy.'],src:['inh']};o.src.push('ipec','lav','inh','hcasp');}
 if(id==='hc_inh'){
  o.rec=['Euforia, splątanie, ataksja, drgawki, śpiączka; nagła śmierć z wąchania – uwrażliwienie mięśnia sercowego na katecholaminy → komorowe zaburzenia rytmu, VF.','Sinica: methemoglobinemia (azotyny) lub karboksyhemoglobina (chlorek metylenu).'];
  o.init=['Spokój, unikać pobudzenia i wysiłku (wyrzut katecholamin).','Katecholaminy (adrenalina) – tylko z dużą ostrożnością (Radparvar 2023); w NZK adrenalina kontrowersyjna (przegląd 2025) – decyzja kierującego resuscytacją.','β-adrenolityki można rozważyć dla ochrony mięśnia sercowego (Radparvar 2023) – '+DEC+'.'];
  if(i.arr===true)A(true);
  o.labs=[['EKG','ciągłe monitorowanie',['inh']],['Elektrolity (K), Ca, P, ALT/AST, kreatynina, CK','po stabilizacji (kwasica kanalikowa, hipokaliemia, rabdomioliza – toluen)',['inh']],['MetHb / COHb (gazometria z kooksymetrią)','przy sinicy',['inh']]];
  o.ex={lvl:'',txt:['Nie dotyczy.'],src:['inh']};o.src.push('inh','ssd');}
 if(id==='gas'){
  var gt=i.gast;
  o.rec=['Drażnienie oczu i dróg oddechowych, kaszel, świsty, duszność; obrzęk płuc / ARDS może się rozwinąć z opóźnieniem.',gt==='nh3'?'Amoniak – dobrze rozpuszczalny: oparzenia górnych dróg oddechowych, skurcz oskrzeli (opis 2025).':gt==='cl'?'Chlor – częsty po zmieszaniu środków czystości (podchloryn + kwas).':'Gaz techniczny / nieznany – oceń CO, H₂S, cyjanki.'];
  o.init=['Ewakuacja z miejsca narażenia (bezpieczeństwo zespołu), zdjęcie odzieży, płukanie oczu i skóry wodą.','Tlen; skurcz oskrzeli – leki rozszerzające oskrzela wziewnie (dawki: Leki – karty dawkowania); kortykosteroidy systemowe stosowano w opisach przypadków (amoniak).',gt==='cl'?'Nebulizacja wodorowęglanu sodu – opcjonalnie (retrospektywnie bezpieczna, bez ustalonej dawki – Bosse 1994): '+DEC+'.':''].filter(Boolean);
  if(i.fire===true||(fin(i.lact)&&i.lact>=8)||(fin(i.cohb)&&i.cohb>=10)||i.coma===true){
   o.init.push('Podejrzenie CO: 100% tlen od razu (S2k 2021); HBOT – jeśli wskazana – do 6 h (konsultacja ośrodka hiperbarycznego).');
   if(i.fire===true&&(i.coma===true||hypo||(fin(i.lact)&&i.lact>=8))){o.doses.push(hydroxo(i));A(true);}
   else o.next.push('Hydroksokobalamina – przy podejrzeniu cyjanków (dym pożarowy + zaburzenia świadomości / wstrząs / wysokie mleczany).');}
  if(i.h2s===true){o.init.push('Siarkowodór: natychmiast tlen, wsparcie krążenia i oddychania; odtrutka – brak zweryfikowanej (wg toksykologa).');A(true);}
  if(i.bronch===true||(fin(i.spo2)&&i.spo2<94))A(true);
  o.labs=[['SpO₂, gazometria z COHb i MetHb, mleczany','przy przyjęciu',['co']],['RTG klatki piersiowej','przy objawach oddechowych i powtórnie przy pogorszeniu (opóźniony obrzęk płuc)',['nh3']]];
  o.next.push('Obserwacja w kierunku opóźnionego obrzęku płuc – czas wg toksykologa / '+DEC+'.');
  o.ex={lvl:'',txt:['Nie dotyczy.'],src:['co']};o.src.push('nh3','co',gt==='cl'?'cl2':'cyan');}
 o.next.push('Konsultacja toksykologiczna – Kraków 12 411 99 99 (całodobowo): kolejne dawki, czas obserwacji, miejsce leczenia / transfer.');
 return o;}
return {SRC:SRC,short:short,AG:AG,FIELDS:FIELDS,list:list,plan:plan,hunter:hunter,F:F,DEC:DEC};
});
