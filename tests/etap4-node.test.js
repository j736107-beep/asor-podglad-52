// Etap 4 – testy jednostkowe kalkulatorów (przykłady z publikacji źródłowych lub przeliczone ręcznie z oryginalnych wzorów).
const K=require('../calc/kalk.js');const assert=require('assert');let n=0,f=0;
function t(name,fn){n++;try{fn();console.log('PASS',name);}catch(e){f++;console.log('FAIL',name,'—',e.message);}}
const R=(id,v)=>{const r=K.run(id,v);if(r.err||r.miss)throw Error(JSON.stringify(r));return r;};
const near=(a,b,tol,msg)=>assert.ok(Math.abs(a-b)<=tol,(msg||'')+' '+a+' ≠ '+b+' ±'+tol);
// KARDIOLOGIA
t('SCORE2 – przykład z publikacji (50 l., palacz, SBP 140, TC 5,5, HDL 1,3): M 5,9/14,0, K 4,2/13,7 %',()=>{near(K.score2(50,'m',1,140,5.5,1.3,0,'low')*100,5.9,0.1);near(K.score2(50,'m',1,140,5.5,1.3,0,'vhigh')*100,14.0,0.1);near(K.score2(50,'f',1,140,5.5,1.3,0,'low')*100,4.2,0.1);near(K.score2(50,'f',1,140,5.5,1.3,0,'vhigh')*100,13.7,0.1);});
t('SCORE2 – domyślnie Polska = region wysokiego ryzyka; cukrzyca → komunikat; wiek 35 → błąd',()=>{const r=R('score2',{age:50,sex:'m',smk:true,sbp:140,tc:5.5,hdl:1.3});near(r.n,K.score2(50,'m',1,140,5.5,1.3,0,'high')*100,1e-9);assert.ok(/wysokiego ryzyka \(Polska\)/.test(JSON.stringify(r.rows)));{const e=K.run('score2',{age:50,sex:'m',dm:true,sbp:140,tc:5.5,hdl:1.3});assert.ok(e.err&&/SCORE2-Diabetes/.test(e.err)&&e.link==='score2dm');}assert.ok(K.run('score2',{age:35,sex:'m',sbp:140,tc:5.5,hdl:1.3}).err);});
const CH=require('./data/esc2021_score2_charts.json').regions;
t('SCORE2 vs tabele ESC 2021 (rys. 3), region WYSOKIEGO ryzyka (Polska): 384 komórki 40–69 l., odchylenie ≤1,1 pkt % przy HDL 1,13 (M) / 1,32 (K); ≥90% komórek identycznych po zaokrągleniu',()=>{let n=0,ex=0,mx=0;for(const [a,sex,smk,sbp,nh,v] of CH.high){if(a>=70)continue;const h=sex==='m'?1.13:1.32;const r=K.score2(a,sex,smk,sbp,nh+h,h,0,'high')*100;n++;if(Math.round(r)===v)ex++;mx=Math.max(mx,Math.abs(r-v));}assert.strictEqual(n,384);assert.ok(mx<=1.1,'max '+mx);assert.ok(ex/n>=0.9,ex+'/'+n);});
t('SCORE2 vs tabele ESC 2021 – wszystkie 4 regiony: odchylenie ≤1,1 pkt % (1536 komórek)',()=>{let mx=0,n=0;for(const reg of ['low','mod','high','vhigh'])for(const [a,sex,smk,sbp,nh,v] of CH[reg]){if(a>=70)continue;const h=sex==='m'?1.14:1.34;mx=Math.max(mx,Math.abs(K.score2(a,sex,smk,sbp,nh+h,h,0,reg)*100-v));n++;}assert.strictEqual(n,1536);assert.ok(mx<=1.1,'max '+mx);});
t('SCORE2-OP WSTRZYMANY: brak liczby, komunikat i odesłanie do tabel ESC 2021; SCORE2 dla ≥70 l. nie liczy',()=>{const r=K.run('score2op',{age:75,sex:'m',sbp:150,nhdl:4.5,smk:true});assert.ok(r.suspended&&r.err&&r.v===undefined&&r.n===undefined);assert.ok(/ESC 2021/.test(r.err)&&/wysokiego ryzyka/.test(r.err));assert.ok(K.C.score2op.suspended);assert.ok(typeof K.score2op==='function');const s=K.run('score2',{age:75,sex:'m',sbp:150,tc:5.9,hdl:1.4});assert.ok(s.err&&/WSTRZYMANY/.test(s.err)&&s.n===undefined);});
t('Tabele ESC 2021 – dane SCORE2-OP region wysokiego ryzyka zgodne z publikacją SCORE2-OP (np. M 75–79 l. palący, SBP 140–159, nie-HDL 4,0–4,9 = 34%)',()=>{const c=CH.high.find(x=>x[0]===77&&x[1]==='m'&&x[2]===1&&x[3]===150&&x[4]===4.5);assert.strictEqual(c[5],34);});
t('QTc: QT 400 ms, HR 75 → Bazett 447, Fridericia 431, Framingham 431, Hodges 426',()=>{const r=R('qtc',{qt:400,hr:75});const s=JSON.stringify(r.rows);['447','431','426'].forEach(x=>assert.ok(s.includes(x+' ms'),x));assert.ok(/Framingham[^\]]*431 ms/.test(s));});
t('QTc ≥500 → czerwony',()=>assert.strictEqual(R('qtc',{qt:480,hr:80,sex:'f'}).lvl,'red'));
t('ABI: ramię 140/130, kostka P 120 → 0,86 (choroba tętnic obwodowych)',()=>{const r=R('abi',{bra_r:140,bra_l:130,pt_r:120,dp_r:110});near(r.n,120/140,1e-9);assert.strictEqual(r.lvl,'red');});
t('ABI >1,40 → niediagnostyczny (tętnice niepodatne na ucisk)',()=>assert.ok(/niepodatne/.test(R('abi',{bra_r:120,pt_l:180}).interp)));
t('Duke-ISCVID: 2 duże → pewne; 1 duże + 1 małe → możliwe; 5 małych → pewne',()=>{assert.strictEqual(R('duke',{M_mic:true,M_img:true}).v,'PEWNE IZW');assert.strictEqual(R('duke',{M_mic:true,m_fev:true}).v,'MOŻLIWE IZW');assert.strictEqual(R('duke',{m_pre:true,m_fev:true,m_vas:true,m_imm:true,m_mic:true}).v,'PEWNE IZW');assert.strictEqual(R('duke',{m_fev:true,rej:true}).v,'IZW ODRZUCONE');});
t('HAS-BLED: nadciśnienie + wiek 70 + leki = 3 (wysokie)',()=>{const r=R('hasbled',{h:true,age:70,dr:true});assert.strictEqual(r.n,3);assert.strictEqual(r.lvl,'red');});
// PULMONOLOGIA
t('Light: białko 4,0/7,0 → wysięk; 2/7, LDH 100/300, GGN 250 → przesięk',()=>{assert.strictEqual(R('light',{pp:4,sp:7,pl:100,sl:300,uln:250}).v,'WYSIĘK');assert.strictEqual(R('light',{pp:2,sp:7,pl:100,sl:300,uln:250}).v,'PRZESIĘK');});
t('Light + gradient albumin >1,2 → komentarz o przesięku po diuretykach',()=>assert.ok(/Gradient albumin >1,2/.test(R('light',{pp:3.8,sp:7,pl:100,sl:300,uln:250,pa:1.2,sa:3.0}).interp)));
t('A–a: FiO₂ 21%, PaO₂ 90, PaCO₂ 40, 760 mmHg → 9,7 mmHg; P/F 429',()=>{const r=R('aa',{fio2:21,pao2:90,paco2:40});near(r.n,9.73,0.01);assert.ok(/429/.test(r.v));});
t('ROX: SpO₂ 92, FiO₂ 50%, RR 25 → 7,36',()=>near(R('rox',{spo2:92,fio2:50,rr:25}).n,7.36,0.005));
// GASTRO
t('Rockall przedendoskopowy 60–79 l. + tachykardia = 2; pełny + dx 1 + stygmaty 2 = 5',()=>{assert.strictEqual(R('rockall',{a:'1',sh:'1',co:'0'}).n,2);assert.strictEqual(R('rockall',{a:'1',sh:'1',co:'0',dx:'1',srh:'2'}).n,5);});
t('AIMS65: 5 kryteriów → 5',()=>assert.strictEqual(R('aims65',{al:true,inr:true,ms:true,sbp:true,age:true}).n,5));
t('Child-Pugh: bilirubina 2,5, albumina 3,0, INR 1,5, bez wodobrzusza i encefalopatii → 7 pkt, klasa B',()=>{const r=R('childpugh',{bili:2.5,alb:3.0,inr:1.5,asc:'1',enc:'1'});assert.strictEqual(r.n,7);assert.ok(/klasa B/.test(r.v));});
t('MELD-Na: Cr 1,5, bilirubina 3, INR 1,8, Na 130 → 25',()=>assert.strictEqual(R('meldna',{cr:1.5,bili:3,inr:1.8,na:130}).n,25));
t('MELD-Na: dializa → kreatynina 4; wartości minimalne → 6',()=>{assert.strictEqual(R('meldna',{cr:0.5,bili:0.5,inr:0.9,na:140}).n,6);assert.ok(R('meldna',{cr:1,bili:1,inr:1,na:137,dial:true}).n>=19);});
t('BISAP 3 → wysokie ryzyko',()=>assert.strictEqual(R('bisap',{bun:true,sirs:true,age:true}).lvl,'red'));
// NEFROLOGIA
t('CKD-EPI 2021: M 50 l., Cr 1,0 → 92; K 50 l., Cr 0,7 → 105 (bez współczynnika rasy)',()=>{near(K.ckdepi21(1.0,50,'m'),91.7,0.2);near(K.ckdepi21(0.7,50,'f'),105.3,0.2);});
t('Cockcroft-Gault: 50 l., 70 kg, Cr 1,0, M → 87,5; K ×0,85',()=>{near(K.cg(1.0,50,70,'m'),87.5,0.01);near(K.cg(1.0,50,70,'f'),74.4,0.05);});
t('FENa: UNa 20, PCr 2, PNa 140, UCr 100 → 0,29% (przednerkowe)',()=>{const r=R('fena',{una:20,pcr:2,pna:140,ucr:100});near(r.n,0.2857,0.001);});
t('Osmolalność: Na 140, glukoza 90 mg/dl, mocznik 5 → 290; zmierzona 320 → luka 30',()=>{near(R('osm',{na:140,glu:90,ur:5}).n,290,0.1);const r=R('osm',{na:140,glu:90,ur:5,mo:320});near(r.n,30,0.1);assert.strictEqual(r.lvl,'red');});
t('Luka anionowa: Na 140, Cl 100, HCO₃ 10, albumina 2,0 → 30 / skoryg. 35, delta 1,64',()=>{const r=R('ag',{na:140,cl:100,hco3:10,alb:2.0});near(r.n,35,1e-9);assert.ok(/1,64/.test(JSON.stringify(r.rows)));});
t('Sód: Na 130 + glukoza 600 → Katz 138, Hillier 142',()=>{const s=JSON.stringify(R('na',{na:130,glu:600}).rows);assert.ok(s.includes('138,0'));assert.ok(s.includes('142,0'));});
t('Deficyt wody: Na 160, M 70 kg 40 l. → 6,0 l; K ≥65 l. – współczynnik 0,45',()=>{const s=JSON.stringify(R('na',{na:160,w:70,age:40,sex:'m'}).rows);assert.ok(s.includes('6,0 l'));assert.ok(JSON.stringify(R('na',{na:160,w:70,age:70,sex:'f'}).rows).includes('0,45'));});
t('Wapń skorygowany: Ca 8,0, albumina 2,0 → 9,6 mg/dl',()=>near(R('caCorr',{ca:8.0,alb:2.0}).n,9.6,1e-9));
// HEMATOLOGIA
t('4T: 2+2+1+2 = 7 → wysokie',()=>{const r=R('fourT',{t1:'2',t2:'2',t3:'1',t4:'2'});assert.strictEqual(r.n,7);assert.strictEqual(r.lvl,'red');});
t('ISTH DIC: PLT 40, D-dimer znaczny, PT +4 s, fibrynogen 0,8 → 7 (jawny DIC)',()=>assert.strictEqual(R('dic',{plt:40,dd:'3',pt:4,fib:0.8}).n,7));
t('PLASMIC 7 → wysokie; 4 → niskie',()=>{assert.strictEqual(R('plasmic',{plt:true,hem:true,ca:true,tx:true,mcv:true,inr:true,cr:true}).lvl,'red');assert.strictEqual(R('plasmic',{plt:true,hem:true,ca:true,tx:true}).lvl,'green');});
t('ANC: WBC 5, neutrofile 60% + 5% pałeczk. → 3,25 G/l; 0,4 → ciężka',()=>{near(R('anc',{wbc:5,neu:60,band:5}).n,3.25,1e-9);assert.strictEqual(R('anc',{wbc:1,neu:40}).lvl,'red');});
// NEUROLOGIA
t('Canadian CT Head: wiek 70 → TK (wysokie ryzyko); 40 l. bez czynników → bez TK; wyłączenie',()=>{assert.strictEqual(R('ccthr',{inc:true,age:70}).lvl,'red');assert.strictEqual(R('ccthr',{inc:true,age:40}).lvl,'green');assert.ok(/NIE MA/.test(R('ccthr',{inc:true,exc:true,age:40}).v));assert.strictEqual(R('ccthr',{inc:true,age:40,m2:true}).lvl,'orange');});
t('Canadian C-Spine: 30 l., siedzi na SOR, rotacja 45° → bez obrazowania; parestezje → obrazowanie',()=>{assert.strictEqual(R('ccsr',{age:30,l2:true,rot:true}).lvl,'green');assert.strictEqual(R('ccsr',{age:30,h3:true,l2:true,rot:true}).lvl,'red');assert.strictEqual(R('ccsr',{age:30,rot:true}).lvl,'red');});
t('Ottawa SAH: 30 l. bez kryteriów → wykluczony; 45 l. → diagnostyka',()=>{assert.strictEqual(R('ottawasah',{inc:true,age:30}).lvl,'green');assert.strictEqual(R('ottawasah',{inc:true,age:45}).lvl,'red');});
// ŻChZZ / ZP
t('Wells ZŻG: nowotwór + obrzęk kończyny + łydka >3 cm = 3 (prawdopodobna); z alternatywą −2 = 1',()=>{assert.strictEqual(R('wellsDvt',{ca:true,leg:true,calf:true}).n,3);assert.strictEqual(R('wellsDvt',{ca:true,leg:true,calf:true,alt:true}).lvl,'green');});
t('Wells ZP: objawy ZŻG + HR >100 = 4,5 → prawdopodobna, pośrednie (3-stopniowa)',()=>{const r=R('wellsPe',{dvt:true,hr:true});assert.strictEqual(r.n,4.5);assert.strictEqual(r.lvl,'red');assert.ok(/pośrednie/.test(JSON.stringify(r.rows)));});
t('Genewska: 70 l., HR 100, ból kończyny → pełna 9 (prawdop.), uproszczona 4 (prawdop.)',()=>{assert.strictEqual(R('geneva',{ver:'full',age:70,hr:100,pain:true}).n,9);const s=R('geneva',{ver:'simp',age:70,hr:100,pain:true});assert.strictEqual(s.n,4);assert.strictEqual(s.lvl,'red');assert.strictEqual(R('geneva',{ver:'full',age:40,hr:80}).n,3);});
t('PERC: 30 l., HR 80, SpO₂ 98 → ujemny; brak niskiego prawdopodobieństwa → nie stosować',()=>{assert.strictEqual(R('perc',{low:true,age:30,hr:80,spo2:98}).lvl,'green');assert.ok(/NIE MA/.test(R('perc',{age:30,hr:80,spo2:98}).v));assert.strictEqual(R('perc',{low:true,age:55,hr:80,spo2:98}).lvl,'orange');});
t('YEARS: 0 elementów + D-dimer 900 → wykluczona; 1 element + 600 → angio-TK',()=>{assert.strictEqual(R('years',{dd:900}).lvl,'green');assert.strictEqual(R('years',{hem:true,dd:600}).lvl,'red');assert.strictEqual(R('years',{hem:true,dd:450}).lvl,'green');});
t('YEARS w ciąży (Artemis 2019): ZŻG + USG dodatnia → leczenie; USG ujemna + krwioplucie + DD 0,4 mg/l → wykluczona',()=>{assert.ok(/LECZENIE/.test(R('pregYears',{preg:true,dvt:true,cus:'pos'}).v));const r=R('pregYears',{preg:true,dvt:true,cus:'neg',hem:true,dd:400});assert.strictEqual(r.lvl,'green');assert.ok(K.run('pregYears',{dvt:true,cus:'na',dd:300}).miss);assert.strictEqual(R('pregYears',{preg:true,dd:1200}).lvl,'red');});
// OSTRY BRZUCH
t('Alvarado: wszystkie kryteria = 10; 4 = mało prawdopodobne',()=>{assert.strictEqual(R('alvarado',{mig:true,ano:true,nv:true,rlq:true,reb:true,t:true,wbc:true,shift:true}).n,10);assert.strictEqual(R('alvarado',{rlq:true,wbc:true}).lvl,'green');});
t('AIR: wymioty, ból PDB, otrzewna 2, PMN ≥85%, WBC 10–14,9, CRP ≥50 → 9 (wysokie)',()=>{const r=R('air',{vom:true,rif:true,reb:'2',pmn:'2',wbc:'1',crp:'2'});assert.strictEqual(r.n,9);assert.strictEqual(r.lvl,'red');});
// ENDOKRYNOLOGIA
t('Burch-Wartofsky: 39 °C (20) + pobudzenie (10) + biegunka (10) + HR 125 (15) + AF (10) = 65 → przełom',()=>{const r=R('bwps',{t:'20',cns:'10',gi:'10',hr:'15',hf:'0',af:true});assert.strictEqual(r.n,65);assert.strictEqual(r.lvl,'red');assert.strictEqual(R('bwps',{t:'10',cns:'0',gi:'0',hr:'15',hf:'0'}).lvl,'orange');});
// SEPSA
t('SIRS: 38,5 °C, HR 110, RR 18, WBC 13 → 3/4',()=>assert.strictEqual(R('sirs',{t:38.5,hr:110,rr:18,wbc:13}).n,3));
t('qSOFA 2 → czerwony',()=>assert.strictEqual(R('qsofa',{rr:true,sbp:true}).lvl,'red'));
t('SOFA: P/F 250, PLT 90, bili 1,5, MAP <70, GCS 13, Cr 2,5 → 9; P/F 150 bez wentylacji → 2 pkt',()=>{assert.strictEqual(R('sofa',{pf:250,plt:90,bili:1.5,cv:'1',gcs:13,cr:2.5}).n,9);assert.strictEqual(R('sofa',{pf:150}).n,2);assert.strictEqual(R('sofa',{pf:150,vent:true}).n,3);});
// KONWERSJE
t('GKS (Liu 2013): prednizon 40 mg → metyloprednizolon 32, deksametazon 6, hydrokortyzon 160',()=>{near(R('gks',{from:'pred',dose:40,to:'mp'}).n,32,1e-9);near(R('gks',{from:'pred',dose:40,to:'dex'}).n,6,1e-9);near(R('gks',{from:'pred',dose:40,to:'hc'}).n,160,1e-9);});
t('BZD (Ashton): alprazolam 2 mg → diazepam 40 mg; lorazepam 2 → oksazepam 40',()=>{near(R('bzd',{from:'alp',dose:2,to:'diaz'}).n,40,1e-9);near(R('bzd',{from:'lor',dose:2,to:'oxa'}).n,40,1e-9);});
t('Opioidy: oksykodon 40 mg → morfina 30 mg (−50%); −25% → 45 mg',()=>{near(R('opioid',{from:'oxy',dose:40,to:'mor',red:'50'}).n,30,1e-9);near(R('opioid',{from:'oxy',dose:40,to:'mor',red:'25'}).n,45,1e-9);});
t('Opioidy: morfina 120 mg → plaster 12 µg/h (zaokrąglony w dół); oksykodon 10 mg → poniżej najmniejszego plastra',()=>{assert.ok(/^12 µg\/h/.test(R('opioid',{from:'mor',dose:120,to:'fen'}).v));assert.ok(/poniżej/.test(R('opioid',{from:'oxy',dose:10,to:'fen'}).v));});
t('Opioidy: ostrożność – lek wyjściowy dolny, docelowy górny mnożnik; metadon wyłączony; ≥90 MME ostrzeżenie',()=>{const r=R('opioid',{from:'tram',dose:400,to:'oxy'});near(r.n,400*0.1*0.5/2,1e-9);assert.ok(/Metadon/.test(r.cons));assert.ok(!K.OPI.some(x=>/metadon/.test(x[1])));assert.ok(/≥90/.test(R('opioid',{from:'mor',dose:200,to:'oxy'}).interp));});
// LABORATORIUM
t('Jednostki: glukoza 180 mg/dl → 9,99 mmol/l; kreatynina 1 mg/dl → 88 µmol/l; Ca 10 mg/dl → 2,50 mmol/l',()=>{near(R('units',{an:'glu',dir:'c2s',x:180}).n,9.991,0.002);near(R('units',{an:'crea',dir:'c2s',x:1}).n,88.42,1e-9);near(R('units',{an:'ca',dir:'c2s',x:10}).n,2.495,0.001);});
t('Jednostki: BUN 14 mg/dl → mocznik 5,0 mmol/l i 30 mg/dl; SI→konw.: cholesterol 5 mmol/l → 193 mg/dl; TG 1,7 → 151',()=>{const b=R('units',{an:'bun',dir:'c2s',x:14});near(b.n,5.0,0.01);assert.ok(JSON.stringify(b.rows).includes('30'));near(R('units',{an:'tc',dir:'s2c',x:5}).n,193.35,0.01);near(R('units',{an:'tg',dir:'s2c',x:1.7}).n,150.6,0.1);});
t('Jednostki: wszystkie 21 badań z listy lekarza obecne; Mg 2,431; fosforany 3,097; PTH 0,106; bilirubina 17,1; kw. moczowy 59,48',()=>{const need=['glu','urea','bun','crea','na','k','ca','cai','mg','ua','bili','tc','ldl','hdl','tg','tsh','fer','phos','pth','alb','tp'];need.forEach(k=>assert.ok(K.LAB.find(x=>x[0]===k),k));near(1/K.LAB.find(x=>x[0]==='mg')[4],2.431,1e-9);near(1/K.LAB.find(x=>x[0]==='phos')[4],3.097,1e-9);assert.strictEqual(K.LAB.find(x=>x[0]==='pth')[4],0.106);assert.strictEqual(K.LAB.find(x=>x[0]==='bili')[4],17.1);assert.strictEqual(K.LAB.find(x=>x[0]==='ua')[4],59.48);});
// STRUKTURA
t('Każdy kalkulator: grupa, źródło, rok, ≤6 w grupie, brak danych → lista braków (bez zgadywania)',()=>{const ids=Object.keys(K.C);ids.forEach(id=>{const c=K.C[id];assert.ok(c.src&&c.yr>=1920&&c.yr<=2026,id);});K.G.forEach(g=>assert.ok(g[2].length<=6,g[0]));const all=[].concat(...K.G.map(g=>g[2]));ids.forEach(id=>assert.ok(all.includes(id),id));
 ids.forEach(id=>{if(id==='labtab'||id==='score2op'||id==='duke'||id==='ccsr'||/^(aims65|bisap|plasmic|qsofa|wellsDvt|wellsPe|alvarado)$/.test(id))return;const r=K.run(id,{});assert.ok(r.miss||r.err||/NIE MA/.test(r.v||''),id+' '+JSON.stringify(r).slice(0,80));});});
