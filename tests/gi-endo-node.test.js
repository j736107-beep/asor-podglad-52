// Testy parsera gastroskopii i logiki decyzji NVUGIH — node tests/gi-endo-node.test.js
const G=require('../calc/gi-endo.js');
let pass=0,fail=0;const R=[];
function t(id,fn){try{const m=fn();if(m===true){pass++;R.push([id,'PASS']);}else{fail++;R.push([id,'FAIL '+m]);}}catch(e){fail++;R.push([id,'FAIL '+(e.stack||e)]);}}
function near(a,b,eps){return Math.abs(a-b)<(eps||1e-9);}

const CLEAN=G.CLEAN;
const DICT=G.DICTATION;

function expectExample(p,label){
  if(p.lesions.length!==2)return label+' lesions='+p.lesions.length+' '+JSON.stringify(p.lesions,null,2);
  const a=p.lesions[0],b=p.lesions[1];
  if(a.location!=='kąt żołądka')return label+' loc0='+a.location;
  if(a.organ!=='żołądek')return label+' organ0='+a.organ;
  if(a.type!=='owrzodzenie')return label+' type0='+a.type;
  if(a.sizeCm!==2)return label+' size0='+a.sizeCm;
  if(a.forrest!=='IIa')return label+' forrest0='+a.forrest+' inferred='+a.forrestInferred+' note='+a.forrestNote+' snip='+a.rawSnippet;
  if(b.location!=='opuszka dwunastnicy')return label+' loc1='+b.location;
  if(b.organ!=='dwunastnica')return label+' organ1='+b.organ;
  if(b.type!=='owrzodzenie')return label+' type1='+b.type;
  if(b.sizeCm!==1.5)return label+' size1='+b.sizeCm;
  if(b.forrest!=='III')return label+' forrest1='+b.forrest+' snip='+b.rawSnippet;
  if(p.worstForrest!=='IIa')return label+' worst='+p.worstForrest;
  if(p.risk!=='high')return label+' risk='+p.risk;
  const H=p.hemostasis;
  if(!H.apc)return label+' no APC '+JSON.stringify(H);
  if(!H.adrenaline)return label+' no adrenaline '+JSON.stringify(H);
  if(!H.powder)return label+' no powder '+JSON.stringify(H);
  const m=H.methods.join(' | ').toLowerCase();
  if(!/apc/.test(m))return label+' methods no APC: '+H.methods;
  if(!/adrenalin/.test(m))return label+' methods no adr: '+H.methods;
  if(!/proszek|hemospray|tc-325/.test(m))return label+' methods no powder: '+H.methods;
  if(p.intraProceduralBleeding!=='yes')return label+' intra='+p.intraProceduralBleeding;
  if(p.intraControlled!=='yes')return label+' ctrl='+p.intraControlled;
  if(p.finalHemostasis!=='yes')return label+' final='+p.finalHemostasis;
  if(p.varices)return label+' false varices';
  // findings should include gastritis, not as lesions
  if(p.lesions.some(L=>/zapalenie/.test(L.type)))return label+' zapalenie as lesion';
  return true;
}

t('GI-1 parser: czysty opis użytkownika — 2 zmiany, IIa + III, APC+adr+proszek, hemostaza tak',()=>{
  const p=G.parse(CLEAN);
  return expectExample(p,'clean');
});

t('GI-2 parser: surowe dyktando (przebieg, inflację, koncie, Forest 2a/3, półtora) — ten sam wniosek',()=>{
  const p=G.parse(DICT);
  return expectExample(p,'dict');
});

