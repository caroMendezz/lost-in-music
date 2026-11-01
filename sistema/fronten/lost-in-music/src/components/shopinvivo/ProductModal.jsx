import React, { useEffect, useId, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, MapPin } from "lucide-react";
import aero from "../../styles/aero.module.css";
import ProductGallery from "./ProductGallery";
import ExpandableText from "./ExpandableText";
import SellerPopover from "./SellerPopover";
import Toast from "./Toast";
import { useToast } from "./useToast";
import { copyToClipboard, formatPostedAt, getProductUrl } from "./productUtils";
import { getCurrentUserId } from "../../services/messageService";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Ventana de detalle de un producto de Shop in vivo.
 *   Izquierda: galeria (queda quieta).
 *   Derecha:   informacion, vendedor y acciones (unica columna con scroll).
 *
 * ProductGrid la monta con key={product.id}: al abrir otro producto todo el
 * estado interno (imagen activa, "Leer más", popover, aviso) arranca de cero.
 */
export default function ProductModal({ product, onClose }) {
  const { toast, showToast } = useToast();
  const boxRef = useRef(null);
  const closeRef = useRef(null);
  const pressStartedOnBackdrop = useRef(false);
  const titleId = useId();
  const navigate = useNavigate();

  // El backend entrega el vendedor poblado ({ userId, username, profilePhoto });
  // las publicaciones viejas pueden traerlo como texto plano.
  const sellerId =
    typeof product.seller === "object" && product.seller ? product.seller.userId : null;

  // Usuario logueado (id del JWT): sirve para impedir que te escribas a vos mismo.
  // El backend devuelve userId numerico, por eso la comparacion se hace con Number().
  const currentUserId = getCurrentUserId();
  const isOwnProduct =
    sellerId != null && currentUserId != null && Number(sellerId) === Number(currentUserId);

  // Mientras el modal esta abierto la pagina de atras no se desplaza; al
  // cerrarlo se restaura el valor anterior y el foco vuelve a la tarjeta.
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Tab y Shift+Tab no se escapan del modal
  const trapFocus = (e) => {
    if (e.key !== "Tab") return;
    const items = [...boxRef.current.querySelectorAll(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Solo cierra si el clic empezo y termino en el fondo (no al soltar una
  // seleccion de texto que empezo adentro de la ventana)
  const onBackdropPointerDown = (e) => {
    pressStartedOnBackdrop.current = e.target === e.currentTarget;
  };
  const onBackdropClick = (e) => {
    if (pressStartedOnBackdrop.current && e.target === e.currentTarget) onClose();
  };

  // Sin vendedor asociado no hay a quien escribir ni a quien ver.
  const missingSeller = () =>
    showToast("Esta publicación no tiene un vendedor asociado.", "error");

  // Abre el chat con el vendedor en la pagina de mensajes.
  // Si la publicación es tuya no se navega: un usuario no puede enviarse mensajes a si mismo.
  const goToMessages = () => {
    if (!sellerId) return missingSeller();
    if (isOwnProduct) {
      return showToast("No puedes enviarte un mensaje a ti mismo.", "error");
    }
    navigate(`/messages?user=${encodeURIComponent(sellerId)}`);
  };

  // Perfil publico del vendedor (route /perfil/:userId de main.jsx).
  const goToProfile = () => {
    if (!sellerId) return missingSeller();
    navigate(`/perfil/${encodeURIComponent(sellerId)}`);
  };

  const copyLink = async () => {
    const url = getProductUrl(product.id);
    try {
      await copyToClipboard(url);
      showToast("Enlace de la publicación copiado", "success");
    } catch {
      showToast("No se pudo copiar el enlace. Intentá de nuevo.", "error");
    }
  };

  return (
    <div
      className={aero["modal-backdrop"]}
      onPointerDown={onBackdropPointerDown}
      onClick={onBackdropClick}
      role="presentation"
    >
      <div
        ref={boxRef}
        className={aero["modal-box"]}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={trapFocus}
      >
        <div className={aero["modal-head"]}>
          <span className={aero["modal-head-title"]}>Detalles del producto</span>
          <button
            ref={closeRef}
            type="button"
            className={aero["modal-close"]}
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className={aero["modal-body"]}>
          {/* Columna de la galeria: queda quieta, nunca se desplaza. */}
          <div className={aero["modal-media"]}>
            <ProductGallery images={product.images} title={product.name} />
          </div>

          {/* Columna de la info: la unica que se desplaza hacia abajo. */}
          <div className={aero["modal-scroll"]}>
            <h2 id={titleId} className={aero["modal-title"]}>{product.name}</h2>
            <span className={aero["modal-price"]}>{product.price}</span>
            <p className={aero["modal-posted"]}>{formatPostedAt(product.postedAt)}</p>

            <section className={aero["modal-section"]}>
              <h3 className={aero["modal-section-title"]}>Detalles</h3>
              <ul className={aero["modal-details"]}>
                <li>
                  <span className={aero["modal-detail-bullet"]} aria-hidden="true">•</span>
                  <span>
                    <strong>Estado:</strong> {product.state || "Sin especificar"}
                  </span>
                </li>
                <li>
                  <span className={aero["modal-detail-bullet"]} aria-hidden="true">•</span>
                  <span>
                    <MapPin size={13} className={aero["modal-detail-icon"]} aria-hidden="true" />
                    <span className={aero["sr-only"]}>Dirección: </span>
                    {product.place || "Sin especificar"}
                  </span>
                </li>
              </ul>
            </section>

            <section className={aero["modal-section"]}>
              <h3 className={aero["modal-section-title"]}>Descripción</h3>
              <ExpandableText text={product.description} />
            </section>

            <section className={aero["modal-section"]}>
              <SellerPopover
                seller={product.seller}
                onMessage={goToMessages}
                onViewProfile={goToProfile}
              />
            </section>

            <div className={aero["modal-actions"]}>
              <button
                type="button"
                className={`${aero["modal-btn"]} ${aero["modal-btn-message"]}`}
                onClick={goToMessages}
                aria-disabled={isOwnProduct || undefined}
                title={isOwnProduct ? "No puedes enviarte un mensaje a ti mismo" : undefined}
              >
                Enviar mensaje
              </button>
              <button
                type="button"
                className={`${aero["modal-btn"]} ${aero["modal-btn-link"]}`}
                onClick={copyLink}
              >
                Link
              </button>
            </div>
          </div>
        </div>

        <Toast toast={toast} />
      </div>
    </div>
  );
}
