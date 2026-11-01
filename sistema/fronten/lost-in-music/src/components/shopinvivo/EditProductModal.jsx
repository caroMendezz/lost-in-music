import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  Check,
  ImagePlus,
  MapPin,
  UserRound,
  X,
} from "lucide-react";
import { CATEGORIES } from "../../data/categories";
import { resolveFileUrl } from "../../services/messageService";
import { updateProduct, uploadProductImages } from "../../services/productsApi";
import aero from "../../styles/aero.module.css";

// El modelo solo guarda "Nuevo" o "Usado"; las variantes de usado se ofrecen
// para que el vendedor pueda precisar el estado al editar.
const CONDITIONS = [
  "Nuevo",
  "Usado",
  "Usado - Como nuevo",
  "Usado - Buen Estado",
  "Usado - Aceptable",
];
const MAX_IMAGES = 10;

const formatPrice = (value) => {
  const amount = Number(value);
  return value !== "" && Number.isFinite(amount)
    ? `$${new Intl.NumberFormat("es-AR").format(amount)}`
    : "Precio";
};

// Grupo del selector ("Instrumentos" / "Accesorios") al que pertenece la
// publicación, a partir de su subcategoría o de la categoría del backend.
const groupForProduct = (product) => {
  const item = product.subcategory || product.category;
  const group = CATEGORIES.find(
    (category) => category.label === item || category.items.includes(item)
  );
  // "Complementos" agrupa cables, fundas y repuestos, que en el formulario
  // viven dentro de "Accesorios".
  if (!group && product.category === "Complementos") return "Accesorios";
  return group?.label || "";
};

/**
 * Edición de una publicación propia de Shop in vivo.
 * Permite cambiar título, precio, categoría, subcategoría, estado, descripción,
 * localidad y fotos (agregar nuevas o quitar las que ya estaban).
 */
