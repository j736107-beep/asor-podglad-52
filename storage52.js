/* 5.2: osobna przestrzeń danych – wszystkie klucze localStorage/sessionStorage z prefiksem „v52:”,
   aby wersja testowa 5.2 nigdy nie mieszała danych z 5.1 (ta sama domena j736107-beep.github.io). */
(function(w){'use strict';var P='v52:';
function wrap(S){if(!S||S.__v52)return S;
 function keys(){var a=[];for(var i=0;i<S.length;i++){var k=S.key(i);if(k&&k.indexOf(P)===0)a.push(k.slice(P.length));}return a;}
 var api={getItem:function(k){return S.getItem(P+k);},setItem:function(k,v){S.setItem(P+k,String(v));},removeItem:function(k){S.removeItem(P+k);},
  clear:function(){keys().forEach(function(k){S.removeItem(P+k);});},key:function(i){var k=keys();return i>=0&&i<k.length?k[i]:null;},__v52:true,__raw:S};
 Object.defineProperty(api,'length',{get:function(){return keys().length;},enumerable:false,configurable:true});
 return new Proxy(api,{get:function(t,p){if(p in t)return t[p];if(typeof p==='string'){var v=S.getItem(P+p);return v==null?undefined:v;}return undefined;},
  set:function(t,p,v){if(p in t)return false;S.setItem(P+p,String(v));return true;},
  has:function(t,p){return (p in t)||(typeof p==='string'&&S.getItem(P+p)!=null);},
  deleteProperty:function(t,p){S.removeItem(P+String(p));return true;},
  ownKeys:function(){return keys();},
  getOwnPropertyDescriptor:function(t,p){if(typeof p!=='string')return undefined;var v=S.getItem(P+p);return v==null?undefined:{value:v,writable:true,enumerable:true,configurable:true};}});}
['localStorage','sessionStorage'].forEach(function(n){try{var S=w[n];if(S&&!S.__v52){var X=wrap(S);Object.defineProperty(w,n,{value:X,configurable:true,enumerable:true,writable:false});}}catch(e){}});
w.SK_PREFIX=P;w.SK_KEY=function(k){return P+k;};/* klucz surowy – np. w zdarzeniu „storage” */
})(window);
