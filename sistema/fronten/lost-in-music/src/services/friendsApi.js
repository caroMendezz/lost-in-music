const API_URL = 'http://localhost:3000';

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

  let data = null;
  try {
    data = await response.json();
  } catch {
    // respuesta sin cuerpo
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