// FAZA 1 audytu (11.11.2026): niezależne, podwójne sprawdzenie silników dawek.
// Każda wartość oczekiwana jest liczona DWA razy: (1) ręcznie (literał w tabeli, rachunek w komentarzu) i (2) własnym, niezależnym wzorem w teście
// (bez wywołań kodu aplikacji). Wynik silnika aplikacji musi zgadzać się z oboma. Uruchom: node tests/silniki-niezalezne-node.test.js
'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const R=path.join(__dirname,'..'),rq=f=>require(path.join(R,f));
let n=0,fail=0;const t=(name,fn)=>{n++;try{fn();}catch(e){fail++;console.log('FAIL',name,'::',e.message);}};
const near=(a,b,eps=1e-6,msg='')=>assert.ok(a!=null&&isFinite(a)&&Math.abs(a-b)<=eps*Math.max(1,Math.abs(b)),msg+' '+a+' != '+b);

// ======================= POMPY SOR (mod/pompy) =======================
const E=rq('mod/pompy/engine.js'),DB=JSON.parse(fs.readFileSync(path.join(R,'mod/pompy/drugs.json'),'utf8')),D=id=>DB.drugs.find(d=>d.id===id);
// niezależne przeliczniki: ilość leku w jednostce ampułki na 1 h dla dawki 1 [unit] (masa 1 kg)
const MASSUG={ug:1,mg:1000,g:1e6};
function perHourIndep(unit,cu){const [amt,...rest]=unit.split('/');const time=rest[rest.length-1];const th={min:60,h:1,d:1/24}[time];
 if(amt==='j'){assert.equal(cu,'j');return th;}return th*MASSUG[amt]/MASSUG[cu];}
function concIndep(d,syr){const amount=d.rec[String(syr)],ampC=d.amp.content/d.amp.volume,drugMl=amount/ampC;return amount/(d.diluted?syr:drugMl);}
function mlhIndep(d,syr,unit,dose,w){const kg=unit.includes('/kg/')?w:1;return dose*kg*perHourIndep(unit,d.amp.unit)/concIndep(d,syr);}
// (1) ręcznie: strzykawka 50 ml (pantoprazol 20 ml), 70 kg
const HAND=[
 ['adrenalina',50,'ug/kg/min',0.1,4.2],      // 5 mg/50 ml = 100 µg/ml; 0,1×70 = 7 µg/min = 420 µg/h → 4,2 ml/h
 ['dobutamina',50,'ug/kg/min',5,4.2],        // 250 mg/50 ml = 5 mg/ml; 5×70 = 350 µg/min = 21 mg/h → 4,2
 ['dopamina',50,'ug/kg/min',5,7],
 ['oktreotyd',50,'ug/h',25,2.5],            // 500 µg/50 ml = 10 µg/ml; 25 µg/h → 2,5 ml/h (decyzja lekarza 11.11.2026)
 ['oktreotyd',20,'ug/h',50,5],              // 200 µg/20 ml = 10 µg/ml; 50 µg/h (MAKS.) → 5 ml/h
 ['levosimendan',50,'ug/kg/min',0.1,8.4],  // 2,5 mg/50 ml = 0,05 mg/ml = 50 µg/ml; 7 µg/min = 420 µg/h → 8,4 (ChPL tab. 0,05 mg/ml: 70 kg → 8)
 ['levosimendan',20,'ug/kg/min',0.2,16.8], // 1 mg/20 ml = 50 µg/ml; 14 µg/min = 840 µg/h → 16,8 (ChPL: 17)            // 150 mg/50 ml = 3 mg/ml; 21 mg/h → 7
 ['noradrenalina_c80',50,'ug/kg/min',0.1,5.25],// 4 mg/50 = 80 µg/ml; 7 µg/min = 420 µg/h → 5,25
 ['noradrenalina_c',50,'ug/kg/min',0.1,10.5],// 2 mg/50 = 40 µg/ml → 10,5
 ['noradrenalina_p',50,'ug/kg/min',0.1,21],  // 1 mg/50 = 20 µg/ml → 21
 ['nitrogliceryna',50,'mg/h',2,2],           // 50 mg/50 ml nierozc. = 1 mg/ml → 2
 ['nitrogliceryna',50,'ug/min',50,3],        // 50 µg/min = 3 mg/h → 3
 ['heparyna',50,'j/kg/h',18,2.52],           // 25000/50 = 500 j/ml; 18×70 = 1260 j/h → 2,52
 ['amiodaron',50,'mg/h',30,5],               // 300/50 = 6 mg/ml → 5
 ['midazolam',50,'mg/kg/h',0.05,3.5],        // 50/50 = 1 mg/ml; 3,5 mg/h → 3,5
 ['morfina',50,'mg/h',2,2],                  // 1 mg/ml → 2
 ['pantoprazol',20,'mg/h',8,2],              // 80 mg/20 ml = 4 mg/ml → 2
 ['urapidyl',50,'mg/h',9,4.5],               // 100/50 = 2 mg/ml → 4,5
 ['salbutamol',50,'ug/min',10,6],            // 5 mg/50 = 100 µg/ml; 600 µg/h → 6
 ['propofol',50,'mg/kg/h',2,14],             // 500 mg/50 ml = 10 mg/ml; 140 mg/h → 14
 ['insulina',50,'j/kg/h',0.1,7],             // 50 j/50 ml = 1 j/ml; 7 j/h → 7
 ['furosemid',50,'mg/h',10,1],               // 500 mg/50 ml = 10 mg/ml → 1
 ['amiodaron',20,'mg/kg/d',15,7.2917]        // 120/20 = 6 mg/ml; 15×70 = 1050 mg/d = 43,75 mg/h → 7,2917
];
t('Pompy: 19 aktywnych receptur (+ levosimendan z ONS i oktreotyd, 11.11.2026; 2 wyłączone: fentanyl, noradrenalina stara)',()=>{assert.equal(DB.drugs.length,19);assert.deepEqual(DB.excluded.map(x=>x.id).sort(),['fentanyl','noradrenalina']);});
t('Pompy: każdy aktywny preset ma przykład ręczny',()=>{const ids=new Set(HAND.map(h=>h[0]));for(const d of DB.drugs)assert.ok(ids.has(d.id),d.id);});
for(const [id,syr,u,dose,exp] of HAND)t(`Pompy ${id} ${syr} ml: ${dose} ${u} @70 kg = ${exp} ml/h (ręcznie = wzór = silnik; dawka wstecz)`,()=>{
 const d=D(id),c=E.recipe(d,syr).conc;near(c,concIndep(d,syr),1e-12,'stężenie');
 const ind=mlhIndep(d,syr,u,dose,70);near(ind,exp,1e-4,'wzór vs ręcznie');
 const app=E.toMlh(d,c,u,dose,70);near(app,exp,1e-4,'silnik vs ręcznie');near(E.fromMlh(d,c,u,app,70),dose,1e-9,'dawka wstecz');});
