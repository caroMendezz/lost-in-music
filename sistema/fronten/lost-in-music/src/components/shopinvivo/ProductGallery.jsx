import React, { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import aero from "../../styles/aero.module.css";

const cx = (...names) => names.filter(Boolean).join(" ");

/**
 * Galeria del detalle de producto: imagen grande + fila de miniaturas.
 *
 * Las flechas solo aparecen si las miniaturas no entran en el ancho disponible:
 *   - al principio solo la derecha, al final solo la izquierda, en el medio las dos.
 * Se recalcula al desplazar la fila y cuando cambia su tamano (ResizeObserver).
 */
export default function ProductGallery({ images = [], title }) {
  const [active, setActive] = useState(0);
  const [scroll, setScroll] = useState({ prev: false, next: false });
  const stripRef = useRef(null);
  const thumbRefs = useRef([]);

  const updateArrows = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const maxScroll = strip.scrollWidth - strip.clientWidth;
    const prev = strip.scrollLeft > 1;
    const next = strip.scrollLeft < maxScroll - 1;
    setScroll((old) => (old.prev === prev && old.next === next ? old : { prev, next }));
  }, []);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return undefined;

    // Se dispara al observar (medicion inicial) y en cada cambio de tamano
    const observer = new ResizeObserver(updateArrows);
    observer.observe(strip);
    if (strip.firstElementChild) observer.observe(strip.firstElementChild);

    strip.addEventListener("scroll", updateArrows, { passive: true });
    return () => {
      observer.disconnect();
      strip.removeEventListener("scroll", updateArrows);
    };
  }, [updateArrows, images.length]);

  // Desplaza solo la fila de miniaturas (no la ventana) para que se vea la elegida
  const revealThumb = (index) => {
    const strip = stripRef.current;
    const thumb = thumbRefs.current[index];
    if (!strip || !thumb) return;

    // Posicion de la miniatura dentro del contenido desplazable de la fila
    const left = thumb.getBoundingClientRect().left - strip.getBoundingClientRect().left + strip.scrollLeft;
    const right = left + thumb.offsetWidth;

    if (left < strip.scrollLeft) {
      strip.scrollTo({ left, behavior: "smooth" });
    } else if (right > strip.scrollLeft + strip.clientWidth) {
      strip.scrollTo({ left: right - strip.clientWidth, behavior: "smooth" });
    }
  };

  const select = (index) => {
    setActive(index);
    revealThumb(index);
  };

  // Las flechas avanzan una "pagina" de miniaturas
  const page = (direction) => {
    const strip = stripRef.current;
    if (!strip) return;
    strip.scrollBy({ left: direction * strip.clientWidth * 0.8, behavior: "smooth" });
  };

  // Flechas del teclado sobre la galeria: imagen anterior / siguiente
  const onKeyDown = (e) => {
    if (images.length < 2) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      select((active + 1) % images.length);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      select((active - 1 + images.length) % images.length);
    }
  };

  const photo = images[active];

  return (
    <div className={aero["gallery"]} onKeyDown={onKeyDown}>
      <div className={aero["gallery-main"]}>
        {photo ? (
          <img
            src={photo}
            alt={`${title} — imagen ${active + 1} de ${images.length}`}
          />
        ) : (
          <span className={aero["gallery-empty"]}>
            <ImageOff size={28} aria-hidden="true" />
            Sin fotos
          </span>
        )}
      </div>

      {images.length > 0 && (
        <div className={aero["gallery-row"]}>
          <div className={aero["gallery-arrow-slot"]}>
            {scroll.prev && (
              <button
                type="button"
                className={aero["gallery-arrow"]}
                onClick={() => page(-1)}
                aria-label="Ver miniaturas anteriores"
              >
                <ChevronLeft size={16} />
              </button>
            )}
          </div>

          <div className={aero["gallery-strip"]} ref={stripRef}>
            <div className={aero["gallery-thumbs"]}>
              {images.map((src, i) => (
                <button
                  type="button"
                  key={`${i}-${src.slice(-24)}`}
                  ref={(el) => (thumbRefs.current[i] = el)}
                  aria-current={i === active ? "true" : undefined}
                  aria-label={`Ver imagen ${i + 1} de ${images.length}`}
                  className={cx(aero["gallery-thumb"], i === active && aero["is-active"])}
                  onClick={() => select(i)}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          </div>

          <div className={aero["gallery-arrow-slot"]}>
            {scroll.next && (
              <button
                type="button"
                className={aero["gallery-arrow"]}
                onClick={() => page(1)}
                aria-label="Ver más miniaturas"
              >
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
