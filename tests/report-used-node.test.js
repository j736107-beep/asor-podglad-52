// Raport zbiorczy: tylko panele faktycznie użyte u tego pacjenta. node tests/report-used-node.test.js
const R=require('../report.js');
let pass=0,fail=0;const T=[];
function t(id,fn){try{const m=fn();if(m===true){pass++;T.push([id,'PASS']);}else{fail++;T.push([id,'FAIL '+m]);}}catch(e){fail++;T.push([id,'FAIL '+(e.stack||e)]);}}

function reset(){R.clearUsed();R.clearSnaps();R.clearPumps();if(R.clearUsed)R.clearUsed();}

t('RU-1 isMeaningful: 0 lub 1 pole = nie, 2 pola = tak',()=>{
  if(R.isMeaningful({n:0,rich:0}))return '0 should be false';
  if(R.isMeaningful({n:1,rich:0}))return '1 field should be false';
  if(!R.isMeaningful({n:2,rich:0}))return '2 fields should be true';
  return true;
});

t('RU-2 isMeaningful: tekst ≥40 znaków wystarcza (gastroskopia)',()=>{
  if(R.isMeaningful({n:1,rich:39}))return '39 should be false without 2 fields';
  if(!R.isMeaningful({n:1,rich:40}))return '40 rich should be true';
  return true;
});

t('RU-3 isMeaningful: akcja Analizuj + ≥1 pole',()=>{
  if(R.isMeaningful({n:0,rich:0},'analizuj'))return 'action alone, no field';
  if(!R.isMeaningful({n:1,rich:0},'analizuj'))return 'action+1 should pass';
  if(!R.isMeaningful({n:0,rich:15},'analizuj'))return 'action+rich10 should pass';
  return true;
});

t('RU-4 diffFrom: domyślne i puste nie liczą się; zmiana dwóch pól tak',()=>{
  const base={urea:'',hb:'',__si:1,mel:false};
  const one={urea:'60',hb:'',__si:1,mel:false};
  const two={urea:'60',hb:'9.5',__si:1,mel:false};
  const emptyToEmpty=R.diffFrom(base,{urea:'',hb:'',__si:1});
  if(emptyToEmpty.n!==0)return 'empty n='+emptyToEmpty.n;
  if(R.diffFrom(base,one).n!==1)return 'one';
  const d=R.diffFrom(base,two);
  if(d.n!==2)return 'two n='+d.n;
  if(!R.isMeaningful(d))return 'two not meaningful';
  // emptying a leftover does not count
  const cleared=R.diffFrom({urea:'60'},{urea:''});
  if(cleared.n!==0)return 'clear should not count n='+cleared.n;
  return true;
});

t('RU-5 leftover snap bez znacznika użycia NIE wchodzi do raportu',()=>{
  reset();
  R.setSnap('ana',{name:'Anafilaksja',ts:Date.now(),text:'Adrenalina 0,5 mg i.m. (wyliczone z domyślnych)'});
  R.setSnap('sepsis',{name:'Sepsa',ts:Date.now(),text:'qSOFA 0'});
  R.setSnap('gib',{name:'Krwawienie z GI',ts:Date.now(),text:'Forrest IIa, Pantoprazol 80 mg'});
  // tylko snaps, żaden used
  const h=R.build();
  if(/Anafilaksja/.test(h)||/Sepsa/.test(h)||/Forrest/.test(h))return 'leftovers included: '+h.slice(0,400);
  if(!/Żaden panel nie został użyty/.test(h))return 'missing empty note: '+h.slice(0,300);
  if(/nie wpisano|nie zaznaczono|Brak danych do wydruku w wybranym/.test(h))return 'old filler: '+h.slice(0,300);
  return true;
});

