// Testy ZP-1…ZP-13 (silnik) – uruchom: node tests/zp-node.test.js
const C=require('../calc/cap-severity.js'),Z=require('../mod/zp/engine.js'),CL=require('../calc/clinical.js');
const N={rr:16,sbp:120,dbp:80,hr:80,temp:37,spo2:97,urea:4,na:140,glu:6,ph:7.4,hct:40,pao2:85,pf:400,wbc:8,platelets:250,nursing:false,cancer:false,liver:false,heart:false,stroke:false,renal:false,confusion:false,effusion:false,multilobar:false,fluidHypotension:false,ventilation:false,vasopressor:false,oral:true};
const P=(o)=>Object.assign({},N,o);
const ks=o=>o.regs.map(r=>r.items.filter(Boolean).map(x=>x.k)).flat();
let pass=0,fail=0;const R=[];
function t(id,fn){try{const m=fn();if(m===true){pass++;R.push([id,'PASS']);}else{fail++;R.push([id,'FAIL '+m]);}}catch(e){fail++;R.push([id,'FAIL '+e.message]);}}
t('ZP-1',()=>{const i=P({age:40,sex:'m',spo2:70});const a=C.assess(i);const o=Z.plan(Object.assign({},i,{allergy:'none'}));const k=ks(o);
 if(a.place!=='icu')return 'place '+a.place;if(a.homeBlocked)return 'home hard-blocked';if(o.p!=='icu')return 'plan p '+o.p;
 if(k.some(x=>/^amox$|^amp$/.test(x)))return 'amox/amp present '+k;if(!(k.includes('cftx')||k.includes('cfx')))return 'no cftx/cfx';if(!k.some(x=>/clari|azi/.test(x)))return 'no macrolide';
 if(!CL.capDisposition(i).admit)return 'clinical admit false';return true;});
t('ZP-2',()=>{const i=P({age:30,sex:'f',temp:37.5});const a=C.assess(i);if(!a.psi.step1||a.psi.cls!=='I')return 'psi '+a.psi.cls;if(a.curb.score!==0)return 'curb '+a.curb.score;if(a.place!=='home')return 'place '+a.place+' '+a.reasons;
 const o=Z.plan(Object.assign({},i,{allergy:'none'}));const amox=o.regs.flatMap(r=>r.items).filter(Boolean).find(x=>x.k==='amox');if(!amox)return 'no amox '+ks(o);return /1 g/.test(amox.dose)&&/8 h/.test(amox.q)&&/p\.o/.test(amox.route)?true:'amox '+amox.dose+' '+amox.q+' '+amox.route;});
t('ZP-3',()=>{const a=C.assess(P({age:70,sex:'m',heart:true}));return a.psi.score===80&&a.psi.cls==='III'&&a.curb.score===1&&a.place==='obs'&&!a.homeBlocked?true:JSON.stringify([a.psi.score,a.psi.cls,a.curb.score,a.place]);});
t('ZP-4',()=>{const a=C.assess(P({age:85,sex:'m',cancer:true,ph:7.30}));return a.psi.score===145&&a.psi.cls==='V'&&RANKOK(a.place,'ward')&&!a.homeBlocked?true:JSON.stringify([a.psi.score,a.psi.cls,a.place]);});
function RANKOK(p,min){return C.RANK[p]>=C.RANK[min];}
t('ZP-5',()=>{const a=C.assess(P({age:45,sex:'m',rr:32,multilobar:true,confusion:true}));return a.severe.minor.length>=3&&a.place==='icu'&&!a.homeBlocked?true:JSON.stringify([a.severe.minor,a.place]);});
t('ZP-6',()=>{const a=C.assess(P({age:45,sex:'m',vasopressor:true}));return a.place==='icu'&&a.icuMandatory&&!a.homeBlocked?true:a.place;});
t('ZP-7',()=>{const i=P({});delete i.urea;const a=C.assess(i);const o=Z.plan(Object.assign({},i,{allergy:'none'}));return a.place==='obs'&&!a.homeBlocked&&a.missing.length&&a.reasons.some(r=>/dane niepełne/.test(r)&&/nie blokuje/.test(r))&&o.p==='home'?true:JSON.stringify([a.place,a.missing,o.p]);});
t('ZP-9',()=>{const i=P({age:30,sex:'f',spo2:91,place:'home',allergy:'none'});const o=Z.plan(i);return o.p==='home'&&!o.manualRejected&&C.allowed('home','ward')&&o.warn.some(w=>/rekomendacja silnika: hospitalizacja/.test(w))&&o.regs.length>0?true:JSON.stringify([o.p,o.manualRejected,o.warn]);});
t('ZP-10',()=>{const a=C.assess(P({age:30,sex:'f',temp:37.5,spo2:91}));return a.place==='ward'&&!a.homeBlocked?true:a.place;});
t('ZP-11',()=>{const o=Z.plan(P({age:40,sex:'m',spo2:70,allergy:'imm'}));const k=ks(o);const bl=['amox','amoxclav_po','amoxclav_iv','amp','cftx','cftx1','cfx','cfur','ptz','cfep','cftz','mero'];if(k.some(x=>bl.includes(x)))return 'beta-lactam '+k;return k.some(x=>/levo|moxi/.test(x))?true:'no FQ '+k;});
t('ZP-13',()=>{const a=C.assess(P({age:50,sex:'f'}));return a.psi.step1&&a.psi.cls==='I'&&a.psi.score===40&&a.place==='home'?true:JSON.stringify([a.psi.step1,a.psi.cls,a.psi.score,a.place]);});
// dodatkowe: frame-only (minimal data) SpO2 70 → OIT, bez amoksycyliny
t('ZP-1b (ramka, dane minimalne)',()=>{const o=Z.plan({age:40,sex:'m',spo2:70,allergy:'none'});const k=ks(o);return o.p==='icu'&&!k.some(x=>/^amox$|^amp$/.test(x))?true:o.p+' '+k;});
t('Skale=ramka (jeden silnik)',()=>{const i=P({age:70,sex:'m',heart:true,spo2:91});return CL.capDisposition(i).place===C.assess(i).place&&Z.plan(Object.assign({},i,{allergy:'none'})).pAuto===C.assess(i).place?true:'mismatch';});

