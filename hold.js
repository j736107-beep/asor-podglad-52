/* Asystent SOR 5.2 (testowa, 09.11.2026) – wspólny alarm „WSTRZYMAJ WYPIS” dla wszystkich modułów (SPEC P1, wariant B).
   - moduł zgłasza przyczyny: SORHold.set(klucz, [przyczyny], nazwaModułu); brak przyczyn → SORHold.clear(klucz)
   - duża migająca czerwona lampa + czerwony pasek widoczne do „Następny pacjent”
   - nakładka z dźwiękiem (ton z Ustawień + głos) powtarzanym do potwierdzenia; nowa przyczyna = alarm od nowa
   - potwierdzenie NIE wyłącza lampy/paska i NIE blokuje „Następny pacjent”; wpis trafia do wydruku.
   Progi kliniczne wyzwalaczy zaakceptowane przez lekarza 09.11.2026. Troponina: alarm dopiero po wpisaniu EKG lub troponiny. */
(function(){'use strict';
var KEY='sk_hold',st=load(),timer=null,voice=null,muted=false;
function load(){try{var o=JSON.parse(sessionStorage.getItem(KEY)||'null');if(o&&o.items)return o;}catch(e){}return{items:{},log:[]};}
function save(){try{sessionStorage.setItem(KEY,JSON.stringify(st));}catch(e){}}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function now(){var d=new Date();function p(n){return (n<10?'0':'')+n;}return p(d.getDate())+'.'+p(d.getMonth()+1)+'.'+d.getFullYear()+' '+p(d.getHours())+':'+p(d.getMinutes());}
function keys(){return Object.keys(st.items);}
function unacked(){return keys().filter(function(k){return !st.items[k].ack;});}
function set(key,reasons,mod){reasons=(reasons||[]).filter(Boolean).map(String);if(!reasons.length){clear(key);return;}
 var old=st.items[key],fresh=!old||reasons.some(function(r){return old.reasons.indexOf(r)<0;});
 if(!fresh&&old.reasons.length===reasons.length)return; // bez zmian
 st.items[key]={mod:mod||key,reasons:reasons,ts:old&&!fresh?old.ts:now(),ack:fresh?false:old.ack,ackTs:fresh?'':old.ackTs};
 if(fresh)st.log.push({t:now(),mod:mod||key,txt:reasons.join('; ')});
 save();paint();if(fresh)alarmOn();}
function clear(key){if(!st.items[key])return;delete st.items[key];save();paint();if(!unacked().length)soundStop();}
function ack(){var t=now();keys().forEach(function(k){if(!st.items[k].ack){st.items[k].ack=true;st.items[k].ackTs=t;}});st.log.push({t:t,mod:'—',txt:'Potwierdzono: pacjent NIE zostanie wypisany do domu'});save();soundStop();paint();}
function reset(){st={items:{},log:[]};try{sessionStorage.removeItem(KEY);}catch(e){}soundStop();paint();}
// ---------- dźwięk: ton z Ustawień (SORSound) + komunikat głosowy, powtarzane co 12 s do potwierdzenia ----------
function S(){return (window.SKS&&SKS.S)||{sound:true,vol:0.7,tone:'bells'};}
function cycle(){var s=S();if(muted||s.sound===false)return;try{window.SORSound&&SORSound.play(s.tone||'bells',s.vol,{repeat:2});}catch(e){}
 setTimeout(function(){if(!unacked().length||muted)return;try{if(!voice){voice=new Audio('audio/wypis_alarm.mp3');}voice.currentTime=0;voice.volume=Math.max(.3,+s.vol||.7);var p=voice.play();if(p&&p.catch)p.catch(function(){});}catch(e){}},3500);}
function alarmOn(){soundStop();cycle();timer=setInterval(function(){if(unacked().length)cycle();else soundStop();},12000);}
function soundStop(){clearInterval(timer);timer=null;try{window.SORSound&&SORSound.stop();}catch(e){}try{voice&&voice.pause();}catch(e){}}
// ---------- widok ----------
function el(id,tag,parent){var e=document.getElementById(id);if(!e){e=document.createElement(tag||'div');e.id=id;(parent||document.body).appendChild(e);}return e;}
function paint(){if(!document.body)return;var K=keys(),on=K.length>0,un=unacked();
 document.documentElement.classList.toggle('hold-on',on);
 var lamp=el('holdLamp','button');lamp.type='button';lamp.hidden=!on;lamp.className=un.length?'flash':'flash acked';lamp.title='WSTRZYMAJ WYPIS – kliknij, aby zobaczyć przyczyny';lamp.innerHTML='<span>WSTRZYMAJ<br>WYPIS</span>';lamp.onclick=function(){overlay(true);};
 var top=document.getElementById('top'),bn=document.getElementById('holdBanner');if(!bn){bn=document.createElement('div');bn.id='holdBanner';if(top&&top.parentNode)top.parentNode.insertBefore(bn,top.nextSibling);else document.body.insertBefore(bn,document.body.firstChild);}
 bn.hidden=!on;bn.innerHTML=on?'<b>⛔ WSTRZYMAJ WYPIS</b> – '+K.map(function(k){var it=st.items[k];return '<span class="hb-m"><b>'+esc(it.mod)+':</b> '+esc(it.reasons.join('; '))+'</span>';}).join(' · ')+(un.length?' <button type="button" id="holdAckB">Potwierdzam</button>':' <span class="hb-ack">✔ potwierdzono</span>'):'';
 var ab=document.getElementById('holdAckB');if(ab)ab.onclick=ack;
 if(un.length)overlay(false);else{var ov=document.getElementById('holdOv');if(ov)ov.hidden=true;}}
function overlay(force){var K=keys();if(!K.length)return;var ov=el('holdOv');ov.hidden=false;ov.setAttribute('role','alertdialog');ov.setAttribute('aria-modal','true');var un=unacked();
 ov.innerHTML='<div class="ho-box"><div class="ho-lamp"></div><h1>WSTRZYMAJ WYPIS</h1><p class="ho-v">Moduł wykrył parametry zagrażające życiu – NIE wypisuj pacjenta do domu bez ponownej oceny lekarza.</p><ul>'+K.map(function(k){var it=st.items[k];return '<li><b>'+esc(it.mod)+'</b> ('+esc(it.ts)+'): '+esc(it.reasons.join('; '))+(it.ack?' <i>– potwierdzono '+esc(it.ackTs)+'</i>':'')+'</li>';}).join('')+'</ul>'+
  (un.length?'<button type="button" id="holdAck" class="ho-ack">✔ Potwierdzam: pacjent NIE zostanie wypisany do domu</button>':'<button type="button" id="holdClose" class="ho-ack">Zamknij</button>')+
  '<button type="button" id="holdNext" class="ho-mute" style="margin-bottom:6px">🆕 Następny pacjent (czyści wszystko, także alarm)</button>'+'<button type="button" id="holdMute" class="ho-mute">'+(muted?'🔊 Włącz dźwięk':'🔇 Wycisz dźwięk (lampa zostaje)')+'</button><p class="ho-n">Potwierdzenie wycisza dźwięk; czerwona lampa i pasek zostają do „Następny pacjent”. Nowa przyczyna uruchamia alarm ponownie. Reguły mogą przeoczyć lub błędnie ocenić – nie zastępują oceny lekarza.</p></div>';
 var a=document.getElementById('holdAck');if(a)a.onclick=function(){ack();};var c=document.getElementById('holdClose');if(c)c.onclick=function(){ov.hidden=true;};
 document.getElementById('holdNext').onclick=function(){if(window.SKS&&SKS.nextPatient)SKS.nextPatient();};document.getElementById('holdMute').onclick=function(){muted=!muted;if(muted)soundStop();else if(unacked().length)alarmOn();overlay(true);};}
function printHtml(){if(!keys().length&&!st.log.length)return '';var K=keys();
 return '<section class="rp-hold"><h3>⛔ WSTRZYMAJ WYPIS</h3>'+(K.length?'<ul>'+K.map(function(k){var it=st.items[k];return '<li><b>'+esc(it.mod)+'</b> ('+esc(it.ts)+'): '+esc(it.reasons.join('; '))+(it.ack?' – potwierdzono '+esc(it.ackTs)+' („pacjent NIE zostanie wypisany do domu”)':' – NIEPOTWIERDZONE')+'</li>';}).join('')+'</ul>':'<p>Brak aktywnych alarmów (były wcześniej – patrz dziennik).</p>')+'</section>';}
document.addEventListener('DOMContentLoaded',paint);if(document.readyState!=='loading')setTimeout(paint,0);
window.SORHold={set:set,clear:clear,ack:ack,reset:reset,active:function(){return keys().length>0;},unacked:function(){return unacked().length>0;},items:function(){return JSON.parse(JSON.stringify(st.items));},log:function(){return st.log.slice();},printHtml:printHtml,overlay:function(){overlay(true);}};
// zgodność wsteczna: stary SORWypis.trigger (moduł „Ostateczny hamulec” jest wstrzymany w 5.2)
})();
