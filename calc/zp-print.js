// 5.2 etap 4 (decyzja lekarza 09.11.2026): wydruk „Zapalenie płuc” ZAWSZE zawiera treść antybiotykoterapii –
// także gdy zakładka „💊 Antybiotykoterapia – dobór” nie była otwierana. Wylicza ze wspólnego silnika mod/zp/engine.js (window.ZP)
// na danych z zakładki „Skale i hospitalizacja” (zp_handoff) + paska pacjenta. Brak danych → silnik nie podaje dawek.
(function(root){
function strip(s){return String(s==null?'':s).replace(/<[^>]*>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();}
function handoff(){try{var h=JSON.parse(localStorage.getItem('zp_handoff')||'null');if(!h||h.v!==52||Date.now()-h.ts>12*3600e3)return null;return h;}catch(e){return null;}}
function input(){var h=handoff(),b=(h&&h.i)||{},p=root.SKS&&root.SKS.P?root.SKS.P():{};
 var i=Object.assign({},b);if(isFinite(p.w))i.w=p.w;if(isFinite(p.age))i.age=p.age;if(p.sex)i.sex=p.sex;if(isFinite(p.crMg)){i.crea=p.crMg;i.creaU='mgdl';}
 i.place='';i.allergy='';var co=p.co||{};i.comorb=!!(b.cancer||b.liver||b.heart||b.renal||b.stroke||co.liver||co.renal||co.heart);i.preg=!!co.preg;
 ['mrsa','pseudo','recent','asp','abscess','leg','atyp','qt','liver','hd','statin','vka','doac','ssri','steroid','colch'].forEach(function(k){if(i[k]==null)i[k]=false;});return{i:i,h:h};}
var LBL={home:'Leczenie domowe (niskie ryzyko)',obs:'Krótka hospitalizacja / obserwacja lub dom ze ścisłą kontrolą (decyzja lekarza)',ward:'Hospitalizacja – oddział',icu:'Ciężkie PZP – OIOM / OIT rozważany'};
function item(x){return strip(x.n)+' '+strip(x.dose)+' '+strip(x.route)+' '+strip(x.q)+(x.rmod||x.rdec?' [nerki: '+strip(x.renal)+']':'');}
// pilot AI (10.11.2026): wejście uzupełnione o wybory z zakładki „Antybiotykoterapia” (alergia, czynniki ryzyka, ręczne podwyższenie miejsca) – zp1state
function zpState(){try{var z=JSON.parse(localStorage.getItem('zp1state')||'null');return z&&typeof z==='object'?z:null;}catch(e){return null;}}
function inputFull(){var a=input(),z=zpState();if(!z)return{i:a.i,h:a.h,z:null};var o=z.o||{},i=a.i;
 if(z.allergy)i.allergy=z.allergy;if(z.place==='ward'||z.place==='icu')i.place=z.place;
 ['mrsa','pseudo','recent','asp','abscess','leg','atyp','qt','liver','hd','statin','vka','doac','ssri','steroid','colch'].forEach(function(k){if(o[k])i[k]=true;});if(o.abscess)i.asp=true;if(o.comorb)i.comorb=true;if(o.vent)i.ventilation=true;if(o.vaso)i.vasopressor=true;if(o.noOral)i.oral=false;
 return{i:i,h:a.h,z:z};}
function text(opt){opt=opt||{};var Z=root.ZP;if(!Z||!Z.plan)return '';var a=opt.full?inputFull():input(),o;try{o=Z.plan(a.i);}catch(e){return '';}
 var L=[opt.full?('Antybiotykoterapia ze wspólnego silnika programu'+(a.z?' (z wyborami z zakładki „Antybiotykoterapia – dobór”)':' (zakładka „Antybiotykoterapia – dobór” nie była otwierana: alergia nieustalona, brak dodatkowych czynników ryzyka)')+'. DO DECYZJI LEKARZA.'):'Antybiotykoterapia – wyliczona automatycznie ze wspólnego silnika (zakładka „Antybiotykoterapia – dobór” nie była otwierana). Założenia: alergia na penicyliny NIEUSTALONA (schemat zakłada brak alergii), brak dodatkowych czynników ryzyka (MRSA, Pseudomonas, zachłyśnięcie) – zweryfikuj w zakładce. DO DECYZJI LEKARZA.'];
 if(a.h&&a.h.txt)L.push('Skale: '+a.h.txt+'.');
 if(o.need&&o.need.length){L.push('Brak schematu – uzupełnij: '+o.need.map(strip).join('; ')+'.');return L.join('\n');}
 L.push('Miejsce leczenia: '+(o.obs?LBL.obs:LBL[o.p]||'—')+(o.pDef?' (domyślnie – dane niepełne)':' (wg silnika)')+'.');
 if(o.crcl)L.push('CrCl: '+(isFinite(o.crcl.v)?o.crcl.v+' ml/min':'–')+' ('+strip(o.crcl.src)+').');
 (o.regs||[]).forEach(function(r){L.push((r.tier==='alt'?'Alternatywa: ':r.tier==='prop'?'Propozycja: ':'Proponowane: ')+strip(r.t)+' – '+r.items.filter(Boolean).map(item).join(' lub ')+(r.dur?'; czas: '+strip(r.dur):'')+'.');});
 if(!(o.regs||[]).length)L.push('Brak zweryfikowanego schematu przy tych ograniczeniach – DO DECYZJI LEKARZA.');
 if(o.avoid&&o.avoid.length)L.push('Unikać: '+o.avoid.map(strip).join('; ')+'.');
 if(o.warn&&o.warn.length)L.push('Uwaga: '+o.warn.map(strip).join('; ')+'.');
 if(o.dec&&o.dec.length)L.push('DO DECYZJI LEKARZA: '+o.dec.map(strip).join('; ')+'.');
 if(o.ix&&o.ix.length)L.push('Interakcje / QT: '+o.ix.map(strip).join('; ')+'.');
 return L.join('\n');}
root.SORZpPrint={text:text,input:input,inputFull:inputFull,zpState:zpState};
})(typeof window!=='undefined'?window:this);
