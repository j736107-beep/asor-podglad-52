// Testy silników etapu 2 (5.2) – uruchom: node tests/etap2-node.test.js
const S=require('../mod/se/engine.js'),EL=require('../mod/el/engine.js'),T=require('../calc/thiamine.js'),B=require('../calc/batch3.js'),CU=require('../calc/cultures.js'),EC=require('../calc/etapC.js');
let pass=0,fail=0;const R=[];
function t(id,fn){try{const m=fn();if(m===true){pass++;R.push([id,'PASS']);}else{fail++;R.push([id,'FAIL '+m]);}}catch(e){fail++;R.push([id,'FAIL '+e.stack]);}}
const now=Date.parse('2026-11-09T15:00:00+01:00');
const se=(o)=>S.compute(Object.assign({w:70,co:{},given:{lev:true},log:[{k:'lev',t:now-30*60000}],now:now,t0:now-30*60000},o));
// --- SE (SPEC §7) ---
t('SE-1 70 kg LEV → VPA 2800 mg/28 ml/168 ml/h',()=>{const r=se();const v=r.drugs.vpa.n;return r.second&&r.second.first.k==='vpa'&&v.mg===2800&&v.ml===28&&v.min===10&&v.mlh===168?true:JSON.stringify([r.second&&r.second.first,v]);});
t('SE-2 90 kg → VPA 3000 mg/30 ml/180 ml/h',()=>{const v=se({w:90}).drugs.vpa.n;return v.mg===3000&&v.ml===30&&v.mlh===180&&v.capped?true:JSON.stringify(v);});
t('SE-3a POLG → VPA zablokowany',()=>{const r=se({co:{polg:true}});const a=r.second.alts.find(x=>x.k==='vpa');return a.blocked&&r.second.first.k!=='vpa'&&/pht|lcm/.test(r.second.first.k)?true:JSON.stringify(r.second.first);});
t('SE-3b ciąża → VPA zablokowany',()=>{const r=se({co:{preg:true}});return r.second.alts.find(x=>x.k==='vpa').blocked&&r.second.first.k!=='vpa'?true:'not blocked';});
t('SE-4 ≥40 min → komunikat III rzutu',()=>{const r=se({t0:now-45*60000});return r.stage3Now&&/III rzut/.test(r.stage3Msg)&&/45 min/.test(r.stage3Msg)?true:r.stage3Msg;});
t('SE-4b <40 min, bez pogorszenia → brak',()=>!se().stage3Now?true:'stage3 at 30 min');
t('SE-5 alkoholizm/Wernicke → tiamina',()=>{const r=se({co:{alco:true,wern:true}});const c=T.card(r.thiamine);const we=c.rows.find(x=>x.k==='we'),pr=c.rows.find(x=>x.k==='prof');return r.thiamine&&/100 mg/.test(pr.dose)&&/500 mg/.test(we.dose)&&/3/.test(we.dose)&&/5 amp/.test(JSON.stringify(we))&&/10 ml/.test(JSON.stringify(we))?true:JSON.stringify(c.rows);});
// --- Tiamina ---
t('TH-1 200–250 mg w 50–100 ml w 15–30 min; 500 mg w 100 ml w 30 min',()=>{const s=JSON.stringify(T.card({alco:true,wern:true}));return /200–250 mg/.test(s)&&/50–100 ml/.test(s)&&/15–30 min/.test(s)&&/100 ml/.test(s)&&/30 min/.test(s)&&/aptek/i.test(s+T.PHARM)?true:s.slice(0,300);});
// --- Hiponatremia (SPEC §8) ---
const el=(lab,opt,track)=>EL.compute({w:70,sex:'m',age:50,dis:'hipoNa',lab:lab,opt:opt||{},track:track});
t('EL-1 Na 118 ciężkie, bez ryzyka: bolus, cel +5, limit 10',()=>{const r=el({na:118},{sympt:'severe'});const s=JSON.stringify(r.steps);return !r.ods.risk&&r.limit===10&&/150 ml/.test(s)&&/\+5/.test(r.target)&&r.steps.some(x=>x.id==='targetBox')&&r.steps.some(x=>x.id==='limitBox'&&/≤10/.test(x.text))?true:JSON.stringify([r.limit,r.target]);});
t('EL-2 Na 104 → ODS TAK, limit 8, cel 4–6',()=>{const r=el({na:104});return r.ods.risk&&/105/.test(r.ods.why[0])&&r.limit===8&&/4–6/.test(r.target)?true:JSON.stringify(r.ods);});
t('EL-3 K 3,1 + alkoholizm → ODS TAK',()=>{const r=el({na:120,k:3.1},{alco:true});return r.ods.risk&&r.ods.why.length===2&&r.thiamine?true:JSON.stringify(r.ods);});
t('EL-4 118→121→124 po 2 bolusach → STOP (+6)',()=>{const r=el({na:118},{sympt:'severe'},{bolus:[1,2],na:[{t:1,v:121},{t:2,v:124}]});const s=r.steps.find(x=>x.id==='naTrack');return r.stopBolus&&/STOP/.test(s.text)&&/\+6/.test(s.text)?true:s&&s.text;});
t('EL-4b +3 po 1. bolusie → bez STOP',()=>{const r=el({na:118},{sympt:'severe'},{bolus:[1],na:[{t:1,v:121}]});return !r.stopBolus&&/1\/3/.test(r.steps.find(x=>x.id==='naTrack').text)?true:'stop';});
t('EL-4c ostrzeżenie przy ≥ limit−2 (ryzyko ODS, +6 przy limicie 8)',()=>{const r=el({na:104},{sympt:'severe'},{bolus:[1],na:[{t:1,v:110}]});return /zbliża się do limitu 8/.test(r.steps.find(x=>x.id==='naTrack').text)?true:r.steps.find(x=>x.id==='naTrack').text;});
t('EL-5 +11 bez ryzyka → korekta w dół 700 ml G5% w 1 h',()=>{const r=el({na:118},{},{na:[{t:1,v:129}]});const s=r.steps.find(x=>x.id==='relower');return r.over&&s&&/700 ml w 1 h/.test(s.text)&&/desmopresyna 2 µg/i.test(s.text)&&/co 1–2 h/.test(s.text)?true:s&&s.text;});
// --- Anafilaksja (SPEC §12) ---
t('ANA-1 70 kg: 20 µg/ml 17,5–35 ml/h = 5,8–11,7 µg/min',()=>{const r=B.anaRefr(70);const q=r.rec.find(x=>x.conc===20);return q.def&&q.mlhLo===17.5&&q.mlhHi===35&&r.ugminLo.toFixed(1)==='5.8'&&r.ugminHi.toFixed(1)==='11.7'?true:JSON.stringify(q);});
t('ANA-1b RCUK 10 µg/ml = 0,5–1 ml/kg/h; Pompy 100 µg/ml',()=>{const r=B.anaRefr(70);return r.rec.find(x=>x.conc===10).mlhLo===35&&r.rec.find(x=>x.conc===10).mlhHi===70&&r.rec.find(x=>x.conc===100).mlhLo===3.5?true:'x';});
t('ANA-2 β-bloker: glukagon 1–2 mg co 5 min (nie 5–15 µg/min jako schemat główny)',()=>{const g=B.anaGlucagon();return /1–2 mg/.test(g.txt)&&/co 5 min/.test(g.txt)&&!/µg\/min/.test(g.txt)?true:g.txt;});
t('ANA-3 2 dawki, ustąpienie 14:00 → blokada do 20:00',()=>{const o=B.anaObs({doses:2});const u=B.obsUntil('14:00',o.h,new Date('2026-11-09T15:00:00'));return o.h===6&&u.label==='20:00'&&u.active?true:JSON.stringify([o,u]);});
t('ANA-4 wlew adrenaliny → hospitalizacja',()=>B.anaObs({doses:1,infusion:true}).hosp?true:'no hosp');
t('ANA-5 1 dawka + autowstrzykiwacze → 2 h; >2 dawki → 12 h',()=>B.anaObs({doses:1,pens:true}).h===2&&B.anaObs({doses:3}).h===12?true:'x');
// --- Sepsa (SPEC §13) ---
t('SEP-1 2 zestawy → „2/2, 4 butelki”, godziny w podsumowaniu',()=>{const s=CU.summary({bc1:true,bc1t:'10:00',bc2:true,bc2t:'10:05'});return /^2\/2, 4 butelki/.test(s.label)&&s.complete&&s.items.map(x=>x.time).join()==='10:00,10:05'?true:s.label;});
t('SEP-2 pobrane po antybiotyku → adnotacja',()=>{const a=CU.summary({bc1:true,bc1t:'10:40',abxT:'10:30'}),b=CU.summary({afterAbx:true});return a.after&&a.items[0].late&&b.after?true:'x';});
t('SEP-3 PMR → 4 probówki',()=>{const s=CU.summary({csf:true});return s.csf&&s.csfTubes.length===4&&/PCR/.test(s.csfTubes[3].name)?true:'x';});
t('SEP-4 zapalenie wsierdzia → cel 3 zestawy',()=>CU.summary({ie:true,bc1:1,bc2:1}).need===3&&!CU.summary({ie:true,bc1:1,bc2:1}).complete?true:'x');
// --- Neuroinfekcje (SPEC §16) ---
const csf={cells:150,neutPct:10,prot:60,glu:65,sglu:100,lac:1.8,gram:false};
const nt=(cr,cls)=>EC.neuroTreat({age:40,w:70,h:175,sex:'m',crMg:cr,pregnancy:false,betaAllergy:false,csfCls:cls});
t('NEU-1 wzorzec wirusowy → acyklowir pierwszy, 700 mg co 8 h',()=>{const ci=EC.csfInterp(csf);const r=nt(0.9,ci.cls);return ci.cls==='viral'&&r.drugs[0].drug==='Acyklowir'&&r.acv.mg===700&&r.acv.q===8&&/700 mg co 8 h/.test(r.csfMsg)?true:JSON.stringify([ci.cls,r.drugs[0].drug,r.acv]);});
t('NEU-2 CrCl 30 → 700 mg co 12 h',()=>{const r=nt(3.24,'viral');return Math.round(r.acv.crcl)===30&&r.acv.q===12&&r.acv.mg===700&&/700 mg co 12 h/.test(r.drugs[0].dose)?true:JSON.stringify(r.acv);});
t('NEU-2b CrCl <10 → 5 mg/kg co 24 h',()=>{const r=nt(12,'viral');return r.acv.mgkg===5&&r.acv.q===24?true:JSON.stringify(r.acv);});
t('NEU-3 obraz mieszany → acyklowir + ceftriakson',()=>{const r=nt(0.9,'mixed');const d=r.drugs.map(x=>x.drug);return d.includes('Acyklowir')&&d.includes('Ceftriakson')?true:d.join();});
t('NEU-4 bakteryjny bez zapalenia mózgu → bez acyklowiru',()=>{const r=nt(0.9,'bact');return !r.drugs.some(x=>x.drug==='Acyklowir')?true:'acv';});
R.forEach(r=>console.log(r[0].padEnd(70),r[1]));console.log(`\n${pass} PASS, ${fail} FAIL`);process.exit(fail?1:0);
