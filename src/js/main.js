import * as router from './core/router.js';
import { requestPersistence } from './core/storage.js';
import { todayView } from './views/today.js';
import { missionsView } from './views/missions.js';
import { parentView } from './views/parent.js';
import { notFoundView } from './views/not-found.js';

// Mission modules are registered here (phase 2):
// import { registerModule } from './core/registry.js';
// import examModule from './modules/exam.js';
// registerModule(examModule);

router.addRoute('/', todayView);
router.addRoute('/missions', missionsView);
router.addRoute('/parent', parentView);
router.setNotFound(notFoundView);

// Skip link: move focus to the content without changing the hash (the router owns the hash).
document.querySelector('[data-js="skip-link"]').addEventListener('click', (event) => {
  event.preventDefault();
  const main = document.querySelector('[data-js="view"]');
  (main.querySelector('h1') ?? main).focus();
});

// Mark the current view in the nav with aria-current (visible without relying on color).
window.addEventListener('routechange', ({ detail }) => {
  for (const link of document.querySelectorAll('[data-js="nav-link"]')) {
    if (link.getAttribute('href') === `#${detail.path}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
});

requestPersistence();
router.start(document.querySelector('[data-js="view"]'));
