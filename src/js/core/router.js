/**
 * Hash router (#/path). Works on GitHub Pages without server configuration.
 *
 * A view is { render(container, params) => Promise<{ title }> | { title } }.
 * After a view change, focus moves to the view's h1 and document.title is updated.
 * A view may return `cleanup()`; it runs before the next view renders (timers, autosave).
 */

const APP_NAME = 'Kvackademin';
const routes = [];
let notFound = null;
let container = null;
let isFirstRender = true;
let lastPath = '/';
let cleanupCurrent = null;

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
  // Only hashes starting with "/" are routes; e.g. "#main" (skip link) is ignored.
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
  cleanupCurrent?.();
  cleanupCurrent = null;
  container.replaceChildren();
  const result = (await view.render(container, params)) ?? {};
  cleanupCurrent = result.cleanup ?? null;
  document.title = result.title ? `${result.title} – ${APP_NAME}` : APP_NAME;

  // First load: leave focus at the top so the skip link comes first.
  // On view change: move focus to the h1 so screen readers announce the new view.
  const heading = container.querySelector('h1');
  heading?.setAttribute('tabindex', '-1');
  if (heading && !isFirstRender) heading.focus({ preventScroll: true });
  window.scrollTo(0, 0);
  isFirstRender = false;
  window.dispatchEvent(new CustomEvent('routechange', { detail: { path } }));
}

export function start(target) {
  container = target;
  window.addEventListener('hashchange', render);
  render();
}
