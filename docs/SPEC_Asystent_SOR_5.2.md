---
title: "Asystent lekarza SOR – specyfikacja zmian do wersji testowej 5.2"
subtitle: "Na podstawie uwag dr. Jacka W. (SOR, PSzS im. Jana Pawła II w Nowym Targu) oraz analizy kodu wersji 5.1"
date: "09.11.2026"
lang: pl
---

# 0. Informacje wstępne

**Podstawa:** uwagi lekarza z 09.11.2026 oraz przegląd kodu repozytorium `j736107-beep/asor-podglad-51`. Analizowany stan: ostatni commit `960005f` („pw36: Sepsa Ocena – P/F live przy FiO₂ auto”). Strona: https://j736107-beep.github.io/asor-podglad-51/. Pomocniczo przejrzano repozytorium `j736107-beep/kompendium-interny` (commit `3640d64`).

**Charakter dokumentu:** specyfikacja do akceptacji. Nie wprowadzono żadnych zmian w kodzie, nie wykonano commitów ani publikacji. Wersja 5.1 pozostaje nienaruszona.

**Priorytety:**

- **P1** – bezpieczeństwo pacjenta albo błąd funkcjonalny. Wchodzi do pierwszego etapu.
- **P2** – treść kliniczna i rozszerzenia.
- **P3** – wygląd, grafika, wygoda.

**Zasady obowiązujące we wszystkich zmianach:**

1. Każdy skrót przy pierwszym użyciu na ekranie ma polskie rozwinięcie. Nie wszyscy dyżurni są internistami. Mechanizm słowniczka już istnieje (`gloss.js`, obiekt `SKG`, działa także w ramkach `iframe`) i trzeba go uzupełnić. W modułach, gdzie skrót decyduje o leczeniu (PSI, CURB-65, ATS/IDSA, qSOFA, GBS itd.), rozwinięcie ma być wpisane bezpośrednio w etykietę.
2. Brak danych nigdy nie jest traktowany jak wynik prawidłowy i nie otwiera drogi do wypisu.
3. Dawki leków wysokiego ryzyka mają pełny rachunek pompy: ilość leku, rozpuszczalnik, objętość końcowa, stężenie, ml/h i wynikowa dawka. Moduł podaje źródło: wytyczne (ESC, ERC, PTK, PTN itp.) i ChPL obok siebie.
4. Progi zaproponowane w tej specyfikacji, które nie wynikają wprost z wytycznych, są oznaczone **[DO AKCEPTACJI]**. Przed wdrożeniem zatwierdza je lekarz.

# 1. Jak zbudowana jest wersja 5.1 (mapa kodu)

## 1.1 Powłoka aplikacji

| Element | Plik | Uwagi |
|--------------------|-----------------------------------|---------------------------------------------|
| Strona główna, pasek górny | `index.html` | `<header id="top">`: marka, `#pbar` (pasek pacjenta), przyciski 🖨 Ten ekran / 📚 Źródła / 🖨 Raport zbiorczy / 🆕 Następny pacjent, `#lamp` (lampka alarmu 30 px), `#mute` |
| Logika powłoki | `shell.js` | `PT` = dane pacjenta w `localStorage['sk_patient']` (`w, h, age, sex, crMg, co{liver,renal,heart,preg}`); `SKS.P()`; `alarm(key,on)` (lampka + dźwięk `SORSound`); nawigacja `go()/show()`; most do ramek `bridge()/sync()`; `wipe()` = „Następny pacjent” |
| Dźwięki | `sound.js` | `SORSound`: tony do wyboru classic, guitar, piano, bells (domyślny), marimba; ustawienie w `sk_settings.tone` |
| Wydruk | `report.js` + `shell.css` (`@media print`, `@page A4 14mm`) | `SORReport.capture()` zapisuje tekstowe migawki modułów (`sk_snap`), `SORReport.print(parts)` drukuje |
| Lista modułów | `mods.js` (`SKM.list`, `SKM.insertAfter`) + `mods2–5.js`, `b1-ui.js`, `b2-ui.js`, `c-ui.js`, `clinical-ui.js` (`install()`), `workbench.js`, `fluid.js`, `leki-ui.js`, `icd-ui.js`, `telefony-ui.js`, `eucast-ui.js` | |
| Style | `shell.css` (`--pk:#ff5fa2`, `--vi:#7b3fe4`), `advanced.css`, `big.css` | |

## 1.2 Dwa typy modułów

**Moduły natywne** renderują się w `#main` przez `render(el, X)`. Są to m.in.:

- DKA/HHS, Antykoagulacja, Anafilaksja, Sepsa, AF;
- Zatorowość płucna, Ostra niewydolność serca i Zapalenie płuc (przez `install()` w `clinical-ui.js`);
- Zatrucia, Neurologia, Neuroinfekcje (`c-ui.js`), Bilans płynów, Leki.

Zgłaszają alarm przez `X.alarm(id, bool)`.

**Moduły w ramce** (`frame: 'mod/…/index.html'`):

| Moduł | Ścieżka |
|-------------------------------------------|---------------------------------------------------------|
| Pompy | `mod/pompy` |
| Omdlenie | `mod/omdlenie` |
| Stan padaczkowy | `mod/se` |
| Elektrolity SOR | `mod/el` |
| Troponina | `mod/troponina` |
| Hamulec | `mod/hamulec` |
| Przegląd wyników | `mod/pw` |
| Antybiotykoterapia PZP | `mod/zp`, osadzona w zakładce modułu „Zapalenie płuc” |

Powłoka (`shell.js → sync()`) przekazuje do ramek tylko część danych:

- masę (`#w`) do wszystkich ramek;
- wiek i płeć do `el` i `trop`;
- choroby współistniejące i CrCl do `se`.

Moduł `zp` czyta pasek pacjenta tylko przy załadowaniu (`bar()`). Alarm z ramki rozpoznawany jest po selektorze CSS (`m.red`) albo po przechwyceniu `HTMLMediaElement.play`.

## 1.3 Istotne ustalenia z kodu (błędy do naprawy w P1)

1. **„Następny pacjent” nie czyści wszystkich danych.** `wipe()` usuwa tylko klucze zaczynające się od `sk_`, `omdl_` i `se4state:`. Zostają `zp1state` (zapalenie płuc, łącznie z ręcznie wybranym miejscem leczenia „Dom”), `zp_handoff` (przekazanie z zakładki „Skale”, ważne 12 h) i `el1state:` (Elektrolity SOR). **Kolejny pacjent może dostać wartości i decyzje poprzedniego.**
2. **Wspólny `localStorage` dla 5.1 i 5.2.** Wszystkie repozytoria na `j736107-beep.github.io` mają ten sam origin przeglądarki. Wersja testowa 5.2 pod innym adresem będzie więc dzielić z 5.1 klucze `sk_patient`, `sk_settings`, `zp1state` itd. W 5.2 trzeba dodać prefiks kluczy (np. `v52:`). Patrz rozdział 5.
3. **Dwa niezależne silniki ciężkości zapalenia płuc dają różne wyniki.** `calc/clinical.js → capDisposition()` (zakładka „Skale”) uznaje za kryterium hospitalizacji SpO₂ <90%. `mod/zp/engine.js → place()` (zakładka „Antybiotykoterapia”) przyjmuje SpO₂ <92% i nie liczy PSI, tylko przyjmuje klasę klikniętą ręcznie. Szczegóły w punkcie 14.
4. **„Ostateczny hamulec” błędnie odczytuje parametry z wklejonego tekstu.** Szczegóły w punkcie 4.

# 2. Etapy wdrożenia (propozycja)

| Etap | Zakres | Priorytet |
|------------------|------------------------------------------------------------------|----------------|
| **Etap 1 – bezpieczeństwo i szkielet** | wspólny pasek pacjenta (pkt 1); wydruk 1–2 stron A4 (pkt 2); wyłączenie hamulca (pkt 4); pełna naprawa zapalenia płuc (pkt 14); pełne czyszczenie przy „Następny pacjent”; prefiks kluczy w 5.2 | P1 |
| **Etap 2 – treść kliniczna** | stan padaczkowy: drugi lek II rzutu i tiamina (pkt 7); hiponatremia i tiamina (pkt 8); anafilaksja oporna i czas obserwacji (pkt 12); posiewy w sepsie (pkt 13); neuroinfekcje: wirusowy wzorzec PMR (pkt 16); własne kalkulatory offline (pkt 17) | P2 |
| **Etap 3 – wygląd i grafika** | schematy EKG (pkt 9); nowa szata graficzna bez różu: omdlenia, zapalenie płuc, elektrolity, potem pozostałe ramki (pkt 6); polskie nazwy DKA/HHS (pkt 10); zdjęcia grzybów (pkt 15); kod Kompendium na stronie tytułowej (pkt 3) | P3 (pkt 10 i 3 są proste i mogą wejść wcześniej) |

**Po każdym etapie:** testy z rozdziału 4, publikacja do wersji testowej 5.2, akceptacja lekarza i dopiero potem kolejny etap.

# 3. Zmiany szczegółowe

## Punkt 1. Wspólny pasek pacjenta – P1

**Co:** u góry aplikacji jeden pasek z polami:

