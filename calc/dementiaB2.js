// ETAP B2 – skala AMTS (10 pozycji) z punktacją; MoCA / MMSE / CDR usunięte 11.11.2026 (audyt, faza 3 – skale spoza SOR).
// Pozycje: własne, skrócone sformułowania poleceń (nie jest to oryginalny formularz).
//
(function(r,f){var m=f();if(typeof module==='object'&&module.exports)module.exports=m;else{r.SK=r.SK||{};r.SK.dementiaB2=m;}})(this,function(){
var DEC='DO DECYZJI LEKARZA';
function nz(x){return typeof x==='number'&&isFinite(x);}
var SRC={amts:'Hodkinson HM. Evaluation of a mental test score for assessment of mental impairment in the elderly. Age Ageing 1972;1:233–238',
 fourat:'Bellelli G i wsp. 4AT. Age Ageing 2014;43:496–502; Tieges Z i wsp. Age Ageing 2021'};
// ---- AMTS ----
var AMTS=[
 ['a1','Wiek pacjenta','[Zapytaj: „Ile ma Pan/Pani lat?”]'],
 ['a2','Godzina (z dokładnością do 1 h)','[Zapytaj o przybliżoną godzinę – nie pokazuj zegarka; błąd do 1 h dopuszczalny]'],
 ['a3','Adres do zapamiętania – powtórzony na końcu testu','[Na początku podaj adres typu „ul. Kwiatowa 42” i poproś o powtórzenie; zapytaj ponownie na końcu testu]'],
 ['a4','Rok','[„Jaki jest teraz rok?”]'],
 ['a5','Nazwa miejsca (szpital / oddział / miasto)','[„Jak nazywa się to miejsce?”]'],
 ['a6','Rozpoznanie dwóch osób (np. lekarz, pielęgniarka)','[Wskaż 2 osoby i zapytaj o ich funkcje; oba rozpoznania poprawne = 1 pkt]'],
 ['a7','Data urodzenia','[„Kiedy się Pan/Pani urodził(a)?” – dzień, miesiąc, rok]'],
 ['a8','Rok ważnego wydarzenia historycznego','[Oryginał: początek I wojny światowej (1914); lokalnie stosuje się inne wydarzenie – wybór wydarzenia: '+DEC+']'],
 ['a9','Nazwisko obecnego prezydenta / premiera','[„Kto jest teraz prezydentem / premierem?”]'],
 ['a10','Liczenie wstecz od 20 do 1','[„Proszę liczyć od 20 do 1 wstecz” – bezbłędnie = 1 pkt]']];
function amts(v){v=v||{};var n=0,known=0;AMTS.forEach(function(it){if(v[it[0]]===true){n++;known++;}else if(v[it[0]]===false)known++;});
 if(!known)return null;var abn=n<=6;return{score:n,known:known,complete:known===AMTS.length,abn:abn,lvl:abn?'orange':'ok',txt:abn?'nieprawidłowy (≤6) – wskazana dalsza ocena (majaczenie / otępienie)':'prawidłowy (≥7)',note:'Próg ≤6 wg przyjętej wersji aplikacji; w literaturze progi ≤6 lub <8 – '+DEC+'. Skrining ≠ rozpoznanie; przy ostrej zmianie stanu psychicznego oceń majaczenie (4AT).'};}
// 11.11.2026 (audyt, faza 3): MoCA, MMSE i CDR usunięte (skale spoza SOR); zostaje AMTS i opis ostrej zmiany do 4AT.
// ---- Wyjaśnienia ----
var ACUTE='Ostra zmiana / fluktuacje – wybierz „tak”, gdy potwierdzi to rodzina, opiekun lub dokumentacja: nagły początek w ciągu godzin–dni; nasilenie i ustępowanie w ciągu doby (np. splątanie, senność, pobudzenie) – wystarczy jedno z dwóch. Wolne, stałe pogarszanie przez miesiące to NIE jest ostra zmiana.';
return{SRC:SRC,AMTS:AMTS,amts:amts,ACUTE:ACUTE,DEC:DEC};});
