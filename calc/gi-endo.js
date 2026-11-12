// Silnik: wynik gastroskopii (parser deterministyczny PL) + plan leczenia NVUGIH.
// Bez wywołania AI. Dawki wyłącznie ze źródeł zweryfikowanych (ESGE 2021, ACG 2021, Barkun 2019, ChPL / standard lokalny Pompy SOR).
(function(r,f){var m=f();if(typeof module==='object'&&module.exports)module.exports=m;else{r.SK=r.SK||{};r.SK.giEndo=m;r.SORGi=m;}})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

var RANK={Ia:6,Ib:5,IIa:4,IIb:3,IIc:2,III:1};
var HIGH={Ia:1,Ib:1,IIa:1,IIb:1};

var SRC=[
  'Gralnek IM, Stanley AJ, Morris AJ i wsp. Endoscopic diagnosis and management of nonvariceal upper gastrointestinal hemorrhage (NVUGIH): European Society of Gastrointestinal Endoscopy (ESGE) Guideline – Update 2021. Endoscopy 2021;53:300–332.',
  'Laine L, Barkun AN, Saltzman JR i wsp. ACG Clinical Guideline: Upper Gastrointestinal and Ulcer Bleeding. Am J Gastroenterol 2021;116:899–917.',
  'Barkun AN, Almadi M, Kuipers EJ i wsp. Management of Nonvariceal Upper Gastrointestinal Bleeding: Guideline Recommendations From the International Consensus Group. Ann Intern Med 2019;171:805–822.',
  'ChPL Pantoprazol Zentiva 40 mg (RPL 45188) — standard lokalny Pompy SOR: 80 mg / 20 ml = 4 mg/ml, 8 mg/h = 2 ml/h, stabilność 12 h. W tym opracowaniu aktualnej ChPL nie otwierano ponownie — potwierdź w ChPL używanego produktu.',
  'Baveno VII 2022 — krwawienie żylakowe / nadciśnienie wrotne (terlipresyna, antybiotyk).',
  'Blatchford O i wsp. Lancet 2000 — skala Glasgow-Blatchford.',
  'HALT-IT (Lancet 2020) — kwas traneksamowy niezalecany w krwawieniu z PP.'
];

var CLEAN="Przełyk bez zmian. Żołądek zapalny, podatny na insuflację, o sprawnej motoryce, jeziorko śluzowe skąpe, przezierne. Na kącie żołądka obecne owrzodzenie średnicy 2 cm pokryte włóknikiem, w centralnej części owrzodzenia widoczne sterczące, niekrwawiące naczynie (Forrest IIa), które skoagulowano w osłonie plazmy argonowej. W trakcie koagulacji obserwowano niewielkie krwawienie, które opanowano ostrzyknięciem owrzodzenia roztworem adrenaliny oraz ponowną koagulacją w osłonie plazmy argonowej. Na koniec zabiegu owrzodzenie pokryto proszkiem hemostatycznym; krwawienia nie obserwowano. W opuszce dwunastnicy widoczne kolejne owrzodzenie średnicy 1,5 cm pokryte włóknikiem (Forrest III). Część zstępująca dwunastnicy bez zmian.";

var DICTATION="przebieg bez zmian w zapalny żołądek podatny na inflację o sprawnej motoryce jeziorko śluzowe skąpe przezierne na koncie żołądka obecne owrzodzenie średnicy 2 cm pokryte włóknikiem w centralnej części owrzodzenia widoczne sterczące nie krwawiące naczynie Forest 2a które skoagulowano w osłonie plazmy argonowej w trakcie koagulacji obserwowano niewielkie krwawienie które opanowano ostrzyknięciem owrzodzenia roztworem adrenaliny oraz ponowną koagulacją w osłonie plazmy argonowej. Na koniec zabiegu owrzodzenie pokryto proszkiem hemostatycznym krwawienia nie obserwowano w opuszce dwunastycznej widoczne kolejne owrzodzenie średnicy półtora centymetra pokryte włóknikiem Forest 3 część zstępująca dwunastnicy bez zmian";

function pumpLocal(){
  var mg=80, vol=20, conc=mg/vol, rate=8, mlh=rate/conc, dur=vol/mlh;
  return {
    mg:mg, diluent:'NaCl 0,9%', finalMl:vol, conc:conc, concTxt:'4 mg/ml',
    mlh:mlh, mlhTxt:'2 ml/h', dose:rate, doseTxt:'8 mg/h', durationH:dur,
    stabilityH:12, vials:2, vialMg:40, reconMl:10,
    alt50:{mg:80, finalMl:50, conc:1.6, concTxt:'1,6 mg/ml', mlh:5, mlhTxt:'5 ml/h', usedLocally:false,
      reason:'Przykład 80 mg w 50 ml (1,6 mg/ml, 8 mg/h = 5 ml/h) jest matematycznie poprawny, ale NIE jest standardem lokalnym. Lokalnie przy stałym stężeniu 4 mg/ml strzykawka 50 ml zawierałaby 200 mg i przy 8 mg/h starczałaby na 25 h, co przekracza okno stabilności 12 h — dlatego receptura 50 ml jest niedostępna w Pompach SOR.'}
  };
}

