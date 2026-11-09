// Testy etapu 3 (5.2): rysunki EKG – uruchom: node tests/etap3-node.test.js
const E=require('../mod/troponina/ecg-svg.js');let n=0,f=0;const t=(m,c)=>{n++;if(!c){f++;console.log('FAIL',m)}else console.log('ok',m)};
const keys=['stemi','inf','rv','post','dew','avr','wellA','wellB','std','ti','lbbb','pace','nonsp','lvh','norm','sgar1','sgar2','sgar3'];
for(const k of keys){t('wzór '+k,!!E.P[k]);const s=E.svg(E.P[k].leads||E.P[k],E.P[k].opts||{});t('svg '+k,/^<svg class="ecg-svg"/.test(s)&&/<polyline/.test(s)&&!/NaN|undefined/.test(s));}
t('skala 10 px/mm',E.K===10);
console.log(n-f+'/'+n);process.exit(f?1:0);
