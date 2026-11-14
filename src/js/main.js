import * as router from './core/router.js';
import { requestPersistence } from './core/storage.js';
import { homeView } from './views/home.js';
import { missionsView } from './views/missions.js';
import { notFoundView } from './views/not-found.js';

// Uppdragsmoduler registreras här (fas 2):
// import { registerModule } from './core/registry.js';
// import examModule from './modules/exam.js';
// registerModule(examModule);

router.addRoute('/', homeView);
router.addRoute('/uppdrag', missionsView);
router.setNotFound(notFoundView);

// Skip link: flytta fokus till innehållet utan att ändra hash (hash används av routern).
document.querySelector('[data-js="skip-link"]').addEventListener('click', (event) => {
  event.preventDefault();
  const main = document.querySelector('[data-js="view"]');
  (main.querySelector('h1') ?? main).focus();
});

requestPersistence();
router.start(document.querySelector('[data-js="view"]'));
