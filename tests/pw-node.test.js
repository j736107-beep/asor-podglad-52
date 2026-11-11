/* Przegląd wyników: regresja 5.1 → 5.2 (ta sama wklejka, ten sam wynik) + rozpoznawanie jednostek. node tests/pw-node.test.js */
var path=require('path'),assert=require('assert');var D=path.join(__dirname,'../mod/pw');
require(path.join(D,'config.js'));var E=require(path.join(D,'engine.js'));var C=require('./data/pw_cases.js');require(path.join(D,'sample.js'));C.sample=global.PW_SAMPLE;
var B=require('./data/pw51_baseline.json');var n=0,fail=0;function t(name,fn){n++;try{fn();}catch(e){fail++;console.log('FAIL',name,'\n  ',e.message);}}
Object.keys(B).forEach(function(k){var o=E.analyze(C[k],{age:'',preg:false,tri:0,years:''}),R=o.parsed.res;
 Object.keys(B[k].res).forEach(function(a){var b=B[k].res[a];t(k+'/'+a+' – te same punkty co 5.1',function(){assert(R[a],'brak analitu '+a);assert.strictEqual(R[a].points.length,b.n);
   R[a].points.forEach(function(p,i){if(b.unitOk[i])assert(Math.abs(p.v-b.v[i])<6e-4,'wartość '+p.v+' ≠ 5.1 '+b.v[i]);});});});
 t(k+' – brak „jednostka nierozpoznana”',function(){Object.keys(R).forEach(function(a){R[a].points.forEach(function(p){assert(p.unitOk!==false,a+' '+p.unit);});});});
 t(k+' – wykres możliwy dla każdego analitu z ≥2 pomiarami 5.1',function(){Object.keys(B[k].res).forEach(function(a){if(B[k].res[a].n>=2)assert(R[a].points.length>=2,a);});});
 if(['doctor','tab','sample'].indexOf(k)>=0)t(k+' – alarmy identyczne jak 5.1',function(){assert.deepStrictEqual(o.alerts.map(function(a){return a.sev+'|'+a.text;}),B[k].alerts);});
 else t(k+' – alarmy ⊇ 5.1',function(){var s=o.alerts.map(function(a){return a.sev+'|'+a.text;});var h=function(x){return x.replace(/[^\d]*$/,'');};var s2=s.map(h);B[k].alerts.forEach(function(x){if(!/nierozpoznana/.test(x))assert(s2.indexOf(h(x))>=0,x);});});
});
var U=[['wbc','tys/µl',1],['wbc','tys/ul',1],['wbc','tys./µl',1],['wbc','10^3/µl',1],['wbc','10^3/ul',1],['wbc','x10^3/uL',1],['wbc','10³/µl',1],['wbc','10^9/l',1],['wbc','10*9/l',1],['wbc','G/l',1],['wbc','K/uL',1],['plt','G/L',1],['plt','tys/mm3',1],
 ['hb','g/dl',1],['hb','g/dL',1],['hb','g/l',0.1],['hb','mmol/l',1.611],['crea','mg/dl',1],['crea','µmol/l',1/88.4],['crea','umol/L',1/88.4],['glu','mmol/L',18.016],['glu','mg/dl',1],
 ['trop','ng/l',1],['trop','pg/ml',1],['trop','pg/mL',1],['trop','ng/ml',1000],['trop','ug/l',1000],['crp','mg/l',1],['crp','mg/L',1],['crp','mg/dl',10],['pct','ng/ml',1],['pct','µg/l',1],
 ['ddim','ng/ml',1],['ddim','ng/ml FEU',1],['ddim','µg/l FEU',1],['ddim','ug/l',1],['ddim','mg/l FEU',1000],['ddim','µg/ml FEU',1000],['ddim','ug/ml',1000],['lac','mmol/l',1],['pco2','kPa',7.5006],
 ['alt','U/l',1],['alt','IU/l',1],['na','mmol/l',1],['k','mmol/L',1]];
U.forEach(function(u){t('jednostka '+u[0]+' '+u[1],function(){var f=E.factor(u[0],u[1]);assert(f!=null,'nierozpoznana');assert(Math.abs(f-u[2])<1e-9,f);});});
t('przecinek dziesiętny',function(){var P=E.parse('10.11.2026 08:00\nK 4,5 mmol/l\n11.11.2026 08:00\nK 5,25 mmol/l');assert.deepStrictEqual(P.res.k.points.map(function(p){return p.val;}),[4.5,5.25]);});
t('alias w nawiasie nie jest jednostką',function(){var P=E.parse(C.lis);assert.strictEqual(P.res.wbc.unit,'tys/µl');assert.strictEqual(P.res.na.unit,'mmol/l');assert.strictEqual(P.res.wbc.points[0].hi,10);});
t('różna pisownia tej samej jednostki = ta sama jednostka (wykres z normą)',function(){var P=E.parse(C.exp);assert(P.res.wbc.sameUnit);assert(P.res.plt.sameUnit);});
t('mmol/l → mg/dl glukoza po przeliczeniu',function(){var P=E.parse(C.doctor);var g=P.res.glu.points;assert(Math.abs(g[2].v-9.8*18.016)<1e-6);assert(P.res.glu.sameUnit===false);});
t('nieznana jednostka nadal oznaczana',function(){assert.strictEqual(E.factor('wbc','mln/µl'),null);assert.strictEqual(E.factor('crea','mg%x'),null);});
console.log((n-fail)+'/'+n+' testów OK');process.exit(fail?1:0);
