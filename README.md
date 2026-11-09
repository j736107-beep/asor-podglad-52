# Asystent lekarza SOR – wersja 5.2 (testowa) · etap 4 · 09.11.2026

Narzędzie pomocnicze, **niecertyfikowane**. Każdą dawkę i decyzję weryfikuje lekarz.
Wersja testowa zbudowana na 5.1 (`asor-podglad-51`, commit 960005f). Dane w przeglądarce są oddzielone od 5.1
(prefiks magazynu `v52:`, osobna pamięć podręczna service workera `asor-v52-*`).

## Etap 1 (zrealizowany) – wg `docs/SPEC_Asystent_SOR_5.2.md`
- **Pasek pacjenta:** imię i nazwisko, PESEL (suma kontrolna; wiek i płeć uzupełniane automatycznie), czas przyjęcia. Dane identyfikacyjne tylko w tej karcie (`sessionStorage`). Przenoszone do Troponiny, Neurologii i na wydruk.
- **Następny pacjent:** czyści wszystkie dane pacjenta we wszystkich modułach (m.in. `zp1state`, `zp_handoff`, `el1state:*`, `se4state:*`, zakładki modułów, alarmy). Zostają: ustawienia, ulubione, konfiguracja lokalna, własne leki, zatwierdzenia pomp, ustawienia DKA.
- **Wydruk A4:** przycisk „🖨 Drukuj do dokumentacji (A4)” w każdym module; nagłówek szpitala + pacjent; sekcja WSTRZYMAJ WYPIS; tekst modułu skracany, by zmieścić 1–2 strony.
- **Ostateczny hamulec:** wstrzymany – widoczny, przyciski nieaktywne, komunikat „Moduł nie działa prawidłowo i został wstrzymany”.
- **WSTRZYMAJ WYPIS (hold.js, wariant B):** duża migająca lampa, czerwony pasek, nakładka z dźwiękiem (ton z Ustawień + komunikat głosowy) powtarzanym co 12 s do potwierdzenia. Potwierdzenie wycisza dźwięk, lampa i pasek zostają do „Następny pacjent”; nowa przyczyna – alarm od nowa. Nie blokuje „Następny pacjent”. Wyzwalacze: zapalenie płuc (oddział/OIT), Troponina (światło czerwone / próg hospitalizacji), Elektrolity (ciężkie), Stan padaczkowy (podane leki), Sepsa, DKA/HHS.
- **Zapalenie płuc:** jeden silnik `calc/cap-severity.js` dla zakładki „Skale” i modułu antybiotykoterapii. PSI liczony automatycznie (bez ręcznego wyboru), kryteria ATS/IDSA z danych, deterministyczne miejsce leczenia, „Dom” przekreślony i zablokowany, ręczna zmiana tylko w górę, „Dom” nie jest zapamiętywany, wynik w ramce odświeża się na żywo.

## Decyzje lekarza – zaakceptowane 09.11.2026
- SpO₂ <85% → konsultacja OIT; SpO₂ 85–91% → oddział.
- PSI III (CURB-65 0–1) → krótka obserwacja; dom tylko decyzją lekarza (schemat doustny pokazywany warunkowo).
- Wyzwalacze WSTRZYMAJ WYPIS: Sepsa (podejrzenie sepsy, NEWS2 ≥7, mleczany ≥4, MAP <65, wazopresor), DKA/HHS (rozpoznanie), Stan padaczkowy (każde podanie leku), Troponina (próg hospitalizacji HEART ≥4 / EDACS ≥16).
- Choroby współistniejące z PSI przekazywane do modułu antybiotykoterapii.
- Zmiana po akceptacji: alarm Troponiny włącza się dopiero po wpisaniu EKG lub troponiny (nie z samego wieku).
- PMR: pleocytoza 100–999/µl z przewagą limfocytów = wzorzec wirusowy (etap 4).
- Anafilaksja: jedna dawka adrenaliny bez autostrzykawki / bez przeszkolenia / bez opieki → 6 h obserwacji (etap 4).
- Wydruk Zapalenia płuc zawsze zawiera antybiotykoterapię – gdy zakładka nie była otwierana, treść jest wyliczana ze wspólnego silnika `mod/zp/engine.js` (`calc/zp-print.js`), z założeniami „alergia NIEUSTALONA”, „DO DECYZJI LEKARZA” (etap 4).

