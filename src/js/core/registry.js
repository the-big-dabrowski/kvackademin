/**
 * Register över uppdragsmoduler, nycklat på datafilens `type`.
 *
 * En modul är ett objekt med:
 *   type: string                         – matchar `type` i JSON-filen
 *   label: string                        – svensk visningstext
 *   getMissions(data, ctx) => Mission[]  – dagens uppdrag från en datafil
 *   view?: { render(container, params) } – vyn som kör uppdraget
 *
 * Nya typer registreras i main.js; core behöver inte ändras.
 */

const modules = new Map();

export function registerModule(module) {
  if (!module?.type) throw new Error('Module must have a type');
  if (modules.has(module.type)) throw new Error(`Module "${module.type}" is already registered`);
  modules.set(module.type, module);
}

export function getModule(type) {
  return modules.get(type) ?? null;
}

export function allModules() {
  return [...modules.values()];
}
