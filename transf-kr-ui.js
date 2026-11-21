/* fix29 (t71u): UI „Kreator przetoczenia” w module Transfuzjologia (PC). Kafelki kroków podświetlają się kolejno; wynik automatycznie. */
(function(){var K=function(){return SK.transfKr;},KEYS=['path','actx','cv','cgrp','cvs','ckd','tx','ckdcv','sym','taco','pctx'];
var DEP={path:['actx','cv','cgrp','cvs','ckd','tx','ckdcv','sym','taco'],actx:['cv','sym','taco'],cgrp:['cvs','ckd','tx','ckdcv','sym','taco'],cvs:['taco'],ckd:['taco']};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
var TIT={path:'1. Rodzaj niedokrwistości',actx:'2. Sytuacja kliniczna',cv:'3. Choroba sercowo-naczyniowa',cgrp:'2. Grupa chorych',cvs:'3. Rodzaj choroby sercowo-naczyniowej',ckd:'3. PChN – dializy',tx:'4. Kandydat do przeszczepu',ckdcv:'5. Choroba sercowo-naczyniowa',hb:'Hb',sym:'Objawy niedokrwistości niezależne od Hb',taco:'Ryzyko TACO (przeciążenia krążenia)',pctx:'KKP – sytuacja kliniczna'};
function form(){var U=SKM.util;return KEYS.map(function(k){return '<input type="hidden" id="kr_'+k+'">';}).join('')+U.inp('kr_hb','Hb','g/dl')+U.inp('kr_uml','Objętość jednostki KKCz z etykiety (opcjonalnie)','ml')+U.inp('kr_plt','PLT (jeśli dotyczy KKP)','×10⁹/l');}
function pick(k,v){var f=document.querySelector('#f'),e=f&&f.querySelector('#kr_'+k);if(!e)return;var set=function(id,val){var x=f.querySelector('#kr_'+id);if(x){x.value=val;if(x.oninput)x.oninput();}};
 (DEP[k]||[]).forEach(function(d){set(d,'');});set(k,e.value===v&&k==='pctx'?'':v);}
function tiles(k,cur,active,sugg){var Q=K().Q[k];return '<div class="kr-step'+(active?' kr-act':'')+(cur?' kr-done':'')+'" data-step="'+k+'"><div class="kr-t">'+TIT[k]+(sugg?' <span class="mut">'+sugg+'</span>':'')+'</div><div class="kr-opts">'+Q.map(function(o){return '<button type="button" class="kr-tile'+(cur===o[0]?' on':'')+'" data-k="'+k+'" data-v="'+o[0]+'" onclick="SKKR.pick(\''+k+'\',\''+o[0]+'\')">'+esc(o[1])+'</button>';}).join('')+'</div></div>';}
function inputs(g,P){var i={};KEYS.forEach(function(k){i[k]=g('kr_'+k)||'';});i.hb=g('kr_hb');i.uml=g('kr_uml');i.plt=g('kr_plt');i.w=P.w;i.age=P.age;
 ['hb','uml','plt'].forEach(function(k){if(typeof i[k]==='string'){var x=parseFloat(String(i[k]).replace(',','.'));i[k]=isFinite(x)?x:NaN;}});return i;}
function calc(g,P){var k=K(),i=inputs(g,P),o=k.plan(i),U=SKM.util,bx=U.bx,H='<div class="kr">',miss=o.miss,first=miss[0],ta=o.tacoAuto;
 o.steps.forEach(function(s){if(s==='hb'){H+='<div class="kr-step'+(first==='hb'?' kr-act':'')+(isFinite(i.hb)?' kr-done':'')+'" data-step="hb"><div class="kr-t">Hb – wpisz w polu „Hb” powyżej'+(isFinite(i.hb)?': <b>'+String(i.hb).replace('.',',')+' g/dl</b>':'')+'</div></div>';return;}
  if(s==='sym'){H+=tiles(s,i.sym,first===s,'('+k.SYM+')');return;}
  if(s==='taco'){H+=tiles(s,i.taco,first===s,ta.length?'– sugerowane TAK: '+ta.join(', ')+' (BSH 2017)':'(wiek >70, niewydolność serca/nerek, hipoalbuminemia, przewodnienie, niska masa ciała – BSH 2017)');return;}
  H+=tiles(s,i[s],s===first,'');});
 H+='</div>';
 if(!(P.w>0))H+=bx('orange','','Brak masy ciała w pasku pacjenta – liczba jednostek i ml/h przy ryzyku TACO nie zostaną wyliczone.');
 var lvl='ok';
 if(o.done){var rl=o.rule,cl=o.dec==='TAK'?(rl.op==='any'?'red':'orange'):o.dec==='ROZWAŻ'?'orange':'ok';lvl=rl.op==='any'?'red':o.dec==='NIE'?'ok':'orange';
  var b='<div class="big" id="krDec">'+o.decTxt+'</div><div id="krWhy">'+esc(rl.txt)+'</div>';
  if(rl.thr!=null)b+='<div>Próg: <b>'+(rl.op==='le'?'≤':'<')+rl.thr+' g/dl</b> · cel: <b>'+esc(rl.target)+'</b>'+(isFinite(i.hb)?' · Hb pacjenta: <b>'+String(i.hb).replace('.',',')+' g/dl</b>':'')+'</div>';
  o.notes.forEach(function(n){b+='<div class="o">'+esc(n)+'</div>';});
  if(o.dec!=='NIE'){if(rl.op==='any')b+='<div id="krUnits"><b>KKCz natychmiast wg hemodynamiki</b> – grupa nieznana: KKCz 0 (zakładka „Zgodność ABO/RhD”); masywne krwawienie – zakładka „Masywne przetoczenie”.</div>';
   else if(o.unitsNow)b+='<div id="krUnits"><span class="big">'+o.unitsNow+' j. KKCz teraz</span>'+(o.unitsTotal&&o.unitsTotal!==o.unitsNow?' <span class="mut">(do celu '+rl.goal+' g/dl orientacyjnie '+o.unitsTotal+' j.)</span>':'')+(o.inc?'<div class="mut">Przyrost ≈'+String(Math.round(o.inc*10)/10).replace('.',',')+' g/dl na jednostkę '+o.vol+' ml przy '+P.w+' kg (≈4 ml/kg → +1 g/dl; 1 j. ≈ +1 g/dl przy ~70 kg).</div>':'')+'</div>';
   if(o.unitsNote)b+='<div class="mut" id="krUnitsNote">'+esc(o.unitsNote)+'</div>';
   if(o.rate)b+='<div id="krRate"><b>Szybkość i czas:</b> '+esc(o.rate.txt)+'<div class="mut">Objętość jednostki '+o.vol+' ml'+(o.volLabel?' (z etykiety)':' – orientacyjnie; rzeczywistą odczytaj z etykiety i wpisz powyżej')+'.</div></div>';}
  b+='<div id="krMon"><b>Monitorowanie:</b><ul>'+o.mon.map(function(m){return '<li>'+esc(m)+'</li>';}).join('')+'</ul></div><div id="krHb"><b>Kontrola Hb:</b> '+esc(o.hbCtl)+'</div>';
  H+=bx(cl,'Wynik kreatora – KKCz',b);}
 else H+=bx('','','Wynik pojawi się automatycznie po wybraniu wszystkich kroków (brakuje: '+miss.map(function(m){return TIT[m]||m;}).join(', ')+').');
 /* KKP */
 H+='<div class="kr">'+tiles('pctx',i.pctx,isFinite(i.plt)&&!i.pctx,'(wpisz PLT powyżej)')+'</div>';
 if(o.kkp)H+=bx(o.kkp.need?'orange':'ok','KKP – próg <'+o.kkp.t+' ×10⁹/l','<div id="krPlt">'+esc(o.kkp.txt)+'</div>');
 if(o.done){var txt=o.text;H+=bx('','Tekst do skopiowania','<textarea id="krTxt" readonly rows="9" style="width:100%">'+esc(txt)+'</textarea><button type="button" class="tl-copy" id="krCopy" onclick="SKKR.copy()">📋 Kopiuj</button> <span class="mut" id="krCopied"></span>');}
 if(o.dd.length)H+=bx('orange','DO DECYZJI lekarza','<ul id="krDD">'+o.dd.map(function(d){return '<li>'+esc(d)+'</li>';}).join('')+'</ul>');
 var used={};o.src.concat(o.kkp?o.kkp.src:[]).forEach(function(s){used[s]=1;});var sl=Object.keys(used);if(sl.length)H+='<div class="mut kr-src"><b>Źródła wyniku:</b> '+sl.map(function(s){return esc(k.SRC[s]);}).join(' · ')+'</div>';
 return{H:H,lvl:lvl};}
function copy(){var t=document.getElementById('krTxt'),m=document.getElementById('krCopied');if(!t)return;var ok=function(){if(m)m.textContent='Skopiowano';},fb=function(){t.select();try{document.execCommand('copy');ok();}catch(e){}};
 try{if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t.value).then(ok,fb);return;}}catch(e){}fb();}
window.SKKR={form:form,calc:calc,pick:pick,copy:copy,inputs:inputs};})();
