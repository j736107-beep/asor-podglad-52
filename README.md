# Asystent lekarza SOR – wersja 5.2 (testowa) · etap 4 · 09.11.2026

Narzędzie pomocnicze, **niecertyfikowane**. Każdą dawkę i decyzję weryfikuje lekarz.
Wersja testowa zbudowana na 5.1 (`asor-podglad-51`, commit 960005f). Dane w przeglądarce są oddzielone od 5.1
(prefiks magazynu `v52:`, osobna pamięć podręczna service workera `asor-v52-*`).

## Etap 1 (zrealizowany) – wg `docs/SPEC_Asystent_SOR_5.2.md`
- **Pasek pacjenta:** imię i nazwisko, PESEL (suma kontrolna; wiek i płeć uzupełniane automatycznie), czas przyjęcia. Dane identyfikacyjne tylko w tej karcie (`sessionStorage`). Przenoszone do Troponiny, Neurologii i na wydruk.
- **Następny pacjent:** czyści wszystkie dane pacjenta we wszystkich modułach (m.in. `zp1state`, `zp_handoff`, `el1state:*`, `se4state:*`, zakładki modułów, alarmy). Zostają: ustawienia, ulubione, konfiguracja lokalna, własne leki, zatwierdzenia pomp, ustawienia DKA.
- **Wydruk A4:** przycisk „🖨 Drukuj do dokumentacji (A4)” w każdym module; nagłówek szpitala + pacjent; sekcja WSTRZYMAJ WYPIS; tekst modułu skracany, by zmieścić 1–2 strony.
- **Ostateczny hamulec:** moduł całkowicie usunięty 09.11.2026 (decyzja lekarza) – menu, kod `mod/hamulec`, `wypis.js`, wpisy w pamięci podręcznej SW i testy.
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
  - Kardiologia: SCORE2 40–69 lat (Polska = region wysokiego ryzyka), SCORE2-OP ≥70 lat – **WSTRZYMANY** (patrz niżej), QTc (Bazett, Fridericia, Framingham, Hodges), ABI, Duke-ISCVID 2023, HAS-BLED.
  - Pulmonologia: kryteria Lighta, gradient A–a i PaO₂/FiO₂, ROX.
  - Gastroenterologia: Rockall, AIMS65, Child-Pugh, MELD-Na, BISAP.
  - Nefrologia i elektrolity: eGFR CKD-EPI 2021 + Cockcroft-Gault, FENa/FEUrea, osmolalność i luka osmolalna, luka anionowa (albumina, delta), Na skorygowany i deficyt wody, Ca skorygowany.
  - Hematologia: 4T, ISTH DIC, PLASMIC, ANC. Neurologia: Canadian CT Head, Canadian C-Spine, Ottawa SAH.
  - ŻChZZ i ZP: Wells ZŻG, Wells ZP, genewska (pełna/uproszczona), PERC, YEARS, YEARS w ciąży (2019).
  - Ostry brzuch: Alvarado, AIR. Endokrynologia: Burch-Wartofsky. Sepsa: SIRS, qSOFA, SOFA.
  - Konwersje leków: glikokortykosteroidy (Liu 2013), benzodiazepiny (Ashton), opioidy (MME, redukcja 25–50%, plaster fentanylowy zaokrąglany w dół; metadon i buprenorfina wyłączone).
  - Laboratorium: przelicznik jednostek (21 badań), Ca skorygowany, tabela współczynników.
