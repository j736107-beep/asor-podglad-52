// fix25 (decyzja lekarza 21.11.2026): usunięty „Rejestr leczenia”; Bilans płynów – nowe płyny i „Inne straty”; napisy usunięte z całego projektu;
// SpO₂ – słowniczek nie rozbija; nagłówek: tylko wersja i data; AI ukryte domyślnie; Antykoagulacja – kratka w nagłówku.
const fs=require('fs'),path=require('path'),R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
let n=0,f=0;const ok=(name,c,info)=>{n++;if(!c)f++;console.log((c?'PASS ':'FAIL ')+name+(c?'':' :: '+String(info||'').slice(0,500)));};
const F=require('../fluid.js');
ok('B-1 płyny: Optilyte, Glukoza 5%, NaCl 0,9%, 1:1 (G5% : NaCl 0,9%), Ringer – bez dublowania',F.IV.includes('Optilyte (płyn wieloelektrolitowy)')&&F.IV.includes('Glukoza 5%')&&F.IV.includes('0,9% NaCl')&&F.IV.includes('Płyn 1:1 (Glukoza 5% : NaCl 0,9%)')&&F.IV.filter(x=>/Ringer/.test(x)).length===1,F.IV.join('|'));
ok('B-2 inne straty: sonda, biegunka, wymioty, opłucna, otrzewna (i nic więcej)',JSON.stringify(F.LOSS)===JSON.stringify(['Sonda żołądkowa','Biegunka','Wymioty','Jama opłucnej (torakocenteza / dren)','Jama otrzewnej (paracenteza)']),F.LOSS.join('|'));
let s=F.empty();s=F.add(s,'iv',1000,{label:F.IV[3]},1000);s=F.add(s,'po',200,{},2000);s=F.add(s,'ur',300,{},3000);s=F.add(s,'lo',1500,{label:F.LOSS[4]},4000);s=F.add(s,'lo',250,{label:F.LOSS[0]},5000);
const S=F.summary(s,1000+7200000,80,1000);
ok('B-3 bilans = (i.v. + p.o.) − diureza − inne straty: 1200 − 300 − 1750 = −850',S.inn===1200&&S.ur===300&&S.lo===1750&&S.out===2050&&S.balance===-850,JSON.stringify(S));
ok('B-4 walidacja zapisu zachowuje „Inne straty” z etykietą',F.validate(JSON.parse(JSON.stringify(s))).e.filter(x=>x.k==='lo').map(x=>x.label).join('|')==='Jama otrzewnej (paracenteza)|Sonda żołądkowa');
ok('B-5 bez strat: bilans jak dawniej (wejście − diureza)',(()=>{let t=F.empty();t=F.add(t,'iv',500,{},1);t=F.add(t,'ur',200,{},2);const q=F.summary(t,3600000,80,1);return q.balance===300&&q.lo===0;})());
// rejestr leczenia
const idx=R('index.html');
ok('R-1 moduł „Rejestr leczenia” usunięty: brak treatment-ui.js (plik, index, SW)',!fs.existsSync(path.join(__dirname,'..','treatment-ui.js'))&&!/treatment-ui\.js/.test(idx)&&!/treatment-ui\.js/.test(R('sw.js')));
ok('R-2 pulpit: hasło bez rejestru, brak kafelka rejestru',/Kalkulatory, algorytmy, wydruk i wyniki w jednej przestrzeni\./.test(R('pulpit.js'))&&!/rejestr leczenia/i.test(R('pulpit.js').split('\n').filter(l=>!/^\s*\/\//.test(l)).join('\n'))&&!/data-go="treatment-log"/.test(R('pulpit.js')));
ok('R-3 stary odnośnik treatment-log → Pulpit (MOD_ALIAS); katalog źródeł bez modułu',/'treatment-log':\['dashboard',''\]/.test(R('shell.js'))&&!/treatment-log/.test(R('data/zrodla.js')));
ok('R-4 brak przycisków „→ rejestr” (Pompy, moduły kliniczne)',!/recordCalc/.test(R('mod/pompy/app.js'))&&/function transfer\(label,payload,enabled\)\{return '';\}/.test(R('clinical-ui.js')));
// napisy usunięte z całego projektu
const walk=(d,o=[])=>{for(const x of fs.readdirSync(d,{withFileTypes:true})){if(x.name==='.git'||x.name==='node_modules')continue;const p=path.join(d,x.name);if(x.isDirectory())walk(p,o);else if(/\.(js|html|md|json|css|cjs)$/.test(x.name))o.push(p);}return o;};
const all=walk(path.join(__dirname,'..')).filter(p=>!/fix25-(node\.test|puppeteer)\.js$/.test(p));
const hit=re=>all.filter(p=>re.test(fs.readFileSync(p,'utf8'))).map(p=>path.relative(path.join(__dirname,'..'),p));
ok('N-1 „Testy techniczne nie zastępują przeglądu klinicznego.” – nigdzie w projekcie',hit(/Testy techniczne nie zastępują przeglądu klinicznego/).length===0,hit(/Testy techniczne nie zastępują przeglądu klinicznego/));
ok('N-2 „Test techniczny, nie walidacja kliniczna; nie testowano na sprzęcie szpitalnym.” – nigdzie',hit(/nie testowano na sprzęcie szpitalnym/).length===0,hit(/nie testowano na sprzęcie szpitalnym/));
ok('N-3 „To nie lokalna tabela breakpointów – w Asystencie SOR nie ma offline tabeli EUCAST.” – nigdzie',hit(/nie ma offline tabeli EUCAST/).length===0,hit(/nie ma offline tabeli EUCAST/));
ok('N-4 nagłówek / stopka menu / O programie: tylko „wersja 5.2 (testowa) · 21.11.2026”',/<span id="ver">wersja 5\.2 \(testowa\) · 21\.11\.2026<\/span>/.test(idx)&&/Asystent lekarza SOR<br>wersja 5\.2 \(testowa\) · 21\.11\.2026/.test(idx)&&!/Narzędzie pomocnicze – niecertyfikowane/.test(idx)&&/textContent='wersja 5\.2 \(testowa\) · 21\.11\.2026'/.test(R('advanced.js'))&&/VERSION='5\.2 \(testowa\)',DATE='21\.11\.2026'/.test(R('about.js')));
ok('N-5 „Narzędzie pomocnicze – niecertyfikowane” zniknęło z nagłówka, O programie i nagłówka wydruku',!/Narzędzie pomocnicze – niecertyfikowane/.test(R('about.js'))&&!/Narzędzie pomocnicze – niecertyfikowane/.test(R('report.js'))&&!/Narzędzie pomocnicze – niecertyfikowane/.test(R('mods.js')));
ok('N-6 O programie: wpis fix25 jako pierwszy',/21\.11\.2026 – porządki i czytelność/.test(R('about.js'))&&R('about.js').indexOf('porządki i czytelność')<R('about.js').indexOf('heparyna UFH i KKCz'));
// słowniczek SpO₂
global.window={};global.document={};const G=fs.readFileSync(path.join(__dirname,'..','gloss.js'),'utf8');
const K=(G.match(/'SpO₂':'saturacja'/)||[]).length===1&&!/'SpO':/.test(G);
ok('G-1 słowniczek: klucz „SpO₂” (nie „SpO”), indeksy dolne nie rozbijają skrótu',K&&/₀-₉²³-\]\)'\);/.test(G));
// AI ukryte domyślnie, ustawienia działają
const AI=R('ai-ui.js');ok('A-1 Epikryza (AI): baner tylko gdy włączony w Ustawieniach (domyślnie ukryty)',/function banner\(\)\{if\(!shown\(\)\)return '';/.test(AI)&&/id="aiShow"/.test(AI));
// Antykoagulacja – kratka w nagłówku
const M2=R('mods2.js');ok('H-1 Antykoagulacja: headChk {vka:bleed, noac:nb}; pole formularza zostaje (zapis, wydruk)',/headChk:\{vka:'bleed',noac:'nb'\}/.test(M2)&&/chk\('bleed','krwawienie zagrażające życiu \/ pilny zabieg'\)/.test(M2)&&/chk\('nb','krwawienie zagrażające życiu \/ pilny zabieg'\)/.test(M2));
// AF – opis OAC bez rozbijania słowniczkiem
const CU=R('c-ui.js');ok('F-1 AF: sekcja kardiowersji w .af-big.nopl, OAC jako jeden czytelny napis',/af-big nopl/.test(CU)&&/skuteczna antykoagulacja ≥3 tyg\.<small>DOAK przyjmowany regularnie lub warfaryna \/ acenokumarol z INR ≥2<\/small>/.test(CU));
console.log(f?('FAILS: '+f+'/'+n):(n+'/'+n+' PASS'));process.exit(f?1:0);
