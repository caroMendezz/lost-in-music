export const API_URL = 'http://localhost:3000';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// Hace el fetch, parsea el JSON y lanza un Error (con .status) si la respuesta no es 2xx
export async function request(path, options = {}) {
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