function ppiHighDosePlain(worst, finalHem){
  var hem=finalHem==='yes'?'hemostaza endoskopowa uzyskana':finalHem==='no'?'hemostaza endoskopowa NIE uzyskana':'hemostaza końcowa niepewna';
  var w=worst||'cechy wysokiego ryzyka';
  return [
    'Pantoprazol — schemat wysokodawkowy i.v. przez 72 h (cechy wysokiego ryzyka: Forrest '+w+', '+hem+').',
    '',
    'Dwa równoważne warianty (ESGE 2021, ACG 2021, konsensus międzynarodowy Barkun 2019):',
    '',
    '1) Wlew ciągły: bolus 80 mg i.v., następnie 8 mg/h przez 72 h.',
    '   Receptura lokalna (Pompy SOR, standard lokalny): 2 fiolki pantoprazolu 40 mg, każdą rozpuścić w 10 ml NaCl 0,9%, łącznie 80 mg w 20 ml roztworu. Rozcieńczalnik: NaCl 0,9%. Objętość końcowa: 20 ml. Stężenie: 4 mg/ml. Przepływ: 8 mg/h = 2 ml/h. Dawka wynikowa: 8 mg/h. Strzykawka 20 ml starcza na 10 h.',
    '   Stabilność po rozpuszczeniu: 12 h (standard lokalny Pompy SOR, oparty na wcześniejszej weryfikacji ChPL produktu Pantoprazol Zentiva 40 mg). Dlatego lokalnie NIE stosuje się strzykawki 50 ml: przy stałym stężeniu 4 mg/ml strzykawka 50 ml zawierałaby 200 mg i przy 8 mg/h starczałaby na 25 h, co przekracza okno stabilności 12 h. Przykład 80 mg w NaCl 0,9% do 50 ml (1,6 mg/ml, 8 mg/h = 5 ml/h) jest matematycznie poprawny, ale nie jest standardem lokalnym — nie stosować go tutaj. Wymiana strzykawki co ≤10–12 h.',
    '   Schemat 80 mg + 8 mg/h jest schematem wytycznych (ESGE 2021), poza standardową dawką ChPL pantoprazolu i.v. (zwykle 40 mg 1×/d.; wlew 8 mg/h bywa wymieniany w ChPL w zespole Zollingera–Ellisona — potwierdź w aktualnej ChPL używanego produktu; w tym opracowaniu ChPL nie otwierano ponownie).',
    '',
    '2) Schemat przerywany wysokodawkowy: co najmniej 2×/d. przez 72 h, np.:',
    '   — bolus 80 mg i.v., następnie 40 mg i.v. co 12 h, albo',
    '   — 40 mg i.v. co 12 h',
    '   (ACG 2021: dawki przerywane 40 mg 2–4×/d. i.v. lub p.o., ewentualnie z bolusem 80 mg, uznane za równoważne wlewowi; ESGE 2021: bolus i.v. 2×/d. lub PPI p.o. 2×/d. jako warianty alternatywne).',
    '',
    'Po 72 h: pantoprazol p.o. 2×/d. do 14. doby, następnie 1×/d. przez okres gojenia wrzodu (ESGE 2021, ACG 2021).'
  ].join('\n');
}

function ppiLowDosePlain(){
  return 'Pantoprazol — schemat standardowy (cechy niskiego ryzyka: Forrest IIc lub III, bez cech wysokiego ryzyka).\n'+
    'Pantoprazol p.o. 40 mg 1×/d. lub 2×/d. (ESGE 2021, ACG 2021). Wlew 72-godzinny 8 mg/h nie jest wskazany.\n'+
    'Wczesne żywienie (dieta doustna / płyny) po endoskopii. Wypis możliwy, jeśli klinicznie niskie ryzyko (Glasgow-Blatchford ≤1) i stan ogólny na to pozwala (ACG 2021, ESGE 2021).';
}

function ppiPreEndoPlain(){
  return 'Brak wklejonego wyniku gastroskopii (lub brak zmian do odczytu). Przed endoskopią: rozważ bolus pantoprazolu 80 mg i.v. (ESGE 2021: przed endoskopią można rozważyć wysokodawkowy PPI i.v.; brak silnych danych, że zmniejsza śmiertelność lub ryzyko ponownego krwawienia). Nie rozpoczynaj automatycznie 72-godzinnego wlewu 8 mg/h bez cech wysokiego ryzyka w endoskopii.';
}

function normalize(text){
  var s=String(text||'').replace(/\u00a0/g,' ').replace(/\r\n/g,'\n');
  s=s.toLowerCase();
  var reps=[
    [/\bprzebieg\b/g,'przełyk'],
    [/\binflacj[ęeąa]\b/g,'insuflację'],
    [/\binsuflacj[ęeąa]\b/g,'insuflację'],
    [/\bna koncie\b/g,'na kącie'],
    [/\bna kacie\b/g,'na kącie'],
    [/\bkonto żołądka\b/g,'kącie żołądka'],
    [/\bkącie żołądka\b/g,'kącie żołądka'],
    [/\bopuszce dwunastycznej\b/g,'opuszce dwunastnicy'],
    [/\bopuszka dwunastnicz[aey]\b/g,'opuszka dwunastnicy'],
    [/\bw opuszce dwunastniczej\b/g,'w opuszce dwunastnicy'],
    [/\bdwunastniczej\b/g,'dwunastnicy'],
    [/p[oó][lł]\s*tora(\s*(?:cm|centymetr\w*))?/g,'1,5 cm'],
    [/\bforest\b/g,'forrest'],
    [/\bforresta\b/g,'forrest'],
    [/\bnie\s+krwawi[ąa]c[ey]\b/g,'niekrwawiące'],
    [/\bnie\s+krwawi[ąa]cym\b/g,'niekrwawiącym'],
    [/\bw zapalny żołądek\b/g,'żołądek zapalny']
  ];
  for(var i=0;i<reps.length;i++)s=s.replace(reps[i][0],reps[i][1]);
  s=s.replace(/\s+/g,' ').trim();
  return s;
}

function normForrest(tok){
  if(!tok)return null;
  var t=String(tok).toLowerCase().replace(/[\s.\-_]/g,'');
  var map={ia:'Ia','1a':'Ia',ib:'Ib','1b':'Ib',iia:'IIa','2a':'IIa',iib:'IIb','2b':'IIb',iic:'IIc','2c':'IIc',iii:'III','3':'III','iiia':'III'};
  if(map[t])return map[t];
  return null;
}