export default function EditProductModal({ product, onClose, onUpdated }) {
  const [form, setForm] = useState(() => ({
    title: product.name === "Publicación sin título" ? "" : product.name,
    price: product.rawPrice ?? "",
    category: groupForProduct(product),
    subcategory: product.subcategory || "",
    condition: CONDITIONS.includes(product.state) ? product.state : "Nuevo",
    description: product.description || "",
    neighborhood: product.place || "",
  }));

  // Cada foto guarda la ruta vieja (url) o el archivo nuevo (file) + su preview.
  const [photos, setPhotos] = useState(() =>
    (product.rawImages || []).map((url, index) => ({
      key: `guardada-${index}-${url}`,
      url,
      preview: resolveFileUrl(url),
    }))
  );
  const photosRef = useRef(photos);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  const category = CATEGORIES.find((item) => item.label === form.category);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      photosRef.current.forEach((photo) => {
        if (photo.file) URL.revokeObjectURL(photo.preview);
      });
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setNotice("");
    setError("");
  };

  const addPhotos = (files) => {
    const remaining = MAX_IMAGES - photos.length;
    if (remaining <= 0 || !files?.length) return;
    const selected = [...files]
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remaining)
      .map((file) => ({
        key: `nueva-${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
      }));
    setPhotos((current) => {
      const next = [...current, ...selected];
      photosRef.current = next;
      return next;
    });
    if (files.length > remaining) setNotice("Podés tener un máximo de 10 fotos.");
  };

  const removePhoto = (index) => {
    setPhotos((current) => {
      const removed = current[index];
      if (removed?.file) URL.revokeObjectURL(removed.preview);
      const next = current.filter((_, photoIndex) => photoIndex !== index);
      photosRef.current = next;
      return next;
    });
    setNotice("");
    setError("");
  };

  const onDrop = (event) => {
    event.preventDefault();
    addPhotos(event.dataTransfer.files);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (sending) return;

    setNotice("");
    setError("");

    if (photos.length === 0) {
      setError("La publicación necesita al menos una foto.");
      return;
    }

    setSending(true);

    try {
      // Solo se suben las fotos nuevas; las que ya estaban conservan su ruta.
      const newPhotos = photos.filter((photo) => photo.file);
      const uploadedUrls = await uploadProductImages(newPhotos.map((photo) => photo.file));
      let uploadedIndex = 0;
      const images = photos.map((photo) => {
        if (!photo.file) return photo.url;
        const url = uploadedUrls[uploadedIndex];
        uploadedIndex += 1;
        return url;
      });

      const updated = await updateProduct({
        id: product.id,
        title: form.title,
        images,
        description: form.description,
        subcategory: form.subcategory,
        condition: form.condition,
        price: form.price,
        location: form.neighborhood,
        fallbackCategory: product.category,
        fallbackSubcategory: product.subcategory,
      });

      setNotice("Publicación actualizada correctamente.");
      onUpdated?.(updated);
      onClose();
    } catch (submitError) {
      setError(submitError.message || "No se pudo actualizar la publicación.");
    } finally {
      setSending(false);
    }
  };

  return createPortal((
    <div className={aero["upload-backdrop"]} role="presentation">
      <section className={aero["upload-window"]} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className={aero["upload-header"]}>
          <span id={titleId}>Editar publicación</span>
          <button type="button" className={aero["upload-close"]} onClick={onClose} aria-label="Cerrar edición">
            <X size={22} />
          </button>
        </header>

        <div className={aero["upload-columns"]}>
          <form className={aero["upload-form-scroll"]} onSubmit={onSubmit}>
            <section className={aero["upload-section"]}>
              <h2>Fotos del producto</h2>
              <div className={aero["upload-photo-controls"]}>
                <button
                  type="button"
                  className={aero["upload-dropzone"]}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={onDrop}
                >
                  <span className={aero["upload-camera"]}><Camera size={25} /></span>
                  <strong>Haz click o arrastrar imagen</strong>
                </button>
                <button
                  type="button"
                  className={aero["upload-add-photo"]}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photos.length >= MAX_IMAGES}
                >
                  <ImagePlus size={30} />
                  <span>Agregar Foto</span>
                </button>
              </div>
              <input
                ref={fileInputRef}
                className={aero["upload-file-input"]}
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  addPhotos(event.target.files);
                  event.target.value = "";
                }}
              />
              <div className={aero["upload-photo-strip"]}>
                {photos.map((photo, index) => (
                  <div className={aero["upload-photo-thumb"]} key={photo.key}>
                    <img src={photo.preview} alt={`Foto ${index + 1}`} />
                    <button type="button" onClick={() => removePhoto(index)} aria-label={`Quitar foto ${index + 1}`}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
                <span className={aero["upload-photo-count"]}>
                  <strong>Fotos - {photos.length}/10</strong> - Podés tener un máximo de 10 fotos
                </span>
              </div>
            </section>

            <section className={aero["upload-section"]}>
              <h2>Obligatorio</h2>
              <p>Ofrece una descripción lo más detallada posible.</p>
              <label className={aero["upload-label"]} htmlFor={`${titleId}-title`}>Título</label>
              <input id={`${titleId}-title`} name="title" value={form.title} onChange={updateField} placeholder="Título" maxLength={80} required />
              <label className={aero["upload-label"]} htmlFor={`${titleId}-price`}>Precio</label>
              <div className={aero["upload-price-field"]}>
                <span>$</span>
                <input id={`${titleId}-price`} name="price" type="number" min="1" step="1" value={form.price} onChange={updateField} placeholder="Precio" required />
              </div>
              <label className={aero["upload-label"]} htmlFor={`${titleId}-category`}>Categoría</label>
              <select id={`${titleId}-category`} name="category" value={form.category} onChange={(event) => {
                updateField(event);
                setForm((current) => ({ ...current, subcategory: "" }));
              }}>
                <option value="">Categoría</option>
                {CATEGORIES.map((item) => <option key={item.label}>{item.label}</option>)}
              </select>
              {category && (
                <select name="subcategory" value={form.subcategory} onChange={updateField} aria-label="Subcategoría" required>
                  <option value="">Subcategoría</option>
                  {category.items.map((item) => <option key={item}>{item}</option>)}
                </select>
              )}
              <label className={aero["upload-label"]} htmlFor={`${titleId}-condition`}>Estado</label>
              <select id={`${titleId}-condition`} name="condition" value={form.condition} onChange={updateField} required>
                <option value="">Estado</option>
                {CONDITIONS.map((condition) => <option key={condition}>{condition}</option>)}
              </select>
            </section>

            <section className={aero["upload-section"]}>
              <h2>Más detalles</h2>
              <label className={aero["upload-label"]} htmlFor={descriptionId}>Descripción</label>
              <textarea id={descriptionId} name="description" value={form.description} onChange={updateField} placeholder="Descripción" rows={5} maxLength={2000} />
              <section className={aero["upload-location"]}>
                <div className={aero["upload-location-title"]}><MapPin size={19} /><span><strong>Ubicación</strong><small>Ciudad Autónoma de Buenos Aires</small></span></div>
                <input
                  name="neighborhood"
                  value={form.neighborhood}
                  onChange={updateField}
                  placeholder="Escribí el barrio o la zona"
                  aria-label="Barrio o zona"
                  maxLength={80}
                />
              </section>
            </section>

            <footer className={aero["upload-submit-area"]}>
              {error && <span role="alert" className={aero["upload-error"]}>{error}</span>}
              {notice && !error && <span role="status">{notice}</span>}
              <button type="submit" className={aero["upload-submit"]} disabled={sending}>
                <Check size={16} /> {sending ? "Guardando..." : "Guardar cambios"}
              </button>
            </footer>
          </form>

          <aside className={aero["upload-preview-column"]} aria-label="Previsualización del producto">
            <div className={aero["upload-preview-card"]}>
              <h2>Vista previa</h2>
              <div className={aero["upload-preview-content"]}>
                <div className={aero["upload-preview-gallery"]}>
                  {photos.length ? <img className={aero["upload-preview-main-image"]} src={photos[0].preview} alt={form.title || "Imagen de vista previa"} /> : (
                    <div className={aero["upload-preview-empty"]}><Camera size={34} /><span>La foto del producto aparecerá aquí</span></div>
                  )}
                  {photos.length > 1 && (
                    <div className={aero["upload-preview-thumbs"]}>
                      {photos.slice(1, 6).map((photo) => <img src={photo.preview} alt="Miniatura" key={photo.key} />)}
                    </div>
                  )}
                </div>
                <div className={aero["upload-preview-info"]}>
                  <h3>{form.title || "Título"}</h3>
                  <strong className={aero["upload-preview-price"]}>{formatPrice(form.price)}</strong>
                  <small>Publicación editada</small>
                  <section><h4>Detalles</h4><span>• Estado: {form.condition || "x"}</span><span>• {form.neighborhood || "Ubicación"}</span></section>
                  <section className={aero["upload-preview-description"]}><h4>Descripción</h4><p>{form.description || "..."}</p></section>
                  <section className={aero["upload-preview-seller"]}>
                    <UserRound size={24} />
                    <span>
                      <strong>Información del vendedor</strong>
                      <small>{typeof product.seller === "object" && product.seller ? product.seller.name : "Vos"}</small>
                    </span>
                  </section>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  ), document.body);
}
