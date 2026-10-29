import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  Check,
  ChevronDown,
  ImagePlus,
  MapPin,
  UserRound,
  X,
} from "lucide-react";
import { CATEGORIES } from "../../data/categories";
import { createProduct, uploadProductImages } from "../../services/productsApi";
import aero from "../../styles/aero.module.css";

const CONDITIONS = ["Nuevo", "Usado - Como nuevo", "Usado - Buen Estado", "Usado - Aceptable"];
const AVAILABILITIES = ["Publicar como artículo único", "Publicar como disponible"];
const MAX_IMAGES = 10;

const formatPrice = (value) => {
  const amount = Number(value);
  return value && Number.isFinite(amount)
    ? `$${new Intl.NumberFormat("es-AR").format(amount)}`
    : "Precio";
};

export default function UploadProductModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "",
    subcategory: "",
    condition: "",
    description: "",
    availability: AVAILABILITIES[1],
    neighborhood: "",
    publicMeeting: false,
    homeDelivery: false,
  });
  const [photos, setPhotos] = useState([]);
  const photosRef = useRef([]);
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
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url));
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
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setNotice("");
    setError("");
  };

  const addPhotos = (files) => {
    const remaining = MAX_IMAGES - photos.length;
    if (remaining <= 0 || !files?.length) return;
    const selected = [...files]
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, remaining)
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPhotos((current) => {
      const next = [...current, ...selected];
      photosRef.current = next;
      return next;
    });
    if (files.length > remaining) setNotice("Podés agregar un máximo de 10 fotos.");
  };

  const removePhoto = (index) => {
    setPhotos((current) => {
      const removed = current[index];
      if (removed) URL.revokeObjectURL(removed.url);
      const next = current.filter((_, photoIndex) => photoIndex !== index);
      photosRef.current = next;
      return next;
    });
  };

  const onDrop = (event) => {
    event.preventDefault();
    addPhotos(event.dataTransfer.files);
  };

  // Sube las fotos y crea la publicación en el backend (POST /CreateProduct)
  const onSubmit = async (event) => {
    event.preventDefault();
    if (sending) return;

    setNotice("");
    setError("");
    setSending(true);

    try {
      const images = await uploadProductImages(photos.map((photo) => photo.file));

      const created = await createProduct({
        title: form.title,
        images,
        description: form.description,
        category: form.category,
        subcategory: form.subcategory,
        condition: form.condition,
        price: form.price,
        location: form.neighborhood,
      });

      setNotice("Publicación creada correctamente.");
      onCreated?.(created);
      onClose();
    } catch (submitError) {
      setError(submitError.message || "No se pudo publicar el producto.");
    } finally {
      setSending(false);
    }
  };

  return createPortal((
    <div className={aero["upload-backdrop"]} role="presentation">
      <section className={aero["upload-window"]} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className={aero["upload-header"]}>
          <span id={titleId}>Publicar producto</span>
          <button type="button" className={aero["upload-close"]} onClick={onClose} aria-label="Cerrar publicación">
            <X size={22} />
          </button>
        </header>

        <div className={aero["upload-columns"]}>
          <form className={aero["upload-form-scroll"]} onSubmit={onSubmit}>
            <section className={aero["upload-section"]}>
              <h2>Imagen del producto</h2>
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
                  <div className={aero["upload-photo-thumb"]} key={photo.url}>
                    <img src={photo.url} alt={`Foto ${index + 1}`} />
                    <button type="button" onClick={() => removePhoto(index)} aria-label={`Quitar foto ${index + 1}`}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
                <span className={aero["upload-photo-count"]}><strong>Fotos - {photos.length}/10</strong> - Podés agregar un máximo de 10 fotos</span>
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
              }} required>
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
              <div className={aero["upload-heading-row"]}>
                <div><h2>Más detalles</h2><p>Agrega otros detalles para generar mayor interés.</p></div>
                <ChevronDown size={18} />
              </div>
              <label className={aero["upload-label"]} htmlFor={descriptionId}>Descripción</label>
              <textarea id={descriptionId} name="description" value={form.description} onChange={updateField} placeholder="Descripción" rows={5} maxLength={2000} />
              <label className={aero["upload-label"]} htmlFor={`${titleId}-availability`}>Disponibilidad</label>
              <select id={`${titleId}-availability`} name="availability" value={form.availability} onChange={updateField}>
                {AVAILABILITIES.map((availability) => <option key={availability}>{availability}</option>)}
              </select>
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

            <section className={aero["upload-section"]}>
              <h2>Preferencias de entrega</h2>
              <p>Los compradores podrán visualizar tus preferencias en la publicación.</p>
              <label className={aero["upload-check"]}><UserRound size={20} /> Encuentro en un lugar público<input type="checkbox" name="publicMeeting" checked={form.publicMeeting} onChange={updateField} /></label>
              <label className={aero["upload-check"]}><MapPin size={20} /> Entrega en el domicilio<input type="checkbox" name="homeDelivery" checked={form.homeDelivery} onChange={updateField} /></label>
            </section>

            <footer className={aero["upload-submit-area"]}>
              {error && <span role="alert" className={aero["upload-error"]}>{error}</span>}
              {notice && !error && <span role="status">{notice}</span>}
              <button type="submit" className={aero["upload-submit"]} disabled={sending}>
                <Check size={16} /> {sending ? "Publicando..." : "Publicar"}
              </button>
            </footer>
          </form>

          <aside className={aero["upload-preview-column"]} aria-label="Previsualización del producto">
            <div className={aero["upload-preview-card"]}>
              <h2>Vista previa</h2>
              <div className={aero["upload-preview-content"]}>
                <div className={aero["upload-preview-gallery"]}>
                  {photos.length ? <img className={aero["upload-preview-main-image"]} src={photos[0].url} alt={form.title || "Imagen de vista previa"} /> : (
                    <div className={aero["upload-preview-empty"]}><Camera size={34} /><span>La foto del producto aparecerá aquí</span></div>
                  )}
                  {photos.length > 0 && <div className={aero["upload-preview-thumbs"]}>{photos.slice(0, 5).map((photo, index) => <img src={photo.url} alt={`Miniatura ${index + 1}`} key={photo.url} />)}</div>}
                </div>
                <div className={aero["upload-preview-info"]}>
                  <h3>{form.title || "Título"}</h3>
                  <strong className={aero["upload-preview-price"]}>{formatPrice(form.price)}</strong>
                  <small>Publicado hace x horas</small>
                  <section><h4>Detalles</h4><span>• Estado: {form.condition || "x"}</span><span>• {form.neighborhood || "Ubicación"}</span></section>
                  <section className={aero["upload-preview-description"]}><h4>Descripción</h4><p>{form.description || "..."}</p></section>
                  <section className={aero["upload-preview-seller"]}><UserRound size={24} /><span><strong>Información del vendedor</strong><small>Carolina Méndez</small></span></section>
                  <button type="button" className={aero["upload-preview-message"]}>Enviar Mensaje</button>
                  <button type="button" className={aero["upload-preview-buy"]}>Comprar Ahora</button>
                  <button type="button" className={aero["upload-preview-link"]}>Link</button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  ), document.body);
}
