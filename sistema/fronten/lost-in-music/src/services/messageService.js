// Servicio HTTP de mensajeria. Usa el backend real (Express, puerto 3000).

import { API_URL } from "./http";

export { API_URL };

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

    // El cuerpo se lee como texto para distinguir "sin contenido" de una respuesta que no es
    // JSON (por ejemplo el HTML de otro servidor). Un null acá rompía la pagina de mensajes.
    const raw = await response.text().catch(() => "");
    let data = null;
    if (raw.trim()) {
        try {
            data = JSON.parse(raw);
        } catch {
            if (response.ok) {
                throw new ApiError("Respuesta inválida del servidor", response.status);
            }
        }
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

// DELETE /conversations/:otherUserId
// Elimina la conversacion SOLO para el usuario autenticado: su copia desaparece de la
// lista y de su historial, pero el otro participante conserva todos sus mensajes.
export const deleteConversation = (otherUserId) =>
    request(`/conversations/${otherUserId}`, { method: "DELETE" });
// GET /users/:id (GetUserProfile) responde { user: {...} }: se devuelve el usuario plano
// para que la mensajeria use username/profilePhoto directo (antes llegaba envuelto y el
// avatar quedaba en "?" sin foto).
export const getUser = async (userId) => {
    const data = await request(`/users/${encodeURIComponent(userId)}`);
    return data?.user || data;
};
export const markAsRead = (otherUserId) =>
    request(`/messages/read/${otherUserId}`, { method: "PUT" });

// Valores que el backend usa para "sin foto". Si se pasan tal cual al <img> el navegador
// pide http://localhost:3000/vacio y deja la imagen rota.
const EMPTY_MEDIA = new Set(["", "vacio", "null", "undefined", "-"]);

const cleanMediaValue = (url) => {
    if (typeof url !== "string") return null;
    const value = url.trim();
    if (!value || EMPTY_MEDIA.has(value.toLowerCase())) return null;
    return value;
};

// fileUrl / profilePhoto pueden ser una URL absoluta o una ruta relativa al backend.
export function resolveFileUrl(url) {
    const value = cleanMediaValue(url);
    if (!value) return null;
    if (/^(https?:|data:|blob:)/i.test(value)) return value;

    // Algunas rutas viejas guardadas en Windows vienen con backslashes.
    const path = value.replace(/\\/g, "/");
    return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

// Las fotos se guardan de tres formas segun la epoca: data URL (base64 con prefijo),
// ruta del backend (/uploads/archivo.jpg) o base64 pelado sin el prefijo `data:`.
// Devuelve siempre algo que el navegador pueda mostrar, o null si no hay foto.
const BASE64_BODY = /^[A-Za-z0-9+/]+={0,2}$/;

const sniffImageMime = (base64) => {
    if (base64.startsWith("iVBORw0KGgo")) return "image/png";
    if (base64.startsWith("R0lGOD")) return "image/gif";
    if (base64.startsWith("UklGR")) return "image/webp";
    return "image/jpeg";
};

// Ruta absoluta de Windows (C:/Users/.../uploads/foto.jpg) -> /uploads/foto.jpg
const toServerPath = (value) => {
    const path = value.replace(/\\/g, "/");
    const uploadsAt = path.toLowerCase().lastIndexOf("/uploads/");
    if (uploadsAt !== -1) return path.slice(uploadsAt);
    return path;
};

export function resolveImageUrl(url) {
    const value = cleanMediaValue(url);
    if (!value) return null;

    if (/^data:image\//i.test(value)) return value;
    if (/^(https?:|blob:)/i.test(value)) return value;

    // base64 sin prefijo (cuentas viejas): se arma el data URL para que se vea la foto.
    const base64 = value.replace(/\s+/g, "");
    if (base64.length > 64 && BASE64_BODY.test(base64)) {
        return `data:${sniffImageMime(base64)};base64,${base64}`;
    }

    return resolveFileUrl(toServerPath(value));
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