t('RU-6 tylko GI użyty → raport zawiera wyłącznie GI',()=>{
  reset();
  R.forceBaseline('gib',{urea:'',hb:'',gastro:''});
  R.markUsed('gib',{n:4,rich:200,action:'analizuj'});
  R.setSnap('gib',{name:'Krwawienie z GI',ts:Date.now(),text:'WYNIK GASTROSKOPII\nForrest IIa 2 cm kąt żołądka\nPantoprazol 80 mg i.v., 8 mg/h = 2 ml/h'});
  R.setSnap('ana',{name:'Anafilaksja',ts:Date.now(),text:'Adrenalina (NIE POWINNO BYĆ)'});
  R.setSnap('dka',{name:'Kwasica ketonowa (DKA)',ts:Date.now(),text:'Glukoza (NIE POWINNO BYĆ)'});
  const h=R.build();
  if(!/Forrest IIa/.test(h)||!/Pantoprazol 80 mg/.test(h))return 'GI missing: '+h.slice(0,400);
  if(/Anafilaksja|Adrenalina \(NIE|Kwasica ketonowa|Glukoza \(NIE/.test(h))return 'other panels: '+h;
  if(/Sepsa|Zatrucia|Zatorowość|Troponina|Omdlenie/.test(h))return 'names of unused: '+h;
  return true;
});

t('RU-7 dwa panele użyte → dwa w raporcie',()=>{
  reset();
  R.markUsed('gib',{n:4,rich:100,action:'analizuj'});
  R.setSnap('gib',{name:'Krwawienie z GI',ts:Date.now(),text:'Forrest IIa, pantoprazol'});
  R.markUsed('dka',{n:4,rich:0});
  R.setSnap('dka',{name:'Kwasica ketonowa (DKA) / Stan hiperosmolarny (HHS)',ts:Date.now(),text:'Glukoza 450, pH 7,1, insulina'});
  const h=R.build();
  if(!/Forrest IIa/.test(h))return 'no GI';
  if(!/Glukoza 450/.test(h))return 'no DKA';
  const n=(h.match(/<h3>/g)||[]).length;
  if(n!==2)return 'h3 count='+n+' '+h;
  return true;
});

t('RU-8 nic nie użyte → krótka nota, bez „nie wpisano”, bez nazw paneli',()=>{
  reset();
  const h=R.build();
  if(!/Żaden panel nie został użyty/.test(h))return h.slice(0,400);
  if(/Anafilaksja|Sepsa|Krwawienie z GI|nie wpisano|nie zaznaczono|Dane pacjenta/.test(h))return 'junk: '+h;
  return true;
});

t('RU-9 clearUsed (Następny pacjent) czyści stan i raport znów pusty',()=>{
  reset();
  R.markUsed('gib',{n:4,rich:80,action:'analizuj'});
  R.setSnap('gib',{name:'Krwawienie z GI',ts:Date.now(),text:'Forrest IIa'});
  if(!/Forrest/.test(R.build()))return 'setup';
  R.clearUsed();
  const h=R.build();
  if(/Forrest/.test(h))return 'still there';
  if(!/Żaden panel nie został użyty/.test(h))return 'no note';
  if(R.usedIds().length)return 'usedIds leftover';
  if(Object.keys(R.snaps()).length)return 'snaps leftover';
  return true;
});

t('RU-10 patientHtml: tylko wpisane dane, bez „nie wpisano” / „nie zaznaczono”',()=>{
  reset();
  const h0=R.patientHtml();
  if(h0)return 'empty patient should be empty, got '+h0;
  // without SKS.P, returns ''
  return true;
});

t('RU-11 RULE_TXT opisuje próg 2 pól / 40 znaków / akcję',()=>{
  const s=R.RULE_TXT;
  if(!/dw[aá] pola|dwa pola/.test(s))return 'fields';
  if(!/40 znak/.test(s))return 'rich';
  if(!/Analizuj/.test(s))return 'action';
  if(!/Następny pacjent/.test(s))return 'wipe';
  if(!/trywialne/.test(s))return 'trivial';
  return true;
});

t('RU-12 pojedyncze pole + leftover snaps innych paneli: raport pusty',()=>{
  reset();
  R.forceBaseline('gib',{urea:''});
  // n=1 not marked used
  R.setSnap('gib',{name:'Krwawienie z GI',ts:Date.now(),text:'mocznik 60 (tylko jedno pole)'});
  R.setSnap('ana',{name:'Anafilaksja',ts:Date.now(),text:'wszystko'});
  const h=R.build();
  if(/mocznik|Anafilaksja|wszystko/.test(h))return 'included trivial/leftover: '+h.slice(0,400);
  if(!/Żaden panel nie został użyty/.test(h))return 'no empty note';
  return true;
});

console.log(T.map(x=>x[0]+': '+x[1]).join('\n'));
console.log('PASS='+pass+' FAIL='+fail);
process.exit(fail?1:0);
