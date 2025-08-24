// assets/js/nav.js
// Robustierte Version der Nav-Initialisierung mit ausführlichen Kommentaren.
//
// Verwendung:
// 1) Sorge dafür, dass der Header per fetch() (z. B. loadInclude) eingefügt wurde.
// 2) Rufe anschließend initNav() auf. (initNav ist idempotent — kann mehrfach aufgerufen werden.)
//
// Diese Version enthält:
// - Robustes aktives-Link-Matching (relative/absolute Pfade, root '/')
// - Vermeidung doppelter Event-Registrierung (Guard für document-level Handler)
// - Einmalige Initialisierung pro Dropbtn (dataset-Flag)
// - Schließen des Menüs bei Klick auf einen Menü-Link (wichtig auf Touch)
// - saubere ARIA-Aktualisierung (aria-expanded)

(function () {
  'use strict';

  /* -------------------------
     Hilfsfunktionen
     ------------------------- */

  /**
   * normalizePath(pathname)
   * - Entfernt query/hash.
   * - Wandelt "/" oder "" in "/index.html" um.
   * - Entfernt einen abschließenden Slash (außer Root).
   * Rückgabe: pathname mit führendem "/" (z.B. "/chronik.html" oder "/ordner/seite.html")
   */
  function normalizePath(pathname) {
    if (!pathname) return '/index.html';
    pathname = String(pathname).split('?')[0].split('#')[0];
    if (pathname === '' || pathname === '/') return '/index.html';
    if (pathname.endsWith('/')) pathname = pathname.slice(0, -1);
    // Stelle sicher, dass ein führender Slash vorhanden ist
    return pathname.startsWith('/') ? pathname : '/' + pathname;
  }

  /**
   * resolveToPath(href)
   * - Wandelt ein href (relativ oder absolut) in einen normalisierten Pfad um.
   * - Gibt null zurück für externe Links (andere origin) oder ungültige hrefs.
   */
  function resolveToPath(href) {
    if (!href) return null;
    try {
      const url = new URL(href, location.href); // löst relative Pfade
      if (url.origin !== location.origin) return null; // externe Links überspringen
      return normalizePath(url.pathname);
    } catch (err) {
      // Falls URL-Konstruktor scheitert (sehr selten), überspringen
      return null;
    }
  }

  /* -------------------------
     Aktive Navigation markieren
     ------------------------- */
  function markActiveNav() {
    const nav = document.querySelector('.main-nav');
    if (!nav) {
      // Kein nav vorhanden — wahrscheinlich Header noch nicht geladen.
      // Keine Fehler werfen, nur loggen (hilfreich beim Debuggen).
      // console.warn('markActiveNav: .main-nav nicht gefunden');
      return;
    }

    // Aktuelle Seite normalisiert (z. B. "/chronik.html")
    const current = normalizePath(location.pathname);

    // 1) Entferne vorherige aktive Zustände an Links und Dropbuttons
    nav.querySelectorAll('a').forEach(a => a.classList.remove('active'));
    nav.querySelectorAll('.dropbtn').forEach(b => b.classList.remove('active'));

    // 2) Suche Links, die zur aktuellen Seite passen
    const links = nav.querySelectorAll('a');
    links.forEach(a => {
      const href = a.getAttribute('href') || '';
      const linkPath = resolveToPath(href);
      if (!linkPath) return; // extern / anchors / mailto überspringen

      if (linkPath === current) {
        // Treffer: markiere Link aktiv
        a.classList.add('active');

        // Wenn dieser Link in einem Dropdown liegt, markiere auch den Dropbtn
        const parentDropdown = a.closest('.dropdown');
        if (parentDropdown) {
          const btn = parentDropdown.querySelector('.dropbtn');
          if (btn) {
            btn.classList.add('active');
            // optional: parentDropdown.classList.add('open'); // falls du bei Seitenladezustand das Menü öffnen willst
          }
        }
      }
    });
  }

  /* -------------------------
     Dropdowns initialisieren
     ------------------------- */
  function initDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dd => {
      const btn = dd.querySelector('.dropbtn');
      const menu = dd.querySelector('.dropdown-menu');
      if (!btn || !menu) return;

      // Verhindere Doppelinitialisierung desselben Buttons
      if (btn.dataset._navInit === '1') return;
      btn.dataset._navInit = '1';

      // ARIA initialisieren
      btn.setAttribute('aria-expanded', 'false');

      // Klick auf Button toggelt Dropdown (funktioniert auf Touch & Click)
      btn.addEventListener('click', function (e) {
        e.stopPropagation(); // verhindert, dass der globale click-handler direkt schließt
        const isOpen = dd.classList.toggle('open');
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

        // Schließe alle anderen geöffneten Dropdowns (single-open Verhalten)
        document.querySelectorAll('.dropdown.open').forEach(other => {
          if (other !== dd) {
            other.classList.remove('open');
            const b = other.querySelector('.dropbtn');
            if (b) b.setAttribute('aria-expanded', 'false');
          }
        });
      });

      // Verhindere, dass Klicks im Menü zum globalen Dokument-Click durchreichen
      menu.addEventListener('click', function (e) { e.stopPropagation(); });

      // WICHTIG: Schließe Menü beim Klick auf einen Menü-Link (wichtig für Touch/Navigation)
      menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', function () {
          dd.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
          // Keine e.preventDefault(): Link navigiert wie üblich.
        });
      });

      // Hinweis: Keyboard-Nutzung wird durch <button> und native Fokus-Events unterstützt.
      // Deine CSS sollte :focus-within behandeln (z.B. .dropdown:focus-within > .dropdown-menu { display: block; })
    });

    /* -------------------------
       Globale Event-Handler (einmalig registrieren)
       ------------------------- */
    if (!window.__bv_nav_handlers_installed) {
      // Klick außerhalb schließt alle offenen Dropdowns
      document.addEventListener('click', function () {
        document.querySelectorAll('.dropdown.open').forEach(dd => {
          dd.classList.remove('open');
          const btn = dd.querySelector('.dropbtn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });
      }, { passive: true });

      // ESC schließt offene Dropdowns
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
          document.querySelectorAll('.dropdown.open').forEach(dd => {
            dd.classList.remove('open');
            const btn = dd.querySelector('.dropbtn');
            if (btn) btn.setAttribute('aria-expanded', 'false');
          });
        }
      });

      // Marke setzen, damit diese Handler nicht erneut registriert werden
      window.__bv_nav_handlers_installed = true;
    }
  }

  /* -------------------------
     initNav: Haupt-Einstiegspunkt
     ------------------------- */
  function initNav() {
    try {
      markActiveNav();
      initDropdowns();
    } catch (err) {
      console.warn('initNav: Fehler bei Initialisierung', err);
    }
  }

  // Expose initNav global (so kannst du es aufrufen, nachdem du Header geladen hast)
  if (typeof window !== 'undefined') {
    window.initNav = initNav;
  }

})();