- imię i nazwisko;
- ~~nr identyfikacyjny pacjenta~~ – USUNIĘTY 11.11.2026 (RODO): wiek (lata) i płeć wpisywane ręcznie w pasku pacjenta, przenoszone do wszystkich modułów;
- wiek;
- płeć K/M;
- masa [kg], wzrost [cm], BMI (wyliczane);
- kreatynina z CrCl Cockcrofta-Gaulta (Cockcroft-Gault, CG) i eGFR CKD-EPI 2021 (już istnieją);
- data i godzina przyjęcia;
- przełączniki: wątroba, nerki, serce, ciąża (już istnieją).

Dane same przechodzą do wszystkich modułów i nie trzeba ich wpisywać ponownie.

**Stan obecny:** pasek `#pbar` już istnieje. Ma masę, wzrost, BMI, wiek, płeć, kreatyninę, CrCl, eGFR i przełączniki. **Brakuje imienia i nazwiska, nr. identyfikacyjnego [usunięty 11.11.2026] i godziny przyjęcia.** Lokalne pola „Imię i nazwisko / nr identyfikacyjny [usunięty 11.11.2026]” są tylko w Troponinie (`mod/troponina/index.html`, `#pname`) i w Neurologii (`mods5.js`, `#pname`).

**Gdzie i jak:**

- `index.html`: do `#pbar` dodać `#pname`, `#padm` (datetime-local). Napis marki zwęzić i lekko przesunąć w prawo (`.brand` z mniejszym `small`), a pasek zrobić dwuwierszowy na wąskich ekranach i przyklejony do góry (`position: sticky`).
- `shell.js`:
  - rozszerzyć `PT` o `name, adm`;
  - imię, nazwisko i nr identyfikacyjny [usunięty 11.11.2026] trzymać w `sessionStorage`, a nie w `localStorage` (dane osobowe nie mogą przetrwać zamknięcia karty) i czyścić je przy „Następny pacjent”;
  - rozszerzyć `SKS.P()`;
  - w `sync()` przekazywać do **wszystkich** ramek wiek, płeć, masę, wzrost, kreatyninę, imię i nazwisko, nr identyfikacyjny [usunięty 11.11.2026] oraz choroby współistniejące (dziś tylko wybiórczo);
  - dodać zdarzenie `sk-patient` (`CustomEvent`) wysyłane przy każdej zmianie, na które moduły natywne odświeżają widok;
  - moduł `zp` ma reagować na zmianę paska na żywo, a nie tylko przy załadowaniu.
- Troponina i Neurologia: lokalne pola imienia i nr. identyfikacyjnego [usunięty 11.11.2026] powiązać z paskiem globalnym w obie strony albo zastąpić je odczytem z paska.
- `wipe()` ma usuwać **wszystkie** stany modułów: dodać `zp1state`, `zp_handoff`, `el1state:` oraz ogólną regułę „każdy klucz z prefiksem wersji” (patrz pkt 1.3).

**Ochrona danych:** w stopce paska krótka informacja: „Dane pacjenta tylko w tej karcie przeglądarki; czyszczone przy »Następny pacjent« i zamknięciu karty”. Obecny tekst w module Zatrucia („aplikacja nie zbiera identyfikatorów pacjenta”) trzeba zaktualizować.

**Testy akceptacyjne:**

1. Wpisz masę 70, wiek 40 i płeć M, otwórz Pompy, Stan padaczkowy, Elektrolity, Troponinę, Zapalenie płuc i Omdlenie. W każdym są te same wartości, nic nie trzeba wpisywać.
2. Zmiana masy w pasku przy otwartym module zmienia dawki na żywo.
3. nr identyfikacyjny [usunięty 11.11.2026] z błędną sumą kontrolną daje ostrzeżenie i niczego nie uzupełnia.
4. „Następny pacjent” zostawia puste wszystkie pola we wszystkich modułach, łącznie z Zapaleniem płuc i Elektrolitami. Zamknięcie karty usuwa imię i nazwisko.

## Punkt 2. Wydruk z każdego modułu do dokumentacji (1–2 strony A4) – P1

**Co:** w każdym module przycisk „🖨 Drukuj do dokumentacji”. Wydruk ma 1–2 strony A4.

**Nagłówek:**

- logo szpitala i nazwa oddziału;
- imię i nazwisko, nr identyfikacyjny [usunięty 11.11.2026] (jeśli wpisany), wiek, płeć, masa, wzrost, BMI, CrCl;
- data i godzina wydruku, godzina przyjęcia;
- moduł i wersja.

**Treść:** wprowadzone dane, wyniki skal, propozycje leczenia z dawkami i rachunkiem pompy, zalecenia.

**Stopka:** „Narzędzie pomocnicze – niecertyfikowane. Decyzja i odpowiedzialność: lekarz”, miejsce na podpis i pieczątkę, numer strony.

**Stan obecny:** przyciski „🖨 Ten ekran” i „🖨 Raport zbiorczy” już są (`shell.js → printParts()`, `report.js`). Drukują tekstową migawkę ekranu bez danych identyfikacyjnych i bez limitu długości. Troponina ma własny wydruk (`#pr`) z polem „Pacjent”.

**Gdzie i jak:**

- `report.js`: nowa funkcja `SORReport.printModule(id)`. Każdy moduł dostaje opcjonalną metodę `printSummary()`, która zwraca uporządkowany HTML (tabela wejść, wyników i zaleceń). Gdy moduł jej nie ma, zostaje obecna migawka tekstowa.
- `shell.css` (`@media print`):
  - `@page { size: A4; margin: 12mm }`;
  - czcionka 10 pt;
  - `break-inside: avoid` dla kart;
  - źródła skrócone do przypisów na końcu, bez długich cytatów;
  - ukryte przyciski, ramki i słowniczek.
- Gdy treść przekracza 2 strony, moduł drukuje wersję skróconą (tylko wyniki i zalecenia). Pełne źródła są w „📚 Źródła”.
- W ramkach przycisk w nagłówku ramki woła `parent.SORReport.printModule(m.id)`.

**Testy:** wydruk z każdego modułu przy typowym przypadku ma ≤2 strony A4 (podgląd wydruku w Chrome). Nagłówek zawiera imię i nazwisko z paska. Działa offline.

## Punkt 3. Kompendium interny – kod dostępu na stronie tytułowej – P3

**Stan obecny:** Kompendium jest osobną stroną (repo `kompendium-interny`, jeden plik `index.html`, ok. 3 MB). Asystent otwiera ją z pulpitu (`workbench.js`, `#wb-komp`, `location.href`). Mechanizm wygląda tak:

1. Strona tytułowa `#okladka` z zieloną pulsującą kropką „Wejdź” (`#wejdz`).
2. Po kliknięciu `start()`.
3. Jeśli w `localStorage['kompSOR.v1'].kod` jest ważny kod (`sprawdz()`: format `K1-…`, podpis Ed25519 `nacl.sign`, daty ważności), treść się otwiera.
4. Jeśli nie, pojawia się zamek `#zamek` z polem `#kod`.
5. Jest też okres testowy (`CFG.test`).

**Wykonalność:** tak, w dwóch miejscach.

- **(a) Na stronie tytułowej Kompendium:** obok przycisku „Wejdź” dodać pole „Kod dostępu (pierwsze uruchomienie)” i przycisk „Zapisz kod”. Korzysta z istniejącego `sprawdz()`. Przy poprawnym kodzie zapisuje `ST.kod` i od razu wchodzi. Gdy kod jest już zapisany, pole jest zwinięte („Licencja ważna do …, zmień kod”).
- **(b) W Asystencie, na pulpicie przy kafelku Kompendium:** Asystent i Kompendium mają ten sam origin (`j736107-beep.github.io`), więc Asystent może zapisać kod do `localStorage['kompSOR.v1']`. Weryfikacja i tak odbywa się w Kompendium przy otwarciu. Rekomendacja: (a) jako główne miejsce, (b) opcjonalnie.

**Uwaga techniczna:** klucz odszyfrowania treści (`klucz()`) powstaje z danych zawartych w samym pliku (klucz publiczny i stała), więc kod dostępu działa jak bramka licencyjna, a nie jak prawdziwe zabezpieczenie treści. Dla celu „licencja dla zespołu” to wystarczy, ale trzeba o tym wiedzieć.

**Zmiana obejmuje drugie repozytorium (`kompendium-interny`).** Zalecana osobna gałąź albo kopia testowa.

**Testy:**

1. Czysta przeglądarka, wklejenie kodu na stronie tytułowej: wejście bez drugiego okna kodu.
2. Kod błędny: komunikat z `sprawdz()`.
3. Kod wygasły: komunikat o wygaśnięciu.
4. Kod zapisany: kliknięcie „Wejdź” wchodzi od razu, jak dotąd.

## Punkt 4. „Ostateczny hamulec – kontrola przed wypisem” – wstrzymanie modułu – P1

**Co:** moduł zostaje w menu, ale ma nieaktywne przyciski i czerwony napis: **„MODUŁ NIE DZIAŁA PRAWIDŁOWO I ZOSTAŁ WSTRZYMANY. Nie opieraj decyzji o wypisie na tym module.”**

**Dlaczego nie działa – ustalenia z testów silnika (`mod/hamulec/engine.js`):**