// wszystkie strzykawki × wszystkie jednostki × dawki lo/hi/max: silnik == wzór niezależny, round-trip, flagi maks.
for(const d of DB.drugs)for(const syr of Object.keys(d.rec).map(Number))for(const u of d.units){
 const doses=[u.lo,u.hi,u.max].filter(x=>x!=null);if(!doses.length)doses.push(1);
 t(`Pompy ${d.id} ${syr} ml ${u.u}: dawki ${doses.join('/')} – silnik = wzór niezależny, round-trip`,()=>{const c=E.recipe(d,syr).conc;
  for(const x of doses){const a=E.toMlh(d,c,u.u,x,70);near(a,mlhIndep(d,syr,u.u,x,70),1e-9);near(E.fromMlh(d,c,u.u,a,70),x,1e-9);}});
 if(u.max!=null)t(`Pompy ${d.id} ${u.u}: maks. ${u.max} → równo maks. bez flagi, +1% → flaga „max”`,()=>{
  const c=E.recipe(d,syr).conc,ah=x=>E.toMlh(d,c,u.u,x,70)*c;
  assert.ok(!E.assess(d,u.u,u.max,ah(u.max)).flags.includes('max'));assert.ok(E.assess(d,u.u,u.max*1.01,ah(u.max*1.01)).flags.includes('max'));});
}
t('Pompy: limity godzinowe/dobowe – NTG >10 mg/h, furosemid >240 mg/h i >1500 mg/d, amiodaron >1200 mg/d, morfina >30 mg/h',()=>{
 const f=(id,u,x)=>E.assess(D(id),u,x,x).flags;
 assert.ok(f('nitrogliceryna','mg/h',10.01).includes('maxH'));assert.ok(!f('nitrogliceryna','mg/h',10).includes('maxH'));
 assert.ok(f('furosemid','mg/h',240.1).includes('maxH'));assert.ok(f('furosemid','mg/h',62.6).includes('maxD'));assert.ok(!f('furosemid','mg/h',62.5).includes('maxD')); // 62,5×24 = 1500
 assert.ok(f('amiodaron','mg/h',50.01).includes('maxD'));assert.ok(!f('amiodaron','mg/h',50).includes('maxD')); // 50×24 = 1200
 assert.ok(f('morfina','mg/h',30.01).includes('maxH'));});
