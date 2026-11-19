// Troponina / OZW – czyste funkcje (Roche Elecsys hs-TnT, karta lokalna SOR Nowy Targ + ESC 2023)
(function(R){
function algo(i){var c0=i.c0,c1=i.c1,c3=i.c3,oh=i.oh,U=i.url||14;
 if(c0==null)return{k:'none',txt:'Wpisz wynik 0 h.'};
 if(c0>=52)return{k:'in',txt:'RULE-IN (rozpoznanie wstępne): 0 h = '+c0+' ≥ 52 ng/l.'};
 if(c1==null){if(c0<5&&oh!=null&&oh>3)return{k:'out',txt:'RULE-OUT (wykluczenie) jednym oznaczeniem: 0 h = '+c0+' < 5 ng/l i początek bólu > 3 h ('+oh.toFixed(1)+' h) temu. <span class="wer">DO WERYFIKACJI z kartą lab NT – nie = automatyczny wypis</span>'};
  return{k:'wait',txt:(oh!=null&&oh<=3?'Początek bólu ≤ 3 h – pojedynczy wynik nie wyklucza. ':'')+'Pobierz drugą próbkę po 1 h (lub 2 h).'}}
 var dt=i.dt!=null?i.dt:60,d=c1-c0,A=dt<=90?'1h':'2h',r,ad=Math.abs(d).toFixed(1);
 if(A==='1h'){if(c0<12&&Math.abs(d)<3)r={k:'out',txt:'RULE-OUT 0/1 h: 0 h '+c0+' < 12 i |Δ1h| '+ad+' < 3 ng/l. <span class="wer">DO WERYFIKACJI z kartą lab NT – nie = automatyczny wypis</span>'};else if(d>=5)r={k:'in',txt:'RULE-IN 0/1 h: Δ1h = '+d.toFixed(1)+' ≥ 5 ng/l.'};else r={k:'obs',txt:'STREFA OBSERWACJI 0/1 h (0 h '+c0+', Δ1h '+d.toFixed(1)+' ng/l).'}}
 else{if(c0<6&&Math.abs(d)<4)r={k:'out',txt:'RULE-OUT 0/2 h: 0 h '+c0+' < 6 i |Δ2h| '+ad+' < 4 ng/l.'};else if(d>=10)r={k:'in',txt:'RULE-IN 0/2 h: Δ2h = '+d.toFixed(1)+' ≥ 10 ng/l.'};else r={k:'obs',txt:'STREFA OBSERWACJI 0/2 h (0 h '+c0+', Δ2h '+d.toFixed(1)+' ng/l).'};r.txt+=' <span class="wer">progi 0/2 h z ESC 2023, nie z karty lokalnej – DO WERYFIKACJI z laboratorium</span>'}
 r.A=A;r.dt=dt;if(dt>180||dt<30)r.txt+=' ⚠️ odstęp '+dt+' min – poza oknem algorytmu.';
 if(r.k==='obs'&&c3!=null){var d3=c3-c0;if(d3>=5&&c3>U)r={k:'in3',txt:'3 h: '+c3+' ng/l (> URL), Δ0–3h '+d3.toFixed(1)+' ≥ 5 → istotna dynamika, traktuj jak rule-in. <span class="wer">DO WERYFIKACJI</span>'};
  else if(Math.abs(d3)<5&&c3<=U)r={k:'out3',txt:'3 h: '+c3+' ng/l ≤ URL, bez istotnej dynamiki (Δ '+d3.toFixed(1)+') → wykluczenie po obserwacji. <span class="wer">DO WERYFIKACJI</span>'};
  else r={k:'obs3',txt:'3 h: '+c3+' ng/l, Δ '+d3.toFixed(1)+' – wynik niejednoznaczny / stabilnie podwyższony (przewlekłe uszkodzenie?).'}}
 return r}
function heart(i){var h=i.h||{},r=i.r||{},e=i.e||{},age=i.age,U=i.url||14;
 var ty=[h.typ===1,h.rad===1,h.diaph===1].filter(Boolean).length,aty=[h.insp===1,h.palp===1,h.atyp===1].filter(Boolean).length;
 var H=(ty>=2&&aty==0)?2:(ty>=1?1:0),E=(e.std||e.avr||e.dew||e.post||e.stemi||e.sgar||e.rv)?2:(e.ti||e.lbbb||e.nonsp||e.well||e.rbbb||e.lvh||e.pace||e.tneg)?1:0;
 // HEART E (Six/Backus 2008): 1 pkt = nieswoiste zaburzenia repolaryzacji – blok odnogi (LBBB, zupełny RBBB), LVH, rytm stymulatora, nieswoiste ujemne T; 2 pkt = istotne obniżenie ST / STEMI-równoważnik
 var A=age==null?null:age>=65?2:age>=45?1:0,nrf=['htn','dm','lip','smk','fam','obes'].filter(function(k){return r[k]===1}).length,Rk=(r.cad===1||r.pad===1||nrf>=3)?2:nrf>=1?1:0;
 var tv=(i.trops||[]).filter(function(x){return x!=null}),c=tv.length?Math.max.apply(null,tv):-1,T=c<0?null:c<=U?0:c<=3*U?1:2,tot=H+E+(A||0)+Rk+(T||0);
 return{H:H,E:E,A:A,R:Rk,T:T,tot:tot,done:A!=null&&T!=null,cat:tot<=3?'low':tot<=6?'mid':'high',mace:tot<=3?'≈1,7%':tot<=6?'≈12–17%':'≈50–65%'}}
function edacs(i){var a=i.age,sx=i.sex,h=i.h||{},r=i.r||{};if(a==null||!sx)return null;var p=a<=45?2:a>=86?20:2+2*Math.ceil((a-45)/5);if(a<18)p=0;if(sx==='m')p+=6;
 var nrf=['htn','dm','lip','smk','fam'].filter(function(k){return r[k]===1}).length;if(a<=50&&(r.cad===1||nrf>=3))p+=4;if(h.diaph===1)p+=3;if(h.rad===1)p+=5;if(h.insp===1)p-=4;if(h.palp===1)p-=6;return p}
function light(i,a){var e=i.e||{},v=i.v||{},why=[],L=null;var stemi=['stemi','post','rv','dew','sgar'].some(function(k){return e[k]}),vhr=Object.keys(v).some(function(k){return v[k]===1}),isch=e.std||e.ti,ongo=(i.h||{}).ongo===1;
 if(stemi){L='red';why.push('STEMI lub równoważnik w EKG – nie czekaj na troponinę')}
 if(vhr){L='red';why.push('Cecha bardzo wysokiego ryzyka (natychmiastowa strategia inwazyjna &lt;2 h)')}
 if(e.avr||e.well){L='red';why.push(e.avr?'Uniesienie ST w aVR z rozlanymi obniżeniami':'Zespół Wellensa – nie wykonuj próby wysiłkowej')}
 if(a.k==='in'||a.k==='in3'){L='red';why.push('Troponina: rule-in (podejrzenie NSTEMI – zawał bez uniesienia ST)')}
 if(!L){if(a.k==='out'||a.k==='out3'){if(ongo||isch){L='yel';why.push(ongo?'Troponina wykluczająca, ale ból trwa/nawraca':'Troponina wykluczająca, ale niedokrwienne zmiany EKG')}else{L='grn';why.push('Troponina: rule-out wg algorytmu – WYPIS TYLKO PO WERYFIKACJI karty lab NT / kardiolog (progi DO WERYFIKACJI / DO DECYZJI LEKARZA)')}}
  else if(a.k==='obs'||a.k==='obs3'){L='yel';why.push('Strefa obserwacji algorytmu troponinowego')}else if(a.k==='wait'){L='yel';why.push('Algorytm niezakończony – czekamy na kolejną próbkę')}else L='gry'}
 if(L==='yel'&&isch)why.push('Niedokrwienne EKG (obniżenie ST / odwrócenie T) – wypis niemożliwy');
 if(L==='grn')why.push('Nie traktuj samego rule-out jako pewnego wypisu – potwierdź progi z kartą laboratorium PSZS NT i oceną kliniczną.');
 return{L:L,why:why,stemi:stemi,vhr:vhr,dischargeGate:L==='grn'}}

// ---- 5.2 fix18: EKG – zmiany inne niż niedokrwienie + wydruk tylko wypełnionych pól ----
var ISCH=['stemi','inf','rv','post','dew','sgar','avr','wellA','wellB','std','ti'];
var RHY={sin:'rytm zatokowy',af:'migotanie przedsionków (AF)',afl:'trzepotanie przedsionków (AFL)',pace:'rytm stymulatora',oth:'inny rytm'};
var FIND=[
 ['rbbbC','RBBB – blok prawej odnogi pęczka Hisa, zupełny',1],
 ['rbbbI','RBBB – blok prawej odnogi pęczka Hisa, niezupełny',0],
 ['lbbbN','LBBB (blok lewej odnogi pęczka Hisa), nowy / przypuszczalnie nowy',1],
 ['lbbbK','LBBB (blok lewej odnogi pęczka Hisa), znany (stary)',1],
 ['lafb','LAFB – blok przedniej wiązki lewej odnogi (hemiblok przedni)',0],
 ['lpfb','LPFB – blok tylnej wiązki lewej odnogi (hemiblok tylny)',0],
 ['avb1','blok przedsionkowo-komorowy (AV) I stopnia',0],
 ['avb2a','blok AV II stopnia typu Mobitz I (Wenckebacha)',0],
 ['avb2b','blok AV II stopnia typu Mobitz II',0],
 ['avb3','blok AV III stopnia (całkowity)',0],
 ['lvhx','przerost lewej komory (LVH)',1],
 ['wpw','preekscytacja / zespół WPW',0],
 ['qtc','wydłużony QTc',0],
 ['qpat','patologiczne załamki Q / stare zmiany pozawałowe',0],
 ['tneg','ujemne załamki T nieswoiste',1]];
// grupy wzajemnie wykluczające (zaznaczenie jednej pozycji odznacza pozostałe w grupie)
var EXCL=[['rbbbC','rbbbI','lbbbN','lbbbK'],['lafb','lpfb'],['avb1','avb2a','avb2b','avb3']];
function fLabel(k){for(var i=0;i<FIND.length;i++)if(FIND[i][0]===k)return FIND[i][1];return k;}
function anyFinding(f){f=f||{};for(var i=0;i<FIND.length;i++)if(f[FIND[i][0]])return true;return false;}
// mapowanie na klucze silnika (HEART, światło) – bez zmiany logiki decyzji dla kart niedokrwiennych
function ecgMap(cards,x){var e={},k;cards=cards||{};x=x||{};var f=x.f||{};for(k in cards)if(cards[k])e[k]=true;
 if(e.inf)e.stemi=true;if(e.wellA||e.wellB)e.well=true;if(e.pace)e.lbbb=true;if(e.lvh)e.nonsp=true;
 if(f.rbbbC)e.rbbb=true;if(f.lbbbN||f.lbbbK)e.lbbb=true;if(f.lvhx){e.lvh=true;e.nonsp=true;}if(f.tneg)e.tneg=true;
 if(x.rhythm==='pace'){e.pace=true;e.lbbb=true;}
 return e;}
function ecgAssessed(cards,x){x=x||{};cards=cards||{};for(var k in cards)if(cards[k])return true;return !!(x.rhythm||anyFinding(x.f)||x.noisch||String(x.other||'').trim());}
// lista zdań opisu EKG – wyłącznie zaznaczone pozycje (cardLabels: {klucz: etykieta karty})
function ecgLines(cards,x,cardLabels){cards=cards||{};x=x||{};cardLabels=cardLabels||{};var f=x.f||{},out=[];
 if(cards.norm)return ['EKG prawidłowe (bez zmian)'+(x.rhythm==='sin'?' – rytm zatokowy':'')];
 if(x.rhythm)out.push(RHY[x.rhythm]+(x.rhythm==='oth'&&x.rhythmTxt?': '+String(x.rhythmTxt).trim():''));
 for(var k in cards)if(cards[k]&&k!=='norm'&&cardLabels[k])out.push(cardLabels[k]);
 FIND.forEach(function(d){if(!f[d[0]])return;if(d[0]==='lvhx'&&cards.lvh)return;var t=d[1];if(d[0]==='qtc'&&x.qtcMs)t+=' ('+String(x.qtcMs).trim()+' ms)';out.push(t);});
 if(x.noisch)out.push('bez cech świeżego niedokrwienia');
 if(String(x.other||'').trim())out.push(String(x.other).trim());
 return out;}
// adnotacje do interpretacji – tylko gdy dotyczą zaznaczonych zmian (bez dawek)
function ecgNotes(cards,x){cards=cards||{};x=x||{};var f=x.f||{},n=[];
 var lb=f.lbbbN||f.lbbbK||cards.lbbb,pace=x.rhythm==='pace'||cards.pace;
 if(lb||pace)n.push((lb?'LBBB':'Rytm stymulatora')+' utrudnia ocenę niedokrwienia w EKG: oceń kryteria Sgarbossy (zmodyfikowane – Smith 2012); przy objawach sugerujących trwające niedokrwienie postępuj jak w STEMI niezależnie od tego, czy blok jest nowy czy znany (ESC 2023). DO DECYZJI LEKARZA.');
 if(f.rbbbC)n.push('RBBB może maskować zawał (ocena ST w V1–V3 utrudniona); przy objawach sugerujących trwające niedokrwienie postępuj jak w STEMI (ESC 2023). DO DECYZJI LEKARZA.');
 if(f.lbbbN)n.push('Nowy LBBB sam w sobie nie rozstrzyga o zawale – decyduje obraz kliniczny, kryteria Sgarbossy i troponina.');
 if(f.avb2b||f.avb3)n.push('Zaawansowany blok AV – monitorowanie EKG, oceń wskazania do stymulacji. DO DECYZJI LEKARZA.');
 if(f.wpw&&(x.rhythm==='af'||x.rhythm==='afl'))n.push('Preekscytacja z AF/AFL – unikaj leków blokujących węzeł AV; pilna konsultacja kardiologiczna.');
 if(f.qtc)n.push('Wydłużony QTc – unikaj leków wydłużających QT, oceń elektrolity (K, Mg).');
 return n;}
function heartCheck(d){var miss=[];if(!d.hist)miss.push('wywiad');if(!d.ecg)miss.push('EKG');if(d.age==null)miss.push('wiek');if(!d.rf)miss.push('czynniki ryzyka');if(!d.tropN)miss.push('troponina');return{ok:!miss.length,missing:miss};}
function strip(t){return String(t||'').replace(/<\/?[a-z][^>]*>/gi,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();}
// wnioski – z logiki modułu (światło + progi hospitalizacji + skierowanie)
function conclusion(d){var L=d.L,hr=d.hospReasons||[],why=(d.why||[]).map(strip).filter(Boolean),t,lines=[];
 if(L==='red'){t='Pilna konsultacja kardiologiczna – hospitalizacja';lines=why.slice();}
 else if(hr.length){t='Hospitalizacja – konsultacja kardiologiczna';lines=['Próg hospitalizacji: '+hr.join('; ')].concat(why);}
 else if(L==='yel'){t='Obserwacja w SOR – decyzja po kolejnym oznaczeniu troponiny i kontrolnym EKG';lines=why.slice();}
 else if(L==='grn'){t='Możliwy wypis po weryfikacji (rule-out algorytmiczny)';lines=[d.referral?'Skierowanie do poradni kardiologicznej (test nieinwazyjny ambulatoryjnie).':'Skierowanie do poradni kardiologicznej nie jest konieczne (HEART ≤3).','Wypis wymaga weryfikacji progów z kartą laboratorium PSZS NT i oceny klinicznej – DO DECYZJI LEKARZA.'];}
 else{t='Decyzja niemożliwa – do algorytmu potrzebne EKG i troponina 0 h';}
 return{title:t,lines:lines,level:L||'gry'};}
// raport: bloki [tytuł, tekst] wyłącznie z wypełnionych danych
function buildReport(d){var B=[];function add(t,v){if(v&&String(v).trim())B.push([t,String(v).trim()]);}
 var pt=[];if(d.age!=null)pt.push('wiek '+d.age+' lat');if(d.sex)pt.push('płeć '+({m:'M',f:'K'}[d.sex]||d.sex));if(d.onset)pt.push('początek bólu: '+d.onset);add('Pacjent',pt.join(' · '));
 add('Wywiad (potwierdzone)',(d.hist||[]).join('; '));add('Czynniki ryzyka i choroby',(d.rf||[]).join('; '));add('Bardzo wysokie ryzyko',(d.vhr||[]).join('; '));
 var el=d.ecgLines||[],et=[];if(d.ecgTime)et.push('wykonane '+d.ecgTime+(d.ecgFmc?' (pierwszy kontakt '+d.ecgFmc+(d.ecgDelay!=null?', po '+d.ecgDelay+' min':'')+')':''));
 if(el.length||et.length)add('EKG',(et.length?et[0]+(el.length?': ':''):'')+el.join(', '));
 var tr=(d.trops||[]).filter(function(x){return x.v!=null;});
 if(tr.length){add('hs-TnT Roche Elecsys (URL '+d.url+' ng/l)',tr.map(function(x){return x.lab+(x.t?' ('+x.t+')':'')+': '+String(x.v).replace('.',',')+' ng/l'+(x.d!=null?' (Δ '+(x.d>=0?'+':'')+x.d.toFixed(1).replace('.',',')+')':'');}).join('; '));
  if(d.tref)add('Odniesienie 0/1/3 h',d.tref);add('Algorytm ESC',strip(d.algoTxt));}
 var H=d.H,hc=d.heartCheck||{ok:false};
 if(H&&hc.ok)add('Skala HEART',H.tot+'/10 – '+(H.tot<=3?'niskie':H.tot<=6?'pośrednie':'wysokie')+' ryzyko (H'+H.H+' E'+H.E+' A'+H.A+' R'+H.R+' T'+H.T+'); MACE 6 tyg. '+H.mace);
 if(d.ed!=null&&d.edOk)add('EDACS',d.ed+' pkt – '+(d.ed<16?'niskie ryzyko (<16)':'nie niskie (≥16)'));
 var notes=d.notes||[];if(notes.length)add('Uwagi do interpretacji EKG',notes.join(' '));
 var c=d.concl;
 var text=B.map(function(b){return b[0]+': '+b[1];}).join('\n')+(c?'\n\nWNIOSKI: '+c.title+(c.lines.length?'\n– '+c.lines.join('\n– '):''):'');
 return{blocks:B,concl:c,text:text};}
function referral(Hs,ed,r){return Hs.tot>=4||(r||{}).cad===1||(ed!=null&&ed>=16)}
var X={algo:algo,heart:heart,edacs:edacs,light:light,referral:referral,ISCH:ISCH,RHY:RHY,FIND:FIND,EXCL:EXCL,fLabel:fLabel,anyFinding:anyFinding,ecgMap:ecgMap,ecgAssessed:ecgAssessed,ecgLines:ecgLines,ecgNotes:ecgNotes,heartCheck:heartCheck,conclusion:conclusion,buildReport:buildReport,strip:strip};
if(typeof module!=='undefined')module.exports=X;else{R.SK=R.SK||{};R.SK.trop=X}})(typeof window!=='undefined'?window:this);
