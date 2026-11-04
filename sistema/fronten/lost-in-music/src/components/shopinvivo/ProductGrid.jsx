import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Headphones, Guitar, Mic2, Piano, Search, Speaker, X } from "lucide-react";
import GlassPanel from "./GlassPanel";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import Toast from "./Toast";
import { useToast } from "./useToast";
import { getProducts, mapCategory } from "../../services/productsApi";
import { CATEGORIES } from "../../data/categories";
import aero from "../../styles/aero.module.css";

// Iconos de respaldo cuando la publicación no tiene fotos
const ICONS = { Guitar, Mic2, Piano, Speaker, Headphones };

// Filas del left nav -> subcategorías que las componen
const ITEMS_BY_CATEGORY = Object.fromEntries(
  CATEGORIES.map((category) => [category.label, category.items])
);

// "Percusión" y "percusion" tienen que compararse iguales
const normalizeText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

// Filtro del left nav: { category: "Instrumentos" }, { category: "Accesorios", item: "Cables" }
// o { category: "" } para ver todo.
function matchesFilter(product, filter) {
  if (!filter?.category) return true;

  const productCategory = normalizeText(product.category);
  const productSubcategory = normalizeText(product.subcategory);

  if (filter.item) {
    const item = normalizeText(filter.item);

    // Las publicaciones nuevas guardan la subcategoría exacta.
    if (productSubcategory) return productSubcategory === item;

    // Las publicaciones viejas solo guardan la categoría del modelo.
    return productCategory === normalizeText(mapCategory(filter.item));
  }

  const items = ITEMS_BY_CATEGORY[filter.category] || [];
  return items.some((item) => {
    const normalizedItem = normalizeText(item);
    return (
      productSubcategory === normalizedItem ||
      productCategory === normalizeText(mapCategory(item))
    );
  });
}

// Busca el texto en nombre, descripción, categoría, subcategoría, estado y ubicación.
// Cada palabra del término tiene que aparecer en algún campo.
function matchesQuery(product, term) {
  if (!term) return true;

  const haystack = normalizeText(
    [
      product.name,
      product.description,
      product.category,
      product.subcategory,
      product.state,
      product.place,
    ]
      .filter(Boolean)
      .join(" ")
  );

  return term.split(/\s+/).every((word) => haystack.includes(word));
}

// refreshKey cambia cuando se publica un producto: vuelve a pedir la lista
// initialProductId abre directamente el detalle del link compartido.
export default function ProductGrid({
  refreshKey = 0,
  filter = { category: "" },
  initialProductId,
  onCloseLinkedProduct,
  onClearFilter,
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast, showToast } = useToast();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getProducts();
      setProducts(data.map((product) => ({ ...product, icon: ICONS[product.icon] || Headphones })));
    } catch (loadError) {
      setError(loadError.message || "No se pudieron cargar las publicaciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      setLoading(false);
      return;
    }
    loadProducts();
  }, [loadProducts, refreshKey]);

  // Link compartido (/producto/:id): cuando termina la carga se abre el detalle
  // de esa publicación. Si ya no existe, se avisa sin romper la grilla.
  useEffect(() => {
    if (!initialProductId || loading) return;

    const linked = products.find(
      (product) => String(product.id) === String(initialProductId)
    );

    if (linked) {
      setSelected(linked);
    } else if (!error) {
      showToast("La publicación del enlace no existe o fue eliminada.", "error");
    }
  }, [initialProductId, loading, products, error, showToast]);

  // Cerrar un detalle abierto desde un link vuelve a la grilla de Shop in vivo.
  const handleCloseProduct = useCallback(() => {
    setSelected(null);
    if (initialProductId) onCloseLinkedProduct?.();
  }, [initialProductId, onCloseLinkedProduct]);

  // Una publicación eliminada se saca de la lista apenas el backend confirma la
  // baja, así no hace falta recargar todo el catálogo.
  const handleProductDeleted = useCallback(
    (id) => {
      setProducts((current) => current.filter((product) => product.id !== id));
      setSelected(null);
      showToast("Publicación eliminada", "success");
    },
    [showToast]
  );

  // Una publicación editada vuelve mapeada desde el backend: se reemplaza en la
  // grilla y en el detalle abierto sin recargar toda la lista.
  const handleProductUpdated = useCallback((updated) => {
    const next = { ...updated, icon: ICONS[updated.icon] || Headphones };
    setProducts((current) => current.map((product) => (product.id === next.id ? next : product)));
    setSelected(next);
  }, []);

  const term = normalizeText(query);
  const filtered = useMemo(
    () =>
      products.filter(
        (product) => matchesFilter(product, filter) && matchesQuery(product, term)
      ),
    [products, filter, term]
  );

  const filterLabel = filter?.item || filter?.category || "";
  const hasFilter = Boolean(filter?.category);

  return (
    <div className={aero["main-col"]}>
      <GlassPanel className={aero["search-live"]}>
        <div className={aero["search-live-shell"]}>
          <Search size={16} color="#5b7180" />
          <input
            placeholder="Buscar en Shop in vivo"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar publicaciones"
          />
          {query && (
            <button
              type="button"
              className={aero["search-clear"]}
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {(hasFilter || (query && !loading && !error)) && (
          <div className={aero["search-status"]}>
            <span>
              {loading
                ? "Buscando..."
                : `${filtered.length} ${filtered.length === 1 ? "publicación" : "publicaciones"}`}
              {filterLabel ? ` en ${filterLabel}` : ""}
              {query ? ` para «${query}»` : ""}
            </span>
            {hasFilter && (
              <button type="button" className={aero["filter-chip"]} onClick={onClearFilter}>
                {filterLabel} <X size={12} />
              </button>
            )}
          </div>
        )}
      </GlassPanel>

      <div className={aero["products-scroll"]}>
        {loading && <p className={aero["products-status"]}>Cargando publicaciones...</p>}

        {!loading && error && (
          <p className={aero["products-status"]} role="alert">
            {error}{" "}
            <button type="button" className={aero["products-retry"]} onClick={loadProducts}>
              Reintentar
            </button>
          </p>
        )}

        {!loading && !error && products.length === 0 && (
          <p className={aero["products-status"]}>
            Todavía no hay publicaciones. Usá el botón «Subir producto» para crear la primera.
          </p>
        )}

        {!loading && !error && products.length > 0 && filtered.length === 0 && (
          <p className={aero["products-status"]}>
            No hay publicaciones que coincidan con la búsqueda.
          </p>
        )}

        <div className={aero["products-grid"]}>
          {filtered.map((product) => (
            <ProductCard product={product} key={product.id} onSelect={() => setSelected(product)} />
          ))}
        </div>
      </div>

      {selected && (
        <ProductModal
          product={selected}
          key={selected.id}
          onClose={handleCloseProduct}
          onUpdated={handleProductUpdated}
          onDeleted={handleProductDeleted}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
