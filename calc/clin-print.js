// fix20: wydruk modułów Ostra niewydolność serca, Zapalenie płuc, Zatrucia – WYŁĄCZNIE pozycje wypełnione / zaznaczone przez lekarza,
// wyliczone dawki i pompy (gdy policzone), skale z kompletu danych, WNIOSKI wg logiki modułu. Bez list rozwijanych, akapitów ChPL, źródeł,
// tekstów dydaktycznych. Odpowiedzi NIE nie są drukowane (wyjątek: udokumentowana ocena przeciwwskazań do leku). Dawki liczą istniejące silniki.
(function(r,f){var m=f();if(typeof module==='object'&&module.exports)module.exports=m;else{r.SK=r.SK||{};r.SK.clinPrint=m;}})(this,function(){
'use strict';
var fin=Number.isFinite;
function I(x){return fin(x)?String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g,' '):'—';}
function D(x,d){if(!fin(x))return '—';var s=(+x.toFixed(d==null?2:d)).toString();return s.replace('.',',');}
function noop(){return undefined;}
function tab(T,id){var t=T&&T[id];return t&&typeof t.g==='function'?t:{g:noop,touched:0,current:false,printed:false};}
function inc(t){return !!(t.touched>0||t.current||t.printed);}
function Doc(){var L=[],C=[];return{L:L,C:C,
  head:function(h){if(L.length)L.push('');L.push(h);},
  line:function(l,x){if(x!=null&&String(x).trim()!=='')L.push(l?l+': '+x:String(x));},
  yes:function(g,list){return list.filter(function(x){return g(x[0])===true;}).map(function(x){return x[1];});},
  vals:function(g,list){return list.filter(function(x){return fin(g(x[0]));}).map(function(x){return x[1]+' '+(x[3]?x[3](g(x[0])):D(g(x[0]),x[2]==null?1:x[2]))+(x[4]?(/^[%\/]/.test(x[4])?'':' ')+x[4]:'');}).join(', ');},
  done:function(fallback){if(!L.length)return '';if(!C.length&&fallback)C.push(fallback);if(C.length){L.push('');L.push('WNIOSKI:');C.forEach(function(c){L.push('– '+c);});}return L.join('\n');}};}
var TOX_TEL='konsultacja toksykologiczna – Kraków 12 411 99 99 (całodobowo)';
// ================= OSTRA NIEWYDOLNOŚĆ SERCA =================
function ahf(o){var P=o.P||{},T=o.tabs||{},d=Doc(),dose=false,rev=false,t=tab(T,'assessment'),g=t.g;
  if(t.touched>0){
    var alarm=g('sbp')<90||g('hypo')===true||g('sat')<90;
    d.head('OCENA – DEKOMPENSACJA NIEWYDOLNOŚCI SERCA');
    d.line('Parametry',d.vals(g,[['sbp','SBP',0,I,'mmHg'],['sat','SpO₂',0,I,'%'],['rr','oddechy',0,I,'/min'],['lactate','mleczany',1,null,'mmol/l']]));
    var y=d.yes(g,[['congest','zastój / przewodnienie'],['hypo','objawy hipoperfuzji'],['naive','dotąd bez diuretyku pętlowego']]);
    if(g('naive')===false&&g('oral')>0)y.push('przewlekle furosemid p.o. '+I(g('oral'))+' mg/d');
    d.line('Stwierdzono',y.join(', '));
    var f=g('naive')===true?{lo:20,hi:40}:g('naive')===false&&g('oral')>0?{lo:g('oral'),hi:2*g('oral')}:null;
    if(f&&g('congest')===true){dose=true;d.head('LECZENIE');d.line('Furosemid i.v.',I(f.lo)+'–'+I(f.hi)+' mg i.v. '+(g('naive')===true?'(bez wcześniejszego diuretyku)':'(1–2 × znana dobowa dawka p.o.)')+' – konkretną dawkę wybiera lekarz');d.line('Kontrola po diuretyku','diureza, RR, kreatynina, Na/K/Mg; ocena odpowiedzi przed kolejną dawką');}
    if(fin(g('ntg'))&&g('ntg')>0){
      if(!dose)d.head('LECZENIE');
      if(g('sbp')>110&&g('pde')===false){dose=true;var mlh=g('ntg')*60/1000;
        d.line('Nitrogliceryna – pompa','50 mg leku w objętości końcowej 50 ml (stężenie 1 mg/ml = 1000 µg/ml); dawka '+D(g('ntg'),1)+' µg/min → '+D(mlh,2)+' ml/h; bez bolusa; rozcieńczalnik i zestaw wg ChPL używanego preparatu');
        d.line('Przeciwwskazania (ocena lekarza)','bez PDE-5 / riocyguatu ani innego przeciwwskazania do azotanów; SBP '+I(g('sbp'))+' mmHg (>110)');
        d.line('Monitorowanie nitrogliceryny','RR, ból, rytm i odpowiedź; wstrzymać przy hipotensji');
      }else d.line('Nitrogliceryna '+D(g('ntg'),1)+' µg/min','nie wyliczono – '+(g('pde')===true?'PRZECIWWSKAZANIE DO AZOTANÓW (PDE-5 / riocyguat)':!(g('sbp')>110)?'wymagane SBP >110 mmHg':'nie oceniono przeciwwskazań do azotanów'));
    }else if(g('pde')===true)d.line('Przeciwwskazanie','PDE-5 / riocyguat – azotany przeciwwskazane');
    if(g('review')===true){rev=true;d.line('','☑ Lekarz potwierdził sprawdzenie wskazania, przeciwwskazań, preparatu i obliczeń.');}
    if(alarm)d.C.push('HOSPITALIZACJA BEZWZGLĘDNA – '+[g('sbp')<90?'hipotensja':'',g('hypo')===true?'hipoperfuzja':'',g('sat')<90?'hipoksemia':''].filter(Boolean).join(', ')+': monitorowany obszar, pilna ocena przyczyny i eskalacji wsparcia.');
    if(g('sat')<90)d.C.push('Wsparcie oddechu: tlen przy SpO₂ <90%; przy RR >25/min rozważ wczesne NIV; narastająca niewydolność mimo wsparcia – ocena intubacji.');
    if(dose)d.C.push('Leczenie wg wyliczeń powyżej – decyzja lekarza.');
    if(!alarm)d.C.push('Miejsce leczenia: decyzja lekarza – moduł nie ocenia bezpieczeństwa wypisu.');
  }
  var tx=d.done();return{text:tx,dose:dose,touched:t.touched||0,reviewed:rev};}
// ================= ZAPALENIE PŁUC =================
function cap(o){var P=o.P||{},T=o.tabs||{},E=o.E,U=o.unit||function(u,v){return D(v,1);},d=Doc(),t=tab(T,'scores'),g=t.g,touched=0;
  Object.keys(T).forEach(function(k){touched+=T[k]&&T[k].touched||0;});
  if(t.touched>0){
    var i={age:P.age,sex:P.sex};['rr','sbp','dbp','hr','temp','urea','na','glu','ph','hct','pao2','spo2','pf','wbc','platelets','nursing','cancer','liver','heart','stroke','renal','confusion','effusion','ventilation','vasopressor','multilobar','fluidHypotension','oral','social'].forEach(function(k){i[k]=g(k);});
    var r=E.capDisposition(i);
    d.head('OCENA – POZASZPITALNE ZAPALENIE PŁUC');
    var bp=fin(g('sbp'))?'RR '+I(g('sbp'))+(fin(g('dbp'))?'/'+I(g('dbp')):'')+' mmHg':'';
    d.line('Parametry',[d.vals(g,[['rr','oddechy',0,I,'/min']]),bp,d.vals(g,[['hr','HR',0,I,'/min'],['temp','temp.',1,null,'°C'],['spo2','SpO₂',0,I,'%']])].filter(Boolean).join(', '));
    var lab=[fin(g('urea'))?'mocznik '+U('urea',g('urea')):'',d.vals(g,[['na','Na',0,null,'mmol/l']]),fin(g('glu'))?'glukoza '+U('glu',g('glu')):'',d.vals(g,[['ph','pH',2],['hct','Hct',0,null,'%'],['pao2','PaO₂',0,I,'mmHg'],['pf','PaO₂/FiO₂',0,I,'mmHg'],['wbc','WBC',1,null,'G/l'],['platelets','PLT',0,I,'G/l']])].filter(Boolean).join(', ');
    d.line('Badania',lab);
    var flags=(E.psiFlags||[]).filter(function(x){return x[0]!=='confusion';}).map(function(x){return [x[0],x[2]];});
    var y=d.yes(g,[['confusion','nowe splątanie']].concat(flags).concat([['social','brak warunków opieki domowej'],['ventilation','wentylacja mechaniczna inwazyjna'],['vasopressor','wstrząs septyczny z wazopresorem'],['multilobar','nacieki wielopłatowe'],['fluidHypotension','hipotensja wymagająca intensywnej płynoterapii']]));
    if(g('oral')===false)y.push('brak tolerancji leczenia doustnego');
    d.line('Stwierdzono',y.join(', '));
    if(r.curb&&r.curb.complete)d.line('CURB-65',r.curb.score+'/5'+(r.curb.items&&r.curb.items.length?' ('+r.curb.items.join(', ')+')':''));
    if(r.psi&&r.psi.step1)d.line('PSI / PORT','klasa I (reguła pierwszego etapu)');
    else if(r.psi&&r.psi.complete)d.line('PSI / PORT','klasa '+r.psi.cls+' ('+I(r.psi.score)+' pkt)'+(r.psi.breakdown&&r.psi.breakdown.length?'; składowe: '+r.psi.breakdown.map(function(b){return b[0]+' '+b[1];}).join(', '):''));
    var sv=r.severe||{};var crit=(sv.majorTxt||[]).concat(sv.minorTxt||[]);
    if(sv.severe)d.line('Ciężkie PZP (ATS/IDSA 2019)','spełnione: '+(sv.major||[]).length+' duże / '+(sv.minor||[]).length+' małe'+(crit.length?' ('+crit.join('; ')+')':''));
    else if(sv.missing&&!sv.missing.length)d.line('Ciężkie PZP (ATS/IDSA 2019)','niespełnione ('+(sv.major||[]).length+' duże / '+(sv.minor||[]).length+' małe)');
    if(r.ready)d.C.push(String(r.message).replace(/^Rekomendacja:\s*/,'Rekomendacja programu: ')+'.');
    else d.C.push('Rekomendacja miejsca leczenia: brak – minimum to składowe CURB-65 i SpO₂; decyzja lekarza.');
    (r.reasons||[]).filter(function(x){return !/niepełn|uzupełnij/i.test(x);}).forEach(function(x){d.C.push(x+'.');});
    if(sv.severe)d.C.push('Ciężkie PZP: pilna ocena OIT / intensywnego nadzoru.');
    d.C.push('Lekarz zawsze wybiera miejsce leczenia (dom / obserwacja / oddział / OIT); skala sama nie stanowi zgody na wypis.');
  }
  var tx=d.done();
  var abx=typeof o.abx==='function'?String(o.abx()||''):'',ai=typeof o.ai==='function'?String(o.ai()||''):'';
  return{text:tx,sub:abx,subName:'Zapalenie płuc – antybiotykoterapia (wyliczone z silnika)',subAuto:true,ai:ai,dose:false,touched:touched,reviewed:false};}
// ================= ZATRUCIA =================
function labLine(d,g,U){return [d.vals(g,[['na','Na',0,null,'mmol/l'],['k','K',1,null,'mmol/l'],['cl','Cl',0,null,'mmol/l'],['hco3','HCO₃',1,null,'mmol/l'],['ph','pH',2]]),fin(g('glu'))?'glukoza '+U('glu',g('glu')):'',fin(g('urea'))?'mocznik '+U('urea',g('urea')):'',d.vals(g,[['osm','osmolalność zmierzona',0,I,'mOsm/kg']]),fin(g('calcium'))?'Ca zjon. '+U('ca',g('calcium')):'',d.vals(g,[['lactate','mleczany',1,null,'mmol/l']])].filter(Boolean).join(', ');}
function gapLine(E,g){var td={};['na','k','cl','hco3','ph','glu','urea','osm','ethanol','ethanolUnit','lactate'].forEach(function(k){td[k]=g(k);});var r=E.gaps(td);
  return [fin(r.ag)?'AG bez K '+D(r.ag,1)+' mmol/l':'',fin(r.agK)?'AG z K '+D(r.agK,1)+' mmol/l':'',fin(r.calculated)?'osmolalność obliczona '+D(r.calculated,1)+' mOsm/kg':'',fin(r.osmGap)?'luka osmolalna '+D(r.osmGap,1)+' mOsm/kg':''].filter(Boolean).join(', ');}
var EU={mgdl:'mg/dl',gL:'g/l',mmol:'mmol/l'};
function tox(o){var P=o.P||{},T=o.tabs||{},E=o.E,C=o.C,M=o.M,U=o.unit||function(u,v){return D(v,1);},d=Doc(),dose=false,rev=false,touched=0,tel=false,hosp=false;
  Object.keys(T).forEach(function(k){touched+=T[k]&&T[k].touched||0;});
  // ---- metanol / glikol ----
  var a=tab(T,'alcohols');if(a.touched>0){var g=a.g,toxn=g('toxin')==='eg'?'glikol etylenowy':'metanol';
    d.head('METANOL / GLIKOL – OCENA');
    d.line('Podejrzewana substancja',toxn+(g('exposure')===true?' – wiarygodne podejrzenie ekspozycji':''));
    var ad={none:'nie podano odtrutki',fomepizole:'fomepizol',ethanol:'etanol jako odtrutka'}[g('antidote')];d.line('Blokada ADH',ad);
    d.line('Stężenie / czas',[fin(g('level'))?'stężenie '+D(g('level'),1)+' mg/dl':'',fin(g('hours'))?D(g('hours'),1)+' h od ekspozycji':''].filter(Boolean).join(', '));
    d.line('Stwierdzono',d.yes(g,[['coma','śpiączka'],['seizure','drgawki'],['vision','nowe zaburzenia widzenia'],['aki',g('toxin')==='eg'?'AKI KDIGO 2–3':'upośledzenie nerek'],['persistentAcidosis','kwasica utrzymuje się mimo leczenia']]).join(', '));
    d.line('Badania',labLine(d,g,U)+(fin(g('ethanol'))?(labLine(d,g,U)?', ':'')+'etanol '+D(g('ethanol'),2)+' '+(EU[g('ethanolUnit')]||''):''));
    d.line('Luki',gapLine(E,g));
    var td={};['na','k','cl','hco3','ph','glu','urea','osm','ethanol','ethanolUnit','lactate','toxin','antidote','level','coma','seizure','vision','aki','persistentAcidosis','exposure'].forEach(function(k){td[k]=g(k);});
    var x=E.extrip(td);if(x.urgent){hosp=true;d.line('EXTRIP – wskazania do pilnej ECTR',x.reasons.join('; ')+(x.suggest&&x.suggest.length?'; rozważ ECTR: '+x.suggest.join('; '):''));
      d.C.push('HOSPITALIZACJA BEZWZGLĘDNA – pilna ocena hemodializy: toksykolog, nefrolog, OIT.');}
    else if(x.suggest&&x.suggest.length)d.line('EXTRIP – rozważ ECTR',x.suggest.join('; '));
    tel=true;d.C.push('Toksyczny alkohol: próbki od razu, pilna '+TOX_TEL+' (odtrutka / dializa) – nie czekać na stężenie przy objawach.');}
  // ---- fomepizol ----
  var fo=tab(T,'antidote');if(inc(fo)){var g2=fo.g,r=E.fomepizole(P.w,g2('stage'),g2('final'));
    if(r.ok&&fin(g2('final'))){dose=true;var st={loading:'nasycenie (dawka 1)',maintenance:'dawki 2–5 (co 12 h)',later:'od dawki 6 (co 12 h)'}[g2('stage')]||'';
      d.head('ODTRUTKA: FOMEPIZOL i.v.');
      d.line('Masa ciała',D(P.w,1)+' kg');
      d.line('Dawka',D(r.perKg,0)+' mg/kg × '+D(P.w,1)+' kg = '+I(r.mg)+' mg – etap: '+st);
      d.line('Przygotowanie','koncentrat 1 g/ml: '+D(r.concentrateMl,3)+' ml leku + '+I(r.diluentMl)+' ml '+(g2('diluent')||'rozcieńczalnika (NaCl 0,9% lub glukoza 5% – nie ustalono)')+' → objętość końcowa '+D(r.volume,1)+' ml; stężenie '+D(r.concentration,2)+' mg/ml');
      d.line('Podanie','i.v. w 30 min → '+D(r.mlh,1)+' ml/h');
      d.line('Schemat poza dializą','dawka 1: 15 mg/kg; po 12, 24, 36 i 48 h: 10 mg/kg; od 60 h: 15 mg/kg co 12 h');
      d.line('Monitorowanie','gazometria, elektrolity, nerki, stężenie metanolu/glikolu, wątroba, nadwrażliwość; kontynuacja do stężenia <20 mg/dl (decyzja zespołu)');
      var sf=[];if(g2('allergy')===true)sf.push('NADWRAŻLIWOŚĆ NA FOMEPIZOL / PIRAZOLE');else if(g2('allergy')===false)sf.push('bez nadwrażliwości na pirazole');
      if(g2('hd')===true)sf.push('TRWA / PLANOWANA HEMODIALIZA – harmonogram wg etykiety (zmiana dawkowania)');else if(g2('hd')===false)sf.push('bez hemodializy');
      d.line('Przeciwwskazania / HD (ocena lekarza)',sf.join('; '));
      if(g2('ind')===true)d.line('','☑ Potwierdzono wskazanie do blokady ADH.');
      if(g2('product')===true)d.line('','☑ Potwierdzono dostępność, produkt i stężenie 1 g/ml.');
      if(g2('review')===true){rev=true;d.line('','☑ Lekarz potwierdził sprawdzenie propozycji.');}
      d.line('Status','fomepizol bez polskiej ChPL (import docelowy) – zapis ręczny, DO DECYZJI LEKARZA');
      tel=true;d.C.push('Fomepizol wg wyliczenia powyżej (DO DECYZJI LEKARZA); '+TOX_TEL+'.');
      if(g2('allergy')===true||g2('hd')===true)d.C.push('UWAGA: '+sf.filter(function(s){return /[A-ZŁ]{4}/.test(s);}).join('; ')+'.');
    }else if(fo.touched>0){d.head('ODTRUTKA: FOMEPIZOL');d.line('Fomepizol','nie wyliczono – '+(r.message||'podaj objętość rozcieńczalnika'));}}
  // ---- etanol ----
  var et=tab(T,'ethanol');if(et.touched>0){var g3=et.g;
    var al=g3('gcs')<=8||g3('rr')<10||g3('sbp')<90||g3('spo2')<90||g3('temp')<35||g3('glu')<3;
    d.head('ETANOL – ZATRUCIE');
    d.line('Stan',[fin(g3('gcs'))?'GCS '+I(g3('gcs')):'',d.vals(g3,[['rr','oddechy',0,I,'/min'],['sbp','SBP',0,I,'mmHg'],['spo2','SpO₂',0,I,'%'],['temp','temp.',1,null,'°C']])].filter(Boolean).join(', '));
    d.line('Stwierdzono',d.yes(g3,[['trauma','możliwy uraz głowy / inny'],['mixed','podejrzenie zatrucia mieszanego'],['wernicke','ryzyko encefalopatii Wernickego (niedożywienie)']]).join(', '));
    if(g3('escort')===true)d.line('Opieka po SOR','zapewniony odbiór i opieka');
    var td3={};['na','k','cl','hco3','ph','glu','urea','osm','ethanol','ethanolUnit','lactate'].forEach(function(k){td3[k]=g3(k);});var gp=E.gaps(td3);
    if(fin(g3('ethanol')))d.line('Etanol',D(g3('ethanol'),2)+' '+(EU[g3('ethanolUnit')]||'')+' (= '+D(gp.ethanolMmol,1)+' mmol/l); nie wyliczono czasu wytrzeźwienia');
    d.line('Badania',labLine(d,g3,U));d.line('Luki',gapLine(E,g3));
    if(g3('wernicke')===true)d.line('Tiamina','przed / z glukozą, bez opóźniania glukozy');
    if(al){hosp=true;d.C.push('HOSPITALIZACJA BEZWZGLĘDNA – zaburzenia świadomości / oddychania / krążenia / hipotermia / hipoglikemia: pilne zabezpieczenie i poszukiwanie przyczyny (nie przypisywać automatycznie etanolowi).');}
    else d.C.push('Obserwacja w SOR z powtarzaną oceną; stężenie etanolu nie jest samodzielnym kryterium wypisu. Wypis możliwy dopiero po odzyskaniu sprawności, stabilnych parametrach w powtórnej ocenie, tolerancji doustnej i wykluczeniu urazu / innej przyczyny'+(g3('escort')===true?'':' oraz zapewnieniu opieki')+' – decyzja lekarza.');}
  // ---- grzyby ----
  var mu=tab(T,'mushrooms');if(mu.touched>0&&M){var g4=mu.g;
    d.head('ZATRUCIE GRZYBAMI');
    d.line('Wywiad',[fin(g4('latency'))?'objawy po '+D(g4('latency'),1)+' h od posiłku':'',fin(g4('since'))?D(g4('since'),1)+' h od spożycia':''].filter(Boolean).join(', '));
    d.line('Stwierdzono',d.yes(g4,[['suspect','podejrzenie gatunku śmiertelnie toksycznego'],['gi','wymioty / biegunka'],['liver','uszkodzenie wątroby / rosnący INR'],['renal','uszkodzenie nerek / skąpomocz']]).join(', '));
    var syn=g4('syn')||'';d.line('Zespół',syn);
    var tr=M.triage({latency:g4('latency'),since:g4('since'),suspect:g4('suspect'),gi:g4('gi'),liver:g4('liver'),renal:g4('renal')});
    if(tr.ok&&tr.sampling&&tr.sampling.text)d.line('Próbki',String(tr.sampling.text).replace(/<[^>]*>/g,''));
    var hit=[];(M.TRANSFER||[]).forEach(function(x,k){if(g4('t'+k)===true)hit.push(x[0]);});d.line('Kryteria transferu / konsultacji',hit.join('; '));
    if(syn==='amatoksyny'&&M.TX&&M.TX.amatoksyny&&fin(P.w)&&P.w>=40&&P.w<=200){dose=true;
      d.line('NAC i.v. – schemat pomostowy (masa '+D(P.w,0)+' kg)',M.TX.amatoksyny.nac.map(function(n){return n[2].split(',')[0]+': '+n[0]+' mg/kg = '+D(P.w*n[0]/1000,1)+' g w '+n[1]+' (rozcieńczalnik typowo '+n[3]+' ml)';}).join('; ')+'; prędkość pompy z rzeczywistej objętości końcowej (z koncentratem); poza wskazaniami rejestracyjnymi – DO DECYZJI LEKARZA');}
    tel=true;
    if(tr.ok&&tr.level==='red'){hosp=true;d.C.push('HOSPITALIZACJA BEZWZGLĘDNA – podejrzenie ciężkiego zatrucia grzybami; okres pozornej poprawy nie wyklucza niewydolności wątroby / nerek.');}
    if(hit.length)d.C.push('Spełnione kryteria do rozważenia transferu / konsultacji ('+hit.length+') – decyzja lekarza.');
    d.C.push('Zatrucie grzybami: pilna '+TOX_TEL+'.');}
  var at=tab(T,'atlas');if(at.touched>0&&M){var sp=(M.SPECIES||[]).filter(function(s){return s.id===at.g('sp');})[0];if(sp){d.head('GRZYBY – ATLAS');d.line('Gatunek wskazany w wywiadzie',sp.pl+' ('+sp.latin+')');}}
  // ---- paracetamol ----
  var pa=tab(T,'para');if(pa.touched>0&&C){var g5=pa.g,w=P.w;
    d.head('ZATRUCIE PARACETAMOLEM');
    d.line('Spożycie',[fin(g5('mg'))?'dawka '+I(g5('mg'))+' mg'+(fin(w)&&w>0?' ('+D(g5('mg')/w,0)+' mg/kg)':''):'',fin(g5('hrs'))?D(g5('hrs'),1)+' h od spożycia':''].filter(Boolean).join(', '));
    d.line('Zaznaczono',d.yes(g5,[['tu','czas nieznany / niewiarygodny'],['stag','spożycie rozłożone / wielokrotne / przewlekłe'],['du','dawka nieznana / niepewna'],['risk','czynniki ryzyka hepatotoksyczności'],['hep','podwyższone ALT/AST lub cechy uszkodzenia wątroby']]).join(', '));
    var un=C.urgentNac({w:w,mg:g5('mg'),hours:g5('hrs'),timeUnknown:g5('tu'),staggered:g5('stag'),doseUnknown:g5('du'),risk:g5('risk'),hepatic:g5('hep')});
    if(un.ok&&un.now)d.line('NAC OD RAZU',un.why.join('; '));
    var nonAc=g5('stag')===true||g5('tu')===true,nm=C.nomogram({conc:g5('conc'),hours:g5('chr'),unit:'umol',nonAcute:nonAc,risk:g5('risk')});
    if(nm.ok&&nm.usable)d.line('Nomogram Rumack–Matthew',D(nm.umol,0)+' µmol/l (= '+D(nm.ug,1)+' µg/ml) w '+D(nm.hours,1)+' h od spożycia; linia leczenia '+D(nm.lineUmol,0)+' µmol/l ('+D(nm.line,1)+' µg/ml) → '+(nm.above?'POWYŻEJ linii leczenia':'poniżej linii leczenia')+(nm.hiRisk?'; powyżej linii wysokiego ryzyka':''));
    else if(nm.ok&&!nm.usable&&(fin(g5('conc'))||nonAc))d.line('Nomogram','nie interpretować – '+(nonAc?'spożycie rozłożone / nieznany czas':fin(nm.hours)&&nm.hours<4?'<4 h od spożycia':'poza zakresem 4–24 h'));
    var need=(un.ok&&un.now)||(nm.ok&&nm.usable&&nm.above),np=C.nacPlan({w:w,t1:Number(g5('t1'))});
    if(need&&np.ok){dose=true;
      d.line('NAC i.v. – schemat 3-workowy','masa '+D(np.w,0)+' kg'+(np.capped?' (obliczenia dla '+np.wc+' kg)':'')+'; łącznie '+I(np.total)+' mg (300 mg/kg); preparat 100 mg/ml (do potwierdzenia)');
      np.bags.forEach(function(b){d.line(b.n,I(b.mg)+' mg ('+b.mgkg+' mg/kg) = '+D(b.conc,1)+' ml NAC 100 mg/ml; rozcieńczalnik (NaCl 0,9% lub G5%): '+(b.vol?b.vol+' ml':'DO DECYZJI LEKARZA')+'; czas '+(b.h<=1?D(b.h*60,0)+' min':D(b.h,b.h%1?2:0)+' h')+(b.mlh?'; '+D(b.mlh,1)+' ml/h':''));});
      (np.warnings||[]).forEach(function(x){d.line('Uwaga',String(x).replace(/<[^>]*>/g,''));});
      d.line('Monitorowanie',(C.PARA_MONITOR||[]).map(function(x){return String(x).replace(/<[^>]*>/g,'').replace(/ poniżej\./,'.');}).join(' '));}
    if(g5('review')===true&&need){rev=true;d.line('','☑ Lekarz potwierdził sprawdzenie propozycji.');}
    tel=true;
    if(need)d.C.push('NAC i.v. wskazany (schemat jak wyżej, ok. 20 h) – leczenie w szpitalu; zakończenie NAC wg kryteriów modułu; przy rosnących ALT/AST z koagulopatią / encefalopatią – kryteria King’s College, ośrodek hepatologiczny / OIT.');
    else if(un.ok&&!un.now&&nm.ok&&nm.usable&&!nm.above)d.C.push('Nomogram poniżej linii przy jednorazowym spożyciu o wiarygodnym czasie – NAC z samego nomogramu niewskazany; decyzja lekarza (ALT/AST, powtórne oznaczenie przy wątpliwościach).');
    d.C.push('Zatrucie paracetamolem: '+TOX_TEL+' w razie wątpliwości.');}
  var tx=d.done(touched||dose?'Miejsce leczenia: decyzja lekarza.':'');
  if(tx&&tel&&!/12 411 99 99/.test(tx))tx+='\n– '+TOX_TEL+'.';
  return{text:tx,dose:dose,touched:touched,reviewed:rev,hosp:hosp};}
return{ahf:ahf,cap:cap,tox:tox,I:I,D:D};
});
