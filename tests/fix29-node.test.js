// fix29 (21.11.2026, t71u): Kreator przetoczenia KKCz/KKP – ścieżki: ostre GI, przewlekła bez CV, z NS (TACO), PChN dializowana, KKP; ACS, niestabilny, objawy.
const K=require('../calc/transfKr.js');const TB=require('../calc/transfB1.js');const assert=require('assert');const fs=require('fs');const path=require('path');
let n=0,f=0;function t(name,fn){n++;try{fn();console.log('PASS',name);}catch(e){f++;console.log('FAIL',name,'—',e.message);}}
const R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
t('Kroki: kolejne kafelki zależne od poprzednich wyborów; wynik dopiero po komplecie',()=>{
 assert.deepStrictEqual(K.steps({}),['path']);assert.deepStrictEqual(K.steps({path:'acute'}),['path','actx','hb','sym','taco']);
 assert.deepStrictEqual(K.steps({path:'acute',actx:'unstable'}),['path','actx']);assert.deepStrictEqual(K.steps({path:'acute',actx:'gi'}),['path','actx','cv','hb','sym','taco']);
 assert.deepStrictEqual(K.steps({path:'chronic',cgrp:'cv'}),['path','cgrp','cvs','hb','sym','taco']);assert.deepStrictEqual(K.steps({path:'chronic',cgrp:'ckd'}),['path','cgrp','ckd','tx','ckdcv','hb','sym','taco']);
 const p=K.plan({path:'acute',actx:'gi',cv:'no',w:70});assert.ok(!p.done&&p.miss.indexOf('hb')>=0);});
t('Ostre GI bez CV, 70 kg, Hb 6,5: próg ≤7, cel 7–9 (ESGE) → TAK, 2 j. (cel obliczeniowy 8), 140 ml/h (120 min), zakres 140–187',()=>{
 const p=K.plan({path:'acute',actx:'gi',cv:'no',hb:6.5,sym:'no',taco:'no',w:70});assert.ok(p.done);assert.strictEqual(p.dec,'TAK');assert.strictEqual(p.rule.thr,7);assert.strictEqual(p.rule.op,'le');
 assert.strictEqual(p.rule.target,'7–9 g/dl');assert.strictEqual(p.unitsNow,2);assert.strictEqual(p.rate.mlh,140);assert.strictEqual(p.rate.mlhHi,187);assert.ok(p.src.indexOf('ESGE')>=0);
 assert.strictEqual(K.plan({path:'acute',actx:'gi',cv:'no',hb:7,sym:'no',taco:'no',w:70}).dec,'TAK','≤7');assert.strictEqual(K.plan({path:'acute',actx:'gi',cv:'no',hb:7.1,sym:'no',taco:'no',w:70}).dec,'NIE');});
t('Ostre GI z CV: próg ≤8, cel ≥10 (ESGE 2021); Hb 7,8 / 70 kg → 3 j. do 10',()=>{const p=K.plan({path:'acute',actx:'gi',cv:'yes',hb:7.8,sym:'no',taco:'no',w:70});
 assert.strictEqual(p.rule.thr,8);assert.strictEqual(p.rule.target,'≥10 g/dl');assert.strictEqual(p.dec,'TAK');assert.strictEqual(p.unitsTotal,3);});
t('Niestabilność/wstrząs/MTP: przetaczać niezależnie od Hb, tryb szybki (ogrzewacz >50 ml/min), bez ml/h',()=>{const p=K.plan({path:'acute',actx:'unstable',w:70});
 assert.ok(p.done&&p.dec==='TAK'&&p.rule.op==='any');assert.strictEqual(p.rate.mode,'rapid');assert.strictEqual(p.rate.mlh,null);assert.ok(/50 ml\/min/.test(p.rate.txt));assert.ok(/MTP|Masywne/.test(p.text));});
