// Pilot „Epikryza (AI)” – testy jednostkowe: biała lista (RODO), prompt, zapytanie, parsowanie, błędy. Bez prawdziwych wywołań API.
const A=require('../calc/ai-epi.js'),assert=require('assert');let n=0,f=0;const pend=[];
function t(name,fn){n++;try{const r=fn();if(r&&r.then){pend.push(r.then(()=>console.log('PASS',name),e=>{f++;console.log('FAIL',name,'—',e.message);}));return;}console.log('PASS',name);}catch(e){f++;console.log('FAIL',name,'—',e.message);}}
const IDS={name:'Jan Testowy',pesel:'44051401359',adm:'09.11.2026 23:36'};
const CAPSEV=require('../calc/cap-severity.js');
const i={age:82,sex:'m',rr:32,sbp:95,dbp:60,hr:118,temp:38.9,spo2:84,urea:9.2,na:132,glu:8,ph:7.33,hct:38,pao2:55,pf:240,wbc:15,platelets:210,nursing:false,cancer:false,liver:false,heart:true,stroke:false,renal:false,confusion:true,effusion:false,ventilation:false,vasopressor:false,multilobar:true,fluidHypotension:false,oral:false};
const a=CAPSEV.assess(i),r={curb:a.curb,psi:a.psi,severe:a.severe,assess:a};
// źródło celowo „zatrute” identyfikatorami w każdym możliwym miejscu
const SRC={bar:{age:82,sex:'m',w:78,h:175,crMg:1.3,egfr:52,crcl:41,co:{heart:true},name:'Jan Testowy',pesel:'44051401359',adm:'09.11.2026 23:36',pid:{name:'Jan Testowy'}},
 assess:{i:Object.assign({},i,{name:'Jan Testowy',pesel:'44051401359'}),r},zp:{allergy:'late',o:{asp:true,qt:true},place:'',name:'Jan Testowy'},
 abx:'Proponowane: Ceftriakson 2 g i.v. co 24 h + Klarytromycyna 500 mg i.v. co 12 h (pacjent Jan Testowy, PESEL 44051401359)',
 notes:'Pan Jan Testowy, PESEL 44051401359, przyjęty 09.11.2026 23:36. Testowy zgłosił się z kaszlem i gorączką od 3 dni; tel. 44051401359. JAN TESTOWY.'};
t('Biała lista: brak imienia, nazwiska, PESEL, czasu przyjęcia w ładunku, prompcie i body (OpenAI i Anthropic)',()=>{const P=A.buildPayload(SRC,IDS),js=JSON.stringify(P);
 for(const x of ['Jan','Testowy','44051401359','23:36','09.11.2026','pesel','name'])assert.ok(!new RegExp(x,'i').test(js),'payload zawiera '+x);
 const pr=A.buildPrompt(P);for(const prov of ['openai','anthropic']){const q=A.buildRequest({provider:prov,key:'sk-test-000000000000000000000',model:'m'},pr);const b=q.init.body;
  for(const x of ['Jan','Testowy','44051401359','23:36','09.11.2026'])assert.ok(b.indexOf(x)<0,prov+' body zawiera '+x);assert.ok(A.assertClean(b,IDS));}
 assert.ok(/kaszlem i gorączką od 3 dni/.test(P.notatki_lekarza));});
t('Biała lista: tylko dozwolone klucze najwyższego poziomu; dane kliniczne obecne',()=>{const P=A.buildPayload(SRC,IDS);const ok=['modul','pacjent','parametry','badania','wywiad_PSI','kryteria_ciezkosci','wyniki_programu','antybiotykoterapia','alergia','czynniki_ryzyka','notatki_lekarza','_place'];
 Object.keys(P).forEach(k=>assert.ok(ok.includes(k),k));assert.deepStrictEqual(Object.keys(P.pacjent).sort(),['CrCl_ml_min','eGFR_ml_min_173','kreatynina_mg_dl','masa_kg','obciazenia','plec','wiek_lata','wzrost_cm'].sort());
 assert.strictEqual(P.pacjent.wiek_lata,82);assert.strictEqual(P.parametry['SpO₂ [%]'],84);assert.strictEqual(P._place,'icu');assert.ok(/OIOM \/ OIT/.test(P.wyniki_programu['Miejsce leczenia']));assert.ok(/klasa (IV|V)/.test(P.wyniki_programu['PSI / PORT']));
 assert.ok(/reakcja późna/.test(P.alergia));assert.deepStrictEqual(P.czynniki_ryzyka,['zachłyśnięcie','wydłużony QT']);assert.ok(/Ceftriakson 2 g i\.v\. co 24 h/.test(P.antybiotykoterapia[0]));});
