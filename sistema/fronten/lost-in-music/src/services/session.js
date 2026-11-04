import { API_URL } from "./http";

export const SESSION_STORAGE_KEYS = ["token", "user", "idRole"];

export function getToken() {
  return localStorage.getItem("token");
}

export function clearSession() {
  SESSION_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
}

// GET /session: valida el token y devuelve el estado de la cuenta.
// Si está sancionada, el backend responde 403 { code: "BANNED", bannedUntil, ... }.
export async function fetchSession() {
  const token = getToken();

  if (!token) {
    return { ok: false, status: 401, data: null };
  }

  try {
    const response = await fetch(`${API_URL}/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      // respuesta sin cuerpo JSON
    }

    return { ok: response.ok, status: response.status, data };
  } catch {
    // Sin conexión: no se cierra la sesión por un fallo de red.
    return { ok: false, status: 0, data: null, networkError: true };
  }
}