t('Wymagane kalkulatory z listy lekarza obecne',()=>['pregYears','gks','bzd','abi','duke','score2','qtc','light','bwps','sirs','qsofa','sofa','alvarado','units','caCorr','opioid','air'].forEach(k=>assert.ok(K.C[k],k)));

// ===== 09.11.2026: SCORE2-OP (parametry lekarza) vs tabele, SCORE2-Diabetes, PESI/sPESI, HeartScore =====
t('SCORE2-OP (parametry z publikacji) vs tabele ESC 2021 region wysokiego ryzyka ≥70 l. (256 komórek): systematyczne niedoszacowanie → pozostaje WSTRZYMANY',()=>{
 const st=h=>{let w1=0,o15=0,mx=0,sum=0,sm=0;const cells=CH.high.filter(c=>c[0]>=70);for(const [a,sex,smk,sbp,nh,v] of cells){const H=typeof h==='number'?h:h[sex];const R=Math.floor(K.score2op(a,sex,smk,sbp,nh+H,H,0,'high')*1000)/10;const d=Math.round(R)-v;if(Math.abs(d)<=1)w1++;if(Math.abs(d)>1.5)o15++;mx=Math.max(mx,Math.abs(d));sum+=d;if(sex==='m')sm+=d;}return{n:cells.length,w1,o15,mx,bias:sum/cells.length,biasM:sm/(cells.length/2)};};
 const a=st(1.4),b=st({m:1.13,f:1.32});console.log('   SCORE2-OP HDL 1,4:',JSON.stringify(a),'\n   SCORE2-OP HDL 1,13/1,32:',JSON.stringify(b));
 assert.strictEqual(a.n,256);assert.ok(a.w1/a.n<0.65&&a.o15>=90,'zbyt dobra zgodność – rozważ odblokowanie');assert.ok(a.bias<-1.3&&a.biasM<-1.6);assert.ok(b.mx>=3&&b.bias<-0.6);assert.ok(K.C.score2op.suspended);});
