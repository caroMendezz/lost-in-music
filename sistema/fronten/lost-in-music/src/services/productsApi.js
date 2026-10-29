// Servicio de Shop in vivo: publicaciones conectadas al backend real
// (controllers/products.js + models/Product.js).
import {
    API_URL,
    getCurrentUserId,
    getToken,
    resolveFileUrl,
    uploadFile
} from "./messageService";

// El modelo Product guarda varios campos como array; se normaliza para la UI.
const firstValue = (value) => (Array.isArray(value) ? value[0] : value);
const toArray = (value) => {
    if (value === undefined || value === null || value === "") return [];
    return Array.isArray(value) ? value : [value];
};

// Categorías del modelo (enum) en función de la subcategoría elegida en el modal.
const CATEGORY_BY_ITEM = {
    cuerda: "Cuerda",
    viento: "Viento",
    percusion: "Percusion",
    electronicos: "Electronicos",
    cables: "Complementos",
    fundas: "Complementos",
    repuestos: "Complementos"
};

// La grilla solo admite los iconos que ya usa la tienda.
const ICON_BY_CATEGORY = {
    Cuerda: { icon: "Guitar", tone: ["#8a5a3a", "#c9905c"] },
    Viento: { icon: "Mic2", tone: ["#5c6570", "#9aa4ad"] },
    Percusion: { icon: "Piano", tone: ["#e0824a", "#f7c08e"] },
    Electronicos: { icon: "Speaker", tone: ["#3fb6c9", "#a4ecf2"] },
    Complementos: { icon: "Headphones", tone: ["#7fc24c", "#c9f7a0"] }
};

const normalize = (text) =>
    String(text || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

// "Percusión" -> "Percusion", "Cables" -> "Complementos", "" -> "Complementos"
export function mapCategory(item) {
    return CATEGORY_BY_ITEM[normalize(item)] || "Complementos";
}

// "Nuevo" -> "Nuevo"; "Usado - Como nuevo" -> "Usado" (enum del modelo)
export function mapCondition(condition) {
    return normalize(condition).startsWith("usado") ? "Usado" : "Nuevo";
}

// 100000 -> "$100.000"; si el precio no es numérico se respeta el texto original
export function formatPrice(price) {
    const amount = Number(price);
    if (price === undefined || price === null || price === "") return "Precio a convenir";
    return Number.isFinite(amount)
        ? `$${new Intl.NumberFormat("es-AR").format(amount)}`
        : String(price);
}

// Convierte una publicación del backend en el producto que esperan
// ProductCard y ProductModal (name, price, images, seller, postedAt, ...).
export function mapProduct(product) {
    const category = firstValue(product.category) || null;
    const style = ICON_BY_CATEGORY[category] || ICON_BY_CATEGORY.Complementos;
    const seller = product.seller;

    return {
        id: product._id || product.id,
        name: product.title || "Publicación sin título",
        price: formatPrice(firstValue(product.price)),
        rawPrice: firstValue(product.price),
        place: toArray(product.location).filter(Boolean).join(", "),
        images: toArray(product.image).filter(Boolean).map(resolveFileUrl),
        state: firstValue(product.condition) || "",
        category,
        subcategory: firstValue(product.subcategory) || "",
        description: toArray(product.description).filter(Boolean).join("\n\n"),
        seller: seller
            ? {
                name: seller.username || "Vendedor",
                avatar: resolveFileUrl(seller.profilePhoto),
                userId: seller.userId
            }
            : "Vendedor",
        postedAt: product.createdAt,
        icon: style.icon,
        tone: style.tone
    };
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
        const error = new Error(data?.message || "Error en la solicitud");
        error.status = response.status;
        throw error;
    }

    return data;
}

// GET /GetProduct -> publicaciones activas, de la más nueva a la más vieja
export const getProducts = () =>
    request("/GetProduct").then((data) => (Array.isArray(data) ? data.map(mapProduct) : []));

// Sube las fotos elegidas (POST /Upload) y devuelve sus rutas para guardarlas
export async function uploadProductImages(files) {
    const urls = [];
    for (const file of files) {
        const uploaded = await uploadFile(file);
        urls.push(uploaded.fileUrl);
    }
    return urls;
}

// POST /CreateProduct. El dueño lo toma el backend del token; se manda igual
// por compatibilidad con el controlador.
export async function createProduct({
    title,
    images,
    description,
    category,
    subcategory,
    condition,
    price,
    location
}) {
    const payload = await request("/CreateProduct", {
        method: "POST",
        body: JSON.stringify({
            userId: getCurrentUserId(),
            title,
            image: images,
            description,
            category: mapCategory(subcategory || category),
            subcategory: subcategory || "",
            condition: mapCondition(condition),
            price: String(price),
            location
        })
    });

    return mapProduct(payload);
}