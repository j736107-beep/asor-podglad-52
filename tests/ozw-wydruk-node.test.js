// OZW (Troponina) – wydruk tylko wypełnionych pól, EKG inne zmiany, HEART z kompletu. node tests/ozw-wydruk-node.test.js
const T=require('../calc/trop.js');
let pass=0,fail=0;function t(id,fn){let m;try{m=fn();}catch(e){m=e.stack||e;}if(m===true){pass++;console.log('PASS '+id);}else{fail++;console.log('FAIL '+id+' — '+String(m).slice(0,500));}}
const NEG=/\bbrak\b|nie stwierdzono|bez zmian|prawidłow/i;
function base(over){return Object.assign({age:null,sex:'',onset:'',hist:[],rf:[],vhr:[],ecgLines:[],trops:[],url:14,heartCheck:{ok:false},notes:[]},over||{});}

t('OZ-1 HEART E: zupełny RBBB, LBBB nowy/znany, LVH, rytm stymulatora, nieswoiste ujemne T = 1 pkt',()=>{
  const c=[[{f:{rbbbC:true}},1],[{f:{lbbbN:true}},1],[{f:{lbbbK:true}},1],[{f:{lvhx:true}},1],[{rhythm:'pace'},1],[{f:{tneg:true}},1]];
  const bad=c.filter(([x,e])=>T.heart({e:T.ecgMap({},x)}).E!==e);return bad.length?JSON.stringify(bad):true;});
t('OZ-2 HEART E: niezupełny RBBB, LAFB, blok AV I, AF, WPW, QTc, stare Q = 0 pkt (nie są nieswoistymi zaburzeniami repolaryzacji wg HEART)',()=>{
  const c=[{f:{rbbbI:true}},{f:{lafb:true}},{f:{avb1:true}},{rhythm:'af'},{f:{wpw:true}},{f:{qtc:true}},{f:{qpat:true}}];
  const bad=c.filter(x=>T.heart({e:T.ecgMap({},x)}).E!==0);return bad.length?JSON.stringify(bad):true;});
t('OZ-3 HEART E: obniżenie ST nadal 2 pkt także z RBBB',()=>T.heart({e:T.ecgMap({std:true},{f:{rbbbC:true}})}).E===2||'E!=2');
t('OZ-4 opis EKG: „rytm zatokowy, RBBB…, bez cech świeżego niedokrwienia” zamiast „bez zmian”',()=>{
  const l=T.ecgLines({}, {rhythm:'sin',f:{rbbbC:true},noisch:true},{});const s=l.join(', ');
  return s==='rytm zatokowy, RBBB – blok prawej odnogi pęczka Hisa, zupełny, bez cech świeżego niedokrwienia'&&!/bez zmian|prawidłowe/.test(s)?true:s;});
t('OZ-5 opis EKG: tylko zaznaczone; bez noisch nie ma zdania o braku niedokrwienia',()=>{
  const s=T.ecgLines({},{rhythm:'sin',f:{rbbbC:true}},{}).join(', ');return !/niedokrwien|brak|bez /.test(s)?true:s;});
t('OZ-6 QTc z wartością, inny rytm z opisem, pole „inne”',()=>{
  const s=T.ecgLines({},{rhythm:'oth',rhythmTxt:'rytm węzłowy',f:{qtc:true},qtcMs:'510',other:'niski woltaż'},{}).join(', ');
  return /inny rytm: rytm węzłowy/.test(s)&&/wydłużony QTc \(510 ms\)/.test(s)&&/niski woltaż/.test(s)?true:s;});
t('OZ-7 adnotacje: LBBB/stymulator – Sgarbossa; RBBB – maskowanie zawału (bez Sgarbossy); wszystkie: jak w STEMI przy objawach (ESC 2023), bez dawek',()=>{
  const a=T.ecgNotes({},{f:{lbbbN:true}}).join(' '),b=T.ecgNotes({},{f:{rbbbC:true}}).join(' '),c=T.ecgNotes({},{rhythm:'pace'}).join(' ');
  const ok=[a,c].every(x=>/Sgarbossy/.test(x))&&!/Sgarbossy/.test(b)&&[a,b,c].every(x=>/jak w STEMI/.test(x)&&!/\d+\s*(mg|µg|ml)/.test(x));
  return ok&&/^LBBB/.test(a)&&/^RBBB/.test(b)&&/^Rytm stymulatora/.test(c)&&T.ecgNotes({},{f:{rbbbI:true}}).length===0?true:[a,b,c].join(' | ');});
t('OZ-8 wydruk: tylko wypełnione bloki, żadnych „—”, „brak”, „nie stwierdzono”',()=>{
  const R=T.buildReport(base({hist:['Ból typowy'],ecgLines:['rytm zatokowy','RBBB – blok prawej odnogi pęczka Hisa, zupełny']}));
  const names=R.blocks.map(b=>b[0]);
  return names.join('|')==='Wywiad (potwierdzone)|EKG'&&!/—/.test(R.text)&&!NEG.test(R.text)?true:R.text;});
