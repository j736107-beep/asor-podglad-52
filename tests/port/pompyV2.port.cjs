// PORT z /workspace/asystent-sor-v4.2/tests/pompyV2.cjs (11.11.2026): część silnikowa + bramki app.js; bez SW (nazwa cache 5.1) i bez przeglądarki.
// Pompy SOR v2 (26.10.2026): receptury 20/50 ml, dawka <-> ml/h, korekta przepływu, heparyna (bolus, wlew, nomogram Raschke), standardy lokalne.
// Wartości oczekiwane policzone ręcznie (rachunek w nazwie testu). Uruchom: node tests/pompyV2.cjs  (POMPY_SHOTS=1 – zrzuty do /workspace/promo/pompy_shots/)
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const base=path.resolve(__dirname,'../..'),rd=f=>fs.readFileSync(path.join(base,f),'utf8');
const E=require(path.join(base,'mod/pompy/engine.js')),DB=JSON.parse(rd('mod/pompy/drugs.json')),D=id=>DB.drugs.find(d=>d.id===id);
const JS=(()=>{const w={};new Function('window',rd('mod/pompy/drugs.js'))(w);return w.DRUGS_DB;})();
let n=0;const FAIL=[];const test=(name,fn)=>{fn();n++;console.log('OK',name);};
const near=(a,b,e=1e-9)=>assert.ok(a!=null&&Math.abs(a-b)<=e,a+' != '+b);
const ml=(id,syr,u,dose,w)=>{const d=D(id);return E.toMlh(d,E.recipe(d,syr).conc,u,dose,w);};
const LIST=['adrenalina','noradrenalina_c80','dobutamina','levosimendan','dopamina','noradrenalina_c','noradrenalina_p','nitrogliceryna','heparyna','amiodaron','midazolam','morfina','pantoprazol','urapidyl','salbutamol','propofol','insulina','furosemid','oktreotyd'];
const CHPL=['dobutamina','heparyna','noradrenalina_c','propofol','urapidyl'];
// ---------- dane ----------
test('drugs.js == drugs.json',()=>assert.deepStrictEqual(JS,DB));
test('19 receptur: 17 leków z listy (noradrenalina w 3 wariantach: C 40, C 80, P 20 µg/ml; levosimendan i oktreotyd od 11.11.2026)',()=>assert.deepStrictEqual(DB.drugs.map(d=>d.id).sort(),LIST.slice().sort()));
test('Zgodne z ChPL: dobutamina, heparyna, noradrenalina C 40 µg/ml, propofol, urapidyl; pozostałe 14 – standard lokalny',()=>{assert.deepStrictEqual(DB.drugs.filter(d=>d.status==='chpl').map(d=>d.id).sort(),CHPL.slice().sort());for(const d of DB.drugs)assert.ok(['chpl','lokalny','zatwierdzony'].includes(d.status));});
test('Każda receptura: link https do ChPL (RPL lub EMA), preparat, ampułka, dostęp, monitorowanie, uzasadnienie, źródła istnieją',()=>{for(const d of DB.drugs){assert.match(d.url,/^https:\/\/(rejestry\.ezdrowie\.gov\.pl\/api\/rpl\/medicinal-products\/\d+\/characteristic|www\.ema\.europa\.eu\/)/,d.id);assert.ok(d.product&&d.amp.label&&d.access&&d.monitor&&d.why.length>30,d.id);for(const s of d.src)assert.ok(DB.sources[s],d.id+' '+s);}});
test('Każda jednostka dawki ma opis zakresu (tekst ze źródła)',()=>{for(const d of DB.drugs)for(const u of d.units){assert.ok(u.text&&u.text.length>10,d.id+u.u);E.perHourFactor(u.u,d.amp.unit);}});
test('Strzykawki: 20 i 50 ml dla wszystkich poza pantoprazolem (tylko 20 ml – stabilność 12 h)',()=>{for(const d of DB.drugs)assert.deepStrictEqual(Object.keys(d.rec).sort(),d.id==='pantoprazol'?['20']:['20','50'],d.id);});
test('Amiodaron: wyłącznie glukoza 5% (nigdy NaCl), standard lokalny, dostęp centralny',()=>{const a=D('amiodaron');assert.deepStrictEqual(a.diluents,['Glukoza 5%']);assert.equal(a.status,'lokalny');assert.match(a.access,/CENTRALNY/);});
test('Rozcieńczane mają ≥1 rozcieńczalnik, nierozcieńczane – żadnego',()=>{for(const d of DB.drugs)assert.ok(d.diluted?d.diluents.length>=1:d.diluents.length===0,d.id);});
test('Heparyna: nomogram ze źródłem (Raschke, DOI), insulina – korekta wg glikemii DO DECYZJI LEKARZA',()=>{assert.match(DB.sources.RASCHKE.url,/doi\.org/);assert.match(D('insulina').glyc,/DO DECYZJI LEKARZA/);});
// ---------- receptury 20/50 ml (stałe stężenie) ----------
const REC={adrenalina:[0.1,{20:[2,2,18],50:[5,5,45]}],noradrenalina_c80:[0.08,{20:[1.6,0.4,18.4],50:[4,1,46]}],dobutamina:[5,{20:[100,0.4,12],50:[250,1,30]}],noradrenalina_c:[0.04,{20:[0.8,0.2,19.2],50:[2,0.5,48]}],noradrenalina_p:[0.02,{20:[0.4,0.1,19.6],50:[1,0.25,49]}],
 nitrogliceryna:[1,{20:[20,2,0],50:[50,5,0]}],heparyna:[500,{20:[10000,0.4,18],50:[25000,1,45]}],amiodaron:[6,{20:[120,0.8,17.6],50:[300,2,44]}],midazolam:[1,{20:[20,4,16],50:[50,10,40]}],
 morfina:[1,{20:[20,2,18],50:[50,5,45]}],pantoprazol:[4,{20:[80,2,0]}],urapidyl:[2,{20:[40,1.6,12],50:[100,4,30]}],salbutamol:[0.1,{20:[2,4,16],50:[5,10,40]}],propofol:[10,{20:[200,1,0],50:[500,2.5,0]}],insulina:[1,{20:[20,0.02,19.8],50:[50,0.05,49.5]}],furosemid:[10,{20:[200,10,0],50:[500,25,0]}]};