t('SCORE2-Diabetes: przykłady z publikacji (region umiarkowany) M 11/17%, K 8/13% odtworzone',()=>{const r=(s,dx,h,e)=>K.score2dm(60,s,0,140,5.5,1.3,dx,h,e,'mod')*100;near(r('m',60,50,90),10.96,0.05);near(r('m',50,70,60),17.19,0.05);near(r('f',60,50,90),7.59,0.05);near(r('f',50,70,60),12.70,0.05);
 assert.strictEqual(Math.round(r('m',60,50,90)),11);assert.strictEqual(Math.round(r('m',50,70,60)),17);assert.strictEqual(Math.round(r('f',60,50,90)),8);assert.strictEqual(Math.round(r('f',50,70,60)),13);
 const u=R('score2dm',{age:60,sex:'m',sbp:140,tc:5.5,hdl:1.3,dx:60,hba:50,egfr:90,reg:'mod'});assert.strictEqual(u.v,'11,0 %');assert.ok(/ryzyko DUŻE/.test(u.interp));});
t('SCORE2-Diabetes: kategorie, domyślnie region wysokiego ryzyka, HbA1c % → mmol/mol, eGFR z kreatyniny (CKD-EPI 2009), kryteria bardzo dużego ryzyka bez liczenia',()=>{
 near(K.hbaIfcc(7),53.0,0.1);near(K.ckdepi09(1.0,55,'m'),84.3,0.2);near(K.ckdepi09(1.0,55,'f'),63.1,0.3);
 const b={age:60,sex:'m',sbp:140,tc:5.5,hdl:1.3,dx:60,hba:50,egfr:90};const h=R('score2dm',b);near(h.n,Math.round(K.score2dm(60,'m',0,140,5.5,1.3,60,50,90,'high')*1000)/10,1e-9);
 const p=R('score2dm',Object.assign({},b,{hba:undefined,hbap:7}));assert.ok(/7,0% → 53,0 mmol\/mol/.test(JSON.stringify(p.rows)));
 const c=R('score2dm',Object.assign({},b,{egfr:undefined,cr:1.0}));assert.ok(/CKD-EPI 2009/.test(JSON.stringify(c.rows)));
 for(const [x,re] of [[{ascvd:true},/ASCVD/],[{a3:true},/A3/],[{micro:true},/mikronaczyniowa/],[{egfr:40},/<45/],[{egfr:50,a2:true},/A2/]]){const r=R('score2dm',Object.assign({},b,x));assert.ok(r.v==='BARDZO DUŻE'&&re.test(r.interp)&&r.n===undefined,JSON.stringify(x));}
 assert.notStrictEqual(R('score2dm',Object.assign({},b,{egfr:50})).v,'BARDZO DUŻE');assert.ok(K.run('score2dm',Object.assign({},b,{age:72})).err);assert.ok(K.run('score2dm',{}).miss);
 const cat=n=>n<5?'MAŁE':n<10?'UMIARKOWANE':n<20?'DUŻE':'BARDZO DUŻE';for(const age of [40,50,60,69])for(const smk of [false,true]){const r=R('score2dm',Object.assign({},b,{age,smk,dx:Math.min(60,age)}));assert.ok(new RegExp('ryzyko '+cat(r.n)+' ').test(r.interp),age+' '+r.n);}});