t('GI-3 plan: ścieżka wysokiego ryzyka, PPI 72 h, matematyka pompy lokalnej, flaga proszku, H. pylori',()=>{
  const p=G.parse(CLEAN);
  const pl=G.plan(p,{gbs:5,hb:8.2,cardiac:false});
  if(pl.pathway!=='high')return 'pathway='+pl.pathway;
  if(pl.worstForrest!=='IIa')return 'worst='+pl.worstForrest;
  if(pl.flags.indexOf('powder')<0)return 'no powder flag '+JSON.stringify(pl.flags);
  if(pl.flags.indexOf('large-duodenal')<0 && pl.flags.indexOf('large-ulcer')<0)return 'no large flag '+JSON.stringify(pl.flags);
  const t=pl.ppiText;
  if(!/80 mg/.test(t))return 'no 80 mg';
  if(!/8 mg\/h/.test(t))return 'no 8 mg/h';
  if(!/2 ml\/h/.test(t))return 'no 2 ml/h local';
  if(!/4 mg\/ml/.test(t))return 'no 4 mg/ml';
  if(!/20 ml/.test(t))return 'no 20 ml';
  if(!/40 mg i\.v\. co 12 h/.test(t))return 'no intermittent 40 q12h';
  if(!/72 h/.test(t))return 'no 72 h';
  if(!/2×\/d\. do 14/.test(t))return 'no oral step-down: '+t.slice(-200);
  if(!/ESGE 2021/.test(t))return 'no ESGE';
  if(!/ACG 2021/.test(t))return 'no ACG';
  if(!/Barkun 2019/.test(t))return 'no Barkun';
  if(!/1,6 mg\/ml/.test(t) || !/5 ml\/h/.test(t))return 'should mention 50 ml example as NOT local';
  if(!/nie jest standardem lokalnym/.test(t))return 'should say 50 ml is not local';
  if(!/ChPL nie otwierano ponownie/.test(t))return 'ChPL caveat missing';
  const all=pl.planText+pl.zalecenia+pl.epikryza;
  if(!/H\.\s*pylori/.test(all))return 'no H. pylori';
  if(!/fałszywie ujemn/.test(all))return 'no false-neg';
  if(!/NLPZ/.test(all))return 'no NSAID';
  if(!/second-look/.test(all))return 'no second-look';
  if(!/proszek hemostatyczny|TC-325/.test(all))return 'no powder advice';
  if(!/7 g\/dl/.test(all)||!/8 g\/dl/.test(all))return 'no transfusion thresholds';
  if(!/K25\.0/.test(all)||!/K26\.0/.test(all))return 'no ICD';
  if(!/nie koduj zgadywania/.test(all))return 'no ICD caveat';
  if(pl.epikryza.indexOf(CLEAN)<0)return 'epikryza missing raw description';
  const pump=pl.pump;
  if(!near(pump.conc,4)||!near(pump.mlh,2)||!near(pump.durationH,10))return JSON.stringify(pump);
  if(!near(pump.alt50.conc,1.6)||!near(pump.alt50.mlh,5)||pump.alt50.usedLocally)return 'alt50 '+JSON.stringify(pump.alt50);
  return true;
});

t('GI-4 plan dyktanda = plan czystego opisu (pathway, Forrest, PPI klucz)',()=>{
  const a=G.plan(G.parse(CLEAN));
  const b=G.plan(G.parse(DICT));
  if(a.pathway!==b.pathway)return a.pathway+' vs '+b.pathway;
  if(a.worstForrest!==b.worstForrest)return a.worstForrest+' vs '+b.worstForrest;
  if(a.ppiText!==b.ppiText)return 'ppiText differs';
  if(a.flags.sort().join()!=b.flags.sort().join())return a.flags+' vs '+b.flags;
  return true;
});

t('GI-5 matematyka pompy: 80/20=4, 8/4=2, 20/2=10; 80/50=1.6, 8/1.6=5; 200/50/8=25>12',()=>{
  const p=G.pumpLocal();
  if(!near(p.mg/p.finalMl,4))return 'conc';
  if(!near(p.dose/p.conc,2))return 'mlh';
  if(!near(p.finalMl/p.mlh,10))return 'dur';
  if(!near(80/50,1.6))return '1.6';
  if(!near(8/1.6,5))return '5';
  if(!near(200/8,25))return '25';
  if(!(25>p.stabilityH))return 'stability';
  return true;
});

t('GI-6 FIa, hemostaza nieuzyskana → high-fail, PPI 72 h + eskalacja TAE/chirurgia',()=>{
  const txt='Przełyk bez zmian. W opuszce dwunastnicy owrzodzenie 1 cm z krwawieniem tętniczym tryskającym (Forrest Ia). Podjęto ostrzyknięcie adrenaliną oraz założono klipsy. Krwawienia nie opanowano, hemostazy nie uzyskano.';
  const p=G.parse(txt);
  if(p.lesions.length<1)return 'no lesion '+JSON.stringify(p);
  if(p.lesions[0].forrest!=='Ia')return 'forrest='+p.lesions[0].forrest+' '+p.lesions[0].rawSnippet;
  if(p.finalHemostasis!=='no')return 'final='+p.finalHemostasis;
  if(p.intraControlled==='yes')return 'should not be controlled';
  const pl=G.plan(p);
  if(pl.pathway!=='high-fail')return 'pathway='+pl.pathway;
  if(!/80 mg/.test(pl.ppiText)||!/8 mg\/h/.test(pl.ppiText))return 'no high-dose PPI';
  if(!/TAE/.test(pl.planText+pl.zalecenia))return 'no TAE';
  if(!/chirurg/.test(pl.planText+pl.zalecenia))return 'no surgery';
  return true;
});

