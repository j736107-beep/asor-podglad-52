// fix21: wydruk modułu Stan padaczkowy – tylko dane wpisane / zaznaczone, dziennik podań, wyliczenie wybranego leku (dawka, ml, rozcieńczenie, pompa ml/h),
// etap leczenia z silnika, WNIOSKI. Bez źródeł, tabel porównawczych, akapitów ChPL i tekstów dydaktycznych. Dawki liczy wyłącznie silnik SE.
(function(r,f){var m=f();if(typeof module==='object'&&module.exports)module.exports=m;else r.SEPrint=m;})(this,function(){
'use strict';
var fin=Number.isFinite;
var CO={liver:'niewydolność wątroby',renal:'niewydolność nerek',cardiac:'choroba serca',preg:'ciąża',alco:'alkoholizm / niedożywienie / bariatria / wymioty',wern:'podejrzenie Wernickego',polg:'choroba mitochondrialna / POLG',ucd:'zaburzenia cyklu mocznikowego',plt:'PLT <100 G/l / skaza',carb:'karbapenem (meropenem)',resp:'pogorszenie oddychania'};
function D(x,d){if(!fin(x))return '—';return (+x.toFixed(d==null?1:d)).toString().replace('.',',');}
function hm(t){var d=new Date(t);return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);}
// E – silnik SE, st – stan (se4state), r – wynik E.compute, aux: {SH: nazwy preparatów, vals(k,r): wartości edytowane/domyślne, TH: SKThiamine}
function build(E,st,r,ctx,aux){ctx=ctx||{};aux=aux||{};st=st||{};var L=[],C=[],n=0,dose=false,log=st.log||[],co=st.co||{};
  function head(h){if(L.length)L.push('');L.push(h);}function line(l,x){if(x!=null&&String(x).trim()!=='')L.push(l?l+': '+x:String(x));}
  var flags=Object.keys(CO).filter(function(k){return co[k];});
  n+=(log.length?2:0)+(st.sel?1:0)+(st.t0?1:0)+flags.length+(st.zrmDoses>0?1:0)+(fin(st.crcl)?1:0);
  Object.keys(st.ed||{}).forEach(function(k){Object.keys(st.ed[k]||{}).forEach(function(x){if(fin(st.ed[k][x]))n++;});});
  if(!(r&&r.W>0)||(n===0&&!(ctx.print&&st.sel)))return{text:'',used:false,dose:false,n:n};
  head('STAN PADACZKOWY');
  line('Masa ciała',D(r.W,1)+' kg');
  if(st.t0)line('Początek napadu',st.t0+(r.elapsed!=null?' (od początku: '+r.elapsed+' min)':''));
  if(st.zrmDoses>0)line('Benzodiazepina przed SOR (ZRM)',st.zrmDoses+' '+(st.zrmDoses===1?'dawka':'dawki'));
  line('Zaznaczono',flags.map(function(k){return CO[k];}).join(', '));
  if(fin(st.crcl)&&co.renal)line('CrCl',D(st.crcl,0)+' ml/min');
  if(log.length){head('PODANO (DZIENNIK)');log.forEach(function(e){line(hm(e.t),e.txt);});}
  if((log.length||st.zrmDoses>0)&&r.benzoMsg&&r.benzoMsg.cls==='avoid')line('Benzodiazepiny',r.benzoMsg.txt);
  var k=st.sel;if(k&&r.drugs&&r.drugs[k]){var x=r.drugs[k],v=aux.vals?aux.vals(k,r):E.defaults(k,r),o=E.edit(k,v,r.W,r);
    if(o.lines&&o.lines.length){dose=true;head('WYLICZENIE – '+(x.name||k).toUpperCase());
      line('Preparat',aux.SH&&aux.SH[k]||x.name);
      line('Dawka',o.lines.join('; '));
      if(o.bad)(o.warn||[]).forEach(function(w){line('⚠ Uwaga',w);});else (o.warn||[]).forEach(function(w){line('Uwaga',w);});
      var fz=(x.flags||[]).filter(function(z){return z[0]!=='ok';})[0];if(fz)line('Ostrzeżenie',fz[1].split(';')[0].split(' — ')[0]);}}
  var s2=r.second;if(s2&&s2.title){line(s2.title,s2.evalAt?'ocena skuteczności ok. '+hm(s2.evalAt):'');}
  if(r.stage3Now)line('III rzut',r.stage3Msg);
  if(r.thiamine&&aux.TH&&aux.TH.card&&(co.alco||co.wern)){var c=aux.TH.card(r.thiamine),row=(c.rows||[]).filter(function(z){return z.k===c.active||(r.thiamine.wern&&z.k==='we');})[0];if(row)line('Tiamina',row.dose+' – '+row.how+' ('+row.amp.txt+')');}
  var l3=log.some(function(e){return r.drugs&&r.drugs[e.k]&&r.drugs[e.k].line===3;}),l2=log.some(function(e){return r.drugs&&r.drugs[e.k]&&r.drugs[e.k].line===2;});
  if(r.stage3Now||l3)C.push('Stan padaczkowy oporny: intubacja, wlew anestetyku z ciągłym EEG – OIT (konsultacja anestezjologiczna).');
  else if(l2)C.push('Po leku II rzutu: ocena skuteczności; przy utrzymywaniu się napadów – III rzut i OIT.');
  C.push('Hospitalizacja i obserwacja neurologiczna; miejsce leczenia (oddział / OIT) – decyzja lekarza.');
  L.push('');L.push('WNIOSKI:');C.forEach(function(c){L.push('– '+c);});
  var text=L.join('\n');return{text:text,used:n>=2||(!!ctx.print&&!!st.sel),dose:dose,n:n};}
return{build:build};});