t('assertClean blokuje wysyłkę, gdy identyfikator przecieknie',()=>{assert.throws(()=>A.assertClean('{"x":"Jan Testowy"}',IDS),/Zablokowano/);assert.throws(()=>A.assertClean('{"x":"44051401359"}',IDS),/PESEL/);assert.throws(()=>A.assertClean('{"x":"12345678901"}',{}),/11-cyfrowy/);assert.ok(A.assertClean('{"x":"Jantar"}',IDS));});
t('Prompt: format EPIKRYZA SOR, ICD-10, sekcja zależna od miejsca leczenia, wyniki autorytatywne, bez „brak danych”',()=>{const P=A.buildPayload(SRC,IDS),pr=A.buildPrompt(P);
 for(const x of ['EPIKRYZA','ROZPOZNANIA ICD-10','UWAGI DLA LEKARZA','AUTORYTATYWNE','cytuj je dosłownie','Niczego nie wymyślaj','brak danych','koduj objaw','nie zgaduj kodów'])assert.ok((pr.system+pr.user).includes(x),x);
 assert.strictEqual(pr.section,'UZASADNIENIE PRZEKAZANIA DO OIT');assert.ok(!/ZALECENIA PRZY WYPISIE/.test(pr.system));
 const home=A.buildPayload({bar:{age:30,sex:'f'},assess:{i:{age:30,sex:'f'},r:{assess:{place:'home',reasons:[]},curb:{score:0,complete:true},psi:{score:20,cls:'I',complete:true},severe:{major:[],minor:[]}}}},{});assert.strictEqual(A.buildPrompt(home).section,'ZALECENIA PRZY WYPISIE');assert.ok(/ZALECENIA PRZY WYPISIE/.test(A.buildPrompt(home).system));
 const ward=A.buildPayload({assess:{i:{},r:{assess:{place:'home'}}},zp:{place:'ward'}},{});assert.strictEqual(ward._place,'ward');assert.ok(/wybór lekarza/.test(ward.wyniki_programu['Miejsce leczenia']));const dn=A.buildPayload({assess:{i:{},r:{assess:{place:'ward'}}},zp:{place:'home'}},{});assert.strictEqual(dn._place,'home');assert.ok(/wybór lekarza/.test(dn.wyniki_programu['Miejsce leczenia']));});
t('Zapytanie: OpenAI Chat Completions / Anthropic Messages (nagłówek direct-browser-access), temperatura 0,2',()=>{const pr={system:'S',user:'U'};
 const o=A.buildRequest({provider:'openai',key:'sk-x',model:'gpt-4.1-mini'},pr),ob=JSON.parse(o.init.body);assert.strictEqual(o.url,'https://api.openai.com/v1/chat/completions');assert.strictEqual(o.init.headers.Authorization,'Bearer sk-x');assert.strictEqual(ob.temperature,0.2);assert.strictEqual(ob.messages[0].role,'system');assert.strictEqual(ob.model,'gpt-4.1-mini');
 const c=A.buildRequest({provider:'anthropic',key:'sk-ant',model:'claude-sonnet-5-5'},pr),cb=JSON.parse(c.init.body);assert.strictEqual(c.url,'https://api.anthropic.com/v1/messages');assert.strictEqual(c.init.headers['anthropic-dangerous-direct-browser-access'],'true');assert.strictEqual(c.init.headers['x-api-key'],'sk-ant');assert.strictEqual(c.init.headers['anthropic-version'],'2023-06-01');assert.strictEqual(cb.system,'S');assert.strictEqual(cb.temperature,0.2);assert.ok(cb.max_tokens>0);});