t('Pompy: masa wymagana dla dawek /kg (brak masy → null), ujemne/NaN → null',()=>{const d=D('noradrenalina_c80'),c=E.recipe(d,50).conc;
 assert.equal(E.toMlh(d,c,'ug/kg/min',0.1,NaN),null);assert.equal(E.toMlh(d,c,'ug/kg/min',-1,70),null);assert.ok(E.toMlh(d,c,'ug/min',7,NaN)>0);});
t('Pompy: heparyna – bolus 80 j./kg × 70 = 5600 j. = 1,12 ml fiolki 5000 j./ml; limit 5000 j. obcina',()=>{const b=E.hepBolus(70,80,5000);near(b.units,5600);near(b.mlVial,1.12);const c=E.hepBolus(70,80,5000,5000);near(c.units,5000);assert.ok(c.capped);});
t('Pompy: Raschke APTT 50 s, 18 j./kg/h, 70 kg → bez zmian = 1260 j./h = 2,52 ml/h (500 j./ml)',()=>{const r=E.raschke(50,18,70,500);near(r.newUh,1260);near(r.newMlh,2.52);});

// ======================= NEUROLOGIA (calc/neuro.js) =======================
const N=rq('calc/neuro.js');
function altIndep(w){const tot=Math.round(Math.min(0.9*w,90)*10)/10,bol=Math.round(tot*0.1*10)/10;return[tot,bol,Math.round((tot-bol)*10)/10];}
const ALT=[[50,45,4.5,40.5],[64.5,58.1,5.8,52.3],[70,63,6.3,56.7],[99,89.1,8.9,80.2],[100,90,9,81],[100.1,90,9,81],[130,90,9,81]]; // ręcznie: 0,9×w (maks. 90), bolus 10%
for(const [w,tot,bol,inf] of ALT)t(`Alteplaza udar ${w} kg → ${tot} mg (bolus ${bol}, wlew ${inf} mg/60 min = ml/h przy 1 mg/ml)`,()=>{const a=N.alteplase(w),i=altIndep(w);
 near(a.tot,tot);near(a.bol,bol);near(a.inf,inf);near(a.mlh,inf);near(i[0],tot);near(i[1],bol);near(i[2],inf);assert.equal(a.capped,w>100);});
t('Alteplaza: brak/ujemna masa → null',()=>{assert.equal(N.alteplase(0),null);assert.equal(N.alteplase(NaN),null);});
t('NIHSS: 15 pozycji, maks. 42 (ręcznie 3+2+2+2+3+3+4+4+4+4+2+2+3+2+2)',()=>{assert.equal(N.NIH.length,15);const mx=N.NIH.reduce((s,it)=>s+it[2].length-1,0);assert.equal(mx,42);
 const v={};N.NIH.forEach(it=>v[it[0]]=it[2].length-1);assert.equal(N.nihss(v).score,42);assert.equal(N.nihss(v).sev,'udar ciężki');});
t('NIHSS: suma = suma niezależna; UN i puste = 0 i nieliczone; wartości poza skalą przycięte',()=>{const v={};let s=0,k=0;N.NIH.forEach((it,i)=>{const x=i%3===0?1:i%3===1?0:'UN';v[it[0]]=x;if(x!=='UN'){s+=x;k++;}});
 const r=N.nihss(v);assert.equal(r.score,s);assert.equal(r.done,k);const v2={};v2[N.NIH[0][0]]=99;assert.equal(N.nihss(v2).score,N.NIH[0][2].length-1);});
t('NIHSS: progi ciężkości 0 / 4 / 5 / 15 / 16 / 20 / 21',()=>{const mk=s=>{const v={};let left=s;N.NIH.forEach(it=>{const m=it[2].length-1,x=Math.min(m,left);v[it[0]]=x;left-=x;});return N.nihss(v).sev;};
 assert.equal(mk(0),'brak objawów');assert.equal(mk(4),'udar łagodny');assert.equal(mk(5),'udar umiarkowany');assert.equal(mk(15),'udar umiarkowany');assert.equal(mk(16),'udar umiarkowanie ciężki');assert.equal(mk(20),'udar umiarkowanie ciężki');assert.equal(mk(21),'udar ciężki');});
t('Tenekteplaza: przedziały masy EPAR (59,9→15; 60→17,5; 70→20; 80→22,5; 90→25 mg; 5 mg/ml)',()=>{for(const [w,mg] of [[59.9,15],[60,17.5],[70,20],[80,22.5],[90,25],[120,25]]){const k=N.tenecteplase(w);near(k.mg,mg);near(k.ml,Math.round(mg/5*10)/10);}});

t('Udar – bramki (jedno źródło: neuro.js): okno 4,5 h tak, 4,51 nie; RR przed 185/110 dopuszczone, 186 lub 111 blokuje (ChPL >185/>110); po 180/105 ok, 181 → obniż',()=>{
 assert.equal(N.window(4.5).lvl,'ok');assert.equal(N.window(4.51).lvl,'red');
 assert.equal(N.bp(185,110,'pre').hi,false);assert.equal(N.bp(186,100,'pre').hi,true);assert.equal(N.bp(150,111,'pre').hi,true);
 assert.equal(N.bp(180,105,'post').hi,false);assert.equal(N.bp(181,90,'post').hi,true);});
