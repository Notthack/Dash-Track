/**
 * ThemeManager — Handles manual dark/light mode toggling.
 *
 * Persists the user's choice in localStorage so the preference
 * survives page reloads and navigation between Admin ↔ Merchant views.
 *
 * Usage: included as a <script> in every page BEFORE the closing </body>.
 *        Looks for a button with class "theme-toggle__btn" to bind to.
 */
const ThemeManager = (() => {
  const STORAGE_KEY = 'dash-voucher-theme';

  function getPreferred() {
    return localStorage.getItem(STORAGE_KEY) || 'light';
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    apply(next);
  }

  function init() {
    // Apply saved preference immediately (prevents flash)
    apply(getPreferred());

    // Bind to toggle button once DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      const btn = document.querySelector('.theme-toggle__btn');
      if (btn) {
        btn.addEventListener('click', toggle);
      }
    });
  }

  // Run init right away (script is loaded in <head> or early in <body>)
  init();

  return { toggle, apply, getPreferred };
})();
