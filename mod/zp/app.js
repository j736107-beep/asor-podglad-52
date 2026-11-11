(function(){var Z=window.ZP,f=Z.fmt,$=function(s){return document.querySelector(s)};
var KEY='zp1state',st={w:NaN,age:NaN,sex:'',crea:NaN,creaU:'mgdl',crclManual:NaN,urea:NaN,ureaU:'mmol',rr:NaN,sbp:NaN,dbp:NaN,spo2:NaN,minor:NaN,psi:'',place:'',allergy:'',o:{}};
try{var sv=JSON.parse(localStorage.getItem(KEY)||'null');if(sv){delete sv.psi;delete sv.minor;if(sv.place!=='ward'&&sv.place!=='icu')delete sv.place;Object.assign(st,sv);}}catch(e){}
var CS=window.CAPSEV;
Object.keys(st).forEach(function(k){if(st[k]===null)st[k]=NaN;});
// 5.2: PSI i małe kryteria NIE są zapisywane (liczy je silnik); „Dom” nigdy nie jest zapamiętywany
function save(){try{var c=Object.assign({},st);delete c.psi;delete c.minor;if(c.place!=='ward'&&c.place!=='icu')delete c.place;localStorage.setItem(KEY,JSON.stringify(c));}catch(e){}}
function num(v){v=String(v==null?'':v).replace(',','.').trim();return v===''?NaN:parseFloat(v);}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]});}
function rich(s){return esc(s).replace(/STANDARD LOKALNY – zatwierdzony przez lekarza/g,'<span class="lok">STANDARD LOKALNY – zatwierdzony przez lekarza</span>').replace(/DO DECYZJI LEKARZA/g,'<span class="dw">DO DECYZJI LEKARZA</span>');}
function v(x){return typeof x==='number'&&isFinite(x)?String(x).replace('.',','):'';}
var fromBar={};
// dane z paska pacjenta (gdy moduł otwarty wewnątrz Asystenta)
function bar(){fromBar={};try{var S=window.parent&&window.parent!==window&&window.parent.SKS;if(S){var p=S.P();
 if(isFinite(p.w)&&!isFinite(st.w)){st.w=p.w;fromBar.masa=1;}if(isFinite(p.age)&&!isFinite(st.age)){st.age=p.age;fromBar.wiek=1;}
 if(p.sex&&!st.sex){st.sex=(p.sex==='k'||p.sex==='f')?'f':'m';fromBar['płeć']=1;}if(isFinite(p.crMg)&&!isFinite(st.crea)){st.crea=Math.round(p.crMg*100)/100;st.creaU='mgdl';fromBar.kreatynina=1;}
 if(p.co&&p.co.preg&&st.o.preg===undefined){st.o.preg=true;fromBar['ciąża']=1;}}}catch(e){}
 var h=handoff();if(h&&h.ts!==st.hts){st.hts=h.ts;[['rr','rr'],['sbp','sbp'],['dbp','dbp'],['spo2','spo2']].forEach(function(a){if(okn(h[a[0]])){st[a[1]]=h[a[0]];fromBar[{rr:'oddechy',sbp:'SBP',dbp:'DBP',spo2:'SpO₂'}[a[1]]+' (Skale)']=1;}});if(okn(h.urea)){st.urea=h.urea;st.ureaU='mmol';fromBar['mocznik (Skale)']=1;}if(h.confusion===true||h.confusion===false){st.conf=h.confusion;}if(typeof h.age==='number'&&isFinite(h.age))st.age=h.age;if(h.sex==='m'||h.sex==='f')st.sex=h.sex;st.o.vent=!!h.vent;st.o.vaso=!!h.vaso;st.o.noOral=h.oral===false;save();}}