- **Fałszywie ujemne:** tętno zapisane z przecinkiem lub kropką po liczbie nie jest rozpoznawane. „HR 135, SpO2 97” i „tętno 80.” dają brak tętna. Przyczyna: wyrażenie regularne `(\d{2,3})(?![\d.,]…)`. Tachykardia >120/min może więc przejść bez alarmu.
- **Fałszywie dodatnie i ujemne przy kolejności wpisów:** silnik bierze **ostatnią wartość w tekście**, a nie najnowszą w czasie. „GCS 15 pkt; wcześniej GCS 8” daje GCS 8 i alarm krytyczny. Optimed często wkleja wpisy od najnowszego, co odwraca logikę.
- NEWS2 (National Early Warning Score 2) liczy się tylko przy komplecie 5 parametrów. Bez kompletu np. oddechy 30/min dają tylko „UWAGA”.
- Zaprzeczenie „nie” w odległości do 40 znaków przed słowem kluczowym wyłącza objaw. Przykład: „nie potrafi określić, czy ból w klatce” jest traktowane jako brak bólu.
- „RR” w polskiej dokumentacji oznacza ciśnienie, a bywa też używane dla oddechów.
- Alarm `SORWypis` uruchomiony przez fałszywie dodatni wynik **nie daje się wyłączyć do zamknięcia karty** i blokuje „Następny pacjent” (`shell.js`: `if (SORWypis.active) return`).

**Gdzie i jak:**

- `mod/hamulec/index.html`: nad formularzem czerwony baner z napisem jak wyżej. `#go`, `#exC`, `#exO`, `#clr` i `#paste` dostają `disabled`, a `textarea` ma `readonly`.
- `mod/hamulec/app.js`: `run()` od razu wychodzi (`return`), a odtwarzanie z `SKS.hbMem` jest wyłączone.
- `wypis.js`: w nazwie modułu w menu dopisek „(WSTRZYMANY)”, ikona szara.
- Kod silnika zostaje w repozytorium do ewentualnej przebudowy.

**Testy:** przyciski są nieaktywne, napis widoczny, kliknięcie i Enter nic nie robią, alarm z tego modułu nie może się włączyć.

## Punkt 5. (usunięty)

Decyzja lekarza 11.11.2026: wersja 5.2 nie zawiera żadnego mechanizmu alarmu blokującego wypis – bez lampy, nakładki, dźwięku, paska i sekcji na wydruku, w żadnym module.

## Punkt 6. Szata graficzna bez różu (omdlenia, elektrolity, zapalenie płuc, pozostałe) – P3

**Gdzie są definicje kolorów:**

- zmienne `--pink:#ff5fa2`, `--vio:#7b3fe4` i gradienty `linear-gradient(…var(--pink),var(--vio))` w nagłówkach, przyciskach i paskach postępu: `mod/omdlenie/style.css`, `mod/zp/style.css`, `mod/el/style.css`, `mod/se/style.css`, `mod/pompy/style.css`;
- w powłoce `shell.css` (`--pk`, `--vi`), `index.html` (`theme-color #7b3fe4`), `mod/troponina/index.html` (nagłówek `#7b3fe4`);
- inline w oknach zastrzeżeń `#startDisc` każdej ramki.

**Jak:**

- Jeden plik `theme.css` ze wspólną paletą „kliniczną”:
  - granat `#1f3a5f` (nagłówki);
  - grafit `#2b2f36` (tekst);
  - jasnoszary `#f4f6f8` (tło);
  - niebieski `#1565c0` (akcje);
  - czerwony `#c62828` wyłącznie dla alarmów i przeciwwskazań;
  - pomarańczowy `#b45309` dla uwag.
- Zielony i żółty jako jedyny nośnik oceny są zniesione: każda ocena ma też słowo („WYSOKIE RYZYKO”, „UWAGA”, „BEZ CECH ALARMOWYCH”).
- Zmienne `--pink`/`--vio` w modułach przemapować na paletę (zmiana jednego miejsca w każdym pliku), a gradienty zamienić na jednolite tło.
- **Omdlenie (`mod/omdlenie`):**
  - jednolity nagłówek;
  - grupy pytań (K, E, W, B, G, L, M) w kartach z neutralnym tłem i lewym paskiem w kolorze kategorii, bez pastelowych teł;
  - większa czcionka pytań (17 px);
  - jasny podział na trzy kolumny wyników: „wysokie ryzyko”, „niskie ryzyko”, „brakujące”;
  - pasek postępu jednolity.
- **Elektrolity, Zapalenie płuc:** to samo. Nagłówki sekcji (`.ln`, `.sec h2`) granatowe zamiast różowych.

**Testy:** wizualne porównanie zrzutów przed i po. Kontrast tekstu ≥4,5:1 (WCAG AA). Nigdzie nie zostaje `#ff5fa2` (sprawdzenie przez `grep`).

## Punkt 7. Stan padaczkowy – drugi lek II rzutu i tiamina – P2

**Stan obecny (`mod/se/engine.js`, `mod/se/app.js`):**

- etap II rzutu ma etykietę „II rzut: jedna dawka (ESETT: LEV = VPA = fPHT)” (`LINES[2]`);
- walproinian jest policzony prawidłowo: 40 mg/kg, maks. 3000 mg, Depakine 400 mg = 100 mg/ml, 10 min;
- przeciwwskazania z ChPL są (wątroba, ciąża);
- **nie ma** ścieżki „brak efektu po lewetyracetamie, podaj drugi lek II rzutu”;
- przełączników jest mało: wątroba, nerki, serce, ciąża; brak chorób mitochondrialnych (POLG), zaburzeń cyklu mocznikowego i małopłytkowości;
- tiamina jest tylko w etapie 0 („100 mg i.v. przed glukozą”) z dopiskiem o braku preparatu w Rejestrze Produktów Leczniczych (RPL).

**Co i jak:**

1. **Drugi lek II rzutu:** jeśli w dzienniku podań jest lek II rzutu i napad trwa, po upływie czasu podania i ok. 10 min obserwacji pokaż kartę „II rzut – drugi lek (opcjonalnie, bez opóźniania III rzutu)” z lekami **innymi niż podany**.
   - Przy podanym lewetyracetamie proponuj walproinian 40 mg/kg i.v., maks. 3000 mg, w ok. 10 min. Pokaż pełny rachunek: mg, ml roztworu 100 mg/ml, fiolki, ml/h.
   - Alternatywa: fenytoina lub lakozamid według istniejących kart.
   - Uzasadnienie: badanie ESETT pokazało porównywalną skuteczność lewetyracetamu, walproinianu i fosfenytoiny. Wytyczne Neurocritical Care Society (NCS) dopuszczają dodatkowy lek, o ile nie opóźnia leczenia III rzutu.
   - Na karcie widoczny licznik czasu od początku napadu. Przy ≥40 min albo przy pogorszeniu oddychania czerwony komunikat: „Nie zwlekaj: III rzut – intubacja, wlew anestetyku, ciągłe EEG (elektroencefalografia), konsultacja OIT (oddział intensywnej terapii)”.
2. **Przeciwwskazania walproinianu:** dodać przełączniki „choroba mitochondrialna / POLG”, „zaburzenia cyklu mocznikowego”, „PLT <100 G/l lub skaza krwotoczna”.
   - Walproinian zablokowany przy chorobie wątroby, POLG, zaburzeniach cyklu mocznikowego, ciąży i kobietach w wieku rozrodczym bez alternatywy (ChPL i komunikaty Europejskiej Agencji Leków, EMA). Status: **[DO DECYZJI LEKARZA]**.
   - Przy małopłytkowości ostrzeżenie.
   - Przy zatruciu salicylanami lub karbapenemie dopisek o interakcji z meropenemem (spadek stężenia walproinianu, ChPL).
3. **Tiamina (alkoholizm, niedożywienie):** przełącznik „alkoholizm / niedożywienie / bariatria / wymioty przewlekłe”. Po włączeniu w etapie 0 i w podsumowaniu pojawia się:
   - **profilaktyka:** tiamina 100 mg i.v. przed glukozą albo razem z nią (AES 2016). Przy hipoglikemii glukozy nie opóźniać;
   - **podejrzenie encefalopatii Wernickego** (splątanie, ataksja, oczopląs lub oftalmoplegia, ale także każdy niewyjaśniony stan świadomości u alkoholika): 500 mg i.v. 3 razy na dobę przez 3–5 dni, potem 250 mg i.v./i.m. raz na dobę przez 5 dni albo do poprawy, potem doustnie. Źródła: RCP 2008 i EFNS 2010, który podaje 200 mg i.v. 3 razy na dobę;
   - **sposób podania:** w 100 ml NaCl 0,9% albo glukozy 5%, wlew przez 30 min. Przygotowany zestaw przeciwwstrząsowy;
   - **rachunek dla preparatu szpitalnego:** w przetargach szpitali jest tiamina 50 mg/ml w ampułkach 2 ml = 100 mg. 500 mg to 5 ampułek = 10 ml. **[DO WERYFIKACJI z apteką szpitalną: nazwa, stężenie, ChPL lub ulotka importu]**.
4. Komunikat III rzutu i OIT bez zmian.

