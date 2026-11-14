/**
 * Hash-router (#/väg). Fungerar på GitHub Pages utan serverkonfiguration.
 *
 * En vy är { render(container, params) => Promise<{ title }> | { title } }.
 * Efter vybyte flyttas fokus till vyns h1 och document.title uppdateras.
 */

const APP_NAME = 'Quackify';
const routes = [];
let notFound = null;
let container = null;
let isFirstRender = true;
let lastPath = '/';

export function addRoute(pattern, view) {
  const keys = [];
  const regex = new RegExp(
    `^${pattern.replace(/\/:(\w+)/g, (_, k) => { keys.push(k); return '/([^/]+)'; })}$`,
  );
  routes.push({ regex, keys, view });
}

export function setNotFound(view) {
  notFound = view;
}

export function navigate(path) {
  if (window.location.hash === `#${path}`) render();
  else window.location.hash = `#${path}`;
}

function currentPath() {
  const hash = window.location.hash.replace(/^#/, '');
  // Bara hashar som börjar med "/" är vägar; t.ex. "#main" (skip link) ignoreras.
  return hash.startsWith('/') ? hash : lastPath;
}

function match(path) {
  for (const { regex, keys, view } of routes) {
    const m = path.match(regex);
    if (m) return { view, params: Object.fromEntries(keys.map((k, i) => [k, decodeURIComponent(m[i + 1])])) };
  }
  return { view: notFound, params: {} };
}

async function render() {
  const path = currentPath();
  if (!isFirstRender && path === lastPath && !window.location.hash.startsWith('#/')) return;
  lastPath = path;
  const { view, params } = match(path);
  container.replaceChildren();
  const result = (await view.render(container, params)) ?? {};
  document.title = result.title ? `${result.title} – ${APP_NAME}` : APP_NAME;

  // Första laddningen: låt fokus börja överst (skip link först).
  // Vid vybyte: flytta fokus till vyns h1 så att skärmläsare läser den nya vyn.
  const heading = container.querySelector('h1');
  heading?.setAttribute('tabindex', '-1');
  if (heading && !isFirstRender) heading.focus({ preventScroll: true });
  window.scrollTo(0, 0);
  isFirstRender = false;
}

export function start(target) {
  container = target;
  window.addEventListener('hashchange', render);
  render();
}
