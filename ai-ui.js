// Asystent SOR 5.2 – PILOT „Epikryza (AI)” – interfejs (Ustawienia → Sztuczna inteligencja (pilot); przycisk w module Zapalenie płuc).
// Klucz API wyłącznie na tym urządzeniu (localStorage „v52:ai_cfg”), nigdy w repozytorium. Zapytania idą bezpośrednio z przeglądarki
// do api.openai.com / api.anthropic.com (z pominięciem Service Workera). Dane: tylko biała lista z calc/ai-epi.js.
(function(root){'use strict';if(typeof document==='undefined')return;var A=root.SORAIEpi;if(!A||!root.SKM)return;
var KEY='v52:ai_cfg';
function cfgLoad(){try{var o=JSON.parse(localStorage.getItem(KEY)||'{}');o.keys=o.keys||{};o.models=o.models||{};o.provider=A.provOf(o.provider);return o;}catch(e){return{provider:A.DEF,keys:{},models:{}};}}
function cfgSave(c){try{localStorage.setItem(KEY,JSON.stringify(c));}catch(e){}}
function cfg(){var c=cfgLoad(),p=c.provider;return{provider:p,model:c.models[p]||A.MODELS[p][0][0],key:c.keys[p]||''};}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function ids(){try{return root.SKS&&root.SKS.PID?root.SKS.PID():{};}catch(e){return{};}}
var S={open:false,notes:'',busy:false,err:'',out:null,prevOpen:false};
function avail(){var c=cfg();if(!c.key)return 'Brak klucza API – wpisz go w Ustawienia → „Sztuczna inteligencja (pilot)”.';if(navigator.onLine===false)return 'Brak połączenia z internetem – funkcja AI niedostępna offline.';return '';}
function source(){var CU=root.SORClinicalUI,as=CU&&CU.capAssessment?CU.capAssessment():null,bar={};try{bar=root.SKS.P();}catch(e){}
 if(!as&&root.SORZpPrint){try{var h=root.SORZpPrint.inputFull();if(h&&h.h&&root.SORClinical){as={i:h.h.i,r:root.SORClinical.capDisposition(Object.assign({},h.h.i,{age:bar.age,sex:bar.sex}))};}}catch(e){}}
 var zs=root.SORZpPrint&&root.SORZpPrint.zpState?root.SORZpPrint.zpState():null,abx='';try{abx=root.SORZpPrint?root.SORZpPrint.text({full:true}):'';}catch(e){}
 return{bar:bar,assess:as,zp:zs?{allergy:zs.allergy,o:zs.o||{},place:zs.place}:{},abx:abx,notes:S.notes};}
function payload(){return A.buildPayload(source(),ids());}
function banner(){var why=avail(),c=cfg(),h='<section id="aiEpi" class="ai-epi ai-noprint"><div class="ai-head"><button type="button" id="aiBtn" class="ai-btn" data-ai="open"'+(why?' disabled aria-disabled="true"':'')+'>✨ Epikryza (AI)</button> <span class="ai-pilot">PILOT</span> '+(why?'<span class="ai-why" id="aiWhy">'+esc(why)+'</span>':'<span class="mut">'+esc(A.PROV[c.provider].name+' · '+c.model)+'</span>')+'</div>';
 if(S.open&&!why){var P=payload(),txt=A.dataText(P);h+='<div class="ai-step" id="aiStep"><label class="ai-lbl">Uwagi kliniczne do epikryzy (opcjonalnie: wywiad, badanie, przebieg w SOR) – <b>bez imienia, nazwiska, PESEL i dat przyjęcia</b><textarea id="aiNotes" rows="4">'+esc(S.notes)+'</textarea></label>'+
  '<details id="aiPrev"'+(S.prevOpen?' open':'')+'><summary>Co zostanie wysłane do '+esc(A.PROV[c.provider].name)+' (model '+esc(c.model)+')</summary><pre id="aiPrevTxt" class="nopl">'+esc(txt)+'</pre><p class="mut">Wysyłane są wyłącznie dane kliniczne (biała lista). Imię, nazwisko, PESEL, czas przyjęcia i inne identyfikatory nie są wysyłane – są automatycznie usuwane także z notatek.</p></details>'+
  '<div class="ai-act"><button type="button" class="ai-send" id="aiSend" data-ai="send"'+(S.busy?' disabled':'')+'>'+(S.busy?'⏳ Generuję… (do 60 s)':'Potwierdzam – wyślij do AI')+'</button> <button type="button" data-ai="close">Anuluj</button></div></div>';}
 if(S.err)h+='<div class="ai-err" id="aiErr" role="alert">⚠️ '+esc(S.err)+'</div>';
 if(S.out){h+='<div class="ai-out" id="aiOutBox"><p class="ai-warn" id="aiWarn">Tekst wygenerowany przez AI – wymaga weryfikacji i zatwierdzenia przez lekarza</p><textarea id="aiOut" rows="16" spellcheck="true">'+esc(S.out.paste)+'</textarea>'+
  '<div class="ai-act"><button type="button" data-ai="copy" id="aiCopy">📋 Kopiuj</button> <span id="aiCopied" class="mut"></span> <button type="button" data-ai="clear">Wyczyść</button> <span class="mut">Kopiowany jest tylko powyższy tekst (bez UWAG). W wydruku A4 nagłówek z imieniem i PESEL dodaje lokalnie program.</span></div>'+
  (S.out.notes?'<details class="ai-notes" id="aiNotesOut" open><summary>UWAGI DLA LEKARZA (nie do wklejenia)</summary><pre class="nopl">'+esc(S.out.notes)+'</pre></details>':'')+'<p class="mut">Model: '+esc(S.out.model||'')+(S.out.noTemp?' (bez parametru temperatury – model go nie obsługuje)':'')+(S.out.noReason?' (bez parametru reasoning_effort)':'')+'</p></div>';}
 return h+'</section>';}
function repaint(){var e=document.getElementById('aiEpi');if(!e)return;var a=document.activeElement,id=a&&a.id,pos=a&&a.selectionStart;var w=document.createElement('div');w.innerHTML=banner();e.replaceWith(w.firstChild);if(id){var n=document.getElementById(id);if(n&&n!==document.body){n.focus();try{if(pos!=null)n.setSelectionRange(pos,pos);}catch(_){}}}}
function copy(t){if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(t).catch(function(){return fb();});return fb();
 function fb(){var x=document.createElement('textarea');x.value=t;x.style.position='fixed';x.style.opacity='0';document.body.appendChild(x);x.select();try{document.execCommand('copy');}catch(e){}x.remove();return Promise.resolve();}}
function send(){if(S.busy)return;var why=avail();if(why){S.err=why;repaint();return;}var P=payload();S.busy=true;S.err='';repaint();
 A.call(cfg(),P,ids(),root.fetch.bind(root)).then(function(o){S.out=o;S.open=false;S.busy=false;repaint();try{root.SKS.capSoon&&root.SKS.capSoon();}catch(e){}},function(e){S.busy=false;S.err=e&&e.message||String(e);repaint();});}
document.addEventListener('click',function(ev){var b=ev.target.closest&&ev.target.closest('#aiEpi [data-ai]');if(!b||b.disabled)return;var a=b.dataset.ai;
 if(a==='open'){S.open=true;S.err='';repaint();}else if(a==='close'){S.open=false;repaint();}else if(a==='send')send();
 else if(a==='copy'){var t=document.getElementById('aiOut');var v=t?t.value:'';copy(v).then(function(){var c=document.getElementById('aiCopied');if(c)c.textContent='Skopiowano.';});}
 else if(a==='clear'){if(confirm('Usunąć wygenerowany tekst?')){S.out=null;repaint();}}});
document.addEventListener('input',function(ev){var t=ev.target;if(t.id==='aiNotes'){S.notes=t.value;var p=document.getElementById('aiPrevTxt');if(p)p.textContent=A.dataText(payload());}else if(t.id==='aiOut'&&S.out){S.out.paste=t.value;}});
['input','change'].forEach(function(evn){document.addEventListener(evn,function(ev){if(!S.open||!ev.target.closest||!ev.target.closest('.clinical-form'))return;setTimeout(function(){var p=document.getElementById('aiPrevTxt');if(p)p.textContent=A.dataText(payload());},0);},true);});
document.addEventListener('toggle',function(ev){if(ev.target&&ev.target.id==='aiPrev')S.prevOpen=ev.target.open;},true);
root.addEventListener('online',repaint);root.addEventListener('offline',repaint);
function printText(){return S.out&&S.out.paste?'EPIKRYZA (AI) – Tekst wygenerowany przez AI – wymaga weryfikacji i zatwierdzenia przez lekarza\n'+S.out.paste:'';}
// ---------- Ustawienia ----------
function settingsHtml(){var c=cfgLoad(),p=c.provider,k=c.keys[p]||'',m=c.models[p]||A.MODELS[p][0][0],known=A.MODELS[p].some(function(x){return x[0]===m;});
 return '<div class="box ai-set ai-noprint" id="aiSet"><h3>Sztuczna inteligencja (pilot)</h3><p class="mut">Funkcja „Epikryza (AI)” w module Zapalenie płuc. Własny klucz API lekarza – zapisany <b>tylko na tym urządzeniu</b> (pamięć przeglądarki), nie trafia do repozytorium ani na serwer programu. Do dostawcy AI trafiają wyłącznie dane kliniczne (bez imienia, nazwiska, PESEL, czasu przyjęcia). Opłaty za użycie nalicza dostawca na koncie lekarza.</p>'+
 '<div class="row"><b>Dostawca:</b><select id="aiProv"><option value="xai"'+(p==='xai'?' selected':'')+'>xAI (Grok) – domyślny</option><option value="openai"'+(p==='openai'?' selected':'')+'>OpenAI (Chat Completions)</option><option value="anthropic"'+(p==='anthropic'?' selected':'')+'>Anthropic (Messages API)</option></select></div>'+
 '<div class="row"><b>Model:</b><select id="aiModel">'+A.MODELS[p].map(function(x){return '<option value="'+x[0]+'"'+(x[0]===m?' selected':'')+'>'+esc(x[1])+' – '+x[0]+'</option>';}).join('')+'<option value="_custom"'+(known?'':' selected')+'>inny (wpisz nazwę)…</option></select><input id="aiModelC" placeholder="nazwa modelu" value="'+(known?'':esc(m))+'"'+(known?' hidden':'')+' style="min-width:180px"></div>'+
 '<div class="row"><b>Klucz API:</b><input id="aiKey" type="password" autocomplete="off" spellcheck="false" placeholder="'+(k?'zapisany: '+esc(A.mask(k)):esc(A.PROV[p].keyHint))+'" style="min-width:260px"><button type="button" id="aiKeySave" class="tg">Zapisz klucz</button><button type="button" id="aiKeyDel" class="tg" style="border-color:#d81b30;color:#d81b30"'+(k?'':' disabled')+'>Usuń klucz</button><button type="button" id="aiTest" class="tg"'+(k?'':' disabled')+'>Test połączenia</button></div>'+
 '<div class="row mut" id="aiKeyHint">Klucz '+esc(A.PROV[p].name)+' zaczyna się od <code>'+esc(A.PROV[p].keyHint.replace('…',''))+'</code> – wygeneruj go na '+esc(A.PROV[p].console)+' (API Keys).</div><div class="row"><span id="aiKeyState">'+(k?'Klucz zapisany: <code>'+esc(A.mask(k))+'</code>':'Brak klucza – funkcja AI wyłączona.')+'</span></div><div class="row"><span id="aiSetMsg" role="status"></span></div></div>';}
function bindSettings(el){var box=el.querySelector('#aiSet');if(!box)return;function msg(t,bad){var m=box.querySelector('#aiSetMsg');m.textContent=t;m.style.color=bad?'#c62828':'#2e7d32';}
 function redraw(t,bad){var w=document.createElement('div');w.innerHTML=settingsHtml();box.replaceWith(w.firstChild);bindSettings(el);if(t)el.querySelector('#aiSetMsg')&&(function(){var m=el.querySelector('#aiSetMsg');m.textContent=t;m.style.color=bad?'#c62828':'#2e7d32';})();}
 box.querySelector('#aiProv').onchange=function(){var c=cfgLoad();c.provider=this.value;cfgSave(c);redraw();};
 var ms=box.querySelector('#aiModel'),mc=box.querySelector('#aiModelC');
 ms.onchange=function(){var c=cfgLoad();if(ms.value==='_custom'){mc.hidden=false;mc.focus();return;}mc.hidden=true;c.models[c.provider]=ms.value;cfgSave(c);msg('Model: '+ms.value);};
 mc.onchange=function(){var v=mc.value.trim();if(!/^[A-Za-z0-9._:\-\/]{2,80}$/.test(v)){msg('Nieprawidłowa nazwa modelu.',1);return;}var c=cfgLoad();c.models[c.provider]=v;cfgSave(c);msg('Model: '+v);};
 box.querySelector('#aiKeySave').onclick=function(){var v=box.querySelector('#aiKey').value.trim();if(!v){msg('Wpisz klucz.',1);return;}if(/\s/.test(v)||v.length<20){msg('Klucz wygląda na nieprawidłowy.',1);return;}var c=cfgLoad(),pre=A.PROV[c.provider].keyHint.replace('…','');if(v.indexOf(pre)!==0&&!confirm('Klucz '+A.PROV[c.provider].name+' zwykle zaczyna się od „'+pre+'”. Na pewno zapisać ten klucz dla tego dostawcy?'))return;c.keys[c.provider]=v;cfgSave(c);redraw('Klucz zapisany na tym urządzeniu.');};
 box.querySelector('#aiKeyDel').onclick=function(){if(!confirm('Usunąć klucz API z tego urządzenia?'))return;var c=cfgLoad();delete c.keys[c.provider];cfgSave(c);redraw('Klucz usunięty.');};
 box.querySelector('#aiTest').onclick=function(){var b=this;b.disabled=true;msg('Sprawdzam połączenie…');if(navigator.onLine===false){msg('Brak internetu.',1);b.disabled=false;return;}
  A.test(cfg(),root.fetch.bind(root)).then(function(t){msg(t);b.disabled=false;},function(e){msg(e.message,1);b.disabled=false;});};}
var Lst=root.SKM.list,set=Lst.filter(function(m){return m&&m.id==='settings';})[0];
if(set&&!set._ai){var orig=set.render;set.render=function(el,X){orig.call(this,el,X);var w=document.createElement('div');w.innerHTML=settingsHtml();var host=el.querySelector('.box');(host&&host.parentNode?host.parentNode:el).insertBefore(w.firstChild,host?host.nextSibling:null);bindSettings(el);};set._ai=true;}
root.SORAIUI={banner:banner,printText:printText,payload:payload,state:function(){return S;},cfg:cfg,repaint:repaint};
})(typeof window!=='undefined'?window:this);