**Testy:**

1. Masa 70 kg, podany lewetyracetam, napad trwa: karta drugiego leku z walproinianem 2800 mg = 28 ml w 10 min = 168 ml/h.
2. Masa 90 kg: walproinian ograniczony do 3000 mg = 30 ml (180 ml/h).
3. Ciąża albo POLG: walproinian zablokowany, proponowana fenytoina lub lakozamid.
4. Czas ≥40 min: czerwony komunikat III rzutu nad kartą drugiego leku.
5. Przełącznik „alkoholizm” pokazuje tiaminę 100 mg; „podejrzenie Wernickego” pokazuje 500 mg 3 razy na dobę z rachunkiem ampułek.

## Punkt 8. Elektrolity – hiponatremia, limity korekty, tiamina – P2

**Stan obecny (`mod/el/engine.js`):**

- lokalny bolus jest już wpisany jako STANDARD LOKALNY: 5 ampułek NaCl 10% (50 ml, ok. 85,5 mmol Na) + 100 ml G5% = 150 ml, ok. 3,3%, ok. 570 mmol/l, 20 min, 450 ml/h;
- ciężkie objawy prowadzą do bolusa, umiarkowane do jednego bolusa;
- limit: `R.limit = odsRisk ? 8 : 10`, plus tekst „potem ≤8 mmol/l/dobę”;
- ryzyko ODS (zespołu osmotycznej demielinizacji) to **jeden ręczny przełącznik**;
- korekta w dół jest (G5% 10 ml/kg + desmopresyna 2 µg).

**Co i jak:**

1. **Rozdzielić cel od limitu.** Dwie wyraźnie różne ramki:
   - **CEL:** wzrost o ok. 5 mmol/l w pierwszych godzinach (do ustąpienia objawów), potem leczenie przyczyny;
   - **LIMIT (nie przekraczać):**
     - bez czynników ryzyka ODS: ≤10 mmol/l w pierwszej dobie i ≤8 mmol/l w każdej następnej;
     - z czynnikami ryzyka: ≤8 mmol/l/dobę, cel 4–6 mmol/l/dobę.
   - Źródła: ESE/ESICM/ERA-EDTA 2014 dla limitów, zalecenia panelu ekspertów 2013 (Verbalis) dla celu 4–6 przy wysokim ryzyku.
2. **Ryzyko ODS liczone automatycznie** z danych zamiast jednego przełącznika:
   - Na⁺ ≤105 mmol/l (z wpisanego wyniku);
   - K⁺ <3,5 mmol/l (z wpisanego wyniku);
   - przełączniki: alkoholizm, niedożywienie, marskość lub ciężka choroba wątroby.
   - Widoczna lista „ryzyko ODS: TAK, bo …”.
3. **Schemat bolusów (objawy ciężkie):** 150 ml 3,3% w 20 min, kontrola Na⁺ na analizatorze SOR po 20 min, powtarzać **do 2 razy więcej (łącznie do 3 bolusów)**, aż Na⁺ wzrośnie o 5 mmol/l albo ustąpią objawy. Licznik bolusów z godziną i kolejne wyniki Na⁺ z automatycznym wyliczeniem przyrostu od wartości wyjściowej.
   - Gdy przyrost ≥5 albo objawy ustąpiły: „STOP bolusom”.
   - Gdy przyrost zbliża się do limitu (≥ limit − 2): ostrzeżenie.
   - Gdy przekroczy limit: karta korekty w dół: zatrzymać hipertoniczny NaCl, 10 ml/kg G5% w 1 h, desmopresyna 2 µg i.v. nie częściej niż co 8 h, kontrola Na⁺ co 1–2 h. Status **[DO DECYZJI LEKARZA / konsultacja]**.
4. **Monitorowanie:** Na⁺ po 20 min przy bolusach, potem po 6 i 12 h oraz co 4–6 h. Diureza godzinowa: >100 ml/h rozcieńczonego moczu oznacza ryzyko zbyt szybkiej korekty.
5. **Tiamina u alkoholików i niedożywionych:** ta sama karta co w pkt 7 (wspólny komponent `thiamineCard()` w `calc/`).

**Testy:**

1. Na⁺ 118, ciężkie objawy, bez ryzyka: bolus 150 ml, cel +5, limit 10/24 h.
2. Na⁺ 104: ryzyko ODS = TAK (Na⁺ ≤105), limit 8, cel 4–6.
3. K⁺ 3,1 i alkoholizm: ryzyko ODS = TAK.
4. Wpisane Na⁺ 118 → 121 → 124 (po 1. i 2. bolusie): STOP bolusom po drugim bolusie (+6).
5. Na⁺ po 24 h +11 bez ryzyka: karta korekty w dół z dawką G5% = 10 ml/kg (dla 70 kg: 700 ml w 1 h).

## Punkt 9. Troponina / EKG – schematy EKG przy każdym wzorcu – P3 (treść P2)

**Stan obecny:** `mod/troponina/index.html`, tablica `ECG` (12 przycisków: `stemi`, `post`, `rv`, `dew`, `sgar`, `avr`, `well`, `std`, `ti`, `lbbb`, `nonsp`, `norm`), tylko tekst. Brak schematów i brak rozpisanych kryteriów Sgarbossy.

**Co i jak:** każdy przycisk zamienić na kartę w ramce:

- nazwa po polsku;
- 1–3 zdania kryteriów;
- **mały schematyczny zapis EKG w SVG**: wbudowany, offline, siatka 1 mm, typowa morfologia QRS-ST-T z zaznaczonym punktem J i strzałką mierzonego odcinka;
- przycisk „Zaznacz”;
- schemat powiększa się po dotknięciu.

Osobny plik `mod/troponina/ecg-svg.js` z funkcją rysującą zespoły z parametrów (amplituda ST, kształt T, szerokość QRS), dzięki czemu każdy wzorzec to kilka liczb, a nie ręczny rysunek.

| Karta | Kryteria do wyświetlenia | Schemat |
|------------|-------------------------------------------------------------------------|----------------|
| STEMI | Nowe uniesienie ST w punkcie J w ≥2 sąsiednich odprowadzeniach: ≥1 mm (wszystkie poza V2–V3); V2–V3: ≥2 mm u mężczyzn ≥40 lat, ≥2,5 mm u mężczyzn <40 lat, ≥1,5 mm u kobiet | wypukłe uniesienie ST w 2 sąsiednich odprowadzeniach (np. V2, V3) |
| Zawał ściany dolnej | Uniesienie ST w II, III, aVF; obniżenie lustrzane w aVL; ST III > II sugeruje prawą tętnicę wieńcową (RCA) → wykonaj V4R | II, III, aVF z uniesieniem + aVL z obniżeniem |
| Zawał prawej komory | Uniesienie ST ≥0,5 mm w V3R–V4R (≥1 mm u mężczyzn <30 lat); unikaj azotanów, płyny przy hipotensji | V4R z uniesieniem |
| Zawał ściany tylnej | Obniżenie ST V1–V3 z dodatnim T; uniesienie ST ≥0,5 mm w V7–V9 | V2 z obniżeniem + V8 z uniesieniem |
| Wzór de Wintera | Skośne do góry obniżenie ST 1–3 mm w punkcie J w V1–V6 z wysokimi, symetrycznymi T; często uniesienie ST ok. 0,5–1 mm w aVR; równoważnik STEMI (proksymalny odcinek gałęzi przedniej zstępującej, LAD) | V3 z obniżeniem J i wysokim T |
| Uniesienie ST w aVR | Uniesienie ST w aVR ≥1 mm z rozlanym obniżeniem ST ≥1 mm w ≥6 odprowadzeniach: ciężkie globalne niedokrwienie (pień lewej tętnicy wieńcowej lub choroba wielonaczyniowa), szczególnie z niestabilnością | aVR z uniesieniem + V5 z obniżeniem |
| Zespół Wellensa | Typ A: dwufazowe T (+/−) w V2–V3; typ B: głęboko ujemne, symetryczne T w V2–V3; bez bólu w chwili zapisu, bez/minimalne uniesienie ST, zachowane załamki R; krytyczne zwężenie LAD, **nie wykonywać próby wysiłkowej** | V2 typ A i V3 typ B |
| Obniżenie ST ≥0,5 mm | Poziome lub skośne w dół obniżenie ST ≥0,5 mm w ≥2 sąsiednich odprowadzeniach | V5 z poziomym obniżeniem |
| Odwrócenie załamka T | T ujemny ≥1 mm w ≥2 sąsiednich odprowadzeniach z wyraźnym R lub R/S >1 | V4 z ujemnym T |
| Blok lewej odnogi (LBBB) – kryteria czasowe | QRS ≥120 ms; QS lub rS w V1; szeroki, zazębiony R w I, aVL, V5–V6; brak q w I, V5–V6; czas do szczytu R >60 ms w V5–V6 | V1 (QS) i V6 (szeroki, zazębiony R), linijka 120 ms |
| LBBB lub stymulacja + kryteria Sgarbossy | **Klasyczne (Sgarbossa 1996):** (1) uniesienie ST ≥1 mm **zgodne** z kierunkiem QRS w dowolnym odprowadzeniu, 5 pkt; (2) obniżenie ST ≥1 mm w V1–V3, 3 pkt; (3) uniesienie ST ≥5 mm **niezgodne** z QRS, 2 pkt; ≥3 pkt oznacza zawał. **Zmodyfikowane (Smith 2012):** kryterium (3) zastąpione stosunkiem uniesienia ST do głębokości S ≤ −0,25, czyli ST ≥25% głębokości poprzedzającego S | trzy mini-schematy z zaznaczonymi kierunkami QRS i ST oraz miarką ST/S |
| Rytm stymulatorowy bez kryteriów Sgarbossy | Spike stymulatora, szerokie QRS, niezgodne ST-T wtórne. Uwaga: wg ESC 2023 przy LBBB lub stymulacji i silnym podejrzeniu trwającego niedokrwienia postępuj jak w STEMI bez względu na kryteria | spike + szeroki QRS |
| Niespecyficzne zaburzenia repolaryzacji | Spłaszczone T, obniżenie ST <0,5 mm, bez dynamiki; porównaj z poprzednim EKG, powtórz po 15–30 min przy bólu | spłaszczony T |
| Przerost lewej komory (LVH) | Sokolow-Lyon: S V1 + R V5/V6 ≥35 mm; Cornell: R aVL + S V3 >28 mm (M) / >20 mm (K); wzorzec przeciążenia (strain) w V5–V6 | wysoki R V5 z asymetrycznym ujemnym T |
| EKG prawidłowe | Rytm zatokowy, brak kryteriów jw.; **prawidłowe EKG nie wyklucza OZW (ostrego zespołu wieńcowego)**; powtórz przy nawrocie bólu | prawidłowy zespół |

