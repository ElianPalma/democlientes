// Vista previa dinámica para enlaces con parámetros (?marca=...&producto=...&img_prod=...)
// LinkedIn y WhatsApp no ejecutan JavaScript: leen el HTML tal como llega.
// Esta función de Netlify reescribe las etiquetas Open Graph según los parámetros de la dirección.
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function rewrite(html, url) {
  const p = url.searchParams;
  const clean = (k, n = 90) => (p.get(k) || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);
  const marca = clean('marca'), producto = clean('producto');
  if (!marca && !producto) return html;
  const title = marca && producto ? `${marca} | ${producto}` : (marca || producto);
  const desc = `${producto ? producto + ' en ' : ''}${marca || 'nuestra tienda'}. Compra en 1 clic, pago seguro y asistente con IA 24/7.`;
  const img = /^https:\/\//i.test(p.get('img_prod') || '') ? p.get('img_prod') : `${url.origin}/og-preview.jpg`;
  const set = (k, v) => { html = html.replace(new RegExp(`(<meta (?:property|name)="${k}" content=")[^"]*(")`), (m, a, b) => a + esc(v) + b); };
  html = html.replace(/<title>[^<]*<\/title>/, () => `<title>${esc(title)}</title>`);
  set('description', desc); set('og:site_name', marca || title); set('og:title', title); set('og:description', desc);
  set('og:url', url.href); set('og:image', img); set('og:image:alt', title);
  set('twitter:title', title); set('twitter:description', desc); set('twitter:image', img);
  return html;
}

export default async (request, context) => {
  const res = await context.next();
  const url = new URL(request.url);
  if (!url.search || !(res.headers.get('content-type') || '').includes('text/html')) return res;
  const html = rewrite(await res.text(), url);
  const headers = new Headers(res.headers);
  headers.delete('content-length');
  return new Response(html, { status: res.status, headers });
};

export const config = { path: '/' };