t('PESI: przykład 70 l. M, nowotwór, HR 115 → 70+10+30+20 = 130 → klasa V; 50 l. K bez obciążeń → 50 → klasa I; progi 65/85/105/125',()=>{const base={sex:'f',hr:80,sbp:120,rr:16,temp:37,spo2:96};
 const a=R('pesi',{age:70,sex:'m',ca:true,hr:115,sbp:120,rr:16,temp:37,spo2:95});assert.strictEqual(a.n,130);assert.strictEqual(a.cls,'V');assert.ok(/10,0–24,5%/.test(a.interp));
 const b=R('pesi',Object.assign({age:50},base));assert.strictEqual(b.n,50);assert.strictEqual(b.cls,'I');
 [[65,'I'],[66,'II'],[85,'II'],[86,'III'],[105,'III'],[106,'IV'],[125,'IV'],[126,'V']].forEach(([x,k])=>assert.strictEqual(R('pesi',Object.assign({},base,{age:x})).cls,k,String(x)));
 const all=R('pesi',{age:40,sex:'m',ca:true,hf:true,lung:true,hr:110,sbp:99,rr:30,temp:35.9,ams:true,spo2:89});assert.strictEqual(all.n,40+10+30+10+10+20+30+20+20+60+20);
 assert.ok(/III–V/.test(JSON.stringify(a.rows))&&/III–IV/.test(JSON.stringify(a.rows)));assert.ok(/PESI I–II i sPESI 0/.test(a.cons));assert.ok(K.run('pesi',{age:70}).miss);});