t('Przewlekła bez CV: próg <7 (AABB 2023); Hb 6,8 / 70 kg → 1 j. teraz (cel 8 – orientacyjnie 2 j.), 140 ml/h; Hb 7,5 bez objawów → NIE; z objawami → ROZWAŻ',()=>{
 const p=K.plan({path:'chronic',cgrp:'nocv',hb:6.8,sym:'no',taco:'no',w:70});assert.strictEqual(p.dec,'TAK');assert.strictEqual(p.rule.thr,7);assert.strictEqual(p.unitsNow,1);assert.strictEqual(p.unitsTotal,2);assert.strictEqual(p.rate.mlh,140);
 assert.ok(/NICE NG24/.test(p.hbCtl));assert.strictEqual(K.plan({path:'chronic',cgrp:'nocv',hb:7.5,sym:'no',taco:'no',w:70}).dec,'NIE');assert.strictEqual(K.plan({path:'chronic',cgrp:'nocv',hb:7.5,sym:'yes',taco:'no',w:70}).dec,'ROZWAŻ');});
t('Przewlekła + niewydolność serca: próg <8 (AABB), TACO sugerowane; 80 kg → 80 ml/h, 3,5 h; 60 kg → 1 ml/kg/h przekracza 4 h → 70 ml/h z flagą DO DECYZJI',()=>{
 const a={path:'chronic',cgrp:'cv',cvs:'hf',hb:7.2,sym:'no',taco:'yes',w:80};assert.deepStrictEqual(K.tacoAuto(a),['niewydolność serca']);const p=K.plan(a);
 assert.strictEqual(p.rule.thr,8);assert.strictEqual(p.dec,'TAK');assert.strictEqual(p.unitsNow,1);assert.strictEqual(p.rate.mode,'taco');assert.strictEqual(p.rate.mlh,80);assert.strictEqual(p.rate.min,210);
 assert.ok(p.dd.some(d=>/UpToDate/.test(d)));assert.ok(p.mon.some(m=>/TACO/.test(m)));
 const q=K.plan(Object.assign({},a,{w:60}));assert.strictEqual(q.rate.mlh,70);assert.strictEqual(q.rate.min,240);assert.ok(q.dd.some(d=>/nie mieści/.test(d)));});
t('PChN dializowana: próg orientacyjny <7 (KDIGO bez progu – DO DECYZJI); bez objawów → ROZWAŻ; z objawami → TAK; kandydat do przeszczepu → ROZWAŻ + ostrzeżenie HLA; uwagi ESA/K⁺/dializa',()=>{
 const b={path:'chronic',cgrp:'ckd',ckd:'hd',tx:'no',ckdcv:'no',hb:6.5,taco:'yes',w:80};assert.strictEqual(K.plan(Object.assign({sym:'no'},b)).dec,'ROZWAŻ');
 const p=K.plan(Object.assign({sym:'yes'},b));assert.strictEqual(p.dec,'TAK');assert.strictEqual(p.rule.thr,7);assert.ok(p.dd.some(d=>/KDIGO nie podaje/.test(d)));assert.ok(p.notes.some(x=>/ESA/.test(x))&&p.notes.some(x=>/hemodializy/.test(x)));
 const x=K.plan(Object.assign({sym:'yes'},b,{tx:'yes'}));assert.strictEqual(x.dec,'ROZWAŻ');assert.ok(x.notes.some(v=>/HLA/.test(v)));
 assert.strictEqual(K.plan(Object.assign({sym:'yes'},b,{ckdcv:'yes'})).rule.thr,8);assert.deepStrictEqual(K.tacoAuto(b),['PChN']);});
t('ACS: próg liberalny <10 (MINT 2023 / ACC-AHA 2025) z flagą DO DECYZJI (ESC/AABB bez rekomendacji, NICE 8)',()=>{const p=K.plan({path:'chronic',cgrp:'acs',hb:9.2,sym:'no',taco:'no',w:70});
 assert.strictEqual(p.rule.thr,10);assert.strictEqual(p.dec,'TAK');assert.ok(p.dd.some(d=>/NICE NG24: próg 8/.test(d)));});