function findForrest(s){
  if(!s)return {cls:null,explicit:false};
  var re=/(?:forrest|forest|forresta)\s*(?:klasy\s*)?[:.\(]?\s*(iii|ii\s*[-.]?\s*[abc]|i\s*[-.]?\s*[abc]|[123]\s*[-.]?\s*[abc]?)/i;
  var m=s.match(re);
  if(m){var c=normForrest(m[1]);if(c)return {cls:c,explicit:true,raw:m[0]};}
  var re2=/\bf\s*[\.\-]?\s*(i{1,3}\s*[-.]?\s*[abc]|[123]\s*[-.]?\s*[abc])/i;
  m=s.match(re2);
  if(m){var c2=normForrest(m[1]);if(c2)return {cls:c2,explicit:true,raw:m[0]};}
  return {cls:null,explicit:false};
}

function inferForrest(s){
  if(!s)return {cls:null,inferred:false,note:''};
  var notes=[];
  if(/tryskaj[ąa]c|t[ęe]tnicz\w*\s+krwaw|krwawieni[ea]\s+t[ęe]tnicz|spurting|\bjet\b/.test(s))return {cls:'Ia',inferred:true,note:'wnioskowane z opisu krwawienia tryskającego / tętniczego'};
  if(/s[ąa]cz[ąa]c|oozing/.test(s))return {cls:'Ib',inferred:true,note:'wnioskowane z opisu krwawienia sączącego'};
  if(/(stercz[ąa]c\w*\s+(niekrwawi[ąa]c\w*\s+)?naczyni|naczyni[ea]\s+(widoczn|stercz)|widoczn\w+\s+stercz[ąa]c\w*\s+niekrwawi[ąa]c\w*\s+naczyni|niekrwawi[ąa]c\w*\s+naczyni|visible\s+vessel)/.test(s))
    return {cls:'IIa',inferred:true,note:'wnioskowane ze sterczącego / widocznego niekrwawiącego naczynia'};
  if(/przylegaj[ąa]c\w*\s+skrzep|skrzep\s+przyleg|adherent\s+clot|\bskrzeplin\w*\s+przyleg|\bczop\s+krw/.test(s))
    return {cls:'IIb',inferred:true,note:'wnioskowane z przylegającego skrzepu'};
  if(/plam[ay]\s+hematyn|hematynow|płask[aą]\s+plam|flat\s+(pigmented\s+)?spot/.test(s))
    return {cls:'IIc',inferred:true,note:'wnioskowane z plamy hematynowej / płaskiej plamy'};
  if(/czyste\s+dno|dno\s+czyste|clean\s+base/.test(s))
    return {cls:'III',inferred:true,note:'wnioskowane z czystego dna'};
  if(/pokryt[ey]\s+wł[oó]knikiem/.test(s) && !/naczyni|skrzep|krwawieni|stercz/.test(s))
    return {cls:'III',inferred:true,note:'wnioskowane z „pokryte włóknikiem” bez innych cech (zweryfikuj IIc = plama hematynowa vs III = czyste dno)'};
  if(/krwawieni[ea]\s+aktywn|aktywn[ey]\s+krwawieni/.test(s))
    return {cls:'Ib',inferred:true,note:'wnioskowane z „krwawienie aktywne” (nie określono tryskające vs sączące) — zweryfikuj Ia vs Ib'};
  return {cls:null,inferred:false,note:''};
}

function parseSize(s){
  if(!s)return null;
  var m=s.match(/[śs]rednic[yie]\s+(\d+(?:[.,]\d+)?)\s*(cm|mm|centymetr\w*)?/i);
  if(!m)m=s.match(/(\d+(?:[.,]\d+)?)\s*-\s*(cm|centymetr\w*)/i);
  if(!m)m=s.match(/(\d+(?:[.,]\d+)?)\s*(cm|mm|centymetr\w*)/i);
  if(!m)return null;
  var n=parseFloat(String(m[1]).replace(',','.'));
  if(!isFinite(n))return null;
  var u=(m[2]||'cm').toLowerCase();
  if(u.indexOf('mm')===0)n=n/10;
  return Math.round(n*100)/100;
}

function parseLoc(s){
  if(!s)return {loc:'',organ:'',posteriorBulb:false};
  var rules=[
    {re:/tyln[aey]\w*\s+[śs]cian\w*\s+opusz|opusz\w*\s+tyln|posterior\s+bulb/,loc:'tylna ściana opuszki dwunastnicy',organ:'dwunastnica',posteriorBulb:true},
    {re:/k[ąa]ci[eu]|k[ąa]t(?:cie)?\s+żołądka|na k[ąa]cie/,loc:'kąt żołądka',organ:'żołądek'},
    {re:/opuszc?\w*\s+dwunastnic|w opuszce|opuszka/,loc:'opuszka dwunastnicy',organ:'dwunastnica'},
    {re:/cz[ęe][śs][cć]\s+zst[ęe]puj[ąa]c/,loc:'część zstępująca dwunastnicy',organ:'dwunastnica'},
    {re:/antrum|od[źz]wiernik|prepylor|przedod[źz]wiernik/,loc:'antrum',organ:'żołądek'},
    {re:/trzon\w*\s+żołądka|w trzonie/,loc:'trzon żołądka',organ:'żołądek'},
    {re:/dnie żołądka|dno żołądka/,loc:'dno żołądka',organ:'żołądek'},
    {re:/wpust|cardia/,loc:'wpust',organ:'żołądek'},
    {re:/krzywi[zź]n\w*\s+mniejsz/,loc:'krzywizna mniejsza',organ:'żołądek'},
    {re:/krzywi[zź]n\w*\s+wi[ęe]ksz/,loc:'krzywizna większa',organ:'żołądek'},
    {re:/poł[ąa]czeni[ea]\s+przełykowo|geg|linii\s+z/,loc:'połączenie przełykowo-żołądkowe',organ:'przełyk'},
    {re:/przełyk/,loc:'przełyk',organ:'przełyk'},
    {re:/dwunastnic/,loc:'dwunastnica',organ:'dwunastnica'},
    {re:/żołądk/,loc:'żołądek',organ:'żołądek'}
  ];
  for(var i=0;i<rules.length;i++){
    if(rules[i].re.test(s))return {loc:rules[i].loc,organ:rules[i].organ,posteriorBulb:!!rules[i].posteriorBulb};
  }
  return {loc:'',organ:'',posteriorBulb:false};
}

function lesionType(word, ctx){
  var w=(word||'')+' '+(ctx||'');
  if(/mallory/.test(w))return 'Mallory-Weiss';
  if(/dieulafoy/.test(w))return 'Dieulafoy';
  if(/\bgave\b|watermelon|[żz]o[łl][aą]dek arbuz|ectasia/.test(w))return 'GAVE';
  if(/nowotw|[Bb]rak\b|\brakiem\b|guz\s+nowotw|carcinom|guzem\s+nowotw/.test(w))return 'nowotwór';
  if(/[żz]ylak/.test(w))return 'żylaki';
  if(/p[ęe]kni[ęe]ci|rozdarcie|rozdarciem/.test(w))return /mallory/.test(w)?'Mallory-Weiss':'pęknięcie';
  if(/owrzodzeni|wrz[oó]d/.test(w))return 'owrzodzenie';
  return 'inna zmiana';
}

function isNewLesion(text, idx){
  var before=text.slice(Math.max(0,idx-60),idx);
  if(/(centraln\w*\s+cz[ęe][śs]c[i]\s+|cz[ęe][śs]c[i]\s+|dnie\s+|brzegu\s+|okolic[yia]\s+|[śs]rodku\s+|podstawie\s+|dnie\s+tego\s+)$/.test(before))return false;
  if(/(tego|niniejszego|owego|wspomnianego|opisanego|ww\.)\s+$/.test(before))return false;
  if(/ostrzykni[ęe]ci[ea]m?\s+$/.test(before))return false;
  if(/(na\s+koniec(\s+zabiegu)?|koniec\s+zabiegu|zabiegu)\s+$/.test(before))return false;
  if(/(pokryto|skoagulowano|ostrzykni[ęe]to|zaopatrzono|koagulacj[ąa]\s+)$/.test(before))return false;
  // "bez zmian" nearby — "część zstępująca dwunastnicy bez zmian" should not create a lesion; handled if no lesion word
  return true;
}

function parseHemostasis(s){
  var methods=[], notes=[];
  if(!s)return {methods:methods,powder:false,notes:notes,apc:0,adrenaline:false,clips:false,thermal:false,ligation:false};
  var apc=0;
  var apcRe=/plazm[yia]\s+argonow|koagulacj[aąę]\s+w\s+osłonie\s+plazmy|\bapc\b|argonow[aą]\s+plazm|argon\s+plasma/g;
  var mm;while((mm=apcRe.exec(s)))apc++;
  if(apc){methods.push(apc>1?'APC (×'+apc+')':'APC');}
  if(/adrenalin|epinefry|ostrzykni[ęe]/.test(s) && /adrenalin|epinefry/.test(s)){
    methods.push('ostrzyknięcie adrenaliną');
  }
  if(/klips|clip|klipowan|klamr/.test(s))methods.push('klipsy');
  if(/sond[ay]\s+termiczn|heat\s*probe|koagulacj[aą]\s+bipolar|elektrokoagul|termiczn/.test(s) && !/plazm/.test(s.match(/termiczn.{0,20}/)||[''])[0]){
    /* thermal other than APC */
    if(/sond[ay]\s+termiczn|heat\s*probe|koagulacj[aą]\s+bipolar|elektrokoagul/.test(s))methods.push('koagulacja termiczna');
  }
  var powder=/proszk\w*\s+hemostat|hemospray|tc[\s-]?325|tc325/.test(s);
  if(powder)methods.push('proszek hemostatyczny (TC-325/Hemospray)');
  if(/ligacj|opaskowan|podwi[ąa]zan|gumk[ąaie]|banding/.test(s))methods.push('ligacja / opaskowanie');
  return {methods:methods,powder:powder,notes:notes,apc:apc,adrenaline:/adrenalin|epinefry/.test(s),clips:/klips|clip|klipowan/.test(s),thermal:/sond[ay]\s+termiczn|heat\s*probe|koagulacj[aą]\s+bipolar/.test(s),ligation:/ligacj|opaskowan|podwi[ąa]zan|banding/.test(s)};
}

function parseBleeding(s){
  var intra=null, controlled=null, finalH=null;
  if(!s)return {intra:null,controlled:null,finalHemostasis:null};
  if(/nie\s+uzyskan\w*\s+hemostaz|hemostaz\w*\s+nie\s+uzysk|krwawieni[ea]\s+nie\s+opanowan|nie\s+opanowan\w*\s+(krwawieni|krwotok)|krwawieni[ea]\s+utrzymuj/i.test(s)){
    finalH='no';controlled='no';
  }
  if(/w\s+trakcie[^.]*krwawieni|obserwowan\w*\s+(niewielkie\s+)?krwawieni|krwawieni[ea]\s+[śs]r[oó]dzabieg/.test(s)){
    intra='yes';
  }
  if(/kt[oó]re\s+opanowan|opanowan\w*\s+(ostrzyk|koagul|klips|krwaw)|krwawieni[ea]\s+opanowan/.test(s)){
    controlled='yes';
  }
  if(/krwawieni[ea]\s+nie\s+obserwowan|nie\s+obserwowan\w*\s+krwawie|hemostaz[aę]\s+(skuteczn|uzyskan|pe[łl]n)|uzyskan\w*\s+hemostaz|bez\s+krwawienia\s+na\s+koniec/.test(s)){
    if(finalH!=='no')finalH='yes';
  }
  if(intra==='yes'&&controlled===null&&finalH==='yes')controlled='yes';
  return {intra:intra,controlled:controlled,finalHemostasis:finalH};
}

function extractFindings(s){
  var f=[];
  if(/żołądek zapalny|zapaleni[ea]\s+żołądka|gastritis/.test(s))f.push('zapalenie żołądka');
  if(/jeziorko\s+[śs]luzowe/.test(s)){
    var m=s.match(/jeziorko\s+[śs]luzowe\s+([^.]{0,40})/);
    f.push('jeziorko śluzowe'+(m?' '+m[1].replace(/\s+na kącie.*$/,'').trim():''));
  }
  if(/przełyk\s+bez\s+zmian/.test(s))f.push('przełyk bez zmian');
  if(/zst[ęe]puj[ąa]c\w*\s+dwunastnicy\s+bez\s+zmian|cz[ęe][śs][cć]\s+zst[ęe]puj[ąa]c\w*\s+dwunastnicy\s+bez\s+zmian/.test(s))f.push('część zstępująca dwunastnicy bez zmian');
  if(/sprawnej\s+motoryce/.test(s))f.push('sprawna motoryka żołądka');
  if(/podatn\w+\s+na\s+insuflacj/.test(s))f.push('żołądek podatny na insuflację');
  return f;
}

function emptyResult(raw, norm){
  return {
    raw:raw||'',normalized:norm||'',lesions:[],hemostasis:{methods:[],powder:false,apc:0,adrenaline:false,clips:false,thermal:false,ligation:false},
    intraProceduralBleeding:null,intraControlled:null,finalHemostasis:null,
    varices:false,findings:[],notes:[],worstForrest:null,worstRank:0,risk:null
  };
}

function parse(text){
  var raw=String(text||'');
  var s=normalize(raw);
  var out=emptyResult(raw,s);
  if(!s)return out;
  out.findings=extractFindings(s);
  out.varices=/[żz]ylak|varices|nadci[śs]nieni[ea]\s+wrotn|portal\s+hypert/i.test(s);

  var re=/owrzodzeni[eaóń]|wrz[oó]d(?:em|owi|y|ów|zie)?\b|[żz]ylak\w*|mallory(?:\s*-?\s*weiss)?|dieulafoy|\bgave\b|watermelon|nowotw[oó]r\w*|\bguz(?:em|owi|a)?\s+nowotw|p[ęe]kni[ęe]ci[ea]|rozdarci[ea]/gi;
  var anchors=[],m;
  while((m=re.exec(s))){
    if(m.index>0 && /[a-ząćęłńóśźż]/i.test(s.charAt(m.index-1)))continue;
    if(!isNewLesion(s,m.index))continue;
    var before=s.slice(Math.max(0,m.index-30),m.index);
    if(/\bbez\s+$/.test(before) || /\bbrak\s+$/.test(before) || /nie\s+stwierdzon\w*\s+$/.test(before) || /nie\s+widoczn\w*\s+$/.test(before))continue;
    var winAround=s.slice(Math.max(0,m.index-15), Math.min(s.length,m.index+40));
    if(/bez\s+zmian/.test(winAround)&&!/obecne|widoczn|stwierdz/.test(winAround))continue;
    anchors.push({index:m.index,word:m[0],len:m[0].length});
  }

  for(var i=0;i<anchors.length;i++){
    var a=anchors[i];
    var start=Math.max(0,a.index-90);
    var end=i+1<anchors.length?anchors[i+1].index:s.length;
    // location often just before the lesion word
    var locWin=s.slice(start,a.index+a.len);
    var body=s.slice(a.index,end);
    var window=s.slice(start,end);
    var loc=parseLoc(locWin)||parseLoc(window);
    // If this lesion window is a "bez zmian" negative statement with no actual pathology verb, skip
    if(/bez\s+zmian/.test(body.slice(0,50)) && !/obecne|widoczn|stwierdz|owrzodzeni|wrz[oó]d|[żz]ylak/.test(body.slice(0,60)))continue;
    var fr=findForrest(body);
    var inf=(!fr.cls)?inferForrest(body):{cls:null,inferred:false,note:''};
    var cls=fr.cls||inf.cls||null;
    var size=parseSize(body.slice(0,120))||parseSize(window);
    var type=lesionType(a.word,body.slice(0,80));
    var hem=parseHemostasis(body);
    // "na koniec zabiegu ... proszkiem" may sit in this body
    var L={
      organ:loc.organ||'',location:loc.loc||'',type:type,sizeCm:size,
      forrest:cls,forrestExplicit:!!fr.explicit,forrestInferred:!!inf.inferred && !fr.explicit,
      forrestNote:fr.explicit?'':(inf.note||''),
      hemostasis:hem.methods.slice(),powder:hem.powder,
      posteriorBulb:!!loc.posteriorBulb,
      large:size!=null && size>=1.5,
      rawSnippet:body.slice(0,280)
    };
    out.lesions.push(L);
  }

  // Global hemostasis (whole text) — methods across all segments
  var H=parseHemostasis(s);
  out.hemostasis=H;
  var B=parseBleeding(s);
  out.intraProceduralBleeding=B.intra;
  out.intraControlled=B.controlled;
  out.finalHemostasis=B.finalHemostasis;

  // If high-risk treated and final unknown but "krwawienia nie obserwowano"
  if(!out.finalHemostasis && H.methods.length && B.intra==='yes' && B.controlled==='yes')
    out.finalHemostasis='uncertain';

  // Worst lesion
  var worst=null,wr=0;
  out.lesions.forEach(function(L){
    var r=RANK[L.forrest]||0;
    if(r>wr){wr=r;worst=L.forrest;}
  });
  out.worstForrest=worst;
  out.worstRank=wr;
  if(out.varices && out.lesions.some(function(L){return L.type==='żylaki';}))out.risk='variceal';
  else if(HIGH[worst])out.risk='high';
  else if(worst)out.risk='low';
  else out.risk=out.lesions.length?'unknown':(s?'none':'empty');

  // Don't invent lesions from findings only
  return out;
}

function fromFields(v){
  v=v||{};
  var out=emptyResult(v.gastro||'',normalize(v.gastro||''));
  out.findings=extractFindings(out.normalized);
  var methods=[];
  if(v.gi_apc)methods.push('APC');
  if(v.gi_adr)methods.push('ostrzyknięcie adrenaliną');
  if(v.gi_clip)methods.push('klipsy');
  if(v.gi_therm)methods.push('koagulacja termiczna');
  if(v.gi_powder)methods.push('proszek hemostatyczny (TC-325/Hemospray)');
  if(v.gi_lig)methods.push('ligacja / opaskowanie');
  out.hemostasis={methods:methods,powder:!!v.gi_powder,apc:v.gi_apc?1:0,adrenaline:!!v.gi_adr,clips:!!v.gi_clip,thermal:!!v.gi_therm,ligation:!!v.gi_lig};
  function yn(x){return x==='yes'||x==='no'||x==='uncertain'?x:null;}
  out.intraProceduralBleeding=yn(v.gi_intra);
  out.intraControlled=yn(v.gi_ctrl);
  out.finalHemostasis=yn(v.gi_final);
  out.varices=!!v.gi_varices;
  for(var i=0;i<4;i++){
    var type=v['gi_type'+i]||'';
    var loc=v['gi_loc'+i]||'';
    var sizeRaw=v['gi_size'+i];
    var fr=v['gi_forrest'+i]||'';
    var sizeNum=null;
    if(sizeRaw!=null && String(sizeRaw).trim()!=='' && String(sizeRaw)!=='NaN'){
      var nn=parseFloat(String(sizeRaw).replace(',','.'));
      if(isFinite(nn))sizeNum=nn;
    }
    if(!type && !loc && !fr && sizeNum==null)continue;
    var size=sizeNum;
    var organ='';
    var low=(loc+' '+type).toLowerCase();
    if(/dwunast|opusz/.test(low))organ='dwunastnica';
    else if(/przełyk|mallory/.test(low))organ='przełyk';
    else if(/żołąd|kat |kąt/.test(low))organ='żołądek';
    var L={organ:organ,location:loc,type:type||'inna zmiana',sizeCm:size,forrest:normForrest(fr)||fr||null,
      forrestExplicit:!!fr,forrestInferred:false,forrestNote:'',hemostasis:[],powder:!!v.gi_powder,
      posteriorBulb:/tyln/.test(low)&&/opusz/.test(low),large:size!=null&&size>=1.5,rawSnippet:''};
    out.lesions.push(L);
  }
  var worst=null,wr=0;
  out.lesions.forEach(function(L){var r=RANK[L.forrest]||0;if(r>wr){wr=r;worst=L.forrest;}});
  out.worstForrest=worst;out.worstRank=wr;
  if(out.varices||out.lesions.some(function(L){return L.type==='żylaki';}))out.risk='variceal';
  else if(HIGH[worst])out.risk='high';
  else if(worst)out.risk='low';
  else out.risk=out.lesions.length?'unknown':'none';
  return out;
}

function merge(parsed, edited){
  // If edited has any lesion or explicit hemostasis flags, prefer edited lesions/hemostasis; keep raw from parsed.
  if(!edited || (!edited.lesions.length && !edited.hemostasis.methods.length && !edited.finalHemostasis && !edited.varices))
    return parsed;
  var o={};
  for(var k in parsed)o[k]=parsed[k];
  o.lesions=edited.lesions.length?edited.lesions:parsed.lesions;
  if(edited.hemostasis.methods.length)o.hemostasis=edited.hemostasis;
  if(edited.intraProceduralBleeding)o.intraProceduralBleeding=edited.intraProceduralBleeding;
  if(edited.intraControlled)o.intraControlled=edited.intraControlled;
  if(edited.finalHemostasis)o.finalHemostasis=edited.finalHemostasis;
  if(edited.varices)o.varices=true;
  var worst=null,wr=0;
  o.lesions.forEach(function(L){var r=RANK[L.forrest]||0;if(r>wr){wr=r;worst=L.forrest;}});
  o.worstForrest=worst;o.worstRank=wr;
  if(o.varices||o.lesions.some(function(L){return L.type==='żylaki';}))o.risk='variceal';
  else if(HIGH[worst])o.risk='high';
  else if(worst)o.risk='low';
  else o.risk=o.lesions.length?'unknown':(o.normalized?'none':'empty');
  return o;
}

function fmtSize(n){
  if(n==null||!isFinite(n))return '';
  return String(Math.round(n*100)/100).replace('.',',');
}

function lesionLine(L,i){
  var bits=[];
  bits.push((i+1)+'. '+(L.type||'zmiana'));
  if(L.location)bits.push(L.location);
  else if(L.organ)bits.push(L.organ);
  if(L.sizeCm!=null)bits.push(fmtSize(L.sizeCm)+' cm');
  if(L.forrest)bits.push('Forrest '+L.forrest+(L.forrestInferred?' (wnioskowane'+(L.forrestNote?': '+L.forrestNote:'')+')':''));
  else bits.push('Forrest nieokreślony (nie wymyślono klasy — brak danych w opisie)');
  return bits.join(', ');
}

function icdSuggestions(p){
  var lines=[], seen={};
  function add(code,txt){if(seen[code])return;seen[code]=1;lines.push(code+' — '+txt);}
  p.lesions.forEach(function(L){
    var org=L.organ||'';
    var loc=(L.location||'').toLowerCase();
    if(L.type==='żylaki'){add('I85.0','żylaki przełyku z krwawieniem (jeśli potwierdzone żylaki przełyku — zweryfikuj kod); nie koduj zgadywania');return;}
    if(L.type==='Mallory-Weiss'){add('K22.6','zespół Mallory’ego-Weissa');return;}
    if(org==='dwunastnica'||/opusz|dwunast/.test(loc)){
      add('K26.0','wrzód dwunastnicy, ostry, z krwawieniem');
      add('K26.4','wrzód dwunastnicy, nieokreślony jako ostry lub przewlekły, z krwawieniem — nie zakładaj przewlekłości, nie koduj zgadywania');
    }else if(org==='żołądek'||/żołąd|kąt|trzon|antrum|dno|wpust/.test(loc)){
      add('K25.0','wrzód żołądka, ostry, z krwawieniem');
      add('K25.4','wrzód żołądka, nieokreślony jako ostry lub przewlekły, z krwawieniem — nie zakładaj przewlekłości, nie koduj zgadywania');
    }else if(L.type==='nowotwór'){
      add('(kod nowotworu)','lokalizacja i morfologia — nie koduj zgadywania; dobierz kod po weryfikacji');
    }
  });
  if(!lines.length && p.findings.some(function(x){return /zapalenie/.test(x);}))
    add('K29','zapalenie żołądka / dwunastnicy — dobierz podkategorię; krwawienie tylko jeśli potwierdzone, nie koduj zgadywania');
  if(!lines.length)return 'ICD-10: brak propozycji bez potwierdzonej zmiany — nie koduj zgadywania.';
  return 'Propozycje ICD-10 (do weryfikacji, nie koduj zgadywania; ostrości/przewlekłości nie zakładano):\n'+lines.map(function(x){return '  — '+x;}).join('\n');
}

function plan(parsed, ctx){
  ctx=ctx||{};
  var p=parsed||emptyResult('','');
  var flags=[];
  var variceal=!!(p.varices || (ctx.varicesSuspect) || (p.lesions||[]).some(function(L){return L.type==='żylaki';}));
  var worst=p.worstForrest;
  var high=!!HIGH[worst];
  // IIb after clot treatment: if IIb is worst and hemostasis performed, still high-dose (underlying stigmata or ESGE: FIIb not treated also gets high-dose)
  var finalH=p.finalHemostasis; // yes/no/uncertain/null
  var pathway, lvl='ok';
  if(variceal && (p.risk==='variceal' || !high || ctx.varicesSuspect && !p.lesions.length || p.lesions.some(function(L){return L.type==='żylaki';}))){
    // If concurrent high-risk ulcer AND varices, variceal is main therapy
    pathway='variceal';lvl='red';
  }
  if(!pathway){
    if(high){
      pathway=(finalH==='no')?'high-fail':'high';
      lvl='red';
    }else if(worst==='IIc'||worst==='III'){pathway='low';lvl='ok';}
    else if(!p.lesions.length){pathway=p.normalized?'normal':'pre';lvl='ok';}
    else {pathway='unknown';lvl='orange';}
  }
  // If varices AND high-risk ulcer: keep variceal as main, add note
  if(variceal){pathway='variceal';lvl='red';}

  var ppiText='';
  if(pathway==='variceal'){
    ppiText='Ścieżka żylakowa / nadciśnienie wrotne — PPI we wlewie 72 h NIE jest leczeniem podstawowym.\n'+
      'Leczenie podstawowe: terlipresyna (dawka wg masy — zakładka Leczenie / ChPL Glypressin: <50 kg 1 mg, 50–70 kg 1,5 mg, >70 kg 2 mg co 4 h; Baveno VII: 2 mg co 4 h, po kontroli 1 mg co 4 h, 2–5 dni) oraz antybiotyk: ceftriakson 1 g i.v. co 24 h (Baveno VII).\n'+
      'Oktreotyd: receptura i dawki wyłącznie w module Pompy SOR (lek zatwierdzony lokalnie) — nie powielam tu dawek.\n'+
      'Endoskopia (ligacja) w trybie pilnym (≤12 h).';
    if(high)ppiText+='\nStwierdzono także zmianę nieżylakową o cechach wysokiego ryzyka (Forrest '+(worst||'?')+'). PPI wysokodawkowy można rozważyć jako leczenie uzupełniające zmiany nieżylakowej, ale nie zastępuje terlipresyny, antybiotyku i leczenia żylaków.';
  }else if(pathway==='high'||pathway==='high-fail'){
    ppiText=ppiHighDosePlain(worst, finalH||'uncertain');
  }else if(pathway==='low'){
    ppiText=ppiLowDosePlain();
  }else if(pathway==='normal'){
    ppiText='Opis bez zmian krwotocznych (lub wyłącznie zmiany nienaczyniowe, np. zapalenie, jeziorko śluzowe). Wlew 72-godzinny pantoprazolu nie jest wskazany. Dalsze postępowanie wg obrazu klinicznego i skali Glasgow-Blatchford. '+ppiPreEndoPlain().replace(/^Brak wklejonego[^.]+\.\s*/,'Jeśli nadal podejrzenie krwawienia klinicznie: ');
  }else if(pathway==='pre'){
    ppiText=ppiPreEndoPlain();
  }else{
    ppiText='Nie udało się jednoznacznie określić klasy Forrest. Nie wymyślono dawek wysokodawkowych. Rozważ bolus 80 mg i.v. i skoryguj odczyt (klasa Forrest) w podsumowaniu — wtedy plan zostanie przeliczony. '+ppiPreEndoPlain();
  }

  if(p.hemostasis && p.hemostasis.powder){
    flags.push('powder');
  }
  (p.lesions||[]).forEach(function(L){
    if(L.sizeCm!=null && L.sizeCm>=1.5 && (L.organ==='dwunastnica'||/opusz|dwunast/.test(L.location||'')))
      flags.push('large-duodenal');
    if(L.sizeCm!=null && L.sizeCm>=2)flags.push('large-ulcer');
    if(L.posteriorBulb)flags.push('posterior-bulb');
  });

  var blocks=[];
  // summary
  var sum=[];
  if(p.lesions.length){
    p.lesions.forEach(function(L,i){sum.push(lesionLine(L,i));});
  }else if(p.normalized){
    sum.push('Nie odczytano zmian krwotocznych (owrzodzenie / żylaki / Mallory-Weiss / Dieulafoy / GAVE / nowotwór). Nie wymyślono findings nieobecnych w tekście.');
  }else{
    sum.push('Brak wklejonego opisu.');
  }
  if(p.findings.length)sum.push('Inne spostrzeżenia (nie są zmianami Forrest): '+p.findings.join('; ')+'.');
  if(p.hemostasis.methods.length)sum.push('Hemostaza endoskopowa: '+p.hemostasis.methods.join(', ')+'.');
  else if(p.lesions.length)sum.push('Hemostaza endoskopowa: nie odczytano (nie wymyślono).');
  function ynPl(x,unk){return x==='yes'?'tak':x==='no'?'nie':(unk||'nie określono');}
  if(p.intraProceduralBleeding)sum.push('Krwawienie śródzabiegowe: '+ynPl(p.intraProceduralBleeding)+', opanowane: '+ynPl(p.intraControlled)+'.');
  if(p.finalHemostasis)sum.push('Hemostaza końcowa: '+ynPl(p.finalHemostasis,'niepewna')+'.');
  else if(p.lesions.length)sum.push('Hemostaza końcowa: nieokreślona.');
  sum.push('Ryzyko ogółem (najgorsza zmiana): '+(worst?('Forrest '+worst+(high?' — wysokie':' — niskie')):(variceal?'żylaki / nadciśnienie wrotne':(p.lesions.length?'nieokreślone':'brak zmian krwotocznych')))+'.');

  var advice=[];
  if(p.hemostasis.powder){
    advice.push('Proszek hemostatyczny (TC-325/Hemospray) jest metodą tymczasową / pomostową (ESGE 2021): wyższe ryzyko ponownego krwawienia. Zwiększona czujność. Rozważ terapię definitywną (klips / metoda termiczna) — proszek nie zastępuje trwałej hemostazy.');
  }
  if(flags.indexOf('large-duodenal')>=0 || flags.indexOf('posterior-bulb')>=0 || flags.indexOf('large-ulcer')>=0){
    var det=[];
    (p.lesions||[]).forEach(function(L){
      if(L.sizeCm!=null && L.sizeCm>=1.5 && (L.organ==='dwunastnica'||/opusz|dwunast/.test(L.location||'')))
        det.push('owrzodzenie dwunastnicy '+fmtSize(L.sizeCm)+' cm (próg ≥1,5–2 cm)');
      else if(L.sizeCm!=null && L.sizeCm>=2)
        det.push((L.location||L.organ||'owrzodzenie')+' '+fmtSize(L.sizeCm)+' cm');
      if(L.posteriorBulb)det.push('tylna ściana opuszki (wyższe ryzyko krwawienia z tętnicy żołądkowo-dwunastniczej)');
    });
    advice.push('Wyższe ryzyko ponownego krwawienia: '+(det.join('; ')||'duże owrzodzenie / tylna opuszka')+' — czujność, niski próg ponownej endoskopii (ESGE 2021).');
  }
  if(pathway==='high-fail'){
    advice.push('Hemostaza endoskopowa nieuzyskana lub niepewna przy cechach wysokiego ryzyka: powtórna endoskopia, a przy niepowodzeniu — embolizacja przezcewnikowa (TAE); chirurgia, gdy TAE niedostępna lub nieskuteczna (ESGE 2021, ACG 2021). Kontynuuj wysokodawkowy PPI.');
    lvl='red';
  }
  advice.push('H. pylori: test w endoskopii indeksowej (biopsja). W trakcie krwawienia częste wyniki fałszywie ujemne — jeśli test ujemny, powtórz w ciągu 4 tygodni po krwawieniu (ESGE 2021). Alternatywa: serologia, gdy biopsji nie pobrano. Dodatni wynik → eradykacja i potwierdzenie eradykacji.');
  advice.push('Leki: przegląd NLPZ, leków przeciwpłytkowych i antykoagulantów. NLPZ odstaw. ASA w prewencji wtórnej: nie przerywać rutynowo; jeśli przerwano — wznowić wcześnie po uzyskaniu hemostazy (ACG 2021: zwykle 1.–3. doba). P2Y12 i antykoagulacja: wznowienie indywidualnie wg ryzyka zakrzepowego vs krwotocznego (konsultacja kardiologiczna / prowadzącego; ESGE 2021, ACG 2021, Barkun 2019).');
  advice.push('Nie wykonuj rutynowo endoskopii second-look u pacjenta bez cech ponownego krwawienia (ESGE 2021). Przy rebleeding: powtórna endoskopia; jeśli nieskuteczna — TAE, a przy braku TAE lub jej niepowodzeniu — chirurgia.');
  var hbTxt='Próg przetoczenia KKCz: Hb 7 g/dl (8 g/dl przy chorobie sercowo-naczyniowej) — ACG 2021, ESGE 2021, Barkun 2019. Nie stosuj progu „docelowe ≥10 g/dl” jako standardu.';
  if(ctx.cardiac)hbTxt+=' U tego pacjenta zaznaczono chorobę wieńcową / sercowo-naczyniową: próg 8 g/dl.';
  if(isFinite(ctx.hb))hbTxt+=' Aktualne Hb: '+String(ctx.hb).replace('.',',')+' g/dl.';
  advice.push(hbTxt);
  if(pathway==='low'){
    advice.push('Dieta: wczesne żywienie po endoskopii (ESGE 2021, ACG 2021).');
    if(ctx.gbs!=null && ctx.gbs<=1)advice.push('Glasgow-Blatchford '+ctx.gbs+' (≤1): można rozważyć wypis i endoskopię ambulatoryjną, jeśli stan kliniczny na to pozwala (ACG 2021).');
    else if(ctx.gbs!=null)advice.push('Glasgow-Blatchford '+ctx.gbs+' (>1): hospitalizacja.');
  }else if(pathway==='high'||pathway==='high-fail'){
    advice.push('Dieta: po uzyskanej hemostazie można szybko rozpocząć płyny przezroczyste, następnie dietę (ESGE 2021). Monitorowanie: hemodynamiczne, kontrola Hb, objawy rebleeding, diureza; rozważ intensywny nadzór przez 72 h wysokodawkowego PPI.');
  }else{
    advice.push('Dieta i monitorowanie wg stanu klinicznego.');
  }
  if(ctx.gbs!=null && pathway!=='low'){
    advice.push('Glasgow-Blatchford: '+ctx.gbs+(ctx.gbs<=1?' (niskie ryzyko skalą, ale postępowanie podporządkuj wynikowi endoskopii i stanowi klinicznemu).':' (hospitalizacja).'));
  }
  advice.push('Kwas traneksamowy — niezalecany (HALT-IT).');
  advice.push(icdSuggestions(p));
  advice.push('Źródła: ESGE 2021 (Gralnek i wsp.), ACG 2021 (Laine i wsp.), konsensus międzynarodowy 2019 (Barkun i wsp.), ChPL pantoprazolu / standard lokalny Pompy SOR, Baveno VII 2022 (ścieżka żylakowa).');

  var epik=[];
  epik.push('WYNIK GASTROSKOPII (opis wklejony):');
  epik.push(p.raw?p.raw.trim():'(brak)');
  epik.push('');
  epik.push('ODCZYT AUTOMATYCZNY (do weryfikacji lekarza, parser deterministyczny — bez AI):');
  epik.push(sum.join('\n'));
  epik.push('');
  epik.push('PLAN LECZENIA — PANTOPRAZOL / HEMOSTAZA:');
  epik.push(ppiText);
  epik.push('');
  epik.push('ZALECENIA:');
  advice.forEach(function(a){epik.push('— '+a);});
  if(ctx.gbs!=null){epik.push('');epik.push('Glasgow-Blatchford: '+ctx.gbs+(ctx.gbsLow?' (niskie ryzyko ≤1)':''));}

  var zal=[];
  zal.push(ppiText);
  advice.forEach(function(a){zal.push('— '+a);});

  return {
    pathway:pathway,lvl:lvl,risk:p.risk,worstForrest:worst,high:high,variceal:variceal,
    flags:flags.filter(function(x,i,a){return a.indexOf(x)===i;}),
    summaryLines:sum, summaryText:sum.join('\n'),
    ppiText:ppiText, advice:advice,
    planText:ppiText+'\n\n'+advice.join('\n'),
    zalecenia:zal.join('\n\n'),
    epikryza:epik.join('\n'),
    pump:pumpLocal(),
    sources:SRC,
    parsed:p
  };
}

function summaryEditableDefaults(p){
  var o={gi_apc:false,gi_adr:false,gi_clip:false,gi_therm:false,gi_powder:false,gi_lig:false,
    gi_intra:'',gi_ctrl:'',gi_final:'',gi_varices:false};
  for(var i=0;i<4;i++){o['gi_type'+i]='';o['gi_loc'+i]='';o['gi_size'+i]='';o['gi_forrest'+i]='';}
  if(!p)return o;
  (p.lesions||[]).slice(0,4).forEach(function(L,i){
    o['gi_type'+i]=L.type||'';
    o['gi_loc'+i]=L.location||L.organ||'';
    o['gi_size'+i]=L.sizeCm!=null?fmtSize(L.sizeCm):'';
    o['gi_forrest'+i]=L.forrest||'';
  });
  var H=p.hemostasis||{};
  o.gi_apc=!!H.apc||(H.methods||[]).some(function(x){return /APC/.test(x);});
  o.gi_adr=!!H.adrenaline;
  o.gi_clip=!!H.clips;
  o.gi_therm=!!H.thermal;
  o.gi_powder=!!H.powder;
  o.gi_lig=!!H.ligation;
  o.gi_intra=p.intraProceduralBleeding||'';
  o.gi_ctrl=p.intraControlled||'';
  o.gi_final=p.finalHemostasis||'';
  o.gi_varices=!!p.varices||(p.lesions||[]).some(function(L){return L.type==='żylaki';});
  return o;
}

return {
  parse:parse, fromFields:fromFields, merge:merge, plan:plan,
  normalize:normalize, findForrest:findForrest, inferForrest:inferForrest,
  parseSize:parseSize, pumpLocal:pumpLocal, pumpMath:pumpLocal,
  ppiHighDosePlain:ppiHighDosePlain, ppiLowDosePlain:ppiLowDosePlain, ppiPreEndoPlain:ppiPreEndoPlain,
  summaryEditableDefaults:summaryEditableDefaults,
  RANK:RANK, SRC:SRC, SOURCES:SRC,
  CLEAN:CLEAN, DICTATION:DICTATION, EXAMPLES:{clean:CLEAN,dictation:DICTATION},
  icdSuggestions:icdSuggestions, lesionLine:lesionLine, fmtSize:fmtSize
};
});
