import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { MessageCircle, UserRound } from "lucide-react";
import aero from "../../styles/aero.module.css";

const CLOSE_DELAY_MS = 180; // margen para pasar el puntero del nombre al popover
const GAP = 8;              // separacion entre el nombre y el popover
const EDGE = 8;             // margen minimo contra los bordes del modal

export function SellerAvatar({ seller, size = "md" }) {
  const sellerAvatar = seller?.avatar;
  return (
    <span className={`${aero["seller-avatar"]} ${aero[`seller-avatar-${size}`] || ""}`}>
      {sellerAvatar ? (
        <img src={sellerAvatar} alt="" />
      ) : (
        <UserRound size={size === "lg" ? 26 : 18} aria-hidden="true" />
      )}
    </span>
  );
}

/**
 * Perfil del vendedor (foto + nombre). Al pasar el puntero, hacer clic o
 * enfocarlo con el teclado aparece un popover con "Mensaje" y "Ver perfil".
 *
 * El popover usa position: fixed porque la columna de informacion tiene su
 * propio scroll y lo recortaria. Su posicion se calcula para quedar dentro de
 * la ventana del modal (arriba del nombre si hay lugar, si no abajo).
 */
export default function SellerPopover({ seller, onMessage, onViewProfile }) {
  const sellerName = typeof seller === "string" ? seller : seller.name;
  const sellerAvatar = typeof seller === "string" ? null : seller.avatar;
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const closeTimer = useRef(null);
  const popoverId = useId();

  const show = useCallback(() => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  }, []);

  const hideSoon = useCallback(() => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }, []);

  const hideNow = useCallback(() => {
    clearTimeout(closeTimer.current);
    setOpen(false);
  }, []);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // Ubica el popover (se escribe el estilo directo en el nodo: no hace falta re-renderizar)
  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const pop = popoverRef.current;
    if (!trigger || !pop) return;

    const bounds = (trigger.closest('[role="dialog"]') || document.documentElement).getBoundingClientRect();
    const t = trigger.getBoundingClientRect();
    const { width, height } = pop.getBoundingClientRect();

    let top = t.top - height - GAP;
    if (top < bounds.top + EDGE) top = t.bottom + GAP;
    top = Math.min(top, bounds.bottom - height - EDGE);

    let left = t.left;
    left = Math.min(left, bounds.right - width - EDGE);
    left = Math.max(left, bounds.left + EDGE);

    pop.style.top = `${Math.round(top)}px`;
    pop.style.left = `${Math.round(left)}px`;
    pop.style.visibility = "visible";
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    place();

    // Si se desplaza la columna o cambia el tamano de la ventana, se reubica
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  // Cerrar al hacer clic afuera (cuando se abrio con clic o teclado)
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!wrapperRef.current?.contains(e.target)) hideNow();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, hideNow]);

  const onKeyDown = (e) => {
    if (e.key === "Escape" && open) {
      // Escape cierra primero el popover; el siguiente Escape cierra el modal
      e.stopPropagation();
      hideNow();
      triggerRef.current?.focus();
    }
  };

  // Si el foco sale del bloque (Tab), se cierra
  const onBlur = (e) => {
    if (!wrapperRef.current?.contains(e.relatedTarget)) hideNow();
  };

  const runAction = (action) => {
    hideNow();
    action?.();
  };

  return (
    <div
      ref={wrapperRef}
      className={aero["seller"]}
      onMouseEnter={show}
      onMouseLeave={hideSoon}
      onFocus={show}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    >
      <div className={aero["seller-info"]}>
        <SellerAvatar seller={{ avatar: sellerAvatar }} />
        <div className={aero["seller-copy"]}>
          <span className={aero["seller-label"]}>Información del vendedor</span>
          <button
            ref={triggerRef}
            type="button"
            className={aero["seller-trigger"]}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? popoverId : undefined}
            onClick={show}
          >
            {sellerName}
          </button>
        </div>
      </div>

      {open && (
        <div
          id={popoverId}
          ref={popoverRef}
          role="dialog"
          aria-label={`Perfil de ${sellerName}`}
          className={aero["seller-popover"]}
          style={{ visibility: "hidden" }}
        >
          <div className={aero["seller-popover-head"]}>
            <SellerAvatar seller={{ avatar: sellerAvatar }} size="lg" />
            <span className={aero["seller-popover-name"]}>{sellerName}</span>
          </div>
          <div className={aero["seller-popover-actions"]}>
            <button
              type="button"
              className={aero["seller-popover-btn"]}
              onClick={() => runAction(onMessage)}
            >
              <MessageCircle size={14} aria-hidden="true" /> Mensaje
            </button>
            <button
              type="button"
              className={aero["seller-popover-btn"]}
              onClick={() => runAction(onViewProfile)}
            >
              <UserRound size={14} aria-hidden="true" /> Ver perfil
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