// 11.11.2026: CURB-65 = 2 – rekomendacja, NIE blokada; dom wybieralny z dopasowanym schematem i kontrolą 48–72 h
t('ZP-14 CURB-65 2 → dom możliwy (rekomendacja)',()=>{const i=P({age:70,sex:'m',urea:8});const a=C.assess(i);if(a.curb.score!==2)return 'curb '+a.curb.score;if(a.place!=='obs'||a.homeBlocked)return 'place '+a.place;
 if(!a.reasons.some(r=>/leczenie domowe ze ścisłą kontrolą/.test(r)))return 'no rec text';const o=Z.plan(Object.assign({},i,{place:'home',allergy:'none'}));const k=ks(o);
 return o.p==='home'&&k.includes('amox')&&k.some(x=>/clari|azi|doxy/.test(x))&&o.notes.some(n=>/48–72 h/.test(n))?true:JSON.stringify([o.p,k]);});
t('ZP-15 CURB-65 3 → oddział, 4 → OIT; lekarz może wybrać dom',()=>{const a3=C.assess(P({age:70,sex:'m',urea:8,confusion:true}));const a4=C.assess(P({age:70,sex:'m',urea:8,confusion:true,rr:31}));
 const o=Z.plan(P({age:70,sex:'m',urea:8,confusion:true,rr:31,place:'home',allergy:'none'}));return a3.curb.score===3&&a3.place==='ward'&&a4.curb.score>=4&&a4.place==='icu'&&o.p==='home'&&o.regs.length>0?true:JSON.stringify([a3.curb.score,a3.place,a4.curb.score,a4.place,o.p]);});
t('ZP-16 modyfikatory: CURB 2 + choroby współistniejące / wielopłatowe / warunki socjalne → oddział z uzasadnieniem',()=>{const a=C.assess(P({age:70,sex:'m',urea:8,heart:true}));const b=C.assess(P({age:40,sex:'m',social:true}));const c=C.assess(P({age:40,sex:'m',multilobar:true}));
 return a.place==='ward'&&a.reasons.some(r=>/chorobami współistniejącymi/.test(r))&&b.place==='ward'&&b.reasons.some(r=>/warunków opieki/.test(r))&&c.place==='obs'&&c.reasons.some(r=>/wielopłatowe/.test(r))?true:JSON.stringify([a.place,b.place,c.place]);});
// CrCl Cockcroft–Gault – liczony automatycznie, sprawdzony dwukrotnie (silnik vs niezależny wzór w teście)
const cg=(age,w,crMg,sex)=>Math.round((140-age)*w/(72*crMg)*(sex==='f'?0.85:1));
[[70,80,'1,2','mgdl','m',65],[70,80,106,'umol','m',65],[65,60,0.9,'mgdl','f',59],[45,92,'0,8','mgdl','m',152],[88,54,2.1,'mgdl','f',16],[70,80,106,'mgdl','m',65]].forEach(([age,w,cr,u,sex,exp])=>{
 t('CrCl '+age+' l. '+sex+' '+w+' kg kr '+cr+' '+u,()=>{const c=Z.crcl({age,w,crea:cr,creaU:u,sex});const crMg=(u==='umol'||Number(String(cr).replace(',','.'))>25)?Number(String(cr).replace(',','.'))/88.42:Number(String(cr).replace(',','.'));
  return c.v===exp&&c.v===cg(age,w,crMg,sex)&&/140/.test(c.f||'')?true:JSON.stringify([c.v,exp,cg(age,w,crMg,sex),c.f]);});});
t('CrCl brak płci → lista braków (bez zgadywania)',()=>{const c=Z.crcl({age:70,w:80,crea:1.2});return isNaN(c.v)&&/płeć/.test(c.src)?true:c.src;});
t('CrCl steruje dawką (CrCl 20 vs 90: klarytromycyna i.v. 250 mg co 12 h)',()=>{const a=Z.plan(P({age:40,sex:'m',spo2:89,crclManual:90,allergy:'none'})),b=Z.plan(P({age:40,sex:'m',spo2:89,crclManual:20,allergy:'none'}));const f=o=>o.regs.flatMap(r=>r.items).filter(Boolean).find(x=>x.k==='clari_iv');
 return /bez korekty/.test(f(a).renal)&&/250 mg co 12 h/.test(f(b).renal)?true:f(a).renal+' | '+f(b).renal;});
R.forEach(r=>console.log(r[0].padEnd(28),r[1]));console.log('PASS',pass,'FAIL',fail);process.exit(fail?1:0);
