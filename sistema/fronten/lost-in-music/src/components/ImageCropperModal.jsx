import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/ImageCropper.css";

// Resolución final del recorte: cuadrada y con margen de sobra para que se vea
// nítida en cualquier lugar de la app (avatar del header, feed, chat, etc.).
const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

/**
 * Modal para recortar la foto de perfil antes de usarla en el registro.
 *
 * Props:
 *   file       — File de imagen elegido por el usuario
 *   onConfirm  — (dataUrl) => void, recibe la imagen ya recortada (1:1)
 *   onCancel   — () => void, descarta la selección y cierra el modal
 *
 * El recorte es cuadrado: se arrastra la imagen para moverla, se ajusta el zoom
 * con el control, la rueda del mouse o los botones, y se previsualiza el
 * resultado en un círculo antes de aceptar.
 */
export default function ImageCropperModal({ file, onConfirm, onCancel }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [image, setImage] = useState(null);
  const [stageSize, setStageSize] = useState(0);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const stageRef = useRef(null);
  const previewRef = useRef(null);
  const dragRef = useRef(null);

  // Lee el archivo y carga la imagen para conocer sus dimensiones reales
  useEffect(() => {
    if (!file) return undefined;

    let active = true;
    const reader = new FileReader();
    const img = new Image();

    reader.onload = () => {
      if (!active) return;

      const dataUrl = reader.result;
      setImageUrl(dataUrl);

      img.onload = () => {
        if (!active) return;
        setImage(img);
        setZoom(MIN_ZOOM);
        setOffset({ x: 0, y: 0 });
      };

      img.onerror = () => {
        if (active) {
          setLoadError("No pudimos leer la imagen. Probá con otro archivo.");
        }
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      if (active) {
        setLoadError("No pudimos leer la imagen. Probá con otro archivo.");
      }
    };

    reader.readAsDataURL(file);

    return () => {
      active = false;
    };
  }, [file]);

  // Escala que hace que la imagen cubra todo el cuadro con zoom = 1
  const getScale = useCallback(
    (zoomValue) => {
      if (!image || !stageSize) return 1;
      return (stageSize / Math.min(image.naturalWidth, image.naturalHeight)) * zoomValue;
    },
    [image, stageSize]
  );

  const clampOffset = useCallback(
    (next, zoomValue) => {
      if (!image || !stageSize) return next;

      const scale = getScale(zoomValue);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      const maxX = Math.max(0, (width - stageSize) / 2);
      const maxY = Math.max(0, (height - stageSize) / 2);

      return {
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      };
    },
    [getScale, image, stageSize]
  );

  // Encuadre siempre dentro de los límites, incluso si cambia el tamaño del modal
  const safeOffset = clampOffset(offset, zoom);

  // El cuadro del recorte es cuadrado y se adapta al ancho disponible
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const update = () => setStageSize(stage.clientWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(stage);

    return () => observer.disconnect();
  }, []);

  // Cerrar con Esc y bloquear el scroll del fondo
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onCancel?.();
    };

    window.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onCancel]);

  const changeZoom = (nextZoom) => {
    const zoomValue = Number(
      Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom)).toFixed(3)
    );

    setZoom(zoomValue);
    setOffset((previous) => clampOffset(previous, zoomValue));
  };

  const handlePointerDown = (event) => {
    if (!image) return;

    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Algunos navegadores no permiten capturar el puntero sintético
    }
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: safeOffset.x,
      originY: safeOffset.y,
    };
    setDragging(true);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    setOffset(
      clampOffset(
        {
          x: drag.originX + (event.clientX - drag.startX),
          y: drag.originY + (event.clientY - drag.startY),
        },
        zoom
      )
    );
  };

  const endDrag = (event) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
  };

  // Región de la imagen original que entra en el cuadro de recorte
  const getCropRect = useCallback(() => {
    if (!image || !stageSize) return null;

    const scale = getScale(zoom);
    const srcSize = Math.min(
      stageSize / scale,
      image.naturalWidth,
      image.naturalHeight
    );
    const displayedWidth = image.naturalWidth * scale;
    const displayedHeight = image.naturalHeight * scale;

    const rawX = (displayedWidth / 2 - stageSize / 2 - safeOffset.x) / scale;
    const rawY = (displayedHeight / 2 - stageSize / 2 - safeOffset.y) / scale;

    return {
      srcX: Math.min(
        Math.max(0, image.naturalWidth - srcSize),
        Math.max(0, rawX)
      ),
      srcY: Math.min(
        Math.max(0, image.naturalHeight - srcSize),
        Math.max(0, rawY)
      ),
      srcSize,
    };
  }, [getScale, image, safeOffset, stageSize, zoom]);

  // Vista previa circular del resultado
  useEffect(() => {
    const canvas = previewRef.current;
    const crop = getCropRect();
    if (!canvas || !image || !crop) return;

    const context = canvas.getContext("2d");
    const size = canvas.width;

    context.clearRect(0, 0, size, size);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      image,
      crop.srcX,
      crop.srcY,
      crop.srcSize,
      crop.srcSize,
      0,
      0,
      size,
      size
    );
  }, [getCropRect, image]);

  // Genera el recorte definitivo que se envía al formulario
  const handleConfirm = () => {
    const crop = getCropRect();
    if (!image || !crop) return;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const context = canvas.getContext("2d");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    // Fondo blanco: evita bordes negros si el archivo tiene transparencia
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    context.drawImage(
      image,
      crop.srcX,
      crop.srcY,
      crop.srcSize,
      crop.srcSize,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE
    );

    onConfirm?.(canvas.toDataURL("image/jpeg", 0.92));
  };

  const scale = getScale(zoom);

  return createPortal(
    <div className="crop-overlay" role="presentation" onClick={onCancel}>
      <div
        className="crop-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="crop-header">
          <h2 id="crop-title" className="crop-title">
            Ajustá tu foto de perfil
          </h2>
          <button
            type="button"
            className="crop-close"
            onClick={onCancel}
            aria-label="Cancelar y cerrar"
          >
            ✕
          </button>
        </div>

        <div className="crop-body">
          <div className="crop-stage-column">
            <div
              ref={stageRef}
              className={`crop-stage ${dragging ? "crop-stage--dragging" : ""}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onWheel={(event) => changeZoom(zoom - event.deltaY * 0.0015)}
            >
              {image && stageSize ? (
                <img
                  src={imageUrl}
                  alt="Imagen a recortar"
                  className="crop-image"
                  draggable={false}
                  style={{
                    width: `${image.naturalWidth * scale}px`,
                    height: `${image.naturalHeight * scale}px`,
                    left: "50%",
                    top: "50%",
                    transform: `translate(-50%, -50%) translate(${safeOffset.x}px, ${safeOffset.y}px)`,
                  }}
                />
              ) : loadError ? (
                <p className="crop-error">{loadError}</p>
              ) : (
                <div className="crop-loading">Cargando imagen…</div>
              )}

              <div className="crop-grid" aria-hidden="true" />
            </div>

            <p className="crop-hint">
              Arrastrá para mover la imagen y usá el zoom para encuadrarla.
            </p>
          </div>

          <div className="crop-preview-column">
            <span className="crop-preview-label">Vista previa</span>

            <div className="crop-preview-circle">
              <canvas
                ref={previewRef}
                className="crop-preview-canvas"
                width={144}
                height={144}
              />
            </div>

            <div className="crop-zoom">
              <button
                type="button"
                className="crop-zoom-btn"
                onClick={() => changeZoom(zoom - 0.1)}
                aria-label="Alejar imagen"
                disabled={zoom <= MIN_ZOOM}
              >
                −
              </button>

              <input
                type="range"
                className="crop-zoom-range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                onChange={(event) => changeZoom(Number(event.target.value))}
                aria-label="Zoom de la imagen"
              />

              <button
                type="button"
                className="crop-zoom-btn"
                onClick={() => changeZoom(zoom + 0.1)}
                aria-label="Acercar imagen"
                disabled={zoom >= MAX_ZOOM}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="crop-actions">
          <button
            type="button"
            className="crop-btn crop-btn--cancel"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="crop-btn crop-btn--accept"
            onClick={handleConfirm}
            disabled={!image || Boolean(loadError)}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