t('sPESI: 0 pkt → 1,0% (0,0–2,1); ≥1 → 10,9% (8,5–13,2); niewydolność serca + choroba płuc = 1 pkt łącznie; wiek >80',()=>{const b={age:60,hr:80,sbp:120,spo2:96};
 const z=R('spesi',b);assert.strictEqual(z.n,0);assert.ok(/1,0% \(95% CI 0,0–2,1\)/.test(z.interp));
 assert.strictEqual(R('spesi',Object.assign({},b,{hf:true,lung:true})).n,1);assert.strictEqual(R('spesi',Object.assign({},b,{age:81})).n,1);assert.strictEqual(R('spesi',Object.assign({},b,{age:80})).n,0);
 const a=R('spesi',{age:70,ca:true,hr:115,sbp:120,spo2:95});assert.strictEqual(a.n,2);assert.ok(/10,9% \(95% CI 8,5–13,2\)/.test(a.interp));
 assert.strictEqual(R('spesi',{age:85,ca:true,hf:true,hr:110,sbp:99,spo2:89}).n,6);});
t('HeartScore: link w SCORE2, SCORE2-OP, SCORE2-Diabetes; grupy: SCORE2 razem, PESI/sPESI w grupie ZP',()=>{['score2','score2op','score2dm'].forEach(id=>assert.strictEqual(K.C[id].url,'https://www.heartscore.org/en_GB'));
 const g=id=>K.G.find(x=>x[2].includes(id))[0];assert.strictEqual(g('score2'),'kardr');assert.strictEqual(g('score2dm'),'kardr');assert.strictEqual(g('pesi'),'vtep');assert.strictEqual(g('spesi'),'vtep');});