Nad kartami czerwony napis: „EKG 12-odprowadzeniowe ≤10 min od pierwszego kontaktu (ESC 2023)” z polem godziny wykonania EKG i licznikiem.

**Źródła:** ESC 2023 Wytyczne dotyczące OZW; Czwarta uniwersalna definicja zawału serca (2018); Sgarbossa i wsp. NEJM 1996; Smith i wsp. Ann Emerg Med 2012; AHA/ACCF/HRS 2009 (kryteria LBBB).

**Testy:** każda karta ma schemat (14 kart), działa offline i jest widoczna na wydruku (SVG nie jest wycinany w `report.js`, który dziś pomija `SVG`; dodać wyjątek dla `.ecg-svg`).

## Punkt 10. DKA / HHS – polskie nazwy – P3 (proste)

**Gdzie:** `b1-ui.js` linia 29 (`id:'dka', name:'DKA / HHS'`, tytuł „DKA / HHS – pompa insuliny”) oraz definicja w `mods.js`.

**Jak:**

- Nazwa w menu: „Kwasica ketonowa (DKA) / Stan hiperosmolarny (HHS)”.
- Tytuł modułu dużą czcionką: **„Cukrzycowa kwasica ketonowa (DKA)”** i **„Hiperglikemiczny stan hiperosmolarny (HHS)”**.
- W treści przy pierwszym wystąpieniu: DKA = diabetic ketoacidosis, HHS = hyperglycaemic hyperosmolar state. Dopisać do `gloss.js`.
- Dane pacjenta i wydruk przez pkt 1 i 2.

**Test:** menu, tytuł i wydruk zawierają pełne polskie nazwy.

## Punkt 11. Bilans płynów i Antykoagulacja – dane pacjenta i wydruk – P1 (przez pkt 1–2)

- **Bilans płynów (`fluid.js`):** nagłówek z danymi pacjenta, `printSummary()` z tabelą przyjęte / wydalone / bilans i godzinami.
- **Antykoagulacja (`mods2.js`, zakładki `ufh`, `enox`, `vka`, `noac`, `alt1–3`, `prot`):** osobny przycisk wydruku **w każdej zakładce**, drukujący nagłówek pacjenta, wprowadzone dane (masa, CrCl, INR, APTT, czas ostatniej dawki NOAC), wyliczone dawki z rachunkiem pompy i schematem kontroli (np. APTT co 6 h).

**Test:** wydruk z każdej zakładki ma 1 stronę A4 z nazwiskiem pacjenta.

## Punkt 12. Anafilaksja – leczenie poza adrenaliną i płynami, czas obserwacji – P2

**Stan obecny (`mods3.js`, `ANA`):**

- adrenalina i.m. według masy i wieku;
- płyny;
- przy zaznaczeniu „oporna” tylko odesłanie do modułu Pompy;
- przy β-blokerze glukagon „1–5 mg i.v. w 5 min, potem 5–15 µg/min” (`calc/batch3.js`). **To schemat z zatrucia β-blokerem, a nie z anafilaksji.**
- brak czasu obserwacji.

**Co i jak – algorytm anafilaksji opornej (RCUK 2021 / ERC 2021 i 2025, EAACI 2021, WAO 2020) [dawki DO WERYFIKACJI z ChPL i protokołem szpitala]:**

1. **Kryterium oporności:** brak poprawy oddechu lub krążenia po 2 dawkach adrenaliny i.m. z płynami. Wezwij anestezjologa.
2. **Wlew adrenaliny i.v.** z pełnym rachunkiem:
   - **Strzykawka 50 ml (propozycja SOR):** adrenalina 1 mg (1 ml roztworu 1 mg/ml) + 49 ml NaCl 0,9% = 50 ml, czyli **20 µg/ml**.
   - **Dawka startowa według RCUK:** 0,5–1 ml/kg/h roztworu 10 µg/ml, czyli 5–10 µg/kg/h (0,083–0,167 µg/kg/min).
   - **Przykład dla 70 kg:** 0,083 µg/kg/min × 70 kg = 5,8 µg/min = 350 µg/h; przy 20 µg/ml daje to **17,5 ml/h**. Górna wartość startowa 700 µg/h = 35 ml/h.
   - Moduł liczy to z masy z paska, pokazuje dawkę wynikową w µg/kg/min i µg/min oraz miareczkowanie co 2–5 min według odpowiedzi.
   - Do czasu rozpoczęcia wlewu kontynuuj adrenalinę i.m. co 5 min.
   - Alternatywa z lokalnej bazy „Pompy SOR”: 5 mg/50 ml = 100 µg/ml, z przeliczeniem ml/h. Pokazać, którą recepturę wybrano.
3. **Hipotensja mimo adrenaliny:**
   - kolejne bolusy krystaloidu 500–1000 ml (dzieci 10 ml/kg), często kilka litrów;
   - noradrenalina (receptura z „Pompy SOR”, 4 mg/50 ml = 80 µg/ml, z rachunkiem) albo wazopresyna lub metaraminol według dostępności, decyzja anestezjologa;
   - wczesna konsultacja OIT.
4. **Pacjent na β-blokerze:** glukagon 1–2 mg i.v. lub i.m., powtarzany co 5 min (RCUK/ERC). Poprawić tekst w `calc/batch3.js` i rozdzielić schemat anafilaksji od schematu zatrucia β-blokerem.
5. **Skurcz oskrzeli:** salbutamol w nebulizacji. **Obrzęk górnych dróg oddechowych:** adrenalina w nebulizacji jako leczenie wspomagające, wczesna intubacja.
6. **Leki drugiego rzutu:** leki przeciwhistaminowe i glikokortykosteroidy nie są lekami ratującymi życie i nie mogą opóźniać adrenaliny (RCUK 2021).
7. **Laboratorium:** tryptaza w surowicy jak najszybciej po wystąpieniu objawów, po ok. 2 h i po ≥24 h (EAACI).

**Czas obserwacji przed wypisem (RCUK 2021), z licznikiem od ustąpienia objawów i blokadą wypisu z pkt 5:**

- **≥2 h:** dobra odpowiedź na 1 dawkę adrenaliny, pełne ustąpienie objawów, pacjent ma 2 autowstrzykiwacze i przeszkolenie, jest pod opieką;
- **≥6 h:** potrzebne 2 dawki adrenaliny i.m. albo reakcja dwufazowa w wywiadzie;
- **≥12 h:** ciężka reakcja (>2 dawki), ciężka astma, możliwe dalsze wchłanianie alergenu (np. leki o przedłużonym uwalnianiu), przyjęcie późnym wieczorem lub w nocy, utrudniony dostęp do pomocy, a także konieczność wlewu adrenaliny lub wazopresora (wtedy hospitalizacja).

Przed wypisem do zaleceń: 2 autowstrzykiwacze adrenaliny, instruktaż, poradnia alergologiczna, tryptaza.

**Testy:**

1. Masa 70 kg i „oporna”: wlew 1 mg/50 ml = 20 µg/ml, 17,5–35 ml/h = 5,8–11,7 µg/min.
2. β-bloker: glukagon 1–2 mg co 5 min, a nie 5–15 µg/min.
3. Dwie dawki adrenaliny i godzina ustąpienia 14:00: obserwacja do 20:00.
4. Wlew adrenaliny: hospitalizacja.

## Punkt 13. Sepsa – pobranie materiału na posiewy (lista do odhaczenia) – P2

**Stan obecny:** `b2-ui.js` (moduł Sepsa) ma tylko jedno pole „Posiewy krwi ≥2 zestawy pobrane PRZED antybiotykiem” (`d_cult`) i „Wyniki posiewów przejrzane”.

