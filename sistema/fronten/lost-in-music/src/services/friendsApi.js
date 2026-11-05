// Igual que messageService: se puede apuntar a otra API con VITE_API_URL
import { API_URL } from "./http";

// Namespace de socket.io para la presencia (en línea / desconectado)
export const PRESENCE_URL = `${API_URL}/presence`;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// Hace el fetch, parsea el JSON y lanza un Error (con .status) si la respuesta no es 2xx
async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });

  // El cuerpo se lee como texto para distinguir "sin contenido" de una respuesta que no es
  // JSON (por ejemplo el HTML de otro servidor). Eso nunca debe llegar como null a los componentes.
  const raw = await response.text().catch(() => '');
  let data = null;
  if (raw.trim()) {
    try {
      data = JSON.parse(raw);
    } catch {
      if (response.ok) {
        const parseError = new Error('Respuesta inválida del servidor');
        parseError.status = response.status;
        throw parseError;
      }
    }
  }

  if (!response.ok) {
    const error = new Error(data?.message || 'Error en la solicitud');
    error.status = response.status;
    throw error;
  }
  return data;
}

// Las fotos pueden venir en Base64, como URL completa o como ruta del backend
export const resolveMedia = (src) =>
  !src || /^(data:|https?:|blob:)/.test(src) ? src : `${API_URL}${src}`;

export const fetchFriends = () => request('/friends');
export const fetchFriendRequests = () => request('/friends/requests');
export const searchPeople = (query) =>
  request(`/friends/search?q=${encodeURIComponent(query)}`);

// Todas devuelven { relation }: 'none' | 'friend' | 'pending_sent'
export const sendFriendRequest = (userId) =>
  request(`/friends/request/${userId}`, { method: 'POST' });
export const acceptFriendRequest = (userId) =>
  request(`/friends/accept/${userId}`, { method: 'PATCH' });

// Sirve para eliminar amigo, cancelar una solicitud enviada o rechazar una recibida
export const removeFriendship = (userId) =>
  request(`/friends/${userId}`, { method: 'DELETE' });