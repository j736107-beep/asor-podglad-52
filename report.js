// Raport / druk (okno druku przeglądarki, offline): dokumentacja, wykonane, pompy (zapisane nastawy), bilans płynów, moduły użyte u pacjenta.
(function(root,factory){
  var R=factory(root);
  if(typeof module==='object'&&module.exports){module.exports=R;return;}
  root.SORReport=R;
})(typeof window!=='undefined'?window:this,function(root){
  'use strict';
  var PUMPS='sk_pumps',SNAP='sk_snap';
  var SKIP={dashboard:1,trends:1,'treatment-log':1,fluid:1,settings:1,about:1,icd:1,icd10:1,icd9:1,pompy:1};
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function now(){return new Date().toLocaleString('pl-PL',{timeZone:'Europe/Warsaw',dateStyle:'short',timeStyle:'short'});}
  function hm(ts){return new Date(ts).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Warsaw'});}
  function jget(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v;}catch(e){return d;}}
  function jset(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
  // ------------- pompy: zapis nastaw -------------
  function pumpList(){var l=jget(PUMPS,[]);return Array.isArray(l)?l.filter(function(x){return x&&typeof x.text==='string'&&Number.isFinite(+x.ts);}):[];}
  function addPump(text){text=String(text||'').trim();if(!text)throw Error('Brak nastawy do zapisania.');var l=pumpList();if(l.length>=100)l.shift();l.push({ts:Date.now(),text:text.slice(0,500)});jset(PUMPS,l);return l;}
  function clearPumps(){try{localStorage.removeItem(PUMPS);}catch(e){}}
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
  // standalone pola (poza label) – uwzględnij jako wypełnione
  function countLoose(root0,ctx){root0.querySelectorAll('input:not([type=hidden]),select').forEach(function(c){if(c.closest('label'))return;if(c.type==='checkbox'||c.type==='radio'){if(c.checked)ctx.filled++;}else if(c.tagName==='SELECT'){if(c.selectedIndex>0&&c.value!=='')ctx.filled++;}else if(String(c.value).trim()!=='')ctx.filled++;});}
  function snapText(rootEl){var ctx={out:[],filled:0};walk(rootEl,ctx);countLoose(rootEl,ctx);
    var txt=ctx.out.join('').replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n').replace(/ {2,}/g,' ').trim();
    return{text:txt,filled:ctx.filled};}
  function snaps(){var o=jget(SNAP,{});return o&&typeof o==='object'?o:{};}
  // zapisuje migawkę aktywnego modułu, gdy użytkownik cokolwiek wypełnił
  function capture(mod){
    try{if(!mod||!mod.id||SKIP[mod.id])return;var host=document.getElementById('main'),rootEl=host;
      if(typeof mod.snapshot==='function'){var sn=mod.snapshot();if(sn&&sn.text){var all0=snaps();all0[mod.id]={name:mod.name,ts:Date.now(),text:String(sn.text).slice(0,12000)};jset(SNAP,all0);return;}}
      if(mod.frame){var f=host.querySelector('iframe');if(!f||!f.contentDocument||!f.contentDocument.body)return;rootEl=f.contentDocument.body;}
      var r=snapText(rootEl),all=snaps(),prev=all[mod.id],sub='',subName='';
      // 5.2 etap 2: treść osadzonej ramki (np. Zapalenie płuc → Antybiotykoterapia, mod/zp) trafia do wydruku modułu
      if(!mod.frame){var fr=[].slice.call(rootEl.querySelectorAll('iframe'));fr.forEach(function(f){try{var b=f.contentDocument&&f.contentDocument.body;if(!b)return;var rr=snapText(b);if(rr.text){sub+=(sub?'\n\n':'')+rr.text;subName=f.title||subName;}}catch(e){}});
        if(!fr.length&&prev&&prev.sub&&!prev.subAuto){sub=prev.sub;subName=prev.subName||'';}}
      // 5.2 etap 4 (zaakceptowane 09.11.2026): wydruk zapalenia płuc ZAWSZE z antybiotykoterapią – gdy ramka nie była otwierana, wylicz ze wspólnego silnika
      var subAuto=false;if(mod.id==='cap'&&!sub&&r.filled>0&&root.SORZpPrint){try{sub=root.SORZpPrint.text({full:true});}catch(e){sub='';}if(sub){subAuto=true;subName='Zapalenie płuc – antybiotykoterapia (wyliczone z silnika)';}}
      // pilot AI (10.11.2026): epikryza AI (tylko blok do wklejenia, bez UWAG) – w wydruku A4; nagłówek pacjenta (imię i nazwisko, wiek, płeć) dodaje lokalnie wydruk
      var ai=(mod.id==='cap'&&root.SORAIUI&&root.SORAIUI.printText)?root.SORAIUI.printText():'';if(ai)r.filled=Math.max(r.filled,1);
      if((r.filled>0&&r.text)||sub){all[mod.id]={name:mod.name,ts:Date.now(),text:r.text.slice(0,12000)};if(sub){all[mod.id].sub=sub.slice(0,12000);all[mod.id].subName=subName||'Moduł osadzony';if(subAuto)all[mod.id].subAuto=true;}if(ai)all[mod.id].ai=ai.slice(0,8000);}else if(!prev)delete all[mod.id];
      // 11.11.2026: zakładka bez wpisanych danych (np. informacyjna) NIE kasuje wcześniejszego stanu modułu – wydruk pokazuje ostatni stan z danymi („stan z HH:MM”); czyści go „Następny pacjent”.
      jset(SNAP,all);}catch(e){}}
  function clearSnaps(){try{localStorage.removeItem(SNAP);}catch(e){}}
  // ------------- składanie raportu -------------
  function patientHtml(){
    var S=root.SKS&&root.SKS.S,p=root.SKS&&root.SKS.P?root.SKS.P():null;if(!p)return '';var U=root.SK&&root.SK.units,C=root.SK&&root.SK.core;
    function f(x,d){return isFinite(x)?C.fmt(x,d):'—';}
    var cr=isFinite(p.crMg)?U.round('crea',U.fromSI('crea',U.toSI('crea',p.crMg,'conv'),S.units),S.units)+' '+U.label('crea',S.units):'—';
    var co=[['liver','wątroba'],['renal','nerki'],['heart','serce'],['preg','ciąża']].filter(function(x){return p.co&&p.co[x[0]];}).map(function(x){return x[1];});
    var I=root.SKS&&root.SKS.PID?root.SKS.PID():{name:''};
    return '<table><tr><th>Imię i nazwisko</th><td>'+(I.name?'<b>'+esc(I.name)+'</b>':'— (nie wpisano)')+'</td><th>Wiek / płeć</th><td>'+f(p.age,0)+' lat / '+({m:'M',f:'K'}[p.sex]||'—')+'</td></tr><tr><th>Przyjęcie do SOR</th><td colspan="3">'+(I.adm?esc(String(I.adm).replace('T',' ')):'—')+'</td></tr><tr><th>Masa / wzrost / BMI</th><td colspan="3">'+(isFinite(p.w)?f(p.w,1):isFinite(p.wRaw)?f(p.wRaw,1)+' (nierealna – nie użyta w obliczeniach)':'—')+' kg / '+f(p.h,0)+' cm / '+(isFinite(p.bmi)?p.bmi.toFixed(1).replace('.',','):'—')+'</td></tr><tr><th>Kreatynina</th><td>'+esc(cr)+'</td><th>CrCl / eGFR</th><td>'+f(p.crcl,0)+' ml/min / '+f(p.egfr,0)+' ml/min/1,73 m²</td></tr><tr><th>Obciążenia</th><td colspan="3">'+(co.length?esc(co.join(', ')):'nie zaznaczono')+'</td></tr></table>';}
  function section(title,html){return html?'<h2>'+esc(title)+'</h2>'+html:'';}
  function doneHtml(){var h=root.SORDone?root.SORDone.reportHtml():'';var conf=root.SORTreatment&&root.SORTreatment.confirmedText?root.SORTreatment.confirmedText():'';
    if(conf)h+='<h3>Potwierdzone w rejestrze leczenia</h3><div class="rp-text">'+esc(conf)+'</div>';return h;}
  function pumpsHtml(){var l=pumpList();if(!l.length)return '';return '<table><tr><th style="width:12%">Godz.</th><th>Zapisana nastawa (wyliczona przez kalkulator – do weryfikacji przez lekarza)</th></tr>'+l.map(function(x){return '<tr><td>'+hm(x.ts)+'</td><td>'+esc(x.text)+'</td></tr>';}).join('')+'</table>';}
  function fluidHtml(){var p=root.SKS&&root.SKS.P?root.SKS.P():null;return root.SORFluid?root.SORFluid.reportHtml(Date.now(),p&&p.w):'';}
  // 5.2: wydruk jednego modułu mieści się na 1–2 stronach A4 (tekst skracany do LIM znaków)
  var LIM=4200;
  function modulesHtml(ids,lim){var all=snaps(),keys=Object.keys(all).filter(function(k){return !ids||ids.indexOf(k)>=0;});
    function cut(t,l){t=String(t||'');return l&&t.length>l?t.slice(0,l).replace(/\s+\S*$/,'')+' … [skrócono do wydruku A4 – pełna treść w module]':t;}
    return keys.map(function(k){var s=all[k],L0=lim&&s.ai?Math.max(1500,lim-s.ai.length):lim,l1=L0&&s.sub?Math.round(L0*0.5):L0,t=cut(s.text,l1);return '<h3>'+esc(s.name)+' <span class="sub">(stan z '+hm(s.ts)+')</span></h3>'+(s.ai?'<div class="rp-text rp-ai">'+esc(s.ai)+'</div>':'')+'<div class="rp-text">'+esc(t)+'</div>'+(s.sub?'<h3>'+esc(s.subName||'Moduł osadzony')+'</h3><div class="rp-text rp-sub">'+esc(cut(s.sub,L0?L0-l1:0))+'</div>':'');}).join('');}
  function pwHtml(){var m=root.SKS&&root.SKS.pwMem;if(!m||!m.report)return '';var R=m.report;function ul(t,a){return a&&a.length?'<h3>'+esc(t)+'</h3><ul>'+a.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>':'';}return ul('Nie przeocz',R.alerts)+ul('Co zrobić teraz',R.actions)+ul('Czego brakuje',R.missing)+(R.algo&&R.algo.length?ul('Algorytmy',R.algo):'')+ul('Wyniki – przebieg w czasie',R.trend);}
  var TITLES={pw:'Przegląd wyników – czujnik bezpieczeństwa',done:'Co rzeczywiście wykonano',pumps:'Pompy – zapisane nastawy',fluid:'Bilans płynów',modules:'Moduły użyte u pacjenta'};
  function build(parts){
    parts=parts&&parts.length?parts:['done','pumps','fluid','modules'];var out='',any=false;
    var mids=[];parts.forEach(function(p){if(p==='modules')mids=mids.concat(Object.keys(snaps()));else if(p&&p.module)mids.push(p.module);else if(p==='pumps')mids.push('pompy');else if(p==='fluid')mids.push('fluid');});
    parts.forEach(function(p){var h='';
      if(p==='done')h=doneHtml();else if(p==='pw')h=pwHtml();else if(p==='pumps')h=pumpsHtml();else if(p==='fluid')h=fluidHtml();else if(p==='modules')h=modulesHtml();
      else if(p&&p.module)h=modulesHtml([p.module],parts.length===1?LIM:0);
      if(h){any=true;out+=section(p&&p.module?'Moduł':TITLES[p],h);}});
    if(!any)out='<p><b>Brak danych do wydruku w wybranym zakresie.</b> Wypełnij moduł lub dodaj wpisy.</p>';
    var title=parts.length>=4?'Raport zbiorczy – Asystent lekarza SOR':'Wydruk – Asystent lekarza SOR';
    return '<h1>'+title+'</h1><div class="sub">Wydruk: '+esc(now())+' (Europe/Warsaw) · Narzędzie pomocnicze – niecertyfikowane</div>'+section('Dane pacjenta',patientHtml())+out+(any&&root.SORSources?'<div class="rp-srcwrap">'+root.SORSources.footerHtml(mids)+'</div>':'')+
      '<div class="sig"><div>Lekarz: .......................................</div><div>Podpis i pieczątka<br><br>.......................................</div></div><div class="foot">Asystent lekarza SOR – narzędzie pomocnicze, niecertyfikowane. Wartości i dawki weryfikuje lekarz; wydruk nie zastępuje dokumentacji medycznej szpitala.</div>';}
  var FOOT='Dokument wygenerowany pomocniczo poza systemem szpitalnym – zatwierdzam: ............................................ (pieczątka i podpis lekarza)';
  function pidAge(){var p=root.SKS&&root.SKS.P?root.SKS.P():{};var a=isFinite(p.age)?' · wiek: <b>'+Math.round(p.age)+' lat</b>':'';var x={m:'M',f:'K'}[p.sex];return a+(x?' · płeć: <b>'+x+'</b>':'');}
  function pidLine(){var I=root.SKS&&root.SKS.PID?root.SKS.PID():null;if(!I)return '';return '<div class="pid-h">Pacjent: <b>'+esc(I.name||'— (nie wpisano)')+'</b>'+pidAge()+(I.adm?' · przyjęcie: '+esc(String(I.adm).replace('T',' ')):'')+'</div>';}
  function brandHead(){return '<div class="brand-h"><div class="bt">Data i godzina wydruku:<br><b>'+esc(now())+'</b></div></div>'+pidLine();}
  function brandFoot(){return '<div class="brand-f">'+esc(FOOT)+'</div>';}
  function brand(a){if(!a)return a;a.querySelectorAll('.brand-h,.brand-f,.pid-h').forEach(function(x){x.remove();});a.insertAdjacentHTML('afterbegin',brandHead());a.insertAdjacentHTML('beforeend',brandFoot());return a;}
  if(typeof window!=='undefined'&&window.addEventListener)window.addEventListener('beforeprint',function(){brand(document.getElementById('printArea'));});
  function fill(parts){var a=document.getElementById('printArea');if(!a){a=document.createElement('div');a.id='printArea';document.body.appendChild(a);}a.innerHTML=build(parts);a.classList.toggle('compact',!!(parts&&parts.length===1&&parts[0]&&parts[0].module));brand(a);return a;}
  // 5.2 etap 2: pasek pacjenta na ekranie modułu (Bilans płynów, Antykoagulacja) + przycisk wydruku
  function ptStrip(){var I=root.SKS&&root.SKS.PID?root.SKS.PID():{},p=root.SKS&&root.SKS.P?root.SKS.P():{},C=root.SK&&root.SK.core;function f(x,d){return isFinite(x)&&C?C.fmt(x,d):'—';}
    return '<div class="ptstrip" id="ptStrip">👤 <b>'+esc(I.name||'— (nie wpisano)')+'</b> · wiek '+f(p.age,0)+' · płeć '+({m:'M',f:'K'}[p.sex]||'—')+' · masa '+(isFinite(p.w)?f(p.w,0)+' kg':'—')+' · CrCl '+(isFinite(p.crcl)?f(p.crcl,0)+' ml/min':'—')+'</div>';}
  function printBtn(l){return '<button type="button" class="tabPrint primary-action" onclick="var b=document.getElementById(\'printMod\');if(b)b.click();">🖨 '+esc(l||'Drukuj tę zakładkę (A4)')+'</button>';}
  function print(parts){var cur=root.SKS&&root.SKS.active?root.SKS.active():null;if(cur)capture(cur);fill(parts);root.print();}
  return{brand:brand,brandHead:brandHead,brandFoot:brandFoot,FOOT:FOOT,esc:esc,pumpList:pumpList,addPump:addPump,clearPumps:clearPumps,snapText:snapText,capture:capture,snaps:snaps,clearSnaps:clearSnaps,build:build,fill:fill,print:print,ptStrip:ptStrip,printBtn:printBtn,SKIP:SKIP};
});
