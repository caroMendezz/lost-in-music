// Imagenes de prueba para Shop in vivo.
// Todavia no hay fotos reales de publicaciones, asi que se generan SVG con los
// colores y el nombre de cada producto. Cuando existan publicaciones reales,
// products.images y seller.avatar van a traer URLs del backend y este archivo
// deja de ser necesario.

const toDataUri = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const escapeXml = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Algunas fotos son verticales a proposito, para probar que la galeria
// conserva las proporciones de cada imagen.
const SIZES = [
  [800, 800],
  [800, 600],
  [600, 800],
];

/**
 * Devuelve `count` imagenes de prueba distintas para un producto.
 *   name  -> texto que aparece en la foto
 *   tone  -> [colorOscuro, colorClaro], el mismo que usa la tarjeta del catalogo
 */
export function demoProductImages(name, tone, count) {
  const [dark, light] = tone;

  return Array.from({ length: count }, (_, i) => {
    const [w, h] = SIZES[i % SIZES.length];
    const angle = (i * 47) % 360;
    const cx = 20 + ((i * 29) % 60);
    const cy = 25 + ((i * 17) % 50);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" gradientTransform="rotate(${angle} .5 .5)">
      <stop offset="0" stop-color="${dark}"/>
      <stop offset="1" stop-color="${light}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="${cx}%" cy="${cy}%" r="${Math.min(w, h) * 0.28}" fill="#ffffff" fill-opacity=".18"/>
  <rect x="0" y="${h * 0.36}" width="100%" height="${h * 0.28}" fill="#0b2337" fill-opacity=".35"/>
  <text x="50%" y="47%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(w / 14)}" font-weight="700" fill="#ffffff">${escapeXml(name)}</text>
  <text x="50%" y="58%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(w / 22)}" fill="#ffffff" fill-opacity=".85">Foto ${i + 1} de ${count}</text>
</svg>`;

    return toDataUri(svg);
  });
}

// Avatar de prueba con las iniciales del vendedor.
export function demoAvatar(name, color) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" fill="${color}"/>
  <text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="#ffffff">${escapeXml(initials)}</text>
</svg>`;

  return toDataUri(svg);
}