const SAMPLE='**EPIKRYZA**\nPacjent 82 l. przyjęty do SOR z powodu ...\nCiężkie PZP – OIOM / OIT rozważany. PSI klasa V.\n\nROZPOZNANIA ICD-10\nJ18.9 – Zapalenie płuc, nieokreślone\n\nUZASADNIENIE PRZEKAZANIA DO OIT\nSpO₂ 84%.\n\n=====\nUWAGI DLA LEKARZA\n- brak wyniku RTG\n- sprzeczność: ...';
t('Parsowanie: blok do wklejenia oddzielony od UWAG; usunięte znaczniki Markdown; OpenAI i Anthropic',()=>{const P={wyniki_programu:{'Miejsce leczenia':'Ciężkie PZP – OIOM / OIT rozważany','PSI / PORT':'klasa V (140 pkt)'},_place:'icu'};
 const x=A.parse('openai',{choices:[{message:{content:SAMPLE}}]},P);assert.ok(/^EPIKRYZA\n/.test(x.paste));assert.ok(!/UWAGI/.test(x.paste)&&!/=====/.test(x.paste)&&!/\*\*/.test(x.paste));assert.ok(/brak wyniku RTG/.test(x.notes));assert.deepStrictEqual(x.warn,[]);
 const y=A.parse('anthropic',{content:[{type:'text',text:SAMPLE}]},P);assert.strictEqual(y.paste,x.paste);
 const z=A.parse('openai',{choices:[{message:{content:'EPIKRYZA\nx\nROZPOZNANIA ICD-10\nJ18.9\nZALECENIA PRZY WYPISIE\ny'}}]},P);assert.ok(z.warn.length>=2&&/KONTROLA PROGRAMU/.test(z.notes)&&/nie zacytował/.test(z.notes));
 assert.throws(()=>A.parse('openai',{choices:[]},P),/Pusta/);});
t('Błędy po polsku: klucz, quota, limit, sieć, timeout 60 s',()=>{assert.ok(/Nieprawidłowy klucz/.test(A.errorText(null,401,'{}')));assert.ok(/quota/.test(A.errorText(null,429,'{"error":{"message":"You exceeded your current quota"}}')));assert.ok(/Zbyt wiele/.test(A.errorText(null,429,'{}')));
 assert.ok(/Błąd sieci/.test(A.errorText(new TypeError('Failed to fetch'),0)));const ab=new Error('x');ab.name='AbortError';assert.ok(/60 s/.test(A.errorText(ab,0)));assert.strictEqual(A.TIMEOUT,60000);assert.ok(/przeciążony/.test(A.errorText(null,529,'')));});
function res(status,obj){const t=typeof obj==='string'?obj:JSON.stringify(obj);return Promise.resolve({ok:status>=200&&status<300,status,text:()=>Promise.resolve(t)});}
t('call(): sztuczny fetch – sukces, body bez identyfikatorów, ponowienie bez temperatury, 401',async()=>{const P=A.buildPayload(SRC,IDS);let bodies=[];
 const ok=await A.call({provider:'openai',key:'sk-test',model:'gpt-4.1-mini'},P,IDS,(u,init)=>{bodies.push(init.body);return res(200,{model:'gpt-4.1-mini',choices:[{message:{content:SAMPLE}}]});});
 assert.ok(/^EPIKRYZA/.test(ok.paste));assert.ok(!/Testowy|44051401359/.test(bodies.join('')));
 bodies=[];const nt=await A.call({provider:'openai',key:'sk',model:'gpt-5.4-mini'},P,IDS,(u,init)=>{bodies.push(JSON.parse(init.body));return bodies.length===1?res(400,{error:{message:"Unsupported value: 'temperature' does not support 0.2"}}):res(200,{choices:[{message:{content:SAMPLE}}]});});
 assert.ok(nt.noTemp&&bodies.length===2&&bodies[0].temperature===0.2&&bodies[1].temperature===undefined);
 await assert.rejects(A.call({provider:'anthropic',key:'bad',model:'m'},P,IDS,()=>res(401,{error:{type:'authentication_error'}})),/Nieprawidłowy klucz/);
 await assert.rejects(A.call({provider:'openai',key:'k',model:'m'},P,IDS,()=>Promise.reject(new TypeError('Failed to fetch'))),/Błąd sieci/);});