## Etap 2 (zrealizowany 09.11.2026)
- **Stan padaczkowy:** drugi lek II rzutu (po lewetyracetamie → walproinian 40 mg/kg, maks. 3000 mg, 100 mg/ml, 10 min; alternatywy fenytoina / lakozamid), przeciwwskazania walproinianu (wątroba, POLG, cykl mocznikowy, ciąża; PLT – ostrzeżenie; karbapenem – interakcja), licznik czasu od początku napadu, komunikat III rzutu (≥40 min lub pogorszenie oddychania), tiamina.
- **Tiamina (`calc/thiamine.js`):** profilaktyka 100 mg i.v.; 200–250 mg w 50–100 ml NaCl 0,9% w 15–30 min przez 3–5 dni; Wernicke 500 mg w 100 ml w 30 min 3×/d, potem 250 mg/d, potem 100–250 mg/d. Rachunek ampułek 50 mg/ml. **Preparat i.v. – do potwierdzenia z apteką szpitalną** (polskie preparaty w RPL są i.m.).
- **Hiponatremia:** CEL i LIMIT w osobnych ramkach; ryzyko ODS automatycznie (Na⁺ ≤105, K⁺ <3,5, alkoholizm, niedożywienie, marskość) z listą „TAK, bo…”; licznik bolusów (maks. 3) z kolejnymi Na⁺, przyrostem i STOP przy +5; ostrzeżenie przy limit − 2; karta korekty w dół (G5% 10 ml/kg w 1 h, desmopresyna 2 µg co ≥8 h, Na⁺ co 1–2 h).
- **Anafilaksja:** zakładka leczenia (wlew adrenaliny 5–10 µg/kg/h z rachunkiem 20 / 10 / 100 µg/ml, noradrenalina 80 µg/ml, glukagon 1–2 mg przy β-blokerze, skurcz oskrzeli, obrzęk krtani, tryptaza) i zakładka „Obserwacja / wypis” (2 / 6 / 12 h od ustąpienia objawów, wlew → hospitalizacja, blokada WSTRZYMAJ WYPIS).
- **Sepsa:** zakładka „Materiał na posiewy” (`calc/cultures.js`) – zestawy krwi z licznikiem, godziny, mocz, PMR (4 probówki), drogi oddechowe, inne ogniska, adnotacja „pobrane po antybiotyku”; trafia do raportu sepsy.
- **Neuroinfekcje:** wzorzec PMR (wirusowy / mieszany) przekazywany do leczenia; wirusowy → acyklowir 10 mg/kg co 8 h na pierwszym miejscu z korektą wg CrCl (Cockcroft-Gault, ChPL); mieszany → acyklowir + ceftriakson.
- **DKA/HHS:** pełne polskie nazwy w menu, tytule i wydruku.
- **Bilans płynów / Antykoagulacja:** pasek pacjenta na ekranie i przycisk wydruku (w Antykoagulacji – w każdej zakładce).
- **Zapalenie płuc:** wydruk zawiera treść modułu antybiotykoterapii (ramka `mod/zp`).

