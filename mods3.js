(function(){var C=SK.core,F=C.fmt,U=SKM.util,inp=U.inp,bx=U.bx,src=U.src,chk=U.chk,tabbed=U.tabbed,B=SK.b3;
function dw(t){return ' <span class="dw">'+(t||'DO WERYFIKACJI')+'</span>';}
function nw(){return {H:bx('orange','','Podaj masę ciała w pasku pacjenta.'),lvl:'ok'};}
var info=function(k,extra){return '<h3>Źródła</h3>'+src(B.SRC[k])+(extra||'');};
// ANAFILAKSJA
var ANA=tabbed({id:'ana',icon:'🐝',name:'Anafilaksja'},'Anafilaksja',[['a','Leczenie'],['obs','Obserwacja / wypis']],
 function(t){if(t==='obs')return inp('doses','Dawki adrenaliny i.m.','')+'<label>Godzina ustąpienia objawów <input id="anaTres" type="time"></label>'+chk('biph','reakcja dwufazowa w wywiadzie')+chk('sev','ciężka reakcja (hipotensja / hipoksja)')+chk('asth','ciężka astma')+chk('absorb','możliwe dalsze wchłanianie alergenu (np. lek o przedł. uwalnianiu)')+chk('night','przyjęcie późnym wieczorem / w nocy')+chk('access','utrudniony dostęp do pomocy')+chk('pens','2 autowstrzykiwacze + instruktaż + pod opieką')+chk('inf','wlew adrenaliny / wazopresor');
  return chk('bb','beta-bloker')+chk('refr','oporna (2 dawki i.m. + płyny bez poprawy)')+chk('hypo','hipotensja mimo wlewu adrenaliny')+chk('bron','skurcz oskrzeli')+chk('upper','obrzęk górnych dróg oddechowych');},
 function(t,g,P){var w=P.w,H='';
  if(t==='obs'){var el=document.getElementById('anaTres'),tr=el?el.value:'',o=B.anaObs({doses:g('doses'),biph:g('biph'),severe:g('sev'),asthma:g('asth'),absorb:g('absorb'),night:g('night'),access:g('access'),pens:g('pens'),infusion:g('inf')}),lvl='ok';
   if(!o){H+=bx('orange','Czas obserwacji','Wpisz liczbę dawek adrenaliny i.m. (≥1).');return{H:H,lvl:'ok'};}
   if(o.hosp){lvl='red';H+=bx('red','Hospitalizacja','<span class="big" id="anaObsRes">HOSPITALIZACJA</span><div>'+o.why+'</div>');}
   else{var u=B.obsUntil(tr,o.h);if(!u){H+=bx('red','Obserwacja ≥'+o.h+' h','<span class="big" id="anaObsRes">≥ '+o.h+' h od ustąpienia objawów</span><div>'+o.why+'</div><div class="o">Wpisz godzinę ustąpienia objawów, aby wyliczyć koniec obserwacji.</div>');lvl='red';}
    else{if(u.active){lvl='red';}
     H+=bx(u.active?'red':'ok','Obserwacja ≥'+o.h+' h (RCUK 2021)','<span class="big" id="anaObsRes">'+(u.active?'Obserwacja do '+u.label:'Czas obserwacji minął ('+u.label+')')+'</span><div>'+o.why+'</div>'+(u.active?'<div>Pozostało: '+Math.floor(u.leftMin/60)+' h '+(u.leftMin%60)+' min</div>':''));}}
   H+=bx('','Przed wypisem – zalecenia','<ul><li>2 autowstrzykiwacze adrenaliny + instruktaż</li><li>skierowanie do poradni alergologicznej</li><li>tryptaza: zaraz po objawach, po ok. 2 h i po ≥24 h (EAACI)</li><li>pisemna informacja o objawach nawrotu (reakcja dwufazowa)</li></ul>');
   
   return{H:H,lvl:lvl};}
  var a=B.adrIM(w,P.age),f=B.anaFluid(w,P.age);
  H+=bx('red','1. Adrenalina i.m. (1 mg/ml) – przednio-boczna część uda',(a.needW?'<span class="big">Podaj masę dziecka</span><div class="r">Niemowlę &lt;6 mies.: 0,01 mg/kg i.m. (ChPL) – dawka stała nie jest stosowana. Strzykawka 1 ml (0,01 ml/kg).</div>':'<span class="big">'+F(a.mg,3)+' mg = '+F(a.ml,3)+' ml</span><div>Powtórz po 5 min, jeśli brak poprawy (RCUK 2021; ChPL: 5–15 min)</div>'+(!(w>0)&&!(P.age<12)?'<div class="o">Brak masy – dawka dorosłego 0,5 mg</div>':'')+(a.note?'<div class="o">'+a.note+'</div>':''))+'<div class="mut">Roztwór 1 mg/ml (1:1000) tylko i.m.; do podania i.v. wymaga rozcieńczenia do 0,1 mg/ml (1:10 000) – ChPL.</div>');
  H+=bx('ok','2. Płyny','<b>'+(Array.isArray(f.ml)?'500–1000 ml':F(f.ml,0)+' ml')+'</b> krystaloidu i.v. szybko; powtarzaj wg odpowiedzi (często kilka litrów)');
  if(g('refr')){var r=B.anaRefr(w);
   H+=bx('red','3. Anafilaksja oporna – wlew adrenaliny i.v. (RCUK 2021)','<div class="r">Wezwij anestezjologa. Do czasu rozpoczęcia wlewu kontynuuj adrenalinę i.m. co 5 min.</div>'+(r?'<div id="anaInf"><b>Start: 5–10 µg/kg/h = '+F(r.ugkgminLo,3)+'–'+F(r.ugkgminHi,3)+' µg/kg/min = '+F(r.ugminLo,1)+'–'+F(r.ugminHi,1)+' µg/min ('+F(r.ughLo,0)+'–'+F(r.ughHi,0)+' µg/h)</b></div><table class="tb"><tr><th>Receptura</th><th>Przygotowanie</th><th>ml/h (start)</th></tr>'+r.rec.map(function(q){return '<tr'+(q.def?' class="def"':'')+'><td>'+q.l+(q.def?' <b>(wybrana)</b>':'')+'</td><td>'+q.prep+'</td><td><b>'+F(q.mlhLo,1)+'–'+F(q.mlhHi,1)+' ml/h</b></td></tr>'}).join('')+'</table><div>Miareczkuj co 2–5 min wg RR, HR, perfuzji; ciągłe EKG, pomiar RR (najlepiej inwazyjny).</div>':'<div class="o">Podaj masę ciała w pasku pacjenta – rachunek pompy zależy od masy.</div>')+'<div class="mut">RCUK 2021: 1 mg/100 ml, 0,5–1 ml/kg/h. Receptura 20 µg/ml daje tę samą dawkę w połowie objętości.</div>'+dw('DO DECYZJI LEKARZA – sprawdź z protokołem szpitala'));}
  if(g('hypo')){var n=B.anaNor(w,0.05);H+=bx('red','Hipotensja mimo adrenaliny','<ul><li>kolejne bolusy krystaloidu 500–1000 ml (dzieci 10 ml/kg)</li><li>drugi wazopresor – <b>decyzja anestezjologa</b>: noradrenalina'+(n?' 80 µg/ml: 0,05 µg/kg/min = '+F(n.ugmin,1)+' µg/min = <b id="anaNor">'+F(n.mlh,1)+' ml/h</b> ('+n.prep+')':' (podaj masę)')+'; alternatywnie wazopresyna lub metaraminol wg dostępności</li><li>wczesna konsultacja OIT</li></ul>'+dw('DO DECYZJI LEKARZA'));}
  if(g('bb')){var gl=B.anaGlucagon();H+=bx('orange','Pacjent na β-blokerze – glukagon (anafilaksja)','<b id="anaGlu">'+gl.txt+'</b><div class="mut">'+gl.alt+'</div><div class="o">'+gl.warn+'</div><div class="mut">Schemat zatrucia β-blokerem jest inny – moduł Toksykologia.</div>');}
  if(g('bron'))H+=bx('orange','Skurcz oskrzeli','Salbutamol w nebulizacji (dawka jak w zaostrzeniu astmy wg protokołu SOR) – po adrenalinie, nie zamiast niej.'+dw('dawka DO WERYFIKACJI'));
  if(g('upper'))H+=bx('red','Obrzęk górnych dróg oddechowych','Adrenalina w nebulizacji jako leczenie wspomagające (dawka wg protokołu szpitala) – nie zastępuje i.m.; <b>wczesna intubacja</b> (trudne drogi oddechowe – anestezjolog).'+dw());
  H+=bx('','Leki drugiego rzutu i laboratorium','Tlen, pozycja leżąca (nogi uniesione). Antyhistaminiki i glikokortykosteroidy NIE ratują życia i nie mogą opóźniać adrenaliny (RCUK 2021). Tryptaza: zaraz po objawach, po ok. 2 h i po ≥24 h (EAACI). Czas obserwacji – zakładka „Obserwacja / wypis”.');
  return{H:H,lvl:'red'};},info('ana','<p>Adrenalina i.m.: 0,01 mg/kg, maks. 0,5 mg; dzieci: 6–12 lat 0,3 mg; 6 mies.–6 lat 0,15 mg; &lt;6 mies. 0,01 mg/kg (ChPL Adrenalina WZF, RCUK). Wlew w anafilaksji opornej: RCUK 2021 – 1 mg/100 ml (10 µg/ml) 0,5–1 ml/kg/h. Glukagon przy β-blokerze: 1–2 mg i.v./i.m., powtarzany co 5 min (ASCIA, RACGP); WAO 2020: 1–5 mg i.v. w 5 min, potem 5–15 µg/min. Obserwacja: RCUK 2021 (2 / 6 / 12 h, wlew → hospitalizacja).</p>'));
// SEPSA
var SEP=tabbed({id:'sepsis',icon:'🦠',name:'Sepsa'},'Sepsa – pakiet 1 h',[['b','Pakiet 1 h'],['abx','Antybiotyki']],
 function(t){return t==='b'?inp('sbp','SBP','mmHg')+inp('dbp','DBP','mmHg')+inp('lac','Mleczany','mmol/l'):'';},
 function(t,g,P){var w=P.w,H='',lvl='ok';
  if(t==='b'){var o=B.sepsis({w:w,sbp:g('sbp'),dbp:g('dbp'),lac:g('lac'),heart:P.co.heart,renal:P.co.renal});lvl=o.lvl;
   H+=bx(o.lvl,'','MAP <span class="big">'+F(o.map,0)+'</span> mmHg · mleczany '+F(g('lac'),1)+(o.shock?'<div class="r">⚠ Wstrząs septyczny</div>':''));
   H+=bx('ok','Pakiet 1 h (SSC 2021)','1. Mleczany · 2. Posiewy krwi przed antybiotykiem · 3. Antybiotyk szerokie spektrum &lt;1 h · 4. Płyny · 5. Noradrenalina, cel MAP ≥65');
   if(o.fluid)H+=bx(o.fluidCaution?'orange':'red','Płyny krystaloidy',(w>0?'<span class="big">'+F(o.fluid,0)+' ml</span> (30 ml/kg) w 3 h':'30 ml/kg – podaj masę')+(o.fluidCaution?'<div class="o">Serce/nerki – ostrożnie, ocena odpowiedzi na płyny</div>':''));
   if(o.hypo)H+=bx('red','Wazopresor','Noradrenalina, cel MAP ≥65 → moduł <b>Pompy SOR</b>');}
  else{var c=P.crcl,a=B.abx(c),v=B.vancoLoad(w);
   H+=bx(isFinite(c)?'':'orange','CrCl '+(isFinite(c)?F(c,0)+' ml/min':'— (podaj wiek i kreatyninę; pokazano dawki bez korekty)'),'<div class="mut">Pierwsza dawka zawsze pełna; wybór wg lokalnej epidemiologii.</div>');
   H+=a.map(function(x){return bx(x.adj?'orange':'ok',x.n,'<span class="big">'+x.d+'</span>')}).join('');
   if(v)H+=bx('ok','Wankomycyna (MRSA)','<span class="big">'+F(v.lo,0)+'–'+F(v.hi,0)+' mg</span> · '+v.txt);}
  return{H:H,lvl:lvl};},info('sep','<p>Płyny 30 ml/kg przy hipotensji lub mleczanach ≥4 (SSC 2021: sugestia). Antybiotyki: wybór empiryczny '+dw('lokalna polityka antybiotykowa')+'.</p>'));
// ZATRUCIA
var TOX=tabbed({id:'tox',icon:'☠️',name:'Zatrucia'},'Zatrucia',[['p','Paracetamol'],['o','Opioidy'],['b','Benzodiazepiny']],
 function(t){return t==='p'?inp('mg','Dawka','mg')+inp('t','Czas od spożycia','h')+inp('lv','Stężenie','@para')+chk('stag','spożycie rozłożone / nieznany czas'):t==='o'?chk('dep','uzależnienie od opioidów')+inp('eff','Skuteczna dawka','mg'):chk('tca','TLPD / leki prodrgawkowe')+chk('chronic','przewlekłe BZD')+chk('seiz','padaczka')+chk('unk','nieznana mieszanina');},
 function(t,g,P){var w=P.w,H='',lvl='ok';
  if(t==='p')return{H:bx('red','Paracetamol i NAC – nowy kalkulator (Etap C)','Kalkulator NAC 3-workowy, nomogram Rumack–Matthew i zasada „NAC od razu” są w zakładce <b>Zatrucia → Paracetamol: NAC + nomogram</b>. Ten stary ekran nie liczy już NAC, aby nie dublować dwóch różnych schematów.<div><button class="tg" onclick="SKS.show(\'tox\')">→ Zatrucia</button></div>'),lvl:'ok'};
  if(t==='o'){var n=B.naloxone(g('dep'));H+=bx('ok','Nalokson','<span class="big">'+n.txt+'</span>');
   if(isFinite(g('eff')))H+=bx('ok','Wlew','<span class="big">'+F(B.naloxInf(g('eff')),2)+' mg/h</span> (2/3 skutecznej dawki na h)'+dw());}
  if(t==='b'){var f=B.flumazenil({tca:g('tca'),chronic:g('chronic'),seiz:g('seiz'),unk:g('unk')});lvl=f.lvl;
   H+=bx(f.lvl,'Flumazenil',f.bad?'<div class="r">⚠ Przeciwwskazany / niebezpieczny: '+f.bad.join(', ')+' – ryzyko drgawek</div><div class="mut">Wspomaganie oddechu zamiast flumazenilu</div>':'<span class="big">'+f.txt+'</span>');}
  return{H:H,lvl:lvl};},info('tox','<p>Paracetamol i NAC: patrz zakładka „Paracetamol: NAC + nomogram” (Etap C). '+dw()+': wlew naloksonu 2/3 dawki/h (Goldfrank).</p>'));
// AF
var AF=tabbed({id:'af',icon:'💓',name:'AF'},'Migotanie przedsionków',[['s','CHA₂DS₂-VA'],['r','Kontrola rytmu serca'],['e','Kardiowersja: czas i warunki'],['ec','Kardiowersja elektryczna'],['k','Farmakologicznie'],['po','Po kardiowersji']],
 function(t){return t==='s'?chk('chf','niewydolność serca')+chk('htn','nadciśnienie')+chk('dm','cukrzyca')+chk('stroke','udar/TIA/zator')+chk('vasc','choroba naczyń'):t==='r'?chk('hfd','niewydolność serca zdekompensowana'):SORC.afForm(t);},
 function(t,g,P,X){var w=P.w,H='',lvl='ok';
  if(t==='s'){var c=B.cha({chf:g('chf')||P.co.heart,htn:g('htn'),dm:g('dm'),stroke:g('stroke'),vasc:g('vasc'),age:P.age,sex:P.sex});
   H=bx(c.va>=2?'orange':'ok','CHA₂DS₂-VA (ESC 2024)','<span class="big">'+c.va+'</span> → antykoagulacja: <b>'+c.oacVA+'</b>')+bx('','CHA₂DS₂-VASc (ACC/AHA 2023)','<span class="big">'+c.vasc+'</span> → <b>'+c.oacVASc+'</b>')+(!isFinite(P.age)?bx('orange','','Podaj wiek w pasku pacjenta.'):'')+(!P.sex?bx('orange','','Płeć nieznana – CHA₂DS₂-VASc bez punktu za płeć żeńską.'):'');}
  if(t==='r'){var r=B.afRate(w,{hf:P.co.heart,hfDecomp:g('hfd'),crcl:P.crcl});H=r.map(function(x){return bx(x.lvl,x.n+(x.dw?dw('dostępność i.v. w PL'):''),'<b>'+x.d+'</b>'+(x.lvl==='red'?'<div class="r">⚠ Unikaj w niewydolności serca</div>':''))}).join('');}
  if(t==='e'||t==='ec'||t==='k'||t==='po')return SORC.afCalc(t,g,P,X);
  return{H:H,lvl:lvl};},info('af','<p>Kardiowersja (Etap C): ESC 2024, ERC 2021, PAMW 2023, ChPL Rytmonorm i Phenazolinum, AnPAF/AnProAF/CANT – źródła i rozbieżności w zakładkach. Diltiazem i.v. '+dw('dostępność w PL')+'. Flekainid i.v. niedostępny w szpitalu użytkownika.</p>'));
AF.snapshot=function(){var t=window.SORC&&SORC.afSnap?SORC.afSnap():'';return t?{text:t}:null;};

// GI
var GI=tabbed({id:'gib',icon:'🩸',name:'Krwawienie z GI'},'Krwawienie z górnego odcinka PP',[['g','Glasgow-Blatchford'],['l','Leczenie'],['e','Endoskopia: kiedy i gdzie']],
 function(t){return t==='e'?SORC.giForm():t==='g'?inp('urea','Mocznik (urea)','@urea')+inp('hb','Hb','g/dl')+inp('sbp','SBP','mmHg')+inp('hr','HR','/min')+chk('mel','smoliste stolce')+chk('syn','omdlenie')+chk('liv','choroba wątroby')+chk('hf','niewydolność serca'):chk('var','podejrzenie żylaków / marskość')+chk('card','choroba wieńcowa');},
 function(t,g,P,X){var w=P.w,H='',lvl='ok';
  if(t==='e')return SORC.giE(g);
  H=SORC.giBanner();
  if(t==='g'){var u=g('urea');var s=B.gbs({urea:u,hb:g('hb'),sbp:g('sbp'),hr:g('hr'),melena:g('mel'),syncope:g('syn'),liver:g('liv')||P.co.liver,hf:g('hf')||P.co.heart,sex:P.sex});lvl=s.lvl;
   H+=bx(s.lvl,'Glasgow-Blatchford','<span class="big">'+s.score+'</span> '+(s.low?'→ niskie ryzyko (≤1): rozważ wypis i endoskopię ambulatoryjną':'→ hospitalizacja, endoskopia ≤24 h'));}
  if(t==='l'){var hb=B.hbThreshold(g('card')||P.co.heart),te=B.terli(w);
   H+=bx('ok','PPI','<span class="big">Pantoprazol 80 mg i.v.</span><div>potem 40 mg i.v. co 12 h (ESGE 2021)</div>');
   H+=bx('ok','Przetoczenie KKCz','Hb ≤'+hb.t+' g/dl → cel <b>'+hb.target+'</b>');
   if(g('var')){H+=bx(g('card')?'red':'orange','Terlipresyna (Glypressin)',(te?'<span class="big">'+te.txt+'</span>':'Podaj masę')+(g('card')?'<div class="r">⚠ Choroba wieńcowa – ostrożnie/przeciwwskazanie (ChPL)</div>':''));
    H+=bx('ok','Antybiotyk','Ceftriakson 1 g i.v. co 24 h (Baveno VII)');if(g('card'))lvl='red';}
   H+=bx('','','Kwas traneksamowy – niezalecany (HALT-IT). Endoskopia ≤24 h; ≤12 h przy żylakach (godziny pracowni: zakładka „Endoskopia: kiedy i gdzie”).');}
  return{H:H,lvl:lvl};},info('gi','<p>Terlipresyna wg ChPL: <50 kg 1 mg, 50–70 kg 1,5 mg, >70 kg 2 mg co 4 h; Baveno VII: 2 mg co 4 h, po kontroli 1 mg co 4 h, 2–5 dni.</p>'));
var L=SKM.list;[ANA,SEP,TOX,AF,GI].forEach(function(m){for(var i=0;i<L.length;i++)if(L[i].id===m.id)L[i]=m;});})();