for(const [id,[c,m]] of Object.entries(REC))for(const [s,[amt,amps,dil]] of Object.entries(m))test(`Receptura ${id} ${s} ml: ${amt} ${D(id).amp.unit}, ${amps} amp./fiol., +${dil} ml → ${c}/ml`,()=>{const r=E.recipe(D(id),+s);near(r.amount,amt);near(r.amps,amps,1e-6);near(r.diluent,dil,1e-6);near(r.conc,c);near(r.drugVol+r.diluent,+s,1e-6);});
test('Dopamina 4% (200 mg/5 ml): 20 ml = 1,25 ml (50 mg, 2,5 mg/ml), 50 ml = 3,75 ml (150 mg, 3 mg/ml) – oba w zakresie ChPL 0,4–3,2 mg/ml',()=>{const a=E.recipe(D('dopamina'),20),b=E.recipe(D('dopamina'),50);near(a.conc,2.5);near(a.amps,0.25);near(b.conc,3);near(b.amps,0.75);assert.ok(b.conc<=3.2&&a.conc>=0.4);});
test('Ta sama receptura przy zmianie strzykawki zachowuje stężenie (wszystkie poza dopaminą)',()=>{for(const d of DB.drugs){if(d.id==='dopamina'||!d.rec[50])continue;near(E.recipe(d,20).conc,E.recipe(d,50).conc,1e-12);}});
test('Brak receptury 50 ml pantoprazolu → błąd',()=>assert.ok(E.recipe(D('pantoprazol'),50).error));
// ---------- dawka -> ml/h (ręcznie) ----------
const CASES=[
 ['adrenalina',50,'ug/kg/min',0.05,80,2.4,'0,05×80=4 µg/min=240 µg/h /100 µg/ml'],['adrenalina',20,'ug/min',10,0,6,'600 µg/h /100'],['noradrenalina_p',50,'ug/kg/min',0.05,70,10.5,'210 µg/h /20 µg/ml (ChPL Levonor)'],['noradrenalina_c80',50,'ug/kg/min',0.05,70,2.625,'210 µg/h /80'],
 ['dobutamina',50,'ug/kg/min',5,70,4.2,'5×70×60=21 mg/h /5 (tabela ChPL)'],['dobutamina',20,'ug/kg/min',10,90,10.8,'54 mg/h /5'],
 ['dopamina',50,'ug/kg/min',5,80,8,'24 mg/h /3'],['dopamina',20,'ug/kg/min',5,80,9.6,'24 mg/h /2,5'],
 ['noradrenalina_c',50,'ug/kg/min',0.1,80,12,'480 µg/h /40'],['noradrenalina_c',20,'mg/h',0.4,0,10,'ChPL: 0,4 mg/h = 10 ml/h'],['noradrenalina_c',50,'mg/h',0.8,0,20,'ChPL 20 ml/h'],
 ['noradrenalina_p',50,'ug/kg/min',0.1,80,24,'480 µg/h /20'],
 ['nitrogliceryna',50,'mg/h',2,0,2,'2 mg/h /1'],['nitrogliceryna',20,'ug/min',50,0,3,'3 mg/h /1'],
 ['heparyna',50,'j/kg/h',18,80,2.88,'1440 j/h /500'],['heparyna',20,'j/h',1000,0,2,'1000/500'],
 ['amiodaron',50,'mg/h',30,0,5,'30/6'],['amiodaron',20,'mg/kg/d',15,80,1200/24/6,'1200 mg/d=50 mg/h /6'],
 ['midazolam',50,'mg/kg/h',0.1,70,7,'7 mg/h /1'],['morfina',20,'mg/h',2,0,2,'2/1'],['pantoprazol',20,'mg/h',8,0,2,'8/4'],
 ['urapidyl',50,'mg/h',9,0,4.5,'9/2'],['salbutamol',50,'ug/min',5,0,3,'300 µg/h /100'],['salbutamol',20,'ug/min',20,0,12,'1200/100'],
 ['propofol',50,'mg/kg/h',2,75,15,'150 mg/h /10'],['insulina',50,'j/kg/h',0.1,70,7,'7 j/h /1'],['insulina',20,'j/h',5,0,5,'5/1'],['furosemid',50,'mg/h',20,0,2,'20/10']];