## Etap 3 (zrealizowany 09.11.2026)
- Troponina / OZW: sekcja „EKG 12-odprowadzeniowe ≤10 min” – licznik od pierwszego kontaktu, 16 kart wzorców z rysunkami SVG (`mod/troponina/ecg-svg.js`, 25 mm/s, 10 mm/mV): STEMI, ściana dolna, prawa komora (V4R), ściana tylna, de Winter, LBBB/stymulator + Sgarbossa i Smith (ST/S ≤ −0,25), aVR, Wellens A/B, obniżenie ST, odwrócenie T, LBBB, stymulator bez kryteriów, zmiany niespecyficzne, LVH (Sokolow-Lyon, strain), EKG prawidłowe. Logika HEART/świateł bez zmian (mapowanie nowych kart na dotychczasowe klucze).
- Szata kliniczna bez różu (granat #1f3a5f, grafit, szary; czerwień tylko alarmy) – Omdlenie (przeprojektowane), Elektrolity, Zapalenie płuc, Stan padaczkowy, Pompy, Troponina, powłoka.
- Zatrucia → grzyby: miniatury 210 px bez przycinania (object-fit: contain), podpisy pod zdjęciem.
- Nie realizowano: pole kodu kompendium, EUCAST / własne kalkulatory (oczekują decyzji). Decyzje otwarte z etapu 2 bez zmian.
- Testy: `node tests/etap3-node.test.js`, `tests/e2e-etap3-puppeteer.js`.

## Etap 4 (zrealizowany 09.11.2026)
- Sfinalizowane decyzje z 09.11.2026 (PMR, anafilaksja 6 h, wydruk ZP z antybiotykoterapią) – patrz wyżej.
- **Nowy moduł „Kalkulatory”** (`calc/kalk.js` – logika, `kalk-ui.js` – interfejs; offline, w pamięci SW): 43 kalkulatory w 12 grupach (≤6 w grupie), wyszukiwarka, dane z paska pacjenta (wiek, płeć, masa, kreatynina, ciąża), wynik + interpretacja + konsekwencja kliniczna + źródło z rokiem, wydruk z danymi pacjenta, linki do istniejących modułów (bez dublowania GBS, sPESI, CHA₂DS₂-VA, NIHSS, GCS, CURB-65/PSI itd.). Własne implementacje z publikacji źródłowych – nie kopiowano treści ani kodu innych serwisów.
  - Kardiologia: SCORE2/SCORE2-OP (Polska = region wysokiego ryzyka), QTc (Bazett, Fridericia, Framingham, Hodges), ABI, Duke-ISCVID 2023, HAS-BLED.
  - Pulmonologia: kryteria Lighta, gradient A–a i PaO₂/FiO₂, ROX.
  - Gastroenterologia: Rockall, AIMS65, Child-Pugh, MELD-Na, BISAP.
  - Nefrologia i elektrolity: eGFR CKD-EPI 2021 + Cockcroft-Gault, FENa/FEUrea, osmolalność i luka osmolalna, luka anionowa (albumina, delta), Na skorygowany i deficyt wody, Ca skorygowany.
  - Hematologia: 4T, ISTH DIC, PLASMIC, ANC. Neurologia: Canadian CT Head, Canadian C-Spine, Ottawa SAH.
  - ŻChZZ i ZP: Wells ZŻG, Wells ZP, genewska (pełna/uproszczona), PERC, YEARS, YEARS w ciąży (2019).
  - Ostry brzuch: Alvarado, AIR. Endokrynologia: Burch-Wartofsky. Sepsa: SIRS, qSOFA, SOFA.
  - Konwersje leków: glikokortykosteroidy (Liu 2013), benzodiazepiny (Ashton), opioidy (MME, redukcja 25–50%, plaster fentanylowy zaokrąglany w dół; metadon i buprenorfina wyłączone).
  - Laboratorium: przelicznik jednostek (21 badań), Ca skorygowany, tabela współczynników.
- Założenie: „skala laweta” z listy lekarza interpretowana jako **kryteria Lighta** (płyn opłucnowy) – do potwierdzenia.
- Zastrzeżenia: SCORE2-OP – współczynniki z suplementu, przykład z tekstu publikacji nie odtwarza się 1:1 (patrz raport); SCORE2-Diabetes, MELD 3.0 i SOFA-2 nie zaimplementowano.
- Testy: `node tests/etap4-node.test.js`, `tests/e2e-etap4-puppeteer.js`.

## Testy
- `node tests/zp-node.test.js` – przypadki ZP-1…ZP-13 (silnik).
- `node tests/etap2-node.test.js` – silniki etapu 2 (SE, hiponatremia, tiamina, anafilaksja, posiewy, neuroinfekcje).
- `node tests/etap3-node.test.js`, `node tests/etap4-node.test.js` – etap 3 i kalkulatory (przykłady z publikacji).
- Testy przeglądarkowe (puppeteer) – opis w raporcie wdrożenia.
