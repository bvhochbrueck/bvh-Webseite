// assets/js/nav.js
// Robustierte Version der Nav-Initialisierung mit ausführlichen Kommentaren.
//
// Verwendung:
// 1) Achte darauf, dass dein Header per fetch() eingefügt wurde (z.B. loadInclude('site-header','/includes/header.html')).
// 2) Rufe anschließend initNav() auf. InitNav ist idempotent und sicher mehrfach aufrufbar.
//
// Was hier verbessert wurde:
// - document-level event listeners (click / keydown) werden nur einmal registriert (Guard).
// - aktives Link-Matching wurde robuster implementiert (funktioniert mit relativen Pfaden, absoluten Pfaden,
//   Repo-Unterverzeichnissen und root '/').
// - Dropdown-Initialisierung wird pro Button nur einmal gemacht (dataset flag).
// - ausführliche Debug-/Fehlerhinweise in console.warn (hilfreich beim Testen).

/* -------------------------
   Hilfsfunktionen
   ------------------------- */

/**
 * normalizePath(pathname)
 * Normalisiert einen Pfad zum Vergleich:
 * - "/" oder "" -> "/index.html"
 * - entfernt evtl. vorhandene query/hash-Anteile vor dem Vergleich (wir arbeiten nur mit pathname)
 */
function normalizePath(pathname) {
  if (!pathname) return '/index.html';
  // Entferne query & hash falls irrtümlich übergeben
  pathname = pathname.split('?')[0].split('#')[0];
  if (pathname === '' || pathname === '/') return '/index.html';
  // Entferne abschließenden Slash, aber behandle "/" bereits oben
  if (pathname.endsWith('/')) pathname = pathname.slice(0, -1);
  return pathname;
}

/**
 * resolveToPath(href)
 * Versucht, href in einen absoluten Pfad (pathname) zu transformieren.
 * - Für externe Links (anderer origin) liefert null -> diese werden nicht verglichen.
 * - Für internal/relative Links liefert ein normalisierter pathname.
 */
function resolveToPath(href) {
  if (!href) return null;
  try {
    // URL löst relative Pfade gegen current location auf
    const url = new URL(href, location.href);
    // Wenn Link extern ist, überspringen
    if (url.origin !== location.origin) return null;
    return normalizePath(url.pathname);
  } catch (e) {
    // Fallback: falls URL-Konstruktor fehlschlägt, z.B. ungewöhnliche Schemes
    return null;
  }
}

/* -------------------------
   Aktive Navigation markieren
   ------------------------- */
function markActiveNav() {
  const nav = document.querySelector('.main-nav');
  if (!nav) return;

  // Aktuelle Seite normalisiert
  const current = normalizePath(location.pathname);

  // Alle Links prüfen
  const links = nav.querySelectorAll('a');
  links.forEach(a => {
    a.classList.remove('active');
  });

  // Versuche, bestmöglichen Match zu finden (genauer Match bevorzugt)
  links.forEach(a => {
    const href = a.getAttribute('href') || '';
    const linkPath = resolveToPath(href);
    if (!linkPath) return; // extern, mailto, tel, anchors etc. überspringen

    if (linkPath === current) {
      a.classList.add('active');
      // Wenn Link in einem Dropdown liegt, markiere auch den Button
      const parentDropdown = a.closest('.dropdown');
      if (parentDropdown) {
        const btn = parentDropdown.querySelector('.dropbtn');
        if (btn) btn.classList.add('active');
      }
    }
  });
}

/* -------------------------
   Dropdowns initialisieren
   ------------------------- */
function initDropdowns() {
  // Initialisiere pro .dropdown einmal die Knöpfe
  const dropdowns = document.querySelectorAll('.dropdown');
  dropdowns.forEach(dd => {
    const btn = dd.querySelector('.dropbtn');
    const menu = dd.querySelector('.dropdown-menu');
    if (!btn || !menu) return;

    // Verhindern Doppel-Initialisierung eines Buttons (falls initNav mehrfach gerufen wird)
    if (btn.dataset._navInit === '1') return;
    btn.dataset._navInit = '1';

    // Setze ARIA-Zustand initial
    btn.setAttribute('aria-expanded', 'false');

    // Klick auf Button toggled das Dropdown (funktioniert für Maus & Touch)
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // verhindert, dass das globale Klick-Handler sofort schließt
      const isOpen = dd.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

      // Schließe alle anderen offenen Dropdowns
      document.querySelectorAll('.dropdown.open').forEach(other => {
        if (other !== dd) {
          other.classList.remove('open');
          const b = other.querySelector('.dropbtn');
          if (b) b.setAttribute('aria-expanded', 'false');
        }
      });
    });

    // Verhindere, dass Klicks innerhalb des Menüs zum globalen Dokument-Handler durchschlagen.
    // (Tipp: Links innerhalb des Menüs navigieren trotzdem normal.)
    menu.addEventListener('click', (e) => e.stopPropagation());

    // Optional: wenn Nutzer mit TAB ins Menü geht, soll es sichtbar bleiben:
    // focusin/focusout unterstützen (modernere Browser) -> keine zusätzliche JS-Logik nötig,
    // weil CSS :focus-within in deinem stylesheet aktiv ist (.dropdown:focus-within > .dropdown-menu).
  });

  /* -------------------------
     Globale Document-Handler (einmalig registrieren)
     ------------------------- */
  if (!window.__bv_nav_handlers_installed) {
    // Klick außerhalb schliesst alle Dropdowns
    document.addEventListener('click', () => {
      document.querySelectorAll('.dropdown.open').forEach(dd => {
        dd.classList.remove('open');
        const btn = dd.querySelector('.dropbtn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    }, { passive: true });

    // ESC schließt offene Dropdowns
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        document.querySelectorAll('.dropdown.open').forEach(dd => {
          dd.classList.remove('open');
          const btn = dd.querySelector('.dropbtn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });
      }
    });

    // Flag setzen, damit diese Handler nicht mehrfach registriert werden
    window.__bv_nav_handlers_installed = true;
  }
}

/* -------------------------
   initNav: Startpunkt (idempotent)
   ------------------------- */
function initNav() {
  // Wenn noch kein Header eingefügt wurde, versuchen wir trotzdem (markActiveNav/ initDropdowns sind robust)
  try {
    markActiveNav();
    initDropdowns();
  } catch (e) {
    // Falls etwas schief geht, in der Konsole ausgeben, aber nicht die Seite crashen lassen.
    console.warn('initNav: Fehler bei der Initialisierung', e);
  }
}

// Export / Expose (falls jemand die Funktion als Modul erwartet)
if (typeof window !== 'undefined') {
  window.initNav = initNav;
}