t('Udar – glikemia: 49,9 → czerwone (mimik), 50 → ok, 400 → pomarańczowe (cel 140–180), 400,1 → czerwone (przeciwwskazanie ChPL)',()=>{assert.equal(N.glu(49.9).lvl,'red');assert.notEqual(N.glu(50).lvl,'red');assert.equal(N.glu(400).lvl,'orange');assert.equal(N.glu(400.1).lvl,'red');});
t('Udar – koagulogram: INR 1,7 ok, 1,71 przeciwwskazanie; 1,31 ostrzeżenie ChPL (VKA); PLT 100 ok, 99 przeciwwskazanie',()=>{assert.equal(N.coag(1.7,100).abs.length,0);assert.equal(N.coag(1.71,200).abs.length,1);assert.equal(N.coag(1.31,200).warn.length,1);assert.equal(N.coag(1.3,200).warn.length,0);assert.equal(N.coag(1,99).abs.length,1);});
t('Udar – przeciwwskazania z dawnego acoagB1 obecne w Neurologii (cukrzyca + udar, NIHSS >25, wątroba/trzustka, wiek <16, >80, niewyrównana cukrzyca)',()=>{const k=N.CI_ABS.concat(N.CI_REL).map(c=>c[0]);for(const x of ['dmstroke','minor','severe','liver','age16','age80','dm','seiz','preg','coag','doac','lmwh'])assert.ok(k.includes(x),x);});
const CL=rq('calc/clinical.js');
for(const [w,tot,inf,mlh] of [[80,100,90,45],[65,100,90,45],[64,96,86,43],[50,75,65,32.5]])t(`ZP alteplaza standard ${w} kg → ${tot} mg (10 mg bolus + ${inf} mg / 2 h = ${mlh} ml/h przy 1 mg/ml)`,()=>{const r=CL.tpa(w,1,'standard');near(r.total,tot);near(r.bolus,10);near(r.infusion,inf);near(r.mlh,mlh);near(w<65?1.5*w:100,tot);});
t('ZP alteplaza przyspieszona: 0,6 mg/kg/15 min, maks. 50 mg (70 kg → 42 mg = 168 ml/h; 90 kg → 50 mg); 2 mg/ml → połowa ml/h',()=>{const a=CL.tpa(70,1,'rapid');near(a.total,42);near(a.mlh,168);near(CL.tpa(90,1,'rapid').total,50);near(CL.tpa(70,2,'standard').mlh,22.5);assert.equal(CL.tpa(70,3,'standard').ok,false);});

// ======================= ANTYKOAGULACJA (calc/acoagB1.js, calc/acoag.js) =======================
const A=rq('calc/acoagB1.js');
t('Alteplaza – jedno źródło prawdy: acoagB1 nie liczy już udaru ani ZP (Neurologia / Zatorowość płucna)',()=>{assert.equal(A.stroke,undefined);assert.equal(A.pe,undefined);});
t('Protamina UFH: bolus 5000 j. 20 min temu → 50 mg; 45 min → 25–37,5 mg; 90 min → 18,75–25; 150 min → 12,5–18,75',()=>{
 const f=m=>A.protUfh({bolusU:5000,bolusMinAgo:m});near(f(20).loC,50);near(f(45).loC,25);near(f(45).hiC,37.5);near(f(90).loC,18.75);near(f(90).hiC,25);near(f(150).loC,12.5);near(f(150).hiC,18.75);});
t('Protamina UFH: wlew 1000 j./h od 5 h (trwa) → okno 2 h = 2000 j. → 20 mg; zatrzymany 60 min temu → 1 h = 10 mg; >2 h → 0; limit 50 mg',()=>{
 near(A.protUfh({rateUh:1000,runningH:5,stoppedMinAgo:0}).loC,20);near(A.protUfh({rateUh:1000,runningH:5,stoppedMinAgo:60}).loC,10);near(A.protUfh({rateUh:1000,runningH:5,stoppedMinAgo:150}).loC,0);
 const c=A.protUfh({rateUh:4000,runningH:3,stoppedMinAgo:0});near(c.hi,80);near(c.hiC,50);assert.ok(c.cap);});