function sync(f){try{var S=window.parent&&window.parent!==window&&window.parent.SKS;if(!S||!S.setP)return;var x=st[f];if(f==='age')S.setP({age:isFinite(x)?x:''});else if(f==='w')S.setP({w:isFinite(x)?x:''});else if(f==='crea'){S.setP({crMg:isFinite(x)?Math.round((st.creaU==='umol'?x/88.42:x)*1000)/1000:''});}}catch(e){}}
function okn(x){return typeof x==='number'&&isFinite(x);}
function handoff(){try{var h=JSON.parse(localStorage.getItem('zp_handoff')||'null');if(h&&h.v!==52)return null;if(!h||Date.now()-h.ts>12*3600e3)return null;return h;}catch(e){return null;}}
var OPT=[['comorb','Choroby współistniejące (serce, płuca, wątroba, nerki, cukrzyca, alkohol, nowotwór, asplenia)'],['mrsa','MRSA w drogach oddechowych w wywiadzie (kolonizacja / zakażenie, 1 rok)'],['pseudo','Pseudomonas w drogach oddechowych w wywiadzie (1 rok)'],['recent','Hospitalizacja + antybiotyk i.v. w ostatnich 90 dniach'],
 ['asp','Zachłystowe zapalenie płuc'],['abscess','Ropień płuca / ropniak'],['leg','Podejrzenie Legionelli'],['atyp','Podejrzenie drobnoustrojów atypowych (młody, łagodny przebieg)'],['preg','Ciąża'],['qt','Wydłużony QTc / leki wydłużające QT / ↓K ↓Mg'],['liver','Ciężka niewydolność wątroby'],['hd','Hemodializa'],['social','Brak warunków opieki domowej / czynniki społeczne']];
var IXO=[['statin','Statyna'],['vka','Warfaryna / acenokumarol'],['doac','DOAC'],['ssri','SSRI / SNRI / IMAO'],['steroid','GKS przewlekle'],['colch','Kolchicyna']];
function inp(id,l,val,extra){return '<label>'+esc(l)+'<input id="'+id+'" data-f="'+id+'" inputmode="decimal" autocomplete="off" value="'+v(val)+'">'+(extra||'')+'</label>';}
function tg(k,l,on,attr){return '<button class="tg'+(on?' on':'')+'" '+(attr||'data-o')+'="'+k+'">'+esc(l)+'</button>';}
function form(){var h='<div id="quick"></div>';
 h+='<div class="sec"><h2>Pacjent (dorosły) <span class="mut" style="font-weight:400;font-size:12px">– pola synchronizowane z paskiem pacjenta; puste nie blokują schematu</span></h2><div class="lab">'+inp('w','Masa [kg]',st.w)+inp('age','Wiek [lata]',st.age)+'<label>Płeć<span class="u">'+['m','f'].map(function(s){return '<button data-sex="'+s+'" class="'+(st.sex===s?'on':'')+'">'+(s==='m'?'M':'K')+'</button>'}).join('')+'</span></label>'+
  inp('crea','Kreatynina',st.crea,'<span class="u">'+[['mgdl','mg/dl'],['umol','µmol/l']].map(function(u){return '<button data-cu="'+u[0]+'" class="'+(st.creaU===u[0]?'on':'')+'">'+u[1]+'</button>'}).join('')+'</span>')+inp('crclManual','lub CrCl / eGFR [ml/min]',st.crclManual)+'</div><div id="crclLive" class="frm"></div><div id="barInfo"></div></div>';
 h+='<div class="sec"><h2>CURB-65 i ciężkość</h2><div class="opt">'+'<b style="align-self:center;font-size:13px">Nowe splątanie:</b>'+tg('1','Tak',st.conf===true,'data-cf')+tg('0','Nie',st.conf===false,'data-cf')+'</div><div class="lab">'+inp('urea','Mocznik',st.urea,'<span class="u">'+[['mmol','mmol/l'],['mgdl','mg/dl']].map(function(u){return '<button data-uu="'+u[0]+'" class="'+(st.ureaU===u[0]?'on':'')+'">'+u[1]+'</button>'}).join('')+'</span>')+inp('rr','Oddechy [/min]',st.rr)+inp('sbp','SBP',st.sbp)+inp('dbp','DBP',st.dbp)+inp('spo2','SpO₂ [%]',st.spo2)+'</div>'+
  '<div class="opt">'+tg('vent','Wentylacja mechaniczna',st.o.vent)+tg('vaso','Wazopresor (wstrząs)',st.o.vaso)+tg('noOral','Nie toleruje leków p.o.',st.o.noOral)+'</div><div id="curbOut"></div><div id="sevOut"></div></div>';
 h+='<div class="sec"><h2>Miejsce leczenia</h2><div class="pl">'+[['','Auto (wg silnika – zalecane)'],['home','Dom'],['ward','Oddział'],['icu','OIOM / OIT']].map(function(p){return '<button data-pl="'+p[0]+'" class="'+(st.place===p[0]?'on':'')+'">'+p[1]+'</button>'}).join('')+'</div><div id="plWhy" class="mut"></div><div class="mut">Lekarz zawsze wybiera miejsce leczenia (każda opcja dostępna) – silnik pokazuje rekomendację z uzasadnieniem. Wybór nie jest zapamiętywany dla kolejnego pacjenta.</div></div>';
 h+='<div class="sec"><h2>Alergia na penicyliny</h2><div class="pl" style="grid-template-columns:repeat(3,1fr)">'+[['none','Brak'],['late','Nienatychmiastowa (wysypka >1 h)'],['imm','Natychmiastowa (anafilaksja, pokrzywka, obrzęk, SJS/TEN)']].map(function(p){return '<button data-al="'+p[0]+'" class="'+(st.allergy===p[0]?'on':'')+'">'+p[1]+'</button>'}).join('')+'</div></div>';
 h+='<div class="sec"><h2>Czynniki ryzyka i ograniczenia</h2><div class="opt">'+OPT.map(function(o){return tg(o[0],o[1],st.o[o[0]])}).join('')+'</div><h2>Leki przewlekłe (interakcje)</h2><div class="opt">'+IXO.map(function(o){return tg(o[0],o[1],st.o[o[0]])}).join('')+'</div></div>';
 h+='<div id="res"></div>';$('#app').innerHTML=h;}
