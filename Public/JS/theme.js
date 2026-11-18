/* ============ TASKFLOW — THEME (dark / light switching) ============ */

const Theme = (() => {
  let current = 'dark';

  const apply = (theme) => {
    current = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', current);

    // Sidebar toggle label
    const label = document.querySelector('.theme-toggle__label');
    if (label) label.textContent = current === 'dark' ? 'Dark Theme' : 'Light Theme';

    // Header icon
    const holder = document.querySelector('#btnThemeHeader [data-icon]');
    if (holder && window.ICONS) {
      holder.innerHTML = current === 'dark' ? window.ICONS.sun : window.ICONS.moon;
    }

    // Settings cards
    document.querySelectorAll('.theme-card').forEach((card) => {
      card.classList.toggle('active', card.dataset.theme === current);
    });
  };

  const toggle = () => {
    const next = current === 'dark' ? 'light' : 'dark';
    apply(next);
    const prefs = Storage.getPrefs();
    prefs.theme = next;
    Storage.savePrefs(prefs);
    if (typeof Tasks !== 'undefined') Tasks.toast(`Switched to ${next} theme`, 'info');
  };

  const init = () => {
    apply(Storage.getPrefs().theme);
    const btnSidebar = document.getElementById('btnThemeToggle');
    const btnHeader = document.getElementById('btnThemeHeader');
    if (btnSidebar) btnSidebar.addEventListener('click', toggle);
    if (btnHeader) btnHeader.addEventListener('click', toggle);
  };

  const set = (theme) => {
    if (theme === current) return;
    toggle();
  };

  return { init, apply, toggle, set, get: () => current };
})();
