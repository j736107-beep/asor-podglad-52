// fix28 (21.11.2026, t58u): telefony pracowni endoskopowej (gastroskopia 3910, 3911) + NAC: ml/h z objętości końcowej worka (rozcieńczalnik + koncentrat NAC 100 mg/ml).
const C=require('../calc/etapC.js');const CP=require('../calc/clin-print.js');const assert=require('assert');const fs=require('fs');const path=require('path');
let n=0,f=0;function t(name,fn){n++;try{fn();console.log('PASS',name);}catch(e){f++;console.log('FAIL',name,'—',e.message);}}
const R=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');const near=(a,b,m)=>assert.ok(Math.abs(a-b)<1e-9,(m||'')+' '+a+' ≠ '+b);
t('Telefony: grupa „diagnostyka” – Pracownia endoskopowa – gastroskopia, wew. 3910 i 3911, godziny pracy pracowni; JSON = JS; wersja 2026-11-21',()=>{
 const D=JSON.parse(R('data/telefony.json'));const g=D.grupy.find(x=>x.id==='diagnostyka');const p=g.pozycje.find(x=>/endoskop/i.test(x.nazwa));
 assert.ok(p&&/gastroskopia/.test(p.nazwa));assert.deepStrictEqual(p.numery.map(x=>x.typ+':'+x.nr+':'+x.opis),['wew:3910:gastroskopia','wew:3911:gastroskopia']);assert.ok(/godzinach pracy pracowni/.test(p.godziny)&&/8:00–15:00/.test(p.godziny));
 assert.strictEqual(D.wersja,'2026-11-21');const J=JSON.parse(R('data/telefony.js').match(/window\.SORTelefony=([\s\S]*)/)[1].trim());assert.deepStrictEqual(J,D);
 const all=[];D.grupy.forEach(g=>g.pozycje.forEach(p=>p.numery.forEach(x=>all.push(x.nr))));assert.strictEqual(all.filter(x=>x==='3910'||x==='3911').length,2,'duplikaty');});
t('Krwawienie z GI: baner pracowni pokazuje numery z Książki (SORTel.endoHtml), bez przepisywania numerów w module',()=>{const c=R('c-ui.js');assert.ok(/SORTel\.endoHtml\(\)/.test(c)&&/data-gi-endo-tel/.test(c));assert.ok(!/3910|3911/.test(c));
 const u=R('telefony-ui.js');assert.ok(/function endoHtml\(\)/.test(u)&&/endoHtml:endoHtml/.test(u));});
t('NAC 80 kg (60 min): 1. worek 120 ml NAC + 200 ml = 320 ml → 320 ml/h; 2. 40 + 500 = 540 ml / 4 h = 135 ml/h; 3. 80 + 1000 = 1080 ml / 16 h = 67,5 ml/h',()=>{
 const p=C.nacPlan({w:80});const b=p.bags.map(x=>[x.mg,x.conc,x.vol,x.tot,x.h,x.mlh]);assert.deepStrictEqual(b,[[12000,120,200,320,1,320],[4000,40,500,540,4,135],[8000,80,1000,1080,16,67.5]]);assert.ok(/rozcieńczalnik \+ objętość koncentratu/.test(p.rateRule));});
t('NAC: mlh = (rozcieńczalnik + NAC) ÷ czas dla każdego worka i masy (20–150 kg, 15/30/60 min); masa >110 kg liczona jak 110 kg; <20 kg – bez objętości i ml/h',()=>{
 for(let w=20;w<=150;w+=5)for(const t1 of [15,30,60]){const p=C.nacPlan({w,t1});p.bags.forEach(b=>{near(b.tot,Math.round((b.vol+b.mg/100)*10)/10,w+'');near(b.mlh,Math.round(b.tot/b.h*10)/10,w+' '+t1);assert.ok(b.mlh>b.vol/b.h);});}
 const q=C.nacPlan({w:80,t1:15});near(q.bags[0].mlh,1280);const k=C.nacPlan({w:130});assert.strictEqual(k.bags[0].mg,16500);near(k.bags[0].tot,365);
 const s=C.nacPlan({w:15});s.bags.forEach(b=>assert.ok(b.vol===undefined&&b.mlh===undefined&&b.tot===undefined));
 const c=C.nacPlan({w:30});near(c.bags[0].tot,145);near(c.bags[0].mlh,145);});
t('SNAP (alternatywa): ta sama reguła – 80 kg: 8000 mg (80 ml) + 200 ml = 280 ml / 2 h = 140 ml/h; 16000 mg (160 ml) + 1000 ml = 1160 ml / 10 h = 116 ml/h',()=>{
 assert.deepStrictEqual(C.nacPlan({w:80}).altBags.map(b=>[b.mg,b.conc,b.vol,b.tot,b.h,b.mlh]),[[8000,80,200,280,2,140],[16000,160,1000,1160,10,116]]);});
t('Wydruk NAC: rozcieńczalnik, objętość końcowa, czas, ml/h + zasada liczenia',()=>{const v={mg:12000,hrs:2};const T={para:{touched:2,g:k=>v[k]}};
 const r=CP.tox({P:{w:80},tabs:T,C}).text;assert.ok(/1\. worek \(nasycenie\): 12 000 mg \(150 mg\/kg\) = 120 ml NAC 100 mg\/ml; rozcieńczalnik \(NaCl 0,9% lub G5%\): 200 ml; objętość końcowa 320 ml; czas 60 min; 320 ml\/h/.test(r),r);
 assert.ok(/2\. worek: 4 000 mg .*objętość końcowa 540 ml; czas 4 h; 135 ml\/h/.test(r)&&/3\. worek: 8 000 mg .*objętość końcowa 1080 ml; czas 16 h; 67,5 ml\/h/.test(r),r);assert.ok(/Zasada: Prędkość \(ml\/h\) liczona z objętości końcowej/.test(r),r);});
t('Ekran NAC: kolumny NAC / rozcieńczalnik / objętość końcowa / czas / prędkość; O programie i SW fix28',()=>{const c=R('c-ui.js');assert.ok(/'Objętość końcowa'/.test(c)&&/data-nac-rule/.test(c)&&/F\(b\.mlh,1\)/.test(c));
 assert.ok(/asor-v52-fix(2[8-9]|[3-9]\d)/.test(R('sw.js')));assert.ok(/telefony endoskopii i prędkość wlewów NAC[^']*320 ml\/h[^']*SW asor-v52-fix28/.test(R('about.js')));});
console.log((n-f)+'/'+n+' PASS'+(f?' – FAIL '+f:''));process.exit(f?1:0);
