import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X, User } from "lucide-react";
import aero from "../../styles/aero.module.css";

function formatPostedAt(iso) {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();

  // Pasadas las 24 horas se muestra la fecha en lugar del tiempo relativo.
  if (diff >= 24 * 60 * 60 * 1000) {
    return `Publicado el ${date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })}`;
  }

  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 1) {
    const minutes = Math.max(1, Math.floor(diff / (60 * 1000)));
    return `Publicado hace ${minutes} minuto${minutes === 1 ? "" : "s"}`;
  }
  return `Publicado hace ${hours} hora${hours === 1 ? "" : "s"}`;
}

async function copyLink(product) {
  const url = `${window.location.origin}/producto/${product.id}`;

  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // Fallback para contextos sin Clipboard API.
    const area = document.createElement("textarea");
    area.value = url;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    document.body.removeChild(area);
  }

  alert("Se copio link de la publicacion");
}

export default function ProductModal({ product, onClose }) {
  const [expanded, setExpanded] = useState(false);
  const [isLong, setIsLong] = useState(false);
  const [active, setActive] = useState(0);
  const descRef = useRef(null);

  const images = product.images || [];

  useLayoutEffect(() => {
    const el = descRef.current;
    if (!el || expanded) return;
    setIsLong(el.scrollHeight - el.clientHeight > 4);
  }, [expanded, product.id]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const photo = images[active];

  return (
    <div className={aero["modal-backdrop"]} onClick={onClose} role="presentation">
      <div
        className={aero["modal-box"]}
        role="dialog"
        aria-modal="true"
        aria-label="Detalles del producto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={aero["modal-head"]}>
          <span className={aero["modal-head-title"]}>Detalles del producto</span>
          <button
            type="button"
            className={aero["modal-close"]}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className={aero["modal-body"]}>
          {/* Columna de la foto: queda quieta, nunca se desplaza. */}
          <div className={aero["modal-media"]}>
            <div className={aero["modal-photo"]}>
              {photo ? (
                <img src={photo} alt={product.name} />
              ) : (
                <span className={aero["modal-photo-empty"]}>Sin foto</span>
              )}
            </div>

            {images.length > 1 && (
              <div className={aero["modal-thumbs"]}>
                {images.map((src, i) => (
                  <button
                    type="button"
                    key={`${src}-${i}`}
                    className={`${aero["modal-thumb"]}${i === active ? ` ${aero["is-active"]}` : ""}`}
                    onClick={() => setActive(i)}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Columna de la info: la unica que se desplaza hacia abajo. */}
          <div className={aero["modal-scroll"]}>
            <h2 className={aero["modal-title"]}>{product.name}</h2>
            <span className={aero["modal-price"]}>{product.price}</span>
            <p className={aero["modal-posted"]}>{formatPostedAt(product.postedAt)}</p>

            <section className={aero["modal-section"]}>
              <div className={aero["modal-section-title"]}>Detalles</div>
              <p className={aero["modal-detail"]}>• Estado: {product.state}</p>
            </section>

            <section className={aero["modal-section"]}>
              <div className={aero["modal-section-title"]}>Descripción</div>
              <p
                ref={descRef}
                className={`${aero["modal-desc"]}${expanded ? "" : ` ${aero["is-clamped"]}`}`}
              >
                {product.description}
              </p>
              {isLong && !expanded && (
                <button
                  type="button"
                  className={aero["modal-more"]}
                  onClick={() => setExpanded(true)}
                >
                  Leer más
                </button>
              )}
            </section>

            <section className={aero["modal-section"]}>
              <div className={aero["modal-section-title"]}>Información del vendedor</div>
              <div className={aero["modal-seller"]}>
                <span className={aero["modal-seller-avatar"]}>
                  <User size={18} />
                </span>
                <button
                  type="button"
                  className={aero["modal-seller-name"]}
                  onClick={() => alert("redirigiendo al perfil del usuario")}
                >
                  {product.seller}
                </button>
              </div>
            </section>

            <div className={aero["modal-actions"]}>
              <button
                type="button"
                className={`${aero["modal-btn"]} ${aero["modal-btn-message"]}`}
                onClick={() => alert("redirigiendo a mensajes")}
              >
                Enviar Mensaje
              </button>
              <button
                type="button"
                className={`${aero["modal-btn"]} ${aero["modal-btn-buy"]}`}
              >
                Comprar Ahora
              </button>
              <button
                type="button"
                className={`${aero["modal-btn"]} ${aero["modal-btn-link"]}`}
                onClick={() => copyLink(product)}
              >
                Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}