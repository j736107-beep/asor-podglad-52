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
return{dka:dka,fields:fields,tab:tab,inc:inc,strip:strip};});
