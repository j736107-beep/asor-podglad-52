/* Wklejki testowe (FIKCYJNE) dla modułu Przegląd wyników – wspólne dla testów node i przeglądarki. */
var S=(typeof require==='function')?null:null;
module.exports={
 doctor:`Data pobrania: 08.11.2026 10:15
WBC 9,1 tys/µl
HGB 13,8 g/dl
PLT 260 tys/µl
Kreatynina 1,0 mg/dl
Na 140 mmol/l
K 4,2 mmol/l
CRP 8 mg/l
Troponina hs 12 ng/l
D-dimer 450 ng/ml
ALT 25 U/l
Glukoza 105 mg/dl

Data pobrania: 10.11.2026 18:40
WBC 12,3 tys/µl
HGB 13,2 g/dl
PLT 245 tys/µl
Kreatynina 1,2 mg/dl
Na 138 mmol/l
K 4,5 mmol/l
CRP 45 mg/l
Troponina hs 25 ng/l
D-dimer 820 ng/ml FEU
ALT 41 U/l
Glukoza 162 mg/dl

Data pobrania: 11.11.2026 06:00
WBC 15,0 10^3/µl
HGB 12,1 g/dl
PLT 198 G/l
Kreatynina 1,6 mg/dl
Na 134 mmol/l
K 5,3 mmol/l
CRP 120 mg/l
Troponina hs 48 ng/l
ALT 58 IU/l
Glukoza 9,8 mmol/l`,
 ascii:`10.11.2026 08:00\nWBC 12,3 tys/ul\nPLT 245 tys/ul\nTroponina hs 25 pg/ml\nD-dimer 0,82 ug/ml FEU\nKreatynina 106 umol/l\n11.11.2026 08:00\nWBC 14,1 tys/ul\nPLT 200 tys/ul\nTroponina hs 40 pg/ml\nD-dimer 1,1 ug/ml FEU\nKreatynina 150 umol/l`,
 exp:`10.11.2026 08:00\nWBC 12,3 10^3/ul\nPLT 245 x10^3/uL\nHGB 13,2 g/dL\n11.11.2026 08:00\nWBC 14,1 10^3/ul\nPLT 200 x10^3/uL\nHGB 12,0 g/dL\n12.11.2026 08:00\nWBC 16,0 10^9/L\nPLT 180 10³/µl\nHGB 11,5 g/dl`,
 lis:`10.11.2026 08:00\nLeukocyty (WBC)  12,30  tys/µl  4,00 - 10,00  H\nHemoglobina (HGB)  13,2  g/dl  12,0 - 16,0\nPłytki krwi (PLT)  245  tys/µl  150 - 400\nSód (Na)  138  mmol/l  136 - 145\nPotas (K)  4,5  mmol/l  3,5 - 5,1\n11.11.2026 08:00\nLeukocyty (WBC)  14,10  tys/µl  4,00 - 10,00  H\nHemoglobina (HGB)  12,0  g/dl  12,0 - 16,0\nPłytki krwi (PLT)  200  tys/µl  150 - 400\nSód (Na)  134  mmol/l  136 - 145  L\nPotas (K)  5,3  mmol/l  3,5 - 5,1 H`,
 tab:`Badanie\tJednostka\t10.11.2026 08:00\t11.11.2026 07:30\nWBC\ttys/µl\t12,3\t14,1\nHGB\tg/dl\t13,2\t12,0\nKreatynina\tmg/dl\t1,2\t1,6\nCRP\tmg/l\t45\t120`
};