function input(){var o=st.o,u=num(st.urea);if(st.ureaU==='mgdl')u=u/6.006;var hd=handoff(),b=(hd&&hd.i)||{};
 // JEDEN zestaw danych: pełne dane z zakładki „Skale” (PSI, kryteria ATS/IDSA) + pola wpisane tutaj (nadpisują)
 var r=Object.assign({},b,{w:st.w,age:okn(st.age)?st.age:b.age,sex:st.sex||b.sex,crea:st.crea,creaU:st.creaU,crclManual:st.crclManual,confusion:typeof st.conf==='boolean'?st.conf:b.confusion,urea:okn(u)?u:b.urea,rr:okn(st.rr)?st.rr:b.rr,sbp:okn(st.sbp)?st.sbp:b.sbp,dbp:okn(st.dbp)?st.dbp:b.dbp,spo2:okn(st.spo2)?st.spo2:b.spo2});
 if(o.vent)r.ventilation=true;if(o.vaso)r.vasopressor=true;if(o.noOral)r.oral=false;
 return Object.assign(r,{place:st.place,allergy:st.allergy,
  comorb:!!o.comorb||b.cancer===true||b.liver===true||b.heart===true||b.renal===true||b.stroke===true,mrsa:!!o.mrsa,pseudo:!!o.pseudo,recent:!!o.recent,asp:!!o.asp||!!o.abscess,abscess:!!o.abscess,leg:!!o.leg,atyp:!!o.atyp,preg:!!o.preg,qt:!!o.qt,liver:!!o.liver,hd:!!o.hd,social:!!o.social||b.social===true,multilobar:b.multilobar,statin:!!o.statin,vka:!!o.vka,doac:!!o.doac,ssri:!!o.ssri,steroid:!!o.steroid,colch:!!o.colch});}
var last=null;
function drug(x){var cls=x.ravoid?'av':(x.rmod||x.rdec||x.tdm?'mod':'');
 return '<div class="drug" data-k="'+x.k+'"><div class="nm">'+esc(x.n)+'<a href="'+x.url+'" target="_blank" rel="noopener">ChPL: '+esc(x.brand)+'</a></div><div class="ds">'+esc(x.dose)+' · '+esc(x.route)+' · '+esc(x.q)+'</div>'+
  (x.lok?'<div class="lok">✔ '+esc(Z.LOK)+': '+esc(x.lok)+'</div>':'')+(x.note?'<div class="bz">'+rich(x.note)+'</div>':'')+(x.calc?'<div class="hdf">'+rich(x.calc)+'</div>':'')+'<div class="rn2 '+cls+'">Nerki: '+rich(x.renal)+'</div>'+(x.warn?'<div class="mx">'+rich(x.warn)+'</div>':'')+(x.pregNote?'<div class="bz">'+rich(x.pregNote)+'</div>':'')+(x.qt?'<div class="bz">Wydłuża QT – EKG (QTc) przed i w trakcie</div>':'')+'<div class="gl">'+rich(x.g)+'</div></div>';}
