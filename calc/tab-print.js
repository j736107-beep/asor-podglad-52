// fix21+: wydruk modułów zakładkowych (DKA/HHS, Antykoagulacja, Anafilaksja, Transfuzjologia, Neurologia) – WYŁĄCZNIE pola zmienione przez lekarza,
// wyliczone dawki i pompy (gdy policzone) z pełnym opisem pompy, WNIOSKI wg logiki modułu. Bez list, akapitów ChPL, źródeł, tekstów dydaktycznych.
// Dawki liczą istniejące silniki (SK.dkaB1, SK.acoag, …) – ten plik niczego nie przelicza inaczej niż moduł.
(function(r,f){var m=f(typeof module==='object'&&module.exports?require('./clin-print.js'):(r.SK&&r.SK.clinPrint));if(typeof module==='object'&&module.exports)module.exports=m;else{r.SK=r.SK||{};r.SK.tabPrint=m;}})(this,function(CP){
'use strict';
var fin=Number.isFinite,I=CP.I,D=CP.D,Doc=CP.Doc;
function noop(){return undefined;}
function tab(T,id){var t=T&&T[id];return t&&typeof t.g==='function'?t:{g:noop,touched:0,current:false,print:false,fields:[]};}
function inc(t){return !!(t.touched>0||t.print);}
function strip(s){return String(s==null?'':s).replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();}
// lista pól zmienionych przez lekarza (bez pól wykluczonych); checkbox = sama etykieta; NIE nie jest drukowane (niezaznaczone pola nie trafiają do listy)
function fields(t,excl){excl=excl||[];return (t.fields||[]).filter(function(x){return excl.indexOf(x.id)<0;}).map(function(x){return x.type==='chk'?x.label:x.label+' '+x.val+(x.unit?(/^[%\/]/.test(x.unit)?'':' ')+x.unit:'');}).join(', ');}
// ================= DKA / HHS =================
function dka(o){var T=o.tabs||{},P=o.P||{},E=o.D,d=Doc(),dose=false,m=tab(T,'main'),gl=o.gl||function(x){return D(x,1)+' mmol/l';},hm=o.nowHM||function(){return '';},alarm=[];
  if(m.touched>0&&E){var g=m.g,cfg=o.cfg||{},su=g('syrU2');if(!fin(su)||su<=0)su=+g('syrU');
    var i={w:P.w,glu:g('glu'),ket:g('ket'),ph:g('ph'),hco3:g('hco3'),k:g('k'),na:g('na'),cl:g('cl'),urea:g('urea'),sbp:g('sbp'),gcs:g('gcs'),knownDM:g('dm'),co:P.co,age:P.age,urine:g('urine'),
      syrUnits:su,syrMl:+g('syrMl'),hhsFalling:g('hhsf'),gluReduce:cfg.gluRed,rateReduced:cfg.rr,dex:cfg.dex};
    var r=E.plan(i),dx={dka:'DKA',hhs:'HHS',mixed:'DKA + HHS (mieszany) → leczyć jak DKA',none:'brak pełnych kryteriów DKA/HHS w podanych danych'}[r.mode];
    d.head('DKA / HHS – OCENA');
    d.line('Dane',fields(m,['syrU','syrU2','syrMl']));
    d.line('Rozpoznanie (moduł)',dx);
    (r.warn||[]).forEach(function(w){d.line('Uwaga',strip(w));});
    d.line('Wyliczenia',[fin(r.ag)?'luka anionowa '+D(r.ag,0)+' mmol/l':'',fin(r.osm)?'osmolalność efektywna '+D(r.osm,0)+' mOsm/kg':'',fin(r.naCorr16)?'Na⁺ skorygowane '+D(r.naCorr16,0)+' (Katz) / '+D(r.naCorr24,0)+' mmol/l (Hillier)':''].filter(Boolean).join(', '));
    if(r.k&&r.k.txt&&fin(i.k))d.line('Potas przed insuliną',strip(r.k.txt));
    var ins=r.insulin||{};
    if(r.mode!=='none'){
      d.head('LECZENIE');
      if(r.fluids&&r.fluids.length){dose=true;d.line('Płyny – NaCl 0,9%',r.shock?strip(r.fluids[0].txt):r.fluids.map(function(f,n){return (n+1)+'. 1 l / '+D(f.t/60,1)+' h = '+I(f.mlh)+' ml/h';}).join('; '));}
      if(ins.allowed){dose=true;var ph={start:'start – 0,1 j./kg/h',reduced:'zmniejszona',hhs:'HHS – 0,05 j./kg/h'}[ins.phase]||'';
        d.line('Insulina i.v. – pompa strzykawkowa ('+ph+')',D(ins.uh,1)+' j./h = '+D(ins.mlh,1)+' ml/h ('+D(ins.perKg,3)+' j./kg/h × '+D(P.w,0)+' kg)');
        d.line('Przygotowanie pompy',I(su)+' j. insuliny = '+D(ins.insMl,2)+' ml z pena 100 j./ml + '+D(ins.diluentMl,2)+' ml NaCl 0,9% → objętość końcowa '+I(i.syrMl)+' ml; stężenie '+D(ins.conc,3)+' j./ml; strzykawka na ok. '+D(ins.hoursSyringe,1)+' h (kolejną przygotuj wcześniej, bez przerywania wlewu)');
        var rr=ins.rows&&(r.mode==='hhs'?null:ins.rows.reduced),dx2=r.dextrose||{};
        if(dx2.needed)d.line('TERAZ (glikemia < '+gl(r.reduceThreshold)+')','zmniejsz insulinę do '+D(r.reducedRate,3)+' j./kg/h'+(rr?' = '+D(rr.uh,1)+' j./h = '+D(rr.mlh,1)+' ml/h':'')+' i dodaj glukozę '+dx2.pct+'% '+I(dx2.mlh)+' ml/h ('+D(dx2.gPerH,1)+' g/h) – nie odstawiaj insuliny');
        else if(rr)d.line('Po spadku glikemii < '+gl(r.reduceThreshold),'insulina '+D(r.reducedRate,3)+' j./kg/h = '+D(rr.uh,1)+' j./h = '+D(rr.mlh,1)+' ml/h + glukoza '+dx2.pct+'% '+I(dx2.mlh)+' ml/h ('+D(dx2.gPerH,1)+' g/h)');
      }else{d.line('Insulina i.v.',(ins.phase==='hold'?'WSTRZYMANA – ':'nie wyliczono – ')+strip(ins.reason||''));if(ins.phase==='hold')alarm.push('Insulina wstrzymana: '+strip(ins.reason||'')+'.');}
      ((r.syringe&&r.syringe.warn)||[]).forEach(function(w){d.line('Uwaga (strzykawka)',strip(w));});
      var mo=r.monitor,t0=hm();if(mo&&t0&&E.nextTime){var nx=function(x){return E.nextTime(t0,x.min)||'—';};d.line('Kolejne kontrole (od '+t0+')','glukoza '+nx(mo.glu)+', K⁺ / elektrolity '+nx(mo.k)+', gazometria + ketony '+nx(mo.gas)+', RR, tętno, GCS, diureza '+nx(mo.vitals));}
      var rs=r.resolution||{};if(rs.dka===true)d.line('','✔ Kryteria ustąpienia DKA spełnione.');if(rs.hhs===true)d.line('','✔ Kryteria ustąpienia HHS spełnione.');
    }
    if(r.mode!=='none'){d.C.push('HOSPITALIZACJA – '+dx+': wlew insuliny i.v. i płyny w obszarze monitorowanym (kontrole jak wyżej).');
      if(r.shock||(r.severe&&r.severe.length))d.C.push('Ciężka postać'+(r.severe&&r.severe.length?' ('+r.severe.join(', ')+')':'')+(r.shock?' / wstrząs':'')+' – OIT / HDU.');}
    else d.C.push('Brak pełnych kryteriów DKA/HHS w podanych danych – dalsza diagnostyka; miejsce leczenia: decyzja lekarza.');
    alarm.forEach(function(a){d.C.push(a);});
  }
  var rt=tab(T,'rates');if(rt.touched>0&&E){var g2=rt.g,q=E.rates({glu:g2('g0'),osm:g2('o0'),na:g2('n0')},{glu:g2('g1'),osm:g2('o1'),na:g2('n1')},g2('hrs'));
    if(q){d.head('TEMPO SPADKU');d.line('Dane',fields(rt));
      d.line('Tempo',[fin(q.gluPerH)?'glikemia '+I(q.gluPerH*18.016)+' mg/dl/h ('+D(q.gluPerH,1)+' mmol/l/h)':'',fin(q.osmPerH)?'osmolalność '+D(q.osmPerH,1)+' mOsm/kg/h':'',fin(q.naPer24)?'Na⁺ '+D(q.naPer24,1)+' mmol/l/24 h':''].filter(Boolean).join(', '));
      if(q.warn&&q.warn.length){d.line('ZA SZYBKO',q.warn.map(strip).join('; '));d.C.push('Zbyt szybkie tempo zmian – ryzyko obrzęku mózgu: zwolnij / zmodyfikuj leczenie, kontrola neurologiczna (GCS).');}}}
  var cf=tab(T,'cfg');if(cf.touched>0){d.head('USTAWIENIA LOKALNE (DO DECYZJI LEKARZA)');d.line('Zmienione',fields(cf));}
  return{text:d.done(),dose:dose};}
// ================= ANTYKOAGULACJA =================
var CI_NAMES=function(AB,kind,v){var C0=AB.CI[kind]||{abs:[],rel:[]},o={abs:[],rel:[]};C0.abs.forEach(function(c){if(v[c[0]])o.abs.push(c[1]);});C0.rel.forEach(function(c){if(v[c[0]])o.rel.push(c[1]);});return o;};
function noacLines(d,A,g,w,C){if(g('nb')!==true)return false;var drugs=[['dabi','dabigatran'],['api','apiksaban'],['riva','riwaroksaban'],['edo','edoksaban']].filter(function(x){return g(x[0])===true;}).map(function(x){return x[1];});
  d.line('Wskazanie','krwawienie zagrażające życiu / pilny zabieg');d.line('Lek',drugs.join(', ')+(fin(g('ld'))?'; ostatnia dawka '+D(g('ld'),0)+' mg':'')+(fin(g('hr'))?', '+D(g('hr'),1)+' h temu':''));var any=false;
  if(g('dabi')===true){any=true;d.line('Idarucyzumab (Praxbind)','5 g i.v. = 2 fiolki × 2,5 g/50 ml');}
  if(g('api')===true||g('riva')===true){any=true;var a=A.andex(g('api')===true?'api':'riva',g('ld'),g('hr'));d.line('Andeksanet (Ondexxya) – dawka '+a.reg,a.txt+(fin(g('ld'))?'':' (brak dawki → przyjęto dawkę wysoką wg ChPL)'));}
  if(g('api')===true||g('riva')===true||g('edo')===true){if(w>0){any=true;var p=A.pccXa(w);d.line(g('edo')===true&&g('api')!==true&&g('riva')!==true?'PCC (edoksaban)':'PCC – gdy brak andeksanetu',I(p.iu)+' j. = '+I(p.ml)+' ml (50 j./kg × '+D(w,0)+' kg); maks. DO WERYFIKACJI');}else d.line('PCC','nie wyliczono – brak masy ciała');}
  if(any)C.push('Krwawienie zagrażające życiu / pilny zabieg: odwrócenie antykoagulacji jak wyżej; hospitalizacja (OIT / oddział zabiegowy) – decyzja lekarza.');return any;}
function acoag(o){var T=o.tabs||{},P=o.P||{},A=o.A,AB=o.AB,d=Doc(),dose=false,w=P.w,fu=o.F||D,rev=false;
  var t=tab(T,'ufh');if(inc(t)&&w>0){var g=t.g,u=A.ufh(w,g('acs')===true?'acs':'vte');dose=true;
    d.head('HEPARYNA NIEFRAKCJONOWANA (UFH)'+(g('acs')===true?' – ACS':' – ŻChZZ / ZP'));d.line('Masa ciała',D(w,1)+' kg');d.line('Schemat',strip(u.txt));
    d.line('Bolus',I(u.bolus)+' j. i.v. = '+D(u.bolus/5000,2)+' ml (5000 j./ml)'+(u.bolusCap?' – zastosowano maksimum':''));
    d.line('Wlew',I(u.rate)+' j./h = '+D(u.mlh,1)+' ml/h'+(u.rateCap?' – zastosowano maksimum':''));
    d.line('Przygotowanie pompy','25 000 j. (5 ml) + 45 ml NaCl 0,9% → objętość końcowa 50 ml; stężenie 500 j./ml');
    d.line('Kontrola','aPTT po 6 h, dalej wg protokołu');
    d.C.push('Heparyna niefrakcjonowana wg wyliczenia powyżej – decyzja lekarza; kontrola aPTT po 6 h.');}
  t=tab(T,'enox');if(inc(t)&&w>0){var g1=t.g,e=A.enox(w,P.crcl,g1('proph')===true?'proph':'tx');dose=true;
    d.head('ENOKSAPARYNA (CLEXANE 100 mg/ml)'+(g1('proph')===true?' – PROFILAKTYKA':' – LECZENIE'));
    d.line('Dawka',I(e.dose)+' mg s.c. '+e.freq+' = '+D(e.ml,2)+' ml'+(fin(P.crcl)?' (CrCl '+I(P.crcl)+' ml/min)':''));if(e.note)d.line('Korekta',strip(e.note));if(e.note2)d.line('Uwaga',strip(e.note2));if(!fin(P.crcl))d.line('Uwaga','brak CrCl – dawka bez oceny funkcji nerek (podaj wiek i kreatyninę)');
    d.C.push('Enoksaparyna wg wyliczenia powyżej – decyzja lekarza.');}
  t=tab(T,'vka');if(t.touched>0){var g2=t.g,inr=g2('inr');d.head('WARFARYNA / VKA');if(fin(inr))d.line('INR',D(inr,1));
    if(g2('bleed')===true){d.line('Wskazanie','krwawienie zagrażające życiu / pilny zabieg');d.line('Witamina K','10 mg i.v. powoli');var pc=w>0?A.pccInr(w,inr):null;
      if(pc&&pc.iu){dose=true;d.line('4F-PCC (Beriplex, 25 j./ml)',I(pc.iu)+' j. = '+I(pc.ml)+' ml ('+pc.perKg+' j./kg × '+D(w,0)+' kg'+(pc.cap?', maksimum':'')+')');}else if(pc&&pc.txt)d.line('PCC',strip(pc.txt));else if(!(w>0))d.line('PCC','nie wyliczono – brak masy ciała');else d.line('PCC','nie wyliczono – brak INR');
      d.C.push('Odwrócenie VKA jak wyżej; hospitalizacja – decyzja lekarza.');}}
  t=tab(T,'noac');if(t.touched>0){d.head('NOAC – ODWRACANIE');if(noacLines(d,A,t.g,w,d.C))dose=true;}
  t=tab(T,'alt1');if(t.touched>0&&AB){var g3=t.g,v={};var C0=AB.CI.stemi;C0.abs.concat(C0.rel).forEach(function(c){v[c[0]]=g3('ci_'+c[0])===true;});
    var s=AB.stemi({w:w,age:P.age,hours:g3('hrs'),delayMin:g3('dly'),sbp:g3('sbp'),crcl:P.crcl,v:v});d.head('STEMI – FIBRYNOLIZA (ALTEPLAZA)');
    d.line('Dane',fields(t,Object.keys(v).map(function(k){return 'ci_'+k;})));var ci=CI_NAMES(AB,'stemi',v);if(ci.abs.length)d.line('Przeciwwskazania bezwzględne',ci.abs.join('; '));if(ci.rel.length)d.line('Przeciwwskazania względne',ci.rel.join('; '));
    if(s){var dec={lysis:'FIBRYNOLIZA',pci:'PPCI – bez fibrynolizy',transfer:'transport na PCI – bez fibrynolizy'}[s.decision]||'poza oknem';d.line('Decyzja modułu',dec+' – '+strip(s.txt));
      if(s.decision==='lysis'&&w>0){dose=true;d.line('Alteplaza (Actilyse) – '+strip(s.regimen),'łącznie '+D(s.total,1)+' mg');
        s.phases.forEach(function(p){d.line('   '+p.l,D(p.mg,1)+' mg = '+D(p.ml,1)+' ml'+(p.min?' w '+p.min+' min = '+D(p.mlh,1)+' ml/h':' (bolus 1–2 min)'));});
        d.line('Przygotowanie','50 mg proszku + 50 ml wody do wstrzykiwań = 1 mg/ml (fiolki wg dawki łącznej); pompa strzykawkowa / objętościowa; nie mieszać z heparyną w jednym zestawie');
        (s.warn||[]).forEach(function(x){d.line('Uwaga',strip(x));});var a=s.adj||{};d.line('Leki towarzyszące',[a.aspirin,a.clopidogrel,a.enox&&a.enox.txt,a.noP2Y12].filter(Boolean).map(strip).join('; '));
        d.C.push('Fibrynoliza wg wyliczenia powyżej; następnie natychmiastowy transport do ośrodka PCI (ocena ST po 60–90 min; brak poprawy → ratunkowa PCI).');}
      else if(s.decision==='lysis')d.line('Alteplaza','nie wyliczono – brak masy ciała');
      else d.C.push('STEMI: '+dec+' – pilny kontakt z ośrodkiem PCI.');}}
  t=tab(T,'prot');if(t.touched>0&&AB){var g4=t.g,pu=AB.protUfh({bolusU:g4('bol'),bolusMinAgo:g4('bm'),rateUh:g4('rate'),runningH:g4('run'),stoppedMinAgo:g4('stp')}),pe=AB.protEnox({mg:g4('enx'),hours:g4('he')});
    d.head('PROTAMINA');d.line('Dane',fields(t));
    if(pu){dose=true;var rg=function(a,b,k){return D(a,k)+(Math.abs(b-a)>(k?0.05:0.5)?'–'+D(b,k):'');};d.line('Protamina na UFH',rg(pu.loC,pu.hiC,0)+' mg = '+rg(pu.mlLo,pu.mlHi,1)+' ml (10 mg/ml) i.v. powoli ≥10 min (≤5 mg/min)'+(pu.cap?'; maksimum 50 mg na dawkę (obcięto)':''));
      d.line('Składowe',pu.parts.map(function(p){return p.t+': '+rg(p.lo,p.hi,1)+' mg';}).join('; '));d.line('Kontrola',strip(pu.txt).replace(/^Protamina [^;]*;\s*/,''));}
    if(pe){if(pe.none)d.line('Protamina na enoksaparynę',strip(pe.txt));else{dose=true;d.line('Protamina na enoksaparynę',I(pe.mg)+' mg = '+D(pe.ml,1)+' ml – '+strip(pe.txt));d.line("Jeśli krwawienie trwa",strip(pe.second).replace(/^Jeśli krwawienie trwa:\s*/,""));}}
    if(pu||(pe&&!pe.none))d.C.push('Odwrócenie heparyny protaminą jak wyżej – decyzja lekarza; kontrola aPTT / ACT.');}
  return{text:d.done(),dose:dose};}
// ================= ANAFILAKSJA =================
function ana(o){var T=o.tabs||{},P=o.P||{},B=o.B,d=Doc(),dose=false,w=P.w,t=tab(T,'a'),ob=tab(T,'obs');
  if(inc(t)&&B){var g=t.g,a=B.adrIM(w,P.age),f=B.anaFluid(w,P.age);d.head('ANAFILAKSJA – LECZENIE');d.line('Zaznaczono',fields(t));
    if(a.needW)d.line('Adrenalina i.m.','nie wyliczono – podaj masę dziecka (niemowlę <6 mies.: 0,01 mg/kg)');
    else{dose=true;d.line('Adrenalina i.m. (1 mg/ml)',D(a.mg,3)+' mg = '+D(a.ml,3)+' ml i.m. w przednio-boczną część uda; powtórz po 5 min, jeśli brak poprawy'+(!(w>0)&&!(P.age<12)?' (brak masy – dawka dorosłego)':'')+(a.note?'; '+strip(a.note):''));}
    d.line('Płyny',(Array.isArray(f.ml)?'500–1000 ml':I(f.ml)+' ml')+' krystaloidu i.v. szybko; powtarzaj wg odpowiedzi');
    if(g('refr')===true){var r=B.anaRefr(w);if(r){dose=true;var q=r.rec.filter(function(x){return x.def;})[0]||r.rec[0];
        d.line('Wlew adrenaliny i.v. (anafilaksja oporna)','start 5–10 µg/kg/h = '+D(r.ugkgminLo,3)+'–'+D(r.ugkgminHi,3)+' µg/kg/min = '+D(r.ugminLo,1)+'–'+D(r.ugminHi,1)+' µg/min');
        d.line('Przygotowanie pompy',strip(q.l)+': '+strip(q.prep)+' → '+D(q.mlhLo,1)+'–'+D(q.mlhHi,1)+' ml/h (start); miareczkuj co 2–5 min wg RR, HR, perfuzji; ciągłe EKG');}
      else d.line('Wlew adrenaliny i.v.','nie wyliczono – brak masy ciała');}
    if(g('hypo')===true){var n=B.anaNor(w,0.05);d.line('Noradrenalina (decyzja anestezjologa)',n?'0,05 µg/kg/min = '+D(n.ugmin,1)+' µg/min = '+D(n.mlh,1)+' ml/h; '+strip(n.prep):'nie wyliczono – brak masy ciała');if(n)dose=true;}
    if(g('bb')===true){var gl=B.anaGlucagon();d.line('Glukagon (β-bloker)',strip(gl.txt)+'; '+strip(gl.warn));}
    if(g('bron')===true)d.line('Skurcz oskrzeli','salbutamol w nebulizacji po adrenalinie – dawka wg protokołu SOR (DO WERYFIKACJI)');
    if(g('upper')===true)d.line('Obrzęk górnych dróg oddechowych','adrenalina w nebulizacji wspomagająco (dawka wg protokołu); wczesna intubacja – anestezjolog');
    if(g('refr')===true||g('hypo')===true)d.C.push('Anafilaksja oporna / hipotensja: anestezjolog, OIT.');}
  if(ob.touched>0&&B){var g2=ob.g,x=B.anaObs({doses:g2('doses'),biph:g2('biph'),severe:g2('sev'),asthma:g2('asth'),absorb:g2('absorb'),night:g2('night'),access:g2('access'),pens:g2('pens'),infusion:g2('inf')});
    d.head('OBSERWACJA / WYPIS');d.line('Dane',fields(ob));
    if(x){if(x.hosp){d.line('Wynik','HOSPITALIZACJA – '+strip(x.why));d.C.push('HOSPITALIZACJA – '+strip(x.why)+'.');}
      else{var u=B.obsUntil(g2('anaTres'),x.h);d.line('Obserwacja','≥ '+x.h+' h od ustąpienia objawów'+(u?(u.active?' – do '+u.label:' – czas minął ('+u.label+')'):'')+' ('+strip(x.why)+')');
        d.C.push('Obserwacja ≥ '+x.h+' h od ustąpienia objawów'+(u?(u.active?' – do '+u.label:' – zakończona ('+u.label+')'):'')+'; wypis po tym czasie przy stabilnym stanie – decyzja lekarza (2 autowstrzykiwacze + instruktaż, poradnia alergologiczna).');}}}
  if(d.L.length&&!d.C.length)d.C.push('Obserwacja po anafilaksji – czas wg zakładki „Obserwacja / wypis” (RCUK 2021); miejsce leczenia – decyzja lekarza.');
  return{text:d.done(),dose:dose};}
// ================= TRANSFUZJOLOGIA =================
function transf(o){var T=o.tabs||{},P=o.P||{},TR=o.T,TB=o.TB,A=o.A,d=Doc(),dose=false,w=P.w;function n0(a){return a.map(function(x){return x==='O'?'0':x;}).join(', ');}
  var t=tab(T,'g');if(t.touched>0&&TR){var g=t.g,abo=g('abo'),rh=g('rh');d.head('ZGODNOŚĆ ABO / RhD');d.line('Dane',fields(t));
    if(!abo||!rh){var e=TR.emergency(P.sex,P.age);d.line('Grupa nieznana – tryb ratunkowy','KKCz '+strip(e.rbc)+'; osocze '+strip(e.plasma)+(e.cb?'; kobieta <50 lat / płeć nieznana → tylko RhD−':''));}
    else{var c=TR.compat(abo,rh,P.sex,P.age);d.line('KKCz',n0(c.rbc)+' · '+c.rbcRh.join(' / ')+(rh==='-'&&c.childbearing?' (kobieta <50 lat: wyłącznie RhD−)':''));d.line('Osocze (FFP)',n0(c.plasma)+' · RhD bez znaczenia');d.line('KKP',n0(c.plt)+' (preferowana grupa identyczna) · '+strip(c.pltRh));}
    d.line('','Próba zgodności i kontrola przyłóżkowa AB0 – wg rozporządzenia MZ.');}
  t=tab(T,'d');if(t.touched>0&&TR){var g1=t.g,hb=g1('hb');d.head('DAWKI I PROGI');d.line('Dane',fields(t));
    if(fin(hb)){var th=TR.threshold(g1('ctx')),need=hb<th.t||(g1('ctx')==='acs'&&hb<=8),u=TR.rbcUnits(hb,g1('hbt'));d.line('KKCz – próg '+th.t+' g/dl',need?(u>0?u+' j. KKCz (1 j. ≈ +1 g/dl u ~70 kg; przetaczaj po 1 j. i oceniaj)':'wskazane – podaj Hb docelowe'):'powyżej progu – brak wskazań przy stabilnym pacjencie');if(need&&u>0)dose=true;if(need)d.C.push('KKCz wg wyliczenia (próg '+th.t+' g/dl) – decyzja lekarza; kontrola Hb po każdej jednostce.');}
    if(g1('coag')===true){var f=TR.ffp(w);if(f){dose=true;d.line('Osocze (FFP)',I(f.ml)+' ml (15 ml/kg × '+D(w,0)+' kg) – krwawienie z koagulopatią');}else d.line('Osocze (FFP)','nie wyliczono – brak masy ciała');}
    if(fin(g1('fib'))){var fb=TR.fib(w,g1('fib'));d.line('Fibrynogen '+D(g1('fib'),1)+' g/l',fb.need?(w>0?'koncentrat fibrynogenu '+D(fb.concLo,1)+'–'+D(fb.concHi,1)+' g (25–50 mg/kg) lub krioprecypitat':'suplementacja wskazana – brak masy ciała'):'≥1,5 g/l – bez suplementacji');if(fb.need&&w>0)dose=true;}
    if(fin(g1('plt'))){var p=TR.plt(g1('plt'),g1('pctx'));d.line('KKP – próg '+p.t,p.need?strip(p.dose):'powyżej progu – brak wskazań');if(p.need)dose=true;}}
  t=tab(T,'rbc');if(t.touched>0&&TB){var g2=t.g,r=TB.rbc({kind:g2('kind'),hb:g2('hb'),w:w,burdened:g2('burd'),symptomatic:g2('symp'),unstable:g2('unst'),maxShift:g2('mx')});
    d.head('KKCZ – WSKAZANIA');d.line('Dane',fields(t));if(r){d.line('Wynik',(r.need?'WSKAZANE':'brak wskazań')+' – '+strip(r.txt)+' Próg '+r.threshold+' g/dl.');
      if(r.kind==='chronic'&&r.need){if(r.unitsTotal){dose=true;d.line('Liczba jednostek',r.unitsNow+' j. KKCz teraz'+(r.capped?' (do celu orientacyjnie '+r.unitsTotal+' j.; limit lokalny '+r.maxShift+' j./dyżur)':' (do celu orientacyjnie '+r.unitsTotal+' j.; ≈ +'+D(r.incPerUnit,2)+' g/dl/j.)'));}else d.line('Liczba jednostek','nie wyliczono – brak masy ciała');}
      if(r.need&&!d.C.some(function(c){return /^KKCz/.test(c);}))d.C.push('KKCz wskazane – kontrola Hb po każdej jednostce; decyzja lekarza.');}}
  t=tab(T,'plt');if(t.touched>0&&TB){var g3=t.g,q=TB.platelets({ctx:g3('ctx'),plt:g3('plt'),thromboType:g3('tt'),bleeding:g3('bleed'),lifeThreat:g3('life')}),v={};(TB.IRR||[]).forEach(function(x){v[x[0]]=g3('ir_'+x[0])===true;});var ir=TB.irradiated(v,g3('urg'));
    d.head('TROMBOCYTOPENIA / KKP');d.line('Dane',fields(t,Object.keys(v).map(function(k){return 'ir_'+k;})));
    if(q){d.line('Wynik',(q.avoid?'UNIKAJ KKP':q.need?'KKP WSKAZANE':'KKP niewskazane')+' – '+strip(q.txt)+(q.threshold?' Próg '+q.threshold+' ×10⁹/l.':''));if(q.need&&q.dose){dose=true;d.line('Dawka',strip(q.dose));}(q.warn||[]).forEach(function(x){d.line('Uwaga',strip(x));});if(q.avoid)d.C.push('KKP przeciwwskazane w tej sytuacji – konsultacja hematologiczna.');}
    var irs=(TB.IRR||[]).filter(function(x){return v[x[0]];}).map(function(x){return x[1];});if(irs.length||g3('urg')===true){d.line('Napromieniowanie – wskazania zaznaczone',irs.join('; '));d.line('Napromieniowane składniki',strip(ir.txt)+(ir.urgentTxt?' '+strip(ir.urgentTxt):''));}}
  t=tab(T,'gcsf');if(t.touched>0&&TB){var g4=t.g,anc=g4('anc'),fn=TB.fn({anc:anc,temp:g4('tmp'),feverHour:g4('fh'),expectedFall:g4('fall')});d.head('NEUTROPENIA / G-CSF');d.line('Dane',fields(t));
    if(fn){d.line('Neutropenia','ANC '+D(anc,2)+' ×10⁹/l – '+strip(fn.grade)+(fn.fn?'; GORĄCZKA NEUTROPENICZNA – '+strip(fn.act):''));
      if(fn.fn){var m={sym:g4('sym'),age:P.age,hypo:g4('hypo'),copd:g4('copd'),fungal:g4('fungal'),dehydr:g4('dehydr'),outpt:g4('outpt')};
        var di=TB.disposition({anc:anc,temp:g4('tmp'),feverHour:g4('fh'),expectedFall:g4('fall'),solid:g4('solid'),haemMalig:g4('haem'),hsct:g4('hsct'),organ:g4('organ')||g4('hypo'),expectedProlonged:g4('prol'),noSupport:g4('nosup'),noOral:g4('nooral'),m:m,c:{ecog2:g4('ecog'),gluMmol:g4('cglu'),copd:g4('copd'),cvd:g4('cvd'),muc:g4('muc'),mono:g4('mono')}});
        if(di.res==='hosp'){d.line('Kwalifikacja','HOSPITALIZACJA – '+di.reasons.map(strip).join('; ')+' (MASCC '+di.mascc.score+(di.cisne?', CISNE '+di.cisne.score:'')+')');d.C.push('Gorączka neutropeniczna: HOSPITALIZACJA, antybiotyk empiryczny wg protokołu – decyzja lekarza.');}
        else if(di.res==='amb'){d.line('Kwalifikacja','MOŻE AMBULATORYJNIE – '+strip(di.txt)+' (MASCC '+di.mascc.score+(di.cisne?', CISNE '+di.cisne.score+' ('+di.cisne.cls+')':'')+')');d.C.push('Gorączka neutropeniczna niskiego ryzyka – możliwe leczenie ambulatoryjne; decyzja lekarza prowadzącego.');}}
      var mode=g4('mode');if(mode){var hi={};(TB.CSF_HIGH||[]).forEach(function(c){hi[c[0]]=g4('hi_'+c[0])===true;});var gc=TB.gcsf({mode:mode,fnRisk:g4('fnr'),riskFactors:g4('rfc'),anc:anc,febrile:fn.fn,w:w,hi:hi,product:g4('prod')});
        if(gc){d.line('G-CSF – '+(mode==='treatment'?'leczenie':'profilaktyka'),({YES:'ZALECANY',CONSIDER:'ROZWAŻ',NO:'niezalecany rutynowo'}[gc.rec])+' – '+strip(gc.txt));if(gc.rec!=='NO'){dose=true;d.line('Dawka G-CSF',strip(gc.dose)+(gc.timing?'; '+strip(gc.timing):''));}(gc.warn||[]).forEach(function(x){d.line('Uwaga',strip(x));});}}}}
  t=tab(T,'m');if(t.touched>0&&TR){var g5=t.g,mt=TR.mtp(),x=TR.txa(g5('th'));d.head('MASYWNE PRZETOCZENIE');d.line('Dane',fields(t,['rg','rph','dm','pg','ps','ratio']));
    d.line('Protokół',strip(mt.ratio)+'; '+strip(mt.targets));if(g5('gi')===true)d.line('Kwas traneksamowy','krwawienie z GI – TXA niezalecany (HALT-IT)');else{d.line('Kwas traneksamowy (uraz)',strip(x.txt));if(x.ok)dose=true;}
    if(TB){var mo=TB.mtp({rbcGiven:g5('rg'),rbcPerHour:g5('rph'),deliveryMin:g5('dm'),pltGiven:g5('pg'),pltStock:g5('ps'),ratioRbcPerPlt:+g5('ratio')});if(mo){dose=true;d.line('Zamówienie KKP (RCKiK Kraków)','zamów '+mo.order+' dawek KKP; przewidywane KKCz do dostawy '+D(mo.projectedRbc,1)+' j.; KKP łącznie '+mo.pltTotal+' dawek; osocze '+mo.plasmaUnits+' j. (1:'+mo.plasmaRatio+')');}}
    d.C.push('Masywne przetoczenie: protokół MTP, OIT / blok operacyjny – decyzja lekarza.');}
  t=tab(T,'r');if(t.touched>0&&TR){var g6=t.g,re=TR.reaction({fever:g6('fever'),fever2:g6('fever2'),urt:g6('urt'),hypo:g6('hypo'),dysp:g6('dysp'),back:g6('back'),ana:g6('ana')});d.head('REAKCJA POPRZETOCZENIOWA');d.line('Objawy',fields(t));
    if(re.lvl!=='ok'){d.line('Ocena',re.red.concat(re.or).map(strip).join(', '));d.line('Postępowanie',strip(re.act));d.C.push(re.lvl==='red'?'Ciężka reakcja poprzetoczeniowa: przerwij przetoczenie, postępowanie jak wyżej, zgłoszenie do banku krwi; hospitalizacja – decyzja lekarza.':'Reakcja poprzetoczeniowa: postępowanie jak wyżej – decyzja lekarza.');if(g6('ana')===true)d.C.push('Anafilaksja → moduł Anafilaksja (adrenalina i.m.).');}}
  t=tab(T,'n');if(t.touched>0&&A){d.head('ODWRACANIE NOAC');if(noacLines(d,A,t.g,w,d.C))dose=true;}
  return{text:d.done(),dose:dose};}
// ================= NEUROLOGIA =================
function nlab(s){return String(s||'').replace(/\s*\([^)]*\)/g,'').replace(/\s+/g,' ').trim();}
function nfields(t,excl){excl=(excl||[]).concat(['pname','adm']);return (t.fields||[]).filter(function(x){return excl.indexOf(x.id)<0;}).map(function(x){var l=nlab(x.label);return x.type==='chk'?l:l+' '+nlab(x.val)+(x.unit?' '+x.unit:'');}).join(', ');}
function neuro(o){var T=o.tabs||{},P=o.P||{},N=o.N,DM=o.DM,d=Doc(),dose=false,w=P.w,gl=o.gl||function(x){return D(x,0)+' mmol/l';};if(!N)return{text:'',dose:false};
  var tn=tab(T,'n'),nv={},nFill=false;if(tn.touched>0){N.NIH.forEach(function(it){var v=tn.g('n'+it[0]);if(v!=null&&v!=='')nv[it[0]]=String(v);});nFill=Object.keys(nv).some(function(k){return nv[k]!=='0'&&nv[k]!=='';});}
  var nihT=nFill?N.nihss(nv):null;
  var t=tab(T,'a');if(t.touched>0){var g=t.g,gm=fin(g('glu'))?g('glu')*18.016:NaN,nih=fin(g('nih'))?g('nih'):nihT?nihT.score:NaN;
    var sy={foc:g('foc'),aph:g('aph'),neg:g('neg'),gaze:g('gaze')},auto=nFill?N.raceFromNihss(nv):N.raceFromSym(sy),rv={};Object.keys(N.RACE_MAX).forEach(function(k){var e=g('rc_'+k);rv[k]=(e!==''&&e!=null&&!(typeof e==='number'&&!fin(e)))?e:auto[k];});var rc=N.race(rv),hv=g('hints')||'';
    var inp={h:g('h'),wake:g('wake'),unk:g('unk'),s:{foc:g('foc'),aph:g('aph'),neg:g('neg'),gaze:g('gaze'),vf:g('vf'),post:g('post'),loc:g('loc'),head:g('head'),hdp:g('hdp'),seiz:g('seiz'),neck:g('neck')},o:{ex:g('ex'),inst:g('inst'),flex:g('flex')},
      cvt:{young:g('cy'),oc:g('coc'),thr:g('cthr'),pap:g('cpap'),inf:g('cinf')},tu:{prog:g('tprog'),ca:g('tca'),morn:g('tmorn'),hern:g('thern')},ac:g('ac'),acH:g('ach'),gluMg:gm,sbp:g('sbp'),dbp:g('dbp'),nihss:nih,race:rc.n?rc.score:NaN,hints:hv,mimic:g('mim'),sex:P.sex,age:P.age};
    var r=N.stroke(inp);d.head('PODEJRZENIE UDARU – ALGORYTM');d.line('Dane',nfields(t,['glu','nih']));if(fin(g('glu')))d.line('Glukoza',gl(g('glu')));
    if(fin(nih))d.line('NIHSS',D(nih,0)+(fin(g('nih'))?'':' (z zakładki NIHSS)'));if(rc.n)d.line('RACE',rc.score+'/9'+(rc.lvo?' – ≥5 → podejrzenie LVO':''));if(hv)d.line('HINTS',hv==='central'?'centralny':'obwodowy');
    var ok=[];(r.list||[]).forEach(function(x){if(x.lvl==='red'||x.lvl==='orange')d.C.push(strip(x.t)+': '+strip(x.d));else ok.push(strip(x.t));});if(ok.length)d.C.push('Ponadto wg protokołu: '+ok.join(', ')+'.');}
  if(nihT){d.head('NIHSS');var it=N.NIH.filter(function(x){return nv[x[0]]&&nv[x[0]]!=='0';}).map(function(x){var k=nv[x[0]];return nlab(x[1])+': '+(k==='UN'?'UN – nie do oceny':k+' – '+(x[2][+k]||''));});d.line('Wynik',nihT.score+' / 42 – '+strip(nihT.sev));if(it.length)d.line('Pozycje',it.join('; '));}
  t=tab(T,'t');if(inc(t)){var g1=t.g,wi=N.window(g1('h'),g1('wake'),g1('mm')),cv={};N.CI_ABS.concat(N.CI_REL).forEach(function(c){cv[c[0]]=g1((N.CI_ABS.indexOf(c)>=0?'a_':'r_')+c[0]);});var ci=N.ci(cv),cg=N.coag(g1('inr'),g1('plt'));ci.abs=ci.abs.concat(cg.abs);
    var ciIds=N.CI_ABS.map(function(c){return 'a_'+c[0];}).concat(N.CI_REL.map(function(c){return 'r_'+c[0];}));d.head('TROMBOLIZA');var df=nfields(t,ciIds.concat(['glu']));if(df)d.line('Dane',df);if(fin(g1('glu')))d.line('Glukoza',gl(g1('glu')));
    if(wi.lvl)d.line('Okno czasowe',strip(wi.txt));if(ci.abs.length)d.line('PRZECIWWSKAZANIA',ci.abs.map(strip).join('; '));if(ci.rel.length)d.line('Ostrożnie (względne)',ci.rel.map(strip).join('; '));(cg.warn||[]).forEach(function(x){d.line('INR',strip(x));});
    var b=N.bp(g1('sbp'),g1('dbp'),g1('ph'));if(b.lvl)d.line('RR '+(g1('ph')==='post'?'po':'przed')+' trombolizą',D(g1('sbp'),0)+'/'+D(g1('dbp'),0)+' mmHg; cel ≤'+b.lim[0]+'/'+b.lim[1]+(b.hi?(g1('ph')==='post'?' – obniż RR (urapidil/labetalol), kontrola co 15 min':' – obniż RR przed podaniem; bez obniżenia NIE podawaj'):''));
    var gm1=g1('glu')*18.016,gq=N.glu(gm1);if(gq.lvl&&gq.lvl!=='ok')d.line('Glikemia',strip(gq.txt));
    var bad=wi.lvl==='red'||ci.abs.length||!wi.lvl,pend=(b.hi&&g1('ph')!=='post')||gq.lvl==='red';
    if(bad){d.line('Leki trombolityczne',wi.lvl?'brak wskazań wg wprowadzonych danych':'nie wyliczono – brak czasu zachorowania');d.C.push(wi.lvl?'Tromboliza: brak wskazań wg wprowadzonych danych – decyzja neurologa.':'Tromboliza: uzupełnij czas zachorowania.');}
    else if(!(w>0))d.line('Leki trombolityczne','nie wyliczono – brak masy ciała');
    else{var a=N.alteplase(w),k=N.tenecteplase(w);dose=true;
      d.line('Alteplaza (Actilyse 1 mg/ml) 0,9 mg/kg','łącznie '+D(a.tot,1)+' mg = '+D(a.tot,1)+' ml'+(a.capped?' (masa >100 kg → dawka maks. 90 mg)':'')+'; bolus 10%: '+D(a.bol,1)+' ml i.v. w 1 min; reszta '+D(a.inf,1)+' ml w 60 min = '+D(a.mlh,1)+' ml/h (pompa)');
      d.line('Przygotowanie alteplazy','50 mg proszku + 50 ml wody do wstrzykiwań = 1 mg/ml (fiolki wg dawki łącznej); pobrać łącznie '+D(a.tot,1)+' ml');
      d.line('Tenekteplaza (Metalyse 5 mg/ml) – alternatywa',D(k.mg,1)+' mg = '+D(k.ml,1)+' ml jednorazowy bolus 5–10 s (przedział masy '+strip(k.band)+')'+(k.capped?'; masa ≥90 kg → dawka maks. 25 mg':''));
      if(pend)d.line('Uwaga','podać dopiero po wyrównaniu RR / glikemii');
      d.C.push('Tromboliza wg wyliczenia powyżej'+(pend?' po wyrównaniu RR / glikemii':'')+' – decyzja neurologa; RR i stan neurologiczny co 15 min.');}}
  t=tab(T,'i');if(t.touched>0){var g2=t.g,vol=fin(g2('vol'))?g2('vol'):N.abc2(g2('ca'),g2('cb'),g2('cc'));d.head('KRWOTOK ŚRÓDMÓZGOWY (ICH)');d.line('Dane',nfields(t));
    if(fin(vol))d.line('Objętość krwiaka',D(vol,0)+' ml'+(fin(g2('vol'))?'':' (ABC/2)'));var gcs=g2('gcs');
    if(fin(gcs)&&gcs>=3&&fin(vol)&&fin(P.age)){var s=N.ichScore({gcs:gcs,vol:vol,ivh:g2('ivh'),infra:g2('inf'),age:P.age});d.line('ICH score',s.score+' / 6 – śmiertelność 30 dni ~'+s.mort+'% (nie służy do ograniczania leczenia)');}
    var bp=N.ichBP(g2('sbp'));if(bp.lvl)d.line('RR – cel SBP ~140',strip(bp.txt));
    if(g2('ac')===true){d.line('Antykoagulacja','odwróć natychmiast: VKA → PCC + wit. K; dabigatran → idarucyzumab; anty-Xa → andeksanet / PCC (dawki: moduł Antykoagulacja)');d.C.push('ICH na leczeniu przeciwkrzepliwym: natychmiastowe odwrócenie antykoagulacji.');}
    d.C.push('Krwotok śródmózgowy: pilna konsultacja neurochirurgiczna / neurologiczna, HOSPITALIZACJA – decyzja lekarza.');}
  t=tab(T,'p');if(t.touched>0){var g3=t.g;d.head('ROKOWANIE / TIA / GCS');var m=g3('mrs');if(m!=null&&m!==''&&fin(+m)&&t.fields.some(function(x){return x.id==='mrs';}))d.line('mRS',strip(N.MRS[+m]));
    if(fin(P.age)&&fin(g3('sbp'))&&fin(g3('dbp'))&&fin(g3('dur'))){var a2=N.abcd2({age:P.age,sbp:g3('sbp'),dbp:g3('dbp'),clin:g3('clin'),dur:g3('dur'),dm:g3('dm')});d.line('ABCD²',a2.score+' / 7 – ryzyko '+strip(a2.risk));d.C.push('TIA (ABCD² '+a2.score+'): pilna diagnostyka niezależnie od wyniku – decyzja lekarza.');}
    else{var pf=nfields(t,['mrs','ge','gv','gm']);if(pf)d.line('Dane',pf);}
    var gc=N.gcs(+g3('ge')||NaN,+g3('gv')||NaN,+g3('gm')||NaN);if(gc)d.line('GCS',gc.score+' – '+strip(gc.txt));}
  t=tab(T,'d');if(t.touched>0){var g4=t.g;d.head('MAJACZENIE / FUNKCJE POZNAWCZE');var r4=N.fourAT({alert:g4('fa'),amt4:+g4('fm'),att:+g4('ft'),acute:g4('fc')});d.line('Dane',nfields(t));d.line('4AT',r4.score+' / 12 – '+strip(r4.txt));
    var r1=fin(g4('amts'))?N.amts(g4('amts')):null;if(r1)d.line('AMTS',r1.score+' / 10 – '+(r1.abn?'nieprawidłowy (≤6)':'prawidłowy'));var mc=g4('mcr');if(mc!==''&&mc!=null&&fin(+mc)){var r2=N.minicog(+mc,g4('mcc'));d.line('Mini-Cog',r2.score+' / 5 – '+(r2.pos?'dodatni (<3)':'ujemny'));}
    if(r4.score>=4)d.C.push('4AT ≥4 – możliwe majaczenie: szukaj przyczyny (infekcja, leki, metaboliczne) – decyzja lekarza.');}
  t=tab(T,'d2');if(t.touched>0&&DM){var g5=t.g,v={};DM.AMTS.forEach(function(x){v[x[0]]=g5(x[0])===true;});var ra=DM.amts(v);d.head('AMTS (ROZSZERZONE)');var okI=DM.AMTS.filter(function(x){return v[x[0]];}).map(function(x){return x[1];});if(okI.length)d.line('Poprawnie',okI.join('; '));if(ra)d.line('Wynik',ra.score+' / 10 – '+strip(ra.txt));}
  return{text:d.done(),dose:dose};}
return{dka:dka,acoag:acoag,ana:ana,transf:transf,neuro:neuro,fields:fields,tab:tab,inc:inc,strip:strip};});
