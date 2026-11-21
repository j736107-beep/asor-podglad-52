// fix27 (21.11.2026, t57u pkt 7): Zatrucia – leki psychiatryczne / kardiologiczne / substancje chemiczne (calc/toxB3.js, tox-b3-ui.js, wydruk calc/clin-print.js).
// Sprawdza: komplet substancji z listy lekarza, źródło przy KAŻDEJ dawce, arytmetykę dawek i pomp, progi EXTRIP, kryteria Huntera, ostrzeżenia bezpieczeństwa, wydruk tylko wypełnionych pól.
const T=require('../calc/toxB3.js');const CP=require('../calc/clin-print.js');const assert=require('assert');const fs=require('fs');const path=require('path');
let n=0,f=0;function t(name,fn){n++;try{fn();console.log('PASS',name);}catch(e){f++;console.log('FAIL',name,'—',e.message);}}
const J=x=>JSON.stringify(x);const P=(id,i)=>T.plan(id,i||{});
const ALL=['vpa','li','tca','opi','ven','ssri','quet','olan','cbz','ltg','ccb_dhp','ccb_nd','bb','acei','swarf','caustic','hc_ing','hc_inh','gas'];
const COMBOS=[{},{w:70},{w:70,qrs:130,shock:true,sbp:70,hr:35,coma:true,seiz:true,arr:true,mv:true,edema:true,hnh3:true,ph:7.0,vpa:1500,li:6,cbz:60,renal:true,bbt:'aten',inr:8,bleed:true,fire:true,lact:10,h2s:true,gast:'cl',sclon:true,temp:41.5,perf:true,drool:true,resp:true,spo2:85,amt:5000,glu:2.5},{w:90,bbt:'sot',renal:true,arr:true},{w:60,bbt:'prop',hr:40}];
t('Komplet substancji z listy t57u pkt 7 w trzech zakładkach',()=>{assert.deepStrictEqual(Object.keys(T.AG).sort(),ALL.slice().sort());
 assert.deepStrictEqual(T.list('psy').map(x=>x[0]),['vpa','li','tca','opi','ven','ssri','quet','olan','cbz','ltg']);assert.deepStrictEqual(T.list('card').map(x=>x[0]),['ccb_dhp','ccb_nd','bb','acei']);
 assert.deepStrictEqual(T.list('chem').map(x=>x[0]),['swarf','caustic','hc_ing','hc_inh','gas']);
 assert.ok(/Kret/.test(T.AG.caustic.n)&&/chlor/.test(T.AG.gas.n)&&/amoniak/.test(T.AG.gas.n)&&/Opipramol/.test(T.AG.opi.n));});
t('Każda dawka ma źródło istniejące w SRC; wszystkie klucze źródeł (plan, badania, EXTRIP) istnieją; RPL → /characteristic',()=>{let d=0;
 for(const id of ALL)for(const c of COMBOS){const p=P(id,c);for(const x of p.doses){d++;assert.ok(x.src&&x.src.length,id+' '+x.d);x.src.forEach(k=>assert.ok(T.SRC[k],id+' brak źródła '+k));}
  p.src.forEach(k=>assert.ok(T.SRC[k],id+' '+k));p.labs.forEach(l=>{assert.ok(l[2].length);l[2].forEach(k=>assert.ok(T.SRC[k],id+' lab '+k));});if(p.ex)p.ex.src.forEach(k=>assert.ok(T.SRC[k],k));}
 assert.ok(d>40,'dawek '+d);Object.entries(T.SRC).forEach(([k,s])=>{assert.ok(s.t&&s.t.length>10,k);if(/RPL \d+/.test(s.t))assert.ok(/medicinal-products\/\d+\/characteristic$/.test(s.u),k);});});
t('Pola formularza: każde pole substancji ma definicję; brak pól nieużywanych',()=>{const used=new Set();for(const id of ALL)T.AG[id].f.forEach(k=>{assert.ok(T.FIELDS[k],id+' '+k);used.add(k);});
 Object.keys(T.FIELDS).forEach(k=>assert.ok(used.has(k),'nieużywane '+k));});
