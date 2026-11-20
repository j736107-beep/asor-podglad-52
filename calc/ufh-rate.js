// fix24 (decyzja lekarza 20.11.2026): jedna konwencja prezentacji wlewu UFH we wszystkich modułach (ZP, Antykoagulacja, STEMI, Pompy, korekta APTT):
// „zlecono 18 j./kg/h = 1 440 j./h; nastawa pompy 2,9 ml/h = 1 450 j./h (faktycznie podawane)” –
// dawka zlecona bez zaokrąglenia (po limitach algorytmu), nastawa pompy zaokrąglona do 0,1 ml/h, dawka wynikowa z nastawy. Algorytmy (j./kg, limity, kroki APTT) bez zmian.
(function(r,f){var m=f();if(typeof module==='object'&&module.exports)module.exports=m;else{r.SK=r.SK||{};r.SK.ufhRate=m;}})(typeof window!=='undefined'?window:this,function(){
'use strict';
function fmt(x,d){if(!isFinite(x))return '—';var s=(Math.round(x*Math.pow(10,d||0))/Math.pow(10,d||0)).toFixed(d||0).replace('.',',');var p=s.split(',');p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,' ');return p.join(',');}
function num(x){var s=fmt(x,2);return s.replace(/,?0+$/,'');}
// ordered: dawka zlecona j./h (po limitach); conc: j./ml → nastawa ml/h (0,1) i dawka faktyczna j./h
function set(ordered,conc){if(!(ordered>0)||!(conc>0))return null;var mlh=Math.round(ordered/conc*10)/10,actual=Math.round(mlh*conc*100)/100;return{ordered:ordered,mlh:mlh,actual:actual,conc:conc};}
function setTxt(s){return 'nastawa pompy '+fmt(s.mlh,1)+' ml/h = '+fmt(s.actual,0)+' j./h (faktycznie podawane)';}
// o: {perKg, w, raw, ordered, conc, cap, lead}
function text(o){var s=set(o.ordered,o.conc);if(!s)return '';var head=o.lead!=null?o.lead:(o.perKg!=null?'zlecono '+num(o.perKg)+' j./kg/h = '+fmt(o.raw!=null?o.raw:o.ordered,0)+' j./h':'zlecono '+fmt(o.ordered,0)+' j./h');
  if(o.raw!=null&&Math.abs(o.raw-o.ordered)>0.5)head+=' → limit '+fmt(o.ordered,0)+' j./h';return head+'; '+setTxt(s);}
return{set:set,text:text,setTxt:setTxt,fmt:fmt};});