t('Maskowanie klucza',()=>{assert.strictEqual(A.mask('sk-proj-abcdefghijklmnop1234'),'sk-…••••••1234');assert.ok(!A.mask('sk-proj-abcdefghijklmnop1234').includes('abcdef'));});
t('xAI (Grok): domyślny dostawca; POST api.x.ai/v1/chat/completions, Bearer xai-…, format OpenAI, temperatura 0,2, reasoning_effort low tylko dla grok-4.7',()=>{
 assert.strictEqual(A.DEF,'xai');assert.strictEqual(A.provOf(undefined),'xai');assert.strictEqual(A.provOf('zzz'),'xai');assert.strictEqual(A.MODELS.xai[0][0],'grok-4.7');assert.ok(A.MODELS.xai.length>=3);assert.ok(A.HOSTS.includes('api.x.ai'));
 const pr={system:'S',user:'U'};const q=A.buildRequest({key:'xai-abc'},pr),b=JSON.parse(q.init.body);
 assert.strictEqual(q.url,'https://api.x.ai/v1/chat/completions');assert.strictEqual(q.init.method,'POST');assert.strictEqual(q.init.headers.Authorization,'Bearer xai-abc');assert.strictEqual(b.model,'grok-4.7');assert.strictEqual(b.messages[0].role,'system');assert.strictEqual(b.messages[1].content,'U');assert.strictEqual(b.temperature,0.2);assert.strictEqual(b.reasoning_effort,'low');
 const n=JSON.parse(A.buildRequest({provider:'xai',key:'xai-abc',model:'grok-4.20-0309-non-reasoning'},pr).init.body);assert.strictEqual(n.reasoning_effort,undefined);
 const tq=A.testRequest({provider:'xai',key:'xai-abc'});assert.strictEqual(tq.url,'https://api.x.ai/v1/models');assert.strictEqual(tq.init.headers.Authorization,'Bearer xai-abc');
 const P=A.buildPayload(SRC,IDS),bd=A.buildRequest({provider:'xai',key:'xai-k'},A.buildPrompt(P)).init.body;assert.ok(!/Jan|Testowy|44051401359/.test(bd));
 const x=A.parse('xai',{choices:[{message:{content:SAMPLE}}]},null);assert.ok(/^EPIKRYZA/.test(x.paste)&&/brak wyniku RTG/.test(x.notes));});
t('xAI: błędy – 400 „Incorrect API key” (format xAI, error jako tekst) → nieprawidłowy klucz z podpowiedzią xai-; 403 kredyty → brak środków',()=>{
 const e=A.errorText(null,400,'{"code":"invalid-argument","error":"Incorrect API key provided. You can obtain an API key from https://console.x.ai."}');assert.ok(/Nieprawidłowy klucz API \(400\)/.test(e)&&/xai-/.test(e),e);
 assert.ok(/Brak środków/.test(A.errorText(null,403,'{"code":"permission-denied","error":"Your team has no credits or licenses"}')));
 assert.ok(/Błędne zapytanie \(400\): Model not found/.test(A.errorText(null,400,'{"error":"Model not found"}')));});
t('xAI call(): sztuczny fetch – sukces; ponowienie bez reasoning_effort, gdy model go odrzuca',async()=>{const P=A.buildPayload(SRC,IDS);const urls=[],bodies=[];
 const ok=await A.call({provider:'xai',key:'xai-test',model:'grok-4.7'},P,IDS,(u,init)=>{urls.push(u);bodies.push(JSON.parse(init.body));return bodies.length===1?res(400,{error:'Argument not supported: reasoning_effort'}):res(200,{model:'grok-4.7',choices:[{message:{content:SAMPLE}}]});});
 assert.ok(urls.every(u=>u==='https://api.x.ai/v1/chat/completions'));assert.ok(bodies[0].reasoning_effort==='low'&&bodies[1].reasoning_effort===undefined&&ok.noReason&&/^EPIKRYZA/.test(ok.paste));});
Promise.all(pend).then(()=>{console.log('\n'+(n-f)+'/'+n+' PASS');process.exit(f?1:0);});