t('Kontakt z toksykologiem Kraków 12 411 99 99 w każdym algorytmie; trzy etapy (rozpoznanie / leczenie wstępne / dalsze postępowanie z czasem badań)',()=>{for(const id of ALL){const p=P(id,{w:70});
 assert.ok(/12 411 99 99/.test(J(p.next)),id);assert.ok(p.rec.length&&p.init.length&&p.labs.length,id);p.labs.forEach(l=>assert.ok(l[0]&&l[1],id));assert.ok(p.ex&&p.ex.txt.length,id);}});
t('TLPD / opipramol: NaHCO₃ 8,4% 1–2 mmol/kg (70 kg = 70–140 ml), wlew 150 mmol w 1 l G5% 150 ml/h; tylko przy QRS >100 / arytmii / hipotensji',()=>{
 for(const id of ['tca','opi']){assert.ok(!J(P(id,{w:70,qrs:90}).doses).includes('Wodorowęglan'));const b=P(id,{w:70,qrs:120}).doses.find(x=>/Wodorowęglan/.test(x.d));
  assert.ok(/70–140 mmol = 70–140 ml 8,4%/.test(b.dose)&&/7,45–7,55/.test(b.dose));assert.ok(/150 ml NaHCO₃ 8,4% \(150 mmol\) w 1000 ml glukozy 5%.*150 ml\/h/.test(b.pump));assert.deepStrictEqual(b.src,['brucc','bicarb']);}
 assert.ok(/48 h/.test(J(P('opi',{}).next))&&/Dializa nieskuteczna/.test(J(P('opi',{}).ex)));assert.ok(/NIE jest zalecane/.test(J(P('tca',{}).ex)));assert.ok(/flumazenilu/.test(J(P('tca',{}).init)));});
t('Kwas walproinowy: L-karnityna 100 mg/kg, potem 50 mg/kg (maks. 3 g) co 8 h przy śpiączce / hiperamonemii; brak rejestracji w PL oznaczony',()=>{
 assert.ok(!P('vpa',{w:70}).doses.length);const c=P('vpa',{w:70,coma:true}).doses[0];assert.ok(/= 7 000 mg/.test(c.dose)&&/= 3 000 mg co 8 h/.test(c.dose),c.dose);
 assert.ok(/= 2 500 mg co 8 h/.test(P('vpa',{w:50,hnh3:true}).doses[0].dose));assert.ok(/NIE jest zarejestrowana w Polsce/.test(c.flag));assert.deepStrictEqual(c.src,['carn','convulex']);});
t('EXTRIP – kwas walproinowy: >1300 mg/l / obrzęk mózgu / wstrząs = zalecane; >900, wentylacja, hiperamonemia, pH ≤7,10 = sugerowane',()=>{const L=i=>P('vpa',i).ex.lvl;
 assert.strictEqual(L({vpa:1301}),'red');assert.strictEqual(L({edema:true}),'red');assert.strictEqual(L({shock:true}),'red');assert.strictEqual(L({vpa:950}),'orange');assert.strictEqual(L({vpa:900}),'');
 assert.strictEqual(L({ph:7.10}),'orange');assert.strictEqual(L({ph:7.11}),'');assert.strictEqual(L({mv:true}),'orange');assert.strictEqual(L({hnh3:true}),'orange');assert.ok(/50–100 mg\/l/.test(J(P('vpa',{}).ex)));});
t('EXTRIP – lit: nerki + Li >4,0, śpiączka, drgawki, arytmia = zalecane; Li >5,0 lub splątanie = sugerowane; węgiel nie wiąże litu',()=>{const L=i=>P('li',i).ex.lvl;
 assert.strictEqual(L({li:4.1,renal:true}),'red');assert.strictEqual(L({li:4.1}),'');assert.strictEqual(L({li:5.1}),'orange');assert.strictEqual(L({coma:true}),'red');assert.strictEqual(L({conf:true}),'orange');
 assert.ok(/<1,0 mmol\/l/.test(J(P('li',{}).ex))&&/min\. 6 h/.test(J(P('li',{}).ex)));assert.ok(/NIE wiąże litu/.test(J(P('li',{}).init)));assert.ok(/odbicia/.test(J(P('li',{}).labs)));});