function result(){var i=input(),o=Z.plan(i);last=o;var pl=o.place,a=pl.a,c=a.curb;
 $('#curbOut').innerHTML='<div class="curb"><div class="big">'+(c.complete?'':'≥')+c.score+'<small>/5</small></div><div><b>CURB-65</b>'+(c.complete?'':' – brak: '+esc(c.missing.join(', ')))+'<br><span class="mut">'+esc((pl.why||[]).join('; '))+'</span></div></div>';
 sevPanel(a);places(o);crclLive(i);
 var bi=Object.keys(fromBar);$('#barInfo').innerHTML=bi.length?'<div class="hdf">Z paska pacjenta: '+bi.join(', ')+'</div>':'';
 var hd=handoff();var h='';if(hd&&hd.txt)h+='<div class="hdf">Z zakładki „Skale i hospitalizacja”: '+esc(hd.txt)+'</div>';
 if(o.need.length){if($('#quick'))$('#quick').innerHTML='';$('#res').innerHTML=h+'<div class="sev orange">Uzupełnij: '+esc(o.need.join('; '))+'</div>';fit();return;}
 h+='<div class="step '+(o.pAuto==='icu'?'red':o.pAuto==='home'?'':'yel')+'" id="zpRec"><h3>Rekomendacja: '+esc(Z_LABEL[o.pAuto]||'')+'</h3>'+((o.place.why||[]).length?'<ul class="lst">'+o.place.why.map(function(x){return '<li>'+rich(x)+'</li>'}).join('')+'</ul>':'')+'<p class="mut">To jest rekomendacja, nie blokada – miejsce leczenia wybiera lekarz (przyciski „Miejsce leczenia”). <span class="dw">DO DECYZJI LEKARZA</span></p></div>';
 if(o.warn&&o.warn.length)h+='<div class="step yel" id="zpWarn"><h3>⚠️ Uwaga – niepełne dane</h3><ul class="lst">'+o.warn.map(function(x){return '<li>'+rich(x)+'</li>'}).join('')+'</ul></div>';
 var lv=o.p==='icu'?'red':o.p==='ward'?'orange':'ok';var pn=o.obs?'Schemat doustny – '+Z_LABEL.obs:({home:'Leczenie domowe',ward:'Hospitalizacja – oddział',icu:'Ciężkie PZP – OIOM / OIT'})[o.p];
 h+='<div class="sev '+lv+'" id="zpPlace">'+esc(pn)+(st.place?' (wybór lekarza)':' (rekomendacja silnika)')+'</div>';
 h+='<div class="frm">CrCl: <b>'+(isFinite(o.crcl.v)?o.crcl.v+' ml/min':'–')+'</b> ('+esc(o.crcl.src)+')</div>';
 if(o.avoid.length)h+='<div class="step red"><h3>Wykluczone / unikać</h3><ul class="lst">'+o.avoid.map(function(x){return '<li>'+rich(x)+'</li>'}).join('')+'</ul></div>';
 o.regs.forEach(function(r,ix){h+='<div class="reg '+(r.tier==='alt'?'alt':r.tier==='prop'?'prop':'')+'" data-reg="'+ix+'"><h3>'+(r.tier==='pref'?'✅ ':r.tier==='prop'?'🟣 ':'↔️ ')+rich(r.t).replace('PROPOZYCJA – DO AKCEPTACJI LEKARZA','<span class="dw" style="background:#6a1b9a">PROPOZYCJA – DO AKCEPTACJI LEKARZA</span>')+'</h3>'+r.items.map(drug).join('')+'<div class="why">'+rich(r.why)+'</div>'+(r.dur?'<div class="dur">⏱ Czas: '+rich(r.dur)+'</div>':'')+'<div class="st">Źródła: '+r.src.map(function(k){return '<a href="'+Z.S[k].url+'" target="_blank" rel="noopener">'+esc(Z.S[k].n.split(' – ')[0])+'</a>'}).join(', ')+'</div><button class="cp" data-cp="'+ix+'">📋 Kopiuj do zaleceń wypisowych</button></div>';});
 if(!o.regs.length)h+='<div class="sev red">Brak zweryfikowanego schematu przy tych ograniczeniach – DO DECYZJI LEKARZA</div>';
 if(o.dec.length)h+='<div class="step orange"><h3>DO DECYZJI LEKARZA ('+o.dec.length+')</h3><ul class="lst">'+o.dec.map(function(x){return '<li>'+rich(x)+'</li>'}).join('')+'</ul></div>';
 if(o.ix.length)h+='<div class="step orange"><h3>Interakcje i QT</h3><ul class="lst">'+o.ix.map(function(x){return '<li>'+rich(x)+'</li>'}).join('')+'</ul></div>';
 if(o.notes.length)h+='<div class="step"><h3>Uwagi</h3><ul class="lst">'+o.notes.map(function(x){return '<li>'+rich(x)+'</li>'}).join('')+'</ul></div>';
 h+='<div class="step"><h3>Czas leczenia – źródła</h3><p>'+rich(o.dur)+'</p><p>Zmiana i.v. → p.o. po stabilizacji (temperatura, HR <100, RR <24, SBP >90, SpO₂ prawidłowa; NPOA 2016).</p></div>';
 h+='<div id="cpBox" hidden><b>Tekst do zaleceń (skopiowany):</b><textarea id="copyOut" readonly></textarea></div>';
 $('#res').innerHTML=h;quick(o);fit();}