**Co i jak:** nowa zakładka „Materiał na posiewy”. Każda pozycja to pole wyboru z godziną; zestawy krwi mają licznik.

1. **Krew:**
   - **2 zestawy** (zestaw = butelka tlenowa + beztlenowa) z **dwóch oddzielnych wkłuć** obwodowych, ewentualnie w odstępie kilku minut;
   - 8–10 ml do każdej butelki u dorosłego, czyli ok. 20 ml na zestaw, łącznie ok. 40 ml (objętość krwi to najważniejszy czynnik czułości);
   - pobrać **przed antybiotykiem, o ile nie opóźni to jego podania** (SSC 2021: antybiotyk ≤1 h we wstrząsie lub przy dużym prawdopodobieństwie sepsy);
   - przy cewniku centralnym: dodatkowo 1 zestaw z cewnika i 1 obwodowy, oznaczone godziną (różnica czasu do wzrostu);
   - przy podejrzeniu zapalenia wsierdzia: 3 zestawy;
   - aseptyka: dezynfekcja skóry chlorheksydyną w alkoholu, dezynfekcja korków butelek, nie pobierać z istniejącego wenflonu;
   - licznik „zestawy pobrane: 0/2, butelki: 0/4” z godziną każdego pobrania.
2. **Mocz:**
   - ze środkowego strumienia po umyciu ujścia cewki;
   - u pacjenta z cewnikiem: z portu do pobierania świeżo założonego cewnika, **nie z worka**;
   - do jałowego pojemnika, do pracowni ≤2 h albo przechowywać w 4 °C (do 24 h);
   - badanie ogólne i posiew; antygenuria pneumokokowa i Legionella przy ciężkim zapaleniu płuc.
3. **Płyn mózgowo-rdzeniowy (PMR, przy podejrzeniu zapalenia opon lub mózgu):**
   - ciśnienie otwarcia;
   - 3–4 probówki (łącznie ok. 10 ml u dorosłego): (1) biochemia (glukoza, **równocześnie glukoza w surowicy**, białko, mleczany); (2) cytoza z rozmazem; (3) mikrobiologia: barwienie metodą Grama, posiew, ewentualnie antygeny; (4) PCR: panel bakteryjny (*N. meningitidis*, *S. pneumoniae*, *H. influenzae*, *Listeria*) i wirusowy (HSV-1/2, VZV, enterowirusy), z zapasem probówki;
   - przy podejrzeniu gruźlicy lub kryptokokozy większa objętość;
   - **nie opóźniać antybiotyku ani acyklowiru** z powodu TK lub nakłucia lędźwiowego (ESCMID 2016).
4. **Drogi oddechowe:** plwocina dobrej jakości albo aspirat tchawiczy u zaintubowanego; wymaz z nosogardła PCR (grypa, SARS-CoV-2, RSV).
5. **Inne ogniska:** płyn z opłucnej lub otrzewnej (posiew + butelki do posiewu krwi), aspirat z ropnia (lepszy niż wymaz), wymaz z rany po oczyszczeniu, kał na *C. difficile* przy biegunce po antybiotyku.
6. **Podsumowanie do dokumentacji:** pobrane materiały z godzinami, godzina antybiotyku, czas „przyjęcie → antybiotyk”. Trafia do wydruku i pakietu 1 h.

**Źródła:** Surviving Sepsis Campaign 2021, ESCMID 2016, NPOA/KOROUN, standardy mikrobiologiczne UK SMI B37 (posiewy krwi). Odniesienie do zaleceń polskich: KSMM (Krajowy Ośrodek Referencyjny ds. Lekowrażliwości Drobnoustrojów) **[DO WERYFIKACJI z laboratorium szpitala]**.

**Testy:** odhaczenie 2 zestawów pokazuje „2/2, 4 butelki”, a godziny trafiają do wydruku. Pobranie po antybiotyku daje adnotację „pobrane po antybiotyku”. Przy zaznaczonym PMR lista 4 probówek.

## Punkt 14. Zapalenie płuc – naprawa logiki, PSI automatyczny, deterministyczne miejsce leczenia – P1

**Ustalenia z kodu i testów (Chrome bez okna, wersja 5.1):**

- **Dwa różne silniki:**
  - zakładka „Skale i hospitalizacja” (`clinical-ui.js`, `calc/clinical.js → capDisposition()`: CURB-65, PSI, kryteria ATS/IDSA; hospitalizacja przy SpO₂ <90%);
  - zakładka „Antybiotykoterapia” (ramka `mod/zp`, `engine.js → place()`): miejsce leczenia **tylko z CURB-65**, SpO₂ <92%, PSI jako **ręcznie klikane przyciski I–V** („PSI (opcjonalnie)”) i ręcznie wpisywana liczba „małych kryteriów ATS/IDSA (0–9)”.
- **Lekarz może ręcznie zmienić klasę PSI i wybrać „Dom” przy dowolnych parametrach.** Przycisk „Dom” nie jest blokowany żadnym kryterium. Przy SpO₂ 70% i ręcznie wybranym „Dom” moduł proponuje amoksycylinę 1 g p.o. co 8 h.
- **Wybór „Dom” jest zapamiętywany na stałe** (`localStorage['zp1state']`) i **nie jest czyszczony przez „Następny pacjent”** (pkt 1.3). Lekarz, który w poprzednim przypadku kliknął „Dom”, u kolejnego pacjenta widzi nadal „Leczenie domowe (wybrane ręcznie)”. To najbardziej prawdopodobna przyczyna zgłoszonej sytuacji „SpO₂ 70% → amoksycylina do domu”.
- **Przy SpO₂ 70% w trybie „Auto” wersja 5.1 daje „Leczenie na oddziale”,** z ampicyliną wśród β-laktamów i nagłówkiem „Oddział (CURB-65 2)”, nawet gdy CURB-65 = 0. **Nigdy nie daje OIT:** ciężka hipoksemia nie jest kryterium ciężkiego PZP w `place()`, bo kryteria ATS/IDSA są tam tylko liczbą wpisaną ręcznie.
- Przekazanie danych ze „Skal” do ramki (`zp_handoff`) działa tylko przy ładowaniu ramki. Zdarzenie `storage` wywołuje `result()` bez `bar()`, więc zmienione wartości nie trafiają do obliczeń, tylko do opisu.

**Co i jak:**

1. **Jeden silnik ciężkości.** Funkcja `capSeverity(i)` w `calc/clinical.js`, używana przez obie zakładki (ramka `zp` dostaje wynik z rodzica przez `parent.SK` albo z kopii silnika w `mod/zp/engine.js` w tej samej wersji). Zwraca:
   - CURB-65 z listą składowych;
   - **PSI liczony automatycznie** z wpisanych danych: wiek i płeć z paska, choroby, badanie, laboratorium (istniejąca funkcja `psi()`);
   - małe i duże kryteria ATS/IDSA liczone z danych, a nie wpisywane;
   - `place` ∈ {`icu`, `ward`, `home`} oraz `homeBlocked` z listą powodów.
2. **PSI nieedytowalny.** Usunąć przyciski PSI I–V i pole „Małe kryteria (0–9)” z `mod/zp/app.js`. Pokazać „PSI: 96 pkt → klasa IV (91–130 pkt)” z rozpisanymi punktami. Gdy brakuje danych: „PSI nieobliczony – brak: …”, co **nie** pozwala na „Dom”.
3. **Rozwinięcie skrótów (po polsku, w etykietach):**
   - **PZP** – pozaszpitalne zapalenie płuc.
   - **PSI / PORT** – Pneumonia Severity Index, wskaźnik ciężkości zapalenia płuc (badanie PORT). Klasy I–V według sumy punktów: I–II niskie ryzyko (leczenie domowe), III krótka obserwacja lub dom pod opieką, IV–V hospitalizacja.
   - **CURB-65** – C: splątanie (Confusion), U: mocznik >7 mmol/l (Urea), R: oddechy ≥30/min (Respiratory rate), B: ciśnienie skurczowe <90 lub rozkurczowe ≤60 mmHg (Blood pressure), 65: wiek ≥65 lat. 0–1: dom, 2: szpital, 3–5: ciężkie.
   - **Duże kryteria ATS/IDSA** (American Thoracic Society / Infectious Diseases Society of America 2019): (1) wentylacja mechaniczna inwazyjna, (2) wstrząs septyczny wymagający wazopresorów.
   - **Małe kryteria ATS/IDSA (9; ≥3 = ciężkie PZP):** (1) oddechy ≥30/min; (2) PaO₂/FiO₂ ≤250 mmHg; (3) nacieki wielopłatowe; (4) splątanie lub dezorientacja; (5) mocznik (BUN, azot mocznika) ≥20 mg/dl, czyli mocznik ≥7,14 mmol/l; (6) leukopenia <4 G/l z powodu zakażenia; (7) małopłytkowość <100 G/l; (8) hipotermia <36 °C; (9) hipotensja wymagająca intensywnej płynoterapii. „Ciężkie PZP” = ≥1 duże albo ≥3 małe.
   - **OIT** – oddział intensywnej terapii (w szpitalu: OIOM).
   - **BTS** – British Thoracic Society; **NPOA** – Narodowy Program Ochrony Antybiotyków (rekomendacje 2016).