t('EXTRIP – karbamazepina (drgawki / arytmia = zalecane; śpiączka = sugerowane; stop <10 mg/l); β-adrenolityki (propranolol – nie; atenolol/sotalol + nerki + wstrząs – sugerowane)',()=>{
 assert.strictEqual(P('cbz',{seiz:true}).ex.lvl,'red');assert.strictEqual(P('cbz',{coma:true}).ex.lvl,'orange');assert.ok(/<10 mg\/l/.test(J(P('cbz',{}).ex)));assert.ok(/2\.–3\. dobie/.test(J(P('cbz',{}).next)));
 assert.ok(/NIE jest zalecane/.test(J(P('bb',{bbt:'prop',shock:true,renal:true}).ex)));assert.strictEqual(P('bb',{bbt:'aten',renal:true,shock:true}).ex.lvl,'orange');assert.strictEqual(P('bb',{bbt:'aten',shock:true}).ex.lvl,'');
 assert.strictEqual(P('bb',{bbt:'sot',renal:true,arr:true}).ex.lvl,'orange');assert.ok(/Wybierz rodzaj/.test(J(P('bb',{}).ex)));});
t('Antagoniści wapnia: wapń (ChPL 5 ml; St-Onge ≈15–30 ml WZF, ≤1 mmol/min, wlew 0,3–0,6 ml/kg/h), HIET 1 j./kg + 1–10 j./kg/h z pompą, noradrenalina 80 µg/ml, lipidy maks. 10 ml/kg',()=>{
 const p=P('ccb_nd',{w:70,sbp:70});const ds=p.doses.map(x=>x.d).join('|');assert.ok(/Calcium chloratum/.test(ds)&&/HIET/.test(ds)&&/Noradrenalina/.test(ds)&&/Emulsja/.test(ds));
 const ca=p.doses.find(x=>/Calcium/.test(x.d));assert.ok(/start 5 ml \(2,3 mmol\)/.test(ca.dose)&&/15–30 ml WZF/.test(ca.dose)&&/≤1 mmol\/min/.test(ca.dose));assert.ok(/= 21–42 ml\/h WZF/.test(ca.pump),ca.pump);assert.ok(/PRZELICZENIE/.test(ca.dose)&&ca.flag);
 const ins=p.doses.find(x=>/HIET/.test(x.d));assert.ok(/= 70 j\., potem wlew 1 j\.\/kg\/h = 70 j\.\/h/.test(ins.dose)&&/700 j\.\/h/.test(ins.dose));assert.ok(/Actrapid 50 j\. \(0,5 ml\) \+ NaCl 0,9% 49,5 ml; 1 j\.\/kg\/h = 70 ml\/h/.test(ins.pump));
 assert.ok(/Actrapid 500 j\. \(5 ml\) \+ NaCl 0,9% 45 ml; 1 j\.\/kg\/h = 7 ml\/h, 10 j\.\/kg\/h = 70 ml\/h – POZA ChPL/.test(ins.pump));assert.ok(/K utrzymywać >3 mmol\/l|potas utrzymywać >3 mmol\/l/.test(ins.prep));
 const no=p.doses.find(x=>/Noradrenalina/.test(x.d));assert.ok(/= 2,6 ml\/h/.test(no.dose),no.dose);const li=p.doses.find(x=>/Emulsja/.test(x.d));assert.ok(/= 105 ml/.test(li.dose)&&/= 1 050 ml\/h/.test(li.dose)&&/= 700 ml/.test(li.dose)&&/34 min/.test(li.pump));
 assert.ok(!P('ccb_dhp',{w:70,sbp:120,hr:80}).doses.length);assert.ok(/24 h/.test(J(p.init)));});
