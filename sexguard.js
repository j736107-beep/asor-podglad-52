/* 11.11.2026 – płeć globalna (pasek pacjenta) zsynchronizowana z selektorami płci w modułach.
   Mężczyzna (M w pasku LUB w selektorze modułu) → wszystkie pola ciąży / połogu / karmienia (i „młoda kobieta”)
   odznaczone i zablokowane z podpowiedzią „niedostępne dla mężczyzny”; K lub brak płci → ponownie dostępne.
   Ten sam plik działa w powłoce (index.html) i w modułach w ramkach (mod/*). */
(function(){'use strict';var W=window,D=document,TIP='niedostępne dla mężczyzny';
 // kontrolki ciąży we wszystkich modułach (lista jawna; test dymny szuka też po etykiecie „ciąż”)
 var SEL=['.tg[data-c="preg"]','#ci_preg','select#preg','input#preg','#o_preg','[data-o="preg"]','input[data-k="preg"]','#r_preg','#a_preg','#tri','#yrs','#coc','#cy','.kk-chip[data-c="pregYears"]'].join(',');
 function par(){try{return W.parent&&W.parent!==W&&W.parent.SKS?W.parent.SKS:null;}catch(e){return null;}}
 function shellS(){return W.SKS&&W.SKS.P?W.SKS:null;}
 function barSex(){var S=shellS()||par();try{var x=S?S.P().sex:'';return x==='k'?'f':x||'';}catch(e){return'';}}
 // lokalne selektory płci w modułach ramkowych
 var LOC=[
  {get:function(){var b=D.querySelector('[data-sex].on');return b?b.dataset.sex:'';},set:function(x){var b=D.querySelector('[data-sex="'+x+'"]');if(b&&!b.classList.contains('on'))b.click();},has:function(){return !!D.querySelector('[data-sex]');}},
  {get:function(){var b=D.querySelector('.sx.on');return b?b.dataset.s:'';},set:function(x){var b=D.querySelector('.sx[data-s="'+x+'"]');if(b&&!b.classList.contains('on'))b.click();},has:function(){return !!D.querySelector('.sx[data-s]');}},
  {get:function(){var e=D.getElementById('sex');return e&&e.tagName==='SELECT'?e.value:'';},set:function(x){var e=D.getElementById('sex');if(e&&e.value!==x){e.value=x;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}},has:function(){var e=D.getElementById('sex');return !!(e&&e.tagName==='SELECT');}}];
 function loc(){for(var i=0;i<LOC.length;i++)if(LOC[i].has())return LOC[i];return null;}
 var busy=false,lastBar=null;
 // wiek z paska → pole #age w module (tylko gdy puste lub wcześniej przeniesione z paska; własny wpis w module zostaje – nadpisanie lokalne)
 var AK='skAgeBar:'+location.pathname,lastAge=null;try{lastAge=sessionStorage.getItem(AK);}catch(e){}
 function setLast(a){lastAge=a;try{sessionStorage.setItem(AK,a);}catch(e){}}function barAge(){var S=par();try{var a=S?S.P().age:NaN;return isFinite(a)&&a!==''&&a!==null?String(a):'';}catch(e){return null;}}
 function ageSync(){var e=D.getElementById('age');if(!e||e.tagName!=='INPUT')return;var a=barAge();if(a===null||!par())return;var cur=e.value.trim().replace(',','.');
  if(cur===a){if(a!=='')setLast(a);return;}if(cur===''||(lastAge!==null&&cur===lastAge)){if(cur===''&&a==='')return;e.value=a;setLast(a);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));}}
 function localSex(){if(shellS()){var k=D.querySelector('select[data-k="sex"]');return '';}var l=loc();return l?l.get():'';}
 function isMale(){return barSex()==='m'||localSex()==='m';}
 function lockLabel(el,on){var l=el.closest('label');if(l){l.classList.toggle('sk-male-off',on);if(on)l.title=TIP;else if(l.title===TIP)l.removeAttribute('title');}}
 function off(el){
  if(el.tagName==='INPUT'&&(el.type==='checkbox'||el.type==='radio')){if(el.checked){el.checked=false;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}}
  else if(el.tagName==='SELECT'){var v=['none','no'].filter(function(x){return [].some.call(el.options,function(o){return o.value===x;});})[0]||'';if(el.value!==v){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}}
  else if(el.matches('.kk-chip[data-c="pregYears"]')){if(el.classList.contains('on')){var y=D.querySelector('.kk-chip[data-c="years"]');if(y)y.click();}}/* Kalkulatory: YEARS w ciąży → zwykły YEARS */
  else if(el.tagName==='BUTTON'){if(el.classList.contains('on')||el.getAttribute('aria-pressed')==='true'){el.disabled=false;el.click();}}}
 function apply(){if(busy)return;busy=true;try{
  // pasek → moduł (ramka)
  if(!shellS()){var b=barSex(),l=loc();if(l&&b&&b!==l.get())l.set(b);lastBar=b;}
  if(!shellS())ageSync();
  var m=isMale(),re=false;
  [].forEach.call(D.querySelectorAll(SEL),function(el){
   if(m){off(el);if(!el.disabled||el.dataset.skMale!=='1'){if(el.dataset.skMale!=='1'){el.dataset.skTitle=el.getAttribute('title')||'';}el.dataset.skMale='1';el.disabled=true;el.setAttribute('title',TIP);el.setAttribute('aria-disabled','true');el.classList.add('sk-male-off');}lockLabel(el,true);}
   else if(el.dataset.skMale==='1'){el.disabled=false;el.removeAttribute('aria-disabled');if(el.dataset.skTitle)el.setAttribute('title',el.dataset.skTitle);else el.removeAttribute('title');delete el.dataset.skMale;delete el.dataset.skTitle;el.classList.remove('sk-male-off');lockLabel(el,false);
    re=true;}});
  // moduł PW: trymestr / YEARS zależą od pola „Ciąża” – po odblokowaniu niech moduł sam ustali ich dostępność
  if(re){var pg=D.getElementById('preg');if(pg&&pg.type==='checkbox')pg.dispatchEvent(new Event('change',{bubbles:true}));}
  if(shellS())[].forEach.call(D.querySelectorAll('iframe'),function(f){try{f.contentWindow.SKSexGuard&&f.contentWindow.SKSexGuard.apply();}catch(e){}});
 }finally{busy=false;}}
 var t=null;function soon(){clearTimeout(t);t=setTimeout(apply,0);}
 // moduł → pasek: zmiana płci w selektorze modułu (tylko działanie użytkownika, nie synchronizacja)
 function up(){if(busy)return;setTimeout(function(){if(busy)return;var x='';
  if(shellS()){var k=D.activeElement&&D.activeElement.matches&&D.activeElement.matches('select[data-k="sex"]')?D.activeElement:null;x=k?k.value:'';}else{var l=loc();x=l?l.get():'';}
  var S=shellS()||par();if(S&&S.setP&&(x==='m'||x==='f')&&x!==barSex()){S.setP({sex:x});}soon();},0);}
 D.addEventListener('click',function(e){var tg=e.target.closest&&e.target.closest('[data-sex],.sx[data-s]');if(tg)up();soon();},true);
 D.addEventListener('change',function(e){if(e.target&&(e.target.id==='sex'||e.target.matches&&e.target.matches('select[data-k="sex"]')))up();soon();},true);
 D.addEventListener('input',soon,true);
 function obs(){try{new MutationObserver(soon).observe(D.body,{childList:true,subtree:true});}catch(e){}apply();}
 var st=D.createElement('style');st.textContent='.sk-male-off,label.sk-male-off{opacity:.45!important;cursor:not-allowed!important;text-decoration:line-through}button.sk-male-off{pointer-events:auto}';(D.head||D.documentElement).appendChild(st);
 if(D.body)obs();else D.addEventListener('DOMContentLoaded',obs);
 W.SKSexGuard={apply:apply,SEL:SEL,TIP:TIP,isMale:isMale};})();