t('Protamina enoksaparyna: 80 mg 6 h → 80 obcięte do 50; 40 mg 10 h → 20 mg; 13 h → zbędna',()=>{const a=A.protEnox({mg:80,hours:6});near(a.mg,50);assert.ok(a.cap);near(A.protEnox({mg:40,hours:10}).mg,20);assert.ok(A.protEnox({mg:40,hours:13}).none);});
t('STEMI alteplaza ≥65 kg: 15 + 50 + 35 = 100 mg; 60 kg: 15 + 45 + 30 = 90 mg (0,75 i 0,5 mg/kg)',()=>{
 const base={hours:2,delayMin:150,sbp:120,v:{}};const a=A.stemi(Object.assign({w:80,age:60},base)),b=A.stemi(Object.assign({w:60,age:60},base));
 const tot=o=>o.total;near(tot(a),100);near(tot(b),15+0.75*60+0.5*60);});

const AC=rq('calc/acoag.js');
t('UFH (acoag.js): ŻChZZ 80 j./kg + 18 j./kg/h (70 kg → 5600 j. + 1260 j./h = 2,52 ml/h); ACS 60 j./kg maks. 4000 + 12 j./kg/h maks. 1000 (90 kg → 4000 + 1000 = 2 ml/h)',()=>{const a=AC.ufh(70);near(a.bolus,5600);near(a.rate,1260);near(a.mlh,2.52);const b=AC.ufh(90,'acs');near(b.bolus,4000);near(b.rate,1000);near(b.mlh,2);assert.ok(b.bolusCap&&b.rateCap);assert.equal(AC.ufh(251),null);});
t('Enoksaparyna: leczenie 1 mg/kg co 12 h (80 kg → 80 mg = 0,8 ml); CrCl 29 → co 24 h; profilaktyka 40 mg, CrCl <30 → 20 mg; CrCl <15 → czerwone',()=>{const a=AC.enox(80,60);near(a.dose,80);near(a.ml,0.8);assert.equal(a.freq,'co 12 h');assert.equal(AC.enox(80,29).freq,'co 24 h');near(AC.enox(80,60,'proph').dose,40);near(AC.enox(80,29,'proph').dose,20);assert.equal(AC.enox(80,14).lvl,'red');});
t('4F-PCC (Beriplex) wg INR: 2–<4 25 j./kg maks. 2500; 4–6 35 maks. 3500; >6 50 maks. 5000; 25 j./ml (70 kg INR 3 → 1750 j. = 70 ml; 120 kg INR 7 → 5000)',()=>{const a=AC.pccInr(70,3);near(a.iu,1750);near(a.ml,70);near(AC.pccInr(70,4).perKg,35);near(AC.pccInr(70,6).perKg,35);near(AC.pccInr(70,6.1).perKg,50);near(AC.pccInr(120,7).iu,5000);near(AC.pccInr(120,3).iu,2500);});
t('Andeksanet (ChPL Ondexxya): apiksaban ≤5 mg → niska; >5 mg lub nieznana <8 h → wysoka; ≥8 h → niska; riwaroksaban >10 mg → wysoka',()=>{assert.equal(AC.andex('api',5,2).reg,'niska');assert.equal(AC.andex('api',10,2).reg,'wysoka');assert.equal(AC.andex('api',NaN,NaN).reg,'wysoka');assert.equal(AC.andex('api',10,8).reg,'niska');assert.equal(AC.andex('riva',20,3).reg,'wysoka');assert.equal(AC.andex('riva',10,3).reg,'niska');near(AC.andex('riva',20,3).bolus,800);near(AC.andex('api',5,1).inf,4);});
t('PCC przy anty-Xa bez andeksanetu: 50 j./kg (70 kg → 3500 j. = 140 ml)',()=>{const a=AC.pccXa(70);near(a.iu,3500);near(a.ml,140);});

// ======================= DKA (calc/dkaB1.js) =======================
global.SK=global.SK||{};const DK=rq('calc/dkaB1.js');
t('DKA strzykawka: 50 j./50 ml = 1 j./ml (0,5 ml insuliny 100 j./ml + 49,5 ml); 20 j./20 ml = 1; 10 j./50 ml = 0,2',()=>{const s=DK.syringe(50,50);assert.ok(s.ok);near(s.conc,1);near(s.insMl,0.5);near(s.diluentMl,49.5);near(DK.syringe(20,20).conc,1);near(DK.syringe(10,50).conc,0.2);});
t('DKA: 0,1 j./kg/h × 72 kg = 7,2 j./h → 7,2 ml/h (1 j./ml) i 14,4 ml/h (0,5 j./ml)',()=>{near(DK.mlh(7.2,1),7.2);near(DK.mlh(7.2,0.5),14.4);assert.ok(isNaN(DK.mlh(7.2,0)));});
t('DKA: stężenie poza 0,05–1,0 j./ml odrzucone (60 j./50 ml = 1,2; 2 j./50 ml = 0,04); strzykawka spoza 20/50 ml odrzucona',()=>{assert.ok(!DK.syringe(60,50).ok);assert.ok(!DK.syringe(2,50).ok);assert.ok(!DK.syringe(30,30).ok);});

