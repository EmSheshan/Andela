// darkMode.js

const MOON_ICON = '<svg class="icon-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
const SUN_ICON = '<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="currentColor" stroke="none"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';

const MOON_FAVICON = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌙</text></svg>";
const SUN_FAVICON = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>☀️</text></svg>";

function applyDarkModeState(isDark, buttonSelector) {
    const button = document.querySelector(buttonSelector);
    document.body.classList.toggle('dark-mode', isDark);
    document.documentElement.classList.toggle('dark-mode', isDark);
    if (button) button.innerHTML = isDark ? MOON_ICON : SUN_ICON;
    changeFavicon(isDark ? MOON_FAVICON : SUN_FAVICON);
}

function setDarkModeFromStorage(buttonSelector = '.toggle-dark-mode') {
    applyDarkModeState(localStorage.getItem('darkMode') === 'enabled', buttonSelector);
}

function toggleDarkMode(buttonSelector = '.toggle-dark-mode') {
    const isDark = !document.body.classList.contains('dark-mode');
    applyDarkModeState(isDark, buttonSelector);
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
}

function changeFavicon(src) {
    const link = document.createElement('link');
    const oldLink = document.getElementById('dynamic-favicon');
    link.id = 'dynamic-favicon';
    link.rel = 'icon';
    link.href = src;
    if (oldLink) document.head.removeChild(oldLink);
    document.head.appendChild(link);
}

window.toggleDarkMode = toggleDarkMode;
window.setDarkModeFromStorage = setDarkModeFromStorage;