t('β-adrenolityki: atropina 1–2 mg, glukagon 5–10 mg + 1–10 mg/h (fiolki 1 mg, wlew poza ChPL), dalej jak antagoniści wapnia',()=>{const p=P('bb',{w:70,hr:38,sbp:75,bbt:'inny'});const ds=p.doses.map(x=>x.d);
 assert.ok(ds[0]==='Atropina'&&/1–2 mg/.test(p.doses[0].dose));const g=p.doses.find(x=>/Glukagon/.test(x.d));assert.ok(/5–10 mg/.test(g.dose)&&/1–10 mg\/h/.test(g.dose)&&/1–10 ml\/h/.test(g.pump)&&/poza ChPL/.test(g.flag));assert.ok(ds.some(x=>/HIET/.test(x)));});
t('Zespół serotoninowy (kryteria Huntera) → cyproheptadyna 12 mg + 2 mg co 2 h (Peritol 4 mg; rozbieżność z ChPL maks. 20 mg/d); >41,1 °C → intubacja',()=>{const H=T.hunter;
 assert.ok(H({sclon:true}).pos);assert.ok(!H({iclon:true}).pos);assert.ok(H({iclon:true,diaph:true}).pos);assert.ok(H({oclon:true,agit:true}).pos);assert.ok(H({trem:true,hrefl:true}).pos);assert.ok(H({hton:true,temp:38.5,oclon:true}).pos);assert.ok(!H({hton:true,temp:38}).pos);
 assert.ok(!P('ssri',{}).doses.length);const p=P('ven',{sclon:true,temp:41.5});const c=p.doses[0];assert.ok(/12 mg \(3 tabl\.\)/.test(c.dose)&&/2 mg \(½ tabl\.\) co 2 h/.test(c.dose)&&/maks\. 20 mg\/dobę/.test(c.flag));
 assert.ok(/intubacja/.test(J(p.warn)));assert.ok(/≥3 g/.test(J(P('ven',{amt:3000}).warn)));assert.ok(/Hipoglikemia/.test(J(P('ven',{glu:3}).warn)));});
t('Bezpieczeństwo: kwetiapina / olanzapina – NIE adrenalina, NIE dopamina; żrące – bez wymiotów, płukania, neutralizacji, zgłębnika; endoskopia 3–6 h / TK',()=>{
 for(const id of ['quet','olan'])assert.ok(/NIE adrenalina, NIE dopamina/.test(J(P(id,{}).init)),id);assert.ok(/β-mimetyki/.test(J(P('olan',{}).init)));assert.ok(/PRAWIDŁOWE EKG/.test(J(P('quet',{}).next)));
 const c=J(P('caustic',{}));assert.ok(/NIE prowokować wymiotów, NIE płukać żołądka, NIE neutralizować/.test(c)&&/zgłębnika/.test(c)&&/3–6 h/.test(c)&&/TK/.test(c));assert.ok(!P('caustic',{w:70,perf:true}).doses.length);});
t('Węglowodory: połknięcie – bez wymiotów, RTG klatki; wdychanie – katecholaminy ostrożnie, EKG; gazy – tlen, nebulizacja NaHCO₃ bez dawki, CO / H₂S / cyjanki',()=>{
 const a=J(P('hc_ing',{}));assert.ok(/NIE prowokować wymiotów/.test(a)&&/RTG klatki piersiowej/.test(a));const b=J(P('hc_inh',{}));assert.ok(/Katecholaminy \(adrenalina\) – tylko z dużą ostrożnością/.test(b)&&/MetHb/.test(b));
 const g=P('gas',{gast:'cl'});assert.ok(/bez ustalonej dawki/.test(J(g.init))&&!g.doses.length);const f=P('gas',{w:70,fire:true,coma:true});assert.ok(/100% tlen/.test(J(f.init)));const hx=f.doses[0];assert.ok(/5 g i\.v\. w 15 min/.test(hx.dose)&&/800 ml\/h/.test(hx.pump)&&/maks\. łącznie 10 g/.test(hx.dose));
 assert.ok(/Siarkowodór/.test(J(P('gas',{h2s:true}).init)));});