t('Ostateczny hamulec usunięty: brak mod/hamulec, wypis.js, wpisów w SW/index/shell; bez mechanizmu blokady wypisu',()=>{const fs=require('fs'),P=require('path'),r=f=>fs.readFileSync(P.join(__dirname,'..',f),'utf8');
 assert.ok(!fs.existsSync(P.join(__dirname,'..','mod/hamulec')));assert.ok(!fs.existsSync(P.join(__dirname,'..','wypis.js')));['sw.js','index.html','shell.js'].forEach(f=>assert.ok(!/hamulec|wypis\.js|SORWypis/.test(r(f)),f));
 assert.ok(!fs.existsSync(P.join(__dirname,'..','hold.js')));assert.ok(!fs.existsSync(P.join(__dirname,'..','audio/wypis_alarm.mp3')));const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?(/^(tests|node_modules|\.git|data)$/.test(e.name)?[]:walk(P.join(d,e.name))):/\.(js|html|css|md)$/.test(e.name)?[P.join(d,e.name)]:[]);walk(P.join(__dirname,'..')).forEach(f=>{const t=fs.readFileSync(f,'utf8');assert.ok(!/SORHold|WSTRZYMAJ WYPIS|wstrzymaj wypis|wypis_alarm|holdLamp|holdOv|holdBanner|sk_hold/i.test(t),'pozostałość w '+f);});assert.ok(/return\{html:h,alarm:false\};\}/.test(r('clinical-ui.js')));});
console.log('\n'+(n-f)+'/'+n+' PASS');process.exit(f?1:0);
