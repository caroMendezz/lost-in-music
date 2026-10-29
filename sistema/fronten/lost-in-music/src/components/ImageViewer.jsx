import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../styles/ImageViewer.css';

/**
 * Card (modal) para ver imágenes en grande, con carrusel si hay más de una.
 *
 * Props:
 *   images      — array de URLs ya resueltas
 *   startIndex  — índice con el que se abre
 *   onClose     — () => void
 *
 * Controles: botones ‹ ›, flechas del teclado, Esc para cerrar,
 * miniaturas y deslizar con el dedo en pantallas táctiles.
 */
function ImageViewer({ images = [], startIndex = 0, onClose }) {
  const total = images.length;
  const [index, setIndex] = useState(Math.min(Math.max(startIndex, 0), Math.max(total - 1, 0)));
  const touchStartX = useRef(null);

  const prev = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      else if (e.key === 'ArrowLeft' && total > 1) prev();
      else if (e.key === 'ArrowRight' && total > 1) next();
    };
    window.addEventListener('keydown', onKey);

    // Evita que se scrollee la página de fondo mientras está abierto
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, prev, next, total]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || total < 2) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    if (delta > 0) prev();
    else next();
  };

  if (total === 0) return null;

  return createPortal(
    <div className="imgviewer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="imgviewer-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="imgviewer-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>

        <div
          className="imgviewer-stage"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {total > 1 && (
            <button
              type="button"
              className="imgviewer-nav imgviewer-nav--prev"
              onClick={prev}
              aria-label="Imagen anterior"
            >
              ‹
            </button>
          )}

          <img
            key={images[index]}
            src={images[index]}
            alt={`Imagen ${index + 1} de ${total}`}
            className="imgviewer-img"
            draggable={false}
          />

          {total > 1 && (
            <button
              type="button"
              className="imgviewer-nav imgviewer-nav--next"
              onClick={next}
              aria-label="Imagen siguiente"
            >
              ›
            </button>
          )}
        </div>

        {total > 1 && (
          <div className="imgviewer-footer">
            <span className="imgviewer-counter">
              {index + 1} / {total}
            </span>

            <div className="imgviewer-thumbs">
              {images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  className={`imgviewer-thumb ${i === index ? 'imgviewer-thumb--active' : ''}`}
                  onClick={() => setIndex(i)}
                  aria-label={`Ir a la imagen ${i + 1}`}
                >
                  <img src={src} alt="" draggable={false} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default ImageViewer;