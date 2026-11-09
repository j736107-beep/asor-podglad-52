/* 5.2 (testowa): stary nieusuwalny alarm „Bezwzględnie wstrzymać wypis” zastąpiony wspólnym SORHold (hold.js, wariant B).
   Moduł „Ostateczny hamulec” jest WSTRZYMANY (widoczny, przyciski nieaktywne) – SPEC 5.2 P1. */
(function(){'use strict';
if(window.SKM&&SKM.list)(function(L){var i=L.findIndex(function(m){return m&&m.id==='trends';});if(i<0)i=L.findIndex(function(m){return m&&m.id==='documentation';});L.splice(i<0?L.length:i+1,0,{id:'hamulec',icon:'🛑',name:'Ostateczny hamulec (WSTRZYMANY)',frame:'mod/hamulec/index.html'});})(SKM.list);
function trigger(reasons){try{if(window.SORHold)SORHold.set('hamulec',reasons,'Ostateczny hamulec');}catch(e){}}
window.SORWypis={trigger:trigger,get active(){return false;},reasons:function(){return [];}};
})();
