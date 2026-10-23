(() => {
  const root = document.documentElement;
  const storageKey = 'ayesha-portfolio-theme';
  let theme = 'light';
  try {
    if (localStorage.getItem(storageKey) === 'dark') theme = 'dark';
  } catch {}

  function applyTheme(value) {
    theme = value;
    root.dataset.theme = theme;
    const button = document.getElementById('theme-toggle');
    if (button) {
      button.textContent = theme === 'dark' ? 'Dark mode' : 'Light mode';
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      button.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content', theme === 'dark' ? '#260f17' : '#e8dcc6'
    );
  }

  // Restore the palette before the page paints; keep motion settings separate.
  applyTheme(theme);
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    button.hidden = false;
    applyTheme(theme);
    button.addEventListener('click', () => {
      applyTheme(theme === 'dark' ? 'light' : 'dark');
      try { localStorage.setItem(storageKey, theme); } catch {}
    });
  });
})();