- Założenie: „skala laweta” z listy lekarza interpretowana jako **kryteria Lighta** (płyn opłucnowy) – do potwierdzenia.
- **SCORE2-OP wstrzymany (09.11.2026):** implementacja z publikacji (wiek centrowany na 73, przeżycie wyjściowe, rekalibracja scale1/scale2) nie odtwarza w granicach zaokrąglenia ani tabel SCORE2-OP z wytycznych ESC 2021 (rys. 3, 256 komórek/region), ani przykładu z tekstu publikacji; suplement z dokładnymi parametrami był niedostępny. Kalkulator jest widoczny, pola nieaktywne, czerwony komunikat „Kalkulator wstrzymany – wynik niezweryfikowany” i odesłanie do tabel ESC 2021 (region wysokiego ryzyka – Polska) / HeartScore. SCORE2 dla wieku ≥70 lat nie podaje liczby.
- **SCORE2 (40–69 lat) zweryfikowany:** przykład z publikacji odtworzony (5,9 / 14,0 / 4,2 / 13,7%); tabele ESC 2021 (dane w `tests/data/esc2021_score2_charts.json`, wyodrębnione z tekstu wektorowego PDF) – region wysokiego ryzyka 384/384 komórek w granicach ≤1,1 pkt % (≥90% identycznych po zaokrągleniu) przy HDL ok. 1,13 (M) / 1,32 (K); tabele podają nie-HDL, a przyjętej w nich wartości HDL publikacja nie podaje.
- Nie zaimplementowano: SCORE2-Diabetes, MELD 3.0, SOFA-2.
- Testy: `node tests/etap4-node.test.js`, `tests/e2e-etap4-puppeteer.js`.

