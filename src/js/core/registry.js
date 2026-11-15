/**
 * Registry of mission modules, keyed by the data file's `type`.
 *
 * A module is an object with:
 *   type: string                         – matches `type` in the JSON file
 *   label: string                        – display text (Swedish)
 *   getMissions(data, ctx) => Mission[]  – today's missions from one data file
 *   view?: { render(container, params) } – the view that runs the mission
 *   summarize?(meta) => string           – one line about a done mission, for summaries
 *
 * New types are registered in main.js; core does not need to change.
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