4. **Rekomendacja miejsca leczenia – bez blokad (decyzja lekarza 11.11.2026; BTS, NPOA 2016, ERS/ESCMID 2023, ATS/IDSA 2019):**

   | Warunek | Rekomendacja |
   |---|---|
   | ≥1 duże lub ≥3 małe kryteria ATS/IDSA, SpO₂ <85%, CURB-65 4–5 | OIT rozważany / konsultacja OIT |
   | CURB-65 3, PSI IV–V, SpO₂ <92%, SBP <90, brak tolerancji p.o., brak warunków opieki | hospitalizacja – oddział |
   | CURB-65 2 z chorobami współistniejącymi lub naciekami wielopłatowymi | krótka hospitalizacja |
   | CURB-65 2 bez modyfikatorów, PSI III, nacieki wielopłatowe, dane niepełne | krótka hospitalizacja / obserwacja LUB dom ze ścisłą kontrolą po 48–72 h |
   | CURB-65 0–1, PSI I–II, bez modyfikatorów | zwykle leczenie domowe |

   Rekomendacja zawiera listę powodów. Każde miejsce leczenia (Dom / Oddział / OIT) jest zawsze do wybrania przez lekarza; wybór niezgodny z rekomendacją wyświetla uwagę „udokumentuj uzasadnienie”. Skale, CrCl i schemat z dawkami (korekta do CrCl i alergii) przeliczają się na bieżąco.
5. **Antybiotyk zgodny z poziomem (NPOA 2016, ATS/IDSA 2019, ERS/ESICM/ESCMID/ALAT 2023):**
   - **dom:** amoksycylina (bez chorób współistniejących); amoksycylina z klawulanianem + makrolid lub doksycyklina (z chorobami współistniejącymi). Bez zmian merytorycznych, istniejące karty;
   - **oddział, PZP nieciężkie:** ampicylina lub amoksycylina z klawulanianem i.v. albo ceftriakson lub cefotaksym, ± makrolid. Ampicylina jest tu zgodna z rekomendacjami polskimi, ale nagłówek ma podawać prawdziwy powód (np. „SpO₂ <92%”), a nie „CURB-65 2”;
   - **OIT / ciężkie PZP:** ceftriakson lub cefotaksym **+ makrolid** (ERS 2023: preferowany makrolid); alternatywa przy alergii natychmiastowej: lewofloksacyna lub moksyfloksacyna. Ampicylina i amoksycylina p.o. **niedostępne**. Rozważyć hydrokortyzon w ciężkim PZP według ERS/ESICM 2023 i ATS 2025 **[DO DECYZJI LEKARZA]**;
   - ryzyko MRSA (gronkowca złocistego opornego na metycylinę) lub *Pseudomonas*: istniejące reguły.
6. **Ścieżka danych:** ramka `zp` reaguje na zmiany w „Skalach” i w pasku na żywo (`storage` → `bar()` → `result()`). Stan modułu czyszczony przy „Następny pacjent”. Wybór miejsca leczenia **nie jest zapamiętywany** między pacjentami.

**Przypadki testowe (obowiązkowe, automatyczne w `node` + ręczne w przeglądarce):**

| Nr | Dane | Oczekiwany wynik |
|------|---------------------------------------|-------------------------------------------------------|
| ZP-1 | 40 lat, M, SpO₂ 70% na powietrzu, reszta prawidłowa | sugerowany OIT (rekomendacja); ciężkie PZP: ceftriakson lub cefotaksym + makrolid; **brak amoksycyliny p.o. i ampicyliny** |
| ZP-2 | 30 lat, K, bez chorób, RR 16, SBP 120, HR 80, T 37,5, SpO₂ 97%, mocznik 4 | PSI I (reguła 1. etapu), CURB-65 0; dom; amoksycylina 1 g p.o. co 8 h |
| ZP-3 | 70 lat, M, niewydolność serca, pozostałe prawidłowe, pełne laboratorium | PSI = 70 + 10 = 80 → klasa III; CURB-65 = 1 (wiek ≥65); krótka obserwacja, dom z ostrzeżeniem |
| ZP-4 | 85 lat, M, nowotwór, pH 7,30 | PSI = 85 + 30 + 30 = 145 → klasa V; rekomendacja: oddział |
| ZP-5 | oddechy 32, nacieki wielopłatowe, splątanie | 3 małe kryteria → rekomendacja OIT |
| ZP-6 | wazopresor | 1 duże kryterium → OIT obowiązkowo |
| ZP-7 | brak mocznika i wieku | „Uzupełnij”; rekomendacja wstępna: krótka obserwacja (bez blokady) |
| ZP-8 | poprzedni pacjent „Dom”, potem „Następny pacjent” | pusty stan, tryb Auto |
| ZP-9 | wynik „oddział”, lekarz klika „Dom” | wybór przyjęty, schemat domowy + uwaga z rekomendacją |
| ZP-10 | SpO₂ 91%, reszta jak ZP-2 | rekomendacja: oddział (SpO₂ <92%) |
| ZP-11 | ZP-1 + alergia natychmiastowa na penicyliny | brak β-laktamów; fluorochinolon oddechowy według istniejących reguł |
| ZP-12 | zmiana SpO₂ w „Skalach” przy otwartej ramce | wynik w ramce zmienia się bez przeładowania |
| ZP-13 | 50 lat, K, bez chorób, pozostałe prawidłowe | reguła 1. etapu PSI → klasa I (punktowo 50 − 10 = 40); dom |

## Punkt 15. Toksykologia – zdjęcia grzybów – P3

**Gdzie:**

- `b2-ui.js` linia 25: `.b2sp img{width:100%;height:96px;object-fit:cover}`. Miniatury 96 px przycinane przez `cover`, stąd ucięte kapelusze;
- `advanced.css` linia 9: `.mushroom-card img{height:280px;object-fit:contain}`.

**Jak:**

- miniatury: `height: 200–220px` (na telefonie `aspect-ratio: 4/3`), `object-fit: contain` na jasnym tle albo `cover` z `object-position: center 30%`, żeby nie obcinać kapelusza;
- siatka o kolumnach `minmax(220px, 1fr)`;
- podpisy (nazwa polska, łacińska, cechy) **pod** zdjęciem, nie na nim;
- powiększenie po kliknięciu (`#b2lb`) bez zmian.

**Test:** na ekranie 1366×768 i na telefonie żaden kapelusz nie jest ucięty u góry, a podpis jest pod zdjęciem.

## Punkt 16. Neuroinfekcje – wzorzec wirusowy z PMR kieruje leczenie – P2

**Ustalenie z kodu (`c-ui.js`, `calc/etapC.js → csfInterp()` i `neuroTreat()`):**

- interpretacja PMR klasyfikuje wynik (`ci.cls` = `bact` / `viral` / `mixed` / `tbfungal`) i pokazuje cechy;
- **ten wynik nie jest przekazywany do zakładki leczenia.** `neuroTreat()` dostaje tylko wiek, masę, nerki, ciążę, alergię, „encephalitis” (z ręcznego pola lub objawów) i ryzyko *Listeria*. Wzorzec wirusowy w PMR nie zmienia więc propozycji leczenia.

**Co i jak:**

1. Przekazać `ci.cls` i `ci.bms` do `neuroTreat()`.
2. Przy wzorcu **wirusowym** (limfocytoza, glukoza PMR/surowica ≥0,6, mleczany ≤2,4 mmol/l, ujemny Gram):
   - na pierwszym miejscu **acyklowir 10 mg/kg i.v. co 8 h**, wlew ≥1 h, nawodnienie. Dawka według rzeczywistej masy, a u otyłych według masy należnej lub skorygowanej (ChPL i wytyczne ESCMID/ESCMID-EAN, konsultacja);
   - **korekta nerkowa według CrCl z Cockcrofta-Gaulta** (ChPL acyklowiru): CrCl 25–50 ml/min → 10 mg/kg co 12 h; 10–25 → co 24 h; <10 → 5 mg/kg co 24 h, po dializie;
   - PCR HSV/VZV w PMR. Kontynuować do wyniku PCR; przy dodatnim HSV 14–21 dni;
   - antybiotyk empiryczny **pozostaje do wyniku Grama i posiewu**, jeśli jest jakakolwiek cecha bakteryjna, BMS (Bacterial Meningitis Score) ≥1 lub obraz mieszany. Przy czystym obrazie wirusowym i BMS = 0: komunikat „rozważ odstawienie antybiotyku po wykluczeniu bakteryjnego”, **[DO DECYZJI LEKARZA]**;
   - kleszczowe zapalenie mózgu (Podhale): leczenie objawowe, serologia IgM w surowicy i PMR.
3. Przy wzorcu **bakteryjnym**: bez zmian (ceftriakson 2 g co 12 h ± ampicylina ± wankomycyna, deksametazon 10 mg co 6 h przed pierwszą dawką antybiotyku lub razem z nią).

**Testy:**

1. Cytoza 150/µl, 90% limfocytów, glukoza PMR/surowica 0,65, mleczany 1,8, Gram ujemny: acyklowir na pierwszym miejscu, z dawką dla 70 kg = 700 mg co 8 h.
2. Ten sam przypadek przy CrCl 30 ml/min: 700 mg co 12 h.
3. Obraz mieszany: acyklowir i ceftriakson.

