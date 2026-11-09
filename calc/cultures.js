// 5.2 etap 2 – Sepsa: lista materiału na posiewy (SSC 2021, ESCMID 2016, UK SMI B37). Czysta logika (Node + przeglądarka).
(function(r,f){var m=f();if(typeof module==='object'&&module.exports)module.exports=m;else r.SKCult=m;})(this,function(){
var BLOOD=[['bc1','Krew – zestaw 1 (butelka tlenowa + beztlenowa), wkłucie obwodowe 1'],['bc2','Krew – zestaw 2 (tlenowa + beztlenowa), oddzielne wkłucie obwodowe 2'],['bc3','Krew – zestaw 3 (podejrzenie zapalenia wsierdzia)'],['bccvc','Krew – zestaw z cewnika centralnego (opisz godzinę – różnica czasu do wzrostu)']];
var CSF=[['csf1','PMR probówka 1 – biochemia: glukoza (+ równocześnie glukoza w surowicy), białko, mleczany'],['csf2','PMR probówka 2 – cytoza z rozmazem'],['csf3','PMR probówka 3 – mikrobiologia: barwienie Grama, posiew (± antygeny)'],['csf4','PMR probówka 4 – PCR: panel bakteryjny (N. meningitidis, S. pneumoniae, H. influenzae, Listeria) i wirusowy (HSV-1/2, VZV, enterowirusy)']];
var OTHER=[['u1','Mocz – ze środkowego strumienia / z portu świeżo założonego cewnika (nie z worka); badanie ogólne + posiew'],['uag','Antygenuria: pneumokok i Legionella (ciężkie zapalenie płuc)'],['resp1','Plwocina dobrej jakości / aspirat tchawiczy (zaintubowany)'],['resp2','Wymaz z nosogardła PCR: grypa, SARS-CoV-2, RSV'],['o_pl','Płyn z opłucnej / otrzewnej (posiew + butelki do posiewu krwi)'],['o_abs','Aspirat z ropnia (lepszy niż wymaz)'],['o_wnd','Wymaz z rany po oczyszczeniu'],['o_cdi','Kał – C. difficile (biegunka po antybiotyku)']];
function tm(s){var m=/^(\d{1,2}):(\d{2})$/.exec(String(s||'').trim());return m?(+m[1])*60+(+m[2]):null;}
function summary(v){v=v||{};var need=v.ie?3:2,sets=BLOOD.filter(function(b){return v[b[0]];}).length,abx=tm(v.abxT),items=[],after=!!v.afterAbx;
 function push(list){list.forEach(function(b){if(!v[b[0]])return;var t=v[b[0]+'t']||'',late=abx!=null&&tm(t)!=null&&tm(t)>abx;if(late)after=true;items.push({k:b[0],name:b[1],time:t,late:late});});}
 push(BLOOD);push(OTHER);if(v.csf)push(CSF);
 var label=sets+'/'+need+', '+(2*sets)+' butelk'+(2*sets===1?'a':(2*sets>=2&&2*sets<=4)?'i':'')+' (cel '+(2*need)+')';
 var adm=tm(v.admT),door=(adm!=null&&abx!=null)?((abx-adm+1440)%1440):null;
 return{sets:sets,need:need,bottles:2*sets,label:label,complete:sets>=need,after:after,items:items,csf:!!v.csf,csfTubes:CSF.map(function(c){return{k:c[0],name:c[1],done:!!v[c[0]],time:v[c[0]+'t']||''};}),abxT:v.abxT||'',doorAbxMin:door};}
return{BLOOD:BLOOD,CSF:CSF,OTHER:OTHER,summary:summary,tm:tm};});
