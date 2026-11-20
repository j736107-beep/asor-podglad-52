/* fix23: własny wydruk modułu Omdlenie SOR – tylko odpowiedzi TAK (NIE tylko gdy decyduje o wyniku), troponina/rozpoznanie, CSRS z kompletu, decyzja modułu, WNIOSKI. Bez list pytań, źródeł i tekstów dydaktycznych. Decyzje i reguły bez zmian (engine.js). */
(function(root,f){var m=f();if(typeof module==='object'&&module.exports)module.exports=m;else root.OMDLPrint=m;})(typeof window!=='undefined'?window:this,function(){
function ns(s){return String(s==null?'':s).replace(/\s*\((?:[^()]*(?:ESC|CSRS|CMAJ|JAMA|ACC|AHA|HRS|I-B|I-C|Tab\.|Ryc\.|zalecenie)[^()]*)\)/g,'').replace(/\s+/g,' ').trim();}
function build(R,E,st,o){o=o||{};var a=(st&&st.answers)||{},L=[],C=[],n=Object.keys(a).length+(st&&st.troponin?1:0)+(st&&st.dx?1:0);if(!n)return{text:'',used:false,n:0,own:true};
  var LAB=o.LAB||{},RD=o.RULEDESC||{},inp={answers:a,troponin:st.troponin||undefined,dx:st.dx||undefined},r=E.evaluate(R,inp,o.settings||R.defaults),ov=o.current&&o.ov?o.ov:null,col=ov?ov.color:r.color;
  var dec={};(r.decisive||[]).forEach(function(d){dec[d.code]=1;});
  L.push('OMDLENIE – OCENA');
  R.groups.forEach(function(g){var y=g.items.filter(function(it){return a[it.code]==='yes';}).map(function(it){return it.code+' '+String(it.label).replace(/\s*\(TAK =[^)]*\)/,'');});if(y.length)L.push(g.title+' – TAK: '+y.join('; '));});
  if(st.troponin)L.push('Troponina (CSRS): '+({pos:'podwyższona',neg:'prawidłowa',na:'nieoznaczona'}[st.troponin]||st.troponin));
  if(st.dx)L.push('Rozpoznanie na SOR (CSRS): '+({vaso:'wazowagalne',cardiac:'kardiogenne',other:'inne / niejasne'}[st.dx]||st.dx));
  var c=r.csrs;if(c&&c.complete)L.push('Canadian Syncope Risk Score: '+E.fmt(c.score)+' pkt – ryzyko '+c.category+', SAE w 30 dni ≈ '+String(c.risk).replace('.',',')+'%');
  L.push('');L.push('DECYZJA MODUŁU');
  if(col==='yellow'){L.push('Ocena niepełna – brak decyzji modułu (brakuje '+r.missing.length+' odpowiedzi).');}
  else{L.push('Wynik: '+(LAB[col]?LAB[col][0]+' – '+LAB[col][1]:col));if(RD[r.rule])L.push('Reguła decydująca: '+ns(RD[r.rule]));
    var why=(r.decisive||[]).map(function(d){return d.code+' '+d.label;});if(why.length)L.push('Powody: '+why.join('; '));
    if(ov)L.push('Zmienione przez lekarza z: '+(LAB[ov.original]?LAB[ov.original][1]:ov.original)+' – '+ov.reason);
    if(r.oosPossible&&!ov)L.push('Brak kryteriów przyjęcia (ESC Tab. 7) – rozważ oddział obserwacyjny SOR / szybką ścieżkę.');}
  (r.warnings||[]).forEach(function(w){L.push('Uwaga: '+ns(w));});
  if(col==='red')C.push(r.rule==='K0'?'Nie jest to typowe omdlenie / poza zakresem – diagnostyka szpitalna; HOSPITALIZACJA – decyzja lekarza.':r.rule==='R5'?'Ryzyko pośrednie – hospitalizacja lub obserwacja z monitorowaniem EKG – decyzja lekarza.':'Wysokie ryzyko – HOSPITALIZACJA; monitorowanie EKG w miejscu z możliwością resuscytacji – decyzja lekarza.');
  else if(col==='green')C.push('Niskie ryzyko, komplet danych – wypis do domu / diagnostyka ambulatoryjna z edukacją chorego; przy nawrotach poradnia omdleń – decyzja lekarza.');
  else C.push('Ocena niepełna – decyzja lekarza po uzupełnieniu danych.');
  var text=L.join('\n').replace(/\n{3,}/g,'\n\n')+'\n\nWNIOSKI:\n'+C.map(function(x){return '– '+x;}).join('\n');
  return{text:text,used:n>=2||(!!o.print&&n>=1),n:n,own:true,dose:false};}
return{build:build,ns:ns};});