## Zmiany lekarza 09.11.2026 (23:24)
- **Zapalenie płuc:** usunięty alarm „WSTRZYMAJ WYPIS” (brak lampy, dźwięku, nakładki i wyzwalacza – `clinical-ui.js`, `mod/zp/app.js`; `hold.js` ignoruje klucz `cap`). Logika miejsca leczenia (Dom zablokowany, sugestia OIT) bez zmian.
- **Ostateczny hamulec:** moduł całkowicie usunięty (menu, `mod/hamulec/`, `wypis.js`, pamięć podręczna SW, testy).
- **PESI / sPESI** (Aujesky 2005; Jiménez 2010; ESC 2019): grupa „Zatorowość płucna – rokowanie”, wiek/płeć z paska; klasy I–V z 30-dniową śmiertelnością, sPESI 0 → 1,0% / ≥1 → 10,9%; nota ESC 2019 (niskie ryzyko) i uwaga o tłumaczeniu („III–IV” w wersji polskiej; oryginał III–V). Przycisk w module „Zatorowość płucna”.
- **SCORE2-Diabetes** (Eur Heart J 2023;44:2544; ESC 2023): 40–69 lat, cukrzyca typu 2; najpierw kryteria bardzo dużego ryzyka (ASCVD, eGFR <45, eGFR 45–59 + A2, A3, mikroangiopatia ≥3 lokalizacje); eGFR CKD-EPI 2009 z kreatyniny z paska; HbA1c mmol/mol lub % (IFCC = (DCCT − 2,15) × 10,929); kategorie <5 / 5–<10 / 10–<20 / ≥20%. **Weryfikacja:** przykłady z publikacji (region umiarkowany) M 11 / 17%, K 8 / 13% → 10,96 / 17,19 / 7,59 / 12,70%. SCORE2 u chorych na cukrzycę odsyła do SCORE2-Diabetes.
- **SCORE2-OP** – model z parametrami podanymi przez lekarza zaimplementowany (`KALK.score2op`), ale porównanie z tabelami ESC 2021 (region wysokiego ryzyka, 256 komórek ≥70 lat): przy HDL 1,4 tylko 152/256 (59%) w ±1 pkt, 104 komórki różnią się o ≥2 pkt, maks. 3 pkt, średnio −1,36 pkt (mężczyźni −1,70) – zawsze niedoszacowanie; przy HDL 1,13/1,32 (założenie, które odtwarza SCORE2) 230/256, średnio −0,61, maks. 3 pkt (wiek 82–87). → **nadal WSTRZYMANY**.
- **HeartScore** (https://www.heartscore.org/en_GB) – link w SCORE2, SCORE2-OP, SCORE2-Diabetes.

## Pilot AI – „Epikryza (AI)” (10.11.2026, zgoda lekarza)
- Tylko moduł **Zapalenie płuc**. Pliki: `calc/ai-epi.js` (biała lista, prompt, zapytanie, parsowanie, błędy), `ai-ui.js` (Ustawienia + panel).
- **Klucz API**: wyłącznie lekarza, wpisywany w *Ustawienia → Sztuczna inteligencja (pilot)*, zapisany tylko w tej przeglądarce (`localStorage` `v52:ai_cfg`; „Następny pacjent” go nie usuwa, „Resetuj wszystkie dane” – tak). W repozytorium nie ma żadnego klucza.
- **Dostawcy** (10.11.2026: dodany xAI jako domyślny): **xAI (Grok)** – `POST https://api.x.ai/v1/chat/completions` (zgodne z OpenAI, `Authorization: Bearer xai-…`, klucz z console.x.ai): `grok-4.7` domyślnie (z `reasoning_effort: low` dla szybkości), `grok-4.20-0309-non-reasoning` (najszybszy), `grok-4.3` (tańszy), inny – wpisz. CORS: api.x.ai odpowiada `Access-Control-Allow-Origin: *` na preflight i POST (sprawdzone 10.11.2026). Także OpenAI Chat Completions (`gpt-4.1-mini` domyślnie, `gpt-4.1`, `gpt-4o-mini`, `gpt-4o`, `gpt-5.4-mini`, inny – wpisz) i Anthropic Messages API z nagłówkiem `anthropic-dangerous-direct-browser-access: true` (`claude-sonnet-5-5` domyślnie, `claude-haiku-5-5`, `claude-opus-5-5`, inny). Temperatura 0,2 (gdy model jej nie obsługuje – jedno ponowienie bez niej), limit czasu 60 s.
- **RODO**: wysyłane tylko dane kliniczne z białej listy (`buildPayload`): wiek, płeć, masa/wzrost, kreatynina/eGFR/CrCl, obciążenia, parametry życiowe, badania, wywiad PSI, kryteria ATS/IDSA, wyniki programu (CURB-65, PSI, miejsce leczenia z uzasadnieniem), antybiotykoterapia z silnika, alergia, czynniki ryzyka, opcjonalne notatki kliniczne. Imię, nazwisko, PESEL, czas przyjęcia – nigdy; notatki są czyszczone (`scrub`), a gotowe body sprawdzane (`assertClean`) – przy wykryciu identyfikatora wysyłka jest blokowana. Podgląd „Co zostanie wysłane” + przycisk potwierdzenia.
- **Wynik**: edytowalne pole (EPIKRYZA, ROZPOZNANIA ICD-10, ZALECENIA PRZY WYPISIE tylko przy miejscu leczenia = dom; inaczej uzasadnienie hospitalizacji/OIT), „Kopiuj” (bez UWAG), osobno „UWAGI DLA LEKARZA” + kontrola programu (czy model zacytował dosłownie miejsce leczenia i klasę PSI). Wydruk A4: epikryza AI z etykietą; imię i PESEL tylko w lokalnym nagłówku wydruku.
- CSP: `connect-src 'self' https://api.x.ai https://api.openai.com https://api.anthropic.com`; Service Worker nie przechwytuje zapytań do API AI.
- Testy: `tests/ai-node.test.js`, `tests/e2e-ai-puppeteer.js` (atrapa API – bez prawdziwych wywołań).

## Testy
- `node tests/zp-node.test.js` – przypadki ZP-1…ZP-13 (silnik).
- `node tests/etap2-node.test.js` – silniki etapu 2 (SE, hiponatremia, tiamina, anafilaksja, posiewy, neuroinfekcje).
- `node tests/etap3-node.test.js`, `node tests/etap4-node.test.js` – etap 3 i kalkulatory (przykłady z publikacji).
- Testy przeglądarkowe (puppeteer) – opis w raporcie wdrożenia.
