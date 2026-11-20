// fix21: wydruk modułu Elektrolity SOR – tylko wpisane wyniki i zaznaczone opcje, wyliczone dawki i pompy (KCl, MgSO₄ – pełny opis), protokół bolusów NaCl,
// monitorowanie, WNIOSKI wg ciężkości z silnika. Bez źródeł, akapitów ChPL, list kryteriów i tekstów dydaktycznych. Dawki liczy wyłącznie silnik EL.
(function(r,f){var m=f();if(typeof module==='object'&&module.exports)module.exports=m;else r.ELPrint=m;})(this,function(){
'use strict';
var fin=Number.isFinite;
var LAB={hiperK:[['k','K⁺','mmol/l'],['glu','glikemia','mmol/l'],['be','BE','mmol/l']],hipoK:[['k','K⁺','mmol/l']],hipoNa:[['na','Na⁺ wyjściowe','mmol/l'],['k','K⁺','mmol/l'],['glu','glikemia','mmol/l']],hiperNa:[['na','Na⁺','mmol/l']],
 hipoMg:[['mg','Mg','mgu']],hiperMg:[['mg','Mg','mgu']],hipoCa:[['ca','Ca','cau'],['alb','albumina','albu']],hiperCa:[['ca','Ca','cau'],['alb','albumina','albu']],hipoP:[['p','fosforany','pu']]};
var OPT={hiperK:[['ecg','zmiany EKG'],['arrest','NZK'],['acid','kwasica'],['dig','digoksyna']],hipoK:[['ecg','EKG/niedowład'],['cvc','cewnik centralny'],['dka','DKA/HHS']],
 hipoNa:[['sympt:severe','objawy ciężkie'],['sympt:mod','objawy umiarkowane'],['sympt:none','brak / łagodne objawy'],['vol:hypo','hipowolemia'],['vol:eu','euwolemia'],['vol:hyper','hiperwolemia'],['alco','alkoholizm'],['malnut','niedożywienie'],['cirr','marskość / ciężka ch. wątroby'],['wern','podejrzenie Wernickego'],['odsRisk','inne ryzyko ODS']],
 hiperNa:[['acute','ostra <48 h'],['shock','wstrząs']],hipoMg:[['tdp','TdP'],['sympt','objawy/arytmia']],hiperMg:[['sympt','objawy']],hipoCa:[['sympt','objawy'],['ion','Ca zjonizowany']],hiperCa:[['sympt','objawy']],hipoP:[['complex','złożona/długotrwała']]};
var UNL={mgdl:'mg/dl',mmol:'mmol/l',gdl:'g/dl',gl:'g/l'};
var KEEP=/^(Dawka|Insulina|Glukoza|Glikemia przed|Czas|Limit|Dobowo|Powtórzenie|Monitorowanie|Bolus|Przygotowanie|Prędkość|Rozcieńczenie lokalne)/;
function D(x,d){if(!fin(x))return '—';return (+x.toFixed(d==null?1:d)).toString().replace('.',',');}
function cl(s){return String(s==null?'':s).replace(/ – STANDARD LOKALNY – zatwierdzony przez lekarza/g,' (standard lokalny)').replace(/\s+/g,' ').trim();}
function hm(t){var d=new Date(t);return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2);}
function optOn(st,k){var p=k.split(':');return p.length>1?st.opt[p[0]]===p[1]:!!st.opt[k];}
// st – stan modułu (el1state), E – silnik EL, TH – SKThiamine (opcjonalnie)
function build(E,st,ctx,TH){ctx=ctx||{};st=st||{};st.opt=st.opt||{};st.lab=st.lab||{};st.ed=st.ed||{};var L=[],C=[],n=0,dose=false;
  function head(h){if(L.length)L.push('');L.push(h);}function line(l,x){if(x!=null&&String(x).trim()!=='')L.push(l?l+': '+x:String(x));}
  var dis=st.dis||'hiperK',lab=LAB[dis]||[],vals=[];
  lab.forEach(function(l){var x=st.lab[l[0]];if(!fin(x))return;n++;var u=l[2]==='mgu'||l[2]==='cau'||l[2]==='pu'||l[2]==='albu'?UNL[st.lab[l[2]]]||'':l[2];vals.push((l[0]==='ca'&&st.opt.ion?'Ca²⁺ zjonizowany':l[1])+' '+D(x,2)+(u?' '+u:''));});
  var on=(OPT[dis]||[]).filter(function(o){return optOn(st,o[0]);}).map(function(o){return o[1];});n+=on.length;
  ['kcl','mg'].forEach(function(k){var e=st.ed[k];if(e)Object.keys(e).forEach(function(x){if(fin(e[x]))n++;});});
  var tr=st.track||{};n+=((tr.bolus||[]).length?2:0)+((tr.na||[]).length?1:0);
  var r=E.compute({w:st.w,sex:st.sex,age:st.age,dis:dis,lab:st.lab,opt:st.opt,track:st.track});
  if(!r.val)return{text:'',used:false,dose:false,n:n};
  var name=((E.DIS||[]).filter(function(d){return d[0]===dis;})[0]||[])[1]||dis;
  head(String(name).toUpperCase()+' – OCENA');
  line('Wynik',r.val+(r.sev?' – '+r.sev:''));
  line('Wpisano',vals.join(', '));line('Zaznaczono',on.join(', '));
  if(fin(r.W)&&r.W>0)line('Masa ciała',D(r.W,1)+' kg');
  (r.flags||[]).forEach(function(x){line('Uwaga',cl(x));});
  if(r.formula)line('Wzór',cl(r.formula)+(r.W>0&&fin(r.d3)?'; 1 l bolusu lokalnego (570 mmol/l): +'+D(r.d3,1)+' mmol/l; 1 l NaCl 0,9%: '+(r.d09>=0?'+':'')+D(r.d09,1)+' mmol/l':''));
  head('LECZENIE');
  (r.steps||[]).forEach(function(s){var its=s.items||[];if(!its.length&&!s.text)return;line('',cl(s.t)+(s.text?': '+cl(s.text):''));
    its.forEach(function(x){dose=true;line('• '+cl(x.name),cl(x.main));
      (x.rows||[]).forEach(function(rw){if(KEEP.test(rw[0])&&!/NIE DOTYCZY/.test(rw[1]))line('   '+rw[0],cl(rw[1]).replace(/ ← DOTYCZY$/,''));});
      if(x.edit==='kcl'){var d0=r.kcl||{mmol:20,vol:500,rate:10},e=st.ed.kcl||{},ki={mmol:e.mmol!=null?e.mmol:d0.mmol,vol:e.vol!=null?e.vol:d0.vol,rate:e.rate!=null?e.rate:d0.rate,k:st.lab.k,line:st.opt.cvc?'cvc':'per'},o=E.kcl(ki);
        if(o)line('   Pompa / wlew KCl',D(ki.mmol,0)+' mmol = '+D(o.ml15,1)+' ml KCl 15% ('+o.amp+' amp. 10 ml) w objętości końcowej '+D(ki.vol,0)+' ml → stężenie '+D(o.conc,1)+' mmol/l; '+D(ki.rate,1)+' mmol/h = '+D(o.mlh,1)+' ml/h; czas '+D(o.hours,1)+' h; ≈ +'+D(o.rise,1)+' mmol/l K⁺; dostęp '+(ki.line==='cvc'?'centralny':'obwodowy')+((o.warn||[]).length?'; ⚠ '+o.warn.join('; '):''));}
      if(x.edit==='mg'){var em=st.ed.mg||{},mi={g:em.g!=null?em.g:2,vol:em.vol!=null?em.vol:100,min:em.min!=null?em.min:60,tdp:!!st.opt.tdp},om=E.mgso4(mi);
        if(om)line('   Wlew MgSO₄',D(mi.g,1)+' g = '+D(om.ml20,1)+' ml MgSO₄ 20% ('+om.amp+' amp. 10 ml) = '+D(om.mmol,1)+' mmol w objętości końcowej '+D(mi.vol,0)+' ml; czas '+D(mi.min,0)+' min = '+D(om.mlh,1)+' ml/h ('+D(om.gph,2)+' g/h)'+((om.warn||[]).length?'; ⚠ '+om.warn.join('; '):''));}
      if(x.disc)line('   Do decyzji lekarza',cl(x.disc).replace(/ – DO DECYZJI LEKARZA\.?$/,''));});});
  if(dis==='hipoNa'&&r.proto){var pr=r.proto,nb=(tr.bolus||[]).length;
    if(nb||(tr.na||[]).length){head('PROTOKÓŁ BOLUSÓW NaCl');
      line('Bolusy podane',nb+'/'+(pr.maxBol||'—')+(nb?' (godz. '+tr.bolus.map(hm).join(', ')+')':''));
      if((tr.na||[]).length)line('Kolejne Na⁺',tr.na.map(function(x){return hm(x.t)+' '+D(x.v,0)+' mmol/l'+(x.sym==='better'?' (poprawa)':' (objawy utrzymują się)');}).join('; '));
      line('Łączny przyrost','+'+D(pr.maxRise||0,1)+' / limit '+(pr.limit||10)+' mmol/l');}
    if(pr.action)line('Decyzja protokołu',cl(pr.action));}
  if(r.thiamine&&TH&&TH.card){var c=TH.card(r.thiamine),row=(c.rows||[]).filter(function(x){return x.k===c.active||(r.thiamine.wern&&x.k==='we');})[0];if(row)line('Tiamina',row.dose+' – '+row.how+' ('+row.amp.txt+')');}
  if((r.mon||[]).length)line('Monitorowanie',r.mon.join('; '));
  if((r.ctl||[]).length)line('Kontrola',r.ctl.join('; '));
  if(r.lvl==='red')C.push('Ciężkie zaburzenie ('+r.val+(r.sev?', '+r.sev:'')+'): leczenie w obszarze monitorowanym (ciągłe EKG / ścisła kontrola), hospitalizacja – decyzja lekarza.');
  else if(r.lvl==='orange')C.push('Leczenie i kontrole wg planu powyżej; hospitalizacja / obserwacja – decyzja lekarza.');
  else C.push('Leczenie przyczyny i kontrola wyniku; miejsce leczenia – decyzja lekarza.');
  if(r.dialysis&&r.lvl==='red')C.push('Przy oporności na leczenie zachowawcze, oligurii / anurii, ciężkiej kwasicy lub przewodnieniu – pilnie nefrolog (dializa).');
  L.push('');L.push('WNIOSKI:');C.forEach(function(c){L.push('– '+c);});
  var text=L.join('\n');
  return{text:text,used:!!text&&(n>=2||!!ctx.print),dose:dose,n:n};}
return{build:build};});