function quick(o){var q=$('#quick');if(!q)return;var pr=o.regs.filter(function(r){return r.tier!=='alt'});if(!pr.length){q.innerHTML='';return;}var pn=o.obs?'dom ze ścisłą kontrolą – po ocenie lekarza':{home:'Dom',ward:'Oddział',icu:'Ciężkie PZP / OIOM-OIT'}[o.p];
 q.innerHTML='<div class="quick"><b>💊 Proponowane ('+pn+'):</b> '+pr.map(function(r){return r.items.filter(Boolean).map(function(x){return '<b>'+esc(x.n)+'</b> '+esc(x.dose)+' '+esc(x.route)+' '+esc(x.q)}).join(' lub ')}).join(' <b>+</b> ')+(o.warn&&o.warn.length?'<div class="qw">⚠️ '+o.warn.map(function(w){return esc(w.split(' (')[0])}).join(' · ')+'</div>':'')+' <a href="#res" onclick="document.getElementById(\'res\').scrollIntoView();return false">Szczegóły, dawki nerkowe, źródła ↓</a></div>';}
var Z_LABEL={home:'leczenie domowe (niskie ryzyko)',obs:'krótka hospitalizacja / obserwacja LUB dom ze ścisłą kontrolą po 48–72 h',ward:'hospitalizacja – oddział',icu:'ciężkie PZP – rozważ OIOM / OIT'};
function crclLive(i){var e=$('#crclLive');if(!e)return;var c=Z.crcl(i),m=$('#crclManual');if(m)m.placeholder=c.auto&&isFinite(c.v)?'auto: '+c.v:'';
 e.innerHTML=isFinite(c.v)?'<b>CrCl: '+c.v+' ml/min</b> – '+esc(c.src)+(c.f?' <span class="mut">= '+esc(c.f)+'</span>':'')+(c.note?'<div class="mut">'+esc(c.note)+'</div>':'')+'<div class="mut">Dawki antybiotyków poniżej skorygowane do tego CrCl.</div>':'<b>CrCl: –</b> <span class="mut">'+esc(c.src)+'</span>';}
function sevPanel(a){var e=$('#sevOut');if(!e)return;var p=a.psi,s=a.severe;
 var h='<div class="psiAuto" id="zpPsi"><b>PSI / PORT (liczony automatycznie – nie edytuje się):</b> '+(p.step1?'klasa I (reguła pierwszego etapu)':p.complete?'klasa <b>'+p.cls+'</b> ('+p.score+' pkt)':(p.atLeast?'co najmniej klasa <b>'+p.atLeast+'</b> ':'klasa nieustalona ')+'(≥'+p.score+' pkt) – brak: '+esc(p.missing.join(', ')))+'</div>';
 h+='<div class="psiAuto"><b>Ciężkie PZP wg ATS/IDSA 2019:</b> duże kryteria '+s.major.length+'/2'+(s.major.length?' ('+esc(s.majorTxt.join(', '))+')':'')+' · małe kryteria '+s.minor.length+'/9'+(s.minor.length?' ('+esc(s.minorTxt.join('; '))+')':'')+(s.missing.length?' · <span class="mut">nieocenione: '+s.missing.length+'</span>':'')+
  '<details><summary>Co to są kryteria ATS/IDSA?</summary><p><b>Duże</b> (1 wystarczy → OIT): wentylacja mechaniczna; wstrząs septyczny wymagający wazopresorów.</p><p><b>Małe</b> (≥3 → OIT): oddechy ≥30/min; PaO₂/FiO₂ ≤250; nacieki wielopłatowe; splątanie; mocznik ≥7,14 mmol/l (BUN ≥20 mg/dl); leukopenia <4 G/l; małopłytkowość <100 G/l; temperatura <36 °C; hipotensja wymagająca intensywnej płynoterapii.</p><p>Uzupełnij je w zakładce „Skale i hospitalizacja” – tam są wszystkie pola PSI i ATS/IDSA.</p></details></div>';
 e.innerHTML=h;}
