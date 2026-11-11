// 5.1 pw31 – EUCAST: wyłącznie link do Lekify (matryca online). To NIE jest lokalna matryca breakpointów offline.
// 11.11.2026 (audyt, faza 2): bez osobnej pozycji w menu – przycisk w Sepsie (Antybiotyki wg ogniska), Zapaleniu płuc (Antybiotykoterapia) i Lekach.
// Stare id „eucast” przekierowuje shell.js do modułu Leki.
(function (root) {
  'use strict';
  var URL = 'https://lekify.pl/lekowrazliwosc';
  function box() {
    return '<div class="box euc-box" data-eucast="1" style="border-left:4px solid #C62828">' +
      '<b>🧫 EUCAST 2026 (KORLD) – matryca wrażliwości:</b> link zewnętrzny do Lekify, <b>wymaga sieci</b>. To nie lokalna tabela breakpointów – w Asystencie SOR nie ma offline tabeli EUCAST. <span class="dw">DO DECYZJI LEKARZA</span> ' +
      '<button type="button" class="tg euc-open" onclick="window.open(\'' + URL + '\',\'_blank\',\'noopener,noreferrer\')">Otwórz EUCAST (Lekify, nowa karta) →</button></div>';
  }
  root.SKEUCAST = { URL: URL, box: box };
})(typeof window !== 'undefined' ? window : this);
