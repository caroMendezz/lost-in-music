import React, { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, MapPin, Pencil, Trash2 } from "lucide-react";
import aero from "../../styles/aero.module.css";
import ProductGallery from "./ProductGallery";
import ExpandableText from "./ExpandableText";
import SellerPopover from "./SellerPopover";
import EditProductModal from "./EditProductModal";
import Toast from "./Toast";
import { useToast } from "./useToast";
import { copyToClipboard, formatPostedAt, getProductUrl } from "./productUtils";
import { getCurrentUserId } from "../../services/messageService";
import { deleteProduct } from "../../services/productsApi";

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
export default function ProductModal({ product, onClose, onUpdated, onDeleted }) {
  const { toast, showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
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

  // Con el formulario de edicion abierto, Escape lo cierra solo a el; con la
  // confirmacion de borrado abierta, Escape cancela la confirmacion.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Escape" || editing || deleting) return;
      if (confirmingDelete) {
        setConfirmingDelete(false);
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, editing, confirmingDelete, deleting]);

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

  // Baja logica de la publicacion (PATCH /DeleteProduct/:id). Al terminar se
  // avisa a la grilla para que saque la tarjeta y cierre el detalle.
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProduct(product.id);
      // La grilla saca la tarjeta, cierra el detalle y muestra el aviso.
      onDeleted?.(product.id);
      onClose();
    } catch (error) {
      showToast(error?.message || "No se pudo eliminar la publicación.", "error");
      setDeleting(false);
      setConfirmingDelete(false);
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
              {isOwnProduct ? (
                <button
                  type="button"
                  className={`${aero["modal-btn"]} ${aero["modal-btn-edit"]}`}
                  onClick={() => setEditing(true)}
                >
                  <Pencil size={14} /> Editar publicación
                </button>
              ) : (
                <button
                  type="button"
                  className={`${aero["modal-btn"]} ${aero["modal-btn-message"]}`}
                  onClick={goToMessages}
                >
                  Enviar mensaje
                </button>
              )}
              <button
                type="button"
                className={`${aero["modal-btn"]} ${aero["modal-btn-link"]}`}
                onClick={copyLink}
              >
                Link
              </button>
            </div>

            {/* Baja de la publicacion: solo el dueño, al final del detalle */}
            {isOwnProduct && (
              <div className={aero["modal-danger"]}>
                {confirmingDelete ? (
                  <div className={aero["modal-confirm"]} role="alertdialog" aria-label="Confirmar eliminación">
                    <p className={aero["modal-confirm-text"]}>
                      ¿Eliminar esta publicación? Se va a quitar de Shop in vivo y no se puede deshacer.
                    </p>
                    <div className={aero["modal-confirm-actions"]}>
                      <button
                        type="button"
                        className={`${aero["modal-btn"]} ${aero["modal-btn-ghost"]}`}
                        onClick={() => setConfirmingDelete(false)}
                        disabled={deleting}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className={`${aero["modal-btn"]} ${aero["modal-btn-danger"]}`}
                        onClick={handleDelete}
                        disabled={deleting}
                      >
                        {deleting ? "Eliminando…" : "Sí, eliminar"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`${aero["modal-btn"]} ${aero["modal-btn-delete"]}`}
                    onClick={() => setConfirmingDelete(true)}
                  >
                    <Trash2 size={14} /> Eliminar publicación
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {editing && (
          <EditProductModal
            product={product}
            onClose={() => setEditing(false)}
            onUpdated={(updated) => {
              onUpdated?.(updated);
              showToast("Publicación actualizada", "success");
            }}
          />
        )}

        <Toast toast={toast} />
      </div>
    </div>
  );
}
