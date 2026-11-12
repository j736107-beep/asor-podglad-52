// Raport / druk (okno druku przeglądarki, offline): dokumentacja, wykonane, pompy (zapisane nastawy), bilans płynów, TYLKO panele faktycznie użyte u tego pacjenta.
(function(root,factory){
  var R=factory(root);
  if(typeof module==='object'&&module.exports){module.exports=R;return;}
  root.SORReport=R;
})(typeof window!=='undefined'?window:this,function(root){
  'use strict';
  var PUMPS='sk_pumps',SNAP='sk_snap',USED='sk_used',BASE='sk_base';
  var SKIP={dashboard:1,trends:1,'treatment-log':1,fluid:1,settings:1,about:1,icd:1,icd10:1,icd9:1,pompy:1};
  // Reguła włączania panelu do raportu zbiorczego (sesja tego pacjenta):
  // — co najmniej 2 pola kliniczne zmienione względem stanu bazowego (pusty/domyślny zapisany przy pierwszym otwarciu po „Następny pacjent”), ALBO
  // — jeden istotny tekst wolny (≥40 znaków, np. wynik gastroskopii), ALBO
  // — wyraźna akcja (Analizuj, zapisana nastawa, wpis w „wykonane”) razem z ≥1 zmienionym polem.
  // Pojedyncze przypadkowe pole NIE wystarcza. Wyniki wyliczone z wartości domyślnych, stałe, klucze techniczne (__si) i pozostałości po poprzednim pacjencie (brak znacznika użycia w tej sesji) NIE liczą się.
  var RULE_FIELDS=2, RULE_RICH=40;
  var RULE_TXT='Do raportu zbiorczego trafia tylko panel, który w tej sesji pacjenta został faktycznie użyty: co najmniej dwa pola kliniczne zmienione względem stanu bazowego (pusty/domyślny), albo jeden istotny tekst wolny (≥40 znaków, np. opis gastroskopii), albo wyraźna akcja (Analizuj, zapis pompy, wpis wykonany) wraz z co najmniej jednym zmienionym polem. Pojedyncze pole uznaje się za użycie trywialne i nie dołącza się panelu. Wyniki wyliczone z domyślnych, stałe wstępnie wypełnione i pozostałości po poprzednim pacjencie nie liczą się. „Następny pacjent” czyści stan użycia.';

  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function now(){return new Date().toLocaleString('pl-PL',{timeZone:'Europe/Warsaw',dateStyle:'short',timeStyle:'short'});}
  function hm(ts){return new Date(ts).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Warsaw'});}

  function memStore(name){
    root._memStore=root._memStore||{};
    root._memStore[name]=root._memStore[name]||{};
    var d=root._memStore[name];
    return {getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null;},setItem:function(k,v){d[k]=String(v);},removeItem:function(k){delete d[k];},key:function(i){return Object.keys(d)[i];},get length(){return Object.keys(d).length;},_d:d};
  }
  function LS(){try{if(typeof localStorage!=='undefined'&&localStorage)return localStorage;}catch(e){}return memStore('local');}
  function jget(k,d){try{var v=JSON.parse(LS().getItem(k));return v==null?d:v;}catch(e){return d;}}
  function jset(k,v){try{LS().setItem(k,JSON.stringify(v));}catch(e){}}

  // ------------- pompy: zapis nastaw -------------
  function pumpList(){var l=jget(PUMPS,[]);return Array.isArray(l)?l.filter(function(x){return x&&typeof x.text==='string'&&Number.isFinite(+x.ts);}):[];}
  function addPump(text){text=String(text||'').trim();if(!text)throw Error('Brak nastawy do zapisania.');var l=pumpList();if(l.length>=100)l.shift();l.push({ts:Date.now(),text:text.slice(0,500)});jset(PUMPS,l);noteAction('pompy','pump');return l;}
  function clearPumps(){try{LS().removeItem(PUMPS);}catch(e){}}

  // ------------- migawki modułów (tekst wyników i wpisanych pól) -------------
  var BLOCK={DIV:1,P:1,H1:1,H2:1,H3:1,H4:1,LI:1,TR:1,SECTION:1,TABLE:1,UL:1,OL:1,FIELDSET:1,BR:1,HR:1,LEGEND:1,HEADER:1,MAIN:1};
  function visible(el){if(el.hidden)return false;var w=el.ownerDocument.defaultView;try{var cs=w.getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')return false;}catch(e){}return true;}
  function walk(n,ctx){
    if(n.nodeType===3){ctx.out.push(n.nodeValue.replace(/\s+/g,' '));return;}
    if(n.nodeType!==1)return;
    var t=n.tagName;
    if(/^(SCRIPT|STYLE|SVG|BUTTON|OPTION|TEXTAREA|NOSCRIPT|IFRAME)$/.test(t)||!visible(n))return;
    if(n.classList&&(n.classList.contains('info')||n.classList.contains('infobox')||n.classList.contains('disc')||n.classList.contains('tabs')||n.classList.contains('ptstrip')||n.classList.contains('ai-noprint')||false))return;
    if(n.classList&&n.classList.contains('gcs-box')){var sm=n.querySelector('.gcs-sum');var st=sm?sm.textContent.replace(/\s+/g,' ').trim():'';if(/^GCS =/.test(st)){ctx.filled++;ctx.out.push('\n'+st);}return;}
    if(t==='INPUT'||t==='SELECT'){return;}
    if(t==='LABEL'){var c=n.querySelector('input,select');
      if(c&&n.querySelectorAll('input,select').length===1){
        if(c.type==='checkbox'){if(c.checked){ctx.filled++;ctx.out.push('\n☑ '+n.textContent.replace(/\s+/g,' ').trim());}return;}
        if(c.type==='radio'){if(c.checked){ctx.filled++;ctx.out.push('\n◉ '+n.textContent.replace(/\s+/g,' ').trim());}return;}
        if(c.type==='hidden')return;
        var val=c.tagName==='SELECT'?(c.selectedIndex>0&&c.value!==''?c.options[c.selectedIndex].text:''):c.value;
        if(String(val).trim()==='')return;
        ctx.filled++;var lab=n.textContent.replace(/\s+/g,' ').trim();ctx.out.push('\n'+lab.replace(/\s*$/,'')+': '+String(val).trim());return;}
    }
    var blk=BLOCK[t];if(blk)ctx.out.push('\n');
    if(t==='TD'||t==='TH')ctx.out.push(' | ');
    for(var ch=n.firstChild;ch;ch=ch.nextSibling)walk(ch,ctx);
    if(blk)ctx.out.push('\n');
  }
  function countLoose(root0,ctx){root0.querySelectorAll('input:not([type=hidden]),select').forEach(function(c){if(c.closest('label'))return;if(c.type==='checkbox'||c.type==='radio'){if(c.checked)ctx.filled++;}else if(c.tagName==='SELECT'){if(c.selectedIndex>0&&c.value!=='')ctx.filled++;}else if(String(c.value).trim()!=='')ctx.filled++;});}
  function snapText(rootEl){var ctx={out:[],filled:0};walk(rootEl,ctx);countLoose(rootEl,ctx);
    var txt=ctx.out.join('').replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').replace(/ {2,}/g,' ').trim();
    return{text:txt,filled:ctx.filled};}
  function snaps(){var o=jget(SNAP,{});return o&&typeof o==='object'?o:{};}

  // ------------- stan użycia panelu (ta sesja pacjenta) -------------
  function usedMap(){var o=jget(USED,{});return o&&typeof o==='object'?o:{};}
  function baseMap(){var o=jget(BASE,{});return o&&typeof o==='object'?o:{};}
  function isActiveVal(v){
    if(v===true)return true;
    if(v===false||v==null)return false;
    if(typeof v==='number')return isFinite(v);
    var s=String(v).trim();
    if(s===''||s==='false'||s==='undefined'||s==='null'||s==='NaN')return false;
    return true;
  }
  function canonVal(v){
    if(v===true||v===false)return v;
    if(v==null)return '';
    if(typeof v==='number')return isFinite(v)?v:'';
    return String(v);
  }
  function fieldMap(rootEl){
    var o={};
    if(!rootEl||!rootEl.querySelectorAll)return o;
    try{
      rootEl.querySelectorAll('input[id],select[id],textarea[id]').forEach(function(el){
        if(!el||el.type==='hidden')return;
        try{if(el.closest&&(el.closest('#pbar')||el.closest('.ptstrip')||el.closest('.ai-noprint')||el.closest('.info')||el.closest('.infobox')))return;}catch(e){}
        var id=el.id;if(!id||id.indexOf('__')===0)return;
        if(el.type==='checkbox'||el.type==='radio')o[id]=!!el.checked;
        else o[id]=el.value;
      });
    }catch(e){}
    return o;
  }
  var ALIAS={cap:['zp1state','zp_handoff'],se:['se4state'],el:['el1state'],trop:['trop_state']};
  function ingestObj(o,prefix,v){
    if(!v||typeof v!=='object')return;
    var f;for(f in v){if(!Object.prototype.hasOwnProperty.call(v,f))continue;
      if(f.indexOf('__')===0)continue;
      o[prefix+'.'+f]=v[f];
    }
  }
  function storeFields(modId){
    var o={}, prefix='sk_m_'+modId, store=LS();
    try{
      var n=store.length,i,k,v,f;
      for(i=0;i<n;i++){
        k=store.key(i);if(!k)continue;
        if(k.indexOf(prefix)!==0)continue;
        if(/_tab$/.test(k))continue;
        try{v=JSON.parse(store.getItem(k));}catch(e){continue;}
        if(!v||typeof v!=='object')continue;
        for(f in v){if(!Object.prototype.hasOwnProperty.call(v,f))continue;
          if(f.indexOf('__')===0||f==='t'&&/tab/.test(k))continue;
          o[k+'.'+f]=v[f];
        }
      }
      (ALIAS[modId]||[]).forEach(function(ak){try{ingestObj(o,'alias.'+ak,JSON.parse(store.getItem(ak)));}catch(e){}});
    }catch(e){}
    return o;
  }
  function mergeMaps(a,b){var o={},k;for(k in a)o[k]=a[k];for(k in b)o[k]=b[k];return o;}
  function rememberBaseline(mod, rootEl){
    if(!mod||!mod.id||SKIP[mod.id])return;
    var all=baseMap();
    if(all[mod.id])return all[mod.id];
    var map=mergeMaps(storeFields(mod.id), fieldMap(rootEl));
    all[mod.id]=map;
    jset(BASE,all);
    return map;
  }
  function forceBaseline(modId, map){var all=baseMap();all[modId]=map||{};jset(BASE,all);}
  function diffFrom(base, cur){
    base=base||{};cur=cur||{};
    var changed=[],rich=0,k,cv,bv;
    var keys={},x;for(x in cur)keys[x]=1;for(x in base)keys[x]=1;
    for(k in keys){
      if(k.indexOf('__')===0)continue;
      cv=canonVal(cur[k]);bv=canonVal(base[k]);
      if(cv===bv)continue;
      if(cv===true&&bv!==true){changed.push(k);continue;}
      if(typeof cv==='string'||typeof cv==='number'){
        if(!isActiveVal(cv))continue; // opróżnienie pola ≠ treść kliniczna
        if(String(cv)===String(bv))continue;
        changed.push(k);
        if(typeof cv==='string'&&cv.trim().length>rich)rich=cv.trim().length;
      }
    }
    return {n:changed.length, rich:rich, fields:changed};
  }
  function isMeaningful(d, action){
    d=d||{n:0,rich:0};
    if(d.rich>=RULE_RICH)return true;
    if(action&&d.n>=1)return true;
    if(action&&d.rich>=10)return true;
    if(d.n>=RULE_FIELDS)return true;
    return false;
  }
  function assess(mod, rootEl){
    if(!mod||!mod.id)return {ok:false,n:0,rich:0,fields:[],action:''};
    if(!baseMap()[mod.id]&&rootEl)rememberBaseline(mod, rootEl);
    var cur=mergeMaps(storeFields(mod.id), fieldMap(rootEl));
    var d=diffFrom(baseMap()[mod.id]||{}, cur);
    var action=(usedMap()[mod.id]||{}).action||'';
    d.action=action;
    d.ok=isMeaningful(d, action);
    d.id=mod.id;
    return d;
  }
  function noteAction(id, kind){
    if(!id)return;
    var all=usedMap(),u=all[id]||{};
    u.action=kind||u.action||'action';
    u.ts=Date.now();
    all[id]=u;
    // akcja sama nie oznacza jeszcze „użyty” – wymaga meaningful (sprawdzane przy capture / wasUsed)
    jset(USED,all);
    return u;
  }
  function markUsed(id, info){
    if(!id)return;
    var all=usedMap(),u=all[id]||{};
    info=info||{};
    u.ts=Date.now();
    u.n=info.n||u.n||0;
    u.rich=info.rich||u.rich||0;
    if(info.action)u.action=info.action;
    u.ok=true;
    all[id]=u;
    jset(USED,all);
    return u;
  }
  function wasUsed(id){
    var u=usedMap()[id];
    if(!u||!u.ok)return false;
    return true;
  }
  function usedIds(){return Object.keys(usedMap()).filter(function(k){return usedMap()[k]&&usedMap()[k].ok;});}
  function clearUsed(){
    try{LS().removeItem(USED);}catch(e){}
    try{LS().removeItem(BASE);}catch(e){}
    clearSnaps();
  }
  function setSnap(id, obj){var all=snaps();if(!obj)delete all[id];else all[id]=obj;jset(SNAP,all);return all;}

  // zapisuje migawkę aktywnego modułu tylko gdy panel został faktycznie użyty
  function capture(mod){
    try{if(!mod||!mod.id||SKIP[mod.id])return;
      var host=(typeof document!=='undefined')?document.getElementById('main'):null,rootEl=host;
      if(host)rememberBaseline(mod, host);
      if(typeof mod.snapshot==='function'){
        var a0=assess(mod, rootEl);
        var sn=mod.snapshot();
        if(sn&&sn.text&&a0.ok){var all0=snaps();all0[mod.id]={name:mod.name,ts:Date.now(),text:String(sn.text).slice(0,12000)};jset(SNAP,all0);markUsed(mod.id,a0);return;}
        if(!a0.ok){if(!wasUsed(mod.id)){var z=snaps();if(z[mod.id]){delete z[mod.id];jset(SNAP,z);}}return;}
      }
      if(mod.frame){var f=host&&host.querySelector('iframe');if(!f||!f.contentDocument||!f.contentDocument.body){if(!wasUsed(mod.id))return;return;}rootEl=f.contentDocument.body;rememberBaseline(mod,rootEl);}
      var a=assess(mod, rootEl);
      var r=rootEl?snapText(rootEl):{text:'',filled:0},all=snaps(),prev=all[mod.id],sub='',subName='';
      if(!mod.frame&&rootEl){var fr=[].slice.call(rootEl.querySelectorAll('iframe'));fr.forEach(function(f){try{var b=f.contentDocument&&f.contentDocument.body;if(!b)return;var rr=snapText(b);if(rr.text){sub+=(sub?'\n\n':'')+rr.text;subName=f.title||subName;}}catch(e){}});
        if(!fr.length&&prev&&prev.sub&&!prev.subAuto){sub=prev.sub;subName=prev.subName||'';}}
      var subAuto=false;if(mod.id==='cap'&&!sub&&a.ok&&root.SORZpPrint){try{sub=root.SORZpPrint.text({full:true});}catch(e){sub='';}if(sub){subAuto=true;subName='Zapalenie płuc – antybiotykoterapia (wyliczone z silnika)';}}
      var ai=(mod.id==='cap'&&root.SORAIUI&&root.SORAIUI.printText)?root.SORAIUI.printText():'';
      if(!a.ok){
        // zakładka informacyjna nie kasuje wcześniejszego stanu użytego panelu; kasuje go „Następny pacjent”
        if(!wasUsed(mod.id)){if(all[mod.id]){delete all[mod.id];jset(SNAP,all);}}
        return;
      }
      markUsed(mod.id,a);
      if((r.text)||sub||(sn&&sn.text)){all[mod.id]={name:mod.name,ts:Date.now(),text:(r.text||(sn&&sn.text)||'').slice(0,12000)};if(sub){all[mod.id].sub=sub.slice(0,12000);all[mod.id].subName=subName||'Moduł osadzony';if(subAuto)all[mod.id].subAuto=true;}if(ai)all[mod.id].ai=ai.slice(0,8000);}
      else if(prev){all[mod.id]=prev;}
      jset(SNAP,all);}catch(e){}}
  function clearSnaps(){try{LS().removeItem(SNAP);}catch(e){}}

  // ------------- składanie raportu -------------
  function patientHtml(){
    var S=root.SKS&&root.SKS.S,p=root.SKS&&root.SKS.P?root.SKS.P():null;if(!p)return '';var U=root.SK&&root.SK.units,C=root.SK&&root.SK.core;
    function f(x,d){return isFinite(x)?C.fmt(x,d):'';}
    var I=root.SKS&&root.SKS.PID?root.SKS.PID():{name:''};
    var rows=[],age=f(p.age,0),sex={m:'M',f:'K'}[p.sex]||'';
    var hasId=!!(I.name);
    if(I.name)rows.push('<tr><th>Imię i nazwisko</th><td'+(I.adm?'':' colspan="3"')+'><b>'+esc(I.name)+'</b></td>'+(I.adm?'<th>Przyjęcie do SOR</th><td>'+esc(String(I.adm).replace('T',' '))+'</td>':'')+'</tr>');
    /* sam automatyczny czas przyjęcia (sk_t0) bez innych danych pacjenta nie jest „wpisany przez lekarza” */
    if(age||sex)rows.push('<tr><th>Wiek / płeć</th><td colspan="3">'+(age?age+' lat':'')+(age&&sex?' / ':'')+(sex||'')+'</td></tr>');
    var masa=(isFinite(p.w)?f(p.w,1):(isFinite(p.wRaw)?f(p.wRaw,1)+' (nierealna – nie użyta w obliczeniach)':''));
    var wzr=f(p.h,0),bmi=isFinite(p.bmi)?p.bmi.toFixed(1).replace('.',','):'';
    if(masa||wzr||bmi)rows.push('<tr><th>Masa / wzrost / BMI</th><td colspan="3">'+(masa?masa+' kg':'')+(wzr?(masa?' / ':'')+wzr+' cm':'')+(bmi?' / '+bmi:'')+'</td></tr>');
    var cr=isFinite(p.crMg)&&U?U.round('crea',U.fromSI('crea',U.toSI('crea',p.crMg,'conv'),S&&S.units),S&&S.units)+' '+U.label('crea',S&&S.units):'';
    var crcl=f(p.crcl,0),egfr=f(p.egfr,0);
    if(cr||crcl||egfr)rows.push('<tr><th>Kreatynina / CrCl / eGFR</th><td colspan="3">'+(cr||'')+(crcl?(cr?' · ':'')+crcl+' ml/min':'')+(egfr?' / '+egfr+' ml/min/1,73 m²':'')+'</td></tr>');
    var co=[['liver','wątroba'],['renal','nerki'],['heart','serce'],['preg','ciąża']].filter(function(x){return p.co&&p.co[x[0]];}).map(function(x){return x[1];});
    if(co.length)rows.push('<tr><th>Obciążenia</th><td colspan="3">'+esc(co.join(', '))+'</td></tr>');
    if(!rows.length)return '';
    return '<table>'+rows.join('')+'</table>';
  }
  function section(title,html){return html?'<h2>'+esc(title)+'</h2>'+html:'';}
  function doneHtml(){var h=root.SORDone?root.SORDone.reportHtml():'';var conf=root.SORTreatment&&root.SORTreatment.confirmedText?root.SORTreatment.confirmedText():'';
    if(conf)h+='<h3>Potwierdzone w rejestrze leczenia</h3><div class="rp-text">'+esc(conf)+'</div>';return h;}
  function pumpsHtml(){var l=pumpList();if(!l.length)return '';return '<table><tr><th style="width:12%">Godz.</th><th>Zapisana nastawa (wyliczona przez kalkulator – do weryfikacji przez lekarza)</th></tr>'+l.map(function(x){return '<tr><td>'+hm(x.ts)+'</td><td>'+esc(x.text)+'</td></tr>';}).join('')+'</table>';}
  function fluidHtml(){var p=root.SKS&&root.SKS.P?root.SKS.P():null;return root.SORFluid?root.SORFluid.reportHtml(Date.now(),p&&p.w):'';}
  var LIM=4200;
  function modulesHtml(ids,lim){var all=snaps(),keys=Object.keys(all).filter(function(k){
      if(ids&&ids.indexOf(k)<0)return false;
      return wasUsed(k);
    });
    function cut(t,l){t=String(t||'');return l&&t.length>l?t.slice(0,l).replace(/\s+\S*$/,'')+' … [skrócono do wydruku A4 – pełna treść w module]':t;}
    return keys.map(function(k){var s=all[k],L0=lim&&s.ai?Math.max(1500,lim-s.ai.length):lim,l1=L0&&s.sub?Math.round(L0*0.5):L0,t=cut(s.text,l1);return '<h3>'+esc(s.name)+' <span class="sub">(stan z '+hm(s.ts)+')</span></h3>'+(s.ai?'<div class="rp-text rp-ai">'+esc(s.ai)+'</div>':'')+'<div class="rp-text">'+esc(t)+'</div>'+(s.sub?'<h3>'+esc(s.subName||'Moduł osadzony')+'</h3><div class="rp-text rp-sub">'+esc(cut(s.sub,L0?L0-l1:0))+'</div>':'');}).join('');}
  function pwHtml(){var m=root.SKS&&root.SKS.pwMem;if(!m||!m.report)return '';var R=m.report;function ul(t,a){return a&&a.length?'<h3>'+esc(t)+'</h3><ul>'+a.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'';}return ul('Nie przeocz',R.alerts)+ul('Co zrobić teraz',R.actions)+ul('Czego brakuje',R.missing)+(R.algo&&R.algo.length?ul('Algorytmy',R.algo):'')+ul('Wyniki – przebieg w czasie',R.trend);}
  var TITLES={pw:'Przegląd wyników – czujnik bezpieczeństwa',done:'Co rzeczywiście wykonano',pumps:'Pompy – zapisane nastawy',fluid:'Bilans płynów',modules:'Moduły użyte u pacjenta'};
  var EMPTY_NOTE='<p><b>Brak danych do raportu.</b> Żaden panel nie został użyty u tego pacjenta.</p>';
  function build(parts){
    parts=parts&&parts.length?parts:['done','pumps','fluid','modules'];var out='',any=false;
    var mids=[];parts.forEach(function(p){if(p==='modules')mids=mids.concat(usedIds());else if(p&&p.module&&wasUsed(p.module))mids.push(p.module);else if(p==='pumps'&&pumpList().length)mids.push('pompy');else if(p==='fluid')mids.push('fluid');});
    parts.forEach(function(p){var h='';
      if(p==='done')h=doneHtml();else if(p==='pw')h=pwHtml();else if(p==='pumps')h=pumpsHtml();else if(p==='fluid')h=fluidHtml();else if(p==='modules')h=modulesHtml();
      else if(p&&p.module)h=wasUsed(p.module)?modulesHtml([p.module],parts.length===1?LIM:0):'';
      if(h){any=true;out+=section(p&&p.module?'Moduł':TITLES[p],h);}});
    if(!any)out=EMPTY_NOTE;
    var title=parts.length>=4?'Raport zbiorczy – Asystent lekarza SOR':'Wydruk – Asystent lekarza SOR';
    var pat=patientHtml();
    return '<h1>'+title+'</h1><div class="sub">Wydruk: '+esc(now())+' (Europe/Warsaw) · Narzędzie pomocnicze – niecertyfikowane</div>'+(pat?section('Dane pacjenta',pat):'')+out+(any&&root.SORSources?'<div class="rp-srcwrap">'+root.SORSources.footerHtml(mids)+'</div>':'')+
      '<div class="sig"><div>Lekarz: .......................................</div><div>Podpis i pieczątka<br><br>.......................................</div></div><div class="foot">Asystent lekarza SOR – narzędzie pomocnicze, niecertyfikowane. Wartości i dawki weryfikuje lekarz; wydruk nie zastępuje dokumentacji medycznej szpitala.</div>';}
  var FOOT='Dokument wygenerowany pomocniczo poza systemem szpitalnym – zatwierdzam: ............................................ (pieczątka i podpis lekarza)';
  function pidAge(){var p=root.SKS&&root.SKS.P?root.SKS.P():{};var a=isFinite(p.age)?' · wiek: <b>'+Math.round(p.age)+' lat</b>':'';var x={m:'M',f:'K'}[p.sex];return a+(x?' · płeć: <b>'+x+'</b>':'');}
  function pidLine(){var I=root.SKS&&root.SKS.PID?root.SKS.PID():null;if(!I)return '';var p=root.SKS&&root.SKS.P?root.SKS.P():{};var has=!!(I.name||isFinite(p.age)||p.sex);if(!has)return '';
    return '<div class="pid-h">Pacjent: <b>'+esc(I.name||'')+'</b>'+pidAge()+(I.name&&I.adm?' · przyjęcie: '+esc(String(I.adm).replace('T',' ')):'')+'</div>';}
  function brandHead(){return '<div class="brand-h"><div class="bt">Data i godzina wydruku:<br><b>'+esc(now())+'</b></div></div>'+pidLine();}
  function brandFoot(){return '<div class="brand-f">'+esc(FOOT)+'</div>';}
  function brand(a){if(!a)return a;a.querySelectorAll('.brand-h,.brand-f,.pid-h').forEach(function(x){x.remove();});a.insertAdjacentHTML('afterbegin',brandHead());a.insertAdjacentHTML('beforeend',brandFoot());return a;}
  if(typeof document!=='undefined'&&typeof window!=='undefined'&&window.addEventListener)window.addEventListener('beforeprint',function(){brand(document.getElementById('printArea'));});
  function fill(parts){var a=document.getElementById('printArea');if(!a){a=document.createElement('div');a.id='printArea';document.body.appendChild(a);}a.innerHTML=build(parts);a.classList.toggle('compact',!!(parts&&parts.length===1&&parts[0]&&parts[0].module));brand(a);return a;}
  function ptStrip(){var I=root.SKS&&root.SKS.PID?root.SKS.PID():{},p=root.SKS&&root.SKS.P?root.SKS.P():{},C=root.SK&&root.SK.core;function f(x,d){return isFinite(x)&&C?C.fmt(x,d):'—';}
    return '<div class="ptstrip" id="ptStrip">👤 <b>'+esc(I.name||'— (nie wpisano)')+'</b> · wiek '+f(p.age,0)+' · płeć '+({m:'M',f:'K'}[p.sex]||'—')+' · masa '+(isFinite(p.w)?f(p.w,0)+' kg':'—')+' · CrCl '+(isFinite(p.crcl)?f(p.crcl,0)+' ml/min':'—')+'</div>';}
  function printBtn(l){return '<button type="button" class="tabPrint primary-action" onclick="var b=document.getElementById(\'printMod\');if(b)b.click();">🖨 '+esc(l||'Drukuj tę zakładkę (A4)')+'</button>';}
  function print(parts){var cur=root.SKS&&root.SKS.active?root.SKS.active():null;if(cur)capture(cur);fill(parts);if(typeof root.print==='function')root.print();}
  return{brand:brand,brandHead:brandHead,brandFoot:brandFoot,FOOT:FOOT,esc:esc,pumpList:pumpList,addPump:addPump,clearPumps:clearPumps,snapText:snapText,capture:capture,snaps:snaps,clearSnaps:clearSnaps,build:build,fill:fill,print:print,ptStrip:ptStrip,printBtn:printBtn,SKIP:SKIP,
    fieldMap:fieldMap,storeFields:storeFields,diffFrom:diffFrom,isMeaningful:isMeaningful,assess:assess,rememberBaseline:rememberBaseline,forceBaseline:forceBaseline,noteAction:noteAction,markUsed:markUsed,wasUsed:wasUsed,usedIds:usedIds,clearUsed:clearUsed,setSnap:setSnap,usedMap:usedMap,baseMap:baseMap,RULE_TXT:RULE_TXT,RULE_FIELDS:RULE_FIELDS,RULE_RICH:RULE_RICH,EMPTY_NOTE:EMPTY_NOTE,patientHtml:patientHtml};
});
