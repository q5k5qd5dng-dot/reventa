export const routes = [];
export const on = (method, path, h) => routes.push({ method, re: new RegExp(`^${path.replace(/:(\w+)/g, "(?<$1>[^/]+)")}$`), h });
export function match(method, pathname) {
  for (const r of routes) { if (r.method !== method) continue; const m = r.re.exec(pathname); if (m) return { h: r.h, params: m.groups ?? {} }; }
  return null;
}
export const allowed = (pathname) => routes.some((r) => r.re.test(pathname));
