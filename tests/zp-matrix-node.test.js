// 11.11.2026 – macierz: miejsce (dom/oddział/OIT) × alergia (brak/nienatychmiastowa/natychmiastowa) × KAŻDY modyfikator
// + brak rekomendacji przy pustym formularzu; rekomendacja dopiero po minimum danych. Uruchom: node tests/zp-matrix-node.test.js
const Z=require('../mod/zp/engine.js'),C=require('../calc/cap-severity.js'),CL=require('../calc/clinical.js');
let pass=0,fail=0;const out=[];
function t(id,fn){let m;try{m=fn();}catch(e){m=e.message;}if(m===true){pass++;}else{fail++;out.push('FAIL '+id+' → '+m);}}
const BASE={rr:16,sbp:120,dbp:80,hr:80,temp:37,spo2:97,urea:4,confusion:false,age:50,sex:'m',w:75,crea:1};
const TXT=o=>JSON.stringify([o.regs,o.notes,o.avoid,o.dec,o.warn,o.dur]);
const keys=(o,tier)=>o.regs.filter(r=>!tier||(tier==='pref'?r.tier!=='alt':r.tier===tier)).flatMap(r=>r.items.map(x=>x.k));
const PEN=['amox','amoxclav_po','amoxclav_po4','amoxclav_iv','amp','ampsul','ptz'],BL=PEN.concat(['cftx','cftx1','cfx','cfur','cfep','cftz','mero']);
const ANAER=['amoxclav_po','amoxclav_po4','amoxclav_iv','ampsul','metro','clinda','clinda_po','moxi','ptz','mero'];
const MODS=['comorb','mrsa','pseudo','recent','asp','abscess','empyema','leg','atyp','preg','qt','liver','hd','social'];
const PLACES=['home','ward','icu'],ALL=['none','late','imm'];
// modyfikatory, które zgodnie z wytycznymi NIE zmieniają schematu w danej sytuacji (zmienia się tylko rekomendacja / już pokryte)
const SAME_OK={comorb:['ward','icu'],atyp:['home:late','home:imm','ward','icu'],social:['ward','icu']};
const sameOk=(m,p,al)=>(SAME_OK[m]||[]).some(x=>x===p||x===p+':'+al);
// 1. pusty formularz → brak rekomendacji, brak schematu, „Uzupełnij”
t('pusty formularz: brak rekomendacji',()=>{const a=C.assess({});const o=Z.plan({});return a.place===null&&!a.ready&&/^Uzupełnij: /.test(a.label)&&o.pAuto===null&&!o.regs.length&&o.need.length===2?true:JSON.stringify([a.place,a.label,o.need]);});
t('pusty formularz (Skale): capDisposition bez zielonego „dom”',()=>{const r=CL.capDisposition({});return r.level==='orange'&&!r.admit&&r.place===null&&/^Uzupełnij/.test(r.message)?true:JSON.stringify([r.level,r.place,r.message]);});
t('tylko modyfikatory/booleany bez liczb → brak rekomendacji',()=>{const a=C.assess({confusion:false,comorb:false,asp:true});return a.place===null&&/mocznik/.test(a.label)&&/SpO₂/.test(a.label)?true:a.label;});
t('puste pola nie liczą się jako 0 (CURB-65 niekompletny, brak SpO₂)',()=>{const a=C.assess({confusion:false,urea:'',rr:'',sbp:'',dbp:'',age:'',spo2:''});return a.place===null&&a.curb.missing.length>=4&&!a.curb.complete?true:JSON.stringify(a.curb);});
t('brak samego SpO₂ → brak rekomendacji',()=>{const b=Object.assign({},BASE);delete b.spo2;const a=C.assess(b);return a.place===null&&a.label==='Uzupełnij: SpO₂'?true:a.label;});
t('minimum danych → rekomendacja wyliczona (dom, CURB-65 0)',()=>{const a=C.assess(BASE);return a.ready&&a.place==='home'&&/^Rekomendacja/.test(a.label)?true:a.label;});
t('minimum danych, CURB-65 2 → krótka hospitalizacja LUB dom',()=>{const a=C.assess(Object.assign({},BASE,{age:70,urea:8}));return a.place==='obs'&&a.reasons.some(r=>/ścisłą kontrolą/.test(r))?true:a.place;});
t('brak domyślnego miejsca leczenia i alergii w planie',()=>{const o=Z.plan(BASE);return !o.regs.length&&o.need.some(n=>/miejsce leczenia/.test(n))&&o.need.some(n=>/alergia/.test(n))?true:JSON.stringify(o.need);});
// 2. macierz
PLACES.forEach(p=>ALL.forEach(al=>{const b=Object.assign({},BASE,{place:p,allergy:al});const o0=Z.plan(b);
 t(`baza ${p}/${al}: schemat`,()=>o0.regs.length>0?true:'brak');
 MODS.forEach(m=>{const i=Object.assign({},b,{[m]:true});const o=Z.plan(i),id=`${m} × ${p} × ${al}`;const k=keys(o),kp=keys(o,'pref');
  t(id+': schemat lub DO DECYZJI',()=>o.regs.length||o.dec.length?true:'pusto');
  t(id+': tekst zmienia się (lub zgodnie z wytycznymi bez zmiany)',()=>TXT(o)!==TXT(o0)||sameOk(m,p,al)?true:'bez zmiany');
  if(al==='imm')t(id+': brak β-laktamów (alergia natychmiastowa)',()=>!k.some(x=>BL.includes(x))?true:k.join(','));
  if(al==='late')t(id+': brak penicylin (alergia nienatychmiastowa)',()=>!k.some(x=>PEN.includes(x))?true:k.join(','));
  // NIE sama amoksycylina tam, gdzie nieodpowiednia
  if(['asp','abscess','empyema','pseudo','mrsa','recent','comorb','leg'].includes(m))t(id+': nie „sama amoksycylina”',()=>!(kp.length===1&&kp[0]==='amox')?true:kp.join(','));
  if(['asp','abscess','empyema'].includes(m))t(id+': brak amoksycyliny / ampicyliny bez inhibitora',()=>!k.some(x=>x==='amox'||x==='amp')?true:k.join(','));
  if(m==='abscess'||m==='empyema'){
   t(id+': pokrycie beztlenowców w schemacie preferowanym',()=>kp.some(x=>ANAER.includes(x))?true:kp.join(','));
   t(id+': czas leczenia w tygodniach',()=>/tyg/.test(o.dur)?true:o.dur);
   if(p==='home')t(id+': rekomendacja szpital + DO DECYZJI przy wyborze domu',()=>o.dec.some(d=>/hospitalizacja/.test(d))&&o.warn.some(w=>/rekomendacja silnika: hospitalizacja/.test(w))?true:JSON.stringify([o.dec,o.warn]));
   t(id+': konsultacja / drenaż w uwagach',()=>o.notes.some(n=>/torakochirurg/.test(n))?true:'brak');}
  if(m==='asp'){
   if(al==='none'&&p==='home')t(id+': amoksycylina/klawulanian p.o.',()=>kp.includes('amoxclav_po')?true:kp.join(','));
   if(al==='none'&&p!=='home')t(id+': amoksycylina/klawulanian i.v. LUB ampicylina/sulbaktam',()=>kp.includes('amoxclav_iv')&&kp.includes('ampsul')?true:kp.join(','));
   if(al!=='none'&&p==='home')t(id+': moksyfloksacyna lub klindamycyna p.o.',()=>kp.includes('moxi')&&kp.includes('clinda_po')?true:kp.join(','));
   t(id+': bez rutynowego metronidazolu (brak ropnia)',()=>!kp.includes('metro')?true:kp.join(','));
   t(id+': uwaga – beztlenowce tylko przy ropniu/ropniaku',()=>JSON.stringify(o).includes('ropni')?true:'brak');}
  if(m==='abscess'&&al==='none'&&p!=='home')t(id+': amoks/klaw i.v. LUB amp/sulb; alternatywa ceftriakson + metronidazol',()=>kp.includes('amoxclav_iv')&&kp.includes('ampsul')&&keys(o,'alt').includes('metro')&&keys(o,'alt').includes('cftx1')?true:k.join(','));
  if(m==='abscess'&&al==='late'&&p!=='home')t(id+': ceftriakson + metronidazol; alt. klindamycyna ± cefalosporyna',()=>kp.includes('cftx1')&&kp.includes('metro')&&keys(o,'alt').includes('clinda')?true:k.join(','));
  if(m==='abscess'&&al==='imm')t(id+': klindamycyna dostępna',()=>k.includes('clinda')||k.includes('clinda_po')?true:k.join(','));
  if(m==='pseudo'&&p!=='home'&&al!=='imm')t(id+': β-laktam przeciwpseudomonasowy',()=>kp.some(x=>['ptz','cfep','cftz','mero'].includes(x))?true:kp.join(','));
  if(m==='pseudo'&&p==='home')t(id+': lewofloksacyna (propozycja) zamiast amoksycyliny',()=>k.includes('levo')&&!k.includes('amox')?true:k.join(','));
  if(m==='mrsa'&&!(p==='icu'&&al==='imm'))t(id+': wankomycyna lub linezolid',()=>k.includes('linez')?true:k.join(','));
  if(m==='leg')t(id+': makrolid lub fluorochinolon w schemacie preferowanym',()=>kp.some(x=>/clari|azi|levo|moxi/.test(x))?true:kp.join(','));
  if(m==='social')t(id+': rekomendacja podniesiona do oddziału',()=>C.assess(i).place==='ward'&&C.assess(b).place==='home'?true:C.assess(i).place);
  if(m==='abscess'||m==='empyema')t(id+': rekomendacja podniesiona do oddziału',()=>C.RANK[C.assess(i).place]>=1?true:C.assess(i).place);
 });}));
