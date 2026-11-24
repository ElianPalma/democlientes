// Vista previa dinámica para enlaces con parámetros (?marca=...&producto=...&img_prod=...)
// y para ENLACES CORTOS de Supabase (?c=tomoka  ó  /tomoka).
// LinkedIn y WhatsApp no ejecutan JavaScript: leen el HTML tal como llega.
// Esta función de Netlify reescribe las etiquetas Open Graph según los parámetros de la dirección
// (y, si hay slug, según la configuración guardada en Supabase).

// ✏️ Pega aquí los MISMOS 2 datos que pusiste en index.html (la clave es pública, no es secreta)
const SUPABASE_URL = 'https://lbivbdtivdldzssiavly.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_RLHM7DaRERuVLwq8_r3yHA_GT2n2XVu';

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,47}$/;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// slug: ?c=tomoka  >  /tomoka
function getSlug(url) {
  const c = (url.searchParams.get('c') || '').trim().toLowerCase();
  if (SLUG_RE.test(c)) return c;
  let seg = '';
  try { seg = decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, '').toLowerCase(); } catch (e) { return ''; }
  return SLUG_RE.test(seg) && seg !== 'index' ? seg : '';
}

// Lee la configuración de un slug en Supabase (máx. 2,5 s: si falla, se deja la vista previa genérica)
async function loadConfig(slug) {
  if (!slug || /TU-PROYECTO|TU_CLAVE/.test(SUPABASE_URL + SUPABASE_ANON_KEY)) return null;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 2500);
  try {
    const headers = { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' };
    if (SUPABASE_ANON_KEY.startsWith('eyJ')) headers.Authorization = 'Bearer ' + SUPABASE_ANON_KEY; // la clave nueva (sb_publishable_) va SOLO en apikey
    const r = await fetch(SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/rpc/get_demo', {
      method: 'POST', headers, body: JSON.stringify({ p_slug: slug }), signal: ctl.signal
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j && typeof j === 'object' && !Array.isArray(j) ? j : null;
  } catch (e) { return null; } finally { clearTimeout(t); }
}

// cfg = configuración de Supabase (opcional). Los parámetros explícitos de la URL tienen prioridad.
export function rewrite(html, url, cfg = {}) {
  const p = url.searchParams;
  const get = k => { const v = p.get(k); return v ? v : (cfg && cfg[k] != null && typeof cfg[k] !== 'object' ? String(cfg[k]) : ''); };
  const clean = (k, n = 90) => get(k).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
  const marca = clean('marca'), producto = clean('producto');
  if (!marca && !producto) return html;
  const title = marca && producto ? `${marca} | ${producto}` : (marca || producto);
  const desc = `${producto ? producto + ' en ' : ''}${marca || 'nuestra tienda'}. Compra en 1 clic, pago seguro y asistente con IA 24/7.`;
  const img = /^https:\/\//i.test(get('img_prod')) ? get('img_prod') : `${url.origin}/og-preview.jpg`;
  const set = (k, v) => { html = html.replace(new RegExp(`(<meta (?:property|name)="${k}" content=")[^"]*(")`), (m, a, b) => a + esc(v) + b); };
  html = html.replace(/<title>[^<]*<\/title>/, () => `<title>${esc(title)}</title>`);
  set('description', desc); set('og:site_name', marca || title); set('og:title', title); set('og:description', desc);
  set('og:url', url.href); set('og:image', img); set('og:image:alt', title);
  set('twitter:title', title); set('twitter:description', desc); set('twitter:image', img);
  return html;
}

export default async (request, context) => {
  const url = new URL(request.url);
  const slug = getSlug(url);
  if (!url.search && !slug) return; // nada que personalizar: la petición sigue su camino normal
  const res = await context.next();
  if (!(res.headers.get('content-type') || '').includes('text/html')) return res;
  const cfg = slug ? await loadConfig(slug) : null;
  const html = rewrite(await res.text(), url, cfg || {});
  const headers = new Headers(res.headers);
  headers.delete('content-length');
  return new Response(html, { status: res.status, headers });
};

// "/" y cualquier ruta de un solo nivel (/tomoka). Los archivos con punto (og-preview.jpg, etc.) quedan fuera.
export const config = { path: ['/', '/*'], excludedPath: ['/*.*'] };