## Punkt 17. EUCAST i kalkulatory (Lekify) – P2

- **EUCAST** (European Committee on Antimicrobial Susceptibility Testing; `eucast-ui.js`, dziś link) zostaje.
- **Lekify.pl:** **nie kopiujemy treści ani kodu** strony (prawa autorskie). Proponujemy własne kalkulatory offline według opublikowanych wzorów, z podaniem źródła. Kandydaci niedostępni dziś w Asystencie albo dostępni tylko częściowo (lekarz wybiera):

| Grupa | Kalkulator |
|-------------|---------------------------------------------------------------------------------------|
| Elektrolity / nerki | osmolalność osocza (efektywna i całkowita); luka anionowa z korektą na albuminę; sód skorygowany w hiperglikemii; wapń skorygowany na albuminę; deficyt wolnej wody; diureza ml/kg/h z kryterium AKI (ostrego uszkodzenia nerek) wg KDIGO |
| Kardiologia | QTc (Bazett, Fridericia, Framingham, Hodges); MAP; skala HEART; GRACE; CHA₂DS₂-VA i HAS-BLED; skala Killipa-Kimballa |
| Zatorowość / zakrzepica | skala Wellsa dla ZP i ZŻG (zakrzepicy żył głębokich); PERC; D-dimer zależny od wieku; PESI / sPESI; 4PEPS |
| Gastroenterologia | skala Glasgow-Blatchford; Oakland (krwawienie z dolnego odcinka); BISAP (zapalenie trzustki); Child-Pugh; MELD |
| Intensywna terapia | qSOFA; SOFA; NEWS2; gradient pęcherzykowo-tętniczy A–a |
| Neurologia / psychiatria | NIHSS; ABCD²; ICH score; 4AT; CIWA-Ar (alkoholowy zespół abstynencyjny) |
| Leki / pompy | konwersja opioidów; ekwiwalenty glikokortykosteroidów; ekwiwalenty benzodiazepin; formuła Parkland (oparzenia); dawka i objętość leku płynnego |
| Pediatria | paracetamol i ibuprofen według masy; zapotrzebowanie płynowe (Holliday-Segar); rozmiar rurki intubacyjnej |

Każdy kalkulator: wzór, źródło, jednostki zgodne z przełącznikiem mg/dl ↔ mmol/l, dane z paska pacjenta, wydruk (pkt 2) i testy jednostkowe z wartościami z publikacji.

## Punkt 18. Moduły bez zmian w tej wersji (lekarz sprawdzi później)

Zatorowość płucna, Ostra niewydolność serca, Migotanie przedsionków (AF), Krwawienie z GOPP (górnego odcinka przewodu pokarmowego), Transfuzjologia, Neurologia, Leki – karty dawkowania.

Dostają **tylko** wspólne elementy z pkt 1 i 2.

# 4. Testy i kontrola jakości

1. **Testy jednostkowe silników w `node`** (bez przeglądarki):
   - `mod/zp/engine.js` / `capSeverity`: ZP-1 do ZP-13;
   - `mod/se/engine.js`: pkt 7;
   - `mod/el/engine.js`: pkt 8;
   - `calc/etapC.js`: pkt 16;
   - anafilaksja: pkt 12;
   - kalkulatory: pkt 17.
   Plik `tests/run.js`, uruchamiany przed każdą publikacją.
2. **Test w przeglądarce** (Chrome bez okna, skrypt jak w tej analizie): przejście przez moduły, „Następny pacjent”, alarm, wydruk do PDF i liczenie stron.
3. **Kontrola dawek leków wysokiego ryzyka:** każdy rachunek pompy liczony dwukrotnie (silnik i test z wartościami ręcznymi). CrCl zawsze wzorem Cockcrofta-Gaulta, nie eGFR.
4. **Lista sprawdzeń wizualnych:** brak `#ff5fa2`, kontrast, wydruk ≤2 strony A4, schematy EKG na wydruku.
5. **Akceptacja kliniczna lekarza** po każdym etapie: lista progów [DO AKCEPTACJI] z tego dokumentu.

# 5. Publikacja wersji testowej 5.2

**Rekomendacja: nowe repozytorium `asor-podglad-52`** (kopia `asor-podglad-51`, GitHub Pages: `https://j736107-beep.github.io/asor-podglad-52/`), a nie gałąź.

- GitHub Pages publikuje jedną gałąź na repozytorium. Gałąź w `asor-podglad-51` nie dałaby osobnego adresu testowego bez ryzyka nadpisania strony 5.1.
- Osobne repozytorium = osobny adres, osobny Service Worker (`sw.js`, cache offline) i możliwość powrotu do 5.1 w każdej chwili.
- Wymagane w 5.2:
  - **prefiks kluczy `localStorage` / `sessionStorage`** (np. `v52:`), bo origin `j736107-beep.github.io` jest wspólny dla wszystkich repozytoriów. Bez tego 5.1 i 5.2 mieszają dane pacjenta i ustawienia;
  - nowa nazwa cache w `sw.js`;
  - numer wersji „5.2 – faza testów klinicznych (wersja testowa)” w `index.html` (`#ver`, stopka nawigacji) i w `about.js`.
- Kompendium interny (pkt 3): osobna gałąź w `kompendium-interny` z publikacją dopiero po akceptacji, albo testowa kopia repozytorium.
- Praca etapami z rozdziału 2: każdy etap to osobny commit lub tag (`v5.2-etap1` itd.) i krótki opis zmian w „O programie”.

# 6. Otwarte pytania do lekarza

1. (usunięte – alarm blokady wypisu nie istnieje w 5.2)
2. Próg SpO₂ dla hospitalizacji w zapaleniu płuc: <92% (BTS/NICE, ostrzejszy) czy <90% (ATS/IDSA)? Rekomendacja: <92%.
3. Kryterium „konsultacja OIT” przy SpO₂ <85% na powietrzu albo FiO₂ ≥0,4 / HFNO / NIV – akceptacja progu.
4. Progi elektrolitowe w tabeli z pkt 5 – akceptacja.
5. Preparat tiaminy dostępny w SOR (nazwa, stężenie, objętość ampułki) – do potwierdzenia z apteką szpitalną.
6. Receptura wlewu adrenaliny w anafilaksji: 1 mg/50 ml (20 µg/ml) czy lokalna 5 mg/50 ml (100 µg/ml) z „Pomp SOR”?
7. Które kalkulatory z listy w pkt 17 wdrożyć w pierwszej kolejności?
8. Czy nr identyfikacyjny [usunięty 11.11.2026] ma być w pasku (wygoda: automatyczny wiek i płeć) czy tylko imię i nazwisko (mniej danych osobowych)? **Decyzja 11.11.2026 (RODO): tylko imię i nazwisko; nr identyfikacyjny usunięty z aplikacji, wiek i płeć ręcznie.**

# 7. Źródła

- ESC 2023 – Wytyczne dotyczące ostrych zespołów wieńcowych; Czwarta uniwersalna definicja zawału serca (ESC/ACC/AHA/WHF 2018).
- Sgarbossa EB i wsp., NEJM 1996;334:481; Smith SW i wsp., Ann Emerg Med 2012;60:766 (zmodyfikowane kryteria Sgarbossy).
- ATS/IDSA 2019 (Metlay i wsp., Am J Respir Crit Care Med 2019;200:e45); ATS 2025 – aktualizacja; ERS/ESICM/ESCMID/ALAT 2023 (Eur Respir J 2023;61:2200735); NPOA 2016 – Rekomendacje postępowania w pozaszpitalnych zakażeniach układu oddechowego; BTS 2009/2015; NICE NG138/NG250; Fine MJ i wsp., NEJM 1997 (PSI).
- Surviving Sepsis Campaign 2021; ESCMID 2016 (ostre bakteryjne zapalenie opon); UK SMI B37.
- ESE/ESICM/ERA-EDTA 2014 – hiponatremia (Spasovski i wsp., Eur J Endocrinol 2014); Verbalis i wsp., Am J Med 2013.
- Thomson AD i wsp., Alcohol Alcohol 2002 (zalecenia Royal College of Physicians, RCP) i EFNS 2010 (Galvin i wsp., Eur J Neurol 2010) – encefalopatia Wernickego; AES 2016 – stan padaczkowy; ESETT (Kapur i wsp., NEJM 2019); NCS 2012; PTE 2018; ILAE 2015.
- RCUK 2021 – Emergency treatment of anaphylaxis; ERC 2021/2025 – Special circumstances; EAACI 2021; WAO 2020.
- ERC 2021 – hiperkaliemia; ESGE 2021 – krwawienie z GOPP; ESC 2019 – ZP; ESC 2021/2023 – niewydolność serca; ESC 2018 – omdlenia; ESC 2024 – AF.
- ChPL z Rejestru Produktów Leczniczych (RPL) dla każdego leku – weryfikacja dawek przed wdrożeniem.
- Materiały lokalne SOR (01_LEKI_SOR, 00_MASTER_LEKI_SOR, POMPA_50ML) – pomocniczo.
