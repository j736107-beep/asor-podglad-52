// fix27 (t57u pkt 7): zakładki Zatrucia – leki psychiatryczne / kardiologiczne / substancje chemiczne (silnik calc/toxB3.js = window.SKT3).
// Po wyborze substancji widoczne są tylko pola, które ta substancja wykorzystuje; okna wyników: rozpoznanie → leczenie wstępne (leki, dawki, pompy) → dalsze postępowanie (badania z czasem, kolejne dawki, EXTRIP, toksykolog Kraków).
(function(){'use strict';
function T(){return window.SKT3;}
function tabs(H){var number=H.number,select=H.select,check=H.check,group=H.group,box=H.box,table=H.table,reviewed=H.reviewed,esc=H.esc,tri=H.tri;
 function fld(id){var f=T().FIELDS[id];if(!f)return '';if(f[0]==='n')return number(id,f[1],f[2],'',f[3],f[4]);if(f[0]==='c')return check(id,f[1]);if(f[0]==='t')return tri(id,f[1]);if(f[0]==='s')return select(id,f[1],f[2]);return '';}
 function ids(g){var s={};T().list(g).forEach(function(x){T().AG[x[0]].f.forEach(function(k){s[k]=1;});});return Object.keys(s);}
 function form(g,title){return function(){var L=T().list(g);var all=ids(g);
  var ex=['hrs','amt','sr','chr','bbt','gast'],st=['sbp','hr','qrs','qtc','spo2','temp','coma','conf','seiz','mv','shock','arr','edema','drool','perf','resp','bronch','fire','h2s','cyan'],hu=['sclon','iclon','oclon','agit','diaph','trem','hrefl','hton'];
  var lab=all.filter(function(k){return ex.indexOf(k)<0&&st.indexOf(k)<0&&hu.indexOf(k)<0;});
  function grp(t,list){var h=list.filter(function(k){return all.indexOf(k)>=0;}).map(fld).join('');return h?'<div data-t3grp>'+group(t,h)+'</div>':'';}
  return group(title,select('ag','Substancja',[['','— wybierz —']].concat(L)))+grp('Ekspozycja',ex)+grp('Stan pacjenta',st)+grp('Objawy serotoninowe (kryteria Huntera)',hu)+grp('Badania',lab)+reviewed();};}
 function ctx(id,g,P){var i={w:P&&P.w};T().AG[id].f.forEach(function(k){var v=g(k);if(v!==undefined)i[k]=v;});return i;}
 function lst(a){return '<ul>'+a.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>';}
 function srcs(keys){var S=T().SRC,u={};return '<details class="clinical-sources"><summary>Źródła dawek i zaleceń (weryfikacja 21.11.2026)</summary><ul>'+keys.filter(function(k){if(u[k]||!S[k])return false;u[k]=1;return true;}).map(function(k){var s=S[k];return '<li data-src="'+k+'">'+(s.u?'<a href="'+s.u+'" target="_blank" rel="noopener">'+esc(s.t)+'</a>':esc(s.t))+'</li>';}).join('')+'</ul></details>';}
 function calc(g,P){var id=g('ag');if(!id||!T().AG[id])return {html:box('Wybierz substancję','Po wyborze substancji pojawią się pola i algorytm: rozpoznanie → leczenie wstępne na SOR → dalsze postępowanie (badania z czasem, kolejne dawki do transferu, EXTRIP, kontakt z toksykologiem Kraków).','')};
  var p=T().plan(id,ctx(id,g,P));var S=T().SRC,h='';
  h+=box('☠️ '+esc(p.n),(p.warn.length?'<div class="r">'+p.warn.map(esc).join('<br>')+'</div>':'')+'<p class="mut">Toksykolog dyżurny Kraków (24 h): <b>12 411 99 99</b>. Propozycje do decyzji lekarza – dawki tylko ze źródeł podanych przy każdym leku.</p>',p.alarm?'red':'');
  h+=box('1. Rozpoznanie / objawy',lst(p.rec),'');
  var dz=p.doses.length?p.doses.map(function(d){return '<div class="t3-dose" data-t3dose><div class="t3-dn">💊 '+esc(d.d)+'</div>'+(d.flag?'<div class="o">⚠ '+esc(d.flag)+'</div>':'')+'<div><b>Dawka:</b> '+esc(d.dose)+'</div>'+(d.prep?'<div><b>Przygotowanie:</b> '+esc(d.prep)+'</div>':'')+(d.pump?'<div><b>Pompa / wlew:</b> '+esc(d.pump)+'</div>':'')+'<div class="mut"><b>Źródło:</b> '+d.src.map(function(k){return '<span data-dsrc="'+k+'">'+esc(T().short(k))+'</span>';}).join('; ')+'</div></div>';}).join(''):'<p class="mut">Brak leków do wyliczenia wg wprowadzonych danych.</p>';
  h+=box('2. Leczenie wstępne na SOR',lst(p.init)+'<div data-t3doses>'+dz+'</div>',p.doses.length&&p.alarm?'red':'');
  var lb=table(['Badanie','Kiedy','Źródło'],p.labs.map(function(l){return [esc(l[0]),esc(l[1]),l[2].map(function(k){return '<span class="mut">'+esc(T().short(k))+'</span>';}).join('; ')];}));
  h+=box('3. Dalsze postępowanie',lb+(p.next.length?lst(p.next):''),'');
  if(p.ex)h+=box('EXTRIP / leczenie pozaustrojowe',lst(p.ex.txt),p.ex.lvl);
  if(p.disc.length)h+=box('Rozbieżności źródeł',lst(p.disc),'orange');
  var all=p.src.slice();p.doses.forEach(function(d){all=all.concat(d.src);});p.labs.forEach(function(l){all=all.concat(l[2]);});if(p.ex)all=all.concat(p.ex.src);
  h+=srcs(all);
  return {html:h,alarm:p.alarm};}
 function after(el){var s=el.querySelector('#ag');if(!s)return;var id=s.value,a=id&&T().AG[id],show=a?a.f:[];
  el.querySelectorAll('.clinical-form input,.clinical-form select').forEach(function(e){if(!e.id||e.id==='ag'||e.id==='review')return;var lab=e.closest('label');if(lab)lab.style.display=show.indexOf(e.id)>=0?'':'none';});
  el.querySelectorAll('[data-t3grp]').forEach(function(gr){var vis=[].some.call(gr.querySelectorAll('label'),function(l){return l.style.display!=='none';});gr.style.display=vis?'':'none';});}
 return [{id:'tpsy',name:'Leki psychiatryczne i p/padaczkowe',form:form('psy','Leki psychiatryczne / przeciwpadaczkowe'),calc:calc,after:after},
  {id:'tcard',name:'Leki kardiologiczne',form:form('card','Leki kardiologiczne'),calc:calc,after:after},
  {id:'tchem',name:'Substancje chemiczne',form:form('chem','Substancje chemiczne'),calc:calc,after:after}];}
window.SORT3={tabs:tabs};
})();
