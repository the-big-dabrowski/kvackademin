/**
 * Laddar innehåll från /data. Statisk hosting kan inte lista en mapp,
 * så /data/index.json räknar upp vilka filer som är aktiva.
 */

const BASE = new URL('../../../data/', import.meta.url);

async function fetchJson(path) {
  const res = await fetch(new URL(path, BASE), { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
  return res.json();
}

export async function loadAll() {
  const index = await fetchJson('index.json');
  const files = Array.isArray(index.files) ? index.files : [];
  const results = await Promise.allSettled(files.map((f) => fetchJson(f)));
  return results.flatMap((r, i) => {
    if (r.status === 'fulfilled' && r.value?.type) return [{ ...r.value, source: files[i] }];
    console.warn(`Skipped data file ${files[i]}`, r.reason ?? 'missing type');
    return [];
  });
}
