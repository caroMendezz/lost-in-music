// Utilidades del detalle de producto de Shop in vivo.

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Antiguedad de la publicacion a partir de su fecha (ISO string o Date).
 * Hoy los productos de prueba traen un postedAt calculado; cuando lleguen
 * publicaciones reales alcanza con pasar la fecha de creacion del backend
 * (por ejemplo createdAt de Mongo).
 */
export function formatPostedAt(value, now = Date.now()) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diff = Math.max(0, now - date.getTime());

  if (diff < HOUR) {
    const minutes = Math.max(1, Math.floor(diff / MINUTE));
    return `Publicado hace ${minutes} minuto${minutes === 1 ? "" : "s"}`;
  }

  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `Publicado hace ${hours} hora${hours === 1 ? "" : "s"}`;
  }

  if (diff < 7 * DAY) {
    const days = Math.floor(diff / DAY);
    return `Publicado hace ${days} día${days === 1 ? "" : "s"}`;
  }

  return `Publicado el ${date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}`;
}

/**
 * Link de una publicacion.
 * PENDIENTE: todavia no existe una ruta de detalle de producto. Cuando se cree
 * (por ejemplo <Route path="/producto/:id" /> en el router), este es el unico
 * lugar que hay que ajustar para que el link copiado abra la publicacion.
 */
export function getProductUrl(productId) {
  return `${window.location.origin}/producto/${encodeURIComponent(productId)}`;
}

/**
 * Copia texto al portapapeles. Usa la Clipboard API cuando esta disponible y,
 * si no, el metodo clasico con un textarea oculto.
 * Si no se pudo copiar lanza un error: quien la llama decide que avisar.
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "-1000px";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    document.body.removeChild(area);
  }

  if (!copied) throw new Error("No se pudo copiar al portapapeles");
}
