import { h, icon, ICONS } from './dom.js';

/**
 * Form helpers with visible labels, hints and friendly text errors (WCAG 3.3.1, 3.3.2).
 */

function describedBy(...ids) {
  return ids.filter(Boolean).join(' ') || null;
}

/** Text field for a whole number. Uses inputmode="numeric" for the iPhone number keyboard. */
export function numberField({ id, label, hint, value = '', type = 'text', autocomplete = 'off' }) {
  const hintId = hint ? `${id}-hint` : null;
  const errorId = `${id}-error`;
  const input = h('input', {
    class: 'field__input field__input--short',
    id,
    name: id,
    type,
    inputmode: 'numeric',
    autocomplete,
    value: String(value),
    'aria-describedby': describedBy(hintId),
  });
  const error = h('p', { class: 'field__error', id: errorId, hidden: true });
  const el = h('div', { class: 'field' },
    h('label', { class: 'field__label', for: id }, label),
    hint ? h('p', { class: 'field__hint', id: hintId }, hint) : null,
    error,
    input,
  );

  return {
    el,
    input,
    value: () => input.value.trim(),
    setError(message) {
      if (message) {
        error.replaceChildren(icon(ICONS.info, 'field__error-icon'), h('span', {}, message));
        error.hidden = false;
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', describedBy(hintId, errorId));
        input.focus();
      } else {
        error.hidden = true;
        error.replaceChildren();
        input.removeAttribute('aria-invalid');
        input.setAttribute('aria-describedby', describedBy(hintId) ?? '');
        if (!hintId) input.removeAttribute('aria-describedby');
      }
    },
  };
}

/** Parse a whole number in [min, max], or return a friendly Swedish error message. */
export function parsePage(raw, min, max) {
  if (!/^\d+$/.test(raw)) return { error: `Skriv sidnumret med siffror, till exempel ${Math.max(min, 1)}.` };
  const page = Number(raw);
  if (page < min || page > max) return { error: `Skriv en sida mellan ${min} och ${max}.` };
  return { page };
}

/** Single-line text field with a visible label. */
export function textField({ id, label, value = '', autocomplete = 'off' }) {
  const input = h('input', { class: 'field__input', id, name: id, type: 'text', autocomplete, value });
  return {
    el: h('div', { class: 'field' }, h('label', { class: 'field__label', for: id }, label), input),
    input,
  };
}

export function textArea({ id, label, value = '' }) {
  const input = h('textarea', { class: 'field__input', id, name: id, rows: '3' });
  input.value = value;
  return {
    el: h('div', { class: 'field' }, h('label', { class: 'field__label', for: id }, label), input),
    input,
  };
}

/** Group of large radio choices with a visible legend. */
export function choiceGroup({ name, legend, options, value }) {
  const inputs = [];
  const el = h('fieldset', { class: 'choice-group' },
    h('legend', { class: 'choice-group__legend' }, legend),
    options.map((opt) => {
      const input = h('input', {
        class: 'choice-group__input',
        type: 'radio',
        name,
        id: `${name}-${opt.value}`,
        value: opt.value,
        checked: opt.value === value,
      });
      inputs.push(input);
      return h('label', { class: 'choice-group__option', for: `${name}-${opt.value}` }, input, h('span', {}, opt.label));
    }),
  );
  return { el, value: () => inputs.find((i) => i.checked)?.value ?? null };
}
