/* Generuje tests/data/pw51_baseline.json z silnika 5.1 (odczyt ../asor-podglad-51 – tylko do odczytu). */
var path=require('path'),fs=require('fs');var dir=process.argv[2]||path.join(__dirname,'../../../asor-podglad-51/mod/pw');
require(path.join(dir,'config.js'));var E=require(path.join(dir,'engine.js'));var C=require('./pw_cases.js');
global.PW_SAMPLE=null;require(path.join(dir,'sample.js'));C.sample=global.PW_SAMPLE;
var out={};Object.keys(C).forEach(function(k){var o=E.analyze(C[k],{age:'',preg:false,tri:0,years:''});var R={};Object.keys(o.parsed.res).forEach(function(a){var r=o.parsed.res[a];R[a]={n:r.points.length,v:r.points.map(function(p){return Math.round(p.v*1000)/1000;}),unitOk:r.points.map(function(p){return p.unitOk;})};});out[k]={res:R,alerts:o.alerts.map(function(a){return a.sev+'|'+a.text;}),actions:o.actions.length};});
fs.writeFileSync(path.join(__dirname,'pw51_baseline.json'),JSON.stringify(out,null,1));console.log('ok',Object.keys(out));