t('GI-7 tylko Forrest III → PPI standardowy, wczesne żywienie, wypis przy GBS≤1, bez wlewu 72 h',()=>{
  const txt='Przełyk bez zmian. Żołądek bez zmian. W opuszce dwunastnicy owrzodzenie średnicy 0,8 cm pokryte włóknikiem (Forrest III). Bez krwawienia. Hemostazy endoskopowej nie wykonywano.';
  const p=G.parse(txt);
  if(p.lesions.length!==1)return 'lesions='+p.lesions.length+' '+JSON.stringify(p.lesions);
  if(p.lesions[0].forrest!=='III')return 'F='+p.lesions[0].forrest;
  if(p.risk!=='low')return 'risk='+p.risk;
  if(p.hemostasis.powder||p.hemostasis.apc)return 'invented hemostasis '+JSON.stringify(p.hemostasis);
  const pl=G.plan(p,{gbs:1,gbsLow:true});
  if(pl.pathway!=='low')return 'pathway='+pl.pathway;
  if(/8 mg\/h przez 72/.test(pl.ppiText)&&/wskazany/.test(pl.ppiText)===false){
    // low text says wlew is NOT indicated — that's ok if "nie jest wskazany"
  }
  if(!/nie jest wskazany/.test(pl.ppiText))return 'should say 72h not indicated: '+pl.ppiText;
  if(!/40 mg/.test(pl.ppiText))return 'no standard 40 mg';
  if(!/wypis/.test(pl.planText+pl.zalecenia))return 'no discharge';
  if(!/wczesne żywienie|wczesne zywienie/.test((pl.planText+pl.ppiText).toLowerCase()))return 'no early feeding';
  return true;
});

t('GI-8 żylaki przełyku → ścieżka żylakowa, terlipresyna+antybiotyk, bez PPI 72 h jako leczenia głównego',()=>{
  const txt='W przełyku żylaki III stopnia z czerwonymi znamionami, po krwawieniu. Wykonano ligację (opaskowanie). Żołądek i dwunastnica bez owrzodzeń.';
  const p=G.parse(txt);
  if(!p.varices)return 'varices not flagged '+JSON.stringify(p.lesions);
  const hasV=p.lesions.some(L=>L.type==='żylaki'||/żylak/.test(L.type));
  if(!hasV && !p.varices)return 'no variceal lesion';
  const pl=G.plan(p,{varicesSuspect:true,w:80});
  if(pl.pathway!=='variceal')return 'pathway='+pl.pathway+' lesions='+JSON.stringify(p.lesions);
  if(!/terlipresyn/.test(pl.ppiText))return 'no terlipressin';
  if(!/ceftriakson 1 g/.test(pl.ppiText))return 'no ceftriaxone';
  if(!/NIE jest leczeniem podstawowym/.test(pl.ppiText))return 'should refuse 72h PPI as main: '+pl.ppiText;
  if(!/oktreotyd/i.test(pl.ppiText))return 'mention octreotide pointing to Pompy';
  return true;
});