t('OZ-9 HEART tylko z kompletu: niepełne dane → brak bloku HEART (nie jako pełny wynik)',()=>{
  const H=T.heart({h:{typ:1},e:{},age:null,trops:[]});const hc=T.heartCheck({hist:true,ecg:true,age:null,rf:false,tropN:0});
  const R=T.buildReport(base({hist:['Ból typowy'],H,heartCheck:hc}));
  return !hc.ok&&hc.missing.join(',')==='wiek,czynniki ryzyka,troponina'&&!/HEART/.test(R.text)?true:R.text+' '+JSON.stringify(hc);});
t('OZ-10 HEART z kompletu → blok HEART z wynikiem i składowymi',()=>{
  const H=T.heart({h:{typ:1,rad:1},r:{htn:1},e:T.ecgMap({},{f:{rbbbC:true}}),age:58,trops:[6,7],url:14});
  const hc=T.heartCheck({hist:true,ecg:true,age:58,rf:true,tropN:2});
  const R=T.buildReport(base({hist:['a'],H,heartCheck:hc}));
  return hc.ok&&/Skala HEART: 5\/10 – pośrednie ryzyko \(H2 E1 A1 R1 T0\)/.test(R.text)?true:R.text;});
t('OZ-11a strip(): zachowuje znak „<” w tekście, usuwa tylko znaczniki',()=>{const s=T.strip('RULE-OUT 0/1 h: 0 h 6 < 12 i |Δ1h| 1.0 < 3 ng/l. <span class="wer">DO WERYFIKACJI</span>');return s==='RULE-OUT 0/1 h: 0 h 6 < 12 i |Δ1h| 1.0 < 3 ng/l. DO WERYFIKACJI'?true:s;});
t('OZ-11 troponina: tylko wpisane próbki, Δ, URL; algorytm tylko gdy jest 0 h',()=>{
  const R=T.buildReport(base({trops:[{lab:'0 h',t:'08:40',v:6},{lab:'1 h / 2 h',t:'',v:null},{lab:'3 h',t:'',v:null}],algoTxt:'RULE-OUT 0/1 h <span class="wer">X</span>'}));
  return /hs-TnT Roche Elecsys \(URL 14 ng\/l\): 0 h \(08:40\): 6 ng\/l$/m.test(R.text)&&!/1 h \/ 2 h|3 h/.test(R.text)&&/Algorytm ESC: RULE-OUT 0\/1 h X/.test(R.text)?true:R.text;});
t('OZ-12 pusty moduł → pusty raport (bez wniosków, bez nagłówków)',()=>{const R=T.buildReport(base());return R.text===''&&R.blocks.length===0?true:JSON.stringify(R);});
t('OZ-13 wnioski: czerwone → pilna konsultacja; próg HEART → hospitalizacja; żółte → obserwacja; zielone → możliwy wypis + poradnia/nie',()=>{
  const r=T.conclusion({L:'red',why:['STEMI lub równoważnik']}),h=T.conclusion({L:'yel',hospReasons:['HEART 5/10 (≥4)'],why:['Strefa obserwacji']}),
   y=T.conclusion({L:'yel',why:['Strefa']}),g=T.conclusion({L:'grn',why:[],referral:false}),g2=T.conclusion({L:'grn',why:[],referral:true});
  return /Pilna konsultacja kardiologiczna/.test(r.title)&&/^Hospitalizacja/.test(h.title)&&/HEART 5\/10/.test(h.lines[0])&&/^Obserwacja w SOR/.test(y.title)&&/Możliwy wypis/.test(g.title)&&/nie jest konieczne/.test(g.lines[0])&&/^Skierowanie do poradni/.test(g2.lines[0])?true:JSON.stringify([r,h,y,g,g2]);});
t('OZ-14 wydruk z wnioskami: sekcja WNIOSKI na końcu',()=>{
  const d=base({hist:['Ból typowy'],ecgLines:['rytm zatokowy']});d.concl=T.conclusion({L:'yel',why:['Strefa obserwacji algorytmu troponinowego']});
  const R=T.buildReport(d);return /\n\nWNIOSKI: Obserwacja w SOR[^\n]*\n– Strefa obserwacji/.test(R.text)&&R.text.trim().endsWith('troponinowego')?true:R.text;});
t('OZ-15 grupy wykluczające: RBBB zupełny/niezupełny/LBBB, hemibloki, stopnie bloku AV',()=>{
  const g=T.EXCL.map(x=>x.join(','));return g.join('|')==='rbbbC,rbbbI,lbbbN,lbbbK|lafb,lpfb|avb1,avb2a,avb2b,avb3'?true:g.join('|');});
t('OZ-16 lista zmian EKG zawiera wszystkie wymagane pozycje',()=>{
  const need=['rbbbC','rbbbI','lbbbN','lbbbK','lafb','avb1','avb2a','avb2b','avb3','lvhx','wpw','qtc','qpat','tneg'];const have=T.FIND.map(f=>f[0]);
  const miss=need.filter(k=>have.indexOf(k)<0);return !miss.length&&T.RHY.af&&T.RHY.afl&&T.RHY.pace?true:miss.join(',');});
t('OZ-17 „EKG prawidłowe” wypisuje się wyłącznie samo (bez anomalii)',()=>{const s=T.ecgLines({norm:true},{rhythm:'sin'},{}).join(', ');return s==='EKG prawidłowe (bez zmian) – rytm zatokowy'?true:s;});
console.log(pass+'/'+(pass+fail)+(fail?' FAIL':' PASS'));process.exit(fail?1:0);
