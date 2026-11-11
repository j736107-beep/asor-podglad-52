// Asystent SOR 5.2 – PILOT „Epikryza (AI)” (Zapalenie płuc). Logika bez interfejsu: biała lista danych, prompt, zapytanie, parsowanie.
// RODO: do modelu trafiają WYŁĄCZNIE dane kliniczne z białej listy (whitelist). Imię, nazwisko, czas przyjęcia
// ani żaden identyfikator NIGDY nie są kopiowane do ładunku; pola tekstowe są dodatkowo czyszczone (scrub), a gotowe body
// sprawdzane (assertClean) – przy wykryciu identyfikatora zapytanie NIE jest wysyłane.
(function(r,f){var m=f();if(typeof module==='object'&&module.exports)module.exports=m;else r.SORAIEpi=m;})(this,function(){
'use strict';
var MODELS={xai:[['grok-4.7','Grok 4.7 (domyślny – zalecany przez xAI; rozumowanie „low” dla szybkości)'],['grok-4.20-0309-non-reasoning','Grok 4.20 bez rozumowania (najszybszy – przy przekroczeniu czasu)'],['grok-4.3','Grok 4.3 (tańszy)']],
 openai:[['gpt-4.1-mini','GPT-4.1 mini (domyślny – szybki, tani)'],['gpt-4.1','GPT-4.1'],['gpt-4o-mini','GPT-4o mini'],['gpt-4o','GPT-4o'],['gpt-5.4-mini','GPT-5.4 mini']],
 anthropic:[['claude-sonnet-5-5','Claude Sonnet 5.5 (domyślny)'],['claude-haiku-5-5','Claude Haiku 5.5 (szybki, tani)'],['claude-opus-5-5','Claude Opus 5.5']]};
var PROV={xai:{name:'xAI (Grok)',url:'https://api.x.ai/v1/chat/completions',test:'https://api.x.ai/v1/models',keyHint:'xai-…',console:'console.x.ai'},
 openai:{name:'OpenAI',url:'https://api.openai.com/v1/chat/completions',test:'https://api.openai.com/v1/models',keyHint:'sk-…',console:'platform.openai.com'},
 anthropic:{name:'Anthropic',url:'https://api.anthropic.com/v1/messages',test:'https://api.anthropic.com/v1/models',keyHint:'sk-ant-…',console:'console.anthropic.com'}};
var HOSTS=['api.x.ai','api.openai.com','api.anthropic.com'];var DEF='xai';
function provOf(p){return PROV[p]?p:DEF;}
// xAI: modele z rozumowaniem (domyślnie „high” – wolno); dla epikryzy wymuszamy „low”, by zmieścić się w 60 s
function reasons(prov,m){return prov==='xai'&&/^grok-4\.7/.test(m);}
var TEMP=0.2,TIMEOUT=60000;
function fin(x){return typeof x==='number'&&isFinite(x);}
function r1(x,d){var p=Math.pow(10,d==null?1:d);return Math.round(x*p)/p;}
function bool(x){return x===true?true:x===false?false:undefined;}
function esc(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
// ---------- identyfikatory ----------
function idTokens(ids){ids=ids||{};var t=[];String(ids.name||'').split(/[\s,;.\-–]+/).forEach(function(x){x=x.trim();if(x.length>=2)t.push(x);});
 if(String(ids.name||'').trim().length>=2)t.unshift(String(ids.name).trim());return t;}
function scrub(s,ids){s=String(s==null?'':s);ids=ids||{};
 s=s.replace(/\b\d{11}\b/g,'[usunięto]');
 if(ids.adm&&String(ids.adm).trim().length>=4)s=s.split(String(ids.adm).trim()).join('[usunięto]');
 s=s.replace(/\b\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4},?\s*(godz\.?\s*)?\d{1,2}:\d{2}\b/g,'[usunięto]');
 idTokens(ids).forEach(function(tok){s=s.replace(new RegExp('(^|[^\\p{L}])'+esc(tok)+'(?=$|[^\\p{L}])','giu'),'$1[usunięto]');});
 return s;}
function assertClean(body,ids){var b=String(body),bad=[];ids=ids||{};
 if(/\b\d{11}\b/.test(b))bad.push('11-cyfrowy numer');
 idTokens(ids).forEach(function(tok){if(new RegExp('(^|[^\\p{L}])'+esc(tok)+'(?=$|[^\\p{L}])','iu').test(b))bad.push('imię/nazwisko');});
 if(ids.adm&&String(ids.adm).trim().length>=4&&b.indexOf(String(ids.adm).trim())>=0)bad.push('czas przyjęcia');
 if(bad.length)throw new Error('Zablokowano wysyłkę: w danych wykryto identyfikator pacjenta ('+bad.filter(function(x,i,a){return a.indexOf(x)===i;}).join(', ')+').');return true;}
// ---------- biała lista ----------
var VIT=[['rr','Oddechy','/min'],['sbp','SBP','mmHg'],['dbp','DBP','mmHg'],['hr','HR','/min'],['temp','Temperatura głęboka','°C'],['spo2','SpO₂','%']];
var LABS=[['urea','Mocznik','mmol/l'],['na','Na','mmol/l'],['glu','Glukoza','mmol/l'],['ph','pH tętnicze',''],['hct','Hematokryt','%'],['pao2','PaO₂','mmHg'],['pf','PaO₂/FiO₂','mmHg'],['wbc','Leukocyty','G/l'],['platelets','PLT','G/l']];
var HIST=[['nursing','pobyt w domu opieki'],['cancer','nowotwór'],['liver','choroba wątroby'],['heart','niewydolność serca'],['stroke','choroba naczyniowa mózgu'],['renal','choroba nerek'],['effusion','płyn w jamie opłucnej']];
var SEV=[['ventilation','wentylacja mechaniczna inwazyjna'],['vasopressor','wstrząs septyczny wymagający wazopresora'],['multilobar','nacieki wielopłatowe'],['fluidHypotension','hipotensja wymagająca intensywnej płynoterapii']];
var CO=[['liver','niewydolność wątroby'],['renal','niewydolność nerek'],['heart','niewydolność serca'],['preg','ciąża']];
var RISK=[['mrsa','ryzyko MRSA'],['pseudo','ryzyko Pseudomonas'],['recent','hospitalizacja / antybiotyk i.v. w ostatnich 90 dniach'],['asp','zachłyśnięcie'],['abscess','ropień / ropniak'],['leg','podejrzenie Legionella'],['atyp','podejrzenie patogenu atypowego'],['qt','wydłużony QT'],['hd','hemodializa'],['comorb','choroby współistniejące'],['noOral','brak tolerancji doustnej']];
var ALLERGY={none:'brak alergii na β-laktamy (potwierdzone)',late:'alergia na penicyliny – reakcja późna / łagodna',imm:'alergia na penicyliny – reakcja natychmiastowa (IgE-zależna)'};
var PLACE={home:'Leczenie domowe',obs:'Krótka hospitalizacja / obserwacja lub dom ze ścisłą kontrolą (decyzja lekarza)',ward:'Hospitalizacja – oddział',icu:'Ciężkie PZP – OIOM / OIT rozważany'};
var RANK={home:0,obs:0,ward:1,icu:2};
// src: {bar:SKS.P(), assess:{i,r}, zp:{allergy,o,place}, abx:'tekst planu', notes:'tekst'}  ids: {name,adm} – używane TYLKO do czyszczenia
function buildPayload(src,ids){src=src||{};var b=src.bar||{},A=src.assess||{},i=A.i||{},r=A.r||{},a=r.assess||{},zp=src.zp||{},o=zp.o||{};
 var P={modul:'Zapalenie płuc (PZP) u dorosłego – SOR',pacjent:{},parametry:{},badania:{},wywiad_PSI:{},kryteria_ciezkosci:{},wyniki_programu:{},antybiotykoterapia:[],alergia:'',czynniki_ryzyka:[],notatki_lekarza:''};
 var age=fin(i.age)?i.age:b.age;if(fin(age))P.pacjent.wiek_lata=Math.round(age);
 var sex=i.sex||b.sex;if(sex==='m'||sex==='f'||sex==='k')P.pacjent.plec=sex==='m'?'mężczyzna':'kobieta';
 if(fin(b.w))P.pacjent.masa_kg=r1(b.w,1);if(fin(b.h))P.pacjent.wzrost_cm=Math.round(b.h);
 if(fin(b.crMg))P.pacjent.kreatynina_mg_dl=r1(b.crMg,2);if(fin(b.egfr))P.pacjent.eGFR_ml_min_173=Math.round(b.egfr);if(fin(b.crcl))P.pacjent.CrCl_ml_min=Math.round(b.crcl);
 var co=CO.filter(function(x){return b.co&&b.co[x[0]]===true;}).map(function(x){return x[1];});if(co.length)P.pacjent.obciazenia=co;
 VIT.forEach(function(x){if(fin(i[x[0]]))P.parametry[x[1]+(x[2]?' ['+x[2]+']':'')]=r1(i[x[0]],1);});
 if(bool(i.confusion)!==undefined)P.parametry['Nowe splątanie']=i.confusion?'tak':'nie';if(bool(i.oral)!==undefined)P.parametry['Toleruje leczenie doustne']=i.oral?'tak':'nie';
 LABS.forEach(function(x){if(fin(i[x[0]]))P.badania[x[1]+(x[2]?' ['+x[2]+']':'')]=r1(i[x[0]],x[0]==='ph'?2:1);});
 HIST.forEach(function(x){if(bool(i[x[0]])!==undefined)P.wywiad_PSI[x[1]]=i[x[0]]?'tak':'nie';});
 SEV.forEach(function(x){if(bool(i[x[0]])!==undefined)P.kryteria_ciezkosci[x[1]]=i[x[0]]?'tak':'nie';});
 var W=P.wyniki_programu,c=r.curb||{},p=r.psi||{},s=r.severe||{};
 if(fin(c.score))W['CURB-65']=(c.complete?'':'co najmniej ')+c.score+'/5';
 if(p.step1)W['PSI / PORT']='klasa I (reguła pierwszego etapu)';else if(fin(p.score))W['PSI / PORT']=p.complete?'klasa '+p.cls+' ('+p.score+' pkt)':'co najmniej '+p.score+' pkt – klasa nieustalona (dane niepełne)';
 if(s.major)W['Ciężkie PZP ATS/IDSA 2019']=s.major.length+' kryteria duże / '+s.minor.length+' małe'+((s.majorTxt||[]).concat(s.minorTxt||[]).length?': '+(s.majorTxt||[]).concat(s.minorTxt||[]).join('; '):'')+(s.severe?' – SPEŁNIA kryteria ciężkiego PZP':'');
 var pl=a.place;if(zp.place&&RANK[zp.place]!=null)pl=zp.place;
 if(pl&&PLACE[pl]){W['Miejsce leczenia']=PLACE[pl]+(pl!==a.place&&a.place&&PLACE[a.place]?' (wybór lekarza; rekomendacja programu: '+PLACE[a.place]+')':'');P._place=pl;}
 if(a.reasons&&a.reasons.length)W['Uzasadnienie miejsca leczenia']=a.reasons.map(function(x){return scrub(x,ids);});
 if(a.missing&&a.missing.length)W['Brakujące dane (wg programu)']=a.missing.map(function(x){return scrub(x,ids);});
 String(src.abx||'').split('\n').map(function(x){return scrub(x,ids).trim();}).filter(Boolean).forEach(function(x){P.antybiotykoterapia.push(x);});
 if(ALLERGY[zp.allergy])P.alergia=ALLERGY[zp.allergy];
 RISK.forEach(function(x){if(o[x[0]]===true)P.czynniki_ryzyka.push(x[1]);});
 P.notatki_lekarza=scrub(String(src.notes||'').slice(0,4000),ids).trim();
 Object.keys(P).forEach(function(k){var v=P[k];if(v===''||(Array.isArray(v)&&!v.length)||(v&&typeof v==='object'&&!Array.isArray(v)&&!Object.keys(v).length))delete P[k];});
 return P;}
function section(place){return place==='home'?'ZALECENIA PRZY WYPISIE':place==='icu'?'UZASADNIENIE PRZEKAZANIA DO OIT':place==='obs'?'UZASADNIENIE OBSERWACJI W SOR':'UZASADNIENIE HOSPITALIZACJI';}
function dataText(P){var L=[];function obj(t,o){if(!o)return;L.push(t+':');Object.keys(o).forEach(function(k){var v=o[k];L.push('- '+k+': '+(Array.isArray(v)?v.join('; '):v));});}
 L.push('Moduł: '+P.modul);obj('Pacjent',P.pacjent);obj('Parametry życiowe',P.parametry);obj('Badania',P.badania);obj('Wywiad (PSI)',P.wywiad_PSI);obj('Kryteria ciężkości (ATS/IDSA)',P.kryteria_ciezkosci);
 if(P.alergia)L.push('Alergia: '+P.alergia);if(P.czynniki_ryzyka)L.push('Czynniki ryzyka / modyfikatory: '+P.czynniki_ryzyka.join('; '));
 obj('WYNIKI PROGRAMU – AUTORYTATYWNE (cytuj dosłownie, nie zmieniaj)',P.wyniki_programu);
 if(P.antybiotykoterapia){L.push('ANTYBIOTYKOTERAPIA Z PROGRAMU – AUTORYTATYWNA (cytuj dosłownie leki, dawki, drogi i odstępy; nie zmieniaj):');P.antybiotykoterapia.forEach(function(x){L.push('- '+x);});}
 if(P.notatki_lekarza)L.push('Notatki kliniczne lekarza (przebieg, wywiad, badanie):\n'+P.notatki_lekarza);
 return L.join('\n');}
function buildPrompt(P){var sec=section(P._place);
 var sys=['Jesteś asystentem lekarza SOR w Polsce. Piszesz dokumentację medyczną po polsku, zwykłym tekstem (bez Markdown, bez gwiazdek, bez #).',
 'Zasady bezwzględne:','1. Używaj WYŁĄCZNIE faktów podanych w danych. Niczego nie wymyślaj (objawów, badań, leków, dawek, wyników, rozpoznań, dat).',
 '2. Nie pisz „brak danych”, „nie podano” ani podobnych zwrotów w tekście do wklejenia – brakujące informacje pomiń; wypisz je tylko w sekcji UWAGI DLA LEKARZA.',
 '3. Wyniki programu (CURB-65, PSI, kryteria ATS/IDSA, miejsce leczenia) oraz antybiotykoterapia z programu są AUTORYTATYWNE: cytuj je dosłownie, nie zmieniaj, nie przeliczaj, nie proponuj innych leków ani dawek.',
 '4. Rozpoznania ICD-10: polska wersja ICD-10 (kod + nazwa). Koduj tylko to, co wynika z danych; przy rozpoznaniu niepewnym koduj objaw (np. R50.9, R06.0), nie zgaduj kodów. Jeśli kod budzi wątpliwość – napisz to w UWAGACH DLA LEKARZA.',
 '5. Nie podawaj danych identyfikujących pacjenta (nie znasz ich i nie są potrzebne).',
 'Format odpowiedzi – dokładnie w tej kolejności, nagłówki wielkimi literami w osobnych wierszach:',
 'EPIKRYZA','(zwięzły opis chronologiczny: przyjęcie do SOR, stan, parametry, badania, wyniki skal, decyzja; tylko podane fakty)',
 'ROZPOZNANIA ICD-10','(lista: kod – nazwa)',sec,
 P._place==='home'?'(zalecenia przy wypisie: leczenie dokładnie wg antybiotykoterapii z programu, kontrola, objawy alarmowe wymagające pilnego zgłoszenia; bez nowych leków)':'(krótkie uzasadnienie hospitalizacji / OIT na podstawie wyników programu – 2–4 zdania; bez zaleceń wypisowych)',
 '=====','UWAGI DLA LEKARZA','(NIE do wklejenia: brakujące dane, sprzeczności w danych, ryzyka i rzeczy do weryfikacji; punktowo)'].join('\n');
 var usr='Przygotuj dokumentację SOR (format EPIKRYZA SOR) na podstawie poniższych danych.\nMiejsce leczenia wg programu: '+(P.wyniki_programu&&P.wyniki_programu['Miejsce leczenia']||'nieustalone')+' → trzecia sekcja: '+sec+'.\n\nDANE:\n'+dataText(P);
 return{system:sys,user:usr,section:sec};}
function buildRequest(cfg,pr,o){o=o||{};var prov=provOf(cfg.provider),model=cfg.model||MODELS[prov][0][0],body;
 if(prov==='openai'||prov==='xai'){body={model:model,messages:[{role:'system',content:pr.system},{role:'user',content:pr.user}],max_completion_tokens:prov==='xai'?4000:3000};if(!o.noTemp)body.temperature=TEMP;if(reasons(prov,model)&&!o.noReason)body.reasoning_effort='low';
  return{url:PROV[prov].url,init:{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+cfg.key},body:JSON.stringify(body)}};}
 body={model:model,max_tokens:3000,system:pr.system,messages:[{role:'user',content:pr.user}]};if(!o.noTemp)body.temperature=TEMP;
 return{url:PROV.anthropic.url,init:{method:'POST',headers:{'Content-Type':'application/json','x-api-key':cfg.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify(body)}};}
function testRequest(cfg){var prov=provOf(cfg.provider);
 return prov!=='anthropic'?{url:PROV[prov].test,init:{method:'GET',headers:{'Authorization':'Bearer '+cfg.key}}}:{url:PROV.anthropic.test,init:{method:'GET',headers:{'x-api-key':cfg.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'}}};}
function extract(prov,j){j=j||{};if(prov==='anthropic'){return (j.content||[]).filter(function(c){return c&&c.type==='text';}).map(function(c){return c.text;}).join('\n');}
 var ch=j.choices&&j.choices[0];var c=ch&&ch.message&&ch.message.content;if(Array.isArray(c))c=c.map(function(x){return x.text||'';}).join('');return c||'';}
function clean(t){return String(t||'').replace(/\r/g,'').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/^\s{0,3}#{1,6}\s*/gm,'').replace(/^```[a-z]*\s*$/gm,'').trim();}
function parse(prov,j,P){var raw=clean(extract(prov,j));if(!raw)throw new Error('Pusta odpowiedź modelu.');
 var m=raw.match(/^[ \t]*[=\-_*]{0,}\s*UWAGI DLA LEKARZA\s*:?\s*$/m),paste=raw,notes='';
 if(m){paste=raw.slice(0,m.index);notes=raw.slice(m.index+m[0].length).trim();}
 paste=paste.replace(/(\n[ \t]*[=\-_]{3,}[ \t]*)+\s*$/,'').trim();
 var warn=[];if(!/^\s*EPIKRYZA\b/m.test(paste))warn.push('Brak nagłówka EPIKRYZA – sprawdź format.');if(!/ROZPOZNANIA ICD-10/.test(paste))warn.push('Brak sekcji ROZPOZNANIA ICD-10.');
 if(P&&P.wyniki_programu){var W=P.wyniki_programu;var pl=W['Miejsce leczenia'];if(pl&&paste.indexOf(pl.replace(/ \(podwyższone ręcznie przez lekarza\)$/,''))<0)warn.push('Model nie zacytował dosłownie miejsca leczenia z programu („'+pl+'”) – zweryfikuj.');
  var psi=W['PSI / PORT'];var mc=psi&&psi.match(/klasa [IV]+/);if(mc&&paste.indexOf(mc[0])<0)warn.push('Brak dosłownej klasy PSI („'+mc[0]+'”) w tekście – zweryfikuj.');
  if(P._place!=='home'&&/ZALECENIA PRZY WYPISIE/.test(paste))warn.push('Model dodał ZALECENIA PRZY WYPISIE, choć miejsce leczenia ≠ dom – usuń je.');}
 if(warn.length)notes=('KONTROLA PROGRAMU:\n- '+warn.join('\n- ')+(notes?'\n\n':''))+notes;
 return{raw:raw,paste:paste,notes:notes,warn:warn};}
function errorText(e,status,body){var msg='';try{var j=typeof body==='string'?JSON.parse(body):body;msg=(j&&j.error&&(typeof j.error==='string'?j.error:(j.error.message||j.error.type)))||(j&&j.message)||'';}catch(_){msg=String(body||'').slice(0,200);}
 if(e&&e.name==='AbortError')return 'Przekroczono czas oczekiwania (60 s). Spróbuj ponownie lub wybierz szybszy model.';
 if(e&&!status)return 'Błąd sieci – brak połączenia z serwerem AI (sprawdź internet; sieć szpitalna może blokować api.x.ai / api.openai.com / api.anthropic.com).';
 if((status===400||status===401||status===403)&&/(incorrect|invalid|wrong|missing)[^.]*api key|api key[^.]*(incorrect|invalid|not valid)/i.test(msg))return 'Nieprawidłowy klucz API ('+status+'). Sprawdź klucz w Ustawieniach → Sztuczna inteligencja (pilot) (xAI: klucz zaczyna się od „xai-”, z console.x.ai).';
 if(status===402||(status===403&&/credit|billing|balance|spending/i.test(msg)))return 'Brak środków na koncie dostawcy (kredyty / limit wydatków). Doładuj konto (xAI: console.x.ai → Billing).';
 if(status===401)return 'Nieprawidłowy klucz API (401). Sprawdź klucz w Ustawieniach → Sztuczna inteligencja (pilot) (xAI: klucz zaczyna się od „xai-”, z console.x.ai).';
 if(status===403)return 'Brak dostępu (403) – klucz nie ma uprawnień do tego modelu lub konto jest zablokowane.'+(msg?' ('+msg+')':'');
 if(status===404)return 'Model niedostępny (404) – wybierz inny model w Ustawieniach.'+(msg?' ('+msg+')':'');
 if(status===429)return /quota|credit|billing|balance|spending/i.test(msg)?'Brak środków / wyczerpany limit konta (quota). Doładuj konto u dostawcy.':'Zbyt wiele zapytań (429) – odczekaj chwilę i spróbuj ponownie.';
 if(status===400)return 'Błędne zapytanie (400)'+(msg?': '+msg:'')+'.';
 if(status>=500)return 'Serwer dostawcy AI niedostępny lub przeciążony ('+status+'). Spróbuj za chwilę.';
 return 'Błąd ('+status+')'+(msg?': '+msg:'')+'.';}
function fetchT(fetchImpl,url,init,ms){var ac=typeof AbortController!=='undefined'?new AbortController():null,t=null;if(ac){init=Object.assign({},init,{signal:ac.signal});t=setTimeout(function(){ac.abort();},ms||TIMEOUT);}
 return fetchImpl(url,init).finally(function(){if(t)clearTimeout(t);});}
function call(cfg,P,ids,fetchImpl){var pr=buildPrompt(P),prov=provOf(cfg.provider);
 function go(o){var q=buildRequest(cfg,pr,o);assertClean(q.init.body,ids);
  return fetchT(fetchImpl,q.url,q.init).then(function(res){return res.text().then(function(t){if(!res.ok){if(res.status===400&&!o.noTemp&&/temperature/i.test(t))return go(Object.assign({},o,{noTemp:true}));if(res.status===400&&!o.noReason&&/reasoning_effort|reasoning effort/i.test(t))return go(Object.assign({},o,{noReason:true}));var e=new Error(errorText(null,res.status,t));e.status=res.status;throw e;}
   var j;try{j=JSON.parse(t);}catch(_){throw new Error('Nieczytelna odpowiedź serwera AI.');}var out=parse(prov,j,P);out.model=j.model||cfg.model;out.noTemp=!!o.noTemp;out.noReason=!!o.noReason;return out;});},
   function(e){if(e&&e.status)throw e;var x=new Error(errorText(e,0));x.cause=e;throw x;});}
 return go({});}
function test(cfg,fetchImpl){var q=testRequest(cfg);return fetchT(fetchImpl,q.url,q.init,20000).then(function(res){return res.text().then(function(t){if(!res.ok)throw new Error(errorText(null,res.status,t));return 'Połączenie OK – klucz '+PROV[provOf(cfg.provider)].name+' działa.';});},function(e){if(e&&/^(Nieprawidłowy|Brak|Model|Zbyt|Błędne|Serwer|Błąd \()/.test(e.message))throw e;throw new Error(errorText(e,0));});}
function mask(k){k=String(k||'');return k.length<8?(k?'••••':''):k.slice(0,3)+'…'+'•'.repeat(6)+k.slice(-4);}
return{DEF:DEF,provOf:provOf,MODELS:MODELS,PROV:PROV,HOSTS:HOSTS,TEMP:TEMP,TIMEOUT:TIMEOUT,scrub:scrub,assertClean:assertClean,buildPayload:buildPayload,dataText:dataText,buildPrompt:buildPrompt,section:section,buildRequest:buildRequest,testRequest:testRequest,parse:parse,errorText:errorText,call:call,test:test,mask:mask,PLACE:PLACE};
});
