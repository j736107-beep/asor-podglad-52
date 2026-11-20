// Wydruk modułu Zatorowość płucna (fix19): WYŁĄCZNIE pozycje wypełnione / zaznaczone przez lekarza + wyliczone leczenie
// (UFH: bolus, wlew, przygotowanie pompy, kontrola APTT) + wnioski. Bez treści dydaktycznych. Dawki liczy SORClinical (bez zmian algorytmu).
(function(r,f){var m=f();if(typeof module==='object'&&module.exports)module.exports=m;else{r.SK=r.SK||{};r.SK.pePrint=m;}})(this,function(){
'use strict';
var fin=Number.isFinite;
function I(x){return fin(x)?String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g,' '):'—';}
function D(x,d){if(!fin(x))return '—';var s=(+x.toFixed(d==null?2:d)).toString();return s.replace('.',',');}
function noop(){return undefined;}
// fix24: wspólna konwencja UFH (zlecono / nastawa 0,1 ml/h / faktycznie podawane)
function UR(){return (typeof module==='object'&&module.exports)?require('./ufh-rate.js'):(typeof window!=='undefined'&&window.SK&&window.SK.ufhRate);}
// t = {g:function(id), touched:liczba pól zmienionych przez lekarza, seen:czy zakładkę otwarto}
function tab(T,id){var t=T&&T[id];return t&&typeof t.g==='function'?t:{g:noop,touched:0,seen:false};}
function riskInfo(g,P){
  var unstable=g('state')==='unstable'||g('sbp')<90;
  var crit=[['wiek >80 lat',fin(P.age)?P.age>80:undefined],['nowotwór',g('cancer')],['przewlekła choroba serca / płuc',g('cardio')],['HR ≥110/min',fin(g('hr'))?g('hr')>=110:undefined],['SBP <100 mmHg',fin(g('sbp'))?g('sbp')<100:undefined],['SpO₂ <90%',fin(g('sat'))?g('sat')<90:undefined]];
  var pos=crit.filter(function(c){return c[1]===true;}).map(function(c){return c[0];}),unknown=crit.filter(function(c){return c[1]===undefined;}).length;
  return{unstable:unstable,spesi:unknown?null:pos.length,pos:pos,unknown:unknown,hypox:g('sat')<90,rvtrop:g('rv')===true&&g('trop')===true};
}
function build(o){
  var E=o.E,P=o.P||{},T=o.tabs||{},due=o.due||function(){return '';},cur=o.current||'';
  var L=[],C=[],dose=false,touched=0,reviewed=false,w=P.w,hasW=fin(w)&&w>0;
  Object.keys(T).forEach(function(k){touched+=T[k]&&T[k].touched||0;});
  function line(l,x){if(x!=null&&String(x)!=='')L.push(l?l+': '+x:String(x));}
  var risk=tab(T,'risk'),ufh=tab(T,'ufh'),ap=tab(T,'aptt'),ly=tab(T,'lysis'),alt=tab(T,'alternatives');
  var ri=null;
  // ---- ryzyko ----
  if(risk.touched>0){var g=risk.g;ri=riskInfo(g,P);
    var st=g('state')==='stable'?'stabilny':g('state')==='unstable'?'niestabilny / wstrząs / NZK':'';
    var vit=[fin(g('sbp'))?'SBP '+I(g('sbp'))+' mmHg':'',fin(g('hr'))?'HR '+I(g('hr'))+'/min':'',fin(g('sat'))?'SpO₂ '+I(g('sat'))+'%':''].filter(Boolean).join(', ');
    L.push('OCENA RYZYKA');
    line('Stan hemodynamiczny',st+(st&&vit?'; ':'')+vit);
    var yes=[['cancer','nowotwór'],['cardio','przewlekła choroba serca / płuc'],['rv','dysfunkcja RV (echo / TK)'],['trop','podwyższona troponina']].filter(function(x){return g(x[0])===true;}).map(function(x){return x[1];});
    line('Stwierdzono',yes.join(', '));
    if(!ri.unstable&&ri.spesi!=null)line('Skala sPESI',ri.spesi+'/6'+(ri.pos.length?' ('+ri.pos.join(', ')+')':''));
  }
  // ---- UFH: bolus i pompa ----
  var u=null;
  if(ufh.touched>0||ufh.seen){var g2=ufh.g;
    u=E.ufhStart(w,g2('amount'),g2('volume'),g2('omit'));
    if(u.ok){dose=true;if(g2('review')===true)reviewed=true;
      L.push('');L.push('LECZENIE: HEPARYNA NIEFRAKCJONOWANA (UFH) I.V.');line('Schemat','ZP – Downstate PTSAF-19 01/2026 (do akceptacji lokalnej)');
      line('Masa ciała',D(w,1)+' kg');
      if(g2('omit'))line('Bolus','pominięty – decyzja lekarza');
      else line('Bolus','80 j.m./kg × '+D(w,1)+' kg = '+I(u.rawBolus)+' j.m. → '+I(u.bolus)+' j.m. i.v. w 3 min = '+D(u.bolus/5000,2)+' ml preparatu 5000 j.m./ml'+(u.capBolus?' (zastosowano maksimum 10 000 j.m.)':''));
      var ord=Math.min(u.rawRate,2000),us=UR().set(ord,u.concentration);
      line('Wlew',UR().text({perKg:18,raw:u.rawRate,ordered:ord,conc:u.concentration}));
      line('Pompa','Heparinum WZF 5000 j.m./ml: '+I(g2('amount'))+' j.m. = '+D(u.drugMl,2)+' ml leku + '+D(u.diluentMl,2)+' ml NaCl 0,9% → objętość końcowa '+D(g2('volume'),1)+' ml; stężenie '+D(u.concentration,1)+' j.m./ml');
      line('Prędkość pompy',UR().fmt(us.mlh,1)+' ml/h (= '+I(us.actual)+' j.m./h faktycznie); strzykawka wystarczy na '+D(g2('amount')/us.actual,1)+' h; zapotrzebowanie 24 h: '+I(us.actual*24)+' j.m. ('+D(us.mlh*24,1)+' ml)');
      line('Limity schematu','bolus maks. 10 000 j.m.; wlew początkowy maks. 2 000 j.m./h');
      if(!(u.concentration>=1&&u.concentration<=1000))line('UWAGA','stężenie poza ChPL Heparinum WZF (1–1000 j.m./ml)');
      var mon='APTT po 6 h od startu i po każdej zmianie dawki; po 2 kolejnych wynikach w zakresie – co najmniej raz/dobę; PLT, Hb, krwawienie';
      var dd=due(g2('start'),6);line('Kontrola',mon+(dd?'. '+dd:''));
      if(fin(g2('base')))line('APTT wyjściowy',D(g2('base'),1)+' s');
      var sf=[];if(g2('bleed')===true)sf.push('CZYNNE ISTOTNE KRWAWIENIE');else if(g2('bleed')===false)sf.push('bez czynnego krwawienia');
      if(g2('hit')===true)sf.push('HIT W WYWIADZIE / PODEJRZENIE HIT');else if(g2('hit')===false)sf.push('bez HIT');
      if(g2('other')===true)sf.push('INNY ANTYKOAGULANT NADAL DZIAŁA');else if(g2('other')===false)sf.push('bez działającego innego antykoagulantu');
      line('Bezpieczeństwo (ocena lekarza)',sf.join('; '));
      line('',g2('review')===true?'☑ Lekarz potwierdził sprawdzenie wskazania, przeciwwskazań, preparatu i obliczeń.':'Propozycja do decyzji lekarza (sprawdzenie nie zostało potwierdzone w module).');
    }else if(ufh.touched>0){L.push('');line('UFH','nie wyliczono – '+u.message);}
  }
  // ---- APTT: korekta ----
  if(ap.touched>0){var g3=ap.g;
    var a=E.ufhAdjust({w:w,current:g3('current'),aptt:g3('aptt'),concentration:g3('conc'),local:g3('local'),baselineNormal:g3('baseNormal'),bleeding:g3('bleed'),postLysis:g3('post'),otherAnticoagulant:g3('other'),twoTherapeutic:g3('two')});
    L.push('');L.push('KONTROLA APTT – KOREKTA WLEWU UFH');
    var inp=[fin(g3('current'))?'obecny wlew '+I(g3('current'))+' j.m./h':'',fin(g3('aptt'))?'APTT '+D(g3('aptt'),1)+' s':'',fin(g3('conc'))?'stężenie '+D(g3('conc'),1)+' j.m./ml':''].filter(Boolean).join(', ');
    line('Dane',inp);
    if(a.ok){dose=true;if(g3('review')===true)reviewed=true;
      var ut=UR().text({lead:'zlecono '+I(g3('current'))+' '+(a.delta>=0?'+':'−')+' '+I(Math.abs(a.delta))+' = '+I(a.rate)+' j./h',ordered:a.rate,conc:g3('conc')});
      if(a.hold)line('Propozycja','WSTRZYMAĆ wlew na 2 h, ocena krwawienia; przy wznowieniu: '+ut+' ('+D(a.perKg,2)+' j.m./kg/h zlecone)');
      else line('Propozycja',(a.delta?(a.delta>0?'zwiększyć':'zmniejszyć')+' o '+I(Math.abs(a.delta))+' j.m./h: ':'bez zmiany: ')+ut+' ('+D(a.perKg,2)+' j.m./kg/h zlecone)');
      if(a.bolusTable)line('Dodatkowy bolus (tabela źródłowa)',I(a.bolusTable)+' j.m. – po ocenie poprzednich podań');
      line('Następny APTT','za '+a.next+' h'+(a.hold?' od wznowienia':' od zmiany / kontynuacji'));
    }else line('Nomogram','nie wyliczono – '+a.message);
  }
  // ---- alteplaza ----
  var lyInd=false,lyCI;
  if(ly.touched>0){var g4=ly.g,rapid=g4('mode')==='rapid',conc=+g4('conc'),t=E.tpa(w,conc,g4('mode'));
    lyInd=g4('ind')===true;lyCI=g4('ci');
    L.push('');L.push('TROMBOLIZA (ALTEPLAZA)');
    if(lyInd)line('Wskazanie do systemowej trombolizy','potwierdzone przez lekarza');
    if(lyCI===true)line('Przeciwwskazanie','ISTOTNE PRZECIWWSKAZANIE DO TROMBOLIZY');else if(lyCI===false)line('Przeciwwskazania','bez istotnych przeciwwskazań (ocena lekarza)');
    if(g4('fullCI')===true)line('','☑ Przeanalizowano pełną listę przeciwwskazań i ostatnie antykoagulanty.');
    if(t.ok&&lyCI!==true){dose=true;if(g4('review')===true)reviewed=true;
      if(rapid)line('Schemat przyspieszony (poza ChPL, decyzja lekarza)',D(t.total,1)+' mg i.v. w 15 min = '+D(t.ml,1)+' ml ('+conc+' mg/ml) → '+D(t.mlh,1)+' ml/h');
      else line('Schemat standardowy (ChPL)','łącznie '+D(t.total,1)+' mg: bolus 10 mg = '+D(t.bolusMl,1)+' ml i.v. w 1–2 min, następnie '+D(t.infusion,1)+' mg = '+D(t.ml,1)+' ml w 2 h → '+D(t.mlh,1)+' ml/h ('+conc+' mg/ml)');
    }else if(!t.ok)line('Alteplaza','nie wyliczono – '+t.message);
    if(fin(g4('aptt'))&&fin(g4('uln')))line('Wznowienie UFH po trombolizie','APTT '+D(g4('aptt'),1)+' s '+(g4('aptt')<2*g4('uln')?'<':'≥')+' 2 × GGN ('+D(2*g4('uln'),1)+' s) – '+(g4('aptt')<2*g4('uln')?'próg ChPL spełniony':'próg ChPL niespełniony'));
  }
  // ---- HDCz / DOAC ----
  if(alt.touched>0){var g5=alt.g,en=E.enox(w,P.crcl,g5('stable'),g5('aki'));
    L.push('');L.push('HDCz / DOAC');
    if(fin(P.crcl))line('CrCl (Cockcroft–Gault)',I(P.crcl)+' ml/min');
    if(en.ok){dose=true;line('Enoksaparyna','1 mg/kg s.c. co '+en.interval+' h → '+I(en.mg)+' mg = '+I(en.iu)+' j.m. anty-Xa ('+D(en.ml,2)+' ml przy 100 mg/ml)');}
    var d=E.doac(P.crcl,g5('drug'),g5('day')),dn=g5('drug')==='apixaban'?'apiksaban':'rywaroksaban';
    var elig=g5('stable')===true&&g5('aki')===false&&!(P.co&&P.co.preg)&&g5('preg')===false&&g5('aps')===false&&g5('liver')===false&&g5('interact')===false;
    if(d.ok&&elig){dose=true;line('DOAC','dzień '+g5('day')+': '+dn+' '+d.mg+' mg p.o. co '+d.interval+' h'+(d.food?', z posiłkiem':'')+(d.caution?' (CrCl <30 ml/min – ostrożność)':''));}
    if(g5('review')===true&&(en.ok||d.ok&&elig))reviewed=true;
  }
  // ---- WNIOSKI (logika modułu) ----
  var unstable=ri&&ri.unstable;
  if(unstable||lyInd)C.push('HOSPITALIZACJA BEZWZGLĘDNA – niestabilność hemodynamiczna w ZP: pilna ocena reperfuzji, monitorowany obszar, PERT / kardiolog / OIT.');
  if(lyInd&&lyCI===false)C.push('Tromboliza systemowa – kwalifikacja potwierdzona przez lekarza (dawka jak wyżej); monitorowanie EKG, RR, SpO₂ i krwawienia.');
  if(lyCI===true)C.push('Istotne przeciwwskazanie do trombolizy – decyzja o reperfuzji: PERT / kardiolog.');
  if(ri&&ri.hypox)C.push('Hospitalizacja: hipoksemia (SpO₂ <90%) niezależnie od sPESI.');
  if(ri&&!unstable&&ri.rvtrop)C.push('Hospitalizacja i monitorowanie: dysfunkcja RV i podwyższona troponina – ryzyko pogorszenia.');
  if(ri&&!unstable&&ri.spesi!=null&&ri.spesi>=1&&!ri.hypox&&!ri.rvtrop)C.push('Hospitalizacja: sPESI ≥1 – pacjent nie spełnia kryterium niskiego ryzyka.');
  if(ri&&!unstable&&ri.spesi===0&&!ri.hypox&&!ri.rvtrop)C.push('sPESI 0 – wczesny wypis rozważyć tylko po ocenie Hestia, RV, krwawienia, opieki i dostępu do leczenia (moduł nie zatwierdza wypisu).');
  var bl=[ufh,alt].some(function(t){return t.g('bleed')===true||t.g('hit')===true;});
  if(bl)C.push('UWAGA: czynne krwawienie / HIT – zwykła propozycja heparyny zablokowana; pilna decyzja lekarza.');
  else if(u&&u.ok)C.push('Leczenie przeciwkrzepliwe: UFH i.v. wg wyliczenia powyżej'+(ufh.g('omit')?' (bez bolusa)':' (bolus + wlew)')+'; kontrola APTT po 6 h.');
  if(!L.length)return{text:'',dose:false,touched:touched,reviewed:false};
  if(!ri&&!lyInd)C.push('Miejsce leczenia (oddział / OIOM / wypis): ryzyko ZP nie zostało ocenione w module – decyzja lekarza.');
  if(ri&&!unstable&&ri.spesi==null&&!ri.hypox&&!ri.rvtrop)C.push('Miejsce leczenia: sPESI niepełne – stratyfikacja ryzyka do uzupełnienia, decyzja lekarza.');
  if(!C.length)C.push('Miejsce leczenia: decyzja lekarza.');
  L.push('');L.push('WNIOSKI:');C.forEach(function(c){L.push('– '+c);});
  return{text:L.join('\n').replace(/^\n+/,''),dose:dose,touched:touched,reviewed:reviewed};
}
return{build:build,riskInfo:riskInfo,I:I,D:D};
});