t('Superwarfaryny: INR przy przyjęciu i 48–72 h; witamina K1 10–20 mg i.v. / 10 mg w 100 ml w 20–30 min, maks. 40 mg/d (ChPL), PT po 3 h; PCC → moduł Antykoagulacja',()=>{
 assert.ok(!P('swarf',{inr:1.1}).doses.length);const p=P('swarf',{bleed:true});const k=p.doses[0];assert.ok(/10–20 mg powoli i\.v\./.test(k.dose)&&/maks\. 40 mg\/dobę/.test(k.dose)&&/10 mg \(1 ml\) w 100 ml NaCl 0,9% przez 20–30 min/.test(k.prep)&&/200–300 ml\/h/.test(k.pump));
 assert.ok(/48–72 h/.test(J(p.labs))&&/3 h po witaminie K1/.test(J(p.labs)));assert.ok(/Antykoagulacja → Warfaryna/.test(J(p.init)));assert.ok(P('swarf',{inr:3}).doses.length===1);});
t('Bez masy ciała: dawki zależne od masy nie są wyliczane (ostrzeżenie), bez liczb ml/h',()=>{const p=P('tca',{qrs:130});assert.ok(/Brak masy ciała/.test(J(p.warn)));const b=p.doses.find(x=>/Wodorowęglan/.test(x.d));assert.ok(/podaj masę ciała/.test(b.dose));
 const c=P('ccb_nd',{shock:true});assert.ok(/Podaj masę ciała/.test(c.doses.find(x=>/HIET/.test(x.d)).pump));});
t('Rozbieżności ChPL ↔ wytyczne jawnie (wymioty / płukanie w ChPL Pramolan, Amizepin, Convulex, Lithium)',()=>{for(const id of ['opi','cbz','vpa','li'])assert.ok(P(id,{}).disc.length,id);});
t('Wydruk: tylko wypełnione pola, dawki tylko z masą ciała, wnioski z EXTRIP i toksykologiem; nietknięta zakładka – nic',()=>{
 const mk=v=>{const T={};for(const k in v)T[k]={touched:Object.keys(v[k]).length,g:x=>v[k][x]};return T;};
 const r=CP.tox({P:{w:70},tabs:mk({tpsy:{ag:'vpa',vpa:1400,coma:true}}),T3:T});assert.ok(/ZATRUCIE – KWAS WALPROINOWY/.test(r.text)&&/Stężenie kwasu walproinowego 1400 mg\/l/.test(r.text)&&/L-karnityna i\.v\.: 100 mg\/kg i\.v\. jednorazowo = 7 000 mg/.test(r.text),r.text);
 assert.ok(/EXTRIP: ECTR ZALECANE/.test(r.text)&&/12 411 99 99/.test(r.text)&&r.dose);assert.ok(!/QRS|Tętno|Glikemia/.test(r.text.split('Kontrole')[0]),'niewypełnione pola w wydruku');
 const r2=CP.tox({P:{},tabs:mk({tcard:{ag:'ccb_dhp',shock:true}}),T3:T});assert.ok(/wpisz masę ciała/.test(r2.text)&&!r2.dose&&!/ml\/h/.test(r2.text));
 assert.strictEqual(CP.tox({P:{w:70},tabs:{tchem:{touched:0,g:()=>undefined}},T3:T}).text,'');});
t('Integracja: index.html ładuje silnik i UI przed clinical-ui.js; SW asor-v52-fix27 z nowymi plikami; zakładki w module Zatrucia; O programie',()=>{const R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
 const h=R('index.html');assert.ok(h.indexOf('calc/toxB3.js')>0&&h.indexOf('tox-b3-ui.js')<h.indexOf('clinical-ui.js'));const sw=R('sw.js');assert.ok(/asor-v52-fix(2[7-9]|[3-9]\d)/.test(sw)&&/"calc\/toxB3\.js"/.test(sw)&&/"tox-b3-ui\.js"/.test(sw));
 assert.ok(/SORT3\.tabs/.test(R('clinical-ui.js')));assert.ok(/Zatrucia: leki psychiatryczne[^']*SW asor-v52-fix27/.test(R('about.js'))||/fix27/.test(R('README.md')));
 const ui=R('tox-b3-ui.js');['tpsy','tcard','tchem'].forEach(id=>assert.ok(ui.includes("id:'"+id+"'")));});
console.log((n-f)+'/'+n+' PASS'+(f?' – FAIL '+f:''));process.exit(f?1:0);
