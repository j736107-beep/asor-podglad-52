// 11.11.2026 (RODO): w kodzie, UI, dokumentacji i testach nie ma numeru identyfikacyjnego pacjenta.
// Wyjątki: historia zmian (about.js – wpisy <li>, README – sekcje „Poprawki …”) oraz blok czyszczący stare zapisy w shell.js (purgeId).
// Uruchom: node tests/rodo-node.test.js
const fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'..');const W=new RegExp('pe'+'sel','i');
const SKIP_DIR=new Set(['.git','node_modules','assets','img','data']);const EXT=/\.(js|html|css|md|json|webmanifest)$/;
let files=[];(function walk(d){for(const f of fs.readdirSync(d)){const p=path.join(d,f),st=fs.statSync(p);if(st.isDirectory()){if(!SKIP_DIR.has(f))walk(p);}else if(EXT.test(f))files.push(p);}})(ROOT);
const hits=[];let readmeLog=false;
for(const p of files){const rel=path.relative(ROOT,p);const L=fs.readFileSync(p,'utf8').split('\n');
 L.forEach((l,i)=>{if(rel==='README.md'&&/^## /.test(l))readmeLog=/^## Poprawki/.test(l);if(!W.test(l))return;
  if(rel==='about.js'&&/<li><b>5\.2 \(testowa/.test(l))return;            // historia zmian
  if(rel==='README.md'&&readmeLog)return;                                  // historia zmian
  if(rel==='shell.js'&&/purgeId|RODO \(11\.11\.2026\)|S0\.removeItem/.test(l))return; // czyszczenie starych zapisów
  hits.push(rel+':'+(i+1)+': '+l.trim().slice(0,120));});}
// dane z paska: SKS.PID() bez numeru; funkcje silników bez numeru
const N=require('../calc/neuro.js');const okN=!Object.keys(N).some(k=>W.test(k));
console.log('Plików sprawdzonych: '+files.length);
if(hits.length)console.log('FAIL – numer identyfikacyjny w:\n  '+hits.join('\n  '));else console.log('PASS brak numeru identyfikacyjnego w kodzie/UI/dokumentacji/testach (poza historią zmian i czyszczeniem)');
console.log(okN?'PASS calc/neuro.js bez funkcji numeru identyfikacyjnego':'FAIL calc/neuro.js eksportuje funkcję numeru');
const pass=(hits.length?0:1)+(okN?1:0);console.log(pass+'/2'+(pass===2?' PASS':' FAIL'));process.exit(pass===2?0:1);