// 3. dawki skorygowane do CrCl
t('CrCl 20: ropień, oddział – amp/sulb co 12 h, amoks/klaw i.v. 600 mg co 12 h',()=>{const o=Z.plan(Object.assign({},BASE,{place:'ward',allergy:'none',abscess:true,crclManual:20}));const f=k=>o.regs.flatMap(r=>r.items).find(x=>x.k===k);return /co 12 h/.test(f('ampsul').renal)&&/600 mg.*co 12 h/.test(f('amoxclav_iv').renal)?true:f('ampsul').renal+' | '+f('amoxclav_iv').renal;});
t('CrCl 10: amp/sulb co 24 h; CrCl 3: co 48 h; HD: po dializie',()=>{const g=(c,hd)=>Z.plan(Object.assign({},BASE,{place:'ward',allergy:'none',asp:true,crclManual:c,hd:!!hd})).regs.flatMap(r=>r.items).find(x=>x.k==='ampsul').renal;return /co 24 h/.test(g(10))&&/co 48 h/.test(g(3))&&/po dializie/.test(g(NaN,1))?true:[g(10),g(3),g(NaN,1)].join(' | ');});
t('CrCl 20: zachłystowe, dom – postać 500/125 (2 ×/dobę), nie 875/125',()=>{const o=Z.plan(Object.assign({},BASE,{place:'home',allergy:'none',asp:true,crclManual:20}));const k=keys(o);const x=o.regs.flatMap(r=>r.items).find(x=>x.k==='amoxclav_po4');return x&&!k.includes('amoxclav_po')&&/dwa razy/.test(x.renal)?true:k.join(',');});
t('CrCl 90: bez korekty',()=>{const o=Z.plan(Object.assign({},BASE,{place:'ward',allergy:'none',abscess:true,crclManual:90}));return o.regs.flatMap(r=>r.items).filter(x=>x.k==='ampsul'||x.k==='amoxclav_iv').every(x=>/bez korekty/.test(x.renal))?true:'korekta';});
// 4. źródła nowych leków (ChPL w RPL)
t('ChPL: ampicylina/sulbaktam, amoks/klaw 500/125, klindamycyna p.o. – linki RPL',()=>['ampsul','amoxclav_po4','clinda_po'].every(k=>/rejestrymedyczne\.ezdrowie\.gov\.pl\/api\/rpl\/medicinal-products\/\d+\/characteristic/.test(Z.chUrl(k)))?true:'brak');
t('Źródła: Mandell NEJM 2019, Allewelt 2004, Ott 2008, BTS 2023, MSD',()=>['mandell','allewelt','ott','btspl','msd'].every(k=>Z.S[k]&&Z.S[k].url)?true:'brak');
out.forEach(x=>console.log(x));console.log(pass+'/'+(pass+fail)+(fail?' – FAIL':' PASS'));process.exit(fail?1:0);
