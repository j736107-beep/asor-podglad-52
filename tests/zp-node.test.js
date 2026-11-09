// Testy ZP-1…ZP-13 (silnik) – uruchom: node tests/zp-node.test.js
const C=require('../calc/cap-severity.js'),Z=require('../mod/zp/engine.js'),CL=require('../calc/clinical.js');
const N={rr:16,sbp:120,dbp:80,hr:80,temp:37,spo2:97,urea:4,na:140,glu:6,ph:7.4,hct:40,pao2:85,pf:400,wbc:8,platelets:250,nursing:false,cancer:false,liver:false,heart:false,stroke:false,renal:false,confusion:false,effusion:false,multilobar:false,fluidHypotension:false,ventilation:false,vasopressor:false,oral:true};
const P=(o)=>Object.assign({},N,o);
const ks=o=>o.regs.map(r=>r.items.filter(Boolean).map(x=>x.k)).flat();
let pass=0,fail=0;const R=[];
function t(id,fn){try{const m=fn();if(m===true){pass++;R.push([id,'PASS']);}else{fail++;R.push([id,'FAIL '+m]);}}catch(e){fail++;R.push([id,'FAIL '+e.message]);}}
t('ZP-1',()=>{const i=P({age:40,sex:'m',spo2:70});const a=C.assess(i);const o=Z.plan(Object.assign({},i,{allergy:'none'}));const k=ks(o);
 if(a.place!=='icu')return 'place '+a.place;if(!a.homeBlocked)return 'home not blocked';if(o.p!=='icu')return 'plan p '+o.p;
 if(k.some(x=>/^amox$|^amp$/.test(x)))return 'amox/amp present '+k;if(!(k.includes('cftx')||k.includes('cfx')))return 'no cftx/cfx';if(!k.some(x=>/clari|azi/.test(x)))return 'no macrolide';
 if(!CL.capDisposition(i).admit)return 'clinical admit false';return true;});
t('ZP-2',()=>{const i=P({age:30,sex:'f',temp:37.5});const a=C.assess(i);if(!a.psi.step1||a.psi.cls!=='I')return 'psi '+a.psi.cls;if(a.curb.score!==0)return 'curb '+a.curb.score;if(a.place!=='home')return 'place '+a.place+' '+a.reasons;
 const o=Z.plan(Object.assign({},i,{allergy:'none'}));const amox=o.regs.flatMap(r=>r.items).filter(Boolean).find(x=>x.k==='amox');if(!amox)return 'no amox '+ks(o);return /1 g/.test(amox.dose)&&/8 h/.test(amox.q)&&/p\.o/.test(amox.route)?true:'amox '+amox.dose+' '+amox.q+' '+amox.route;});
t('ZP-3',()=>{const a=C.assess(P({age:70,sex:'m',heart:true}));return a.psi.score===80&&a.psi.cls==='III'&&a.curb.score===1&&a.place==='obs'&&!a.homeBlocked?true:JSON.stringify([a.psi.score,a.psi.cls,a.curb.score,a.place]);});
t('ZP-4',()=>{const a=C.assess(P({age:85,sex:'m',cancer:true,ph:7.30}));return a.psi.score===145&&a.psi.cls==='V'&&RANKOK(a.place,'ward')&&a.homeBlocked?true:JSON.stringify([a.psi.score,a.psi.cls,a.place]);});
function RANKOK(p,min){return C.RANK[p]>=C.RANK[min];}
t('ZP-5',()=>{const a=C.assess(P({age:45,sex:'m',rr:32,multilobar:true,confusion:true}));return a.severe.minor.length>=3&&a.place==='icu'&&a.homeBlocked?true:JSON.stringify([a.severe.minor,a.place]);});
t('ZP-6',()=>{const a=C.assess(P({age:45,sex:'m',vasopressor:true}));return a.place==='icu'&&a.icuMandatory&&a.homeBlocked?true:a.place;});
t('ZP-7',()=>{const i=P({});delete i.urea;const a=C.assess(i);const o=Z.plan(Object.assign({},i,{allergy:'none'}));return a.place==='ward'&&a.homeBlocked&&a.missing.length&&o.pDef&&o.p==='ward'?true:JSON.stringify([a.place,a.missing,o.pDef,o.p]);});
t('ZP-9',()=>{const i=P({age:30,sex:'f',spo2:91,place:'home',allergy:'none'});const o=Z.plan(i);return o.p==='ward'&&o.manualRejected&&!C.allowed('home','ward')&&C.allowed('icu','ward')?true:JSON.stringify([o.p,o.manualRejected]);});
t('ZP-10',()=>{const a=C.assess(P({age:30,sex:'f',temp:37.5,spo2:91}));return a.place==='ward'&&a.homeBlocked?true:a.place;});
t('ZP-11',()=>{const o=Z.plan(P({age:40,sex:'m',spo2:70,allergy:'imm'}));const k=ks(o);const bl=['amox','amoxclav_po','amoxclav_iv','amp','cftx','cftx1','cfx','cfur','ptz','cfep','cftz','mero'];if(k.some(x=>bl.includes(x)))return 'beta-lactam '+k;return k.some(x=>/levo|moxi/.test(x))?true:'no FQ '+k;});
t('ZP-13',()=>{const a=C.assess(P({age:50,sex:'f'}));return a.psi.step1&&a.psi.cls==='I'&&a.psi.score===40&&a.place==='home'?true:JSON.stringify([a.psi.step1,a.psi.cls,a.psi.score,a.place]);});
// dodatkowe: frame-only (minimal data) SpO2 70 → OIT, bez amoksycyliny
t('ZP-1b (ramka, dane minimalne)',()=>{const o=Z.plan({age:40,sex:'m',spo2:70,allergy:'none'});const k=ks(o);return o.p==='icu'&&!k.some(x=>/^amox$|^amp$/.test(x))?true:o.p+' '+k;});
t('Skale=ramka (jeden silnik)',()=>{const i=P({age:70,sex:'m',heart:true,spo2:91});return CL.capDisposition(i).place===C.assess(i).place&&Z.plan(Object.assign({},i,{allergy:'none'})).pAuto===C.assess(i).place?true:'mismatch';});
R.forEach(r=>console.log(r[0].padEnd(28),r[1]));console.log('PASS',pass,'FAIL',fail);process.exit(fail?1:0);