function places(o){var auto=o.pAuto==='obs'?'home':o.pAuto;document.querySelectorAll('[data-pl]').forEach(function(b){var k=b.dataset.pl;b.classList.remove('blk');b.disabled=false;b.classList.toggle('rec',!!k&&k===auto);b.title=k&&k===auto?'Rekomendacja silnika':'';});
 var w=$('#plWhy');if(w)w.innerHTML='<b>Silnik:</b> '+esc(Z_LABEL[auto]||'')+(o.place.why&&o.place.why.length?' – '+esc(o.place.why.join('; ')):'');}
function fit(){try{var fr=window.frameElement;if(fr&&fr.dataset.auto)fr.style.height=(document.documentElement.scrollHeight+20)+'px';}catch(e){}}
function copy(ix){var t=Z.discharge(last,ix);var b=$('#cpBox'),ta=$('#copyOut');b.hidden=false;ta.value=t;
 var done=function(){var x=document.querySelector('[data-cp="'+ix+'"]');if(x){x.textContent='✔ Skopiowano';setTimeout(function(){x.textContent='📋 Kopiuj do zaleceń wypisowych';},2000);}};
 try{if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(t).then(done,function(){ta.select();document.execCommand('copy');done();});else{ta.select();document.execCommand('copy');done();}}catch(e){done();}fit();}
function info(){var h='<button class="rs" id="ix" style="float:right">✕</button><h2>Zapalenie płuc – dobór antybiotyku</h2><p>Kolejność źródeł: NPOA 2016 → ATS/IDSA 2019 → ERS/ESCMID 2023 → BTS/NICE NG138. Dawki i korekty nerkowe z ChPL (RPL). Gdy wytyczne podają inną dawkę niż ChPL – obie wersje i „DO DECYZJI LEKARZA”.</p><p>CURB-65: splątanie, mocznik >7 mmol/l (≈42 mg/dl), RR ≥30, SBP <90 lub DBP ≤60, wiek ≥65. 0–1 dom, 2 oddział, 3–5 ciężkie (oddział/OIT). OIT także przy ≥1 dużym lub ≥3 małych kryteriach ATS/IDSA.</p><h2>Źródła</h2>'+Object.keys(Z.S).map(function(k){return '<div><a href="'+Z.S[k].url+'" target="_blank" rel="noopener">'+esc(Z.S[k].n)+'</a></div>'}).join('')+'<h2>ChPL (RPL)</h2>'+Object.keys(Z.CH).map(function(k){return '<div><a href="'+Z.chUrl(k)+'" target="_blank" rel="noopener">'+esc(Z.CH[k][1])+'</a></div>'}).join('');
 var b=$('#infoBox');b.innerHTML=h;b.hidden=false;$('#ix').onclick=function(){b.hidden=true;};}
bar();form();result();
$('#info').onclick=info;
$('#app').addEventListener('input',function(e){var t=e.target;if(t.dataset.f){st[t.dataset.f]=num(t.value);save();sync(t.dataset.f);result();}});
$('#app').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var d=b.dataset;
 if(d.cp!==undefined){copy(+d.cp);return;}
 if(d.o){st.o[d.o]=!st.o[d.o];}else if(d.cf!==undefined){var nv=d.cf==='1';st.conf=st.conf===nv?undefined:nv;}else if(d.sex)st.sex=st.sex===d.sex?'':d.sex;else if(d.cu){if(d.cu!==st.creaU&&isFinite(st.crea))st.crea=Math.round((d.cu==='umol'?st.crea*88.42:st.crea/88.42)*100)/100;st.creaU=d.cu;}
 else if(d.uu){if(d.uu!==st.ureaU&&isFinite(st.urea))st.urea=Math.round((d.uu==='mgdl'?st.urea*6.006:st.urea/6.006)*10)/10;st.ureaU=d.uu;}
 else if(d.pl!==undefined){if(b.disabled)return;st.place=d.pl;}else if(d.al)st.allergy=d.al;else return;
 save();form();result();});
window.addEventListener('storage',function(ev){if(ev.key&&/(^|:)zp_handoff$/.test(ev.key)){bar();form();result();}});
window.addEventListener('message',function(ev){if(ev.data==='zp_handoff'){bar();form();result();}});
window.ZPAPP={state:st,reset:function(){localStorage.removeItem(KEY);location.reload();}};
})();
