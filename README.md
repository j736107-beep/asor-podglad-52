# Asystent lekarza SOR – wersja 5.2 (testowa, 09.11.2026)

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

## [DO AKCEPTACJI] – decyzje lekarza
- SpO₂ <85% → konsultacja OIT; SpO₂ 85–91% → oddział.
- PSI III (CURB-65 0–1) → krótka obserwacja; dom tylko po decyzji lekarza (schemat doustny pokazywany warunkowo).
- Wyzwalacze WSTRZYMAJ WYPIS: Sepsa (podejrzenie sepsy, NEWS2 ≥7, mleczany ≥4, MAP <65, wazopresor), DKA/HHS (rozpoznanie), Stan padaczkowy (każde podanie leku), Troponina (próg hospitalizacji HEART ≥4 / EDACS ≥16 – także „co najmniej” przy niepełnych danych).

## Testy
- `node tests/zp-node.test.js` – przypadki ZP-1…ZP-13 (silnik).
- Testy przeglądarkowe (puppeteer) – opis w raporcie wdrożenia.
