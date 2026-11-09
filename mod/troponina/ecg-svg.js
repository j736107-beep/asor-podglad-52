// 5.2 etap 3 – schematyczne zespoły EKG (SVG offline) rysowane z parametrów.
// Skala: 25 mm/s (1 mm = 40 ms), 10 mm/mV (1 mm = 0,1 mV). Siatka 1 mm / 5 mm. Linia izoelektryczna = odcinek PR.
// Schematy dydaktyczne – nie zastępują oceny pełnego zapisu 12-odprowadzeniowego.
(function(r,f){var m=f();if(typeof module==='object'&&module.exports)module.exports=m;else r.ECGSVG=m;})(this,function(){
var K=10,MS=40,CAP=20; // px/mm, ms/mm
function gauss(t,c,s){return Math.exp(-0.5*Math.pow((t-c)/s,2));}
function smooth(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
// p: {qrs:[[ms,mm]...] (od początku QRS; ostatni punkt = punkt J), stEnd, stShape:'line'|'convex'|'concave', stDur, tAmp, tDur, tType:'pos'|'neg'|'bi'|'wellA'|'strain'|'flat', pAmp, noP, spike, dur}
function trace(p){var dur=p.dur||800,q0=p.noP&&p.spike?140:200,Q=p.qrs||[[0,0],[12,-0.8],[40,9],[66,-2],[90,0]],tJ=q0+Q[Q.length-1][0],st0=Q[Q.length-1][1],
 stEnd=p.stEnd!=null?p.stEnd:st0,stDur=p.stDur||80,tT=tJ+stDur,tDur=p.tDur||170,tA=p.tAmp!=null?p.tAmp:3,tt=p.tType||'pos',pA=p.noP?0:(p.pAmp!=null?p.pAmp:1.4),pts=[];
 function y(t){var v=pA*gauss(t,q0-90,20);
  if(t>=q0&&t<=tJ){for(var i=1;i<Q.length;i++){var a=Q[i-1],b=Q[i];if(t<=q0+b[0]){var x=(t-q0-a[0])/((b[0]-a[0])||1);return v+a[1]+(b[1]-a[1])*x;}}}
  if(t>tJ&&t<=tT){var x=(t-tJ)/stDur,l=st0+(stEnd-st0)*x;if(p.stShape==='convex')l+=(p.bulge!=null?p.bulge:0.8)*Math.sin(Math.PI*x);if(p.stShape==='concave')l-=(p.bulge!=null?p.bulge:0.5)*Math.sin(Math.PI*x);return v+l;}
  if(t>tT){var x=(t-tT)/tDur,base=stEnd*(1-smooth(x*1.15)),w=0;
   if(x<=1){if(tt==='pos')w=tA*Math.pow(Math.sin(Math.PI*Math.pow(x,0.85)),2);
    else if(tt==='hyper')w=tA*Math.pow(Math.sin(Math.PI*x),2.2);
    else if(tt==='neg')w=-tA*Math.pow(Math.sin(Math.PI*x),2);
    else if(tt==='strain')w=-tA*Math.pow(Math.sin(Math.PI*Math.pow(x,1.9)),1.5);
    else if(tt==='flat')w=tA*Math.pow(Math.sin(Math.PI*x),2);
    else if(tt==='bi'||tt==='wellA'){var a1=p.tUp!=null?p.tUp:1.5,a2=tA;w=x<0.42?a1*Math.sin(Math.PI*x/0.42):-a2*Math.sin(Math.PI*(x-0.42)/0.58);}}
   return v+base+w;}
  return v;}
 for(var t=0;t<=dur;t+=3)pts.push([t,y(t)]);
 Q.forEach(function(q){pts.push([q0+q[0],y(q0+q[0])]);});
 if(p.spike){var ts=q0-12;pts=pts.filter(function(a){return a[0]<ts-2||a[0]>ts+3;});pts.push([ts-1,0],[ts,11],[ts+1.5,-1.5],[ts+3,0]);}
 pts.sort(function(a,b){return a[0]-b[0];});
 return{pts:pts,q0:q0,tJ:tJ,st0:st0,stEnd:stEnd,tT:tT,tEnd:tT+tDur,dur:dur};}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
// leads: [{lead:'V2', p:{...}, marks:[...]}]; opts {title}
function svg(leads,opts){opts=opts||{};var T=leads.map(function(L){return trace(L.p||{});}),lo=-3,hi=3;
 T.forEach(function(t){t.pts.forEach(function(a){if(a[1]<lo)lo=a[1];if(a[1]>hi)hi=a[1];});});
 leads.forEach(function(L){(L.marks||[]).forEach(function(m){if(m.y!=null){lo=Math.min(lo,m.y);hi=Math.max(hi,m.y);}});});
 lo=Math.floor(lo-2.5);hi=Math.ceil(hi+(leads.some(function(L){return (L.marks||[]).filter(function(m){return m.t==='st'||(m.t==='arrowT'&&m.l);}).length>1;})?5.5:4));var Hmm=hi-lo,gap=2,x0=0,W=0,parts=[],defs='<defs><marker id="ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" fill="#1565c0"/></marker></defs>';
 leads.forEach(function(L,i){var t=T[i],wmm=t.dur/MS,X=function(ms){return (x0+ms/MS)*K;},Y=function(mm){return (hi-mm)*K;},g='';
  // siatka
  for(var gx=0;gx<=wmm+1e-9;gx++){g+='<line x1="'+X(gx*MS).toFixed(1)+'" y1="0" x2="'+X(gx*MS).toFixed(1)+'" y2="'+(Hmm*K)+'" stroke="'+(gx%5?'#e6e9ee':'#c3cad4')+'" stroke-width="'+(gx%5?0.5:0.9)+'"/>';}
  for(var gy=lo;gy<=hi;gy++){g+='<line x1="'+X(0)+'" y1="'+Y(gy)+'" x2="'+X(t.dur)+'" y2="'+Y(gy)+'" stroke="'+((gy%5)?'#e6e9ee':'#c3cad4')+'" stroke-width="'+((gy%5)?0.5:0.9)+'"/>';}
  g+='<line x1="'+X(0)+'" y1="'+Y(0)+'" x2="'+X(t.dur)+'" y2="'+Y(0)+'" stroke="#8a94a3" stroke-width="0.8" stroke-dasharray="3 2"/>';
  g+='<polyline fill="none" stroke="#111" stroke-width="1.7" stroke-linejoin="round" points="'+t.pts.map(function(a){return X(a[0]).toFixed(1)+','+Y(a[1]).toFixed(1);}).join(' ')+'"/>';
  (L.marks||[]).forEach(function(m){var c=m.c||'#1565c0';
   if(m.t==='J'){g+='<circle cx="'+X(t.tJ)+'" cy="'+Y(t.st0)+'" r="3" fill="'+c+'"/><text x="'+(X(t.tJ)+4)+'" y="'+(Y(t.st0)+(t.st0>=0?-5:12))+'" font-size="11" font-weight="700" fill="'+c+'">J</text>';}
   if(m.t==='st'){var xm=X(t.tJ+(m.dx||20)),v=m.v!=null?m.v:t.st0;if(Math.abs(v)>0.05)g+='<line x1="'+xm+'" y1="'+Y(0)+'" x2="'+xm+'" y2="'+Y(v)+'" stroke="'+c+'" stroke-width="1.4" marker-end="url(#ah)"/>';var ly=m.ly!=null?Y(m.ly):(m.row?13.5+14*m.row:13.5);g+='<text x="'+(X(t.dur)-4)+'" y="'+ly+'" text-anchor="end" font-size="11" font-weight="700" fill="'+c+'">'+esc(m.l||((v>0?'ST ↑ ':'ST ↓ ')+String(Math.abs(v)).replace('.',',')+' mm'))+'</text>';}
   if(m.t==='s'){var xs=X(t.q0+m.at),ys=Y(m.y);g+='<line x1="'+(xs-6)+'" y1="'+Y(0)+'" x2="'+(xs-6)+'" y2="'+ys+'" stroke="'+c+'" stroke-width="1.4" marker-end="url(#ah)"/><text x="'+(xs+6)+'" y="'+(ys+4)+'" font-size="11" font-weight="700" fill="'+c+'">'+esc(m.l||('S '+Math.abs(m.y)+' mm'))+'</text>';}
   if(m.t==='ruler'){var a=X(t.q0+m.a),b=X(t.q0+m.b),yy=Y(m.y!=null?m.y:lo+1.5);g+='<line x1="'+a+'" y1="'+yy+'" x2="'+b+'" y2="'+yy+'" stroke="'+c+'" stroke-width="1.4" marker-start="url(#ah)" marker-end="url(#ah)"/><text x="'+((a+b)/2)+'" y="'+(yy+11)+'" text-anchor="middle" font-size="11" font-weight="700" fill="'+c+'">'+esc(m.l)+'</text>';}
   if(m.t==='note'){g+='<text x="'+X(m.x)+'" y="'+Y(m.y)+'" font-size="11" font-weight="700" fill="'+c+'"'+(m.anchor?' text-anchor="'+m.anchor+'"':'')+'>'+esc(m.l)+'</text>';}
   if(m.t==='arrowT'){var xt=X(m.x),yt=Y(m.y);g+='<line x1="'+xt+'" y1="'+(yt+(m.up?16:-16))+'" x2="'+xt+'" y2="'+yt+'" stroke="'+c+'" stroke-width="1.4" marker-end="url(#ah)"/>'+(m.l?'<text x="'+(X(t.dur)-4)+'" y="'+(13.5+14*(m.row||0))+'" text-anchor="end" font-size="11" font-weight="700" fill="'+c+'">'+esc(m.l)+'</text>':'');}
  });
  g+='<rect x="'+(X(0)+2)+'" y="2" width="'+(String(L.lead).length*7+8)+'" height="15" rx="3" fill="#1f3a5f"/><text x="'+(X(0)+6)+'" y="13.5" font-size="11" font-weight="700" fill="#fff">'+esc(L.lead)+'</text>';
  if(L.sub)g+='<text x="'+((X(0)+X(t.dur))/2)+'" y="'+(Hmm*K+14)+'" text-anchor="middle" font-size="12" fill="#2b2f36">'+esc(L.sub)+'</text>';
  parts.push(g);x0+=wmm+gap;W=x0-gap;});
 var vw=(W*K).toFixed(0),vh=(Hmm*K+CAP).toFixed(0);
 return '<svg class="ecg-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+vw+' '+vh+'" width="'+vw+'" height="'+vh+'" role="img" aria-label="'+esc(opts.title||'schemat EKG')+'"><title>'+esc(opts.title||'schemat EKG')+'</title>'+defs+'<rect width="100%" height="100%" fill="#fff"/>'+parts.join('')+'</svg>';}
// ---- wzorce (każdy = kilka liczb) ----
var N=[[0,0],[12,-0.8],[40,9],[66,-2],[90,0]];            // prawidłowy QRS (odprowadzenie lewokomorowe)
var RS=[[0,0],[20,2],[48,-10],[90,0]];                     // rS (V1–V2)
function stemiQ(j){return [[0,0],[14,-0.6],[40,8],[62,1],[86,j]];}
var P={
 stemi:[{lead:'V2',sub:'uniesienie wypukłe',p:{qrs:[[0,0],[18,3],[44,-6],[84,3]],stEnd:4.5,stShape:'convex',bulge:0.6,tAmp:3,tType:'pos'},marks:[{t:'J'},{t:'st'}]},{lead:'V3',p:{qrs:[[0,0],[18,5],[44,-5],[84,3.5]],stEnd:5,stShape:'convex',bulge:0.6,tAmp:3,tType:'pos'},marks:[{t:'J'},{t:'st'}]}],
 inf:[{lead:'II',p:{qrs:stemiQ(2),stEnd:3,stShape:'convex',tAmp:2.5},marks:[{t:'st'}]},{lead:'III',sub:'ST III > II',p:{qrs:[[0,0],[14,-1],[40,6],[62,1],[86,3]],stEnd:4,stShape:'convex',tAmp:2.5},marks:[{t:'st'}]},{lead:'aVF',p:{qrs:stemiQ(2.5),stEnd:3.5,stShape:'convex',tAmp:2.5},marks:[{t:'st'}]},{lead:'aVL',sub:'lustrzane',p:{qrs:[[0,0],[20,3],[46,-3],[86,-1.5]],stEnd:-1.8,tAmp:1.5,tType:'neg'},marks:[{t:'st',c:'#c62828'}]}],
 rv:[{lead:'V4R',sub:'prawostronne',p:{qrs:[[0,0],[16,1.5],[44,-6],[86,1]],stEnd:1.3,stShape:'convex',bulge:0.4,tAmp:1.5},marks:[{t:'J'},{t:'st',l:'ST ↑ ≥0,5 mm'}]}],
 post:[{lead:'V2',sub:'wysoki R, ST↓, T dodatni',p:{qrs:[[0,0],[22,9],[48,-1],[86,-2]],stEnd:-2,tAmp:3,tType:'pos'},marks:[{t:'J',c:'#c62828'},{t:'st',c:'#c62828'}]},{lead:'V8',sub:'tylne',p:{qrs:[[0,0],[12,-1.5],[38,3],[60,-1],[86,0.8]],stEnd:1,stShape:'convex',bulge:0.3,tAmp:1.2},marks:[{t:'st',l:'ST ↑ ≥0,5 mm'}]}],
 dew:[{lead:'V3',sub:'ST↓ skośne ku górze + wysoki T',p:{qrs:[[0,0],[16,5],[42,-5],[84,-2]],stEnd:0.5,stDur:60,tAmp:10,tDur:180,tType:'hyper'},marks:[{t:'J',c:'#c62828'},{t:'st',dx:6,l:'J ↓ 2 mm'},{t:'arrowT',x:440,y:10.6,l:'T wysoki',row:1}]},{lead:'aVR',p:{qrs:[[0,0],[14,1],[40,-7],[62,-1],[86,0.8]],stEnd:0.8,tAmp:1,tType:'neg'},marks:[{t:'st',l:'ST ↑ 0,5–1 mm'}]}],
 avr:[{lead:'aVR',p:{qrs:[[0,0],[14,1],[40,-8],[64,-1],[86,1.5]],stEnd:1.5,tAmp:1.5,tType:'neg'},marks:[{t:'J'},{t:'st',l:'ST ↑ ≥1 mm'}]},{lead:'V5',sub:'rozlane ST↓',p:{qrs:N.slice(0,4).concat([[90,-2]]),stEnd:-2,tAmp:1.5,tType:'pos'},marks:[{t:'J',c:'#c62828'},{t:'st',c:'#c62828'}]}],
 wellA:[{lead:'V2',sub:'typ A: T dwufazowy +/−',p:{qrs:[[0,0],[18,3],[44,-7],[84,0.4]],stEnd:0.4,stDur:90,tUp:2,tAmp:3,tDur:230,tType:'wellA'},marks:[{t:'arrowT',x:430,y:-3.2,up:true,l:'T + / −'}]}],
 wellB:[{lead:'V3',sub:'typ B: T głęboko ujemny',p:{qrs:[[0,0],[18,5],[44,-5],[84,0.3]],stEnd:0.3,stDur:90,tAmp:6,tDur:230,tType:'neg'},marks:[{t:'arrowT',x:470,y:-6,up:true,l:'T ↓ głęboki'}]}],
 std:[{lead:'V5',sub:'poziome ST↓',p:{qrs:N.slice(0,4).concat([[90,-1]]),stEnd:-1,tAmp:2},marks:[{t:'J',c:'#c62828'},{t:'st',c:'#c62828',l:'ST ↓ ≥0,5 mm'}]}],
 ti:[{lead:'V4',sub:'wyraźny R, T ujemny',p:{qrs:N,stEnd:0,tAmp:3,tType:'neg'},marks:[{t:'arrowT',x:410,y:-3,up:true,l:'T ↓ ≥1 mm'}]}],
 lbbb:[{lead:'V1',sub:'QS, ST-T niezgodne',p:{dur:900,qrs:[[0,0],[30,-6],[70,-14],[110,-6],[134,1.5]],stEnd:2,tAmp:3},marks:[{t:'ruler',a:0,b:134,l:'QRS ≥120 ms',y:4}]},{lead:'V6',sub:'szeroki, zazębiony R, bez q',p:{dur:900,qrs:[[0,0],[40,9],[62,7],[96,11],[134,-1]],stEnd:-1.5,tAmp:3,tType:'neg'},marks:[{t:'ruler',a:0,b:134,l:'≥120 ms',y:-6},{t:'ruler',a:0,b:96,l:'do szczytu R >60 ms',y:13,c:'#b45309'}]}],
 pace:[{lead:'V1',sub:'spike + szeroki QRS',p:{dur:860,noP:true,spike:true,qrs:[[0,0],[40,-8],[90,-13],[124,-5],[140,1.5]],stEnd:2,tAmp:3},marks:[{t:'note',x:150,y:11,l:'← spike'},{t:'s',at:90,y:-13,l:'S 13 mm'},{t:'st',l:'ST/S ≈ −0,12 (> −0,25)'}]}],
 nonsp:[{lead:'V5',sub:'spłaszczony T, ST↓ <0,5 mm',p:{qrs:N.slice(0,4).concat([[90,-0.3]]),stEnd:-0.3,tAmp:0.5,tType:'flat'},marks:[{t:'arrowT',x:420,y:0.6,l:'T płaski'}]}],
 lvh:[{lead:'V1',sub:'głęboki S',p:{qrs:[[0,0],[18,2],[50,-20],[96,0.8]],stEnd:1,tAmp:2},marks:[{t:'s',at:50,y:-20,l:'S V1 20 mm'}]},{lead:'V5',sub:'wysoki R + przeciążenie',p:{qrs:[[0,0],[12,-0.8],[44,25],[72,-1],[96,-1]],stEnd:-2.2,tAmp:3.5,tDur:200,tType:'strain'},marks:[{t:'note',x:290,y:24,l:'R V5 25 mm'},{t:'arrowT',x:480,y:-3.4,up:true,l:'ST↓ + T ↓ asymetryczny'}]}],
 norm:[{lead:'II',sub:'rytm zatokowy',p:{qrs:N,stEnd:0,tAmp:3},marks:[{t:'note',x:60,y:3.5,l:'P'},{t:'note',x:258,y:10,l:'QRS'},{t:'note',x:470,y:4,l:'T'}]}],
 // Sgarbossa – trzy mini-schematy
 sgar1:[{lead:'V5',sub:'QRS dodatni, ST↑ zgodne',p:{dur:860,qrs:[[0,0],[40,9],[62,7],[96,11],[134,1.5]],stEnd:2.3,stShape:'convex',bulge:0.4,tAmp:3},marks:[{t:'J'},{t:'st',l:'ST ↑ ≥1 mm (5 pkt)'}]}],
 sgar2:[{lead:'V2',sub:'QRS ujemny, ST↓ zgodne',p:{dur:860,qrs:[[0,0],[30,-6],[70,-13],[110,-5],[134,-1.5]],stEnd:-1.7,tAmp:1.5,tType:'neg'},marks:[{t:'J',c:'#c62828'},{t:'st',c:'#c62828',l:'ST ↓ ≥1 mm (3 pkt)'}]}],
 sgar3:[{lead:'V3',sub:'QRS ujemny, ST↑ niezgodne',p:{dur:860,qrs:[[0,0],[30,-6],[70,-12],[110,-4],[134,4]],stEnd:5,stShape:'convex',bulge:0.5,tAmp:3},marks:[{t:'s',at:70,y:-12,l:'S 12 mm'},{t:'J'},{t:'st',l:'ST ↑ 4 mm'},{t:'note',x:300,y:-9,l:'ST/S = 4/−12 = −0,33'}]}]
};
return{trace:trace,svg:svg,P:P,K:K};});
