// fix26 (21.11.2026, t57u pkt 11): kalkulator „SCORE2 / SCORE2-OP – 10-letnie ryzyko sercowo-naczyniowe” (jak HeartScore, Polska = region wysokiego ryzyka).
// Odniesienie: RiskScorescvd (pakiet R; funkcja SCORE2 obejmująca SCORE2 i SCORE2-OP) – tests/data/score2_riskscorescvd_ref.json (2880 przypadków, 4 regiony, 40–89 lat).
// Tolerancja zlecona przez lekarza: ≤0,5 pkt %. Przykład z publikacji SCORE2 (Eur Heart J 2021;42:2439). Tabele ESC 2021 dla ≥70 lat – odchylenie raportowane (nie kryterium).
const K=require('../calc/kalk.js');const assert=require('assert');let n=0,f=0;
function t(name,fn){n++;try{fn();console.log('PASS',name);}catch(e){f++;console.log('FAIL',name,'—',e.message);}}
const near=(a,b,tol,msg)=>assert.ok(Math.abs(a-b)<=tol,(msg||'')+' '+a+' ≠ '+b+' ±'+tol);
const REF=require('./data/score2_riskscorescvd_ref.json');
const NOW='2026-11';const dob=age=>({bm:'6',by:2026-age});// czerwiec, „teraz” = listopad 2026 → wiek pełny
const run=(o)=>K.run('score2hs',Object.assign({now:NOW},o));
t('RiskScorescvd: 2880 przypadków (4 regiony, SCORE2 40–69 + SCORE2-OP 70–89) – różnica ≤0,5 pkt % (faktycznie ≤0,05 = zaokrąglenie)',()=>{let mx=0;assert.strictEqual(REF.rows.length,2880);
 for(const [reg,sex,age,smk,sbp,tc,hdl,p] of REF.rows){const x=(age>=70?K.score2op:K.score2)(age,sex,smk,sbp,tc,hdl,0,reg)*100;mx=Math.max(mx,Math.abs(x-p));}
 console.log('   maks. różnica vs RiskScorescvd:',mx.toFixed(4),'pkt %');assert.ok(mx<=0.5);assert.ok(mx<=0.051,'oczekiwano tylko błędu zaokrąglenia: '+mx);});
t('Kalkulator (data urodzenia → wiek → model) = RiskScorescvd dla Polski (region wysokiego ryzyka), 720 przypadków, ≤0,5 pkt %',()=>{let k=0,mx=0;
 for(const [reg,sex,age,smk,sbp,tc,hdl,p] of REF.rows){if(reg!=='high')continue;const r=run(Object.assign(dob(age),{sex,smk:String(smk),sbp,tc,hdl}));assert.ok(!r.err&&!r.miss,JSON.stringify(r));
  assert.strictEqual(r.model,age>=70?'SCORE2-OP':'SCORE2');assert.strictEqual(r.age,age);mx=Math.max(mx,Math.abs(r.n-p));k++;}assert.strictEqual(k,720);assert.ok(mx<=0.5,'max '+mx);});
t('SCORE2 – przykład z publikacji (M 50 l., palacz, SBP 140, TC 5,5, HDL 1,3): region niski 5,9 %, bardzo wysoki 14,0 %',()=>{near(K.score2(50,'m',1,140,5.5,1.3,0,'low')*100,5.9,0.05);near(K.score2(50,'m',1,140,5.5,1.3,0,'vhigh')*100,14.0,0.05);});
t('Wiek z daty urodzenia (miesiąc/rok): 11.1956 → 70 l. = SCORE2-OP; 12.1956 → 69 l. = SCORE2; 12.1986 → 39 l. = błąd; 10.1936 → 90 l. = błąd',()=>{
 const b={sex:'m',smk:'0',sbp:140,tc:5.5,hdl:1.3};assert.strictEqual(run(Object.assign({bm:'11',by:1956},b)).model,'SCORE2-OP');const r69=run(Object.assign({bm:'12',by:1956},b));assert.strictEqual(r69.model,'SCORE2');assert.strictEqual(r69.age,69);
 assert.ok(/40–69/.test(run(Object.assign({bm:'12',by:1986},b)).err));assert.ok(/89/.test(run(Object.assign({bm:'10',by:1936},b)).err));
 assert.strictEqual(K.run('score2hs',Object.assign({bm:'1',by:1970,now:new Date(2026,0,10)},b)).age,56);});
