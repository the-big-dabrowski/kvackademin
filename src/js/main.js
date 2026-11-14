import * as router from './core/router.js';
import { requestPersistence } from './core/storage.js';
import { todayView } from './views/today.js';
import { missionsView } from './views/missions.js';
import { parentView } from './views/parent.js';
import { notFoundView } from './views/not-found.js';

// Uppdragsmoduler registreras här (fas 2):
// import { registerModule } from './core/registry.js';
// import examModule from './modules/exam.js';
// registerModule(examModule);

router.addRoute('/', todayView);
router.addRoute('/uppdrag', missionsView);
router.addRoute('/foralder', parentView);
router.setNotFound(notFoundView);

// Skip link: flytta fokus till innehållet utan att ändra hash (hash används av routern).
document.querySelector('[data-js="skip-link"]').addEventListener('click', (event) => {
  event.preventDefault();
  const main = document.querySelector('[data-js="view"]');
  (main.querySelector('h1') ?? main).focus();
});

// Markera aktuell vy i navigeringen med aria-current (syns även utan färg).
window.addEventListener('routechange', ({ detail }) => {
  for (const link of document.querySelectorAll('[data-js="nav-link"]')) {
    if (link.getAttribute('href') === `#${detail.path}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
});

requestPersistence();
router.start(document.querySelector('[data-js="view"]'));
