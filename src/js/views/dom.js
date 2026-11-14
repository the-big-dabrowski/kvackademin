/** Liten hjälpare för att bygga DOM utan innerHTML. */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  el.append(...children.flat().filter((c) => c != null && c !== false));
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Enkel ikon. Alltid dekorativ: synlig text bär betydelsen. */
export function icon(pathD, className = 'button__icon') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('class', className);
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', pathD);
  path.setAttribute('fill', 'currentColor');
  svg.append(path);
  return svg;
}

export const ICONS = {
  play: 'M7 4v16l13-8z',
};