t('KKP: progi 10 / 50 / 100 (BSH 2017), 1 dawka terapeutyczna, ≤30 min (Rozp. MZ) z flagą rozbieżności z BSH',()=>{
 assert.strictEqual(K.plt({plt:8,pctx:'proph'}).need,true);assert.strictEqual(K.plt({plt:12,pctx:'proph'}).need,false);assert.strictEqual(K.plt({plt:40,pctx:'bleed'}).need,true);assert.strictEqual(K.plt({plt:80,pctx:'cns'}).t,100);
 const p=K.plan({plt:30,pctx:'bleed'});assert.ok(p.kkp&&p.kkp.need&&/1 dawka terapeutyczna/.test(p.kkp.txt)&&/≤30 min/.test(p.kkp.txt));assert.ok(p.dd.some(d=>/BSH 30–60/.test(d)));
 const T=require('../calc/transf.js');[[8,''],[40,'bleed'],[90,'cns']].forEach(([v,c])=>assert.strictEqual(K.plt({plt:v,pctx:c||'proph'}).t,T.plt(v,c).t));});
t('Jednostki = wspólny przelicznik aplikacji (SK.transfB1.rbcUnitsW, 4 ml/kg, 280 ml); objętość z etykiety zmienia przyrost i ml/h',()=>{
 for(const w of [50,70,90,110])for(const hb of [5,6,6.5]){const p=K.plan({path:'acute',actx:'other',cv:'no',hb,sym:'no',taco:'no',w});assert.strictEqual(p.unitsTotal,TB.rbcUnitsW(hb,8,w).units,w+' '+hb);}
 const q=K.plan({path:'chronic',cgrp:'nocv',hb:6,sym:'no',taco:'no',w:70,uml:320});assert.strictEqual(q.rate.mlh,160);assert.ok(Math.abs(q.inc-320/280)<1e-9);assert.ok(/z etykiety/.test(q.text));});
t('Tekst do skopiowania: decyzja, próg, jednostki, ml/h, monitorowanie (przed/15 min/po), kontrola Hb, „Decyzja i zlecenie – lekarz”',()=>{const x=K.plan({path:'acute',actx:'gi',cv:'no',hb:6.5,sym:'no',taco:'no',w:70}).text;
 assert.ok(/PRZETOCZ KKCz/.test(x)&&/próg ≤7 g\/dl/.test(x)&&/2 j\. teraz/.test(x)&&/140 ml\/h/.test(x)&&/po 15 min/.test(x)&&/Kontrola Hb/.test(x)&&/Decyzja i zlecenie – lekarz/.test(x),x);});
t('Integracja: zakładka kr w Transfuzjologii, skrypty w index.html przed mods4.js, SW fix29 z plikami, O programie',()=>{const m=R('mods4.js');assert.ok(/\['kr','🧭 Kreator przetoczenia'\]/.test(m)&&/SKKR\.form\(\)/.test(m)&&/SKKR\.calc\(g,P\)/.test(m));
 const h=R('index.html');assert.ok(h.indexOf('calc/transfKr.js')>h.indexOf('calc/transfB1.js')&&h.indexOf('transf-kr-ui.js')<h.indexOf('mods4.js'));
 const sw=R('sw.js');assert.ok(/asor-v52-fix(29|[3-9]\d)/.test(sw)&&/"calc\/transfKr\.js"/.test(sw)&&/"transf-kr-ui\.js"/.test(sw));assert.ok(/Kreator przetoczenia KKCz\/KKP[^']*SW asor-v52-fix29/.test(R('about.js')));});
t('Konwencja KKCz w module GI bez zmian (próg 7 / 8 w ch. s-n)',()=>{assert.ok(/Cel „≥10 g\/dl” nie jest standardem/.test(R('calc/gi-endo.js'))||/≥10/.test(R('mods3.js')));});
console.log((n-f)+'/'+n+' PASS'+(f?' – FAIL '+f:''));process.exit(f?1:0);
