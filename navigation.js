(() => {
  const header = document.querySelector('.site-header');
  const button = document.getElementById('menu-toggle');
  const nav = document.getElementById('main-navigation');
  const mobile = matchMedia('(max-width: 600px)');
  if (!header || !button || !nav) return;

  function setOpen(open, restoreFocus = false) {
    header.classList.toggle('menu-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    if (restoreFocus) button.focus();
  }

  button.hidden = false;
  header.classList.add('menu-ready');
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      setOpen(false, true);
    }
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) setOpen(false);
  });
  header.addEventListener('focusout', event => {
    if (!header.contains(event.relatedTarget)) setOpen(false);
  });
  mobile.addEventListener('change', () => setOpen(false));
})();
