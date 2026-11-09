// Asystent SOR 5.2 – etap 2 (09.11.2026): wspólna karta TIAMINY (stan padaczkowy, elektrolity/hiponatremia, inne moduły).
// Źródła (sprawdzone 09.11.2026):
//  • ChPL (SmPC, UK) Thiamine Hydrochloride 50 mg/ml, Pemberton/Galen, rev. 09.09.2024 (emc 100206): WE – 500 mg i.v. 3×/dobę ≥2 dni,
//    przy odpowiedzi 250 mg i.v./i.m. 1×/dobę przez 5 dni; i.v. rozcieńczyć w 50–100 ml 0,9% NaCl, wlew 30 min; >3–4 tyg. wymiotów: 100 mg i.v./i.m./dobę.
//  • Thomson i wsp., RCP 2002 (A&E): profilaktyka u zagrożonych 250 mg i.v. 1×/dobę 3–5 dni; WE 500 mg i.v. 3×/dobę 2–3 dni, w 100 ml NaCl 0,9% w 30 min.
//  • EFNS 2010 (Galvin i wsp.): 200 mg 3×/dobę i.v. przed węglowodanami; AES 2016: 100 mg i.v. przed glukozą w stanie padaczkowym.
//  • RPL (PL): iniekcje tiaminy dostępne w obrocie (Vitaminum B1, Vitamine B1-ratiopharm 50 mg/ml – import, Milgamma N/Bexon – złożone)
//    mają w ChPL drogę DOMIĘŚNIOWĄ; brak potwierdzonego w PL preparatu tiaminy do podania dożylnego → POTWIERDŹ Z APTEKĄ SZPITALNĄ.
(function(r,f){var m=f();if(typeof module==='object'&&module.exports)module.exports=m;else r.SKThiamine=m;})(this,function(){
'use strict';
var PHARM='Preparat i.v. do potwierdzenia z apteką szpitalną: w RPL iniekcje tiaminy mają w ChPL drogę domięśniową (Vitaminum B1, Vitamine B1-ratiopharm 50 mg/ml – import; Milgamma N i Bexon zawierają lidokainę/alkohol benzylowy – wyłącznie i.m., NIE i.v.). Dawki i.v. wg ChPL UK (Thiamine HCl 50 mg/ml) i RCP – sprawdź nazwę, stężenie i dopuszczalną drogę podania preparatu szpitalnego.';
function amp(mg,conc,vol){conc=conc||50;vol=vol||2;var ml=mg/conc,a=ml/vol;return{ml:ml,amps:a,txt:(Math.round(a*10)/10).toString().replace('.',',')+' amp. '+conc*vol+' mg/'+vol+' ml = '+(Math.round(ml*10)/10).toString().replace('.',',')+' ml'};}
function card(o){o=o||{};var conc=o.conc||50,vol=o.vol||2,R=[];
 R.push({k:'prof',t:'Profilaktyka (alkoholizm, niedożywienie, bariatria, przewlekłe wymioty)',dose:'100 mg i.v.',how:'przed glukozą albo razem z nią – przy hipoglikemii NIE opóźniaj glukozy (AES 2016); powoli i.v. lub w 50–100 ml NaCl 0,9% w 30 min',amp:amp(100,conc,vol),src:'AES 2016; ChPL UK Thiamine HCl 50 mg/ml'});
 R.push({k:'hi',t:'Profilaktyka – wysokie ryzyko (ciężkie niedożywienie, zespół abstynencyjny, niedawne wymioty)',dose:'200–250 mg i.v. 1×/dobę przez 3–5 dni',how:'w 50–100 ml NaCl 0,9% (lub G5%, jeśli preparat na to pozwala) przez 15–30 min',amp:amp(250,conc,vol),amp200:amp(200,conc,vol),src:'RCP 2002 (Thomson): 250 mg i.v. 1×/dobę 3–5 dni'});
 R.push({k:'we',t:'Podejrzenie encefalopatii Wernickego (splątanie, ataksja, oczopląs/oftalmoplegia lub każdy niewyjaśniony stan świadomości u zagrożonego)',dose:'500 mg i.v. 3×/dobę (co 8 h) przez 2–3 dni, potem 250 mg i.v./i.m. 1×/dobę 3–5 dni (do poprawy), następnie 100–250 mg/dobę (p.o. lub parenteralnie)',how:'każda dawka 500 mg w 100 ml NaCl 0,9% (lub G5%, jeśli preparat na to pozwala), wlew 30 min',amp:amp(500,conc,vol),src:'ChPL UK Thiamine HCl 50 mg/ml (500 mg 3×/d ≥2 dni → 250 mg/d 5 dni; 50–100 ml NaCl, 30 min); RCP 2002; EFNS 2010 (200 mg 3×/d)'});
 return{rows:R,active:o.wern?'we':o.alco?'prof':'',pharm:PHARM,safety:'Ryzyko reakcji anafilaktycznej przy podaniu pozajelitowym – przygotowany zestaw przeciwwstrząsowy (ChPL).',mg:o.wern?500:o.alco?100:0};}
function html(o,esc){esc=esc||function(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};var c=card(o);
 return '<div class="thia" id="thiaCard"><h3>💊 Tiamina (witamina B1)</h3>'+c.rows.map(function(r){var on=c.active===r.k||(o.wern&&r.k==='we');return '<div class="thr'+(on?' on':'')+'" data-th="'+r.k+'"><b>'+esc(r.t)+':</b> <span class="thd">'+esc(r.dose)+'</span> – '+esc(r.how)+'.<div class="tha">Rachunek (50 mg/ml, amp. 2 ml): '+(r.k==='hi'?esc(r.amp200.txt)+' (200 mg) / '+esc(r.amp.txt)+' (250 mg)':esc(r.amp.txt)+' ('+(r.k==='we'?500:100)+' mg)')+'</div><div class="ths">Źródło: '+esc(r.src)+'</div></div>';}).join('')+
  '<div class="thp">⚠ '+esc(c.pharm)+'</div><div class="ths">'+esc(c.safety)+'</div></div>';}
return{card:card,html:html,amp:amp,PHARM:PHARM};});