t('GI-9 badanie prawidłowe — zero zmian, bez wymyślonych Forrest, bez wlewu 72 h',()=>{
  const txt='Przełyk bez zmian. Żołądek podatny na insuflację, jeziorko śluzowe skąpe, przezierne, bez owrzodzeń. Opuszka i część zstępująca dwunastnicy bez zmian.';
  const p=G.parse(txt);
  if(p.lesions.length!==0)return 'invented lesions '+JSON.stringify(p.lesions);
  if(p.worstForrest)return 'invented forrest '+p.worstForrest;
  if(p.hemostasis.methods.length)return 'invented hemostasis';
  const pl=G.plan(p);
  if(pl.pathway!=='normal')return 'pathway='+pl.pathway;
  if(/schemat wysokodawkowy i\.v\. przez 72 h \(cechy wysokiego ryzyka/.test(pl.ppiText))return 'should not be high-dose path';
  return true;
});

t('GI-10 nigdy nie wymyślaj: zapalenie i jeziorko to findings, nie zmiany Forrest',()=>{
  const p=G.parse(CLEAN);
  if(!p.findings.some(f=>/zapalenie/.test(f)))return 'missing gastritis finding '+JSON.stringify(p.findings);
  if(!p.findings.some(f=>/jeziorko/.test(f)))return 'missing jeziorko '+JSON.stringify(p.findings);
  if(!p.findings.some(f=>/przełyk bez zmian/.test(f)))return 'missing esophagus ok';
  if(p.lesions.length!==2)return 'lesion count';
  return true;
});

t('GI-11 Forrest warianty zapisu: F IIa, II a, 2-a, IIa, Forest 2a, Forrest III, Forest 3',()=>{
  const cases=[['Forrest IIa','IIa'],['Forest 2a','IIa'],['F IIa','IIa'],['Forrest II a','IIa'],['Forrest 2-a','IIa'],['Forrest III','III'],['Forest 3','III'],['F2a','IIa'],['forrest iib','IIb'],['Forrest Ia','Ia']];
  for(const [s,exp] of cases){
    const r=G.findForrest(G.normalize('owrzodzenie ('+s+')'));
    if(r.cls!==exp)return s+' → '+JSON.stringify(r)+' expected '+exp;
  }
  return true;
});

t('GI-12 wnioskowanie IIa z „sterczące niekrwawiące naczynie” bez podanej klasy, oznaczone jako inferred',()=>{
  const p=G.parse('Na kącie żołądka owrzodzenie 1 cm, w dnie widoczne sterczące niekrwawiące naczynie. Skoagulowano APC.');
  if(p.lesions.length!==1)return 'n='+p.lesions.length+' '+JSON.stringify(p.lesions);
  if(p.lesions[0].forrest!=='IIa')return 'F='+p.lesions[0].forrest;
  if(!p.lesions[0].forrestInferred)return 'should be marked inferred';
  return true;
});

t('GI-13 z pól edytowanych (korekta lekarza) plan używa poprawionej klasy',()=>{
  const p=G.parse(CLEAN);
  const fields=G.summaryEditableDefaults(p);
  fields.gi_forrest0='III';
  fields.gi_forrest1='III';
  const ed=G.fromFields(Object.assign({gastro:CLEAN},fields));
  const m=G.merge(p,ed);
  if(m.worstForrest!=='III')return 'worst='+m.worstForrest;
  const pl=G.plan(m);
  if(pl.pathway!=='low')return 'pathway='+pl.pathway;
  return true;
});

t('GI-14 epikryza zawiera opis i plan; zalecenia spójne z GBS/Hb',()=>{
  const pl=G.plan(G.parse(DICT),{gbs:8,hb:6.5,cardiac:true});
  if(pl.epikryza.indexOf('WYNIK GASTROSKOPII')<0)return 'no header';
  if(pl.epikryza.indexOf('przebieg bez zmian')<0 && pl.epikryza.indexOf(DICT)<0)return 'no raw dictation';
  if(!/6[,.]5/.test(pl.epikryza+pl.zalecenia))return 'no Hb';
  if(!/próg 8 g\/dl/.test(pl.epikryza+pl.zalecenia))return 'cardiac threshold not applied';
  if(!/Glasgow-Blatchford: 8/.test(pl.epikryza+pl.zalecenia))return 'no GBS';
  return true;
});


t('GI-16 puste sloty 3–4 (size=NaN z inputmode) nie stają się fikcyjnymi zmianami',()=>{
  const p=G.parse(CLEAN);
  const fields=G.summaryEditableDefaults(p);
  fields.gi_size2=NaN; fields.gi_size3=NaN; fields.gi_type2=''; fields.gi_type3='';
  fields.gi_loc2=''; fields.gi_loc3=''; fields.gi_forrest2=''; fields.gi_forrest3='';
  const ed=G.fromFields(Object.assign({gastro:CLEAN},fields));
  if(ed.lesions.length!==2)return 'n='+ed.lesions.length+' '+JSON.stringify(ed.lesions);
  const m=G.merge(p,ed);
  if(m.lesions.length!==2)return 'merge n='+m.lesions.length;
  const pl=G.plan(m);
  if(/3\. inna zmiana/.test(pl.summaryText))return 'invented in summary: '+pl.summaryText;
  if(pl.pathway!=='high')return 'pathway='+pl.pathway;
  return true;
});

t('GI-15 źródła z rokiem: ESGE 2021, ACG 2021, Barkun 2019, ChPL, Baveno VII 2022',()=>{
  const s=G.SRC.join(' ');
  if(!/ESGE Guideline – Update 2021/.test(s)&&!/Endoscopy 2021/.test(s))return 'ESGE';
  if(!/Am J Gastroenterol 2021/.test(s))return 'ACG';
  if(!/Ann Intern Med 2019/.test(s))return 'Barkun';
  if(!/ChPL Pantoprazol/.test(s))return 'ChPL';
  if(!/Baveno VII 2022/.test(s))return 'Baveno';
  return true;
});

console.log(R.map(x=>x[0]+': '+x[1]).join('\n'));
console.log('PASS='+pass+' FAIL='+fail);
process.exit(fail?1:0);
