// assets/js/nav.js
// Initialisiert Navigation: aktive Links markieren, Dropdowns per Click toggle, globales Close-on-Outside, ESC schliessen.
// Erwarte: header wurde bereits per fetch() eingefügt, sonst findet das Script nichts — deswegen erst initNav() nach loadInclude aufrufen.

function markActiveNav() {
  const nav = document.querySelector('.main-nav');
  if (!nav) return;
  const links = nav.querySelectorAll('a');
  // aktuelle Datei (z.B. "chronik.html" oder "")
  let cur = location.pathname.split('/').pop();
  if (!cur) cur = 'index.html';
  links.forEach(a => {
    a.classList.remove('active');
    let href = a.getAttribute('href') || '';
    // Normalisiere
    href = href.replace(/^\//, '');
    if (href === '') href = 'index.html';
    if (href === cur) {
      a.classList.add('active');
      // Wenn das aktive Link im Dropdown ist => markiere dropbtn
      const parentDropdown = a.closest('.dropdown');
      if (parentDropdown) {
        const btn = parentDropdown.querySelector('.dropbtn');
        if (btn) btn.classList.add('active');
      }
    }
  });
}

function initDropdowns() {
  // Set up each dropdown only once
  document.querySelectorAll('.dropdown').forEach(dd => {
    const btn = dd.querySelector('.dropbtn');
    const menu = dd.querySelector('.dropdown-menu');
    if (!btn || !menu) return;
    if (btn.dataset._navInit === '1') return; // already initialisiert
    btn.dataset._navInit = '1';

    // initial ARIA
    btn.setAttribute('aria-expanded', 'false');

    // Click toggles the dropdown (works on touch & mouse)
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent document click from immediately closing
      const isOpen = dd.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

      // close other open dropdowns
      document.querySelectorAll('.dropdown.open').forEach(other => {
        if (other !== dd) {
          other.classList.remove('open');
          const b = other.querySelector('.dropbtn');
          if (b) b.setAttribute('aria-expanded', 'false');
        }
      });
    });

    // ensure clicks inside menu do not bubble up to document handler
    menu.addEventListener('click', (e) => e.stopPropagation());
  });

  // Close any open dropdown when clicking/tapping outside
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown.open').forEach(dd => {
      dd.classList.remove('open');
      const btn = dd.querySelector('.dropbtn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      document.querySelectorAll('.dropdown.open').forEach(dd => {
        dd.classList.remove('open');
        const btn = dd.querySelector('.dropbtn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    }
  });
}

/**
 * initNav: ruft markActiveNav() und initDropdowns() auf.
 * Muss **nach** dem Einfügen des Headers (loadInclude) aufgerufen werden.
 */
function initNav() {
  markActiveNav();
  initDropdowns();
}
