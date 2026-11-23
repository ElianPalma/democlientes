# Plantilla maestra de tienda online

Sitio estático (un solo `index.html`) con tienda, asistente de IA simulado, panel y flujo.

## Archivos
- `index.html` — la plantilla completa.
- `og-preview.jpg` — imagen de vista previa al compartir por LinkedIn, WhatsApp, etc. (1200×630).
- `netlify/edge-functions/og.js` — personaliza la vista previa de los enlaces con parámetros (`?marca=...&producto=...&img_prod=...`).
- `netlify.toml` — publica la raíz del repositorio, sin paso de compilación.

## Publicar
1. Sube esta carpeta a un repositorio de GitHub.
2. En Netlify: Add new site → Import an existing project → elige el repositorio. Sin comando de compilación y con el directorio de publicación en `.`.
3. Si tu dirección no es `https://demoelianpalma.netlify.app`, cambia `og:url`, `og:image` y `twitter:image` en el `<head>` de `index.html`.

## Compartir
- LinkedIn guarda la vista previa en caché: usa el Post Inspector para actualizarla.
- WhatsApp también: si sigue saliendo la versión vieja, añade `?v=2` al enlace.