t('Kategorie ESC 2021 wg wieku: <50: <2,5/2,5–7,5/≥7,5; 50–69: <5/5–10/≥10; ≥70: <7,5/7,5–15/≥15 %',()=>{
 const cat=(age,o)=>{const r=run(Object.assign(dob(age),o));return [r.cat,r.n];};
 for(const [age,th] of [[45,[2.5,7.5]],[60,[5,10]],[75,[7.5,15]]])for(const sex of ['m','f'])for(const smk of ['0','1'])for(const sbp of [110,130,150,170])for(const tc of [4,6,8]){const [c,x]=cat(age,{sex,smk,sbp,tc,hdl:1.3});assert.strictEqual(c,x<th[0]?0:x<th[1]?1:2,age+' '+x);}
 assert.ok(/progi ESC 2021 dla wieku 50–69 lat/.test(run(Object.assign(dob(55),{sex:'m',smk:'0',sbp:120,tc:5,hdl:1.5})).interp));});
t('Wynik nazwany modelem; Polska – region wysokiego ryzyka; nie-HDL w mmol/l i mg/dl',()=>{const r=run(Object.assign(dob(50),{sex:'m',smk:'1',sbp:140,tc:5.5,hdl:1.3}));assert.ok(/^SCORE2:/.test(r.interp));near(r.n,K.score2(50,'m',1,140,5.5,1.3,0,'high')*100,1e-9);
 assert.ok(/wysokiego ryzyka \(Polska/.test(JSON.stringify(r.rows)));assert.ok(/4,2 mmol\/l \(162 mg\/dl\)/.test(JSON.stringify(r.rows)));const o=run(Object.assign(dob(75),{sex:'f',smk:'0',sbp:150,tc:6,hdl:1.4}));assert.ok(/^SCORE2-OP:/.test(o.interp)&&/SCORE2-OP \(≥70 lat\)/.test(JSON.stringify(o.rows)));});
t('Jednostki: mg/dl ↔ mmol/l (cholesterol ÷38,67) – pola TC, HDL, LDL mają przełącznik',()=>{const c=K.C.score2hs;['tc','hdl','ldl'].forEach(k=>{const fl=c.f.find(x=>x.k===k);assert.deepStrictEqual(fl.units.map(u=>u[0]),['mmol/l','mg/dl']);near(200*fl.units[1][1],5.172,0.001);});});
t('Zalecenia ESC 2021 (rys. 6): KROK 1 dla wszystkich (palenie, styl życia, SBP <160); <70 l.: wysokie → IIa, bardzo wysokie → I, cele SBP/LDL-C; ≥70 l.: statyna IIb',()=>{
 const lo=run(Object.assign(dob(45),{sex:'f',smk:'0',sbp:115,tc:4.5,hdl:1.6})),hi=run(Object.assign(dob(50),{sex:'m',smk:'1',sbp:140,tc:5.5,hdl:1.3})),vh=run(Object.assign(dob(65),{sex:'m',smk:'1',sbp:170,tc:7,hdl:1})),op=run(Object.assign(dob(80),{sex:'m',smk:'1',sbp:160,tc:6,hdl:1.2}));
 assert.strictEqual(lo.cat,0);assert.strictEqual(hi.cat,1);assert.strictEqual(vh.cat,2);assert.strictEqual(op.cat,2);
 [lo,hi,vh,op].forEach(r=>assert.ok(/KROK 1 dla wszystkich: zaprzestanie palenia, zalecenia dotyczące stylu życia, SBP <160 mmHg \(klasa I\)/.test(r.cons)));
 assert.ok(/zwykle niepotrzebne/.test(lo.cons));assert.ok(/NALEŻY ROZWAŻYĆ \(klasa IIa\)/.test(hi.cons)&&/<1,8 mmol\/l \(<70 mg\/dl\)/.test(hi.cons));assert.ok(/ZALECANE \(klasa I\)/.test(vh.cons)&&/<1,4 mmol\/l \(<55 mg\/dl\)/.test(vh.cons)&&/SBP <130 mmHg/.test(vh.cons));
 assert.ok(/klasa IIb/.test(op.cons)&&/kruchość/.test(op.cons)&&!/<1,4 mmol/.test(op.cons));});
t('Cel LDL-C tylko gdy podano LDL: <70 l. wysokie → KROK 1 <2,6 i KROK 2 <1,8 z potrzebną redukcją; bardzo wysokie → <1,4; ≥70 → <2,6; niskie → brak celu',()=>{
 const b=Object.assign(dob(50),{sex:'m',smk:'1',sbp:140,tc:5.5,hdl:1.3});assert.ok(!JSON.stringify(run(b).rows).includes('Cel LDL'));
 const r=JSON.stringify(run(Object.assign({ldl:3.5},b)).rows);assert.ok(/KROK 1","<2,6 mmol\/l \(<100 mg\/dl\) – obecnie 3,5 mmol\/l \(135 mg\/dl\); potrzebna redukcja o ≥26 %/.test(r),r);assert.ok(/KROK 2","<1,8 mmol\/l \(<70 mg\/dl\).*≥49 %/.test(r));
 assert.ok(/<1,4 mmol\/l/.test(JSON.stringify(run(Object.assign(dob(65),{sex:'m',smk:'1',sbp:170,tc:7,hdl:1,ldl:4.5})).rows)));
 const o=JSON.stringify(run(Object.assign(dob(80),{sex:'m',smk:'1',sbp:160,tc:6,hdl:1.2,ldl:2.0})).rows);assert.ok(/Cel LDL-C","<2,6 mmol\/l \(<100 mg\/dl\) – osiągnięty/.test(o)&&!/KROK 2/.test(o));
 assert.ok(/brak dodatkowego celu LDL-C/.test(JSON.stringify(run(Object.assign(dob(45),{sex:'f',smk:'0',sbp:115,tc:4.5,hdl:1.6,ldl:2.8})).rows)));});
t('Walidacja: brak danych → lista braków (bez wyniku); HDL ≥ TC → błąd; LDL nie jest wymagany',()=>{const m=K.run('score2hs',{}).miss;['miesiąc urodzenia','rok urodzenia','płeć','SBP','cholesterol całkowity','HDL','palacz tak/nie'].forEach(x=>assert.ok(m.includes(x),x));assert.ok(!m.some(x=>/LDL/.test(x)));
 assert.ok(/HDL nie może/.test(run(Object.assign(dob(50),{sex:'m',smk:'0',sbp:140,tc:1.2,hdl:1.3})).err));});
t('Struktura jak HeartScore: opis, ostrzeżenie (osoby pozornie zdrowe; ASCVD, cukrzyca, FH, rzadkie zaburzenia lipidowe/BP, CKD, ciąża), pola wymagane, przycisk Oblicz, pierwszy w grupie kardr',()=>{const c=K.C.score2hs;
 assert.ok(c.d.startsWith('Oblicz 10-letnie ryzyko śmiertelnych i nieśmiertelnych chorób sercowo-naczyniowych'));assert.strictEqual(c.n,'SCORE2 / SCORE2-OP – 10-letnie ryzyko sercowo-naczyniowe');
 ['pozornie zdrowych','ASCVD','cukrzyc','FH','rzadkimi zaburzeniami lipidowymi','ciśnienia tętniczego','CKD','ciąży'].forEach(x=>assert.ok(c.warn.includes(x),x));
 assert.deepStrictEqual(c.f.filter(x=>x.req).map(x=>x.k),['bm','by','sex','sbp','tc','hdl','smk']);assert.ok(c.f.find(x=>x.k==='ldl').opt);assert.strictEqual(c.btn,true);
 assert.deepStrictEqual(c.f.find(x=>x.k==='smk').o,[['1','tak'],['0','nie']]);assert.strictEqual(c.f.find(x=>x.k==='bm').o.length,12);
 assert.deepStrictEqual(K.G.find(g=>g[0]==='kardr')[2],['score2hs','score2','score2dm']);assert.ok(!K.C.score2op);assert.strictEqual(c.url,'https://www.heartscore.org/en_GB');assert.ok(/2439/.test(c.src)&&/2455/.test(c.src)&&/3227/.test(c.src)&&/RiskScorescvd/.test(c.src));});
t('Stary SCORE2 (40–69) przy wieku ≥70 odsyła do nowego kalkulatora (link score2hs)',()=>{const r=K.run('score2',{age:75,sex:'m',sbp:150,tc:5.9,hdl:1.4});assert.ok(r.err&&r.link==='score2hs'&&r.n===undefined);});
const CH=require('./data/esc2021_score2_charts.json').regions;
t('RAPORT (nie kryterium): SCORE2-OP vs tabele ESC 2021 rys. 3, region wysokiego ryzyka, 256 komórek ≥70 l. – odchylenie wynika z nieznanej konstrukcji tabel (HDL)',()=>{
 for(const H of [1.2,1.4]){let mx=0,s=0,c=0;for(const [a,sex,smk,sbp,nh,v] of CH.high){if(a<70)continue;const r=run(Object.assign(dob(a),{sex,smk:String(smk),sbp,tc:nh+H,hdl:H}));const d=r.n-v;mx=Math.max(mx,Math.abs(d));s+=d;c++;}
  console.log('   HDL '+H+': komórek',c,'średnio',(s/c).toFixed(2),'pkt %, maks.',mx.toFixed(2),'pkt %');assert.strictEqual(c,256);}});
console.log(f?('FAILS '+f+' / '+n):('ALL PASS '+n+'/'+n));process.exitCode=f?1:0;
