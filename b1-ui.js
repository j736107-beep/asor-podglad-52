// ETAP B1 – warstwa UI: DKA/HHS (pompa insuliny), Elektrolity (tabela reguł), alteplaza + protamina, pompa katecholamin (AHF), transfuzjologia.
// Silniki obliczeń: calc/dkaB1.js, elyteB1.js, acoagB1.js, transfB1.js (pompy: mod/pompy) (testowane w Node: tests/etapB1.cjs).
(function(){
var C=SK.core,F=C.fmt,N=C.num,U=SKM.util,inp=U.inp,bx=U.bx,src=U.src,chk=U.chk,tabbed=U.tabbed,store=U.store;
function h(s){return U.h(s).replace(/(\d)\.(\d)/g,'$1,$2');} // przecinek dziesiętny w tekstach z silników
var D=SK.dkaB1,E=SK.elyteB1,A=SK.acoagB1,T=SK.transfB1,UN=SK.units;
function sys(){return window.SKS&&SKS.S&&SKS.S.units==='si'?'si':'conv';}
function dw(t){return ' <span class="dw">'+(t||'DO DECYZJI LEKARZA')+'</span>';}
function sel(id,lab,opts){return '<label>'+lab+' <select id="'+id+'">'+opts.map(function(o){return '<option value="'+o[0]+'">'+o[1]+'</option>'}).join('')+'</select></label>';}
function sub(t){return '<h4 class="b1h">'+t+'</h4>';}
function srcl(t){return '<div class="b1src">Źródło: '+t+'</div>';}
function nz(x){return typeof x==='number'&&isFinite(x);}
function gl(mmol){if(!nz(mmol))return '—';var mg=Math.round(mmol*18.016),mm=F(mmol,1);return sys()==='si'?mm+' mmol/l ('+mg+' mg/dl)':mg+' mg/dl ('+mm+' mmol/l)';}
function nowHM(){var d=new Date();return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}
function box(cls,t,b){return bx(cls,t,b);}
function tbl(head,rows,cls){return '<div class="b1tw"><table class="b1t'+(cls?' '+cls:'')+'"><thead><tr>'+head.map(function(x){return '<th>'+x+'</th>'}).join('')+'</tr></thead><tbody>'+rows.map(function(r){var c=r.cls||'';var cells=r.cells||r;return '<tr'+(c?' class="'+c+'"':'')+'>'+cells.map(function(x){return '<td>'+x+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>';}
function allSrc(S){return Object.keys(S).map(function(k){return S[k]});}
// ---- styl ----
(function(){var s=document.createElement('style');s.textContent='.b1h{width:100%;margin:10px 0 2px;font-size:1rem;color:#55318f}.b1src{font-size:.82rem;color:#556;margin-top:6px}.b1src:before{content:"";}'+
 '.b1tw{overflow-x:auto;margin:6px 0}.b1t{border-collapse:collapse;width:100%;font-size:.92rem}.b1t th,.b1t td{border:1px solid #d6cdea;padding:5px 8px;text-align:left;vertical-align:top}.b1t th{background:#f1ecfb}.b1t tr.act td{background:#e6f6ea;font-weight:700}.b1t tr.warn td{background:#fff4e0}'+
 '.b1ci{width:100%;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:4px 14px;margin:2px 0 8px}.b1ci label{display:flex;gap:8px;align-items:flex-start;padding:6px 8px;border:1px solid #e1d9f2;border-radius:8px;min-height:44px;line-height:1.25;cursor:pointer;background:#fff}.b1ci label input{margin-top:3px;min-width:22px;min-height:22px}'+
 '.b1ci.abs label{border-color:#e9a0a8}.b1ci.rel label{border-color:#f1c27a}.b1big{font-size:1.5rem;font-weight:800}.b1pair{display:flex;gap:18px;flex-wrap:wrap;align-items:baseline}.b1pair span{font-size:1.5rem;font-weight:800}.b1full{width:100%}.b1dw{display:inline-block;background:#fff0c9;border:1px solid #e3b341;border-radius:6px;padding:0 6px;font-size:.78rem;font-weight:700;margin-left:4px}'+
 '.b1btnrow{display:flex;gap:8px;flex-wrap:wrap}.b1sec{width:100%;border-top:1px dashed #cdbfe8;margin-top:4px}';document.head.appendChild(s);})();
function ciHtml(kind){var C0=A.CI[kind];return '<div class="b1full"><b class="r">Przeciwwskazania BEZWZGLĘDNE</b> <span class="mut">(kliknij, jeśli występują)</span></div><div class="b1ci abs">'+C0.abs.map(function(c){return '<label><input type="checkbox" id="ci_'+c[0]+'"> '+c[1]+'</label>'}).join('')+'</div><div class="b1full"><b class="o">Przeciwwskazania WZGLĘDNE</b> <span class="mut">(kliknij, jeśli występują)</span></div><div class="b1ci rel">'+C0.rel.map(function(c){return '<label><input type="checkbox" id="ci_'+c[0]+'"> '+c[1]+'</label>'}).join('')+'</div>';}
function ciRead(kind,g){var v={};var C0=A.CI[kind];C0.abs.concat(C0.rel).forEach(function(c){v[c[0]]=g('ci_'+c[0])===true});return v;}
function ciBox(o){var H='';if(o.ci.abs.length)H+=box('red','Przeciwwskazania bezwzględne ('+o.ci.abs.length+')','<ul><li>'+o.ci.abs.join('</li><li>')+'</li></ul>');if(o.ci.rel.length)H+=box('orange','Przeciwwskazania względne ('+o.ci.rel.length+')','<ul><li>'+o.ci.rel.join('</li><li>')+'</li></ul><div class="mut">Ocena ryzyka i korzyści przez lekarza prowadzącego.</div>');return H;}
// =========================== DKA / HHS ===========================
function cfgRead(){var s=store('dka_cfg').get();var gr=N(s.gluRed);return{gluRed:isFinite(gr)&&gr>0?gr:undefined,rr:+(s.rr||0.05),dex:+(s.dex||10)};}
var DKA=tabbed({id:'dka',icon:'🍬',name:'Kwasica ketonowa (DKA) / Stan hiperosmolarny (HHS)'},'Cukrzycowa kwasica ketonowa (DKA)<br>Hiperglikemiczny stan hiperosmolarny (HHS) <small class="mut">– pompa insuliny</small>',[['main','Rozpoznanie i pompa'],['rates','Tempo spadku (HHS / obrzęk mózgu)'],['cfg','Ustawienia lokalne']],
 function(t){
  if(t==='main')return inp('glu','Glukoza','@glu')+inp('ket','Ketony (BHB)','mmol/l')+inp('ph','pH','')+inp('hco3','HCO₃⁻','mmol/l')+inp('k','K⁺','mmol/l')+inp('na','Na⁺','mmol/l')+inp('cl','Cl⁻','mmol/l')+inp('urea','Mocznik (urea)','@urea')+inp('sbp','SBP','mmHg')+inp('urine','Diureza','ml/h')+SKGCS.field(false)+chk('dm','znana cukrzyca')+chk('hhsf','HHS: glikemia nie spada wystarczająco na samych płynach')+
   sub('Pompa insuliny (NovoRapid 100 j./ml z pena)')+sel('syrU','Ilość insuliny w strzykawce',[['50','50 j. (0,5 ml)'],['100','100 j. (1 ml)'],['25','25 j.'],['20','20 j.'],['10','10 j.']])+inp('syrU2','…lub inna ilość (nadpisuje)','j.')+sel('syrMl','Strzykawka (objętość końcowa)',[['50','50 ml'],['20','20 ml']]);
  if(t==='rates')return inp('g0','Glikemia – poprzednia','@glu')+inp('g1','Glikemia – obecna','@glu')+inp('o0','Osmolalność – poprzednia','mOsm/kg')+inp('o1','Osmolalność – obecna','mOsm/kg')+inp('n0','Na⁺ – poprzednie','mmol/l')+inp('n1','Na⁺ – obecne','mmol/l')+inp('hrs','Odstęp czasu','h');
  return inp('gluRed','Próg zmniejszenia insuliny (glikemia poniżej)','@glu','250 mg/dl')+sel('rr','Insulina po zmniejszeniu',[['0.05','0,05 j./kg/h (domyślnie)'],['0.02','0,02 j./kg/h'],['0.03','0,03 j./kg/h'],['0.04','0,04 j./kg/h'],['0.1','0,1 j./kg/h (bez zmniejszania)']])+sel('dex','Glukoza równolegle',[['10','10% (JBDS 2023)'],['5','5%']]);},
 function(t,g,P,X){
  if(t==='cfg')return{H:box('orange','Ustawienia lokalne – DO DECYZJI LEKARZA','<p>Wartości domyślne pochodzą z wytycznych (ADA 2024: zmniejszenie insuliny przy glikemii ≈ 200–250 mg/dl i dodanie glukozy; JBDS 2023: 10% glukoza 125 ml/h równolegle). Szpital może przyjąć inne progi – zmiana dotyczy tylko tego urządzenia i jest wyświetlana w wyniku.</p><ul><li>Próg zmniejszenia: ≈200–250 mg/dl (11,1–13,9 mmol/l). Puste = 250 mg/dl.</li><li>Zakres po zmniejszeniu: 0,02–0,05 j./kg/h (ADA 2024: 0,02–0,05 j./kg/h po osiągnięciu 250 mg/dl) lub inny schemat lokalny.</li><li>Glukoza 5% / 10%: stężenie i szybkość – decyzja lokalna.</li></ul>'+srcl('ADA/EASD/JBDS/AACE/DTS 2024; JBDS 2023')),lvl:'ok'};
  if(t==='rates'){var r=D.rates({glu:g('g0'),osm:g('o0'),na:g('n0')},{glu:g('g1'),osm:g('o1'),na:g('n1')},g('hrs'));
   if(!r)return{H:box('orange','','Podaj dwa pomiary i odstęp czasu (0,05–24 h). Brak wyniku bez danych.'),lvl:'ok'};
   var H='',lvl='ok';var rows=[];
   if(nz(r.gluPerH))rows.push(['Glikemia',F(r.gluPerH*18.016,0)+' mg/dl/h ('+F(r.gluPerH,1)+' mmol/l/h)','cel 90–120 mg/dl/h (5–6,7 mmol/l/h)']);
   if(nz(r.osmPerH))rows.push(['Osmolalność',F(r.osmPerH,1)+' mOsm/kg/h','cel 3–8 mOsm/kg/h']);
   if(nz(r.naPer24))rows.push(['Na⁺ (tempo → 24 h)',F(r.naPer24,1)+' mmol/l/24 h','≤10 mmol/l/24 h']);
   H+=box(r.warn.length?'red':'ok','Tempo zmian',tbl(['Parametr','Tempo','Zalecany zakres'],rows));
   if(r.warn.length){lvl='red';H+=box('red','Za szybko – ryzyko obrzęku mózgu','<ul><li>'+r.warn.join('</li><li>')+'</li></ul>Zwolnij/zmodyfikuj leczenie (płyny, insulina), kontrola neurologiczna, GCS.');}
   return{H:H+srcl('ADA/EASD/JBDS/AACE/DTS 2024; JBDS HHS 2022'),lvl:lvl};}
  // ---- main ----
  var cfg=cfgRead(),w=P.w;var su=g('syrU2');if(!nz(su)||su<=0)su=+g('syrU');
  var i={w:w,glu:g('glu'),ket:g('ket'),ph:g('ph'),hco3:g('hco3'),k:g('k'),na:g('na'),cl:g('cl'),urea:g('urea'),sbp:g('sbp'),gcs:g('gcs'),knownDM:g('dm'),co:P.co,age:P.age,urine:g('urine'),
   syrUnits:su,syrMl:+g('syrMl'),hhsFalling:g('hhsf'),gluReduce:cfg.gluRed,rateReduced:cfg.rr,dex:cfg.dex};
  var o=D.plan(i),H='',lvl=o.lvl;
  var dx={dka:'DKA',hhs:'HHS',mixed:'DKA + HHS (mieszany) → leczyć jak DKA',none:'Brak pełnych kryteriów DKA/HHS'}[o.mode];
  H+=box(o.mode==='none'?'':o.lvl,'','<span class="big">'+dx+'</span>'+(o.warn.length?'<div class="r">⚠ '+o.warn.map(h).join('<br>⚠ ')+'</div>':''));
  var c=[];if(nz(o.ag))c.push('Luka anionowa <b>'+F(o.ag,0)+'</b>');if(nz(o.osm))c.push('Osmolalność <b>'+F(o.osm,0)+'</b> mOsm/kg');if(nz(o.naCorr16))c.push('Na⁺ skorygowane <b>'+F(o.naCorr16,0)+'</b> (Katz 1,6) / <b>'+F(o.naCorr24,0)+'</b> (Hillier 2,4)');
  if(c.length)H+=box('','',c.join(' · '));
  // bramka potasowa
  H+=box(o.k.lvl==='red'?'red':o.k.lvl==='orange'?'orange':'ok','Bramka potasowa – K⁺ przed insuliną',h(o.k.txt)+srcl('ADA 2024; ChPL KCl; JBDS 2023'));
  // pompa
  var ins=o.insulin;
  if(!ins.allowed){H+=box(ins.phase==='hold'?'red':'orange','Insulina – wlew i.v.',(ins.phase==='hold'?'<div class="big r">INSULINA WSTRZYMANA</div>':'')+'<div>'+h(ins.reason||'')+'</div>'+(o.syringe&&o.syringe.warn&&o.syringe.warn.length?'<div class="o">'+o.syringe.warn.map(h).join('<br>')+'</div>':''));}
  else{var ph={start:'START – 0,1 j./kg/h',reduced:'ZMNIEJSZONA – '+F(cfg.rr,2)+' j./kg/h',hhs:'HHS – 0,05 j./kg/h'}[ins.phase];
   var rows=[];['start','reduced','hhs'].forEach(function(k){var r=ins.rows[k];if(!r)return;var lab={start:'Start (DKA)',reduced:'Zmniejszona (glikemia <'+gl(o.reduceThreshold)+')',hhs:'HHS'}[k];
    if(k==='hhs'&&o.mode!=='hhs')return;if(k!=='hhs'&&o.mode==='hhs')return;rows.push({cls:ins.phase===k?'act':'',cells:[lab,F(r.perKg,3)+' j./kg/h','<b>'+F(r.uh,1)+' j./h</b>','<b>'+F(r.mlh,1)+' ml/h</b>']});});
   H+=box(ins.uh>15&&o.mode!=='hhs'?'orange':'ok','Insulina – pompa strzykawkowa ('+ph+')','<div class="b1pair"><span>'+F(ins.uh,1)+' j./h</span><span>=</span><span>'+F(ins.mlh,1)+' ml/h</span></div><div class="mut">('+F(ins.perKg,3)+' j./kg/h × '+F(w,0)+' kg · stężenie '+F(ins.conc,3)+' j./ml)</div>'+
    tbl(['Faza','j./kg/h','j./h','ml/h'],rows)+
    '<div><b>Przygotowanie:</b> '+F(i.syrUnits,0)+' j. insuliny = <b>'+F(ins.insMl,2)+' ml</b> z pena (100 j./ml) + <b>'+F(ins.diluentMl,2)+' ml NaCl 0,9%</b> = '+i.syrMl+' ml → <b>'+F(ins.conc,3)+' j./ml</b></div>'+
    '<div class="mut">Strzykawka wystarcza na ok. <b>'+F(ins.hoursSyringe,1)+' h</b> przy tym przepływie – kolejną przygotuj wcześniej (zmiana ok. '+(D.nextTime(nowHM(),Math.max(1,ins.hoursSyringe*60-15))||'—')+', nie przerywaj wlewu). Wlew jest prowadzony bez przerwy wiele godzin do ustąpienia DKA/HHS; zmienia się tylko przepływ.</div>'+srcl('ADA 2024 (0,1 j./kg/h bez bolusa), JBDS 2023 (0,1 j./kg/h), JBDS HHS 2022 (0,05 j./kg/h); ChPL NovoRapid (rozcieńczenie 0,05–1 j./ml)'));}
  // zmniejszanie i glukoza
  if(o.mode!=='none'&&ins.phase!=='hold'){var d=o.dextrose;
   H+=box(d.needed?'orange':'','Zmniejszenie insuliny i glukoza równolegle',(d.needed?'<b>Glikemia <'+gl(o.reduceThreshold)+' → ZMNIEJSZ insulinę do '+F(o.reducedRate,3)+' j./kg/h (zakres 0,02–0,05; lub 1 j./h wg schematu lokalnego) i DODAJ glukozę – NIE odstawiaj insuliny.</b>':'<span class="mut">Gdy glikemia spadnie poniżej '+gl(o.reduceThreshold)+': zmniejsz insulinę do '+F(o.reducedRate,3)+' j./kg/h (ADA 2024: 0,02–0,05 j./kg/h) i dodaj glukozę 5–10%; cel glikemii ≈ 200 mg/dl (11,1 mmol/l) do ustąpienia DKA.</span>')+
    '<div>Glukoza <b>'+d.pct+'%</b> <b>'+d.mlh+' ml/h</b> = '+F(d.gPerH,1)+' g/h (worek 500 ml ≈ '+F(500/d.mlh,1)+' h; 1 l ≈ '+F(1000/d.mlh,1)+' h) równolegle do NaCl 0,9% ('+h(d.txt.indexOf('JBDS')>=0?'JBDS 2023: 10% 125 ml/h; ADA 2024: 5–10%':'')+')'+dw('stężenie i ml/h – decyzja lokalna')+'</div>'+srcl('ADA 2024; JBDS 2023'));}
  // płyny
  if(o.fluids&&o.fluids.length)H+=box(o.shock?'red':o.fluidCaution?'orange':'ok','Płyny startowe – NaCl 0,9%',o.shock?'<b>'+h(o.fluids[0].txt)+'</b>':o.fluids.map(function(f,n){return (n+1)+'. 1 l / '+(f.t/60)+' h = <b>'+F(f.mlh)+' ml/h</b>'}).join(' · ')+(o.fluidCaution?'<div class="o">Ostrożnie: wiek 18–25 / ≥65, ciąża, serce, nerki</div>':'')+'<div class="mut">Płyny: ADA 2024 – 500–1000 ml/h przez pierwsze 2–4 h (zależnie od stanu nawodnienia).</div>');
  // monitorowanie
  var m=o.monitor,t0=nowHM();function nx(x){return D.nextTime(t0,x.min)||'—';}
  H+=box('','Monitorowanie – kolejne kontrole (od '+t0+')',tbl(['Parametr','Następna','Uwagi'],[
   ['Glukoza','<b>'+nx(m.glu)+'</b>',h(m.glu.txt)],['K⁺ / elektrolity','<b>'+nx(m.k)+'</b>',h(m.k.txt)],['Gazometria + ketony','<b>'+nx(m.gas)+'</b>',h(m.gas.txt)],['RR, tętno, T, SpO₂, GCS, diureza','<b>'+nx(m.vitals)+'</b>',h(m.vitals.txt)]])+
   (o.mode==='hhs'||o.mode==='mixed'?'<div class="mut">'+h(m.osm.txt)+'</div>':'')+srcl('ADA 2024; JBDS 2023'));
  // HHS
  if(o.mode==='hhs'||o.mode==='mixed')H+=box('orange','HHS – wskazówki','<ul><li>Osmolalność efektywna = 2×Na⁺ + glukoza (mmol/l); cel spadku osmolalności 3–8 mOsm/kg/h, glikemii ≤90–120 mg/dl/h, Na⁺ ≤10 mmol/l/24 h.</li><li>Na⁺ skorygowane rośnie w miarę spadku glikemii; spadek Na⁺ skorygowanego = ryzyko obrzęku mózgu.</li><li>Ryzyko obrzęku mózgu – pilnuj GCS, bólu głowy, bradykardii; zwolnij tempo spadku.</li><li>Płyny pierwsze, insulina po stabilizacji hemodynamicznej (HHS: start gdy glikemia nie spada na płynach).</li><li>Profilaktyka ZŻ (HDCz) przy HHS.</li></ul>'+(o.base&&o.base.hhsTargets?'<div class="mut">'+h(o.base.hhsTargets)+'</div>':'')+srcl('ADA 2024; JBDS HHS 2022'));
  // kryteria ustąpienia
  var rs=o.resolution;H+=box(rs.dka===true||rs.hhs===true?'ok':'','Kryteria ustąpienia',(rs.dka===true?'<div class="big">✔ Kryteria ustąpienia DKA spełnione</div>':'')+(rs.hhs===true?'<div class="big">✔ Kryteria ustąpienia HHS spełnione</div>':'')+'<ul><li>'+rs.items.map(h).join('</li><li>')+'</li></ul><div class="mut">'+h(rs.transition)+'</div>'+srcl('ADA 2024'));
  return{H:H,lvl:lvl};},
 '<h3>Źródła</h3>'+src(allSrc(D.SRC))+'<p>Insulina z pena NovoRapid (analog 100 j./ml) – JBDS opisuje insulinę ludzką rozpuszczalną; użycie analogu to praktyka lokalna '+dw('DO WERYFIKACJI z protokołem szpitala')+'. Potas: wyłącznie gotowe worki wg ChPL, nigdy pompa strzykawkowa. Jednostki: glikemia wg Ustawień (mg/dl lub mmol/l).</p>');
// =========================== ELEKTROLITY ===========================
var ELY=tabbed({id:'elyte',icon:'⚗️',name:'Elektrolity – reguły (klasyczny)'},'Elektrolity – bezpieczna korekcja',[['na','Na⁺'],['k','K⁺'],['mg','Mg²⁺'],['ca','Ca²⁺'],['tab','Tabela reguł']],
 function(t){
  if(t==='na')return inp('na','Na⁺','mmol/l')+inp('glu','Glukoza','@glu')+inp('osm','Osmolalność surowicy (opcjonalnie)','mOsm/kg')+sel('sympt','Objawy',[['','bez / łagodne'],['mod','umiarkowane (nudności, splątanie, ból głowy)'],['severe','ciężkie (drgawki, śpiączka, GCS ≤8)']])+sel('vol','Wolemia',[['','— nie oceniono —'],['hypo','hipowolemia'],['eu','euwolemia / SIADH'],['hyper','hiperwolemia / przewodnienie']])+sel('onset','Czas trwania',[['','>48 h lub nieznany'],['acute','ostra (<48 h)']])+chk('hr','wysokie ryzyko ODS (alkohol, niedożywienie, hipoK, wątroba, Na ≤105)')+chk('shock','wstrząs / ciężka hipowolemia (Na↑)')+inp('target','Plan wzrostu /24 h','mmol/l','5')+sub('Kontrola dotychczasowej korekcji')+inp('nstart','Na⁺ początkowe','mmol/l')+inp('hrs','Czas od Na⁺ początkowego','h');
  if(t==='k')return inp('k','K⁺','mmol/l')+inp('glu','Glukoza przed (hiperK)','@glu')+chk('ecg','zmiany w EKG')+chk('weak','niedowład / zaburzenia rytmu')+chk('ins','w trakcie DKA')+sub('Kalkulator wlewu KCl (gotowy worek)')+inp('kmm','KCl łącznie','mmol')+inp('kvol','Objętość końcowa','ml')+inp('krate','Szybkość','mmol/h')+chk('kcen','cewnik centralny');
  if(t==='mg')return inp('mgv','Mg','@mg')+chk('tdp','torsade de pointes')+chk('sy','objawy (tężyczka, drgawki, arytmia)')+chk('arr','arytmia')+chk('asthma','ciężka astma')+sub('Kalkulator wlewu MgSO₄')+inp('mgg','MgSO₄','g')+inp('mgvol','Objętość końcowa','ml')+inp('mgh','Czas wlewu','h');
  if(t==='ca')return inp('cav','Ca całkowity','@ca')+inp('alb','Albumina','g/l')+chk('sy','objawy (tężyczka, drgawki, QT)');
  return '';},
 function(t,g,P,X){var H='',lvl='ok';
  if(t==='tab'){var rows=E.RULES.map(function(r){return [r.z,r.kiedy,r.co,r.limit,r.kontrola,r.src]});
   return{H:box('','Tabela bezpiecznej korekcji (Na⁺, K⁺, Mg²⁺, Ca²⁺)',tbl(['Zaburzenie','Kiedy','Co podać','Limit / bezpieczeństwo','Kontrola','Źródło'],rows)+'<div class="mut">Wartości glikemii i wapnia podano w mg/dl z odpowiednikiem w mmol/l; pola wejściowe kalkulatorów przyjmują jednostki z Ustawień ('+(sys()==='si'?'SI':'mg/dl')+'). Na⁺, K⁺ – zawsze mmol/l.</div>'),lvl:'ok'};}
  if(t==='na'){var na=g('na'),hr=g('hr')||P.co.liver;
   if(!nz(na))return{H:box('orange','','Podaj Na⁺.'),lvl:'ok'};
   if(na>145){var o=E.hyperNa({na:na,w:P.w,sex:P.sex,age:P.age,sympt:g('sympt')!=='',onset:g('onset'),shock:g('shock')});
    if(!o)return{H:box('orange','','Podaj masę ciała (pasek pacjenta) i Na⁺ 146–200 mmol/l.'),lvl:'ok'};
    H+=box(o.lvl,'Hipernatremia','<span class="big">Na⁺ '+F(na,0)+'</span>'+' · TBW '+F(o.tbw,1)+' l · niedobór wolnej wody ≈ '+F(o.deficitL,1)+' l');
    o.steps.forEach(function(s){H+=box(s.k==='red'?'red':s.k==='orange'?'orange':'ok',s.t,h(s.d))});
    if(nz(o.mlhForTarget))H+=box('','Glukoza 5% – szacunek','Dla tempa '+o.perH+' mmol/l/h ≈ <b>'+F(o.mlhForTarget,0)+' ml/h</b> glukozy 5% (Adrogué–Madias; kontroluj Na⁺ i glikemię).');
    lvl=o.lvl;}
   else{var o=E.hypoNa({na:na,glu:g('glu'),osm:g('osm'),w:P.w,sex:P.sex,age:P.age,highRisk:hr,sympt:g('sympt'),onset:g('onset'),vol:g('vol'),target:g('target')});
    if(!o)return{H:box('orange','','Na⁺ poza zakresem 80–180 mmol/l lub brak danych.'),lvl:'ok'};
    lvl=o.lvl;
    if(o.type==='brak'){H+=box('ok','','Na⁺ ≥135 mmol/l – brak hiponatremii, brak wskazań do korekcji.');}
    else{
     H+=box(o.lvl,'Hiponatremia – '+(o.type||''),(o.sev?'<span class="big">'+o.sev+'</span>':'')+(o.cc?'<div>Na⁺ skorygowane o glikemię: <b>'+F(o.naEff,1)+'</b> (Katz 1,6) / <b>'+F(o.cc.c24,1)+'</b> (Hillier 2,4); nadmiar glukozy '+F(o.cc.excess,0)+' mg/dl</div>':''));
     if(o.stop.length)H+=box('red','NIE PODAWAĆ SOLI','<ul><li>'+o.stop.map(h).join('</li><li>')+'</li></ul>');
     if(o.warn.length)H+=box('orange','Uwaga','<ul><li>'+o.warn.map(h).join('</li><li>')+'</li></ul>');
     o.steps.forEach(function(s){H+=box(s.k==='red'?'red':s.k==='orange'?'orange':s.k==='no'?'orange':'ok',s.t,h(s.d))});
     if(nz(o.d3))H+=box('','Adrogué–Madias (TBW '+F(o.tbw,1)+' l)','1 l 3% NaCl: <b>+'+F(o.d3,1)+'</b> mmol/l · 1 l 0,9% NaCl: <b>+'+F(o.d09,1)+'</b> mmol/l · bolus 150 ml 3%: ≈ +'+F(o.bolusRise,1)+' mmol/l');
     var p3=E.plan3({w:P.w,sex:P.sex,age:P.age,na:o.naEff,target:nz(g('target'))&&g('target')>0?g('target'):5,highRisk:hr});
     if(p3&&o.type==='hipotoniczna'&&(!o.stop.length||g('sympt')))H+=box(p3.exceed?'red':'','Plan 3% NaCl na cel +'+F(nz(g('target'))&&g('target')>0?g('target'):5,0)+' mmol/l/24 h','<b>'+F(p3.vol,0)+' ml</b> 3% NaCl w 24 h ≈ <b>'+F(p3.mlh,1)+' ml/h</b>'+(p3.exceed?'<div class="r">Cel przekracza limit '+p3.limit+' mmol/l/24 h</div>':'')+(p3.chplExceed?'<div class="o">Tempo '+F(p3.mlh,0)+' ml/h przekracza 100 ml/h z ChPL NaCl 10% (zatrucie wodne) – DO DECYZJI LEKARZA.</div>':'')+'<div class="mut">3% NaCl = 513 mmol/l; przygotowanie wg protokołu szpitala '+dw('DO WERYFIKACJI')+'</div>');
     if(o.overcorrection)H+=box('orange','Przekroczenie limitu korekcji',h(o.overcorrection));}
    var pg=E.progress(g('nstart'),na,g('hrs'),hr);
    if(pg){var st=pg.status;H+=box(st==='exceeded'?'red':st==='near'?'orange':'ok','Kontrola korekcji','Wzrost Na⁺ o <b>'+F(pg.rise,1)+'</b> mmol/l w '+F(g('hrs'),1)+' h (tempo '+F(pg.perH,2)+' mmol/l/h; ≈'+F(pg.per24,1)+'/24 h) · limit '+pg.limit+' mmol/l'+(st==='exceeded'?'<div class="r">⚠ LIMIT PRZEKROCZONY – patrz plan przy przekroczeniu</div>':st==='near'?'<div class="o">Blisko limitu – wstrzymaj podnoszenie Na⁺</div>':''));if(st==='exceeded')lvl='red';}}
   return{H:H+srcl(E.SRC.ESE||'ESE/ESICM/ERA 2014; ADA 2024; Adrogué–Madias 2000'),lvl:lvl};}
  if(t==='k'){var k=g('k'),o=null;
   if(nz(k)){if(k<3.5)o=E.hypoK({k:k,ecg:g('ecg'),weak:g('weak'),insulin:g('ins')});else o=E.hyperK({k:k,ecg:g('ecg'),glu:g('glu')});
    if(o){lvl=o.lvl;if(k<3.5){H+=box(o.lvl,'Hipokaliemia '+(o.sev||''),'<span class="big">K⁺ '+F(k,1)+'</span>');o.steps.forEach(function(s){H+=box(s.k==='red'?'red':s.k==='orange'?'orange':'ok',s.t,h(s.d))});}
     else if(!o.sev&&!g('ecg'))H+=box('ok','','K⁺ '+F(k,1)+' – w zakresie / <5,5, brak wskazań do leczenia hiperkaliemii.');
     else{H+=box(o.lvl,'','<span class="big">K⁺ '+F(k,1)+(o.sev?' – hiperkaliemia '+o.sev:'')+'</span>');o.steps.forEach(function(s){H+=box(s.t==='Wapń – ochrona serca'?'red':'ok',s.n+'. '+s.t,h(s.d)+(s.src?'<div class="b1src">Źródło: '+h(s.src)+'</div>':''))});
      if(o.calcium)H+=box('red','Wapń – dawka i powtórzenia','<b>'+o.calcium.ml+' ml glukonianu wapnia 10% ('+F(o.calcium.mmol,1)+' mmol Ca) w '+o.calcium.minutes+' min</b> lub '+o.calcium.alt+'; powtórz '+o.calcium.repeat+'.');}}}
   var ki=E.potassiumInfusion({mmol:g('kmm'),volMl:g('kvol'),rate:g('krate'),kSerum:k,central:g('kcen')});
   if(ki){H+=box(ki.blocked?'red':ki.warn.length?'orange':'ok','Wlew KCl',(ki.blocked?'<div class="big r">WYNIK WSTRZYMANY</div>':'<div class="b1pair"><span>'+F(ki.mlh,1)+' ml/h</span><span>'+F(g('krate'),0)+' mmol/h</span></div>')+'<div>Stężenie <b>'+F(ki.conc,0)+' mmol/l</b> (maks. 40) · '+F(g('kmm'),0)+' mmol = '+F(ki.ml15,1)+' ml KCl 15% w '+F(g('kvol'),0)+' ml · czas ≈ '+F(ki.hours,1)+' h</div>'+(ki.warn.length?'<ul><li>'+ki.warn.map(h).join('</li><li>')+'</li></ul>':'')+'<div class="mut">Gotowy worek, nigdy w pompie strzykawkowej bez procedury; ciągłe EKG przy >10 mmol/h.</div>');if(ki.blocked)lvl='red';}
   if(!H)H=box('orange','','Podaj K⁺ lub parametry wlewu.');
   return{H:H+srcl('ChPL KCl; UKKA 2023 (hiperK); ADA 2024'),lvl:lvl};}
  if(t==='mg'){var v=g('mgv');var o=E.mgPlan({mg:v,tdp:g('tdp'),sympt:g('sy'),arrhythmia:g('arr'),asthma:g('asthma'),crcl:P.crcl});
   if(o){lvl=o.lvl;H+=box(o.lvl,'Magnez'+(nz(v)?' – '+UN.round('mg',UN.fromSI('mg',v,sys()),sys())+' '+UN.label('mg',sys())+(sys()==='conv'?' ('+F(v,2)+' mmol/l)':''):''),'');o.steps.forEach(function(s){H+=box(s.k==='red'?'red':s.k==='orange'?'orange':'ok',s.t,h(s.d)+(s.src?'<div class="b1src">Źródło: '+h(s.src)+'</div>':''))});}
   var mi=E.mgInfusion({g:g('mgg'),volMl:g('mgvol'),hours:g('mgh')});
   if(mi){H+=box(mi.blocked?'red':'ok','Wlew MgSO₄',(mi.blocked?'<div class="big r">Stężenie >20% – wstrzymano</div>':'<div class="b1pair"><span>'+F(mi.mlh,1)+' ml/h</span></div>')+'<div>'+F(g('mgg'),1)+' g = '+F(mi.mmol,1)+' mmol = '+F(mi.ml20,1)+' ml MgSO₄ 20% w '+F(g('mgvol'),0)+' ml · stężenie '+F(mi.pct,1)+'%</div>');if(mi.blocked)lvl='red';}
   if(!H)H=box('orange','','Podaj Mg lub zaznacz wskazanie.');
   return{H:H+srcl('ERC 2021; NHS/BNF; GINA 2023'),lvl:lvl};}
  if(t==='ca'){var o=E.caPlan({ca:g('cav'),alb:g('alb'),sympt:g('sy')});
   if(!o)return{H:box('orange','','Podaj Ca.'),lvl:'ok'};lvl=o.lvl;
   H+=box(o.lvl,'','Ca skorygowane: <span class="big">'+UN.round('ca',UN.fromSI('ca',o.corr,sys()),sys())+' '+UN.label('ca',sys())+'</span>'+(sys()==='conv'?' ('+F(o.corr,2)+' mmol/l)':''));
   o.steps.forEach(function(s){H+=box(s.k==='red'?'red':s.k==='orange'?'orange':'ok',s.t,h(s.d)+(s.src?'<div class="b1src">Źródło: '+h(s.src)+'</div>':''))});
   return{H:H,lvl:lvl};}
  return{H:H,lvl:lvl};},
 '<h3>Źródła</h3>'+src(allSrc(E.SRC))+'<p>Na⁺: wzór Adrogué–Madias (szacunek – kontrola Na⁺ po 1, 6, 12 h). 3% NaCl = 513 mmol/l. TBW: M 0,6 / K 0,5; ≥65 lat: M 0,5 / K 0,45. Preparaty i rozcieńczenia wg ChPL i protokołu szpitala '+dw('DO WERYFIKACJI')+'.</p>');
function repl(m){var L=SKM.list;for(var i=0;i<L.length;i++)if(L[i].id===m.id){L[i]=m;return;}L.push(m);}
repl(DKA);repl(ELY);
// =========================== ALTEPLAZA (3 stany) + PROTAMINA ===========================
function altForm(kind){
 if(kind==='stemi')return sub('STEMI – fibrynoliza, gdy PPCI niemożliwa w ≤120 min')+inp('hrs','Czas od początku objawów','h')+inp('dly','Przewidywany czas od rozpoznania do PPCI (z transportem)','min')+inp('sbp','SBP','mmHg')+ciHtml('stemi');
 if(kind==='stroke'||kind==='pe')return '';
 return sub('Zatorowość płucna wysokiego ryzyka')+chk('pehigh','ZP wysokiego ryzyka: wstrząs / hipotensja (SBP <90 przez >15 min lub spadek ≥40)')+chk('perescue','ratunkowa: pogorszenie hemodynamiczne mimo leczenia przeciwkrzepliwego')+chk('cprnow','zatrzymanie krążenia z powodu ZP')+ciHtml('pe');}
function doseTable(ph){return tbl(['Faza','mg','czas','ml/h (1 mg/ml)'],ph.map(function(p){return [p.l,'<b>'+F(p.mg,1)+' mg</b> = '+F(p.ml,1)+' ml',p.min?p.min+' min':'bolus 1–2 min',p.mlh!=null?'<b>'+F(p.mlh,1)+' ml/h</b>':'ręcznie']}));}
var RECON='<div class="mut">Rekonstytucja Actilyse: 50 mg proszku + 50 ml wody do wstrzykiwań = <b>1 mg/ml</b> (ChPL). Wlew przez pompę strzykawkową/pompę objętościową; nie mieszać z heparyną w jednym zestawie.</div>';
function altCalc(kind,g,P){var H='',lvl='ok',v=(kind==='stemi')?ciRead(kind,g):null;
 if(kind==='stemi'){var o=A.stemi({w:P.w,age:P.age,hours:g('hrs'),delayMin:g('dly'),sbp:g('sbp'),crcl:P.crcl,v:v});
  if(!o)return{H:box('orange','','Podaj czas od początku objawów (h) i przewidywany czas do PPCI (min). Brak wyniku bez danych.')+ciHeadsUp(),lvl:'ok'};
  lvl=o.lvl;H+=box(o.lvl==='ok'&&o.decision==='lysis'?'ok':o.lvl,o.decision==='lysis'?'FIBRYNOLIZA':o.decision==='pci'?'PPCI – bez fibrynolizy':o.decision==='transfer'?'Transport na PCI – bez fibrynolizy':'Poza oknem',h(o.txt)+srcl(A.SRC.ESCACS)+(o.decision==='transfer'?(window.SORTel&&SORTel.kprHtml?SORTel.kprHtml():''):''));
  H+=ciBox(o);
  if(o.decision==='lysis'){
   if(!(P.w>0))H+=box('orange','','Podaj masę ciała w pasku pacjenta – dawki alteplazy zależą od masy (próg 65 kg).');
   else{H+=box(o.lvl==='orange'?'orange':'ok','Alteplaza (Actilyse) – '+o.regimen,'<div class="big">Łącznie '+F(o.total,1)+' mg</div>'+doseTable(o.phases)+RECON+'<div class="b1src">Czas: iglą w ≤10 min od rozpoznania (ESC 2023).</div>'+srcl(A.SRC.SMPC+' – masa ≥65 kg: stałe dawki; <65 kg: wg mg/kg'));
    o.warn.forEach(function(w){H+=box('orange','',h(w))});
    var a=o.adj;H+=box('','Leki towarzyszące (ESC 2017/2023)','<ul><li>'+a.aspirin+'</li><li>'+a.clopidogrel+'</li><li><b>Antykoagulant:</b> '+(a.enox?a.enox.txt:'podaj masę i wiek')+'</li>'+(a.ufh?'<li>'+a.ufh.txt+'</li>':'')+'<li>'+a.noP2Y12+'</li></ul>'+srcl(A.SRC.ESCSTEMI));
    H+=box('','Po fibrynolizie',h(o.after)+'<div class="mut">'+h(o.alt)+'</div>');}}
  return{H:H,lvl:lvl};}
 // 11.11.2026: jedno źródło prawdy – alteplaza w udarze: Neurologia → Tromboliza; w ZP: Zatorowość płucna → Alteplaza
 if(kind==='stroke')return{H:box('','Alteplaza w udarze – w module Neurologia','Kwalifikacja (okno, RR, glikemia, INR/PLT, przeciwwskazania) i dawka 0,9 mg/kg (maks. 90 mg; 10% w bolusie, reszta w 60 min) są liczone w jednym miejscu: <b>Neurologia → Tromboliza</b>.<div style="margin-top:8px"><button class="tg" data-nav="1" data-go-tab="neuro:t" onclick="SKS.goTab(\'neuro\',\'t\')">→ Otwórz: Neurologia – Tromboliza</button></div>'),lvl:'ok'};
 return{H:box('','Alteplaza w zatorowości płucnej – w module Zatorowość płucna','Standard ChPL (10 mg + wlew 2 h; <65 kg łącznie maks. 1,5 mg/kg) i wariant przyspieszony (0,6 mg/kg/15 min, maks. 50 mg) są liczone w jednym miejscu: <b>Zatorowość płucna → Alteplaza: standard / szybki</b>.<div style="margin-top:8px"><button class="tg" data-nav="1" data-go-tab="pe:lysis" onclick="SKS.goTab(\'pe\',\'lysis\')">→ Otwórz: Zatorowość płucna – Alteplaza</button></div>'),lvl:'ok'};}
function ciHeadsUp(){return '';}
// protamina z czasem
function protForm(){return sub('Heparyna niefrakcjonowana')+inp('bol','Bolus UFH','j.')+inp('bm','Bolus ile minut temu','min')+inp('rate','Wlew UFH','j./h')+inp('run','Wlew trwał','h')+inp('stp','Wlew zakończono (min temu; 0 = trwa)','min','0')+sub('Enoksaparyna / HDCz')+inp('enx','Ostatnia dawka enoksaparyny','mg')+inp('he','Ile godzin temu','h');}
function protCalc(g){var H='',lvl='ok';var pu=A.protUfh({bolusU:g('bol'),bolusMinAgo:g('bm'),rateUh:g('rate'),runningH:g('run'),stoppedMinAgo:g('stp')}),pe=A.protEnox({mg:g('enx'),hours:g('he')});
 if(pu){H+=box(pu.cap?'orange':'ok','Protamina na UFH – dawka zależna od czasu','<div class="big">'+F(pu.loC,0)+(Math.abs(pu.hiC-pu.loC)>0.5?'–'+F(pu.hiC,0):'')+' mg = '+F(pu.mlLo,1)+(Math.abs(pu.mlHi-pu.mlLo)>0.05?'–'+F(pu.mlHi,1):'')+' ml</div><div class="mut">10 mg/ml; powoli ≥10 min (≤5 mg/min)</div>'+tbl(['Składnik','Zakres dawki protaminy'],pu.parts.map(function(p){return [p.t,F(p.lo,1)+(Math.abs(p.hi-p.lo)>0.05?'–'+F(p.hi,1):'')+' mg']}))+(pu.cap?'<div class="o">Maksimum 50 mg na dawkę (obcięto)</div>':'')+'<div class="mut">'+h(pu.txt)+'</div>'+tbl(['Czas od heparyny','mg protaminy / 100 j. UFH'],[['<30 min','1'],['30–60 min','0,5–0,75'],['60–120 min','0,375–0,5'],['>120 min','0,25–0,375']])+'<div class="mut">Bolus: dawka zależy od czasu; wlew: tylko heparyna z ostatnich 2 godz. (1 mg/100 j.). Powolne podanie – ryzyko hipotensji/anafilaksji (ryby, NPH insulina, wazektomia).</div>'+srcl(A.SRC.PROT));}
 if(pe){H+=box(pe.none?'ok':pe.cap?'orange':'ok','Protamina na enoksaparynę',pe.none?h(pe.txt):'<div class="big">'+F(pe.mg,0)+' mg = '+F(pe.ml,1)+' ml</div><div>'+h(pe.txt)+'</div><div class="mut">'+h(pe.second)+'</div>'+srcl(A.SRC.CLX));}
 if(!H)H=box('orange','','Podaj dawkę heparyny i czas (bolus: j. + min temu; wlew: j./h + czas trwania) lub enoksaparyny (mg + godziny).');
 return{H:H,lvl:lvl};}
// =========================== TRANSFUZJE ===========================
function compatHtml(){var rows=T.compatTable().map(function(r){return [r.label,r.rbc,r.plasma,r.plt]});return box('','Tabela zgodności grup krwi (KKCz / osocze / KKP)',tbl(['Biorca','KKCz – dawca','Osocze – dawca','KKP – dawca'],rows)+'<div class="mut">Grupa nieznana: KKCz 0 RhD+ (0 RhD− jeśli dostępne; kobieta &lt;50 lat – wyłącznie RhD−), osocze AB. Próba zgodności i kontrola przyłóżkowa wg rozporządzenia MZ.</div>'+srcl(T.SRC.PL));}
function tfForm(t){
 if(t==='rbc')return sel('kind','Rodzaj niedokrwistości',[['acute','ostre krwawienie'],['chronic','przewlekła']])+inp('hb','Hb','g/dl')+chk('burd','obciążony (choroba serca, niewydolność serca, ACS, COPD)')+chk('symp','objawy (duszność, ból w klatce, hipotensja)')+chk('unst','niestabilność hemodynamiczna z krwotokiem')+inp('mx','Maks. jednostek na dyżur / jednorazowo (lokalnie)','j.');
 if(t==='plt'){var ctx=Object.keys(T.PLT_CTX).map(function(k){return [k,T.PLT_CTX[k].l]});return sel('ctx','Sytuacja',ctx)+inp('plt','PLT','×10⁹/l')+sel('tt','Typ małopłytkowości',[['','ostra / inna'],['chronic','przewlekła stabilna (MDS, aplazja, marskość)'],['itp','ITP'],['ttp','TTP'],['hit','HIT']])+chk('bleed','krwawienie')+chk('life','zagrażające życiu')+sub('Czy KKP/KKCz muszą być napromieniowane?')+'<div class="b1ci rel">'+T.IRR.map(function(x){return '<label><input type="checkbox" id="ir_'+x[0]+'"> '+x[1]+'</label>'}).join('')+'</div>'+chk('urg','stan zagrażający życiu – brak napromieniowanych');}
 if(t==='gcsf')return sub('Neutropenia i gorączka')+inp('anc','Neutrocyty (ANC)','×10⁹/l')+inp('tmp','Temperatura','°C')+chk('fh','≥38,0 °C utrzymująca się ≥1 h')+chk('fall','ANC spada (przewidywane <0,5)')+
   sub('MASCC')+sel('sym','Objawy gorączki',[['none','brak'],['mild','łagodne'],['moderate','umiarkowane'],['severe','ciężkie']])+chk('hypo','hipotensja (SBP <90)')+chk('copd','POChP')+chk('fungal','nowotwór hematologiczny z wcześniejszą infekcją grzybiczą')+chk('dehydr','odwodnienie wymagające płynów i.v.')+chk('outpt','pacjent ambulatoryjny w chwili gorączki')+
   sub('Czynniki wykluczające leczenie ambulatoryjne')+chk('solid','guz lity')+chk('haem','nowotwór hematologiczny / ostra białaczka / intensywna chemioterapia')+chk('hsct','po przeszczepie komórek krwiotwórczych')+chk('organ','niewydolność narządowa / sepsa')+chk('prol','oczekiwana ANC <0,1 przez >7 dni')+chk('nosup','brak wsparcia 24 h / transportu / telefonu')+chk('nooral','brak możliwości doustnego przyjmowania leków')+
   sub('CISNE (guz lity)')+chk('ecog','ECOG ≥2')+inp('cglu','Glikemia','@glu')+chk('cvd','przewlekła choroba sercowo-naczyniowa')+chk('muc','zapalenie błon śluzowych ≥2°')+chk('mono','monocyty <200/µl')+
   sub('G-CSF')+sel('mode','Cel G-CSF',[['','— tylko ocena —'],['treatment','leczenie przy gorączce neutropenicznej'],['prophylaxis','profilaktyka (decyzja onkologa)']])+sel('prod','Preparat',[['fil','filgrastym'],['peg','pegfilgrastym']])+inp('fnr','Ryzyko FN schematu','%')+inp('rfc','Liczba czynników ryzyka pacjenta','')+'<div class="b1ci rel">'+T.CSF_HIGH.map(function(x){return '<label><input type="checkbox" id="hi_'+x[0]+'"> '+x[1]+'</label>'}).join('')+'</div>';
 if(t==='mtp-add')return sub('Ile KKP zamówić (RCKiK Kraków)')+inp('rg','KKCz już podano','j.')+inp('rph','Przewidywane zużycie KKCz','j./h')+inp('dm','Czas dostawy z RCKiK Kraków (lokalnie)','min','120')+inp('pg','KKP już podano','dawek')+inp('ps','KKP w zapasie','dawek')+sel('ratio','Proporcja KKCz na 1 dawkę KKP',[['6','6 : 1 (≈1:1:1)'],['4','4 : 1'],['8','8 : 1'],['10','10 : 1']]);
 return '';}
function tfCalc(t,g,P){var H='',lvl='ok';
 if(t==='rbc'){var o=T.rbc({kind:g('kind'),hb:g('hb'),w:P.w,burdened:g('burd'),symptomatic:g('symp'),unstable:g('unst'),maxShift:g('mx')});
  if(!o)return{H:box('orange','','Podaj Hb (2–20 g/dl). Brak wyniku bez danych.')+rbcRef(),lvl:'ok'};
  lvl=o.lvl==='red'?'red':'ok';
  H+=box(o.lvl,'KKCz – '+(o.kind==='acute'?'ostre krwawienie':'niedokrwistość przewlekła'),'<div class="big">'+(o.need?'WSKAZANE':'brak wskazań')+'</div>'+h(o.txt)+'<div>Próg: <b>'+o.threshold+' g/dl</b> · cel: <b>'+h(o.target)+'</b></div>'+srcl(T.SRC.AABB));
  if(o.kind==='chronic'&&o.need){if(o.unitsTotal)H+=box('','Liczba jednostek','<div class="big">'+o.unitsNow+' j. KKCz teraz</div>'+(o.capped?'<div class="o">Orientacyjnie do celu potrzeba '+o.unitsTotal+' j.; ograniczono limitem lokalnym ('+o.maxShift+' j./dyżur) – kontrola Hb po każdej jednostce.</div>':'<div class="mut">Do celu orientacyjnie '+o.unitsTotal+' j.; przyrost ≈ '+F(o.incPerUnit,2)+' g/dl/j. (70/masa).</div>'));else H+=box('orange','','Podaj masę ciała – liczba jednostek zależy od masy.');}
  o.warn.forEach(function(w){H+=box('orange','',h(w))});H+=rbcRef();return{H:H,lvl:lvl};}
 if(t==='plt'){var o=T.platelets({ctx:g('ctx'),plt:g('plt'),thromboType:g('tt'),bleeding:g('bleed'),lifeThreat:g('life')}),v={};T.IRR.forEach(function(x){v[x[0]]=g('ir_'+x[0])===true});var ir=T.irradiated(v,g('urg'));
  if(!o)H+=box('orange','','Podaj PLT (×10⁹/l) i wybierz sytuację.');
  else{lvl=o.lvl==='red'?'red':'ok';H+=box(o.lvl,'Trombocytopenia – '+(o.ctxLabel||''),'<div class="big">'+(o.avoid?'UNIKAJ KKP':o.need?'KKP WSKAZANE':'KKP niewskazane')+'</div>'+h(o.txt)+(o.threshold?'<div>Próg: <b>'+o.threshold+' ×10⁹/l</b></div>':'')+(o.dose?'<div class="mut">'+h(o.dose)+'</div>':'')+srcl(T.SRC[o.src]||T.SRC.BSH));o.warn.forEach(function(w){H+=box('orange','',h(w))});}
  H+=box(ir.lvl,'KKP / KKCz napromieniowane',h(ir.txt)+(ir.ifUnavailable?'<div class="o">'+h(ir.ifUnavailable)+'</div>':'')+(ir.urgentTxt?'<div class="r">'+h(ir.urgentTxt)+'</div>':'')+'<div class="mut">'+h(ir.apheresis)+'</div>'+srcl(T.SRC.BSHIRR));
  H+=pltRef();return{H:H,lvl:lvl};}
 if(t==='gcsf'){var ancv=g('anc'),f=T.fn({anc:ancv,temp:g('tmp'),feverHour:g('fh'),expectedFall:g('fall')});
  if(!f)return{H:box('orange','','Podaj ANC (×10⁹/l). Brak wyniku bez danych.'),lvl:'ok'};
  H+=box(f.fn?'red':f.neutropenia?'orange':'ok','Neutropenia','<div class="big">ANC '+F(ancv,2)+' ×10⁹/l – '+f.grade+'</div>'+(f.fn?'<div class="r"><b>GORĄCZKA NEUTROPENICZNA</b></div>'+h(f.act):'<div class="mut">Brak kryteriów FN (gorączka ≥38,3 °C lub ≥38,0 °C ≥1 h oraz ANC <0,5, albo <1,0 przy spadku).</div>')+srcl(T.SRC.IDSA));
  if(f.fn){lvl='red';var sx=g('solid'),m={sym:g('sym'),age:P.age,hypo:g('hypo'),copd:g('copd'),fungal:g('fungal'),dehydr:g('dehydr'),outpt:g('outpt')};
   var d=T.disposition({anc:ancv,temp:g('tmp'),feverHour:g('fh'),expectedFall:g('fall'),solid:sx,haemMalig:g('haem'),hsct:g('hsct'),organ:g('organ')||g('hypo'),expectedProlonged:g('prol'),noSupport:g('nosup'),noOral:g('nooral'),m:m,c:{ecog2:g('ecog'),gluMmol:g('cglu'),copd:g('copd'),cvd:g('cvd'),muc:g('muc'),mono:g('mono')}});
   if(d.res==='hosp')H+=box('red','HOSPITALIZACJA','<div class="big r">HOSPITALIZACJA</div><ul><li>'+d.reasons.map(h).join('</li><li>')+'</li></ul><div class="mut">MASCC '+d.mascc.score+(d.cisne?' · CISNE '+d.cisne.score:'')+'</div>'+srcl(T.SRC.IDSA+'; '+T.SRC.MASCC+(sx?'; '+T.SRC.CISNE:''))+dw('decyzja lekarza prowadzącego'));
   else if(d.res==='amb')H+=box('orange','MOŻE AMBULATORYJNIE','<div class="big">MOŻE AMBULATORYJNIE</div>'+h(d.txt)+'<div class="mut">MASCC '+d.mascc.score+(d.cisne?' · CISNE '+d.cisne.score+' ('+d.cisne.cls+')':'')+'</div>'+srcl(T.SRC.IDSA+'; '+T.SRC.MASCC+(sx?'; '+T.SRC.CISNE:''))+dw('decyzja lekarza prowadzącego'));
   else H+=box('orange','Kwalifikacja ambulatoryjna',h(d.note||'Uzupełnij dane (wiek w pasku pacjenta, objawy MASCC, glikemia przy guzie litym).'));}
  var mode=g('mode');if(mode){var gc=T.gcsf({mode:mode,fnRisk:g('fnr'),riskFactors:g('rfc'),anc:ancv,febrile:f.fn,w:P.w,hi:(function(){var x={};T.CSF_HIGH.forEach(function(c){x[c[0]]=g('hi_'+c[0])===true});return x;})(),product:g('prod')});
   if(!gc)H+=box('orange','G-CSF','Podaj dane do oceny (profilaktyka: ryzyko FN %).');
   else H+=box(gc.lvl,'G-CSF – '+(mode==='treatment'?'leczenie':'profilaktyka'),'<div class="big">'+({YES:'ZALECANY',CONSIDER:'ROZWAŻ',NO:'niezalecany rutynowo'}[gc.rec])+'</div>'+h(gc.txt)+'<div><b>Dawka:</b> '+h(gc.dose)+'</div>'+(gc.timing?'<div>'+h(gc.timing)+'</div>':'')+(gc.who?'<div class="mut">'+h(gc.who)+'</div>':'')+(gc.warn.length?'<div class="o">'+gc.warn.map(h).join('<br>')+'</div>':'')+'<div class="mut">'+h(gc.contra)+'</div><div class="mut">'+h(gc.isolation)+'</div>'+srcl(T.SRC.ASCOCSF+'; '+T.SRC.CSFDOSE)+dw('rozpoczęcie G-CSF – konsultacja hematologa/onkologa'));}
  return{H:H,lvl:lvl};}
 if(t==='mtp-add'){var mo=T.mtp({rbcGiven:g('rg'),rbcPerHour:g('rph'),deliveryMin:g('dm'),pltGiven:g('pg'),pltStock:g('ps'),ratioRbcPerPlt:+g('ratio')});
  if(!mo)return{H:box('orange','','Podaj KKCz podane, tempo zużycia i czas dostawy. Brak wyniku bez danych.'),lvl:'ok'};
  H+=box('red','Zamówienie KKP z RCKiK Kraków','<div class="big">Zamów: '+mo.order+' dawek KKP</div><div>Przewidywane KKCz do czasu dostawy: <b>'+F(mo.projectedRbc,1)+' j.</b> · KKP łącznie <b>'+mo.pltTotal+'</b> dawek · osocze <b>'+mo.plasmaUnits+' j.</b> (1:'+mo.plasmaRatio+')</div><div class="mut">'+h(mo.txt)+'</div><ul><li>'+mo.warn.map(h).join('</li><li>')+'</li></ul>'+srcl(T.SRC.ESAT)+dw('czas dostawy i protokół MTP – lokalnie'));return{H:H,lvl:'red'};}
 return{H:H,lvl:lvl};}
function rbcRef(){return box('','Progi Hb (stabilny dorosły, bez krwotoku)',tbl(['Sytuacja','Próg'],[['Stabilny dorosły','7 g/dl'],['Kardiochirurgia','7,5 g/dl'],['Ortopedia / choroba sercowo-naczyniowa','8 g/dl'],['ACS / zawał','8 g/dl (ESC); MINT 2023 – brak jednoznacznej korzyści strategii liberalnej (<10) '+dw()],['Ostre krwawienie niestabilne','wg stanu klinicznego; cel Hb 7–9 g/dl']])+srcl(T.SRC.AABB+'; '+T.SRC.MINT+'; '+T.SRC.ESAT));}
function pltRef(){var rows=Object.keys(T.PLT_CTX).map(function(k){var c=T.PLT_CTX[k];return [c.l,'<' +c.t+' ×10⁹/l',c.s]});return box('','Progi PLT dla przetoczenia KKP',tbl(['Sytuacja','Próg','Źródło'],rows)+'<div class="mut">1 dawka terapeutyczna dorosłego: KKP aferezowy lub pulowany z 4–6 dawców.</div>'+srcl(T.SRC.BSH));}
// =========================== AHF – pompa katecholamin ===========================
function dcm(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/(\d)\.(\d)/g,'$1,$2');}
// 11.11.2026 (audyt, faza 2): jeden silnik pomp – moduł „Pompy SOR” (mod/pompy). Dawniej: kalkulator B1 (calc/pressB1.js) + zakładki noradrenalina/dobutamina/dopamina w ONS.
// Tu tylko ściąga (miejsce leku w AHF, zakres, receptura w Pompach) i przycisk „Otwórz w Pompach” z wybranym presetem. Treści przeniesione bez zmian dawek.
var AHF_PUMPS=[
 {k:'nor',n:'Noradrenalina',p:[['noradrenalina_c80','centralnie 80 µg/ml (domyślnie)'],['noradrenalina_c','centralnie 40 µg/ml (ChPL)'],['noradrenalina_p','obwodowo 20 µg/ml (Levonor)']],r:'0,05–0,5 µg/kg/min (start 0,05–0,1)',c:'Wazopresor 1. rzutu we wstrząsie; cel MAP ≥65 mmHg. Obwodowo ≤20 µg/ml, dawka >0,1 µg/kg/min obwodowo – ostrzeżenie.'},
 {k:'dob',n:'Dobutamina',p:[['dobutamina','250 mg/50 ml = 5 mg/ml']],r:'2,5–10 µg/kg/min (ChPL wyjątkowo do 40)',c:'Niski rzut z hipoperfuzją; może obniżać RR i wywoływać tachyarytmie; efekt osłabia beta-bloker.'},
 {k:'adr',n:'Adrenalina',p:[['adrenalina','5 mg/50 ml = 100 µg/ml']],r:'0,05–0,5 µg/kg/min',c:'Wstrząs kardiogenny – lek 2. rzutu (ChPL: 0,05–0,5 µg/kg/min); ciężka bradykardia 2–10 µg/min (ChPL). Tachyarytmie, mleczany ↑ (efekt β2).'},
 {k:'dop',n:'Dopamina',p:[['dopamina','amp. 1%: 150 mg/50 ml = 3 mg/ml']],r:'1–5 µg/kg/min (ChPL do 20–50)',c:'ESC 2021: nie jest lekiem pierwszego wyboru (arytmie); dawka >5 µg/kg/min działa wazopresyjnie. Amp. 4% (200 mg/5 ml): 3,75 ml = 150 mg do 50 ml daje to samo stężenie 3 mg/ml co preset (ChPL: 0,4–3,2 mg/ml).'},
 {k:'lev',n:'Levosimendan',p:[['levosimendan','1 ml (2,5 mg)/50 ml G5% = 0,05 mg/ml']],r:'0,1 µg/kg/min, 0,05–0,2 (24 h)',c:'Przeciwwskazany: ciężka hipotensja i tachykardia, CrCl <30, ciężka niewydolność wątroby, TdP. Bolus 6–12 µg/kg w 10 min opcjonalny (pomiń przy hipotensji). Dostępność w SOR: DO DECYZJI LOKALNEJ.'},
 {k:'ntg',n:'Nitrogliceryna',p:[['nitrogliceryna','50 mg/50 ml = 1 mg/ml (bez rozcieńczenia)']],r:'0,75–8 mg/h (12,5–133 µg/min)',c:'Tylko przy SBP >110 mmHg; przeciwwskazane z PDE-5/riocyguatem. Bez bolusa.'},
 {k:'fur',n:'Furosemid (wlew)',p:[['furosemid','500 mg/50 ml = 10 mg/ml (bez rozcieńczenia)']],r:'ESC: wlew 5–40 mg/h',c:'Najpierw bolus 20–40 mg i.v. (nieleczony) lub 1–2× dawka doustna; ocena diurezy/Na w moczu po 2 h; max ChPL 1500 mg/dobę.'}];
function pompaBtn(id,l){return '<button class="tg" data-nav="1" data-open-pompa="'+id+'" onclick="SKS.openPompa(\''+id+'\')">💉 Otwórz w Pompach: '+l+'</button>';}
function ahfTab(H){var Fm=H.F;
 return{id:'pompy',name:'Leki wlewowe → Pompy SOR',
  form:function(){return '';},
  calc:function(g,P){var html='',w=P.w>0?P.w:null;
   html+=H.box('Leki wlewowe w AHF – ściąga (ESC 2021/2023, ChPL; decyzja lekarza)','<p>Przeliczenie ampułki → ml/h, limity stężeń, przeniesienie do rejestru: <b>jeden kalkulator – moduł Pompy SOR</b>. Przycisk otwiera Pompy z wybranym lekiem.</p>'+H.table(['Lek','Kiedy / uwagi','Typowy zakres','Pompy SOR'],AHF_PUMPS.map(function(d){return [d.n,d.c,d.r,d.p.map(function(q){return pompaBtn(q[0],q[1]);}).join('<br>')];})),'');
   // worki 250 ml wg ChPL (pompa objętościowa) – Pompy SOR liczą strzykawki 20/50 ml
   var bag=function(mgml,dose){return w?Fm(dose*w*60/1000/mgml,1)+' ml/h':'—';};
   html+=H.box('Worek 250 ml wg ChPL (pompa objętościowa)','<p>Dobutamina 250 mg do 250 ml = <b>1 mg/ml</b> (500 ml = 0,5 mg/ml); dopamina 4% 200 mg do 250 ml = <b>0,8 mg/ml</b> (ChPL: 100–800 mg do 250 ml). ml/h = dawka [µg/kg/min] × masa × 60 / 1000 / stężenie [mg/ml].</p>'+(w?H.table(['Lek (worek)','Dawka','ml/h przy '+Fm(w,0)+' kg'],[['Dobutamina 1 mg/ml','2,5 µg/kg/min',bag(1,2.5)],['Dobutamina 1 mg/ml','5 µg/kg/min',bag(1,5)],['Dobutamina 1 mg/ml','10 µg/kg/min',bag(1,10)],['Dopamina 0,8 mg/ml','2 µg/kg/min',bag(0.8,2)],['Dopamina 0,8 mg/ml','5 µg/kg/min',bag(0.8,5)]]):'<p class="mut">Podaj masę ciała w pasku pacjenta, aby zobaczyć ml/h.</p>'),'');
   html+=H.box('Dostęp obwodowy – limit czasu i kontrola','<p>Wazopresor obwodowo tylko do czasu założenia dostępu centralnego (wartość robocza np. 60 min – <span class="dw">ROBOCZE – ustalić lokalnie</span>). Duża żyła przedramienia / dołu łokciowego (nie grzbiet dłoni), kontrola miejsca wkłucia przy starcie, po każdej zmianie dawki i regularnie (np. co 15–30 min – lokalnie); przy wynaczynieniu: zatrzymaj wlew, aspiruj, powiadom lekarza, postępowanie wg lokalnej procedury (np. fentolamina przy noradrenalinie/adrenalinie). RR co 5 min po starcie i po każdej zmianie dawki, potem co 15 min.</p><p><small>Źródło: Owen VS i wsp., Crit Care 2021;25:146; ChPL Levonor (RPL 3745) i Noradrenaline Kabi (RPL 43461).</small></p>','orange');
   return{html:html,alarm:false};}};}

window.SKB1={altForm:altForm,altCalc:altCalc,protForm:protForm,protCalc:protCalc,compatHtml:compatHtml,tfForm:tfForm,tfCalc:tfCalc,ahfTab:ahfTab,ciHtml:ciHtml,ciRead:ciRead,ciBox:ciBox,sel:sel,sub:sub,srcl:srcl,dw:dw,gl:gl,tbl:tbl,box:box,nowHM:nowHM,allSrc:allSrc};
})();