// ======================= TRANSFUZJE (calc/transfB1.js) =======================
const T=rq('calc/transfB1.js');
t('MTP: podano 6 KKCz, 4 j./h, dostawa 90 min → projekcja 12 j. → 2 dawki KKP, osocze 12 j.; zapas 1 → zamów 1',()=>{const m=T.mtp({rbcGiven:6,rbcPerHour:4,deliveryMin:90,pltGiven:0,pltStock:1});near(m.projectedRbc,12);assert.equal(m.pltTotal,2);assert.equal(m.plasmaUnits,12);assert.equal(m.order,1);});
t('MTP: projekcja 12,5 → 3 dawki (ceil 12,5/6); dane ujemne → null',()=>{assert.equal(T.mtp({rbcGiven:6.5,rbcPerHour:4,deliveryMin:90}).pltTotal,3);assert.equal(T.mtp({rbcGiven:-1,rbcPerHour:4,deliveryMin:90}),null);});

// ======================= ONS → Pompy SOR (faza 2: calc/pressB1.js usunięty) =======================
t('ONS: drugi silnik pomp (calc/pressB1.js) usunięty; brak w index.html i sw.js',()=>{assert.ok(!fs.existsSync(path.join(R,'calc/pressB1.js')));for(const f of ['index.html','sw.js','b1-ui.js','clinical-ui.js'])assert.ok(!/pressB1\.js"|SK\.pressB1/.test(fs.readFileSync(path.join(R,f),'utf8')),f);});
// każdy lek dawnego kalkulatora ONS ma preset w Pompach z tą samą ampułką (dopamina 4% – decyzja lekarza 11.11.2026)
for(const [onsLek,id,mg,ml] of [['nor','noradrenalina_c80',4,4],['nor','noradrenalina_c',4,4],['nor','noradrenalina_p',4,4],['adr','adrenalina',1,1],['dob','dobutamina',250,20],['lev','levosimendan',12.5,5],['ntg','nitrogliceryna',10,10],['fur','furosemid',20,2],['dop','dopamina',200,5]])
 t(`ONS ${onsLek} → Pompy „${id}”: ampułka ${mg} mg / ${ml} ml`,()=>{const d=D(id);assert.ok(d,id);near(d.amp.content,mg);near(d.amp.volume,ml);});
t('Dopamina 4% (200 mg/5 ml, decyzja lekarza 11.11.2026): 50 ml = 3,75 ml (150 mg) + 46,25 ml = 3 mg/ml; 20 ml = 1,25 ml (50 mg) + 18,75 ml = 2,5 mg/ml',()=>{const d=D('dopamina'),a=E.recipe(d,50),b=E.recipe(d,20);near(3.75*200/5,150);near(a.drugVol,3.75);near(a.diluent,46.25);near(a.conc,150/50);near(b.drugVol,1.25);near(b.diluent,18.75);near(b.conc,50/20);assert.ok(a.conc<=3.2&&b.conc>=0.4);assert.match(d.product,/4%/);});
// niezależny rachunek ml/h = dawka [µg/kg/min] × masa × 60 / 1000 / stężenie [mg/ml]
for(const [w,dose,syr,exp] of [[70,5,50,7],[70,10,50,14],[70,5,20,8.4],[80,20,50,32],[60,2,20,2.88]])
 t(`Dopamina 4%: ${w} kg × ${dose} µg/kg/min, strzykawka ${syr} ml → ${String(exp).replace('.',',')} ml/h`,()=>{const d=D('dopamina'),c=syr===50?3:2.5,ind=dose*w*60/1000/c;near(ind,exp);near(E.toMlh(d,E.recipe(d,syr).conc,'ug/kg/min',dose,w),exp);});
// oktreotyd (decyzja lekarza 11.11.2026): 10 µg/ml; 25 µg/h = 2,5 ml/h; 50 µg/h = 5 ml/h = MAKS.
t('Oktreotyd: 50 ml = 5 amp. 100 µg (5 ml) + 45 ml NaCl = 10 µg/ml; 20 ml = 2 amp. + 18 ml = 10 µg/ml; zatwierdzony',()=>{const d=D('oktreotyd'),a=E.recipe(d,50),b=E.recipe(d,20);near(a.amps,5);near(a.diluent,45);near(a.conc,500/50);near(b.amps,2);near(b.diluent,18);near(b.conc,200/20);assert.equal(d.status,'zatwierdzony');assert.deepEqual(d.diluents,['NaCl 0,9%']);});
for(const [dose,exp] of [[25,2.5],[50,5]])t(`Oktreotyd: ${dose} µg/h = ${String(exp).replace('.',',')} ml/h (obie strzykawki)`,()=>{const d=D('oktreotyd');near(dose/10,exp);near(E.toMlh(d,E.recipe(d,50).conc,'ug/h',dose,null),exp);near(E.toMlh(d,E.recipe(d,20).conc,'ug/h',dose,null),exp);});
t('Oktreotyd: 50 µg/h bez flagi, 60 µg/h → flaga MAKS. (ChPL 4.4); 25 µg/h w zakresie',()=>{const d=D('oktreotyd');assert.ok(!E.assess(d,'ug/h',50,50).overMax);assert.ok(E.assess(d,'ug/h',60,60).overMax);assert.ok(!E.assess(d,'ug/h',25,25).out);});
t('Oktreotyd: progi 2,5 / 5 ml/h z MAKS., bolus 50 µg „DO DECYZJI LEKARZA” z ostrzeżeniem o bloku AV, receptury dla 50/100/500 µg/ml',()=>{const d=D('oktreotyd');assert.match(d.thresholds.map(x=>x.text).join('|'),/2,5 ml\/h[\s\S]*5 ml\/h – MAKSYMALNIE/);assert.match(d.bolus,/^DO DECYZJI LEKARZA/);assert.match(d.bolus,/blok AV/);assert.match(d.why,/10 amp\. \(10 ml\) \+ 40 ml/);assert.match(d.why,/1 ml \+ 49 ml/);assert.match(d.why,/0,4 ml \+ 19,6 ml/);for(const k of d.src)assert.ok(DB.sources[k],k);});
t('Levosimendan: zatwierdzony przez lekarza (bez bramki zatwierdzenia)',()=>{assert.equal(D('levosimendan').status,'zatwierdzony');});
// levosimendan – ChPL Simdax, tabela dla 0,05 mg/ml (zaokrąglona do 1 ml/h): 70 kg → 4 / 8 / 17 ml/h dla 0,05 / 0,1 / 0,2 µg/kg/min
for(const [w,dose,chpl] of [[40,0.1,5],[70,0.05,4],[70,0.1,8],[70,0.2,17],[100,0.1,12],[120,0.2,29]])
 t(`Levosimendan 0,05 mg/ml: ${w} kg × ${dose} µg/kg/min ≈ ${chpl} ml/h (ChPL); silnik = wzór`,()=>{const d=D('levosimendan'),u=d.units[0];const ind=dose*w*60/50;const r=E.toMlh(d,E.recipe(d,50).conc,u.u,dose,w);assert.equal(Math.round(ind),chpl);near(r,ind);near(E.toMlh(d,E.recipe(d,20).conc,u.u,dose,w),ind);});
t('ONS ściąga: każdy przycisk „Otwórz w Pompach” wskazuje istniejący preset',()=>{const s=fs.readFileSync(path.join(R,'b1-ui.js'),'utf8');const ids=[...s.matchAll(/\['([a-z0-9_]+)','[^']*'\]/g)].map(m=>m[1]).filter(x=>/^(nor|adr|dob|dop|lev|nit|fur)/.test(x));assert.ok(ids.length>=9,ids.join());for(const id of ids)assert.ok(D(id),id);});

// ======================= GRZYBY + FOMEPIZOL =======================
const M=rq('calc/mushB2.js'),C=rq('calc/clinical.js');
t('Grzyby: utajenie 5,9 h → pomarańczowe; 6,0 h → czerwone; brak danych → brak wyniku',()=>{assert.equal(M.triage({latency:5.9}).level,'orange');assert.equal(M.triage({latency:6}).level,'red');assert.equal(M.triage({}).ok,false);});
t('Grzyby: okno próbki moczu <6 / 6–36 / 36–96 / >96 h',()=>{assert.equal(M.sampling(5.9).window,'early');assert.equal(M.sampling(6).window,'window');assert.equal(M.sampling(36).window,'window');assert.equal(M.sampling(36.1).window,'late');assert.equal(M.sampling(96).window,'late');assert.equal(M.sampling(96.1).window,'verylate');});
for(const [w,stage,dil,mg,vol,mlh] of [[70,'loading',100,1050,101.05,202.1],[70,'maintenance',100,700,100.7,201.4],[80,'later',250,1200,251.2,502.4]])
 t(`Fomepizol ${w} kg ${stage}: ${mg} mg (${stage==='maintenance'?10:15} mg/kg), ${mg/1000} ml koncentratu 1 g/ml + ${dil} ml = ${vol} ml w 30 min = ${mlh} ml/h`,()=>{
  const r=C.fomepizole(w,stage,dil);assert.ok(r.ok);near(r.mg,mg);near(r.volume,vol);near(r.mlh,mlh);near(w*(stage==='maintenance'?10:15),mg);near((dil+mg/1000)*2,mlh);});
t('Fomepizol: masa spoza 30–250 kg / rozcieńczalnik <100 ml / nieznany etap → błąd',()=>{assert.ok(!C.fomepizole(20,'loading').ok);assert.ok(!C.fomepizole(70,'loading',50).ok);assert.ok(!C.fomepizole(70,'x').ok);});

// ======================= OMDLENIE (mod/omdlenie) =======================
const SE=rq('mod/omdlenie/engine.js'),RU=JSON.parse(fs.readFileSync(path.join(R,'mod/omdlenie/rules.json'),'utf8'));
t('CSRS: tabela ryzyka = publikacja (CMAJ 2016): −3 0,4% … 0 1,9% … 4 12,9% … 11 83,6%',()=>{const exp={'-3':0.4,'-2':0.7,'-1':1.2,'0':1.9,'1':3.1,'2':5.1,'3':8.1,'4':12.9,'5':19.7,'6':28.9,'7':40.3,'8':52.8,'9':65.0,'10':75.5,'11':83.6};
 for(const k in exp)near(RU.csrsTable[k][0],exp[k]);});
t('CSRS: punkty pozycji (C-1 −1, C-2 +1, C-3 +2, C-5 +1, C-6 +1, C-7 +2, troponina +2, wazowagalne −2, kardiogenne +2)',()=>{const it=SE.index(RU);
 for(const [c,p] of [['C-1',-1],['C-2',1],['C-3',2],['C-5',1],['C-6',1],['C-7',2]])assert.equal(it[c].pts,p,c);assert.equal(RU.troponin.pts,2);assert.equal(RU.diagnosis.vaso.pts,-2);assert.equal(RU.diagnosis.cardiac.pts,2);});
// pełny komplet „niski”: wszystkie always/ecg odpowiedziane
function base(){const a={};RU.groups.forEach(g=>g.items.forEach(it=>{if(it.req==='always'||it.req==='ecg')a[it.code]='no';}));a['K-1']='yes';a['K-1T']='yes';a['E-L1']='yes';a['B-L1']='yes';a['G-L1']='yes';a['C-1']='yes';return a;}
t('Omdlenie: komplet niskiego ryzyka → ZIELONE (R4), CSRS = −1 + (−2 wazowagalne) = −3',()=>{const r=SE.evaluate(RU,{answers:base(),troponin:'neg',dx:'vaso'});assert.equal(r.color,'green');assert.equal(r.rule,'R4');assert.equal(r.csrs.score,-3);});
t('Omdlenie: duża cecha ESC (E-H2) → CZERWONE R1 nawet przy brakach danych',()=>{const r=SE.evaluate(RU,{answers:{'E-H2':'yes'}});assert.equal(r.color,'red');assert.equal(r.rule,'R1');});
t('Omdlenie: brak danych bez czerwonych → ŻÓŁTE',()=>{const r=SE.evaluate(RU,{answers:{'K-1':'yes'}});assert.equal(r.color,'yellow');});
t('Omdlenie: wiek <16 → CZERWONE K0; wykluczenie (K-4) → K0',()=>{const a=base();a['K-1']='no';assert.equal(SE.evaluate(RU,{answers:a,troponin:'neg',dx:'vaso'}).rule,'K0');const b=base();b['K-4']='yes';assert.equal(SE.evaluate(RU,{answers:b,troponin:'neg',dx:'vaso'}).rule,'K0');});
t('Omdlenie: CSRS ≥4 → CZERWONE R3 (C-2 +1, C-3 +2, troponina +2, inne 0 → 5 − 0 = 5; brak C-1)',()=>{const a=base();a['C-1']='no';a['C-2']='yes';a['C-3']='yes';const r=SE.evaluate(RU,{answers:a,troponin:'pos',dx:'other'});assert.equal(r.csrs.score,5);assert.equal(r.color,'red');assert.ok(['R1','R3'].includes(r.rule));});
t('Omdlenie: mała cecha zdarzenia + nieprawidłowe EKG → R2; mała cecha bez warunku → R5 (nie zielone)',()=>{const a=base();a['E-M1']='yes';a['G-L1']='no';const r=SE.evaluate(RU,{answers:a,troponin:'neg',dx:'vaso'});assert.equal(r.color,'red');
 const b=base();b['E-M1']='yes';const r2=SE.evaluate(RU,{answers:b,troponin:'neg',dx:'vaso'});assert.equal(r2.color,'red');assert.equal(r2.rule,'R5');});
t('Omdlenie: obniżenie koloru do DOM wymaga uzasadnienia',()=>{assert.equal(SE.override({color:'red'},'green').ok,false);assert.equal(SE.override({color:'red'},'green','x').ok,true);});

console.log((n-fail)+'/'+n+(fail?' FAIL':' PASS'));process.exit(fail?1:0);
