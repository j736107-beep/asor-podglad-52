// 5.2 etap 4 – moduł „Kalkulatory” (interfejs). Logika i źródła: calc/kalk.js (window.KALK). Działa offline (pliki w pamięci podręcznej SW).
// Dane wejściowe uzupełniane z paska pacjenta (wiek, płeć, masa, kreatynina, ciąża), dopóki użytkownik ich nie zmieni. Stan w localStorage 'kalk_state' – czyszczony przez „Następny pacjent”.
(function(root){'use strict';if(typeof document==='undefined')return;var K=root.KALK;if(!K||!root.SKM||!root.SKM.list)return;
var KEY='kalk_state',el=null,st=load();
function load(){try{var o=JSON.parse(localStorage.getItem(KEY)||'{}');o.vals=o.vals||{};o.ed=o.ed||{};o.un=o.un||{};o.q=o.q||'';return o;}catch(e){return{vals:{},ed:{},un:{},q:''};}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(st));}catch(e){}}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function norm(s){return String(s||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');}
function P(){try{return root.SKS&&root.SKS.P?root.SKS.P():{};}catch(e){return{};}}
function siPref(){try{return root.SKS&&root.SKS.S&&root.SKS.S.units==='si';}catch(e){return false;}}
function barVal(f,p){if(!f.bar)return undefined;if(f.bar==='preg')return !!(p.co&&p.co.preg);if(f.bar==='sex')return p.sex==='m'||p.sex==='f'?p.sex:undefined;var x=p[f.bar];return isFinite(x)&&x!==''&&x!==null?+x:undefined;}
function uIdx(id,f){var u=st.un[id]&&st.un[id][f.k];if(u!=null&&f.units&&f.units[u])return u;return f.units&&f.si&&siPref()?1:0;}
function V(id){st.vals[id]=st.vals[id]||{};return st.vals[id];}
function isEd(id,k){return !!(st.ed[id]&&st.ed[id][k]);}
// wartości kanoniczne do obliczeń
function canon(c){var out={},raw=V(c.id),p=P();c.f.forEach(function(f){if(!f.k)return;var r=raw[f.k],bv=barVal(f,p);
 if(f.t==='n'){var n;if(!isEd(c.id,f.k)&&bv!==undefined){n=bv;}else{n=K.num(r);if(isFinite(n)&&f.units)n=n*f.units[uIdx(c.id,f)][1];}out[f.k]=n;}
 else if(f.t==='y'){out[f.k]=(!isEd(c.id,f.k)&&bv!==undefined)?bv:r===true;}
 else if(f.t==='s'){var s=(!isEd(c.id,f.k)&&bv!==undefined)?bv:r;if((s===undefined||s===''||s===null)&&f.def!=null)s=f.def;out[f.k]=s===undefined||s===null?'':s;}});return out;}
function shown(c,f){var raw=V(c.id),p=P(),bv=barVal(f,p);if(f.t==='n'){if(!isEd(c.id,f.k)&&bv!==undefined){var fac=f.units?f.units[uIdx(c.id,f)][1]:1;return K.fmt(bv/fac,f.units&&fac!==1?2:2);}return raw[f.k]==null?'':String(raw[f.k]);}
 if(f.t==='y')return (!isEd(c.id,f.k)&&bv!==undefined)?bv:raw[f.k]===true;var s=(!isEd(c.id,f.k)&&bv!==undefined)?bv:raw[f.k];if((s===undefined||s==='')&&f.def!=null)s=f.def;return s==null?'':s;}
function fromBar(c,f){return !!f.bar&&!isEd(c.id,f.k)&&barVal(f,P())!==undefined;}
function fieldHtml(c,f,i){if(f.t==='h')return '<div class="kk-h">'+esc(f.l)+'</div>';var id='kk-'+c.id+'-'+f.k,bar=fromBar(c,f)?' <span class="kk-bar" title="Wartość z paska pacjenta">z paska</span>':'',opt=f.opt?' <span class="kk-opt">(opcjonalnie)</span>':'';
 if(f.t==='y'){var pts=f.p&&!f.noscore&&c.bands?' <span class="kk-pts">'+(f.p>0?'+':'')+K.fmt(f.p,1)+'</span>':'';return '<label class="kk-y" for="'+id+'"><input type="checkbox" id="'+id+'" data-k="'+f.k+'"'+(shown(c,f)?' checked':'')+'> '+esc(f.l)+pts+bar+'</label>';}
 if(f.t==='s'){var cur=String(shown(c,f));return '<label class="kk-f" for="'+id+'"><span>'+esc(f.l)+opt+bar+'</span><select id="'+id+'" data-k="'+f.k+'">'+(f.def==null?'<option value="">— wybierz —</option>':'')+f.o.map(function(o){return '<option value="'+esc(o[0])+'"'+(String(o[0])===cur?' selected':'')+'>'+esc(o[1])+(o.length>2&&c.bands?' ('+(o[2]>0?'+':'')+K.fmt(o[2],1)+')':'')+'</option>';}).join('')+'</select></label>';}
 var u=f.units?'<select class="kk-u" data-u="'+f.k+'" aria-label="Jednostka">'+f.units.map(function(x,j){return '<option value="'+j+'"'+(j===uIdx(c.id,f)?' selected':'')+'>'+esc(x[0])+'</option>';}).join('')+'</select>':(f.u?'<span class="kk-unit">'+esc(f.u)+'</span>':'');
 return '<label class="kk-f" for="'+id+'"><span>'+esc(f.l)+opt+bar+'</span><span class="kk-in"><input id="'+id+'" data-k="'+f.k+'" inputmode="decimal" autocomplete="off" value="'+esc(shown(c,f))+'">'+u+'</span></label>';}
function resHtml(c,r){if(r.suspended)return '<div class="kk-res kk-susp" role="alert"><div class="kk-v kk-susp-t">Kalkulator wstrzymany – wynik niezweryfikowany</div><p>'+esc(r.err)+'</p></div>';if(r.miss)return '<div class="kk-res kk-miss">Brakuje danych: '+esc(r.miss.join(', '))+'.</div>';if(r.err)return '<div class="kk-res kk-err">'+esc(r.err)+'</div>';
 return '<div class="kk-res kk-'+(r.lvl||'n')+'"><div class="kk-v">'+esc(r.v)+'</div>'+(r.interp?'<p><b>Interpretacja:</b> '+esc(r.interp)+'</p>':'')+(r.cons&&r.cons!=='—'?'<p><b>Konsekwencja kliniczna:</b> '+esc(r.cons)+'</p>':'')+'</div>'+
  (r.rows&&r.rows.length?'<table class="kk-rows">'+r.rows.map(function(x){return '<tr><td>'+esc(x[0])+'</td><td>'+esc(x[1])+'</td></tr>';}).join('')+'</table>':'');}
function grpOf(id){return K.G.filter(function(g){return g[2].indexOf(id)>=0;})[0];}
function draw(){if(!el)return;var q=norm(st.q).trim(),w=q?q.split(/\s+/):[],h='<h2>🧮 Kalkulatory</h2><p class="kk-disc">Narzędzie pomocnicze, niecertyfikowane. Własne implementacje wzorów i kryteriów z publikacji źródłowych (podanych przy każdym kalkulatorze). Wynik nie zastępuje oceny klinicznej – decyzję podejmuje lekarz.</p>'+(root.SORReport?root.SORReport.ptStrip():'')+
  '<input id="kk-q" type="search" placeholder="Szukaj kalkulatora (np. QTc, Wells, opioidy, wapń)…" value="'+esc(st.q)+'" autocomplete="off">';
 K.G.forEach(function(g){var ids=g[2].filter(function(id){var c=K.C[id],t=norm(c.n+' '+c.d+' '+g[1]);return w.every(function(x){return t.indexOf(x)>=0;});});if(!ids.length)return;
  h+='<section class="kk-g" data-g="'+g[0]+'"><h3>'+esc(g[1])+'</h3><div class="kk-chips">'+ids.map(function(id){return '<button type="button" class="kk-chip'+(st.sel===id?' on':'')+(K.C[id].suspended?' kk-chip-susp':'')+'" data-c="'+id+'">'+esc(K.C[id].n)+'</button>';}).join('')+'</div>'+
   (g[3].length?'<div class="kk-links">Powiązane moduły: '+g[3].map(function(l){return '<button type="button" class="kk-link" data-m="'+l[0]+'">→ '+esc(l[1])+'</button>';}).join(' ')+'</div>':'')+'</section>';});
 var c=st.sel&&K.C[st.sel];if(c){var r=K.run(c.id,canon(c));h+='<div id="kk-panel" class="kk-panel'+(c.suspended?' kk-panel-susp':'')+'"><h3>'+esc(c.n)+'</h3>'+(c.suspended?'<p class="kk-susp-t" id="kk-susp">Kalkulator wstrzymany – wynik niezweryfikowany</p>':'')+'<p class="kk-d">'+esc(c.d)+'</p><div class="kk-fields">'+c.f.map(function(f,i){return fieldHtml(c,f,i);}).join('')+'</div><div id="kk-out">'+resHtml(c,r)+'</div>'+
   '<p class="kk-src"><b>Źródło ('+c.yr+'):</b> '+esc(c.src)+'</p><div class="kk-act"><button type="button" id="kk-clear">Wyczyść dane tego kalkulatora</button> '+(root.SORReport?root.SORReport.printBtn('Drukuj kalkulator z danymi pacjenta (A4)'):'')+'</div></div>';}
 else h+='<p class="kk-hint">Wybierz kalkulator, aby wprowadzić dane.</p>';
 el.innerHTML=h;bind();}
function recompute(){var c=st.sel&&K.C[st.sel];if(!c||!el)return;var o=el.querySelector('#kk-out');if(o)o.innerHTML=resHtml(c,K.run(c.id,canon(c)));}
function bind(){var q=el.querySelector('#kk-q');q.oninput=function(){st.q=q.value;save();var pos=q.selectionStart;draw();var n=el.querySelector('#kk-q');n.focus();try{n.setSelectionRange(pos,pos);}catch(e){}};
 el.querySelectorAll('.kk-chip').forEach(function(b){b.onclick=function(){st.sel=b.dataset.c;save();draw();var p=el.querySelector('#kk-panel');if(p&&p.scrollIntoView)p.scrollIntoView({block:'start'});};});
 el.querySelectorAll('.kk-link').forEach(function(b){b.onclick=function(){if(root.SKS&&root.SKS.show)root.SKS.show(b.dataset.m);};});
 var c=st.sel&&K.C[st.sel];if(!c)return;if(c.suspended){el.querySelectorAll('#kk-panel input,#kk-panel select').forEach(function(x){x.disabled=true;x.setAttribute('aria-disabled','true');});var cl0=el.querySelector('#kk-clear');if(cl0)cl0.disabled=true;return;}var v=V(c.id);
 function mark(k){st.ed[c.id]=st.ed[c.id]||{};st.ed[c.id][k]=true;}
 el.querySelectorAll('#kk-panel [data-k]').forEach(function(inp){var k=inp.dataset.k;var ev=inp.tagName==='INPUT'&&inp.type!=='checkbox'?'oninput':'onchange';
  inp[ev]=function(){var wasBar=fromBar(c,c.f.filter(function(f){return f.k===k;})[0]);mark(k);v[k]=inp.type==='checkbox'?inp.checked:inp.value;save();if(wasBar){var lab=inp.closest('label'),b=lab&&lab.querySelector('.kk-bar');if(b)b.remove();}recompute();};});
 el.querySelectorAll('#kk-panel [data-u]').forEach(function(s){s.onchange=function(){var k=s.dataset.u,f=c.f.filter(function(x){return x.k===k;})[0],old=uIdx(c.id,f),nw=+s.value,inp=el.querySelector('#kk-'+c.id+'-'+k),x=K.num(inp.value);
  st.un[c.id]=st.un[c.id]||{};st.un[c.id][k]=nw;if(isFinite(x)){var cv=x*f.units[old][1]/f.units[nw][1];inp.value=K.fmt(cv,3);if(isEd(c.id,k))v[k]=inp.value;}save();recompute();};});
 var cl=el.querySelector('#kk-clear');if(cl)cl.onclick=function(){delete st.vals[c.id];delete st.ed[c.id];delete st.un[c.id];save();draw();};}
function valTxt(c,f,cv){var x=cv[f.k];if(f.t==='y')return x===true?'tak':null;if(f.t==='s'){var o=f.o.filter(function(z){return String(z[0])===String(x);})[0];return o?o[1]:null;}
 if(!isFinite(x))return null;var u=f.units?f.units[uIdx(c.id,f)]:null;return u?K.fmt(x/u[1],3)+' '+u[0]+(u[1]!==1?' (= '+K.fmt(x,3)+' '+f.units[0][0]+')':''):K.fmt(x,3)+(f.u?' '+f.u:'');}
function snapshot(){var c=st.sel&&K.C[st.sel];if(!c)return null;var cv=canon(c),r=K.run(c.id,cv),L=['KALKULATOR: '+c.n,'Grupa: '+(grpOf(c.id)||['',''])[1],'Opis: '+c.d,'','Dane wejściowe:'];
 c.f.forEach(function(f){if(f.t==='h'){L.push(' ['+f.l+']');return;}var t=valTxt(c,f,cv);if(t!=null)L.push(' • '+f.l+': '+t+(fromBar(c,f)?' (z paska pacjenta)':''));});
 L.push('');if(r.suspended)L.push('KALKULATOR WSTRZYMANY – wynik niezweryfikowany. '+r.err);else if(r.miss)L.push('WYNIK: brak – brakuje danych: '+r.miss.join(', '));else if(r.err)L.push('WYNIK: '+r.err);else{L.push('WYNIK: '+r.v);if(r.rows)r.rows.forEach(function(x){L.push(' – '+x[0]+': '+x[1]);});if(r.interp)L.push('Interpretacja: '+r.interp);if(r.cons&&r.cons!=='—')L.push('Konsekwencja kliniczna: '+r.cons);}
 L.push('','Źródło ('+c.yr+'): '+c.src,'Narzędzie pomocnicze, niecertyfikowane – decyzję podejmuje lekarz.');return{text:L.join('\n')};}
function render(e){el=e;st=load();draw();}
function update(){if(!el||!document.body.contains(el))return;var a=document.activeElement,id=a&&a.id;draw();if(id){var n=document.getElementById(id);if(n)n.focus();}}
var mod={id:'kalk',icon:'🧮',name:'Kalkulatory',render:render,update:update,snapshot:snapshot};
var Lst=root.SKM.list,i=Lst.findIndex(function(m){return m.id==='leki';});if(i<0)i=Lst.findIndex(function(m){return m.id==='settings';});if(i<0)i=Lst.length;Lst.splice(i,0,mod);
root.SORKalk={mod:mod,state:function(){return st;},canon:function(id){return canon(K.C[id]);},snapshot:snapshot};
document.addEventListener('sk-units',function(){update();});
})(window);
