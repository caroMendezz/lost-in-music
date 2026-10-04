// Servicio HTTP de mensajeria. Usa el backend real (Express, puerto 3000).

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// AJUSTAR: clave con la que tu login guarda el JWT en localStorage.
const TOKEN_KEY = "token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

// El JWT del backend tiene el payload { userId, iat, exp }.
// Se decodifica solo para conocer el usuario autenticado (la verificacion real la hace el backend).
export function getCurrentUserId() {
    const token = getToken();
    if (!token) return null;

    try {
        const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        const payload = JSON.parse(json);

        if (payload.exp && payload.exp * 1000 < Date.now()) return null;
        return Number(payload.userId);
    } catch {
        return null;
    }
}

export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

async function request(path, options = {}) {
    const token = getToken();

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers
        }
    });

    let data = null;
    try {
        data = await response.json();
    } catch {
        // respuesta sin cuerpo JSON
    }

    if (!response.ok) {
        throw new ApiError(data?.message || "Error en la solicitud", response.status);
    }

    return data;
}

// Existente: GET /messages/:otherUserId
export const getMessages = (otherUserId) => request(`/messages/${otherUserId}`);

// Nuevos (ver backend/controllers/messages.js)
export const getConversations = () => request("/conversations");
export const getUser = (userId) => request(`/users/${userId}`);
export const markAsRead = (otherUserId) =>
    request(`/messages/read/${otherUserId}`, { method: "PUT" });

// fileUrl / profilePhoto pueden ser una URL absoluta o una ruta relativa al backend.
export function resolveFileUrl(url) {
    if (!url) return null;
    if (/^(https?:|data:|blob:)/i.test(url)) return url;
    return `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

// Nuevo: GET /users/search?q=
export const searchUsers = (query) => request(`/users/search?q=${encodeURIComponent(query)}`);

// Existente: POST /Upload (multipart, campo "file"). Devuelve
// { originalName, fileName, fileUrl, mimeType, size }
export async function uploadFile(file) {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/Upload`, {
        method: "POST",
        // sin Content-Type: el navegador define el boundary del multipart
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
    });

    let data = null;
    try {
        data = await response.json();
    } catch {
        // respuesta sin cuerpo JSON
    }

    if (!response.ok) {
        throw new ApiError(data?.message || "No se pudo subir el archivo", response.status);
    }

    return data.file;
}