for(const [id,s,u,dose,w,exp,why] of CASES)test(`${id} ${s} ml: ${dose} ${u}${w?' × '+w+' kg':''} → ${+exp.toFixed(4)} ml/h (${why}); odwrotnie → ${dose}`,()=>{const d=D(id),c=E.recipe(d,s).conc;const m=E.toMlh(d,c,u,dose,w);near(m,exp,1e-9);near(E.fromMlh(d,c,u,m,w),dose,1e-12);});
test('Dawka na godzinę (wynik 2): nor 12 ml/h × 40 µg/ml = 0,48 mg/h; heparyna 2,88 ml/h = 1440 j./h; NTG 3 ml/h = 3 mg/h',()=>{near(E.perHour(0.04,12),0.48);near(E.perHour(500,2.88),1440);near(E.perHour(1,3),3);});
test('Round-trip dawka→ml/h→dawka i ml/h→dawka→ml/h: wszystkie leki × strzykawki × jednostki × 200 losowych wartości (błąd < 1e-9 względnie)',()=>{let k=0,seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(const d of DB.drugs)for(const s of Object.keys(d.rec))for(const u of d.units){const c=E.recipe(d,+s).conc;for(let i=0;i<200;i++){const w=30+rnd()*200,x=rnd()*50;const m=E.toMlh(d,c,u.u,x,w),b=E.fromMlh(d,c,u.u,m,w);assert.ok(Math.abs(b-x)<=1e-9*Math.max(1,x));const m2=E.toMlh(d,c,u.u,E.fromMlh(d,c,u.u,x,w),w);assert.ok(Math.abs(m2-x)<=1e-9*Math.max(1,x));k++;}}assert.ok(k>5000);});
test('Spójność jednostek: ta sama pompa – 0,1 µg/kg/min × 80 kg = 0,48 mg/h (nor C, oba wejścia dają 12 ml/h)',()=>near(ml('noradrenalina_c',50,'ug/kg/min',0.1,80),ml('noradrenalina_c',50,'mg/h',0.48,0)));
test('Dawka /kg bez masy → brak wyniku (null); ujemna dawka → null',()=>{assert.equal(ml('propofol',50,'mg/kg/h',2,NaN),null);assert.equal(ml('propofol',50,'mg/kg/h',-1,70),null);});
test('Mieszanie jednostek j. i mg → wyjątek',()=>{assert.throws(()=>E.perHourFactor('j/h','mg'));assert.throws(()=>E.perHourFactor('mg/h','j'));});
// ---------- zakresy / maksima ----------
test('Ostrzeżenia: nor P 0,11 µg/kg/min > 0,1 → ostrzeżenie (nie blokada); nor C 0,5 µg/kg/min – brak max w ChPL (bez flagi)',()=>{{const a=E.assess(D('noradrenalina_p'),'ug/kg/min',0.11,0);assert.ok(a.out&&!a.overMax);}assert.ok(!E.assess(D('noradrenalina_p'),'ug/kg/min',0.1,0).out);assert.ok(!E.assess(D('noradrenalina_c'),'ug/kg/min',0.5,0).out);});
test('Adrenalina 0,6 → poza zakresem (hi 0,5), 1,1 → powyżej max 1,0; dobutamina 41 → max; propofol 4,1 → max, 0,2 → poniżej',()=>{let a=E.assess(D('adrenalina'),'ug/kg/min',0.6,0);assert.ok(a.out&&!a.overMax);assert.ok(E.assess(D('adrenalina'),'ug/kg/min',1.1,0).overMax);assert.ok(E.assess(D('dobutamina'),'ug/kg/min',41,0).overMax);assert.ok(E.assess(D('propofol'),'mg/kg/h',4.1,0).overMax);assert.deepStrictEqual(E.assess(D('propofol'),'mg/kg/h',0.2,0).flags,['lo']);});
test('Amiodaron: 51 mg/h > 50 mg/h (1200 mg/24 h) i maks. dobowe; 30 mg/h – w zakresie',()=>{const a=E.assess(D('amiodaron'),'mg/h',51,51);assert.ok(a.overMax&&a.flags.includes('maxD'));assert.ok(!E.assess(D('amiodaron'),'mg/h',30,30).out);});
test('Amiodaron mg/kg/24 h: 20 mg/kg/d × 70 kg = 1400 mg/d > 1200 → maks. dobowe',()=>{const d=D('amiodaron'),c=6,m=E.toMlh(d,c,'mg/kg/d',20,70);near(E.perHour(c,m)*24,1400,1e-9);assert.ok(E.assess(d,'mg/kg/d',20,E.perHour(c,m)).flags.includes('maxD'));});
test('NTG 11 mg/h > 10 mg/h; 170 µg/min > 166,7 (=10 mg/h); urapidyl 130 mg/h > 120 (2 mg/min); furosemid 250 mg/h > 240 (4 mg/min), 70 mg/h → 1680 mg/d > 1500',()=>{assert.ok(E.assess(D('nitrogliceryna'),'mg/h',11,11).overMax);assert.ok(E.assess(D('nitrogliceryna'),'ug/min',170,10.2).overMax);assert.ok(E.assess(D('urapidyl'),'mg/h',130,130).overMax);assert.ok(E.assess(D('furosemid'),'mg/h',250,250).flags.includes('maxH'));assert.ok(E.assess(D('furosemid'),'mg/h',70,70).flags.includes('maxD'));});
test('Pantoprazol 8 mg/h – w zakresie ESGE; 20 ml starcza na 10 h (≤12 h stabilności)',()=>{assert.ok(!E.assess(D('pantoprazol'),'mg/h',8,8).out);near(20/ml('pantoprazol',20,'mg/h',8,0),10);});
// ---------- korekta przepływu ----------
test('Korekta: nor C 12 ml/h (0,1 µg/kg/min, 80 kg) +0,05 → 0,15 µg/kg/min = 18 ml/h',()=>{const r=E.adjust(D('noradrenalina_c'),0.04,'ug/kg/min',80,12,'abs',0.05);near(r.newDose,0.15);near(r.newMlh,18);near(r.deltaMlh,6);});
test('Korekta: −50% → 6 ml/h i 0,05 µg/kg/min; +3 ml/h → 15 ml/h = 0,125 µg/kg/min',()=>{let r=E.adjust(D('noradrenalina_c'),0.04,'ug/kg/min',80,12,'pct',-50);near(r.newMlh,6);near(r.newDose,0.05);r=E.adjust(D('noradrenalina_c'),0.04,'ug/kg/min',80,12,'mlh',3);near(r.newMlh,15);near(r.newDose,0.125);});
test('Korekta: urapidyl 4,5 ml/h (9 mg/h) −3 mg/h → 6 mg/h = 3 ml/h; zmiana poniżej zera → błąd',()=>{const r=E.adjust(D('urapidyl'),2,'mg/h',1,4.5,'abs',-3);near(r.newMlh,3);assert.ok(E.adjust(D('urapidyl'),2,'mg/h',1,4.5,'abs',-10).error);});
// ---------- heparyna ----------
test('Heparyna bolus Raschke 80 j./kg × 80 kg = 6400 j. = 1,28 ml fiolki 5000 j./ml',()=>{const b=E.hepBolus(80,80,5000);near(b.units,6400);near(b.mlVial,1.28);});
test('Heparyna bolus ChPL 50 j./kg × 70 = 3500 j. = 0,7 ml; ESC 60 j./kg × 100 kg = 6000 → limit 5000 j. = 1 ml',()=>{near(E.hepBolus(70,50,5000).units,3500);near(E.hepBolus(70,50,5000).mlVial,0.7);const b=E.hepBolus(100,60,5000,5000);near(b.units,5000);assert.ok(b.capped);near(b.mlVial,1);});
test('Heparyna wlew 18 j./kg/h × 80 kg = 1440 j./h = 2,88 ml/h (500 j./ml)',()=>near(ml('heparyna',50,'j/kg/h',18,80),2.88));
const RAS=[[30,80,22,3.52,0],[34.9,80,22,3.52,0],[35,40,20,3.2,0],[40,40,20,3.2,0],[45,40,20,3.2,0],[45.5,0,18,2.88,0],[60,0,18,2.88,0],[70,0,18,2.88,0],[70.5,0,16,2.56,0],[90,0,16,2.56,0],[90.1,0,15,2.4,1],[120,0,15,2.4,1]];
for(const [a,bo,nu,nm,stop] of RAS)test(`Nomogram Raschke: APTT ${a} s przy 18 j./kg/h, 80 kg → bolus ${bo} j./kg (${bo*80} j.), wlew ${nu} j./kg/h = ${nu*80} j./h = ${nm} ml/h${stop?', stop 1 h':''}`,()=>{const r=E.raschke(a,18,80,500);assert.equal(r.bolusUkg,bo);near(r.bolusU,bo*80);near(r.newUkgh,nu);near(r.newUh,nu*80);near(r.newMlh,nm);assert.equal(r.stopH,stop);assert.equal(r.nextCheckH,6);});
test('Nomogram: brak danych → null; wlew nie schodzi poniżej 0',()=>{assert.equal(E.raschke(NaN,18,80,500),null);assert.equal(E.raschke(100,2,80,500).newUkgh,0);});
// ---------- statyczne: bramki w app.js ----------
const APP=rd('mod/pompy/app.js');
test('app.js: transfer/zapis tylko po vgate (zatwierdzenie lokalne, rozcieńczalnik, amiodaron bez NaCl, brak przekroczenia max)',()=>{assert.match(APP,/recordCalc'\)\.onclick=function\(\)\{try\{vgate\(\)/);assert.match(APP,/savePump'\)\.onclick=function\(\)\{try\{vgate\(\)/);assert.match(APP,/if\(!approved\(d\)\)throw/);assert.match(APP,/Amiodaron – wyłącznie glukoza 5%/);assert.match(APP,/Wybierz rozcieńczalnik/);});
test('app.js: brak domyślnego NaCl 0,9% w kodzie; zatwierdzenia w localStorage sor_pompy_zatw_v2',()=>{assert.ok(!/NaCl 0,9%/.test(APP));assert.match(APP,/sor_pompy_zatw_v2/);});
console.log('\nPASS: '+n+' testów (port pompyV2).');
